import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InutilizarNumeracion } from '../../../../src/application/facturacion/InutilizarNumeracion.js';
import type { ISifenGateway } from '../../../../src/domain/factura/ISifenGateway.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';

describe('InutilizarNumeracion', () => {
  const timbrado = new Timbrado('12558946', new Date('2024-01-01'), new Date('2025-12-31'));
  const ruc = new RUC('80069563-1');
  const comercioId = '550e8400-e29b-41d4-a716-446655440000';

  let comercioRepository: IComercioRepository;
  let sifenGateway: ISifenGateway;
  let inutilizarNumeracion: InutilizarNumeracion;
  let testComercio: Comercio;

  beforeEach(() => {
    // Crear test comercio
    testComercio = new Comercio({
      id: comercioId,
      ruc,
      razonSocial: 'Comercio Test S.A.',
      nombreFantasia: 'Test Store',
      timbrado,
      establecimiento: '001',
      puntoExpedicion: '003',
      tipoContribuyente: 1,
    });

    comercioRepository = {
      findById: vi.fn().mockResolvedValue(testComercio),
    };

    sifenGateway = {
      enviarDE: vi.fn(),
      consultarEstado: vi.fn(),
      anularDE: vi.fn(),
      inutilizarNumeracion: vi.fn(),
    };

    inutilizarNumeracion = new InutilizarNumeracion({
      comercioRepository,
      sifenGateway,
    });
  });

  it('debería enviar evento inutilización a SIFEN y retornar inutilizado=true', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0260',
      mensaje: 'Inutilización aceptada',
      cdc: '',
    };
    vi.mocked(sifenGateway.inutilizarNumeracion).mockResolvedValue(mockResponse);

    // Act
    const result = await inutilizarNumeracion.execute({
      comercioId,
      establecimiento: '001',
      punto: '003',
      desde: 100,
      hasta: 105,
      motivo: 'Formularios dañados',
    });

    // Assert
    expect(sifenGateway.inutilizarNumeracion).toHaveBeenCalledWith(
      testComercio,
      '001',
      '003',
      100,
      105,
      'Formularios dañados'
    );
    expect(result).toEqual({
      codigoRespuesta: '0260',
      mensajeRespuesta: 'Inutilización aceptada',
      inutilizado: true,
    });
  });

  it('debería retornar inutilizado=true cuando SIFEN acepta con código 0261', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0261',
      mensaje: 'Inutilización aceptada con observación',
      cdc: '',
    };
    vi.mocked(sifenGateway.inutilizarNumeracion).mockResolvedValue(mockResponse);

    // Act
    const result = await inutilizarNumeracion.execute({
      comercioId,
      establecimiento: '001',
      punto: '003',
      desde: 100,
      hasta: 105,
      motivo: 'Error de impresión',
    });

    // Assert
    expect(result.inutilizado).toBe(true);
    expect(result.codigoRespuesta).toBe('0261');
  });

  it('debería retornar inutilizado=false si SIFEN rechaza la inutilización', async () => {
    // Arrange
    const mockResponse = {
      codigo: '0300',
      mensaje: 'Inutilización rechazada',
      cdc: '',
    };
    vi.mocked(sifenGateway.inutilizarNumeracion).mockResolvedValue(mockResponse);

    // Act
    const result = await inutilizarNumeracion.execute({
      comercioId,
      establecimiento: '001',
      punto: '003',
      desde: 100,
      hasta: 105,
      motivo: 'Test',
    });

    // Assert
    expect(result.inutilizado).toBe(false);
    expect(result.codigoRespuesta).toBe('0300');
  });

  it('debería lanzar error si desde > hasta', async () => {
    // Act & Assert
    await expect(
      inutilizarNumeracion.execute({
        comercioId,
        establecimiento: '001',
        punto: '003',
        desde: 105,
        hasta: 100,
        motivo: 'Test',
      })
    ).rejects.toThrow('El número inicial no puede ser mayor al número final');
  });

  it('debería lanzar error si desde <= 0', async () => {
    // Act & Assert
    await expect(
      inutilizarNumeracion.execute({
        comercioId,
        establecimiento: '001',
        punto: '003',
        desde: 0,
        hasta: 100,
        motivo: 'Test',
      })
    ).rejects.toThrow('El número inicial debe ser mayor a cero');
  });

  it('debería lanzar error si hasta <= 0', async () => {
    // Act & Assert
    await expect(
      inutilizarNumeracion.execute({
        comercioId,
        establecimiento: '001',
        punto: '003',
        desde: 100,
        hasta: -5,
        motivo: 'Test',
      })
    ).rejects.toThrow('El número final debe ser mayor a cero');
  });

  it('debería lanzar error si motivo está vacío', async () => {
    // Act & Assert
    await expect(
      inutilizarNumeracion.execute({
        comercioId,
        establecimiento: '001',
        punto: '003',
        desde: 100,
        hasta: 105,
        motivo: '',
      })
    ).rejects.toThrow('El motivo de inutilización es obligatorio');

    await expect(
      inutilizarNumeracion.execute({
        comercioId,
        establecimiento: '001',
        punto: '003',
        desde: 100,
        hasta: 105,
        motivo: '   ',
      })
    ).rejects.toThrow('El motivo de inutilización es obligatorio');
  });
});
