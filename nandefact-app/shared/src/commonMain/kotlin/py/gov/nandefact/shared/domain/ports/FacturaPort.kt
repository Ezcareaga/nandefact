package py.gov.nandefact.shared.domain.ports

import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.ItemFactura

/** Puerto: contrato para acceso a facturas (local + sync) */
interface FacturaPort {
    fun createLocal(factura: Factura, items: List<ItemFactura>)
    fun getAll(comercioId: String): List<Factura>
    fun getPendientes(comercioId: String): List<Factura>
    fun countPendientes(comercioId: String): Long
    fun getLastFactura(comercioId: String): Factura?
    fun getDetalles(facturaId: String): List<ItemFactura>
    fun updateEstado(facturaId: String, estado: String, respuesta: String?, syncedAt: String)
}
