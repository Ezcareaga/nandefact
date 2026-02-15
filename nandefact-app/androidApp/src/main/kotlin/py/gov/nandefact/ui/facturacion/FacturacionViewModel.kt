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
import py.gov.nandefact.shared.domain.Cliente
import py.gov.nandefact.shared.domain.usecase.ClienteInput
import py.gov.nandefact.shared.domain.usecase.CrearFacturaLocalUseCase
import py.gov.nandefact.shared.domain.usecase.FacturaInput
import py.gov.nandefact.shared.domain.usecase.GetClientesUseCase
import py.gov.nandefact.shared.domain.usecase.GetProductosUseCase
import py.gov.nandefact.shared.domain.usecase.ItemInput
import py.gov.nandefact.shared.domain.usecase.SaveClienteUseCase
import py.gov.nandefact.ui.common.UiState
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

enum class ClienteTab { CI, RUC, SIN_DATOS }

data class FacturacionUiState(
    val currentStep: Int = 0, // 0-2 (3 pasos) + 3 = confirmación post-genera
    val productsState: UiState<List<ProductoItem>> = UiState.Loading,
    val searchQuery: String = "",
    val cliente: ClienteSelection = ClienteSelection(),
    val clienteSearchQuery: String = "",
    val condicionPago: PaymentCondition = PaymentCondition.CONTADO,
    val isGenerating: Boolean = false,
    val isGenerated: Boolean = false,
    val facturaNumero: String = "",
    val whatsAppAutoSent: Boolean = false,
    // Paginacion
    val page: Int = 1,
    val hasMore: Boolean = false,
    // Wizard Step 2: clientes
    val clienteTab: ClienteTab = ClienteTab.CI,
    val clientesResults: List<Cliente> = emptyList(),
    val showInlineForm: Boolean = false
) {
    // Propiedad de compatibilidad: extrae la lista de productos del UiState
    val productos: List<ProductoItem>
        get() = (productsState as? UiState.Success)?.data ?: emptyList()

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
    private val crearFacturaLocal: CrearFacturaLocalUseCase,
    private val saveCliente: SaveClienteUseCase,
    private val getClientes: GetClientesUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(FacturacionUiState())
    val uiState: StateFlow<FacturacionUiState> = _uiState.asStateFlow()

    private var allProductos: List<ProductoItem> = emptyList()
    private val pageSize = 20
    private val _searchInput = MutableStateFlow("")
    private val _clienteSearchInput = MutableStateFlow("")

    init {
        loadProductos()
        loadInitialClientes()
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
                if (query.isNotBlank()) {
                    val results = getClientes(query)
                    _uiState.value = _uiState.value.copy(
                        clientesResults = results,
                        showInlineForm = results.isEmpty()
                    )
                } else {
                    val results = getClientes()
                    _uiState.value = _uiState.value.copy(
                        clientesResults = results,
                        showInlineForm = false
                    )
                }
            }
        }
    }

    private fun loadInitialClientes() {
        viewModelScope.launch {
            val results = getClientes()
            _uiState.value = _uiState.value.copy(clientesResults = results)
        }
    }

    private fun loadProductos() {
        viewModelScope.launch {
            try {
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
                val firstPage = allProductos.take(pageSize)
                _uiState.value = _uiState.value.copy(
                    productsState = if (allProductos.isEmpty()) UiState.Empty
                                    else UiState.Success(firstPage),
                    page = 1,
                    hasMore = allProductos.size > pageSize
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    productsState = UiState.Error(
                        message = e.message ?: "Error al cargar productos",
                        retry = ::loadProductos
                    )
                )
            }
        }
    }

    fun loadMoreProducts() {
        val state = _uiState.value
        if (!state.hasMore) return
        val currentList = (state.productsState as? UiState.Success)?.data ?: return
        val nextPage = state.page + 1
        val endIndex = nextPage * pageSize
        val items = allProductos.take(endIndex)
        // Preservar cantidades seleccionadas
        val currentQuantities = currentList.associate { it.id to it.cantidad }
        val merged = items.map { it.copy(cantidad = currentQuantities[it.id] ?: 0) }
        _uiState.value = state.copy(
            productsState = UiState.Success(merged),
            page = nextPage,
            hasMore = endIndex < allProductos.size
        )
    }

    fun onSearchQueryChange(query: String) {
        _searchInput.value = query
    }

    fun onProductQuantityChange(productoId: String, newQty: Int) {
        val currentList = (uiState.value.productsState as? UiState.Success)?.data ?: return
        val updated = currentList.map {
            if (it.id == productoId) it.copy(cantidad = maxOf(0, newQty)) else it
        }
        _uiState.value = _uiState.value.copy(productsState = UiState.Success(updated))
    }

    fun onProductTap(productoId: String) {
        // Shortcut: toque simple = +1
        val currentList = (uiState.value.productsState as? UiState.Success)?.data ?: return
        val updated = currentList.map {
            if (it.id == productoId) it.copy(cantidad = it.cantidad + 1) else it
        }
        _uiState.value = _uiState.value.copy(productsState = UiState.Success(updated))
    }

    fun nextStep() {
        val current = _uiState.value.currentStep
        if (current == 1) {
            saveClienteIfNeeded()
        }
        if (current < 3) {
            _uiState.value = _uiState.value.copy(currentStep = current + 1)
        }
    }

    private fun saveClienteIfNeeded() {
        val cliente = _uiState.value.cliente
        if (!cliente.guardarCliente || cliente.isInnominado) return
        if (cliente.nombre.isBlank()) return
        if (cliente.id != null) return // Ya guardado o seleccionado — no duplicar

        val newId = java.util.UUID.randomUUID().toString()
        viewModelScope.launch {
            val result = saveCliente(
                ClienteInput(
                    id = newId,
                    nombre = cliente.nombre,
                    tipoDocumento = cliente.tipoDocumento,
                    rucCi = cliente.rucCi.ifBlank { null },
                    telefono = cliente.telefono.ifBlank { null }
                )
            )
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    cliente = _uiState.value.cliente.copy(id = newId)
                )
            }
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

    fun onClienteTabChange(tab: ClienteTab) {
        when (tab) {
            ClienteTab.SIN_DATOS -> {
                _uiState.value = _uiState.value.copy(
                    clienteTab = tab,
                    cliente = ClienteSelection(
                        isInnominado = true,
                        nombre = "Consumidor Final",
                        tipoDocumento = "innominado",
                        guardarCliente = false
                    ),
                    clienteSearchQuery = "",
                    showInlineForm = false
                )
                _clienteSearchInput.value = ""
            }
            ClienteTab.CI, ClienteTab.RUC -> {
                val tipoDoc = if (tab == ClienteTab.CI) "CI" else "RUC"
                _uiState.value = _uiState.value.copy(
                    clienteTab = tab,
                    cliente = ClienteSelection(tipoDocumento = tipoDoc),
                    showInlineForm = false
                )
                // Recargar clientes
                viewModelScope.launch {
                    val results = getClientes()
                    _uiState.value = _uiState.value.copy(clientesResults = results)
                }
            }
        }
    }

    fun onSelectInnominado() {
        _uiState.value = _uiState.value.copy(
            clienteTab = ClienteTab.SIN_DATOS,
            cliente = ClienteSelection(
                isInnominado = true,
                nombre = "Consumidor Final",
                tipoDocumento = "innominado",
                guardarCliente = false
            )
        )
    }

    fun onSelectClienteFromList(cliente: Cliente) {
        _uiState.value = _uiState.value.copy(
            cliente = ClienteSelection(
                id = cliente.id,
                nombre = cliente.nombre,
                rucCi = cliente.rucCi ?: "",
                tipoDocumento = cliente.tipoDocumento,
                telefono = cliente.telefono ?: "",
                guardarCliente = false, // Ya existe
                isInnominado = false
            )
        )
    }

    fun onClearClienteSelection() {
        val currentTab = _uiState.value.clienteTab
        val tipoDoc = when (currentTab) {
            ClienteTab.CI -> "CI"
            ClienteTab.RUC -> "RUC"
            ClienteTab.SIN_DATOS -> "innominado"
        }
        _uiState.value = _uiState.value.copy(
            cliente = ClienteSelection(tipoDocumento = tipoDoc)
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
        loadInitialClientes()
    }
}
