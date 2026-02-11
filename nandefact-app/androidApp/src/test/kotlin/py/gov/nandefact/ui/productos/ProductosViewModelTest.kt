package py.gov.nandefact.ui.productos

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
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
import py.gov.nandefact.fakes.FakeProductoPort
import py.gov.nandefact.shared.domain.usecase.GetProductosUseCase
import py.gov.nandefact.shared.domain.usecase.SaveProductoUseCase
import py.gov.nandefact.ui.common.UiState

@OptIn(ExperimentalCoroutinesApi::class)
class ProductosViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authPort: FakeAuthPort
    private lateinit var productoPort: FakeProductoPort
    private lateinit var vm: ProductosViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        authPort = FakeAuthPort()
        productoPort = FakeProductoPort(TestData.productos(5))
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createVm(): ProductosViewModel {
        return ProductosViewModel(
            getProductos = GetProductosUseCase(productoPort, authPort),
            saveProducto = SaveProductoUseCase(productoPort, authPort)
        )
    }

    private fun assertContentSuccess(vm: ProductosViewModel): List<ProductoUi> {
        val content = vm.listState.value.content
        assertTrue("Expected UiState.Success but was $content", content is UiState.Success)
        return (content as UiState.Success).data
    }

    @Test
    fun `init loads productos`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val productos = assertContentSuccess(vm)
        assertEquals(5, productos.size)
    }

    @Test
    fun `onSave with valid form emits saveSuccess`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        var emitted = false
        val job = launch { vm.saveSuccess.first(); emitted = true }

        vm.onNombreChange("Cebolla")
        vm.onPrecioChange("3000")
        vm.onTasaIvaChange(10)
        vm.onSave()
        advanceUntilIdle()

        assertTrue(emitted)
        assertTrue(productoPort.saveCalled)
        job.cancel()
    }

    @Test
    fun `onSave updates list after save`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val countBefore = assertContentSuccess(vm).size

        vm.onNombreChange("Nuevo Producto")
        vm.onPrecioChange("8000")
        vm.onSave()
        advanceUntilIdle()

        // La lista se recarga del port que ahora tiene +1
        assertEquals(countBefore + 1, assertContentSuccess(vm).size)
    }

    @Test
    fun `loadForEdit populates form state`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val prod = TestData.productos(5).first()
        vm.loadForEdit(prod.id)
        advanceUntilIdle()

        val form = vm.formState.value
        assertEquals(prod.id, form.id)
        assertEquals(prod.nombre, form.nombre)
        assertEquals(prod.precioUnitario.toString(), form.precioUnitario)
        assertEquals(prod.unidadMedida, form.unidadMedida)
        assertEquals(prod.tasaIva, form.tasaIva)
        assertTrue(form.isEditing)
    }

    @Test
    fun `resetForm clears form to defaults`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        vm.onNombreChange("Test")
        vm.onPrecioChange("5000")
        vm.resetForm()

        val form = vm.formState.value
        assertEquals("", form.nombre)
        assertEquals("", form.precioUnitario)
        assertEquals("unidad", form.unidadMedida)
        assertEquals(10, form.tasaIva)
        assertNull(form.id)
        assertFalse(form.isEditing)
    }

    @Test
    fun `onPrecioChange filters non-digits`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        vm.onPrecioChange("5.000abc")
        assertEquals("5000", vm.formState.value.precioUnitario)
    }

    @Test
    fun `refresh reloads from port`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        productoPort.productos.add(TestData.producto(id = "prod-new", nombre = "Nuevo"))
        vm.refresh()
        advanceUntilIdle()

        assertEquals(6, assertContentSuccess(vm).size)
    }
}
