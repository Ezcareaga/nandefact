import { DomainError } from './DomainError.js';

/** Error cuando se intenta modificar una factura aprobada por SIFEN */
export class FacturaInmutableError extends DomainError {
  constructor() {
    super('No se puede modificar una factura aprobada por SIFEN');
  }
}
