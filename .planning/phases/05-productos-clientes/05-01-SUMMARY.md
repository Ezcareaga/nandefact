---
phase: 05-productos-clientes
plan: 01
subsystem: productos
tags: [domain, application, tdd, crud, validation]
requires: [01-application-layer]
provides:
  - Producto domain entity with validation
  - IProductoRepository port
  - CrearProducto use case
  - EditarProducto use case (field updates + soft-delete)
  - ListarProductos use case (paginated)
affects: [05-02-cliente-crud, 06-http-api]
tech-stack:
  added: []
  patterns:
    - Immutable entity methods (desactivar, actualizar)
    - Optional property handling (ProductoProps)
    - Paginated repository pattern
key-files:
  created:
    - nandefact-api/src/domain/producto/Producto.ts
    - nandefact-api/src/domain/producto/IProductoRepository.ts
    - nandefact-api/src/application/productos/CrearProducto.ts
    - nandefact-api/src/application/productos/EditarProducto.ts
    - nandefact-api/src/application/productos/ListarProductos.ts
    - nandefact-api/src/application/errors/ProductoNoEncontradoError.ts
    - nandefact-api/tests/unit/domain/entities/Producto.test.ts
    - nandefact-api/tests/unit/application/productos/CrearProducto.test.ts
    - nandefact-api/tests/unit/application/productos/EditarProducto.test.ts
    - nandefact-api/tests/unit/application/productos/ListarProductos.test.ts
  modified:
    - nandefact-api/src/infrastructure/sifen/SifenGatewayImpl.ts
key-decisions:
  - decision: "Immutable update methods over mutable setters"
    rationale: "desactivar() and actualizar() return new Producto instances. Prevents accidental mutation, easier to test, clear intent."
    status: good
  - decision: "Optional properties via conditional assignment"
    rationale: "TypeScript exactOptionalPropertyTypes prevents undefined in optional props. Assign only when defined to satisfy type checker."
    status: good
  - decision: "Paginated findByComercio with options object"
    rationale: "IProductoRepository.findByComercio accepts { page, pageSize, soloActivos }. Flexible, extensible, clean API."
    status: good
  - decision: "TasaIVA validation in entity constructor"
    rationale: "Only 10, 5, or 0 allowed per Paraguay tax law. Domain enforces business rule, application can't create invalid producto."
    status: good
metrics:
  tests-added: 46
  tests-total: 259
  duration: 7
completed: 2026-02-08
---

# Phase 05 Plan 01: Producto CRUD Summary

**One-liner:** Domain entity + three use cases for managing product catalog (create, edit, list) with PYG integer pricing and IVA validation.

## Performance

- **Execution time:** 7 minutes
- **Tests added:** 46 (27 domain + 19 application)
- **Tests total:** 259 (all passing, zero regressions)
- **Commits:** 2

## Accomplishments

### Task 1: Producto Entity + IProductoRepository Port + Domain Tests

**What was built:**

Created Producto domain entity following Cliente pattern. Validates:
- `nombre` non-empty after trim
- `precioUnitario` positive integer (PYG has no decimals)
- `unidadMedida` non-empty after trim
- `tasaIVA` must be 10, 5, or 0 (Paraguay tax rates)

Immutable update methods:
- `desactivar(): Producto` — soft delete, returns new instance with activo=false
- `actualizar(cambios): Producto` — merges changes, re-validates all rules, returns new instance

IProductoRepository port:
- `save(producto)` — create or update
- `findById(id)` — single lookup
- `findByComercio(comercioId, { page, pageSize, soloActivos })` — paginated list

**Tests (27):**
- Valid creation with all fields
- Defaults (activo=true, codigo/categoria=null)
- Rejects empty nombre/unidadMedida
- Rejects zero/negative/non-integer precio
- Rejects invalid tasaIVA (not 10/5/0)
- Accepts all valid tasaIVA values
- desactivar() returns new instance
- actualizar() merges changes and re-validates
- Immutability verified (original unchanged)

**Technical notes:**
- DomainError path corrected (errors/ not shared/)
- Optional properties handled via conditional assignment to satisfy exactOptionalPropertyTypes
- Follows established entity pattern (Cliente, Factura)

### Task 2: CrearProducto + EditarProducto + ListarProductos Use Cases + Tests

**What was built:**

**CrearProducto:**
- Input: comercioId, nombre, codigo?, precioUnitario, unidadMedida, tasaIVA, categoria?
- Output: { productoId }
- Flow: validate comercio exists → generate UUID → create Producto entity → save
- Throws: ComercioNoEncontradoError, DomainError (validation)

**EditarProducto:**
- Input: productoId, cambios { nombre?, codigo?, precioUnitario?, unidadMedida?, tasaIVA?, categoria?, activo? }
- Output: void
- Flow: load producto → if activo=false use desactivar(), else use actualizar() → save
- Throws: ProductoNoEncontradoError, DomainError (validation)

