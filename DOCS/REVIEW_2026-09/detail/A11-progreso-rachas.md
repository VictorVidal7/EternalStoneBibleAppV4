# A11 — Progreso de lectura, planes y rachas

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 6 (2026-09-14) · Estado
> **🐛 BUG** (5 hallazgos: `R9-49` **P0**, `R9-54`/`R9-55` P1, `R9-63`/`R9-64` P2)
>
> **Procedencia y estado de verificación.** Fila ejecutada por un agente en worktree
> aislado dentro del fan-out de 4 de la sesión 6. **Los 5 hallazgos están probados con sonda
> ejecutable** (4 archivos de sonda). **PENDIENTE: la re-verificación a mano del
> orquestador** sobre los `grep` portantes del P0 (regla fija de `CONTINUAR.md` §5).

**Resumen del veredicto.** La matemática **pura** de esta fila está en muy buen estado:
`computeStreaks`, `planPace`, `planReflow`, `planCompletion`, `chapterProgress`,
`readingGoal` y `progressKeys` son correctos, defensivos y bien probados. **Todo lo que está
roto vive en las costuras**: contexto ↔ almacenamiento ↔ respaldo, y la dirección inversa
(descompletar / editar hacia abajo / restaurar).

## Alcance

**Leídos de punta a punta:** `src/lib/progress/progressKeys.ts`;
`src/lib/reading/{chapterProgress,bookReadingLog,readingGoal,readingGoalStore,planCompletion,planPace,planReflow,customPlans}.ts`;
`src/context/{ReadingProgressContext,ReadingPlanProgressContext,CustomPlansContext}.tsx`;
`src/lib/achievements/streak.ts`; `src/lib/utils/dateKey.ts`; `src/hooks/useConstancyRings.ts`;
`src/features/reading-insights/{readingInsights,weeklyRecap}.ts`.

**Leídos en diagonal (solo el cálculo):** `AchievementService.ts` (rutas `trackVersesRead` /
`recomputeReadingStreak` / los 5 getters de respaldo / `restoreBackup`), `BackupService.ts`
(`KEYS`, `safeQuery`, `buildBackup`, `importBackup`), `app/(tabs)/plan/[id].tsx`,
`app/(tabs)/verse/[book]/[chapter].tsx` (persistencia de progreso),
`app/features/plan-builder/index.tsx`, `weekComparison.ts`, `listeningStats.ts`,
`registerOfflineAdapters.ts`, `deleteAccountData.ts`.

**No revisados (otras filas):** el `SyncEngine` (`A4`), la UI de Home y de reading-insights,
kids/quiz/journeys.

## Cobertura de tests

