import type { EstadoSifen } from '../../domain/shared/types.js';
import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import type { IXmlGenerator } from '../../domain/factura/IXmlGenerator.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import { EnviarFacturaASifen } from '../../domain/factura/EnviarFacturaASifen.js';
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
 * Carga la factura y delega el flujo de envío al servicio de dominio EnviarFacturaASifen.
 */
export class EnviarDE {
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

  async execute(input: EnviarDEInput): Promise<EnviarDEOutput> {
    // 1. Cargar factura
    const factura = await this.deps.facturaRepository.findById(input.facturaId);
    if (!factura) {
      throw new FacturaNoEncontradaError(input.facturaId);
    }

    // 2. Ejecutar flujo de envío a SIFEN
    const result = await this.enviarFacturaASifen.ejecutar(factura);

    // 3. Retornar resultado
    return {
      cdc: result.response.cdc,
      estadoSifen: factura.estado,
      codigoRespuesta: result.response.codigo,
      mensajeRespuesta: result.response.mensaje,
    };
  }
}
