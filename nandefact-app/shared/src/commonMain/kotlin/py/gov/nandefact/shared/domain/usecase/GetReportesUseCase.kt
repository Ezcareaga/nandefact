package py.gov.nandefact.shared.domain.usecase

import kotlinx.datetime.Clock
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import kotlinx.datetime.toLocalDateTime
import py.gov.nandefact.shared.domain.model.PeriodFilter
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.FacturaPort

data class TopProductoData(
    val nombre: String,
    val cantidad: Int,
    val total: Long
)

data class ClienteAgregado(
    val clienteNombre: String,
    val compraCount: Int,
    val totalAmount: Long
)

data class HourlySlot(
    val label: String,
    val startHour: Int,
    val endHour: Int,
    val count: Int
)

data class ReportesData(
    val totalVentas: Long,
    val cantidadFacturas: Int,
    val totalIva10: Long,
    val totalIva5: Long,
    val totalExenta: Long,
    val topProductos: List<TopProductoData>,
    val prevTotalVentas: Long,
    val prevCantidadFacturas: Int,
    val bottomProductos: List<TopProductoData>,
    val clientesFrecuentes: List<ClienteAgregado>,
    val hourlyDistribution: List<HourlySlot>,
    val facturasAnuladas: Int
)

class GetReportesUseCase(
    private val facturas: FacturaPort,
    private val auth: AuthPort
) {
    suspend operator fun invoke(period: PeriodFilter = PeriodFilter.TODO): ReportesData {
        val comercioId = auth.getComercioId()
            ?: return emptyReportesData()

        val allFacturas = facturas.getAll(comercioId)

        // Filtrar por periodo actual
        val cutoff = calculateCutoff(period)
        val filtered = if (cutoff.isEmpty()) allFacturas
            else allFacturas.filter { it.createdAt >= cutoff }

        val totalVentas = filtered.sumOf { it.totalBruto }
        val totalIva10 = filtered.sumOf { it.totalIva10 }
        val totalIva5 = filtered.sumOf { it.totalIva5 }
        val totalExenta = filtered.sumOf { it.totalExenta }

        // Periodo anterior para comparación
        val prevCutoffs = calculatePrevCutoffs(period)
        val prevFiltered = if (prevCutoffs == null) emptyList()
            else allFacturas.filter { it.createdAt >= prevCutoffs.first && it.createdAt < prevCutoffs.second }
        val prevTotalVentas = prevFiltered.sumOf { it.totalBruto }

        // Productos: acumular por descripción
        val productoCounts = mutableMapOf<String, Pair<Int, Long>>()
        filtered.forEach { factura ->
            val detalles = facturas.getDetalles(factura.id)
            detalles.forEach { detalle ->
                val key = detalle.descripcion
                val current = productoCounts[key] ?: Pair(0, 0L)
                productoCounts[key] = Pair(
                    current.first + detalle.cantidad.toInt(),
                    current.second + detalle.subtotal
                )
            }
        }

        val topProductos = productoCounts.entries
            .sortedByDescending { it.value.second }
            .take(5)
            .map { TopProductoData(it.key, it.value.first, it.value.second) }

        val bottomProductos = productoCounts.entries
            .sortedBy { it.value.second }
            .take(5)
            .map { TopProductoData(it.key, it.value.first, it.value.second) }

        // Clientes frecuentes: agrupar por nombre, excluir innominados
        val excludedNames = setOf("consumidor final", "innominado", "sin nombre")
        val clienteAgg = mutableMapOf<String, Pair<Int, Long>>()
        filtered.forEach { factura ->
            val nombre = factura.clienteNombre?.trim()
            if (!nombre.isNullOrBlank() && nombre.lowercase() !in excludedNames) {
                val current = clienteAgg[nombre] ?: Pair(0, 0L)
                clienteAgg[nombre] = Pair(current.first + 1, current.second + factura.totalBruto)
            }
        }
        val clientesFrecuentes = clienteAgg.entries
            .sortedByDescending { it.value.second }
            .take(5)
            .map { ClienteAgregado(it.key, it.value.first, it.value.second) }

        // Distribución horaria: 8 franjas de 2 horas (6-22)
        val hourlyCounts = IntArray(8)
        filtered.forEach { factura ->
            val hour = parseHour(factura.createdAt)
            if (hour != null) {
                val slotIndex = ((hour - 6).coerceIn(0, 15)) / 2
                hourlyCounts[slotIndex.coerceIn(0, 7)]++
            }
        }
        val hourlySlots = listOf("6-8", "8-10", "10-12", "12-14", "14-16", "16-18", "18-20", "20-22")
        val hourlyDistribution = hourlySlots.mapIndexed { i, label ->
            val startHour = 6 + i * 2
            HourlySlot(label, startHour, startHour + 2, hourlyCounts[i])
        }

        // Facturas anuladas
        val facturasAnuladas = filtered.count {
            it.estadoSifen == "anulado" || it.estadoSifen == "cancelado"
        }

        return ReportesData(
            totalVentas = totalVentas,
            cantidadFacturas = filtered.size,
            totalIva10 = totalIva10,
            totalIva5 = totalIva5,
            totalExenta = totalExenta,
            topProductos = topProductos,
            prevTotalVentas = prevTotalVentas,
            prevCantidadFacturas = prevFiltered.size,
            bottomProductos = bottomProductos,
            clientesFrecuentes = clientesFrecuentes,
            hourlyDistribution = hourlyDistribution,
            facturasAnuladas = facturasAnuladas
        )
    }

    private fun calculateCutoff(period: PeriodFilter): String {
        if (period == PeriodFilter.TODO) return ""
        val now = Clock.System.now()
        val today = now.toLocalDateTime(TimeZone.currentSystemDefault()).date
        val cutoffDate = when (period) {
            PeriodFilter.HOY -> today
            PeriodFilter.SEMANA -> today.minus(DatePeriod(days = 7))
            PeriodFilter.MES -> today.minus(DatePeriod(months = 1))
            PeriodFilter.TODO -> today
        }
        return "${cutoffDate}T00:00:00"
    }

    /** Retorna par (inicio, fin) del periodo anterior para comparación porcentual */
    private fun calculatePrevCutoffs(period: PeriodFilter): Pair<String, String>? {
        if (period == PeriodFilter.TODO) return null
        val now = Clock.System.now()
        val today = now.toLocalDateTime(TimeZone.currentSystemDefault()).date
        return when (period) {
            PeriodFilter.HOY -> {
                val yesterday = today.minus(DatePeriod(days = 1))
                Pair("${yesterday}T00:00:00", "${today}T00:00:00")
            }
            PeriodFilter.SEMANA -> {
                val weekAgo = today.minus(DatePeriod(days = 7))
                val twoWeeksAgo = today.minus(DatePeriod(days = 14))
                Pair("${twoWeeksAgo}T00:00:00", "${weekAgo}T00:00:00")
            }
            PeriodFilter.MES -> {
                val monthAgo = today.minus(DatePeriod(months = 1))
                val twoMonthsAgo = today.minus(DatePeriod(months = 2))
                Pair("${twoMonthsAgo}T00:00:00", "${monthAgo}T00:00:00")
            }
            PeriodFilter.TODO -> null
        }
    }

    /** Extrae la hora de un string ISO: "2025-01-15T14:30:00" → 14 */
    private fun parseHour(isoDate: String): Int? {
        if (isoDate.length < 13) return null
        return isoDate.substring(11, 13).toIntOrNull()
    }

    private fun emptyReportesData() = ReportesData(
        totalVentas = 0, cantidadFacturas = 0,
        totalIva10 = 0, totalIva5 = 0, totalExenta = 0,
        topProductos = emptyList(),
        prevTotalVentas = 0, prevCantidadFacturas = 0,
        bottomProductos = emptyList(),
        clientesFrecuentes = emptyList(),
        hourlyDistribution = (0..7).map { i ->
            val startHour = 6 + i * 2
            HourlySlot("${startHour}-${startHour + 2}", startHour, startHour + 2, 0)
        },
        facturasAnuladas = 0
    )
}
