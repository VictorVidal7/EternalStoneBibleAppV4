# A29 — Árbol de contexts + `ServicesContext`

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 124 (2026-11-03, en el mismo chat que la
> 123; con 3 agentes a pedido de Victor) · Estado **🐛 BUG**
>
> **Resultado:** 3 hallazgos (`R9-464` P2, `R9-465` y `R9-466` P3), ninguno P0. El orden del árbol está bien
> (toda lectura cruzada apunta a un provider de afuera) y los providers chicos están sanos. Lo que falla es la
> identidad de lo que dan dos providers: `FavoritesContext` no memoiza nada y la pestaña Favoritos relee la base
> en un bucle sin fin; el `value` de `ToastContext` es un objeto nuevo en cada render y cada aviso hace que el
> lector vuelva a contar el capítulo. Y el doble toque en un corazón (el candidato de `A15`) guarda dos filas.
>
> **Cómo se midió:** dos agentes (`fork` en worktree, sobre `11fdef8`), que solo midieron: el 2, el árbol; el
> 3, adentro de cada provider. Sus tres sondas se re-midieron iguales en el principal con
> `_scratch/S116-correr.cjs.txt`: `S124-a2-favoritosFoco.test.tsx.txt` (la pantalla real con el
> `FavoritesProvider` real, el foco como el de expo-router: re-corre al cambiar el callback,
> `expo-router/build/useFocusEffect.js:45`, `:165`), `S124-a2-toastLector.test.tsx.txt` (el lector nativo real
> con el `ToastProvider` real y temporizadores falsos) y `S124-a3-corazonDoble.test.tsx.txt` (el
> `FavoritesProvider` real sobre la base en memoria). Dos barridos (`S124-a2-depsBarrido`, 44 efectos con
> `toast` en sus deps; `S124-a2-destructBarrido`). Las copias, con los informes, en
> `_scratch/S124-sondas-agente-2/` y `_scratch/S124-sondas-agente-3/`.

## El área

`app/_layout.tsx:427-470` (los providers) y `app/_layout.web.tsx`; los 18 archivos de `src/context/` (4496 L).
Lo ya visto, no re-derivado: `AuthContext`, `MemoryDeckContext`, `PremiumContext`, `FavoritesContext` (su carga
y su `getLocal`, `R9-133`), `SyncEngineContext` y `ReadingPlanProgressContext` se revisaron a fondo en el
Modo A P0 (`A1`..`A11`); lo que queda por encima del `ErrorBoundary`, en `A12` (`R9-410`).

## Hallazgos

**`R9-464` (P2): con la pestaña Favoritos abierta, la app relee los favoritos de la base en un bucle sin fin.**

- `src/context/FavoritesContext.tsx` no tiene ni un `useCallback` ni un `useMemo`: `refreshFavorites` (`:474`)
  es una función nueva en cada render, igual que el `value` (`:478-490`). `app/(tabs)/favorites.tsx:53-61` hace
  `useFocusEffect(useCallback(…, [refreshFavorites]))`, y expo-router re-corre el efecto cuando el callback
  cambia con la pantalla enfocada. `loadFavorites` termina en `setFavorites(data)` con el arreglo nuevo de la
  base (`:262-263`): el provider re-renderiza, la función cambia, el foco re-corre, relee. Desde `59963e0`
  (2026-01-04).
- **Repro:** abrir Favoritos (el corazón de Home, o `eternalbible://favorites`) y quedarse ahí. Lecturas de
  SQLite y renders sin pausa, con un `logger.info` por vuelta; cada vuelta re-renderiza a todos los consumidores
  de `useFavorites` que siguen montados (la lista, el lector en su pestaña, el mini reproductor, Home). Batería y
  tirones; se corta al salir de la pestaña.
- **Sonda:** `S124-a2-favoritosFoco`: en 40 vueltas, la pestaña enfocada llega al tope de la sonda (301
  lecturas; sin tope, 9034 en 20,7 s, sin terminar); tras desmontar, 0. Controles: el provider solo, 1 lectura;
  la pestaña con un foco que corre solo al montar (el mock que lo tapa), 2.
