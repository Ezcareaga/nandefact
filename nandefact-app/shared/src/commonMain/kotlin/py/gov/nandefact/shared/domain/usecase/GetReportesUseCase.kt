package py.gov.nandefact.shared.domain.usecase

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
    suspend operator fun invoke(): ReportesData {
        val comercioId = auth.getComercioId()
            ?: return ReportesData(0, 0, 0, 0, 0, emptyList())

        val allFacturas = facturas.getAll(comercioId)

        val totalVentas = allFacturas.sumOf { it.totalBruto }
        val totalIva10 = allFacturas.sumOf { it.totalIva10 }
        val totalIva5 = allFacturas.sumOf { it.totalIva5 }
        val totalExenta = allFacturas.sumOf { it.totalExenta }

        // Top productos por detalles
        val productoCounts = mutableMapOf<String, Pair<Int, Long>>()
        allFacturas.forEach { factura ->
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

        return ReportesData(
            totalVentas = totalVentas,
            cantidadFacturas = allFacturas.size,
            totalIva10 = totalIva10,
            totalIva5 = totalIva5,
            totalExenta = totalExenta,
            topProductos = topProductos
        )
    }
}
