# B6 — Permisos Android, plugins, `google-services.json`

> Modo B (dependencias y superficie nativa) · Prioridad **P1** · Sesión 136 (2026-11-10, chat nuevo, en la terminal,
> SIN agentes, Opus 5.5) · Estado **🐛 BUG** (cerrada en la 136) · Base: `df94dd5`.

> **Resultado:** 2 hallazgos, ninguno P0, los dos P3 y con la misma raíz: el keystore de debug **público** de la
> plantilla de Expo (su clave privada viene en `node_modules/expo/template.tgz`, con la contraseña `android`) figura
> como si fuera de la app en dos lugares de producción. `R9-550`: `assetlinks.json` declara solo ese certificado, ni
> el de subida ni el de Play App Signing, así que el App Link no se verifica en una instalación de Play y todo
> enlace compartido pasa por el navegador. `R9-551`: el proyecto de Firebase de producción acepta ese certificado
> como cliente OAuth de Android. Ningún permiso restringido por la política de Play; sobran dos grupos sin daño.

## Cómo se midió

`android/` no está en git (`.gitignore:67`, CNG): lo que se publica sale del manifiesto fusionado del build. El
del release está en `android/app/build/intermediates/merged_manifests/release/processReleaseManifest/` (2026-09-02
19:27, `versionCode` 74, `versionName` 3.2.62, `minSdk` 24, `targetSdk` 36), y su origen por permiso en
`android/app/build/outputs/logs/manifest-merger-release-report.txt`. Desde `dc19f4a5` (el bump a vc74)
`package.json` solo cambió `engines` y scripts (`git diff dc19f4a5 HEAD -- package.json`), y `package-lock.json`
nada: el manifiesto de vc74 es el de HEAD. Salidas: `_scratch/S136-B6-manifest.out.txt` (permisos y origen),
`S136-B6-sha-list.out.txt` (`firebase apps:android:sha:list`, solo GET), `S136-B6-assetlinks.out.txt` (el
`assetlinks.json` vivo y los certificados del AAB de vc74 y del APK v3.0.4), `S136-B6-keystore.out.txt` (el
keystore de la plantilla contra el del prebuild).

## Hallazgos

- **`R9-550` (P3)** — `web/.well-known/assetlinks.json:7-8` (y la copia servida, `Last-Modified` 2026-09-15)
  declara un solo `sha256_cert_fingerprints`, `FA:C6:17:45…3B:9C`: el del keystore de debug de la plantilla
  (`CN=Android Debug`, idéntico byte a byte a `package/android/app/debug.keystore` de `node_modules/expo/template.tgz`).
  No está el de subida (`A9:89:EC:46…EE:8D`, medido en el AAB de vc74) ni el de Play App Signing (Play re-firma
  cada AAB; su SHA-256, `3ac22403…2989`, es el único registrado en Firebase, agregado en la sesión 46: dato de la
  memoria, no medido aquí). **Camino:** con la app instalada desde Play en Android 12 o más, tocar en WhatsApp una
  invitación `https://eternalstonebible.github.io/o/#d=…` (`bundle.ts:492-496`; `app.json:62-73`,
  `autoVerify: true`) abre el navegador: la página `web/o/index.html` lee el `#d=` (`:167`) y rebota a
  `eternalbible://features/together?d=…` (`:176`, `:210`) o deja el botón «Open in Eternal Stone Bible». Lo que
  prometió `9b75f5e7` («a verified link opens the app DIRECTLY, dropping the browser flash») no pasa nunca fuera
  de un build de debug. Y el dominio queda delegado a una clave que tiene cualquiera: una app con el paquete
  `com.eternalstonebible.app` firmada con ese keystore verifica el enlace y recibe el `#d=` (hace falta instalarla
  por fuera de Play, y no convive con la real). **Propuesta (sin escribir):** reemplazar la huella de debug por la
  de Play App Signing (Play Console → Integridad de la app) más la de subida, en `web/` y en Pages, con el OK de
  Victor (es un despliegue).
- **`R9-551` (P3)** — `google-services.json:21` (`certificate_hash` `5e8f1606…f625`) es el SHA-1 del mismo
  keystore público, y Firebase lo tiene registrado en el proyecto de producción junto al de subida (`399e…`) y al de
  Play (`422e…`, `3ac2…`). **Camino:** Google Sign-In valida paquete + SHA-1 contra los clientes OAuth de Android
  del proyecto; con ese registro, una app con el paquete de la app firmada con el keystore de la plantilla puede
  pedir el inicio de sesión contra el proyecto real y, si el usuario elige su cuenta en el selector («Eternal Stone
  Bible»), obtiene su sesión de Firebase y con ella lee y escribe `users/{uid}` (notas, diario de oración). La
  cadena es improbable (instalar una app falsa por fuera de Play, que no convive con la real); el daño, de
  privacidad: la severidad la decide Victor, como `R9-547` (§8). La memoria de la 44 llamó a `5e8f…` «keystore»,
  como si fuera propio. **Propuesta (sin escribir):** un keystore de debug propio fuera de git, registrar su SHA-1
  en lugar de `5e8f…`, y volver a bajar `google-services.json` (hoy lista 1 de los 4 hashes registrados).

## ✅ con su evidencia

- **Ningún permiso restringido o sensible para Play:** ni `READ_MEDIA_*` (la galería va por el selector del
  sistema), ni `CAMERA`/`RECORD_AUDIO` (quitados con `tools:node="remove"` por las opciones de `expo-image-picker`,
  `app.json:28-34`), ni ubicación, SMS, registro de llamadas, `QUERY_ALL_PACKAGES`, `REQUEST_INSTALL_PACKAGES`,
  `MANAGE_EXTERNAL_STORAGE`, `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM`, `FOREGROUND_SERVICE*` ni `AD_ID`.
  `SYSTEM_ALERT_WINDOW`, bloqueado (`app.json:61`).
