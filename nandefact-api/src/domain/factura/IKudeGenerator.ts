import type { Factura } from './Factura.js';
import type { Comercio } from '../comercio/Comercio.js';
import type { Cliente } from '../cliente/Cliente.js';

/** Puerto — Generación del KuDE (representación gráfica PDF) */
export interface IKudeGenerator {
  /**
   * Genera el KuDE (PDF) con todos los campos obligatorios SIFEN.
   * @param factura - Factura aprobada con CDC
   * @param comercio - Datos del emisor (RUC, razón social, timbrado)
   * @param cliente - Datos del receptor
   * @returns PDF buffer
   */
  generar(factura: Factura, comercio: Comercio, cliente: Cliente): Promise<Buffer>;
}
