# S151 — revisión del diff de la 150 (`R9-582`, `R9-589` y `R9-590`)

> **Sesión 151 (2026-11-13).** En un chat nuevo, en la terminal, sin agentes, con **Opus 5.5 como principal y Fable
> 5.2 de asesor**, esfuerzo `high`. Alcance: `f832d391..04b7b478`, `src/` y `__tests__/`. Solo docs: no se tocó la
> app. **Sin emulador: nada de esto está medido en vivo.**
>
> **Resultado.** Los tres arreglos se sostienen en lo que afirman sus pruebas: cada pieza vuelve a caer por la razón
> escrita, y las tres matrices con HEAD salen byte a byte iguales a las de la 150. **Dos hallazgos nuevos (P3):**
> `R9-592` (el canje enlaza con el uid de ANTES del `fetch`; desde la 150 además lo fija como la cuenta en sesión, y
> por ese camino vuelven las filas de `R9-582`) y `R9-593` (una compra con el `logIn` de la cuenta en sesión todavía
> en vuelo queda en la cuenta anterior; anterior al diff, leído en el SDK instalado). Tres ⚠️: en `R9-135` (los
> caminos reales de A3), en `R9-582` (lo reabre `R9-592`) y en `R9-591` (las piezas sin prueba de la 150). **La Parte
> 2 (`R9-584` con `R9-591`) pasa a la 152**: la revisión llenó la sesión.

## 1. Estado de partida

`main` = `origin/main` = `d74242f8`: `6e1c48df` (`R9-582` y `R9-589`) y `04b7b478` (`R9-590`), con `de207b88` y
`d74242f8` de docs encima, sobre `f832d391`. El CI de `d74242f8`, verde en el log (run 43543265265, 3 jobs, 377
suites y 4789 pruebas; `_scratch/S150-ci.out.txt`).

## 2. Las piezas, otra vez cada una sola

`_scratch/S151-piezas.sh.txt` contra las tres suites (134 pruebas); salidas en `S151-rev-<pieza>.out.txt`.

- **Las nueve de la 150 caen igual que en su detalle**, por la razón escrita: a (8), 589 (1), b (1), c (1), d (1), e
  (1), f (1), f2 (15) y h (3).
- **f2, leída prueba por prueba** (`S151-uno-a-uno.cjs.txt`: cada prueba sola con `jest -t`, la pieza revertida;
  `S151-f2-uno.out.txt`). La cuenta de la 150 («9 por la razón, 4 en cascada en `:776` y 2 sin leer») no era exacta:
  **12 caen solas, por la razón** (el pendiente no se anota: `Received: null` donde se esperaba `beto`, o el
  reintento que no llega: `logIn.mock.calls` sin el segundo `beto`); tres de ellas («nadie en sesión», «un anónimo
  compra» y «un anónimo restaura») aparecían en la corrida entera tapadas por la cascada en `:776`. **3 caen solo en
  cascada** y pasan solas: «un logIn que sale bien borra el pendiente» (en `:776`), «forgetSessionAccount borra el
  pendiente del disco» (el timeout) y la de `R9-580` «enlaza la cuenta nueva». Las dos que la 150 no leyó por prueba
  (la de `R9-589` y el control de `R9-581`) caen solas por la razón (`:931` y `:1118`, `Received: null`).
- **Las piezas que la 150 no revirtió.** Ninguna hace caer una prueba (134/134):

