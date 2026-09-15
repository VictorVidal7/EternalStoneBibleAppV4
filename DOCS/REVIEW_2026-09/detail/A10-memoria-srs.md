# A10 — Memoria/SRS: `MemoryDeckContext`, `lib/memory`

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 6 (2026-09-14) · Estado
> **🐛 BUG** (5 hallazgos: `R9-48` **P0**, `R9-53` P1, `R9-60`/`R9-61`/`R9-62` P2)
>
> **Procedencia y estado de verificación.** Fila ejecutada por un agente en worktree
> aislado dentro del fan-out de 4 de la sesión 6. Sonda ejecutable de 6 casos, **6/6 verde**
> (2,4 s), contra el `memoryStatsSync`, el `goalStore`, el `goals`, el `srs` y el `history`
> **reales**. **RE-VERIFICADO a mano por el orquestador** (sesión 6, segunda mitad): `R9-48` **se sostiene** en toda su cadena; las comprobaciones y los refuerzos están anotados en su entrada de `BUGS.md`. **R9-53, R9-60, R9-61 y R9-62 siguen SIN re-verificar.**

## Alcance

**Leído de punta a punta (14 archivos, ~2.900 líneas):**
`src/context/MemoryDeckContext.tsx` · `src/context/MemoryDeckContext.web.tsx` ·
`src/lib/memory/{srs,history,memoryStats,memoryStatsSync,reviewEvents,reviewEventStore,goals,goalStore,weeklyChallenge,weeklyTargetStore,easePrior}.ts` ·
`src/lib/sync/adapters/reviewEvents.ts`

**Leído en diagonal (dirigido):** `src/services/BackupService.ts` (solo `KEYS`,
`BackupPayload.memory`, export `~:441-560`, import `~:1177-1494`) ·
`src/context/AuthContext.tsx` (`signOut`/`deleteAccount`) · `src/context/SyncEngineContext.tsx`
(compuerta de auth + seed) · `src/lib/memory/{recall,insights}.ts` ·
`app/features/memory/{index,practice,insights}.tsx` ·
`src/hooks/{useMemoryGoal,useWeeklyChallenge}.ts` · `app/_layout.web.tsx`

## Cobertura de tests

**Bien cubierto (no se re-derivó):** `srs.test.ts` (39 casos: todas las transiciones de
caja, la banda de ease, el piso de +1 día, `lapseCount`, máscaras con acentos) ·
`memoryStats.test.ts` (17: merge/prune/coerce/signature) · `memoryStatsSync.test.ts` (14:
seed fresco/no-fresco/nunca-refetch, banner, `clearFloor`, skip-si-no-cambió) ·
`goals.test.ts` (15) · `recall.test.ts` (20) · `reviewEvents.test.ts` (15, incl. los bordes
de la ventana de 12 meses) · `weeklyChallenge.test.ts` (8) ·
`reviewEventsSyncAdapter.test.ts` · `reviewEventsCloudCleanup.test.ts` ·
`MemoryDeckContext.test.tsx`.

**Huecos reales donde caen los hallazgos:**

| Hueco                                                                                      | Cae en  |
| ------------------------------------------------------------------------------------------ | ------- |
| Los 14 tests de `memoryStatsSync` usan **UN SOLO uid**; nunca hay un segundo usuario       | `R9-48` |
| `backupServiceImport.test.ts:131` solo pasa `memory: {memoryDeck: null, reviewEvents: []}` | `R9-53` |
| Cero tests de paridad clave-AsyncStorage ↔ respaldo para el área                           | `R9-60` |
| Cero tests del recorte FIFO de `goalStore` en el borde de 60 entradas                      | `R9-62` |

**La pareja web SÍ está cubierta** — excepción grata en este repo:
`__tests__/webStubProviders.test.tsx:522-523` usa el patrón
`jest.mock('@context/MemoryDeckContext', () => require('.../MemoryDeckContext.web'))` y
ejercita 4 pantallas web reales a través del stub.

---

## 🐛 `R9-48` (P0, severidad **alta**) — el log de repasos nunca se borra al cerrar sesión: el historial del usuario A se escribe dentro de la cuenta del usuario B y destruye su agregado

