package py.gov.nandefact.shared.data.local

import android.content.Context
import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import py.gov.nandefact.shared.db.NandefactDatabase

actual class DatabaseDriverFactory(private val context: Context) {
    actual fun createDriver(): SqlDriver {
        return AndroidSqliteDriver(NandefactDatabase.Schema, context, "nandefact.db")
    }
}
