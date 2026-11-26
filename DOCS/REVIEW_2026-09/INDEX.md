# 🔍 Revisión profunda 2026-09 — ÍNDICE (ledger de checkpoints)

> **Frontera (sesión 166, 2026-11-18): la fase de ARREGLOS; la V2, completa salvo `R9-126` (C y E revisadas;
> B y R abiertas); la V3, completa y revisada en la 166 (con emulador).** Qué queda abierto se pregunta con
> `node DOCS/REVIEW_2026-09/tools/validar-estado.cjs.txt`; al cierre de la 166 eran 283 de 611: ningún P0, 9 P1,
> 91 P2, 182 P3 y un aviso. `docs/review-s166` espera el OK de Victor. Sigue la 167: los arreglos de la revisión
> de la 166 (`CONTINUAR.md` §4). `R9-135` sigue abierto: espera la medición con la cuenta de Google de prueba
> (`CONTINUAR.md` §7). Todo el dinero y la sync de la 154 a la 159, y el respaldo y la Mesa de la 160 a la 165,
> están sin medir en vivo; del Modo C faltan `C17` y `C23`.

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
  Ninguna prueba del repo fija `TZ`. La máquina de Victor corre en `America/Mexico_City`,
  **que abolió el DST en 2022**, y el CI en **UTC** (corrección de la sesión 22, medida en el
  log; antes aquí decía que también en Ciudad de México) → ningún test puede detectar jamás
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

| #   | Área                                                               | Prioridad | Estado | Detalle                          |
| --- | ------------------------------------------------------------------ | --------- | ------ | -------------------------------- |
| A1  | Premium: `PremiumContext` + RevenueCat + entitlements              | P0        | 🐛 BUG | `A1-premium-revenuecat`          |
| A2  | Ofrenda/Donación: `offeringService`, `giftCodeService`             | P0        | 🐛 BUG | `A2-ofrenda-donacion-giftcodes`  |
| A3  | Auth: `AuthContext` + borrado de cuenta                            | P0        | 🐛 BUG | `A3-auth-borrado-cuenta`         |
| A4  | Sync: `SyncEngine.ts` (1378 L) y colas de escritura                | P0        | 🐛 BUG | `A4-syncengine`                  |
| A5  | Auditoría de TODAS las escrituras a Firestore (call sites)         | P0        | 🐛 BUG | `A5-escrituras-firestore`        |
| A6  | Paridad web/native (`*.web.tsx` premium/offering/memory)           | P0        | 🐛 BUG | `A6-paridad-web-native`          |
| A7  | `services/BackupService.ts` (1526 L) — respaldar/restaurar         | P0        | 🐛 BUG | `A7-backupservice`               |
| A8  | Persistencia de notas y subrayados (`lib/notes`, `lib/highlights`) | P0        | 🐛 BUG | `A8-notas-subrayados`            |
| A9  | Persistencia/autoguardado de la Mesa (`features/prep`)             | P0        | 🐛 BUG | `A9-mesa-persistencia`           |
| A10 | Memoria/SRS: `MemoryDeckContext`, `lib/memory`                     | P0        | 🐛 BUG | `A10-memoria-srs`                |
| A11 | Progreso y rachas: `lib/progress`, `lib/reading`, rings            | P0        | 🐛 BUG | `A11-progreso-rachas`            |
| A12 | Superficies de crash: error boundaries, promesas sin catch         | P0        | 🐛 BUG | `A12-superficies-crash`          |
| A13 | Lector de capítulo (`verse/[book]/[chapter].tsx`, 3975 L)          | P1        | 🐛 BUG | `A13-lector-capitulo`            |
| A14 | Capa de base de datos (`lib/database/index.ts`, 2425 L)            | P1        | 🐛 BUG | `A14-base-de-datos`              |
| A15 | Audio/TTS (`features/audio`, `lib/speech`)                         | P1        | 🐛 BUG | `A15-audio-tts`                  |
| A16 | Búsqueda (`lib/search`, `(tabs)/search.tsx`)                       | P1        | 🐛 BUG | `A16-busqueda`                   |
| A17 | Quiz (`features/quiz`, `app/features/quiz`)                        | P1        | 🐛 BUG | `A17-quiz`                       |
| A18 | Word study / idiomas originales (`features/study`)                 | P1        | 🐛 BUG | `A18-word-study`                 |
| A19 | Home (`(tabs)/index.tsx`, 2671 L)                                  | P1        | 🐛 BUG | `A19-home`                       |
| A20 | Ajustes (`(tabs)/settings.tsx`, 1326 L)                            | P1        | 🐛 BUG | `A20-ajustes`                    |
| A21 | Onboarding (`lib/onboarding`, `useOnboarding`)                     | P1        | ✅ OK  | `A21-onboarding`                 |
| A22 | Compartir (`ShareService`, `features/share`, `ImageShareModal`)    | P1        | 🐛 BUG | `A22-compartir`                  |
| A23 | Logros e insignias (`lib/achievements`, `lib/badges`)              | P1        | 🐛 BUG | `A23-logros`                     |
| A24 | i18n: paridad de claves ES/EN (`translations.ts`, 13066 L)         | P1        | 🐛 BUG | `A24-i18n`                       |
| A25 | Theming: `useTheme` + barrido de hex literales                     | P1        | 🐛 BUG | `A25-theming`                    |
| A26 | Navegación y BackHandler (`useBackHandlerStep`, layouts)           | P1        | 🐛 BUG | `A26-navegacion`                 |
| A27 | Deep links (`+native-intent.tsx`, params por pantalla)             | P1        | 🐛 BUG | `A27-deep-links`                 |
| A28 | Hooks compartidos (`src/hooks/*`, 19 archivos)                     | P1        | 🐛 BUG | `A28-hooks`                      |
| A29 | Árbol de contexts + `ServicesContext` (18 providers)               | P1        | 🐛 BUG | `A29-contexts`                   |
| A30 | Seguridad de tipos: `any` / `as` / `@ts-ignore` / `!`              | P1        | 🐛 BUG | `A30-seguridad-tipos`            |
| A31 | Código muerto: exports sin usar, archivos huérfanos                | P1        | 🐛 BUG | `A31-codigo-muerto`              |
| A32 | Mesa de preparación — altitud (`prep/index.tsx`, 3467 L)           | P2        | 🐛 BUG | `A32-mesa-altitud`               |
| A33 | Profecías (`prophecies/index.tsx`, 1892 L)                         | P2        | 🐛 BUG | `A33-profecias`                  |
| A34 | Journeys + "Tu camino" (`journeys/`, `journey/`)                   | P2        | 🐛 BUG | `A34-journeys-camino`            |
| A35 | Niños (`features/kids`)                                            | P2        | 🐛 BUG | `A35-ninos`                      |
| A36 | Oración y lectio (`features/prayer`, `lectio.tsx`)                 | P2        | 🐛 BUG | `A36-oracion-lectio`             |
| A37 | Planes y Juntos (`CustomPlansContext`, `TogetherContext`)          | P2        | 🐛 BUG | `A37-planes-juntos`              |
| A38 | Widgets (`src/widgets`, `features/widgets`)                        | P2        | 🐛 BUG | `A38-widgets`                    |
| A39 | Timeline, facts, colecciones, marcadores                           | P2        | 🐛 BUG | `A39-timeline-facts-colecciones` |
| A40 | Devocional, Daily Light, guiada, sentimientos, temas               | P2        | 🐛 BUG | `A40-devocional-luz-guiada`      |
| A41 | Teología y diccionario (`features/theology`, `dictionary`)         | P2        | 🐛 BUG | `A41-teologia-diccionario`       |
| A42 | Sermon-notes y share-faith                                         | P2        | 🐛 BUG | `A42-sermones-share-faith`       |
| A43 | Reading insights (`reading-insights/index.tsx`, 1730 L)            | P2        | 🐛 BUG | `A43-reading-insights`           |
| A44 | Comparación de versiones (`VersionComparisonScreen`, 2141 L)       | P2        | 🐛 BUG | `A44-comparacion-versiones`      |
| A45 | Landings compartidos + about-book + explore-all                    | P2        | 🐛 BUG | `A45-landings-about-explore`     |
| A46 | Conflictos (`features/conflicts`, `(tabs)/conflicts.tsx`)          | P2        | 🐛 BUG | `A46-conflictos`                 |

