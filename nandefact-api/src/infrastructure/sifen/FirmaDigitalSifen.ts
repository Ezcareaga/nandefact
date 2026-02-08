import type { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import type { SifenConfig } from './SifenConfig.js';
import xmlsign from 'facturacionelectronicapy-xmlsign';

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
