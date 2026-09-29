# Sesión 27 — revisión del diff de la 26 (`R9-124`)

**Fecha:** 2026-09-28. **Modo:** solo en la terminal, y solo revisión: no se tocó código de la app.
Con el OK de Victor (pedido a mitad de turno), trabajaron **3 agentes en worktree**. El orquestador
corrió la matriz y verificó a mano lo portante de cada informe.

**Base:** `main` = `origin/main` = `6f73f69`, cuyo último código es `34de18f`. CI verificado en el
log:

- run `36495790684`, 3 jobs verdes;
- Node 24.21.0 y `PASS SyncEngine.test.ts`;
- 367/367 suites, 4414/4414 pruebas y ningún «failed to run».

**Se revisó** `590b39c..34de18f` (`src/lib/sync/SyncEngine.ts` y `__tests__/SyncEngine.test.ts`).

**Resultado:** **7 hallazgos nuevos, `R9-175`..`R9-181`: 1 P2 y 6 P3. Ningún P0.** El arreglo de
`R9-124` se sostiene en lo que importa. Sigue **1 P0 abierto** (`R9-38`). Hallazgos: **181**.

---

## 1. La matriz entera, re-medida (orquestador)

Script: `_scratch/S27-matriz-reverts.cjs.txt`. Es el de la 26 con el P4 de `-2.cjs.txt`, cuya
ancla es `isHeldConflict`; P4a y P4b ya no existen, porque esa mitad se quitó. Corre la suite con
`NODE_ENV=development`. Salida en `S27-matriz-reverts.out.txt`.

| Pieza o guarda          | Caen | Pieza o guarda                   | Caen |
| ----------------------- | ---- | -------------------------------- | ---- |
| CONTROL                 | 0    | G2 tras `applyRemoteDelete`      | 1    |
| P1 el núcleo            | 5    | G3 tras `applyRemoteChange`      | 2    |
| P2 = G1 tras la lectura | 1    | G4 tras `saveUnsettled`          | 1    |
| P3 lectura en supresión | 1    | G5 tras `advanceCursor`          | 1    |
| P4 sin `isHeldConflict` | 1    | G6 en el `catch`                 | 1    |
| P5 lectura fallida      | 1    | G7 en el `finally` (`isSyncing`) | 1    |
| P6 sin soltar           | 2    | G8 en `applyRemoteChange`        | 3    |
| P7 soltar a ciegas      | 2    | G9 en `saveUnsettled`            | 1    |
| P8 ignorar sin soltar   | 3    |                                  |      |

- Es idéntico a la 26, sobre 141 pruebas. `SyncEngine.ts` quedó restaurado y `git status` limpio.
- Las 9 guardas son TODOS los `isCurrent()` de `handleSnapshot`, `applyRemoteChange` y
  `saveUnsettled` (`SyncEngine.ts:1078-1614`). Los de `flush` y el push quedan fuera del diff.
- **Pero G7 discrimina solo gracias al mock** (`R9-179`), y la prueba de control de `R9-160` no
  vigila su guarda con la semántica del SDK (`R9-180`).

---

## 2. Las afirmaciones de la 26, contra el código y la medición nativa (agente A1)

**Ciertas:**

- **«Sin el arreglo caen 8; con el mock nuevo y el motor viejo no cae ninguna vieja»:** 8 fallan y
  133 pasan (`S27-A1-motor-viejo-mock-nuevo.out.txt`).
- **El P0 recorrido por el camino REAL de la cola** (`queueWrite`, luego `flush`, luego el eco
  `removed` propio) ya no borra: con el motor viejo da `borrados: ["nota"]`, y con el nuevo
  `borrados: []` (`S27-A1-sonda-E-cola-real.out.txt`). **Ninguna prueba de la suite recorre ese
  camino:** en la variante del mock de hoy hay 0 `removed` propios.
