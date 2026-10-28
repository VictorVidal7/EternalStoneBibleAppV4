# C55 — Canje de gift-code, redención real (Modo C, sesión 115)

**Estado: PENDIENTE — el canje real, «sin medir» por decisión de Victor en la 115.** Agente 3,
`emulator-5558`. El entorno de la 115, en `detail/C15-hoja-ofrenda.md`.

## Por qué no se midió

El canje exige una cuenta NO anónima, en la app y en el servidor:

- la fila «Canjear código» solo existe con `user && !user.isAnonymous` (`app/(tabs)/settings.tsx:541`, la fila
  en `:697`); con la cuenta anónima, Cuenta muestra solo «Iniciar sesión con Google», con el toggle de dev
  apagado y encendido, y no hay otra entrada a `RedeemCodeSheet`;
- `vercel/gift-code-redeem/api/redeem.ts:148` rechaza los tokens anónimos (por lectura).

La única cuenta de Google del AVD es la real de Victor. **Victor decidió dejarla sin medir** (no iniciar
sesión con su cuenta; no se generó ningún código).

**Para cerrarla (la receta para otra sesión):** una cuenta de Google de PRUEBA, no la de Victor, agregada por
él en una instancia de solo lectura (Ajustes del sistema → Cuentas; se descarta al apagar); la app inicia
sesión con ella; un código con `scripts/generate-gift-codes.js`; y los errores de la hoja (vacío, malformado,
inexistente, sin red, toques repetidos), el canje real, el re-canje del código usado y la hoja con premium.

## Lo que sí se midió

- **`R9-135`, premisa confirmada en el dispositivo (suma a esa entrada):** tras dos arranques en frío el
  usuario de RevenueCat sigue siendo `$RCAnonymousID`, nunca el uid de Firebase.
- **El endpoint de producción, sin token** (no consume códigos ni crea cuentas): GET → 400; sin código o con
  solo espacios → 400 «Missing code»; sin token → 401; token basura → 401; el primer arranque en frío de
  Vercel tardó 6,3 s.
- Dato de `C15`: la app arrancó free; RevenueCat publicó al arrancar un token bajo un `$RCAnonymousID` con
  `entitlements:{}`.

Evidencia: `_scratch/S115-sondas-agente-3/`.

---

## Informe del agente 3 (tal cual)

## S115 — agente 3 — `C55` (canje de gift-code, redención real) — emulator-5558

Worktree en `d34bd4d`. Instancia de solo lectura de `Pixel_9_Pro`, APK debug vc73, Metro del principal.
Uid ANÓNIMO de Firebase de la instancia: `PAUSvcSiKjO1FeRYKrznPCmtV9w2` (clave `GET_TOKEN_RESPONSE.<uid>` del
store de Auth). Usuario de RevenueCat de la instancia: `$RCAnonymousID:9e2a59b70d304a068a08f06fbc4f62f1`.
**No se generó ningún código** (`scripts/generate-gift-codes.js` NO se corrió): ver el veredicto.

### Veredicto de `C55`: «sin medir» el canje real — la fila sigue PENDIENTE (o EN CURSO)

El canje EXIGE una cuenta no anónima, en los dos lados, y la regla de la 115 prohíbe iniciar sesión con
Google en la app (la cuenta del AVD es la real de Victor). Por la regla del prompt («si el canje exige una
cuenta no anónima, pará ahí, sin generar el código»), el canje real, el re-canje del código usado, los
errores de la hoja (vacío, malformado, inexistente, espacios/minúsculas, sin red, toques repetidos) y la hoja
con premium encendido quedan **sin medir**: la hoja `RedeemCodeSheet` no es alcanzable para un anónimo.

