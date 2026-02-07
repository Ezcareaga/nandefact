import { ApplicationError } from './ApplicationError.js';

/**
 * Error cuando una factura no se encuentra en el repositorio.
 */
export class FacturaNoEncontradaError extends ApplicationError {
  constructor(facturaId: string) {
    super(`Factura no encontrada: ${facturaId}`);
  }
}
