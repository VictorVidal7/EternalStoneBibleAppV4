# 🔍 Revisión profunda 2026-09 — ÍNDICE (ledger de checkpoints)

> **Frontera (sesión 143, 2026-11-12): la fase de ARREGLOS.** Qué queda abierto se pregunta con
> `node DOCS/REVIEW_2026-09/tools/validar-estado.cjs.txt` (de `ESTADO.tsv`); al cierre de la 142 eran 274 de 573:
> ningún P0, 20 P1, 92 P2, 161 P3 y un aviso. El orden de las tandas está en `CONTINUAR.md` §4. De las filas: los
> Modos A y B, terminados; del Modo C faltan `C17` y `C23` (P1) y lo que espera una cuenta de Google de prueba
> (`C26a`, `C54`, `C55`, el suelo de `C20a` y «Borrar cuenta» de `C27a`).

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
