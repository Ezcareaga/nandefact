import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsultarRUC } from '../../../../src/application/clientes/ConsultarRUC.js';
import type { ISifenGateway } from '../../../../src/domain/factura/ISifenGateway.js';

describe('ConsultarRUC', () => {
  let useCase: ConsultarRUC;
  let mockSifenGateway: ISifenGateway;

  beforeEach(() => {
    mockSifenGateway = {
      enviarDE: vi.fn(),
      consultarEstado: vi.fn(),
      anularDE: vi.fn(),
      inutilizarNumeracion: vi.fn(),
      consultarRUC: vi.fn()
    } as any;

    useCase = new ConsultarRUC({
      sifenGateway: mockSifenGateway
    });
  });

  describe('happy path', () => {
    it('debe retornar datos si RUC encontrado en SIFEN', async () => {
      const mockResponse = {
        encontrado: true,
        razonSocial: 'Empresa Test SA',
        ruc: '80069563-1'
      };

      vi.mocked(mockSifenGateway.consultarRUC).mockResolvedValue(mockResponse);

      const result = await useCase.execute({ ruc: '80069563-1' });

      expect(result).toEqual(mockResponse);
      expect(mockSifenGateway.consultarRUC).toHaveBeenCalledWith('80069563-1');
    });

    it('debe retornar encontrado=false si RUC no existe en SIFEN', async () => {
      const mockResponse = {
        encontrado: false,
        razonSocial: null,
        ruc: '80069563-1'
      };

      vi.mocked(mockSifenGateway.consultarRUC).mockResolvedValue(mockResponse);

      const result = await useCase.execute({ ruc: '80069563-1' });

      expect(result.encontrado).toBe(false);
      expect(result.razonSocial).toBeNull();
    });
  });

  describe('validaciones', () => {
    it('debe lanzar error si RUC formato inválido', async () => {
      const input = { ruc: '12345-6' }; // Formato inválido

      await expect(useCase.execute(input))
        .rejects.toThrow('RUC inválido');

      expect(mockSifenGateway.consultarRUC).not.toHaveBeenCalled();
    });

    it('debe lanzar error si RUC vacío', async () => {
      const input = { ruc: '' };

      await expect(useCase.execute(input))
        .rejects.toThrow('RUC inválido');
    });

    it('debe propagar error del gateway', async () => {
      vi.mocked(mockSifenGateway.consultarRUC).mockRejectedValue(
        new Error('SIFEN no disponible')
      );

      await expect(useCase.execute({ ruc: '80069563-1' }))
        .rejects.toThrow('SIFEN no disponible');
    });
  });
});
