import { z } from 'zod';

/**
 * Schema para push de factura a la cola de sincronización.
 *
 * Body: facturaId.
 */
export const syncPushSchema = z.object({
  facturaId: z.uuid(),
});

/**
 * Schema para pull de facturas sincronizadas desde un timestamp.
 *
 * Query param: since (fecha ISO 8601).
 */
export const syncPullQuerySchema = z.object({
  since: z.coerce.date(),
});
