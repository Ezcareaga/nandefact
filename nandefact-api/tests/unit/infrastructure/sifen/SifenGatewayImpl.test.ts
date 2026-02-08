import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SifenGatewayImpl } from '../../../../src/infrastructure/sifen/SifenGatewayImpl.js';
import { SifenConfig } from '../../../../src/infrastructure/sifen/SifenConfig.js';

// Mock del módulo facturacionelectronicapy-setapi
vi.mock('facturacionelectronicapy-setapi', () => ({
  default: {
    recibe: vi.fn(),
    consulta: vi.fn(),
    evento: vi.fn()
  }
}));

// Mock del módulo fs
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn()
  },
  readFileSync: vi.fn()
}));

import setApi from 'facturacionelectronicapy-setapi';
import * as fs from 'fs';

describe('SifenGatewayImpl', () => {
  let config: SifenConfig;
  let gateway: SifenGatewayImpl;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fs.readFileSync para simular lectura del certificado
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('fake-cert-data'));

    config = new SifenConfig({
      environment: 'test',
      certificatePath: '/path/to/cert.p12',
      certificatePassword: 'password123'
    });
    gateway = new SifenGatewayImpl(config);
  });

  describe('enviarDE', () => {
    it('debe llamar a setApi.recibe con XML firmado y entorno test', async () => {
      const mockXmlFirmado = '<DE><CDC>123</CDC><Signature>...</Signature></DE>';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEnvi>
            <dCodRes>0260</dCodRes>
            <dMsgRes>Aprobado</dMsgRes>
          </rRetEnvi>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.recibe).mockResolvedValue(mockResponse);

      await gateway.enviarDE(mockXmlFirmado);

      expect(setApi.recibe).toHaveBeenCalledWith(
        1,
        mockXmlFirmado,
        'test',
        expect.any(Buffer),
        'password123'
      );
    });

    it('debe parsear respuesta aprobada (0260)', async () => {
      const mockXmlFirmado = '<DE><CDC>123</CDC></DE>';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEnvi>
            <dCodRes>0260</dCodRes>
            <dMsgRes>Aprobado</dMsgRes>
            <xContenDE><CDC>01800695631001003000013712022010619364760029</CDC></xContenDE>
          </rRetEnvi>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.recibe).mockResolvedValue(mockResponse);

      const resultado = await gateway.enviarDE(mockXmlFirmado);

      expect(resultado.codigo).toBe('0260');
      expect(resultado.mensaje).toBe('Aprobado');
      expect(resultado.cdc).toBe('01800695631001003000013712022010619364760029');
    });

    it('debe parsear respuesta rechazada (0300)', async () => {
      const mockXmlFirmado = '<DE><CDC>123</CDC></DE>';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEnvi>
            <dCodRes>0300</dCodRes>
            <dMsgRes>Documento rechazado: XML inválido</dMsgRes>
            <xContenDE><CDC>01800695631001003000013712022010619364760029</CDC></xContenDE>
          </rRetEnvi>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.recibe).mockResolvedValue(mockResponse);

      const resultado = await gateway.enviarDE(mockXmlFirmado);

      expect(resultado.codigo).toBe('0300');
      expect(resultado.mensaje).toBe('Documento rechazado: XML inválido');
    });

    it('debe parsear aprobada con observación (0261)', async () => {
      const mockXmlFirmado = '<DE><CDC>123</CDC></DE>';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEnvi>
            <dCodRes>0261</dCodRes>
            <dMsgRes>Aprobado con observación</dMsgRes>
            <xContenDE><CDC>01800695631001003000013712022010619364760029</CDC></xContenDE>
          </rRetEnvi>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.recibe).mockResolvedValue(mockResponse);

      const resultado = await gateway.enviarDE(mockXmlFirmado);

      expect(resultado.codigo).toBe('0261');
      expect(resultado.mensaje).toBe('Aprobado con observación');
    });

    it('debe propagar error de red', async () => {
      const mockXmlFirmado = '<DE><CDC>123</CDC></DE>';
      const mockError = new Error('ECONNREFUSED');

      vi.mocked(setApi.recibe).mockRejectedValue(mockError);

      await expect(gateway.enviarDE(mockXmlFirmado)).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('consultarEstado', () => {
    it('debe llamar a setApi.consulta con CDC y entorno', async () => {
      const mockCdc = '01800695631001003000013712022010619364760029';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetConsResProcDe>
            <dCodRes>0260</dCodRes>
            <dMsgRes>Aprobado</dMsgRes>
          </rRetConsResProcDe>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.consulta).mockResolvedValue(mockResponse);

      await gateway.consultarEstado(mockCdc);

      expect(setApi.consulta).toHaveBeenCalledWith(
        1,
        mockCdc,
        'test',
        expect.any(Buffer),
        'password123'
      );
    });

    it('debe retornar estado del DE', async () => {
      const mockCdc = '01800695631001003000013712022010619364760029';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetConsResProcDe>
            <dCodRes>0260</dCodRes>
            <dMsgRes>Aprobado</dMsgRes>
            <CDC>01800695631001003000013712022010619364760029</CDC>
          </rRetConsResProcDe>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.consulta).mockResolvedValue(mockResponse);

      const resultado = await gateway.consultarEstado(mockCdc);

      expect(resultado.codigo).toBe('0260');
      expect(resultado.mensaje).toBe('Aprobado');
      expect(resultado.cdc).toBe('01800695631001003000013712022010619364760029');
    });

    it('debe manejar DE no encontrado', async () => {
      const mockCdc = '01800695631001003000013712022010619364760029';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetConsResProcDe>
            <dCodRes>0404</dCodRes>
            <dMsgRes>DE no encontrado</dMsgRes>
          </rRetConsResProcDe>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.consulta).mockResolvedValue(mockResponse);

      const resultado = await gateway.consultarEstado(mockCdc);

      expect(resultado.codigo).toBe('0404');
      expect(resultado.mensaje).toBe('DE no encontrado');
    });
  });

  describe('anularDE', () => {
    it('debe llamar a setApi.evento', async () => {
      const mockCdc = '01800695631001003000013712022010619364760029';
      const mockMotivo = 'Venta no concretada';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEve>
            <dCodRes>0700</dCodRes>
            <dMsgRes>Evento registrado</dMsgRes>
          </rRetEve>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.evento).mockResolvedValue(mockResponse);

      await gateway.anularDE(mockCdc, mockMotivo);

      expect(setApi.evento).toHaveBeenCalledWith(
        1,
        expect.stringContaining(mockCdc),
        'test',
        expect.any(Buffer),
        'password123'
      );
      expect(setApi.evento).toHaveBeenCalledWith(
        1,
        expect.stringContaining(mockMotivo),
        'test',
        expect.any(Buffer),
        'password123'
      );
    });

    it('debe retornar cancelación exitosa', async () => {
      const mockCdc = '01800695631001003000013712022010619364760029';
      const mockMotivo = 'Venta no concretada';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEve>
            <dCodRes>0700</dCodRes>
            <dMsgRes>Evento registrado</dMsgRes>
            <CDC>01800695631001003000013712022010619364760029</CDC>
          </rRetEve>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.evento).mockResolvedValue(mockResponse);

      const resultado = await gateway.anularDE(mockCdc, mockMotivo);

      expect(resultado.codigo).toBe('0700');
      expect(resultado.mensaje).toBe('Evento registrado');
    });

    it('debe retornar cancelación fallida', async () => {
      const mockCdc = '01800695631001003000013712022010619364760029';
      const mockMotivo = 'Venta no concretada';
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEve>
            <dCodRes>0702</dCodRes>
            <dMsgRes>Error: DE ya cancelado previamente</dMsgRes>
          </rRetEve>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.evento).mockResolvedValue(mockResponse);

      const resultado = await gateway.anularDE(mockCdc, mockMotivo);

      expect(resultado.codigo).toBe('0702');
      expect(resultado.mensaje).toBe('Error: DE ya cancelado previamente');
    });
  });
});
