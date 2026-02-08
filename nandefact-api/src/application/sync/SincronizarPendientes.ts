import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import type { IXmlGenerator } from '../../domain/factura/IXmlGenerator.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import type { Factura } from '../../domain/factura/Factura.js';
import { EnviarFacturaASifen } from '../../domain/factura/EnviarFacturaASifen.js';

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
 */
export class SincronizarPendientes {
  private readonly enviarFacturaASifen: EnviarFacturaASifen;

  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      comercioRepository: IComercioRepository;
      clienteRepository: IClienteRepository;
      xmlGenerator: IXmlGenerator;
      firmaDigital: IFirmaDigital;
      sifenGateway: ISifenGateway;
    },
  ) {
    this.enviarFacturaASifen = new EnviarFacturaASifen(deps);
  }

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
        // Procesar factura individual via servicio de dominio
        await this.enviarFacturaASifen.ejecutar(factura);

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
}