**ListarProductos:**
- Input: comercioId, page?, pageSize?, soloActivos?
- Output: { productos[], total, page, pageSize }
- Defaults: page=1, pageSize=20, soloActivos=true
- Flow: call repository.findByComercio → map to DTOs → return paginated result

**Tests (19):**
- CrearProducto: success, comercio not found, domain validation errors propagate
- EditarProducto: update single field, update multiple fields, soft-delete, producto not found, validation errors
- ListarProductos: paginated list, empty list, custom page/pageSize, includes inactive when soloActivos=false, DTO mapping

**Additional work (Rule 3 - Blocking):**
- Fixed unused import `ConsultaRUCResponse` in SifenGatewayImpl (blocking ESLint)
- Fixed unused parameter `ruc` in consultarRUC stub (renamed to `_ruc`)
- Removed async from consultarRUC stub (throws immediately, no await needed)

## Task Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 4b4a8f7 | feat(05-01): add Producto entity with validation and IProductoRepository port |
| 2 | a195a5a | feat(05-01): add CrearProducto, EditarProducto, ListarProductos use cases |

## Files Created

**Domain:**
- src/domain/producto/Producto.ts
- src/domain/producto/IProductoRepository.ts

**Application:**
- src/application/productos/CrearProducto.ts
- src/application/productos/EditarProducto.ts
- src/application/productos/ListarProductos.ts
- src/application/errors/ProductoNoEncontradoError.ts

**Tests:**
- tests/unit/domain/entities/Producto.test.ts
- tests/unit/application/productos/CrearProducto.test.ts
- tests/unit/application/productos/EditarProducto.test.ts
- tests/unit/application/productos/ListarProductos.test.ts

## Files Modified

- src/infrastructure/sifen/SifenGatewayImpl.ts (fixed unused import blocking commit)

## Decisions Made

**Immutable update methods over mutable setters:**
- `desactivar()` and `actualizar()` return new Producto instances
- Prevents accidental mutation, easier to test, clear intent
- Consistent with functional programming best practices
- Status: Good

**Optional properties via conditional assignment:**
- TypeScript `exactOptionalPropertyTypes: true` prevents `undefined` in optional props
- Use pattern: `const props: ProductoProps = { ...required }; if (optional) props.optional = optional;`
- Satisfies type checker without `as any` or disabling rules
- Status: Good

**Paginated findByComercio with options object:**
- `IProductoRepository.findByComercio(comercioId, { page?, pageSize?, soloActivos? })`
- Flexible, extensible, clean API
- Returns `{ productos: Producto[]; total: number }`
- Status: Good

**TasaIVA validation in entity constructor:**
- Only 10, 5, or 0 allowed (Paraguay tax law)
- Domain enforces business rule at entity creation
- Application layer can't create invalid producto
- Status: Good

## Deviations from Plan

**Rule 3 - Blocking Issue (ESLint errors):**
- **Found during:** Task 2 commit attempt
- **Issue:** Unused import `ConsultaRUCResponse` and unused parameter `ruc` in SifenGatewayImpl.consultarRUC stub
- **Fix:** Removed unused import, renamed parameter to `_ruc`, removed `async` keyword (function throws immediately)
- **Files modified:** src/infrastructure/sifen/SifenGatewayImpl.ts
- **Commit:** Included in a195a5a

## Issues Encountered

**TypeScript exactOptionalPropertyTypes errors:**
- **Issue:** Cannot assign `string | undefined` to optional `string` property when using spread operator or direct object literals
- **Root cause:** `exactOptionalPropertyTypes: true` in tsconfig enforces strict optional handling
- **Solution:** Build props object with required fields, conditionally add optional fields only when defined
- **Pattern established:** Used in both Producto entity methods and CrearProducto use case
- **Impact:** Adds 2-3 lines per immutable method, but maintains type safety without disabling rules

**ESLint pre-commit hook failures:**
- **Issue:** Multiple attempts blocked by unused imports/parameters
- **Root cause:** SifenGatewayImpl has stub method `consultarRUC` that was left with unused code from earlier implementation
- **Solution:** Clean up unused imports, rename unused parameter with `_` prefix, remove unnecessary `async`
- **Lesson:** Always run full linter before attempting commits, not just tests

## Next Phase Readiness

**For 05-02 (Cliente CRUD):**
- ✅ Producto CRUD pattern established (can replicate for Cliente)
- ✅ Pagination pattern defined in IProductoRepository (apply to IClienteRepository)
- ✅ Soft-delete pattern working (EditarProducto uses desactivar())
- ✅ Optional property handling pattern documented

**For 06 (HTTP REST API):**
- ✅ Use cases ready for HTTP endpoints:
  - POST /api/v1/productos → CrearProducto
  - PUT /api/v1/productos/:id → EditarProducto
  - GET /api/v1/productos → ListarProductos
- ✅ DTOs defined (Input/Output interfaces)
- ✅ Error types defined (ProductoNoEncontradoError for 404 responses)

**Blockers:** None

**Concerns:** None

## Self-Check: PASSED

All files created and all commits exist.
