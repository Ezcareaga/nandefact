import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EncolarFactura } from '../../../../src/application/sync/EncolarFactura.js';
import type { IFacturaRepository } from '../../../../src/domain/factura/IFacturaRepository.js';
import type { ISyncQueue } from '../../../../src/domain/sync/ISyncQueue.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { FacturaNoEncontradaError } from '../../../../src/application/errors/FacturaNoEncontradaError.js';

describe('EncolarFactura', () => {
  const timbrado = new Timbrado('12558946', new Date('2024-01-01'), new Date('2026-12-31'));
  const ruc = new RUC('80069563-1');
  const comercioId = '660e8400-e29b-41d4-a716-446655440000';
  const facturaId = '770e8400-e29b-41d4-a716-446655440000';

  let facturaRepository: IFacturaRepository;
  let syncQueue: ISyncQueue;
  let encolarFactura: EncolarFactura;

  /**
   * Helper: Crea una factura en estado pendiente con items y CDC generado.
   */
  function crearFacturaPendiente(id: string, fecha: Date): Factura {
    const numeroFactura = new NumeroFactura('001', '003', '0001234');
    const factura = new Factura({
      id,
      comercioId,
      clienteId: '880e8400-e29b-41d4-a716-446655440000',
      tipoDocumento: 1 as const,
      timbrado,
      numeroFactura,
      tipoEmision: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: fecha,
    });
    const item = new ItemFactura({
      descripcion: 'Mandioca',
      cantidad: 3,
      precioUnitario: 5000,
      tasaIVA: 10,
    });
    factura.agregarItem(item);
    factura.generarCDC(ruc, 1);
    return factura;
  }

  beforeEach(() => {
    facturaRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByComercio: vi.fn().mockResolvedValue([]),
      findPendientes: vi.fn().mockResolvedValue([]),
    };

    syncQueue = {
      encolar: vi.fn().mockResolvedValue(undefined),
      desencolar: vi.fn().mockResolvedValue(null),
      completar: vi.fn().mockResolvedValue(undefined),
      fallar: vi.fn().mockResolvedValue(undefined),
      obtenerPendientes: vi.fn().mockResolvedValue([]),
      contarPendientes: vi.fn().mockResolvedValue(0),
    };

    encolarFactura = new EncolarFactura({
      facturaRepository,
      syncQueue,
    });
  });

  it('debería encolar una factura pendiente exitosamente', async () => {
    // Arrange
    const factura = crearFacturaPendiente(facturaId, new Date(Date.now() - 1000 * 60 * 60));
    vi.mocked(facturaRepository.findById).mockResolvedValue(factura);

    // Act
    const result = await encolarFactura.execute({ facturaId });

    // Assert
    expect(facturaRepository.findById).toHaveBeenCalledWith(facturaId);
    expect(syncQueue.encolar).toHaveBeenCalledTimes(1);

    // Verificar que se encoló un SyncJob con los datos correctos
    const enqueueCall = vi.mocked(syncQueue.encolar).mock.calls[0][0];
    expect(enqueueCall.facturaId).toBe(facturaId);
    expect(enqueueCall.comercioId).toBe(comercioId);
    expect(enqueueCall.cdc).toBe(factura.cdc!.value);
    expect(enqueueCall.fechaEmision).toEqual(factura.fechaEmision);
    expect(enqueueCall.intentos).toBe(0);
    expect(enqueueCall.maxIntentos).toBe(5);

    // Verificar resultado
    expect(result.jobId).toBeDefined();
    expect(result.cdc).toBe(factura.cdc!.value);
  });

  it('debería lanzar FacturaNoEncontradaError cuando la factura no existe', async () => {
    // Arrange
    vi.mocked(facturaRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(encolarFactura.execute({ facturaId })).rejects.toThrow(
      FacturaNoEncontradaError,
    );
    await expect(encolarFactura.execute({ facturaId })).rejects.toThrow(
      'Factura no encontrada',
    );
    expect(syncQueue.encolar).not.toHaveBeenCalled();
  });

  it('debería lanzar error cuando la factura no tiene CDC', async () => {
    // Arrange: Factura sin CDC generado
    const numeroFactura = new NumeroFactura('001', '003', '0001234');
    const facturaSinCDC = new Factura({
      id: facturaId,
      comercioId,
      clienteId: '880e8400-e29b-41d4-a716-446655440000',
      tipoDocumento: 1 as const,
      timbrado,
      numeroFactura,
      tipoEmision: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: new Date(Date.now() - 1000 * 60 * 60),
    });
    const item = new ItemFactura({
      descripcion: 'Mandioca',
      cantidad: 3,
      precioUnitario: 5000,
      tasaIVA: 10,
    });
    facturaSinCDC.agregarItem(item);
    // NO generar CDC

    vi.mocked(facturaRepository.findById).mockResolvedValue(facturaSinCDC);

    // Act & Assert
    await expect(encolarFactura.execute({ facturaId })).rejects.toThrow(
      'no tiene CDC generado',
    );
    expect(syncQueue.encolar).not.toHaveBeenCalled();
  });

  it('debería lanzar error cuando la factura no está en estado pendiente', async () => {
    // Arrange: Factura aprobada
    const factura = crearFacturaPendiente(facturaId, new Date('2024-01-15'));
    factura.marcarEnviada();
    factura.marcarAprobada(); // Cambiar estado a aprobado

    vi.mocked(facturaRepository.findById).mockResolvedValue(factura);

    // Act & Assert
    await expect(encolarFactura.execute({ facturaId })).rejects.toThrow(
      'solo se pueden encolar facturas en estado pendiente',
    );
    expect(syncQueue.encolar).not.toHaveBeenCalled();
  });
});
