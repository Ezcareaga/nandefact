import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import { RUC } from '../../domain/comercio/RUC.js';

export interface ConsultarRUCInput {
  ruc: string;
}

export interface ConsultarRUCOutput {
  encontrado: boolean;
  razonSocial: string | null;
  ruc: string;
}

/**
 * Caso de Uso — Consultar RUC contra SIFEN siConsRUC
 *
 * Flow:
 * 1. Validar formato RUC usando value object
 * 2. Consultar SIFEN siConsRUC
 * 3. Retornar resultado
 */
export class ConsultarRUC {
  constructor(
    private readonly deps: {
      sifenGateway: ISifenGateway;
    }
  ) {}

  async execute(input: ConsultarRUCInput): Promise<ConsultarRUCOutput> {
    // 1. Validar formato RUC (propaga RUCInvalidoError del dominio si inválido)
    new RUC(input.ruc);

    // 2. Consultar SIFEN
    const resultado = await this.deps.sifenGateway.consultarRUC(input.ruc);

    // 3. Retornar
    return resultado;
  }
}
