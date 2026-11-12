# S145 — revisión del diff de la 144 (la tanda V1, dinero)

> **Sesión 145 (2026-11-12).** En un chat nuevo, en la terminal, sin agentes, con **Fable 5.2 como modelo
> principal** y esfuerzo `high`. Es una revisión: no se tocó la app. Alcance: `ea65f480..919ee006` (cinco commits,
> nueve archivos). Sin emulador: **nada de esto está medido en vivo**.
>
> **Resultado:** los cuatro arreglos arreglan lo que dicen (las siete piezas de la 144 caen otra vez, con los
> mismos conteos y por la razón correcta, y siete piezas más que la 144 no había revertido). La matriz de la 144,
> corrida de nuevo, sale idéntica. **Seis hallazgos nuevos: un P2 (`R9-574`) y cinco P3 (`R9-575` a `R9-579`).**
> El P2: el aviso de «sin activar» manda a «Restaurar mi ofrenda anterior», y «Restaurar», en ese mismo estado,
> responde «No encontramos una ofrenda anterior en esta cuenta». Además, tres cosas que la decisión de `R9-119` no
> cubre y que la tanda V1b tiene que medir antes de escribir (§9).

## 1. Cómo se trabajó

- **Los reverts por pieza**, con el script de la 144 (`_scratch/S144-revert.cjs.txt`) y la salida entera guardada
  (`_scratch/S145-reverts2.out.txt`): las siete piezas de la 144 y siete nuevas (`_scratch/S145-rev16sa`,
  `rev16sb`, `rev17c`, `rev17d`, `rev17s`, `rev18i` y `rev19r`, `.json.txt`). Ningún revert abortó: cada texto a
  revertir aparece una sola vez. El archivo quedó restaurado las catorce veces («restaurado: OK»).
- **Dos controles forzados** (`_scratch/S145-ctl-mock.json.txt` y `S145-ctl-ancho.json.txt`).
- **La sonda de la 144**, copiada a `__tests__/` con otro nombre y corrida con otra etiqueta, y **una sonda
  propia** (`_scratch/S145-sonda.test.tsx.txt`, 9 bloques; su salida, `_scratch/S145-matriz.txt`): el servicio, las
  dos hojas y el `PremiumProvider` reales; `react-native-purchases` simulado solo en su frontera. Las dos salieron
  de `__tests__/` antes de escribir este detalle, y el árbol quedó limpio.
- **Una lectura del SDK instalado**, no de memoria: `react-native-purchases` 10.7.1,
  `@revenuecat/purchases-typescript-internal` 18.30.0 y las clases compiladas de `purchases-android` 10.16.1 (la
  versión que pide `purchases-hybrid-common` 18.30.0, en la caché de Gradle). Es lectura: no reemplaza al
  dispositivo.

## 2. Cada arreglo arregla lo que dice

Las siete piezas de la 144, otra vez (72 pruebas en las tres suites):

| Pieza               | Qué revierte                                        | Caen | Por qué caen                                                     |
| ------------------- | --------------------------------------------------- | ---- | ---------------------------------------------------------------- |
| `rev16`             | `restore()` vuelve a decir `notFound` en el `catch` | 7    | reciben `notFound`; la hoja no muestra `restoreError`            |
| `rev17`             | `purchaseUnlock` no mira la entitlement             | 5    | reciben `success`; la hoja no pinta el aviso                     |
| `rev17b`            | el vecino `alreadyOwned` sin entitlement            | 1    | la hoja no pinta el aviso                                        |
| `rev18`             | el mapeo de `PAYMENT_PENDING_ERROR`                 | 6    | reciben `error`; ninguna de las dos hojas pinta «Pago pendiente» |
| `rev18o` (ofrenda)  | la rama `pending` de `OfferingSheet`                | 2    | no aparece «Pago pendiente»                                      |
| `rev18o` (donación) | la rama `pending` de `DonationSheet`                | 2    | no aparece «Pago pendiente»                                      |
| `rev19`             | la rama `alreadyOwned` de `DonationSheet`           | 3    | no aparece «Donación en proceso»                                 |

Son los conteos del informe de la 144 (7, 5, 1, 6, 2, 2 y 3). Las piezas que la 144 no revirtió:

