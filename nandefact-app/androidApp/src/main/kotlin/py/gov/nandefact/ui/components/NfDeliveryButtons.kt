package py.gov.nandefact.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

@Composable
fun NfDeliveryButtons(
    whatsAppEnabled: Boolean,
    onWhatsApp: () -> Unit,
    onShowQR: () -> Unit,
    onPrintBluetooth: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        DeliveryButton(
            icon = Icons.Filled.Phone,
            label = "Enviar por WhatsApp",
            enabled = whatsAppEnabled,
            onClick = onWhatsApp
        )
        DeliveryButton(
            icon = Icons.Filled.QrCode,
            label = "Mostrar QR",
            enabled = true,
            onClick = onShowQR
        )
        DeliveryButton(
            icon = Icons.Filled.Bluetooth,
            label = "Imprimir Bluetooth",
            enabled = true,
            onClick = onPrintBluetooth
        )
    }
}

@Composable
private fun DeliveryButton(
    icon: ImageVector,
    label: String,
    enabled: Boolean,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        shape = MaterialTheme.shapes.medium
    ) {
        Icon(imageVector = icon, contentDescription = null)
        Spacer(modifier = Modifier.width(8.dp))
        Text(text = label)
    }
}
