# CLAUDE.md — ÑandeFact

> Sistema de facturación electrónica SIFEN para comerciantes de mercados paraguayos.
> Código del proyecto: `nandefact`

---

## IDENTIDAD DEL PROYECTO

**Nombre:** ÑandeFact ("Ñande" = nuestro en guaraní + "Fact" = factura)
**Target:** Comerciantes de mercados populares (Mercado 4, Ciudad del Este, etc.)
**Dispositivo objetivo:** Samsung Galaxy A03 (2GB RAM, 16-32GB storage, Android 12+)
**Idioma código:** Inglés. Comentarios: Español. UI: Español paraguayo.
**Moneda:** PYG (Guaraníes) — sin decimales.

---

## ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────┐
│                    nandefact-app                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  androidApp/ (Jetpack Compose - UI)              │   │
│  │  Screen → ViewModel → UseCase(shared) → Domain   │   │
│  └──────────────┬───────────────────────────────────┘   │
│  ┌──────────────┴───────────────────────────────────┐   │
│  │  shared/ (KMP - lógica compartida)               │   │
│  │  domain/ + data/ + sync/                         │   │
│  │  SQLDelight (offline) + Ktor Client (API)        │   │
│  └──────────────┬───────────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────┘
                  │ REST API (JSON)
┌─────────────────┼───────────────────────────────────────┐
│                 nandefact-api                            │
│  ┌──────────────┴───────────────────────────────────┐   │
│  │  interfaces/http/ (Express/Fastify - REST)       │   │
│  └──────────────┬───────────────────────────────────┘   │
│  ┌──────────────┴───────────────────────────────────┐   │
│  │  application/ (Casos de uso)                     │   │
│  └──────────────┬───────────────────────────────────┘   │
│  ┌──────────────┴───────────────────────────────────┐   │
│  │  domain/ (Entidades, Value Objects, Puertos)     │   │
│  └──────────────┬───────────────────────────────────┘   │
│  ┌──────────────┴───────────────────────────────────┐   │
│  │  infrastructure/ (Adaptadores)                   │   │
│  │  PostgreSQL + SIFEN SOAP + WhatsApp + PDF        │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Patrón:** Arquitectura Hexagonal (Puertos y Adaptadores) + DDD Lite
**Regla de dependencias:** Siempre hacia adentro. Infrastructure → Application → Domain. Domain NO conoce infrastructure.

---

## STACK TÉCNICO

### Backend (nandefact-api/)
| Tecnología | Uso |
|------------|-----|
| Node.js + TypeScript | Runtime + lenguaje |
| Express o Fastify | Framework HTTP |
| Prisma o TypeORM | ORM |
| PostgreSQL 16 | Base de datos principal |
| BullMQ + Redis | Cola de tareas async (sync SIFEN, WhatsApp) |
| Zod | Validación de datos |
| JWT + bcrypt | Autenticación |
| Jest + Supertest | Testing |
| Docker + docker-compose | Containerización |

#### Librerías SIFEN (TIPS-SA npm):
| Paquete | Función |
|---------|---------|
| `facturacionelectronicapy-xmlgen` | Generación XML del DE |
| `facturacionelectronicapy-xmlsign` | Firma digital XMLDSig |
| `facturacionelectronicapy-setapi` | Comunicación Web Services SIFEN SOAP |
| `facturacionelectronicapy-qrgen` | Generación código QR |
| `facturacionelectronicapy-kude` | Generación KuDE (PDF) |

**Referencia Java:** jsifenlib de Roshka (solo como referencia de lógica, NO como dependencia).

### Frontend (nandefact-app/)
| Tecnología | Uso |
|------------|-----|
| Kotlin | Lenguaje único frontend |
| Kotlin Multiplatform (KMP) | Lógica compartida (domain, data, sync) |
| Jetpack Compose | UI Android (Material Design 3) |
| SQLDelight | DB local type-safe (SQLite) |
| Ktor Client | HTTP client multiplataforma |
| ViewModel + StateFlow | State management |
| kotlinx.serialization | JSON serialization |
| WorkManager | Sync offline background |
| EncryptedSharedPreferences | Storage seguro (tokens, keys) |

**Target Android:** SDK 21+ (Android 5.0+), optimizado para 2GB RAM.
**iOS futuro:** SwiftUI consumiendo shared/ KMP.

### Por qué KMP y NO Flutter:
- App 4.7x más liviana (1.46 MB vs 6.83 MB)
- Startup 50% más rápido (425 ms vs 634 ms)
- Rendimiento nativo real sin overhead de rendering engine
- Crítico para Samsung A03 con 2GB RAM y 16-32GB storage
- Fuente: benchmark jacobras/flutter-vs-native-vs-kmp (misma app galería fotos)

### Infraestructura (Producción futura)
- VPS (Hetzner/DigitalOcean) o Railway/Render
- Nginx reverse proxy + Let's Encrypt SSL
- Docker Compose producción
- Backups PostgreSQL automatizados

---

## ESTRUCTURA DE CARPETAS

