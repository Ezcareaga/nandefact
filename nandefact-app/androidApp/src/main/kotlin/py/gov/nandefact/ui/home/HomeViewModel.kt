package py.gov.nandefact.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.usecase.GetHomeDataUseCase
import py.gov.nandefact.ui.common.UiState

data class HomeData(
    val comercioName: String = "Mi Comercio",
    val userName: String = "Usuario",
    val pendingCount: Int = 0,
    val lastSaleAmount: Long? = null,
    val lastSaleMinutesAgo: Int? = null
)

class HomeViewModel(
    private val getHomeData: GetHomeDataUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow<UiState<HomeData>>(UiState.Loading)
    val uiState: StateFlow<UiState<HomeData>> = _uiState.asStateFlow()

    init {
        loadHomeData()
    }

    fun loadHomeData() {
        viewModelScope.launch {
            try {
                val data = getHomeData()
                _uiState.value = UiState.Success(
                    HomeData(
                        comercioName = data.comercioName,
                        userName = data.userName,
                        pendingCount = data.pendingCount.toInt(),
                        lastSaleAmount = data.lastSaleAmount,
                        lastSaleMinutesAgo = data.lastSaleTime?.let { timeStr ->
                            try {
                                val then = java.time.Instant.parse(timeStr)
                                val now = java.time.Instant.now()
                                java.time.Duration.between(then, now).toMinutes().toInt()
                            } catch (_: Exception) { null }
                        }
                    )
                )
            } catch (e: Exception) {
                _uiState.value = UiState.Error(
                    message = e.message ?: "Error al cargar datos",
                    retry = ::loadHomeData
                )
            }
        }
    }
}
