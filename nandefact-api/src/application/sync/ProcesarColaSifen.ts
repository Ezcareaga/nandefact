import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import type { IXmlGenerator } from '../../domain/factura/IXmlGenerator.js';
import type { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import type { ISyncQueue } from '../../domain/sync/ISyncQueue.js';
import type { ILogger } from '../../domain/shared/ILogger.js';
import type { SyncJob } from '../../domain/sync/SyncJob.js';
import { EnviarFacturaASifen } from '../../domain/factura/EnviarFacturaASifen.js';

export interface ProcesarColaSifenInput {
  job: SyncJob;
}

export interface ProcesarColaSifenOutput {
  exito: boolean;
  facturaId: string;
  cdc: string;
  error?: string;
}

/**
 * Caso de uso: Procesar un job de sincronización de la cola.
 * Ejecuta el flujo sign-send-update-save para una factura y gestiona reintentos.
 */
export class ProcesarColaSifen {
  private readonly enviarFacturaASifen: EnviarFacturaASifen;

  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      comercioRepository: IComercioRepository;
      clienteRepository: IClienteRepository;
      xmlGenerator: IXmlGenerator;
      firmaDigital: IFirmaDigital;
      sifenGateway: ISifenGateway;
      syncQueue: ISyncQueue;
      logger: ILogger;
    },
  ) {
    this.enviarFacturaASifen = new EnviarFacturaASifen(deps);
  }

  async execute(input: ProcesarColaSifenInput): Promise<ProcesarColaSifenOutput> {
    const { job } = input;

    // 1. Log inicio
    this.deps.logger.info('Procesando job', {
      jobId: job.id,
      comercioId: job.comercioId,
      cdc: job.cdc,
      intento: job.intentos + 1,
    });

    // 2. Verificar si está expirada (>72h)
    if (job.estaExpirado()) {
      this.deps.logger.warn('Factura expirada (>72h)', {
        facturaId: job.facturaId,
        cdc: job.cdc,
        fechaEmision: job.fechaEmision,
      });

      // Completar job (no reintentar facturas expiradas)
      await this.deps.syncQueue.completar(job.id);

      return {
        exito: false,
        facturaId: job.facturaId,
        cdc: job.cdc,
        error: 'Factura expirada: superó ventana de 72 horas SIFEN',
      };
    }

    try {
      // 3. Cargar factura
      const factura = await this.deps.facturaRepository.findById(job.facturaId);
      if (!factura) {
        // Factura no existe, completar job
        await this.deps.syncQueue.completar(job.id);
        return {
          exito: false,
          facturaId: job.facturaId,
          cdc: job.cdc,
          error: 'Factura no encontrada',
        };
      }

      // 4. Si ya está aprobada o rechazada, completar job sin procesar
      if (factura.estado === 'aprobado' || factura.estado === 'rechazado') {
        await this.deps.syncQueue.completar(job.id);
        return {
          exito: true,
          facturaId: job.facturaId,
          cdc: job.cdc,
        };
      }

      // 5. Ejecutar flujo de envío a SIFEN via servicio de dominio
      await this.enviarFacturaASifen.ejecutar(factura);

      // 6. Completar job
      await this.deps.syncQueue.completar(job.id);

      // 7. Log resultado
      this.deps.logger.info('Job completado', {
        facturaId: job.facturaId,
        cdc: job.cdc,
        resultado: factura.estado,
      });

      return {
        exito: true,
        facturaId: job.facturaId,
        cdc: job.cdc,
      };
    } catch (error) {
      // Error de red o excepción
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Verificar si puede reintentar
      if (job.puedeReintentar()) {
        // Re-encolar con error
        await this.deps.syncQueue.fallar(job, errorMessage);

        this.deps.logger.error('Job fallido, reintentando', {
          facturaId: job.facturaId,
          cdc: job.cdc,
          intento: job.intentos + 1,
          error: errorMessage,
        });
      } else {
        // Máximo de reintentos alcanzado, abandonar
        await this.deps.syncQueue.completar(job.id);

        this.deps.logger.error('Job fallido, máximo reintentos alcanzado', {
          facturaId: job.facturaId,
          cdc: job.cdc,
          intentos: job.intentos,
        });
      }

      return {
        exito: false,
        facturaId: job.facturaId,
        cdc: job.cdc,
        error: errorMessage,
      };
    }
  }
}
