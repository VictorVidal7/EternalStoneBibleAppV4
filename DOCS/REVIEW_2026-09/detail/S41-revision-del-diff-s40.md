# Sesión 41 (2026-10-01/02) — revisión del diff de la 40

**Modo:** solo terminal, sin agentes y sin tocar código. Arrancó con `_scratch/S41-PROMPT.md` (vale
más que el mensaje (u) de `CONTINUAR.md`).

**Estado al empezar:** `main` = `origin/main` = `48bee85` (el checkpoint de la 40, mergeado y
pusheado; CI verde en el log, run `36968376017`, 368/4526). El último código es `e9d6e89`, y
`_scratch/S40-SyncEngine-R236.ts.txt` es su motor (comprobado con `cmp`). Los docs del repo decían
«sin mergear» para la 40: este checkpoint lo corrige.

**Diff revisado:** `4f1ce9a..e9d6e89` (`SyncEngine.ts` y `SyncEngine.test.ts`).

**Resultado:** 3 hallazgos nuevos, `R9-242`..`R9-244`, todos P3, y los tres ya existían (medido con
el motor de `0b84a7e`). `R9-234` pasa de leído a MEDIDO. Hallazgos: **244**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Herramientas** (en `_scratch`): las piezas en `S41-piezas.cjs.txt` (reexporta las de la 40, la 39
  y la 38): `Q41own`, `Q41sello` y `Q41llegada` (lo que mira `isOwnCopy`: el `own` de la entrada en
  cola, `ownStamps` y `ownArrived`), y las hipótesis `H41own` y `H41removed`. Las sondas, en
  `S41-sondas.body.txt` (`S41-1`..`S41-4`), `S41-sondas5.body.txt`, `S41-sondas6.body.txt` y
  `S41-sondas7.body.txt`. El SDK web, leído desde su source map con `S41-sdk.cjs.txt`.
- **Cada «¿de la 40?» se midió con el motor de `0b84a7e`** (`S41-motor.cjs.txt` con
  `S39-SyncEngine-base.ts.txt`). Después de cada restore: `git status` limpio, `cmp` igual a la base y
  NUL en 0.
- **Un tropiezo de herramienta:** la primera tanda corrió con `S34_PIEZAS` como ruta RELATIVA. `require`
  no la encontró, `S34-rev --apply` falló, y las sondas corrieron sin pieza: tres dieron «sin daño».
  Se vio porque los resultados eran idénticos a los de hoy; se repitió con la ruta absoluta y con el
  `git diff --shortstat` de cada pieza aplicada. Lo que valen son las salidas de la segunda tanda.
- **Sin la matriz entera:** no hubo cambio de código y nada de lo medido la pide. Las hipótesis se
  midieron contra la suite de sync (`S34-rev`).

## 2. Las preguntas

### 2.1 Un solo reloj: qué depende solo del veredicto de la llegada

- **Leído en el SDK web** (mismo diseño que el de Android; `_scratch/S41-sdk.out.txt`): al confirmar o
  rechazar una escritura, `sync_engine_impl.ts` levanta el callback del usuario ANTES que los eventos.
  El eco de W1 sale al aplicar su `set`, y el motor emite el de W2 después del ack de W1. En el SDK,
  ningún eco de W1 se levanta después del ack de W2, y la reversión de un rechazo llega después de su
  rechazo (el motor reintenta la misma entrada, `break`). El enganche trae la copia de la nube, que es
  la del último ack o una ajena. Lo que no se sabe es si el puente de RNFirebase reordena: `R9-240`.
- **El mock** entrega todo con `setImmediate`, en orden: tampoco produce un eco que llegue después del
  ack de una escritura posterior.
- **Lo que depende solo de `ownArrived`:** el eco que LLEGA con su escritura en vuelo y se procesa
  después del ack de la siguiente (la cadena de lotes ocupada). Sin conflicto, lo vigilan las pruebas
  de `R9-207` y `R9-222`. Con conflicto (`S41-3`), sin `ownArrived` L1 pasa a ser «su versión»
  (`S41-llegada.out.txt`), y ninguna prueba lo cubre: `R9-244`.
- **Lo que no depende de ningún reloj único y estaba abierto:** el `own` de una entrada que reemplazó
  una subida en vuelo (`R9-242`, abajo).

### 2.2 Las dos pruebas que la 40 reordenó

- **`R9-224` (L4 en la cola detrás de una subida lenta de otro doc):** el orden lo produce el SDK (el
  `flush` sube de a una entrada), R2 y el respaldo traen datos distintos de la nube, y la prueba dice
  lo que construye. Sin observaciones.
- **El eco tardío de `R9-160`:** sus dos `fire(edit1)` llegan con la nube ya en L1 y nada en vuelo,
  y el SDK no levanta un cambio con los mismos datos (`view.ts`, `docsEqual`); el `__fire` del mock no
  compara. Lo que ejercita es una re-entrega de la copia de la nube, que en el SDK trae un enganche.
  **Corolario 50, medido** (`S41-eco160-*.out.txt`): cae con `Q41sello` sola, no con `Q41own` sola, y
  juntas cae igual. No son dos guardas que se cubren, como decía el detalle de la 40: sin el sello, el
  primer `fire` se toma por ajeno y retira, y la entrada de L2 nace sin el reloj de L1. `S190-cola`
  (que quita solo la comparación con el `data` de la entrada) no toca el `own`. → `R9-244`.

### 2.3 `retireOwn` desde la lectura

- **Otros caminos que traen copias:** ninguno. El enganche pasa por el callback; `rereadOwn` lee la
  tabla de sellos, no copias; los otros `get()` del motor leen `reviewEvents` y `conflicts`.
