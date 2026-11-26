# Sesión 188 — revisión del diff de la 187 y la 187b (tanda P2 3), con emulador (cortada)

Opus 5.5 principal, Fable de asesor, sin agentes. `main` = `origin/main` = `5656f055` (Victor mergeó
`docs/review-s187c`). Un AVD (`Pixel_9_Pro`, `-read-only`, `pm clear`: cuenta anónima nueva, sin la de Victor), APK
debug vc73 (nada nativo cambió desde `b01ce3d7`), Metro desde `main`. **Cortada a ~90 llamadas**: el paso 1 está
hecho; del paso 2 solo el devocional, a medias. Sigue la 188b (`_scratch/S188b-CIERRE-PROMPT.md`).

## 1. El diff (`b01ce3d7..e4289cb2`, solo el código), leído entero

Nueve archivos de producción y seis pruebas. Quién consume cada valor que cambió, y lo que el diff abre:

- **`R9-415`** (`highlights.tsx`): el `try`/`catch` es correcto. **Pero el toast sale con el editor abierto, y el
  editor es un `Modal` nativo sin `<ToastHost />`** (`highlights.tsx:568`; ningún `ToastHost` en el archivo). Por
  el mecanismo de `R9-560` (medido en vivo en «Datos»), el toast se dibuja en la ventana principal, detrás del
  editor: el usuario ve que «Guardar» no hace nada, y la única salida, Cancelar, pierde lo escrito, que es el daño
  de `R9-415`. **Por lectura, sin medir en vivo** (provocar el borrado de la fila con el editor abierto no cupo).
  No es un hallazgo nuevo: `(tabs)/highlights` ya está en la lista de `R9-637` (P3, lote D, A(2)). La 188b lo mide
  y, si se confirma, decide entre reabrir `R9-415` (su arreglo no llega al usuario) o subir la línea de
  `highlights` de `R9-637` delante del lote. Además el texto `saveError` va por el toast de dos líneas
  (la clase de `R9-638`), sin medir a escala 2,0.
- **`R9-497`** (`prayer/index.tsx`): `requestReopen` confirma solo si `answeredNote` no está vacío; `ConfirmDialog`
  destructivo. Sin vecinos nuevos.
- **`R9-473`** (`prep/index.tsx`): `pendingSaveKeyRef` tiene un solo escritor (`handleNoteChange`); el otro
  consumidor del debounce es el `cancel()` de la restauración (`R9-602`, `:1135`), y tras un `cancel()`
  `isPending()` es falso: la clave vieja no hace nada. El `flush()` al desmontar, igual.
- **`R9-518`** (`retiredBookmarksMigration.ts`): el envoltorio propio (`src/lib/sync/firestore.ts`) expone
  `where(…, 'in', …)` (`buildQuery`) y conserva `metadata.fromCache` (`wrapQuerySnapshot`, `R9-126`); el
  `verseId` de la consulta tiene el formato del que sube `favoriteToRemote` (`canonicalBookName_cap_vers`); la
  lápida de borrado es `deleted: true` (`SyncEngine.ts:178`), y la consulta la salta. El `return` sin marcar pasa
  por el `finally` que suelta `migrationInFlight`. El falso de la prueba es una factoría literal, con la forma del
  SDK (`metadata.fromCache`). Lo nativo (que `getDocs` sin red dé `fromCache`) no es medible en jest.
  **Para la medición en vivo, por lectura:** en una instalación nueva sin red, el `get()` de
  `users/{uid}/bookmarks` cae a la caché vacía, `toMigrate` queda vacío, la consulta de favoritos no corre y la
  bandera queda en `done:<uid>`: lo que se vería es `R9-639`, no la guarda de `R9-518`.