- **`get()` offline de un doc que no está en caché RECHAZA con `UNAVAILABLE`:** nunca devuelve
  `exists: false`, así que el motor lo suelta sin borrarlo.
  - Leído en el bytecode de `DocumentReference.lambda$getViaSnapshotListener$5`, en
    `firebase-firestore` 26.4.1, la versión del BOM 34.16.0 de RNFirebase 26.2.0; el SDK de JS hace
    lo mismo en `readDocumentViaSnapshotListener`.
  - RNFirebase usa la fuente por defecto (`NativeRNFBTurboFirestoreDocument.java:123-157`).
  - **No medido en nativo:** la 26 solo midió offline un doc que existía. El borrado de N1off de
    A3 es un artefacto del mock.
- **Nada después de la rama depende del tipo, del orden ni de la metadata del cambio:**
  - la suite pasa 141/141 con los tipos corregidos como el SDK (126 cambios) y con el orden del
    SDK;
  - `advanceCursor` con un `updatedAt` bajo el piso no hace nada (`:1450-1451`).
- **La medición nativa** respalda que el `removed` trae la versión vieja con `exists: true`, que la
  rama `|| !data` nunca se dispara y que en B no llega nada al volver la red.
- **«Una lectura más por cada `removed`»:** cierto. Offline cuesta 0, porque sale de caché.

**Corregidas (sin número nuevo):**

- **«Solo hay dos borrados de verdad en la app»:** hay un tercero, `retiredBookmarksMigration.ts:272-276`,
  sobre `bookmarks`, que no tiene adaptador ni listener. El de `cleanupOldReviewEvents` cae en un
  `applyRemoteDelete` que no hace nada (`adapters/reviewEvents.ts:66-73`), y en `functions/` nada
  borra. En la práctica sigue siendo cierto.
- **«Cada prueba usa `mockDelivered` como control»:** lo usan 6 de 9. Las otras 3 tienen un control
  implícito (`borrados: ['doc-x']`, `unsettled: {}`, o un `release()` indefinido si no hubo lectura).
- **«Es exactamente lo que habría entregado un listener sin filtro» y «el filtro deja de cambiar
  resultados»:** valen solo para la PRIMERA salida del doc. Un segundo cambio del mismo doc, también
  bajo el piso, ya no llega (sonda D: lo local queda en «respaldo 1» y la nube en «respaldo 2»).
  Es `R9-126`: va como nota ahí.
- **«Cierra la parte de `R9-164` que tocaba al `removed` en vivo»:** solo si el lote TERMINA. Un
  `stop()` o la muerte del proceso durante la lectura del `removed` de un doc retenido lo deja
  retenido para siempre (sonda C: el piso queda en retenido-1-margen en dos arranques seguidos). Va
  como nota en `R9-164`.
- **La justificación de «Diferencia con lo pedido» (§2 de la 26) y «cada enganche relee desde
  ahí» (§4):** falsas. Es `R9-181`.

---

## 3. El mock nuevo contra el SDK real (agente A1)

- **Sin dependencias ocultas** en:
  - la re-entrega como `added` al re-enganchar (31 re-entregas);
  - un `get()` que ve las escrituras propias;
  - el orden del SDK.

  Con cada una, 141/141.

- **Un doc no puede venir dos veces en un mismo snapshot:** `DocumentChangeSet.track` funde
  `removed` + `added` en `modified`, y los `removed` van primero (`compareChangeType`). Sin
  `includeMetadataChanges` no se emiten cambios solo de metadata (`shouldRaiseEvent`).
- **El eco propio (compensación de latencia) es la diferencia que importa.** El mock no lo entrega;
  el SDK sí, antes del ack (en la medición nativa, los snapshots 1 a 4 traen `hasPendingWrites:
true`). Con el eco propio caen 5 pruebas:
  - 4 de `R9-104`, por el fixture: un solo almacén local para las dos cuentas, más el bulk push de
    Beto. Con `@sync_first_push_done:uid-beto` puesto pasan, así que sus guardas siguen vigiladas;
  - la de `isSyncing`: es `R9-179`.

  Además, la de control de `R9-160` deja de vigilar su guarda (`R9-180`).

