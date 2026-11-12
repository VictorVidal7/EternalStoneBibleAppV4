# S146 — arreglos: `R9-574` y la tanda V1b (de quién es el premium)

> **Sesión 146 (2026-11-12).** En un chat nuevo, en la terminal, sin agentes, con **Fable 5.2 como modelo
> principal** y esfuerzo `high`. Rama de código `fix/s146-premium`, un commit por hallazgo. Sin emulador: **nada de
> esto está medido en vivo**.
>
> **Resultado.** Arreglados: `R9-574` (P2), `R9-119` (P2), `R9-579` (P3) y `R9-578` (P3). **`R9-135` (P2) quedó
> arreglado EN PARTE y sigue abierto:** entró el reintento de un `logIn` que falla al cambiar de cuenta, que no
> depende de nada sin medir; **no entraron dos piezas** (enlazar a la cuenta al terminar `initialize()`, y enlazar
> tras pasar de anónimo a Google), porque con el supuesto malo le quitan los extras a quien pagó. Están escritas y
> medidas aquí (§6), esperando la medición con la cuenta de Google de prueba. `R9-575`, `R9-576` y `R9-577` (P3)
> no entraron: siguen abiertos.

## 1. Cómo se trabajó

- **Un ciclo por hallazgo:** reproducir con el productor real, arreglar, la prueba vista fallar con cada pieza
  revertida (`_scratch/S144-revert.cjs.txt`), la matriz otra vez, y el `grep` de quién consume el valor. Las
  compuertas antes de cada commit: `_scratch/S146-gates.sh.txt` (prettier y eslint sobre lo tocado, `tsc` entero y
  24 suites vecinas, las de `AuthContext` incluidas).
- **Dos sondas**, copiadas a `__tests__/` con otro nombre, sin commitear, y afuera antes del último commit:
  - `_scratch/S146-sonda-cabeza.txt` + `S146-sonda574-cuerpo.txt` (la de `R9-574`: la hoja, el servicio y el
    `PremiumProvider` reales, en los dos idiomas). Salida: `_scratch/S146-matriz574.txt`.
  - `_scratch/S146-sonda-v1b.test.tsx.txt` (la matriz de la V1b: el `AuthProvider`, el `offeringService` y el
    `giftCodeService` reales; Firebase Auth, Google Sign-In, `@lib/sync` y el SDK simulados en su frontera).
    Salidas: `_scratch/S146-matriz-v1b-antes.txt`, `-c1`, `-despues` y `-propuesta`.
- **El SDK instalado, leído y no citado de memoria** (`react-native-purchases` 10.7.1, `purchases-hybrid-common`
  18.30.0 y `purchases-android` 10.16.1; las clases, con `javap -c -p` sobre el `classes.jar` del AAR). §2 y §5.
- **Las ESLint de `AuthContext.tsx`:** el archivo da 37 avisos de `no-explicit-any` con `--max-warnings 0`, igual
  que en `main` (medido sobre `git show main:…`). No son de esta sesión y no se tocaron.

## 2. `R9-574` — «Restaurar» ya no niega una ofrenda que la tienda registró (`593107eb`)

**Reproduce:** las pruebas nuevas, corridas contra el código sin arreglar, caen cuatro (el servicio responde
`notFound` con la compra en la cuenta; la hoja pinta el toast y los montos; el texto no nombra el pendiente).

**Lo que trae de verdad el `CustomerInfo`** (leído): el tipo declara `allPurchasedProductIdentifiers: string[]` y
`nonSubscriptionTransactions: PurchasesStoreTransaction[]` (`customerInfo.d.ts`); el mapeo híbrido emite los dos
(`CustomerInfoMapperKt`), cada transacción con `transactionIdentifier`, `productIdentifier` y `purchaseDate`
(`TransactionMapperKt`); en Android `nonSubscriptionTransactions` sale del campo `non_subscriptions` de la
respuesta, y `allPurchasedProductIds` se arma con esa misma lista.

**Lo que la propuesta de la entrada no decía: esa lista trae también las DONACIONES.** La app vende dos familias de
productos únicos, y las dos figuran ahí. Con la propuesta tal cual, a quien solo donó y toca «Restaurar» se le
habría dicho «Tu ofrenda ya está registrada». El arreglo deja afuera los ids de `DONATION_PRODUCT_IDS`.

**El arreglo:**