- Cliente: la fila «Canjear código» vive dentro de la rama `user && !user.isAnonymous`
  (`app/(tabs)/settings.tsx:541`, la fila en `:697-718`, comentario `:690-696`). **Visto en el dispositivo:**
  en Ajustes → Cuenta el anónimo solo ve «Inicia sesión para sincronizar…» + «Iniciar sesión con Google», sin
  fila de canje, con el toggle de dev APAGADO (captura `S115-a3-02-ajustes-anonimo-sin-canje.png`) y
  ENCENDIDO (`S115-a3-07-premium-dev-cuenta-sin-canje.png`). En el dump, 0 nodos con «canje|redeem|código de
  regalo». No hay otra entrada (grep: `RedeemCodeSheet` solo se monta en `settings.tsx:912`).
- Servidor: `vercel/gift-code-redeem/api/redeem.ts:146-156` devuelve 401 `invalid_token` «Anonymous accounts
  cannot redeem gift codes» si `sign_in_provider === 'anonymous'` (por lectura; el token de la instancia no se
  pudo leer: el store de Firebase Auth está CIFRADO, `FIREBASE_USER = ENCRYPTED:…`, y no se creó otra cuenta
  para medirlo). La copia local del store se borró.

**Para cerrarlo hace falta una decisión de Victor:** una cuenta de Google de prueba (no la suya) iniciada en
el AVD, o hacer el canje en un dispositivo ya autenticado como él (como en la sesión 48, `UBDD-2HV3`).

### Lo que sí se midió

#### 1. Primer arranque, toggle APAGADO, sin tocar nada (dato de `C15`)

- La app **NO** se ve premium: Ajustes → Extras muestra «Algunas funciones adicionales se pueden desbloquear
  con una ofrenda voluntaria.» + «Desbloquear con premium»; el switch «Extras desbloqueados (solo desarrollo)»
  con `checked="false"` (captura `S115-a3-02-…png`; onboarding hecho: Español, RVR1960, tema por defecto).
- **Pero el SDK de RevenueCat SÍ publicó una compra de la cuenta de Google al arrancar:** la caché de RevenueCat
  (`run-as … cat shared_prefs/com_revenuecat_purchases_preferences.xml`, copia en
  `S115-a3-04-rc-prefs.xml.txt`) tiene `tokensV2 = {"QLcOkLsIXCtAWLgUbpiDLjmTImg=":{"isAutoRenewing":false}}`:
  UN token no renovable (la ofrenda de Victor) marcado como enviado tras `pm clear` + un arranque, sin tocar
  nada. El `customerInfo` cacheado de ese usuario: `entitlements:{}`, `non_subscriptions:{}`,
  `other_purchases:{}`, `first_seen 2026-10-28T17:47:44Z`. O sea: la compra se publicó bajo
  `$RCAnonymousID:9e2a…` y NO le dio el derecho (compatible con un proyecto en «Keep with original App User ID»,
  o con un `customerInfo` leído antes del post; no se puede distinguir desde el cliente). Igual tras un 2.º
  arranque en frío (`S115-a3-08-rc-prefs-2do-arranque.xml.txt`, `request_date 17:53:08Z`, `entitlements:{}`).
  Si el derecho de Victor se movió en el servidor, solo lo dice el panel de RevenueCat o su teléfono.
- Logcat (`S115-a3-03-revenuecat-arranque.logcat.txt`, filtrado): solo WARN/INFO del SDK por el log handler
  (`offeringService.ts:181-185`): «Could not resolve remote config blob(s)… ui_config» y «Product not found:
  ofrenda_1/2/3 - Product Type: subs» (el SDK prueba primero como suscripción; normal para productos de pago
  único). El post del token no se loguea a ese nivel. El buffer trae líneas viejas del 09-22 del AVD: solo
  cuentan las `10-28`.

#### 2. `R9-135`: su premisa, CONFIRMADA en el dispositivo (suma a `R9-135`, no es nuevo)

