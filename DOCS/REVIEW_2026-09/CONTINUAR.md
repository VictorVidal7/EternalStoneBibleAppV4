# ▶️ Continuar la revisión profunda 2026-09 — prompt para un chat NUEVO

> **Última actualización: 2026-09-14, fin de la sesión 7 (la primera de ARREGLOS).**
> Actualiza este archivo al cerrar cada sesión (es parte del checkpoint, igual que
> `INDEX.md`).
>
> Este archivo es corto a propósito: su único trabajo es arrancar un chat nuevo sin que
> tenga que re-derivar nada. El **programa** está en
> [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md); el **estado vivo**, en [`INDEX.md`](INDEX.md).

---

## ⛔ LEE ESTO ANTES DE NADA

**1. Hay una rama de arreglos SIN MERGEAR: `fix/review-p0-perdida-datos` (`7f8e666`).**
Es lo primero que tienes que mirar. La sesión 7 cerró ahí **7 P0 de pérdida irreversible de
datos** con los gates en verde, pero **Victor todavía no la ha mergeado ni desplegado**. El
árbol está limpio y todo commiteado; si `git status` sale sucio, es algo tuyo, no herencia.

**Quedan 14 P0 abiertos, no 21.** Cerrados en código: `R9-27`, `R9-28`, `R9-44`, `R9-45`,
`R9-47`, `R9-49`, `R9-50` — van marcados **✅ ARREGLADO** dentro de su entrada de `BUGS.md`,
que se conserva entera a propósito. **No los vuelvas a atacar.**

**2. Los 6 P0 nuevos (`R9-44`..`R9-49`) YA ESTÁN RE-VERIFICADOS a mano, y los 6 se
sostienen.** Se hizo en la segunda mitad de la sesión 6. Salieron **3 correcciones y 2
refuerzos**, todos incorporados a `BUGS.md` y a los `detail/`. **La que importa está en
`R9-46`:** el defecto es real, pero el mecanismo de alcanzabilidad que daba el informe
("los efectos de React corren de hijo a padre") **era falso** — `engine.start()` está en un
efecto gated por auth, no de orden de montaje. Lo cierto y peor es que **no hay ningún orden
garantizado** entre la BD y el motor, y la ventana es **más ancha en una reinstalación**,
que es justo cuando bajan las notas. Es el caso de manual de por qué existe la regla de §5.

**Lo que SIGUE sin re-verificar son los P1 y P2 (`R9-51`..`R9-64`).** Menos urgente, pero
si vas a arreglar alguno, verificalo primero. (`R9-50` ya no está en esa lista: la sesión 7
lo verificó contra el código y lo arregló con los otros dos de su raíz.)

**3. `A12` está `EN CURSO`, no pendiente.** Tiene `detail/A12-superficies-crash.md` escrito
con **3 hilos abiertos y verificados por `grep`, pero sin escenario de fallo alcanzable**,
que es lo que falta para que sean hallazgos. No la re-empieces desde cero: lee ese archivo,
que además dice por dónde seguir. **Cerrarla cierra el bloque P0 entero del Modo A.**

---

## Mensaje para pegar en el chat nuevo

Elegí **uno**:

**(a) Terminar el Modo A P0** — queda **una sola fila**, `A12`:

> Vamos a continuar la revisión profunda de la app. Lee
> `DOCS/REVIEW_2026-09/CONTINUAR.md` y sigue lo que dice ahí.

**(b) Seguir arreglando** — con **14 P0** todavía abiertos sigue siendo lo más defendible
que hay, y es una sesión de **otro** protocolo: sí se toca código de la app, con rama y
gates, al revés que la revisión:

> Quiero seguir arreglando los P0 que encontró la revisión profunda, no revisar.
> Lee `DOCS/REVIEW_2026-09/CONTINUAR.md` para el contexto y `DOCS/REVIEW_2026-09/BUGS.md`
> para los hallazgos (los que ya están ✅ ARREGLADO no se tocan). Ahora toca la mezcla entre
> cuentas: `R9-22`, `R9-23` y `R9-48`. Verificá cada uno antes de tocarlo. Esta sesión SÍ
> toca código, así que va en rama con los gates en verde.

Eso es todo. Lo de abajo es para el chat que lo lea.

---

## 1. Qué leer, en este orden

1. **`git status` primero, `INDEX.md` después.** Un archivo sin commitear en `detail/`
   significa "una sesión se cortó a mitad de checkpoint" y cambia por completo qué toca
   hacer.
