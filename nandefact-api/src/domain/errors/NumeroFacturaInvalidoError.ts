import { DomainError } from './DomainError.js';

/** Error de validación en NumeroFactura */
export class NumeroFacturaInvalidoError extends DomainError {
  constructor(campo: string, valor: string) {
    super(`${campo} inválido: "${valor}"`);
  }
}
