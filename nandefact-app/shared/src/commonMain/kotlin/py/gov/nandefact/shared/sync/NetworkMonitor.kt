package py.gov.nandefact.shared.sync

import kotlinx.coroutines.flow.StateFlow

/**
 * Interfaz para monitorear conectividad de red.
 * Implementacion en androidApp/ usa ConnectivityManager.
 */
interface NetworkMonitor {
    val isOnline: StateFlow<Boolean>
}
