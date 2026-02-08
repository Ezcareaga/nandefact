/**
 * Puerto del servicio de hashing para PINs.
 * Define cómo el dominio necesita hashear y verificar PINs.
 * Implementación en infrastructure (bcrypt).
 */
export interface IHashService {
  /**
   * Hashea un PIN.
   * @param pin PIN en texto plano (4-6 dígitos)
   * @returns Hash del PIN
   */
  hash(pin: string): Promise<string>;

  /**
   * Verifica un PIN contra su hash.
   * @param pin PIN en texto plano
   * @param hash Hash almacenado
   * @returns true si el PIN es correcto, false si no
   */
  verificar(pin: string, hash: string): Promise<boolean>;
}
