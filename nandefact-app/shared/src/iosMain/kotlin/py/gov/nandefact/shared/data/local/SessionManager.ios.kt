package py.gov.nandefact.shared.data.local

import platform.Foundation.NSUserDefaults

actual class SessionManager {
    private val defaults = NSUserDefaults.standardUserDefaults

    actual fun getAccessToken(): String? = defaults.stringForKey("access_token")
    actual fun getRefreshToken(): String? = defaults.stringForKey("refresh_token")

    actual fun saveTokens(accessToken: String, refreshToken: String) {
        defaults.setObject(accessToken, "access_token")
        defaults.setObject(refreshToken, "refresh_token")
    }

    actual fun clearSession() {
        listOf("access_token", "refresh_token", "user_id", "comercio_id", "user_name", "comercio_name")
            .forEach { defaults.removeObjectForKey(it) }
    }

    actual fun getUserId(): String? = defaults.stringForKey("user_id")
    actual fun getComercioId(): String? = defaults.stringForKey("comercio_id")

    actual fun saveUserInfo(userId: String, comercioId: String, userName: String, comercioName: String) {
        defaults.setObject(userId, "user_id")
        defaults.setObject(comercioId, "comercio_id")
        defaults.setObject(userName, "user_name")
        defaults.setObject(comercioName, "comercio_name")
    }

    actual fun getUserName(): String? = defaults.stringForKey("user_name")
    actual fun getComercioName(): String? = defaults.stringForKey("comercio_name")
}
