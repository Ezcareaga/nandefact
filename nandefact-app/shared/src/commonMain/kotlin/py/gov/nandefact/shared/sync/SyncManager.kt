package py.gov.nandefact.shared.sync

import kotlinx.datetime.Clock
import py.gov.nandefact.shared.data.remote.SyncApi
import py.gov.nandefact.shared.data.remote.SyncFacturaPayload
import py.gov.nandefact.shared.data.remote.SyncPushRequest
import py.gov.nandefact.shared.data.repository.FacturaRepository
import py.gov.nandefact.shared.db.NandefactDatabase

/**
 * Motor de sincronizacion offline-first.
 * Lee SyncQueue pendientes ordenados por createdAt ASC (FIFO).
 * Para cada uno: llama SyncApi.pushFactura().
 * Si exito: actualiza estado a 'completado'.
 * Si error: incrementa intentos, guarda error, calcula proximo intento (backoff).
 */
class SyncManager(
    private val facturaRepository: FacturaRepository,
    private val syncApi: SyncApi,
    private val database: NandefactDatabase
) {
    private val syncQueries = database.syncQueueQueries

    /** Sincroniza facturas pendientes con el backend */
    suspend fun syncPendientes(comercioId: String): SyncResult {
        val pendientes = facturaRepository.getPendientes(comercioId)
        if (pendientes.isEmpty()) return SyncResult(0, 0, 0)

        var synced = 0
        var failed = 0

        // Procesar en orden FIFO
        pendientes.forEach { factura ->
            try {
                val payload = SyncFacturaPayload(
                    syncId = factura.id,
                    facturaData = factura.cdc ?: factura.id
                )
                val response = syncApi.push(SyncPushRequest(listOf(payload)))
                if (response.success) {
                    // Actualizar estado factura
                    facturaRepository.updateEstado(
                        facturaId = factura.id,
                        estado = "enviado",
                        respuesta = null,
                        syncedAt = Clock.System.now().toString()
                    )
                    // Marcar en SyncQueue como completado
                    syncQueries.updateEstado(
                        estado = "completado",
                        processedAt = Clock.System.now().toString(),
                        id = factura.id
                    )
                    synced++
                } else {
                    // Registrar error con backoff
                    val errorMsg = response.error?.message ?: "Error desconocido"
                    syncQueries.updateError(
                        ultimoError = errorMsg,
                        proximoIntento = calculateNextRetry(1),
                        id = factura.id
                    )
                    failed++
                }
            } catch (e: Exception) {
                // Si falla una, seguir con las demas
                syncQueries.updateError(
                    ultimoError = e.message ?: "Error de red",
                    proximoIntento = calculateNextRetry(1),
                    id = factura.id
                )
                failed++
            }
        }

        return SyncResult(
            total = pendientes.size,
            synced = synced,
            failed = failed
        )
    }

    fun hasPendientes(comercioId: String): Boolean {
        return facturaRepository.countPendientes(comercioId) > 0
    }

    fun countPendientes(comercioId: String): Long {
        return facturaRepository.countPendientes(comercioId)
    }

    /** Backoff exponencial: 30s, 60s, 120s, 240s, 480s */
    private fun calculateNextRetry(intentos: Int): String {
        val delaySeconds = 30L * (1L shl (intentos - 1).coerceAtMost(4))
        val nextTime = Clock.System.now().epochSeconds + delaySeconds
        return kotlinx.datetime.Instant.fromEpochSeconds(nextTime).toString()
    }
}

data class SyncResult(
    val total: Int,
    val synced: Int,
    val failed: Int
)
