package py.gov.nandefact.shared.data.remote

import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.serialization.Serializable
import py.gov.nandefact.shared.data.remote.dto.ApiResponse

@Serializable
data class SyncPushRequest(
    val facturas: List<SyncFacturaPayload>
)

@Serializable
data class SyncFacturaPayload(
    val syncId: String,
    val facturaData: String // JSON serializado de la factura completa
)

@Serializable
data class SyncPullResponse(
    val facturas: List<SyncFacturaUpdate>,
    val serverTimestamp: String
)

@Serializable
data class SyncFacturaUpdate(
    val id: String,
    val estadoSifen: String,
    val cdc: String? = null,
    val sifenRespuesta: String? = null
)

class SyncApi(private val client: ApiClient) {

    suspend fun push(request: SyncPushRequest): ApiResponse<Unit> {
        return client.httpClient.post("api/v1/sync/push") {
            setBody(request)
        }.body()
    }

    suspend fun pull(since: String): ApiResponse<SyncPullResponse> {
        return client.httpClient.get("api/v1/sync/pull?since=$since").body()
    }

    suspend fun status(): ApiResponse<Map<String, String>> {
        return client.httpClient.get("api/v1/sync/status").body()
    }
}
