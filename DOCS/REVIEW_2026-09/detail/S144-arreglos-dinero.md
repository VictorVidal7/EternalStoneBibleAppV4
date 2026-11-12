# S144 — arreglos: la tanda V1, dinero (los cuatro P1 viejos)

> **Sesión 144 (2026-11-12).** En un chat nuevo, en la terminal, sin agentes, con **Fable 5.2 como modelo
> principal** y esfuerzo `high`. Rama `fix/s144-dinero`, un commit por hallazgo. Sin emulador: en el AVD, RevenueCat
> no tiene ofertas configuradas y la hoja no se pinta. **Todo lo de esta sesión está sin medir en vivo**; espera la
> cuenta de Google de PRUEBA.
>
> **Resultado:** los cuatro P1 de dinero, arreglados, cada uno reproducido antes con el servicio real y con su
> prueba vista fallar sin el arreglo: `R9-16` (`cff16883`), `R9-17` (`7425f258`), `R9-18` (`b4d305b5`) y `R9-19`
> (`c629b9d8`). `R9-135` **reproduce y NO se arregló** (depende de la decisión abierta de `R9-119`). Los dos
> docstrings de `R9-119`, corregidos sin cambiar la conducta (`919ee006`); `R9-119` sigue abierto. Ningún hallazgo
> nuevo numerado; hay cinco cosas para que la revisión de la 145 mire (§7).

## 1. Cómo se trabajó

- **El productor real.** `offeringService`, `OfferingSheet`, `DonationSheet` y `PremiumProvider` de verdad;
  `react-native-purchases` simulado solo en su frontera (`__mocks__/react-native-purchases.js`). El `'20'` que se
  le agregó al mock se comprueba en una prueba contra el enum del SDK real
  (`@revenuecat/purchases-typescript-internal`, con `jest.requireActual`).
- **La sonda** (`_scratch/S144-sonda.test.tsx.txt`; vivió en `__tests__/` sin commitear y salió antes del último
  commit): una matriz de 10 rechazos del SDK (cancelar por código y por `userCancelled`, tienda `2`, no permitido
  `3`, ya comprado `6`, recibo en uso `7`, red `10`, pendiente `20`, sin conexión `35` y un `Error` sin código) por
  tres llamadas del servicio y por las dos hojas, más la compra resuelta con y sin entitlement, la restauración con
  y sin compra, «sin configurar» y el escenario de `R9-135`. Se corrió antes de tocar nada
  (`_scratch/S144-matriz-antes.txt`) y otra vez con los cinco commits apilados (`_scratch/S144-matriz-despues.txt`).
- **El revert por pieza** (`_scratch/S144-revert.cjs.txt`): aplica un reemplazo a un archivo, corre jest y
  restaura; aborta si el texto a revertir no aparece exactamente una vez. Las piezas: `S144-rev16`, `rev17`,
  `rev17b`, `rev18`, `rev18o` y `rev19` (`.json.txt`). Se corrió después de formatear.
- **Las compuertas antes de cada commit** (`_scratch/S144-gates.sh.txt`): prettier y eslint sobre los archivos
  tocados, `tsc --noEmit` entero y 24 suites vecinas (oferta, donación, premium, extras, canje, `AuthContext`,
  traducciones, `_layout` y los stubs web). `git status` limpio tras cada commit, salvo la sonda sin commitear.
  Los 36 avisos de eslint de `AuthContext.tsx` (`no-explicit-any`) son anteriores: el commit solo le toca un
  comentario.

## 2. `R9-16` — `restore()` confundía «no hay compra» con «no se pudo preguntar» (`cff16883`)

- **Reproduce.** Los 10 rechazos de la matriz sobre `restorePurchases` daban `{unlocked: false}`, y la hoja,
  `info: restoreNotFound` («No encontramos una ofrenda anterior en esta cuenta.»). «Sin configurar», igual.
- **El arreglo.** `restore()` devuelve `RestoreOutcome`: `'restored'`, `'notFound'` o `'error'`. `'notFound'` solo
  sale cuando la tienda respondió. La hoja de ofrenda muestra `offering.restoreError` cuando no se pudo preguntar,
  en «Restaurar» y en el camino `alreadyOwned` (que antes decía «Inténtalo de nuevo»).
