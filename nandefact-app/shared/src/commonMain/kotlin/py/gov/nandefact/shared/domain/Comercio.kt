package py.gov.nandefact.shared.domain

import kotlinx.serialization.Serializable

@Serializable
data class Comercio(
    val id: String,
    val nombre: String,
    val ruc: String,
    val razonSocial: String,
    val nombreFantasia: String? = null,
    val establecimiento: String,
    val puntoExpedicion: String,
    val timbrado: String? = null,
    val timbradoFechaInicio: String? = null,
    val timbradoFechaFin: String? = null,
    val direccion: String? = null,
    val telefono: String? = null,
    val email: String? = null,
    val activo: Boolean = true
)

@Serializable
data class Usuario(
    val id: String,
    val comercioId: String,
    val nombre: String,
    val telefono: String,
    val rol: String // dueño, empleado
)
