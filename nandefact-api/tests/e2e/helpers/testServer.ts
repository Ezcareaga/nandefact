/**
 * Test server helper para E2E tests.
 * Crea app Express completamente wired con adaptadores reales excepto SIFEN gateway.
 */

import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../../src/infrastructure/persistence/prismaClient.js';
import type { AppDependencies } from '../../../src/interfaces/http/app.js';
import { createApp } from '../../../src/interfaces/http/app.js';
import { createAuthRouter } from '../../../src/interfaces/http/routes/authRoutes.js';
import { createComercioRouter } from '../../../src/interfaces/http/routes/comercioRoutes.js';
import { createProductoRouter } from '../../../src/interfaces/http/routes/productoRoutes.js';
import { createClienteRouter } from '../../../src/interfaces/http/routes/clienteRoutes.js';
import { createFacturaRouter } from '../../../src/interfaces/http/routes/facturaRoutes.js';
import { createSyncRouter } from '../../../src/interfaces/http/routes/syncRoutes.js';
import { createReporteRouter } from '../../../src/interfaces/http/routes/reporteRoutes.js';
import { errorHandler } from '../../../src/interfaces/http/middleware/errorHandler.js';

// Repositorios PostgreSQL
import { ComercioRepositoryPg } from '../../../src/infrastructure/persistence/ComercioRepositoryPg.js';
import { UsuarioRepositoryPg } from '../../../src/infrastructure/persistence/UsuarioRepositoryPg.js';
import { ProductoRepositoryPg } from '../../../src/infrastructure/persistence/ProductoRepositoryPg.js';
import { ClienteRepositoryPg } from '../../../src/infrastructure/persistence/ClienteRepositoryPg.js';
import { FacturaRepositoryPg } from '../../../src/infrastructure/persistence/FacturaRepositoryPg.js';
import { CertificadoStorePg } from '../../../src/infrastructure/persistence/CertificadoStorePg.js';

// Servicios de autenticación
import { AuthServiceJWT } from '../../../src/infrastructure/auth/AuthServiceJWT.js';
import { HashServiceBcrypt } from '../../../src/infrastructure/auth/HashServiceBcrypt.js';

// Casos de uso
import { AutenticarUsuario } from '../../../src/application/auth/AutenticarUsuario.js';
import { RefrescarToken } from '../../../src/application/auth/RefrescarToken.js';
import { RegistrarComercio } from '../../../src/application/comercio/RegistrarComercio.js';
import { CargarCertificado } from '../../../src/application/comercio/CargarCertificado.js';
import { ConfigurarTimbrado } from '../../../src/application/comercio/ConfigurarTimbrado.js';
import { CrearProducto } from '../../../src/application/productos/CrearProducto.js';
import { EditarProducto } from '../../../src/application/productos/EditarProducto.js';
import { ListarProductos } from '../../../src/application/productos/ListarProductos.js';
import { CrearCliente } from '../../../src/application/clientes/CrearCliente.js';
import { EditarCliente } from '../../../src/application/clientes/EditarCliente.js';
import { BuscarClientes } from '../../../src/application/clientes/BuscarClientes.js';
import { ConsultarRUC } from '../../../src/application/clientes/ConsultarRUC.js';
import { CrearFactura } from '../../../src/application/facturacion/CrearFactura.js';
import { EnviarDE } from '../../../src/application/facturacion/EnviarDE.js';
import { AnularFactura } from '../../../src/application/facturacion/AnularFactura.js';
import { EnviarKuDE } from '../../../src/application/facturacion/EnviarKuDE.js';
import { InutilizarNumeracion } from '../../../src/application/facturacion/InutilizarNumeracion.js';
import { EncolarFactura } from '../../../src/application/sync/EncolarFactura.js';
import { SincronizarPendientes } from '../../../src/application/sync/SincronizarPendientes.js';

// Puertos (interfaces)
import type { ISifenGateway } from '../../../src/domain/factura/ISifenGateway.js';
import type { IKudeGenerator } from '../../../src/domain/factura/IKudeGenerator.js';
import type { INotificador } from '../../../src/domain/factura/INotificador.js';
import type { ISyncQueue } from '../../../src/domain/sync/ISyncQueue.js';
import type { IXmlGenerator } from '../../../src/domain/factura/IXmlGenerator.js';
import type { IFirmaDigital } from '../../../src/domain/factura/IFirmaDigital.js';
import type { Comercio } from '../../../src/domain/comercio/Comercio.js';
import type { SyncJob } from '../../../src/domain/sync/SyncJob.js';

/**
 * Mock ISifenGateway que siempre retorna aprobado (código 0260).
 * Necesario porque no tenemos certificado CCFE en tests.
 */
