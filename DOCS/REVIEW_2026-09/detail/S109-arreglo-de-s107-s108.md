# Sesión 109 — arreglo de lo de la 107 y la 108 (2026-10-26)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S109-PROMPT.md` y 6 agentes en worktree que
midieron los diseños antes de escribirlos (los pidió Victor: «Podrías mandar 6 agentes para avanzar
más?»; la regla de la 99). Cerrados `R9-381`..`R9-387`, con `R9-385` en `src/` (solo comentarios); dos
nuevos (`R9-388`, `R9-389`), los costos de dos arreglos. Dentro de las entradas, diez verdes falsos más
de las mismas clases (dos de A2, cuatro de A3, tres de A4 y uno de A5), cerrados con ellas.

- **Estado al empezar:** `main` = `origin/main` = `0d682da` (la 107); la 108 (`docs/review-s108-diff-s107`,
  `c8e5e96`, solo docs) sin mergear. Comprobado con `git fetch` y `git log -1 origin/main`; `main` no era
  más nuevo, así que el CI no se volvió a mirar. La rama de arreglos sale de `c8e5e96`.
- **Ramas:** `fix/s109-arreglos-s108` (`f13db80`: `src/` y la prueba de `R9-370`, `R9-385` y `R9-387`;
  `0e1c7b5`: la tabla, `R9-383`; `1d6d3a4`: la de `R9-344`, `R9-384`; `bd9ee9f`: la escritura de `R9-345`,
  `R9-381` y `R9-386`; `4839952`: el respaldo, `R9-382`) y `docs/review-s109-fix` encima, sin mergear hasta
  el OK de Victor.
