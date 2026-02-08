import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import { FacturaNoEncontradaError } from '../errors/FacturaNoEncontradaError.js';
import { FacturaNoAnulableError } from '../errors/FacturaNoAnulableError.js';

export interface AnularFacturaInput {
  facturaId: string;
  motivo: string;
}

export interface AnularFacturaOutput {
  cdc: string;
  codigoRespuesta: string;
  mensajeRespuesta: string;
  anulada: boolean;
}

/**
 * Caso de uso: Anular Factura (enviar evento de cancelación a SIFEN).
 *
 * Solo se pueden anular facturas en estado 'aprobado'.
 */
export class AnularFactura {
  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      comercioRepository: IComercioRepository;
      sifenGateway: ISifenGateway;
    },
  ) {}

  async execute(input: AnularFacturaInput): Promise<AnularFacturaOutput> {
    // 1. Cargar factura
    const factura = await this.deps.facturaRepository.findById(input.facturaId);
    if (!factura) {
      throw new FacturaNoEncontradaError(input.facturaId);
    }

    // 2. Validar que la factura esté en estado aprobado
    if (factura.estado !== 'aprobado') {
      throw new FacturaNoAnulableError(input.facturaId, factura.estado);
    }

    // 3. Cargar comercio (necesario para generar XML del evento)
    const comercio = await this.deps.comercioRepository.findById(factura.comercioId);
    if (!comercio) {
      throw new Error(`Comercio ${factura.comercioId} no encontrado`);
    }

    // 4. Obtener CDC (una factura aprobada siempre tiene CDC)
    if (!factura.cdc) {
      throw new Error(`Factura ${input.facturaId} aprobada sin CDC`);
    }
    const cdc = factura.cdc.value;

    // 5. Enviar evento de cancelación a SIFEN
    const response = await this.deps.sifenGateway.anularDE(comercio, cdc, input.motivo);

    // 6. Determinar si la cancelación fue exitosa
    // Códigos 0260 y 0261 = cancelación aceptada
    const anulada = response.codigo === '0260' || response.codigo === '0261';

    // 7. Actualizar estado si SIFEN aceptó la cancelación
    if (anulada) {
      factura.marcarCancelada();
      await this.deps.facturaRepository.save(factura);
    }

    // 8. Retornar resultado
    return {
      cdc: response.cdc,
      codigoRespuesta: response.codigo,
      mensajeRespuesta: response.mensaje,
      anulada,
    };
  }
}
