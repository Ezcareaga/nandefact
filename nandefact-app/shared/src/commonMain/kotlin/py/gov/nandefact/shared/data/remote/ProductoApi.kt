package py.gov.nandefact.shared.data.remote

import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import py.gov.nandefact.shared.data.remote.dto.ApiResponse
import py.gov.nandefact.shared.data.remote.dto.PaginatedResponse
import py.gov.nandefact.shared.data.remote.dto.ProductoDto

class ProductoApi(private val client: ApiClient) {

    suspend fun getAll(page: Int = 1, limit: Int = 50): ApiResponse<PaginatedResponse<ProductoDto>> {
        return client.httpClient.get("api/v1/productos?page=$page&limit=$limit").body()
    }

    suspend fun create(producto: ProductoDto): ApiResponse<ProductoDto> {
        return client.httpClient.post("api/v1/productos") {
            setBody(producto)
        }.body()
    }

    suspend fun update(id: String, producto: ProductoDto): ApiResponse<ProductoDto> {
        return client.httpClient.put("api/v1/productos/$id") {
            setBody(producto)
        }.body()
    }

    suspend fun delete(id: String): ApiResponse<Unit> {
        return client.httpClient.delete("api/v1/productos/$id").body()
    }
}
