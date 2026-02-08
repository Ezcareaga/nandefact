import type { IUsuarioRepository } from '../../domain/usuario/IUsuarioRepository.js';
import type { IHashService } from '../../domain/auth/IHashService.js';
import type { IAuthService } from '../../domain/auth/IAuthService.js';
import type { RolUsuario } from '../../domain/shared/types.js';
import { CredencialesInvalidasError } from '../errors/CredencialesInvalidasError.js';
import { CuentaBloqueadaError } from '../errors/CuentaBloqueadaError.js';

export interface AutenticarUsuarioInput {
  telefono: string;
  pin: string;
}

export interface AutenticarUsuarioOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  usuario: {
    id: string;
    nombre: string;
    comercioId: string;
    rol: RolUsuario;
  };
}

export class AutenticarUsuario {
  constructor(
    private readonly deps: {
      usuarioRepository: IUsuarioRepository;
      hashService: IHashService;
      authService: IAuthService;
    },
  ) {}

  async execute(input: AutenticarUsuarioInput): Promise<AutenticarUsuarioOutput> {
    if (!/^\d{4,6}$/.test(input.pin)) {
      throw new CredencialesInvalidasError();
    }

    const usuario = await this.deps.usuarioRepository.findByTelefono(input.telefono);
    if (usuario === null) {
      throw new CredencialesInvalidasError();
    }

    if (!usuario.activo) {
      throw new CredencialesInvalidasError();
    }

    if (usuario.estaBloqueado()) {
      const ahora = new Date();
      const bloqueadoHasta = usuario.bloqueadoHasta;
      if (bloqueadoHasta === null) {
        throw new Error('Estado inconsistente: usuario bloqueado pero bloqueadoHasta es null');
      }
      const minutosRestantes = Math.ceil((bloqueadoHasta.getTime() - ahora.getTime()) / (60 * 1000));
      throw new CuentaBloqueadaError(minutosRestantes);
    }

    const pinValido = await this.deps.hashService.verificar(input.pin, usuario.pinHash);
    if (!pinValido) {
      const usuarioActualizado = usuario.registrarIntentoFallido();
      await this.deps.usuarioRepository.save(usuarioActualizado);
      throw new CredencialesInvalidasError();
    }

    const usuarioLimpio = usuario.resetearIntentos();
    await this.deps.usuarioRepository.save(usuarioLimpio);

    const tokens = await this.deps.authService.generarTokens({
      usuarioId: usuarioLimpio.id,
      comercioId: usuarioLimpio.comercioId,
      rol: usuarioLimpio.rol,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      usuario: {
        id: usuarioLimpio.id,
        nombre: usuarioLimpio.nombre,
        comercioId: usuarioLimpio.comercioId,
        rol: usuarioLimpio.rol,
      },
    };
  }
}
