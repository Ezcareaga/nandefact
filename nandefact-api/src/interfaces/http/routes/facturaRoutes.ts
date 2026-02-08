import { Router, type Request, type Response, type RequestHandler } from 'express';
import type { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  crearFacturaSchema,
  listarFacturasQuerySchema,
  anularFacturaSchema,
  inutilizarNumeracionSchema,
  facturaIdParamSchema,
} from '../schemas/facturaSchemas.js';
import type { IAuthService } from '../../../domain/auth/IAuthService.js';
import type { CrearFactura, CrearFacturaInput } from '../../../application/facturacion/CrearFactura.js';
import type { AnularFactura } from '../../../application/facturacion/AnularFactura.js';
import type { EnviarKuDE } from '../../../application/facturacion/EnviarKuDE.js';
import type { InutilizarNumeracion } from '../../../application/facturacion/InutilizarNumeracion.js';
import type { IFacturaRepository } from '../../../domain/factura/IFacturaRepository.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';

/** Dependencias para el router de facturas */
export interface FacturaRouterDeps {
  authService: IAuthService;
  crearFactura: CrearFactura;
  anularFactura: AnularFactura;
  enviarKuDE: EnviarKuDE;
  inutilizarNumeracion: InutilizarNumeracion;
  facturaRepository: IFacturaRepository;
}

/**
 * Wrapper para handlers async que captura errores y los pasa a next().
 * Evita try/catch en cada handler.
 */
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Factory function para crear router de facturas.
 *
 * Todas las rutas requieren autenticación JWT.
 *
 * Rutas:
 * - POST / - Crear factura
 * - GET / - Listar facturas (con paginación y filtros)
 * - GET /:id - Detalle de factura
 * - GET /:id/kude - Obtener KuDE (PDF)
 * - POST /:id/reenviar - Reenviar KuDE vía WhatsApp
 * - POST /:id/anular - Anular factura (evento cancelación SIFEN)
 * - POST /inutilizar-numeracion - Inutilizar rango de numeración
 *
 * @param deps - Casos de uso y servicios de facturas
 * @returns Express router
 */
