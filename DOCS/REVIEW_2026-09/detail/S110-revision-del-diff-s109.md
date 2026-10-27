# Sesión 110 — revisión del diff de la 109 (2026-10-27)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S110-PROMPT.md` y 10 agentes en worktree que
solo midieron (los pidió Victor: «Podrías mandar 10 agentes por favor para avanzar más rápido?»). La
segunda vuelta de la 109 (la regla de la 60): cada agente atacó una parte de lo integrado, empezando por lo
que el orquestador juntó. Once nuevos (`R9-390`..`R9-400`), ninguno P0; quedan 400 hallazgos.

- **Estado al empezar:** `main` = `origin/main` = `d229e67` (la 108 y la 109, mergeadas y pusheadas con el
  OK de Victor; CI verde en el log, run `40437095524`, 374/4687). Comprobado con `git fetch` y
  `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar. Los docs decían
  «sin mergear» para la 108 y la 109: corregido aquí.
- **Rama:** `docs/review-s110-diff-s109` (solo docs), sin mergear hasta el OK de Victor.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S110-gen.cjs.txt` (de `S109-gen`, armada por `S110-hacer-gen.cjs.txt`): la `S110-sonda.cjs.txt` desde
    `S109-sonda.cjs.txt`, con las piezas de `S110-propias.txt` (vacío) y las de las copias de los agentes;
    con `<raíz del worktree> <N>` (N hasta 12) arma la sonda de cada agente. Probada en modo `anclas`
    antes de lanzar: las 63 piezas del ledger de la 109 aplican, árbol limpio.
  - `S110-matriz.cjs.txt` (de `S109-matriz`, armada por `S110-matriz-hacer.cjs.txt`): primero
    `S110-matriz-extra.txt` (la verificación, 57), después las corridas de los agentes, y la lista entera
    de la 109 (`S109-matriz-todas.txt`, 995). `S110-verif-ver.cjs.txt` muestra la verificación.
- **Los agentes:** 10 `fork` con `isolation: "worktree"`, nacidos en `d229e67` (sin `reset`), lanzados en
  cuanto `S110-gen` pasó `anclas`, con `--maxWorkers=2` y las reglas comunes en
  `_scratch/S110-agentes-reglas.md.txt`. Una mirada estrecha cada uno: A1 las cabeceras de `src/`; A2 los
  casos nuevos de `R9-370`; A3 el diseño de A5 de la 109 (`R9-381`) con el de A4 puesto, y `R9-388`; A4 el
  de A4 (`R9-386`) con el de A5 puesto; A5 el `String` envuelto en `src/` (`R9-389`); A6 la regla de
  conteo del respaldo (`R9-382`); A7 las filas de la mudanza (`R9-383`); A8 los casos sin dueño de
  `R9-344` (`R9-384`); A9 los comentarios de las pruebas; A10 `vueltasYReloj` y `tiempoYVueltas`
  (`R9-387`).
  - Completaron los diez sin cortes (199-238k tokens, 21-58 llamadas, 4-10 min). Los diez worktrees se
    borraron solos con sus ramas (sin cambios): las copias (`_scratch/S110-sondas-agente-N/`, 30-75
    archivos) son lo único que queda.
  - **Desliz del orquestador:** la mirada de A10 pedía, «si alcanza», qué cambio de las pruebas bajó el
    corte de `R9-373`, que el mensaje dejaba en el Pendiente («NO salvo que te lo pida»). A10 lo midió
    (abajo, §3); no se re-midió en el principal ni va al ledger. Lo mismo el daño de `R9-377` con un
    respaldo sin series, que A6 midió para `R9-395`.
- **La verificación:** las 57 corridas de `S110-matriz-extra.txt`, en el principal sobre `4839952`
  (`--maxWorkers=3`, tras terminar los agentes): todas dan lo que dijo su agente, árbol limpio.

## 1. Lo que se sostiene

- **`R9-385` en `src/`** (A1): once lecturas al pie de la letra de las cabeceras de `prepKey` y
  `migrateLegacyPrep`, hechas piezas; diez caen en `prep` (`mueveSinEsperar110` 72/78,
  `cuentaAntesDeNota110` y `cuentaAlNoHallarDueno110` 77/78, `mueveNoMarcaSinCuenta110` 66/78, y las de la
  108 y la 109). La única que pasa, `mueveSinTurno370`, es el momento sin caso de `R9-399`.
- **Los dos diseños juntos en la escritura de `R9-345`:** lo que A5 de la 109 midió solo da lo mismo con
  Cata puesto (A3: `notasClaveEnvuelta`, `claveEnvuelta`, `notasPrepWriteSinMarco` 78/78;
  `notasClaveAsync` 72/78; `ajenoMarcado371`, `ajenoSeriesNotas`, `pideYDescarta`,
  `notasEncadenaRepide2000`, como en la 109); y lo de A4 da lo mismo con la marca por `.then` (A4: V0
  pasa, V1 cae, en los cuatro stores). Las gemelas de `notasEncadenaRepide2000` en series, ilustraciones y
  autoevaluación, que nunca se habían corrido, caen en los 6 (72/78, re-medidas en el principal).
