# Sesión 86 — revisión del diff de la 85 (2026-10-12)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S86-PROMPT.md` (el que
pegó Victor). Solo docs: no se tocó código ni pruebas. En la 85, cada arreglo lo midió quien lo
escribió; aquí se buscó romperlo.

- **Estado al empezar:** `main` = `origin/main` = `7ea20ce` (la 85, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `38328665462`, 3 jobs, Node v24.21.0, 374/4632; ramas borradas
  tras `git cherry`). Los docs decían «sin mergear» para la 85: corregido aquí. `main` no era más
  nuevo, así que no hizo falta volver a mirar el CI.
- **Rama:** `docs/review-s86-diff-s85` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 85 cae como dice. Un nuevo P3 de pruebas, `R9-319`: el verde no lo abrió
  la 85, pero sí la frase que lo descarta. Quedan 319 hallazgos, ningún P0.

## 0. Cómo se trabajó

`_scratch/S86-sonda.cjs.txt` es la `S85-sonda` con estas piezas nuevas:

- `tardeClaveK`: un cambio bueno; `prepWrite` da K vueltas entre su clave y el pedido del turno.
- `muestra`: imprime los controles de cada caso de `R9-292`.
- `cuentaRelojes`: al final de la hora falsa, cae si queda un temporizador falso o si se leyó
  `Date.now`. Su control es `fechaEnManage`.
- `caeConFalsosUltima`, y la hipótesis `enEspera`.

Las salidas están en `S86-sonda-*`. Los resúmenes, en `S86-m317.out.txt`, `S86-m318.out.txt`,
`S86-m318b.out.txt` y `S86-m318c.out.txt`. Todo se corrió sobre `main` (`7ea20ce`). `git status`
quedó limpio tras cada corrida, y nunca corrieron dos sondas a la vez.

## 1. `R9-317` (`7b4a79c`): la hora falsa y las 1000 vueltas

- **Cae como dice** (`prep`):

  | corrida                            | resultado                                                          |
  | ---------------------------------- | ------------------------------------------------------------------ |
  | `nada`                             | 23/23                                                              |
  | `clavePlazo250`                    | caen las tres en `antes` (en el suite, 1001/1004)                  |
  | `pat7b146a5+clavePlazo250`         | 23/23 (el revert)                                                  |
  | `claveSinEsperar`                  | las tres en `antes`, y `R9-310` en `recibida`                      |
  | `claveAntesDeUnion`                | `R9-310` en `leido`, y las dos lecturas                            |
  | `claveAntesDeFinish`               | la de lo devuelto                                                  |
  | `claveSinEsperar+lecturaLenta995`  | las tres en `antes` (y `R9-310`)                                   |
  | `claveSinEsperar+lecturaLenta1005` | `antes` ya no lo ve (caen `R9-310` y la Mesa de antes, en `leido`) |

- **La fecha y los temporizadores de la hora** (pieza `cuentaRelojes`). Con el código bueno, al final
  de la hora no queda ningún temporizador falso pendiente, y nadie leyó `Date.now` (23/23). Los
  controles: con `fechaEnManage`, «`Date.now` leído: 1» en las tres; con `clavePlazo7200000` (un
  plazo de dos horas), «relojes pendientes: 1» en las tres. Por lectura: en la hora corren solo
  `managePrepAccount()` y la lectura, que espera su clave. `prepAccount.ts` no lee la fecha, y
  `getAllPrepNotes` tampoco. `savePrepNote` la lee por defecto, pero en la hora no corre ninguna
  escritura. `new Date()` no se contó.
- **Un cambio bueno que las tumbe:** no encontré, aparte del plazo a propósito. En la hora, la
  lectura espera la clave, y lo que corre después de la clave corre con los relojes reales. Un
  temporizador puesto antes de la clave lo dispara la hora. Un plazo de más de una hora pasa: queda
  pendiente y se descarta al volver a los relojes reales (`clavePlazo7200000` lo muestra). Es el
  corte de «una hora» que dice el comentario.
- **El `afterEach`.** Si la ÚLTIMA prueba con relojes falsos (la de lo devuelto) cae con ellos
  puestos (`caeConFalsosUltima`), cae solo esa, con y sin el `afterEach`
  (`caeConFalsosUltima+sinAfterEach`). La 85 lo midió con la primera, que deja fuera solo las
  pruebas que hay hasta la siguiente con relojes falsos (esa los vuelve a poner y los devuelve). Las
  de después de la última (`R9-275` y `R9-269`) solo usan `setImmediate`, que no se falsea, y fechas
  explícitas (`T`). Su comentario dice lo que hace, y es cierto.
