# Sesión 113 — arreglo de lo que la 112 midió con daño, y el cierre del ciclo (2026-10-27)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S113-PROMPT.md` y 6 agentes en worktree que
midieron los diseños antes de escribirlos (los pidió Victor: «Podrías mandar 6 agentes para avanzar más?»).
Arregla SOLO `R9-406`, `R9-407` y `R9-408` (los tres verdes falsos con daño medido de la 112), sin abrir otra
revisión: **con esto se cierra el ciclo de las pruebas de la Mesa** (la decisión de Victor del 2026-10-27, §7
de `CONTINUAR.md`: arreglado lo que tenía daño, el resto costo conocido). Ninguno nuevo; quedan 409
hallazgos.

- **Estado al empezar:** `main` = `origin/main` = `7529981` (la 112, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `40611073805`, 374/4688). Comprobado con `git fetch` y
  `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar. Los docs decían
  «sin mergear» para la 112: corregido aquí.
- **Ramas:** `fix/s113-arreglos-s112` (seis commits de pruebas, solo `__tests__/prepAccount.test.ts`) y
  `docs/review-s113-fix` encima, sin mergear hasta el OK de Victor.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S113-gen.cjs.txt` (de `S112-gen`, armada por `S113-hacer-gen.cjs.txt`): la `S113-sonda.cjs.txt` desde
    `S112-sonda.cjs.txt`, con las piezas de `S113-propias.txt` (vacío) y las de las copias de los agentes;
    con `<raíz del worktree> <N>` arma la sonda de cada agente. Probada en modo `anclas` antes de lanzar
    (las piezas de las tres entradas y las dos pruebas-sonda de la 112 aplican, árbol limpio).
  - **Un re-anclado** (la regla de la 107, donde el texto nuevo hace lo mismo): el diseño de A2 cambió el
    final del espejo «sin dueño ni sesión» de la Mesa de antes, donde se insertaban cuatro prueba-sondas de
    la 107 (`sonda370`, `corte370a1`, `duenoDurante`, `duenoSinRegistro`); `S113-gen` las inserta tras su
    final nuevo, el mismo lugar (`S113-reanclar-ver.cjs.txt`: el ancla nueva es única). Costo: con la prueba
    de la 111 revertida, `pat4839952+corte370a1` ya no aplica.
  - `S113-matriz.cjs.txt` (de `S112-matriz`, armada por `S113-matriz-hacer.cjs.txt`, que arma también
    `S113-extra-hacer.cjs.txt`): primero las listas de los agentes (93), después la lista entera de la 112
    (`S112-matriz-todas.txt`, 1312).
- **Los agentes:** 6 `fork` con `isolation: "worktree"`, nacidos en `7529981`, lanzados en cuanto
  `S113-gen` pasó `anclas`, con `--maxWorkers=3` y las reglas comunes en `_scratch/S113-agentes-reglas.md.txt`
  (el corte de Victor primero; lo que midan de más, escrito sin arreglar; el Pendiente copiado). Tres
  entradas en seis tareas, por camino y por store, cada una en otra región del archivo para que los diffs no
  chocaran:

  | agente | entrada  | qué diseñó                              | dónde                          |
  | ------ | -------- | --------------------------------------- | ------------------------------ |
  | A1     | `R9-406` | dos casos en la marca de la mudanza     | la prueba de `R9-344`          |
  | A2     | `R9-407` | las cuatro bases por `sembrar()`        | el describe «la Mesa de antes» |
  | A3     | `R9-407` | las cuatro bases en las filas con dueño | la tabla de partes             |
  | A4     | `R9-408` | la gemela de `R9-269` en series         | antes de la de `R9-269`        |
  | A5     | `R9-408` | la gemela en ilustraciones              | antes de la de `R9-298`        |
  | A6     | `R9-408` | la gemela en autoevaluación             | al final del describe          |
  - **Cruzado contra el Pendiente antes de lanzar** (la regla de la 110): la gemela de `R9-406` en la unión
    (`primeroSiVariosEnUnion112`) quedó como una corrida de control sobre el diseño de A1, sin armar un caso
    que retenga la unión, porque su daño está en el Pendiente. Lo mismo `migraDestinoToleranteIlus112` en
    A2 y A3: sin fallas por base.
  - Completaron los seis sin cortes (165-194k tokens, 23-35 llamadas; 4-7 min). Ninguno se borró solo
    (diseño sin commitear): `S113-limpiar.sh.txt` comparó el `git diff` de cada worktree con su diff
    guardado y su `_scratch` con su copia (los seis iguales), y los quitó.

