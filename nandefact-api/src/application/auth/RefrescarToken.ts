import type { IAuthService } from '../../domain/auth/IAuthService.js';
import type { IUsuarioRepository } from '../../domain/usuario/IUsuarioRepository.js';
import { CredencialesInvalidasError } from '../errors/CredencialesInvalidasError.js';

export interface RefrescarTokenInput {
  refreshToken: string;
}

export interface RefrescarTokenOutput {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RefrescarToken {
  constructor(
    private readonly deps: {
      authService: IAuthService;
      usuarioRepository: IUsuarioRepository;
    },
  ) {}

  async execute(input: RefrescarTokenInput): Promise<RefrescarTokenOutput> {
    const payload = await this.deps.authService.verificarRefreshToken(input.refreshToken);

    const usuario = await this.deps.usuarioRepository.findById(payload.usuarioId);
    if (usuario === null) {
      throw new CredencialesInvalidasError();
    }

    if (!usuario.activo) {
      throw new CredencialesInvalidasError();
    }

    const tokens = await this.deps.authService.generarTokens({
      usuarioId: payload.usuarioId,
      comercioId: payload.comercioId,
      rol: payload.rol,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}
