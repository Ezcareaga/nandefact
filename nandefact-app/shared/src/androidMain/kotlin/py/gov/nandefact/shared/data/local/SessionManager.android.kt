package py.gov.nandefact.shared.data.local

import android.content.Context
import android.content.SharedPreferences

actual class SessionManager(context: Context) {
    // TODO: Migrar a EncryptedSharedPreferences en producción
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "nandefact_session", Context.MODE_PRIVATE
    )

    actual fun getAccessToken(): String? = prefs.getString("access_token", null)
    actual fun getRefreshToken(): String? = prefs.getString("refresh_token", null)

    actual fun saveTokens(accessToken: String, refreshToken: String) {
        prefs.edit()
            .putString("access_token", accessToken)
            .putString("refresh_token", refreshToken)
            .apply()
    }

    actual fun clearSession() {
        prefs.edit().clear().apply()
    }

    actual fun getUserId(): String? = prefs.getString("user_id", null)
    actual fun getComercioId(): String? = prefs.getString("comercio_id", null)

    actual fun saveUserInfo(userId: String, comercioId: String, userName: String, comercioName: String) {
        prefs.edit()
            .putString("user_id", userId)
            .putString("comercio_id", comercioId)
            .putString("user_name", userName)
            .putString("comercio_name", comercioName)
            .apply()
    }

    actual fun getUserName(): String? = prefs.getString("user_name", null)
    actual fun getComercioName(): String? = prefs.getString("comercio_name", null)
}
