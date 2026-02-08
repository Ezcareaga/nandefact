import type { Cliente } from './Cliente.js';

/**
 * Puerto (interfaz) del repositorio de clientes.
 * La capa de dominio define qué necesita, la capa de infraestructura implementa cómo.
 * Arquitectura Hexagonal — este es un puerto del dominio.
 */
export interface IClienteRepository {
  /** Guardar cliente (crear o actualizar). */
  save(cliente: Cliente): Promise<void>;

  /** Buscar cliente por ID. Retorna null si no existe. */
  findById(id: string): Promise<Cliente | null>;

  /** Buscar todos los clientes de un comercio. */
  findByComercio(comercioId: string): Promise<Cliente[]>;

  /** Buscar clientes por nombre/RUC/CI (autocompletado). */
  buscar(comercioId: string, query: string): Promise<Cliente[]>;
}
