import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import { Timbrado } from '../../domain/comercio/Timbrado.js';
import { ComercioNoEncontradoError } from '../errors/ComercioNoEncontradoError.js';

/** Input DTO para configurar timbrado */
export interface ConfigurarTimbradoInput {
  comercioId: string;
  timbradoNumero: string;
  fechaInicio: Date;
  fechaFin: Date;
}

/** Caso de uso — Configurar timbrado activo de un comercio */
export class ConfigurarTimbrado {
  constructor(
    private readonly deps: {
      comercioRepository: IComercioRepository;
    },
  ) {}

  async execute(input: ConfigurarTimbradoInput): Promise<void> {
    // 1. Cargar comercio
    const comercio = await this.deps.comercioRepository.findById(input.comercioId);
    if (!comercio) {
      throw new ComercioNoEncontradoError(input.comercioId);
    }

    // 2. Crear nuevo Timbrado (domain valida formato y rango fechas)
    const nuevoTimbrado = new Timbrado(input.timbradoNumero, input.fechaInicio, input.fechaFin);

    // 3. Actualizar timbrado en comercio (domain valida vigencia)
    const comercioActualizado = comercio.actualizarTimbrado(nuevoTimbrado);

    // 4. Guardar comercio actualizado
    await this.deps.comercioRepository.save(comercioActualizado);
  }
}