---

## Modo B — Dependencias, vulnerabilidades, vigencia

| #   | Área                                                       | Prioridad | Estado  | Detalle                       |
| --- | ---------------------------------------------------------- | --------- | ------- | ----------------------------- |
| B1  | `npm audit` — clasificar las 8 vulns (alcanzables? fix?)   | P0        | ✅ OK   | `B1-npm-audit`                |
| B1b | `npm audit` en `functions/` y `vercel/` (proyectos aparte) | P0        | ⚠️ DUDA | `B1b-npm-audit-subproyectos`  |
| B2  | Escaneo de secretos en el árbol de trabajo                 | P0        | ✅ OK   | `B2-secretos-arbol`           |
| B3  | Escaneo de secretos en el historial de git                 | P0        | ✅ OK   | `B3-secretos-historial`       |
| B4  | Reglas de Firestore y Storage — ¿algún path abierto?       | P0        | ✅ OK   | `B4-reglas-firestore-storage` |
| B5  | Seguridad de CI (`.github/workflows/ci.yml`)               | P0        | ✅ OK   | `B5-seguridad-ci`             |
| B6  | Permisos Android, plugins, `google-services.json`          | P1        | 🐛 BUG  | `B6-permisos-android`         |
| B7  | `npm outdated` (~50) — clasificar seguro/fijado/major      | P1        | ✅ OK   | `B7-npm-outdated`             |
| B8  | Expo SDK 57 / RN 0.86: APIs deprecadas + `expo-doctor`     | P1        | 🐛 BUG  | `B8-expo-sdk57-deprecadas`    |
| B9  | Dependencias sin usar (estilo `depcheck`)                  | P2        | 🐛 BUG  | `B9-dependencias-sin-usar`    |
| B10 | Licencias de dependencias vs. app comercial de pago        | P2        | 🐛 BUG  | `B10-licencias`               |

---

## Modo C — Prueba de flujos en vivo (emulador)

Filas `C1`–`C54` = la descomposición ya probada de `DOCS/QA_REVISION_FABLE.md`
(re-priorizada según §2 de este charter, que usa otro criterio que julio).
`C55`–`C66` = features construidas después de julio 2026.

