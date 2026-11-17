# S154 — arreglos, tanda V2: `R9-128` con `R9-132`, y `R9-37`; `R9-127` y `R9-126` sin entrar

> **Sesión 154 (2026-11-16).** Chat nuevo, en la terminal, con **Opus 5.5 de principal y Fable 5.2 de asesor**
> (respondió dos veces), esfuerzo `high`. Victor pidió **8 agentes**. **Sin emulador: nada de esto está medido en
> vivo.** Este borrador va a `detail/S154-arreglos-v2.md` en el cierre (`_scratch/S154-CIERRE-PROMPT.md`).
>
> **Resultado.** Dos commits en `fix/s154-v2` sobre `32251187`: `5296512b` (`R9-128` y `R9-132`) y `253f0a9d`
> (`R9-37`). `R9-127`, hecho por un agente y **no integrado** (§5). `R9-126`, medido y propuesto (§6). Suite
> entera: 383 suites, 4832 pruebas; `validate`, exit 0.

## 1. Estado de partida

`main` = `origin/main` = `32251187`. El validador: 278 abiertos de 594 (0 P0, 16 P1, 91 P2, 170 P3 y un aviso).

## 2. Los agentes

Reglas comunes: `_scratch/S154-agentes-reglas.md.txt` (el contrato de `R9-128` fijado antes de repartir; una región
de `src/` por agente; un archivo de prueba nuevo por agente). Herramientas: `S154-copiar.cjs.txt` y
`S154-gates.sh.txt`. Informes, piezas y diffs: `_scratch/S154-sondas-agente-<N>/`. Ninguno se cortó.

| N   | Modelo y esfuerzo        | Qué                                                              | Llamadas | Min |
| --- | ------------------------ | ---------------------------------------------------------------- | -------- | --- |
| 1   | Opus 5.5, `high` (fork)  | `R9-128`, motor (`applyRemoteChange`, borrado real) y `notes.ts` | 77       | 7   |
| 2   | Opus 5.5, `high` (fork)  | `R9-128` en `resolveConflict`                                    | 57       | 8   |
| 3   | Opus 5.5, `high` (fork)  | `R9-128` y `R9-132` en `highlights.ts`                           | 43       | 6   |
| 4   | Opus 5.5, `high` (fork)  | `R9-128` en los demás `apply*`                                   | 40       | 5   |
| 5   | Opus 5.5, `high` (fork)  | `R9-37`                                                          | 44       | 7   |
| 6   | Opus 5.5, `high` (fork)  | `R9-127`                                                         | 69       | 11  |
| 7   | Opus 5.5, `high` (fork)  | `R9-126`: medir y proponer, sin `src/`                           | 40       | 6   |
| 8   | Sonnet, `medium` (nuevo) | línea base de sync y los `grep` de consumidores                  | 15       | 2   |

El agente 8: con HEAD, 34 suites de sync y 659 pruebas verdes; ninguna prueba fijaba el «tragar» de un `apply*`;
nadie fuera de `SyncEngine.ts` llama a los `apply*` ni a `getLocal`.

## 3. Lo integrado, re-medido en el principal

Los seis diffs aplicaron en serie sin conflictos. Cada pieza, revertida sola sobre lo integrado, contra la prueba de
su agente (`_scratch/S154-integrado.cjs.txt`, salida `S154-integrado.out.txt`): **las 25 caen**, por la misma razón
que en su worktree. La de punta a punta de `R9-128` («un INSERT que falla deja la nota retenida, y el reattach la
vuelve a escribir», notas reales contra el motor real) cae con la pieza E (motor) sola y con la N (adaptador) sola.

Un error del orquestador: editó un comentario de `SyncEngine.ts` mientras ese script le aplicaba piezas. El diff
sin preparar al final era solo el comentario (3 líneas): no se perdió nada ni quedó una pieza puesta.

## 4. Lo que entró

**`R9-128`** (`5296512b`):

- Los `apply*` de notas, subrayados y favoritos relanzan. El delete de favoritos abre la base antes (con HEAD, un
  borrado remoto en frío dejaba la fila y vaciaba la pantalla) y saca la fila de la pantalla solo si llegó al disco.
- `applyRemoteChange`: un `apply*` que rechaza devuelve `false`, y `handleSnapshot` retiene el doc (el camino de
  `R9-46`). Con HEAD, el rechazo cortaba el lote y el lote siguiente enterraba el doc (cursor 1 000 000 → 8 700 000).
- El borrado real de `handleSnapshot`: un rechazo ya no corta el lote, y el doc se asienta como antes (está fuera
  de la nube: ninguna consulta lo vuelve a entregar, y una marca sin conflicto fijaría el piso tras reiniciar).
- `resolveConflict`: sin cambio de código. Medido con HEAD y el adaptador que se traga el error: «Quedarme con lo
  suyo» decía «resuelto», el cursor pasaba y la nube y el teléfono quedaban distintos para siempre. Con el adaptador
  que relanza, el conflicto sigue, el cursor no se mueve y la pantalla muestra «No se pudo resolver…» (por lectura).
