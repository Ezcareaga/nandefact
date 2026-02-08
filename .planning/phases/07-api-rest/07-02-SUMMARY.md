---
phase: 07-api-rest
plan: 02
subsystem: api
tags: [express, zod, jwt, multer, rest-api, validation, auth]

# Dependency graph
requires:
  - phase: 07-01
    provides: Express middleware foundation (validateRequest, authMiddleware, errorHandler)
  - phase: 06-02
    provides: AutenticarUsuario and RefrescarToken use cases
  - phase: 06-01
    provides: RegistrarComercio, CargarCertificado, ConfigurarTimbrado use cases
provides:
  - Auth API endpoints (POST /login, POST /refresh) with Zod validation
  - Comercio API endpoints (POST /registrar, GET /perfil, POST /certificado with multer, PUT /timbrado)
  - Zod schemas for request validation (loginSchema, refreshSchema, registrarComercioSchema, timbradoSchema)
  - File upload support via multer for CCFE certificate
affects: [07-03, 07-04, 08-infrastructure]

# Tech tracking
tech-stack:
  added: [multer, @types/multer]
  patterns:
    - "Router factory functions with dependency injection (createAuthRouter, createComercioRouter)"
    - "Type-safe request body parsing with explicit type assertions after Zod validation"
    - "asyncHandler wrapper for automatic error propagation to Express error handler"
    - "Multer memoryStorage for file uploads with validation"

key-files:
  created:
    - nandefact-api/src/interfaces/http/schemas/authSchemas.ts
    - nandefact-api/src/interfaces/http/schemas/comercioSchemas.ts
    - nandefact-api/src/interfaces/http/routes/authRoutes.ts
    - nandefact-api/src/interfaces/http/routes/comercioRoutes.ts
  modified:
    - nandefact-api/package.json
    - nandefact-api/package-lock.json

key-decisions:
  - "Multer memoryStorage over diskStorage: simpler for MVP, file in memory then passed directly to CargarCertificado use case"
  - "Explicit req.user checks instead of non-null assertions: ESLint enforces type safety, guards added to all protected routes"
  - "Type assertions after Zod validation: req.body is 'any' after validation, safe to assert to validated type"
  - "Zod v4 pipe syntax for email: z.string().pipe(z.email()) instead of deprecated .email() method"

patterns-established:
  - "Router factory pattern: export function createXRouter(deps) accepting use cases as dependencies"
  - "Public vs protected routes: auth routes are public, comercio routes use authMiddleware except /registrar"
  - "Consistent error responses: errorHandler middleware converts all errors to { success: false, error: { code, message } }"
  - "asyncHandler wrapper: avoids try/catch boilerplate, automatically passes errors to next()"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 07 Plan 02: Auth and Comercio Routes Summary

**Auth and Comercio REST endpoints with Zod validation, JWT protection, and multer file upload for certificates**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T19:03:06Z
- **Completed:** 2026-02-08T19:07:51Z
- **Tasks:** 2/2
- **Files modified:** 8

## Accomplishments
- Auth API endpoints (POST /login, POST /refresh) for token-based authentication
- Comercio API endpoints (POST /registrar, GET /perfil, POST /certificado, PUT /timbrado)
- Zod validation schemas ensuring type-safe request parsing
- Multer integration for secure .p12/.pfx certificate file uploads
- Complete request validation before use case execution

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zod validation schemas** - `a03c70a` (feat)
2. **Task 2: Create auth and comercio route handlers** - `70085b8` (feat)

**Plan squash merge:** `141d973` (feat: auth and comercio routes with Zod validation)

## Files Created/Modified

**Created:**
- `src/interfaces/http/schemas/authSchemas.ts` - Zod schemas for login (telefono + pin 4-6 digits) and refresh
- `src/interfaces/http/schemas/comercioSchemas.ts` - Zod schemas for registrarComercio (all fields with optional support) and timbrado
- `src/interfaces/http/routes/authRoutes.ts` - Auth router: POST /login and POST /refresh (public)
- `src/interfaces/http/routes/comercioRoutes.ts` - Comercio router: POST /registrar (public), GET /perfil, POST /certificado (multer), PUT /timbrado (protected)

**Modified:**
- `package.json`, `package-lock.json` - Added multer and @types/multer

## Decisions Made

**1. Multer memoryStorage over diskStorage**
- File uploads kept in memory as Buffer, no temp file cleanup needed
- Simpler for MVP, file passed directly to CargarCertificado use case
- 5MB size limit enforced, .p12/.pfx extension validation

**2. Explicit req.user checks instead of non-null assertions**
- ESLint forbids non-null assertions for type safety
- Added explicit `if (!req.user)` guards in all protected routes
- Returns 401 if somehow authMiddleware didn't set req.user

**3. Type assertions after Zod validation**
- Express req.body is 'any' even after validateRequest middleware
- Safe to cast to validated type after Zod parsing succeeds
- Pattern: `const body = req.body as ValidatedType;`

**4. Zod v4 pipe syntax for email**
- Zod v4 deprecated `.email()` method directly on string
- Use `.pipe(z.email())` instead per ESLint no-deprecated rule

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Zod v4 API changes**
- **Issue:** `.email()` and `.union()` errorMap deprecated in Zod v4
- **Resolution:** Used `.pipe(z.email())` for email validation, simplified union error messages
- **Impact:** ESLint pre-commit hook caught before commit

**2. Accidental work on wrong branch**
- **Issue:** Created commits on feat/07-03 instead of feat/07-02
- **Resolution:** Cherry-picked commits to correct branch, pushed both branches
- **Impact:** No lost work, commits now on correct branch with proper naming

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready:**
- Auth endpoints functional, token generation works (pending IAuthService implementation in Phase 8)
- Comercio endpoints ready, certificate upload configured
- Validation layer complete for all auth and comercio operations

**Blockers:**
- Phase 8 needed: IAuthService, IHashService, IUsuarioRepository implementations
- Phase 8 needed: IComercioRepository PostgreSQL adapter
- Phase 8 needed: ICertificadoStore for encrypted certificate storage

**Next:**
- Phase 07-03: Producto and Cliente routes (GET, POST, PUT, DELETE with pagination)
- Phase 07-04: Factura routes (POST /facturas, GET /facturas, anular, reenviar)

---
*Phase: 07-api-rest*
*Completed: 2026-02-08*


## Self-Check: PASSED
