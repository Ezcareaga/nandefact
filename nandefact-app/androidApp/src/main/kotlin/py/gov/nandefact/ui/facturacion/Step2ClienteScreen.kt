package py.gov.nandefact.ui.facturacion

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import py.gov.nandefact.ui.components.ClienteSelectorItem
import py.gov.nandefact.ui.components.NfClientSelector
import py.gov.nandefact.ui.components.NfPaymentToggle
import py.gov.nandefact.ui.components.PaymentCondition

@Composable
fun Step2ClienteScreen(
    state: FacturacionUiState,
    onClienteSearchChange: (String) -> Unit,
    clientesDisponibles: List<ClienteSelectorItem> = emptyList(),
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

            NfClientSelector(
                clientes = clientesDisponibles,
                searchQuery = state.clienteSearchQuery,
                onSearchChange = onClienteSearchChange,
                onClienteSelected = { selected ->
                    onNombreChange(selected.nombre)
                    onTipoDocChange(selected.tipoDocumento)
                    if (!selected.rucCi.isNullOrBlank()) onRucCiChange(selected.rucCi)
                },
                onSinNombre = onSelectInnominado
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Tipo documento
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(
                    selected = state.cliente.tipoDocumento == "CI",
                    onClick = { onTipoDocChange("CI") },
                    colors = RadioButtonDefaults.colors(
                        selectedColor = MaterialTheme.colorScheme.primary
                    )
                )
                Text("Con CI", color = MaterialTheme.colorScheme.onBackground)

                Spacer(modifier = Modifier.weight(1f))

                RadioButton(
                    selected = state.cliente.tipoDocumento == "RUC",
                    onClick = { onTipoDocChange("RUC") },
                    colors = RadioButtonDefaults.colors(
                        selectedColor = MaterialTheme.colorScheme.primary
                    )
                )
                Text("Con RUC", color = MaterialTheme.colorScheme.onBackground)
            }

            // Campos formulario (si no es innominado)
            if (!state.cliente.isInnominado) {
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state.cliente.rucCi,
                    onValueChange = onRucCiChange,
                    label = { Text(state.cliente.tipoDocumento) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = MaterialTheme.shapes.medium,
                    colors = textFieldColors
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = state.cliente.nombre,
                    onValueChange = onNombreChange,
                    label = { Text("Nombre") },
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

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = state.cliente.guardarCliente,
                        onCheckedChange = onGuardarClienteToggle,
                        colors = CheckboxDefaults.colors(
                            checkedColor = MaterialTheme.colorScheme.primary
                        )
                    )
                    Text(
                        text = "Guardar cliente",
                        color = MaterialTheme.colorScheme.onBackground
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
                    Text("← ATRÁS")
                }
                Button(
                    onClick = onNext,
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
