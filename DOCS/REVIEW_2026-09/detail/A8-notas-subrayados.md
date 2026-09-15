# A8 — Persistencia de notas y subrayados

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 6 (2026-09-14) · Estado
> **🐛 BUG** (7 hallazgos: `R9-44`..`R9-46` **P0**, `R9-50`/`R9-51` P1, `R9-56`/`R9-57` P2)
>
> **Procedencia y estado de verificación.** Fila ejecutada por un agente en worktree
> aislado dentro del fan-out de 4 de la sesión 6. Los 3 P0 y los 2 P1 están **probados con
> una sonda ejecutable de 9 casos (9/9 verde)** contra el `SyncEngine`, el
> `notesSyncAdapter`, el `highlightsSyncAdapter` y el `HighlightService` **reales**.
> **PENDIENTE: la re-verificación a mano del orquestador** sobre los `grep` portantes de
> los 3 P0 (regla fija de `CONTINUAR.md` §5 — los agentes aciertan el mecanismo y fallan el
> detalle). Hasta que eso ocurra, trátalos como **probados por sonda ajena**, que es más
> que una lectura y menos que un hecho re-verificado.

## Alcance

**Leídos de punta a punta:** `src/lib/sync/adapters/notes.ts` (145 L) ·
`src/lib/sync/adapters/highlights.ts` (160 L) · `src/lib/highlights/HighlightService.ts`
(300 L) · `src/lib/highlights/index.ts` · `src/lib/notes/noteMarkdown.ts` ·
`src/lib/notes/noteMarkdownRanges.ts` · `src/lib/notes/noteFilter.ts` ·
`src/lib/notes/noteCard.ts` · `app/(tabs)/notes.tsx` (541 L) · `app/(tabs)/highlights.tsx`
(~700 L) · `src/components/reading/NoteEditorModal.tsx` · `src/lib/sync/timeUtils.ts` ·
`src/lib/sync/sanitize.ts` · `src/lib/sync/types.ts`.

**Leídos en las partes que tocan al área:** `src/lib/database/index.ts` → tablas
`notes`/`highlights` (`:521-532`), NOTE OPERATIONS (`:2081-2162`),
`migrateCanonicalBookKeys` (`:2163-2250`), `clearAllData` (`:2407-2415`) ·
`app/(tabs)/verse/[book]/[chapter].tsx` → `saveNote` (`:1048-1110`),
`handleApplyHighlight` (`:1480-1535`), `handleNoteSelected` (`:1722-1756`), carga de
resaltados (`:1198-1221`) · `src/services/BackupService.ts` → `coerceNote` /
`coerceHighlightRow` (`:701-743`), import (`:1308-1357`), `pushRestoredDataToCloud`
(`:964-1015`) · `src/lib/sync/SyncEngine.ts` → solo `queueWrite`/`queueDelete`
(`:387-429`), `handleSnapshot` (`:635-708`), `applyRemoteChange` (`:710-757`), `pushOne`
(`:1310-1324`) · `app/features/lectio.tsx` (`:255-330`, otro call site de notas) ·
`src/context/SyncEngineContext.tsx`, `src/context/ServicesContext.tsx`, `app/_layout.tsx`
(orden de providers).

**Divergencia `.web`: no aplica.** `app/(tabs)/verse/[book]/[chapter].web.tsx` existe (406
L) pero su cabecera (`:51`) excluye explícitamente _"favorites, notes, highlights, sync"_
del alcance v1, y no hay `.web` de `notes.tsx`, `highlights.tsx`, `HighlightService.ts` ni
de los adaptadores. **Sin pareja `X.ts`/`X.web.ts` divergente en esta área.**

## Cobertura de tests

**Cubren (todo verde):** los módulos **puros** — `noteMarkdown` (18 tests),
`noteMarkdownRanges` (10), `noteFilter` (10), `noteCard` (4), `NoteMarkdownText` (6),
`noteEditorModalReferenceDetect` (9), `highlightGallery` (5), `markdownFormatting`,
`highlightMatches`. Más `backupServiceExport`/`backupServiceImport` para las secciones de
notas y subrayados del respaldo, y `syncPayloads.test.ts` para
`buildHighlightRemotePayload`.

