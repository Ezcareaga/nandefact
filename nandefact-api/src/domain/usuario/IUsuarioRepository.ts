import type { Usuario } from './Usuario.js';

/**
 * Puerto del repositorio de usuarios.
 * Define cómo el dominio necesita persistir y recuperar usuarios.
 * Implementación en infrastructure/persistence.
 */
export interface IUsuarioRepository {
  /**
   * Guarda un usuario (create o update).
   */
  save(usuario: Usuario): Promise<void>;

  /**
   * Busca un usuario por ID.
   * @returns Usuario o null si no existe
   */
  findById(id: string): Promise<Usuario | null>;

  /**
   * Busca un usuario por teléfono.
   * @returns Usuario o null si no existe
   */
  findByTelefono(telefono: string): Promise<Usuario | null>;
}
