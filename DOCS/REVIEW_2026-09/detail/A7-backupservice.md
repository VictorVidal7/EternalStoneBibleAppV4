# A7 — `BackupService` — respaldar y restaurar

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 3 (2026-09-03) · Estado
> **🐛 BUG** (2 P0 + 2 P1 + 2 P2: `R9-27`..`R9-32`)
>
> Revisado por un agente en worktree; el orquestador **re-verificó a mano** las
> afirmaciones portantes de `R9-27` y `R9-28`.

## Corrección al índice

El charter/índice apuntaba a `src/lib/backup/BackupService.ts`. **Esa ruta no existe**: el
servicio vive en **`src/services/BackupService.ts`** (1526 L). Corregido en `INDEX.md`.

## Alcance

`src/services/BackupService.ts` completo, más los colaboradores que deciden si un restore
"pega": `src/components/settings/DataSettings.tsx` (única UI que llama export/import) ·
`translations.ts` (copy es/en de Datos) · `AchievementService.ts:1008-1113`
(`restoreBackup`) · de `SyncEngine.ts`: `queueWrite`, `persistQueue`, `flush`, `pushOne`,
`applyRemoteChange` · `deleteAccountData.ts` (qué existe de verdad en la nube) ·
`MemoryDeckContext`, `ReadingProgressContext` · `prepNotes.ts`, `progressKeys.ts` ·
`lib/database/index.ts`.

## Cobertura de tests

4 archivos (`backupServiceExport`, `backupServiceImport` 602 L,
`achievementServiceRestoreBackup`, `DataSettings`). Cubren `parseBackupPayload`, la guarda
de versión, la coerción por fila, la compat v1, y dos bugs históricos concretos.

**Sin cubrir, y es donde están los hallazgos:** (1) **no hay ni un test de ida y vuelta
real** (`buildBackup` → `importBackup` → releer) — todos los payloads de test se
construyen a mano, así que nada verifica que lo que el export escribe sea lo que el import
sabe leer; (2) `pushImportedEntitiesToSync` **cero cobertura**; (3) `prep` y
`memory.memoryDeck` sin tests de import — justo las dos secciones sin guarda
`allRowsFailedValidation`; (4) ningún test de rollback; (5) ninguno de concurrencia;
(6) ninguno del escenario "sección degradada en el export".

---

## 🐛 `R9-27` (P0, severidad **alta**) — una sección degradada en el export es indistinguible de una vacía, y al importar **borra** los datos buenos

**Archivos:** `src/services/BackupService.ts:530-566` (payload con `?? []` / `?? {}` /
`?? null`) · **`:569`** · `:1112-1210` (los `*Present`) · `:1255-1274` (escrituras
AsyncStorage) · `:1278-1357` (DELETE-then-INSERT) · `DataSettings.tsx:88-99`.

`buildBackup` sustituye por un valor vacío cualquier sección cuya lectura **lance**
(`safeQuery`/`readJSON`/`readRaw`), pero la marca de degradación **no se escribe en el
archivo**. Verificado a mano:

```ts
return {payload, degradedSections: Array.from(new Set(degradedSections))}; // :569
```

`degradedSections` es **hermano** de `payload`, no un campo suyo: muere en la UI
(`DataSettings.tsx:88-99`) y nunca llega al JSON. Así que `importBackup` no puede
distinguir "el usuario tiene cero" de "el export no pudo leerlo", y aplica su semántica
REPLACE.

**Por qué la defensa existente no cubre esto:** `allRowsFailedValidation` (`:915-920`)
existe justo para que un respaldo corrupto no vacíe una sección, pero solo se dispara con
`sourceLen > 0 && survivedLen === 0`. Una sección degradada llega con `sourceLen === 0`,
así que **pasa la puerta como "vacío legítimo"**.

**Escenario de fallo:**

1. Se pulsa "Exportar". `bibleDB.getFavorites()` lanza — el propio wrapper documenta
   errores intermitentes por statements concurrentes (`lib/database/index.ts:1648-1656`) y
   `buildBackup` lanza **7 lecturas SQLite en `Promise.all`**, exactamente ese patrón.
2. El archivo se escribe con `"favorites": []`: JSON válido y completo a la vista. La app
   muestra un toast **warning** fácil de perder; el archivo ya se compartió.
3. Meses después, teléfono nuevo. Importar → `favoritesPresent === true`, `sourceLen === 0`,
   `allFailed === false` → `DELETE FROM favorites` + 0 inserts → **«Copia de seguridad
   importada correctamente.»**
