import { describe, it, expect } from 'vitest';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { MontoInvalidoError } from '../../../../src/domain/errors/MontoInvalidoError.js';

describe('ItemFactura', () => {
  it('debería crear un item y calcular subtotal e IVA automáticamente', () => {
    // 3 unidades a Gs 5.000 = Gs 15.000 (IVA 10%)
    const item = new ItemFactura({
      descripcion: 'Mandioca',
      cantidad: 3,
      precioUnitario: 5000,
      tasaIVA: 10,
    });

    expect(item.subtotal).toBe(15000);
    expect(item.iva.montoTotal).toBe(15000);
    expect(item.iva.tasaIVA).toBe(10);
    // base = 15000/1.10 = 13636, IVA = 1364
    expect(item.iva.baseGravada).toBe(13636);
    expect(item.iva.montoIVACalculado).toBe(1364);
  });

  it('debería calcular IVA 5% para canasta básica', () => {
    const item = new ItemFactura({
      descripcion: 'Arroz 1kg',
      cantidad: 2,
      precioUnitario: 8000,
      tasaIVA: 5,
    });

    expect(item.subtotal).toBe(16000);
    // base = 16000/1.05 = 15238, IVA = 762
    expect(item.iva.baseGravada).toBe(15238);
    expect(item.iva.montoIVACalculado).toBe(762);
  });

  it('debería manejar items exentos con IVA cero', () => {
    const item = new ItemFactura({
      descripcion: 'Servicio educativo',
      cantidad: 1,
      precioUnitario: 500000,
      tasaIVA: 0,
    });

    expect(item.subtotal).toBe(500000);
    expect(item.iva.baseGravada).toBe(0);
    expect(item.iva.montoIVACalculado).toBe(0);
  });

  it('debería lanzar error con cantidad <= 0', () => {
    expect(
      () => new ItemFactura({ descripcion: 'Test', cantidad: 0, precioUnitario: 1000, tasaIVA: 10 }),
    ).toThrow(MontoInvalidoError);

    expect(
      () =>
        new ItemFactura({ descripcion: 'Test', cantidad: -1, precioUnitario: 1000, tasaIVA: 10 }),
    ).toThrow(MontoInvalidoError);
  });

  it('debería lanzar error con precio unitario negativo', () => {
    expect(
      () =>
        new ItemFactura({ descripcion: 'Test', cantidad: 1, precioUnitario: -500, tasaIVA: 10 }),
    ).toThrow(MontoInvalidoError);
  });

  it('debería lanzar error con descripción vacía', () => {
    expect(
      () => new ItemFactura({ descripcion: '  ', cantidad: 1, precioUnitario: 1000, tasaIVA: 10 }),
    ).toThrow();
  });
});
