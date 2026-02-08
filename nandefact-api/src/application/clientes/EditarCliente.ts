import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import type { TipoDocumentoIdentidad } from '../../domain/shared/types.js';
import { ClienteNoEncontradoError } from '../errors/ClienteNoEncontradoError.js';

export interface EditarClienteInput {
  clienteId: string;
  cambios: Partial<{
    nombre: string;
    rucCi: string;
    tipoDocumento: TipoDocumentoIdentidad;
    telefono: string;
    email: string;
    direccion: string;
    frecuente: boolean;
    enviarWhatsApp: boolean;
  }>;
}

/**
 * Caso de Uso — Editar Cliente
 *
 * Flow:
 * 1. Cargar cliente existente
 * 2. Aplicar cambios usando método inmutable actualizar()
 * 3. Guardar cliente actualizado
 */
export class EditarCliente {
  constructor(
    private readonly deps: {
      clienteRepository: IClienteRepository;
    }
  ) {}

  async execute(input: EditarClienteInput): Promise<void> {
    // 1. Cargar cliente
    const cliente = await this.deps.clienteRepository.findById(input.clienteId);
    if (!cliente) {
      throw new ClienteNoEncontradoError(input.clienteId);
    }

    // 2. Aplicar cambios (re-valida invariantes)
    const clienteActualizado = cliente.actualizar(input.cambios);

    // 3. Guardar
    await this.deps.clienteRepository.save(clienteActualizado);
  }
}
