# C26a — Cuenta: login/logout de Google, identidad (Modo C, sesión 137)

**Estado: PENDIENTE — «sin medir» (S137).** No tuvo agente, como `C54` y `C55` en la 115: hace falta una cuenta
de Google de PRUEBA y Victor no la agregó todavía.

## Por qué no se midió

- Medido en la 137: la instancia de solo lectura de `Pixel_9_Pro` (`emulator-5554`) trae **una sola** cuenta de
  Google (`adb shell dumpsys account`: `Accounts: 1`, `type=com.google`), la REAL de Victor, que ya tiene la
  ofrenda. Iniciar sesión con ella en la app mezclaría sus datos reales de Firestore con los del emulador.
- Con la cuenta anónima de cada instancia, la tarjeta de cuenta (nombre, «Cerrar sesión», «Borrar cuenta») no
  existe: `app/(tabs)/settings.tsx:541` la muestra solo con `user && !user.isAnonymous`; en su lugar va el
  anzuelo «Iniciar sesión con Google», que nadie tocó.
- El QA de Fable (fila 26 de `DOCS/QA_REVISION_FABLE.md`) tampoco ejercitó el login ni el cierre de sesión, por la
  misma razón (era la sesión real de Victor).

## La receta, para cuando toque

- Victor agrega una cuenta de Google de PRUEBA a una instancia de solo lectura (Ajustes del sistema → Cuentas; la
  instancia se descarta al apagar). La app inicia sesión con ella; nunca con la de Victor.
- Qué medir, en los dos sentidos: anónimo → Google (qué pasa con lo creado como anónimo: se adopta, se pierde o se
  duplica), cerrar sesión (qué queda en el dispositivo, qué se limpia: `signOut` en `AuthContext.tsx`), volver a
  entrar con la misma cuenta y con otra (la mezcla entre cuentas de `R9-22`/`R9-23`/`R9-48`, arreglada en la 8),
  el uid de RevenueCat (`offeringService.linkUser`) tras cada cambio, y un arranque en frío en cada estado.
- La misma instancia sirve para `C27a` («Borrar cuenta»), `C54` (conflictos) y `C55` (canje real).
