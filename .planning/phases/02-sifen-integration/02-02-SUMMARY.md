---
phase: 02
plan: 02
subsystem: sifen-integration
tags: [sifen, xmlsign, setapi, soap, firma-digital, gateway]
requires:
  - domain-factura-entities
provides:
  - firma-digital-adapter
  - sifen-gateway-adapter
  - sifen-config
affects:
  - 02-03-xml-generation
tech-stack:
  added:
    - facturacionelectronicapy-xmlsign@1.0.28
    - facturacionelectronicapy-setapi@1.0.34
  patterns:
    - adapter-pattern
    - dependency-injection
key-files:
  created:
    - nandefact-api/src/infrastructure/sifen/FirmaDigitalSifen.ts
    - nandefact-api/src/infrastructure/sifen/SifenGatewayImpl.ts
    - nandefact-api/src/infrastructure/sifen/SifenConfig.ts
    - nandefact-api/tests/unit/infrastructure/sifen/FirmaDigitalSifen.test.ts
    - nandefact-api/tests/unit/infrastructure/sifen/SifenGatewayImpl.test.ts
  modified:
    - nandefact-api/package.json
    - nandefact-api/package-lock.json
decisions:
  - decision: Use type assertions for TIPS-SA CommonJS modules
    rationale: TypeScript definitions don't match actual exports
    alternatives: Fork libraries, create custom type definitions
    chosen: Type assertions (simplest, maintainable)
  - decision: Mock fs.readFileSync in tests
    rationale: Tests should not require real certificate files
    alternatives: Use real test certificates, dependency injection for fs
    chosen: Mock fs module (simplest for unit tests)
  - decision: Parse SIFEN responses defensively (XML string and objects)
    rationale: SIFEN API might return different formats
    alternatives: Strict type checking, force XML parsing
    chosen: Defensive parsing with extractXmlValue helper
metrics:
  duration: 5 minutes
  completed: 2026-02-07
---

# Phase [02] Plan [02]: Signing and Gateway Implementation Summary

Firma digital XMLDSig con certificados CCFE y comunicación SIFEN SOAP usando librerías TIPS-SA con mocks completos

## Objective Achieved

Implementados adaptadores FirmaDigitalSifen y SifenGatewayImpl que implementan los puertos de dominio IFirmaDigital e ISifenGateway. FirmaDigitalSifen firma XML con certificados CCFE (RSA-2048, SHA-256). SifenGatewayImpl se comunica con SIFEN Web Services para enviar DE, consultar estado y anular documentos. Ambos testeados con mocks completos.

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 (RED) | 77721c3 | test(02-02): add failing tests for FirmaDigitalSifen and SifenGatewayImpl |
| 2 (GREEN) | 327c360 | feat(02-02): implement FirmaDigitalSifen and SifenGatewayImpl |
| Metadata | 2249adb | feat(02-02): implement signing and SIFEN gateway adapters (squash merge to main) |

## What Was Built

