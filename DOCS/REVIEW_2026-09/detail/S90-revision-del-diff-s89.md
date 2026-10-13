# Sesión 90 — revisión del diff de la 89 (2026-10-12)

En el mismo chat que la 89 (Victor pidió seguir), en la terminal y sin agentes, con el mensaje de
`_scratch/S90-PROMPT.md`. Revisa `1f02511..538b1bc`: la etiqueta de `oneAtATime`, el export por
clave (`__prepTurnWaitingForTests(clave)`) en `src/features/study/prepAccount.ts`, y `otraEnEspera`
en la prueba de `R9-292`. Solo docs.

- **Ojo con la independencia:** el que revisa es el mismo que escribió el arreglo, con su contexto.
  Se compensó midiendo lo que la 89 dejó sin sonda y lo que dice cada comentario, no solo
  repitiendo sus corridas.
- **Estado al empezar:** `main` = `origin/main` = `cd7993c` (la 89, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38349182452`, 3 jobs, Node v24.21.0, 374/4632; ramas borradas
  tras `git cherry`). Los docs decían «sin mergear» para la 89: corregido aquí.
- **Rama:** `docs/review-s90-diff-s89` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 89 cae como dice. Un nuevo P3, `R9-321`: el comentario del `Set` dice
  que cada pedido lleva «what it writes», y la etiqueta es la clave que resolvió. Quedan 321
  hallazgos, ningún P0.

## 0. Cómo se trabajó

`_scratch/S90-sonda.cjs.txt` es la `S89-sonda` con tres piezas (ver «---- S90 ----»):

- `<gen>V`: la `gen…D` de la 88, que no le pasa la etiqueta a `oneAtATime`;
- `turnoAntesDeClaveVieja`: la `turnoAntesDeClave` de la 88, sin quitar la etiqueta;
- `etiquetaDesviada`: la etiqueta es la clave donde `prepWrite` escribiría si el turno llegara al
  pedir (con el desvío de `R9-275`), no la que resolvió. No cambia nada de lo que hace la app.

Las salidas están en `S90-sonda-*`; los resúmenes, en `S90-m1.out.txt` (`-t R9-292`, con `muestra`)
y `S90-m2.out.txt` (`prep`). Todo sobre `cd7993c`. `git status` quedó limpio tras cada corrida, y
nunca corrieron dos sondas a la vez.

## 1. ¿Cae como dice?

Sí. La 89 midió sobre `1b608b0`. El amend que dio `538b1bc` solo cambió el comentario de
`otraEnEspera` (`git diff 1b608b0 538b1bc`), y su detalle no decía sobre qué árbol había medido.
Re-medido lo central sobre `cd7993c`:

| corrida                                                           | resultado                                                                                |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `nada` (`prep`)                                                   | 23/23                                                                                    |
| `muestra`, `ajeno`                                                | pasan                                                                                    |
| `genTrasMultiSetD+tardeClave25+ajenoTarde5`, y con `ajenoTarde20` | `otraEnEspera: 0` en los dos                                                             |
| `genTrasMultiSetD+tardeClave25+ajenoAmbasTarde5`                  | pasa (el residuo de la misma clave)                                                      |
| `bpt1f02511+pa1f02511+genTrasMultiSetD+tardeClave25+ajenoTarde5`  | pasa (el revert)                                                                         |
| `sinEtiqueta`                                                     | `otraEnEspera: 0` en los dos                                                             |
| `tardeClave19` / `20`                                             | pasa / solo `otraEnEspera: 0`                                                            |
| `genTrasMultiSetD`                                                | `escribio: 1` y `otraEnEspera: 0` en `devolucionPedidaAntes`                             |
| `genTrasMultiSetV`                                                | lo mismo, y además `otraEnEspera: 0` en `pedidaAntes`, con `escribio: 0`                 |
| `fueraDelTurno`                                                   | `escribio: 1` en los cuatro casos del store; en los dos `pedidaAntes`, `otraEnEspera: 0` |
| `turnoAntesDeClave` (`prep`)                                      | `'trabada'` y `R9-310` (`aTiempo`), como en la 89                                        |
| `turnoAntesDeClaveVieja` (`prep`)                                 | 14 de 23 caen: todo `prepWrite` lanza `ReferenceError: resolved is not defined`          |

- **El revert, mirado contra `538b1bc`:** su diff tiene las 46 líneas del commit al revés, y de
  más solo las 17 de las piezas.
- **Lo que el §0 de la 89 decía sin sonda:** sin pasar la etiqueta en las `gen…D`
  (`genTrasMultiSetV`), `pedidaAntes` da `otraEnEspera: 0` sin que la regresión haya actuado
  (`escribio: 0`): el 0 era de la pieza. Y sin re-escribir `turnoAntesDeClave`, la pieza deja de
  ser la regresión de `R9-310`: rompe todo `prepWrite`. Las dos cosas eran ciertas.
- **«Una otra que escribe sin pedirlo da 0»** (el comentario de `otraEnEspera`): con
  `fueraDelTurno` (`prepWrite` sin turno), 0 junto a `escribio: 1`. Cierto.
- **El orden de las microtareas:** `S89-orden` otra vez, igual, y su control distinto.

## 2. La etiqueta: `R9-321`

- **¿Quién pide sin ella?** Las uniones y el respaldo. Lo midió la 89 (`muestra` en `conUnion`: 0
  con cualquier clave). Para la prueba de hoy no importa: solo la leen los dos casos
  `pedidaAntes`, donde la otra es un store.
- **¿Hay un caso donde la prueba espere otra clave?** No en la prueba: en `pedidaAntes` la clave
  la pone la propia prueba (la promesa retenida resuelve a `@prep_notes` o `@prep_notes:ana`), y la
  etiqueta es esa. Con una clave de otro lado (`claveCapturada`), el control de la clave ya da 0.
- **Pero el comentario del `Set` dice otra cosa.** Dice «each with what it writes». En
  `devolucionPedidaAntes`, la otra espera con la etiqueta `@prep_notes:ana` (`muestra`: `ana: 1`,
  `notas: 0`), y lo que escribe termina en la «sin cuenta» (`sinCuenta: [P, R, Q]`, `ana: null`):
  el desvío de `R9-275` se aplica dentro del turno. Un gancho que siga el comentario
  (`etiquetaDesviada`) da `otraEnEspera: 0` en ese caso, y la prueba cae con el código bueno. En
  `pedidaAntes`, el control, sin cuenta devuelta, da 1. El export y el comentario de `otraEnEspera`
  dicen «la clave que resolvió»: coinciden con la prueba.
- **De paso, una deducción equivocada:** antes de medir, esta sesión dedujo (y se lo dijo a Victor
  en el chat) que en `devolucionPedidaAntes` Ana todavía no estaba devuelta cuando la otra pedía el
  turno, porque `givenBack` se llena dentro del turno de la devolución. `etiquetaDesviada` dice lo
  contrario: al pedir, `givenBack` ya la tiene.
- **¿Lo abrió la 89?** Sí, escribió el comentario.

## 3. El residuo de la misma clave

El comentario de `otraEnEspera` dice que en la app no hay dos `prepWrite` de la misma clave
esperando a la vez, porque cada store encadena los suyos. Por lectura, en los caminos que pedía el
mensaje:

- **Un fallo:** los cuatro stores encadenan con `.catch` (`writeQueue = writeQueue.then(...).catch`,
  o `attempt.catch`), y la cadena sigue.
- **Un reset:** ningún store reinicia su `writeQueue` (`grep "writeQueue ="`: solo las líneas que
  encadenan).
- **Dos cuentas:** dos claves distintas, que no se cuentan juntas.
- **Otros que llamen a `prepWrite`:** en `src`, solo los cuatro stores. El respaldo pide con
  `prepMultiSet`, sin etiqueta.

Cierto, por lectura. El comentario lo dice bien.

## 4. Lo que afirman los comentarios

- **El del `Set`:** «each with what it writes» es falso con la cuenta devuelta (`R9-321`).
- **El del export:** «how many `prepWrite`s of `key` (the key each one resolved, whoever asked)»:
  cierto. «A write of that key is waiting behind it» se lee con esa definición: el pedido es de esa
  clave, aunque escriba en otra.
- **El de `otraEnEspera`:** cierto en todo lo medido (§1, §3).
- **La lección de la 89:** medida (`ajenoAmbasTarde5` pasa con la regresión). Pero su detalle
  decía, en §6, que la 88 había dado el residuo «por cerrado»: la 88 lo puso en «lo que queda»,
  aunque con «cae igual por el otro caso». Corregido en el detalle de la 89. Lo mismo dicen el
  mensaje del commit `cd7993c` y el resumen que se le dio a Victor. La regla de §5 y la memoria lo
  dicen bien.

## 5. Que sea solo la prueba y el gancho

`git diff --stat 1f02511 538b1bc`: `__tests__/backupPrepTurn.test.ts` (20) y
`src/features/study/prepAccount.ts` (26). Nada más.

## 6. La lección

- **Un comentario que describe un dato es una definición: medí un cambio que la siga al pie de la
  letra.** El del `Set` decía «what it writes». Un gancho hecho así (`etiquetaDesviada`), sin
  cambiar nada de lo que hace la app, tumba la prueba con el código bueno, porque la prueba lee
  «la clave que resolvió».
- **Una deducción sobre el orden se mide antes de decirla.** «Ana todavía no está devuelta cuando
  la otra pide» salió de leer `giveBack`, y era falso.
