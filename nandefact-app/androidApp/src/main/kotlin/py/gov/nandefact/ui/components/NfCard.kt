package py.gov.nandefact.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import py.gov.nandefact.ui.theme.NfTheme

@Composable
fun NfCard(
    modifier: Modifier = Modifier,
    borderColor: Color = NfTheme.colors.cardBorder,
    backgroundColor: Color = MaterialTheme.colorScheme.surface,
    borderWidth: Dp = 1.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    if (onClick != null) {
        Surface(
            modifier = modifier.fillMaxWidth(),
            color = backgroundColor,
            shape = MaterialTheme.shapes.medium,
            border = BorderStroke(borderWidth, borderColor),
            onClick = onClick
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                content = content
            )
        }
    } else {
        Surface(
            modifier = modifier.fillMaxWidth(),
            color = backgroundColor,
            shape = MaterialTheme.shapes.medium,
            border = BorderStroke(borderWidth, borderColor)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                content = content
            )
        }
    }
}
