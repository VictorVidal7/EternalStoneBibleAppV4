# Sesión 108 — revisión del diff de la 107 (2026-10-26)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S108-PROMPT.md` y 3 agentes en worktree que
solo midieron: la segunda vuelta de la 107 (la regla de la 60), cada uno atacando lo integrado de otro, y
primero lo que escribió el orquestador (`R9-370` en `src/`). Cinco nuevos (`R9-383`..`R9-387`), sin
arreglar; ningún P0.

- **Estado al empezar:** `main` = `origin/main` = `0d682da` (la 107, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `39656058508`, 3 jobs, 374/4681). Comprobado con `git fetch` y
  `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar. Los docs decían
  «sin mergear» para la 107: corregido aquí.
- **Rama:** `docs/review-s108-diff-s107` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** 387 hallazgos, ninguno P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S108-gen.cjs.txt`: la `S108-sonda.cjs.txt` desde `S107-sonda.cjs.txt` (que ya tiene las piezas de la
    107, las de sus 12 agentes y el re-anclado: no se repite), con las piezas de `S108-propias.txt` y las de
    las copias de los agentes; con `<raíz del worktree> <N>` (N hasta 12) arma la sonda de cada agente.
    Probada en modo `anclas` antes de lanzar (18 corridas, todas aplican) y en modo agente.
  - `S108-matriz.cjs.txt` (de `S107-matriz`): primero `S108-matriz-extra.txt` (la verificación del ledger,
    40), después las corridas de los agentes, y la lista entera de la 107 (`S107-matriz-todas.txt`, 746).
  - `S108-verif-ver.cjs.txt` (de `S107-verif-ver`): qué cae en cada corrida de la verificación.
- **Los agentes:** 3 `fork` con `isolation: "worktree"`, nacidos en `0d682da` (sin `reset`), lanzados en
  cuanto `S108-gen` pasó `anclas`, con `--maxWorkers=3` y las reglas comunes en
  `_scratch/S108-agentes-reglas.md.txt`. Las siete miradas del mensaje, en tres:
  - **A1:** `R9-370` en `src/` (el corte escrito, la nota que falla, la marca por dos funciones, los
    llamadores, la fila y las cabeceras), con una hipótesis del orquestador por lectura (la ventana empieza
    cuando la mudanza lee la cuenta).
  - **A2:** el re-anclado de `S107-gen`, las gemelas sin dueño, los cortes de `R9-373` y lo sin medir de
    `R9-374`.
  - **A3:** el respaldo y la integración a mano (A5/A12, los controles de A5, las `claves` en la fila de
    A4, `R9-375`..`R9-378`).
  - Completaron los tres sin cortes (226-281k tokens, 28-51 llamadas: los tres pasaron el tope de ~25;
    7-14 min).
  - **Los worktrees:** los de A2 y A3 se borraron solos; el de A1 quedó (su `_scratch` igual a su copia,
    árbol limpio, sin junction) y se quitó con `git worktree remove --force --force` + `git branch -D`.
- **La verificación:** cada afirmación que va al ledger, re-medida en el principal (`S108-verif.out.txt`,
  40 corridas en `prep`; `S108-verif-suite.out.txt`, 10 en el suite). Todas dan lo que dijo su agente.

## 1. `R9-370` en `src/`

- **El código, sin regresión medida.** La lectura de la nota que falla (`uids = []`) sigue a la mudanza;
  `notaVuelveReturn108` (el `return;` de antes) cae en la fila de la nota, y `mueveAntesDeNota108` en la
  prueba de `R9-370`.
- **El corte escrito, medido:** un estado mientras se devuelve parte el pasaje, como dicen las cabeceras
  (`corte370a1`, `dano344SinDueno108`); la Mesa de Bob va a la «sin cuenta».
- **Pero la ventana es más ancha** (`R9-385`): empieza cuando la mudanza lee la cuenta. Un estado durante
  su unión o su marca, sin devoluciones, también parte el pasaje.
- **La mudanza no tiene fila** (`R9-383`): sin dueño, la tabla corre con los estados nulos y no une nada.
- **Un llamador que esperaba la Mesa movida antes de la nota** (por lectura, sin medir):
  `releasePrepAccount` y `adoptNoAccountPrep` no esperan `firstWork`. Un `giveBack` ajeno que entrara
  entre la lectura de la nota y la mudanza llevaría la Mesa de la cuenta borrada a la cuenta de ese
  momento; la ventana ya existía antes de la 107 (una lectura más corta) y pide borrar una cuenta durante
  el primer trabajo. `adoptNoAccountPrep` ahí no hace daño (la segunda unión no mueve nada más).
