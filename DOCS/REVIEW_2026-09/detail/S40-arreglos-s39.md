# Sesión 40 (2026-10-01) — arreglos de lo de la 39

**Modo:** solo terminal, sin agentes. Arrancó con `_scratch/S40-PROMPT.md` (vale más que el mensaje
(t) de `CONTINUAR.md`).

**Estado al empezar:** `main` = `origin/main` = `4f1ce9a` (el checkpoint de la 39, mergeado y
pusheado; CI verde en el log, run `36960757105`, 368/4518). Los docs del repo decían «sin mergear»
para la 39: este checkpoint lo corrige.

**Rama de arreglos:** `fix/s40-arreglos-s39`, un commit por hallazgo:

| commit    | hallazgo | qué                                                                            |
| --------- | -------- | ------------------------------------------------------------------------------ |
| `d57807b` | `R9-237` | `recentAcked` guarda solo el reloj del último ack (sin `207acum` ni `207fold`) |
| `04f27e7` | `R9-239` | `ownStamps` guarda solo el sello del último ack; dos pruebas cambian de orden  |
| `bfd0a57` | `R9-238` | `retireOwn`: la lectura de un `removed` retira como una copia ajena entregada  |
| `f83a7f8` | `R9-236` | las pruebas de `Fsettle` y `Fresolve` (que NO era equivalente: se queda)       |
| `e9d6e89` | `R9-229` | la prueba del bucle de las relecturas (dos tablas que fallan siempre)          |

**Resultado:** 5 cerrados (`R9-229` entero). 1 nuevo, `R9-241` (leído, sin daño hoy). Hallazgos:
**241**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Herramientas** (en `_scratch`): las piezas nuevas en `S40-piezas.cjs.txt` (reexporta las de la
  39 y la 38), una base por commit del motor (`S40-SyncEngine-{R237,R239,R238,R236}.ts.txt`), las
  pruebas armadas como `S40-t*.ts.txt` e insertadas con `S40-insert.py.txt`/`S40-splice.py.txt`, y
  la matriz `S40-matriz.cjs.txt` (hecha por `S40-mkmatriz.cjs.txt`).
- **Cada prueba se vio caer** con su pieza revertida sobre la base del commit, en la suite de sync
  entera (`S34-rev`), y por la aserción de la consecuencia, no solo la del mecanismo. Después de
  cada restore: `git status` limpio, `cmp` igual a la base y NUL en 0.
- **Un tropiezo de herramienta:** `S38-sonda` restaura `S32_BASE` encima de `SyncEngine.ts`, así que
  una sonda corrida con cambios del motor SIN commitear los borra. Se salvó porque el motor estaba
  copiado en `_scratch/S40-wip-239.ts.txt`. Con cambios sin commitear, guardá una base antes.

## 2. Los arreglos

### 2.1 `R9-237` (`d57807b`)

`noteOwnAcked`, sin conflicto, deja en `recentAcked` solo el reloj de ese ack. La pregunta del prompt
sobre el `own` de la entrada nueva (`R9-194`): hace falta mientras la entrada espera (un reinicio
entrega la copia de la nube, que es la escritura anterior), y no después de su ack (lo que llega
entonces es la escritura de la entrada), así que plegarlo en `recentAcked` sobraba. Prueba de
`S39-2`; cae con `R237` (las dos piezas), `R237acum` y `R237fold` (cada una sola).

### 2.2 `R9-239` (`04f27e7`)

La hipótesis se midió antes de tocar nada: con `H239ack`, `S39-3` da el conflicto, y la suite pasa
240/243. Las tres que caían:

- **`R9-160`, «el eco de una edición propia durante el conflicto»:** el `fire` de L1 llegaba después
  del ack de L2 (en el mock, `fire` se entrega con `setImmediate`). El SDK no produce ese orden para
  un eco: el de L1 sale al aplicar su `set`, y el `set` de L2 sale después del ack de L1. Una copia de
  L1 que llega después del ack de L2 es un respaldo del otro, y ahora la prueba la hace llegar con
  L2 en la cola, sin red.
- **Las dos de `R9-224`** (su control `sellos`): con un solo sello, el respaldo de W2 ya no ejercía
  la retirada. Y el primer intento, un respaldo de W3, tampoco: con lo local en W3 tiene el mismo
  reloj que lo local, y el motor lo toma por su eco por diseño. La retirada de `ownStamps` solo decide
  cuando lo local es más nuevo que el último sello, o sea con una edición en la cola. La prueba de
  `R9-224` pasa a tener L4 en la cola y el respaldo de W3, y cae con `R224sellos`, `R224disco` y
  `R223own` (cada guarda sola deja caer la prueba: se necesitan las dos).
- La vieja de `R9-224`, sin R2, es ahora la de `R9-239` (ramas pendiente y proceso nuevo); cae con
  `R239`.

**Lo que queda:** `rereadOwn` todavía une el último sello de disco con el de memoria, y una tabla
escrita antes de este cambio puede traer varios sellos. `H239load` + `H239join` lo cerrarían, pero la
prueba de `R9-218` perdería su discriminador (su sello sembrado está en el mismo doc). Va con
`R9-234`, que vive en la misma función.

### 2.3 `R9-238` (`bfd0a57`)

**`S39-4` ya no mostraba el daño** después de `R9-239` (corolario 49), aunque los sellos seguían sin
retirarse por la lectura (`S40-lectura-R239.out.txt`). La prueba usa el caso que seguía abierto: W3
sellado y L4 en la cola, R2 bajo el piso (llega como `removed` y la lectura lo encuentra), y el
respaldo de W3. La retirada pasa a `retireOwn`, que llaman `noteArrived` y la lectura; esta, solo
si la copia leída no es mía. Esa guarda está vigilada: sin ella (`R238siempre`) caen las pruebas de
`R9-190` y `R9-196`.

