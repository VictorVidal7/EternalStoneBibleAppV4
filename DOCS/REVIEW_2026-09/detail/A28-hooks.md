# A28 — Hooks compartidos (`src/hooks/*`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 124 (2026-11-03, en el mismo chat que la
> 123; con 3 agentes a pedido de Victor) · Estado **🐛 BUG**
>
> **Resultado:** 2 hallazgos (`R9-462` y `R9-463`, P3), ninguno P0. Los 18 hooks se leyeron enteros (de
> `useTheme.tsx`, solo la lógica: la paleta es de `A25`). Lo que falla es el tiempo: los hooks de racha y de
> meta toman «hoy» solo en el foco, y el tema arranca claro y recién después lee lo guardado.
>
> **Cómo se midió:** un agente (`fork` en worktree, sobre `11fdef8`), que solo midió; sus dos sondas se
> re-midieron iguales en el principal con `_scratch/S116-correr.cjs.txt`: `S124-a1-hoyViejo.test.tsx.txt` (la
> `DevotionStreakCard` real con `useDevotionStreak` real, el foco con el mock de la 119, solo `Date` falso; y
> `usePrayerStreak` real) y `S124-a1-temaArranque.test.tsx.txt` (el `ThemeProvider` real, los fondos render a
> render). La copia del agente, con su informe, en `_scratch/S124-sondas-agente-1/`.

## El área

Los 18 archivos de `src/hooks/` (2953 L; `useTheme.tsx` 1272, casi todo paleta). Lo ya visto, no
re-derivado: `useBackHandlerStep` (`A26`, ✅), la paleta (`A25`), `useLanguage` como entrega de `t` (`A24`), el
registro de versiones de `useBibleVersion` (`R9-424`, `A14`) y su versión elegida antes del idioma (`R9-436`),
`useContextualHint` (`A21`), `useAchievements` (`A23`, `R9-447`). Las pruebas que ya hay:
`useReducedMotion` (5), `usePressScale` (5), `useContentBottomInset` (4), `useContextualHint` (7), las de los
stores de quiz y oración.

## Hallazgos

**`R9-462` (P3): con la app viva de un día para otro, las tarjetas de racha y de meta de Home muestran lo de
ayer como hecho hoy.**

- `now` se toma solo dentro del `useFocusEffect` de carga: `useDevotionStreak.ts:36`, `:45`;
  `usePrayerStreak.ts:36`, `:38-51`; `useMemoryGoal.ts:85`, `:110`; `useWeeklyChallenge.ts:44`, `:54`; y
  `useConstancyRings.ts:72-73` los compone (más su propio foco, `:82-140`). El comentario promete «today stays
  current across days» (`useDevotionStreak.ts:35`, `useMemoryGoal.ts:84`), pero ningún hook ni Home escucha
  `AppState` (solo lo hacen `MemoryDeckContext`, `AudioPlayerContext` y `sleepTimer`), y las tarjetas de Home
  (`app/(tabs)/index.tsx:1325-1353`) no llevan `key` por día.
- **Repro:** hacer el devocional de noche y dejar la app en segundo plano; a la mañana volver a Home (que sigue
  enfocada: no hay evento de foco). La tarjeta del devocional (`DevotionStreakCard.tsx:71-75`) dice «· hecho
  hoy»; los anillos de constancia (`useConstancyRings.ts:143-176`) marcan los hábitos de ayer como de hoy. Igual
  cruzando la medianoche con Home abierta. Se corrige al salir de Home y volver.
- **Sonda:** `S124-a1-hoyViejo`: el 3 de noviembre a las 21:00, «hecho hoy»; el 4 a las 08:00, con un
  re-render del padre y sin foco nuevo, `hecho: true | pendiente: false`. Control: con un foco nuevo,
  «pendiente hoy». `usePrayerStreak`: sin foco, `todayDone: true`; con foco, `false`. `useMemoryGoal`,
  `useWeeklyChallenge` y `useConstancyRings`, por lectura (el mismo patrón).
