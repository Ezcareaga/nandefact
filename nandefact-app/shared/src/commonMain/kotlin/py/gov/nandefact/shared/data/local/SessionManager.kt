package py.gov.nandefact.shared.data.local

// Interfaz para almacenamiento seguro de sesión (tokens, datos usuario)
expect class SessionManager {
    fun getAccessToken(): String?
    fun getRefreshToken(): String?
    fun saveTokens(accessToken: String, refreshToken: String)
    fun clearSession()
    fun getUserId(): String?
    fun getComercioId(): String?
    fun saveUserInfo(userId: String, comercioId: String, userName: String, comercioName: String)
    fun getUserName(): String?
    fun getComercioName(): String?
}
