# A4 — `SyncEngine.ts` (1378 L) y las colas de escritura

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 4 (2026-09-03) · Estado
> **🐛 BUG** (7 hallazgos: `R9-33`..`R9-39`, **6 de ellos P0**)

## Alcance y método

El módulo entero: `SyncEngine.ts` (1378 L) leído de punta a punta, más `types.ts`,
`timeUtils.ts`, `netinfo.ts`, `firestore.ts`, `registerOfflineAdapters.ts`,
`instance.ts`, los 3 adaptadores de `adapters/`, `src/context/SyncEngineContext.tsx` y
la pantalla de conflictos `app/(tabs)/conflicts.tsx`.

`A5` cerró el lado de **escritura** (los 13 call sites) y dejó explícitamente para esta
fila: **reintentos y backoff, resolución de conflictos, cursores, hidratación y el coste
de lectura de `onSnapshot`**. Eso es lo que cubre este archivo. `R9-11` (la ventana del
flush en vuelo) ya está reportado desde `A5` y **no se repite aquí** — pero sí se reporta
su **gemelo en la rama de error**, que es otra línea y otro arreglo (`R9-34`).

**Sonda ejecutable.** Los 7 hallazgos se montaron como suite en
`_scratch/a4probe.test.ts` (arnés copiado de `__tests__/SyncEngine.test.ts`, mocks
oficiales, sin tocar código de la app). **Las 7 sondas pasan**, así que ninguno de estos
hallazgos cuelga solo de una lectura. La sonda se borró al cerrar la fila (`_scratch/`
está gitignoreado pero **no** jest-ignoreado — dejarla ahí la sumaría a `npm test`). La
receta para reconstruirla está en cada hallazgo.

## Cobertura de tests

`__tests__/SyncEngine.test.ts` son **1555 líneas / 44 casos** y es un test bueno: cubre
LWW, tombstones, ids con `/`, bulk push y sus 3 flags, sanitización S78, offline →
online, persistencia de la cola, detección de conflictos en sus 5 variantes, las 3
resoluciones, y **9 casos de cursor** (usuario nuevo, reinstalación, no retroceder,
retención por conflicto…). No es un área desatendida.

Lo que **no** cubre, y es exactamente donde están los 7 hallazgos:

| Hueco                                                          | Evidencia                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------- |
| El camino de **reintento/descarte** (`MAX_RETRY_ATTEMPTS`)     | `grep "MAX_RETRY\|dropping\|max retries"` → **0 resultados**   |
| La rama de **error** de `flush()` (más allá de offline)        | ningún caso hace fallar `doc.set()`                            |
| Un `updatedAt` **en el futuro**                                | los 9 casos de cursor usan timestamps del pasado               |
| Editar el doc **entre** detectar el conflicto y resolverlo     | `resolveConflict — keepMine` (`:840`) resuelve al instante     |
| Escribir con la **sesión cerrada** y volver a entrar           | `queueWrite — inactive engine` solo prueba "antes de start()"  |
| Dos `attachListener` **concurrentes** sobre la misma colección | `:1028` cubre `stop()` durante el attach, no el doble attach   |
| Un conflicto pendiente **enterrado** por el cursor             | `:1459` prueba la retención dentro de la sesión, no tras salir |

---

## 🐛 `R9-33` (P0, severidad **alta**) — no hay backoff: una escritura se descarta en silencio tras 8 intentos, y Ajustes dice «sincronizado»

`src/lib/sync/SyncEngine.ts:1255-1276`

**El backoff que la documentación promete no existe.** `PendingWrite.queuedAt` está
documentado en `types.ts:97` como _"When we first queued this write. **Used for retry
backoff**"_ y `netinfo.ts:66` justifica haber aflojado la puerta de red diciendo que
_"our own queue **retries with backoff**"_. Verificado con `grep`: `queuedAt` se
**escribe** en 3 sitios (`:402`, `:426`, `:1186`) y **no se lee en ninguno**. `attempts`
solo se usa para contar hasta el descarte. No hay un solo `setTimeout`, delay ni
comparación de tiempo en toda la ruta de reintento.

Sin backoff, la cadencia de reintentos la marcan disparadores de reloj de pared —el tick
de `FLUSH_INTERVAL_MS` (60 s), cada `queueWrite` y cada transición de NetInfo— y ninguno
mira si el fallo es transitorio. Agotados los 8, la entrada **se borra de la cola y el
dato se descarta**:

