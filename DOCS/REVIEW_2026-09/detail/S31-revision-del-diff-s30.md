# Sesión 31 — revisión del diff de la 30 (`678a4be..45d2f41`), y las hipótesis de `R9-192`/`R9-193`

Sesión 31, 2026-09-30, solo en la terminal. A pedido de Victor, 3 agentes en worktree que solo
midieron (S31-A1, S31-A2 y S31-A3). El orquestador leyó cada diff contra su informe y re-midió cada
pieza en su árbol (corolario 43). No se tocó código de la app: esta sesión solo escribe el ledger.

## 1. Estado de partida

- `main` = `origin/main` = `ce05112` (el checkpoint de la 30; el último código es `45d2f41`). El CI
  verificado en el log: run `36642503997`, 3 jobs verdes, Node v24.21.0, 367/4451, cero «failed to
  run».
- 1 P0 abierto (`R9-38`), 194 hallazgos.
- **Decisiones que Victor delegó al cerrar la 30** (ya en la §7 de `CONTINUAR.md` y en las entradas):
  `R9-192` = integrar P2/P3 de A2; `R9-193` = los «sellos propios» persistidos, unificados con
  `R9-190` (reemplazan a `ownAcked`).

## 2. Resumen

| Hallazgo | Sev. | Qué                                                                                               | Quién |
| -------- | ---- | ------------------------------------------------------------------------------------------------- | ----- |
| `R9-195` | P3   | Lista de conflictos ilegible con un doc en releer: el conflicto se pierde y el piso queda clavado | A1    |
| `R9-196` | P3   | `R9-191` relee también los conflictos que siguen en la query: fantasma «lo mío contra lo mío»     | A1    |
| `R9-197` | P3   | Tras reiniciar, la relectura con mi edición en cola mueve la marca sin registrar el conflicto     | A1    |
| `R9-198` | P3   | Al arrancar, el `flush` de NetInfo sale antes del `onSnapshot` y tapa la copia del otro           | A1    |
| `R9-199` | P2   | keepTheirs tras un reinicio no sube «lo suyo»: la elección del usuario se deshace                 | A1    |
| `R9-200` | P3   | La prueba de `R9-190` «antes del ack» atribuye el fantasma a otra prueba que no lo ve             | A1    |
| `R9-201` | P3   | La espera de `R9-182` se traga un borrado de verdad si la reversión llega antes que el rechazo    | A2    |
| `R9-202` | P3   | Un borrado descartado termina distinto según dónde esté el piso                                   | A2    |
| `R9-203` | P3   | Una lápida rechazada re-inserta el doc en cada intento (ya existía)                               | A2    |
| `R9-204` | P3   | Tras reiniciar, un conflicto resuelto con keepMine vuelve como fantasma; `R9-183` lo extiende     | A2    |
| `R9-205` | P3   | La cola se guarda sin esperar: si el proceso muere antes, la edición no sube nunca (ya existía)   | A3    |

- **Hallazgos: 194 → 205.** Ningún P0 nuevo; queda 1 (`R9-38`).
- **La matriz entera, re-medida:** idéntica a la final de la 30 (§3).
- **Las hipótesis de la 32, medidas y re-medidas:** `R9-192` (P2/P3, §6) y el diseño unificado de
  `R9-193` (§7).

## 3. La matriz entera (punto 4)

`_scratch/S30-matriz.cjs.txt`, sin cambios, sobre `ce05112` en un worktree aparte
(`C:/projects/essb-s31m`, `git worktree add --detach`, junction de `node_modules` borrada con
`.Delete()` antes del `git worktree remove`), `NODE_ENV=development`, suite de 178. Salida:
`_scratch/S30-matriz-s31.out.txt`.

- **72 piezas y el control (0): pieza por pieza, lo mismo que `S30-matriz-final.out.txt`.**
- Ningún ancla cambió (el código es el de la 30). Las que no caen, las mismas y por lo mismo:
  - `G7` y `R104-5`: AUSENTES a propósito, su código ya no existe (no hay ancla alternativa que
    medir);
  - `R104-7` y `R104-8`: 0, las cubren por tiempo los cortes de `R104-2`/`R104-4` (`4 + 7` caen 2).