**Cubre bien (≈90 `it()` en 12 archivos):** `streak.test.ts` (11 casos, incluido el escenario
del Sprint 58, duplicados, filas malformadas, cruce de mes); `planPace.test.ts` (días locales
vs bloques de 24 h, clamp, DST implícito); `planReflow.test.ts` (clamp, nunca días vacíos, los
20+ planes curados); `planCompletion.test.ts` (conserve-once-earned, **incluido "un-toggling a
day keeps the stamp"**); `progressKeys.test.ts` (5 casos de re-keying); `chapterProgress.test.ts`
(**incluido libro de 0 capítulos, sin división por cero**); `readingGoal.test.ts` (clamp,
fracción nunca > 1); `customPlanBuild.test.ts` (`distributeChapters` nunca vacío);
`readingProgressMaxMerge.test.tsx` (4 casos); `readingStreakDateKey.test.ts` (invariante
`feelingsDateKey === localDayKey`, referencial).

**NO cubre — y ahí está todo lo encontrado:**

1. Ninguna prueba ejercita `markChapterRead` **después** de un `toggleDay` que apaga un día
   ya auto-completado. `readingPlanProgressContext.test.tsx:65-82` llega a un paso de
   distancia → `R9-54`.
2. **`migratePlanProgress` no tiene NINGUNA prueba** (0 referencias en `__tests__/`) →
   `R9-55`, `R9-64`.
3. **Ninguna prueba corre con `TZ` distinto de la máquina** → `R9-63`. Ver el hallazgo
   transversal abajo.
4. `buildBackup` no tiene prueba con una BD que lance. La única cobertura de restauración
   (`achievementServiceRestoreBackup.test.ts`) prueba el import, no el export → `R9-49`.
5. Nada prueba `plan/[id].tsx:279` (la fórmula del porcentaje que se pinta), solo
   `planPace.percent`, que sí clampa. Las dos divergen → `R9-55`.

---

## ⚠️ Hallazgo transversal de método — la suite es estructuralmente ciega al horario de verano

**Ninguna prueba del repo fija `TZ`**, y tanto el CI como la máquina de Victor corren en
`America/Mexico_City`, **que abolió el horario de verano en 2022**. Por lo tanto **ningún
test de este repositorio puede detectar jamás un bug de DST.** Verificado: la sonda de
`R9-63` **pasa** en `America/Mexico_City` y **falla** en `Europe/Madrid`.

Esto es un **cuarto punto ciego** que se suma a los tres ya conocidos (resolución de módulos
por plataforma, la dirección inversa de cada flujo, y las listas de strings enumeradas a
mano). **Vale para toda la revisión, no solo para esta fila**: cualquier área que agrupe por
día, semana o mes merece una mirada con esta lente.

**Gotcha de entorno:** `TZ=... npx jest` desde la herramienta Bash **no** propaga la variable
en Windows — se ejecuta en la zona de la máquina y la sonda pasa. Hay que usar PowerShell:
`$env:TZ = 'Europe/Madrid'; npx jest <ruta>`.

---

## 🐛 `R9-49` (P0, severidad **alta**) — los 4 logs de lectura no pueden marcarse "degradados" en el respaldo, así que un fallo transitorio de SQLite produce un archivo que al importar BORRA la racha y los ledgers

`src/lib/achievements/AchievementService.ts:855`, `:879`, `:912`, `:944` ·
`src/services/BackupService.ts:356-371`, `:937-942` ·
`src/lib/achievements/AchievementService.ts:1046-1062`, `:128`

**Qué pasa.** `BackupService` envuelve las lecturas del export en `safeQuery`, cuyo **único**
mecanismo para marcar una sección degradada es su `catch`. Pero `getReadingLog()`,
`getCompletedBooks()`, `getBookReadingLog()` y `getChaptersReadLog()` **se tragan su propia
excepción** (`} catch { return []; }`) y devuelven `[]`. `safeQuery` ve un éxito. Resultado:
para las **4 secciones que contienen TODA la historia de lectura** (días de racha, libros
completados, agregados por libro, capítulos leídos), la bandera `degradedSections` es **código
muerto: físicamente inalcanzable**. Contraste probado: `getRawUserStats()` **no** se traga el
error y **sí** se marca.

Luego, al importar, la guarda `allRowsFailedValidation(sourceLen, survivedLen)` (`:937-942`)
exige `sourceLen > 0`. Con `[]` da `0` → `false` → `allFailed.streakLog` queda falso → y
`restoreBackup` ejecuta **`DELETE FROM reading_streak_log`** haciendo 0 inserts (`:1054-1063`).
Lo mismo con `completed_books`, `book_reading_log` y `chapters_read_log`.

**Remate.** `recomputeReadingStreak()` corre incondicionalmente en **cada** `initialize()`
(`:128`) y hace `UPDATE user_stats SET current_streak = ?, longest_streak = ?` **sin
`MAX()`** (`:530-533`), así que en el siguiente arranque el `longest_streak: 300` que
`restoreBackup` acababa de escribir desde el archivo se sobrescribe con **0**, calculado sobre
el log ya vacío. **El récord histórico se destruye.**

**Escenario de fallo.** Victor exporta su respaldo un martes; una de las 7 lecturas SQLite en
`Promise.all` lanza (el wrapper documenta fallos intermitentes; es el mismo supuesto que ya
aceptó `R9-27`). El archivo sale con `"streakLog": []` y **sin ninguna marca**, ni en el
archivo ni en la UI. Tres meses después cambia de teléfono, importa el archivo, ve «Copia de
seguridad importada correctamente», y su racha de 300 días, sus libros completados y su ledger
de capítulos **no existen**. Peor si importa sobre el teléfono viejo: el `DELETE` destruye la
copia buena que tenía localmente.

**Debería:** o marcar la sección degradada y negarse a borrar, o dejar que el error suba hasta
`safeQuery`.

**Relación con lo ya reportado.** Es de la misma familia que `R9-27` pero por un **canal
distinto y estrictamente peor**: `R9-27` es «la marca existe y no llega al archivo»; aquí **la
marca no se levanta nunca**, así que **arreglar `R9-27` no cerraría esto**. Y es más grave que
`R9-30` (que es "falta una clave") porque aquí la sección _está_ en el respaldo y **borra
activamente**.

**Evidencia — probado con sonda.** `_scratch/A11-probe4.test.ts`. Receta: instanciar
`new AchievementService(db)` con un `db` cuyo `executeSql()` siempre lance
`new Error('database is locked')`; copiar `safeQuery` **verbatim** de
`BackupService.ts:356-371`; llamar los 5 getters a través de él. Salida real:

```
streakLog       : []
completedBooks  : []
bookReadingLog  : []
chaptersReadLog : []
degradedSections: []          <-- should list all 4
after stats     : [ 'achievements.stats' ]
```

**Por qué los tests no lo agarran.** No hay ninguna prueba de `buildBackup` con una BD que
falle. `achievementServiceRestoreBackup.test.ts` prueba la ruta de import con datos bien
formados y la guarda `allFailed`, pero **siempre con `sourceLen > 0`** — el caso `[]`
legítimamente vacío nunca se distingue del `[]` por fallo, porque **en el código no hay nada
que los distinga**.

---

## 🐛 `R9-54` (P1, severidad **media-alta**) — descompletar un día de un plan no se sostiene: vuelve solo en la siguiente lectura de CUALQUIER capítulo, con notificación falsa

`src/context/ReadingPlanProgressContext.tsx:299-327` (el escaneo de `markChapterRead`) vs.
`:211-246` (`toggleDay`)

**Qué pasa.** `toggleDay` quita el día de `completedDays`, pero **no toca
`@reading_plan_read_chapters`**. El escaneo de `markChapterRead` recorre todos los planes
iniciados y re-completa cualquier día cuyos capítulos sigan marcados como leídos — que es
exactamente el estado en que quedó el día recién descompletado.

Que el equipo **conoce** este mecanismo está probado por `restartPlan` (`:436-457`), que **sí**
limpia las banderas de capítulo _"FIRST — otherwise the very next chapter read anywhere in the
app would… instantly auto-complete the 'restarted' plan again"_. Esa misma limpieza no se
aplicó al caso de un solo día.

**Escenario de fallo.** El lector va por el día 12 de "Nuevo Testamento en 30 días". El día 5
se auto-completó de más (leyó Mateo 9 de pasada, buscando una cita) y quiere volver a leerlo
bien, así que lo destilda. Abre Génesis 1 por cualquier motivo —**nada que ver con el plan**—
y el día 5 se vuelve a marcar solo, con toast «¡Día 5 completado!» disparado por una lectura de
Génesis. No hay forma de descompletar un día salvo reiniciar el plan entero (y perder los 12).

**Debería:** destildar un día también limpia las banderas de capítulo de **ese** día (con el
mismo cuidado que `restartPlan`), o el escaneo respeta un des-tildado explícito.

**Evidencia — probado con sonda.** `_scratch/A11-probe1.test.tsx`, arnés copiado de
`__tests__/readingPlanProgressContext.test.tsx`. Receta: `renderHook(useReadingPlanProgress)`
dentro de `ReadingPlanProgressProvider`; plan `iam-7` (día 1 = Juan 6); `toggleDay(1)` ×2 para
sembrar `startedAt` sin días hechos; `markChapterRead('Juan', 6)` → día 1 auto-completo;
`toggleDay(1)` → apagado; `markChapterRead('Genesis', 1)`. Salida real:

```
newlyCompleted from an UNRELATED read: [ { planId: 'iam-7', day: 1 } ]
day 1 complete again? true
```

**Por qué los tests no lo agarran.** `readingPlanProgressContext.test.tsx:65-82` hace casi
exactamente esto, pero marca el día 1 **a mano** (`toggleDay`), nunca vía `markChapterRead`,
así que Juan 6 nunca entra en `readChapters` y el día 1 no puede resucitar. Después el test
solo afirma sobre el día **2**, y nunca vuelve a mirar el día 1.

---

## 🐛 `R9-55` (P1, severidad **media**) — editar un plan propio para que tenga menos días arrastra números de día que ya no existen: la pantalla muestra 250%

`src/context/ReadingPlanProgressContext.tsx:259-272` (`migratePlanProgress`) ·
`app/(tabs)/plan/[id].tsx:279` · `app/features/plan-builder/index.tsx:222`

**Qué pasa.** Editar un plan personalizado lo reconstruye bajo un id derivado del contenido y
llama `migratePlanProgress(viejo, nuevo)`, que copia `completedDays` **verbatim, sin recortar
al `duration` nuevo**. La pantalla de plan calcula su porcentaje con
`Math.round((completed / effectiveDuration) * 100)` sobre `completedDays.length` **crudo**, no
sobre el valor clampado de `planPace`. Nótese que `planPace` **sí** filtra
(`planPace.ts:88-90`) y devuelve 100%: **las dos cifras se contradicen en la misma pantalla, y
la que se pinta es la mala.** El mismo número alimenta el ancho de la barra: `width: '250%'`.

**Escenario de fallo.** El lector arma un plan de 5 días, completa los 5, y luego lo edita para
quitar 3 pasajes (queda en 2 días). Al volver ve **«250%»** y la barra desbordada. Con 15 de 20
días hechos y una edición a 10 días, ve **150%**.

**Debería:** `migratePlanProgress` recorta `completedDays` a `[1, duración nueva]`, o la
pantalla usa `pace.percent`.

**Evidencia — probado con sonda.** `_scratch/A11-probe2.test.tsx`, test 1. Receta:
`setRegisteredCustomPlans([BIG, SMALL])` con un plan de 5 días y su versión de 2 días;
`toggleDay(BIG, 1..5)` en `act()` **separados** (importante: juntos se pierde el progreso, ver
`R9-64-bis`); `migratePlanProgress(BIG.id, SMALL.id)`; aplicar la fórmula literal de
`plan/[id].tsx:279`. Salida real:

```
completedDays carried over : [ 1, 2, 3, 4, 5 ]
effectiveDuration          : 2
screen percent (line 279)  : 250%
planPace percent (clamped) : 100%
```

**Por qué los tests no lo agarran.** `migratePlanProgress` tiene **cero** pruebas, y
`plan/[id].tsx:279` tampoco — solo se prueba `planPace.percent`, que es el que sí clampa. **Las
pruebas cubren la función correcta y no la que se renderiza.**

---

## 🐛 `R9-63` (P2, severidad **baja-media**) — el recap semanal se rompe en el cambio de horario: 6 días en vez de 7, un día contado dos veces

`src/features/reading-insights/weeklyRecap.ts:85-86` · mismo patrón en
`src/features/audio/lib/listeningStats.ts:156-157`

**Qué pasa.** El recorrido de la ventana de 7 días hace
`listeningDateKey(now - i * MS_PER_DAY)` — resta **bloques fijos de 24 h** y luego toma la
clave de día **local**. En un día de 25 h (vuelta al horario estándar), dos valores de `i` caen
en la misma fecha local: la ventana pierde un día y **suma dos veces** las lecturas del día del
cambio. El archivo hermano `weekComparison.ts:57-61` hace lo correcto
(`d.setDate(d.getDate() - 7)`, aritmética de calendario local), **así que la forma buena ya
existe en la misma carpeta**.

**Escenario de fallo.** Un lector en España abre «Mi semana en la Palabra» la noche del domingo
25-oct-2026 (el domingo del cambio de hora). Leyó 40 versículos el sábado y 10 el domingo. La
tarjeta —que es **compartible**— dice **60 versículos y 3 días activos** en vez de 50 y 2, el
sábado desaparece de la tira de días y el domingo aparece dos veces. Pasa **dos veces al año**
en toda Europa y en el cono sur; `weekComparison` propaga la cifra inflada al delta
semana-a-semana.

**Evidencia — probado con sonda.** `_scratch/A11-probe3.test.ts`. Correr desde **PowerShell**:
`$env:TZ = 'Europe/Madrid'; npx jest DOCS/REVIEW_2026-09/_scratch/A11-probe3.test.ts`.
Entrada: `now = new Date('2026-10-25T23:30:00+01:00')`, log con `2026-10-24: 40` y
`2026-10-25: 10`. Salida real en Madrid:

```
TZ = Europe/Madrid
7-day strip : ['2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25','2026-10-25']
versesRead  : 60 (real total = 50)
daysActive  : 3 (real = 2)
```

El mismo test **pasa** con `TZ=America/Mexico_City` (tira correcta, 50 versículos), incluido
como caso de control.

---

## 🐛 `R9-64` (P2, severidad **baja**) — `migratePlanProgress` BORRA el progreso de origen cuando el destino ya tiene el suyo, en vez de fusionarlo o dejarlo

`src/context/ReadingPlanProgressContext.tsx:264-268`

**Qué pasa.**

```js
const next = {...progress};
if (!next[toId]) next[toId] = current; // no pisa el destino...
delete next[fromId]; // ...pero borra el origen igual
```

El comentario explica bien por qué no se pisa el destino, pero el `delete` se ejecuta
**incondicionalmente**: cuando la rama protectora se activa, el progreso de `fromId` se
destruye sin ir a ningún lado.

**Escenario de fallo.** El lector tiene el plan A (contenido X) con días ya hechos. Crea el
plan B con otro contenido y avanza 3 días. Después edita B hasta dejarlo idéntico a A → el id
derivado del contenido colapsa en el de A. `migratePlanProgress(B, A)` ve que A ya tiene
progreso, no lo pisa, y **borra los 3 días de B**.

**Debería:** fusionar la unión de `completedDays`, o conservar la entrada de origen.

**Evidencia — probado con sonda.** `A11-probe2.test.tsx`, test 2. Tras `migratePlanProgress`,
`getCompletedDays(BIG.id)` devuelve `[]`.

### `R9-64-bis` (P2, **latente** — no elevado a fila propia)

`toggleDay`, `setPlanStart`, `setPlanDuration`, `restartPlan` y `startPlanFromSilentProgress`
leen `progress` **del estado**, mientras que `markChapterRead` usa deliberadamente
`progressRef.current` (`:152-155`: _"Refs mirror the latest state so `markChapterRead` can stay
referentially stable"_). Al montar la sonda, el agente encontró que **tres `await toggleDay(...)`
dentro de un mismo `act()` dejan solo el último** — los días 1 y 2 se pierden (`[1,2,3]`
esperado, `[3]` real).

En producción cada toque es un evento nativo separado y `persist` llama `setProgress` de forma
síncrona, así que React alcanza a re-renderizar entre toques: **no se encontró un disparador
realista**, y por eso queda latente y no se eleva. Se registra porque **el arreglo ya está
escrito en el mismo archivo** (el patrón de ref de `markChapterRead`) y no se aplicó a las otras
seis funciones.

---

## ✅ Lo que salió LIMPIO, con evidencia

**La racha, exhaustivamente — ✅ limpia.** `localDayKey` (`src/lib/utils/dateKey.ts:14`) usa
componentes `Date` **locales**; `toDayNumber` (`streak.ts:22-40`) convierte la ETIQUETA
`YYYY-MM-DD` con `Date.UTC`, que es correcto: aritmética UTC sobre una etiqueta local es
estable e **inmune a DST por construcción**. Verificados los 4 caminos de escritura/lectura:
`trackVersesRead:309`, `recomputeReadingStreak:518`, `useConstancyRings:92` y
`buildReadingInsights:240` (`dayNumberFromDateStr(localDayKey(now))`) — **los 4 usan la clave
local**. Leer a las 23:58 y a las 00:02 cae en dos días correctos; viajar México→España o al
revés no rompe ni infla la racha. **Cero `toISOString().split('T')[0]` disfrazado de local en
toda la fila. El arreglo del "anillo morado" está aplicado completo.**

**`planReflow` / `planPace` — ✅ limpios.** `distributeChapters` clampa `totalDays` a
`[1, nº capítulos]`, el stepper de la UI también (`plan/[id].tsx:303-308`,
`durationMax = maxReflowDays`), y `setPlanDuration` es no-op en cuanto hay un día marcado
(`ReadingPlanProgressContext.tsx:414`) — o sea, **el reflow no puede huerfanizar progreso**.
Atrasado 400 días: `scheduledDay` clampa a `duration`, `daysBehind` sale sano. `startedAt` en
el futuro (plan Together) → `scheduledDay = 1`. Ningún `/0`.

**El progreso por capítulo es max-merge deliberado** (`ReadingProgressContext.tsx:171-174`) y
no hay UI de "marcar como no leído", así que **ahí no hay dirección inversa que romper** —
correcto por diseño.

**`progressKeys.ts` — ✅, y ojo con el encargo:** ese archivo **no es** un archivo de claves de
almacenamiento, es el keying canónico de **nombres de libro** (español→inglés). Los 3
escritores/lectores de `readingProgress` (`ReadingProgressContext:161`/`:205`,
`AchievementService:185`, `BackupService:430`) pasan todos por
`canonicalProgressKey`/`canonicalizeProgressMap`. **No existe ninguna ruta de "borrar todos mis
datos" en Ajustes** (0 `multiRemove` / `AsyncStorage.clear` en `src/` fuera de `lib/database`),
así que la variante local de `R9-22`/`R9-23` no aplica por esa vía.

**Porcentajes y divisiones.** Un único `/0` real posible: `plan/[id].tsx:279` con
`effectiveDuration === 0`, solo alcanzable con un `@custom_plans` corrupto, que se parsea sin
validar en `CustomPlansContext.tsx:69` → `NaN%`. El **sobre-100 sí es alcanzable de verdad** →
`R9-55`.

## Hecho duro que sale de esta fila — **la racha NO viaja entre dispositivos**

Hay exactamente **5 adaptadores de sync** en toda la app: `notes`, `highlights`,
`reviewEvents` (`registerOfflineAdapters.ts:17-19`), `favorites` (`FavoritesContext.tsx:228`) y
`memoryDeck` (`MemoryDeckContext.tsx:267`). **Corrige el dato de "solo 3"** que circulaba: los
dos últimos se registran desde sus contextos, fuera de `registerOfflineAdapters.ts`.

Las **8 colecciones Firestore que existen** están enumeradas en `deleteAccountData.ts:22-43`:
`favorites, notes, highlights, bookmarks, memoryCards, reviewEvents, memoryStats, conflicts`.
**Ninguna es progreso de lectura, racha, `user_stats`, planes ni planes personalizados.**

**Consecuencia:** compras un teléfono nuevo, inicias sesión con la misma cuenta de Google y te
vuelven notas, resaltados, favoritos y el mazo — **tu racha de 300 días, tu mapa de progreso por
capítulo, tus planes y tus logros NO**. El único camino es el archivo de respaldo manual, que es
justo el archivo que `R9-49` demuestra que puede salir vacío en silencio.

**La app es honesta sobre esto en el diálogo de importar** (`translations.ts:4168`: «El progreso
de lectura, logros y rachas… solo viven en este dispositivo»), pero **no** en el anzuelo de
inicio de sesión (`translations.ts:3877`: «Inicia sesión para sincronizar tus datos entre
dispositivos»), que es una promesa sin calificar. **Vale alinear el anzuelo con la verdad que la
app ya sabe decir** — es una decisión de producto para Victor, no un bug.

## Addenda menores (no son filas del ledger)

- **`@reading_daily_goal` falta en el respaldo** (`readingGoalStore.ts:17` no está en
  `BackupService.ts:104-116`). Es un **añadido a la lista de `R9-30`**, no un hallazgo nuevo: al
  restaurar, la meta diaria de versículos vuelve a 10 y el anillo "Leer" se re-gradúa contra un
  objetivo que el lector no eligió. Incoherente con que `@app_theme_mode` y
  `@reader_preferences`, igual de locales, sí se respalden.
- **`listeningDateKey` (`listeningStats.ts:64-69`) es una copia byte a byte de `localDayKey`**,
  no una delegación. `readingStreakDateKey.test.ts:120-126` afirma igualdad **referencial** de
  `feelingsDateKey` con `localDayKey` explícitamente _"so a future edit that reintroduces a
  second, independently-computed day formula anywhere would break this immediately"_ — y esta
  segunda fórmula **ya existe y el test no la ve**. Un `import` de una línea cerraría el agujero.
- **Cerrar sesión no limpia racha, progreso ni planes** en un dispositivo compartido, así que
  el usuario B ve los de A. **No se eleva a hallazgo** porque está **documentado como decisión**
  (`deleteAccountData.ts:12-13`: _"local device data is intentionally left untouched… same as
  sign-out"_). Relacionado con `R9-59` (la misma política, en la Mesa).
