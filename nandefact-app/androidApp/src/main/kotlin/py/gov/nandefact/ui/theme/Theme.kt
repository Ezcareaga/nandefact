package py.gov.nandefact.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = NfPrimary,
    onPrimary = NfBackground,
    secondary = NfPrimaryVariant,
    background = NfBackground,
    surface = NfSurface,
    surfaceVariant = NfSurfaceVariant,
    onBackground = NfOnBackground,
    onSurface = NfOnBackground,
    onSurfaceVariant = NfOnSurfaceVariant,
    error = NfError,
    onError = NfOnBackground,
    outline = NfOutline
)

// Light mode stub — post-MVP
private val LightColorScheme = lightColorScheme(
    primary = NfPrimary,
    onPrimary = NfLightBackground,
    secondary = NfPrimaryVariant,
    background = NfLightBackground,
    surface = NfLightSurface,
    surfaceVariant = NfLightSurface,
    onBackground = NfLightOnBackground,
    onSurface = NfLightOnBackground,
    onSurfaceVariant = NfLightOnSurfaceVariant,
    error = NfError,
    onError = NfLightBackground,
    outline = NfLightOutline
)

@Composable
fun NandefactTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = NandefactTypography,
        shapes = NandefactShapes,
        content = content
    )
}
