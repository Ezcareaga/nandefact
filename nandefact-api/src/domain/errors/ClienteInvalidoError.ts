import { DomainError } from './DomainError.js';

/** Error de validación en constructor de Cliente */
export class ClienteInvalidoError extends DomainError {
  constructor(detalle: string) {
    super(`Cliente inválido: ${detalle}`);
  }
}
