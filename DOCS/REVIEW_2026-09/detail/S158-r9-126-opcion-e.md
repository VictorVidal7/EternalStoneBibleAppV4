# S158 — `R9-126` opción E: el bulk push del primer inicio espera al servidor

> **Sesión 158 (2026-11-17).** Chat nuevo, en la terminal, con **Opus 5.5 de principal**, esfuerzo `high`, y **3
> agentes a pedido de Victor**. **Sin emulador: nada de esto está medido en vivo.**
>
> **Resultado.** La E entró (`2e9b042b`, en `fix/s158-r9-126-e`). El bulk push de cada colección espera a que su
> listener aplique un snapshot del servidor, y no sube lo que la nube ya tiene. 10 pruebas; 6 piezas vistas caer en
> el principal; la matriz de vecinos con C apilada: 24 casos, ninguno rompe, 14 mejoran. El agente 2 halló que el
> envoltorio de Firestore perdía `metadata`: sin arreglarlo, la E no habría esperado nada en producción. `R9-126`
> sigue abierto por B, R y el push en vuelo. Ningún hallazgo nuevo con número.

## 1. Estado de partida

main = origin/main = `5ec6b06c`, como pedía el mensaje. Validador: 0 avisos y 0 errores; 277 abiertos de 597.

## 2. Los agentes

Reglas comunes: `_scratch/S158-agentes-reglas.md.txt`. El diseño se fijó antes de repartir:
`_scratch/S158-diseno-E.md.txt`. Informes y salidas: `_scratch/S158-sondas-agente-<N>/`. Ninguno se cortó.

| N   | Modelo y esfuerzo       | Qué                                                           | Llamadas | Min |
| --- | ----------------------- | ------------------------------------------------------------- | -------- | --- |
| 1   | Sonnet, `medium`        | línea base con HEAD; después, lo mismo con la E               | 18 + 14  | 3   |
| 2   | Opus 5.5, `high` (fork) | el arreglo, los 13 mocks, la prueba y las 6 piezas            | 65       | 12  |
| 3   | Opus 5.5, `high` (fork) | la matriz de vecinos (sonda propia), columna HEAD y columna E | 32       | 9   |

- El worktree del agente 1 se borró solo al terminar (no tenía cambios). Su salida de la 154 se perdió con él; la
  re-medición corrió en el worktree del agente 3, ya terminado.
- El agente 2 dijo que copió su diff y no lo copió. El orquestador lo generó desde su worktree
  (`git diff HEAD`, 14 archivos) y comprobó con `cmp` que el commit es idéntico a ese árbol.

## 3. El daño, medido con HEAD (agente 1)

| Caso (A / nube / B / teléfono nuevo)              | HEAD          |
| ------------------------------------------------- | ------------- |
| 1a. Bulk push en línea (C2)                       | V / V / N / V |
| 1b. Primer snapshot antes del flush (lo cierra C) | N / N / N / N |
| La sonda de la 154, C2                            | V / V / N / V |

- Verificado por el orquestador en `S158-a1-s156-head.ver.txt` (`bulk_online`: nube V, `pushes` [V]).
- La 154 infirió del mock que A también se queda con V. La prueba nueva lo mide: con HEAD, A queda en V.
- Las 13 suites que mockean `onSnapshot`: 423 de 423 con HEAD.

## 4. El diseño (decidido por el orquestador; el diseño técnico de sync está delegado)

1. **Esperar al servidor, por colección.** El bulk push de una colección espera a que su listener entregue y
   aplique (la cadena de R9-175) un snapshot con `metadata.fromCache !== true`. Sin `metadata` cuenta como servidor.
   - Por qué no «el primer snapshot»: con caché, el SDK entrega primero la caché (sin red, o con docs en caché: el
     reintento de R9-257 y la marca `'1'` heredada). Esa entrega no trae la copia nueva.
   - **El listener pide `{includeMetadataChanges: true}`.** Sin eso, el paso de caché a servidor sin docs cambiados
     no levanta evento: el bulk push esperaría para siempre (una cuenta nueva vinculada sin red).
   - `docChanges()` sin opciones deja fuera lo solo de metadata (`FirestoreQuerySnapshot.ts:146-150`, RNFB 26.2.0):
     los eventos extra llegan sin cambios y `handleSnapshot` vuelve en su primera línea. Cero lecturas extra.
2. **No subir lo que la nube ya tiene.** El listener anota el reloj de cada doc de su vista. Una fila con reloj
   `<=` al anotado no se encola.
   - Por qué: tras aplicar el snapshot, lo local ES la copia de la nube. Sin el filtro, «Migrar» a una cuenta con
     datos re-subía toda la nube: el agente 3 midió 20 escrituras en vez de 5 (20 es el tope de un flush).
   - Cubre el conflicto retenido: el lado viejo no sube; la persona elige.
   - Una lápida más nueva en la nube borra la fila (LWW): no se encola. Una más vieja: la fila sube.
