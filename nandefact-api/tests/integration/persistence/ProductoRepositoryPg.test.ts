import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ProductoRepositoryPg } from '../../../src/infrastructure/persistence/ProductoRepositoryPg.js';
import { Producto } from '../../../src/domain/producto/Producto.js';
import { Comercio } from '../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../src/domain/comercio/Timbrado.js';
import { ComercioRepositoryPg } from '../../../src/infrastructure/persistence/ComercioRepositoryPg.js';
import {
  getTestPrisma,
  cleanDatabase,
  disconnectTestDb,
  crearProductoTest,
} from '../helpers/testDb.js';

describe('ProductoRepositoryPg - Integration Tests', () => {
  const prisma = getTestPrisma();
  const repository = new ProductoRepositoryPg(prisma);
  const comercioRepository = new ComercioRepositoryPg(prisma);

  let comercioId: string;

  beforeAll(async () => {
    // Crear un comercio de prueba
    const comercio = new Comercio({
      id: 'comercio-producto-test',
      ruc: new RUC('80069563-1'),
      razonSocial: 'Comercio para Productos',
      nombreFantasia: 'Productos Test',
      timbrado: new Timbrado('12345678', new Date('2025-01-01'), new Date('2027-12-31')),
      establecimiento: '001',
      puntoExpedicion: '001',
      tipoContribuyente: 1,
    });
    await comercioRepository.save(comercio);
    comercioId = comercio.id;
  });

  beforeEach(async () => {
    // Limpiar solo productos (mantener comercio)
    await prisma.producto.deleteMany({});
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await disconnectTestDb(prisma);
  });

  describe('save - crear producto', () => {
    it('debería crear producto con BigInt precioUnitario', async () => {
      // Arrange
      const producto = new Producto({
        id: 'producto-001',
        comercioId,
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'kg',
        tasaIVA: 10,
        activo: true,
      });

      // Act
      await repository.save(producto);

      // Assert
      const found = await repository.findById('producto-001');
      expect(found).not.toBeNull();
      expect(found?.nombre).toBe('Mandioca');
      expect(found?.precioUnitario).toBe(5000);
      expect(found?.tasaIVA).toBe(10);
    });

    it('debería crear producto con código y categoría', async () => {
      // Arrange
      const producto = new Producto({
        id: 'producto-002',
        comercioId,
        nombre: 'Tomate',
        codigo: 'TOM-001',
        precioUnitario: 8000,
        unidadMedida: 'kg',
        tasaIVA: 5,
        categoria: 'Verduras',
        activo: true,
      });

      // Act
      await repository.save(producto);

      // Assert
      const found = await repository.findById('producto-002');
      expect(found?.codigo).toBe('TOM-001');
      expect(found?.categoria).toBe('Verduras');
    });

    it('debería crear producto con campos opcionales null', async () => {
      // Arrange
      const producto = new Producto({
        id: 'producto-003',
        comercioId,
        nombre: 'Producto Simple',
        precioUnitario: 10000,
        unidadMedida: 'unidad',
        tasaIVA: 10,
        activo: true,
      });

      // Act
      await repository.save(producto);

      // Assert
      const found = await repository.findById('producto-003');
      expect(found?.codigo).toBeNull();
      expect(found?.categoria).toBeNull();
    });
  });

  describe('save - actualizar producto', () => {
    it('debería actualizar producto existente', async () => {
      // Arrange - crear primero
      const producto = new Producto({
        id: 'producto-004',
        comercioId,
        nombre: 'Original',
        precioUnitario: 5000,
        unidadMedida: 'kg',
        tasaIVA: 10,
        activo: true,
      });
      await repository.save(producto);

      // Act - actualizar precio
      const actualizado = producto.actualizarPrecio(7500);
      await repository.save(actualizado);

      // Assert
      const found = await repository.findById('producto-004');
      expect(found?.precioUnitario).toBe(7500);
    });
  });

  describe('findById', () => {
    it('debería retornar null si no existe', async () => {
      // Act
      const found = await repository.findById('no-existe');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('findByComercio', () => {
    beforeEach(async () => {
      // Crear varios productos para probar paginación
      const productos = [
        new Producto({ id: 'prod-1', comercioId, nombre: 'A-Producto', precioUnitario: 1000, unidadMedida: 'u', tasaIVA: 10, activo: true }),
        new Producto({ id: 'prod-2', comercioId, nombre: 'B-Producto', precioUnitario: 2000, unidadMedida: 'u', tasaIVA: 10, activo: true }),
        new Producto({ id: 'prod-3', comercioId, nombre: 'C-Producto', precioUnitario: 3000, unidadMedida: 'u', tasaIVA: 10, activo: false }),
        new Producto({ id: 'prod-4', comercioId, nombre: 'D-Producto', precioUnitario: 4000, unidadMedida: 'u', tasaIVA: 10, activo: true }),
      ];

      for (const p of productos) {
        await repository.save(p);
      }
    });

    it('debería retornar productos paginados', async () => {
      // Act
      const result = await repository.findByComercio(comercioId, {
        page: 1,
        pageSize: 2,
      });

      // Assert
      expect(result.productos).toHaveLength(2);
      expect(result.total).toBe(3); // 3 activos por defecto
      expect(result.productos[0].nombre).toBe('A-Producto'); // Ordenado alfabéticamente
      expect(result.productos[1].nombre).toBe('B-Producto');
    });

    it('debería retornar segunda página', async () => {
      // Act
      const result = await repository.findByComercio(comercioId, {
        page: 2,
        pageSize: 2,
      });

      // Assert
      expect(result.productos).toHaveLength(1);
      expect(result.productos[0].nombre).toBe('D-Producto');
    });

    it('debería filtrar solo activos por defecto', async () => {
      // Act
      const result = await repository.findByComercio(comercioId);

      // Assert
      expect(result.productos).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.productos.every(p => p.activo)).toBe(true);
    });

    it('debería incluir inactivos cuando soloActivos=false', async () => {
      // Act
      const result = await repository.findByComercio(comercioId, {
        soloActivos: false,
      });

      // Assert
      expect(result.productos).toHaveLength(4);
      expect(result.total).toBe(4);
    });

    it('debería retornar total count correcto', async () => {
      // Act
      const result = await repository.findByComercio(comercioId, {
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.total).toBe(3); // 3 activos
      expect(result.productos).toHaveLength(3);
    });
  });

  describe('mapeo de tasaIVA', () => {
    it('debería mapear correctamente tasa 10%', async () => {
      // Arrange
      const producto = new Producto({
        id: 'producto-iva10',
        comercioId,
        nombre: 'Producto IVA 10%',
        precioUnitario: 11000,
        unidadMedida: 'u',
        tasaIVA: 10,
        activo: true,
      });

      // Act
      await repository.save(producto);

      // Assert
      const found = await repository.findById('producto-iva10');
      expect(found?.tasaIVA).toBe(10);
    });

    it('debería mapear correctamente tasa 5%', async () => {
      // Arrange
      const producto = new Producto({
        id: 'producto-iva5',
        comercioId,
        nombre: 'Producto IVA 5%',
        precioUnitario: 10500,
        unidadMedida: 'u',
        tasaIVA: 5,
        activo: true,
      });

      // Act
      await repository.save(producto);

      // Assert
      const found = await repository.findById('producto-iva5');
      expect(found?.tasaIVA).toBe(5);
    });

    it('debería mapear correctamente exento (0%)', async () => {
      // Arrange
      const producto = new Producto({
        id: 'producto-exento',
        comercioId,
        nombre: 'Producto Exento',
        precioUnitario: 10000,
        unidadMedida: 'u',
        tasaIVA: 0,
        activo: true,
      });

      // Act
      await repository.save(producto);

      // Assert
      const found = await repository.findById('producto-exento');
      expect(found?.tasaIVA).toBe(0);
    });
  });
});
