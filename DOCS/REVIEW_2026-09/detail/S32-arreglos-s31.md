# Sesión 32 — arreglos de lo de la 31, e integración de `R9-192` y `R9-193`

Sesión 32, 2026-09-30, solo en la terminal y sin agentes. Rama `fix/s32-r192-r193-y-s31`, sobre
`main` = `b26ab8d`: 13 commits (`b58a158`..`c1664a5`), uno por hallazgo, cada prueba vista fallar primero con su pieza
revertida (revert por pieza, no entero). Sin mergear hasta el OK de Victor.

## 1. Estado de partida

- `main` = `origin/main` = `b26ab8d` (el checkpoint de la 31; el último código era `45d2f41`). CI
  verificado en el log antes de empezar: run `36753796896`, 3 jobs verdes, Node v24.21.0, 367/4451,
  cero «failed to run».
- 1 P0 abierto (`R9-38`), 205 hallazgos.
- Las decisiones, en `_scratch/S32-PROMPT.md`: `R9-192` (P2/P3 y quitar el `fromRead ||` de la
  marca), `R9-193` (el diseño unificado de los sellos), P3 con `isOwnCopy` al juntarlos («o lo que
  la medición diga») y `+Y` aceptado para `R9-194`.

## 2. Resumen

| Hallazgo | Sev. | Commit    | Qué se hizo                                                                               | Revert por pieza (suite de sync)            |
| -------- | ---- | --------- | ----------------------------------------------------------------------------------------- | ------------------------------------------- |
| `R9-192` | P2   | `b58a158` | P2/P3 de S31-A2, y sin el `fromRead` de la marca                                          | P2 2, P2dif 1, P3 4, FRD 5 (de 182)         |
| `R9-193` | P2   | `22d33e2` | El diseño unificado de S31-A3 (sellos persistidos; cola y tabla en un `multiSet`)         | 18 piezas, igual a S31 salvo `qts` 1 → 2    |
| `R9-196` | P3   | `6b630e3` | Fuera los dos `fromRead` (P3 y FRD): con los sellos solo sumaban la copia propia          | FRD 1, P3 0 (equivalente), `load` 10        |
| `R9-195` | P3   | `49f3ca5` | H1c: con la lista de conflictos ilegible, releer la dice                                  | H1c 1, sin `conflict = true` 1              |
| `R9-197` | P3   | `b15e899` | H3 adaptado: sin conflicto en memoria, la lectura sigue y la rama retenida lo registra    | continuación 1, `!local` 1, `settle` 1      |
| `R9-199` | P2   | `b036eff` | H5: el ack de una escritura del doc en conflicto la anota como «escrita aquí»             | H5 1                                        |
| `R9-200` | P3   | `2f2f9f6` | La prueba de `R9-190` «antes del ack» deja W2 en espera y mira el fantasma                | `qts` (P1q) 2: esta cae por la consecuencia |
| `R9-204` | P3   | `d85fe19` | C4: keepMine re-sella también la fila local                                               | C4 2, `isCurrent()` tras re-sellar 1        |
| `R9-189` | P3   | `a431d10` | +W: la ventana de 30 s pregunta `isOwnCopy`                                               | +W 1                                        |
| `R9-174` | P3   | `36cf5be` | +Npend: una copia es «suya» si su reloj difiere y no es propia (+W, sin conflicto)        | +Npend 1, +W 2                              |
| `R9-194` | P3   | `e7d7fb8` | +Y: `recentAcked` pasa el reloj a la entrada nueva siguiente (aceptado por la delegación) | Ypush 2, Yset 2, sin uid en la clave 2      |
| `R9-206` | P3   | `bbe855e` | NUEVO (lo mostró la matriz): sin `remoteTs === heldAt`, que con A no agregaba nada        | sumarlo 0; sin A caen 14                    |

- **12 cerrados**, uno de ellos nuevo (`R9-206`). Hallazgos: 205 → 206. Queda 1 P0 (`R9-38`).
- El punto 6 del prompt (`R9-201`..`R9-203` y `R9-198`, sin arreglo medido) no se hizo: queda para
  otra sesión.
