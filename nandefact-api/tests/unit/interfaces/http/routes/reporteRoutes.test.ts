import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createReporteRouter } from '../../../../../src/interfaces/http/routes/reporteRoutes.js';
import type { IAuthService } from '../../../../../src/domain/auth/IAuthService.js';
import type { IFacturaRepository } from '../../../../../src/domain/factura/IFacturaRepository.js';
import { Factura } from '../../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../../src/domain/factura/NumeroFactura.js';
import { Timbrado } from '../../../../../src/domain/comercio/Timbrado.js';

describe('reporteRoutes — GET /resumen', () => {
  let server: Server;
  let baseUrl: string;
  let mockFacturaRepository: IFacturaRepository;
  let mockAuthService: IAuthService;

  const timbrado = new Timbrado('12345678', new Date('2024-01-01'), new Date('2027-12-31'));

  const crearFactura = (
    id: string,
    numero: string,
    fechaEmision: Date,
    condicionPago: 'contado' | 'credito' = 'contado',
  ): Factura => {
    const factura = new Factura({
      id,
      comercioId: 'com-1',
      clienteId: 'cli-1',
      tipoDocumento: 1,
      timbrado,
      numeroFactura: new NumeroFactura('001', '003', numero),
      tipoEmision: 1,
      condicionPago,
      fechaEmision,
    });
    factura.agregarItem(
      new ItemFactura({
        descripcion: 'Producto',
        cantidad: 1,
        precioUnitario: 10000,
        tasaIVA: 10,
      }),
    );
    return factura;
  };

  beforeEach(async () => {
    mockAuthService = {
      generarTokens: vi.fn(),
      verificarAccessToken: vi.fn().mockResolvedValue({
        usuarioId: 'user-1',
        comercioId: 'com-1',
        rol: 'dueño',
      }),
      verificarRefreshToken: vi.fn(),
    };

    mockFacturaRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByComercio: vi.fn().mockResolvedValue([]),
      findPendientes: vi.fn(),
    };

    const app = express();
    app.use(express.json());
    app.use('/api/v1/reportes', createReporteRouter({
      authService: mockAuthService,
      facturaRepository: mockFacturaRepository,
    }));

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });

    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${String(port)}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('debe retornar ventasHoy y cantidadFacturasHoy correctas', async () => {
    const ahora = new Date();
    const facturaHoy = crearFactura('f1', '0000001', ahora);
    const facturaAyer = crearFactura('f2', '0000002', new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1));

    vi.mocked(mockFacturaRepository.findByComercio).mockResolvedValue([facturaHoy, facturaAyer]);

    const res = await fetch(`${baseUrl}/api/v1/reportes/resumen`, {
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; data: { ventasHoy: number; cantidadFacturasHoy: number; ventasMes: number; cantidadFacturasMes: number } };
    expect(body.success).toBe(true);
    expect(body.data.ventasHoy).toBe(10000);
    expect(body.data.cantidadFacturasHoy).toBe(1);
  });

  it('debe retornar ventasMes y cantidadFacturasMes correctas', async () => {
    const ahora = new Date();
    const facturaHoy = crearFactura('f1', '0000001', ahora);
    // Factura del mismo mes pero día 1
    const facturaInicioMes = crearFactura('f2', '0000002', new Date(ahora.getFullYear(), ahora.getMonth(), 1));
    // Factura del mes anterior (no debe contar)
    const facturaMesAnterior = crearFactura('f3', '0000003', new Date(ahora.getFullYear(), ahora.getMonth() - 1, 15));

    vi.mocked(mockFacturaRepository.findByComercio).mockResolvedValue([
      facturaHoy, facturaInicioMes, facturaMesAnterior,
    ]);

    const res = await fetch(`${baseUrl}/api/v1/reportes/resumen`, {
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; data: { ventasMes: number; cantidadFacturasMes: number } };
    expect(body.data.ventasMes).toBe(20000);
    expect(body.data.cantidadFacturasMes).toBe(2);
  });

  it('debe excluir facturas canceladas y rechazadas del resumen', async () => {
    const ahora = new Date();
    const facturaAprobada = crearFactura('f1', '0000001', ahora);
    facturaAprobada.marcarEnviada();
    facturaAprobada.marcarAprobada();

    const facturaCancelada = crearFactura('f2', '0000002', ahora);
    facturaCancelada.marcarEnviada();
    facturaCancelada.marcarAprobada();
    facturaCancelada.marcarCancelada();

    const facturaRechazada = crearFactura('f3', '0000003', ahora);
    facturaRechazada.marcarEnviada();
    facturaRechazada.marcarRechazada();

    vi.mocked(mockFacturaRepository.findByComercio).mockResolvedValue([
      facturaAprobada, facturaCancelada, facturaRechazada,
    ]);

    const res = await fetch(`${baseUrl}/api/v1/reportes/resumen`, {
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; data: { ventasHoy: number; cantidadFacturasHoy: number } };
    // Solo la factura aprobada cuenta
    expect(body.data.ventasHoy).toBe(10000);
    expect(body.data.cantidadFacturasHoy).toBe(1);
  });
});
