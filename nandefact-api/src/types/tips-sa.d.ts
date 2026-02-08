/**
 * Declaraciones de tipos para librerías TIPS-SA (facturacionelectronicapy-*).
 * Tipado basado en el uso real en los adaptadores SIFEN.
 */

// --- facturacionelectronicapy-xmlgen ---

declare module 'facturacionelectronicapy-xmlgen' {
  import type { SifenParams, SifenData } from '../infrastructure/sifen/SifenDataMapper.js';

  interface XmlGenOptions {
    /** Opciones adicionales de generación (extensible) */
    [key: string]: unknown;
  }

  interface XmlGen {
    generateXMLDE(params: SifenParams, data: SifenData, config?: XmlGenOptions): Promise<string>;
  }

  const xmlgen: XmlGen;
  export default xmlgen;
}

// --- facturacionelectronicapy-xmlsign ---

declare module 'facturacionelectronicapy-xmlsign' {
  interface XmlSign {
    signXML(xml: string, certificatePath: string, certificatePassword: string): Promise<string>;
  }

  const xmlsign: XmlSign;
  export default xmlsign;
}

// --- facturacionelectronicapy-setapi ---

declare module 'facturacionelectronicapy-setapi' {
  /** Respuesta cruda de SIFEN — puede ser string XML o un objeto parseado */
  export type SifenRawResponse = string | SifenResponseObject;

  export interface SifenResponseObject {
    dCodRes?: string;
    codigo?: string;
    dMsgRes?: string;
    mensaje?: string;
    CDC?: string;
    cdc?: string;
  }

  interface SetApi {
    recibe(
      id: number,
      xmlFirmado: string,
      env: string,
      cert: Buffer,
      password: string,
    ): Promise<SifenRawResponse>;

    consulta(
      id: number,
      cdc: string,
      env: string,
      cert: Buffer,
      password: string,
    ): Promise<SifenRawResponse>;

    evento(
      id: number,
      xmlEvento: string,
      env: string,
      cert: Buffer,
      password: string,
    ): Promise<SifenRawResponse>;
  }

  const setApi: SetApi;
  export default setApi;
}
