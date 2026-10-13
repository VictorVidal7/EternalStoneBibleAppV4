# Sesión 85 — arreglos de lo de la 84 (2026-10-12)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S85-PROMPT.md` (el que
pegó Victor). Solo pruebas: no se tocó código de la app.

- **Estado al empezar:** `main` = `origin/main` = `c7962e0` (la 84, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37842535178`, 3 jobs, Node v24.21.0, 374/4632). Los docs decían
  «sin mergear» para la 84: corregido aquí. `main` no era más nuevo, así que no hizo falta volver a
  mirar el CI.
- **Ramas:** `fix/s85-r317-r318` (`7b4a79c`: `__tests__/prepAccount.test.ts`, `R9-317`; `b1519ae`:
  `__tests__/backupPrepTurn.test.ts`, `R9-318`) y `docs/review-s85-fix` encima, sin mergear hasta el
  OK de Victor.
- **Resultado:** cerrados `R9-317` y `R9-318`. Ninguno nuevo. Las dos hipótesis de la 84, medidas
  contra algo lento por su cuenta, tenían un hueco, y los arreglos van un paso más allá de ellas
  (§1 y §2). Quedan 318 hallazgos, ningún P0.

## 0. Cómo se trabajó

`_scratch/S85-sonda.cjs.txt`: la `S84-sonda`, más `lecturaLentaK` (un cambio bueno:
`getAllPrepNotes` da K vueltas entre su clave y la lectura), `caeConFalsos` y `sinAfterEach` (para
el `afterEach` de `R9-317`), `sinVueltaFoto` (para el comentario de `R9-318`) y `resueltaAlSoltar`
(una hipótesis intermedia). Las salidas, en `S85-sonda-*`; los resúmenes, en `S85-m317*.out.txt` y
`S85-m318*.out.txt`, y lo integrado en `S85-integrado.out.txt`. Cada matriz se corrió sobre la prueba
ya commiteada (las dos se rehicieron en la rama antes de cerrar, y se volvió a medir lo que
cambiaba). `git status` limpio tras cada corrida, y nunca corrieron dos sondas a la vez.

## 1. `R9-317` (`7b4a79c`): el control `antes`, tras una hora de relojes falsos y 1000 vueltas

- **El arreglo:** en las dos pruebas de `R9-314` y en «las claves esperan al primer estado de auth»,
  los relojes falsos se ponen antes de pedir la lectura (`relojesFalsos`, sin tocar `nextTick`,
  `queueMicrotask` ni `setImmediate`). `unaHora` adelanta una hora, devuelve los relojes reales y da
  1000 vueltas. Un `afterEach` los devuelve también si una prueba cae. El comentario dice que un
  plazo puesto a propósito haría caer estas pruebas, y da el corte.
- **Medido** (`prep`):

  | corrida                            | resultado                                                      |
  | ---------------------------------- | -------------------------------------------------------------- |
  | `nada`                             | 23/23                                                          |
  | `clavePlazo250`                    | caen las tres en `antes` (en el suite, 1001/1004)              |
  | `pat7b146a5+clavePlazo250`         | 23/23 (el revert)                                              |
  | `claveSinEsperar`                  | el mismo rojo que con la prueba de antes (las tres y `R9-310`) |
  | `claveAntesDeUnion`                | el mismo rojo que con la prueba de antes                       |
  | `claveAntesDeFinish`               | el mismo rojo que con la prueba de antes                       |
  | `lecturaLenta5` (cambio bueno)     | 23/23                                                          |
  | `clavePlazo250+lecturaLenta1`      | caen las tres                                                  |
  | `claveSinEsperar+lecturaLenta995`  | caen las tres en `antes` (y `R9-310`)                          |
  | `claveSinEsperar+lecturaLenta1005` | `antes` ya no lo ve (caen solo `R9-310` y la Mesa de antes)    |

- **La hipótesis de la 84 sola abría algo.** `esperaSinReloj` (la hora, sin las vueltas) daba las
  tres en `antes` con `clavePlazo250`, como dijo la 84. Pero `advanceTimersByTimeAsync` casi no da
  vueltas reales (cede con `setImmediate` entre temporizadores, y con ninguno pendiente, poco más).
  Con la lectura una vuelta más lenta (`lecturaLenta1`, un cambio bueno), `antes` dejaba de ver
  `clavePlazo250` en dos de las tres, y `claveSinEsperar` en las tres: «las claves esperan…» y «lo
  devuelto» pasaban con `claveSinEsperar+lecturaLenta1`. La prueba de antes (`7b146a5`) veía
  `claveSinEsperar+lecturaLenta5`. Por eso las 1000 vueltas, con su corte escrito (995 se ve, 1005
  no). Se arregló antes de cerrar la rama.
- **La prueba de antes dependía del reloj real:** con `pat7b146a5`, `claveSinEsperar+lecturaLenta20`
  no se veía en `antes` y `lecturaLenta100` sí, en la misma tanda. Sin número estable.
- **El `afterEach` no se ve hoy:** con `caeConFalsos` (la primera prueba cae con los relojes falsos
  puestos) cae solo esa, con y sin el `afterEach` (`caeConFalsos+sinAfterEach`): ninguna prueba
  siguiente del archivo usa temporizadores. Está para no depender de eso, y su comentario dice solo
  lo que hace.
- **¿Abre algo?** Lo de arriba, cerrado en la misma rama. El cambio bueno que la tumba es el que dice
  el comentario (un plazo a propósito). Una lectura más lenta que 1000 vueltas con una regresión
  pasa `antes`: es el corte, escrito.

## 2. `R9-318` (`b1519ae`): pendiente hasta que se suelta, y de vuelta antes de abrir

- **El arreglo:** una foto de las claves que `prepWrite` recibió antes del respaldo (tras la misma
  última vuelta de antes). `otraPedidaAntes` cuenta las de la foto que siguen pendientes justo antes
  de soltar la retenida (lo que pedía la 84) Y vuelven en las 20 vueltas que la prueba ya daba antes
  de abrir la puerta del respaldo: la otra llegó al turno con la escritura del respaldo retenida.
  Los comentarios dicen «pendiente hasta que se soltó la retenida», no «tras una vuelta».
- **Por qué un paso más que `pendienteAlSoltar`.** La primera versión de la rama era la pieza de la
  84, con la última vuelta conservada. Daba todo lo que pedía el mensaje. Pero contra una clave de
  otro lado más lenta (`claveCapturadaLentaK`, `-t R9-292`):
  - `claveCapturadaLenta100` sola pasaba con `otraPedidaAntes: 1` y el caso sin armar (la clave
    vuelve con la puerta ya abierta);
  - con `genTrasMultiSetD` (la regresión de generación que conserva el desvío de `R9-275`) encima,
    `claveCapturadaLenta100` y `1000` PASABAN. También con la prueba de la 84 (`bpt3a4d11a+…`): no lo
    abría la 85, solo subía el corte de 1-5 a unas 90 vueltas;
  - con `genTrasMultiSet` (sin el desvío), de 90 en adelante caía por otro lado (`ana: [Rom]`), y
    entre 60 y 80 en `escribioConElRespaldoRetenido: 1`: la clave vuelve en las 20 vueltas, con la
    puerta cerrada, y el caso queda armado de hecho.

  La hipótesis intermedia `resueltaAlSoltar` (vuelta en UNA vuelta tras soltar) cerraba eso, pero
  con una ventana de una vuelta un cambio bueno que derive la clave en dos caería. Las 20 vueltas que
  la prueba ya da antes de abrir dicen lo que importa: si volvió, llegó con la escritura retenida.

- **Medido** (lo integrado; `prep` salvo donde dice `-t R9-292`):

  | corrida                                                       | resultado                                                            |
  | ------------------------------------------------------------- | -------------------------------------------------------------------- |
  | `nada`                                                        | 23/23 (suite 1004/1004)                                              |
  | `claveEnvuelta`                                               | 23/23                                                                |
  | `claveCapturada`, `claveDosVeces`                             | `otraPedidaAntes: 0`, con `Rom/8/28` perdido                         |
  | `claveCapturadaLenta5`                                        | `otraPedidaAntes: 0` (y `R9-273` en `antesDeAbrir`, `R9-297`)        |
  | `claveCapturadaLenta5+genTrasMultiSet` (`-t`)                 | `otraPedidaAntes: 0`                                                 |
  | `bpt3a4d11a+claveCapturadaLenta5+genTrasMultiSet` (`-t`)      | pasa (el revert)                                                     |
  | `claveCapturadaLenta100`, y 100 y 1000 con `genTrasMultiSetD` | `otraPedidaAntes: 0` (`-t`)                                          |
  | `genTrasMultiSet`, `genTrasSqlite`                            | el rojo de siempre (el mismo diff que con la prueba de la 84)        |
  | `genTrasMultiSetD` (`-t`)                                     | `escribioConElRespaldoRetenido: 1`, `Rom/8/28` perdido               |
  | `turnoAntesDeClave`                                           | `'trabada'`, `retenida: 0`, `Rom/8/28`, y ahora `otraPedidaAntes: 0` |
  | `storeLento40` / `storeLento41` (`-t`)                        | pasa / solo `otraPedidaAntes: 0`                                     |
  | `sinVueltaFoto+storeLento40` (`-t`)                           | solo `otraPedidaAntes: 0` (lo que dice el comentario)                |
  | `claveLenta1`, `claveLenta5` (cambio bueno)                   | `R9-292` pasa; cae solo `R9-273` (`R9-297`)                          |
  | `claveLenta19` / `claveLenta20` (`-t`)                        | pasa / solo `otraPedidaAntes: 0`, sin pérdida                        |
  | `claveLenta1000+genTrasMultiSetD` (`-t`)                      | `otraPedidaAntes: 0`; con `bpt3a4d11a`, PASABA                       |

- **Lo nuevo que dice el control:** una clave derivada que vuelve 20 vueltas o más después de la
  retenida da solo `0`, sin perder nada. Con la prueba de la 84 pasaba (`claveLenta25`,
  `claveLenta1000`), también con el turno roto: la otra llegaba con la puerta abierta y nadie lo
  decía. El comentario lo dice, con el número.
- **El rojo de una traba:** con `turnoAntesDeClave`, la salida de `devolverConTope` suelta la clave
  antes del control, y el rojo dice también `otraPedidaAntes: 0`, junto a `'trabada'` y
  `retenida: 0`. `'trabada'` lo explica, y nunca da verde.
- **¿Abre algo?** No en lo medido. El corte de un store lento sigue en 40/41. La espera y la última
  vuelta son las de antes, así que los órdenes que arma el caso no cambian (`genTrasMultiSet` y
  `genTrasSqlite`, el mismo diff). La de `R9-273` sigue cayendo con una clave una vuelta más lenta:
  es `R9-297`, con cualquier versión.

## 3. Que sea solo la prueba

`git diff --stat c7962e0 b1519ae`: `__tests__/backupPrepTurn.test.ts` y
`__tests__/prepAccount.test.ts`, 80 líneas más y 30 menos. Nada de la app.

## 4. La lección

- **Un reloj falso da tiempo, no vueltas.** Una hora adelantada con `advanceTimersByTimeAsync` cede
  casi nada al bucle real: una lectura una vuelta más lenta y el control vuelve a no ver la
  regresión. Para decir «sigue esperando» hacen falta las dos cosas, el reloj y las vueltas, y el
  corte escrito.
- **«Pendiente hasta que se suelta» se lee a los dos lados del momento.** Pendiente justo antes de
  soltar no dice que fue lo soltado lo que la liberó: una clave de otro lado más lenta que todo el
  caso también lo está. Lo que dice «el caso se armó» es que VOLVIÓ después, con lo otro todavía
  retenido.
- **Una hipótesis medida en una revisión se vuelve a medir al integrarla.** Las dos de la 84 se
  midieron contra lo que motivó cada hallazgo, no contra algo lento por su cuenta (la regla de la 84,
  aplicada a sus propias hipótesis).
