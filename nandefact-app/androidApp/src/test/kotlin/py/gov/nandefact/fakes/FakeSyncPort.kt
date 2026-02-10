package py.gov.nandefact.fakes

import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.model.SyncResult
import py.gov.nandefact.shared.domain.ports.SyncPort

class FakeSyncPort(
    var syncResult: SyncResult = SyncResult(total = 0, synced = 0, failed = 0),
    var pushResult: Result<Unit> = Result.success(Unit)
) : SyncPort {

    var syncCalled = false
        private set
    var pushCalled = false
        private set

    override suspend fun pushFactura(factura: Factura): Result<Unit> {
        pushCalled = true
        return pushResult
    }

    override suspend fun syncPendientes(comercioId: String): SyncResult {
        syncCalled = true
        return syncResult
    }
}
