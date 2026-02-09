package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.FacturaRepository

data class HomeData(
    val comercioName: String,
    val userName: String,
    val pendingCount: Long,
    val lastSaleAmount: Long?,
    val lastSaleTime: String?
)

class GetHomeDataUseCase(
    private val authRepository: AuthRepository,
    private val facturaRepository: FacturaRepository
) {
    suspend operator fun invoke(): HomeData {
        val comercioId = authRepository.getComercioId() ?: return HomeData(
            comercioName = authRepository.getComercioName(),
            userName = authRepository.getUserName(),
            pendingCount = 0,
            lastSaleAmount = null,
            lastSaleTime = null
        )

        val pendingCount = facturaRepository.countPendientes(comercioId)
        val lastFactura = facturaRepository.getLastFactura(comercioId)

        return HomeData(
            comercioName = authRepository.getComercioName(),
            userName = authRepository.getUserName(),
            pendingCount = pendingCount,
            lastSaleAmount = lastFactura?.totalBruto,
            lastSaleTime = lastFactura?.createdAt
        )
    }
}
