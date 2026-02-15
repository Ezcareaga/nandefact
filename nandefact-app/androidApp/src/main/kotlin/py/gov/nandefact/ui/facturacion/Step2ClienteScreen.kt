package py.gov.nandefact.ui.facturacion

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import py.gov.nandefact.shared.domain.Cliente
import py.gov.nandefact.ui.components.ClienteSelectorItem
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfClientSelector
import py.gov.nandefact.ui.components.NfPaymentToggle
import py.gov.nandefact.ui.components.PaymentCondition

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Step2ClienteScreen(
    state: FacturacionUiState,
    onClienteSearchChange: (String) -> Unit,
    clientesDisponibles: List<ClienteSelectorItem> = emptyList(),
    clienteTab: ClienteTab = ClienteTab.CI,
    showInlineForm: Boolean = false,
    onClienteTabChange: (ClienteTab) -> Unit = {},
    onSelectClienteFromList: (Cliente) -> Unit = {},
    onClearClienteSelection: () -> Unit = {},
    onSelectInnominado: () -> Unit,
    onTipoDocChange: (String) -> Unit,
    onRucCiChange: (String) -> Unit,
    onNombreChange: (String) -> Unit,
    onTelefonoChange: (String) -> Unit,
    onGuardarClienteToggle: (Boolean) -> Unit,
    onCondicionPagoChange: (PaymentCondition) -> Unit,
    onNext: () -> Unit,
    onBack: () -> Unit
) {
    val textFieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = MaterialTheme.colorScheme.primary,
        unfocusedBorderColor = MaterialTheme.colorScheme.outline,
        focusedContainerColor = MaterialTheme.colorScheme.surface,
        unfocusedContainerColor = MaterialTheme.colorScheme.surface,
        cursorColor = MaterialTheme.colorScheme.primary
    )

    // Cliente ya seleccionado (de la lista o innominado con id asignado)
    val clienteSelected = state.cliente.id != null || state.cliente.isInnominado

    Column(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            // Sección cliente
            Text(
                text = "CLIENTE",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(vertical = 12.dp)
            )

            // Tabs segmentados: CI / RUC / Sin Datos
            val tabs = listOf(ClienteTab.CI, ClienteTab.RUC, ClienteTab.SIN_DATOS)
            val tabLabels = listOf("CI", "RUC", "Sin Datos")
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                tabs.forEachIndexed { index, tab ->
                    SegmentedButton(
                        selected = clienteTab == tab,
                        onClick = { onClienteTabChange(tab) },
                        shape = SegmentedButtonDefaults.itemShape(
                            index = index,
                            count = tabs.size
                        )
                    ) {
                        Text(tabLabels[index])
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            when (clienteTab) {
                ClienteTab.CI, ClienteTab.RUC -> {
                    if (clienteSelected && !state.cliente.isInnominado) {
                        // Mostrar cliente seleccionado con opción de cambiar
                        NfCard {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = state.cliente.nombre,
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onBackground
                                    )
                                    if (state.cliente.rucCi.isNotBlank()) {
                                        Text(
                                            text = "${state.cliente.tipoDocumento}: ${state.cliente.rucCi}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(onClick = onClearClienteSelection) {
                            Text("Cambiar cliente")
                        }
                    } else {
                        // Búsqueda y selección de clientes
                        NfClientSelector(
                            clientes = clientesDisponibles,
                            searchQuery = state.clienteSearchQuery,
                            onSearchChange = onClienteSearchChange,
                            onClienteSelected = { selected ->
                                // Buscar el Cliente original en la lista de resultados
                                val clienteOriginal = state.clientesResults.find { it.id == selected.id }
                                if (clienteOriginal != null) {
                                    onSelectClienteFromList(clienteOriginal)
                                } else {
                                    onNombreChange(selected.nombre)
                                    onTipoDocChange(selected.tipoDocumento)
                                    if (!selected.rucCi.isNullOrBlank()) onRucCiChange(selected.rucCi)
                                }
                            },
                            onSinNombre = onSelectInnominado
                        )

                        // Formulario inline cuando no hay resultados de búsqueda
                        if (showInlineForm && state.clienteSearchQuery.isNotBlank()) {
                            Spacer(modifier = Modifier.height(16.dp))

                            Text(
                                text = "NUEVO CLIENTE",
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(bottom = 12.dp)
                            )

                            // Documento pre-llenado con la búsqueda
                            OutlinedTextField(
                                value = state.clienteSearchQuery,
                                onValueChange = {},
                                label = { Text(if (clienteTab == ClienteTab.CI) "CI" else "RUC") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                readOnly = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                shape = MaterialTheme.shapes.medium,
                                colors = textFieldColors
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            OutlinedTextField(
                                value = state.cliente.nombre,
                                onValueChange = onNombreChange,
                                label = { Text("Nombre *") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                shape = MaterialTheme.shapes.medium,
                                colors = textFieldColors
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "+595 ",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(end = 8.dp)
                                )
                                OutlinedTextField(
                                    value = state.cliente.telefono,
                                    onValueChange = onTelefonoChange,
                                    label = { Text("Teléfono") },
                                    modifier = Modifier.fillMaxWidth(),
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                    shape = MaterialTheme.shapes.medium,
                                    colors = textFieldColors
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(
                                    checked = state.cliente.guardarCliente,
                                    onCheckedChange = onGuardarClienteToggle,
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = MaterialTheme.colorScheme.primary
                                    )
                                )
                                Text(
                                    text = "Guardar en mis clientes",
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                            }
                        }
                    }
                }

                ClienteTab.SIN_DATOS -> {
                    // Consumidor Final auto-seleccionado
                    NfCard {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(24.dp)
                                )
                                Text(
                                    text = "Consumidor Final",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                            }
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Sin datos de cliente. No se enviará KuDE por WhatsApp.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Condición de pago
            Text(
                text = "CONDICIÓN DE PAGO",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            NfPaymentToggle(
                selected = state.condicionPago,
                onSelect = onCondicionPagoChange
            )

            Spacer(modifier = Modifier.height(80.dp))
        }

        // Bottom actions
        HorizontalDivider(color = MaterialTheme.colorScheme.outline)
        Surface(color = MaterialTheme.colorScheme.surface) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                OutlinedButton(
                    onClick = onBack,
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text("← Atrás")
                }
                Button(
                    onClick = onNext,
                    shape = MaterialTheme.shapes.medium,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text("Siguiente →")
                }
            }
        }
    }
}
