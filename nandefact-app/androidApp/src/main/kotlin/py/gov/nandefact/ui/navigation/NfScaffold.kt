package py.gov.nandefact.ui.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import py.gov.nandefact.ui.components.NfBackground
import py.gov.nandefact.ui.theme.NfTheme
import py.gov.nandefact.ui.components.NfHomePill
import py.gov.nandefact.ui.components.NfOfflineBanner

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NfScaffold(
    title: String,
    isHome: Boolean,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onNavigateHome: () -> Unit,
    onNavigateBack: (() -> Unit)?,
    onNavigateConfig: () -> Unit,
    onNavigateHistorial: () -> Unit = {},
    onLogout: () -> Unit,
    isOnlineFlow: StateFlow<Boolean>? = null,
    content: @Composable (PaddingValues) -> Unit
) {
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val isOnline = isOnlineFlow?.collectAsState()?.value ?: true

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            NfDrawerMenu(
                isDarkTheme = isDarkTheme,
                onToggleTheme = {
                    onToggleTheme()
                    scope.launch { drawerState.close() }
                },
                onNavigateConfig = {
                    scope.launch { drawerState.close() }
                    onNavigateConfig()
                },
                onNavigateHistorial = {
                    scope.launch { drawerState.close() }
                    onNavigateHistorial()
                },
                onLogout = {
                    scope.launch { drawerState.close() }
                    onLogout()
                }
            )
        }
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
                            IconButton(onClick = {
                                scope.launch { drawerState.open() }
                            }) {
                                Icon(
                                    imageVector = Icons.Filled.Menu,
                                    contentDescription = "Menu",
                                    tint = MaterialTheme.colorScheme.onBackground
                                )
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
            containerColor = MaterialTheme.colorScheme.background
        ) { paddingValues ->
            NfBackground {
                Box(modifier = Modifier.fillMaxSize()) {
                    content(paddingValues)

                    // Pill Home — oculta en Home
                    if (!isHome) {
                        NfHomePill(
                            onClick = onNavigateHome,
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(paddingValues)
                        )
                    }
                }
            }
        }
    }
}
