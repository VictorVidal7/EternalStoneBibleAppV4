# Sesión 61 — arreglos del mazo de memoria: `R9-267` y `R9-133` (2026-10-06)

Chat nuevo, solo en la terminal y sin agentes, con `_scratch/S61-PROMPT.md`. Los eligió Victor el
2026-10-05, tras la 60. El cómo es técnico y estaba delegado: se decidió midiendo, y queda acá.

- **Estado al empezar:** `main` = `origin/main` = `6667c40` (el checkpoint de la 59). **La 60 no
  estaba mergeada** (`docs/review-s60-diff-s59`, 2 commits, solo docs, sin el OK), y por eso había 12
  ramas locales en vez de 11. La rama de arreglos se apiló sobre la de la 60 para que todo entre en
  fast-forward.
- **Rama:** `fix/s61-mazo-r267-r133`, con `57cab83` (`R9-133`), `6d87069` (`R9-277`) y `d69c529`
  (`R9-267`). El ledger va encima, en `docs/review-s61-fix`.
- **Un solo archivo de la app:** `src/context/MemoryDeckContext.tsx`. El motor no se tocó
  (`SyncEngine.ts` = `S55-SyncEngine-R271.ts.txt`, NUL 0), así que no hay matriz.
- **Resultado:** cerrados `R9-267` y la parte del mazo de `R9-133`. Hay 2 nuevos que ya existían:
  `R9-277`, cerrado aquí, y `R9-278`, abierto. Quedan 278 hallazgos y ningún P0.

## 0. Cómo se midió

- **La sonda:** `_scratch/S61-sonda.test.tsx.txt` + `S61-sonda.cjs.txt <out> [hoy|<commit>]`. Usa el
  provider real y AsyncStorage real; del `SyncEngineContext`, solo `useSyncEngineOptional`, para
  capturar el adaptador.
  - `motor` hace lo que hace `applyRemoteChange` con `memoryCards`: `getLocal`, LWW si hay copia
    local y aplicar. No tiene campos materiales, así que no hay conflictos.
  - El `getItem` de `@memory_deck` falla las primeras N lecturas, o espera a una puerta. Cada
    lectura ve el disco de cuando se pidió.
- **Las salidas:** `S61-sonda-hoy.out.txt` (el código de `37ba5f7`), `-A` (con `R9-133`) y `-C`
  (con los tres arreglos).
- **Las piezas:** `_scratch/S61-rev.cjs.txt <pieza>`. Comprueba que el ancla aparezca una sola vez,
  imprime el diff del revert contra el árbol de trabajo, corre la prueba y restaura. Cada salida va
  a `S61-rev-<pieza>.out.txt`.

## 1. Lo medido antes de arreglar (cada caso con su control)

| Caso                                                 | Hoy                                         |
| ---------------------------------------------------- | ------------------------------------------- |
| `FALLA`: la lectura del arranque falla               | disco `{}`                                  |
| `AGREGA`: agregar tras esa lectura (relee bien o no) | disco: solo la nueva                        |
| `REMOTO`: copia de 500 tras la lectura fallida       | `getLocal` null, entra; disco `{John: 500}` |
| `FRIO`: copia de 500, aplicada después de la carga   | entra (500)                                 |
| `FRIO`: copia de 500, aplicada antes de que termine  | la carga la reemplaza (sin daño)            |
| `FRIO`: copia de 5000, aplicada antes de que termine | **la carga la reemplaza: se pierde**        |
| `AGREGA_CARGA`: agregar durante la carga del montaje | se pierde                                   |
| `VENTANA`: copia de 2000 entre un repaso y su render | el repaso se pierde (`reviewCount` 0)       |
| `RESPALDO`: la recarga falla, y después se agrega    | el mazo de antes pisa lo restaurado         |

Los controles (la lectura sana, lo agregado después de la carga, la copia después del render, la
recarga que lee) no pierden nada.

- **`R9-133` (el mazo):** confirmado. La ventana de la sesión 23 existe en el mazo con el mismo
  mecanismo (el ref seguía a `deck` después del render), así que la cubre el mismo arreglo.
- **`R9-277`, nuevo:** la carga reemplazaba lo escrito mientras estaba en vuelo (`AGREGA_CARGA`, y
  `FRIO` con la copia más nueva).
- **`R9-267`:** confirmado, con un segundo disparador: la recarga del respaldo fallando después de
  una carga buena.

## 2. Quién escribe `@memory_deck`

`grep`: el efecto del provider y `importBackup` (el `multiSet` de las claves de AsyncStorage, que
reemplaza el mapa y después avisa). Nadie más. Ningún `clear` ni `multiRemove` la toca. El provider
web es un stub y no lee nada.

