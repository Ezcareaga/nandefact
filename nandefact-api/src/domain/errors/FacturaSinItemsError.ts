import { DomainError } from './DomainError.js';

export class FacturaSinItemsError extends DomainError {
  constructor() {
    super('La factura debe tener al menos un item');
  }
}