- **Pruebas.** Tres del servicio fijaban la confusión como esperada (`{unlocked: false}` para «sin configurar» y
  para «la tienda falló») y se reescribieron; 4 casos nuevos por código y 2 de la hoja.
- **Vista fallar:** con el `catch` y el «sin configurar» devolviendo `'notFound'` caen 7; la hoja recibe
  `restoreNotFound`, o `purchaseError` en el camino `alreadyOwned`.
- **Quién consume el valor:** `restore()` tenía dos consumidores, los dos en `OfferingSheet.tsx` (`handleRestore`
  y la rama `alreadyOwned`); ningún efecto lo tiene en sus dependencias. El tipo es una unión discriminada a
  propósito: un consumidor que siguiera leyendo `unlocked` no compila.

## 3. `R9-17` — `purchaseUnlock` daba `success` sin mirar la entitlement (`7425f258`)

- **Reproduce.** Compra resuelta con la entitlement inactiva: `{status: 'success'}`, `premium = false` y la hoja
  con «Gracias por sembrar en esta obra».
- **El arreglo, donde el dato todavía es cierto.** Solo la llamada a la tienda puede responder `'error'` o
  `'cancelled'`. Una vez resuelta ya se cobró: el servicio mira la entitlement del `CustomerInfo` que recibió,
  relee UNA vez saltando la caché del SDK (`invalidateCustomerInfoCache` y `getCustomerInfo`) y, si sigue sin
  estar, responde el estado nuevo `'notActivated'`. Si la relectura falla, también `'notActivated'`: tras cobrar
  no se dice «Inténtalo de nuevo».
- **La hoja.** Un estado `notice`, pintado EN la hoja con su botón «Cerrar» y sin los montos a la vista. No es un
  toast sobre los montos porque los montos invitan a pagar otra vez. Al cerrar y reabrir vuelve a los montos, con
  el enlace de restaurar que el aviso nombra (una prueba fija que el aviso contiene el texto exacto del enlace, en
  los dos idiomas).
- **Un vecino, en el mismo commit (decisión de Claude):** `alreadyOwned` cuando la tienda RESPONDE la restauración
  sin entitlement. Antes decía «No se pudo completar la ofrenda. Inténtalo de nuevo.» sobre algo que la tienda ya
  tiene; ahora, el mismo aviso. Es además el camino de quien tiene un pago pendiente y vuelve a tocar el monto.
- **Pruebas:** 4 del servicio y 4 de la hoja. **Vistas fallar**, cada pieza por separado: sin la comprobación del
  servicio caen 5 (reciben `'success'`, o la pantalla de gracias); sin la rama del vecino cae 1 (recibe el toast
  de `purchaseError` y los montos). La que mide «con la entitlement en la respuesta no relee nada» es un control:
  pasa con y sin el arreglo.
- **Quién consume el `status`:** `OfferingSheet.tsx` y `DonationSheet.tsx`, en cadenas `if/else`; nadie más
  (`giftCodeService` tiene su propio tipo). `'notActivated'` solo lo emite `purchaseUnlock`.

## 4. `R9-18` — el pago pendiente se mostraba como fallo (`b4d305b5`)

- **Reproduce.** El rechazo con código `'20'` daba `{status: 'error'}` en `purchaseUnlock` y en
  `purchaseDonation`, y el toast de `purchaseError` en las dos hojas.
- **El arreglo.** `outcomeFromError` reconoce `PAYMENT_PENDING_ERROR` y da el estado nuevo `'pending'`. De paso, la
  comparación de códigos ya no puede dar `undefined === undefined` (un error sin código contra una constante que
  el SDK no tenga). Las dos hojas pintan el aviso con el estado `notice` (`DonationSheet` lo gana en este commit).
- **Pruebas:** 8 del servicio (los cinco códigos vecinos siguen siendo `'error'`, y el mock contra el enum real),
  2 de cada hoja. Una mide el final feliz: confirmado el pago con la hoja cerrada (el listener del SDK), al reabrir
  dice «Extras desbloqueados».
- **Vistas fallar:** sin el mapeo del servicio caen 6; sin la rama de cada hoja, las 2 de esa hoja.

