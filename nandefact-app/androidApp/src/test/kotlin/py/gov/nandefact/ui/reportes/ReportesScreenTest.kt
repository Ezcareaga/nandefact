package py.gov.nandefact.ui.reportes

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
import py.gov.nandefact.TestNandefactApp
import py.gov.nandefact.fakes.FakeAuthPort
import py.gov.nandefact.fakes.FakeFacturaPort
import py.gov.nandefact.shared.domain.usecase.GetReportesUseCase

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], application = TestNandefactApp::class)
@OptIn(ExperimentalCoroutinesApi::class)
class ReportesScreenTest {

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

    @Test
    fun `displays period filter chips without Todo`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(FakeFacturaPort(), FakeAuthPort()))
        advanceUntilIdle()
        composeRule.setContent {
            ReportesScreen(
                paddingValues = PaddingValues(0.dp),
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Hoy").assertIsDisplayed()
        composeRule.onNodeWithText("Semana").assertIsDisplayed()
        composeRule.onNodeWithText("Mes").assertIsDisplayed()
        composeRule.onNodeWithText("Todo").assertDoesNotExist()
    }

    @Test
    fun `shows all 5 section titles`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(FakeFacturaPort(), FakeAuthPort()))
        advanceUntilIdle()
        composeRule.setContent {
            ReportesScreen(
                paddingValues = PaddingValues(0.dp),
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Vista General").assertIsDisplayed()
        composeRule.onNodeWithText("IVA 10%").assertIsDisplayed()
        composeRule.onNodeWithText("IVA 5%").assertIsDisplayed()
        composeRule.onNodeWithText("Productos").assertIsDisplayed()
        composeRule.onNodeWithText("Clientes Frecuentes").assertIsDisplayed()
        composeRule.onNodeWithText("Horario Pico").assertIsDisplayed()
        composeRule.onNodeWithText("Resumen para tu contador").assertIsDisplayed()
    }
}
