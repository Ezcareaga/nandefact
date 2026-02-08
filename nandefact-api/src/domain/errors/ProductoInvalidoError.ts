import { DomainError } from './DomainError.js';

/** Error de validación en constructor de Producto */
export class ProductoInvalidoError extends DomainError {
  constructor(detalle: string) {
    super(`Producto inválido: ${detalle}`);
  }
}
