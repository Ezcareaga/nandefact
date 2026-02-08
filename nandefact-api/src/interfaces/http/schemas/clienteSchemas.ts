import { z } from 'zod';

/** Zod schema para POST /api/v1/clientes */
export const crearClienteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(200, 'El nombre no puede exceder 200 caracteres'),
  rucCi: z.string().trim().min(1, 'El RUC/CI es obligatorio').max(20, 'El RUC/CI no puede exceder 20 caracteres'),
  tipoDocumento: z.enum(['RUC', 'CI', 'pasaporte', 'innominado'], {
    message: 'El tipo de documento debe ser RUC, CI, pasaporte o innominado',
  }),
  telefono: z.string().trim().max(20, 'El teléfono no puede exceder 20 caracteres').optional(),
  email: z.email().optional(),
  direccion: z.string().trim().max(500, 'La dirección no puede exceder 500 caracteres').optional(),
  frecuente: z.boolean().optional(),
  enviarWhatsApp: z.boolean().optional(),
});

/** Zod schema para PUT /api/v1/clientes/:id */
export const editarClienteSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z
    .object({
      nombre: z.string().trim().min(1).max(200).optional(),
      rucCi: z.string().trim().min(1).max(20).optional(),
      tipoDocumento: z.enum(['RUC', 'CI', 'pasaporte', 'innominado']).optional(),
      telefono: z.string().trim().max(20).optional(),
      email: z.email().optional(),
      direccion: z.string().trim().max(500).optional(),
      frecuente: z.boolean().optional(),
      enviarWhatsApp: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar',
    }),
});

/** Zod schema para GET /api/v1/clientes/buscar?q= */
export const buscarClientesQuerySchema = z.object({
  q: z.string().trim().min(2, 'La búsqueda debe tener al menos 2 caracteres'),
});

/** Zod schema para GET /api/v1/clientes/ruc?ruc= */
export const consultarRUCQuerySchema = z.object({
  ruc: z.string().trim().min(1, 'El RUC es obligatorio'),
});
