import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { ICertificadoStore } from '../../domain/comercio/ICertificadoStore.js';
import { ComercioNoEncontradoError } from '../errors/ComercioNoEncontradoError.js';
import { ApplicationError } from '../errors/ApplicationError.js';

/** Input DTO para cargar un certificado CCFE */
export interface CargarCertificadoInput {
  comercioId: string;
  certificadoPkcs12: Buffer;
  password: string;
}

/** Caso de uso — Cargar certificado digital CCFE para un comercio */
export class CargarCertificado {
  constructor(
    private readonly deps: {
      comercioRepository: IComercioRepository;
      certificadoStore: ICertificadoStore;
    },
  ) {}

  async execute(input: CargarCertificadoInput): Promise<void> {
    // 1. Verificar que el comercio existe
    const comercio = await this.deps.comercioRepository.findById(input.comercioId);
    if (!comercio) {
      throw new ComercioNoEncontradoError(input.comercioId);
    }

    // 2. Validar que el certificado no esté vacío
    if (input.certificadoPkcs12.length === 0) {
      throw new ApplicationError('El certificado no puede estar vacío');
    }

    // 3. Validar que la contraseña no esté vacía
    if (!input.password || input.password.trim().length === 0) {
      throw new ApplicationError('La contraseña del certificado no puede estar vacía');
    }

    // 4. Guardar certificado encriptado
    await this.deps.certificadoStore.guardar(input.comercioId, input.certificadoPkcs12, input.password);
  }
}
