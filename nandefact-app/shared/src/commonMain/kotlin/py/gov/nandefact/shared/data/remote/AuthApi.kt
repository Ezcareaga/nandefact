package py.gov.nandefact.shared.data.remote

import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import py.gov.nandefact.shared.data.remote.dto.ApiResponse
import py.gov.nandefact.shared.data.remote.dto.LoginRequest
import py.gov.nandefact.shared.data.remote.dto.LoginResponse

class AuthApi(private val client: ApiClient) {

    suspend fun login(telefono: String, pin: String): ApiResponse<LoginResponse> {
        return client.httpClient.post("api/v1/auth/login") {
            setBody(LoginRequest(telefono, pin))
        }.body()
    }

    suspend fun refresh(refreshToken: String): ApiResponse<LoginResponse> {
        return client.httpClient.post("api/v1/auth/refresh") {
            setBody(mapOf("refreshToken" to refreshToken))
        }.body()
    }
}