- **Los demás comentarios de `src/`** (la cabecera del archivo, `firstWork`, `moveUnownedPrep`,
  `finishRelease`): leídos enteros, ninguna oración falsa medida.

## 2. El re-anclado, las gemelas y los cortes

- **El re-anclado** (A2, por lectura de 52 reemplazos): la mayoría hace lo mismo que antes. Las que se
  anclan en la unión de la migración (`valorAlPedirSiNoMueve`, `noMueveBase`, `ajenoUnion343`,
  `claveTrasUnionMigracion344`, `migraLenta<K>`, los `catch` de la migración) hoy actúan solo con dueño;
  `valorAlPedirSiNoMueve` y `noMueveBase` dicen «no mueve» sin dueño aunque la mudanza mueva (más
  agresivas, no más débiles).
- **Qué prueba va por qué camino** (prueba-sonda `caminos108`): 18 con dueño (`R9-331` con la Mesa de
  antes, `R9-344`, `R9-345`, `R9-320`, las filas con dueño), 17 sin dueño con la cuenta nula, 21 sin dueño
  con una cuenta (`R9-310`, `R9-340`, `R9-370`, `R9-292`, `R9-274`, `R9-275`, …) y 6 ya migradas; disco
  entero no llega a la mudanza.
- **Las gemelas sin dueño:** `mueveLenta2000` (cambio bueno) devuelve los rojos de `R9-310` y `R9-340`
  (su corte de mil vueltas, por diseño). `mueveUnionSale`, `mueveQuitaMarcaEnCatch` y
  `mueveLeeEnCatchMultiGet` pasan (`R9-383`); `claveTrasMover344` pasa (`R9-384`).
- **Los cortes de `R9-373`:** los números de la frase se sostienen sobre la punta; su causa escrita es
  falsa (`R9-387`).

## 3. El respaldo y la integración a mano (A3)

- **A5 y A12:** la retención de la marca por `getAllKeys` se arma con la guarda de A5
  (`migraMarcaPorGetAllKeys`, 72/72). Por lectura: en la parte `migracion` retiene cualquier
  `getAllKeys` y apunta la marca sin mirar la clave (hoy da igual: la primera llamada del trabajo es la
  marca), y el comentario de `R9-380` la llama «de la marca». Sin medir: un cambio bueno que llame a
  `getAllKeys` antes de leer la marca.
- **Los casos de A5:** los controles se comparan en cada caso (por lectura).
- **La fila de A4:** compara `claves`. `mesaAjenaQuitadaAlFallarDev` cae ahí (69/72), por `leido`.
- **La espera de Cata:** la rama «terminado» sale antes solo si nada contado resolvió, y entonces
  `resolvioAntesDeCata` da `false` (por lectura).
- **`pedidas` como conjunto:** `R9-386`.
- **Sin medir:** un verde falso de `mockSqlite.retenida` (`R9-375`).

## 4. Lo nuevo

| hallazgo | qué                                                                                     | la pieza                                               | agente |
| -------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| `R9-383` | la mudanza de `R9-370` sin fila: su unión, su marca, la nota fallida                    | `mudanzaMarcaAntes108`, `mueveUnionSale` (y cinco más) | A1, A2 |
| `R9-384` | `R9-344` sin caso sin dueño                                                             | `claveTrasMover344`                                    | A2     |
| `R9-385` | las cabeceras escriben el corte de `R9-370` más angosto (`src/`)                        | `corte370a1` (prueba-sonda)                            | A1     |
| `R9-386` | `pedidas` como conjunto: un store que vuelve a pedir su clave y usa la segunda          | `notasRepideSiPendiente2000`                           | A3     |
| `R9-387` | la causa de la bajada del corte de `R9-373`, falsa; el de `vueltasYReloj`, sin escribir | `pa02d8e93+srcViejo…`, `notaQuitaYLenta990x10`         | A2     |

Los cinco los abrió la 107.

## 5. La matriz

