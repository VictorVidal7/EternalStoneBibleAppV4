# Sesión 37 (2026-10-01) — revisión del diff de la 36

**Modo:** solo terminal, sin tocar código de la app. Arrancó con `_scratch/S37-PROMPT.md` (vale más
que el mensaje (q) de `CONTINUAR.md`). A pedido de Victor, **7 agentes en worktree que solo
midieron** (pidió 4 y después 3 más), con la matriz entera en otro worktree al mismo tiempo. La
cuota se agotó antes del checkpoint, y el checkpoint lo escribió un chat nuevo, sin agentes, con
`_scratch/S37b-PROMPT.md`.

**Diff revisado:** `d15cd71..2bfbcf8` (`SyncEngine.ts` y `SyncEngine.test.ts`; 5 commits de la 36).

**Estado al empezar:** `main` = `origin/main` = `657e993` (la 36 y su checkpoint, mergeados y
pusheados). CI verificado EN EL LOG: run `36826643083`, 3 jobs verdes, Node v24.21.0, 368/4508.

**Resultado:** 14 hallazgos nuevos, todos P3, `R9-220`..`R9-233`. Ningún P0, P1 ni P2. La matriz
entera da 136 de 136 piezas iguales a la 36. Hallazgos: **233**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Los agentes**, cada uno en su worktree sobre `657e993` (comprobado con `cmp` contra
  `S36-SyncEngine-base.ts.txt`), con informe incremental en `_scratch/S37-A<n>-informe.md.txt` y sus
  sondas y salidas con el prefijo `S37-A<n>-`:
  - **A1:** la guarda de `handleSnapshot` con la copia leída, y las entregas legítimas del mismo reloj
    en otro objeto (`R9-216`);
  - **A2:** los residuos de `R9-216` (el reloj sin eco), su memoria, y `R9-217`;
  - **A3:** `R9-218` (`ownGaveUp` entre sesiones), `R9-215` y `S32-load`/`S32-table`;
  - **A4:** los comentarios de la 36 y sus 7 pruebas, con las 10 piezas re-medidas;
  - **A5:** `R9-216` por los caminos que nadie más medía (caché, `resolveConflict`, cuenta, CPU);
  - **A6:** `R9-217` por los caminos de la cola;
  - **A7:** bucles y escrituras colgadas de `R9-218`/`R9-215`.
- **A5, A6 y A7 cerraron antes de tiempo** por el límite de uso, de forma ordenada, tras un
  SendMessage de «cerrá ya». Lo que dejaron sin medir está al final de su informe y en §5.
- **La matriz entera** (`S36-matriz.cjs.txt`) en `C:/projects/essb-s37-matriz` (borrado, la junction
  primero): `_scratch/S36-matriz-s37-657e993.out.txt`. Comparada con la de la 36 en
  `S37-comparar-s36.out.txt`: **136 de 136 piezas iguales**, control 0/232. Los 7 agentes corrían a la
  vez, y la carga no metió caídas falsas.
- La consolidación de los 7 informes está en `_scratch/S37-consolidado.md.txt`.

## 2. La verificación del checkpoint (el chat nuevo, en el árbol principal)

Cada hallazgo se cotejó con su salida `.out.txt`. Se re-corrieron en el árbol principal solo las
dos que pedía el prompt, más una tercera, porque una sola corrida bastaba para decir de dónde viene
`R9-223`. Herramientas: `S31-run.cjs.txt` y `S34-rev.cjs.txt` (con
`S32_BASE=S36-SyncEngine-base.ts.txt`, `S34_PIEZAS=S36-piezas.cjs.txt`). Tras cada `--restore`:
`git status` limpio, `cmp` igual a la base, NUL 0, y `__tests__/S31sonda.test.ts` borrado a mano.

- **`R9-221`:** `S37b-frescos-suite.cjs.txt` (la de A1 con `ROOT` en el árbol principal). La suite
  con copias frescas da **232/232** (`S37b-frescos-suite.out.txt`). Con `R216cola` revertida, la
  sonda `S37-A1-rendirse` da `trasRendirse []` con el mock tal cual
  (`S37b-rendirse-sinR216cola.out.txt`) y `[["wb mio","wa mio"]]` con copias frescas
  (`S37b-frescos-rendirse-sinR216cola.out.txt`). Igual que A1.
