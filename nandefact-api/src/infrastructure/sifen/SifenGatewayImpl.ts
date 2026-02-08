import { ISifenGateway, SifenResponse } from '../../domain/factura/ISifenGateway.js';
import { SifenConfig } from './SifenConfig.js';

/** Implementación gateway SIFEN usando TIPS-SA setapi */
export class SifenGatewayImpl implements ISifenGateway {
  constructor(private readonly config: SifenConfig) {}

  async enviarDE(xmlFirmado: string): Promise<SifenResponse> {
    throw new Error('Not implemented');
  }

  async consultarEstado(cdc: string): Promise<SifenResponse> {
    throw new Error('Not implemented');
  }

  async anularDE(cdc: string, motivo: string): Promise<SifenResponse> {
    throw new Error('Not implemented');
  }
}
