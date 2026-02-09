package py.gov.nandefact.ui.pendientes

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfEmptyState
import py.gov.nandefact.ui.components.NfStatusDot
import py.gov.nandefact.ui.components.StatusColor
import py.gov.nandefact.ui.components.formatPYG
import py.gov.nandefact.ui.theme.NfWarning

@Composable
fun PendientesScreen(
    paddingValues: PaddingValues,
    viewModel: PendientesViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp)
    ) {
        if (state.pendientes.isEmpty()) {
            NfEmptyState(
                icon = Icons.Filled.CloudOff,
                title = "Sin pendientes",
                subtitle = "Todas las facturas están sincronizadas"
            )
        } else {
            // Contador
            Text(
                text = "${state.pendientes.size} facturas esperando conexión",
                style = MaterialTheme.typography.titleMedium,
                color = NfWarning,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(vertical = 12.dp)
            )

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(state.pendientes, key = { it.id }) { pendiente ->
                    val hasError = pendiente.error != null
                    NfCard {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            NfStatusDot(
                                status = if (hasError) StatusColor.ERROR else StatusColor.WARNING,
                                modifier = Modifier.padding(end = 12.dp)
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "#${pendiente.facturaNumero}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                                Text(
                                    text = pendiente.clienteNombre,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                if (hasError) {
                                    Text(
                                        text = pendiente.error!!,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.error
                                    )
                                } else {
                                    Text(
                                        text = "En cola (posición ${pendiente.posicion})",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Text(
                                text = formatPYG(pendiente.total),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onBackground,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        if (hasError) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 8.dp),
                                horizontalArrangement = Arrangement.End
                            ) {
                                TextButton(onClick = { viewModel.onRetry(pendiente.id) }) {
                                    Text("Reintentar", color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                }
                item { Spacer(modifier = Modifier.height(80.dp)) }
            }

            // Botón sincronizar
            Button(
                onClick = viewModel::onSyncNow,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 80.dp)
                    .height(48.dp),
                enabled = !state.isSyncing,
                shape = MaterialTheme.shapes.medium,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                if (state.isSyncing) {
                    CircularProgressIndicator(
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Icon(Icons.Filled.Sync, contentDescription = null)
                    Text(" Sincronizar Ahora", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
