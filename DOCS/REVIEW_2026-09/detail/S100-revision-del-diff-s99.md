# Sesión 100 — revisión del diff de la 99 (2026-10-14)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S100-PROMPT.md`. Revisa
`08da00b..5aa5c96`. Es el mismo modelo que escribió los arreglos, y esta vez sin agentes que buscaran
romperlos: se compensó con sondas hechas para romper lo de la 99 (fallas que se repiten, llamadores
lentos, el hueco entre pruebas, varios estados), no con las que ya pasaban (la regla de la 60).

- **Estado al empezar:** `main` = `origin/main` = `9543a9b` (la 99, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `38651949786`, 3 jobs, Node v24.21.0, 374/4665). Comprobado con
  `git fetch` y `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar.
  Los docs decían «sin mergear» para la 99: corregido aquí.
- **Rama:** `docs/review-s100-diff-s99` (solo docs), sin mergear hasta el OK de Victor. Se escribió
  en un worktree aparte (`../essb-docs-s100`, fuera del repo) mientras la matriz corría en el
  principal.
- **Resultado:** lo de la 99 se sostiene como código. Cinco nuevos, P3 y P3 bajo: `R9-348`..`R9-352`.
  Quedan 352 hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S100-gen.cjs.txt`: la `S100-sonda.cjs.txt` desde `S99-sonda.cjs.txt`, con las piezas de
    `S100-propias.txt` (bloques `// S100-o`). Salida: `S100-sonda-<corrida>-<modo>.out.txt`; las de la
    99 quedan para comparar.
  - `S100-matriz.cjs.txt`: la lista de la 99 más las 39 piezas que la 99 re-midió aparte (`EXTRA99`).
    Compara cada salida con `S99-sonda-<c>-prep.out.txt` y avisa si alguna no es del `prep` entero.
  - `S100-resumen.cjs.txt`: las pruebas que caen por corrida, y pares «a=b».
  - Las tandas: `S100-tanda1..4.out.txt`.
- **Corridas:** `--maxWorkers=3` en `prep` y 4 en el suite. Ninguna dejó el árbol sucio.
- **Deslices:**
  - Unas piezas se agregaron a `S100-propias.txt` con un heredoc (con el delimitador entre comillas:
    los `\n` llegaron intactos, verificado), y un resumen se hizo con un `node -e` con barras. Las dos
    cosas van contra la regla; después, `S100-resumen.cjs.txt` escrito con Write.
  - `fallaSiempre343` hacía fallar también la lectura final del ayudante; se rehízo
    (`fallaSiempre343b`).

## 1. El código (`54bb2f3`)

- **Solo eso cambia** (`S99-igual.cjs.txt`, la regla de la 65): `AuthContext.tsx`, TODOS IGUALES
  contra `08da00b`; el control contra `a85df96~1` dice HAY DIFERENCIAS. En `prepAccount.ts`, las
  líneas del diff que no son comentario son `restoreNumbers`, `restores`, `restoreAsk` y
  `__prepThisRestoreWaitingForTests`.
- **Costo en la app, por lectura:** una entrada del `WeakMap` por respaldo, que se va con su arreglo,
  y un contador; la etiqueta es la de la 97 más un número. El gancho no le pone número a nadie: el
  `has` va antes. Sin medir el tiempo; la 98 midió la etiqueta (18-24 ms con cien mil claves), y el
  número no cambia eso.
- **¿Alcanza el `has`?** En la única prueba que usa el gancho (la de `R9-298`), por construcción sí.
  - El gancho se lee con la puerta cerrada, así que el pedido de ESTE arreglo no puede dejar la cola
    antes.
  - El número solo distingue un caso: este pedido ya corrió y otro de las mismas claves espera. Esa
    prueba no puede armarlo.
  - Medido en la 99 y re-medido en la matriz (sin cambios): `sinNumero342` pasa; con
    `goneAlPedirTarde1+ajenoMismaClaveNeutro298` cae igual.
  - Es la segunda guarda que ninguna prueba vigila (del Pendiente de la 99), y su comentario es
    cierto. No se numera.
- **«Not reset between tests»**, la razón del contador, no protege nada: `R9-352`.

## 2. Los comentarios

