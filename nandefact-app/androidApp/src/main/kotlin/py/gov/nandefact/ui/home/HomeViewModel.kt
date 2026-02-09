package py.gov.nandefact.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.usecase.GetHomeDataUseCase

data class HomeUiState(
    val comercioName: String = "Mi Comercio",
    val userName: String = "Usuario",
    val pendingCount: Int = 0,
    val lastSaleAmount: Long? = null,
    val lastSaleMinutesAgo: Int? = null
)

class HomeViewModel(
    private val getHomeData: GetHomeDataUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            val data = getHomeData()
            _uiState.value = HomeUiState(
                comercioName = data.comercioName,
                userName = data.userName,
                pendingCount = data.pendingCount.toInt(),
                lastSaleAmount = data.lastSaleAmount,
                lastSaleMinutesAgo = if (data.lastSaleAmount != null) 5 else null
            )
        }
    }
}
