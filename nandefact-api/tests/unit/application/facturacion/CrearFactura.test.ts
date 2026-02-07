import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrearFactura } from '../../../../src/application/facturacion/CrearFactura.js';
import type { IFacturaRepository } from '../../../../src/domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { ComercioNoEncontradoError } from '../../../../src/application/errors/ComercioNoEncontradoError.js';
import { FacturaSinItemsError } from '../../../../src/domain/errors/FacturaSinItemsError.js';

describe('CrearFactura', () => {
  let crearFactura: CrearFactura;
  let mockFacturaRepository: IFacturaRepository;
  let mockComercioRepository: IComercioRepository;
  let comercioValido: Comercio;

  beforeEach(() => {
    // Mock repositories
    mockFacturaRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByComercio: vi.fn(),
      findPendientes: vi.fn(),
    };

    mockComercioRepository = {
      findById: vi.fn(),
    };

    // Crear comercio válido para las pruebas
    comercioValido = new Comercio({
      id: 'comercio-uuid',
      ruc: new RUC('80069563-1'),
      razonSocial: 'Doña María Almacén',
      nombreFantasia: 'Almacén María',
      timbrado: new Timbrado('12558946', new Date('2024-01-01'), new Date('2025-12-31')),
      establecimiento: '001',
      puntoExpedicion: '003',
      tipoContribuyente: 1,
    });

    // Por defecto, el comercio existe
    vi.mocked(mockComercioRepository.findById).mockResolvedValue(comercioValido);

    // Instanciar caso de uso
    crearFactura = new CrearFactura({
      facturaRepository: mockFacturaRepository,
      comercioRepository: mockComercioRepository,
    });
  });

  it('debería crear factura con items, calcular IVA, generar CDC, y guardar', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      clienteId: 'cliente-uuid',
      tipoDocumento: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: new Date('2024-06-15'),
      numero: '0000137',
      items: [
        {
          productoId: 'producto-1',
          descripcion: 'Mandioca',
          cantidad: 3,
          precioUnitario: 5000,
          tasaIVA: 10,
        },
        {
          productoId: 'producto-2',
          descripcion: 'Arroz',
          cantidad: 2,
          precioUnitario: 8000,
          tasaIVA: 5,
        },
      ],
    };

    const output = await crearFactura.execute(input);

    // Verificar que se guardó la factura
    expect(mockFacturaRepository.save).toHaveBeenCalledTimes(1);

    // Verificar output
    expect(output.facturaId).toBeTruthy();
    expect(typeof output.facturaId).toBe('string');
    expect(output.facturaId.length).toBeGreaterThan(0);

    expect(output.cdc).toBeTruthy();
    expect(output.cdc.length).toBe(44);

    expect(output.estado).toBe('pendiente');

    // Total bruto = 15000 + 16000 = 31000
    expect(output.totalBruto).toBe(31000);

    // IVA 10%: base = 15000/1.10 = 13636, IVA = 15000 - 13636 = 1364
    expect(output.totalIVA10).toBe(1364);

    // IVA 5%: base = 16000/1.05 = 15238, IVA = 16000 - 15238 = 762
    expect(output.totalIVA5).toBe(762);
  });

  it('debería lanzar ComercioNoEncontradoError si comercio no existe', async () => {
    // Mock comercio no encontrado
    vi.mocked(mockComercioRepository.findById).mockResolvedValue(null);

    const input = {
      comercioId: 'comercio-inexistente',
      clienteId: 'cliente-uuid',
      tipoDocumento: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: new Date('2024-06-15'),
      numero: '0000137',
      items: [
        {
          productoId: 'producto-1',
          descripcion: 'Mandioca',
          cantidad: 3,
          precioUnitario: 5000,
          tasaIVA: 10,
        },
      ],
    };

    await expect(crearFactura.execute(input)).rejects.toThrow(ComercioNoEncontradoError);
  });

  it('debería generar UUID como facturaId', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      clienteId: 'cliente-uuid',
      tipoDocumento: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: new Date('2024-06-15'),
      numero: '0000137',
      items: [
        {
          productoId: 'producto-1',
          descripcion: 'Mandioca',
          cantidad: 3,
          precioUnitario: 5000,
          tasaIVA: 10,
        },
      ],
    };

    const output = await crearFactura.execute(input);

    expect(output.facturaId).toBeTruthy();
    expect(typeof output.facturaId).toBe('string');
    expect(output.facturaId.length).toBeGreaterThan(0);
  });

  it('debería usar timbrado del comercio para la factura', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      clienteId: 'cliente-uuid',
      tipoDocumento: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: new Date('2024-06-15'),
      numero: '0000137',
      items: [
        {
          productoId: 'producto-1',
          descripcion: 'Mandioca',
          cantidad: 1,
          precioUnitario: 5000,
          tasaIVA: 10,
        },
      ],
    };

    await crearFactura.execute(input);

    // Verificar que se llamó save con una factura
    expect(mockFacturaRepository.save).toHaveBeenCalledTimes(1);
    const facturaGuardada = vi.mocked(mockFacturaRepository.save).mock.calls[0]?.[0];
    expect(facturaGuardada).toBeDefined();
    expect(facturaGuardada?.timbrado).toBe(comercioValido.timbrado);
  });

  it('debería usar establecimiento y puntoExpedicion del comercio para NumeroFactura', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      clienteId: 'cliente-uuid',
      tipoDocumento: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: new Date('2024-06-15'),
      numero: '0000137',
      items: [
        {
          productoId: 'producto-1',
          descripcion: 'Mandioca',
          cantidad: 1,
          precioUnitario: 5000,
          tasaIVA: 10,
        },
      ],
    };

    await crearFactura.execute(input);

    // Verificar que se llamó save con una factura
    expect(mockFacturaRepository.save).toHaveBeenCalledTimes(1);
    const facturaGuardada = vi.mocked(mockFacturaRepository.save).mock.calls[0]?.[0];
    expect(facturaGuardada).toBeDefined();
    expect(facturaGuardada?.numeroFactura.establecimiento).toBe('001');
    expect(facturaGuardada?.numeroFactura.punto).toBe('003');
    expect(facturaGuardada?.numeroFactura.numero).toBe('0000137');
  });

  it('debería lanzar FacturaSinItemsError si items array vacío', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      clienteId: 'cliente-uuid',
      tipoDocumento: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: new Date('2024-06-15'),
      numero: '0000137',
      items: [],
    };

    await expect(crearFactura.execute(input)).rejects.toThrow(FacturaSinItemsError);
  });
});
