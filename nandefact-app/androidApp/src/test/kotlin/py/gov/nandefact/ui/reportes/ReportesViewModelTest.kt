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
import py.gov.nandefact.ui.common.UiState

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

        assertTrue(vm.uiState.value.content is UiState.Success)
    }

    @Test
    fun `init loads with default period MES`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        assertEquals(PeriodFilter.MES, vm.uiState.value.period)
    }

    @Test
    fun `onPeriodChange reloads with new period`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        vm.onPeriodChange(PeriodFilter.HOY)
        advanceUntilIdle()

        assertEquals(PeriodFilter.HOY, vm.uiState.value.period)
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
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        vm.onPeriodChange(PeriodFilter.TODO)
        advanceUntilIdle()

        val content = (vm.uiState.value.content as UiState.Success).data
        assertEquals(60_000L, content.totalVentas)
        assertEquals(3, content.cantidadFacturas)
    }

    @Test
    fun `empty facturas shows demo data`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        val content = (vm.uiState.value.content as UiState.Success).data
        assertTrue(content.totalVentas > 0)
    }

    @Test
    fun `demo data has all 5 sections populated`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        val content = (vm.uiState.value.content as UiState.Success).data
        // Sección 1: Vista general
        assertTrue(content.totalVentas > 0)
        assertTrue(content.cantidadFacturas > 0)
        assertTrue(content.ticketPromedio > 0)
        // Sección 2: Productos
        assertTrue(content.topProductos.isNotEmpty())
        assertTrue(content.bottomProductos.isNotEmpty())
        // Sección 3: Clientes
        assertTrue(content.clientesFrecuentes.isNotEmpty())
        // Sección 4: Horario pico
        assertTrue(content.hourlySlots.isNotEmpty())
        assertTrue(content.peakSlotLabel.isNotEmpty())
        // Sección 5: Resumen
        assertTrue(content.resumenMes.isNotEmpty())
    }

    @Test
    fun `ticket promedio calculates correctly`() = runTest {
        facturaPort.facturas.addAll(
            listOf(
                TestData.factura(id = "f1", totalBruto = 100_000, createdAt = "2099-06-01T10:00:00"),
                TestData.factura(id = "f2", totalBruto = 200_000, createdAt = "2099-06-02T12:00:00")
            )
        )
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        vm.onPeriodChange(PeriodFilter.TODO)
        advanceUntilIdle()

        val content = (vm.uiState.value.content as UiState.Success).data
        assertEquals(150_000L, content.ticketPromedio)
    }

    @Test
    fun `onProductosTabChange updates tab`() = runTest {
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        vm.onProductosTabChange(ProductosTab.MENOS_VENDIDOS)

        val content = (vm.uiState.value.content as UiState.Success).data
        assertEquals(ProductosTab.MENOS_VENDIDOS, content.productosTab)
    }

    @Test
    fun `hourly distribution counts by time slot`() = runTest {
        facturaPort.facturas.addAll(
            listOf(
                TestData.factura(id = "f1", totalBruto = 10_000, createdAt = "2099-03-01T10:30:00"),
                TestData.factura(id = "f2", totalBruto = 20_000, createdAt = "2099-03-01T11:00:00"),
                TestData.factura(id = "f3", totalBruto = 15_000, createdAt = "2099-03-01T15:00:00")
            )
        )
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        vm.onPeriodChange(PeriodFilter.TODO)
        advanceUntilIdle()

        val content = (vm.uiState.value.content as UiState.Success).data
        // 10:30 y 11:00 caen en slot 10:00 (10-12), 15:00 cae en slot 14:00 (14-16)
        val slot1012 = content.hourlySlots.find { it.label == "10:00" }
        val slot1416 = content.hourlySlots.find { it.label == "14:00" }
        assertNotNull(slot1012)
        assertEquals(2, slot1012!!.count)
        assertNotNull(slot1416)
        assertEquals(1, slot1416!!.count)
        assertEquals("10:00 - 12:00", content.peakSlotLabel)
    }

    @Test
    fun `clientes frecuentes excludes consumidor final`() = runTest {
        facturaPort.facturas.addAll(
            listOf(
                TestData.factura(id = "f1", totalBruto = 10_000, clienteNombre = "Juan Pérez", createdAt = "2099-04-01T09:00:00"),
                TestData.factura(id = "f2", totalBruto = 20_000, clienteNombre = "Consumidor Final", createdAt = "2099-04-01T10:00:00"),
                TestData.factura(id = "f3", totalBruto = 30_000, clienteNombre = "Juan Pérez", createdAt = "2099-04-02T11:00:00"),
                TestData.factura(id = "f4", totalBruto = 15_000, clienteNombre = null, createdAt = "2099-04-02T12:00:00")
            )
        )
        val vm = ReportesViewModel(GetReportesUseCase(facturaPort, authPort))
        advanceUntilIdle()

        vm.onPeriodChange(PeriodFilter.TODO)
        advanceUntilIdle()

        val content = (vm.uiState.value.content as UiState.Success).data
        assertEquals(1, content.clientesFrecuentes.size)
        assertEquals("Juan Pérez", content.clientesFrecuentes[0].nombre)
        assertEquals(2, content.clientesFrecuentes[0].compraCount)
        assertEquals("JP", content.clientesFrecuentes[0].initials)
    }
}