- `restore()` tiene una cuarta respuesta, `'notActivated'`: la tienda respondió, la cuenta tiene una ofrenda (una
  transacción que no es una donación) y la entitlement no está activa. `'notFound'` queda para «la tienda
  respondió y la cuenta no tiene ninguna ofrenda».
- `OfferingSheet`: «Restaurar» con `'notActivated'` pinta **el mismo aviso** que mandó ahí, en vez del toast.
- `offering.restoreNotFound` ya no afirma que no hay ofrenda: un pago pendiente no figura en la cuenta.
- El mock del SDK trae las listas de compras vacías por defecto, como el `CustomerInfo` real.

**Los textos que cambiaron (para que Victor los vea):**

| Clave                      | Antes                                                   | Ahora                                                                                                                                  |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `offering.restoreNotFound` | «No encontramos una ofrenda anterior en esta cuenta.»   | «No encontramos una ofrenda confirmada en esta cuenta. Si tu pago sigue pendiente, los extras se activarán cuando se confirme.»        |
| `offering.restoreNotFound` | "We couldn't find a previous offering on this account." | "We couldn't find a confirmed offering on this account. If your payment is still pending, the extras will unlock once it's confirmed." |

Ningún otro texto cambió. El aviso que ahora pinta «Restaurar» es el de la 144, sin tocar
(`offering.notActivatedTitle` y `notActivatedMessage`).

**Las piezas, revertidas una por una** (`_scratch/S146-reverts574.out.txt`; 81 pruebas en tres suites):

| Pieza  | Qué revierte                          | Caen | Por qué                                                                        |
| ------ | ------------------------------------- | ---- | ------------------------------------------------------------------------------ |
| `574a` | `restore()` vuelve a decir `notFound` | 3    | reciben `notFound`; la hoja pinta el toast                                     |
| `574b` | sin el filtro de donaciones           | 2    | con solo donaciones responde `notActivated`, y la hoja pinta el aviso          |
| `574c` | sin la guarda de la lista ausente     | 6    | una respuesta sin la lista revienta y da `error` (cinco son pruebas de la 144) |
| `574d` | sin la rama `notActivated` de la hoja | 1    | «Restaurar» cae al toast de `restoreError`                                     |
| `574e` | el texto en español                   | 1    | no nombra el pendiente                                                         |
| `574f` | el texto en inglés                    | 1    | no nombra el pendiente                                                         |

Una prueba es control por naturaleza y pasa con y sin el arreglo: «pendiente → ya comprado → el aviso →
Restaurar: el toast no niega un pago pendiente» (mira que el toast sea `restoreNotFound`; lo que cambia es el
texto, y eso lo mide la prueba estática).

**La regla de la 145, aplicada: el botón que nombra el aviso, tocado en el mismo estado, en los dos idiomas**
(`_scratch/S146-matriz574.txt`; español e inglés salen iguales):

- Cobrado sin activar → cerrar → reabrir → «Restaurar»: el aviso otra vez, sin toast. Una segunda vez: igual.
  Con la entitlement ya activa: «Extras restaurados» y la pantalla de gracias.
- Pendiente → el mismo monto («ya comprado») → el aviso → reabrir → «Restaurar»: los montos y el toast nuevo.
- Una cuenta con solo donaciones → «Restaurar»: los montos y el toast nuevo.
- «Ya comprado», y la tienda trae la compra sin entitlement: el aviso.
- La donación con «ya comprado» y la ofrenda sin entitlement en la cuenta: «Donación en proceso», sin toast.
- «Restaurar» sin red: `restoreError` y los montos (el vecino `R9-16`, igual).

**Quién consume `restore()`:** `OfferingSheet` (dos lugares: el enlace, con su rama nueva; y «ya comprado», cuyo
`else` ya pintaba el aviso para `notFound` y ahora también para `notActivated`) y `DonationSheet` (§7).

**Un vecino que queda escrito, sin medir:** si tras un reembolso RevenueCat conserva la transacción en
`nonSubscriptionTransactions`, a esa persona «Restaurar» le diría «Tu ofrenda ya está registrada… No hace falta
volver a pagar». Depende del backend.

## 3. Las tres cosas que la decisión de `R9-119` no cubría

### a. La regla y la restauración

**Decidido por Claude por delegación (`CONTINUAR.md` §7).** La regla se reescribe: **el ENLACE automático (el
`logIn` de RevenueCat) nunca lo dispara un anónimo; una RESTAURACIÓN no es un enlace, y vale para cualquiera.**

