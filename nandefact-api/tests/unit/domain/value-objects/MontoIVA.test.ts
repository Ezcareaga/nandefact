import { describe, it, expect } from 'vitest';
import { MontoIVA } from '../../../../src/domain/factura/MontoIVA.js';
import { MontoInvalidoError } from '../../../../src/domain/errors/MontoInvalidoError.js';

describe('MontoIVA', () => {
  it('debería calcular IVA 10% correctamente', () => {
    // Precio incluye IVA: Gs 110.000
    // Base gravada = 110000 / 1.10 = 100000
    // IVA = 110000 - 100000 = 10000
    const monto = new MontoIVA(110000, 10);
    expect(monto.baseGravada).toBe(100000);
    expect(monto.montoIVACalculado).toBe(10000);
  });

  it('debería calcular IVA 5% correctamente', () => {
    // Precio incluye IVA: Gs 105.000
    // Base gravada = 105000 / 1.05 = 100000
    // IVA = 105000 - 100000 = 5000
    const monto = new MontoIVA(105000, 5);
    expect(monto.baseGravada).toBe(100000);
    expect(monto.montoIVACalculado).toBe(5000);
  });

  it('debería manejar exenta (0%) sin IVA', () => {
    const monto = new MontoIVA(50000, 0);
    expect(monto.baseGravada).toBe(0);
    expect(monto.montoIVACalculado).toBe(0);
    expect(monto.montoTotal).toBe(50000);
  });

  it('debería redondear a entero (PYG sin decimales)', () => {
    // Gs 15.000 al 10%: base = 15000 / 1.10 = 13636.36... → 13636
    const monto = new MontoIVA(15000, 10);
    expect(Number.isInteger(monto.baseGravada)).toBe(true);
    expect(Number.isInteger(monto.montoIVACalculado)).toBe(true);
    expect(monto.baseGravada).toBe(13636);
    expect(monto.montoIVACalculado).toBe(1364);
  });

  it('debería lanzar error con monto negativo', () => {
    expect(() => new MontoIVA(-1000, 10)).toThrow(MontoInvalidoError);
  });

  it('debería lanzar error con monto decimal', () => {
    expect(() => new MontoIVA(100.5, 10)).toThrow(MontoInvalidoError);
  });

  it('debería aceptar monto cero', () => {
    const monto = new MontoIVA(0, 10);
    expect(monto.baseGravada).toBe(0);
    expect(monto.montoIVACalculado).toBe(0);
  });
});
