import { describe, it, expect } from 'vitest';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';

describe('NumeroFactura', () => {
  it('debería crear un número de factura válido', () => {
    const num = new NumeroFactura('001', '003', '0000137');
    expect(num.establecimiento).toBe('001');
    expect(num.punto).toBe('003');
    expect(num.numero).toBe('0000137');
  });

  it('debería generar formato legible XXX-XXX-XXXXXXX', () => {
    const num = new NumeroFactura('001', '003', '0000137');
    expect(num.formatted).toBe('001-003-0000137');
    expect(num.toString()).toBe('001-003-0000137');
  });

  it('debería comparar igualdad correctamente', () => {
    const num1 = new NumeroFactura('001', '003', '0000137');
    const num2 = new NumeroFactura('001', '003', '0000137');
    const num3 = new NumeroFactura('001', '003', '0000138');
    expect(num1.equals(num2)).toBe(true);
    expect(num1.equals(num3)).toBe(false);
  });

  it('debería lanzar error con establecimiento inválido', () => {
    expect(() => new NumeroFactura('01', '003', '0000137')).toThrow();
    expect(() => new NumeroFactura('0001', '003', '0000137')).toThrow();
    expect(() => new NumeroFactura('abc', '003', '0000137')).toThrow();
  });

  it('debería lanzar error con punto de expedición inválido', () => {
    expect(() => new NumeroFactura('001', '03', '0000137')).toThrow();
  });

  it('debería lanzar error con número inválido', () => {
    expect(() => new NumeroFactura('001', '003', '137')).toThrow();
    expect(() => new NumeroFactura('001', '003', '00000001')).toThrow(); // 8 dígitos
  });
});
