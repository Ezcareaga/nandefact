import type { Server } from 'node:http';
import type { AppDependencies } from './app.js';
import { createApp } from './app.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createComercioRouter } from './routes/comercioRoutes.js';
import { createProductoRouter } from './routes/productoRoutes.js';
import { createClienteRouter } from './routes/clienteRoutes.js';
import { createFacturaRouter } from './routes/facturaRoutes.js';
import { createSyncRouter } from './routes/syncRoutes.js';
import { createReporteRouter } from './routes/reporteRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Inicia el servidor HTTP con todas las rutas montadas.
 *
 * Monta todos los grupos de rutas bajo /api/v1:
 * - /api/v1/auth
 * - /api/v1/comercio
 * - /api/v1/productos
 * - /api/v1/clientes
 * - /api/v1/facturas
 * - /api/v1/sync
 * - /api/v1/reportes
 *
 * El error handler se monta al final para capturar errores de todos los routers.
 *
 * @param deps - Dependencias de casos de uso y repositorios
 * @param port - Puerto HTTP (default: 3000)
 * @returns HTTP Server instance (para testing)
 */
export function startServer(deps: AppDependencies, port?: number): Server {
  const app = createApp(deps);
  const serverPort = port ?? 3000;

  // Verificación de salud (sin autenticación, para balanceadores de carga)
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

  // Iniciar servidor
  const server = app.listen(serverPort, () => {
    console.log(`🚀 Servidor iniciado en puerto ${String(serverPort)}`);
    console.log(`📍 Health check: http://localhost:${String(serverPort)}/health`);
    console.log(`📍 API base: http://localhost:${String(serverPort)}/api/v1`);
  });

  return server;
}
