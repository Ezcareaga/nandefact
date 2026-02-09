package py.gov.nandefact.shared.domain.ports

/** Puerto: contrato para autenticacion y sesion */
interface AuthPort {
    fun isLoggedIn(): Boolean
    suspend fun login(telefono: String, pin: String): Result<Unit>
    fun logout()
    fun getUserName(): String
    fun getComercioName(): String
    fun getComercioId(): String?
}
