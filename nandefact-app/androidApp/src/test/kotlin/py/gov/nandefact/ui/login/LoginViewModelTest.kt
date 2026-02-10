package py.gov.nandefact.ui.login

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
import py.gov.nandefact.fakes.FakeAuthPort
import py.gov.nandefact.shared.domain.usecase.LoginUseCase

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var authPort: FakeAuthPort
    private lateinit var vm: LoginViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        authPort = FakeAuthPort(loggedIn = false)
        vm = LoginViewModel(LoginUseCase(authPort))
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `onPhoneChange filters non-digits and limits to 10`() {
        vm.onPhoneChange("098abc1-123-456")
        assertEquals("0981123456", vm.uiState.value.phone)

        vm.onPhoneChange("12345678901234")
        assertEquals("1234567890", vm.uiState.value.phone)
    }

    @Test
    fun `onPinChange updates state`() {
        vm.onPinChange("1234")
        assertEquals("1234", vm.uiState.value.pin)
    }

    @Test
    fun `onLogin with short phone shows error`() {
        vm.onPhoneChange("12345678") // 8 dígitos, mínimo 9
        vm.onPinChange("1234")
        vm.onLogin()
        assertNotNull(vm.uiState.value.error)
        assertFalse(vm.uiState.value.isAuthenticated)
    }

    @Test
    fun `onLogin with short pin shows error`() {
        vm.onPhoneChange("0981123456")
        vm.onPinChange("123") // 3 dígitos, mínimo 4
        vm.onLogin()
        assertNotNull(vm.uiState.value.error)
        assertFalse(vm.uiState.value.isAuthenticated)
    }

    @Test
    fun `onLogin success sets isAuthenticated`() = runTest {
        vm.onPhoneChange("0981123456")
        vm.onPinChange("1234")
        vm.onLogin()
        advanceUntilIdle()

        assertTrue(vm.uiState.value.isAuthenticated)
        assertNull(vm.uiState.value.error)
        assertFalse(vm.uiState.value.isLoading)
    }

    @Test
    fun `onLogin failure shows error message`() = runTest {
        authPort.loginResult = Result.failure(RuntimeException("PIN incorrecto"))
        vm.onPhoneChange("0981123456")
        vm.onPinChange("1234")
        vm.onLogin()
        advanceUntilIdle()

        assertFalse(vm.uiState.value.isAuthenticated)
        assertEquals("PIN incorrecto", vm.uiState.value.error)
    }

    @Test
    fun `onPhoneChange clears previous error`() {
        vm.onPhoneChange("123")
        vm.onPinChange("12")
        vm.onLogin() // genera error
        assertNotNull(vm.uiState.value.error)

        vm.onPhoneChange("0981")
        assertNull(vm.uiState.value.error)
    }
}
