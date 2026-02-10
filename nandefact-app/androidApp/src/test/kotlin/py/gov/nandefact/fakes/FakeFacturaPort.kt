package py.gov.nandefact.fakes

import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.ItemFactura
import py.gov.nandefact.shared.domain.ports.FacturaPort

class FakeFacturaPort(
    initialFacturas: List<Factura> = emptyList()
) : FacturaPort {

    val facturas = initialFacturas.toMutableList()
    val items = mutableMapOf<String, MutableList<ItemFactura>>()

    override fun createLocal(factura: Factura, items: List<ItemFactura>) {
        facturas.add(factura)
        this.items[factura.id] = items.toMutableList()
    }

    override fun getAll(comercioId: String): List<Factura> =
        facturas.filter { it.comercioId == comercioId }

    override fun getPendientes(comercioId: String): List<Factura> =
        facturas.filter { it.comercioId == comercioId && it.estadoSifen == "pendiente" }
            .sortedBy { it.createdAt }

    override fun countPendientes(comercioId: String): Long =
        getPendientes(comercioId).size.toLong()

    override fun getLastFactura(comercioId: String): Factura? =
        facturas.filter { it.comercioId == comercioId }
            .maxByOrNull { it.createdAt }

    override fun getDetalles(facturaId: String): List<ItemFactura> =
        items[facturaId] ?: emptyList()

    override fun updateEstado(facturaId: String, estado: String, respuesta: String?, syncedAt: String) {
        val index = facturas.indexOfFirst { it.id == facturaId }
        if (index >= 0) {
            facturas[index] = facturas[index].copy(
                estadoSifen = estado,
                sifenRespuesta = respuesta,
                syncedAt = syncedAt
            )
        }
    }
}
