package py.gov.nandefact.ui.facturas

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.usecase.GetFacturasUseCase

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
    val facturas: List<FacturaListItem> = emptyList(),
    val searchQuery: String = "",
    val filter: HistorialFilter = HistorialFilter.HOY,
    val isLoading: Boolean = true,
    // Paginación
    val page: Int = 1,
    val hasMore: Boolean = false
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

class HistorialViewModel(
    private val getFacturas: GetFacturasUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(HistorialUiState())
    val uiState: StateFlow<HistorialUiState> = _uiState.asStateFlow()

    private var allFacturas: List<FacturaListItem> = emptyList()
    private val pageSize = 20
    private val _searchInput = MutableStateFlow("")

    init {
        loadFacturas()
        @OptIn(FlowPreview::class)
        viewModelScope.launch {
            _searchInput.debounce(300).distinctUntilChanged().collect { query ->
                _uiState.value = _uiState.value.copy(searchQuery = query)
            }
        }
    }

    private fun loadFacturas() {
        viewModelScope.launch {
            val facturas = getFacturas()
            allFacturas = facturas.map { f ->
                FacturaListItem(
                    id = f.id,
                    numero = f.numero ?: "",
                    clienteNombre = f.clienteNombre ?: "Sin nombre",
                    total = f.totalBruto,
                    hora = f.createdAt.takeLast(8).take(5), // HH:mm
                    estadoSifen = f.estadoSifen
                )
            }
            if (allFacturas.isEmpty()) {
                allFacturas = sampleFacturas()
            }
            val firstPage = allFacturas.take(pageSize)
            _uiState.value = _uiState.value.copy(
                facturas = firstPage,
                isLoading = false,
                page = 1,
                hasMore = allFacturas.size > pageSize
            )
        }
    }

    fun loadMore() {
        val state = _uiState.value
        if (!state.hasMore) return
        val nextPage = state.page + 1
        val endIndex = nextPage * pageSize
        _uiState.value = state.copy(
            facturas = allFacturas.take(endIndex),
            page = nextPage,
            hasMore = endIndex < allFacturas.size
        )
    }

    fun onSearchChange(query: String) {
        _searchInput.value = query
    }

    fun onFilterChange(filter: HistorialFilter) {
        _uiState.value = _uiState.value.copy(filter = filter)
        loadFacturas()
    }
}

private fun sampleFacturas(): List<FacturaListItem> = listOf(
    FacturaListItem("1", "001-001-0000140", "Juan Pérez", 45_000, "14:30", "aprobado"),
    FacturaListItem("2", "001-001-0000139", "Sin documento", 12_000, "13:15", "pendiente"),
    FacturaListItem("3", "001-001-0000138", "María González", 85_000, "11:45", "aprobado"),
    FacturaListItem("4", "001-001-0000137", "Carlos López", 32_000, "10:20", "rechazado"),
    FacturaListItem("5", "001-001-0000136", "Ana Martínez", 156_000, "09:00", "aprobado")
)
