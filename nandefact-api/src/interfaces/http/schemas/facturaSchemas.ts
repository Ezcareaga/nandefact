import { z } from 'zod';

/**
 * Schema para crear una factura.
 *
 * Input: body con clienteId, tipoDocumento, condicionPago, fechaEmision, numero, items, facturaReferenciaId (opcional).
 */
export const crearFacturaSchema = z.object({
  clienteId: z.uuid(),
  tipoDocumento: z.union([z.literal(1), z.literal(5), z.literal(6), z.literal(7)]),
  condicionPago: z.enum(['contado', 'credito']),
  fechaEmision: z.coerce.date(),
  numero: z
    .string()
    .regex(/^\d{7}$/, 'numero debe ser exactamente 7 dígitos'),
  items: z
    .array(
      z.object({
        productoId: z.uuid(),
        descripcion: z
          .string()
          .trim()
          .min(1, 'descripcion no puede estar vacía')
          .max(200, 'descripcion no puede exceder 200 caracteres'),
        cantidad: z
          .number()
          .int('cantidad debe ser un entero')
          .positive('cantidad debe ser mayor a 0'),
        precioUnitario: z
          .number()
          .int('precioUnitario debe ser un entero (PYG sin decimales)')
          .positive('precioUnitario debe ser mayor a 0'),
        tasaIVA: z.union([z.literal(10), z.literal(5), z.literal(0)]),
      })
    )
    .min(1, 'La factura debe tener al menos un item'),
  facturaReferenciaId: z.uuid().optional(),
});

/**
 * Schema para listar facturas con filtros y paginación.
 *
 * Query params: page, pageSize, estado, fechaDesde, fechaHasta.
 */
export const listarFacturasQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('page debe ser un entero')
    .positive('page debe ser mayor a 0')
    .optional()
    .default(1),
  pageSize: z.coerce
    .number()
    .int('pageSize debe ser un entero')
    .positive('pageSize debe ser mayor a 0')
    .max(100, 'pageSize no puede exceder 100')
    .optional()
    .default(20),
  estado: z
    .enum(['pendiente', 'enviado', 'aprobado', 'rechazado', 'contingencia', 'cancelado'])
    .optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

/**
 * Schema para anular una factura.
 *
 * Body: motivo de la cancelación.
 */
export const anularFacturaSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, 'motivo no puede estar vacío')
    .max(500, 'motivo no puede exceder 500 caracteres'),
});

/**
 * Schema para inutilizar numeración.
 *
 * Body: establecimiento, punto, desde, hasta, motivo.
 */
export const inutilizarNumeracionSchema = z.object({
  establecimiento: z
    .string()
    .regex(/^\d{3}$/, 'establecimiento debe ser exactamente 3 dígitos'),
  punto: z
    .string()
    .regex(/^\d{3}$/, 'punto debe ser exactamente 3 dígitos'),
  desde: z
    .number()
    .int('desde debe ser un entero')
    .positive('desde debe ser mayor a 0'),
  hasta: z
    .number()
    .int('hasta debe ser un entero')
    .positive('hasta debe ser mayor a 0'),
  motivo: z
    .string()
    .trim()
    .min(1, 'motivo no puede estar vacío')
    .max(500, 'motivo no puede exceder 500 caracteres'),
});

/**
 * Schema para validar el parámetro id en rutas de factura.
 */
export const facturaIdParamSchema = z.object({
  id: z.uuid(),
});