2. **`DOCS/REVIEW_2026-09/INDEX.md` entero** — es fino a propósito y cabe en una lectura.
   Su bloque **"Ya conocido — NO reportar como hallazgo nuevo"** evita que registres como
   bug fresco algo ya sabido, y **creció bastante en la sesión 6**. **No re-derives el
   índice desde el código.**
3. **`DOCS/REVIEW_2026-09/REVIEW_PROMPT.md`** — el charter: protocolo (§1), prioridades
   (§2), las 4 dimensiones y su estándar de evidencia (§3).
4. **`DOCS/REVIEW_2026-09/BUGS.md`** — los **64** hallazgos (`R9-1`..`R9-64`), para no
   volver a reportarlos. **No hace falta leerlo entero**: la sección P0 va primero y es la
   que importa.
   - `R9-1`..`R9-8` (sesión 2) son propuestas de endurecimiento, **no** bugs de la app;
     `R9-7` ya está RESUELTO (`af64ce1`).
   - **`R9-9`..`R9-39` y `R9-44`..`R9-64` SÍ son bugs reales, 21 de ellos P0** — dinero,
     identidad, fuga entre cuentas y pérdida de datos. Léelos antes de tocar nada de premium,
     auth, sync, respaldo, notas, la Mesa, memoria o rachas. **7 de esos P0 ya están
     ARREGLADOS** por la sesión 7 (marcados ✅ en su entrada), así que los abiertos son 14.
   - `R9-40`..`R9-43` son los **reportes de campo de Victor** (sesión 5), ninguno P0.
   - **Matiz sobre `R9-13`** (el crash del lector web): está en `main` pero **NO en
     producción** — el último deploy web es 5 días anterior a la regresión. Es **bloqueante
     del próximo `firebase deploy`**, no un incendio. No lo priorices por encima de los de
     pérdida de datos.
5. Solo el `detail/<slug>.md` del área que vayas a tocar. Ya hay **19** (12 del Modo A, 6
   del Modo B, 1 de campo). **No los leas todos** — para eso está el índice.
6. Memorias (por el índice `MEMORY.md`): **`essb-66th-session-fanout-a8-a11`** (la más
   reciente), `essb-review-session-5-a4-verified-field-reports`,
   `essb-65th-session-deep-review-modo-a-p0` (la más cargada de aprendizajes de método),
   `essb-64th-session-deep-review-2026-09-inventory` (el inventario y todo el Modo B),
   `reference_essb-device-testing-and-automation` (**obligatoria** si vas a Modo C),
   `feedback_essb-theme-and-navigation-patterns`, `feedback_essb-minimize-firestore-sync`,
   `feedback_essb-agent-worktree-isolation`, `feedback_essb-verify-agent-commits-before-merge`,
   `feedback_essb-theological-care`, `feedback_essb-memory-freshness`,
   `feedback_essb-user-requests-preempt`. Si vas a mirar si algo está desplegado,
   `reference_essb-firebase-cli-token-for-rules-api` (sirve para Rules **y** Hosting).

## 2. Estado esperado de git

**Ojo: ahora hay 7 ramas locales, no 6.** La séptima es
**`fix/review-p0-perdida-datos`**, la de la sesión 7, **sin mergear**. Las otras 6: `main`,
`audio/tts-caps-hyphen`, `audio/tts-pronunciation-sweep`, `chore/worklets-bundle-mode`,
`feature/red-letter-web`, `research/a4-chico-spanish-availability`. `main` = `origin/main`,
árbol limpio. Si no coincide, dilo antes de empezar.

La revisión va en `18a3ffa` → `2f32aa9` → `8b64c11` → `af64ce1` → `299a76c` → `b5a9afa` →
`6ac10e3` → `894deb5` → `4e45f69` → **`f791749`** (sesión 6: `A4` y los reportes de campo de
las sesiones 4-5, que nunca se habían commiteado, más todo lo de `A8`–`A11`) → **`c184a1c`**
(la re-verificación a mano de los 6 P0) → **`9939e76`** (corrección de un "pendiente" falso)
→ `63f124c`.

Los **arreglos** van aparte, fuera de `main`: **`7f8e666`** en `fix/review-p0-perdida-datos`.

## 3. Dónde va la revisión