## 4. S31-A1 — `R9-190`, `R9-186`/`R9-191` y sus pruebas

Informe íntegro: `_scratch/S31-A1-informe.md.txt`. Hipótesis: `S31-A1-h1c-h3-h5.diff.txt` (y cada
una suelta: `-h1c`, `-h3`, `-h5`).

**Re-medido por el orquestador en su árbol:** las 6 sondas (A, B, B2, C3, C4, C5, E2; 16 variantes)
dan los mismos datos que en el worktree del agente (`_scratch/S31-v-A1-todas.out.txt`); con H1c + H3

- H5 aplicadas, 184/184 (la suite más las sondas) y salida idéntica a la del agente
  (`S31-v-A1-h135.out.txt`). **Los `.diff.txt` de los agentes tienen CRLF:** se aplican con
  `sed 's/\r$//' <diff> | git apply`.

* **`R9-195` (candidato 1):** releer se aplica solo `if (doc?.conflict)`. Con `@sync_conflicted_`
  ilegible en un arranque, ningún doc es conflicto, nadie se relee, y el siguiente guardado borra las
  dos listas: 0 conflictos y el piso en −235 001 para siempre (la V1 que la 30 descartó). El
  comentario de `R9-191` («its docs are still in the query») es falso para este caso. **H1c
  (medido):** con la lista de conflictos ilegible, cada doc de la lista de releer se carga como
  conflicto con releer.
* **`R9-196` (candidato 2):** con la lista de releer ilegible, el lote sintético también lee un
  conflicto que sigue en la query; con L3 en cola entra por la guarda, `isOwnCopy(L2)` es falso tras
  el `stop()` (`ownAcked` en memoria) y la marca pasa a L2; la entrega real de L2 cae después en
  `remoteTs === heldAt`. Fantasma `lo mio 3 / lo mio 2`; keepTheirs deja local = nube = L2 y pierde
  L3. Corolario 42 (`R9-191` saltea el filtro de copias propias de `R9-181`). **Lo cierra el diseño
  de `R9-193`** (medido por A3 y re-medido: sin conflicto, L3 sigue en cola; `S31-v-A1-b2-diseno.out.txt`).
* **`R9-197` (candidato 3):** tras reiniciar con W en cola y la marca de releer, la relectura lee X
  del otro; la guarda de `R9-185` hace `hold(X)` y `continue`, sin conflicto en memoria que
  registrar; el piso se calculó con R, X no llega por la query, y el eco de W asienta el doc por LWW.
  Es el daño que `R9-185` arregló, de vuelta por `R9-186` (corolario 42). **H3 (medido):** si la
  copia leída no es propia y no hay conflicto pendiente en memoria, la lectura sigue como `fromRead`
  y lo registra; sin copia local y con la escritura en cola, no aplica nada.
* **`R9-198` (candidato 3b):** instrumentado con `invocationCallOrder`: `netinfo.fetch` →
  `set(doc)` → `onSnapshot`. El `flush` que dispara `subscribeNetInfo` emite la escritura vencida
  mientras `start()` espera `cleanupOldReviewEvents` y las lecturas del enganche; la primera entrega
  trae W encima de X (compensación de latencia) y X nunca se entrega. La prueba de `R9-185` pasa
  solo porque deja W en espera. Sin arreglo medido (no subir el doc de un conflicto retenido que no
  se re-detectó todavía, o enganchar antes del primer `flush`).
* **`R9-199` (candidato 4):** `conflictsWrittenHere` lo pone solo `queueWrite`, vive en memoria y
  `stop()` lo vacía. Tras reiniciar, con W ya subida, keepTheirs no sube «lo suyo»: local X, nube W,
  y al reiniciar W gana en los dos lados. **H5 (medido):** `noteOwnWrite` en la rama de éxito del
  `flush` (una línea). A3 anota que iría junto a su `noteOwnAcked`.
