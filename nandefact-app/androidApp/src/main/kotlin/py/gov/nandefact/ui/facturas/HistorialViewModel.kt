package py.gov.nandefact.ui.facturas

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class FacturaListItem(
    val id: String,
    val numero: String,
    val clienteNombre: String,
    val total: Long,
    val hora: String,
    val estadoSifen: String // pendiente, aprobado, rechazado
)

enum class HistorialFilter { HOY, SEMANA, MES, TODO }

data class HistorialUiState(
    val facturas: List<FacturaListItem> = sampleFacturas(),
    val searchQuery: String = "",
    val filter: HistorialFilter = HistorialFilter.HOY,
    val isLoading: Boolean = false
) {
    val facturasFiltradas: List<FacturaListItem>
        get() {
            var list = facturas
            if (searchQuery.isNotBlank()) {
                list = list.filter {
                    it.numero.contains(searchQuery, ignoreCase = true) ||
                    it.clienteNombre.contains(searchQuery, ignoreCase = true)
                }
            }
            return list
        }
}

class HistorialViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(HistorialUiState())
    val uiState: StateFlow<HistorialUiState> = _uiState.asStateFlow()

    fun onSearchChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun onFilterChange(filter: HistorialFilter) {
        _uiState.value = _uiState.value.copy(filter = filter)
        // TODO: Recargar con filtro
    }
}

private fun sampleFacturas(): List<FacturaListItem> = listOf(
    FacturaListItem("1", "001-001-0000140", "Juan Pérez", 45_000, "14:30", "aprobado"),
    FacturaListItem("2", "001-001-0000139", "Sin documento", 12_000, "13:15", "pendiente"),
    FacturaListItem("3", "001-001-0000138", "María González", 85_000, "11:45", "aprobado"),
    FacturaListItem("4", "001-001-0000137", "Carlos López", 32_000, "10:20", "rechazado"),
    FacturaListItem("5", "001-001-0000136", "Ana Martínez", 156_000, "09:00", "aprobado")
)
