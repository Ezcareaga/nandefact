import { Router, type Request, type Response, type RequestHandler } from 'express';
import multer from 'multer';
import { validateRequest } from '../middleware/validateRequest.js';
import { registrarComercioSchema, timbradoSchema } from '../schemas/comercioSchemas.js';
import type { IAuthService } from '../../../domain/auth/IAuthService.js';
import type { RegistrarComercio, RegistrarComercioInput } from '../../../application/comercio/RegistrarComercio.js';
import type { CargarCertificado } from '../../../application/comercio/CargarCertificado.js';
import type { ConfigurarTimbrado } from '../../../application/comercio/ConfigurarTimbrado.js';
import type { IComercioRepository } from '../../../domain/comercio/IComercioRepository.js';
import { createAuthMiddleware } from '../middleware/authMiddleware.js';

/** Dependencias para el router de comercio */
export interface ComercioRouterDeps {
  authService: IAuthService;
  registrarComercio: RegistrarComercio;
  cargarCertificado: CargarCertificado;
  configurarTimbrado: ConfigurarTimbrado;
  comercioRepository: IComercioRepository;
}

/**
 * Wrapper para handlers async que captura errores y los pasa a next().
 * Evita try/catch en cada handler.
 */
const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Configurar multer para carga de archivos en memoria (máx 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Validar que el archivo sea .p12 o .pfx
    if (file.originalname.endsWith('.p12') || file.originalname.endsWith('.pfx')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .p12 o .pfx'));
    }
  },
});

/**
 * Factory function para crear router de comercio.
 *
 * Todas las rutas requieren autenticación JWT (excepto /registrar).
 *
 * Rutas:
 * - POST /registrar (público)
 * - GET /perfil (protegido)
 * - POST /certificado (protegido)
 * - PUT /timbrado (protegido)
 *
 * @param deps - Casos de uso y servicios de comercio
 * @returns Express router
 */
export function createComercioRouter(deps: ComercioRouterDeps): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(deps.authService);

  // POST /registrar - Registrar nuevo comercio (público)
  router.post(
    '/registrar',
    validateRequest({ body: registrarComercioSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as RegistrarComercioInput;
      const result = await deps.registrarComercio.execute(body);

      res.status(201).json({
        success: true,
        data: {
          comercioId: result.comercioId,
        },
      });
    }),
  );

  // GET /perfil - Obtener datos del comercio del usuario autenticado
  router.get(
    '/perfil',
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

      const comercio = await deps.comercioRepository.findById(comercioId);
      if (!comercio) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COMERCIO_NO_ENCONTRADO',
            message: 'Comercio no encontrado',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: comercio.id,
          ruc: comercio.ruc.value,
          razonSocial: comercio.razonSocial,
          nombreFantasia: comercio.nombreFantasia,
          timbrado: {
            numero: comercio.timbrado.numero,
            fechaInicio: comercio.timbrado.fechaInicio,
            fechaFin: comercio.timbrado.fechaFin,
          },
          establecimiento: comercio.establecimiento,
          puntoExpedicion: comercio.puntoExpedicion,
          tipoContribuyente: comercio.tipoContribuyente,
          direccion: comercio.direccion,
          numeroCasa: comercio.numeroCasa,
          departamento: comercio.departamento,
          departamentoDesc: comercio.departamentoDesc,
          distrito: comercio.distrito,
          distritoDesc: comercio.distritoDesc,
          ciudad: comercio.ciudad,
          ciudadDesc: comercio.ciudadDesc,
          telefono: comercio.telefono,
          email: comercio.email,
          rubro: comercio.rubro,
          actividadEconomicaCodigo: comercio.actividadEconomicaCodigo,
          actividadEconomicaDesc: comercio.actividadEconomicaDesc,
          tipoRegimen: comercio.tipoRegimen,
          cscId: comercio.cscId,
          activo: comercio.activo,
        },
      });
    }),
  );

  // POST /certificado - Cargar certificado CCFE (archivo .p12/.pfx)
  router.post(
    '/certificado',
    authMiddleware,
    upload.single('certificado'),
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
      const file = req.file;
      const body = req.body as { password?: string };
      const password = body.password;

      if (!file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ARCHIVO_REQUERIDO',
            message: 'Se requiere un archivo .p12 o .pfx',
          },
        });
        return;
      }

      if (!password || typeof password !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'PASSWORD_REQUERIDO',
            message: 'La contraseña del certificado es requerida',
          },
        });
        return;
      }

      await deps.cargarCertificado.execute({
        comercioId,
        certificadoPkcs12: file.buffer,
        password,
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Certificado cargado exitosamente',
        },
      });
    }),
  );

  // PUT /timbrado - Actualizar timbrado activo
  router.put(
    '/timbrado',
    authMiddleware,
    validateRequest({ body: timbradoSchema }),
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
        timbradoNumero: string;
        fechaInicio: Date;
        fechaFin: Date;
      };

      await deps.configurarTimbrado.execute({
        comercioId,
        timbradoNumero: body.timbradoNumero,
        fechaInicio: body.fechaInicio,
        fechaFin: body.fechaFin,
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Timbrado actualizado',
        },
      });
    }),
  );

  return router;
}
