package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.remote.ClienteApi
import py.gov.nandefact.shared.db.NandefactDatabase
import py.gov.nandefact.shared.domain.Cliente

class ClienteRepository(
    private val api: ClienteApi,
    private val database: NandefactDatabase
) {
    private val queries = database.clienteQueries

    fun getAll(comercioId: String): List<Cliente> {
        return queries.selectAll(comercioId).executeAsList().map { it.toDomain() }
    }

    fun search(comercioId: String, query: String): List<Cliente> {
        return queries.search(comercioId, query, query).executeAsList().map { it.toDomain() }
    }

    fun getById(id: String): Cliente? {
        return queries.selectById(id).executeAsOneOrNull()?.toDomain()
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
