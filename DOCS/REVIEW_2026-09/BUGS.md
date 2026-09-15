# 🐛 Bugs — Revisión profunda 2026-09

> Resumen corriente de todo lo marcado `🐛 BUG` en [`INDEX.md`](INDEX.md), P0 primero.
> Cada entrada lleva: severidad, área del índice, `file:line`, pasos de repro y
> evidencia. **Nada aquí se arregla en esta revisión** — arreglar es una sesión aparte
> (charter §1).
>
> Numeración: `R9-1`, `R9-2`, … (el prefijo evita confundirlas con los `BUG-N` de la
> revisión Fable de julio).
>
> `main` está verde (`npm run validate` pasa), así que **cualquier fallo nuevo que esta
> revisión haga aparecer es una regresión real.**

---

## P0 — dinero, identidad, pérdida de datos, seguridad

- **`R9-9` (A1, entitlements) — 🐛 la revocación de la entitlement premium no se propaga
  nunca.** Severidad **alta**. Es dinero: acceso de pago que sobrevive al reembolso, y
  premium gratis para el segundo usuario de un dispositivo compartido.
  `src/lib/offering/offeringService.ts:121` corta con
  `if (unlocked === lastKnownUnlocked) return;`, y `lastKnownUnlocked` se inicializa a
  `false` en cada arranque del proceso (`:112`). En cualquier arranque en el que
  RevenueCat reporte la entitlement **inactiva**, ese dedupe (`false === false`) corta
  **antes** de `setCachedEntitlement(unlocked)` (`:123`) y **antes** de notificar a los
  listeners (`:124-133`). Un `'true'` viejo en la caché de `expo-secure-store` no se
  corrige jamás. `PremiumContext` se siembra de esa caché al montar
  (`src/context/PremiumContext.tsx:57-61`) y después solo escucha **cambios** (`:64-66`)
  — que ya no van a llegar.
  **Nada lo repara:** `grep` de `SecureStore` sobre `src/` + `app/` da **cero** usos
  fuera de `entitlementCache.ts`. Ni el cierre de sesión, ni el borrado de cuenta, ni el
  reset de Ajustes limpian la clave; y `linkUser()` está documentado a propósito para no
  revocar en el sign-out (`offeringService.ts:200-205`). Solo una desinstalación la
  borra.
  **Repro (verificado con sondas contra el `PremiumContext` y el `offeringService`
  reales + el mock oficial de `react-native-purchases`):** con la caché en `'true'` y
  RevenueCat reportando inactiva → `isPremium = true`, caché en disco `'true'`, y sin
  embargo `getLastKnownEntitlement() = false`. Igual con `linkUser('uid-B')` de un
  usuario sin compra. El **control** en la dirección contraria (caché vacía + RevenueCat
  activa) sí funciona: **el defecto es asimétrico, solo falla la dirección que quita el
  acceso.**
  **Corroboración:** `src/components/settings/ColorThemeSettings.tsx:60-74` tiene un
  `useEffect` cuyo comentario nombra el escenario textualmente ("_the entitlement is
  later revoked (e.g. a refund)_"). Ese revert depende de que `isPremium` pase a `false`,
  que es justo lo que este bug impide. Igual en `ReaderPreferencesSheet.tsx:128-150`.
  **Arreglo sugerido (no aplicado):** el dedupe está bien para no notificar de más; lo
  que está mal es tomar `false` como estado inicial **conocido** cuando en realidad es
  "todavía no sé". Opciones: (a) sembrar `lastKnownUnlocked` desde la caché en
  `initialize()`; (b) escribir siempre la caché y dejar el dedupe solo para la
  notificación; (c) `lastKnownUnlocked: boolean | null` con `null` = sin resolver.
  Detalle completo en `detail/A1-premium-revenuecat.md`.

- **`R9-10` (A1, `PremiumContext`) — 🐛 la lectura tardía de la caché pisa el valor real
  de RevenueCat.** Severidad **media** (se auto-repara en el siguiente arranque), pero el
  usuario afectado es, por definición, uno que **ya pagó**.
  En `src/context/PremiumContext.tsx:54-72` la lectura asíncrona de caché y el listener
  de RevenueCat escriben el mismo estado sin orden garantizado; si el push de RevenueCat
  llega primero, el `setIsPremium(unlocked)` incondicional de la línea **59** lo
  sobrescribe con el valor viejo. Contradice el contrato que declara el propio docstring
  del módulo (`:5-8`: "_those come from RevenueCat's CustomerInfo … and win over anything
  written here_").
  **Repro (verificado, determinista, sin timers):** difiriendo la resolución de
  `getPremiumUnlocked()` y disparando entremedio `initialize()` con la entitlement activa
  → `tras push de RevenueCat: isPremium = true` … `tras resolver la caché: isPremium = false`.
  **Escenario:** usuario que pagó, arranque en frío con la primera lectura de
  `expo-secure-store` lenta (init del keystore de Android) y la caché aún sin reflejar la
  compra — p. ej. tras reinstalar, o tras una escritura fallida, porque
  `entitlementCache.ts:43-48` **se traga los errores de escritura**. Queda premium
  bloqueado toda la sesión.
  **Arreglo sugerido (no aplicado):** ignorar el resultado de la lectura de caché si un
  valor del listener ya llegó (basta un `ref` de "ya resuelto por RevenueCat"), en vez del
  `setIsPremium` incondicional de la línea 59.

- **`R9-11` (A5/A4, `SyncEngine`) — 🐛 una edición hecha durante un flush en vuelo se
  descarta en silencio.** Severidad **media-alta**. `SyncEngine.ts:1243-1247` borra de la
  cola por `collection+id` tras un push exitoso, sin mirar versión; `upsertQueueEntry`
  (`:490-497`) reemplaza la entrada en sitio ("newer wins"). Si el usuario reedita el mismo
  doc mientras `pushOne` está en vuelo, el filtro elimina la entrada **nueva** como si se
  hubiera empujado. **Escenario:** subraya en amarillo, lo cambia a verde durante el push →
  local queda verde, Firestore se queda **amarillo** para siempre; el teléfono que lo
  origina nunca lo ve. **Arreglo:** comparar identidad de entrada (`seq`/`queuedAt`), no
  solo de documento. Detalle: `detail/A5-escrituras-firestore.md`.

- **`R9-13` (A6, web) — 🐛 el lector web crashea en el primer render:
  `hasRedLetterData is not a function`.** Severidad **alta**.
  `ReaderPreferencesSheet.tsx:56` importa el símbolo del especificador **pelado**; en web
  Metro resuelve a `redLetterText.web.ts`, que **no lo exporta** (verificado). La llamada de
  `:121` está en el cuerpo del componente, así que corre aunque la hoja esté cerrada, y
  `BibleVersionProvider` **sí** está montado en web (`_layout.web.tsx:294`), de modo que el
  cortocircuito `!!selectedVersion &&` no protege. Como el `ErrorBoundary` es global y no
  hay boundary por ruta, **cae la app web entera**. Afecta a las 2 pantallas que renderizan
  la hoja en web: lector de capítulo (`chapter].web.tsx:358`) y entrada de diccionario
  (`dictionary/[slug].tsx:750`). **Regresión fechada:** `d753a6e` (2026-08-18). Invisible
  para `tsc` (resuelve al nativo) y para jest (preset nativo).
  **✅ RESUELTO 2026-09-03 el "¿está en producción?": NO, y por 5 días.** El último deploy
  de Firebase Hosting es del **2026-08-13T04:39Z** (consultado por la API de Hosting con la
  credencial cacheada de `firebase-tools`, patrón de
  `reference_essb-firebase-cli-token-for-rules-api`; los 7 releases del historial son del
  2026-07-09 al 2026-08-13). La regresión entró el **2026-08-18**, o sea **5 días después
  del último deploy**. **El sitio vivo está sano; el bug está armado.** Por tanto no es un
  incidente activo, pero **sí es bloqueante del próximo `firebase deploy`**: publicar hoy
  rompe el lector web. Tratarlo como release-blocker, no como P0 en curso.
  Detalle: `detail/A6-paridad-web-native.md`.

- **`R9-14` (A6, web) — 🐛 7 rutas web-alcanzables lanzan "must be used within a
  …Provider".** Severidad **media** (código P0, impacto acotado). El árbol web no monta
  `AuthProvider`, `ReadingProgressProvider`, `ReadingPlanProgressProvider`,
  `CustomPlansProvider`, `TogetherProvider` ni `DonationSheetProvider`, y sus hooks lanzan.
  Con el rewrite catch-all de `firebase.json`, una URL directa a `/features/timeline` (o
  badges, version-comparison, reading-insights, plan/[id], plan-builder, together) tumba la
  SPA entera. T21 arregló 4 hooks; faltaron estos 5. Conteo real **≥ 7** (no se barrió
  `src/`). Detalle: `detail/A6-paridad-web-native.md`.

- **`R9-22` (A3, sync) — 🐛 la cola de escrituras pendientes no está namespaceada por uid:
  lo que quedó sin subir de la cuenta A se escribe en la nube de la cuenta B.** Severidad
  **alta**. Verificado: `SyncEngine.ts:54` (`@sync_queue_v1`, sin uid), `types.ts:88-101`
  (`PendingWrite` sin uid), `:351` (`stop()` conserva la cola a propósito), `:1315`
  (`pushOne` escribe contra `this.uid`, el **activo ahora**). **Escenario:** Ana edita sin
  red y cierra sesión; Beto entra en el mismo teléfono; la cola se drena contra el uid de
  Beto — y como los ids de `memoryCards` son el `verseKey`, **estables entre usuarios**, la
  lápida de Ana borra la tarjeta de Beto en todos sus dispositivos. Peor si Ana acababa de
  importar un respaldo (`BackupService.ts:973-1026` encola su biblioteca entera).
  **Contraste que lo delata:** los cursores **sí** están namespaceados por uid (`:177`) y el
  flag de bulk push también (`:1146`). Detalle: `detail/A3-auth-borrado-cuenta.md`.

- **`R9-23` (A3, identidad) — 🐛 los datos locales del usuario anterior se suben en silencio
  a una cuenta de Google _nueva_.** Severidad **alta**. El prompt de migración vive **dentro
  del `catch`** de `auth/credential-already-in-use` (`AuthContext.tsx:378-428`); la rama de
  **éxito** de `linkWithCredential` (`:340-377`) no pregunta nada. **Escenario:** Ana cierra
  sesión (lo local se queda, por diseño) → sesión anónima sobre su almacén → Beto entra con
  un Google que nunca usó la app → `linkWithCredential` tiene éxito → sin prompt →
  `maybeRunInitialBulkPush` sube **todas** las notas privadas de Ana a `users/{uidBeto}/`.
  Ana ya no puede borrarlas. **Arreglo:** persistir `@local_store_owner_uid` y disparar el
  `askMigration()` que ya existe cuando el dueño difiere del uid entrante.
  Detalle: `detail/A3-auth-borrado-cuenta.md`.

- **`R9-27` (A7, respaldo) — 🐛 una sección degradada en el export es indistinguible de una
  vacía, y al importar BORRA los datos buenos.** Severidad **alta**. Verificado:
  `BackupService.ts:569` devuelve `{payload, degradedSections}` — la marca es **hermana** del
  payload y **nunca entra al archivo**; muere en `DataSettings.tsx:88-99`. La guarda
  `allRowsFailedValidation` (`:915-920`) solo salta con `sourceLen > 0`, así que una sección
  degradada pasa como "vacío legítimo". **Escenario:** una lectura SQLite lanza durante el
  export (7 lecturas en `Promise.all`, y el wrapper documenta fallos intermitentes) → el
  archivo sale con `"favorites": []` → meses después el import hace `DELETE` + 0 inserts y
  dice «importada correctamente». Con `prep.notes: null` es peor: los parsers devuelven `{}`
  **truthy**, así que se escribe `"{}"` y **la Mesa queda vacía**. Mesa, progreso por
  capítulo y logros **no tienen copia en la nube**: pérdida definitiva.
  Detalle: `detail/A7-backupservice.md`.

- **`R9-28` (A7, respaldo) — 🐛 ningún contexto se recarga tras el import y la UI no pide
  reiniciar: el estado en memoria reescribe encima de lo restaurado.** Severidad **alta**.
  El docstring de `importBackup` (`:1073-1074`) afirma _"see Settings' import handler, which
  asks the user to close and reopen the app"_ — **verificado que la UI no lo hace**:
  `importSuccess` es solo «Copia de seguridad importada correctamente.» en un toast
  (`DataSettings.tsx:147`). **Escenario:** el import escribe `@memory_deck`;
  `MemoryDeckContext` sigue montado con el mazo viejo en `useState`; el primer repaso
  dispara el `useEffect` de `:192-197` y persiste el mazo **anterior**. El mazo restaurado
  desaparece sin toast, sin error, sin log. Mismo patrón en `ReadingProgressContext`,
  preferencias de lector, tema y planes. Detalle: `detail/A7-backupservice.md`.

- **`R9-33` (A4, `SyncEngine`) — 🐛 no hay backoff: una escritura se descarta en silencio
  tras 8 intentos, y Ajustes dice «sincronizado».** Severidad **alta**.
  `src/lib/sync/SyncEngine.ts:1255-1276`. El backoff que la documentación promete **no
  existe**: `queuedAt` está documentado en `types.ts:98` como _"Used for retry backoff"_ y
  `netinfo.ts:66` justifica haber aflojado la puerta de red diciendo que _"our own queue
  retries with backoff"_ — pero `queuedAt` se **escribe** en 3 sitios (`:402`, `:426`,
  `:1186`) y **no se lee en ninguno** (`grep` verificado a mano). Agotados los 8 intentos,
  el `splice` borra la entrada y `persistQueue()` graba el descarte. **Y el usuario no
  recibe señal alguna:** `lastError` tiene **cero** consumidores fuera de `src/lib/sync/`
  (verificado a mano), y el indicador de Ajustes (`app/(tabs)/settings.tsx:87-112`) se
  construye solo con `pendingWrites`/`isOnline`/`lastSyncedAt` — no tiene rama de error.
  Al descartarse la última entrada `pendingWrites` cae a 0 y la UI afirma «Sincronizado
  hace un momento» en el mismo instante en que el motor tiró la escritura.
  **Repro (sonda ejecutable, re-corrida esta sesión contra el `SyncEngine` real):** con
  `doc.set()` rechazando siempre, `attempts` recorre `[1..7]` y a la 8ª la cola queda
  vacía; `mockDocSets` = 0; `pendingWrites` = 0. **Tiempo en agotar los 8 reintentos: 1
  ms** — la prueba más directa de que no hay espera de ninguna clase. Detalle:
  `detail/A4-syncengine.md`.

- **`R9-34` (A4, `SyncEngine`) — 🐛 la rama de ERROR de `flush()` pisa la reedición con el
  snapshot viejo (gemelo de `R9-11`).** Severidad **media-alta**.
  `src/lib/sync/SyncEngine.ts:1256-1263`. `R9-11` es la rama de éxito; ésta es la de
  error, otra línea y otro arreglo. `item` viene del snapshot `items = [...this.queue]`
  tomado al empezar el flush; si el usuario reeditó el documento mientras `pushOne` estaba
  en vuelo, `this.queue[idx] = {...item, attempts: item.attempts + 1}` **sobrescribe la
  entrada nueva con la vieja**. Es **peor que `R9-11`**: allí la versión nueva seguía en el
  almacén local y solo la nube se quedaba atrás; aquí retrocede **la cola misma**, así que
  ni un reintento posterior con éxito subirá la edición nueva. **Repro (sonda):** cola
  antes del fallo `{"value":"v2-REEDITADO","updatedAt":2000}`; después del rechazo
  `{"value":"v1","updatedAt":1000,"attempts":1}`. Conviene arreglarlo junto con `R9-11`.
  Detalle: `detail/A4-syncengine.md`.

- **`R9-35` (A4, `SyncEngine`) — 🐛 un `updatedAt` en el futuro fija el cursor por delante
  del reloj y la bajada se detiene para siempre.** Severidad **media-alta**.
  `src/lib/sync/SyncEngine.ts:800-826` (`advanceCursor`) + `:588` (el suelo de la query).
  `advanceCursor` valida finito, positivo y mayor que el actual, pero **no que no esté en
  el futuro** (verificado a mano: no hay techo). `updatedAt` es reloj de **cliente**
  (`queueWrite:396-400`), y `handleSnapshot` incorpora al cursor también los ecos de las
  propias escrituras del dispositivo (`:684-697`), así que un teléfono con la hora
  adelantada se envenena a sí mismo. Corregido el reloj, toda escritura posterior cae
  **por debajo** del suelo `cursor - 5min` y el listener deja de entregar. El cursor nunca
  retrocede por diseño y **no existe ninguna ruta que lo resetee** (`grep` de
  `cursorStorageKey|sync_cursor` fuera de `SyncEngine.ts`: **cero**, verificado a mano) →
  el único remedio es reinstalar. **Acaba en pérdida de datos:** mientras A no recibe, el
  usuario edita en A un documento que ya cambió en B; el `updatedAt` de A es más nuevo y
  el siguiente push **machaca en la nube el cambio de B**. **Repro (sonda):** con un doc a
  `ahora + 30 días`, tras reiniciar con el reloj correcto el suelo queda 30 días en el
  futuro y una nota legítima de hoy **no llega nunca**. Detalle: `detail/A4-syncengine.md`.

- **`R9-36` (A4, conflictos) — 🐛 «conservar lo mío» empuja el snapshot de la detección y
  revierte lo que el usuario escribió después.** Severidad **media**.
  `src/lib/sync/SyncEngine.ts:1020-1023` + `app/(tabs)/conflicts.tsx:89,120,230,371`.
  `conflict.localVersion` es una foto del documento **en el momento de detectarse** el
  conflicto (`types.ts:130`); `resolveConflict('keepMine')` la reenvía re-sellada con
  `updatedAt: now` y no toca el almacén local, apoyándose en el comentario _"local store
  already has this value"_ — cierto **solo** si el usuario no tocó el documento desde
  entonces, cosa que nada garantiza (los conflictos esperan a que entre a la pantalla). La
  pantalla tampoco relee lo local: pinta y siembra el borrador de fusión desde el mismo
  snapshot. Si la edición intermedia fue hace más de `CONFLICT_WINDOW_MS` (30 s) no se
  detecta conflicto nuevo y LWW aplica el valor viejo encima: **el botón «conservar lo
  mío» destruye justamente "lo mío"**. **Repro (sonda):** local al pulsar
  `"parrafo original + PARRAFO NUEVO QUE ACABO DE ESCRIBIR"`; empujado
  `{"value":"parrafo original","updatedAt":1000}`. **Alcance acotado** (hacen falta dos
  dispositivos dentro de 30 s), por eso media pese a ser pérdida de texto escrito a mano.
  Detalle: `detail/A4-syncengine.md`.

- **`R9-38` (A4, `SyncEngine`) — 🐛 lo que se edita con la sesión cerrada no se sube nunca,
  y nada lo reconcilia después.** Severidad **media**.
  `src/lib/sync/SyncEngine.ts:388`, `:413` + `:1163-1170`. `queueWrite`/`queueDelete` son
  no-op sin `uid` — correcto como diseño local-first (`A5` lo dio OK) — pero **no hay
  ninguna pasada de reconciliación posterior**. El único mecanismo que sube el estado local
  completo es `maybeRunInitialBulkPush`, que corta si el flag por uid vale `'2'`/`'skip'`,
  justo lo que quedó grabado en la primera sesión. Verificado a mano:
  `@sync_first_push_done:` y `@sync_queue_v1` **solo aparecen dentro de `SyncEngine.ts`** —
  ni el cierre de sesión, ni el borrado de cuenta, ni el reset de Ajustes los tocan.
  **Escenario:** cierra sesión, usa la app una semana (notas, subrayados, tarjetas) y
  vuelve a entrar **con la misma cuenta**: esa semana se queda solo en el teléfono, y como
  LWW compara timestamps lo local es más nuevo y nada delata la divergencia. **Repro
  (sonda):** flag = `'2'`, 3 notas con el motor detenido, cola = 0 entradas, documentos
  empujados tras `start()` = `[]`. Detalle: `detail/A4-syncengine.md`.

- **`R9-39` (A4, conflictos) — 🐛 un conflicto pendiente lo entierra el cursor que adelanta
  cualquier OTRO documento de la misma colección.** Severidad **media**.
  `src/lib/sync/SyncEngine.ts:698-708` + `:360-363`. El motor retiene a propósito del
  cursor la marca del documento en conflicto, pero **la retención es inefectiva**: el
  cursor es un escalar por colección y `maxSeenUpdatedAt` recoge el máximo de **todos los
  demás** documentos, así que basta con que llegue uno más nuevo para saltar por encima del
  conflictivo. Y `stop()` borra la lista de conflictos apoyándose en una promesa explícita
  del comentario (_"fresh onSnapshot events will re-detect any still-divergent docs"_) que
  **es falsa** en cuanto el cursor haya adelantado. El conflicto desaparece sin resolver,
  sin aviso y sin registro, y los dispositivos quedan divergentes hasta que alguien toque
  el documento — momento en el que LWW **elimina en silencio el otro lado**, que es
  exactamente lo que el sistema de conflictos existe para evitar. **Repro (sonda):**
  conflicto detectado y cursor retenido en 0; llega otra nota cualquiera y el cursor salta;
  tras reiniciar, conflictos re-detectados = **0**. Detalle: `detail/A4-syncengine.md`.

> **`R9-44`..`R9-64` vienen del fan-out de 4 de la sesión 6** (filas `A8`–`A11`). Están
> **probados con sondas ejecutables de los agentes** pero **PENDIENTES de la
> re-verificación a mano del orquestador** (regla fija de `CONTINUAR.md` §5: los agentes
> aciertan el mecanismo y fallan el detalle). Trátalos como más que una lectura y menos que
> un hecho re-verificado hasta que esa pasada ocurra.

- **`R9-44` (A8, subrayados) — 🐛 cambiar el color de un subrayado desde el lector BORRA la
  nota y la categoría que el usuario le había escrito.** Severidad **alta**.
  `app/(tabs)/verse/[book]/[chapter].tsx:1504-1510` llama `addHighlight(...)` con **5
  argumentos**, omitiendo `category` y `note`; `HighlightService.ts:56-104` hace
  `INSERT OR REPLACE` sobre `UNIQUE(verse_id)` escribiendo `category || null` y `note || null`
  (`:94-95`) → **pisa con `NULL`**. Sin lectura previa, sin confirmación, y el lector ni
  siquiera indica que ese versículo tiene nota. También resetea `created_at`. **Agravante:**
  el payload sube sin la nota y `pushOne` usa `{merge:true}` (`SyncEngine.ts:1323`), así que
  **Firestore conserva la vieja** → el teléfono la pierde, la nube la mantiene, un
  dispositivo nuevo la resucita. **Repro (sonda, 9/9):** `params[6]`/`params[7]` a `null` en
  la llamada literal de `:1504`. Detalle: `detail/A8-notas-subrayados.md`.
- **`R9-45` (A8, sync) — 🐛 una lápida en `highlights` nunca se limpia: volver a resaltar el
  MISMO versículo no llega jamás a los otros dispositivos.** Severidad **alta**. El adaptador
  usa el `verseId` como id de documento —**clave natural REUTILIZABLE**, decisión documentada
  en `adapters/highlights.ts:19-25`—, `queueDelete` pone `deleted:true`
  (`SyncEngine.ts:412-429`) y el `queueWrite` posterior **nunca pone `deleted:false`**
  (`:387-406`); bajo `merge:true` (`:1323`) el doc queda con color nuevo **y** `deleted:true`
  para siempre, y todo otro dispositivo lo lee como lápida (`:669`). **Se extiende a NOTAS**
  por `BackupService.ts:993-995` (restaurar un respaldo que contiene una nota ya borrada).
  **Repro (sonda):** tras `queueDelete` + `queueWrite`, `doc.color === '#A5D6A7'` **y**
  `doc.deleted === true`; ese doc en un segundo engine produce `DELETE FROM highlights` y
  ningún `INSERT`. Detalle: `detail/A8-notas-subrayados.md`.
- **`R9-46` (A8, sync) — 🐛 `notesSyncAdapter.getLocal` falla ABIERTO: si la BD aún no está
  lista, una copia remota VIEJA pisa la nota local más nueva.** Severidad **alta**.
  `adapters/notes.ts:50-56` es **el único de los 4 métodos del adaptador que NO llama
  `bibleDB.initialize()`** (los otros sí, `:77`/`:109`/`:122`; el de subrayados lo hace en los
  cuatro). `getNotes()` lanza `"Database not initialized"` y `findNoteById` **captura y
  devuelve `null`**, indistinguible de "no existe" → el motor **se salta el LWW y la detección
  de conflictos** (`SyncEngine.ts:716`, `:744-747`). **La ventana está abierta en cada arranque
  en frío:** los efectos de React corren de hijo a padre, así que `SyncEngineProvider` arranca
  antes de que `ServicesProvider` llame `database.initialize()` (`app/_layout.tsx:433-435`,
  `ServicesContext.tsx:94`), y esa init copia un `bible.db` de varios MB. **Repro (sonda, con
  el motor y el adaptador reales):** local `updatedAt=9_000_000` vs remoto `5_000_000` → se
  ejecuta `INSERT OR REPLACE INTO notes` con el texto viejo; el control con la BD sana no
  inserta nada. Detalle: `detail/A8-notas-subrayados.md`.
- **`R9-47` (A9, Mesa) — 🐛 `load()` no tiene guarda de obsolescencia: una carga vieja que
  llega tarde pisa los `drafts`, y el siguiente `onBlur` escribe esa prosa ajena (o vacía)
  sobre la clave del pasaje visible.** Severidad **alta**. Es dato irreemplazable: el sermón
  escrito a mano. `app/features/prep/index.tsx:464` es un `useCallback` con deps
  `[table, params.version]` en un `useEffect` **sin cleanup**; cada toque del stepper arranca
  una carga nueva sin cancelar la anterior (no hay request-id ni comprobación de pasaje) y
  `setDrafts` (`:592`) / `setTemplate` (`:598`) se aplican incondicionalmente. `handleNoteBlur`
  (`:1053-1065`) no lee el `TextInput` sino el estado, y escribe `drafts[section] ?? ''` **bajo
  `table.passageKey`**; el `?? ''` convierte una prosa ausente en un **borrado**
  (`prepNotes.ts:157-170`). **Repro (3 sondas, 3 consecuencias):** con dos toques («+ Fin»,
  «− Fin») la nota queda **borrada**; o **reemplazada por el sermón del otro rango**; o la
  carga arrastra el **template ajeno** y lo que se escriba queda bajo un id de sección que la
  plantilla nunca devuelve → **invisible para siempre** (no se re-renderiza, no sale en PDF, ni
  en «copiar esquema», ni en el Historial). **Segundo disparador sin carrera:** `table` depende
  de `isPremium` (`:328`), así que un cambio de titularidad de RevenueCat re-corre `load()`
  sobre el mismo pasaje. Detalle: `detail/A9-mesa-persistencia.md`.
- **`R9-48` (A10, identidad) — 🐛 el log de repasos nunca se borra al cerrar sesión: el
  historial del usuario A se escribe dentro de la cuenta del usuario B y destruye su
  agregado.** Severidad **alta**. `AuthContext.tsx:471` (y `:572`) solo llama
  `clearMemoryStatsFloor()`; su docstring lo admite: _"Does NOT touch the local review-event
  log"_ (`memoryStatsSync.ts:176`). La tabla `review_events` **nunca está uid-scoped** y nada
  la borra fuera de `BackupService` (`grep "DELETE FROM review_events" src/` → 1 hit). Rompe
  las dos mitades: el floor de B **no se siembra nunca** (`:89-90`), y
  `maybeWriteMemoryStatsSummary()` combina `getActiveUid()`=B con los eventos de A y hace
  `.set()` — **sobrescritura total, no merge** (`:140-143`). Como `reviewEvents` ya no
  sincroniza, ese doc era **el único ancla de B en la nube**. **Mecanismo DISTINTO de
  `R9-22`/`R9-23`** (no pasa por la cola del `SyncEngine`): **namespacear la cola no lo
  arregla.** **Repro (sonda):** `mockDocGet` nunca llamado; se escribe a
  `users/uid-B/memoryStats` con `longestStreak: 5` donde B tenía `400`. Detalle:
  `detail/A10-memoria-srs.md`.
- **`R9-49` (A11, respaldo) — 🐛 los 4 logs de lectura no pueden marcarse "degradados", así
  que un fallo transitorio de SQLite produce un archivo que al importar BORRA la racha y los
  ledgers.** Severidad **alta**. `safeQuery` (`BackupService.ts:356-371`) solo marca degradado
  desde su `catch`, pero `getReadingLog()`, `getCompletedBooks()`, `getBookReadingLog()` y
  `getChaptersReadLog()` (`AchievementService.ts:855`/`:879`/`:912`/`:944`) **se tragan su
  propia excepción** y devuelven `[]` → la bandera `degradedSections` es **código
  físicamente inalcanzable** para las 4 secciones que contienen toda la historia de lectura.
  Al importar, `allRowsFailedValidation` exige `sourceLen > 0` (`:937-942`), con `[]` da falso,
  y `restoreBackup` ejecuta **`DELETE FROM reading_streak_log`** con 0 inserts (`:1054-1063`).
  **Remate:** `recomputeReadingStreak()` corre en **cada** `initialize()` (`:128`) y hace
  `UPDATE user_stats SET longest_streak = ?` **sin `MAX()`** (`:530-533`), así que el récord
  restaurado se sobrescribe con 0 en el arranque siguiente. **Canal distinto y peor que
  `R9-27`** (allí la marca existe y no llega al archivo; aquí **no se levanta nunca**):
  **arreglar `R9-27` NO cierra esto.** **Repro (sonda):** con un `db` que siempre lanza, los 4
  getters devuelven `[]` y `degradedSections` sale vacío, mientras `getRawUserStats()` sí se
  marca. Detalle: `detail/A11-progreso-rachas.md`.

---

## P1 — núcleo de la app

- **`R9-15` (A6, tests) — 🐛 el único test que renderiza el lector web enmascara
  exactamente `R9-13`.** `__tests__/chapterReaderWebFontPicker.test.tsx:41` mockea el
  especificador **`.web` explícito**, pero el componente importa el **pelado**; con preset
  nativo ese import carga el archivo nativo (que sí exporta el símbolo) y el mock nunca se
  aplica. Por eso `d753a6e` se mergeó con CI verde. **Arreglo:** redirigir el especificador
  pelado, como ya hace `webStubProviders.test.tsx:516-532`.

- **`R9-16` (A2, dinero) — 🐛 `restore()` confunde "no tienes compra" con "falló la red".**
  `offeringService.ts:325-331` devuelve `{unlocked:false}` en el `catch`, el mismo valor que
  un restore correcto sin compras, y `OfferingSheet.tsx:147-158` lo mapea a «No encontramos
  una ofrenda anterior en esta cuenta.». A quien **ya pagó** y restaura con mala señal se le
  afirma que su compra no existe. Dos tests **congelan la confusión** como esperada.

- **`R9-17` (A2, dinero) — 🐛 `purchaseUnlock` declara `success` sin comprobar que el
  entitlement quedó activo: cobrado, agradecido y bloqueado.** `offeringService.ts:292-298`
  no evalúa `isEntitlementActive(customerInfo)` — aunque `restore()` (`:324`) sí lo hace
  sobre el mismo dato. Si el `CustomerInfo` no trae aún `extras` (mapping mal configurado en
  el dashboard, propagación lenta), Play cobra, la hoja dice «Gracias por sembrar en esta
  obra» y **todo sigue bloqueado**, sin ruta de auto-reparación.

- **`R9-18` (A2, dinero) — 🐛 no se contempla el pago PENDIENTE: a quien paga en efectivo
  (OXXO/SPEI) se le dice que la ofrenda falló.** `offeringService.ts:261-282` solo mapea 2
  códigos; el resto cae al error genérico. En el mercado principal de la app el pago en
  ventanilla termina en transacción **pendiente**: hoy se le muestra «No se pudo completar
  la ofrenda. Inténtalo de nuevo.» y se le pide repetir un pago que sí está en curso.
  Igual en `DonationSheet:93-96`.

- **`R9-19` (A2, dinero) — 🐛 `DonationSheet` nunca maneja `alreadyOwned`.** Verificado:
  `grep` de `alreadyOwned` sobre `src/`+`app/` da **un solo** consumidor
  (`OfferingSheet.tsx:125`). El arreglo `327fc26` se hizo solo en la ofrenda. Si el recibo de
  una donación no se liquida, cada reintento de **ese importe** cae al `else` con «No se
  pudo completar la donación», **para siempre**, y esta hoja **no tiene enlace de
  restaurar**: el tier queda muerto tras haber cobrado una vez.

- **`R9-24` (A3, copy) — 🐛 el diálogo de "Eliminar cuenta" manda al usuario a un botón que
  NO borra sus datos.** `translations.ts:3888-3889` (es) / `:10416-10417` (en) dicen que use
  "Resetear Datos de la Biblia"; **verificado** que `data-loader.ts:144-166` solo hace
  `DELETE FROM verses` + `verses_fts` + flags de packs, y su propia copy (`:4141-4142`) dice
  que favoritos/notas/resaltados **no se ven afectados**. No existe en la app ninguna acción
  que borre el contenido local. Quien vende su teléfono y sigue la instrucción deja sus notas
  privadas intactas para el siguiente dueño — y sirven de munición a `R9-23`.

- **`R9-25` (A3, cuota) — 🐛 `deleteAllCloudData` lee y borra sin límite ni lotes.**
  `deleteAccountData.ts:52-76`: `.get()` **sin `limit()`** por cada una de 8 colecciones +
  `Promise.allSettled` de todos los deletes a la vez, con puerta todo-o-nada (`:78-82`).
  Contraste interno: `SyncEngine.cleanupOldReviewEvents` (`:864-921`) sí pagina a 200 y borra
  secuencialmente. Una cuenta con ~7 000 `reviewEvents` gasta ~14 % de las lecturas y ~35 %
  de las escrituras **diarias de todo el proyecto**, y si falla a mitad muestra "No se pudo
  eliminar tu cuenta" con parte ya borrada.

- **`R9-29` (A7, cuota) — 🐛 el import empuja una escritura Firestore por entidad y revive
  la ruta `reviewEvents` que se eliminó por cuota.** `BackupService.ts:962-1028`. El
  comentario de `:1020-1027` afirma seguir _"the same 12-month window every other write path
  honors (MemoryDeckContext.reviewCard)"_ — **esa afirmación ya es falsa**: `reviewCard` no
  sube nada desde el cambio local-first, así que el import es hoy el **único escritor** de
  esa colección. ~7 300 escrituras en ráfaga ≈ 37 % de la cuota diaria compartida; y
  `persistQueue()` por entrada lo hace O(N²) en el hilo JS.

- **`R9-30` (A7, respaldo) — 🐛 el respaldo omite contenido escrito por el usuario que no
  tiene copia en la nube, incluidas 2 partes de la propia Mesa.** `BackupService.ts:104-116`
  solo cubre `@prep_notes` y `@prep_series`. Faltan **`@prep_illustrations`**,
  **`@prep_self_review`**, **`@sermon_notes`**, `@custom_plans` (el respaldo trae el
  _progreso_ del plan pero no su definición), oración, testimonio, devocionales, diario de
  emociones, `saved_comparisons`, insignias/títulos, y los favoritos/progreso de
  facts/journeys/profecías/kids/quiz. Solo 6 colecciones existen en Firestore, así que todo
  eso **no tiene ninguna ruta de recuperación**, contra lo que promete la UI
  (`translations.ts:4176`).

- **`R9-37` (A4, `SyncEngine`) — 🐛 `attachListener` es check-then-act sobre un `await`:
  dos listeners en la misma colección y uno queda huérfano.** Severidad **media**.
  `src/lib/sync/SyncEngine.ts:553-556` (la guarda) vs. `:603-627` (el `set`). Entre el
  `if (this.unsubs.has(...)) return` y el `this.unsubs.set(...)` hay un `await
loadCursor()` (lectura de AsyncStorage). Dos invocaciones concurrentes para la misma
  colección pasan las dos la guarda, las dos llaman a `onSnapshot`, y la segunda pisa el
  unsub de la primera: el primer listener queda vivo y sin referencia, fuera del alcance de
  `stop()` y de `unregister()`. La guarda `uidAtAttach` (`:582`) no protege aquí — el uid
  es el mismo. **Camino realista:** `src/context/SyncEngineContext.tsx:112-125` documenta
  (y dice haber confirmado en vivo el 2026-07-09) que `user` atraviesa transitoriamente
  `null`/anónimo durante la rehidratación de Firebase Auth en arranque en frío para una
  cuenta que sigue con sesión; ese parpadeo produce `stop()` + `start(mismo uid)`.
  **Consecuencia:** cada cambio remoto se procesa dos veces y **se factura dos veces la
  lectura de Firestore**, anulando parte del ahorro que justifica todo el trabajo de
  cursores. No hay riesgo de fuga entre cuentas: las reglas (`request.auth.uid == uid`,
  verificadas en `B4`) rechazan al huérfano en cuanto cambia el usuario. **Repro (sonda),
  parcial:** con `loadCursor` colgado y dos `register()` seguidos, `onSnapshot` se llama
  **2 veces** y `unsubs` retiene una sola. La mitad "el huérfano sigue entregando tras
  `stop()`" es **inferencia sobre el SDK real, no medición** (el arnés comparte un único
  `snapshotCb`). Detalle: `detail/A4-syncengine.md`.

