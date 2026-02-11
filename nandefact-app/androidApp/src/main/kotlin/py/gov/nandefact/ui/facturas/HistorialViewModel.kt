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
import py.gov.nandefact.ui.common.UiState

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
    val content: UiState<List<FacturaListItem>> = UiState.Loading,
    val searchQuery: String = "",
    val filter: HistorialFilter = HistorialFilter.HOY,
    // Paginacion
    val page: Int = 1,
    val hasMore: Boolean = false
) {
    val facturasFiltradas: List<FacturaListItem>
        get() {
            val facturas = (content as? UiState.Success)?.data ?: return emptyList()
            if (searchQuery.isNotBlank()) {
                return facturas.filter {
                    it.numero.contains(searchQuery, ignoreCase = true) ||
                    it.clienteNombre.contains(searchQuery, ignoreCase = true)
                }
            }
            return facturas
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
            try {
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
                    content = UiState.Success(firstPage),
                    page = 1,
                    hasMore = allFacturas.size > pageSize
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    content = UiState.Error(
                        message = e.message ?: "Error al cargar facturas",
                        retry = ::loadFacturas
                    )
                )
            }
        }
    }

    fun loadMore() {
        val state = _uiState.value
        if (!state.hasMore) return
        val currentList = (state.content as? UiState.Success)?.data ?: return
        val nextPage = state.page + 1
        val endIndex = nextPage * pageSize
        _uiState.value = state.copy(
            content = UiState.Success(allFacturas.take(endIndex)),
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
    FacturaListItem("1", "001-001-0000140", "Juan P\u00e9rez", 45_000, "14:30", "aprobado"),
    FacturaListItem("2", "001-001-0000139", "Sin documento", 12_000, "13:15", "pendiente"),
    FacturaListItem("3", "001-001-0000138", "Mar\u00eda Gonz\u00e1lez", 85_000, "11:45", "aprobado"),
    FacturaListItem("4", "001-001-0000137", "Carlos L\u00f3pez", 32_000, "10:20", "rechazado"),
    FacturaListItem("5", "001-001-0000136", "Ana Mart\u00ednez", 156_000, "09:00", "aprobado")
)
