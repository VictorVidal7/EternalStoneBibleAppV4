# ▶️ Continuar la revisión profunda 2026-09 — prompt para un chat NUEVO

> **Última actualización: 2026-09-03, fin de la sesión 3.** Actualiza este archivo al
> cerrar cada sesión (es parte del checkpoint, igual que `INDEX.md`).
>
> Este archivo es corto a propósito: su único trabajo es arrancar un chat nuevo sin que
> tenga que re-derivar nada. El **programa** está en
> [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md); el **estado vivo**, en [`INDEX.md`](INDEX.md).

---

## Mensaje para pegar en el chat nuevo

Al cerrar la sesión 3 hay una bifurcación real. Elegí **uno** de los dos:

**(a) Seguir revisando** — continúa el programa donde quedó (`A4`, `SyncEngine`):

> Vamos a continuar la revisión profunda de la app. Lee
> `DOCS/REVIEW_2026-09/CONTINUAR.md` y sigue lo que dice ahí.

**(b) Empezar a arreglar** — con 9 P0 abiertos es una opción defendible, y es una sesión
de **otro** protocolo: sí se toca código de la app, con rama y gates, al revés que la
revisión:

> Quiero arreglar los bugs P0 que encontró la revisión profunda, no seguir revisando.
> Lee `DOCS/REVIEW_2026-09/CONTINUAR.md` para el contexto y `DOCS/REVIEW_2026-09/BUGS.md`
> para los hallazgos. Propone un orden de ataque y empezá por el primero. Ojo: esta sesión
> SÍ toca código de la app, así que va en rama con los gates en verde — no aplica el
> "solo revisar y reportar" del charter.

Eso es todo. Lo de abajo es para el chat que lo lea.

---

## 1. Qué leer, en este orden

1. **`DOCS/REVIEW_2026-09/INDEX.md` entero** — es fino a propósito (~280 líneas) y cabe
   en una sola lectura. Su línea `Frontera actual:` dice exactamente dónde seguir, y su
   bloque **"Ya conocido — NO reportar como hallazgo nuevo"** evita que registres como
   bug fresco algo ya sabido. **No re-derives el índice desde el código.**
2. **`DOCS/REVIEW_2026-09/REVIEW_PROMPT.md`** — el charter: protocolo (§1), prioridades
   (§2), las 4 dimensiones y su estándar de evidencia (§3).
3. **`DOCS/REVIEW_2026-09/BUGS.md`** — los **32** hallazgos (`R9-1`..`R9-32`), para no
   volver a reportarlos. Ya son 446 líneas: **no hace falta leerlo entero**, la sección
   P0 va primero y es la que importa.
   - `R9-1`..`R9-8` (sesión 2) son propuestas de endurecimiento, **no** bugs de la app;
     `R9-7` ya está RESUELTO (`af64ce1`).
   - **`R9-9`..`R9-32` (sesión 3) SÍ son bugs reales, 9 de ellos P0** — dinero,
     identidad, fuga entre cuentas y pérdida de datos. Léelos antes de tocar nada de
     premium, auth, sync o respaldo.
   - **Matiz importante sobre `R9-13`** (el crash del lector web): está en `main` pero
     **NO en producción** — el último deploy web es 5 días anterior a la regresión. Es
     **bloqueante del próximo `firebase deploy`**, no un incendio. No lo priorices por
     encima de los de pérdida de datos.
4. Solo el `detail/<slug>.md` del área que vayas a tocar. Ya hay **12** (6 del Modo A, 6
   del Modo B). **No los leas todos** — para eso está el índice.
5. Memorias (por el índice `MEMORY.md`): **`essb-65th-session-deep-review-modo-a-p0`**
   (la sesión más reciente y la más cargada de aprendizajes de método — empezá por ahí),
   `essb-64th-session-deep-review-2026-09-inventory` (sesiones 1-2: el inventario y todo
   el Modo B), `reference_essb-device-testing-and-automation` (**obligatoria** si vas a
   Modo C), `feedback_essb-theme-and-navigation-patterns`,
   `feedback_essb-minimize-firestore-sync`, `feedback_essb-agent-worktree-isolation`,
   `feedback_essb-verify-agent-commits-before-merge`, `feedback_essb-theological-care`,
   `feedback_essb-memory-freshness`. Si vas a mirar si algo está desplegado,
   `reference_essb-firebase-cli-token-for-rules-api` (sirve para Rules **y** Hosting).