- **`R9-40` (campo, catálogo de versiones) — 🐛 ningún `fetch` de la app tiene timeout:
  «Buscando versiones disponibles…» se cuelga para siempre.** Severidad **media**.
  `src/lib/database/version-download-service.ts:34`. `fetchVersionCatalog` hace
  `await fetch(CATALOG_URL + '?t=' + Date.now())` **sin `AbortController` ni señal de
  timeout**; el `fetch` de React Native no tiene timeout por defecto, así que en una red
  que acepta la conexión y no responde (portal cautivo, wifi degradado) la promesa **nunca
  se asienta**. `ManageVersionsSection.tsx:59-68` deja `loading = true` en ese caso y el
  `finally` no llega nunca: el spinner queda indefinido, sin rama de error y **sin botón
  de reintentar** (el «Reintentar» solo aparece por `loadError`, que requiere que el
  `fetch` haya rechazado). **Reportado en vivo por Victor (2026-09-07, OnePlus 11)** con
  las dos manifestaciones: spinner colgado y, en otro momento, el error de catálogo con
  «Reintentar»; al día siguiente funcionaba — el patrón intermitente que predice la falta
  de timeout. **Alcance mayor que esta pantalla:** `grep` de `AbortController|
AbortSignal.timeout` sobre `src/` da **cero resultados** en los **6** call sites de
  `fetch` de la app — incluido `src/lib/offering/giftCodeService.ts:158`, que es la ruta de
  **dinero** (canje de código regalo): un cuelgue ahí deja el canje girando sin salida.
  **Arreglo (no aplicado):** `AbortSignal.timeout(~10s)` en los 6 call sites, y en el
  catálogo tratar el abort como `loadError` para que aparezca «Reintentar». Detalle:
  `detail/CAMPO-victor-2026-09-07.md`.

