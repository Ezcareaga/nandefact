package py.gov.nandefact.ui.components

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import java.text.NumberFormat
import java.util.Locale

// Formato PYG: "Gs 1.250.000" — sin decimales, separador de miles con punto
fun formatPYG(amount: Long): String {
    val formatter = NumberFormat.getIntegerInstance(Locale("es", "PY"))
    return "Gs ${formatter.format(amount)}"
}

@Composable
fun NfAmountDisplay(
    amount: Long,
    modifier: Modifier = Modifier,
    style: TextStyle = MaterialTheme.typography.titleLarge,
    color: Color = MaterialTheme.colorScheme.onBackground,
    fontWeight: FontWeight = FontWeight.Bold
) {
    Text(
        text = formatPYG(amount),
        style = style,
        color = color,
        fontWeight = fontWeight,
        modifier = modifier
    )
}