## 2. Estado esperado de git

`main` = `origin/main`, **árbol limpio**, 6 ramas locales (`main`,
`audio/tts-caps-hyphen`, `audio/tts-pronunciation-sweep`,
`chore/worklets-bundle-mode`, `feature/red-letter-web`,
`research/a4-chico-spanish-availability`). Si no coincide, dilo antes de empezar.
La revisión va en `18a3ffa` → `2f32aa9` → `8b64c11` → `af64ce1` → `299a76c` →
`b5a9afa` → `6ac10e3` → **`894deb5`**; la sesión 3 cerró en ese último.

## 3. Dónde va la revisión

**138 filas** en el ledger: Modo A 46 · Modo B 11 · Modo C 71 · Modo D 10.
**Cerradas: 12** (todo el Modo B P0 + 6 filas del Modo A P0). **Pendientes: 126.**

| Sesión | Qué se hizo                                     | Commit    |
| ------ | ----------------------------------------------- | --------- |
| 1      | Solo el inventario (charter §5)                 | `18a3ffa` |
| 2      | Modo B P0 completo: `B1`, `B1b`, `B2`–`B5`      | `2f32aa9` |
| 2      | Este prompt + correcciones al charter           | `8b64c11` |
| 2      | `R9-7` resuelto: `functions/` documentada       | `af64ce1` |
| 3      | `A1` (premium/RevenueCat) — `R9-9`, `R9-10`     | `299a76c` |
| 3      | `A2`, `A3`, `A5`, `A6`, `A7` — `R9-11`..`R9-32` | `b5a9afa` |
| 3      | Este prompt: cierre de la sesión 3              | `6ac10e3` |
| 3      | Las 2 preguntas abiertas, respondidas           | `894deb5` |

El Modo B P0 salió **limpio**: 0 vulnerabilidades alcanzables, 0 secretos filtrados
jamás (barrido de 5558/5558 blobs), 0 paths abiertos en Firestore, 0 exposición
explotable en CI. Sus 8 hallazgos son endurecimiento, no bugs de la app.

**El Modo A P0 salió lo contrario: 24 hallazgos, 9 de ellos P0 reales.** Los más graves,
por si hay que priorizar arreglos: `R9-27`/`R9-28` (dos caminos por los que **restaurar un
respaldo borra datos**), `R9-22`/`R9-23` (fuga de datos **entre cuentas** en un dispositivo
compartido), `R9-9` (premium que sobrevive al reembolso), y `R9-13` (el lector **web**
crashea en el primer render — **no está en producción**, el último deploy es 5 días
anterior a la regresión, pero es **bloqueante del próximo deploy web**). Detalle por fila
en `detail/A*.md`.

**El patrón que los une, y que conviene tener presente al revisar lo que queda:** las
tres compuertas verdes (`tsc`, jest, CI) comparten puntos ciegos — la **resolución de
módulos por plataforma** (`tsc` y jest resuelven siempre al archivo nativo) y la
**dirección inversa** de cada flujo (quitar acceso, restaurar, cambiar de cuenta). Casi
todos los P0 estaban ahí. Vale más buscar en esos ejes que releer código feliz.

## 4. Por dónde seguir

**Recomendado: `A4` (Modo A, P0)** — `SyncEngine.ts` (1378 L) y las colas de escritura.
Es donde ya apuntan **dos** hallazgos de la sesión 3 (`R9-11` la entrada de cola que se
descarta durante un flush, `R9-22` la cola sin namespace de uid), así que se entra con la
mitad del terreno mapeado; falta su alcance propio: reintentos y backoff, resolución de
conflictos, cursores, hidratación, y el coste de lectura de `onSnapshot` (20 hits, que
`A5` dejó explícitamente fuera). Después, `A8`–`A12` cierran el bloque P0 del Modo A.

Alternativas legítimas, según con qué margen cuentes:

