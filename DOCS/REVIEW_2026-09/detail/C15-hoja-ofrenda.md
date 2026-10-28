# C15 — Hoja de ofrenda: copy, apertura, compra (Modo C, sesión 115)

**Estado: 🐛 BUG (P2), ninguno P0.** Agente 1, `emulator-5554`.

## El entorno de la 115 (vale para todas las filas C de esta sesión)

- Instancias de SOLO LECTURA (`-read-only`) del AVD `Pixel_9_Pro` (Android 16, Play Store), con el APK DEBUG
  vc73 / 3.2.61 ya instalado (desde vc73 no cambió nada nativo), Metro en el principal (`main` = `d34bd4d`).
  Cada instancia, con `pm clear` de la app antes de empezar: onboarding y una cuenta ANÓNIMA nueva de Firebase.
- **La cuenta de Google del AVD es la REAL de Victor** (`victorvdu@gmail.com`), que ya compró la ofrenda.
- **Decidido por Victor en la 115:** las compras paran en el diálogo de Play (nunca se confirma); «Restaurar»
  solo lo toca este agente, una vez; nadie inicia sesión con Google en la app.

## Hallazgo

- **`S115-a1-H1` = `R9-418` (P2):** la hoja se sale de la pantalla por arriba y no tiene scroll: con letra
  normal no se ven el título «Una ofrenda voluntaria» ni el comienzo de la intro.

## La restauración (la única permitida), y lo que dejó

- Al tocar MX$17.00, Play no mostró el diálogo de compra sino «You already own this item» (la cuenta de
  Google ya tiene `ofrenda_1`). Se cerró con atrás, sin confirmar nada, y **la app llamó sola a `restore()`**
  por el camino `alreadyOwned` (`src/components/offering/OfferingSheet.tsx:125-138`). RevenueCat le dio
  `extras` al uid anónimo del emulador (orden `GPA.3313-5368-7101-19010`). No es un bug: es el diseño
  (comprar lo ya comprado restaura), pero con una cuenta de Google compartida mueve el derecho al uid que
  esté en la app.
- **Lo que midieron los demás agentes alrededor** (dato de esta fila):
  - Antes de esa restauración, en una instalación nueva el SDK publica al arrancar el token de la cuenta de
    Google bajo un `$RCAnonymousID`, con `entitlements:{}` (agente 3; agentes 2 y 4: la app arranca free).
  - **Después**, cada instalación nueva con esa cuenta de Google arranca PREMIUM sola: la caché de
    RevenueCat da `extras` (`ofrenda_1`) al `$RCAnonymousID` nuevo, con `original_app_user_id` otro
    `$RCAnonymousID` (agente 6). Desde el cliente no se distingue si el derecho del uid real de Victor se
    TRANSFIRIÓ o se comparte; lo dice el panel de RevenueCat o su teléfono («Restaurar mi ofrenda anterior»
    lo devuelve).

## Sin medir

- La compra confirmada y su cancelación en el diálogo real (hace falta una cuenta de Google sin la ofrenda).
- El enlace «Restaurar» como botón (su efecto quedó medido por el otro camino).
- El copy en inglés en el dispositivo (en el código, los mismos 7 extras) y la letra grande.

Evidencia: `_scratch/S115-sondas-agente-1/` (capturas, logcat, dumps).

---

## Informe del agente 1 (tal cual; los números provisionales arriba)

## S115 — agente 1 — `C15` (hoja de ofrenda: copy, apertura, compra) — emulator-5554

Base: worktree en `d34bd4d` (verificado). Informe incremental.

### Estado y veredicto

- **`C15` → 🐛 BUG (P2): `S115-a1-H1`** (la hoja se corta por arriba, sin scroll). Lo demás medido, OK.
  Sin P0.
- **Restaurar:** ocurrió UNA vez, por el camino `alreadyOwned` (no por el enlace), y dejó la app premium
  con `extras` en el uid anónimo (ver §3). El enlace no se tocó.
- Sin medir: ver la lista al final.

### Mapa de código (hoy)

- La hoja: `src/components/offering/OfferingSheet.tsx` (496 líneas). Estados `loading` / `unavailable`
  (devuelve `null` y cierra el contexto, `:207-215`) / `alreadyUnlocked` / `available` / `purchasing` /
  `restoring` / `success`. `load()` `:70-93`: si `isPremium` → `alreadyUnlocked`; si no, `isBillingAvailable()`
  y `getUnlockPackages()`, ordenados de menor a mayor precio (`:89-91`).
