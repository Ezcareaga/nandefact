import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { ISyncQueue } from '../../domain/sync/ISyncQueue.js';
import { SyncJob } from '../../domain/sync/SyncJob.js';
import { FacturaNoEncontradaError } from '../errors/FacturaNoEncontradaError.js';
import { CDCSinGenerarError } from '../../domain/errors/CDCSinGenerarError.js';
import { EstadoInconsistenteAppError } from '../errors/EstadoInconsistenteAppError.js';
import { randomUUID } from 'node:crypto';

export interface EncolarFacturaInput {
  facturaId: string;
}

export interface EncolarFacturaOutput {
  jobId: string;
  cdc: string;
}

/**
 * Caso de uso: Encolar una factura para sincronización asíncrona con SIFEN.
 * Valida que la factura exista, tenga CDC y esté en estado pendiente, luego la encola.
 */
export class EncolarFactura {
  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      syncQueue: ISyncQueue;
    },
  ) {}

  async execute(input: EncolarFacturaInput): Promise<EncolarFacturaOutput> {
    // 1. Cargar factura
    const factura = await this.deps.facturaRepository.findById(input.facturaId);
    if (!factura) {
      throw new FacturaNoEncontradaError(input.facturaId);
    }

    // 2. Validar que tenga CDC generado
    if (!factura.cdc) {
      throw new CDCSinGenerarError(input.facturaId);
    }

    // 3. Validar que esté en estado pendiente
    if (factura.estado !== 'pendiente') {
      throw new EstadoInconsistenteAppError(`solo se pueden encolar facturas en estado pendiente, estado actual: ${factura.estado}`);
    }

    // 4. Crear SyncJob
    const job = new SyncJob({
      id: randomUUID(),
      comercioId: factura.comercioId,
      facturaId: factura.id,
      cdc: factura.cdc.value,
      fechaEmision: factura.fechaEmision,
      intentos: 0,
      maxIntentos: SyncJob.MAX_INTENTOS_DEFAULT,
      creadoEn: new Date(),
    });

    // 5. Encolar job
    await this.deps.syncQueue.encolar(job);

    // 6. Retornar resultado
    return {
      jobId: job.id,
      cdc: factura.cdc.value,
    };
  }
}
