import { DomainError } from './DomainError.js';

/** Error cuando una factura no tiene CDC al intentar una operación que lo requiere */
export class CDCSinGenerarError extends DomainError {
  constructor(facturaId: string) {
    super(`Factura ${facturaId} no tiene CDC generado`);
  }
}
