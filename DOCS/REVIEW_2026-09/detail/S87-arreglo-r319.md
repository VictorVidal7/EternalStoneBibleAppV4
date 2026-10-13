# Sesión 87 — arreglo de `R9-319` (2026-10-12)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S87-PROMPT.md` (el que
pegó Victor). Un commit de prueba y gancho, `9d3f489`. Lo midió quien lo escribió: es la clase de
revisión que no es una mirada fresca (la regla de la 60).

- **Estado al empezar:** `main` = `origin/main` = `028a156` (la 86, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `38333527542`, 3 jobs, Node v24.21.0, 374/4632; rama borrada tras
  `git cherry`). Los docs decían «sin mergear» para la 86: corregido aquí. `main` no era más nuevo,
  así que no hizo falta volver a mirar el CI.
- **Ramas:** `fix/s87-r319` (`9d3f489`) y `docs/review-s87-fix` encima (solo docs), sin mergear
  hasta el OK de Victor.
- **Resultado:** cerrado `R9-319`. Ninguno nuevo. Quedan 319 hallazgos, ningún P0.

## 0. Cómo se trabajó

`_scratch/S87-sonda.cjs.txt` es la `S86-sonda` sobre la prueba nueva, con estas piezas:

- `muestra`: imprime los controles de cada caso al leer `otraEnEspera`, también el gancho;
- `ganchoSinBorrar` (el gancho roto: cuenta los pedidos, no los que esperan);
- `sinLimpiar` (el reset no limpia los pedidos que esperan);
- `soloEnEspera` (sin el control de la clave: `otraPedidaAntes` da siempre su valor esperado).

`enEspera` ya no aplica: era la hipótesis. Las salidas están en `S87-sonda-*`. Los resúmenes, en
`S87-m1.out.txt` (`prep`), `S87-m2.out.txt` y `S87-m3.out.txt` (`-t R9-292`, `soloEnEspera` en el
tercero). Los controles por caso de la segunda tanda están en `S87-m2-casos.out.txt`. Todo se corrió sobre `9d3f489`. `git status` quedó limpio tras cada corrida,
y nunca corrieron dos sondas a la vez.

## 1. El arreglo (`9d3f489`)

- **El gancho, en `src/features/study/prepAccount.ts`.** Es el de `R9-296`, que Victor decidió el
  2026-10-07. `oneAtATime` anota cada pedido en un `Set` al pedir el turno y lo quita al empezar.
  `__prepTurnWaitingForTests()` dice cuántos esperan, y `__resetPrepAccountForTests()` limpia el
  `Set`, como reinicia `turn`. El `Set` se lleva también en la app, y solo lo leen las pruebas.
  El orden de las microtareas no cambia: `fn` se llama en la misma reacción que antes. Lo confirman
  los cortes, que no se movieron.
- **El campo, en `__tests__/backupPrepTurn.test.ts`.** `otraEnEspera` es un campo propio, sin
  plegarlo en `otraPedidaAntes`. En los dos casos `pedidaAntes` se lee en el mismo momento que
  `otraPedidaAntes` (20 vueltas tras soltar la clave, antes de abrir), y se espera `1`. En los otros
  tres casos vale `null`: el caso `durante` de `R9-296` queda para otra sesión.
- **Los comentarios.** El de `otraPedidaAntes` dice ahora «volvió la clave con la escritura del
  respaldo retenida», y que lo del turno lo dice `otraEnEspera`. El de `otraEnEspera` dice lo del
  turno, el verde de `R9-319`, y que una otra que escribe sin pedir el turno da 0, junto a la
  escritura que corrió.

## 2. Medido

`prep`, salvo donde dice `-t`, que es `-t R9-292`. Lo marcado `(m)` se corrió con `muestra`.

