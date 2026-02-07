---
phase: 01-application-layer
plan: 01
subsystem: application
tags: [typescript, tdd, use-cases, domain-driven-design, hexagonal-architecture]

# Dependency graph
requires:
  - phase: 00-foundation
    provides: Domain entities (Factura, Comercio, CDC, ItemFactura) and value objects
provides:
  - CrearFactura use case with input/output DTOs
  - Application error hierarchy (ApplicationError base class)
  - IComercioRepository port interface
  - TDD test suite for use case layer
affects: [02-sifen-integration, 03-persistence, 04-api-rest]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use case pattern with dependency injection via constructor"
    - "Application layer DTOs separate from domain entities"
    - "TDD red-green-refactor cycle for application layer"

key-files:
  created:
    - nandefact-api/src/application/errors/ApplicationError.ts
    - nandefact-api/src/application/errors/ComercioNoEncontradoError.ts
    - nandefact-api/src/application/errors/FacturaNoEncontradaError.ts
    - nandefact-api/src/application/errors/FacturaNoAnulableError.ts
    - nandefact-api/src/domain/comercio/IComercioRepository.ts
    - nandefact-api/src/application/facturacion/CrearFactura.ts
    - nandefact-api/tests/unit/application/facturacion/CrearFactura.test.ts
  modified: []

key-decisions:
  - "Application errors separate from domain errors - each layer has its own error hierarchy"
  - "Port interfaces belong in domain layer (IComercioRepository in src/domain/)"
  - "Use case accepts input DTO, orchestrates domain logic, returns output DTO"
  - "UUID generation at application layer, not domain layer"

patterns-established:
  - "Use case constructor receives port interfaces via dependency injection"
  - "TDD with Vitest mocking (vi.fn()) for repository ports"
  - "Output DTOs flatten domain aggregates for client consumption"

# Metrics
duration: 2min
completed: 2026-02-07
---

# Phase 01-01: Application Layer - CrearFactura Use Case Summary

**CrearFactura use case with TDD test coverage, application error hierarchy, and IComercioRepository port**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T23:00:08Z
- **Completed:** 2026-02-07T23:02:33Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- CrearFactura use case orchestrates factura creation from input DTO through domain entities
- Application error hierarchy established (ApplicationError base + 3 specific errors)
- IComercioRepository port interface defined in domain layer
- Complete TDD cycle: RED (6 failing tests) → GREEN (all pass) → implementation verified
- 70 total tests passing (59 domain + 6 CrearFactura + 5 EnviarDE)

## Task Commits

Each task was committed atomically following TDD:

1. **Task 1: Create application errors and IComercioRepository port** - `e531a1f` (feat)
2. **Task 2: RED — Write failing tests for CrearFactura use case** - `2af90fe` (test)
3. **Task 3: GREEN — Implement CrearFactura use case** - `eb91c8e` (feat)

**Plan metadata:** Merged to main via merge commit

_Note: This was a TDD task with 3 atomic commits (setup → test → implementation)_

## Files Created/Modified

- `nandefact-api/src/application/errors/ApplicationError.ts` - Base error class for application layer
- `nandefact-api/src/application/errors/ComercioNoEncontradoError.ts` - Error when comercio not found
- `nandefact-api/src/application/errors/FacturaNoEncontradaError.ts` - Error when factura not found
- `nandefact-api/src/application/errors/FacturaNoAnulableError.ts` - Error when factura cannot be cancelled
- `nandefact-api/src/domain/comercio/IComercioRepository.ts` - Port interface for comercio persistence
- `nandefact-api/src/application/facturacion/CrearFactura.ts` - Use case for creating facturas
- `nandefact-api/tests/unit/application/facturacion/CrearFactura.test.ts` - TDD test suite (6 test cases)

## Decisions Made

**1. Application errors separate from domain errors**
- ApplicationError base class distinct from DomainError
- Each layer has its own error hierarchy for separation of concerns
- Application errors indicate orchestration/repository failures, not business rule violations

**2. Port interfaces belong in domain layer**
- IComercioRepository placed in `src/domain/comercio/` not `src/application/`
- Follows hexagonal architecture: domain defines what it needs (ports), infrastructure implements how (adapters)
- Application layer depends on domain ports, not vice versa

**3. UUID generation at application layer**
- Use case generates UUID via crypto.randomUUID(), not domain entity
- Domain entity receives ID as constructor parameter
- Application layer controls technical ID generation, domain focuses on business logic

**4. Input/Output DTOs for use case boundary**
- CrearFacturaInput/Output DTOs define clean contract
- DTOs flatten domain aggregates (factura.cdc.value becomes string cdc in output)
- Repository mocked with vi.fn() for unit testing isolation

## Deviations from Plan

None - plan executed exactly as written following TDD red-green-refactor cycle.

## Issues Encountered

**1. CDC property name mismatch (resolved)**
- Initial implementation used `factura.cdc?.valor` but CDC class property is `value` not `valor`
- Fixed by changing to `factura.cdc?.value`
- TypeScript compiler caught this before runtime

**2. EnviarDE files appeared in merge (no action needed)**
- EnviarDE.ts and EnviarDE.test.ts appeared during git merge to main
- Tests pass (5 tests), files compile correctly
- Appears to be from parallel work or previous session - no conflict with current plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CrearFactura use case complete and tested
- Ready for SIFEN integration (EnviarDE use case to send facturas to SIFEN)
- Ready for persistence layer (implement IFacturaRepository and IComercioRepository with PostgreSQL)
- Ready for REST API (HTTP endpoint wrapping CrearFactura use case)

**Blockers:** None

**Concerns:** EnviarDE files present but not part of this plan - should verify in next planning session if this was intentional or needs reconciliation.

## Self-Check: PASSED

All files created:
- nandefact-api/src/application/errors/ApplicationError.ts ✓
- nandefact-api/src/application/errors/ComercioNoEncontradoError.ts ✓
- nandefact-api/src/application/errors/FacturaNoEncontradaError.ts ✓
- nandefact-api/src/application/errors/FacturaNoAnulableError.ts ✓
- nandefact-api/src/domain/comercio/IComercioRepository.ts ✓
- nandefact-api/src/application/facturacion/CrearFactura.ts ✓
- nandefact-api/tests/unit/application/facturacion/CrearFactura.test.ts ✓

All commits exist:
- e531a1f ✓
- 2af90fe ✓
- eb91c8e ✓

---
*Phase: 01-application-layer*
*Completed: 2026-02-07*
