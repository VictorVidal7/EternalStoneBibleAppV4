# Sesión 83 — arreglos de lo de la 82 y de `R9-314` (2026-10-08)

En el mismo chat que la 82 (lo pidió Victor: «continuemos con la siguiente»), en la terminal y sin
agentes, con el mensaje de `_scratch/S83-PROMPT.md`. Solo pruebas: no se tocó código de la app.

- **Estado al empezar:** `main` = `origin/main` = `d180732` (la 82, mergeada con el OK de Victor; CI
  verde en el log, run `37814148351`, 374/4630). Los docs decían «sin mergear» para la 82:
  corregido aquí.
- **Ramas:** `fix/s83-r314-r316` (`505b79b`: `__tests__/prepAccount.test.ts`, `R9-314`; `50b5442` y
  `7b146a5`: `__tests__/backupPrepTurn.test.ts`, `R9-315` y `R9-316`) y `docs/review-s83-fix`
  encima, sin mergear hasta el OK de Victor.
- **Resultado:** cerrados `R9-314`, `R9-315` y `R9-316`. Ninguno nuevo. Quedan 316 hallazgos,
  ningún P0.

## 0. Cómo se trabajó

`_scratch/S83-sonda.cjs.txt` (la `S82-sonda`, más `claveAntesDeUnion` y `claveAntesDelTurnoUnion`
de la sonda 2 de la 81, y tres piezas nuevas: `claveAlPedir`, `storeLentoK` y `sinDevolucion`). Las
salidas, en `S83-sonda-*`, y lo integrado en `S83-integrado.out.txt`. Cada matriz se corrió sobre la
prueba sin commitear, y lo integrado otra vez sobre lo commiteado. `git status` limpio tras cada
corrida.

## 1. `R9-314` (`505b79b`): dos lecturas pedidas antes del primer estado de auth

- **El arreglo:** dos pruebas en `prepAccount.test.ts`, con la regla de la 81 (lo leído solo existe
  en esa clave después del evento):
  - «la Mesa de antes»: con una nota propia de `ana` sembrada en su clave, la lectura tiene que dar
    las dos (`['John/3/16-21', 'Ps/23/1-6']`). Leída antes de la unión da solo la de `ana`; leída
    en la «sin cuenta» después, `[]`;
  - «lo devuelto de una cuenta borrada»: sin sesión, con una nota en la «sin cuenta» y la devolución
    de `bob` pendiente, tiene que dar las dos (`['Ps/23/1-6', 'Rom/8/28']`);
  - controles: `antes: null` (la lectura esperaba al primer estado) y `despues` (la unión o la
    devolución corrió).
- **Medido** (`prep`):

  | corrida                               | resultado                                                    |
  | ------------------------------------- | ------------------------------------------------------------ |
  | `nada`                                | 23/23                                                        |
  | `claveAntesDeUnion`                   | caen las dos lecturas (y `R9-310`, en `leido`)               |
  | `claveAntesDelTurnoUnion`             | caen las dos lecturas                                        |
  | `claveAntesDeFinish`                  | cae la de la devolución                                      |
  | `claveAlPedir` (la cuenta, al pedir)  | cae la de la Mesa de antes, en `leido: []` (y `R9-310`)      |
  | `claveSinEsperar`                     | caen las dos en el control `antes` (y «las claves esperan…») |
  | `patd180732+claveAntesDelTurnoUnion`  | 21/21 (el revert)                                            |
  | `patd180732+claveAntesDeFinish`       | 21/21 (el revert)                                            |
  | `migraLenta1000`, `turnoAntesDeClave` | las lecturas pasan (cae solo `R9-310`, como siempre)         |

- **¿Abre algo?** No en lo medido. Las lecturas no tienen tope: con una unión 1000 vueltas más
  lenta, esperan.

## 2. `R9-315` (`50b5442`): el control, por la clave pendiente

- **El arreglo:** `otraPedidaAntes` cuenta los `prepWrite` cuya clave sigue PENDIENTE tras una vuelta
  (la pieza `arregloPendiente` de la 82). Con el primer estado de auth ya dado, solo lo está la
  retenida o algo que espera por ella. La espera también va por eso.
