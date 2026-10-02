# Sesión 42 (2026-10-02) — arreglos de lo de la 41

**Modo:** solo terminal, sin agentes. Arrancó con `_scratch/S42-PROMPT.md` (vale más que el mensaje
(v) de `CONTINUAR.md`).

**Estado al empezar:** `main` = `origin/main` = `2d8eb49` (el checkpoint de la 41, mergeado y
pusheado; CI verde en el log, run `36974151089`, 368/4526). El último código era `e9d6e89`, y
`_scratch/S40-SyncEngine-R236.ts.txt` era su motor (comprobado con `cmp`). Los docs del repo decían
«sin mergear» para la 41: este checkpoint lo corrige.

**Rama de arreglos:** `fix/s42-arreglos-s41`, un commit por hallazgo:

| Commit    | Hallazgo | Qué                                                                               |
| --------- | -------- | --------------------------------------------------------------------------------- |
| `7c8c0fa` | `R9-242` | el ack de una subida reemplazada deja en la entrada viva solo su reloj (`H41own`) |
| `859480f` | `R9-234` | la relectura de la tabla de sellos no trae lo que la sesión ya decidió            |
| `ae39cd8` | `R9-244` | la prueba del eco tardío de `R9-160`, con el orden que da el SDK                  |
| `fc93ef6` | `R9-243` | un `removed` del otro retira mis relojes al LLEGAR, no al procesar su lectura     |
| `1a77b78` | `R9-229` | el comentario de la prueba del bucle: solo 60 lecturas son el bucle               |

**Resultado:** 5 cerrados (`R9-242`, `R9-234` con lo que quedaba de `R9-239`, `R9-244`, `R9-243` y
el comentario de `R9-229`). 2 nuevos: `R9-245` (medido, sin diagnosticar; ya existía) y `R9-246` (dos guardas sin prueba
propia tras la 42, una vista por la matriz). Hallazgos: **246**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Herramientas** (en `_scratch`): las piezas en `S42-piezas.cjs.txt` (reexporta las de la 41, y
  las de `R9-218` de la 36); cada arreglo con su base (`S42-SyncEngine-R242.ts.txt`, `-R234`,
  `-R244`, `-R243`; la de `R9-244` y la de `R9-229` son la de `R9-234`, porque no tocan el motor).
  Las sondas, en `S42-sondas1.body.txt` (`S42-1`), `S42-sondas2.body.txt` (`S42-2`) y
  `S42-sondas3.body.txt` (`S42-3`). `S32_BASE` y `S34_PIEZAS`, siempre con la ruta absoluta, y cada
  pieza vista aplicada (el «diff del revert» de `S34-rev`, o el «aplicadas» de `S38-sonda`).
- **Cada prueba vista caer** con su pieza revertida sobre la base de su commit, en la suite de sync
  entera, y por la aserción de la consecuencia («su versión», `conflictos`, local, nube), no solo la
  del mecanismo. Las de `R9-242`, `R9-234` y `R9-243` comparan el caso con su control (+1 ms, el
  reloj del otro) dentro de la misma aserción: los dos tienen que dar lo mismo.
- **Dos tropiezos de herramienta:** `S41-motor` toma el motor por NOMBRE dentro de `_scratch`
  (con la ruta absoluta falla) y, aunque falle, restaura su base de la 40 encima de `SyncEngine.ts`.
  La primera vez borró el arreglo de `R9-243` sin commitear; se repuso desde
  `S42-SyncEngine-R243.ts.txt`, y la sonda con el motor viejo se corrió después del commit. Y una
  vez se usó un heredoc con barras (contra la regla) para reemplazar dos llamadas a `retireOwn`: se
  verificó el resultado (las anclas casaron una vez, NUL en 0, sin CRLF).

## 2. Los arreglos

### 2.1 `R9-242` (`7c8c0fa`)

`H41own` tal cual. Las preguntas del prompt, leídas antes de escribirla:

- **La subida reemplazada se RECHAZA:** no hay ack, y el `own` sigue en [W0, W1]. W0 es la copia de
  la nube (ya «mía» por `recentAcked`, y un respaldo con W0 trae los mismos datos que la nube), y W1
  nunca llegó a ella. El comentario del motor lo dice.
