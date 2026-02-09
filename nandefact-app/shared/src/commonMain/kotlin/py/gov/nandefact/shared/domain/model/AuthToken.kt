package py.gov.nandefact.shared.domain.model

data class AuthToken(
    val accessToken: String,
    val refreshToken: String,
    val userName: String
)
