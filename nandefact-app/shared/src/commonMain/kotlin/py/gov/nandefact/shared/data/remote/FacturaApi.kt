package py.gov.nandefact.shared.data.remote

import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import py.gov.nandefact.shared.data.remote.dto.ApiResponse
import py.gov.nandefact.shared.data.remote.dto.FacturaDto
import py.gov.nandefact.shared.data.remote.dto.FacturaRequest
import py.gov.nandefact.shared.data.remote.dto.PaginatedResponse

class FacturaApi(private val client: ApiClient) {

    suspend fun create(factura: FacturaRequest): ApiResponse<FacturaDto> {
        return client.httpClient.post("api/v1/facturas") {
            setBody(factura)
        }.body()
    }

    suspend fun getAll(page: Int = 1, limit: Int = 50): ApiResponse<PaginatedResponse<FacturaDto>> {
        return client.httpClient.get("api/v1/facturas?page=$page&limit=$limit").body()
    }

    suspend fun getById(id: String): ApiResponse<FacturaDto> {
        return client.httpClient.get("api/v1/facturas/$id").body()
    }

    suspend fun anular(id: String): ApiResponse<FacturaDto> {
        return client.httpClient.post("api/v1/facturas/$id/anular").body()
    }

    suspend fun reenviarWhatsApp(id: String): ApiResponse<Unit> {
        return client.httpClient.post("api/v1/facturas/$id/reenviar").body()
    }
}
