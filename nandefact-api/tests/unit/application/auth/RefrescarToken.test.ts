import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefrescarToken } from '../../../../src/application/auth/RefrescarToken.js';
import { Usuario } from '../../../../src/domain/usuario/Usuario.js';
import { CredencialesInvalidasError } from '../../../../src/application/errors/CredencialesInvalidasError.js';
import type { IUsuarioRepository } from '../../../../src/domain/usuario/IUsuarioRepository.js';
import type { IAuthService, TokenPair, TokenPayload } from '../../../../src/domain/auth/IAuthService.js';

describe('RefrescarToken', () => {
  let useCase: RefrescarToken;
  let mockAuthService: IAuthService;
  let mockUsuarioRepository: IUsuarioRepository;

  const payloadValido: TokenPayload = {
    usuarioId: 'usuario-123',
    comercioId: 'comercio-456',
    rol: 'dueño',
  };

  const usuarioValido = new Usuario({
    id: 'usuario-123',
    comercioId: 'comercio-456',
    nombre: 'María González',
    telefono: '+595981234567',
    pinHash: 'hashed-pin-123',
    rol: 'dueño',
  });

  const nuevosTokens: TokenPair = {
    accessToken: 'new-access-token-xyz',
    refreshToken: 'new-refresh-token-abc',
    expiresIn: 900,
  };

  beforeEach(() => {
    mockAuthService = { generarTokens: vi.fn(), verificarAccessToken: vi.fn(), verificarRefreshToken: vi.fn() };
    mockUsuarioRepository = { save: vi.fn(), findById: vi.fn(), findByTelefono: vi.fn() };
    useCase = new RefrescarToken({ authService: mockAuthService, usuarioRepository: mockUsuarioRepository });
  });

  it('retorna nuevos tokens cuando el refresh token es válido', async () => {
    vi.mocked(mockAuthService.verificarRefreshToken).mockResolvedValue(payloadValido);
    vi.mocked(mockUsuarioRepository.findById).mockResolvedValue(usuarioValido);
    vi.mocked(mockAuthService.generarTokens).mockResolvedValue(nuevosTokens);

    const result = await useCase.execute({ refreshToken: 'old-refresh-token' });

    expect(result.accessToken).toBe('new-access-token-xyz');
    expect(result.refreshToken).toBe('new-refresh-token-abc');
  });

  it('verifica el refresh token', async () => {
    vi.mocked(mockAuthService.verificarRefreshToken).mockResolvedValue(payloadValido);
    vi.mocked(mockUsuarioRepository.findById).mockResolvedValue(usuarioValido);
    vi.mocked(mockAuthService.generarTokens).mockResolvedValue(nuevosTokens);

    await useCase.execute({ refreshToken: 'old-refresh-token' });

    expect(mockAuthService.verificarRefreshToken).toHaveBeenCalledWith('old-refresh-token');
  });

  it('lanza error cuando el refresh token es inválido', async () => {
    vi.mocked(mockAuthService.verificarRefreshToken).mockRejectedValue(new Error('Token inválido'));

    await expect(useCase.execute({ refreshToken: 'invalid-token' })).rejects.toThrow('Token inválido');
  });

  it('rechaza si el usuario fue eliminado', async () => {
    vi.mocked(mockAuthService.verificarRefreshToken).mockResolvedValue(payloadValido);
    vi.mocked(mockUsuarioRepository.findById).mockResolvedValue(null);

    await expect(useCase.execute({ refreshToken: 'valid-token' })).rejects.toThrow(CredencialesInvalidasError);
  });

  it('rechaza si el usuario está inactivo', async () => {
    const usuarioInactivo = new Usuario({ ...usuarioValido, activo: false });
    vi.mocked(mockAuthService.verificarRefreshToken).mockResolvedValue(payloadValido);
    vi.mocked(mockUsuarioRepository.findById).mockResolvedValue(usuarioInactivo);

    await expect(useCase.execute({ refreshToken: 'valid-token' })).rejects.toThrow(CredencialesInvalidasError);
  });

  it('genera nuevo par de tokens (rotación completa)', async () => {
    vi.mocked(mockAuthService.verificarRefreshToken).mockResolvedValue(payloadValido);
    vi.mocked(mockUsuarioRepository.findById).mockResolvedValue(usuarioValido);
    vi.mocked(mockAuthService.generarTokens).mockResolvedValue(nuevosTokens);

    const result = await useCase.execute({ refreshToken: 'old-refresh-token' });

    expect(result.refreshToken).toBe('new-refresh-token-abc');
    expect(result.refreshToken).not.toBe('old-refresh-token');
  });
});
