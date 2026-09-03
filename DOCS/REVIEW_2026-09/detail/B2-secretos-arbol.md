# B2 — Escaneo de secretos en el árbol de trabajo

**Modo:** B · **Prioridad:** P0 · **Estado:** ✅ OK (con 1 💡 hardening: `R9-2`) ·
**Revisado:** 2026-09-03, sesión 2 · **Commit base:** `18a3ffa`

**Veredicto: cero secretos reales en el árbol trackeado.** Se escanearon **1043
archivos de texto trackeados** (`git ls-files`, excluyendo los `bible-data-*.ts`
generados y binarios). El único material sensible que existe en disco
(contraseña del keystore de release) está en rutas **no trackeadas y gitignoreadas**.

**Dato de contexto que sube la vara: el repo es PÚBLICO.**
`api.github.com/repos/VictorVidal7/EternalStoneBibleAppV4` → `"private": false`,
`"visibility": "public"`. Cualquier cosa commiteada aquí es material publicado, así
que este área se evaluó con ese modelo de amenaza.

---

## Lo que se buscó y no se encontró

| Patrón                                       | Resultado en trackeado |
| -------------------------------------------- | ---------------------- |
| `-----BEGIN [X] PRIVATE KEY-----`            | **0**                  |
| AWS `AKIA[0-9A-Z]{16}`                       | **0**                  |
| GitHub `ghp_…` / `github_pat_…`              | **0**                  |
| Slack `xox[baprs]-…`                         | **0**                  |
| Stripe `sk_live_…`                           | **0**                  |
| RevenueCat **secret** `sk_…`                 | **0**                  |
| `private_key` / `client_email` (svc account) | **0**                  |
| Logs / dumps / `.bak` / `.sql` trackeados    | **0**                  |
| `app.json` → `expo.extra`                    | `{}` (vacío)           |

Comando: `git ls-files -z | xargs -0 grep -InE '<patrón>'`.

## Los 2 hits, ambos legítimos

**1. `google-services.json:31` → `api_key.current_key = AIza…` (39 chars).**
Es la config cliente estándar de Firebase para Android y **corresponde que esté
commiteada**. Volcado completo de sus claves: `project_number`, `project_id`,
`storage_bucket`, `mobilesdk_app_id`, 3 `oauth_client.client_id`,
`certificate_hash` (SHA-1 del cert de firma, información pública) y ese `api_key`.
`grep -ciE 'private_key|client_email|service_account|BEGIN.*PRIVATE KEY'` → **0**.
No hay ninguna credencial de servidor dentro. El charter pedía confirmar
específicamente esto: **confirmado, no lleva nada que no deba.**

**2. `src/lib/offering/offeringService.ts:34` → `let apiKey = 'goog_pNQZ…'`.**
Es la **clave pública del SDK** de RevenueCat (prefijo `goog_`), diseñada para
embeberse en el cliente. El propio código lo documenta en la línea 33: _"apiKey), not
a secret — fine to commit"_. Correcto. La clave **secreta** (`sk_…`), que sí sería
grave, no está en el árbol: se consume por variable de entorno en los dos backends.

## Los secretos de verdad están bien externalizados

- **`functions/` (Cloud Functions)** usa **Firebase Secret Manager**:
  `defineSecret(REVENUECAT_SECRET_KEY)` + `secrets: [REVENUECAT_SECRET_KEY]` en la
  declaración de la función (`functions/src/index.ts:263`), documentado con
  `firebase functions:secrets:set REVENUECAT_SECRET_KEY` (`:56`). Nada en disco.
  Detalle cuidado que vale reconocer: `:121-124` omite a propósito el header
  `X-Platform` al llamar a RevenueCat con la clave secreta, porque RevenueCat trata
  una petición secret-key **con** header de plataforma como secreto potencialmente
  filtrado y la rechaza.
- **`vercel/gift-code-redeem/`** lee `process.env.FIREBASE_SERVICE_ACCOUNT`
  (`api/redeem.ts:36`) y `process.env.REVENUECAT_SECRET_KEY` (`:220`). Su
  `.gitignore` propio cubre `.env*` y `.vercel`. El único `.env` que existe en el
  árbol es `vercel/gift-code-redeem/.env.local`, **no trackeado**, y contiene
  únicamente `VERCEL_OIDC_TOKEN` (token efímero que la CLI de Vercel genera sola).

## La contraseña del keystore: en disco, pero fuera de git

`android/app/build.gradle:107-111` tiene el bloque `signingConfigs.release` con
`storePassword` **en texto plano**. Suena alarmante y no lo es:

