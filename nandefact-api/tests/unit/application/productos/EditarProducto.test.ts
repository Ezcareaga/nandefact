import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditarProducto } from '../../../../src/application/productos/EditarProducto.js';
import type { IProductoRepository } from '../../../../src/domain/producto/IProductoRepository.js';
import { Producto } from '../../../../src/domain/producto/Producto.js';
import { ProductoNoEncontradoError } from '../../../../src/application/errors/ProductoNoEncontradoError.js';
import { DomainError } from '../../../../src/domain/errors/DomainError.js';

describe('EditarProducto', () => {
  let editarProducto: EditarProducto;
  let mockProductoRepository: IProductoRepository;
  let productoExistente: Producto;

  beforeEach(() => {
    // Mock repository
    mockProductoRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByComercio: vi.fn(),
    };

    // Producto existente
    productoExistente = new Producto({
      id: 'producto-123',
      comercioId: 'comercio-456',
      nombre: 'Mandioca',
      codigo: 'MAN-001',
      precioUnitario: 5000,
      unidadMedida: 'KG',
      tasaIVA: 5,
      categoria: 'Verduras',
      activo: true,
    });

    // Por defecto, producto existe
    vi.mocked(mockProductoRepository.findById).mockResolvedValue(productoExistente);

    // Instanciar caso de uso
    editarProducto = new EditarProducto({
      productoRepository: mockProductoRepository,
    });
  });

  it('should update producto nombre', async () => {
    const input = {
      productoId: 'producto-123',
      cambios: {
        nombre: 'Mandioca Premium',
      },
    };

    await editarProducto.execute(input);

    expect(mockProductoRepository.save).toHaveBeenCalledTimes(1);
    expect(mockProductoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'producto-123',
        nombre: 'Mandioca Premium',
        precioUnitario: 5000,
        activo: true,
      }),
    );
  });

  it('should update producto precio', async () => {
    const input = {
      productoId: 'producto-123',
      cambios: {
        precioUnitario: 6000,
      },
    };

    await editarProducto.execute(input);

    expect(mockProductoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        precioUnitario: 6000,
      }),
    );
  });

  it('should update multiple fields', async () => {
    const input = {
      productoId: 'producto-123',
      cambios: {
        nombre: 'Mandioca Premium',
        precioUnitario: 6000,
        tasaIVA: 10 as const,
      },
    };

    await editarProducto.execute(input);

    expect(mockProductoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Mandioca Premium',
        precioUnitario: 6000,
        tasaIVA: 10,
      }),
    );
  });

  it('should soft-delete producto when activo=false', async () => {
    const input = {
      productoId: 'producto-123',
      cambios: {
        activo: false,
      },
    };

    await editarProducto.execute(input);

    expect(mockProductoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'producto-123',
        activo: false,
      }),
    );
  });

  it('should throw ProductoNoEncontradoError if producto does not exist', async () => {
    vi.mocked(mockProductoRepository.findById).mockResolvedValue(null);

    const input = {
      productoId: 'producto-inexistente',
      cambios: {
        nombre: 'Nuevo nombre',
      },
    };

    await expect(editarProducto.execute(input)).rejects.toThrow(ProductoNoEncontradoError);
    expect(mockProductoRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain validation error for invalid update', async () => {
    const input = {
      productoId: 'producto-123',
      cambios: {
        nombre: '', // Invalid
      },
    };

    await expect(editarProducto.execute(input)).rejects.toThrow(DomainError);
    await expect(editarProducto.execute(input)).rejects.toThrow('El nombre del producto no puede estar vacio');
    expect(mockProductoRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain validation error for invalid precio', async () => {
    const input = {
      productoId: 'producto-123',
      cambios: {
        precioUnitario: 0,
      },
    };

    await expect(editarProducto.execute(input)).rejects.toThrow('El precio unitario debe ser mayor a 0');
    expect(mockProductoRepository.save).not.toHaveBeenCalled();
  });
});
