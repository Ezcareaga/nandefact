import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnularFactura } from '../../../../src/application/facturacion/AnularFactura.js';
import type { IFacturaRepository } from '../../../../src/domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import type { ISifenGateway } from '../../../../src/domain/factura/ISifenGateway.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { FacturaNoEncontradaError } from '../../../../src/application/errors/FacturaNoEncontradaError.js';
import { FacturaNoAnulableError } from '../../../../src/application/errors/FacturaNoAnulableError.js';

describe('AnularFactura', () => {
  const timbrado = new Timbrado('12558946', new Date('2024-01-01'), new Date('2025-12-31'));
  const numeroFactura = new NumeroFactura('001', '003', '0000137');
  const ruc = new RUC('80069563-1');

  const baseProps = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    comercioId: '660e8400-e29b-41d4-a716-446655440000',
    clienteId: '770e8400-e29b-41d4-a716-446655440000',
    tipoDocumento: 1 as const,
    timbrado,
    numeroFactura,
    tipoEmision: 1 as const,
    condicionPago: 'contado' as const,
    fechaEmision: new Date('2024-06-15'),
  };

  let facturaRepository: IFacturaRepository;
  let comercioRepository: IComercioRepository;
  let sifenGateway: ISifenGateway;
  let anularFactura: AnularFactura;
  let facturaAprobada: Factura;
  let testComercio: Comercio;

  beforeEach(() => {
    // Crear factura en estado aprobado (con items, CDC, enviada, aprobada)
    facturaAprobada = new Factura(baseProps);
    const item = new ItemFactura({
      descripcion: 'Mandioca',
      cantidad: 3,
      precioUnitario: 5000,
      tasaIVA: 10,
    });
    facturaAprobada.agregarItem(item);
    facturaAprobada.generarCDC(ruc, 1);
    facturaAprobada.marcarEnviada();
    facturaAprobada.marcarAprobada();

    // Crear test comercio
    testComercio = new Comercio({
      id: baseProps.comercioId,
      ruc,
      razonSocial: 'Comercio Test S.A.',
      nombreFantasia: 'Test Store',
      timbrado,
      establecimiento: '001',
      puntoExpedicion: '003',
      tipoContribuyente: 1,
    });

    // Mocks
    facturaRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(facturaAprobada),
      findByComercio: vi.fn().mockResolvedValue([]),
      findPendientes: vi.fn().mockResolvedValue([]),
    };

    comercioRepository = {
      findById: vi.fn().mockResolvedValue(testComercio),
    };

    sifenGateway = {
      enviarDE: vi.fn(),
      consultarEstado: vi.fn(),
      anularDE: vi.fn(),
      inutilizarNumeracion: vi.fn(),
    };

    anularFactura = new AnularFactura({
      facturaRepository,
      comercioRepository,
      sifenGateway,
    });
  });

  it('debería enviar evento cancelación a SIFEN para factura aprobada', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0260',
      mensaje: 'Cancelación aceptada',
      cdc: facturaAprobada.cdc!.value,
    };
    vi.mocked(sifenGateway.anularDE).mockResolvedValue(mockResponse);

    // Act
    const result = await anularFactura.execute({
      facturaId: baseProps.id,
      motivo: 'Operación no se concretó',
    });

    // Assert
    expect(sifenGateway.anularDE).toHaveBeenCalledWith(
      testComercio,
      facturaAprobada.cdc!.value,
      'Operación no se concretó',
    );
    expect(result).toEqual({
      cdc: facturaAprobada.cdc!.value,
      codigoRespuesta: '0260',
      mensajeRespuesta: 'Cancelación aceptada',
      anulada: true,
    });
    expect(facturaRepository.save).toHaveBeenCalledWith(facturaAprobada);
    expect(facturaAprobada.estado).toBe('cancelado');
  });

  it('debería lanzar FacturaNoAnulableError si factura está en estado pendiente', async () => {
    // Arrange - factura en estado pendiente
    const facturaPendiente = new Factura(baseProps);
    const item = new ItemFactura({
      descripcion: 'Mandioca',
      cantidad: 3,
      precioUnitario: 5000,
      tasaIVA: 10,
    });
    facturaPendiente.agregarItem(item);
    facturaPendiente.generarCDC(ruc, 1);
    vi.mocked(facturaRepository.findById).mockResolvedValue(facturaPendiente);

    // Act & Assert
    await expect(
      anularFactura.execute({
        facturaId: baseProps.id,
        motivo: 'Test',
      }),
    ).rejects.toThrow(FacturaNoAnulableError);
    await expect(
      anularFactura.execute({
        facturaId: baseProps.id,
        motivo: 'Test',
      }),
    ).rejects.toThrow(/no se puede anular en estado pendiente/);
  });

  it('debería lanzar FacturaNoAnulableError si factura está en estado rechazado', async () => {
    // Arrange - factura rechazada
    const facturaRechazada = new Factura(baseProps);
    const item = new ItemFactura({
      descripcion: 'Mandioca',
      cantidad: 3,
      precioUnitario: 5000,
      tasaIVA: 10,
    });
    facturaRechazada.agregarItem(item);
    facturaRechazada.generarCDC(ruc, 1);
    facturaRechazada.marcarEnviada();
    facturaRechazada.marcarRechazada();
    vi.mocked(facturaRepository.findById).mockResolvedValue(facturaRechazada);

    // Act & Assert
    await expect(
      anularFactura.execute({
        facturaId: baseProps.id,
        motivo: 'Test',
      }),
    ).rejects.toThrow(FacturaNoAnulableError);
    await expect(
      anularFactura.execute({
        facturaId: baseProps.id,
        motivo: 'Test',
      }),
    ).rejects.toThrow(/no se puede anular en estado rechazado/);
  });

  it('debería lanzar FacturaNoEncontradaError si factura no existe', async () => {
    // Arrange
    vi.mocked(facturaRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(
      anularFactura.execute({
        facturaId: 'id-inexistente',
        motivo: 'Test',
      }),
    ).rejects.toThrow(FacturaNoEncontradaError);
    await expect(
      anularFactura.execute({
        facturaId: 'id-inexistente',
        motivo: 'Test',
      }),
    ).rejects.toThrow('Factura no encontrada: id-inexistente');
  });

  it('debería retornar anulada=false si SIFEN rechaza la cancelación', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0300',
      mensaje: 'Rechazo cancelación',
      cdc: facturaAprobada.cdc!.value,
    };
    vi.mocked(sifenGateway.anularDE).mockResolvedValue(mockResponse);

    // Act
    const result = await anularFactura.execute({
      facturaId: baseProps.id,
      motivo: 'Test',
    });

    // Assert
    expect(result.anulada).toBe(false);
    expect(result.codigoRespuesta).toBe('0300');
    expect(facturaRepository.save).not.toHaveBeenCalled();
    expect(facturaAprobada.estado).toBe('aprobado'); // estado no cambia
  });

  it('debería marcar factura como cancelada cuando SIFEN acepta con codigo 0261', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0261',
      mensaje: 'Cancelación aceptada con observación',
      cdc: facturaAprobada.cdc!.value,
    };
    vi.mocked(sifenGateway.anularDE).mockResolvedValue(mockResponse);

    // Act
    const result = await anularFactura.execute({
      facturaId: baseProps.id,
      motivo: 'Operación no se concretó',
    });

    // Assert
    expect(result.anulada).toBe(true);
    expect(facturaRepository.save).toHaveBeenCalledWith(facturaAprobada);
    expect(facturaAprobada.estado).toBe('cancelado');
  });
});
