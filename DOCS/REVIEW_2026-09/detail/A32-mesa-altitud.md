# A32 — Mesa de preparación: altitud (`app/features/prep/index.tsx`)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 126 (2026-11-03, en el mismo chat que la
> 125; con 2 agentes a pedido de Victor) · Estado **🐛 EN CURSO**

> **Resultado:** 2 hallazgos (`R9-473` P2, `R9-474` P3), ninguno P0. Lo que escribe la Mesa está bien guardado
> salvo un caso: el debounce es UNO para todas las secciones, y la barra de formato de otra tarjeta reemplaza el
> guardado pendiente de la primera (`R9-473`). Los botones que guardan antes de navegar no se bloquean
> (`R9-474`). **Sigue EN CURSO:** de lo que la Mesa solo presenta, queda sin recorrer el render de la tabla,
> `prepTopicSuggest`/`themes`, `describeMorphology`/`pickGloss` por idioma y un libro sin originales, y queda
> sin medir un candidato fuerte (los originales del pasaje viejo tras una descarga, abajo).

> **Cómo se midió:** dos agentes (`fork` en worktree, sobre `c634007`) que solo midieron: el 1, la pantalla y lo
> que escribe; el 2, lo que solo presenta (corto) más `A33`. Las sondas de los hallazgos se re-midieron iguales en
> el principal con `_scratch/S116-correr.cjs.txt`: `S126-a1-debounceCompartido.test.tsx.txt` (la Mesa real con el
> `PremiumProvider` real y el debounce real) y el bloque «púlpito» de `S126-a1-originalesYDoblePush.test.tsx.txt`.
> Los informes y las sondas, en `_scratch/S126-sondas-agente-{1,2}/`. Lo ya dicho por `A9`, `C6`, `C16` y el campo
> de Victor no se re-derivó. El Pendiente de la Mesa (`prepAccount`, `backupPrepTurn`, `R9-330`, `R9-327`) no se
> tocó.

## Hallazgos

- **`R9-473` (P2):** `index.tsx:1071-1081`, un `useDebouncedCallback` para todas las secciones: escribir en A,
  tocar la barra de formato de B antes de 700 ms (no quita el foco: `keyboardShouldPersistTaps="handled"`,
  `:1827`) y salir sin `blur` pierde lo escrito en A; el `flush()` de `:1089` empuja solo B. Familia de `R9-58`.
- **`R9-474` (P3):** `handleOpenPulpit` (`:1028-1058`) guarda y resuelve la versión antes del `router.push`, sin
  bloquear el botón: dos toques, dos púlpitos. `handleOpenIllustrations` (`:1008-1023`), la misma forma.

## Revisado sin hallazgo

- Las dos guardas de `R9-47` están en `flushDrafts`, en el `blur` y en `handleNoteChange`; la plantilla viaja en
  cada guardado.
- Copiar el bosquejo, el PDF y compartir el estudio leen `drafts` (el estado, con lo recién escrito), no el store;
  el PDF tiene la guarda `isExportingPdf`. El enlace de estudio no lleva la plantilla, pero el receptor recorre
  todas las secciones de todas las plantillas.
- La autoevaluación escribe solo la pregunta tocada, con el store serializado. El selector de plantilla solo
  aparece con la entrada vacía. El `setParams` de «buscar por tema»: el debounce pendiente lleva su propia clave.
  Insertar una ilustración sin plantilla no hace daño (`application` está en las 4 plantillas).
- `load()` (`:490-648`) tiene su guarda `isStale` (`:497-498`); el foco (`:663-689`) tiene su `cancelled`;
  `loadCompareVersions` no depende del pasaje, a propósito.
- **No alcanzable:** el stepper con un debounce pendiente (está arriba de todo; entre el último tecleo y el
  siguiente pasan más de 700 ms); volver de un salto a versículo en menos de 700 ms; exportar en el hueco de la
  carga (la ventana de `R9-168`); que cambie `isPremium` mientras se escribe (el segundo disparador de `R9-47`).

## Sin medir

- **Candidato fuerte (P2 si se mide), el patrón de `R9-435` en la Mesa:** `handleDownloadOriginals`
  (`:823-834`) llama, al terminar la descarga, al `loadOriginalWords` del render en que se tocó «Descargar», con
  el pasaje de entonces (`:695-739`), sin la guarda `isStale` de `load()`. Camino: premium sin el pack →
  «Descargar» → mover el rango (`:892`) o cambiar de pasaje (`:925-945`) → al terminar, las palabras del pasaje
  viejo bajo el nuevo. `loadOriginalWords` (`:741-743`) y `loadCompareRows` (`:793-821`), la misma raíz. Las dos
  pruebas de `S126-a1-originalesYDoblePush` que lo buscan caen por el montaje (la Mesa se queda en el spinner de
  originales y el botón «Descargar» no aparece), también su control: no miden nada todavía.
- Sin recorrer, de lo que solo presenta: el render de la tabla, `prepTopicSuggest`/`themes`,
  `describeMorphology`/`pickGloss` por idioma, un libro sin originales.
- Doble toque en una fila de `PrepExportFormatSheet` (`:1298-1322`, sin guarda; depende de si el `Modal` que se
  cierra recibe toques: dispositivo). Doble toque en una ilustración en modo insertar (dos `router.back()`, quizá
  texto duplicado). Dos toques en «Compartir estudio» (dos hojas, cosmético).
- «Buscar por tema»: el atrás del sistema sale de la Mesa en vez de volver al pasaje (P3, familia de `R9-459`;
  con `renderRouter`).
- Al volver de Ajustes tras descargar una versión, «Comparar versiones» no recarga (`loadCompareVersions` no
  depende del foco).

## Cruce con las filas vecinas

- `A9` (Mesa, persistencia): `R9-473` es un camino de salida que esa auditoría no vio (cruzado entre secciones).
- `A26` (navegación): `R9-474` es el primer doble `push` registrado; los botones que esperan un `await` antes de
  navegar son candidatos en otras pantallas.
- `A33`: el candidato de los originales es el patrón de `R9-435` (la hoja de originales que queda montada).
