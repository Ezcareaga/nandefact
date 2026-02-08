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
  tipoImpuesto: number;
  condicion: {
    tipo: number;
    entregas?: Array<{
      tipo: number;
      monto?: string;
      moneda?: string;
    }>;
  };
  moneda: string;
  cliente: {
    contribuyente: boolean;
    ruc?: string;
    razonSocial?: string;
    nombreFantasia?: string;
    tipoOperacion?: number;
    tipoContribuyente?: number;
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
  factura?: {
    presencia: number;
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
  ivaProporcion: number; // Proporción gravada (100 = 100%)
  iva: number; // Tasa de IVA (5, 10, 0)
}

/**
 * Mapea Comercio a SifenParams (datos estáticos del emisor).
 */
export function mapComercioToParams(comercio: Comercio): SifenParams {
  // Formatear fecha inicio timbrado como YYYY-MM-DD (UTC)
  const fechaInicio = comercio.timbrado.fechaInicio;
  const timbradoFecha = `${String(fechaInicio.getUTCFullYear())}-${String(fechaInicio.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaInicio.getUTCDate()).padStart(2, '0')}`;

  return {
    version: 150,
    ruc: comercio.ruc.value, // RUC completo con DV (ej: "80069563-1")
    razonSocial: comercio.razonSocial,
    nombreFantasia: comercio.nombreFantasia,
    actividadesEconomicas: [
      {
        codigo: '47190',
        descripcion: 'Venta al por menor en comercios no especializados',
      },
    ],
    timbradoNumero: comercio.timbrado.numero,
    timbradoFecha,
    tipoContribuyente: comercio.tipoContribuyente,
    tipoRegimen: 8,
    establecimientos: [
      {
        codigo: comercio.establecimiento,
        denominacion: comercio.nombreFantasia,
        direccion: 'Sin especificar',
        numeroCasa: '0',
        departamento: 1,
        departamentoDescripcion: 'Capital',
        distrito: 1,
        distritoDescripcion: 'Asunción',
        ciudad: 1,
        ciudadDescripcion: 'Asunción',
      },
    ],
  };
}

/**
 * Mapea Factura + Comercio + Cliente a SifenData (datos variables del documento).
 */
export function mapFacturaToData(factura: Factura, _comercio: Comercio, cliente: Cliente): SifenData {
  // Extraer codigo de seguridad desde CDC (posiciones 34-42, 9 digitos)
  const codigoSeguridad = factura.cdc?.codigoSeguridad ?? '';

  // Formatear fecha emision como ISO8601 sin timezone
  const f = factura.fechaEmision;
  const fecha = `${String(f.getUTCFullYear())}-${String(f.getUTCMonth() + 1).padStart(2, '0')}-${String(f.getUTCDate()).padStart(2, '0')}T${String(f.getUTCHours()).padStart(2, '0')}:${String(f.getUTCMinutes()).padStart(2, '0')}:${String(f.getUTCSeconds()).padStart(2, '0')}`;

  // Mapear condicion pago: contado=1, credito=2
  const condicionTipo = factura.condicionPago === 'contado' ? 1 : 2;

  // Para condicion contado, agregar entregas con monto total
  const entregas: Array<{ tipo: number; monto?: string; moneda?: string }> | undefined =
    factura.condicionPago === 'contado'
      ? [
          {
            tipo: 1, // Efectivo
            monto: String(factura.totalBruto),
            moneda: 'PYG',
          },
        ]
      : undefined;

  // Mapear cliente segun tipo documento
  const clienteMapeado = mapCliente(cliente);

  return {
    tipoDocumento: factura.tipoDocumento,
    establecimiento: factura.numeroFactura.establecimiento,
    punto: factura.numeroFactura.punto,
    numero: factura.numeroFactura.numero,
    codigoSeguridadAleatorio: codigoSeguridad,
    fecha,
    tipoEmision: factura.tipoEmision,
    tipoTransaccion: 1, // 1=Venta
    tipoImpuesto: 1, // 1=IVA
    condicion: entregas
      ? {
          tipo: condicionTipo,
          entregas,
        }
      : {
          tipo: condicionTipo,
        },
    moneda: 'PYG',
    cliente: clienteMapeado,
    factura: {
      presencia: 1, // Operación presencial
    },
    items: mapItemsToSifenItems(factura.items),
  };
}

/**
 * Mapea Cliente a estructura cliente de SIFEN.
 */
function mapCliente(cliente: Cliente): SifenData['cliente'] {
  if (cliente.tipoDocumento === 'RUC') {
    return {
      contribuyente: true,
      ruc: cliente.rucCi,
      razonSocial: cliente.nombre,
      nombreFantasia: cliente.nombre,
      tipoOperacion: 1,
      tipoContribuyente: 2, // 2=Persona Jurídica (RUC suele ser PJ)
      pais: 'PRY',
      paisDescripcion: 'Paraguay',
      direccion: cliente.direccion ?? 'Sin especificar',
      numeroCasa: '0',
      departamento: 1,
      departamentoDescripcion: 'Capital',
      distrito: 1,
      distritoDescripcion: 'Asunción',
      ciudad: 1,
      ciudadDescripcion: 'Asunción',
      ...(cliente.telefono && { telefono: cliente.telefono }),
      ...(cliente.email && { email: cliente.email }),
    };
  }

  // CI, pasaporte, innominado -> contribuyente=false
  let documentoTipo = 5; // innominado por defecto
  if (cliente.tipoDocumento === 'CI') {
    documentoTipo = 1;
  } else if (cliente.tipoDocumento === 'pasaporte') {
    documentoTipo = 2;
  }

  return {
    contribuyente: false,
    documentoTipo,
    ...(cliente.rucCi && { documentoNumero: cliente.rucCi }),
    razonSocial: cliente.nombre,
    nombreFantasia: cliente.nombre,
    tipoOperacion: 1,
    pais: 'PRY',
    paisDescripcion: 'Paraguay',
    direccion: cliente.direccion ?? 'Sin especificar',
    numeroCasa: '0',
    departamento: 1,
    departamentoDescripcion: 'Capital',
    distrito: 1,
    distritoDescripcion: 'Asunción',
    ciudad: 1,
    ciudadDescripcion: 'Asunción',
    ...(cliente.telefono && { telefono: cliente.telefono }),
    ...(cliente.email && { email: cliente.email }),
  };
}

/**
 * Mapea items del dominio a SifenItem[] (estructura xmlgen).
 */
export function mapItemsToSifenItems(items: readonly ItemFactura[]): SifenItem[] {
  return items.map((item, index) => {
    // Codigo secuencial "1", "2", "3"...
    const codigo = String(index + 1);

    // ivaTipo: 1=Gravado, 3=Exento
    const ivaTipo = item.tasaIVA === 0 ? 3 : 1;

    // ivaProporcion: proporcion gravada (100 = 100%)
    const ivaProporcion = 100;

    // IMPORTANTE: xmlgen espera precio SIN IVA, pero nuestro dominio tiene precios CON IVA
    // Enviamos baseGravada / cantidad como precioUnitario
    const precioUnitarioSinIVA =
      item.tasaIVA === 0 ? item.precioUnitario : Math.round(item.iva.baseGravada / item.cantidad);

    return {
      codigo,
      descripcion: item.descripcion,
      unidadMedida: 77, // 77=Unidad
      cantidad: item.cantidad,
      precioUnitario: precioUnitarioSinIVA,
      ivaTipo,
      ivaProporcion,
      iva: item.tasaIVA, // Tasa de IVA (5, 10, 0)
    };
  });
}
