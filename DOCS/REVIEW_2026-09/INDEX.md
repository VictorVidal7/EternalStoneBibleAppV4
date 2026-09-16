# 🔍 Revisión profunda 2026-09 — ÍNDICE (ledger de checkpoints)

> **Frontera actual: Modo A · fila `A12`, que está `EN CURSO` (parcial).** Sesión 2 cerró
> todo el Modo B P0. Sesión 3 cerró 6 filas del Modo A P0 (`R9-9`..`R9-32`, 9 P0). Sesiones
> 4 y 5 cerraron `A4` (`R9-33`..`R9-39`, 6 P0) y registraron 4 reportes de campo
> (`R9-40`..`R9-43`). **Sesión 6 (2026-09-14) cerró `A8`, `A9`, `A10` y `A11` con
> 21 hallazgos nuevos (`R9-44`..`R9-64`), 6 de ellos P0** — y dejó `A12` empezada a
> propósito.
>
> **Sesión 7 (2026-09-14) no revisó: ARREGLÓ.** Cerró en código los **7 P0 de pérdida
> irreversible de datos** (`R9-27`, `R9-28`, `R9-44`, `R9-45`, `R9-47`, `R9-49`, `R9-50`) en
> `fix/review-p0-perdida-datos` (`7f8e666`), cada uno con prueba de regresión y con las tres
> compuertas verdes. Entre ellos, **la raíz común de `{merge:true}`**: `withoutUndefined`
> pasó a `nullifyUndefined`, así que un campo opcional por fin se puede desasignar por sync.
>
> **Sesión 8 (2026-09-15) revisó el diff de la 7, lo mergeó a `main`, y ARREGLÓ 4 P0 más**
> (`R9-46` + el bloque entero de mezcla entre cuentas: `R9-22`, `R9-23`, `R9-48`).
> **Sesión 9 (2026-09-15) revisó ESE diff, encontró 2 defectos reales, los arregló y mergeó**
> — y después cerró `R9-33`, `R9-34` y `R9-35`.
> **Sesión 10 (2026-09-15) revisó el diff de la 9 y encontró que la prueba de `R9-34` no
> discriminaba** (el backoff de `R9-33`, del mismo commit, hacía que la carrera no ocurriera);
> la reescribió, remató un hueco de `stop()`, mergeó a `main` — y después cerró **los 2 P0 de
> dinero, `R9-9` y `R9-10`, juntos**, porque el segundo anulaba el arreglo del primero.
> **Todo mergeado y PUSHEADO**; no queda rama de arreglos pendiente.
> **Sesión 11 (2026-09-15) cerró `R9-11`** —el gemelo de `R9-34` en la rama de ÉXITO de
> `flush()`, o sea la común, cuyo vecino se tragaba una LÁPIDA— **y `R9-65`**, y saldó la
> deuda más vieja: `R9-28` por fin tiene prueba, así que **no queda ningún arreglo sin una**.
> **Todo mergeado y PUSHEADO**; no queda rama de arreglos pendiente.
> **Sesión 12 (2026-09-15) cerró el bloque WEB: `R9-13`, `R9-15` y `R9-14`.** El orden fue
> deliberado — primero `R9-15`, el test que enmascaraba, para **ver el crash de producción
> ponerse rojo en la compuerta**, y solo después `R9-13`. De `R9-14` se tomó la opción
> estructural (un `ErrorBoundary` **por ruta** en los dos niveles del árbol web), que acota
> la clase entera en vez de las 7 rutas contadas; lo que queda de esa entrada es decisión de
> producto, no código. Además se remató la clase de `R9-13` con una compuerta de **paridad
> de superficie sobre los 14 pares** `.web`/nativo. **Y se cerró la duda que el detalle de
> `A6` dejaba abierta desde la sesión 3: verificado en un navegador de verdad**, sobre el
> bundle real de `expo export --platform web`.
>
> **Sesión 13 (2026-09-15) revisó el diff de la 12 y encontró 6 defectos, ninguno P0**
> (`R9-66`, `R9-67` en P1; `R9-68`, `R9-69`, `R9-70`, `R9-71` en P2). Los tres arreglos de la 12 se
> sostienen y sus pruebas discriminan — verificado revirtiendo cada uno. **Los cinco defectos
> están en los BORDES de esos arreglos**, y los dos P1 comparten forma: _una verificación cuyo
> cuerpo entero es un bucle pasa cuando no hay nada que recorrer, imprimiendo un mensaje de
> éxito._ `verifyRedLetterAlignment` decía «ALL slices non-blank and in-range» sobre CERO
> spans —y eso es lo único del programa que toca **datos ya publicados**— y la compuerta de
> paridad comparaba contra un conjunto vacío, dejando pasar `R9-13` al pie de la letra en
> forma `export {x}` con la suite en verde 30/30.
>
> **Segunda mitad de la sesión 12: las dos cosas que habían quedado «dichas, no arregladas»
> se arreglaron de verdad.** (1) La letra roja en web ya no es solo en inglés: el build emite
> un pack **por versión**, el módulo web carga el que toca, y el lector pregunta
> `hasRedLetterData` en vez de comparar contra `'WEB'` a mano. **Queda un paso manual de
> Victor: subir `rvr1960-red-letter.json` al repo de Pages.** (2) Las 7 rutas de `R9-14`
> siguen sin funcionar en web —eso es de diseño— pero ya lo **dicen**, con «Esta sección no
> está en la versión web» y un botón que sale, en vez de un «Algo salió mal» cuyo
> «Reintentar» no puede funcionar. Las dos verificadas en navegador.
>
> **Sesión 14 (2026-09-15) revisó el diff de la 13 y encontró 5 defectos, ninguno P0**
> (`R9-72`, `R9-73` en P1; `R9-74`, `R9-75`, `R9-76` en P2). **Los 6 arreglos de la 13 se
> sostienen y sus 6 pruebas discriminan**, y los cuatro sha256 de los packs siguen idénticos al
> manifiesto publicado. Los 5 defectos están otra vez en las **compuertas**, y los dos P1
> repiten la forma de `R9-66`: un bucle que recorre la lista NUEVA no ve lo que falta de la
> vieja. Los otros tres son la misma familia: **un discriminador que depende de lo que decida
> el propio código vigilado, y un silencio que significa a la vez «verificado» y «no miré»**.
> Los 5 arreglados en la misma sesión.
>
> **Sesión 15 (2026-09-15) revisó el diff de la 14 y encontró 5 defectos, ninguno P0**
> (`R9-77`, `R9-78` en P1; `R9-79`, `R9-80`, `R9-81` en P2). **Los 3 arreglos de la 14 se
> sostienen y sus pruebas discriminan**, verificado revirtiendo cada uno **por separado** (4,
> 6 y 3 rojas, controles verdes en los tres), y **ninguno desarma la prueba del otro** — que
> era el riesgo concreto de un commit con tres arreglos dentro. Los cuatro sha256 siguen
> idénticos al manifiesto **y a lo que hoy sirve GitHub Pages**. **Tercera sesión seguida con
> todos los defectos en las COMPUERTAS**, y ya con una regularidad que se puede nombrar: **una
> compuerta escrita para cerrar un caso cierra ese caso y deja abierto el vecino que la
> motivó**. Los 5 arreglados en la misma sesión.
>
> **Sesión 16 (2026-09-16) revisó el diff de la 15 y encontró 5 defectos, ninguno P0**
> (`R9-82`, `R9-83` en P1; `R9-84`, `R9-85`, `R9-86` en P2). **Los 5 arreglos de la 15 se
> sostienen** (7, 3, 1, **0** y 2 rojas al revertir cada uno por separado) — y ese **0** es
> `R9-86`: el arreglo de `R9-80` funciona, pero su prueba **reimplementa el escáner en vez de
> llamarlo**, así que no protege nada. **El hallazgo que manda no estaba en el diff:** `main`
> llevaba un día en **ROJO en CI** porque `node:sqlite` no existe en Node 20 y `ci.yml` lo
> fijaba, así que la compuerta que vigila los datos publicados **nunca se ejecutó en CI** —
> y la rama de la 15 añadía una segunda suite muerta (55 pruebas). Cuarta sesión seguida con
> los defectos en las COMPUERTAS, y una forma nueva: **una compuerta que nunca llegó a
> EJECUTARSE se ve igual que una que pasó**. Los 5 arreglados en la misma sesión, **mergeados y
> pusheados** (`531ffef`), y **CI verde verificado en el log del run** (Node v24.20.0,
> `buildWebPacks.test.js` PASS, 363/4263, cero «failed to run»).
>
> **Sesión 17 (2026-09-16) revisó el diff de la 16 y encontró 10 defectos, ninguno P0**
> (`R9-87`, `R9-88`, `R9-89` en P1; `R9-90`..`R9-96` en P2). **Los 5 arreglos de la 16 se
> sostienen.** Quinta sesión seguida con los defectos en las COMPUERTAS, y **cuatro de los cinco
> arreglos dejaron abierto justo el vecino que los motivó**. Lo que más vale: con la escritura
> del manifiesto desactivada del todo **el repo ENTERO sale verde** — el `beforeEach` que
> `R9-83` añadió RESPONDÍA la pregunta que la única aserción que la fijaba hacía (`R9-87`); y el
> piso `">=22"` es **falso** (`node:sqlite` se desbanderó en **22.13.0**) mientras la compuerta
> **prohibía** escribir el verdadero (`R9-88`). Dos formas nuevas: **el piso de una compuerta
> suele ser el número de HOY, así que exige ese número en vez de cobertura**, y **un fixture
> añadido para habilitar una prueba puede RESPONDER la pregunta que otra hacía**. Los 10
> arreglados en la misma sesión.
>
> **Quedan 3 P0 abiertos** (`R9-36`, `R9-38`, `R9-39`) — **ninguno bloquea el deploy web ya**.
> Hallazgos: **96**. **El conteo venía mal desde la sesión 7** — ver la nota al principio de
> la sección P0 de `BUGS.md`.
>
> Siguiente: terminar `A12` (hay 3 hilos ya abiertos en su detalle), con lo que **queda
> cerrado el bloque P0 entero del Modo A**. O los 3 P0 que quedan, o los 4 reportes de campo
> (`R9-40`..`R9-43`), que son baratos y muy visibles.

