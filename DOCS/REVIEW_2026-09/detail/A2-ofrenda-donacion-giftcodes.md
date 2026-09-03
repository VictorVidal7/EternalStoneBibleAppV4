# A2 — Ofrenda / Donación / canje de gift codes

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 3 (2026-09-03) · Estado
> **🐛 BUG** (4 P1 + 2 P2: `R9-16`..`R9-21`)
>
> Revisado por un agente en worktree; el orquestador re-verificó a mano `R9-16`, `R9-17`
> y `R9-19`.

## Alcance

`offeringService.ts` (380 L) · `giftCodeService.ts` (204 L) · `entitlementCache.ts` ·
`premiumStore.ts` · `OfferingSheetContext.tsx` · `OfferingSheet.tsx` (~460 L) ·
`DonationSheet.tsx` (~330 L) · `RedeemCodeSheet.tsx` (374 L) · `ExtrasSettings.tsx` ·
**`vercel/gift-code-redeem/api/redeem.ts` (238 L — el backend REAL)** ·
`scripts/generate-gift-codes.js` · `app/(tabs)/settings.tsx` (entrada al canje) ·
`translations.ts` (los textos que ve el usuario).

Últimos cambios de esta ruta (`git log`): `57a7716` (no quemar código si ya hay premium),
`327fc26` (auto-restore en vez de error genérico al recomprar), `7becb2d`
(`NON_SUBSCRIPTION` para donación). Ninguno toca lo de abajo **salvo `327fc26`, que es
precisamente el arreglo que no se replicó a donación** (`R9-19`).

## Cobertura de tests

Buenos y amplios: `offeringService.test.ts` (30 casos), `giftCodeService.test.ts` (15),
`OfferingSheet.test.tsx` (9), `DonationSheet.test.tsx` (6), `RedeemCodeSheet.test.tsx`
(12), `ExtrasSettings`, `DonationSettings`, `premiumStore`, `PremiumContext`.

**Sin cubrir, y de ahí salen casi todos los hallazgos:**

1. **`vercel/gift-code-redeem/api/redeem.ts` no tiene NI UN test.** `jest.config.js` solo
   recoge lo que matchea `testMatch` y ahí no hay nada del backend. Todo el canje real
   —validación de entrada, verificación del token, orden grant→marcar, la transacción, el
   fallo de bookkeeping— está sin red. `giftCodeService.test.ts` mockea `fetch`, así que
   solo prueba el **mapeo** de respuestas, nunca que el servidor las produzca.
2. La rama `alreadyOwned` de `OfferingSheet.handlePurchase` (donde vive `327fc26`) no tiene
   test; el mapeo a nivel de servicio sí.
3. `DonationSheet` no tiene ningún test de `alreadyOwned` (`R9-19`).
4. **No hay test que distinga fallo de red de "no hay compra previa"** en restore — al
   contrario, `offeringService.test.ts:283` y `OfferingSheet.test.tsx:216` **congelan la
   confusión como comportamiento esperado** (`R9-16`).
5. Ningún test de compra-exitosa-sin-entitlement-activo (`R9-17`), de pago pendiente
   (`R9-18`), ni de doble envío en `RedeemCodeSheet`.

---

## 🐛 `R9-16` (P1) — `restore()` confunde "no tienes compra" con "falló la red", y le dice a quien SÍ pagó que su ofrenda no existe

`offeringService.ts:325-331` · `OfferingSheet.tsx:147-158`

El `catch` de `restore()` devuelve `{unlocked: false}` — **el mismo valor exacto** que un
restore correcto que no encontró compras — así que el llamador no puede distinguirlos, y
`handleRestore` mapea `!unlocked` directo a `toast.info(t.offering.restoreNotFound)`.

**Escenario:** alguien que ya dio su ofrenda cambia de teléfono y toca "Restaurar compra"
con señal mala. `restorePurchases()` rechaza por red → `restore()` traga la excepción →
la app le afirma, en indicativo, **«No encontramos una ofrenda anterior en esta cuenta.»**
(`translations.ts:4497`). El resultado esperable es que pague otra vez, o que pida
reembolso. No hay autocorrección: `handleCustomerInfo` tampoco corrió.

El mismo defecto contamina la rama `alreadyOwned` de `handlePurchase`
(`OfferingSheet.tsx:130-138`): si Play dice ITEM_ALREADY_OWNED y el `restoreOffering()`
que sigue falla por red, cae al `else` y sale `purchaseError`, cuando la compra existe y
está bien.