### 2.4 `R9-236` (`f83a7f8`)

- **`Fsettle`:** `S39-5` también había esquivado su caso (respaldo de W2). La prueba: el conflicto
  retenido se asienta con W3 (el enganche la entrega), subo L4, y el otro restaura W3.
- **`Fresolve`:** el prompt pedía quitarla por la regla 37, por la lectura de la 39 («toda resolución
  con sellos sube algo, y su eco asienta el doc»). Medido, **no es equivalente**: `settle` corre al
  PROCESAR el eco, y con la cadena de lotes ocupada el ack de la resolución llega antes. Con
  keepTheirs y un respaldo de W3 en esa ventana, sin la guarda el respaldo pasa por «mío»
  (`S40-sondas6.body.txt`, `S40-fresolve2-{control,Fresolve}.out.txt`). Se queda, con su prueba, y
  el comentario del motor dice el porqué. Decidido con el criterio que Victor delegó para el diseño
  de sync.

### 2.5 `R9-229` (`e9d6e89`)

La prueba de `S39-7`: 5 lecturas con todo puesto; con `altDiferir`, 60, y jest termina.

## 3. Leído, sin caso: la identidad de `change.doc` en RNFirebase (`R9-241`)

Al mirar por qué `ownArrived` no salvaba el eco tardío de `R9-160`, se leyó RNFirebase 26.2.0:
`DocumentChange.doc` es un getter que crea un `DocumentSnapshot` nuevo en cada lectura, y cada uno
parsea sus datos de nuevo. El motor lee `change.doc` en `noteArrived` y otra vez al procesar, así que
`ownArrived` parecía no casar nunca en el teléfono. **No pasa:** `wrapQuerySnapshot`
(`src/lib/sync/firestore.ts`) lee `c.doc` una vez por cambio y envuelve ese snapshot, y el motor llama
a `docChanges()` una vez por entrega. Pero nada lo vigila (el mock sustituye `firestore.ts` entero):
`R9-241`. Y la razón de que la prueba de `R9-160` cayera era otra: el orden de `fire` (2.2).

## 4. La matriz entera

`_scratch/S40-matriz-s40-e9d6e89.out.txt` (en el worktree `essb-s40m`, en `e9d6e89`, con
`S32_FULL=1`; esta vez tardó unos 25 minutos), comparada con la de la 38 en
`S40-comparar-s38.out.txt`:

- **141 piezas, control 0/250.** Las 8 ausentes son las mismas de la 38. Las que dan 0 son las de
  siempre (`R104-7`, `R104-8` y la suma `S32-+P3`).
- **Quitadas a propósito** (corolario 41): `S34-207fold`, `S34-207acum` y `S34-+207poda`, cuyo código
  se fue con `R9-237`. Su revert, sobre el código de hoy, son `S40-R237`, `S40-R237acum` y
  `S40-R237fold`. `S38-R222olvido` tiene un ancla nueva (`retireOwn`).
- **Nuevas:** `S40-R237` (2), `S40-R237acum` (1), `S40-R237fold` (2), `S40-R239` (2), `S40-R238` (2)
  y `S40-R238siempre` (3). `S32-Fsettle` y `S32-Fresolve` pasan de 0 a 1 (`R9-236`).
- **114 de 144 iguales.** Las que suben lo hacen por las pruebas nuevas. Dos bajan, y por eso se
  miraron: `S190-cola` (28→25) y `S32-repetidos` (3→1). Las dos viejas de `R9-224` ya no existen
  con ese nombre, y la del eco tardío de `R9-160` ahora solo cae con `S32-ack`: la entrada en cola
  (su `own`) y el sello la cubren a la vez. `S190-cola` sigue decidiendo en 25 pruebas.
- **De paso:** la prueba de `Fresolve` cae también con `S40-R237` y `S40-R237fold`. La entrada de la
  resolución lleva el reloj de W3 en su `own` (`R9-217`), y plegarlo en su ack es la forma de
  `R9-237` en la resolución. La del bucle (`R9-229`) cae con 7 piezas de `R9-208`/`R9-218`: fija el
  número de lecturas de hoy (5), así que cualquier cambio en las relecturas se ve ahí.

## 5. Sin hacer y pendiente

- `R9-240` (Modo C, con el OK de Victor), ahora con una pregunta más: el orden de llegada entre un
  eco y el ack de una escritura posterior.
- Lo que queda de `R9-239` va con `R9-234`.
- `R9-241`: la prueba de `firestore.ts`.

## 6. Las lecciones

- **Una sonda que midió un daño puede dejar de mostrarlo por un arreglo HERMANO de la misma sesión**
  (corolario 49): `S39-4` y `S39-5` usaban un respaldo de W2, y `R9-239` hizo que W2 ya no fuera un
  sello. Antes de convertir una sonda en prueba, corrala sobre el árbol de hoy.
- **Una guarda que «el eco siempre cubre» se mide con el eco esperando en la cadena:** el orden de
  llegada y el de proceso son dos relojes, también para soltar sellos (`Fresolve`).
- **Antes de afirmar una propiedad del SDK, leé también el envoltorio propio:** el getter de
  RNFirebase daba un objeto nuevo por lectura, y `firestore.ts` lo leía una sola vez.
- **Un arreglo puede quitarle el discriminador a la prueba de otro:** la de `R9-224` pasaba por
  `R9-239` y no por la retirada. Re-medí las piezas viejas en el árbol nuevo antes de la matriz.
