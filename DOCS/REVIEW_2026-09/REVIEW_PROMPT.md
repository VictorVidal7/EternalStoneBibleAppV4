# Prompt — Revisión profunda de EternalStoneBibleAppV4 (2026-09)

> Pega este archivo (o "lee `DOCS/REVIEW_2026-09/REVIEW_PROMPT.md` y empieza") en un
> chat NUEVO. Pensado para Opus 5. Es un **programa** de varias sesiones, no una
> sola pasada — está diseñado para sobrevivir al reseteo de uso cada ~5 h mediante
> un ledger de checkpoints.

---

## 0. Contexto

App bíblica React Native / Expo (SDK 57, RN 0.86.2), español-primero, ~520 archivos
`.ts/.tsx` en `src/` + `app/`, ~106k líneas de código de componentes, 344 archivos de
test / ~4027 tests, monetización RevenueCat + Firebase Auth/Firestore, publicada en
Play Store solo en Prueba Interna (vc74 / 3.2.62).

Hubo una revisión exhaustiva previa (julio 2026) guiada por `DOCS/QA_REVISION_FABLE.md`
— 54 áreas, solo flujos en vivo en emulador, protocolo solo-reporte. Cerró completa;
11 de 12 bugs se arreglaron después en tandas A–E. **Han pasado 635 commits desde
entonces.** Esta revisión es más amplia: cubre 4 dimensiones, no solo flujos.

`main` está verde (`npm run validate` pasa). Por lo tanto **cualquier fallo NUEVO que
esta revisión haga aparecer es una regresión real** y cuenta como bug P0/P1.

Antes de empezar, lee estas memorias (están en el índice `MEMORY.md`):
`reference_essb-device-testing-and-automation`, `feedback_essb-theme-and-navigation-patterns`,
`feedback_essb-minimize-firestore-sync`, `feedback_essb-subtractive-vs-generative-delegation`,
`feedback_essb-agent-worktree-isolation`, `feedback_essb-verify-agent-commits-before-merge`,
`essb-qa-revision-fable`, `feedback_essb-theological-care`, `essb-master-backlog`.

---

## 1. Protocolo (LÉELO PRIMERO — no negociable)

1. **Solo revisar y reportar. NO se toca código de la app.** Lo único que se escribe
   es el ledger en `DOCS/REVIEW_2026-09/`. Arreglar es una sesión aparte, con sus
   ramas. Esto es lo que hace la revisión a prueba de cortes: un corte a media
   sesión nunca deja el árbol sucio ni un arreglo a medias.
   - "Mejoras posibles" (dimensión D) se **redactan como propuesta**, no se aplican.
2. **Reanudar:** al empezar cualquier sesión, lee `DOCS/REVIEW_2026-09/INDEX.md`
   entero (es fino a propósito, cabe en una sola lectura) y **continúa desde la
   primera fila `PENDIENTE` o `EN CURSO`**, respetando el orden de prioridad. No
   repitas filas `✅ OK` / `🐛 BUG` / `⚠️`.
3. **Checkpoint por área:** en cuanto termines de revisar un área, ESCRIBE de
   inmediato (a) su fila en `INDEX.md` (Estado + puntero al detalle) y (b) su
   archivo de detalle en `DOCS/REVIEW_2026-09/detail/<modo>-<slug>.md`. No esperes
   al final. Si la sesión se corta, lo guardado persiste.
4. **Un hallazgo ≠ arreglarlo.** Márcalo `🐛 BUG` (o `⚠️ DUDA`, o `💡 MEJORA`) con:
   severidad, pasos de repro, y evidencia. Regístralo también en `BUGS.md`
   (resumen corriente, P0 primero). NO lo arregles.
5. **Prioridad:** siempre P0 antes que P1 antes que P2 (definición abajo). Dentro de
   una prioridad, sigue el orden del índice.
6. **Estándar de evidencia** (por modo, ver §3). Sin evidencia, el hallazgo no
   entra al ledger.
7. **Revisa primero lo que los tests ya cubren.** 4027 tests ya afirman mucho —
   `grep` en `__tests__/` por el área antes de re-derivar terreno cubierto.
