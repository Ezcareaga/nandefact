package py.gov.nandefact.ui.clientes

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
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.koin.androidx.compose.koinViewModel
import py.gov.nandefact.ui.common.UiState
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfEmptyState
import py.gov.nandefact.ui.components.NfErrorState
import py.gov.nandefact.ui.components.NfLoadingSpinner
import py.gov.nandefact.ui.components.NfSearchBar
import py.gov.nandefact.ui.util.OnNearEnd

@Composable
fun ClientesListScreen(
    paddingValues: PaddingValues,
    onClienteClick: (String) -> Unit,
    onCreateClick: () -> Unit,
    viewModel: ClientesViewModel = koinViewModel()
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            viewModel.refresh()
        }
    }

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
                Icon(Icons.Filled.Add, contentDescription = "Agregar cliente")
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
                placeholder = "Buscar por nombre o CI/RUC...",
                modifier = Modifier.padding(vertical = 8.dp)
            )

            when (val content = state.content) {
                is UiState.Loading -> NfLoadingSpinner()
                is UiState.Error -> NfErrorState(
                    message = content.message,
                    onRetry = content.retry
                )
                is UiState.Empty -> NfEmptyState(
                    icon = Icons.Filled.Person,
                    title = "Sin clientes",
                    subtitle = "Los clientes se guardan al facturar",
                    actionLabel = "Agregar cliente",
                    onAction = onCreateClick
                )
                is UiState.Success -> {
                    val filtrados = state.clientesFiltrados
                    if (filtrados.isEmpty() && state.searchQuery.isNotBlank()) {
                        NfEmptyState(
                            icon = Icons.Filled.Person,
                            title = "Sin resultados",
                            subtitle = "No se encontraron clientes para \"${state.searchQuery}\""
                        )
                    } else {
                        LazyColumn(
                            state = listState,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(filtrados, key = { it.id }) { cliente ->
                                NfCard(onClick = { onClienteClick(cliente.id) }) {
                                    Text(
                                        text = cliente.nombre,
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onBackground
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = "${cliente.tipoDocumento}: ${cliente.rucCi}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                        if (cliente.telefono.isNotBlank()) {
                                            Text(
                                                text = cliente.telefono,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
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
    }
}