| corrida                                           | resultado                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `nada`                                            | 23/23                                                                            |
| `bpt028a156+genTrasMultiSetD+tardeClave25` (`-t`) | PASA (el revert: la prueba de la 86)                                             |
| `genTrasMultiSetD+tardeClave25`                   | `otraEnEspera: 0` en los dos `pedidaAntes` (y `R9-273`: `R9-297`)                |
| `tardeClave25`                                    | el mismo rojo                                                                    |
| `tardeClave19` / `tardeClave20` (`-t`, m)         | pasa / solo `otraEnEspera: 0` en los dos, con `otraPedidaAntes: 1`, sin pérdida  |
| `genTrasMultiSetD+tardeClave19` (`-t`, m)         | `escribio: 1` y `otraEnEspera: 0` en `devolucionPedidaAntes`, `Rom/8/28` perdido |
| `genTrasMultiSetD+tardeClave20`, `25` (`-t`, m)   | `otraEnEspera: 0` en los dos, con `escribio: 0`                                  |
| `genTrasSqlite`                                   | `escribio: 1` y `otraEnEspera: 0` en los dos, con `otraPedidaAntes: 1`           |
| `genTrasMultiSet`, `genTrasMultiSetD`             | `escribio: 1` y `otraEnEspera: 0` en `devolucionPedidaAntes`                     |
| `claveEnvuelta`                                   | 23/23 (en `-t`, el gancho da 1 en los dos)                                       |
| `claveCapturada`, `claveDosVeces`                 | `otraPedidaAntes: 0` y `otraEnEspera: 0` en los dos, `Rom/8/28` perdido          |
| `claveCapturadaLenta100+genTrasMultiSetD` (`-t`)  | los dos controles en 0, en los dos casos                                         |
| `claveCapturadaLenta5+genTrasMultiSet` (`-t`, m)  | `pedidaAntes`: `otraPedidaAntes: 0` con `otraEnEspera: 1`; el otro, los dos en 0 |
| `storeLento40` / `storeLento41` (`-t`, m)         | pasa / solo `otraPedidaAntes: 0`, con `otraEnEspera: 1`                          |
| `claveLenta19` / `claveLenta20` (`-t`, m)         | pasa / los dos controles en 0, sin pérdida                                       |
| `turnoAntesDeClave`                               | `'trabada'`, `retenida: 0`, los dos controles en 0 (y `R9-310`, `aTiempo`)       |
| `ganchoSinBorrar`                                 | `otraEnEspera: 5` y `3`                                                          |
| `sinLimpiar`                                      | 23/23                                                                            |

- **Lo que pedía el mensaje:** `otraEnEspera: 0` con `genTrasMultiSetD+tardeClave25` y con
  `tardeClave25`. Pasa con `tardeClave19` y con `claveEnvuelta`. Con `genTrasSqlite`, el rojo de
  siempre, con `otraPedidaAntes: 1` y `otraEnEspera: 0` al lado. El revert pasa.
- **Los cortes (la regla de la 83):** `storeLento` sigue en 40/41, y `claveLenta` en 19/20. Los dos
  rojos dicen «no se armó», sin pérdida. Con `storeLento41`, el store recibe su clave después de la
  foto (`otraPedidaAntes: 0`), y espera el turno (`otraEnEspera: 1`). `tardeClave` queda en 19/20,
  y de 20 en adelante ya no pasa: da solo `otraEnEspera: 0`, el rojo de un caso sin armar. Con
  `genTrasMultiSetD` encima, el mismo corte: con 19 se ve la regresión, y desde 20, el caso sin
  armar.
- **Los dos controles discrepan.** Con `storeLento41`, y con
  `claveCapturadaLenta5+genTrasMultiSet` en `pedidaAntes`, la otra espera el turno
  (`otraEnEspera: 1`), pero su clave no estaba en la foto, o no era la retenida
  (`otraPedidaAntes: 0`). Con `storeLento41` el caso queda armado de hecho: sin el control de la
  clave (`soloEnEspera`), `genTrasMultiSetD` se ve (`escribio: 1` en `devolucionPedidaAntes`). Ese
  `0` es el que ya dice el comentario: «un store más lento da solo `0`», desde la 83.
- **¿Hace falta el control de la clave?** Sin él (`soloEnEspera`, `-t`, con `muestra`), no pasa
  ninguna de diez corridas: `storeLento41+genTrasMultiSetD`, `claveCapturadaLentaK` (K = 5, 20, 40,
  60, 80 y 100, con `genTrasMultiSetD`; K = 5, también con `genTrasMultiSet`), `claveCapturada` y
  `claveDosVeces`. En cada una, algún caso da `otraEnEspera: 0` o `escribio: 1` (`S87-m3.out.txt`).
  Se quedan los dos, como pedía el mensaje: cada uno nombra un paso (la clave retenida, el turno).
  No está medido que el de la clave haga falta.
