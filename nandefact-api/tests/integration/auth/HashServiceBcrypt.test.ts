import { describe, it, expect } from 'vitest';
import { HashServiceBcrypt } from '../../../src/infrastructure/auth/HashServiceBcrypt.js';

describe('HashServiceBcrypt - Integration Tests', () => {
  const hashService = new HashServiceBcrypt();

  describe('hash', () => {
    it('debería generar hash diferente del PIN original', async () => {
      // Arrange
      const pin = '1234';

      // Act
      const hash = await hashService.hash(pin);

      // Assert
      expect(hash).not.toBe(pin);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes son largos
    });

    it('debería generar hashes diferentes para el mismo PIN (salt aleatorio)', async () => {
      // Arrange
      const pin = '5678';

      // Act
      const hash1 = await hashService.hash(pin);
      const hash2 = await hashService.hash(pin);

      // Assert
      expect(hash1).not.toBe(hash2); // Salt aleatorio genera hashes diferentes
    });

    it('debería funcionar con PIN de 4 dígitos', async () => {
      // Arrange
      const pin = '9876';

      // Act
      const hash = await hashService.hash(pin);

      // Assert
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });

    it('debería funcionar con PIN de 6 dígitos', async () => {
      // Arrange
      const pin = '123456';

      // Act
      const hash = await hashService.hash(pin);

      // Assert
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2b$')).toBe(true);
    });
  });

  describe('verificar', () => {
    it('debería retornar true para PIN correcto', async () => {
      // Arrange
      const pin = '1234';
      const hash = await hashService.hash(pin);

      // Act
      const resultado = await hashService.verificar(pin, hash);

      // Assert
      expect(resultado).toBe(true);
    });

    it('debería retornar false para PIN incorrecto', async () => {
      // Arrange
      const pinCorrecto = '1234';
      const pinIncorrecto = '5678';
      const hash = await hashService.hash(pinCorrecto);

      // Act
      const resultado = await hashService.verificar(pinIncorrecto, hash);

      // Assert
      expect(resultado).toBe(false);
    });

    it('debería retornar false para hash inválido', async () => {
      // Arrange
      const pin = '1234';
      const hashInvalido = 'hash-invalido';

      // Act
      const resultado = await hashService.verificar(pin, hashInvalido);

      // Assert
      expect(resultado).toBe(false);
    });

    it('debería verificar correctamente aunque hashes sean diferentes', async () => {
      // Arrange - mismo PIN genera diferentes hashes por el salt
      const pin = '9999';
      const hash1 = await hashService.hash(pin);
      const hash2 = await hashService.hash(pin);

      // Act
      const verifica1 = await hashService.verificar(pin, hash1);
      const verifica2 = await hashService.verificar(pin, hash2);

      // Assert
      expect(hash1).not.toBe(hash2);
      expect(verifica1).toBe(true);
      expect(verifica2).toBe(true);
    });
  });

  describe('compatibilidad con PINs reales', () => {
    it('debería manejar PIN de 4 dígitos (caso común)', async () => {
      // Arrange
      const pin = '0000';
      const hash = await hashService.hash(pin);

      // Act
      const resultado = await hashService.verificar(pin, hash);

      // Assert
      expect(resultado).toBe(true);
    });

    it('debería manejar PIN de 6 dígitos (caso menos común)', async () => {
      // Arrange
      const pin = '999999';
      const hash = await hashService.hash(pin);

      // Act
      const resultado = await hashService.verificar(pin, hash);

      // Assert
      expect(resultado).toBe(true);
    });
  });
});
