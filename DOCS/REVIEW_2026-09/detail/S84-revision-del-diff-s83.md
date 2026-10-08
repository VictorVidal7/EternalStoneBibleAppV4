# Sesión 84 — revisión del diff de la 83 (2026-10-08)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S84-PROMPT.md` (el que
pegó Victor). Solo docs: no se tocó código ni pruebas. En la 83, cada arreglo lo midió quien lo
escribió; aquí se buscó romperlo.

- **Estado al empezar:** `main` = `origin/main` = `637dc68` (la 83, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37819458101`, 3 jobs, Node v24.21.0, 374/4632). Los docs decían
  «sin mergear» para la 83: corregido aquí. `main` no era más nuevo, así que no hizo falta volver a
  mirar el CI.
- **Rama:** `docs/review-s84-diff-s83` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 83 cae como dice. Dos nuevos P3 de pruebas: `R9-317` (no lo abrió la 83)
  y `R9-318` (lo abrió la 83). Quedan 318 hallazgos, ningún P0.

## 0. Cómo se trabajó

`_scratch/S84-sonda.cjs.txt`: la `S83-sonda`, más `clavePlazoK`, `claveCapturadaLentaK`,
`claveLentaK` y dos hipótesis medidas (`esperaSinReloj` y `pendienteAlSoltar`). También imprime el
`Time:` de jest. Las salidas están en `S84-sonda-*`, y todas las corridas son sobre `main`
(`637dc68`, mismas pruebas que `7b146a5`). `git status` quedó limpio tras cada corrida, y nunca
corrieron dos sondas a la vez.

## 1. `R9-314` (`505b79b`): las dos lecturas

- **Cae como dice** (`prep`):

  | corrida                              | resultado                                                     |
  | ------------------------------------ | ------------------------------------------------------------- |
  | `nada`                               | 23/23                                                         |
  | `claveAntesDeUnion`                  | caen las dos lecturas (y `R9-310`, en `leido`)                |
  | `claveAntesDelTurnoUnion`            | caen las dos lecturas                                         |
  | `claveAntesDeFinish`                 | cae la de la devolución                                       |
  | `claveAlPedir`                       | cae la de la Mesa de antes, en `leido: []` (y `R9-310`)       |
  | `claveSinEsperar`                    | caen las dos en `antes` (y «las claves esperan…», y `R9-310`) |
  | `patd180732+claveAntesDelTurnoUnion` | 21/21 (el revert)                                             |
  | `patd180732+claveAntesDeFinish`      | 21/21 (el revert)                                             |
  | `turnoAntesDeClave`                  | las lecturas pasan (caen `R9-310` y `R9-292`, como en la 83)  |

- **`antes: null` dice «no terminó en un `setTimeout(0)`», no «esperaba al primer estado»:
  `R9-317`.** Pieza `clavePlazoK` (la clave espera el primer estado a lo sumo K ms):
  - en `prep`, `clavePlazo1` cae en `antes` en las tres pruebas, y `clavePlazo2` y `clavePlazo50`
    pasan 23/23. Con las pruebas de `d180732` (`patd180732+clavePlazo2`), 21/21: no lo abrió la 83;
  - en el suite, con `clavePlazo2`, 1003/1004. Lo ve solo «la cuenta se dice…» de
    `AuthContext.test.tsx`: su `claveAhora` compite con un temporizador de 200 ms. Con
    `clavePlazo250`, 1004/1004;
  - la hipótesis `esperaSinReloj` (relojes falsos desde antes de la lectura, y una hora
    adelantada): sola, 23/23. Con `clavePlazo250`, caen las tres en `antes`. Con `claveSinEsperar`,
    `claveAntesDeUnion` y `claveAntesDeFinish`, el mismo rojo que sin ella.
- **Las notas sembradas no cambian la unión ni la devolución.** `joinPrep` mueve lo que falta en el
  destino, y lo sembrado (`Ps/23/1-6`) no está en el origen. En la segunda, la «sin cuenta»
  sembrada es también «la Mesa de antes» para `migrateLegacyPrep`, y sin dueño ni sesión se queda
  donde está (lo que ya prueba «sin dueno ni sesion…»). Por lectura. No encontré un cambio bueno
  que las tumbe. Con `esperaSinReloj`, en cambio, un plazo puesto a propósito (una salida larga)
  caería.

## 2. `R9-315` (`50b5442`): el control por la clave pendiente

- **Cae como dice** (`prep`): `claveEnvuelta` pasa (23/23); `bpt505b79b+claveEnvuelta` cae en
  `otraPedidaAntes: 0`. `claveCapturada` y `claveDosVeces` dan 0, con `Rom/8/28` perdido. El corte
  (`-t R9-292`): `storeLento40` pasa; `storeLento41` da solo `otraPedidaAntes: 0`.
- **Una clave pendiente por su cuenta da 1 con el caso sin armar: `R9-318`.** Pieza
  `claveCapturadaLentaK`: el store guarda `prepKey` al cargar, y su clave tarda K vueltas.

  | corrida (`-t R9-292` salvo `prep`)                | resultado                                                    |
  | ------------------------------------------------- | ------------------------------------------------------------ |
  | `claveCapturadaLenta5` (`prep`)                   | `R9-292` pasa con `otraPedidaAntes: 1`; cae solo `R9-273`    |
  | `claveCapturadaLenta5+genTrasMultiSet`            | pasa                                                         |
  | `bpt505b79b+claveCapturadaLenta5+genTrasMultiSet` | cae en `otraPedidaAntes: 0` (y `Rom/8/28` perdido)           |
  | `bpt505b79b+claveCapturadaLenta5` (`prep`)        | `R9-292` cae en `otraPedidaAntes: 0`                         |
  | `claveCapturadaLenta5+genTrasSqlite`              | cae (`escribioConElRespaldoRetenido: 1`, `Rom/8/28` perdido) |
  | `genTrasMultiSet` (el control)                    | cae (`escribioConElRespaldoRetenido: 1`, `Rom/8/28` perdido) |
  - El rojo de `R9-273` sale igual sin la regresión. Es `R9-297`: con la clave del store una
    vuelta más lenta (`claveLenta1`, sin captura, un cambio bueno), `R9-273` cae en
    `antesDeAbrir: true`, también con la prueba de `a32be3b`. Ya lo había medido la 74 con `tarde1`.
    `claveCapturadaLenta2` y `claveCapturadaLenta3` dan lo mismo.
  - **Hipótesis medida, `pendienteAlSoltar`:** contar las claves pendientes justo antes de soltar la
    retenida. Sola, 23/23 (`prep`); con `claveEnvuelta`, pasa. Con `claveCapturada`, `claveDosVeces`,
    `claveCapturadaLenta5` y `claveCapturadaLenta5+genTrasMultiSet`, cae en `otraPedidaAntes: 0`.
    `genTrasMultiSet` y `genTrasSqlite` dan el rojo de siempre, y `turnoAntesDeClave`, `'trabada'`.
    La pieza quita la última llamada a `conLaRetenida()`, y el corte baja de 41 a 40
    (`pendienteAlSoltar+storeLento40` cae). Con esa llamada antes de la foto, sin medir.

## 3. `R9-316` (`7b146a5`): `devolverConTope`

- **Cae como dice** (`prep`):

  | corrida                                     | resultado                                                                  |
  | ------------------------------------------- | -------------------------------------------------------------------------- |
  | `turnoAntesSqlite`                          | 1.4 s: `'trabada'` en `R9-292` y en `durante`/`muere` de `R9-275`, sin más |
  | `bpt50b5442+turnoAntesSqlite`               | 41.4 s: `R9-292` y `R9-275` por timeout (el revert)                        |
  | `turnoAntesDeClave`                         | 2.0 s: `R9-292` en `'trabada'` y `retenida: 0`; `R9-275` pasa              |
  | `sinDevolucion`, `bpt50b5442+sinDevolucion` | caen `R9-292` y `R9-275`, con el mismo diff                                |
  | `lento50`                                   | el rojo de siempre                                                         |
  | `releaseLento100` / `101` / `1000` / `1001` | pasa / `'tarde'` / `'tarde'` / `'trabada'`, en `R9-292` y en `R9-275`      |

  Con `turnoAntesSqlite` caen también `durante` y `pedido antes` de `R9-287`, en
  `otraConElTurno: false`, como en la 82 y con la prueba de `50b5442`. No es de la 83. El «nada más»
  de `detail/S83` §3 vale para los rojos de `R9-292` y `R9-275`.

- **El ayudante da lo mismo que el bucle de la 81 en `R9-292`:** el mismo bucle, el mismo corte
  (`releaseLentoK`) y los mismos rojos (`turnoAntesDeClave`, `genTrasMultiSet`).
- **La salida abre antes de la escritura retenida:** el caso queda sin armar, pero el rojo lo dice.
  La salida corre solo si la devolución no volvió (`'trabada'`), y `'trabada'` nunca da verde. Con
  `turnoAntesSqlite`, el rojo de `R9-275` dice solo `'trabada'`, también en `muere`, aunque la
  salida abre SQLite antes de colgar la devolución.
- **El tope de `R9-275` ante un cambio bueno.** En vueltas, `releaseLento101` da `'tarde'` (la 83 lo
  dijo). En tiempo, `releaseTimerK` (un temporizador real al empezar `releasePrepAccount`):
  - `releaseTimer1`: `'tarde'` en `R9-292` y en los tres casos de `R9-275`;
  - `releaseTimer20`: `'trabada'` en los dos y en los tres;
  - con la prueba de `50b5442`: con 1 ms, pasa todo `backupPrepTurn.test.ts`; con 20 ms, cae solo
    `R9-292`. Para `R9-275`, lo abrió la 83;
  - pero `prepAccount.test.ts` ya caía con las dos versiones (`R9-275` siempre; `R9-274`, en tres de
    las cuatro corridas). El suite no aceptaba una devolución con temporizador (`detail/S82` §2).
    Sin número, como en la 82;
  - «una devolución lenta no da el rojo de la traba», en el comentario del ayudante, vale en
    vueltas: en tiempo, 20 ms dan `'trabada'`. En `R9-275` se distingue igual de la traba, porque
    `antes` también la da (con la traba, `antes` dice `'a tiempo'`).

## 4. Que sea solo la prueba

`git diff --stat d180732 7b146a5`: `__tests__/backupPrepTurn.test.ts` y
`__tests__/prepAccount.test.ts`, 136 líneas más y 27 menos. Nada de la app. `637dc68` es solo docs.

## 5. La lección

- **«Esperaba» se mide contra «tardó».** Un control leído tras un `setTimeout(0)` dice que algo no
  terminó en 1 ms. Para decir que espera un evento hay que darle todo el tiempo (relojes falsos, una
  hora) y ver que sigue esperando. Es la regla de la 73 («no pasó» no es «estaba esperando»), ahora
  en el tiempo real.
- **Un control de «pendiente» se corre contra algo pendiente por su cuenta.** La 83 lo midió contra
  un cambio bueno (`claveEnvuelta`) y contra regresiones que resuelven enseguida (`claveCapturada`);
  le faltó una clave de otro lado que tarda. Que el control lea el estado en el momento que importa
  (justo antes de soltar), no tras una vuelta.
