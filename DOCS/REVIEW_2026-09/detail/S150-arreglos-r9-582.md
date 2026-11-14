# S150 — arreglos: `R9-582` con `R9-589` y `R9-590` (el servicio sabe quién está en sesión)

> **Sesión 150 (2026-11-13).** En un chat nuevo, en la terminal, sin agentes, con **Opus 5.5 como principal y Fable
> 5.2 de asesor**, esfuerzo `high`. Rama `fix/s150-premium`: `6e1c48df` (`R9-582` y `R9-589`) y `04b7b478`
> (`R9-590`, solo comentarios). **Sin emulador: nada de esto está medido en vivo.**
>
> **Resultado.** Los tres arreglados. El pendiente de RevenueCat se reintenta solo para la cuenta en sesión, mirada
> en el momento de reintentar, y cerrar sesión o eliminar la cuenta lo borran. En las sondas ya no queda ningún
> `logIn` de una cuenta que salió con otra cuenta o un anónimo en sesión (F-C1, F-C1ok, F-E3, F-E3ok, C1, C3 y E3, y
> las filas A y F de `R9-582`). U y N cambian igual. **La Parte 2 (`R9-584` con `R9-591`) y la V2 pasan a la 151**,
> después de la revisión de este diff: la sesión llegó al umbral de llamadas con la Parte 1.

## 1. Estado de partida

`main` = `origin/main` = `f832d391`, con los dos commits de docs de la 149 sobre `f307fee9`; el CI de la 149, verde
según el mensaje de la sesión (run 43539942585, 3 jobs, 377/4779). Las tres sondas contra HEAD (`s150base`) salen
byte a byte iguales a `s148s149` y a `S149-matriz-head`: F-C1, F-C1ok, F-E3 y F-E3ok se reproducen con el productor
real.

## 2. El diseño (delegado; decidido con su porqué)

- **`sessionUid`, en memoria, en `offeringService`.** Lo escriben `setSessionAccount(uid | null)`, que el listener
  de `AuthContext` llama en cada evento (la cuenta, o `null` si es anónimo o no hay usuario); `linkUser`, cuyos dos
  llamadores (el listener y el canje) pasan siempre la cuenta en sesión; y `linkUpgradedUser`, antes de todas sus
  guardas, porque si Firebase no avisa tras el link es la única fuente. **Por qué en memoria:** la sesión es de
  Firebase, y el primer evento de cada proceso la repite. `earlyUid` desaparece.
- **El reintento** (`retryPendingLink`: comprar, restaurar e `initialize()`) solo si `pendingUid === sessionUid`,
  mirado al reintentar. Eso es `R9-589`: `initialize()` ya no compara con un uid fijado antes de `configure()`.
- **`forgetSessionAccount()`** vacía la sesión y el pendiente (memoria y disco) en una llamada. `AuthContext` la
  llama cuando el `signOut` de Firebase ya salió bien, y cuando `deleteUser` ya salió bien. **Por qué no en un
  evento `null`:** la rehidratación de Firebase pasa por `null` o por un anónimo con una cuenta todavía en sesión
  (lo dice el propio `signOut` de `AuthContext`), y el disco se perdería.
- **`notePendingLink`** tampoco anota a una cuenta que ya salió de la sesión: un rechazo que llega tras el cierre
  de sesión no vuelve a escribir lo que el cierre borró. La guarda de `R9-581` no se tocó; la de sesión va al lado,
  mirada también después del `await`.

## 3. Las piezas, cada una revertida sola

`_scratch/S150-piezas.sh.txt` contra las tres suites (134 pruebas); salidas en `S150-rev-<pieza>.out.txt`. El diff,
igual antes y después (`S150-antes-piezas.patch.txt`).

| Pieza | Qué se revierte                                        | Cae                                                                                                     |
| ----- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| a     | `pendingUid !== sessionUid` en `retryPendingLink`      | 8: comprar o restaurar con otra sesión (4), `R9-589`, «…NO se reintenta» (2) y el anónimo sin `signOut` |
| 589   | `initialize()` compara con la sesión del `configure()` | 1: la de `R9-589` (`logIn('beto')` con carla en sesión)                                                 |
| b     | `forgetOfferingSession()` en `signOut`                 | 1: «cerrar sesión borra el pendiente» (`Received: "uid-beto"`)                                          |
| c     | lo mismo en `deleteAccount`                            | 1: «eliminar la cuenta borra el pendiente»                                                              |
| d     | `setOfferingSession(...)` en el listener               | 1: «si Firebase pasa a un anónimo sin cerrar sesión… restaurar no reintenta»                            |
| e     | `sessionUid !== uid` en `notePendingLink`              | 1: «un logIn que falla cuando su cuenta ya salió no se anota»                                           |
| f     | `sessionUid = uid` en `linkUpgradedUser`               | 1: la de `R9-580` «si su logIn falla, queda pendiente…» (`null`)                                        |
| f2    | `sessionUid = uid` en `linkUser`                       | 15 (todo lo que parte de un pendiente anotado por `linkUser`)                                           |
| h     | el borrado del disco en `forgetSessionAccount`         | 3: la del servicio, la de `signOut` y la de `deleteAccount`                                             |