- **El respaldo:** la espera de Cata y la copia de la cadena no tienen hueco propio (A6:
  `ajenoSondeoA6`, `respaldoRepideCopia<K>A6`).
- **Los comentarios que escribió o juntó el orquestador de la 109** (A9): el de los casos sin dueño de
  `R9-344` y el del costo de `R9-382` se sostienen.
- **Los números de `tiempoYVueltas`** (A10), sobre lo integrado.

## 2. Lo nuevo

| hallazgo | qué                                                                                      | la pieza                                  | agente |
| -------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- | ------ |
| `R9-390` | el `String` envuelto esconde una regresión que pierde las series restauradas sin cuenta  | `restauraSaltaSeriesSinCuenta110A5`       | A5     |
| `R9-391` | la lectura de la Mesa de destino de la mudanza, sin fila: se pierde prosa                | `mueveDestinoTolerante110`                | A7     |
| `R9-392` | ilustraciones y autoevaluación sin sembrar en la Mesa de antes sin dueño                 | `mueveListaAMano110`                      | A7     |
| `R9-393` | sin devoluciones, varios estados en la mudanza: cuatro formas de `R9-351`/`R9-355` pasan | `claveDelPrimeroEnMudanza110` y tres más  | A8     |
| `R9-394` | un ajeno del mismo módulo del store (también desde otro store), y el corte de la pila    | `ajenoSeriesPorNotasA3`, `pilaLimiteA3x5` | A3     |
| `R9-395` | un export en paralelo tapa la regresión de `R9-377`                                      | `ajenoExportA6`                           | A6     |
| `R9-396` | el tope de cien mil vueltas de Cata tiene un corte en tiempo real                        | `migraUnionTimeout1000A4`                 | A4     |
| `R9-397` | la frase de `R9-376` contradice a `R9-382`; seguida, vuelve el rojo                      | `resueltoComoR376A9`                      | A9     |
| `R9-398` | la gemela de disco entero dice que falla la marca, y no se intenta                       | `marcaIntentadaA9`                        | A9     |
| `R9-399` | el momento «when its move's turn comes», sin caso: el turno siempre está libre           | `turnoOcupado110` + `mueveSinTurno370`    | A2     |
| `R9-400` | `vueltasYReloj` escribe el corte con «10 ms», y no depende del plazo                     | `notaQuitaYLenta998x0`/`x1000`            | A10    |

- **Abiertos por la 109:** `R9-390`, `R9-397`, `R9-398`, `R9-400` y, en la escritura, `R9-396`. Los demás
  vienen de la 107 (o de la 105, el tope del respaldo), y la 109 no los cerró.
- **Con daño medido:** `R9-390` (series restauradas perdidas), `R9-391` (prosa perdida), `R9-392` (dos bases
  fuera de la vista de su dueña), `R9-393` (mezcla de cuentas). `R9-399` tiene daño en la prueba-sonda, con
  un ocupante del turno que la app, por lectura, no tiene.

## 3. Lo medido fuera del alcance (sin re-medir en el principal)

- **Qué bajó el corte de `R9-373`** (A10, pedido por error del orquestador): con la tabla esperando los
  estados directo, como en `02d8e93` (`esperaDirectaA10`, solo para medir), las filas de la nota vuelven a
  1003/1004 con dos horas (1005/1006 con 10 ms), y las de disco entero no se mueven. Por esto, la vuelta de
  menos vendría de `esperarConReloj` en la tabla (el cambio de `R9-374` en la 107), solo en las filas de la
  nota. Queda en el Pendiente hasta que Victor lo pida.
- **El daño de `R9-377` con un respaldo sin series** (A6, `respaldoSinSerieA6`): con la regresión, el
  respaldo escribe durante el trabajo, y en nulo→beto se pierde la Mesa de antes y lo restaurado va a la
  Mesa de Ana. Queda en el Pendiente.

## 4. La matriz

- **Qué corrió:** `S110-matriz.cjs.txt correr` sobre `4839952`, 1136 corridas en `prep` con
  `--maxWorkers=3` (`S110-matriz-correr.out.txt`; ninguna dejó el árbol sucio): las 57 de la verificación,
  las 186 de los agentes, 2 piezas sin corrida sola de agente y las 995 de la 109. Contra la 109 y contra el
  worktree de cada agente (`S110-matriz-comparar.out.txt`).
- **De las comparadas con la 109:** 829 dan lo mismo (627 caen, 202 pasan). Dos cambian, las dos por
  carreras de reloj real, intermitentes, y ninguna es de la 109:
  - `cedeConTimeoutAlEmpezar0` (un cambio bueno): en la 109 caía en `R9-310`; en la matriz pasó, y
    re-corrida dos veces cayó las dos (la clase de `cedeConTimeoutEnNota0` en la 109).
  - `claveDelPrimeroEnTrabajoTimeout10` (una regresión con un temporizador de 10 ms): la prueba de `R9-370`
    la vio en la 109 y no en la matriz; re-corrida, una de dos. Las otras cinco pruebas que la ven, siempre.
