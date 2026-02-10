package py.gov.nandefact.ui.facturas

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
import py.gov.nandefact.fakes.FakeFacturaPort
import py.gov.nandefact.shared.domain.usecase.GetFacturasUseCase

@OptIn(ExperimentalCoroutinesApi::class)
class HistorialViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authPort: FakeAuthPort
    private lateinit var facturaPort: FakeFacturaPort

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        authPort = FakeAuthPort()
        facturaPort = FakeFacturaPort()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `init loads facturas`() = runTest {
        facturaPort.facturas.addAll(TestData.facturas(3))
        val vm = HistorialViewModel(GetFacturasUseCase(facturaPort, authPort))
        advanceUntilIdle()

        // Con facturas reales, se usan directamente
        assertEquals(3, vm.uiState.value.facturas.size)
        assertFalse(vm.uiState.value.isLoading)
    }

    @Test
    fun `init with empty facturas shows samples`() = runTest {
        // Sin facturas reales, debería usar sampleFacturas()
        val vm = HistorialViewModel(GetFacturasUseCase(facturaPort, authPort))
        advanceUntilIdle()

        assertTrue(vm.uiState.value.facturas.isNotEmpty())
        assertFalse(vm.uiState.value.isLoading)
    }

    @Test
    fun `onFilterChange updates filter`() = runTest {
        facturaPort.facturas.addAll(TestData.facturas(3))
        val vm = HistorialViewModel(GetFacturasUseCase(facturaPort, authPort))
        advanceUntilIdle()

        vm.onFilterChange(HistorialFilter.MES)
        advanceUntilIdle()

        assertEquals(HistorialFilter.MES, vm.uiState.value.filter)
    }

    @Test
    fun `loadMore loads next page`() = runTest {
        // Generar 25 facturas para probar paginación (pageSize=20)
        val bigList = (1..25).map { i ->
            TestData.factura(
                id = "fact-$i",
                numero = "001-001-${i.toString().padStart(7, '0')}",
                createdAt = "2025-01-${(i % 28 + 1).toString().padStart(2, '0')}T10:00:00"
            )
        }
        facturaPort.facturas.addAll(bigList)
        val vm = HistorialViewModel(GetFacturasUseCase(facturaPort, authPort))
        advanceUntilIdle()

        assertEquals(20, vm.uiState.value.facturas.size)
        assertTrue(vm.uiState.value.hasMore)

        vm.loadMore()
        assertEquals(25, vm.uiState.value.facturas.size)
        assertFalse(vm.uiState.value.hasMore)
    }
}
