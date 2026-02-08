import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SifenGatewayImpl } from '../../../../src/infrastructure/sifen/SifenGatewayImpl.js';
import { SifenConfig } from '../../../../src/infrastructure/sifen/SifenConfig.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';

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
  const timbrado = new Timbrado('12558946', new Date('2024-01-01'), new Date('2025-12-31'));
  const ruc = new RUC('80069563-1');

  let config: SifenConfig;
  let gateway: SifenGatewayImpl;
  let mockComercio: Comercio;

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

    // Crear mock comercio para tests de eventos
    mockComercio = new Comercio({
      id: '660e8400-e29b-41d4-a716-446655440000',
      ruc,
      razonSocial: 'Comercio Test S.A.',
      nombreFantasia: 'Test Store',
      timbrado,
      establecimiento: '001',
      puntoExpedicion: '003',
      tipoContribuyente: 1,
    });
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
    it('debe llamar a setApi.evento con XML generado', async () => {
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

      await gateway.anularDE(mockComercio, mockCdc, mockMotivo);

      expect(setApi.evento).toHaveBeenCalledWith(
        1,
        expect.any(String), // XML generado por xmlgen
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
      

      const resultado = await gateway.anularDE(mockComercio, mockCdc, mockMotivo);

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
      

      const resultado = await gateway.anularDE(mockComercio, mockCdc, mockMotivo);

      expect(resultado.codigo).toBe('0702');
      expect(resultado.mensaje).toBe('Error: DE ya cancelado previamente');
    });
  });

  describe('inutilizarNumeracion', () => {
    it('debe llamar a setApi.evento con XML de inutilización', async () => {
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEve>
            <dCodRes>0260</dCodRes>
            <dMsgRes>Inutilización aceptada</dMsgRes>
          </rRetEve>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.evento).mockResolvedValue(mockResponse);
      

      await gateway.inutilizarNumeracion(mockComercio, '001', '003', 100, 105, 'Formularios dañados');

      expect(setApi.evento).toHaveBeenCalledWith(
        1,
        expect.any(String), // XML generado por xmlgen
        'test',
        expect.any(Buffer),
        'password123'
      );
    });

    it('debe retornar inutilización exitosa', async () => {
      const mockResponse = `<env:Envelope>
        <env:Body>
          <rRetEve>
            <dCodRes>0260</dCodRes>
            <dMsgRes>Inutilización aceptada</dMsgRes>
          </rRetEve>
        </env:Body>
      </env:Envelope>`;

      vi.mocked(setApi.evento).mockResolvedValue(mockResponse);
      

      const resultado = await gateway.inutilizarNumeracion(mockComercio, '001', '003', 100, 105, 'Formularios dañados durante transporte');

      expect(resultado.codigo).toBe('0260');
      expect(resultado.mensaje).toBe('Inutilización aceptada');
    });
  });
});
