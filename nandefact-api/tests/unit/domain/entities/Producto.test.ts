import { describe, it, expect } from 'vitest';
import { Producto } from '../../../../src/domain/producto/Producto.js';
import { DomainError } from '../../../../src/domain/errors/DomainError.js';

describe('Producto entity', () => {
  describe('creation and validation', () => {
    it('creates a valid producto', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        codigo: 'MAN-001',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
        categoria: 'Verduras',
        activo: true,
      });

      expect(producto.id).toBe('prod-123');
      expect(producto.comercioId).toBe('com-456');
      expect(producto.nombre).toBe('Mandioca');
      expect(producto.codigo).toBe('MAN-001');
      expect(producto.precioUnitario).toBe(5000);
      expect(producto.unidadMedida).toBe('KG');
      expect(producto.tasaIVA).toBe(5);
      expect(producto.categoria).toBe('Verduras');
      expect(producto.activo).toBe(true);
    });

    it('defaults activo to true', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Chipa',
        precioUnitario: 1000,
        unidadMedida: 'UN',
        tasaIVA: 5,
      });

      expect(producto.activo).toBe(true);
    });

    it('trims nombre', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: '  Mandioca  ',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      expect(producto.nombre).toBe('Mandioca');
    });

    it('trims unidadMedida', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: '  KG  ',
        tasaIVA: 5,
      });

      expect(producto.unidadMedida).toBe('KG');
    });

    it('sets codigo to null if not provided', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      expect(producto.codigo).toBeNull();
    });

    it('sets categoria to null if not provided', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      expect(producto.categoria).toBeNull();
    });

    it('rejects empty nombre', () => {
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: '',
          precioUnitario: 5000,
          unidadMedida: 'KG',
          tasaIVA: 5,
        });
      }).toThrow(DomainError);
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: '',
          precioUnitario: 5000,
          unidadMedida: 'KG',
          tasaIVA: 5,
        });
      }).toThrow('El nombre del producto no puede estar vacio');
    });

    it('rejects nombre with only whitespace', () => {
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: '   ',
          precioUnitario: 5000,
          unidadMedida: 'KG',
          tasaIVA: 5,
        });
      }).toThrow('El nombre del producto no puede estar vacio');
    });

    it('rejects zero precio', () => {
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 0,
          unidadMedida: 'KG',
          tasaIVA: 5,
        });
      }).toThrow(DomainError);
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 0,
          unidadMedida: 'KG',
          tasaIVA: 5,
        });
      }).toThrow('El precio unitario debe ser mayor a 0');
    });

    it('rejects negative precio', () => {
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: -1000,
          unidadMedida: 'KG',
          tasaIVA: 5,
        });
      }).toThrow('El precio unitario debe ser mayor a 0');
    });

    it('rejects non-integer precio', () => {
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 1500.5,
          unidadMedida: 'KG',
          tasaIVA: 5,
        });
      }).toThrow(DomainError);
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 1500.5,
          unidadMedida: 'KG',
          tasaIVA: 5,
        });
      }).toThrow('El precio unitario debe ser un entero (guaranies sin decimales)');
    });

    it('rejects empty unidadMedida', () => {
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 5000,
          unidadMedida: '',
          tasaIVA: 5,
        });
      }).toThrow(DomainError);
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 5000,
          unidadMedida: '',
          tasaIVA: 5,
        });
      }).toThrow('La unidad de medida no puede estar vacia');
    });

    it('rejects unidadMedida with only whitespace', () => {
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 5000,
          unidadMedida: '   ',
          tasaIVA: 5,
        });
      }).toThrow('La unidad de medida no puede estar vacia');
    });

    it('rejects invalid tasaIVA', () => {
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 5000,
          unidadMedida: 'KG',
          tasaIVA: 15 as any,
        });
      }).toThrow(DomainError);
      expect(() => {
        new Producto({
          id: 'prod-123',
          comercioId: 'com-456',
          nombre: 'Mandioca',
          precioUnitario: 5000,
          unidadMedida: 'KG',
          tasaIVA: 15 as any,
        });
      }).toThrow('La tasa IVA debe ser 10, 5, o 0');
    });

    it('accepts tasaIVA 10', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Ropa',
        precioUnitario: 50000,
        unidadMedida: 'UN',
        tasaIVA: 10,
      });

      expect(producto.tasaIVA).toBe(10);
    });

    it('accepts tasaIVA 5', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      expect(producto.tasaIVA).toBe(5);
    });

    it('accepts tasaIVA 0 (exento)', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Libro educativo',
        precioUnitario: 25000,
        unidadMedida: 'UN',
        tasaIVA: 0,
      });

      expect(producto.tasaIVA).toBe(0);
    });
  });

  describe('desactivar()', () => {
    it('returns new Producto with activo=false', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
        activo: true,
      });

      const desactivado = producto.desactivar();

      expect(desactivado.activo).toBe(false);
      expect(desactivado.id).toBe(producto.id);
      expect(desactivado.nombre).toBe(producto.nombre);
      expect(producto.activo).toBe(true); // original immutable
    });
  });

  describe('actualizar()', () => {
    it('returns new Producto with merged changes', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      const actualizado = producto.actualizar({
        nombre: 'Mandioca Premium',
        precioUnitario: 6000,
      });

      expect(actualizado.nombre).toBe('Mandioca Premium');
      expect(actualizado.precioUnitario).toBe(6000);
      expect(actualizado.unidadMedida).toBe('KG');
      expect(actualizado.tasaIVA).toBe(5);
      expect(actualizado.id).toBe(producto.id);
      expect(actualizado.comercioId).toBe(producto.comercioId);
    });

    it('keeps original unchanged (immutability)', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      const actualizado = producto.actualizar({
        nombre: 'Mandioca Premium',
      });

      expect(producto.nombre).toBe('Mandioca');
      expect(actualizado.nombre).toBe('Mandioca Premium');
    });

    it('re-validates nombre after update', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      expect(() => {
        producto.actualizar({ nombre: '' });
      }).toThrow('El nombre del producto no puede estar vacio');
    });

    it('re-validates precio after update', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      expect(() => {
        producto.actualizar({ precioUnitario: 0 });
      }).toThrow('El precio unitario debe ser mayor a 0');
    });

    it('re-validates unidadMedida after update', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      expect(() => {
        producto.actualizar({ unidadMedida: '' });
      }).toThrow('La unidad de medida no puede estar vacia');
    });

    it('re-validates tasaIVA after update', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      expect(() => {
        producto.actualizar({ tasaIVA: 20 as any });
      }).toThrow('La tasa IVA debe ser 10, 5, o 0');
    });

    it('can update codigo', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      const actualizado = producto.actualizar({ codigo: 'MAN-001' });

      expect(actualizado.codigo).toBe('MAN-001');
    });

    it('can update categoria', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
      });

      const actualizado = producto.actualizar({ categoria: 'Verduras' });

      expect(actualizado.categoria).toBe('Verduras');
    });

    it('can update activo', () => {
      const producto = new Producto({
        id: 'prod-123',
        comercioId: 'com-456',
        nombre: 'Mandioca',
        precioUnitario: 5000,
        unidadMedida: 'KG',
        tasaIVA: 5,
        activo: true,
      });

      const actualizado = producto.actualizar({ activo: false });

      expect(actualizado.activo).toBe(false);
    });
  });
});