**NO cubren — el hueco exacto donde caen los 5 hallazgos probados:**

| Hueco                                               | Evidencia                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los adaptadores **reales** contra el motor **real** | `grep -rln "adapters/notes\|adapters/highlights" __tests__/` → solo el _builder_ de payload. No existe `notesSyncAdapter.test.ts` ni `highlightsSyncAdapter.test.ts`. `SyncEngine.test.ts` (1555 L) corre siempre con un adaptador **sintético** (`makeAdapter()`, `:245`) |
| `HighlightService`                                  | `grep -rln HighlightService __tests__/` → 1 archivo, y solo lo instancia de refilón para logros. Ningún test ejercita `addHighlight`/`updateHighlight`                                                                                                                     |
| Las funciones de notas de la BD                     | `grep -rln "addNote\|updateNote\|removeNote\|getNoteForVerse" __tests__/` → solo `webStubProviders.test.tsx` (stubs web)                                                                                                                                                   |
| Tests de pantalla                                   | cero para `notes.tsx`, `highlights.tsx` y los caminos de nota/subrayado del lector                                                                                                                                                                                         |
| La semántica de `merge` de Firestore                | el mock de `set()` de `SyncEngine.test.ts:113-115` **ignora la opción `merge`** — la mitad de `R9-45` y `R9-50` es literalmente inobservable en esa suite                                                                                                                  |

`syncPayloads.test.ts:98` afirma que `highlightToRemote` **descarta** `note`/`category`
cuando son `undefined` y lo trata como el comportamiento correcto (el arreglo del S78) —
precisamente lo que hace invisible la segunda capa de `R9-50`. Nadie preguntó qué pasa
después, en el `set(..., {merge:true})`.

---

## La raíz común de `R9-44`, `R9-45` y `R9-50`

Los tres son caras del mismo defecto estructural, y conviene atacarlos juntos:
**`pushOne` escribe con `{merge: true}` (`SyncEngine.ts:1323`), y bajo merge un campo
opcional es _imposible de desasignar por sync_.** Cualquier omisión local (un argumento que
falta, un `undefined` que `withoutUndefined` descarta, una lápida que nadie limpia) deja de
ser un error local y se convierte en una **divergencia permanente entre el dispositivo y la
nube**, que además se propaga al resto de los dispositivos. Es el mismo eje de "la
dirección inversa" que ya explicó los P0 de las sesiones 3 y 5, en una tercera forma.

---

## 🐛 `R9-44` (P0, severidad **alta**) — cambiar el color de un subrayado desde el lector BORRA la nota y la categoría que el usuario le había escrito

`app/(tabs)/verse/[book]/[chapter].tsx:1504-1510` ·
`src/lib/highlights/HighlightService.ts:56-104` (los `NULL` en `:94-95`)

**Qué pasa.** `handleApplyHighlight` llama
`highlightService.addHighlight(verseId, canonicalBook, chapterNum, num, color)` con
**5 argumentos**: omite `category` y `note`. `addHighlight` hace `INSERT OR REPLACE` sobre
`UNIQUE(verse_id)` escribiendo `category || null` y `note || null` → **pisa con `NULL` la
nota y la categoría existentes**. No hay lectura previa de la fila, no hay confirmación, y
el lector ni siquiera muestra que ese versículo tenga una nota de resaltado. También
resetea `created_at` a `Date.now()`, con lo que se pierde "desde cuándo lo tengo
resaltado".

**Escenario de fallo.** El usuario abre _Resaltados_, edita Juan 3:16 y escribe una
reflexión larga más la categoría "Promesa". Semanas después, leyendo Juan 3, selecciona el
versículo y toca otro color (o el mismo) en el selector. La nota y la categoría quedan
**destruidas en SQLite, sin aviso y sin forma de recuperarlas**.