4. Favoritos borrados (y con ellos las Colecciones, que son sus `tags`).

Para `prep.notes: null` es aún más directo: `prepNotesPresent = (null !== undefined)` →
`true`; `parsePrepNotesMap(JSON.stringify(null ?? {}))` devuelve `{}` — **truthy**
(`prepNotes.ts:139`) — así que `:1267` escribe `"{}"` y **la Mesa de preparación queda
vacía**. Idéntico para `chapterProgressMap: null` (`progressKeys.ts:33`) y `memoryDeck:
null` (`:789`). La Mesa, el progreso por capítulo y los logros **no tienen copia en la
nube**: la pérdida es definitiva.

**Arreglo (no aplicado):** persistir `degradedSections` **dentro** del payload y subir
`BACKUP_FORMAT_VERSION` a 3 (un archivo v2 sin el campo conserva el comportamiento
actual); en el import tratar esas secciones igual que `allRowsFailedValidation` (saltar la
escritura destructiva, reportarlas en `failedSections`); y distinguir `null` de `[]`/`{}`
para `prep.notes`, `prep.series`, `chapterProgressMap` y `memoryDeck` — `null` debe
significar "no lo sé" (no tocar), no "está vacío" (borrar).

---

## 🐛 `R9-28` (P0, severidad **alta**) — ningún contexto se recarga tras el import y la UI **no pide reiniciar**: el estado en memoria reescribe encima de lo restaurado

**Archivos:** `DataSettings.tsx:140-147` · `translations.ts:4163` (es) y `:10690` (en) ·
contra `BackupService.ts:1073-1074`.

El docstring de `importBackup` delega la recarga a la UI **afirmando** que ésta pide
reiniciar:

> _"Does NOT reload most in-memory app state — see Settings' import handler, **which asks
> the user to close and reopen the app**"_

**Verificado: la UI no lo hace.** `importSuccess` es literalmente «Copia de seguridad
importada correctamente.» / «Backup imported successfully.», mostrada como **toast**
efímero (`DataSettings.tsx:147`). No aparece ninguna instrucción de reinicio (`grep` de
"reinicia" en `translations.ts` solo la encuentra en el hint de voces TTS, `:4408`).

**Escenario de fallo (mazo de memorización):**

1. `importBackup` escribe `@memory_deck` con el mazo restaurado.
2. `MemoryDeckContext` sigue montado con `deck` = el mazo **anterior** en `useState`
   (`MemoryDeckContext.tsx:110`).
3. El usuario cierra el modal y entra a Memorización; repasa una tarjeta → `setDeck(...)`
   → el `useEffect` de `:192-197` hace
   `AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deck))` con el mazo **viejo**.
4. El mazo restaurado desaparece por completo. Sin toast, sin error, sin log.

**Mismo patrón:** `ReadingProgressContext.saveProgress` (`:126-131`) escribe el mapa
**entero** derivado del estado en memoria — leer un solo capítulo tras el import
sobrescribe `readingProgress`. Aplica igual a `@reader_preferences`, `@app_theme_mode`/
`@app_color_theme` y a los dos planes de lectura.

**Arreglo (no aplicado):** lo barato y consistente es **hacer verdadera la afirmación del
docstring**: cambiar `importSuccess` (es/en) para instruir explícitamente a cerrar y
reabrir la app, y mostrarlo como diálogo modal bloqueante en vez de toast. Lo correcto es
un `reloadFromStorage()` por contexto tras el import (o un `key` de remonte del árbol de
providers), pero son ~12 contextos.

---

## 🐛 `R9-29` (P1) — el import empuja **una escritura Firestore por entidad**, y revive la ruta `reviewEvents` que se eliminó justamente por cuota

`BackupService.ts:962-1028` (`pushImportedEntitiesToSync`), `:1489-1495` (llamada),
`:1020-1027` (bucle de `reviewEvents`). Contexto: `SyncEngine.pushOne` = un `set()` por
documento, sin `writeBatch` (ver `R9-12` en `A5`).

**La contradicción, textual:** `MemoryDeckContext.reviewCard` documenta _"It is NO LONGER
queued to Firestore per review (that per-review reviewEvents write roughly halved the
free-tier ceiling)"_ (`:318-321`). Pero `BackupService.ts:1020-1027` **sí** los encola, y
su comentario dice seguir _"the same 12-month cloud-sync window every other write path
honors (MemoryDeckContext.reviewCard)"_ — **esa afirmación ya es falsa**: `reviewCard` no
honra ninguna ventana porque no sube nada. El import es hoy el **único escritor** de la
colección `reviewEvents`.

