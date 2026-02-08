import { z } from 'zod';

/** Zod schema para POST /api/v1/auth/login */
export const loginSchema = z.object({
  telefono: z.string().trim().min(1, 'El teléfono es obligatorio'),
  pin: z.string().regex(/^\d{4,6}$/, 'El PIN debe tener entre 4 y 6 dígitos'),
});

/** Zod schema para POST /api/v1/auth/refresh */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'El refresh token es obligatorio'),
});
