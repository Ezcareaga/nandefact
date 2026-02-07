import { describe, it, expect } from 'vitest';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { TimbradoVencidoError } from '../../../../src/domain/errors/TimbradoVencidoError.js';

describe('Timbrado', () => {
  const inicio = new Date('2024-01-01');
  const fin = new Date('2025-12-31');

  it('debería crear un timbrado válido', () => {
    const timbrado = new Timbrado('12558946', inicio, fin);
    expect(timbrado.numero).toBe('12558946');
    expect(timbrado.fechaInicio).toEqual(inicio);
    expect(timbrado.fechaFin).toEqual(fin);
  });

  it('debería verificar vigencia correctamente', () => {
    const timbrado = new Timbrado('12558946', inicio, fin);

    expect(timbrado.estaVigente(new Date('2024-06-15'))).toBe(true);
    expect(timbrado.estaVigente(new Date('2023-12-31'))).toBe(false);
    expect(timbrado.estaVigente(new Date('2026-01-01'))).toBe(false);
    // Fecha límite exacta: vigente
    expect(timbrado.estaVigente(new Date('2024-01-01'))).toBe(true);
    expect(timbrado.estaVigente(new Date('2025-12-31'))).toBe(true);
  });

  it('debería lanzar TimbradoVencidoError si no está vigente', () => {
    const timbrado = new Timbrado('12558946', inicio, fin);
    expect(() => timbrado.validarVigencia(new Date('2026-06-01'))).toThrow(TimbradoVencidoError);
  });

  it('debería lanzar error si fecha inicio >= fecha fin', () => {
    expect(() => new Timbrado('12558946', fin, inicio)).toThrow();
    expect(() => new Timbrado('12558946', inicio, inicio)).toThrow();
  });

  it('debería lanzar error si número de timbrado es inválido', () => {
    expect(() => new Timbrado('abc', inicio, fin)).toThrow();
    expect(() => new Timbrado('123', inicio, fin)).toThrow(); // muy corto
  });
});
