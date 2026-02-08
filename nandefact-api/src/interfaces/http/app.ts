import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { RolUsuario } from '../../domain/shared/types.js';

// Use cases
import type { AutenticarUsuario } from '../../application/auth/AutenticarUsuario.js';
import type { RefrescarToken } from '../../application/auth/RefrescarToken.js';
import type { RegistrarComercio } from '../../application/comercio/RegistrarComercio.js';
import type { CargarCertificado } from '../../application/comercio/CargarCertificado.js';
import type { ConfigurarTimbrado } from '../../application/comercio/ConfigurarTimbrado.js';
import type { CrearProducto } from '../../application/productos/CrearProducto.js';
import type { EditarProducto } from '../../application/productos/EditarProducto.js';
import type { ListarProductos } from '../../application/productos/ListarProductos.js';
import type { CrearCliente } from '../../application/clientes/CrearCliente.js';
import type { EditarCliente } from '../../application/clientes/EditarCliente.js';
import type { BuscarClientes } from '../../application/clientes/BuscarClientes.js';
import type { ConsultarRUC } from '../../application/clientes/ConsultarRUC.js';
import type { CrearFactura } from '../../application/facturacion/CrearFactura.js';
import type { EnviarDE } from '../../application/facturacion/EnviarDE.js';
import type { AnularFactura } from '../../application/facturacion/AnularFactura.js';
import type { EnviarKuDE } from '../../application/facturacion/EnviarKuDE.js';
import type { InutilizarNumeracion } from '../../application/facturacion/InutilizarNumeracion.js';
import type { EncolarFactura } from '../../application/sync/EncolarFactura.js';
import type { SincronizarPendientes } from '../../application/sync/SincronizarPendientes.js';

// Ports
import type { IAuthService } from '../../domain/auth/IAuthService.js';
import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';

/**
 * Todas las dependencias necesarias para los endpoints de la API.
 * Incluye use cases, servicios y repositorios.
 */
export interface AppDependencies {
  // Auth
  autenticarUsuario: AutenticarUsuario;
  refrescarToken: RefrescarToken;
  authService: IAuthService;
  // Comercio
  registrarComercio: RegistrarComercio;
  cargarCertificado: CargarCertificado;
  configurarTimbrado: ConfigurarTimbrado;
  // Productos
  crearProducto: CrearProducto;
  editarProducto: EditarProducto;
  listarProductos: ListarProductos;
  // Clientes
  crearCliente: CrearCliente;
  editarCliente: EditarCliente;
  buscarClientes: BuscarClientes;
  consultarRUC: ConsultarRUC;
  // Facturas
  crearFactura: CrearFactura;
  enviarDE: EnviarDE;
  anularFactura: AnularFactura;
  enviarKuDE: EnviarKuDE;
  inutilizarNumeracion: InutilizarNumeracion;
  // Sync
  encolarFactura: EncolarFactura;
  sincronizarPendientes: SincronizarPendientes;
  // Repos (para queries directas en routes)
  facturaRepository: IFacturaRepository;
  comercioRepository: IComercioRepository;
  clienteRepository: IClienteRepository;
}

/**
 * Extiende Express Request para incluir usuario autenticado.
 */
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: {
        usuarioId: string;
        comercioId: string;
        rol: RolUsuario;
      };
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/**
 * Factory function que crea la aplicación Express configurada.
 * NO inicia el servidor (eso es responsabilidad de server.ts).
 *
 * @param deps - Dependencias de casos de uso y servicios
 * @returns Express app configurada
 */
export function createApp(deps: AppDependencies): Express {
  const app = express();

  // Seguridad
  app.use(helmet());

  // CORS (configuración básica, ajustar en producción)
  app.use(cors());

  // JSON parsing
  app.use(express.json({ limit: '1mb' }));

  // Routes se montarán en planes siguientes
  // Por ahora, deps está disponible para cuando se necesite
  void deps;

  return app;
}