* **`R9-200` (candidato 5):** con `S190-cola` revertida cae solo esa prueba, y solo por la marca (su
  nombre lo admite); pero su comentario dice que «el fantasma lo muestra la prueba de arriba», y la
  de arriba no cae. El fantasma existe (sonda E2, con W2 en espera); la prueba no lo ve porque deja
  W2 vencida y `R9-198` lo tapa.
* **Revert por pieza de las pruebas** (`S31-A1-piezas.out.txt`): `S186-*` 4/4/4/4/4/3/4, `S190-*`
  2/1/1/1, `S191` 1, como la matriz de la 30. Todas caen por la clave de la consecuencia salvo
  `S190-cola` (`R9-200`).
* **Sin hallazgo** (leído o medido): `isOwnCopy` con un borrado o sin reloj (`updatedAtOf` da `0`,
  nunca `undefined`); keepTheirs que empuja (re-sella con `now`); `queue.find` (una entrada por doc);
  `this.unsettled` ya cargado al calcular releer; el lote sintético va antes que la primera entrega;
  un re-enganche en la misma sesión cuesta una lectura más sin duplicar nada; la clave vieja de
  `R9-182` la consume el sintético y llega a la guarda de `R9-197`; el guardado parcial se reintenta
  (`unsettledUnsaved`).
* **Nota (no es hallazgo):** un conflicto cuya «su versión» ya pisó mi escritura en la nube
  desaparece al reiniciar, porque solo se persiste la marca. Límite de diseño de `R9-160`.

## 5. S31-A2 — `R9-182`, `R9-183`, `R9-184` y sus pruebas

Informe íntegro: `_scratch/S31-A2-informe.md.txt`. **Re-medido por el orquestador en su árbol:** las
sondas de `R9-182` (D1, D2, KRF, KRF-control, KSTOP, KPISO), `R9-183` (G1, G2, G3) y `R9-184` dan lo
mismo que en el del agente (`S31-v-A2-r18{2,3,4}.out.txt`). La sonda de `R9-182` usa el mock con una
bandera solo suya (`s31RevertFirst`: la reversión antes que el rechazo, el orden no medido en RNFB).

- **`R9-201` (candidato 1):** si la reversión llega antes que el rechazo y la nube tiene el doc, la
  reversión es un `modified` con la escritura todavía en cola; el rechazo arma la llave después y ya
  no llega nada que la termine. Un borrado de verdad posterior del otro se toma por escritura en
  cola: con `R9-182`, local `mio`, nube `null`; sin `R9-182`, se borra (KRF). En ese orden `R9-182`
  no ocurre, así que el arreglo solo agrega este daño. **El comentario «only a take-back cut short by
  `stop()` leaves a key armed» es falso también en el orden del mock** (KPISO: una fila re-subida bajo
  el piso no entrega nada en 8 intentos y la llave queda armada sin `stop()`; ahí es inocuo). Arreglo
  sin medir: que la llave caduque, o armarla solo si la última entrega del doc fue el eco de ese
  payload.
- **`R9-202` (candidato 2):** un borrado descartado con la copia de la nube bajo el piso (D2) queda
  borrado aquí y vivo en la nube (antes de `R9-182` resucitaba); sobre el piso (D1) resucita con y sin
  `R9-182`. Sin pérdida de datos; el mismo evento termina de dos maneras.
- **`R9-203` (candidato 3, ya existía):** con la reversión `modified` y lo local `null`, no hay LWW
  que la frene: el doc reaparece tras cada intento con la lápida todavía en cola (8
  `applyRemoteUpsert`, D1). La guarda de `R9-176` cubre solo la rama del `removed`.
