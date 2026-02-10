package py.gov.nandefact.ui.productos

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
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
import py.gov.nandefact.TestNandefactApp
import py.gov.nandefact.fakes.FakeAuthPort
import py.gov.nandefact.fakes.FakeProductoPort
import py.gov.nandefact.shared.domain.usecase.GetProductosUseCase
import py.gov.nandefact.shared.domain.usecase.SaveProductoUseCase

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], application = TestNandefactApp::class)
@OptIn(ExperimentalCoroutinesApi::class)
class ProductoFormScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authPort: FakeAuthPort
    private lateinit var productoPort: FakeProductoPort

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        authPort = FakeAuthPort()
        productoPort = FakeProductoPort(TestData.productos(3))
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createVm() = ProductosViewModel(
        getProductos = GetProductosUseCase(productoPort, authPort),
        saveProducto = SaveProductoUseCase(productoPort, authPort)
    )

    @Test
    fun `displays all form fields`() = runTest {
        val vm = createVm()
        advanceUntilIdle()
        composeRule.setContent {
            ProductoFormScreen(
                paddingValues = PaddingValues(0.dp),
                productoId = "new",
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Nombre *").assertIsDisplayed()
        composeRule.onNodeWithText("Precio unitario (Gs) *").assertIsDisplayed()
        composeRule.onNodeWithText("Unidad de medida").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Tasa IVA").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Categoría").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `shows Guardar button for new product`() = runTest {
        val vm = createVm()
        advanceUntilIdle()
        composeRule.setContent {
            ProductoFormScreen(
                paddingValues = PaddingValues(0.dp),
                productoId = "new",
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Guardar").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `shows Actualizar button for editing`() = runTest {
        val vm = createVm()
        advanceUntilIdle()
        val prodId = TestData.productos(3).first().id
        vm.loadForEdit(prodId)
        advanceUntilIdle()

        composeRule.setContent {
            ProductoFormScreen(
                paddingValues = PaddingValues(0.dp),
                productoId = prodId,
                viewModel = vm
            )
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Actualizar").performScrollTo().assertIsDisplayed()
    }
}
