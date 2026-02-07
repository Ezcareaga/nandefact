/** Puerto — Firma digital XMLDSig con certificado CCFE */
export interface IFirmaDigital {
  firmar(xmlString: string): Promise<string>;
}
