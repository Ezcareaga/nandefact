package py.gov.nandefact.ui.facturacion

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import py.gov.nandefact.TestData
import py.gov.nandefact.fakes.FakeAuthPort
import py.gov.nandefact.fakes.FakeClientePort
import py.gov.nandefact.fakes.FakeFacturaPort
import py.gov.nandefact.fakes.FakeProductoPort
import py.gov.nandefact.shared.domain.usecase.CrearFacturaLocalUseCase
import py.gov.nandefact.shared.domain.usecase.GetProductosUseCase
import py.gov.nandefact.shared.domain.usecase.SaveClienteUseCase
import py.gov.nandefact.ui.common.UiState

@OptIn(ExperimentalCoroutinesApi::class)
class FacturacionViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authPort: FakeAuthPort
    private lateinit var productoPort: FakeProductoPort
    private lateinit var facturaPort: FakeFacturaPort
    private lateinit var clientePort: FakeClientePort
    private lateinit var vm: FacturacionViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        authPort = FakeAuthPort()
        productoPort = FakeProductoPort(TestData.productos(5))
        facturaPort = FakeFacturaPort()
        clientePort = FakeClientePort()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createVm(): FacturacionViewModel {
        return FacturacionViewModel(
            getProductos = GetProductosUseCase(productoPort, authPort),
            crearFacturaLocal = CrearFacturaLocalUseCase(facturaPort, authPort),
            saveCliente = SaveClienteUseCase(clientePort, authPort)
        )
    }

    @Test
    fun `init loads productos from use case`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        assertEquals(5, vm.uiState.value.productos.size)
        assertTrue(vm.uiState.value.productsState is UiState.Success)
    }

    @Test
    fun `onProductTap increments quantity by 1`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val prodId = vm.uiState.value.productos.first().id
        vm.onProductTap(prodId)
        assertEquals(1, vm.uiState.value.productos.first { it.id == prodId }.cantidad)

        vm.onProductTap(prodId)
        assertEquals(2, vm.uiState.value.productos.first { it.id == prodId }.cantidad)
    }

    @Test
    fun `onProductQuantityChange sets exact quantity`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val prodId = vm.uiState.value.productos.first().id
        vm.onProductQuantityChange(prodId, 5)
        assertEquals(5, vm.uiState.value.productos.first { it.id == prodId }.cantidad)
    }

    @Test
    fun `onProductQuantityChange negative floors to 0`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val prodId = vm.uiState.value.productos.first().id
        vm.onProductQuantityChange(prodId, -3)
        assertEquals(0, vm.uiState.value.productos.first { it.id == prodId }.cantidad)
    }

    @Test
    fun `productosSeleccionados returns only qty greater than 0`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val prods = vm.uiState.value.productos
        vm.onProductQuantityChange(prods[0].id, 2)
        vm.onProductQuantityChange(prods[2].id, 1)

        val selected = vm.uiState.value.productosSeleccionados
        assertEquals(2, selected.size)
        assertTrue(selected.all { it.cantidad > 0 })
    }

    @Test
    fun `totalBruto sums selected products correctly`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val prods = vm.uiState.value.productos
        // Producto 1: precio=1000, qty=3 -> 3000
        // Producto 3: precio=3000, qty=2 -> 6000
        vm.onProductQuantityChange(prods[0].id, 3)
        vm.onProductQuantityChange(prods[2].id, 2)

        assertEquals(9_000L, vm.uiState.value.totalBruto)
    }

    @Test
    fun `nextStep advances currentStep`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        assertEquals(0, vm.uiState.value.currentStep)
        vm.nextStep()
        assertEquals(1, vm.uiState.value.currentStep)
        vm.nextStep()
        assertEquals(2, vm.uiState.value.currentStep)
    }

    @Test
    fun `previousStep decrements currentStep`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        vm.nextStep() // 1
        vm.nextStep() // 2
        vm.previousStep()
        assertEquals(1, vm.uiState.value.currentStep)
    }

    @Test
    fun `previousStep does not go below 0`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        vm.previousStep()
        assertEquals(0, vm.uiState.value.currentStep)
    }

    @Test
    fun `onSelectInnominado sets innominado client`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        vm.onSelectInnominado()
        val cliente = vm.uiState.value.cliente
        assertTrue(cliente.isInnominado)
        assertEquals("Sin Nombre", cliente.nombre)
        assertEquals("innominado", cliente.tipoDocumento)
    }

    @Test
    fun `onGenerarFactura creates factura and sets isGenerated`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        // Seleccionar producto
        vm.onProductQuantityChange(vm.uiState.value.productos.first().id, 2)
        vm.onSelectInnominado()

        vm.onGenerarFactura()
        advanceUntilIdle()

        assertTrue(vm.uiState.value.isGenerated)
        assertFalse(vm.uiState.value.isGenerating)
        assertEquals(3, vm.uiState.value.currentStep) // paso confirmacion
        assertTrue(vm.uiState.value.facturaNumero.isNotBlank())
        assertEquals(1, facturaPort.facturas.size)
    }

    @Test
    fun `canAdvanceStep1 is false when no products selected`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        assertFalse(vm.uiState.value.canAdvanceStep1)

        vm.onProductTap(vm.uiState.value.productos.first().id)
        assertTrue(vm.uiState.value.canAdvanceStep1)
    }

    @Test
    fun `resetWizard clears state`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        vm.onProductTap(vm.uiState.value.productos.first().id)
        vm.nextStep()

        vm.resetWizard()
        advanceUntilIdle()

        assertEquals(0, vm.uiState.value.currentStep)
        assertTrue(vm.uiState.value.productosSeleccionados.isEmpty())
    }
}