**Agravante en la nube.** El payload que se sube (`buildHighlightRemotePayload(created)`,
`:1513-1515`) trae `note: undefined`, que `withoutUndefined` descarta, y `pushOne` escribe
con `{merge: true}` → **el doc de Firestore CONSERVA la nota vieja**. Resultado: el
teléfono pierde la nota, la nube la mantiene, y un dispositivo nuevo la resucita.
Divergencia permanente.

**Debería:** conservar `note`/`category` al recolorear (leer la fila y hacer
`UPDATE color`), o al menos avisar antes de destruir.

**Evidencia.** **Probado con sonda** (caso `A8-0`). `expect(insert.params[6]).toBeNull()`
(category) y `expect(insert.params[7]).toBeNull()` (note) sobre la llamada literal de
`:1504`. Además `expect(created.note).toBeUndefined()` confirma que el payload de sync
tampoco la lleva, y `params[8] === params[9]` confirma el reseteo de `created_at`.

**Por qué los tests no lo agarran.** No hay ni un test que instancie `HighlightService`
para ejercitar `addHighlight`, ni un test de pantalla del lector. `syncPayloads.test.ts`
prueba el builder con un `Highlight` que ya viene sin nota, así que nunca compara "antes
vs. después".

---

## 🐛 `R9-45` (P0, severidad **alta**) — una lápida en `highlights` nunca se limpia: volver a resaltar el MISMO versículo no llega jamás a los otros dispositivos

`src/lib/sync/SyncEngine.ts:412-429` (`queueDelete` pone `deleted:true`) + `:387-406`
(`queueWrite` **nunca** pone `deleted:false`) + `:1323` (`set(..., {merge:true})`) + `:669`
(`deleted: remote.deleted === true`) · disparado desde
`app/(tabs)/verse/[book]/[chapter].tsx:1499-1502` y `:1511-1515`

**Qué pasa.** El adaptador de subrayados usa como id de documento el **`verseId`
(`"John:3:16"`), una clave natural REUTILIZABLE** — decisión deliberada y documentada en
`adapters/highlights.ts:19-25`. Ninguna otra colección del área reutiliza ids.
`queueDelete` marca el doc `deleted:true`; el `queueWrite` posterior, bajo `merge:true`,
**solo pisa las claves que trae**, y `deleted` no está entre ellas. El doc queda con el
`color` nuevo **y** `deleted:true` para siempre. Cualquier otro dispositivo lo lee como
lápida (`:669`) y llama `applyRemoteDelete`.

**Escenario de fallo.** El usuario resalta Juan 3:16 en amarillo, se arrepiente y lo quita,
y minutos después lo vuelve a resaltar en verde. En su teléfono se ve verde (el eco vuelve
con `updatedAt` idéntico y el LWW lo ignora). En su tablet, y en **cualquier reinstalación
o teléfono nuevo** (cursor = 0, se baja el historial completo), Juan 3:16 aparece **sin
resaltar, para siempre** — y si la tablet lo tenía, se le borra.

**Se extiende a NOTAS por la ruta de restauración.** `BackupService.ts:993-995`
(`pushRestoredDataToCloud`) hace `queueWrite('notes', n.id, ...)` con el id **original**. Si
el usuario borró la nota N (lápida en la nube) y después restaura un respaldo que todavía
la contiene, el doc de N queda con `deleted:true` + el texto restaurado: la nota vuelve en
ese teléfono pero **no llega nunca a ningún otro**. Es un mecanismo **distinto** de
`R9-27`/`R9-28`, que son sobre el contenido del respaldo, no sobre la lápida.

**Debería:** `queueWrite` limpiar `deleted`/`deletedAt` (o pushear sin merge) al resucitar
un id.

**Evidencia.** **Probado con sonda** (caso `A8-3`, 2 tests). El mock de Firestore replica
`merge:true` fielmente (`opts.merge ? {...prev, ...data} : {...data}`). Test 1: tras
`queueDelete` + `queueWrite` sobre `'John:3:16'`, `doc.color === '#A5D6A7'` **y**
`doc.deleted === true`. Test 2: ese doc disparado como snapshot a un segundo `SyncEngine`
con el `highlightsSyncAdapter` **real** produce `DELETE FROM highlights WHERE verse_id = ?`
y **ningún** `INSERT OR REPLACE`.

