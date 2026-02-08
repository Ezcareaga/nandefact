import type { Request, Response, NextFunction } from 'express';
import type { IAuthService } from '../../../domain/auth/IAuthService.js';

/**
 * Estructura de respuesta de error de autenticación.
 */
interface AuthErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Factory function para crear middleware de autenticación JWT.
 *
 * Extrae Bearer token del header Authorization, verifica con IAuthService,
 * y adjunta payload a req.user.
 *
 * @param authService - Servicio de autenticación JWT
 * @returns Express middleware
 */
export function createAuthMiddleware(authService: IAuthService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extraer encabezado Authorization
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const response: AuthErrorResponse = {
          success: false,
          error: {
            code: 'NO_AUTENTICADO',
            message: 'Token de autenticación requerido',
          },
        };
        res.status(401).json(response);
        return;
      }

      // Extraer token (sin "Bearer ")
      const token = authHeader.substring(7);

      // Verificar token
      const payload = await authService.verificarAccessToken(token);

      // Adjuntar usuario al request
      req.user = {
        usuarioId: payload.usuarioId,
        comercioId: payload.comercioId,
        rol: payload.rol,
      };

      next();
    } catch (error) {
      // Token inválido o expirado
      // NUNCA loggear el token mismo
      console.error('Error verificando token:', error instanceof Error ? error.message : String(error));

      const response: AuthErrorResponse = {
        success: false,
        error: {
          code: 'TOKEN_INVALIDO',
          message: 'Token inválido o expirado',
        },
      };
      res.status(401).json(response);
    }
  };
}