- **`R9-222`, ruta (a):** `S37-A2-sonda-sineco` tal cual (`S37b-sineco.out.txt`): en `stop`, la rama
  `pending` deja «su versión» en `lo suyo` (local `lo suyo`, nube `w1 mio`), y la retenida se asienta
  en silencio (marca `null`). Con `R216same` revertida (`S37b-sineco-sinR216same.out.txt`), las dos
  dan el control. Igual que A2.
- **`R9-223`:** `S37-A5-sonda-cola` con `R216own`, `R216note` y `R217` revertidas juntas
  (`S37b-A5cola-sin36.out.txt`): las 4 líneas son iguales a las de A5 sobre la 36. Ya existía.

## 3. Los hallazgos

Agrupados por mecanismo como en el consolidado: no hizo falta reagrupar. `R9-222`, `R9-223` y
`R9-224` dan el mismo daño (el de `R9-216`), pero por tres ramas distintas de `isOwnCopy`: el eco
anotado, la entrada en cola y `ownStamps`. Cada una se arregla por separado.

| #        | origen         | qué                                                                                                                        | ¿de la 36? (medido)                                                       |
| -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `R9-220` | A1-1, A5-1     | la copia de la nube de mi última escritura, re-entregada en otro objeto, deja de ser mía: «wb mio / wa mio»                | en el mismo proceso sí (`R216own`, `R216note`); tras reiniciar ya existía |
| `R9-221` | A1-2, A5       | el mock entrega el mismo objeto en las re-entregas, y RNFirebase uno nuevo                                                 | infraestructura anterior; la 36 la expone                                 |
| `R9-222` | A2-1, A4-2, A6 | `noteEcho` toma por eco la primera copia con mi reloj: si el eco no pasó, el respaldo del otro                             | (a) y (b) ya existían (`R216own`); la (c) la abrió `R9-217` (`R217`)      |
| `R9-223` | A5-2           | con una edición en cola que lleva el reloj de W1 en `own`, el respaldo del otro con W1 es «mío»                            | ya existía (`R216own,R216note,R217`, medido por la 37b)                   |
| `R9-224` | A2-2           | la rama de `ownStamps` no mira el eco; con los sellos en disco, también tras reiniciar                                     | ya existía (`R216own,R217,R216note`)                                      |
| `R9-225` | A2-3           | `recentEchoed` guarda copias enteras y no se vacía nunca (~670-910 B por doc, ×17)                                         | de la 36 (la estructura)                                                  |
| `R9-226` | A6-2, A3-k1    | misma cuenta, sesión nueva: la edición escrita antes de enganchar no lleva el sello; y la prueba que falta                 | ya existía (`R217`); `R217guard` lo deja fuera                            |
| `R9-227` | A6-1           | una edición posterior DESCARTADA con la tabla ilegible: «d mio 3 contra d mio 2» al reiniciar                              | ya existía (`R217`, `R217guard`)                                          |
| `R9-228` | A3-k3, A7      | AsyncStorage nativo es serial: la prueba de `R9-215` solo cae con un orden imposible; la guarda quitada no era equivalente | de la 36 (la prueba y la guarda)                                          |
| `R9-229` | A3-k2, A7-2    | nada fija que `stop()` vacíe `ownGaveUp`, ni dos tablas que fallen siempre                                                 | de la 36 (las pruebas)                                                    |
| `R9-230` | A4-1, A4-8     | la regla de `R9-190` sigue sin la excepción de `R9-219`; `+heldAt` tumba 5, no 4                                           | de la 36 (el texto)                                                       |
| `R9-231` | A4-3           | corolario 48: la prueba de `R9-218` mira doc-b y calla que el sello de Wa no llega a disco                                 | de la 36 (la prueba)                                                      |
| `R9-232` | A4-4, A4-5     | la prueba de memoria dice «el de la última» (es w4) y cae por su control con `R216note`/`R216cola`                         | de la 36 (la prueba)                                                      |
| `R9-233` | A4-6           | `PendingWrite.own` dice «lo que reemplazó», y lleva relojes ya tomados                                                     | en parte anterior (`R9-194`); la 36 lo amplió                             |

El detalle de cada uno (qué se ve, la sonda, la pieza revertida y lo que da) está en `BUGS.md`.
Las correcciones de textos viejos van en sus entradas: en `R9-216`, «sigue respondiendo para
cualquier copia» (responde por la primera) y «el de la última» (es w4); en `R9-219`, «`+heldAt` ya
tumba 4» (son 5 en `2bfbcf8`).

