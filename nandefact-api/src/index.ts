/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * Punto de entrada de la aplicación ÑandeFact API.
 *
 * Este archivo:
 * 1. Instancia todas las dependencias (use cases, repos, servicios)
 * 2. Inicia el servidor HTTP
 *
 * NOTA: En esta fase (07-04), las dependencias son stubs que lanzan errores "Not implemented".
 * La Fase 8 (infrastructure) implementará los adaptadores reales (PostgreSQL, SIFEN, etc.).
 */

import { startServer } from './interfaces/http/server.js';
import type { AppDependencies } from './interfaces/http/app.js';

// Casos de uso
import { AutenticarUsuario } from './application/auth/AutenticarUsuario.js';
import { RefrescarToken } from './application/auth/RefrescarToken.js';
import { RegistrarComercio } from './application/comercio/RegistrarComercio.js';
import { CargarCertificado } from './application/comercio/CargarCertificado.js';
import { ConfigurarTimbrado } from './application/comercio/ConfigurarTimbrado.js';
import { CrearProducto } from './application/productos/CrearProducto.js';
import { EditarProducto } from './application/productos/EditarProducto.js';
import { ListarProductos } from './application/productos/ListarProductos.js';
import { CrearCliente } from './application/clientes/CrearCliente.js';
import { EditarCliente } from './application/clientes/EditarCliente.js';
import { BuscarClientes } from './application/clientes/BuscarClientes.js';
import { ConsultarRUC } from './application/clientes/ConsultarRUC.js';
import { CrearFactura } from './application/facturacion/CrearFactura.js';
import { EnviarDE } from './application/facturacion/EnviarDE.js';
import { AnularFactura } from './application/facturacion/AnularFactura.js';
import { EnviarKuDE } from './application/facturacion/EnviarKuDE.js';
import { InutilizarNumeracion } from './application/facturacion/InutilizarNumeracion.js';
import { EncolarFactura } from './application/sync/EncolarFactura.js';
import { SincronizarPendientes } from './application/sync/SincronizarPendientes.js';

// Puertos (interfaces)
import type { IAuthService } from './domain/auth/IAuthService.js';
import type { IFacturaRepository } from './domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from './domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from './domain/cliente/IClienteRepository.js';
import type { IProductoRepository } from './domain/producto/IProductoRepository.js';
import type { ISifenGateway } from './domain/factura/ISifenGateway.js';
import type { IKudeGenerator } from './domain/factura/IKudeGenerator.js';
import type { INotificador } from './domain/factura/INotificador.js';
import type { ISyncQueue } from './domain/sync/ISyncQueue.js';

/**
 * Stub de IAuthService - Lanza "Not implemented"
 * La implementación real estará en Phase 8 (JWT + bcrypt)
 */
// @ts-ignore - Stub incompleto, Phase 8 implementará todos los métodos
class StubAuthService implements IAuthService {
  async autenticar(): Promise<never> {
    throw new Error('IAuthService.autenticar not implemented');
  }
  async verificarAccessToken(): Promise<never> {
    throw new Error('IAuthService.verificarAccessToken not implemented');
  }
  async verificarRefreshToken(): Promise<never> {
    throw new Error('IAuthService.verificarRefreshToken not implemented');
  }
  async generarTokens(): Promise<never> {
    throw new Error('IAuthService.generarTokens not implemented');
  }
}

/**
 * Stub de IFacturaRepository - Lanza "Not implemented"
 * La implementación real estará en Phase 8 (PostgreSQL + Prisma)
 */
// @ts-ignore - Stub incompleto, Phase 8 implementará todos los métodos
class StubFacturaRepository implements IFacturaRepository {
  async save(): Promise<never> {
    throw new Error('IFacturaRepository.save not implemented');
  }
  async findById(): Promise<never> {
    throw new Error('IFacturaRepository.findById not implemented');
  }
  async findByComercio(): Promise<never> {
    throw new Error('IFacturaRepository.findByComercio not implemented');
  }
  async findPendientes(): Promise<never> {
    throw new Error('IFacturaRepository.findPendientes not implemented');
  }
}