- **La oración de `prepKey`:** las frases de `__tests__/` que la citan (`R9-324`, las tres de
  `R9-345`) dicen lo mismo. Las regresiones de la 99 que la leen de otro modo (`claveConocidaAlLlegar`,
  `claveTrasMigrar`, `claveTras*`) caen igual en la matriz. «The last auth state to come by then» con
  varios estados solo durante la migración: `R9-351`.
  - **Por lectura, sin pieza:** «each of them up to taking it off the note» calla la devolución que
    falla, donde el trabajo termina en la falla. Entre esa falla y el fin del trabajo no hay ninguna
    espera (el `catch` y el `return` son síncronos), así que no da otro orden. No se numera.
- **La cabecera, `managePrepAccount`, `prepWrite` y `AuthContext.tsx:294`** remiten al trabajo y a
  `prepKey`. La cabecera conserva la oración vieja («the Mesa «sin cuenta» is used at once»), que
  ninguna prueba mide: `R9-352`.
- **Los de las pruebas:**
  - El ayudante de las partes: «el aviso del paso que se trago la falla». `aviso` es la lista viva de
    los avisos con `disco` hasta el final, y se espera uno: más estricta que la frase, no falsa.
  - `R9-344`: «en el mock, `removeItem` pasa por `multiRemove`»: cierto
    (`async-storage-mock.js:27`).
  - `R9-345`: «con el store mil vueltas mas lento… la regresion pasaba»: cierto para la de `prepKey`;
    la de cada llamador sigue pasando (`R9-349`).
  - El `beforeEach` de `R9-340`: cierto (sus dos piezas caen en la matriz).
  - El `describe` de `R9-340` («el trabajo viejo termino durante esta»): el control no lo ve
    (`R9-350`).

## 3. Las pruebas

- **La tabla de las 13 partes (`R9-343`/`R9-346`):**
  - **¿Un ajeno que solo corre CON la falla?** Por construcción, no se lleva la falla: hasta la
    `n`-ésima llamada las dos corridas son iguales, porque nada falló todavía. Sin pieza.
  - **¿Una parte que falla dos veces?** Sí, ese es el hueco: `R9-348`. Un reintento fuera del `try`
    pasa, porque la falla es de una vez.
  - **El acople con los avisos:** `espiaArriba343` (el `spyOn` sobre el logger importado arriba del
    archivo, no sobre el de la prueba) tumba los 13 en el control, con `aviso: []`. Es un rojo, no un
    verde falso. Con otro texto en un aviso pasa lo mismo (`avisoCambiado343`, de la 99).
- **`R9-344`, la última parte del trabajo:**
  - **¿Dos estados durante ella?** Es el hueco de `R9-351`.
  - **¿La última devolución fallida?** Por lectura, sin otro orden (ver §2).
  - **El corte** lo midió la 99: `giveBackTarde1005` cae en el control, sin verde falso.
- **`R9-345` y su caso del respaldo en `backupPrepTurn.test.ts`:**
  - Es la última prueba del archivo: no hay una siguiente a la que colgarle nada.
  - `muestraViejo` (en la matriz) no imprime ningún reinicio con trabajo pendiente en los tres
    archivos de `prep`.
  - Con el respaldo más lento que la espera, su regresión pasa: `R9-349`.
- **`R9-340`:**
  - **Con `-t`,** la segunda sola cae en su control (`viejoTermino: false`), como dice su comentario
    (`S100-sonda-vacia340-prep.out.txt`).
  - **Un `spyOn` sobre un módulo importado arriba** no ve las llamadas de la instancia de la prueba:
    en la tabla de las partes da un rojo (`espiaArriba343`). Hoy ninguna prueba espía así.
  - **El tiempo:** el `prep` entero tarda 1,19 s con el aislamiento (`nada`) y 1,42 y 1,60 s sin él
    (`sinAislar340`, `soloModulos340`). Es ruido: sin costo medible.
  - **El orden:** jest da 2 vueltas entre las dos pruebas. Si el trabajo viejo termina antes de que
    empiece la segunda, la pareja deja de vigilar con los controles en verde: `R9-350`.
- **«The joins, nothing» (`R9-320: una union de la cuenta…`):** por lectura, se sostiene. Con una
  unión lenta, o cae en `leido` (la edición pidió antes) o en `pedida: 2`. En la matriz,
  `conClavesE99` y `unionConClave` caen como en la 99, y `soloDetras` también.

## 4. La matriz

- **Qué corrió:** `S100-matriz.cjs.txt` sobre `5aa5c96` (en `main` = `9543a9b`), 279 corridas en
  `prep`: las 240 de la 99 y las 39 que la 99 re-midió aparte (`S100-matriz-correr.out.txt`,
  `S100-matriz-comparar.out.txt`).
