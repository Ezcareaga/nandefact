import { describe, it, expect } from 'vitest';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';

describe('Cliente', () => {
  const baseProps = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    comercioId: '660e8400-e29b-41d4-a716-446655440000',
    nombre: 'Juan Pérez',
    rucCi: '4567890',
    tipoDocumento: 'CI' as const,
  };

  it('debería crear cliente con valores por defecto', () => {
    const cliente = new Cliente(baseProps);

    expect(cliente.nombre).toBe('Juan Pérez');
    expect(cliente.rucCi).toBe('4567890');
    expect(cliente.tipoDocumento).toBe('CI');
    expect(cliente.enviarWhatsApp).toBe(true); // default true
    expect(cliente.frecuente).toBe(false); // default false
    expect(cliente.telefono).toBeNull();
    expect(cliente.email).toBeNull();
    expect(cliente.direccion).toBeNull();
  });

  it('debería crear cliente con todos los campos opcionales', () => {
    const cliente = new Cliente({
      ...baseProps,
      telefono: '0981-123456',
      email: 'juan@email.com',
      direccion: 'Mercado 4, Puesto 23',
      frecuente: true,
      enviarWhatsApp: false,
    });

    expect(cliente.telefono).toBe('0981-123456');
    expect(cliente.email).toBe('juan@email.com');
    expect(cliente.direccion).toBe('Mercado 4, Puesto 23');
    expect(cliente.frecuente).toBe(true);
    expect(cliente.enviarWhatsApp).toBe(false);
  });

  it('debería permitir cliente innominado con documento vacío', () => {
    const cliente = new Cliente({
      ...baseProps,
      nombre: 'Sin nombre',
      rucCi: '',
      tipoDocumento: 'innominado',
    });

    expect(cliente.tipoDocumento).toBe('innominado');
    expect(cliente.rucCi).toBe('');
  });

  it('debería lanzar error si nombre está vacío', () => {
    expect(() => new Cliente({ ...baseProps, nombre: '  ' })).toThrow();
  });

  it('debería lanzar error si documento vacío para cliente no innominado', () => {
    expect(() => new Cliente({ ...baseProps, rucCi: '', tipoDocumento: 'CI' })).toThrow();
    expect(() => new Cliente({ ...baseProps, rucCi: '', tipoDocumento: 'RUC' })).toThrow();
  });
});
