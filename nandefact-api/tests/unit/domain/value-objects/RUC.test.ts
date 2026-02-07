import { describe, it, expect } from 'vitest';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { RUCInvalidoError } from '../../../../src/domain/errors/RUCInvalidoError.js';

describe('RUC', () => {
  it('debería crear un RUC válido con DV correcto', () => {
    // 80069563: DV calculado = modulo 11 → resultado 1
    const ruc = new RUC('80069563-1');
    expect(ruc.base).toBe('80069563');
    expect(ruc.dv).toBe(1);
    expect(ruc.value).toBe('80069563-1');
  });

  it('debería calcular correctamente el DV para RUC conocido', () => {
    // Verificación manual: 8*9 + 0*8 + 0*7 + 6*6 + 9*5 + 5*4 + 6*3 + 3*2
    //                    = 72 + 0 + 0 + 36 + 45 + 20 + 18 + 6 = 197
    // 197 % 11 = 10, DV = 11 - 10 = 1
    expect(RUC.calcularDV('80069563')).toBe(1);
  });

  it('debería generar basePadded a 8 dígitos', () => {
    const ruc = new RUC('80069563-1');
    expect(ruc.basePadded).toBe('80069563');

    // RUC corto: pad con ceros
    const dvCorto = RUC.calcularDV('12345');
    const rucCorto = new RUC(`12345-${dvCorto}`);
    expect(rucCorto.basePadded).toBe('00012345');
  });

  it('debería lanzar RUCInvalidoError por formato inválido', () => {
    expect(() => new RUC('abc')).toThrow(RUCInvalidoError);
    expect(() => new RUC('12345678')).toThrow(RUCInvalidoError); // sin guion
    expect(() => new RUC('-1')).toThrow(RUCInvalidoError); // sin base
  });

  it('debería lanzar RUCInvalidoError por DV incorrecto', () => {
    // DV correcto para 80069563 es 1, no 5
    expect(() => new RUC('80069563-5')).toThrow(RUCInvalidoError);
  });

  it('debería comparar igualdad entre RUCs', () => {
    const ruc1 = new RUC('80069563-1');
    const ruc2 = new RUC('80069563-1');
    expect(ruc1.equals(ruc2)).toBe(true);
  });
});
