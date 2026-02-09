package py.gov.nandefact.shared.domain

import kotlinx.serialization.Serializable

@Serializable
data class Factura(
    val id: String,
    val comercioId: String,
    val usuarioId: String? = null,
    val clienteId: String? = null,
    val clienteNombre: String? = null,
    val cdc: String? = null,
    val numero: String? = null,
    val tipoDocumento: Int = 1,
    val establecimiento: String? = null,
    val puntoExpedicion: String? = null,
    val condicionPago: String = "contado",
    val totalBruto: Long,
    val totalIva10: Long = 0,
    val totalIva5: Long = 0,
    val totalExenta: Long = 0,
    val totalIva: Long = 0,
    val totalNeto: Long = 0,
    val estadoSifen: String = "pendiente",
    val sifenRespuesta: String? = null,
    val whatsappEnviado: Boolean = false,
    val kudePdfPath: String? = null,
    val createdOffline: Boolean = false,
    val createdAt: String = "",
    val syncedAt: String? = null
)

@Serializable
data class ItemFactura(
    val id: String,
    val facturaId: String,
    val productoId: String? = null,
    val descripcion: String,
    val cantidad: Long,
    val precioUnitario: Long,
    val subtotal: Long,
    val ivaTasa: Int,
    val ivaBase: Long = 0,
    val ivaMonto: Long = 0
)