**138 filas** en el ledger: Modo A 46 · Modo B 11 · Modo C 71 · Modo D 10.
**Cerradas: 17** (todo el Modo B P0 + 11 filas del Modo A P0). **`A12` en curso.**
**Pendientes: 120.** Esto cuenta filas REVISADAS; los arreglos de la sesión 7 no mueven
ninguna fila, porque arreglar no es revisar — mueven el conteo de P0, de 21 a **14**.

| Sesión | Qué se hizo                                                | Commit              |
| ------ | ---------------------------------------------------------- | ------------------- |
| 1      | Solo el inventario (charter §5)                            | `18a3ffa`           |
| 2      | Modo B P0 completo: `B1`, `B1b`, `B2`–`B5`                 | `2f32aa9`           |
| 2      | Este prompt + correcciones al charter                      | `8b64c11`           |
| 2      | `R9-7` resuelto: `functions/` documentada                  | `af64ce1`           |
| 3      | `A1` (premium/RevenueCat) — `R9-9`, `R9-10`                | `299a76c`           |
| 3      | `A2`, `A3`, `A5`, `A6`, `A7` — `R9-11`..`R9-32`            | `b5a9afa`           |
| 3      | Cierre de la sesión 3 + las 2 preguntas abiertas           | `6ac10e3`/`894deb5` |
| 4      | `A4` (`SyncEngine`) — se cortó a mitad del checkpoint      | `f791749`           |
| 5      | `A4` verificada + campo `R9-40`..`R9-43`                   | `f791749`           |
| 6      | `A8`–`A11` por fan-out — `R9-44`..`R9-64`; `A12` a medias  | `f791749`           |
| 6      | Re-verificados a mano los 6 P0 nuevos                      | `c184a1c`/`9939e76` |
| 7      | **ARREGLOS**: 7 P0 de pérdida de datos (rama, sin mergear) | `7f8e666`           |

**Balance por modo.** El Modo B P0 salió **limpio**: 0 vulnerabilidades alcanzables, 0
secretos filtrados jamás (5558/5558 blobs), 0 paths abiertos en Firestore. Sus 8 hallazgos
son endurecimiento, no bugs.

**El Modo A P0 salió lo contrario: 52 hallazgos, 21 de ellos P0 reales.** Los más graves,
por orden de daño irreversible:

- **Pérdida de datos al respaldar/restaurar:** `R9-49` (un fallo transitorio de SQLite
  produce un respaldo vacío **sin marca**, y al importarlo **borra la racha y los ledgers**;
  canal distinto y peor que `R9-27`), `R9-27`/`R9-28`, `R9-53`.
- **Pérdida de prosa escrita a mano:** `R9-47` (dos toques al stepper de la Mesa **borran o
  pisan un sermón**), `R9-44` (recolorear un subrayado **borra su nota**), `R9-46` (una copia
  remota vieja pisa la nota nueva en cada arranque en frío).
- **Fuga o mezcla entre cuentas:** `R9-22`/`R9-23`, `R9-48` (el historial de A se escribe
  dentro de la cuenta de B y **sobrescribe** su agregado).
- **Sync que descarta o se para en silencio:** `R9-33`, `R9-35`, `R9-45` (una lápida que no
  se limpia deja un subrayado **borrado para siempre** en todo otro dispositivo).
- **Dinero:** `R9-9` (premium que sobrevive al reembolso).
- **Web:** `R9-13` (el lector crashea — **no está en producción**, pero bloquea el próximo
  deploy web).

**Los cuatro ejes donde están, y donde conviene seguir buscando.** Las tres compuertas
verdes (`tsc`, jest, CI) comparten puntos ciegos:

1. **La resolución de módulos por plataforma** — `tsc` y jest resuelven siempre al archivo
   nativo.
2. **La dirección inversa** de cada flujo — quitar acceso, restaurar, borrar, descompletar,
   cambiar de cuenta.
3. **Las listas de strings enumeradas a mano**, que se quedan atrás al añadir un miembro.
4. **El horario de verano** (nuevo en la sesión 6) — ninguna prueba fija `TZ` y la máquina
   está en una zona sin DST, así que la suite **no puede** ver esa clase de bug.

Y un quinto patrón, más fino, que salió de `A8`: **`{merge:true}` hace que un campo opcional
sea imposible de desasignar por sync**, así que cualquier omisión local se convierte en
divergencia permanente con la nube (`R9-44`, `R9-45`, `R9-50` son la misma raíz).

## 4. Por dónde seguir