### Backend
```
nandefact-api/
├── src/
│   ├── domain/                    # Entidades, value objects, puertos
│   │   ├── factura/
│   │   │   ├── Factura.ts         # Agregado raíz
│   │   │   ├── DetalleFactura.ts
│   │   │   ├── CDC.ts             # Value object
│   │   │   ├── MontoIVA.ts        # Value object
│   │   │   └── IFacturaRepository.ts  # Puerto
│   │   ├── comercio/
│   │   │   ├── Comercio.ts        # Agregado raíz
│   │   │   ├── Timbrado.ts        # Value object
│   │   │   ├── RUC.ts             # Value object
│   │   │   └── IComercioRepository.ts
│   │   ├── producto/
│   │   │   ├── Producto.ts
│   │   │   └── IProductoRepository.ts
│   │   └── cliente/
│   │       ├── Cliente.ts
│   │       └── IClienteRepository.ts
│   ├── application/               # Casos de uso
│   │   ├── facturacion/
│   │   │   ├── CrearFactura.ts
│   │   │   ├── EnviarDE.ts
│   │   │   ├── SincronizarPendientes.ts
│   │   │   ├── AnularFactura.ts
│   │   │   └── EnviarKuDE.ts
│   │   ├── sync/
│   │   │   └── ProcesarColaSifen.ts
│   │   └── auth/
│   │       └── AutenticarUsuario.ts
│   ├── infrastructure/            # Adaptadores (implementaciones)
│   │   ├── persistence/           # PostgreSQL (Prisma/TypeORM)
│   │   │   ├── FacturaRepositoryPg.ts
│   │   │   ├── ComercioRepositoryPg.ts
│   │   │   ├── ProductoRepositoryPg.ts
│   │   │   └── ClienteRepositoryPg.ts
│   │   ├── sifen/                 # SOAP client directo
│   │   │   ├── SifenGatewayImpl.ts
│   │   │   ├── XmlGenerator.ts
│   │   │   ├── XmlSigner.ts
│   │   │   └── CdcGenerator.ts
│   │   ├── whatsapp/
│   │   │   └── WhatsAppNotificador.ts
│   │   └── pdf/
│   │       └── KudeGeneratorImpl.ts
│   └── interfaces/                # API REST
│       └── http/
│           ├── routes/
│           ├── middleware/
│           └── validators/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── prisma/ (o migrations/)
├── docker-compose.yml
├── Dockerfile
├── tsconfig.json
├── package.json
└── CLAUDE.md                      # Este archivo
```

### Frontend
```
nandefact-app/
├── shared/                        # KMP código compartido
│   └── src/
│       ├── commonMain/            # Lógica común todas las plataformas
│       │   ├── domain/            # Entidades, value objects
│       │   ├── data/              # Repositorios, API client
│       │   └── sync/              # Motor sincronización offline
│       ├── androidMain/           # Específico Android
│       └── iosMain/               # Específico iOS (futuro)
├── androidApp/                    # UI Android
│   └── src/main/
│       ├── ui/                    # Screens (Jetpack Compose)
│       │   ├── facturacion/
│       │   ├── productos/
│       │   ├── clientes/
│       │   ├── reportes/
│       │   └── settings/
│       └── viewmodel/             # ViewModels
└── iosApp/                        # UI iOS (futuro)
    └── SwiftUI/
```

---

## MODELO DE DOMINIO

### Actores
| Actor | Descripción |
|-------|-------------|
| Comerciante | Doña María, usa la app para facturar. Usuario principal. |
| Cliente/Comprador | Recibe la factura. Puede ser identificado (CI/RUC) o innominado. |
| DNIT/SIFEN | Valida y aprueba las facturas electrónicas. |
| Admin | Onboarding comerciantes, monitoreo del sistema. |

### Entidades

**Comercio** — Negocio del comerciante. RUC, razón social, timbrado, CCFE. Puede tener múltiples usuarios.

**Producto** — Lo que vende el comerciante. Nombre, precio, IVA, unidad medida. Pertenece a un comercio.

**Cliente** — Destinatario de la factura. CI/RUC identificado o innominado. Los frecuentes se guardan.

**Factura** — Documento principal. CDC único 44 dígitos, items, montos IVA, estado SIFEN.

**DetalleFactura** — Línea individual (ej: 3kg mandioca @ Gs 5.000/kg = Gs 15.000).

**DocumentoElectrónico (DE)** — Representación XML para SIFEN. Separado de Factura (modelo negocio vs formato SIFEN).

### Value Objects

**CDC** — 44 dígitos con estructura interna y algoritmo de validación módulo 11. NO es un string simple. Genera antes de enviar a SIFEN.

**MontoIVA** — Calcula automáticamente base gravada + IVA según tipo (10%, 5%, exenta). En PYG sin decimales.

**RUC** — Formato específico paraguayo con dígito verificador.

**Timbrado** — Número + rango fechas vigencia. Valida si está vigente al momento de emisión.

### Agregados

#### Agregado Factura (raíz):
```
Factura
  ├── DetalleFactura[] (items)
  ├── CDC (value object calculado)
  ├── MontoIVA (value object calculado)
  └── EstadoSifen (pendiente/enviada/aprobada/rechazada/contingencia)
```

