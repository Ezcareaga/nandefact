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
import py.gov.nandefact.ui.common.UiState

data class ClienteUi(
    val id: String,
    val nombre: String,
    val tipoDocumento: String,
    val rucCi: String,
    val telefono: String,
    val enviarWhatsApp: Boolean = true
)

data class ClientesUiState(
    val content: UiState<List<ClienteUi>> = UiState.Loading,
    val searchQuery: String = "",
    // Paginacion
    val page: Int = 1,
    val hasMore: Boolean = false
) {
    val clientesFiltrados: List<ClienteUi>
        get() {
            val clientes = (content as? UiState.Success)?.data ?: return emptyList()
            return if (searchQuery.isBlank()) clientes
            else clientes.filter {
                it.nombre.contains(searchQuery, ignoreCase = true) ||
                it.rucCi.contains(searchQuery, ignoreCase = true)
            }
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

    fun refresh() { loadClientes() }

    private fun loadClientes() {
        viewModelScope.launch {
            try {
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
                val firstPage = allClientes.take(pageSize)
                _listState.value = _listState.value.copy(
                    content = if (allClientes.isEmpty()) UiState.Empty
                              else UiState.Success(firstPage),
                    page = 1,
                    hasMore = allClientes.size > pageSize
                )
            } catch (e: Exception) {
                _listState.value = _listState.value.copy(
                    content = UiState.Error(
                        message = e.message ?: "Error al cargar clientes",
                        retry = ::loadClientes
                    )
                )
            }
        }
    }

    fun loadMore() {
        val state = _listState.value
        if (!state.hasMore) return
        val currentList = (state.content as? UiState.Success)?.data ?: return
        val nextPage = state.page + 1
        val endIndex = nextPage * pageSize
        _listState.value = state.copy(
            content = UiState.Success(allClientes.take(endIndex)),
            page = nextPage,
            hasMore = endIndex < allClientes.size
        )
    }

    fun onSearchChange(query: String) {
        _searchInput.value = query
    }

    fun loadForEdit(id: String) {
        viewModelScope.launch {
            val clientes = getClientes()
            val found = clientes.find { it.id == id } ?: return@launch
            _formState.value = ClienteFormState(
                id = found.id,
                nombre = found.nombre,
                tipoDocumento = found.tipoDocumento,
                rucCi = found.rucCi ?: "",
                telefono = found.telefono ?: "",
                email = found.email ?: "",
                enviarWhatsApp = found.enviarWhatsApp,
                isEditing = true
            )
        }
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