- Compra: `handlePurchase` `:114-145` → `purchaseUnlock` (`offeringService.ts:286-298`). `cancelled` → vuelve
  al selector (`load()`); `alreadyOwned` → **llama a `restoreOffering()` sola** (`:125-138`); otro error →
  toast `purchaseError` y `load()`.
- Restaurar: `handleRestore` `:147-158` → `restore()` (`offeringService.ts:336-350`): `restorePurchases()`;
  en el `catch`, `{unlocked:false}` = «No encontramos una ofrenda anterior» (ya es `R9-16`).
- Cierre: `Modal onRequestClose={handleClose}` (`:222`) y el fondo (`:224-228`) cierran en CUALQUIER estado,
  también `purchasing`/`restoring`.
- Sin `ScrollView`: título + intro (4 renglones) + 7 extras + niveles + leyenda (2 párrafos) + transparencia +
  enlace, dentro de un `View` con `justifyContent: 'flex-end'` (`:396-411`). Candidato: con letra grande se
  corta arriba. A medir con `font_scale`.
- RevenueCat: `initialize()` (`offeringService.ts:155-203`) configura SIN `appUserID` (anónimo de RC) y luego
  `linkUser(uid)` hace `Purchases.logIn(uid)` (`:224-238`); `linkUser` es no-op si todavía no está
  configurado (ya es `R9-135`: en frío `onAuthStateChanged` llega antes).
- Premium: `PremiumContext.tsx`. El toggle de dev escribe la MISMA caché (`premiumStore.ts` →
  `setCachedEntitlement`); la primera respuesta de RevenueCat de cada proceso siempre se propaga (`R9-9`,
  `offeringService.ts:134-140`), así que pisa el toggle en cada arranque en frío (solo dev; a confirmar).
- Copy: `src/i18n/translations.ts:4473-4532` (es) y `:11018-11075` (en).

### Puntos de entrada de la hoja (`useOfferingSheet().open`): 45 archivos

- Ajustes → «Extras» (`src/components/settings/ExtrasSettings.tsx:72-121`: la tarjeta y el CTA «Desbloquear
  con premium»; premium: la tarjeta abre la hoja en `alreadyUnlocked`).
- Ajustes → tema de color (`ColorThemeSettings.tsx:81`), lector → preferencias (`ReaderPreferencesSheet.tsx:414,510`),
  idiomas originales (`OriginalLanguagesSheet.tsx:211,362`), word-study (`word-study.tsx:544`), diccionario
  (`dictionary/[slug].tsx:306`), memoria (`memory/insights.tsx:463,714,752,771`), quiz (`quiz/index.tsx:237,245`,
  `quiz/stats.tsx:99`), compartir imagen (`ImageShareModal.tsx:143,264,278,739,894` y los 13 modales de imagen
  con `onLockedAction`), la Mesa (`prep/index.tsx`, `history`, `series`, `illustrations`, `pulpit`).
- Los de la Mesa y los de fuera son de `C16`/`C56`; acá se prueban la hoja misma y una muestra de entradas.

### Ya reportados que tocan C15 (no se reportan de nuevo)

`R9-9`/`R9-10` (arreglados), `R9-16` (restaurar: red = «no encontramos»), `R9-17` (success sin entitlement),
`R9-18` (pago pendiente OXXO/SPEI = error), `R9-19` (donación sin `alreadyOwned`), `R9-135` (`linkUser` en frío),
`R9-119` (cerrar sesión quita el premium).

### Mediciones en el dispositivo (emulator-5554, instancia nueva tras el rearranque; cuenta anónima nueva)

#### Entorno (no son de la app)

- 1.er intento: «Unable to load script» (la app arrancó antes que el reverse/Metro). Arranque en frío: ok.
- 17:59:22 el sistema MATÓ la app: `am_kill ... stop com.google.android.webview due to installPackageLI`
  (Play actualizó WebView en la instancia recién creada). Entorno, no app.
- En DEBUG, `bible.db` se baja de Metro (`resolveBibleSeedDbAsset`, `database/index.ts:306-330`); con 4
  emuladores sobre un Metro tardó ~5 min en «Preparing...». Entorno.

#### 1. Primer arranque, toggle APAGADO, sin tocar nada → FREE

- Ajustes → «Extras de la app» + «Desbloquear con premium»; toggle de dev `checked="false"`
  (`S115-a1-08-ajustes-extras-free.png`, `S115-a1-08.xml.txt`).
- Logcat (`S115-a1-01-arranque.logcat.txt`): RevenueCat solo trae los productos (`ofrenda_1..3` probados
  primero como `subs`, «PRODUCT_NOT_FOUND»: es su búsqueda normal subs→inapp). **Nada de premium al
  arrancar**: el SDK NO le dio la ofrenda de Victor al uid anónimo por sí solo. (El nivel de log de RevenueCat
  es INFO: no se ven sus `POST` de recibos; el dato es lo que muestra la app.)
