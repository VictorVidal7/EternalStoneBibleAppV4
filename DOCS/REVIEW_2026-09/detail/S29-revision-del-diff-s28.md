# Sesión 29 — revisión del diff de la 28 (`f305fa2..53e79fa`)

**Fecha:** 2026-09-29. **Modo:** solo terminal, sin agentes. **No se tocó código de la app:** las
sondas editaron `SyncEngine.ts` en caliente y se restauraron con `git checkout` (diff vacío
verificado cada vez). La matriz corrió en un worktree aparte, que después se borró.

## 1. Estado de partida

- `main` = `origin/main` = `e1c356c` (checkpoint de la 28). El último código es `53e79fa`.
- **CI de `origin/main` verificado en el log:** run `36606915072`, 3 jobs verdes, Node v24.21.0,
  367/4433, cero «failed to run».

## 2. Resumen

- **Ningún P0. 4 hallazgos nuevos, todos P3: `R9-185`..`R9-188`.** Quedan 1 P0 abierto (`R9-38`) y
  188 hallazgos.
- **Lo principal (`R9-185`):** la guarda de `R9-176` desarma a `R9-181`, que se arregló en el mismo
  diff (corolario 4). Mientras una escritura propia espera en la cola, la guarda borra de disco la
  marca de un conflicto retenido, y tras reiniciar el conflicto no vuelve. Medido, con una hipótesis
  de arreglo que también se midió.
- **La matriz entera, re-medida:** da lo mismo que en la 28, pieza por pieza. Las piezas nuevas de
  esta revisión encontraron un `settle` sin prueba y dos guardas equivalentes por construcción.
- **Las pruebas ajustadas en `d093a4e` siguen vigilando lo suyo:** cada una cae al revertir la pieza
  que dice vigilar.

## 3. Pregunta 1 — el mock contra el SDK

- **merge superficial.** **No.** Las 5 entidades sincronizadas (subrayados, notas, favoritos,
  tarjetas y eventos de repaso) son planas: sus campos son primitivos o arrays (los `tags` de
  favoritos), y el merge del SDK también reemplaza un array entero. Con un mapa anidado, el SDK
  conserva la clave anidada que falta y el mock la tira.
- **`__fire` entrega aunque no cambien los datos.** **No, medido.** Con un `__fire` fiel al SDK
  (`_scratch/S29-mk.cjs.txt`, modo `fire-fiel`), se suprimen 28 entregas en 24 pruebas y las 160
  siguen verdes (`S29-fire-fiel.out.txt`). Son re-envíos manuales tras un reinicio, que el enganche
  del mock ya había re-entregado.
- **un solo ejecutor global.** **Coincide con RNFB en Android** (leído en `node_modules`, 26.2.0).
  `TaskExecutorService` guarda los ejecutores en un mapa ESTÁTICO por nombre (`RNFBDocument` +
  `TransactionalExecutor`), sin app ni base de datos en el nombre. Así que hay uno por módulo nativo
  para todo el proceso, no uno por instancia de Firestore. El módulo de colecciones (query `get()`,
  `onSnapshot`) tiene otro, y el mock tampoco lo pasa por el ejecutor. iOS: sin mirar.
- **`delete()` en el ejecutor.** **No.** El `delete()` del mock no toca la nube ni la vista y no
  entrega eco; en el SDK es una escritura con compensación de latencia. Su único llamador,
  `cleanupOldReviewEvents`, corre antes de enganchar. Además, RNFB resuelve el `documentDelete` al
  EMITIRLO: `Tasks.call` devuelve la `Task` interna sin esperarla, así que un rechazo del servidor
  nunca llega a JS. El mensaje de `d093a4e` dice «`set()`/`delete()` … (con su eco)»: es falso para
  `delete()` (`R9-188`).
- **el ack un macrotask después del eco.** **No encontré qué decida.** En RNFB el `set()` retiene el
  ejecutor solo para emitir, y el ack llega un viaje de red después. Ninguna rama del motor depende
  de que el ack llegue antes de que termine el lote del eco. Sin medir con un ack más tardío.
- **la reversión después del rechazo.** **Decide `R9-182`.** El mock sigue al SDK de JS:
  `__PRIVATE_syncEngineRejectFailedWrite` llama primero a `processUserCallback` y después emite, «so
  that they consistently happen before listen events». Pero en RNFB la promesa y el evento viajan a
  JS por canales distintos, y eso no está medido. Si en el teléfono la reversión llegara antes, la
  escritura seguiría en la cola, la guarda de `R9-176` la cubriría y `R9-182` no ocurriría. Nota en
  `R9-182`.

## 4. Pregunta 2 — las pruebas ajustadas al cambiar el mock

