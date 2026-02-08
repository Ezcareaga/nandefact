import { ApplicationError } from './ApplicationError.js';

/** Error de estado inconsistente en la capa de aplicación */
export class EstadoInconsistenteAppError extends ApplicationError {
  constructor(detalle: string) {
    super(`Estado inconsistente: ${detalle}`);
  }
}
