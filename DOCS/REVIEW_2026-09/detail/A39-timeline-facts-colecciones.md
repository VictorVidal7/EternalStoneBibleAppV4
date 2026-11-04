# A39 — Timeline, facts, colecciones, marcadores

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 129 (2026-11-04, en el mismo chat que la 128;
> con 8 agentes a pedido de Victor, 2 en esta fila y una ayuda del de `A38`) y sesión 130 (2026-11-04, en un chat
> nuevo, sin agentes: las tarjetas de imagen y el resto del render) · Estado **🐛 BUG** (cerrada en la 130)

> **Resultado:** 7 hallazgos, ninguno P0: P2 `R9-518` (al iniciar sesión en una instalación nueva, la migración de
> los marcadores duplica favoritos); P3 `R9-519` (dos toques en «Agregar a colección»), `R9-520` (la clave vieja de
> un respaldo crea un segundo favorito, gemelo de `R9-145`), `R9-521` (Datos bíblicos no sigue a la versión),
> `R9-522` (la línea de tiempo pierde el récord de racha de devoción a los 400 días), `R9-523` (citas de Datos
> bíblicos que no son literales) y, en la 130, `R9-524` (la imagen que se comparte dice «1 versículos» y «1 hitos»,
> familia de `R9-488`). Las 42 referencias de Datos bíblicos existen en los 6 textos publicados.

> **Cómo se midió:** dos agentes (relanzados como agentes nuevos tras el corte, en worktree, sobre `523e9a8`) que
> solo midieron: el 7, colecciones y marcadores (`collections/index.tsx` 271 L, `[name].tsx` 405 L,
> `src/features/collections/`, `retiredBookmarksMigration`); el 8, la línea de tiempo y Datos bíblicos
> (`timeline.tsx` 639 L, `src/features/reading-insights/timeline.ts`, `facts/index.tsx` 839 L, `bibleFacts.ts`,
> `factFavorites.ts`); el 6 (de `A38`) midió las referencias de facts. Cada sonda re-medida igual en el principal.
> Informes y sondas en `_scratch/S129-sondas-agente-{6,7,8}/`. Lo ya dicho por `R9-467`, `R9-102`, `R9-145`,
> `R9-436`, `R9-172`, `R9-30`, `A5`, `A22`, `A30`, `C56`, `__tests__/collections*.test.ts`,
> `retiredBookmarksMigration.test.ts`, `timeline.test.ts`, `bibleFacts.test.ts` y Fable (área 46, ✅; BUG-12
> cerrado) no se re-derivó.

> **La 130 (sin agentes, en el principal):** `collectionCard.ts` 80 L, `CollectionImageModal.tsx` 232 L,
> `timelineCard.ts` 66 L, `TimelineImageModal.tsx` 259 L y `timeline.tsx:255-524`. Sonda: `_scratch/S130-plurales.test.tsx.txt`.

## Hallazgos

- **`R9-518` (P2):** `app/_layout.tsx:161-175` corre la migración con la foto de Favoritos del render en que cambió
  el usuario (vacía en una instalación nueva); el original baja después por `id` y la tabla no tiene
  `UNIQUE(verse_id)`.
- **`R9-519` (P3):** `AddToCollectionSheet.tsx:84-100` arma la lista desde el render; `updateFavorite` pone el
  estado tras el `await`.
- **`R9-520` (P3):** el lector busca por `verseId` canónico y el import copia `"Juan_3_16"`.
- **`R9-521` (P3):** `facts/index.tsx:92-134`, `resolved[ref]` sin la versión.
- **`R9-522` (P3):** `timeline.tsx:139` sobre el registro de devoción podado a 400 días.
- **`R9-523` (P3):** `passover-lamb-unbroken`, `contentment-secret`, `first-last-adam`, `ararat-mountains` (con
  RV1909), `dan-to-beersheba` («unas 12 veces»: 7 en ese orden).
