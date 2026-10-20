# Sesión 103 — arreglo de lo de la 101 y la 102 (2026-10-19)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S103-PROMPT.md` y 5 agentes en worktree
(los pidió Victor). Los agentes midieron los diseños ANTES de que se escribieran los arreglos (la regla
de la 99); el orquestador los juntó, uno por commit, re-midiendo cada prueba nueva en el principal.
Arregla `R9-353`..`R9-358`, todo en las pruebas.

- **Estado al empezar:** `main` = `origin/main` = `ee88726` (la 102, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `39347457688`, 3 jobs, Node v24.21.0, 374/4665). Comprobado con
  `git fetch` y `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar.
  Los docs decían «sin mergear» para la 102: corregido aquí.
- **Ramas:** los arreglos en `fix/s103-arreglos-s102` (5 commits, solo `__tests__/`), y los docs en
  `docs/review-s103-fix` encima, escritos en un worktree aparte (`../essb-docs-s103`, fuera del repo)
  mientras la matriz corría en el principal. Sin mergear hasta el OK de Victor.
- **Resultado:** los seis, cerrados. Uno nuevo, P3 bajo y sin arreglar: `R9-359`. Quedan 359
  hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S103-gen.cjs.txt`: la `S103-sonda.cjs.txt` desde `S102-sonda.cjs.txt`, con las piezas de
    `S103-propias.txt` (bloques `// S103-o`) y, en el principal, las de las copias de los agentes
    (`S103-sondas-agente-N/S103-a<N>-propias.txt`; un nombre repetido pasa a `<nombre>_a<N>`). Con
    `<raíz del worktree> <N>` arma la sonda de cada agente (ROOT propio, salida `S103-a<N>-sonda-*`),
    su `igual` y su `resumen`. Probada en modo `anclas` con las 22 piezas de las seis entradas, y el
    modo agente en un directorio temporal, antes de lanzar.
  - `S103-matriz.cjs.txt`: la lista de la 102 (la lee de `S102-matriz.cjs.txt`) más las 37 piezas que
    la 102 corrió aparte (`EXTRA102`), menos `NO_APLICA`, más las piezas de los agentes. Tiene modo
    `anclas`. Compara con la de la 102.
  - Las tandas: `S103-tanda1..N.out.txt`.
- **Los agentes:** 5 `fork` con `isolation: "worktree"`, nacidos en `ee88726` (sin `reset`), cada uno
  con una entrada (A1 `R9-355`, A2 `R9-356`, A3 `R9-353`, A4 `R9-354` y `R9-358`, A5 `R9-357`), las
  reglas de controles y esperas de §5 como lista, `--maxWorkers=3` y el `cp -r` de su `_scratch`.
  Completaron los cinco, sin cortes: 182-218k tokens, 29-35 llamadas (todos pasaron el tope de ~25),
  8-12 min. Copias en `_scratch/S103-sondas-agente-N/` (49, 54, 44, 55 y 50 archivos).
  - **Los worktrees no se borraron solos** (tenían el diseño sin commitear): en los cinco, el diff
    guardado era igual al `git diff`, `diff -rq` del `_scratch` contra su copia, vacío, y sin junction.
    Después `git worktree remove --force` (el de A4, bloqueado, con `-f -f`) y `git branch -D`.
- **La integración:** un commit por diseño, en este orden: A5, A1, A2, A3 y A4 (el de A4, portado a
  mano sobre las funciones que armó A3). Antes de cada commit, la prueba nueva cayó en el principal con
  cada pieza de su entrada, y pasó con la prueba revertida (piezas `pat<sha>` y `bpt<sha>`: el archivo
  de prueba del commit anterior). Todo en `prep` con `--maxWorkers=3`; el suite, con 4.
- **Ninguna corrida dejó el árbol sucio.**

## 1. Los arreglos

| commit    | entrada            | qué                                                                 | del agente |
| --------- | ------------------ | ------------------------------------------------------------------- | ---------- |
| `c53c5e8` | `R9-357`           | el disco entero, y una devolución sembrada en la lectura de la nota | A5         |
| `8e80f5b` | `R9-355`           | el primero repetido y tres estados en la última parte               | A1         |
| `e552e3b` | `R9-356`           | los estados de `R9-337` y `R9-344`, de a uno                        | A2         |
| `1121ec9` | `R9-353`           | otros estados tras los pedidos de `R9-345`, en las dos direcciones  | A3         |
| `28fa337` | `R9-354`, `R9-358` | el control de `R9-349` lee la clave de `prepWrite`, y no el orden   | A4         |

