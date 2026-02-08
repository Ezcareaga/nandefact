import bcrypt from 'bcrypt';
import type { IHashService } from '../../domain/auth/IHashService.js';

/**
 * Implementación bcrypt del servicio de hashing de PINs.
 * Usa bcrypt con salt rounds = 10 para hashear PINs de manera segura.
 *
 * bcrypt es ideal para PINs porque:
 * - Es lento por diseño (protege contra brute force)
 * - Genera salt automáticamente
 * - Es resistente a rainbow tables
 */
export class HashServiceBcrypt implements IHashService {
  private readonly saltRounds = 10;

  async hash(pin: string): Promise<string> {
    return bcrypt.hash(pin, this.saltRounds);
  }

  async verificar(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }
}