3. **Las salidas de la espera** (R9-212). `stop()`: vuelve sin marca ni lista; el start siguiente lo corre. Error
   del listener, `unregister` o re-attach: la colección va a la lista de R9-257. Sin listener: igual. Sin red:
   espera mientras vive el proceso, sin escribir nada.
4. **Lo que no cambia.** El salto de R9-127 se consume antes de todo `await`. La marca y la lista se leen antes de
   esperar. C sigue igual.

## 5. Lo que entró (`2e9b042b`)

- `SyncEngine.ts`: `serverSync` por colección (una promesa que termina en `server`, `error` o `stopped`), los
  relojes de la vista mientras un bulk push los puede leer, y la espera en `runInitialBulkPush`.
- `firestore.ts`, **hallazgo del agente 2, arreglado en el mismo diff.** El envoltorio del API modular perdía
  `metadata` en `wrapQuerySnapshot` y no pasaba opciones a `onSnapshot`. En producción todo snapshot contaba como del
  servidor. Ahora pasa las opciones (`mod.onSnapshot(query, options, onNext, onError)`) y conserva `fromCache`.
  - El orquestador leyó `parseSnapshotArgs` (`utils/index.ts:200-220`): con un objeto primero, toma las opciones y
    después `onNext` y `onError`. Sin prueba en jest: todas las suites mockean el envoltorio.
- Los 11 mocks de `onSnapshot` que reciben callback aceptan las opciones primero. Tres no entregaban nunca un
  snapshot y ahora entregan uno vacío, como el SDK. El de `SyncEngine.test.ts` suma `mockAttachFromCache` y
  `__fireMetadataSync` (solo dispara si el listener pidió metadata).

## 6. La prueba y las piezas

`__tests__/s158-r9-126-bulk-espera.test.ts`, 10 casos. Con HEAD caen 7: C2, primero la caché, la cuenta nueva sin
red, el conflicto a 10 s, la lápida más nueva, `stop()` en la espera y el error del listener. Pasan con HEAD los
controles: «Migrar» con datos, la lápida más vieja y el salto de R9-127.

Las piezas, vistas caer en el principal (`_scratch/S158-piezas.out.txt`, `restaurado: OK`):

| Pieza                  | Caen | Por qué                                                           |
| ---------------------- | ---- | ----------------------------------------------------------------- |
| `sin-espera`           | 7    | A recibe V; no hay conflicto; la lápida revive; marca y lista mal |
| `cache-cuenta`         | 4    | sube desde la caché antes del evento del servidor                 |
| `sin-metadata-changes` | 2    | tras el evento solo de metadata no sube nada: espera para siempre |
| `sin-filtro`           | 4    | re-sube lo que vino de la nube; el lado viejo del conflicto sube  |
| `parado-escribe`       | 1    | tras `stop()` la marca queda en `'2'`, no nula                    |
| `error-cuelga`         | 1    | tras el error la marca queda nula, no `'2'` con la lista          |

Gates en el principal: las 14 suites, 433 de 433; `tsc` limpio; prettier. El agente 2 corrió jest entero en su
worktree: 386 suites, 4873 de 4873.

## 7. La matriz de vecinos, con C apilada (agente 3)

Sonda: `__tests__/s158a3-vecinos-e.test.ts` (en `S158-a3.diff.txt`), con su propia copia del arnés. La columna E se
re-midió con el diff final: los 24 casos dan lo mismo que la provisional (19 de 19 pasan, `motor restaurado: OK`).