**Por qué los tests no lo agarran.** `SyncEngine.test.ts` sí prueba `queueDelete` →
tombstone, pero **nunca la secuencia delete→write sobre el mismo id**, y su mock de `set()`
ignora la opción `merge`, así que la semántica de merge —la mitad del defecto— no es
observable en esa suite. Y ningún test usa el adaptador real, que es el único cuya clave es
reutilizable.

---

## 🐛 `R9-46` (P0, severidad **alta**) — `notesSyncAdapter.getLocal` falla ABIERTO: si la BD aún no está lista, una copia remota VIEJA pisa la nota local más nueva

`src/lib/sync/adapters/notes.ts:50-56` (`findNoteById`, **sin** `await
bibleDB.initialize()`) y `:69-73` (`getLocal`) · consumido en `src/lib/sync/SyncEngine.ts:716`
y `:744-747`

**Qué pasa.** `getLocal` es **el único de los cuatro métodos del adaptador de notas que NO
llama `bibleDB.initialize()`** (`applyRemoteUpsert` `:77`, `applyRemoteDelete` `:109`,
`pullAllLocal` `:122` sí lo hacen; el adaptador de subrayados lo hace en los cuatro,
`:75`/`:93`/`:125`/`:140`). `getNotes()` hace `this.getDb()`, que lanza
`"Database not initialized"` (`database/index.ts:442-447`), y `findNoteById` **captura
cualquier error y devuelve `null`**, indistinguible de "no existe la fila". El motor, ante
`local === null`, **se salta entera la comparación LWW y la detección de conflictos** y
aplica el upsert remoto sin condiciones.

**La ventana está abierta en cada arranque en frío.** En `app/_layout.tsx:433-435`
`ServicesProvider` envuelve a `SyncEngineProvider`, pero los efectos de React corren **de
hijo a padre**: el `useEffect` de `SyncEngineProvider` (registro de adaptadores +
`engine.start`) corre **antes** que el de `ServicesProvider`, que es quien llama
`database.initialize()` (`ServicesContext.tsx:94`). Y `SyncEngine.start()` engancha los
listeners (`:335-339`) **antes** del bulk push (`:345`), sin esperar nada de SQLite.
`bibleDB.initialize()` incluye `seedFromBundleIfMissing()` (copia de un `bible.db` de
varios MB) + schema + siembra de referencias cruzadas: la ventana es de **segundos**.

**Escenario de fallo.** El usuario reescribe su nota de Juan 3:16 en el teléfono sin
conexión (local `updatedAt` = hoy). El otro dispositivo tiene una versión más vieja de esa
misma nota en la nube. Al abrir la app, el primer snapshot de Firestore (caché offline,
llega casi instantáneo) aterriza mientras la BD todavía se inicializa → `getLocal` → `null`
→ `applyRemoteUpsert` hace `INSERT OR REPLACE` y **la versión de hoy desaparece sin rastro
y sin toast**.

**Debería:** esperar a que la BD esté lista, y ante un error de lectura **abortar la
aplicación del cambio remoto** (fail-closed), no asumir "no existe".

**Evidencia.** **Probado con sonda** (caso `A8-2`, 3 tests) con el `SyncEngine` real + el
`notesSyncAdapter` real. Local `updatedAt = 9_000_000` con `note: 'TEXTO NUEVO…'`; remoto
`updatedAt = 5_000_000` con `'TEXTO VIEJO…'`. Con `getNotes` lanzando, se ejecuta
`INSERT OR REPLACE INTO notes` con `'TEXTO VIEJO del otro dispositivo'` en los params. El
**test de contraste** con la BD sana sobre el mismo snapshot: ningún `INSERT` (el LWW
funciona correctamente). La diferencia entre ambos es exactamente el `initialize()` que
falta.

**Por qué los tests no lo agarran.** `SyncEngine.test.ts` sí tiene tests de LWW, pero su
adaptador sintético (`:247-249`) lee de un `Map` en memoria que nunca falla, así que la
rama "`getLocal` devuelve null por error, no por ausencia" no existe en la suite. Y
`tsc`/eslint no ven nada: devolver `null` es legal según el contrato declarado en
`types.ts:44-48`.

