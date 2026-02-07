/** Respuesta del servicio SIFEN */
export interface SifenResponse {
  codigo: string;
  mensaje: string;
  cdc: string;
}

/** Puerto — Comunicación con Web Services SIFEN (SOAP) */
export interface ISifenGateway {
  enviarDE(xmlFirmado: string): Promise<SifenResponse>;
  consultarEstado(cdc: string): Promise<SifenResponse>;
  anularDE(cdc: string, motivo: string): Promise<SifenResponse>;
}
