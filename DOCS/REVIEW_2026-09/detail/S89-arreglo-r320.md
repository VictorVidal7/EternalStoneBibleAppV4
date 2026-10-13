# Sesión 89 — arreglo de lo de la 88: `R9-320` (2026-10-12)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S89-PROMPT.md` (el que
pegó Victor). Arregla `R9-320`: el gancho de `R9-296` (`__prepTurnWaitingForTests`) contaba todos
los pedidos del turno de la Mesa, y la prueba de `R9-292` lo leía como «la otra espera».

- **Estado al empezar:** `main` = `origin/main` = `1f02511` (la 88, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38339991537`, 3 jobs, Node v24.21.0, 374/4632; rama borrada
  tras `git cherry`). Los docs decían «sin mergear» para la 88: corregido aquí. `main` no era más
  nuevo, así que no hizo falta volver a mirar el CI.
- **Ramas:** `fix/s89-r320` (`538b1bc`, la prueba y el gancho) y `docs/review-s89-fix` encima (solo
  docs), sin mergear hasta el OK de Victor.
- **Resultado:** `R9-320` cerrado. Ninguno nuevo. Quedan 320 hallazgos, ningún P0.

## 0. Cómo se trabajó

`_scratch/S89-sonda.cjs.txt` es la `S88-sonda` con las anclas re-escritas sobre el árbol nuevo (ver
«---- S89 ----»):

- `muestra` imprime, al leer `otraEnEspera`, los pedidos que esperan con cada clave (`notas`, `ana`,
  `series`);
- las `gen…D` le pasan la etiqueta a `oneAtATime` (sin eso, la otra pedía el turno sin etiqueta y
  el control daba 0 por la pieza, no por la regresión), y `turnoAntesDeClave` la quita, porque la
  clave ya no está resuelta al pedir;
- `pa<sha>` (el `prepAccount.ts` de un commit), `sinEtiqueta` (`prepWrite` no pasa su clave),
  `ajenoAmbasTardeK` (dos ajenos K vueltas tarde, uno de `@prep_notes` y otro de
  `@prep_notes:ana`), y el modo `anclas` (aplica y restaura, sin jest);
- fuera: `delta` y `porClave` (la segunda es el arreglo).

Antes de medir, el modo `anclas` aplicó 24 corridas con las piezas de las mediciones y miró el `git diff --shortstat`
de cada una. `_scratch/S89-orden.cjs.txt` es la `S88-orden` con una cuarta versión, `etiqueta` (el
`oneAtATime` de hoy). Las salidas están en `S89-sonda-*`; los resúmenes, en `S89-m1.out.txt` (`-t
R9-292`) y `S89-m2.out.txt` (`prep`), y la de orden, en `S89-orden.out.txt`. `git status` quedó
limpio tras las 34 corridas, y nunca corrieron dos sondas a la vez.

**Corrección de la 90:** todo esto se midió sobre `1b608b0`, el primer commit del arreglo. El amend
que dio `538b1bc` solo cambió el comentario de `otraEnEspera` en la prueba (`git diff 1b608b0
538b1bc`). La 90 re-midió lo central sobre `cd7993c`, con el mismo resultado, y midió las dos
afirmaciones de arriba que iban sin sonda (las `gen…D` sin etiqueta y `turnoAntesDeClave` sin
re-escribir): `detail/S90-revision-del-diff-s89.md` §1.

## 1. El arreglo (`538b1bc`)

- **El gancho, en `src/features/study/prepAccount.ts`.** `oneAtATime(fn, what?)`: cada pedido
  lleva su etiqueta en el `Set` (`{what}`). `prepWrite` le pasa la clave que resolvió (antes del
  desvío de `R9-275`, que se decide dentro del turno); las uniones y el respaldo, nada.
  `__prepTurnWaitingForTests(clave)` cuenta los que esperan con esa clave. Es el export solo para
  pruebas que Victor decidió el 2026-10-07, con un argumento, como pedía el mensaje. No tocó nada
  más de la app.
- **La prueba, en `__tests__/backupPrepTurn.test.ts`.** En los dos casos `pedidaAntes`,
  `otraEnEspera` cuenta los que esperan con la clave de la otra: `@prep_notes`, o
  `@prep_notes:ana` con la cuenta borrada.
- **Los comentarios.** El del `Set` dice qué lleva cada pedido. El del export dice que cuenta los
  `prepWrite` de esa clave, de quien sean, y que contando todos pasaba por ella otra escritura de la
  Mesa (otra clave, una unión, un respaldo). El de `otraEnEspera` dice lo mismo, y que otro
  `prepWrite` de la misma clave contaría igual: en la app no lo hay, porque cada store encadena los
  suyos. El primer borrador decía «otra escritura de la Mesa esperando ahí pasaba por la otra», sin
  más: con el arreglo, una de la misma clave sigue pasando. Se corrigió antes de cerrar la rama.

## 2. Medido

`-t R9-292` con `muestra`, salvo donde dice `prep`.

| corrida                                                          | resultado                                                                               |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `nada` (`prep`)                                                  | 23/23                                                                                   |
| `ajeno` (también `prep`, 23/23), `claveEnvuelta`                 | pasan (con `ajeno`, antes `otraEnEspera: 2`)                                            |
| `ajenoTarde5`, `ajenoTarde20`                                    | pasan                                                                                   |
| `genTrasMultiSetD+tardeClave25+ajenoTarde5` (y `prep`)           | `otraEnEspera: 0` en los dos (antes pasaba); en `prep`, también `R9-273`                |
| `genTrasMultiSetD+tardeClave25+ajenoTarde20`                     | `otraEnEspera: 0` en los dos                                                            |
| `tardeClave25` (y `prep`)                                        | `otraEnEspera: 0` en los dos; en `prep`, también `R9-273` (`R9-297`)                    |
| `genTrasSqlite`, y con `ajeno`                                   | `escribio: 1` y `otraEnEspera: 0` en los dos, `Rom/8/28` perdido (con `ajeno`, antes 1) |
| `genTrasMultiSet`, `genTrasMultiSetD`                            | `escribio: 1` y `otraEnEspera: 0` en `devolucionPedidaAntes`                            |
| `bpt1f02511+pa1f02511+genTrasMultiSetD+tardeClave25+ajenoTarde5` | pasa (el revert)                                                                        |
| `pa1f02511+ajeno`                                                | `otraEnEspera: 2` en los dos                                                            |
| `pa1f02511+genTrasMultiSetD+tardeClave25+ajenoTarde5`            | pasa                                                                                    |
| `storeLento40` / `41`                                            | pasa / solo `otraPedidaAntes: 0`, con `otraEnEspera: 1`                                 |
| `claveLenta19` / `20`                                            | pasa / los dos controles en 0                                                           |
| `tardeClave19` / `20`                                            | pasa / solo `otraEnEspera: 0`, con `otraPedidaAntes: 1`                                 |
| `ajenoClaveTarde5`                                               | `otraEnEspera: 2` en `pedidaAntes` (`notas: 2`): cae con el código bueno                |
| `genTrasMultiSetD+tardeClave25+ajenoClaveTarde5`                 | 1 en `pedidaAntes` (el ajeno), 0 en `devolucionPedidaAntes`: cae                        |
| `genTrasMultiSetD+tardeClave25+ajenoAmbasTarde5`                 | **PASA**: 1 en los dos (el ajeno de cada clave), `escribio: 0`                          |
| `sinEtiqueta`                                                    | `otraEnEspera: 0` en los dos                                                            |
| `ganchoSinBorrar`                                                | `otraEnEspera: 2` en los dos                                                            |
| `sinLimpiar` (`prep`)                                            | 23/23                                                                                   |
| `claveCapturada`, `claveDosVeces`                                | los dos controles en 0, en los dos casos, `Rom/8/28` perdido                            |
| `turnoAntesDeClave` (`prep`)                                     | `'trabada'`, `retenida: 0`, los dos controles en 0, y `R9-310` (`aTiempo`)              |

- **Lo que pedía el mensaje:** sola, con `ajeno` y con `claveEnvuelta`, pasa. Con
  `genTrasMultiSetD+tardeClave25+ajenoTarde5` y con `ajenoTarde20`, `otraEnEspera: 0`. Con
  `tardeClave25`, 0. Con `genTrasSqlite` y `genTrasMultiSetD`, el rojo de siempre con 0 al lado. El
  revert pasa.
- **El revert, mirado:** su diff (en la salida de la corrida) tiene todas las líneas del commit al
  revés, y de más solo las de las tres piezas. Con solo el gancho de antes (`pa1f02511`) y la prueba
  nueva, el argumento se ignora y vuelven las dos caras de `R9-320`: el arreglo está en el gancho.
- **Los cortes (la regla de la 83):** no se movieron. `storeLento` 40/41, `claveLenta` 19/20 y
  `tardeClave` 19/20, con los mismos rojos que en la 87 y la 88.
- **El orden de las microtareas:** `S89-orden` da el mismo log, sello por sello, con el `oneAtATime`
  de `028a156`, el de `9d3f489` y el de hoy, y el `Set` queda vacío. El control (una microtarea de
  más) da otro log.
- **El suite:** `npm run validate` pasa (ver §5).

## 3. ¿Abre algo?

- **¿Qué orden deja sin armar? (75, 76).** Ninguno nuevo: el arreglo no cambia ninguna espera ni
  ninguna puerta, y la prueba lee en el mismo momento. El orden de la app tampoco cambia (§2).
- **¿Qué afirma un comentario? (80).** Ver §1: el primer borrador del de `otraEnEspera` decía de más,
  y se corrigió. «Una otra que escribe sin pedirlo da 0» vale ahora también con un ajeno de otra
  clave (`genTrasSqlite+ajeno`: 0). Con uno de la misma clave en la ventana, no: lo dice el
  comentario.
- **¿Qué cambio bueno lo hace caer? (82).** `ajeno`, `ajenoTardeK` y `claveEnvuelta` ya no. Lo hace
  caer un `prepWrite` de la misma clave esperando a la vez (`ajenoClaveTarde5`: 2). En la app no lo
  hay, por lectura: solo los cuatro stores llaman a `prepWrite` (`grep` en `src`), cada uno encadena
  los suyos (`writeQueue`: el siguiente pide el turno cuando el anterior terminó), y las claves de
  dos stores son distintas.
- **¿Algo lento por su cuenta? (84).** Los cortes no se mueven, y un ajeno que llega dentro de la
  ventana (`ajenoTarde20`, el que tumbaba `delta`) no cuenta.
- **¿Qué paso lee el control? (86).** El mismo que en la 87: el pedido del turno, el último paso
  antes de «espera el turno». Ahora, el pedido de esa clave.
- **¿De quién es lo que cuenta? (88).** De la clave, no de quién pidió. El residuo de la 88, medido
  en los dos casos: la 88 escribió que con `ajenoClaveTarde5` la prueba «cae igual por el otro caso»,
  y es cierto, pero con un ajeno de la clave de cada caso (`ajenoAmbasTarde5`) la regresión pasa. Va
  en la entrada de `R9-320`, sin número: hace falta un cambio de la app que pida dos escrituras de
  la misma clave a la vez.
- **Para el caso `durante` de `R9-296`** (sigue abierto): `muestra` lee la otra por su clave en
  `conStore` y en `devolucion` (`notas: 1`). En `conUnion`, la otra es una unión, y las uniones no
  llevan etiqueta: 0 con cualquier clave. Leer ese caso pide etiquetar también las uniones.

## 4. Que sea solo la prueba y el gancho

`git diff --stat 1f02511 538b1bc`: `__tests__/backupPrepTurn.test.ts` (20) y
`src/features/study/prepAccount.ts` (26), 30 más y 16 menos. En la app: el tipo del `Set`, la
etiqueta de `oneAtATime`, el argumento en `prepWrite`, el export y los comentarios.

## 5. El checkpoint

`npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con
`NODE_ENV=development` (`_scratch/S89-validate.out.txt`): exit 0. Typecheck limpio, lint con 0
errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites, 4632/4632 pruebas
(las mismas: el arreglo cambia una prueba, no agrega). El aviso de un worker que no salió solo ya
estaba en las validaciones de la 80 a la 88.

## 6. La lección

- **Que una prueba caiga por OTRO caso no cierra el hueco del primero.** La 88 midió el residuo de
  `porClave` con un ajeno de `@prep_notes`, vio la prueba caer por `devolucionPedidaAntes` y lo
  escribió como cerrado de hecho. Armado en cada caso, con la clave de cada uno
  (`ajenoAmbasTarde5`), la regresión pasa. Un residuo se mide en cada caso que lo lee, con la pieza
  hecha para ese caso.
  - **Corrección de la 90:** «lo escribió como cerrado de hecho» dice de más. La 88 lo puso en «lo
    que queda», con «aunque la prueba cae igual por el otro caso». Lo que la frase sugería, que no
    daba un verde, es lo que no se sostiene.
