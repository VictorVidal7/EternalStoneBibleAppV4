# A41 — Teología y diccionario

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 131 (2026-11-04, en el mismo chat que la 130,
> a pedido de Victor; en la terminal, SIN agentes) · Estado **🐛 BUG** (cerrada en la 131)

> **Resultado:** 1 hallazgo, ninguno P0: P3 `R9-527` (la cita del Salmo 90:2 en inglés, en «Eternidad», no es la
> de ninguna versión que trae la app). Y una medición de lo que `R9-503` dejó sin medir: «La Trinidad» abre
> 2 Co 13:14, que en RV1909 no existe (la bendición es el 13:13).

> **Cómo se midió:** en el principal, sin agentes, sobre `60cc41e`. Leído por rangos: `theology/index.tsx` 370 L,
> `dictionary/index.tsx` 396 L y `dictionary/[slug].tsx` 941 L, con `theology.ts` (202 L), los textos de
> `translations.ts` (`theology`, ES `:3241-3360`, EN `:9791-9910`) y `dictionary.ts`. Sondas:
> `_scratch/S131-citasTeologia.cjs.txt` (las citas, contra la base y los 4 packs de Pages) y
> `_scratch/S130-versif.cjs.txt` (2 Co 13 en cada texto). Lo ya dicho por `A6`/`R9-13` (la hoja de lectura en web,
> arreglado), `A24` (el diccionario es contenido en español por diseño), `A30`, `A31` (`getTheologyEntryById` sin
> uso), `C56` (el gating del artículo y las posturas), `theology.test.ts`, `dictionaryMultiviewScreen.test.tsx` y
> `ReaderPreferencesSheetDictionaryContext.test.tsx` no se re-derivó. Fable no tiene un área de estas pantallas.

## Hallazgos

- **`R9-527` (P3):** `translations.ts:9828`, la cita de Sal 90:2 en EN, ni KJV, ni WEB, ni BSB.
- **Medido para `R9-503`:** `theology.ts:51` (`2 Corinthians/13/14`): en RV1909, 13 versículos; el lector abre el
  capítulo arriba sin resaltar (`theology/index.tsx:83-96`, `[chapter].tsx:968-995`).

## Revisado sin hallazgo

- **Teología:** contenido estático; solo las entradas publicadas (`getPublishedTheologyEntries`, sin `draft`);
  cada `passage` visible (ES y EN) empieza en el versículo de `refs[0]`, el que abre «Abrir en el lector»
  (Lamentaciones 3:22-23 abre el 23, el de la fidelidad); el libro por el idioma de la interfaz solo para la ruta (el
  lector acepta los dos); las 22 citas en español, literales en RVR1960; en inglés, literales en WEB salvo `R9-527`.
- **El diccionario, la lista:** la carga con `cancelled`; el filtro sobre `headword_es` + `gloss_es` ordenado por
  `localeCompare('es')`; el `slug` viene de la base.
- **El diccionario, la entrada:** un `slug` desconocido o ausente cae en «desconocido»; el artículo y las posturas
  tras `isPremium`, calculado en el render (perder el entitlement con la pantalla abierta los oculta); «Ver
  también» en el orden del mapa, sin los que no existen; las citas del texto abren el lector con `push` (el atrás
  vuelve a la entrada); claves de las listas por posición en contenido estático.

## Sin medir

- Las citas en línea del diccionario que caen en los 16 capítulos de otra versificación (`R9-503`): con RV1909,
  SSE1569 o WEB (Ro 16) abren otro versículo o ninguno. El mecanismo es el de `R9-503`; no se contaron.
- Una carga de la entrada que termina tras salir de la pantalla (sin bandera de cancelación,
  `dictionary/[slug].tsx:256-302`): sin daño (cada `slug` es una pantalla nueva en la pila).

**Cruce con las vecinas (§5, sesión 116):** `R9-527` es la familia de `R9-523` (Datos bíblicos, `A39`) y de
`R9-505` (la cita NIV de la oración, `A36`): las tres son texto que decide Victor. La versificación de
`theology.ts:51` era uno de los seis «sin medir» de `R9-503`; quedan cinco (`kidsStories`, `messianicProphecies`,
`cross-references`, `shareFaithObjections`), el último de `A42`.
