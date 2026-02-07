/**
 * Error base de la capa de aplicación.
 * Separado de DomainError — la capa de aplicación tiene su propia jerarquía de errores.
 */
export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Mantiene el stack trace correcto en V8
    Error.captureStackTrace(this, this.constructor);
  }
}