- **`READ`/`WRITE_EXTERNAL_STORAGE` hacen falta (no sobran):** van con `maxSdkVersion="32"`, y
  `requestMediaLibraryPermissionsAsync` pide justo esos dos en Android 12 o menos (`ImagePickerModule.kt:258-266`;
  en 13 o más, la lista va vacía y se concede sola). Lo llama `ownPhotoPicker.ts:43`, el fondo con foto propia:
  bloquearlos daría «denegado» en Android 7 a 12. Que una sesión de arreglos no los quite.
- **Los demás, con su llamador:** `POST_NOTIFICATIONS` (`NotificationService.ts:199`), `RECEIVE_BOOT_COMPLETED`
  (`expo-notifications` re-agenda tras reiniciar), `VIBRATE` (`expo-haptics`), `ACCESS_NETWORK_STATE`/
  `ACCESS_WIFI_STATE` (netinfo), `WAKE_LOCK` (Firebase), `BILLING` (RevenueCat, `billing:8.3.0`),
  `READ_GSERVICES` (el reCAPTCHA de Firebase Auth), el install referrer y el `DYNAMIC_RECEIVER` de `androidx.core`.
- **Los 9 componentes exportados son los esperados:** `MainActivity`, `VerseWidgetProvider` (solo
  `APPWIDGET_UPDATE`; su `PendingIntent` con `FLAG_IMMUTABLE`, `VerseWidgetProvider.kt:338-342`), el receptor de
  FCM (permiso `c2dm.SEND`), el de Amazon IAP (permiso `NOTIFY`), las dos actividades de Firebase Auth, el
  `RevocationBoundService` y el `ProfileInstallReceiver` (permiso `DUMP`).
- **`google-services.json` no lleva nada que no deba:** ids del proyecto, un cliente OAuth de Android, uno web y la
  `AIza…`, pública por diseño (`B2`). Que liste 1 de 4 hashes no rompe el inicio de sesión: se valida contra lo
  registrado en la consola, no contra el archivo. Lo único es `R9-551`.
- **`plugins/with-release-signing.js`:** sin `keystore.properties`, el release queda firmado con debug y solo avisa
  (`:40-57`); Play rechaza un AAB firmado con debug, así que no hay camino a la tienda (el APK v3.0.4 de la raíz es
  de debug: medido con `apksigner`). **`with-verse-widget.js`:** un receptor, sin acciones propias.
- **`expo-secure-store` tras una restauración:** una sola clave (`entitlementCache.ts:20`; `premiumStore.ts` y
  `PremiumContext.tsx` pasan por ahí). Si no se puede descifrar, el módulo devuelve `null`
  (`SecureStoreModule.kt:143-168`) y la caché da `false` (`entitlementCache.ts:24-33`): decide RevenueCat.

## Sobran (sin número: ningún daño medido, la tienda los acepta)

- `USE_BIOMETRIC` y `USE_FINGERPRINT` (`androidx.biometric:1.1.0`, vía `expo-secure-store`): no hay
  `requireAuthentication` en `src/` ni `app/`.
- Los 16 permisos de insignias de lanzadores (`ShortcutBadger:1.1.22`, vía `expo-notifications`): no hay
  `setBadgeCountAsync`.
- `c2dm.RECEIVE` y el servicio de FCM (`firebase-messaging:25.1.1`, vía `expo-notifications`): los avisos son
  locales, no hay `getExpoPushTokenAsync` ni `getDevicePushTokenAsync`.
- El receptor de Amazon IAP (`react-native-purchases`): la app vende solo en Play.

Los dos primeros se pueden bloquear con `android.blockedPermissions`. Es higiene de la ficha de Play, no un bug.

## Sin medir

- **`android:allowBackup="true"` sin `fullBackupContent` ni `dataExtractionRules`** (manifiesto fusionado; el plugin
  de `expo-secure-store` no está en `app.json`, y es el que las agrega, `withSecureStore.js:8-28`). La copia
  automática de Android o el traspaso entre dispositivos clonaría AsyncStorage (`@sync_queue_v1`, `@sync_cursor_*`,
  `@local_store_owner_uid`), SQLite y la caché de Firestore en otro aparato. Inferido: las tres bases de `assets/`
  suman 28,5 MB (`bible-seed.db` 21,8; `cross-references.db` 4,9; `strongs-defs.db` 1,8), por encima de la cuota de
  25 MB de la copia a Drive, que entonces no se haría; el traspaso entre dispositivos no tiene esa cuota. Se mide
  en Modo C (`adb shell bmgr backupnow`, `dumpsys backup`, una restauración con cola pendiente).
- El estado del App Link en una instalación de Play (`adb shell pm get-app-links com.eternalstonebible.app`).
- Si el navegador de WhatsApp o Chrome rebota solo al esquema propio sin un toque (`web/o/index.html:208-210`) o
  hace falta el botón.
- La huella SHA-256 de Play App Signing: Victor la lee en Play Console. Y las restricciones de la `AIza…` en Cloud
  Console (lo dejó `B2`).

## Cruce con las vecinas

- `A27` (deep links) revisó la ruta `/o` y el `redirectSystemPath`, no la verificación del dominio.
- `B2` vio el `certificate_hash` como «información pública», sin notar que es el de la plantilla.
