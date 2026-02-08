# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** Doña María puede facturar electrónicamente desde su puesto en el mercado en menos de 30 segundos, con o sin internet, cumpliendo todas las reglas SIFEN/DNIT.
**Current focus:** Phase 7 - API REST (next)

## Current Position

Phase: 7 of 10 (API REST) — IN PROGRESS
Plan: 2 of 4 (07-01, 07-02 complete)
Last activity: 2026-02-08 — Completed 07-02-PLAN.md (Auth and Comercio routes)

Progress: [██████░░░░] 64.3%

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: 10.2 min
- Total execution time: 2.90 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan | Status |
|-------|-------|-------|----------|--------|
| 01-application-layer | 3/3 | 8 min | 2.7 min | Complete |
| 02-sifen-integration | 3/3 | 84 min | 28.0 min | Complete |
| 03-sync-queue | 2/2 | 10 min | 5.0 min | Complete |
| 04-events-kude | 2/2 | 23 min | 11.5 min | Complete |
| 05-productos-clientes | 2/2 | 14 min | 7.0 min | Complete |
| 06-comercio-auth | 2/2 | 28 min | 14.0 min | Complete |
| 07-api-rest | 2/4 | 7 min | 3.5 min | In Progress |

**Recent Trend:**
- Last 5 plans: 06-01 (12min), 06-02 (16min), 07-01 (3min), 07-02 (4min)
- Trend: API layer tasks very fast (3-4min), domain/business logic slower (12-16min)

**Test Coverage:**
- Total tests: 359 (139 domain + 123 application + 75 sifen + 22 queue/logging/kude)
- All passing, zero regressions (17 tests added in 06-01 use cases)

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
- 01-02: AnularFactura doesn't mutate state (Resolved in 04-01) — Cancelado state now implemented with marcarCancelada() method
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
- 04-01: Cancelado state enforces state machine (Good) — Only facturas in 'aprobado' can be cancelled, cancelled facturas immutable
- 04-01: Use cases load all required aggregates (Good) — AnularFactura and InutilizarNumeracion load Comercio before calling gateway
- 04-01: ISifenGateway accepts Comercio parameter (Good) — Event methods need emisor data for XML generation
- 04-01: Type assertions for xmlgen events (Good) — Methods exist but TypeScript definitions incomplete
- 04-01: InutilizarNumeracion validation (Good) — Validates range and motivo length per SIFEN requirements
- 04-02: PDFKit over TIPS-SA kude (Good) — Avoids Java dependency, lightweight, sufficient for KuDE spec
- 04-02: IKudeGenerator signature updated (Good) — Accepts comercio + cliente for complete KuDE data
- 04-02: NotificadorStub pattern (Good) — INotificador port defined with stub implementation until WhatsApp integration
- 05-01: Immutable update methods over mutable setters (Good) — desactivar/actualizar return new instances, prevents mutation, easier to test
- 05-01: Optional properties via conditional assignment (Good) — exactOptionalPropertyTypes prevents undefined in optional props, assign only when defined
- 05-01: Paginated findByComercio with options object (Good) — Flexible, extensible API with { page, pageSize, soloActivos }
- 05-01: TasaIVA validation in entity constructor (Good) — Only 10/5/0 allowed per Paraguay tax law, domain enforces business rule
- 06-02: PIN-based auth over passwords (Good) — Target user (Doña María) needs simple 4-6 digit PIN, not complex password
- 06-02: Rate limiting in domain entity (Good) — Business rule (5 attempts, 30min lockout) belongs in Usuario, not infrastructure
- 06-02: Generic auth error messages (Good) — Prevents user enumeration attacks, same message for all auth failures
- 06-02: Token rotation on refresh (Good) — Security best practice, old refresh token invalidated when new pair generated
- 06-02: estaBloqueado accepts ahora parameter (Good) — Testability via dependency injection of time
- 07-01: Express over Fastify (Good) — Ecosystem maturity, middleware availability, team familiarity sufficient for MVP
- 07-01: Error handler checks specific before generic (Good) — CredencialesInvalidasError before ApplicationError ensures correct 401 code
- 07-01: Consistent error response structure (Good) — { success: false, error: { code, message } } for predictable client handling
- 07-01: Type assertions for validated params/query (Good) — Express built-in types strict, assertions safe after Zod parsing
- 07-02: Multer memoryStorage over diskStorage (Good) — Simpler for MVP, file passed directly to use case, no temp file cleanup
- 07-02: Explicit req.user checks over non-null assertions (Good) — ESLint forbids non-null assertions, guards ensure type safety
- 07-02: Type assertions after Zod validation (Good) — req.body is 'any' even after validation, safe to cast to validated type
- 07-02: Zod v4 pipe syntax for email (Good) — z.string().pipe(z.email()) per Zod v4 deprecation, caught by ESLint pre-commit

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 6-7 - Auth Infrastructure:**
- Need to implement IAuthService (JWT with jsonwebtoken)
- Need to implement IHashService (bcrypt for PIN hashing)
- Need to implement IUsuarioRepository (PostgreSQL adapter)

**Phase 8 - Infrastructure Testing:**
- Mock SIFEN responses required until certificate obtained
- CCFE certificate not available yet (homologation pending)
- Need timbrado de prueba from Marangatú for full testing

## Session Continuity

Last session: 2026-02-08
Stopped at: Completed 07-02 (Auth and Comercio routes), ready for 07-03 (Producto and Cliente routes)
Resume file: None
