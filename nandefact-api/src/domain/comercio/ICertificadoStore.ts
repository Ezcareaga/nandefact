/**
 * Puerto (interfaz) para almacenamiento seguro de certificados digitales CCFE.
 * La implementación debe encriptar el certificado antes de almacenarlo (AES-256).
 * Arquitectura Hexagonal — este es un puerto del dominio.
 */
export interface ICertificadoStore {
  /**
   * Guardar certificado PKCS#12 (.p12/.pfx) encriptado.
   * La implementación encripta el certificado y la contraseña antes de persistir.
   */
  guardar(comercioId: string, certificadoPkcs12: Buffer, password: string): Promise<void>;

  /**
   * Recuperar certificado desencriptado para un comercio.
   * Retorna null si el comercio no tiene certificado almacenado.
   */
  recuperar(comercioId: string): Promise<{ pkcs12: Buffer; password: string } | null>;

  /**
   * Verificar si existe un certificado almacenado para el comercio.
   */
  existe(comercioId: string): Promise<boolean>;
}
