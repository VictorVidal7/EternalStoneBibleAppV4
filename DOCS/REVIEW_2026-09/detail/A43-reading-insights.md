# A43 — Reading insights («Mi lectura»)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 134 (2026-11-10, chat nuevo, en la terminal,
> SIN agentes, Opus 5.5 `high`) · Estado **🐛 BUG** (cerrada en la 134)

> **Resultado:** 2 hallazgos, ninguno P0: P3 `R9-531` (la tarjeta «Mi semana en la Palabra» que se comparte dice «1
> versículos oídos» y pone los números sin separador de miles; la tendencia emocional dice «+1 días», en pantalla y
> en la imagen) y P3 `R9-532` (la tira de ánimo bajo el heatmap tiene 17 columnas y el registro de ánimo guarda 84
> días: quien registra su ánimo a diario ve siempre 4 o 5 semanas «sin registro» a la izquierda).

> **Cómo se midió:** en el principal, sin agentes, sobre `bd3bfad`. Leído por rangos:
> `app/features/reading-insights/index.tsx` (1730 L), `readingInsights.ts` (326 L), `weekComparison.ts` (103 L),
> `weeklyRecap.ts` (119 L) enteros; de `src/components/insights/`, `WeeklyRecapModal` y `MoodImageModal` (los dos que
> abre esta pantalla) y, de los otros cinco sin fila previa (`Achievement`, `Challenge`, `Constancy`, `Highlights`,
> `Testimony`), los rótulos con número y el estado. `TimelineImageModal` lo cerró `A39` y `PeriodRecapModal`, `A34`.
> Por lo que la pantalla consume: `feelingsLog.ts` (las funciones de ánimo), `listeningStatsStore.ts` y los getters
> de `AchievementService.ts`. Sonda: `_scratch/S134-a43.test.tsx.txt` (5/5, salida en `_scratch/S134-a43.out.txt`).
> Lo ya dicho no se re-derivó: `R9-63` (el recap semanal en el cambio de horario; `weekComparison` lo hereda),
> `R9-465` (el lector infla versículos, tiempo y libro más leído), `R9-30` (el diario de ánimo no viaja en el
> respaldo), `R9-443` (el hueco de `useShareImage` al caer el entitlement, «sin medir» desde la 121), `R9-14` (la
> ruta web), el QA de Fable (área 44: el libro más leído en el idioma de la versión, los versos que cuentan eventos)
> y las pruebas `readingInsights`, `weekComparison`, `weeklyRecap`, `readingInsightsLocaleNumbers`, `feelingsLog`.

## Hallazgos

- **`R9-531` (P3):** `WeeklyRecapModal.tsx:81-91` (`String(n)` sin singular ni separador), con
  `translations.ts:416-418` y `:6970-6972`; `index.tsx:891-895` y `MoodImageModal.tsx:286-289` («+{{n}} días»,
  `translations.ts:335-336` y `:6893-6894`). Familia de `R9-488` y `R9-524`; los modales hermanos de la misma carpeta
  ya tienen el singular (`ChallengeImageModal.tsx:71-79`, `ConstancyImageModal.tsx:89-91`,
  `HighlightsImageModal.tsx:71-74`).
