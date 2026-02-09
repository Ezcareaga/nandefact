package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.model.SyncResult
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.SyncPort

class SyncPendientesUseCase(
    private val sync: SyncPort,
    private val auth: AuthPort
) {
    suspend operator fun invoke(): SyncResult {
        val comercioId = auth.getComercioId()
            ?: return SyncResult(0, 0, 0)
        return sync.syncPendientes(comercioId)
    }
}
