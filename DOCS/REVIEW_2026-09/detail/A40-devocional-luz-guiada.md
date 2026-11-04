# A40 — Devocional, Daily Light, guiada, sentimientos, temas

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 130 (2026-11-04, en un chat nuevo, en la
> terminal, SIN agentes: lo pidió Victor) · Estado **🐛 BUG** (cerrada en la 130)

> **Resultado:** 2 hallazgos, ninguno P0, más una suma y una corrección: P3 `R9-525` (con la versión cambiada con
> la pantalla abierta, un tema o un sentimiento siguen en la vieja y «Escuchar» los lee con la voz de la nueva) y
> P3 `R9-526` (el devocional que se recibe nombra el libro en el idioma de la interfaz). Suma a `R9-524` («1 días»
> en «Mis devocionales»). Corrección de `R9-424`: las pantallas que leen `@bible_version` directo son siete, no
> seis (también `themes/[theme].tsx:196`).

> **Cómo se midió:** en el principal, sin agentes, sobre `10be92f`. Leído por rangos: `devotional/index.tsx` 864
> L, `devotional-shared/index.tsx` 470 L, `daily-light/index.tsx` 788 L, `guided.tsx` 528 L, `feelings/` (235 +
> 542 L) y `themes/` (232 + 471 L), con sus datos (`feelings.ts`, `themes.ts`, `daily-verses.ts`,
> `christConnections.ts`). Sondas: `_scratch/S130-versionAbierta.test.tsx.txt` (5/5) y
> `_scratch/S130-versif.cjs.txt` (los 4 packs de Pages, sha del `versions.json` verificado, y la base sembrada).
> Lo ya dicho por `R9-511` (el devocional recortado y el borrador borrado), `R9-461` (el `d` repetido), `R9-452`
> (las fechas con mayúsculas), `R9-424` (las pantallas que leen `@bible_version`), `A26` (el atrás sin guarda de
> `devotional-shared` y el `resolving` de la guiada), `A36` (lectio desde la guiada, con `replace`),
> `devotionalDraft.test.ts`, `dailyLight.test.ts`, `feelings*.test.ts(x)`, `themes.test.ts`,
> `guidedDevotionNav.test.tsx` y Fable (áreas 31 y 49) no se re-derivó.

## Hallazgos

- **`R9-525` (P3):** `themes/[theme].tsx:189-215` y `feelings/[feeling].tsx:158-184` cargan una vez con
  `@bible_version`; «Escuchar» (`:249`, `:230`) encola sin `language` y el motor narra con la versión viva
  (`AudioPlayerContext.tsx:1096`). La Luz diaria, el mismo `load` de montaje (`daily-light/index.tsx:117-254`), por
  lectura.
- **`R9-526` (P3):** `devotional-shared/index.tsx:115-124` nombra por `language`; el constructor
  (`devotional/index.tsx:95-96`) y `study-shared` (`:133`), por la versión.
- **Suma a `R9-524`:** `devotional/index.tsx:395-400` («1 días · Comienza el…»).
- **Corrección de `R9-424`:** `themes/[theme].tsx:196` es la séptima pantalla que lee `@bible_version` directo.

## Revisado sin hallazgo

- **El constructor (`devotional/index.tsx`):** la carga del borrador con `alive`; el guardado diferido detrás de
  `draftLoaded` y su `flush` al desmontar; el borrador viejo sube su fecha a hoy al leerse (`devotionalDraft.ts:
107-108`); el tope de versículos por capítulo con `alive` y la versión en las dependencias; el paso atrás del
  selector (`closeOrStepBack`); las notas controladas (`value`), así que quitar un día no corre las notas; el tope de
  días; «Volver a enviar» re-ordena sin duplicar (`addSavedDevotional`, por contenido).
- **El devocional recibido (`devotional-shared`):** el día de hoy por fecha local con `Math.round` (sin el salto del
  horario de verano); próximo/terminado acotados; el texto sigue a la versión cambiada (la versión en las
  dependencias del efecto, con `active`); el versículo que falta en la versión del que recibe muestra «…».
- **La Luz diaria:** el día por fecha local (`buildDailyLight`, la forma buena de `R9-172`); el tema sigue al
  versículo; la clave de memoria por el nombre canónico (no la familia de `R9-475`); el BUG-9 de Fable, cerrado
  (`:307-314`, solo la primera letra); el idioma del contenido por la versión (`christLangForVersion`, que mira el
  catálogo, no una lista a mano).
- **La guiada:** las emociones deshabilitadas mientras resuelve (`guided.tsx:238`), así que dos toques no cruzan
  dos versículos; el nombre del libro por la versión; el error si falta el texto.
- **Temas y sentimientos:** las dos listas son estáticas; el detalle con un id desconocido (o un arreglo, la forma
  de `R9-461`) cae en «desconocido» sin tumbar nada; el nombre del libro por la versión; el registro del
  sentimiento del día, uno por día local.
- **La versificación de los datos curados (`R9-503`):** de los versículos de la Luz diaria, los cumplimientos de
  «Cristo en este pasaje», los temas y los sentimientos, solo `Psalms/13/1` (sentimiento «Duda») cae en uno de los
  16 capítulos con otra versificación (SSE1569, Sal 13), y ahí es el mismo versículo en las seis versiones
  publicadas: SSE1569 difiere al final del salmo (5 versículos contra 6). Sonda: `S130-versif.cjs.txt`.

## Sin medir

- **El cambio de día con la pantalla abierta:** la Luz diaria carga una vez (y su fecha de encabezado se recalcula
  en cada render: tras la medianoche, un render la pone en el día nuevo sobre el versículo viejo); el «hoy» del
  devocional recibido está en un `useMemo([bundle])`. La familia de `getDailyFact()` en `useMemo([])` que `A39`
  dejó sin medir. P3 a lo sumo.
- La tarjeta «Una oración breve» de los sentimientos (`[feeling].tsx:325-345`) sigue: Fable (área 31) la anotó como
  criterio pastoral, no como bug; es de Victor.
- La versificación entre el que manda y el que recibe un devocional (en el Pendiente de Victor, familia de
  `R9-503`), y el atrás a mitad de `resolving` de la guiada (`A26`): no se re-midieron.
- Por lectura, la Luz diaria guarda en «Memorizar» el texto de la carga con la versión leída al tocar
  (`daily-light/index.tsx:273-285`): tras un cambio de versión no coinciden, pero la tarjeta no muestra su versión.

**Cruce con las vecinas (§5, sesión 116):** con `A39`, el cambio de día con la pantalla abierta (`getDailyFact`) y
los rótulos sin singular (`R9-524`); `R9-525` es la familia de `R9-521` (Datos bíblicos) y de `R9-486` (Journeys) y
el síntoma de `R9-423`; `R9-526` es la de `R9-475` (el idioma de un nombre visible). Con `A36`, la guiada entra a
lectio con `replace` (medido allí). `A41` (teología y diccionario) sigue.
