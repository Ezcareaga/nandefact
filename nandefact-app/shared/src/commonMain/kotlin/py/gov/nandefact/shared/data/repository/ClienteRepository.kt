package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.remote.ClienteApi
import py.gov.nandefact.shared.data.remote.dto.ClienteDto
import py.gov.nandefact.shared.db.NandefactDatabase
import py.gov.nandefact.shared.domain.Cliente
import py.gov.nandefact.shared.domain.ports.ClientePort

class ClienteRepository(
    private val api: ClienteApi,
    private val database: NandefactDatabase
) : ClientePort {
    private val queries = database.clienteQueries

    override fun getAll(comercioId: String): List<Cliente> {
        return queries.selectAll(comercioId).executeAsList().map { it.toDomain() }
    }

    override fun search(comercioId: String, query: String): List<Cliente> {
        return queries.search(comercioId, query, query).executeAsList().map { it.toDomain() }
    }

    override fun getById(id: String): Cliente? {
        return queries.selectById(id).executeAsOneOrNull()?.toDomain()
    }

    /** Guarda cliente via API (create o update) */
    override suspend fun save(cliente: Cliente): Result<Unit> {
        val dto = ClienteDto(
            id = cliente.id,
            comercioId = cliente.comercioId,
            nombre = cliente.nombre,
            rucCi = cliente.rucCi,
            tipoDocumento = cliente.tipoDocumento,
            telefono = cliente.telefono,
            email = cliente.email,
            enviarWhatsapp = cliente.enviarWhatsApp,
            frecuente = cliente.frecuente,
            createdAt = cliente.createdAt.ifBlank { null }
        )
        return try {
            val response = if (cliente.id.isNotBlank()) {
                api.update(cliente.id, dto)
            } else {
                api.create(dto)
            }
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.error?.message ?: "Error guardando cliente"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refresh(comercioId: String): Result<List<Cliente>> {
        return try {
            val response = api.getAll()
            if (response.success && response.data != null) {
                response.data.data.forEach { dto ->
                    queries.upsert(
                        id = dto.id,
                        comercioId = dto.comercioId,
                        nombre = dto.nombre,
                        rucCi = dto.rucCi,
                        tipoDocumento = dto.tipoDocumento,
                        telefono = dto.telefono,
                        email = dto.email,
                        enviarWhatsApp = if (dto.enviarWhatsapp) 1L else 0L,
                        frecuente = if (dto.frecuente) 1L else 0L,
                        createdAt = dto.createdAt ?: ""
                    )
                }
                Result.success(getAll(comercioId))
            } else {
                Result.failure(Exception(response.error?.message ?: "Error cargando clientes"))
            }
        } catch (e: Exception) {
            Result.success(getAll(comercioId))
        }
    }
}

private fun py.gov.nandefact.shared.db.Cliente.toDomain() = Cliente(
    id = id,
    comercioId = comercioId,
    nombre = nombre,
    rucCi = rucCi,
    tipoDocumento = tipoDocumento,
    telefono = telefono,
    email = email,
    enviarWhatsApp = enviarWhatsApp == 1L,
    frecuente = frecuente == 1L,
    createdAt = createdAt
)