| Pieza | Qué se cambia                                                          | Pruebas | Sondas         | Lectura                                                                                                                                                        |
| ----- | ---------------------------------------------------------------------- | ------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| k     | `setOfferingSession` DESPUÉS de `linkOfferingUser` en el listener      | pasan   | —              | Equivalente: `linkUser` escribe el mismo valor en el mismo tramo síncrono (antes de su primer `await`).                                                        |
| l     | `forgetOfferingSession()` ANTES del `signOut` de Firebase              | pasan   | —              | Sin fijar. Lo observable es un `signOut` de Firebase que rechaza: el pendiente se borraría con la cuenta todavía en sesión. Falta esa prueba (⚠️ en `R9-591`). |
| m1/m2 | sin el `await` de `forgetOfferingSession()` (cerrar sesión / eliminar) | pasan   | —              | `forgetSessionAccount` no lanza; solo se vería con el borrado del disco en compuerta y otra escritura detrás. Sin fijar, sin consecuencia medida.              |
| n     | `sessionUid = uid` en `linkUpgradedUser`, después de TODAS las guardas | pasan   | las 4, iguales | Misma clase que la pieza g de la 149: ningún retorno temprano tiene un consumidor posterior (no puede haber un pendiente de un uid recién creado). Se declara. |
| n1    | lo mismo, solo después de `!configured \|\| requestedUid === uid`      | pasan   | —              | Igual que n.                                                                                                                                                   |
| o1    | `forgetSessionAccount` sin `pendingUid = null`                         | pasan   | la 151, igual  | Sin consumidor que lo distinga: con la sesión en `null` no se reintenta, y si la misma cuenta vuelve su `logIn` sale igual.                                    |
| o2    | `forgetSessionAccount` sin `sessionUid = null`                         | 1 cae   | la 151, igual  | La fija «un logIn que falla cuando su cuenta ya salió de la sesión no se anota».                                                                               |

Con n, las cuatro sondas (`S146`, la extendida, la de la 149 y la de la 151) salen iguales a HEAD con U y con N
(`*s151sinn*`).

## 3. Las matrices con HEAD

`S148-sondas.sh.txt s151head` y `S149-sonda.sh.txt s151head`: `S146-matriz-v1b-s148s151head.txt`,
`S148-matriz-ext-s148s151head{,-U,-N}.txt` y `S149-matriz-s151head{,-U,-N}.txt`, **byte a byte iguales** a las
`s150head` (`cmp`).

## 4. Lo que la 150 no midió: la sonda de la 151

`_scratch/S151-sonda.sh.txt` (el arnés de la 148, los helpers de la 149 y `S151-filas.txt`; el `AuthProvider`, el
`offeringService` y el `giftCodeService` reales). Corrida con HEAD (`s151head`), con el `src/` de `f832d391`
(`s151base`) y con f2 revertida (`s151sinf2`). Los diffs: `S151-diff-base-head-{U,N}.txt` y
`S151-diff-sinf2-head-{U,N}.txt`; **U y N cambian igual** en los dos.

