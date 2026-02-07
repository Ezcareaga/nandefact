import { DomainError } from './DomainError.js';

export class RUCInvalidoError extends DomainError {
  constructor(detalle: string) {
    super(`RUC inválido: ${detalle}`);
  }
}
