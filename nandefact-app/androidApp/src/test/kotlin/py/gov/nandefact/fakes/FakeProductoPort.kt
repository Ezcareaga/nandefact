package py.gov.nandefact.fakes

import py.gov.nandefact.shared.domain.Producto
import py.gov.nandefact.shared.domain.ports.ProductoPort

class FakeProductoPort(
    initialProductos: List<Producto> = emptyList(),
    var saveResult: Result<Unit> = Result.success(Unit)
) : ProductoPort {

    val productos = initialProductos.toMutableList()
    var saveCalled = false
        private set
    var lastSavedProducto: Producto? = null
        private set

    override fun getAll(comercioId: String): List<Producto> =
        productos.filter { it.comercioId == comercioId }

    override fun search(comercioId: String, query: String): List<Producto> =
        productos.filter {
            it.comercioId == comercioId &&
                (it.nombre.contains(query, ignoreCase = true) ||
                    it.categoria?.contains(query, ignoreCase = true) == true)
        }

    override fun getById(id: String): Producto? =
        productos.find { it.id == id }

    override suspend fun save(producto: Producto): Result<Unit> {
        saveCalled = true
        lastSavedProducto = producto
        if (saveResult.isSuccess) {
            val index = productos.indexOfFirst { it.id == producto.id }
            if (index >= 0) productos[index] = producto else productos.add(producto)
        }
        return saveResult
    }
}