```ts
if (this.queue[idx].attempts >= MAX_RETRY_ATTEMPTS) {
  logger.error('SyncEngine: dropping queue entry after max retries', ...);
  this.queue.splice(idx, 1);
}
```

No hay dead-letter, ni reencolado, ni segunda oportunidad: el `splice` va seguido de
`await this.persistQueue()`, así que el descarte se persiste.

**Y el usuario no recibe ninguna señal.** `grep` de `lastError` sobre `src/` + `app/`
excluyendo el propio módulo de sync da **cero consumidores**: ninguna pantalla lo
renderiza jamás. El indicador de Ajustes (`app/(tabs)/settings.tsx:87-112`) se construye
**solo** con `pendingWrites` y `lastSyncedAt`. Al descartarse la última entrada,
`pendingWrites` baja a 0 y el indicador cae a la rama de éxito: **la UI afirma que todo
está sincronizado en el mismo instante en que el motor tiró la escritura del usuario.**

**Escenario de fallo concreto:** el usuario escribe una nota de estudio conectado al
wifi de un hotel/aeropuerto con portal cautivo. `isStateOnline` solo mira
`isConnected === false` (aflojado a propósito en S46, `netinfo.ts:52-70`), así que el
motor se cree en línea y empuja. Los pushes fallan. **Ocho minutos después la nota se
descarta**, `pendingWrites` vuelve a 0, Ajustes dice «Sincronizado hace un momento», y la
nota nunca llega a la nube. Queda solo en el teléfono: si el usuario reinstala o cambia
de dispositivo, se perdió.

**Probado (sonda 1).** Con `doc.set()` rechazando siempre: `attempts` recorre
`[1,2,3,4,5,6,7]` y a la 8ª la cola queda **vacía**; `mockDocSets` = 0 (nunca llegó
nada a Firestore); `pendingWrites` = 0; `lastError` = `'UNAVAILABLE: simulated'` (sin
consumidor). **Tiempo total en agotar los 8 reintentos: 1 ms** — la demostración más
directa de que no hay backoff de ninguna clase.

**Confianza: CONFIRMADO** (probado).

**Forma del arreglo (no aplicado):** (a) usar `queuedAt`/`attempts` para un backoff
exponencial real, que es lo que ambos comentarios ya afirman que existe; (b) no descartar
nunca en silencio — mover la entrada a un dead-letter persistido y **superficiar el
fallo** en el indicador de Ajustes, que hoy es incapaz de mostrar un error; (c) revisar
si 8 es el número correcto cuando cada intento puede costar 1 ms en vez de minutos.

**Duda que conviene cerrar en Modo C** (no cambia el arreglo, sí el ranking): con
`@react-native-firebase/firestore` y su persistencia offline, un `set()` sin red puede
**colgarse** en vez de rechazar. Si se cuelga, el modo de fallo real es un _estancamiento_
(la cola no drena pero tampoco se descarta) y no una pérdida. Si rechaza —que es lo que
ocurre con permiso denegado, payload inválido o red que corta la conexión— la pérdida es
la descrita. Se resuelve en 10 minutos con un emulador y modo avión + portal cautivo.

---

## 🐛 `R9-34` (P0, severidad **media-alta**) — la rama de ERROR de `flush()` pisa la reedición con el snapshot viejo (gemelo de `R9-11`)

`src/lib/sync/SyncEngine.ts:1258-1262`

`R9-11` (reportado en `A5`) es la rama de **éxito**: el filtro por `collection+id` borra
una entrada más nueva que entró durante el push. Esta es la rama de **error**, otra línea
y otro arreglo:

```ts
const idx = this.queue.findIndex(
  q => q.collection === item.collection && q.id === item.id,
);
if (idx >= 0) {
  this.queue[idx] = {...item, attempts: item.attempts + 1};
}
```

`item` es el elemento del **snapshot** `items = [...this.queue]` tomado al empezar el
flush. Si el usuario reeditó el documento mientras `pushOne` estaba en vuelo,
`upsertQueueEntry` ya sustituyó la entrada por la versión nueva; al fallar el push, esta
línea la **sobrescribe con el snapshot viejo**.

**Es peor que `R9-11` en un punto:** en `R9-11` la versión nueva sigue en el almacén
local y solo la nube se queda atrás. Aquí la **cola misma** retrocede a los datos viejos,
así que ni siquiera un reintento posterior con éxito subirá la edición nueva — se empujará
para siempre la vieja.

