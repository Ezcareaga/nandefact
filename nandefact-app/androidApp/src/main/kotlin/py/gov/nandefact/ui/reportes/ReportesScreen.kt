package py.gov.nandefact.ui.reportes

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import org.koin.androidx.compose.koinViewModel
import py.gov.nandefact.shared.domain.model.PeriodFilter
import py.gov.nandefact.ui.common.UiState
import py.gov.nandefact.ui.components.NfAmountDisplay
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfErrorState
import py.gov.nandefact.ui.components.NfLoadingSpinner
import py.gov.nandefact.ui.components.formatCompactPYG
import py.gov.nandefact.ui.components.formatPYG
import py.gov.nandefact.ui.theme.NfTheme

@Composable
fun ReportesScreen(
    paddingValues: PaddingValues,
    viewModel: ReportesViewModel = koinViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .padding(paddingValues)
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // Filtros de periodo (sin "Todo")
        PeriodFilterRow(
            selected = state.period,
            onSelect = { viewModel.onPeriodChange(it) }
        )

        Spacer(modifier = Modifier.height(16.dp))

        when (val content = state.content) {
            is UiState.Loading -> NfLoadingSpinner()
            is UiState.Error -> NfErrorState(
                message = content.message,
                onRetry = content.retry
            )
            is UiState.Empty -> NfLoadingSpinner()
            is UiState.Success -> {
                LazyColumn(
                    modifier = Modifier.testTag("reportes_list"),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item { VistaGeneralSection(content.data) }
                    item { ProductosSection(content.data, viewModel::onProductosTabChange) }
                    item { ClientesFrecuentesSection(content.data.clientesFrecuentes) }
                    item { HorarioPicoSection(content.data.hourlySlots, content.data.peakSlotLabel) }
                    item { ResumenMensualSection(content.data) }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }
    }
}

@Composable
private fun PeriodFilterRow(selected: PeriodFilter, onSelect: (PeriodFilter) -> Unit) {
    val periods = listOf(PeriodFilter.HOY, PeriodFilter.SEMANA, PeriodFilter.MES)
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        periods.forEach { period ->
            val label = when (period) {
                PeriodFilter.HOY -> "Hoy"
                PeriodFilter.SEMANA -> "Semana"
                PeriodFilter.MES -> "Mes"
                PeriodFilter.TODO -> "Todo"
            }
            FilterChip(
                selected = selected == period,
                onClick = { onSelect(period) },
                label = { Text(label) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    }
}

@Composable
private fun VistaGeneralSection(content: ReportesContent) {
    NfCard {
        Text(
            text = "Vista General",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))

        NfAmountDisplay(
            amount = content.totalVentas,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(4.dp))

        // Facturas + comparación
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "${content.cantidadFacturas} facturas",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (content.changePercent != null && content.changePositive != null) {
                Spacer(modifier = Modifier.width(8.dp))
                val arrow = if (content.changePositive) "\u2191" else "\u2193"
                val color = if (content.changePositive) NfTheme.colors.success else NfTheme.colors.error
                Text(
                    text = "$arrow ${kotlin.math.abs(content.changePercent)}% vs periodo anterior",
                    style = MaterialTheme.typography.bodySmall,
                    color = color,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        HorizontalDivider(color = NfTheme.colors.divider)
        Spacer(modifier = Modifier.height(12.dp))

        IvaRow("IVA 10%", content.totalIva10)
        IvaRow("IVA 5%", content.totalIva5)
        IvaRow("Exenta", content.totalExenta)

        Spacer(modifier = Modifier.height(12.dp))
        HorizontalDivider(color = NfTheme.colors.divider)
        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Ticket promedio",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = formatCompactPYG(content.ticketPromedio),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onBackground,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductosSection(
    content: ReportesContent,
    onTabChange: (ProductosTab) -> Unit
) {
    NfCard {
        Text(
            text = "Productos",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(12.dp))

        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            SegmentedButton(
                selected = content.productosTab == ProductosTab.MAS_VENDIDOS,
                onClick = { onTabChange(ProductosTab.MAS_VENDIDOS) },
                shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
            ) {
                Text("Mas vendidos")
            }
            SegmentedButton(
                selected = content.productosTab == ProductosTab.MENOS_VENDIDOS,
                onClick = { onTabChange(ProductosTab.MENOS_VENDIDOS) },
                shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
            ) {
                Text("Menos vendidos")
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        if (content.productosTab == ProductosTab.MENOS_VENDIDOS) {
            Text(
                text = "Estos productos casi no se mueven",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        val productos = if (content.productosTab == ProductosTab.MAS_VENDIDOS)
            content.topProductos else content.bottomProductos

        productos.forEachIndexed { index, producto ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${index + 1}. ${producto.nombre}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "${producto.cantidad} uds",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(end = 12.dp)
                )
                Text(
                    text = formatCompactPYG(producto.total),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground,
                    fontWeight = FontWeight.SemiBold
                )
            }
            if (index < productos.lastIndex) {
                HorizontalDivider(
                    color = NfTheme.colors.divider,
                    modifier = Modifier.padding(vertical = 2.dp)
                )
            }
        }
    }
}

@Composable
private fun ClientesFrecuentesSection(clientes: List<ClienteFrecuente>) {
    NfCard {
        Text(
            text = "Clientes Frecuentes",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(12.dp))

        if (clientes.isEmpty()) {
            Text(
                text = "Sin datos de clientes",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            clientes.forEachIndexed { index, cliente ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Iniciales en círculo
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = cliente.initials,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = cliente.nombre,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "${cliente.compraCount} compras",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Text(
                        text = formatCompactPYG(cliente.total),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                if (index < clientes.lastIndex) {
                    HorizontalDivider(
                        color = NfTheme.colors.divider,
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun HorarioPicoSection(slots: List<HourSlotUi>, peakLabel: String) {
    NfCard {
        Text(
            text = "Horario Pico",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))

        if (peakLabel.isNotEmpty()) {
            Text(
                text = "Tus ventas pico: $peakLabel",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
        }

        slots.forEach { slot ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = slot.label,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.width(40.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(20.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    if (slot.fraction > 0f) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(slot.fraction)
                                .height(20.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(MaterialTheme.colorScheme.primary)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${slot.count}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.width(24.dp),
                    textAlign = TextAlign.End
                )
            }
        }
    }
}

@Composable
private fun ResumenMensualSection(content: ReportesContent) {
    NfCard {
        Text(
            text = "Resumen para tu contador",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = content.resumenMes,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(12.dp))

        ResumenRow("Ventas brutas", formatPYG(content.resumenTotalVentas))
        ResumenRow("IVA 10%", formatPYG(content.resumenIva10))
        ResumenRow("IVA 5%", formatPYG(content.resumenIva5))
        ResumenRow("Facturas emitidas", "${content.resumenFacturasEmitidas}")
        ResumenRow("Anuladas", "${content.resumenAnuladas}")

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = { },
            enabled = false,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                disabledContentColor = MaterialTheme.colorScheme.onSurfaceVariant
            )
        ) {
            Text("Exportar resumen \u2014 Proximamente")
        }
    }
}

@Composable
private fun IvaRow(label: String, amount: Long) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(
            text = formatPYG(amount),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}

@Composable
private fun ResumenRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
            fontWeight = FontWeight.SemiBold
        )
    }
}
