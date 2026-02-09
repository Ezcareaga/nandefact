package py.gov.nandefact.shared.sync

import kotlinx.datetime.Clock
import py.gov.nandefact.shared.data.remote.SyncApi
import py.gov.nandefact.shared.data.remote.SyncFacturaPayload
import py.gov.nandefact.shared.data.remote.SyncPushRequest
import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.model.SyncResult
import py.gov.nandefact.shared.domain.ports.FacturaPort
import py.gov.nandefact.shared.domain.ports.SyncPort

/**
 * Motor de sincronizacion offline-first.
 * Implementa SyncPort para que domain/ pueda usarlo via interface.
 */
class SyncManager(
    private val facturas: FacturaPort,
    private val syncApi: SyncApi
) : SyncPort {

    override suspend fun pushFactura(factura: Factura): Result<Unit> {
        return try {
            val payload = SyncFacturaPayload(
                syncId = factura.id,
                facturaData = factura.cdc ?: factura.id
            )
            val response = syncApi.push(SyncPushRequest(listOf(payload)))
            if (response.success) {
                facturas.updateEstado(
                    facturaId = factura.id,
                    estado = "enviado",
                    respuesta = null,
                    syncedAt = Clock.System.now().toString()
                )
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.error?.message ?: "Error desconocido"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun syncPendientes(comercioId: String): SyncResult {
        val pendientes = facturas.getPendientes(comercioId)
        if (pendientes.isEmpty()) return SyncResult(0, 0, 0)

        var synced = 0
        var failed = 0

        // Procesar en orden FIFO
        pendientes.forEach { factura ->
            pushFactura(factura).fold(
                onSuccess = { synced++ },
                onFailure = { failed++ }
            )
        }

        return SyncResult(
            total = pendientes.size,
            synced = synced,
            failed = failed
        )
    }
}