## 5. `R9-19` — `DonationSheet` no manejaba `alreadyOwned` (`c629b9d8`)

- **Reproduce.** El código `'6'` en la donación: toast de `purchaseError` y 0 llamadas a `restorePurchases`.
- **El arreglo.** Ante `alreadyOwned`, la hoja llama a `restore()` (volver a publicar las compras de la tienda es
  lo que le permite a RevenueCat liquidar la que quedó trabada) y pinta un aviso. **El aviso es el mismo haya
  servido o no la liquidación**, porque lo que dice es cierto en los dos casos: la tienda tiene esa donación y no
  hace falta volver a pagar. No reintenta el cobro sola.
- **Pruebas:** 3 de la hoja (el aviso y la llamada única; el mismo aviso si la llamada falla sin red; liquidada, el
  monto se puede volver a dar). **Vistas fallar** con la rama revertida: las 3. La prueba nueva del servicio
  (`purchaseDonation` reporta `alreadyOwned`) es un control: el servicio ya lo hacía.
- **Un efecto lateral, a propósito:** `restore()` desde la hoja de donación también restaura la ofrenda si la
  cuenta de la tienda la tiene. Es la misma llamada que ya hace la hoja de ofrenda.

## 6. Lo que NO se arregló, y los docstrings

- **`R9-135` reproduce, y queda para después.** La sonda: `linkUser('uid')` antes de `initialize()` deja
  `logIn = []`; con Ana premium y el `logIn('beto')` fallando, Beto queda premium en ese proceso y en el arranque
  siguiente. **Por qué no entró:** el arreglo de raíz (recordar el uid y enlazarlo al terminar `initialize()`)
  hace real el enlace del arranque en frío para todos los usuarios. Hoy, tras un arranque en frío, RevenueCat
  queda en su id anónimo (medido en el dispositivo en la sesión 115); con el arreglo quedaría en el uid de
  Firebase, y eso cambia de quién es el premium al iniciar o cerrar sesión. Esa es la decisión abierta de
  `R9-119`. Se arregla después de ella, no antes.
- **`R9-119`, solo los comentarios (`919ee006`).** El docstring de `linkUser` y el comentario de
  `AuthContext.tsx` decían «never revoked on sign-out» y «stays unlocked on this device». Ahora dicen lo que hace
  el código. La conducta no cambió y la entrada sigue abierta.

## 7. Para la revisión de la 145 (sin numerar: nada de esto está medido)

1. **Los avisos por toast dentro de un `Modal`.** `restoreError` es un toast, igual que el `restoreNotFound` que ya
   existía. `R9-560` dice que los toasts del respaldo quedan detrás del modal «Datos»: si a la hoja de ofrenda le
   pasa lo mismo, a quien restaura sin red no le llega ningún mensaje. Los tres avisos de dinero nuevos (pendiente,
   sin activar, en proceso) se pintan en la hoja justamente por eso; el de restaurar no.
2. **`RECEIPT_ALREADY_IN_USE_ERROR` (`7`) al comprar** sigue en «Inténtalo de nuevo». Si ese rechazo llega con el
   cobro hecho, es el mismo daño de `R9-17` por otro camino.
3. **Un fallo de red al comprar (`10`, `35`)** sigue en «Inténtalo de nuevo». Si la tienda cobró y falló la
   publicación del recibo, el reintento cae en `alreadyOwned`, que ahora sí tiene salida; conviene medirlo entero.
4. **El aviso no se cierra solo** si la entitlement llega con la hoja abierta (el listener cambia `isPremium`, la
   hoja se queda en el aviso hasta «Cerrar»). Al reabrir dice «Extras desbloqueados» (probado).
5. **Lo que sale de la documentación del SDK y no de un dispositivo:** que el pendiente llegue como rechazo con el
   código `'20'`; que la entitlement llegue sola al confirmarse el pago; que tocar de nuevo un monto con un pago
   pendiente dé `alreadyOwned`; y que `restorePurchases` consuma en Android un consumible sin liquidar. El «para
   siempre» de `R9-19` tampoco se midió.

## 8. Los textos nuevos (para que Victor los vea)

El del pago pendiente lo decidió Claude por delegación de Victor (2026-11-12): corto, honesto y sin plazos. Los
otros tres los pedían sus arreglos y también los decidió Claude: **Victor puede cambiarlos**.

