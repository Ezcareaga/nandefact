import type {
  TipoDocumento,
  TipoEmision,
  TipoContribuyente,
  CondicionPago,
  EstadoSifen,
} from '../shared/types.js';
import { CDC } from './CDC.js';
import type { ItemFactura } from './ItemFactura.js';
import type { NumeroFactura } from './NumeroFactura.js';
import type { Timbrado } from '../comercio/Timbrado.js';
import type { RUC } from '../comercio/RUC.js';
import { FacturaSinItemsError } from '../errors/FacturaSinItemsError.js';
import { FacturaInmutableError } from '../errors/FacturaInmutableError.js';
import { EstadoInconsistenteError } from '../errors/EstadoInconsistenteError.js';

/** Transiciones de estado válidas para la factura */
const TRANSICIONES_VALIDAS: Record<EstadoSifen, readonly EstadoSifen[]> = {
  pendiente: ['enviado'],
  enviado: ['aprobado', 'rechazado'],
  aprobado: ['cancelado'],
  rechazado: ['pendiente'],
  cancelado: [],
  contingencia: ['enviado'],
};

export interface FacturaProps {
  id: string;
  comercioId: string;
  clienteId: string;
  tipoDocumento: TipoDocumento;
  timbrado: Timbrado;
  numeroFactura: NumeroFactura;
  tipoEmision: TipoEmision;
  condicionPago: CondicionPago;
  fechaEmision: Date;
}

/**
 * Agregado raíz — Factura electrónica.
 * Protege invariantes: mínimo 1 item para CDC, timbrado vigente,
 * inmutable después de aprobación SIFEN.
 */
export class Factura {
  readonly id: string;
  readonly comercioId: string;
  readonly clienteId: string;
  readonly tipoDocumento: TipoDocumento;
  readonly timbrado: Timbrado;
  readonly numeroFactura: NumeroFactura;
  readonly tipoEmision: TipoEmision;
  readonly condicionPago: CondicionPago;
  readonly fechaEmision: Date;

  private _items: ItemFactura[] = [];
  private _cdc: CDC | null = null;
  private _estado: EstadoSifen = 'pendiente';

  // Totales calculados
  private _totalBruto = 0;
  private _totalIVA10 = 0;
  private _totalIVA5 = 0;
  private _totalExenta = 0;
  private _totalIVA = 0;

  constructor(props: FacturaProps) {
    // Validar timbrado vigente al momento de emisión
    props.timbrado.validarVigencia(props.fechaEmision);

    this.id = props.id;
    this.comercioId = props.comercioId;
    this.clienteId = props.clienteId;
    this.tipoDocumento = props.tipoDocumento;
    this.timbrado = props.timbrado;
    this.numeroFactura = props.numeroFactura;
    this.tipoEmision = props.tipoEmision;
    this.condicionPago = props.condicionPago;
    this.fechaEmision = props.fechaEmision;
  }

  // --- Getters ---

  get items(): readonly ItemFactura[] {
    return this._items;
  }

  get cdc(): CDC | null {
    return this._cdc;
  }

  get estado(): EstadoSifen {
    return this._estado;
  }

  get totalBruto(): number {
    return this._totalBruto;
  }

  get totalIVA10(): number {
    return this._totalIVA10;
  }

  get totalIVA5(): number {
    return this._totalIVA5;
  }

  get totalExenta(): number {
    return this._totalExenta;
  }

  get totalIVA(): number {
    return this._totalIVA;
  }

  // --- Métodos de negocio ---

  /** Agrega un item a la factura y recalcula totales */
  agregarItem(item: ItemFactura): void {
    this.validarMutable();
    this._items.push(item);
    this.calcularTotales();
  }

  /** Recalcula todos los totales a partir de los items actuales */
  calcularTotales(): void {
    this._totalBruto = 0;
    this._totalIVA10 = 0;
    this._totalIVA5 = 0;
    this._totalExenta = 0;

    for (const item of this._items) {
      this._totalBruto += item.subtotal;

      if (item.tasaIVA === 10) {
        this._totalIVA10 += item.iva.montoIVACalculado;
      } else if (item.tasaIVA === 5) {
        this._totalIVA5 += item.iva.montoIVACalculado;
      } else {
        this._totalExenta += item.subtotal;
      }
    }

    this._totalIVA = this._totalIVA10 + this._totalIVA5;
  }

  /** Genera el CDC de 44 dígitos. Requiere datos del comercio emisor. */
  generarCDC(ruc: RUC, tipoContribuyente: TipoContribuyente): void {
    this.validarMutable();

    if (this._items.length === 0) {
      throw new FacturaSinItemsError();
    }

    this._cdc = CDC.crear({
      tipoDocumento: this.tipoDocumento,
      rucBase: ruc.basePadded,
      dvRUC: ruc.dv,
      establecimiento: this.numeroFactura.establecimiento,
      puntoExpedicion: this.numeroFactura.punto,
      numero: this.numeroFactura.numero,
      tipoContribuyente,
      fechaEmision: this.fechaEmision,
      tipoEmision: this.tipoEmision,
    });
  }

  /** Marca la factura como enviada a SIFEN */
  marcarEnviada(): void {
    this.validarTransicion('enviado');
    this._estado = 'enviado';
  }

  /** Marca la factura como aprobada por SIFEN (se vuelve inmutable) */
  marcarAprobada(): void {
    this.validarTransicion('aprobado');
    this._estado = 'aprobado';
  }

  /** Marca la factura como rechazada por SIFEN */
  marcarRechazada(): void {
    this.validarTransicion('rechazado');
    this._estado = 'rechazado';
  }

  /** Marca la factura como cancelada (después de evento cancelación aceptado por SIFEN) */
  marcarCancelada(): void {
    this.validarTransicion('cancelado');
    this._estado = 'cancelado';
  }

  // --- Helpers privados ---

  /** Valida que la transición de estado sea válida según la state machine */
  private validarTransicion(destino: EstadoSifen): void {
    const transicionesPermitidas = TRANSICIONES_VALIDAS[this._estado];
    if (!transicionesPermitidas.includes(destino)) {
      throw new EstadoInconsistenteError(this._estado, destino);
    }
  }

  private validarMutable(): void {
    if (this._estado === 'aprobado' || this._estado === 'cancelado') {
      throw new FacturaInmutableError();
    }
  }
}
