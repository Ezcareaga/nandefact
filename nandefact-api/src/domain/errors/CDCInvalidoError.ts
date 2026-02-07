import { DomainError } from './DomainError.js';

export class CDCInvalidoError extends DomainError {
  constructor(detalle: string) {
    super(`CDC inválido: ${detalle}`);
  }
}
