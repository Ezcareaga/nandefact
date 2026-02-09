package py.gov.nandefact.ui.pendientes

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class PendienteUi(
    val id: String,
    val facturaNumero: String,
    val clienteNombre: String,
    val total: Long,
    val posicion: Int,
    val error: String? = null
)

data class PendientesUiState(
    val pendientes: List<PendienteUi> = samplePendientes(),
    val isSyncing: Boolean = false
)

class PendientesViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(PendientesUiState())
    val uiState: StateFlow<PendientesUiState> = _uiState.asStateFlow()

    fun onSyncNow() {
        // TODO: Conectar con SyncManager
        _uiState.value = _uiState.value.copy(isSyncing = true)
    }

    fun onRetry(id: String) {
        // TODO: Reintentar envío
    }
}

private fun samplePendientes(): List<PendienteUi> = listOf(
    PendienteUi("1", "001-001-0000137", "Juan Pérez", 45_000, 1),
    PendienteUi("2", "001-001-0000138", "Sin documento", 12_000, 2),
    PendienteUi("3", "001-001-0000139", "María González", 85_000, 3,
        error = "Error de conexión con SIFEN")
)
