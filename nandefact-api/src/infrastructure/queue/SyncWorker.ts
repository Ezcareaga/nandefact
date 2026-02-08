import { Worker, type Job } from 'bullmq';
import { SyncJob } from '../../domain/sync/SyncJob.js';
import type { ProcesarColaSifen } from '../../application/sync/ProcesarColaSifen.js';
import type { ILogger } from '../../domain/shared/ILogger.js';
import { SyncQueueBullMQ } from './SyncQueueBullMQ.js';

export interface SyncWorkerDeps {
  procesarColaSifen: ProcesarColaSifen;
  logger: ILogger;
  redisConnection: { host: string; port: number };
}

/**
 * BullMQ Worker que procesa jobs de la cola sifen-sync.
 * Ejecuta un job a la vez (concurrency: 1) para mantener orden FIFO estricto.
 * Rate limiting: máximo 10 jobs por minuto.
 */
export class SyncWorker {
  private worker: Worker | null = null;
  private readonly deps: SyncWorkerDeps;

  constructor(deps: SyncWorkerDeps) {
    this.deps = deps;
  }

  start(): void {
    this.worker = new Worker(
      SyncQueueBullMQ.QUEUE_NAME,
      async (job: Job) => {
        const syncJob = this.deserializeJob(job.data);
        this.deps.logger.info('Worker recibió job', {
          jobId: syncJob.id,
          comercioId: syncJob.comercioId,
          facturaId: syncJob.facturaId,
          cdc: syncJob.cdc,
          intento: syncJob.intentos + 1,
        });

        const resultado = await this.deps.procesarColaSifen.execute({ job: syncJob });

        this.deps.logger.info('Worker completó job', {
          jobId: syncJob.id,
          comercioId: syncJob.comercioId,
          cdc: syncJob.cdc,
          exito: resultado.exito,
          error: resultado.error,
        });

        return resultado;
      },
      {
        connection: this.deps.redisConnection,
        concurrency: 1, // FIFO strict: one job at a time
        limiter: {
          max: 10, // Max 10 jobs
          duration: 60000, // per minute
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.deps.logger.info('Job completado en queue', { jobId: job?.id });
    });

    this.worker.on('failed', (job, err) => {
      this.deps.logger.error('Job falló en queue', { jobId: job?.id, error: err.message });
    });

    this.deps.logger.info('SyncWorker iniciado', {
      queue: SyncQueueBullMQ.QUEUE_NAME,
      concurrency: 1,
    });
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

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      this.deps.logger.info('SyncWorker detenido');
    }
  }

  isRunning(): boolean {
    return this.worker !== null;
  }
}
