# Sesión 44 (2026-10-02) — arreglos de lo de la 43

**Modo:** solo terminal, sin agentes. Arrancó con `_scratch/S44-PROMPT.md` (vale más que el mensaje
(x) de `CONTINUAR.md`).

**Estado al empezar:** `main` = `origin/main` = `a731c23` (el checkpoint de la 43, mergeado y
pusheado; CI verde en el log, run `37063248540`, 368/4532). El último código era `1a77b78`, y
`_scratch/S42-SyncEngine-R243.ts.txt` es su motor (comprobado con `cmp`). Los docs del repo decían
«sin mergear» para la 43: este checkpoint lo corrige.

**Rama:** `fix/s44-arreglos-s43`, 7 commits (`3e35415`..`c429604`), un commit por hallazgo:

| Commit    | Hallazgo | Qué                                                                          |
| --------- | -------- | ---------------------------------------------------------------------------- |
| `3e35415` | `R9-246` | las dos pruebas (de `S43-1` y `S43-5`), sin tocar el motor                   |
| `dd6c015` | `R9-245` | una copia mía no entra ni es conflicto con una escritura mía en la cola      |
| `1400cb9` | `R9-246` | el tipo del payload en la prueba de la lectura (`tsc`)                       |
| `bba4ab0` | `R9-247` | la reversión que sale de la query retira al llegar si nada está bajo el piso |
| `4134635` | `R9-248` | la reversión de un rechazo que descarta sigue siendo mía al llegar           |
| `d200ed1` | `R9-249` | el ack de la subida reemplazada vale también después de un `stop()`          |
| `c429604` | `R9-250` | solo el comentario de `ownRetired`                                           |

**Resultado:** 6 cerrados (`R9-245`..`R9-250`). 1 nuevo, `R9-251` (P3: la guarda `ownUnread` de
`R9-247`, sin una prueba que la vea decidir). Hallazgos: **251**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Herramientas** (en `_scratch`): las piezas en `S44-piezas.cjs.txt` (reexporta las de la 43).
  Cada pieza que revierte un arreglo va escrita sobre la base de SU commit:
  `S44-SyncEngine-R245.ts.txt`, `-R247`, `-R248`, `-R249` y `-R250` (el motor de cada commit). Las
  sondas nuevas: `S44-sondas1..3.body.txt`. La matriz: `S44-matriz.cjs.txt`, hecha por
  `S44-mkmatriz.cjs.txt` con el bloque `S44-matriz-bloque.txt`.
- **Cada prueba, vista caer** con su pieza revertida sobre la base de su commit, en la suite de
  sync entera (`S34-rev`), por la consecuencia (conflictos, «su versión», local, nube) y con su
  control (+1 ms, o el caso vecino) en la misma aserción. Tras cada corrida: `cmp` igual, NUL 0 y
  `git status` limpio.
- **Dos tropiezos:**
  - la prueba de la lectura de `R9-246` entró con un error de tipos (`q.data.value`): lo vio
    `tsc` en el commit siguiente, y se arregló en su propio commit (`1400cb9`);
  - las piezas de `R9-247` se agregaron con un heredoc con barras (contra la regla). Se verificó en
    el archivo que los `\n` quedaron intactos, y las anclas casan (el «diff del revert» de cada
    corrida). Las siguientes se escribieron con Edit.

## 2. Los arreglos

### 2.1 `R9-246`: las dos pruebas (`3e35415`)

- **La guarda de memoria** (de `S43-5`): cae con `R234mem`. Tras reiniciar, el conflicto desaparece
  y la marca se va.
- **La retirada de la lectura** (de `S43-1`): caía con `R238hoy`. Después la perdió `R9-247` (ver
  2.3).

### 2.2 `R9-245` (`dd6c015`), con `H43propia`

- **Confirmado contra `R9-190`:** su prueba espera, tras reiniciar, ningún conflicto y la marca
  asentada cuando la copia es mi propio respaldo; `H43propia` asienta igual.
