# Sesión 39 (2026-10-01) — revisión del diff de la 38

**Modo:** solo terminal, sin agentes, sin tocar código de la app. Arrancó con
`_scratch/S39-PROMPT.md` (vale más que el mensaje (s) de `CONTINUAR.md`).

**Estado al empezar:** `main` = `origin/main` = `538409e` (el checkpoint de la 38, mergeado y
pusheado; CI verde en el log, run `36947870377`, 368/4518). Los docs del repo decían «sin mergear»
para la 38: este checkpoint lo corrige.

**El diff revisado:** `29c63c3..0b84a7e` (`SyncEngine.ts`, `types.ts` y `SyncEngine.test.ts`).

**Resultado:** 4 hallazgos nuevos, `R9-237`..`R9-240`, todos P3. `R9-236` y la mitad abierta de
`R9-229`, medidos. Hallazgos: **240**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Herramientas** (en `_scratch`): las sondas van en `S39-sondas{,2,3,4}.body.txt` y las piezas en
  `S39-piezas.cjs.txt` (las de la 38, más `Fsettle`, `Fresolve`, `R207fold`, `R207acum`,
  `altDiferir`, `S39ackTarde` y `S39log`, una pieza que solo agrega `console.log`). Las sondas
  corrieron con `S38-sonda.cjs.txt` sobre la base `S39-SyncEngine-base.ts.txt` (= `0b84a7e`).
- **«¿De la 38?»** se midió con el motor de la 36 entero (`S39-SyncEngine-36.ts.txt` = `29c63c3`,
  que también es el motor de `0681c6e`, porque ese commit solo tocó el mock), con
  `S39-motor.cjs.txt`: copia el motor, corre la sonda y restaura la base.
- Después de cada corrida: `git status` limpio, `cmp` igual a la base y NUL 0.

## 2. Las preguntas del prompt

| #   | pregunta                            | respuesta                                                                                                                          |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | la premisa de `noteArrived`         | `R9-237` (de la 38) y `R9-240` (un orden de RNFirebase sin medir); `{merge: true}` y el eco que no llega, sin caso                 |
| 2   | copias que no pasan por el callback | `R9-238`: la lectura de un `removed` no retira nada (ya existía); los `removed` sintéticos de `R9-186`, igual                      |
| 3   | una copia mía tomada por ajena      | leído: lo que se retira de más son relojes más viejos que la copia de la nube; el daño es el veredicto mismo (costes ya aceptados) |
| 4   | `R9-226`                            | leído: nadie escribe `ownStamps` antes del enganche; con otra cuenta entre medias, la entrada no lleva sellos (conservador)        |
| 5   | `R9-236`                            | a `Fsettle` le falta la prueba; `Fresolve` no decide; `207fold` + `207acum` son la causa de `R9-237`                               |
| 6   | las pruebas nuevas de la 38         | caen por la aserción que prometen; la mitad abierta de `R9-229` tiene una forma medida; `R9-235`, leído                            |

### 2.1 La premisa de `noteArrived` (pregunta 1)

- **`R9-237` (de la 38):** con W0 y W1 subidos, el respaldo del otro con W0 pasa por «mío», y dentro
  de los 30 s no hay conflicto (local `w1`, nube `w0`). Con la 36 sí lo había. La premisa dice «sin
  copia ajena entre medias, toda entrega es mía», y aquí la copia ajena es el respaldo mismo, que
  trae mi reloj. Hipótesis medida en parte: `recentAcked` con solo el último ack (sin `207acum` ni
  `207fold`), con lo que `S39-2` da el conflicto y la suite pasa 242/242.
- **`R9-240` (sin medir en nativo):** el ack que la premisa nombra es el del SDK, y el motor lo
  anota en la continuación del `set`. El mock entrega con `setImmediate`, así que el motor anota
  primero (log: «ack» antes que «llega ajena»). Con el ack demorado dos vueltas (`S39ackTarde`),
  el reloj va a `ownStamps` porque el doc ya es conflicto, y el respaldo se pierde. Hay que medir el
  orden en RNFirebase (Modo C, con el OK de Victor).
- **`{merge: true}`, leído:** la vista con mi escritura en vuelo trae mi `updatedAt`, y pasa por
  «mía» con razón. **El eco que no llega** (`stop()` en el mismo tick) lo cubre la prueba de
  `R9-222` (ruta (a)). **Dos dispositivos a la vez:** con el orden del mock, el que pierde en el
  servidor recibe la copia del otro después de su ack y retira; el que gana no recibe nada.

### 2.2 Las copias fuera del callback (pregunta 2)

- **`R9-238` (ya existía):** R2 del otro, bajo el piso, llega por `lookup`. El `removed` trae W3 (mía)
  y la lectura trae R2, que no pasa por `noteArrived`: los sellos quedan, y el respaldo posterior de
  W2 pasa por «mío». Con R2 por el listener, bien.
