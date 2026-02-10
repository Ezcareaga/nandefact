package py.gov.nandefact

import py.gov.nandefact.shared.domain.Cliente
import py.gov.nandefact.shared.domain.Factura
import py.gov.nandefact.shared.domain.ItemFactura
import py.gov.nandefact.shared.domain.Producto

/** Fábricas de datos de prueba */
object TestData {

    const val COMERCIO_ID = "comercio-001"

    fun producto(
        id: String = "prod-1",
        nombre: String = "Mandioca",
        precioUnitario: Long = 5_000,
        tasaIva: Int = 10,
        unidadMedida: String = "kg",
        categoria: String? = "Verduras"
    ) = Producto(
        id = id,
        comercioId = COMERCIO_ID,
        nombre = nombre,
        precioUnitario = precioUnitario,
        unidadMedida = unidadMedida,
        tasaIva = tasaIva,
        categoria = categoria
    )

    fun cliente(
        id: String = "cli-1",
        nombre: String = "Juan Pérez",
        tipoDocumento: String = "CI",
        rucCi: String? = "4567890",
        telefono: String? = "0981123456",
        enviarWhatsApp: Boolean = true
    ) = Cliente(
        id = id,
        comercioId = COMERCIO_ID,
        nombre = nombre,
        tipoDocumento = tipoDocumento,
        rucCi = rucCi,
        telefono = telefono,
        enviarWhatsApp = enviarWhatsApp
    )

    fun factura(
        id: String = "fact-1",
        numero: String? = "001-001-0000001",
        totalBruto: Long = 50_000,
        estadoSifen: String = "pendiente",
        clienteNombre: String? = "Juan Pérez",
        createdAt: String = "2025-01-15T14:30:00"
    ) = Factura(
        id = id,
        comercioId = COMERCIO_ID,
        clienteNombre = clienteNombre,
        numero = numero,
        totalBruto = totalBruto,
        totalIva10 = totalBruto - (totalBruto * 100 / 110),
        estadoSifen = estadoSifen,
        createdOffline = true,
        createdAt = createdAt
    )

    fun itemFactura(
        id: String = "item-1",
        facturaId: String = "fact-1",
        descripcion: String = "Mandioca",
        cantidad: Long = 3,
        precioUnitario: Long = 5_000,
        tasaIva: Int = 10
    ): ItemFactura {
        val subtotal = cantidad * precioUnitario
        return ItemFactura(
            id = id,
            facturaId = facturaId,
            descripcion = descripcion,
            cantidad = cantidad,
            precioUnitario = precioUnitario,
            subtotal = subtotal,
            ivaTasa = tasaIva,
            ivaBase = subtotal * 100 / 110,
            ivaMonto = subtotal - subtotal * 100 / 110
        )
    }

    /** Genera lista de N productos de prueba */
    fun productos(count: Int = 5): List<Producto> = (1..count).map { i ->
        producto(
            id = "prod-$i",
            nombre = "Producto $i",
            precioUnitario = (i * 1_000).toLong()
        )
    }

    /** Genera lista de N clientes de prueba */
    fun clientes(count: Int = 3): List<Cliente> = (1..count).map { i ->
        cliente(id = "cli-$i", nombre = "Cliente $i", rucCi = "${4000000 + i}")
    }

    /** Genera lista de N facturas de prueba */
    fun facturas(count: Int = 3): List<Factura> = (1..count).map { i ->
        factura(
            id = "fact-$i",
            numero = "001-001-${i.toString().padStart(7, '0')}",
            totalBruto = (i * 10_000).toLong(),
            createdAt = "2025-01-${15 + i}T14:${30 + i}:00"
        )
    }
}
