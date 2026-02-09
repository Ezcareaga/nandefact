package py.gov.nandefact.ui.pendientes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.usecase.GetPendientesUseCase
import py.gov.nandefact.shared.domain.usecase.SyncPendientesUseCase

data class PendienteUi(
    val id: String,
    val facturaNumero: String,
    val clienteNombre: String,
    val total: Long,
    val posicion: Int,
    val error: String? = null
)

data class PendientesUiState(
    val pendientes: List<PendienteUi> = emptyList(),
    val isSyncing: Boolean = false,
    val isLoading: Boolean = true
)

class PendientesViewModel(
    private val getPendientes: GetPendientesUseCase,
    private val syncPendientes: SyncPendientesUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(PendientesUiState())
    val uiState: StateFlow<PendientesUiState> = _uiState.asStateFlow()

    init {
        loadPendientes()
    }

    private fun loadPendientes() {
        viewModelScope.launch {
            val pendientes = getPendientes()
            val items = pendientes.mapIndexed { index, f ->
                PendienteUi(
                    id = f.id,
                    facturaNumero = f.numero ?: "",
                    clienteNombre = f.clienteNombre ?: "Sin nombre",
                    total = f.totalBruto,
                    posicion = index + 1,
                    error = if (f.estadoSifen == "rechazado") f.sifenRespuesta else null
                )
            }
            val finalItems = items.ifEmpty { samplePendientes() }
            _uiState.value = PendientesUiState(
                pendientes = finalItems,
                isSyncing = false,
                isLoading = false
            )
        }
    }

    fun onSyncNow() {
        _uiState.value = _uiState.value.copy(isSyncing = true)
        viewModelScope.launch {
            syncPendientes()
            loadPendientes()
        }
    }

    fun onRetry(id: String) {
        onSyncNow()
    }
}

private fun samplePendientes(): List<PendienteUi> = listOf(
    PendienteUi("1", "001-001-0000137", "Juan Perez", 45_000, 1),
    PendienteUi("2", "001-001-0000138", "Sin documento", 12_000, 2),
    PendienteUi("3", "001-001-0000139", "Maria Gonzalez", 85_000, 3,
        error = "Error de conexion con SIFEN")
)
