/** Error cuando el XML no contiene el campo QR esperado */
class QrCodeNoEncontradoError extends Error {
  constructor() {
    super('No se encontró el campo dQRCode (AA002) en el XML');
    this.name = this.constructor.name;
  }
}

/**
 * Adaptador — Genera código QR para SIFEN siguiendo spec e-Kuatia.
 * Usa facturacionelectronicapy-qrgen (TIPS-SA) para generar el QR con hash CDC+CSC.
 */
export class QrGeneratorSifen {
  /**
   * Genera el código QR para verificación en e-Kuatia.
   * URL: https://ekuatia.set.gov.py/consultas/qr?nVersion=150&Id={CDC}&...
   *
   * El QR incluye hash del CDC + CSC para validación.
   *
   * @param params - Datos de la factura para el QR
   * @returns QR data (XML string con campo AA002 listo para insertar en DE)
   */
  async generarQr(params: {
    xmlFirmado: string;  // XML completo firmado del DE
    cscId: string;       // ID del CSC del comercio
    csc: string;         // Código de Seguridad del Contribuyente (32 chars)
    environment: 'test' | 'production';
  }): Promise<string> {
    // qrgen toma el XML firmado y genera el campo AA002 (QR) para insertarlo en el XML
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const qrgenModule = await import('facturacionelectronicapy-qrgen') as any;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const xmlConQr = await qrgenModule.default.generateQR(
      params.xmlFirmado,
      params.cscId,
      params.csc,
      params.environment === 'test' ? 90 : 91  // 90=test, 91=prod
    ) as string;

    return xmlConQr;
  }

  /**
   * Extrae la URL del QR del XML que contiene el campo AA002.
   * Para generar imagen QR o mostrar en el PDF.
   */
  extractQrUrl(xmlConQr: string): string {
    // El campo AA002 contiene la URL completa del QR
    const match = xmlConQr.match(/<dQRCode>(.*?)<\/dQRCode>/);
    if (!match || !match[1]) {
      throw new QrCodeNoEncontradoError();
    }
    return match[1];
  }
}