**Invariantes protegidas:**
- Mínimo 1 item
- Total = suma de detalles
- IVA cuadra: 10% → base = total / 1.10, IVA = total - base
- IVA cuadra: 5% → base = total / 1.05, IVA = total - base
- CDC válido (44 dígitos, DV correcto)
- Timbrado vigente al momento de emisión
- Una vez aprobada por SIFEN → INMUTABLE (solo cancelable por evento)
- Numeración correlativa por establecimiento + punto de expedición

#### Agregado Comercio:
```
Comercio
  ├── Usuario[] (dueño + empleados)
  ├── Timbrado (value object)
  └── CertificadoDigital (encriptado AES-256)
```

### Puertos (Interfaces del Dominio)

| Puerto | Función | Adaptador MVP |
|--------|---------|---------------|
| `IFacturaRepository` | Guardar/buscar facturas | PostgreSQL |
| `IProductoRepository` | CRUD productos | PostgreSQL |
| `IClienteRepository` | CRUD clientes | PostgreSQL |
| `IComercioRepository` | CRUD comercios | PostgreSQL |
| `ISifenGateway` | Enviar DE, consultar estado, eventos | SIFEN directo (SOAP) |
| `ICDCGenerator` | Generar CDC 44 dígitos | Implementación propia |
| `IKudeGenerator` | Generar PDF KuDE | PDFKit o Puppeteer |
| `INotificador` | Enviar KuDE al cliente | WhatsApp Cloud API |
| `IFirmaDigital` | Firmar XML con CCFE | XMLDSig (RSA 2048 + SHA-256) |
| `IAuthService` | Autenticar usuarios | JWT + PIN |

**Ventaja:** Cambiar adaptador (ej: SIFEN directo → otro proveedor) sin tocar dominio ni casos de uso.

---

## CASOS DE USO MVP

### Facturación (core)
| # | Caso de Uso | Dónde ejecuta |
|---|-------------|---------------|
| 1 | `CrearFactura` | Dispositivo (KMP) — genera CDC, XML, guarda local |
| 2 | `EnviarDE` | Backend — firma XML, envía SIFEN SOAP |
| 3 | `SincronizarPendientes` | Backend — procesa cola offline FIFO |
| 4 | `AnularFactura` | Backend — envía evento cancelación a SIFEN |
| 5 | `EnviarKuDE` | Backend — genera PDF + envía WhatsApp |

### Setup
| # | Caso de Uso | Descripción |
|---|-------------|-------------|
| 6 | `RegistrarComercio` | Registro con RUC |
| 7 | `CargarCertificadoDigital` | Carga CCFE (NUNCA texto plano) |
| 8 | `ConfigurarTimbrado` | Uno activo por punto de expedición |
| 9 | `GestionarProductos` | CRUD productos |
| 10 | `GestionarClientes` | CRUD clientes |

### Flujo UX al Facturar
1. Comerciante selecciona productos + cantidades
2. Selecciona cliente: elige CI/RUC/sin doc. Check "guardar cliente" ON por defecto. Check "enviar WhatsApp" ON por defecto.
3. Autocompletado si CI/RUC ya existe en DB.
4. Toca "Facturar" → app genera CDC, XML, guarda SQLite local → confirmación INMEDIATA.
5. Background: al detectar internet → envía a backend → backend firma → SIFEN → respuesta.
6. Si aprobada + cliente tiene WhatsApp → envío KuDE automático post-aprobación.
7. App sincroniza estado actualizado.
8. El campo `enviarWhatsApp` es boolean en el objeto Cliente.

---

## FLUJO TÉCNICO FACTURACIÓN

```
[USUARIO EN APP]
    │
    ├─ 1. Selecciona productos + cantidades (state memoria)
    ├─ 2. Selecciona/crea cliente (validación CI/RUC local)
    ├─ 3. Toca "Facturar":
    │       ├─ Genera CDC (44 dígitos) localmente
    │       ├─ Crea XML Documento Electrónico
    │       ├─ Guarda en SQLDelight (estado: PENDIENTE)
    │       ├─ Genera KuDE preliminar (PDF)
    │       └─ Muestra confirmación INMEDIATA al usuario
    │
[SYNC ENGINE (background)]
    │
    ├─ 4. Detecta conexión internet
    ├─ 5. Envía factura al backend vía REST API
    │
[BACKEND]
    │
    ├─ 6. Genera XML completo con datos emisor
    ├─ 7. Firma XML con CCFE del comercio
    ├─ 8. Envía a SIFEN vía SOAP (siRecepDE o siRecepLoteDE)
    ├─ 9. SIFEN valida y responde (aprobada/rechazada)
    ├─ 10. Genera KuDE final (con sello SIFEN, QR válido)
    ├─ 11. Si cliente tiene WhatsApp → envía KuDE vía Meta API
    └─ 12. Responde a la app con estado actualizado
    │
[APP ACTUALIZA]
    └─ 13. Sincroniza estado: PENDIENTE → APROBADA/RECHAZADA
```

