package py.gov.nandefact.fakes

import py.gov.nandefact.shared.domain.Cliente
import py.gov.nandefact.shared.domain.ports.ClientePort

class FakeClientePort(
    initialClientes: List<Cliente> = emptyList(),
    var saveResult: Result<Unit> = Result.success(Unit)
) : ClientePort {

    val clientes = initialClientes.toMutableList()
    var saveCalled = false
        private set
    var lastSavedCliente: Cliente? = null
        private set

    override fun getAll(comercioId: String): List<Cliente> =
        clientes.filter { it.comercioId == comercioId }

    override fun search(comercioId: String, query: String): List<Cliente> =
        clientes.filter {
            it.comercioId == comercioId &&
                (it.nombre.contains(query, ignoreCase = true) ||
                    it.rucCi?.contains(query, ignoreCase = true) == true)
        }

    override fun getById(id: String): Cliente? =
        clientes.find { it.id == id }

    override suspend fun save(cliente: Cliente): Result<Unit> {
        saveCalled = true
        lastSavedCliente = cliente
        if (saveResult.isSuccess) {
            val index = clientes.indexOfFirst { it.id == cliente.id }
            if (index >= 0) clientes[index] = cliente else clientes.add(cliente)
        }
        return saveResult
    }
}
