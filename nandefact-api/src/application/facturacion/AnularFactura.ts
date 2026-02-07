import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
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
 * La cancelación es un evento SIFEN que no muta el estado de la factura localmente
 * (el estado 'cancelado' será agregado en una fase posterior).
 */
export class AnularFactura {
  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
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

    // 3. Obtener CDC (una factura aprobada siempre tiene CDC)
    const cdc = factura.cdc!.value;

    // 4. Enviar evento de cancelación a SIFEN
    const response = await this.deps.sifenGateway.anularDE(cdc, input.motivo);

    // 5. Determinar si la cancelación fue exitosa
    // Códigos 0260 y 0261 = cancelación aceptada
    const anulada = response.codigo === '0260' || response.codigo === '0261';

    // 6. Retornar resultado
    // NOTA: No mutamos el estado de la factura aquí porque no existe aún
    // el estado 'cancelado'. Esto se agregará en una fase posterior cuando
    // tengamos el modelo completo de estados del ciclo de vida de la factura.
    return {
      cdc: response.cdc,
      codigoRespuesta: response.codigo,
      mensajeRespuesta: response.mensaje,
      anulada,
    };
  }
}