| Fila   | Qué                                                                                         | HEAD                                                                                                                            | `f832d391`                          | Sin f2                   |
| ------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------ |
| G1     | beto (pendiente) canjea; cierra sesión durante el `fetch`; el `logIn(beto)` del canje falla | `disco=beto` tras el cierre; el anónimo compra: `logIn(beto)` y la compra en beto, también tras el arranque en frío             | igual (solo el `disco=` del cierre) | el anónimo compra en ana |
| G1ok   | lo mismo, y el `logIn(beto)` del canje sale bien                                            | RevenueCat en beto con un anónimo en sesión; la compra del anónimo, en beto                                                     | igual                               | igual                    |
| G2     | como G1, y entra carla durante el `fetch`                                                   | `disco=beto` con carla en sesión; carla compra: `logIn(beto)`, la compra en beto, y `rc=beto` en el arranque en frío de carla   | igual                               | carla compra en carla    |
| G2ok   | lo mismo, y el `logIn(beto)` del canje sale bien                                            | `rc=beto` con carla en sesión; sus dos compras, en beto, también tras el arranque en frío                                       | igual                               | igual                    |
| F-G2ok | G2ok en modo FIFO (el `logIn` de carla en vuelo cuando vuelve el canje)                     | `logIn(carla)` y después `logIn(beto)`: `rc=beto`; la compra de carla, en beto                                                  | igual                               | igual                    |
| N1     | beto (pendiente y en sesión) compra antes del primer evento de Firebase                     | no se reintenta (sesión `null`): la compra en ana; llega el evento, `logIn(beto)`: `premium=false`                              | igual                               | igual                    |
| R1     | Firebase avisa `null` sin cierre de sesión de la app, y vuelve a beto                       | el pendiente sobrevive al `null` (`disco=beto`); al volver, `logIn(beto)` sale bien y lo borra                                  | igual                               | igual                    |
| R1f    | lo mismo en un arranque en frío (el primer evento es `null`; nace un anónimo; vuelve beto)  | `initialize()` reintenta beto (en sesión) y sale bien                                                                           | igual                               | igual                    |
| D3b    | el borrado del disco falla al cerrar sesión, y beto vuelve en el mismo proceso              | su `logIn` sale bien; el disco sigue en beto (el borrado vuelve a fallar); el arranque de beto lo reintenta: es la misma cuenta | igual                               | igual                    |
| D3c    | lo mismo, y el arranque siguiente es del anónimo, que compra                                | no se reintenta: la compra en ana (lo aceptado en la §7); después beto entra con su `logIn`                                     | igual                               | igual                    |
| P0     | SIN pendiente, FIFO: carla entra con su `logIn` en vuelo, compra, su `logIn` sale bien      | la compra en ana; carla termina con `premium=false`; «Restaurar» la pasa a carla (`restored`)                                   | igual                               | igual                    |
| P0f    | lo mismo, y el `logIn` de carla falla                                                       | la compra en ana (`premium=true`: RevenueCat sigue en ana); carla anotada; «Restaurar» reintenta carla y pasa la compra         | igual                               | igual                    |

Entre HEAD y `f832d391` solo cambia una línea, en las dos variantes: el `disco=` de G1 tras el cierre de sesión
(`beto` en `f832d391`, `null` en HEAD). Sin f2 cambian solo G1 y G2.

- **El canje (G1, G2, G2ok, F-G2ok): `R9-592`.** `redeemGiftCode` lee `currentUser` antes de `getIdToken`, del
  `fetch` y de `res.json()`, y al final llama a `linkUser(currentUser.uid)`. Si la sesión cambió en ese rato:
  - (anterior al diff, G2ok y F-G2ok) hace `logIn` de la cuenta que salió, con otra cuenta o un anónimo en sesión.
    Con carla en sesión, sus compras quedan en beto, también tras el arranque en frío (que no enlaza a carla: la
    pieza abierta de `R9-135`), hasta que carla vuelva a iniciar sesión en un proceso configurado.
  - (del diff, G1 y G2) desde la 150 `linkUser` además fija `sessionUid = uid`: si ese `logIn` falla, se anota en
    disco DESPUÉS del borrado del cierre de sesión, y la compra siguiente del anónimo o de carla lo reintenta. Es la
    fila A de `R9-582` (y la de carla de la 149), por este camino. Con `f832d391` los dueños son los mismos (allí el
    pendiente no se borraba y el reintento no miraba la sesión): la 150 no los empeora, pero no los cierra, y la
    línea que los deja abiertos es `sessionUid = uid` en `linkUser` (con f2 revertida, G1 y G2 quedan en ana y en
    carla). f2 no se puede quitar sin más: la fijan 12 pruebas del arranque en frío.
  - **Es un camino real:** `RedeemCodeSheet` se cierra con «Atrás» aunque el canje esté en vuelo
    (`handleRequestClose` no mira `submitting`), y «Cerrar sesión» está en la misma pantalla.
- **N1 se sostiene como lo dejó escrito la 150** (§7 de su detalle): no daña, solo no corrige; y es igual en
  `f832d391`, donde `initialize()` tampoco reintentaba sin un `linkUser` previo. La compra antes del primer evento de
  Firebase es la pieza abierta de `R9-135` (la cuenta en sesión no está enlazada todavía).
- **La rehidratación (R1, R1f) se sostiene:** el evento `null` no borra el pendiente, y la cuenta que vuelve lo
  resuelve.
- **D3b y D3c:** el pendiente que sobrevive porque el borrado falla solo se reintenta para su cuenta en sesión. No
  mueve dueños.
