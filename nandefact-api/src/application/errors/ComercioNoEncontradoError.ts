import { ApplicationError } from './ApplicationError.js';

/**
 * Error cuando un comercio no se encuentra en el repositorio.
 */
export class ComercioNoEncontradoError extends ApplicationError {
  constructor(comercioId: string) {
    super(`Comercio no encontrado: ${comercioId}`);
  }
}
