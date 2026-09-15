# S10 — revisión con ojo fresco del diff de la sesión 9 (antes de mergear)

**Sesión 10, 2026-09-15.** Mismo protocolo que las sesiones 8 y 9, ahora sobre el diff de la
9: `fix/review-p0-sync-descarta-silencio`, 5 commits, 578 líneas que tocan **la cola de
escrituras pendientes y el cursor de sync**. **Veredicto: los tres arreglos se sostienen; el
defecto estaba en una PRUEBA**, más un hueco menor de estado por-uid. Los dos arreglados
antes de mergear (`2bfa126`).

**La técnica que lo encontró: revertir cada arreglo, uno a uno, y mirar qué prueba se cae.**
Seis reverts, seis carreras de `SyncEngine.test.ts`. Cinco arreglos pasaron; uno no.

## El defecto principal: un arreglo desarmó la prueba del otro

**La prueba de `R9-34` pasaba IGUAL con el arreglo revertido.** No es que probara de menos:
es que **no llegaba a ejecutar la carrera que dice probar**.

```js
engine.queueWrite('test', 'doc1', {value: 'v1', updatedAt: 1000});
await flush(); // ← el veneno
const pending = engine.__flushForTests();
engine.queueWrite('test', 'doc1', {value: 'v2-REEDITADO', updatedAt: 2000});
```

Ese `await flush()` completa un primer intento fallido. Y eso **arma el backoff que `R9-33`
introduce en este mismo commit**: la entrada queda con `attempts: 1` y `lastAttemptAt: ahora`,
o sea **no vencida** durante 30 s. El `__flushForTests()` de la línea siguiente sale entonces
por el `flushableCount() === 0` recién añadido **sin empujar nada**. No hay push en vuelo, la
reedición no compite con nada, y la cola acaba con `v2` por la razón trivial —`upsertQueueEntry`
la puso ahí— en vez de por el arreglo.

**Dos arreglos en un mismo commit, y el primero deja ciega a la prueba del segundo.** Es una
variante nueva de la clase que venimos cazando (_el arreglo cierra el caso que su prueba cubre
y deja abierto el vecino_): aquí el vecino no es otro caso, es **otro arreglo del mismo diff**.

**Reescrita contra la carrera real.** `queueWrite` llama a `void this.flush()` de forma
**síncrona**, y `flush()` corre hasta su primer `await` —el de `pushOne`— antes de devolver el
control. Así que al volver de esa línea el push **ya está en vuelo** y `items` ya quedó
capturado con `v1`. Encolar la reedición justo después es la carrera, sin ningún `await` de
por medio:

```js
engine.queueWrite('test', 'doc1', {value: 'v1', updatedAt: 1000});
engine.queueWrite('test', 'doc1', {value: 'v2-REEDITADO', updatedAt: 2000});
await flush();
expect(engine.__getQueueForTests()[0].attempts).toBe(1); // control de la carrera
```

Ahora falla sin el arreglo con **`Expected: "v2-REEDITADO" / Received: "v1"`**, que es el
mecanismo exacto de `R9-34`: el snapshot viejo escrito encima de la entrada nueva. Lleva
además ese `expect(...attempts).toBe(1)` como **control de que la carrera ocurrió**: si un
cambio futuro vuelve a dejar `flush()` saliendo temprano, falla ese `toBe(1)` y se ve el
porqué, en vez de pasar en verde sin probar nada.

## El hueco menor: `stop()` no limpiaba el aviso de descarte

`stop()` limpia `this.conflicts` y `this.cursors` **explícitamente porque son estado por-uid**
que no puede quedar vivo para la cuenta siguiente (sus dos comentarios lo dicen). El
`droppedWrites` de `R9-33` nació después y **se quedó fuera de esa lista** — el punto ciego nº3
del charter, las enumeraciones a mano que se quedan atrás al añadir un miembro.

Alcanzable: Ajustes pinta el aviso en cuanto `user` pasa a ser Beto, y `start('uid-beto')` es
asíncrona (dos lecturas de AsyncStorage: `hydrateQueue` y `loadDroppedWrites`). Hay un render
con la sesión de Beto y el aviso de Ana. Severidad baja —es un número, no contenido— pero es
gratis cerrarlo y esta app tiene una categoría P0 entera de mezcla entre cuentas.

**No se pierde nada al limpiarlo:** el contador vive en AsyncStorage bajo
`droppedStorageKey(uid)` y `start()` lo recarga, así que **vuelve con su dueño**. La prueba lo
fija en las dos direcciones (se va con Ana, vuelve con Ana). Vista fallar primero:
`Expected: 0 / Received: 2`.

## Lo que se comprobó por REVERT y sí discrimina (no re-verificar)

