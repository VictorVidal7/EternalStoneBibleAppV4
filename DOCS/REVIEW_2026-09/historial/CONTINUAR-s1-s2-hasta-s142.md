# Historial — `CONTINUAR.md`: la §1 y la §2 de antes («Qué leer» y «Estado esperado de git»)

> Movido tal cual desde `CONTINUAR.md` en la sesión 143 (2026-11-12). **No rige: es registro.** Lo que rige está en
> `CONTINUAR.md`, `REGLAS.md`, `RECETAS.md` y `ESTADO.tsv`.

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

**Medido al empezar la sesión 141 (2026-11-11).**

- **La 140, mergeada y pusheada con el OK de Victor:** `main` = `origin/main` = `177029af` (los tres commits de
  arreglo de `fix/s140-p1`, `7d4a511f`, `a6a0ef13`, `e8700067`, más los docs de `docs/review-s140-fix`). CI
  verificado en el log: run `43070499798`, 3 jobs, 377/4709. Las dos ramas se borraron tras `git cherry` (corregido
  en la 141: los docs de la 140 decían «sin mergear»). La 139 ya estaba en `main` (`02ee73e`, run `43045636372`).
- **La rama de la 142, sin mergear a propósito y sin pushear:** `docs/review-s142-conciliacion` (solo docs, sobre
  `a0147da0`). Se mergea con el OK de Victor (fast-forward y push); después se borra tras `git cherry`. Si ya se
  mergeó, `main` la incluye.
- **La 141 está mergeada y pusheada** (corregido en la 142: aquí decía «sin mergear»): `main` = `origin/main` =
  `a0147da0`, CI verde en el log, run `43080364617`, 377/4709; su rama `docs/review-s141-diff-s140` (solo docs,
  sobre `177029af`), borrada. `npm run validate` (`NODE_ENV=development`, sin emuladores, Metro ni worktrees vivos):
  verde, **377/4709** (igual que la 140: la 141 no tocó código; las mismas 70 advertencias de eslint;
  `_scratch/S141-validate.out.txt`).
- **Los worktrees:** ninguno. El de docs (`../essb-docs-s141`, checkpoint con `_scratch/S141-checkpoint.sh.txt`) se
  quitó antes del validate. Herramientas de la 141 (emulador): `_scratch/S141-ui.sh.txt` (la de la 139, con las
  salidas en `S141-sondas/`), `S141-427-flujo.sh.txt`, `S141-427-video.sh.txt` + `S141-427-pastilla.cjs.txt` (la
  trayectoria del reproductor por video), `S141-reset-cortado.sh.txt` (deja la base a medio recargar) y
  `S141-store.cjs.txt` (las notificaciones programadas, por cuerpo). Sondas de jest: `S141-425-vecinos.test.tsx.txt`
  y `S141-427-hideReal.test.tsx.txt` (se copian a `__tests__/` con otro nombre, se corren y se quitan). Las de la
  140: `_scratch/S140-rev.sh.txt` (el revert por pieza). Las de la 139: `_scratch/S139-leer.cjs.txt` y
  `_scratch/S139-pix.cjs.txt`. Las reglas de agentes de la 138: `_scratch/S138-agentes-reglas.md.txt`.
- **El entorno de la 137:** el pagefile está FIJO en 8 GB y el commit total es ~40 GB (no ~52): con Metro entran
  **2** emuladores, no 4 (con dos quedaron 7,7 GB libres). Cada agente de Modo C llegó cerca del tope de 200 turnos.
- En el remoto quedan `main` y `audio/tts-caps-hyphen`.

Las demás ramas locales, en total 11 contando `main` (sin las de la 113):

- **Cinco ramas de arreglos YA MERGEADAS, que se pueden borrar:**
  `fix/review-p0-cola-y-cursor-conflictos`, `fix/review-p0-dinero-entitlement`,
  `fix/review-p0-sync-descarta-silencio`, `fix/review-p0-notas-cuentas` y
  `fix/review-p0-perdida-datos`.
- **Las 5 de siempre:** `audio/tts-caps-hyphen` (también en el remoto),
  `audio/tts-pronunciation-sweep`, `chore/worklets-bundle-mode`, `feature/red-letter-web` y
  `research/a4-chico-spanish-availability`.

Las ramas de las sesiones 12 a 18 ya se borraron tras mergearlas. Si no coincide, decilo antes
de empezar.

**Deuda fuera de git:**

- **De despliegue: ninguna.** Pages sirve los 4 packs buenos, y la sesión 19 lo verificó por
  sha256 y `content-length`.
- **De CI:** el step de Codecov **nunca subió nada** (`R9-118`).
- **Del mundo:** el pack contaminado está en cuarentena (punto 2 de arriba).

La revisión va en `18a3ffa` → `2f32aa9` → `8b64c11` → `af64ce1` → `299a76c` → `b5a9afa` →
`6ac10e3` → `894deb5` → `4e45f69` → **`f791749`** (sesión 6: `A4` y los reportes de campo de
las sesiones 4-5, que nunca se habían commiteado, más todo lo de `A8`–`A11`) → **`c184a1c`**
(la re-verificación a mano de los 6 P0) → **`9939e76`** (corrección de un "pendiente" falso)
→ `63f124c`.