- **`/android` entero está gitignoreado** (`.gitignore:67`). `git ls-files android/`
  → **0 archivos**. Ese `build.gradle` es salida de `expo prebuild`, no fuente.
- El plugin `plugins/with-release-signing.js:69-72` es lo que inyecta las
  credenciales, leyéndolas de **`keystore.properties`**, que también está ignoreado
  (`.gitignore:30`). El `.jks` vive en `/keystores/`, ignoreado (`.gitignore:29`).
- O sea: el diseño es el correcto — credenciales en un archivo ignoreado, inyectadas
  en tiempo de prebuild al árbol nativo ignoreado.

> **Nota para `B3`:** que hoy esté ignoreado no dice nada de la historia. `B3` tiene
> que verificar explícitamente que `android/` y esa contraseña **nunca** entraron a un
> commit. Es el hilo más concreto que hereda.

> **Corrección a memoria:** `reference_essb-device-testing-and-automation` dice que el
> `signingConfig` de release "apunta a `signingConfigs.debug` (sin keystore de release
> dedicado)". Eso está **desactualizado** — hoy hay un keystore de upload real
> (`keystores/eternalbible-upload.jks`, alias `eternalbible-upload`) y
> `buildTypes.release` usa `signingConfigs.release` (`:120`).

---

## 💡 `R9-2` — el `.gitignore` raíz solo cubre `.env*.local`, no `.env`

**Severidad: baja** (hardening / defensa en profundidad), arreglo de una línea.

`.gitignore:48` es `.env*.local`. Eso deja **sin cubrir** un `.env` pelado:

```
IGNORED             functions/.env                 <- functions/.gitignore:13
IGNORED             functions/.env.local           <- functions/.gitignore:14
IGNORED             vercel/gift-code-redeem/.env   <- vercel/.../.gitignore:2 (.env*)
** NOT IGNORED **   .env
** NOT IGNORED **   .env.production
** NOT IGNORED **   scripts/.env
** NOT IGNORED **   src/.env
```

**Por qué NO es P0 aunque el repo sea público:** los dos únicos directorios que
manejan secretos de alto valor (`functions/` con la clave secreta de RevenueCat,
`vercel/` con el service account de Firebase **y** la clave secreta de RevenueCat) ya
tienen su propio `.gitignore` cubriendo `.env`. El hueco queda en la raíz y en
`scripts/`/`src/`, donde hoy no hay nada sensible: los `process.env` de `scripts/` son
rutas y flags (`DICTIONARY_V1_SRC_DIR`, `SQLITE3`, `A3_DUMP`), y la convención de Expo
para la raíz es `EXPO_PUBLIC_*`, que es público por diseño. Tampoco hay un
`.env.example` que empuje a nadie a crear uno.

**Por qué vale arreglarlo igual:** el radio de daño si alguna vez se equivoca es
total — un service account de Firebase salta _todas_ las reglas de Firestore, y la
clave secreta de RevenueCat permite otorgar entitlements gratis (o sea, dinero). Un
`.env` en la raíz es el nombre de archivo más natural que alguien elegiría, y basta un
`git add .`. **Arreglo sugerido (no aplicado):** cambiar `.env*.local` por `.env*` en
`.gitignore:48`, con `!.env.example` si algún día se quiere versionar una plantilla.

## ⚠️ Fuera del alcance del repo — para que Victor lo verifique

La `AIza…` de `google-services.json` es pública por diseño, pero su protección real
depende de dos cosas que **no se pueden verificar leyendo el repo**: (a) que las reglas
de Firestore no dejen nada abierto (eso es el área `B4`), y (b) que la clave tenga
restricciones en Google Cloud Console (restricción de app Android por package name +
huella SHA-1, y restricción de APIs). Vale que Victor lo confirme en la consola.

## Comandos usados

```
git ls-files -z | grep -zvE 'bible-data-.*\.ts$|\.db$|\.png$|...' > tracked.z
xargs -0a tracked.z grep -InE 'AIza[0-9A-Za-z_-]{35}'
xargs -0a tracked.z grep -InE '(-----BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_…|xox[baprs]-…|sk_live_)'
xargs -0a tracked.z grep -InE '(secret|password|apiKey|token|credential)\s*[:=]\s*"[A-Za-z0-9_\-./+]{16,}"'
git check-ignore -v .env .env.production functions/.env vercel/gift-code-redeem/.env
git ls-files android/ | wc -l
curl -H "Authorization: Bearer <token de git credential>" api.github.com/repos/VictorVidal7/EternalStoneBibleAppV4
```