| Pieza     | Qué revierte                                                     | Caen | Lectura                                                       |
| --------- | ---------------------------------------------------------------- | ---- | ------------------------------------------------------------- |
| `rev16sa` | «Restaurar» con error vuelve a decir `restoreNotFound` (la hoja) | 1    | la hoja está cubierta por separado del servicio               |
| `rev16sb` | `alreadyOwned` + restaurar con error vuelve a `purchaseError`    | 1    | recibe «No se pudo completar la ofrenda. Inténtalo de nuevo.» |
| `rev17c`  | sin la relectura                                                 | 1    | recibe `notActivated` donde esperaba `success`                |
| `rev17d`  | la relectura sin `invalidateCustomerInfoCache`                   | 1    | la prueba mira el orden de las dos llamadas                   |
| `rev17s`  | la rama `notActivated` de la hoja                                | 2    | no aparece el aviso                                           |
| `rev19r`  | sin la llamada a `restore()` en la donación                      | 2    | 0 llamadas donde esperaba 1. **La tercera pasa** (`R9-578`)   |
| `rev18i`  | la guarda contra `undefined === undefined`                       | 0    | **ninguna prueba la cubre** (`R9-578`)                        |

## 3. Las pruebas, contra las reglas

- **El productor real: sí.** Las tres suites usan `offeringService`, las dos hojas y `PremiumProvider` de verdad;
  el SDK está simulado en `__mocks__/react-native-purchases.js`, que es su frontera. Con factoría literal quedan
  `useTheme`, `useLanguage` (fijo en español), `useToast` y `haptics`. Dos consecuencias: ninguna prueba ve el
  inglés pintado (lo midió la sonda, §4 D), y ninguna puede ver si el toast se dibuja (§5.1).
- **«Los códigos del mock son los del SDK real» compara de verdad.** `jest.requireActual` trae
  `@revenuecat/purchases-typescript-internal`, que es el objeto que el SDK real pone en
  `Purchases.PURCHASES_ERROR_CODE` (`react-native-purchases/dist/purchases.js:2257`); ahí
  `PAYMENT_PENDING_ERROR = "20"` (`dist/generated/error-codes.js:32`). Y el módulo nativo rechaza con el código
  como cadena (`RNPurchasesModule.java:169`: `errorContainer.getCode() + ""`). **Forzado:** con `'21'` en el mock
  esa prueba cae, junto con las seis del pendiente.
- **Los controles.** El detalle de la 144 declara dos («con la entitlement en la respuesta no relee nada» y
  «`purchaseDonation` reporta `alreadyOwned`»). Pasan con y sin el arreglo, sin estar declaradas, otras ocho: los
  cinco códigos vecinos («sigue siendo error»), la del mock contra el enum, la del texto del enlace en los dos
  idiomas (estática) y «`notFound` solo cuando la tienda respondió» (una prueba vieja reescrita). Son controles
  por su naturaleza y el informe las describe, pero no las llama así. **Forzadas las que se pueden forzar:** con un
  mapeo demasiado ancho (todo código que no sea cancelar da `pending`) caen las cinco vecinas.
- **Dos pruebas miden menos de lo que dice su título** (`R9-578`): «liquidada, el mismo monto se puede volver a
  dar» pasa sin la llamada a `restore()`, y «cuando el pago se confirma con la hoja cerrada, al reabrir dice
  desbloqueado» solo cae porque el aviso no aparece; lo que nombra (el listener y la reapertura) ya existía.

## 4. La matriz de vecinos

**La de la 144, corrida de nuevo: idéntica** (`diff` vacío contra `_scratch/S144-matriz-despues.txt`).

Lo que la 144 no midió (`_scratch/S145-matriz.txt`):

- **A. Dos toques seguidos en el mismo monto.** Si los dos caen en el mismo cuadro, antes del re-render, salen
  **dos compras**, en las dos hojas. Con un re-render entre los dos, una sola: el monto ya no está a la vista. El
  resultado que llega segundo pisa al primero: con «pendiente» primero y un error después, queda el toast de
  «Inténtalo de nuevo» y **los montos**; con la ofrenda ya activa primero y un error después, los montos con
  `premium = true`; en la donación, tras una donación hecha, «No se pudo completar la donación. Inténtalo de
  nuevo.» y los montos. En el orden contrario (el error primero) la pantalla final es la correcta, con el toast de
  error encima. `R9-576`.
- **B. Cerrar la hoja con la compra en vuelo.** El resultado llega con la hoja cerrada y **el aviso se pierde**:
  ni «Pago pendiente» ni «Tu ofrenda ya está registrada» se ven nunca, y al reabrir están los montos, sin
  ningún mensaje. Igual en la donación (pendiente y «ya comprado»). Con un fallo de red el toast sí sale (con la
  hoja cerrada), y con la ofrenda activa, al reabrir dice «Extras desbloqueados». `R9-575`.
