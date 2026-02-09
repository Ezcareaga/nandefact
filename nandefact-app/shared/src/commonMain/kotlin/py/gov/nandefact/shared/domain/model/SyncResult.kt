package py.gov.nandefact.shared.domain.model

data class SyncResult(
    val total: Int,
    val synced: Int,
    val failed: Int
)