Medidas con la matriz (`_scratch/S29-matriz.cjs.txt`, piezas `T-*`). **Todas caen al revertir la
pieza que dicen vigilar:**

| Prueba (ajuste)                                                     | Pieza revertida                                        | Cae   |
| ------------------------------------------------------------------- | ------------------------------------------------------ | ----- |
| tombstone propagation (flag `uid`)                                  | `T-tomb` la lápida no se aplica como borrado           | sí    |
| initial bulk push: queues every local row (`drain()`)               | `T-bulk` no encola filas                               | sí    |
| initial bulk push: re-pushes ONCE… legacy (`drain()`)               | `T-heal` el flag `'1'` también salta                   | sí    |
| second remote write replaces the existing conflict (flag `uid-rep`) | `T-replace` agrega en vez de reemplazar                | sí    |
| keepTheirs: applies remote locally without queueing (flag `uid-kt`) | `T-kt` keepTheirs sube siempre                         | sí    |
| merge: applies merged value + queues a push (flag `uid-mg`)         | `T-merge` merge no sube                                | sí    |
| quota: advances the cursor once resolved (flag `${uid}`)            | `T-cursor` resolveConflict no avanza                   | sí    |
| las 4 de `R9-104` (`@sync_first_push_done:uid-beto`)                | `R104-1` (2), `R104-2` (1), `R104-3` (1), `R104-6` (1) | las 4 |
| `R9-161` «una edición mía de ANTES…» (la nube ya tiene doc-c)       | `T-161cola` keepTheirs no mira la cola                 | sí    |

**El fixture de `R9-161` ya no responde nada, y lo que afirma es falso desde `53e79fa`.** En su
forma original (la nube sin el doc), la prueba **pasa** sobre el código de hoy
(`S29-sonda-q35.out.txt`). Tras un solo rechazo, la escritura sigue en la cola y la guarda de
`R9-176` impide el borrado. Son falsos el comentario de la prueba («el motor BORRARÍA L de local»)
y la frase de `R9-182` «su forma original sirve como prueba de este hallazgo»: esa forma pasa con
`R9-182` sin arreglar, porque `R9-182` necesita el descarte tras 8 intentos (`R9-188`).

## 5. Pregunta 3 — la cadena de `R9-175`

- **¿Quién más mueve el cursor o el conjunto no asentado fuera de la cadena?** El cursor, nadie más
  que `resolveConflict` (`R9-183`). El conjunto, también `resolveConflict`: borra el doc resuelto y
  hace `void saveUnsettled`, que persiste el conjunto ENTERO en memoria, con lo que un lote en vuelo
  ya retuvo o soltó. Leído: es inofensivo, porque solo adelanta a disco retenciones (más
  conservador) o sueltas de docs ya aplicados. `stop()` y `loadCursor` (el cursor envenenado de
  `R9-35`) actúan en el borde de la sesión.
- **El plazo de 60 s (sonda Q3a):**
  - vencido, cuenta como lectura fallida y hace `settle`: un conflicto retenido pierde la marca en
    disco y tras reiniciar no vuelve (el caso de `R9-181`). La respuesta tardía se descarta
    (`R9-186`);
  - **no libera el ejecutor único de RNFB:** con la lectura colgada, una escritura de otro doc no
    sube ni antes ni después del plazo, ni tras `stop()` + `start()` de la misma cuenta
    (`subidasTrasPlazo: []`, `subidasTrasReinicio: []`). El comentario de
    `REMOVED_LOOKUP_TIMEOUT_MS` dice «waiting only delays this collection's later batches»; el de
    `stop()`, que la cuenta siguiente no espera (`R9-186`, nota en `R9-177`).
- **`stop()` + `start()` de la MISMA cuenta con un lote colgado (sonda Q3b):** la cadena nueva
  corre (`z nuevo` se aplica y el cursor avanza). El `removed` de X se pierde: X se queda en v1 y la
  nube tiene el respaldo bajo el piso. Es el tercer disparador de `R9-164` (registrado en la 27), y
  el comentario de `handleSnapshot` lo nombra como excepción. Nada nuevo.

## 6. Pregunta 4 — `R9-181`: la marca por identidad y `heldAt`

- `recordConflict` guarda el objeto tal cual, y `{...pending, remoteVersion: data}` es superficial,
  así que `conflict.remoteVersion === remote` compara el mismo objeto que se acaba de registrar.
- **Si `recordConflict` clonara** (pieza `S181-clon`), cae 1 prueba, la misma que `S181-suya`: «la
  marca sigue a su versión más nueva». La corrección no cambia: la marca que no sigue queda MÁS
  BAJA, y se relee de más (cuota). La re-detección tras reiniciar compara `heldAt` por valor.
