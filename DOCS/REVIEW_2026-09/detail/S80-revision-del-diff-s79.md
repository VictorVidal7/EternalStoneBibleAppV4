# Sesión 80 — revisión del diff de la 79 (2026-10-07)

En el MISMO chat que escribió la 79 (Victor: «continuemos con la siguiente»; la recomendación era un
chat nuevo, y la regla de la 60 dice que esto no es una mirada fresca). En la terminal, sin agentes
y sin tocar código. Con `_scratch/S80-PROMPT.md`. Para compensar, la sonda probó piezas nuevas
contra lo que la 79 da por hecho, no solo lo que la 79 midió.

- **Estado al empezar:** `main` = `origin/main` = `d9e127c` (la 79 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37729787425`, 3 jobs, Node v24.21.0, 374/4630). Los docs decían
  «sin mergear» para la 79: corregido aquí.
- **Rama:** `docs/review-s80-diff-s79` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 79 cae como dice, pero hay 3 nuevos P3 de pruebas: `R9-311` y `R9-312`
  (los abrió la 79) y `R9-313` (no). Quedan 313 hallazgos, ningún P0.

## 0. Cómo se trabajó

- `_scratch/S80-sonda.cjs.txt <corrida[,corrida]> archivo|prep|suite [args de jest]`, armada por
  `S80-gen.cjs.txt`: la `S79-sonda` con salidas `S80-sonda-*`, más:
  - `claveCapturada`: `prepNotesStore` guarda `prepKey` al cargar el módulo (el `spyOn` de la prueba
    no lo intercepta);
  - `claveDosVeces`: `savePrepNote` pide una clave de más, antes de la suya;
  - `claveSinEsperar`: `prepKey` no espera al primer estado de auth (una regresión de `R9-59`);
  - `genTrasMultiSet`: la marca de `generacion` después del `multiSet` del respaldo, dentro de su
    turno y antes de la devolución de `R9-275`;
  - `devolucionPedidaAntes`: un quinto caso en la prueba de `R9-292`, `pedidaAntes` con la cuenta
    borrada;
  - `arregloClave`, `arregloOrden`: los arreglos propuestos, como piezas.
- `git status` limpio tras cada corrida.

## 1. El caso `pedidaAntes` (`R9-309`, `dc63e01`)

- **Cae como dice** (`prep`):
  - `genTrasSqlite` cae solo en `R9-292`, y `generacion` y `genEnSqlite` también en `pedido antes`
    de `R9-287`;
  - `bpt00e666c+genTrasSqlite` pasa 21/21;
  - `sinCola` tumba las de `R9-273`, `R9-292` y los tres casos de `R9-287`;
  - `turnoAntesDeClave` hace caer `pedidaAntes` con `retenida: 0`.
- **La clave retenida con un `spyOn` (la regla de la 72): `R9-311`.**
  - `otraPedidaAntes` cuenta las llamadas a `prepWrite`, no que reciban la clave retenida.
  - Con `claveCapturada` o `claveDosVeces`, la clave no queda retenida: el store escribe antes del
    respaldo, y el respaldo lo reemplaza, como debe.
  - La prueba cae con el diff exacto de `genTrasSqlite` (`escribioConElRespaldoRetenido: 1`,
    `Rom/8/28` perdido) y `otraPedidaAntes: 1`. `escribio` cuenta desde que empieza el caso, y aquí
    el store se pide ANTES.
  - Con `arregloClave` (contar los `prepWrite` que reciben LA promesa retenida), el rojo de esas dos
    piezas dice `otraPedidaAntes: 0`; con `genTrasSqlite`, el de siempre con el control en 1.
  - Si `savePrepNote` pidiera la clave más tarde, pero antes de `prepWrite` (dentro de su cola), el
    `spyOn` sigue puesto durante la espera y la retiene: no se midió una pieza, es la lectura del
    orden.
- **La lección de la 75 y de la 76 (¿fija un punto?): `R9-313`.**
  - El caso suelta la clave con la escritura del respaldo retenida. Pero el turno del respaldo
    sigue después del `multiSet`: con una cuenta borrada, la devolución de `R9-275` va dentro de él.
  - Con `genTrasMultiSet`, `prep` 21/21 y el suite 1002/1002.
  - El daño, con `devolucionPedidaAntes`: con el código bueno pasa (lo de `devolucion` con
    `otraPedidaAntes: 1`); con `genTrasMultiSet` cae con `escribioConElRespaldoRetenido: 1`, y
    `Rom/8/28` se pierde. También cae con `genTrasSqlite`.
  - **El quinto caso, tal cual, no sirve de arreglo:** con `turnoAntesDeClave` se cuelga
    (`releasePrepAccount` espera el turno que tiene el store, y el store espera la clave). La prueba
    cae por timeout (20 s), y cae también la de `R9-275`, que va después.
  - La frase de `detail/S79` §1 («el caso suelta la clave lo más tarde posible») vale solo sin
    devolución.

## 2. La prueba de la traba (`R9-310`, `4f882ab`)

- **Cae como dice:**
  - `turnoAntesDeClave` cae con `escrito`, `entro` y `aTiempo` en `false`;
  - `pat00e666c+turnoAntesDeClave`: en `prepAccount.test.ts` pasan todas;
  - `migraLenta99` pasa; `100` y `999` caen solo en `aTiempo`; `1000`, con el rojo de la traba;
  - `conSave+turnoAntesDeClave` tumba 4 pruebas siguientes.
- **El control final: `R9-312`.** `['John/3/16-21', 'Ps/23/1-6']` no dice «a la de `ana`, después
  de la unión»: la unión junta la Mesa «sin cuenta» con la de la cuenta, y una escritura que va a
  `@prep_notes` antes de la unión termina igual en la de `ana`.
  - Con `claveSinEsperar`, la de `R9-310` pasa (la regresión la ve «las claves esperan al primer
    estado de auth»).
  - Con `arregloOrden` (comprobar la clave que recibió la escritura, `'@prep_notes:ana'`), cae en
    `recibida: '@prep_notes'`.
- **¿La traba se construye por la unión de `migrateLegacyPrep`?** Sí. La prueba siembra la Mesa de
  antes y el `beforeEach` vacía el almacenamiento, así que la migración une (y pide turno).
  `finishRelease` pide turno solo con una devolución pendiente (`prepAccount.ts:287`), y la prueba
  no la arma. `turnoAntesDeClave` traba por cualquiera de las dos. No encontré una regresión que
  trabe solo por la de `finishRelease`. Por lectura, sin medir.

## 3. Que sea solo la prueba

`git diff --stat 00e666c 4f882ab`: solo `__tests__/backupPrepTurn.test.ts` (46+, 2−) y
`__tests__/prepAccount.test.ts` (46+).

## 4. Nuevos

- **`R9-311`** (P3): con la clave sin retener, `pedidaAntes` da el rojo exacto de la regresión con
  `otraPedidaAntes: 1`. Lo abrió la 79. Arreglo medido: `arregloClave`.
- **`R9-312`** (P3): el control final de `R9-310` no dice lo que afirman su comentario y su commit.
  Lo abrió la 79. Arreglo medido: `arregloOrden`.
- **`R9-313`** (P3): la marca de `generacion` tras el `multiSet`, ya en la devolución, no la ve
  ninguna prueba. No lo abrió la 79. Arreglo: el quinto caso, con una salida para no colgarse con
  `turnoAntesDeClave`.

## 5. La lección

- **Un control que cuenta llamadas no dice que la puerta retuvo: compará la identidad de lo
  retenido.** `otraPedidaAntes` contaba `prepWrite`, y con la clave sin retener el caso dio el rojo
  exacto de la regresión. Si una prueba arma su caso con un `spyOn`, el control tiene que decir que
  la llamada que importa recibió LO que el `spyOn` devolvió. Y un contador que se lee al final
  cuenta también lo de antes del caso.
- **«Lo más tarde posible» se mide contra el turno ENTERO del otro.** El turno del respaldo no
  termina con su `multiSet`: con una cuenta borrada, sigue con la devolución.
- **Un comentario de prueba que dice «después de» tiene que tener un control de orden.** Un
  resultado final que sale igual en los dos órdenes no lo es.
