package py.gov.nandefact.ui.home

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
import py.gov.nandefact.fakes.FakeAuthPort
import py.gov.nandefact.fakes.FakeFacturaPort
import py.gov.nandefact.shared.domain.usecase.GetHomeDataUseCase

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
@OptIn(ExperimentalCoroutinesApi::class)
class HomeScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun setContent(vm: HomeViewModel) {
        composeRule.setContent {
            HomeScreen(
                paddingValues = PaddingValues(0.dp),
                onNavigateFacturacion = {},
                onNavigateReportes = {},
                onNavigateProductos = {},
                onNavigateClientes = {},
                onNavigatePendientes = {},
                viewModel = vm
            )
        }
    }

    @Test
    fun `displays greeting with user name`() = runTest {
        val vm = HomeViewModel(GetHomeDataUseCase(FakeAuthPort(), FakeFacturaPort()))
        advanceUntilIdle()
        setContent(vm)
        composeRule.waitForIdle()

        // El saludo contiene el nombre del usuario
        composeRule.onNodeWithText("Hola, María Demo \uD83D\uDC4B").assertIsDisplayed()
    }

    @Test
    fun `shows GENERAR FACTURA hero card`() = runTest {
        val vm = HomeViewModel(GetHomeDataUseCase(FakeAuthPort(), FakeFacturaPort()))
        advanceUntilIdle()
        setContent(vm)
        composeRule.waitForIdle()

        composeRule.onNodeWithText("GENERAR FACTURA").assertIsDisplayed()
    }

    @Test
    fun `shows grid cards for Reportes, Productos, Clientes, Pendientes`() = runTest {
        val vm = HomeViewModel(GetHomeDataUseCase(FakeAuthPort(), FakeFacturaPort()))
        advanceUntilIdle()
        setContent(vm)
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Reportes").assertIsDisplayed()
        composeRule.onNodeWithText("Productos").assertIsDisplayed()
        composeRule.onNodeWithText("Clientes").assertIsDisplayed()
        composeRule.onNodeWithText("Pendientes").assertIsDisplayed()
    }
}