| #    | Área                                                            | Prioridad | Estado                      | Detalle                   |
| ---- | --------------------------------------------------------------- | --------- | --------------------------- | ------------------------- |
| C1a  | Mesa — persistencia y autoguardado de notas                     | P0        | ✅ OK                       | `C1a-mesa-persistencia`   |
| C6   | Mesa — historial de preparaciones (premium)                     | P0        | 🐛 BUG (P3)                 | `C6-historial-mesa`       |
| C15  | Hoja de ofrenda — copy, apertura, compra                        | P0        | 🐛 BUG (P2)                 | `C15-hoja-ofrenda`        |
| C16  | Gating free vs premium en toda la Mesa                          | P0        | ✅ OK                       | `C16-gating-mesa`         |
| C20a | Memoria/SRS — integridad de datos y racha (floor restaurado)    | P0        | EN CURSO (🐛 P3)            | `C20a-memoria-srs`        |
| C26a | Cuenta — login/logout Google, identidad                         | P0        | PENDIENTE (sin medir, S137) | `C26a-login-google`       |
| C26b | Respaldar/restaurar (`BackupService`)                           | P0        | 🐛 BUG (P2)                 | `C26b-respaldo`           |
| C27a | Ajustes — borrar cuenta y reset de datos                        | P0        | 🐛 BUG (P2)                 | `C27a-ajustes-reset`      |
| C39  | Donación — hoja, compra, restaurar                              | P0        | 🐛 BUG (P3)                 | `C39-donacion`            |
| C42a | Notas de versículo — persistencia                               | P0        | 🐛 BUG (P2)                 | `C42a-notas-versiculo`    |
| C43a | Subrayados — persistencia                                       | P0        | 🐛 BUG (P2)                 | `C43a-subrayados`         |
| C54  | Resolución de conflictos de sync                                | P0        | PENDIENTE (sin medir, S115) | `C54-conflictos-sync`     |
| C55  | Canje de gift-code (redención real)                             | P0        | PENDIENTE (sin medir, S115) | `C55-canje-gift-code`     |
| C56  | Gating premium FUERA de la Mesa (quiz, word-study, audio, etc.) | P0        | 🐛 BUG (P2)                 | `C56-gating-fuera-mesa`   |
| C2   | Mesa — palabras clave idioma original (premium)                 | P1        | PENDIENTE                   | —                         |
| C3   | Mesa — comparar versiones (premium)                             | P1        | PENDIENTE                   | —                         |
| C5   | Mesa — exportar a PDF (premium) + nombre de archivo             | P1        | PENDIENTE                   | —                         |
| C7   | Series — crear, agregar, reordenar, renombrar, borrar           | P1        | ✅ OK                       | `C7-series`               |
| C17  | Lectura de la Biblia (capítulo, versículo, versión)             | P1        | PENDIENTE                   | —                         |
| C18  | Lector inmersivo (auto-scroll gratis; "Escuchar" premium)       | P1        | PENDIENTE                   | —                         |
| C19  | Audio (velocidad, scrubbing, resume, cold-start, sleep, voz)    | P1        | PENDIENTE                   | —                         |
| C20b | Memoria — mazo, práctica, metas, insights                       | P1        | 🐛 BUG (P2)                 | `C20b-memoria-mazo`       |
| C21  | Quiz bíblico (categorías, contrarreloj, añadir a mazo, stats)   | P1        | PENDIENTE                   | —                         |
| C22  | Word study / idiomas originales (interlineal, morfología)       | P1        | PENDIENTE                   | —                         |
| C23  | Búsqueda (texto + "ir a referencia")                            | P1        | PENDIENTE                   | —                         |
| C24  | Personalización (temas de lectura/color, tipografías)           | P1        | PENDIENTE                   | —                         |
| C25  | Compartir (plantillas, texturas, presets, tarjeta, enlace)      | P1        | PENDIENTE                   | —                         |
| C27b | Ajustes — resto (notificaciones, recordatorios, reset)          | P1        | PENDIENTE                   | —                         |
| C28  | Home (verso del día, continuar, check-in, reorg post-julio)     | P1        | PENDIENTE                   | —                         |
| C29  | Logros / gamificación (badges, títulos, fade de categorías)     | P1        | PENDIENTE                   | —                         |
| C38  | Onboarding (primer arranque)                                    | P1        | PENDIENTE                   | —                         |
| C40  | Accesibilidad (texto grande, alto contraste, keep-awake)        | P1        | PENDIENTE                   | —                         |
| C42b | Notas — lista, búsqueda, edición                                | P1        | 🐛 BUG (P3)                 | `C42b-notas-lista`        |
| C43b | Subrayados — colores y galería                                  | P1        | 🐛 BUG (P3)                 | `C43b-subrayados-galeria` |
| C57  | Glosas hebreas A3/A4 en word study (incl. A4-chico posicional)  | P1        | PENDIENTE                   | —                         |
| C58  | Toggle red-letter RVR1960 en el lector                          | P1        | PENDIENTE                   | —                         |
| C4   | Mesa — copiar bosquejo (Markdown) + compartir estudio           | P2        | PENDIENTE                   | —                         |
| C8   | Series — fecha por pasaje                                       | P2        | PENDIENTE                   | —                         |
| C9   | Series — vista "Por fecha"                                      | P2        | PENDIENTE                   | —                         |
| C10  | Series — exportar la serie completa a PDF                       | P2        | PENDIENTE                   | —                         |
| C11  | Series — banner "adjuntar pasaje"                               | P2        | PENDIENTE                   | —                         |
| C12  | Modo púlpito — tarjeta (conteo, estimación, stepper WPM)        | P2        | PENDIENTE                   | —                         |
| C13  | Modo púlpito — pantalla (secciones, reloj, A-/A+, keep-awake)   | P2        | PENDIENTE                   | —                         |
| C14  | Púlpito — accesible SIN notas                                   | P2        | PENDIENTE                   | —                         |
| C30  | Referencias cruzadas / constelación / cadena de referencias     | P2        | PENDIENTE                   | —                         |
| C31  | Temas topicales, sentimientos, Daily Light, devocional          | P2        | PENDIENTE                   | —                         |
| C32  | Profecías (hilo profético, quiz, mapa)                          | P2        | PENDIENTE                   | —                         |
| C33  | Recorridos bíblicos / Journeys                                  | P2        | PENDIENTE                   | —                         |
| C34  | Niños (historias, quiz, plan)                                   | P2        | PENDIENTE                   | —                         |
| C35  | Oración (companion, orar la Escritura, ACTS, lectio)            | P2        | PENDIENTE                   | —                         |
| C36  | Planes de lectura / plan builder / Juntos (grupos)              | P2        | PENDIENTE                   | —                         |
| C37  | Widgets                                                         | P2        | PENDIENTE                   | —                         |
| C41  | Favoritos (tab corazón; entrada a Colecciones)                  | P2        | PENDIENTE                   | —                         |
| C44  | "Mi lectura" / Reading insights (heatmap, racha, libro)         | P2        | PENDIENTE                   | —                         |
| C45  | Marcadores / Bookmarks                                          | P2        | PENDIENTE                   | —                         |
| C46  | Colecciones de versículos                                       | P2        | PENDIENTE                   | —                         |
| C47  | Datos bíblicos / Facts                                          | P2        | PENDIENTE                   | —                         |
| C48  | Línea de tiempo bíblica (distinta de Journeys)                  | P2        | PENDIENTE                   | —                         |
| C49  | Devoción guiada (check-in → verso → lectio → memorizar)         | P2        | PENDIENTE                   | —                         |
| C50  | "Tu camino" recap estilo Wrapped                                | P2        | PENDIENTE                   | —                         |
| C51  | "Sobre este libro" standalone (fuera de la Mesa)                | P2        | PENDIENTE                   | —                         |
| C52  | Landing de estudio/devocional compartido (recibir `?d=`)        | P2        | PENDIENTE                   | —                         |
| C53  | Comparación de versiones standalone                             | P2        | PENDIENTE                   | —                         |
| C59  | Hub de Teología                                                 | P2        | PENDIENTE                   | —                         |
| C60  | Diccionario — entradas de doble vista (ELECCIÓN, SEGURIDAD)     | P2        | PENDIENTE                   | —                         |
| C61  | Las 8 guías de feature narradas                                 | P2        | PENDIENTE                   | —                         |
| C62  | Sermon-notes                                                    | P2        | PENDIENTE                   | —                         |
| C63  | Comparte tu fe — Parte 2                                        | P2        | PENDIENTE                   | —                         |
| C64  | Foto propia en compartir (permisos de galería/cámara)           | P2        | PENDIENTE                   | —                         |
| C65  | Consolidación de notificaciones (6 tarjetas → 1 modal)          | P2        | PENDIENTE                   | —                         |
| C66  | Modal "Tips y guías"                                            | P2        | PENDIENTE                   | —                         |

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

