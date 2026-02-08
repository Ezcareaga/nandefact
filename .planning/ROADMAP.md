# Roadmap: ÑandeFact

## Overview

Build production-ready backend (Application Layer → Infrastructure → API) and Android MVP for offline-first electronic invoicing compliant with SIFEN regulations. Foundation complete (59 tests), now delivering business logic, external integrations, REST API, comprehensive testing, and mobile app with sync engine.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Application Layer** - Core use cases (CrearFactura, EnviarDE, etc.)
- [x] **Phase 2: SIFEN Integration** - XML generation, signature, SOAP communication
- [ ] **Phase 3: Sync & Queue** - Offline processing with backoff, FIFO queue
- [ ] **Phase 4: Events & KuDE** - Cancelation, inutilization, PDF generation
- [ ] **Phase 5: Productos & Clientes** - CRUD use cases, validation, search
- [ ] **Phase 6: Comercio & Auth** - Setup, certificate management, JWT + PIN
- [ ] **Phase 7: API REST** - Express routes, Zod validation, endpoints
- [ ] **Phase 8: Infrastructure Testing** - Docker Compose, integration, e2e tests
- [ ] **Phase 9: Android Shared KMP** - Domain/data/sync in Kotlin Multiplatform
- [ ] **Phase 10: Android UI** - Jetpack Compose screens, offline-first sync

## Phase Details

### Phase 1: Application Layer
**Goal**: Implement core use cases that orchestrate domain logic and infrastructure ports
**Depends on**: Nothing (first phase after Foundation)
**Requirements**: FACT-01
**Success Criteria** (what must be TRUE):
  1. CrearFactura use case can create factura with CDC, items, IVA calculated, and save via repository port
  2. EnviarDE use case can retrieve pending factura, sign XML, and invoke SIFEN gateway port
  3. SincronizarPendientes use case can process queue of pending facturas in FIFO order
  4. AnularFactura use case can send cancelation event for approved DTE
  5. Unit tests validate use case behavior with mocked ports
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — CrearFactura use case + application errors + IComercioRepository port (TDD)
- [x] 01-02-PLAN.md — EnviarDE + AnularFactura use cases (TDD)
- [x] 01-03-PLAN.md — SincronizarPendientes use case (TDD)

### Phase 2: SIFEN Integration
**Goal**: Implement SIFEN gateway adapter with XML generation, signature, and SOAP communication
**Depends on**: Phase 1
**Requirements**: FACT-02, FACT-06
**Success Criteria** (what must be TRUE):
  1. System generates valid XML DE following SIFEN v150 specification (UTF-8, no namespace prefixes, correct structure)
  2. System signs XML with CCFE using XMLDSig (RSA-2048, SHA-256, enveloped signature)
  3. System successfully calls siRecepDE SOAP endpoint with mutual TLS
  4. System parses SIFEN response and maps codes (0260=aprobado, 0300+=rechazado)
  5. System can query DE status by CDC using siConsDE
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — IXmlGenerator port + SifenDataMapper + XmlGeneratorSifen adapter (TDD)
- [x] 02-02-PLAN.md — FirmaDigitalSifen + SifenGatewayImpl adapters (TDD)
- [x] 02-03-PLAN.md — Wire adapters into EnviarDE + SincronizarPendientes use cases

### Phase 3: Sync & Queue
**Goal**: Implement offline sync engine with FIFO queue processing and exponential backoff
**Depends on**: Phase 2
**Requirements**: FACT-03
**Success Criteria** (what must be TRUE):
  1. BullMQ queue processes pending facturas in FIFO order (oldest first)
  2. Failed jobs retry with exponential backoff (1s → 2s → 4s → 8s → 16s)
  3. System continues processing queue even if one factura fails
  4. System respects SIFEN 72-hour transmission window
  5. Queue worker logs all attempts with comercioId and CDC for debugging
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Events & KuDE
**Goal**: Implement SIFEN events (cancelation, inutilization) and KuDE PDF generation
**Depends on**: Phase 3
**Requirements**: FACT-04, FACT-05, KUDE-01, KUDE-02
**Success Criteria** (what must be TRUE):
  1. System sends evento cancelacion for approved DTE via siRecepEvento
  2. System sends evento inutilizacion for skipped number ranges
  3. System generates KuDE PDF with all mandatory fields (CDC, totales IVA, QR code)
  4. KuDE includes valid QR code with CDC + CSC hash and e-Kuatia URL
  5. INotificador port is implemented (interface ready for WhatsApp, no Meta API integration)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Productos & Clientes
