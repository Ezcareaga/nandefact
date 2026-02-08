import { describe, it, expect } from 'vitest';
import { Usuario } from '../../../../src/domain/usuario/Usuario.js';
import { DomainError } from '../../../../src/domain/errors/DomainError.js';

describe('Usuario', () => {
  const validProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    comercioId: '123e4567-e89b-12d3-a456-426614174001',
    nombre: 'María González',
    telefono: '+595981234567',
    pinHash: 'hashedpin123',
    rol: 'dueño' as const,
  };

  describe('constructor', () => {
    it('crea usuario con props válidos', () => {
      const usuario = new Usuario(validProps);

      expect(usuario.id).toBe(validProps.id);
      expect(usuario.comercioId).toBe(validProps.comercioId);
      expect(usuario.nombre).toBe(validProps.nombre);
      expect(usuario.telefono).toBe(validProps.telefono);
      expect(usuario.pinHash).toBe(validProps.pinHash);
      expect(usuario.rol).toBe(validProps.rol);
      expect(usuario.activo).toBe(true);
      expect(usuario.intentosFallidos).toBe(0);
      expect(usuario.bloqueadoHasta).toBeNull();
    });

    it('aplica valores por defecto', () => {
      const usuario = new Usuario(validProps);

      expect(usuario.activo).toBe(true);
      expect(usuario.intentosFallidos).toBe(0);
      expect(usuario.bloqueadoHasta).toBeNull();
    });

    it('acepta valores opcionales', () => {
      const bloqueadoHasta = new Date('2026-02-08T12:00:00Z');
      const usuario = new Usuario({
        ...validProps,
        activo: false,
        intentosFallidos: 3,
        bloqueadoHasta,
      });

      expect(usuario.activo).toBe(false);
      expect(usuario.intentosFallidos).toBe(3);
      expect(usuario.bloqueadoHasta).toBe(bloqueadoHasta);
    });

    it('trimea el nombre', () => {
      const usuario = new Usuario({
        ...validProps,
        nombre: '  María González  ',
      });

      expect(usuario.nombre).toBe('María González');
    });

    it('rechaza nombre vacío', () => {
      expect(() => new Usuario({ ...validProps, nombre: '' })).toThrow(DomainError);
      expect(() => new Usuario({ ...validProps, nombre: '' })).toThrow('nombre no puede estar vacío');
    });

    it('rechaza nombre solo espacios', () => {
      expect(() => new Usuario({ ...validProps, nombre: '   ' })).toThrow(DomainError);
    });

    it('acepta teléfono con +', () => {
      const usuario = new Usuario({ ...validProps, telefono: '+595981234567' });
      expect(usuario.telefono).toBe('+595981234567');
    });

    it('acepta teléfono sin +', () => {
      const usuario = new Usuario({ ...validProps, telefono: '0981234567' });
      expect(usuario.telefono).toBe('0981234567');
    });

    it('acepta teléfono de 7 dígitos', () => {
      const usuario = new Usuario({ ...validProps, telefono: '1234567' });
      expect(usuario.telefono).toBe('1234567');
    });

    it('acepta teléfono de 20 dígitos', () => {
      const usuario = new Usuario({ ...validProps, telefono: '12345678901234567890' });
      expect(usuario.telefono).toBe('12345678901234567890');
    });

    it('rechaza teléfono con menos de 7 dígitos', () => {
      expect(() => new Usuario({ ...validProps, telefono: '123456' })).toThrow(DomainError);
      expect(() => new Usuario({ ...validProps, telefono: '123456' })).toThrow('teléfono debe tener entre 7 y 20 dígitos');
    });

    it('rechaza teléfono con más de 20 dígitos', () => {
      expect(() => new Usuario({ ...validProps, telefono: '123456789012345678901' })).toThrow(DomainError);
    });

    it('rechaza teléfono con caracteres no numéricos', () => {
      expect(() => new Usuario({ ...validProps, telefono: 'abc123' })).toThrow(DomainError);
      expect(() => new Usuario({ ...validProps, telefono: '0981-234567' })).toThrow(DomainError);
    });

    it('rechaza teléfono vacío', () => {
      expect(() => new Usuario({ ...validProps, telefono: '' })).toThrow(DomainError);
    });

    it('rechaza pinHash vacío', () => {
      expect(() => new Usuario({ ...validProps, pinHash: '' })).toThrow(DomainError);
      expect(() => new Usuario({ ...validProps, pinHash: '' })).toThrow('PIN hash no puede estar vacío');
    });

    it('rechaza pinHash solo espacios', () => {
      expect(() => new Usuario({ ...validProps, pinHash: '   ' })).toThrow(DomainError);
    });

    it('acepta rol dueño', () => {
      const usuario = new Usuario({ ...validProps, rol: 'dueño' });
      expect(usuario.rol).toBe('dueño');
    });

    it('acepta rol empleado', () => {
      const usuario = new Usuario({ ...validProps, rol: 'empleado' });
      expect(usuario.rol).toBe('empleado');
    });

    it('rechaza rol inválido', () => {
      expect(() => new Usuario({ ...validProps, rol: 'admin' as any })).toThrow(DomainError);
      expect(() => new Usuario({ ...validProps, rol: 'admin' as any })).toThrow('rol debe ser "dueño" o "empleado"');
    });
  });

  describe('registrarIntentoFallido', () => {
    it('incrementa intentosFallidos', () => {
      const usuario = new Usuario(validProps);
      const actualizado = usuario.registrarIntentoFallido();

      expect(actualizado.intentosFallidos).toBe(1);
      expect(actualizado.bloqueadoHasta).toBeNull();
    });

    it('retorna nueva instancia (inmutable)', () => {
      const usuario = new Usuario(validProps);
      const actualizado = usuario.registrarIntentoFallido();

      expect(actualizado).not.toBe(usuario);
      expect(usuario.intentosFallidos).toBe(0);
    });

    it('bloquea al 5to intento', () => {
      let usuario = new Usuario({ ...validProps, intentosFallidos: 4 });
      usuario = usuario.registrarIntentoFallido();

      expect(usuario.intentosFallidos).toBe(5);
      expect(usuario.bloqueadoHasta).not.toBeNull();
      expect(usuario.bloqueadoHasta!.getTime()).toBeGreaterThan(Date.now());
    });

    it('bloqueo es de aproximadamente 30 minutos', () => {
      let usuario = new Usuario({ ...validProps, intentosFallidos: 4 });
      const antes = Date.now();
      usuario = usuario.registrarIntentoFallido();
      const despues = Date.now();

      const treintaMinutos = 30 * 60 * 1000;
      expect(usuario.bloqueadoHasta!.getTime()).toBeGreaterThanOrEqual(antes + treintaMinutos);
      expect(usuario.bloqueadoHasta!.getTime()).toBeLessThanOrEqual(despues + treintaMinutos);
    });

    it('no bloquea antes del 5to intento', () => {
      let usuario = new Usuario(validProps);

      usuario = usuario.registrarIntentoFallido();
      expect(usuario.intentosFallidos).toBe(1);
      expect(usuario.bloqueadoHasta).toBeNull();

      usuario = usuario.registrarIntentoFallido();
      expect(usuario.intentosFallidos).toBe(2);
      expect(usuario.bloqueadoHasta).toBeNull();

      usuario = usuario.registrarIntentoFallido();
      expect(usuario.intentosFallidos).toBe(3);
      expect(usuario.bloqueadoHasta).toBeNull();

      usuario = usuario.registrarIntentoFallido();
      expect(usuario.intentosFallidos).toBe(4);
      expect(usuario.bloqueadoHasta).toBeNull();
    });
  });

  describe('resetearIntentos', () => {
    it('resetea intentosFallidos a 0', () => {
      const usuario = new Usuario({ ...validProps, intentosFallidos: 3 });
      const reseteado = usuario.resetearIntentos();

      expect(reseteado.intentosFallidos).toBe(0);
    });

    it('limpia bloqueadoHasta', () => {
      const bloqueadoHasta = new Date('2026-02-08T12:00:00Z');
      const usuario = new Usuario({ ...validProps, intentosFallidos: 5, bloqueadoHasta });
      const reseteado = usuario.resetearIntentos();

      expect(reseteado.bloqueadoHasta).toBeNull();
    });

    it('retorna nueva instancia (inmutable)', () => {
      const usuario = new Usuario({ ...validProps, intentosFallidos: 3 });
      const reseteado = usuario.resetearIntentos();

      expect(reseteado).not.toBe(usuario);
      expect(usuario.intentosFallidos).toBe(3);
    });
  });

  describe('estaBloqueado', () => {
    it('retorna false si bloqueadoHasta es null', () => {
      const usuario = new Usuario(validProps);
      expect(usuario.estaBloqueado()).toBe(false);
    });

    it('retorna true si bloqueadoHasta es en el futuro', () => {
      const futuro = new Date(Date.now() + 30 * 60 * 1000);
      const usuario = new Usuario({ ...validProps, bloqueadoHasta: futuro });

      expect(usuario.estaBloqueado()).toBe(true);
    });

    it('retorna false si bloqueadoHasta es en el pasado (bloqueo expirado)', () => {
      const pasado = new Date(Date.now() - 5 * 60 * 1000);
      const usuario = new Usuario({ ...validProps, bloqueadoHasta: pasado });

      expect(usuario.estaBloqueado()).toBe(false);
    });

    it('acepta parámetro ahora para verificar en momento específico', () => {
      const bloqueadoHasta = new Date('2026-02-08T12:00:00Z');
      const usuario = new Usuario({ ...validProps, bloqueadoHasta });

      const antes = new Date('2026-02-08T11:30:00Z');
      expect(usuario.estaBloqueado(antes)).toBe(true);

      const despues = new Date('2026-02-08T12:30:00Z');
      expect(usuario.estaBloqueado(despues)).toBe(false);
    });
  });

  describe('desactivar', () => {
    it('marca usuario como inactivo', () => {
      const usuario = new Usuario(validProps);
      const desactivado = usuario.desactivar();

      expect(desactivado.activo).toBe(false);
    });

    it('retorna nueva instancia (inmutable)', () => {
      const usuario = new Usuario(validProps);
      const desactivado = usuario.desactivar();

      expect(desactivado).not.toBe(usuario);
      expect(usuario.activo).toBe(true);
    });

    it('preserva otros campos', () => {
      const usuario = new Usuario({ ...validProps, intentosFallidos: 3 });
      const desactivado = usuario.desactivar();

      expect(desactivado.id).toBe(usuario.id);
      expect(desactivado.nombre).toBe(usuario.nombre);
      expect(desactivado.intentosFallidos).toBe(3);
    });
  });
});
