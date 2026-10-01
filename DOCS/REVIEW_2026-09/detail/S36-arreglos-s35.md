# Sesión 36 (2026-10-01) — arreglos de lo de la 35

**Modo:** solo terminal, sin agentes, en el mismo chat que la 35 (Victor: «continúa por favor»,
después del merge de la 35). Arreglos de `R9-215`..`R9-219`, el mensaje (p) de `CONTINUAR.md`.

**Estado al empezar:** `main` = `origin/main` = `d15cd71` (el checkpoint de la 35, mergeado y
pusheado con el OK de Victor). CI verificado EN EL LOG: run `36818493621`, 3 jobs verdes, Node
v24.21.0, 368/4501, cero «failed to run».

**Resultado:** 5 cerrados en `fix/s36-r215-r219`, un commit por hallazgo:

| commit    | hallazgo | qué                                                                                 |
| --------- | -------- | ----------------------------------------------------------------------------------- |
| `0970726` | `R9-219` | el comentario de `R9-206` deja de afirmar que la marca solo va a una copia del otro |
| `8c7658c` | `R9-215` | la relectura de una sesión terminada no tapa la de la siguiente                     |
| `f785702` | `R9-218` | la relectura que falla en una colección no saca la cola sin la tabla de otra        |
| `31cc55a` | `R9-217` | la entrada nueva de un doc en conflicto lleva el último sello propio                |
| `2bfbcf8` | `R9-216` | un reloj de `recentAcked` es mío solo en la copia que trajo su eco                  |

Ningún hallazgo nuevo. Hallazgos: **219**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Cada prueba, vista fallar primero** sobre el código sin arreglar y leída por la razón (los
  controles en verde, la aserción del caso en rojo). Las pruebas salen de las sondas de la 35
  (`_scratch/S35-sonda-*.body.txt`), y se insertan con `_scratch/S36-insert.py.txt` al final del
  `describe` de `R9-124`. Sus cuerpos: `S36-t*.ts.txt`.
- **El revert por pieza:** `S34-rev.cjs.txt` con `S32_BASE=_scratch/S36-SyncEngine-base.ts.txt` (el
  `SyncEngine.ts` de la punta, comprobado con `cmp`) y `S34_PIEZAS=_scratch/S36-piezas.cjs.txt`.
  Salidas: `S36-rev-*.out.txt`. Al apilar, todas las piezas se re-midieron sobre el árbol combinado
  (corolario 46): `S36-rev-final-*.out.txt`, los mismos conteos.
- **Una lección repetida:** un heredoc con barras invertidas volvió a hacer de las suyas, esta vez en
  un `.cjs.txt` de piezas (los `\n` de las cadenas pasaron a saltos reales). Se notó porque `node`
  no lo cargaba, y se reescribió con Write. Lo de la regla vale para todo archivo, no solo para
  `SyncEngine.ts`.

## 2. Los arreglos

### 2.1 `R9-219` (el comentario)

`SyncEngine.ts`, el comentario de la rama retenida: `remoteTs === heldAt` sobra en los dos casos. La
copia del otro en la marca es más nueva que la local, o más vieja y no propia, y esta rama la toma
igual. La propia, que la sesión con la tabla ilegible tomó por la del otro (medido en la 35), vuelve
a ser propia cuando se leen los sellos, y se asienta por LWW. Sin prueba: `+heldAt` ya tumba 4.

### 2.2 `R9-215`

`ownRereading` pasa de `Set` a `Map` (colección → sesión que pidió la relectura), y `rereadOwn` sale
solo si la relectura en vuelo es de la misma sesión. Prueba: la sonda `rereading` (la misma cuenta,
la tabla falla en los dos enganches, doc-c sube en la sesión 2 y d4 queda en cola sin red; el
proceso muere). Cae sin el arreglo: en disco `["lo mio 4"]` y en el proceso nuevo `["lo mio 4"]`.

- `R215`: 1, la suya.
- `R215del` (borrar la marca solo si es de la propia sesión): 0. Una relectura duplicada no hace
  daño: se quitó la guarda (regla 37) y se volvió a medir `R215` (1).

### 2.3 `R9-218`

La relectura que falla ya no fuerza la escritura entera. Anota su tabla en `ownGaveUp`, y
`persistQueue` espera solo a las tablas que siguen por leer y no fallaron (`waiting`). Cuando
escribe, vacía el conjunto. `force` queda para `stop()`. Medido con la sonda `dos` de la 35 sobre el
arreglo (`_scratch/S36-sonda-dos-fix.out.txt`): con `ca` fallando y `cb` bien, una sola escritura
(`queue+cb`; antes, `queue` y después `queue+cb`). Con las dos fallando, una escritura y dos
lecturas: no hay bucle. Con las dos bien, lo mismo que antes.

- **Prueba:** con dos colecciones reales (`test` y `test2`). El disco de una sesión anterior tiene,
  en cada colección, un conflicto retenido con su sello y «lo suyo» en la nube, así que al enganchar
  el conflicto vuelve a estar en memoria. La primera versión de la prueba no tenía la nube: el eco
  asentaba el doc por LWW antes del ack, y el ack iba a `recentAcked`. Las dos tablas fallan al
  enganchar. Al releer, la de `test` falla y la de `test2` espera a una puerta. El proceso muere
  tras la primera escritura de la cola sin las dos entradas.
- Cae sin el arreglo por el sello de Wb que falta en la tabla de `test2`. El conteo de relecturas
  de `test` (4 sin el arreglo) depende de cuántas escrituras hubo, y salió del control.