- **El `get()` del mock** contesta con la nube del momento en que la prueba lo suelta
  (`SyncEngine.test.ts:148-155`) y no ve las subidas del motor, que van a `mockDocSets` y no a
  `serverDocs` (`:146`). Con este mock, una prueba puede afirmar órdenes que el SDK no produce: los
  5 casos «solo mock» de §4.

---

## 4. ¿Quién más escribe mientras la lectura está en vuelo? (agentes A2 y A3)

**La pregunta de la 25.** El `getDoc` es un viaje de red, y los lotes de `handleSnapshot` no se
serializan: cada callback hace `void this.handleSnapshot(...)` (`SyncEngine.ts:956`).

**Lo que la hace real o imposible, leído en la fuente de RNFB 26.2.0 (sin medir en nativo):**

- `documentGet` espera al servidor con `Tasks.await` (`NativeRNFBTurboFirestoreDocument.java:144-146`)
  en `getExecutor()`;
- con el `android_task_executor_maximum_pool_size` por defecto (1), `getExecutor()` es
  `getExecutor(true, "")`, el MISMO ejecutor de un solo hilo que `getTransactionalExecutor()`, donde
  corren `documentSet` (`:186-189`) y `documentDelete` (`:163`) (`TaskExecutorService.java`).
  `firebase.json` no cambia el pool;
- así que la respuesta de la lectura nunca incluye lo que este teléfono escribe durante la lectura,
  y el eco de esa escritura llega DESPUÉS de la respuesta. Verificado por el orquestador en la
  fuente.

**Hallazgos:** `R9-175` (P2), `R9-176`, `R9-177` y `R9-178` (P3). Ver `BUGS.md`.

**Escenarios medidos que salieron bien (motor de la 26):**

- **Otro lote re-crea el doc, en el orden del SDK (P1a, P1b):** se aplica lo re-creado.
- **Respuesta vieja tras un lote más nuevo (P2a):** el LWW la ignora.
- **Lápida durante la lectura, con respuesta fresca (P2c):** sigue borrado.
- **Conflicto retenido por el lote 2 (P3a):** la marca y el retenido quedan intactos.
- **Retenido por un `getLocal` fallido (P3d):** aplica y lo suelta.
- **El cursor nunca retrocede (P1c, P2a).**
- **«Una edición durante la lectura se sigue encolando» (P5):** cierto. La cola tiene la edición,
  sube y queda en local.
- **Con conflicto:**
  - `keepMine` con X más viejo que L (E1): se conserva L;
  - `merge` (E3): queda la mezcla;
  - `keepTheirs` (E2, N2): queda R, o borrado y convergente. La divergencia de E2 es `R9-126`.
- **`keepMine` o `keepTheirs` a medias (O1, O2):** no borran, ni se tragan nada.
- **La otra ventana (entre la consulta de `isHeldConflict` y el borrado, o dentro de la
  supresión) no se puede dar, por construcción:** la resolución hace `queueWrite` y suelta la marca
  en el mismo tick (`:1914`→`:1984`), y la consulta de `:1088` y la entrada a la supresión (`:649`)
  también son síncronas. La supresión solo filtra `queueWrite`/`queueDelete`, nunca la escritura
  local de `keepTheirs`.

**Solo alcanzables con el mock** (una respuesta vieja que llega después de otro lote; con el SDK,
el `get` y el snapshot no pueden cruzarse así):

| Sonda | Qué pasa con el mock                                             |
| ----- | ---------------------------------------------------------------- |
| P1c   | Borra lo re-creado; vuelve solo si se reinicia dentro del margen |
| P1d   | Si otro doc adelantó el cursor, no vuelve nunca                  |
| P2b   | Resucita sobre una lápida                                        |
| P3b   | Suelta la marca del conflicto, y tras reiniciar R2 pisa «lo mío» |
| P3c   | La marca queda, pero el retenido baja a hace un día (cuota)      |

