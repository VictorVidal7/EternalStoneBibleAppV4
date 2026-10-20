# Sesión 105 — arreglo de lo de la 103 y la 104 (2026-10-20)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S105-PROMPT.md` y 10 agentes en worktree
(los pidió Victor: «Podrías mandar 10 agentes para avanzar más con lo que está pendiente?»). Seis
midieron los diseños de las ocho entradas antes de escribirlos (la regla de la 99), y cuatro midieron
el Pendiente (menos `R9-330`, decidido). Solo `__tests__/`.

- **Estado al empezar:** `main` = `origin/main` = `ad6ba69` (la 104, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `39364590245`, 3 jobs, Node v24.21.0, 374/4672). Comprobado con
  `git fetch` y `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar.
  Los docs decían «sin mergear» para la 104: corregido aquí.
- **Ramas:** los arreglos en `fix/s105-arreglos-s104` (`1b299a9`, `fce7950`, `53bdbe6`), y los docs en
  `docs/review-s105-fix`, encima. Sin mergear hasta el OK de Victor.
- **Resultado:** 10 cerrados (`R9-359`..`R9-366`, y del Pendiente `R9-333` y `R9-372`), 5 nuevos sin
  arreglar (`R9-367`..`R9-371`). Quedan 372 hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S105-gen.cjs.txt`: la `S105-sonda.cjs.txt` desde `S104-sonda.cjs.txt`, con las piezas de
    `S105-propias.txt` (bloques `// S105-o`) y, en el principal, las de las copias de los agentes
    (`S105-sondas-agente-N/S105-a<N>-propias.txt`). Con `<raíz del worktree> <N>` (N de 1 a 10) arma la
    sonda de cada agente (ROOT propio, salida `S105-a<N>-sonda-*`), su `igual` y su `resumen`. Probada
    antes de lanzar: en modo `anclas`, las 20 corridas de las ocho entradas (todas aplican, árbol
    limpio), y el modo agente con el agente 10 en un directorio temporal (y el 11, rechazado).
  - `S105-matriz.cjs.txt`: la lista entera de la 104 (la lee de `S104-matriz.cjs.txt`: 466), menos las
    que anclan en lo que cambiaron los arreglos (`S105-no-aplica.txt`, 55), más las piezas de la 105 y
    las corridas de las tandas 1 y 2. Compara con la salida de la 104 y, las nuevas, con la del
    worktree de su agente.
  - `S105-caidas.cjs.txt`: las pruebas que caen en cada salida. Las tandas: `S105-tanda1..3.out.txt`.
