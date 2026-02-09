package py.gov.nandefact

import android.app.Application
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger
import org.koin.core.context.startKoin
import py.gov.nandefact.di.appModule
import py.gov.nandefact.sync.SyncScheduler

class NandefactApp : Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidLogger()
            androidContext(this@NandefactApp)
            modules(appModule)
        }

        // Programar sincronizacion periodica cada 15 minutos
        SyncScheduler.schedule(this)
    }
}
