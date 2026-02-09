package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.local.SessionManager
import py.gov.nandefact.shared.data.remote.AuthApi
import py.gov.nandefact.shared.domain.ports.AuthPort

class AuthRepository(
    private val authApi: AuthApi,
    private val sessionManager: SessionManager,
    private val demoMode: Boolean = false
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
            if (demoMode) {
                loginAsDemo()
            } else {
                Result.failure(e)
            }
        }
    }

    private fun loginAsDemo(): Result<Unit> {
        sessionManager.saveTokens("demo-token", "demo-refresh")
        sessionManager.saveUserInfo(
            userId = "demo-user-001",
            comercioId = "demo-001",
            userName = "María (Demo)",
            comercioName = "Comercio Demo"
        )
        return Result.success(Unit)
    }

    override fun logout() {
        sessionManager.clearSession()
    }

    override fun getUserName(): String = sessionManager.getUserName() ?: "Usuario"
    override fun getComercioName(): String = sessionManager.getComercioName() ?: "Mi Comercio"
    override fun getComercioId(): String? = sessionManager.getComercioId()
}
