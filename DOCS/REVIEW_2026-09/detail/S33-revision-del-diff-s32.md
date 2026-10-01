# Sesión 33 (2026-09-30) — revisión del diff de la 32

**Modo:** solo terminal, sin agentes, sin tocar código de la app. Arrancó con
`_scratch/S33-PROMPT.md` (vale más que el mensaje (m) de `CONTINUAR.md`).

**Diff revisado:** `b26ab8d..c1664a5` (`SyncEngine.ts`, `types.ts`, `SyncEngine.test.ts`; 13
commits de la 32).

**Estado al empezar:** `main` = `origin/main` = `06513ba` (el checkpoint de la 32, mergeado y
pusheado). CI verificado EN EL LOG: run `36789350865`, 3 jobs verdes, Node v24.21.0, 367/4483,
cero «failed to run».

**Resultado:** 4 hallazgos nuevos, todos P3, `R9-207`..`R9-210`. Tres ya ocurrían antes de la 32
(medidos con su pieza revertida: `+W`, `+Npend`, C4) y son vecinos de lo que cerró: `R9-207`,
`R9-209` y `R9-210`. Uno lo abrió la 32 dentro de `R9-193`, porque la tabla de sellos persistida es
suya: `R9-208`. Las cuatro
preguntas del punto 3 del prompt, medidas: una es `R9-210`; las otras tres se descartan como daño
(con notas). La matriz entera, re-medida: idéntica a la de `c1664a5`. Hallazgos: **210**. Queda 1
P0 (`R9-38`).

---

## 1. Herramientas

- `_scratch/S33-rev.cjs.txt` — la de la 32 (`S32-rev.cjs.txt`) con base, tmp y json propios
  (`S33-SyncEngine-base.ts.txt`, guardada sobre `06513ba`) y la pieza `S190propia` agregada. La arma
  `S33-mkrev.cjs.txt`. `--apply PIEZA`, correr la sonda, `--restore`; cada `--apply` se comprobó con
  `git diff --stat` (3 líneas para `S190propia` y `W`, 12 para `C4`, 5 para `Npend`).
- Las sondas: `S33-sonda-{3,w,own,npend}.body.txt`, corridas con el runner de la 31
  (`S31-run.cjs.txt`, arma `__tests__/S31sonda.test.ts` dentro del `describe` de `R9-124`; borrado
  al terminar). Salidas: `S33-sonda-*.out.txt`.
- `S33-comparar.cjs.txt` — compara dos salidas de la matriz pieza por pieza (conteo y pruebas que
  dejan o empiezan a caer).
- `S33-pruebas-nuevas.txt` — los 33 `it(` que agregó la 32.

## 2. La matriz entera (punto 6)

En un worktree aparte (`C:/projects/essb-s33m`, `git worktree add --detach` sobre `06513ba`,
junction de `node_modules`): `S32_ROOT=… S32_FULL=1 node S32-matriz.cjs.txt s33-06513ba`. Salida:
`_scratch/S32-matriz-s33-06513ba.out.txt` (log: `S33-matriz-run.log.txt`).

- **Anclas:** `check` antes de correr; las mismas que en la 32. Ausentes, las mismas 8 y a
  propósito: `G7`, `R104-5`, `S181-b`, `S181-lectura`, `S190-tomada`, `S190-stop`,
  `S186-deteccion`, y `S32-A` (reemplazada por `S32-A206`).
- **Contra `c1664a5`:** `S33-comparar` da **109 de 109 piezas iguales** (conteos y pruebas).
- **Ceros:** `R104-7` y `R104-8` (los de siempre), `+P3` y `+heldAt` (piezas que SUMAN de vuelta lo
  quitado: su 0 es lo que mostró que sobraban). **Ninguna guarda de la 32 da 0:** cada pieza nueva
  tumba entre 1 y 15 pruebas (corolario 46: ninguna quedó subsumida por otra del mismo diff).
- **Las 33 pruebas nuevas de la 32 caen, cada una, con 2 a 14 piezas.** Ninguna es decorativa.

## 3. Lo que se quitó (punto 2)

`S33-comparar` sobre las tres matrices de la 32:

- `e7d7fb8` → `bbe855e` (se quitó `remoteTs === heldAt`, `R9-206`): solo dos guardas perdieron
  pruebas. `S181-marca` 8 → 0 (la 32 le escribió prueba en `c1664a5`: 0 → 1), y `S190-propia` 3 → 2.
  `S32-A` pasó a `S32-A206` (7 → 14, y 15 con `c1664a5`).
- **`S190-propia` (punto 3d):** la prueba que dejó de caer es `R9-196 … mi edicion en cola`
  (`SyncEngine.test.ts:6663`). Caía solo por el fantasma de `heldAt`: con la guarda revertida, la
  marca pasaba a L2 (propia) y la rama retenida la tomaba por `remoteTs === heldAt`. **Medido hoy**
  (sonda `3d`, con y sin `S190propia`): la marca, los conflictos, la cola y la nube quedan
  idénticos en los tres momentos (tras el reinicio, tras otro reinicio y tras subir L3). La guarda
  la siguen vigilando las dos pruebas de `R9-190`, cuya copia propia queda bajo el piso (ninguna
  entrega la asienta).
- **¿Alguna copia del otro que ya no llegue a «su versión»?** Por lectura: la rama B toma toda
  copia con reloj distinto del local que no sea propia; la A, toda copia más nueva, o más vieja y no
  propia. Lo único que ya no entra es una copia del otro con el MISMO milisegundo que lo local o que
  un sello propio (el límite ya dicho en `isOwnCopy`). Lo que las ramas no ven es la rama sin copia
  local de `pending`, que no pregunta `isOwnCopy` (`R9-209`, abajo), y eso no lo tocó la 32.

## 4. Las preguntas que dejó la 32 (punto 3)

### 3a — C4 con el ref atrasado → `R9-210`

Antes, por lectura: `memoryCards` nunca registra conflictos (`getMaterialFields()` devuelve `[]`,
`MemoryDeckContext.tsx:278-280`), así que keepMine con el ref atrasado solo existe en `favorites`.

Sonda `3a` (la fila y el ref por separado: `getLocal` lee un `ref` que se copia de la fila al
«render»): conflicto L/R, sin red, el usuario guarda E (fila y cola), keepMine con el ref todavía en
L.

- **Hoy:** `colaAntes ["E: mi edicion"]` → `filaTrasKeepMine "lo mio"`, `colaTras ["lo mio"]`; final
  fila y nube «lo mio». E se pierde.
- **Sin C4:** `filaTrasKeepMine "E: mi edicion"` (hasta el eco), y el final es el mismo: fila y nube
  «lo mio».

C4 no crea la pérdida: la adelanta del eco al momento de resolver. La pérdida es de keepMine, que
lee el ref (`R9-36` toma «lo mío AHORA» de `getLocal`, y en favoritos ese ahora puede ir un render
atrasado): la cola reemplaza E por la copia vieja re-sellada, y su eco gana por LWW. Es el resto de
la raíz de `R9-174` (el arreglo de la 32 cerró solo el eco). Alcance: el toque de keepMine dentro
del mismo render que la edición del mismo favorito.

### 3b — H3 con copia local y la leída más NUEVA → descartada como daño (nota en `R9-197` y `R9-126`)

Sonda `3b`: el caso de `R9-197` (conflicto L/R, W en cola, el respaldo del otro sale de la query y
su lectura falla), y con la app cerrada el otro escribe X2, MÁS NUEVA que W. Al arrancar, la
relectura y la entrega del enganche la traen.

- **`igual` (X2 con el campo material igual a W y otro no material distinto):** se aplica X2 en local
  mientras W espera (`fila "lo mio editado|x2|300s"`), el conflicto termina (no queda nada que
  elegir) y la marca se asienta. W sube después: **nube W (`w`, 120 s), local X2 (`x2`, 300 s)**.
  Es el mecanismo de la pregunta, pero solo difieren el reloj y campos no materiales; en los cuatro
  adaptadores esos campos no cambian para un mismo id (versículo, libro, `createdAt`…). No es el
  daño de `R9-176`.
- **`distinta`:** se registra «lo mio editado | su edicion nueva» y la marca queda en X2 (bien). W
  sube y **pisa a X2 en la nube** (`R9-126`: `set({merge:true})` incondicional); tras otro reinicio
  el conflicto y la marca desaparecen (la nube ya no tiene X2, y W es propia), y el otro teléfono se
  queda con X2. Es `R9-126`, no un hallazgo nuevo; va como nota allí.

