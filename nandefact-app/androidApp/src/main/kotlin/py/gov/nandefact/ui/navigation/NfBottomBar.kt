package py.gov.nandefact.ui.navigation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import py.gov.nandefact.ui.theme.NfTheme

@Composable
fun NfBottomBar(
    currentRoute: String?,
    onNavigateHome: () -> Unit,
    onNavigateFacturas: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isFacturasSelected = currentRoute == Routes.Historial.route ||
        currentRoute?.startsWith("factura_detalle") == true

    val itemColors = NavigationBarItemDefaults.colors(
        selectedIconColor = MaterialTheme.colorScheme.primary,
        selectedTextColor = MaterialTheme.colorScheme.primary,
        unselectedIconColor = NfTheme.colors.textSecondary,
        unselectedTextColor = NfTheme.colors.textSecondary,
        indicatorColor = Color.Transparent
    )

    Column(modifier = modifier.fillMaxWidth()) {
        HorizontalDivider(thickness = 1.dp, color = NfTheme.colors.divider)
        NavigationBar(
            containerColor = NfTheme.colors.navBackground,
            tonalElevation = 0.dp
        ) {
            NavigationBarItem(
                selected = !isFacturasSelected,
                onClick = onNavigateHome,
                icon = {
                    Icon(
                        imageVector = if (!isFacturasSelected) Icons.Filled.Home else Icons.Outlined.Home,
                        contentDescription = "Inicio",
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = {
                    Text(
                        text = "Inicio",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )
                },
                colors = itemColors
            )
            NavigationBarItem(
                selected = isFacturasSelected,
                onClick = onNavigateFacturas,
                icon = {
                    Icon(
                        imageVector = if (isFacturasSelected) Icons.Filled.Description else Icons.Outlined.Description,
                        contentDescription = "Facturas",
                        modifier = Modifier.size(24.dp)
                    )
                },
                label = {
                    Text(
                        text = "Facturas",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )
                },
                colors = itemColors
            )
        }
    }
}
