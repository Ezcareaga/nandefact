package py.gov.nandefact.ui.common

/**
 * Estado sellado para representar los estados posibles de una pantalla.
 * Elimina estados ambiguos (loading + datos vacíos) y garantiza que
 * cada pantalla siempre muestre algo significativo.
 */
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    object Empty : UiState<Nothing>()
    data class Error(val message: String, val retry: (() -> Unit)? = null) : UiState<Nothing>()
}
