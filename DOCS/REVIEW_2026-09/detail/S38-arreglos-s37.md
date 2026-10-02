# Sesión 38 (2026-10-01) — arreglos de lo de la 37

**Modo:** solo terminal, sin agentes. Arrancó con `_scratch/S38-PROMPT.md` (vale más que el mensaje
(r) de `CONTINUAR.md`).

**Estado al empezar:** `main` = `origin/main` = `29c63c3` (el checkpoint de la 37, mergeado y
pusheado; CI verde en el log, run `36941443455`, 368/4508). Los docs del repo decían «sin mergear»
para la 37: este checkpoint lo corrige.

**Rama:** `fix/s38-arreglos-s37`, 10 commits sobre `29c63c3`, uno por hallazgo (`0681c6e`..`0b84a7e`).

**Resultado:** cerrados `R9-220`..`R9-226`, `R9-228`, `R9-230`..`R9-233`; `R9-227` decidido (coste
aceptado); `R9-229` cerrado a medias. 3 nuevos: `R9-234`, `R9-235` y `R9-236`. Hallazgos: **236**. Queda 1 P0
(`R9-38`).

---

## 1. Cómo se trabajó

- **Herramientas** (todas en `_scratch`): `S38-sonda.cjs.txt` aplica piezas con `S34-rev`, corre
  una sonda con `S31-run`, restaura, borra `__tests__/S31sonda.test.ts` y comprueba `git status`,
  `cmp` contra la base y el NUL. `S38-todas.cjs.txt` corre las 9 sondas de `R9-220`..`R9-224` (copias
  `S38-A*` que toleran la falta de `recentEchoed`). Las piezas nuevas están en `S38-piezas.cjs.txt`
  y las hipótesis medidas, en `S38-hip.cjs.txt`. Hay una base por paso: `S38-SyncEngine-{H2,R223,
R224,R226}.ts.txt`.
- **Cada prueba nueva se vio caer** con su pieza revertida, y con el motor del commit anterior
  cuando el arreglo no tiene pieza propia que lo revierta. Tras cada `--restore`: `git status`
  limpio, `cmp` igual a la base y NUL 0.
- **Un tropiezo:** una pieza escrita con `node -e` en la línea de comandos quedó mal escapada (las
  barras). Se rehízo con Edit. La regla de siempre: nada de barras en la línea de comandos.

## 2. Los arreglos

| commit    | hallazgo           | qué                                                                                    | pruebas (caen con)                                                         |
| --------- | ------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `0681c6e` | `R9-221`           | el mock entrega un objeto nuevo por entrega y por lectura (uno por entrega, como RNFB) | las de `R9-216` y `R9-207` caen igual que antes con cada pieza             |
| `24a61bc` | `R9-220`, `R9-222` | `noteArrived`: el veredicto, al LLEGAR la entrega; una copia ajena borra `recentAcked` | 3 nuevas + las 2 de `R9-216` (motor de la 36, `R222olvido`, `R222llegada`) |
| `af4f367` | `R9-223`           | la copia ajena retira el `own` de la entrada en cola (en el sitio) y escribe la cola   | 2 nuevas (`R223own`, motor anterior; `R224disco` por el disco)             |
| `697f61c` | `R9-224`           | la copia ajena retira `ownStamps` del doc y escribe la tabla                           | 2 nuevas (`R224sellos`, motor anterior, `R224disco`)                       |
| `82f3f20` | `R9-226`           | la guarda de `R9-217` por cuenta (`ownStampsUid`), no por «conflicto de la sesión»     | 2 nuevas (`R226uid`, `L32load`, `L32table`); Beto con `R226sin`            |
| `8991142` | `R9-229`           | la prueba de `S37-A3-gaveup2`: `stop()` vacía `ownGaveUp`                              | 1 nueva (`G218stop`, `R218clear`)                                          |
| `742c874` | `R9-228`           | textos: la prueba y la guarda de `R9-215` dicen que su orden es solo del mock          | —                                                                          |
| `495a1e1` | `R9-230`           | texto: la regla de `R9-190` dice la excepción de `R9-219`                              | —                                                                          |
| `117e5a4` | `R9-231`           | comentario: la prueba de `R9-218` solo mira doc-b, y por qué                           | —                                                                          |
| `0b84a7e` | `R9-233`           | textos: `PendingWrite.own` e `isOwnCopy`                                               | —                                                                          |

`R9-225` y `R9-232` quedan cerrados por `24a61bc` (la estructura y su prueba se quitaron). `R9-227`
no lleva código. El detalle de cada uno está en su entrada de `BUGS.md`.

### 2.1 `R9-221` primero, y lo que dijo

Con el mock arreglado, las 5 piezas de `R9-216` y `alt207own` tumbaron exactamente las mismas
pruebas que con el mock viejo (`_scratch/S38-mock-*.out.txt`). Ninguna prueba hubo que reescribir:
la identidad que medían las 5 de `R9-207` es la de un objeto dentro de UNA entrega (el que
`noteEcho` anotaba justo antes de `applyRemoteChange`), y esa sí es del teléfono.

### 2.2 `R9-220` y `R9-222`: tres hipótesis medidas

1. **H1, la de A1** (el eco anotado vale para cualquier copia hasta que el doc entrega después una
   copia ajena): cierra `R9-220` en el proceso, y **ninguna** ruta de `R9-222`
   (`S38-H1-sondas.out.txt`). Un eco que nunca se anotó no puede dejar de valer.
