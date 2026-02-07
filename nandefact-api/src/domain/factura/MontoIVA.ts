import type { TasaIVA } from '../shared/types.js';
import { MontoInvalidoError } from '../errors/MontoInvalidoError.js';

/**
 * Value Object — Cálculo de IVA sobre un monto en PYG.
 * Los precios en Paraguay INCLUYEN IVA. Calcula base gravada y monto IVA.
 * Todos los montos son enteros (PYG sin decimales).
 */
export class MontoIVA {
  readonly montoTotal: number;
  readonly tasaIVA: TasaIVA;
  readonly baseGravada: number;
  readonly montoIVACalculado: number;

  constructor(montoTotal: number, tasaIVA: TasaIVA) {
    if (!Number.isInteger(montoTotal)) {
      throw new MontoInvalidoError('el monto debe ser entero (PYG sin decimales)');
    }

    if (montoTotal < 0) {
      throw new MontoInvalidoError('el monto no puede ser negativo');
    }

    this.montoTotal = montoTotal;
    this.tasaIVA = tasaIVA;

    if (tasaIVA === 10) {
      this.baseGravada = Math.round(montoTotal / 1.1);
      this.montoIVACalculado = montoTotal - this.baseGravada;
    } else if (tasaIVA === 5) {
      this.baseGravada = Math.round(montoTotal / 1.05);
      this.montoIVACalculado = montoTotal - this.baseGravada;
    } else {
      // Exenta
      this.baseGravada = 0;
      this.montoIVACalculado = 0;
    }
  }

  equals(other: MontoIVA): boolean {
    return this.montoTotal === other.montoTotal && this.tasaIVA === other.tasaIVA;
  }
}
