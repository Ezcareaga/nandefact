import { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import { SifenConfig } from './SifenConfig.js';
import xmlsignModule from 'facturacionelectronicapy-xmlsign';

// Type assertion para módulo CommonJS con definiciones incorrectas
const xmlsign = xmlsignModule as any;

/** Implementación de firma digital XMLDSig con CCFE usando TIPS-SA */
export class FirmaDigitalSifen implements IFirmaDigital {
  constructor(private readonly config: SifenConfig) {}

  async firmar(xmlString: string): Promise<string> {
    const xmlFirmado = await xmlsign.signXML(
      xmlString,
      this.config.getCertificatePath(),
      this.config.getCertificatePassword()
    );

    return xmlFirmado;
  }
}
