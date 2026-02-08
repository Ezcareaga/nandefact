import { Router, type Request, type Response, type RequestHandler } from 'express';
import type { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import { syncPushSchema, syncPullQuerySchema } from '../schemas/syncSchemas.js';
import type { IAuthService } from '../../../domain/auth/IAuthService.js';
import type { EncolarFactura } from '../../../application/sync/EncolarFactura.js';
import type { IFacturaRepository } from '../../../domain/factura/IFacturaRepository.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';

/** Dependencias para el router de sync */
export interface SyncRouterDeps {
  authService: IAuthService;
  encolarFactura: EncolarFactura;
  facturaRepository: IFacturaRepository;
}

/**
 * Wrapper para handlers async que captura errores y los pasa a next().
 * Evita try/catch en cada handler.
 */
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Factory function para crear router de sincronización.
 *
 * Todas las rutas requieren autenticación JWT.
 *
 * Rutas:
 * - POST /push - Encolar factura para sincronización con SIFEN
 * - GET /pull - Obtener cambios desde un timestamp
 * - GET /status - Estado de la sincronización del comercio
 *
 * @param deps - Casos de uso y servicios de sync
 * @returns Express router
 */
export function createSyncRouter(deps: SyncRouterDeps): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(deps.authService);

  // POST /push - Encolar factura para sincronización
  router.post(
    '/push',
    authMiddleware,
    validateRequest({ body: syncPushSchema }),
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

      const body = req.body as { facturaId: string };

      // Verificar que la factura pertenece al comercio del usuario autenticado
      const factura = await deps.facturaRepository.findById(body.facturaId);
      if (!factura) {
        res.status(404).json({
          success: false,
          error: {
            code: 'FACTURA_NO_ENCONTRADA',
            message: 'Factura no encontrada',
          },
        });
        return;
      }

      if (factura.comercioId !== req.user.comercioId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESO_DENEGADO',
            message: 'No tiene permiso para acceder a esta factura',
          },
        });
        return;
      }

      const result = await deps.encolarFactura.execute({
        facturaId: body.facturaId,
      });

      res.status(200).json({
        success: true,
        data: {
          jobId: result.jobId,
          cdc: result.cdc,
        },
      });
    }),
  );

  // GET /pull - Obtener cambios desde un timestamp
  router.get(
    '/pull',
    authMiddleware,
    validateRequest({ query: syncPullQuerySchema }),
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

      type QueryType = z.infer<typeof syncPullQuerySchema>;
      const query = req.query as unknown as QueryType;
      const comercioId = req.user.comercioId;

      // Cargar facturas actualizadas después del timestamp
      const facturas = await deps.facturaRepository.findByComercio(comercioId);

      // Filtrar por fecha (comparar fechaEmision por ahora, en producción sería updatedAt)
      const facturasActualizadas = facturas.filter(
        (f) => f.fechaEmision >= query.since
      );

      // Mapear a DTO simple
      const facturasDTO = facturasActualizadas.map((f) => ({
        id: f.id,
        cdc: f.cdc?.value ?? null,
        numero: `${f.numeroFactura.establecimiento}-${f.numeroFactura.punto}-${f.numeroFactura.numero}`,
        fechaEmision: f.fechaEmision,
        estado: f.estado,
        totalBruto: f.totalBruto,
        totalIVA: f.totalIVA,
      }));

      res.status(200).json({
        success: true,
        data: {
          facturas: facturasDTO,
          count: facturasDTO.length,
          since: query.since,
        },
      });
    }),
  );

  // GET /status - Estado de sincronización del comercio
  router.get(
    '/status',
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

      // Cargar facturas del comercio
      const facturas = await deps.facturaRepository.findByComercio(comercioId);

      // Contar facturas por estado
      const pendientes = facturas.filter((f) => f.estado === 'pendiente').length;
      const enviadas = facturas.filter((f) => f.estado === 'enviado').length;
      const aprobadas = facturas.filter((f) => f.estado === 'aprobado').length;
      const rechazadas = facturas.filter((f) => f.estado === 'rechazado').length;
      const contingencia = facturas.filter((f) => f.estado === 'contingencia').length;
      const canceladas = facturas.filter((f) => f.estado === 'cancelado').length;

      res.status(200).json({
        success: true,
        data: {
          comercioId,
          total: facturas.length,
          pendientes,
          enviadas,
          aprobadas,
          rechazadas,
          contingencia,
          canceladas,
        },
      });
    }),
  );

  return router;
}