### FirmaDigitalSifen
- Implementa `IFirmaDigital` del dominio
- Usa `facturacionelectronicapy-xmlsign` para firma XMLDSig
- Firma XML con certificado CCFE (PKCS#12)
- Parámetros: ruta certificado y password desde SifenConfig
- Tests: 4 tests con mocks de xmlsign

### SifenGatewayImpl
- Implementa `ISifenGateway` del dominio
- Usa `facturacionelectronicapy-setapi` para comunicación SOAP
- Métodos implementados:
  - `enviarDE`: envía DE firmado a SIFEN (siRecepDE)
  - `consultarEstado`: consulta estado por CDC (siConsDE)
  - `anularDE`: envía evento de cancelación (siRecepEvento)
- Parser defensivo de respuestas SIFEN (XML y objetos)
- Códigos SIFEN:
  - `0260`: aprobado
  - `0261`: aprobado con observación
  - `0300+`: rechazado
- Tests: 11 tests con mocks de setApi y fs

### SifenConfig
- Configuración centralizada SIFEN
- Props: environment (test/prod), certificatePath, certificatePassword
- Validación de parámetros requeridos
- Getter `baseUrl` devuelve URL test/prod según environment
- Getter methods para certificatePath, certificatePassword, privateKeyPath

## Technical Implementation

### Libraries Installed
```json
{
  "facturacionelectronicapy-xmlsign": "^1.0.28",
  "facturacionelectronicapy-setapi": "^1.0.34"
}
```

### Type Assertions for CommonJS Modules
Las librerías TIPS-SA exportan instancias pero las definiciones TypeScript están incorrectas. Solución: type assertions.

```typescript
import xmlsignModule from 'facturacionelectronicapy-xmlsign';
const xmlsign = xmlsignModule as any;
```

### Defensive Response Parsing
SifenGatewayImpl parsea respuestas SIFEN de forma defensiva:
- Soporta XML string y objetos ya parseados
- Helper `extractXmlValue` con regex para extraer valores de XML
- Fallback a campos alternativos (dCodRes/codigo, dMsgRes/mensaje, CDC/cdc)

### Mock Strategy
Tests mockeados completamente:
- `facturacionelectronicapy-xmlsign`: mock de signXML
- `facturacionelectronicapy-setapi`: mock de recibe/consulta/evento
- `fs`: mock de readFileSync para evitar requerir certificados reales

## Tests

**Total tests del plan:** 15 (todos pasando)

### FirmaDigitalSifen (4 tests)
1. Debe llamar a xmlsign con XML, ruta certificado y password
2. Debe retornar XML firmado
3. Debe propagar error si firma falla
4. Debe usar certificatePath y certificatePassword de SifenConfig

### SifenGatewayImpl (11 tests)
**enviarDE (5 tests):**
1. Debe llamar a setApi.recibe con XML firmado y entorno test
2. Debe parsear respuesta aprobada (0260)
3. Debe parsear respuesta rechazada (0300)
4. Debe parsear aprobada con observación (0261)
5. Debe propagar error de red

**consultarEstado (3 tests):**
6. Debe llamar a setApi.consulta con CDC y entorno
7. Debe retornar estado del DE
8. Debe manejar DE no encontrado

**anularDE (3 tests):**
9. Debe llamar a setApi.evento
10. Debe retornar cancelación exitosa
11. Debe retornar cancelación fallida

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict mode error in extractXmlValue**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** `match[1]` could be undefined with strictNullChecks
- **Fix:** Changed `match[1]` to `match && match[1]` guard clause
- **Files modified:** SifenGatewayImpl.ts
- **Commit:** 327c360

**2. [Rule 2 - Missing Critical] Added fs module mock in tests**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Tests failing with ENOENT because fs.readFileSync called for real
- **Fix:** Added vi.mock('fs') and mocked readFileSync to return fake cert data
- **Files modified:** SifenGatewayImpl.test.ts
- **Commit:** 327c360 (part of implementation)

**3. [Rule 1 - Bug] Fixed test expectations for actual API signatures**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Tests expected only (xml, env) but actual API is (id, xml, env, cert, password)
- **Fix:** Updated test expectations to match actual TIPS-SA API signatures
- **Files modified:** SifenGatewayImpl.test.ts
- **Commit:** 327c360

## Known Limitations

1. **TIPS-SA type definitions**: Librerías CommonJS con type definitions incorrectas requieren `as any` assertions.
2. **Evento XML simplificado**: `anularDE` construye XML evento simplificado, plan futuro debe usar facturacionelectronicapy-xmlgen para evento completo.
3. **Certificado en memoria**: `fs.readFileSync` lee certificado en cada llamada, optimización futura: cache en memoria.
4. **Parser regex simple**: `extractXmlValue` usa regex, alternativa futura: xml2js parser robusto.

## Dependencies & Integration

### Depends on
- Phase 01 domain entities (Factura, IFirmaDigital, ISifenGateway)

### Enables
- Plan 02-03 XML generation (usará FirmaDigitalSifen para firmar)
- Plan 02-04 End-to-end SIFEN flow (usará SifenGatewayImpl para enviar)

### Integration Points
- `IFirmaDigital`: puerto implementado por FirmaDigitalSifen
- `ISifenGateway`: puerto implementado por SifenGatewayImpl
- `SifenConfig`: usado por ambos adaptadores, compartible con XmlGeneratorSifen

## Next Phase Readiness

**Plan 02-03 (XML Generation) puede proceder:**
- [x] Firma digital implementada y testeada
- [x] SifenConfig disponible para compartir configuración
- [x] Pattern de mocks establecido

**Blocker:** Ninguno

**Concern:** Plan 02-01 (SifenDataMapper) está en paralelo y tiene fallos en tests. Ambos planes instalaron paquetes TIPS-SA diferentes (02-01: xmlgen, 02-02: xmlsign/setapi). Al merge, verificar que todos los paquetes estén en package.json.

## Git Workflow

**Branch strategy:** Per-plan branching (feat/02-02-firma-gateway)

**Commits:**
1. RED phase: 77721c3 (skeletons + failing tests)
2. GREEN phase: 327c360 (implementation passing tests)
3. Squash merge: 2249adb (to main)

**Parallel execution:** Plan 02-01 (SifenDataMapper) corrió en paralelo. Sus cambios stasheados al hacer merge de 02-02. Al merge final, ambos planes combinados en un commit.

## Performance Notes

- **Execution time:** ~5 minutos (RED + GREEN + commits)
- **Tests runtime:** 380ms (15 tests)
- **TypeScript compilation:** Clean (con type assertions)

## Self-Check: PASSED

**Created files verified:**
- [x] nandefact-api/src/infrastructure/sifen/FirmaDigitalSifen.ts
- [x] nandefact-api/src/infrastructure/sifen/SifenGatewayImpl.ts
- [x] nandefact-api/src/infrastructure/sifen/SifenConfig.ts
- [x] nandefact-api/tests/unit/infrastructure/sifen/FirmaDigitalSifen.test.ts
- [x] nandefact-api/tests/unit/infrastructure/sifen/SifenGatewayImpl.test.ts

**Commits verified:**
- [x] 77721c3: test(02-02): add failing tests for FirmaDigitalSifen and SifenGatewayImpl
- [x] 327c360: feat(02-02): implement FirmaDigitalSifen and SifenGatewayImpl
- [x] 2249adb: feat(02-02): implement signing and SIFEN gateway adapters (main)
