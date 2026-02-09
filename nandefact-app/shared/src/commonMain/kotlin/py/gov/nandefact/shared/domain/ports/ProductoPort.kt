package py.gov.nandefact.shared.domain.ports

import py.gov.nandefact.shared.domain.Producto

/** Puerto: contrato para acceso a productos */
interface ProductoPort {
    fun getAll(comercioId: String): List<Producto>
    fun search(comercioId: String, query: String): List<Producto>
    fun getById(id: String): Producto?
    suspend fun save(producto: Producto): Result<Unit>
}
