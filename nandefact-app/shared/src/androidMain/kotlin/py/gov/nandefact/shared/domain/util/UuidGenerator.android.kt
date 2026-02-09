package py.gov.nandefact.shared.domain.util

actual fun generateUUID(): String = java.util.UUID.randomUUID().toString()
