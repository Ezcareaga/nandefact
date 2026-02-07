import type { Factura } from './Factura.js';
import type { CDC } from './CDC.js';

/** Puerto — Generación del CDC de 44 dígitos */
export interface ICDCGenerator {
  generar(factura: Factura): CDC;
}