**Recomendado: terminar `A12`** (Modo A, P0) — superficies de crash. Está a medias con 3
hilos abiertos en `detail/A12-superficies-crash.md`, y **es la última fila P0 del Modo A**.
El hilo más prometedor ya está localizado: `CustomPlansContext.tsx:69` parsea `@custom_plans`
**sin validar**, y ese provider está **por encima** del `ErrorBoundary`.

Alternativas legítimas:

- **Seguir la sesión de ARREGLOS.** La 7 hizo el primer tramo del orden sugerido —
  `R9-49`/`R9-27`/`R9-28` y `R9-47`, más `R9-44`/`R9-45`/`R9-50` atacados juntos por su
  raíz, que es exactamente lo que este archivo recomendaba. **Lo que queda del orden:**
  `R9-46` (la otra mitad de la prosa: el `getLocal` de notas que falla abierto) →
  `R9-22`/`R9-23`/`R9-48` (mezcla entre cuentas) → `R9-33`/`R9-35` (sync que descarta en
  silencio) → `R9-9` (dinero) → `R9-13` **antes de volver a desplegar la web**. Los 4 de
  campo (`R9-40`..`R9-43`) son baratos y muy visibles: buenos para cerrar la sesión.
- **`B6`–`B10`** (Modo B, P1/P2) si preferís terminar el Modo B de una: permisos Android,
  `npm outdated`, `expo-doctor`, deps sin usar, licencias. Baratas, sin entorno. Ojo:
  extendé `B9`/`B10` a `functions/` y `vercel/`, no solo a la raíz.
- **Modo C P0** (14 filas) si querés pagar el arranque de emulador una sola vez.
  **Requiere** el recipe de `reference_essb-device-testing-and-automation` y **emulador +
  APK debug**, nunca el OnePlus de Victor. Hay dos hallazgos que **solo** se cierran ahí:
  `R9-57` (¿gana el `BackHandler` del `Modal` sobre el `useBackHandlerStep`?) y la
  verificación en vivo de `R9-47`.

**No mezcles modos en una misma sesión** (charter §3) — cada uno tiene su entorno.

## 5. Reglas que ya costaron caro — no las re-descubras

- **Solo revisar y reportar. NO se toca código de la app.** Lo único que se escribe es el
  ledger. Las mejoras del Modo D se **redactan**, no se aplican.
- **Un mensaje de Victor a mitad de turno va al frente AHORA**, antes de seguir tu propio
  bucle (`feedback_essb-user-requests-preempt`). Pasó en las sesiones 5 y 6, y las dos veces
  atenderlo primero fue lo correcto.
- **Checkpoint por área, COMPLETO, en el momento:** `detail/<slug>.md` **+** la fila del
  índice **+** la entrada en `BUGS.md`, antes de pasar a la siguiente área. La sesión 4
  escribió solo el `detail/` y dejó el índice mintiendo durante 11 días. Si te quedás sin
  margen a mitad, deja la fila en `EN CURSO` — pero **nunca** dejes un `detail/` escrito con
  el índice diciendo `PENDIENTE`.
- **Una sonda ejecutable vale más que una lectura, y también vale para VERIFICAR un informe
  ajeno.** En la sesión 6 los 4 agentes probaron **19 de 21 hallazgos** con sondas contra el
  código real; varias **refutaron la hipótesis inicial del propio agente** y encontraron algo
  distinto y mejor. Cuando una sonda contradice tu lectura, gana la sonda.
- **Los agentes aciertan el mecanismo y fallan el detalle: re-verificá lo portante.**
  **Comprobá a mano cada afirmación de la que cuelgue un P0** antes de darla por buena;
  cuestan un `grep` cada una. **Rindió otra vez en la sesión 6:** al re-verificar los 6 P0
  del fan-out, los 6 se sostuvieron pero salieron 3 correcciones, y una (`R9-46`) invalidaba
  el argumento de alcanzabilidad entero. El defecto sobrevivió; la explicación, no.
- **Borrá las sondas ejecutables al cerrar la fila, o sacalas de `testMatch`.**
  `_scratch/` está gitignoreado pero **NO** jest-ignoreado: un `*.test.ts` olvidado ahí se
  suma a `npm test` sin aparecer jamás en `git status`. El truco barato: renombrar a
  `.ts.txt`. (En la sesión 6 no hizo falta: las sondas vivían en worktrees de agentes, que se
  limpian solos — pero por eso mismo **sus recetas de reconstrucción están en cada
  `detail/`**, y son lo único que queda.)
