# Sesión 95 — arreglo de lo de la 94 (2026-10-13)

En un chat nuevo, en la terminal, con 3 agentes en worktree que solo midieron (Victor los pidió),
con el mensaje de `_scratch/S95-PROMPT.md`. Arregla `R9-323`..`R9-331` y `R9-298`, de la 94.

- **Estado al empezar:** `main` = `origin/main` = `cdb1d94` (la 94, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38440174970`, 3 jobs, Node v24.21.0, 374/4632; rama borrada
  tras `git cherry`). Comprobado con `git fetch` y `git log -1 origin/main`; como `main` no era más
  nuevo, no hizo falta mirar el CI. Los docs decían «sin mergear» para la 94 en tres lugares
  (`CONTINUAR.md` arriba y §2, `INDEX.md`, `BUGS.md`): corregido aquí. El detalle de la 94 queda
  como registro de su momento.
- **Ramas:** `fix/s95-arreglos-s94` (cuatro commits) y `docs/review-s95-fix` encima, sin mergear
  hasta el OK de Victor.
- **Resultado:** cerrados 10 (`R9-298`, `R9-323`..`R9-329`, `R9-331` y `R9-332`). Nuevo `R9-333`
  (P3, pruebas; no lo abrió la 95). `R9-330` queda sin arreglar, a decidir. Quedan 333 hallazgos,
  ningún P0.

## 0. Cómo se trabajó

- **Los arreglos, escritos y commiteados primero** por el orquestador, y los agentes buscaron
  romperlos:
  - `3084a4c`: las pruebas que faltaban, más un gancho con nombre. El pedido de `giveBack` lleva
    una etiqueta, y `__prepTurnWaitingForTests(undefined)` se reemplaza por
    `__prepGiveBackWaitingForTests(uid)`. No cambia lo que hace la app: es una etiqueta que solo
    leen las pruebas. Toca `src/`, aunque el mensaje decía «código de la app, sin tocar»; se
    entendió así porque el mismo mensaje pedía el gancho.
  - `3b47ff8`: los comentarios de `R9-324` y `R9-332`, y la prueba de los cuatro stores.
  - `77418b4`: `R9-331`.
  - `f02c798`: lo que vieron los agentes (§3).
- **Tres forks con `isolation: "worktree"`**, nacidos en `cdb1d94` y movidos a `77418b4` con
  `git reset --hard`.
  - Las herramientas se las dio `_scratch/S95-copiar.cjs.txt <raíz> <N>`. Su fuente es
    `S95-sonda.cjs.txt`, no `S94-sonda.cjs.txt` como decía el mensaje: la 95 cambió comentarios que
    eran anclas, y la `S95-sonda` trae las piezas re-ancladas (`storesAlPedirS95`, `alPedir<X>`) y
    `sinR331`.
  - Los tres completaron, sin cortes: 343-349k tokens, 19-26 llamadas, de 10 a 17 minutos. Cada
    uno copió su `_scratch` a `_scratch/S95-sondas-agente-N/`, con su informe
    (`S95-aN-informe.md.txt`).
  - Los worktrees no se borraron solos. `diff -rq` de cada `_scratch` contra su copia dio igual en
    los tres, y después `git worktree remove --force` y `git branch -D`.
- **Re-medido en el árbol principal** todo lo que se cita aquí, con `_scratch/S95-sonda.cjs.txt`.
  La genera `S95-gen.cjs.txt`: la `S94-sonda`, más las piezas propias (`S95-propias.txt`) y los
  bloques `// S95-aN` de las copias. Un nombre que ya existe pasa a `<nombre>A<n>`; la primera
  versión abortaba y se corrigió (`S95-gen-fix.cjs.txt`). Salidas: `S95-lote1..10.out.txt` y
  `S95-sonda-<corrida>-<modo>.out.txt`. `git status` quedó limpio (salvo lo commiteado) tras cada
  corrida.
- **Deslices con la línea de comandos** (el mensaje los prohíbe), del orquestador, los dos con
  heredoc entre comillas: el anexo de `sinR331` a `S95-propias.txt` llevaba `\n`, y
  `S95-gen-fix.cjs.txt` llevaba acentos graves. Los dos salieron bien. Además, un `-t` con `|` se
  partió en `cmd.exe` (la sonda corre jest con `shell: true`), sin tocar el árbol: se repitió con
  clases (`R9-3[23]`). El agente 2 dice no haber tenido ninguno; los otros dos no lo mencionan.

## 1. Las pruebas (`3084a4c`)

`prep` = las tres suites (`backupRestoreSignal`, `backupPrepTurn`, `prepAccount`); control `nada`,
32/32 en `3084a4c` y 35/35 en `f02c798`. Cada prueba cae con su pieza, con el daño en el rojo y los
controles en su valor (leído entero en el principal):

| prueba                          | cae con                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `R9-323` A (devolución fallida) | las seis `devuelta*` (`…AlAnotar`, `…TrasAnotar`, `…AlEmpezar`, `…AunqueFalle`, `…EnCatch`, `…EnFinally`) |
| `R9-323` B (edición en cola)    | `devueltaAlAnotar`, `…TrasAnotar`, `…AlEmpezar`; y sola, `anotaYDesmarca` (agente 1)                      |
| `R9-325` (cuatro stores)        | cada `sinDesvio<X>` y `leeCuenta<X>`, y `unaSinCuenta`                                                    |
| `R9-326` (otra cuenta)          | `cualquierDevuelta`                                                                                       |
| `R9-327` (store tras respaldo)  | `devuelveFueraDelTurno`                                                                                   |
| `R9-328` (muere / falla)        | `notaTrasEscribir` / `respaldoFallaSinNota`                                                               |
| `R9-329` (la nota falla)        | `notaLanza`                                                                                               |
| `R9-298` (respaldo en cola)     | `goneAlPedir`, `goneAlPedirA10`, `respaldoAlPedir`                                                        |

- `devueltaEnFinish` no tumba ninguna (sin daño, como en la 94). `sinEtiqueta323` (el pedido de
  `giveBack` sin etiqueta) tumba la B y la de `R9-298` solo en sus controles: el gancho con nombre
  es lo que leen.
- **La B hace falta** (la regla de la 39): toda pieza de la 94 que la tumba tumba también la A,
  pero `anotaYDesmarca` (marca al anotar, desmarca si la unión falla) tumba solo la B.
- **Los cortes** (agente 1): las esperas son de hasta 1000 vueltas. Con el paso esperado 990
  vueltas más lento, todas pasan; con 1005, caen en un control, sin verde falso, también junto con
  su regresión. Las excepciones fueron las dos de `R9-327` (§3).
- **El otro orden** (la regla de la 75, agente 1): `desvioAlPedir` no lo ve ninguna nueva, y lo ve la
  vieja de `R9-275`. En el otro orden, la B y la de `R9-327` caen con el código bueno en sus
  controles.

## 2. Los comentarios (`3b47ff8`) y `R9-331` (`77418b4`)

- **Seis frases, no cinco:** la cabecera, los cuatro stores y la de `prepWrite` (`R9-332`, que la 94
  no vio). Ahora remiten a `prepKey`. Además, el título de la prueba de `:88` dice su condición (el
  estado ya conocido).
- **Solo comentarios** (la regla de la 65, `S95-igual.cjs.txt`, la última línea): igual a
  `3084a4c`; distinto de `3084a4c~1` y de `b54ebea`. Ninguna línea tocada que no sea comentario. El
  agente 2 lo midió aparte, con los mismos resultados.
- **La prueba de los stores escribe en los cuatro** antes del primer estado (la 94 la tenía con
  notas, que es la clase de `R9-325`). Cae con `storesAlPedirS95` y con cada `alPedir<X>`, un store
  por vez. `claveAlPedir` sigue cayendo, y ahora tumba también esta.
- **La regla de la 92 sobre cada frase nueva** (agente 2): `claveEnTurno` (la clave tomada al
  escribir) tumba la de `:88`; `etiquetaCuenta` y `esperaSoloDurante` pasan sin daño posible (el
  `what` de `prepWrite` empieza siempre con `@`; tras el primer estado, `markKnown` ya es nulo); las
  demás solo remiten.
- **`R9-331`:** `setPrepAccount` guarda el trabajo del primer estado, y todo estado lo espera.
  - Lo único que espera a `markKnown` es `prepKey`; por él, las lecturas de los stores, sus
    escrituras, y `BackupService` al exportar y al restaurar.
  - El agente 2 midió cuatro caminos con un segundo estado, y el arreglo los cierra.
  - Con `turnoAntesDeClave` (la traba de la 55), un segundo estado ya no la destraba
    (`trabaSegundo`). No hay camino en la app que lo haga, y la prueba de `R9-310` sigue cayendo
    con esa pieza.
  - El caso `carla` (agente 2): la clave toma la cuenta del último estado llegado antes de que
    termine el trabajo, y nada se queda colgado con dos o tres estados.

## 3. Lo que vieron los agentes, corregido en `f02c798`

- **La prueba de `R9-331` fijaba solo la devolución** (agente 2). Con `soloDevolucion` (el segundo
  estado espera solo `finishRelease`) pasaba. Prueba nueva con la Mesa de antes (primer estado
  nulo, segundo `'ana'`, una lectura y una escritura pedidas antes), hecha de sus sondas
  `migraSegundo` y `escribeSegundo`. Cae con `sinR331`, `soloDevolucion`, `claveDelPrimerEstado` y
  `claveAntesDeUnionS95`.
- **La frase de `prepKey`** («else at the first auth state»), con el arreglo, admitía «la cuenta del
  primer estado» (`claveDelPrimerEstado`). Esa lectura pasaba las 1015 relacionadas y partía la
  entrada (agente 2). Ahora dice «once the first auth state's work is done (R9-331), with the
  account signed in then». En ese commit, `src/` es solo comentario (igual a `77418b4`).
- **La prueba de `R9-327`** (agente 1) tenía dos defectos:
  - Con otra escritura de notas en la cola del store (`ajenoR327`), el control `enEspera` la contaba
    por la edición, que pedía su turno tarde, y pasaba con la regresión. Ahora la edición va por
    `prepWrite` directo, con los helpers del store: `ajenoR327b` cae con el código bueno
    (`enEspera: 2`), también junto con la regresión.
  - Con el `multiSet` del respaldo más allá de la espera (`multiSetTarde1005`), la puerta lo
    retenía sin que nadie lo soltara (20 s). Ahora deja de retener pasada la espera: aislada, cae en
    `retenida: null` en 3-5 s.
  - En el `prep` entero, con esa pieza, pasaba por contaminación de las que caen antes en el
    archivo (la regla de la 63).

## 4. La matriz (agente 3) y `R9-333`

- **La matriz entera:** 132 corridas en `prep` sobre `77418b4` (las 128 de la `S94-sonda` que
  siguen aplicando, más 4 re-ancladas). Cambian 21, y las 21 pasan de «pasa» a «cae»: las
  regresiones que la 94 dejó sin prueba. Ninguna que caía deja de caer.
  - Dejan de aplicar por la 95 ocho piezas: cuatro por `R9-331`, tres por la etiqueta y una por
    `R9-324`.
  - Las re-ancladas siguen cayendo (re-medido: `claveAntesDeUnionS95`, `claveAntesDeFinishS95`,
    `devueltaAlBorrarNotaS95`); `soloEsteProcesoS95` sigue sin daño.
  - `pruebaR323` (las pruebas del agente 6 de la 94, tal cual) cae ahora en su B con el código
    bueno, porque contaba los pedidos sin etiqueta: es lo esperado del gancho con nombre.
- **`notaLenta50` y `turnoLento50`** (cambios buenos) tumban pruebas viejas en el `prep` entero: las
  de `R9-274`, `R9-275` (las dos suites) y `R9-292`. Pasa igual en `cdb1d94`: no lo abrió la 95. Las
  11 nuevas pasan aisladas con las dos piezas.
- **`R9-333`:** de esas, la de `R9-274` (caso `termina`, 10 vueltas fijas) da un rojo que se lee
  como pérdida (`@prep_notes:ana`, `sinCuenta: []`) sin que el caso se arme. Las demás caen en sus
  controles.

## 5. `R9-330`: sin arreglar, a decidir

- **No se escribió código.** Redirigir la escritura entera (`sigueAdopcion`) tumba la de `R9-269`:
  tiene que ser por entrada, y `prepWrite` no sabe qué entrada edita el store.
- **El agente 3 midió un diseño** (`porEntradaAuto`, re-medido aquí): la adopción anota lo que
  movió, y `prepWrite(key, fn, entrada?)` escribe en la cuenta adoptada si una adopción posterior a
  su pedido movió esa entrada. Con él, `editaTrasAdoptar` deja la entrada junta, y pasa `prep`
  (35/35) y el suite (1015/1015, en su worktree).
- **Es parcial.** Notas y autoevaluación pasan el pasaje en una línea. Series e ilustraciones
  escriben con `mutate(fn)` sobre el mapa entero, y harían falta un id por llamada (unos 11
  llamadores). Y una escritura pedida después de la adopción y antes de `setPrepAccount(uid)` no se
  redirige (por lectura, sin sonda).
- Por eso se deja para que Victor decida si vale el cambio (P3: una ventana estrecha al entrar con
  Google, y la entrada se parte, no se pierde).

## 6. Las lecciones

- **Un arreglo que cambia CUÁNDO se toma un valor re-mide las frases que dicen cuándo.** `R9-331`
  hizo que lo pedido antes del primer estado esperara también a un estado posterior. La frase de
  `prepKey` («else at the first auth state»), cierta antes, pasó a admitir una lectura que pasa las
  1015 y parte una entrada (`claveDelPrimerEstado`). Medido (agente 2; re-medido).
- **La prueba de un arreglo que espera un trabajo se arma para cada parte de ese trabajo.** La de
  `R9-331` retenía la devolución, y el trabajo del primer estado es la migración Y la devolución:
  una regresión que esperara solo la devolución pasaba (`soloDevolucion`). Medido (agente 2;
  re-medido).
- **Un control por clave no ve las colas que hay delante del turno.** La edición de `R9-327` iba por
  el store, cuya cola la ponía detrás de otra escritura de notas; el gancho contaba esa, y la
  edición pedía su turno tarde (`ajenoR327`, verde falso). Armá el caso con el paso más corto al
  turno, y corré el ajeno contra él. Medido (agente 1; re-medido con `ajenoR327b`).

## 7. El checkpoint

`npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con
`NODE_ENV=development` (`_scratch/S95-validate.out.txt`), corrido sin worktrees de agentes: exit 0.
Typecheck limpio, lint con 0 errores (los 70 avisos de siempre), `format:check` limpio, y jest
374/374 suites, 4644/4644 pruebas (12 más que las 4632 de la 94). El aviso de jest «A worker
process has failed to exit gracefully» ya salía en las validaciones de la 90 a la 94. El mensaje de
la 96 está en `_scratch/S96-PROMPT.md`.
