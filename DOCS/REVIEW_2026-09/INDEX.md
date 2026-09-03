# 🔍 Revisión profunda 2026-09 — ÍNDICE (ledger de checkpoints)

> **Frontera actual: Modo A · fila `A2`.** Sesión 2 cerró todo el Modo B P0 (`B1`,
> `B1b`, `B2`–`B5`). Sesión 3 (2026-09-03) cerró `A1` con **2 bugs P0 de dinero**
> (`R9-9`, `R9-10`). Siguiente `PENDIENTE`: `A2` (P0, ofrenda/gift-code) y el resto del
> bloque `A2`–`A12`, que es el mayor valor restante.

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
  placeholder) · merge de `chore/release-3.2.62` a `main`.
- **Comportamientos del emulador que NO son bugs de la app:** el AVD silencia
  `expo-speech` (`AudioHardening`), y `expo-av` está en `package.json` pero nada en
  `src/` lo importa — el audio es `expo-speech`. Ver la memoria de device-testing.
- **Excepciones legítimas de hex hardcodeado** (no las marques como violación de
  theming): texto de chrome siempre-oscuro sobre `gradient.headerColors`, las
  plantillas de imagen `FREE_TEMPLATES`, y `staticColors`. Ver la memoria
  `feedback_essb-theme-and-navigation-patterns`.
- **Piso de sync aceptado a propósito:** `reviewCard()` en `MemoryDeckContext` dispara
  una escritura Firestore por repaso real — evaluado y aceptado, no es un hallazgo.

---

## Modo A — Auditoría estática de código

