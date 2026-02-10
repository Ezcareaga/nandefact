package py.gov.nandefact.ui.clientes

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import py.gov.nandefact.TestData
import py.gov.nandefact.fakes.FakeAuthPort
import py.gov.nandefact.fakes.FakeClientePort
import py.gov.nandefact.shared.domain.usecase.GetClientesUseCase
import py.gov.nandefact.shared.domain.usecase.SaveClienteUseCase

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
@OptIn(ExperimentalCoroutinesApi::class)
class ClienteFormScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authPort: FakeAuthPort
    private lateinit var clientePort: FakeClientePort

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        authPort = FakeAuthPort()
        clientePort = FakeClientePort(TestData.clientes(3))
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createVm() = ClientesViewModel(
        getClientes = GetClientesUseCase(clientePort, authPort),
        saveCliente = SaveClienteUseCase(clientePort, authPort)
    )

    @Test
    fun `displays all form fields including WhatsApp toggle`() = runTest {
        val vm = createVm()
        advanceUntilIdle()
        composeRule.setContent {
            ClienteFormScreen(
                paddingValues = PaddingValues(0.dp),
                clienteId = "new",
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Nombre *").assertIsDisplayed()
        composeRule.onNodeWithText("Tipo de documento").assertIsDisplayed()
        composeRule.onNodeWithText("Enviar WhatsApp automático").assertIsDisplayed()
    }

    @Test
    fun `shows Guardar button for new client`() = runTest {
        val vm = createVm()
        advanceUntilIdle()
        composeRule.setContent {
            ClienteFormScreen(
                paddingValues = PaddingValues(0.dp),
                clienteId = "new",
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Guardar").assertIsDisplayed()
    }

    @Test
    fun `shows Actualizar button for editing`() = runTest {
        val vm = createVm()
        advanceUntilIdle()
        val cliId = TestData.clientes(3).first().id
        vm.loadForEdit(cliId)
        advanceUntilIdle()

        composeRule.setContent {
            ClienteFormScreen(
                paddingValues = PaddingValues(0.dp),
                clienteId = cliId,
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Actualizar").assertIsDisplayed()
    }
}
