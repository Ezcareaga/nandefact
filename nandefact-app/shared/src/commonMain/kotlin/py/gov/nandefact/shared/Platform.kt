package py.gov.nandefact.shared

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform
