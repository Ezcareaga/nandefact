import { Router, type Request, type Response, type RequestHandler } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  crearClienteSchema,
  editarClienteSchema,
  buscarClientesQuerySchema,
  consultarRUCQuerySchema,
} from '../schemas/clienteSchemas.js';
import type { IAuthService } from '../../../domain/auth/IAuthService.js';
import type { IClienteRepository } from '../../../domain/cliente/IClienteRepository.js';
import type { CrearCliente } from '../../../application/clientes/CrearCliente.js';
import type { EditarCliente } from '../../../application/clientes/EditarCliente.js';
import type { BuscarClientes } from '../../../application/clientes/BuscarClientes.js';
import type { ConsultarRUC } from '../../../application/clientes/ConsultarRUC.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';

/** Dependencias para el router de clientes */
export interface ClienteRouterDeps {
  authService: IAuthService;
  clienteRepository: IClienteRepository;
  crearCliente: CrearCliente;
  editarCliente: EditarCliente;
  buscarClientes: BuscarClientes;
  consultarRUC: ConsultarRUC;
}

/**
 * Wrapper para handlers async que captura errores y los pasa a next().
 * Evita try/catch en cada handler.
 */
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Factory function para crear router de clientes.
 *
 * Todas las rutas requieren autenticación JWT.
 *
 * Rutas:
 * - GET /buscar?q= (autocomplete search)
 * - GET /ruc?ruc= (consulta SIFEN)
 * - GET / (listar todos del comercio)
 * - POST / (crear)
 * - PUT /:id (editar)
 *
 * IMPORTANTE: Las rutas /buscar y /ruc deben estar ANTES de /:id
 * para evitar que Express las interprete como :id.
 *
 * @param deps - Casos de uso y servicios de clientes
 * @returns Express router
 */
export function createClienteRouter(deps: ClienteRouterDeps): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(deps.authService);

  // GET /buscar?q= - Buscar clientes (autocompletado)
  router.get(
    '/buscar',
    authMiddleware,
    validateRequest({ query: buscarClientesQuerySchema }),
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
      const query = req.query as { q: string };

      const result = await deps.buscarClientes.execute({
        comercioId,
        query: query.q,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  // GET /ruc?ruc= - Consultar RUC en SIFEN
  router.get(
    '/ruc',
    authMiddleware,
    validateRequest({ query: consultarRUCQuerySchema }),
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

      const query = req.query as { ruc: string };

      const result = await deps.consultarRUC.execute({
        ruc: query.ruc,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  // GET / - Listar todos los clientes del comercio
  router.get(
    '/',
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

      const clientes = await deps.clienteRepository.findByComercio(comercioId);

      // Mapear entidades a DTOs
      const clientesDTO = clientes.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        rucCi: c.rucCi,
        tipoDocumento: c.tipoDocumento,
        telefono: c.telefono,
        email: c.email,
        direccion: c.direccion,
        frecuente: c.frecuente,
        enviarWhatsApp: c.enviarWhatsApp,
      }));

      res.status(200).json({
        success: true,
        data: {
          clientes: clientesDTO,
        },
      });
    }),
  );

  // POST / - Crear cliente
  router.post(
    '/',
    authMiddleware,
    validateRequest({ body: crearClienteSchema }),
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
        rucCi: string;
        tipoDocumento: 'RUC' | 'CI' | 'pasaporte' | 'innominado';
        telefono?: string;
        email?: string;
        direccion?: string;
        frecuente?: boolean;
        enviarWhatsApp?: boolean;
      };

      const result = await deps.crearCliente.execute({
        comercioId,
        ...body,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    }),
  );

  // PUT /:id - Editar cliente
  router.put(
    '/:id',
    authMiddleware,
    validateRequest({ params: editarClienteSchema.shape.params, body: editarClienteSchema.shape.body }),
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

      const { id: clienteId } = req.params as { id: string };
      const body = req.body as {
        nombre?: string;
        rucCi?: string;
        tipoDocumento?: 'RUC' | 'CI' | 'pasaporte' | 'innominado';
        telefono?: string;
        email?: string;
        direccion?: string;
        frecuente?: boolean;
        enviarWhatsApp?: boolean;
      };

      await deps.editarCliente.execute({
        clienteId,
        cambios: body,
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Cliente actualizado',
        },
      });
    }),
  );

  return router;
}
