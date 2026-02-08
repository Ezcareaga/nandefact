import { ApplicationError } from './ApplicationError.js';

/**
 * Error cuando se intenta registrar un comercio con un RUC que ya existe.
 */
export class RucDuplicadoError extends ApplicationError {
  constructor(ruc: string) {
    super(`Ya existe un comercio registrado con RUC: ${ruc}`);
  }
}