- Por qué: una restauración solo trae lo que es de la cuenta de la TIENDA del aparato; quien la pide tiene esa
  cuenta en la mano. Es la única manera que tiene de recuperar sus extras quien nunca inició sesión (la mayoría),
  y negársela a un anónimo sería el error que la decisión no acepta: quitárselo a quien pagó.
- Lo que la regla NO puede prometer: que la restauración en un aparato no se lo quite a otro. Si el panel de
  RevenueCat está en «transferir», restaurar siendo anónimo en el aparato B le saca la ofrenda al cliente del
  aparato A, que la recupera restaurando. Es del panel, no del código: sin medir.
- **`R9-579`:** la restauración de «ya comprado» en la donación se conserva (§7); se arregla el silencio.

### b. De anónimo a Google en la misma sesión

**Medido con el `AuthProvider` real** (la sonda, fila 6): tras `linkWithCredential` no hay ninguna llamada a
`logIn` y RevenueCat sigue en su id anónimo. En otro aparato, iniciar sesión con esa cuenta no trae los extras
(`premium = false`). O sea: **«la cuenta lo lleva a otros aparatos» hoy no se cumple para quien compró antes de
crear su cuenta**; en el otro aparato hay que restaurar, que sí funciona si es la misma cuenta de la tienda.

Enlazar ahí es una de las dos piezas que no entraron (§6). Y si Firebase SÍ avisa tras `linkWithCredential`
(sin medir), el código ya enlaza hoy por el listener (fila 6b): esa fila depende hoy del supuesto, y no se tocó.

### c. Las compras de hoy viven bajo el id anónimo de RevenueCat

**Qué se leyó en el SDK** (`purchases-android` 10.16.1): `IdentityManager.configure(null)` usa el usuario guardado
(`getCachedAppUserID`), así que el SDK recuerda su usuario entre arranques; `PurchasesOrchestrator.logIn` compara
el id nuevo con el actual y, si son iguales, no cambia de identidad; `currentUserIsAnonymous` existe y llega a JS
como `Purchases.isAnonymous()`. Al cambiar de usuario el cliente solo copia atributos
(`copySubscriberAttributesToNewUserIfOldIsAnonymous`). **Qué pasa con las COMPRAS del id anónimo lo decide el
backend, y no se puede leer.**

**Qué supone el mock, y por qué.** El mock commiteado (`__mocks__/react-native-purchases.js`) **no modela
clientes**: `logIn` responde con un `customerInfo` global, sea quien sea el uid. Desde esta sesión sabe en qué id
está (para `isAnonymous`), y nada más: una prueba commiteada no puede afirmar ni negar qué pasa con las compras.
La sonda sí modela usuarios, con un interruptor:

- **Supuesto U (une):** `logIn(uid)` desde un id anónimo pasa las compras de ese id al uid.
- **Supuesto N (no une):** responde con lo que el uid ya tenía; las compras quedan en el id anónimo.
- En los dos: `logIn` desde el id de una CUENTA nunca une; `restorePurchases` le pasa al usuario actual las
  compras de la cuenta de la tienda. La documentación de RevenueCat describe U si el uid es nuevo y N si ya
  existía; no es una medición.

## 4. `R9-119` — el anónimo que nace tras cerrar sesión ya no se enlaza (`3190815b`)

**Reproduce** (la sonda, fila 1, y las cuatro pruebas nuevas contra el código sin arreglar): Ana, con la ofrenda,
cierra sesión; `logIn(anon2)`; `premium = false`, caché `false`.

**El arreglo:** en `onAuthStateChanged`, `linkOfferingUser` solo se llama si el usuario NO es anónimo. Vale también
para el anónimo de un primer arranque. `giftCodeService` no cambió: enlaza él mismo al uid que canjea.

**Los dos comentarios** (`AuthContext.tsx` y el docstring de `linkUser`) dicen lo que hace el código nuevo: quién
llama a `linkUser`, que un anónimo no, y que `logOut` no se llama nunca. Nada más.

**La pieza:** con la guarda revertida caen las cuatro pruebas (`logIn` recibe al anónimo).

**Quién consume el valor:** `linkUser` tiene dos llamadores, `AuthContext` y `giftCodeService`. El segundo se midió
en la sonda (filas 4 y 4b): el canje siendo anónimo sigue desbloqueando, y sigue tras un arranque en frío.