- **Una copia ajena retiró el `own` con la subida en vuelo:** no puede. La vista del SDK lleva la
  subida encima (el mock también, `viewChange`): esa copia llega después del ack, y retira después.
  Si el puente de RNFirebase reordenara (`R9-240`), el ack deja [W1], como ya hace con `recentAcked`.

La prueba (dos, de `S41-1` y `S41-2`) cae con `R242` por `conflictos`, «su versión», local y nube.

### 2.2 `R9-234` (`859480f`)

`H239join` cerraba `S41-6` (la relectura vuelve después del ack de L4 y une [W3, L4]), pero **no
alcanzaba el caso que nombra la entrada**: la relectura que la dispara la subida de OTRO conflicto,
sin que doc-c suba nada (`S42-1`). Ahí el sello de W3 vuelve solo, aunque R2 lo había retirado, y
`H239join` da lo mismo que el motor sin tocar.

La primera forma del arreglo («la relectura no toma nada de un doc que la sesión ya decidió: un ack,
una retirada o el fin del conflicto») **tumbó 4 pruebas de `R9-208`**. Con la tabla ilegible, el
enganche entrega una copia MÍA que `isOwnCopy` no reconoce, y la retira: es el coste de `R9-230`.
Guardar esa retirada borraba de la tabla el sello de un conflicto retenido, y tras reiniciar
aparecía «lo mío contra lo mío». La forma final guarda el reloj de cada copia que retira
(`ownRetired`), y la relectura conserva los sellos de un doc si la tabla tiene esos relojes: la
copia era mía.

**Decidido:** la expectativa de la prueba de `R9-218` (`[1000, 200000]`) es la semántica de antes de
`R9-239`. Pasa a `[200000]`, y la prueba sigue cayendo con `R218`. `H239load` no: solo importa con
tablas de compilaciones de desarrollo.

**La guarda de memoria (`byId.has`) no tiene prueba propia:** su revert solo (`R234mem`) no tumba
nada, porque en los órdenes medidos la cubre la del reloj retirado. Con mi propia copia al enganchar,
el conflicto retenido se asienta y la relectura no lo toca (`S42-2`). Se queda (dice `R9-239`
directamente; sin ella habría que unir o pisar), y la 43 busca un orden en que decida sola.

### 2.3 `R9-244` (`ae39cd8`)

La prueba de `R9-160` con el orden de `S41-3`, y sin los dos `fire(edit1)`, que el SDK no levanta.
Cae con `Q41llegada` por «su versión»; ya no con `Q41sello`.

### 2.4 `R9-243` (`fc93ef6`)

**Medido antes de diseñar** (pieza `H41removedLog`, que registra cada `removed` que llega): el que
`H41removed` juzgaba mal en la prueba de `R9-190` es la **reversión del rechazo de W2**. Llega sin
nada en vuelo y trae W2, la escritura rechazada. El `removed` de `S41-7` trae W3, mío y ya
confirmado. Lo que los distingue es que el motor ya vio el rechazo: el SDK web lo entrega al flush
antes que los eventos, y el mock también.

El diseño: el motor anota cada rechazo (`rejectedAwaitingRevert`), y `noteArrived` retira al LLEGAR
un `removed` que llega sin una escritura propia del doc en vuelo y no trae el payload rechazado.
Tres pruebas, una por parte. La excepción «en vuelo» se midió aparte (`S42-3`), porque su revert
no tumbaba nada: con el doc en conflicto, mi respaldo bajo el piso se rechaza, su eco (con W1)
retiraba el sello de W1, y la reversión con W1 pasaba a ser «su versión».

### 2.5 `R9-229` (`1a77b78`)

El comentario de la prueba del bucle dice que solo 60 lecturas son el bucle.

## 3. Lo nuevo: `R9-245` y `R9-246`