8. **Honestidad de alcance:** 106k líneas × 4 dimensiones es un programa de semanas,
   no una pasada. La meta es **hallazgos de alto valor ordenados por prioridad**, no
   un rastreo literalmente exhaustivo. Si una sesión se queda sin margen a mitad de
   un área, deja la fila en `EN CURSO` con lo que lleves y para.

---

## 2. Prioridades

- **P0 — dinero, identidad, pérdida de datos, seguridad.**
  RevenueCat / `OfferingSheet` / gating premium en TODA la app · Firebase Auth +
  borrado de cuenta · rutas con pérdida de datos posible (notas de versículo, Mesa
  de preparación, rachas, SRS de memoria, `BackupService` restaurar/respaldar) ·
  resolución de conflictos de sync · secretos/llaves · superficies de crash ·
  reglas de Firestore.
- **P1 — núcleo de la app.**
  Lectura de la Biblia · lector inmersivo · audio/TTS · memoria/SRS · quiz ·
  búsqueda · word study / idiomas originales · Home · Ajustes · onboarding ·
  compartir · logros.
- **P2 — todo lo demás + pulido + propuestas.**
  Profecías, journeys, kids, oración, planes, Juntos, widgets, timeline, facts,
  colecciones, marcadores, devocionales, teología, diccionario, daily-light,
  about-book, landings de enlaces compartidos, recap "Tu camino", etc.

---

## 3. Las 4 dimensiones (el ledger se divide por MODO, no por feature)

Cada modo tiene un entorno distinto. **No los mezcles en una misma sesión** — el modo
C paga un costo de ~15 min de arranque de emulador cada vez.

### Modo A — Auditoría estática de código (leyendo)

Entorno: ninguno, repo puro. Paraleliza bien por módulo.
Busca:

- Correctness por lectura: condiciones de carrera, manejo de errores, null-safety,
  deps de `useEffect`, closures obsoletas, `await` faltante, fugas de listeners.
- Inconsistencias: la misma cosa hecha de 2 formas, patrones divergentes entre
  pantallas hermanas.
- Código muerto: exports sin usar, archivos huérfanos, ramas inalcanzables.
- Altitud: duplicación, complejidad innecesaria, componentes de >1500 líneas
  (`verse/[book]/[chapter].tsx` 3975, `prep/index.tsx` 3467, `(tabs)/index.tsx`
  2671, etc.).
- Seguridad de tipos: `any`, `as`, `@ts-ignore`, `!` no-nulo, `@ts-expect-error`.
- Colores hardcodeados (regla: `useTheme()`, cero hex literales) — ver
  `feedback_essb-theme-and-navigation-patterns`.
- Huecos de i18n: strings en inglés crudo con UI en español, claves faltantes en
  `translations.ts` (esto mordió a la revisión previa: BUG-3, BUG-12).
- Violaciones de sync: escribir a Firestore cuando debería ser local-first
  (`feedback_essb-minimize-firestore-sync`).
- Manejo de params de deep-link (`app/+native-intent.tsx`, headers de cada pantalla).
  Evidencia: `file:line` + una frase del defecto + escenario de fallo concreto. Una
  sesión posterior puede re-verificar releyendo.
  **Herramienta:** para el barrido grande, dile a Victor que lance él
  `/code-review ultra` (el chat no puede lanzarlo). El chat SÍ puede correr
  `/code-review` (no-ultra) sobre un path/módulo específico.

### Modo B — Dependencias, vulnerabilidades, vigencia de software

Entorno: ninguno. Es ~1–2 sesiones en total, no 54 filas.

- `npm audit` (hoy: 8 vulns — 7 moderate, 1 high, 0 critical). Clasificar cada una:
  ¿alcanzable desde código de la app? ¿hay fix sin breaking change?
- `npm outdated` (hoy: ~50 paquetes atrás). Separar: (a) seguro de subir ya,
  (b) fijado por Expo SDK 57 — no tocar, (c) major con breaking changes — anotar
  esfuerzo.
- Expo SDK 57 / RN 0.86: APIs deprecadas en uso, `expo-doctor`.
- Dependencias sin usar (estilo `depcheck`).
- Licencias de dependencias — compatibilidad con app comercial de pago.
- Superficie de módulos nativos: `app.json` plugins, permisos de Android
  (¿alguno sobra?), `google-services.json` está trackeado (normal para Firebase,
  pero confirmar que no lleva nada que no deba).
