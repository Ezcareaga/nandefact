package py.gov.nandefact.shared.domain.ports

import py.gov.nandefact.shared.domain.Cliente

/** Puerto: contrato para acceso a clientes */
interface ClientePort {
    fun getAll(comercioId: String): List<Cliente>
    fun search(comercioId: String, query: String): List<Cliente>
    fun getById(id: String): Cliente?
    suspend fun save(cliente: Cliente): Result<Unit>
}