Charter completo: [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md). Este archivo es lo único
que hay que leer al reanudar. **Para arrancar un chat nuevo:**
[`CONTINUAR.md`](CONTINUAR.md), que ya trae el mensaje inicial y las reglas que ya
costaron caro.

---

## Protocolo (resumen — el detalle está en el charter §1)

1. **Solo revisar y reportar. NO se toca código de la app.** Lo único que se escribe
   es este ledger. Las "mejoras" (Modo D) se redactan como propuesta, no se aplican.
2. **Reanudar:** lee este archivo entero y continúa desde la primera fila `PENDIENTE`
   o `EN CURSO`, respetando prioridad (P0 → P1 → P2) y luego el orden del índice.
3. **Checkpoint por área:** al terminar un área, escribe de inmediato (a) su fila aquí
   y (b) `detail/<slug>.md`. No esperes al final de la sesión.
4. **Un hallazgo ≠ arreglarlo.** Márcalo y regístralo en [`BUGS.md`](BUGS.md). No lo
   arregles.
5. **No mezcles modos en una misma sesión** — cada modo tiene su propio entorno (el
   Modo C paga ~15 min de arranque de emulador).
6. **Revisa primero lo que los tests ya cubren:** 365 archivos de test / ~4027 tests.
   `grep` en `__tests__/` por el área antes de re-derivar terreno cubierto.
7. Sin evidencia, el hallazgo no entra al ledger (estándar por modo: charter §3).

**Convención de la columna Detalle:** slug pelón, sin ruta ni enlace. `A1` →
`detail/A1-premium-revenuecat.md`. Mientras la fila esté `PENDIENTE` la celda va
vacía (`—`).

**`_scratch/` está en `.gitignore`** (decisión de Victor, sesión 1): los scratch de
agentes en fan-out no ensucian `git status`. Créalo cuando haya el primer fan-out; el
orquestador los fusiona al índice y a `detail/` en una sola pasada y luego los borra.

**Estados:** `PENDIENTE` · `EN CURSO` · `✅ OK` · `🐛 BUG` · `⚠️ DUDA/PARCIAL` ·
`💡 MEJORA` · `⛔ NO PROBABLE AQUÍ`

**Orden sugerido de sesiones** (no obligatorio, pero minimiza cambios de entorno):
Modo B P0 (B1–B5, baratas y sin setup) → Modo A P0 (A1–A12, el mayor valor) →
Modo C P0 (una sola arrancada de emulador) → luego P1 por modo → P2 → Modo D al final.

---

## Prioridades

- **P0 — dinero, identidad, pérdida de datos, seguridad.** RevenueCat / hoja de
  ofrenda / gating premium en toda la app · Firebase Auth + borrado de cuenta · rutas
  con pérdida de datos (notas, Mesa, rachas, SRS, `BackupService`) · conflictos de
  sync · secretos/llaves · superficies de crash · reglas de Firestore.
- **P1 — núcleo.** Lectura · lector inmersivo · audio/TTS · memoria/SRS · quiz ·
  búsqueda · word study · Home · Ajustes · onboarding · compartir · logros.
- **P2 — todo lo demás + pulido + propuestas.**

Una fila es P0 **solo si** la preocupación de dinero/identidad/datos/seguridad es lo
que de hecho se ejercitaría en esa fila. Donde un área grande tiene una rebanada P0
estrecha, está partida en dos filas (`20a`/`20b`, `26a`/`26b`, `27a`/`27b`, etc.) para
que una sesión P0 no se gaste el margen en UI de bajo riesgo.

---

## Entorno

- **Modo A / B / D:** ninguno, repo puro.
- **Modo C:** emulador Android + Metro + APK **debug**. NUNCA el OnePlus de Victor.
  Recipe completo, gotchas de `adb` en Windows, deep links y el toggle premium de dev
  (Ajustes → "Extras" → "Extras desbloqueados (solo desarrollo)") en la memoria
  `reference_essb-device-testing-and-automation`. Playbook de acceso por área (deep
  links + líneas de gate) en `DOCS/QA_REVISION_FABLE.md` §Apéndice — sigue vigente.

---

## Ya conocido — NO reportar como hallazgo nuevo

Verificado contra `git log` el 2026-09-03 (`main` = `origin/main` = `f9d6b27`).

- **Los 12 bugs de la revisión Fable (julio) están cerrados.** 11 se arreglaron en las
  tandas A–E el mismo día; **BUG-10** (profecías, scroll) se verificó hoy como
  arreglado en `b17ec99` (hay un `useEffect` de `scrollTo({y:0})` por cambio de fase en
  `app/features/prophecies/index.tsx:297-299`, con comentario que cita "QA BUG-10").
  El charter §3 lo listaba como semilla abierta — ese dato estaba **obsoleto**.
  Los otros 11 no se han re-verificado en vivo en esta revisión.
- **Backlog abierto de producto** (de `essb-master-backlog`, no son bugs de esta
  revisión): lanzamiento público en Play Store (Track 2, bloqueado por la puerta de
  Google 12 testers × 14 días) · licencia NLT/Tyndale sin respuesta · registro de marca
  IMPI (tarea legal de Victor) · mapa geográfico real para "Rutas bíblicas" (diferido
  a propósito por Victor — el estilo riel-con-nodos actual es su elección, no un
  placeholder). **El merge de `chore/release-3.2.62` YA NO está abierto** — se hizo en
  `19fee16` y la rama se borró; `main` lleva `3.2.62` / `versionCode 74` (verificado
  contra `git log` el 2026-09-14).
- **Comportamientos del emulador que NO son bugs de la app:** el AVD silencia
  `expo-speech` (`AudioHardening`), y `expo-av` está en `package.json` pero nada en
  `src/` lo importa — el audio es `expo-speech`. Ver la memoria de device-testing.
- **Excepciones legítimas de hex hardcodeado** (no las marques como violación de
  theming): texto de chrome siempre-oscuro sobre `gradient.headerColors`, las
  plantillas de imagen `FREE_TEMPLATES`, y `staticColors`. Ver la memoria
  `feedback_essb-theme-and-navigation-patterns`.
