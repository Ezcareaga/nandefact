import type { Comercio } from './Comercio.js';

/**
 * Puerto (interfaz) del repositorio de comercios.
 * La capa de dominio define qué necesita, la capa de infraestructura implementa cómo.
 * Arquitectura Hexagonal — este es un puerto del dominio.
 */
export interface IComercioRepository {
  /** Buscar comercio por ID. Retorna null si no existe. */
  findById(id: string): Promise<Comercio | null>;

  /** Buscar comercio por RUC. Retorna null si no existe. */
  findByRuc(ruc: string): Promise<Comercio | null>;

  /** Guardar comercio (crear o actualizar). */
  save(comercio: Comercio): Promise<void>;
}
