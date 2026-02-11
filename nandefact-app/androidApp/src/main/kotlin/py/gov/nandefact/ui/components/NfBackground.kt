package py.gov.nandefact.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import py.gov.nandefact.R
import py.gov.nandefact.ui.theme.NfTheme

/**
 * Fondo con patrón de pétalos de lapacho tileado.
 * Dark: primary@10%, Light: primary@5%.
 */
@Composable
fun NfBackground(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val patternColor = MaterialTheme.colorScheme.primary.copy(
        alpha = if (MaterialTheme.colorScheme.background == py.gov.nandefact.ui.theme.DarkBackground) 0.04f else 0.03f
    )

    Box(modifier = modifier.fillMaxSize()) {
        Image(
            painter = painterResource(id = R.drawable.bg_lapacho_pattern),
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
            colorFilter = ColorFilter.tint(patternColor)
        )
        content()
    }
}
