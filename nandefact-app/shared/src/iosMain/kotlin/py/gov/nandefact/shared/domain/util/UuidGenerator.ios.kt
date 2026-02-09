package py.gov.nandefact.shared.domain.util

actual fun generateUUID(): String = platform.Foundation.NSUUID().UUIDString()
