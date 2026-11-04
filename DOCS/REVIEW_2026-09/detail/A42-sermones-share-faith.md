# A42 — Sermon-notes y share-faith

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 131 (2026-11-04, en el mismo chat que la 130,
> a pedido de Victor; en la terminal, SIN agentes) · Estado **🐛 BUG** (cerrada en la 131)

> **Resultado:** 1 hallazgo, ninguno P0: P3 `R9-528` (al volver del editor de una nota de sermón, o de un
> testimonio, con un cambio de menos de 700 ms, la lista muestra el texto viejo; el dato se guarda). Más dos notas:
> los gemelos sin audio de `R9-525` (métodos y objeciones) y, para `R9-503`, Job 38:4 medido sin defecto.

> **Cómo se midió:** en el principal, sin agentes, sobre `60cc41e`. Leído por rangos: `sermon-notes/index.tsx` 340
> L y `[id].tsx` 635 L, con `sermonNotesStore.ts` y `sermonNotes.ts`; `share-faith/` (`index.tsx` 276 L, `methods/`
> 236 + 487 L, `objections/` 237 + 431 L, `testimony/` 327 + 479 L), con `faithTestimonyStore.ts`,
> `faithTestimony.ts` y `shareFaithObjections.ts`. Sondas: `_scratch/S131-sermonLista.test.tsx.txt` (3/3) y
> `_scratch/S130-versif.cjs.txt` (Job 38). Lo ya dicho por `R9-30` (las notas de sermón y los testimonios no viajan
> en el respaldo), `R9-424` (las dos pantallas de share-faith leen `@bible_version` directo), `A22` (el compartir de
> las notas), `C56`, `sermonNotes*.test.ts`, `faithTestimony.test.ts`, `shareFaith*.test.ts` y
> `testimonyImageModal.test.tsx` no se re-derivó. Fable no tiene un área de estas pantallas.

## Hallazgos

- **`R9-528` (P3):** `sermon-notes/index.tsx:76-86` y `testimony/index.tsx:72-82` recargan en el foco con una
  lectura fuera de la cola; los editores hacen `flush` al desmontarse.
- **Nota a `R9-525`:** `share-faith/methods/[id].tsx:208-234` y `objections/[id].tsx:199-225`, la carga única de la
  versión (por lectura).
- **Medido para `R9-503`:** `shareFaithObjections.ts:138` (`Job/38/4`), el mismo versículo en los seis textos.

## Revisado sin hallazgo

- **Los editores (sermón y testimonio):** un debounce por campo (no la trampa de `R9-473`) y su `flush` al
  desmontar; las escrituras serializadas en una cola (`sermonNotesStore.ts:56-69`, `faithTestimonyStore.ts:52-69`);
  borrar y después el `flush` del desmontaje no resucita nada (`updateSession` sobre un id que no existe devuelve el
  mapa igual); varias referencias del selector entran en un solo llamado (no se pisan); vaciar la fuente se guarda;
  un título en blanco se ignora a propósito (lo fija `sermonNotes.test.ts`, «ignores a blank title patch») y la
  exportación usa `h.untitled`; la fecha de la lista y la de la exportación, por el mismo idioma.
- **Las listas:** crear con la guarda `creating` y el tope comprobado antes; los rótulos de versículos con singular
  (`verseCountOne`).
- **Testimonio, compartir:** usa el borrador visible (`draftSession`), no lo guardado.
- **Métodos y objeciones:** el libro por el idioma de la versión; el texto que falta se registra con su motivo; las
  listas y el inicio de share-faith son estáticos.

## Sin medir

- Una nota creada que falla al escribirse vuelve sin aviso (`sermon-notes/index.tsx:99-103`, `if (!created)
return`): solo con un `AsyncStorage` que falla.
- El testimonio de `R9-528`, por lectura (la misma forma; la sonda montó las notas de sermón).

**Cruce con las vecinas (§5, sesión 116):** `R9-528` es la familia de `R9-422` (`C6`, la Mesa); la nota a `R9-525`
viene de `A40`; la versificación de `R9-503`, de `A36` y `A41` (quedan `kidsStories`, `messianicProphecies` y
`cross-references`, de filas ya cerradas: su tanda). `A43` sigue.