### Sin Internet (Contingencia):
- Factura queda en cola local (SQLDelight)
- KuDE preliminar compartible manualmente
- Al recuperar conexión: sincroniza pendientes en orden FIFO
- SIFEN acepta facturas hasta 72 horas post-emisión
- Si una falla en la cola, sigue con las demás
- Reintentos con backoff exponencial

---

## MODELO DE DATOS (PostgreSQL)

```sql
-- Comercio
comercio (
    id UUID PK,
    nombre VARCHAR(200),
    ruc VARCHAR(20) UNIQUE,
    razon_social VARCHAR(200),
    nombre_fantasia VARCHAR(200),
    establecimiento VARCHAR(3),
    punto_expedicion VARCHAR(3),
    timbrado VARCHAR(15),
    timbrado_fecha_inicio DATE,
    timbrado_fecha_fin DATE,
    direccion TEXT,
    numero_casa VARCHAR(10),
    departamento INT,
    departamento_desc VARCHAR(100),
    distrito INT,
    distrito_desc VARCHAR(100),
    ciudad INT,
    ciudad_desc VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(200),
    rubro VARCHAR(100),
    actividad_economica_codigo VARCHAR(10),
    actividad_economica_desc VARCHAR(200),
    tipo_contribuyente INT,          -- 1=Persona Física, 2=Persona Jurídica
    tipo_regimen INT,                -- 8=Turismo, etc. (catálogo SIFEN)
    zona_mercado VARCHAR(50),
    ccfe_certificado BYTEA,          -- Encriptado AES-256
    ccfe_clave BYTEA,                -- Encriptado AES-256
    csc VARCHAR(64),                 -- Código Seguridad Contribuyente (encriptado)
    csc_id VARCHAR(10),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Usuario
usuario (
    id UUID PK,
    comercio_id UUID FK → comercio,
    nombre VARCHAR(100),
    telefono VARCHAR(20) UNIQUE,     -- Login con teléfono
    pin_hash VARCHAR(256),           -- PIN 4-6 dígitos hasheado
    rol ENUM('dueño', 'empleado'),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Producto
producto (
    id UUID PK,
    comercio_id UUID FK → comercio,
    nombre VARCHAR(200),
    codigo VARCHAR(50),
    precio_unitario BIGINT,          -- Guaraníes (entero, sin decimales)
    unidad_medida VARCHAR(10),
    iva_tipo ENUM('10%', '5%', 'exenta'),
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cliente
cliente (
    id UUID PK,
    comercio_id UUID FK → comercio,
    nombre VARCHAR(200),
    ruc_ci VARCHAR(20),
    tipo_documento ENUM('RUC', 'CI', 'pasaporte', 'innominado'),
    telefono VARCHAR(20),
    email VARCHAR(200),
    direccion TEXT,
    frecuente BOOLEAN DEFAULT false,
    enviar_whatsapp BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Factura
factura (
    id UUID PK,
    comercio_id UUID FK → comercio,
    usuario_id UUID FK → usuario,
    cliente_id UUID FK → cliente,

    -- Datos SIFEN
    cdc VARCHAR(44) UNIQUE,
    numero BIGINT,                   -- Correlativo por establecimiento+punto
    tipo_documento INT,              -- 1=FE, 5=NC, 6=ND
    establecimiento VARCHAR(3),
    punto_expedicion VARCHAR(3),

    -- Montos (BIGINT porque PYG no tiene decimales)
    total_bruto BIGINT,
    total_iva_10 BIGINT,
    total_iva_5 BIGINT,
    total_exenta BIGINT,
    total_iva BIGINT,
    total_neto BIGINT,

    -- Condición de pago
    condicion_pago ENUM('contado', 'credito'),

    -- Estado SIFEN
    estado_sifen ENUM('pendiente', 'enviado', 'aprobado', 'rechazado', 'contingencia'),
    sifen_respuesta TEXT,            -- Respuesta XML/JSON de SIFEN
    sifen_codigo_respuesta VARCHAR(10),
    sifen_fecha_envio TIMESTAMP,
    sifen_fecha_aprobacion TIMESTAMP,

    -- Envío cliente
    whatsapp_enviado BOOLEAN DEFAULT false,
    whatsapp_fecha TIMESTAMP,

    -- PDF
    kude_pdf_path VARCHAR(500),

    -- Sync
    sync_id UUID,
    created_offline BOOLEAN DEFAULT false,
    synced_at TIMESTAMP,

    -- Nota de crédito referencia
    factura_referencia_id UUID FK → factura NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Detalle Factura
factura_detalle (
    id UUID PK,
    factura_id UUID FK → factura,
    producto_id UUID FK → producto,
    descripcion VARCHAR(200),        -- Snapshot del nombre al momento de facturar
    cantidad BIGINT,                 -- Entero (unidades, kg redondeado)
    precio_unitario BIGINT,          -- Guaraníes
    subtotal BIGINT,                 -- cantidad × precio_unitario
    iva_tipo INT,                    -- 1=Gravado, 2=Parcialmente exento, 3=Exento
    iva_tasa INT,                    -- 10, 5, o 0
    iva_proporcion INT DEFAULT 100,  -- Porcentaje proporción gravada
    iva_base BIGINT,                 -- Base gravada calculada
    iva_monto BIGINT                 -- Monto IVA calculado
);

-- Cola de Sincronización
sync_queue (
    id UUID PK,
    comercio_id UUID FK → comercio,
    tipo ENUM('factura', 'evento'),
    payload JSONB,
    estado ENUM('pendiente', 'procesando', 'completado', 'error'),
    intentos INT DEFAULT 0,
    max_intentos INT DEFAULT 5,
    ultimo_error TEXT,
    proximo_intento TIMESTAMP,       -- Para backoff exponencial
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

---

## API ENDPOINTS

### Auth
```
POST /api/v1/auth/login              → Login teléfono + PIN
POST /api/v1/auth/refresh            → Refresh JWT
POST /api/v1/auth/verify-pin         → Verificar PIN (operaciones sensibles)
```

### Comercio
```
GET  /api/v1/comercio/perfil         → Datos del comercio del usuario autenticado
PUT  /api/v1/comercio/perfil         → Actualizar datos comercio
POST /api/v1/comercio/certificado    → Subir CCFE (archivo .p12/.pfx)
GET  /api/v1/comercio/estado-sifen   → Estado conexión SIFEN
```

### Productos
```
GET    /api/v1/productos             → Lista productos (paginado)
POST   /api/v1/productos             → Crear producto
PUT    /api/v1/productos/:id         → Actualizar
DELETE /api/v1/productos/:id         → Desactivar (soft delete)
GET    /api/v1/templates/:rubro      → Templates por rubro (productos sugeridos)
POST   /api/v1/productos/importar    → Importar desde template
```

### Clientes
```
GET  /api/v1/clientes                → Lista clientes (paginado)
POST /api/v1/clientes                → Crear
PUT  /api/v1/clientes/:id            → Actualizar
GET  /api/v1/clientes/buscar?q=      → Buscar nombre/RUC/CI (autocompletado)
```

### Facturas
```
POST /api/v1/facturas                → Crear y procesar factura
GET  /api/v1/facturas                → Historial (paginado, filtros fecha/estado)
GET  /api/v1/facturas/:id            → Detalle factura
GET  /api/v1/facturas/:id/kude       → Descargar PDF KuDE
POST /api/v1/facturas/:id/reenviar   → Reenviar WhatsApp
POST /api/v1/facturas/:id/anular     → Anular (evento cancelación SIFEN)
```

### Sync (offline)
```
POST /api/v1/sync/push               → Enviar facturas creadas offline
GET  /api/v1/sync/pull?since=        → Cambios desde timestamp
GET  /api/v1/sync/status             → Estado sincronización
```

---

## REGLAS SIFEN

### Glosario
| Término | Significado |
|---------|-------------|
| SIFEN | Sistema Integrado de Facturación Electrónica Nacional |
| DNIT | Dirección Nacional de Ingresos Tributarios (antes SET) |
| DE | Documento Electrónico (antes de aprobación SIFEN) |
| DTE | Documento Tributario Electrónico (DE aprobado, tiene validez legal) |
| CDC | Código de Control — 44 dígitos numéricos, identifica únicamente un DE |
| CSC | Código de Seguridad del Contribuyente — otorgado por DNIT para QR |
| KuDE | Kuatia Documento Electrónico — representación gráfica del DE/DTE |
| CCFE | Certificado Cualificado de Firma Electrónica |
| Timbrado | Código de autorización DNIT para emitir DTE |
| Marangatú | Sistema de gestión tributaria DNIT (solicitar timbrado) |
| e-Kuatia | Portal SIFEN para consultas y gestión |

### Tipos de Documento Electrónico
| Código | Tipo | Prioridad |
|--------|------|-----------|
| 1 | Factura Electrónica (FE) | **MVP** |
| 5 | Nota de Crédito Electrónica | **MVP** |
| 6 | Nota de Débito Electrónica | Fase 2 |
| 7 | Nota de Remisión Electrónica | Fase 2 |

### CDC — Estructura 44 Dígitos
```
Posición  | Largo | Campo
01-02     | 2     | Tipo Documento Electrónico (01=Factura)
03-10     | 8     | RUC emisor (sin DV)
11        | 1     | Dígito Verificador del RUC
12-14     | 3     | Código Establecimiento
15-17     | 3     | Punto de Expedición
18-24     | 7     | Número del documento
25        | 1     | Tipo Contribuyente (1=PF, 2=PJ)
26-33     | 8     | Fecha emisión (YYYYMMDD)
34        | 1     | Tipo Emisión (1=Normal, 2=Contingencia)
35-43     | 9     | Código Seguridad Aleatorio
44        | 1     | Dígito Verificador del CDC
```

**Ejemplo:** `01800695631001003000013712022010619364760029`

**Algoritmo DV del CDC:**
1. Tomar 43 dígitos del CDC
2. Módulo 11, factores 2-9 cíclicos de derecha a izquierda
3. Sumar productos parciales
4. Resto = suma % 11
5. Si resto = 0 → DV = 0; si resto = 1 → DV = 1; sino → DV = 11 - resto

**Reglas CDC:**
- Se genera ANTES de enviar a SIFEN (lo genera nuestro sistema)
- Si DE rechazado y corrección NO altera campos del CDC → se puede REUTILIZAR mismo CDC
- Código seguridad aleatorio (9 dígitos) lo genera nuestro sistema
- Numeración correlativa OBLIGATORIA por establecimiento + punto de expedición

### IVA Paraguay
| Tasa | Aplicación |
|------|-----------|
| 10% (general) | Mayoría bienes/servicios, manufactura, tecnología, ropa |
| 5% (reducida) | Canasta básica, medicamentos, agropecuarios natural, alquiler vivienda, gastronomía |
| 0% (exenta) | Exportaciones, educación, ciertos servicios financieros |

**Fórmulas (precios INCLUYEN IVA en Paraguay):**
```
Tasa 10%: baseGravada = precioTotal / 1.10    montoIVA = precioTotal - baseGravada
Tasa 5%:  baseGravada = precioTotal / 1.05    montoIVA = precioTotal - baseGravada
Exenta:   baseGravada = 0                     montoIVA = 0
```

**Proporciones especiales:**
| Proporción | Caso |
|-----------|------|
| 100% | Normal |
| 85% | Turismo |
| 30% | Inmuebles (30% gravado al 5%, 70% exento) |

**Regla redondeo PYG:** Guaraníes NO tiene decimales. Todo se redondea a entero.

**Liquidación factura:** Subtotales separados obligatorios:
- Total IVA 10% (suma montoIVA items al 10%)
- Total IVA 5% (suma montoIVA items al 5%)
- Total Exenta (suma montos exentos)
- Total General (suma de todos los items)

### Estructura XML del DE
```
<DE>
  ├── Grupo AA: Formato electrónico (versión XML, CDC)
  ├── Grupo A: Campos del DE (timbrado, fecha emisión, tipo)
  ├── Grupo B: Emisor (RUC, razón social, establecimiento, actividades)
  ├── Grupo C: Usuario firmante
  ├── Grupo D: Receptor (RUC/CI, razón social, dirección)
  ├── Grupo E: Específicos por tipo DE
  │   ├── E1: Factura Electrónica
  │   ├── E5: Nota de Crédito/Débito
  │   └── E8: Items/detalle (item + IVA)
  ├── Grupo F: Condición de pago (contado/crédito)
  ├── Grupo G: Complementarios (transporte)
  └── Grupo H: Totales y subtotales
