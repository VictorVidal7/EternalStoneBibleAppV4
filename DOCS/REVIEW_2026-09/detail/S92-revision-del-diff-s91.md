# Sesión 92 — revisión del diff de la 91 (2026-10-13)

En un chat nuevo, en la terminal, con 3 agentes en worktree que solo midieron (los pidió Victor),
con el mensaje de `_scratch/S92-PROMPT.md`. Revisa `e4d7e3a..3bccafd`: los dos comentarios de
`src/features/study/prepAccount.ts` que cerraron `R9-321`. Solo docs.

- **Estado al empezar:** `main` = `origin/main` = `c983c7a` (la 91, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38354373015`, 3 jobs, Node v24.21.0, 374/4632; ramas borradas
  tras `git cherry`). Los docs decían «sin mergear» para la 91: corregido aquí. `main` no era más
  nuevo, así que no hizo falta volver a mirar el CI.
- **Rama:** `docs/review-s92-diff-s91` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 91 se sostiene. Un nuevo P3, `R9-322`. Quedan 322 hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Tres forks con `isolation: "worktree"`**, verificados en `c983c7a`. Las herramientas se las dio
  `_scratch/S92-copiar.cjs.txt`: la `S91-sonda` y la `S65-igual` con `ROOT` en el worktree, y la
  salida con el prefijo del agente. Cada uno copió su `_scratch` a `_scratch/S92-sondas-agente-N/`
  (con su informe, `S92-aN-informe.md.txt`), y los worktrees se borraron solos, con sus ramas.
  - **A1:** las frases nuevas leídas al pie de la letra, como ganchos (205k tokens, 24 llamadas, 7
    min).
  - **A2:** otro caso de clave pedida distinta de la escrita, y las otras frases que definen lo
    mismo (176k, 16, 3 min).
  - **A3:** el diff y el detalle de la 91 (181k, 24, 3 min).
- **Re-medido en el árbol principal** lo que se cita aquí, con `_scratch/S92-sonda.cjs.txt`. La
  genera `S92-gen.cjs.txt` desde la copia del agente 1, más las piezas de A2 (`segunPrepKey`) y A3
  (`muestraSin`). Salidas: `S92-sonda-<corrida>-prep.out.txt`. `git status` quedó limpio tras cada
  corrida.
- **Un error del orquestador:** el prompt de los agentes pedía `archivo -t R9-292`. Ese modo corre
  solo `backupRestoreSignal.test.ts`, donde no está la prueba de `R9-292` (0 pruebas). Los tres lo
  notaron y midieron en `prep`, como la 90 y la 91.

## 1. Que sea solo comentarios

- `git diff -U0 e4d7e3a 3bccafd`: 18 líneas (10 + 8). Todas empiezan con ` *` dentro de dos bloques
  `/** */` cuya apertura y cierre no cambian.
- **La regla de la 65, que la 91 no corrió** (`S92-a3-igual.cjs.txt`, el JS emitido sin
  comentarios): contra `e4d7e3a`, igual (8590 caracteres). Control contra `1f02511` (el padre de
  `538b1bc`, sin la etiqueta en `oneAtATime`): distinto (8526). El comprobador sabe decir
  «distinto».
- `3bccafd..c983c7a` toca 4 archivos, todos bajo `DOCS/`.
- **Una trampa de las herramientas (A3, verificada aquí con `_scratch/S92-caret.cjs.txt`):** en
  Windows, un `execSync` pasa por `cmd.exe`, que se come el `^`. `git rev-parse 538b1bc^` dentro de
  `execSync` da `538b1bc2`; con `~1`, o con `spawnSync` sin shell, `1f02511f`. Un control escrito
  como `<sha>^` compara contra el propio `<sha>` y dice «igual» sin avisar. Además, `S65-igual` sale
  con código 0 también cuando hay diferencias: hay que leer su última línea.

## 2. Las frases nuevas, al pie de la letra (A1)

La regla de la 90: un comentario que describe un dato es una definición; medí un cambio que la
siga. A1 armó un gancho por cada lectura literal distinta del código de hoy, sin cambiar nada de lo
que hace la app. Valores de `otraEnEspera` en `pedidaAntes` / `devolucionPedidaAntes`, `prep -t
R9-292`:

| corrida                                                  | `otraEnEspera` | prueba                               |
| -------------------------------------------------------- | -------------- | ------------------------------------ |
| `muestra` (hoy)                                          | 1 / 1          | pasa                                 |
| `genTrasMultiSetD+tardeClave25` (hoy)                    | 0 / 0          | cae (`R9-319`, cerrado)              |
| `alPedir`                                                | 1 / 1          | pasa                                 |
| `alPedir+genTrasMultiSetD+tardeClave25`                  | 1 / 1          | **pasa: el verde falso de `R9-319`** |
| `alTerminar` / `+genTrasMultiSetD+tardeClave25`          | 1 / 1 · 0 / 0  | pasa · cae                           |
| `soloDetras+ajeno`                                       | 0 / 0          | cae con el código bueno              |
| `conClaves+ajenoDev`                                     | 2 / 2          | cae con el código bueno              |
| `conClaves+genTrasMultiSetD+tardeClave25+ajenoDevTarde5` | 1 / 1          | pasa: el verde falso de `R9-320`     |

Las cuatro primeras, re-medidas aquí; las demás, en el worktree de A1.

- **`alPedir`** cuenta el pedido desde la llamada a `prepWrite`, con la etiqueta al resolver la
  clave. Es la única lectura que la frase nueva del export («how many `prepWrite`s asked for `key`
  … wait for their turn now») no excluye por sí sola: en el mismo archivo, «asked for» es el
  momento de la llamada (`prepKey`, «the account of when it was asked for»; `prepWrite`, «taken
  when the write was asked for»). La excluye la frase siguiente del mismo comentario («not slow to
  ask», de la 87), escrita justo para ese hueco, y «the asks still waiting for their turn» del
  `Set`. No es un hallazgo: el comentario, leído entero, dice el código de hoy. El verbo lo trajo la
  91; la misma ambigüedad ya estaba en «`prepWrite`s of `key`».
- **`conClaves`** (uniones y respaldo con las claves que tocan) choca con «the rest nothing», que es
  de la 89; **`soloDetras`** (solo el primero de la cola), con «how many», de la 87. Forzadas, y
  ninguna la abrió la 91.
- **`alTerminar`** (el pedido sale al terminar su `fn`) no cambia nada en `R9-292`, y la excluye
  «still waiting for their turn».
- **«Not always the key it writes: when the turn comes, R9-275 may send the write…»:** exacta por
  lectura (el desvío se decide con `givenBack.has` dentro del turno), y la muestran `muestra` y
  `etiquetaDesviada`. `etiquetaDesviada` decide el desvío al pedir el turno; un caso con la
  devolución entre el pedido y el turno no está en la prueba, y no se midió.
- **«The rest nothing»** (A3, `muestraSin`: cuenta también los pedidos sin etiqueta): en el caso de
  la unión, `sin: 1`, `notas: 0`, `ana: 0`; en los otros cuatro, `sin: 0`. Control
  `sinEtiqueta+muestraSin`: `sin: 1` en los cinco, y la prueba cae. El respaldo nunca espera en
  estos casos (es el retenido): para él vale la lectura (`prepAccount.ts:181`, sin segundo
  argumento, igual que `:236`, `:249` y `:299`).
- **«Only tests read it»:** cierta. El único lector es `backupPrepTurn.test.ts:420`.

## 3. ¿Otro caso de clave pedida distinta de la escrita? (A2)

- **No, en `prepWrite`.** Por lectura:
  - Los cuatro stores (`prepNotesStore.ts:70-80`, `prepSeriesStore.ts:62-65`,
    `prepIllustrationsStore.ts:64-67`, `prepSelfReviewStore.ts:74-83`) leen y escriben solo la
    clave que les pasa `prepWrite`, ya desviada.
  - `keyAccount`: ninguna base de `PREP_KEYS` es prefijo de otra seguida de `:`, y un uid con `:` da
    igual la base.
  - `givenBack` solo crece (`:302`, dentro de su turno; `clear` solo en el reset), y se consulta
    al llegar el turno. Lo pedido después de la devolución y antes de `setPrepAccount(null)` también
    se desvía: el mismo mecanismo.
  - Un `giveBack` que falla no agrega el uid, y la escritura va a la clave pedida.
  - `finishRelease` devuelve antes de `markKnown`, así que lo pedido para una cuenta devuelta en un
    proceso anterior es el mismo desvío.
- **Pero la frase de `prepKey` dice lo contrario para el mismo caso: `R9-322`.** «A write queued
  behind others still goes to the account of when it was asked for» (`:96-100`). Con
  `segunPrepKey` (esa frase como código: `fn(resolved)` sin el desvío, la etiqueta igual), caen dos
  de las 23 de `prep` con el código bueno: la de `R9-275` (`prepAccount.test.ts`) y la de `R9-292`
  (`"ana": ["Rom/8/28"]`). La escribió la 53 (`a85df96`), y es falsa desde la 59 (`37ba5f7`), que
  no la tocó. La 91 corrigió la frase vecina, 26 líneas más abajo, sobre el mismo caso. Las demás
  frases que definen la clave pedida o la escrita (la cabecera de `R9-275`, `prepWrite`, los cuatro
  stores, `otraEnEspera` en la prueba) coinciden con el código.
- **Fuera de alcance, sin medir:** las LECTURAS de los stores (`getAllPrepNotes` y sus pares) toman
  `prepKey` sin desvío. Entre la devolución y el `setPrepAccount(null)` que dispara el efecto de
  `AuthContext.tsx:303`, una lectura daría la clave ya vaciada del uid borrado, mientras lo escrito
  va a la «sin cuenta». Depende del orden entre `deleteUser`, el estado de auth y la devolución, que
  nadie midió. Queda en la lista de pendientes, sin número.

## 4. Lo que dice el detalle de la 91

- **Su tabla se reproduce** idéntica sobre `c983c7a` (A1, A3 y aquí). Pero su §2 decía «`-t R9-292`
  con `muestra`, salvo donde dice `prep`»: las tres corridas fueron en `prep` (sus salidas se
  llaman `S91-sonda-*-prep.out.txt`), y `etiquetaDesviada` fue `etiquetaDesviada+muestra`.
  Corregido en su detalle.
- **Su §3 citaba `muestra` para «the rest nothing»** («medido con `muestra` (la 89 y aquí)»), y
  `muestra` imprime solo `notas`, `ana` y `series`: no podía ver un pedido sin etiqueta. La frase es
  cierta, medida ahora con `muestraSin` (§2). Corregido en su detalle.
- **Los conteos:** 321 entradas en `BUGS.md`, de `R9-1` a `R9-321`, sin huecos (A3). Su validate:
  0 errores, 70 avisos, 374/374 suites, 4632/4632.
- **«Ninguna lección nueva»:** se sostiene para lo que midió. Pero la 91 no corrió entera la regla
  de la 65 (solo `git diff -U0`; aplicada aquí, sin daño), y no buscó las otras frases que definen
  el dato que corregía: `R9-322`. La lección es de la 92 (§5).

## 5. La lección

- **Una frase que corrige una definición busca las otras que definen lo mismo.** La 91 corrigió
  «not always the key it writes» y dejó, 26 líneas más arriba, la de `prepKey`, que dice lo
  contrario para el mismo caso; la 90, que abrió `R9-321`, tampoco la vio. Es la regla de la 56
  («`grep` de cada escritor de la clave») aplicada a las frases: `grep` de lo que la frase define
  («asked for», «goes to the account»), no solo del nombre del dato. Medida: `segunPrepKey` tumba
  dos pruebas.
- **De herramientas:** en Windows, `execSync` pasa por `cmd.exe`, que se come el `^`: un control
  `<sha>^` compara contra el propio `<sha>`. Usá `~1` o el hash.

## 6. El checkpoint

`npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con
`NODE_ENV=development` (`_scratch/S92-validate.out.txt`): exit 0. Typecheck limpio, lint con 0
errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites, 4632/4632 pruebas.
Corrido sin worktrees de agentes (`tsc` no excluye `.claude/`).