- **Piso de sync aceptado a propósito:** `reviewCard()` en `MemoryDeckContext` dispara
  una escritura Firestore por repaso real — evaluado y aceptado, no es un hallazgo.
- **La suite es estructuralmente CIEGA al horario de verano** (sesión 6, fila `A11`).
  Ninguna prueba del repo fija `TZ`, y el CI y la máquina de Victor corren en
  `America/Mexico_City`, **que abolió el DST en 2022** → ningún test puede detectar jamás
  un bug de cambio de hora. Es un **cuarto punto ciego**, junto a la resolución de módulos
  por plataforma, la dirección inversa de cada flujo y las listas enumeradas a mano.
  Cualquier área que agrupe por día/semana/mes merece esa lente. Gotcha: `TZ=... npx jest`
  **no** propaga la variable desde Bash en Windows; usar
  `$env:TZ = 'Europe/Madrid'; npx jest <ruta>` en PowerShell.
- **Hay 5 adaptadores de sync, no 3** (corrección de la sesión 6): `notes`, `highlights`,
  `reviewEvents` (`registerOfflineAdapters.ts:17-19`), **`favorites`**
  (`FavoritesContext.tsx:228`) y **`memoryDeck`** (`MemoryDeckContext.tsx:267`) — los dos
  últimos se registran desde sus contextos. Las 8 colecciones Firestore están enumeradas en
  `deleteAccountData.ts:22-43`. **Ninguna es progreso de lectura, racha, planes ni logros:
  eso NO viaja entre dispositivos**, solo por respaldo manual.
- **La Mesa no vive en `src/features/prep/`** (esa carpeta está vacía): los stores están en
  `src/features/study/` y las pantallas en `app/features/prep/`.

---

## Modo A — Auditoría estática de código

| #   | Área                                                               | Prioridad | Estado    | Detalle                         |
| --- | ------------------------------------------------------------------ | --------- | --------- | ------------------------------- |
| A1  | Premium: `PremiumContext` + RevenueCat + entitlements              | P0        | 🐛 BUG    | `A1-premium-revenuecat`         |
| A2  | Ofrenda/Donación: `offeringService`, `giftCodeService`             | P0        | 🐛 BUG    | `A2-ofrenda-donacion-giftcodes` |
| A3  | Auth: `AuthContext` + borrado de cuenta                            | P0        | 🐛 BUG    | `A3-auth-borrado-cuenta`        |
| A4  | Sync: `SyncEngine.ts` (1378 L) y colas de escritura                | P0        | 🐛 BUG    | `A4-syncengine`                 |
| A5  | Auditoría de TODAS las escrituras a Firestore (call sites)         | P0        | 🐛 BUG    | `A5-escrituras-firestore`       |
| A6  | Paridad web/native (`*.web.tsx` premium/offering/memory)           | P0        | 🐛 BUG    | `A6-paridad-web-native`         |
| A7  | `services/BackupService.ts` (1526 L) — respaldar/restaurar         | P0        | 🐛 BUG    | `A7-backupservice`              |
| A8  | Persistencia de notas y subrayados (`lib/notes`, `lib/highlights`) | P0        | 🐛 BUG    | `A8-notas-subrayados`           |
| A9  | Persistencia/autoguardado de la Mesa (`features/prep`)             | P0        | 🐛 BUG    | `A9-mesa-persistencia`          |
| A10 | Memoria/SRS: `MemoryDeckContext`, `lib/memory`                     | P0        | 🐛 BUG    | `A10-memoria-srs`               |
| A11 | Progreso y rachas: `lib/progress`, `lib/reading`, rings            | P0        | 🐛 BUG    | `A11-progreso-rachas`           |
| A12 | Superficies de crash: error boundaries, promesas sin catch         | P0        | EN CURSO  | `A12-superficies-crash`         |
| A13 | Lector de capítulo (`verse/[book]/[chapter].tsx`, 3975 L)          | P1        | PENDIENTE | —                               |
| A14 | Capa de base de datos (`lib/database/index.ts`, 2425 L)            | P1        | PENDIENTE | —                               |
| A15 | Audio/TTS (`features/audio`, `lib/speech`)                         | P1        | PENDIENTE | —                               |
| A16 | Búsqueda (`lib/search`, `(tabs)/search.tsx`)                       | P1        | PENDIENTE | —                               |
| A17 | Quiz (`features/quiz`, `app/features/quiz`)                        | P1        | PENDIENTE | —                               |
| A18 | Word study / idiomas originales (`features/study`)                 | P1        | PENDIENTE | —                               |
| A19 | Home (`(tabs)/index.tsx`, 2671 L)                                  | P1        | PENDIENTE | —                               |
| A20 | Ajustes (`(tabs)/settings.tsx`, 1289 L)                            | P1        | PENDIENTE | —                               |
| A21 | Onboarding (`lib/onboarding`, `useOnboarding`)                     | P1        | PENDIENTE | —                               |
| A22 | Compartir (`ShareService`, `features/share`, `ImageShareModal`)    | P1        | PENDIENTE | —                               |
| A23 | Logros e insignias (`lib/achievements`, `lib/badges`)              | P1        | PENDIENTE | —                               |
| A24 | i18n: paridad de claves ES/EN (`translations.ts`, 13066 L)         | P1        | PENDIENTE | —                               |
| A25 | Theming: `useTheme` + barrido de hex literales                     | P1        | PENDIENTE | —                               |
| A26 | Navegación y BackHandler (`useBackHandlerStep`, layouts)           | P1        | PENDIENTE | —                               |
| A27 | Deep links (`+native-intent.tsx`, params por pantalla)             | P1        | PENDIENTE | —                               |
| A28 | Hooks compartidos (`src/hooks/*`, 19 archivos)                     | P1        | PENDIENTE | —                               |
| A29 | Árbol de contexts + `ServicesContext` (18 providers)               | P1        | PENDIENTE | —                               |
| A30 | Seguridad de tipos: `any` / `as` / `@ts-ignore` / `!`              | P1        | PENDIENTE | —                               |
| A31 | Código muerto: exports sin usar, archivos huérfanos                | P1        | PENDIENTE | —                               |
| A32 | Mesa de preparación — altitud (`prep/index.tsx`, 3467 L)           | P2        | PENDIENTE | —                               |
| A33 | Profecías (`prophecies/index.tsx`, 1892 L)                         | P2        | PENDIENTE | —                               |
| A34 | Journeys + "Tu camino" (`journeys/`, `journey/`)                   | P2        | PENDIENTE | —                               |
| A35 | Niños (`features/kids`)                                            | P2        | PENDIENTE | —                               |
| A36 | Oración y lectio (`features/prayer`, `lectio.tsx`)                 | P2        | PENDIENTE | —                               |
| A37 | Planes y Juntos (`CustomPlansContext`, `TogetherContext`)          | P2        | PENDIENTE | —                               |
| A38 | Widgets (`src/widgets`, `features/widgets`)                        | P2        | PENDIENTE | —                               |
| A39 | Timeline, facts, colecciones, marcadores                           | P2        | PENDIENTE | —                               |
| A40 | Devocional, Daily Light, guiada, sentimientos, temas               | P2        | PENDIENTE | —                               |
| A41 | Teología y diccionario (`features/theology`, `dictionary`)         | P2        | PENDIENTE | —                               |
| A42 | Sermon-notes y share-faith                                         | P2        | PENDIENTE | —                               |
| A43 | Reading insights (`reading-insights/index.tsx`, 1730 L)            | P2        | PENDIENTE | —                               |
| A44 | Comparación de versiones (`VersionComparisonScreen`, 2141 L)       | P2        | PENDIENTE | —                               |
| A45 | Landings compartidos + about-book + explore-all                    | P2        | PENDIENTE | —                               |
| A46 | Conflictos (`features/conflicts`, `(tabs)/conflicts.tsx`)          | P2        | PENDIENTE | —                               |

---

## Modo B — Dependencias, vulnerabilidades, vigencia

