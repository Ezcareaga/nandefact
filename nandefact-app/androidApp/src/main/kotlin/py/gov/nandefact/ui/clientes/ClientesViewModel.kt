package py.gov.nandefact.ui.clientes

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
import py.gov.nandefact.shared.domain.usecase.ClienteInput
import py.gov.nandefact.shared.domain.usecase.GetClientesUseCase
import py.gov.nandefact.shared.domain.usecase.SaveClienteUseCase

data class ClienteUi(
    val id: String,
    val nombre: String,
    val tipoDocumento: String,
    val rucCi: String,
    val telefono: String,
    val enviarWhatsApp: Boolean = true
)

data class ClientesUiState(
    val clientes: List<ClienteUi> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = true,
    // Paginación
    val page: Int = 1,
    val hasMore: Boolean = false
) {
    val clientesFiltrados: List<ClienteUi>
        get() = if (searchQuery.isBlank()) clientes
            else clientes.filter {
                it.nombre.contains(searchQuery, ignoreCase = true) ||
                it.rucCi.contains(searchQuery, ignoreCase = true)
            }
}

data class ClienteFormState(
    val id: String? = null,
    val nombre: String = "",
    val tipoDocumento: String = "CI",
    val rucCi: String = "",
    val telefono: String = "",
    val email: String = "",
    val enviarWhatsApp: Boolean = true,
    val isEditing: Boolean = false,
    val isSaving: Boolean = false
)

class ClientesViewModel(
    private val getClientes: GetClientesUseCase,
    private val saveCliente: SaveClienteUseCase
) : ViewModel() {
    private val _listState = MutableStateFlow(ClientesUiState())
    val listState: StateFlow<ClientesUiState> = _listState.asStateFlow()

    private val _formState = MutableStateFlow(ClienteFormState())
    val formState: StateFlow<ClienteFormState> = _formState.asStateFlow()

    private val _saveSuccess = MutableSharedFlow<Unit>()
    val saveSuccess: SharedFlow<Unit> = _saveSuccess.asSharedFlow()

    private var allClientes: List<ClienteUi> = emptyList()
    private val pageSize = 20
    private val _searchInput = MutableStateFlow("")

    init {
        loadClientes()
        @OptIn(FlowPreview::class)
        viewModelScope.launch {
            _searchInput.debounce(300).distinctUntilChanged().collect { query ->
                _listState.value = _listState.value.copy(searchQuery = query)
            }
        }
    }

    private fun loadClientes() {
        viewModelScope.launch {
            val clientes = getClientes()
            allClientes = clientes.map { c ->
                ClienteUi(
                    id = c.id,
                    nombre = c.nombre,
                    tipoDocumento = c.tipoDocumento,
                    rucCi = c.rucCi ?: "",
                    telefono = c.telefono ?: "",
                    enviarWhatsApp = c.enviarWhatsApp
                )
            }
            if (allClientes.isEmpty()) {
                allClientes = sampleClientes()
            }
            val firstPage = allClientes.take(pageSize)
            _listState.value = _listState.value.copy(
                clientes = firstPage,
                isLoading = false,
                page = 1,
                hasMore = allClientes.size > pageSize
            )
        }
    }

    fun loadMore() {
        val state = _listState.value
        if (!state.hasMore) return
        val nextPage = state.page + 1
        val endIndex = nextPage * pageSize
        _listState.value = state.copy(
            clientes = allClientes.take(endIndex),
            page = nextPage,
            hasMore = endIndex < allClientes.size
        )
    }

    fun onSearchChange(query: String) {
        _searchInput.value = query
    }

    fun loadClienteForEdit(id: String) {
        val cliente = allClientes.find { it.id == id } ?: return
        _formState.value = ClienteFormState(
            id = cliente.id,
            nombre = cliente.nombre,
            tipoDocumento = cliente.tipoDocumento,
            rucCi = cliente.rucCi,
            telefono = cliente.telefono,
            enviarWhatsApp = cliente.enviarWhatsApp,
            isEditing = true
        )
    }

    fun resetForm() {
        _formState.value = ClienteFormState()
    }

    fun onNombreChange(nombre: String) { _formState.value = _formState.value.copy(nombre = nombre) }
    fun onTipoDocChange(tipo: String) { _formState.value = _formState.value.copy(tipoDocumento = tipo) }
    fun onRucCiChange(rucCi: String) { _formState.value = _formState.value.copy(rucCi = rucCi) }
    fun onTelefonoChange(telefono: String) { _formState.value = _formState.value.copy(telefono = telefono) }
    fun onEmailChange(email: String) { _formState.value = _formState.value.copy(email = email) }
    fun onWhatsAppToggle(enabled: Boolean) { _formState.value = _formState.value.copy(enviarWhatsApp = enabled) }

    fun onSave() {
        _formState.value = _formState.value.copy(isSaving = true)
        val form = _formState.value

        viewModelScope.launch {
            val result = saveCliente(
                ClienteInput(
                    id = form.id,
                    nombre = form.nombre,
                    tipoDocumento = form.tipoDocumento,
                    rucCi = form.rucCi.ifBlank { null },
                    telefono = form.telefono.ifBlank { null },
                    email = form.email.ifBlank { null },
                    enviarWhatsApp = form.enviarWhatsApp
                )
            )
            _formState.value = _formState.value.copy(isSaving = false)
            if (result.isSuccess) {
                loadClientes()
                _saveSuccess.emit(Unit)
            }
        }
    }
}

private fun sampleClientes(): List<ClienteUi> = listOf(
    ClienteUi("1", "Juan Pérez", "CI", "4.567.890", "0981123456"),
    ClienteUi("2", "María González", "RUC", "80012345-6", "0991654321"),
    ClienteUi("3", "Carlos López", "CI", "3.456.789", "0971987654"),
    ClienteUi("4", "Ana Martínez", "CI", "5.678.901", ""),
    ClienteUi("5", "Empresa ABC S.A.", "RUC", "80098765-4", "021456789")
)