- **`TZ=... npx jest` NO propaga la variable desde Bash en Windows.** Usá
  `$env:TZ = 'Europe/Madrid'; npx jest <ruta>` en PowerShell. Sin esto, cualquier sonda de
  horario de verano pasa en falso.
- **Prettier manda sobre el ledger.** `format:check` de CI cubre `**/*.md` y
  `.prettierignore` no excluye `DOCS/`. Corré
  `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` después de cada checkpoint.
  Prettier **rellena cada celda de tabla al ancho de la más ancha** — por eso la columna
  `Área` del índice está capada a ~55 chars y `Detalle` es un slug pelón. No metas prosa en
  las tablas del índice. Ojo también: si insertás texto a mano en un `.md`, **deja línea en
  blanco antes de un `---`** o el párrafo anterior se vuelve un encabezado.
- **`NUNCA npm audit fix --force` en este repo.** Propone downgrades que romperían la app
  en dos lugares (`R9-1`, `R9-8`). `npm audit fix` a secas es seguro.
- **El reflejo de `overrides` no siempre sirve:** verificá si el parche es ESM-puro antes de
  recomendarlo. `decode-uri-component@0.5.0` es ESM-only y rompería Metro; `uuid@11.1.1`
  trae build dual y la raíz ya lo corre en verde. Mismo patrón, veredictos opuestos.
- **Un hallazgo de "código muerto" tiene que buscar POR QUÉ sigue ahí antes de recomendar
  borrarlo.** `R9-7` recomendó borrar `functions/` sin ver que la justificación estaba a un
  `grep` de distancia.
- **Verificá contra `git log` antes de afirmar un estado que venga de memoria o del
  charter.** La sesión 1 encontró que la semilla BUG-10 del charter ya estaba arreglada
  (`b17ec99`), y la sesión 2 encontró que la memoria de device-testing miente sobre el
  `signingConfig` de release.
- **Antes de creerle a un conteo, verificá qué extrajiste.** En `B3`, una extracción mal
  hecha agarró la contraseña de _debug_ (`'android'`, 7 chars) y devolvió 43 falsos
  positivos.
- **Pedí el OK a Victor antes de commitear el ledger** (charter §5.4/§7). Ya lo dio
  **cuatro** veces con el formato **commit + push directo a `main`**, así que el formato está
  fijado — pero la autorización es por sesión, no se hereda.
- **Si despachás agentes:** `isolation: "worktree"` en **todos**, incluso los de solo
  lectura; cada uno escribe **únicamente** a `DOCS/REVIEW_2026-09/_scratch/<área>.md` (ya
  está en `.gitignore`), nunca a `INDEX.md`; el orquestador fusiona todo en **una** pasada al
  final y verifica el estado real de cada worktree en vez de confiar en el "completado".
  El fan-out necesita que **Victor lo pida explícitamente**.
- **Tamaño del fan-out: 4, no 11.** La sesión 3 lanzó 11 agentes Opus a la vez y **los 11
  murieron por límite de uso** sin escribir una línea. Relanzados en tanda de 4, los 4
  completaron; en la sesión 6, otra tanda de 4 volvió a completar entera. **4 es el número.**
  Pedile además que **devuelva el informe íntegro en su mensaje final**: el `_scratch/` queda
  en **su** worktree, que se limpia solo.
- **Dale a cada agente los "ya reportado, no lo repitas" por número.** En la sesión 6 los 4
  informes distinguieron correctamente su hallazgo de los `R9-*` previos, y tres de ellos
  argumentaron **por qué** su mecanismo era distinto. Eso ahorró toda una pasada de dedup.
- **Un worktree de agente no tiene `node_modules`.** Si necesita correr jest, hace falta
  `New-Item -ItemType Junction -Path <worktree>\node_modules -Target <repo>\node_modules`, y
  borrarla al terminar con `(Get-Item <ruta>).Delete()` — **un `rm -rf` seguiría la junction**
  y borraría el `node_modules` real.
- **En una sesión de ARREGLOS, una prueba nueva no vale nada hasta que la ves FALLAR sin el
  arreglo.** Pasó en la sesión 7: tres pruebas de `R9-47` pasaban igual con el código roto
  (una porque el re-render no llegaba a aplicarse; otra porque `setSectionNote` ya borra una
  sección vacía, así que no discriminaba nada). Reescritas contra el mecanismo real, la
  primera sí falla. Revertí el arreglo, corré, restauralo: cuesta 30 segundos.
