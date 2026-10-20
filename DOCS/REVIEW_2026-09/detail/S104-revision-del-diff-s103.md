# Sesión 104 — revisión del diff de la 103 (2026-10-19)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S104-PROMPT.md` y 6 agentes en worktree
(los pidió Victor) que solo midieron. Es la segunda vuelta de la 103 (la regla de la 60): cada agente
atacó lo integrado de otro, empezando por lo que cambió el orquestador de la 103 (la espera de `R9-357`
con `unaHora()`, y el diseño de A4 portado a mano sobre las funciones de A3). Revisa
`ee88726..28fa337`, todo `__tests__/`. Solo docs.

- **Estado al empezar:** `main` = `origin/main` = `25a8c05` (la 103, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `39356602251`, 3 jobs, Node v24.21.0, 374/4672). Comprobado con
  `git fetch` y `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar.
  Los docs decían «sin mergear» para la 103: corregido aquí.
- **Rama:** `docs/review-s104-diff-s103`, escrita en un worktree aparte (`../essb-docs-s104`, fuera del
  repo) mientras la matriz corría en el principal. Sin mergear hasta el OK de Victor.
- **Resultado:** 7 nuevos (`R9-360`..`R9-366`), todos en las pruebas, todos abiertos por la 103, P3 o
  P3 bajo. Quedan 366 hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S104-gen.cjs.txt`: la `S104-sonda.cjs.txt` desde `S103-sonda.cjs.txt` (que ya tiene las piezas
    de la 103 y de sus 5 agentes), con las de `S104-propias.txt` (bloques `// S104-o`; en esta sesión,
    ninguna) y, en el principal, las de las copias de los agentes
    (`S104-sondas-agente-N/S104-a<N>-propias.txt`). Con `<raíz del worktree> <N>` arma la sonda de cada
    agente (ROOT propio, salida `S104-a<N>-sonda-*`), su `igual` y su `resumen`. Probada antes de
    lanzar: en modo `anclas` con las 30 corridas de las seis entradas (todas aplican, árbol limpio), y
    el modo agente en un directorio temporal.
  - `S104-matriz.cjs.txt`: la lista entera de la 103 (la lee de `S103-matriz.cjs.txt`: 362), más las 25
    que la 103 corrió aparte en sus tandas 1 a 9 (`EXTRA103`, con la tanda en que corrió cada una),
    menos `soloR358` sola (va sobre la prueba de `ee88726`), más las de la 104: las 28 piezas de los
    agentes y 59 combinaciones que sostienen sus afirmaciones (`EXTRA104`). Modo `correr <desde>
<hasta>`; compara con la salida de la 103 y, las de la 104, con la del worktree de su agente.
  - `S104-caidas.cjs.txt`: las pruebas que caen en cada salida.
- **Los agentes:** 6 `fork` con `isolation: "worktree"`, nacidos en `25a8c05` (sin `reset`), lanzados
  en cuanto `S104-gen` pasó `anclas`. Cada uno con una entrada (A1 `R9-357`, A2 `R9-355` y `R9-356`,
  A3 `R9-353`, A4 `R9-354`, A5 `R9-358`, A6 los comentarios del diff), las reglas de controles y
  esperas de §5 como lista, `--maxWorkers=3` y el `cp -r` de su `_scratch`. Completaron los seis, sin
  cortes: 198-234k tokens, 23-36 llamadas, 7-11 min.
  - **Los worktrees se borraron solos, con sus ramas** (ninguno dejó cambios): las copias tienen los
    archivos que dijo cada agente (36, 73, 32, 36, 52 y 33).