```

**Namespace:** `xmlns="http://ekuatia.set.gov.py/sifen/xsd"`

**Reglas formato XML:**
- UTF-8, sin espacios al inicio/final
- Sin comentarios, sin caracteres de formato entre etiquetas
- Sin prefijos namespace
- NO incluir etiquetas de campos vacíos (excepto obligatorios)
- Sin valores negativos
- Fechas: `YYYY-MM-DDThh:mm:ss` (ISO 8601, sin zona horaria)

### Web Services SIFEN (SOAP 1.2)
**Test:** `https://sifen-test.set.gov.py/de/ws/`
**Producción:** `https://sifen.set.gov.py/de/ws/`
**Auth:** Mutual TLS con certificado CCFE
**Encoding:** Document/Literal

| Servicio | Tipo | Descripción | Prioridad |
|----------|------|-------------|-----------|
| `siRecepDE` | Síncrono | Recepción individual DE | **MVP** |
| `siRecepLoteDE` | Asíncrono | Recepción lote hasta 50 DE | **MVP** |
| `siConsLotDE` | Consulta | Resultado lote por nro lote | **MVP** |
| `siConsDE` | Consulta | Estado individual por CDC | **MVP** |
| `siConsRUC` | Consulta | Validar RUC cliente | **MVP** |
| `siRecepEvento` | Síncrono | Eventos (cancelación, inutilización) | **MVP** |
| `siConsDTE` | Consulta | Consulta pública DTE aprobado | Fase 2 |

