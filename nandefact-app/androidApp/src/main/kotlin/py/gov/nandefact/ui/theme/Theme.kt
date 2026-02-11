package py.gov.nandefact.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = DarkPrimary,
    onPrimary = DarkOnPrimary,
    background = DarkBackground,
    surface = DarkSurface,
    onBackground = DarkTextPrimary,
    onSurface = DarkTextPrimary,
    onSurfaceVariant = DarkTextSecondary,
    error = DarkError,
    onError = DarkOnPrimary,
    outline = DarkCardBorder
)

private val LightColorScheme = lightColorScheme(
    primary = LightPrimary,
    onPrimary = LightOnPrimary,
    background = LightBackground,
    surface = LightSurface,
    onBackground = LightTextPrimary,
    onSurface = LightTextPrimary,
    onSurfaceVariant = LightTextSecondary,
    error = LightError,
    onError = LightOnPrimary,
    outline = LightCardBorder
)

/**
 * Colores semánticos extendidos que Material3 no provee nativamente.
 * Acceso vía NfTheme.colors (CompositionLocal-aware, soporta dark/light).
 */
@Immutable
data class NfColors(
    val success: Color,
    val warning: Color,
    val error: Color,
    val cardBorder: Color,
    val inputBg: Color,
    val divider: Color,
    val iconContainer: Color,
    val warningContainer: Color,
    val navBackground: Color,
    val textSecondary: Color
)

private val DarkNfColors = NfColors(
    success = DarkSuccess,
    warning = DarkWarning,
    error = DarkError,
    cardBorder = DarkCardBorder,
    inputBg = DarkInputBg,
    divider = DarkDivider,
    iconContainer = DarkIconContainer,
    warningContainer = DarkWarningContainer,
    navBackground = DarkNavBackground,
    textSecondary = DarkTextSecondary
)

private val LightNfColors = NfColors(
    success = LightSuccess,
    warning = LightWarning,
    error = LightError,
    cardBorder = LightCardBorder,
    inputBg = LightInputBg,
    divider = LightDivider,
    iconContainer = LightIconContainer,
    warningContainer = LightWarningContainer,
    navBackground = LightNavBackground,
    textSecondary = LightTextSecondary
)

val LocalNfColors = staticCompositionLocalOf { DarkNfColors }

object NfTheme {
    val colors: NfColors
        @Composable get() = LocalNfColors.current
}

@Composable
fun NandefactTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val nfColors = if (darkTheme) DarkNfColors else LightNfColors

    CompositionLocalProvider(LocalNfColors provides nfColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = NandefactTypography,
            shapes = NandefactShapes,
            content = content
        )
    }
}