- **`R9-204` (candidato 4):** keepMine no reescribe la fila local, y la marca se borra en el acto
  (fuera de la cadena) mientras el cursor espera en ella (`R9-183`). Tras reiniciar, la re-entrega de
  «lo suyo» cae en la ventana de 30 s y se detecta otra vez. Ya existía con «lo suyo» a menos de 5 min
  (G3off, igual con y sin `R9-183`); `R9-183` lo extiende a cualquier antigüedad cuando la cadena se
  corta (G1 con la lectura colgada, G2off). Las pruebas de `R9-183` no miran los conflictos tras
  reenganchar. **C4 (medido por A2 y re-medido por el orquestador, con P2/P3 aplicadas):** keepMine
  reescribe la fila local con `resolvedValue` bajo `withLocalWriteSuppressed` antes del `queueWrite`,
  como ya hacen merge y keepTheirs: G1/G2off/G3off sin fantasma, 187/187 (la suite más la sonda),
  salida idéntica (`S31-v-A2-r183-c4.out.txt`).
- **Sin hallazgo:**
  - **el coste del `includes` de `R9-184`:** con colas de 10 000 a 20 000 entradas agrega entre 0,4
    y 32 µs por subida, contra decenas o cientos de ms por subida (`S31-A2-costo184.out.txt`). Lo
    cuadrático de verdad está al encolar y ya es `R9-29`;
  - W2 entra con `attempts 0` y sube en el re-flush del final del mismo flush;
  - la llave cortada por `stop()` (KSTOP) la consume la entrega siguiente, sin daño en el orden del
    mock; el `updatedAt` de un borrado descartado es el de la lápida;
  - revert por pieza de las pruebas nuevas: 2/2/1/1, 3/1 y 1, como la matriz; cada una cae por su
    consecuencia.
- **Corolario 42:** `R9-183` retiene el avance del cursor y no la liberación de la marca (fuera de la
  cadena): la marca se va en el acto y durable; el cursor no (es `R9-204`).

## 6. `R9-192` — P2/P3 portadas a `ce05112` (A2, re-medido)

- El diff de A2 de la 30 (`S30-A2-hx.diff.txt`) no es sobre `678a4be` sino sobre `20ef1f9` (lo dice
  el blob del encabezado). Leído línea por línea: las siete piezas completas, ninguna a medio
  revertir. En `ce05112` faltaban solo P2 (`refreshTheirs` y su llamada en la guarda) y P3
  (`theirs = fromRead || …`). HX-push no se portó (descartado).
- **Portado:** `_scratch/S31-A2-r192.diff.txt` (contra `ce05112`, `src/` y `__tests__/`): P2, P3 y 4
  pruebas (HX-b, HX-c, HX-d y una nueva para la pieza `P2dif`, que daba 0 y no es equivalente: sin
  ella, `differingFields` queda vacío). Suite de sync 182/182; A2 midió además las 9 suites de sync
  (244/244), `prettier`, `eslint` y `tsc`.
- **Tabla por pieza, re-medida por el orquestador en su árbol** (`S31-v-A2-r192-tabla.out.txt`,
  idéntica a `S31-A2-r192-tabla.out.txt`): control 0; P2+P3 4; P2 2; P2dif 1; P3 2; P3+FR 4.
- **Regla 37 — cuál de los dos `fromRead` es el equivalente:**
  - **`FR`, el `fromRead ||` de la MARCA** (el `hold` de `handleSnapshot`, de la S28, el que decía la
    decisión de Victor): con P3, **0 caídas**; sin P3 tumba `R9-160` y `R9-181`. Equivalente por
    construcción: **la 32 lo quita** con P3 (`S31-A2-r192-fr.diff.txt`, medido: 182/182).
  - **`FRD`, el `fromRead` de la condición de la rama retenida** en `applyRemoteChange` (S30,
    `R9-186`): tumba 5 (`R9-186`, `R9-191`, `R9-192`). **No es equivalente: se queda.** Está en la
    rama sin conflicto en memoria, que P3 no toca.
