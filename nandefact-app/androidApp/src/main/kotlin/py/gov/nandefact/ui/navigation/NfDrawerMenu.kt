package py.gov.nandefact.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.NavigationDrawerItemDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import py.gov.nandefact.ui.theme.NfTheme

@Composable
fun NfDrawerMenu(
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onNavigateClientes: () -> Unit,
    onNavigateProductos: () -> Unit,
    onNavigateReportes: () -> Unit,
    onNavigateConfig: () -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    ModalDrawerSheet(
        modifier = modifier
            .width(280.dp)
            .fillMaxHeight(),
        drawerContainerColor = NfTheme.colors.navBackground
    ) {
        // Header: avatar + nombre comercio + RUC
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 24.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "CE",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onPrimary,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Comercial El Triunfo",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "RUC: 80069563-1",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        HorizontalDivider(color = NfTheme.colors.divider)
        Spacer(modifier = Modifier.height(8.dp))

        val drawerColors = NavigationDrawerItemDefaults.colors(
            unselectedContainerColor = NfTheme.colors.navBackground,
            unselectedTextColor = MaterialTheme.colorScheme.onBackground,
            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant
        )

        // Navegacion
        NavigationDrawerItem(
            icon = { Icon(Icons.Filled.People, contentDescription = null) },
            label = { Text("Clientes") },
            selected = false,
            onClick = onNavigateClientes,
            colors = drawerColors,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        NavigationDrawerItem(
            icon = { Icon(Icons.Filled.Inventory2, contentDescription = null) },
            label = { Text("Productos") },
            selected = false,
            onClick = onNavigateProductos,
            colors = drawerColors,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        NavigationDrawerItem(
            icon = { Icon(Icons.Filled.BarChart, contentDescription = null) },
            label = { Text("Reportes") },
            selected = false,
            onClick = onNavigateReportes,
            colors = drawerColors,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))
        HorizontalDivider(color = NfTheme.colors.divider)
        Spacer(modifier = Modifier.height(8.dp))

        // Dark/Light toggle con Switch inline
        NavigationDrawerItem(
            icon = {
                Icon(
                    if (isDarkTheme) Icons.Filled.DarkMode else Icons.Filled.LightMode,
                    contentDescription = null
                )
            },
            label = { Text(if (isDarkTheme) "Modo oscuro" else "Modo claro") },
            badge = {
                Switch(
                    checked = isDarkTheme,
                    onCheckedChange = { onToggleTheme() },
                    colors = SwitchDefaults.colors(
                        checkedTrackColor = MaterialTheme.colorScheme.primary
                    )
                )
            },
            selected = false,
            onClick = onToggleTheme,
            colors = drawerColors,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        NavigationDrawerItem(
            icon = { Icon(Icons.Filled.Settings, contentDescription = null) },
            label = { Text("Config SIFEN") },
            selected = false,
            onClick = onNavigateConfig,
            colors = drawerColors,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        // TODO: Solo visible si rol=dueño
        NavigationDrawerItem(
            icon = { Icon(Icons.Filled.Group, contentDescription = null) },
            label = { Text("Usuarios / Equipo") },
            selected = false,
            onClick = { /* TODO: Pantalla equipo */ },
            colors = drawerColors,
            modifier = Modifier.padding(horizontal = 12.dp)
        )

        Spacer(modifier = Modifier.weight(1f))
        HorizontalDivider(color = NfTheme.colors.divider)
        Spacer(modifier = Modifier.height(8.dp))

        // Footer: Cerrar sesion
        NavigationDrawerItem(
            icon = {
                Icon(
                    Icons.AutoMirrored.Filled.Logout,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error
                )
            },
            label = {
                Text(
                    "Cerrar sesion",
                    color = MaterialTheme.colorScheme.error
                )
            },
            selected = false,
            onClick = onLogout,
            colors = drawerColors,
            modifier = Modifier.padding(horizontal = 12.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
    }
}
