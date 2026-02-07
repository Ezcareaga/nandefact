import { TimbradoVencidoError } from '../errors/TimbradoVencidoError.js';

/**
 * Value Object — Timbrado DNIT con rango de vigencia.
 * Inmutable. Valida que el número sea numérico y las fechas coherentes.
 */
export class Timbrado {
  readonly numero: string;
  readonly fechaInicio: Date;
  readonly fechaFin: Date;

  constructor(numero: string, fechaInicio: Date, fechaFin: Date) {
    if (!/^\d{8,15}$/.test(numero)) {
      throw new Error(`Número de timbrado inválido: "${numero}"`);
    }

    if (fechaInicio >= fechaFin) {
      throw new Error('Fecha inicio debe ser anterior a fecha fin del timbrado');
    }

    this.numero = numero;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
  }

  /** Verifica si el timbrado está vigente en una fecha dada (default: ahora) */
  estaVigente(fecha?: Date): boolean {
    const ref = fecha ?? new Date();
    return ref >= this.fechaInicio && ref <= this.fechaFin;
  }

  /** Lanza TimbradoVencidoError si no está vigente en la fecha dada */
  validarVigencia(fecha?: Date): void {
    if (!this.estaVigente(fecha)) {
      throw new TimbradoVencidoError(this.numero, this.fechaFin);
    }
  }

  equals(other: Timbrado): boolean {
    return this.numero === other.numero;
  }

  toString(): string {
    return this.numero;
  }
}