`src/context/AuthContext.tsx:471` · `src/lib/memory/memoryStatsSync.ts:88-90`, `:120-152`,
`:173-188` · `src/context/MemoryDeckContext.tsx:203-209`

**Qué pasa.** `signOut` (y `deleteAccount`, `:572`) solo llama `clearMemoryStatsFloor()`. Su
propio docstring lo dice: _"Does NOT touch the local review-event log"_
(`memoryStatsSync.ts:176`). La tabla SQLite `review_events` es **de dispositivo, nunca
uid-scoped**, y nada en todo el repo la borra fuera de `BackupService` (verificado:
`grep -rn "DELETE FROM review_events" src/` → un solo hit, `BackupService.ts:1377`). Eso
rompe las dos mitades del mecanismo:

- **Bajada:** `seedMemoryStatsFloorIfFresh(B)` decide "dispositivo fresco" con
  `events.length > 0 → return` (`:89-90`). Los eventos de A siguen ahí, así que **el floor de
  B no se siembra nunca** y B pierde por completo su restauración de racha, heatmap y
  retención.
- **Subida:** `maybeWriteMemoryStatsSummary()` combina `getActiveUid()` (= B) con
  `getAllReviewEvents()` (= eventos de A) y hace `.set()` — **sobrescritura total, no
  merge** (`:140-143`) — sobre `users/B/memoryStats/summary`.

**Escenario de fallo.** Un teléfono compartido (matrimonio, familia — muy plausible en una
app bíblica). A memoriza 5 meses y cierra sesión. B entra con su cuenta; B lleva 400 días de
racha en su otro teléfono. B usa la app 10 segundos y la manda a segundo plano → el listener
de `AppState` (`MemoryDeckContext.tsx:203-209`) dispara la escritura. El agregado en la nube
de B queda reemplazado por los números de A. Y como `reviewEvents` **ya no sincroniza**
(decisión local-first), ese doc era **el único ancla de B en la nube**: cuando B reinstale o
cambie de teléfono, restaura la racha y el heatmap de A.

**Debería:** borrar o aislar `review_events` por uid al cerrar sesión, o negarse a escribir
el agregado hasta confirmar que el log local pertenece al uid activo.

**Evidencia — probado con sonda** (caso `A10-1`, pasa). Asertos duros: `mockDocGet` nunca se
llama (floor de B no sembrado), `mockCollection` recibe `'users/uid-B/memoryStats'`, y el
payload escrito lleva `longestStreak: 5` (el de A) donde B tenía `400`, y
`retentionBands.d1.total: 5` donde B tenía `900`.

**Por qué los tests no lo agarran.** Los 14 casos de `memoryStatsSync.test.ts` llaman
`fakeEngine('u1')` en el `beforeEach` y nunca cambian de uid. El único caso que roza el tema
—_"lets a later sign-in on the same device re-seed a fresh floor"_— verifica el floor, no el
log de eventos.

**Relación con lo ya reportado.** Mismo síntoma que `R9-22`/`R9-23`, **mecanismo distinto y
sin solapamiento**: esto NO pasa por la cola del `SyncEngine` sino por un `.set()` directo a
Firestore desde `memoryStatsSync.ts:140`. **Namespacear la cola por uid no arregla esto.**
(El mazo `@memory_deck` en sí **sí** cae bajo `R9-23`, vía `pullAllLocal`.)

---

## 🐛 `R9-53` (P1, severidad **media**) — restaurar un respaldo rompe la invariante de disyunción del _floor_: la retención se duplica y la corrupción se escribe de vuelta a la nube, acumulándose

`src/services/BackupService.ts:1377-1394` · `src/lib/memory/memoryStats.ts:17-22`,
`:127-142` · `src/lib/memory/history.ts:285-299`

**Qué pasa.** Toda la aritmética del _floor_ descansa en una invariante que el encabezado de
`memoryStats.ts:20-22` declara explícitamente: _"The floor is disjoint from local events […],
so summing retention bands never double-counts."_ `importBackup` hace
`DELETE FROM review_events` y reinserta el log completo (`:1377-1394`) **sin tocar el floor**.
A partir de ahí el floor y los eventos locales cubren **los mismos repasos**, y
`mergeRetentionBands` (`memoryStats.ts:136-139`) y `retentionByIntervalWithFloor`
(`history.ts:292-294`) **suman**.

