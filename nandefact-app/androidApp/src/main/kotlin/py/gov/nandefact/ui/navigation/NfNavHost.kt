package py.gov.nandefact.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import py.gov.nandefact.ui.facturacion.FacturacionWizardScreen
import py.gov.nandefact.ui.home.HomeScreen
import py.gov.nandefact.ui.login.LoginScreen
import py.gov.nandefact.ui.theme.NandefactTheme

@Composable
fun NfNavHost() {
    val navController = rememberNavController()
    var isDarkTheme by rememberSaveable { mutableStateOf(true) }

    // TODO: Verificar token existente para decidir startDestination
    val startDestination = Routes.Login.route

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
                    onLogout = {
                        navController.navigate(Routes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
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
                FacturacionWizardScreen(
                    onClose = { navController.popBackStack() },
                    onNuevaVenta = {
                        // Reemplazar la pantalla actual con una nueva instancia
                        navController.navigate(Routes.Facturacion.route) {
                            popUpTo(Routes.Facturacion.route) { inclusive = true }
                        }
                    }
                )
            }

            // Productos
            composable(Routes.Productos.route) {
                NfScaffold(
                    title = "Productos",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Home.route) { inclusive = true }
                        }
                    },
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onLogout = {
                        navController.navigate(Routes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                ) { paddingValues ->
                    PlaceholderContent(paddingValues, "Productos")
                }
            }

            // Clientes
            composable(Routes.Clientes.route) {
                NfScaffold(
                    title = "Clientes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Home.route) { inclusive = true }
                        }
                    },
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onLogout = {
                        navController.navigate(Routes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                ) { paddingValues ->
                    PlaceholderContent(paddingValues, "Clientes")
                }
            }

            // Historial
            composable(Routes.Historial.route) {
                NfScaffold(
                    title = "Facturas",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Home.route) { inclusive = true }
                        }
                    },
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onLogout = {
                        navController.navigate(Routes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                ) { paddingValues ->
                    PlaceholderContent(paddingValues, "Historial")
                }
            }

            // Pendientes
            composable(Routes.Pendientes.route) {
                NfScaffold(
                    title = "Pendientes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Home.route) { inclusive = true }
                        }
                    },
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onLogout = {
                        navController.navigate(Routes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                ) { paddingValues ->
                    PlaceholderContent(paddingValues, "Pendientes")
                }
            }

            // Reportes
            composable(Routes.Reportes.route) {
                NfScaffold(
                    title = "Reportes",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Home.route) { inclusive = true }
                        }
                    },
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = { navController.navigate(Routes.Config.route) },
                    onLogout = {
                        navController.navigate(Routes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                ) { paddingValues ->
                    PlaceholderContent(paddingValues, "Reportes")
                }
            }

            // Config
            composable(Routes.Config.route) {
                NfScaffold(
                    title = "Configuración",
                    isHome = false,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                    onNavigateHome = {
                        navController.navigate(Routes.Home.route) {
                            popUpTo(Routes.Home.route) { inclusive = true }
                        }
                    },
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateConfig = {},
                    onLogout = {
                        navController.navigate(Routes.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                ) { paddingValues ->
                    PlaceholderContent(paddingValues, "Configuración")
                }
            }
        }
    }
}
