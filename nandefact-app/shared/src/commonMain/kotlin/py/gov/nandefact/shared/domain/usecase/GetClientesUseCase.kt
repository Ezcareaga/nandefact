package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.Cliente
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.ClientePort

class GetClientesUseCase(
    private val clientes: ClientePort,
    private val auth: AuthPort
) {
    suspend operator fun invoke(query: String = ""): List<Cliente> {
        val comercioId = auth.getComercioId() ?: return emptyList()
        return if (query.isBlank()) {
            clientes.getAll(comercioId)
        } else {
            clientes.search(comercioId, query)
        }
    }
}