**Escenario:** el usuario corrige el color de un subrayado (o vuelve a guardar una nota)
justo mientras el push anterior viaja, y ese push falla por una micro-caída de red. La
corrección desaparece de la cola sin dejar rastro.

**Probado (sonda 2).** Con `pushOne(v1)` colgado de una promesa controlada y `v2`
encolado entremedio: la cola **antes** de que falle contiene
`{"value":"v2-REEDITADO","updatedAt":2000}`; **después** del rechazo contiene
`{"value":"v1","updatedAt":1000,"attempts":1}`.

**Confianza: CONFIRMADO** (probado).

**Forma del arreglo (no aplicado):** el mismo que `R9-11` y conviene hacerlos juntos —
comparar identidad de **entrada** (un `seq` monótono, o `queuedAt`), no de documento, y
en la rama de error incrementar `attempts` **sobre la entrada que está en la cola ahora**,
no sobre el snapshot.

---

## 🐛 `R9-35` (P0, severidad **media-alta**) — un `updatedAt` en el futuro fija el cursor por delante del reloj y la bajada se detiene para siempre

`src/lib/sync/SyncEngine.ts:800-826` (`advanceCursor`) + `:580-586` (el suelo de la query)

El cursor de cuota es un escalar por colección que **solo avanza**, se persiste en
AsyncStorage y se usa como suelo de la query: `where('updatedAt', '>=', cursor - 5min)`.
`advanceCursor` valida que el valor sea finito, positivo y mayor que el actual — **pero
no valida que no esté en el futuro**. Y `updatedAt` es reloj de **cliente**
(`queueWrite:396-400` acepta el `updatedAt` que traiga el adaptador y solo cae a
`Date.now()` si no es numérico), así que un dispositivo con la hora adelantada escribe
timestamps futuros.

`handleSnapshot` incorpora al cursor **también los ecos de las propias escrituras del
dispositivo** (`:684-697`, deliberado y documentado). Así que el propio teléfono que tenía
mal la hora se envenena a sí mismo, y cualquier otro dispositivo de la cuenta que observe
ese documento también.

Una vez corregido el reloj (por NTP o a mano), **todas** las escrituras siguientes llevan
`updatedAt` = ahora real, que queda **por debajo** del suelo de la query. El listener deja
de entregar cambios en esa colección. Como el cursor nunca retrocede por diseño y **no
existe ninguna ruta en la app que lo resetee** (`grep` de `cursorStorageKey|sync_cursor`
fuera de `SyncEngine.ts`: **cero resultados**), el único remedio es reinstalar.

El módulo documenta el riesgo de desfase de reloj entre dispositivos como "narrow,
accepted" (`:113-127`), pero lo describe como _perder alguna escritura de un dispositivo
atrasado_. La manifestación real es distinta y mucho peor: **parada total y permanente de
la bajada** en el dispositivo receptor.

**Y sí acaba en pérdida de datos**, no solo en falta de entrega: mientras el teléfono A
no recibe nada, el usuario edita en A el mismo documento que ya cambió en B; el
`updatedAt` de A es más nuevo, así que en el siguiente push **LWW machaca en la nube el
cambio de B**, que nunca llegó a verse.

**Probado (sonda 3).** Con un doc de `updatedAt = ahora + 30 días`: cursor en memoria y
persistido = ese valor; tras reiniciar el motor con el reloj ya correcto, el suelo de la
query queda **30 días en el futuro**, y una nota legítima escrita hoy desde el otro
dispositivo **no llega nunca** (`localStore.has('nota-de-hoy') === false`).

**Confianza: CONFIRMADO** (probado).

**Forma del arreglo (no aplicado):** limitar el cursor al reloj local en `advanceCursor`
(`Math.min(seenUpdatedAt, Date.now())`, o descartar todo lo que supere `Date.now()` por
más que el margen de seguridad). El comentario del módulo ya razona en esa dirección; solo
falta el techo. Complementario: una acción de "resincronizar todo" en Ajustes que borre
los cursores, que hoy no existe y sería la salida para cualquier usuario ya afectado.

---

## 🐛 `R9-36` (P0, severidad **media**) — «conservar lo mío» empuja el snapshot de la detección y revierte lo que el usuario escribió después

`src/lib/sync/SyncEngine.ts:1010-1015` + `app/(tabs)/conflicts.tsx:89,120,230`

`ConflictRecord.localVersion` es una **foto del documento local en el momento de
detectarse el conflicto** (`types.ts:130`). `resolveConflict('keepMine')` la reenvía tal
cual, re-sellada con la hora actual, y **no toca el almacén local**:

```ts
resolvedValue = {...conflict.localVersion, updatedAt: now};
// queueWrite handles the push; local store already has this value.
this.queueWrite(conflict.collection, conflict.docId, resolvedValue);
```

El comentario _"local store already has this value"_ solo es cierto si el usuario no ha
tocado el documento desde que se detectó el conflicto. Nada lo garantiza: los conflictos
se quedan en la lista hasta que el usuario entre a la pantalla y decida. Y la pantalla
tampoco relee lo local — pinta `item.localVersion[f]` (`:230`) y siembra el borrador de
fusión desde `c.localVersion` (`:89`, `:120`).

Si el usuario editó el documento entremedio, el push lleva `updatedAt: now`, más nuevo que
su edición real. Cuando el eco vuelve por `onSnapshot`, si la edición fue hace más de
`CONFLICT_WINDOW_MS` (30 s) no se detecta conflicto nuevo y LWW aplica el valor
**viejo** encima del local: **el botón «conservar lo mío» destruye justamente "lo mío".**

**Escenario:** salta un conflicto en una nota. El usuario sale de la pantalla, sigue
escribiendo y añade un párrafo. Un minuto después vuelve y pulsa «conservar lo mío»
esperando conservar su versión. La nota revierte a como estaba antes del conflicto y el
párrafo nuevo desaparece.

**Probado (sonda 4).** Local al pulsar el botón:
`"parrafo original + PARRAFO NUEVO QUE ACABO DE ESCRIBIR"`. Lo empujado a Firestore:
`{"value":"parrafo original","updatedAt":1000}`.

**Confianza: CONFIRMADO** (probado). **Alcance acotado:** hace falta que exista un
conflicto, que son raros por diseño (dos dispositivos tocando el mismo doc dentro de 30 s).
Por eso es severidad media pese a ser pérdida de contenido escrito a mano.

**Forma del arreglo (no aplicado):** que `keepMine` relea `adapter.getLocal(docId)` en el
momento de resolver en vez de usar el snapshot, y que la pantalla muestre el valor local
vivo. Mismo tratamiento para el borrador de `merge`, que hoy parte del snapshot.

---

## 🐛 `R9-37` (P1, severidad **media**) — `attachListener` es check-then-act sobre un `await`: dos listeners en la misma colección y uno queda huérfano

`src/lib/sync/SyncEngine.ts:553-556` (la guarda) vs. `:603-627` (el `set`)

```ts
if (this.unsubs.has(adapter.collection)) return; // already attached
...
const cursor = await this.loadCursor(adapter.collection);   // ← await
if (this.uid !== uidAtAttach) return;
...
const off = query.onSnapshot(...);
this.unsubs.set(adapter.collection, off);                    // ← el set
```

Entre la comprobación y el `set` hay una lectura de AsyncStorage. Dos invocaciones
concurrentes para la misma colección pasan las dos la guarda, las dos llaman a
`onSnapshot` y la segunda **pisa el unsub de la primera** en el `Map`. El primer listener
queda vivo y sin referencia: ni `stop()` ni `unregister()` pueden soltarlo.

La guarda `uidAtAttach` (añadida por el caso que sí cubre el test de `:1028`) **no
protege aquí**: solo compara el uid, que en este escenario es el mismo.

**Camino realista hasta ahí:** `SyncEngineContext.tsx:118` documenta —y dice que se
confirmó en vivo el 2026-07-09— que `user` **atraviesa transitoriamente `null`/anónimo
durante la rehidratación de Firebase Auth en arranque en frío** para una cuenta que sigue
con sesión. Ese parpadeo produce `stop()` seguido de `start(mismo uid)`. Si el primer
attach aún está suspendido en `loadCursor`, se reanuda después del segundo y se produce el
doble attach.

**Consecuencia:** cada cambio remoto de esa colección se procesa dos veces y, sobre todo,
**se factura dos veces la lectura de Firestore** — el listener duplicado anula parte del
ahorro que justifica todo el trabajo de cursores. Es cuota y ruido, no pérdida de datos:
no hay riesgo de fuga entre cuentas porque las reglas de Firestore
(`request.auth.uid == uid`, verificadas en `B4`) rechazan al huérfano en cuanto la sesión
cambia de usuario.