- **Una re-entrega de la misma copia en otro objeto** nunca mueve mal la marca. Si es más nueva que
  lo local, la rama `pending` la vuelve a registrar con el objeto nuevo, y la identidad se cumple.
  Si no lo es, no se registra, y la marca se queda donde estaba.
- Sin hallazgo. El contrato vive en dos sitios, y `recordConflict` no lo nombra.

## 7. Pregunta 5 — la guarda de `R9-176`/`R9-178` y la marca

**Sonda (`_scratch/S29-sonda-q35.body.txt`, salidas en `S29-sonda-q35.out.txt`):**

1. Un conflicto retenido («lo mío» contra «lo suyo»).
2. El usuario edita el doc, y la subida falla una vez y espera su reintento.
3. El otro teléfono restaura un respaldo, que sale de la query.
4. Se reinicia.

| Variante                         | Marca tras el `removed`          | Tras reiniciar                                  |
| -------------------------------- | -------------------------------- | ----------------------------------------------- |
| **hoy** (la guarda con `settle`) | `{}`: borrada de disco           | **0 conflictos**, marca `{}`                    |
| sin la guarda                    | en el respaldo (`T - DAY`)       | `[lo mío editado, su respaldo viejo]`           |
| la guarda sin `settle`           | se queda en «lo suyo» (`T+65 s`) | 0 conflictos; la marca queda clavada (`R9-164`) |
| **H1**: marca a la copia leída   | en el respaldo                   | `[lo mío editado, su respaldo viejo]`; 164/164  |

- **En la sesión (Q5b), mientras la subida reintenta:** el eco de cada reintento vuelve a retener
  el doc en «lo suyo», la marca vieja, y su reversión lo vuelve a soltar. En disco queda `{}` en
  cada paso, de los intentos 2 a 7, durante todo el backoff.
- **Cuando el motor se rinde:** la reversión final re-lee, y la marca vuelve al respaldo (con
  `fromRead`). Solo entonces el conflicto sobrevive a un reinicio.
- **Si la app se reinicia antes:** el conflicto se pierde. Si la subida después entra, la nube se
  queda con lo mío sin que el usuario elija; si se descarta, la nube y el teléfono quedan divergentes
  (con el aviso de `R9-33`). Es `R9-185`.
- **La afirmación de `53e79fa`** («decide su eco, que lo vuelve a retener si su conflicto sigue
  esperando») es cierta solo por momentos: re-retiene en la copia vieja, y la reversión lo suelta.
- **`R9-182` por el mismo camino:** la guarda lo cubre mientras la subida reintenta. En el descarte,
  la escritura sale de la cola antes de que llegue la reversión y se borra lo local, como está
  registrado. Depende del orden que eligió el mock (§3).

## 8. Pregunta 6 — las afirmaciones

Contra el código y las mediciones:

- **Se sostienen:**
  - la tabla de la matriz del `detail/S28-*` (re-medida, igual pieza por pieza);
  - 367/4433 (en el log de CI);
  - «el plazo tumba 2», «la cadena tumba 7» (10 en `c163659`, antes de quitar las 3 RNFBw);
  - la guarda de `R9-180` no es equivalente;
  - la sesión se toma en el callback;
  - `stop()` vacía las cadenas;
  - la re-entrega hace caer las 4 de `R9-104`.
- **No se sostienen:**
  - el comentario de `REMOVED_LOOKUP_TIMEOUT_MS` y el de `stop()` (`R9-186`);
  - «decide su eco» (`53e79fa` y el comentario de la guarda, `R9-185`);
  - el comentario de la prueba de `R9-161` y la frase de `R9-182` sobre su forma original (`R9-188`);
  - «`set()`/`delete()` … (con su eco)» de `d093a4e` (`R9-188`);
  - «Any other older copy is this device's own earlier write» (comentario nuevo de
    `applyRemoteChange`, `R9-188`). Es falso si el reloj del otro teléfono va atrasado: una
    escritura suya más vieja que lo local, con el conflicto pendiente, no es «suya» para la rama
    `pending` y no es `heldAt` tras reiniciar. Leído, sin medir.
  - el comentario de `pushOne`, que atribuye el «por construcción» a la ruta con `item.uid`: lo da
    el `throw` de dos líneas antes (`R9-187`).

## 9. Pregunta 7 — la matriz entera

`_scratch/S29-matriz.cjs.txt` (el de la 28 más 17 piezas nuevas), `NODE_ENV=development`, suite de
160, en un worktree aparte. Salida: `_scratch/S29-matriz-final.out.txt`.

