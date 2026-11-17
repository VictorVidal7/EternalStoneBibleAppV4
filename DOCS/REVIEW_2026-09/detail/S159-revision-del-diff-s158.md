# S159 — Revisión del diff de la 158 (`R9-126` opción E, `2e9b042b`)

> **Sesión 159 (2026-11-17).** Chat nuevo, en la terminal, con **Opus 5.5 de principal**, esfuerzo `high`, y **3
> agentes a pedido de Victor**. Sin emulador: nada está medido en vivo. Sin código.
>
> **Resultado.** La E se sostiene sobre lo apilado. Las 6 piezas caen igual, byte a byte; la matriz de vecinos da lo
> mismo. El envoltorio de `firestore.ts` está medido con las piezas reales de RNFB 26.2.0. Dos hallazgos nuevos (P3):
> `R9-598` (el bulk push de un `start()` viejo espera y filtra con el listener de otra cuenta) y `R9-599` (el costo
> de `includeMetadataChanges`, por lectura). Dos notas en `R9-126`: el error sincrónico y el piso de la query.

## 1. Estado de partida

main = origin/main = `d21d4d60`, como pedía el mensaje. Validador: 0 avisos y 0 errores; 277 abiertos de 597.

## 2. Los agentes

Reglas comunes: `_scratch/S159-agentes-reglas.md.txt`. Informes y salidas: `_scratch/S159-sondas-agente-<N>/`.
Ninguno se cortó; los tres copiaron su diff (comprobado con `ls`).

| N   | Modelo y esfuerzo       | Qué                                                         | Llamadas | Min |
| --- | ----------------------- | ----------------------------------------------------------- | -------- | --- |
| 1   | Sonnet, `medium`        | gates, las 6 piezas y la matriz de la 158 sobre `d21d4d60`  | 17       | 3   |
| 2   | Opus 5.5, `high` (fork) | romper la espera: error, `stop`/`start`, re-attach, tardíos | 26       | 7   |
| 3   | Opus 5.5, `high` (fork) | el filtro de relojes y el envoltorio contra RNFB 26.2.0     | 42       | 8   |

## 3. Lo apilado, otra vez (agente 1)

| Paso                                    | Esperado (158)        | Dio                       | Igual |
| --------------------------------------- | --------------------- | ------------------------- | ----- |
| `tsc --noEmit`                          | limpio                | limpio                    | sí    |
| jest entero, `--maxWorkers=2`           | 386 suites, 4873      | 386 suites, 4873 de 4873  | sí    |
| las 6 piezas (7, 4, 2, 4, 1, 1)         | `S158-piezas.out.txt` | `diff` vacío, byte a byte | sí    |
| la matriz de vecinos (`s158a3`)         | 19 de 19              | 19 de 19; JSON sin cambio | sí    |
| las pruebas de la 154 a la 156 apiladas | pasan                 | pasan                     | sí    |

- **El conteo de «las 14 suites, 433 de 433» de la 158 no es el del commit.** El commit toca 12 archivos de prueba
  (376 de 376). La 158 sumó `AuthContext.test.tsx` y `reviewEventsCloudCleanup.test.ts`, que mockean `onSnapshot`
  sin cambio (verificado en `S158-a2-suites.out.txt`). No es una regresión: es un conteo sin la lista.

## 4. Romper la espera (agente 2)

Sonda `__tests__/s159a2-espera.test.ts` (16 casos, registran sin afirmar), con la E y con `2e9b042b^` en el motor.

