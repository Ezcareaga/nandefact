import { ApplicationError } from './ApplicationError.js';

/**
 * Error cuando un producto no se encuentra en el repositorio.
 */
export class ProductoNoEncontradoError extends ApplicationError {
  constructor(productoId: string) {
    super(`Producto no encontrado: ${productoId}`);
  }
}
