---
phase: 07-api-rest
plan: 01
subsystem: api
tags: [express, zod, jwt, middleware, error-handling]

# Dependency graph
requires:
  - phase: 06-comercio-auth
    provides: IAuthService port, domain/application error hierarchy
  - phase: 01-application-layer
    provides: Use case classes, error types
provides:
  - Express app factory with helmet, cors, JSON parsing
  - Error handler mapping 27 error types to HTTP codes
  - Zod validation middleware for body/params/query
  - JWT auth middleware verifying Bearer tokens
  - AppDependencies type with all 16 use cases + 3 repos
affects: [07-02-auth-routes, 07-03-rest-routes, 08-infrastructure]

# Tech tracking
tech-stack:
  added: [express, cors, helmet, zod]
  patterns:
    - Consistent error response structure { success: false, error: { code, message } }
    - Middleware-first architecture for cross-cutting concerns
    - Type-safe request validation with Zod
    - Bearer token authentication via IAuthService port

key-files:
  created:
    - nandefact-api/src/interfaces/http/app.ts
    - nandefact-api/src/interfaces/http/middleware/errorHandler.ts
    - nandefact-api/src/interfaces/http/middleware/validateRequest.ts
    - nandefact-api/src/interfaces/http/middleware/authMiddleware.ts
  modified:
    - nandefact-api/package.json

key-decisions:
  - "Express over Fastify for MVP (ecosystem maturity)"
  - "Error handler checks specific errors before base classes"
  - "Type assertions for validated params/query (Express type limitations)"
  - "401 for auth errors, 400 for validation, 409 for conflicts, 422 for app errors"

patterns-established:
  - "ErrorResponse interface: { success: false, error: { code, message } }"
  - "validateRequest returns type-safe parsed values"
  - "createAuthMiddleware factory pattern for dependency injection"
  - "req.user attached for authenticated requests"

# Metrics
duration: 3min
completed: 2026-02-08
---

# Phase 07 Plan 01: API REST Foundation Summary

**Express app with helmet/cors/JSON parsing, error handler mapping 27 error types to HTTP codes, Zod validation middleware, and JWT auth middleware via IAuthService port**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-08T18:56:16Z
- **Completed:** 2026-02-08T18:59:51Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Express app factory configured with security middleware (helmet, cors, 1MB JSON limit)
- Global error handler mapping all domain/application errors to proper HTTP status codes
- Zod validation middleware providing type-safe request parsing
- JWT authentication middleware extracting and verifying Bearer tokens
- AppDependencies type consolidating all 16 use cases + 3 repos for routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Install HTTP dependencies and create Express app** - `9746e38` (feat)
2. **Task 2: Create error handler, validation, and auth middleware** - `a7f8612` (feat)

**Plan squash merge:** `ce18163` (feat: API REST foundation)

## Files Created/Modified
- `nandefact-api/src/interfaces/http/app.ts` - Express factory with createApp(deps), AppDependencies type, Express.Request extension
- `nandefact-api/src/interfaces/http/middleware/errorHandler.ts` - Maps 27 error classes to HTTP codes (400/401/404/409/422/429/500)
- `nandefact-api/src/interfaces/http/middleware/validateRequest.ts` - Wraps Zod schemas for body/params/query validation
- `nandefact-api/src/interfaces/http/middleware/authMiddleware.ts` - Verifies JWT Bearer tokens via IAuthService.verificarAccessToken
- `nandefact-api/package.json` - Added express, cors, helmet, zod + type definitions

## Decisions Made

**Express over Fastify:** Chose Express for MVP due to ecosystem maturity, extensive middleware availability, and team familiarity. Fastify's performance benefits not critical at current scale.

**Error mapping strategy:** Check specific error classes before base classes to ensure correct HTTP codes. Order: specific app errors (CredencialesInvalidasError, etc.) → base classes (DomainError, ApplicationError) → catch-all 500.

**Consistent error structure:** All errors return `{ success: false, error: { code, message } }` format for predictable client handling.

**Type assertions for validation:** Express Request.params and Request.query have strict built-in types (ParamsDictionary, ParsedQs). Used type assertions after Zod parsing to satisfy TypeScript while maintaining runtime safety.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**ESLint no-namespace rule:** Express.Request type extension requires namespace declaration. Disabled rule locally with eslint-disable comments.

**Zod deprecated ZodSchema:** ZodSchema type is deprecated. Switched to z.ZodType per Zod v4 recommendations.

**Type assertion requirement:** Express's strict param/query types required `as typeof req.params` after Zod parsing. Alternative would be rewriting Express type definitions (out of scope).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 07-02 (Auth Routes):**
- Express app factory exists and can mount routes
- Error handler catches CredencialesInvalidasError, CuentaBloqueadaError
- validateRequest can validate login/refresh request bodies
- authMiddleware ready to protect routes

**Ready for Phase 07-03 (REST Routes):**
- AppDependencies includes all 16 use cases
- Error handler maps all domain/application errors
- validateRequest supports body/params/query validation
- Auth middleware provides req.user for authorization checks

**Blockers:** None. Auth routes can start immediately.

---
*Phase: 07-api-rest*
*Completed: 2026-02-08*

## Self-Check: PASSED

All key files created:
- ✓ nandefact-api/src/interfaces/http/app.ts
- ✓ nandefact-api/src/interfaces/http/middleware/errorHandler.ts
- ✓ nandefact-api/src/interfaces/http/middleware/validateRequest.ts
- ✓ nandefact-api/src/interfaces/http/middleware/authMiddleware.ts

All commits exist:
- ✓ ce18163 (plan squash merge to main)