- Escaneo de secretos en el árbol y en el historial (`git log -p` por patrones de
  API key / token). `keystores/` ya está en `.gitignore` (verificado).
- Seguridad de CI: `.github/workflows/ci.yml` — permisos del token, acciones de
  terceros sin SHA fijo, `pull_request_target`, etc.
- Reglas de Firebase (`firestore.rules` / Storage) — ¿algún path abierto?

### Modo C — Prueba de flujos en vivo

Entorno: **emulador Android + Metro + APK DEBUG.** NUNCA el OnePlus de Victor
(el release build no manda `logger.*` a logcat, y el sideload sobre la instalación
de Play borra sus datos). Ver `reference_essb-device-testing-and-automation` para el
recipe completo, gotchas de `adb` en Windows, deep links, y el toggle premium de dev
(Ajustes → sección "Extras" → "Extras desbloqueados (solo desarrollo)").

- **Reutiliza la descomposición de 54 áreas de `DOCS/QA_REVISION_FABLE.md`** — esas
  áreas siguen existiendo, están probadas, no las re-derives. Cópialas al índice.
- **Suma las features post-julio:** hub de Teología · entradas de diccionario de
  doble vista (ELECCIÓN, SEGURIDAD DE LA SALVACIÓN) · glosas hebreas A3/A4 en word
  study · toggle red-letter RVR1960 · 8 guías de feature · sermon-notes · share-faith
  Parte 2 · foto propia en compartir · reorg de Home · consolidación de
  notificaciones · modal "Tips y guías" · canje de gift-code · fade de categorías en
  Logros · glosa posicional A4-chico.
- Cada ruta P0 (dinero / auth / datos) se ejercita en AMBOS sentidos (free y premium
  vía el toggle de dev).
- Evidencia por fila: `file:line` + repro exacto + ruta de la captura + extracto de
  logcat. Una sesión posterior NO puede re-verificar un hallazgo en vivo sin rehacer
  el trabajo de dispositivo — por eso el estándar es más alto aquí.
- Semilla ya conocida: **BUG-10** (Hilo profético, "Siguiente" no resetea el scroll —
  `app/features/prophecies/index.tsx`) sigue abierto de la revisión previa. Verifícalo
  y si sigue, entra directo como `🐛 BUG` P2.

### Modo D — Propuestas de mejora

Entorno: ninguno. Solo redacción — Victor revisa (ver
`feedback_essb-subtractive-vs-generative-delegation`: bajo delegación amplia, los
arreglos sustractivos se pueden proponer para aplicar ya; los generativos solo se
redactan).

- Fricción de UX, affordances faltantes, arquitectura de información.
- Rendimiento (componentes gigantes, listas sin virtualizar, re-renders).
- Accesibilidad más allá de lo que atrapa el modo A (orden de foco, labels,
  targets de 48dp, contraste real).
- Contenido teológico / traducciones: si algo parece mal, se marca como DUDA para
  Victor — no se reescribe (ver `feedback_essb-theological-care`).

---

## 4. Estructura del ledger

```
DOCS/REVIEW_2026-09/
  REVIEW_PROMPT.md     ← este archivo
  INDEX.md             ← índice FINO: 1 línea por área. Es lo único que se lee al reanudar.
  BUGS.md              ← resumen corriente de bugs, P0 primero (como el "Resumen de bugs" de Fable)
  detail/
    A-<slug>.md        ← 1 archivo por área de modo A revisada
    B-<slug>.md
    C-<slug>.md
    D-<slug>.md
  _scratch/            ← archivos de agentes en fan-out (se fusionan al índice y se borran)
```

`INDEX.md` tiene, por modo, una tabla:

| #   | Área | Modo | Prioridad | Estado | Detalle |
| --- | ---- | ---- | --------- | ------ | ------- |

Estados: `PENDIENTE` · `EN CURSO` · `✅ OK` · `🐛 BUG` · `⚠️ DUDA/PARCIAL` · `💡 MEJORA` · `⛔ NO PROBABLE AQUÍ`

