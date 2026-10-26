# Sesión 107 — arreglo de lo de la 105 y la 106 (2026-10-21)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S107-PROMPT.md` y 12 agentes en worktree que
midieron los diseños antes de escribirlos (los pidió Victor: «Podrías mandar 12 agentes para avanzar
más?»; la regla de la 99). Cerrados `R9-367`..`R9-380`, con `R9-370` en `src/`; dos nuevos (`R9-381`,
`R9-382`), los costos de dos arreglos.

- **Estado al empezar:** `main` = `origin/main` = `02d8e93` (la 106, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `39517664016`, 3 jobs, 374/4672). Comprobado con `git fetch` y
  `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar. Los docs decían
  «sin mergear» para la 106: corregido aquí.
- **Ramas:** `fix/s107-arreglos-s106` (`a0323d7`: `src/` y `prepAccount.test.ts`; `1e9e809`:
  `backupPrepTurn.test.ts`; `27d598b`: los cortes de `R9-373`, re-medidos sobre lo integrado) y
  `docs/review-s107-fix` encima, sin mergear hasta el OK de Victor.
- **Resultado:** 14 entradas cerradas; quedan 382 hallazgos, ninguno P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S107-gen.cjs.txt`: la `S107-sonda.cjs.txt` desde `S106-sonda.cjs.txt`, con las piezas de
    `S107-propias.txt` y las de las copias de los agentes; con `<raíz del worktree> <N>` (N hasta 12) arma
    la sonda de cada agente. Probada en modo `anclas` antes de lanzar (27 corridas, todas aplican).
    **Re-ancla** las piezas de antes donde `R9-370` cambió el texto de `src/` y el código nuevo hace lo
    mismo por el camino con dueño registrado (el que usan la tabla, `R9-344` y `R9-345`): la llamada del
    trabajo, la marca, la nota de devoluciones, la lectura del dueño y la unión.
  - `S107-matriz.cjs.txt`: primero `S107-matriz-extra.txt` (la verificación de cada entrada, 62), después
    las corridas de los agentes y la lista entera de la 106.
  - `S107-anclas-por-que.cjs.txt` (por qué no aplica cada corrida), `S107-empalme.cjs.txt`,
    `S107-resolver-bpt.cjs.txt` (el conflicto de A5 y A12) y `S107-limpiar.sh.txt` (los worktrees).
- **Los agentes:** 12 `fork` con `isolation: "worktree"`, nacidos en `02d8e93` (sin `reset`), lanzados en
  cuanto `S107-gen` pasó `anclas`, con `--maxWorkers=2` y las reglas comunes en
  `_scratch/S107-agentes-reglas.md.txt`. Una entrada (o dos pegadas) por agente:
  - **A1** `R9-370` en `src/` (arreglo, cabeceras y prueba); **A2** su hipótesis y sus regresiones;
  - **A3** `R9-367`; **A4** `R9-368`; **A5** `R9-369` (escritura y respaldo); **A6** `R9-371` + `R9-378`;
    **A7** `R9-377` + `R9-376`; **A8** `R9-375`; **A9** `R9-373`; **A10** `R9-374`; **A11** `R9-379`;
    **A12** `R9-380`.
  - Completaron los doce (178-216k tokens, 27-60 llamadas: casi todos pasaron el tope de ~25; 5-9 min).
  - **El límite de uso:** Victor avisó que llegaba a la cuota; `SendMessage` a los 10 vivos («guardá ya»).
    A6 se cortó con «You've hit your session limit» con su tanda 2 en segundo plano, ya terminada; tras el
    reset, un `SendMessage` lo retomó y cerró en 4 llamadas.
  - **Los worktrees:** el de A2 (sin cambios) se borró solo; los otros 11 tenían su diseño sin commitear:
    `_scratch` igual a su copia, diff guardado igual a `git diff`, sin junction, y
    `git worktree remove --force --force` + `git branch -D` (`S107-limpiar.sh.txt`).
- **La integración:** los diseños con `git apply --3way` en orden (A1, A9, A12, A3, A4, A11, A6, A10, A5,
  A8, A7). Un conflicto (A5 y A12 en la retención del respaldo: quedan los dos, con la guarda de A5) y tres
  choques: el formato de `recibidasAlFinal` de A6 en los casos de A5, las `claves` de A3 en la fila de A4,
  y un `vuelta` que A10 dejó sin uso.

## 1. `R9-370` (src)

- **El diseño:** el «c» del agente 2, escrito en `src/` por el orquestador. Sin dueño registrado,
  `migrateLegacyPrep` devuelve que falta mover, y `finishRelease` mueve la Mesa de antes
  (`moveUnownedPrep`) tras leer la nota de devoluciones y antes de la primera, con la cuenta leída en el
  turno de la unión. Con dueño, como antes.
- **Por qué «c» y no el de A1** (la cuenta al leer el dueño): con `ana` llegando mientras se lee la nota,
  el pasaje quedaba partido igual que hoy (`migraLeeCuenta370`). **Y no al pie de la letra de la §7** (al
  final del trabajo): unir tras las devoluciones se lleva la Mesa devuelta de Bob a la de Ana
  (`mueveTrasDevolver370`). El corte que queda (un estado mientras se devuelve), escrito en las
  cabeceras; por lectura, sin medir.
