import { describe, it, expect } from 'vitest';
import { CDC } from '../../../../src/domain/factura/CDC.js';
import { CDCInvalidoError } from '../../../../src/domain/errors/CDCInvalidoError.js';

describe('CDC', () => {
  describe('calcularDV', () => {
    it('debería calcular DV = 0 para base de 43 ceros', () => {
      const base43 = '0'.repeat(43);
      expect(CDC.calcularDV(base43)).toBe(0);
    });

    it('debería calcular DV correctamente con factores 2-9 cíclicos', () => {
      // Base con solo el último dígito = 1: factor = 2 (primer factor desde la derecha)
      // suma = 1 * 2 = 2, resto = 2, DV = 11 - 2 = 9
      const base43 = '0'.repeat(42) + '1';
      expect(CDC.calcularDV(base43)).toBe(9);
    });

    it('debería ciclar factores correctamente después de 8 posiciones', () => {
      // Posición 42 (derecha): factor 2
      // Posición 34: factor 2 (cicla después de 8)
      // Base con 1 en posición 34 y el resto ceros:
      const base43 = '0'.repeat(34) + '1' + '0'.repeat(8);
      // suma = 1 * 2 = 2, resto = 2, DV = 11 - 2 = 9
      expect(CDC.calcularDV(base43)).toBe(9);
    });

    it('debería retornar DV = 1 cuando resto = 1', () => {
      // Necesitamos suma % 11 = 1
      // Si último dígito = 5: suma = 5*2 = 10, 10%11 = 10, DV = 11-10 = 1
      const base43 = '0'.repeat(42) + '5';
      // suma = 10, resto = 10, DV = 11-10 = 1
      expect(CDC.calcularDV(base43)).toBe(1);
    });
  });

  describe('constructor', () => {
    it('debería crear CDC válido con 44 dígitos y DV correcto', () => {
      // Base 43 ceros → DV = 0
      const cdcValido = '0'.repeat(43) + '0';
      const cdc = new CDC(cdcValido);
      expect(cdc.value).toBe(cdcValido);
    });

    it('debería lanzar error con longitud distinta a 44', () => {
      expect(() => new CDC('123')).toThrow(CDCInvalidoError);
      expect(() => new CDC('1'.repeat(45))).toThrow(CDCInvalidoError);
    });

    it('debería lanzar error con caracteres no numéricos', () => {
      expect(() => new CDC('a'.repeat(44))).toThrow(CDCInvalidoError);
    });

    it('debería lanzar error con DV incorrecto', () => {
      // Base 43 ceros → DV debería ser 0, no 5
      const cdcInvalido = '0'.repeat(43) + '5';
      expect(() => new CDC(cdcInvalido)).toThrow(CDCInvalidoError);
    });
  });

  describe('crear', () => {
    it('debería generar CDC válido a partir de parámetros', () => {
      const cdc = CDC.crear({
        tipoDocumento: 1,
        rucBase: '80069563',
        dvRUC: 1,
        establecimiento: '001',
        puntoExpedicion: '003',
        numero: '0000137',
        tipoContribuyente: 1,
        fechaEmision: new Date('2024-01-15'),
        tipoEmision: 1,
        codigoSeguridad: '936476002',
      });

      expect(cdc.value).toHaveLength(44);
      expect(cdc.tipoDocumento).toBe('01');
      expect(cdc.rucEmisor).toBe('80069563');
      expect(cdc.dvRUC).toBe('1');
      expect(cdc.establecimiento).toBe('001');
      expect(cdc.puntoExpedicion).toBe('003');
      expect(cdc.numero).toBe('0000137');
      expect(cdc.tipoContribuyente).toBe('1');
      expect(cdc.fechaEmision).toBe('20240115');
      expect(cdc.tipoEmisionCdc).toBe('1');
      expect(cdc.codigoSeguridad).toBe('936476002');

      // El DV calculado debe ser válido (no lanza error en constructor)
      const cdcReconstruido = new CDC(cdc.value);
      expect(cdcReconstruido.value).toBe(cdc.value);
    });

    it('debería generar código de seguridad aleatorio si no se provee', () => {
      const cdc1 = CDC.crear({
        tipoDocumento: 1,
        rucBase: '80069563',
        dvRUC: 1,
        establecimiento: '001',
        puntoExpedicion: '001',
        numero: '0000001',
        tipoContribuyente: 2,
        fechaEmision: new Date('2024-06-01'),
        tipoEmision: 1,
      });

      expect(cdc1.codigoSeguridad).toHaveLength(9);
      expect(/^\d{9}$/.test(cdc1.codigoSeguridad)).toBe(true);
    });

    it('debería parsear correctamente todos los campos del CDC', () => {
      const cdc = CDC.crear({
        tipoDocumento: 5,
        rucBase: '12345678',
        dvRUC: 9,
        establecimiento: '002',
        puntoExpedicion: '005',
        numero: '0001234',
        tipoContribuyente: 2,
        fechaEmision: new Date('2025-03-20'),
        tipoEmision: 2,
        codigoSeguridad: '111222333',
      });

      expect(cdc.tipoDocumento).toBe('05');
      expect(cdc.rucEmisor).toBe('12345678');
      expect(cdc.dvRUC).toBe('9');
      expect(cdc.establecimiento).toBe('002');
      expect(cdc.puntoExpedicion).toBe('005');
      expect(cdc.numero).toBe('0001234');
      expect(cdc.tipoContribuyente).toBe('2');
      expect(cdc.fechaEmision).toBe('20250320');
      expect(cdc.tipoEmisionCdc).toBe('2');
      expect(cdc.codigoSeguridad).toBe('111222333');
    });
  });
});