**Escenario de fallo.** El usuario estrena teléfono y entra con su cuenta → se siembra el
floor desde el agregado en la nube (que resume, digamos, 500 repasos). Acto seguido importa
su respaldo JSON del teléfono viejo → los mismos 500 repasos entran en SQLite. (1) Insights
muestra 1.000 repasos donde hay 500. (2) Al pasar a segundo plano,
`computeMemoryStatsSummary` escribe las bandas duplicadas de vuelta a
`users/{uid}/memoryStats/summary` — **la corrupción se persiste en la nube**. (3) Ese doc
corrupto siembra el floor del _siguiente_ dispositivo fresco → ×3, ×4… **Acumula y no hay
forma de resetearlo desde la UI** (ver `R9-61`).

**Debería:** `importBackup` llamar `clearMemoryStatsFloor()` antes de repoblar
`review_events`.

**Acotación honesta:** solo `retentionBands` se corrompe. `recentDays` usa semántica "local
gana" (`mergeRecentDays`, `memoryStats.ts:90-97`) y `longestStreak` usa `Math.max` — ambos
idempotentes y a salvo.

**Evidencia — probado con sonda** (caso `A10-2`, pasa). Siembra un floor de
`d1: {total:10}`, restaura los mismos 10 eventos, y afirma: lectura → `20`, escritura a
Firestore → `20`, y un segundo ciclo de siembra → `30`, todo sobre 10 repasos reales.

**Por qué los tests no lo agarran.** `backupServiceImport.test.ts:131` solo pasa una sección
`memory` vacía, y los tests de `memoryStats`/`memoryStatsSync` construyen el floor y los
eventos como conjuntos disjuntos a mano — **precisamente la precondición que la restauración
viola**. Ningún test cruza los dos módulos.

---

## 🐛 `R9-60` (P2, severidad **baja**) — el respaldo omite 3 claves de AsyncStorage del área de memoria mientras respalda todas las demás preferencias locales

`src/services/BackupService.ts:104-117` (`KEYS`), `:196-199` + `:553-560` (payload) · faltan
`src/lib/memory/goalStore.ts:19-20` y `src/lib/memory/weeklyTargetStore.ts:16`

**Qué pasa.** Es el patrón exacto de "lista enumerada a mano que se quedó atrás".
`BackupPayload.memory` es literalmente `{memoryDeck, reviewEvents}`. **No viajan:**
`@memory_daily_goal`, `@memory_weekly_target`, `@memory_celebrated_milestones`. No es una
omisión de diseño coherente: el respaldo **sí** guarda `@app_theme_mode`,
`@reader_preferences`, `@prep_notes`/`@prep_series` ("deliberately never synced") y el bloque
entero de `achievements` ("device-local […] Never synced"). Todas son exactamente la misma
clase de preferencia local que las tres que faltan.

**Escenario de fallo.** El usuario ajusta su meta diaria a 25 y su reto semanal a 7 en
Ajustes → Metas (`src/components/settings/GoalsSettings.tsx:88`,`:99`), exporta un respaldo,
cambia de teléfono, importa. Meta diaria vuelve a 10 y reto semanal a 3, en silencio. Además,
al perderse `@memory_celebrated_milestones`, se le **vuelven a celebrar todos los hitos de
racha** que ya había celebrado.

**Debería:** añadir las 3 claves a `KEYS` y a la sección `memory`.

**Evidencia.** `grep -rn "'@memory[^']*'" src/ app/` da 8 claves definidas;
`BackupService.ts` referencia exactamente 1 (`@memory_deck`, `:113`).
`@memory_stats_floor`/`@memory_stats_floor_banner_pending` quedan fuera **correctamente**
(son caché derivable, y respaldarlas empeoraría `R9-53`); `@memory_reminder_*` pertenece a
`NotificationService`, fuera de esta fila.

---

## 🐛 `R9-61` (P2, severidad **baja**) — `resetDeck` está en la API pública del contexto pero no tiene ni un solo llamador: no hay forma de que el usuario borre sus datos de memoria

