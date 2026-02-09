package py.gov.nandefact.ui.facturacion

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.koin.androidx.compose.koinViewModel
import py.gov.nandefact.ui.components.NfProgressBar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FacturacionWizardScreen(
    onClose: () -> Unit,
    onNuevaVenta: () -> Unit,
    viewModel: FacturacionViewModel = koinViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            if (!state.isGenerated) {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            text = "Paso ${state.currentStep + 1}/4",
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = {
                            if (state.currentStep > 0) {
                                viewModel.previousStep()
                            } else {
                                onClose()
                            }
                        }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Volver",
                                tint = MaterialTheme.colorScheme.onBackground
                            )
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background
                    )
                )
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Progress bar
            if (!state.isGenerated) {
                NfProgressBar(
                    currentStep = state.currentStep,
                    totalSteps = 4,
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp)
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Step content
            when (state.currentStep) {
                0 -> Step1ProductosScreen(
                    state = state,
                    onSearchChange = viewModel::onSearchQueryChange,
                    onProductTap = viewModel::onProductTap,
                    onQuantityChange = viewModel::onProductQuantityChange,
                    onNext = viewModel::nextStep
                )
                1 -> Step2ClienteScreen(
                    state = state,
                    onClienteSearchChange = viewModel::onClienteSearchChange,
                    onSelectInnominado = viewModel::onSelectInnominado,
                    onTipoDocChange = viewModel::onClienteTipoDocChange,
                    onRucCiChange = viewModel::onClienteRucCiChange,
                    onNombreChange = viewModel::onClienteNombreChange,
                    onTelefonoChange = viewModel::onClienteTelefonoChange,
                    onGuardarClienteToggle = viewModel::onGuardarClienteToggle,
                    onCondicionPagoChange = viewModel::onCondicionPagoChange,
                    onNext = viewModel::nextStep,
                    onBack = viewModel::previousStep
                )
                2 -> Step3PreviewScreen(
                    state = state,
                    onGenerarFactura = viewModel::onGenerarFactura,
                    onBack = viewModel::previousStep
                )
                3 -> Step4ConfirmacionScreen(
                    state = state,
                    onNuevaVenta = {
                        viewModel.resetWizard()
                        onNuevaVenta()
                    },
                    onVolverInicio = onClose,
                    onWhatsApp = { /* TODO */ },
                    onShowQR = { /* TODO */ },
                    onPrintBluetooth = { /* TODO */ }
                )
            }
        }
    }
}