export function createFacturaRouter(deps: FacturaRouterDeps): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(deps.authService);

  // POST / - Crear factura
  router.post(
    '/',
    authMiddleware,
    validateRequest({ body: crearFacturaSchema }),
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

      const body = req.body as Omit<CrearFacturaInput, 'comercioId'>;

      const result = await deps.crearFactura.execute({
        comercioId: req.user.comercioId,
        ...body,
      });

      res.status(201).json({
        success: true,
        data: {
          facturaId: result.facturaId,
          cdc: result.cdc,
          estado: result.estado,
          totalBruto: result.totalBruto,
          totalIVA10: result.totalIVA10,
          totalIVA5: result.totalIVA5,
          totalExenta: result.totalExenta,
          totalIVA: result.totalIVA,
        },
      });
    }),
  );

  // GET / - Listar facturas con paginación y filtros
  router.get(
    '/',
    authMiddleware,
    validateRequest({ query: listarFacturasQuerySchema }),
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

      type QueryType = z.infer<typeof listarFacturasQuerySchema>;
      const query = req.query as unknown as QueryType;

      const comercioId = req.user.comercioId;

      // Cargar todas las facturas del comercio
      const todasFacturas = await deps.facturaRepository.findByComercio(comercioId);

      // Aplicar filtros
      let facturasFiltradas = todasFacturas;

      if (query.estado) {
        facturasFiltradas = facturasFiltradas.filter(
          (f) => f.estado === query.estado
        );
      }

      if (query.fechaDesde) {
        const fechaDesde = query.fechaDesde;
        facturasFiltradas = facturasFiltradas.filter(
          (f) => f.fechaEmision >= fechaDesde
        );
      }

      if (query.fechaHasta) {
        const fechaHasta = query.fechaHasta;
        facturasFiltradas = facturasFiltradas.filter(
          (f) => f.fechaEmision <= fechaHasta
        );
      }

      // Calcular paginación
      const total = facturasFiltradas.length;
      const { page, pageSize } = query;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const facturasPaginadas = facturasFiltradas.slice(skip, skip + take);

      // Mapear a DTO simple
      const facturasDTO = facturasPaginadas.map((f) => ({
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
          total,
          page,
          pageSize,
        },
      });
    }),
  );

  // GET /:id - Detalle de factura
  router.get(
    '/:id',
    authMiddleware,
    validateRequest({ params: facturaIdParamSchema }),
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

      const { id } = req.params as { id: string };

      const factura = await deps.facturaRepository.findById(id);

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

      // Verificar que la factura pertenece al comercio del usuario autenticado
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

      // Mapear a DTO completo
      res.status(200).json({
        success: true,
        data: {
          id: factura.id,
          comercioId: factura.comercioId,
          clienteId: factura.clienteId,
          cdc: factura.cdc?.value ?? null,
          tipoDocumento: factura.tipoDocumento,
          numero: {
            establecimiento: factura.numeroFactura.establecimiento,
            punto: factura.numeroFactura.punto,
            numero: factura.numeroFactura.numero,
          },
          timbrado: {
            numero: factura.timbrado.numero,
            fechaInicio: factura.timbrado.fechaInicio,
            fechaFin: factura.timbrado.fechaFin,
          },
          fechaEmision: factura.fechaEmision,
          condicionPago: factura.condicionPago,
          estado: factura.estado,
          items: factura.items.map((item) => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
            tasaIVA: item.tasaIVA,
            montoIVA: item.iva.montoIVACalculado,
          })),
          totalBruto: factura.totalBruto,
          totalIVA10: factura.totalIVA10,
          totalIVA5: factura.totalIVA5,
          totalExenta: factura.totalExenta,
          totalIVA: factura.totalIVA,
        },
      });
    }),
  );

  // GET /:id/kude - Generar y obtener KuDE (PDF)
  router.get(
    '/:id/kude',
    authMiddleware,
    validateRequest({ params: facturaIdParamSchema }),
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

      const { id } = req.params as { id: string };

      // Verificar propiedad de la factura
      const factura = await deps.facturaRepository.findById(id);
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

      const result = await deps.enviarKuDE.execute({ facturaId: id });

      res.status(200).json({
        success: true,
        data: {
          pdfGenerado: result.pdfGenerado,
          notificacionEnviada: result.notificacionEnviada,
          telefono: result.telefono,
        },
      });
    }),
  );

  // POST /:id/reenviar - Reenviar KuDE vía WhatsApp
  router.post(
    '/:id/reenviar',
    authMiddleware,
    validateRequest({ params: facturaIdParamSchema }),
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

      const { id } = req.params as { id: string };

      // Verificar propiedad de la factura
      const factura = await deps.facturaRepository.findById(id);
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

      const result = await deps.enviarKuDE.execute({ facturaId: id });

      res.status(200).json({
        success: true,
        data: {
          pdfGenerado: result.pdfGenerado,
          notificacionEnviada: result.notificacionEnviada,
          telefono: result.telefono,
        },
      });
    }),
  );

  // POST /:id/anular - Anular factura (evento cancelación SIFEN)
  router.post(
    '/:id/anular',
    authMiddleware,
    validateRequest({ params: facturaIdParamSchema, body: anularFacturaSchema }),
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

      const { id } = req.params as { id: string };
      const body = req.body as { motivo: string };

      // Verificar propiedad de la factura
      const factura = await deps.facturaRepository.findById(id);
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

      const result = await deps.anularFactura.execute({
        facturaId: id,
        motivo: body.motivo,
      });

      res.status(200).json({
        success: true,
        data: {
          cdc: result.cdc,
          codigoRespuesta: result.codigoRespuesta,
          mensajeRespuesta: result.mensajeRespuesta,
          anulada: result.anulada,
        },
      });
    }),
  );

  // POST /inutilizar-numeracion - Inutilizar rango de numeración
  router.post(
    '/inutilizar-numeracion',
    authMiddleware,
    validateRequest({ body: inutilizarNumeracionSchema }),
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

      const body = req.body as {
        establecimiento: string;
        punto: string;
        desde: number;
        hasta: number;
        motivo: string;
      };

      const result = await deps.inutilizarNumeracion.execute({
        comercioId: req.user.comercioId,
        ...body,
      });

      res.status(200).json({
        success: true,
        data: {
          codigoRespuesta: result.codigoRespuesta,
          mensajeRespuesta: result.mensajeRespuesta,
          inutilizado: result.inutilizado,
        },
      });
    }),
  );

  return router;
}
