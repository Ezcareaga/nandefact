package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.remote.ProductoApi
import py.gov.nandefact.shared.data.remote.dto.ProductoDto
import py.gov.nandefact.shared.db.NandefactDatabase
import py.gov.nandefact.shared.domain.Producto
import py.gov.nandefact.shared.domain.ports.ProductoPort
import py.gov.nandefact.shared.domain.util.generateUUID

class ProductoRepository(
    private val api: ProductoApi,
    private val database: NandefactDatabase,
    private val demoMode: Boolean = false
) : ProductoPort {
    private val queries = database.productoQueries

    private var seeded = false

    /** Retorna productos del cache local; en demo mode siembra datos iniciales */
    override fun getAll(comercioId: String): List<Producto> {
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
            Producto("seed-p-01", comercioId, "Mandioca", null, 5_000, "kg", 5, "Verduras"),
            Producto("seed-p-02", comercioId, "Cebolla", null, 4_000, "kg", 5, "Verduras"),
            Producto("seed-p-03", comercioId, "Banana", null, 15_000, "docena", 5, "Frutas"),
            Producto("seed-p-04", comercioId, "Tomate", null, 8_000, "kg", 5, "Verduras"),
            Producto("seed-p-05", comercioId, "Arroz", null, 6_500, "kg", 10, "Granos"),
            Producto("seed-p-06", comercioId, "Aceite", null, 18_000, "litro", 10, "Comestibles"),
            Producto("seed-p-07", comercioId, "Fideos", null, 4_500, "unidad", 10, "Comestibles"),
            Producto("seed-p-08", comercioId, "Yerba Mate", null, 25_000, "kg", 10, "Bebidas"),
            Producto("seed-p-09", comercioId, "Azúcar", null, 5_500, "kg", 10, "Comestibles"),
            Producto("seed-p-10", comercioId, "Sal", null, 3_000, "kg", 10, "Comestibles")
        )
        seeds.forEach { p ->
            queries.upsert(
                id = p.id, comercioId = p.comercioId, nombre = p.nombre,
                codigo = p.codigo, precioUnitario = p.precioUnitario,
                unidadMedida = p.unidadMedida, tasaIva = p.tasaIva.toLong(),
                categoria = p.categoria, activo = 1L, createdAt = "", updatedAt = ""
            )
        }
    }

    override fun search(comercioId: String, query: String): List<Producto> {
        return queries.search(comercioId, query).executeAsList().map { it.toDomain() }
    }

    override fun getById(id: String): Producto? {
        return queries.selectById(id).executeAsOneOrNull()?.toDomain()
    }

    /** Guarda producto via API (create o update), o local en demo mode */
    override suspend fun save(producto: Producto): Result<Unit> {
        if (demoMode) {
            return saveLocal(producto)
        }
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

    private fun saveLocal(producto: Producto): Result<Unit> {
        val id = producto.id.ifBlank { generateUUID() }
        queries.upsert(
            id = id,
            comercioId = producto.comercioId,
            nombre = producto.nombre,
            codigo = producto.codigo,
            precioUnitario = producto.precioUnitario,
            unidadMedida = producto.unidadMedida,
            tasaIva = producto.tasaIva.toLong(),
            categoria = producto.categoria,
            activo = if (producto.activo) 1L else 0L,
            createdAt = producto.createdAt,
            updatedAt = producto.updatedAt
        )
        return Result.success(Unit)
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
