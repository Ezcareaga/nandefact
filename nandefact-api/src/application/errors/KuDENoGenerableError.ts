import { ApplicationError } from './ApplicationError.js';

/** Error cuando no se puede generar el KuDE */
export class KuDENoGenerableError extends ApplicationError {
  constructor(detalle: string) {
    super(`No se puede generar KuDE: ${detalle}`);
  }
}
