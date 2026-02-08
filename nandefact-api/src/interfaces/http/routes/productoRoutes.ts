import { Router, type Request, type Response, type RequestHandler } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  crearProductoSchema,
  editarProductoSchema,
  listarProductosQuerySchema,
  idParamSchema,
} from '../schemas/productoSchemas.js';
import type { IAuthService } from '../../../domain/auth/IAuthService.js';
import type { CrearProducto } from '../../../application/productos/CrearProducto.js';
import type { EditarProducto } from '../../../application/productos/EditarProducto.js';
import type { ListarProductos } from '../../../application/productos/ListarProductos.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';

/** Dependencias para el router de productos */
export interface ProductoRouterDeps {
  authService: IAuthService;
  crearProducto: CrearProducto;
  editarProducto: EditarProducto;
  listarProductos: ListarProductos;
}

/**
 * Wrapper para handlers async que captura errores y los pasa a next().
 * Evita try/catch en cada handler.
 */
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Factory function para crear router de productos.
 *
 * Todas las rutas requieren autenticación JWT.
 *
 * Rutas:
 * - GET / (listar paginado)
 * - POST / (crear)
 * - PUT /:id (editar)
 * - DELETE /:id (soft-delete)
 *
 * @param deps - Casos de uso y servicios de productos
 * @returns Express router
 */
export function createProductoRouter(deps: ProductoRouterDeps): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(deps.authService);

  // GET / - Listar productos paginados
  router.get(
    '/',
    authMiddleware,
    validateRequest({ query: listarProductosQuerySchema }),
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
      const query = req.query as {
        page?: number;
        pageSize?: number;
        soloActivos?: boolean;
      };

      const result = await deps.listarProductos.execute({
        comercioId,
        ...(query.page !== undefined && { page: query.page }),
        ...(query.pageSize !== undefined && { pageSize: query.pageSize }),
        ...(query.soloActivos !== undefined && { soloActivos: query.soloActivos }),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  // POST / - Crear producto
  router.post(
    '/',
    authMiddleware,
    validateRequest({ body: crearProductoSchema }),
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
      const body = req.body as {
        nombre: string;
        precioUnitario: number;
        unidadMedida: string;
        tasaIVA: 10 | 5 | 0;
        codigo?: string;
        categoria?: string;
      };

      const result = await deps.crearProducto.execute({
        comercioId,
        ...body,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    }),
  );

  // PUT /:id - Editar producto
  router.put(
    '/:id',
    authMiddleware,
    validateRequest({ params: editarProductoSchema.shape.params, body: editarProductoSchema.shape.body }),
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

      const { id: productoId } = req.params as { id: string };
      const body = req.body as {
        nombre?: string;
        precioUnitario?: number;
        unidadMedida?: string;
        tasaIVA?: 10 | 5 | 0;
        codigo?: string;
        categoria?: string;
        activo?: boolean;
      };

      await deps.editarProducto.execute({
        productoId,
        cambios: body,
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Producto actualizado',
        },
      });
    }),
  );

  // DELETE /:id - Soft-delete producto (marca activo=false)
  router.delete(
    '/:id',
    authMiddleware,
    validateRequest({ params: idParamSchema }),
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

      const { id: productoId } = req.params as { id: string };

      await deps.editarProducto.execute({
        productoId,
        cambios: { activo: false },
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Producto desactivado',
        },
      });
    }),
  );

  return router;
}