- **Una copia MÍA que `isOwnCopy` no reconoce** (la tabla ilegible) retira también el `own` de la
  entrada en cola, la única copia en disco de ese reloj con la tabla ilegible toda la sesión
  (`R9-217`). Es el coste que ya tenía `noteArrived` (`R9-230`); la 40 lo extiende a la lectura. Nota
  en `R9-238`.
- **Lo que la 40 no cerró:** la retirada de la lectura corre al PROCESAR. Con la cadena ocupada, el
  respaldo llega antes, se juzga «mío» al llegar, y la lectura del `removed` ya lo encuentra a él
  (`S41-7`). → `R9-243`. La hipótesis de retirar al llegar un `removed` sin subida en vuelo
  (`H41removed`) lo cierra, pero tumba `R9-190`: mi propio respaldo también llega así.

### 2.4 `Fresolve`

- **La prueba mide el eco sin procesar:** sin docX, con `Fresolve` revertida, el respaldo da el
  conflicto igual (`S41-4`, `S41-fresolve.out.txt`). El control `docX: null` es la condición del caso.
- **Que caiga con `R237`/`R237fold`** es cobertura de `R9-237` en la resolución, no un caso de la
  cola: mientras la entrada de la resolución espera, la nube tiene W3, y un respaldo con W3 son los
  mismos datos. Con R2 entre medias, `R9-223` retira el `own`.
- **Otras sueltas de sellos que dependan del proceso:** `settle` (`Fsettle`, con su prueba) y la
  retirada de la lectura (`R9-243`). La resolución suelta en el momento.

### 2.5 La prueba del bucle (`lecturas: 5`)

En la matriz de la 40, solo `S34-208diferir` da el bucle (60 lecturas). Las otras 6 piezas dan 0
(`S32-uidKey`), 2 o 4: otros defectos, con sus pruebas. El número exacto es el de hoy y no es frágil
(todo corre en microtareas o `setImmediate`). Falta que el comentario diga que solo 60 es el bucle.
Nota en `R9-229`.

### 2.6 Lo que queda de `R9-239`, y `R9-241`

- **Se construye, y es `R9-234`** (`S41-6`): con la tabla ilegible al enganchar y su relectura en
  vuelo, el enganche trae R2 (retira), L4 sube (sello [L4]) y la relectura une el de disco: [W3, L4].
  El respaldo con W3 deja «su versión» en «r2 suyo»; el control pasa a «w3 mio». Ya existía (motor de
  `0b84a7e`). Sin la tabla ilegible no se construye (`S41-5`: el enganche asienta o retira, y no queda
  nada que unir). `H239join` lo cierra y, sola, tumba solo la prueba de `R9-218`, que espera el sello
  sembrado unido al nuevo.
- **Las tablas con varios sellos** solo existen en compilaciones de desarrollo: ninguna versión
  publicada escribió la tabla (vc74, `dc19f4a`, 2026-09-02; `R9-193`, `22d33e2`, 2026-09-30).
- **`R9-241`:** el mock sustituye `firestore.ts` entero, así que en `SyncEngine.test.ts` no se
  construye. Se construye como prueba de `firestore.ts` sola, con un `DocumentChange` cuyo `doc` sea
  un getter (la propuesta de la entrada). Sin hacer.

## 3. Lo nuevo

- **`R9-242`** — el `own` de una entrada que reemplazó una subida en vuelo conserva relojes más viejos
  que el ack de esa subida (`S41-1`, sin conflicto; `S41-2`, con conflicto). El respaldo del otro con
  W0 pasa por «mío» por la cola, y la edición que espera lo pisa sin que nadie elija; en conflicto,
  keepTheirs sube «lo suyo» encima del respaldo. Ya existía. **`H41own`** (en el ack, el `own` de la
  entrada viva pasa a ser el reloj de la subida) cierra las dos, y la suite pasa 250/250.
- **`R9-243`** — `R9-238` sigue abierto con la cadena ocupada (`S41-7`). Ya existía.
- **`R9-244`** — la prueba del eco tardío de `R9-160` y el eco tardío de verdad en conflicto (`S41-3`).

## 4. Para la 42

- `R9-242` con `H41own` (prueba de `S41-1` y `S41-2`, y la matriz entera).
- `R9-243`: falta una forma de distinguir el `removed` del otro del de mi propio respaldo.
- `R9-244`: reescribir la prueba de `R9-160` con el orden de `S41-3`.
- `R9-234` (con lo que queda de `R9-239`): `H239join`, y decidir la expectativa de la prueba de
  `R9-218`.
- El comentario de la prueba del bucle (`R9-229`).

## 5. Las lecciones

- **Una pieza que no se aplicó da «sin daño».** Antes de creerle a una sonda con pieza, mirá que el
  apply cambió el motor (`git diff --shortstat`, o el «diff del revert» de `S34-rev`). Las variables
  de entorno que van a un `require` van con la ruta absoluta.
- **Una premisa de la forma «hace falta mientras X espera, no después de su ack» tiene que preguntar
  qué otros acks pasan mientras X espera** (`R9-242`): la entrada sobrevive al de la subida que
  reemplazó.
- **Toda retirada que corre al procesar tiene el problema de `Fresolve`** (`R9-243`): con la cadena
  ocupada, lo que llega después se juzga antes.
- **Un `fire` del mock con los datos de la nube y nada en vuelo es un evento que el SDK no levanta**
  (`R9-244`). Antes de leer una prueba con `fire`, preguntá si la copia difiere de la nube.