- **`R9-357` (`c53c5e8`, tanda 1):** una prueba nueva con todo método del mock fallando en toda clave
  durante el trabajo, y el caso de la lectura de la nota con una devolución de bob. Con el código bueno,
  57/57. Caen `migraQuitaMarcaEnCatch` (la de disco), `notaQuitaEnCatch`, `reintentaNotaFuera` (las
  dos), `reNotaEnCatchDev` (los dos casos de `R9-343` de la tabla) y `migraLeeEnCatchMultiGet` (la de
  disco).
  - **Cambio del orquestador sobre el diseño:** el agente esperaba mil vueltas antes de leer la nota, y
    con una quita con temporizador (`notaQuitaTimeout10`) pasaba. Con `relojesFalsos()` antes del
    trabajo y `unaHora()` en lugar de las vueltas, `notaQuitaTimeout10` y `…1000` caen en las dos;
    `notaQuitaTarde20` y `…990` caen, y `…1010` pasa (el corte de las vueltas, el mismo que midió el
    agente).
  - **Un disco de tres métodos no es un disco entero** (del agente): con solo los de `discoEntero348`,
    un `multiGet` en el `catch` de la migración pasa (`discoTres357+migraLeeEnCatchMultiGet`, 57/57,
    re-medido en la tanda 1). Con todos los métodos, cae.
  - `discoSinRestaurar357` (el disco fallando al terminar la prueba): 57/57, nada trabado para las
    siguientes (cada prueba tiene su almacén, `R9-340`).
- **`R9-355` (`8e80f5b`, tanda 2):** seis casos en la de `R9-344`: ana→beto→ana, nulo→ana→nulo y
  nulo→ana→beto→nulo, cada uno con y sin devoluciones. El último sin devoluciones no lo pedía la
  entrada: sin él, `claveDelSegundoEnDev` caía en una sola de las dos últimas partes (del agente).
  `ignoraPrimeroEnDev`, `claveUltimoDistintoEnDev` y `claveDelSegundoEnDev` caen (56/57).
- **`R9-356` (`e552e3b`, tanda 3):** los estados, de a uno, con una vuelta después de cada uno, en las
  dos pruebas. `claveDelPrimeroEnTrabajoMicro` cae en las dos y `claveDelPrimeroEnDevMicro` en la de
  `R9-344`; con la prueba de `8e80f5b` (`pat8e80f5b9`), las dos pasan 57/57. Las tres piezas de `R9-355`
  siguen cayendo con los estados de a uno: la prueba de los dos agentes, juntos.
  - **No se llevó** el control `retenidaTrasEstados` del agente (la migración seguía esperando tras el
    último estado): la puerta la abre solo la prueba, y abierta antes la ve `escritaAntesDeAbrir`
    (`abreAntesDelUltimo`, del agente: caen los dos controles).
- **`R9-353` (`1121ec9`, tanda 4):** la escritura y el respaldo pasan a un `it.each` de 4 casos (un
  estado; nulo, y beto tras los pedidos; ana, y nulo; nulo, y beto y nulo), y la lectura suma 6 (en
  cada parte, las dos direcciones y uno de varios). Los estados nuevos llegan de a uno, con el trabajo
  retenido y después del control de los pedidos. Con el código bueno, 63/63.
  - `valorAlPedirDurante` cae en 5 (las dos direcciones de la escritura y del respaldo, y la lectura);
    con las pruebas de `e552e3b`, pasa 57/57.
  - **Las dos direcciones hacen falta** (del agente, re-medido): `valorAlPedirDuranteSiCuenta` (toma
    el valor al pedir solo si no es nulo) cae solo por los X→nulo, y `…SiNulo` solo por los nulo→X: 3
    cada una.
  - **Y varios:** `claveDelPrimeroTrasPedir` (el primer estado tras el pedido) cae solo en los 3 casos
    de varios.
- **`R9-354` y `R9-358` (`28fa337`, tanda 5):** `vigilarClaves` espía también `prepWrite`; la de la
  escritura lee que ninguna clave recibida estaba resuelta al abrir, y cuáles recibió al final (las de
  la cuenta del último estado, por caso). El respaldo lee al abrir `{notas: true, resueltas: []}`, y
  `pedidasAlFinal` ordenada. Con el código bueno, 63/63.
  - `tardeClave2000+pideYDescarta` cae en los 4 casos de la escritura. Con las pruebas de `1121ec9`
    caía ya en los 2 de dirección, por los datos (§7).
  - `respaldoClavesJuntas` pasa; con la prueba de `1121ec9` (`bpt1121ec95`), caía en los 4 del
    respaldo. `lento2000+llegarRestaura` cae en los 4.
  - **Los dos residuos del agente, cerrados por `R9-353`:** un store que llama a `prepWrite` después de
    abrir (`notasLentoAntesPrepWrite1005+pideYDescarta`) cae en los dos casos de dirección de la
    escritura, y el `R9-354` del respaldo (`respaldoPideYDescarta`, el respaldo no pasa por
    `prepWrite`) con `lento2000` cae en los dos del respaldo. En `ee88726`, los dos pasaban (medido por
    el agente). Sin número: se abrieron antes de la 103 y los cierra la 103.
  - `ajenoEscritura354` (un `prepWrite` ajeno de `@prep_notes`): un rojo con el código bueno, no un
    verde falso.