| #   | Área                                                       | Prioridad | Estado    | Detalle                       |
| --- | ---------------------------------------------------------- | --------- | --------- | ----------------------------- |
| B1  | `npm audit` — clasificar las 8 vulns (alcanzables? fix?)   | P0        | ✅ OK     | `B1-npm-audit`                |
| B1b | `npm audit` en `functions/` y `vercel/` (proyectos aparte) | P0        | ⚠️ DUDA   | `B1b-npm-audit-subproyectos`  |
| B2  | Escaneo de secretos en el árbol de trabajo                 | P0        | ✅ OK     | `B2-secretos-arbol`           |
| B3  | Escaneo de secretos en el historial de git                 | P0        | ✅ OK     | `B3-secretos-historial`       |
| B4  | Reglas de Firestore y Storage — ¿algún path abierto?       | P0        | ✅ OK     | `B4-reglas-firestore-storage` |
| B5  | Seguridad de CI (`.github/workflows/ci.yml`)               | P0        | ✅ OK     | `B5-seguridad-ci`             |
| B6  | Permisos Android, plugins, `google-services.json`          | P1        | PENDIENTE | —                             |
| B7  | `npm outdated` (~50) — clasificar seguro/fijado/major      | P1        | PENDIENTE | —                             |
| B8  | Expo SDK 57 / RN 0.86: APIs deprecadas + `expo-doctor`     | P1        | PENDIENTE | —                             |
| B9  | Dependencias sin usar (estilo `depcheck`)                  | P2        | PENDIENTE | —                             |
| B10 | Licencias de dependencias vs. app comercial de pago        | P2        | PENDIENTE | —                             |

---

## Modo C — Prueba de flujos en vivo (emulador)

Filas `C1`–`C54` = la descomposición ya probada de `DOCS/QA_REVISION_FABLE.md`
(re-priorizada según §2 de este charter, que usa otro criterio que julio).
`C55`–`C66` = features construidas después de julio 2026.

| #    | Área                                                            | Prioridad | Estado    | Detalle |
| ---- | --------------------------------------------------------------- | --------- | --------- | ------- |
| C1a  | Mesa — persistencia y autoguardado de notas                     | P0        | PENDIENTE | —       |
| C6   | Mesa — historial de preparaciones (premium)                     | P0        | PENDIENTE | —       |
| C15  | Hoja de ofrenda — copy, apertura, compra                        | P0        | PENDIENTE | —       |
| C16  | Gating free vs premium en toda la Mesa                          | P0        | PENDIENTE | —       |
| C20a | Memoria/SRS — integridad de datos y racha (floor restaurado)    | P0        | PENDIENTE | —       |
| C26a | Cuenta — login/logout Google, identidad                         | P0        | PENDIENTE | —       |
| C26b | Respaldar/restaurar (`BackupService`)                           | P0        | PENDIENTE | —       |
| C27a | Ajustes — borrar cuenta y reset de datos                        | P0        | PENDIENTE | —       |
| C39  | Donación — hoja, compra, restaurar                              | P0        | PENDIENTE | —       |
| C42a | Notas de versículo — persistencia                               | P0        | PENDIENTE | —       |
| C43a | Subrayados — persistencia                                       | P0        | PENDIENTE | —       |
| C54  | Resolución de conflictos de sync                                | P0        | PENDIENTE | —       |
| C55  | Canje de gift-code (redención real)                             | P0        | PENDIENTE | —       |
| C56  | Gating premium FUERA de la Mesa (quiz, word-study, audio, etc.) | P0        | PENDIENTE | —       |
| C2   | Mesa — palabras clave idioma original (premium)                 | P1        | PENDIENTE | —       |
| C3   | Mesa — comparar versiones (premium)                             | P1        | PENDIENTE | —       |
| C5   | Mesa — exportar a PDF (premium) + nombre de archivo             | P1        | PENDIENTE | —       |
| C7   | Series — crear, agregar, reordenar, renombrar, borrar           | P1        | PENDIENTE | —       |
| C17  | Lectura de la Biblia (capítulo, versículo, versión)             | P1        | PENDIENTE | —       |
| C18  | Lector inmersivo (auto-scroll gratis; "Escuchar" premium)       | P1        | PENDIENTE | —       |
| C19  | Audio (velocidad, scrubbing, resume, cold-start, sleep, voz)    | P1        | PENDIENTE | —       |
| C20b | Memoria — mazo, práctica, metas, insights                       | P1        | PENDIENTE | —       |
| C21  | Quiz bíblico (categorías, contrarreloj, añadir a mazo, stats)   | P1        | PENDIENTE | —       |
| C22  | Word study / idiomas originales (interlineal, morfología)       | P1        | PENDIENTE | —       |
| C23  | Búsqueda (texto + "ir a referencia")                            | P1        | PENDIENTE | —       |
| C24  | Personalización (temas de lectura/color, tipografías)           | P1        | PENDIENTE | —       |
| C25  | Compartir (plantillas, texturas, presets, tarjeta, enlace)      | P1        | PENDIENTE | —       |
| C27b | Ajustes — resto (notificaciones, recordatorios, reset)          | P1        | PENDIENTE | —       |
| C28  | Home (verso del día, continuar, check-in, reorg post-julio)     | P1        | PENDIENTE | —       |
| C29  | Logros / gamificación (badges, títulos, fade de categorías)     | P1        | PENDIENTE | —       |
| C38  | Onboarding (primer arranque)                                    | P1        | PENDIENTE | —       |
| C40  | Accesibilidad (texto grande, alto contraste, keep-awake)        | P1        | PENDIENTE | —       |
| C42b | Notas — lista, búsqueda, edición                                | P1        | PENDIENTE | —       |
| C43b | Subrayados — colores y galería                                  | P1        | PENDIENTE | —       |
| C57  | Glosas hebreas A3/A4 en word study (incl. A4-chico posicional)  | P1        | PENDIENTE | —       |
| C58  | Toggle red-letter RVR1960 en el lector                          | P1        | PENDIENTE | —       |
| C4   | Mesa — copiar bosquejo (Markdown) + compartir estudio           | P2        | PENDIENTE | —       |
| C8   | Series — fecha por pasaje                                       | P2        | PENDIENTE | —       |
| C9   | Series — vista "Por fecha"                                      | P2        | PENDIENTE | —       |
| C10  | Series — exportar la serie completa a PDF                       | P2        | PENDIENTE | —       |
| C11  | Series — banner "adjuntar pasaje"                               | P2        | PENDIENTE | —       |
| C12  | Modo púlpito — tarjeta (conteo, estimación, stepper WPM)        | P2        | PENDIENTE | —       |
| C13  | Modo púlpito — pantalla (secciones, reloj, A-/A+, keep-awake)   | P2        | PENDIENTE | —       |
| C14  | Púlpito — accesible SIN notas                                   | P2        | PENDIENTE | —       |
| C30  | Referencias cruzadas / constelación / cadena de referencias     | P2        | PENDIENTE | —       |
| C31  | Temas topicales, sentimientos, Daily Light, devocional          | P2        | PENDIENTE | —       |
| C32  | Profecías (hilo profético, quiz, mapa)                          | P2        | PENDIENTE | —       |
| C33  | Recorridos bíblicos / Journeys                                  | P2        | PENDIENTE | —       |
| C34  | Niños (historias, quiz, plan)                                   | P2        | PENDIENTE | —       |
| C35  | Oración (companion, orar la Escritura, ACTS, lectio)            | P2        | PENDIENTE | —       |
| C36  | Planes de lectura / plan builder / Juntos (grupos)              | P2        | PENDIENTE | —       |
| C37  | Widgets                                                         | P2        | PENDIENTE | —       |
| C41  | Favoritos (tab corazón; entrada a Colecciones)                  | P2        | PENDIENTE | —       |
| C44  | "Mi lectura" / Reading insights (heatmap, racha, libro)         | P2        | PENDIENTE | —       |
| C45  | Marcadores / Bookmarks                                          | P2        | PENDIENTE | —       |
| C46  | Colecciones de versículos                                       | P2        | PENDIENTE | —       |
| C47  | Datos bíblicos / Facts                                          | P2        | PENDIENTE | —       |
| C48  | Línea de tiempo bíblica (distinta de Journeys)                  | P2        | PENDIENTE | —       |
| C49  | Devoción guiada (check-in → verso → lectio → memorizar)         | P2        | PENDIENTE | —       |
| C50  | "Tu camino" recap estilo Wrapped                                | P2        | PENDIENTE | —       |
| C51  | "Sobre este libro" standalone (fuera de la Mesa)                | P2        | PENDIENTE | —       |
| C52  | Landing de estudio/devocional compartido (recibir `?d=`)        | P2        | PENDIENTE | —       |
| C53  | Comparación de versiones standalone                             | P2        | PENDIENTE | —       |
| C59  | Hub de Teología                                                 | P2        | PENDIENTE | —       |
| C60  | Diccionario — entradas de doble vista (ELECCIÓN, SEGURIDAD)     | P2        | PENDIENTE | —       |
| C61  | Las 8 guías de feature narradas                                 | P2        | PENDIENTE | —       |
| C62  | Sermon-notes                                                    | P2        | PENDIENTE | —       |
| C63  | Comparte tu fe — Parte 2                                        | P2        | PENDIENTE | —       |
| C64  | Foto propia en compartir (permisos de galería/cámara)           | P2        | PENDIENTE | —       |
| C65  | Consolidación de notificaciones (6 tarjetas → 1 modal)          | P2        | PENDIENTE | —       |
| C66  | Modal "Tips y guías"                                            | P2        | PENDIENTE | —       |

