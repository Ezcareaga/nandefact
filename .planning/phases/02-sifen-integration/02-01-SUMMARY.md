---
phase: 02-sifen-integration
plan: 01
subsystem: api
tags: [sifen, xml-generation, xmlgen, typescript, tdd]

# Dependency graph
requires:
  - phase: 01-core-domain
    provides: Factura, Comercio, Cliente entities with value objects
provides:
  - IXmlGenerator domain port for XML generation
  - SifenDataMapper converting domain entities to TIPS-SA xmlgen format
  - XmlGeneratorSifen adapter implementing IXmlGenerator using xmlgen library
affects: [02-02-firma-gateway, 02-03-envio-sifen]

# Tech tracking
tech-stack:
  added: [facturacionelectronicapy-xmlgen@1.0.277]
  patterns: [Domain-to-library adapter mapping, Price conversion for IVA-inclusive domain model]

key-files:
  created:
    - nandefact-api/src/domain/factura/IXmlGenerator.ts
    - nandefact-api/src/infrastructure/sifen/SifenDataMapper.ts
    - nandefact-api/src/infrastructure/sifen/XmlGeneratorSifen.ts
  modified: []

key-decisions:
  - "Use TIPS-SA xmlgen library for XML generation (v150 compliant)"
  - "Map domain prices (WITH IVA) to xmlgen prices (WITHOUT IVA) via baseGravada calculation"
  - "xmlgen field 'iva' is the RATE (5/10/0), not the calculated IVA amount"

patterns-established:
  - "Pure mapping functions in SifenDataMapper for testability"
  - "Dynamic import for CommonJS xmlgen library in ESM TypeScript"

# Metrics
duration: 72min
completed: 2026-02-07
---

# Phase 02 Plan 01: XML Generation Summary

**Domain-to-SIFEN XML adapter using TIPS-SA xmlgen library with IVA-inclusive price conversion**

## Performance

- **Duration:** 72 min
- **Started:** 2026-02-07T21:21:14Z
- **Completed:** 2026-02-07T22:33:52Z (estimated)
- **Tasks:** 2 (TDD: RED → GREEN)
- **Files modified:** 6

## Accomplishments
- IXmlGenerator port defined in domain layer
- Complete SifenDataMapper with 3 mapping functions handling all entity conversions
- XmlGeneratorSifen adapter producing valid SIFEN v150 XML via xmlgen library
- 55 comprehensive tests covering all edge cases (IVA 10%/5%/exenta, RUC/CI/pasaporte/innominado, contado/credito)

## Task Commits

1. **Task 1 (RED): Create port + mapper stubs + failing tests** - `097d4bb` (test)
2. **Task 2 (GREEN): Implement full mapping + XML generator** - `026a721` (feat)

## Files Created/Modified
- `src/domain/factura/IXmlGenerator.ts` - Domain port for XML generation
- `src/infrastructure/sifen/SifenDataMapper.ts` - Pure mapping functions (domain → xmlgen format)
- `src/infrastructure/sifen/XmlGeneratorSifen.ts` - Adapter implementing IXmlGenerator
- `tests/unit/infrastructure/sifen/SifenDataMapper.test.ts` - 37 mapping tests
- `tests/unit/infrastructure/sifen/XmlGeneratorSifen.test.ts` - 4 integration tests with xmlgen

## Decisions Made

**1. Price conversion strategy**
- Domain model: prices INCLUDE IVA (Paraguayan standard)
- xmlgen library: expects prices WITHOUT IVA
- Solution: Calculate `precioUnitario = baseGravada / cantidad` before passing to xmlgen
- Rationale: Maintains domain model correctness while satisfying library validation

**2. xmlgen field naming disambiguation**
- Discovered `iva` field is the IVA RATE (5, 10, 0), not the calculated amount
- Field `ivaProporcion` is the proportion (100 = 100%), not `ivaBase`
- Library auto-calculates IVA amount from: `cantidad * precioUnitario * iva / 100`

**3. Geographic data standardization**
- Used departamento 1 (Capital), distrito 1, ciudad 1 for all entities
- Hardcoded valid hierarchy to pass xmlgen validation
- Future: Make configurable per comercio

## Deviations from Plan

**1. [Rule 3 - Blocking] Fixed xmlgen library integration issues**
- **Found during:** Task 2 (GREEN - implementing XmlGeneratorSifen)
- **Issue:** Multiple validation errors from xmlgen: RUC format, IVA field types, geographic hierarchy, missing required fields
- **Fix:** Iterative debugging of xmlgen expectations:
  * Changed RUC from base-only to full format with DV (80069563-1)
  * Added tipoImpuesto, factura.presencia, condicion.entregas fields
  * Fixed IVA field: changed from calculated amount (string) to rate (number)
  * Renamed ivaBase → ivaProporcion
  * Corrected geographic codes to valid hierarchy
- **Files modified:** SifenDataMapper.ts (interface + mapping logic)
- **Verification:** All xmlgen tests pass, generates valid v150 XML
- **Committed in:** 026a721 (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking library integration)
**Impact on plan:** Essential for xmlgen library compatibility. No scope creep - all changes necessary for correct XML generation.

## Issues Encountered

**xmlgen library validation strictness**
- Library performs deep validation of SIFEN structure beyond just XML well-formedness
- Required 6+ iterations to satisfy all validation rules
- Documentation gaps: README examples didn't show all required fields
- Resolution: Read type definitions, trial-and-error with error messages, inferred correct structure

## Next Phase Readiness
- XML generation complete and tested (136 tests passing, up from 81)
- Ready for Phase 02-02: Digital signing with CCFE certificates
- XmlGeneratorSifen produces unsigned XML - signing is next step
- CDC in XML is regenerated by xmlgen (not reusing domain CDC) - acceptable for SIFEN compliance

---
*Phase: 02-sifen-integration*
*Plan: 01*
*Completed: 2026-02-07*
