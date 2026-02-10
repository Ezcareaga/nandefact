package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.remote.ClienteApi
import py.gov.nandefact.shared.data.remote.dto.ClienteDto
import py.gov.nandefact.shared.db.NandefactDatabase
import py.gov.nandefact.shared.domain.Cliente
import py.gov.nandefact.shared.domain.ports.ClientePort
import py.gov.nandefact.shared.domain.util.generateUUID

class ClienteRepository(
    private val api: ClienteApi,
    private val database: NandefactDatabase,
    private val demoMode: Boolean = false
) : ClientePort {
    private val queries = database.clienteQueries

    private var seeded = false

    override fun getAll(comercioId: String): List<Cliente> {
        val results = queries.selectAll(comercioId).executeAsList()
        if (results.isEmpty() && demoMode && !seeded) {
            seedDemoData(comercioId)
            seeded = true
            return queries.selectAll(comercioId).executeAsList().map { it.toDomain() }
        }
        return results.map { it.toDomain() }
    }

    private fun seedDemoData(comercioId: String) {
        val seeds = listOf(
            Cliente("seed-c-01", comercioId, "Juan Pérez", "4567890", "CI", "0981123456"),
            Cliente("seed-c-02", comercioId, "María González", "80012345-6", "RUC", "0991654321"),
            Cliente("seed-c-03", comercioId, "Carlos López", "3456789", "CI", "0971987654"),
            Cliente("seed-c-04", comercioId, "Ana Martínez", "5678901", "CI"),
            Cliente("seed-c-05", comercioId, "Empresa ABC S.A.", "80098765-4", "RUC", "021456789")
        )
        seeds.forEach { c ->
            queries.upsert(
                id = c.id, comercioId = c.comercioId, nombre = c.nombre,
                rucCi = c.rucCi, tipoDocumento = c.tipoDocumento,
                telefono = c.telefono, email = c.email,
                enviarWhatsApp = if (c.enviarWhatsApp) 1L else 0L,
                frecuente = if (c.frecuente) 1L else 0L, createdAt = ""
            )
        }
    }

    override fun search(comercioId: String, query: String): List<Cliente> {
        return queries.search(comercioId, query, query).executeAsList().map { it.toDomain() }
    }

    override fun getById(id: String): Cliente? {
        return queries.selectById(id).executeAsOneOrNull()?.toDomain()
    }

    /** Guarda cliente via API (create o update), o local en demo mode */
    override suspend fun save(cliente: Cliente): Result<Unit> {
        if (demoMode) {
            return saveLocal(cliente)
        }
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

    private fun saveLocal(cliente: Cliente): Result<Unit> {
        val id = cliente.id.ifBlank { generateUUID() }
        queries.upsert(
            id = id,
            comercioId = cliente.comercioId,
            nombre = cliente.nombre,
            rucCi = cliente.rucCi,
            tipoDocumento = cliente.tipoDocumento,
            telefono = cliente.telefono,
            email = cliente.email,
            enviarWhatsApp = if (cliente.enviarWhatsApp) 1L else 0L,
            frecuente = if (cliente.frecuente) 1L else 0L,
            createdAt = cliente.createdAt
        )
        return Result.success(Unit)
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
