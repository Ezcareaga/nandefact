package py.gov.nandefact.ui.productos

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductoFormScreen(
    paddingValues: PaddingValues,
    viewModel: ProductosViewModel = viewModel()
) {
    val state by viewModel.formState.collectAsState()
    var unidadExpanded by remember { mutableStateOf(false) }
    val unidades = listOf("unidad", "kg", "litro", "docena")

    val textFieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = MaterialTheme.colorScheme.primary,
        unfocusedBorderColor = MaterialTheme.colorScheme.outline,
        focusedContainerColor = MaterialTheme.colorScheme.surface,
        unfocusedContainerColor = MaterialTheme.colorScheme.surface,
        cursorColor = MaterialTheme.colorScheme.primary
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Nombre
        OutlinedTextField(
            value = state.nombre,
            onValueChange = viewModel::onNombreChange,
            label = { Text("Nombre *") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = textFieldColors
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Precio
        OutlinedTextField(
            value = state.precioUnitario,
            onValueChange = viewModel::onPrecioChange,
            label = { Text("Precio unitario (Gs) *") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = MaterialTheme.shapes.medium,
            colors = textFieldColors
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Unidad de medida dropdown
        ExposedDropdownMenuBox(
            expanded = unidadExpanded,
            onExpandedChange = { unidadExpanded = !unidadExpanded }
        ) {
            OutlinedTextField(
                value = state.unidadMedida,
                onValueChange = {},
                readOnly = true,
                label = { Text("Unidad de medida") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = unidadExpanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                shape = MaterialTheme.shapes.medium,
                colors = textFieldColors
            )
            ExposedDropdownMenu(
                expanded = unidadExpanded,
                onDismissRequest = { unidadExpanded = false }
            ) {
                unidades.forEach { unidad ->
                    DropdownMenuItem(
                        text = { Text(unidad) },
                        onClick = {
                            viewModel.onUnidadChange(unidad)
                            unidadExpanded = false
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Tasa IVA
        Text(
            text = "Tasa IVA",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))

        listOf(10 to "10%", 5 to "5%", 0 to "Exenta").forEach { (tasa, label) ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                RadioButton(
                    selected = state.tasaIva == tasa,
                    onClick = { viewModel.onTasaIvaChange(tasa) },
                    colors = RadioButtonDefaults.colors(
                        selectedColor = MaterialTheme.colorScheme.primary
                    )
                )
                Text(
                    text = label,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Categoría
        OutlinedTextField(
            value = state.categoria,
            onValueChange = viewModel::onCategoriaChange,
            label = { Text("Categoría") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            shape = MaterialTheme.shapes.medium,
            colors = textFieldColors
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Guardar
        Button(
            onClick = viewModel::onSave,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            enabled = state.nombre.isNotBlank() && state.precioUnitario.isNotBlank(),
            shape = MaterialTheme.shapes.medium,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text(
                text = if (state.isEditing) "Actualizar" else "Guardar",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}