- **`react-test-renderer` no aguanta re-renderizar una pantalla del tamaño de la Mesa.**
  Tira «Unable to locate attached view in the native tree» (el `Animated` interno de cada
  `TouchableOpacity`) y DESMONTA el árbol. Cualquier hallazgo que necesite un cambio de
  pasaje en vivo es verificación en dispositivo, Modo C — no lo pelees en jest.
- **`python - <<'EOF'` NO persiste las escrituras a `src/i18n/translations.ts`.** Falla en
  silencio: los `assert` pasan, imprime el "ok", y el archivo queda igual. Descubierto en la
  sesión 7 tras cuatro intentos. Para ese archivo usá la herramienta de edición; para los
  demás el heredoc funcionó sin problema.
- **Actualizá memoria y este archivo al cerrar la sesión** (`feedback_essb-memory-freshness`).

## 6. Hechos duros que ya no hay que volver a averiguar

- **El repo de GitHub es PÚBLICO** (`VictorVidal7/EternalStoneBibleAppV4`). Cualquier cosa
  commiteada es material publicado.
- **0 secretos de GitHub Actions** en el repo y `default_workflow_permissions: "read"` → el
  radio de daño de un hallazgo de CI es casi nulo.
- **Las reglas de Firestore NO están versionadas** (no hay `firestore.rules`, ni sección en
  `firebase.json`). Son correctas (default-deny + `request.auth.uid == uid`) y su texto vivo
  está **capturado íntegro** en `detail/B4-reglas-firestore-storage.md`.
- **Todas las rutas Firestore del cliente van bajo `users/{uid}/`.** `giftCodes` es de raíz
  y está deliberadamente **fuera** de las reglas → ningún cliente puede enumerar códigos.
  **Está bien así.**
- **Hay 5 adaptadores de sync, no 3:** `notes`, `highlights`, `reviewEvents`
  (`registerOfflineAdapters.ts:17-19`), **`favorites`** (`FavoritesContext.tsx:228`) y
  **`memoryDeck`** (`MemoryDeckContext.tsx:267`). Y **8 colecciones Firestore**, enumeradas en
  `deleteAccountData.ts:22-43`.
- **La racha, el progreso de lectura, los planes y los logros NO viajan entre dispositivos.**
  No hay colección ni adaptador para ellos: el único camino es el respaldo manual. La app lo
  dice con honestidad en el diálogo de importar (`translations.ts:4168`) y **no** en el
  anzuelo de inicio de sesión (`:3877`, «Inicia sesión para sincronizar tus datos entre
  dispositivos»). Alinear ese copy es decisión de producto de Victor, no un bug.
- **La app llama al backend de Vercel** (`giftCodeService.ts:44` →
  `essb-gift-redeem.vercel.app/api/redeem`). **`functions/` NO está desplegada, y es a
  propósito** — Cloud Functions exige plan Blaze. **No propongas borrarla** (`R9-7`).
- **Firebase Storage no se usa.** **`TogetherContext` no toca Firestore** (los grupos de
  "Juntos" son locales).
- **`/android` está gitignoreado.** La contraseña del keystore de release vive fuera de git
  y **nunca entró al historial** (verificado sobre los 5558 blobs).
- **CI corre Node 20**, la máquina de Victor tiene **Node 24.11.1**, y `package.json` **no
  declara `engines`**. Pendiente de mirar en `B8`.
- **`tsc` y jest resuelven SIEMPRE al archivo nativo**, nunca al `.web`. Las 14 parejas
  `*.web.*` solo están cubiertas donde alguien escribió a mano un `jest.mock` que redirige
  (patrón en `webStubProviders.test.tsx:516-532`; la pareja de `MemoryDeckContext` **sí** lo
  tiene y salió limpia). **Cualquier divergencia de API entre una pareja web/native sin ese
  mock es invisible para las tres compuertas.**
- **La suite es CIEGA al horario de verano.** Ninguna prueba fija `TZ`; el CI y la máquina de
  Victor están en `America/Mexico_City`, **que abolió el DST en 2022**.
- **`_scratch/` está gitignoreado pero NO jest-ignoreado** (ver §5).
- **El último deploy web es del 2026-08-13.** La regresión de `R9-13` entró el 2026-08-18,
  **5 días DESPUÉS**, así que el sitio vivo está sano y el bug está solo **armado**.
  Trátalo como bloqueante de release.
