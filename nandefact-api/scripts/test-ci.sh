#!/bin/bash
# CI test script - runs all tests with test infrastructure
# Exit on error, undefined variables, and pipe failures
set -euo pipefail

echo "🧪 Iniciando test suite completa..."

# Cargar variables de entorno de test
export $(grep -v '^#' .env.test | xargs)

# 1. Iniciar infraestructura de test
echo "📦 Iniciando contenedores de test..."
docker-compose -f docker-compose.test.yml up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando PostgreSQL..."
timeout 30 bash -c 'until docker exec nandefact-postgres-test pg_isready -U nandefact_test > /dev/null 2>&1; do sleep 1; done'

echo "⏳ Esperando Redis..."
timeout 30 bash -c 'until docker exec nandefact-redis-test redis-cli ping > /dev/null 2>&1; do sleep 1; done'

echo "✅ Servicios listos"

# 2. Ejecutar migraciones de Prisma
echo "🔄 Ejecutando migraciones..."
npx prisma migrate deploy

# 3. Generar Prisma Client
echo "🔧 Generando Prisma Client..."
npx prisma generate

# 4. Ejecutar tests
echo ""
echo "🧪 Ejecutando tests unitarios..."
npm run test -- tests/unit/ || TEST_FAILED=1

echo ""
echo "🧪 Ejecutando tests de integración..."
npm run test:integration || TEST_FAILED=1

echo ""
echo "🧪 Ejecutando tests E2E..."
npm run test:e2e || TEST_FAILED=1

# 5. Detener infraestructura
echo ""
echo "🧹 Deteniendo contenedores..."
docker-compose -f docker-compose.test.yml down -v

# 6. Reportar resultado
if [ "${TEST_FAILED:-0}" -eq 1 ]; then
  echo ""
  echo "❌ Tests fallaron"
  exit 1
else
  echo ""
  echo "✅ Todos los tests pasaron"
  exit 0
fi