- **`R9-41` (campo, lector) — 🐛 con el tema de lectura «Crepúsculo» la barra de acciones
  del versículo queda texto casi blanco sobre panel casi blanco.** Severidad **media-alta**
  (inutiliza 8 acciones en un tema **premium**). `app/(tabs)/verse/[book]/[chapter].tsx:719-722`
  y `:3076-3080`. El fondo de la barra flotante se elige con `readerIsDark`, que **enumera
  a mano** los temas oscuros:
  `readerPrefs.theme === 'night' || readerPrefs.theme === 'high-contrast'`.
  `crepusculo` —añadido después, en T6.3, como exclusivo de ofrenda— **es un tema
  true-dark** (`readerThemes.ts`: `background '#0D1220'`, `text '#DCE3F0'`) y **no está en
  esa lista**, así que `readerIsDark` da `false`, el fondo cae a
  `staticColors.glassWhite98` (`rgba(255,255,255,0.98)`) y encima se dibuja
  `effectiveColors.text = '#DCE3F0'` → contraste ≈ **1.2:1**. Las etiquetas
  («Escuchar», «Copiar», «Compartir», «Nota», «Favoritos», «Resaltar», «Comparar»,
  «Imagen») quedan ilegibles. **Reportado en vivo por Victor (2026-09-07)** con captura.
  El comentario del propio código dice que `readerIsDark` existe _"so its
  `effectiveColors.text` stays legible when the reading theme differs from the app theme"_
  — la intención es correcta, el que falló es el mantenimiento de la lista al añadir un
  tema. **`readerIsDark` no tiene ningún test** (verificado a mano) y es su **único**
  consumidor. **Arreglo (no aplicado):** derivar la oscuridad de la paleta en vez de
  enumerarla — un campo `isDark` en `ReaderThemeColors`, o calcular la luminancia de
  `background` en `readerThemes.ts`, de modo que añadir un tema nuevo no pueda volver a
  olvidarse. Detalle: `detail/CAMPO-victor-2026-09-07.md`.

