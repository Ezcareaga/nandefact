import { DomainError } from './DomainError.js';

/** Error cuando un item tiene descripción vacía */
export class DescripcionVaciaError extends DomainError {
  constructor() {
    super('La descripción del item no puede estar vacía');
  }
}
