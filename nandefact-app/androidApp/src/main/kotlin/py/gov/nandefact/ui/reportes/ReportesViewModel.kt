package py.gov.nandefact.ui.reportes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.model.PeriodFilter
import py.gov.nandefact.shared.domain.usecase.GetReportesUseCase
import py.gov.nandefact.shared.domain.usecase.ReportesData
import py.gov.nandefact.ui.common.UiState
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

enum class ProductosTab { MAS_VENDIDOS, MENOS_VENDIDOS }

data class TopProducto(
    val nombre: String,
    val cantidad: Int,
    val total: Long
)

data class ClienteFrecuente(
    val nombre: String,
    val initials: String,
    val compraCount: Int,
    val total: Long
)

data class HourSlotUi(
    val label: String,
    val count: Int,
    val fraction: Float
)

data class ReportesContent(
    // Sección 1: Vista general
    val totalVentas: Long,
    val cantidadFacturas: Int,
    val totalIva10: Long,
    val totalIva5: Long,
    val totalExenta: Long,
    val ticketPromedio: Long,
    val changePercent: Int?,
    val changePositive: Boolean?,
    // Sección 2: Productos
    val topProductos: List<TopProducto>,
    val bottomProductos: List<TopProducto>,
    val productosTab: ProductosTab,
    // Sección 3: Clientes
    val clientesFrecuentes: List<ClienteFrecuente>,
    // Sección 4: Horario pico
    val hourlySlots: List<HourSlotUi>,
    val peakSlotLabel: String,
    // Sección 5: Resumen mensual
    val resumenMes: String,
    val resumenTotalVentas: Long,
    val resumenIva10: Long,
    val resumenIva5: Long,
    val resumenFacturasEmitidas: Int,
    val resumenAnuladas: Int
)

data class ReportesScreenState(
    val period: PeriodFilter = PeriodFilter.MES,
    val content: UiState<ReportesContent> = UiState.Loading
)

