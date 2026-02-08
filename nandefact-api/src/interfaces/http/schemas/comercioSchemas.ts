import { z } from 'zod';

/** Zod schema para POST /api/v1/comercio/registrar */
export const registrarComercioSchema = z.object({
  ruc: z.string().trim().min(1, 'El RUC es obligatorio'),
  razonSocial: z.string().trim().min(1, 'La razón social es obligatoria').max(200),
  nombreFantasia: z.string().trim().min(1, 'El nombre de fantasía es obligatorio').max(200),
  timbradoNumero: z.string().trim().min(1, 'El número de timbrado es obligatorio'),
  timbradoFechaInicio: z.coerce.date(),
  timbradoFechaFin: z.coerce.date(),
  establecimiento: z.string().regex(/^\d{3}$/, 'El establecimiento debe tener exactamente 3 dígitos'),
  puntoExpedicion: z.string().regex(/^\d{3}$/, 'El punto de expedición debe tener exactamente 3 dígitos'),
  tipoContribuyente: z.union([z.literal(1), z.literal(2)], {
    message: 'El tipo de contribuyente debe ser 1 (Persona Física) o 2 (Persona Jurídica)',
  }),
  // Campos opcionales
  direccion: z.string().trim().optional(),
  numeroCasa: z.string().trim().optional(),
  departamento: z.number().int().positive().optional(),
  departamentoDesc: z.string().trim().optional(),
  distrito: z.number().int().positive().optional(),
  distritoDesc: z.string().trim().optional(),
  ciudad: z.number().int().positive().optional(),
  ciudadDesc: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  email: z.string().trim().pipe(z.email()).optional(),
  rubro: z.string().trim().optional(),
  actividadEconomicaCodigo: z.string().trim().optional(),
  actividadEconomicaDesc: z.string().trim().optional(),
  tipoRegimen: z.number().int().positive().optional(),
  cscId: z.string().trim().optional(),
});

/** Zod schema para PUT /api/v1/comercio/timbrado */
export const timbradoSchema = z.object({
  timbradoNumero: z.string().trim().min(1, 'El número de timbrado es obligatorio'),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date(),
});
