import { DomainError } from './DomainError.js';

export class MontoInvalidoError extends DomainError {
  constructor(detalle: string) {
    super(`Monto inválido: ${detalle}`);
  }
}