- `R218`: 1, la suya. `R218clear` (no vaciar `ownGaveUp`): 1, la de `R9-208` «la relectura falla
  una vez, la escritura siguiente la vuelve a intentar».

### 2.4 `R9-217`

En `queueWrite`, la entrada nueva de un doc que es conflicto de esta sesión (`isConflictDoc`) lleva
también el último sello de `ownStamps`, plegado con `withStamp`. La forma deja intacta el ancla de
`Ypush`. La guarda importa: después de un `stop()`, `ownStamps` sigue siendo el de la cuenta
anterior hasta que la siguiente engancha la colección.

- **Pruebas:** la sonda `coste`, caso (a): el proceso nuevo tiene `own [200000]` y ningún conflicto.
  La de Ana y Beto: Beto escribe el mismo doc antes de enganchar, y su entrada no lleva el reloj de
  Ana. Vigila el «por uid» y dice que no mide una consecuencia para el usuario.
- `R217`: 1; `R217guard`: 1.
- **Corolario 48:** la prueba de `R9-208` que filtra a doc-c (`fantasmaC`) dice ahora qué pasa con
  doc-d, y dónde se mide.

### 2.5 `R9-216`

- **La hipótesis de la 35:** «un reloj cuyo eco ya llegó deja de responder "mía"». La forma:
  `noteEcho`, llamada justo antes de `applyRemoteChange`, anota en `recentEchoed` la copia cuya
  entrega trajo primero cada reloj. `isOwnCopy` acepta un reloj de `recentAcked` solo en esa copia
  (por identidad: la misma entrega lo consulta varias veces).
- **Por qué ahí:** la marca no puede ir en `isOwnCopy` (lo llaman varias veces por entrega), y un
  `try/finally` alrededor del bucle cambiaba la sangría del cuerpo entero y rompía las anclas de la
  matriz.
- **Lo que la medición cambió:** con solo los relojes de `recentAcked`, las dos pruebas seguían
  cayendo. El SDK (y el mock) entrega el eco antes del ack, con la escritura en cola, así que en ese
  momento el reloj no está en `recentAcked`. El eco se anota también con el reloj de la entrada en
  cola o de su `own`, y la poda conserva esos.
- **Pruebas:** las dos de la 35 (la rama `pending` y la retenida, en el mismo proceso tras
  `stop()`/`start()`), y una de memoria. Con 20 escrituras del mismo doc quedan 17 ecos: los 16 de
  `recentAcked` y el de la escritura que estaba en cola cuando llegó (el viejo se poda en el eco
  siguiente). Sin la poda serían 20 y crecerían con cada escritura del proceso.
- **Piezas:** `R216own` 2, `R216note` 3, `R216cola` 3, `R216poda` 1, `R216same` 5. Las de `R9-207`
  caen con `R216same`: la identidad de la copia es lo que mantiene su caso.
- **Coste que queda:** un reloj cuyo eco no llegó nunca (el listener se lo saltó, por ejemplo dos
  escrituras rápidas que el SDK junta) sigue diciendo «mía» a cualquier copia, como antes de la 36.
  Y la rama de `ownStamps` (escrituras tomadas con el doc en conflicto) no mira el eco. Ninguno de
  los dos se midió.

## 3. La matriz entera

`S36-matriz.cjs.txt`, armada por `S36-mkmatriz.cjs.txt` desde `S34-matriz.cjs.txt` y
`S36-bloque.cjs.txt`: las 10 piezas nuevas y las alternativas de ancla de 5 viejas que los
arreglos cambiaron (corolario 41): `S32-Yuid`, `S34-208diferir`, `S34-208fuerza`, `S34-207own` y
`S34-+207win`. Con `check`, todas casan una vez. Corrida en el worktree `C:/projects/essb-s36-matriz`
(`--detach` sobre `2bfbcf8`, junction de `node_modules`). Salida:
`_scratch/S36-matriz-s36-2bfbcf8.out.txt`; comparada con la de la 35 en `S36-comparar-s35.out.txt`.

- **136 piezas, control 0/232.** 107 dan lo mismo que en la 35. Las 10 nuevas tumban al menos 1:
  `R215` 1, `R218` 1, `R218clear` 1, `R217` 1, `R217guard` 1, `R216own` 2, `R216note` 3, `R216cola`
  3, `R216poda` 1 y `R216same` 5. Las otras 19 cambian, y 17 solo suben (las pruebas nuevas caen
  también con piezas viejas de `R9-193`, `R9-206`, `R9-207` y `R9-208`).
- **Dos piezas viejas dejaron de tumbar pruebas:** `S32-load` (16 → 14: la de `R9-196` con la lista
  de releer ilegible, el control de `R9-193` y la del JSON roto de `R9-208`) y `S32-table` (20 → 22,
  pero dejan de caer las dos primeras). Medido con `_scratch/S36-combo.cjs.txt` (salida
  `S36-combo.out.txt`): con `R217` revertida a la vez, las 3 vuelven a caer con las dos piezas. **No
  se perdió una guarda:** esos casos quedaron cubiertos dos veces. La entrada en cola lleva ahora el
  sello (`R9-217`) y reconoce la copia aunque la tabla no se cargue o no se escriba. Las dos piezas
  siguen tumbando 14 y 22 pruebas.
- Los ceros son los mismos (`R104-7`, `R104-8` y `+P3`), y las 8 AUSENTES también.

Al terminar, la junction se borró con `.Delete()` ANTES de `git worktree remove`.