`R9-135` (PLAUSIBLE, por lectura) dice que el `linkUser` del arranque en frío se descarta porque
`onAuthStateChanged` llega antes de que `initializeOffering()` configure el SDK (`linkUser` hace `return` con
`!configured`, `offeringService.ts:224-226`; la llamada en `AuthContext.tsx:370-372`; `initializeOffering` en
`app/_layout.tsx:251`). **Medido:** tras el 1.er arranque y tras un 2.º arranque en frío, el usuario actual de
RevenueCat (`…goog_….new`) sigue siendo `$RCAnonymousID:9e2a…`, nunca el uid de Firebase
`PAUSvcSiKjO1FeRYKrznPCmtV9w2`. Es decir, en esta instalación el `logIn(uid)` no ocurrió NUNCA.
Lo que eso implica para `C55` (por lectura, sin medir): el canje concede el derecho al uid de Firebase y
`giftCodeService.ts:185-201` re-ata con `linkUser(uid)` tras un canje exitoso, así que en el momento del canje
se corrige solo; RevenueCat persiste el último `logIn`, así que los arranques siguientes quedan atados. Lo que
NO cubre: las compras de un anónimo en una instalación nueva quedan bajo `$RCAnonymousID`, no bajo su uid (dato
para `C15`). Severidad: la de `R9-135`; no la re-severizo.

#### 3. El endpoint de producción, caminos sin token (no consume códigos, no crea cuentas, no toca Firestore)

`S115-a3-06-servidor.out.txt` (`https://essb-gift-redeem.vercel.app/api/redeem`):

- `GET` → 400 `invalid_request` «POST required» (6317 ms: arranque en frío de Vercel)
- `POST {}` → 400 «Missing "code" in body»; `POST {"code":"   "}` → 400 igual (el servidor hace `trim`)
- `POST {"code":"ZZZZ-S115"}` sin `Authorization` → 401 `invalid_token` «Missing Authorization…»
- con `Bearer basura.no.jwt` → 401 `invalid_token` «Invalid or expired token»
  El cliente mapea `invalid_request` e `invalid_token` al mismo `invalid` (`giftCodeService.ts:103-108`). El
  endpoint está vivo. `R9-40` (el `fetch` sin timeout, `giftCodeService.ts:158`) no se re-midió: sin hoja.

#### 4. Premium (toggle de dev) en los dos sentidos

- ENCENDIDO: Extras pasa a «Extras desbloqueados / Gracias por tu ofrenda. Toca para ver todo lo que incluye.»;
  la sección Cuenta NO cambia (sigue sin fila de canje). Captura `S115-a3-07-…png`.
- APAGADO otra vez: vuelve «Desbloquear con premium». La hoja de canje con premium encendido (el chequeo
  `usePremium().isPremium` de `RedeemCodeSheet.tsx` antes de llamar al servidor) queda sin medir: no alcanzable.

### Hallazgos provisionales

Ninguno nuevo. `R9-135`: premisa confirmada en el dispositivo (evidencia arriba, §2). Dato para `C15`: el SDK
publica la compra de la cuenta de Google en el primer arranque, sin «Restaurar», bajo `$RCAnonymousID`, sin
otorgar el derecho a ese id (§1).

### Archivos

`S115-a3-01-primer-arranque.png` (onboarding en inglés: el locale del AVD), `S115-a3-01-primer-arranque.logcat.txt`,
`S115-a3-02-ajustes-anonimo-sin-canje.png`, `S115-a3-03-revenuecat-arranque.logcat.txt`,
`S115-a3-04-rc-prefs.xml.txt`, `S115-a3-06-servidor.out.txt`, `S115-a3-07-premium-dev-cuenta-sin-canje.png`,
`S115-a3-07-toggle-on.logcat.txt` (vacío: el toggle no loguea), `S115-a3-08-rc-prefs-2do-arranque.xml.txt`,
`S115-a3-08-segundo-arranque.logcat.txt`; scripts `S115-a3-ui.cjs.txt`, `S115-a3-buscar.cjs.txt`,
`S115-a3-servidor.cjs.txt`. Estado final del emulador: app en Ajustes, toggle APAGADO, sin sesión de Google.
