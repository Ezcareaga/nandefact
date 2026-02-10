package py.gov.nandefact.ui.config

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.dp
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import py.gov.nandefact.TestNandefactApp

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [33], application = TestNandefactApp::class)
class ConfigScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private fun setContent(isDarkTheme: Boolean = true) {
        composeRule.setContent {
            ConfigScreen(
                paddingValues = PaddingValues(0.dp),
                isDarkTheme = isDarkTheme,
                onToggleTheme = {},
                onLogout = {}
            )
        }
    }

    @Test
    fun `displays commerce data card`() {
        setContent()
        composeRule.onNodeWithText("Datos del Comercio").assertIsDisplayed()
        composeRule.onNodeWithText("RUC").assertIsDisplayed()
        composeRule.onNodeWithText("80069563-1").assertIsDisplayed()
    }

    @Test
    fun `shows dark mode toggle`() {
        setContent()
        composeRule.onNodeWithText("Modo oscuro").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `shows cerrar sesion button`() {
        setContent()
        composeRule.onNodeWithText("Cerrar sesión").performScrollTo().assertIsDisplayed()
    }
}
