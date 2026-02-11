package py.gov.nandefact.ui.home

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
import py.gov.nandefact.shared.domain.usecase.GetHomeDataUseCase
import py.gov.nandefact.ui.common.UiState

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {

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

    private fun assertSuccess(vm: HomeViewModel): HomeData {
        val state = vm.uiState.value
        assertTrue("Expected UiState.Success but was $state", state is UiState.Success)
        return (state as UiState.Success).data
    }

    @Test
    fun `init loads home data with user name`() = runTest {
        val vm = HomeViewModel(GetHomeDataUseCase(authPort, facturaPort))
        advanceUntilIdle()

        val data = assertSuccess(vm)
        assertEquals("Mar\u00eda Demo", data.userName)
        assertEquals("Puesto Demo", data.comercioName)
    }

    @Test
    fun `pendingCount reflects factura port`() = runTest {
        facturaPort.facturas.addAll(TestData.facturas(3))
        val vm = HomeViewModel(GetHomeDataUseCase(authPort, facturaPort))
        advanceUntilIdle()

        val data = assertSuccess(vm)
        assertEquals(3, data.pendingCount)
    }

    @Test
    fun `lastSaleAmount shows latest factura total`() = runTest {
        facturaPort.facturas.add(
            TestData.factura(id = "f1", totalBruto = 25_000, createdAt = "2025-01-15T10:00:00")
        )
        facturaPort.facturas.add(
            TestData.factura(id = "f2", totalBruto = 75_000, createdAt = "2025-01-16T14:00:00")
        )
        val vm = HomeViewModel(GetHomeDataUseCase(authPort, facturaPort))
        advanceUntilIdle()

        val data = assertSuccess(vm)
        assertEquals(75_000L, data.lastSaleAmount)
    }

    @Test
    fun `loadHomeData refreshes state`() = runTest {
        val vm = HomeViewModel(GetHomeDataUseCase(authPort, facturaPort))
        advanceUntilIdle()
        assertEquals(0, assertSuccess(vm).pendingCount)

        facturaPort.facturas.add(TestData.factura())
        vm.loadHomeData()
        advanceUntilIdle()

        assertEquals(1, assertSuccess(vm).pendingCount)
    }

    @Test
    fun `no comercio returns zero counts`() = runTest {
        authPort = FakeAuthPort(comercioId = null)
        val vm = HomeViewModel(GetHomeDataUseCase(authPort, facturaPort))
        advanceUntilIdle()

        val data = assertSuccess(vm)
        assertEquals(0, data.pendingCount)
        assertNull(data.lastSaleAmount)
    }
}
