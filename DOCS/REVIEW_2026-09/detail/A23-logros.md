# A23 — Logros e insignias (`lib/achievements`, `lib/badges`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 121 (2026-11-03, chat nuevo; con 3
> agentes a pedido de Victor) · Estado **🐛 BUG**
>
> **Resultado:** 5 hallazgos (`R9-444`..`R9-448`, P3), ninguno P0. Los contadores no cuentan dos veces el
> mismo capítulo ni el mismo libro, y la racha sale del registro diario; lo que falla es lo que se celebra
> (de menos, o dos veces), un contador que nadie escribe, una racha que solo se recalcula al leer o en frío, y
> las insignias guardadas por cuenta sobre un progreso que es del dispositivo.
>
> **Cómo se midió:** un agente (`fork` en worktree, sobre `f5493d4`), que solo midió, con el servicio real
> (`AchievementService` / `BadgeSystem` sobre `node:sqlite` en memoria, con un adaptador async que cede el turno
> en cada llamada). Dos sondas con `_scratch/S116-correr.cjs.txt`, re-medidas igual en el principal:
> `S121-logros.test.ts.txt` y `S121-rachaInsignias.test.ts.txt`. La copia del agente, con su informe, en
> `_scratch/S121-sondas-agente-3/`.

## El área

`src/lib/achievements/` (9 archivos, ~2,4k L; `AchievementService.ts` 1264 L) y `src/lib/badges/`
(`BadgeSystem.ts` 957 L, `BadgeTranslationHelper.ts`). Los caminos de llegada, por el lector, la pestaña
`app/(tabs)/achievements.tsx` y `app/features/badges.tsx` (solo cómo llaman a la lib). Lo ya dicho, no
re-derivado: Fable, área 29 (en vivo ✅: 39 logros del tab contra 19 insignias de la colección, dos sistemas),
su BUG-12 (los nombres de logro sin localizar en la línea de tiempo; no re-verificado: es de `A24`); `R9-27`,
`R9-30` y `R9-49` (el respaldo de los registros de lectura y de las insignias). Las pruebas que ya hay:
`achievementProgress`, `achievementServiceRestoreBackup`, `achievementSyncBackfill`, `bookCompletion`,
`chapterCompletionDedup`, `nearbyAchievements`, `nextMilestoneCard`, `rarityColors`, `specialAchievements`,
`streak`, `readingStreakDateKey`, `achievementModalTheme`.

## Hallazgos

**`R9-444` (P3): el lector desbloquea los logros de capítulo sin celebrarlos.**

- `app/(tabs)/verse/[book]/[chapter].tsx:791-794` descarta lo que devuelve `trackChapterCompleted`, y `:821-832`
  solo celebra lo que devolvió `trackVersesRead` (`:784`), que revisa los logros antes de que suba el contador
  de capítulos (`AchievementService.ts:399-417`). `first_chapter`, `chapters_10`, `chapters_50` y
  `chapters_150` nunca salen en el modal: aparecen ya desbloqueados en la pestaña. La causa está en el lector
  (fila `A13`, cerrada); el daño, aquí.
- **Repro:** leer cualquier capítulo 5 s; el primero de la vida da «Primer capítulo» sin modal.
- **Sonda:** `_scratch/S121-logros.test.ts.txt`, `capituloSilencioso` (la secuencia del temporizador, Juan 1 a
  10): desbloqueados `["chapters_10","first_chapter"]`, celebrados `[]`: rojo. Control: el servicio devuelve
  `["first_chapter"]`; lo pierde el lector.
- **Propuesta (sin escribir):** celebrar también lo que devuelve `trackChapterCompleted` (como `useAchievements`,
  `:85-89`, y la búsqueda, `app/(tabs)/search.tsx:462`).

**`R9-445` (P3): la insignia «Evangelizador Digital» (`share_master`, «Comparte 25 versos») no se puede ganar.**

- `src/lib/badges/BadgeSystem.ts:367-376` la mide con `user_stats.total_shares`; el único que lo escribe es
  `AchievementService.trackShare()` (`:696-701`), y nadie lo llama en `src/` ni en `app/` desde que se creó
  (`git log -S`: solo `0c6f5a6`). El comentario de `BadgeSystem.ts:810-817`, que lista las insignias sin
  seguimiento a propósito, no la nombra.
- **Repro:** compartir 25 versículos del día: la insignia sigue en 0/25.
- **Sonda:** `_scratch/S121-logros.test.ts.txt`, `compartirSinContar`: 25 `ShareService.shareVerse` con éxito →
  progreso 0: rojo. Control: 25 `trackShare()` → la insignia se desbloquea.
- **Propuesta (sin escribir):** llamar a `trackShare` al compartir con éxito, o declararla sin seguimiento con
  las otras 9.

**`R9-446` (P3): dos revisiones de logros a la vez celebran dos veces el mismo logro o pierden puntos.**

- `AchievementService.ts:763-786` (`unlockAchievement`) lee `is_unlocked` y escribe con un `await` en el medio;
  `addPoints` (`:789-801`) lee el total (que puede venir del caché `this.stats`) y escribe el nuevo encima.
  Nada lo serializa. Es la regla de `R9-439` en otro módulo.