Las pruebas afirman LLAMADAS (`logIn.mock.calls`) y el disco, no de quién quedan las compras.

## 4. Las sondas

`S148-sondas.sh.txt` y `S149-sonda.sh.txt` con el arreglo (`s150fix1`; con HEAD, `s150head`, idénticas). La de la 146
no cambia. La predicción, escrita antes de correr: `_scratch/S150-prediccion.txt`. Los diffs:
`S150-diff-ext-fix1-{U,N}.txt` y `S150-diff-149-fix1-{U,N}.txt`; **U y N cambian igual**.

- **Lo previsto.** Cada cierre de sesión o eliminación con un pendiente deja `disco=null`. El anónimo que compra o
  restaura ya no hace `logIn(beto)`: en A1 y A2a la compra queda en ana; en A2b el aparato no pierde los extras
  («restaurar: restored»); en F, RevenueCat no entra al uid borrado. En la de la 149, ningún `logIn(beto)` con carla
  en sesión: en el arranque de carla, RevenueCat queda en carla.
- **Fuera de lo previsto, y explicado.** _A3, última línea_: la sonda pone a beto en sesión en un arranque en frío
  sin que haya iniciado sesión en ningún proceso; antes lo rescataba el pendiente viejo, que ahora el cierre de
  sesión borró, como pide `R9-582`. En la app, un inicio de sesión ocurre con el SDK configurado y pasa por `logIn`
  (o se vuelve a anotar). Es la pieza abierta de `R9-135`. _E1b_: la cuenta en sesión llega con `getCustomerInfo` en
  vuelo y su `logIn` falla; ahora el arranque la reintenta una vez más (es la misma cuenta, y está en sesión).
- **Las dos mitades se tapan entre sí.** Con la guarda revertida (`s150singuarda`), la de la 149 no cambia, y en la
  extendida cambia solo D3 (el disco falla al borrar: el pendiente sobrevive al cierre, y solo la guarda evita el
  `logIn(beto)` en el arranque de carla). Con el borrado revertido (`s150sinforget`), solo cambia el `disco=` (y
  vuelve la última línea de A3). Por eso cada mitad tiene su prueba a nivel servicio, donde la sesión cambia sin
  pasar por el `signOut`.
- **Queda a la vista, sin numerar (para la 151).** En C1, F-C1 y F-C1ok, la compra de carla con su propio `logIn`
  en vuelo queda en ana (antes, en beto). La sonda no encola la compra en el FIFO, y no se leyó si el SDK encola el
  envío del recibo detrás del `logIn`. Es de la familia de `R9-135` y `R9-587`, no de este arreglo.

## 5. `R9-590`: los cinco textos

En `04b7b478`, solo comentarios (el diff no tiene una línea que no sea comentario): el docstring de `earlyUid` se
fue con la variable; «no auth event for a link», dos veces, pasa a «sin medir; no se cuenta con eso»; `linkUser` dice
que la cuenta nueva la enlaza `linkUpgradedUser`, y también él si llega el evento; `isAnonymous()` da `true` también
para el id que cacheó una versión vieja del SDK; y el comentario de `R9-581` dice que el SDK atiende los `logIn` de a
uno y en orden. El comentario de `giftCodeService.ts` que nombraba `earlyUid` va en el primer commit.

## 6. Compuertas

Prettier y `tsc`, limpios; jest de las vecinas, 24 suites y 309 pruebas. Eslint marca 37 avisos `no-explicit-any` en
`AuthContext.tsx` y 2 en `AuthContext.test.tsx`: los mismos que en HEAD. El mock literal de
`AuthContextLinkPromptColdStart.test.tsx` suma las dos funciones nuevas (los otros tres mocks del servicio no montan
`AuthProvider` o no las usan).

## 7. Sin medir en vivo

Todo lo de la 148 y la 149 (§8 de cada una) sigue igual. Se suma: que el primer evento de Firebase de cada proceso
llegue antes de una compra (si no, la sesión es `null` y no se reintenta: no daña, solo no corrige).

## 8. Archivos de la sesión (`_scratch`)

`S150-prediccion.txt`; `S150-rev-*.json.txt` y `S150-rev-*.out.txt`; `S150-piezas.sh.txt`,
`S150-sondas-piezas.sh.txt` y `S150-antes-piezas.patch.txt`; las matrices `*s150base*`, `*s150fix1*`, `*s150head*`,
`*s150singuarda*` y `*s150sinforget*`; `S150-diff-*.txt`; `S150-split590.cjs.txt` (separa los dos commits);
`S150-msg-*.txt`; `S150-checkpoint.sh.txt`, `S150-bloques.txt` y `S150-docs.cjs.txt`.
