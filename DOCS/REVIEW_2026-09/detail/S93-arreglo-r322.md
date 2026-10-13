# Sesión 93 — arreglo de lo de la 92 (2026-10-13)

En un chat nuevo, en la terminal, con 3 agentes en worktree que solo midieron (Victor pidió 6; se le
recordó la 37 y eligió 3), con el mensaje de `_scratch/S93-PROMPT.md`. Cierra `R9-322` con un
comentario en `src/features/study/prepAccount.ts`.

> **Corregido en la 94** (`detail/S94-revision-del-diff-s93.md`): la 93 se mergeó (`2ebad5f`). En
> §1, «the account of that key» para lo pedido antes del primer estado no lo fija
> `prepAccount.test.ts:97` (una lectura sin nada sembrado), sino las de `R9-310` (`:176`) y `R9-314`
> (`:229`). En §6, una unión que falla dentro de `prepMultiSet` no la arma `muere` (que la cuelga):
> no la arma ninguna prueba (`R9-328`). Y «a store's write … lo fijan las de `R9-275` y `R9-292`»
> (§3) vale solo para notas (`R9-325`); el «cuándo» del respaldo es `R9-298`.

- **Estado al empezar:** `main` = `origin/main` = `b54ebea` (la 92, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38359587793`, 3 jobs, Node v24.21.0, 374/4632; rama borrada
  tras `git cherry`). Los docs decían «sin mergear» para la 92: corregido aquí. `main` no era más
  nuevo, así que no hizo falta volver a mirar el CI.
- **Ramas:** `fix/s93-r322` (`8dd8c92`, el comentario) y `docs/review-s93-fix` encima (solo docs),
  sin mergear hasta el OK de Victor.
- **Resultado:** cerrado `R9-322`. Un nuevo P3, `R9-323`, que no abrió la 93. Quedan 323 hallazgos,
  ningún P0.

## 0. Cómo se trabajó

- **El comentario se escribió y se commiteó primero** (`8dd8c92`), y los agentes midieron sobre ese
  commit. Fueron tres forks con `isolation: "worktree"`, verificados en `8dd8c92` (nacieron en
  `b54ebea` y se movieron con `git reset --hard`). Las herramientas se las dio
  `_scratch/S93-copiar.cjs.txt <raíz> <N>`: la `S92-sonda` y la `S65-igual` con `ROOT` en el
  worktree, y la salida con el prefijo `S93-aN-`. Cada uno copió su `_scratch` a
  `_scratch/S93-sondas-agente-N/`, con su informe (`S93-aN-informe.md.txt`).
  - **A1:** cada lectura al pie de la letra de las frases nuevas, hecha código (166k tokens, 22
    llamadas, 4 min).
  - **A2:** que sea solo comentarios, y el `grep` de la regla de la 92 (161k, 18, 2 min).
  - **A3:** «¿abre algo?», camino por camino (166k, 17, 3 min).
- **Los worktrees no se borraron solos.** Se quitaron a mano, después de comparar con `diff -rq`
  cada `_scratch` contra su copia (iguales) y de ver que no había `node_modules`.
- **Re-medido en el árbol principal** lo que se cita aquí, con `_scratch/S93-sonda.cjs.txt`. La
  genera `S93-gen.cjs.txt`: la `S92-sonda` más las piezas `// S93-aN` de las copias. Después,
  `S93-edita.cjs.txt` le agrega `editaTrasFalla`, y `S93-gen` la borraría si se volviera a correr.
  Salidas: `S93-sonda-<corrida>-<modo>.out.txt`. `git status` quedó limpio tras cada corrida.
- **Un desliz del orquestador:** `_scratch/S93-igual.cjs.txt` se armó con un `node -e` con barras
  invertidas, cosa que el mensaje prohíbe. El archivo salió bien, y se usó tal cual.

## 1. El arreglo (`8dd8c92`)

Solo comentarios, en el de `prepKey` (`prepAccount.ts:96-104`). Antes:

> taken at the call once the auth state is known (a write queued behind others still goes to the
> account of when it was asked for), else at the first auth state.

Ahora:

> taken at the call once the auth state is known, else at the first auth state. A write goes to the
> account of that key even if it waits behind others, except R9-275: if that account's Mesa was
> given back by the time the write's turn comes, a store's write goes to the Mesa «sin cuenta»
> instead (`prepWrite`), and the restore's is written to the account all the same and then given
> back (`prepMultiSet`).

Dos diferencias con la frase que pedía el mensaje («va a la sin cuenta»), las dos medidas:

- **El respaldo no se desvía.** La frase corta, leída para el respaldo, es `respaldoDesviado`, el
  arreglo que `R9-275` descartó porque reemplaza la Mesa «sin cuenta». Hecha código, tumba dos
  pruebas (§3). El comentario nuevo dice lo mismo que la cabecera (`:44-49`) y `prepMultiSet`.
- **No solo «queued», y no «of when it was asked for».** Una escritura que no espera en cola,
  pedida entre la devolución y `setPrepAccount(null)`, se desvía igual: lo midió `noEnCola` (§3).
  Y una escritura pedida antes del primer estado de auth toma la clave de ese estado, no la de
  cuando se pidió. A la frase vieja la salvaba estar dentro de «once the auth state is known»;
  sacada de ahí, habría sido falsa. «The account of that key» vale en los dos casos (A2 y A3, por
  lectura; lo fija la prueba de `prepAccount.test.ts:97`).

## 2. Que sea solo comentarios

- `git diff -U0 main 8dd8c92`: 8 líneas (2 quitadas, 6 puestas), todas empiezan con ` *` dentro del
  `/** */` de `prepKey`. La apertura y el cierre no cambian, y `export function prepKey` tampoco.
- **La regla de la 65** (`_scratch/S93-igual.cjs.txt`, el JS emitido sin comentarios;
  `S93-igual.out.txt`): contra `main`, igual (8590 caracteres). Control contra `1f02511` (sin la
  etiqueta en `oneAtATime`): distinto (8526). Contra `3bccafd~1` (`e4d7e3a`), igual. Se leyó la
  última línea de cada salida. A2 dio lo mismo en su worktree.

## 3. Lo que afirma cada frase, al pie de la letra

`prep` (las 23 de `backupRestoreSignal`, `backupPrepTurn` y `prepAccount`). Las de A1, re-medidas
aquí; las de A3, con `-t S93-a3`, y la nuestra con `-t S93`.

| corrida                                          | `Tests:`       | qué cae                                                                                                                               |
| ------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `nada`                                           | 23 pasan       | —                                                                                                                                     |
| `segunPrepKey` (la frase vieja como código)      | 2 caen         | `R9-275` en `prepAccount.test.ts` (aparece `@prep_notes:ana`) y `R9-292` (`"ana": ["Rom/8/28"]`). Su ancla sirvió sin cambios         |
| `respaldoDesviado` (la frase corta, al respaldo) | 2 caen         | `R9-292` y `R9-275` en `backupPrepTurn.test.ts`: el `multiSet` reemplaza la «sin cuenta» y se pierde `John/3/16-21`                   |
| `respaldoSinDevolver`                            | 2 caen         | las mismas dos                                                                                                                        |
| `desvioAlPedir` (el desvío al llamar)            | 1 cae          | `R9-275` en `prepAccount.test.ts`                                                                                                     |
| `cuentaAlTurno` (la cuenta de cuando le toca)    | 2 caen         | «una escritura va a la cuenta de cuando se pidió, aunque se cambie de cuenta…» y `R9-275` en `prepAccount.test.ts`                    |
| `storeComoRespaldo`                              | 1 cae          | `R9-275` en `prepAccount.test.ts`                                                                                                     |
| `devueltaAlAnotar` / `devueltaAunqueFalle`       | **23 pasan**   | nada: `R9-323`                                                                                                                        |
| `noEnCola` · `segunPrepKey+noEnCola` (A3)        | pasa · **cae** | sin cola, tras la devolución: pide `@prep_notes:ana` y escribe en la «sin cuenta»; con la frase vieja, aparece `@prep_notes:ana`      |
| `noEnColaFalla` · `segunPrepKey+noEnColaFalla`   | pasa · pasa    | la devolución falla: escribe en `@prep_notes:ana`, y el arranque siguiente devuelve las dos. Control: sin desvío, la frase vieja vale |

- **«by the time the write's turn comes»** lo fija la prueba de `R9-275` en `prepAccount.test.ts`
  (`desvioAlPedir`). **«a store's write … and the restore's»** lo fijan las de `R9-275` en los dos
  archivos y la de `R9-292` (`respaldoDesviado`, `respaldoSinDevolver`, `storeComoRespaldo`).
  **«even if it waits behind others»**, la de `prepAccount.test.ts:88` (`cuentaAlTurno`).
- **`noEnCola`**: ninguna de las 23 arma una escritura sin cola tras la devolución. No hace falta
  para este comentario: la frase vieja ya cae por las otras dos.
- **«was given back»** (la devolución terminada) no lo fija ninguna prueba: §4.

## 4. Nuevo: `R9-323` (A1, medido aquí)

- **`devueltaAlAnotar`** (`givenBack` se agrega al anotar, antes de la unión) y
  **`devueltaAunqueFalle`** (se agrega antes de la unión, dentro del turno, aunque la unión falle)
  pasan las 23 de `prep` y las 1004 de `suite` (las relacionadas con `prepAccount.ts`,
  `BackupService.ts`, `restoreSignal.ts` y `MemoryDeckContext.tsx`; control `nada`, 1004).
  `muestraDevuelta` (A1) cuenta los desvíos: 3 en las 23, y los tres con la unión ya terminada.
  Ninguno cae entre la nota y el fin de la unión, ni tras una unión fallida, con ninguna de las dos
  piezas.
- **El daño** (`editaTrasFalla`, `_scratch/S93-edita.cjs.txt`): Ana escribe P (`observation`), su
  devolución falla (el `multiSet` a `@prep_notes` lanza), Ana edita P (`application`) y el arranque
  siguiente termina la devolución. Con el código de hoy, la edición va a `@prep_notes:ana` y P queda
  con las dos secciones. Con `devueltaAunqueFalle` o `devueltaAlAnotar`, la edición va a la «sin
  cuenta», sobre una P que ahí no existe: queda solo con `application` y un reloj más nuevo, y la
  unión del arranque siguiente (`sourceGoes`, gana la más nueva) pierde `observation: "de Ana"`. La
  pieza `noEnColaFalla` de A3 también cae con las dos.
- **¿Lo abrió la 93?** No: el `add` después de la unión es de la 59 (`37ba5f7`), y nadie lo
  vigila desde entonces. El comentario nuevo dice «was given back», como el de `prepWrite`.

## 5. Las frases que definen lo mismo (A2, la regla de la 92)

`grep` de «asked for», «account of when», «given back», «by the time», «all the same», «waits
behind», «queued», «goes to the» y «sin cuenta» en `src/features/study`, `BackupService.ts`,
`AuthContext.tsx`, `src/lib/backup` y las pruebas de la Mesa. Ninguna dice lo contrario del
comentario nuevo para el mismo caso:

- **La cabecera de `R9-275`** (`:44-49`), `prepWrite` (`:148-154`), `prepMultiSet` (`:177-182`), el
  `Set` (`:127-132`), `givenBack` (`:118-122`) y el export (`:435-442`), con las líneas de
  `8dd8c92`: coinciden.
- **Los cuatro stores** («R9-59 — the account of when the write was asked for», sobre
  `const key = prepKey(...)`), `BackupService.ts:1399` y `:1642-1645`, y los títulos y comentarios
  de las pruebas de `R9-275` y `R9-292`: coinciden.
- **Matices, por lectura, sin hallazgo:**
  - «Of when it was asked for» (la cabecera y los stores) no es exacta para una escritura pedida
    antes del primer estado de auth. Hablan de la clave, en el contexto de una cuenta borrada, y
    no chocan con el comentario nuevo.
  - El título de `prepAccount.test.ts:88` («una escritura va a la cuenta de cuando se pidió,
    aunque se cambie de cuenta antes de que corra») es la frase vieja sin la excepción. Pero es el
    título de su caso (de Ana a Beto, sin devolución), y para ese caso es cierta.

## 6. Lo demás que vio A3, por lectura

- Los cuatro stores leen y escriben solo la clave que les pasa `prepWrite`.
- El respaldo resuelve `prepKey` antes de SQLite (`BackupService.ts:1400-1415`). `prepMultiSet`
  calcula `gone` dentro del turno, escribe las claves sin cambiarlas y devuelve después.
- «Then given back»: si la unión falla dentro de `prepMultiSet`, la nota queda y el arranque
  siguiente termina la devolución (lo dice el comentario de `prepMultiSet`; lo arma el caso `muere`
  de `backupPrepTurn.test.ts`).
- Si además falla `noteRelease` (que se traga el error), nada devuelve esa Mesa. Viene de antes y
  está escrito en `noteRelease` («only its retry is lost»): no es hallazgo.
- El export es una lectura, y el comentario solo habla de escrituras. En `noEnCola`, entre la
  devolución y `setPrepAccount(null)`, `prepKey` da `@prep_notes:ana`. Es el pendiente de
  `detail/S92` §3, sin cambios.

## 7. La lección

- **Una lectura al pie de la letra que pasa todas las pruebas no es inocua por eso: medí su daño
  con un caso hecho para ella.** La regla de la 90 busca la lectura que tumba una prueba con el
  código bueno. La 93 encontró la contraria: «was given back» leído como «se marcó»
  (`devueltaAunqueFalle`) pasa las 1004, y pierde una sección (`editaTrasFalla`). Medido.
- **Al escribir una excepción, escribila para cada camino que pasa por la frase.** La frase del
  mensaje («entonces va a la sin cuenta»), leída para el respaldo, tumba dos pruebas
  (`respaldoDesviado`). Y sacar el paréntesis viejo de «once the auth state is known» lo habría
  vuelto falso para lo pedido antes del primer estado. Medido lo primero; lo segundo, por lectura.

## 8. El checkpoint

`npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con
`NODE_ENV=development` (`_scratch/S93-validate.out.txt`): exit 0. Typecheck limpio, lint con 0
errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites, 4632/4632 pruebas.
Se corrió sin worktrees de agentes (`tsc` no excluye `.claude/`).