- **`R9-524` (P3, la 130):** `CollectionImageModal.tsx:126` y `TimelineImageModal.tsx:127` (y en pantalla
  `collections/[name].tsx:247`, `collections/index.tsx:182`) arman el rótulo sin singular.

## Revisado sin hallazgo

- **Colecciones:** las 6 funciones puras de `collections.ts`; mayúsculas y espacios (`normalizeCollectionName`);
  renombrar o borrar no existen (se derivan de las etiquetas); una colección que no existe no tumba nada; quitar
  dos veces es idempotente; `localizeBook` sigue a la versión.
- **La migración:** dos corridas a la vez las frena `migrationInFlight`; la forma del marcador coincide con el
  `BookmarksContext` borrado; un `addFavorite` que falla y borra el marcador igual es diseño afirmado por su prueba
  (`:289-314`), no un flujo de usuario.
- **La línea de tiempo:** los sellos (ms y ISO con `Z`) y `localNoon`; ids únicos; los 39 logros con nombre en los
  dos idiomas; el idioma con la pantalla abierta.
- **Datos bíblicos:** cada referencia existe en RVR1960, WEB, KJV, BSB, RV1909 y SSE1569 y ninguna cae en los
  capítulos de otra versificación (`R9-503`); Selah 71 veces, el Salmo 136 con 26 versículos de «para siempre es su
  misericordia»; el normalizador de favoritos; filtro y orden; cada tarjeta abre su versículo con `?verse=`.
- **Las tarjetas de imagen (la 130):** `collectionCard.ts` y `timelineCard.ts` son puros (el conteo total, no el
  del recorte; un título en blanco cae; topes con mínimo); los dos modales capturan por `useShareImage`, cuya guarda
  de dos toques y cuyo `catch` (aviso de error, `isSharing` de vuelta en el `finally`) ya cerró `A22`; los dos se
  muestran solo con contenido (`[name].tsx:200`, `timeline.tsx:340-360` y `:511`). El modal de la línea de tiempo se
  remonta en cada apertura (`share` a `null` al cerrar); el de colecciones queda montado (`[name].tsx:320`), así que
  la plantilla elegida sobrevive entre aperturas: el hueco de `R9-443` en `useShareImage.ts:72-77` que `A22` dejó
  «sin medir» le llega por lectura (no se re-midió: es de su tanda).
- **El render de la línea de tiempo (`timeline.tsx:380-524`):** cargando, error y vacío excluyentes; el mes por la
  fecha local (`timelineMonthKey`, `timeline.ts:297-300`) y su rótulo por el primer evento del grupo, con el feed ya
  ordenado; el compartir de una fila por pulsación larga y por la acción de accesibilidad; el tinte `accent + '1F'`
  sobre colores que en todos los temas son `#RRGGBB` (`useTheme.tsx`, `primary`/`accent`/`success`/`warning`/
  `error`).

## Sin medir

- La mezcla de idiomas en el detalle de colección y en Favoritos (`[name].tsx:296-302`, `favorites.tsx:255-260`):
  la referencia en el idioma de la versión y el texto el guardado; es el diseño de Favoritos (P3 a lo sumo, de
  Victor). `getDailyFact()` en un `useMemo([])` no cambia pasada la medianoche. Las cifras editoriales que la base no
  mide (Mar Muerto, Hermón, el siclo, 240 km, 700 años). Los planes propios no aparecen en la línea de tiempo
  (producto). El `router.push` con un libro con espacio (`[name].tsx:103-109`), ya barrido por el agente 3 de la 125.

**Cruce con las vecinas (§5, sesión 116):** `A37` comparte la familia del `replace` y de `R9-30`; `R9-520` y
`R9-145` comparten la raíz (claves pre-S58); `R9-521` es la familia de `R9-486` (Journeys); `R9-524`, la de
`R9-488` (`A34`). El registro de devoción de `R9-522` lo escriben `lectio.tsx` y la oración (`A36`), por
`recordTodayDevotion` (`devotionLogStore.ts:46`), no las pantallas de `A40`.