La bitácora de las sesiones 1 a 141 y las fronteras anteriores se movieron tal cual a
`historial/INDEX-bitacora-hasta-s142.md` e `historial/INDEX-frontera-hasta-s142.md` (sesión 143). Cada sesión tiene
además su detalle en `detail/`. Desde la 142, una línea por sesión:

- **Sesión 142 — 2026-11-12.** La conciliación de los hallazgos viejos (solo docs): `ESTADO.tsv`, su validador y 42
  marcas de cierre en `BUGS.md`. Detalle: `detail/S142-conciliacion.md`.
- **Sesión 143 — 2026-11-12.** Solo docs: `INDEX.md` y `CONTINUAR.md` adelgazados, `REGLAS.md`, `RECETAS.md`,
  `historial/` y `tools/`; el orden de las tandas con los P1 viejos. Detalle: `detail/S143-adelgazar.md`.
- **Sesión 144 — 2026-11-12.** Arreglos, la tanda V1 (dinero): `R9-16`, `R9-17`, `R9-18` y `R9-19`, cada uno
  reproducido con el servicio real y con su prueba vista fallar; `R9-135` reproduce y espera la decisión de
  `R9-119`. Sin medir en vivo. Detalle: `detail/S144-arreglos-dinero.md`. Tras el cierre, `R9-119` quedó decidido
  por delegación (`CONTINUAR.md` §7): se hace en la tanda V1b, con `R9-135`.
- **Sesión 145 — 2026-11-12.** La revisión del diff de la 144 (no se tocó la app): los cuatro arreglos se
  sostienen (14 reverts por pieza y la matriz corrida de nuevo, idéntica); seis hallazgos nuevos, `R9-574` (P2: el
  aviso manda a «Restaurar», y «Restaurar» dice «No encontramos una ofrenda anterior») y `R9-575` a `R9-579` (P3);
  tres cosas que la decisión de `R9-119` no cubre, para la V1b. Sin medir en vivo. Detalle:
  `detail/S145-revision-del-diff-s144.md`.
- **Sesión 146 — 2026-11-12.** Arreglos: `R9-574` (P2) y la tanda V1b. Arreglados `R9-574`, `R9-119`, `R9-579` y
  `R9-578`; `R9-135`, en parte (el reintento de un `logIn` que falla al cambiar de cuenta) y sigue abierto: la
  raíz y el enlace tras pasar de anónimo a Google no entraron, porque con uno de los dos supuestos sobre
  RevenueCat le quitan los extras a quien pagó; quedaron escritas y medidas, esperando la cuenta de Google de
  prueba. La regla de `R9-119`, reescrita (una restauración vale para cualquiera). Sin medir en vivo. Detalle:
  `detail/S146-arreglos-premium.md`.
- **Sesión 147 — 2026-11-13.** La revisión del diff de la 146 (no se tocó la app), con 2 agentes pedidos por
  Victor: los cinco arreglos se sostienen (21 piezas y las dos matrices, idénticas; lo commiteado da igual con los
  dos supuestos). Nueve hallazgos nuevos: `R9-580` (P2: la compra de una cuenta nueva creada por link tras un
  cierre de sesión queda en la cuenta que salió; regresión de `R9-119`) y `R9-581` a `R9-588` (P3). El canje
  siendo anónimo no existe: corregido en `CONTINUAR.md` §7. Sin medir en vivo. Detalle:
  `detail/S147-revision-del-diff-s146.md`.
- **Sesión 148 — 2026-11-13.** Arreglos, con Opus 5.5 de principal y Fable de asesor: `R9-580` (P2: la cuenta creada
  por link tras un cierre de sesión se enlaza si RevenueCat no está en un id anónimo), `R9-581` y `R9-583` (P3).
  Lo commiteado da igual con los dos supuestos. La 149 revisa este diff; `R9-582`, `R9-584` y la V2 van después. Sin medir en vivo.
  Detalle: `detail/S148-arreglos-r9-580.md`.
- **Sesión 149 — 2026-11-13.** La revisión del diff de la 148 (no se tocó la app), con Opus 5.5 de principal y Fable
  de asesor: los tres arreglos se sostienen (las seis piezas de la 148 vuelven a caer por su razón, cuatro piezas
  nuevas, y las matrices, idénticas a las `s148fix3`). Tres hallazgos nuevos, P3: `R9-589` (el reintento del
  arranque mira un uid fijado antes de configurar el SDK: con un cambio de sesión durante `initialize()`, RevenueCat
  queda en la cuenta que salió; de la 146), `R9-590` (comentarios) y `R9-591` (pruebas). Leído en el SDK: los
  pedidos salen de a uno y en orden; con ese orden, la guarda de `R9-581` no cambia ninguna fila. A 6g lo cubre la
  letra de la §7. Sin medir en vivo. Detalle: `detail/S149-revision-del-diff-s148.md`.
- **Sesión 150 — 2026-11-13.** Arreglos, con Opus 5.5 de principal y Fable de asesor: `R9-582` y `R9-589`
  (`6e1c48df`: el servicio sabe quién está en sesión; el pendiente se reintenta solo para esa cuenta, mirada al
  reintentar, y cerrar sesión o eliminar la cuenta lo borran) y `R9-590` (`04b7b478`, solo comentarios). Diez pruebas
  nuevas, cada pieza vista caer sola; las sondas, sin ningún `logIn` de una cuenta que salió con otra sesión, igual
  con U y con N. La Parte 2 (`R9-584`, `R9-591`) y la V2 pasan a la 151, tras la revisión de este diff. Sin medir en
  vivo. Detalle: `detail/S150-arreglos-r9-582.md`.
- **Sesión 151 — 2026-11-13.** Revisión del diff de la 150, con Opus 5.5 de principal y Fable de asesor: las nueve
  piezas vuelven a caer por su razón (f2, leída prueba por prueba: 12 solas y 3 en cascada), las tres matrices con
  HEAD salen iguales a las de la 150, y seis piezas más no las fija ninguna prueba. Dos hallazgos nuevos (P3):
  `R9-592` (el canje enlaza con el uid de antes del `fetch` y, desde la 150, lo fija como la cuenta en sesión) y
  `R9-593` (la compra con el `logIn` en vuelo, leída en el SDK). La Parte 2 pasa a la 152. Sin medir en vivo.
  Detalle: `detail/S151-revision-del-diff-s150.md`.