---

## Modo D — Propuestas de mejora (redactar, NO aplicar)

| #   | Área                                                               | Prioridad | Estado    | Detalle |
| --- | ------------------------------------------------------------------ | --------- | --------- | ------- |
| D1  | Rendimiento: componentes gigantes, listas sin virtualizar          | P1        | PENDIENTE | —       |
| D2  | Accesibilidad transversal (orden de foco, labels, 48dp, contraste) | P1        | PENDIENTE | —       |
| D3  | Flujos premium / paywall — fricción y claridad                     | P1        | PENDIENTE | —       |
| D4  | Lector — fricción de UX y affordances faltantes                    | P1        | PENDIENTE | —       |
| D5  | Home — arquitectura de información                                 | P1        | PENDIENTE | —       |
| D6  | Onboarding — primera experiencia                                   | P2        | PENDIENTE | —       |
| D7  | Reproductor de audio — UX                                          | P2        | PENDIENTE | —       |
| D8  | Ajustes — arquitectura de información                              | P2        | PENDIENTE | —       |
| D9  | Navegación global e IA de la app                                   | P2        | PENDIENTE | —       |
| D10 | Contenido teológico / traducciones (solo marcar ⚠️ DUDA)           | P2        | PENDIENTE | —       |

---

## Bitácora de sesiones

- **Sesión 1 — 2026-09-03.** Solo inventario (charter §5). Verificado el estado de git
  (`main` = `origin/main` = `f9d6b27`, árbol limpio, 6 ramas locales). Creado este
  índice con 137 filas (A 46 · B 10 · C 71 · D 10) y `BUGS.md`. Hallazgo colateral: la
  semilla BUG-10 del charter estaba obsoleta — ya está arreglada en `b17ec99`. Nada
  revisado. Siguiente: fila `A1` (o `B1` si se prefiere empezar por lo barato).
- **Sesión 2 — 2026-09-03.** Modo B. **Cerrado el bloque P0 entero** (`B1`, `B1b`,
  `B2`–`B5`) → `R9-1`..`R9-8`, **ninguno un bug de la app**: son propuestas de
  endurecimiento. Resultado limpio: **0 vulnerabilidades alcanzables**, **0 secretos
  filtrados jamás** (5558/5558 blobs del historial), **0 paths abiertos** en las reglas de
  Firestore. Commits `2f32aa9` (el bloque), `8b64c11` (`CONTINUAR.md` + correcciones al
  charter) y `af64ce1` (`R9-7` **RESUELTO**: `functions/` no se despliega a propósito —
  plan Blaze—, y ahora está documentado).
- **Sesión 3 — 2026-09-03.** Modo A. **6 filas cerradas** (`A1`, `A5` por el
  orquestador; `A2`, `A3`, `A6`, `A7` por fan-out de agentes en worktree) → **24 hallazgos
  `R9-9`..`R9-32`, 9 de ellos P0.** `A1` y `A5` se verificaron con **sondas ejecutables**
  en `_scratch/`, no solo por lectura; de los hallazgos de agentes, el orquestador
  **re-verificó a mano** los portantes de `R9-13`, `R9-22`, `R9-24`, `R9-27` y `R9-28`, y
  corrigió dos imprecisiones del informe de `A6`. Un primer fan-out de 11 agentes se
  abortó por límite de uso sin escribir nada (sin progreso perdido); el segundo, de 4,
  salió completo. Corregida en el índice la ruta de `BackupService` (`src/services/`, no
  `src/lib/backup/`). **Patrón que atraviesa la sesión:** las tres compuertas verdes
  (`tsc`, jest, CI) comparten puntos ciegos —resolución por plataforma, y la dirección
  "quitar acceso"/"restaurar"— y ahí es donde estaban casi todos los P0.
- **Sesión 4 — 2026-09-03.** Modo A, fila `A4` (`SyncEngine`). Se leyó el módulo entero
  más sus 12 archivos satélite y se montó una **sonda ejecutable** de 7 casos en
  `_scratch/`. **Se cortó a mitad del checkpoint:** escribió `detail/A4-syncengine.md`
  pero **no** la fila del índice ni las entradas de `BUGS.md`, así que el índice dijo
  `A4 · PENDIENTE` durante 4 días teniendo el detalle escrito. De ahí sale la regla de
  "checkpoint COMPLETO o fila en `EN CURSO`" del §5 de `CONTINUAR.md`.
- **Sesión 5 — 2026-09-07.** Cierre de `A4` + campo. En vez de creerle al informe
  heredado, se **corrió su sonda contra el `SyncEngine` real: 7/7 pasan** y los números
  coinciden al dígito; además se re-verificaron a mano los 5 `grep` portantes, y los 5 se
  sostuvieron. Eso convirtió 7 afirmaciones en 7 hechos → `R9-33`..`R9-39` (**6 P0**),
  entre ellos `R9-33` (una escritura se **descarta en silencio** tras 8 reintentos sin
  espera mientras Ajustes dice «sincronizado») y `R9-35` (un `updatedAt` **en el futuro**
  detiene la bajada para siempre). La sonda se sacó de la suite renombrándola a
  `_scratch/a4probe.ts.txt` — estuvo 4 días dentro de `npm test` sin aparecer en
  `git status`. A mitad del cierre Victor mandó **5 capturas del OnePlus**; atenderlas
  primero (regla de preempción) dio 4 hallazgos de campo más,
  `R9-40`..`R9-43` → `detail/CAMPO-victor-2026-09-07.md`. Ninguno P0.
