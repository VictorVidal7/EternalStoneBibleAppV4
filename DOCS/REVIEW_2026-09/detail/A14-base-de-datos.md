# A14 — Capa de base de datos (`src/lib/database/`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesiones 116 y 117 (2026-11-02) · Estado **🐛
> BUG** (cerrada en la 117)
>
> **Resultado:** 1 hallazgo (`R9-424`, P1), ninguno P0, más tres candidatos sin medir (esperan su tanda; los
> de dispositivo, Modo C). La 117 recorrió el alcance que faltaba, sin hallazgos nuevos (abajo, «Sesión
> 117»); `searchVerses`/`searchByBook` pasan a `A16`.
>
> **Cómo se midió:** el agente 2 de 3 (`fork` en worktree sobre `f6c7986`, solo midió; reglas en
> `_scratch/S116-agentes-reglas.md.txt`). Sondas con `_scratch/S116-correr.cjs.txt`. Copias en
> `_scratch/S116-sondas-agente-2/` (informe `S116-a2-informe.md.txt`). La sonda se re-midió en el principal y
> dio lo mismo; las líneas que sostienen el hallazgo, verificadas a mano.

## El área

`src/lib/database/index.ts` (2452 L) y sus vecinos: `data-loader`(`.web`), `pack-import`, `pack-catalog`,
`version-download-service`, `originals-download-service`, `nativeSeedAssets`, `sha256`, `storageLockError`.
Lo ya dicho: `R9-13`, `R9-24`, `R9-40`, `R9-44`, `R9-46`, `R9-51`, `R9-56`, `R9-75`, `R9-81`, `R9-87`,
`R9-96`, `R9-102`..`R9-109`. El BUG-6 de Fable (FTS5 `MATCH` sin «ir a referencia») es de `A16`.

## Hallazgo

**`R9-424` (P1): la versión descargada que el usuario eligió se pierde en cada arranque en frío.** El hook
vive en `src/hooks` (fila `A28`), pero es el contrato del registro de versiones de la base: `index.ts:1804-1807`
dice que «the CALLER refreshes the version registry».

- **El defecto:** la red de seguridad de `src/hooks/useBibleVersion.tsx:93-105` (si la elegida no está en
  `availableVersions`, cae a una empaquetada del mismo idioma) corre antes de que llegue la primera lectura de
  la base:
  - `installedVersionIds` arranca solo con las empaquetadas (`:47-48`);
  - `loadSavedVersion` (`:75-77`, `:107-123`) es un solo `getItem` y vuelve primero;
  - `refreshInstalledVersions` (`:59-69`) espera `bibleDB.initialize()` entero y además `getDatabaseStats()`
    (`index.ts:2417-2432`: un `COUNT(*)` y un `DISTINCT version` sobre ~93k filas);
  - cuando la base dice que KJV está instalada, la elegida ya es WEB, y con `hasExplicitChoice` en `true` el
    efecto de idioma (`:82-88`) no la corrige;
  - la red de seguridad no escribe `@bible_version`: en el arranque siguiente pasa lo mismo.
- **Camino:** Ajustes → Gestionar versiones → descargar KJV (o BSB, RV1909, SSE1569) → elegirla → cerrar la
  app → abrirla. `BibleVersionProvider` se monta por encima de todo al arrancar (`app/_layout.tsx:432`),
  mientras corre `initializeBibleData` (`:200-212`). Un usuario en inglés con KJV ve WEB; uno en español con
  RV1909 ve RVR1960, y tiene que volver a elegirla en cada arranque en frío.
- **Agravante (por lectura):** seis pantallas leen `@bible_version` directo del almacenamiento y siguen en la
  descargada: en la misma sesión, el lector muestra WEB y la Luz diaria o la Mesa muestran KJV. Misma raíz que
  el BUG-2 de Fable, por otro camino. `app/(tabs)/features/study.tsx:157`,
  `app/features/daily-light/index.tsx:123,276`, `app/features/prep/index.tsx:220`,
  `app/features/feelings/[feeling].tsx:68`, `share-faith/methods/[id].tsx:79`,
  `share-faith/objections/[id].tsx:71`.
