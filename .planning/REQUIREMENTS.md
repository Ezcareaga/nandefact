# Requirements: ÑandeFact

**Defined:** 2026-02-07
**Core Value:** Doña María puede facturar electrónicamente desde su puesto en el mercado en menos de 30 segundos, con o sin internet, cumpliendo todas las reglas SIFEN/DNIT.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Facturación

- [x] **FACT-01**: Sistema puede crear factura con CDC, items, IVA calculado, y guardarla con estado pendiente
- [x] **FACT-02**: Sistema puede firmar XML con CCFE y enviar DE a SIFEN (siRecepDE)
- [x] **FACT-03**: Sistema procesa cola de facturas pendientes en orden FIFO con backoff exponencial
- [ ] **FACT-04**: Sistema puede anular DTE aprobado via evento cancelación SIFEN
- [ ] **FACT-05**: Sistema puede inutilizar rangos de numeración salteados
- [x] **FACT-06**: Sistema puede consultar estado de DE por CDC (siConsDE)

### KuDE

- [ ] **KUDE-01**: Sistema genera PDF KuDE con datos factura, totales IVA, QR code
- [ ] **KUDE-02**: Puerto INotificador implementado (interfaz lista para WhatsApp, sin Meta API)

### Productos

- [ ] **PROD-01**: Usuario puede crear producto con nombre, precio PYG, tasa IVA, unidad medida
- [ ] **PROD-02**: Usuario puede editar y desactivar productos existentes
- [ ] **PROD-03**: API devuelve lista paginada de productos por comercio

### Clientes

- [ ] **CLIE-01**: Usuario puede crear cliente con CI/RUC o como innominado
- [ ] **CLIE-02**: Usuario puede buscar cliente por nombre/RUC/CI con autocompletado
- [ ] **CLIE-03**: Sistema puede validar RUC del cliente contra SIFEN (siConsRUC)

### Comercio

- [ ] **COME-01**: Admin puede registrar comercio con RUC, razón social, establecimiento
- [ ] **COME-02**: Admin puede cargar certificado CCFE (.p12/.pfx), encriptado AES-256
- [ ] **COME-03**: Admin puede configurar timbrado activo por punto de expedición

### Auth

- [ ] **AUTH-01**: Usuario puede login con teléfono + PIN (JWT access 15min + refresh 7d)
- [ ] **AUTH-02**: Rate limiting: 5 intentos PIN → bloqueo 30 min

### Infraestructura

- [ ] **INFR-01**: Docker Compose producción con PostgreSQL 16 + Redis 7 + API
- [ ] **INFR-02**: Tests de integración con base de datos real (Docker)
- [ ] **INFR-03**: Tests e2e del flujo crear factura → enviar SIFEN → aprobar

### Android App

- [ ] **APP-01**: Pantalla facturación: seleccionar productos, elegir cliente, facturar en <30s
- [ ] **APP-02**: Lista facturas con filtros y estado SIFEN visible
- [ ] **APP-03**: Gestión de productos desde la app (CRUD)
- [ ] **APP-04**: Sync engine offline-first con cola local SQLDelight, sync automático

## v2 Requirements

### Documentos adicionales

- **DOC-01**: Nota de Débito Electrónica (tipo 6)
- **DOC-02**: Nota de Remisión Electrónica (tipo 7)

### Notificaciones

- **NOTF-01**: Envío KuDE via WhatsApp Cloud API (Meta API real)
- **NOTF-02**: Notificaciones push de estado factura

### Operaciones

- **OPER-01**: Templates de productos por rubro (carga rápida)
- **OPER-02**: Reportes de ventas diarios/mensuales
- **OPER-03**: Dashboard admin web

### Plataforma

- **PLAT-01**: App iOS (SwiftUI consumiendo shared/ KMP)
- **PLAT-02**: Soporte multi-moneda (USD, BRL)
- **PLAT-03**: Condición de pago crédito (cuotas)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Eventos del receptor (Conformidad, Disconformidad) | SIFEN no los requiere para emisores, complejidad innecesaria |
| Autofactura electrónica | No aplica a comerciantes de mercado |
| Factura de exportación | Fuera del perfil de usuario target |
| Real-time chat/soporte | No es core, puede usar WhatsApp directo |
| Multi-tenancy SaaS | MVP es single-tenant, escalar después |
| Integración contable (ERP) | Fuera del scope del mercadito |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FACT-01 | Phase 1 - Application Layer | Complete |
| FACT-02 | Phase 2 - SIFEN Integration | Complete |
| FACT-03 | Phase 3 - Sync & Queue | Complete |
| FACT-04 | Phase 4 - Events & KuDE | Pending |
| FACT-05 | Phase 4 - Events & KuDE | Pending |
| FACT-06 | Phase 2 - SIFEN Integration | Complete |
| KUDE-01 | Phase 4 - Events & KuDE | Pending |
| KUDE-02 | Phase 4 - Events & KuDE | Pending |
| PROD-01 | Phase 5 - Productos & Clientes | Pending |
| PROD-02 | Phase 5 - Productos & Clientes | Pending |
| PROD-03 | Phase 5 - Productos & Clientes | Pending |
| CLIE-01 | Phase 5 - Productos & Clientes | Pending |
| CLIE-02 | Phase 5 - Productos & Clientes | Pending |
| CLIE-03 | Phase 5 - Productos & Clientes | Pending |
| COME-01 | Phase 6 - Comercio & Auth | Pending |
| COME-02 | Phase 6 - Comercio & Auth | Pending |
| COME-03 | Phase 6 - Comercio & Auth | Pending |
| AUTH-01 | Phase 6 - Comercio & Auth | Pending |
| AUTH-02 | Phase 6 - Comercio & Auth | Pending |
| INFR-01 | Phase 8 - Infrastructure Testing | Pending |
| INFR-02 | Phase 8 - Infrastructure Testing | Pending |
| INFR-03 | Phase 8 - Infrastructure Testing | Pending |
| APP-01 | Phase 10 - Android UI | Pending |
| APP-02 | Phase 10 - Android UI | Pending |
| APP-03 | Phase 10 - Android UI | Pending |
| APP-04 | Phase 9 - Android Shared KMP | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-08 after Phase 2 completion*
