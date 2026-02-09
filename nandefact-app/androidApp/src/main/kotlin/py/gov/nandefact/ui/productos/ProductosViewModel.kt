package py.gov.nandefact.ui.productos

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class ProductoUi(
    val id: String,
    val nombre: String,
    val precioUnitario: Long,
    val unidadMedida: String,
    val tasaIva: Int,
    val categoria: String
)

data class ProductosUiState(
    val productos: List<ProductoUi> = sampleProductos(),
    val searchQuery: String = "",
    val isLoading: Boolean = false
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

class ProductosViewModel : ViewModel() {
    private val _listState = MutableStateFlow(ProductosUiState())
    val listState: StateFlow<ProductosUiState> = _listState.asStateFlow()

    private val _formState = MutableStateFlow(ProductoFormState())
    val formState: StateFlow<ProductoFormState> = _formState.asStateFlow()

    fun onSearchChange(query: String) {
        _listState.value = _listState.value.copy(searchQuery = query)
    }

    fun loadProductoForEdit(id: String) {
        val producto = _listState.value.productos.find { it.id == id } ?: return
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
        // TODO: Conectar con repositorio real
        _formState.value = _formState.value.copy(isSaving = true)
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