- **Sesión 152 — 2026-11-16.** Arreglos, con Opus 5.5 de principal, Fable de asesor y 6 agentes a pedido de Victor:
  `R9-584` (`f11d813e`, las guardas de la 146 con prueba y los tres expects que no medían el reintento), `R9-591`
  (`21f67f21`, `__reset` vacía las colas `*Once` y las piezas de la 149 y la 150 con prueba) y `R9-592`
  (`0b957e86`, el canje enlaza solo si su cuenta sigue en sesión). Cada pieza vista caer sola sobre lo integrado; las
  sondas, como decía la predicción. Un hallazgo nuevo (P3): `R9-594` (el arranque sin red no carga el pendiente).
  Sin medir en vivo. Detalle: `detail/S152-arreglos-pruebas.md`.
- **Sesión 153 — 2026-11-16.** Revisión del diff de la 152, con Opus 5.5 de principal y sin agentes; el asesor
  respondió solo al cierre. Los tres arreglos se sostienen. El mock nuevo no cambia ninguna conducta con HEAD (0 eventos, con
  control). Cada prueba nueva cae con su pieza, por la razón escrita. Las diez matrices, iguales a `s152fix`. Dos
  declaraciones por lectura, ahora medidas. Ningún hallazgo nuevo; dos frases de `R9-594` corregidas («sin red» no
  basta: el SDK responde de su caché). Sin medir en vivo. Detalle: `detail/S153-revision-del-diff-s152.md`.
- **Sesión 154 — 2026-11-16.** Arreglos, la tanda V2 en parte, con Opus 5.5 de principal, Fable de asesor y 8
  agentes a pedido de Victor: `R9-128` y `R9-132` (`5296512b`, un `apply*` que falla ya no avanza el cursor) y
  `R9-37` (`253f0a9d`, sin listener huérfano), en `fix/s154-v2`. Cada pieza vista caer sola sobre lo integrado.
  `R9-127`: el diff del agente 6 no entró (quita la red del borrado). `R9-126`: medido con sonda y propuesto (C en
  su sesión; B a la §8). Sin medir en vivo. Detalle: `detail/S154-arreglos-v2.md`.
- **Sesión 155 — 2026-11-16/17.** Revisión del diff de la 154 y arreglo de `R9-127`, con Opus 5.5 de principal,
  Fable de asesor y sin agentes. La 154 se sostiene: las 18 piezas vuelven a caer por su razón. Dos hallazgos nuevos
  (P3): `R9-595` (un `apply*` que falla siempre clava el piso; medido) y `R9-596` (el upsert de `memoryCards`
  resuelve antes del disco; por lectura). `R9-127` (`9757b8dc`): el skip por uid y una ranura aparte para el
  borrado, armada tras el `deleteUser` y suspendida por un «Migrar»; medido antes con HEAD y con el diff del agente
  6; 21 pruebas y 13 piezas vistas caer. Un comentario (`d9f53ca0`) y la prueba 21 (`667e0e25`). Sin medir en vivo.
  Detalle: `detail/S155-revision-y-r9-127.md`.
- **Sesión 156 — 2026-11-17.** `R9-126` opción C, con Opus 5.5 de principal y 5 agentes a pedido de Victor (uno
  Sonnet `medium`, cuatro forks Opus `high`). `46ad0e93`: si LWW aplica un cambio remoto más nuevo (copia o lápida),
  la entrada vieja de ese doc sale de la cola. El agente 3 halló que C, con la cola sin leer, podía borrar entradas
  de otros docs: entró su guarda. El agente 4, el borrado remoto: C lo incluye (decisión técnica del orquestador).
  10 pruebas; tres piezas vistas caer en el principal. `R9-126` queda en parte (E, B y R). Notas en `R9-126` y
  `R9-595`; ningún hallazgo nuevo. Sin medir en vivo. Detalle: `detail/S156-r9-126-opcion-c.md`.
- **Sesión 157 — 2026-11-17.** Revisión de los diffs de la 155 (`R9-127`) y la 156 (C), con Opus 5.5 de principal
  y 5 agentes a pedido de Victor (dos Sonnet `medium`, tres forks Opus `high`). Sobre lo apilado, las 16 piezas
  vuelven a caer por su razón y la matriz de vecinos da lo escrito. Medido lo que la 156 dejó sin medir: C no
  rompe el push en vuelo ni los conflictos (nunca ve un `own` vivo). Un hallazgo nuevo, anterior a los dos diffs:
  `R9-597` (P3). Notas en `R9-126` y `R9-158`; una regla. Sin código. Detalle: `detail/S157-revision-155-156.md`.
- **Sesión 158 — 2026-11-17.** `R9-126` opción E, con Opus 5.5 de principal y 3 agentes a pedido de Victor (uno
  Sonnet `medium`, dos forks Opus `high`). `2e9b042b`: el bulk push de cada colección espera un snapshot del
  servidor y no re-sube lo que la nube ya tiene (sin ese filtro, «Migrar» re-subía la nube). El agente 2 halló que
  `firestore.ts` perdía `metadata`: entró en el mismo diff. 10 pruebas; 6 piezas vistas caer en el principal; la
  matriz de vecinos con C, 24 casos, ninguno rompe. `R9-126` sigue por B, R y el push en vuelo. Dos reglas. Sin
  medir en vivo. Detalle: `detail/S158-r9-126-opcion-e.md`.
- **Sesión 159 — 2026-11-17.** Revisión de `2e9b042b` (`R9-126` E), con Opus 5.5 de principal y 3 agentes a pedido
  de Victor (uno Sonnet `medium`, dos forks Opus `high`). La E se sostiene: 6 piezas y matriz, iguales byte a byte;
  el envoltorio, medido con las piezas reales de RNFB 26.2.0. Dos hallazgos nuevos (P3): `R9-598` (el bulk push de
  un `start()` viejo filtra con el listener de otra cuenta) y `R9-599` (el costo de `includeMetadataChanges`, por
  lectura). Dos notas en `R9-126`. Dos reglas. Sin código. Detalle: `detail/S159-revision-del-diff-s158.md`.
