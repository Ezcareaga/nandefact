import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../../domain/errors/DomainError.js';
import { ApplicationError } from '../../../application/errors/ApplicationError.js';
import { ValidacionInputError } from '../../../application/errors/ValidacionInputError.js';
import { CredencialesInvalidasError } from '../../../application/errors/CredencialesInvalidasError.js';
import { CuentaBloqueadaError } from '../../../application/errors/CuentaBloqueadaError.js';
import { FacturaNoEncontradaError } from '../../../application/errors/FacturaNoEncontradaError.js';
import { ComercioNoEncontradoError } from '../../../application/errors/ComercioNoEncontradoError.js';
import { ProductoNoEncontradoError } from '../../../application/errors/ProductoNoEncontradoError.js';
import { ClienteNoEncontradoError } from '../../../application/errors/ClienteNoEncontradoError.js';
import { FacturaNoAnulableError } from '../../../application/errors/FacturaNoAnulableError.js';
import { FacturaInmutableError } from '../../../domain/errors/FacturaInmutableError.js';
import { EstadoInconsistenteError } from '../../../domain/errors/EstadoInconsistenteError.js';
import { EstadoInconsistenteAppError } from '../../../application/errors/EstadoInconsistenteAppError.js';
import { KuDENoGenerableError } from '../../../application/errors/KuDENoGenerableError.js';
import { RucDuplicadoError } from '../../../application/errors/RucDuplicadoError.js';

/**
 * Estructura consistente de respuesta de error.
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Middleware global de manejo de errores.
 * Mapea errores de dominio y aplicación a códigos HTTP apropiados.
 *
 * IMPORTANTE:
 * - Orden de los instanceof checks es crítico (específico antes que genérico)
 * - NUNCA exponer stack trace en response (solo en logs)
 * - Loggear el error completo para debugging
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log completo del error (con stack) para depuración
  console.error('Error en endpoint:', {
    method: req.method,
    path: req.path,
    error: err.name,
    message: err.message,
    stack: err.stack,
  });

  let statusCode = 500;
  let errorCode = 'ERROR_INTERNO';
  let errorMessage = 'Error interno del servidor';

  // Errores de validación Zod (del middleware validateRequest)
  if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = 'VALIDACION';
    errorMessage = formatZodError(err);
  }
  // ValidacionInputError (aplicación)
  else if (err instanceof ValidacionInputError) {
    statusCode = 400;
    errorCode = 'VALIDACION_INPUT';
    errorMessage = err.message;
  }
  // DomainError catch-all (CDCInvalidoError, RUCInvalidoError, MontoInvalidoError, etc.)
  else if (err instanceof DomainError) {
    statusCode = 400;
    errorCode = err.name;
    errorMessage = err.message;
  }
  // CredencialesInvalidasError
  else if (err instanceof CredencialesInvalidasError) {
    statusCode = 401;
    errorCode = 'CREDENCIALES_INVALIDAS';
    errorMessage = err.message;
  }
  // CuentaBloqueadaError
  else if (err instanceof CuentaBloqueadaError) {
    statusCode = 429;
    errorCode = 'CUENTA_BLOQUEADA';
    errorMessage = err.message;
  }
  // Errores no encontrado (404)
  else if (
    err instanceof FacturaNoEncontradaError ||
    err instanceof ComercioNoEncontradoError ||
    err instanceof ProductoNoEncontradoError ||
    err instanceof ClienteNoEncontradoError
  ) {
    statusCode = 404;
    errorCode = err.name;
    errorMessage = err.message;
  }
  // Errores de conflicto (409)
  else if (
    err instanceof FacturaNoAnulableError ||
    err instanceof FacturaInmutableError ||
    err instanceof EstadoInconsistenteError ||
    err instanceof EstadoInconsistenteAppError
  ) {
    statusCode = 409;
    errorCode = err.name;
    errorMessage = err.message;
  }
  // Entidad no procesable (422)
  else if (err instanceof KuDENoGenerableError || err instanceof RucDuplicadoError) {
    statusCode = 422;
    errorCode = err.name;
    errorMessage = err.message;
  }
  // ApplicationError catch-all
  else if (err instanceof ApplicationError) {
    statusCode = 422;
    errorCode = err.name;
    errorMessage = err.message;
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  };

  res.status(statusCode).json(response);
}

/**
 * Formatea errores de Zod en mensaje legible.
 */
function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
  return issues.join('; ');
}
