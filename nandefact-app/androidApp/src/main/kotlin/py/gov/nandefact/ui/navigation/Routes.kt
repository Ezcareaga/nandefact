package py.gov.nandefact.ui.navigation

sealed class Routes(val route: String) {
    data object Login : Routes("login")
    data object Home : Routes("home")
    data object Facturacion : Routes("facturacion")
    data object Productos : Routes("productos")
    data object ProductoForm : Routes("producto_form/{productoId}") {
        fun create() = "producto_form/new"
        fun edit(id: String) = "producto_form/$id"
    }
    data object Clientes : Routes("clientes")
    data object ClienteForm : Routes("cliente_form/{clienteId}") {
        fun create() = "cliente_form/new"
        fun edit(id: String) = "cliente_form/$id"
    }
    data object Historial : Routes("historial")
    data object FacturaDetalle : Routes("factura_detalle/{facturaId}") {
        fun withId(id: String) = "factura_detalle/$id"
    }
    data object Pendientes : Routes("pendientes")
    data object Reportes : Routes("reportes")
    data object Config : Routes("config")
}
