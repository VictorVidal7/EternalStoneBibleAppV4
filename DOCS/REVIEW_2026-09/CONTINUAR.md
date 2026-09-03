# ▶️ Continuar la revisión profunda 2026-09 — prompt para un chat NUEVO

> **Última actualización: 2026-09-03, fin de la sesión 2.** Actualiza este archivo al
> cerrar cada sesión (es parte del checkpoint, igual que `INDEX.md`).
>
> Este archivo es corto a propósito: su único trabajo es arrancar un chat nuevo sin que
> tenga que re-derivar nada. El **programa** está en
> [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md); el **estado vivo**, en [`INDEX.md`](INDEX.md).

---

## Mensaje para pegar en el chat nuevo

> Vamos a continuar la revisión profunda de la app. Lee
> `DOCS/REVIEW_2026-09/CONTINUAR.md` y sigue lo que dice ahí.

Eso es todo. Lo de abajo es para el chat que lo lea.

---

## 1. Qué leer, en este orden

1. **`DOCS/REVIEW_2026-09/INDEX.md` entero** — es fino a propósito (~280 líneas) y cabe
   en una sola lectura. Su línea `Frontera actual:` dice exactamente dónde seguir, y su
   bloque **"Ya conocido — NO reportar como hallazgo nuevo"** evita que registres como
   bug fresco algo ya sabido. **No re-derives el índice desde el código.**
2. **`DOCS/REVIEW_2026-09/REVIEW_PROMPT.md`** — el charter: protocolo (§1), prioridades
   (§2), las 4 dimensiones y su estándar de evidencia (§3).
3. **`DOCS/REVIEW_2026-09/BUGS.md`** — los 8 hallazgos abiertos (`R9-1`..`R9-8`), para
   no volver a reportarlos.
4. Solo el `detail/<slug>.md` del área que vayas a tocar. **No leas los 7 detalles de
   una** — para eso está el índice.
5. Memorias (por el índice `MEMORY.md`): `essb-64th-session-deep-review-2026-09-inventory`
   (las 2 sesiones hechas, con los aprendizajes de método),
   `reference_essb-device-testing-and-automation` (obligatoria si vas a Modo C),
   `feedback_essb-theme-and-navigation-patterns`, `feedback_essb-minimize-firestore-sync`,
   `feedback_essb-agent-worktree-isolation`, `feedback_essb-verify-agent-commits-before-merge`,
   `feedback_essb-theological-care`, `feedback_essb-memory-freshness`.

## 2. Estado esperado de git

`main` = `origin/main` = **`2f32aa9`** (o posterior), **árbol limpio**, 6 ramas locales
(`main`, `audio/tts-caps-hyphen`, `audio/tts-pronunciation-sweep`,
`chore/worklets-bundle-mode`, `feature/red-letter-web`,
`research/a4-chico-spanish-availability`). Si no coincide, dilo antes de empezar.

## 3. Dónde va la revisión

**138 filas** en el ledger: Modo A 46 · Modo B 11 · Modo C 71 · Modo D 10 (eran 137;
`B1b` se agregó en la sesión 2). **Cerradas: 6** (todo el Modo B P0). **Pendientes: 132.**

| Sesión | Qué se hizo                                | Commit    |
| ------ | ------------------------------------------ | --------- |
| 1      | Solo el inventario (charter §5)            | `18a3ffa` |
| 2      | Modo B P0 completo: `B1`, `B1b`, `B2`–`B5` | `2f32aa9` |

El Modo B P0 salió **limpio**: 0 vulnerabilidades alcanzables, 0 secretos filtrados
jamás (barrido de 5558/5558 blobs, incluidos los inalcanzables), 0 paths abiertos en
Firestore, 0 exposición explotable en CI. Los 8 hallazgos son trampas de remediación,
endurecimiento y código muerto — **ninguno es un bug de la app**.

## 4. Por dónde seguir

**Recomendado: `A1` (Modo A, P0)** — `PremiumContext` + RevenueCat + entitlements. Es
la fila de mayor valor que queda: dinero, y todavía sin revisar en ninguna dimensión.
Sin setup de entorno. Las 12 filas `A1`–`A12` son el bloque P0 del Modo A y son el
corazón de esta revisión.

Alternativas legítimas, según con qué margen cuentes:

- **`B6`–`B10`** (Modo B, P1/P2) si preferís terminar el Modo B de una: permisos
  Android, `npm outdated`, `expo-doctor`, deps sin usar, licencias. Baratas, sin
  entorno. Ojo: extendé `B9`/`B10` a `functions/` y `vercel/`, no solo a la raíz.
- **Modo C P0** (14 filas) si querés pagar el arranque de emulador una sola vez y
  ejercitar las rutas de dinero/identidad/datos en vivo. **Requiere** leer el recipe de
  `reference_essb-device-testing-and-automation` y usar **emulador + APK debug**, nunca
  el OnePlus de Victor.

**No mezcles modos en una misma sesión** (charter §3) — cada uno tiene su entorno.

## 5. Reglas que ya costaron caro — no las re-descubras