- **Por lectura, sin medir:** la web monta el `FavoritesProvider` real (`_layout.web.tsx:310`); un
  `removeFavorite` durante el bucle podría hacer reaparecer la tarjeta un instante.
- **P2:** constante mientras la pestaña está abierta. **Propuesta (sin escribir):** `useCallback`/`useMemo` en
  `FavoritesContext` (como ya hacen `CustomPlans`, `Together` y `MemoryDeck`), o `[]` en el foco de la pestaña.

**`R9-465` (P3): cada aviso en el lector vuelve a contar el capítulo: los versículos leídos, el tiempo y el libro
más leído salen inflados.**

- `src/context/ToastContext.tsx:115`: `value={{show, success, error, warning, info}}`, un objeto nuevo en cada
  render (las cinco funciones sí son `useCallback`); el provider re-renderiza al mostrar un aviso (`:68-72`) y al
  ocultarlo (`:104-108`). El lector tiene `toast` en las deps de su temporizador de 5 s
  (`app/(tabs)/verse/[book]/[chapter].tsx:762-851`, deps `:842-851`): cada aviso lo re-agenda y a los 5 s llama
  otra vez a `trackVersesRead` (`:784`), que suma sin deduplicar (`AchievementService.ts:324-363`:
  `total_verses_read`, `total_reading_time`, `book_reading_log`).
- **Repro:** (a) sin tocar nada: el capítulo que completa un día de plan; el mismo temporizador muestra «Día N
  completado» (`:809`), ese aviso lo re-dispara y el capítulo se cuenta dos veces (con `markChapterRead`). (b)
  Cualquier aviso en el lector y 5 s quieto: favorito o quitarlo (`:1724-1727`), versículo copiado (`:1595`),
  nota guardada (`:1104`).
- **Sonda:** `S124-a2-toastLector`: control, 30 s sin avisos, una llamada (3 versículos); un aviso a los 6 s,
  dos (6 versículos por un capítulo de 3); el día de plan, `trackVersesRead` 2 y `markChapterRead` 2; tres
  avisos, 6 valores distintos del contexto (2 por aviso).
- **P3:** estadísticas infladas y logros por cantidad antes de tiempo; reabre la ventana de `R9-446`. `R9-444` y
  `R9-446` tocan el mismo temporizador, no su re-disparo; `detail/A13` no lo vio porque su sonda mockeaba
  `useToast` con un objeto estable. **Propuesta (sin escribir):** `useMemo` en el `value` de Toast (cubre los 44
  efectos con `toast` en sus deps), o un ref en el temporizador.

**`R9-466` (P3): un doble toque en un corazón guarda el mismo versículo dos veces, y quitarlo una vez deja el
corazón lleno.**

- `FavoritesContext.tsx:296-304` deduplica con el `favorites` del cierre, que cambia recién en `:331`, después
  de `bibleDB.addFavorite` (`:321`) y de `achievementService.trackBookmark()` (`:322-330`); no hay guarda de
  «guardando», y la tabla no lo frena: sin UNIQUE en `verse_id` (`database/index.ts:565-579`, índices
  `:735-741`) y el INSERT sin `OR IGNORE` (`:2274-2291`). Los corazones que no se deshabilitan mientras guardan:
  el del reproductor (`MiniAudioPlayer.tsx:360-380`, el candidato de `detail/A15-audio-tts.md:153-157`), las
  tarjetas de memoria (`app/features/memory/index.tsx:112-131`, `practice.tsx:160-180`), el lector
  (`[chapter].tsx:1670`, `:1701`, `:1726`) y Home (`app/(tabs)/index.tsx:1029`).
- **Repro:** dos toques rápidos en un corazón; más probable con la base ocupada (sync o respaldo escribiendo).
- **Sonda:** `S124-a3-corazonDoble` (latencias de 5 ms para el INSERT y 30 ms para `trackBookmark`): doble
  toque, 2 filas, 2 `queueWrite` (dos documentos en la nube), 2 `trackBookmark`; quitar una vez, queda 1 fila y
  `isFavorite` sigue `true`. Control: en serie, 1 fila.