`src/context/MemoryDeckContext.tsx:88`, `:339-348` · `src/context/MemoryDeckContext.web.tsx:74-76`

**Qué pasa.** `resetDeck` está declarado, documentado (_"handy for 'Reset' affordance"_),
implementado con su encolado de borrados, y duplicado como no-op en el stub web.
`grep -rn "resetDeck" app/ src/` fuera del propio contexto → **cero resultados**. La
"afordancia de Reset" que promete el docstring **no existe en ninguna pantalla**.

**Escenario de fallo.** No es un crash; es la **ausencia de la ruta de recuperación**. Un
usuario afectado por `R9-48` o `R9-53` (estadísticas contaminadas o duplicadas) no tiene
ninguna acción en la app para limpiar y volver a empezar. **Sube la severidad efectiva de los
dos hallazgos anteriores.**

**Debería:** o cablear `resetDeck` a Ajustes, o quitarlo de la interfaz pública (y del stub
web) para que no aparente ser una vía de escape que no existe.

---

## 🐛 `R9-62` (P2, severidad **baja**) — el recorte FIFO de hitos celebrados expulsa las claves de racha y le re-celebra al usuario "¡3 días!" cuando lleva 156

`src/lib/memory/goalStore.ts:22`, `:66-80` · `src/lib/memory/goals.ts:102-120`

**Qué pasa.** `addCelebratedMilestones` recorta con `merged.slice(-MAX_CELEBRATED)` (`:72`),
`MAX_CELEBRATED = 60`, y el recorte **elimina las entradas más antiguas** — que son siempre
las claves `streak:*`, porque las `goal:YYYY-MM-DD` se van añadiendo al final una por día
cumplido. El comentario de `:63-64` afirma que es seguro _"porque una clave de racha solo
re-dispara cuando la racha realmente se reconstruye"_; **eso es falso**: basta con que caiga
fuera de la ventana de 60.

**Escenario de fallo.** Un usuario fiel con 100 días de racha que cumple su meta diaria a
diario. **Al día 56 después de su hito de 100 días** empieza una cascada: seis días seguidos
de celebraciones rancias — "¡3 días de racha!", "¡7!", "¡14!", "¡30!", "¡60!", "¡100!" —
mientras su racha real va por 156-161 días. Cosmético, pero trivializa justo el mecanismo de
retención que trae al usuario de vuelta cada día.

**Evidencia — probado con sonda** (caso `A10-5`, pasa). Salida literal, corriendo el
`goalStore` y el `goals` reales:

```
[ 'day56:streak:3',  'day57:streak:7',   'day58:streak:14',
  'day59:streak:30', 'day60:streak:60',  'day61:streak:100',
  'day80:streak:180' ]
```

(`day80:streak:180` sí es legítimo — es un hito nuevo real.) **Nota de honestidad del
agente:** su hipótesis inicial era que se re-celebraría `streak:100` directamente; la sonda
la **refutó** y reveló la cascada de abajo hacia arriba. Es la diferencia entre la afirmación
y el hecho.

---

## ✅ Lo que salió LIMPIO, con evidencia

**El algoritmo SRS es sólido — probado, no leído** (3 casos de sonda, pasan):

- 20 fallos consecutivos → `ease` se estabiliza exacto en `MIN_EASE` (0.6), caja 1, `dueAt`
  finito, `lapseCount` = 20. **Sin `NaN`, sin negativos.**
- 200 grados `easy` encadenados avanzando el reloj al `dueAt` de cada uno → `ease ≤ 1.6`,
  intervalo máximo 48 días. **No hay desbordamiento posible:**
  `Math.max(1, Math.round(base × ease))` (`srs.ts:231`) pone piso duro en 1 día, `clampEase`
  techo en 1.6, y `SRS_BOX_INTERVALS_DAYS[5] = 30` es el mayor base. El intervalo está acotado
  en **[1, 48] días por construcción**.
- `computeDueDate` usa `next.setDate(next.getDate() + days)` — aritmética de **día
  calendario**, correcta a través del horario de verano. Igual en `history.ts` (`buildHeatmap`,
  `currentStreak`, `longestStreak`) y en `weeklyChallenge.startOfLocalWeek`. **La lección del
  "anillo morado" está aplicada de forma consistente en toda el área**; ni un solo bucket de
  día por `+86400000` fijo.

