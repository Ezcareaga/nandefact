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

    fun refresh() { loadProductos() }

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

    fun loadForEdit(id: String) {
        viewModelScope.launch {
            val productos = getProductos()
            val found = productos.find { it.id == id } ?: return@launch
            _formState.value = ProductoFormState(
                id = found.id,
                nombre = found.nombre,
                precioUnitario = found.precioUnitario.toString(),
                unidadMedida = found.unidadMedida,
                tasaIva = found.tasaIva,
                categoria = found.categoria ?: "",
                isEditing = true
            )
        }
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