- **`R9-50` (A8, subrayados) — 🐛 borrar la nota o la categoría de un subrayado es un no-op
  completo, y la UI dice «Guardado».** Severidad **alta**. `updateHighlight`
  (`HighlightService.ts:119-135`) solo incluye un campo en el `SET` si es `!== undefined`,
  pero `saveEditor` traduce "campo vacío" a **`undefined`** (`highlights.tsx:190-193` y
  `:602`). Mienten tres capas: SQLite conserva el valor viejo; el `queueWrite` va sin el campo
  y `pushOne` usa `{merge:true}`, así que **Firestore también lo conserva** (bajo merge un
  campo opcional es **imposible de desasignar**); y `toast.success` (`:209`) lo da por
  guardado. Al volver a la pantalla, `useFocusEffect` relee y **la nota reaparece intacta**.
  **No existe ninguna forma de quitar una nota de resaltado en toda la app.** **Repro
  (sonda):** `{note: undefined, category: undefined}` →
  `UPDATE highlights SET updated_at = ? WHERE verse_id = ?`, sin tocar ningún dato. Detalle:
  `detail/A8-notas-subrayados.md`.
- **`R9-51` (A8, notas) — 🐛 dos dispositivos pueden crear DOS notas para el mismo versículo,
  y el lector solo alcanza una.** Severidad **media**. La tabla `notes`
  (`database/index.ts:521-532`) tiene **solo `id TEXT PRIMARY KEY`**, sin restricción sobre
  `(book_name, chapter, verse)`, y los ids se generan con `note_${Date.now()}_${random}`
  (`:2085`). El adaptador usa el **id de la nota** como clave de sync — **la decisión contraria
  a la del adaptador de subrayados**, que eligió `verseId` a propósito _"porque el id generado
  por el servicio lleva un timestamp y cambia entre dispositivos"_
  (`adapters/highlights.ts:19-25`). Tras sincronizar hay dos filas y el motor nunca las ve como
  conflicto; `getNoteForVerse` (`:2151-2158`) usa `getFirstAsync` **sin `ORDER BY`** y devuelve
  una arbitraria. La otra queda huérfana: duplicada en la pestaña _Notas_, inalcanzable desde
  el lector, y contada doble por `getNotesCount()`. Sin sonda (requiere SQLite real). Detalle:
  `detail/A8-notas-subrayados.md`.
