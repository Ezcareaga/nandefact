import type { ISifenGateway, SifenResponse } from '../../domain/factura/ISifenGateway.js';
import type { Comercio } from '../../domain/comercio/Comercio.js';
import type { SifenConfig } from './SifenConfig.js';
import type { SifenResponseObject } from 'facturacionelectronicapy-setapi';
import { XmlGeneratorSifen } from './XmlGeneratorSifen.js';
import { SifenNoImplementadoError } from './SifenNoImplementadoError.js';
import setApi from 'facturacionelectronicapy-setapi';
import * as fs from 'node:fs';

/** Implementación gateway SIFEN usando TIPS-SA setapi */
export class SifenGatewayImpl implements ISifenGateway {
  private readonly xmlGenerator: XmlGeneratorSifen;

  constructor(private readonly config: SifenConfig) {
    this.xmlGenerator = new XmlGeneratorSifen();
  }

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

  async anularDE(comercio: Comercio, cdc: string, motivo: string): Promise<SifenResponse> {
    const cert = fs.readFileSync(this.config.getCertificatePath());
    const env = this.config.isTest() ? 'test' : 'prod';

    // Generar XML de evento de cancelación usando xmlgen
    const xmlEvento = await this.xmlGenerator.generarXmlEventoCancelacion(comercio, cdc, motivo);

    const response = await setApi.evento(
      1, // id default
      xmlEvento,
      env,
      cert,
      this.config.getCertificatePassword()
    );

    return this.parseEventoResponse(response);
  }

  async inutilizarNumeracion(
    comercio: Comercio,
    establecimiento: string,
    punto: string,
    desde: number,
    hasta: number,
    motivo: string
  ): Promise<SifenResponse> {
    const cert = fs.readFileSync(this.config.getCertificatePath());
    const env = this.config.isTest() ? 'test' : 'prod';

    // Generar XML de evento de inutilización usando xmlgen
    const xmlEvento = await this.xmlGenerator.generarXmlEventoInutilizacion(
      comercio,
      establecimiento,
      punto,
      desde,
      hasta,
      motivo
    );

    const response = await setApi.evento(
      1, // id default
      xmlEvento,
      env,
      cert,
      this.config.getCertificatePassword()
    );

    return this.parseEventoResponse(response);
  }

  consultarRUC(_ruc: string): Promise<never> {
    // Implementación stub — integración real pendiente
    // La librería TIPS-SA podría exponer siConsRUC, pero por ahora lanzamos error
    throw new SifenNoImplementadoError('consultarRUC (siConsRUC)');
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
