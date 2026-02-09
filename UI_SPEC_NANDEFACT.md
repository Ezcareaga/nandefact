# UI/UX SPEC — ÑandeFact Frontend

> Especificación completa de pantallas, flujos, y diseño visual para el frontend Android.
> Target: Doña María, comerciante Mercado 4, Samsung A03 (2GB RAM), bajo el sol.
> Última actualización: 2026-02-09

---

## FILOSOFÍA DE DISEÑO

**El azul es la estrella, todo lo demás se calla.**

Fondo oscuro neutro, cards oscuras neutras, único toque de color real es el azul del hero button. Naranja y verde aparecen solo como señales funcionales (pendientes, aprobado), no como decoración. Minimalismo sobrio: un solo color protagonista (azul pastel), resto neutral.

**Background visual:** Garabatos abstractos sin significado específico, baja opacidad. Formas geométricas suaves (círculos, líneas curvas) que el cerebro registra como textura. No lapacho ni ñandutí reconocibles — nada que el usuario identifique como un dibujo concreto.

---

## PALETA DE COLORES

### Dark Mode (DEFAULT)

| Token | HEX | Uso |
|-------|-----|-----|
| `primary` | `#7B9CFF` | Hero button, links, acentos activos. Azul pastel suave, no eléctrico |
| `primaryVariant` | `#4D69FF` | Hover/pressed del hero, énfasis fuerte. Índigo solo para estados activos |
| `background` | `#0D1017` | Fondo de toda la app. Casi negro con tinte azul frío, no negro puro |
| `surface` | `#161A23` | Cards (Reportes, Productos, etc.). Gris oscuro frío |
| `surfaceVariant` | `#1E2330` | Card seleccionada, bordes sutiles. Un escalón más claro |
| `onBackground` | `#E8EAED` | Texto principal. Blanco roto, no #FFF puro |
| `onSurfaceVariant` | `#9AA0AC` | Texto secundario, labels, subtítulos |
| `success` | `#2D6A4F` | Dot aprobado, pantalla éxito. Verde bosque apagado |
| `warning` | `#C47A20` | Dot pendiente, borde card Pendientes. Naranja tierra |
| `warningContainer` | `#2A1F0E` | Fondo card Pendientes. Naranja oscurísimo |
| `error` | `#B84040` | Dot rechazado. Rojo apagado, serio |
| `outline` | `#2A2E38` | Bordes de cards. Casi invisible, solo estructura |

### Light Mode (pendiente definir en detalle)

Invertir: fondo blanco roto (`#F5F6FA`), cards blancas, mismo azul primary. Definir post-MVP. Dark primero como default.

### Reglas de color
- Dark mode como DEFAULT (cambiable en drawer config)
- Todo cumple WCAG AA (contraste 4.5:1 mínimo texto/fondo)
- El azul primary se siente "suave/pastel" — NO azul eléctrico ni corporativo
- Escala de grises fríos: verde, naranja y rojo son *señales*, no *decoración*

### Status Indicators
- **Dots de color** (8px circular), NO emojis ni íconos
  - `#2D6A4F` verde → factura aprobada
  - `#C47A20` naranja → factura pendiente
  - `#B84040` rojo → factura rechazada
- Sin texto de estado junto al dot (el color comunica solo)

---

## NAVEGACIÓN

### Estructura (sin bottom navigation)

Eliminada bottom navigation completa. Reemplazada por:

1. **Hamburger menu (☰)** arriba derecha → drawer lateral con:
   - 🌙 / ☀️ Dark/Light mode toggle
   - ⚙️ Config SIFEN (certificado, timbrado, ambiente)
   - 👥 Usuarios/Equipo (solo rol dueño)
   - 🚪 Cerrar sesión
   - ℹ️ Info app (versión, soporte)

2. **Pill Home (🏠)** centrada abajo, siempre visible excepto en Home:
   - Botón tipo pastilla redondeada, pequeño, no estorba
   - Accesible con pulgar desde cualquier pantalla sin estirar a back arrow
   - En Home: se oculta o baja opacidad
   - Razón: pantallas 6.5", uso con una mano, mucha gente no usa gestos Android

