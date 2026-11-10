# A44 — Comparación de versiones

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 134 (2026-11-10, chat nuevo, en la terminal,
> SIN agentes, Opus 5.5 `high`) · Estado **🐛 BUG** (cerrada en la 134)

> **Resultado:** 3 hallazgos, ninguno P0: P2 `R9-533` (abrir una comparación guardada de otro pasaje muestra el
> versículo con el mismo número en el capítulo que está abierto: «Rom 8:28» desde Juan 3 da Juan 3:28), P3 `R9-534`
> (si el versículo nuevo queda con menos de dos versiones, la tarjeta de análisis sigue mostrando la del anterior) y
> P3 `R9-535` (la comparación alinea las versiones por número: con RV1909 en Jonás 2:1 pone el pez al lado de la
> oración, y donde a una versión le falta el número la nota dice «omitido en el texto crítico»).

> **Cómo se midió:** en el principal, sin agentes, sobre `bd3bfad`. Leído por rangos:
> `src/screens/VersionComparisonScreen.tsx` (2141 L: estado y efectos `:80-232`, carga `:385-470`, guardar y cargar
> lo guardado `:474-598`, la lista `:1300-1410`, el render de una y de varias `:745-1000`),
> `src/lib/comparison/VersionComparison.ts` (578 L) entero y `app/features/version-comparison.tsx`; de paso,
> `comparisonCard.ts` y los rótulos de `CompareImageModal.tsx`. Las entradas: Inicio (`(tabs)/index.tsx:995-1004`
> y `:1949`, esta sin parámetros: Juan 3:16), el lector (`[chapter].tsx:3209-3217`, `:3335-3346`). Sondas:
> `_scratch/S134-comparar.test.tsx.txt` (5/5, la pantalla y el servicio reales sobre `node:sqlite` con la semilla y
> los packs publicados, salida en `_scratch/S134-comparar.out.txt`) y `_scratch/S130-versif.cjs.txt` sobre los 4
> packs de Pages bajados a `%TEMP%/S134-packs` por `_scratch/S134-packs.cjs.txt` (sha de `packs/versions.json`
> `232bdf30…`; los cuatro coinciden con el manifiesto). Lo ya dicho no se re-derivó: `R9-453` (la pantalla mezcla
> idiomas en tres sitios), `R9-30` (`saved_comparisons` no viaja en el respaldo), `R9-14` (la ruta web), `R9-503` (la
> versificación de RV1909 en referencias fijas), `A25` (colores sin recorrer en `:620-622` y `:1406`), el QA de
> Fable (área 53) y las pruebas `comparisonCard`, `versionList`, `SaveComparisonDialog`,
> `versionComparisonScreenA11y`.

## Hallazgos

- **`R9-533` (P2):** `handleLoadComparison` (`VersionComparisonScreen.tsx:528-598`) restaura las versiones y los
  versículos, no `comp.book` ni `comp.chapter`; `book` y `chapter` son props de la ruta (`:73-75`).
- **`R9-534` (P3):** `loadComparison` (`:427-441`) pone `analysis` solo si hay dos versiones o más, y nunca la
  limpia; la tarjeta se pinta con `analysis &&` (`:1003-1006`) y el resaltado usa sus `commonWords` (`:975`).
- **`R9-535` (P3):** `compareVerse` (`VersionComparison.ts:265-337`) busca el mismo capítulo y versículo en cada
  versión y descarta en silencio la que no tiene fila (`:326-328`); la nota (`:259-288`, `translations.ts:5207-5208`)
  atribuye toda ausencia al texto crítico. Familia de `R9-503`.

## Revisado sin hallazgo

- **El libro:** `compareVerse` busca el `book_id` por el nombre en cualquier versión (`:276-290`), así que «Juan» y
  «John» llegan al mismo libro; la referencia de la cabecera se localiza por el idioma de la UI (`:634-640`).
- **El conteo del capítulo y el recorte del versículo** (`:190-218`): se cancela al cambiar, recorta un versículo de
  un enlace que pasa el final.
- **La `key` de la ruta** (`version-comparison.tsx:36`): un enlace con otro pasaje remonta; con el mismo, no hace
  falta. La lista de guardadas se pide con el `userId` vivo al abrirla (`:695`).
- **Dos cargas seguidas** (flechas rápidas): cada `compareVerse` encadena sus consultas en una sola conexión, en
  orden; la última en empezar termina última (por lectura).
- **Guardar y editar:** el nombre en blanco se rechaza; el diálogo de edición recibe el nombre y las notas
  guardadas (lo fija `SaveComparisonDialog.test.tsx`).
- **La versión cambiada con la pantalla abierta:** la pantalla no usa la versión del lector ni lee `@bible_version`
  (no entra en la lista de `R9-424`).
- **Las versiones de la semilla y de los packs:** las dos de la semilla (RVR1960, WEB) y las descargadas, que
  `pack-import.ts:61-62` mete en la misma tabla `verses`, son las que ofrece el selector (`:237-260`).

## Sin medir

- **Nota a `R9-453` (por lectura):** la comparación arranca siempre con RVR1960 sola (`:86-88`), sin mirar la versión
  del lector ni el idioma de la UI; con la UI en inglés, abrir «Comparar» desde KJV muestra primero el texto en
  español.
- Con una versión ausente, los colores de las tarjetas siguen la posición en `comp.versions` (`:617-626`, `:835-848`)
  y no la del selector (`:745`): la siguiente toma el color de la que falta.
- La lista de guardadas pinta `comp.book` tal como llegó por la ruta (`:1343`), en el idioma que traía el enlace.
- El modo de varios versículos, por lectura: guardar ordena `selectedVerses` en el lugar (`:494`, y `:735`); el resto de sus
  caminos no se montó.
- `CompareImageModal`, más allá de los rótulos; un `chapter` no numérico por un enlace (`version-comparison.tsx:15`,
  `NaN`).

**Cruce con las vecinas (§5, sesión 116):** leídas las secciones «Sin medir» de `A24`, `A32`, `A36` y `A40`.
`R9-535` es la familia de `R9-503` (`A36`, `A41`, `A42`; los cuatro «sin medir» de `A36` son referencias fijas, no
esta pantalla) y de la versificación entre el que manda y el que recibe un devocional (`A40`, en el Pendiente de
Victor). La Mesa compara un pasaje entero con el mismo servicio (`prep/index.tsx:790-803`, `compareVerseRange`),
por lectura el mismo defecto; `A32` midió de la Mesa solo «Comparar versiones» al volver de Ajustes (`R9-480`), no la
versificación: queda para su tanda. De `A24`, el `bookLang` de ~25 pantallas (sin decidir) no toca la comparación,
que localiza la cabecera por la UI. `R9-534` y `R9-535` se ven juntos en Jonás 1:17. De `A43` no queda nada que pase
por aquí. `A45` sigue.
