package py.gov.nandefact.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import py.gov.nandefact.ui.theme.NfExtendedColors

@Composable
fun NfOfflineBanner(
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(NfExtendedColors.warningContainer)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Filled.WifiOff,
            contentDescription = null,
            tint = NfExtendedColors.warning,
            modifier = Modifier.padding(end = 8.dp)
        )
        Text(
            text = "Sin conexión — las facturas se guardan localmente",
            style = MaterialTheme.typography.bodySmall,
            color = NfExtendedColors.warning
        )
    }
}