3. **Back arrow (←)** arriba izquierda en pantallas internas como estándar Android complementario

```
┌─────────────────────────────┐
│ Comercial El Triunfo    ☰  │  ← hamburger config
│                             │
│ ... contenido ...           │
│                             │
│           [ 🏠 ]            │  ← pill centrada abajo
└─────────────────────────────┘
```

### Flujos modales (full screen, sin pill Home ni drawer)
- Crear Factura → wizard 4 pasos
- Login

---

## PANTALLAS

### 1. HOME (Pantalla Principal)

**Objetivo:** Doña María abre la app y factura en menos de 3 toques.

```
┌─────────────────────────────┐
│ Comercial El Triunfo    ☰  │  ← nombre comercio + hamburger
│ Hola, Doña María 👋         │  ← saludo personalizado (grande, bold)
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │   GENERAR           📄  │ │  ← hero card, color primary, full width
│ │   FACTURA               │ │     ícono documento (da identidad)
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌───────────┐ ┌───────────┐ │
│ │  📊       │ │  📦       │ │
│ │ Reportes  │ │ Productos │ │  ← cards neutras (surface color)
│ └───────────┘ └───────────┘ │
│ ┌───────────┐ ┌───────────┐ │
│ │  👤       │ │  ● (3)    │ │  ← dot naranja + count, NO emoji ⚠️
│ │ Clientes  │ │ Pendientes│ │     borde naranja sutil + fondo warningContainer
│ └───────────┘ └───────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ● Última: Gs 450.000    │ │  ← barra inferior, dot verde + monto
│ │   Hace 5 min            │ │     solo aparece si hay facturas hoy
│ └─────────────────────────┘ │
│                             │
│ (sin pill Home — ya estás)  │
└─────────────────────────────┘
```

**Notas:**
- Hero card: "GENERAR FACTURA" (no "CREAR" ni "NUEVA"). Ícono documento a la derecha
- Badge de Pendientes: count dinámico de facturas estado='pendiente'
- Card Pendientes: borde `#C47A20` + fondo `#2A1F0E` (más sutil que fondo completo naranja)
- Venta reciente: barra inferior con dot verde + monto, integra info sin ocupar espacio (estilo mockup Ez)
- Estado SIFEN: no visible en Home. Solo se muestra en Pendientes y Config

### 2. FLUJO FACTURACIÓN (core — el 90% del uso)

Flujo de 4 pasos con progress indicator arriba. Full screen, sin pill Home ni drawer.

#### Paso 1: Seleccionar Productos

```
┌─────────────────────────────┐
│ ← Nueva Factura    Paso 1/4 │
│ ─────●────○────○────○────── │
│                             │
│ 🔍 Buscar producto...       │  ← search bar sticky arriba
│                             │
│ ┌─────────────────────────┐ │
│ │ Mandioca (kg)    Gs5.000│ │  ← toque simple = +1 (shortcut rápido)
│ │         [-] 3 [+]       │ │  ← cantidad editable
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Cebolla (kg)     Gs4.000│ │
│ │         [-] 0 [+]       │ │  ← gris si cantidad = 0
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Banana (docena) Gs15.000│ │
│ │         [-] 2 [+]       │ │
│ └─────────────────────────┘ │
│ ...                         │
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 2 productos — Gs 45.000     │  ← resumen flotante sticky bottom
│ [        SIGUIENTE →       ]│
└─────────────────────────────┘
```

**Notas:**
- Search bar filtra en tiempo real por nombre del producto
- Solo muestra productos activos del comercio
- **Toque simple en card = +1 cantidad** (shortcut rápido)
- Cantidad con +/- y también editable por toque directo (teclado numérico)
- Productos con cantidad > 0 suben al inicio de la lista
- NO avanza si 0 productos seleccionados (botón disabled)
- Escaneo código de barras → **Phase 2** (requiere permisos cámara + ML Kit)

#### Paso 2: Seleccionar Cliente + Condición