- **¿Abre algo?** No.

## 2. `R9-318` (`b1519ae`): pendientes al soltar, y de vuelta antes de abrir

- **Cae como dice** (`prep`, salvo donde dice `-t`, que es `-t R9-292`):

  | corrida                                                        | resultado                                                                       |
  | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
  | `claveEnvuelta`                                                | 23/23                                                                           |
  | `claveCapturada`, `claveDosVeces`                              | `otraPedidaAntes: 0` en los dos casos, con `Rom/8/28` perdido                   |
  | `claveCapturadaLenta5`                                         | `otraPedidaAntes: 0` en los dos casos (y `R9-273` en `antesDeAbrir`: `R9-297`)  |
  | `claveCapturadaLenta5+genTrasMultiSet` (`-t`)                  | `otraPedidaAntes: 0` en los dos casos                                           |
  | `bpt3a4d11a+claveCapturadaLenta5+genTrasMultiSet` (`-t`)       | pasa (el revert)                                                                |
  | `claveCapturadaLenta100` (`-t`), y 100 y 1000 con `…MultiSetD` | `otraPedidaAntes: 0` en los dos casos                                           |
  | `genTrasMultiSet`, `genTrasMultiSetD` (`-t`)                   | `escribioConElRespaldoRetenido: 1`, con `Rom/8/28` perdido                      |
  | `genTrasSqlite`                                                | `escribioConElRespaldoRetenido: 1` en los dos casos                             |
  | `turnoAntesDeClave`                                            | `'trabada'`, `otraPedidaAntes: 0`, `retenida: 0` (y `R9-310`, `aTiempo: false`) |
  | `storeLento40` / `storeLento41` (`-t`)                         | pasa / `otraPedidaAntes: 0` en los dos casos                                    |
  | `sinVueltaFoto+storeLento40` (`-t`)                            | `otraPedidaAntes: 0` en los dos casos                                           |
  | `claveLenta19` / `claveLenta20` (`-t`)                         | pasa / `otraPedidaAntes: 0` en los dos casos                                    |

- **La ventana de 60 a 90 vueltas** (`muestra+claveCapturadaLentaK`, `-t`, K de 45 a 90 de 5 en 5).
  El control da 1 en un solo caso a la vez: en `pedidaAntes`, de 45 a 60; en
  `devolucionPedidaAntes`, de 70 a 85. Nunca en los dos, así que con la pieza sola la prueba no pasa
  con ningún K. Con `genTrasMultiSetD` encima, en `devolucionPedidaAntes` con el control en 1 (70 y 85) sale `escribio: 1`: el caso queda armado de verdad. En `pedidaAntes` (45 y 60) el control da
  1 con `escribio: 0`, pero ese caso no ve nunca la marca tras el `multiSet` (va después de la
  escritura retenida: `R9-313`), y el otro caso cae (`escribio: 1`).
  - Por qué queda armado: lo que el store hace después de su clave (pedir el turno, leer, escribir)
    son microtareas, y Node las vacía entre un `setImmediate` y el siguiente. Si la clave volvió en
    las 20 vueltas, la otra ya pidió el turno. Eso vale mientras no haya vueltas entre la clave y el
    turno: `R9-319`.
- **`'trabada'` con `otraPedidaAntes: 0`: no engaña.** La salida de `devolverConTope` suelta la
  clave antes del control, así que al soltar ya no queda nada pendiente. En el diff,
  `devuelta: 'trabada'` va antes (jest ordena las claves), con `retenida: 0`. Y en `prep` cae
  también la de `R9-310`, con `aTiempo: false`, que nombra la traba. `'trabada'` nunca da verde. El
  comentario de `otraPedidaAntes` no nombra este 0, pero el de `devuelta` sí («sin soltar antes la
  clave de la otra»).
