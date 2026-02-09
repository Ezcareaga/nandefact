package py.gov.nandefact.shared.sync

import py.gov.nandefact.shared.data.remote.SyncApi
import py.gov.nandefact.shared.data.repository.FacturaRepository

/**
 * Motor de sincronización offline-first.
 * Detecta facturas pendientes y las envía al backend en orden FIFO.
 */
class SyncManager(
    private val facturaRepository: FacturaRepository,
    private val syncApi: SyncApi
) {
    /** Sincroniza facturas pendientes con el backend */
    suspend fun syncPendientes(comercioId: String): SyncResult {
        val pendientes = facturaRepository.getPendientes(comercioId)
        if (pendientes.isEmpty()) return SyncResult(0, 0, 0)

        var synced = 0
        var failed = 0

        pendientes.forEach { factura ->
            try {
                // TODO: Enviar factura al backend via SyncApi
                // Por ahora, solo marca como enviada para el esqueleto
                synced++
            } catch (e: Exception) {
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
}

data class SyncResult(
    val total: Int,
    val synced: Int,
    val failed: Int
)
