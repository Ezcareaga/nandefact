package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.FacturaRepository
import py.gov.nandefact.shared.domain.Factura

class GetPendientesUseCase(
    private val facturaRepository: FacturaRepository,
    private val authRepository: AuthRepository
) {
    /** Retorna facturas pendientes en orden FIFO (createdAt ASC) */
    suspend operator fun invoke(): List<Factura> {
        val comercioId = authRepository.getComercioId() ?: return emptyList()
        return facturaRepository.getPendientes(comercioId)
    }
}