**Arreglo (no aplicado):** que `restore()` devuelva tres estados
(`{status:'unlocked'|'none'|'failed'}`, o `{unlocked, failed}` para no romper llamadores) y
que `handleRestore` use un **string nuevo** para `failed` («No pudimos verificarlo ahora,
revisa tu conexión»), no `purchaseError`.

---

## 🐛 `R9-17` (P1) — `purchaseUnlock` declara `success` sin comprobar que el entitlement quedó activo: cobrado, agradecido y bloqueado

`offeringService.ts:292-298` · `OfferingSheet.tsx:118-121`

Tras `Purchases.purchasePackage(pkg)` devuelve `{status:'success'}` **incondicionalmente**;
nunca evalúa `isEntitlementActive(customerInfo)` sobre el `CustomerInfo` que acaba de
recibir — **aunque `restore()` (`:324`) sí hace exactamente esa comprobación sobre el mismo
dato**. La asimetría entre las dos funciones es el olor.

**Escenario:** el `CustomerInfo` de una compra correcta puede no traer aún
`entitlements.active['extras']` — lo más plausible es un mapping producto↔entitlement mal
configurado en el dashboard (un tier añadido a la oferta `default` pero no adjuntado a
`extras`), y también una propagación lenta del recibo. Entonces: Play cobra →
`purchaseUnlock` devuelve `success` → `handleCustomerInfo` calcula `unlocked = false`, que
coincide con `lastKnownUnlocked`, así que **corta en `:121`** → la hoja muestra «Gracias
por sembrar en esta obra» → **todo sigue bloqueado**. Sin ruta de auto-reparación: la única
salida es que el usuario adivine que debe tocar "Restaurar". Es el caso de **cobrar sin
conceder**, el peor de esta fila.

(La salida temprana de `:121` es `R9-9`, de `A1`. Aquí se cita como mecanismo; lo nuevo es
que `purchaseUnlock` no valida su propio resultado.)

**Arreglo (no aplicado):** devolver `isEntitlementActive(customerInfo) ? success :
{status:'grantPending'}` y que la hoja, en `grantPending`, intente `refreshEntitlement()`
una vez y muestre un mensaje honesto («Tu pago se registró; estamos confirmando el
acceso») en vez de afirmar que ya está desbloqueado.

---

## 🐛 `R9-18` (P1) — `outcomeFromError` no contempla el pago PENDIENTE: a quien paga en efectivo (OXXO/SPEI) se le dice que la ofrenda falló

`offeringService.ts:84-87` (el tipo declarado a mano) y `:261-282` (el mapeo)

`PURCHASES_ERROR_CODE` solo declara dos códigos y `outcomeFromError` solo mapea esos dos;
**todo lo demás cae al `{status:'error'}` genérico**. Como el tipo es una declaración
local, TypeScript no avisa de que faltan códigos.

**Escenario:** app español-primero con México como mercado principal, donde el pago en
efectivo/ventanilla de Google Play es una forma de pago de primer orden y termina en una
transacción **pendiente**. Hoy: la persona completa el flujo y recibe su referencia de pago
→ la promesa rechaza con el código de pendiente → `{status:'error'}` → la hoja muestra «No
se pudo completar la ofrenda. Inténtalo de nuevo.» (`translations.ts:4500`) y la devuelve
al selector. **Le decimos que falló algo que no falló, y le pedimos que lo repita** — si
obedece, acaba con dos pagos en curso. Horas después el pago se acredita y el desbloqueo
aparece sin explicación. Igual en `DonationSheet.handlePurchase:93-96`.

**Arreglo (no aplicado):** añadir `PAYMENT_PENDING_ERROR` al tipo y una variante
`{status:'pending'}` con su propio estado en ambas hojas.

**Pendiente de verificar** (no ejecutable en worktree): el nombre exacto del miembro del
enum en la versión instalada —
`grep -n "PAYMENT_PENDING" node_modules/react-native-purchases/dist/index.d.ts`. El
hallazgo (que solo se mapean 2 de N códigos y el resto se presenta como fallo) no depende
de esa confirmación.

---

## 🐛 `R9-19` (P1) — `DonationSheet` nunca maneja `alreadyOwned`: el arreglo `327fc26` se hizo solo en la ofrenda

`DonationSheet.tsx:82-99` (el `else` de `:93`) contra `OfferingSheet.tsx:125-138`

`purchaseDonation` comparte `outcomeFromError` con `purchaseUnlock` (`:313`), así que
**puede** devolver `alreadyOwned` — `offeringService.test.ts:222` afirma ese mapeo. Pero
`DonationSheet` solo ramifica en `success` y `cancelled`. **Verificado a mano:**
`grep -rn "alreadyOwned"` sobre `src/` + `app/` devuelve **un solo** consumidor,
`OfferingSheet.tsx:125`.

