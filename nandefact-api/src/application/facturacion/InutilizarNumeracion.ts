import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import { ValidacionInputError } from '../errors/ValidacionInputError.js';
import { ComercioNoEncontradoError } from '../errors/ComercioNoEncontradoError.js';

export interface InutilizarNumeracionInput {
  comercioId: string;
  establecimiento: string;
  punto: string;
  desde: number;
  hasta: number;
  motivo: string;
}

export interface InutilizarNumeracionOutput {
  codigoRespuesta: string;
  mensajeRespuesta: string;
  inutilizado: boolean;
}

/**
 * Caso de uso: Inutilizar Numeración (enviar evento de inutilización a SIFEN).
 *
 * Se usa cuando se saltean números en la secuencia de facturación
 * (ej: error al imprimir, formularios dañados, etc.).
 * SIFEN requiere justificar el salto mediante evento de inutilización.
 */
export class InutilizarNumeracion {
  constructor(
    private readonly deps: {
      comercioRepository: IComercioRepository;
      sifenGateway: ISifenGateway;
    }
  ) {}

  async execute(input: InutilizarNumeracionInput): Promise<InutilizarNumeracionOutput> {
    // 1. Validar input
    if (input.desde <= 0) {
      throw new ValidacionInputError('El número inicial debe ser mayor a cero');
    }

    if (input.hasta <= 0) {
      throw new ValidacionInputError('El número final debe ser mayor a cero');
    }

    if (input.desde > input.hasta) {
      throw new ValidacionInputError('El número inicial no puede ser mayor al número final');
    }

    if (!input.motivo || input.motivo.trim().length === 0) {
      throw new ValidacionInputError('El motivo de inutilización es obligatorio');
    }

    // 2. Cargar comercio (necesario para generar XML del evento)
    const comercio = await this.deps.comercioRepository.findById(input.comercioId);
    if (!comercio) {
      throw new ComercioNoEncontradoError(input.comercioId);
    }

    // 3. Enviar evento de inutilización a SIFEN
    const response = await this.deps.sifenGateway.inutilizarNumeracion(
      comercio,
      input.establecimiento,
      input.punto,
      input.desde,
      input.hasta,
      input.motivo
    );

    // 4. Determinar si la inutilización fue exitosa
    // Códigos 0260 y 0261 = inutilización aceptada
    const inutilizado = response.codigo === '0260' || response.codigo === '0261';

    // 5. Retornar resultado
    return {
      codigoRespuesta: response.codigo,
      mensajeRespuesta: response.mensaje,
      inutilizado,
    };
  }
}
