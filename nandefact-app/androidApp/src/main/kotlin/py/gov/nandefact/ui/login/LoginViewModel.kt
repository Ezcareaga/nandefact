package py.gov.nandefact.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.usecase.LoginUseCase

data class LoginUiState(
    val phone: String = "",
    val pin: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isAuthenticated: Boolean = false
)

class LoginViewModel(
    private val loginUseCase: LoginUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onPhoneChange(phone: String) {
        // Solo digitos, maximo 10 (numero paraguayo sin codigo pais)
        val cleaned = phone.filter { it.isDigit() }.take(10)
        _uiState.value = _uiState.value.copy(phone = cleaned, error = null)
    }

    fun onPinChange(pin: String) {
        _uiState.value = _uiState.value.copy(pin = pin, error = null)
    }

    fun onLogin() {
        val state = _uiState.value
        if (state.phone.length < 9) {
            _uiState.value = state.copy(error = "Numero de telefono invalido")
            return
        }
        if (state.pin.length < 4) {
            _uiState.value = state.copy(error = "PIN debe tener al menos 4 digitos")
            return
        }

        _uiState.value = state.copy(isLoading = true, error = null)

        viewModelScope.launch {
            val result = loginUseCase(state.phone, state.pin)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isLoading = false, isAuthenticated = true)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Error de autenticacion"
                    )
                }
            )
        }
    }
}
