import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListarProductos } from '../../../../src/application/productos/ListarProductos.js';
import type { IProductoRepository } from '../../../../src/domain/producto/IProductoRepository.js';
import { Producto } from '../../../../src/domain/producto/Producto.js';

describe('ListarProductos', () => {
  let listarProductos: ListarProductos;
  let mockProductoRepository: IProductoRepository;

  beforeEach(() => {
    // Mock repository
    mockProductoRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByComercio: vi.fn(),
    };

    // Instanciar caso de uso
    listarProductos = new ListarProductos({
      productoRepository: mockProductoRepository,
    });
  });

  it('should return paginated list of productos', async () => {
    const productos = [
      new Producto({
        id: 'prod-1',
        comercioId: 'comercio-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
        activo: true,
      }),
      new Producto({
        id: 'prod-2',
        comercioId: 'comercio-456',
        nombre: 'Chipa',
        precioUnitario: 1000,
        unidadMedida: 'UN',
        tasaIVA: 5,
        activo: true,
      }),
    ];

    vi.mocked(mockProductoRepository.findByComercio).mockResolvedValue({
      productos,
      total: 2,
    });

    const input = {
      comercioId: 'comercio-456',
    };

    const output = await listarProductos.execute(input);

    expect(output.productos).toHaveLength(2);
    expect(output.total).toBe(2);
    expect(output.page).toBe(1);
    expect(output.pageSize).toBe(20);

    expect(output.productos[0]).toEqual({
      id: 'prod-1',
      nombre: 'Mandioca',
      codigo: null,
      precioUnitario: 5000,
      unidadMedida: 'KG',
      tasaIVA: 5,
      categoria: null,
      activo: true,
    });

    expect(mockProductoRepository.findByComercio).toHaveBeenCalledWith('comercio-456', {
      page: 1,
      pageSize: 20,
      soloActivos: true,
    });
  });

  it('should return empty list when no productos', async () => {
    vi.mocked(mockProductoRepository.findByComercio).mockResolvedValue({
      productos: [],
      total: 0,
    });

    const input = {
      comercioId: 'comercio-456',
    };

    const output = await listarProductos.execute(input);

    expect(output.productos).toHaveLength(0);
    expect(output.total).toBe(0);
  });

  it('should use custom page and pageSize', async () => {
    vi.mocked(mockProductoRepository.findByComercio).mockResolvedValue({
      productos: [],
      total: 50,
    });

    const input = {
      comercioId: 'comercio-456',
      page: 2,
      pageSize: 10,
    };

    const output = await listarProductos.execute(input);

    expect(output.page).toBe(2);
    expect(output.pageSize).toBe(10);
    expect(mockProductoRepository.findByComercio).toHaveBeenCalledWith('comercio-456', {
      page: 2,
      pageSize: 10,
      soloActivos: true,
    });
  });

  it('should include inactive productos when soloActivos=false', async () => {
    const productos = [
      new Producto({
        id: 'prod-1',
        comercioId: 'comercio-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
        activo: true,
      }),
      new Producto({
        id: 'prod-2',
        comercioId: 'comercio-456',
        nombre: 'Chipa vieja',
        precioUnitario: 1000,
        unidadMedida: 'UN',
        tasaIVA: 5,
        activo: false,
      }),
    ];

    vi.mocked(mockProductoRepository.findByComercio).mockResolvedValue({
      productos,
      total: 2,
    });

    const input = {
      comercioId: 'comercio-456',
      soloActivos: false,
    };

    const output = await listarProductos.execute(input);

    expect(output.productos).toHaveLength(2);
    expect(output.productos[1].activo).toBe(false);
    expect(mockProductoRepository.findByComercio).toHaveBeenCalledWith('comercio-456', {
      page: 1,
      pageSize: 20,
      soloActivos: false,
    });
  });

  it('should map all producto fields to DTOs', async () => {
    const productos = [
      new Producto({
        id: 'prod-1',
        comercioId: 'comercio-456',
        nombre: 'Mandioca Premium',
        codigo: 'MAN-001',
        precioUnitario: 6000,
        unidadMedida: 'KG',
        tasaIVA: 10,
        categoria: 'Verduras',
        activo: true,
      }),
    ];

    vi.mocked(mockProductoRepository.findByComercio).mockResolvedValue({
      productos,
      total: 1,
    });

    const input = {
      comercioId: 'comercio-456',
    };

    const output = await listarProductos.execute(input);

    expect(output.productos[0]).toEqual({
      id: 'prod-1',
      nombre: 'Mandioca Premium',
      codigo: 'MAN-001',
      precioUnitario: 6000,
      unidadMedida: 'KG',
      tasaIVA: 10,
      categoria: 'Verduras',
      activo: true,
    });
  });
});