- **Corolario 53, ¿qué otras copias mías más nuevas que lo local llegan con una escritura en la
  cola?** Solo las produce una escritura con reloj viejo. `keepMine`, `merge` y `keepTheirs` vuelven
  a sellar con `now`. Queda el respaldo restaurado: su reversión, y la reentrega tras reiniciar. Lo
  que llega por la lectura de un `removed` lo toma antes la guarda de `handleSnapshot`. Un vecino
  leído, sin medir: una copia del OTRO más nueva que mi respaldo en la cola entra por LWW, y el
  respaldo sube encima. Es `R9-126` (pendiente).
- **La prueba:** las dos ramas, con el reinicio y el reintento. El control es el mismo respaldo
  aceptado a la primera, y los dos tienen que terminar igual. Cae con `R245` por lo local («w1 mio»)
  y por el conflicto «mi respaldo | w1 mio».

### 2.3 `R9-247` (`bba4ab0`), con `H43suelo`

- **El piso, en el motor:** `queryFloors`, por colección, que `attachListener` fija con la query
  antes de suscribirse; 0 con la consulta sin filtro de respaldo. Sin piso, no retira. **No se borra
  en `stop()`:** el `clear()` dio 0 (`R247stop`) y es equivalente por construcción. Una entrega que
  llega después de un `stop()` lee `uid` nulo, y ninguna anotación de rechazo casa.
- **La tabla de sellos sin leer:** decide la lectura (guarda `ownUnread`). Ver 2.7 y `R9-251`.
- **Medido:** la prueba (de `S43-2`, con la cadena ocupada) cae con `R247` y con `R247piso`.
  `R9-190` cae si la reversión retira también con un reloj bajo el piso (`R247siempre`). La prueba
  de `R9-243` con la cadena ocupada pasa.
- **Corolario 51, en vivo:** con este arreglo, la reversión retira al llegar también con la cadena
  libre, y la prueba de la lectura de `R9-246` dejó de caer con `R238hoy`. Esa prueba pasó a vigilar
  las dos retiradas juntas (cae con `R247,R238hoy`). La lectura sola la vigila una prueba nueva, de
  `S44-1`: el `removed` sintético de `R9-186` no trae copia, así que la llegada no retira nada. El
  proceso anterior murió con el sello de W3 en la tabla y la marca de relectura, y el enganche lee
  R2. Cae con `R238hoy`: «su versión» sigue «r2 suyo» con la nube en «w3 mio».
- El otro caso que la 42 leyó para la lectura sola (el eco de mi escritura que saca el doc de la
  query, leído después del ack) no da daño visible: tras ese ack, el único reloj mío es el suyo
  (`R9-239`), bajo el piso, y un respaldo con él no llega por la query.

### 2.4 `R9-248` (`4134635`), con `H43drop`

- La prueba (de `S43-3`; el control es el rechazo de siempre) cae con `R248`.
- **Con la cadena ocupada** (`S44-3`): hoy, las cuatro variantes salen limpias. Con `R248`,
  `descarta` da el daño con las dos cadenas. `R247,R248` da lo mismo que `R248`.
- **Juntas (corolario 50):** `R247,R248` tumba las dos pruebas en la suite.

### 2.5 `R9-249` (`d200ed1`), con `H43aparcada`

- Sin el `isCurrent()`, como el `splice` de al lado. El comentario de `PendingWrite.own` lo dice.
  La prueba (de `S43-6`) cae con `R249` por el conflicto.

### 2.6 `R9-250` (`c429604`)

- Solo el comentario de `ownRetired`, como prefería Victor. No se midió un orden con daño, así que
  lo que se anota no cambió.

### 2.7 Lo nuevo: `R9-251`

