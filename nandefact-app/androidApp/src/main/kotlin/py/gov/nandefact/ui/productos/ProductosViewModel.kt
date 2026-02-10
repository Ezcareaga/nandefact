package py.gov.nandefact.ui.productos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import py.gov.nandefact.shared.domain.usecase.GetProductosUseCase
import py.gov.nandefact.shared.domain.usecase.ProductoInput
import py.gov.nandefact.shared.domain.usecase.SaveProductoUseCase

data class ProductoUi(
    val id: String,
    val nombre: String,
    val precioUnitario: Long,
    val unidadMedida: String,
    val tasaIva: Int,
    val categoria: String
)

data class ProductosUiState(
    val productos: List<ProductoUi> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = true,
    // Paginación
    val page: Int = 1,
    val hasMore: Boolean = false
) {
    val productosFiltrados: List<ProductoUi>
        get() = if (searchQuery.isBlank()) productos
            else productos.filter {
                it.nombre.contains(searchQuery, ignoreCase = true) ||
                it.categoria.contains(searchQuery, ignoreCase = true)
            }
}

data class ProductoFormState(
    val id: String? = null,
    val nombre: String = "",
    val precioUnitario: String = "",
    val unidadMedida: String = "unidad",
    val tasaIva: Int = 10,
    val categoria: String = "",
    val isEditing: Boolean = false,
    val isSaving: Boolean = false
)

class ProductosViewModel(
    private val getProductos: GetProductosUseCase,
    private val saveProducto: SaveProductoUseCase
) : ViewModel() {
    private val _listState = MutableStateFlow(ProductosUiState())
    val listState: StateFlow<ProductosUiState> = _listState.asStateFlow()

    private val _formState = MutableStateFlow(ProductoFormState())
    val formState: StateFlow<ProductoFormState> = _formState.asStateFlow()

    private val _saveSuccess = MutableSharedFlow<Unit>()
    val saveSuccess: SharedFlow<Unit> = _saveSuccess.asSharedFlow()

    private var allProductos: List<ProductoUi> = emptyList()
    private val pageSize = 20
    private val _searchInput = MutableStateFlow("")

    init {
        loadProductos()
        @OptIn(FlowPreview::class)
        viewModelScope.launch {
            _searchInput.debounce(300).distinctUntilChanged().collect { query ->
                _listState.value = _listState.value.copy(searchQuery = query)
            }
        }
    }

    private fun loadProductos() {
        viewModelScope.launch {
            val productos = getProductos()
            allProductos = productos.map { p ->
                ProductoUi(
                    id = p.id,
                    nombre = p.nombre,
                    precioUnitario = p.precioUnitario,
                    unidadMedida = p.unidadMedida,
                    tasaIva = p.tasaIva,
                    categoria = p.categoria ?: ""
                )
            }
            if (allProductos.isEmpty()) {
                allProductos = sampleProductos()
            }
            val firstPage = allProductos.take(pageSize)
            _listState.value = _listState.value.copy(
                productos = firstPage,
                isLoading = false,
                page = 1,
                hasMore = allProductos.size > pageSize
            )
        }
    }

    fun loadMore() {
        val state = _listState.value
        if (!state.hasMore) return
        val nextPage = state.page + 1
        val endIndex = nextPage * pageSize
        _listState.value = state.copy(
            productos = allProductos.take(endIndex),
            page = nextPage,
            hasMore = endIndex < allProductos.size
        )
    }

    fun onSearchChange(query: String) {
        _searchInput.value = query
    }

    fun loadProductoForEdit(id: String) {
        val producto = allProductos.find { it.id == id } ?: return
        _formState.value = ProductoFormState(
            id = producto.id,
            nombre = producto.nombre,
            precioUnitario = producto.precioUnitario.toString(),
            unidadMedida = producto.unidadMedida,
            tasaIva = producto.tasaIva,
            categoria = producto.categoria,
            isEditing = true
        )
    }

    fun resetForm() {
        _formState.value = ProductoFormState()
    }

    fun onNombreChange(nombre: String) {
        _formState.value = _formState.value.copy(nombre = nombre)
    }

    fun onPrecioChange(precio: String) {
        _formState.value = _formState.value.copy(precioUnitario = precio.filter { it.isDigit() })
    }

    fun onUnidadChange(unidad: String) {
        _formState.value = _formState.value.copy(unidadMedida = unidad)
    }

    fun onTasaIvaChange(tasa: Int) {
        _formState.value = _formState.value.copy(tasaIva = tasa)
    }

    fun onCategoriaChange(categoria: String) {
        _formState.value = _formState.value.copy(categoria = categoria)
    }

    fun onSave() {
        _formState.value = _formState.value.copy(isSaving = true)
        val form = _formState.value

        viewModelScope.launch {
            val result = saveProducto(
                ProductoInput(
                    id = form.id,
                    nombre = form.nombre,
                    precioUnitario = form.precioUnitario.toLongOrNull() ?: 0,
                    unidadMedida = form.unidadMedida,
                    tasaIva = form.tasaIva,
                    categoria = form.categoria.ifBlank { null }
                )
            )
            _formState.value = _formState.value.copy(isSaving = false)
            if (result.isSuccess) {
                loadProductos()
                _saveSuccess.emit(Unit)
            }
        }
    }
}

private fun sampleProductos(): List<ProductoUi> = listOf(
    ProductoUi("1", "Mandioca", 5_000, "kg", 5, "Verduras"),
    ProductoUi("2", "Cebolla", 4_000, "kg", 5, "Verduras"),
    ProductoUi("3", "Banana", 15_000, "docena", 5, "Frutas"),
    ProductoUi("4", "Tomate", 8_000, "kg", 5, "Verduras"),
    ProductoUi("5", "Arroz", 6_500, "kg", 10, "Granos"),
    ProductoUi("6", "Aceite", 18_000, "litro", 10, "Comestibles"),
    ProductoUi("7", "Fideos", 4_500, "unidad", 10, "Comestibles"),
    ProductoUi("8", "Yerba Mate", 25_000, "kg", 10, "Bebidas")
)
