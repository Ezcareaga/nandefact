import { describe, it, expect, beforeAll } from 'vitest';
import { AuthServiceJWT } from '../../../src/infrastructure/auth/AuthServiceJWT.js';
import type { TokenPayload } from '../../../src/domain/auth/IAuthService.js';
import jwt from 'jsonwebtoken';

describe('AuthServiceJWT - Integration Tests', () => {
  let authService: AuthServiceJWT;
  const testPayload: TokenPayload = {
    usuarioId: 'user-123',
    comercioId: 'comercio-456',
    rol: 'dueño',
  };

  beforeAll(() => {
    // Configurar variables de entorno para tests
    process.env.JWT_SECRET = 'test-secret-key-for-access-tokens-min-32-chars-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-refresh-tokens-min-32-chars-long';

    authService = new AuthServiceJWT();
  });

  describe('generarTokens', () => {
    it('debería generar access y refresh tokens', async () => {
      // Act
      const tokens = await authService.generarTokens(testPayload);

      // Assert
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(900); // 15 minutos en segundos
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('debería generar tokens diferentes cada vez', async () => {
      // Act
      const tokens1 = await authService.generarTokens(testPayload);
      // Esperar 1100ms para asegurar timestamp diferente (JWT usa segundos, no ms)
      await new Promise(resolve => setTimeout(resolve, 1100));
      const tokens2 = await authService.generarTokens(testPayload);

      // Assert
      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    it('debería incluir payload correcto en el token', async () => {
      // Act
      const tokens = await authService.generarTokens(testPayload);

      // Assert - decodificar sin verificar para inspeccionar contenido
      const decoded = jwt.decode(tokens.accessToken) as TokenPayload;
      expect(decoded.usuarioId).toBe('user-123');
      expect(decoded.comercioId).toBe('comercio-456');
      expect(decoded.rol).toBe('dueño');
    });
  });

  describe('verificarAccessToken', () => {
    it('debería verificar token válido y retornar payload', async () => {
      // Arrange
      const tokens = await authService.generarTokens(testPayload);

      // Act
      const payload = await authService.verificarAccessToken(tokens.accessToken);

      // Assert
      expect(payload.usuarioId).toBe('user-123');
      expect(payload.comercioId).toBe('comercio-456');
      expect(payload.rol).toBe('dueño');
    });

    it('debería rechazar token inválido', async () => {
      // Arrange - token con firma inválida
      const tokenInvalido = jwt.sign(testPayload, 'wrong-secret-key');

      // Act & Assert
      await expect(authService.verificarAccessToken(tokenInvalido)).rejects.toThrow('Access token inválido');
    });

    it('debería rechazar token expirado', async () => {
      // Arrange - generar token con expiración inmediata
      const tokenExpirado = jwt.sign(testPayload, process.env.JWT_SECRET!, { expiresIn: '0s' });

      // Esperar 100ms para asegurar expiración
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act & Assert
      await expect(authService.verificarAccessToken(tokenExpirado)).rejects.toThrow('Access token expirado');
    });

    it('debería rechazar refresh token en verificación de access token', async () => {
      // Arrange
      const tokens = await authService.generarTokens(testPayload);

      // Act & Assert - usar refreshToken donde se espera accessToken
      await expect(authService.verificarAccessToken(tokens.refreshToken)).rejects.toThrow('Access token inválido');
    });
  });

  describe('verificarRefreshToken', () => {
    it('debería verificar refresh token válido', async () => {
      // Arrange
      const tokens = await authService.generarTokens(testPayload);

      // Act
      const payload = await authService.verificarRefreshToken(tokens.refreshToken);

      // Assert
      expect(payload.usuarioId).toBe('user-123');
      expect(payload.comercioId).toBe('comercio-456');
    });

    it('debería rechazar token inválido', async () => {
      // Arrange - token con firma inválida
      const tokenInvalido = jwt.sign(testPayload, 'wrong-refresh-secret');

      // Act & Assert
      await expect(authService.verificarRefreshToken(tokenInvalido)).rejects.toThrow('Refresh token inválido');
    });

    it('debería rechazar access token en verificación de refresh token', async () => {
      // Arrange
      const tokens = await authService.generarTokens(testPayload);

      // Act & Assert - usar accessToken donde se espera refreshToken
      await expect(authService.verificarRefreshToken(tokens.accessToken)).rejects.toThrow('Refresh token inválido');
    });
  });

  describe('separación de secrets', () => {
    it('access y refresh tokens deben usar secrets diferentes', async () => {
      // Arrange
      const tokens = await authService.generarTokens(testPayload);

      // Assert - verificar que NO son intercambiables
      await expect(authService.verificarAccessToken(tokens.refreshToken)).rejects.toThrow();
      await expect(authService.verificarRefreshToken(tokens.accessToken)).rejects.toThrow();
    });
  });

  describe('estructura del payload', () => {
    it('debería incluir claims estándar JWT (iat, exp)', async () => {
      // Arrange
      const tokens = await authService.generarTokens(testPayload);

      // Act - decodificar
      const decoded = jwt.decode(tokens.accessToken) as Record<string, unknown>;

      // Assert
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expiration
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(decoded.iat as number);
    });
  });
});
