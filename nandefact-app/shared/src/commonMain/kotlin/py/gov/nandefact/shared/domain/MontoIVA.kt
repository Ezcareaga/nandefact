package py.gov.nandefact.shared.domain

/**
 * Calcula base gravada y monto IVA para PYG (sin decimales).
 * Los precios en Paraguay INCLUYEN IVA.
 */
object MontoIVA {

    data class Resultado(
        val baseGravada: Long,
        val montoIva: Long
    )

    /**
     * @param precioConIva Precio total incluyendo IVA
     * @param tasaIva 10, 5, o 0 (exenta)
     * @param proporcion 100 (normal), 85 (turismo), 30 (inmuebles)
     */
    fun calcular(
        precioConIva: Long,
        tasaIva: Int,
        proporcion: Int = 100
    ): Resultado {
        if (tasaIva == 0) {
            return Resultado(baseGravada = 0, montoIva = 0)
        }

        // Parte gravada según proporción
        val montoGravado = precioConIva * proporcion / 100
        val montoExento = precioConIva - montoGravado

        // Cálculo IVA sobre la parte gravada
        val baseGravada = montoGravado * 100 / (100 + tasaIva)
        val montoIva = montoGravado - baseGravada

        return Resultado(baseGravada = baseGravada, montoIva = montoIva)
    }
}
