package py.gov.nandefact.ui.home

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class HomeUiState(
    val comercioName: String = "Comercial El Triunfo",
    val userName: String = "Doña María",
    val pendingCount: Int = 3,
    val lastSaleAmount: Long? = 450_000L,
    val lastSaleMinutesAgo: Int? = 5
)

class HomeViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    // TODO: Conectar con repositorios reales
}
