import type { ISifenGateway, SifenResponse } from '../../domain/factura/ISifenGateway.js';
import type { SifenConfig } from './SifenConfig.js';
import type { SifenResponseObject } from 'facturacionelectronicapy-setapi';
import setApi from 'facturacionelectronicapy-setapi';
import * as fs from 'fs';

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

  /** Parsea respuesta de envío/consulta/evento */
  private parseSifenResponse(response: string | SifenResponseObject): SifenResponse {
    if (typeof response === 'string') {
      return {
        codigo: this.extractXmlValue(response, 'dCodRes') ?? '',
        mensaje: this.extractXmlValue(response, 'dMsgRes') ?? '',
        cdc: this.extractXmlValue(response, 'CDC') ?? '',
      };
    }

    return {
      codigo: response.dCodRes ?? response.codigo ?? '',
      mensaje: response.dMsgRes ?? response.mensaje ?? '',
      cdc: response.CDC ?? response.cdc ?? '',
    };
  }

  /** Parsea respuesta de consulta DE */
  private parseConsultaResponse(response: string | SifenResponseObject, cdcOriginal: string): SifenResponse {
    if (typeof response === 'string') {
      return {
        codigo: this.extractXmlValue(response, 'dCodRes') ?? '',
        mensaje: this.extractXmlValue(response, 'dMsgRes') ?? '',
        cdc: this.extractXmlValue(response, 'CDC') ?? cdcOriginal,
      };
    }

    return {
      codigo: response.dCodRes ?? response.codigo ?? '',
      mensaje: response.dMsgRes ?? response.mensaje ?? '',
      cdc: response.CDC ?? response.cdc ?? cdcOriginal,
    };
  }

  /** Parsea respuesta de evento */
  private parseEventoResponse(response: string | SifenResponseObject): SifenResponse {
    return this.parseSifenResponse(response);
  }

  /** Extrae valor de tag XML usando regex simple */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
    const match = xml.match(regex);
    return match?.[1]?.trim() ?? null;
  }
}