- La suite de sync pasó de 178 pruebas (en `main`) a 209.

## 3. Lo que la medición cambió de las decisiones

### 3.1. P3 y FRD sobran con los sellos (`R9-196`)

- **Juntando `R9-192` con `R9-193`** (en ese orden, un conflicto de `git apply --3way` en la rama
  `pending`, resuelto como `fromRead || (… || (más vieja && !isOwnCopy))`), se re-midieron las piezas
  de `R9-192` encima: P2 2 y P2dif 1, como antes; **P3 y FRD (el `fromRead` de la condición de la
  rama retenida, que la 31 dejó porque tumbaba 5) daban 0**. La rama B de `R9-193` (`pending`) y la
  A (retenida) ya toman por «suya» toda copia más vieja que no sea propia, y una copia leída tras un
  `removed` es más vieja que el piso por construcción. Los dos `fromRead` solo agregaban la copia
  PROPIA leída.
- **La sonda B2 de S31-A1 (`R9-196`) con P3 tal cual y los sellos:** sin fantasma en las tres
  variantes (`_scratch/S32-b2-combinado.out.txt`). No llega a P3: con L3 en cola, la guarda de
  `handleSnapshot` la toma antes y asienta por `isOwnCopy`.
- **La sonda nueva, `S32-sonda-frd.body.txt`:** la misma, pero con L3 DESCARTADA tras 8 rechazos
  (nada en cola). Con FRD, la variante ilegible da `lo mio 3 | lo mio 2`, persistido y de vuelta en
  cada reinicio; sin FRD, nada (igual que la legible). P3 no cambia nada ahí
  (`S32-frd-{base,FRD,P3,FRD,P3}.out.txt`). Es el vecino de `R9-196` con la escritura descartada en
  vez de en cola.
- **Decidido por la medición** (la decisión decía `fromRead && !isOwnCopy`, «o lo que la medición
  diga»): con `!isOwnCopy`, P3 es exactamente B, y FRD es exactamente A. Se quitan los dos, y el
  parámetro `fromRead` de `applyRemoteChange`. De vuelta, FRD tumba la prueba de la edición
  descartada y P3 da 0 (regla 37). Lo que P3 solo alcanzaba (una copia propia leída con el conflicto
  en memoria y nada en cola) necesita un re-enganche en la misma sesión: `register()` con el motor
  activo; ningún camino de producción lo produce.

### 3.2. `R9-197`: H3 sin `fromRead`

H3 de S31-A1 seguía como `fromRead`. Sin él, la rama retenida registra igual la copia leída del otro:
la guarda acaba de mover la marca a ella (`remoteTs === heldAt`). Con conflicto en memoria, como
antes (P2 refresca «su versión» y `continue`). P2 re-medida en la misma rama: sigue en 2.

### 3.3. `R9-194`: la clave con uid, vista caer

La prueba nueva de Ana y Beto es de mecanismo (la entrada nueva de Beto no lleva el reloj de Ana), y
su nombre lo dice. Sin el uid en la clave cae también la prueba vieja «R9-190: lo que el servidor le
tomó a Ana no hace «mía» una copia de Beto…», por la consecuencia: con `R9-193` su comentario decía
que ya no vigilaba eso, y con +Y vuelve a vigilarlo. Se le corrigió el comentario (corolario 44).

### 3.4. `R9-204`: la guarda de sesión tras re-sellar

C4 agrega un `await` a keepMine. El `isCurrent()` que le sigue daba 0 y no era equivalente (sin él,
un `stop()` durante la escritura local encola lo de Ana en la sesión de Beto, la clase de `R9-153`).
Se sumó keepMine al `it.each` de `R9-153` «con el apply local en vuelo al cambiar de cuenta»; sin la
guarda, lo de Ana cae en la nube y el cursor de Beto.

### 3.5. `R9-200`: el nombre

La prueba «R9-190: mi respaldo leído ANTES de que el servidor confirme…» ahora deja W2 en espera y
afirma lo publicado desde el reinicio: sin P1q cae por el fantasma, en memoria y en disco. Su nombre
dice ahora las dos cosas que mide.