## 2. El suite (tanda 6, sobre `28fa337`, `--maxWorkers=4`)

| corrida                         | suite (1044) | qué cae                                                                  |
| ------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `nada`                          | 1044/1044    | —                                                                        |
| `ignoraPrimeroEnDev`            | 1042         | `R9-344`, y la lectura de `R9-345`                                       |
| `claveUltimoDistintoEnDev`      | 1042         | `R9-344`, y la lectura de `R9-345`                                       |
| `claveDelSegundoEnDev`          | 1043         | `R9-344`                                                                 |
| `claveDelPrimeroEnTrabajoMicro` | 1039         | `R9-337`, `R9-344`, y la escritura, la lectura y el respaldo de `R9-345` |
| `claveDelPrimeroEnDevMicro`     | 1042         | `R9-344`, y la lectura de `R9-345`                                       |
| `valorAlPedirDurante`           | 1039         | la escritura, la lectura y el respaldo de `R9-345`                       |
| `tardeClave2000+pideYDescarta`  | 1029         | las de `tardeClave2000`, y la escritura de `R9-345`                      |
| `lento2000+llegarRestaura`      | 1033         | las de `lento2000`, y el respaldo de `R9-345`                            |
| `respaldoClavesJuntas`          | 1044/1044    | —                                                                        |
| `migraQuitaMarcaEnCatch`        | 1043         | la de disco entero                                                       |
| `notaQuitaEnCatch`              | 1042         | la de disco entero y la lectura de la nota de la tabla                   |
| `notaQuitaTimeout10`            | 1042         | las mismas                                                               |

Los casos nuevos de `R9-353` ven también varias piezas de otras entradas (la lectura, con los estados
tras los pedidos).

## 3. Las pruebas nuevas contra la lista de §5

Cada agente corrió la lista sobre su diseño (en su informe, con la pieza y la corrida de cada una):

- **La pieza que demora, antes y después del paso que lee** (70, 79, 85, 101): A1 con `migraLenta990`
  y `…1005` (el control da el rojo, no el daño) y `tardeClave2000`; A2 con `migraLenta500` y
  `entre1000`; A3 con `tardeClave2000`, `lento2000` y `notasPideTarde5`, también junto con la
  regresión; A4 con `tardeClave2000` y `notasLentoAntesPrepWrite990`/`1005` (el residuo de §1); A5 con
  `notaQuitaTarde<K>`, `lecturaLenta2000` y `migraLenta2000`.
- **Un ajeno** (88, 89): A4, `ajenoEscritura354` (un rojo) y `ajenoEscritura354b+notasSinPrepWrite`
  (el ajeno no ocupa el lugar del que falta). En las demás no hay un registro compartido que leer.
- **Un cambio bueno de la superficie** (82): A4, `respaldoClavesJuntas` y `respaldoClaveTarde1005`; A5,
  `migraConMultiGet` (§4).
- **Una falla que se repite y se extiende** (49, 100, 102): A5, el disco entero, `discoVentana357` (con
  el disco que vuelve, el reintento anda: no es un daño).
- **Varios, la forma, el tiempo** (96, 102): A1 y A3 (los casos de varios), A2 (de a uno).

## 4. Lo nuevo: `R9-359`

| hallazgo | qué                                                  | la pieza (y lo que tumba)                                     |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| `R9-359` | las pruebas fijan el método con que la migración lee | `migraConMultiGet`, un cambio bueno: `prep` 49/63, suite 1030 |

- Lo vio el agente 5 al correr contra su diseño un cambio bueno de la superficie (la regla de la 82).
  Re-medido en el principal (la matriz y la tanda 8): caen los dos casos de la migración de la tabla de
  las partes (que hacen fallar `getItem`) y las 12 pruebas que retienen la migración en
  `getItem('@prep_by_account')`. Es la clase de `R9-358`, sin arreglar: va al siguiente arreglo.
- **No se numera:** el `R9-354` del respaldo (`respaldoPideYDescarta`) y el store que llama a
  `prepWrite` tarde: se abrieron antes de la 103 y los cierra la 103 (§1).

## 5. La matriz

- **Qué corrió:** `S103-matriz.cjs.txt` sobre `28fa337`, 360 corridas en `prep`
  (`S103-matriz-correr.out.txt`, `S103-matriz-comparar.out.txt`): las 330 de la 102, las 37 que la 102
  corrió aparte, menos 28 que no aplican, más 18 de los agentes y del orquestador. Todas del `prep`
  entero; ninguna dejó el árbol sucio.
