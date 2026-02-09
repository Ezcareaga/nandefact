package py.gov.nandefact.ui.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.koin.androidx.compose.koinViewModel
import py.gov.nandefact.ui.components.NfAmountDisplay
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfHeroCard
import py.gov.nandefact.ui.components.NfStatusDot
import py.gov.nandefact.ui.components.StatusColor
import py.gov.nandefact.ui.components.formatPYG
import py.gov.nandefact.ui.theme.NfExtendedColors

@Composable
fun HomeScreen(
    paddingValues: PaddingValues,
    onNavigateFacturacion: () -> Unit,
    onNavigateReportes: () -> Unit,
    onNavigateProductos: () -> Unit,
    onNavigateClientes: () -> Unit,
    onNavigatePendientes: () -> Unit,
    onNavigateHistorial: () -> Unit = {},
    viewModel: HomeViewModel = koinViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // Saludo personalizado
        Text(
            text = "Hola, ${state.userName} \uD83D\uDC4B",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Hero card — GENERAR FACTURA
        NfHeroCard(
            text = "GENERAR FACTURA",
            onClick = onNavigateFacturacion
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Grid 2×2
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            HomeGridCard(
                icon = Icons.Filled.BarChart,
                label = "Reportes",
                onClick = onNavigateReportes,
                modifier = Modifier.weight(1f)
            )
            HomeGridCard(
                icon = Icons.Filled.Inventory2,
                label = "Productos",
                onClick = onNavigateProductos,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            HomeGridCard(
                icon = Icons.Filled.Person,
                label = "Clientes",
                onClick = onNavigateClientes,
                modifier = Modifier.weight(1f)
            )

            // Card Pendientes — estilo especial
            NfCard(
                modifier = Modifier.weight(1f),
                borderColor = NfExtendedColors.warning,
                backgroundColor = NfExtendedColors.warningContainer,
                onClick = onNavigatePendientes
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    NfStatusDot(status = StatusColor.WARNING)
                    Text(
                        text = "(${state.pendingCount})",
                        style = MaterialTheme.typography.titleMedium,
                        color = NfExtendedColors.warning,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Pendientes",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Última venta
        if (state.lastSaleAmount != null) {
            NfCard {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    NfStatusDot(status = StatusColor.SUCCESS)
                    Text(
                        text = " Última: ${state.lastSaleAmount?.let { formatPYG(it) } ?: ""}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = "Hace ${state.lastSaleMinutesAgo} min",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            TextButton(
                onClick = onNavigateHistorial,
                modifier = Modifier.align(Alignment.End)
            ) {
                Text(
                    text = "Ver historial completo →",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        Spacer(modifier = Modifier.height(80.dp)) // Espacio para pill
    }
}

@Composable
private fun HomeGridCard(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    NfCard(
        modifier = modifier,
        onClick = onClick
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(28.dp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}