```
┌─────────────────────────────┐
│ ← Nueva Factura    Paso 2/4 │
│ ────────●────○────○──────── │
│                             │
│ CLIENTE                     │
│ ┌─────────────────────────┐ │
│ │ 🔍 Buscar por nombre o  │ │
│ │    CI/RUC...             │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  SIN NOMBRE             │ │  ← ghost button, para ventas casuales
│ └─────────────────────────┘ │     (innominado, 0 datos requeridos)
│                             │
│ ○ Con CI                    │
│ ○ Con RUC                   │
│                             │
│ ┌─ Si selecciona CI/RUC ──┐ │
│ │ CI/RUC: [____________]  │ │
│ │ Nombre: [____________]  │ │  ← auto-fill si existe en DB
│ │ Teléfono: [__________]  │ │  ← para WhatsApp
│ │ ☑ Guardar cliente       │ │  ← checked por default
│ └─────────────────────────┘ │
│                             │
│ CONDICIÓN DE PAGO           │
│ ┌───────────┐ ┌───────────┐ │
│ │ 💵        │ │ 📋        │ │
│ │ Contado ● │ │ Crédito   │ │
│ └───────────┘ └───────────┘ │
│                             │
│ [        SIGUIENTE →       ]│
└─────────────────────────────┘
```

**Notas:**
- **"SIN NOMBRE"** como ghost button prominente (no radio button escondido). Para ventas casuales sin documento
- Si ya tiene un cliente guardado, shortcut **"VENDER A ESTE CLIENTE"** aparece al seleccionarlo
- Buscar cliente: autocomplete contra DB local (SQLDelight)
- Si encuentra cliente existente, auto-llena todos los campos
- CI/RUC validation en tiempo real (formato válido)
- Condición crédito: no pide monto de entrega (fiado verbal Mercado 4)
- Contado es default
- Teléfono: con código de país pre-filled (+595)

#### Paso 3: Confirmar Factura (Preview)

```
┌─────────────────────────────┐
│ ← Nueva Factura    Paso 3/4 │
│ ───────────────●────○────── │
│                             │
│ RESUMEN DE FACTURA          │
│                             │
│ Cliente: Juan Pérez         │
│ CI: 4.567.890               │
│ Condición: Contado          │
│                             │
│ ─────────────────────────── │
│ Mandioca (kg)               │
│   3 × Gs 5.000    Gs 15.000│
│ Banana (docena)             │
│   2 × Gs 15.000   Gs 30.000│
│ ─────────────────────────── │
│                             │
│ Subtotal Gravada 10%  15.000│
│ Subtotal Gravada 5%   30.000│
│ IVA 10%                1.364│
│ IVA 5%                 1.429│
│ ─────────────────────────── │
│ TOTAL            Gs  45.000 │  ← grande, bold
│                             │
│ [    ✅ GENERAR FACTURA    ]│  ← botón grande, primary color
│                             │
│     Preparando factura...   │  ← loading text (no "Generando CDC...")
└─────────────────────────────┘
```

**Notas:**
- Vista previa exacta de lo que se va a facturar
- Desglose IVA visible (requisito SIFEN)
- Total en grande, prominente
- **NO hay checkbox de WhatsApp en este paso** (0 fricción, se resuelve en pantalla final)
- Botón "GENERAR FACTURA" en color primary
- Loading text: "Preparando factura..." (sin jerga técnica)
- Al tocar: genera CDC, crea XML, guarda en SQLDelight → feedback INMEDIATO
- NO espera respuesta del backend ni de SIFEN

#### Paso 4: Confirmación + Entrega

```
┌─────────────────────────────┐
│                             │
│         ✅                  │  ← ícono animado (simple, no Lottie pesado)
│                             │
│   ¡Factura Generada!        │  ← título grande
│                             │
│   Factura #001-001-0000137  │
│   Total: Gs 45.000          │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📱 Enviar por WhatsApp  │ │  ← ver lógica WhatsApp abajo
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 📲 Mostrar QR           │ │  ← cliente escanea, consulta en e-Kuatia
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🖨️ Imprimir Bluetooth   │ │  ← si tiene impresora POS
│ └─────────────────────────┘ │
│                             │
│ [    🔄 NUEVA VENTA        ]│  ← primary (azul), acción principal
│ [    🏠 Volver al Inicio    ]│  ← secondary (outline/ghost)
└─────────────────────────────┘
```

