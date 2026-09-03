# A5 — Auditoría de TODAS las escrituras a Firestore (call sites)

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 3 (2026-09-03) · Estado
> **🐛 BUG** (1 hallazgo P0 `R9-11` + 1 mejora P2 `R9-12`)

## Alcance y método

Barrido de `src/` + `app/` (`.ts`/`.tsx`) por los patrones de escritura de Firestore.
Conteo crudo por patrón:

| Patrón           | Hits | Nota                                            |
| ---------------- | ---- | ----------------------------------------------- |
| `queueWrite`     | 35   | incluye docstrings; **13 call sites reales**    |
| `queueDelete`    | 6    | patrón que un barrido ingenuo se pierde         |
| `setDoc`         | 3    | **todos** dentro de `src/lib/sync/firestore.ts` |
| `deleteDoc`      | 2    | ídem                                            |
| `updateDoc`      | 0    | —                                               |
| `addDoc`         | 0    | —                                               |
| `writeBatch`     | 0    | ver `R9-12`                                     |
| `runTransaction` | 1    | solo un comentario en `firestore.ts:94`         |

**Hallazgo estructural de fondo, y es bueno:** la app tiene **un solo punto de
estrangulamiento** para escribir a Firestore. Todo pasa por
`SyncEngine.queueWrite`/`queueDelete`; `setDoc`/`deleteDoc` solo existen dentro del
adaptador delgado del SDK. Solo **dos** módulos escriben directo saltándose el engine, y
ambos están justificados (abajo). No hay dispersión de escrituras ad-hoc por pantallas,
que es exactamente el riesgo que esta fila transversal existía para descartar.

## Cobertura de tests

Hay suites de sync (`grep -rl "Sync" __tests__/`) que cubren el engine. **Lo que no está
cubierto** es lo que encontré: el comportamiento de la cola cuando llega una **re-edición
del mismo documento durante un flush en vuelo** (`R9-11`). No hay ninguna prueba de esa
ventana.

---

## Inventario de escrituras (los 13 call sites + 2 directos)

| `archivo:línea`                                   | Colección     | Disparador                               | Veredicto                       |
| ------------------------------------------------- | ------------- | ---------------------------------------- | ------------------------------- |
| `src/context/FavoritesContext.tsx:311`            | `favorites`   | tap "añadir a favoritos"                 | ✅ justificado                  |
| `src/context/FavoritesContext.tsx:342` (delete)   | `favorites`   | tap quitar                               | ✅ justificado                  |
| `src/context/FavoritesContext.tsx:386`            | `favorites`   | editar un favorito                       | ✅ justificado                  |
| `src/context/MemoryDeckContext.tsx:290`           | `memoryCards` | añadir tarjeta al mazo                   | ✅ justificado                  |
| `src/context/MemoryDeckContext.tsx:302` (del.)    | `memoryCards` | quitar tarjeta                           | ✅ justificado                  |
| `src/context/MemoryDeckContext.tsx:317`           | `memoryCards` | **1 escritura por repaso**               | ✅ piso ACEPTADO a propósito    |
| `src/context/MemoryDeckContext.tsx:345` (del.)    | `memoryCards` | `resetDeck()` — **bucle sobre el mazo**  | ⚠️ ver `R9-12`                  |
| `app/(tabs)/highlights.tsx:172` (delete)          | `highlights`  | borrar desde la lista                    | ✅ justificado                  |
| `app/(tabs)/highlights.tsx:203`                   | `highlights`  | editar nota/categoría                    | ✅ justificado                  |
| `app/(tabs)/notes.tsx:91` (delete)                | `notes`       | borrar nota                              | ✅ justificado                  |
| `app/(tabs)/verse/[book]/[chapter].tsx:1095`      | `notes`       | guardar nota de versículo                | ✅ justificado                  |
| `app/(tabs)/verse/[book]/[chapter].tsx:1498+`     | `highlights`  | **bucle sobre versículos seleccionados** | ⚠️ ver `R9-12`                  |
| `app/features/lectio.tsx:311`                     | `notes`       | guardar la oración de lectio como nota   | ✅ justificado                  |
| `src/services/BackupService.ts:973-1027`          | 5 colecciones | restaurar — **bucle por cada entidad**   | ⚠️ ver `R9-12` (cruza con `A7`) |
| `src/lib/memory/memoryStatsSync.ts:143`           | `memoryStats` | **directo**, al pasar a background       | ✅ es el patrón de referencia   |
| `src/lib/migrations/retiredBookmarksMigration.ts` | `favorites`   | **directo**, migración única             | ✅ con guarda de bandera        |

