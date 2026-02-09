package py.gov.nandefact.shared.data.local

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver
import py.gov.nandefact.shared.db.NandefactDatabase

actual class DatabaseDriverFactory {
    actual fun createDriver(): SqlDriver {
        return NativeSqliteDriver(NandefactDatabase.Schema, "nandefact.db")
    }
}
