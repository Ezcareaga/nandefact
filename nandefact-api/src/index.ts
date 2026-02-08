/**
 * Punto de entrada de la aplicación ÑandeFact API.
 *
 * Este archivo:
 * 1. Instancia todas las dependencias (use cases, repos, servicios)
 * 2. Inicia el servidor HTTP
 * 3. Maneja graceful shutdown
 */

import { startServer } from './interfaces/http/server.js';
import type { AppDependencies } from './interfaces/http/app.js';

// Prisma Client singleton
import { prisma } from './infrastructure/persistence/prismaClient.js';

// Repositorios PostgreSQL
import { ComercioRepositoryPg } from './infrastructure/persistence/ComercioRepositoryPg.js';
import { UsuarioRepositoryPg } from './infrastructure/persistence/UsuarioRepositoryPg.js';
import { ProductoRepositoryPg } from './infrastructure/persistence/ProductoRepositoryPg.js';
import { ClienteRepositoryPg } from './infrastructure/persistence/ClienteRepositoryPg.js';
import { FacturaRepositoryPg } from './infrastructure/persistence/FacturaRepositoryPg.js';
import { CertificadoStorePg } from './infrastructure/persistence/CertificadoStorePg.js';

// Servicios de autenticación
import { AuthServiceJWT } from './infrastructure/auth/AuthServiceJWT.js';
import { HashServiceBcrypt } from './infrastructure/auth/HashServiceBcrypt.js';

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

// Puertos (interfaces) - para stubs temporales
import type { ISifenGateway } from './domain/factura/ISifenGateway.js';
import type { IKudeGenerator } from './domain/factura/IKudeGenerator.js';
import type { INotificador } from './domain/factura/INotificador.js';
import type { ISyncQueue } from './domain/sync/ISyncQueue.js';

/**
 * Stubs temporales para servicios externos aún no implementados.
 * Phase 9 implementará SIFEN, KuDE, WhatsApp, etc.
 */

class StubSifenGateway implements ISifenGateway {
  // eslint-disable-next-line @typescript-eslint/require-await
  async enviarDE(): Promise<never> {
    throw new Error('ISifenGateway.enviarDE not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async consultarEstado(): Promise<never> {
    throw new Error('ISifenGateway.consultarEstado not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async anularDE(): Promise<never> {
    throw new Error('ISifenGateway.anularDE not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async inutilizarNumeracion(): Promise<never> {
    throw new Error('ISifenGateway.inutilizarNumeracion not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async consultarRUC(): Promise<never> {
    throw new Error('ISifenGateway.consultarRUC not implemented');
  }
}

class StubKudeGenerator implements IKudeGenerator {
  // eslint-disable-next-line @typescript-eslint/require-await
  async generar(): Promise<never> {
    throw new Error('IKudeGenerator.generar not implemented');
  }
}

class StubNotificador implements INotificador {
  // eslint-disable-next-line @typescript-eslint/require-await
  async enviarKuDE(): Promise<never> {
    throw new Error('INotificador.enviarKuDE not implemented');
  }
}

class StubSyncQueue implements ISyncQueue {
  // eslint-disable-next-line @typescript-eslint/require-await
  async encolar(): Promise<never> {
    throw new Error('ISyncQueue.encolar not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async desencolar(): Promise<never> {
    throw new Error('ISyncQueue.desencolar not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async completar(): Promise<never> {
    throw new Error('ISyncQueue.completar not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async fallar(): Promise<never> {
    throw new Error('ISyncQueue.fallar not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async contarPendientes(): Promise<never> {
    throw new Error('ISyncQueue.contarPendientes not implemented');
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async obtenerPendientes(): Promise<never> {
    throw new Error('ISyncQueue.obtenerPendientes not implemented');
  }
}

/**
 * Construir dependencias con implementaciones reales de persistencia y auth.
 */
function buildDependencies(): AppDependencies {
  // Repositorios PostgreSQL
  const comercioRepository = new ComercioRepositoryPg(prisma);
  const usuarioRepository = new UsuarioRepositoryPg(prisma);
  const productoRepository = new ProductoRepositoryPg(prisma);
  const clienteRepository = new ClienteRepositoryPg(prisma);
  const facturaRepository = new FacturaRepositoryPg(prisma);
  const certificadoStore = new CertificadoStorePg(prisma);

  // Servicios de autenticación
  const authService = new AuthServiceJWT();
  const hashService = new HashServiceBcrypt();

  // Stubs de servicios externos (Phase 9)
  const sifenGateway = new StubSifenGateway();
  const kudeGenerator = new StubKudeGenerator();
  const notificador = new StubNotificador();
  const syncQueue = new StubSyncQueue();

  // Instanciar casos de uso con dependencias reales
  const autenticarUsuario = new AutenticarUsuario({
    usuarioRepository,
    hashService,
    authService,
  });
  const refrescarToken = new RefrescarToken({ authService, usuarioRepository });
  const registrarComercio = new RegistrarComercio({ comercioRepository });
  const cargarCertificado = new CargarCertificado({ comercioRepository, certificadoStore });
  const configurarTimbrado = new ConfigurarTimbrado({ comercioRepository });
  const crearProducto = new CrearProducto({ productoRepository, comercioRepository });
  const editarProducto = new EditarProducto({ productoRepository });
  const listarProductos = new ListarProductos({ productoRepository });
  const crearCliente = new CrearCliente({ clienteRepository, comercioRepository });
  const editarCliente = new EditarCliente({ clienteRepository });
  const buscarClientes = new BuscarClientes({ clienteRepository });
  const consultarRUC = new ConsultarRUC({ sifenGateway });
  const crearFactura = new CrearFactura({ facturaRepository, comercioRepository });
  // @ts-expect-error - Stub incompleto, Phase 9 implementará xmlGenerator y firmaDigital
  const enviarDE = new EnviarDE({
    facturaRepository,
    comercioRepository,
    sifenGateway,
    xmlGenerator: {
      // eslint-disable-next-line @typescript-eslint/require-await
      generarXml: async () => '',
    },
    firmaDigital: {
      // eslint-disable-next-line @typescript-eslint/require-await
      firmar: async () => '',
    },
  });
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
  // @ts-expect-error - Stub incompleto, Phase 9 implementará xmlGenerator y firmaDigital
  const sincronizarPendientes = new SincronizarPendientes({
    facturaRepository,
    comercioRepository,
    sifenGateway,
    xmlGenerator: {
      // eslint-disable-next-line @typescript-eslint/require-await
      generarXml: async () => '',
    },
    firmaDigital: {
      // eslint-disable-next-line @typescript-eslint/require-await
      firmar: async () => '',
    },
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
 * Graceful shutdown handler.
 * Desconecta Prisma limpiamente al recibir SIGTERM/SIGINT.
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\nRecibida señal ${signal}. Cerrando conexiones...`);
  await prisma.$disconnect();
  console.log('Prisma desconectado. Saliendo.');
  process.exit(0);
}

/**
 * Main - Iniciar servidor
 */
function main(): void {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const deps = buildDependencies();

  // Registrar handlers de shutdown
  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });

  startServer(deps, port);
}

// Ejecutar
main();