- **Dos `AuthProvider`: no hay.** Un solo montaje en la app (`app/_layout.tsx:434`), y ninguna prueba anida dos
  (`awk` por archivo sobre `__tests__/` y `src/`). Se declara por `grep`, sin fila.

## 5. A3 y E1b (lo que la 150 explicó)

- **E1b se sostiene:** la cuenta en sesión llega con `getCustomerInfo()` en vuelo y su `logIn` falla; el arranque la
  reintenta una vez más porque es la misma cuenta y está en sesión. Es lo que pide la regla.
- **A3 se sostiene a medias.** La última línea («mucho después: beto, en frío») pone a beto en sesión sin un `logIn`
  en un proceso configurado. La 150 escribió que «en la app, un inicio de sesión ocurre con el SDK configurado y pasa
  por `logIn` (o se vuelve a anotar)». `initialize()` se llama una vez, desde el arranque de `app/_layout.tsx:251`,
  en paralelo con otros servicios; un inicio de sesión pide tocar la pantalla, así que llega casi siempre con el SDK
  configurado. **Pero hay tres caminos reales en que no se anota**, por lectura: (i) el proceso muere con el `logIn`
  en vuelo; (ii) el `logIn` falla y también falla el `set` del disco (queda solo en memoria); (iii) el inicio de
  sesión ocurre en un proceso donde `initialize()` no configuró el SDK (sin clave, o sin el módulo nativo). En los
  tres, la cuenta vuelve en frío sin pendiente, y el arranque en frío no la enlaza: es la pieza abierta de `R9-135`.
  Antes de la 150, un pendiente viejo de la misma cuenta la rescataba por accidente; el cierre de sesión ahora lo
  borra, como pide `R9-582`. ⚠️ en `R9-135`, sin número nuevo.

## 6. El recibo con el `logIn` en vuelo (C1, F-C1, F-C1ok y P0): `R9-593`

Leído en `purchases` 10.16.1 (el AAR instalado, extraído con `_scratch/S147-aar.sh.txt` en `/c/tmp/s147-aar`):

- `Backend.logIn` y `Backend.postReceiptData` encolan en el MISMO `dispatcher` (el campo `dispatcher`; los eventos y
  la configuración remota tienen otros), que la 149 leyó de un solo hilo y en orden.
- **El `app_user_id` del recibo se fija al encolar, no al enviar:** `postReceiptData` arma el cuerpo con el
  `app_user_id` que recibe (su segundo argumento) antes de pasarle la llamada al `dispatcher`. Quien lo pasa es el
  listener de compras del orquestador (`PurchasesOrchestrator$getPurchasesUpdatedListener$1`), que lee
  `PurchasesOrchestrator.getAppUserID()` cuando Play informa la compra, y se lo da a
  `PostTransactionWithProductDetailsHelper.postTransactions`. `PostReceiptHelper` no vuelve a leer el usuario actual
  (`getCurrentAppUserID`: 0 apariciones).
- **`logIn` cambia el usuario solo cuando vuelve su respuesta:** `cacheAppUserID` está en la devolución de éxito
  (`IdentityManager$logIn$4$1`), detrás de `Backend.logIn`.

Entonces, si Play informa la compra mientras el `logIn` de la cuenta en sesión sigue en vuelo, el recibo sale con
el usuario anterior: espera detrás del `logIn`, pero ya lleva el otro `app_user_id`. La sonda lo modela con la compra
instantánea, que equivale a «Play informa antes de que vuelva el `logIn`»; **ese orden real está sin medir** (pide un
`logIn` más lento que todo el flujo de compra de Play, que tiene una hoja que el usuario confirma). **P0, sin
pendiente, da lo mismo con HEAD y con `f832d391`**: era el «HEAD hace lo mismo, por lectura» de la 150, ahora medido.
Con el `logIn` que sale bien (P0, F-C1ok) carla paga, recibe `success` y termina con `premium=false`; en la sonda
«Restaurar» la recupera, lo que depende de la configuración de transferencias del panel de RevenueCat (sin medir;
`R9-135`). Con el `logIn` que falla (F-C1, P0f) es `R9-135`. **Ninguna entrada cubría el caso del `logIn` que sale
bien pero tarde: `R9-593`**, vecino de `R9-135` y de `R9-587`, anterior al diff.