**Regla de oro:** `INDEX.md` debe caber en una sola lectura. Nada de párrafos de
hallazgos ahí — solo la fila de estado y el puntero. El contenido va en `detail/`.

---

## 5. Sesión 1 — SOLO el inventario (y para)

La primera sesión NO revisa nada. Su único entregable:

1. Crear `DOCS/REVIEW_2026-09/INDEX.md` con: el bloque de protocolo (resumido), el
   puntero al recipe de emulador, las definiciones de prioridad, y las 4 tablas de
   modo.
2. Poblar las filas:
   - **Modo C:** las 54 áreas de `QA_REVISION_FABLE.md` + las features post-julio de §3.
   - **Modo A:** una fila por módulo/dominio (audio, memoria, quiz, lectura, prep,
     profecías, kids, oración, compartir, Home, Ajustes, auth/premium, sync/backup,
     i18n, theming, deep-links, navegación, hooks compartidos, servicios…).
   - **Modo B:** las ~10 filas de §3 (audit, outdated, expo-doctor, deps sin usar,
     licencias, permisos Android, secretos en árbol, secretos en historial, CI,
     reglas Firebase).
   - **Modo D:** filas por superficie de UX (onboarding, Home, lector, reproductor,
     Ajustes, flujos premium, accesibilidad transversal, rendimiento).
   - Todas en `PENDIENTE`. Asignar prioridad a cada una.
3. Crear `BUGS.md` vacío (con encabezados P0/P1/P2) y sembrar BUG-10.
4. Commit del scaffold (`docs(review): scaffold 2026-09 deep-review ledger`) — es
   doc puro, no código de app. **Pídele a Victor el OK para commitear/pushear** (no
   asumas — ver convenciones). Luego PARA. No empieces a revisar.

---

## 6. Fan-out de agentes (a criterio de Victor, por sesión)

Victor decidirá según su margen de uso si una sesión despacha agentes en paralelo o
no. Cuando diga "despacha N agentes para las áreas X, Y, Z":

- Cada agente toma **UNA** área, corre con `isolation: worktree` (regla fija: TODO
  agente con Bash necesita worktree — `feedback_essb-agent-worktree-isolation`).
- El agente revisa en su modo y escribe sus hallazgos SOLO a
  `DOCS/REVIEW_2026-09/_scratch/<área>.md` — **nunca** a `INDEX.md` (evita carreras
  de escritura concurrente).
- El orquestador espera a que TODOS terminen, luego fusiona los scratch al `INDEX.md`
  - archivos `detail/` en UNA sola pasada de integración, y borra los scratch.
- Verifica el estado real en el worktree de cada agente, no confíes en el "completado"
  (`feedback_essb-verify-agent-commits-before-merge`).
- Modo C en paralelo: un emulador por agente (ver la nota de multi-emulador en
  `reference_essb-device-testing-and-automation`), cada uno con su `-s <serial>`.
- **Después de cada tanda de agentes en worktree:** corre `npm ci --legacy-peer-deps`
  desde la raíz del repo main ANTES del siguiente comando de gate — los worktrees
  concurrentes corrompen `node_modules/.bin` compartido (recurrente, mitigación
  confirmada por Victor).
- El fan-out multi-agente / `Workflow` necesita que Victor lo pida explícitamente
  ("despacha agentes" / "ultracode"). El chat no lo inicia solo.

---

## 7. Al terminar cada sesión

- Confirma que `INDEX.md` y los `detail/` reflejan todo lo revisado en la sesión.
- Deja `git status` limpio salvo el ledger. Si commiteas el ledger, pide OK a Victor.
- Un resumen de 3–5 líneas a Victor: áreas cerradas esta sesión, bugs nuevos (con
  severidad), y cuál es la siguiente fila `PENDIENTE`.
- Actualiza memoria (directiva `feedback_essb-memory-freshness`).

---

## 8. Primer mensaje sugerido para el chat nuevo

> Vamos a hacer la revisión profunda de la app. Lee
> `DOCS/REVIEW_2026-09/REVIEW_PROMPT.md` y las memorias que lista. Confirma el estado
> de git contra lo esperado (`main` = `origin/main`, árbol limpio, 6 ramas locales).
> Luego ejecuta la **Sesión 1: solo el inventario** (§5) y para.
