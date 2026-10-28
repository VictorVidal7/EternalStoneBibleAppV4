# C39 — Donación: hoja, compra, restaurar (Modo C, sesión 115)

**Estado: 🐛 BUG (P3), ninguno P0.** Agente 2, `emulator-5556`. El entorno de la 115, en
`detail/C15-hoja-ofrenda.md`.

## Hallazgos

- **`S115-a2-H1` = `R9-419` (P3, en Play Console, fuera del repo):** los productos `donacion_1..4` llevan un
  precio en dólares en el título: el diálogo de Play muestra «Donación $1.99» junto a «MX$34.00», y en México
  «$» es el peso.
- **`S115-a2-H2` = `R9-420` (P3):** sin red, «Apoyar con una donación» no hace nada visible: la hoja pasa a
  `unavailable` y se cierra sin mensaje (`DonationSheet.tsx:70-73`, `:106-120`, a propósito).

## Lo medido, en una línea

Una sola entrada (Ajustes, `app/(tabs)/settings.tsx:527`); la hoja abre y se queda; 4 niveles con precio real
(MX$34 / 85 / 169 / 339), ascendentes; el diálogo de Play (con «Test card, always approves») cancelado en los 4
niveles en free y en 1 en premium: vuelve al selector y no otorga nada; atrás cierra; doble toque abre una
sola hoja y un solo diálogo; en premium, igual (la donación no lee `isPremium`).

## Sin medir

La compra confirmada (decidido: parar en el diálogo), con eso el agradecimiento, `alreadyOwned` (`R9-19`) y el
pago pendiente (`R9-18`). La donación no tiene «Restaurar» (ya escrito en `R9-19`).

**Observación de copy, sin número:** la intro dice «la app completa ya es, y seguirá siendo siempre, gratuita
para todos», aunque la ofrenda desbloquea extras; es el mismo marco que el copy de la ofrenda (editorial, de
Victor).

Evidencia: `_scratch/S115-sondas-agente-2/`.

---

## Informe del agente 2 (tal cual; los números provisionales arriba)

## S115 — agente 2 — `C39` (donación: hoja, compra, restaurar) — informe incremental

Worktree en `d34bd4d` (verificado). Serial: `emulator-5556`.

### Estado

- EN CURSO. El emulador 5556 se cayó (lo avisó el orquestador) antes de la primera medición; rearrancado
  por el orquestador (instancia nueva, `pm clear`, cuenta anónima nueva).

### Entorno (no es la app)

- **El 1.er arranque tras el rearranque no llegó a Metro** (`ReactHost{0}.isMetroRunning(): Async result =
false`, 17:54:45, luego «Unable to load script»): pantalla blanca. Evidencia:
  `S115-a2-02-arranque.pid.logcat.txt`, `S115-a2-01-primer-arranque.png`. Relanzado en frío, cargó.
- **«Preparing...» parecía colgado (18:01) y no lo estaba:** en DEBUG los `.db` sembrados se bajan de Metro
  con `Asset.fromModule(...).downloadAsync()` (`src/lib/database/nativeSeedAssets.ts:37-40`, 21,8 MB
  `bible-seed.db` + 4,9 MB `cross-references.db`), con Metro sirviendo a 4 emuladores. Al relanzar en frío
  (18:02:56) los dos `ExponentAsset-*.db` ya estaban en `cache/` y `files/SQLite/bible.db` crecía (33,6 MB a
  las 18:03); «✅ Database initialized successfully» a las 18:03:45 (~50 s) y «Servicios V5.1 inicializados»
  a las 18:04:40. Evidencia: `S115-a2-preparing-trabado.png`, `S115-a2-preparing-trabado.*.txt`. En release
  el asset va embebido: no es candidato de la app. El arranque de las 18:01 lo maté yo al relanzar: no
  sé si habría terminado solo (probablemente sí, por lo de las 18:03).

### Medido en el dispositivo (emulator-5556; es-ES elegido en el onboarding; cuenta anónima)

