---
phase: 06-comercio-auth
plan: 02
subsystem: auth
tags: [authentication, jwt, pin, rate-limiting, usuario, bcrypt]

# Dependency graph
requires:
  - phase: 01-application-layer
    provides: ApplicationError base class
  - phase: 05-productos-clientes
    provides: Domain entity patterns (immutable updates, validation)
provides:
  - Usuario entity with rate limiting
  - Auth ports (IAuthService, IHashService, IUsuarioRepository)
  - Login use case (AutenticarUsuario) with PIN validation
  - Token refresh use case (RefrescarToken)
affects: [06-03-http-routes, 07-infrastructure, 08-integration-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PIN-based authentication (4-6 digits) instead of passwords"
    - "Rate limiting in domain entity (5 attempts, 30min lockout)"
    - "Token rotation on refresh (security best practice)"
    - "Generic error messages to prevent information leakage"

key-files:
  created:
    - nandefact-api/src/domain/usuario/Usuario.ts
    - nandefact-api/src/domain/usuario/IUsuarioRepository.ts
    - nandefact-api/src/domain/auth/IAuthService.ts
    - nandefact-api/src/domain/auth/IHashService.ts
    - nandefact-api/src/application/auth/AutenticarUsuario.ts
    - nandefact-api/src/application/auth/RefrescarToken.ts
    - nandefact-api/src/application/errors/CredencialesInvalidasError.ts
    - nandefact-api/src/application/errors/CuentaBloqueadaError.ts
  modified:
    - nandefact-api/src/domain/shared/types.ts

key-decisions:
  - "PIN format: 4-6 digits only (UX optimized for Doña María target user)"
  - "Rate limiting in domain entity not infrastructure (business rule)"
  - "Generic 'Teléfono o PIN incorrecto' message (security - no user enumeration)"
  - "30-minute lockout after 5 failed attempts (balance security vs UX)"
  - "Token rotation on refresh - old refresh token invalidated"

patterns-established:
  - "Authentication errors return generic messages to prevent information leakage"
  - "Rate limiting logic lives in domain entity (Usuario) not use case"
  - "estaBloqueado() accepts optional 'ahora' parameter for testability"
  - "Immutable update pattern continues: registrarIntentoFallido/resetearIntentos return new instances"

# Metrics
duration: 16min
completed: 2026-02-08
---

# Phase 06 Plan 02: Usuario Auth Summary

**PIN-based authentication (4-6 digits) with rate limiting (5 attempts, 30min lockout) and JWT token rotation**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-08T13:32:00Z
- **Completed:** 2026-02-08T13:48:02Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Usuario entity with built-in rate limiting (5 attempts triggers 30-minute lockout)
- AutenticarUsuario validates telefono+PIN, enforces lockout, generates JWT tokens
- RefrescarToken implements token rotation for security
- 49 new tests (34 Usuario entity + 15 use cases), all passing

## Task Commits

Each task was committed atomically:

1. **Tasks 1 & 2: Usuario entity and auth use cases** - `ee5c8b4` → `01fd2ea` (feat)

## Files Created/Modified
- `src/domain/usuario/Usuario.ts` - Entity with rate limiting logic (intentosFallidos, bloqueadoHasta, 5 attempts = 30min block)
- `src/domain/usuario/IUsuarioRepository.ts` - Port with findByTelefono, findById, save
- `src/domain/auth/IAuthService.ts` - JWT token generation/verification with TokenPair interface
- `src/domain/auth/IHashService.ts` - PIN hashing and verification port
- `src/application/auth/AutenticarUsuario.ts` - Login use case (validate PIN format, check user status, verify PIN, handle rate limiting)
- `src/application/auth/RefrescarToken.ts` - Token refresh with user validation and full rotation
- `src/application/errors/CredencialesInvalidasError.ts` - Generic auth error (no user enumeration)
- `src/application/errors/CuentaBloqueadaError.ts` - Lockout error with remaining minutes
- `src/domain/shared/types.ts` - Added RolUsuario type ('dueño' | 'empleado')
- `tests/unit/domain/entities/Usuario.test.ts` - 34 tests for Usuario entity
- `tests/unit/application/auth/AutenticarUsuario.test.ts` - 9 tests for login use case
- `tests/unit/application/auth/RefrescarToken.test.ts` - 6 tests for token refresh

## Decisions Made

**PIN format: 4-6 digits only**
- Target user (Doña María) needs simple auth, not complex passwords
- PIN validation happens before database lookup (fail fast)

**Rate limiting in domain entity**
- Business rule (5 attempts, 30min lockout) belongs in domain, not infrastructure
- estaBloqueado() method allows testability with optional 'ahora' parameter

**Generic error messages**
- "Teléfono o PIN incorrecto" prevents user enumeration attacks
- Same message for "user not found", "inactive user", and "wrong PIN"

**Token rotation**
- RefrescarToken generates new access+refresh pair
- Old refresh token is invalidated (security best practice)

**Telefono format validation**
- Regex `/^\+?\d{7,20}$/` allows international format with optional +
- Supports Paraguayan numbers (0981...) and international (+595981...)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Branch confusion during execution**
- Parallel execution of 06-01 (Comercio) and 06-02 (Usuario) on separate branches caused file conflicts
- Resolution: Carefully separated concerns, restored Comercio files, committed only Usuario/auth files
- Impact: None on deliverables, all tests pass

**ESLint non-null assertion error**
- AutenticarUsuario.ts line 51: `usuario.bloqueadoHasta!.getTime()`
- Fix: Added explicit null check with guard clause before using bloqueadoHasta
- Committed in: ee5c8b4

**ESLint template literal restriction**
- CuentaBloqueadaError message used number directly in template
- Fix: Added `.toString()` conversion
- Committed in: ee5c8b4

## Next Phase Readiness

**Ready for phase 06-03 (HTTP routes):**
- AutenticarUsuario ready for POST /api/v1/auth/login endpoint
- RefrescarToken ready for POST /api/v1/auth/refresh endpoint
- Error classes ready for HTTP error mapping

**Blocked/pending:**
- Need IAuthService implementation (JWT with jsonwebtoken)
- Need IHashService implementation (bcrypt for PIN hashing)
- Need IUsuarioRepository implementation (PostgreSQL adapter)

**Future phases affected:**
- Phase 07: Infrastructure adapters (implement auth ports)
- Phase 08: Integration tests (end-to-end login flow)

---
*Phase: 06-comercio-auth*
*Completed: 2026-02-08*
