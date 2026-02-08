import { DomainError } from './DomainError.js';

/** Error de validación en constructor de Timbrado (formato inválido) */
export class TimbradoInvalidoError extends DomainError {
  constructor(detalle: string) {
    super(`Timbrado inválido: ${detalle}`);
  }
}
