package py.gov.nandefact.ui.reportes

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
import py.gov.nandefact.shared.domain.model.PeriodFilter
import py.gov.nandefact.shared.domain.usecase.GetReportesUseCase

@OptIn(ExperimentalCoroutinesApi::class)
class ReportesViewModelTest {

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
    fun `init loads reportes data`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        assertFalse(vm.uiState.value.isLoading)
    }

    @Test
    fun `onPeriodChange reloads with new period`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        vm.onPeriodChange(PeriodFilter.MES)
        advanceUntilIdle()

        assertEquals(PeriodFilter.MES, vm.uiState.value.period)
    }

    @Test
    fun `totals calculate correctly from facturas`() = runTest {
        facturaPort.facturas.addAll(
            listOf(
                TestData.factura(id = "f1", totalBruto = 10_000, createdAt = "2099-01-15T14:00:00"),
                TestData.factura(id = "f2", totalBruto = 20_000, createdAt = "2099-01-16T14:00:00"),
                TestData.factura(id = "f3", totalBruto = 30_000, createdAt = "2099-01-17T14:00:00")
            )
        )
        // Usar TODO para evitar filtrado por fecha
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        // Con periodo TODO
        vm.onPeriodChange(PeriodFilter.TODO)
        advanceUntilIdle()

        assertEquals(60_000L, vm.uiState.value.totalVentas)
        assertEquals(3, vm.uiState.value.cantidadFacturas)
    }

    @Test
    fun `empty facturas shows sample data`() = runTest {
        // Sin facturas, el VM rellena con samples
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        // Cuando totalVentas es 0 de los datos reales, se reemplaza con sample
        assertTrue(vm.uiState.value.totalVentas > 0)
    }
}
