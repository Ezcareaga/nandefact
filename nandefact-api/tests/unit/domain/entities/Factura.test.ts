import { describe, it, expect } from 'vitest';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { FacturaSinItemsError } from '../../../../src/domain/errors/FacturaSinItemsError.js';
import { TimbradoVencidoError } from '../../../../src/domain/errors/TimbradoVencidoError.js';

describe('Factura', () => {
  const timbrado = new Timbrado('12558946', new Date('2024-01-01'), new Date('2025-12-31'));
  const numeroFactura = new NumeroFactura('001', '003', '0000137');
  const ruc = new RUC('80069563-1');

  const baseProps = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    comercioId: '660e8400-e29b-41d4-a716-446655440000',
    clienteId: '770e8400-e29b-41d4-a716-446655440000',
    tipoDocumento: 1 as const,
    timbrado,
    numeroFactura,
    tipoEmision: 1 as const,
    condicionPago: 'contado' as const,
    fechaEmision: new Date('2024-06-15'),
  };

  it('debería crear una factura vacía con estado pendiente', () => {
    const factura = new Factura(baseProps);

    expect(factura.estado).toBe('pendiente');
    expect(factura.items).toHaveLength(0);
    expect(factura.cdc).toBeNull();
    expect(factura.totalBruto).toBe(0);
    expect(factura.totalIVA).toBe(0);
  });

  it('debería lanzar TimbradoVencidoError si timbrado no vigente', () => {
    expect(
      () =>
        new Factura({
          ...baseProps,
          fechaEmision: new Date('2026-06-15'), // fuera de vigencia
        }),
    ).toThrow(TimbradoVencidoError);
  });

  it('debería agregar items y recalcular totales automáticamente', () => {
    const factura = new Factura(baseProps);

    // 3 mandioca a 5000 (IVA 10%) = 15000
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Mandioca', cantidad: 3, precioUnitario: 5000, tasaIVA: 10 }),
    );

    expect(factura.items).toHaveLength(1);
    expect(factura.totalBruto).toBe(15000);
    // IVA 10%: base = 13636, IVA = 1364
    expect(factura.totalIVA10).toBe(1364);
    expect(factura.totalIVA).toBe(1364);

    // 2 arroz a 8000 (IVA 5%) = 16000
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Arroz 1kg', cantidad: 2, precioUnitario: 8000, tasaIVA: 5 }),
    );

    expect(factura.items).toHaveLength(2);
    expect(factura.totalBruto).toBe(31000);
    expect(factura.totalIVA10).toBe(1364);
    expect(factura.totalIVA5).toBe(762);
    expect(factura.totalIVA).toBe(2126);
  });

  it('debería calcular totalExenta para items exentos', () => {
    const factura = new Factura(baseProps);

    factura.agregarItem(
      new ItemFactura({
        descripcion: 'Servicio educativo',
        cantidad: 1,
        precioUnitario: 100000,
        tasaIVA: 0,
      }),
    );

    expect(factura.totalExenta).toBe(100000);
    expect(factura.totalIVA).toBe(0);
    expect(factura.totalBruto).toBe(100000);
  });

  it('debería generar CDC válido con datos del comercio', () => {
    const factura = new Factura(baseProps);
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 }),
    );

    factura.generarCDC(ruc, 1);

    expect(factura.cdc).not.toBeNull();
    expect(factura.cdc?.value).toHaveLength(44);
    expect(factura.cdc?.tipoDocumento).toBe('01');
    expect(factura.cdc?.rucEmisor).toBe('80069563');
  });

  it('debería lanzar FacturaSinItemsError al generar CDC sin items', () => {
    const factura = new Factura(baseProps);
    expect(() => factura.generarCDC(ruc, 1)).toThrow(FacturaSinItemsError);
  });

  it('debería impedir modificaciones después de aprobación SIFEN', () => {
    const factura = new Factura(baseProps);
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 }),
    );
    factura.marcarAprobada();

    expect(factura.estado).toBe('aprobado');
    expect(() =>
      factura.agregarItem(
        new ItemFactura({
          descripcion: 'Otro',
          cantidad: 1,
          precioUnitario: 5000,
          tasaIVA: 10,
        }),
      ),
    ).toThrow('No se puede modificar una factura aprobada por SIFEN');
  });

  it('debería transicionar estados correctamente', () => {
    const factura = new Factura(baseProps);
    expect(factura.estado).toBe('pendiente');

    factura.marcarEnviada();
    expect(factura.estado).toBe('enviado');

    factura.marcarAprobada();
    expect(factura.estado).toBe('aprobado');
  });

  it('debería marcar factura como cancelada cuando estado es aprobado', () => {
    const factura = new Factura(baseProps);
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 }),
    );
    factura.marcarAprobada();

    factura.marcarCancelada();

    expect(factura.estado).toBe('cancelado');
  });

  it('debería lanzar error al cancelar factura pendiente', () => {
    const factura = new Factura(baseProps);
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 }),
    );

    expect(() => factura.marcarCancelada()).toThrow('Solo se puede cancelar una factura aprobada');
  });

  it('debería lanzar error al cancelar factura rechazada', () => {
    const factura = new Factura(baseProps);
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 }),
    );
    factura.marcarRechazada();

    expect(() => factura.marcarCancelada()).toThrow('Solo se puede cancelar una factura aprobada');
  });

  it('debería impedir modificaciones a factura cancelada', () => {
    const factura = new Factura(baseProps);
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 }),
    );
    factura.marcarAprobada();
    factura.marcarCancelada();

    expect(() =>
      factura.agregarItem(
        new ItemFactura({ descripcion: 'Otro', cantidad: 1, precioUnitario: 5000, tasaIVA: 10 }),
      ),
    ).toThrow('No se puede modificar una factura aprobada por SIFEN');
  });
});
