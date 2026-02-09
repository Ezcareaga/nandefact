package py.gov.nandefact.di

import org.koin.android.ext.koin.androidContext
import org.koin.dsl.module
import py.gov.nandefact.shared.data.local.DatabaseDriverFactory
import py.gov.nandefact.shared.data.local.SessionManager
import py.gov.nandefact.shared.data.remote.ApiClient
import py.gov.nandefact.shared.data.remote.AuthApi
import py.gov.nandefact.shared.data.remote.ClienteApi
import py.gov.nandefact.shared.data.remote.FacturaApi
import py.gov.nandefact.shared.data.remote.ProductoApi
import py.gov.nandefact.shared.data.remote.SyncApi
import py.gov.nandefact.shared.data.remote.TokenProvider
import py.gov.nandefact.shared.data.repository.AuthRepository
import py.gov.nandefact.shared.data.repository.ClienteRepository
import py.gov.nandefact.shared.data.repository.FacturaRepository
import py.gov.nandefact.shared.data.repository.ProductoRepository
import py.gov.nandefact.shared.db.NandefactDatabase
import py.gov.nandefact.shared.sync.SyncManager

val appModule = module {
    // Base de datos local
    single { DatabaseDriverFactory(androidContext()) }
    single { NandefactDatabase(get<DatabaseDriverFactory>().createDriver()) }

    // Sesión
    single { SessionManager(androidContext()) }

    // API Client
    single<TokenProvider> {
        val sessionManager = get<SessionManager>()
        object : TokenProvider {
            override suspend fun getAccessToken() = sessionManager.getAccessToken()
            override suspend fun getRefreshToken() = sessionManager.getRefreshToken()
            override suspend fun saveTokens(accessToken: String, refreshToken: String) =
                sessionManager.saveTokens(accessToken, refreshToken)
            override suspend fun clearTokens() = sessionManager.clearSession()
            override suspend fun refreshTokens(refreshToken: String): Pair<String, String>? {
                // TODO: Implementar refresh real
                return null
            }
        }
    }

    // TODO: Leer baseUrl de BuildConfig o environment
    single { ApiClient("http://10.0.2.2:3000/", get()) }

    // APIs
    single { AuthApi(get()) }
    single { ProductoApi(get()) }
    single { ClienteApi(get()) }
    single { FacturaApi(get()) }
    single { SyncApi(get()) }

    // Repositorios
    single { AuthRepository(get(), get()) }
    single { ProductoRepository(get(), get()) }
    single { ClienteRepository(get(), get()) }
    single { FacturaRepository(get(), get()) }

    // Sync
    single { SyncManager(get(), get()) }
}
