package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.FacturaRepository
import py.gov.nandefact.shared.domain.CDC
import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.ItemFactura
import py.gov.nandefact.shared.domain.MontoIVA
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

data class ItemInput(
    val productoId: String?,
    val descripcion: String,
    val cantidad: Long,
    val precioUnitario: Long,
    val tasaIva: Int
)

data class FacturaInput(
    val clienteId: String?,
    val clienteNombre: String?,
    val items: List<ItemInput>,
    val condicionPago: String = "contado"
)

class CrearFacturaLocalUseCase(
    private val facturaRepository: FacturaRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(input: FacturaInput): Result<Factura> {
        if (input.items.isEmpty()) {
            return Result.failure(IllegalArgumentException("Debe tener al menos 1 item"))
        }

        val comercioId = authRepository.getComercioId()
            ?: return Result.failure(IllegalStateException("Sin comercio autenticado"))

        val now = Clock.System.now()
        val localDate = now.toLocalDateTime(TimeZone.currentSystemDefault())
        val fechaEmision = "${localDate.year}" +
            "${localDate.monthNumber.toString().padStart(2, '0')}" +
            "${localDate.dayOfMonth.toString().padStart(2, '0')}"

        val facturaId = generateUUID()
        val numero = now.toEpochMilliseconds() % 10_000_000 // Correlativo temporal

        // Generar CDC
        val cdc = CDC.generar(
            tipoDocumento = 1,
            ruc = "80069563",
            dvRuc = 1,
            establecimiento = "001",
            puntoExpedicion = "001",
            numero = numero,
            tipoContribuyente = 1,
            fechaEmision = fechaEmision,
            tipoEmision = 1
        )

        // Calcular items con IVA
        val itemsFactura = input.items.mapIndexed { index, item ->
            val subtotal = item.cantidad * item.precioUnitario
            val iva = MontoIVA.calcular(subtotal, item.tasaIva)
            ItemFactura(
                id = "${facturaId}_$index",
                facturaId = facturaId,
                productoId = item.productoId,
                descripcion = item.descripcion,
                cantidad = item.cantidad,
                precioUnitario = item.precioUnitario,
                subtotal = subtotal,
                ivaTasa = item.tasaIva,
                ivaBase = iva.baseGravada,
                ivaMonto = iva.montoIva
            )
        }

        // Calcular totales
        val totalBruto = itemsFactura.sumOf { it.subtotal }
        val totalIva10 = itemsFactura.filter { it.ivaTasa == 10 }.sumOf { it.ivaMonto }
        val totalIva5 = itemsFactura.filter { it.ivaTasa == 5 }.sumOf { it.ivaMonto }
        val totalExenta = itemsFactura.filter { it.ivaTasa == 0 }.sumOf { it.subtotal }
        val totalIva = totalIva10 + totalIva5

        val factura = Factura(
            id = facturaId,
            comercioId = comercioId,
            clienteId = input.clienteId,
            clienteNombre = input.clienteNombre,
            cdc = cdc,
            numero = "001-001-${numero.toString().padStart(7, '0')}",
            tipoDocumento = 1,
            establecimiento = "001",
            puntoExpedicion = "001",
            condicionPago = input.condicionPago,
            totalBruto = totalBruto,
            totalIva10 = totalIva10,
            totalIva5 = totalIva5,
            totalExenta = totalExenta,
            totalIva = totalIva,
            totalNeto = totalBruto,
            estadoSifen = "pendiente",
            createdOffline = true,
            createdAt = now.toString()
        )

        facturaRepository.createLocal(factura, itemsFactura)
        return Result.success(factura)
    }
}

// Generador UUID multiplataforma simple
private fun generateUUID(): String {
    val chars = "0123456789abcdef"
    val sections = listOf(8, 4, 4, 4, 12)
    return sections.joinToString("-") { length ->
        (1..length).map { chars.random() }.joinToString("")
    }
}
