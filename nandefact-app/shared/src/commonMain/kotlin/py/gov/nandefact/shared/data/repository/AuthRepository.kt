package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.local.SessionManager
import py.gov.nandefact.shared.data.remote.AuthApi
import py.gov.nandefact.shared.domain.ports.AuthPort

class AuthRepository(
    private val authApi: AuthApi,
    private val sessionManager: SessionManager
) : AuthPort {
    override fun isLoggedIn(): Boolean = sessionManager.getAccessToken() != null

    override suspend fun login(telefono: String, pin: String): Result<Unit> {
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

    override fun logout() {
        sessionManager.clearSession()
    }

    override fun getUserName(): String = sessionManager.getUserName() ?: "Usuario"
    override fun getComercioName(): String = sessionManager.getComercioName() ?: "Mi Comercio"
    override fun getComercioId(): String? = sessionManager.getComercioId()
}
