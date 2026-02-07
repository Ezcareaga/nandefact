import type { Factura } from './Factura.js';

/** Puerto — Persistencia de facturas */
export interface IFacturaRepository {
  save(factura: Factura): Promise<void>;
  findById(id: string): Promise<Factura | null>;
  findByComercio(comercioId: string): Promise<Factura[]>;
  findPendientes(comercioId: string): Promise<Factura[]>;
}