**El vecino que abrió, visto en la matriz entre commit y commit:** con el anónimo ya sin enlazar, RevenueCat se
queda en la cuenta que salió. Si el `logIn` de la cuenta que ENTRA falla, esa cuenta ve los extras de la anterior
en cada arranque, y lo que compre va al cliente de la otra (fila 3b: `tok2→ana`). Antes ese caso casi no se veía,
porque el enlace del anónimo ya había pisado a la cuenta anterior. Es `R9-135`, y por eso su parte segura entró
en el commit siguiente.

## 5. `R9-135` — el `logIn` que falla al cambiar de cuenta se reintenta (`b48c430b`; la entrada sigue abierta)

**Lo que entró** (igual con U y con N: la fila 3b es la única que cambia, y cambia igual en los dos):

- `linkUser`: un `logIn` que falla **con RevenueCat en el id de OTRA cuenta** queda anotado, en memoria y en disco
  (`src/lib/offering/pendingLink.ts`, `expo-secure-store`, la misma tienda que la caché de la entitlement).
- Se reintenta al terminar `initialize()`, **solo si esa cuenta sigue siendo la de la sesión** (`linkUser`, llamado
  antes de `initialize()`, ya no se descarta: recuerda el uid en memoria para esa comparación); y antes de
  `purchaseUnlock` y de `restore`, que son las dos operaciones que le escriben un dueño a una compra.
- Un `logIn` que sale bien borra el pendiente.

**Por qué esa guarda y no otra.** Lo que no está medido es qué hace `logIn` con las compras de un id ANÓNIMO.
Cuando RevenueCat está en el id de otra cuenta no hay compras anónimas en juego: el reintento hace la misma
llamada que el código ya hacía al iniciar sesión, solo que después. El cliente sí puede saber en cuál de los dos
casos está (`Purchases.isAnonymous()`), y la guarda se corta ahí.

**Las once piezas, revertidas una por una** (`_scratch/S146-reverts135.out.txt`; 139 pruebas en cuatro suites):

| Pieza  | Qué revierte                                             | Caen | Lectura                                                        |
| ------ | -------------------------------------------------------- | ---- | -------------------------------------------------------------- |
| `135a` | el fallo no se anota                                     | 8    | nada queda pendiente                                           |
| `135b` | sin la guarda del id anónimo                             | 2    | un fallo con RevenueCat en su id anónimo queda anotado         |
| `135c` | sin el reintento antes de comprar                        | 1    | la compra sale sin el tercer `logIn`                           |
| `135d` | sin el reintento antes de restaurar                      | 1    | igual, en `restore`                                            |
| `135e` | sin el reintento al terminar `initialize()`              | 6    | tres son las suyas; **tres caen en cascada** (ver abajo)       |
| `135f` | el reintento del arranque sin mirar quién está en sesión | 2    | reintenta con nadie y con otra cuenta en sesión                |
| `135g` | un `logIn` bueno no borra el pendiente del disco         | 5    | el arranque siguiente vuelve a llamar                          |
| `135h` | …ni el de memoria                                        | 1    | la compra siguiente reintenta a la cuenta vieja                |
| `135i` | la llamada temprana no se recuerda                       | 6    | el arranque no sabe quién está en sesión; tres caen en cascada |
| `135j` | anotado en memoria y no en disco                         | 7    | el arranque siguiente no reintenta                             |
| `135k` | anotado en disco y no en memoria                         | 2    | la compra y la restauración no reintentan                      |

**La cascada, para la revisión:** el `__reset()` del mock hace `mockClear`, que no vacía la cola de
`mockRejectedValueOnce`. Con `135e` o `135i`, la prueba «si el reintento del arranque vuelve a fallar» deja un
rechazo sin consumir, y las tres pruebas que siguen lo heredan. Con el código bueno no pasa.

**Lo que queda cubierto solo en parte, escrito para que no se pierda:** si el `logIn` que falla es el del canje de
un código siendo anónimo (con RevenueCat en la cuenta que salió), queda anotado y se reintenta antes de comprar o
restaurar, pero no en el arranque siguiente: `AuthContext` ya no le dice al servicio el uid de un anónimo.

## 6. Las dos piezas que NO se commitearon (esperan la medición en vivo)

**El criterio** (decidido por Claude por delegación, `CONTINUAR.md` §7): solo se commitea lo que es seguro con los
DOS supuestos. Si con el supuesto malo una pieza le quita los extras a quien pagó, no entra.

Las dos están escritas en `_scratch/S146-propuesta.cjs.txt` (`aplicar` y `quitar`), y medidas con la sonda
(`_scratch/S146-matriz-v1b-propuesta.txt`):