- **`R9-52` (A9, Mesa) — 🐛 toda falla de escritura de una nota se traga en silencio y
  `savePrepNote` la reporta como éxito.** Severidad **media**. `prepNotesStore.ts:76-81`:
  `writeQueue.then(run).catch(log)` y `return writeQueue` → **resuelve, nunca rechaza**; los 4
  llamadores son fire-and-forget o `await Promise.all` sin `try`. Y la Mesa **no tiene ningún
  afordance de guardado**: los únicos 2 toasts de sus 3467 líneas son de error de PDF.
  Agravante: `@prep_notes` es **una sola clave JSON con todos los sermones de toda la vida**, y
  `AsyncStorage_db_size_in_MB` no está configurado en ningún lado (0 hits), así que rige el
  techo de **6 MB por defecto de Android** para toda la base, compartido con progreso, mazo,
  ilustraciones y series. **Repro (sonda):** con `setItem` rechazando,
  `savePrepNote(...)` → `resolves.toBeUndefined()` y el storage queda vacío. Detalle:
  `detail/A9-mesa-persistencia.md`.
- **`R9-53` (A10, respaldo) — 🐛 restaurar un respaldo rompe la invariante de disyunción del
  _floor_: la retención se duplica y la corrupción se re-escribe a la nube, acumulándose.**
  Severidad **media**. `memoryStats.ts:20-22` declara la invariante (_"The floor is disjoint
  from local events […], so summing retention bands never double-counts"_), pero `importBackup`
  hace `DELETE FROM review_events` y reinserta el log **sin tocar el floor**
  (`BackupService.ts:1377-1394`); a partir de ahí `mergeRetentionBands` y
  `retentionByIntervalWithFloor` **suman los mismos repasos dos veces**. Peor: al pasar a
  segundo plano se escriben las bandas duplicadas de vuelta a `users/{uid}/memoryStats/summary`,
  y ese doc corrupto siembra el floor del **siguiente** dispositivo fresco → ×3, ×4… **y no hay
  forma de resetearlo desde la UI** (ver `R9-61`). Acotación honesta: solo `retentionBands` se
  corrompe; `recentDays` y `longestStreak` son idempotentes. **Repro (sonda):** floor de
  `d1:{total:10}` + los mismos 10 eventos → lectura 20, escritura 20, segundo ciclo 30.
  Detalle: `detail/A10-memoria-srs.md`.
- **`R9-54` (A11, planes) — 🐛 descompletar un día de un plan no se sostiene: vuelve solo en la
  siguiente lectura de CUALQUIER capítulo, con notificación falsa.** Severidad
  **media-alta**. `toggleDay` (`ReadingPlanProgressContext.tsx:211-246`) quita el día de
  `completedDays` pero **no toca `@reading_plan_read_chapters`**, y el escaneo de
  `markChapterRead` (`:299-327`) re-completa cualquier día cuyos capítulos sigan marcados. Que
  el equipo conoce el mecanismo lo prueba `restartPlan` (`:436-457`), que **sí** limpia esas
  banderas _"FIRST — otherwise the very next chapter read anywhere in the app would… instantly
  auto-complete the 'restarted' plan again"_; la misma limpieza no se aplicó al caso de un solo
  día. **Repro (sonda):** destildar el día 1 y luego leer **Génesis 1** (nada que ver con el
  plan) → `newlyCompleted: [{planId:'iam-7', day:1}]` y toast «¡Día 1 completado!». Detalle:
  `detail/A11-progreso-rachas.md`.
- **`R9-55` (A11, planes) — 🐛 editar un plan propio a menos días arrastra números de día que
  ya no existen: la pantalla muestra 250%.** Severidad **media**. `migratePlanProgress`
  (`ReadingPlanProgressContext.tsx:259-272`) copia `completedDays` **verbatim, sin recortar al
  `duration` nuevo**, y `plan/[id].tsx:279` calcula
  `Math.round((completed / effectiveDuration) * 100)` sobre el `length` crudo. **`planPace` sí
  filtra** (`planPace.ts:88-90`) y devuelve 100%: las dos cifras se contradicen en la misma
  pantalla y **se pinta la mala**, que además alimenta el ancho de la barra (`width: '250%'`).
  **Repro (sonda):** 5 días completados, plan editado a 2 → `250%` en pantalla vs `100%` en
  `planPace`. Detalle: `detail/A11-progreso-rachas.md`.

---

## P2 — resto + pulido

- **`R9-12` (A5, `SyncEngine`) — 💡 no se usa `writeBatch` en ningún lado; los bucles
  empujan de a un documento.** `SyncEngine.ts:1238-1240` empuja secuencialmente y
  `firestore.ts:94` lo dice explícito ("_not needed yet_"). Afecta a subrayar una selección
  entera, a `resetDeck()` y sobre todo a la restauración de un respaldo. **No es cuota**
  (Firestore cuenta documentos, y son N documentos igual): es latencia y exposición a fallo
  parcial. La cola se persiste, así que no se pierden. Cruza con `R9-29`.

- **`R9-20` (A2, backend) — 💡 el endpoint de canje no valida la forma del código antes de
  gastar Auth+Firestore.** `redeem.ts:114-121`, `:159`. Un `{"code":"AB/CD"}` produce una
  ruta de colección y sale un 500 donde tocaba un 400. Y cada POST basura consume un
  `verifyIdToken` + una lectura antes de mirar la cadena; como Vercel Hobby tiene **tope duro
  sin facturación por exceso** (elegido a propósito), suficientes POST dejan el canje **fuera
  de servicio**. **La fuerza bruta NO es la preocupación** (31⁸ ≈ 8,5·10¹¹). Un regex lo
  cierra.

- **`R9-21` (A2, backend) — 💡 si el grant funciona pero falla el marcado, el código vuelve
  a la piscina en silencio.** `redeem.ts:189-213` loguea por `console.error` y devuelve 200.
  El código sigue figurando como disponible, así que un segundo usuario puede canjearlo y
  obtener otro entitlement vitalicio. Sin alerta ni campo barrible. **Adjunto:** el
  comentario de `:194-196` remite a un tradeoff que **no está en la cabecera de este
  fichero** — está en `functions/src/index.ts`, la copia no desplegada. Puntero colgante.

- **`R9-26` (A3, auth) — 💡 tras eliminar la cuenta la app probablemente se queda sin
  usuario hasta el siguiente arranque.** `AuthContext.tsx:569` rearma
  `triggeredAnonymousRef` **después** de `deleteUser`, al revés que `signOut` (`:463` antes
  de `:464`), así que el evento `null` llega con la bandera aún en `true` y no relanza el
  sign-in anónimo. Rompe el contrato de la cabecera ("siempre hay uid estable") y deja los
  Crashlytics de esa sesión sin identificar. **Pendiente de verificar en dispositivo.**

- **`R9-31` (A7, respaldo) — 💡 la restauración no aísla a los demás escritores de SQLite ni
  propaga los borrados a la nube.** `BackupService.ts:1277-1278` usa `withTransactionAsync`,
  no la variante **exclusiva**, así que escrituras de otros módulos (incluido el listener de
  sync, que sigue enganchado) caen dentro de la transacción y se pierden en un rollback. Y el
  push solo hace `queueWrite`, nunca `queueDelete`: lo que el restore borró sigue en
  Firestore y **vuelve** en una reinstalación. "Restaurar = reemplazar" degrada a "restaurar
  = mezclar".

- **`R9-32` (A7, respaldo) — 💡 el archivo de respaldo se escribe en caché y nunca se
  limpia.** `BackupService.ts:586-590`. `shareAsync` resuelve al cerrarse la hoja, no cuando
  un destino guardó el archivo, y no hay toast de éxito **ni de fallo**: descartar la hoja se
  da por bueno y el usuario cree tener un respaldo que solo existe en un directorio que el
  sistema puede desalojar. N exports = N copias completas acumuladas.

- **`R9-2` (B2, `.gitignore`) — 💡 el `.gitignore` raíz solo cubre `.env*.local`, no un
  `.env` pelado.** Severidad **baja** (hardening), arreglo de una línea.
  `.gitignore:48` es `.env*.local`, así que `.env`, `.env.production`, `scripts/.env` y
  `src/.env` **no** están ignoreados — y el repo es **público**
  (`"visibility": "public"`).
  **Repro:** `git check-ignore -v .env` → sin match; comparar con
  `git check-ignore -v functions/.env` → sí matchea (`functions/.gitignore:13`).
  **Por qué NO es P0:** los dos directorios que manejan secretos de alto valor ya se
  cubren solos — `functions/.gitignore` tiene `.env`, y `vercel/gift-code-redeem/.gitignore`
  tiene `.env*`. En la raíz y en `scripts/`/`src/` hoy no hay nada sensible (los
  `process.env` de `scripts/` son rutas y flags; la convención de Expo en la raíz es
  `EXPO_PUBLIC_*`, público por diseño), y no existe un `.env.example` que empuje a
  crear uno.
  **Por qué vale arreglarlo:** el radio de daño si se equivoca es total — el service
  account de Firebase que consume `vercel/gift-code-redeem/api/redeem.ts:36` salta
  _todas_ las reglas de Firestore, y la clave secreta de RevenueCat (`:220`) otorga
  entitlements gratis. `.env` en la raíz es el nombre más natural y basta un
  `git add .`.
  **Arreglo sugerido (no aplicado):** `.env*.local` → `.env*` en `.gitignore:48`.

- **`R9-3` (B3, limpieza) — 💡 3.3 MB de artefactos de Yarn trackeados en un repo que
  usa npm.** Severidad **muy baja**, no es seguridad.
  Siguen trackeados `.yarn/releases/yarn-3.6.4.cjs` (2 231 402 bytes) y
  `.yarn/plugins/@yarnpkg/plugin-interactive-tools.cjs` (1 074 996 bytes), restos de la
  era Yarn del commit inicial, mientras el repo usa npm: hay `package-lock.json`, no hay
  `yarn.lock`, y `package.json` no tiene campo `packageManager`.
  **Repro:** `git ls-files | grep '^\.yarn/'` → 2 archivos.
  **Efecto secundario que vale:** ese bundle minificado es la única razón por la que un
  escáner de secretos sobre este repo reporta un falso positivo de `AKIA` (fragmentos
  `AKIA4QI`/`AKIA9`/`AKIAE`, ninguno con la forma AWS de `AKIA`+16). Borrarlos limpia el
  ruido además del peso. Encaja en la fila `B9`; se registró en `B3` porque ahí se
  encontró.

- **`R9-4` (B4, proceso) — 💡 las reglas de seguridad de Firestore no están versionadas
  en el repo.** Severidad **baja-media**: no es un hueco explotable hoy, es riesgo
  operativo. Las reglas vivas son correctas (default-deny + `request.auth.uid == uid`,
  ningún path abierto — auditado en `detail/B4-reglas-firestore-storage.md`), pero
  existen **solo en la consola de Firebase**.
  **Repro:** `git ls-files | grep -iE '\.rules$'` → 0 archivos; `firebase.json` solo
  tiene `react-native`, `functions`, `hosting` — ni sección `firestore` ni `storage`.
  **Por qué importa:** el control de acceso de toda la app es el único componente de
  seguridad que se salta el proceso que el resto del código sí respeta — sin diff, sin
  PR, sin CI, **sin rollback**. `firebase deploy --only firestore:rules` no funciona
  sin la sección en `firebase.json`, así que el despliegue seguirá siendo manual, que
  es justo el modo en que se relaja una regla sin querer. Hoy reglas y código coinciden
  por suerte estructural (el comodín `{collection=**}` cubre toda colección nueva bajo
  `users/{uid}/`), no por verificación.
  **Arreglo sugerido (no aplicado):** volcar el texto vivo a `firestore.rules` (ya está
  capturado íntegro en el detalle de `B4`, así que es mecánico) + añadir
  `"firestore": {"rules": "firestore.rules"}` a `firebase.json`.

- **`R9-5` (B5, CI) — ⚠️ el job "Security Audit" no puede fallar nunca.** Severidad baja
  como riesgo, pero induce a error activamente. Los dos únicos pasos del job
  (`npm audit --audit-level=moderate` y `npm outdated`) llevan ambos
  `continue-on-error: true`, así que el job **sale verde siempre**.
  **Repro:** cualquier run reciente en Actions → "Security Audit" verde; local
  `npm audit --audit-level=moderate` → exit code ≠ 0 (8 vulns, 1 HIGH, ver `B1`).
  **Por qué importa:** quien mire los checks de un PR concluye "la auditoría de
  seguridad pasó" cuando en realidad se ejecutó y se ignoró el resultado.
  **Opciones (no aplicadas):** quitarle el `continue-on-error` a `npm audit` ahora que
  `B1` ya clasificó las 8 y dejó justificadas las inevitables; o renombrar el job a
  "Dependency Report" para que el nombre no prometa una garantía que no da.
  (`npm outdated` sí necesita la bandera: devuelve 1 siempre que haya algo atrasado.)

- **`R9-6` (B5, CI) — 💡 endurecimiento: sin bloque `permissions:` y acción de terceros
  en tag mutable.** Severidad **baja**, hoy mitigado por configuración del repo.
  (a) `ci.yml` no declara `permissions:` en ningún nivel, así que el `GITHUB_TOKEN`
  hereda el default del repo — que hoy **es `"read"`** (verificado por API), o sea sin
  escalada real; pero es un ajuste de settings mutable desde la UI sin dejar rastro en
  git. (b) `codecov/codecov-action@v4` es de terceros sobre un tag **móvil**, y
  `sha_pinning_required` del repo es `false` (Codecov tiene precedente de compromiso de
  cadena de suministro, 2021).
  **Por qué NO es urgente:** el repo tiene **0 secretos de Actions** (`total_count: 0`)
  y el token es read-only, así que una acción comprometida no podría exfiltrar
  credenciales ni pushear — a lo sumo falsear el resultado del job.
  **Arreglo sugerido (no aplicado):** `permissions: {contents: read}` a nivel workflow +
  fijar la acción de Codecov a SHA completo.

- **`R9-7` (B1b, `functions/`) — ✅ RESUELTO 2026-09-03.** Era: código no desplegado que duplica la lógica de dinero, y
  `firebase.json` todavía lo declara.** Severidad **baja-media** (mantenimiento en una
  ruta P0, no un bug hoy).
  `functions/src/index.ts` implementa el canje de gift-codes completo **en paralelo** al
  de Vercel — los dos leen `db.collection('giftCodes').doc(code)`
  (`functions/src/index.ts:204` vs `vercel/gift-code-redeem/api/redeem.ts:159`) y los dos
  llaman a RevenueCat con la clave secreta. Pero la app solo llama a Vercel
  (`src/lib/offering/giftCodeService.ts:44` → `https://essb-gift-redeem.vercel.app/api/redeem`).
  **Repro:** `git log --oneline -- functions/` → 1 solo commit (`ca69aca`), reemplazado
  por `c3650f0` ("port redemption endpoint to Vercel's free tier"); `functions/node_modules`
  no existe; el proyecto está en plan Spark (Cloud Functions necesita Blaze).
  **Por qué importa:** (a) deriva silenciosa — un arreglo de canje aplicado en Vercel deja
  atrás la copia invisible, y son dos implementaciones del mismo gate de pago;
  (b) `firebase.json` sigue con `"functions": [{"source": "functions", "predeploy": …}]`,
  así que un `firebase deploy` sin `--only hosting` intentaría desplegarlo.
  **Resolución:** Victor pidió primero borrarlo; al revisar el objetivo antes de borrar
  apareció un dato que faltaba en este hallazgo — `functions/` **no está olvidado, está
  conservado a propósito**, y la razón ya estaba escrita en
  `src/lib/offering/giftCodeService.ts`: Cloud Functions exige el **plan Blaze**, que
  convierte el proyecto Firebase **entero** a facturación con sobrecosto, mientras el
  tier Hobby de Vercel tiene tope duro. Con ese dato se recomendó **no borrar**, y Victor
  estuvo de acuerdo. Aplicado:
  (a) se quitó la sección `functions` de `firebase.json` — mata la trampa concreta de
  despliegue (ahora `firebase deploy` solo publica hosting);
  (b) se agregó `functions/README.md`, que lo etiqueta como NO DESPLEGADO, explica el
  motivo de Blaze, señala que la fuente de verdad es `vercel/gift-code-redeem`, **avisa
  que esta copia está atrasada en mantenimiento** (la de Vercel recibió `d97516b`) y deja
  los 5 pasos si alguna vez se despliega, incluida la sección JSON exacta que se quitó;
  (c) punteros al README desde `giftCodeService.ts` y `.prettierignore`.
  **Por qué no se borró:** conservarlo cuesta cero medible (no compila, no testea, no
  entra al bundle, no lo toca `npm run validate`), el riesgo de deriva exige pasar a
  Blaze — un acto deliberado de mucha fricción — y borrarlo sí destruye la salida de
  emergencia de un solo proveedor en una ruta de dinero. El problema del "duplicado
  invisible" se resolvió haciéndolo visible y etiquetado.

- **`R9-8` (B1b, subproyectos) — 💡 replicar el `override` de `uuid` que la raíz ya
  tiene.** Severidad **baja**; cierra la única vuln de runtime desplegado sin tocar
  `firebase-admin`.
  De las 26 vulns de `functions/` + `vercel/` (incluidas **7 HIGH**), la única en el
  runtime realmente desplegado es `uuid@9.0.1` vía `firebase-admin@13.10.0` →
  `google-gax`/`gaxios`/`teeny-request` (todas las HIGH salen de `@vercel/node`, que es
  **devDependency** = tooling de build/`vercel dev`, no viaja al lambda).
  GHSA-w5hq-g745-h8pq afecta solo a `v3`/`v5`/`v6` **con** argumento `buf`; esas libs
  usan `uuid.v4()` → **no alcanzable**, pero es trivial de cerrar.
  **Ojo, misma trampa que `R9-1`:** el fix de npm es
  `firebase-admin@10.3.0` — un **downgrade** desde 13.10.0 que además revertiría
  `d97516b` ("pin firebase-admin to 13.x, avoiding a broken jose/jwks-rsa ESM chain").
  **Arreglo sugerido (no aplicado):** `"overrides": {"uuid": "^11.1.1"}` en
  `vercel/gift-code-redeem/package.json`. **Este override SÍ funciona** (a diferencia del
  de `R9-1`): `uuid@11.1.1` trae build dual (`exports.node.require → ./dist/cjs/index.js`)
  y la **raíz ya lo corre con ese mismo override** con `npm run validate` en verde.
  Verificar con un canje real contra el endpoint desplegado antes de darlo por cerrado.

- **`R9-42` (campo, lector) — 💡 el ícono de bocina del versículo que se está narrando
  queda a **0 px** del borde de la tarjeta.** `app/(tabs)/verse/[book]/[chapter].tsx:2583-2591`.
  El ícono es `position: 'absolute'` con `left: -(fontSizes.sm + spacing['0.5'])` = **-16**,
  dentro de un `verseItem` cuyo `paddingHorizontal` es `spacing.md` = **16**
  (`:3742-3750`). Es decir: el ícono consume **exactamente** todo el canalón y su borde
  izquierdo cae justo sobre el borde de la tarjeta, con el único 1 espacio disponible (2 px)
  asignado al lado derecho. **Pedido por Victor (2026-09-07)** con la preocupación
  explícita de no reabrir la saga del recorte de palabras. **Esa preocupación se puede
  descartar para el ajuste del `left`:** el ícono es `position: 'absolute'` +
  `pointerEvents="none"`, o sea **fuera de flujo**, y el anti-recorte vive en el
  `paddingRight`/`textBreakStrategy` del `<Text>` (Sprint 110/112) — mover el ícono no
  puede tocarlo. **La restricción real es de espacio:** el canalón mide 16 px y el ícono 14,
  así que hay **2 px de holgura total**; no caben márgenes a ambos lados sin ampliar el
  canalón (subir `verseItem.paddingLeft` a ~20-22, que **sí** reflowa el texto, aunque solo
  estrecha la columna sin tocar la holgura derecha) o achicar el ícono. Es una decisión de
  diseño, no un arreglo mecánico. Detalle: `detail/CAMPO-victor-2026-09-07.md`.

- **`R9-43` (campo, Mesa) — 🐛 en «Comparar versiones» el número de versículo se encima
  con la fila de chips: no hay separación vertical ninguna.**
  `app/features/prep/index.tsx:2160-2222`. En la rama premium de la tarjeta, los tres hijos
  se apilan sin margen alguno: `sectionCard` (`:3121-3126`) **no tiene `gap`** (solo
  `padding` y `marginBottom`), `helpMeta` es `{fontSize: fontSizes.xs}` pelado (`:3249`),
  `chipWrap` es `{flexDirection:'row', flexWrap:'wrap', gap: spacing.sm}` **sin
  `marginTop`/`marginBottom`** (`:3273`), y `compareVerseBlock` tiene `marginBottom` y
  `gap` internos pero **no `marginTop`** (`:3360`). Resultado: el texto de ayuda queda
  pegado a los chips y el número de versículo («23» en la captura) queda pegado bajo el
  chip, leyéndose como encimado. **Reportado en vivo por Victor (2026-09-07)** con captura.
  Nota: las otras ramas de la misma tarjeta no sufren esto porque usan contenedores con
  `gap` propio. **Arreglo (no aplicado):** un `gap` en `sectionCard` (arriesga tocar todas
  las tarjetas de la Mesa) o, más acotado, `marginTop` en `compareVerseBlock` +
  `marginTop`/`marginBottom` en `chipWrap` dentro de esta tarjeta. Detalle:
  `detail/CAMPO-victor-2026-09-07.md`.

- **`R9-56` (A8, notas) — 🐛 la pestaña Notas muestra la referencia en el idioma de la versión
  activa y el versículo congelado en el idioma de cuando se creó la nota.** Severidad **baja**.
  `notes.tsx:276` usa `localizeBook(item.book)`, que sigue a `selectedVersion.language` a
  propósito (`:270-273`), pero `item.text` es el `verse_text` congelado al crear la nota y
  `updateNote` solo toca `note`/`updated_at` (`database/index.ts:2107-2115`). Crear notas en
  RVR1960 y pasar a KJV muestra **"John 3:16"** sobre **"Porque de tal manera amó Dios al
  mundo…"**, también en la imagen para compartir (`:435`), que es contenido público.
  `HighlightsScreen` **sí** re-resuelve contra la versión activa (`highlights.tsx:96-101`) —
  la asimetría confirma que es un olvido. Detalle: `detail/A8-notas-subrayados.md`.
- **`R9-57` (A8, lector) — 🐛 no existe forma de borrar una nota desde el lector, y el botón
  atrás descarta el borrador sin avisar.** Severidad **media**. Vaciar el campo deshabilita
  «Guardar» (`NoteEditorModal.tsx:290`) y `saveNote` corta con `!noteText.trim()`
  (`verse/[book]/[chapter].tsx:1049`), así que el gesto natural no hace nada; el único borrado
  vive en la pestaña _Notas_. Y el borrador vive **solo** en el `useState` del padre —el propio
  comentario lo admite (`:147-150`)— así que la X o el atrás de Android (`onRequestClose`,
  `:169`) lo descartan **sin confirmación**. **Sin verificar en dispositivo:** si el
  `BackHandler` del `Modal` de RN gana sobre el `useBackHandlerStep` de la pantalla
  (`:1287-1296`), que no consulta `noteModalVisible`; si perdiera, el atrás además navegaría de
  capítulo. Requiere Modo C. Detalle: `detail/A8-notas-subrayados.md`.
- **`R9-58` (A9, Mesa) — 🐛 matar la app (o cerrar la pestaña en web) pierde hasta 700 ms de
  tecleo: `use-debounce` expone `flushOnExit` y no se usa.** Severidad **baja**.
  `prep/index.tsx:1024-1042`. **El resto de los caminos de salida están bien** y se auditaron
  uno por uno (desmontar, blur, púlpito, ilustraciones, historial, series, cambio de pasaje):
  todos persisten, y el `flush()` de `:1042` **funciona** —confirmado desminificando
  `use-debounce@10.1.1` y con sonda—. Lo único descubierto es el proceso que muere (swipe-away,
  OOM, cierre de pestaña). Detalle: `detail/A9-mesa-persistencia.md`.
- **`R9-59` (A9, privacidad local) — 🐛 `@prep_notes` no se limpia al cerrar sesión ni al
  cambiar de cuenta: en un teléfono compartido, el sermón sin terminar del predicador anterior
  queda a la vista del siguiente.** Severidad **baja**. No existe ningún
  `removeItem`/`multiRemove` sobre `@prep_notes`, `@prep_series`, `@prep_illustrations` ni
  `@prep_self_review` en todo el repo, y la clave no está namespaceada por uid. El módulo se
  presenta como _"privacy-first"_ (`prepNotes.ts:12-15`), pero la garantía solo se cumple
  contra la nube. **Mecanismo distinto de `R9-22`/`R9-23`** (aquí no hay sync ninguno).
  **Severidad honesta:** P2 y no P0 porque no hay fuga **hacia afuera** del dispositivo y el
  repo trata progreso y logros con la misma política device-scoped (documentada en
  `deleteAccountData.ts:12-13`). **Decisión de producto para Victor:** si «device-local» debe
  significar también «visible para cualquiera que use el aparato». Detalle:
  `detail/A9-mesa-persistencia.md`.
- **`R9-60` (A10, respaldo) — 🐛 el respaldo omite 3 claves de AsyncStorage del área de memoria
  mientras respalda todas las demás preferencias locales.** Severidad **baja**. Patrón de lista
  enumerada a mano: `BackupPayload.memory` es literalmente `{memoryDeck, reviewEvents}`, y
  faltan `@memory_daily_goal`, `@memory_weekly_target` y `@memory_celebrated_milestones`
  (`goalStore.ts:19-20`, `weeklyTargetStore.ts:16`) — mientras que `@app_theme_mode`,
  `@reader_preferences`, `@prep_notes` y el bloque de `achievements`, **igual de device-local**,
  sí se respaldan. Al restaurar, la meta diaria vuelve a 10 y el reto semanal a 3 en silencio, y
  se **re-celebran todos los hitos de racha ya celebrados**.
  `@memory_stats_floor`/`_banner_pending` quedan fuera **correctamente** (caché derivable;
  respaldarlas empeoraría `R9-53`). Detalle: `detail/A10-memoria-srs.md`.
- **`R9-61` (A10, recuperación) — 🐛 `resetDeck` está en la API pública del contexto y no tiene
  ni un solo llamador: no hay forma de que el usuario borre sus datos de memoria.** Severidad
  **baja**. Declarado, documentado (_"handy for 'Reset' affordance"_), implementado
  (`MemoryDeckContext.tsx:88`, `:339-348`) y duplicado como no-op en el stub web (`:74-76`);
  `grep -rn "resetDeck" app/ src/` fuera del contexto → **cero**. **Sube la severidad efectiva
  de `R9-48` y `R9-53`**: un usuario con estadísticas contaminadas o duplicadas no tiene
  ninguna acción en la app para limpiar. O se cablea a Ajustes, o se quita de la interfaz para
  que no aparente una vía de escape que no existe. Detalle: `detail/A10-memoria-srs.md`.
- **`R9-62` (A10, hitos) — 🐛 el recorte FIFO de hitos celebrados expulsa las claves de racha y
  le re-celebra al usuario «¡3 días!» cuando lleva 156.** Severidad **baja**.
  `goalStore.ts:66-80` recorta con `merged.slice(-MAX_CELEBRATED)` y `MAX_CELEBRATED = 60`; el
  recorte quita **las más antiguas**, que son siempre las `streak:*`, porque las
  `goal:YYYY-MM-DD` se añaden al final una por día. El comentario de `:63-64` afirma que es
  seguro _"porque una clave de racha solo re-dispara cuando la racha realmente se reconstruye"_:
  **es falso**. **Repro (sonda):** cascada de 6 días seguidos —`streak:3`, `7`, `14`, `30`,
  `60`, `100`— con la racha real en 156-161. Cosmético, pero trivializa el mecanismo de
  retención. Detalle: `detail/A10-memoria-srs.md`.
- **`R9-63` (A11, recap) — 🐛 el recap semanal se rompe en el cambio de horario: 6 días en vez
  de 7, y un día contado dos veces.** Severidad **baja-media**. `weeklyRecap.ts:85-86` (y el
  mismo patrón en `listeningStats.ts:156-157`) hace `listeningDateKey(now - i * MS_PER_DAY)` —
  bloques fijos de 24 h con clave de día local—, así que en un día de 25 h dos valores de `i`
  caen en la misma fecha. El hermano `weekComparison.ts:57-61` hace lo correcto
  (`d.setDate(d.getDate() - 7)`): **la forma buena ya existe en la misma carpeta**. Afecta a
  una tarjeta **compartible** y se propaga al delta semana-a-semana. **Repro (sonda, requiere
  PowerShell):** `$env:TZ = 'Europe/Madrid'; npx jest …` con
  `now = 2026-10-25T23:30:00+01:00` → tira de 7 días con `2026-10-25` repetido, 60 versículos
  donde hay 50, 3 días activos donde hay 2. Pasa en `America/Mexico_City` (caso de control).
  Detalle: `detail/A11-progreso-rachas.md`.
- **`R9-64` (A11, planes) — 🐛 `migratePlanProgress` BORRA el progreso de origen cuando el
  destino ya tiene el suyo, en vez de fusionarlo.** Severidad **baja**.
  `ReadingPlanProgressContext.tsx:264-268`: `if (!next[toId]) next[toId] = current;` protege el
  destino, pero `delete next[fromId];` se ejecuta **incondicionalmente**, así que cuando la
  rama protectora se activa el progreso de origen se destruye sin ir a ningún lado. Alcanzable
  al editar un plan propio hasta que su id derivado del contenido colapse con el de otro.
  **Repro (sonda):** tras migrar, `getCompletedDays(BIG.id)` → `[]`. Detalle:
  `detail/A11-progreso-rachas.md`.

---

## ⚠️ Dudas / parciales

- **`R9-1` (B1, remediación de vulns) — ⚠️ TRAMPA: `npm audit fix --force` rompería la
  app entera.** No es un bug de la app; es una mina para una futura sesión de arreglos.
  `npm audit` reporta, para las 3 filas de la cadena `expo-router` → `query-string` →
  `decode-uri-component`, `fixAvailable: {"name":"expo-router","version":"5.1.11","isSemVerMajor":true}`.
  El instalado es **`expo-router@57.0.12`** (declarado `~57.0.12`, fijado por Expo SDK
  57), así que la "corrección" es un **downgrade de 52 majors** que destruiría todo el
  routing de `app/`. `npm audit` lo dice en su propia salida:
  `Will install expo-router@5.1.11, which is a breaking change`.
  **Repro:** `npm audit` en la raíz y leer el bloque `fixAvailable` de
  `decode-uri-component` / `query-string` / `expo-router`.
  **Qué hacer:** `npm audit fix` a secas es seguro (solo toca `firebase-tools` y
  `@expo/plist`, ambos dev/build). **Nunca `--force`.** La vía de `overrides` tampoco
  sirve: el parche `decode-uri-component@0.5.0` es ESM-only y `query-string@7.1.3` lo
  consume con `require()`. Lo correcto es no tocar nada — las 3 no son alcanzables
  (detalle en `detail/B1-npm-audit.md`) y se resuelven cuando `expo-router` migre a
  `query-string` 8+.

---

## Heredado de la revisión Fable (julio 2026) — CERRADO

- **BUG-10 (profecías, "Siguiente" no reseteaba el scroll) — ✅ CERRADO.** El charter
  §3 lo listaba como semilla abierta; ese dato estaba obsoleto. Verificado el
  2026-09-03: `app/features/prophecies/index.tsx:297-299` tiene un
  `useEffect(() => scrollRef.current?.scrollTo({y: 0, animated: false}), [phase])` con
  un comentario que cita explícitamente "QA BUG-10". Arreglado en `b17ec99`
  ("fix: prophecies back-nav returns to hub first, plus scroll-reset on step change"),
  confirmado como ancestro de `main`. El arreglo cubre más que el repro original
  (Anterior/Siguiente, salto desde el índice, tarjeta "hoy", auto-avance narrado).
- **BUG-1 … BUG-9, BUG-11, BUG-12 — reportados como cerrados** en las tandas A–E del
  mismo día (2026-07-14/15). **No re-verificados en vivo** en esta revisión; si el
  Modo C toca su área, vale una comprobación de paso.
