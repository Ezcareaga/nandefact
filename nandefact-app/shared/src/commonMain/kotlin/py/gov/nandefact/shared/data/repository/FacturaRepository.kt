package py.gov.nandefact.shared.data.repository

import py.gov.nandefact.shared.data.remote.FacturaApi
import py.gov.nandefact.shared.db.NandefactDatabase
import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.ItemFactura

class FacturaRepository(
    private val api: FacturaApi,
    private val database: NandefactDatabase
) {
    private val queries = database.facturaQueries

    /** Guarda factura localmente (offline-first) */
    fun createLocal(factura: Factura, items: List<ItemFactura>) {
        queries.insertFactura(
            id = factura.id,
            comercioId = factura.comercioId,
            usuarioId = factura.usuarioId,
            clienteId = factura.clienteId,
            clienteNombre = factura.clienteNombre,
            cdc = factura.cdc,
            numero = factura.numero,
            tipoDocumento = factura.tipoDocumento.toLong(),
            establecimiento = factura.establecimiento,
            puntoExpedicion = factura.puntoExpedicion,
            condicionPago = factura.condicionPago,
            totalBruto = factura.totalBruto,
            totalIva10 = factura.totalIva10,
            totalIva5 = factura.totalIva5,
            totalExenta = factura.totalExenta,
            totalIva = factura.totalIva,
            totalNeto = factura.totalNeto,
            estadoSifen = factura.estadoSifen,
            createdOffline = if (factura.createdOffline) 1L else 0L,
            createdAt = factura.createdAt
        )

        items.forEach { item ->
            queries.insertDetalle(
                id = item.id,
                facturaId = item.facturaId,
                productoId = item.productoId,
                descripcion = item.descripcion,
                cantidad = item.cantidad,
                precioUnitario = item.precioUnitario,
                subtotal = item.subtotal,
                ivaTasa = item.ivaTasa.toLong(),
                ivaBase = item.ivaBase,
                ivaMonto = item.ivaMonto
            )
        }
    }

    fun getAll(comercioId: String): List<Factura> {
        return queries.selectAll(comercioId).executeAsList().map { it.toDomain() }
    }

    fun getPendientes(comercioId: String): List<Factura> {
        return queries.selectPendientes(comercioId).executeAsList().map { it.toDomain() }
    }

    fun countPendientes(comercioId: String): Long {
        return queries.countPendientes(comercioId).executeAsOne()
    }

    fun getLastFactura(comercioId: String): Factura? {
        return queries.lastFactura(comercioId).executeAsOneOrNull()?.toDomain()
    }

    fun getDetalles(facturaId: String): List<ItemFactura> {
        return queries.selectDetalles(facturaId).executeAsList().map { row ->
            ItemFactura(
                id = row.id,
                facturaId = row.facturaId,
                productoId = row.productoId,
                descripcion = row.descripcion,
                cantidad = row.cantidad,
                precioUnitario = row.precioUnitario,
                subtotal = row.subtotal,
                ivaTasa = row.ivaTasa.toInt(),
                ivaBase = row.ivaBase,
                ivaMonto = row.ivaMonto
            )
        }
    }

    fun updateEstado(facturaId: String, estado: String, respuesta: String?, syncedAt: String) {
        queries.updateEstado(
            estadoSifen = estado,
            sifenRespuesta = respuesta,
            syncedAt = syncedAt,
            id = facturaId
        )
    }
}

private fun py.gov.nandefact.shared.db.Factura.toDomain() = Factura(
    id = id,
    comercioId = comercioId,
    usuarioId = usuarioId,
    clienteId = clienteId,
    clienteNombre = clienteNombre,
    cdc = cdc,
    numero = numero,
    tipoDocumento = tipoDocumento.toInt(),
    establecimiento = establecimiento,
    puntoExpedicion = puntoExpedicion,
    condicionPago = condicionPago,
    totalBruto = totalBruto,
    totalIva10 = totalIva10,
    totalIva5 = totalIva5,
    totalExenta = totalExenta,
    totalIva = totalIva,
    totalNeto = totalNeto,
    estadoSifen = estadoSifen,
    sifenRespuesta = sifenRespuesta,
    whatsappEnviado = whatsappEnviado == 1L,
    kudePdfPath = kudePdfPath,
    createdOffline = createdOffline == 1L,
    createdAt = createdAt,
    syncedAt = syncedAt
)