- **`R9-532` (P3):** `feelingsLog.ts:29` (`FEELINGS_RETENTION_DAYS = 84`, poda en `recordFeeling`, `:68-82`) contra
  `history.ts:31` (`HEATMAP_WEEKS = 17`, desde el Sprint 45); la tira la arma `index.tsx:187-198`. El comentario de
  `feelingsLog.ts:123-125` («retention 84d = the heatmap's 12-week window») es falso desde que se escribió (Sprint 80).
  Familia de `R9-522` (otra retención, la de devoción).

## Revisado sin hallazgo

- **El día local, en todo el modelo:** `buildReadingInsights` ancla «hoy» en `localDayKey(now)` y cuenta por la
  ETIQUETA (`readingInsights.ts:241-242`), así que la racha, la semana, la anterior y el mejor día no tienen ni el
  bug de UTC (`R9-487`) ni el del horario de verano; el heatmap guarda `dateMs` como medianoche UTC de la etiqueta y
  la pantalla lo vuelve a etiqueta con `toISOString()` (`index.tsx:189-197`): coherente. `previousWeekAnchor` corre el
  ancla con `setDate` (`weekComparison.ts:57-61`); lo que falla en el cambio de hora es `weeklyRecap` (`R9-63`).
  Las funciones de ánimo (`weekMood`, `monthMood`, `moodTrend`, `recordFeeling`) caminan con `setDate`.
- **La carga:** los getters del servicio tragan el error y devuelven `[]` (`AchievementService.ts:870-940`); la
  tarjeta de error solo llega si lanza `getUserStats` o una lectura de `AsyncStorage`. `load` depende de
  `achievementService` y de `progress`: el progreso es local, sin sync, y con esta pantalla encima solo lo escriben el
  arranque (`ReadingProgressContext.tsx:83-84`) y la señal del respaldo (`:93`), que no se alcanza desde aquí.
- **El libro más leído:** la clave del registro por libro es la canónica (`[chapter].tsx:212` →
  `trackVersesRead(…, canonicalBook)`, `:784-788`); el nombre que se muestra sigue al idioma de la versión, la misma
  convención que otras nueve pantallas (no es hallazgo).
- **«1 versículos leídos» NO es alcanzable:** el lector suma el capítulo entero (`[chapter].tsx:784-786`,
  `verses.length`), y ningún capítulo tiene un solo versículo; sí lo es «1 versículos oídos» (el contador de escucha
  suma de a uno, `AudioListeningTracker.tsx:65`).
- **La versión cambiada con la pantalla abierta:** la pantalla no lee `@bible_version` directo (no entra en la lista
  de `R9-424`) y el nombre del libro sale del hook vivo.
- **Las cifras de la pantalla:** `CountUpText` y `num` con el idioma elegido (lo fija `readingInsightsLocaleNumbers`).

## Sin medir

- El rótulo «{n} capítulos» del libro más leído por el camino de respaldo (`index.tsx:269`, `source: 'progress'`, solo
  lectores anteriores al Sprint 65): «1 capítulos», por lectura.
- La tarjeta de error pinta `ri.empty` («Aún no hay lectura registrada», `translations.ts:318`), el mismo texto que el estado vacío, y no dice que
  se toca para reintentar (`index.tsx:322-329`): solo con un `getUserStats` que lanza.
- Los modales `Achievement`, `Challenge`, `Constancy`, `Highlights` y `Testimony`, más allá de sus rótulos: sus
  pantallas son de otras filas (logros, Home, subrayados, oración y share-faith). `HighlightsImageModal.tsx:74` pone
  el total sin separador de miles (solo con 1000 subrayados o más).
- Lo que se oye con la pantalla abierta (el mini reproductor sigue sonando): la escucha no se recarga sin un cambio
  del progreso; por lectura, la cifra queda vieja hasta volver a entrar.

**Cruce con las vecinas (§5, sesión 116):** leídas las secciones «Sin medir» de `A11`, `A34`, `A39` y `A40`.
`R9-531` es la familia de `R9-488` (`A34`) y `R9-524` (`A39`). `R9-532` es la de `R9-522` (`A39`, otra poda que
esconde historia) y la hermana de un «sin medir» de `A34`: el ánimo «del año» de «Tu camino» sale de los últimos 84
días como mucho (`FEELINGS_RETENTION_DAYS`), anotado allí como diseño; aquí la misma retención deja columnas vacías
que se leen «sin registro». El «pendiente» de `A34` sobre las plantillas premium del recap al perder el premium
(`useShareImage.ts:72-77`, el hueco de `R9-443`) vale igual para `WeeklyRecapModal` y `MoodImageModal`: sigue sin
medir. `R9-63` (`A11`) sigue siendo el único defecto de día de esta carpeta. De `A39` (la línea de tiempo, que esta
pantalla abre) y de `A40` (los sentimientos), ningún «sin medir» pasa por esta pantalla. `A44` sigue.