| Caso                                                    | Sin la E           | Con la E                         | Veredicto                |
| ------------------------------------------------------- | ------------------ | -------------------------------- | ------------------------ |
| error sincrónico dentro de `onSnapshot`                 | marca `2`, sube    | espera colgada en la sesión      | RNFB no lo produce       |
| error del listener viejo tras `stop()`+`start()`        | `lastError`        | la espera nueva no se toca       | sin daño de la E         |
| `stop()`+`start()` misma cuenta durante `pullAllLocal`  | sube 2 veces       | sube 1 vez                       | mejora                   |
| `stop()`+`start()` otra cuenta durante `pullAllLocal`   | cola y marca de u1 | u1 sin marca; su start lo corre  | mejora                   |
| parpadeo: `start(u)` en vuelo, `stop()`, `start(u)`     | nube V             | nube N                           | mejora                   |
| **`start(u1)` en vuelo, `stop()`, `start(u2)`**         | u1 recibe doc-1    | **u1 nunca recibe doc-1**        | **`R9-598` (P3)**        |
| `unregister`+`register` en la espera                    | sube               | a la lista; start siguiente      | se difiere               |
| adaptador tarde mientras otra colección espera          | nunca sube         | sube                             | mejora                   |
| adaptador tarde durante el `pullAllLocal` de otra       | sube               | a la lista; start siguiente      | medido (la 158: lectura) |
| adaptador tarde con el bulk push ya terminado           | nunca sube         | nunca sube                       | sin cambio (previo)      |
| mapas sin red, 500 docs                                 | —                  | 500 relojes; `stop()` los suelta | solo memoria             |
| `deletionSkip` en la ventana (orden de `deleteAccount`) | u2 `skip`          | u2 `skip`                        | sin cambio               |

- **El error sincrónico.** El callback de error vuelve por la rama «after teardown» (`!this.unsubs.has`) sin
  `sync.settle`, porque `unsubs.set` corre después de `onSnapshot`. La espera queda colgada toda la sesión; el start
  siguiente se recupera. RNFB 26.2.0 entrega los errores como evento nativo, asíncrono (`lib/FirestoreQuery.ts:361-440`):
  lo sincrónico sería un `throw`. Ningún otro camino deja `unsubs` sin la colección con la espera pendiente
  (`unsubs.delete` solo en `unregister`, `unsubs.clear` solo en `stop()`, y los dos asientan). Nota en `R9-126`.
- **`R9-598`, verificado por el orquestador.** `start()` lanza `void this.maybeRunInitialBulkPush(uid)` sin mirar
  si `this.uid` sigue siendo `uid`, y `runInitialBulkPush` toma la sesión vigente: la de u2. `serverSync` va por
  colección, sin uid. Salida (`S159-a2-out-E.jsonl.txt`, a2-2e): `u1NubeDoc1: null`, marca de u1 `'2'`; con
  `2e9b042b^`, `u1NubeDoc1: "V"`. La raíz es de la familia de `R9-122` punto 3 (un `stop()` dentro de un `start()`
  en vuelo); el daño nuevo es de la E. Llamadores: `AuthContext.tsx:663` y `:740`, `SyncEngineContext.tsx:94-127`.
  La ventana son los `await` de `start()` (`cleanupOldReviewEvents` lee la red).

## 5. El filtro de relojes y el envoltorio (agente 3)

Sondas `__tests__/s159a3-relojes.test.ts` (9 casos) y `__tests__/s159a3-envoltorio.test.ts`.

| Caso                                                    | Sin la E           | Con la E                   | Veredicto            |
| ------------------------------------------------------- | ------------------ | -------------------------- | -------------------- |
| reintento de R9-257 con cursor avanzado, todo igual     | sube a, a2 y b     | sube a y a2 (bajo el piso) | límite: cuota        |
| lo local más viejo que la nube, bajo el piso            | nube vieja         | nube vieja                 | igual (opción B)     |
| `stop()` en la espera con la caché aplicada; otro start | sube l1            | sube l1 y a (idéntico)     | límite: cuota        |
| eco propio aceptado durante la espera                   | re-sube doc-1      | solo lo nuevo              | mejora               |
| eco en vuelo; el set se rechaza después                 | la entrada sigue   | la entrada sigue           | sin daño             |
| conflicto retenido; después `keepMine`                  | sin conflicto (C2) | 1 conflicto; sube V nueva  | mejora               |
| lápida en la nube con el mismo reloj                    | revive la lápida   | nada sube                  | `R9-216` (reportado) |
| un `removed` real antes del servidor                    | sube y se borra    | nada sube; se borra        | sin cambio de fondo  |
| un doc sale de la vista por el piso (R9-124)            | nube vieja         | sube la fila nueva         | mejora               |
| reloj igual con otro contenido                          | nube V, local V    | nube N, local V            | `R9-216` (reportado) |

