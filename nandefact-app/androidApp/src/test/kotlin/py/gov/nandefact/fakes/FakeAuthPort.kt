package py.gov.nandefact.fakes

import py.gov.nandefact.shared.domain.ports.AuthPort

class FakeAuthPort(
    private var loggedIn: Boolean = true,
    private var userName: String = "María Demo",
    private var comercioName: String = "Puesto Demo",
    private var comercioId: String? = "comercio-001",
    var loginResult: Result<Unit> = Result.success(Unit)
) : AuthPort {

    var loginCalled = false
        private set
    var lastPhone: String? = null
        private set
    var lastPin: String? = null
        private set

    override fun isLoggedIn(): Boolean = loggedIn

    override suspend fun login(telefono: String, pin: String): Result<Unit> {
        loginCalled = true
        lastPhone = telefono
        lastPin = pin
        if (loginResult.isSuccess) loggedIn = true
        return loginResult
    }

    override fun logout() {
        loggedIn = false
    }

    override fun getUserName(): String = userName
    override fun getComercioName(): String = comercioName
    override fun getComercioId(): String? = comercioId
}