## 4. La matriz entera

`_scratch/S32-matriz.cjs.txt`: la de la 30 (72 piezas), con alternativas de ancla para las que
cambiaron en esta sesión (corolario 41) y 37 piezas nuevas, leídas de los scripts de revert que las
midieron (`S32-A3-revert` y `S32-rev`). En un worktree aparte (`C:/projects/essb-s32m`,
`git worktree add --detach`, junction de `node_modules`), `NODE_ENV=development`, `S32_FULL=1`.
**Se corrió tres veces**, porque cada corrida cambió la punta:

1. **Sobre `e7d7fb8`** (los 11 arreglos; `S32-matriz-final.out.txt`), comparada con la de la 31
   (`S32-comparar.cjs.txt`): ninguna pieza viva bajó a 0 salvo **`S181-b`** (sin la copia en la
   marca de `R9-181`): 5 → 0. Con la rama A, `remoteTs === heldAt` no agregaba nada: **`R9-206`**,
   quitado en `bbe855e`. Las demás, iguales o con más caídas (la suite pasó de 178 a 209).
2. **Sobre `bbe855e`** (`S32-matriz-bbe855e.out.txt`, `S32-comparar2.cjs.txt`): **`S181-marca`** (el
   eco propio no mueve la marca) pasó de 8 a 0. Sus 8 pruebas caían por el fantasma que daba lo que
   `R9-206` quitó (la marca en una copia propia). La guarda no es equivalente: la marca es el piso tras
   reiniciar. Prueba nueva en `c1664a5` (§2, fila de `R9-206`). `S190-propia` bajó de 3 a 2 y sigue
   cayendo.
3. **Sobre `c1664a5`** (la punta; `S32-matriz-c1664a5.out.txt`, `S32-comparar3.cjs.txt`): igual a la
   segunda salvo `S181-marca` 0 → 1 y la pieza sin A 14 → 15 (la prueba nueva).

En la tercera, sobre 109 filas:

- **Caen todas las piezas vivas**, cada una por lo que su prueba dice (salida completa con
  `S32_FULL=1`).
- **En 0, y por qué:** `R104-7` y `R104-8`, como en la 31 (las cubren por tiempo los cortes de
  `R104-2`/`R104-4`); `+P3` y `+heldAt`, SUMAS de código quitado a propósito (volver a ponerlos no
  cambia nada: por eso se quitaron).
- **AUSENTES a propósito (8):** `G7` y `R104-5` (código que ya no existe, como en la 31);
  `S181-lectura` (el `fromRead ||` de la marca, quitado en `R9-192`); `S190-tomada` y `S190-stop`
  (`ownAcked` ya no existe: sus sucesores son `ack` y `stopSave` de `R9-193`, que caen 14 y 2);
  `S186-deteccion` (el `fromRead` retenido, quitado en `R9-196`; su suma `+FRD` cae 1); `S181-b`
  (quitado en `R9-206`; su suma `+heldAt` da 0); y `S32-A`, que en el árbol final es `S32-A206`
  (sin la rama A: caen 15).
- Las piezas de esta sesión, en la tercera: P2 2, P2dif 1, B 10, carry 3, tope 1, repetidos 1, qown
  3, ack 14, table 11, multi 2, load 10, prune 1, inflight 1, stopSave 2, uidKey 2, Fsettle 1,
  Fresolve 1, order 1, `+FRD` 1, H1c 1, H1cConf 1, H3cont 1, H3local 1, H3settle 1, H5 1, C4 2,
  C4cur 1, W 3, Npend 1, Ypush 2, Yset 2, Yuid 2, A206 15.
- El worktree se borró al terminar: junction con `.Delete()` primero, `git worktree remove` después.

## 5. `npm run validate`