- **Contra la 99:**
  - 201 caen igual y 70 pasan igual.
  - **0 distintas:** ninguna que caía deja de caer, ni al revés, con las mismas pruebas.
  - Las 8 que no aplican son las mismas 8 de la 99.
  - Todas las salidas son del `prep` entero (ninguna con `-t`), y ninguna corrida dejó el árbol sucio.
- **Qué dice:** es el mismo código que midió la 99, así que la matriz dice que sus salidas se
  reproducen. Lo nuevo lo dicen las piezas de §3.

## 5. Lo nuevo

| hallazgo | qué                                                      | la pieza que pasa (y su daño)                                     |
| -------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `R9-348` | la tabla hace fallar cada parte una vez                  | `reintentaNotaFuera` (con `fallaSiempre343b`, todo estado lanza)  |
| `R9-349` | `llegar<X>` se ve solo dentro de las 1000 vueltas        | `tardeClave2000`, `lecturaLenta2000`, `lento2000` con su `llegar` |
| `R9-350` | el control de `R9-340` dice «terminó», no «durante esta» | `abre340_1`, `drena340` con `sinAislar340`                        |
| `R9-351` | varios estados solo durante la migración                 | `claveDelPrimeroEnDev` (con `dosEstados344`, la cuenta que no es) |
| `R9-352` | dos frases que ninguna prueba mide                       | `numeroSeReinicia`, `sinManejoSinCuenta` (sin daño)               |

- **El sexto verde falso en los diseños de la 99 es `R9-349`.** El agente 6 vio que, con el store o
  la lectura mil vueltas más lentos, la regresión de `prepKey` pasaba. El diseño respondió con la
  clave pedida directo, que vigila solo a `prepKey`, y los casos por llamador que agregó después
  (`R9-347`) tienen el mismo hueco.
- **Hay más que uno.** `R9-350` y el número sin vigilar están también en diseños de la 99; `R9-348` y
  `R9-351` vienen de antes, y la 99 los llevó a más casos sin cerrarlos.

## 6. Las lecciones

- **La pieza que demora se corre con CADA regresión que la prueba dice ver** (`R9-349`). El arreglo
  de lo que vio el agente 6 cerró la regresión que él midió, no las de cada llamador. Es la regla de
  la 70 en cada caso de la 93, y la de la 89. Medido.
- **Una falla inyectada una vez no ve un reintento** (`R9-348`). Es la regla de la 49 (la falla puede
  repetirse) en el ayudante que hace fallar. Medido.
- **Un control de «terminó» no dice «durante esta»** (`R9-350`). Jest da 2 vueltas entre pruebas, y un
  drenaje de 30 en un `afterEach` deja a la pareja sin vigilar nada, con los controles en verde.
  Medido.
- **Al llevar un caso a otra parte del trabajo, llevá también su cantidad** (`R9-351`). La 99 puso un
  estado en la última parte; los varios estados de `R9-337` quedaron en la migración. Medido.
- **De herramientas:** una pieza que hace fallar «desde la `n`-ésima» toca también la siembra y la
  lectura final del ayudante, que pasan por el mismo mock. Medido (`fallaSiempre343`).

## 7. Lo que queda

- **Nuevos:** `R9-348`..`R9-352`, con su hipótesis de arreglo en cada entrada.
- **Del Pendiente, sin tocar:**
  - `R9-330` (decidido), `R9-333` y la cabecera de `prepMultiSet`.
  - `ajenoDev298` y `:868`/`:1160`.
  - El dueño de `migrateLegacyPrep`, `notaLenta50` y `respaldoPideTarde20`.
  - Lo que queda de `R9-347`, y `backupPrepTurn.test.ts` sin aislamiento.
  - El número de la etiqueta (§1).
  - `muereTrasEscribir`.

## 8. El checkpoint

Los docs se escribieron en `../essb-docs-s100` y se pasaron al principal (comparados con `cmp`)
antes de quitar el worktree. `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run
validate` con `NODE_ENV=development` (`_scratch/S100-validate.out.txt`): exit 0. Typecheck limpio,
lint con 0 errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites,
4665/4665 pruebas. El aviso de un worker que no sale solo ya estaba en la 98 y la 99. El mensaje de
la 101 está en `_scratch/S101-PROMPT.md`.
