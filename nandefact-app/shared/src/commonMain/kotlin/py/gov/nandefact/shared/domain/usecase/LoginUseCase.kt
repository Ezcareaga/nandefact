package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.domain.ports.AuthPort

class LoginUseCase(
    private val auth: AuthPort
) {
    suspend operator fun invoke(phone: String, pin: String): Result<Unit> {
        if (phone.length < 9) {
            return Result.failure(IllegalArgumentException("Numero de telefono invalido"))
        }
        if (pin.length < 4) {
            return Result.failure(IllegalArgumentException("PIN debe tener al menos 4 digitos"))
        }
        return auth.login(phone, pin)
    }
}
