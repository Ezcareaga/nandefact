import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import type { Factura } from '../../domain/factura/Factura.js';

export interface SincronizarPendientesInput {
  comercioId: string;
}

export interface ResultadoFactura {
  facturaId: string;
  cdc: string;
  exito: boolean;
  error?: string;
}

export interface SincronizarPendientesOutput {
  totalProcesadas: number;
  exitosas: number;
  fallidas: number;
  resultados: ResultadoFactura[];
}

/**
 * Caso de uso: Sincronizar facturas pendientes con SIFEN.
 *
 * Procesa todas las facturas en estado pendiente de un comercio en orden FIFO (más antigua primero).
 * Continúa procesando aunque una factura falle, para maximizar la sincronización.
 *
 * NOTA: La generación de XML aquí es un placeholder. La implementación completa
 * según especificación SIFEN se hará en Phase 2 - SIFEN Integration.
 */
export class SincronizarPendientes {
  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      firmaDigital: IFirmaDigital;
      sifenGateway: ISifenGateway;
    },
  ) {}

  async execute(input: SincronizarPendientesInput): Promise<SincronizarPendientesOutput> {
    // 1. Cargar facturas pendientes
    const facturasPendientes = await this.deps.facturaRepository.findPendientes(
      input.comercioId,
    );

    // 2. Si no hay pendientes, retornar resultado vacío
    if (facturasPendientes.length === 0) {
      return {
        totalProcesadas: 0,
        exitosas: 0,
        fallidas: 0,
        resultados: [],
      };
    }

    // 3. Ordenar en FIFO (más antigua primero) por fechaEmision
    const facturasOrdenadas = this.ordenarFIFO(facturasPendientes);

    // 4. Procesar secuencialmente cada factura
    const resultados: ResultadoFactura[] = [];
    let exitosas = 0;
    let fallidas = 0;

    for (const factura of facturasOrdenadas) {
      try {
        // Procesar factura individual (sign-send-update-save)
        await this.procesarFactura(factura);

        // Registrar resultado exitoso
        if (!factura.cdc) {
          throw new Error(`Factura ${factura.id} procesada sin CDC`);
        }
        resultados.push({
          facturaId: factura.id,
          cdc: factura.cdc.value,
          exito: true,
        });
        exitosas++;
      } catch (error) {
        // Error de red/excepción: registrar como fallida
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        resultados.push({
          facturaId: factura.id,
          cdc: factura.cdc?.value ?? '',
          exito: false,
          error: errorMessage,
        });
        fallidas++;

        // Guardar factura con estado enviada (intento registrado)
        await this.deps.facturaRepository.save(factura);
      }
    }

    // 5. Retornar resumen
    return {
      totalProcesadas: facturasOrdenadas.length,
      exitosas,
      fallidas,
      resultados,
    };
  }

  /**
   * Ordena facturas en FIFO: más antigua primero (fechaEmision ascendente).
   */
  private ordenarFIFO(facturas: Factura[]): Factura[] {
    return [...facturas].sort((a, b) => {
      return a.fechaEmision.getTime() - b.fechaEmision.getTime();
    });
  }

  /**
   * Procesa una factura individual: marca enviada → firma → envía → actualiza estado → guarda.
   * Mismo flujo que EnviarDE, pero centralizado aquí para sincronización.
   */
  private async procesarFactura(factura: Factura): Promise<void> {
    // 1. Marcar como enviada (registra el intento)
    factura.marcarEnviada();

    // 2. Generar XML placeholder (será reemplazado en Phase 2)
    if (!factura.cdc) {
      throw new Error(`Factura ${factura.id} no tiene CDC generado`);
    }
    const xmlPlaceholder = this.generarXmlPlaceholder(factura.cdc.value);

    // 3. Firmar XML con certificado CCFE
    const xmlFirmado = await this.deps.firmaDigital.firmar(xmlPlaceholder);

    // 4. Enviar a SIFEN
    const response = await this.deps.sifenGateway.enviarDE(xmlFirmado);

    // 5. Actualizar estado según respuesta SIFEN
    // Códigos 0260 y 0261 = aprobado (con o sin observación)
    // Cualquier otro código = rechazado
    const esAprobado = response.codigo === '0260' || response.codigo === '0261';
    if (esAprobado) {
      factura.marcarAprobada();
    } else {
      factura.marcarRechazada();
    }

    // 6. Persistir factura con estado actualizado
    await this.deps.facturaRepository.save(factura);
  }

  /**
   * Genera XML placeholder para testing.
   * Este será reemplazado por la generación real según especificación SIFEN en Phase 2.
   */
  private generarXmlPlaceholder(cdc: string): string {
    return `<DE><CDC>${cdc}</CDC></DE>`;
  }
}
