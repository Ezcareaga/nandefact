import { describe, it, expect } from 'vitest';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';

describe('Factura — condición crédito', () => {
  const timbrado = new Timbrado('12345678', new Date('2024-01-01'), new Date('2025-12-31'));
  const ruc = new RUC('80069563-1');

  const crearFacturaCredito = (): Factura => {
    const factura = new Factura({
      id: 'fac-cred-1',
      comercioId: 'com-1',
      clienteId: 'cli-1',
      tipoDocumento: 1,
      timbrado,
      numeroFactura: new NumeroFactura('001', '003', '0000300'),
      tipoEmision: 1,
      condicionPago: 'credito',
      fechaEmision: new Date('2024-06-15T10:30:00Z'),
    });

    factura.agregarItem(
      new ItemFactura({
        descripcion: 'Mandioca',
        cantidad: 3,
        precioUnitario: 5000,
        tasaIVA: 5,
      }),
    );

    factura.agregarItem(
      new ItemFactura({
        descripcion: 'Tomate',
        cantidad: 2,
        precioUnitario: 8000,
        tasaIVA: 10,
      }),
    );

    return factura;
  };

  it('debe aceptar condicionPago="credito"', () => {
    const factura = crearFacturaCredito();
    expect(factura.condicionPago).toBe('credito');
  });

  it('debe calcular totales igual que contado', () => {
    const facturaCredito = crearFacturaCredito();

    // Mismos items con condicion contado para comparar
    const facturaContado = new Factura({
      id: 'fac-cont-1',
      comercioId: 'com-1',
      clienteId: 'cli-1',
      tipoDocumento: 1,
      timbrado,
      numeroFactura: new NumeroFactura('001', '003', '0000301'),
      tipoEmision: 1,
      condicionPago: 'contado',
      fechaEmision: new Date('2024-06-15T10:30:00Z'),
    });

    facturaContado.agregarItem(
      new ItemFactura({ descripcion: 'Mandioca', cantidad: 3, precioUnitario: 5000, tasaIVA: 5 }),
    );
    facturaContado.agregarItem(
      new ItemFactura({ descripcion: 'Tomate', cantidad: 2, precioUnitario: 8000, tasaIVA: 10 }),
    );

    expect(facturaCredito.totalBruto).toBe(facturaContado.totalBruto);
    expect(facturaCredito.totalIVA10).toBe(facturaContado.totalIVA10);
    expect(facturaCredito.totalIVA5).toBe(facturaContado.totalIVA5);
    expect(facturaCredito.totalExenta).toBe(facturaContado.totalExenta);
    expect(facturaCredito.totalIVA).toBe(facturaContado.totalIVA);
  });

  it('debe generar CDC con condición crédito', () => {
    const factura = crearFacturaCredito();
    factura.generarCDC(ruc, 1);

    expect(factura.cdc).not.toBeNull();
    expect(factura.cdc!.value).toHaveLength(44);
  });
});
