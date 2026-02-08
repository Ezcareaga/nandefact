# Dockerfile multi-stage para ÑandeFact API
# Stage 1: Build TypeScript to JavaScript
# Stage 2: Production runtime con solo node_modules de producción

# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Copiar schema Prisma para generar client
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Instalar TODAS las dependencias (incluyendo devDependencies para build)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar código fuente
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npm run build

# ============================================================================
# Stage 2: Production Runtime
# ============================================================================
FROM node:20-alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Copiar schema Prisma (necesario para migrations y Prisma Client en runtime)
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Instalar SOLO dependencias de producción
RUN npm ci --omit=dev

# Generar Prisma Client en producción
RUN npx prisma generate

# Copiar build desde stage builder
COPY --from=builder /app/dist ./dist/

# Exponer puerto (configurable vía env)
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando: correr migrations + iniciar servidor
# En producción usar prisma migrate deploy (no crea nueva migration, solo aplica pendientes)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
