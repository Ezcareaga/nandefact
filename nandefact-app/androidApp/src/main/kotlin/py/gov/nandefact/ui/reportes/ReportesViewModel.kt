package py.gov.nandefact.ui.reportes

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class PeriodFilter { HOY, SEMANA, MES }

data class TopProducto(
    val nombre: String,
    val cantidad: Int,
    val total: Long
)

data class ReportesUiState(
    val period: PeriodFilter = PeriodFilter.HOY,
    val totalVentas: Long = 1_450_000,
    val cantidadFacturas: Int = 12,
    val totalIva10: Long = 85_000,
    val totalIva5: Long = 45_000,
    val totalExenta: Long = 0,
    val topProductos: List<TopProducto> = sampleTopProductos(),
    val isLoading: Boolean = false
)

class ReportesViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(ReportesUiState())
    val uiState: StateFlow<ReportesUiState> = _uiState.asStateFlow()

    fun onPeriodChange(period: PeriodFilter) {
        _uiState.value = _uiState.value.copy(period = period)
        // TODO: Recargar datos del periodo
    }
}

private fun sampleTopProductos(): List<TopProducto> = listOf(
    TopProducto("Mandioca", 45, 225_000),
    TopProducto("Cebolla", 30, 120_000),
    TopProducto("Banana", 20, 300_000),
    TopProducto("Yerba Mate", 15, 375_000),
    TopProducto("Arroz", 12, 78_000)
)
