package py.gov.nandefact.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import py.gov.nandefact.ui.theme.NfError
import py.gov.nandefact.ui.theme.NfSuccess
import py.gov.nandefact.ui.theme.NfWarning

enum class StatusColor {
    SUCCESS, WARNING, ERROR
}

@Composable
fun NfStatusDot(
    status: StatusColor,
    modifier: Modifier = Modifier
) {
    val color = when (status) {
        StatusColor.SUCCESS -> NfSuccess
        StatusColor.WARNING -> NfWarning
        StatusColor.ERROR -> NfError
    }
    NfStatusDot(color = color, modifier = modifier)
}

@Composable
fun NfStatusDot(
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .size(8.dp)
            .clip(CircleShape)
            .background(color)
    )
}
