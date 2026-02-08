import type { RolUsuario } from '../shared/types.js';

/**
 * Par de tokens JWT.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos hasta expiración del access token
}

/**
 * Payload del token JWT.
 */
export interface TokenPayload {
  usuarioId: string;
  comercioId: string;
  rol: RolUsuario;
}

/**
 * Puerto del servicio de autenticación JWT.
 * Define cómo el dominio necesita generar y verificar tokens.
 * Implementación en infrastructure (jsonwebtoken).
 */
export interface IAuthService {
  /**
   * Genera un par de tokens (access + refresh).
   * Access token: 15 minutos
   * Refresh token: 7 días
   */
  generarTokens(payload: TokenPayload): Promise<TokenPair>;

  /**
   * Verifica un access token.
   * @throws Error si el token es inválido o expirado
   */
  verificarAccessToken(token: string): Promise<TokenPayload>;

  /**
   * Verifica un refresh token.
   * @throws Error si el token es inválido o expirado
   */
  verificarRefreshToken(token: string): Promise<TokenPayload>;
}
