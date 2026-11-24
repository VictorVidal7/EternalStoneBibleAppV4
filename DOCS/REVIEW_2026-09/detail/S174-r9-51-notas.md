# Sesión 174 — `R9-51`: una nota por versículo

> Sin agentes, con emulador. Opus 5.5 principal, esfuerzo high; cortada a las ~100 llamadas, la cerró la 174b
> (solo docs, esfuerzo medium).

## 1. Estado de partida

main = origin/main = `541a0d64` (docs de la 173b). CI verde (run 45448082504, 433 suites, 5121 pruebas), según el
prompt; no se volvió a mirar. `git status` limpio. Rama `fix/s174`.

## 2. El arreglo (`29c956ac`, `fix/s174`)

El diseño de la 171 (§3, opción A) calzaba con el código de hoy. Se escribió tal cual, con tres ajustes:

| Ajuste                                                                                                                | Por qué                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UNA transacción para todo el plegado, no una por versículo                                                            | Con una por versículo, un fallo a mitad dejaba versículos ya plegados sin encolar, y la re-corrida (idempotente) ya no los encontraba: la nube se quedaba con los ids viejos y sin la fila del versículo. La tabla `notes` es chica: no cuesta.                                                                                                                                                                                             |
| La regla de fusión quita los textos iguales Y los contenidos en otro                                                  | El §3 decía «iguales: queda uno» para la migración y «un texto ya contenido no se vuelve a juntar» para el adaptador. Con una sola regla (`mergeNoteTexts`), plegar dos veces no cambia nada, en cualquier lugar, y dos aparatos que pliegan las mismas notas dan el mismo texto. Ojo: con la regla de «contenido», el plegado de `["a", "a\n\nb"]` da `a\n\nb` y no `a\n\na\n\nb`.                                                         |
| Un candado de notas en `BibleDatabase` (plegado, adaptador, add/update/remove) y `updateNote` que rechaza con 0 filas | expo-sqlite deja correr otra llamada DENTRO de una transacción abierta: una edición entre la lectura y el borrado del plegado se borraba con la fila vieja. Con el candado, la edición espera; si el plegado re-claveó la nota que la pantalla leyó, `updateNote` rechaza (toast de error) en vez de decir «guardado» por un UPDATE que no tocó nada. Una edición que llega ANTES de que el plegado tome el candado se pliega con lo demás. |

Las piezas:

- `src/lib/notes/verseNoteKey.ts` (nuevo): `verseNoteId` (`vnote:<libro canónico>:<cap>:<vers>`, con `/` → `_`
  por si un respaldo trae un libro desconocido), `mergeNoteTexts` y `mergeVerseNotes` (`created_at` el más viejo;
  `updated_at` el de la más nueva si el plegado no trae nada nuevo, si no `bumpTo`; `verse_text` el de la más nueva).
- `database/index.ts`: `addNote` con el id del versículo; `getNoteForVerse` con `ORDER BY updated_at DESC`;
  `foldVerseNotesInTransaction` / `foldVerseNotes`; `applyRemoteNote`; el candado; `updateNote` que rechaza.
- `adapters/notes.ts`: `migrateNotesToVerseKeys` (bandera `@notes_verse_key_v1` después de la transacción y del
  encolado), `pushNotesFold` (UN `queueWrites`: la fila y la lápida de cada id viejo) y `applyRemoteUpsert` por
  `applyRemoteNote` (un id viejo en un aparato ya plegado se pliega localmente, sin eco; antes del plegado se escribe
  como siempre y el plegado lo toma).
- `SyncEngine.ts`: `queueWrites` acepta `deleted: true` (`tombstoneEntity`, la misma de `queueDelete`).
- `ServicesContext.tsx`: la migración tras `migrateCanonicalBookKeys`, en un `try` (un fallo no para la app).
- `BackupService.ts`: el import corre el plegado dentro de su transacción y sube las notas como quedaron, más las
  lápidas de los ids viejos, en su único lote.

## 3. Pruebas