- **Para la 32, con `R9-193`:** P3 hace «suya» toda copia leída, y el diseño de `R9-193` (B) deja
  fuera la copia PROPIA leída. Es el escenario de `R9-196`: una copia propia ya confirmada, leída con
  otra edición en cola. Leído, no medido: al integrar las dos, P3 tiene que preguntar `isOwnCopy`
  (`fromRead && !isOwnCopy(...)`), y la prueba de `R9-196` lo decide.

## 7. `R9-193` — el diseño unificado (A3, re-medido)

Informe íntegro: `_scratch/S31-A3-informe.md.txt`; diseño `S31-A3-r193.diff.txt` (contra `ce05112`:
`SyncEngine.ts`, `types.ts` y 14 pruebas). **El orquestador leyó el diff línea por línea contra el
informe** y lo re-midió en un worktree propio sobre `ce05112` (`C:/projects/essb-s31v`): el diseño
guardado por el agente es exactamente su diff aplicado; las tablas, en §7.4.

### 7.1. Primero, el caso y la ventana en el código de hoy

- `R9-193` se reproduce igual que en la 30 (la tabla del reloj, idéntica salvo el reloj de la
  corrida). `R9-190` no cambió nada ahí: su `isOwnCopy` solo lo consulta la guarda de `R9-185`.
- **La ventana de caída, medida en cada punto** (se envuelven `multiSet`/`multiRemove` para que desde
  la caída nada llegue a disco; después un motor nuevo, sin red). Escenario: un conflicto retenido,
  L1 sube, L2 se escribe sin red a 80 s de L1.

| variante                                                | M2       | M4       | M5  | M6       |
| ------------------------------------------------------- | -------- | -------- | --- | -------- |
| base (`ce05112`)                                        | –        | –        | –   | –        |
| a3 (la hipótesis de A3 de la 30)                        | fantasma | –        | –   | fantasma |
| entry (solo el sello en la entrada de la cola)          | –        | fantasma | –   | –        |
| seq (la tabla en otra escritura, después de la cola)    | –        | fantasma | –   | –        |
| **multi (el diseño: cola y tabla en un solo multiSet)** | –        | –        | –   | –        |

- M2: justo tras salir L1; M4: tras guardar la cola sin L1 (L2 todavía no); M5: tras guardar la cola
  con L2; M6: la ventana de A3 de la 30 (el lote del eco de L1 colgado). «Fantasma»: tras reiniciar,
  `[L2 / L1]`, lo mío contra lo mío (keepTheirs pierde L2). La base no da fantasma porque toma por
  propia toda copia más vieja: eso es `R9-193`.
- **La hipótesis de la decisión («el sello en la entrada de la cola cierra la ventana») es falsa sola
  (corolario 33):** no cierra M4. Lo que la cierra es escribir la tabla de sellos en el MISMO
  `multiSet` que la cola. En Android, `multiSet` corre en una transacción de SQLite
  (`AsyncStorageModule.java`, leído en la fuente, no medido en el teléfono).

### 7.2. El diseño

- **Un solo `isOwnCopy(uid, col, id, copia)`:** mía si su `updatedAt` es el de la entrada en cola del
  doc, uno de los relojes que esa entrada lleva de las que reemplazó (`PendingWrite.own`, persistido
  con ella; hasta 16, los más nuevos, sin repetir), o uno de `ownStamps` (reemplaza a `ownAcked`: los
  relojes que el servidor tomó mientras el doc era un conflicto, en memoria o retenido; por uid en
  `@sync_own_<col>:<uid>`).
- **Dónde se usa:** rama `pending` (B): `theirs = remoto > local || (remoto < local && !isOwnCopy)`;
  rama retenida (A): se suma `|| (remoteTs < localTs && !isOwnCopy)`.
- **A disco sin ventana:** `persistQueue` escribe la cola y las tablas que cambiaron en un solo
  `multiSet`; el ack anota el sello antes de avisar el estado (pieza `order`).