**Lógica WhatsApp — Híbrido Inteligente:**

| Caso | Comportamiento |
|------|----------------|
| Cliente frecuente guardado con teléfono + preferencia WhatsApp ON | Auto-envío en background. Botón cambia a "Enviado por WhatsApp ✅" |
| Cliente nuevo con teléfono | Botón manual "📱 Enviar por WhatsApp" |
| Cliente sin teléfono | Botón WhatsApp deshabilitado/oculto. Solo QR o Imprimir |
| Venta casual sin documento ("SIN NOMBRE") | Toca "NUEVA VENTA" directo, no envía nada |

**0 fricción durante facturación** — la decisión de envío se toma en la pantalla final, no durante el wizard.

**Botones finales:**
- **🔄 NUEVA VENTA** → primary (azul), acción principal. Lo más frecuente: doña María factura seguido
- **🏠 Volver al Inicio** → secondary (outline/ghost). Para cuando quiere ver reportes o pendientes

### 3. HISTORIAL DE FACTURAS

```
┌─────────────────────────────┐
│ ← Facturas                  │
│                             │
│ 🔍 Buscar por nro o cliente │
│                             │
│ [Hoy] [Semana] [Mes] [Todo] │  ← filtros rápidos
│                             │
│ ┌─────────────────────────┐ │
│ │ #001-001-0000140      ● │ │  ← dot verde (aprobada)
│ │ Juan Pérez              │ │
│ │ Gs 45.000     14:30     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ #001-001-0000139      ● │ │  ← dot naranja (pendiente)
│ │ Sin documento           │ │
│ │ Gs 12.000     13:15     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ #001-001-0000138      ● │ │  ← dot rojo (rechazada)
│ │ María G.                │ │
│ │ Gs 80.000     11:00     │ │
│ └─────────────────────────┘ │
│ ...                         │
│                             │
│           [ 🏠 ]            │
└─────────────────────────────┘
```

**Detalle al tocar:**
- Vista completa de la factura con items, montos, IVA
- Estado SIFEN con respuesta
- Acciones: Reenviar WhatsApp, Mostrar QR, Imprimir, Anular (con confirmación PIN)

### 4. REPORTES

```
┌─────────────────────────────┐
│ ← Reportes                  │
│                             │
│ [Hoy] [Semana] [Mes]       │
│                             │
│ ┌─────────────────────────┐ │
│ │ Ventas del período       │ │
│ │ Gs 2.450.000            │ │  ← grande, bold
│ │ 47 facturas              │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ IVA 10%: Gs 180.000     │ │
│ │ IVA 5%:  Gs 95.000      │ │
│ │ Exenta:  Gs 320.000     │ │
│ └─────────────────────────┘ │
│                             │
│ Más vendidos                │
│ 1. Mandioca — 120 kg       │
│ 2. Banana — 45 docenas     │
│ 3. Cebolla — 80 kg         │
│                             │
│           [ 🏠 ]            │
└─────────────────────────────┘
```

### 5. PRODUCTOS (CRUD)

```
┌─────────────────────────────┐
│ ← Productos            [+] │
│                             │
│ 🔍 Buscar producto...       │
│                             │
│ ┌─────────────────────────┐ │
│ │ Mandioca                │ │
│ │ Gs 5.000/kg — IVA 5%   │ │
│ │ Categoría: Tubérculos   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Banana                  │ │
│ │ Gs 15.000/doc — IVA 5%  │ │
│ │ Categoría: Frutas       │ │
│ └─────────────────────────┘ │
│ ...                         │
│                             │
│           [ 🏠 ]            │
└─────────────────────────────┘
```

