package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.remote.SyncApi
import py.gov.nandefact.shared.data.remote.SyncFacturaPayload
import py.gov.nandefact.shared.data.remote.SyncPushRequest
import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.FacturaRepository
import py.gov.nandefact.shared.sync.SyncResult

class SyncPendientesUseCase(
    private val facturaRepository: FacturaRepository,
    private val syncApi: SyncApi,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): SyncResult {
        val comercioId = authRepository.getComercioId()
            ?: return SyncResult(0, 0, 0)

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
                    facturaRepository.updateEstado(
                        facturaId = factura.id,
                        estado = "enviado",
                        respuesta = null,
                        syncedAt = kotlinx.datetime.Clock.System.now().toString()
                    )
                    synced++
                } else {
                    failed++
                }
            } catch (e: Exception) {
                // Si falla una, seguir con las demas
                failed++
            }
        }

        return SyncResult(
            total = pendientes.size,
            synced = synced,
            failed = failed
        )
    }
}
