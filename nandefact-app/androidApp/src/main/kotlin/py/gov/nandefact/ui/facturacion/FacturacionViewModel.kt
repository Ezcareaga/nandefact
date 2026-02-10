package py.gov.nandefact.ui.facturacion

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.usecase.CrearFacturaLocalUseCase
import py.gov.nandefact.shared.domain.usecase.FacturaInput
import py.gov.nandefact.shared.domain.usecase.GetProductosUseCase
import py.gov.nandefact.shared.domain.usecase.ItemInput
import py.gov.nandefact.ui.components.PaymentCondition

// Producto en el wizard
data class ProductoItem(
    val id: String,
    val nombre: String,
    val unidadMedida: String,
    val precioUnitario: Long,
    val tasaIva: Int, // 10, 5, o 0
    val cantidad: Int = 0
)

// Cliente seleccionado
data class ClienteSelection(
    val id: String? = null,
    val nombre: String = "",
    val rucCi: String = "",
    val tipoDocumento: String = "CI", // CI, RUC, innominado
    val telefono: String = "",
    val guardarCliente: Boolean = true,
    val isInnominado: Boolean = false
)

data class FacturacionUiState(
    val currentStep: Int = 0, // 0-3
    val productos: List<ProductoItem> = emptyList(),
    val searchQuery: String = "",
    val cliente: ClienteSelection = ClienteSelection(),
    val clienteSearchQuery: String = "",
    val condicionPago: PaymentCondition = PaymentCondition.CONTADO,
    val isGenerating: Boolean = false,
    val isGenerated: Boolean = false,
    val facturaNumero: String = "",
    val whatsAppAutoSent: Boolean = false,
    val isLoadingProducts: Boolean = true,
    // Paginación
    val page: Int = 1,
    val hasMore: Boolean = false
) {
    val productosSeleccionados: List<ProductoItem>
        get() = productos.filter { it.cantidad > 0 }

    val totalBruto: Long
        get() = productosSeleccionados.sumOf { it.precioUnitario * it.cantidad }

    val totalItems: Int
        get() = productosSeleccionados.size

    // Desglose IVA
    val totalGravada10: Long
        get() = productosSeleccionados.filter { it.tasaIva == 10 }
            .sumOf { it.precioUnitario * it.cantidad }

    val totalGravada5: Long
        get() = productosSeleccionados.filter { it.tasaIva == 5 }
            .sumOf { it.precioUnitario * it.cantidad }

    val totalExenta: Long
        get() = productosSeleccionados.filter { it.tasaIva == 0 }
            .sumOf { it.precioUnitario * it.cantidad }

    val iva10: Long
        get() = totalGravada10 - (totalGravada10 * 100 / 110)

    val iva5: Long
        get() = totalGravada5 - (totalGravada5 * 100 / 105)

    val productosFiltrados: List<ProductoItem>
        get() = if (searchQuery.isBlank()) productos
            else productos.filter {
                it.nombre.contains(searchQuery, ignoreCase = true)
            }

    val canAdvanceStep1: Boolean
        get() = productosSeleccionados.isNotEmpty()
}