### 3c — `recentAcked` crece → descartada (nota en `R9-194`)

Sonda `3c`: bulk push de 300 docs. Una entrada por doc subido (149 al cortar la sonda), y `stop()`
no la vacía (150: el envío en vuelo, anotado por `stop()`). Una Map de la misma forma cuesta unos
**212 B por entrada** (20 000 claves sintéticas): miles de docs son cientos de KB. Solo se lee al
crear una entrada NUEVA de la cola (`get` O(1)), y la clave lleva el uid. No importa.

### 3d — `S190-propia` 3 → 2 → ver §3

## 5. Hallazgos nuevos

### `R9-207` (P3) — el eco de W1 procesado DESPUÉS del ack de W2: «w2 contra w1»

Sonda `W`: la cadena de lotes de la colección ocupada (un `getLocal` lento de otro doc, como un
lote grande de SQLite en la primera sincronización) y el hilo de escrituras libre. W1 y W2 (6 s
después) suben y se confirman mientras sus ecos esperan su turno.

- `antesDeSoltar: {subidas ["w1","w2"], cola [], conflictos []}` → al soltar: **`conflictos
[["w2","w1"]]`**, en las dos variantes (W2 entrada nueva tras el ack de W1, o reemplazándola antes).
- **keepTheirs:** `{local "w1", nube "w2", cola []}`: el teléfono y la nube quedan distintos en
  silencio, y la edición w2 se pierde en local.
- **Con `+W` revertido, idéntico:** ya ocurría antes de la 32. `+W` lo cierra solo mientras la
  entrada de W2 (que lleva el reloj de W1 en `own`) sigue en la cola. Cuando sale, nada lo recuerda:
  `noteOwnAcked` de un doc sin conflicto guarda en `recentAcked` solo el reloj de W2 (no su `own`), e
  `isOwnCopy` no lee `recentAcked`.
- Es el vecino de `R9-189` (corolario 18): el caso cerrado es «el eco llega con W2 en cola».
- **Arreglo (hipótesis, sin medir):** que el ack de un doc sin conflicto conserve los relojes de la
  entrada (el suyo y su `own`) al menos `CONFLICT_WINDOW_MS`, y que la ventana de 30 s (solo ella)
  los consulte.

### `R9-208` (P3) — los sellos ilegibles en un arranque, y el ack siguiente los borra del disco

Sonda `OWN`: el caso de `R9-196` descartada (L2 subió con el conflicto: sello propio; L3 se
descartó; nube L2, local L3). Se reinicia con `@sync_own_` ilegible.

- **`sin-otra`:** en esa sesión aparece «lo mio 3 | lo mio 2» (la degradación que el comentario de
  `loadUnsettled` acepta), el disco conserva el sello, y al reiniciar con todo legible el fantasma
  no vuelve.
- **`con-otra`:** un segundo conflicto de la misma colección (doc-d) sube una edición en la sesión
  ilegible. Su ack guarda la tabla de la colección, cargada VACÍA: el disco pasa de
  `{"doc-c":[…]}` a `{"doc-d":[…]}`. **Al reiniciar con todo legible, «lo mio 3 | lo mio 2» vuelve,
  y vuelve en cada arranque.** Elegir «lo suyo» aplica L2 y pierde L3 en local.
- Es la forma de `R9-195` (una lista ilegible, y el guardado siguiente la borra) en la tabla de
  sellos, y el corolario 42 dentro de `R9-193`: la escritura de los sellos suelta los que la propia
  persistencia hacía durables. El comentario de `ownStamps` («at every instant a stamp is on disk in
  the queue or here») deja de ser cierto en ese caso.
- **Arreglo (hipótesis, sin medir):** con la tabla ilegible, no escribirla en esa sesión (como
  `unsettledUnsaved`), o releer y unir antes de escribir.

### `R9-209` (P3) — la rama `pending` sin copia local no pregunta `isOwnCopy`

`SyncEngine.ts:1693-1696`: con `local` nulo, `theirs = !deleted && data.updatedAt !==
pending.remoteVersion.updatedAt`. Sonda `NULL`: conflicto L/R en memoria; el `set` de W1 espera el
hilo único (una lectura en curso, `R9-177`, la forma de `R9-189`); el usuario borra el doc (la
lápida reemplaza a W1 en la cola con `own [W1]`); al soltar sube W1, y su eco llega con lo local
borrado.