- **Medido** (`prep`):
  - `claveEnvuelta` pasa; con la prueba de `505b79b` (`bpt505b79b+claveEnvuelta`), cae en
    `otraPedidaAntes: 0`;
  - `claveCapturada` y `claveDosVeces`, en `otraPedidaAntes: 0`, con `Rom/8/28` perdido;
  - `genTrasSqlite` y `genTrasMultiSet`, el rojo de siempre; `turnoAntesDeClave`, como antes.
- **El corte** (la regla de la 74; `storeLentoK`: `savePrepNote` K vueltas antes de `prepWrite`,
  código bueno, `-t R9-292`): la prueba de antes caía desde 20, y esta pasa hasta 40. Con 41, da solo
  `otraPedidaAntes: 0` (sin perder nada, a diferencia de `claveCapturada`). El comentario lo dice.
- **Lo que no es de la 83:** con `storeLento40`, cae también la de `R9-273` (con cualquier versión;
  con la prueba de `a32be3b`, ya con `storeLento20`): sus vueltas fijas. Sin número.

## 3. `R9-316` (`7b146a5`): una salida que suelta todo, también en `R9-275`

- **El arreglo:** un ayudante, `devolverConTope(uid, salida)`. Espera la devolución hasta 1000
  vueltas y, si no volvió, llama a `salida`, que suelta todo lo retenido. Da `'a tiempo'` (100 o
  menos), `'tarde'` o `'trabada'`.
  - En `R9-292`, la salida suelta la clave, SQLite y la puerta del respaldo (la pieza `salidaAbre`).
  - En `R9-275`, que esperaba `releasePrepAccount` sin tope antes de abrir SQLite, la salida abre
    SQLite, y se suma un control, `devuelta`.
- **Medido** (`prep`):

  | corrida                       | resultado                                                                   |
  | ----------------------------- | --------------------------------------------------------------------------- |
  | `nada`                        | 23/23, 2.4 s                                                                |
  | `turnoAntesSqlite`            | 2.1 s: `'trabada'` en `R9-292` y en `durante`/`muere` de `R9-275`; nada más |
  | `bpt50b5442+turnoAntesSqlite` | 41.9 s: `R9-292` y `R9-275` por timeout (el revert)                         |
  | `turnoAntesDeClave`           | 2.0 s: `R9-292` en `'trabada'` (y `retenida: 0`); `R9-275` pasa             |
  | `genTrasMultiSet`, `lento50`  | el rojo de siempre                                                          |
  | `sinDevolucion` (de `R9-275`) | caen `R9-275` y `R9-292`, con el mismo diff que con la prueba de antes      |

- **El corte** (`releaseLentoK`, código bueno): 100 pasa; de 101 a 1000, `'tarde'` en los dos; 1001,
  `'trabada'`. La traba de `turnoAntesSqlite` se distingue de una devolución lenta en `R9-275`: ahí
  `antes` dice `'a tiempo'`, y con la devolución lenta, también `'trabada'`. En `R9-292` dan el mismo
  rojo. Con `releaseLento100` caen `R9-274` y `R9-275` de `prepAccount.test.ts`, como antes (sus
  vueltas fijas).
- **¿Abre algo?** El tope de 100 vale ahora también para `R9-275`, que antes esperaba sin tope: una
  devolución de más de 100 vueltas da `'tarde'`. La devolución real tarda 1.

## 4. Lo integrado

Sobre lo commiteado (`7b146a5`; `S83-integrado.out.txt`):

- `prep`: 23/23. `claveEnvuelta` pasa. `claveCapturada`, `claveDosVeces`, `genTrasSqlite`,
  `genTrasMultiSet` y `soltarDespues+genFinTurno` tumban `R9-292`. `generacion` y `genEnSqlite`,
  también `pedido antes` de `R9-287`. `sinCola`, las de `R9-273`, `R9-292` y las tres de `R9-287`.
- El suite (`--findRelatedTests`): 1004/1004. Con `claveAntesDeFinish`, 1003/1004; con
  `claveAntesDelTurnoUnion`, 1002/1004.

## 5. La lección

- **Un arreglo de un control cambia también su espera: medí el corte otra vez.** Contar las claves
  pendientes aceptó el cambio bueno (`claveEnvuelta`), y la espera pasó de 20 vueltas a 40 (cada
  vuelta espera una más para ver la clave): el corte de un store lento se movió de 20 a 41.
- **Una salida se escribe una vez.** Las dos pruebas que esperaban la devolución con el respaldo en
  SQLite tenían la misma traba posible; con un ayudante que suelta todo, la salida no depende de
  adivinar qué la trabó.