2. **Retirar los relojes al PROCESAR una copia ajena:** descartada por lectura contra la 5.ª prueba
   de `R9-207`, donde la copia del otro llega antes de que existan W1 y W2 y sus ecos se procesan
   después.
3. **H2, la que se quedó:** decidir al LLEGAR la entrega, en el callback de `onSnapshot` (en el
   orden del SDK, antes de la cadena de lotes). Una copia mía lo sigue siendo para su lote
   (`ownArrived`, un `WeakSet`); una ajena borra `recentAcked` del doc. Una escritura en vuelo está
   encima de la vista del SDK, así que ninguna copia del otro llega antes de su ack. Medida con las 9
   sondas (`S38-H2-sondas.out.txt`): `R9-220` en el proceso y las tres rutas de `R9-222`, iguales al
   control.

La pieza `R222llegada` (sin el veredicto de la llegada) solo la ve una prueba nueva: la copia del otro
que llega DETRÁS de mis ecos, con la cadena ocupada. Sin ese veredicto, la copia ajena le quita el
reloj al eco que ya llegó y espera, y aparece «w2|w1».

### 2.3 `R9-223` y `R9-224`, la misma regla por las otras dos ramas

La sonda de A5 dejó de mostrar el caso con `24a61bc`, pero por una razón lateral: L2 se encolaba
después de la copia del otro y ya no llevaba el reloj. El caso abierto era la entrada ya en cola
(`S38-cola2.body.txt`). Los dos arreglos borran en el sitio y escriben a disco. **Consecuencia:**
el enganche que entrega la copia del otro de un conflicto retenido retira los sellos viejos del doc.
La prueba nueva de `R9-229` lo muestra.

### 2.4 `R9-226`: la decisión

Por cuenta y no por conflicto: `ownStampsUid` (la carga del enganche lo fija; `stop()` no lo toca).
El porqué medido: la guarda vieja (`R226uid`) deja fuera la misma cuenta en una sesión nueva, y sin
guarda (`R226sin`) cae la prueba de Ana y Beto. La de A3 para `S32-load`/`S32-table` se reescribió
para un proceso nuevo, porque en el mismo proceso la entrada ya lleva el sello.

## 3. La matriz entera

En `C:/projects/essb-s38-matriz` (worktree sobre `0b84a7e`, con la junction a `node_modules`;
borrado al terminar, la junction primero), con `_scratch/S38-matriz.cjs.txt`: la de la 36 menos las 5
piezas `R216*` (revierten `recentEchoed` y `noteEcho`, que ya no existen), más las 7 de la 38 y anclas
nuevas para `S32-Yuid`, `S34-207own`, `S34-+207win` y `S36-R217guard` (corolario 41). Salida:
`S38-matriz-s38-0b84a7e.out.txt`; comparación con la de la 37: `S38-comparar-s37.out.txt`.

- **138 piezas, control 0/242.** Las 8 AUSENTES son las mismas que en la 37.
- **95 de 143 iguales a la 37.** Las diferencias son, casi todas, pruebas nuevas que caen con piezas
  viejas (`S190-cola` pasa de 4 a 28: la rama de la cola de `isOwnCopy` decide ahora también al
  llegar).
- **Las piezas nuevas:** `R222olvido` 6, `R222llegada` 1, `R222nota` 9, `R223own` 2, `R224sellos` 3,
  `R224disco` 4, `R226uid` 1; `S36-R217guard` (con el ancla de `R226sin`) 1.
- **Cuatro piezas viejas bajan a 0:** `S32-Fsettle`, `S32-Fresolve`, `S34-207fold` y `S34-207acum`.
  Es el corolario 46: la retirada por copia ajena y el veredicto de la llegada cubren sus casos. No
  se quitaron en esta sesión (cada una pide su medición y otra matriz entera): `R9-236`, para la 39.
  `S34-+207poda` también da 0, pero es una forma alternativa, no una guarda.

## 4. Sin medir y pendiente

- **`R9-229`, la otra mitad:** el `return` de la rama `waiting` sigue sin prueba (su revert es un
  bucle caliente).
- **`R9-234`** (leído): la relectura de la tabla vuelve a unir los sellos que una copia ajena retiró.
- **`R9-235`** (medido, ya existía): una edición entre `stop()` y `start()` no entra en la cola.
- **`R9-236`** (la matriz): cuatro guardas viejas en 0 tras la 38.
- **El caso de un proceso nuevo de `R9-220`** (`[wb, wa]`, la entrada descartada se lleva el reloj
  de Wa): ya existía, y es de la familia de `R9-227`.
- **La CPU de `noteArrived`:** un `queue.find` por cambio que llega, como el de `noteEcho` antes. Sin
  medir.

## 5. Las lecciones

- **Una hipótesis que dice «deja de valer» necesita que algo haya empezado a valer.** H1 anulaba el
  eco anotado, y la ruta (a) de `R9-222` es justo la del eco que nunca se anotó.
- **El orden de llegada y el orden de proceso son dos relojes distintos.** Con la cadena de lotes,
  decidir al procesar mira un estado que ya no es el de la entrega; decidir al llegar mira el que el
  SDK tenía.
- **Una sonda que deja de mostrar el daño tras un arreglo puede haberlo esquivado** (la de A5: L2
  ya no llevaba el reloj). Antes de cerrar, preguntá si el caso sigue construible por otro orden.
- **Un arreglo nuevo cambia lo que afirman las pruebas viejas** (corolario 48): el sello sembrado de
  la prueba de `R9-229` se va con `R9-224`, y la prueba lo dice.
