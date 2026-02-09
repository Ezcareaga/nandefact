package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.ProductoRepository
import py.gov.nandefact.shared.domain.Producto

class GetProductosUseCase(
    private val productoRepository: ProductoRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(query: String = ""): List<Producto> {
        val comercioId = authRepository.getComercioId() ?: return emptyList()
        return if (query.isBlank()) {
            productoRepository.getAll(comercioId)
        } else {
            productoRepository.search(comercioId, query)
        }
    }
}
