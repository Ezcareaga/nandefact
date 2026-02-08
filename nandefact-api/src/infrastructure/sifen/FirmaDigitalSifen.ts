import { IFirmaDigital } from '../../domain/factura/IFirmaDigital.js';
import { SifenConfig } from './SifenConfig.js';

/** Implementación de firma digital XMLDSig con CCFE usando TIPS-SA */
export class FirmaDigitalSifen implements IFirmaDigital {
  constructor(private readonly config: SifenConfig) {}

  async firmar(xmlString: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