- Onboarding: el paso de tema filtra los temas premium (`OnboardingScreen.tsx:395-398`): OK.

#### 2. Apertura desde Ajustes → «Desbloquear con premium» (free)

- Abre y trae el selector REAL: MX$17.00 / MX$49.00 / MX$119.00, de menor a mayor, sin cortes de texto en los
  niveles; leyenda, transparencia y «Restaurar mi ofrenda anterior» visibles. Copy en español =
  `translations.ts:4473-4532` (7 extras; el inglés también trae 7).
- **🐛 S115-a1-H1 (P2, propuesto) — la hoja de ofrenda se sale por ARRIBA y no se puede desplazar: no se ven
  el título «Una ofrenda voluntaria» ni el comienzo de la intro («…como una ofrenda en la iglesia, no una
  compra…»), con letra normal y en un teléfono GRANDE (Pixel 9 Pro, 1280x2856).**
  - `OfferingSheet.tsx:217-389`: sin `ScrollView`; el contenido (título, intro de 4 renglones, 7 extras,
    niveles, leyenda de 2 párrafos, transparencia, enlace) va en un `View` dentro de un fondo con
    `justifyContent: 'flex-end'` (`:396-400`), así que lo que sobra se corta por arriba.
  - Repro: instalación limpia, onboarding en español, Ajustes → «Desbloquear con premium». Captura
    `S115-a1-09b-hoja-ajustes.png`: la pantalla empieza a media intro («todo lo demás siguen siendo…»).
    Dump `S115-a1-09c.xml.txt`: el nodo del título NO existe (fuera de pantalla) y la intro está en
    `[72,0][1208,122]`; un swipe hacia abajo no mueve nada (mismas posiciones).
  - En `purchasing` (spinner «Procesando…») se corta todavía más: tampoco se ve «Esto es lo que se
    desbloquea:» (`S115-a1-10-dialogo-play.png`).
  - El estado `alreadyUnlocked` entra justo (`S115-a1-13-ya-desbloqueado.png`). En un teléfono común (más
    bajo) o con letra grande, peor. No toca dinero (los niveles y Restaurar quedan abajo, visibles); es el
    encuadre de la ofrenda lo que no se lee. No está en `BUGS.md` (grep `OfferingSheet`/`ScrollView`); la
    revisión Fable no pudo ver la hoja en su emulador (fila 15).

#### 3. Elegir un nivel (MX$17.00) → diálogo de Play

- Play NO muestra el diálogo de compra: muestra **«Error — You already own this item.»** (la cuenta de
  Google del AVD, la de Victor, ya tiene `ofrenda_1` sin consumir), con la hoja detrás en «Procesando…»
  (`S115-a1-10-dialogo-play.png`).
- Lo cerré con ATRÁS (nunca se confirmó nada). Logcat (`S115-a1-10-compra-yaPoseido.logcat.txt`, 18:06:08):
  `ITEM_ALREADY_OWNED` → `PurchasesError(code=ProductAlreadyPurchasedError…)` → «Purchase history
  retrieved productIds: [ofrenda_1], orderId: GPA.3313-…» (token omitido acá).
- La app tomó el camino `alreadyOwned` (`OfferingSheet.tsx:125-138`) y llamó SOLA a `restore()`:
  **la app quedó PREMIUM** — la hoja pasó a «Gracias por sembrar en esta obra» (`S115-a1-11-tras-atras.png`)
  y Ajustes a «Extras desbloqueados · Gracias por tu ofrenda» con el toggle de dev en ON (lo pinta
  `isPremium`) (`S115-a1-12.xml.txt`). Es el comportamiento diseñado (`327fc26`): no es hallazgo.
- **Esto FUE la única restauración de la sesión** (decidida por Victor: agente 1, una vez). Por eso el enlace
  «Restaurar mi ofrenda anterior» NO se tocó después: queda «sin medir» como botón, pero su efecto
  (`restorePurchases` → `handleCustomerInfo`) ya se midió por este camino.
- **⚠️ Para Victor:** su compra de `ofrenda_1` (orden `GPA.3313-5368-7101-19010`) quedó publicada en
  RevenueCat bajo el uid ANÓNIMO de esta instancia, y RevenueCat le dio `extras` a ese uid. Desde el cliente
  no se ve si el derecho se TRANSFIRIÓ (lo saca de su uid real) o se COMPARTE: depende del ajuste de
  restauración del proyecto en RevenueCat. Si su teléfono pierde los extras, «Restaurar mi ofrenda
  anterior» en su teléfono lo devuelve.
