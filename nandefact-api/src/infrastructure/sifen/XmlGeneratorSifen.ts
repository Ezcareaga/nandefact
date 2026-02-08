import type { IXmlGenerator } from '../../domain/factura/IXmlGenerator.js';
import type { Factura } from '../../domain/factura/Factura.js';
import type { Comercio } from '../../domain/comercio/Comercio.js';
import type { Cliente } from '../../domain/cliente/Cliente.js';
import { mapComercioToParams, mapFacturaToData } from './SifenDataMapper.js';

/**
 * Adaptador — Genera XML SIFEN v150 usando la librería facturacionelectronicapy-xmlgen.
 * Implementa el puerto IXmlGenerator del dominio.
 */
export class XmlGeneratorSifen implements IXmlGenerator {
  /**
   * Genera el XML completo del Documento Electrónico.
   * @returns XML string v150 listo para firmar y enviar a SIFEN
   */
  async generarXml(factura: Factura, comercio: Comercio, cliente: Cliente): Promise<string> {
    if (!factura.cdc) {
      throw new Error('No se puede generar XML sin CDC. Llamar factura.generarCDC() primero.');
    }

    // Mapear entidades del dominio al formato TIPS-SA
    const params = mapComercioToParams(comercio);
    const data = mapFacturaToData(factura, comercio, cliente);

    // Generar XML usando la librería (dynamic import para CommonJS)
    const xmlgenModule = await import('facturacionelectronicapy-xmlgen');
    const xml = await xmlgenModule.default.generateXMLDE(params, data, {});

    return xml;
  }
}