class MockSifenGateway implements ISifenGateway {
  async enviarDE(): Promise<{ codigo: string; mensaje: string }> {
    return { codigo: '0260', mensaje: 'DE aprobado' };
  }
  async consultarEstado(): Promise<{ codigo: string; mensaje: string; estado: string }> {
    return { codigo: '0260', mensaje: 'Consulta exitosa', estado: 'aprobado' };
  }
  async anularDE(): Promise<{ codigo: string; mensaje: string }> {
    return { codigo: '0260', mensaje: 'DE anulado' };
  }
  async inutilizarNumeracion(): Promise<{ codigo: string; mensaje: string }> {
    return { codigo: '0260', mensaje: 'Numeración inutilizada' };
  }
  async consultarRUC(): Promise<{ codigo: string; mensaje: string; datos?: unknown }> {
    return { codigo: '0260', mensaje: 'RUC válido', datos: {} };
  }
}

/**
 * Mock IXmlGenerator que retorna XML placeholder.
 */
class MockXmlGenerator implements IXmlGenerator {
  async generarXml(): Promise<string> {
    return '<DE>Placeholder XML for testing</DE>';
  }
}

/**
 * Mock IFirmaDigital que retorna el mismo XML (no firma realmente).
 */
class MockFirmaDigital implements IFirmaDigital {
  async firmar(xml: string): Promise<string> {
    return xml;
  }
}

/**
 * Mock IKudeGenerator que retorna Buffer vacío.
 */
class MockKudeGenerator implements IKudeGenerator {
  async generar(): Promise<Buffer> {
    return Buffer.from('KuDE PDF mock', 'utf-8');
  }
}

/**
 * Stub INotificador que no hace nada.
 */
class StubNotificador implements INotificador {
  async enviarKuDE(): Promise<void> {
    // No-op
  }
}

/**
 * In-memory ISyncQueue para tests (no requiere Redis).
 */
class InMemorySyncQueue implements ISyncQueue {
  private queue: SyncJob[] = [];

  async encolar(job: SyncJob): Promise<void> {
    this.queue.push(job);
  }

  async desencolar(): Promise<SyncJob | null> {
    return this.queue.shift() ?? null;
  }

  async completar(): Promise<void> {
    // No-op en in-memory
  }

  async fallar(): Promise<void> {
    // No-op
  }

  async contarPendientes(): Promise<number> {
    return this.queue.length;
  }

  async obtenerPendientes(): Promise<SyncJob[]> {
    return [...this.queue];
  }
}

/**
 * Construir dependencias con adaptadores reales excepto SIFEN.
 */
function buildTestDependencies(): AppDependencies {
  // Repositorios PostgreSQL (reales)
  const comercioRepository = new ComercioRepositoryPg(prisma);
  const usuarioRepository = new UsuarioRepositoryPg(prisma);
  const productoRepository = new ProductoRepositoryPg(prisma);
  const clienteRepository = new ClienteRepositoryPg(prisma);
  const facturaRepository = new FacturaRepositoryPg(prisma);
  const certificadoStore = new CertificadoStorePg(prisma);

  // Servicios de autenticación (reales)
  const authService = new AuthServiceJWT();
  const hashService = new HashServiceBcrypt();

  // Mocks de servicios externos
  const sifenGateway = new MockSifenGateway();
  const xmlGenerator = new MockXmlGenerator();
  const firmaDigital = new MockFirmaDigital();
  const kudeGenerator = new MockKudeGenerator();
  const notificador = new StubNotificador();
  const syncQueue = new InMemorySyncQueue();

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
  const enviarDE = new EnviarDE({
    facturaRepository,
    comercioRepository,
    sifenGateway,
    xmlGenerator,
    firmaDigital,
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
  const sincronizarPendientes = new SincronizarPendientes({
    facturaRepository,
    comercioRepository,
    sifenGateway,
    xmlGenerator,
    firmaDigital,
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
 * Crear test server completamente wired.
 */
export function createTestServer(): { app: Express; prisma: PrismaClient; cleanup: () => Promise<void> } {
  const deps = buildTestDependencies();
  const app = createApp(deps);

  // Health check
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Montar routers bajo /api/v1
  app.use('/api/v1/auth', createAuthRouter(deps));
  app.use('/api/v1/comercio', createComercioRouter(deps));
  app.use('/api/v1/productos', createProductoRouter(deps));
  app.use('/api/v1/clientes', createClienteRouter(deps));
  app.use('/api/v1/facturas', createFacturaRouter(deps));
  app.use('/api/v1/sync', createSyncRouter(deps));
  app.use('/api/v1/reportes', createReporteRouter(deps));

  // Error handler DEBE ser el último middleware
  app.use(errorHandler);

  return {
    app,
    prisma,
    cleanup: async () => {
      await prisma.$disconnect();
    },
  };
}

/**
 * Helper para obtener auth token desde un comercio/usuario.
 */
export async function getAuthToken(
  app: Express,
  telefono: string,
  pin: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const request = (await import('supertest')).default;
  const response = await request(app).post('/api/v1/auth/login').send({ telefono, pin });

  if (response.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
  }

  return {
    accessToken: response.body.data.accessToken as string,
    refreshToken: response.body.data.refreshToken as string,
  };
}