**Escenario:** un usuario de 20 repasos/día durante un año tiene ~7 300 `review_events`
dentro de la ventana. Al restaurar: ~7 300 escrituras individuales en ráfaga ≈ **37 % de
la cuota diaria de escritura de todo el proyecto** (20 000, Spark, compartida). Tres
imports el mismo día agotan la cuota y **rompen el sync de todos los usuarios**. Efecto
secundario local: `upsertQueueEntry` hace un `findIndex` lineal **y** un `persistQueue()`
(`JSON.stringify` de la cola completa) **por cada entrada** → O(N²) en el hilo JS durante
el bucle síncrono. Congelación larga o OOM, justo después de haber borrado y reescrito la
base local.

**Arreglo (no aplicado):** quitar `reviewEvents` del push (alinearlo con la política
local-first ya adoptada; el agregado `memoryStats/summary` ya cubre la continuidad); para
las otras 4 colecciones, reusar el bulk push inicial reseteando
`@sync_first_push_done:{uid}`, o añadir un `queueWriteMany(entries)` con **un**
`persistQueue()` al final. Considerar hacer el push opcional en vez de un efecto oculto.

---

## 🐛 `R9-30` (P1) — el respaldo omite contenido escrito por el usuario que **no tiene copia en la nube**, incluidas dos partes de la propia Mesa

`BackupService.ts:104-116` (`KEYS` — solo `@prep_notes` y `@prep_series` de la Mesa),
`:198-204`. Solo **6** colecciones existen en Firestore
(`deleteAccountData.ts:23-44`): `favorites`, `notes`, `highlights`, `memoryCards`,
`reviewEvents`, `memoryStats`. **Todo lo demás es solo local: si no está en el respaldo, no
tiene ninguna ruta de recuperación.**

Omitidos y sin nube: **`@prep_illustrations`** (ilustraciones de la Mesa),
**`@prep_self_review`** (autoevaluación), **`@sermon_notes`**, `@custom_plans`
(definición de los planes — el respaldo sí trae su **progreso**, que queda apuntando a
planes inexistentes), `@prayer_requests_v1`, `@prayer_log`, `@faith_testimony`,
`@devotional_saved`/`@devotion_log`, `@feelings_log`, tabla `saved_comparisons` (premium),
insignias/títulos (4 tablas), favoritos y progreso de facts/journeys/profecías/kids/quiz,
las 5 claves `@audio_*` (incluida la voz elegida), metas, presets de compartir, grupos
"Juntos", idioma/versión/alto contraste.

**Contra lo que promete la UI** (`translations.ts:4150`, `:4158`, `:4176`): «favoritos,
notas, resaltados, progreso, logros y preferencias» y «la Mesa de preparación nunca se
sincroniza a propósito» — de donde el usuario concluye, correctamente, que **el export es
su única copia de la Mesa**.

**Escenario:** se prepara sermones durante meses, se exporta, se cambia de teléfono, se
importa. Vuelven las notas de pasaje y el planificador de series; **desaparecen las
ilustraciones, la autoevaluación y las notas de sermón**, sin ningún aviso —
`failedSections` está vacío y el toast dice «importada correctamente».

**Arreglo (no aplicado):** ampliar `KEYS` + `BackupPayload` con el bloque "solo-local y
escrito por el usuario", subiendo `BACKUP_FORMAT_VERSION`; cada sección nueva necesita su
`coerce*` y su guarda para no repetir `R9-27`. Alternativa mínima: corregir la copy para
que no prometa la Mesa entera.

---

## 🐛 `R9-31` (P2) — la restauración no aísla a los demás escritores de SQLite y no propaga los borrados a la nube

`BackupService.ts:1277-1278` usa `db.withTransactionAsync`, **no**
`withExclusiveTransactionAsync`: cualquier consulta que otro módulo lance en la misma
conexión mientras la transacción está abierta queda **dentro** de ella. El restore tarda
segundos (miles de INSERTs) y la app sigue viva — `AchievementService`, el guardado de
progreso y sobre todo `SyncEngine.applyRemoteUpsert` (el listener sigue enganchado) pueden
escribir en ese hueco; si el restore hace rollback, esas escrituras ajenas se pierden, y en
el caso del listener el cursor **ya avanzó**, así que ese cambio remoto no se vuelve a
pedir nunca.