- Atrás de Android con la hoja abierta: la cierra (probado en `alreadyUnlocked`, `S115-a1-14.xml.txt`).

#### 4. Premium (el REAL de RevenueCat tras §3; no el toggle)

- Ajustes → «Extras desbloqueados · Gracias por tu ofrenda»; la tarjeta abre la hoja en `alreadyUnlocked`
  («Extras desbloqueados», la lista, «Cerrar»; sin precios ni compra) (`S115-a1-13-ya-desbloqueado.png`). OK.
- Tema de color, «Ver todos los temas» → «Granate» (EXCLUSIVO): se aplica sin abrir la hoja
  (`S115-a1-16b-premium-granate.png`). OK. (La etiqueta «EXCLUSIVO» sigue visible con premium: diseño.)

#### 5. Transición premium → free (toggle de dev APAGADO, en la misma sesión)

- Apagar el toggle pone `isPremium=false` y la caché en `false`; RevenueCat no vuelve a avisar en la sesión
  (su valor no cambia, `offeringService.ts:134-136`), así que el «free» dura hasta el próximo arranque en frío.
  Con esto sí se pudo medir free tras la restauración:
  - Ajustes vuelve a «Extras de la app» + CTA (`S115-a1-18-toggle-off.png`); el tema premium aplicado
    (Granate) vuelve a Midnight solo (`ColorThemeSettings.tsx:65-73`, `S115-a1-27-tema-free.png`). OK.
  - CTA → la hoja con el selector real (MX$17/49/119) (`S115-a1-19.xml.txt`); atrás la cierra. OK.
  - Doble toque rápido al CTA (`input tap` x2 en una llamada): UNA hoja; un atrás la cierra
    (`S115-a1-25.xml.txt`, `S115-a1-26.xml.txt`). OK.
  - Tema premium «Granate» en free → abre la hoja ENCIMA del modal de temas (con el corte de H1); un atrás
    cierra solo la hoja y deja el modal (`S115-a1-29-granate-free-hoja.png`, `S115-a1-30.xml.txt`). OK.
  - Quiz → «Modo cronometrado» en free → abre la hoja (`S115-a1-32-quiz-free.png`). OK.
  - No se tocó ningún nivel en free tras §3 (con esta cuenta de Google, tocar uno dispara OTRO restore solo).

#### 6. Arranque en frío tras cada estado

- Tras §3 (premium real) + toggle apagado → arranque en frío → **premium** de nuevo: Ajustes «Extras
  desbloqueados», toggle `checked="true"` (`S115-a1-35-frio-premium.png`, `S115-a1-35.xml.txt`,
  `S115-a1-34-frio.logcat.txt`). La primera respuesta de RevenueCat del proceso le gana a la caché que dejó el
  toggle (`R9-9`/`R9-10`): correcto. (Para pruebas: el toggle de dev no sobrevive a un arranque en frío
  cuando RevenueCat tiene el derecho. Es solo de desarrollo.)
- Primer arranque (antes de §3): free, como debe (§1).

#### Lo que queda «sin medir», con el porqué

- **El diálogo de COMPRA de Play y su cancelación (`cancelled`, `OfferingSheet.tsx:122-124`):** con esta
  cuenta de Google Play no muestra el diálogo («You already own this item»). Hace falta una cuenta de Google
  SIN la ofrenda (o una con la compra consumida).
- **El enlace «Restaurar mi ofrenda anterior» como botón:** no se tocó (la única restauración permitida ya
  ocurrió por `alreadyOwned`). Su efecto (`restorePurchases` → `handleCustomerInfo` → premium) sí quedó
  medido. El caso sin red ya es `R9-16`.
- **El copy en inglés en el dispositivo** (en código, `translations.ts:11018-11075`, 7 extras como el español)
  y **la letra grande** (`font_scale`): no hacía falta para H1, que ya se ve con letra normal.
- **Si la restauración TRANSFIRIÓ o COMPARTE el derecho de Victor:** no se distingue desde el cliente
  (ajuste de restauración del proyecto en RevenueCat). Se ve en el dashboard de RevenueCat (el cliente con
  la orden `GPA.3313-5368-7101-19010`) o en su teléfono.

#### Observación para Victor (no es hallazgo)

- Con una cuenta de Google que ya tiene la ofrenda, tocar CUALQUIER nivel (aun cancelando el error de Play)
  restaura sola y le pasa el derecho a la cuenta de la app que esté activa (`OfferingSheet.tsx:125-138`, el
  arreglo `327fc26`). En un teléfono compartido con varias cuentas de la app, eso decide a qué cuenta va el
  premium; depende del ajuste de restauración de RevenueCat.