**Códigos respuesta importantes:**
- `0260` — DE aprobado ✅
- `0261` — DE aprobado con observación ⚠️
- `0300`-`0399` — Rechazos (ver mensaje específico) ❌
- `0360` — Lote recibido correctamente (async)

### Firma Digital
- Algoritmo: RSA 2048 bits
- Hash: SHA-256
- Formato: XMLDSig (Enveloped Signature)
- URI del tag Reference: CDC precedido por `#`
- Cada DE individual firmado ANTES de incluirlo en lote
- Certificado PKCS#12 (.p12/.pfx) — **NUNCA en texto plano**

### KuDE (Representación Gráfica)
Formatos: papel carta, cinta ticket/POS, cinta resumen.

**Campos obligatorios:** RUC, razón social, nombre fantasía, timbrado, establecimiento, punto expedición, número, fecha emisión, CDC, items (código, descripción, cantidad, precio, subtotal), totales (gravado 10%, gravado 5%, exento, IVA 10%, IVA 5%, total general), QR code, URL verificación e-Kuatia.

**Regla:** NO puede existir información en el KuDE que NO forme parte del XML firmado (excepto QR y campos técnicos del Manual).

### Código QR
Composición: CDC + CSC (32 chars) → hash → URL con parámetros.
```
https://ekuatia.set.gov.py/consultas/qr?nVersion=150&Id={CDC}&dFeEmiDE={fechaEmision}&dRucRec={rucReceptor}&dTotGralOpe={totalGeneral}&dTotIVA={totalIVA}&cItems={cantidadItems}&DigestValue={digestValue}&IdCSC={idCSC}&cHashQR={hashQR}
```