- **Un segundo caso partido** (A2): `ana` y nulo en la misma tarea (el espejo) también salía partido; la
  prueba lo tiene.
- **La prueba:** seis casos; cae con el `src` de antes y con cinco regresiones, y pasa con un cambio de
  forma (la entrada de `R9-370`).
- **La tabla:** la marca va por dos caminos; una fila por camino, cada una vista caer.
- **Lo que pidió la §7, medido:** con dueño registrado, nulo→nulo y `R9-331`, `R9-337` y `R9-344`, igual
  que hoy (el `prep` entero, y la matriz).

## 2. Las entradas de las pruebas

Lo de cada una está en su entrada de `BUGS.md` («ARREGLADO en la sesión 107»). En corto:

| entrada  | diseño                                                                 | se ve fallar con                                   |
| -------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `R9-367` | la tabla compara `claves`                                              | `mesaAjenaQuitadaAlFallarNota`                     |
| `R9-368` | «su aviso está», y una fila que falla una vez                          | `notaLanzaTrasFalla`, `notaSaltaTrasFalla`         |
| `R9-369` | casos con una devolución pendiente en la escritura y el respaldo       | `noMueveDescartaNotas`, `noMueveDescartaRestaura`  |
| `R9-371` | el pedido por la identidad de la promesa                               | (las de la pila; `notasPrepWriteSinMarco` pasa)    |
| `R9-373` | los cortes, escritos                                                   | (comentario)                                       |
| `R9-374` | `vueltasYReloj` y `esperarConReloj`                                    | (los 4 cambios buenos ya no traban)                |
| `R9-375` | un `mockSqlite` por prueba, y su pareja                                | `sinSqliteNuevoA8`                                 |
| `R9-376` | la espera de Cata con un pedido contado                                | (`respaldoClaveOtroModulo`, sin columnas del daño) |
| `R9-377` | el pedido de quien llama a `prepKey`                                   | `ajenoDesdeRespaldo+respaldoNotasTrasSeries`       |
| `R9-378` | `pedidas` como conjunto                                                | (18 regresiones siguen cayendo)                    |
| `R9-379` | los controles, comparados en los casos con estados                     | `lecturaAlSiguienteDevCuenta`                      |
| `R9-380` | la marca retenida también en `getAllKeys`; el «orden», un rojo honesto | `migraMarcaPorGetAllKeysFuera`                     |

## 3. Lo nuevo

| hallazgo | qué                                                                                 | la pieza                                                  | agente |
| -------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| `R9-381` | el «de quién» de la escritura por identidad: la clave envuelta, y un ajeno marcado  | `notasClaveEnvuelta`; `ajenoMarcado371+notasSinPrepWrite` | A6     |
| `R9-382` | el filtro del respaldo por quien llama: un ayudante de otro módulo, aun sin `await` | `respaldoClaveOtroModuloSinAwait`                         | A7     |

Los dos los abrió la 107 a sabiendas, para cerrar un verde falso.

## 4. La matriz

- **Qué corrió:** `S107-matriz.cjs.txt correr` sobre `1e9e809`, 744 corridas en `prep` con
  `--maxWorkers=3` (`S107-matriz-correr.out.txt`; ninguna dejó el árbol sucio), y después 66 re-corridas
  (abajo) y 20 de los cortes (`S107-cortes.out.txt`). Comparado en `S107-matriz-comparar.out.txt`, 746
  con las re-corridas. Antes, las 744 en modo `anclas`: 10 no aplican, todas explicadas (dos se anclan en
  la marca, que ahora escriben dos funciones: `migraMarcaSale` y `saleMarcaEnMigra`; una en el `return` de
  la nota: `reintentaNotaFuera`; cinco son regresiones de los diseños viejos de A2, rehechas como piezas
  propias; `espiaArriba343E` y `sinPila`, reemplazadas por las de A4 y A7).
- **La verificación** (`S107-matriz-extra.txt`, 62, primero): cada entrada cae con sus piezas y pasa con
  la prueba de antes. Con la prueba de `02d8e93` (`pat02d8e93`) cae sola la fila de la marca, por el
  aviso nuevo de `src/`: una `pat02d8e93+X` que cae solo ahí es una regresión que la prueba de antes no
  veía.
- **Contra la 106** (las 467 de su lista que no corrió también un agente): **ninguna pasa de caer a
  pasar.** Ocho pasan de pasar a caer, todas explicadas: `claveEnvuelta` (`R9-381`), `sinAislarBpt` (con
  `mockSqlite` por prueba, el rojo es más ruidoso), `muestraClavesTabla+mesaAjenaQuitadaAlFallarNota`
  (`R9-367`), `ajenoNotas349b` (una pieza que trae su propio esperado de la lista exacta de antes; la de
  hoy, `ajenoNotas349`, pasa), dos con pruebas de antes (la fila de la marca) y dos que no son de un
  `prep` entero ni hoy ni en la 106. En 16, alguna prueba dejó de caer, aunque la corrida sigue cayendo:
  cambios buenos que daban rojos falsos (`unionDevLenta`, `unionDevTimeout`, `migraLenta`: `R9-374`) y
  `claveAntesDelTurnoUnion`, que el re-anclado lleva solo al camino con dueño.