- **Sesión 160 — 2026-11-17.** La V3 en parte, con Opus 5.5 de principal, sin agentes, en `fix/s160-v3`.
  `501bb70a`: `R9-129` y `R9-131` (el historial de repasos relanza en el export, el sembrado y el agregado de la
  nube; una prueba con el `AchievementService` real). `90f67a46`: `R9-60` y `R9-117` (`LOCAL_BACKUP_KEYS` en
  `payload.local`, una prueba que vigila las claves contra el código, y los favoritos releen tras restaurar). La
  raíz de `R9-30` tiene guarda; quedan 47 claves en `PENDING_R9_30`. `R9-52` va a la 161 con su diseño. 11 piezas
  vistas caer. Dos reglas. Sin medir en vivo. Cerró en la 160b por el tope de llamadas. Detalle:
  `detail/S160-v3-arreglos.md`.
- **Sesión 161 — 2026-11-17.** Lo que quedaba de la V3, con Opus 5.5 de principal y 5 agentes a pedido de Victor
  (los cinco Opus 5.5 `high`, en worktrees), en `fix/s161-v3`. `R9-52`, en parte (`732974bb`, `f44364f0`): las notas
  y la autoevaluación rechazan, y la Mesa avisa con un toast por ráfaga. `R9-30`, la tanda 1 (`3041db99`,
  `994365a7`): 13 claves viajan, y el devocional y el testimonio releen tras restaurar. Quedan 34 claves y los
  bancos. Dos nuevos: `R9-600` (P2) y `R9-601` (P3). Validate 400/400. Sin medir en vivo. Detalle:
  `detail/S161-v3-arreglos.md`.
- **Sesión 162 — 2026-11-17.** La V3 que quedaba, con Opus 5.5 de principal y 3 agentes a pedido de Victor
  (los tres Opus 5.5 `high`, en worktrees), en `fix/s162-v3`. `R9-52`, cerrado (`dcbd9ced`): los tres bancos
  rechazan y sus 24 llamadores avisan. `R9-600`, cerrado (`4acd1834`, `39ddedd8`): lectura estricta para quien
  escribe encima. `R9-30`, la tanda 2 (`652a6a58`, `67c04b31`): ilustraciones y autoevaluación viajan por
  cuenta; `@sermon_notes` no pasa (no es de la Mesa). Validate 405/405. Sin medir en vivo. Detalle:
  `detail/S162-v3-arreglos.md`.
- **Sesión 163 — 2026-11-17.** La tanda 3 de `R9-30` y la Mesa ante una restauración, con Opus 5.5 de
  principal y sin agentes, en `fix/s163-v3`. `R9-30`, la tanda 3 (`36f7244f`, `664cfc65`): planes propios y
  grupos viajan, y sus providers releen tras restaurar. `R9-602` (P2), nuevo y cerrado (`9a2cc67d`): la Mesa
  relee sus notas con la señal. Validate 408/408. Sin medir en vivo. Detalle: `detail/S163-v3-arreglos.md`.
- **Sesión 164 — 2026-11-17.** La tanda 4 de `R9-30`, con Opus 5.5 de principal y 3 agentes a pedido de
  Victor (los tres `fork` Opus 5.5 `high`, en worktrees), en `fix/s164-v3` (8 commits). Viajan
  `@sermon_notes` (tal cual, sin migración), `@devotional_draft`, audio, compartir, la meta de lectura y
  «Ver también en…»; cinco pantallas releen con la señal. `lastReadPosition`, a `EXCLUDED`. Validate 416/416.
  Sin medir en vivo. Detalle: `detail/S164-v3-arreglos.md`.
- **Sesión 165 — 2026-11-17.** La tanda 5 de `R9-30` y su cierre, con Opus 5.5 de principal y 3 agentes a
  pedido de Victor (`general-purpose` Opus 5.5 `high`, en worktrees), en `fix/s165-v3` (11 commits). Viajan
  8 preferencias, con sus proveedores releyendo; 13 van a `EXCLUDED` (los recordatorios y una clave muerta).
  `PENDING_R9_30` se retira. Validate 423/423. Sin medir en vivo. Detalle: `detail/S165-v3-arreglos.md`.
- **Sesión 166 — 2026-11-18.** La revisión del diff de la 165 (`9d7a4e41..b61235db`), con emulador, con Opus 5.5
  de principal y 3 agentes a pedido de Victor (`general-purpose` Opus 5.5 `high`, en worktrees). Sin cambios de
  código. Nuevos: `R9-603`, `R9-604` y `R9-605` (P2), y de `R9-606` a `R9-611` (P3); sumas a `R9-410` y
  `R9-439`. En vivo (AVD, APK debug): importar cambia idioma, versión y contraste sin reiniciar. El audio real,
  sin medir. Detalle: `detail/S166-revision-v3.md`.
- **Sesión 167 — 2026-11-18.** Los arreglos de la revisión de la 166, con Opus 5.5 de principal y 3 agentes a
  pedido de Victor (`general-purpose` Opus 5.5 `high`, en worktrees), en `fix/s167` (8 commits). Cerrados de
  `R9-603` a `R9-611`: la voz de aquí se queda, `@audio_preferences` se valida, el lector no pisa «Continuar
  leyendo», la importación no escribe idioma ni versión desconocidos, y el modo dual sin clave no viaja. Nuevo:
  `R9-612` (P3). Validate 426/426. Sin medir en vivo. Detalle: `detail/S167-arreglos-revision-166.md`.
- **Sesión 168 — 2026-11-18.** La revisión del diff de la 167 (`de2d0f56..c9dd3b05`), con emulador, con Opus 5.5
  de principal y 3 agentes a pedido de Victor (`general-purpose` Opus 5.5 `high`, en worktrees). Sin cambios de
  código. Los nueve arreglos se sostienen. Nuevos: `R9-613` y `R9-614` (P3); suma a `R9-558`. En vivo (AVD, APK
  debug): una escritura de «Continuar leyendo» por capítulo abierto; la voz de aquí se queda. Sin P2 nuevos: la
  169 es la V4. Detalle: `detail/S168-revision-del-diff-s167.md`.
