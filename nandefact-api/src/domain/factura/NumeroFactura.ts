/**
 * Value Object — Número de factura con establecimiento, punto de expedición y número correlativo.
 * Formato: XXX-XXX-XXXXXXX (3 dígitos - 3 dígitos - 7 dígitos).
 */
export class NumeroFactura {
  readonly establecimiento: string;
  readonly punto: string;
  readonly numero: string;

  constructor(establecimiento: string, punto: string, numero: string) {
    if (!/^\d{3}$/.test(establecimiento)) {
      throw new Error(`Establecimiento inválido: "${establecimiento}", debe ser 3 dígitos`);
    }

    if (!/^\d{3}$/.test(punto)) {
      throw new Error(`Punto de expedición inválido: "${punto}", debe ser 3 dígitos`);
    }

    if (!/^\d{7}$/.test(numero)) {
      throw new Error(`Número inválido: "${numero}", debe ser 7 dígitos`);
    }

    this.establecimiento = establecimiento;
    this.punto = punto;
    this.numero = numero;
  }

  /** Formato legible: 001-003-0000137 */
  get formatted(): string {
    return `${this.establecimiento}-${this.punto}-${this.numero}`;
  }

  equals(other: NumeroFactura): boolean {
    return (
      this.establecimiento === other.establecimiento &&
      this.punto === other.punto &&
      this.numero === other.numero
    );
  }

  toString(): string {
    return this.formatted;
  }
}