- **Las que no aplican (28, modo `anclas`):** las 8 de siempre, las 4 de `R9-353` ancladas en
  `ac1a7a5`, y 16 por los arreglos: las absorbe el diseño (`estadoTrasPedir345E`/`…saleE`, las
  `estadosSeparados*`, `notaSembrada348`, `casos355`), dos ancladas en el worktree de su agente
  (`ajenoEscritura354b`, `estadoTrasPedirRespaldo`), y dos cuya ancla aparece dos veces por la prueba de
  disco entero (`lecturaNoVuelve336`, `espiaArriba343`), re-ancladas como `…E` y comparadas con la
  original.
- **Contra la 102:** 228 caen igual y 84 pasan igual.
  - **46 distintas, todas explicadas:** 45 con caídas «solo hoy» (cobertura nueva, en las pruebas que
    los arreglos ampliaron: los casos de `R9-345`, la de disco entero, `R9-344`, `R9-337` y la lectura
    de la nota), 12 de ellas pasaban y hoy caen (las piezas de las seis entradas, y `devuelveTodas`, de
    la 94: manda lo restaurado a la «sin cuenta» aunque la cuenta no esté devuelta, y la ve el caso
    nulo→beto del respaldo). La otra: `respaldoClavesJuntas`, que ya no cae (`R9-358`).
  - **Ninguna «solo antes»** fuera de esa: no se perdió cobertura.
  - Las dos del agente sin salida en su worktree (`mismaTarea`, `discoTres357`): pasan, como dijo su
    agente.
- La escritura de `R9-345` es un `it.each` desde `1121ec9`: el comparador lleva su título nuevo al de
  antes, y los casos de un `it.each` cuentan como una sola prueba.

## 6. Lo que queda

- **Nuevo, sin arreglar:** `R9-359`.
- **Del Pendiente, sin tocar:** `R9-330` (decidido), `R9-333` y la cabecera de `prepMultiSet`;
  `ajenoDev298` y `:868`/`:1160`; el dueño de `migrateLegacyPrep`, `notaLenta50` y
  `respaldoPideTarde20`; lo que queda de `R9-347` y `backupPrepTurn.test.ts` sin aislamiento; el número
  de la etiqueta; `muereTrasEscribir`; y de la 102, «at the call» y la falla de una parte que tumba la
  siguiente de la misma clave.

## 7. Las lecciones

- **Aflojar un control que daba un rojo ante un cambio bueno puede quitarle una regresión que veía
  por ese rojo** (`R9-358`). Sobre la prueba del respaldo de `ee88726`, `respaldoPideYDescarta` con
  `lento2000` caía solo por la lista exacta de `pedidasAlAbrir`; con el control aflojado y nada más
  (`soloR358`), pasa. Lo vio el agente 4 en su diseño, y lo cierran los casos de `R9-353`. Es la regla
  de la 9 (dos arreglos en un diff) con un rojo, no con un verde. Medido (tanda 9).
- **Un caso donde el valor del pedido y el del final difieren da daño a una regresión que no lo tenía**
  (`R9-353`, `R9-354`). Con un solo estado, una clave tomada antes es la misma que la del final, y la
  regresión de `R9-354` solo la veía un control. Con un estado más tras los pedidos, la ven los datos:
  sobre `1121ec9`, sin el control de A4, `tardeClave2000+pideYDescarta` ya caía en los dos casos de
  dirección. Medido (tanda 5).
- **Un plazo que se mide con vueltas no ve un temporizador** (`R9-357`). La espera de mil vueltas
  antes de leer la nota dejaba pasar una quita con `setTimeout` de 10 ms
  (`vueltasSinReloj357+notaQuitaTimeout10`, 63/63); con una hora de reloj falso y mil vueltas, cae. Es
  la regla de la 85 (reloj Y vueltas) en una espera que no era de un control. Medido (tandas 1 y 7).
- **«Todo el disco» es todo método del almacén** (`R9-357`). Con los tres métodos de `discoEntero348`,
  un `multiGet` en un `catch` pasa (`discoTres357+migraLeeEnCatchMultiGet`, 57/57). Es la regla de la
  102 («se extiende») hasta los métodos. Medido (tanda 1).

## 8. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s103`, mientras la matriz corría en el principal.
- **Las piezas del ledger, en modo `anclas` sobre `28fa337`** (la regla de la 102): las 360 de la
  matriz aplican; `vueltasSinReloj357`, `soloR358` y las de las tandas 7 a 9 se corrieron sobre ese
  commit.
- **Las compuertas:** PENDIENTE
- **El mensaje de la 104** está en `_scratch/S104-PROMPT.md`.