- **C. La entitlement llega por el listener con la hoja abierta.** Con el aviso a la vista, el aviso se queda:
  `premium = true` y la hoja sigue diciendo «los extras todavía no se activaron aquí» (o «quedó pendiente») hasta
  «Cerrar»; al reabrir, «Extras desbloqueados». Con los montos a la vista, se quedan los montos, y se puede tocar
  uno con `premium = true` (la sonda: una compra más). `R9-577`.
- **D. En inglés.** Los seis caminos pintan el texto en inglés y el botón «Close»; los toasts de restaurar, en
  inglés. Nada que reportar.
- **E. `restore()` desde la hoja de donación cuando la cuenta SÍ tiene la ofrenda.** El usuario ve «Donación en
  proceso» y nada más: ni toast ni mención de los extras. Por debajo, `premium` pasa a `true` (el servicio y la
  caché). `R9-579`.
- **F. El aviso manda a «Restaurar».** Cobrado sin activar; cerrar; reabrir; «Restaurar mi ofrenda anterior»:
  **«No encontramos una ofrenda anterior en esta cuenta.»** Y por el otro camino: pendiente; reabrir; el mismo
  monto («ya comprado»); el aviso de «ya está registrada»; reabrir; «Restaurar»: el mismo texto. `R9-574`.
- **G. Un fallo de red al comprar, con el cobro hecho, y el reintento** (§5.3).
- **H. El toast con el `ToastProvider` real** (§5.1).
- **I. La guarda de `outcomeFromError`.** Con un SDK sin `PAYMENT_PENDING_ERROR` y un `Error` sin código, el
  servicio responde `error`; con la guarda revertida, `pending`. La guarda hace lo que dice; no tiene prueba.

## 5. Los cinco puntos que dejó la 144 (su §7)

1. **Los toasts dentro de un `Modal`: sin medir, y no se afirma.** Lo que jest permite: con el `ToastProvider`
   real, el toast de `restoreError` se monta, y queda **fuera** del `Modal` de la hoja (la raíz del árbol es
   `Modal, View`; el texto está en el segundo). En Android un `Modal` es otra ventana, encima de la principal, así
   que el toast se dibuja debajo de la ventana de la hoja. Lo que jest NO puede decir es si se ve. `R9-560` lo
   midió con un modal opaco a pantalla completa. Esta hoja es distinta por lectura: el fondo es translúcido
   (`overlayBlack45`), la hoja sube desde abajo y el toast va arriba (`position: 'top'`,
   `ToastContext.tsx:134`). Puede verse atenuado por encima de la hoja, o quedar tapado si la hoja llega arriba
   (con la lista de extras es alta). Depende de la geometría: hace falta la ráfaga de capturas en el dispositivo.
   Lo que está en juego: `restoreError`, `restoreNotFound`, `restoreSuccess` y `purchaseError` de las dos hojas.
2. **`RECEIPT_ALREADY_IN_USE_ERROR` (`7`) al comprar:** sigue en «Inténtalo de nuevo» (medido en la matriz). Si
   llega con el cobro hecho no se puede saber sin el SDK real. Sin medir.
3. **Un fallo de red al comprar (`10`, `35`), entero, en el mock.** Primer toque: «Inténtalo de nuevo» y los
   montos. Segundo toque, «ya comprado»: si la restauración trae la ofrenda, «Extras restaurados» y la pantalla de
   gracias; si responde sin ella, el aviso de «ya está registrada»; si falla por red, `restoreError` y los montos.
   En la donación: «Donación en proceso», con una llamada a `restorePurchases`. La cadena tiene salida en los
   tres casos. Que la tienda haya cobrado en ese primer rechazo, y que el segundo toque dé «ya comprado», sale del
   SDK: sin medir.
4. **El aviso no se cierra solo:** medido (§4 C). `R9-577`.
5. **Lo que sale de la documentación del SDK.** Sigue sin medir. Lo que agrega la lectura del SDK instalado: el
   código `'20'` y la forma del rechazo (§3); `PaymentPendingError` aparece en `PostReceiptHelper` de
   `purchases-android` 10.16.1; y el camino de `restorePurchases` nombra `queryAllPurchases` y
   `postTransactionAndConsumeIfNeeded`, que es coherente con lo que supuso `R9-19` (restaurar liquida un
   consumible trabado). Son nombres en clases compiladas, no una medición.

