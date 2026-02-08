import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditarCliente } from '../../../../src/application/clientes/EditarCliente.js';
import type { IClienteRepository } from '../../../../src/domain/cliente/IClienteRepository.js';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';
import { ClienteNoEncontradoError } from '../../../../src/application/errors/ClienteNoEncontradoError.js';

describe('EditarCliente', () => {
  let useCase: EditarCliente;
  let mockClienteRepo: IClienteRepository;
  let clienteExistente: Cliente;

  beforeEach(() => {
    mockClienteRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByComercio: vi.fn(),
      buscar: vi.fn()
    } as any;

    useCase = new EditarCliente({
      clienteRepository: mockClienteRepo
    });

    clienteExistente = new Cliente({
      id: 'cliente-1',
      comercioId: 'comercio-1',
      nombre: 'Juan Pérez',
      rucCi: '12345678',
      tipoDocumento: 'CI',
      telefono: '0981111111',
      enviarWhatsApp: true
    });

    vi.mocked(mockClienteRepo.findById).mockResolvedValue(clienteExistente);
  });

  describe('happy path', () => {
    it('debe actualizar nombre del cliente', async () => {
      const input = {
        clienteId: 'cliente-1',
        cambios: {
          nombre: 'Juan Carlos Pérez'
        }
      };

      await useCase.execute(input);

      expect(mockClienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cliente-1',
          nombre: 'Juan Carlos Pérez',
          rucCi: '12345678', // Sin cambios
          telefono: '0981111111' // Sin cambios
        })
      );
    });

    it('debe actualizar teléfono y enviarWhatsApp', async () => {
      const input = {
        clienteId: 'cliente-1',
        cambios: {
          telefono: '0981999999',
          enviarWhatsApp: false
        }
      };

      await useCase.execute(input);

      expect(mockClienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          telefono: '0981999999',
          enviarWhatsApp: false
        })
      );
    });

    it('debe actualizar múltiples campos', async () => {
      const input = {
        clienteId: 'cliente-1',
        cambios: {
          nombre: 'Pedro Gómez',
          email: 'pedro@example.com',
          direccion: 'Av. Principal 123',
          frecuente: true
        }
      };

      await useCase.execute(input);

      expect(mockClienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Pedro Gómez',
          email: 'pedro@example.com',
          direccion: 'Av. Principal 123',
          frecuente: true
        })
      );
    });
  });

  describe('validaciones', () => {
    it('debe lanzar ClienteNoEncontradoError si cliente no existe', async () => {
      vi.mocked(mockClienteRepo.findById).mockResolvedValue(null);

      const input = {
        clienteId: 'inexistente',
        cambios: { nombre: 'Test' }
      };

      await expect(useCase.execute(input))
        .rejects.toThrow(ClienteNoEncontradoError);
    });

    it('debe lanzar error si nombre vacío', async () => {
      const input = {
        clienteId: 'cliente-1',
        cambios: { nombre: '' }
      };

      await expect(useCase.execute(input))
        .rejects.toThrow('nombre del cliente no puede estar vacío');
    });
  });
});