| Clave                          | Español                                                                                                                                                         | Inglés                                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `offering.pendingTitle`        | «Pago pendiente»                                                                                                                                                | «Payment pending»                                                                                                                                                 |
| `offering.pendingMessage`      | «Tu pago quedó pendiente de confirmación. Los extras se activarán cuando se confirme; no hace falta volver a pagar.»                                            | «Your payment is awaiting confirmation. The extras will unlock once it's confirmed; there's no need to pay again.»                                                |
| `donation.pendingTitle`        | «Pago pendiente»                                                                                                                                                | «Payment pending»                                                                                                                                                 |
| `donation.pendingMessage`      | «Tu donación quedó pendiente de confirmación. No hace falta volver a pagar.»                                                                                    | «Your donation is awaiting confirmation. There's no need to pay again.»                                                                                           |
| `offering.restoreError`        | «No pudimos comprobar si hay una ofrenda anterior. Revisa tu conexión e inténtalo de nuevo.»                                                                    | «We couldn't check for a previous offering. Check your connection and try again.»                                                                                 |
| `offering.notActivatedTitle`   | «Tu ofrenda ya está registrada»                                                                                                                                 | «Your offering is already on record»                                                                                                                              |
| `offering.notActivatedMessage` | «La tienda ya registró tu ofrenda, pero los extras todavía no se activaron aquí. No hace falta volver a pagar: toca «Restaurar mi ofrenda anterior» más tarde.» | «The store has already recorded your offering, but the extras haven't unlocked here yet. There's no need to pay again: tap “Restore my previous offering” later.» |
| `donation.inProgressTitle`     | «Donación en proceso»                                                                                                                                           | «Donation in progress»                                                                                                                                            |
| `donation.inProgressMessage`   | «La tienda ya tiene una donación tuya de este monto que todavía no termina de registrarse. No hace falta volver a pagar; podrás dar de nuevo cuando termine.»   | «The store already has a donation of this amount from you that hasn't finished registering. There's no need to pay again; you can give again once it does.»       |

## 9. La matriz, antes y después (lo que cambió; el resto quedó igual)

| Caso                                                | Antes                                    | Después                                         |
| --------------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| Restaurar, la tienda falla (los 10 rechazos)        | `info: restoreNotFound`                  | `error: restoreError`                           |
| Restaurar, sin compra                               | `info: restoreNotFound`                  | igual                                           |
| Ofrenda, compra resuelta sin entitlement            | pantalla de gracias                      | aviso «Tu ofrenda ya está registrada»           |
| Ofrenda, compra sin entitlement y el SDK ya activo  | `success` con `premium = false`          | `success` con `premium = true` (la relectura)   |
| Ofrenda, pendiente (`20`)                           | `error: purchaseError` y los montos      | aviso «Pago pendiente»                          |
| Ofrenda, ya comprado (`6`), restaurar sin compra    | `error: purchaseError` y los montos      | aviso «Tu ofrenda ya está registrada»           |
| Ofrenda, ya comprado (`6`), restaurar falla por red | `error: purchaseError`                   | `error: restoreError`                           |
| Donación, pendiente (`20`)                          | `error: purchaseError` y los montos      | aviso «Pago pendiente»                          |
| Donación, ya comprado (`6`)                         | `error: purchaseError`, 0 restauraciones | aviso «Donación en proceso», 1 restauración     |
| Cancelar (`1` y `userCancelled`), las dos hojas     | sin toast, los montos                    | igual                                           |
| Los otros seis rechazos al comprar, las dos hojas   | `error: purchaseError` y los montos      | igual                                           |
| Sin configurar                                      | `error` al comprar; la hoja no se pinta  | igual (`restore()` da `'error'`, no `notFound`) |
| `R9-135` (las tres líneas)                          | `logIn = []`, Beto premium               | igual: no se arregló                            |

## 10. Cierre

Los docs de esta sesión van en `docs/review-s144-fix`, apilada sobre `fix/s144-dinero`. El `validate` entero se
corre al cerrar, con el worktree quitado. La revisión de este diff es la sesión 145
(`_scratch/S145-PROMPT.md`).