- **`B6`–`B10`** (Modo B, P1/P2) si preferís terminar el Modo B de una: permisos
  Android, `npm outdated`, `expo-doctor`, deps sin usar, licencias. Baratas, sin
  entorno. Ojo: extendé `B9`/`B10` a `functions/` y `vercel/`, no solo a la raíz.
- **Una sesión de ARREGLOS** en vez de más revisión. Con 9 P0 abiertos —dos de ellos de
  pérdida de datos al restaurar un respaldo, dos de fuga entre cuentas— es una opción
  defendible, y el charter la contempla como sesión aparte con sus ramas (§1). Es
  decisión de Victor. Orden sugerido si se elige esta vía: `R9-27`/`R9-28` (respaldo,
  pérdida de datos irreversible) → `R9-22`/`R9-23` (fuga entre cuentas) → `R9-9`
  (dinero) → `R9-13` **antes de volver a desplegar la web**.
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
- **Un hallazgo de "código muerto" tiene que buscar POR QUÉ sigue ahí antes de
  recomendar borrarlo.** `R9-7` recomendó borrar `functions/` sin ver que la
  justificación estaba a un `grep` de distancia, en el archivo que consume el endpoint
  (`giftCodeService.ts` documenta que no se despliega a propósito por el tema Blaze).
  Se detectó al mirar el objetivo antes de borrar, que es justo para lo que sirve ese
  paso.
- **Verificá contra `git log` antes de afirmar un estado que venga de memoria o del
  charter.** La sesión 1 encontró que la semilla BUG-10 del charter ya estaba arreglada
  (`b17ec99`), y la sesión 2 encontró que la memoria de device-testing miente sobre el
  `signingConfig` de release. Un `grep` de 10 segundos evitó sembrar un bug falso.
- **Antes de creerle a un conteo, verificá qué extrajiste.** En `B3`, una extracción mal
  hecha agarró la contraseña de _debug_ (`'android'`, 7 chars) y devolvió 43 falsos
  positivos.
- **Pedí el OK a Victor antes de commitear el ledger** (charter §5.4/§7). Ya lo dio
  **tres** veces con el formato **commit + push directo a `main`** (no rama, no
  solo-local), así que el formato está fijado — pero la autorización es por sesión, no se
  hereda.
- **Si despachás agentes:** `isolation: "worktree"` en **todos**, incluso los de solo
  lectura; cada uno escribe **únicamente** a `DOCS/REVIEW_2026-09/_scratch/<área>.md`
  (ya está en `.gitignore`), nunca a `INDEX.md`; el orquestador fusiona todo en **una**
  pasada al final y verifica el estado real de cada worktree en vez de confiar en el
  "completado". El fan-out necesita que **Victor lo pida explícitamente**.
- **Tamaño del fan-out: 4, no 11.** La sesión 3 lanzó 11 agentes Opus a la vez y **los 11
  murieron por límite de uso** sin escribir una línea. Relanzados en tanda de 4, los 4
  completaron. Pedile al agente además que **devuelva el informe íntegro en su mensaje
  final**, no solo que escriba el `_scratch/`: el archivo queda en **su** worktree, que se
  limpia solo, así que el informe del mensaje es el canal fiable.
- **Los agentes aciertan el mecanismo y fallan el detalle: re-verificá lo portante.** En
  la sesión 3 los 4 informes fueron buenos, pero el de `A6` afirmó que un tipo era
  no-anulable (era `useBibleVersionOptional() ?? {}`) y que una pantalla importaba un
  símbolo cuando en realidad solo renderizaba el componente que lo importa. Ninguna de las
  dos cambiaba la conclusión, pero sí el radio de impacto. **Comprobá a mano cada
  afirmación de la que cuelgue un P0** antes de escribirla en el ledger; cuestan un `grep`
  cada una.
- **`_scratch/` está gitignoreado pero NO está jest-ignoreado.** El `testMatch` de
  `jest.config.js` incluye `**/?(*.)+(spec|test).[jt]s?(x)` y `testPathIgnorePatterns`
  solo excluye `node_modules/` y `.claude/`. Un `*.test.tsx` olvidado ahí **se suma a la
  suite** de `npm test` sin aparecer nunca en `git status`. Si escribís sondas
  ejecutables (ver abajo), borralas al cerrar la fila.
