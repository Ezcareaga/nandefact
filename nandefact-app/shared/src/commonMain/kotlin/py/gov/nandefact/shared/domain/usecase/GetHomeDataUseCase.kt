package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.FacturaPort

data class HomeData(
    val comercioName: String,
    val userName: String,
    val pendingCount: Long,
    val lastSaleAmount: Long?,
    val lastSaleTime: String?
)

class GetHomeDataUseCase(
    private val auth: AuthPort,
    private val facturas: FacturaPort
) {
    suspend operator fun invoke(): HomeData {
        val comercioId = auth.getComercioId() ?: return HomeData(
            comercioName = auth.getComercioName(),
            userName = auth.getUserName(),
            pendingCount = 0,
            lastSaleAmount = null,
            lastSaleTime = null
        )

        val pendingCount = facturas.countPendientes(comercioId)
        val lastFactura = facturas.getLastFactura(comercioId)

        return HomeData(
            comercioName = auth.getComercioName(),
            userName = auth.getUserName(),
            pendingCount = pendingCount,
            lastSaleAmount = lastFactura?.totalBruto,
            lastSaleTime = lastFactura?.createdAt
        )
    }
}
