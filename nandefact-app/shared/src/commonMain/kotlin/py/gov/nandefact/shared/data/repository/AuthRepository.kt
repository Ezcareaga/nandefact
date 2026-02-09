package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.local.SessionManager
import py.gov.nandefact.shared.data.remote.AuthApi

class AuthRepository(
    private val authApi: AuthApi,
    private val sessionManager: SessionManager
) {
    fun isLoggedIn(): Boolean = sessionManager.getAccessToken() != null

    suspend fun login(telefono: String, pin: String): Result<Unit> {
        return try {
            val response = authApi.login(telefono, pin)
            if (response.success && response.data != null) {
                sessionManager.saveTokens(
                    response.data.accessToken,
                    response.data.refreshToken
                )
                sessionManager.saveUserInfo(
                    userId = response.data.user.id,
                    comercioId = response.data.user.comercio.id,
                    userName = response.data.user.nombre,
                    comercioName = response.data.user.comercio.nombreFantasia
                        ?: response.data.user.comercio.razonSocial
                )
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.error?.message ?: "Error de autenticación"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        sessionManager.clearSession()
    }

    fun getUserName(): String = sessionManager.getUserName() ?: "Usuario"
    fun getComercioName(): String = sessionManager.getComercioName() ?: "Mi Comercio"
    fun getComercioId(): String? = sessionManager.getComercioId()
}