- **Primer arranque, toggle APAGADO, sin tocar nada (dato de `C15`): la app NO se ve premium.** Ajustes →
  «Extras de la app» / «Algunas funciones adicionales se pueden desbloquear con una ofrenda voluntaria.» /
  «Desbloquear con premium»; switch de dev `checked="false"`. RevenueCat al arrancar (nivel INFO/WARN, lo que
  enruta `offeringService`): solo `Could not resolve remote config blob(s)` y `Product not found: ofrenda_1..3
  - Product Type: subs`(el SDK prueba`subs`primero); ninguna línea de post/sync/transfer visible a ese
nivel. Evidencia:`S115-a2-15-extras-y-donacion-free.png`, `S115-a2-13-primer-arranque-rc.logcat.txt`.
- **Free — abrir la hoja (Ajustes → «Apoyar con una donación»): ✅.** Abre y se queda; título «Donación»,
  intro, «Elige la cantidad…», 4 niveles **MX$34.00 / MX$85.00 / MX$169.00 / MX$339.00** (ascendente en
  este dispositivo, aunque el código no ordena), leyenda de transparencia; sin cortes de texto.
  Evidencia: `S115-a2-17-hoja-free-5s.png`.
- **Free — nivel → diálogo de Play → cancelar (atrás), los 4 niveles: ✅.** Diálogo de Google Play con
  «Test card, always approves» / «This is a test order, you will not be charged.»; NO se confirmó ninguno.
  Al cancelar: vuelve al selector en silencio, sin toast, sin otorgar nada (Extras sigue bloqueado);
  logcat `PurchasesError(code=PurchaseCancelledError ... USER_CANCELED)`. Evidencia: `S115-a2-19-dialogo-play.png`,
  `S115-a2-20-tras-cancelar.png`, `S115-a2-20-cancelar.logcat.txt`, dumps `S115-a2-21/22/24-play-nivel*.xml.txt`.
- **Los títulos de producto en el diálogo de Play:** «Donación $1.99» (MX$34.00), «Donación $4.99» (MX$85.00),
  «Donación $9.99» (MX$169.00), «Donación $19.99» (MX$339.00). Ver `S115-a2-H1`.
- **Atrás de Android con la hoja abierta (selector): ✅** cierra la hoja; la app sigue en Ajustes.
- **Toques repetidos:** doble toque en el CTA → abre normal ✅; doble toque en un nivel → UN diálogo de Play,
  un `USER_CANCELED`, vuelve al selector, sin toast de error ✅ (`S115-a2-32/33-*`). Con 5 toques seguidos
  en el CTA la hoja quedó CERRADA (los toques siguientes cayeron en el fondo y la cerraron); el toque
  siguiente abrió bien. Sin daño; no lo numero.

- **Premium (toggle ENCENDIDO en la sesión): ✅.** Toast «Premium activado», Ajustes → «Extras desbloqueados» /
  «Gracias por tu ofrenda…»; la sección «Donación» sigue igual (el código no lee `isPremium`: 0 usos en
  `DonationSheet.tsx`, `DonationSettings.tsx`, `DonationSheetContext.tsx`). Hoja: mismos 4 niveles; nivel 4 →
  diálogo «Donación $19.99 — MX$339.00» con tarjeta de prueba → cancelado → vuelve al selector, sin toast,
  `USER_CANCELED`. Evidencia: `S115-a2-34-premium-on.png`, `S115-a2-35-hoja-premium.png`,
  `S115-a2-36-play-premium.png`, `S115-a2-37-premium-cancelar.logcat.txt`.
- **Arranque en frío con el toggle encendido:** el toggle vuelve a APAGADO y Ajustes muestra «Extras de la app».
  Es el diseño de `R9-9`/`R9-10`: la primera respuesta de RevenueCat de cada proceso (`lastKnownUnlocked`
  `null` → `false`) escribe la caché y notifica (`src/lib/offering/offeringService.ts:134-142`) y
  `PremiumContext` la aplica sobre el puente de la caché (`src/context/PremiumContext.tsx:74-84`). No es nuevo
  (lo midió también el agente 1). Consecuencia para las pruebas: el premium del toggle de dev NO sobrevive a
  un arranque en frío. Tras ese frío la hoja de donación abrió con sus 4 niveles ✅. Evidencia:
  `S115-a2-38-frio-premium.png`, `S115-a2-39-frio-premium-hoja.xml.txt`.
