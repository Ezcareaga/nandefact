// Singleton Prisma Client para reutilización de conexiones
// Evita crear múltiples instancias en desarrollo (hot-reload)

import { PrismaClient } from '@prisma/client';

// Extender el tipo global para TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Singleton: reutilizar instancia existente en desarrollo
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// En desarrollo, guardar instancia en global para hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export { prisma };
