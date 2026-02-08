import { ISifenGateway, SifenResponse } from '../../domain/factura/ISifenGateway.js';
import { SifenConfig } from './SifenConfig.js';
import setApiModule from 'facturacionelectronicapy-setapi';
import * as fs from 'fs';

// Type assertion para módulo CommonJS con definiciones incorrectas
const setApi = setApiModule as any;

/** Implementación gateway SIFEN usando TIPS-SA setapi */
export class SifenGatewayImpl implements ISifenGateway {
  constructor(private readonly config: SifenConfig) {}

  async enviarDE(xmlFirmado: string): Promise<SifenResponse> {
    const cert = fs.readFileSync(this.config.getCertificatePath());
    const env = this.config.isTest() ? 'test' : 'prod';

    const response = await setApi.recibe(
      1, // id default
      xmlFirmado,
      env,
      cert,
      this.config.getCertificatePassword()
    );

    return this.parseSifenResponse(response);
  }

  async consultarEstado(cdc: string): Promise<SifenResponse> {
    const cert = fs.readFileSync(this.config.getCertificatePath());
    const env = this.config.isTest() ? 'test' : 'prod';

    const response = await setApi.consulta(
      1, // id default
      cdc,
      env,
      cert,
      this.config.getCertificatePassword()
    );

    return this.parseConsultaResponse(response, cdc);
  }

  async anularDE(cdc: string, motivo: string): Promise<SifenResponse> {
    const cert = fs.readFileSync(this.config.getCertificatePath());
    const env = this.config.isTest() ? 'test' : 'prod';

    // Construir XML de evento de cancelación (simplificado)
    const xmlEvento = `<rEnvEvento>
      <Id>${cdc}</Id>
      <mOtEve>${motivo}</mOtEve>
    </rEnvEvento>`;

    const response = await setApi.evento(
      1, // id default
      xmlEvento,
      env,
      cert,
      this.config.getCertificatePassword()
    );

    return this.parseEventoResponse(response);
  }

  /** Parsea respuesta de envío DE */
  private parseSifenResponse(response: any): SifenResponse {
    // La respuesta puede ser string XML o un objeto ya parseado
    let codigo = '';
    let mensaje = '';
    let cdc = '';

    if (typeof response === 'string') {
      // Parsear XML string
      codigo = this.extractXmlValue(response, 'dCodRes') || '';
      mensaje = this.extractXmlValue(response, 'dMsgRes') || '';
      cdc = this.extractXmlValue(response, 'CDC') || '';
    } else {
      // Ya es un objeto
      codigo = response.dCodRes || response.codigo || '';
      mensaje = response.dMsgRes || response.mensaje || '';
      cdc = response.CDC || response.cdc || '';
    }

    return { codigo, mensaje, cdc };
  }

  /** Parsea respuesta de consulta DE */
  private parseConsultaResponse(response: any, cdcOriginal: string): SifenResponse {
    let codigo = '';
    let mensaje = '';
    let cdc = cdcOriginal;

    if (typeof response === 'string') {
      codigo = this.extractXmlValue(response, 'dCodRes') || '';
      mensaje = this.extractXmlValue(response, 'dMsgRes') || '';
      const cdcFromResponse = this.extractXmlValue(response, 'CDC');
      if (cdcFromResponse) cdc = cdcFromResponse;
    } else {
      codigo = response.dCodRes || response.codigo || '';
      mensaje = response.dMsgRes || response.mensaje || '';
      if (response.CDC || response.cdc) {
        cdc = response.CDC || response.cdc;
      }
    }

    return { codigo, mensaje, cdc };
  }

  /** Parsea respuesta de evento */
  private parseEventoResponse(response: any): SifenResponse {
    let codigo = '';
    let mensaje = '';
    let cdc = '';

    if (typeof response === 'string') {
      codigo = this.extractXmlValue(response, 'dCodRes') || '';
      mensaje = this.extractXmlValue(response, 'dMsgRes') || '';
      cdc = this.extractXmlValue(response, 'CDC') || '';
    } else {
      codigo = response.dCodRes || response.codigo || '';
      mensaje = response.dMsgRes || response.mensaje || '';
      cdc = response.CDC || response.cdc || '';
    }

    return { codigo, mensaje, cdc };
  }

  /** Extrae valor de tag XML usando regex simple */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match && match[1] ? match[1].trim() : null;
  }
}