- **Las piezas de la 28, re-medidas: idénticas a la tabla de la 28.** P1 5 · P2 1 · P3 5 · P4 1 ·
  P5 3 · P6 2 · P7 3 · P8 4 · G2..G6 y G9 1-2 · G8 3 · G10 3 · R104-1 2 · R104-2 1 · R104-3 1 ·
  R104-4/5/7 0 · R104-6 1 · S175 7/2/1/2/1/2 · S181 2/2/2/1/1 · S176 5 · R154 1.
- **G7 sale AUSENTE:** no es un hueco de la matriz, porque su código (`isSyncing`) ya no existe
  (`7292b78`). No hay nada que revertir.
- **Piezas nuevas:**

| Pieza                                  | Caen | Lectura                                         |
| -------------------------------------- | ---- | ----------------------------------------------- |
| `S176-settle` la guarda sin `settle`   | 0    | sin prueba, y no es equivalente (§7): `R9-185`  |
| `S181-clon` `recordConflict` clona     | 1    | la de cuota (§6)                                |
| `S175-catch` la cadena sin su `.catch` | 0    | equivalente por construcción: `R9-187`          |
| `R104-8` = 5 + 7                       | 0    | las cubren `R104-4` y `R104-2`                  |
| `R104-9` = 4 + 5 + 7                   | 1    | la misma prueba que `R104-6`, con otra aserción |
| `R104-10` = 4 + 7                      | 0    | —                                               |
| `T-*` (8 piezas)                       | 1-20 | §4                                              |

- **¿Es `R104-7` equivalente por construcción con `R104-5`?** Sí, en un sentido. El `throw` de
  `item.uid !== this.uid` y la ruta `users/${item.uid}` van en el mismo bloque síncrono
  (`SyncEngine.ts:2480-2484`): con `R104-5` puesta, las dos rutas son la misma cadena. En el otro
  sentido no: sin `R104-4` ni `R104-5`, la ruta decide en qué nube cae lo de Ana, y por eso
  `R104-9` cae por otra aserción que `R104-6`. Por la regla 37, sobra una de las dos (`R9-187`).
- **`R104-4` y `R104-5` sueltas dan 0 por TIEMPO, no por construcción:** se cubren entre sí con el
  corte de `R104-2`. Pero `R104-4` tiene un efecto propio que nadie vigila: sin ella, el
  `updateState({pendingWrites, lastSyncedAt, lastError: null})` de un push de Ana que vuelve tras
  el `stop()` corre en la sesión de Beto (`R9-187`).

## 10. Hallazgos nuevos

- **`R9-185` (P3):** la guarda de `R9-176` borra la marca de un conflicto retenido mientras la
  escritura propia espera; tras reiniciar, el conflicto de `R9-181` no vuelve.
- **`R9-186` (P3):** una lectura del `removed` que falla o vence el plazo suelta el doc: un
  conflicto retenido pierde la marca. Además, el plazo no libera el ejecutor de RNFB, y los
  comentarios dicen lo contrario.
- **`R9-187` (P3):** piezas equivalentes por construcción (`R104-7` con `R104-5`; el `.catch` de
  `enqueueSnapshot`) y un efecto sin prueba (`R104-4`).
- **`R9-188` (P3):** afirmaciones falsas en la prueba de `R9-161`, en `R9-182`, en `d093a4e` y en
  un comentario nuevo de `applyRemoteChange`.

**Notas a hallazgos registrados:**

- `R9-177`: el plazo no libera el ejecutor (medido en el mock);
- `R9-182`: depende del orden «rechazo antes que reversión», que en RNFB no está medido.

## 11. Lecciones

- **Dos arreglos del mismo diff, otra vez (corolario 4).** La guarda de `R9-176` se midió contra
  sus casos (sin conflicto retenido). El conflicto retenido era justo lo que `R9-181` acababa de
  hacer durable. Ante una guarda que hace `settle`, preguntá qué marcas suelta.
- **Una guarda que «deja decidir al eco» tiene que decir qué pasa si el eco no llega o llega para
  soltarlo.** Aquí el eco llega (retiene) y su reversión también (suelta): el estado en disco
  durante el backoff es el de la reversión.
- **Un plazo del motor no es un plazo del SDK.** `withDeadline` suelta el `await`, no el
  ejecutor nativo: la lectura colgada sigue ocupándolo.

## 12. Sondas

En `_scratch/` (todas con `.txt` al final):

- `S29-matriz.cjs.txt` (con `S29_ROOT` para correrla en otro árbol), `S29-matriz-final.out.txt` y
  `S29-matriz-ctl.out.txt`;
- `S29-mk.cjs.txt`, que arma `__tests__/S29sonda.test.ts` con un cuerpo insertado, o con el modo
  `fire-fiel` o `r161-orig`, y lo borra con `--clean`;
- `S29-sonda-q35.body.txt` y `S29-sonda-q35.out.txt`;
- `S29-fire-fiel.out.txt`.
