import type { IXmlGenerator } from '../../domain/factura/IXmlGenerator.js';
import type { Factura } from '../../domain/factura/Factura.js';
import type { Comercio } from '../../domain/comercio/Comercio.js';
import type { Cliente } from '../../domain/cliente/Cliente.js';
import { mapComercioToParams, mapFacturaToData } from './SifenDataMapper.js';
import { CDCSinGenerarError } from '../../domain/errors/CDCSinGenerarError.js';

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
      throw new CDCSinGenerarError(factura.id);
    }

    // Mapear entidades del dominio al formato TIPS-SA
    const params = mapComercioToParams(comercio);
    const data = mapFacturaToData(factura, comercio, cliente);

    // Generar XML usando la librería (dynamic import para CommonJS)
    const xmlgenModule = await import('facturacionelectronicapy-xmlgen');
    const xml = await xmlgenModule.default.generateXMLDE(params, data, {});

    return xml;
  }

  /**
   * Genera XML de evento de cancelación.
   * @param comercio Comercio emisor del evento
   * @param cdc CDC del documento a cancelar
   * @param motivo Motivo de la cancelación
   * @returns XML del evento de cancelación
   */
  async generarXmlEventoCancelacion(comercio: Comercio, cdc: string, motivo: string): Promise<string> {
    const params = mapComercioToParams(comercio);

    // Datos del evento de cancelación
    const data = {
      cdc,
      motivo,
    };

    // Generar XML usando la librería
    // Type assertion necesaria porque las definiciones TypeScript de xmlgen no incluyen métodos de eventos
    const xmlgenModule = await import('facturacionelectronicapy-xmlgen');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const xml = await (xmlgenModule.default as any).generateXMLEventoCancelacion(1, params, data);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return xml;
  }

  /**
   * Genera XML de evento de inutilización de numeración.
   * @param comercio Comercio emisor del evento
   * @param establecimiento Código de establecimiento
   * @param punto Punto de expedición
   * @param desde Número inicial del rango
   * @param hasta Número final del rango
   * @param motivo Motivo de la inutilización
   * @returns XML del evento de inutilización
   */
  async generarXmlEventoInutilizacion(
    comercio: Comercio,
    establecimiento: string,
    punto: string,
    desde: number,
    hasta: number,
    motivo: string
  ): Promise<string> {
    const params = mapComercioToParams(comercio);

    // Datos del evento de inutilización
    // La librería requiere el timbrado y tipoDocumento para eventos de inutilización
    const data = {
      tipoDocumento: 1, // 1 = Factura Electrónica (tipo de documento que se inutiliza)
      establecimiento,
      punto,
      desde,
      hasta,
      motivo,
      timbrado: comercio.timbrado.numero,
    };

    // Generar XML usando la librería
    // Type assertion necesaria porque las definiciones TypeScript de xmlgen no incluyen métodos de eventos
    const xmlgenModule = await import('facturacionelectronicapy-xmlgen');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const xml = await (xmlgenModule.default as any).generateXMLEventoInutilizacion(1, params, data);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return xml;
  }
}