- `__tests__/notesVerseKeyR951.test.ts` (11), con SQLite real (`node:sqlite` bajo el `BibleDatabase` real y su
  `createSchema`) y datos reales (Juan 3:16 RVR1960 y KJV, dos notas): vía 1 (dos aparatos, el mismo id), el lector
  muestra la más nueva, vía 2 («Juan» y «John» tras `migrateCanonicalBookKeys`: un lote con la fila y dos lápidas),
  re-clave de una fila sola con sus fechas, re-corrida sin bandera (nada), fallo a mitad (rollback, sin bandera, sin
  encolar; el arranque siguiente pliega), la edición durante el plegado, el adaptador antes y después del plegado
  (dos veces = una, sin eco), la convergencia de dos aparatos, `mergeNoteTexts`.
- `backupImportSyncCost.test.ts` +1: vía 3, el lote del import con el motor REAL (filas del versículo y lápidas
  `deleted: true` en lo que sube a Firestore, en un solo `queueWrites`).
- Revert por pieza, 11 piezas (`_scratch/s174-revert.cjs.txt`), cada una vista caer por su razón y restaurada con
  el diff igual: P1 id en `addNote`, P2 `ORDER BY`, P3 quitar lo contenido, P4 la transacción, P5 el candado,
  P6 `updateNote` rechaza, P7 el plegado del adaptador, P8 la lápida en `queueWrites`, P9 el import usa el plegado,
  P10 la fecha de la fusión, P11 la bandera después del lote. La llamada de `ServicesContext` no tiene prueba en
  jest: se midió en vivo (§4).
- Mocks: 20 suites del respaldo y `s154a1` ganan el método nuevo en su mock de `bibleDB`; `backupKeyCoverage`, la
  bandera en las excluidas (el import corre su propio plegado).
- `NODE_ENV=development npm run validate`: verde, 434 suites, 5133 pruebas.

## 4. En vivo (emulador `-read-only`, APK debug vc73, Metro)

Sin la cuenta de Victor: cuenta anónima, sin sync. `pm clear` y primer arranque: el plegado corre sin notas y pone
la bandera. Con la app parada se sembraron en `bible.db` tres filas viejas (`note_…telefono1` «Juan» 3:16,
`note_…tableta22` «John» 3:16, `note_…solaaaaaa` Genesis 1:1) y se borró la bandera de RKStorage
(`_scratch/S174-vivo.sh.txt`, `S174-sembrar.cjs.txt`). Arranque en frío: logcat
`notes: folded into one note per verse {"written":2,"removed":3}`. Disco: `vnote:Genesis:1:1` con sus fechas,
`vnote:John:3:16` con las dos notas por orden de creación, `created_at` 2026-03-01, `updated_at` el de ahora;
bandera `"1"`. Segundo arranque en frío (`LaunchState: COLD`): 0 líneas de plegado. La pestaña Notas no se vio: la
bienvenida de la instalación nueva la tapa (se dejó, por costo).

## 5. Sin medir y aceptado

- El lote a la nube en vivo (pide una cuenta de Google de prueba, `R9-135`). En jest, con el motor real.
- Una app vieja que recibe un `vnote:` lo inserta como otra fila hasta que se actualiza (hoy solo hay prueba
  interna).
- La lápida de un id viejo que llega a un aparato ya plegado no hace nada: el texto plegado queda. **Alcanza**: esa
  lápida viene de un aparato que plegó (su fila del versículo lleva el texto) o de una app vieja que borró (el
  usuario borra la fila del versículo).
- La ventana de un proceso que muere entre el commit del plegado y el encolado: la nube se queda con los ids viejos;
  los aparatos que los reciben los pliegan solos. Y con docs viejos en la nube, una instalación nueva puede
  resucitar localmente una nota borrada, según el orden de llegada. Raro: el primer aparato que pliega pone las
  lápidas de todos los ids viejos.
- Dos aparatos que pliegan sin haberse sincronizado antes: cada uno sube su fila del versículo y gana la última
  (LWW, o un conflicto dentro de la ventana). Es la misma regla de hoy para dos ediciones de una nota.
- El import y el adaptador pueden intercalarse (el import no pasa por el candado): ya era así antes.

## 6. Estado al cerrar

`R9-51` ✅ (`29c956ac`, rama `fix/s174`, sin mergear). Sin hallazgos nuevos. 274 abiertos de 623 (0 P0, 2 P1,
87 P2, 184 P3 y un aviso), si el validador lo confirma. **La 175: la revisión del diff de la 174** (toca datos
guardados: con emulador).