- **El re-medido en el principal** (la regla de la 6): las 80 corridas de la 104 que no estaban en la
  lista de la 103 (`S104-remedir.out.txt`): las 71 con salida en el worktree de su agente caen o pasan
  igual, con las mismas pruebas; las 9 sin salida dan lo que dice su informe. Lo que imprimen las
  pruebas-sonda del daño (`muestraSeries353`, `muestraCasos344`, `muestra358`), igual al del agente.
  Más 8 corridas del suite con `--maxWorkers=4` (`S104-tanda-suite.out.txt`). Las demás afirmaciones
  (las que la 103 ya tenía en su lista) se re-midieron con la matriz.
- **Ninguna corrida dejó el árbol sucio.**

## 1. Lo nuevo

| hallazgo | qué                                                                      | la pieza (y lo que pasa)                                                  | agente |
| -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------ |
| `R9-360` | la espera de `R9-357`: un corte de una hora, y la frase no dice dónde va | `notaQuitaTimeoutLargo3600001`: `prep` 63/63, suite 1044/1044             | A1, A6 |
| `R9-361` | los estados de `R9-356`, separados en vueltas y no en tiempo             | `claveDelPrimeroEnDevTimeout10`: `prep` 63/63, suite 1044/1044            | A2     |
| `R9-362` | el respaldo de `R9-353` restaura series vacías                           | `respaldoSeriesAlPedir`: `prep` 63/63, suite 1044/1044                    | A3     |
| `R9-363` | un pedido ajeno de `@prep_notes` ocupa el lugar del que falta            | `ajenoNotas358+respaldoNotasTrasSeries`: `prep` 63/63, suite 1044/1044    | A4, A5 |
| `R9-364` | el `R9-354` del respaldo, con la clave tomada tarde                      | `respaldoPideYTomaTras2000`: lo mismo que la demora sola, menos `R9-345`  | A5     |
| `R9-365` | el control de `R9-358` fija aún el orden y la cantidad                   | `respaldoSeriesPrimero`, `respaldoNotasDosVeces`: caen los 4 del respaldo | A5     |
| `R9-366` | el control de `R9-354` se lee antes de los estados nuevos de `R9-353`    | `notasLentoAntesPrepWrite1002+tardeClave2000+pideYDescarta`               | A6, A4 |

- **El daño, medido:** `R9-360` deja la Mesa de bob bajo su uid sin su nota (con la espera corriendo
  todo temporizador); `R9-361` manda lo pedido a la cuenta que no es en 10 de los 14 casos de `R9-344`
  (con los estados separados en el reloj); `R9-362` parte lo restaurado entre dos cuentas; `R9-363` (en
  el respaldo, sin series) y `R9-364` (con el trabajo más largo que la demora) pierden la Mesa de antes.
  `R9-365` es un rojo ante un cambio bueno, y `R9-366` no tiene daño medido.
- **Lo que tocó el orquestador de la 103:** la espera de `R9-357` (`R9-360`) y el control portado a
  mano (`R9-366`). Las dos, como se pidió, fueron lo primero que se atacó.
- **Corrige a la 103:** «el ajeno no ocupa el lugar del que falta» (medido con un esperado adaptado:
  `R9-363`), y «el `R9-354` del respaldo lo ven los casos de dirección» (vale para la clave tomada
  temprano: `R9-364`). Las dos notas, al día en `R9-354`.

## 2. Sin hallazgo (medido, y re-medido en el principal)

- **A1:** en el mock no queda un método de almacén sin fallar (los dos que quedan son
  `flushGetRequests`, sin almacén, y `useAsyncStorage`, que delega en los mismos: `migraQuitaMarcaUseAsync`
  cae en la de disco entero, 62/63). Los relojes también en la corrida limpia (`relojesEnLimpia`):
  63/63, con las mismas `llamadas`. Un intervalo no agrega nada al temporizador simple.
- **A2:** con los estados de a uno, cada caso que la tabla de `R9-355` dice que ve una pieza la sigue
  viendo (6 con `ignoraPrimeroEnDev` y `claveUltimoDistintoEnDev`, 2 con `claveDelSegundoEnDev`, 10
  con las `…Micro`). La vuelta tarde (`…Vuelta<K>`): la lectura de `R9-345` la ve.
