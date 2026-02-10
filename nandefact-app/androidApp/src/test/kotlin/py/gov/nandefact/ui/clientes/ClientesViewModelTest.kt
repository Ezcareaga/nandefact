package py.gov.nandefact.ui.clientes

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
import py.gov.nandefact.fakes.FakeClientePort
import py.gov.nandefact.shared.domain.usecase.GetClientesUseCase
import py.gov.nandefact.shared.domain.usecase.SaveClienteUseCase

@OptIn(ExperimentalCoroutinesApi::class)
class ClientesViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authPort: FakeAuthPort
    private lateinit var clientePort: FakeClientePort
    private lateinit var vm: ClientesViewModel

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

    private fun createVm(): ClientesViewModel {
        return ClientesViewModel(
            getClientes = GetClientesUseCase(clientePort, authPort),
            saveCliente = SaveClienteUseCase(clientePort, authPort)
        )
    }

    @Test
    fun `init loads clientes`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        assertEquals(3, vm.listState.value.clientes.size)
        assertFalse(vm.listState.value.isLoading)
    }

    @Test
    fun `onSave with valid form emits saveSuccess`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        var emitted = false
        val job = launch { vm.saveSuccess.first(); emitted = true }

        vm.onNombreChange("Ana García")
        vm.onTipoDocChange("CI")
        vm.onRucCiChange("1234567")
        vm.onSave()
        advanceUntilIdle()

        assertTrue(emitted)
        assertTrue(clientePort.saveCalled)
        job.cancel()
    }

    @Test
    fun `loadForEdit populates form state`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val cli = TestData.clientes(3).first()
        vm.loadForEdit(cli.id)
        advanceUntilIdle()

        val form = vm.formState.value
        assertEquals(cli.id, form.id)
        assertEquals(cli.nombre, form.nombre)
        assertEquals(cli.tipoDocumento, form.tipoDocumento)
        assertEquals(cli.rucCi ?: "", form.rucCi)
        assertTrue(form.isEditing)
    }

    @Test
    fun `onWhatsAppToggle changes enviarWhatsApp`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        assertTrue(vm.formState.value.enviarWhatsApp)
        vm.onWhatsAppToggle(false)
        assertFalse(vm.formState.value.enviarWhatsApp)
    }

    @Test
    fun `resetForm clears form to defaults`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        vm.onNombreChange("Test")
        vm.onRucCiChange("999")
        vm.resetForm()

        val form = vm.formState.value
        assertEquals("", form.nombre)
        assertEquals("", form.rucCi)
        assertEquals("CI", form.tipoDocumento)
        assertTrue(form.enviarWhatsApp)
        assertNull(form.id)
        assertFalse(form.isEditing)
    }

    @Test
    fun `onSave adds new client to list`() = runTest {
        vm = createVm()
        advanceUntilIdle()

        val countBefore = vm.listState.value.clientes.size

        vm.onNombreChange("Nuevo Cliente")
        vm.onTipoDocChange("CI")
        vm.onSave()
        advanceUntilIdle()

        assertEquals(countBefore + 1, vm.listState.value.clientes.size)
    }
}
