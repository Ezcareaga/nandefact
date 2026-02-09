package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.FacturaRepository
import py.gov.nandefact.shared.domain.Factura

class GetFacturasUseCase(
    private val facturaRepository: FacturaRepository,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): List<Factura> {
        val comercioId = authRepository.getComercioId() ?: return emptyList()
        return facturaRepository.getAll(comercioId)
    }
}