- **`R9-498`** (`[passageId].tsx`, `prayer.ts`): los títulos del paseo vienen de `t.scripturePrayer.passages`
  (cortos; con « (n/N)» lejos de `PRAYER_TITLE_MAX` = 120). **El orden, por lectura:** `addRequest` antepone y
  `activeRequests` ordena por `createdAt` descendente, así que con o sin empate «(2/2)» queda ARRIBA de «(1/2)».
  Sin medir en vivo (la 188b; si se confirma, triaje: no pierde nada y los títulos llevan el número).
  `mutatePrayerRequests` no rechaza nunca (traga el error y devuelve la lista guardada): con el almacenamiento
  fallando, una parte puede no guardarse y la pantalla dice «Guardado». De antes del diff (con una sola entrada
  pasaba igual): una línea, sin entrada (regla 3).
- **`R9-511`** (`devotional/index.tsx`, `bundle.ts`): `calNotesDropped` cuenta también las notas de días con
  referencia inválida o más allá de `MAX_CAL_DAYS`; ninguno de los dos se alcanza desde la pantalla
  (`isValidDraftDay` filtra el borrador; «Añadir día» se apaga en `MAX_CAL_DAYS`). `maxLength` usa largos crudos
  (≥ saneados): conservador. Ojo con el mensaje de la 188: la caja 43 de 42 × 280 + 240 tiene `maxLength` 240, no
  0; el 0 es el de una caja 44 vacía.

## 2. En vivo (parte)

- **`R9-511`, 50 × 280 sembrado** (`_scratch/S188-sembrar.cjs.txt` en `RKStorage`, por `S177-vivo.sh.txt`):
  «Share devotional» → toast rojo, en inglés a escala 1,0 entero en tres líneas («Your notes are 2000 characters
  over the 12,000 limit. Shorten some to share; your draft is still here.»), sin hoja del sistema. En disco
  después: el borrador sigue (50 días, 14 000), `@devotional_saved` nulo. El toast se monta sobre la barra de
  estado (ya anotado en `R9-638`).
- **Teclear en una caja llena** (la 50, `maxLength` = su largo, 280): «XYZ» no entra; en disco sigue en 280. El
  piso del `maxLength` no recortó nada al restaurar el borrador ya pasado.
- **42 × 280 + 240 + un día 44 vacío:** teclear «hola» en la caja 44 (`maxLength` 0) no entra (sigue el
  placeholder): **0 bloquea, no se lee como «sin límite»**. Teclear «Q» al final de la caja 43 (`maxLength` 240):
  en disco sigue en 240.
- **Pegar: sin medir.** `input keycombination` (Ctrl+A, Ctrl+C, Ctrl+V) no pegó; tras la secuencia la caja 43
  mostró una «g» al principio (el volcado corta a 80 caracteres, así que no se ve si cayó otra al final), y el
  disco, leído tras un `force-stop`, siguió en 12 000 justos (el autoguardado pudo no llegar). A repetir en la
  188b con una captura y sin `force-stop` antes de leer.

## 3. La prueba que cayó una vez en la 187c (`prepTableScreenPassageKeying`)

Cinco corridas de las 37 suites de prep juntas (630 pruebas), con `24606b9c`: 5 de 5 verdes. No se reproduce, así
que la corrida sin el arreglo no discrimina y no se hizo. Una línea: sin causa atribuible al `flush()` de `R9-473`.

## 4. Conteo

Sin cambios: 177 abiertos de 640 (1 P1, 73 P2, 102 P3 y el aviso). Ni entradas nuevas ni marcas.

## 5. Sigue: la 188b

En vivo: pegar en la caja 44 y la «g» de la caja 43; el aviso del devocional a escala 2,0 y en español; el paseo
del Salmo 102 (el orden en disco y en pantalla); «Reabrir» con y sin testimonio; la Mesa (`R9-473`); el toast de
`R9-415` detrás del editor, si se puede borrar la fila desde fuera en pocas llamadas. `R9-518` en vivo: no cabe
(el inicio de sesión necesita red y la única cuenta del AVD es la de Victor); no se gastan llamadas.
