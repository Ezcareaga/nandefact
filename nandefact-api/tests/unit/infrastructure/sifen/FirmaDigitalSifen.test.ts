import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirmaDigitalSifen } from '../../../../src/infrastructure/sifen/FirmaDigitalSifen.js';
import { SifenConfig } from '../../../../src/infrastructure/sifen/SifenConfig.js';

// Mock del módulo facturacionelectronicapy-xmlsign
vi.mock('facturacionelectronicapy-xmlsign', () => ({
  default: {
    signXML: vi.fn()
  }
}));

import xmlsign from 'facturacionelectronicapy-xmlsign';

describe('FirmaDigitalSifen', () => {
  let config: SifenConfig;
  let firmaDigital: FirmaDigitalSifen;

  beforeEach(() => {
    vi.clearAllMocks();
    config = new SifenConfig({
      environment: 'test',
      certificatePath: '/path/to/cert.p12',
      certificatePassword: 'password123'
    });
    firmaDigital = new FirmaDigitalSifen(config);
  });

  describe('firmar', () => {
    it('debe llamar a xmlsign con XML, ruta certificado y password', async () => {
      const mockXml = '<DE><CDC>123</CDC></DE>';
      const mockXmlFirmado = '<DE><CDC>123</CDC><Signature>...</Signature></DE>';

      vi.mocked(xmlsign.signXML).mockResolvedValue(mockXmlFirmado);

      await firmaDigital.firmar(mockXml);

      expect(xmlsign.signXML).toHaveBeenCalledWith(
        mockXml,
        '/path/to/cert.p12',
        'password123'
      );
    });

    it('debe retornar XML firmado', async () => {
      const mockXml = '<DE><CDC>123</CDC></DE>';
      const mockXmlFirmado = '<DE><CDC>123</CDC><Signature>...</Signature></DE>';

      vi.mocked(xmlsign.signXML).mockResolvedValue(mockXmlFirmado);

      const resultado = await firmaDigital.firmar(mockXml);

      expect(resultado).toBe(mockXmlFirmado);
    });

    it('debe propagar error si firma falla', async () => {
      const mockXml = '<DE><CDC>123</CDC></DE>';
      const mockError = new Error('Certificado inválido');

      vi.mocked(xmlsign.signXML).mockRejectedValue(mockError);

      await expect(firmaDigital.firmar(mockXml)).rejects.toThrow('Certificado inválido');
    });

    it('debe usar certificatePath y certificatePassword de SifenConfig', async () => {
      const customConfig = new SifenConfig({
        environment: 'prod',
        certificatePath: '/prod/cert.p12',
        certificatePassword: 'prodpass'
      });
      const customFirma = new FirmaDigitalSifen(customConfig);
      const mockXml = '<DE><CDC>456</CDC></DE>';
      const mockXmlFirmado = '<DE><CDC>456</CDC><Signature>...</Signature></DE>';

      vi.mocked(xmlsign.signXML).mockResolvedValue(mockXmlFirmado);

      await customFirma.firmar(mockXml);

      expect(xmlsign.signXML).toHaveBeenCalledWith(
        mockXml,
        '/prod/cert.p12',
        'prodpass'
      );
    });
  });
});