Y `pushImportedEntitiesToSync` solo hace `queueWrite`, **nunca `queueDelete`**: las filas
que el restore borró localmente siguen en Firestore. **Escenario:** el usuario borra 30
favoritos por error y restaura un respaldo previo, pero había añadido 5 nuevos después del
respaldo; el restore los borra localmente, y al reinstalar un mes después (cursor 0 → pull
completo) **los 5 vuelven**. Para un usuario con sesión iniciada, "restaurar = reemplazar"
degrada en silencio a "restaurar = mezclar", lo contrario de lo que promete
`importConfirmMessage`.

**Arreglo (no aplicado):** `withExclusiveTransactionAsync`; pausar el `SyncEngine` durante
el import; y calcular `local_antes − restaurado` por colección para emitir `queueDelete`.

---

## 🐛 `R9-32` (P2) — el archivo de respaldo se escribe en **caché** y nunca se limpia

`BackupService.ts:586-590` (`new File(Paths.cache, fileName)`), `:595-601`
(`Sharing.shareAsync`), `DataSettings.tsx:85-101` (sin toast de éxito). Cada export deja un
JSON con **todos** los datos del usuario en un directorio que el sistema puede desalojar; y
`shareAsync` resuelve al cerrarse la hoja, no cuando un destino guardó el archivo, así que
descartar la hoja se da por bueno **sin ningún toast de éxito ni de fallo**. El usuario
asume que tiene respaldo y lo único que existe es un archivo en caché. N exports = N copias
completas acumuladas.

**Arreglo (no aplicado):** borrar exports anteriores al escribir uno nuevo (o usar siempre
el mismo nombre) y mostrar tras `shareAsync` un aviso de que el archivo debe guardarse en
un destino permanente.

---

## ✅ Verificado OK

- **Compat v1 → v2 correcta:** el alias `bible.readingProgress` se lee (`:1134-1138`) y las
  secciones que v1 no tenía quedan `undefined` y se **saltan**, no se borran. Con test.
- **Compat hacia adelante correcta y con mensaje claro:** `assertSupportedFormatVersion`
  (`:604-618`) rechaza `formatVersion > 2`. Con test.
- **Doble toque en importar: guardado.** `performImport` vacía `pendingImportUriRef`
  **síncronamente** al entrar (`DataSettings.tsx:120-124`).
- **Validación por fila bien diseñada:** todas las secciones SQLite y el mazo tienen
  `coerce*` con verificación de tipos + `allRowsFailedValidation`. Su único hueco es
  `R9-27` (degradado ≠ corrupto) y la ausencia de esa guarda para `prep`.
- **Anidamiento de transacciones correcto:** `AchievementService.restoreBackup` no abre
  transacción propia y participa de la externa.
- **`UPDATE reading_progress … WHERE id = 1`** (`:1359`) no es un no-op: la fila se siembra
  con `INSERT OR IGNORE` en el init y `importBackup` llama a `initialize()` antes.
- **Las Colecciones sí están respaldadas** aunque no sean una sección: son derivadas de los
  `tags` de favoritos, y `coerceFavorite` los preserva.
- **Rollback del push correcto:** si la transacción lanza, `pushImportedEntitiesToSync` no
  llega a ejecutarse.
- **`importConfirmMessage` es inusualmente honesto** («reemplazará», «no se puede
  deshacer», distingue qué se sincroniza). Es el resto del flujo el que no cumple ese texto.

## Dudas

1. **Frecuencia real del disparador de `R9-27`.** `safeQuery`/`readJSON` existen porque
   alguien vio fallar esas lecturas, pero no se puede medir cuán a menudo lanzan en
   producción. Si nunca lanzan, `R9-27` baja a P1. Se resolvería buscando el `logger.warn`
   correspondiente en logs reales.
2. **Alcance exacto de `R9-28`.** El patrón "persistir el objeto entero desde memoria" está
   verificado en `MemoryDeckContext` y `ReadingProgressContext`; falta barrer
   `FavoritesContext`, `NotesContext`, `ReaderPreferencesContext`, `useTheme` y los planes
   para dimensionar cuántas secciones se auto-deshacen.
3. **Números de `R9-29`:** estimación de orden de magnitud, no medida. El mecanismo sí está
   verificado.
4. **Clasificación de `R9-30`:** qué claves _deberían_ respaldarse es decisión de producto;
   se marcaron solo las que son contenido escrito por el usuario y sin copia en la nube.
5. **`R9-31` caso 1:** no se pudo confirmar sin ejecutar si el listener emite realmente
   durante la ventana del import.
