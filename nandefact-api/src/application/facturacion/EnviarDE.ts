import type { EstadoSifen } from '../../domain/shared/types.js';
import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import { FacturaNoEncontradaError } from '../errors/FacturaNoEncontradaError.js';

export interface EnviarDEInput {
  facturaId: string;
}

export interface EnviarDEOutput {
  cdc: string;
  estadoSifen: EstadoSifen;
  codigoRespuesta: string;
  mensajeRespuesta: string;
}

/**
 * Caso de uso: Enviar Documento Electrónico a SIFEN.
 *
 * Orquesta el flujo: cargar factura → generar XML → firmar → enviar SIFEN → actualizar estado.
 *
 * NOTA: La generación de XML aquí es un placeholder. La implementación completa
 * según especificación SIFEN se hará en Phase 2 - SIFEN Integration.
 */
export class EnviarDE {
  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      firmaDigital: IFirmaDigital;
      sifenGateway: ISifenGateway;
    },
  ) {}

  async execute(input: EnviarDEInput): Promise<EnviarDEOutput> {
    // 1. Cargar factura
    const factura = await this.deps.facturaRepository.findById(input.facturaId);
    if (!factura) {
      throw new FacturaNoEncontradaError(input.facturaId);
    }

    // 2. Marcar como enviada (registra el intento)
    factura.marcarEnviada();

    // 3. Generar XML placeholder (será reemplazado en Phase 2)
    if (!factura.cdc) {
      throw new Error(`Factura ${input.facturaId} no tiene CDC generado`);
    }
    const xmlPlaceholder = this.generarXmlPlaceholder(factura.cdc.value);

    // 4. Firmar XML con certificado CCFE
    const xmlFirmado = await this.deps.firmaDigital.firmar(xmlPlaceholder);

    // 5. Enviar a SIFEN
    const response = await this.deps.sifenGateway.enviarDE(xmlFirmado);

    // 6. Actualizar estado según respuesta SIFEN
    // Códigos 0260 y 0261 = aprobado (con o sin observación)
    // Cualquier otro código = rechazado
    const esAprobado = response.codigo === '0260' || response.codigo === '0261';
    if (esAprobado) {
      factura.marcarAprobada();
    } else {
      factura.marcarRechazada();
    }

    // 7. Persistir factura con estado actualizado
    await this.deps.facturaRepository.save(factura);

    // 8. Retornar resultado
    return {
      cdc: response.cdc,
      estadoSifen: factura.estado,
      codigoRespuesta: response.codigo,
      mensajeRespuesta: response.mensaje,
    };
  }

  /**
   * Genera XML placeholder para testing.
   * Este será reemplazado por la generación real según especificación SIFEN en Phase 2.
   */
  private generarXmlPlaceholder(cdc: string): string {
    return `<DE><CDC>${cdc}</CDC></DE>`;
  }
}
