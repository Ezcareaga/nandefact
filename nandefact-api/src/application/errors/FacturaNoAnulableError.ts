import { ApplicationError } from './ApplicationError.js';

/**
 * Error cuando se intenta anular una factura que no está en estado válido para anulación.
 */
export class FacturaNoAnulableError extends ApplicationError {
  constructor(facturaId: string, estado: string) {
    super(`Factura ${facturaId} no se puede anular en estado ${estado}`);
  }
}