/**
 * Stub de IComercioRepository - Lanza "Not implemented"
 */
// @ts-ignore - Stub incompleto, Phase 8 implementará todos los métodos
class StubComercioRepository implements IComercioRepository {
  async save(): Promise<never> {
    throw new Error('IComercioRepository.save not implemented');
  }
  async findById(): Promise<never> {
    throw new Error('IComercioRepository.findById not implemented');
  }
  async findByRuc(): Promise<never> {
    throw new Error('IComercioRepository.findByRuc not implemented');
  }
}

/**
 * Stub de IClienteRepository - Lanza "Not implemented"
 */
class StubClienteRepository implements IClienteRepository {
  async save(): Promise<never> {
    throw new Error('IClienteRepository.save not implemented');
  }
  async findById(): Promise<never> {
    throw new Error('IClienteRepository.findById not implemented');
  }
  async findByComercio(): Promise<never> {
    throw new Error('IClienteRepository.findByComercio not implemented');
  }
  async buscar(): Promise<never> {
    throw new Error('IClienteRepository.buscar not implemented');
  }
}

/**
 * Stub de IProductoRepository - Lanza "Not implemented"
 */
class StubProductoRepository implements IProductoRepository {
  async save(): Promise<never> {
    throw new Error('IProductoRepository.save not implemented');
  }
  async findById(): Promise<never> {
    throw new Error('IProductoRepository.findById not implemented');
  }
  async findByComercio(): Promise<never> {
    throw new Error('IProductoRepository.findByComercio not implemented');
  }
}

/**
 * Stub de ISifenGateway - Lanza "Not implemented"
 */
// @ts-ignore - Stub incompleto, Phase 8 implementará todos los métodos
class StubSifenGateway implements ISifenGateway {
  async enviarDE(): Promise<never> {
    throw new Error('ISifenGateway.enviarDE not implemented');
  }
  async consultarEstado(): Promise<never> {
    throw new Error('ISifenGateway.consultarEstado not implemented');
  }
  async anularDE(): Promise<never> {
    throw new Error('ISifenGateway.anularDE not implemented');
  }
  async inutilizarNumeracion(): Promise<never> {
    throw new Error('ISifenGateway.inutilizarNumeracion not implemented');
  }
  async consultarRUC(): Promise<never> {
    throw new Error('ISifenGateway.consultarRUC not implemented');
  }
}

/**
 * Stub de IKudeGenerator - Lanza "Not implemented"
 */
class StubKudeGenerator implements IKudeGenerator {
  async generar(): Promise<never> {
    throw new Error('IKudeGenerator.generar not implemented');
  }
}

/**
 * Stub de INotificador - Lanza "Not implemented"
 */
class StubNotificador implements INotificador {
  async enviarKuDE(): Promise<never> {
    throw new Error('INotificador.enviarKuDE not implemented');
  }
}

/**
 * Stub de ISyncQueue - Lanza "Not implemented"
 */
// @ts-ignore - Stub incompleto, Phase 8 implementará todos los métodos
class StubSyncQueue implements ISyncQueue {
  async encolar(): Promise<never> {
    throw new Error('ISyncQueue.encolar not implemented');
  }
  async desencolar(): Promise<never> {
    throw new Error('ISyncQueue.desencolar not implemented');
  }
  async completar(): Promise<never> {
    throw new Error('ISyncQueue.completar not implemented');
  }
  async fallar(): Promise<never> {
    throw new Error('ISyncQueue.fallar not implemented');
  }
  async contarPendientes(): Promise<never> {
    throw new Error('ISyncQueue.contarPendientes not implemented');
  }
  async obtenerPendientes(): Promise<never> {
    throw new Error('ISyncQueue.obtenerPendientes not implemented');
  }
}


/**
 * Construir dependencias con stubs.
 * Phase 8 reemplazará estos stubs con implementaciones reales.
 */
