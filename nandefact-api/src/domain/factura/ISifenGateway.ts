import type { Comercio } from '../comercio/Comercio.js';

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
  anularDE(comercio: Comercio, cdc: string, motivo: string): Promise<SifenResponse>;
  inutilizarNumeracion(
    comercio: Comercio,
    establecimiento: string,
    punto: string,
    desde: number,
    hasta: number,
    motivo: string
  ): Promise<SifenResponse>;
}