### Eventos SIFEN
| Evento | Descripción | Cuándo usar | Prioridad |
|--------|-------------|-------------|-----------|
| Cancelación | Cancelar DTE aprobado | Operación no se concretó | **MVP** |
| Inutilización | Inutilizar rango numeración | Se saltearon números | **MVP** |
| Anulación/Ajuste | Usar Nota Crédito/Débito | Ajustes de monto | Fase 2 |

Eventos del receptor (Conformidad, Disconformidad, etc.): **NO implementar**.

### Homologación (pasos)
1. RUC activo y al día → solicitar acceso test en Marangatú
2. Obtener timbrado de prueba (sin valor fiscal) + CSC de prueba
3. Ejecutar pruebas: emitir, firmar, enviar, consultar, eventos
4. Declarar cumplimiento (DDJJ)
5. Solicitar habilitación producción en Marangatú
6. Obtener timbrado producción + CSC producción

### Uso de TIPS-SA (xmlgen)
```typescript
import xmlgen from 'facturacionelectronicapy-xmlgen';

// params = datos estáticos emisor (RUC, razón social, timbrado, establecimientos)
// data = datos variables del DE (tipo doc, número, fecha, cliente, items, pago)
const xml = await xmlgen.generateXMLDE(params, data, options);
const xmlCancel = await xmlgen.generateXMLEventoCancelacion(id, params, data);
```

**Estructura params (emisor):** version, ruc, razonSocial, nombreFantasia, actividadesEconomicas[], timbradoNumero, timbradoFecha, tipoContribuyente, tipoRegimen, establecimientos[].

**Estructura data (documento):** tipoDocumento, establecimiento, punto, numero, codigoSeguridadAleatorio, fecha, tipoEmision, tipoTransaccion, condicion (contado/credito), moneda, cliente{}, items[], observacion.

---

## SEGURIDAD

### Autenticación
- JWT access token (15 min) + refresh token (7 días)
- Login: teléfono + PIN 4-6 dígitos (NO password compleja — target es doña María)
- PIN rate limiting: 5 intentos → bloqueo temporal 30 min
- Verificación PIN adicional para operaciones sensibles (anulación, carga certificado)

### Certificados CCFE
- Encriptados en servidor con AES-256
- Clave de encriptación en variable de entorno, NO en código
- NUNCA almacenar en texto plano
- NUNCA loggear contenido del certificado
- Archivo PKCS#12 (.p12/.pfx) original

### Comunicación
- HTTPS obligatorio (TLS 1.2+ mínimo)
- SIFEN requiere mutual TLS con CCFE
- API REST con rate limiting por comercio

### App Móvil
- Tokens en EncryptedSharedPreferences (Android Keystore)
- SQLDelight con datos locales (no sensibles)
- PIN NO se almacena localmente — siempre verificación contra backend
- Certificado CCFE NUNCA en dispositivo móvil

### Base de Datos
- Encriptación at-rest PostgreSQL
- Backups encriptados
- Queries parametrizadas (prevenir SQL injection)
- UUIDs para IDs (prevenir enumeración)

### Auditoría
- Log TODA operación de facturación
- Log intentos de login fallidos
- Log envíos SIFEN (request/response sin datos sensibles)
- Retención logs mínimo 5 años (requisito fiscal)

---

## REGLAS DE DESARROLLO PARA EL AGENTE

### Git Workflow
**OBLIGATORIO:** Todo desarrollo se hace en ramas. NUNCA commitear directo a `main`.

**Estructura de ramas:**
```
main                          ← Siempre estable, deployable
├── feat/scaffolding          ← Features nuevas
├── feat/domain-factura
├── feat/sifen-gateway
├── fix/cdc-validation        ← Bugfixes
├── refactor/iva-calculation  ← Refactors
└── test/factura-unit-tests   ← Tests
```