- **P1 — la raíz de `R9-135`:** al terminar `initialize()`, enlazar a la cuenta que llegó antes (una línea: el uid
  ya se recuerda).
- **P2 — de anónimo a Google:** llamar a `linkOfferingUser` tras un `linkWithCredential` que salió bien.

| Fila de la matriz                                                            | Hoy y con la 146 | Con P1 y P2, supuesto U | Con P1 y P2, supuesto N           |
| ---------------------------------------------------------------------------- | ---------------- | ----------------------- | --------------------------------- |
| 5b. Cuenta de Google, la compra bajo el id anónimo; arranque tras actualizar | extras           | extras                  | **SIN extras**, hasta «Restaurar» |
| 5c. Lo mismo, y RevenueCat ya conocía el uid                                 | extras           | extras                  | **SIN extras**, hasta «Restaurar» |
| 6. Compró siendo anónimo y pasa a Google en la misma sesión                  | extras           | extras                  | **SIN extras**, hasta «Restaurar» |
| 6. …y en OTRO aparato inicia sesión con esa cuenta                           | sin extras       | **extras**              | sin extras                        |

En los dos supuestos «Restaurar» devuelve los extras (`restored`). Con las piezas aplicadas caen cinco pruebas
commiteadas, que son justamente las que fijan que hoy no se enlaza (entre ellas «una cuenta que llega antes de
`initialize()` sin nada pendiente NO se enlaza al terminar»): son las que hay que cambiar el día que entren.

**Lo que decide la medición.** Con la cuenta de Google de PRUEBA, en el emulador: una compra hecha con RevenueCat
en su id anónimo; después `logIn(uid)` con un uid nuevo, y con un uid que RevenueCat ya conocía; y mirar si la
entitlement sigue. Si une en los dos casos, entran P1 y P2 y `R9-135` se cierra. Si no une cuando el uid ya
existía, P1 necesita una restauración silenciosa después del `logIn`, y eso depende del ajuste de transferencias
del panel.

## 7. `R9-579` y `R9-578`

- **`R9-579` (`55adac79`).** La restauración de «ya comprado» en la donación se conserva: es lo que liquida la
  donación trabada, y por la regla (§3a) vale para quien tiene la cuenta de la tienda. Lo que cambia: cuando es
  ella la que desbloquea los extras, la hoja lo dice con el toast `offering.restoreSuccess` («Extras restaurados.
  ¡Gracias por tu ofrenda!»). Si ya estaban activos, o la cuenta no tiene la ofrenda, no dice nada. Dos piezas:
  sin el toast cae una prueba; sin la guarda de «ya estaban activos», otra. Texto nuevo: ninguno.
- **`R9-578` (`14dea172`, solo pruebas).** La guarda de `outcomeFromError` tiene tres pruebas, con la constante
  quitada del mock; con la guarda revertida (`_scratch/S145-rev18i.json.txt`, la pieza de la 145) caen dos, y la
  tercera es control. «liquidada, el mismo monto se puede volver a dar» se llama ahora «tras el aviso, al cerrar y
  reabrir el mismo monto se puede volver a tocar», con un comentario que dice que el mock no modela un consumible
  trabado.

## 8. La matriz de la V1b, con lo commiteado

`_scratch/S146-matriz-v1b-despues.txt`. Corrida de nuevo tras apilar los cinco commits: idéntica.

| Fila                                                          | Antes                                   | Ahora                                                       | ¿Depende del supuesto? |
| ------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------- | ---------------------- |
| 1. Cerrar sesión con premium                                  | `logIn(anónimo)`, sin extras            | sin llamada; extras, también tras un arranque en frío       | no                     |
| 2. Cerrar sesión sin premium                                  | sin extras                              | sin extras; RevenueCat queda en esa cuenta                  | no                     |
| 3. Otra cuenta en el mismo aparato                            | lo de esa cuenta                        | lo de esa cuenta; la primera, al volver, recupera los suyos | no                     |
| 3b. …y el `logIn` de la que entra falla                       | (tapado por el enlace del anónimo)      | ve los de la anterior en esa sesión; el arranque lo corrige | no                     |
| 4. Canje de un código siendo anónimo                          | extras                                  | extras, también tras un arranque en frío                    | no                     |
| 4b. Canje siendo anónimo con la ofrenda ya comprada           | extras                                  | extras (con N la compra queda en el id anónimo)             | solo de quién es       |
| 5a. Arranque en frío, compró siendo anónimo                   | extras                                  | extras                                                      | no                     |
| 5b y 5c. Arranque en frío con cuenta, compra en el id anónimo | extras                                  | extras, sin llamada                                         | no                     |
| 6. De anónimo a Google en la misma sesión                     | extras; no se enlaza                    | igual                                                       | no                     |
| 6b. …si Firebase avisa tras `linkWithCredential`              | `logIn`: con N, **sin extras**          | igual (no se tocó)                                          | **sí, ya antes**       |
| 7. «Eliminar cuenta» con premium                              | extras; RevenueCat en el uid borrado    | igual                                                       | no                     |
| 8. Comprar siendo anónimo y entrar a una cuenta que ya había  | `logIn`: con N, **sin extras**          | igual (no se tocó); «Restaurar» los devuelve                | **sí, ya antes**       |
| 9. Restaurar siendo anónimo en otro aparato                   | extras; la compra pasa a ese id anónimo | igual                                                       | no (del panel)         |
| 10. Primer arranque, el anónimo llega con el SDK configurado  | `logIn(anónimo)`                        | sin llamada                                                 | no                     |

