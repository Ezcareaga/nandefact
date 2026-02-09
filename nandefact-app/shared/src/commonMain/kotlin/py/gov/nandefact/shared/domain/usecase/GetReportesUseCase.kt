package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.FacturaRepository
import py.gov.nandefact.shared.domain.MontoIVA

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
    private val facturaRepository: FacturaRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): ReportesData {
        val comercioId = authRepository.getComercioId()
            ?: return ReportesData(0, 0, 0, 0, 0, emptyList())

        val facturas = facturaRepository.getAll(comercioId)

        val totalVentas = facturas.sumOf { it.totalBruto }
        val totalIva10 = facturas.sumOf { it.totalIva10 }
        val totalIva5 = facturas.sumOf { it.totalIva5 }
        val totalExenta = facturas.sumOf { it.totalExenta }

        // Top productos por detalles
        val productoCounts = mutableMapOf<String, Pair<Int, Long>>()
        facturas.forEach { factura ->
            val detalles = facturaRepository.getDetalles(factura.id)
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
            cantidadFacturas = facturas.size,
            totalIva10 = totalIva10,
            totalIva5 = totalIva5,
            totalExenta = totalExenta,
            topProductos = topProductos
        )
    }
}
