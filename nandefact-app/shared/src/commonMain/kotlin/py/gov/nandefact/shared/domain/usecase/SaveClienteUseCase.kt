package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.remote.ClienteApi
import py.gov.nandefact.shared.data.remote.ClienteDto
import py.gov.nandefact.shared.data.repository.AuthRepository

data class ClienteInput(
    val id: String? = null,
    val nombre: String,
    val tipoDocumento: String,
    val rucCi: String? = null,
    val telefono: String? = null,
    val email: String? = null,
    val enviarWhatsApp: Boolean = true
)

class SaveClienteUseCase(
    private val clienteApi: ClienteApi,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(input: ClienteInput): Result<Unit> {
        if (input.nombre.isBlank()) {
            return Result.failure(IllegalArgumentException("Nombre es obligatorio"))
        }

        val comercioId = authRepository.getComercioId()
            ?: return Result.failure(IllegalStateException("Sin comercio autenticado"))

        val dto = ClienteDto(
            id = input.id ?: "",
            comercioId = comercioId,
            nombre = input.nombre,
            rucCi = input.rucCi,
            tipoDocumento = input.tipoDocumento,
            telefono = input.telefono,
            email = input.email,
            enviarWhatsapp = input.enviarWhatsApp,
            createdAt = null
        )

        return try {
            val response = if (input.id != null) {
                clienteApi.update(input.id, dto)
            } else {
                clienteApi.create(dto)
            }
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.error?.message ?: "Error guardando cliente"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
