package py.gov.nandefact.shared.domain.ports

import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.model.SyncResult

/** Puerto: contrato para sincronizacion con backend */
interface SyncPort {
    suspend fun pushFactura(factura: Factura): Result<Unit>
    suspend fun syncPendientes(comercioId: String): SyncResult
}
