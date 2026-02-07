import { RUCInvalidoError } from '../errors/RUCInvalidoError.js';

/**
 * Value Object — RUC paraguayo con dígito verificador.
 * Formato: XXXXXXXX-D donde D es el DV calculado por módulo 11.
 */
export class RUC {
  readonly value: string;
  readonly base: string;
  readonly dv: number;

  constructor(value: string) {
    const match = /^(\d+)-(\d)$/.exec(value);
    if (!match) {
      throw new RUCInvalidoError(`formato inválido "${value}", esperado XXXXXXXX-D`);
    }

    const base = match[1] as string;
    const dv = parseInt(match[2] as string, 10);

    if (base.length === 0 || base.length > 8) {
      throw new RUCInvalidoError('la parte numérica debe tener entre 1 y 8 dígitos');
    }

    const dvCalculado = RUC.calcularDV(base);
    if (dvCalculado !== dv) {
      throw new RUCInvalidoError(
        `dígito verificador incorrecto: esperado ${String(dvCalculado)}, recibido ${String(dv)}`,
      );
    }

    this.value = value;
    this.base = base;
    this.dv = dv;
  }

  /**
   * Calcula el DV del RUC usando módulo 11, factores 2-9 cíclicos de derecha a izquierda.
   */
  static calcularDV(base: string): number {
    let suma = 0;
    const len = base.length;

    for (let i = len - 1; i >= 0; i--) {
      const digito = parseInt(base.charAt(i), 10);
      const factor = ((len - 1 - i) % 8) + 2;
      suma += digito * factor;
    }

    const resto = suma % 11;
    if (resto <= 1) return 0;
    return 11 - resto;
  }

  /** Base numérica del RUC, padded a 8 dígitos para uso en CDC */
  get basePadded(): string {
    return this.base.padStart(8, '0');
  }

  equals(other: RUC): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
