import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BuscarClientes } from '../../../../src/application/clientes/BuscarClientes.js';
import type { IClienteRepository } from '../../../../src/domain/cliente/IClienteRepository.js';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';

describe('BuscarClientes', () => {
  let useCase: BuscarClientes;
  let mockClienteRepo: IClienteRepository;

  beforeEach(() => {
    mockClienteRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByComercio: vi.fn(),
      buscar: vi.fn()
    } as any;

    useCase = new BuscarClientes({
      clienteRepository: mockClienteRepo
    });
  });

  describe('happy path', () => {
    it('debe retornar clientes que coinciden con query', async () => {
      const clientes = [
        new Cliente({
          id: 'cliente-1',
          comercioId: 'comercio-1',
          nombre: 'Juan Pérez',
          rucCi: '12345678',
          tipoDocumento: 'CI',
          telefono: '0981111111'
        }),
        new Cliente({
          id: 'cliente-2',
          comercioId: 'comercio-1',
          nombre: 'Juan Carlos',
          rucCi: '87654321',
          tipoDocumento: 'CI'
        })
      ];

      vi.mocked(mockClienteRepo.buscar).mockResolvedValue(clientes);

      const result = await useCase.execute({
        comercioId: 'comercio-1',
        query: 'Juan'
      });

      expect(result.clientes).toHaveLength(2);
      expect(result.clientes[0]).toEqual({
        id: 'cliente-1',
        nombre: 'Juan Pérez',
        rucCi: '12345678',
        tipoDocumento: 'CI',
        telefono: '0981111111'
      });
      expect(result.clientes[1]).toEqual({
        id: 'cliente-2',
        nombre: 'Juan Carlos',
        rucCi: '87654321',
        tipoDocumento: 'CI',
        telefono: null
      });
    });

    it('debe retornar array vacío si no hay coincidencias', async () => {
      vi.mocked(mockClienteRepo.buscar).mockResolvedValue([]);

      const result = await useCase.execute({
        comercioId: 'comercio-1',
        query: 'NoExiste'
      });

      expect(result.clientes).toEqual([]);
    });

    it('debe buscar por RUC', async () => {
      const cliente = new Cliente({
        id: 'cliente-3',
        comercioId: 'comercio-1',
        nombre: 'Empresa ABC SA',
        rucCi: '80069563-1',
        tipoDocumento: 'RUC'
      });

      vi.mocked(mockClienteRepo.buscar).mockResolvedValue([cliente]);

      const result = await useCase.execute({
        comercioId: 'comercio-1',
        query: '80069563'
      });

      expect(result.clientes).toHaveLength(1);
      expect(result.clientes[0].rucCi).toBe('80069563-1');
    });
  });

  describe('validaciones', () => {
    it('debe rechazar query con menos de 2 caracteres', async () => {
      const input = {
        comercioId: 'comercio-1',
        query: 'J'
      };

      await expect(useCase.execute(input))
        .rejects.toThrow('La búsqueda requiere al menos 2 caracteres');

      expect(mockClienteRepo.buscar).not.toHaveBeenCalled();
    });

    it('debe rechazar query vacía', async () => {
      const input = {
        comercioId: 'comercio-1',
        query: ''
      };

      await expect(useCase.execute(input))
        .rejects.toThrow('La búsqueda requiere al menos 2 caracteres');
    });

    it('debe rechazar query solo espacios', async () => {
      const input = {
        comercioId: 'comercio-1',
        query: '  '
      };

      await expect(useCase.execute(input))
        .rejects.toThrow('La búsqueda requiere al menos 2 caracteres');
    });
  });
});
