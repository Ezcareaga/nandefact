package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.FacturaPort

class GetFacturasUseCase(
    private val facturas: FacturaPort,
    private val auth: AuthPort
) {
    suspend operator fun invoke(): List<Factura> {
        val comercioId = auth.getComercioId() ?: return emptyList()
        return facturas.getAll(comercioId)
    }
}