- **Sonda:** `S116-a2-versionArranque.test.tsx.txt` (el `BibleVersionProvider` real; la base y el idioma `en`
  mockeados; `@bible_version` = `KJV`):

  | Caso        | Orden de llegada               | `selectedVersion`             | Final   |
  | ----------- | ------------------------------ | ----------------------------- | ------- |
  | (a)         | el `getItem` antes que la base | `RVR1960, WEB, KJV, WEB, WEB` | **WEB** |
  | (b) control | la base antes que el `getItem` | `RVR1960, WEB, WEB, KJV`      | KJV     |

  Lo único que decide es el orden de llegada; (a) es el del arranque real por lectura (un `getItem` contra la
  inicialización más dos consultas), sin medir en el dispositivo.

- **Propuesta (sin escribir):** que la red de seguridad espere la primera respuesta de
  `refreshInstalledVersions` (una bandera `installedKnown`).

## Candidatos sin medir

- **«Resetear datos de la Biblia» no refresca el registro de versiones** (P2, por lectura).
  `DataSettings.tsx:72-87` llama a `resetBibleData` (`data-loader.ts:144-166`: borra todas las filas y las
  banderas de todos los packs) y a `initializeBibleData` (vuelve a sembrar solo RVR1960 y WEB), sin
  `refreshInstalledVersions`. Con KJV elegida, el lector pide una versión sin filas, y Gestionar versiones la
  muestra «Instalada». Se corrige al reiniciar (y ahí manda `R9-424`). Lo que ve el lector con 0 versículos
  es una página en blanco sin mensaje (`detail/A13-lector-capitulo.md`, «Sin medir»): juntos, un camino de
  la app hasta ella. Sin sonda.
- **Dos descargas de pack a la vez comparten el alias `pack`** (P2, por lectura, baja probabilidad).
  `ManageVersionsSection.tsx:96-127` no deshabilita las otras filas mientras una descarga;
  `importVersionPack` (`index.ts:1809-1841`) hace `DETACH` tragándose el error y `ATTACH ? AS pack` fuera de
  la transacción. Lo probable: la segunda falla con el error genérico y se reintenta. El peor caso: si el
  `DETACH` de una cae entre el `ATTACH` y el `BEGIN` de la otra, KJV quedaría con el texto de BSB. Un mock de
  jest no modela ese orden: Modo C o SQLite real.
- **La copia del sembrado no es atómica** (clase `A12`, ventana estrecha). `index.ts:306-317` copia
  `assets/bible-seed.db` (21,8 MB) directo sobre `SQLite/bible.db`; si el proceso muere a mitad en el primer
  arranque, el siguiente ve el archivo (`:310`), no copia y abre uno truncado. Necesita un dispositivo. Si se
  confirma, es un disparador de arranque roto que `A12` no listó. Arreglo natural: copiar a un temporal y
  renombrar.

## Revisado ✅

- **Mayúsculas de las versiones:** `BIBLE_VERSIONS` y el catálogo publicado (`KJV`, `BSB`, `RV1909`,
  `SSE1569`) coinciden con las filas sembradas (la frase de `index.ts:1978-1979` sobre ids en minúscula no se
  sostiene, pero es inocua).
- **`executeSql`** (`:1639-1722`): en un DML sin parámetros descarta `changes`; ningún llamador lo lee.
- **Overlays de glosas y definiciones:** tablas propias; `importOriginalsPack` no los toca.
- **Descarga de pack:** lista blanca de URL, espacio, tamaño exacto y sha256, limpieza en `finally`; un pack
  corrupto no llega a `importVersionPack`. Lo cubren `packCatalog`, `packImport`, `sha256` y
  `version-download-service.test.ts`.
- **`deleteVersion`:** protege las empaquetadas, `COLLATE NOCASE`, y el trigger limpia el FTS.
- **La puerta de versión de la web:** `R9-102`..`R9-109` y `dataLoaderWebVersionGate.test.ts`.
- **Migraciones:** `createSchema` es idempotente (`databaseMigrations.test.ts`); `migrateBookmarksToFavorites`
  corre en una transacción.

## No alcanzable

