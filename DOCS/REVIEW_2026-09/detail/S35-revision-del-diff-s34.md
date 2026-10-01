# Sesión 35 (2026-09-30) — revisión del diff de la 34

**Modo:** solo terminal, sin agentes, sin tocar código de la app. Arrancó con
`_scratch/S35-PROMPT.md` (vale más que el mensaje (o) de `CONTINUAR.md`).

**Diff revisado:** `17788ae..682f852` (`SyncEngine.ts`, `FavoritesContext.tsx`,
`SyncEngine.test.ts` y `favoritesGetLocalRow.test.tsx`; 4 commits de la 34).

**Estado al empezar:** `main` = `origin/main` = `5d8fda2` (el checkpoint de la 34, mergeado y
pusheado). CI verificado EN EL LOG: run `36814348204`, 3 jobs verdes (Run Tests, Security Audit,
Lint & Type Check), Node v24.21.0, 368/4501, cero «failed to run».

**Resultado:** 5 hallazgos nuevos, todos P3, `R9-215`..`R9-219`. Los cinco los abrió o los dejó a
la vista la 34, y cada «lo abrió» se midió revirtiendo la pieza (corolario 47):

- `R9-215` y `R9-218`, en la coordinación de la relectura de `R9-208`;
- `R9-216`, el «mía» de más de `R9-207` (corolario 42), en las dos ramas que A2 no sondeó;
- `R9-217`, el coste aceptado de `R9-208`, medido;
- `R9-219`, la premisa del comentario de `R9-206`, que la sesión degradada de `R9-208` hace falsa
  (y la razón de `+heldAt` 0 → 4).

`R9-210` y `R9-209` no dejan nada nuevo. Las 18 pruebas nuevas dicen lo que miden (una
observación). La matriz entera, re-medida: ver §7. Hallazgos: **219**. Queda 1 P0 (`R9-38`).

---

## 1. Herramientas

- Las sondas: `_scratch/S35-sonda-{rereading,coste,dos,respaldo,retenida,marca,union}.body.txt`,
  corridas con el runner de la 31 (`S31-run.cjs.txt`, que arma `__tests__/S31sonda.test.ts` dentro
  del `describe` de `R9-124`; borrado al terminar). Salidas: `S35-sonda-*.out.txt`.
- El revert por pieza: `S34-rev.cjs.txt` con `S32_BASE=_scratch/S35-SyncEngine-base.ts.txt` (copia
  de `SyncEngine.ts` en `5d8fda2`) y `S34_PIEZAS` = el archivo de piezas de A1 o de A2. `--apply`,
  la sonda, `--restore`; después de cada uno, `git status` limpio y el control de NUL en 0. Las
  salidas con la pieza revertida: `S35-sonda-*-sin207own.out.txt` y
  `S35-sonda-rereading-sindiferir.out.txt`.
- Las piezas de `R9-210`: `S34-A3-piezas.cjs.txt` con `S34_ROOT` = el árbol principal (corrida
  normal, que restaura desde memoria). Salidas: `S35-A3-piezas-*.out.txt`.
- La matriz: `S34-matriz.cjs.txt` en el worktree `C:/projects/essb-s35-matriz` (`--detach` sobre
  `5d8fda2`, junction de `node_modules`). Salida: `S34-matriz-s35-5d8fda2.out.txt` (log:
  `S35-matriz-run.log.txt`); la comparación, `S35-comparar-s34.out.txt`.

## 2. `R9-208` (punto 1)

### 2.1 Los `await this.persistQueue()` que vuelven sin escribir

Ninguno cuenta con la cola en disco al volver:

- **`:930` (la hidratación):** corre en el primer `start()` del proceso, antes de enganchar ninguna
  colección, así que `ownDirty` está vacío y no difiere. En un `start()` posterior,
  `hydrateQueue` vuelve antes (la cola ya se leyó) y no llega a esa línea.
- **`:3152` (el flush):** después solo vienen el `finally` (el cerrojo) y el re-flush, que lee la
  cola en memoria. `flush()` es privado y sus 8 llamadores lo lanzan con `void`; solo
  `__flushForTests` lo espera, y solo lo usan las pruebas.