- **La integración:** los seis diffs aplicaron limpios en serie (`git apply --3way`, `S113-aplicar.cjs.txt`)
  y se commitearon de a uno, con el hook: `1f6acd4` (A1), `e503b87` (A2), `ac5acfc` (A3), `9011b19` (A4),
  `5029129` (A5), `f3bee15` (A6). 458 líneas más, 15 menos, solo en `__tests__/prepAccount.test.ts`.

## 1. Lo que cerró cada entrada

El detalle de cada arreglo, con sus corridas, está en la entrada de `BUGS.md`.

- **`R9-406`** (`1f6acd4`): nulo→ana→beto y ana→beto→nulo sin dueño ni devoluciones, con la marca de la
  mudanza retenida. Con `primeroSiVariosEnMudanza112` caen los dos casos con la mezcla de cuentas a la vista.
- **`R9-407`** (`e503b87`, `ac5acfc`): las cuatro bases en la Mesa de antes con dueño, por los dos caminos
  que nombraba la hipótesis. Se tomaron los dos (ninguno trajo costos, y cada uno lee otra parte de la
  migración: el caso sencillo, y las filas de su unión, su marca y la nota). Con `migraSaltaIlus112` o
  `migraSaltaAuto112` cae el caso con dueño y tres filas, con la base marcada en la «sin cuenta».
- **`R9-408`** (`9011b19`, `5029129`, `f3bee15`): una prueba por store, con la adopción y su espejo (la
  devolución). Con la regresión de cada store caen todas sus filas. **El daño en ilustraciones y
  autoevaluación, que la 112 dejó sin medir, quedó medido:** al salir, la ilustración creada se pierde, y la
  respuesta de la autoevaluación queda bajo la cuenta devuelta.
- **La lista de §5, en cada prueba nueva:** el caso y su espejo; la regresión demorada y adelantada, y la
  ventana demorada (cae igual); un ajeno en la ventana (sigue verde y no tapa la regresión). Con la prueba
  de `56c7d33` revertida (`pat56c7d33+<pieza>`), cada pieza pasa: lo que la ve es lo agregado.

## 2. Lo que se midió de más (costo conocido, sin número)

El corte de Victor: se escribe, no se arregla.

- **Dos costos del arreglo de `R9-408`, sin daño** (escritos en la entrada): un `createPrepSeries` que lee
  antes de pedir su turno (`seriesLeeAntes113A4`, un cambio bueno) tumba la fila «adopta con la lectura
  retenida»; y las ventanas de ilustraciones y autoevaluación se miden en vueltas
  (`autoSaleTrasVueltas2000113A6` pasa).
- **Rojos viejos ante cambios buenos, que la 113 no abrió:** una adopción que espera 500 vueltas tumba
  `R9-273` y `R9-269`, una devolución que espera 500 vueltas tumba `R9-292` y `R9-275` (A5), y la marca de
  la mudanza demorada mil vueltas tumba `R9-340` y `R9-310` (A1; ya en las matrices de la 111 y la 112 con
  `marcaMudanzaLenta1010A2`). Son las esperas en vueltas fijas de esas pruebas: la clase del corte de
  `R9-373`, en el Pendiente.
- **Otro camino hasta `R9-330`, sin revisarlo** (sigue pendiente por decisión de Victor): la cola de
  escrituras de un store pide el turno tarde, y una serie pedida sin cuenta antes de una adopción puede
  quedar detrás de su unión (`colaSegunda113`, medido con el código real; ver §3 y la nota en `R9-330`).

## 3. La matriz