- **Packs actualizados:** el re-importe con `INSERT OR IGNORE` no actualizaría un texto corregido, pero en
  nativo no hay versión de pack ni camino de la interfaz para actualizar uno instalado.
- **`DELETE FROM verses_fts` en el reset:** redundante (el trigger ya limpió) e inocuo.

## Sin medir (alcance) — recorrido en la 117

- ~~Los llamadores de `getDb()` que no llaman a `initialize()` antes~~: ✅ en la 117 (abajo).
- ~~`originals-download-service.ts` y `nativeSeedAssets.ts`~~: ✅ en la 117 (abajo).
- `searchVerses` y `searchByBook` con entrada real: son de `A16`.

## Sesión 117 (2026-11-02): el alcance que faltaba, sin hallazgos nuevos

En el principal, sin agentes, por lectura (`d6b3f05`).

- **Los llamadores de `getDb()` sin `initialize()` ✅.** `getDb()` (`index.ts:459-464`) solo mira `this.db`,
  que existe desde `:398`, antes del esquema y de los sembrados; 28 métodos públicos no llaman a
  `initialize()` (`getChapter`, `getVerse`, `searchVerses`, notas, favoritos, `getDatabase`, `executeSql`…).
  Nadie llega a ellos antes de tiempo:
  - la pila de pantallas no se monta hasta que `initializeBibleData` termina (`app/_layout.tsx:210-227`,
    `:283`), y esa espera `bibleDB.initialize()` entero (`data-loader.ts:21`); un fallo ahí cae a la pantalla
    de error (`:273-280`, clase `A12`);
  - lo que corre antes (providers) o fuera de la app llama a `initialize()` primero, que espera la promesa en
    curso: `useBibleVersion.tsx:61`, `FavoritesContext.tsx:157,179,237,261`, los adaptadores de sync
    (`notes.ts:74,94,126,141`, `highlights.ts:79,97,129,146`; el de notas es el arreglo de `R9-46`),
    `reviewEventStore.ts:53,82,104,139`, `WidgetTaskHandler.ts:31` (tarea sin cabeza),
    `NotificationService.ts:250`, `PredictiveCache.ts:50`, `BadgeSystem.ts:80`, `VersionComparison.ts:62`.
  - La única excepción, `FavoritesContext.tsx:220-229` (`applyRemoteDelete` sin `initialize()`, error
    tragado), solo la alcanza el borrado duro de `SyncEngine.ts:1984-1997`, que va después de leer el doc
    del servidor; el borrado normal (lápida) pasa por `getLocal` (`:2144`), que inicializa. Sin camino
    concreto en la ventana del arranque: no es hallazgo.
- **`originals-download-service.ts` ✅.** A diferencia de los packs de versión, no verifica tamaño ni
  sha256 del archivo bajado, pero nada se pierde: `importOriginalsPack` (`index.ts:1275-1311`) borra y vuelve a
  llenar dentro de una transacción, así que un 200 que no es una base, o un archivo cortado (SQLite lo da por
  corrupto al abrirlo: la cabecera cuenta más páginas que el archivo), revierte y deja lo instalado como
  estaba. `importLocalOriginalsIfPresent` (`:132-145`) no borra un archivo cortado que no pudo importar: se
  reintenta en cada apertura de la hoja hasta la próxima descarga, que lo pisa (costo, sin daño). El sha que
  se guarda (`:179-182`) es el del `originals-meta.json` leído después, no el del archivo; sin camino
  concreto en que difieran.
- **`nativeSeedAssets.ts` ✅.** Tres resolvedores de `expo-asset` de 5 líneas; el `require` vive dentro de
  cada función a propósito (el `.web.ts` no los ve). La copia del sembrado que los usa ya es un candidato (la
  copia no atómica, arriba).
- **Cruce con las filas vecinas (§5, sesión 116):** el único «sin medir» que sigue es de `A16`
  (`searchVerses`/`searchByBook`); los tres candidatos de arriba esperan su tanda y no cambian.

## Para la fila `A31` (código muerto), sin barrer

`clearAllData` (`index.ts:2434`) e `isFavorite` (`:2369`) no tienen llamadores.