- **Qué corrió:** `S108-matriz.cjs.txt correr` sobre la punta (el código de `27d598b`; `main` =
  `0d682da`), 797 corridas en `prep` con `--maxWorkers=3` (`S108-matriz-correr.out.txt`; ninguna dejó el
  árbol sucio): las 40 de la verificación (corridas antes, en `S108-verif.out.txt`), 66 de los agentes, 2
  piezas sin corrida de agente y las 746 de la 107. Antes, las 797 en modo `anclas`: 10 no aplican, las
  mismas 10 de la 107, explicadas en su detalle.
- **Contra la 107** (`S108-matriz-comparar.out.txt`): 718 dan lo mismo (544 caen, 174 pasan); **ninguna
  pasa de caer a pasar**. Una cambia: en `migraLenta2000+cedeConTimeoutEnNota0`, `R9-310` cayó en la 107 y
  aquí cae 2 de 3 veces (una carrera de reloj real con un cambio bueno lento: la clase que la nota de
  `R9-374` deja fuera). Ocho no son de un `prep` entero (corridas de agentes con `-t`, y `salta275bpt` y
  `salta292bpt`, igual que en la 107).
- **Las de los agentes** (66): 63 iguales a la salida de su worktree. Las otras 3:
  - `caminos108` y `danoMueve108+caminos108` (45 caen): la pieza escribe en una ruta del worktree de A2,
    ya borrado. Rehecha para el principal como `caminos108p` (`S108-caminos-p.cjs.txt`): 72/72, con los
    caminos que dijo A2 (`R9-344` y `R9-345` con dueño; `R9-310` y `R9-340` sin dueño y con una cuenta).
  - `fallaMudanzaA1+notaVuelveReturn108`: A1 la corrió con `-t`; entera, cae además la fila de la nota,
    como `notaVuelveReturn108` sola.

## 6. Lo que queda

- **Nuevo, sin arreglar:** `R9-383`..`R9-387` (y `R9-381`, `R9-382`, de la 107).
- **Sin medir:** qué cambio de las pruebas bajó el corte (`R9-387`); un `giveBack` ajeno entre la nota y
  la mudanza; varios estados durante la mudanza (la regla de la 96); la mudanza con el turno ocupado por
  otro; las gemelas sin dueño de `migraQuitaMarcaUseAsync` y `ajenoUnion343`; `soloDevolucion` sin dueño;
  `notasRepideSiPendiente` en series, ilustraciones y autoevaluación; un verde falso de
  `mockSqlite.retenida`; un `getAllKeys` antes de leer la marca.
- **Del Pendiente, sin tocar:** `R9-330` (decidido); la cabecera de `prepMultiSet` (`R9-327`); lo que
  queda de `R9-347`; el daño de `R9-377` con un respaldo sin series; `notasPideDosVeces` en la lectura;
  `intervaloInocuo1`.

## 7. Las lecciones

- **Una fila por camino necesita datos que hagan trabajar a la parte** (`R9-383`): la fila de la marca
  sin dueño existía, con estados nulos que no hacen unir a la mudanza.
- **El corte de una decisión empieza donde se toma el valor** (`R9-385`), no en el paso que la motivó.
- **Lo que un re-anclado deja en un solo camino se lista, y cada pieza pide su gemela** (`R9-384`).
- **Al aflojar un control exacto, la clase incluye «pedir de más y usar lo de más»** (`R9-386`).
- **La causa de un corte que se movió se mide moviendo una cosa por vez** (`R9-387`): `src/` viejo con la
  prueba nueva, y al revés.

## 8. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s108`, mientras la matriz corría en el principal; pasado al
  principal con un parche (`_scratch/S108-docs.diff.txt`) y commiteado ahí, con el hook.
- **Antes de cerrar** (la regla de la 102): las piezas del ledger (las 40 de `S108-matriz-extra.txt` y
  `caminos108p`) en modo `anclas` sobre la punta: 41, todas aplican, árbol limpio
  (`S108-anclas-cierre.out.txt`).
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"`, y `npm run validate` con
  `NODE_ENV=development`, sin worktrees (`_scratch/S108-validate.out.txt`): typecheck limpio, lint con 0
  errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites y 4681/4681 pruebas (lo
  mismo que la 107: solo docs). Código de salida 0.
- **Un desliz:** antes de quitar el worktree del checkpoint, un `git stash -u` dejó un stash en el repo
  (es común a los worktrees); comparado con el parche aplicado (igual) y borrado.
- **El mensaje de la 109** está en `_scratch/S109-PROMPT.md`.
