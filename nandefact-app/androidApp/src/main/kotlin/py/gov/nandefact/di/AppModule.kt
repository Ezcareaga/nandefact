package py.gov.nandefact.di

import org.koin.android.ext.koin.androidContext
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module
import py.gov.nandefact.BuildConfig
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
import py.gov.nandefact.shared.domain.ports.AuthPort
import py.gov.nandefact.shared.domain.ports.ClientePort
import py.gov.nandefact.shared.domain.ports.FacturaPort
import py.gov.nandefact.shared.domain.ports.ProductoPort
import py.gov.nandefact.shared.domain.ports.SyncPort
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
import py.gov.nandefact.shared.domain.ports.NetworkMonitor
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

    // Ports (interfaces de domain) → implementaciones en data/
    single<AuthPort> { AuthRepository(get(), get(), BuildConfig.DEMO_MODE) }
    single<FacturaPort> { FacturaRepository(get(), get()) }
    single<ProductoPort> { ProductoRepository(get(), get(), BuildConfig.DEMO_MODE) }
    single<ClientePort> { ClienteRepository(get(), get(), BuildConfig.DEMO_MODE) }
    single<SyncPort> { SyncManager(get(), get()) }
    single<NetworkMonitor> { AndroidNetworkMonitor(androidContext()) }

    // UseCases — inyectan SOLO ports (interfaces de domain)
    factory { GetHomeDataUseCase(get(), get()) }
    factory { LoginUseCase(get()) }
    factory { CrearFacturaLocalUseCase(get(), get()) }
    factory { GetProductosUseCase(get(), get()) }
    factory { GetClientesUseCase(get(), get()) }
    factory { GetFacturasUseCase(get(), get()) }
    factory { GetPendientesUseCase(get(), get()) }
    factory { GetReportesUseCase(get(), get()) }
    factory { SyncPendientesUseCase(get(), get()) }
    factory { SaveProductoUseCase(get(), get()) }
    factory { SaveClienteUseCase(get(), get()) }

    // ViewModels
    viewModel { HomeViewModel(get()) }
    viewModel { LoginViewModel(get()) }
    viewModel { FacturacionViewModel(get(), get(), get(), get()) }
    viewModel { ProductosViewModel(get(), get()) }
    viewModel { ClientesViewModel(get(), get()) }
    viewModel { HistorialViewModel(get()) }
    viewModel { PendientesViewModel(get(), get()) }
    viewModel { ReportesViewModel(get()) }
}