## 6. Quién consume los valores que cambiaron

`grep` en `src/` y `app/`: `restore()`, `PurchaseOutcome`, `RestoreOutcome`, `'notActivated'`, `'pending'` y
`kind: 'notice'` solo aparecen en `offeringService.ts` y en las dos hojas. `giftCodeService` tiene su propio tipo
(un comentario lo dice). Los otros `'pending'` son del quiz. En la web: `OfferingSheetContext.web.tsx` es un stub
cuyo `open()` no hace nada y que no importa la hoja; no hay `.web.tsx` de ninguna de las dos hojas, y
`_layout.web.tsx` no monta `DonationSheetProvider`. Ningún valor de este diff llega a la web.

## 7. Los textos nuevos, en los dos idiomas

| Clave                                | Caminos que la muestran                                                       | Se sostiene                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `offering.pendingTitle/Message`      | el rechazo `'20'` al dar la ofrenda                                           | Sí. Sin plazos. «Se activarán cuando se confirme» depende del SDK: sin medir                                         |
| `donation.pendingTitle/Message`      | el rechazo `'20'` al donar                                                    | Sí                                                                                                                   |
| `offering.restoreError`              | «Restaurar» y `alreadyOwned`, con cualquier rechazo                           | Para la red, sí. Para la tienda (`2`), no permitido (`3`) y recibo en uso (`7`), «Revisa tu conexión» no es la causa |
| `offering.notActivatedTitle/Message` | compra resuelta sin entitlement; `alreadyOwned` y la tienda responde sin ella | **No del todo: `R9-574`.** Nombra el enlace con su texto exacto, en los dos idiomas                                  |
| `donation.inProgressTitle/Message`   | `alreadyOwned` al donar, haya servido o no la restauración                    | Sí. Sin plazos                                                                                                       |

El inglés dice lo mismo que el español en los nueve textos. Ninguno promete un plazo.

**Reemplazos propuestos (sin escribir; los decide la tanda que los toque):**

- Para `R9-574`, el texto solo no alcanza; va con código (la propuesta está en la entrada). El texto que
  acompañaría, para `offering.restoreNotFound`: «No encontramos una ofrenda confirmada en esta cuenta. Si tu pago
  sigue pendiente, los extras se activarán cuando se confirme.» / «We couldn't find a confirmed offering on this
  account. If your payment is still pending, the extras will unlock once it's confirmed.»
- Para `offering.restoreError` (opcional; no lleva número): «No pudimos comprobar si hay una ofrenda anterior.
  Revisa tu conexión e inténtalo de nuevo más tarde.» / «We couldn't check for a previous offering. Check your
  connection and try again later.»

## 8. Los dos comentarios de `R9-119`

Dicen lo que hace el código de `919ee006`, con dos salvedades menores:

- «…locks the extras until the buyer signs back in»: volver a iniciar sesión no es la única salida; «Restaurar mi
  ofrenda anterior» también devuelve los extras (`detail/C15-hoja-ofrenda.md`, medido en el dispositivo).
- «…is an open product decision»: era cierto en el commit; la decisión se tomó después (solo docs). La tanda V1b
  los reescribe de todos modos.

## 9. `R9-135` y la decisión de `R9-119`

- **`R9-135` reproduce:** las tres líneas de la sonda de la 144 salen iguales. La tercera («el arranque siguiente
  de Beto») simula a mano que el SDK recuerda su usuario en disco: el mock no modela usuarios.
- **Lo que la decisión dice haber comprobado por lectura, se sostiene:**
  - De anónimo a Google: `linkWithCredential` (`AuthContext.tsx:487`), y `signInWithCredential` solo tras
    `auth/credential-already-in-use` (`:532`, `:600`).
  - El canje: `giftCodeService.ts:132-146` toma cualquier `currentUser`, y `:201` llama a `linkUser(uid)`. Que el
    backend conceda al uid que canjea lo dice un comentario del cliente; la función no se leyó.
  - `isAnonymous` ya decide «sin dueño» para la Mesa y el almacén local (`:304`, `:311`).