- **P3:** con la base libre la ventana es de decenas de milisegundos. No suma a `R9-133` (la carga y el
  `getLocal`) ni a `R9-44` (el UNIQUE de subrayados). **Propuesta (sin escribir):** un `Set` de `verseId`
  «guardando» (o un ref espejo actualizado antes del `await`), y un índice único con `OR IGNORE`.

## Revisado sin hallazgo

- **El orden nativo** (`_layout.tsx:427-470`): toda lectura cruzada apunta a un provider de afuera (BibleVersion
  y Auth leen Language; SyncEngine, Auth; Favorites, Services y SyncEngineOptional; MemoryDeck,
  SyncEngineOptional; Audio, BibleVersionOptional y PremiumOptional; OfferingSheet y DonationSheet dibujan con
  Language, Premium, Theme y Toast). El audio espera `premiumLoading` antes de recortar la velocidad
  (`AudioPlayerContext.tsx:795-809`).
- **El árbol web:** 11 providers; los que faltaban eran `R9-14`, arreglado en la 12. Los cuatro `.web.tsx`
  tipan su `value` con el tipo nativo (tsc garantiza las claves); los exports solo difieren en tipos
  (`S124-a2-exports.cjs.txt`).
- **Las cascadas:** `ThemeProvider` hace un tic cada 60 s, pero con el mismo texto React no re-renderiza;
  `RootLayout` no tiene estado. Los otros efectos con `toast` en sus deps están protegidos o convergen
  (`[chapter].tsx:1432` por `followHandledRef`, `MiniAudioPlayer.tsx:309` por `spainPromptFiredRef`,
  `plan-builder:137` por `prefilled`, `ColorThemeSettings:66` en una vuelta); los demás `value` sin `useMemo`
  no tienen un consumidor con daño.
- **Adentro de los providers chicos:** `ServicesContext.tsx:76-138` (un solo `try`; si falla, `initialized`
  queda en `false`, pero solo crea tablas `IF NOT EXISTS`, y `migrateCanonicalBookKeys` tiene su `try` no
  fatal: solo con la base rota, `A12`); `ToastContext.tsx:49-113` (un aviso a la vez, gana el último, a
  propósito; `handleDismiss` ignora el cierre de una instancia vieja); `OfferingSheetContext` y
  `DonationSheetContext` (abrir dos veces da una hoja; encima de otro `Modal`, medido en `C15`);
  `ReaderPreferencesContext.tsx:139-203` (hidrata sobre los defaults, persiste tras hidratar, re-hidrata con el
  respaldo, `R9-28`); `TogetherContext.tsx:39-90` y `CustomPlansContext.tsx:32-90` (una escritura antes de la
  carga no es alcanzable; `@custom_plans` fuera del respaldo ya está en `BUGS.md`);
  `AccessibilityPreferencesContext` (un booleano); `ReadingProgressContext` (`A11`).

## Sin medir

- Un favorito agregado antes de que `ServicesProvider` publique `achievementService`
  (`FavoritesContext.tsx:322`) no suma al contador: el patrón `achievementService?.track…` es de toda la app.
- El cambio de cuenta en los providers locales (`CustomPlans`, `Together`, preferencias): son del dispositivo,
  no de la cuenta, a propósito; sin una especificación que diga otra cosa, no es hallazgo.
- Cuántos consumidores re-renderizan por vuelta de `R9-464`, y el bucle en web. Si el re-conteo del día de plan
  de `R9-465` vuelve a celebrar algo (`R9-446` mide la carrera).

## Cruce con las filas vecinas

- `R9-464` y `R9-465` son la misma clase: una función o un objeto del contexto sin memoizar en las deps de un
  efecto de consumidor. En las sondas, un mock de contexto ESTABLE (la regla de la 116) los tapa: el de `A13`
  tapó `R9-465`, y un foco que corre solo al montar tapa `R9-464`.
- `R9-466` cierra el candidato de `detail/A15` (el corazón del reproductor): es de todos los corazones.
