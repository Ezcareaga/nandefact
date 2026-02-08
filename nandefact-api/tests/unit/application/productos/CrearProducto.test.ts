import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrearProducto } from '../../../../src/application/productos/CrearProducto.js';
import type { IProductoRepository } from '../../../../src/domain/producto/IProductoRepository.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { ComercioNoEncontradoError } from '../../../../src/application/errors/ComercioNoEncontradoError.js';
import { DomainError } from '../../../../src/domain/errors/DomainError.js';

describe('CrearProducto', () => {
  let crearProducto: CrearProducto;
  let mockProductoRepository: IProductoRepository;
  let mockComercioRepository: IComercioRepository;
  let comercioValido: Comercio;

  beforeEach(() => {
    // Mock repositories
    mockProductoRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByComercio: vi.fn(),
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
    crearProducto = new CrearProducto({
      productoRepository: mockProductoRepository,
      comercioRepository: mockComercioRepository,
    });
  });

  it('should create a valid producto', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      nombre: 'Mandioca',
      codigo: 'MAN-001',
      precioUnitario: 5000,
      unidadMedida: 'KG',
      tasaIVA: 5 as const,
      categoria: 'Verduras',
    };

    const output = await crearProducto.execute(input);

    // Verify producto was saved
    expect(mockProductoRepository.save).toHaveBeenCalledTimes(1);
    expect(mockProductoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        comercioId: 'comercio-uuid',
        nombre: 'Mandioca',
        codigo: 'MAN-001',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
        categoria: 'Verduras',
        activo: true,
      }),
    );

    // Verify output
    expect(output.productoId).toBeTruthy();
    expect(typeof output.productoId).toBe('string');
  });

  it('should create producto without optional fields', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      nombre: 'Chipa',
      precioUnitario: 1000,
      unidadMedida: 'UN',
      tasaIVA: 5 as const,
    };

    const output = await crearProducto.execute(input);

    expect(mockProductoRepository.save).toHaveBeenCalledTimes(1);
    expect(output.productoId).toBeTruthy();
  });

  it('should throw ComercioNoEncontradoError if comercio does not exist', async () => {
    vi.mocked(mockComercioRepository.findById).mockResolvedValue(null);

    const input = {
      comercioId: 'comercio-inexistente',
      nombre: 'Mandioca',
      precioUnitario: 5000,
      unidadMedida: 'KG',
      tasaIVA: 5 as const,
    };

    await expect(crearProducto.execute(input)).rejects.toThrow(ComercioNoEncontradoError);
    expect(mockProductoRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain validation error for empty nombre', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      nombre: '',
      precioUnitario: 5000,
      unidadMedida: 'KG',
      tasaIVA: 5 as const,
    };

    await expect(crearProducto.execute(input)).rejects.toThrow(DomainError);
    await expect(crearProducto.execute(input)).rejects.toThrow('El nombre del producto no puede estar vacio');
    expect(mockProductoRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain validation error for zero precio', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      nombre: 'Mandioca',
      precioUnitario: 0,
      unidadMedida: 'KG',
      tasaIVA: 5 as const,
    };

    await expect(crearProducto.execute(input)).rejects.toThrow('El precio unitario debe ser mayor a 0');
    expect(mockProductoRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain validation error for non-integer precio', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      nombre: 'Mandioca',
      precioUnitario: 1500.5,
      unidadMedida: 'KG',
      tasaIVA: 5 as const,
    };

    await expect(crearProducto.execute(input)).rejects.toThrow('El precio unitario debe ser un entero (guaranies sin decimales)');
    expect(mockProductoRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate domain validation error for invalid tasaIVA', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      nombre: 'Mandioca',
      precioUnitario: 5000,
      unidadMedida: 'KG',
      tasaIVA: 15 as any,
    };

    await expect(crearProducto.execute(input)).rejects.toThrow('La tasa IVA debe ser 10, 5, o 0');
    expect(mockProductoRepository.save).not.toHaveBeenCalled();
  });
});
