package py.gov.nandefact.shared.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null
)

@Serializable
data class ApiError(
    val code: String,
    val message: String
)

@Serializable
data class LoginRequest(
    val telefono: String,
    val pin: String
)

@Serializable
data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String,
    val nombre: String,
    val telefono: String,
    val rol: String,
    val comercio: ComercioDto
)

@Serializable
data class ComercioDto(
    val id: String,
    val nombre: String,
    val ruc: String,
    val razonSocial: String,
    val nombreFantasia: String? = null,
    val establecimiento: String,
    val puntoExpedicion: String,
    val timbrado: String? = null,
    val timbradoFechaInicio: String? = null,
    val timbradoFechaFin: String? = null
)

@Serializable
data class ProductoDto(
    val id: String,
    val comercioId: String,
    val nombre: String,
    val codigo: String? = null,
    val precioUnitario: Long,
    val unidadMedida: String,
    val ivaTipo: String, // "10%", "5%", "exenta"
    val categoria: String? = null,
    val activo: Boolean = true,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class ClienteDto(
    val id: String,
    val comercioId: String,
    val nombre: String,
    val rucCi: String? = null,
    val tipoDocumento: String,
    val telefono: String? = null,
    val email: String? = null,
    val enviarWhatsapp: Boolean = true,
    val frecuente: Boolean = false,
    val createdAt: String? = null
)

@Serializable
data class FacturaRequest(
    val clienteId: String? = null,
    val clienteNombre: String? = null,
    val items: List<FacturaItemRequest>,
    val condicionPago: String = "contado",
    val tipoDocumento: Int = 1
)

@Serializable
data class FacturaItemRequest(
    val productoId: String? = null,
    val descripcion: String,
    val cantidad: Long,
    val precioUnitario: Long,
    val ivaTasa: Int
)

@Serializable
data class FacturaDto(
    val id: String,
    val comercioId: String,
    val cdc: String? = null,
    val numero: Long? = null,
    val clienteNombre: String? = null,
    val totalBruto: Long,
    val totalIva10: Long = 0,
    val totalIva5: Long = 0,
    val totalExenta: Long = 0,
    val totalIva: Long = 0,
    val estadoSifen: String,
    val condicionPago: String,
    val createdAt: String
)

@Serializable
data class PaginatedResponse<T>(
    val data: List<T>,
    val total: Int,
    val page: Int,
    val limit: Int
)