### 2.2 Una relectura que vuelve después de un `stop()`/`start()` → `R9-215`

`ownRereading` (`:482`) no se vacía en `stop()`, y `rereadOwn` (`:2496`) sale sin hacer nada si la
colección está en ese conjunto. Si la tabla vuelve a fallar al enganchar la sesión 2:

- la escritura que la sesión 2 difiere pide su relectura, que vuelve sin leer: la de la sesión 1
  sigue en vuelo;
- la de la sesión 1 vuelve, ve otra sesión y sale sin escribir (`:2512`).

La cola de la sesión 2 no llega a disco hasta la escritura siguiente (o el `stop()`). Sonda
`S35-sonda-rereading` (la misma cuenta; doc-c sube en la sesión 2 y d4 queda en cola sin red):

```
relectura vieja en vuelo:     colaS2 ["lo mio 4"]  colaTrasAbrir ["lo mio 4"]  proceso nuevo ["lo mio 4"]
control (la vieja ya volvió): colaS2 ["d mio 4"]   colaTrasAbrir ["d mio 4"]   proceso nuevo ["d mio 4"]
```

En disco queda la entrada de doc-c, que ya subió, y falta la de d4: si el proceso muere, **la
edición d4 queda solo en local y no sube nunca**. Las lecturas de la tabla lo confirman: `1,2,3` (la
relectura de la sesión 2 nunca se lanza) contra `1,2,3,4`. **Lo abrió `R9-208`:** con `diferir`
revertida (la pieza de A1), la misma sonda da `["d mio 4"]` en los dos casos. Por lectura (no se
sondeó), tampoco hace falta que sea la misma cuenta: `ownRereading` va por colección, no por uid
ni por sesión.

### 2.3 Dos colecciones ilegibles a la vez → `R9-218`

Sonda `S35-sonda-dos`, con el estado interno sembrado: `ca` y `cb`, cada una con un conflicto
retenido y un sello por escribir, y las relecturas abiertas por puertas.

| relectura de `ca` | de `cb` | escrituras (`multiSet`)                 | tablas en disco al final |
| ----------------- | ------- | --------------------------------------- | ------------------------ |
| ok                | ok      | `queue+ca+cb` (una), en los dos órdenes | las dos unidas           |
| falla             | ok      | `queue`, después `queue+cb`             | `ca` intacta, `cb` unida |
| ok                | falla   | `queue+ca`                              | `ca` unida, `cb` intacta |
| falla             | falla   | `queue`, `queue`                        | las dos intactas         |

Converge siempre, y la colección que falla sigue pendiente (`ownDirty` y `ownUnread`), así que la
escritura siguiente la reintenta. Pero **`force` es de toda la escritura, no de una colección:**
cuando falla la relectura de `ca`, la cola sale ya, sin la tabla de `cb`, aunque su relectura
estaba en vuelo e iba a funcionar. Es el orden que la segunda prueba de `R9-208` prohíbe («el
proceso muere justo después de guardar la cola sin la escritura subida de otro conflicto»), en la
segunda colección. Se midió el orden de las escrituras; la muerte entre las dos no se sondeó (es el
mecanismo de esa prueba).

### 2.4 El coste aceptado, medido → `R9-217`

La tabla no se puede leer en toda la sesión; d2 (doc-d en conflicto) sube. Sonda `S35-sonda-coste`:

| caso                         | cola en disco | proceso nuevo: conflictos |
| ---------------------------- | ------------- | ------------------------- |
| (a) d3 queda en cola sin red | `["d mio 3"]` | `[["d mio 3","d mio 2"]]` |
| (b) solo d2                  | `[]`          | `[]`                      |
| (c) d3 también sube          | `[]`          | `[]`                      |

El coste existe solo si queda una edición posterior del doc en cola al reiniciar. Su entrada no
lleva el reloj de d2: `queueWrite` (`:1108`) copia a `own` solo lo de `recentAcked`, y el ack de un
doc en conflicto va a `ownStamps`, no ahí. La prueba «si la tabla de sellos sigue ilegible al
releerla…» es el caso (a), y filtra los conflictos a doc-c (`fantasmaC`, `SyncEngine.test.ts:8534`)
sin decir que el de doc-d aparece.

