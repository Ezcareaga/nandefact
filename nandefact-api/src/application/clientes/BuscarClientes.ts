import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import type { TipoDocumentoIdentidad } from '../../domain/shared/types.js';

export interface BuscarClientesInput {
  comercioId: string;
  query: string;
}

export interface BuscarClientesOutput {
  clientes: Array<{
    id: string;
    nombre: string;
    rucCi: string;
    tipoDocumento: TipoDocumentoIdentidad;
    telefono: string | null;
  }>;
}

/**
 * Caso de Uso — Buscar Clientes (autocompletado)
 *
 * Flow:
 * 1. Validar longitud mínima query (2 caracteres)
 * 2. Buscar en repositorio por nombre/RUC/CI
 * 3. Mapear a DTOs para respuesta
 */
export class BuscarClientes {
  constructor(
    private readonly deps: {
      clienteRepository: IClienteRepository;
    }
  ) {}

  async execute(input: BuscarClientesInput): Promise<BuscarClientesOutput> {
    // 1. Validar query mínimo 2 caracteres (previene full-table scan)
    if (input.query.trim().length < 2) {
      throw new Error('La búsqueda requiere al menos 2 caracteres');
    }

    // 2. Buscar clientes
    const clientes = await this.deps.clienteRepository.buscar(input.comercioId, input.query);

    // 3. Mapear a DTOs
    return {
      clientes: clientes.map(c => ({
        id: c.id,
        nombre: c.nombre,
        rucCi: c.rucCi,
        tipoDocumento: c.tipoDocumento,
        telefono: c.telefono
      }))
    };
  }
}
