---
phase: 06-comercio-auth
plan: 01
subsystem: comercio
tags: [comercio, timbrado, certificado, sifen, hexagonal]

requires:
  - phase: 01-application-layer
    provides: "IComercioRepository port, ApplicationError hierarchy"
provides:
  - "Extended Comercio entity with full SIFEN fields"
  - "ICertificadoStore port for encrypted CCFE storage"
  - "RegistrarComercio, CargarCertificado, ConfigurarTimbrado use cases"
affects: [07-api-rest, 08-infrastructure-testing]

tech-stack:
  added: []
  patterns:
    - "Immutable update methods on domain entities (actualizarTimbrado, actualizar, desactivar)"
    - "Port for encrypted certificate storage (ICertificadoStore)"

key-files:
  created:
    - "nandefact-api/src/domain/comercio/ICertificadoStore.ts"
    - "nandefact-api/src/application/comercio/RegistrarComercio.ts"
    - "nandefact-api/src/application/comercio/CargarCertificado.ts"
    - "nandefact-api/src/application/comercio/ConfigurarTimbrado.ts"
    - "nandefact-api/src/application/errors/RucDuplicadoError.ts"
  modified:
    - "nandefact-api/src/domain/comercio/Comercio.ts"
    - "nandefact-api/src/domain/comercio/IComercioRepository.ts"

key-decisions:
  - "Extended Comercio with optional SIFEN fields using null defaults (not undefined)"
  - "ICertificadoStore as separate port from IComercioRepository (SRP)"
  - "RUC uniqueness check before entity creation in RegistrarComercio"

duration: 12min
completed: 2026-02-08
---

# Phase 6 Plan 1: Comercio Setup Summary

**Extended Comercio entity with SIFEN fields, ICertificadoStore port, and 3 comercio management use cases (RegistrarComercio, CargarCertificado, ConfigurarTimbrado)**

## Performance

- **Duration:** 12 min
- **Tasks:** 2/2
- **Files modified:** 10

## Accomplishments
- Extended Comercio entity with 15 optional SIFEN fields (direccion, departamento, ciudad, telefono, email, actividad economica, tipoRegimen, cscId)
- Added immutable update methods: actualizarTimbrado(), actualizar(), desactivar()
- Extended IComercioRepository with save() and findByRuc() methods
- Created ICertificadoStore port for encrypted certificate management
- Implemented RegistrarComercio with RUC uniqueness validation
- Implemented CargarCertificado with certificate/password validation
- Implemented ConfigurarTimbrado using domain's actualizarTimbrado()
- 32 new tests (15 entity + 17 use cases)

## Task Commits

1. **Task 1: Extend Comercio entity** - `02ad507` (feat)
2. **Task 2: Comercio use cases** - `72715ff` (feat)

## Files Created/Modified
- `src/domain/comercio/Comercio.ts` - Extended with SIFEN fields + update methods
- `src/domain/comercio/IComercioRepository.ts` - Added save() and findByRuc()
- `src/domain/comercio/ICertificadoStore.ts` - New port for encrypted cert storage
- `src/application/comercio/RegistrarComercio.ts` - Register with RUC uniqueness
- `src/application/comercio/CargarCertificado.ts` - Certificate upload via port
- `src/application/comercio/ConfigurarTimbrado.ts` - Timbrado configuration
- `src/application/errors/RucDuplicadoError.ts` - Duplicate RUC error

## Decisions Made
- Extended Comercio with optional SIFEN fields using null defaults (consistent with Producto pattern)
- ICertificadoStore as separate port from IComercioRepository — certificate storage is a distinct concern
- RUC uniqueness check via findByRuc() before entity creation — prevents duplicate comercios

## Deviations from Plan

None - plan executed as written.

## Issues Encountered
None

## Next Phase Readiness
- Comercio setup use cases ready for API REST layer (Phase 7)
- ICertificadoStore port needs infrastructure implementation (Phase 8)
- All existing tests unaffected by Comercio entity extension

---
*Phase: 06-comercio-auth*
*Completed: 2026-02-08*