**Escenario:** los `donacion_1..4` son productos únicos (`NON_SUBSCRIPTION`, `:248-251`),
o sea consumibles. Si una donación se paga pero su recibo no llega a liquidarse (el usuario
mata la app o pierde red justo después del cobro), la compra queda sin consumir en Play. A
partir de ahí **cada** intento de volver a dar ese mismo importe devuelve ITEM_ALREADY_OWNED
→ `else` → toast rojo «No se pudo completar la donación. Inténtalo de nuevo.», **para
siempre**. Y `DonationSheet`, a diferencia de `OfferingSheet`, **no tiene enlace de
restaurar ni ninguna otra salida**: el tier queda muerto para esa persona después de que ya
se le cobró una vez. Le pasa justo al donante recurrente, que es el perfil que esta hoja
busca.

**Arreglo (no aplicado):** ramificar `alreadyOwned` con un mensaje honesto y disparar la
re-sincronización que destraba el consumible (exponer `Purchases.syncPurchases()` desde
`offeringService` — hoy ni está en el tipo `PurchasesStatic`).

---

## 🐛 `R9-20` (P2) — el endpoint de canje no valida la forma del código antes de gastar Auth+Firestore, y mete la entrada cruda como id de documento

`vercel/gift-code-redeem/api/redeem.ts:114-121` y `:159`

Solo se comprueba `typeof rawCode === 'string'` y que no quede vacío tras `trim()`. No hay
validación contra el charset real del generador
(`scripts/generate-gift-codes.js:53-56`: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, formato
`XXXX-XXXX`), ni límite de longitud, ni rate limit. Y en `:159` esa cadena arbitraria va
directa a `db.collection('giftCodes').doc(code)`.

**(a) 500 donde tocaba un 400:** `{"code": "AB/CD"}` produce la ruta `giftCodes/AB/CD` (3
segmentos = ruta de colección) y el Admin SDK lanza → HTTP 500 `server_error` → el cliente
lo mapea al `default` → toast genérico. Un código malformado se presenta como avería del
servidor en vez de "código no válido". Igual con ids reservados (`__algo__`) o `.`/`..`.

**(b) el que sí cuesta:** cada POST basura consume un `verifyIdToken()`, una lectura de
Firestore y una invocación de Vercel **antes** de mirar si la cadena podía ser un código.
Cualquiera obtiene un ID token válido: basta registrarse. La cabecera del propio fichero
(`:5-11`) explica que se eligió Vercel Hobby porque tiene **tope duro sin facturación por
exceso** — o sea, el modo de fallo elegido a propósito es _"el despliegue se pausa hasta el
siguiente ciclo"_. Unas decenas de miles de POST basura dejan el canje **fuera de
servicio**, y quien tenga un código legítimo no puede usarlo. Un regex de una línea rechaza
casi todo eso antes de tocar Auth o Firestore.

**Para que conste: la fuerza bruta contra un código real NO es la preocupación** — 31⁸ ≈
8,5·10¹¹ lo hace inviable. El problema es el coste por petición en una plataforma cuyo
límite es una pausa del servicio.

**Arreglo (no aplicado):** validar contra
`/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[…]{4}$/` **antes** del `verifyIdToken` y de la
lectura, devolviendo 400.

---

## 🐛 `R9-21` (P2) — cuando el grant funciona pero falla el marcado, el código vuelve a la piscina en silencio

`vercel/gift-code-redeem/api/redeem.ts:189-213`

Si la transacción de marcado falla, se registra por `console.error` y se devuelve 200
`success`. Decirle "éxito" al usuario **es correcto** (sí recibió el entitlement), pero el
documento queda con `redeemed: false` y **sin ningún rastro accionable**.

**Escenario:** Firestore devuelve un `UNAVAILABLE` transitorio. El usuario A recibe premium
vitalicio; el código sigue figurando como no canjeado —`generate-gift-codes.js list` lo
muestra disponible— así que si estaba en un grupo de WhatsApp, el usuario B lo canjea
después y recibe un **segundo** entitlement vitalicio por un único código. La recuperación
depende por completo de que alguien mire el log de Vercel en el momento adecuado: no hay
alerta, ni cola de reintentos, ni campo de estado barrible.

Es un agujero **distinto** de la carrera de dos canjes concurrentes, que sí está
documentada y aceptada a propósito en `functions/src/index.ts:25-32`.

