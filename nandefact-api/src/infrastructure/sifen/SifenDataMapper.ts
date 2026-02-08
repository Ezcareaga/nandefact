import type { Factura } from '../../domain/factura/Factura.js';
import type { ItemFactura } from '../../domain/factura/ItemFactura.js';
import type { Comercio } from '../../domain/comercio/Comercio.js';
import type { Cliente } from '../../domain/cliente/Cliente.js';

/**
 * Estructura esperada por facturacionelectronicapy-xmlgen para params (datos del emisor).
 */
export interface SifenParams {
  version: number;
  ruc: string;
  razonSocial: string;
  nombreFantasia: string;
  actividadesEconomicas: Array<{
    codigo: string;
    descripcion: string;
  }>;
  timbradoNumero: string;
  timbradoFecha: string;
  tipoContribuyente: number;
  tipoRegimen: number;
  establecimientos: Array<{
    codigo: string;
    denominacion: string;
    direccion: string;
    numeroCasa: string;
    departamento: number;
    departamentoDescripcion: string;
    distrito: number;
    distritoDescripcion: string;
    ciudad: number;
    ciudadDescripcion: string;
  }>;
}

/**
 * Estructura esperada por xmlgen para data (datos variables del documento).
 */
export interface SifenData {
  tipoDocumento: number;
  establecimiento: string;
  punto: string;
  numero: string;
  codigoSeguridadAleatorio: string;
  fecha: string;
  tipoEmision: number;
  tipoTransaccion: number;
  condicion: {
    tipo: number;
  };
  moneda: string;
  cliente: {
    contribuyente: boolean;
    ruc?: string;
    razonSocial?: string;
    nombreFantasia?: string;
    tipoOperacion?: number;
    documentoTipo?: number;
    documentoNumero?: string;
    pais?: string;
    paisDescripcion?: string;
    direccion?: string;
    numeroCasa?: string;
    departamento?: number;
    departamentoDescripcion?: string;
    distrito?: number;
    distritoDescripcion?: string;
    ciudad?: number;
    ciudadDescripcion?: string;
    telefono?: string;
    celular?: string;
    email?: string;
  };
  items: SifenItem[];
  observacion?: string;
}

/**
 * Estructura de un item para xmlgen.
 */
export interface SifenItem {
  codigo: string;
  descripcion: string;
  observacion?: string;
  unidadMedida: number;
  cantidad: number;
  precioUnitario: number;
  cambio?: number;
  descuento?: number;
  anticipo?: number;
  pais?: string;
  paisDescripcion?: string;
  tolerancia?: number;
  toleranciaCantidad?: number;
  toleranciaPorcentaje?: number;
  cdcAnticipo?: string;
  ivaTipo: number;
  ivaTasa: number;
  ivaBase: number;
  iva: number;
}

/**
 * Mapper puro: transforma entidades del dominio al formato de TIPS-SA xmlgen.
 */
export class SifenDataMapper {
  /**
   * Mapea Comercio a SifenParams (datos estáticos del emisor).
   */
  static mapComercioToParams(comercio: Comercio): SifenParams {
    // Stub: retornar estructura incompleta para que los tests fallen
    return {
      version: 0,
      ruc: '',
      razonSocial: '',
      nombreFantasia: '',
      actividadesEconomicas: [],
      timbradoNumero: '',
      timbradoFecha: '',
      tipoContribuyente: 0,
      tipoRegimen: 0,
      establecimientos: [],
    };
  }

  /**
   * Mapea Factura + Comercio + Cliente a SifenData (datos variables del documento).
   */
  static mapFacturaToData(factura: Factura, comercio: Comercio, cliente: Cliente): SifenData {
    // Stub: retornar estructura incompleta para que los tests fallen
    return {
      tipoDocumento: 0,
      establecimiento: '',
      punto: '',
      numero: '',
      codigoSeguridadAleatorio: '',
      fecha: '',
      tipoEmision: 0,
      tipoTransaccion: 0,
      condicion: { tipo: 0 },
      moneda: '',
      cliente: { contribuyente: false },
      items: [],
    };
  }

  /**
   * Mapea items del dominio a SifenItem[] (estructura xmlgen).
   */
  static mapItemsToSifenItems(items: readonly ItemFactura[]): SifenItem[] {
    // Stub: retornar array vacío para que los tests fallen
    return [];
  }
}
