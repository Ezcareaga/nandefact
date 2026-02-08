import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QrGeneratorSifen } from '../../../../src/infrastructure/kude/QrGeneratorSifen.js';

// Mock del módulo facturacionelectronicapy-qrgen
vi.mock('facturacionelectronicapy-qrgen', () => ({
  default: {
    generateQR: vi.fn()
  }
}));

import qrgen from 'facturacionelectronicapy-qrgen';

describe('QrGeneratorSifen', () => {
  let generator: QrGeneratorSifen;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new QrGeneratorSifen();
  });

  describe('generarQr', () => {
    it('debe llamar a qrgen.generateQR con los parámetros correctos para test', async () => {
      const mockXmlFirmado = '<rDE><DE><dId>01800695631001003000013712022010619364760029</dId></DE></rDE>';
      const mockXmlConQr = '<rDE><DE><dQRCode>https://ekuatia.set.gov.py/consultas/qr?...</dQRCode></DE></rDE>';

      vi.mocked(qrgen.generateQR).mockResolvedValue(mockXmlConQr);

      const result = await generator.generarQr({
        xmlFirmado: mockXmlFirmado,
        cscId: 'ABC001',
        csc: '12345678901234567890123456789012',
        environment: 'test'
      });

      expect(qrgen.generateQR).toHaveBeenCalledWith(
        mockXmlFirmado,
        'ABC001',
        '12345678901234567890123456789012',
        90  // 90 = test environment
      );
      expect(result).toBe(mockXmlConQr);
    });

    it('debe llamar a qrgen.generateQR con environment=production (91)', async () => {
      const mockXmlFirmado = '<rDE><DE><dId>01800695631001003000013712022010619364760029</dId></DE></rDE>';
      const mockXmlConQr = '<rDE><DE><dQRCode>https://ekuatia.set.gov.py/consultas/qr?...</dQRCode></DE></rDE>';

      vi.mocked(qrgen.generateQR).mockResolvedValue(mockXmlConQr);

      await generator.generarQr({
        xmlFirmado: mockXmlFirmado,
        cscId: 'ABC001',
        csc: '12345678901234567890123456789012',
        environment: 'production'
      });

      expect(qrgen.generateQR).toHaveBeenCalledWith(
        mockXmlFirmado,
        'ABC001',
        '12345678901234567890123456789012',
        91  // 91 = production environment
      );
    });

    it('debe incluir CDC y CSC en la generación del QR', async () => {
      const cdc = '01800695631001003000013712022010619364760029';
      const csc = 'ABCD1234EFGH5678IJKL9012MNOP3456';
      const cscId = 'CSC001';

      const mockXmlFirmado = `<rDE><DE><dId>${cdc}</dId></DE></rDE>`;
      const mockXmlConQr = `<rDE><DE><dQRCode>https://ekuatia.set.gov.py/consultas/qr?Id=${cdc}&amp;cHashQR=abc123</dQRCode></DE></rDE>`;

      vi.mocked(qrgen.generateQR).mockResolvedValue(mockXmlConQr);

      const result = await generator.generarQr({
        xmlFirmado: mockXmlFirmado,
        cscId,
        csc,
        environment: 'test'
      });

      // Verificar que se llamó con el CSC correcto
      expect(qrgen.generateQR).toHaveBeenCalledWith(
        expect.stringContaining(cdc),
        cscId,
        csc,
        90
      );

      expect(result).toContain(cdc);
    });
  });

  describe('extractQrUrl', () => {
    it('debe extraer la URL del QR del campo dQRCode', () => {
      const qrUrl = 'https://ekuatia.set.gov.py/consultas/qr?nVersion=150&Id=01800695631001003000013712022010619364760029';
      const xmlConQr = `<rDE><DE><dQRCode>${qrUrl}</dQRCode></DE></rDE>`;

      const result = generator.extractQrUrl(xmlConQr);

      expect(result).toBe(qrUrl);
    });

    it('debe lanzar error si no encuentra el campo dQRCode', () => {
      const xmlSinQr = '<rDE><DE><dId>123</dId></DE></rDE>';

      expect(() => generator.extractQrUrl(xmlSinQr)).toThrow('No se encontró el campo dQRCode');
    });

    it('debe extraer URL con caracteres escapados correctamente', () => {
      const qrUrl = 'https://ekuatia.set.gov.py/consultas/qr?Id=123&amp;hash=abc';
      const xmlConQr = `<rDE><DE><dQRCode>${qrUrl}</dQRCode></DE></rDE>`;

      const result = generator.extractQrUrl(xmlConQr);

      expect(result).toBe(qrUrl);
    });
  });
});