- **El gancho, roto:** contando los pedidos en vez de los que esperan (`ganchoSinBorrar`), da 5 y 3,
  y la prueba cae.
- **El reset:** sin `waiting.clear()` (`sinLimpiar`) no cae nada. Ninguna prueba deja un pedido
  esperando en una cadena vieja. Se queda porque va con `turn = Promise.resolve()`: un pedido de la
  cadena vieja ya no espera el turno nuevo. La regla de la sesión 26 pide medir una guarda antes de
  quedarse. Aquí no se quita: es parte del reset del módulo, no una guarda de la app.

## 3. ¿Abre algo?

- **¿Qué orden deja sin armar?** Ninguno nuevo. La lectura del gancho es síncrona, y la del campo va
  en el mismo momento que la de `otraPedidaAntes`. El envoltorio de `oneAtATime` llama a `fn` en la
  misma reacción. Los cortes no se movieron.
- **¿Qué afirma un comentario?** Lo medido: el verde de `R9-319` (el revert, con 25), «da 0, junto
  a la escritura que corrió» (`genTrasSqlite`, `genTrasMultiSet`), y «volvió la clave» para
  `otraPedidaAntes`. El comentario del `Set` dice «only tests read it», no «for tests only»: el
  `Set` también se lleva en la app.
- **¿Qué cambio bueno la hace caer?** `tardeClaveK` con K ≥ 20, que antes pasaba. Ahora da un rojo
  que dice «no se armó» (la clase de `storeLento41`). La de `R9-273` ya caía con K = 1 (`R9-297`).
  Reescribir `oneAtATime` sin anotar los pedidos da `otraEnEspera: 0`: el gancho es parte del
  contrato de la prueba, y su comentario lo nombra.
- **¿Qué pasa con algo lento por su cuenta?** El store (`storeLento41`), la clave de otro lado
  (`claveCapturadaLenta5`, `100`), la clave derivada (`claveLenta20`) y el paso de la clave al turno
  (`tardeClave20`) dan rojos, ninguno verde: el caso sin armar, o (`storeLento41`) la clave fuera de
  la foto con el caso armado, que el comentario ya dice. Algo ajeno que pidiera el turno en esa
  ventana contaría como «la otra»: el gancho cuenta pedidos, no de quién son. En la prueba no hay
  ningún otro (la escritura de antes y la unión de `setPrepAccount` ya volvieron). Sin sonda.
- **¿Qué paso lee el control?** `otraEnEspera` lee el pedido del turno sin empezar, el último paso
  antes de correr dentro de él. `otraPedidaAntes` lee el anterior (la clave).

## 4. Que sea solo la prueba y el gancho

`git diff --stat 028a156 9d3f489`: `__tests__/backupPrepTurn.test.ts` (20 líneas) y
`src/features/study/prepAccount.ts` (19), 36 más y 3 menos. En la app: el `Set`, el envoltorio de
`oneAtATime`, la limpieza en el reset y el export.

## 5. La lección

- **Una lección también se mide antes de escribirla.** El primer borrador de este detalle decía:
  «un control del último paso no reemplaza a los anteriores; plegados, dejaban un paso sin leer».
  Lo segundo era falso por construcción: plegado, el control es un Y de los dos pasos, así que lee
  los dos y solo calla cuál falló. Lo primero no lo mostró ninguna de diez corridas sin el control
  de la clave (`soloEnEspera`). Es la regla de la 31 («una hipótesis escrita sigue siendo una
  hipótesis»), aplicada a la frase que va a la memoria.
- **Un control que lee el paso que afirma cambia un verde por un rojo de caso sin armar, sin mover
  los cortes.** Con `tardeClaveK` (K ≥ 20), la prueba pasaba con el turno roto. Ahora da
  `otraEnEspera: 0`, y los cortes de `storeLento`, `claveLenta` y `tardeClave` siguen donde estaban.
