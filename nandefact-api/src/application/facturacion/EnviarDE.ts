import type { EstadoSifen } from '../../domain/shared/types.js';
import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../domain/factura/ISifenGateway.js';
import type { IXmlGenerator } from '../../domain/factura/IXmlGenerator.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
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
 * Orquesta el flujo: cargar factura → cargar comercio/cliente → generar XML → firmar → enviar SIFEN → actualizar estado.
 */
export class EnviarDE {
  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      comercioRepository: IComercioRepository;
      clienteRepository: IClienteRepository;
      xmlGenerator: IXmlGenerator;
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

    // 2. Cargar comercio
    const comercio = await this.deps.comercioRepository.findById(factura.comercioId);
    if (!comercio) {
      throw new Error(`Comercio no encontrado: ${factura.comercioId}`);
    }

    // 3. Cargar cliente
    const cliente = await this.deps.clienteRepository.findById(factura.clienteId);
    if (!cliente) {
      throw new Error(`Cliente no encontrado: ${factura.clienteId}`);
    }

    // 4. Marcar como enviada (registra el intento)
    factura.marcarEnviada();

    // 5. Generar XML SIFEN completo
    if (!factura.cdc) {
      throw new Error(`Factura ${input.facturaId} no tiene CDC generado`);
    }
    const xml = await this.deps.xmlGenerator.generarXml(factura, comercio, cliente);

    // 6. Firmar XML con certificado CCFE
    const xmlFirmado = await this.deps.firmaDigital.firmar(xml);

    // 7. Enviar a SIFEN
    const response = await this.deps.sifenGateway.enviarDE(xmlFirmado);

    // 8. Actualizar estado según respuesta SIFEN
    // Códigos 0260 y 0261 = aprobado (con o sin observación)
    // Cualquier otro código = rechazado
    const esAprobado = response.codigo === '0260' || response.codigo === '0261';
    if (esAprobado) {
      factura.marcarAprobada();
    } else {
      factura.marcarRechazada();
    }

    // 9. Persistir factura con estado actualizado
    await this.deps.facturaRepository.save(factura);

    // 10. Retornar resultado
    return {
      cdc: response.cdc,
      estadoSifen: factura.estado,
      codigoRespuesta: response.codigo,
      mensajeRespuesta: response.mensaje,
    };
  }
}
