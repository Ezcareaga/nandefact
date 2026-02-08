import type { TasaIVA } from '../shared/types.js';
import { MontoIVA } from './MontoIVA.js';
import { MontoInvalidoError } from '../errors/MontoInvalidoError.js';
import { DescripcionVaciaError } from '../errors/DescripcionVaciaError.js';

export interface ItemFacturaProps {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  tasaIVA: TasaIVA;
}

/**
 * Entidad — Línea individual de una factura.
 * Ej: 3kg mandioca @ Gs 5.000/kg = Gs 15.000.
 * El IVA se calcula automáticamente a partir del subtotal.
 */
export class ItemFactura {
  readonly descripcion: string;
  readonly cantidad: number;
  readonly precioUnitario: number;
  readonly tasaIVA: TasaIVA;
  readonly subtotal: number;
  readonly iva: MontoIVA;

  constructor(props: ItemFacturaProps) {
    if (props.cantidad <= 0) {
      throw new MontoInvalidoError('la cantidad debe ser mayor a 0');
    }

    if (props.precioUnitario < 0) {
      throw new MontoInvalidoError('el precio unitario no puede ser negativo');
    }

    if (!Number.isInteger(props.precioUnitario)) {
      throw new MontoInvalidoError('el precio unitario debe ser entero (PYG sin decimales)');
    }

    if (props.descripcion.trim().length === 0) {
      throw new DescripcionVaciaError();
    }

    this.descripcion = props.descripcion.trim();
    this.cantidad = props.cantidad;
    this.precioUnitario = props.precioUnitario;
    this.tasaIVA = props.tasaIVA;
    this.subtotal = Math.round(props.cantidad * props.precioUnitario);
    this.iva = new MontoIVA(this.subtotal, this.tasaIVA);
  }
}