- **Los agentes:** 10 `fork` con `isolation: "worktree"`, nacidos en `ad6ba69` (sin `reset`), lanzados
  en cuanto `S105-gen` pasó `anclas`. A1 `R9-360`, A2 `R9-361`, A3 `R9-362`, A4 `R9-363` en la escritura
  y `R9-366`, A5 `R9-363` en el respaldo, `R9-364` y `R9-365`, A6 `R9-359`; A7 lo no medido de la 104 en
  `prepAccount.test.ts`, A8 lo no medido en los llamadores (de la 102 y la 104), A9 la familia de
  `R9-327`/`R9-333` y el dueño de la migración, A10 los residuos de la 99. Cada uno con las reglas de
  controles y esperas de §5 como lista, `--maxWorkers=2` (no 3: con 10 a la vez, la RAM; lo que usó la
  99 con 11) y el `cp -r` de su `_scratch` tras cada bloque.
  - **El límite de uso:** al 80%, Victor preguntó cómo no perder el avance; se pidió a los 8 que
    seguían corriendo, por `SendMessage`, que guardaran ya (diff, informe, `cp`) y cerraran con corridas
    cortas. A4 y A5 se cortaron igual («You've hit your session limit»), con sus tandas terminadas y el
    árbol restaurado; A4 no había llegado a copiar su `_scratch` (lo copió el orquestador desde su
    worktree, que no se borra con un diseño sin commitear). Tras el reset, los dos se retomaron por
    `SendMessage` (3 y 15 llamadas más) y cerraron.
  - Completaron los diez: 245-286k tokens, 28-54 llamadas (todos pasaron el tope de ~25 salvo los
    retomados), 8-10 min. Copias: 64, 65, 46, 73, 57, 63, 47, 52, 53 y 38 archivos.
  - **Los worktrees:** el de A7 (sin cambios) se borró solo; los otros nueve, con el diff guardado igual
    al `git diff` y `diff -rq` vacío contra su copia, sin junction: `git worktree remove -f -f` y
    `git branch -D`.
- **La integración:** los diseños se portaron al principal en este orden: A1, A2 (el hunk del ayudante,
  a mano), A6, A10, A3 (un hunk, a mano), A9, A4, y A5 (cuatro hunks a mano, sobre lo de A3, A6 y
  A10). Dos commits, uno por archivo: los diseños comparten ayudantes y funciones, y separarlos por
  entrada no era práctico. Antes de commitear, cada prueba nueva cayó en el principal con las piezas de
  su entrada (tanda 1, 91 corridas en `prep`), y lo que la ve es la prueba nueva: con las pruebas de
  `ad6ba69`, las piezas pasan (tanda 2).
- **Ninguna corrida dejó el árbol sucio** (fuera del diseño todavía sin commitear, en las tandas 1 y 2).

## 1. Los arreglos

| commit    | entradas                                                   | qué                                                                      | de los agentes |
| --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ | -------------- |
| `1b299a9` | `R9-359`, `R9-360`, `R9-361`, `R9-363`, `R9-366`, `R9-333` | `prepAccount.test.ts`: el tiempo, el método y de quién es cada pedido    | 1, 2, 4, 6, 9  |
| `fce7950` | `R9-359`, `R9-361`, `R9-362`..`R9-366`, `R9-372`           | `backupPrepTurn.test.ts`: el aislamiento y los controles del respaldo    | 3, 5, 6, 10    |
| `53bdbe6` | `R9-364`                                                   | el estado tardío espera a que resuelva lo pedido (`resolvioAntesDeCata`) | (la matriz)    |

- **`R9-360` y `R9-361`, un solo ayudante** (cambio del orquestador sobre los diseños de A1 y A2):
  - La hipótesis de la entrada (`runAllTimersAsync` antes de `unaHora()`) no servía: lanza con un
    intervalo inocuo que no se apaga nunca (A1: las 14, «Aborting after running 100000 timers»; A2: el
    mismo rojo con un intervalo mientras dura el trabajo), y termina en cuanto no queda ninguno (A7:
    una parte suelta que pone su temporizador 5 vueltas después pasaba).
  - A1 propuso hasta 100 rondas de `runOnlyPendingTimersAsync`; A2, pendientes + mil vueltas +
    pendientes. Se unieron en `tiempoYVueltas()`: mil vueltas con los relojes falsos puestos, y en cada
    una los pendientes. Cubre los tres: `intervaloInocuo1000` pasa; `notaQuitaVueltasYTimeout5x…`,
    `…50x…` y `…990x…` caen, y `…1010x…` pasa (el corte en vueltas).
  - En las esperas de `R9-357` va antes de `unaHora()`, con el centinela de A1 (`esperaCompleta`: un
    temporizador de dos horas puesto durante el trabajo tiene que haber corrido); tras cada estado en
    las de `R9-337` y `R9-344`, y en los casos de varios estados de `R9-353` (la escritura, la lectura
    y el respaldo), que A2 midió con el mismo hueco (`claveDelPrimeroTrasPedirTimeout10`).
- **`R9-359`** (A6): `lecturas()`, el `multiGet` del mock (por donde pasa `getItem`). Cinco retenciones,
  la del respaldo y la tabla. Era más ancho que la entrada: también la nota y la unión.
- **`R9-363` y `R9-366` en la escritura** (A4): el espía de `prepWrite` lee en la pila qué store llama
  (un ajeno no cuenta); el control «al abrir» se lee tras los estados nuevos. La lectura de `R9-345`
  tenía la misma forma (A4, sin pieza): se le movió el control también.
- **El respaldo** (A3, A5, A6, A10): el aislamiento de `R9-340` (A10), la serie (A3), y los controles
  de A5: los pedidos del respaldo por la pila, `prepMultiSet` espiado (ninguna clave escrita al abrir,
  las del último estado al final, y un estado tardío tras resolver), sin orden ni cantidad.
- **`R9-333`** (A9): la de `R9-274` espera la unión, con su control (`union`), en lugar de 10 vueltas.

### Lo que cae (tanda 1, `prep` sobre el árbol integrado; 63 pruebas)

| entrada  | cae con                                                                                                           | pasa con (cambios buenos)                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `R9-360` | `notaQuitaTimeoutLargo7200000`, `notaQuitaIntervalo7200000`, `relojesTrasCorrer360b+notaQuitaTimeout1000` (49/63) | `intervaloInocuo1000`; sin el centinela, la frase vieja pasa                                   |
| `R9-361` | `claveDelPrimeroEnDevTimeout10`, `…TrabajoTimeout10`, `…1000`, `claveDelPrimeroTrasPedirTimeout10`                | `intervaloBuenoEnTrabajo`                                                                      |
| `R9-362` | `respaldoSeriesAlPedir` (61/63), `respaldoSinSeries`, `respaldoSeriesTrasEstado`                                  | `respaldoEscribeSeriesPrimero`                                                                 |
| `R9-363` | `ajenoEscritura354+notasSinPrepWrite` (53/63), `ajenoNotas358b+respaldoNotasTrasSeries` (59/63), y sus variantes  | `ajenoEscritura354`, `ajenoResuelto354`                                                        |
| `R9-364` | `respaldoPideYTomaTras2000` y `…1000`                                                                             | —                                                                                              |
| `R9-365` | `lento2000+llegarRestaura`                                                                                        | `respaldoSeriesPrimero`, `respaldoNotasDosVeces`, `respaldoClavesJuntas`, `respaldoPideEnThen` |
| `R9-366` | `notasLentoAntesPrepWrite1002+tardeClave2000+pideYDescarta` (50/63), `notasAlSiguienteDurante`                    | `notasClaveEnvuelta`                                                                           |
| `R9-359` | (las piezas de cada prueba, con y sin `migraConMultiGet`)                                                         | `migraConMultiGet`, `notaConMultiGet`, `uneConMultiGet` (63/63; suite 1044/1044)               |
| `R9-333` | `notaDespues333`, `sinTerminarAlArrancar333`, `notaTarde1010` (`union: null`)                                     | `notaLenta50` (la de `R9-274` pasa)                                                            |
| `R9-372` | `colgadaBpt+sinAislarBpt`                                                                                         | `colgadaBpt` (65/65)                                                                           |

- **Con las pruebas de `ad6ba69`** (tanda 2): `patad6ba69+notaQuitaVueltasYTimeout5x7200000` y
  `patad6ba69+bptad6ba69+claveDelPrimeroTrasPedirTimeout10` pasan (63/63);
  `bptad6ba69+respaldoPideYTomaTras2000` tumba solo las 7 de la demora; `patad6ba69+notaLenta50` tumba
  la de `R9-274`; `bptad6ba69+colgadaBpt` cae.
- **El suite** (tanda 2, `--maxWorkers=4`): `nada` 1044/1044; `migraConMultiGet` 1044/1044.

## 2. El Pendiente (agentes 7 a 10)

- **Con número:** `R9-367`, `R9-368`, `R9-369`, `R9-370` (nuevos) y `R9-372` (arreglado); `R9-333`
  (arreglado) y la rehecha de `R9-327` con `notaLenta50` (era el arrastre de `R9-372`).
- **Sin hallazgo, medido:**
  - «a key is taken at the call», leída unas microtareas tarde (A8): sin daño posible en la app (por
    lectura: el único que llama a `setPrepAccount` es `AuthContext.tsx`, que antes llama a
    `managePrepAccount()`); la otra mitad la vigilan `trasTrabajoTarde1` y `…1000`.
  - La falla de una parte que tumba la siguiente de la misma clave (A8): la tabla la ve
    (`devParaTrasFalla`, `notaSaltaTrasFalla`); `notaLanzaTrasFalla`, solo por la lista de avisos
    (`R9-368`).
  - `ajenoDev298` y las de `:868`/`:1160` (A8): en `R9-334`.
  - El número de la etiqueta (A10): una regresión que se salta el turno afecta al respaldo propio y al
    ajeno por igual, y la ven los datos de `R9-298` y otras seis.
  - `muereTrasEscribir` (A10): no arrastra, con aislamiento o sin él. La frase de la 99 («el
    aislamiento corta su arrastre») queda corregida: no había arrastre.
  - `respaldoPideTarde20` (A9): el rojo honesto de la 97, con el corte entre 15 y 20.
  - La cabecera de `prepMultiSet` (`R9-327`, A9): abierta, sin verde falso (`devuelveFueraDelTurnoE`
    cae en el dato).
- **Sin medir:** lo que queda de `R9-347` (A10 no llegó).

## 3. Lo nuevo

| hallazgo | qué                                                                                    | la pieza (y lo que pasa)                                      | agente |
| -------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| `R9-367` | la tabla de las partes no lee las claves: «(y la Mesa de Bob)»                         | `mesaAjenaQuitadaAlFallarNota`: `prep` 63/63, suite 1044/1044 | A7     |
| `R9-368` | `avisos` como lista exacta                                                             | `avisoDeMas`: caen 7                                          | A7     |
| `R9-369` | el valor al pedir en un solo llamador, cuando la migración no mueve nada               | `noMueveDescartaRestaura`: `prep` 63/63, suite 1044/1044      | A8     |
| `R9-370` | sin dueño registrado y con un primer estado nulo, la migración parte una entrada (src) | `duenoDurante` (prueba-sonda)                                 | A9     |
| `R9-371` | el «de quién» de `R9-363` se lee en la pila                                            | `notasPrepWriteSinMarco`: caen los 4 casos de la escritura    | A4     |

- **El daño, medido en el principal:** `R9-367` pierde la Mesa de Bob; `R9-369`, en el store de notas,
  manda lo escrito a la cuenta contraria (`sondaDevEscritura`); `R9-370` deja un pasaje partido entre
  la «sin cuenta» y la Mesa de Ana. `R9-368` y `R9-371` son rojos ante un cambio bueno.
- **`R9-371` lo abrió esta sesión**, a sabiendas: sin la pila, el ajeno ocupaba el lugar del que falta
  (`R9-363`, con pérdida de datos en el respaldo).

## 4. La matriz

- **Qué corrió:** `S105-matriz.cjs.txt`, dos veces: sobre `fce7950`, y sobre `53bdbe6` después del
  arreglo de abajo (`S105-matriz-correr.out.txt`, `S105-matriz-comparar.out.txt`; las de la primera,
  con el sufijo `-fce7950`). 510 corridas en `prep` con `--maxWorkers=3`: las 466 de la lista de la
  104 menos 55 que no aplican (`S105-no-aplica.txt`: anclan en lo que cambiaron los arreglos; las que
  sostienen una afirmación tienen su versión re-anclada, `relojesTrasCorrer360b`,
  `ajenoAntesDelControl366b`, `ajenoNotas358b`), más 83 de la 105 (las piezas de los agentes y las de
  las tandas 1 y 2). Todas del `prep` entero; ninguna dejó el árbol sucio ni dio error.
- **Lo que vio la primera:** con `migraLenta1005` (la migración 1005 vueltas más lenta, un cambio
  bueno), la de `R9-345` del respaldo caía con lo restaurado en la Mesa de Cata: el estado tardío de
  `R9-364` llegaba tras a lo sumo mil vueltas aunque lo pedido siguiera pendiente. Arreglado en
  `53bdbe6` (espera hasta que resuelva, con el control `resolvioAntesDeCata`); re-medido en la tanda 3
  (`migraLenta1005` y `migraLenta2000`: las 4 de la 104), y la matriz entera, otra vez.
- **Contra la 104 (sobre `53bdbe6`):** 386 iguales (293 caen y 93 pasan) y 41 distintas, todas por los
  arreglos:
  - **20 de cobertura nueva:** las piezas de las entradas (`notaQuitaTimeoutLargo3600001` y `…7200000`,
    `notaQuitaIntervalo3600001`, `notaQuitaTarde1010`, `claveDelPrimeroEn{Dev,Trabajo}Timeout*` y
    `…Vuelta2`/`3`, `respaldoSeriesAlPedir`, los ajenos con `notasSinPrepWrite`,
    `respaldoPideYTomaTras1010` y `…2000`), `migraLeeEnCatchMultiGet` (la tabla ve ahora el `multiGet`
    en la primera lectura) y los topes de `R9-335` (`segundoTope250`, `…V995`, `…V1005`), que ahora
    ven también los casos de `R9-345`.
  - **7 rojos ante un cambio bueno que se van:** `ajenoEscritura354`, `ajenoTrasAbrir354`,
    `respaldoSeriesPrimero`, `respaldoNotasDosVeces`, `migraConMultiGet`, `notaLenta50` (`R9-274` y
    `R9-327`) y `notasPideTarde2000` (un store que pide su clave 2000 vueltas tarde: llega antes de
    abrir).
  - **2 que la de `R9-345` del respaldo veía solo por la cantidad:** `claveTrasSqlite` y
    `respaldoClaveTarde` (de la 94: el respaldo re-resuelve sus claves después de SQLite) caían solo por
    una `@prep_notes: resuelta` de más en `pedidasAlFinal`, la clase de `R9-365`; en ese caso no tienen
    daño (la clave re-resuelta es la del final), y su daño lo siguen viendo `R9-292` y `R9-275`, con
    datos perdidos. Es la lección de la 104 («lo que veía un control exacto es una clase»), corrida.
  - **11 rojos honestos nuevos, en un control:** con 1005 vueltas de demora (cambios buenos), la de
    `R9-274` cae con `union: null` («no llegó»: la espera de `R9-333` tiene tope de mil;
    `giveBackTarde1005`, `turnoLento1005` y cuatro combinaciones), y la de `R9-327` con `retenida:
null` (`multiSetTarde1005`, `respaldoTurnoTarde1005`, `lento1005`, y dos combinaciones; en la 104
    pasaba, sin medir por qué: en ese archivo, fuera de `R9-345`, solo cambió el aislamiento).
  - **1, un ajeno que no es neutro:** `ajenoDev` (una devolución de Ana dentro del respaldo) mueve la
    Mesa de Ana, y la de `R9-345` del respaldo cae en los datos; en la 104 la devolución corría después
    de leerlos. Un rojo con el código bueno ante un ajeno que cambia el caso, no un verde falso.
- **Las de la 105:** 50 iguales a la salida del worktree de su agente; 4 distintas, por la integración
  (`notaQuitaVueltasYTimeout5x7200000` y `claveDelPrimeroTrasPedirTimeout10` caen ahora: los agentes
  medían sobre `ad6ba69`; `respaldoSeriesTrasEstadoTimeout10` y `claveDelPrimeroEnDevTimeoutLargo7200000`
  caen en un caso más, por el espaciado); 29 sin salida de un agente (las re-ancladas y las
  combinaciones de las tandas 1 y 2), como en las tandas.

## 5. Lo que queda

- **Nuevo, sin arreglar:** `R9-367`..`R9-371` (`R9-370`, de `src/`: decide Victor).
- **Del Pendiente, sin tocar:** `R9-330` (decidido); lo que queda de `R9-347` (sin medir); la cabecera
  de `prepMultiSet` (abierta, sin verde falso); en `R9-369`, el daño en el respaldo; en `R9-371`, el
  respaldo con un pedido desde otro módulo tras un `await`.
- **Sin medir, de los agentes:** el corte de `R9-366` con las mil vueltas por estado; un temporizador
  que se re-programa más de mil veces en `tiempoYVueltas`; un intervalo que no se apaga nunca en las
  esperas de los estados (por construcción, pasa: `intervaloBuenoEnTrabajo`).

## 6. Las lecciones

- **Una hipótesis del ledger que nombra una herramienta se mide con un cambio bueno de esa herramienta**
  (`R9-360`, `R9-361`). «`runAllTimersAsync` lo cierra» venía medido como pieza contra una regresión;
  con un intervalo que no se apaga nunca lanza, y termina en cuanto no queda ningún temporizador. Lo
  vieron tres agentes por separado (A1, A2 y A7). Es la regla de la 31 (una hipótesis escrita sigue
  siendo una hipótesis) con la de la 82.
- **Un control que lee «de quién» en la pila tiene su propio cambio bueno** (`R9-371`). La respuesta a
  la regla de la 88 (un registro compartido) trae la de la 82: un `bind` borra el marco.
- **Dos pendientes pueden tener una causa** (`R9-372`). El rojo engañoso de la rehecha de `R9-327` era
  el arrastre de un archivo sin aislamiento: lo cruzaron dos agentes que miraban cada uno el suyo (A9 y
  A10).
- **Un evento que la prueba manda «en cuanto X» espera a X sin un tope corto, y un control dice que X
  pasó** (`53bdbe6`). El estado tardío de `R9-364` salía tras mil vueltas aunque lo pedido siguiera
  pendiente, y con un cambio bueno (la migración 1005 vueltas más lenta) el rojo era el del daño. Es
  la regla de la 79, en un diseño medido por su agente sin una demora de la migración; la vio la
  matriz, antes del OK.
- **Con 10 agentes, el límite de uso llegó a mitad** (A4 y A5). El `cp` tras cada bloque y el worktree
  con el diseño sin commitear guardaron todo; tras el reset, cada uno se retomó con su contexto.

## 7. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s105`, mientras la matriz corría en el principal. El
  pre-commit no corre en un worktree fuera del repo (no tiene `node_modules`): el cambio se pasó al
  principal con un parche (`_scratch/S105-docs.diff.txt`), y se commiteó ahí, con el hook.
- **Las piezas del ledger, en modo `anclas` sobre `53bdbe6`** (la regla de la 102): las 510 de la
  matriz aplican; las 55 de `S105-no-aplica.txt`, no (anclan en lo que cambiaron los arreglos).
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"`, y `npm run validate` con
  `NODE_ENV=development` sobre `53bdbe6`, sin worktrees de agentes (`_scratch/S105-validate.out.txt`):
  exit 0. Typecheck limpio, lint con 0 errores (los 70 avisos de siempre), `format:check` limpio, y
  jest 374/374 suites y 4672/4672 pruebas (los mismos totales que la 104: los arreglos cambian pruebas
  que ya estaban).
- **El mensaje de la 106** está en `_scratch/S106-PROMPT.md`.
