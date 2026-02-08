---
phase: 03-sync-queue
plan: 02
subsystem: infrastructure
tags: [bullmq, ioredis, redis, queue, async, worker, logging, retry]

# Dependency graph
requires:
  - phase: 03-sync-queue
    plan: 01
    provides: ISyncQueue port, SyncJob value object, ProcesarColaSifen use case
provides:
  - SyncQueueBullMQ adapter implementing ISyncQueue with Redis backend
  - SyncWorker for BullMQ job processing with FIFO and rate limiting
  - ConsoleLogger for structured JSON logging
  - Exponential backoff retry strategy (1s, 2s, 4s, 8s, 16s)
affects: [03-03-api-endpoints, 04-sync-mobile, production-deployment]

# Tech tracking
tech-stack:
  added:
    - bullmq: Redis-backed job queue with retries and rate limiting
    - ioredis: Redis client (BullMQ dependency)
  patterns:
    - "BullMQ Worker with concurrency=1 for strict FIFO processing"
    - "Exponential backoff retry delays calculated at adapter layer"
    - "Structured JSON logging with consistent context fields"

key-files:
  created:
    - nandefact-api/src/infrastructure/queue/SyncQueueBullMQ.ts
    - nandefact-api/src/infrastructure/queue/SyncWorker.ts
    - nandefact-api/src/infrastructure/logging/ConsoleLogger.ts
    - nandefact-api/tests/unit/infrastructure/queue/SyncQueueBullMQ.test.ts
    - nandefact-api/tests/unit/infrastructure/queue/SyncWorker.test.ts
    - nandefact-api/tests/unit/infrastructure/logging/ConsoleLogger.test.ts
  modified:
    - nandefact-api/package.json

key-decisions:
  - "Concurrency=1 for strict FIFO: Ensures facturas are processed in exact order enqueued"
  - "Rate limiting 10 jobs/min: Prevents overwhelming SIFEN API with burst traffic"
  - "Exponential backoff in adapter: Domain remains pure, retry delays calculated in infrastructure"
  - "Mock BullMQ in tests: Unit tests don't require running Redis instance"

patterns-established:
  - "Port adapters in infrastructure layer implement domain interfaces"
  - "Structured logging with comercioId and CDC context for traceability"
  - "Worker deserializes Redis job data to domain value objects before processing"

# Metrics
duration: 4min
completed: 2026-02-08
---

# Phase 03 Plan 02: BullMQ Adapter Summary

**Redis-backed async queue with BullMQ implementing ISyncQueue port, exponential backoff retry (1s→16s), FIFO worker processing, and structured JSON logging**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-08T03:47:06Z
- **Completed:** 2026-02-08T03:51:20Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- SyncQueueBullMQ adapter connects domain layer to Redis-backed BullMQ queue
- Exponential backoff retry strategy with delays: 1s, 2s, 4s, 8s, 16s
- SyncWorker processes jobs with concurrency=1 (strict FIFO) and rate limiting (10/min)
- ConsoleLogger outputs structured JSON for observability
- Date serialization/deserialization between SyncJob and Redis
- All 172 tests passing (151 existing + 21 new, zero regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install BullMQ + implement SyncQueueBullMQ and ConsoleLogger** - `35e900b` (feat)
2. **Task 2: Implement SyncWorker connecting BullMQ to ProcesarColaSifen** - `18e2440` (feat)

**Plan metadata:** `610e933` (feat: squashed merge to main)

## Files Created/Modified

**Infrastructure - Queue:**
- `nandefact-api/src/infrastructure/queue/SyncQueueBullMQ.ts` - BullMQ adapter implementing ISyncQueue port
- `nandefact-api/src/infrastructure/queue/SyncWorker.ts` - BullMQ Worker that processes jobs via ProcesarColaSifen
- `nandefact-api/tests/unit/infrastructure/queue/SyncQueueBullMQ.test.ts` - 8 tests for queue adapter
- `nandefact-api/tests/unit/infrastructure/queue/SyncWorker.test.ts` - 8 tests for worker

**Infrastructure - Logging:**
- `nandefact-api/src/infrastructure/logging/ConsoleLogger.ts` - Structured JSON logger implementing ILogger
- `nandefact-api/tests/unit/infrastructure/logging/ConsoleLogger.test.ts` - 5 tests for logger

**Dependencies:**
- `nandefact-api/package.json` - Added bullmq and ioredis

## Decisions Made

1. **Concurrency=1 for strict FIFO:** BullMQ Worker configured with concurrency: 1 to ensure facturas are processed in exact order enqueued. SIFEN requires sequential processing per establecimiento+punto, and this simplifies error handling.

2. **Rate limiting 10 jobs/min:** Prevents overwhelming SIFEN API with burst traffic. Conservative limit allows monitoring real-world usage before tuning.

3. **Exponential backoff in adapter layer:** calcularBackoff() method in SyncQueueBullMQ keeps domain layer pure. Retry delays (1s, 2s, 4s, 8s, 16s) balance quick recovery from transient failures with avoiding server throttling.

4. **Mock BullMQ in tests:** Unit tests use vi.mock('bullmq') to avoid requiring running Redis. Integration tests in future phase will test against real Redis.

5. **Date serialization via ISO strings:** SyncJob dates serialized to ISO strings for Redis storage, deserialized back to Date objects when retrieved. Ensures timezone-safe storage.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Issue 1: TypeScript exactOptionalPropertyTypes error in deserializeJob**
- `ultimoError` type mismatch when passing `string | undefined` to SyncJobProps
- **Resolution:** Changed `data.ultimoError as string | undefined` to `(data.ultimoError as string) ?? undefined`
- **Impact:** Minor, fixed in 30 seconds. Same pattern as plan 03-01.

**Issue 2: Test assertion expected `undefined` as second argument**
- Logger call with no context doesn't pass `undefined`, just omits argument
- **Resolution:** Removed `undefined` from assertion, changed `.toHaveBeenCalledWith('message', undefined)` to `.toHaveBeenCalledWith('message')`
- **Impact:** Minor, fixed in 15 seconds.

## User Setup Required

None - no external service configuration required.

**Redis setup for production:**
- Will be addressed in deployment phase (Phase 08 - Infrastructure)
- For local development, developers will need Redis running (docker-compose will handle this)

## Next Phase Readiness

**Ready for plan 03-03 (API endpoints + wiring):**
- SyncQueueBullMQ ready to be dependency-injected into use cases
- SyncWorker ready to be started on server boot
- ConsoleLogger ready for application-wide logging
- No blockers

**Test coverage:** 172 total tests (21 new queue/worker/logger tests added, zero regressions)

---
*Phase: 03-sync-queue*
*Completed: 2026-02-08*

## Self-Check: PASSED

All files created:
- nandefact-api/src/infrastructure/queue/SyncQueueBullMQ.ts ✓
- nandefact-api/src/infrastructure/queue/SyncWorker.ts ✓
- nandefact-api/src/infrastructure/logging/ConsoleLogger.ts ✓

All commits exist:
- 35e900b ✓
- 18e2440 ✓
- 610e933 ✓
