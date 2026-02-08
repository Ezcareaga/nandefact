import { Router, type Request, type Response, type RequestHandler } from 'express';
import type { IAuthService } from '../../../domain/auth/IAuthService.js';
import type { IFacturaRepository } from '../../../domain/factura/IFacturaRepository.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';

/** Dependencias para el router de reportes */
export interface ReporteRouterDeps {
  authService: IAuthService;
  facturaRepository: IFacturaRepository;
}

/**
 * Wrapper para handlers async que captura errores y los pasa a next().
 */
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Factory function para crear router de reportes.
 *
 * Todas las rutas requieren autenticación JWT.
 *
 * Rutas:
 * - GET /resumen - Resumen de ventas (hoy y mes actual)
 *
 * @param deps - Servicios y repositorios
 * @returns Express router
 */
export function createReporteRouter(deps: ReporteRouterDeps): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(deps.authService);

  // GET /resumen - Resumen de ventas para dashboard móvil
  router.get(
    '/resumen',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NO_AUTENTICADO',
            message: 'Usuario no autenticado',
          },
        });
        return;
      }

      const comercioId = req.user.comercioId;
      const facturas = await deps.facturaRepository.findByComercio(comercioId);

      // Solo contar estados válidos (pendiente/enviado/aprobado)
      const estadosValidos = new Set(['pendiente', 'enviado', 'aprobado']);
      const facturasValidas = facturas.filter((f) => estadosValidos.has(f.estado));

      const ahora = new Date();
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      // Filtrar facturas de hoy
      const facturasHoy = facturasValidas.filter((f) => f.fechaEmision >= inicioHoy);
      const ventasHoy = facturasHoy.reduce((sum, f) => sum + f.totalBruto, 0);

      // Filtrar facturas del mes actual
      const facturasMes = facturasValidas.filter((f) => f.fechaEmision >= inicioMes);
      const ventasMes = facturasMes.reduce((sum, f) => sum + f.totalBruto, 0);

      res.status(200).json({
        success: true,
        data: {
          ventasHoy,
          ventasMes,
          cantidadFacturasHoy: facturasHoy.length,
          cantidadFacturasMes: facturasMes.length,
        },
      });
    }),
  );

  return router;
}
