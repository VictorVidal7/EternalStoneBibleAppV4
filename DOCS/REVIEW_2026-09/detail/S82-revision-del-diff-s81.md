# Sesión 82 — revisión del diff de la 81 (2026-10-08)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S82-PROMPT.md` (el que
pegó Victor). Solo docs: no se tocó código ni pruebas.

- **Estado al empezar:** `main` = `origin/main` = `a32be3b`. Las dos ramas de la 81
  (`fix/s81-r311-r313` y `docs/review-s81-fix`, 4 commits) se mergearon en fast-forward con el OK de
  Victor (2026-10-08, «ok mi estimado»): `main` = `origin/main` = `c3123d6`. CI verde en el log: run
  `37810321907`, 3 jobs, Node v24.21.0, 374/4630. Las dos ramas se borraron tras `git cherry` vacío.
- **Rama:** `docs/review-s82-diff-s81` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 81 cae como dice. Dos nuevos P3 de pruebas: `R9-315` (lo abrió la 81) y
  `R9-316` (no lo abrió la 81). `R9-314` queda medido entero (`claveAntesDeFinish`). Quedan 316
  hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Las re-mediciones**, con las sondas de la 81 sobre `main` (`c3123d6`, mismas pruebas que
  `dcc7bfa`): `_scratch/S81-sonda1.cjs.txt`, `S81-sonda2` y `S81-sonda3` (salidas `S81-sondaN-*`).
- **Las piezas nuevas**, en `_scratch/S82-sonda.cjs.txt` (la `S81-sonda3`, más `claveEnvuelta`,
  `releaseTimer<ms>`, `<marca>X`, `salidaAbre`, `claveAntesDeFinish`, `lecturaAntes`,
  `lecturaDevolucion` y `arregloPendiente`; salidas `S82-sonda-*`, y el suite en
  `S82-suite1.out.txt`). `git status` limpio tras cada corrida.
- **Una sonda que corre en segundo plano edita el árbol:** mientras corre, no se lanza otra.

## 1. `R9-311` (`82de81f`): el control por identidad, y `escribio` desde la retención

- **Cae como dice** (`S81-sonda1`, `prep`):

  | corrida                     | resultado                                                             |
  | --------------------------- | --------------------------------------------------------------------- |
  | `nada`                      | 21/21                                                                 |
  | `claveCapturada`            | cae `R9-292`: `otraPedidaAntes: 0` en los dos casos `pedidaAntes`     |
  | `claveDosVeces`             | igual                                                                 |
  | `bpta32be3b+claveCapturada` | el diff de `genTrasSqlite` (`escribio: 1`, `Rom/8/28` perdido)        |
  | `genTrasSqlite`             | el rojo de siempre, en `pedidaAntes` y en `devolucionPedidaAntes`     |
  | `escrituraDeMas`            | cae solo `R9-273` (`retenida: 2`)                                     |
  | `lento50`                   | `retenida: 0` y `pedido: 0`, sin `escribio`; caen también 273/275/287 |
  | `turnoAntesDeClave`         | `retenida: 0` y `devuelta: 'trabada'`, sin `escribio`; cae `R9-310`   |

- **¿Hay una regresión que escriba antes de la retención, dañe, y no se cuente?** No encontré
  ninguna, por construcción (por lectura, sin pieza). Antes de la retención, la otra escritura o
  no se pidió (`conStore`, `conUnion` y `devolucion` la piden tras las 40 vueltas) o espera su clave
  retenida (los dos `pedidaAntes`). Para que escriba antes, el caso no se arma, y lo dice un control
  (`otraPedidaAntes: 0`, `retenida: 0` o `devuelta: 'trabada'`). Y una escritura que cae antes que
  la del respaldo la reemplaza el respaldo: se ve en `sinCuenta`.
