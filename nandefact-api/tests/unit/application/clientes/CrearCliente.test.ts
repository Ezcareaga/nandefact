import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrearCliente } from '../../../../src/application/clientes/CrearCliente.js';
import type { IClienteRepository } from '../../../../src/domain/cliente/IClienteRepository.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';

describe('CrearCliente', () => {
  let useCase: CrearCliente;
  let mockClienteRepo: IClienteRepository;
  let mockComercioRepo: IComercioRepository;
  let comercio: Comercio;

  beforeEach(() => {
    mockClienteRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByComercio: vi.fn(),
      buscar: vi.fn()
    } as any;

    mockComercioRepo = {
      findById: vi.fn()
    } as any;

    useCase = new CrearCliente({
      clienteRepository: mockClienteRepo,
      comercioRepository: mockComercioRepo
    });

    const ruc = new RUC('80069563-1');
    const timbrado = new Timbrado('12345678', new Date('2024-01-01'), new Date('2024-12-31'));
    comercio = new Comercio({
      id: 'comercio-1',
      ruc,
      razonSocial: 'Comercio Test SA',
      nombreFantasia: 'Test Store',
      establecimiento: '001',
      puntoExpedicion: '001',
      timbrado,
      tipoContribuyente: 2
    });

    vi.mocked(mockComercioRepo.findById).mockResolvedValue(comercio);
  });

  describe('happy path', () => {
    it('debe crear cliente identificado con CI', async () => {
      const input = {
        comercioId: 'comercio-1',
        nombre: 'Juan Pérez',
        rucCi: '12345678',
        tipoDocumento: 'CI' as const,
        telefono: '0981123456',
        enviarWhatsApp: true
      };

      const result = await useCase.execute(input);

      expect(result.clienteId).toBeDefined();
      expect(typeof result.clienteId).toBe('string');
      expect(mockClienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          comercioId: 'comercio-1',
          nombre: 'Juan Pérez',
          rucCi: '12345678',
          tipoDocumento: 'CI',
          telefono: '0981123456'
        })
      );
    });

    it('debe crear cliente con RUC válido', async () => {
      const input = {
        comercioId: 'comercio-1',
        nombre: 'Empresa ABC SA',
        rucCi: '80069563-1',
        tipoDocumento: 'RUC' as const
      };

      const result = await useCase.execute(input);

      expect(result.clienteId).toBeDefined();
      expect(mockClienteRepo.save).toHaveBeenCalled();
    });

    it('debe crear cliente innominado sin rucCi', async () => {
      const input = {
        comercioId: 'comercio-1',
        nombre: 'Cliente Innominado',
        rucCi: '',
        tipoDocumento: 'innominado' as const
      };

      const result = await useCase.execute(input);

      expect(result.clienteId).toBeDefined();
      expect(mockClienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoDocumento: 'innominado',
          rucCi: ''
        })
      );
    });

    it('debe aplicar defaults: frecuente=false, enviarWhatsApp=true', async () => {
      const input = {
        comercioId: 'comercio-1',
        nombre: 'Test Cliente',
        rucCi: '11111111',
        tipoDocumento: 'CI' as const
      };

      await useCase.execute(input);

      expect(mockClienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          frecuente: false,
          enviarWhatsApp: true
        })
      );
    });
  });

  describe('validaciones', () => {
    it('debe lanzar error si comercio no encontrado', async () => {
      vi.mocked(mockComercioRepo.findById).mockResolvedValue(null);

      const input = {
        comercioId: 'inexistente',
        nombre: 'Test',
        rucCi: '12345678',
        tipoDocumento: 'CI' as const
      };

      await expect(useCase.execute(input))
        .rejects.toThrow('Comercio no encontrado: inexistente');
    });

    it('debe lanzar error si RUC inválido', async () => {
      const input = {
        comercioId: 'comercio-1',
        nombre: 'Empresa Test',
        rucCi: '12345-6', // Formato inválido
        tipoDocumento: 'RUC' as const
      };

      await expect(useCase.execute(input))
        .rejects.toThrow('RUC inválido');
    });

    it('debe lanzar error si nombre vacío', async () => {
      const input = {
        comercioId: 'comercio-1',
        nombre: '',
        rucCi: '12345678',
        tipoDocumento: 'CI' as const
      };

      await expect(useCase.execute(input))
        .rejects.toThrow('nombre del cliente no puede estar vacío');
    });
  });
});
