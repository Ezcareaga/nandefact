import { DomainError } from './DomainError.js';

export class FacturaNoEncontradaError extends DomainError {
  constructor(facturaId: string) {
    super(`Factura no encontrada: ${facturaId}`);
    this.name = 'FacturaNoEncontradaError';
  }
}
