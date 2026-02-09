package py.gov.nandefact.shared.domain

import kotlinx.serialization.Serializable

@Serializable
data class Producto(
    val id: String,
    val comercioId: String,
    val nombre: String,
    val codigo: String? = null,
    val precioUnitario: Long,
    val unidadMedida: String,
    val tasaIva: Int, // 10, 5, o 0
    val categoria: String? = null,
    val activo: Boolean = true,
    val createdAt: String = "",
    val updatedAt: String = ""
)