**Defecto de documentación adjunto:** el comentario de `redeem.ts:194-196` remite a _"see
file header's accepted tradeoff"_, pero la cabecera de **este** fichero (`:1-22`) no
contiene ese párrafo: el tradeoff solo está escrito en `functions/src/index.ts`, o sea en la
copia que ese mismo archivo describe como **no desplegada**. Quien lea el fichero que de
verdad corre en producción sigue un **puntero colgante**.

**Arreglo (no aplicado):** copiar el párrafo del tradeoff a la cabecera de `redeem.ts`; y
en el `catch`, escribir una compensación en `giftCodeRepairs/{code}` (uid + timestamp) para
que un código huérfano sea detectable sin leer logs. No cambiar el 200 al usuario.

---

## ✅ Verificado OK

- **La entrada al canje está bien cerrada.** El row vive dentro de
  `{user && !user.isAnonymous ? (…)}` (`settings.tsx:535`, row en `:660-683`) y el servidor
  **re-verifica** el proveedor de sign-in (`redeem.ts:148-156`) en vez de confiar en el
  cliente. Doble gate.
- **No se quema un código en quien ya tiene premium** (`RedeemCodeSheet.tsx:153-161`,
  arreglo `57a7716`), con test.
- **El orden grant → marcar-canjeado es el correcto** para la prioridad declarada, y el
  fallo del grant devuelve 500 sin tocar el documento (`:169-187`), con mensaje que dice que
  se puede reintentar. El grant es **idempotente** para el mismo uid (upsert por
  subscriber+entitlement).
- **La transacción respeta al ganador de la carrera** (`:190-203`): relee dentro de la
  transacción y no pisa un `redeemed: true` ajeno.
- **No hay botón de compra pulsable dos veces:** la fila de tiers solo se renderiza con
  `state.kind === 'available'` (`OfferingSheet:330`, `DonationSheet:209`), y el enlace de
  restaurar lleva `disabled` (`:375`).
- **El toggle de premium manual no puede filtrarse a producción:** `ExtrasSettings.tsx:126`
  lo envuelve en `__DEV__` y `PremiumContext.setPremium` corta con `if (!__DEV__)`.
  `setPremiumUnlocked` solo escribe la caché local y **nunca crea un entitlement real**.
- **La clave secreta de RevenueCat no está en el cliente:** el `sk_` solo se lee de
  `process.env.REVENUECAT_SECRET_KEY` en el backend (`:220`), y su ausencia se detecta antes
  de procesar nada.
- **La donación nunca concede entitlement:** `purchaseDonation` no llama a
  `handleCustomerInfo` (`:309-311`), con test explícito.
- **El error de red del canje sí se le muestra al usuario** (`giftCodeService.ts:166-173`).
- **La heurística de portapapeles es estricta a propósito** (`RedeemCodeSheet.tsx:71-72`,
  `:128-129`: prueba el texto **crudo** contra `CODE_SHAPE`), con tests del falso positivo
  de una URL pegada.

## Dudas

1. **`GRANT_DURATION = 'lifetime'` sigue marcado como suposición NO verificada en el propio
   fichero desplegado** (`redeem.ts:50-55`: _"verify the real 'ofrenda' packages actually
   grant a lifetime entitlement before distributing real codes"_). Por memoria del proyecto,
   la 48ª sesión hizo un canje real end-to-end, así que probablemente ya esté verificado de
   hecho, pero no está escrito. **Pregunta directa para Victor: ¿los tres packages de
   `default` conceden `extras` de forma vitalicia?** Si no, los códigos regalados y las
   ofrendas pagadas darían accesos de duración distinta.
2. **Doble envío en `RedeemCodeSheet`, muy difícil de disparar.** El guard
   `if (!trimmed || submitting) return` (`:152`) lee `submitting` del closure del último
   render, y el `Pressable` está `disabled` por estado — pero `onSubmitEditing` (`:262`)
   llama a `handleSubmit` sin `disabled` propio. Ventana de menos de un frame y daño acotado
   (el grant al mismo uid es idempotente). No se lista como hallazgo; se anota porque es la
   vía _cliente_ de llegar a la lectura no transaccional de `:160`.
3. **El servidor no normaliza mayúsculas** (`:115` solo hace `trim()`, y los ids de Firestore
   distinguen mayúsculas). Hoy no afecta porque la app siempre envía mayúsculas, pero
   cualquier otro cliente (o un futuro deep-link) recibiría 404 con un código válido. Un
   `.toUpperCase()` lo cierra.
4. **`R9-19` depende de un supuesto sobre RevenueCat** (que consume los productos únicos por
   defecto y que ese consumo puede quedar a medias). El hueco de código es cierto e
   independiente; el mecanismo que lo dispara no se pudo verificar sin dispositivo.