- **Sesión 169 — 2026-11-18.** La tanda V4 (cuenta y cuota), con Opus 5.5 de principal y 3 agentes a pedido de
  Victor (`fork` Opus 5.5 `high`, en worktrees), en `fix/s169-v4` (3 commits). Cerrados `R9-25` (el borrado de la
  cuenta, en páginas de 200), `R9-29` (el import no sube `reviewEvents` y encola en un lote) y `R9-24` (el texto de
  «Eliminar cuenta»). Nuevo: `R9-615` (P3). `R9-136` y `R9-4`: propuesta sin aplicar. Validate 429/429. Sin medir
  en vivo. Detalle: `detail/S169-tanda-v4.md`.
- **Sesión 170 — 2026-11-18.** La revisión del diff de la 169 (`212f9d09..d8425ada`), con emulador, con Opus 5.5
  de principal y 3 agentes a pedido de Victor (`fork` Opus 5.5 `high`, en worktrees). Sin cambios de código. Los
  tres arreglos se sostienen. Nuevos: `R9-616` y `R9-617` (P3, los trae `R9-29`), `R9-618` y `R9-619` (P3,
  previos); suma a `R9-25`. En vivo (AVD, letra 2.0): el diálogo de «Eliminar cuenta» entero en los dos idiomas,
  cancelado. Sin P2 nuevos: la 171 es la V5. Detalle: `detail/S170-revision-del-diff-s169.md`.
- **Sesión 171 — 2026-11-23.** La tanda V5, con Opus 5.5 de principal, sin agentes ni emulador, en `fix/s171-v5` (4
  commits). Cerrados `R9-41` (Crepúsculo: la oscuridad sale de la paleta), `R9-40` (el catálogo y los metadatos
  originales con plazo), `R9-54` (un día destildado no vuelve), `R9-55` y `R9-64` (editar un plan propio recorta y
  fusiona). Nuevo: `R9-620` (P2). `R9-51`: diseño sin código. Validate 431/431. Detalle: `detail/S171-tanda-v5.md`.
- **Sesión 172 — 2026-11-23.** La revisión del diff de la 171 (`9b9a73ff..2fdd61e6`), con Opus 5.5 de principal,
  sin agentes y con emulador; cortada a las ~100 llamadas, la cerró la 172b. Sin cambios de código. Los arreglos se
  sostienen (el tema, el plazo y los planes en vivo). Nuevos: `R9-621` (P3, la barra de estado siempre blanca),
  `R9-622` (P3, el sello de la fusión antes del inicio) y `R9-623` (P2, un lector montado re-tilda un día destildado
  por `R9-465`); suma a `R9-465`. La 173 arregla `R9-623`. Detalle: `detail/S172-revision-del-diff-s171.md`.
- **Sesión 173 — 2026-11-23.** Los arreglos de la revisión de la 172, con Opus 5.5 de principal, sin agentes y con
  emulador, en `fix/s173` (2 commits); cortada a las ~100 llamadas, la cerró la 173b. Cerrados `R9-623` y `R9-465`
  (`41a2a356`: un aviso ya no re-agenda el temporizador de lectura) y `R9-622` decidido (`2b126e75`: la fusión
  conserva el sello más viejo). Sin entradas nuevas. Validate 433/433. La 174 es `R9-51`. Detalle:
  `detail/S173-arreglos-revision-s172.md`.
- **Sesión 174 — 2026-11-24.** `R9-51` (dos notas para un versículo) con el diseño del §3 de la 171 y tres ajustes,
  con Opus 5.5 de principal, sin agentes y con emulador, en `fix/s174` (1 commit, `29c956ac`); cortada a las ~100
  llamadas, la cerró la 174b. El id de una nota es el versículo; un plegado al arrancar, en el adaptador y en el
  import; un candado de notas. Sin entradas nuevas. Validate 434/434. La 175 es la revisión del diff de la 174.
  Detalle: `detail/S174-r9-51-notas.md`.
- **Sesión 175 — 2026-11-24.** La revisión del diff de la 174 (`R9-51`), con Opus 5.5 de principal, sin agentes y
  con emulador, en `docs/review-s175`. El arreglo se sostiene (en vivo: la pestaña Notas y el lector con una nota por
  versículo). Nuevos, P3: `R9-624` (un pull durante el plegado deja una segunda fila), `R9-625` (la regla de
  «contenido» borra una nota que es subcadena de otra; medido también en vivo), `R9-626` (el plegado del adaptador
  con una app vieja) y `R9-627` (lectio falla en silencio). La 176 arregla `R9-625` y `R9-624`. Detalle:
  `detail/S175-revision-del-diff-s174.md`.
- **Sesión 176 — 2026-11-24.** Los arreglos de la revisión de la 175, con Opus 5.5 de principal, sin agentes y con
  emulador, en `fix/s176` (`4d5e4777`). `R9-625` (la regla de «contenido» compara párrafos enteros: «Ver Juan 1» y
  «Ver Juan 14:6» quedan las dos, también en vivo), `R9-624` («¿plegó?» se decide dentro del candado) y `R9-627`
  (lectio avisa y no pierde la oración), arreglados; `R9-626`, aceptado con porqué. 274 abiertos de 627. Validate
  435/435, 5141 pruebas. La 177 es la revisión del diff de la 176. Detalle: `detail/S176-arreglos-revision-s175.md`.
- **Sesión 177 — 2026-11-24.** La revisión del diff de la 176, con Opus 5.5 de principal, sin agentes y con
  emulador, sin cambios de código. El diff se sostiene: la regla por párrafos no pierde texto (4000 casos generados,
  CRLF, bordes, vacías y empates; plegar dos veces = una en las tres puertas; en vivo, once filas nuevas sobre un
  aparato plegado), `notesFoldedHere` no se filtra y el arranque tras un `setItem` fallido es correcto, lectio
  aguanta el doble toque y reintenta releyendo, y el porqué de `R9-626` alcanza. Sin hallazgos nuevos: 274 abiertos
  de 627. La 178 es la V6. Detalle: `detail/S177-revision-del-diff-s176.md`.
- **Sesión 178 — 2026-11-24.** La tanda V6 (CI y repo), con Opus 5.5 de principal, sin agentes ni emulador, en
  `fix/s178` (`324d98a8` y `36d63241`). `R9-107` (P1: qué job corre node se lee con un parser YAML, no por la forma
  de la línea; 12 formas y el `ci.yml` real con un cuarto job caen sin el arreglo), `R9-2` (`.env*` en el
  `.gitignore`), `R9-5` (el job pasa a «Dependency Report (non-blocking)»: `npm audit` sale 1 hoy, 62 avisos) y
  `R9-6` (`permissions: contents: read` y Codecov en un sha), arreglados. 270 abiertos de 627. Validate 437/437, 5182
  pruebas. La 179 es la revisión del diff de la 178. Detalle: `detail/S178-tanda-v6.md`.
