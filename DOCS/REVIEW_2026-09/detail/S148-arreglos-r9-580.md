# S148 — arreglos: `R9-580` y sus vecinos del mismo archivo

> **Sesión 148 (2026-11-13).** En un chat nuevo, en la terminal, sin agentes, con **Opus 5.5 como principal y Fable
> 5.2 de asesor**, esfuerzo `high`. Rama `fix/s148-premium`, un commit por hallazgo. **Sin emulador: nada de esto
> está medido en vivo.** La tanda V2 no empezó: pasa a la 149 (el asesor fijó el corte en ~65 llamadas para la
> Parte 1).
>
> **Resultado.** Arreglados `R9-580` (P2, `e8d67dc2`), `R9-581` (P3, `04c60aad`) y `R9-583` (P3, `0d64352e`, solo
> comentarios). `R9-582` y `R9-584` siguen abiertos, para la 149 antes de la V2. Lo commiteado da igual con los dos
> supuestos sobre RevenueCat (`CONTINUAR.md` §7).

## 1. Cómo se midió

- **Las dos sondas, con el productor real** (el `AuthProvider`, el `offeringService` y el `giftCodeService`; el SDK
  y Firebase simulados en su frontera): la de la 146 (`S146-sonda-v1b.test.tsx.txt`, filas 1 a 10, entre ellas 6,
  6b y 8) y la extendida de la 147 con cuatro filas nuevas (`_scratch/S148-sonda-ext.test.tsx.txt`, armada por
  `S148-arma-sonda.cjs.txt` con `S148-filas-nuevas.txt`). Las corre `_scratch/S148-sondas.sh.txt <etiqueta>`.
- **La línea base contra `main`** (`s148base`) salió byte a byte igual a `S146-matriz-v1b-despues.txt` y a
  `S147-a2-matriz-ext-orq*.txt`: la reproducción de `R9-580` (fila 6c, `tok1→ana`) es la de la 147.
- **Las salidas:** `S146-matriz-v1b-s148{base,fix1,fix2,fix3}.txt` y `S148-matriz-ext-s148{base,fix2,fix3}{,-U,-N}.txt`.
  `fix1` es la primera versión del arreglo (sin «el último uid pedido»), `fix2` el commit de `R9-580`, `fix3` el de
  `R9-581`.

## 2. `R9-580` (P2) — `e8d67dc2`

- **El arreglo.** Tras un `linkWithCredential` que salió bien, `AuthContext` llama a `linkUpgradedUser(uid)` sin
  `await`, como el listener. El servicio enlaza solo si RevenueCat **no** está en un `$RCAnonymousID`
  (`Purchases.isAnonymous()`). Cierra en falso: sin configurar, sin el método, o si `isAnonymous()` rechaza, no hay
  `logIn`. No toca `earlyUid`. La mitad «desde un id anónimo» y la raíz de `R9-135` NO entraron.
- **El vecino que mostró la primera versión (`fix1`).** En 6b y 6e (Firebase SÍ avisa tras el link), el listener ya
  había pedido `logIn(uid)` y el arreglo pedía otro: `[logIn(anon1), logIn(anon1)]`. No movía dueños, pero 6b no
  podía cambiar. Se cortó con `requestedUid`, el uid del último `logIn` pedido en el proceso (lo escribe `logInAs`):
  si ya es ese uid, `linkUpgradedUser` no hace nada. Con eso, la matriz de la 146 sale **sin una sola diferencia**.
  El orden inverso (el link vuelve antes de que llegue el evento) daría todavía dos `logIn` del mismo id; la sonda
  no lo modela, y qué hace el SDK con un `logIn` al id en que ya está no se leyó.
- **La matriz (`fix2` contra `base`).** Cambian solo 6c y 6d, **iguales con U y con N**: la compra queda en la
  cuenta nueva (`tok1→anon2`); en otro aparato la cuenta nueva tiene los extras y ana no. En 6d ya no se reintenta el
  pendiente de beto: el `logIn` bueno de la cuenta nueva lo borra. Las filas 6, 6b, 8, 5d, C1 y 6e, byte a byte
  iguales.
- **Las filas nuevas.**