- **Solo revisar y reportar. NO se toca código de la app.** Lo único que se escribe es
  el ledger. Las mejoras del Modo D se **redactan**, no se aplican.
- **Checkpoint por área, en el momento:** `detail/<slug>.md` + la fila del índice + la
  entrada en `BUGS.md` **antes** de pasar a la siguiente área. Si la sesión se corta, lo
  guardado persiste. Deja la fila en `EN CURSO` si te quedás sin margen a mitad.
- **Prettier manda sobre el ledger.** `format:check` de CI cubre `**/*.md` y
  `.prettierignore` no excluye `DOCS/`. Corré
  `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` después de cada checkpoint.
  Prettier **rellena cada celda de tabla al ancho de la más ancha** — por eso la columna
  `Área` del índice está capada a ~55 chars y `Detalle` es un slug pelón. No metas prosa
  en las tablas del índice.
- **`NUNCA npm audit fix --force` en este repo.** Propone downgrades que romperían la
  app en dos lugares (`R9-1`, `R9-8`). `npm audit fix` a secas es seguro.
- **El reflejo de `overrides` no siempre sirve:** verificá si el parche es ESM-puro
  antes de recomendarlo. `decode-uri-component@0.5.0` es ESM-only y rompería Metro;
  `uuid@11.1.1` trae build dual y la raíz ya lo corre en verde. Mismo patrón, veredictos
  opuestos.
- **Verificá contra `git log` antes de afirmar un estado que venga de memoria o del
  charter.** La sesión 1 encontró que la semilla BUG-10 del charter ya estaba arreglada
  (`b17ec99`), y la sesión 2 encontró que la memoria de device-testing miente sobre el
  `signingConfig` de release. Un `grep` de 10 segundos evitó sembrar un bug falso.
- **Antes de creerle a un conteo, verificá qué extrajiste.** En `B3`, una extracción mal
  hecha agarró la contraseña de _debug_ (`'android'`, 7 chars) y devolvió 43 falsos
  positivos.
- **Pedí el OK a Victor antes de commitear el ledger** (charter §5.4/§7). Ya lo dio dos
  veces con el formato **commit + push directo a `main`** (no rama, no solo-local), así
  que el formato está fijado — pero la autorización es por sesión, no se hereda.
- **Si despachás agentes:** `isolation: "worktree"` en **todos**, incluso los de solo
  lectura; cada uno escribe **únicamente** a `DOCS/REVIEW_2026-09/_scratch/<área>.md`
  (ya está en `.gitignore`), nunca a `INDEX.md`; el orquestador fusiona todo en **una**
  pasada al final y verifica el estado real de cada worktree en vez de confiar en el
  "completado". El fan-out necesita que **Victor lo pida explícitamente**.
- **Actualizá memoria y este archivo al cerrar la sesión** (`feedback_essb-memory-freshness`).

## 6. Hechos duros que ya no hay que volver a averiguar

- **El repo de GitHub es PÚBLICO** (`VictorVidal7/EternalStoneBibleAppV4`). Cualquier
  cosa commiteada es material publicado.
- **0 secretos de GitHub Actions** en el repo y `default_workflow_permissions: "read"`
  → el radio de daño de un hallazgo de CI es casi nulo.
- **Las reglas de Firestore NO están versionadas** (no hay `firestore.rules`, ni sección
  en `firebase.json`). Son correctas (default-deny + `request.auth.uid == uid`) y su
  texto vivo está **capturado íntegro** en `detail/B4-reglas-firestore-storage.md`. Para
  leerlas de nuevo, usá el patrón de `reference_essb-firebase-cli-token-for-rules-api`.
- **Todas las rutas Firestore del cliente van bajo `users/{uid}/`.**
  `giftCodes` es de raíz y está deliberadamente **fuera** de las reglas → ningún cliente
  puede enumerar códigos; solo los backends con Admin SDK. **Está bien así.**
- **La app llama al backend de Vercel** (`giftCodeService.ts:44` →
  `essb-gift-redeem.vercel.app/api/redeem`). **`functions/` es código muerto** que
  duplica la lógica de canje (`R9-7`, decisión pendiente de Victor).
- **Firebase Storage no se usa** (paquete no instalado, 0 usos).
- **`TogetherContext` no toca Firestore** — los grupos de "Juntos" son locales.
- **`/android` está gitignoreado** (0 archivos trackeados). La contraseña del keystore
  de release vive ahí y en `keystore.properties`, ambos fuera de git, y **nunca entró al
  historial** (verificado sobre los 5558 blobs).
- **CI corre Node 20**, la máquina de Victor tiene **Node 24.11.1**, y `package.json`
  **no declara `engines`**. Pendiente de mirar en `B8`.

## 7. Abierto, sin relación con la revisión

De `essb-master-backlog` — **no** son hallazgos de esta revisión, no los registres como
tales: lanzamiento público en Play Store (Track 2, bloqueado por la puerta de Google de
12 testers × 14 días; Victor dijo "hablémoslo" y **sigue sin empezar**) · licencia
NLT/Tyndale sin respuesta · registro de marca IMPI · mapa geográfico real para "Rutas
bíblicas" (diferido a propósito) · merge de `chore/release-3.2.62` a `main`.
