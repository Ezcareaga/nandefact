import type { TipoDocumento, TipoContribuyente, TipoEmision } from '../shared/types.js';
import { CDCInvalidoError } from '../errors/CDCInvalidoError.js';

/** Parámetros para generar un CDC */
export interface CDCParams {
  tipoDocumento: TipoDocumento;
  rucBase: string;
  dvRUC: number;
  establecimiento: string;
  puntoExpedicion: string;
  numero: string;
  tipoContribuyente: TipoContribuyente;
  fechaEmision: Date;
  tipoEmision: TipoEmision;
  codigoSeguridad?: string;
}

/**
 * Value Object — Código de Control de 44 dígitos numéricos.
 * Identifica de manera única cada Documento Electrónico en SIFEN.
 * Se genera ANTES de enviar a SIFEN (lo genera nuestro sistema).
 */
export class CDC {
  readonly value: string;

  constructor(value: string) {
    if (!/^\d{44}$/.test(value)) {
      throw new CDCInvalidoError('debe tener exactamente 44 dígitos numéricos');
    }

    const base43 = value.substring(0, 43);
    const dvEsperado = CDC.calcularDV(base43);
    const dvActual = parseInt(value.charAt(43), 10);

    if (dvEsperado !== dvActual) {
      throw new CDCInvalidoError(
        `dígito verificador incorrecto: esperado ${String(dvEsperado)}, recibido ${String(dvActual)}`,
      );
    }

    this.value = value;
  }

  /**
   * Calcula el dígito verificador del CDC usando módulo 11.
   * Factores 2-9 cíclicos aplicados de derecha a izquierda.
   */
  static calcularDV(base43: string): number {
    if (base43.length !== 43) {
      throw new CDCInvalidoError(`base debe tener 43 dígitos, recibido ${String(base43.length)}`);
    }

    let suma = 0;
    for (let i = 42; i >= 0; i--) {
      const digito = parseInt(base43.charAt(i), 10);
      const factor = ((42 - i) % 8) + 2;
      suma += digito * factor;
    }

    const resto = suma % 11;
    if (resto === 0) return 0;
    if (resto === 1) return 1;
    return 11 - resto;
  }

  /** Genera un CDC nuevo a partir de los datos de la factura y el emisor */
  static crear(params: CDCParams): CDC {
    const tipoDoc = params.tipoDocumento.toString().padStart(2, '0');
    const rucBase = params.rucBase.padStart(8, '0');
    const dvRUC = String(params.dvRUC);
    const est = params.establecimiento;
    const punto = params.puntoExpedicion;
    const num = params.numero;
    const tipoCont = String(params.tipoContribuyente);

    const f = params.fechaEmision;
    const fechaStr =
      String(f.getUTCFullYear()) +
      String(f.getUTCMonth() + 1).padStart(2, '0') +
      String(f.getUTCDate()).padStart(2, '0');

    const tipoEmision = String(params.tipoEmision);

    const codigoSeguridad =
      params.codigoSeguridad ??
      String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');

    const base43 = `${tipoDoc}${rucBase}${dvRUC}${est}${punto}${num}${tipoCont}${fechaStr}${tipoEmision}${codigoSeguridad}`;

    if (base43.length !== 43) {
      throw new CDCInvalidoError(
        `longitud base incorrecta: ${String(base43.length)} (esperado 43)`,
      );
    }

    const dv = CDC.calcularDV(base43);
    return new CDC(`${base43}${String(dv)}`);
  }

  // --- Getters para cada campo del CDC ---

  get tipoDocumento(): string {
    return this.value.substring(0, 2);
  }
  get rucEmisor(): string {
    return this.value.substring(2, 10);
  }
  get dvRUC(): string {
    return this.value.substring(10, 11);
  }
  get establecimiento(): string {
    return this.value.substring(11, 14);
  }
  get puntoExpedicion(): string {
    return this.value.substring(14, 17);
  }
  get numero(): string {
    return this.value.substring(17, 24);
  }
  get tipoContribuyente(): string {
    return this.value.substring(24, 25);
  }
  get fechaEmision(): string {
    return this.value.substring(25, 33);
  }
  get tipoEmisionCdc(): string {
    return this.value.substring(33, 34);
  }
  get codigoSeguridad(): string {
    return this.value.substring(34, 43);
  }
  get digitoVerificador(): string {
    return this.value.substring(43, 44);
  }

  equals(other: CDC): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
