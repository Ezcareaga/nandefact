package py.gov.nandefact.ui.config

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import py.gov.nandefact.ui.components.NfCard
import py.gov.nandefact.ui.components.NfStatusDot
import py.gov.nandefact.ui.theme.NfSuccess

@Composable
fun ConfigScreen(
    paddingValues: PaddingValues
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(paddingValues)
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Datos comercio
        NfCard {
            Icon(
                imageVector = Icons.Filled.Business,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Datos del Comercio",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(4.dp))
            ConfigRow("RUC", "80069563-1")
            ConfigRow("Razón Social", "Comercial El Triunfo")
            ConfigRow("Establecimiento", "001")
            ConfigRow("Punto de Expedición", "001")
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Certificado
        NfCard {
            Icon(
                imageVector = Icons.Filled.Security,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Certificado Digital (CCFE)",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(4.dp))
            ConfigRow("Estado", "Cargado")
            ConfigRow("Vencimiento", "15/12/2027")
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Estado SIFEN
        NfCard {
            Icon(
                imageVector = Icons.Filled.CloudDone,
                contentDescription = null,
                tint = NfSuccess
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Estado SIFEN",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.height(4.dp))
            ConfigRow("Ambiente", "Test")
            ConfigRow("Timbrado", "12345678")
            ConfigRow("Vigencia", "01/01/2026 — 31/12/2026")
        }

        Spacer(modifier = Modifier.height(80.dp))
    }
}

@Composable
private fun ConfigRow(label: String, value: String) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}