function buildDependencies(): AppDependencies {
  // Stubs de infraestructura
  const authService = new StubAuthService();
  const facturaRepository = new StubFacturaRepository();
  const comercioRepository = new StubComercioRepository();
  const clienteRepository = new StubClienteRepository();
  const productoRepository = new StubProductoRepository();
  const sifenGateway = new StubSifenGateway();
  const kudeGenerator = new StubKudeGenerator();
  const notificador = new StubNotificador();
  const syncQueue = new StubSyncQueue();

  // Instanciar casos de uso con stubs
  // @ts-expect-error - Dependencias stub, Phase 8 tendrá implementaciones reales
  const autenticarUsuario = new AutenticarUsuario({ authService });
  // @ts-expect-error - Dependencias stub, Phase 8 tendrá implementaciones reales
  const refrescarToken = new RefrescarToken({ authService });
  const registrarComercio = new RegistrarComercio({ comercioRepository });
  // @ts-ignore - Stub incompleto, Phase 8 implementará todos los métodos
  const cargarCertificado = new CargarCertificado({ comercioRepository, certificadoStore: {} });
  const configurarTimbrado = new ConfigurarTimbrado({ comercioRepository });
  // @ts-expect-error - Dependencias stub, Phase 8 tendrá implementaciones reales
  const crearProducto = new CrearProducto({ productoRepository });
  const editarProducto = new EditarProducto({ productoRepository });
  const listarProductos = new ListarProductos({ productoRepository });
  // @ts-expect-error - Dependencias stub, Phase 8 tendrá implementaciones reales
  const crearCliente = new CrearCliente({ clienteRepository });
  const editarCliente = new EditarCliente({ clienteRepository });
  const buscarClientes = new BuscarClientes({ clienteRepository });
  const consultarRUC = new ConsultarRUC({ sifenGateway });
  const crearFactura = new CrearFactura({ facturaRepository, comercioRepository });
  // @ts-ignore - Stub incompleto, Phase 8 implementará todos los métodos
  const enviarDE = new EnviarDE({ facturaRepository, comercioRepository, sifenGateway, xmlGenerator: { generarXml: async () => '' }, firmaDigital: { firmar: async () => '' } });
  const anularFactura = new AnularFactura({ facturaRepository, comercioRepository, sifenGateway });
  const enviarKuDE = new EnviarKuDE({
    facturaRepository,
    comercioRepository,
    clienteRepository,
    kudeGenerator,
    notificador,
  });
  const inutilizarNumeracion = new InutilizarNumeracion({ comercioRepository, sifenGateway });
  const encolarFactura = new EncolarFactura({ facturaRepository, syncQueue });
  // @ts-ignore - Stub incompleto, Phase 8 implementará todos los métodos
  const sincronizarPendientes = new SincronizarPendientes({
    facturaRepository,
    comercioRepository,
    sifenGateway,
    xmlGenerator: { generarXml: async () => '' },
    firmaDigital: { firmar: async () => '' },
  });

  return {
    // Autenticación
    autenticarUsuario,
    refrescarToken,
    authService,
    // Comercio
    registrarComercio,
    cargarCertificado,
    configurarTimbrado,
    // Productos
    crearProducto,
    editarProducto,
    listarProductos,
    // Clientes
    crearCliente,
    editarCliente,
    buscarClientes,
    consultarRUC,
    // Facturas
    crearFactura,
    enviarDE,
    anularFactura,
    enviarKuDE,
    inutilizarNumeracion,
    // Sincronización
    encolarFactura,
    sincronizarPendientes,
    // Repositorios (para consultas directas en rutas)
    facturaRepository,
    comercioRepository,
    clienteRepository,
  };
}

/**
 * Main - Iniciar servidor
 */
function main(): void {
  const port = parseInt(process.env.PORT || '3000', 10);
  const deps = buildDependencies();

  startServer(deps, port);
}

// Ejecutar
main();
