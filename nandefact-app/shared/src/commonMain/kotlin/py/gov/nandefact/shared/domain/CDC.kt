package py.gov.nandefact.shared.domain

import kotlin.random.Random

/**
 * Generador de CDC (Código de Control) de 44 dígitos.
 * Estructura: TipoDoc(2) + RUC(8) + DV_RUC(1) + Establ(3) + PtoExp(3) + Numero(7) +
 *             TipoContrib(1) + Fecha(8) + TipoEmision(1) + CodSeguridad(9) + DV_CDC(1)
 */
object CDC {

    fun generar(
        tipoDocumento: Int,
        ruc: String,
        dvRuc: Int,
        establecimiento: String,
        puntoExpedicion: String,
        numero: Long,
        tipoContribuyente: Int,
        fechaEmision: String, // YYYYMMDD
        tipoEmision: Int = 1
    ): String {
        val codigoSeguridad = Random.nextInt(100_000_000, 999_999_999).toString()
        val rucLimpio = ruc.replace("-", "").take(8).padStart(8, '0')

        val cdc43 = buildString {
            append(tipoDocumento.toString().padStart(2, '0'))
            append(rucLimpio)
            append(dvRuc.toString())
            append(establecimiento.padStart(3, '0'))
            append(puntoExpedicion.padStart(3, '0'))
            append(numero.toString().padStart(7, '0'))
            append(tipoContribuyente.toString())
            append(fechaEmision)
            append(tipoEmision.toString())
            append(codigoSeguridad)
        }

        val dv = calcularDigitoVerificador(cdc43)
        return "$cdc43$dv"
    }

    /**
     * Módulo 11, factores 2-9 cíclicos de derecha a izquierda.
     * Resto 0 → DV=0, Resto 1 → DV=1, sino → DV=11-resto
     */
    fun calcularDigitoVerificador(cadena: String): Int {
        val factores = intArrayOf(2, 3, 4, 5, 6, 7, 8, 9)
        var suma = 0
        var factorIndex = 0

        for (i in cadena.indices.reversed()) {
            val digito = cadena[i].digitToInt()
            suma += digito * factores[factorIndex % factores.size]
            factorIndex++
        }

        val resto = suma % 11
        return when (resto) {
            0 -> 0
            1 -> 1
            else -> 11 - resto
        }
    }

    fun validar(cdc: String): Boolean {
        if (cdc.length != 44) return false
        if (!cdc.all { it.isDigit() }) return false

        val cdc43 = cdc.substring(0, 43)
        val dvEsperado = cdc.last().digitToInt()
        return calcularDigitoVerificador(cdc43) == dvEsperado
    }
}