- **Cuenta y ciclo de vida:** la tabla es por uid; `stop()` anota la escritura en vuelo (`pushing`:
  sin eso, un fantasma nuevo al cerrar sesión con la subida en vuelo, editar sin sesión y volver) y
  escribe lo pendiente; cada enganche reemplaza el mapa de su colección con el que lee. Vaciar en
  `stop()` y el control `uid === this.uid` en `isOwnCopy` daban 0 (equivalentes): fuera.
- **Crecimiento y poda:** solo docs en conflicto, 16 relojes por doc y por entrada; al enganchar
  quedan solo los de conflictos retenidos; `resolveConflict` los olvida; el `settle` también si el
  conflicto ya no está en memoria. `deleteAccount` no borra la tabla (como las demás claves por uid;
  leído).
- **Tabla ilegible:** sin sellos, toda copia más vieja cuenta como del otro y el conflicto se muestra
  (fantasma posible) en vez de asentarse en silencio. **Por la delegación de `R9-193`, el orquestador
  adopta «mostrar»**, coherente con `R9-191` (un dato ilegible degrada hacia mostrar, no hacia
  perder).
- **Dheld y Dwin** (las piezas sin guarda de A3 de la 30; «F» se partió en `Fsettle`/`Fresolve`):
  Dheld y Dwin dan 0 → **fuera del diseño**; `Fsettle` y `Fresolve` caen 1 cada una → se quedan.
- **La prueba «R9-190: lo que el servidor le tomó a Ana…»** sigue verde pero ya no vigila lo que
  decía: la escritura de Ana no es de un doc en conflicto y su sello no se anota. A3 le cambió el
  comentario para que remita a la prueba nueva que sí lo vigila.
- La sonda del reloj de A3: 23 de 24 casos convergen, como en la 30 (queda `app-cerrada` a 10 min, el
  vecino del mock de `R9-164`).

### 7.3. Los vecinos (`R9-189`, `R9-194`, `R9-174`)

| caso                   | base / diseño       | +W      | +Npend  | +W +Y   |
| ---------------------- | ------------------- | ------- | ------- | ------- |
| `R9-189`               | `w2 / w1`           | cerrado | igual   | cerrado |
| `R9-194`               | `L2 / L1`           | igual   | igual   | cerrado |
| `R9-174` con conflicto | «su versión» = mi E | igual   | cerrado | igual   |
| `R9-174` sin conflicto | fantasma            | cerrado | igual   | cerrado |

- **Los sellos solos no cierran ninguno de los tres.** Los cierra una extensión, medida y no
  integrada (`S31-A3-extension.diff.txt`, sobre el diseño; suite de 196 verde; sin W caen 3, sin
  Npend 1, sin Y 1; `+Nheld` da 0 y queda fuera):
  - `+W`: la ventana de 30 s pregunta `isOwnCopy`;
  - `+Npend`: en la rama `pending`, una copia propia más NUEVA tampoco es «suya»;
  - `+Y`: guarda en memoria, por sesión, el último reloj tomado de un doc SIN conflicto, y lo pasa a
    la entrada siguiente. **Tiene la forma de `ownAcked`** (un registro solo en memoria), y la
    decisión de Victor era un solo mecanismo persistido: `+Y` queda para Victor (§8 de
    `CONTINUAR.md`). Solo `R9-194` lo necesita.

### 7.4. Re-medido por el orquestador

En `C:/projects/essb-s31v` (worktree propio sobre `ce05112`, el diff de A3 aplicado, los scripts de
A3 con `ROOT` cambiado). Salidas `S31-v-A3-*` y las del script en ese `_scratch`, copiadas al
principal.

- **Revert por pieza** (`S31-v-A3-r193-tabla.out.txt`): las 20 filas iguales a las del agente. B 5,
  A 1, carry 2, tope 1, repetidos 1, qown 1, qts 1, ack 10, table 9, multi 2, load 8, prune 1,
  inflight 1, stopSave 2, uidKey 2, Fsettle 1, Fresolve 1, order 1; `+Dheld` y `+Dwin` 0. Suite de
  sync con el diseño: 192/192. Todas caen por la consecuencia salvo tres de mecanismo que lo dicen en
  su nombre (`tope`, `repetidos`, `prune`). Seis de las pruebas nuevas pasan también en la base, a
  propósito, y su comentario lo dice (vigilan que los sellos no abran un fantasma).
