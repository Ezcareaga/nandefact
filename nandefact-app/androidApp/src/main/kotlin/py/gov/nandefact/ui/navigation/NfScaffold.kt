package py.gov.nandefact.ui.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import py.gov.nandefact.ui.components.NfBackground
import py.gov.nandefact.ui.components.NfOfflineBanner

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NfScaffold(
    title: String,
    isHome: Boolean,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onNavigateBack: (() -> Unit)?,
    onLogout: () -> Unit,
    isOnlineFlow: StateFlow<Boolean>? = null,
    showBottomBar: Boolean = false,
    currentRoute: String? = null,
    onNavigateHome: () -> Unit = {},
    onNavigateFacturas: () -> Unit = {},
    onNavigateClientes: () -> Unit = {},
    onNavigateProductos: () -> Unit = {},
    onNavigateReportes: () -> Unit = {},
    onNavigateConfig: () -> Unit = {},
    content: @Composable (PaddingValues) -> Unit
) {
    val isOnline = isOnlineFlow?.collectAsState()?.value ?: true

    if (isHome) {
        // Home: con drawer
        val drawerState = rememberDrawerState(DrawerValue.Closed)
        val scope = rememberCoroutineScope()

        ModalNavigationDrawer(
            drawerState = drawerState,
            scrimColor = Color.Black.copy(alpha = 0.6f),
            drawerContent = {
                NfDrawerMenu(
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = onToggleTheme,
                    onNavigateClientes = {
                        scope.launch { drawerState.close() }
                        onNavigateClientes()
                    },
                    onNavigateProductos = {
                        scope.launch { drawerState.close() }
                        onNavigateProductos()
                    },
                    onNavigateReportes = {
                        scope.launch { drawerState.close() }
                        onNavigateReportes()
                    },
                    onNavigateConfig = {
                        scope.launch { drawerState.close() }
                        onNavigateConfig()
                    },
                    onLogout = {
                        scope.launch { drawerState.close() }
                        onLogout()
                    }
                )
            }
        ) {
            NfInnerScaffold(
                title = title,
                isHome = true,
                isOnline = isOnline,
                showBottomBar = showBottomBar,
                currentRoute = currentRoute,
                onNavigateHome = onNavigateHome,
                onNavigateFacturas = onNavigateFacturas,
                onNavigateBack = null,
                onOpenDrawer = { scope.launch { drawerState.open() } },
                content = content
            )
        }
    } else {
        // Pantallas internas: sin drawer
        NfInnerScaffold(
            title = title,
            isHome = false,
            isOnline = isOnline,
            showBottomBar = showBottomBar,
            currentRoute = currentRoute,
            onNavigateHome = onNavigateHome,
            onNavigateFacturas = onNavigateFacturas,
            onNavigateBack = onNavigateBack,
            onOpenDrawer = null,
            content = content
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NfInnerScaffold(
    title: String,
    isHome: Boolean,
    isOnline: Boolean,
    showBottomBar: Boolean,
    currentRoute: String?,
    onNavigateHome: () -> Unit,
    onNavigateFacturas: () -> Unit,
    onNavigateBack: (() -> Unit)?,
    onOpenDrawer: (() -> Unit)?,
    content: @Composable (PaddingValues) -> Unit
) {
    Scaffold(
        topBar = {
            Column {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    },
                    navigationIcon = {
                        if (!isHome && onNavigateBack != null) {
                            IconButton(onClick = onNavigateBack) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                    contentDescription = "Volver",
                                    tint = MaterialTheme.colorScheme.onBackground
                                )
                            }
                        }
                    },
                    actions = {
                        if (isHome && onOpenDrawer != null) {
                            IconButton(onClick = onOpenDrawer) {
                                Icon(
                                    imageVector = Icons.Filled.Menu,
                                    contentDescription = "Menu",
                                    tint = MaterialTheme.colorScheme.onBackground
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background
                    )
                )

                // Banner offline sticky debajo del toolbar
                AnimatedVisibility(
                    visible = !isOnline,
                    enter = expandVertically(),
                    exit = shrinkVertically()
                ) {
                    NfOfflineBanner()
                }
            }
        },
        bottomBar = {
            if (showBottomBar) {
                NfBottomBar(
                    currentRoute = currentRoute,
                    onNavigateHome = onNavigateHome,
                    onNavigateFacturas = onNavigateFacturas
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        NfBackground {
            content(paddingValues)
        }
    }
}
