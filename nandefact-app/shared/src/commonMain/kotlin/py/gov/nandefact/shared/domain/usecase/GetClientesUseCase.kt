package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.ClienteRepository
import py.gov.nandefact.shared.domain.Cliente

class GetClientesUseCase(
    private val clienteRepository: ClienteRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(query: String = ""): List<Cliente> {
        val comercioId = authRepository.getComercioId() ?: return emptyList()
        return if (query.isBlank()) {
            clienteRepository.getAll(comercioId)
        } else {
            clienteRepository.search(comercioId, query)
        }
    }
}