---

## 🐛 `R9-50` (P1, severidad **alta**) — borrar la nota o la categoría de un subrayado es un no-op completo, y la UI dice "Guardado"

`src/lib/highlights/HighlightService.ts:119-135` (los guardas `!== undefined`) ·
`app/(tabs)/highlights.tsx:190-193` (`note: note || undefined`) y `:602`
(`setCategoryDraft(active ? undefined : cat)`)

**Qué pasa.** `updateHighlight` construye el `SET` dinámicamente y **solo incluye un campo
si `updates[campo] !== undefined`**. Pero `saveEditor` traduce "campo vacío" a
**`undefined`**: `note: noteDraft.trim() || undefined` (`''` → `undefined`) y
`categoryDraft` queda `undefined` al des-seleccionar el chip activo (`:602`). La columna
nunca entra en el `UPDATE` y **el valor viejo sobrevive en SQLite**. Tres capas mienten a
la vez:

1. SQLite conserva la nota/categoría vieja.
2. El `queueWrite` (`:203-207`) manda el payload sin el campo (`withoutUndefined`), y
   `pushOne` usa `{merge:true}` → **Firestore también conserva el valor viejo**. Bajo
   `merge:true` un campo opcional es **imposible de desasignar** por sync.
3. `setItems` (`:201`) y `toast.success(t.highlights.saved)` (`:209`) muestran el borrado
   como exitoso.

**Escenario de fallo.** El usuario quiere quitar una nota que puso por error en un
resaltado. Borra el texto, toca "Guardar", ve "Guardado" y la nota desaparece de la lista.
Sale de la pantalla y vuelve: `useFocusEffect` → `load()` relee SQLite y **la nota reaparece
intacta**. Igual con la categoría. **No existe ninguna forma de quitar una nota de resaltado
en toda la app.**

**Debería:** distinguir "no tocar" (clave ausente) de "poner a vacío" (`null`), y pushear
sin merge o con un sentinel de borrado.

**Evidencia.** **Probado con sonda** (caso `A8-1`, 3 tests) contra el `HighlightService`
real con la carga literal de `saveEditor`:

- `{note: undefined, category: PROMISE}` →
  `UPDATE highlights SET category = ?, updated_at = ? WHERE verse_id = ?` (sin `note = ?`).
- `{note: 'sigue aquí', category: undefined}` →
  `UPDATE highlights SET note = ?, updated_at = ? WHERE verse_id = ?` (sin `category = ?`).
- `{note: undefined, category: undefined}` →
  `UPDATE highlights SET updated_at = ? WHERE verse_id = ?` — **el `UPDATE` no toca ningún
  dato.**

**Por qué los tests no lo agarran.** Cero tests de `HighlightService` y cero tests de
`app/(tabs)/highlights.tsx`.

---

## 🐛 `R9-51` (P1, severidad **media**) — dos dispositivos pueden crear DOS notas para el mismo versículo, y el lector solo alcanza una de ellas

`src/lib/database/index.ts:521-532` (esquema de `notes`, sin `UNIQUE`) · `:2083-2085` (id
con timestamp + random) · `:2144-2160` (`getNoteForVerse`)

**Qué pasa.** La tabla `notes` tiene **solo `id TEXT PRIMARY KEY`**: ninguna restricción
sobre `(book_name, chapter, verse)`. Los ids se generan localmente con
`note_${Date.now()}_${random}` (`:2085`), así que dos dispositivos que anotan el mismo
versículo producen ids distintos. El adaptador usa el **id de la nota** como clave de sync
(`INSERT OR REPLACE ... (id, ...)`, `adapters/notes.ts:80-98`) — exactamente la decisión
contraria a la del adaptador de subrayados, que eligió `verseId` a propósito _"porque el id
generado por el servicio lleva un timestamp y cambia entre dispositivos"_
(`adapters/highlights.ts:19-25`). Tras sincronizar, **ambos dispositivos tienen dos filas
para el mismo versículo**; el motor nunca las ve como conflicto (son docs distintos).
`getNoteForVerse` usa `getFirstAsync` **sin `ORDER BY`** (`:2151-2158`): devuelve una
arbitraria.