- **Tres cosas que la decisión no cubre.** Ninguna la invalida; las tres cambian lo que la V1b tiene que medir:
  1. **La regla, tal como está escrita, no es cierta para restaurar.** «Un usuario anónimo nunca le cambia el
     dueño a RevenueCat»: `restorePurchases` también mueve el derecho al usuario que RevenueCat tenga en ese
     momento, anónimo incluido (`C15`, medido: la restauración le dio `extras` al uid anónimo del emulador). Y
     desde la 144 hay tres caminos que restauran: el enlace, `alreadyOwned` en la ofrenda y `alreadyOwned` en la
     donación (`R9-579`). El §11 del detalle de la 144 ya acota la regla al enlace AUTOMÁTICO de `AuthContext`;
     `CONTINUAR.md` §7 la escribe sin esa acotación.
  2. **El camino de anónimo a Google no pasa por el enlace automático.** Tras `linkWithCredential` el código hace
     `setUser(mergedUser)` a mano (`:521-530`); el enlace con RevenueCat vive en `onAuthStateChanged` (`:377-379`).
     Hoy no importa, porque el anónimo ya quedó enlazado con ese mismo uid. Con la regla (el anónimo no se
     enlaza), quien pasa de anónimo a Google en la misma sesión no queda enlazado hasta el arranque siguiente,
     salvo que la V1b lo enlace ahí. Que `onAuthStateChanged` no dispare tras un `linkWithCredential` sale de la
     documentación de Firebase: a medir con el `AuthProvider` real.
  3. **Las compras de hoy viven bajo el id anónimo de RevenueCat.** Tras un arranque en frío el usuario de
     RevenueCat es `$RCAnonymousID` (sesión 115, medido). El arreglo de `R9-135` hace que cada arranque de una
     cuenta llame a `logIn(uid)`. Qué hace RevenueCat con las compras del id anónimo en ese `logIn` (las une al
     uid si el uid es nuevo; si el uid ya existía, puede responder con el cliente del uid, sin ellas) sale de su
     documentación y no está medido. Si pasa lo segundo, **quien ya dio la ofrenda pierde los extras en su propio
     aparato al actualizar**, hasta que restaure. El mock de jest no puede responderlo: su `logIn` devuelve un
     `customerInfo` global. Es lo primero que hay que medir con la cuenta de prueba, y antes de eso la V1b tiene
     que decidir qué simula el mock y escribirlo como supuesto.

## 10. Hallazgos nuevos

| Id       | Sev. | Qué                                                                                          |
| -------- | ---- | -------------------------------------------------------------------------------------------- |
| `R9-574` | P2   | El aviso manda a «Restaurar», y «Restaurar» responde «No encontramos una ofrenda anterior»   |
| `R9-575` | P3   | El aviso se pierde si la hoja se cerró con la compra en vuelo                                |
| `R9-576` | P3   | Dos toques en el mismo cuadro: dos compras, y el segundo resultado pisa el aviso del primero |
| `R9-577` | P3   | La hoja no reacciona a la entitlement que llega con ella abierta                             |
| `R9-578` | P3   | Pruebas: la guarda de `outcomeFromError` sin prueba, y «liquidada» no mide la liquidación    |
| `R9-579` | P3   | «Ya comprado» en la donación restaura la ofrenda en silencio (y mueve el derecho)            |

## 11. Sin medir en vivo (ni bueno ni malo)

1. Que el pendiente llegue como rechazo con el código `'20'`.
2. Que la entitlement llegue sola cuando el pago se confirma.
3. Que tocar un monto con un pago pendiente dé `alreadyOwned`.
4. Que `restorePurchases` liquide en Android un consumible trabado, y el «para siempre» de `R9-19`.
5. Los rechazos `7`, `10` y `35` al comprar con el cobro hecho.
6. Si un toast se ve con la hoja abierta (§5.1).
7. Que una segunda compra simultánea dé el rechazo `'15'`, y si dos toques entran en un mismo cuadro.
8. Cuánto dura la ventana entre el diálogo de Play y la respuesta del SDK (`R9-575`).
9. El ajuste de restauración del panel de RevenueCat (transferir o conservar): decide `R9-579` y qué responde
   «Restaurar» con el recibo en uso.
10. Qué hace `logIn(uid)` con las compras del id anónimo (§9.3), y si `onAuthStateChanged` dispara tras
    `linkWithCredential` (§9.2).
11. El inglés y la letra grande, pintados en el dispositivo.

## 12. Archivos de la sesión (`_scratch`)

`S145-reverts.sh.txt` y `S145-reverts2.out.txt`; las siete piezas `S145-rev*.json.txt` y los dos controles
`S145-ctl-*.json.txt`; `S145-sonda.test.tsx.txt` y `S145-matriz.txt`; `S144-matriz-s145.txt` (la matriz de la 144,
corrida de nuevo).