- **La identidad de la promesa: `R9-315`.** Con `claveEnvuelta` (un cambio bueno: el store pasa
  `prepKey(...).then(k => k)` a `prepWrite`; un helper `async` hace lo mismo), `R9-292` cae solo
  en `otraPedidaAntes: 0`, en `pedidaAntes` y en `devolucionPedidaAntes`, con el caso armado: el
  resto del objeto sale igual. Suite 1001/1002. Con la prueba de `a32be3b`
  (`bpta32be3b+claveEnvuelta`), 21/21. La 81 midió el control contra regresiones, no contra un
  cambio bueno de su superficie. El comentario nombra solo el otro límite («guardado al cargar»).
  - **Hipótesis medida, `arregloPendiente`:** contar los `prepWrite` cuya clave sigue PENDIENTE
    tras una vuelta (con el primer estado de auth ya dado, solo lo está la retenida o algo derivado
    de ella). Sola, 21/21; con `claveEnvuelta`, 21/21; con `claveCapturada` y `claveDosVeces`,
    `otraPedidaAntes: 0`; con `genTrasSqlite` y `genTrasMultiSet`, el rojo de siempre; con
    `turnoAntesDeClave`, como hoy.

## 2. `R9-313` (`dcc7bfa`): el quinto caso y su salida

- **Cae como dice** (`S81-sonda3`, `prep`; los tiempos, con `--verbose`):

  | corrida                                     | resultado                                                                  |
  | ------------------------------------------- | -------------------------------------------------------------------------- |
  | `genTrasMultiSet`                           | cae solo el quinto (`escribio: 1`, `Rom/8/28` perdido)                     |
  | `bpt82de81f+genTrasMultiSet`                | 21/21                                                                      |
  | `genTrasSqlite`                             | caen `pedidaAntes` y el quinto, con el mismo rojo                          |
  | `turnoAntesDeClave`                         | 0.96 s: el quinto en `'trabada'`; `R9-275` pasa                            |
  | `sinSalida+turnoAntesDeClave`               | 41.0 s: `R9-292` y `R9-275` por timeout                                    |
  | `releaseLento100` / `101` / `1000` / `1001` | (`-t R9-292`) pasa / `'tarde'` / `'tarde'` / `'trabada'`, en los dos casos |

- **¿Un cambio bueno puede caer en el tope de 100?** Sí. En vueltas, `releaseLento101` (la 81). En
  tiempo, con un temporizador real al empezar `releasePrepAccount` (`S82-sonda`, `prep`):
  - `releaseTimer1` (1 ms): `devolucionPedidaAntes` da `'tarde'`, y `devolucion`, `'a tiempo'`,
    en la misma corrida. El corte en tiempo queda en el borde, y depende de la máquina;
  - `releaseTimer20`: `'trabada'` en los dos casos. Con la prueba de `82de81f`
    (`bpt82de81f+releaseTimer20`), `R9-292` pasa: para esta prueba, lo abrió la 81;
  - pero con los dos temporizadores caen también `R9-274` y `R9-275` en `prepAccount.test.ts`, con
    y sin la 81. Por ejemplo, `R9-274` da la Mesa bajo `:ana`, que se lee como una pérdida. El suite
    no aceptaba una devolución con temporizador desde antes: es lo pendiente de las vueltas fijas
    de `prepAccount.test.ts` (`detail/S70` §4).
  - Sin número: es el costo que eligió la 79 («llega tarde» da su propio rojo), y el rojo se
    distingue de la traba (con la traba, `devolucion` dice `'a tiempo'`).
- **Las marcas después de soltar la clave: es así** (re-medido con `S82-sonda`, `prep`):
  - `genEnDevolucion`, `genTrasDevolucion` y `genFinTurno` pasan 21/21;
  - `soltarDespues+genFinTurno` cae con `ana: ['Rom/8/28']` (y falta en la «sin cuenta»);
    `soltarDespues+genFinTurnoD` (con el desvío de `R9-275`) pasa.
  - **¿Una regresión real que ahí haga daño?** La clase de `generacion` decide al resolver la
    clave, y con la clave resuelta antes de la marca no se dispara. Probé la otra clase: una que
    decide AL TOMAR EL TURNO (`<marca>X`: si empezó un respaldo desde que la pidieron, descarta la
    escritura). `genEnDevolucionX`, `genTrasDevolucionX`, `genFinTurnoX` y
    `soltarDespues+genFinTurnoX` caen, con `Rom/8/28` perdido. No encontré una que dañe ahí sin que
    se vea.
