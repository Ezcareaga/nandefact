package py.gov.nandefact.ui.login

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class LoginUiState(
    val phone: String = "",
    val pin: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isAuthenticated: Boolean = false
)

class LoginViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onPhoneChange(phone: String) {
        // Solo dígitos, máximo 10 (número paraguayo sin código país)
        val cleaned = phone.filter { it.isDigit() }.take(10)
        _uiState.value = _uiState.value.copy(phone = cleaned, error = null)
    }

    fun onPinChange(pin: String) {
        _uiState.value = _uiState.value.copy(pin = pin, error = null)
    }

    fun onLogin() {
        val state = _uiState.value
        if (state.phone.length < 9) {
            _uiState.value = state.copy(error = "Número de teléfono inválido")
            return
        }
        if (state.pin.length < 4) {
            _uiState.value = state.copy(error = "PIN debe tener al menos 4 dígitos")
            return
        }

        // TODO: Conectar con AuthRepository real
        _uiState.value = state.copy(isLoading = true, error = null)

        // Simular login exitoso por ahora
        _uiState.value = state.copy(isLoading = false, isAuthenticated = true)
    }
}
