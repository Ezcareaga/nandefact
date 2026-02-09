package py.gov.nandefact.shared.domain

import kotlinx.serialization.Serializable

@Serializable
data class Cliente(
    val id: String,
    val comercioId: String,
    val nombre: String,
    val rucCi: String? = null,
    val tipoDocumento: String, // CI, RUC, pasaporte, innominado
    val telefono: String? = null,
    val email: String? = null,
    val enviarWhatsApp: Boolean = true,
    val frecuente: Boolean = false,
    val createdAt: String = ""
)