Con `NODE_ENV=development` (la de Victor), tres veces, las tres verdes y con salida 0: sobre
`e7d7fb8` (`_scratch/S32-validate.out.txt`, 367/4482), sobre `bbe855e` (`S32-validate-final`,
367/4482) y sobre la punta, **`c1664a5` (`S32-validate-c1664a5.out.txt`)**: `tsc` limpio; `eslint` 0
errores y 70 avisos; `prettier --check` limpio (con los `.md` de este checkpoint); jest **367 suites
/ 4483 pruebas** (las 4451 de `main` más las 32 nuevas de la suite de sync), cero «failed to run».
Jest avisa que un worker no terminó limpio (no se investigó).

## 6. Lecciones

- **Al juntar dos arreglos, una guarda del primero puede quedar subsumida por el segundo** (P3 y
  FRD por las ramas A/B de los sellos). No es el corolario 42 (un arreglo desarma la prueba del
  otro), sino su inverso: las pruebas siguen en verde y la guarda sobra. Solo se ve re-midiendo las
  piezas del primero en el árbol combinado.
- **Quitar una guarda equivalente (regla 37) puede dejar sin caer a otra que solo se veía a través
  de ella.** `S181-marca` tumbaba 8 porque la marca en una copia propia daba un fantasma por
  `remoteTs === heldAt`; al quitarlo (`R9-206`), 0. La guarda seguía haciendo falta (la marca es el
  piso), y solo lo mostró volver a correr la matriz entera después del retiro. Tras una regla 37,
  matriz otra vez.
- **Una decisión que dice «X, o lo que la medición diga» no es una decisión de X.** La hipótesis
  (`fromRead && !isOwnCopy`) era equivalente a quitar la pieza.
- **Los heredocs del Bash tool halvan las barras invertidas, también dentro de Python:** un
  `\\u0000` llegó como `\u0000` y Python escribió dos NUL reales en `SyncEngine.ts` (lo delató
  `grep`: «Binary file matches»). Se corrigió antes del commit. Otra vez: scripts con barras, con la
  herramienta de edición.

## 7. Sondas y scripts

En `_scratch/` (todas con `.txt` al final):

- `S32-rev.cjs.txt`: revert por pieza sobre una base guardada (`--save`), para todas las piezas de
  esta sesión; `S32-rev192.cjs.txt` y `S32-rev192c.cjs.txt` (las de `R9-192`, sola y sobre
  `R9-193`); `S32-A3-revert.cjs.txt` y `S32-A3-piezas.cjs.txt` (los de A3 con `ROOT` al principal y
  la B sobre el árbol combinado);
- las tablas: `S32-r192-tabla`, `S32-r193-tabla`, `S32-r192-sobre-r193`, `S32-r196-tabla`,
  `S32-r195-tabla`, `S32-r197-tabla`, `S32-r199-tabla`, `S32-r200-tabla`, `S32-r204-tabla`,
  `S32-r189-tabla`, `S32-r174-tabla` y `S32-r194-tabla` (`.out.txt`);
- las sondas: `S32-sonda-frd.body.txt` y sus salidas `S32-frd-*.out.txt`; `S32-b2-combinado` y
  `S32-c4-base` (`.out.txt`, con el runner `S31-run.cjs.txt`);
- la matriz: `S32-matriz.cjs.txt` (lee las piezas nuevas de `S32-A3-revert` y `S32-rev`), sus
  salidas `S32-matriz-{final,bbe855e,c1664a5}.out.txt` (`final` es la de `e7d7fb8`) y sus logs
  `S32-matriz-run{,2,3}.log.txt`; los comparadores `S32-comparar.cjs.txt` (la 31 contra la primera)
  y `S32-comparar2.cjs.txt` (la primera contra la segunda);
- `R9-206`: `S32-r206-tabla.out.txt` (sin A) y `S32-r206-marca.out.txt` (`S181-marca` con su prueba);
- `validate`: `S32-validate.out.txt`, `S32-validate-final.out.txt` y `S32-validate-c1664a5.out.txt`;
- los scripts del ledger (`S32-bugs`, `S32-continuar`, `S32-index`, `S32-r206`, `S32-c1664a5`,
  `S32-memoria`; `.py.txt`, escritos con Write: nada de heredocs con barras).
