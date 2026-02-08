import type { PrismaClient } from '@prisma/client';
import type { ICertificadoStore } from '../../domain/comercio/ICertificadoStore.js';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Implementación PostgreSQL del almacenamiento seguro de certificados CCFE.
 * Encripta certificados con AES-256-GCM antes de persistir.
 * La clave de encriptación se obtiene de la variable de entorno CCFE_ENCRYPTION_KEY.
 */
export class CertificadoStorePg implements ICertificadoStore {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private readonly prisma: PrismaClient) {
    const keyEnv = process.env.CCFE_ENCRYPTION_KEY;
    if (!keyEnv) {
      throw new Error('CCFE_ENCRYPTION_KEY environment variable is required');
    }

    // La clave debe ser 32 bytes (256 bits)
    // Si es hex string, convertir a Buffer
    this.encryptionKey = Buffer.from(keyEnv, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error('CCFE_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  async guardar(comercioId: string, certificadoPkcs12: Buffer, password: string): Promise<void> {
    const certificadoEncriptado = this.encrypt(certificadoPkcs12);
    const passwordEncriptada = this.encrypt(Buffer.from(password, 'utf-8'));

    await this.prisma.comercio.update({
      where: { id: comercioId },
      data: {
        ccfeCertificado: Uint8Array.from(certificadoEncriptado),
        ccfeClave: Uint8Array.from(passwordEncriptada),
      },
    });
  }

  async recuperar(comercioId: string): Promise<{ pkcs12: Buffer; password: string } | null> {
    const row = await this.prisma.comercio.findUnique({
      where: { id: comercioId },
      select: {
        ccfeCertificado: true,
        ccfeClave: true,
      },
    });

    if (!row || !row.ccfeCertificado || !row.ccfeClave) {
      return null;
    }

    const pkcs12 = this.decrypt(Buffer.from(row.ccfeCertificado));
    const passwordBuffer = this.decrypt(Buffer.from(row.ccfeClave));
    const password = passwordBuffer.toString('utf-8');

    return { pkcs12, password };
  }

  async existe(comercioId: string): Promise<boolean> {
    const row = await this.prisma.comercio.findUnique({
      where: { id: comercioId },
      select: { ccfeCertificado: true },
    });

    return !!(row && row.ccfeCertificado);
  }

  // --- Encriptación AES-256-GCM ---

  /**
   * Encripta datos con AES-256-GCM.
   * Retorna: iv (16 bytes) + authTag (16 bytes) + ciphertext
   */
  private encrypt(plaintext: Buffer): Buffer {
    const iv = randomBytes(16); // Initialization vector aleatorio
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Concatenar iv + authTag + ciphertext
    return Buffer.concat([iv, authTag, ciphertext]);
  }

  /**
   * Desencripta datos con AES-256-GCM.
   * Espera: iv (16 bytes) + authTag (16 bytes) + ciphertext
   */
  private decrypt(encrypted: Buffer): Buffer {
    const iv = encrypted.subarray(0, 16);
    const authTag = encrypted.subarray(16, 32);
    const ciphertext = encrypted.subarray(32);

    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}
