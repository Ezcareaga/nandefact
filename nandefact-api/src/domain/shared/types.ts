/** Tasa de IVA vigente en Paraguay */
export type TasaIVA = 10 | 5 | 0;

/** Estado del DE en SIFEN */
export type EstadoSifen = 'pendiente' | 'enviado' | 'aprobado' | 'rechazado' | 'contingencia';

/** Tipo de emisión del DE: 1=Normal, 2=Contingencia */
export type TipoEmision = 1 | 2;

/** Tipo de documento electrónico: 1=FE, 5=NC, 6=ND, 7=NR */
export type TipoDocumento = 1 | 5 | 6 | 7;

/** Tipo de contribuyente: 1=Persona Física, 2=Persona Jurídica */
export type TipoContribuyente = 1 | 2;

/** Condición de pago */
export type CondicionPago = 'contado' | 'credito';

/** Tipo de documento de identidad del receptor */
export type TipoDocumentoIdentidad = 'RUC' | 'CI' | 'pasaporte' | 'innominado';