- **A3:** una migración que no mueve nada: tomar el valor al pedir solo entonces
  (`valorAlPedirSiNoMueve`, `…SiYaMigrado`) cae en la lectura de `R9-345` (62/63). `deAna: [P]`, al pie
  de la letra: lo fija la migración, y todo destino posible de lo restaurado está en un campo esperado.
- **A4:** `notasIgnoraClaveDeRun` (la escritura recibe la clave de `prepKey` y escribe con otra): donde
  hay daño, lo ven los datos (58/63). Con la clave envuelta (`notasClaveEnvuelta`, un cambio bueno),
  63/63. `notasResuelveAntes` (el store espera su clave antes de llamar a `prepWrite`): pasa la de
  `R9-345`; cae solo `R9-292`, en lo que su comentario ya acepta.
- **A5:** la demora antes del paso que lee `alAbrir` (la regla de la 101): `respaldoClaveTarde990` pasa
  la de `R9-345`, y `…1005` cae solo por `notas: false`, como dice la cabecera del respaldo.
- **A6:** la cabecera del respaldo (990/1005, con los 4 casos), «sin falla, la nota se lee dos veces»,
  «lo de antes va a Ana, la dueña de la sin cuenta», «de a uno, con una vuelta entre ellos» y las
  cabeceras de `R9-353`: cotejadas con el código de hoy, o medidas.

## 3. No medido (de los informes)

- **A1:** una parte que el código deje suelta (`void`) después de la ventana; un cambio que solo cambie
  `avisos` (es una lista exacta y ordenada).
- **A2:** `estadosEspaciados` en el suite; los casos de `R9-353` con sus estados espaciados en el reloj.
- **A3:** la clave de las series tomada tarde con un estado entre las dos claves; tomar el valor al
  pedir en un solo llamador (el respaldo o un store) cuando la migración no mueve nada (los 4 casos de
  cada uno migran).
- **A4:** el caso con daño de `notasAlSiguienteDurante` (una devolución pendiente de beto, o beto como
  dueño).
- **A5:** las reglas de la 73, 79, 84 y 85, con un temporizador antes del pedido.
- **A6:** «(y la Mesa de Bob)» en la tabla, que no lee las claves; `pedidasAlAbrir` del respaldo, con
  la forma de `R9-366`.

## 4. La matriz

- **Qué corrió:** `S104-matriz.cjs.txt` sobre `28fa337`, 466 corridas en `prep` con `--maxWorkers=3`
  (`S104-remedir.out.txt` las 80 de la 104, `S104-matriz-correr.out.txt` las 386 de la 103;
  `S104-matriz-comparar.out.txt`): las 362 de la lista de la 103, las 25 de sus tandas, menos
  `soloR358` sola, más las 80 de la 104 que no estaban en esa lista. Todas del `prep` entero; ninguna
  dejó el árbol sucio. En modo `anclas`, las 466 aplican.
- **Contra la 103 (el mismo código):** 338 caen igual y 118 pasan igual. **Ninguna distinta** en la
  lista de la 103: no hay corridas inestables.
- **Una distinta entre las de sus tandas, explicada:** `pat8e80f5b9+claveDelPrimeroEnTrabajoMicro`
  pasaba 57/57 en la tanda 3 de la 103, con `backupPrepTurn.test.ts` todavía en `ee88726`; hoy, con ese
  archivo en `28fa337`, cae en un caso del respaldo de `R9-345` (60 pruebas). Es la cobertura de
  `R9-353`, no una pérdida.
- **Las de la 104:** las 71 con salida en el worktree de su agente, iguales; las 9 sin salida
  (`alSiguienteBase`, `prepKeyAhora`, `ajenoTrasControl354`, `estadosEspaciados`, `ventana3000`,
  `muestra358`, `sinSeries358` y dos combinaciones), lo que dice su informe.