**El orden para la 38:** `R9-221` primero. Con el mock arreglado, cada prueba de `R9-216` se
re-mide con su pieza revertida antes de tocar el motor. Después, `R9-220` y `R9-222`, que son la
misma pregunta: cuándo deja de valer un eco anotado.

## 4. Sin daño (medido)

- **La guarda de `handleSnapshot` con la copia leída** (A1, `S37-A1-guarda`): con una copia mía no
  se alcanza por un camino natural. Con el respaldo del otro, la 36 hace lo mismo que en la rama
  `pending` (la marca y «su versión» pasan al respaldo). Antes de la 36, la marca se soltaba con una
  «su versión» vieja, y el conflicto desaparecía tras reiniciar: la 36 arregló también esta rama, sin
  prueba. Si se quiere vigilar, la prueba es `S37-A1-guarda` con `memoria=true`.
- **`ownGaveUp` entre sesiones y cuentas** (A3): `stop()` lo vacía de forma síncrona con el `force`.
- **Sin bucle caliente con la 36** (A7-1: 4 tablas, 8 combinaciones, delta 0 en silencio). La 36
  bajó las escrituras ×4 respecto de `R218`.
- **«El último» sello de `R9-217`** (A2, `S37-A2-sonda-r217a`) es el último ack, también con el reloj
  vuelto atrás, y no da conflicto al reiniciar.
- **La entrada reemplazada conserva el sello** (A6, punto 1), también tras keepTheirs o keepMine.
- **`S32-load`/`S32-table`** dan lo mismo que en la 36 (A3: 14 y 22; las 3 pruebas vuelven a caer con
  `R217`).
- **Las 10 piezas de la 36** dan los mismos conteos que en la 36 (A4), y cada prueba cae por la
  aserción que promete, salvo la de memoria (`R9-232`). El comentario de `fantasmaC` es verdad entero.
- **El mismo doc dos veces en un lote, o un `modified` sin cambio de datos:** el SDK no los produce
  (el motor no pide `includeMetadataChanges`, y `docChanges()` filtra los cambios de solo metadatos).
- **El reloj de `R9-216` con dos escrituras que «el SDK junta»** (A2, modo `junta`): las junta el
  motor en la cola, y W1 no llega nunca a la nube. No hay copia con su reloj.

## 5. Sin medir

- **A5:** `R9-223` en un proceso nuevo; la divergencia entre el ack y la caché del mismo reloj (por
  lectura, el síntoma de `R9-207` solo con un escritor de otra versión de la app); keepMine (que su
  eco se anote); el cambio de cuenta en `noteEcho` (por lectura, sin camino); la CPU de `noteEcho`
  (un `queue.find` más por doc entregado; el peor caso es el primer enganche con miles en cola).
- **A6:** keepMine con nada en cola, cuya entrada pasa la guarda de `R9-217` y lleva el sello a
  `recentAcked` (la ruta (c) de `R9-222`, como hipótesis); un respaldo del otro con d2 mientras la
  entrada resuelta espera en cola; `stop()` con la entrada en vuelo al cambiar de cuenta; Ana y Beto
  en otra colección (leído, sin camino).
- **A7:** las escrituras que no salen con una relectura colgada (por lectura: en Android el
  `SerialExecutor` también cuelga el `multiSet` siguiente, así que el mock por clave da un orden
  imposible); AsyncStorage lleno (el techo de 6 MB, `R9-52`).
- **A1:** las otras llamadas a `isOwnCopy` con la misma raíz que `R9-220` (piden la cadena ocupada de
  `R9-207` más una entrada descartada); el eco que sale como `removed` y pasa por la guarda (es la
  ruta (b) de `R9-222`).

## 6. Las lecciones

- **Una propiedad del mock que el arreglo usa por primera vez hay que compararla con el SDK antes
  de medir nada.** La 36 decidió por la identidad del objeto, y el mock entrega el mismo objeto donde
  RNFirebase arma uno nuevo: las pruebas pasaban por una identidad que el teléfono no da (`R9-221`).
- **«Un reloj sin eco responde por cualquier copia» era una afirmación, y medida era otra cosa:**
  responde por la primera copia que llega con ese reloj, y esa puede ser el respaldo del otro
  (`R9-222`).
- **El orden de AsyncStorage también es del SDK** (corolario 39, fuera de Firestore): la prueba de
  `R9-215` y la guarda quitada por equivalente dependían de un orden que el teléfono no produce
  (`R9-228`).
- **7 agentes a la vez más la matriz agotaron la cuota antes del checkpoint.** Victor: «no debí
  solicitar más agentes».
