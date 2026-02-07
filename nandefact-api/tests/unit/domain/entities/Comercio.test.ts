import { describe, it, expect } from 'vitest';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';

describe('Comercio', () => {
  const ruc = new RUC('80069563-1');
  const timbrado = new Timbrado('12558946', new Date('2024-01-01'), new Date('2025-12-31'));

  const baseProps = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    ruc,
    razonSocial: 'Doña María Comercial',
    nombreFantasia: 'Doña María',
    timbrado,
    establecimiento: '001',
    puntoExpedicion: '003',
    tipoContribuyente: 1 as const,
  };

  it('debería crear un comercio válido', () => {
    const comercio = new Comercio(baseProps);

    expect(comercio.ruc.value).toBe('80069563-1');
    expect(comercio.razonSocial).toBe('Doña María Comercial');
    expect(comercio.nombreFantasia).toBe('Doña María');
    expect(comercio.establecimiento).toBe('001');
    expect(comercio.puntoExpedicion).toBe('003');
    expect(comercio.tipoContribuyente).toBe(1);
    expect(comercio.activo).toBe(true); // default
  });

  it('debería aceptar activo = false', () => {
    const comercio = new Comercio({ ...baseProps, activo: false });
    expect(comercio.activo).toBe(false);
  });

  it('debería lanzar error con razón social vacía', () => {
    expect(() => new Comercio({ ...baseProps, razonSocial: '  ' })).toThrow();
  });

  it('debería lanzar error con establecimiento inválido', () => {
    expect(() => new Comercio({ ...baseProps, establecimiento: '01' })).toThrow();
    expect(() => new Comercio({ ...baseProps, establecimiento: '0001' })).toThrow();
  });

  it('debería lanzar error con punto de expedición inválido', () => {
    expect(() => new Comercio({ ...baseProps, puntoExpedicion: 'abc' })).toThrow();
  });
});
