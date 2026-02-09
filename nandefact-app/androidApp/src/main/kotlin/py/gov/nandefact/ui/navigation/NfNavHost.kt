package py.gov.nandefact.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import py.gov.nandefact.ui.clientes.ClienteFormScreen
import py.gov.nandefact.ui.clientes.ClientesListScreen
import py.gov.nandefact.ui.config.ConfigScreen
import py.gov.nandefact.ui.facturacion.FacturacionWizardScreen
import py.gov.nandefact.ui.facturas.FacturaDetalleScreen
import py.gov.nandefact.ui.facturas.HistorialScreen
import py.gov.nandefact.ui.home.HomeScreen
import py.gov.nandefact.ui.login.LoginScreen
import py.gov.nandefact.ui.pendientes.PendientesScreen
import py.gov.nandefact.ui.productos.ProductoFormScreen
import py.gov.nandefact.ui.productos.ProductosListScreen
import py.gov.nandefact.ui.reportes.ReportesScreen
import androidx.compose.runtime.collectAsState
import org.koin.compose.koinInject
import py.gov.nandefact.shared.sync.NetworkMonitor
import py.gov.nandefact.ui.theme.NandefactTheme

@Composable
fun NfNavHost() {
    val navController = rememberNavController()
    var isDarkTheme by rememberSaveable { mutableStateOf(true) }
    val networkMonitor = koinInject<NetworkMonitor>()

    // TODO: Verificar token existente para decidir startDestination
    val startDestination = Routes.Login.route

    // Helper para crear scaffold con parámetros comunes
    val navigateHome: () -> Unit = {
        navController.navigate(Routes.Home.route) {
            popUpTo(Routes.Home.route) { inclusive = true }
        }
    }
    val navigateHistorial: () -> Unit = {
        navController.navigate(Routes.Historial.route)
    }
    val logout: () -> Unit = {
        navController.navigate(Routes.Login.route) {
            popUpTo(0) { inclusive = true }
        }
    }

    NandefactTheme(darkTheme = isDarkTheme) {
        NavHost(
            navController = navController,
            startDestination = startDestination
        ) {
            // Login — full screen, sin scaffold
            composable(Routes.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            // Home
            composable(Routes.Home.route) {
                NfScaffold(
                    title = "Comercial El Triunfo",
                    isHome = true,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = {},
                    onNavigateBack = null,
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    HomeScreen(
                        paddingValues = paddingValues,
                        onNavigateFacturacion = { navController.navigate(Routes.Facturacion.route) },
                        onNavigateReportes = { navController.navigate(Routes.Reportes.route) },
                        onNavigateProductos = { navController.navigate(Routes.Productos.route) },
                        onNavigateClientes = { navController.navigate(Routes.Clientes.route) },
                        onNavigatePendientes = { navController.navigate(Routes.Pendientes.route) }
                    )
                }
            }

            // Facturación — full screen modal, sin scaffold
            composable(Routes.Facturacion.route) {
                val isOnline by networkMonitor.isOnline.collectAsState()
                FacturacionWizardScreen(
                    onClose = { navController.popBackStack() },
                    isOnline = isOnline,
                    onNuevaVenta = {
                        navController.navigate(Routes.Facturacion.route) {
                            popUpTo(Routes.Facturacion.route) { inclusive = true }
                        }
                    }
                )
            }

            // Productos lista
            composable(Routes.Productos.route) {
                NfScaffold(
                    title = "Productos",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    ProductosListScreen(
                        paddingValues = paddingValues,
                        onProductoClick = { id ->
                            navController.navigate(Routes.ProductoForm.edit(id))
                        },
                        onCreateClick = {
                            navController.navigate(Routes.ProductoForm.create())
                        }
                    )
                }
            }

            // Producto form (crear/editar)
            composable(Routes.ProductoForm.route) {
                NfScaffold(
                    title = "Producto",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    ProductoFormScreen(paddingValues = paddingValues)
                }
            }

            // Clientes lista
            composable(Routes.Clientes.route) {
                NfScaffold(
                    title = "Clientes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    ClientesListScreen(
                        paddingValues = paddingValues,
                        onClienteClick = { id ->
                            navController.navigate(Routes.ClienteForm.edit(id))
                        },
                        onCreateClick = {
                            navController.navigate(Routes.ClienteForm.create())
                        }
                    )
                }
            }

            // Cliente form (crear/editar)
            composable(Routes.ClienteForm.route) {
                NfScaffold(
                    title = "Cliente",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    ClienteFormScreen(paddingValues = paddingValues)
                }
            }

            // Historial
            composable(Routes.Historial.route) {
                NfScaffold(
                    title = "Facturas",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    HistorialScreen(
                        paddingValues = paddingValues,
                        onFacturaClick = { id ->
                            navController.navigate(Routes.FacturaDetalle.withId(id))
                        }
                    )
                }
            }

            // Factura detalle
            composable(Routes.FacturaDetalle.route) { backStackEntry ->
                val facturaId = backStackEntry.arguments?.getString("facturaId") ?: ""
                NfScaffold(
                    title = "Detalle Factura",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    FacturaDetalleScreen(
                        paddingValues = paddingValues,
                        facturaId = facturaId
                    )
                }
            }

            // Pendientes
            composable(Routes.Pendientes.route) {
                NfScaffold(
                    title = "Pendientes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    PendientesScreen(paddingValues = paddingValues)
                }
            }

            // Reportes
            composable(Routes.Reportes.route) {
                NfScaffold(
                    title = "Reportes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    ReportesScreen(paddingValues = paddingValues)
                }
            }

            // Config
            composable(Routes.Config.route) {
                NfScaffold(
                    title = "Configuración",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = navigateHome,
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = {},
                    onNavigateHistorial = navigateHistorial,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    ConfigScreen(
                        paddingValues = paddingValues,
                        isDarkTheme = isDarkTheme,
                        onToggleTheme = { isDarkTheme = !isDarkTheme },
                        onLogout = logout
                    )
                }
            }
        }
    }
}