**Goal**: Implement CRUD use cases for products and clients with validation
**Depends on**: Phase 1
**Requirements**: PROD-01, PROD-02, PROD-03, CLIE-01, CLIE-02, CLIE-03
**Success Criteria** (what must be TRUE):
  1. User can create product with nombre, precio PYG (integer), tasa IVA, unidad medida
  2. User can edit existing product and soft-delete (activo=false)
  3. System returns paginated list of products filtered by comercio
  4. User can create client with CI/RUC/pasaporte or as innominado
  5. System autocompletes client search by nombre/RUC/CI with debounce
  6. System validates RUC format and can query SIFEN siConsRUC for verification
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Comercio & Auth
**Goal**: Implement comercio setup, certificate management, and JWT + PIN authentication
**Depends on**: Phase 1
**Requirements**: COME-01, COME-02, COME-03, AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. Admin can register comercio with RUC, razon social, establecimiento, punto expedicion
  2. Admin can upload CCFE certificate (.p12/.pfx) which is encrypted with AES-256 before storage
  3. Admin can configure active timbrado with vigencia dates per punto de expedicion
  4. User can login with telefono + PIN (4-6 digits) and receive JWT access token (15min) + refresh token (7d)
  5. System enforces rate limiting: 5 failed PIN attempts triggers 30-minute lockout
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: API REST
**Goal**: Implement Express/Fastify HTTP layer with routes, Zod validation, and middleware
**Depends on**: Phases 1-6
**Requirements**: (no explicit requirement, but implied by all endpoints)
**Success Criteria** (what must be TRUE):
  1. API exposes POST /api/v1/facturas with Zod validation of payload
  2. API exposes GET /api/v1/facturas with pagination and filters (fecha, estado SIFEN)
  3. API exposes CRUD endpoints for productos, clientes, comercio
  4. API exposes POST /api/v1/auth/login and POST /api/v1/auth/refresh
  5. All protected routes validate JWT token in Authorization header
  6. API returns consistent error responses with status codes and messages
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Infrastructure Testing
**Goal**: Implement Docker Compose setup and comprehensive integration/e2e tests
**Depends on**: Phase 7
**Requirements**: INFR-01, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):
  1. Docker Compose runs PostgreSQL 16 + Redis 7 + API in isolated containers
  2. Integration tests run against real PostgreSQL database (not mocked)
  3. E2E test completes full flow: create factura → sign XML → mock SIFEN response → update estado
  4. Tests clean up database state after each run (transactions or teardown)
  5. CI pipeline can run all tests in Docker environment
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Android Shared KMP
**Goal**: Implement shared business logic in Kotlin Multiplatform (domain, data, sync)
**Depends on**: Phase 7 (needs API endpoints)
**Requirements**: APP-04 (sync engine)
**Success Criteria** (what must be TRUE):
  1. Shared module compiles for commonMain, androidMain, and iosMain targets
  2. Domain layer mirrors backend entities (Factura, Producto, Cliente, Comercio)
  3. Data layer uses Ktor Client for REST API calls with kotlinx.serialization
  4. SQLDelight schema stores facturas offline with estado (pendiente/enviado/aprobado)
  5. Sync engine detects network, pushes pending facturas via POST /api/v1/sync/push
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Android UI
**Goal**: Implement Jetpack Compose screens for facturacion, productos, clientes with offline-first UX
**Depends on**: Phase 9
**Requirements**: APP-01, APP-02, APP-03
**Success Criteria** (what must be TRUE):
  1. Facturacion screen lets user select products, choose client, and complete factura in under 30 seconds with 3-5 taps
  2. Screen shows immediate confirmation after "Facturar" tap (saved to SQLDelight locally)
  3. Lista facturas screen displays facturas with estado SIFEN visible (pending/aprobado/rechazado)
  4. User can filter facturas by fecha and estado
  5. Productos screen provides CRUD functionality (create, edit, soft-delete)
  6. WorkManager schedules background sync when network available
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD
- [ ] 10-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Application Layer | 3/3 | Complete | 2026-02-07 |
| 2. SIFEN Integration | 3/3 | Complete | 2026-02-08 |
| 3. Sync & Queue | 0/TBD | Not started | - |
| 4. Events & KuDE | 0/TBD | Not started | - |
| 5. Productos & Clientes | 0/TBD | Not started | - |
| 6. Comercio & Auth | 0/TBD | Not started | - |
| 7. API REST | 0/TBD | Not started | - |
| 8. Infrastructure Testing | 0/TBD | Not started | - |
| 9. Android Shared KMP | 0/TBD | Not started | - |
| 10. Android UI | 0/TBD | Not started | - |
