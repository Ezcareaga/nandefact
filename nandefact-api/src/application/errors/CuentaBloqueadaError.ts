import { ApplicationError } from './ApplicationError.js';

/**
 * Error cuando la cuenta está bloqueada por múltiples intentos fallidos.
 * Informa cuántos minutos quedan para desbloquear.
 */
export class CuentaBloqueadaError extends ApplicationError {
  constructor(minutosRestantes: number) {
    super(`Cuenta bloqueada. Intente nuevamente en ${minutosRestantes.toString()} minutos.`);
  }
}
