# Sesión 34 — arreglos de lo de la 33 (`R9-207`..`R9-210`)

**2026-09-30/10-01, solo en la terminal.** Arrancó con `_scratch/S34-PROMPT.md`. CI de `origin/main`
(`17788ae`) verificado en el log antes de empezar: run `36808626771`, 3 jobs verdes, Node v24.21.0,
367/4483.

A pedido de Victor («Manda 3 agentes»), **3 agentes en worktree que solo midieron**:

- A1 midió `R9-208`;
- A2, `R9-207`;
- A3, `R9-210`.

El orquestador arregló `R9-209`, integró los diffs en la rama `fix/s34-r207-r210` (un commit por
hallazgo, en el orden del prompt) y re-midió en su árbol cada pieza de cada agente (corolario 43). A1
se cortó por el límite de sesión en su último paso, volver a correr las suites. Todo estaba en disco:
su diff guardado era idéntico al de su worktree (`cmp`) y su jest entero ya había dado 367/4492.

| Commit    | Hallazgo | Pruebas nuevas                               | Piezas (lo que tumba cada una)                                                                                             |
| --------- | -------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `275b5df` | `R9-209` | 1                                            | `S34-209` 1                                                                                                                |
| `b7e3c0f` | `R9-208` | 9 (7 caen sobre `17788ae`)                   | marca 6, noEscribir 2, releer 5, diferir 2, fuerza 1, pendiente 1, stopFuerza 1, stopVacia 1, unionPoda 1, parse 1, poda 1 |
| `4a36f22` | `R9-207` | 5 (las 5 caen sobre `17788ae`)               | R207own 5, R207fold 1, R207acum 1; las que SUMAN la poda por distancia y la forma H1, 1 cada una                           |
| `682f852` | `R9-210` | 3, en un archivo nuevo, con el provider real | GL 2, GLinit 1, GLa 1, GLa2 1                                                                                              |

**`npm run validate` entero**, con `NODE_ENV=development` y sobre el checkpoint: verde, 368/4501
(4483 + las 18 nuevas). Lint da 0 errores y 70 advertencias, las mismas que en la 33. Salida:
`_scratch/S34-validate.out.txt`.

## 1. Herramientas (todas en `_scratch`)

- **`S34-rev.cjs.txt`** (lo arma `S34-mkrev.cjs.txt` desde `S34-A1-rev.cjs.txt`): el revert por pieza
  de siempre. `S32_ROOT` es el árbol, `S32_BASE` la base guardada y `S34_PIEZAS` el archivo de piezas
  (`module.exports`); por defecto, las de A1.
- **`S34-A2-piezas.cjs.txt`:** el revert de A2, con sus piezas y las de la 32 puestas al día. Va con
  `S32_BASE` (`--save` primero).
- **`S34-A3-piezas.cjs.txt`:** el revert de A3 (`S34_ROOT` obligatorio). Corre las dos suites de
  favoritos. **Su `--restore` es un `git checkout` de los archivos de las piezas: borra un arreglo sin
  commitear.** La corrida normal restaura desde memoria.
- **`S34-matriz.cjs.txt`** (lo arma `S34-mkmatriz.cjs.txt` desde `S32-matriz.cjs.txt` más el bloque
  de `S34-piezas.cjs.txt`). Sigue leyendo las piezas de `S32-A3-revert.cjs.txt` y `S32-rev.cjs.txt`.
  Agrega las de la 34 (las de A1 por `require`, las de A2 por `vm`) y las anclas alternativas de las
  piezas que cambiaron (corolario 41).
- **`S34-rev209.cjs.txt`:** el revert de la pieza de `R9-209`.
- **Las sondas:** `S34-sonda-lapida.body.txt` (`R9-211`) y las de los agentes, `S34-A{1,2,3}-sonda-*`.
  Los informes están en `S34-A{1,2,3}-informe.txt`. Las salidas de las re-mediciones, en
  `S34-rev-{208,207,210}.out.txt`.
- **El control de NUL del prompt no servía.** `grep -c $'\x00'` cuenta TODAS las líneas, porque bash no
  puede guardar un NUL en una cadena y el patrón queda vacío (dio 3142). El que cuenta es
  `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`, y dio 0 después de cada edición.

## 2. Los cuatro arreglos

### `R9-209` — la rama `pending` sin copia local también pregunta `isOwnCopy` (`275b5df`)

La hipótesis del ledger, medida con la sonda `NULL` de la 33. Con `&& !isOwnCopy(...)` también ahí:

- `borra` da `[["lo mio","lo suyo"]]`, y keepTheirs deja «lo suyo» en local y en la nube (antes,
  `[["lo mio","w1"]]` y `w1` en los dos lados);
- el control `edita` no cambia.

