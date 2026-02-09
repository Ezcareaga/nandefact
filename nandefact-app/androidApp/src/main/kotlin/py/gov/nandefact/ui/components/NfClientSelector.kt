package py.gov.nandefact.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class ClienteSelectorItem(
    val id: String,
    val nombre: String,
    val rucCi: String?,
    val tipoDocumento: String
)

@Composable
fun NfClientSelector(
    clientes: List<ClienteSelectorItem>,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    onClienteSelected: (ClienteSelectorItem) -> Unit,
    onSinNombre: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        NfSearchBar(
            query = searchQuery,
            onQueryChange = onSearchChange,
            placeholder = "Buscar por nombre o CI/RUC..."
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Boton SIN NOMBRE
        OutlinedButton(
            onClick = onSinNombre,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = MaterialTheme.shapes.medium,
            border = ButtonDefaults.outlinedButtonBorder(enabled = true)
        ) {
            Text(
                text = "SIN NOMBRE",
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Lista filtrada de clientes existentes
        if (clientes.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            LazyColumn(
                modifier = Modifier.height(200.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                items(clientes, key = { it.id }) { cliente ->
                    NfCard(
                        onClick = { onClienteSelected(cliente) }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = cliente.nombre,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.weight(1f)
                            )
                            if (!cliente.rucCi.isNullOrBlank()) {
                                Text(
                                    text = "${cliente.tipoDocumento}: ${cliente.rucCi}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