**Probado (sonda 5), parcialmente.** Con `loadCursor` colgado y dos `register()`
seguidos: `onSnapshot` se llama **2 veces** para la misma colección y `unsubs` retiene
una sola. Lo que la sonda **no** demuestra es que el huérfano siga entregando tras
`stop()`: el mock del arnés guarda un único `snapshotCb`, así que el primer unsub lo
anula igualmente. Con el SDK real cada `onSnapshot` devuelve una baja independiente, por
lo que la inferencia es directa, pero **conviene decir que esa mitad es inferencia y no
medición.**

**Forma del arreglo (no aplicado):** marcar la colección como "attach en curso" antes del
`await` (un `Set<string>` de en-vuelo, o guardar en `unsubs` un placeholder), y al
reanudar comprobar además de `uidAtAttach` que sigue sin haber listener.

---

## 🐛 `R9-38` (P0, severidad **media**) — lo que se edita con la sesión cerrada no se sube nunca, y nada lo reconcilia después

`src/lib/sync/SyncEngine.ts:388`, `:413` (la salida temprana) + `:1163-1170` (el flag)

`queueWrite`/`queueDelete` salen sin hacer nada si no hay `uid`. Es correcto como
diseño local-first —`A5` lo listó con razón entre lo verificado OK— pero **no hay ninguna
pasada de reconciliación que recupere ese hueco después**. El único mecanismo que sube el
estado local completo es `maybeRunInitialBulkPush`, y corta en seco si el flag por uid
vale `'2'` o `'skip'`, que es justo lo que quedó grabado en la primera sesión.

Verificado con `grep`: `@sync_first_push_done:` y `@sync_queue_v1` **solo aparecen dentro
de `SyncEngine.ts`**. Ni el cierre de sesión, ni el borrado de cuenta, ni el reset de
Ajustes los tocan.

**Escenario:** el usuario cierra sesión (lo local se conserva a propósito), sigue usando
la app una semana —notas, subrayados, tarjetas de memoria— y vuelve a entrar **con la
misma cuenta**. Todo lo de esa semana se queda solo en el teléfono: la nube nunca lo ve,
y como LWW compara timestamps, lo local es más nuevo y tampoco se sobrescribe, así que
nada delata la divergencia. Si reinstala o cambia de dispositivo, esa semana no está.

**Probado (sonda 6).** Flag tras la primera sesión = `'2'`; 3 notas escritas con el motor
detenido; cola resultante = **0 entradas**; tras `start()` con el mismo uid, documentos
empujados = **`[]`**; las 3 notas siguen solo en local.

**Confianza: CONFIRMADO** (probado).

**Forma del arreglo (no aplicado):** un barrido de reconciliación al arrancar que compare
`pullAllLocal()` contra el cursor de cada colección y encole lo que no tenga contrapartida
en la nube —más barato de lo que parece, porque los adaptadores ya exponen
`pullAllLocal()` para el bulk push. Alternativa mínima: registrar la marca de tiempo del
`stop()` y, al volver a arrancar con el mismo uid, encolar todo lo que tenga `updatedAt`
posterior.

---

## 🐛 `R9-39` (P0, severidad **media**) — un conflicto pendiente lo entierra el cursor que adelanta cualquier otro documento de la misma colección

`src/lib/sync/SyncEngine.ts:698-708` (la retención) + `:360-363` (la promesa que no se cumple)

El motor retiene **a propósito** del cursor la marca de tiempo de un documento que quedó
en conflicto, para que un reattach futuro no lo excluya antes de resolverse. La intención
es correcta, pero **la retención es inefectiva**: el cursor es un único escalar por
colección y `maxSeenUpdatedAt` recoge el máximo de **todos los demás** documentos. Basta
con que llegue —en ese lote o en cualquier lote posterior— un documento más nuevo de la
misma colección para que el cursor salte por encima del conflictivo.

Y `stop()` borra la lista de conflictos en memoria (`:364`) apoyándose en esta promesa
explícita:

```ts
// Conflicts are transient — they snapshot the local doc at detection
// time. If the user signs back in, fresh onSnapshot events will
// re-detect any still-divergent docs.
```

**Esa promesa es falsa** en cuanto el cursor haya adelantado: al reattachar, el suelo de
la query excluye el documento en conflicto y no se re-entrega nunca. El conflicto
desaparece sin resolverse, sin aviso y sin registro, y los dos dispositivos quedan
divergentes de forma permanente — hasta que alguien vuelva a tocar el documento, momento
en el que LWW resuelve a favor del más reciente y **elimina en silencio el otro lado**,
que es exactamente lo que el sistema de conflictos existe para evitar.

