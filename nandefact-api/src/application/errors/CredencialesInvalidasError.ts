import { ApplicationError } from './ApplicationError.js';

/**
 * Error cuando las credenciales (teléfono o PIN) son inválidas.
 * Mensaje genérico para no revelar si el teléfono existe o si el PIN es incorrecto.
 */
export class CredencialesInvalidasError extends ApplicationError {
  constructor() {
    super('Teléfono o PIN incorrecto');
  }
}
