# Sesión 43 (2026-10-02) — revisión del diff de la 42

**Modo:** solo terminal, sin agentes y sin tocar código. Arrancó con `_scratch/S43-PROMPT.md` (vale
más que el mensaje (w) de `CONTINUAR.md`).

**Estado al empezar:** `main` = `origin/main` = `7139708` (el checkpoint de la 42, mergeado y
pusheado; CI verde en el log, run `37057170965`, 368/4532). El último código es `1a77b78`, y
`_scratch/S42-SyncEngine-R243.ts.txt` es su motor (comprobado con `cmp`, igual que
`S40-SyncEngine-R236.ts.txt` con el de `e9d6e89`). Los docs del repo decían «sin mergear» para la
42: este checkpoint lo corrige.

**Diff revisado:** `2d8eb49..1a77b78` (`SyncEngine.ts`, `types.ts` y `__tests__/SyncEngine.test.ts`).

**Resultado:** 4 nuevos, todos P3: `R9-247`, `R9-248` y `R9-249` ya existían (medidos con el
motor de `e9d6e89`), y `R9-250` es de la 42 (un comentario, sin daño construible). `R9-245`,
diagnosticado y medido el reintento. `R9-246`, con un orden para cada guarda en que decide sola
(las pruebas que faltaban). Hallazgos: **250**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Herramientas** (en `_scratch`): las piezas en `S43-piezas.cjs.txt` (reexporta las de la 42):
  `R238hoy` (la lectura de un `removed` no retira: la de `S40-R238` con el ancla de hoy), el log
  `L43llega`, y cuatro hipótesis (`H43suelo`, `H43drop`, `H43aparcada`, `H43propia`).
  `S43-motor.cjs.txt` es `S41-motor` restaurando `S42-SyncEngine-R243.ts.txt`. Las sondas, en
  `S43-sondas1.body.txt`..`S43-sondas7.body.txt` (la 4 y la 5 las hacen `S43-mk4.cjs.txt` y
  `S43-mk5.cjs.txt` desde `S42-sondas2.body.txt`). Salidas: `S43-*.out.txt`.
- **Cada sonda, con su control** (+1 ms, el reloj del otro; o el caso vecino) dentro del mismo
  `it`, cada pieza vista aplicada («aplicadas» de `S38-sonda`, o el «diff del revert» de `S34-rev`),
  y cada «¿de la 42?» medido con el motor de `e9d6e89`. Tras cada corrida: `cmp` igual, NUL 0 y
  `git status` limpio.
- **Un tropiezo:** la pieza `H43drop` se agregó con un heredoc con barras (contra la regla). Se
  verificó: las tres anclas nuevas casan una vez contra el motor de hoy.

## 2. Las preguntas

### 2.1 `rejectedAwaitingRevert` (`R9-243`)

- **Entre el rechazo y su reversión no llega otra entrega del doc.** En el mock, la reversión se
  agenda (`setImmediate`) antes del `throw`, y un `__fire` con la escritura en vuelo queda tapado
  por ella (`viewChange`). En el SDK web, el callback del usuario va antes que los eventos, y con la
  escritura encima (un payload completo con `{merge: true}`) la vista no cambia. Queda el puente de
  RNFirebase (`R9-240`).
- **La reversión misma puede traer un cambio del otro:** si R2, bajo el piso, llegó al servidor con
  mi W2 en vuelo, la reversión vuelve a R2 y sale como `removed` con W2 (mi payload rechazado). El
  motor la toma por la reversión y no retira al llegar. Con la cadena libre retira la lectura, que
  encuentra R2 (`S43-1`); con la cadena ocupada, el respaldo del otro con W1 llega antes de esa
  lectura y pasa por «mío»: **`R9-247`** (`S43-2`).
- **Una anotación que no se consume:** una reversión `modified` la consume (y la copia se juzga como
  antes). Si el payload rechazado era igual a la nube, el SDK no levanta nada y la anotación espera:
  un `removed` del otro que trajera esa copia no retira al llegar, y decide la lectura (la forma de
  `S43-1`; con la cadena ocupada, la de `S43-2`). Con un `stop()` en medio, el listener nuevo
  entrega el doc como `added` antes que cualquier `removed`, y eso la consume; con otra cuenta, la
  clave se queda (sin efecto).
- **Las dos anotaciones juntas** (un rechazo que DESCARTA la escritura): **`R9-248`** (`S43-3`).

### 2.2 La retirada al LLEGAR de un `removed`

- **`reviewEvents` sí tiene listener** (`registerOfflineAdapters.ts:19`). `cleanupOldReviewEvents`
  borra docs de más de 12 meses; con el piso en 0 (el primer enganche) están en la query, y cada
  borrado llega como `removed` sin nada en vuelo: retira los relojes de un doc que ya no existe. Sin
  daño, y antes de la 42 igual (`isOwnCopy` decía que no).