- **«Volvió la clave» no es «llegó al turno»: `R9-319`.** Pieza `tardeClaveK`. Sola, `R9-292` pasa
  con K = 19, 20, 21 y 25, y en `prep` cae solo `R9-273` (`antesDeAbrir: true`, ya con K = 1:
  `R9-297`).

  | corrida (`-t`, con `muestra`)              | resultado                                                                  |
  | ------------------------------------------ | -------------------------------------------------------------------------- |
  | `genTrasMultiSetD+tardeClave19`            | cae: `escribioConElRespaldoRetenido: 1`                                    |
  | `genTrasMultiSetD+tardeClave20`            | PASA                                                                       |
  | `genTrasMultiSetD+tardeClave25`            | PASA: `otraPedidaAntes: 1` en los dos casos `pedidaAntes`, y `escribio: 0` |
  | `bpt7b146a5+genTrasMultiSetD+tardeClave25` | PASA (la prueba de la 84)                                                  |
  | `bptdcc7bfa+genTrasMultiSetD+tardeClave25` | PASA (la del quinto caso, `R9-313`)                                        |
  | `genTrasMultiSet+tardeClave19`             | cae: `escribio: 1` en `devolucionPedidaAntes`                              |
  | `genTrasMultiSet+tardeClave20`, `25`       | cae solo por `ana` (escribe bajo el uid borrado: no conserva el desvío)    |
  | `genTrasSqlite+tardeClave25`               | cae solo por `ana`                                                         |
  - En `prep` y en el suite (1001/1004), `genTrasMultiSetD+tardeClave25` da el mismo rojo que
    `tardeClave25` sola: la regresión no suma nada. En el suite, ese rojo es `R9-273` y dos de
    `prepSeriesDetailScreen.test.tsx` (ver abajo).
  - El verde no lo abrió la 85, pero la frase sí: la 85 escribió que el control dice «la otra llegó
    al turno con su escritura retenida».
  - **Arreglo (hipótesis, pieza `enEspera`): el gancho de `R9-296`.** `prepAccount` cuenta los
    pedidos que esperan el turno. En los dos casos `pedidaAntes`, el control pide que, al leerlo,
    la otra esté esperando. Medido plegado en `otraPedidaAntes` (`-t`, salvo `prep`):
    - sola, 23/23 (`prep`). Con `claveEnvuelta` y con `tardeClave19`, pasa: el gancho da 1;
    - con `tardeClave25`, sola o con `genTrasMultiSetD`, `otraPedidaAntes: 0` en los dos casos. El
      verde falso pasa a ser un rojo que dice «el caso no se armó», como el de un store lento;
    - los cortes no cambian (`storeLento` 40/41, `claveLenta` 19/20). `claveCapturada` y
      `claveCapturadaLenta100+genTrasMultiSetD` siguen en 0. Con `turnoAntesDeClave`, `'trabada'`;
    - con `genTrasSqlite`, el gancho da 0 (la otra no pide el turno). Plegado, el rojo suma
      `otraPedidaAntes: 0` al `escribio: 1`, y se lee como «no se armó». Mejor como campo propio
      (`otraEnEspera`), como proponía `R9-296`: así `otraPedidaAntes` sigue en 1 con la regresión
      (lo dice `muestra`), con `otraEnEspera: 0` al lado. Como campo propio, sin correr.

- **Visto de paso, sin caracterizar.** En el suite, con `tardeClave25` (sola y con
  `genTrasMultiSetD`), caen también dos pruebas de `prepSeriesDetailScreen.test.tsx`: «removes a
  passage…», en un `waitFor`, y «reorders a passage down…», sin `John/1/1`. Ese archivo no usa
  relojes falsos. Corrido junto a los de `prep`, pasa con K = 1, 5 y 25. Sin número.
- **¿Abre algo la 85?** El verde de `R9-319` ya estaba; la 85 escribió la frase que lo descarta. Lo
  demás, no en lo medido.

## 3. Que sea solo la prueba

`git diff --stat c7962e0 b1519ae`: `__tests__/backupPrepTurn.test.ts` (71 líneas) y
`__tests__/prepAccount.test.ts` (39), 80 más y 30 menos. Nada de la app.

## 4. La lección

- **«Volvió la clave» no es «llegó al turno».** La 85 movió el control al momento justo (antes de
  soltar, y de vuelta antes de abrir), pero sigue leyendo la clave, un paso antes de lo que afirma.
  Entre la clave y el turno cabe una demora que el control no ve, y con ella el caso no se arma.
  Que el control lea el último paso antes de lo que afirma: aquí, que la otra está esperando el
  turno. Es la regla de la 72 («un control de llegada tiene que nombrar QUÉ llegó»), un paso más
  adentro.
- **Una ventana del control se mide caso por caso.** La pregunta de la 85 («¿la clave que vuelve
  justo ahí arma el caso?») se contestó con `muestra`: las ventanas de los dos casos no se pisan, y
  donde el control da 1, la regresión se ve.