class FacturacionViewModel(
    private val getProductos: GetProductosUseCase,
    private val crearFacturaLocal: CrearFacturaLocalUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(FacturacionUiState())
    val uiState: StateFlow<FacturacionUiState> = _uiState.asStateFlow()

    private var allProductos: List<ProductoItem> = emptyList()
    private val pageSize = 20
    private val _searchInput = MutableStateFlow("")
    private val _clienteSearchInput = MutableStateFlow("")

    init {
        loadProductos()
        @OptIn(FlowPreview::class)
        viewModelScope.launch {
            _searchInput.debounce(300).distinctUntilChanged().collect { query ->
                _uiState.value = _uiState.value.copy(searchQuery = query)
            }
        }
        @OptIn(FlowPreview::class)
        viewModelScope.launch {
            _clienteSearchInput.debounce(300).distinctUntilChanged().collect { query ->
                _uiState.value = _uiState.value.copy(clienteSearchQuery = query)
            }
        }
    }

    private fun loadProductos() {
        viewModelScope.launch {
            val productos = getProductos()
            allProductos = productos.map { p ->
                ProductoItem(
                    id = p.id,
                    nombre = p.nombre,
                    unidadMedida = p.unidadMedida,
                    precioUnitario = p.precioUnitario,
                    tasaIva = p.tasaIva
                )
            }
            // Si no hay productos en DB, usar samples
            if (allProductos.isEmpty()) {
                allProductos = sampleProductos()
            }
            val firstPage = allProductos.take(pageSize)
            _uiState.value = _uiState.value.copy(
                productos = firstPage,
                isLoadingProducts = false,
                page = 1,
                hasMore = allProductos.size > pageSize
            )
        }
    }

    fun loadMoreProducts() {
        val state = _uiState.value
        if (!state.hasMore) return
        val nextPage = state.page + 1
        val endIndex = nextPage * pageSize
        val items = allProductos.take(endIndex)
        // Preservar cantidades seleccionadas
        val currentQuantities = state.productos.associate { it.id to it.cantidad }
        val merged = items.map { it.copy(cantidad = currentQuantities[it.id] ?: 0) }
        _uiState.value = state.copy(
            productos = merged,
            page = nextPage,
            hasMore = endIndex < allProductos.size
        )
    }

    fun onSearchQueryChange(query: String) {
        _searchInput.value = query
    }

    fun onProductQuantityChange(productoId: String, newQty: Int) {
        val updated = _uiState.value.productos.map {
            if (it.id == productoId) it.copy(cantidad = maxOf(0, newQty)) else it
        }
        _uiState.value = _uiState.value.copy(productos = updated)
    }

    fun onProductTap(productoId: String) {
        // Shortcut: toque simple = +1
        val updated = _uiState.value.productos.map {
            if (it.id == productoId) it.copy(cantidad = it.cantidad + 1) else it
        }
        _uiState.value = _uiState.value.copy(productos = updated)
    }

    fun nextStep() {
        val current = _uiState.value.currentStep
        if (current < 3) {
            _uiState.value = _uiState.value.copy(currentStep = current + 1)
        }
    }

    fun previousStep() {
        val current = _uiState.value.currentStep
        if (current > 0) {
            _uiState.value = _uiState.value.copy(currentStep = current - 1)
        }
    }

    fun onClienteSearchChange(query: String) {
        _clienteSearchInput.value = query
    }

    fun onSelectInnominado() {
        _uiState.value = _uiState.value.copy(
            cliente = ClienteSelection(isInnominado = true, nombre = "Sin Nombre", tipoDocumento = "innominado")
        )
    }

    fun onClienteNombreChange(nombre: String) {
        _uiState.value = _uiState.value.copy(
            cliente = _uiState.value.cliente.copy(nombre = nombre, isInnominado = false)
        )
    }

    fun onClienteRucCiChange(rucCi: String) {
        _uiState.value = _uiState.value.copy(
            cliente = _uiState.value.cliente.copy(rucCi = rucCi)
        )
    }

    fun onClienteTipoDocChange(tipo: String) {
        _uiState.value = _uiState.value.copy(
            cliente = _uiState.value.cliente.copy(tipoDocumento = tipo, isInnominado = false)
        )
    }

    fun onClienteTelefonoChange(telefono: String) {
        _uiState.value = _uiState.value.copy(
            cliente = _uiState.value.cliente.copy(telefono = telefono)
        )
    }

    fun onGuardarClienteToggle(guardar: Boolean) {
        _uiState.value = _uiState.value.copy(
            cliente = _uiState.value.cliente.copy(guardarCliente = guardar)
        )
    }

    fun onCondicionPagoChange(condicion: PaymentCondition) {
        _uiState.value = _uiState.value.copy(condicionPago = condicion)
    }

    fun onGenerarFactura() {
        _uiState.value = _uiState.value.copy(isGenerating = true)

        viewModelScope.launch {
            val state = _uiState.value
            val input = FacturaInput(
                clienteId = state.cliente.id,
                clienteNombre = state.cliente.nombre.ifBlank { null },
                items = state.productosSeleccionados.map { p ->
                    ItemInput(
                        productoId = p.id,
                        descripcion = p.nombre,
                        cantidad = p.cantidad.toLong(),
                        precioUnitario = p.precioUnitario,
                        tasaIva = p.tasaIva
                    )
                },
                condicionPago = if (state.condicionPago == PaymentCondition.CONTADO) "contado" else "credito"
            )

            val result = crearFacturaLocal(input)
            result.fold(
                onSuccess = { factura ->
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        isGenerated = true,
                        facturaNumero = factura.numero ?: "",
                        currentStep = 3
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isGenerating = false)
                }
            )
        }
    }

    fun resetWizard() {
        _uiState.value = FacturacionUiState()
        loadProductos()
    }
}

// Datos de muestra para desarrollo (cuando no hay productos en DB)
private fun sampleProductos(): List<ProductoItem> = listOf(
    ProductoItem("1", "Mandioca", "kg", 5_000, 5),
    ProductoItem("2", "Cebolla", "kg", 4_000, 5),
    ProductoItem("3", "Banana", "docena", 15_000, 5),
    ProductoItem("4", "Tomate", "kg", 8_000, 5),
    ProductoItem("5", "Arroz", "kg", 6_500, 10),
    ProductoItem("6", "Aceite", "litro", 18_000, 10),
    ProductoItem("7", "Fideos", "unidad", 4_500, 10),
    ProductoItem("8", "Yerba Mate", "kg", 25_000, 10),
    ProductoItem("9", "Azúcar", "kg", 5_500, 10),
    ProductoItem("10", "Sal", "kg", 3_000, 10)
)