- **Leído:** el `removed` sintético de `R9-186` no trae copia, y `noteArrived` vuelve sin hacer
  nada. El `removed` del eco de una escritura mía trae la copia ANTERIOR, y `noteArrived` la juzga de
  nuevo como si llegara.

### 2.3 Una copia mía tomada por ajena (pregunta 3)

Leído, sin sonda. La retirada solo ocurre si `isOwnCopy` dice que no, y entonces los relojes que se
retiran son de otras escrituras mías del doc, más viejas que la copia de la nube que la disparó. Un
reloj así solo vuelve con un respaldo, que es del otro, así que retirarlo no pierde nada. El daño
es el veredicto mismo («lo mío contra lo mío»), que ya está en los costes aceptados de `R9-208`
(la tabla ilegible) y de `R9-227` (la entrada descartada). Lo demás no aplica: otra cuenta no
comparte la ruta del doc, y una escritura de otra versión de la app queda en la misma cola y la
misma tabla. Sigue sin medir `R9-234` (la relectura que vuelve a unir sellos retirados).

### 2.4 `R9-226` (pregunta 4)

Leído: nadie escribe `ownStamps` antes del enganche (ver la entrada). Con Ana, Beto y Ana en el mismo
proceso, la edición de Ana antes del enganche no lleva sellos, como antes del arreglo. El daño pide
además la tabla ilegible. No se midió.

### 2.5 `R9-236` (pregunta 5)

| pieza         | sonda                              | con la pieza                          | veredicto                             |
| ------------- | ---------------------------------- | ------------------------------------- | ------------------------------------- |
| `Fsettle`     | `S39-5` (el doc se asienta con W3) | sellos quedan; el respaldo de W2 pasa | falta la prueba (`S39-5`)             |
| `Fresolve`    | `S39-6` (keepMine)                 | igual que el control                  | no decide; candidata a la regla 37    |
| `S34-207fold` | `S39-2`                            | igual (la cubre `acum`)               | junto con `acum`, causa de `R9-237`   |
| `S34-207acum` | `S39-2`                            | igual (la cubre `fold`)               | junto con `fold`, causa de `R9-237`   |
| las dos 207   | `S39-2` y la suite de sync         | conflicto en `S39-2`; 242/242         | quitarlas es la hipótesis de `R9-237` |

Salidas: `S39-guardas-{control,R207acum,R207fold,Fsettle,Fresolve}.out.txt`,
`S39-viejo-acumfold.out.txt` y `S39-rev-acumfold.out.txt`. Quitar cualquiera queda para la 40, con
la matriz entera después (corolario 46).

### 2.6 Las pruebas nuevas de la 38 (pregunta 6)

- **Caen por la aserción que prometen** (en las salidas de la 38): la de `R9-229` por `selloW`, con
  `G218stop` y con `R218clear`. La matriz la tumba también con `R224sellos`, como dice su comentario
  (el sello sembrado se va por `R9-224`). La de `R9-226` en la misma cuenta cae por `conflictos` y
  `entrada` con `R226uid`. La de proceso nuevo cae por `conflictos` y `vistos` con `L32load` y
  `L32table`. Leído: el control de la cola que se le quitó no hace falta para `vistos`, que se mide
  en el proceso sin red, donde L3 sigue en cola.
- **La mitad abierta de `R9-229`:** `S39-7` da 5 lecturas con todo puesto y 60 con `altDiferir`, y
  jest termina, porque la lectura 60 no vuelve nunca. Es la forma de la prueba que falta.
- **`R9-235`:** leído; la ventana es el tick de `user` del arranque en frío. Ver la entrada.

## 3. Sin medir y pendiente

- `R9-240` en nativo (Modo C, con el OK de Victor).
- Las hipótesis de `R9-237` (matriz entera), `R9-238` y `R9-239`.
- `S39-5` y `S39-7` como pruebas, y `Fresolve` por la regla 37: la 40.
- `R9-234`, todavía solo leído.

## 4. Las lecciones

- **Una premisa que dice «sin X entre medias» tiene que preguntar si el caso mismo es X.** La 38
  razonó «sin copia ajena entre medias, toda entrega es mía», y el respaldo del otro ES la copia
  ajena, solo que trae mi reloj.
- **«El ack» tiene dos relojes: el del SDK y el de la continuación del motor.** Una premisa sobre el
  SDK no vale para el motor sin medir el orden en que llegan a JS.
- **Un arreglo que vive en un solo camino de entrada deja abiertos los otros.** `noteArrived` está
  en el callback, y la lectura de un `removed` también entrega copias.
- **Dos guardas que se cubren entre ellas dan 0 cada una en la matriz y pueden ser, juntas, la
  causa de un daño.** La matriz mide de a una pieza.
