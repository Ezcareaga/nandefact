package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.Cliente
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.ClientePort

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
    private val clientes: ClientePort,
    private val auth: AuthPort
) {
    suspend operator fun invoke(input: ClienteInput): Result<Unit> {
        if (input.nombre.isBlank()) {
            return Result.failure(IllegalArgumentException("Nombre es obligatorio"))
        }

        val comercioId = auth.getComercioId()
            ?: return Result.failure(IllegalStateException("Sin comercio autenticado"))

        val cliente = Cliente(
            id = input.id ?: "",
            comercioId = comercioId,
            nombre = input.nombre,
            rucCi = input.rucCi,
            tipoDocumento = input.tipoDocumento,
            telefono = input.telefono,
            email = input.email,
            enviarWhatsApp = input.enviarWhatsApp
        )

        return clientes.save(cliente)
    }
}
