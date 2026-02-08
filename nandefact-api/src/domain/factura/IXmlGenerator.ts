import type { Factura } from './Factura.js';
import type { Comercio } from '../comercio/Comercio.js';
import type { Cliente } from '../cliente/Cliente.js';

/**
 * Puerto — Generador de XML para documentos electrónicos SIFEN.
 * Convierte entidades del dominio en XML v150 válido para envío a SIFEN.
 */
export interface IXmlGenerator {
  /**
   * Genera el XML completo del Documento Electrónico.
   * @returns XML string v150 listo para firmar y enviar a SIFEN
   */
  generarXml(factura: Factura, comercio: Comercio, cliente: Cliente): Promise<string>;
}
