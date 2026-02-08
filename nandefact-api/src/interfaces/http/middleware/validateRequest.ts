import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';

/**
 * Schemas de validación para diferentes partes del request.
 */
export interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

/**
 * Middleware factory para validar requests con Zod.
 *
 * Valida body, params y/o query según los schemas provistos.
 * On success: reemplaza req.body/params/query con valores parseados (type-safe).
 * On failure: pasa el ZodError a next() para que errorHandler lo maneje.
 *
 * @param schemas - Schemas de validación
 * @returns Express middleware
 */
export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validar body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validar params
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as typeof req.params;
      }

      // Validar query
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as typeof req.query;
      }

      next();
    } catch (error) {
      // ZodError se pasa a errorHandler
      next(error);
    }
  };
}