Serializar los lotes por colección (el arreglo propuesto de `R9-175`) los cierra por construcción.

**Ya registrados:**

- P8: una edición que cae dentro del `applyRemoteDelete` suprimido se pierde. Es el residuo de
  `R9-103` (`:326-329`), idéntico en `590b39c`.
- P9: un corte durante la lectura hace que el `removed` no vuelva nunca. Es la familia `R9-164` /
  `R9-126`.

---

## 5. Contra el motor de `590b39c`

A2 y A3 corrieron cada sonda también contra el motor de antes de la 26:

- casi todas caen por su CONTROL («el motor nunca pidió la lectura»), porque la ventana no
  existía;
- en los escenarios de A3, el motor viejo perdía lo local SIEMPRE: el `removed` lo borraba en el
  acto, y `keepMine` fallaba con «found no local copy». La 26 convierte esa pérdida segura en una
  ventana estrecha y pasajera: **no es una regresión**;
- `R9-176` y `R9-177` sí los introdujo la 26. `R9-175` ya existía (P10b es idéntico con la ventana
  de SQLite), y la 26 lo agranda.

---

## 6. Dónde está todo

En `_scratch/`, todo con `.txt` al final:

- `S27-matriz-reverts.cjs.txt` y su `.out.txt`;
- `S27-A1-*`: el informe, `fidelidad-mock` (variantes E, R_O y R_O-hour), `sondas-BCD`,
  `sonda-B-con-P7`, `sonda-E-cola-real` y `motor-viejo-mock-nuevo`;
- `S27-A2-*`: el informe, `sondas.test.ts.txt` (20 escenarios), sus salidas contra los dos motores
  y `lectura-sdk.out.txt`;
- `S27-A3-*`: el informe, `carrera-resolucion.test.ts.txt` (17 escenarios), sus salidas contra los
  dos motores y la medición de la propuesta (`propuesta.diff.txt`).

Los 3 worktrees quedaron limpios, y las junctions se borraron con `.Delete()`.

---

## 7. La decisión de `R9-181`

Victor la delegó al orquestador («a tu mejor criterio»). Se eligió **la (b), acotada a los docs con
la marca de conflicto**: la rama retenida de `applyRemoteChange` vuelve a detectar el conflicto
también ante una re-entrega MÁS VIEJA con campos distintos.

- Sin eso, un conflicto retenido cuya nube quedó por debajo del piso se disuelve en silencio tras
  reiniciar, y deja divergentes para siempre al teléfono (L) y a la nube (X). Con (b), el usuario
  elige entre L y X, y cualquiera de las dos salidas converge.
- Los docs sin marca siguen igual (`R9-126`).
- El porqué entero y lo que falta medir están en la entrada de `R9-181`.

---

## 8. Lecciones

- **La pregunta de la 25 rindió otra vez.** «¿Quién más escribe mientras el caso espera?» encontró
  en un `await` NUEVO lo que ninguna prueba de la 26 miraba. Y la respuesta no estaba en el motor
  sino en el SDK nativo: el hilo único de RNFB decide qué órdenes son posibles.
- **Un mock que no entrega el eco propio decide la pregunta por el SDK.** Es el corolario 35 otra
  vez, por otra puerta: la 26 arregló el `removed` del mock y dejó sin tocar la compensación de
  latencia, de la que dependían dos pruebas.
- **Un nombre de prueba es una afirmación.** «R3, una hora después» con `Date.now()`: la prueba
  vigilaba otra cosa que la que decía.
- **Una justificación de diseño se comprueba como una afirmación.** La 26 retuvo el conflicto para
  que sobreviviera al reinicio, y su propio §4 decía que tras reiniciar se disuelve.
