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
import py.gov.nandefact.shared.domain.usecase.GetClientesUseCase
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
            saveCliente = SaveClienteUseCase(clientePort, authPort),
            getClientes = GetClientesUseCase(clientePort, authPort)
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
        assertEquals("Consumidor Final", cliente.nombre)
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

    // === Nuevos tests: Wizard UX Improvements ===

    @Test
    fun `onClienteTabChange to SIN_DATOS sets consumidor final`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        vm.onClienteTabChange(ClienteTab.SIN_DATOS)

        val state = vm.uiState.value
        assertEquals(ClienteTab.SIN_DATOS, state.clienteTab)
        assertTrue(state.cliente.isInnominado)
        assertEquals("Consumidor Final", state.cliente.nombre)
        assertEquals("innominado", state.cliente.tipoDocumento)
        assertFalse(state.cliente.guardarCliente)
    }

    @Test
    fun `onClienteTabChange to CI clears innominado`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        // Primero seleccionar SIN_DATOS
        vm.onClienteTabChange(ClienteTab.SIN_DATOS)
        assertTrue(vm.uiState.value.cliente.isInnominado)

        // Cambiar a CI
        vm.onClienteTabChange(ClienteTab.CI)
        advanceUntilIdle()

        val state = vm.uiState.value
        assertEquals(ClienteTab.CI, state.clienteTab)
        assertFalse(state.cliente.isInnominado)
        assertEquals("CI", state.cliente.tipoDocumento)
    }

    @Test
    fun `client search returns results and hides inline form`() = runTest {
        // Precargar clientes en el fake
        clientePort.clientes.addAll(TestData.clientes(3).map {
            it.copy(comercioId = "comercio-001")
        })
        vm = createVm()
        advanceUntilIdle()

        // Buscar por nombre que existe
        vm.onClienteSearchChange("Cliente 1")
        advanceUntilIdle()

        val state = vm.uiState.value
        assertTrue(state.clientesResults.isNotEmpty())
        assertFalse(state.showInlineForm)
    }

    @Test
    fun `client search with no match shows inline form`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        // Buscar algo que no existe
        vm.onClienteSearchChange("NoExiste12345")
        advanceUntilIdle()

        val state = vm.uiState.value
        assertTrue(state.clientesResults.isEmpty())
        assertTrue(state.showInlineForm)
    }

    @Test
    fun `saveClienteIfNeeded skips when client already has id`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        // Simular selección de cliente existente (tiene id)
        val existingCliente = TestData.cliente()
        vm.onSelectClienteFromList(existingCliente)

        // Avanzar al paso 1 (cliente) y luego al paso 2 (confirmar)
        vm.nextStep() // 0 -> 1
        vm.nextStep() // 1 -> 2 (aquí se llama saveClienteIfNeeded)
        advanceUntilIdle()

        // No debería haber guardado — el cliente ya tiene id
        assertFalse(clientePort.saveCalled)
    }

    @Test
    fun `saveClienteIfNeeded saves new client and assigns id`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        // Configurar un cliente nuevo (sin id)
        vm.onClienteNombreChange("María López")
        vm.onClienteRucCiChange("1234567")
        vm.onClienteTipoDocChange("CI")

        // Verificar que no tiene id
        assertNull(vm.uiState.value.cliente.id)

        // Avanzar desde paso 1 al 2 (llama saveClienteIfNeeded)
        vm.nextStep() // 0 -> 1
        vm.nextStep() // 1 -> 2
        advanceUntilIdle()

        // Debería haber guardado
        assertTrue(clientePort.saveCalled)
        // Cliente debería tener id asignado
        assertNotNull(vm.uiState.value.cliente.id)
    }
}