La sonda de la excepción «en vuelo» (`S42-3`) mostró, con el motor de hoy y con el de `e9d6e89`,
dos efectos de un respaldo propio rechazado por el servidor: con el doc en conflicto, tras reiniciar
aparece «mi respaldo» contra «w1 mio»; sin conflicto, lo local pasa a W1 con el respaldo esperando
en la cola. Medido, sin diagnosticar. Hace falta que el servidor rechace la escritura.

`R9-246` lo dio la matriz: la retirada de la lectura de un `removed` (`R9-238`) baja de 2 a 0,
y la guarda de memoria de `R9-234` da 0. Abajo.

## 4. La matriz entera

En un worktree aparte (`C:/projects/essb-s42m`, en `1a77b78`, con la junction a
`node_modules`), con `S42-matriz.cjs.txt` (la de la 40 más el bloque de la 42, hecha por
`S42-mkmatriz.cjs.txt`). Salida: `_scratch/S42-matriz-s42-1a77b78.out.txt`; comparación con la de la
40: `S42-comparar-s40.out.txt`.

- **150 piezas, control 0/256.** Ausentes, las 8 de siempre. Dos anclas viejas que cambiaron los
  arreglos se rehicieron con una alternativa: `S34-208unionPoda` (la relectura de `R9-234`) y
  `S40-R238` (`retireOwn` ahora lleva la copia).
- **Contra la de la 40, 120 de 150 iguales.** Las 9 nuevas: `R242` 2, `R234` 3, `R234mem` 0,
  `R234ret` 1, `R234own` 4, `R243` 1, `R243rev` 1, `R243anota` 1, `R243vuelo` 1. Las otras suben
  por las pruebas nuevas, salvo la prueba de `R9-160` (reescrita: ya no cae con `S32-ack`, y cae
  con `S38-R222llegada`) y la de `stop()` de `R9-229`, que deja de caer con `S32-load`,
  `S38-R222nota` y `S38-R224sellos` (sigue cayendo con `G218stop` y `R218clear`).
- **En 0:** `R104-7`, `R104-8` y `S32-+P3`, como en la 40; `R234mem` (ver `R9-234`); y
  **`S40-R238`, que baja de 2 a 0** (corolario 46): la retirada al llegar de `R9-243` cubre sus
  pruebas. Leído, le quedan dos casos en que decide sola (el `removed` sintético de `R9-186` y el
  eco de mi escritura que saca el doc de la query): falta la prueba. `R9-246`.

## 5. Sin hacer y pendiente

- `R9-245`, sin diagnosticar; `R9-246`, sin la prueba (o la medición para quitar la guarda).
- La guarda de memoria de `R9-234` (`R234mem`), sin un orden en que decida sola.
- `R9-240` (Modo C, con el OK de Victor), ahora con dos órdenes más que medir (nota en la entrada).
- Lo demás, como en el (v): `R9-235`, `R9-241`, `R9-211`..`R9-214`, `R9-201`..`R9-203`, `R9-198`,
  `R9-205`, `R9-177`, `R9-38`, `A12`, `R9-164`, `R9-127`, `R9-173`, `R9-126`, `R9-133`.

## 6. Las lecciones

- **Una hipótesis que cierra la sonda puede no cerrar el caso que nombra la entrada.** `H239join`
  cerraba `S41-6` (con el ack de L4 en medio), y la entrada de `R9-234` hablaba de la retirada sin
  nada después: otro orden, el mismo daño. Antes de aplicar la hipótesis de una sesión de revisión,
  releé la entrada y construí el caso que nombra, no solo el de la sonda.
- **Una decisión tomada con un veredicto que puede estar mal no se guarda sin lo que permite
  corregirla.** Con la tabla ilegible, «esta copia no es mía» puede ser falso (`R9-230`). Guardar
  la retirada sola tumbó `R9-208`; guardarla con el reloj de la copia deja que la relectura la
  corrija.
- **Medir antes de diseñar dio el diseño** (`R9-243`): el log de cada `removed` que llegaba mostró
  qué traía cada uno, y la diferencia (el rechazo que el motor ya vio) era la que hacía falta.
- **Una herramienta que restaura una base, la restaura también cuando falla.** `S41-motor` borró un
  arreglo sin commitear. Commiteá (o guardá la base) antes de cada sonda con otro motor.
