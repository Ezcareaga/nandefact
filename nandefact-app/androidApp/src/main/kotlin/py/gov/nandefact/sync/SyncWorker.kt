package py.gov.nandefact.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import py.gov.nandefact.shared.domain.usecase.SyncPendientesUseCase

/**
 * WorkManager CoroutineWorker para sincronizar facturas pendientes en background.
 * Procesa la cola FIFO, si falla una sigue con las demas.
 * Retorna Result.retry() si hay errores de red (backoff exponencial manejado por WorkManager).
 */
class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params), KoinComponent {

    private val syncPendientes: SyncPendientesUseCase by inject()

    override suspend fun doWork(): Result {
        return try {
            val result = syncPendientes()
            if (result.failed > 0 && result.synced == 0) {
                // Todos fallaron — reintentar con backoff exponencial
                Result.retry()
            } else {
                Result.success()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