- **Resultado:** 7 entradas cerradas; quedan 389 hallazgos, ninguno P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S109-gen.cjs.txt`: la `S109-sonda.cjs.txt` desde `S108-sonda.cjs.txt` (que ya tiene las piezas de la
    108 y de sus 3 agentes), con las piezas de `S109-propias.txt` y las de las copias de los agentes; con
    `<raíz del worktree> <N>` (N hasta 12) arma la sonda de cada agente. Probada en modo `anclas` antes de
    lanzar (las 41 piezas del ledger de la 108, todas aplican).
  - `S109-matriz.cjs.txt` (de `S108-matriz`, armada por `S109-matriz-hacer.cjs.txt`): primero
    `S109-matriz-extra.txt` (la verificación, 63), después las corridas de los agentes, y la lista entera
    de la 108 (`S108-matriz-todas.txt`, 797).
  - `S109-verif-ver.cjs.txt` y `S109-anclas-por-que.cjs.txt` (de las de la 108 y la 107).
  - `S109-limpiar.sh.txt` (de `S107-limpiar`): compara el `_scratch` de cada worktree con su copia y su
    diff guardado con su `git diff`, y lo quita.
- **Los agentes:** 6 `fork` con `isolation: "worktree"`, nacidos en `0d682da` (el mismo código que
  `c8e5e96`; sin `reset`), lanzados en cuanto `S109-gen` pasó `anclas`, con `--maxWorkers=3` y las reglas
  comunes en `_scratch/S109-agentes-reglas.md.txt`. Siete entradas en seis: A1 `R9-385` y `R9-387` (las
  frases); A2 `R9-383`; A3 `R9-384`; A4 `R9-386`; A5 `R9-381`; A6 `R9-382`. A4 y A5 tocaban la misma
  prueba: cada uno supo qué hacía el otro y de qué lado quedaba.
  - Completaron los seis sin cortes (200-248k tokens, 35-77 llamadas: los seis pasaron el tope de ~25;
    6-17 min).
  - **Los worktrees** (todos con su diseño sin commitear): ninguno se borró solo. `S109-limpiar.sh.txt`:
    `_scratch` igual a su copia, diff guardado igual a `git diff`, sin junction; `remove --force --force`
    - `branch -D`.
- **La integración:** los seis diffs se aplicaron sin conflictos sobre `c8e5e96` (`git apply`, en el
  orden A5, A1, A2, A3, A4, A6) y se commitearon de a uno, con el hook. El orquestador cambió dos
  comentarios: el de los casos sin dueño de `R9-344` (la frase que A3 dejó corta) y el de `R9-382` (el
  costo de la copia, escrito).
- **La verificación:** cada pieza de cada entrada, en el principal sobre `4839952` (las 63 de
  `S109-matriz-extra.txt`): cada una cae con lo integrado y pasa con la prueba de `27d598b`
  (`pat27d598b+…`), o, en el respaldo, cae igual con la de `1e9e809` cuando ya la veían los datos.

## 1. `R9-385` (src) y `R9-387`

- **Las cabeceras** de `prepKey` y `migrateLegacyPrep`: la Mesa de antes va a la cuenta de cuando le
  llega el turno a la mudanza, y se separa de las claves si llega un estado desde entonces hasta el final
  del trabajo (durante la unión de la mudanza o su marca, o mientras se devuelve). Cada oración, leída
  entera (la regla de la 92); ninguna pieza ancla en ellas.
- **Tres casos en la prueba de `R9-370`**, en la ventana (la lectura de la unión retenida, ana→nulo; la
  escritura de la marca retenida, en las dos direcciones), con el pasaje partido como esperado. Los
  distinguen dos regresiones nuevas que la prueba de antes no veía: `mueveCuentaTrasLeer385` (lee la
  Mesa y después la cuenta) y `mueveSigueAlUltimo385` (tras la marca, une a la cuenta de ahora).
  «Mientras se devuelve» lo cubren los casos sin dueño de `R9-344` (A3).
- **`R9-387`:** sale la causa falsa de `tiempoYVueltas` (qué cambio la bajó sigue sin medir), y
  `vueltasYReloj` escribe su corte (998 vueltas lo ve disco entero; 999, no).

## 2. Las entradas de las pruebas

- **`R9-383`** (A2): cinco filas sin dueño con `ana` y una gemela de disco entero que sí llega a la
  mudanza. Las siete piezas de la entrada caen, cada una en su fila, y dos más de la clase
  (`mueveReintentaFuera109`, `mueveMarcaEnCatch109`) que pasaban.
- **`R9-384`** (A3): cuatro casos sin dueño en la de `R9-344`, dos de ellos de tres estados: con uno solo,
  las formas de `R9-351` y `R9-355` tras la mudanza (cuatro gemelas nuevas) pasaban `prep` y el suite.
- **`R9-386`** (A4): Cata tras el trabajo en la escritura de `R9-345`, con su control. Caen
  `notasRepideSiPendiente2000` y sus gemelas en series, ilustraciones y autoevaluación (estas tres
  pasaban el `prep` entero: ni `R9-292` las veía).
- **`R9-381`** (A5, el «B» de seis diseños medidos): el «de quién» por la pila al pedir, con la marca por
  `.then`. La clave envuelta pasa; el ajeno marcado y uno de `src/` (`ajenoSeriesNotas`) caen. Con `R9-386`
  puesto (medido junto en el principal), `notasEncadenaRepide2000` cae en los casos.
- **`R9-382`** (A6): el pedido del respaldo, por quien llama o por la clave que llega a `prepMultiSet`
  (cada pedido con su `String` envuelto). Los dos cambios buenos pasan; `R9-377` sigue cerrado.

## 3. Lo nuevo

| hallazgo | qué                                                                                              | la pieza                         | agente |
| -------- | ------------------------------------------------------------------------------------------------ | -------------------------------- | ------ |
| `R9-388` | el «de quién» por la pila al pedir y la marca por `.then`: un `async` que espera la clave        | `notasClaveAsync`                | A5     |
| `R9-389` | el pedido del respaldo por la clave que escribe: una copia de la cadena; `src/` recibe un objeto | `respaldoClaveOtroModuloCopiaA6` | A6     |

Los dos, los costos medidos de dos arreglos (`R9-388` ya caía con la prueba de antes).

## 4. La matriz

- **Qué corrió:** `S109-matriz.cjs.txt correr` sobre `4839952`, 995 corridas en `prep` con
  `--maxWorkers=3` (`S109-matriz-correr.out.txt`; ninguna dejó el árbol sucio): las 63 de la verificación,
  las de los agentes, 4 piezas sin corrida de agente y las 797 de la 108. Contra la 108
  (`S109-matriz-comparar.out.txt`; las cuentas por origen, con `S109-matriz-cuentas.cjs.txt`):
- **De las 797 de la 108:** 655 dan lo mismo; 122 cambian, y 119 de ellas solo suman caídas (las filas
  y los casos nuevos ven más regresiones: la gemela de disco entero de `R9-383` en 89 corridas, la fila de
  la nota sin dueño en 85). Las otras tres:
  - `cedeConTimeoutEnNota0` (un cambio bueno): en la 108 caía en `R9-310`; aquí pasó, y re-corrida dos
    veces, cayó una (la carrera de reloj real que la 108 ya vio con `migraLenta2000`, la clase que la
    nota de `R9-374` deja fuera). No es de la 109.
  - `sinEstadoTardio+respaldoClaveOtroModulo`: pasa porque `R9-382` dejó pasar el cambio bueno.
  - `sinCentinela360+relojesTrasCorrer360b+notaQuitaTimeout1000` (una regresión con la espera debilitada):
    pasaba; ahora la ve la gemela de disco entero de `R9-383`.
- **Ninguna corrida de la 108 deja de ver una prueba que veía**, salvo esas dos primeras.
- **No aplican 18:** las 10 de siempre, más 8 de cuatro piezas cuyo texto cambió la 109:
  `ajenoTrasAbrir354` (por el estado tardío de `R9-386`; re-anclada como `ajenoTrasAbrir354b`, que cae
  igual con `notasSinPrepWrite`, 66/78) y tres diseños de A7 de la 107 sobre el filtro del respaldo
  (`pilaEnteraA7`, `sinEsperaContadaA7`, y `ajenoNotasTarde358D`, re-anclada por A6 como
  `ajenoNotasTarde358DA6`). Dos más no son de un `prep` entero (`salta275bpt`, `salta292bpt`, como en la
  108).
- **Las de los agentes y las nuevas (198):** 68 dan lo mismo que en su worktree; 15 cambian porque lo
  integrado tiene las pruebas de los otros agentes (ninguna de caer a pasar); 10 las corrió el agente con
  `-t`; 6 no tienen salida de un agente (tres de la verificación, y tres piezas de A6 que su agente corrió
  solo combinadas: `soloUsadaA6`, `soloMarcoA6` y `ajenoNotasTarde358DA6`, que solas pasan, 78/78); y 99 no
  aplican: los seis diseños que midió A5 como piezas sobre la prueba de antes (`a5Diseno*`, `a5Atrib`).

## 5. Lo que queda

- **Nuevo, sin arreglar:** `R9-388` y `R9-389`.
- **Sin medir:** un ajeno en el mismo módulo del store (`R9-388`); `src/` con un objeto como clave en el
  respaldo (`R9-389`); `mueveSinTurno370` con el turno ocupado; varios estados durante la mudanza; la
  lectura de `@prep_notes:ana` de la mudanza, sin fila; otros plazos en `vueltasYReloj`; qué cambio de
  las pruebas bajó el corte de `R9-373`; un `giveBack` ajeno entre la nota y la mudanza.
- **Del Pendiente, sin tocar:** `R9-330` (decidido); la cabecera de `prepMultiSet` (`R9-327`); lo que
  queda de `R9-347`; un verde falso de `mockSqlite.retenida`; el daño de `R9-377` con un respaldo sin
  series; `notasPideDosVeces` en la lectura; `intervaloInocuo1`.

## 6. Las lecciones

- **Una pieza de un store pide la misma en los otros tres** (`R9-386`): la entrada nombraba la de notas;
  las de series, ilustraciones y autoevaluación pasaban el `prep` entero. Es la regla de la 108 (cada
  pieza pide su gemela), entre stores.
- **La forma de un caso va con su camino nuevo** (`R9-384`): un caso sin dueño con un estado no ve las
  formas de varios estados; hicieron falta los de tres. Las reglas de la 100 y la 102, en el camino que
  abrió la 107.
- **Dos diseños en la misma prueba se miden juntos** (`R9-381`, `R9-386`): con la marca por `.then` sola,
  `notasEncadenaRepide2000` pasaba los casos; con el estado tras el trabajo, cae. Ningún agente los midió
  juntos: lo hizo la verificación en el principal.
- **Un espía que devuelve otro tipo cambia lo que recibe el código bajo prueba** (`R9-389`): para contar
  por identidad, el respaldo recibe un `String` envuelto. Escribilo como costo, con lo que no se midió.

## 7. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s109`, mientras la matriz corría en el principal; pasado al
  principal con un parche (`_scratch/S109-docs.diff.txt`) y commiteado ahí, con el hook.
- **Antes de cerrar** (la regla de la 102): las piezas del ledger (las 63 de `S109-matriz-extra.txt`, las
  40 de `S108-matriz-extra.txt` y `caminos108p`) en modo `anclas` sobre `4839952`: 104, todas aplican,
  árbol limpio (`S109-anclas-cierre.out.txt`).
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` (en el principal, con el del
  repo: en el worktree de docs, sin `node_modules`, `npx` había bajado otro), y `npm run validate` con
  `NODE_ENV=development`, sin worktrees (`_scratch/S109-validate.out.txt`): typecheck limpio, lint con 0
  errores (los 70 avisos de siempre) y `format:check` limpio. **Jest no terminó:** Claude Code cortó el
  proceso a mitad de la corrida por falta de memoria del sistema, y no se volvió a correr sin el OK de
  Victor. Lo que sí se corrió: `prep` entero sobre `4839952` (78/78), la matriz (995 corridas en `prep`) y,
  sobre su diseño, el suite de A3 (1053/1053).
- **El mensaje de la 110** está en `_scratch/S110-PROMPT.md`.
