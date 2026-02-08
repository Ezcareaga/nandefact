import type { SyncJob } from './SyncJob.js';

/**
 * Puerto — Cola de sincronización asíncrona.
 * Define el contrato para el sistema de colas (implementado con BullMQ en infrastructure).
 */
export interface ISyncQueue {
  /**
   * Encola un nuevo trabajo de sincronización.
   */
  encolar(job: SyncJob): Promise<void>;

  /**
   * Desencola el siguiente trabajo pendiente (FIFO).
   * Retorna null si no hay trabajos pendientes.
   */
  desencolar(): Promise<SyncJob | null>;

  /**
   * Marca un trabajo como completado y lo remueve de la cola.
   */
  completar(jobId: string): Promise<void>;

  /**
   * Marca un trabajo como fallido. Si puede reintentar, lo reencola con backoff.
   * Si no puede reintentar, lo completa (remove de la cola).
   */
  fallar(job: SyncJob, error: string): Promise<void>;

  /**
   * Obtiene todos los trabajos pendientes de un comercio.
   */
  obtenerPendientes(comercioId: string): Promise<SyncJob[]>;

  /**
   * Cuenta los trabajos pendientes de un comercio.
   */
  contarPendientes(comercioId: string): Promise<number>;
}