**Escenario de fallo.** El usuario anota Juan 3:16 en el teléfono y, antes de que
sincronice, anota el mismo versículo en la tablet. Después, en el lector, toca Juan 3:16: el
editor se precarga con **una** de las dos notas (impredecible). Todo lo que escriba se
guarda sobre esa; la otra queda huérfana — visible en la pestaña _Notas_ como una tarjeta
duplicada con la misma referencia, inalcanzable desde el lector, y `getNotesCount()` (usado
en el Home, `app/(tabs)/index.tsx:505`) la cuenta doble. `bibleDB.updateNote` tampoco puede
fusionarlas.

**Debería:** clave de sync por `book:chapter:verse` (como subrayados) o deduplicación al
aplicar el upsert remoto.

**Evidencia.** Estática pero determinante.
`grep -n "CREATE TABLE IF NOT EXISTS notes" -A10 src/lib/database/index.ts` → sin `UNIQUE`.
`getNoteForVerse` (`:2151`) sin `ORDER BY`. `addNote` (`:2085`) con id aleatorio por
dispositivo. `applyRemoteUpsert` (`adapters/notes.ts:80-98`) preserva el id remoto por
diseño, y su propio comentario dice que así _"evita la gimnasia de dedup por campos"_ — la
gimnasia que falta. **Sin sonda:** requiere SQLite real, que no está disponible bajo jest.

---

## 🐛 `R9-56` (P2, severidad **baja**) — la pestaña Notas muestra la referencia en el idioma de la versión activa y el versículo congelado en el idioma de cuando se creó la nota

`app/(tabs)/notes.tsx:276` (`localizeBook(item.book)`) vs. `:317` (`"{item.text}"`) · el
texto se congela en `verse/[book]/[chapter].tsx:1078` y nunca se refresca
(`database/index.ts:2107-2115`, `updateNote` solo toca `note` y `updated_at`)

**Qué pasa.** `localizeBook` sigue deliberadamente a `selectedVersion.language` (el código
lo comenta como intencional en `:270-273`), pero `item.text` es el `verse_text` congelado en
la versión que estaba activa al crear la nota. `HighlightsScreen` **sí** re-resuelve el
texto contra la versión activa (`app/(tabs)/highlights.tsx:96-101`,
`bibleDB.getVerse(..., selectedVersion.id)`) — la asimetría confirma que es un olvido, no
una decisión.

**Escenario de fallo.** El usuario crea notas leyendo RVR1960 y luego cambia a KJV. En _Mis
Notas_ cada tarjeta muestra **"John 3:16"** sobre **"Porque de tal manera amó Dios al
mundo…"**. Lo mismo en la imagen para compartir (`NoteImageModal` recibe `shareNote.text`,
`:435`), que es contenido público.

**Debería:** re-resolver el versículo contra la versión activa, como ya hace la pantalla de
Resaltados.

---

## 🐛 `R9-57` (P2, severidad **media**) — no existe forma de borrar una nota desde el lector, y el botón atrás descarta el borrador sin avisar

`src/components/reading/NoteEditorModal.tsx:290` (`disabled={!trimmed}`) y `:169`
(`onRequestClose={onClose}`) · `app/(tabs)/verse/[book]/[chapter].tsx:1049`
(`if (!selectedVerseForNote || !noteText.trim()) return;`)

**Qué pasa.** (a) Vaciar el campo deshabilita "Guardar", así que el gesto natural para
borrar una nota desde el lector no hace nada; el único camino de borrado está en la pestaña
_Notas_. (b) El borrador vive **solo** en el `useState` del padre — no hay autoguardado ni
debounce ni `flush()` al desmontar. El propio comentario del modal lo admite (`:147-150`):
_"a diferencia del editor autoguardado de notas de sermón, el borrador de este modal vive
solo en el estado del padre hasta que se guarda explícitamente"_. Cerrar con la X o con el
botón atrás de Android (`onRequestClose`) lo descarta **sin confirmación**, y el siguiente
`handleNoteSelected` lo sobrescribe (`:1750-1753`).