| Arreglo revertido                                | Prueba que cae                                      |
| ------------------------------------------------ | --------------------------------------------------- |
| `retryDelayMs` → 0 (backoff neutralizado)        | «no quema los 8 intentos en una ráfaga de flushes»  |
| `void this.recordDroppedWrite()` → no-op         | «se rinde solo cuando las esperas pasan, y LO DICE» |
| `Math.min(seenUpdatedAt, Date.now())` → sin cota | «un updatedAt en el futuro no empuja el cursor»     |
| El descarte de cursor envenenado en `loadCursor` | «un cursor ya envenenado se descarta al cargarlo»   |
| El recálculo de `pendingWrites` en `start()`     | «no le muestra a la cuenta nueva los pendientes…»   |

Cada revert se **`diff`eó antes de correr la prueba** (lección de la sesión 8: un revert mal
hecho se ve exactamente igual que una prueba que no discrimina).

## Lo que se comprobó a mano y está BIEN (no re-verificar)

1. **La cota de `R9-35` está en el sitio correcto.** `advanceCursor` es el **único** escritor
   del cursor (los dos `cursors.set` y el único `setItem` viven ahí), así que la cota cubre a
   sus dos llamadores: `handleSnapshot` y `resolveConflict`. Ese segundo importa: con
   `keepTheirs`, `resolvedTs` es el `updatedAt` **remoto**, que puede venir del futuro.
2. **El backoff no puede dejar la cola parada para siempre.** El tick periódico (60 s) llama a
   `flush()` mirando la cola **cruda** (`queue.length > 0`), no la vencida, así que sigue
   entrando cada minuto y la primera pasada tras expirar la ventana empuja. Salir temprano no
   apaga el temporizador.
3. **El `flushableCount()` del final de `flush()` sí evita el giro caliente** que documenta,
   y por la misma razón que el filtro por uid de `R9-22`.
4. **La insignia es alcanzable**: cuelga dentro del bloque `user && !user.isAnonymous` de la
   tarjeta de cuenta (`settings.tsx:597`), hermana de la de conflictos, y
   `engine.subscribe(setState)` (`SyncEngineContext:73`) re-renderiza al cambiar el estado.
   **Lo que sigue sin verificar es que se VEA en un teléfono** — Modo C, sigue en la deuda.
5. **Una entrada reeditada estrena presupuesto de intentos** (`upsertQueueEntry` la reemplaza
   entera, con `attempts: 0`), así que un documento que el usuario toca a menudo no se
   descarta por los fallos de una carga anterior. Es lo deseable, no un escape.

## Lo que se DECIDIÓ no tocar (fuera del alcance de este diff)

- **`R9-11` sigue abierto y ahora es el vecino más caro del diff.** `R9-34` arregló la rama de
  **error** de `flush()`; la de **éxito**, diez líneas más arriba, tiene el mismo defecto y es
  **la rama común** (los push normalmente funcionan): borra por `uid+collection+id` sin mirar
  versión, así que una reedición llegada durante el push en vuelo se elimina **como si se
  hubiera subido**. Local queda verde, Firestore amarillo para siempre.
  **Se arregla con una comparación de identidad**, y sale gratis: `items` viene de
  `this.queue.filter(...)`, que conserva las **mismas referencias**, y `upsertQueueEntry`
  asigna un **objeto nuevo** — así que `this.queue[idx] !== item` distingue exactamente «me
  reemplazaron mientras empujaba». No se coló en este merge por no ampliar el alcance de una
  rama que va a `main`.
- **El comentario de `retryDelayMs` prometía «hora y media»; son 61,5 min**
  (30 s + 1 + 2 + 4 + 8 + 16 + 30 min entre los 8 intentos). Corregido en el mismo commit: el
  número **es** la promesa del arreglo. Hacia arriba solo puede ir (nada re-flushea en el
  instante en que vence una ventana; lo hace el tick de 60 s).
- **Un `attempts` o un `lastAttemptAt` no numéricos dejarían la entrada colgada para siempre**
  (`now >= NaN` es `false`), y el filtro de `hydrateQueue` valida `uid`/`collection`/`id`/`data`
  pero no estos dos. **Se miró y NO es alcanzable**: los dos campos solo se escriben desde aquí
  y siempre como número, y una entrada pre-`lastAttemptAt` cae en el `?? 0`, que es «vencida ya»
  — el comportamiento viejo. Queda anotado, no arreglado.
- **`hydrateQueue` descarta entradas pre-`R9-22` sin contarlas** en `droppedWrites`. Es
  correcto: sin `uid` no hay a qué cuenta atribuirlas, y es un descarte único de actualización,
  ya documentado en su sitio.
- **Un descarte con la sesión cerrada no se cuenta** (`recordDroppedWrite` sale por `!uid`),
  pero `flush()` tampoco corre sin `uid`, así que no hay camino.

**Compuertas al mergear:** 356 suites, **4074** pruebas (4073 + la nueva de `stop()`), `tsc`
limpio, lint 0 errores, prettier limpio.
