package py.gov.nandefact.ui.util

import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.snapshotFlow

/**
 * Extension composable que detecta cuando el usuario llega cerca del final
 * de la lista y dispara [onLoadMore] para cargar la siguiente pagina.
 */
@Composable
fun LazyListState.OnNearEnd(buffer: Int = 3, onLoadMore: () -> Unit) {
    LaunchedEffect(this) {
        snapshotFlow {
            val layoutInfo = this@OnNearEnd.layoutInfo
            val lastVisible = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisible >= layoutInfo.totalItemsCount - buffer
        }.collect { nearEnd ->
            if (nearEnd) onLoadMore()
        }
    }
}
