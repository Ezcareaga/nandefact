package py.gov.nandefact.shared.domain.usecase

import py.gov.nandefact.shared.data.repository.AuthRepository

class LoginUseCase(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(phone: String, pin: String): Result<Unit> {
        if (phone.length < 9) {
            return Result.failure(IllegalArgumentException("Numero de telefono invalido"))
        }
        if (pin.length < 4) {
            return Result.failure(IllegalArgumentException("PIN debe tener al menos 4 digitos"))
        }
        return authRepository.login(phone, pin)
    }
}