**Sobre la cuota, y contra la lectura ingenua:** los tres bucles marcados escriben **N
documentos** porque hay N entidades distintas (30 versículos subrayados = 30 docs). La
cuota de Firestore cuenta **documentos**, no viajes, así que agrupar con `writeBatch`
**no ahorraría cuota**. No los reporto como derroche de cuota — sería un hallazgo falso.
Lo que sí cuestan es latencia y exposición a fallo parcial (`R9-12`).

---

## 🐛 `R9-11` (P0, severidad **media-alta**) — una edición hecha durante un flush en vuelo se descarta en silencio

`src/lib/sync/SyncEngine.ts:1243-1247`

```ts
await this.pushOne(fn, item);
// Success — remove from queue (by reference match on
// collection+id, the only stable key).
this.queue = this.queue.filter(
  q => !(q.collection === item.collection && q.id === item.id),
);
```

La cola dedupea por documento: `upsertQueueEntry` (`:490-497`) **reemplaza la entrada en
sitio** con el comentario _"Replace existing pending write — newer wins"_. Y `flush()`
(`:1220-1238`) toma un **snapshot** de la cola y empuja los documentos **de a uno**,
esperando cada `pushOne`. La combinación abre una ventana:

1. Se encola el doc X (v1) → arranca `flush()`, snapshot = `[X_v1]`.
2. Mientras `await pushOne(X_v1)` está en vuelo, el usuario edita X otra vez → `queueWrite`
   entra por `upsertQueueEntry` y **reemplaza** la entrada: la cola pasa a ser `[X_v2]`.
   (Su propio `void this.flush()` retorna al instante por el guard `flushInFlight`, `:1221`.)
3. `pushOne(X_v1)` termina bien y el filtro borra **toda** entrada con ese
   `collection+id` — es decir, borra **`X_v2`**, que nunca se empujó.

El filtro compara identidad de documento, no versión: el propio comentario lo admite
("_the only stable key_"). El re-flush de cortesía del final (`:1296-1307`) no salva el
caso, porque para entonces la entrada ya no está en la cola.

**Escenario de fallo concreto:** el usuario subraya un versículo en amarillo y, mientras
el push viaja, lo cambia a verde. Localmente queda verde (SQLite es la fuente de verdad,
así que **en ese teléfono no se ve nada raro**). En Firestore queda **amarillo**, y ahí se
queda: su segundo teléfono, o el mismo tras reinstalar y restaurar, muestra amarillo. La
divergencia solo se repara si el usuario vuelve a tocar ese documento, o si un conflicto
posterior del lado de la bajada lo re-encola (`:1022-1043`).

**Por qué es P0 y no P1:** es pérdida silenciosa de datos de sincronización, y es
silenciosa en el peor sentido — el dispositivo que la origina nunca la ve. La ventana es
la latencia de un round-trip (decenas a cientos de ms), así que se necesita una segunda
edición del **mismo** documento dentro de ese lapso. Los tres bucles del inventario
escriben ids **distintos**, así que no chocan entre sí; el disparador realista es el
usuario que se corrige rápido (cambiar color de subrayado, re-guardar una nota).

**Confianza:** CONFIRMADO por lectura de las tres piezas (`upsertQueueEntry` reemplaza,
`flush` snapshotea y borra por `collection+id`, `queueWrite` reentra en el guard).
**Pendiente de sonda ejecutable** para dejarlo cerrado: encolar X, hacer que `pushOne`
cuelgue de una promesa controlada, encolar X con datos nuevos, resolver el push y afirmar
que la cola quedó vacía habiendo empujado solo v1.

