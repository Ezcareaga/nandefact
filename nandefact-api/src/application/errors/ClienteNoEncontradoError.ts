import { ApplicationError } from './ApplicationError.js';

/**
 * Error cuando un cliente no se encuentra en el repositorio.
 */
export class ClienteNoEncontradoError extends ApplicationError {
  constructor(clienteId: string) {
    super(`Cliente no encontrado: ${clienteId}`);
  }
}
