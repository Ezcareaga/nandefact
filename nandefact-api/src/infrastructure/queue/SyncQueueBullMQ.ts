import { Queue } from 'bullmq';
import type { ISyncQueue } from '../../domain/sync/ISyncQueue.js';
import { SyncJob } from '../../domain/sync/SyncJob.js';

/**
 * Implementación de ISyncQueue usando BullMQ.
 * Maneja cola Redis-backed con reintentos exponenciales.
 */
export class SyncQueueBullMQ implements ISyncQueue {
  private readonly queue: Queue;
  static readonly QUEUE_NAME = 'sifen-sync';

  constructor(redisConnection: { host: string; port: number }) {
    this.queue = new Queue(SyncQueueBullMQ.QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for inspection
      },
    });
  }

  async encolar(job: SyncJob): Promise<void> {
    await this.queue.add('procesar-factura', this.serializeJob(job), {
      jobId: job.id,
    });
  }

  async desencolar(): Promise<SyncJob | null> {
    const jobs = await this.queue.getJobs(['waiting'], 0, 0);
    if (jobs.length === 0) return null;
    const firstJob = jobs[0];
    if (!firstJob || !firstJob.data) return null;
    return this.deserializeJob(firstJob.data);
  }

  async completar(_jobId: string): Promise<void> {
    // BullMQ automatically completes jobs when worker returns successfully
    // This method is a no-op in the adapter (worker handles completion)
  }

  async fallar(job: SyncJob, error: string): Promise<void> {
    const updatedJob = job.conError(error);
    const delay = this.calcularBackoff(updatedJob.intentos);

    await this.queue.add('procesar-factura', this.serializeJob(updatedJob), {
      delay,
      jobId: `${updatedJob.id}-retry-${updatedJob.intentos}`,
    });
  }

  async obtenerPendientes(comercioId: string): Promise<SyncJob[]> {
    const jobs = await this.queue.getJobs(['waiting', 'delayed'], 0, 100);
    return jobs
      .filter((j) => j.data.comercioId === comercioId)
      .map((j) => this.deserializeJob(j.data));
  }

  async contarPendientes(comercioId: string): Promise<number> {
    const pendientes = await this.obtenerPendientes(comercioId);
    return pendientes.length;
  }

  /**
   * Calcula el delay de backoff exponencial.
   * intento 1 → 1000ms (2^0 * 1000)
   * intento 2 → 2000ms (2^1 * 1000)
   * intento 3 → 4000ms (2^2 * 1000)
   * intento 4 → 8000ms (2^3 * 1000)
   * intento 5 → 16000ms (2^4 * 1000)
   */
  calcularBackoff(intento: number): number {
    return Math.pow(2, intento - 1) * 1000;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }

  private serializeJob(job: SyncJob): Record<string, unknown> {
    return {
      id: job.id,
      comercioId: job.comercioId,
      facturaId: job.facturaId,
      cdc: job.cdc,
      fechaEmision: job.fechaEmision.toISOString(),
      intentos: job.intentos,
      maxIntentos: job.maxIntentos,
      ultimoError: job.ultimoError,
      creadoEn: job.creadoEn.toISOString(),
    };
  }

  private deserializeJob(data: Record<string, unknown>): SyncJob {
    return new SyncJob({
      id: data.id as string,
      comercioId: data.comercioId as string,
      facturaId: data.facturaId as string,
      cdc: data.cdc as string,
      fechaEmision: new Date(data.fechaEmision as string),
      intentos: data.intentos as number,
      maxIntentos: data.maxIntentos as number,
      ultimoError: (data.ultimoError as string) ?? undefined,
      creadoEn: new Date(data.creadoEn as string),
    });
  }
}
