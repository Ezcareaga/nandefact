import type { Factura } from './Factura.js';

/** Puerto — Generación del KuDE (representación gráfica PDF) */
export interface IKudeGenerator {
  generar(factura: Factura): Promise<Buffer>;
}
