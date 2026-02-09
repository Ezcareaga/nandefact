package py.gov.nandefact.ui.reportes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.usecase.GetReportesUseCase

enum class PeriodFilter { HOY, SEMANA, MES, TODO }

data class TopProducto(
    val nombre: String,
    val cantidad: Int,
    val total: Long
)

data class ReportesUiState(
    val period: PeriodFilter = PeriodFilter.HOY,
    val totalVentas: Long = 0,
    val cantidadFacturas: Int = 0,
    val totalIva10: Long = 0,
    val totalIva5: Long = 0,
    val totalExenta: Long = 0,
    val topProductos: List<TopProducto> = emptyList(),
    val isLoading: Boolean = true
)

class ReportesViewModel(
    private val getReportes: GetReportesUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(ReportesUiState())
    val uiState: StateFlow<ReportesUiState> = _uiState.asStateFlow()

    init {
        loadReportes()
    }

    private fun loadReportes() {
        viewModelScope.launch {
            val data = getReportes()
            val topProductos = data.topProductos.map {
                TopProducto(it.nombre, it.cantidad, it.total)
            }
            _uiState.value = _uiState.value.copy(
                totalVentas = data.totalVentas,
                cantidadFacturas = data.cantidadFacturas,
                totalIva10 = data.totalIva10,
                totalIva5 = data.totalIva5,
                totalExenta = data.totalExenta,
                topProductos = topProductos.ifEmpty { sampleTopProductos() },
                isLoading = false
            )
            // Si no hay datos reales, usar samples
            if (data.totalVentas == 0L) {
                _uiState.value = _uiState.value.copy(
                    totalVentas = 1_450_000,
                    cantidadFacturas = 12,
                    totalIva10 = 85_000,
                    totalIva5 = 45_000
                )
            }
        }
    }

    fun onPeriodChange(period: PeriodFilter) {
        _uiState.value = _uiState.value.copy(period = period)
        loadReportes()
    }
}

private fun sampleTopProductos(): List<TopProducto> = listOf(
    TopProducto("Mandioca", 45, 225_000),
    TopProducto("Cebolla", 30, 120_000),
    TopProducto("Banana", 20, 300_000),
    TopProducto("Yerba Mate", 15, 375_000),
    TopProducto("Arroz", 12, 78_000)
)
