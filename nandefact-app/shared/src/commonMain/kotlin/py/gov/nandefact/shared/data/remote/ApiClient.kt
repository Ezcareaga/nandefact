package py.gov.nandefact.shared.data.remote

import io.ktor.client.HttpClient
import io.ktor.client.plugins.auth.Auth
import io.ktor.client.plugins.auth.providers.BearerTokens
import io.ktor.client.plugins.auth.providers.bearer
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class ApiClient(
    private val baseUrl: String,
    private val tokenProvider: TokenProvider
) {
    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    val httpClient = HttpClient {
        install(ContentNegotiation) {
            json(json)
        }

        install(Logging) {
            level = LogLevel.HEADERS
        }

        install(Auth) {
            bearer {
                loadTokens {
                    val access = tokenProvider.getAccessToken()
                    val refresh = tokenProvider.getRefreshToken()
                    if (access != null && refresh != null) {
                        BearerTokens(access, refresh)
                    } else null
                }
                refreshTokens {
                    val refresh = tokenProvider.getRefreshToken() ?: return@refreshTokens null
                    val newTokens = tokenProvider.refreshTokens(refresh)
                    if (newTokens != null) {
                        BearerTokens(newTokens.first, newTokens.second)
                    } else {
                        tokenProvider.clearTokens()
                        null
                    }
                }
            }
        }

        defaultRequest {
            url(baseUrl)
            contentType(ContentType.Application.Json)
        }
    }
}

interface TokenProvider {
    suspend fun getAccessToken(): String?
    suspend fun getRefreshToken(): String?
    suspend fun saveTokens(accessToken: String, refreshToken: String)
    suspend fun clearTokens()
    suspend fun refreshTokens(refreshToken: String): Pair<String, String>?
}