| Fila | Caso                                                                             | Qué pasa con el arreglo                                                                                  |
| ---- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 6f   | como 6c, y el `logIn` de la cuenta nueva falla                                   | se anota (`disco=anon2`); la compra reintenta y queda en la cuenta nueva                                 |
| 6g   | como 6c, pero ana salió CON premium                                              | al crear la cuenta, el aparato deja de mostrar los extras de ana (`premium=false`)                       |
| 6h   | RevenueCat en un uid anónimo de Firebase de un build viejo, y ese anónimo enlaza | `logIn(anon1)` al mismo id; los dueños no cambian                                                        |
| 6i   | como 6c, con el servicio sin configurar al crear la cuenta                       | no enlaza, tampoco después de `initialize()`: es el resto de la raíz de `R9-135`, que espera la medición |

6g es coherente con la §7 («iniciar sesión con OTRA cuenta en el mismo aparato muestra lo de esa cuenta»): la
cuenta nueva es otra cuenta. Antes de `3190815b` pasaba lo mismo, y antes, al cerrar sesión. Queda escrito.

- **Las pruebas** (6 en `offeringService.test.ts`, 2 en `AuthContext.test.tsx`). Afirman LLAMADAS, con el id del SDK
  dicho a mano (`__setAppUserID`) y un `$RCAnonymousID` con la forma de la regex real. **Vistas fallar pieza por
  pieza** (`_scratch/S148-rev-580{a..e}.json.txt` y `.out.txt`): la llamada en `AuthContext` (1 prueba), la guarda de
  `isAnonymous()` (2), `requestedUid` (1), `configured` (1) y el `catch` (1: el rechazo escapa). Restaurado en todas.
- **La factoría de `AuthContextLinkPromptColdStart.test.tsx`** no tenía la exportación nueva, y cinco pruebas
  cayeron con `linkUpgradedUser is not a function`, lanzado dentro del `try` del link. En producción no pasa (una
  función `async` no lanza de forma síncrona); la factoría ganó la exportación.

## 3. `R9-581` (P3) — `04c60aad`

`notePendingLink` anota solo si el uid sigue siendo el último `logIn` pedido (`requestedUid`), mirado **después** del
`await` de `isAnonymous()`, así que cuenta también un pedido hecho mientras tanto. Una sola guarda, para no dejar una
sin prueba. Matriz (`fix3` contra `fix2`): cambia solo B2, igual con U y con N (`tok2→carla`). La prueba, vista caer
con la guarda revertida (`Received: "beto"`), con su control (el rechazo del último pedido sí se anota).

## 4. `R9-583` (P3) — `0d64352e`

Los cinco textos, corregidos: el docstring de `linkUser` (no hay canje siendo anónimo; nombra a `linkUpgradedUser`),
`notePendingLink` y la cabecera de `pendingLink.ts` (la guarda es «no es un `$RCAnonymousID`»), «every cold start
leaves» (falso), `hasOfferingPurchase` (el pago pendiente, sin medir) y `giftCodeService.ts` (ya no es un no-op).
Solo comentarios: sin prueba que ver fallar.

## 5. Lo que queda, para la 149 antes de la V2

- **`R9-582`** (cerrar sesión y «Eliminar cuenta» borran el pendiente; el reintento antes de comprar o restaurar
  mira la sesión). Pide que el servicio sepa quién está en sesión: es más que una línea, con su matriz (A1, A2a, A2b,
  F, 6d).
- **`R9-584`** (las guardas sin prueba y los tres expects que pasan con y sin el reintento). Los tres expects y
  `R9-588` siguen sin re-verificar por un orquestador: volver a verlos caer antes de tocarlos.

## 6. Sin medir en vivo

Lo de la 146 (§9) y la 147 (§8) sigue entero. Se agrega: si Firebase avisa tras `linkWithCredential` y en qué orden
respecto de su `await` (decide si puede haber dos `logIn` del mismo id); qué hace el SDK con un `logIn` al id en que
ya está (fila 6h).

## 7. Archivos de la sesión (`_scratch`)

`S148-sondas.sh.txt`, `S148-arma-sonda.cjs.txt`, `S148-filas-nuevas.txt`, `S148-sonda-ext.test.tsx.txt`; las
matrices de §1; `S148-rev-580{a..e}` y `S148-rev-581` (`.json.txt` y `.out.txt`); `S148-prueba-*.txt` (las pruebas
tal como se agregaron); `S148-msg-*.txt`; `S148-checkpoint.sh.txt` y `S148-docs.cjs.txt`.
