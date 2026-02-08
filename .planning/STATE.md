# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** Doña María puede facturar electrónicamente desde su puesto en el mercado en menos de 30 segundos, con o sin internet, cumpliendo todas las reglas SIFEN/DNIT.
**Current focus:** Phase 4 - Events & KuDE

## Current Position

Phase: 3 of 10 (Sync & Queue) — COMPLETE
Next: Phase 4 (Events & KuDE)
Last activity: 2026-02-08 — Phase 3 verified (10/10 must-haves passed)

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 12.0 min
- Total execution time: 1.69 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan | Status |
|-------|-------|-------|----------|--------|
| 01-application-layer | 3/3 | 8 min | 2.7 min | Complete |
| 02-sifen-integration | 3/3 | 84 min | 28.0 min | Complete |
| 03-sync-queue | 2/2 | 10 min | 5.0 min | Complete |

**Recent Trend:**
- Last 5 plans: 02-01 (72min), 02-02 (6min), 02-03 (6min), 03-01 (6min), 03-02 (4min)
- Trend: Velocity improving (6min → 4min), infrastructure tasks faster than expected

**Test Coverage:**
- Total tests: 172 (59 domain + 33 application + 59 sifen + 21 queue/logging)
- All passing, zero regressions

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Foundation (Milestone 1): Arquitectura Hexagonal (Good) — Testability, can swap adapters without touching domain
- Foundation (Milestone 1): Vitest sobre Jest (Good) — Faster, native ESM, better DX with TypeScript
- Foundation (Milestone 1): WhatsApp como puerto (Pending) — Build interface now, integrate Meta API later
- 01-01: Application errors separate from domain errors (Good) — Each layer has its own error hierarchy
- 01-01: Port interfaces in domain layer (Good) — Domain defines what it needs, infrastructure implements how
- 01-01: UUID generation at application layer (Good) — Application controls technical IDs, domain focuses on business logic
- 01-02: Placeholder XML for testing (Good) — Real SIFEN XML generation deferred to Phase 2, allows testing orchestration now
- 01-02: SIFEN codes 0260/0261 as success (Good) — Consistent pattern for detecting approved responses
- 01-02: AnularFactura doesn't mutate state (Pending) — Cancelado estado deferred to future phase when state machine is designed
- 01-03: Sequential processing over parallel (Good) — Predictable state updates, easier debugging, acceptable performance for batch sync
- 01-03: SIFEN rejection counts as successful communication (Good) — Network worked, SIFEN responded, factura correctly marked rechazada
- 01-03: Continue processing on failure (Good) — Maximizes sync completion, reports all failures in summary
- 02-01: Price conversion for xmlgen library (Good) — Domain has prices WITH IVA, xmlgen expects WITHOUT IVA. Calculate baseGravada/cantidad.
- 02-01: xmlgen 'iva' field is rate not amount (Good) — Field naming clarified through library exploration
- 02-01: Dynamic import for CommonJS xmlgen (Good) — ESM TypeScript project consuming CommonJS library via dynamic import + type assertion
- 02-02: Type assertions for TIPS-SA CommonJS modules (Good) — TypeScript definitions don't match exports, simplest workaround
- 02-02: Defensive SIFEN response parsing (Good) — Handles both XML string and object responses from unpredictable library
- 02-02: Mock fs in tests (Good) — Tests don't require real certificate files, faster execution
- 02-03: Repository injection in use cases (Good) — Use cases load all required aggregates (factura, comercio, cliente) before calling infrastructure
- 02-03: Error handling for missing entities (Good) — Throw explicit errors when comercio or cliente not found for debugging clarity
- 03-01: SyncJob as immutable value object (Good) — conError() returns new instance, prevents race conditions in multi-worker scenarios
- 03-01: 72-hour check at processing time (Good) — Expiration checked when job dequeued, not when enqueued
- 03-01: Max 5 retry attempts (Good) — Prevents infinite loops while allowing transient failures to resolve
- 03-01: Single-job processing (Good) — One job at a time simplifies error handling, BullMQ manages concurrency
- 03-02: Concurrency=1 for strict FIFO (Good) — Ensures facturas are processed in exact order enqueued
- 03-02: Rate limiting 10 jobs/min (Good) — Prevents overwhelming SIFEN API with burst traffic
- 03-02: Exponential backoff in adapter (Good) — Domain remains pure, retry delays calculated in infrastructure
- 03-02: Mock BullMQ in tests (Good) — Unit tests don't require running Redis instance

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 8 - Infrastructure Testing:**
- Mock SIFEN responses required until certificate obtained
- CCFE certificate not available yet (homologation pending)
- Need timbrado de prueba from Marangatú for full testing

## Session Continuity

Last session: 2026-02-08
Stopped at: Phase 3 Sync & Queue complete, verified 10/10
Resume file: None