## 7. Los comentarios y las pruebas nuevas

- **Comentarios.** Dicen lo que hace el código, salvo dos que dependen de `R9-592`: el docstring de `sessionUid`
  («`linkUser` and `linkUpgradedUser` (whose callers always pass the account in session)») y el de `linkUser` («Both
  pass the account in session»): el canje pasa la cuenta que estaba en sesión al empezar. Y el de `retryPendingLink`
  («a pending link of an account that signed out … is not retried») no vale por ese camino (G1). Van con el arreglo
  de `R9-592`. Los de `R9-590` dicen lo medido (`isAnonymous()`, el orden del SDK, el evento del link sin medir).
- **Pruebas.** Cada prueba nueva cae con su pieza (§2). En las de `offeringService`, el `expect` de
  `logIn.mock.calls` discrimina la guarda del reintento, y el del disco es precondición (lo hace caer f2 antes que
  nada); en la de `R9-589`, `not.toHaveBeenCalledWith('beto')` discrimina y el disco es precondición; en «un logIn que
  falla cuando su cuenta ya salió», el `toBeNull()` discrimina (piezas e y o2) y las llamadas son precondición. En
  las de `AuthContext`, el disco discrimina b, c y h, y `mockDeleteUser` es el CONTROL declarado. Ninguna pasa con
  su pieza revertida. Lo que no se fija: l, m1, m2, n, n1 y o1 (§2).

## 8. Los hallazgos

- **`R9-592` (P3), nuevo.** El canje enlaza con el uid de antes del `fetch`; desde la 150 también lo fija como la
  cuenta en sesión. Propuesta (sin escribir): que el canje enlace solo si esa cuenta sigue en sesión al volver (o que
  `linkUser` del canje no escriba `sessionUid`), con los tres docstrings.
- **`R9-593` (P3), nuevo.** La compra con el `logIn` de la cuenta en sesión en vuelo queda en la cuenta anterior.
  Propuesta (sin escribir): que comprar y restaurar esperen el `logIn` en vuelo de la cuenta en sesión antes de ir a
  la tienda.
- **⚠️ `R9-135`:** los tres caminos reales de A3 (§5).
- **⚠️ `R9-582`:** `R9-592` reabre sus filas por el camino del canje.
- **⚠️ `R9-591`:** las piezas de la 150 sin prueba (l, m1, m2, n, n1 y o1), con lo que cada una pide; van con
  `R9-584` en la 152.

## 9. Sin medir en vivo

Todo lo de la 148, la 149 y la 150 (§8 o §7 de cada una) sigue igual. Se suma: el orden real entre el `logIn` y el
aviso de compra de Play (`R9-593`), y que un usuario cierre sesión con un canje en vuelo (`R9-592`).

## 10. Archivos de la sesión (`_scratch`)

`S151-piezas.sh.txt`, `S151-rev-*.json.txt` y `S151-rev-*.out.txt`; `S151-uno-a-uno.cjs.txt`,
`S151-f2-nombres.txt` y `S151-f2-uno.out.txt`; las matrices `*s151head*` (las tres sondas viejas y la nueva),
`*s151sinn*`, `S151-matriz-s151base*`, `S151-matriz-s151sinf2*`, `S151-matriz-s151sino1*` y
`S151-matriz-s151sino2*`; `S151-diff-*.txt`; `S151-arma-sonda.cjs.txt`, `S151-filas.txt`, `S151-sonda.test.tsx.txt`
y `S151-sonda.sh.txt`; `S151-checkpoint.sh.txt`, `S151-bloques.txt` y `S151-docs.cjs.txt`.