**Flujo obligatorio:**
1. Antes de empezar cualquier tarea: `git checkout -b <tipo>/<nombre-descriptivo>`
2. Commits frecuentes con Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`)
3. Cuando la feature está completa y tests pasan: merge a `main`
4. Si algo sale mal: `git checkout main` y la rama rota queda aislada

**Reglas:**
- Commits atómicos: un commit = un cambio lógico
- Mensaje descriptivo en español: `feat: agregar value object CDC con validación módulo 11`
- Antes de merge a main: verificar que TODOS los tests pasan
- NO hacer force push a main
- NO borrar ramas hasta confirmar que el merge está bien
- Si el agente se equivoca en una rama, se descarta la rama entera y se empieza de nuevo

**Primer commit en main:** solo scaffolding (estructura carpetas + configs). Después todo en ramas.

### Proceso de Desarrollo
1. **Desarrollo incremental por bloques:** 1 función → test → verificar → siguiente.
2. **NUNCA avanzar con tests rotos.** Corregir antes de seguir.
3. **Siempre consultar documentación oficial** de librerías/tools antes de usarlas. NUNCA asumir. Investigar primero, codear después.
4. **Error handling específico por capa:** Domain lanza excepciones de dominio, Application las captura y traduce, Infrastructure maneja errores de I/O.
5. **Logging estructurado:** JSON, con contexto (comercioId, facturaId, CDC).

### Convenciones de Código
- **Idioma código:** Inglés (variables, funciones, clases)
- **Idioma comentarios:** Español
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- **Testing obligatorio:** Unit tests para dominio, integration tests para adaptadores, e2e para flujos críticos.
- **Docs inline:** JSDoc/KDoc en funciones públicas.

### Autonomía del Agente
- **Media:** Puede tomar decisiones de implementación dentro de la arquitectura definida.
- **Consultar antes de:** cambiar arquitectura, agregar dependencias grandes, modificar modelo de datos.
- **Siempre confirmar con Ez** antes de crear o entregar archivos finales.

### Seguridad en Código
- Validar TODA entrada del usuario (Zod en backend, validación en KMP shared)
- Prevenir SQL injection (queries parametrizadas siempre)
- Prevenir XSS (sanitizar output)
- NUNCA loggear datos sensibles (PINs, certificados, tokens)
- NUNCA hardcodear secretos en código
- Variables de entorno para configuración sensible

### Reglas SIFEN en Código
- CDC se genera en el SISTEMA, no en SIFEN
- Numeración correlativa — nunca saltear números sin inutilización
- XML debe cumplir TODAS las reglas de formato (ver sección SIFEN)
- Firma digital ANTES de enviar, CADA DE individual
- Guardar respuesta SIFEN completa para auditoría
- Manejar los 3 estados: aprobado (260/261), rechazado (300+), error técnico
- Contingencia (tipo emisión 2) solo cuando SIFEN está caído confirmado
- Reintentos con backoff exponencial para errores de red

---

## REFERENCIA RÁPIDA

### Archivos clave
| Archivo | Propósito |
|---------|-----------|
| `CLAUDE.md` | Este archivo — guía completa del proyecto |
| `SIFEN_REFERENCIA_COMPLETA.md` | Referencia técnica SIFEN detallada (630 líneas) |
| `docker-compose.yml` | PostgreSQL + Redis + app |
| `prisma/schema.prisma` | Schema base de datos |

### Comandos útiles
```bash
# Backend
npm run dev          # Desarrollo
npm run test         # Tests
npm run build        # Build producción
npm run db:migrate   # Migraciones
npm run db:seed      # Datos de prueba

# Docker
docker-compose up -d           # Levantar servicios
docker-compose logs -f api     # Ver logs

# Frontend (Android Studio / Gradle)
./gradlew :androidApp:assembleDebug    # Build debug
./gradlew :shared:test                  # Tests KMP shared
```

### Variables de entorno backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/nandefact
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>
CCFE_ENCRYPTION_KEY=<aes-256-key>
SIFEN_ENVIRONMENT=test                  # test | production
SIFEN_TEST_URL=https://sifen-test.set.gov.py/de/ws/
SIFEN_PROD_URL=https://sifen.set.gov.py/de/ws/
WHATSAPP_API_TOKEN=<meta-api-token>
WHATSAPP_PHONE_ID=<phone-number-id>
```

---

## Reglas del Agente

### Comunicación
- Sé conciso. No expliques lo que vas a hacer, solo hacelo.
- No repitas código en la explicación que ya escribiste en archivos.
- No pidas confirmación. Ejecutá directamente.
- No muestres outputs intermedios a menos que haya un error.
- No hagas tablas decorativas ni árboles ASCII durante el trabajo.

### Al terminar cada tarea
Mostrá un resumen con:
1. Commits realizados (hash corto + mensaje)
2. Archivos creados/modificados (solo nombres, no contenido)
3. Tests: cantidad total, pasados, fallidos
4. Errores encontrados y cómo se resolvieron
5. Tiempo total

### Principios de código
- DRY: si algo se usa 2+ veces, extraer a función/clase/módulo compartido.
- SOLID: responsabilidad única, abierto/cerrado, inversión de dependencias.
- No duplicar lógica entre archivos. Reutilizar siempre.
- Preferir composición sobre herencia.

### Output token limit
- Si el output excede 32K tokens, NO es un error. Simplemente continuá el trabajo en el siguiente bloque sin explicar qué pasó.

### Post-ejecución obligatoria
Después de completar cada fase de GSD (antes de merge a main):
1. Invocar `/project:review` sobre el diff de la rama actual vs main
2. Si el review reporta problemas, corregirlos ANTES de merge
3. Solo hacer merge si el review pasa limpio


### Regla de commits frecuentes
- MÁXIMO 15 minutos de trabajo sin commit
- Después de cada archivo nuevo o modificación significativa: commit
- Después de que tests pasen: commit INMEDIATO
- Si un plan tiene 5 subtareas, mínimo 5 commits (uno por subtarea)
- NUNCA acumular más de 3 archivos sin commitear
- Push a la rama remota después de cada 3 commits como mínimo