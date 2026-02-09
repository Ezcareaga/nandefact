package py.gov.nandefact.ui.facturacion

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.snapshotFlow
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfQuantitySelector
import py.gov.nandefact.ui.components.NfSearchBar
import py.gov.nandefact.ui.components.formatPYG

@Composable
fun Step1ProductosScreen(
    state: FacturacionUiState,
    onSearchChange: (String) -> Unit,
    onProductTap: (String) -> Unit,
    onQuantityChange: (String, Int) -> Unit,
    onNext: () -> Unit,
    onLoadMore: () -> Unit = {}
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Search bar sticky
        NfSearchBar(
            query = state.searchQuery,
            onQueryChange = onSearchChange,
            placeholder = "Buscar producto...",
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        // Lista de productos con paginacion
        val listState = rememberLazyListState()

        // Detectar scroll al final para cargar mas
        LaunchedEffect(listState) {
            snapshotFlow {
                val layoutInfo = listState.layoutInfo
                val lastVisible = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
                lastVisible >= layoutInfo.totalItemsCount - 3
            }.collect { nearEnd ->
                if (nearEnd && state.hasMore) {
                    onLoadMore()
                }
            }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(state.productosFiltrados, key = { it.id }) { producto ->
                NfCard(
                    onClick = { onProductTap(producto.id) },
                    borderColor = if (producto.cantidad > 0)
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                    else
                        MaterialTheme.colorScheme.outline
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${producto.nombre} (${producto.unidadMedida})",
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }
                        Text(
                            text = formatPYG(producto.precioUnitario),
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onBackground,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        NfQuantitySelector(
                            quantity = producto.cantidad,
                            onQuantityChange = { onQuantityChange(producto.id, it) }
                        )
                    }
                }
            }
            item { Spacer(modifier = Modifier.height(80.dp)) }
        }

        // Bottom bar sticky
        HorizontalDivider(color = MaterialTheme.colorScheme.outline)
        Surface(
            color = MaterialTheme.colorScheme.surface
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${state.totalItems} productos — ${formatPYG(state.totalBruto)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Button(
                    onClick = onNext,
                    enabled = state.canAdvanceStep1,
                    shape = MaterialTheme.shapes.medium,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text("SIGUIENTE →")
                }
            }
        }
    }
}
