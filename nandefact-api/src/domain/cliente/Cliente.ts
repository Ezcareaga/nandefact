import type { TipoDocumentoIdentidad } from '../shared/types.js';

export interface ClienteProps {
  id: string;
  comercioId: string;
  nombre: string;
  rucCi: string;
  tipoDocumento: TipoDocumentoIdentidad;
  telefono?: string | undefined;
  email?: string | undefined;
  direccion?: string | undefined;
  frecuente?: boolean | undefined;
  enviarWhatsApp?: boolean | undefined;
}

/**
 * Entidad — Destinatario de la factura.
 * Puede ser identificado (CI/RUC) o innominado.
 */
export class Cliente {
  readonly id: string;
  readonly comercioId: string;
  readonly nombre: string;
  readonly rucCi: string;
  readonly tipoDocumento: TipoDocumentoIdentidad;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly direccion: string | null;
  readonly frecuente: boolean;
  readonly enviarWhatsApp: boolean;

  constructor(props: ClienteProps) {
    if (props.nombre.trim().length === 0) {
      throw new Error('El nombre del cliente no puede estar vacío');
    }

    if (props.tipoDocumento !== 'innominado' && props.rucCi.trim().length === 0) {
      throw new Error('El documento de identidad es obligatorio para clientes no innominados');
    }

    this.id = props.id;
    this.comercioId = props.comercioId;
    this.nombre = props.nombre.trim();
    this.rucCi = props.rucCi;
    this.tipoDocumento = props.tipoDocumento;
    this.telefono = props.telefono ?? null;
    this.email = props.email ?? null;
    this.direccion = props.direccion ?? null;
    this.frecuente = props.frecuente ?? false;
    this.enviarWhatsApp = props.enviarWhatsApp ?? true;
  }
}