class ReportesViewModel(
    private val getReportes: GetReportesUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(ReportesScreenState())
    val uiState: StateFlow<ReportesScreenState> = _uiState.asStateFlow()

    init {
        loadReportes()
    }

    fun onPeriodChange(period: PeriodFilter) {
        _uiState.value = _uiState.value.copy(period = period)
        loadReportes()
    }

    fun onProductosTabChange(tab: ProductosTab) {
        val current = _uiState.value.content
        if (current is UiState.Success) {
            _uiState.value = _uiState.value.copy(
                content = UiState.Success(current.data.copy(productosTab = tab))
            )
        }
    }

    private fun loadReportes() {
        viewModelScope.launch {
            val period = _uiState.value.period
            val data = getReportes(period)
            val content = if (data.totalVentas == 0L) buildDemoContent() else buildContent(data)
            _uiState.value = _uiState.value.copy(content = UiState.Success(content))
        }
    }

    private fun buildContent(data: ReportesData): ReportesContent {
        val ticketPromedio = if (data.cantidadFacturas > 0)
            data.totalVentas / data.cantidadFacturas else 0L

        val changePercent = if (data.prevTotalVentas > 0) {
            ((data.totalVentas - data.prevTotalVentas) * 100 / data.prevTotalVentas).toInt()
        } else null
        val changePositive = changePercent?.let { it >= 0 }

        val topProductos = data.topProductos.map { TopProducto(it.nombre, it.cantidad, it.total) }
        val bottomProductos = data.bottomProductos.map { TopProducto(it.nombre, it.cantidad, it.total) }

        val clientesFrecuentes = data.clientesFrecuentes.map {
            ClienteFrecuente(it.clienteNombre, initials(it.clienteNombre), it.compraCount, it.totalAmount)
        }

        val maxCount = data.hourlyDistribution.maxOfOrNull { it.count } ?: 1
        val hourlySlots = data.hourlyDistribution.map {
            HourSlotUi(
                label = "${it.startHour}:00",
                count = it.count,
                fraction = if (maxCount > 0) it.count.toFloat() / maxCount else 0f
            )
        }
        val peakSlot = data.hourlyDistribution.maxByOrNull { it.count }
        val peakSlotLabel = peakSlot?.let { "${it.startHour}:00 - ${it.endHour}:00" } ?: ""

        val now = LocalDate.now()
        val monthName = now.month.getDisplayName(TextStyle.FULL, Locale("es", "PY"))
            .replaceFirstChar { it.uppercase() }
        val resumenMes = "$monthName ${now.year}"

        return ReportesContent(
            totalVentas = data.totalVentas,
            cantidadFacturas = data.cantidadFacturas,
            totalIva10 = data.totalIva10,
            totalIva5 = data.totalIva5,
            totalExenta = data.totalExenta,
            ticketPromedio = ticketPromedio,
            changePercent = changePercent,
            changePositive = changePositive,
            topProductos = topProductos,
            bottomProductos = bottomProductos,
            productosTab = ProductosTab.MAS_VENDIDOS,
            clientesFrecuentes = clientesFrecuentes,
            hourlySlots = hourlySlots,
            peakSlotLabel = peakSlotLabel,
            resumenMes = resumenMes,
            resumenTotalVentas = data.totalVentas,
            resumenIva10 = data.totalIva10,
            resumenIva5 = data.totalIva5,
            resumenFacturasEmitidas = data.cantidadFacturas,
            resumenAnuladas = data.facturasAnuladas
        )
    }

    private fun buildDemoContent(): ReportesContent {
        val now = LocalDate.now()
        val monthName = now.month.getDisplayName(TextStyle.FULL, Locale("es", "PY"))
            .replaceFirstChar { it.uppercase() }

        return ReportesContent(
            totalVentas = 4_850_000,
            cantidadFacturas = 38,
            totalIva10 = 285_000,
            totalIva5 = 145_000,
            totalExenta = 120_000,
            ticketPromedio = 127_632,
            changePercent = 12,
            changePositive = true,
            topProductos = listOf(
                TopProducto("Mandioca", 85, 425_000),
                TopProducto("Cebolla", 60, 300_000),
                TopProducto("Banana", 45, 675_000),
                TopProducto("Yerba Mate", 32, 800_000),
                TopProducto("Arroz", 28, 364_000)
            ),
            bottomProductos = listOf(
                TopProducto("Ajo", 3, 15_000),
                TopProducto("Laurel", 2, 8_000),
                TopProducto("Clavo", 2, 6_000),
                TopProducto("Pimienta", 1, 5_000),
                TopProducto("Comino", 1, 4_000)
            ),
            productosTab = ProductosTab.MAS_VENDIDOS,
            clientesFrecuentes = listOf(
                ClienteFrecuente("Juan Pérez", "JP", 12, 1_200_000),
                ClienteFrecuente("María González", "MG", 8, 850_000),
                ClienteFrecuente("Carlos Benítez", "CB", 6, 620_000),
                ClienteFrecuente("Ana Villalba", "AV", 5, 480_000),
                ClienteFrecuente("Roberto Insfrán", "RI", 4, 350_000)
            ),
            hourlySlots = listOf(
                HourSlotUi("6:00", 2, 0.13f),
                HourSlotUi("8:00", 5, 0.33f),
                HourSlotUi("10:00", 15, 1.0f),
                HourSlotUi("12:00", 8, 0.53f),
                HourSlotUi("14:00", 4, 0.27f),
                HourSlotUi("16:00", 2, 0.13f),
                HourSlotUi("18:00", 1, 0.07f),
                HourSlotUi("20:00", 1, 0.07f)
            ),
            peakSlotLabel = "10:00 - 12:00",
            resumenMes = "$monthName ${now.year}",
            resumenTotalVentas = 4_850_000,
            resumenIva10 = 285_000,
            resumenIva5 = 145_000,
            resumenFacturasEmitidas = 38,
            resumenAnuladas = 1
        )
    }

    companion object {
        fun initials(name: String): String {
            val parts = name.trim().split(" ").filter { it.isNotBlank() }
            return when {
                parts.size >= 2 -> "${parts[0][0]}${parts[1][0]}".uppercase()
                parts.size == 1 -> parts[0].take(2).uppercase()
                else -> "??"
            }
        }
    }
}
