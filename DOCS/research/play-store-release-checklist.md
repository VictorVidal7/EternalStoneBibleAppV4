# Play Store release-readiness checklist

Prepared 2026-08-31. Sources: session memory files, the repo at `main` (`74a2d4c`),
and a read-only pass over the live Play Console (Victor's logged-in Chrome session).

---

## 0. Read this first — what "ship the next release" actually means

The brief assumed "the app is ALREADY LIVE (v72 / 3.2.60)". **That is not accurate.**
Verified live in Play Console on 2026-08-31:

| Fact                           | Value (from Console)                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| App status                     | **Borrador (Draft)**                                                                                     |
| Distribution                   | **Prueba interna (Internal Testing) only** — segment "Activo"                                            |
| Live build on that track       | **versionCode 73 / 3.2.61**, released 25 Aug 2026, marked "Sin revisar"                                  |
| External users                 | **0**                                                                                                    |
| Production                     | **Inactivo**                                                                                             |
| Submitted for review, ever     | **No** — "Aún no se envió a revisión"; temp package name still `com.eternalstonebible.app (unreviewed3)` |
| Account-level policy problems  | None                                                                                                     |
| Android developer verification | Done (account banner: "Todas tus apps se registraron correctamente…")                                    |

So there are **two different releases** the request could mean. They are on very
different timelines:

### Track 1 — Update the Internal Testing build (achievable in ~1 day)

Bump to **versionCode 74 / 3.2.62**, build the AAB, upload to Prueba interna.
This is exactly what every prior release session did (v70→71→72→73). No Google
review wait for internal testing. **This is the only "next few days" option.**
It ships the ~65 commits accumulated on `main` since 3.2.61 — most importantly the
**OnePlus/x86 SoLoader crash mitigation** that has been merged since the 48th
session but never reached a build.

### Track 2 — Public production launch (NOT achievable in a few days)

Play Console **hard-blocks** production for this account+app until:

- A **closed testing** track is published, **and**
- **≥ 12 testers opt in** (Console currently shows **"actualmente, 0 verificadores aceptaron participar"**), **and**
- The closed test runs **≥ 14 consecutive days**, **then**
- "Solicitar acceso a producción" (currently greyed out) becomes available and Google grants it, **then**
- A production release is created + submitted + passes Google review (days).

Realistic earliest public-production date ≈ **today + 14 days + review + rollout**,
and only if the closed test is started today with 12 real opted-in testers.

**ACTION — NEEDS-VICTOR:** confirm which track. Everything below is written for
**Track 1** (the few-days option); Track 2's extra steps are in section 6.

---

## 1. Code / repo prep (Track 1)

### 1.1 — TODO / BLOCKING — Clean the uncommitted TTS diagnostic out of the main working tree

`C:\projects\EternalStoneBibleAppV4\src\lib\speech\narration.ts` (and its test) has an
**uncommitted** patch staged in the _main_ working tree (not in git history). It contains
a block explicitly commented **"TEMP DIAGNOSTIC — NOT FOR MERGE"** that rewrites
`alabadle` → `alabad le`. Per the 56th-session memory this substitution **breaks the
karaoke word-highlight `charIndex` invariant** for the rest of any verse containing that
word — a user-visible regression.

`expo prebuild` + `gradlew bundleRelease` read the **working tree, not HEAD**. If Victor
builds from the main checkout in its current state, this ships.

- **Action (pick one):**
  - `cd C:\projects\EternalStoneBibleAppV4 && git stash push -- src/lib/speech/narration.ts __tests__/narration.test.ts` (simplest — parks the whole patch), **or**
  - keep only the safe parts (b: 5 ALL-CAPS divine-name tokens; c: hyphen→space) by committing those and deleting the `TEMP DIAGNOSTIC` block, per the analysis in `DOCS/TTS_PRONUNCIATION_SWEEP.md` / branch `audio/tts-pronunciation-sweep` — **only if Victor has since device-tested them**; otherwise stash everything.
- **Verify:** `git -C C:\projects\EternalStoneBibleAppV4 status --short` shows a clean tree before running `prebuild`.

### 1.2 — TODO — Version bump 73 → 74 / 3.2.61 → 3.2.62

- **Command:** `npm run version:bump` (from repo root; defaults to `patch`)
- **What it does** (`scripts/bump-version.js`): edits **`app.json`** (`expo.version` `3.2.61`→`3.2.62`, `expo.android.versionCode` `73`→`74`) and **`package.json`** (`version`). It deliberately does **not** touch `android/app/build.gradle` (gitignored, regenerated from `app.json` by `expo prebuild`). Do not hand-edit gradle.
- Standing rule (from monetization memory): **always bump on every release build**, even a pure-content one — a same-versionCode upload blocks the Play update path.
- Commit the bump (`git commit -am "chore(release): bump to 3.2.62 / versionCode 74"`).

### 1.3 — TODO — Green gate before building

- `npm ci --legacy-peer-deps` (standing practice after any parallel-agent merges — avoids the `node_modules/.bin` corruption pattern)
- `npm run validate` (= `tsc --noEmit` + eslint + `prettier --check` + jest). Last known-green on `main`: **351 suites / 3975 tests** (56th session).

### 1.4 — DONE — SoLoader / OnePlus ABI mitigation is on `main`

- Commit `9a985d4` (merge `58b5ead`), 48th session. Confirmed **ancestor of `74a2d4c` (HEAD)**.
- What it changed: added `expo-build-properties` to `app.json` `plugins` with
  `"android": { "buildArchs": ["armeabi-v7a", "arm64-v8a"] }` — drops the `x86` / `x86_64`
  native splits. No real phone is x86; this removes the only source of the wrong-ABI
  split that was crashing real OnePlus/Android-11 devices (`SoLoaderDSONotFoundError`
  in `MainApplication.onCreate`).
- **Needs nothing at build time** beyond running `expo prebuild` (so the plugin applies).
- Current `app.json` (worktree `74a2d4c`) confirmed to contain the `buildArchs` block. ✅

---

## 2. Native release build (AAB) (Track 1)

### 2.1 — Environment / signing — DONE (present, nothing to do)

- Upload keystore: `C:\projects\EternalStoneBibleAppV4\keystores\eternalbible-upload.jks` (present)
- `C:\projects\EternalStoneBibleAppV4\keystore.properties` (present; `RELEASE_KEY_ALIAS=eternalbible-upload`)
- Both are **gitignored** and exist only on Victor's machine — **back them up** (losing either = the app can never be updated on Play again).
- `plugins/with-release-signing.js` re-applies real release signing into `android/app/build.gradle` on every `expo prebuild`. If `keystore.properties` is absent it silently falls back to debug signing — so a build that "succeeds" can still be debug-signed; verify the cert (2.4).
- Known production cert SHA-256: `A9:89:EC:46:BA:8A:53:25:45:FC:57:8E:1D:C4:83:CE:62:F1:14:D4:85:CF:D1:0E:55:F0:65:84:E7:39:EE:8D`

### 2.2 — TODO — Build from the MAIN checkout, not a worktree

Recommendation: run the build in `C:\projects\EternalStoneBibleAppV4` directly.
Building from a `.claude/worktrees/…` path hits the Windows MAX_PATH (260-char) limit at
the CMake/ninja step. _If_ a worktree build is ever unavoidable, first run
`subst W: "C:\projects\EternalStoneBibleAppV4\.claude\worktrees"` and build from
`W:\<folder>\android` (see `reference_essb-worktree-windows-maxpath`). Not needed for
the recommended path.

### 2.3 — TODO — Build commands

```
cd C:\projects\EternalStoneBibleAppV4
npx expo prebuild --platform android          # regenerates gitignored android/ from app.json; applies with-release-signing + buildArchs
cd android
./gradlew bundleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
```

- **NO-CLEAN** is load-bearing: a clean build (`--clean` prebuild, or wiping `.cxx`) fails at the CMake step on this machine. Do not add `--clean`.
- The `-PreactNativeArchitectures=…` flag is now **redundant** with `buildArchs` in `app.json` but harmless — leave it for belt-and-braces.
- Output: `android/app/build/outputs/bundle/release/app-release.aab` (~80 MB, ARM-only).
- (`assembleRelease` instead of `bundleRelease` produces an APK for local sideload testing — Play needs the **AAB**.)

### 2.4 — TODO — Verify the artifact before upload

- ABI: `unzip -l android/app/build/outputs/bundle/release/app-release.aab | grep -E 'lib/x86'` → **must return nothing** (proves the ABI mitigation took).
  `… | grep -E 'lib/arm'` → should list both `arm64-v8a` and `armeabi-v7a`.
- Signature: extract `META-INF/*.RSA` from the AAB and confirm its SHA-256 matches the known production cert above (past sessions used `keytool -printcert` / `openssl pkcs7`). Must **not** be debug-signed.
- `versionCode=74` / `versionName=3.2.62` (unzip `base/manifest/AndroidManifest.xml` or check the Console after upload).

---

## 3. Upload to Play Console (Track 1)

### 3.1 — TODO — Upload the AAB to **Prueba interna** (Internal Testing)

- Console path: **Prueba y lanza → Pruebas → Prueba interna → "Crear una versión nueva"**
  (`…/app/4972179934686225607/tracks/internal-testing`)
- **The >10 MB drag-and-drop of the .aab must be done by Victor himself** — browser
  automation's `file_upload` caps at 10 MB. Claude can drive every other step.
- App internal id `4972179934686225607`, dev account `6778888350565253294`, internal-track id `4701642241574715324`.
- Internal-tester opt-in link (already active): `https://play.google.com/apps/internaltest/4701642241574715324`

### 3.2 — TODO — Release notes ("Novedades") — draft below, Victor to approve

Even internal-testing releases take release notes. Suggested `es-419`:

```
• Diccionario: nueva entrada de doble perspectiva "ELECCIÓN" (calvinismo y arminianismo).
• Teología: 15 entradas nuevas sobre los atributos de Dios (ahora 18 en total).
• ¿Sabías qué?: 17 datos nuevos, algunos con acceso al estudio de palabras.
• Constelación de referencias: toca una estrella para expandir sus referencias cruzadas.
• Mesa de preparación: etiqueta y filtro por tipo de sermón.
• Memorización: el modo "completar" ahora marca cada espacio según tu acierto.
• Correcciones: los avisos ya no bloquean la pantalla; paneles de ventanas más legibles;
  rejilla de temas de color pareja; varias mejoras de pronunciación del audio.
```

### 3.3 — TODO — Roll out

- "Guardar" → "Revisar la versión" → "Iniciar el lanzamiento a Prueba interna".
- Internal testing = 100% immediately, no staged rollout, no Google review wait.
- Play Console page re-renders at a shifted viewport scale after clicks — use element-reference clicks (`find`) not raw coordinates, and re-screenshot before each click (documented recurring quirk).

### 3.4 — OPTIONAL — Also submit the pending declaration changes for review

The **Descripción general de la publicación** page shows **"Enviar 8 cambios a revisión"**
(8 completed App-Content declaration edits staged but never submitted). Submitting them
does not publish anything to production; it just clears the "unreviewed" state and the
temp package name. Not required for a Track-1 internal update — do it whenever, or bundle
it with Track 2.

---

## 4. Play policy / compliance items (recurring) — mostly DONE

| Item                           | Status          | Evidence                                                                                                                                                                                                        |
| ------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target API level               | **DONE**        | Expo SDK 57 → `targetSdkVersion 36` / `compileSdkVersion 36`; confirmed via `aapt dump badging` in a prior session; Console showed no warning                                                                   |
| Data safety form               | **DONE**        | App Content → "Ya estás al día". Collected: name/email/user-id (optional), purchase history + crash logs + device IDs (automatic); all "Recopilados: Sí / Compartidos: No" (Firebase & RevenueCat = processors) |
| Ads declaration                | **DONE**        | "No, mi app no contiene anuncios" — no ad SDK in `package.json`, no `logEvent`                                                                                                                                  |
| Content rating (IARC)          | **DONE**        | ESRB E10+ / PEGI 3 / IARC Generic 3+                                                                                                                                                                            |
| Target audience                | **DONE**        | 13-15 / 16-17 / 18+ (no under-13; COPPA reasoning, advisor-confirmed)                                                                                                                                           |
| Financial features             | **DONE**        | "Mi app no ofrece ninguna función financiera" — offering/donation via **Google Play Billing only** (RevenueCat is the wrapper). No separate financial-services declaration needed                               |
| In-app purchases present       | **DONE**        | "Detalles de acceso" = restricted-by-payment (the ofrenda unlock); reviewer test instructions written; License Testing list (`victorvdu@gmail.com`) wired to the internal track                                 |
| Government / Health apps       | **DONE**        | Both declared "ninguna"                                                                                                                                                                                         |
| Privacy policy                 | **DONE / LIVE** | `https://eternalstonebible.github.io/privacidad/` — ES+EN, names controller, describes in-app deletion (Ajustes → Cuenta → Eliminar cuenta) + email fallback                                                    |
| Account deletion               | **DONE**        | `deleteAccountData.ts` + `AuthContext.deleteAccount()` shipped                                                                                                                                                  |
| Android developer verification | **DONE**        | Package `com.eternalstonebible.app` "Registrada"; identity auto-populated; account banner confirms                                                                                                              |
| RevenueCat backend             | **DONE / LIVE** | `extras` entitlement, 7 priced products, valid service-account credentials, real purchase + free test purchase both verified on-device (41st/43rd/48th sessions)                                                |

Nothing in this section is expected to block a Track-1 upload. For Track 2, Google
re-checks all of it at review time.

---

## 5. Store listing — DONE (correcting stale memory)

The July launch-prep memory says graphics "need to be freshly created / nothing usable
exists". **That is stale.** Verified live 2026-08-31 in **Ficha de Play Store predeterminada**
(`…/main-store-listing`) — header reads **"Lista para enviar a revisión"**:

| Asset                      | Status                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| App name                   | ✅ "Eternal Stone Bible"                                                                                        |
| Short description          | ✅ "Lee, estudia y memoriza la Palabra: RVR1960 con letras rojas, planes y logros." (76/80)                     |
| Full description           | ✅ ~1,164 chars, mentions RVR1960 + WEB + red-letter + downloadable versions                                    |
| App icon                   | ✅ present                                                                                                      |
| Feature graphic (1024×500) | ✅ present                                                                                                      |
| Phone screenshots          | ✅ present (≥3)                                                                                                 |
| Promo video                | ⬜ empty — **optional**, no asterisk. Backlog idea (brother's Seedance sub, needs a YouTube URL). Not blocking. |
| Category / contact details | ✅ done (41st session)                                                                                          |

- **OPTIONAL / NICE-TO-HAVE:** the screenshots date to ~19 Aug and predate the Diccionario
  (11→12), Teología hub (3→18), and ¿Sabías qué? growth. They still accurately show the
  reader / study UI. Refresh only if Victor wants the new content represented — not a
  blocker for either track, and not required by Google.

---

## 6. Track 2 only — extra steps for a public production launch (BLOCKED / calendar-gated)

1. **TODO — Create & publish a Closed testing track** (`…/closed-testing`). Can reuse the same AAB.
2. **BLOCKED — Recruit ≥ 12 testers who opt in.** Console shows **0** today. This is the binding constraint.
3. **BLOCKED — Run the closed test ≥ 14 consecutive days.** Hard calendar floor.
4. **BLOCKED — "Solicitar acceso a producción"** (button greyed out until 2 + 3 are satisfied) + answer Google's questionnaire + Google grants access.
5. **TODO — Submit the 8 pending declaration changes** ("Enviar N cambios a revisión") if not already done.
6. **TODO — Create a Production release**, staged rollout (start ~10–20%), submit for review.
7. **BLOCKED — Google review** of a first-time production submission (typically a few days, can be longer).
8. **TODO — Monitor** Android vitals / policy status / reviews during ramp; increase rollout %.

There is no way to compress steps 2–4 into "a few days".

---

## 7. Post-release (after a Track-1 upload)

1. **NEEDS-VICTOR — On-device verify the SoLoader/ABI fix.** The 48th session explicitly
   deferred real-device verification "to the next real Play release" — **this is that
   release.** After the internal-testing update installs, cold-launch on Victor's
   **OnePlus 11** (wireless ADB) and confirm no `SoLoaderDSONotFoundError` / clean start.
   Note: `adb install -r` of a local build over the Play build fails
   (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`, different signing key) — update must come
   through the Play Store app on the device.
2. **TODO — Update the two memory files** (`essb-master-backlog`, `essb-play-store-monetization-live-setup`) with the shipped versionCode and date.
3. **OPTIONAL — Tag the release** (`git tag v3.2.62` — the repo currently has **no** release tags).
4. `CHANGELOG.md` is **not** part of the release process (last entry is `[4.0.0] 2025-11-14`, unrelated to the 3.2.x train). Ignore or retire it.

---

## 8. Known-shipping content defects — NEEDS-VICTOR (not build blockers)

- **`assets/bible-seed.db` — 2 Reyes 22:9 (RVR1960)** has an LLM-generation artifact
  appended to the verse text ("Claro, aquí tienes el texto continuado de 2 Reyes
  22:10-20…"). Found in the 56th session, **not fixed**. It is the only such artifact in
  RVR1960. It will ship in any build made from current `main`. Victor's call: hold the
  release for a one-verse fix, or ship and patch next cycle. Also decide whether the
  GitHub Pages content packs carry the same corruption.

---

## 9. One-line status roll-up

| #   | Item                                                                             | Status                                       |
| --- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| 0   | Decide Track 1 (internal, days) vs Track 2 (production, weeks)                   | **NEEDS-VICTOR**                             |
| 1.1 | Stash/clean uncommitted TTS diagnostic in main tree                              | **TODO — blocking**                          |
| 1.2 | `npm run version:bump` → 74 / 3.2.62, commit                                     | **TODO**                                     |
| 1.3 | `npm ci --legacy-peer-deps` + `npm run validate` green                           | **TODO**                                     |
| 1.4 | SoLoader/ABI mitigation on `main`                                                | **DONE** (`58b5ead`, ancestor of HEAD)       |
| 2   | `expo prebuild` + `gradlew bundleRelease` (NO-CLEAN, from main tree)             | **TODO**                                     |
| 2.4 | Verify AAB: no x86 libs, production signature, versionCode 74                    | **TODO**                                     |
| 3.1 | Victor uploads .aab to Prueba interna                                            | **TODO — Victor (drag-drop)**                |
| 3.2 | Release notes                                                                    | **TODO** (draft in §3.2)                     |
| 3.3 | Roll out to Prueba interna (100%, no review wait)                                | **TODO**                                     |
| 3.4 | Submit 8 pending declaration changes for review                                  | **OPTIONAL**                                 |
| 4   | Target API / data safety / ads / rating / financial / privacy / dev-verification | **DONE**                                     |
| 5   | Store listing + graphics ("Lista para enviar a revisión")                        | **DONE** (memory was stale)                  |
| 5b  | Refresh screenshots for new Diccionario/Teología content                         | **OPTIONAL**                                 |
| 6   | Closed test: 12 testers + 14 days + production access                            | **BLOCKED** (0 testers today) — Track 2 only |
| 7.1 | On-device verify SoLoader fix on OnePlus 11                                      | **NEEDS-VICTOR** (post-upload)               |
| 8   | 2 Reyes 22:9 corrupted seed text                                                 | **NEEDS-VICTOR** (ships if not held)         |
