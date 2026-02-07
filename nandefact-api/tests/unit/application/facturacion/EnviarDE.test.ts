import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnviarDE } from '../../../../src/application/facturacion/EnviarDE.js';
import type { IFacturaRepository } from '../../../../src/domain/factura/IFacturaRepository.js';
import type { IFirmaDigital } from '../../../../src/domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../../../src/domain/factura/ISifenGateway.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { FacturaNoEncontradaError } from '../../../../src/application/errors/FacturaNoEncontradaError.js';

describe('EnviarDE', () => {
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
  let firmaDigital: IFirmaDigital;
  let sifenGateway: ISifenGateway;
  let enviarDE: EnviarDE;
  let facturaPendiente: Factura;

  beforeEach(() => {
    // Crear factura en estado pendiente con items y CDC
    facturaPendiente = new Factura(baseProps);
    const item = new ItemFactura({
      descripcion: 'Mandioca',
      cantidad: 3,
      precioUnitario: 5000,
      tasaIVA: 10,
    });
    facturaPendiente.agregarItem(item);
    facturaPendiente.generarCDC(ruc, 1);

    // Mocks
    facturaRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(facturaPendiente),
      findByComercio: vi.fn().mockResolvedValue([]),
      findPendientes: vi.fn().mockResolvedValue([]),
    };

    firmaDigital = {
      firmar: vi.fn().mockResolvedValue('<xml-firmado/>'),
    };

    sifenGateway = {
      enviarDE: vi.fn(),
      consultarEstado: vi.fn(),
      anularDE: vi.fn(),
    };

    enviarDE = new EnviarDE({
      facturaRepository,
      firmaDigital,
      sifenGateway,
    });
  });

  it('debería firmar XML, enviar a SIFEN, y marcar aprobada cuando código es 0260', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0260',
      mensaje: 'Aprobado',
      cdc: facturaPendiente.cdc!.value,
    };
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue(mockResponse);

    // Act
    const result = await enviarDE.execute({ facturaId: baseProps.id });

    // Assert
    expect(firmaDigital.firmar).toHaveBeenCalledWith(
      expect.stringContaining(facturaPendiente.cdc!.value),
    );
    expect(sifenGateway.enviarDE).toHaveBeenCalledWith('<xml-firmado/>');
    expect(facturaRepository.save).toHaveBeenCalledWith(facturaPendiente);
    expect(facturaPendiente.estado).toBe('aprobado');
    expect(result).toEqual({
      cdc: facturaPendiente.cdc!.value,
      estadoSifen: 'aprobado',
      codigoRespuesta: '0260',
      mensajeRespuesta: 'Aprobado',
    });
  });

  it('debería marcar aprobada cuando código es 0261 (aprobado con observación)', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0261',
      mensaje: 'Aprobado con observación',
      cdc: facturaPendiente.cdc!.value,
    };
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue(mockResponse);

    // Act
    const result = await enviarDE.execute({ facturaId: baseProps.id });

    // Assert
    expect(facturaPendiente.estado).toBe('aprobado');
    expect(result.estadoSifen).toBe('aprobado');
    expect(result.codigoRespuesta).toBe('0261');
  });

  it('debería marcar rechazada cuando código es 0300+', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0300',
      mensaje: 'Error de validación',
      cdc: facturaPendiente.cdc!.value,
    };
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue(mockResponse);

    // Act
    const result = await enviarDE.execute({ facturaId: baseProps.id });

    // Assert
    expect(facturaPendiente.estado).toBe('rechazado');
    expect(result.estadoSifen).toBe('rechazado');
    expect(result.codigoRespuesta).toBe('0300');
    expect(facturaRepository.save).toHaveBeenCalledWith(facturaPendiente);
  });

  it('debería lanzar FacturaNoEncontradaError si factura no existe', async () => {
    // Arrange
    vi.mocked(facturaRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(enviarDE.execute({ facturaId: 'id-inexistente' })).rejects.toThrow(
      FacturaNoEncontradaError,
    );
    await expect(enviarDE.execute({ facturaId: 'id-inexistente' })).rejects.toThrow(
      'Factura no encontrada: id-inexistente',
    );
  });

  it('debería llamar firmaDigital.firmar con XML generado', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0260',
      mensaje: 'Aprobado',
      cdc: facturaPendiente.cdc!.value,
    };
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue(mockResponse);

    // Act
    await enviarDE.execute({ facturaId: baseProps.id });

    // Assert
    expect(firmaDigital.firmar).toHaveBeenCalledTimes(1);
    const xmlGenerated = vi.mocked(firmaDigital.firmar).mock.calls[0][0];
    expect(xmlGenerated).toContain(facturaPendiente.cdc!.value);
    expect(xmlGenerated).toContain('<DE>');
    expect(xmlGenerated).toContain('</DE>');
  });
});