**Al tocar → Editar. Botón + → Crear nuevo:**
- Nombre (obligatorio)
- Precio unitario en Gs (obligatorio, solo números)
- Unidad de medida (selector: unidad, kg, litro, docena)
- Tasa IVA (selector: 10%, 5%, Exenta)
- Categoría (texto libre o selector)
- Botón guardar + botón desactivar (soft delete)

### 6. CLIENTES (CRUD)

```
┌─────────────────────────────┐
│ ← Clientes             [+] │
│                             │
│ 🔍 Buscar por nombre o CI  │
│                             │
│ ┌─────────────────────────┐ │
│ │ Juan Pérez              │ │
│ │ CI: 4.567.890           │ │
│ │ 📱 0981-XXX-XXX        │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Distribuidora ABC       │ │
│ │ RUC: 80012345-6         │ │
│ │ 📱 021-XXX-XXX         │ │
│ └─────────────────────────┘ │
│ ...                         │
│                             │
│           [ 🏠 ]            │
└─────────────────────────────┘
```

**Formulario cliente:**
- Nombre/Razón Social (obligatorio)
- Tipo documento: CI / RUC / Pasaporte / Sin documento
- Número documento (validación según tipo)
- Teléfono (para WhatsApp)
- Email (opcional)
- Toggle "Enviar WhatsApp automático" (default ON) — controla auto-envío en pantalla final

### 7. CONFIGURACIÓN (drawer lateral)

Accesible desde hamburger ☰ arriba derecha:

```
┌─────────────────────────────┐
│ Configuración               │
│                             │
│ MI COMERCIO                 │
│ ┌─────────────────────────┐ │
│ │ Comercial El Triunfo    │ │
│ │ RUC: 80069563-1         │ │
│ │ Timbrado: 12558946      │ │
│ │ Vigente hasta: 2027-03  │ │
│ │ [Editar datos]          │ │
│ └─────────────────────────┘ │
│                             │
│ EQUIPO (solo rol dueño)     │
│ ┌─────────────────────────┐ │
│ │ 👤 Doña María (dueño)   │ │
│ │ 👤 Carlos (empleado)    │ │
│ │ [+ Agregar vendedor]    │ │
│ └─────────────────────────┘ │
│                             │
│ APARIENCIA                  │
│ ○ Claro  ● Oscuro          │
│                             │
│ SIFEN                       │
│ Certificado: ✅ Cargado     │
│ Última sync: Hace 2 min     │
│ Ambiente: Producción        │
│                             │
│ CUENTA                      │
│ Plan: Ñande (Gs 100.000/mes)│
│ [Cerrar sesión]             │
└─────────────────────────────┘
```

### 8. LOGIN

```
┌─────────────────────────────┐
│                             │
│     [Logo ÑandeFact]        │
│                             │
│     Bienvenido              │
│                             │
│ Teléfono                    │
│ ┌─────────────────────────┐ │
│ │ +595 │ 0981-XXX-XXX    │ │
│ └─────────────────────────┘ │
│                             │
│ PIN                         │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│ │● │ │● │ │● │ │  │       │
│ └──┘ └──┘ └──┘ └──┘       │
│                             │
│ [       Ingresar           ]│
│                             │
│ ¿Primera vez?               │
│ Tu dueño debe registrarte   │
│ desde su app.               │
└─────────────────────────────┘
```

**Notas:**
- Login con teléfono + PIN (no email/password)
- Rate limiting: 5 intentos → bloqueo 30 min
- No hay registro público — el dueño agrega vendedores desde Config > Equipo
- Full screen, sin pill Home ni drawer

### 9. PENDIENTES (Cola Offline)

