import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { TipoDocumentoIdentidad } from '../../domain/shared/types.js';
import { Cliente } from '../../domain/cliente/Cliente.js';
import { RUC } from '../../domain/comercio/RUC.js';
import { ComercioNoEncontradoError } from '../errors/ComercioNoEncontradoError.js';
import { randomUUID } from 'node:crypto';

export interface CrearClienteInput {
  comercioId: string;
  nombre: string;
  rucCi: string;
  tipoDocumento: TipoDocumentoIdentidad;
  telefono?: string;
  email?: string;
  direccion?: string;
  frecuente?: boolean;
  enviarWhatsApp?: boolean;
}

export interface CrearClienteOutput {
  clienteId: string;
}

/**
 * Caso de Uso — Crear Cliente
 *
 * Flow:
 * 1. Validar que comercio existe
 * 2. Si tipoDocumento es 'RUC', validar formato usando value object RUC
 * 3. Generar UUID
 * 4. Crear entidad Cliente (valida invariantes)
 * 5. Guardar en repositorio
 * 6. Retornar ID del cliente creado
 */
export class CrearCliente {
  constructor(
    private readonly deps: {
      clienteRepository: IClienteRepository;
      comercioRepository: IComercioRepository;
    }
  ) {}

  async execute(input: CrearClienteInput): Promise<CrearClienteOutput> {
    // 1. Validar comercio existe
    const comercio = await this.deps.comercioRepository.findById(input.comercioId);
    if (!comercio) {
      throw new ComercioNoEncontradoError(input.comercioId);
    }

    // 2. Si es RUC, validar formato (propaga RUCInvalidoError del dominio)
    if (input.tipoDocumento === 'RUC') {
      new RUC(input.rucCi);
    }

    // 3. Generar UUID
    const clienteId = randomUUID();

    // 4. Crear entidad Cliente (valida invariantes)
    const cliente = new Cliente({
      id: clienteId,
      comercioId: input.comercioId,
      nombre: input.nombre,
      rucCi: input.rucCi,
      tipoDocumento: input.tipoDocumento,
      telefono: input.telefono,
      email: input.email,
      direccion: input.direccion,
      frecuente: input.frecuente,
      enviarWhatsApp: input.enviarWhatsApp
    });

    // 5. Guardar
    await this.deps.clienteRepository.save(cliente);

    // 6. Retornar ID
    return { clienteId };
  }
}