- **Aparte** (`S104-tanda-casos.out.txt`, `S104-casos344.cjs.txt`): los 14 casos de `R9-344` con cada
  pieza de `R9-355` y `R9-356` (6, 6, 2, 10 y 10 cambian), iguales a los del agente 2.

## 5. Lo que queda

- **Nuevo, sin arreglar:** `R9-359` (lo arregla la 105) y `R9-360`..`R9-366`.
- **Del Pendiente, sin tocar:** `R9-330` (decidido), `R9-333` y la cabecera de `prepMultiSet`;
  `ajenoDev298` y `:868`/`:1160`; el dueño de `migrateLegacyPrep`, `notaLenta50` y
  `respaldoPideTarde20`; lo que queda de `R9-347` y `backupPrepTurn.test.ts` sin aislamiento; el número
  de la etiqueta; `muereTrasEscribir`; y de la 102, «at the call» y la falla de una parte que tumba la
  siguiente de la misma clave.

## 6. Las lecciones

- **Al portar un control sobre el diseño de otro, su lectura va después de todo lo que ese diseño
  agrega antes del momento que nombra** (`R9-366`). El de A4 se portó sobre las funciones de A3 y quedó
  antes del bucle de los estados nuevos: «al abrir» se lee dos vueltas antes de abrir, y
  `notasLentoAntesPrepWrite1002+tardeClave2000+pideYDescarta` pasa nulo→beto→nulo. Son las reglas de la
  81 y la 85, en la integración.
- **Un ajeno se corre contra el esperado de hoy, no contra uno adaptado** (`R9-363`). La 103 midió
  `ajenoEscritura354b` con el esperado ajustado a dos `@prep_notes` y escribió «no ocupa el lugar del
  que falta»; con el esperado de la prueba, lo ocupa (`ajenoEscritura354+notasSinPrepWrite`, 57/63, la
  de `R9-345` pasa en los 4). Las reglas de la 88 y la 89.
- **Un dato vacío no dice adónde fue** (`R9-362`). La lección de la 103 («el valor del pedido y el del
  final difieren») necesita datos en cada clave que el llamador escribe: con series vacías,
  `respaldoSeriesAlPedir` pasa `prep` y el suite.
- **Una hora de reloj falso también es un corte, y una vuelta no separa en el tiempo** (`R9-360`,
  `R9-361`). La regla de la 103 («un plazo en vueltas no ve un temporizador») se corre también contra
  la hora misma (`notaQuitaTimeoutLargo3600001` pasa) y entre los estados (`claveDelPrimeroEnDevTimeout10`
  pasa); con `runAllTimersAsync`, o con tiempo de reloj entre los estados, caen.
- **Lo que veía un control exacto es una clase, no una pieza** (`R9-363`, `R9-364`). La 103 aflojó
  `R9-358` tras correr la regresión que caía por la lista exacta (`respaldoPideYDescarta`). Otras dos de
  la misma clase (tomar las claves tarde, o cubrirse con un ajeno) también caían por ella sobre
  `ee88726`, y con el control aflojado pasan. Es la regla de la 103, con más de una regresión.

## 7. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s104`, mientras la matriz corría en el principal. El
  pre-commit no corre en un worktree fuera del repo (no tiene `node_modules`): el cambio se pasó al
  principal con un parche (`_scratch/S104-docs.diff.txt`), y se commiteó ahí, con el hook.
- **Las piezas del ledger, en modo `anclas` sobre `28fa337`** (la regla de la 102): las 466 de la
  matriz aplican (salvo `soloR358` sola, que va sobre la prueba de `ee88726`), y las 6 de
  `muestraCasos344` corrieron sobre ese commit.
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"`, y `npm run validate` con
  `NODE_ENV=development`, sin worktrees de agentes (`_scratch/S104-validate.out.txt`).
- **El mensaje de la 105** está en `_scratch/S105-PROMPT.md`.