```
┌─────────────────────────────┐
│ ← Pendientes          (3)  │
│                             │
│ 3 facturas esperando        │
│ conexión a internet         │
│                             │
│ ┌─────────────────────────┐ │
│ │ #001-001-0000140      ● │ │  ← dot naranja
│ │ Juan Pérez — Gs 45.000  │ │
│ │ Creada: 14:30           │ │
│ │ En cola (posición 1)    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ #001-001-0000139      ● │ │
│ │ Sin doc — Gs 12.000     │ │
│ │ Creada: 13:15           │ │
│ │ En cola (posición 2)    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ #001-001-0000138      ● │ │  ← dot rojo (error)
│ │ María G. — Gs 80.000   │ │
│ │ Creada: 11:00           │ │
│ │ Error: RUC inválido     │ │
│ │ [Reintentar] [Editar]   │ │
│ └─────────────────────────┘ │
│                             │
│ Orden: FIFO (primera en     │
│ entrar, primera en enviarse)│
│                             │
│ [  🔄 Sincronizar Ahora   ]│  ← forzar sync manual
│                             │
│           [ 🏠 ]            │
└─────────────────────────────┘
```

---

## SINCRONIZACIÓN OFFLINE

### Estrategia: Automática + Manual como respaldo

| Mecanismo | Detalle |
|-----------|---------|
| **Automático** | WorkManager de Android detecta internet, envía facturas pendientes FIFO cada ~15 min si hay pendientes |
| **Manual** | Botón "Sincronizar Ahora" en pantalla Pendientes para cuando doña María está nerviosa |
| **Backoff** | Reintentos con backoff exponencial para errores de red |
| **Plazo SIFEN** | Facturas deben enviarse dentro de 72 horas post-emisión |
| **Si falla una** | Sigue con las demás en la cola, no bloquea |

### Post-sync visual
- **NO auto-navigate** al completar sync
- Animación in-place: dot naranja → dot verde (300ms transition) en card de Pendientes
- Count badge en Home se actualiza automáticamente
- Barra "Última factura" en Home actualiza si corresponde
- **Bloqueo UI durante sync activa** para evitar estados inconsistentes

---

## FLUJOS ESPECIALES

### Venta Rápida Casual
1. Home → GENERAR FACTURA
2. Seleccionar productos (toque = +1)
3. **SIN NOMBRE** (ghost button, 0 datos)
4. Confirmar → listo
5. Pantalla final: solo "NUEVA VENTA" (no envía WhatsApp ni QR)

### Cliente Frecuente (flujo más rápido)
1. Home → GENERAR FACTURA
2. Seleccionar productos
3. Buscar cliente → auto-fill → **VENDER A ESTE CLIENTE** (shortcut)
4. Confirmar → WhatsApp auto-enviado en background
5. "Enviado por WhatsApp ✅" visible, toca "NUEVA VENTA"

---

## PRINCIPIOS UX

### Para doña María
1. **3 toques para facturar** — Home → GENERAR FACTURA → seleccionar → confirmar
2. **Texto grande, botones grandes** — dedo gordo, sol, pantalla 720p
3. **Español paraguayo** — "Facturar", no "Emitir DE". "Pendientes", no "Cola de sincronización"
4. **Feedback inmediato** — nunca esperar SIFEN. Confirmar local, sync en background
5. **Sin jerga técnica** — CDC, XML, SOAP no aparecen en UI. Solo "Factura #137"
6. **Loading text humano** — "Preparando factura..." no "Generando CDC y firmando XML..."

### Controles y feedback
- **Loading**: skeleton shimmer en cards, no spinner genérico
- **Errores**: toast con mensaje claro + acción ("Reintentar")
- **Éxito**: animación sutil (check verde) + haptic feedback
- **Offline**: banner permanente arriba "Sin conexión — facturas se guardan localmente"
- **Validación**: inline bajo cada campo, rojo, con mensaje específico

### Performance (Samsung A03, 2GB RAM)
- Lazy loading en listas (LazyColumn)
- Máximo 20 items por página, paginación al scroll
- Imágenes: no usar en listas de productos/clientes (solo íconos)
- Animaciones: simples (alpha, translate), no Lottie pesados
- State: ViewModel con StateFlow, no LiveData
- No cargar datos que no se ven (tabs lazy)

---

## COMPONENTES REUTILIZABLES

