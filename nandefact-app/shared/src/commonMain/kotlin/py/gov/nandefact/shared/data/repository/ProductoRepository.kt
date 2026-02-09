package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.remote.ProductoApi
import py.gov.nandefact.shared.data.remote.dto.ProductoDto
import py.gov.nandefact.shared.db.NandefactDatabase
import py.gov.nandefact.shared.domain.Producto
import py.gov.nandefact.shared.domain.ports.ProductoPort

class ProductoRepository(
    private val api: ProductoApi,
    private val database: NandefactDatabase
) : ProductoPort {
    private val queries = database.productoQueries

    /** Retorna productos del cache local */
    override fun getAll(comercioId: String): List<Producto> {
        return queries.selectAll(comercioId).executeAsList().map { it.toDomain() }
    }

    override fun search(comercioId: String, query: String): List<Producto> {
        return queries.search(comercioId, query).executeAsList().map { it.toDomain() }
    }

    override fun getById(id: String): Producto? {
        return queries.selectById(id).executeAsOneOrNull()?.toDomain()
    }

    /** Guarda producto via API (create o update) */
    override suspend fun save(producto: Producto): Result<Unit> {
        val dto = ProductoDto(
            id = producto.id,
            comercioId = producto.comercioId,
            nombre = producto.nombre,
            codigo = producto.codigo,
            precioUnitario = producto.precioUnitario,
            unidadMedida = producto.unidadMedida,
            ivaTipo = when (producto.tasaIva) {
                10 -> "10%"
                5 -> "5%"
                else -> "exenta"
            },
            categoria = producto.categoria,
            createdAt = producto.createdAt.ifBlank { null },
            updatedAt = producto.updatedAt.ifBlank { null }
        )
        return try {
            val response = if (producto.id.isNotBlank()) {
                api.update(producto.id, dto)
            } else {
                api.create(dto)
            }
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.error?.message ?: "Error guardando producto"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /** Sincroniza desde API y actualiza cache local */
    suspend fun refresh(comercioId: String): Result<List<Producto>> {
        return try {
            val response = api.getAll()
            if (response.success && response.data != null) {
                // Actualizar cache local
                response.data.data.forEach { dto ->
                    val tasaIva = when (dto.ivaTipo) {
                        "10%" -> 10
                        "5%" -> 5
                        else -> 0
                    }
                    queries.upsert(
                        id = dto.id,
                        comercioId = dto.comercioId,
                        nombre = dto.nombre,
                        codigo = dto.codigo,
                        precioUnitario = dto.precioUnitario,
                        unidadMedida = dto.unidadMedida,
                        tasaIva = tasaIva.toLong(),
                        categoria = dto.categoria,
                        activo = if (dto.activo) 1L else 0L,
                        createdAt = dto.createdAt ?: "",
                        updatedAt = dto.updatedAt ?: ""
                    )
                }
                Result.success(getAll(comercioId))
            } else {
                Result.failure(Exception(response.error?.message ?: "Error cargando productos"))
            }
        } catch (e: Exception) {
            // Si falla la API, retornar cache local
            Result.success(getAll(comercioId))
        }
    }
}

private fun py.gov.nandefact.shared.db.Producto.toDomain() = Producto(
    id = id,
    comercioId = comercioId,
    nombre = nombre,
    codigo = codigo,
    precioUnitario = precioUnitario,
    unidadMedida = unidadMedida,
    tasaIva = tasaIva.toInt(),
    categoria = categoria,
    activo = activo == 1L,
    createdAt = createdAt,
    updatedAt = updatedAt
)
