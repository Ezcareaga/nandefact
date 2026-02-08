import { Router, type Request, type Response, type RequestHandler } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { loginSchema, refreshSchema } from '../schemas/authSchemas.js';
import type { AutenticarUsuario } from '../../../application/auth/AutenticarUsuario.js';
import type { RefrescarToken } from '../../../application/auth/RefrescarToken.js';

/** Dependencias para el router de autenticación */
export interface AuthRouterDeps {
  autenticarUsuario: AutenticarUsuario;
  refrescarToken: RefrescarToken;
}

/**
 * Wrapper para handlers async que captura errores y los pasa a next().
 * Evita try/catch en cada handler.
 */
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Factory function para crear router de autenticación.
 *
 * Rutas públicas (NO requieren authMiddleware):
 * - POST /login
 * - POST /refresh
 *
 * @param deps - Casos de uso de autenticación
 * @returns Express router
 */
export function createAuthRouter(deps: AuthRouterDeps): Router {
  const router = Router();

  // POST /login - Autenticación con teléfono + PIN
  router.post(
    '/login',
    validateRequest({ body: loginSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as { telefono: string; pin: string };

      const result = await deps.autenticarUsuario.execute({
        telefono: body.telefono,
        pin: body.pin,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          usuario: result.usuario,
        },
      });
    }),
  );

  // POST /refresh - Refrescar tokens usando refresh token
  router.post(
    '/refresh',
    validateRequest({ body: refreshSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as { refreshToken: string };

      const result = await deps.refrescarToken.execute({
        refreshToken: body.refreshToken,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      });
    }),
  );

  return router;
}
