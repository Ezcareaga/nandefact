import type { TipoContribuyente } from '../shared/types.js';
import type { RUC } from './RUC.js';
import type { Timbrado } from './Timbrado.js';

export interface ComercioProps {
  id: string;
  ruc: RUC;
  razonSocial: string;
  nombreFantasia: string;
  timbrado: Timbrado;
  establecimiento: string;
  puntoExpedicion: string;
  tipoContribuyente: TipoContribuyente;
  activo?: boolean | undefined;
}

/**
 * Entidad — Negocio del comerciante.
 * RUC, razón social, timbrado activo, establecimiento y punto de expedición.
 */
export class Comercio {
  readonly id: string;
  readonly ruc: RUC;
  readonly razonSocial: string;
  readonly nombreFantasia: string;
  readonly timbrado: Timbrado;
  readonly establecimiento: string;
  readonly puntoExpedicion: string;
  readonly tipoContribuyente: TipoContribuyente;
  readonly activo: boolean;

  constructor(props: ComercioProps) {
    if (props.razonSocial.trim().length === 0) {
      throw new Error('La razón social no puede estar vacía');
    }

    if (!/^\d{3}$/.test(props.establecimiento)) {
      throw new Error(`Establecimiento inválido: "${props.establecimiento}", debe ser 3 dígitos`);
    }

    if (!/^\d{3}$/.test(props.puntoExpedicion)) {
      throw new Error(
        `Punto de expedición inválido: "${props.puntoExpedicion}", debe ser 3 dígitos`,
      );
    }

    this.id = props.id;
    this.ruc = props.ruc;
    this.razonSocial = props.razonSocial.trim();
    this.nombreFantasia = props.nombreFantasia.trim();
    this.timbrado = props.timbrado;
    this.establecimiento = props.establecimiento;
    this.puntoExpedicion = props.puntoExpedicion;
    this.tipoContribuyente = props.tipoContribuyente;
    this.activo = props.activo ?? true;
  }
}
