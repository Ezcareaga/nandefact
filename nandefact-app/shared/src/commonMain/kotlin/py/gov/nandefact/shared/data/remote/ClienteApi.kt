package py.gov.nandefact.shared.data.remote

import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import py.gov.nandefact.shared.data.remote.dto.ApiResponse
import py.gov.nandefact.shared.data.remote.dto.ClienteDto
import py.gov.nandefact.shared.data.remote.dto.PaginatedResponse

class ClienteApi(private val client: ApiClient) {

    suspend fun getAll(page: Int = 1, limit: Int = 50): ApiResponse<PaginatedResponse<ClienteDto>> {
        return client.httpClient.get("api/v1/clientes") {
            parameter("page", page)
            parameter("limit", limit)
        }.body()
    }

    suspend fun search(query: String): ApiResponse<List<ClienteDto>> {
        return client.httpClient.get("api/v1/clientes/buscar") {
            parameter("q", query)
        }.body()
    }

    suspend fun create(cliente: ClienteDto): ApiResponse<ClienteDto> {
        return client.httpClient.post("api/v1/clientes") {
            setBody(cliente)
        }.body()
    }

    suspend fun update(id: String, cliente: ClienteDto): ApiResponse<ClienteDto> {
        return client.httpClient.put("api/v1/clientes/$id") {
            setBody(cliente)
        }.body()
    }
}