- **P3:** la tarjeta afirma algo falso de un hábito diario, y quien le cree puede cortar la racha. Hermano de
  `R9-447` (la racha de logros con la app viva), con otra raíz. **Propuesta (sin escribir):** volver a tomar
  `now` (o recargar) en `AppState` `active` y al cruzar la medianoche.

**`R9-463` (P3): en cada arranque en frío, quien usa el modo oscuro o «Alto contraste» ve primero un cuadro
blanco.**

- `ThemeProvider` (`useTheme.tsx:1106-1121`) arranca en `'light'`, `midnight` y sin alto contraste, y lee lo
  guardado en efectos (`:1137-1172`); con «Automático», el oscuro del sistema también llega en un efecto
  (`:1131-1137`). No hay `SplashScreen.preventAutoHideAsync` en `app/` ni en `src/` (ni `expo-splash-screen` en
  `package.json`); el splash es oscuro (`app.json`: `#001122`), y la primera pantalla de JS es la de carga de
  `AppContent` (`app/_layout.tsx:283-300`), con `colors.background`.
- **Repro:** cualquier arranque en frío con el modo oscuro guardado, con «Automático» y el teléfono en oscuro,
  o con «Alto contraste»: splash oscuro → pantalla de carga blanca → oscuro.
- **Sonda:** `S124-a1-temaArranque`: oscuro guardado, fondos `#ffffff`, `#ffffff`, `#0a0d1a`; automático con el
  sistema en oscuro, `#ffffff`, `#0a0d1a`; alto contraste, `#ffffff` (sin alto contraste) y `#000000`. Control:
  claro guardado, todos claros.
- **Límite:** cuántos cuadros dura el blanco se ve solo en dispositivo (Modo C). **P3** (en «Alto contraste»
  pesa más). **Propuesta (sin escribir):** sostener el splash hasta leer las preferencias, o arrancar
  `effectiveTheme` con `useColorScheme()`.

## Revisado sin hallazgo

- `usePrayerJournal.ts:59-118`: las cinco mutaciones van por la cola `writeQueue` (`prayerStore.ts:110-126`).
- `useQuizStats.ts:41-66` (el store tiene sus pruebas); `useWeeklyChallenge.ts:46-63` (un `setState` tras
  desmontar, sin daño en React 18).
- `useTheme.tsx:1124-1129`: `timeOfDay` cada 60 s, el intervalo se limpia (y con el mismo texto React no
  re-renderiza: `A29`).
- `useOnboarding.tsx`: un solo uso (`app/_layout.tsx:141`). `useReducedMotion`, `usePressScale`,
  `useContentBottomInset`: los listeners con `remove`.
- **No alcanzable:** en `usePrayerJournal`, la carga del foco no pasa por la cola (ventana de milisegundos).

## Sin medir

- `useNarratedWalkthrough.ts:182-184`: desmontar no sube `genRef`; si el usuario toca «Escuchar» y sale antes
  de que resuelva `Speech.stop()`, podría hablar con la pantalla cerrada (milisegundos). El `onDone` de una
  locución detenida con el tour activo: los eventos nativos del TTS, Pendiente (Modo C).
- `useLanguage.tsx:18-57` arranca en `'es'` antes de leer (la raíz de `R9-463`), y cruza el camino sin medir de
  `R9-439` (el arranque en frío): Pendiente. `useReducedMotion.ts:25` arranca en `false` (17 consumidores), la
  misma raíz: no se midieron uno por uno.

## Cruce con las filas vecinas

- `R9-462` y el `todayDone` de oración: la tarjeta de oración solo muestra el conteo (`PrayerCard.tsx:58-66`),
  así que miente solo tras un día entero sin orar.
- `A29` encontró que el foco de la pestaña Favoritos re-corre en bucle (`R9-464`): otra cara del
  `useFocusEffect` con una función del contexto en sus deps.