- **El intervalo entre `pushing` y el eco:** el eco sale al emitir la escritura, y `pushing` se
  limpia después del ack, así que en el SDK (y en el mock) el eco llega antes. Pero `stop()` limpia
  `pushing` con la subida en vuelo: si la escritura sale después del enganche nuevo (detrás de una
  lectura, `R9-177`), su eco llega sin nada en vuelo y retira, siendo mío. Leído: lo que retira son
  relojes que la nube ya dejó atrás por esa escritura, y la entrada sigue en la cola (su copia es
  mía). Sin daño construido.
- **¿Un `removed` del otro con mi escritura en vuelo? No, por lectura:** la vista lleva mi payload
  completo encima, y la escritura del otro no la cambia; con un campo de una versión más nueva sale
  `modified`, no `removed`. El puente, sin medir (`R9-240`).

### 2.3 `ownRetired` (`R9-234`)

- **El respaldo que el otro restaura con mi reloj después de una copia suya con la app cerrada (la
  forma de `R9-237`):** el único reloj que la tabla puede devolver es el del último ack (`R9-239`), y
  un respaldo con ese reloj trae mis datos. Es el límite por diseño de `R9-239` (un respaldo con el
  último reloj no se distingue de mi copia). Sin daño nuevo.
- **La retirada de la lectura también anota,** y bien: anota la copia leída (la del otro). **La
  retirada al llegar de `R9-243` anota la copia que TRAE el `removed`** (la última que casaba, a
  menudo mía y con su reloj en la tabla), y la relectura la toma por la retirada equivocada de
  `R9-230`. Sin daño construible: **`R9-250`**.
- **`R234mem` decide sola** en el orden de `R9-230`: el enganche entrega MI W3, que la tabla ilegible
  no deja reconocer (la entrada de L4 sin `own`), y la retira; L4 sube antes de la relectura (sello
  [L4]); el otro restaura W3. Sin la guarda, la relectura une [W3, L4] (`S43-4`); con keepTheirs no
  se ve nada («su versión» ya es W3), pero tras reiniciar el conflicto desaparece en silencio: local
  «lo mio 4», nube «w3 mio» (`S43-5`). Con la guarda, y con el control, el conflicto sigue. Es la
  prueba que le faltaba (`R9-246`). El motor de `e9d6e89` da el daño (es el de `R9-234`).

### 2.4 `H41own` (`R9-242`)

- **La entrada aparcada tras un `stop()` con la subida en vuelo:** medido, **`R9-249`** (`S43-6`).
  Ya existía (es el daño de `R9-242`, que la 42 cerró solo dentro de la sesión).
- **Qué más lee el `own`:** `isOwnCopy`, `retireOwn` (lo borra), `upsertQueueEntry` (la entrada que
  reemplaza pliega el `own` y el reloj de la reemplazada) y `persistQueue`. Después del ack, una
  edición nueva pliega [W1] y el reloj de W2, que nunca llegó a la nube: sin efecto.

### 2.5 `R9-246`

- **La retirada de la lectura decide sola** en `S43-1`: sin ella (`R238hoy`), `recentAcked` sigue en
  [W1] y el respaldo del otro con W1 pasa por «mío» (sin conflicto); hoy, y en el control, el
  conflicto «w2 mio» contra «w1 mio». Las dos guardas se quedan, cada una con su sonda.
- El `removed` sintético de `R9-186` no se construyó: con `S43-1` alcanza.

### 2.6 `R9-245`, diagnosticado

- **Una premisa, dos efectos:** «una copia local con una escritura mía en la cola es más nueva que
  cualquier copia de la nube». Un respaldo restaurado lleva el `updatedAt` del archivo, más viejo.
  - Con el conflicto retenido, tras reiniciar, la rama del conflicto retenido de `applyRemoteChange`
    (`SyncEngine.ts:1973`) toma una copia más nueva que lo local sin preguntar
    `isOwnCopy` («más nueva: el otro siguió escribiendo», `R9-160`): W1 es mía (el sello está en la
    tabla y en el `own`) y aparece «mi respaldo» contra «w1 mio».
  - Sin conflicto, LWW aplica W1 encima del respaldo restaurado con su entrada esperando.
- **El reintento** (`S43-7`): sin conflicto, W0 llega a la nube y quedan local «w1 mio» y nube «mi
  respaldo», para siempre y en silencio. Con conflicto, local y nube terminan en «mi respaldo» y el
  conflicto «mi respaldo | w1 mio» sigue, con una «su versión» que no está en ningún lado.
- **Hipótesis medida (`H43propia`):** una copia MÍA que llega con una escritura mía del doc en la
  cola no se aplica ni es conflicto (como `ownQueued` con la copia leída, `R9-176`). Cierra los dos
  casos (local y nube en «mi respaldo», sin conflicto) y la suite de sync pasa 256/256.

