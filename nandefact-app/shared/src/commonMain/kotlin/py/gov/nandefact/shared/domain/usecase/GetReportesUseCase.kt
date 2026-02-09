package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.model.PeriodFilter
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.FacturaPort

data class ReportesData(
    val totalVentas: Long,
    val cantidadFacturas: Int,
    val totalIva10: Long,
    val totalIva5: Long,
    val totalExenta: Long,
    val topProductos: List<TopProductoData>
)

data class TopProductoData(
    val nombre: String,
    val cantidad: Int,
    val total: Long
)

class GetReportesUseCase(
    private val facturas: FacturaPort,
    private val auth: AuthPort
) {
    suspend operator fun invoke(period: PeriodFilter = PeriodFilter.TODO): ReportesData {
        val comercioId = auth.getComercioId()
            ?: return ReportesData(0, 0, 0, 0, 0, emptyList())

        val allFacturas = facturas.getAll(comercioId)

        // Filtrar por periodo usando createdAt (formato ISO: "YYYY-MM-DDThh:mm:ss")
        val cutoff = calculateCutoff(period)
        val filtered = if (cutoff.isEmpty()) allFacturas
            else allFacturas.filter { it.createdAt >= cutoff }

        val totalVentas = filtered.sumOf { it.totalBruto }
        val totalIva10 = filtered.sumOf { it.totalIva10 }
        val totalIva5 = filtered.sumOf { it.totalIva5 }
        val totalExenta = filtered.sumOf { it.totalExenta }

        // Top productos por detalles
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
            .take(10)
            .map { TopProductoData(it.key, it.value.first, it.value.second) }

        return ReportesData(
            totalVentas = totalVentas,
            cantidadFacturas = filtered.size,
            totalIva10 = totalIva10,
            totalIva5 = totalIva5,
            totalExenta = totalExenta,
            topProductos = topProductos
        )
    }

    private fun calculateCutoff(period: PeriodFilter): String {
        if (period == PeriodFilter.TODO) return ""
        // Obtener fecha actual del sistema como ISO string para comparación
        val now = kotlinx.datetime.Clock.System.now()
        val today = now.toLocalDateTime(kotlinx.datetime.TimeZone.currentSystemDefault()).date
        val cutoffDate = when (period) {
            PeriodFilter.HOY -> today
            PeriodFilter.SEMANA -> today.minus(kotlinx.datetime.DatePeriod(days = 7))
            PeriodFilter.MES -> today.minus(kotlinx.datetime.DatePeriod(months = 1))
            PeriodFilter.TODO -> today // No alcanzado, cubierto arriba
        }
        return "${cutoffDate}T00:00:00"
    }
}
