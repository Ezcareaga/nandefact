package py.gov.nandefact.ui.productos

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.koin.androidx.compose.koinViewModel
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfEmptyState
import py.gov.nandefact.ui.components.NfSearchBar
import py.gov.nandefact.ui.components.formatPYG
import py.gov.nandefact.ui.util.OnNearEnd

@Composable
fun ProductosListScreen(
    paddingValues: PaddingValues,
    onProductoClick: (String) -> Unit,
    onCreateClick: () -> Unit,
    viewModel: ProductosViewModel = koinViewModel()
) {
    val state by viewModel.listState.collectAsState()
    val listState = rememberLazyListState()

    listState.OnNearEnd {
        if (state.hasMore) viewModel.loadMore()
    }

    Scaffold(
        modifier = Modifier.padding(paddingValues),
        floatingActionButton = {
            FloatingActionButton(
                onClick = onCreateClick,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Agregar producto")
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
        ) {
            NfSearchBar(
                query = state.searchQuery,
                onQueryChange = viewModel::onSearchChange,
                placeholder = "Buscar producto...",
                modifier = Modifier.padding(vertical = 8.dp)
            )

            if (state.productosFiltrados.isEmpty()) {
                NfEmptyState(
                    icon = Icons.Filled.Inventory2,
                    title = "Sin productos",
                    subtitle = "Agrega tu primer producto con el botón +"
                )
            } else {
                LazyColumn(
                    state = listState,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.productosFiltrados, key = { it.id }) { producto ->
                        NfCard(onClick = { onProductoClick(producto.id) }) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = producto.nombre,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onBackground
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "${formatPYG(producto.precioUnitario)}/${producto.unidadMedida} — IVA ${producto.tasaIva}%",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (producto.categoria.isNotBlank()) {
                                        Text(
                                            text = producto.categoria,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.outline
                                        )
                                    }
                                }
                            }
                        }
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }
}