### 2.7 Las pruebas y los comentarios

- **Las de `R9-242`:** la comparación con el control, en la misma aserción. El «sin red» es el de
  `NetInfo` (el motor no vuelve a subir), no el del SDK (que no confirmaría sin conexión): el ack
  llega y la entrada espera hasta el próximo flush. Válido.
- **La de `R9-234` y las de `R9-243`:** construyen lo que dicen, en órdenes que el SDK da. La de la
  excepción «en vuelo» mira solo la sesión: tras un reinicio, el mismo caso da `R9-245`.
- **La de `R9-160` reescrita:** los dos ecos llegan `modified:echo`, cada uno con su escritura en
  vuelo; es el orden del SDK, y la decide `ownArrived` (cae con `Q41llegada`, medido en la 42).
- **Los comentarios:** el de `ownRetired` (`R9-250`); el de `rejectedAwaitingRevert` («a write of
  this device, not a change of the other one»: la reversión puede volver a una copia del otro,
  `R9-247`); el de `PendingWrite.own` en `types.ts` («or the server takes the one in flight»: no
  después de un `stop()`, `R9-249`); y el de `noteArrived` («a write of the other device … or a
  delete»: también mis borrados de `reviewEvents` y el eco tras un `stop()`, sin daño).

## 3. Los nuevos

- **`R9-247`:** la reversión de un rechazo que vuelve a una copia del otro bajo el piso; con la cadena
  ocupada, el respaldo con mi último reloj pasa por «mío» (`S43-2`). Ya existía. Hipótesis
  `H43suelo`.
- **`R9-248`:** la reversión de un rechazo que DESCARTA la escritura llega «no mía», retira el sello
  de mi respaldo y la lectura le pasa la marca: «lo mío contra lo mío» (`S43-3`). Ya existía.
  Hipótesis `H43drop`.
- **`R9-249`:** lo que queda de `R9-242` tras un `stop()` (`S43-6`). Ya existía. Hipótesis
  `H43aparcada`.
- **`R9-250`:** `ownRetired` anota, desde la retirada al llegar, el reloj de la copia que trae el
  `removed`. De la 42, sin daño construible.

## 4. Las hipótesis, medidas (sin la matriz)

| Pieza         | Sonda que cierra | Suite de sync | Archivo                                    |
| ------------- | ---------------- | ------------- | ------------------------------------------ |
| `H43suelo`    | `S43-2`          | 256/256       | `S43-12-H43suelo`, `S43-rev-H43suelo`      |
| `H43drop`     | `S43-3`          | 256/256       | `S43-3-H43drop`, `S43-rev-H43drop`         |
| las dos       | `S43-1`..`S43-3` | 256/256       | `S43-123-juntas`, `S43-rev-juntas`         |
| `H43aparcada` | `S43-6`          | 256/256       | `S43-6-H43aparcada`, `S43-rev-H43aparcada` |
| `H43propia`   | `S43-7`          | 256/256       | `S43-7-H43propia`, `S43-rev-H43propia`     |

Ninguna tumba nada de la suite: ninguna prueba vigila lo que cambian. La 44 escribe la prueba de
cada una (de su sonda, con el control en la misma aserción) y corre la matriz entera.

## 5. Sin hacer y pendiente

- Arreglar `R9-245` y `R9-247`..`R9-250`, y convertir en pruebas `S43-1` y `S43-5` (`R9-246`).
- `R9-240` (Modo C, con el OK de Victor), con los órdenes de su nota de la 42.
- Lo demás, como en el (w): `R9-235`, `R9-241`, `R9-211`..`R9-214`, `R9-201`..`R9-203`, `R9-198`,
  `R9-205`, `R9-177`, `R9-38`, `A12`, `R9-164`, `R9-127`, `R9-173`, `R9-126`, `R9-133`.

## 6. Las lecciones

- **Una reversión es también una entrega de la nube.** Vuelve a la copia que el servidor tiene, y
  esa copia puede ser del otro: una excepción que mira lo que trae el `removed` (mi payload) exime
  también la escritura del otro que viene con él (`R9-247`).
- **Una escritura que el rechazo descarta deja de ser «mía» antes de que llegue su reversión.** El
  descarte la saca de la cola, e `isOwnCopy` lee la cola (`R9-248`).
- **Un arreglo de un hecho del servidor no se guarda con `isCurrent()`.** El ack dice que la escritura
  llegó a la nube de su dueño, sea cual sea la sesión; con la guarda, el arreglo vale solo dentro de
  ella (`R9-249`).
- **Un reloj viejo en una escritura propia rompe toda premisa de «más nueva que lo local».** El
  respaldo restaurado lleva el `updatedAt` del archivo (`R9-245`).