| #   | Área                                                               | Prioridad | Estado    | Detalle                 |
| --- | ------------------------------------------------------------------ | --------- | --------- | ----------------------- |
| A1  | Premium: `PremiumContext` + RevenueCat + entitlements              | P0        | 🐛 BUG    | `A1-premium-revenuecat` |
| A2  | Ofrenda/Donación: `offeringService`, `giftCodeService`             | P0        | PENDIENTE | —                       |
| A3  | Auth: `AuthContext` + borrado de cuenta                            | P0        | PENDIENTE | —                       |
| A4  | Sync: `SyncEngine.ts` (1378 L) y colas de escritura                | P0        | PENDIENTE | —                       |
| A5  | Auditoría de TODAS las escrituras a Firestore (call sites)         | P0        | PENDIENTE | —                       |
| A6  | Paridad web/native (`*.web.tsx` premium/offering/memory)           | P0        | PENDIENTE | —                       |
| A7  | `BackupService.ts` (1526 L) — respaldar/restaurar                  | P0        | PENDIENTE | —                       |
| A8  | Persistencia de notas y subrayados (`lib/notes`, `lib/highlights`) | P0        | PENDIENTE | —                       |
| A9  | Persistencia/autoguardado de la Mesa (`features/prep`)             | P0        | PENDIENTE | —                       |
| A10 | Memoria/SRS: `MemoryDeckContext`, `lib/memory`                     | P0        | PENDIENTE | —                       |
| A11 | Progreso y rachas: `lib/progress`, `lib/reading`, rings            | P0        | PENDIENTE | —                       |
| A12 | Superficies de crash: error boundaries, promesas sin catch         | P0        | PENDIENTE | —                       |
| A13 | Lector de capítulo (`verse/[book]/[chapter].tsx`, 3975 L)          | P1        | PENDIENTE | —                       |
| A14 | Capa de base de datos (`lib/database/index.ts`, 2425 L)            | P1        | PENDIENTE | —                       |
| A15 | Audio/TTS (`features/audio`, `lib/speech`)                         | P1        | PENDIENTE | —                       |
| A16 | Búsqueda (`lib/search`, `(tabs)/search.tsx`)                       | P1        | PENDIENTE | —                       |
| A17 | Quiz (`features/quiz`, `app/features/quiz`)                        | P1        | PENDIENTE | —                       |
| A18 | Word study / idiomas originales (`features/study`)                 | P1        | PENDIENTE | —                       |
| A19 | Home (`(tabs)/index.tsx`, 2671 L)                                  | P1        | PENDIENTE | —                       |
| A20 | Ajustes (`(tabs)/settings.tsx`, 1289 L)                            | P1        | PENDIENTE | —                       |
| A21 | Onboarding (`lib/onboarding`, `useOnboarding`)                     | P1        | PENDIENTE | —                       |
| A22 | Compartir (`ShareService`, `features/share`, `ImageShareModal`)    | P1        | PENDIENTE | —                       |
| A23 | Logros e insignias (`lib/achievements`, `lib/badges`)              | P1        | PENDIENTE | —                       |
| A24 | i18n: paridad de claves ES/EN (`translations.ts`, 13066 L)         | P1        | PENDIENTE | —                       |
| A25 | Theming: `useTheme` + barrido de hex literales                     | P1        | PENDIENTE | —                       |
| A26 | Navegación y BackHandler (`useBackHandlerStep`, layouts)           | P1        | PENDIENTE | —                       |
| A27 | Deep links (`+native-intent.tsx`, params por pantalla)             | P1        | PENDIENTE | —                       |
| A28 | Hooks compartidos (`src/hooks/*`, 19 archivos)                     | P1        | PENDIENTE | —                       |
| A29 | Árbol de contexts + `ServicesContext` (18 providers)               | P1        | PENDIENTE | —                       |
| A30 | Seguridad de tipos: `any` / `as` / `@ts-ignore` / `!`              | P1        | PENDIENTE | —                       |
| A31 | Código muerto: exports sin usar, archivos huérfanos                | P1        | PENDIENTE | —                       |
| A32 | Mesa de preparación — altitud (`prep/index.tsx`, 3467 L)           | P2        | PENDIENTE | —                       |
| A33 | Profecías (`prophecies/index.tsx`, 1892 L)                         | P2        | PENDIENTE | —                       |
| A34 | Journeys + "Tu camino" (`journeys/`, `journey/`)                   | P2        | PENDIENTE | —                       |
| A35 | Niños (`features/kids`)                                            | P2        | PENDIENTE | —                       |
| A36 | Oración y lectio (`features/prayer`, `lectio.tsx`)                 | P2        | PENDIENTE | —                       |
| A37 | Planes y Juntos (`CustomPlansContext`, `TogetherContext`)          | P2        | PENDIENTE | —                       |
| A38 | Widgets (`src/widgets`, `features/widgets`)                        | P2        | PENDIENTE | —                       |
| A39 | Timeline, facts, colecciones, marcadores                           | P2        | PENDIENTE | —                       |
| A40 | Devocional, Daily Light, guiada, sentimientos, temas               | P2        | PENDIENTE | —                       |
| A41 | Teología y diccionario (`features/theology`, `dictionary`)         | P2        | PENDIENTE | —                       |
| A42 | Sermon-notes y share-faith                                         | P2        | PENDIENTE | —                       |
| A43 | Reading insights (`reading-insights/index.tsx`, 1730 L)            | P2        | PENDIENTE | —                       |
| A44 | Comparación de versiones (`VersionComparisonScreen`, 2141 L)       | P2        | PENDIENTE | —                       |
| A45 | Landings compartidos + about-book + explore-all                    | P2        | PENDIENTE | —                       |
| A46 | Conflictos (`features/conflicts`, `(tabs)/conflicts.tsx`)          | P2        | PENDIENTE | —                       |

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
- **Sesión 3 — 2026-09-03.** Modo A, fila `A1` (premium / RevenueCat / entitlements)
  cerrada como `🐛 BUG` con **2 hallazgos P0 de dinero** (`R9-9` alta, `R9-10` media),
  ambos **verificados con sondas ejecutables**, no solo por lectura. Hueco de fondo: la
  suite tenía cubierta la dirección `false → true` (conceder) y **ninguna** prueba de la
  dirección que **quita** el acceso. Intento de fan-out de 11 agentes para `A2`–`A12`
  abortado por límite de uso antes de que ninguno escribiera su `_scratch/` — sin
  progreso perdido, las 11 filas siguen `PENDIENTE`.
