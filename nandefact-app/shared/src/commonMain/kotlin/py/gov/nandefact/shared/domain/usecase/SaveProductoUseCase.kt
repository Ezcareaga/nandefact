package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.remote.ProductoApi
import py.gov.nandefact.shared.data.remote.dto.ProductoDto
import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.ProductoRepository

data class ProductoInput(
    val id: String? = null,
    val nombre: String,
    val precioUnitario: Long,
    val unidadMedida: String,
    val tasaIva: Int,
    val categoria: String? = null
)

class SaveProductoUseCase(
    private val productoApi: ProductoApi,
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(input: ProductoInput): Result<Unit> {
        if (input.nombre.isBlank()) {
            return Result.failure(IllegalArgumentException("Nombre es obligatorio"))
        }
        if (input.precioUnitario <= 0) {
            return Result.failure(IllegalArgumentException("Precio debe ser mayor a 0"))
        }

        val comercioId = authRepository.getComercioId()
            ?: return Result.failure(IllegalStateException("Sin comercio autenticado"))

        val dto = ProductoDto(
            id = input.id ?: "",
            comercioId = comercioId,
            nombre = input.nombre,
            codigo = null,
            precioUnitario = input.precioUnitario,
            unidadMedida = input.unidadMedida,
            ivaTipo = when (input.tasaIva) {
                10 -> "10%"
                5 -> "5%"
                else -> "exenta"
            },
            categoria = input.categoria,
            createdAt = null,
            updatedAt = null
        )

        return try {
            val response = if (input.id != null) {
                productoApi.update(input.id, dto)
            } else {
                productoApi.create(dto)
            }
            if (response.success) Result.success(Unit)
            else Result.failure(Exception(response.error?.message ?: "Error guardando producto"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