- **Sin red (modo avión): la hoja no abre y NO hay mensaje.** Toque → `RevenueCat ERROR ... NETWORK_ERROR` →
  `[WARN] offeringService: getDonationProducts failed` → 0 productos → `unavailable` → `onClose()`
  (`DonationSheet.tsx:70-73`, `:112-120`). El usuario ve que el botón no hace nada (en debug solo aparece el
  aviso de LogBox «Open debugger to view warnings», que en release no existe). Un 2.o toque sin red: igual
  (1 `failed` más en el log); con la red de vuelta, el toque siguiente abre los 4 niveles: no queda
  trabado. Evidencia: `S115-a2-42-avion-6s.png`, `S115-a2-42-avion.logcat.txt`, `S115-a2-43-avion-2do.logcat.txt`,
  `S115-a2-44-red-de-vuelta.xml.txt`. Ver `S115-a2-H2`.
- **Cerrar con atrás en `purchasing`:** «tocar nivel + atrás a los 0,2 s» → el diálogo de Play ya estaba arriba y
  recibe el atrás (`USER_CANCELED`); la hoja sigue en el selector. El candidato de código (el agradecimiento
  pintado en una hoja cerrada) no es alcanzable con atrás; por el fondo tampoco (el diálogo de Play lo
  cubre). Queda «no alcanzable» en lo medido. Evidencia: `S115-a2-46-tapback-1s.png`, `S115-a2-47-tapback.logcat.txt`.
- **«Restaurar»: sin medir, y no aplica a la donación.** No hay botón de restaurar en la tarjeta ni en la hoja
  de donación (código arriba; dumps `S115-a2-15-extras-free.xml.txt` y `S115-a2-17-*`); el único es el de la
  ofrenda (`offering.restoreLink`), que por decisión de Victor solo lo toca el agente 1. Que la donación no
  tenga restaurar ya está escrito en `R9-19`.
- **La compra en sí: sin medir** (decidido: parar en el diálogo de Play). Por lo tanto también sin medir: el
  agradecimiento (`success`), el toast de error real, `alreadyOwned` (`R9-19`) y el pago pendiente (`R9-18`).

### Veredicto de `C39`

**✅ OK en lo medido** (apertura, niveles con precio real, copy en español sin cortes, diálogo de Play para los
4 niveles en free y 1 en premium, cancelar sin otorgar nada ni toast, atrás, toques repetidos, sin red y
vuelta de la red, premium y arranque en frío), con dos hallazgos provisionales menores (`S115-a2-H1`, P3, en
Play Console; `S115-a2-H2`, P3) y lo «sin medir» de arriba (la compra confirmada, por decisión; restaurar, que
no existe en la donación). Ningún P0.

### Hallazgos provisionales

- **`S115-a2-H1` (P3, copy de dinero, fuera del repo: Play Console).** Los productos `donacion_1..4` tienen
  de TÍTULO un precio en dólares: «Donación $1.99» junto a «MX$34.00». En México «$» es el peso: el diálogo
  de compra dice a la vez «$1.99» y «MX$34.00». La app no muestra ese título (solo `priceString`,
  `DonationSheet.tsx:221`); lo muestra el diálogo de Google Play. Repro: Ajustes → «Apoyar con una
  donación» → cualquier nivel → leer el título. Evidencia: `S115-a2-19-dialogo-play.png`. Arreglo propuesto
  (no aplicado): renombrar en Play Console a «Donación 1», «Donación 2»… o sin monto.
- **`S115-a2-H2` (P3, UX).** Sin red (o con cualquier fallo de `getProducts`), «Apoyar con una donación» no
  hace nada visible: `getDonationProducts` devuelve `[]` (`offeringService.ts:270-276`), la hoja pasa a
  `unavailable` y se cierra sola sin mensaje (`DonationSheet.tsx:70-73`, `:106-120`; el comentario de `:106`
  lo hace a propósito: «degrade quietly»). Es la misma familia que el bug viejo de la 41 («la hoja se abría y
  cerraba sola»), ahora solo por red. Repro: modo avión (`cmd connectivity airplane-mode enable`) → Ajustes →
  «Apoyar con una donación» → nada (logcat `NETWORK_ERROR` + `getDonationProducts failed`). Sin dinero en
  juego (no cobra ni otorga) y se recupera con la red. Arreglo propuesto (no aplicado): distinguir «sin red /
  error» de «no hay productos» y mostrar un toast (`t.donation.purchaseError` u otro). Evidencia:
  `S115-a2-42-avion-6s.png`, `S115-a2-42-avion.logcat.txt`.

