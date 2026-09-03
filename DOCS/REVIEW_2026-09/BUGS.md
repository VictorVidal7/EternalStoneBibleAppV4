# 🐛 Bugs — Revisión profunda 2026-09

> Resumen corriente de todo lo marcado `🐛 BUG` en [`INDEX.md`](INDEX.md), P0 primero.
> Cada entrada lleva: severidad, área del índice, `file:line`, pasos de repro y
> evidencia. **Nada aquí se arregla en esta revisión** — arreglar es una sesión aparte
> (charter §1).
>
> Numeración: `R9-1`, `R9-2`, … (el prefijo evita confundirlas con los `BUG-N` de la
> revisión Fable de julio).
>
> `main` está verde (`npm run validate` pasa), así que **cualquier fallo nuevo que esta
> revisión haga aparecer es una regresión real.**

---

## P0 — dinero, identidad, pérdida de datos, seguridad

- **`R9-9` (A1, entitlements) — 🐛 la revocación de la entitlement premium no se propaga
  nunca.** Severidad **alta**. Es dinero: acceso de pago que sobrevive al reembolso, y
  premium gratis para el segundo usuario de un dispositivo compartido.
  `src/lib/offering/offeringService.ts:121` corta con
  `if (unlocked === lastKnownUnlocked) return;`, y `lastKnownUnlocked` se inicializa a
  `false` en cada arranque del proceso (`:112`). En cualquier arranque en el que
  RevenueCat reporte la entitlement **inactiva**, ese dedupe (`false === false`) corta
  **antes** de `setCachedEntitlement(unlocked)` (`:123`) y **antes** de notificar a los
  listeners (`:124-133`). Un `'true'` viejo en la caché de `expo-secure-store` no se
  corrige jamás. `PremiumContext` se siembra de esa caché al montar
  (`src/context/PremiumContext.tsx:57-61`) y después solo escucha **cambios** (`:64-66`)
  — que ya no van a llegar.
  **Nada lo repara:** `grep` de `SecureStore` sobre `src/` + `app/` da **cero** usos
  fuera de `entitlementCache.ts`. Ni el cierre de sesión, ni el borrado de cuenta, ni el
  reset de Ajustes limpian la clave; y `linkUser()` está documentado a propósito para no
  revocar en el sign-out (`offeringService.ts:200-205`). Solo una desinstalación la
  borra.
  **Repro (verificado con sondas contra el `PremiumContext` y el `offeringService`
  reales + el mock oficial de `react-native-purchases`):** con la caché en `'true'` y
  RevenueCat reportando inactiva → `isPremium = true`, caché en disco `'true'`, y sin
  embargo `getLastKnownEntitlement() = false`. Igual con `linkUser('uid-B')` de un
  usuario sin compra. El **control** en la dirección contraria (caché vacía + RevenueCat
  activa) sí funciona: **el defecto es asimétrico, solo falla la dirección que quita el
  acceso.**
  **Corroboración:** `src/components/settings/ColorThemeSettings.tsx:60-74` tiene un
  `useEffect` cuyo comentario nombra el escenario textualmente ("_the entitlement is
  later revoked (e.g. a refund)_"). Ese revert depende de que `isPremium` pase a `false`,
  que es justo lo que este bug impide. Igual en `ReaderPreferencesSheet.tsx:128-150`.
  **Arreglo sugerido (no aplicado):** el dedupe está bien para no notificar de más; lo
  que está mal es tomar `false` como estado inicial **conocido** cuando en realidad es
  "todavía no sé". Opciones: (a) sembrar `lastKnownUnlocked` desde la caché en
  `initialize()`; (b) escribir siempre la caché y dejar el dedupe solo para la
  notificación; (c) `lastKnownUnlocked: boolean | null` con `null` = sin resolver.
  Detalle completo en `detail/A1-premium-revenuecat.md`.

- **`R9-10` (A1, `PremiumContext`) — 🐛 la lectura tardía de la caché pisa el valor real
  de RevenueCat.** Severidad **media** (se auto-repara en el siguiente arranque), pero el
  usuario afectado es, por definición, uno que **ya pagó**.
  En `src/context/PremiumContext.tsx:54-72` la lectura asíncrona de caché y el listener
  de RevenueCat escriben el mismo estado sin orden garantizado; si el push de RevenueCat
  llega primero, el `setIsPremium(unlocked)` incondicional de la línea **59** lo
  sobrescribe con el valor viejo. Contradice el contrato que declara el propio docstring
  del módulo (`:5-8`: "_those come from RevenueCat's CustomerInfo … and win over anything
  written here_").
  **Repro (verificado, determinista, sin timers):** difiriendo la resolución de
  `getPremiumUnlocked()` y disparando entremedio `initialize()` con la entitlement activa
  → `tras push de RevenueCat: isPremium = true` … `tras resolver la caché: isPremium = false`.
  **Escenario:** usuario que pagó, arranque en frío con la primera lectura de
  `expo-secure-store` lenta (init del keystore de Android) y la caché aún sin reflejar la
  compra — p. ej. tras reinstalar, o tras una escritura fallida, porque
  `entitlementCache.ts:43-48` **se traga los errores de escritura**. Queda premium
  bloqueado toda la sesión.
  **Arreglo sugerido (no aplicado):** ignorar el resultado de la lectura de caché si un
  valor del listener ya llegó (basta un `ref` de "ya resuelto por RevenueCat"), en vez del
  `setIsPremium` incondicional de la línea 59.

---

## P1 — núcleo de la app

_Ninguno todavía._

---

## P2 — resto + pulido

- **`R9-2` (B2, `.gitignore`) — 💡 el `.gitignore` raíz solo cubre `.env*.local`, no un
  `.env` pelado.** Severidad **baja** (hardening), arreglo de una línea.
  `.gitignore:48` es `.env*.local`, así que `.env`, `.env.production`, `scripts/.env` y
  `src/.env` **no** están ignoreados — y el repo es **público**
  (`"visibility": "public"`).
  **Repro:** `git check-ignore -v .env` → sin match; comparar con
  `git check-ignore -v functions/.env` → sí matchea (`functions/.gitignore:13`).
  **Por qué NO es P0:** los dos directorios que manejan secretos de alto valor ya se
  cubren solos — `functions/.gitignore` tiene `.env`, y `vercel/gift-code-redeem/.gitignore`
  tiene `.env*`. En la raíz y en `scripts/`/`src/` hoy no hay nada sensible (los
  `process.env` de `scripts/` son rutas y flags; la convención de Expo en la raíz es
  `EXPO_PUBLIC_*`, público por diseño), y no existe un `.env.example` que empuje a
  crear uno.
  **Por qué vale arreglarlo:** el radio de daño si se equivoca es total — el service
  account de Firebase que consume `vercel/gift-code-redeem/api/redeem.ts:36` salta
  _todas_ las reglas de Firestore, y la clave secreta de RevenueCat (`:220`) otorga
  entitlements gratis. `.env` en la raíz es el nombre más natural y basta un
  `git add .`.
  **Arreglo sugerido (no aplicado):** `.env*.local` → `.env*` en `.gitignore:48`.

- **`R9-3` (B3, limpieza) — 💡 3.3 MB de artefactos de Yarn trackeados en un repo que
  usa npm.** Severidad **muy baja**, no es seguridad.
  Siguen trackeados `.yarn/releases/yarn-3.6.4.cjs` (2 231 402 bytes) y
  `.yarn/plugins/@yarnpkg/plugin-interactive-tools.cjs` (1 074 996 bytes), restos de la
  era Yarn del commit inicial, mientras el repo usa npm: hay `package-lock.json`, no hay
  `yarn.lock`, y `package.json` no tiene campo `packageManager`.
  **Repro:** `git ls-files | grep '^\.yarn/'` → 2 archivos.
  **Efecto secundario que vale:** ese bundle minificado es la única razón por la que un
  escáner de secretos sobre este repo reporta un falso positivo de `AKIA` (fragmentos
  `AKIA4QI`/`AKIA9`/`AKIAE`, ninguno con la forma AWS de `AKIA`+16). Borrarlos limpia el
  ruido además del peso. Encaja en la fila `B9`; se registró en `B3` porque ahí se
  encontró.

- **`R9-4` (B4, proceso) — 💡 las reglas de seguridad de Firestore no están versionadas
  en el repo.** Severidad **baja-media**: no es un hueco explotable hoy, es riesgo
  operativo. Las reglas vivas son correctas (default-deny + `request.auth.uid == uid`,
  ningún path abierto — auditado en `detail/B4-reglas-firestore-storage.md`), pero
  existen **solo en la consola de Firebase**.
  **Repro:** `git ls-files | grep -iE '\.rules$'` → 0 archivos; `firebase.json` solo
  tiene `react-native`, `functions`, `hosting` — ni sección `firestore` ni `storage`.
  **Por qué importa:** el control de acceso de toda la app es el único componente de
  seguridad que se salta el proceso que el resto del código sí respeta — sin diff, sin
  PR, sin CI, **sin rollback**. `firebase deploy --only firestore:rules` no funciona
  sin la sección en `firebase.json`, así que el despliegue seguirá siendo manual, que
  es justo el modo en que se relaja una regla sin querer. Hoy reglas y código coinciden
  por suerte estructural (el comodín `{collection=**}` cubre toda colección nueva bajo
  `users/{uid}/`), no por verificación.
  **Arreglo sugerido (no aplicado):** volcar el texto vivo a `firestore.rules` (ya está
  capturado íntegro en el detalle de `B4`, así que es mecánico) + añadir
  `"firestore": {"rules": "firestore.rules"}` a `firebase.json`.

- **`R9-5` (B5, CI) — ⚠️ el job "Security Audit" no puede fallar nunca.** Severidad baja
  como riesgo, pero induce a error activamente. Los dos únicos pasos del job
  (`npm audit --audit-level=moderate` y `npm outdated`) llevan ambos
  `continue-on-error: true`, así que el job **sale verde siempre**.
  **Repro:** cualquier run reciente en Actions → "Security Audit" verde; local
  `npm audit --audit-level=moderate` → exit code ≠ 0 (8 vulns, 1 HIGH, ver `B1`).
  **Por qué importa:** quien mire los checks de un PR concluye "la auditoría de
  seguridad pasó" cuando en realidad se ejecutó y se ignoró el resultado.
  **Opciones (no aplicadas):** quitarle el `continue-on-error` a `npm audit` ahora que
  `B1` ya clasificó las 8 y dejó justificadas las inevitables; o renombrar el job a
  "Dependency Report" para que el nombre no prometa una garantía que no da.
  (`npm outdated` sí necesita la bandera: devuelve 1 siempre que haya algo atrasado.)

- **`R9-6` (B5, CI) — 💡 endurecimiento: sin bloque `permissions:` y acción de terceros
  en tag mutable.** Severidad **baja**, hoy mitigado por configuración del repo.
  (a) `ci.yml` no declara `permissions:` en ningún nivel, así que el `GITHUB_TOKEN`
  hereda el default del repo — que hoy **es `"read"`** (verificado por API), o sea sin
  escalada real; pero es un ajuste de settings mutable desde la UI sin dejar rastro en
  git. (b) `codecov/codecov-action@v4` es de terceros sobre un tag **móvil**, y
  `sha_pinning_required` del repo es `false` (Codecov tiene precedente de compromiso de
  cadena de suministro, 2021).
  **Por qué NO es urgente:** el repo tiene **0 secretos de Actions** (`total_count: 0`)
  y el token es read-only, así que una acción comprometida no podría exfiltrar
  credenciales ni pushear — a lo sumo falsear el resultado del job.
  **Arreglo sugerido (no aplicado):** `permissions: {contents: read}` a nivel workflow +
  fijar la acción de Codecov a SHA completo.

- **`R9-7` (B1b, `functions/`) — ✅ RESUELTO 2026-09-03.** Era: código no desplegado que duplica la lógica de dinero, y
  `firebase.json` todavía lo declara.** Severidad **baja-media** (mantenimiento en una
  ruta P0, no un bug hoy).
  `functions/src/index.ts` implementa el canje de gift-codes completo **en paralelo** al
  de Vercel — los dos leen `db.collection('giftCodes').doc(code)`
  (`functions/src/index.ts:204` vs `vercel/gift-code-redeem/api/redeem.ts:159`) y los dos
  llaman a RevenueCat con la clave secreta. Pero la app solo llama a Vercel
  (`src/lib/offering/giftCodeService.ts:44` → `https://essb-gift-redeem.vercel.app/api/redeem`).
  **Repro:** `git log --oneline -- functions/` → 1 solo commit (`ca69aca`), reemplazado
  por `c3650f0` ("port redemption endpoint to Vercel's free tier"); `functions/node_modules`
  no existe; el proyecto está en plan Spark (Cloud Functions necesita Blaze).
  **Por qué importa:** (a) deriva silenciosa — un arreglo de canje aplicado en Vercel deja
  atrás la copia invisible, y son dos implementaciones del mismo gate de pago;
  (b) `firebase.json` sigue con `"functions": [{"source": "functions", "predeploy": …}]`,
  así que un `firebase deploy` sin `--only hosting` intentaría desplegarlo.
  **Resolución:** Victor pidió primero borrarlo; al revisar el objetivo antes de borrar
  apareció un dato que faltaba en este hallazgo — `functions/` **no está olvidado, está
  conservado a propósito**, y la razón ya estaba escrita en
  `src/lib/offering/giftCodeService.ts`: Cloud Functions exige el **plan Blaze**, que
  convierte el proyecto Firebase **entero** a facturación con sobrecosto, mientras el
  tier Hobby de Vercel tiene tope duro. Con ese dato se recomendó **no borrar**, y Victor
  estuvo de acuerdo. Aplicado:
  (a) se quitó la sección `functions` de `firebase.json` — mata la trampa concreta de
  despliegue (ahora `firebase deploy` solo publica hosting);
  (b) se agregó `functions/README.md`, que lo etiqueta como NO DESPLEGADO, explica el
  motivo de Blaze, señala que la fuente de verdad es `vercel/gift-code-redeem`, **avisa
  que esta copia está atrasada en mantenimiento** (la de Vercel recibió `d97516b`) y deja
  los 5 pasos si alguna vez se despliega, incluida la sección JSON exacta que se quitó;
  (c) punteros al README desde `giftCodeService.ts` y `.prettierignore`.
  **Por qué no se borró:** conservarlo cuesta cero medible (no compila, no testea, no
  entra al bundle, no lo toca `npm run validate`), el riesgo de deriva exige pasar a
  Blaze — un acto deliberado de mucha fricción — y borrarlo sí destruye la salida de
  emergencia de un solo proveedor en una ruta de dinero. El problema del "duplicado
  invisible" se resolvió haciéndolo visible y etiquetado.

- **`R9-8` (B1b, subproyectos) — 💡 replicar el `override` de `uuid` que la raíz ya
  tiene.** Severidad **baja**; cierra la única vuln de runtime desplegado sin tocar
  `firebase-admin`.
  De las 26 vulns de `functions/` + `vercel/` (incluidas **7 HIGH**), la única en el
  runtime realmente desplegado es `uuid@9.0.1` vía `firebase-admin@13.10.0` →
  `google-gax`/`gaxios`/`teeny-request` (todas las HIGH salen de `@vercel/node`, que es
  **devDependency** = tooling de build/`vercel dev`, no viaja al lambda).
  GHSA-w5hq-g745-h8pq afecta solo a `v3`/`v5`/`v6` **con** argumento `buf`; esas libs
  usan `uuid.v4()` → **no alcanzable**, pero es trivial de cerrar.
  **Ojo, misma trampa que `R9-1`:** el fix de npm es
  `firebase-admin@10.3.0` — un **downgrade** desde 13.10.0 que además revertiría
  `d97516b` ("pin firebase-admin to 13.x, avoiding a broken jose/jwks-rsa ESM chain").
  **Arreglo sugerido (no aplicado):** `"overrides": {"uuid": "^11.1.1"}` en
  `vercel/gift-code-redeem/package.json`. **Este override SÍ funciona** (a diferencia del
  de `R9-1`): `uuid@11.1.1` trae build dual (`exports.node.require → ./dist/cjs/index.js`)
  y la **raíz ya lo corre con ese mismo override** con `npm run validate` en verde.
  Verificar con un canje real contra el endpoint desplegado antes de darlo por cerrado.

---

## ⚠️ Dudas / parciales

- **`R9-1` (B1, remediación de vulns) — ⚠️ TRAMPA: `npm audit fix --force` rompería la
  app entera.** No es un bug de la app; es una mina para una futura sesión de arreglos.
  `npm audit` reporta, para las 3 filas de la cadena `expo-router` → `query-string` →
  `decode-uri-component`, `fixAvailable: {"name":"expo-router","version":"5.1.11","isSemVerMajor":true}`.
  El instalado es **`expo-router@57.0.12`** (declarado `~57.0.12`, fijado por Expo SDK
  57), así que la "corrección" es un **downgrade de 52 majors** que destruiría todo el
  routing de `app/`. `npm audit` lo dice en su propia salida:
  `Will install expo-router@5.1.11, which is a breaking change`.
  **Repro:** `npm audit` en la raíz y leer el bloque `fixAvailable` de
  `decode-uri-component` / `query-string` / `expo-router`.
  **Qué hacer:** `npm audit fix` a secas es seguro (solo toca `firebase-tools` y
  `@expo/plist`, ambos dev/build). **Nunca `--force`.** La vía de `overrides` tampoco
  sirve: el parche `decode-uri-component@0.5.0` es ESM-only y `query-string@7.1.3` lo
  consume con `require()`. Lo correcto es no tocar nada — las 3 no son alcanzables
  (detalle en `detail/B1-npm-audit.md`) y se resuelven cuando `expo-router` migre a
  `query-string` 8+.

---

## Heredado de la revisión Fable (julio 2026) — CERRADO

- **BUG-10 (profecías, "Siguiente" no reseteaba el scroll) — ✅ CERRADO.** El charter
  §3 lo listaba como semilla abierta; ese dato estaba obsoleto. Verificado el
  2026-09-03: `app/features/prophecies/index.tsx:297-299` tiene un
  `useEffect(() => scrollRef.current?.scrollTo({y: 0, animated: false}), [phase])` con
  un comentario que cita explícitamente "QA BUG-10". Arreglado en `b17ec99`
  ("fix: prophecies back-nav returns to hub first, plus scroll-reset on step change"),
  confirmado como ancestro de `main`. El arreglo cubre más que el repro original
  (Anterior/Siguiente, salto desde el índice, tarjeta "hoy", auto-avance narrado).
- **BUG-1 … BUG-9, BUG-11, BUG-12 — reportados como cerrados** en las tandas A–E del
  mismo día (2026-07-14/15). **No re-verificados en vivo** en esta revisión; si el
  Modo C toca su área, vale una comprobación de paso.