- **Sesión 179 — 2026-11-24.** La revisión del diff de la 178, con Opus 5.5 de principal, sin agentes ni emulador y
  sin cambios de código, sobre main (`eb0945a6`). Se sostiene:
  - El CI real (run `45530938894`) está verde, con «Dependency Report (non-blocking)», `Contents: read` y Codecov
    desde `b9fd7d16`.
  - Revertida cada pieza sola, cae su prueba y solo la suya; el escáner viejo entero tumba 17.
  - Nada se rompe: ni el lockfile ni el entorno `node`, y `.env*` no le esconde nada a ningún build.

  Nuevos, P3: de `R9-628` a `R9-632` (`True` y `|| true`; un job que bloquea obligado a decir «report»; `docker://`;
  `shell: node`; un pin de cualquier acción). Una suma a `R9-118`. 275 abiertos de 632. La 180 son `R9-570` a
  `R9-573`. Detalle: `detail/S179-revision-del-diff-s178.md`.

- **Sesión 180 — 2026-11-24.** Los cuatro P3 de la 141, antes de la tanda 2, con Opus 5.5 de principal y sin
  agentes, en `fix/s180` (`ec99241a`, `4f4c24e3`, `dd758313` y `62ee160c`). Arreglados los cuatro:
  - `R9-570`: una cola por tipo de recordatorio. En vivo, 14 alarmas; el control sin la cola, 26.
  - `R9-571`: la ✕ pliega a través del ref. Con esto, el efecto de `R9-427` pasa a hacer falta.
  - `R9-572`: la prueba de la ✕ corre sobre el proveedor real; se vio roja antes del arreglo.
  - `R9-573`: «Fin del libro» ya no se ofrece sobre una lista. Uno armado antes vence al final de la lista. Sin
    textos nuevos.

  271 abiertos de 632. Validate 440/440, 5205 pruebas. La 181 es la revisión del diff de la 180, con emulador.
  Detalle: `detail/S180-arreglos-p3-de-la-141.md`.

- **Sesión 181 — 2026-11-24 y 2026-11-25.** La revisión del diff de la 180, en tres partes (las dos primeras
  cortadas por límite de llamadas), con Opus 5.5 de principal, sin agentes, con emulador en solo lectura y sin
  cambios de código, sobre main (`2f99078f`). Se sostiene:
  - Revertida cada pieza sola, cae solo lo suyo.
  - `R9-570`: 28 alarmas en frío, tras dos cambios de versión y al apagar y encender rápido.
  - `R9-571`: la ✕ pliega con la narración sonando.
  - `R9-573`: sin «Fin del libro» sobre una lista, y uno arrastrado para al final (con la repetición: leído).

  Nuevos, P3 y de antes de la 180: `R9-633` (el panel trabado, visto una vez y sin reproducir), `R9-634` (la
  pastilla «0m») y `R9-635` («Fin del capítulo» sobre un día de plan). `R9-464` confirmado en vivo. 274 abiertos de 635. La 182 es la tanda 2. Detalle: `detail/S181-revision-del-diff-s180.md`.

- **Sesión 182 — 2026-11-25.** La tanda 2, parte 1 (cortada por forma), con Opus 5.5 de principal, sin agentes y sin
  emulador, en `fix/s182` (`621793fd`, `457a6494`, `69d3d052` y `fdc69e7c`). Arreglados:
  - `R9-413` y `R9-414` (un commit): tras una lectura que rechaza, nada se escribe hasta releer; la primera
    escritura relee y construye sobre lo leído; si la relectura falla, escribe lo de memoria (la salida de `R9-212`).
  - `R9-421`: el heredado de Sepia se deriva solo de un blob anterior al gate. La vía del respaldo queda para Victor.
  - `R9-636` (nuevo, P3): «Restablecer» ya no le quita Sepia al heredado.
  - `R9-411`: los mapas de planes que no son un objeto ni se importan ni se hidratan.

  `R9-569` y `R9-559` quedan con `R9-558`. 270 abiertos de 636. Validate 441/441, 5231 pruebas. La 183: el resto de
  la tanda 2 (`R9-560` con emulador, `R9-31`, `R9-32` y `R9-53`). Detalle: `detail/S182-arreglos-tanda-2-parte-1.md`.

- **Sesión 183 — 2026-11-25 (docs en la 183b).** La tanda 2, parte 2, con Opus 5.5, sin agentes, cortada a ~95
  llamadas, en `fix/s183` (mergeada por Victor):
  - `R9-560` (`d991b711`): un `<ToastHost />` dentro del `Modal` dibuja el toast en esa ventana. Medido en vivo.
  - `R9-32`, en parte (`9095ffbf`): el export borra las copias viejas de la caché y no escribe sin compartir.
  - `R9-637` (nuevo, P3, por lectura): 22 modales con `useToast` sin `ToastHost`.
  - Decididos por delegación (§7): el aviso neutro tras exportar (`R9-32`); el restore no borra en la nube (`R9-31`).

  270 abiertos de 637. Validate 443/443, 5239 pruebas. La 184: el aviso de `R9-32`, `R9-31` y `R9-53`; después, la
  revisión del diff de la 182 y la 183. Detalle: `detail/S183-arreglos-tanda-2-parte-2.md`.

- **Sesión 184 — 2026-11-25.** La tanda 2, parte 3, con Opus 5.5, sin agentes ni emulador, en `fix/s184` (sin
  mergear):
  - `R9-32` cerrado (`8ed7e99a`): el aviso neutro tras un export limpio, en los dos idiomas.
  - `R9-31`, el texto (`b26d7878`, `38a13f59`): medido cuándo vuelve lo borrado; el diálogo dice «este
    dispositivo» y que la cuenta lo conserva. Sigue abierto: la transacción exclusiva, en el aparato.
  - `R9-53`: la propuesta de su entrada subcuenta (medido); sin arreglo, decide Victor.

  269 abiertos de 637. El paso 5 (la revisión del diff de la 182 y la 183) va a la 186. Detalle:
  `detail/S184-arreglos-tanda-2-parte-3.md`.