- **El recipe del token de `firebase-tools` generaliza a la API de Hosting**, no solo a la de
  Rules. Ver `reference_essb-firebase-cli-token-for-rules-api`.
- **La ofrenda desbloquea premium PARA SIEMPRE** (confirmado por Victor, 2026-09-03). El
  `GRANT_DURATION = 'lifetime'` del backend de canje es correcto y un código regalado concede
  exactamente lo mismo que una compra.
- **Ningún `fetch` de la app tiene timeout** — los 6 call sites (`R9-40`).
- **`@prep_notes` es UNA sola clave JSON con todos los sermones**, y
  `AsyncStorage_db_size_in_MB` no está configurado → rige el techo de **6 MB por defecto de
  Android** para toda la base de AsyncStorage, compartido con progreso, mazo, ilustraciones y
  series.
- **La Mesa no vive en `src/features/prep/`** (esa carpeta está **vacía**): los stores están
  en `src/features/study/` y las pantallas en `app/features/prep/`.
- **El gating premium de la Mesa solo OCULTA, nunca borra** (verificado en `A9`): un
  ex-premium conserva todo su trabajo y mantiene la salida gratuita «copiar esquema». No
  busques ahí un P0 de dinero.
- **El intervalo del SRS está acotado en [1, 48] días por construcción** (probado en `A10`):
  no hay desbordamiento posible, ni `NaN`, ni negativos, ni con 20 fallos ni con 200 aciertos
  encadenados.
- **El arreglo del "anillo morado" (clave de día LOCAL) está aplicado completo** en los 4
  caminos de escritura de racha y en toda la aritmética de fechas de `A10` y `A11`. Cero
  `toISOString().split('T')[0]` disfrazado de local.

## 7. Decisiones de Victor que NO hay que volver a preguntarle

- **Las 2 preguntas que dejó abierta la sesión 3 están RESPONDIDAS** (ofrenda = premium para
  siempre; `R9-13` no está en producción). No las vuelvas a plantear.
- **Los 4 hallazgos de campo `R9-40`..`R9-43` NO se arreglan todavía** — quedan registrados
  y se atacan junto con los P0 en la sesión de arreglos (preguntado explícitamente el
  2026-09-07).
- **`R9-42`, cómo arreglarlo cuando toque: repartir los 2 px.**
  `left: -(fontSizes.sm + spacing['0.5'])` → `-(fontSizes.sm + 1)`, o sea −16 → −15, 1 px por
  lado. Descartó ampliar el canalón y achicar el ícono. **Ya está decidido.**
- **Fan-out: Victor lo pide explícitamente cuando lo quiere** ("manda al menos 3 agentes",
  sesión 6). No lo asumas por defecto.
- **Cuando avise del límite de uso de 5 h, la prioridad es volcar a disco y commitear, no
  terminar de verificar.** Es lo que se decidió en la sesión 6 y por eso existe la deuda de
  re-verificación del `⛔` de arriba: fue un intercambio consciente, no un olvido.

## 8. Decisiones abiertas para Victor (no son bugs)

- **`R9-59`:** ¿«device-local» debe significar también «visible para cualquiera que use el
  aparato»? Hoy, cerrar sesión **no** limpia la Mesa, ni el progreso, ni los logros, y está
  **documentado como decisión** (`deleteAccountData.ts:12-13`) — pero nadie se lo preguntó
  a Victor con el caso del teléfono compartido de la iglesia delante.
- **El anzuelo de inicio de sesión** promete sincronizar "tus datos" cuando la racha, el
  progreso y los logros no viajan. ¿Se califica el copy?

## 9. Abierto, sin relación con la revisión

De `essb-master-backlog` — **no** son hallazgos de esta revisión, no los registres como
tales: lanzamiento público en Play Store (Track 2, bloqueado por la puerta de Google de 12
testers × 14 días; Victor dijo "hablémoslo" y **sigue sin empezar**) · licencia NLT/Tyndale
sin respuesta · registro de marca IMPI · mapa geográfico real para "Rutas bíblicas"
(diferido a propósito). **Ya NO está abierto el merge de `chore/release-3.2.62`:** se
mergeó en `19fee16` y la rama se borró — `main` lleva `3.2.62` / `versionCode 74`
(verificado contra `git log` el 2026-09-14). Si alguna memoria dice lo contrario, miente.
