import jwt from 'jsonwebtoken';
import type { IAuthService, TokenPair, TokenPayload } from '../../domain/auth/IAuthService.js';

/**
 * Implementación JWT del servicio de autenticación.
 * Genera y verifica tokens JWT para acceso y refresh.
 *
 * Configuración:
 * - Access token: 15 minutos de expiración
 * - Refresh token: 7 días de expiración
 * - Algoritmo: HS256 (HMAC SHA-256)
 *
 * Variables de entorno requeridas:
 * - JWT_SECRET: Clave para firmar access tokens
 * - JWT_REFRESH_SECRET: Clave para firmar refresh tokens
 */
export class AuthServiceJWT implements IAuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET ?? '';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? '';

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async generarTokens(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutos en segundos
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async verificarAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Access token inválido');
      }
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async verificarRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.jwtRefreshSecret) as TokenPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Refresh token inválido');
      }
      throw error;
    }
  }
}
