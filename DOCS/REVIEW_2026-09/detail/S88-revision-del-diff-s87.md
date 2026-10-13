# Sesión 88 — revisión del diff de la 87 (2026-10-12)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S88-PROMPT.md` (el que
pegó Victor). Revisa `028a156..9d3f489`: el gancho de `R9-296` en `src/features/study/prepAccount.ts`
(`__prepTurnWaitingForTests`) y el campo `otraEnEspera` en la prueba de `R9-292`. La 87 midió su
arreglo; esta sesión buscó romperlo. Solo docs.

- **Estado al empezar:** `main` = `origin/main` = `fb5bcf6` (la 87, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38336788556`, 3 jobs, Node v24.21.0, 374/4632; ramas borradas
  tras `git cherry`). Los docs decían «sin mergear» para la 87: corregido aquí. `main` no era más
  nuevo, así que no hizo falta volver a mirar el CI.
- **Rama:** `docs/review-s88-diff-s87` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 87 cae como dice. Un nuevo P3 de pruebas, `R9-320`: el gancho cuenta
  todos los pedidos del turno, y la prueba lo lee como «la otra espera». Quedan 320 hallazgos,
  ningún P0.

## 0. Cómo se trabajó

`_scratch/S88-sonda.cjs.txt` es la `S87-sonda` con estas piezas (ver «---- S88 ----»):

- `ajeno` (un cambio bueno): el respaldo pide, a la par de su `multiSet`, otra escritura de la Mesa
  en el turno (un `prepWrite` vacío de `@prep_series`). Es un pedido que no es «la otra», y espera
  detrás del respaldo retenido;
- `ajenoTardeK`: lo mismo, pedido K vueltas después del `multiSet` del respaldo (uno lento por su
  cuenta). `ajenoClaveTardeK`, con la clave `@prep_notes`;
- `delta` (hipótesis): `otraEnEspera` es lo que espera al leerlo menos lo que esperaba justo antes
  de soltar la clave;
- `porClave` (hipótesis): el gancho anota qué espera (`prepWrite`, su clave resuelta), y la prueba
  cuenta solo los pedidos con la clave de la otra;
- `cuentaAlReset`: el reset anota la prueba y cuántos pedidos esperaban al limpiar
  (`S88-reset.log.txt`).

Y `_scratch/S88-orden.cjs.txt`, fuera de jest: el mismo guion de pedidos con el `oneAtATime` de
`028a156`, el de `9d3f489` y un control con una microtarea de más, sellado con un reloj de
microtareas.

Las salidas están en `S88-sonda-*`; los resúmenes, en `S88-m1.out.txt` a `S88-m6.out.txt`, y la de
orden, en `S88-orden.out.txt`. Todo sobre `fb5bcf6` (el código es el de `9d3f489`). `git status`
quedó limpio tras cada corrida, y nunca corrieron dos sondas a la vez.

## 1. ¿Cae como dice?

Sí. `prep`, salvo donde dice `-t`, que es `prep -t R9-292`; `(m)` es con `muestra`.

| corrida                                                | resultado                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `nada`                                                 | 23/23                                                                                 |
| `tardeClave25`, y con `genTrasMultiSetD`               | `otraEnEspera: 0` en los dos `pedidaAntes` (y `R9-273`: `R9-297`)                     |
| `bpt028a156+genTrasMultiSetD+tardeClave25` (`-t`)      | pasa (el revert)                                                                      |
| `tardeClave19` (`-t`, m), `claveEnvuelta`              | pasan                                                                                 |
| `tardeClave20` (`-t`, m)                               | solo `otraEnEspera: 0`, en los dos                                                    |
| `genTrasMultiSetD+tardeClave19` (`-t`, m)              | `escribio: 1` y `otraEnEspera: 0` en `devolucionPedidaAntes`, `Rom/8/28` perdido      |
| `genTrasSqlite` (y `-t`, m)                            | `escribio: 1` y `otraEnEspera: 0` en los dos; `otraPedidaAntes` sin diff (1)          |
| `genTrasMultiSet`, `genTrasMultiSetD`                  | `escribio: 1` y `otraEnEspera: 0` en `devolucionPedidaAntes`                          |
| `storeLento40` / `41` (`-t`, m)                        | pasa / solo `otraPedidaAntes: 0`, en los dos                                          |
| `claveLenta19` / `20` (`-t`, m)                        | pasa / los dos controles en 0, en los dos                                             |
| `soloEnEspera+genTrasMultiSetD+storeLento41` (`-t`, m) | `escribio: 1` y `otraEnEspera: 0` en `devolucionPedidaAntes`: el caso armado de hecho |
| `ganchoSinBorrar`                                      | `otraEnEspera: 5` y `3`                                                               |
| `sinLimpiar`                                           | 23/23                                                                                 |

## 2. El gancho cuenta pedidos, no de quién son: `R9-320`

La 87 lo dijo en su §3, sin sonda: «algo ajeno que pidiera el turno en esa ventana contaría como
"la otra"». Medido (`-t`, con `muestra`):

| corrida                                                     | resultado                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `ajeno`, `ajenoTarde5` (también en `prep`)                  | `otraEnEspera: 2` en los dos `pedidaAntes`: cae con el código bueno                         |
| `bpt028a156+ajeno`                                          | pasa (la prueba de la 86 no lee el gancho)                                                  |
| `tardeClave25+ajeno`, `tardeClave25+ajenoTarde5`            | PASA: `otraEnEspera: 1` con la otra sin pedir el turno                                      |
| `genTrasMultiSetD+tardeClave25+ajeno`                       | cae: `otraEnEspera: 0` solo en `devolucionPedidaAntes` (la regresión saca también al ajeno) |
| `genTrasMultiSetD+tardeClave25+ajenoTarde5`, `ajenoTarde10` | **PASA**: en los dos, `otraPedidaAntes: 1`, `otraEnEspera: 1`, gancho 1, `escribio: 0`      |
| `bpt028a156+genTrasMultiSetD+tardeClave25+ajenoTarde5`      | pasa (el verde ya estaba)                                                                   |
| `genTrasSqlite+ajeno`                                       | cae solo por `escribio: 1`; `otraEnEspera` queda en 1, sin diff                             |

- **El mecanismo:** `waiting.size` cuenta cualquier pedido del turno sin empezar: las escrituras
  de los cuatro stores, las uniones y el propio respaldo. La prueba espera `1` y lo lee como «la
  otra espera». El ajeno pedido 5 vueltas después del `multiSet` del respaldo ya pidió el turno
  cuando se lee, y la otra, con `tardeClave25`, todavía no. Que el 1 es el ajeno lo dice el control:
  con `tardeClave25` sola, el gancho da 0.
- **Por qué `ajeno` a la par no da el verde:** en `devolucionPedidaAntes` la marca de
  `genTrasMultiSet` va tras el primer `multiSet` (antes de la devolución retenida), y el ajeno,
  pedido antes de la marca, corre sin turno con la regresión. Pedido 5 vueltas después, ya lleva la
  marca nueva y espera.
- **Las dos caras:** con un pedido ajeno en la ventana, la prueba cae con el código bueno
  (`otraEnEspera: 2`; esto lo abrió la 87, porque con la prueba de la 86 pasa), y pasa con la
  regresión si la otra llega tarde (esto no lo abrió la 87: es el verde de `R9-319`, que con un
  ajeno en la ventana vuelve). Las frases sí son de la 87: «la otra espera el turno», «una otra que
  escribe sin pedirlo da 0» (con el ajeno da 1, junto a `escribio: 1`) y, en `prepAccount.ts`, «tells
  by it that another write is waiting behind it».
- **¿Es posible en la prueba de hoy?** No: la escritura de antes y la unión de `setPrepAccount`
  terminan con su `await` antes del caso, y nada más pide el turno. Hace falta un cambio de la app
  que pida un turno de la Mesa mientras el respaldo lo retiene (otro store que guarda, una unión, una
  escritura más del respaldo). En la app pueden pedirlo los cuatro stores de la Mesa y las uniones.
- **Arreglo (hipótesis), dos medidas:**
  - `delta` (solo la prueba): pasa sola y con `ajeno`; con `ajenoTarde5` y `15` y la regresión,
    `otraEnEspera: 0`. Pero con `ajenoTarde20` y `25` y la regresión, **pasa**: el ajeno llega
    dentro de las 20 vueltas tras soltar, y la resta lo cuenta. Tiene el mismo hueco, una ventana más
    adentro.
  - `porClave` (el gancho dice qué espera): pasa sola (también en `prep`, 23/23), con `ajeno` y con
    `claveEnvuelta`. Con `ajenoTarde5` y `20` y la regresión, `otraEnEspera: 0`. Con `tardeClave25`, 0. Con `genTrasSqlite` y `genTrasMultiSetD`, el rojo de siempre (`escribio: 1`) con 0 al lado.
    Los cortes no se mueven (`storeLento` 40/41, `tardeClave` 19/20). Lo que queda: un ajeno con la
    misma clave (`ajenoClaveTarde5`) da 1 en `pedidaAntes`, aunque la prueba cae igual por el otro
    caso (la otra lleva la clave de Ana); con el código bueno, 2 en ese caso.
  - `porClave` toca la app un poco más que el gancho de la 87: `oneAtATime` recibe qué espera y
    `prepWrite` le pasa su clave. La pieza lo hace con una variable del módulo para combinarse con
    las regresiones; el arreglo, con un argumento. Entra en la decisión del 2026-10-07 (el mismo
    export solo para pruebas), pero conviene decirlo al arreglar. Sirve también para el caso
    `durante` de `R9-296`.

## 3. El gancho en la app

- **El orden no cambia, medido.** `S88-orden`: el mismo guion (ocho pedidos: asíncronos, uno que
  devuelve una promesa, uno que rechaza, uno que lanza sincrónico, un thenable, dos pedidos tardíos)
  da el mismo log, sello por sello, con el `oneAtATime` de `028a156` y el de `9d3f489`, y el `Set`
  queda vacío. El control (una microtarea de más antes de `fn`) da otro log. La 87 escribió «lo
  confirman los cortes»: eran vueltas, y no podían ver una microtarea. La afirmación es cierta; la
  prueba que nombraba, no.
- **Las otras pruebas:** `prep` pasa 23/23, y el suite relacionado también (125 suites, 1004
  pruebas, con `cuentaAlReset`). La de `R9-273` y `prepAccount.test.ts` pasan.
- **¿Algo deja un pedido en el `Set` para siempre?** Solo un turno que no termina nunca (un `fn` que
  no se resuelve). Entonces el pedido se queda en el `Set` igual que en la cadena, que ya lo retiene.
  En la app nadie lee el `Set`, y un `{}` por pedido trabado no se nota. Por lectura.
- **El reset:** la 87 escribió «ninguna prueba deja un pedido esperando en una cadena vieja»,
  deducido de `sinLimpiar`, que solo mira las dos lecturas del gancho. Medido ahora en el suite
  (`cuentaAlReset`): ningún reset de las 125 suites encuentra un pedido esperando. El control
  (`cuentaAlReset+ganchoSinBorrar`, en `prep`) anota 35 resets con pedidos, en 17 pruebas. La frase es cierta, y
  «un pedido de la cadena vieja ya no espera el turno nuevo» también: tras el reset, `delete` sobre
  un `Set` limpio no hace nada.

## 4. Lo que afirman los comentarios

- **`otraPedidaAntes`** («volvió la clave»): cierto. Con `storeLento41` da 0 con `otraEnEspera: 1`,
  y con `tardeClave20`, 1 con `otraEnEspera: 0`: los dos pasos se separan.
- **`otraEnEspera`:** «la otra espera el turno» es lo que lee la prueba, no lo que cuenta el gancho
  (`R9-320`). Y «una otra que escribe sin pedirlo da 0, junto a la escritura que corrió» vale sin
  nada ajeno en la ventana: con `genTrasSqlite+ajeno` da 1, y cae solo por `escribio: 1`.
- **Los dos del gancho, en `prepAccount.ts`:** «the asks still waiting for their turn (only tests
  read it)» es cierto. «A test that holds a turn tells by it that another write is waiting behind
  it» dice «another write», y el gancho cuenta también uniones y respaldos, de cualquiera: que algo
  espera, no qué. Va con `R9-320`.
- **La lección de la 87 (§5 de su detalle).** «Una lección también se mide antes de escribirla»:
  cierto, y su §3 lo aplicó a medias: nombró el riesgo del pedido ajeno con «sin sonda». La segunda,
  «un control que lee el paso que afirma cambia un verde por un rojo de caso sin armar», generaliza
  de más: el control lee «algo espera», no «la otra espera», y con un ajeno el verde vuelve.

## 5. Que sea solo la prueba y el gancho

`git diff --stat 028a156 9d3f489`: `__tests__/backupPrepTurn.test.ts` (20) y
`src/features/study/prepAccount.ts` (19), 36 más y 3 menos. En la app, el `Set`, el envoltorio de
`oneAtATime`, la limpieza en el reset y el export. Nada más.

## 6. La lección

- **Un contador compartido no dice de quién es lo que cuenta.** El gancho cuenta todos los pedidos
  del turno, y la prueba lo lee como «la otra espera». Con un pedido ajeno en la ventana, da 1 con
  la otra sin pedir (y la prueba pasa con la regresión), o 2 con la otra pidiendo (y cae con el
  código bueno). Un control que lee un registro compartido dice de quién es lo que cuenta, y se
  corre con algo ajeno en la ventana, también con algo que llega dentro de ella: la resta (`delta`)
  pasaba con `ajenoTarde20`.
- **Un riesgo que el detalle nombra «sin sonda» es lo primero que se mide.** La 87 escribió el del
  pedido ajeno y lo dejó ahí. Medirlo costó una pieza de tres líneas.
