import { DomainError } from './DomainError.js';

/** Error de validación en constructor de Comercio */
export class ComercioInvalidoError extends DomainError {
  constructor(detalle: string) {
    super(`Comercio inválido: ${detalle}`);
  }
}