**Probado (sonda 7).** Conflicto detectado (1) y cursor correctamente retenido en 0;
después llega otra nota cualquiera de la misma colección con `updatedAt` de ahora y el
cursor salta a ese valor; tras reiniciar, el suelo de la query queda por **encima** del
`updatedAt` del documento en conflicto (que era de hace una hora) y los conflictos
re-detectados son **0**.

**Confianza: CONFIRMADO** (probado).

**Forma del arreglo (no aplicado):** persistir los conflictos pendientes (hoy son solo
memoria) en vez de confiar en la re-detección; o mantener un "suelo retenido" por
colección —el mínimo `updatedAt` de los conflictos pendientes— y usar
`Math.min(cursor, sueloRetenido)` como suelo de la query mientras haya conflictos vivos.

---

## ✅ Verificado OK

- **El coste de lectura de `onSnapshot`, que `A5` dejó abierto, está bien resuelto.** Los
  "20 hits" de `A5` eran casi todos comentarios: `grep` de `onSnapshot` fuera de
  `__tests__/` da **un solo call site real**, `SyncEngine.ts:603`. Toda la bajada de la
  app entra por ahí, con **5 colecciones** (`favorites`, `memoryCards`, `notes`,
  `highlights`, `reviewEvents`), una por adaptador. El endurecimiento por cursor es
  sólido en su caso normal y está bien probado (9 casos). Las dos grietas son `R9-35`
  (sin techo) y `R9-37` (listener duplicado), no el diseño.
- **La sanitización de ids con `/` (`toDocId`/`fromDocId`, `:158-166`) es correcta y
  necesaria**, y el razonamiento del comentario —que un `/` mandaría la escritura a un
  documento anidado que el listener nunca vería— está bien capturado y probado.
- **`cleanupOldReviewEvents` está defendido dos veces** (el filtro de Firestore excluye
  fechas ambiguas y `isReviewEventEligibleForCloudCleanup` revalida cada candidato antes
  de borrar), es solo-nube, con lote acotado a 200 e idempotente. Un fallo aquí no
  bloquea el arranque del resto. Es un buen ejemplo de "la dirección peligrosa
  defendida a propósito".
- **La guarda `uidAtAttach` (`:582`) hace lo que dice** y tiene su test (`:1028`): un
  `stop()` durante el `loadCursor` no resucita un listener. La grieta de `R9-37` es otro
  escenario, no un fallo de esta guarda.
- **La degradación de `permission-denied` tras el teardown (`:610-620`) está bien
  acotada**: solo se rebaja cuando `unsubs` ya no tiene la colección, no los
  permission-denied en general. Tiene los dos tests, el positivo y el negativo.
- **`updateState` no notifica si nada cambió** (`:1327-1334`), lo que evita re-renders en
  cascada en los consumidores de React.
- **El guard `flushInFlight` y el re-flush de cortesía** (`:1296-1307`) están bien
  razonados: el re-flush **no** se dispara tras un error (`erroredOut`), que es lo que
  evita el bucle caliente de reintento.
- **`suppressLocalWriteCount` usa un contador, no un booleano** (`:437-445`), así que
  aplicaciones remotas anidadas no se pisan entre sí.
- **`hydrateQueue` filtra defensivamente** las entradas malformadas (`:456-464`) para que
  una entrada corrupta no bloquee el bucle de flush.
- **`stop()` limpia la caché de cursores en memoria** (`:369`) y las claves están
  namespaceadas por uid (`:177`), así que **los cursores no se filtran entre cuentas**.
  Es el contraste que delata a `R9-22`: aquí se hizo bien y en la cola no.

## Dudas

- **Semántica de la promesa de `set()` en `@react-native-firebase/firestore` sin red.**
  Decide si el modo de fallo real de `R9-33` es descarte (como está descrito) o
  estancamiento. No cambia el arreglo; sí el ranking. Barato de cerrar en Modo C.
- **La mitad "el huérfano sigue entregando" de `R9-37`** es inferencia sobre el SDK real,
  no medición — ver el hallazgo.
- El comentario de `cleanupOldReviewEvents` (`:314`) habla de _"the other 5 collections"_
  cuando en total son 5 contándola a ella. Nimiedad de documentación, no la reporto.
- **No revisé** `conflictAnalytics.ts` (213 L) ni `app/features/conflicts/insights.tsx`:
  son el panel de analítica sobre el log de auditoría, no la ruta de datos. Quedan para
  una fila P2 si alguien quiere cerrarlos.
