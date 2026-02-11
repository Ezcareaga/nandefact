package py.gov.nandefact.ui.facturacion

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import py.gov.nandefact.ui.components.NfAmountDisplay
import py.gov.nandefact.ui.components.NfDeliveryButtons
import py.gov.nandefact.ui.theme.NfTheme

@Composable
fun Step4ConfirmacionScreen(
    state: FacturacionUiState,
    onNuevaVenta: () -> Unit,
    onVolverInicio: () -> Unit,
    onWhatsApp: () -> Unit,
    onShowQR: () -> Unit,
    onPrintBluetooth: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.height(48.dp))

        // Ícono éxito
        Icon(
            imageVector = Icons.Filled.CheckCircle,
            contentDescription = null,
            tint = NfTheme.colors.success,
            modifier = Modifier.size(80.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "¡Factura Generada!",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "Factura #${state.facturaNumero}",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(4.dp))

        Row(horizontalArrangement = Arrangement.Center) {
            Text(
                text = "Total: ",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            NfAmountDisplay(
                amount = state.totalBruto,
                style = MaterialTheme.typography.bodyLarge
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Botones de entrega
        NfDeliveryButtons(
            whatsAppEnabled = state.cliente.telefono.isNotBlank(),
            onWhatsApp = onWhatsApp,
            onShowQR = onShowQR,
            onPrintBluetooth = onPrintBluetooth
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Acción principal
        Button(
            onClick = onNuevaVenta,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = MaterialTheme.shapes.medium,
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Text(
                text = "Nueva venta",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedButton(
            onClick = onVolverInicio,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = MaterialTheme.shapes.medium
        ) {
            Text("Volver al inicio")
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
private fun Row(
    horizontalArrangement: Arrangement.Horizontal,
    content: @Composable () -> Unit
) {
    androidx.compose.foundation.layout.Row(
        horizontalArrangement = horizontalArrangement,
        content = { content() }
    )
}
