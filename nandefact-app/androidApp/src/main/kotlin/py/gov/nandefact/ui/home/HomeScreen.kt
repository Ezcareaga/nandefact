package py.gov.nandefact.ui.home

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
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.koin.androidx.compose.koinViewModel
import py.gov.nandefact.ui.common.UiState
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfErrorState
import py.gov.nandefact.ui.components.NfHeroCard
import py.gov.nandefact.ui.components.NfLoadingSpinner
import py.gov.nandefact.ui.components.NfStatusDot
import py.gov.nandefact.ui.components.StatusColor
import py.gov.nandefact.ui.components.formatPYG
import py.gov.nandefact.ui.theme.NfTheme

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
    val uiState by viewModel.uiState.collectAsState()

    when (val state = uiState) {
        is UiState.Loading -> NfLoadingSpinner(
            modifier = Modifier.padding(paddingValues)
        )
        is UiState.Error -> NfErrorState(
            message = state.message,
            onRetry = state.retry,
            modifier = Modifier.padding(paddingValues)
        )
        is UiState.Empty -> {} // Home siempre tiene contenido
        is UiState.Success -> HomeContent(
            data = state.data,
            paddingValues = paddingValues,
            onNavigateFacturacion = onNavigateFacturacion,
            onNavigateReportes = onNavigateReportes,
            onNavigateProductos = onNavigateProductos,
            onNavigateClientes = onNavigateClientes,
            onNavigatePendientes = onNavigatePendientes,
            onNavigateHistorial = onNavigateHistorial
        )
    }
}

@Composable
private fun HomeContent(
    data: HomeData,
    paddingValues: PaddingValues,
    onNavigateFacturacion: () -> Unit,
    onNavigateReportes: () -> Unit,
    onNavigateProductos: () -> Unit,
    onNavigateClientes: () -> Unit,
    onNavigatePendientes: () -> Unit,
    onNavigateHistorial: () -> Unit
) {
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
            text = "Hola, ${data.userName} \uD83D\uDC4B",
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

        // Grid 2x2
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
            HomeGridCard(
                icon = Icons.Filled.History,
                label = "Historial",
                onClick = onNavigateHistorial,
                modifier = Modifier.weight(1f)
            )
        }

        // Banner pendientes (si hay)
        if (data.pendingCount > 0) {
            Spacer(modifier = Modifier.height(12.dp))
            NfCard(
                borderColor = NfTheme.colors.warning,
                backgroundColor = NfTheme.colors.warningContainer,
                onClick = onNavigatePendientes
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    NfStatusDot(status = StatusColor.WARNING)
                    Text(
                        text = "${data.pendingCount} pendientes de envio",
                        style = MaterialTheme.typography.bodyMedium,
                        color = NfTheme.colors.warning,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Ultima venta
        if (data.lastSaleAmount != null) {
            NfCard {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    NfStatusDot(status = StatusColor.SUCCESS)
                    Text(
                        text = " \u00DAltima: ${data.lastSaleAmount.let { formatPYG(it) }}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = "Hace ${data.lastSaleMinutesAgo} min",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
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
