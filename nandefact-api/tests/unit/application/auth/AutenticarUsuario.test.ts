import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutenticarUsuario } from '../../../../src/application/auth/AutenticarUsuario.js';
import { Usuario } from '../../../../src/domain/usuario/Usuario.js';
import { CredencialesInvalidasError } from '../../../../src/application/errors/CredencialesInvalidasError.js';
import { CuentaBloqueadaError } from '../../../../src/application/errors/CuentaBloqueadaError.js';
import type { IUsuarioRepository } from '../../../../src/domain/usuario/IUsuarioRepository.js';
import type { IHashService } from '../../../../src/domain/auth/IHashService.js';
import type { IAuthService, TokenPair } from '../../../../src/domain/auth/IAuthService.js';

describe('AutenticarUsuario', () => {
  let useCase: AutenticarUsuario;
  let mockUsuarioRepository: IUsuarioRepository;
  let mockHashService: IHashService;
  let mockAuthService: IAuthService;

  const usuarioValido = new Usuario({
    id: 'usuario-123',
    comercioId: 'comercio-456',
    nombre: 'María González',
    telefono: '+595981234567',
    pinHash: 'hashed-pin-123',
    rol: 'dueño',
  });

  const tokensGenerados: TokenPair = {
    accessToken: 'access-token-xyz',
    refreshToken: 'refresh-token-abc',
    expiresIn: 900,
  };

  beforeEach(() => {
    mockUsuarioRepository = { save: vi.fn(), findById: vi.fn(), findByTelefono: vi.fn() };
    mockHashService = { hash: vi.fn(), verificar: vi.fn() };
    mockAuthService = { generarTokens: vi.fn(), verificarAccessToken: vi.fn(), verificarRefreshToken: vi.fn() };
    useCase = new AutenticarUsuario({
      usuarioRepository: mockUsuarioRepository,
      hashService: mockHashService,
      authService: mockAuthService,
    });
  });

  it('retorna tokens cuando credenciales son válidas', async () => {
    vi.mocked(mockUsuarioRepository.findByTelefono).mockResolvedValue(usuarioValido);
    vi.mocked(mockHashService.verificar).mockResolvedValue(true);
    vi.mocked(mockAuthService.generarTokens).mockResolvedValue(tokensGenerados);

    const result = await useCase.execute({ telefono: '+595981234567', pin: '1234' });

    expect(result.accessToken).toBe('access-token-xyz');
    expect(result.usuario.id).toBe('usuario-123');
  });

  it('resetea intentos después de login exitoso', async () => {
    const usuarioConIntentos = new Usuario({ ...usuarioValido, intentosFallidos: 3 });
    vi.mocked(mockUsuarioRepository.findByTelefono).mockResolvedValue(usuarioConIntentos);
    vi.mocked(mockHashService.verificar).mockResolvedValue(true);
    vi.mocked(mockAuthService.generarTokens).mockResolvedValue(tokensGenerados);

    await useCase.execute({ telefono: '+595981234567', pin: '1234' });

    expect(mockUsuarioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ intentosFallidos: 0, bloqueadoHasta: null }),
    );
  });

  it('rechaza PIN con formato inválido', async () => {
    await expect(useCase.execute({ telefono: '+595981234567', pin: '123' })).rejects.toThrow(CredencialesInvalidasError);
    expect(mockUsuarioRepository.findByTelefono).not.toHaveBeenCalled();
  });

  it('rechaza usuario inexistente', async () => {
    vi.mocked(mockUsuarioRepository.findByTelefono).mockResolvedValue(null);
    await expect(useCase.execute({ telefono: '+595981234567', pin: '1234' })).rejects.toThrow(CredencialesInvalidasError);
  });

  it('rechaza usuario inactivo', async () => {
    const usuarioInactivo = new Usuario({ ...usuarioValido, activo: false });
    vi.mocked(mockUsuarioRepository.findByTelefono).mockResolvedValue(usuarioInactivo);
    await expect(useCase.execute({ telefono: '+595981234567', pin: '1234' })).rejects.toThrow(CredencialesInvalidasError);
  });

  it('incrementa intentos cuando PIN es incorrecto', async () => {
    vi.mocked(mockUsuarioRepository.findByTelefono).mockResolvedValue(usuarioValido);
    vi.mocked(mockHashService.verificar).mockResolvedValue(false);

    await expect(useCase.execute({ telefono: '+595981234567', pin: '9999' })).rejects.toThrow(CredencialesInvalidasError);
    expect(mockUsuarioRepository.save).toHaveBeenCalledWith(expect.objectContaining({ intentosFallidos: 1 }));
  });

  it('bloquea usuario al 5to intento', async () => {
    const usuario4Intentos = new Usuario({ ...usuarioValido, intentosFallidos: 4 });
    vi.mocked(mockUsuarioRepository.findByTelefono).mockResolvedValue(usuario4Intentos);
    vi.mocked(mockHashService.verificar).mockResolvedValue(false);

    await expect(useCase.execute({ telefono: '+595981234567', pin: '9999' })).rejects.toThrow();
    expect(mockUsuarioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ intentosFallidos: 5, bloqueadoHasta: expect.any(Date) }),
    );
  });

  it('rechaza usuario bloqueado', async () => {
    const bloqueadoHasta = new Date(Date.now() + 20 * 60 * 1000);
    const usuarioBloqueado = new Usuario({ ...usuarioValido, intentosFallidos: 5, bloqueadoHasta });
    vi.mocked(mockUsuarioRepository.findByTelefono).mockResolvedValue(usuarioBloqueado);

    await expect(useCase.execute({ telefono: '+595981234567', pin: '1234' })).rejects.toThrow(CuentaBloqueadaError);
  });

  it('permite login si bloqueo expiró', async () => {
    const bloqueadoHasta = new Date(Date.now() - 5 * 60 * 1000);
    const usuarioConBloqueoExpirado = new Usuario({ ...usuarioValido, intentosFallidos: 5, bloqueadoHasta });
    vi.mocked(mockUsuarioRepository.findByTelefono).mockResolvedValue(usuarioConBloqueoExpirado);
    vi.mocked(mockHashService.verificar).mockResolvedValue(true);
    vi.mocked(mockAuthService.generarTokens).mockResolvedValue(tokensGenerados);

    const result = await useCase.execute({ telefono: '+595981234567', pin: '1234' });
    expect(result.accessToken).toBe('access-token-xyz');
  });
});