- La guarda `ownUnread` de `R9-247` da 0. `S44-2` (la prueba de `R9-190` en un proceso nuevo con la
  tabla ilegible) muestra el mecanismo: con la guarda, `ownRetired` queda en [W0]; sin ella, en
  [W2, W0]. Pero no muestra daño: la relectura no corre en la sesión, y el eco de W2 asienta la
  marca antes. Se queda con el porqué escrito, como `R234mem` en la 42.

## 3. La matriz entera

En un worktree aparte (`C:/projects/essb-s44m`, en `c429604`, con la junction a `node_modules`;
borrado al terminar, la junction primero), con `S44-matriz.cjs.txt`. Salida:
`_scratch/S44-matriz-s44-c429604.out.txt`; comparación con la de la 42:
`S44-comparar-s42.out.txt`.

- **157 piezas, control 0/264.** Ausentes, las 8 de siempre. Cuatro anclas de la 42 que cambiaron
  los arreglos se rehicieron con una alternativa (`S44-matriz-bloque.txt`): `S42-R242` (el ack sin
  `isCurrent()`), y `S42-R243`, `S42-R243rev` y `S42-R243vuelo` (el bloque del `removed` en
  `noteArrived`).
- **Contra la de la 42, 108 de 157 iguales.** Las 7 nuevas: `R245` 2, `R247` 1, `R247piso` 1,
  `R247unread` 0 (`R9-251`), `R247siempre` 2, `R248` 1, `R249` 1. Casi todas las demás suben por
  las pruebas nuevas.
- **De 0 a 1:** `S40-R238` y `R234mem`, que es lo que cerraba `R9-246`.
- **Bajan dos viejas (corolario 46):**
  - `S32-W` (la ventana sin `isOwnCopy`, 9→6): dejan de caer las pruebas de `R9-189`, `R9-174` y
    `R9-194`;
  - `T-tomb` (una lápida remota no se aplica, 3→2): deja de caer la de `R9-176`.

  En esas cuatro, mi copia llega con una escritura mía del doc en la cola, que ahora toma
  `R9-245` antes de la ventana y del LWW. **Medido juntas (corolario 50):** `R245,S32W` vuelve a
  tumbar las tres (11 en total) y `R245,Ttomb` la de `R9-176` (5)
  (`_scratch/S44-rev-R245+S32W.out.txt`, `S44-rev-R245+Ttomb.out.txt`). Ninguna baja a 0: las dos
  siguen decidiendo solas en sus otras pruebas.

- **En 0:** `R104-7`, `R104-8` y `S32-+P3`, como en la 42; y `R247unread` (`R9-251`).

## 4. Pendiente

- `R9-251` (buscar un orden con daño para la guarda `ownUnread`, o quitarla).
- `R9-240` (Modo C, con el OK de Victor), con los órdenes de su nota de la 42.
- Lo demás, como en el (x): `R9-235`, `R9-241`, `R9-211`..`R9-214`, `R9-201`..`R9-203`, `R9-198`,
  `R9-205`, `R9-177`, `R9-38`, `A12`, `R9-164`, `R9-127`, `R9-173`, `R9-126`, `R9-133`.

## 5. Las lecciones

- **Un arreglo de la sesión puede quitarle el caso a la prueba que la misma sesión acaba de
  escribir** (corolario 51, en vivo). La prueba de la lectura de `R9-246` dejó de caer con su pieza
  dos commits después, con `R9-247`. Re-medir las piezas de los commits anteriores tras cada
  arreglo, no solo al final.
- **Una guarda que se agrega por un veredicto incierto también se mide.** La de la tabla ilegible
  de `R9-247` evita una decisión que no se puede tomar sin la tabla, y su revert no tumba nada: el
  mecanismo se ve, pero el daño no se construyó.
- **«Equivalente por construcción» se razona con la cadena entera.** El `clear()` del piso en
  `stop()` parecía higiene. Una entrega tardía lee `uid` nulo, ninguna anotación casa, y nunca
  llega a leer el piso.
