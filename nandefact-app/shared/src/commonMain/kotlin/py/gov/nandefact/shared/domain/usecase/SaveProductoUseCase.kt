package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.Producto
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.ProductoPort

data class ProductoInput(
    val id: String? = null,
    val nombre: String,
    val precioUnitario: Long,
    val unidadMedida: String,
    val tasaIva: Int,
    val categoria: String? = null
)

class SaveProductoUseCase(
    private val productos: ProductoPort,
    private val auth: AuthPort
) {
    suspend operator fun invoke(input: ProductoInput): Result<Unit> {
        if (input.nombre.isBlank()) {
            return Result.failure(IllegalArgumentException("Nombre es obligatorio"))
        }
        if (input.precioUnitario <= 0) {
            return Result.failure(IllegalArgumentException("Precio debe ser mayor a 0"))
        }

        val comercioId = auth.getComercioId()
            ?: return Result.failure(IllegalStateException("Sin comercio autenticado"))

        val producto = Producto(
            id = input.id ?: "",
            comercioId = comercioId,
            nombre = input.nombre,
            precioUnitario = input.precioUnitario,
            unidadMedida = input.unidadMedida,
            tasaIva = input.tasaIva,
            categoria = input.categoria
        )

        return productos.save(producto)
    }
}