- **No aplican 117:** las 18 de la 109 (las 10 de siempre y 8 de piezas cuyo texto cambió la 109) y los 99
  diseños de A5 de la 109 (`a5Diseno*`, `a5Atrib`). Dos no son de un `prep` entero (`salta275bpt`,
  `salta292bpt`, como en la 108 y la 109).
- **Las de los agentes (186):** todas dan lo mismo que en su worktree. Las cuatro `migraUnionTimeout<MS>A4`,
  que su agente corrió con `-t`, en el `prep` entero: 100 ms pasa; 300, caen los 4 del respaldo; 1000 y
  2000, los 8. Dos piezas de A3 sin corrida sola (`ajenoMismoModuloIlusA3`, `ajenoMismoModuloAutoA3`): 72/78
  (cuentan de más, como la de notas).

## 5. Lo que queda

- **Nuevo, sin arreglar:** `R9-390`..`R9-400`, más `R9-388` y `R9-389` (los arregla la 111).
- **Sin medir:** un ajeno del mismo módulo que llegue después de abrir o después de Cata (`R9-394`); el
  corte en tiempo de Cata sin carga y en los casos de `R9-369` (`R9-396`); un borrado de cuenta durante el
  primer estado (`R9-399`); una regresión de la marca de la mudanza que aparezca solo con la falla
  extendida (`R9-398`); el espejo de `uniendoAnaYNulo` con tres estados (`mueveCuentaTrasLeerSiNulo110`,
  A2: una ventana que el código bueno no tiene); las variantes `Map`, `switch` e `includes` de `R9-390`.
- **Del Pendiente, sin tocar:** `R9-330` (decidido); la cabecera de `prepMultiSet` (`R9-327`); lo que
  queda de `R9-347`; un `giveBack` ajeno entre la nota y la mudanza; qué cambio bajó el corte de `R9-373`
  (medido por A10, sin re-medir); un verde falso de `mockSqlite.retenida`; el daño de `R9-377` con un
  respaldo sin series (medido por A6, sin re-medir); `notasPideDosVeces` en la lectura; `intervaloInocuo1`.

## 6. Las lecciones

- **La última parte del trabajo depende de los datos** (`R9-393`): sin devoluciones, es la mudanza; los
  casos de tres estados estaban solo en el camino con dos devoluciones. La regla de la 99 («retené la
  última parte») se corre en cada camino que cambia cuál es la última.
- **Un costo escrito «sin medir» se mide con una regresión que dependa de él** (`R9-390`): la 109 escribió
  que `src/` recibe un objeto; con un espía de control que devuelve la cadena, una regresión de `!==` pasa
  con el objeto y pierde datos con la cadena. La regla de la 88, en el costo de un espía.
- **Una fila por lectura del camino, no solo por paso** (`R9-391`, `R9-392`): las filas de la mudanza
  fallaban la lectura de la «sin cuenta» y sembraban una base; la de destino y las otras bases no tenían
  ni fila ni datos. Las reglas de la 104 y la 108, dentro de una parte.
- **Un momento que una frase nombra necesita un caso donde difiera del vecino** (`R9-399`): con el turno
  siempre libre, «al tener el turno» y «al pedirlo» son el mismo momento. La regla de la 78.
- **Un arreglo que cambia lo que cuenta un control re-mide la frase vieja del control** (`R9-397`): la 109
  escribió «todo pedido» debajo de una frase que decía lo contrario. La regla de la 95.
- **Antes de lanzar, cruzá cada mirada contra el Pendiente del mensaje** (el desliz de esta sesión).
- **Un parche de `git diff` no lleva los archivos nuevos:** el de este checkpoint perdió el detalle al
  quitar el worktree de docs con `--force`, y se reescribió en el principal. `git add -N` antes del
  `diff`, o copiar los nuevos aparte.

## 7. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s110`, mientras la matriz corría en el principal; pasado al
  principal con un parche (`_scratch/S110-docs.diff.txt`; el detalle, reescrito) y commiteado ahí, con el
  hook.
- **Antes de cerrar** (la regla de la 102): las piezas del ledger (las 57 de `S110-matriz-extra.txt` y las
  63 de `S109-matriz-extra.txt`) en modo `anclas` sobre `4839952`: 120, todas aplican, árbol limpio
  (`S110-anclas-cierre.out.txt`). Y `restauraSaltaSeriesSinCuenta110A5` en el suite, en el principal:
  125/125 suites, 1059/1059 (`R9-390`).
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` en el principal, y
  `npm run validate` con `NODE_ENV=development`, sin worktrees, en primer plano
  (`_scratch/S110-validate.out.txt`): typecheck limpio, lint con 0 errores (los 70 avisos de siempre),
  `format:check` limpio y jest 374/374 suites y 4687/4687 pruebas.
- **El mensaje de la 111** está en `_scratch/S111-PROMPT.md`.