### Copy (observación editorial, sin número)

- `donation.sheetIntro` (es `src/i18n/translations.ts:4536-4537`, en `:11079-11080`): «Esto no desbloquea nada
  — la app completa ya es, y seguirá siendo siempre, gratuita para todos», mientras la ofrenda desbloquea
  extras. Es el mismo marco que la ofrenda (`offering.thankYouMessage`: «La app completa sigue siendo
  gratuita — este extra es solo un regalo adicional»; `offering.sheetIntro`: «La Biblia, los planes…
  completamente gr[atuitos]»): parece una decisión editorial de Victor (`2b5d2454`, 2026-07-02). Lo dejo
  dicho, sin número.

### Código (leído en `d34bd4d`)

- **Un solo punto de entrada:** Ajustes → `DonationSettings` (`app/(tabs)/settings.tsx:527`), botón «Apoyar con
  una donación» (`src/components/settings/DonationSettings.tsx:64-74`) → `useDonationSheet().open`
  (`src/context/DonationSheetContext.tsx:37`). `grep` de `useDonationSheet` en `src/`+`app/`: ningún otro
  consumidor. En `__DEV__` la tarjeta se ve siempre (`DonationSettings.tsx:38`); en release, solo con
  `isBillingAvailable()`.
- **La hoja** (`src/components/donation/DonationSheet.tsx`): `load()` (`:63-76`) = `isBillingAvailable()` →
  `getDonationProducts()`; sin billing o con 0 productos → `unavailable` → `onClose()` (`:112-116`) y `null`
  (`:118-120`): se cierra SIN ningún mensaje.
- **El tipo de producto (el bug viejo):** `getDonationProducts` pide `'NON_SUBSCRIPTION'`
  (`src/lib/offering/offeringService.ts:257-277`), ids `donacion_1..4` (`:46-51`). El arreglo de la 41 sigue.
- **El orden de los niveles:** `state.products.map` (`DonationSheet.tsx:211`) en el orden en que los devuelve
  `Purchases.getProducts`, SIN ordenar. La ofrenda sí ordena por precio (`OfferingSheet.tsx:89-92`).
  Candidato a confirmar en el dispositivo.
- **No hay «Restaurar» en la donación:** ni en la hoja ni en la tarjeta (tampoco lo vio QA-11, fila 39 de
  `QA_REVISION_FABLE.md`). Es coherente con un consumible sin derecho; ya está escrito en `R9-19` («esta hoja
  no tiene enlace de restaurar»). «Restaurar» de la ofrenda: solo el agente 1 (decidido por Victor).
- **Comprar:** `purchaseDonation` (`offeringService.ts:320-333`) → `purchaseStoreProduct`; `cancelled` →
  vuelve al selector en silencio (`DonationSheet.tsx:90-92`); todo lo demás (incluido `alreadyOwned` y el
  pago pendiente) → toast «No se pudo completar la donación» (`:93-96`): ya reportado (`R9-19`, `R9-18`).
- **Cerrar durante `purchasing`:** `onRequestClose`/el fondo llaman `handleClose` también en `purchasing`
  (`:127`, `:131`); la compra sigue y su resultado (`success`) se pinta en una hoja cerrada; al reabrir,
  `load()` lo pisa con `loading`. Candidato (el agradecimiento se pierde), a medir.
- **Copy (es, `src/i18n/translations.ts:4534-4554`; en, `:11077-11097`):** `sheetIntro` dice «la app completa
  ya es, y seguirá siendo siempre, gratuita para todos» / «the full app already is, and will always be, free
  for everyone», mientras la ofrenda desbloquea «extras» (Mesa, quiz, etc.). Candidato de copy, a cruzar con
  lo que se ve en premium/free (sin número todavía; no está en `BUGS.md` por «gratuita para todos»).