- **Los puntos de caída** (`S31-A3-caida-tabla.out.txt` del worktree del orquestador, copiado como
  `S31-v-A3-caida-tabla.out.txt`): la tabla de §7.1, igual celda por celda.
- **Los vecinos** (`S31-v-A3-vecinos-tabla.out.txt`): la tabla de §7.3, igual salvo un reloj de la
  corrida (119,998 contra 119,999 s).
- **El candidato 2 de A1 (`R9-196`) con el diseño**, en el árbol principal: 195/195 (la suite más la
  sonda B2); con la lista de releer ilegible, sin conflicto y L3 sigue en cola
  (`S31-v-A1-b2-diseno.out.txt`).
- **La extensión** (`S31-v-A3-extension.out.txt`, línea por línea igual a la del agente): base 12
  caídas de 196, el diseño sin extensión 4, con `+W +Npend +Y` 196/196; sin W 3, sin Npend 1, sin Y
  1; `+Nheld` 0.
- El worktree `C:/projects/essb-s31v` se borró: junction con `.Delete()` primero, `git checkout -- .`
  y `git worktree remove --force` después.

### 7.5. `R9-205` — lo encontró A3 midiendo la caída

`persistQueue` se llama con `void`: la edición llega a SQLite (el adaptador) y la cola a disco
después, sin esperar. Si el proceso muere entre las dos, esa edición no sube nunca: en la tabla de
§7.1, en M2 y M4 (L2 escrita y fuera de la cola en disco), queda local L2 / nube L1 para siempre, en
todas las variantes y también en la base. Es la consecuencia de `R9-38` (lo local que nunca sube)
con otro disparador; una reconciliación que arregle `R9-38` lo cubre.

## 8. Lecciones

- **Una hipótesis escrita en una decisión es una hipótesis (corolario 33, otra vez).** «El sello en la
  entrada de la cola cierra la ventana» venía de la delegación de Victor; medido punto por punto, deja
  abierto M4, y lo que la cierra es la misma escritura para la cola y la tabla.
- **Un prompt que apunta al ancla equivocada lo corrige quien mide.** El del orquestador señalaba el
  `fromRead` de la condición retenida como el equivalente con P3; A2 midió los dos y el equivalente era
  el de la marca (el que decía Victor). Nombrá la línea, no la palabra.
- **Corolario 42 en las dos direcciones:** `R9-191` (releer todos) saltea el filtro de copias propias
  de `R9-181` (`R9-196`), y `R9-186` (releer) desarma lo que arregló `R9-185` (`R9-197`). Las dos las
  vio un agente que solo buscaba romper los arreglos nuevos.
- **Un orden de arranque puede tapar la prueba que dice probar un caso** (`R9-198` → `R9-200`): la
  prueba de `R9-190` deja la edición vencida, y el `flush` de NetInfo sale antes del listener.
- **Los diffs que escribe PowerShell llevan CRLF:** `git apply` los rechaza sin decir por qué;
  `sed 's/\r$//' <diff> | git apply`.

## 9. Sondas y scripts

En `_scratch/` (todas con `.txt` al final):

- la matriz: `S30-matriz-s31.out.txt` (y `S31-matriz-run.log.txt`);
- los de los agentes: `S31-A1-*`, `S31-A2-*`, `S31-A3-*` (informes, sondas `.body.txt`, diffs,
  tablas y scripts; **los scripts tienen `ROOT` fijo al worktree del agente**: cambiarlo antes de
  usarlos);
- los del orquestador: `S31-run.cjs.txt` (el runner de A1 con `ROOT` al principal),
  `S31-v-A2-mk.cjs.txt` y `S31-v-A2-rev192.cjs.txt` (los de A2 con `ROOT` al principal), y las
  salidas de la re-medición `S31-v-*`.