### 2.5 La unión de `rereadOwn` con la lista de conflictos ilegible (sin número)

Al leer: el enganche conserva los sellos de todo doc retenido cuando la lista de conflictos no se
pudo leer (la pieza `poda` de A1), y `rereadOwn` une solo los de `isConflictDoc`. Sonda
`S35-sonda-union` (las dos listas ilegibles al enganchar, doc-d marcado por la lista de releer,
la entrega de doc-c sin terminar): la tabla queda `["doc-d"]` (contra `["doc-c","doc-d"]` del
control). **Sin consecuencia alcanzada:** la misma sesión reescribe la lista de conflictos sin
doc-c, y tras reiniciar no aparece nada en ninguno de los dos casos. Queda anotado en `R9-217`.

## 3. `R9-207` (punto 2)

### 3.1 El «mía» de más que suelta algo (corolario 42) → `R9-216`

`isOwnCopy` (`:2438`) responde «mía» a toda copia con el reloj de una escritura que el servidor
tomó sin conflicto en este proceso. Por `updatedAt` no distingue el eco tardío (el caso de
`R9-207`) de un respaldo que el otro teléfono restaura con esa misma escritura mía adentro. Medido
en las dos ramas que A2 no sondeó. W1 la subo yo, sin conflicto. Después, conflicto L contra R, y
el otro restaura un respaldo que tiene W1:

- **La rama `pending` (`S35-sonda-respaldo`):**

  ```
  subí W1:    «su versión» sigue «lo suyo»  →  keepTheirs: local "lo suyo", nube "w1 mio"
  control:    «su versión» pasa a "w1 mio"  →  keepTheirs: local y nube "w1 mio"
  ```

- **La rama retenida (`S35-sonda-retenida`):** la que A2 analizó solo leyendo. `stop()`, el otro
  restaura con la app cerrada y `start()` de la misma cuenta en el mismo proceso
  (`recentAcked` sobrevive a `stop()`):

  ```
  subí W1, mismo proceso:   conflictos []  marca null   local "lo mio", nube "w1 mio", cola []
  control (W1 del otro):    [["lo mio","w1 mio"]]  →  keepTheirs: local y nube "w1 mio"
  subí W1, proceso nuevo:   [["lo mio","w1 mio"]]  →  keepTheirs: local y nube "w1 mio"
  ```

  El conflicto se asienta en silencio: L, más nueva, queda solo en este teléfono, sin nada en cola.

**Lo abrió `R9-207`:** con `R207own` revertida, las dos ramas dan lo mismo que el control
(`S35-sonda-respaldo-sin207own.out.txt`, `S35-sonda-retenida-sin207own.out.txt`). El ledger aceptó
dos costes: el mismo milisegundo de otra escritura, y que la guarda de `handleSnapshot` suelte la
marca (la regla de `R9-190`, W6 de A2). Ninguno de los dos dice estas consecuencias.

### 3.2 `+heldAt` 0 → 4 → `R9-219`

Las 4 pruebas de `R9-208` que caen con `+heldAt` son las que tienen una sesión con la tabla de
sellos ilegible y un reinicio después. Sonda `S35-sonda-marca`, sobre `dosConflictos`:

```
antes:     {"doc-c":65000, "doc-d":65000}   (la marca en R)
en sesión: {"doc-c":120000, "doc-d":65000}  (la marca en L2, que es mía)
```

Sin los sellos, la sesión toma L2 (propia) por la copia del otro y la marca se va a ella. En el
reinicio, la tabla ya se lee: L2 es mía y se asienta. `+heldAt` vuelve a tomar «la copia en la
marca» como caso propio y la registra: «lo mio 3 | lo mio 2». Antes de la 34, ninguna prueba
movía la marca a una copia propia, y por eso daba 0. El comentario de `R9-206`
(`SyncEngine.ts:1853-1855`) dice que lo quitó porque «the mark only moves to a copy of the other
device»: en la sesión degradada, eso es falso. Hoy no tiene consecuencia medida.