**Forma del arreglo (no aplicado):** que el filtro compare también la identidad de la
entrada, no solo el documento — p. ej. un `seq` monótono por entrada, o comparar
`queuedAt`, y eliminar únicamente si sigue siendo la misma entrada que se empujó.

**Nota de pertenencia:** el defecto vive en `SyncEngine`, que es la fila **`A4`**; salió
en `A5` porque el inventario de call sites obliga a entender cómo drena la cola. `A4`
sigue `PENDIENTE` para el resto de su alcance (reintentos, conflictos, cursores,
hidratación).

---

## 💡 `R9-12` (P2, severidad **baja**) — no se usa `writeBatch` en ningún lado; los bucles empujan de a un documento

`src/lib/sync/SyncEngine.ts:1238-1240` empuja secuencialmente
(`for (const item of items) { await this.pushOne(fn, item); }`), y
`src/lib/sync/firestore.ts:94` lo dice explícito: _"Native module also exposes batch,
runTransaction etc., **not needed yet**"_.

Los tres call sites en bucle del inventario convierten eso en N round-trips secuenciales:
subrayar la selección entera de un capítulo (`chapter.tsx:1498+`), `resetDeck()` sobre un
mazo de cientos de tarjetas (`MemoryDeckContext.tsx:339-348`), y sobre todo la
restauración de un respaldo (`BackupService.ts:962-1029`), que recorre **cinco**
colecciones enteras.

**No es cuota** (Firestore cuenta documentos, y son N documentos igual). Lo que cuesta es
latencia y **exposición a fallo parcial**: si la red se cae a mitad de una restauración de
800 entidades, quedan unas empujadas y otras en cola. La cola se persiste
(`persistQueue`), así que no se pierden — por eso es P2 y no más.

**Arreglo sugerido (no aplicado):** agrupar el drenado en `writeBatch` de hasta 500
operaciones. Cruza con `A7` (`BackupService`), que puede evaluar el mismo punto desde la
óptica de atomicidad de la restauración.

---

## ✅ Verificado OK

- **Un solo punto de estrangulamiento.** Ninguna pantalla escribe a Firestore por su
  cuenta: 0 `addDoc`, 0 `updateDoc`, 0 `writeBatch`, y los `setDoc`/`deleteDoc` viven solo
  en el adaptador del SDK.
- **`memoryStatsSync.ts` cumple lo que promete** y merece seguir siendo el patrón de
  referencia: exige uid activo (`:122-124`), computa desde el log local, **dedupea por
  firma** y sale sin escribir si nada cambió (`:138-139`), y resetea el guard al cambiar
  de cuenta (`:127-131`). Un doc agregado, no una escritura por acción.
- **La migración de marcadores está bien contenida**: bandera en AsyncStorage
  (`BOOKMARKS_MIGRATION_FLAG_KEY`), se salta entera la parte remota si no hay sesión, y es
  idempotente por diseño documentado.
- **Las escrituras respetan la identidad**: `queueWrite`/`queueDelete` salen temprano si
  no hay `uid` (`:388`, `:413`), así que un usuario deslogueado no encola nada.
- **`suppressLocalWriteCount`** (`:389`, `:414`) evita el bucle de eco al aplicar cambios
  remotos — el clásico de "la bajada dispara una subida".
- **Los borrados usan tombstones** con `updatedAt`/`deletedAt` en vez de borrar y callar,
  que es lo correcto para que otros dispositivos vean el borrado.
- **Ningún call site escribe en un handler de scroll o de tecleo.** Los 13 cuelgan de una
  acción deliberada del usuario o de una restauración explícita.

## Dudas

- No verifiqué el lado de **lectura** (`onSnapshot`, 20 hits) más allá de constatar que
  existe; el coste de lecturas contra la cuota compartida queda para `A4`, que es donde
  vive la hidratación.
- `R9-11` está confirmado por lectura pero **sin sonda ejecutable**; la receta exacta está
  arriba y es barata de correr en una sesión futura.