- `highlights`: el upsert es un solo `INSERT OR REPLACE` con los relojes remotos (`atom`). Comparado con el DDL y con
  `addHighlight`: mismas columnas, mismo `id`, sin otros efectos. Cierra el caso del `UPDATE` de relojes que fallaba
  solo.
- `types.ts`: el contrato dice que un `apply*` rechaza si no escribió, y que `getLocal` lanza si no leyó
  (`reviewEvents` todavía lee un fallo como `null`: inocuo, sus `apply*` no escriben).

**`R9-132`** (`5296512b`): el `getLocal` de subrayados lanza en un fallo. Con HEAD, una copia vieja pisaba nota,
color y reloj de la local nueva.

**`R9-37`** (`253f0a9d`): dos guardas después del último `await` de `attachListener` (la colección sin listener, y
el adaptador todavía registrado). Con HEAD: 2 listeners vivos y 1 huérfano tras `stop()`, en `register()` durante
`start()` y en `start` → `stop` → `start` del mismo uid. Que el huérfano siga facturando en el SDK real: sin medir.

Pruebas nuevas: 23 de `R9-128`/`R9-132` (`s154a1` a `s154a4`) y 5 de `R9-37` (`s154a5`).

## 5. `R9-127`: hecho por el agente 6, NO integrado

El diff (`S154-sondas-agente-6/S154-a6.diff.txt`, 12 pruebas, las 6 piezas caen sobre lo integrado) hace el skip
por uid, con un asa `settle` para las dos ramas que preguntan antes del `signInWithCredential`. Además **quita el
skip de `deleteAccount`**. Eso cierra la puerta del borrado y un vecino nuevo que encontró (la limpieza de la nube
que falla: `restoreSync` hace `start` de la cuenta viva y su `'2'` pasa a `'skip'`). Pero quita la única red del
camino de borrado: con la marca de dueño ilegible, o el reclamo de `(deleted)` fallando, lo recién borrado subiría a
la cuenta siguiente sin preguntar (leído, sin medir). El asesor lo bloqueó así.

**El diseño para la 155** (del asesor): armar el skip solo cuando la limpieza y el borrado salieron bien, y que un
«Migrar» explícito suelte el pendiente. Medir antes los dos casos sin pregunta con HEAD y con el diff del agente 6.

## 6. `R9-126`: medido y propuesto (agente 7, sin `src/`)

Confirmado con sonda (antes, por lectura). Restaurar un respaldo, el bulk push del primer inicio y una edición en
cola que ya perdió LWW suben una versión vieja: la nube queda con ella, el otro teléfono no se entera y un teléfono
nuevo la baja. El bulk push es peor que lo escrito: A tampoco se queda con la nueva (inferido del mock).

| Op. | Qué                                                          | Cierra    | Lecturas extra | Estado                         |
| --- | ------------------------------------------------------------ | --------- | -------------- | ------------------------------ |
| C   | si LWW aplica una copia más nueva, quitar la entrada en cola | la cola   | 0              | medida; falta prueba y vecinos |
| E   | el bulk push espera el primer snapshot                       | bulk push | 0              | sin medir                      |
| B   | el import reestampa `updatedAt`                              | restaurar | 0              | pide decisión (§8)             |
| R   | LWW en las reglas de Firestore                               | todos     | 0              | consola: OK de Victor          |
| T   | `set` condicional por transacción                            | todos     | +1 por push    | descartada                     |

Recomendación: C en su propia sesión, después E; B a la §8 («Restaurar» lleva el respaldo a la cuenta o solo a
este teléfono; recomienda «a la cuenta»); R con la V4 (`R9-4`).

## 7. Sin medir, y candidatos sin número

- **Un `apply*` que falla siempre no tiene salida** (la regla de `R9-212`): el doc queda retenido y cada attach
  relee todo lo posterior. Antes se saltaba una vez. Con un `getLocal` que falla siempre, ya pasaba. Para la 155,
  con sonda (tres attaches, contar lo entregado).
- **El borrado real que falla:** la copia local queda, y una edición posterior aquí la revive en la nube.
- **Candidatos, no están en `BUGS.md`, ninguno lo abre esta tanda:**
  - `queueTouched` se marca antes del `apply` y no se quita si falla (agente 2); con la cola sin leer, `joinQueue`
    descartaría una edición propia que no subió.
  - el mazo guarda en disco con `setItem(...).catch(() => undefined)` (`MemoryDeckContext.tsx:354` y `:374`,
    agente 4).
  - un adaptador registrado de nuevo sin carrera deja el listener con el viejo (agente 5).

## 8. Estado al cerrar el código

`fix/s154-v2` = `253f0a9d`, sin mergear ni pushear. Worktrees de los agentes quitados (las copias, iguales con
`cmp`). Falta el cierre de docs: `_scratch/S154-CIERRE-PROMPT.md`.