- **Una sonda ejecutable vale más que una lectura, y `_scratch/` la hace gratis.** En
  `A1`, la lectura sugería el bug pero la sonda lo **probó** y de paso mostró que era
  asimétrico (la concesión se propaga, la revocación no) — un matiz que la lectura sola
  no daba. Se puede montar el contexto real con el mock oficial del SDK sin tocar código
  de la app ni ensuciar el árbol. No aplica al Modo B ni a agentes en worktree (esos no
  tienen `node_modules`).
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
  `essb-gift-redeem.vercel.app/api/redeem`). **`functions/` NO está desplegada, y es a
  propósito** — Cloud Functions exige plan Blaze, que pasa el proyecto Firebase entero a
  facturación con sobrecosto. Se conserva como respaldo y está etiquetada en
  `functions/README.md`; su sección se quitó de `firebase.json` para que un
  `firebase deploy` no la toque. **No propongas borrarla de nuevo** (`R9-7`, resuelto).
- **Firebase Storage no se usa** (paquete no instalado, 0 usos).
- **`TogetherContext` no toca Firestore** — los grupos de "Juntos" son locales.
- **`/android` está gitignoreado** (0 archivos trackeados). La contraseña del keystore
  de release vive ahí y en `keystore.properties`, ambos fuera de git, y **nunca entró al
  historial** (verificado sobre los 5558 blobs).
- **CI corre Node 20**, la máquina de Victor tiene **Node 24.11.1**, y `package.json`
  **no declara `engines`**. Pendiente de mirar en `B8`.
- **`tsc` y jest resuelven SIEMPRE al archivo nativo**, nunca al `.web`. `tsc` no tiene
  conciencia de plataforma y `jest.config.js` usa el preset nativo de `jest-expo` sin
  `projects` multiplataforma, así que un import pelado carga la variante nativa en ambos.
  Las 14 parejas `*.web.*` solo están cubiertas donde alguien escribió a mano un
  `jest.mock` que redirige (patrón en `webStubProviders.test.tsx:516-532`). **Cualquier
  divergencia de API entre una pareja web/native es invisible para las tres compuertas.**
- **`_scratch/` está gitignoreado pero NO jest-ignoreado** (ver §5).
- **El último deploy web es del 2026-08-13** (`2026-08-13T04:39Z`); el historial completo
  de Firebase Hosting son 7 releases, del 2026-07-09 al 2026-08-13. **La regresión de
  `R9-13` entró el 2026-08-18, 5 días DESPUÉS**, así que el sitio vivo está sano y el bug
  está solo **armado**: el próximo `firebase deploy` lo publica. Trátalo como bloqueante de
  release, no como P0 en curso.
- **El recipe del token de `firebase-tools` generaliza a la API de Hosting**, no solo a la
  de Rules: `GET https://firebasehosting.googleapis.com/v1beta1/sites/{projectId}/releases`
  con el access_token refrescado da el historial de despliegues con fecha y autor. Útil
  cada vez que haya que decidir si algo del repo está o no en el aire. Ver
  `reference_essb-firebase-cli-token-for-rules-api`.
- **La ofrenda desbloquea premium PARA SIEMPRE** (confirmado por Victor, 2026-09-03). Por
  tanto el `GRANT_DURATION = 'lifetime'` del backend de canje es correcto y un código
  regalado concede exactamente lo mismo que una compra. La advertencia de
  `redeem.ts:50-55` ("verify … before distributing real codes") **ya está cumplida** y
  conviene reescribirla como constatación para que nadie vuelva a levantar la duda.

**Las dos preguntas que la sesión 3 dejó abiertas para Victor están ambas RESPONDIDAS**
(arriba, en este mismo bloque). No las vuelvas a preguntar.

## 7. Abierto, sin relación con la revisión

De `essb-master-backlog` — **no** son hallazgos de esta revisión, no los registres como
tales: lanzamiento público en Play Store (Track 2, bloqueado por la puerta de Google de
12 testers × 14 días; Victor dijo "hablémoslo" y **sigue sin empezar**) · licencia
NLT/Tyndale sin respuesta · registro de marca IMPI · mapa geográfico real para "Rutas
bíblicas" (diferido a propósito) · merge de `chore/release-3.2.62` a `main`.