**Escenario de fallo.** El usuario escribe una reflexión larga sobre Romanos 8, toca el
botón atrás por reflejo (o para cerrar el teclado) y el texto se pierde entero.

**Debería:** confirmar el descarte cuando hay borrador no vacío, y permitir borrar la nota
vaciándola.

**Nota de honestidad del agente:** es el contrato estándar de un modal con botón de guardar
explícito — por eso P2 y no P1. **No verificado en dispositivo:** si el handler de
`BackHandler` del `Modal` de RN gana siempre sobre el `useBackHandlerStep` de la pantalla
(`:1287-1296`), que no consulta `noteModalVisible`. Si perdiera, el atrás además navegaría
de capítulo. Requiere Modo C en el OnePlus.

---

## ✅ Lo que salió LIMPIO, con evidencia

- **Paridad de esquema entre las 3 capas.** `notes` SQLite =
  `id, book_name, chapter, verse, verse_text, note, created_at, updated_at`; `RemoteNote` =
  `book, chapter, verse, text, note, createdAt` + `updatedAt` de `SyncMetadata`; respaldo
  (`coerceNote`, `BackupService.ts:701-717`) = los 8 campos. **Sin huecos.** En
  `highlights`, el `id` local **no** viaja por sync (a propósito: `verse_id` es `UNIQUE` y
  sirve de clave) pero **sí** en el respaldo; todo lo demás cuadra campo a campo. Las
  conversiones ISO↔millis de `timeUtils.ts` son consistentes en ambas direcciones.
- **Desfase de offsets al cambiar de versión: la premisa no aplica.** Los subrayados son
  **por versículo entero** (`verse_id = "Book:cap:v"`), no por rango de caracteres; los
  offsets de `noteMarkdownRanges.ts` son contra el **texto de la nota**, no contra el del
  versículo. Cambiar de versión no puede desalinear nada. Y `migrateCanonicalBookKeys`
  (`database/index.ts:2172-2250`) ya normaliza la identidad de libro para las tres tablas.
- **Markdown.** `noteMarkdown.ts` acota los spans a una sola línea (para no italizar media
  nota por un `*` suelto), `noteMarkdownRanges.ts` es un worklet con `try/catch` → `[]`,
  tope de 4000 chars y guarda anti-bucle-infinito. 28 tests entre los dos, todos verdes. El
  render es `<Text>` de RN (no HTML), así que **no hay superficie de inyección**. Única
  inconsistencia, inofensiva: el tope de 4000 chars solo existe en el lado editor.
- **Restauración de respaldo para notas/subrayados: completa en cuanto a campos**
  (`BackupService.ts:1308-1357` inserta las 8 y 10 columnas). Sus problemas ya están
  reportados como `R9-27`/`R9-28`.
- **`app/features/lectio.tsx:263-330`** (el otro call site que escribe notas) está **bien
  hecho**: `composeNoteWithPrayer` **anexa** al texto existente en vez de reemplazarlo, y
  tiene guarda de reentrada (`savingRef`). Sin hallazgo.
- **i18n.** Cero strings en inglés crudo en `notes.tsx`, `highlights.tsx` y
  `NoteEditorModal.tsx` (los únicos literales en inglés son mensajes de `logger`, no UI).

## Notas menores (no son filas del ledger)

- **`bibleDB.clearAllData()`** (`database/index.ts:2407-2415`) borra
  `verses`/`favorites`/`notes` y **omite `highlights`** — el patrón clásico de lista
  enumerada a mano. **No tiene ni un llamador** (`grep -rn clearAllData src app` → solo la
  definición). Es código muerto: si alguien lo cablea a un "borrar mis datos" en Ajustes,
  filtra los subrayados. Hoy **no es explotable**; conviene borrarlo o completarlo.
- El mapa `verseHighlights` del lector se carga en un `useEffect` con deps
  `[highlightService, canonicalBook, chapterNum]` (`verse/[book]/[chapter].tsx:1199-1221`),
  **no** en `useFocusEffect`. Borrar un subrayado desde la pestaña _Resaltados_ y volver al
  lector con el mismo capítulo ya montado deja el tinte viejo en pantalla hasta remontar.
  Cosmético.