**«Eliminar cuenta», medido y sin decidir (fila 7).** Tras borrar la cuenta, el aparato sigue con los extras y
RevenueCat sigue respondiendo por el uid borrado, también tras un arranque en frío. Esto ya era así antes de la
sesión (al borrar no se llamaba a nada), y con `R9-119` deja de «arreglarlo» el anónimo que nacía después. Dos
cosas para la tanda V4 (cuenta): el cliente de RevenueCat con el uid borrado sigue existiendo en RevenueCat (¿se
borra al eliminar la cuenta?), y si quien borró su cuenta conserva los extras en el aparato (con la regla de
`R9-119`, sí).

**Las dos filas que ya dependían del supuesto antes de la sesión, y siguen así (6b y 8).** Son el `logIn` que el
código hace desde siempre cuando una cuenta inicia sesión con el SDK ya configurado. Con el supuesto N, quien
compró siendo anónimo y después entra a una cuenta que ya existía pierde los extras hasta restaurar. No es de esta
sesión y la regla lo pide («otra cuenta en el mismo aparato muestra lo de esa cuenta»), pero es lo mismo que
detuvo a P1 y P2: lo resuelve la misma medición.

## 9. Sin medir en vivo (ni bueno ni malo)

La lista de la 145 (su §11) sigue entera. Lo que agrega o cambia esta sesión:

- Qué hace `logIn(uid)` con las compras del id anónimo, con un uid nuevo y con uno que ya existía. **Decide P1 y
  P2, y con ellas el cierre de `R9-135`.** Es lo primero a medir con la cuenta de prueba.
- Si `onAuthStateChanged` dispara tras `linkWithCredential` (la fila 6b).
- Que un cobro sin entitlement figure en `nonSubscriptionTransactions`, que un pago pendiente no figure, y qué
  queda ahí tras un reembolso (`R9-574`).
- Que `Purchases.isAnonymous()` responda como se leyó, y en qué orden llegan en un arranque real el estado de
  Firebase y el fin de `initialize()` (la 115 midió que Firebase llega antes).
- El ajuste de transferencias del panel de RevenueCat: decide la fila 9 y lo que le pasa al otro aparato.
- Si el toast de `R9-579` se ve con la hoja de donación abierta (el punto 6 de la lista de la 145).
- Los dos textos nuevos de `restoreNotFound`, pintados en el dispositivo (son más largos que los anteriores).

## 10. Lo que no entró

- `R9-575` (el aviso se pierde si la hoja se cierra con la compra en vuelo), `R9-576` (dos toques en el mismo
  cuadro) y `R9-577` (la hoja no reacciona a la entitlement que llega con ella abierta): P3, abiertos.
- El texto opcional de `offering.restoreError` que propuso la 145: no lleva número y no se tocó.

## 11. Archivos de la sesión (`_scratch`)

`S146-gates.sh.txt`; `S146-fix574.cjs.txt`, `S146-fix135.cjs.txt` y `S146-fix579-578.cjs.txt`;
`S146-piezas.cjs.txt` y `S146-piezas135.cjs.txt` (escriben las piezas `S146-rev*.json.txt`);
`S146-reverts574.sh.txt` y `S146-reverts135.sh.txt`, con sus `.out.txt`; las dos sondas y sus matrices (§1);
`S146-sonda.sh.txt`; `S146-propuesta.cjs.txt`; los mensajes de commit `S146-msg*.txt`.