- **Sesión 6 — 2026-09-14.** Modo A. Arranque: cerrada la incoherencia que dejó la sesión 4
  (fila `A4`, frontera, y bitácora de las sesiones 2, 4 y 5 — la 2 **también** faltaba).
  Después, **fan-out de 4 agentes en worktree** sobre `A8`, `A9`, `A10` y `A11`, las 4
  cerradas → **21 hallazgos `R9-44`..`R9-64`, 6 de ellos P0**, con lo que el bloque P0 del
  Modo A queda a **una sola fila** de cerrarse. **Los 4 agentes probaron sus hallazgos
  portantes con sondas ejecutables** contra el código real, no por lectura — el patrón que
  la sesión 5 había convertido en regla se aplicó por defecto y rindió: 19 de los 21
  hallazgos tienen sonda. En la **segunda mitad de la sesión** se pagó la deuda de
  verificación: **los 6 P0 nuevos re-verificados a mano, y los 6 se sostienen**, con 3
  correcciones y 2 refuerzos. **La corrección que importa es `R9-46`:** su defecto es real,
  pero el mecanismo de alcanzabilidad que daba el informe ("los efectos de React corren de
  hijo a padre, así que el motor arranca antes que la BD") **era falso** — `engine.start()`
  vive en un efecto gated por auth, no de orden de montaje. Lo cierto y **peor** es que no
  hay **ningún** orden garantizado entre `database.initialize()` y el motor, y la ventana es
  más ancha **en una reinstalación**, justo cuando baja el grueso de las notas remotas. Caso
  de manual de por qué existe esa regla. **Los P1/P2 (`R9-50`..`R9-64`) siguen sin
  re-verificar.** `A12` se empezó en el árbol principal y quedó **`EN CURSO` con 3 hilos
  abiertos**, porque Victor pidió a mitad de camino bajar el ritmo para no agotar el límite
  de uso.
  **Tres cosas que cambian el mapa, más allá de los bugs sueltos:** (a) una **raíz común**
  detrás de `R9-44`/`R9-45`/`R9-50` — `pushOne` escribe con `{merge:true}`, y bajo merge un
  campo opcional es **imposible de desasignar por sync**, así que toda omisión local se
  vuelve divergencia permanente con la nube; (b) **la suite es ciega al DST** (cuarto punto
  ciego, ver arriba); (c) **la racha y el progreso de lectura no viajan entre dispositivos**,
  y el anzuelo de inicio de sesión promete lo contrario. Y una nota agridulce: **ninguno de
  los ~4027 tests escribe jamás en un campo de nota de la Mesa**, lo que explica por qué
  `R9-47` llevaba ahí sin verse.
- **Sesión 7 — 2026-09-14. La primera de ARREGLOS, no de revisión.** Otro protocolo: sí se
  toca código de la app, en rama (`fix/review-p0-perdida-datos`) y con los gates en verde.
  **7 P0 de pérdida irreversible de datos cerrados** en `7f8e666`, cada uno con prueba de
  regresión: `R9-49` + `R9-27` + `R9-28` (el respaldo ya no puede borrar lo que no trae, y
  lo restaurado ya no lo pisa el estado en memoria), `R9-47` (la Mesa: la prosa solo se
  archiva bajo su propio pasaje, y un `onBlur` ya no puede borrar un sermón) y
  `R9-44`/`R9-45`/`R9-50` atacados **juntos por su raíz**, como recomendaba `CONTINUAR.md`.
  **Lo que más vale del arreglo, para lo que venga:** `withoutUndefined` →
  **`nullifyUndefined`**. Descartar la clave contentaba a Firestore pero, bajo
  `{merge:true}`, una clave ausente significa «conserva lo del servidor» — por eso un campo
  opcional era imposible de desasignar por sync. Mandar `null` explícito satisface a
  Firestore **y** pisa. Se conservó `{merge:true}` a propósito: protege un campo escrito por
  una versión más nueva de la app en otro dispositivo. No hubo que tocar ningún lector
  porque `valuesEqual` ya equiparaba `null` y `undefined`, así que tampoco aparecen
  conflictos fantasma.
  **Tres lecciones de método, todas pagadas en esta sesión:**
  (a) **Una prueba nueva no vale nada hasta que la ves fallar sin el arreglo.** Las tres
  primeras pruebas de `R9-47` pasaban igual con el código roto: una porque el re-render no
  llegaba a aplicarse, otra porque `setSectionNote` ya borra una sección vacía. Reescritas
  contra el mecanismo real (otra pantalla escribe prosa mientras esta sigue montada), la
  primera **sí** falla sin el arreglo.
  (b) **react-test-renderer no aguanta re-renderizar una pantalla del tamaño de la Mesa**:
  desmonta el árbol con «Unable to locate attached view in the native tree» (el `Animated`
  interno de cada `TouchableOpacity`). La carrera del stepper de `R9-47` **no** es testeable
  aquí; sigue siendo verificación en dispositivo, Modo C.
  (c) **`python - <<'EOF'` no persiste las escrituras a `src/i18n/translations.ts`** (falla
  en silencio, con el `print` de éxito y todo). Para ese archivo, usar la herramienta de
  edición. Para los demás funcionó sin problema.
  **Quedan 14 P0.** Los que más pesan: `R9-22`/`R9-23`/`R9-48` (mezcla entre cuentas) y
  `R9-33`/`R9-35` (sync que descarta en silencio). `A12` sigue `EN CURSO`.
- **Sesión 8 — 2026-09-15. Revisar el diff ajeno, mergear, y cerrar la mezcla entre
  cuentas.** Victor pidió que un chat nuevo revisara con ojo fresco el diff de la sesión 7
  antes de mergearlo. Veredicto: sin defectos bloqueantes → **mergeado en fast-forward y
  pusheado** (`63f124c..8fe24f1`). Lo verificado a mano está en `detail/S8-revision-del-diff.md`
  (cinco cosas que **no** hay que re-comprobar). Después, **4 P0 más arreglados** en
  `fix/review-p0-notas-cuentas`: `R9-46` (el `getLocal` de notas dejó de fallar abierto) y el
  **bloque entero de mezcla entre cuentas** — `R9-22` (la cola se namespacea por uid), `R9-48`
  (el log de repasos deja de contaminar la cuenta ajena) y `R9-23` (una cuenta nueva ya no
  hereda en silencio el almacén ajeno). **Lo que más vale de la sesión:** la revisión descubrió
  que **el ledger mentía** sobre tener prueba de regresión (dos arreglos no la tenían), y que
  **el arreglo de `R9-22` había introducido un bucle caliente infinito** que solo cazó la
  prueba nueva. **Quedan 10 P0.**
- **Sesión 9 — 2026-09-15. Revisar el diff de la 8, arreglar lo que salió, mergear.** Mismo
  protocolo, un nivel más arriba. **Dos defectos reales en los arreglos de la sesión 8**, los
  dos de la **misma clase: el arreglo cierra el caso que su prueba cubre y deja abierto el
  vecino.** (a) `R9-46` retiraba del cursor el doc saltado, pero `handleSnapshot` guarda **un
  solo** `maxSeenUpdatedAt` por lote, así que un hermano más nuevo **del mismo lote**
  arrastraba el piso por delante del saltado y el siguiente reattach ya no lo entregaba
  (medido: piso `8_700_000` sobre un saltado en `1_000_000`). (b) `R9-48` colocaba el traspaso
  del log **debajo** de la guarda `if (existing != null) return;`, y `signOut` dispara
  `clearMemoryStatsFloor()` sin esperarlo (`void`) — con el suelo ajeno en disco, el traspaso
  **no corría nunca más**, porque nada lo reintenta. Arreglados en `3e780c6` y `29a9449`, cada
  uno con prueba vista fallar primero. **Detalle completo, incluido lo que se comprobó y está
  BIEN y lo que se decidió NO tocar: `detail/S9-revision-del-diff.md`.**
  **La lección de método, que ya va por su tercera sesión seguida:** el diff de una sesión de
  arreglos **merece la misma revisión adversarial que el código original** — la sesión 8 cazó
  un bucle infinito en el arreglo de la 7, y la 9 cazó dos pérdidas de datos en los de la 8.
  Ningún arreglo llegó a `main` sin que otro par de ojos lo rompiera primero.
  **Un hallazgo colateral:** `R9-65` (P1, **preexistente en `main`**) — el mismo fallo de
  cursor por la rama de **conflictos**, que además no sobreviven a un reinicio porque `stop()`
  limpia `this.conflicts`. Se arregla con una línea, pero es bug de `main` y merece su propia
  decisión. **Y una corrección de higiene del ledger: la sesión 8 nunca actualizó `INDEX.md`**
  (seguía diciendo «Quedan 14 P0»), justo el archivo que `CONTINUAR.md` manda leer sin
  re-derivar. Arreglado aquí.
  **Segunda mitad: ARREGLOS.** Cerrados `R9-33` (no había backoff **y** el descarte era mudo:
  al tirar la última entrada `pendingWrites` caía a 0 y Ajustes decía «Sincronizado hace un
  momento» en ese mismo instante), `R9-34` (la rama de error hacía retroceder la cola entera
  sobre una reedición en vuelo) y `R9-35` (un `updatedAt` en el futuro paraba la bajada para
  siempre; hizo falta **techo + descarte del cursor envenenado**, porque topar no recupera lo
  que la ventana escondió). Más un remate de `R9-22`: `pendingWrites` no se recalculaba al
  cambiar de cuenta. 7 pruebas, las 7 vistas fallar primero — **una no discriminaba y hubo
  que arreglarla**. **Dos correcciones a lo que esta misma sesión había afirmado antes:**
  `pendingWrites` **sí** tiene consumidor (`app/(tabs)/settings.tsx:87` — un `grep` acotado a
  `src/` no ve las pantallas), y **el conteo de P0 venía mal desde la sesión 7** porque
  contaba `R9-50`, que vive en P1: eran 11 abiertos, no 10.

- **Sesión 13 — 2026-09-15. Revisar el diff de la 12 (el bloque WEB), ya mergeado.** Quinta
  sesión seguida de revisión adversarial sobre un diff de arreglos, y la quinta que paga. 6
  commits, 19 archivos — el diff más ancho del programa, y el único que toca **datos ya
  publicados**. **Veredicto: los tres arreglos se sostienen.** Verificado revirtiendo cada uno
  con el `diff` del revert a la vista: quitar el `export` de `hasRedLetterData` → 1 falla;
  quitar el `<ErrorBoundary>` del `Slot` → 4; quitar **solo** `key={pathname}` → exactamente 1
  (la de «no se enclava»); re-hardcodear `'WEB'` en la pantalla → 1; quitar `RVR1960` de
  `RED_LETTER_PACKS` → 6. **Los 5 defectos están en los BORDES**: `R9-66` (la verificación de
  spans del build pasaba en vacío — probado ejecutándola con `[]`, que imprime «ALL slices
  non-blank and in-range» y deja escribir un pack de 2 bytes al manifiesto), `R9-67` (la
  compuerta de paridad se ponía verde ante `export {x}` — reproducido `R9-13` entero con la
  suite en 30/30), `R9-68` (el detector por mensaje se tragaba los tres errores internos de
  expo-router, dos de los cuales dicen «This is likely a bug in Expo Router», y los ocho
  providers que la web SÍ monta), `R9-69` (el reset de `redLetterLoaded` vive en un efecto, o
  sea un render tarde: medido `{offsetsFor:"RVR1960", textFrom:"WEB"}`) y `R9-70` (el vecino
  de `R9-13` un nivel abajo: `tsc` queda **verde** con un miembro nuevo en el contrato nativo
  que el stub web nunca implementa). Los cinco arreglados en
  `fix/review-s13-revision-diff-s12`, cada uno con su prueba **vista fallar primero**, y
  `R9-66` además corrido de punta a punta contra los datos reales: los cuatro sha256 salen
  idénticos a los del manifiesto ya publicado. **A pedido de Victor se cerraron también las
  dos cosas que la revisión había dejado DICHAS sin hacer:** la segunda mitad de `R9-66` (un
  conteo que BAJA respecto del manifiesto publicado aborta la corrida, con `--allow-shrink`
  para la supresión editorial deliberada) y `R9-71` (el fallo transitorio que mataba la letra
  roja el resto de la sesión, preexistente). **Detalle completo, incluido lo que se comprobó
  y está BIEN y lo que queda dicho sin hacer: `detail/S13-revision-del-diff.md`.**
  **La lección de método:** las cuatro sesiones anteriores encontraron defectos en los
  ARREGLOS; esta los encontró en las **compuertas** de los arreglos. El antídoto cabe en una
  pregunta — _¿qué entrada hace que esta comprobación no ejecute ninguna aserción?_ Si esa
  entrada es alcanzable, hace falta un piso; y el piso necesita su propio control, o se
  convierte en la comprobación entera. Corolario: **un comentario que dice «verificado que hoy
  nadie hace X; si alguien empieza, arréglalo» no es una compuerta, es una nota.**

- **Sesión 17 — 2026-09-16. Revisar el diff de la 16 (`cca7091..531ffef`).** Novena sesión
  seguida de revisión adversarial sobre un diff de arreglos, y la novena que paga. **Veredicto:
  los 5 arreglos de la sesión 16 se sostienen** — `R9-85` y `R9-86` vistos discriminar por
  revert con el `diff` del revert a la vista, y `R9-82` verificado **en el LOG del run**, no en
  el check (`PASS buildWebPacks.test.js`, `PASS redLetterPackParity.test.ts`, 363/4263).
  **La cadena de datos publicados, entera y contra el mundo, dos veces** (antes y después de
  tocar el script): fuentes `.ts` → `main()` REAL → los 4 packs **byte a byte** → manifiesto
  versionado → manifiesto **servido** (`diff` → `IDENTICAL`) → los 4 sha256 de los bytes
  servidos; y los conteos que el manifiesto afirma, comprobados **abriendo los bytes
  descargados**.
  **10 hallazgos, `R9-87`..`R9-96`.** El que manda es `R9-87` (P1): el `beforeEach` que `R9-83`
  añadió escribe una baseline con **exactamente dos packs**, y la única aserción que fijaba la
  escritura del manifiesto decía `packs.toHaveLength(2)` — o sea que **el fixture responde la
  pregunta que la aserción hacía**. Medido: con esa escritura desactivada del todo, **el repo
  ENTERO sale verde, 363 suites / 4263 pruebas**. Y `data-loader.web.ts` usa ese sha256 como
  ÚNICA señal de pack nuevo, así que la consecuencia es un lector web congelado en el pack
  viejo, en silencio. Luego `R9-88` (el piso `">=22"` es falso: el real es **22.13.0**, y la
  compuerta **prohibía** escribirlo) y `R9-89` (el detector veía una sola forma de escribir el
  pin, y su piso era el número de jobs de hoy). Los siete P2 van en `BUGS.md`.
  **Detalle completo, incluido lo comprobado y BIEN y lo dicho-y-no-hecho:
  `detail/S17-revision-del-diff.md`.**
  **Las dos lecciones de método:** **el piso de una compuerta suele ser exactamente el número de
  HOY, así que acaba exigiendo ese número en vez de exigir cobertura** — no cuentes, emparejá; y
  **un fixture añadido para habilitar una prueba nueva puede RESPONDER la pregunta que otra
  prueba estaba haciendo**, que es la forma de la sesión 10 por la puerta del fixture, y más
  traicionera porque el fixture parece inerte.

- **Sesión 16 — 2026-09-16. Revisar el diff de la 15, que estaba SIN MERGEAR.** Octava
  sesión seguida de revisión adversarial sobre un diff de arreglos, y la octava que paga.
  **Veredicto: los 5 arreglos de la sesión 15 se sostienen**, verificado revirtiendo cada uno
  por separado con el `diff` del revert a la vista — `R9-77` → 7 rojas, `R9-78` → 3 (simulando
  `R9-13` al pie de la letra), `R9-79` → 1, `R9-81` → 2, controles verdes en los cuatro. **Y
  `R9-80` → 0**, que es el hallazgo `R9-86`. **Los cuatro sha256 salen idénticos dos veces**:
  contra lo que hoy sirve GitHub Pages, y reconstruyendo los packs con el `main()` REAL contra
  los datos REALES (byte a byte, con el manifiesto del repo intacto).
  **El hallazgo que manda no estaba en el diff.** `R9-82` (P1): los cuatro correos de CI que
  trajo Victor eran cuatro runs fallidos de `main`. `scripts/build-web-packs.js` requiere
  `node:sqlite`, que no existe antes de Node 22, y `ci.yml` fijaba `node-version: '20'` — así
  que desde `1d96a40` (el arreglo de `R9-66`, sesión 13) la compuerta que vigila **lo único que
  produce datos publicados** no se ejecutó ni una vez en CI, y la rama de la 15 añadía una
  segunda suite muerta. Medido con binarios de verdad: Node 20 → 2 suites no cargan, 4195 de
  4250; Node 22 y 24 → verde. **55 pruebas que nunca corrían.**
  Los otros cuatro: `R9-83` (P1: el piso de `R9-77` deja abierta la base **ausente**, que fija
  estrictamente menos — probado de punta a punta, el `R9-13` verbatim emite y reescribe el
  manifiesto sin RVR1960, sin pedir ninguna palanca). `R9-84` (el mensaje de `R9-81` dice que el
  directorio está MEZCLADO cuando no se movió nada). `R9-85` (el mock de `renameSync` de esa
  misma prueba **se llamaba a sí mismo** vía `jest.requireActual`, así que el caso «a medias»
  nunca se ejecutó). `R9-86` (el control de `R9-80` prueba una COPIA del escáner, y el escáner
  solo abría 2 de los 4 layouts). Los 5 arreglados en `fix/review-s16-revision-diff-s15`, cada
  uno **visto fallar primero**. **Mergeado y pusheado** (`0aa92a7..531ffef`, fast-forward), y
  el primer run sobre `main` salió **verde de verdad**: Node v24.20.0, las tres suites que no
  cargaban en PASS, 363 suites / 4263 pruebas —los mismos números que en local, o sea que no se
  saltó nada— y cero «Test suite failed to run».
  **Detalle completo, incluido lo comprobado y BIEN y lo dicho-y-no-hecho:
  `detail/S16-revision-del-diff.md`.**
  **La lección de método, nueva y del tamaño de las otras:** **una compuerta que nunca llegó a
  EJECUTARSE se ve exactamente igual que una que pasó.** «Gates verdes» era cierto — en una
  sola máquina. Antes de creerle a una compuerta nueva, preguntá **dónde corre**, no solo qué
  comprueba.

- **Sesión 15 — 2026-09-15. Revisar el diff de la 14 (otra vez las COMPUERTAS), ya
  mergeado.** Séptima sesión seguida de revisión adversarial sobre un diff de arreglos, y la
  séptima que paga. 5 commits, 4 archivos de código. **Veredicto: los 3 arreglos de la sesión
  14 se sostienen y sus pruebas DISCRIMINAN**, verificado revirtiendo cada uno **por separado**
  —no los tres juntos, que es la lección de la sesión 10— con el `diff` del revert a la vista:
  el escenario `staging` → `out` directo → 4 rojas; los dos bucles sobre las listas PREVIAS →
  6; `readPreviousManifest` tragándose los errores → 3. **Ninguno desarma la prueba del otro.**
  `R9-75` también discrimina (un `<ProbeOnlyProvider>` solo en el layout nativo la pone roja
  **nombrándolo**). **Y los cuatro sha256 salen idénticos dos veces**: contra el manifiesto y
  contra lo que hoy sirve `eternalstonebible.github.io`, antes de tocar nada y después de los
  cinco arreglos.
  **Los 5 defectos están en las COMPUERTAS por tercera sesión seguida**, y con una forma que ya
  se repite lo bastante como para nombrarla: **una compuerta escrita para cerrar un caso cierra
  ese caso y deja abierto el vecino que la motivó**. `R9-77` (P1: `R9-73` lee las listas
  PREVIAS, que era lo correcto, y no le pone piso a la lista previa — una lista previa VACÍA
  apaga los dos bucles de letra roja, y el manifiesto del repo **llevó exactamente esa forma**
  hasta `a0782a6`; probado de punta a punta, el `R9-13` verbatim EMITE, imprime «nothing went
  missing», y reescribe el manifiesto sin RVR1960). `R9-78` (P1: las tres listas de letra roja
  solo estaban atadas por comentarios, y la compuerta de `R9-73` **no puede ver el `R9-13` que
  cita por su nombre**, porque una versión que nunca tuvo pack no tiene entrada de la que
  faltar). `R9-79` (el discriminador de `R9-76` sigue exigiendo que el contrato viva en el
  hermano nativo, y en uno de los cuatro pares vive en un tercer archivo — sonda verde 72/72).
  `R9-80` (la compuerta de `R9-75`, escrita para ser «derivada, no confiada», lee el layout
  como TEXTO y cuenta como montado un provider nombrado en un **comentario** — sonda verde
  11/11). `R9-81` (la mudanza final de `R9-72` son cuatro `renameSync`, y una a medias deja el
  directorio de publicación MEZCLADO bajo un `EPERM` pelado). Los 5 arreglados en
  `fix/review-s15-revision-diff-s14`, cada uno **visto fallar primero**, más un remate menor
  (la prueba de hooks decía «six» con siete entradas en la lista, ahora con piso).
  **Detalle completo, incluido lo comprobado y BIEN y lo dicho-y-no-hecho:
  `detail/S15-revision-del-diff.md`.**
  **La lección de método:** a las dos preguntas de la sesión 14 —_¿de quién depende el
  discriminador?_ y _¿qué significa su silencio?_— se le suma una tercera, del otro lado del
  `if`: **un mensaje de ÉXITO que afirma cuánto comparó es una aserción, y hay que probarla
  contra el mundo.** `assertNoShrink` decía «2 packs and 2 red-letter packs compared against
  the published manifest» habiendo comparado CERO; las dos cifras coinciden en toda corrida
  buena, **y por eso nadie las miró en la mala**. Y una gotcha de plataforma que costó una
  prueba roja por el camino equivocado: **Windows abre tan campante un DIRECTORIO con
  `open(…, 'r+')`**, así que un preflight de «¿puedo reemplazar este archivo?» necesita además
  `statSync().isFile()`.

- **Sesión 14 — 2026-09-15. Revisar el diff de la 13 (las COMPUERTAS), ya mergeado.** Sexta
  sesión seguida de revisión adversarial sobre un diff de arreglos, y la sexta que paga. 8
  commits, 16 archivos. **Veredicto: los 6 arreglos de la sesión 13 se sostienen y sus 6
  pruebas DISCRIMINAN**, verificado revirtiendo cada uno con el `diff` del revert a la vista:
  quitar los dos pisos de `verifyRedLetterAlignment` → 2 rojas y los 4 controles verdes;
  neutralizar `shrinkComplaints` → 6 rojas y los 3 controles puros verdes; un par sintético
  `export {x}` contra la compuerta de AST → cazado, y `export * from` → ruidoso; volver al
  regex de `isMissingProviderError` → 3 rojas; volver al booleano del lector → roja con
  `{offsetsFor:"RVR1960", textFrom:"WEB"}`; revertir los tres contratos de `R9-70` → **exactamente
  los 2 huecos vivos** y silencio en los otros 12 pares; volver a asentar el fallo de
  `loadRedLetterSpans` → 2 rojas con los dos controles verdes. **Y los cuatro sha256 de los
  packs vuelven a salir idénticos al manifiesto publicado, con el manifiesto sin cambiar un
  byte.**
  **Los 5 defectos están otra vez en las COMPUERTAS**, y los dos P1 repiten la forma que la
  propia sesión 13 se cazó a sí misma: `R9-72` (el mensaje de abort **mentía** — solo los JSON
  de letra roja se habían aplazado, los dos `.sqlite` ya estaban escritos en el directorio de
  salida; probado con una fuente que pierde 492 versículos de Salmos, que satisface todos los
  pisos de `verifyPack` y deja un `web.sqlite` de 30 606 versículos donde el error jura que no
  se emitió nada) y `R9-73` (la compuerta de encogimiento **no ve una versión que desaparece**,
  que es el encogimiento máximo: los bucles recorren la lista NUEVA, y quitar RVR1960 da `[]`).
  Los otros tres son la misma familia una capa más fina: `R9-74` (un baseline ilegible apaga
  la compuerta entera **sin decir una palabra**, y el silencio era a la vez la señal de
  «verificado» y la de «no comparé nada»), `R9-75` (la lista de providers tenía compuerta en
  **una sola dirección**: nadie comprobaba que estuviera COMPLETA) y `R9-76` (el discriminador
  de la compuerta de `R9-70` —«¿lo exporta el nativo?»— está **en manos del archivo vigilado**,
  que es literalmente el estado en que estaba `OfferingSheetContextValue` antes de ese mismo
  arreglo). Los 5 arreglados en `fix/review-s14-revision-diff-s13`, **ya mergeada en fast-forward a `main` y pusheada** (la rama se borró), cada uno con su prueba
  **vista fallar primero** (11 rojas de golpe en el bloque de packs, con 8 controles verdes a
  los dos lados) y `R9-72` corrido de punta a punta contra los datos reales.
  **Detalle completo, incluido lo que se comprobó y está BIEN:
  `detail/S14-revision-del-diff.md`.**
  **La lección de método:** la 13 encontró los defectos en las compuertas; la 14 los encontró
  en **el mismo sitio otra vez**, lo que dice que una compuerta nueva merece la misma
  desconfianza que el código que vigila. Y afina el antídoto de la 13 con dos preguntas más:
  _¿de quién depende el discriminador de esta compuerta?_ — si de quien podría infringirla, no
  es una compuerta — y **_¿qué significa su silencio?_** Si el mismo silencio sirve para
  «verificado» y para «no miré», no hay compuerta. Tercer corolario: **un mensaje de error que
  AFIRMA un estado del mundo es una aserción, y hay que probarla como tal** — el de `R9-66`
  decía «no pack file was emitted» con 9,5 MB de packs recién escritos, y había una prueba que
  fijaba esa frase.