Del `multiSet` al aviso no hay otro `await`, pero una edición mientras el `multiSet` está en vuelo
pide su `setItem` detrás de él (ejecutor serie), y la recarga lo lee: es `R9-278`, por lectura y
abierto.

## 3. Los arreglos

### `R9-133` (`57cab83`)

- **`getLocal` espera a la carga** (`deckLoad`, de `R9-264`) **y lanza si no leyó el disco**, como
  `R9-46`. El motor salta el doc, y su cursor queda detrás. Si la lectura falla siempre, el doc se
  re-entrega en el proceso siguiente.
- **`edit`:** toda escritura pasa por ahí y pone el ref antes de que React renderice. El efecto que
  copiaba `deck` al ref ya no existe (el de `R9-210` mostró que el ref adelantado con el efecto vuelve
  atrás).
- **Por qué no leer el disco en `getLocal`** (el modelo de `R9-210`): el disco lo escribe el efecto
  después del render, así que va tan atrás como iba el ref.

### `R9-277` (`6d87069`)

- **`unsaved`:** un mapa de lo editado (clave → tarjeta o `null`). Lo crea la carga al empezar, y
  `edit` anota cada cambio mientras exista.
- **La lectura lo pone encima de lo leído.** Lo suelta solo la última carga en vuelo (`loadSeq`).
  Así, lo editado ANTES de una carga no vuelve sobre lo que lee: el respaldo reemplaza el mazo, como
  antes.
- Con dos cargas en vuelo (el respaldo durante la del montaje), queda lo editado entre la primera y
  la segunda.

### `R9-267` (`d69c529`)

- **El efecto escribe solo sin `unsaved`**, o sea, cuando una carga leyó el disco. Con una carga en
  vuelo o fallida, lo editado espera.
- **`unread`** marca que la última carga falló. Con eso, la primera edición relee (la misma carga).
  Si lee, se une; si falla, **se rinde**: escribe lo de memoria, como antes, y `deckLoad` pasa a
  «leído». Es la salida de `R9-212`: una lectura puede fallar siempre.
- **«Una carga más nueva decide»:** la relectura que falla no se rinde si mientras tanto empezó
  otra (la del respaldo).
- **Una lectura que no adopta nada** (sin mazo en disco, o un texto que no es JSON) renderiza igual,
  para que el efecto escriba lo que esperaba.
- **Un estado en memoria:** lo editado espera lo que tarda una lectura, y la primera edición tras un
  fallo relee enseguida. Si el proceso muere ahí, se pierde esa edición, pero no las tarjetas del
  disco.

## 4. Las pruebas y las piezas

`__tests__/memoryDeckDisk.test.tsx`: 12 pruebas (3 de `R9-133`, 3 de `R9-277` y 6 de `R9-267`), con
el provider real. Cada pieza, revertida en el árbol final:

| Pieza     | Qué quita                                             | Caen    |
| --------- | ----------------------------------------------------- | ------- |
| `espera`  | la espera y el lanzamiento de `getLocal`              | 2       |
| `ref`     | el ref en `edit` (vuelve el efecto)                   | 1       |
| `encima`  | poner lo editado encima de lo leído                   | 2       |
| `suelta`  | soltar lo editado al leer                             | 2       |
| `ultima`  | soltarlo solo en la última carga                      | 1       |
| `retiene` | esperar a leer antes de escribir                      | 6       |
| `relee`   | releer (se rinde enseguida)                           | 5       |
| `rinde`   | la salida                                             | 1       |
| `nueva`   | «una carga más nueva decide»                          | 1       |
| `fuerza`  | el render de una lectura que no adopta nada           | 1       |
| `marca`   | marcar la carga fallida                               | 5       |
| `r*todo`  | el commit entero (`r133todo`, `r277todo`, `r267todo`) | 3, 2, 6 |

- Cada una cae por la consecuencia: el diff de la aserción está en su `.out.txt`.
- `nueva` no caía en la primera versión: la recarga se resolvía en la misma ronda de microtareas
  que la relectura fallida, y adoptaba antes de que la salida se rindiera. En el teléfono, el
  ejecutor serie entrega la recarga en un callback posterior; la prueba ahora lo construye con dos
  puertas y un control (`discoTrasLaRelectura`).
- La de «lo editado antes no vuelve» (`R9-277`) pasa también sin el arreglo: vigila `suelta`.
- Las pruebas de `R9-264` (`memoryDeckPullAllLocal.test.tsx`) y `R9-28`
  (`MemoryDeckContext.test.tsx`) se re-corrieron tras cada arreglo: verdes.

## 5. Lo que no se hizo

- `R9-278` queda abierto (por lectura; hipótesis: un aviso antes de escribir).
- No se midió en el teléfono cuánto dura la ventana del render, ni la carga de AsyncStorage con
  otros providers leyendo a la vez.
