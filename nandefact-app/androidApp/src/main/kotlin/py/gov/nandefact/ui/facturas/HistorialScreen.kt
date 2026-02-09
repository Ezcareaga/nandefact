package py.gov.nandefact.ui.facturas

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
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.koin.androidx.compose.koinViewModel
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfEmptyState
import py.gov.nandefact.ui.components.NfSearchBar
import py.gov.nandefact.ui.components.NfStatusDot
import py.gov.nandefact.ui.components.StatusColor
import py.gov.nandefact.ui.components.formatPYG
import py.gov.nandefact.ui.util.OnNearEnd

@Composable
fun HistorialScreen(
    paddingValues: PaddingValues,
    onFacturaClick: (String) -> Unit,
    viewModel: HistorialViewModel = koinViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()

    listState.OnNearEnd {
        if (state.hasMore) viewModel.loadMore()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp)
    ) {
        NfSearchBar(
            query = state.searchQuery,
            onQueryChange = viewModel::onSearchChange,
            placeholder = "Buscar por nro o cliente...",
            modifier = Modifier.padding(vertical = 8.dp)
        )

        // Filtros
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            HistorialFilter.entries.forEach { filter ->
                val label = when (filter) {
                    HistorialFilter.HOY -> "Hoy"
                    HistorialFilter.SEMANA -> "Semana"
                    HistorialFilter.MES -> "Mes"
                    HistorialFilter.TODO -> "Todo"
                }
                FilterChip(
                    selected = state.filter == filter,
                    onClick = { viewModel.onFilterChange(filter) },
                    label = { Text(label) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                    )
                )
            }
        }

        if (state.facturasFiltradas.isEmpty()) {
            NfEmptyState(
                icon = Icons.Filled.Receipt,
                title = "Sin facturas",
                subtitle = "Las facturas generadas aparecerán aquí"
            )
        } else {
            LazyColumn(
                state = listState,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(state.facturasFiltradas, key = { it.id }) { factura ->
                    NfCard(onClick = { onFacturaClick(factura.id) }) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = "#${factura.numero}",
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = MaterialTheme.colorScheme.onBackground
                                    )
                                    NfStatusDot(
                                        status = when (factura.estadoSifen) {
                                            "aprobado" -> StatusColor.SUCCESS
                                            "rechazado" -> StatusColor.ERROR
                                            else -> StatusColor.WARNING
                                        }
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = factura.clienteNombre,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = formatPYG(factura.total),
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                                Text(
                                    text = factura.hora,
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
