import { describe, it, expect } from 'vitest';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { DomainError } from '../../../../src/domain/errors/DomainError.js';

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

  it('debería crear comercio con todos los campos opcionales', () => {
    const comercio = new Comercio({
      ...baseProps,
      direccion: 'Av. Mariscal López',
      numeroCasa: '1234',
      departamento: 11,
      departamentoDesc: 'Central',
      distrito: 1,
      distritoDesc: 'Asunción',
      ciudad: 1,
      ciudadDesc: 'Asunción',
      telefono: '0981123456',
      email: 'maria@example.com',
      rubro: 'Verdulería',
      actividadEconomicaCodigo: '4721',
      actividadEconomicaDesc: 'Venta al por menor de frutas y verduras',
      tipoRegimen: 8,
      cscId: 'CSC001',
    });

    expect(comercio.direccion).toBe('Av. Mariscal López');
    expect(comercio.numeroCasa).toBe('1234');
    expect(comercio.departamento).toBe(11);
    expect(comercio.departamentoDesc).toBe('Central');
    expect(comercio.distrito).toBe(1);
    expect(comercio.distritoDesc).toBe('Asunción');
    expect(comercio.ciudad).toBe(1);
    expect(comercio.ciudadDesc).toBe('Asunción');
    expect(comercio.telefono).toBe('0981123456');
    expect(comercio.email).toBe('maria@example.com');
    expect(comercio.rubro).toBe('Verdulería');
    expect(comercio.actividadEconomicaCodigo).toBe('4721');
    expect(comercio.actividadEconomicaDesc).toBe('Venta al por menor de frutas y verduras');
    expect(comercio.tipoRegimen).toBe(8);
    expect(comercio.cscId).toBe('CSC001');
  });

  it('debería dejar campos opcionales como null cuando no se proporcionan', () => {
    const comercio = new Comercio(baseProps);

    expect(comercio.direccion).toBeNull();
    expect(comercio.numeroCasa).toBeNull();
    expect(comercio.departamento).toBeNull();
    expect(comercio.departamentoDesc).toBeNull();
    expect(comercio.distrito).toBeNull();
    expect(comercio.distritoDesc).toBeNull();
    expect(comercio.ciudad).toBeNull();
    expect(comercio.ciudadDesc).toBeNull();
    expect(comercio.telefono).toBeNull();
    expect(comercio.email).toBeNull();
    expect(comercio.rubro).toBeNull();
    expect(comercio.actividadEconomicaCodigo).toBeNull();
    expect(comercio.actividadEconomicaDesc).toBeNull();
    expect(comercio.tipoRegimen).toBeNull();
    expect(comercio.cscId).toBeNull();
  });

  describe('actualizarTimbrado()', () => {
    it('debería retornar nuevo comercio con timbrado actualizado', () => {
      const comercio = new Comercio(baseProps);
      const nuevoTimbrado = new Timbrado('98765432', new Date('2026-01-01'), new Date('2027-12-31'));

      const actualizado = comercio.actualizarTimbrado(nuevoTimbrado);

      expect(actualizado).not.toBe(comercio); // inmutabilidad
      expect(actualizado.timbrado).toBe(nuevoTimbrado);
      expect(actualizado.id).toBe(comercio.id);
      expect(actualizado.ruc).toBe(comercio.ruc);
    });

    it('debería lanzar DomainError si el timbrado está vencido', () => {
      const comercio = new Comercio(baseProps);
      const timbradoVencido = new Timbrado('99999999', new Date('2020-01-01'), new Date('2021-01-01'));

      expect(() => comercio.actualizarTimbrado(timbradoVencido)).toThrow(DomainError);
      expect(() => comercio.actualizarTimbrado(timbradoVencido)).toThrow(/vencido/);
    });

    it('debería preservar campos opcionales al actualizar timbrado', () => {
      const comercio = new Comercio({
        ...baseProps,
        direccion: 'Calle Principal',
        telefono: '0981123456',
      });
      const nuevoTimbrado = new Timbrado('11111111', new Date('2026-01-01'), new Date('2027-12-31'));

      const actualizado = comercio.actualizarTimbrado(nuevoTimbrado);

      expect(actualizado.direccion).toBe('Calle Principal');
      expect(actualizado.telefono).toBe('0981123456');
    });
  });

  describe('actualizar()', () => {
    it('debería retornar nuevo comercio con cambios parciales aplicados', () => {
      const comercio = new Comercio(baseProps);

      const actualizado = comercio.actualizar({
        razonSocial: 'Nueva Razón Social',
        telefono: '0981999888',
      });

      expect(actualizado).not.toBe(comercio); // inmutabilidad
      expect(actualizado.razonSocial).toBe('Nueva Razón Social');
      expect(actualizado.telefono).toBe('0981999888');
      expect(actualizado.nombreFantasia).toBe(comercio.nombreFantasia); // sin cambios
      expect(actualizado.id).toBe(comercio.id);
    });

    it('NO debería permitir cambiar id, ruc, establecimiento, puntoExpedicion', () => {
      const comercio = new Comercio(baseProps);

      // TypeScript should prevent this at compile time
      // But the actualizar method doesn't accept these fields
      const actualizado = comercio.actualizar({
        nombreFantasia: 'Nuevo Nombre',
      });

      expect(actualizado.id).toBe(comercio.id);
      expect(actualizado.ruc).toBe(comercio.ruc);
      expect(actualizado.establecimiento).toBe(comercio.establecimiento);
      expect(actualizado.puntoExpedicion).toBe(comercio.puntoExpedicion);
    });

    it('debería actualizar campos opcionales SIFEN', () => {
      const comercio = new Comercio(baseProps);

      const actualizado = comercio.actualizar({
        direccion: 'Nueva Dirección',
        email: 'nuevo@example.com',
        departamento: 10,
        departamentoDesc: 'Alto Paraná',
      });

      expect(actualizado.direccion).toBe('Nueva Dirección');
      expect(actualizado.email).toBe('nuevo@example.com');
      expect(actualizado.departamento).toBe(10);
      expect(actualizado.departamentoDesc).toBe('Alto Paraná');
    });
  });

  describe('desactivar()', () => {
    it('debería retornar nuevo comercio con activo=false', () => {
      const comercio = new Comercio(baseProps);

      const desactivado = comercio.desactivar();

      expect(desactivado).not.toBe(comercio); // inmutabilidad
      expect(desactivado.activo).toBe(false);
      expect(desactivado.id).toBe(comercio.id);
      expect(desactivado.ruc).toBe(comercio.ruc);
    });

    it('debería preservar campos opcionales al desactivar', () => {
      const comercio = new Comercio({
        ...baseProps,
        direccion: 'Calle Test',
        telefono: '0981555666',
      });

      const desactivado = comercio.desactivar();

      expect(desactivado.direccion).toBe('Calle Test');
      expect(desactivado.telefono).toBe('0981555666');
    });
  });
});