- **`borra`:** `conflictos [["lo mio","w1"]]`: **«su versión» pasa a ser w1, mi propia escritura.**
  keepTheirs: `{local "w1", nube "w1", cola []}`: revive el doc que el usuario borró con su edición
  vieja, y la versión del otro (R) desaparece de la nube.
- **`edita` (control):** con W2 en vez del borrado, «lo suyo» se conserva (la rama con copia local
  reconoce el eco).
- **Con `+Npend` revertido, idéntico:** ya ocurría. La 32 hizo que la rama con copia local
  preguntara `isOwnCopy` y dejó la vecina sin copia local (corolario 18).
- **Arreglo (hipótesis, sin medir):** `&& !this.isOwnCopy(…)` también en esa rama.

### `R9-210` (P3) — keepMine con el ref atrasado de favoritos pierde la edición en cola

Ver 3a. Ya existía; C4 adelanta la pérdida. **Arreglo (hipótesis, sin medir):** la de `R9-174`
(actualizar el ref donde se escribe la fila, antes del `queueWrite`), o que `getLocal` de favoritos
lea la fila de SQLite.

## 6. Corolario 42 sobre cada pieza (punto 4)

- **Los sellos (`ownStamps`, `own`) son lo durable de la 32.** Los sueltan, a propósito: `settle()`
  sin conflicto en memoria (`S32-Fsettle`), `resolveConflict` (`S32-Fresolve`) y la poda al cargar
  (`S32-prune`). Sin querer: la escritura de una tabla cargada vacía por un error de lectura
  (`R9-208`).
- **`ownQueued` (H3, `R9-197`) retiene la marca** mientras la escritura propia espera; es durable
  (`saveUnsettled`). La suelta la entrega del eco de W (propia → `settle`). Si W pisa en la nube la
  copia en la que está la marca (`R9-126`), tras reiniciar el conflicto ya no se puede re-detectar
  (3b `distinta`).
- **`refreshTheirs` (P2)** mueve la marca a la copia leída y refresca el conflicto en memoria; si la
  leída no difiere de la foto de «lo mío», conserva los campos en disputa de antes (`S32-P2dif`).
- **H1c (`R9-195`)** retiene: marca conflicto y releer para todo doc de la lista de releer cuando la
  de conflictos es ilegible. Sus sellos se cargan después, así que no se podan.
- **`pushing` en `stop()`** anota como tomada la escritura en vuelo; si nunca llega, el sello nombra
  una copia que no existe (lo dice el comentario).
- **C4 (`R9-204`)** escribe la fila local antes de encolar. Si la sesión termina en ese `await`, la
  fila queda re-sellada sin entrada en cola; el conflicto vuelve tras reiniciar (la copia del otro no
  es propia) y el usuario elige otra vez. No se pierde nada.
- **Subsumidas (corolario 46):** ninguna (§2).

## 7. Las pruebas nuevas (punto 5)

Las 33 caen con su pieza y con otras (§2). Los nombres y comentarios leídos contra lo que afirman:
dicen lo que miden. La única con «(control)» en el nombre (`R9-193 (control): una escritura mia
encolada ANTES del conflicto…`) cae con 3 piezas; su comentario lo explica (pasa sin `R9-193`, y con
los sellos vigila que el ack la anote). No es un error.

Dos comentarios de CÓDIGO afirman más de lo que cumplen, y van en sus hallazgos: el de `ownStamps`
(`R9-208`) y el de `+W` («the echo of a write the queue replaced … came back»: solo mientras la
entrada nueva espera, `R9-207`).

## 8. Notas de oficio

- La salida base de `S33-sonda-null` se sobrescribió al volver a correr solo `borra` con
  keepTheirs; la de `edita` sobre el código de hoy se vio en la sesión (`conflictos [["lo mio","lo
suyo"]]`, `local "w2"`), y `S33-sonda-null-sinNpend.out.txt` trae las dos variantes con la pieza
  revertida.
- El worktree de la matriz se borró al terminar, la junction de `node_modules` antes, con
  `.Delete()`.
