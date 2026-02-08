export interface SyncJobProps {
  id: string;
  comercioId: string;
  facturaId: string;
  cdc: string;
  fechaEmision: Date;
  intentos: number; // Current attempt count (starts at 0)
  maxIntentos: number; // Max retries (default 5)
  ultimoError?: string; // Last error message
  creadoEn: Date; // When job was enqueued
}

/**
 * Value Object — Representa un trabajo de sincronización en la cola.
 * Inmutable, con métodos para verificar expiración y crear copias con errores.
 */
export class SyncJob {
  static readonly HORAS_LIMITE = 72;
  static readonly MAX_INTENTOS_DEFAULT = 5;

  readonly id: string;
  readonly comercioId: string;
  readonly facturaId: string;
  readonly cdc: string;
  readonly fechaEmision: Date;
  readonly intentos: number;
  readonly maxIntentos: number;
  readonly ultimoError: string | undefined;
  readonly creadoEn: Date;

  constructor(props: SyncJobProps) {
    this.id = props.id;
    this.comercioId = props.comercioId;
    this.facturaId = props.facturaId;
    this.cdc = props.cdc;
    this.fechaEmision = props.fechaEmision;
    this.intentos = props.intentos;
    this.maxIntentos = props.maxIntentos;
    this.ultimoError = props.ultimoError ?? undefined;
    this.creadoEn = props.creadoEn;
  }

  /**
   * Verifica si la factura está expirada (más de 72 horas desde la emisión).
   * SIFEN acepta facturas hasta 72 horas después de la emisión.
   */
  estaExpirado(): boolean {
    const ahora = Date.now();
    const fechaEmisionMs = this.fechaEmision.getTime();
    const horasTranscurridas = (ahora - fechaEmisionMs) / (1000 * 60 * 60);
    return horasTranscurridas > SyncJob.HORAS_LIMITE;
  }

  /**
   * Verifica si el job puede ser reintentado (no ha alcanzado el máximo de intentos).
   */
  puedeReintentar(): boolean {
    return this.intentos < this.maxIntentos;
  }

  /**
   * Crea un nuevo SyncJob con el error registrado y el contador de intentos incrementado.
   * Inmutable: retorna una nueva instancia.
   */
  conError(error: string): SyncJob {
    return new SyncJob({
      id: this.id,
      comercioId: this.comercioId,
      facturaId: this.facturaId,
      cdc: this.cdc,
      fechaEmision: this.fechaEmision,
      intentos: this.intentos + 1,
      maxIntentos: this.maxIntentos,
      ultimoError: error,
      creadoEn: this.creadoEn,
    });
  }
}