## 4. `R9-210` (punto 3)

- **Esperas:** `getLocal` espera a `initialize()` en la cadena de lotes de `favorites` (la de
  `notes` ya lo hacía). Mientras espera, solo se detiene esa colección. Al volver, `isCurrent()`
  corta si hubo un `stop()` (`R9-153`). keepMine solo llega con un conflicto, que necesita un
  `getLocal` ya resuelto. Un `initialize()` que no termina deja la base sin abrir, y con ella el
  lector y notas: no es un riesgo nuevo. Uno que falla se reintenta en la llamada siguiente
  (`initializationPromise` vuelve a `null`), y mientras tanto el motor salta el doc y lo retiene
  (`R9-46`).
- **La factoría de la prueba** (corolario 9): la semántica de `getFavoriteById` coincide con la
  real (`rowToFavorite`: tags como lista, `null` si no está; `updatedAt` de la fila). Difiere en dos
  cosas que ninguna prueba ejercita: el `addFavorite` real guarda `note || null` (una nota vacía
  pasa a `null`), y el `getDb()` real exige `this.db`, no `initialized` (la base se abre antes de
  los seeds). Ninguna cambia lo que miden las 3 pruebas.
- **Las piezas** (`S35-A3-piezas-*.out.txt`): control 0/6, `GL` 2, `GLa` 1, `GLa2` 1, `GLinit` 1.
  Cada una tumba su prueba por la razón correcta. Son las de la 34, con `GLinit` en 1 desde que la
  sonda S9 de A3 pasó a ser la prueba.

## 5. `R9-209` (punto 4)

Las combinaciones de la línea de `theirs` en la rama `pending` (`:1766-1771`):

- copia local y copia viva;
- copia local y lápida;
- sin copia local, con la lápida mía (el eco), con la del otro (`R9-211`), con la copia que el
  conflicto ya muestra, o con una copia viva mía (`R9-209`) o del otro.

Por lectura, la única abierta es `R9-211`. Las demás dependen de `isOwnCopy`, y su «mía» de más
es `R9-216`. No se sondeó otra.

## 6. Las 18 pruebas nuevas (punto 5)

1 de `R9-209`, 5 de `R9-207` (un `it.each` de 2 y 3 sueltas), 9 de `R9-208` y 3 de favoritos. Sus
nombres dicen el escenario y el resultado que afirman. Los «Pre-fix» de los comentarios son los
que la matriz confirma (§7). Las 2 de control de `R9-208` (Ana y Beto, el JSON roto) lo dicen en
su primera línea. **Una observación** (va en `R9-217`): la de «la relectura sigue ilegible» filtra
a doc-c sin decir que el fantasma de doc-d, el coste aceptado, aparece en ese mismo proceso.

## 7. La matriz entera (punto 6)

En el worktree `C:/projects/essb-s35-matriz` (`--detach` sobre `5d8fda2`, junction de
`node_modules`): `S32_ROOT=… S32_FULL=1 node S34-matriz.cjs.txt s35-5d8fda2`. Antes, `check`: las
anclas casan como en la 34. Salida: `_scratch/S34-matriz-s35-5d8fda2.out.txt`.

- **Idéntica a la de la 34 en las 126 piezas**, por conteo y por pruebas que caen
  (`S33-comparar.cjs.txt`, salida `S35-comparar-s34.out.txt`: «126 piezas iguales de 126»).
  Control: 0/225.
- Los ceros siguen siendo `R104-7`, `R104-8` y `+P3`, y las 8 AUSENTES, las mismas. `+heldAt`
  sigue en 4 (explicado en §3.2, `R9-219`).
- Toda pieza de la 34 tumba al menos 1, y sus pruebas caen por la razón que dicen sus «Pre-fix».
- Durante la corrida, las sondas corrieron en el árbol principal en paralelo: ninguna pieza cambió,
  así que la contención no metió fallos espurios.

Al terminar, la junction se borró con `.Delete()` ANTES de `git worktree remove`.
