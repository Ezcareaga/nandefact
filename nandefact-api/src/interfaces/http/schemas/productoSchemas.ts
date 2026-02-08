import { z } from 'zod';

/** Zod schema para POST /api/v1/productos */
export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(200, 'El nombre no puede exceder 200 caracteres'),
  precioUnitario: z.number().int('El precio debe ser un entero (PYG sin decimales)').positive('El precio debe ser positivo'),
  unidadMedida: z.string().trim().min(1, 'La unidad de medida es obligatoria').max(10, 'La unidad de medida no puede exceder 10 caracteres'),
  tasaIVA: z.union([z.literal(10), z.literal(5), z.literal(0)], {
    message: 'La tasa de IVA debe ser 10, 5 o 0',
  }),
  codigo: z.string().trim().max(50, 'El código no puede exceder 50 caracteres').optional(),
  categoria: z.string().trim().max(100, 'La categoría no puede exceder 100 caracteres').optional(),
});

/** Zod schema para PUT /api/v1/productos/:id */
export const editarProductoSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z
    .object({
      nombre: z.string().trim().min(1).max(200).optional(),
      precioUnitario: z.number().int().positive().optional(),
      unidadMedida: z.string().trim().min(1).max(10).optional(),
      tasaIVA: z.union([z.literal(10), z.literal(5), z.literal(0)]).optional(),
      codigo: z.string().trim().max(50).optional(),
      categoria: z.string().trim().max(100).optional(),
      activo: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar',
    }),
});

/** Zod schema para GET /api/v1/productos (query params) */
export const listarProductosQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100, 'El tamaño de página máximo es 100').optional().default(20),
  soloActivos: z.coerce.boolean().optional().default(true),
});

/** Zod schema para DELETE /api/v1/productos/:id (params) */
export const idParamSchema = z.object({
  id: z.uuid(),
});