La prueba la vi fallar con la pieza revertida («lo mio | w1», keepTheirs con `w1`) y comprobé el `diff`
del revert. La pieza tumba 1 prueba sobre 211. La primera versión de la prueba fallaba también CON el
arreglo: su control de las subidas se leía después de keepTheirs, que sube «lo suyo». Se movió antes.

**La vecina que pedía mirar el prompt, la lápida del otro:** es `R9-211`, sin arreglar.

### `R9-208` — la tabla de sellos ilegible se relee y se une antes de escribirla (`b7e3c0f`)

A1 midió las dos hipótesis del ledger y dos variantes sobre la misma sonda (`OWN` extendida, con 9
variantes; `S34-A1-informe.txt` §2):

| Variante               | Hoy        | (a)                   | (c)                   | (c')                  | Elegida               |
| ---------------------- | ---------- | --------------------- | --------------------- | --------------------- | --------------------- |
| con-otra               | C fantasma | []                    | []                    | []                    | []                    |
| con-otra-d3            | C fantasma | D fantasma            | []                    | []                    | []                    |
| relee-falla            | C fantasma | D fantasma            | D fantasma            | D fantasma            | D fantasma            |
| muere                  | C fantasma | D fantasma            | D fantasma            | []                    | []                    |
| conflicted-sin-entrega | C fantasma | C fantasma            | C fantasma            | C fantasma            | []                    |
| basura (JSON roto)     | C fantasma | ilegible para siempre | ilegible para siempre | ilegible para siempre | C fantasma (como hoy) |

- **(a) marcar y no escribir:** cierra el caso pero mueve el fantasma a `doc-d`. Sus sellos quedan solo
  en memoria toda la sesión, y un reinicio normal tras una edición siguiente lo muestra.
- **(c) releer en segundo plano con la cola por delante:** rompe la promesa de `persistQueue` (la cola y
  los sellos en un solo `multiSet`) si el proceso muere entre las dos escrituras.
- **(b) con `await` dentro de `persistQueue`:** leída, no implementada. El `stop()` dejaría de escribir
  bajo el dueño de la sesión.
- **(c'), la elegida:** mientras una tabla ilegible tiene sellos por escribir, `persistQueue` no escribe
  nada y lanza `rereadOwn`. Al volver, une disco y memoria (solo los docs en conflicto) y la cola sale
  con la tabla en UN `multiSet`. Si la relectura falla, o la sesión termina antes, la cola sale sola
  (`force`) y la tabla de disco queda intacta.
- **Tres vecinos medidos que entraron:**
  - un JSON roto se lee como vacío (`parseOwnTable`), porque si no, con (c') la tabla quedaba ilegible
    para siempre;
  - la poda con la lista de conflictos ilegible no suelta sellos (`conflicted-sin-entrega`);
  - `stop()` escribe con `force` y vacía `ownDirty`: si no, los sellos de Ana iban a la tabla de Beto.
- **Los puntos de muerte, medidos (informe §4):** M1..M6. Lo único que se pierde es el caso
  `relee-falla`: si la tabla tampoco se lee al releer, los sellos de ESA sesión de esa colección quedan
  en memoria y un reinicio puede mostrar «d mio 3 | d mio 2». Hoy el mismo caso da «lo mio 3 | lo mio 2»
  para siempre.
- **Coste:** en ese estado degradado, `await persistQueue()` vuelve antes de que la escritura salga (una
  ida y vuelta de `getItem` después). En el teléfono, `getItem` y `multiSet` van por el mismo ejecutor
  serie (Android `SerialExecutor`, iOS `DISPATCH_QUEUE_SERIAL`; leído en async-storage 2.2.0).
- **Re-medido en mi árbol** (con `R9-209` debajo): las 11 piezas, con los mismos conteos y las mismas
  pruebas que en el de A1, sobre 220. Ninguna da 0. P6 y P8 pasan sin el arreglo, porque son controles,
  y su comentario lo dice.

### `R9-207` — `isOwnCopy` lee `recentAcked` (`4a36f22`). DECISIÓN delegada

Victor la delegó («a tu mejor criterio»). A2 midió sobre el mismo caso (`S34-A2-informe.txt` §3-§5):

- **El plazo de reloj de pared del ledger** («por lo menos `CONFLICT_WINDOW_MS`», H1t) vence con la
  cadena ocupada más de 30 s (`cadena40`), y el fantasma vuelve.
- **Que solo la ventana consulte (H1)** deja el mismo eco tardío en la rama `pending`. Ahí reemplaza la
  escritura del otro como «su versión»: `rantes` da «w2 | w1» en lugar de «w2 | r». Podar por distancia
  de reloj deja ese caso con W1 a 40 s de W2 (`rantesLejos`).
- **Descartar la entrega que otra posterior del mismo doc reemplazó (H3a)** oculta la escritura del otro
  que llegó antes que la del usuario, y cambia la cadena de todas las colecciones sin que ninguna de
  las 210 pruebas lo note.
- **Elegida, H2:** `recentAcked` guarda por doc los relojes de las escrituras tomadas sin conflicto (el
  suyo y los de su `own`, los 16 más nuevos; `+Y` toma el último), e `isOwnCopy` los lee.
- **El porqué:** queda UNA respuesta a «¿es mía?» y las cuatro ramas dicen lo mismo de la misma copia.
  `+Y` se aceptó porque no respondía nada; ahora responde, pero solo agrega «mía» dentro del proceso y
  nunca crea una marca. Tras reiniciar, el reloj de una escritura del proceso anterior viaja persistido
  en `own`, que el ack pliega en la lista (medido: `reinicio`, `reinicioW3`, `enganche`; este último ya
  era fantasma en `17788ae`).
- **Coste:** una copia del otro con el mismo milisegundo que una de las últimas 16 escrituras del doc se
  toma por mía (el límite que `isOwnCopy` ya documentaba), y unos 40-55 B más por doc escrito. La guarda
  de `handleSnapshot` suelta la marca de una copia leída con un reloj tomado antes del conflicto: es la
  regla de `R9-190` (medido en W6).
- **La variante `reemplaza` de la sonda de la 33 no reemplazaba:** con un solo `flush()`, W1 ya estaba
  confirmada al encolar W2. La prueba retiene el ack de W1, y su CONTROL `antesDeW2` lo comprueba.
- **Re-medido en mi árbol** (con `R9-209` y `R9-208` debajo): mismos conteos que en el de A2, sobre 225.
  `W` subió de 3 a 7 y `Yset` de 2 a 7. `Ypush` y `Yuid` quedan en 2, y `Yuid+Ypush` en 3.

### `R9-210` — el `getLocal` de favoritos lee la fila de SQLite (`682f852`)

A3 midió las dos hipótesis con el provider, el adaptador y el motor reales (`S34-A3-informe.txt`):

- **(a), la de `R9-174`** (el ref adelantado en los 6 sitios que escriben): con el efecto y el
  Scheduler real, el efecto vuelve a poner el ref atrás durante una vuelta, y un keepMine ahí sube la
  copia vieja (sonda S5k).
- **(a2), lo mismo sin el efecto:** cierra `R9-210`, pero no la carga en frío de `R9-133`.
- **(b), la elegida:** `getLocal` = `initialize()` + `getFavoriteById`, sin catch. Cierra `R9-210`, la
  carga en frío de `R9-133` y la ventana de la sesión 23. Cuesta una SELECT por clave primaria en cada
  `getLocal`.
- **Las pruebas** (`__tests__/favoritesGetLocalRow.test.tsx`) montan el `FavoritesProvider` y el
  `SyncEngine` reales:
  - SQLite va en una tabla en memoria. De Firestore se usa lo mínimo, y de `SyncEngineContext` solo
    `useSyncEngineOptional`;
  - la ventana se abre con `act`, y dos controles comprueban que el escenario ocurre;
  - **no miden** cuánto dura la ventana en el teléfono, ni la vuelta atrás del ref de (a) (eso lo midió
    la sonda), ni la carrera entre la lectura de keepMine y la escritura de C4.
- **`GLinit` (el `initialize()`) no tenía ninguna prueba.** No es equivalente: A3 midió en la sonda S9
  que sin él la lectura en frío lanza y el motor salta el doc, que queda retenido hasta el próximo
  enganche. La sonda S9 pasó a ser la tercera prueba, y el mock de la base lanza antes de `initialize()`,
  como la real. Ahora tumba 1, por la razón correcta: la fila en «lo mio» y la marca con `fav-1`.
- **El comentario de `R9-174` en el motor** dice ahora que `memoryCards` sigue leyendo un ref. Esa
  colección nunca registra conflictos: A3 lo confirmó con sonda.

## 3. La matriz entera

Sobre `682f852`, en un worktree aparte (`C:/projects/essb-s34-matriz`, con la junction de
`node_modules`, borrada con `.Delete()` antes de `git worktree remove`), con
`S32_FULL=1`.

- **La salida:** `_scratch/S34-matriz-s34-682f852.out.txt`.
- **La comparación pieza por pieza con la de la 33** (`06513ba`):
  `_scratch/S34-comparar-s33.out.txt`, hecha con `S33-comparar.cjs.txt`.

**Resultado:**

- **126 piezas:** las 109 de la 33 y 17 nuevas (1 de `R9-209`, 11 de `R9-208` y 5 de `R9-207`). El
  control da 0 de 225.
- **96 dan lo mismo que en la 33. Las otras 13 viejas solo suben: ninguna prueba dejó de caer.** Las
  pruebas nuevas caen también con piezas de la 32, en particular las de `R9-193` y `+Y`:
  - `S32-ack`, de 14 a 28;
  - `S32-table`, de 11 a 20;
  - `S32-uidKey`, de 2 a 11;
  - `S32-load`, de 10 a 16;
  - `S32-W` y `S32-Yset`, a 7;
  - `S32-A206`, de 15 a 18;
  - `S32-carry`, de 3 a 5;
  - `S32-qown`, `S32-multi`, `S32-stopSave` y `S175-cadena`, +1 cada una.
- **Las 17 nuevas tumban al menos 1**, con los mismos conteos que en las re-mediciones de cada
  commit.
- **Ceros, los mismos de la 33:**
  - `R104-7` y `R104-8`, los de siempre;
  - `+P3`, que SUMA de vuelta código quitado.
- **Un cambio en un cero:** `+heldAt` (devolver `remoteTs === heldAt`, `R9-206`) pasó de 0 a 4. Ahora
  tumbaría 4 pruebas de `R9-208`, así que ya no sería inocuo.
- **Las 8 AUSENTES son las mismas de la 33**, piezas quitadas a propósito antes. Las anclas que
  rompieron los arreglos de esta sesión tienen su alternativa (§5).
- **Corolario 46:** ninguna guarda de un commit anterior quedó en 0 al apilar el siguiente.
- **Las piezas de `R9-210`** viven en `FavoritesContext.tsx` y no entran en esta matriz. Se midieron
  en el árbol final con `S34-A3-piezas.cjs.txt` (`_scratch/S34-rev-210.out.txt`): GL 2, GLinit 1,
  GLa 1 y GLa2 1.

## 4. Hallazgos nuevos, `R9-211`..`R9-214`

Los cuatro ya existían y ninguno se arregló.

- **`R9-211` (P3, el orquestador, sonda `S34-sonda-lapida.body.txt`):** con lo local borrado y el
  conflicto en memoria, la lápida del OTRO dispositivo se toma por el eco de la mía (`!deleted`). El
  conflicto sigue mostrando «lo mio | lo suyo», y keepTheirs revive «lo suyo» en local y en la nube
  aunque el otro también lo borró. El control con solo mi lápida da lo mismo, y ahí es lo correcto.
- **`R9-212` (P2, A1, sonda `S34-A1-sonda-cola.body.txt`):** con `@sync_queue_v1` ilegible al hidratar,
  la cola queda vacía y la primera escritura la reescribe sin las entradas de antes. El resultado fue
  `{"antes":["doc-q"],"memP1":[],"despues":["doc-z"],"nubeQ":null}`: la edición queda solo en local y
  no sube nunca. Es la forma de `R9-195`/`R9-208` en la cola (familia de `R9-38`).
- **`R9-213` (P3, A2, sonda W5):** keepTheirs de un conflicto registrado contra una copia local que el
  servidor YA había tomado no sube «lo suyo». El teléfono queda en lo del otro y la nube en lo mío, en
  silencio. `conflictsWrittenHere` (`R9-161`/`R9-199`) solo anota lo encolado o tomado MIENTRAS el
  conflicto está en memoria.
- **`R9-214` (P3, A3, sonda S8):** si el bulk push de favoritos corre antes de que termine la carga en
  frío, `pullAllLocal` lee el ref vacío: sube 0 favoritos y graba el flag `'2'`, así que esos favoritos
  no suben nunca por esa vía. Es la raíz de `R9-133` en la línea 220, que el arreglo de `R9-210` no
  toca. Hipótesis medida (Bpull): `pullAllLocal` = `initialize()` + `getFavorites()`.

## 5. Notas de oficio

- **Las piezas de un agente se re-miden en el árbol que se commitea** (corolario 43): las de A1 sobre
  `R9-209`, las de A2 sobre `R9-209`+`R9-208`, y las de A3 en el árbol final. Dieron lo mismo en los
  tres casos.
- **Corolario 41, dos veces:**
  - `R9-209` rompió el ancla de `S32-+P3` (la línea de la rama sin copia local);
  - `R9-208` rompió las de `S32-table`, `S32-load`, `S32-prune` y `S32-stopSave`, y `R9-207` las de
    `Ypush`, `Yset` y `Yuid`.

  Todas tienen su alternativa en `S34-piezas.cjs.txt`. Las 8 AUSENTES que quedan son las mismas de la
  33, piezas quitadas a propósito antes.

- **Una prueba que falla también con el arreglo** (la primera de `R9-209`) no era el arreglo, era el
  control leído tarde: leer el diff del `expect` antes de dudar del arreglo.