- **El piso de la query.** El listener es `where('updatedAt', '>=', cursor - 5 min)`: `clocks` solo ve esa vista.
  El piso no es 0 en el reintento de `R9-257`, con la marca `'1'` heredada y tras un `stop()` en la espera con la
  caché ya aplicada. Lo que queda debajo se re-sube con su reloj: con datos coherentes, idéntico a la nube (cuota).
  Corrige una frase de la 158: «Migrar, 5 escrituras y no 20» vale con cursor 0. Nota en `R9-126`.
- **Los sellos `own` (R9-193).** El salto es un `continue` antes de `upsertQueueEntry`: no toca `PendingWrite.own`
  ni `ownStamps`.
- **La caché que el servidor ya no tiene** (por lectura). El núcleo JS de Firestore da `fromCache` mientras haya docs
  en limbo; resuelto, sale como `removed` antes o con el evento del servidor
  (`@firebase/firestore/dist/common-D8YuAUTW.cjs.js:25023`). Sin medir en el SDK nativo.

### El envoltorio contra RNFB 26.2.0 (medido)

La sonda usa `firestore.ts` real con `onSnapshot` modular, `parseSnapshotArgs` y `QuerySnapshot` reales de RNFB;
solo el borde nativo es falso. Pasa con la E; con el `firestore.ts` de `2e9b042b^` cae (`onNext is not a function`).

| Pregunta                                  | Respuesta                                                  | Dónde                                   |
| ----------------------------------------- | ---------------------------------------------------------- | --------------------------------------- |
| ¿la función modular agrega argumentos?    | no: `onSnapshotMethod.call(reference, ...args)`            | `lib/modular/snapshot.ts:124-128`       |
| ¿las opciones llegan?                     | sí: `{includeMetadataChanges: true, source: 'default'}`    | `lib/utils/index.ts:200-222`            |
| ¿`docChanges()` sin opciones lanza?       | no: filtra `_isMetadataChange === false`                   | `lib/FirestoreQuerySnapshot.ts:117-150` |
| ¿`metadata` existe siempre?               | sí, getter con valor por defecto; Android siempre la manda | `lib/FirestoreQuerySnapshot.ts:94-107`  |
| ¿quién llama `onSnapshot` del envoltorio? | solo `SyncEngine.ts:1741`; el fallback sin `where`, igual  | `firestore.ts:200-203`                  |

- El orquestador leyó `lib/modular/snapshot.ts:120-128` y `lib/FirestoreQuerySnapshot.ts:117-150` (versión
  26.2.0) y la caída de `S159-a3-envoltorio-head.out.txt`.
- **`R9-599` (P3, por lectura).** Con `includeMetadataChanges`, el ack de cada escritura propia levanta un evento
  más. Cada evento serializa en Android, parsea en RNFB y mapea en el envoltorio TODO el resultado de la query
  (`Serialize.java:204-210`). En un primer sync es la colección entera. El motor lo descarta en su primera línea:
  el costo de CPU y del puente ya se pagó. Sin lecturas facturadas. Sin medir.

## 6. Sin medir

- Todo, sin emulador: el SDK nativo con `includeMetadataChanges`, el limbo, el costo de `R9-599`.
- El envío final del eco rechazado tras el backoff (agente 3, A2b).
- El `deletionSkip` con el `AuthContext` real: el orden (`stop()` en `:740`, el salto en `:783`) se leyó.

## 7. Estado al cerrar

Sin código. La E ya está en main (`2e9b042b`, con los docs de la 158 en `d21d4d60`). Los docs de la 159, en
`docs/review-s159`, esperan el OK de Victor. Las sondas no entran al repo (están en los diffs de `_scratch`).
