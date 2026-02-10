package py.gov.nandefact.ui.facturas

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
import py.gov.nandefact.shared.domain.usecase.GetFacturasUseCase

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33])
@OptIn(ExperimentalCoroutinesApi::class)
class HistorialScreenTest {

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
    fun `displays filter chips`() = runTest {
        val vm = HistorialViewModel(GetFacturasUseCase(FakeFacturaPort(), FakeAuthPort()))
        advanceUntilIdle()
        composeRule.setContent {
            HistorialScreen(
                paddingValues = PaddingValues(0.dp),
                onFacturaClick = {},
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Hoy").assertIsDisplayed()
        composeRule.onNodeWithText("Semana").assertIsDisplayed()
        composeRule.onNodeWithText("Mes").assertIsDisplayed()
        composeRule.onNodeWithText("Todo").assertIsDisplayed()
    }

    @Test
    fun `shows sample facturas when empty`() = runTest {
        // Con facturas vacías, el VM carga sampleFacturas()
        val vm = HistorialViewModel(GetFacturasUseCase(FakeFacturaPort(), FakeAuthPort()))
        advanceUntilIdle()
        composeRule.setContent {
            HistorialScreen(
                paddingValues = PaddingValues(0.dp),
                onFacturaClick = {},
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        // sampleFacturas incluye "Juan Pérez"
        composeRule.onNodeWithText("Juan Pérez").assertIsDisplayed()
    }
}
