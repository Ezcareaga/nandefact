package py.gov.nandefact.shared.domain.ports

import kotlinx.coroutines.flow.StateFlow

/**
 * Interfaz para monitorear conectividad de red.
 * Implementación en androidApp/ usa ConnectivityManager.
 */
interface NetworkMonitor {
    val isOnline: StateFlow<Boolean>
}
