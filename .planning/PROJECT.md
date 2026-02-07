# ÑandeFact

## What This Is

Sistema de facturación electrónica SIFEN para comerciantes de mercados populares paraguayos (Mercado 4, Ciudad del Este). App Android optimizada para Samsung Galaxy A03 (2GB RAM) que genera facturas en menos de 30 segundos, funciona offline-first, y sincroniza con SIFEN cuando hay conexión.

## Core Value

Doña María puede facturar electrónicamente desde su puesto en el mercado en menos de 30 segundos, con o sin internet, cumpliendo todas las reglas SIFEN/DNIT.

## Requirements

### Validated

- ✓ Scaffolding backend con arquitectura hexagonal (Node.js + TypeScript) — Milestone 1
- ✓ Domain Layer completo: value objects (CDC, MontoIVA, RUC, Timbrado, NumeroFactura), entidades (Factura, ItemFactura, Cliente, Comercio), puertos, excepciones — Milestone 1
- ✓ 59 tests unitarios pasando — Milestone 1

### Active

- [ ] Application Layer — casos de uso (CrearFactura, EnviarDE, SincronizarPendientes, AnularFactura, EnviarKuDE)
- [ ] Adaptadores infrastructure — PostgreSQL, SIFEN SOAP, generación KuDE PDF
- [ ] API REST — endpoints para facturas, productos, clientes, comercio, sync, auth
- [ ] Validación con Zod en endpoints
- [ ] Autenticación JWT + PIN
- [ ] Testing de integración con Docker
- [ ] Tests e2e de flujos críticos (crear factura → enviar SIFEN → aprobar)
- [ ] App Android KMP + Jetpack Compose
- [ ] Sync engine offline-first con cola FIFO
- [ ] Puerto WhatsApp (interfaz lista, integración Meta API diferida)

### Out of Scope

- Nota de Débito (tipo 6) y Nota de Remisión (tipo 7) — Fase 2
- Eventos del receptor (Conformidad, Disconformidad) — No implementar
- Soporte multi-moneda (USD, BRL) — Solo PYG para MVP
- Condición crédito — Solo contado para MVP
- iOS app — Futuro, SwiftUI consumiendo shared/ KMP
- WhatsApp Meta API integration — Solo puerto/interfaz, integración real diferida
- Dashboard admin web — Fuera de scope MVP

## Context

- **SIFEN** es el sistema de facturación electrónica de Paraguay (DNIT, antes SET). Manual Técnico v150.
- **Target hardware:** Samsung Galaxy A03, 2GB RAM, 16-32GB storage, Android 12+
- **Conectividad:** Mercado 4 tiene cortes de internet frecuentes (diarios). Offline-first es crítico.
- **Velocidad:** Facturación debe completarse en <30 segundos, 3-5 taps máximo
- **Certificado CCFE:** No disponible aún. Backend se construye y testea contra estructura SIFEN test, homologación real cuando se obtenga el certificado y timbrado de prueba.
- **Datos:** Se usarán datos mock realistas (productos típicos mercado: mandioca, arroz, verduras, etc.)
- **Librerías SIFEN:** TIPS-SA npm packages (xmlgen, xmlsign, setapi, qrgen, kude)
- **Referencia Java:** jsifenlib de Roshka (solo referencia de lógica, no dependencia)
- **Documentación:** CLAUDE.md (925 líneas) + SIFEN_REFERENCIA_COMPLETA.md (630 líneas) con reglas detalladas

## Constraints

- **Hardware:** App debe funcionar fluido en 2GB RAM, instalación <5MB
- **Moneda:** Solo PYG (Guaraníes), sin decimales. Todo entero.
- **Timeline:** Backend funcional (milestones 2-4) en 2-3 semanas
- **SIFEN compliance:** CDC 44 dígitos, firma XMLDSig RSA-2048 SHA-256, XML UTF-8 sin prefijos namespace, mutual TLS
- **Seguridad:** Certificado CCFE encriptado AES-256 en servidor, PIN rate limiting, NUNCA certificado en dispositivo móvil
- **Numeración:** Correlativa obligatoria por establecimiento + punto de expedición
- **Plazo SIFEN:** 72 horas máximo para transmitir DE después de firma digital

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Node.js + TypeScript backend | Ecosystem TIPS-SA npm, async I/O para colas SIFEN | — Pending |
| Arquitectura Hexagonal | Cambiar adaptador SIFEN sin tocar dominio. Testabilidad. | ✓ Good |
| Firma digital en BACKEND (no dispositivo) | Evitar .p12 en cada Android. Simplifica manejo certificados. | — Pending |
| KMP sobre Flutter para app | 4.7x más liviana, 50% startup más rápido. Crítico para 2GB RAM. | — Pending |
| Vitest sobre Jest | Más rápido, ESM nativo, mejor DX con TypeScript | ✓ Good |
| WhatsApp como puerto (sin Meta API) | Construir interfaz ahora, integrar Meta API cuando sea prioritario | — Pending |
| Offline-first con sync FIFO | Conectividad no confiable en mercados. SIFEN acepta hasta 72h post-emisión. | — Pending |

---
*Last updated: 2026-02-07 after initialization*