- **Las de los agentes** (248): 148 iguales a la salida de su worktree; las otras, por lo integrado y el
  `src/` nuevo. Tres de A9 que caían en su worktree pasan aquí: el corte en vueltas bajó (`R9-373`).
- **Tres artefactos del re-anclado, corregidos en `S107-gen` y re-corridos** (66):
  - `migraConMultiGet` (un cambio bueno) reemplazaba la lectura del dueño con `?? signedIn`, que ya no
    existe: 27 caían por un `ReferenceError`. Re-anclada, pasa 72/72.
  - 13 quitas en el `catch` de la nota terminaban en `return;`: salteaban `moveUnownedPrep` y la fila
    caía por `claves` (sin la marca), no por la quita. Re-ancladas (`uids = [];`), las 60 corridas que las
    usan.
  - `claveAntesDelTurnoUnion` suelta las claves antes del turno solo en el camino con dueño. Su gemela
    del camino nuevo (`claveAntesDelTurnoMueve370`, y `claveAntesDeMover370`) cae (8 y 14).
- **Los cortes, re-medidos sobre lo integrado:** ver `R9-373` (corregido en `27d598b`).

## 5. Lo que queda

- **Nuevo, sin arreglar:** `R9-381`, `R9-382`.
- **Sin medir:** el corte de `R9-370` (un estado mientras se devuelve); un trabajo que tarda más de mil
  vueltas tras programar una quita (`R9-374`); un verde falso de `retenida` (`R9-375`); un ajeno de
  `@prep_series` desde el respaldo (`R9-377`); las opciones de `R9-381`.
- **Del Pendiente, sin tocar:** `R9-330` (decidido); la cabecera de `prepMultiSet` (`R9-327`); lo que
  queda de `R9-347`; el daño de `R9-377` con un respaldo sin series; `notasPideDosVeces` en la lectura;
  `intervaloInocuo1`.

## 6. Las lecciones

- **Una decisión que nombra un momento se mide en cada paso que hay hasta ese momento** (`R9-370`). La
  §7 decía «antes de terminar el trabajo del primer estado»; entre leer el dueño y terminar hay una
  lectura y las devoluciones. A1 cerró el caso de la entrada y dejó partido el de la lectura de la nota;
  ir hasta el final mezclaba cuentas. El corte va donde la regla deja de ser cierta, escrito.
- **Un caso tiene su espejo** (`R9-370`): `ana` y nulo partía igual que nulo y `ana`, y la entrada no lo
  nombraba (A2).
- **Un arreglo en `src/` parte un camino en dos, y la tabla tenía una fila por paso, no por camino**
  (la marca de la migración). Es la regla de la 93 en la tabla.
- **Una pieza se re-ancla solo donde el texto nuevo hace lo mismo** (`S107-gen`): por el camino con dueño
  registrado, sí; donde el texto quedó repetido (la marca en los dos caminos), no aplica y se dice.
- **Un corte medido sobre el diseño de un agente se re-mide sobre lo integrado** (`R9-373`). A9 escribió
  los cortes sobre `02d8e93`; con `R9-370`, el trabajo sigue un paso tras la falla y el corte en vueltas
  bajó uno: la frase prometía ver una regresión que pasaba. Lo vio la matriz (tres corridas de A9 que
  caían en su worktree pasaban aquí). **Corregido en la 108** (`R9-387`): la causa no es `R9-370`; con el
  `src` de antes y la prueba nueva el corte ya bajó.
- **Una pieza re-anclada se lee entera, el reemplazo también** (`S107-gen`): el ancla aplicaba, pero el
  reemplazo traía `?? signedIn` o un `return;` que el código nuevo ya no tiene; 27 y 13 rojos que no eran
  de la regresión.
- **Un control que lee «de quién» por identidad tiene su cambio bueno, como el de la pila**
  (`R9-381`, `R9-382`): el envoltorio de una promesa y un ayudante en el mismo módulo.

## 7. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s107`, mientras la matriz corría en el principal; pasado al
  principal con un parche (`_scratch/S107-docs.diff.txt`) y commiteado ahí, con el hook.
- **Antes de cerrar** (la regla de la 102): las piezas del ledger en modo `anclas` sobre `27d598b`: 88,
  todas aplican, árbol limpio.
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"`, y `npm run validate` con
  `NODE_ENV=development`, sin worktrees de agentes (`_scratch/S107-validate.out.txt`): typecheck
  limpio, lint con 0 errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites y
  4681/4681 pruebas (las 4672 de la 106 más 9: la de `R9-370`, dos filas de la tabla, cuatro casos de
  `R9-369` y la pareja de `R9-375`). El proceso lo cortó Claude Code por falta de memoria del sistema
  después del resumen de jest, así que falta la línea del código de salida; no se volvió a correr.
- **El mensaje de la 108** está en `_scratch/S108-PROMPT.md`.
