package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.Producto
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.ProductoPort

class GetProductosUseCase(
    private val productos: ProductoPort,
    private val auth: AuthPort
) {
    suspend operator fun invoke(query: String = ""): List<Producto> {
        val comercioId = auth.getComercioId() ?: return emptyList()
        return if (query.isBlank()) {
            productos.getAll(comercioId)
        } else {
            productos.search(comercioId, query)
        }
    }
}