- **Repro:** un resaltado (`:1533-1537`), una nota (`:1088`) o el fin de un libro (`:877`) que cae mientras
  corre la cadena del temporizador de 5 s del lector (cientos de ms en el dispositivo).
- **Sonda:** `_scratch/S121-logros.test.ts.txt`, `puntosCarrera` (desfase de 0 a 80 cesiones): 12 de 41
  desfases fallan; 10 dejan `first_verse`, `verses_10` y `first_highlight` dos veces en la cola del modal
  (`AchievementNotifications.tsx:18-20`) y 2 guardan 20 puntos de 30 (`total_points` no se recalcula nunca).
  Control, en serie: 30 de 30.
- **Propuesta (sin escribir):** serializar las revisiones (una promesa en curso que la siguiente encadena), o
  `UPDATE … WHERE is_unlocked = 0` y sumar en SQL.

**`R9-447` (P3): con la app viva de un día para otro, la «racha actual» de logros no baja.**

- `recomputeReadingStreak` (`AchievementService.ts:538-563`) corre en `initialize()` (una vez por proceso,
  `ServicesContext.tsx:103`) y en `trackVersesRead`; `getReadingStreak` (`:847`) y `getUserStats` devuelven lo
  guardado.
- **Repro:** racha de 5; el día 6 no lee; el día 7 vuelve a la app desde segundo plano: las estadísticas
  (`useAchievements.tsx:32-42`, que recarga al foco) siguen en 5 hasta leer o arrancar en frío.
- **Sonda:** `_scratch/S121-rachaInsignias.test.ts.txt`, `rachaVieja` (reloj falso):
  `{"vivo":5,"delLog":0,"enFrio":0,"longest":5}`: rojo. Control: el arranque en frío sobre la misma base da 0.
- **Propuesta (sin escribir):** recalcular en `getReadingStreak` (o al volver a primer plano).

**`R9-448` (P3): las insignias y el título equipado se guardan por cuenta, pero el progreso es del
dispositivo: otra cuenta re-celebra todas las insignias y pierde el título.**

- `app/features/badges.tsx:22` pasa `user.uid`; `BadgeSystem.ts:728-786` y `:864-925` guardan insignias y
  títulos por `user_id`, mientras el progreso sale de `user_stats`, que no distingue cuentas.
- **Repro:** «Cerrar sesión» (da un uid anónimo nuevo) o entrar con una cuenta de Google ya usada en otro
  teléfono: al abrir la colección, un toast de insignia desbloqueada (`badgeSystem.unlockedToast`) por cada
  insignia ya ganada
  (`src/screens/BadgeCollectionScreen.tsx:119-129`), y el título equipado desaparece.
- **Sonda:** `_scratch/S121-rachaInsignias.test.ts.txt`, `insigniasOtraCuenta`: con otro uid vuelven las mismas 4
  (`first_verse`, `hundred_verses`, `thousand_verses`, `week_streak`) y `equipadoB: null`: rojo. Control: con el
  mismo uid, 0. `R9-30` (las insignias que no viajan en el respaldo) es otra cosa; `R9-22`/`R9-48` (cerrados)
  no tocaban esta tabla.
- **Propuesta (sin escribir):** guardar insignias y título como el progreso (del dispositivo), o celebrar solo
  lo que cruzó su umbral en esta sesión.

## Revisado sin hallazgo

- **`trackVersesRead`:** la racha sale del registro diario por `localDayKey`; los especiales por hora no se
  duplican (`streak`, `readingStreakDateKey`, `specialAchievements`).
- **`trackChapterCompleted`:** no cuenta dos veces el mismo capítulo (`INSERT OR IGNORE`, conteo desde la tabla;
  `chapterCompletionDedup`). **`syncBookCompletion`:** idempotente, el conteo sale de `completed_books`.
- **`recomputeReadingStreak`:** `MAX`, el récord no baja (`R9-49`).
- **Los 9 logros SPECIAL** tienen quién los desbloquee (la hora de lectura, el fin de libro, profecías `:159`,
  rutas `:161`, niños `:244-249`). **`progress.ts`:** segundos a minutos, como piden los requisitos.

## No alcanzable

- `BadgeSystem.initialize` (`:77-88`) asigna `this.db` antes de crear las tablas: solo importa en la primera
  instalación, y la colección está detrás del onboarding.

## Sin medir

- **Dos toques seguidos en `equipTitle`/`unequipTitle`:** leído, no sondeado.
- **`restoreBackup` (`:1046-1264`) y los getters de los registros:** cubiertos por las pruebas y `R9-27`/`R9-49`;
  no re-recorridos.
- **9 de las 19 insignias no tienen quién las desbloquee**, declarado a propósito en `BadgeSystem.ts:810-817`:
  decisión de diseño (Fable 29 ya nota los dos sistemas).
- **Alcance sin recorrer:** `BadgeTranslationHelper`, `rarityColors`, `nearby` y los textos de `definitions`
  (filas `A24`/`A25`); el BUG-12 de Fable no se re-verificó.

## Fuera de fila

- (fila `A31`) `BadgeSystem.checkAndUnlockBadges` (`:576-618`) no tiene llamadores.
- (fila `A13`, cerrada) la causa de `R9-444` está en el lector; se anota aquí porque el daño es de logros.