- **La salida cubre solo la traba por la clave: `R9-316`.** Con `turnoAntesSqlite` (la pieza de la
  76: el respaldo toma el turno antes de SQLite y lo retiene; correcto en el teléfono, donde nada
  retiene SQLite), la devolución espera al respaldo, y el respaldo espera la puerta de SQLite de la
  prueba, que se abre después de la devolución.
  - Pasado el tope se suelta la clave, y `await devolver` sigue colgado. Medido: 41.6 s, y caen
    `R9-292` y `R9-275` por timeout (y los casos `durante` y `pedido antes` de `R9-287`, en
    `otraConElTurno: false`).
  - Con la prueba de `82de81f`, igual (41.1 s). `R9-275` sola (`-t R9-275`) también se cuelga
    (21.0 s): no es por arrastre.
  - **Hipótesis medida, `salidaAbre`:** pasado el tope, abrir también SQLite y la puerta del
    respaldo. Con `turnoAntesSqlite`, 0.88 s, y `R9-292` cae con `'trabada'` en los dos casos. Sola
    pasa; con `turnoAntesDeClave` (0.90 s) y con `genTrasMultiSet`, el rojo de siempre. `R9-275`
    necesita lo suyo.

## 3. `R9-312` (`e23b150`): `recibida` y `leido`

- **Cae como dice** (`S81-sonda2`, `prep`):
  - `claveSinEsperar` cae en `recibida: '@prep_notes'` (y «las claves esperan…», en `antes`);
  - `claveAntesDeUnion` cae en `leido: []`;
  - con la prueba de `a32be3b`: `pata32be3b+claveSinEsperar` tumba solo «las claves esperan…», y
    `pata32be3b+claveAntesDeUnion` pasa 21/21;
  - `claveAntesDelTurnoUnion` pasa.
- **¿`leido` dice «leyó después de que la unión escribiera»?** Sí, y no más. La de `ana` está vacía
  antes, y solo la unión pone `John/3/16-21` ahí: `leido` dice que la lectura vino después del
  `multiSet` de la unión. No dice «después de que la unión terminara» (su `multiRemove` de la «sin
  cuenta» y el marcador), pero nada de eso toca la de `ana`. Por lectura.
- **`claveAntesDelTurnoUnion` pasa con razón.** `migrateLegacyPrep` pide el turno de la unión en el
  mismo tick que `markKnown`, antes de que la escritura salga de `await key` (que tarda dos
  microtareas más). La escritura corre en su turno, después de la unión: para una escritura no hay
  daño. Por lectura.
- **`R9-314`: `lecturaAntes` no basta.** Medido ahora `claveAntesDeFinish` (la clave tras la unión y
  antes de `finishRelease`):
  - pasa `prep` (21/21) y el suite (1002/1002), y `lecturaAntes+claveAntesDeFinish` pasa;
  - la sonda `lecturaDevolucion` (sin sesión, con la devolución de `bob` pendiente, y
    `getAllPrepNotes()` pedido antes de `setPrepAccount(null)`): con el código bueno, 22/22; con
    `claveAntesDeFinish`, lee `[]`, y el control `despues` (leído al terminar) da `['Rom/8/28']`;
  - el arreglo de la 83 necesita las dos sondas.

## 4. Que sea solo la prueba

`git diff --stat a32be3b dcc7bfa`: `__tests__/backupPrepTurn.test.ts` y
`__tests__/prepAccount.test.ts`, 89 líneas más y 16 menos. Nada de la app.

## 5. La lección

- **Un control nuevo se corre también contra un cambio BUENO de su superficie.** La 81 midió el
  control por identidad contra regresiones (`claveCapturada`, `claveDosVeces`), no contra un
  `.then(k => k)`. Comparaba la identidad de la promesa, y lo que importa es que la escritura espera
  la clave retenida: que el control lea eso (la clave sigue pendiente), no la forma en que llegó.
- **Una salida armada para una traba cubre la traba que la motivó.** Medila también con una traba
  que llegue por otro camino (`turnoAntesSqlite`).