| Componente | Uso |
|------------|-----|
| `NfCard` | Card base con surface color, border outline, radius 14dp |
| `NfHeroCard` | Card grande primary color (GENERAR FACTURA) con ícono |
| `NfStatusDot` | Dot 8px circular de color (verde/naranja/rojo) |
| `NfSearchBar` | Barra de búsqueda con ícono y filtrado en tiempo real |
| `NfAmountDisplay` | Muestra monto en Gs formateado (Gs 1.250.000) sin decimales |
| `NfProgressBar` | Indicador de pasos (1/4, 2/4, etc.) |
| `NfQuantitySelector` | Control +/- con número editable al centro + toque = +1 |
| `NfClientSelector` | Buscador + ghost button SIN NOMBRE + radio CI/RUC |
| `NfPaymentToggle` | Toggle cards Contado/Crédito |
| `NfOfflineBanner` | Banner amarillo "Sin conexión" sticky top |
| `NfEmptyState` | Ilustración + texto cuando una lista está vacía |
| `NfBottomSheet` | Sheet para confirmaciones y acciones secundarias |
| `NfPinInput` | Input de PIN con dots (login + operaciones sensibles) |
| `NfHomePill` | Pill 🏠 centrada abajo, siempre visible excepto en Home |
| `NfDrawerMenu` | Drawer lateral desde hamburger ☰ |
| `NfDeliveryButtons` | Grupo de botones entrega (WhatsApp, QR, Imprimir) |

---

## FORMATO DE MONTOS

- Siempre "Gs" como prefijo (no ₲)
- Separador de miles: punto (Gs 1.250.000)
- Sin decimales (PYG no tiene)
- Alineación derecha en listas de precios
- Total siempre bold y más grande que subtotales

---

## DECISIONES CERRADAS (registro)

| # | Decisión | Opción elegida | Razón |
|---|----------|---------------|-------|
| 1 | Nombre botón hero | "GENERAR FACTURA" | Claro, sin jerga, acción directa |
| 2 | Status indicators | Dots de color 8px | Más profesional que emojis, mínimo espacio |
| 3 | Background pattern | Garabatos abstractos baja opacidad | Textura sin significado concreto |
| 4 | Navegación config | Hamburger ☰ → drawer lateral | Config no es uso frecuente |
| 5 | Botón Home | Pill centrada abajo | Accesible con pulgar sin estirar |
| 6 | Bottom nav completa | Eliminada | Home centraliza todo, pill basta |
| 7 | Post-sync | Animación naranja→verde in-place | Sin auto-navigate, usuario decide |
| 8 | Sync offline | Auto (WorkManager ~15min) + manual | Doble seguridad |
| 9 | Loading factura | "Preparando factura..." | Sin jerga técnica |
| 10 | Código barras | Phase 2 | Requiere cámara + ML Kit |
| 11 | WhatsApp flow | Híbrido: auto para frecuentes, manual resto | 0 fricción en wizard |
| 12 | Botones post-factura | NUEVA VENTA (primary) + Volver Inicio (ghost) | Venta repetida es lo más frecuente |
| 13 | Paleta colores | Azul pastel protagonista, grises fríos | Minimalismo sobrio, un solo acento |
| 14 | Theme default | Dark mode | Definido, light mode post-MVP |
| 15 | SIN NOMBRE | Ghost button prominente paso 2 | Venta casual sin fricción |
| 16 | Pantalla éxito color | Verde bosque `#2D6A4F` | Coherente con paleta, no neón |
| 17 | Card pendientes | Borde naranja + fondo warningContainer | Más sutil que fondo completo (mockup Ez) |
| 18 | Venta reciente home | Barra inferior dot verde + monto | Integra info sin card separada (mockup Ez) |
| 19 | Entrega factura | 3 botones: WhatsApp, QR, Imprimir BT | El cliente elige en el momento |
| 20 | QR | Muestra QR para que cliente escanee → e-Kuatia | Verificación pública SIFEN |

---

*Documento generado: 2026-02-09*
*Basado en: mockups Ez, documento de flujos Ez, sesiones de diseño Claude-Ez*
