import type { Factura } from './Factura.js';
import type { IFacturaRepository } from './IFacturaRepository.js';
import type { IXmlGenerator } from './IXmlGenerator.js';
import type { IFirmaDigital } from './IFirmaDigital.js';
import type { ISifenGateway, SifenResponse } from './ISifenGateway.js';
import type { IComercioRepository } from '../comercio/IComercioRepository.js';
import type { IClienteRepository } from '../cliente/IClienteRepository.js';
import { CDCSinGenerarError } from '../errors/CDCSinGenerarError.js';
import { DomainError } from '../errors/DomainError.js';

export interface EnviarFacturaResult {
  esAprobado: boolean;
  response: SifenResponse;
}

export interface EnviarFacturaASifenDeps {
  facturaRepository: IFacturaRepository;
  comercioRepository: IComercioRepository;
  clienteRepository: IClienteRepository;
  xmlGenerator: IXmlGenerator;
  firmaDigital: IFirmaDigital;
  sifenGateway: ISifenGateway;
}

/**
 * Servicio de dominio: Enviar factura a SIFEN.
 * Encapsula el flujo completo: cargar comercio → validar → cargar cliente → validar →
 * marcarEnviada → generar XML → firmar → enviar SIFEN → actualizar estado → guardar.
 */
export class EnviarFacturaASifen {
  constructor(private readonly deps: EnviarFacturaASifenDeps) {}

  async ejecutar(factura: Factura): Promise<EnviarFacturaResult> {
    // 1. Cargar comercio
    const comercio = await this.deps.comercioRepository.findById(factura.comercioId);
    if (!comercio) {
      throw new DomainError(`Comercio no encontrado: ${factura.comercioId}`);
    }

    // 2. Cargar cliente
    const cliente = await this.deps.clienteRepository.findById(factura.clienteId);
    if (!cliente) {
      throw new DomainError(`Cliente no encontrado: ${factura.clienteId}`);
    }

    // 3. Marcar como enviada
    factura.marcarEnviada();

    // 4. Validar CDC
    if (!factura.cdc) {
      throw new CDCSinGenerarError(factura.id);
    }

    // 5. Generar XML
    const xml = await this.deps.xmlGenerator.generarXml(factura, comercio, cliente);

    // 6. Firmar XML
    const xmlFirmado = await this.deps.firmaDigital.firmar(xml);

    // 7. Enviar a SIFEN
    const response = await this.deps.sifenGateway.enviarDE(xmlFirmado);

    // 8. Actualizar estado según respuesta (0260/0261 = aprobado)
    const esAprobado = response.codigo === '0260' || response.codigo === '0261';
    if (esAprobado) {
      factura.marcarAprobada();
    } else {
      factura.marcarRechazada();
    }

    // 9. Guardar factura
    await this.deps.facturaRepository.save(factura);

    return { esAprobado, response };
  }
}
