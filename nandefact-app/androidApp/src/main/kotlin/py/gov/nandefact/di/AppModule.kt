package py.gov.nandefact.di

import org.koin.android.ext.koin.androidContext
import org.koin.core.module.dsl.viewModel
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
import py.gov.nandefact.shared.domain.usecase.CrearFacturaLocalUseCase
import py.gov.nandefact.shared.domain.usecase.GetClientesUseCase
import py.gov.nandefact.shared.domain.usecase.GetFacturasUseCase
import py.gov.nandefact.shared.domain.usecase.GetHomeDataUseCase
import py.gov.nandefact.shared.domain.usecase.GetPendientesUseCase
import py.gov.nandefact.shared.domain.usecase.GetProductosUseCase
import py.gov.nandefact.shared.domain.usecase.GetReportesUseCase
import py.gov.nandefact.shared.domain.usecase.LoginUseCase
import py.gov.nandefact.shared.domain.usecase.SaveClienteUseCase
import py.gov.nandefact.shared.domain.usecase.SaveProductoUseCase
import py.gov.nandefact.shared.domain.usecase.SyncPendientesUseCase
import py.gov.nandefact.shared.sync.NetworkMonitor
import py.gov.nandefact.shared.sync.SyncManager
import py.gov.nandefact.sync.AndroidNetworkMonitor
import py.gov.nandefact.ui.clientes.ClientesViewModel
import py.gov.nandefact.ui.facturacion.FacturacionViewModel
import py.gov.nandefact.ui.facturas.HistorialViewModel
import py.gov.nandefact.ui.home.HomeViewModel
import py.gov.nandefact.ui.login.LoginViewModel
import py.gov.nandefact.ui.pendientes.PendientesViewModel
import py.gov.nandefact.ui.productos.ProductosViewModel
import py.gov.nandefact.ui.reportes.ReportesViewModel

val appModule = module {
    // Base de datos local
    single { DatabaseDriverFactory(androidContext()) }
    single { NandefactDatabase(get<DatabaseDriverFactory>().createDriver()) }

    // Sesion
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
    single { SyncManager(get<FacturaRepository>(), get<SyncApi>(), get<NandefactDatabase>()) }
    single<NetworkMonitor> { AndroidNetworkMonitor(androidContext()) }

    // UseCases
    factory { GetHomeDataUseCase(get<AuthRepository>(), get<FacturaRepository>()) }
    factory { LoginUseCase(get<AuthRepository>()) }
    factory { CrearFacturaLocalUseCase(get<FacturaRepository>(), get<AuthRepository>()) }
    factory { GetProductosUseCase(get<ProductoRepository>(), get<AuthRepository>()) }
    factory { GetClientesUseCase(get<ClienteRepository>(), get<AuthRepository>()) }
    factory { GetFacturasUseCase(get<FacturaRepository>(), get<AuthRepository>()) }
    factory { GetPendientesUseCase(get<FacturaRepository>(), get<AuthRepository>()) }
    factory { GetReportesUseCase(get<FacturaRepository>(), get<AuthRepository>()) }
    factory { SyncPendientesUseCase(get<FacturaRepository>(), get<SyncApi>(), get<AuthRepository>()) }
    factory { SaveProductoUseCase(get<ProductoApi>(), get<AuthRepository>()) }
    factory { SaveClienteUseCase(get<ClienteApi>(), get<AuthRepository>()) }

    // ViewModels
    viewModel { HomeViewModel(get()) }
    viewModel { LoginViewModel(get()) }
    viewModel { FacturacionViewModel(get(), get()) }
    viewModel { ProductosViewModel(get(), get()) }
    viewModel { ClientesViewModel(get(), get()) }
    viewModel { HistorialViewModel(get()) }
    viewModel { PendientesViewModel(get(), get()) }
    viewModel { ReportesViewModel(get()) }
}