- **`R9-23` pega especialmente fuerte aquí**, sin ser hallazgo nuevo:
  `notesSyncAdapter.pullAllLocal()` sube **todas** las notas locales al uid entrante en el
  bulk push, y las notas son el contenido más privado de la app. El diálogo de migración de
  `AuthContext.tsx:395-424` solo cubre la rama anónimo→Google-ya-existente; cerrar sesión y
  entrar con otra cuenta de Google **no pasa por ahí**.

## Receta para reconstruir la sonda

Archivo: `DOCS/REVIEW_2026-09/_scratch/A8-probe.test.ts` (gitignoreado; vivía en el worktree
del agente, que ya se limpió). Correr:
`npx jest DOCS/REVIEW_2026-09/_scratch/A8-probe.test.ts` → **9/9 verde**, ~1 s. Rutas
relativas `../../../src/...` porque `jest.mock` resuelve por ruta absoluta.

1. **`jest.mock('../../../src/lib/database')`** con un `default` que expone `initialize`,
   `getDatabase`, `getNotes`, `executeSql`, `removeNote`, más `BibleDatabase: class {}`.
   Todo `executeSql` se acumula en un array `mockDbState.sql`, y `getNotes` lanza
   `new Error('Database not initialized…')` cuando `mockDbState.getNotesThrows` está en
   `true`. Esto reemplaza al `bibleDB` real sin cargar `expo-sqlite`.
2. **Mocks de `firestore` + `netinfo` copiados de `__tests__/SyncEngine.test.ts:196-225`**,
   con `mockMakeCollection` reducido a `doc/where/orderBy/limit/onSnapshot/get` + un helper
   `__fire(changes)` que filtra por las cláusulas `where` registradas.
   **Cambio propio, imprescindible para `R9-45`:** el `set(data, opts)` del mock, además de
   empujar a `mockDocSets`, mantiene un `mockDocStore` y aplica
   `opts?.merge && prev ? {...prev, ...data} : {...data}` — réplica fiel del merge de
   Firestore, que es justo lo que la suite real **no** modela.
3. **Imports después de los mocks:** `SyncEngine`, `notesSyncAdapter`,
   `highlightsSyncAdapter`, `HighlightService`, `HighlightColor`/`HighlightCategory`, y
   `jest.spyOn(logger, …)` silenciado.
   `const flush = () => new Promise(r => setImmediate(r));`
4. **Bloques:**
   - `A8-0` (`R9-44`): `new HighlightService(fakeDb)` con un `executeSql` que registra SQL;
     `addHighlight(verseId, book, ch, v, color)` con **5 args**; asertar `params[6] === null`,
     `params[7] === null`, `params[8] === params[9]`.
   - `A8-1` (`R9-50`): mismo `fakeDb` pero el `SELECT * FROM highlights WHERE verse_id`
     devuelve una fila con `note` y `category`; tres llamadas a `updateHighlight` con
     `{note: undefined}`, `{category: undefined}` y ambos; asertar el string exacto del
     `UPDATE`.
   - `A8-2` (`R9-46`): `engine.register(notesSyncAdapter)`, `await engine.start('uid-A8')`,
     poner `getNotesThrows = true`, `coll.__fire([...])` con un doc de `updatedAt` **menor**
     que el local, asertar que hay `INSERT OR REPLACE INTO notes` con el texto viejo. **Más
     el test de contraste** con `getNotesThrows = false`, que debe asertar `toBeUndefined()`.
   - `A8-3` (`R9-45`): `engine.register(highlightsSyncAdapter)`, `queueDelete` +
     `queueWrite` sobre `'John:3:16'` con `await engine.__flushForTests()` entre medio,
     asertar `mockDocStore.get(...).deleted === true`; luego un segundo engine que recibe ese
     doc por `__fire` y asertar `DELETE FROM highlights WHERE verse_id` presente e
     `INSERT OR REPLACE INTO highlights` ausente.
