---
phase: 07-api-rest
plan: 03
subsystem: api
tags: [express, productos, clientes, crud, pagination, zod]

# Dependency graph
requires:
  - phase: 07-01
    provides: Express middleware (auth, validation, error handling)
  - phase: 06-comercio-auth
    provides: IAuthService port for JWT authentication
  - phase: 04-application
    provides: Use cases for productos and clientes
provides:
  - Producto CRUD routes (GET list paginated, POST create, PUT update, DELETE soft-delete)
  - Cliente CRUD routes (GET list, POST create, PUT update)
  - Cliente search route (GET /buscar for autocomplete)
  - Cliente RUC query route (GET /ruc for SIFEN validation)
  - All routes JWT-protected and scoped to user's comercioId
affects: [07-04-main-app, 08-infrastructure]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Zod schemas for productos (10%/5%/0% IVA)
    - Zod schemas for clientes (RUC/CI/pasaporte/innominado types)
    - comercioId from JWT (req.user.comercioId), never from request body
    - Specific routes (/buscar, /ruc) before /:id to prevent Express matching issues
    - Type-safe param extraction with as assertions

key-files:
  created:
    - nandefact-api/src/interfaces/http/routes/productoRoutes.ts
    - nandefact-api/src/interfaces/http/routes/clienteRoutes.ts
  modified: []

key-decisions:
  - "Producto schemas already existed from 07-02, only routes created"
  - "Cliente schemas already existed from 07-02, only routes created"
  - "/buscar and /ruc routes defined before /:id to avoid Express path matching conflicts"
  - "comercioId always extracted from JWT to prevent users modifying other comercios' data"
  - "Spread operators with undefined checks for optional query params (exactOptionalPropertyTypes)"

patterns-established:
  - "ProductoRouterDeps interface with use cases + authService"
  - "ClienteRouterDeps interface with use cases + authService + clienteRepository"
  - "GET / returns paginated list (productos) or all items (clientes)"
  - "DELETE soft-deletes (activo=false) via EditarProducto use case"

# Metrics
duration: 7min
completed: 2026-02-08
---

# Phase 07 Plan 03: Producto and Cliente CRUD Routes Summary

**Producto CRUD (paginated list/create/update/soft-delete) and Cliente CRUD (list/create/update/search/RUC-query) routes with JWT authentication and comercioId scoping**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-08T20:17:12Z
- **Completed:** 2026-02-08T20:23:54Z
- **Tasks:** 1 (Task 1 already complete in 07-02)
- **Files modified:** 2

## Accomplishments
- Producto CRUD router with 4 endpoints: GET (paginated), POST (create), PUT (update), DELETE (soft-delete)
- Cliente CRUD router with 5 endpoints: GET (list all), POST (create), PUT (update), GET /buscar (autocomplete search), GET /ruc (SIFEN query)
- All routes protected by JWT authMiddleware and scoped to authenticated user's comercioId
- Proper route ordering (/buscar and /ruc before /:id) to avoid Express matching conflicts
- Type-safe query param handling with spread operators for exactOptionalPropertyTypes

## Task Commits

Each task was committed atomically:

1. **Task 2: Create producto and cliente route handlers** - `bd7e1b6` (feat)

**Note:** Task 1 (Zod schemas) was already completed in plan 07-02, so no new schemas were created.

## Files Created/Modified
- `nandefact-api/src/interfaces/http/routes/productoRoutes.ts` - Express router for /api/v1/productos with CRUD + pagination
- `nandefact-api/src/interfaces/http/routes/clienteRoutes.ts` - Express router for /api/v1/clientes with CRUD + search + RUC query

## Decisions Made
- **Schemas already existed:** Plan 07-03 expected to create schemas, but they were already created in 07-02. Only route handlers were implemented.
- **Route ordering:** Placed /buscar and /ruc routes before /:id to prevent Express from matching "buscar" as an :id param.
- **comercioId from JWT:** Always extract comercioId from req.user.comercioId (JWT payload) to ensure users can only access their own comercio's data.
- **Optional query params:** Used spread operators with undefined checks for optional query parameters to satisfy TypeScript's exactOptionalPropertyTypes setting.

## Deviations from Plan

None - schemas already existed from 07-02, routes implemented exactly as specified.

## Issues Encountered

**TypeScript exactOptionalPropertyTypes:**
- **Issue:** ListarProductosInput expects `page?: number` but query parsing returns `number | undefined`.
- **Solution:** Used spread operators: `...(query.page !== undefined && { page: query.page })`
- **Verification:** TypeScript compilation passes with strict settings.

**Git HEAD reference mismatch:**
- **Issue:** Git HEAD reference was out of sync during commit (`expected e1c91ef but was 4b52f3e`).
- **Solution:** Ran `git update-ref HEAD HEAD` to fix the reference.
- **Verification:** Subsequent commit succeeded.

## Next Phase Readiness
- Producto and Cliente routes ready for wiring into main app.ts
- Need to wire these routers in app.ts (plan 07-04)
- All use cases already exist and tested
- Ready for infrastructure implementation (plan 08)

---
*Phase: 07-api-rest*
*Completed: 2026-02-08*

## Self-Check: PASSED