- **Qué corrió:** `S113-matriz.cjs.txt correr` sobre `f3bee15`, 1381 corridas en `prep` con `--maxWorkers=3`:
  las 93 de los agentes y las 1312 de la 112 (sin repetir). Las tandas 1 a 35, en el principal; las 35
  restantes, a pedido de Victor («hay forma de acelerarlo más?»), repartidas en 8 procesos paralelos (el
  principal y siete worktrees `.claude/worktrees/mz-K`, con `S113-paralelo.cjs.txt`: la sonda con `ROOT` en
  el worktree y la salida en el `_scratch` del principal, con el mismo nombre; `S113-reparto.cjs.txt`). Dos
  cortes de procesos a mitad de tanda dejaron una pieza aplicada en su árbol: se miró el diff, se restauró
  con `git checkout` y la tanda se volvió a correr. Las 70 tandas, completas; ninguna dejó el árbol sucio.
- **Las de los agentes:** 76 iguales a su worktree; 17 distintas, todas porque hoy caen más (los dos
  diseños de `R9-407` juntos: cada regresión la ven los dos). Ninguna deja de caer.
- **De las comparadas con la 112:** 721 caen igual y 301 pasan igual; 133 caen en los dos lados con otras
  pruebas (las nuevas ven más). Cambian si caen 3:
  - `cedeConTimeoutAlEmpezar0`: `R9-310`, la carrera de reloj real conocida (cae y pasa, con la prueba
    nueva y con la de antes).
  - `intervaloInocuo10`: cae solo con los 8 procesos; sola, 84/84 (carga).
  - `seriesTarde2000`: tumba la de `R9-408` de series al adoptar (con la prueba de antes, 79/79). Su
    «cambio bueno» pide el turno tarde, detrás de la adopción: es la ventana de `R9-330`. Medido con el
    código real (prueba-sonda `colaSegunda113`): una segunda serie pedida sin cuenta antes de la adopción,
    con la primera en su turno, queda en la «sin cuenta». Anotado en `R9-330` (pendiente por decisión de
    Victor), sin número nuevo.
- **No aplican 133:** las 132 de la 112 y `pat4839952+corte370a1` (el re-anclado).
- **La nota de A5, medida en el principal:** con la prueba de `56c7d33`, `adoptaLenta500A5` tumba
  `R9-269` y `R9-273`, y `devuelveLenta500A5`, `R9-292` y las dos `R9-275`: no los abrió la 113.

## 4. Lo que queda

- **El ciclo de las pruebas de la Mesa, cerrado.** Costo conocido, sin arreglar: `R9-401`..`R9-405`,
  `R9-409`, las notas «Medido en la 112» y lo de §2.
- **Del Pendiente, sin tocar:** `R9-330` (decidido); la cabecera de `prepMultiSet` (`R9-327`); lo que queda
  de `R9-347`; un `giveBack` ajeno entre la nota y la mudanza; qué cambio bajó el corte de `R9-373`; un
  verde falso de `mockSqlite.retenida`; el daño de `R9-377` con un respaldo sin series; `notasPideDosVeces`
  en la lectura; `intervaloInocuo1`; el daño de `primeroSiVariosEnUnion112` y de
  `migraDestinoToleranteIlus112`; una escritura por `mergeItem` en el «de quién» de la escritura.
- **Lo siguiente: `A12`** (Modo A, P0), en la 114, en un chat nuevo; su mensaje, en `_scratch/S114-PROMPT.md`.

## 5. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s113`, mientras la matriz corría en el principal; pasado al
  principal con un parche (`git add -N` antes del `diff`) y commiteado ahí, con el hook.
- **Antes de cerrar** (la regla de la 102): las piezas del ledger (las 93 de `S113-matriz-extra.txt`, las 82
  de `S112-matriz-extra.txt` y las 186 de `S111-matriz-extra.txt`, 333 sin repetir) y `colaSegunda113`, en
  modo `anclas` sobre `f3bee15`: aplican todas, árbol limpio (`S113-anclas-cierre.out.txt`).
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` en el principal, y
  `npm run validate` con `NODE_ENV=development`, sin worktrees, en primer plano
  (`_scratch/S113-validate.out.txt`).
- **El mensaje de la 114** (`A12`) está en `_scratch/S114-PROMPT.md`.
- **Victor dio el OK para mergear de antemano** («tienes el ok de antemano en esta ocasión») y pidió apagar
  la computadora al terminar.
