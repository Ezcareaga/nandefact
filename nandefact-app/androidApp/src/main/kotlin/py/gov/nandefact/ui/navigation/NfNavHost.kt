package py.gov.nandefact.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import org.koin.compose.koinInject
import py.gov.nandefact.shared.domain.ports.NetworkMonitor
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
import py.gov.nandefact.ui.theme.NandefactTheme

@Composable
fun NfNavHost() {
    val navController = rememberNavController()
    var isDarkTheme by rememberSaveable { mutableStateOf(true) }
    val networkMonitor = koinInject<NetworkMonitor>()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // TODO: Verificar token existente para decidir startDestination
    val startDestination = Routes.Login.route

    // Bottom tab: Home
    val navigateHome: () -> Unit = {
        navController.navigate(Routes.Home.route) {
            popUpTo(Routes.Home.route) { inclusive = true }
            launchSingleTop = true
        }
    }

    // Bottom tab: Facturas (= Historial)
    val navigateFacturas: () -> Unit = {
        navController.navigate(Routes.Historial.route) {
            popUpTo(Routes.Home.route) { inclusive = false }
            launchSingleTop = true
        }
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

            // Home — con bottom bar + drawer
            composable(Routes.Home.route) {
                NfScaffold(
                    title = "Comercial El Triunfo",
                    isHome = true,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = null,
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline,
                    showBottomBar = true,
                    currentRoute = currentRoute,
                    onNavigateHome = {},
                    onNavigateFacturas = navigateFacturas,
                    onNavigateClientes = { navController.navigate(Routes.Clientes.route) },
                    onNavigateProductos = { navController.navigate(Routes.Productos.route) },
                    onNavigateReportes = { navController.navigate(Routes.Reportes.route) },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) }
                ) { paddingValues ->
                    HomeScreen(
                        paddingValues = paddingValues,
                        onNavigateFacturacion = { navController.navigate(Routes.Facturacion.route) },
                        onNavigateReportes = { navController.navigate(Routes.Reportes.route) },
                        onNavigateProductos = { navController.navigate(Routes.Productos.route) },
                        onNavigateClientes = { navController.navigate(Routes.Clientes.route) },
                        onNavigatePendientes = { navController.navigate(Routes.Pendientes.route) },
                        onNavigateHistorial = navigateFacturas
                    )
                }
            }

            // Facturacion — full screen modal, sin scaffold
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

            // Productos lista — con bottom bar
            composable(Routes.Productos.route) {
                NfScaffold(
                    title = "Productos",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline,
                    showBottomBar = true,
                    currentRoute = currentRoute,
                    onNavigateHome = navigateHome,
                    onNavigateFacturas = navigateFacturas
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

            // Producto form — sin bottom bar
            composable(Routes.ProductoForm.route) { backStackEntry ->
                val productoId = backStackEntry.arguments?.getString("productoId")
                NfScaffold(
                    title = if (productoId != null && productoId != "new") "Editar producto" else "Nuevo producto",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    ProductoFormScreen(
                        paddingValues = paddingValues,
                        productoId = productoId,
                        onSaveSuccess = { navController.popBackStack() }
                    )
                }
            }

            // Clientes lista — con bottom bar
            composable(Routes.Clientes.route) {
                NfScaffold(
                    title = "Clientes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline,
                    showBottomBar = true,
                    currentRoute = currentRoute,
                    onNavigateHome = navigateHome,
                    onNavigateFacturas = navigateFacturas
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

            // Cliente form — sin bottom bar
            composable(Routes.ClienteForm.route) { backStackEntry ->
                val clienteId = backStackEntry.arguments?.getString("clienteId")
                NfScaffold(
                    title = if (clienteId != null && clienteId != "new") "Editar cliente" else "Nuevo cliente",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    ClienteFormScreen(
                        paddingValues = paddingValues,
                        clienteId = clienteId,
                        onSaveSuccess = { navController.popBackStack() }
                    )
                }
            }

            // Historial — con bottom bar
            composable(Routes.Historial.route) {
                NfScaffold(
                    title = "Facturas",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline,
                    showBottomBar = true,
                    currentRoute = currentRoute,
                    onNavigateHome = navigateHome,
                    onNavigateFacturas = {}
                ) { paddingValues ->
                    HistorialScreen(
                        paddingValues = paddingValues,
                        onFacturaClick = { id ->
                            navController.navigate(Routes.FacturaDetalle.withId(id))
                        }
                    )
                }
            }

            // Factura detalle — sin bottom bar
            composable(Routes.FacturaDetalle.route) { backStackEntry ->
                val facturaId = backStackEntry.arguments?.getString("facturaId") ?: ""
                NfScaffold(
                    title = "Detalle Factura",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    FacturaDetalleScreen(
                        paddingValues = paddingValues,
                        facturaId = facturaId
                    )
                }
            }

            // Pendientes — sin bottom bar
            composable(Routes.Pendientes.route) {
                NfScaffold(
                    title = "Pendientes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline
                ) { paddingValues ->
                    PendientesScreen(paddingValues = paddingValues)
                }
            }

            // Reportes — con bottom bar
            composable(Routes.Reportes.route) {
                NfScaffold(
                    title = "Reportes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
                    onLogout = logout,
                    isOnlineFlow = networkMonitor.isOnline,
                    showBottomBar = true,
                    currentRoute = currentRoute,
                    onNavigateHome = navigateHome,
                    onNavigateFacturas = navigateFacturas
                ) { paddingValues ->
                    ReportesScreen(paddingValues = paddingValues)
                }
            }

            // Config — sin bottom bar
            composable(Routes.Config.route) {
                NfScaffold(
                    title = "Configuracion",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateBack = { navController.popBackStack() },
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