**La pareja `.tsx`/`.web.tsx` es ✅ — comparada miembro por miembro.** Los 9 miembros de
`MemoryDeckContextValue` coinciden 1:1 (`cards`, `hydrated`, `dueCards`, `stats`, `hasCard`,
`addCard`, `removeCard`, `reviewCard`, `resetDeck`), mismos exportes de valor
(`MemoryDeckProvider`, `useMemoryDeck`), y `MemoryDeckProvider` **sí está montado** en
`app/_layout.web.tsx:297`. Los dos exportes que solo existen en el nativo
(`MemoryDeckContextValue`, `MemoryDeckStats`) son `interface`s puras que el archivo web
**importa** del nativo (`:43-46`): se borran en compilación y `tsc` resuelve al nativo. **Sin
riesgo de `R9-13`.**

**La carrera floor↔sync ya está cerrada a conciencia.** `adapters/reviewEvents.ts:18-27`
documenta y neutraliza exactamente el doble conteo por la vía de sincronización
(`pullAllLocal` → `[]`, `applyRemoteUpsert` → no-op). **`R9-53` es el mismo daño por la única
puerta que quedó abierta: la restauración manual de respaldo**, que ese encabezado menciona
(`:30-31`) pero solo para hablar de docs huérfanos en la nube, no del floor.

**i18n ✅.** Los `grep` de cadenas en inglés sobre `app/features/memory/*.tsx` dan 3 hits,
**todos en comentarios** (`index.tsx:467`, `practice.tsx:747`, `insights.tsx:8`). 72 usos de
`t.memory.*` en las tres pantallas.

**No se re-reporta** (ya cubiertos y confirmados aplicables sin mecanismo nuevo):
`R9-22`/`R9-23` para `@memory_deck` vía `pullAllLocal`; `R9-35` para un `updatedAt` futuro en
`memoryCards`; la escritura Firestore por repaso de `reviewCard`, decidida y aceptada.

## Receta para reconstruir la sonda

Archivo: `DOCS/REVIEW_2026-09/_scratch/A10.probe.test.ts` (gitignoreado por `.gitignore:107`;
vivía en el worktree del agente). Comando:
`npx jest DOCS/REVIEW_2026-09/_scratch/A10.probe.test.ts` → **6/6 pasan** (2,4 s).

1. Copiar el arnés de `__tests__/memoryStatsSync.test.ts:9-95` — los dos `jest.mock`
   (`src/lib/sync/firestore` con `mockDocSet`/`mockDocGet`/`mockCollection`, y
   `src/lib/memory/reviewEventStore` con `mockGetAllReviewEvents`), los imports **después** de
   los mocks, y el `beforeEach` con `AsyncStorage.clear()` +
   `__resetFirestoreCacheForTests()` + `__resetMemoryStatsSessionForTests()`. Ajustar las
   rutas relativas a `../../../src/...`.
2. `fakeEngine(uid)` = `setSyncEngine({getActiveUid: () => uid} as never)`.
3. **`R9-48`:** poblar `mockGetAllReviewEvents` con eventos de A → `clearMemoryStatsFloor()`
   → poner `mockSummaryDoc` con los datos de B → `fakeEngine('uid-B')` →
   `seedMemoryStatsFloorIfFresh('uid-B')` → afirmar `mockDocGet` **no** llamado →
   `maybeWriteMemoryStatsSummary()` → inspeccionar el último argumento de `mockDocSet`.
4. **`R9-53`:** eventos `[]` + `mockSummaryDoc` con `retentionBands.d1.total = 10` →
   `seedMemoryStatsFloorIfFresh` → cambiar `mockGetAllReviewEvents` a 10 eventos →
   `retentionByIntervalWithFloor(restored, floor.retentionBands)` → 20.
5. **`R9-62`:** `require` de `goalStore` y `goals` dentro del test; bucle de 90 días llamando
   `pendingMilestone` + `addCelebratedMilestones(milestoneKeysToMark(...))`, recogiendo los que
   vuelven con `type === 'streak'`.
