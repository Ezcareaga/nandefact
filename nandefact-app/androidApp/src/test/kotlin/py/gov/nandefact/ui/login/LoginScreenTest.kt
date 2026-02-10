package py.gov.nandefact.ui.login

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import py.gov.nandefact.TestNandefactApp
import py.gov.nandefact.fakes.FakeAuthPort
import py.gov.nandefact.shared.domain.usecase.LoginUseCase

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], application = TestNandefactApp::class)
@OptIn(ExperimentalCoroutinesApi::class)
class LoginScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun setContent(vm: LoginViewModel = LoginViewModel(LoginUseCase(FakeAuthPort(loggedIn = false)))) {
        composeRule.setContent {
            LoginScreen(
                onLoginSuccess = {},
                viewModel = vm
            )
        }
    }

    @Test
    fun `displays title and welcome text`() {
        setContent()
        composeRule.onNodeWithText("ÑandeFact").assertIsDisplayed()
        composeRule.onNodeWithText("Bienvenido").assertIsDisplayed()
    }

    @Test
    fun `shows phone label and pin label`() {
        setContent()
        composeRule.onNodeWithText("Teléfono").assertIsDisplayed()
        composeRule.onNodeWithText("PIN").assertIsDisplayed()
    }

    @Test
    fun `shows error message when present`() {
        val authPort = FakeAuthPort(loggedIn = false)
        val vm = LoginViewModel(LoginUseCase(authPort))
        setContent(vm)

        // Trigger error: short phone
        vm.onPhoneChange("1234")
        vm.onLogin()
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Número de teléfono inválido").assertIsDisplayed()
    }

    @Test
    fun `ingresar button is displayed`() {
        setContent()
        composeRule.onNodeWithText("Ingresar").assertIsDisplayed()
    }
}