| Caso                                                | HEAD (A / nube / …)   | E                          | Veredicto  |
| --------------------------------------------------- | --------------------- | -------------------------- | ---------- |
| C2 en línea                                         | V / **V** / N / **V** | N / N / N / N; sube solo S | mejora     |
| R9-257: reintento con caché [V], nube N             | nube **V**            | nube N                     | mejora     |
| R9-257: reintento, nube V                           | sube doc y S          | sube solo S                | mejora     |
| marca `'1'` heredada                                | nube **V**            | nube N                     | mejora     |
| R9-263: marca ilegible                              | no corre              | igual                      | sin cambio |
| R9-127: salto por uid, `deletionSkip`, armado tarde | `skip`, nada sube     | igual                      | sin cambio |
| `stop()`+`start()` de la misma cuenta en la espera  | una vez, nube **V**   | una vez, nube N            | mejora     |
| `stop()`+`start()` de otra cuenta                   | Y nada                | X sin marca, Y nada        | sin cambio |
| batch del servidor retenido a través de `stop()`    | nube **V**            | el viejo no corre; nube N  | mejora     |
| R9-37: `unregister`+`register` en la espera         | nube **V**            | a la lista; luego solo S   | mejora     |
| C: edición D sin red, snapshot antes de la red      | N en todos            | igual                      | sin cambio |
| C: edición D sin red, red antes del snapshot        | nube **D**            | igual                      | sin cambio |
| R9-179: el ack solo de metadata con `fromCache`     | corre al arrancar     | no cuenta como servidor    | mejora     |
| R9-212: cola sin leer                               | disco [o, solo]       | igual                      | sin cambio |
| «Migrar»: 50 en la nube, 5 propios                  | 5 escrituras          | 5 escrituras               | sin cambio |
| «Migrar»: los mismos 50, viejos en A                | d0 en la nube **V0**  | N0 en todos                | mejora     |
| cuenta nueva sin red, todo vacío                    | corre sin red         | espera; corre al volver    | sin cambio |
| error del listener                                  | nube **V**            | a la lista; luego nube N   | mejora     |
| conflicto dentro de la ventana                      | nube **L**, 0 confl.  | nube N, 1 confl. pendiente | mejora     |
| lápida más nueva en la nube                         | revive V              | la fila se borra           | mejora     |
| lápida más vieja que la fila                        | sube V                | igual                      | sin cambio |

- La fila «red antes del snapshot» es el límite de C, ya escrito en `R9-126`: la edición sube antes del apply.
- Verificado por el orquestador en las salidas (`S158-a3-out-*.json.txt`): C2, los dos «Migrar» (5 y 5; sin filtro,
  20 y 20) y el conflicto.
- **Por lectura, sin número:** la E alarga la ventana entre `start()` y el bulk push. Un `deletionSkip` armado en
  esa ventana no se honra en esa sesión. En la app no pasa: `deleteAccount` para el motor antes, y la espera termina
  «parado», sin marca. No se midió con el `AuthContext` real.

## 8. Re-medición con la E (agente 1)

Con el diff de la E aplicado (y revertido con `git apply -R`), en el worktree del agente 3.

| Sonda                                       | HEAD                      | E                       | Veredicto  |
| ------------------------------------------- | ------------------------- | ----------------------- | ---------- |
| 156, agente 5: `bulk_online` (C2)           | V / V / N / V, 1 push     | N / N / N / N, 0 pushes | lo buscado |
| 156, agente 5: las otras 8 filas            | —                         | idénticas               | sin cambio |
| 154, agente 7: C2                           | A V, nube V, B N, nuevo V | N en todos, 0 pushes    | lo buscado |
| 154, agente 7: C1 (restaurar), C3 10 y 60 s | —                         | idénticas               | sin cambio |
| 157, agente 5: a3 (cola) y a4 (retenidos)   | 11 y 7 líneas             | idénticas               | sin cambio |
| 157, agente 5: a5 (productores)             | —                         | solo `bulk_online`      | lo buscado |
| 157, agente 5: «sin pregunta» de la 155     | skip/0; «Migrar» `'2'`/1  | idéntico                | sin cambio |
| las 14 suites                               | 423 (13 suites)           | 433 de 433              | —          |

- Verificado por el orquestador en `S158-a1-s156-E.ver.txt` (`bulk_online`: nube N, `pushes` []).
- **Las sondas viejas con un mock propio de `onSnapshot` dejan de andar con la E**, y no por la E: a4 de la 157 cayó
  6 de 6 (`snapshotCb is not a function`) y «sin pregunta» daba marca nula (su mock nunca entregaba un snapshot). El
  agente 1 adaptó sus copias como el agente 2 adaptó los 13 mocks del repo. Esas sondas no están en el repo.

## 9. Sin medir

- Todo, sin emulador. En particular, el SDK nativo con `includeMetadataChanges`: que llegue el evento de caché a
  servidor y que `docChanges()` deje fuera lo solo de metadata (solo leído en RNFB).
- El envoltorio de `firestore.ts`: sin prueba en jest.
- El proceso que muere durante la espera (no cabe en jest): nada se escribió, el start siguiente lo corre.
- Un reloj igual con otro contenido (`R9-216`): con `<=`, la fila no sube.
- Un adaptador registrado durante la espera: a la lista de reintento, por lectura.

## 10. Estado al cerrar

`fix/s158-r9-126-e` (`2e9b042b`) y los docs en `docs/review-s158`, encima. Sin mergear: espera el OK de Victor.
`R9-126` sigue abierto: B (restaurar, `CONTINUAR.md` §8), R (reglas, con `R9-4`) y el push ya en vuelo.
