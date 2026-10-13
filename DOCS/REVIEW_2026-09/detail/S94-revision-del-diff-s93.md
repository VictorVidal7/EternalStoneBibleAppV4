# Sesión 94 — revisión del diff de la 93 (2026-10-13)

En un chat nuevo, en la terminal, con 10 agentes en worktree que solo midieron (Victor los pidió
sabiendo lo de la 3 y la 37), con el mensaje de `_scratch/S94-PROMPT.md`. Revisa `b54ebea..8dd8c92`:
el comentario de `prepKey` que cerró `R9-322`.

- **Estado al empezar:** `main` = `origin/main` = `2ebad5f` (la 93, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38434416369`, 3 jobs, Node v24.21.0, 374/4632; ramas borradas
  tras `git cherry`). Los docs decían «sin mergear» para la 93 en cinco lugares: corregido aquí
  (`CONTINUAR.md` arriba y §2, `INDEX.md`, `BUGS.md`; el detalle de la 93 queda como registro de su
  momento). `main` no era más nuevo, así que no hizo falta volver a mirar el CI.
- **Rama:** `docs/review-s94-diff-s93` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 93 se sostiene como código: solo comentarios, y el comentario dice lo que
  hace el código. Pero el ledger de la 93 dice que su sentido lo fijan las pruebas, y no es así en
  tres stores, en el «cuándo» del respaldo ni en la nota. 8 nuevos, todos P3, ninguno abierto por la
  93 (`R9-324`..`R9-331`): uno de comentario, cinco de pruebas y dos de código. Quedan 331
  hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Diez forks con `isolation: "worktree"`**, nacidos en `2ebad5f` (ninguno tuvo que moverse). Las
  herramientas se las dio `_scratch/S94-copiar.cjs.txt <raíz> <N>` (la `S93-sonda` y la `S65-igual`
  con `ROOT` en el worktree; salida con prefijo `S94-aN-`; acepta el 10). Cada uno copió su
  `_scratch` a `_scratch/S94-sondas-agente-N/`, con su informe (`S94-aN-informe.md.txt`).
  - **Los diez completaron**, sin cortes: 141-190k tokens, 22-33 llamadas, de 2 a 11 minutos.
  - **Los worktrees se borraron solos, con sus ramas.** La copia fue lo único que quedó, y estaba
    entera (no hubo `diff -rq` posible: ya no había contra qué).
  - **Dos agentes vieron una suite que no arrancó** en una corrida `suite` (`EPERM` al renombrar en
    la caché de jest de `%TEMP%`, que comparten los procesos en paralelo): 994 y 1000 pruebas en vez
    de 1004. La re-corrida dio 1004. No viene del código.
- **Re-medido en el árbol principal** todo lo que se cita aquí, con `_scratch/S94-sonda.cjs.txt`.
  La genera `S94-gen.cjs.txt`: la `S93-sonda` más los bloques `// S94-aN` de las copias (59 piezas;
  `goneAlPedir` estaba en dos agentes, y la del 10 pasó a `goneAlPedirA10`). Salidas:
  `S94-sonda-<corrida>-<modo>.out.txt`, resumidas con `S94-resumen.cjs.txt`; los cuatro lotes, en
  `S94-lote1..4.out.txt`. `git status` quedó limpio (salvo los docs de esta rama) tras cada corrida.
- **Deslices con la línea de comandos** (el mensaje los prohíbe): el orquestador corrió un `node -e`
  con barras invertidas (de solo lectura, para contar nombres de piezas); el agente 8, un `sed` con
  acentos graves sobre su informe; el agente 10, un `node -e` con `\n` para meter una pieza (el
  control del ancla dio 1). Los tres salieron bien.

## 1. Solo comentarios (A1)

- `8dd8c92` toca un solo archivo (`prepAccount.ts`, +6 −2), un hunk, las 8 líneas con ` *` dentro
  del `/** */` de `prepKey`; ninguna línea que no sea comentario (regla de la 66). `2ebad5f` toca
  solo `DOCS/REVIEW_2026-09/`. El JSDoc sigue pegado a `export function prepKey` (`:104` es el
  cierre, `:105` la función); NUL 0, CR 0, sin BOM.
- **La regla de la 65** (`S94-a1-igual`; la última línea de cada salida): contra `b54ebea`, `main`
  y `8dd8c92`, igual (8590). Controles con otro código, con `~1` o el hash: `1f02511`, `9d3f489~1`
  (= `028a156`) y `37ba5f7~1` (= `fb7696f`), distinto. `538b1bc~1` resuelve a `1f02511`, el mismo de
  la 93. El número que imprime `S65-igual` es el de la BASE.

## 2. El detalle de la 93 (A7)

- **Su tabla (§3) se reproduce**, corrida por corrida, y también §4 y `R9-323` (`editaTrasFalla`
  con las dos piezas: P queda `{application: "despues"}`).
- **Sus `archivo:línea` son los de `8dd8c92`.** El `:302` que cita `R9-323` viene de `detail/S92`
  (en `8dd8c92`, el `add` está en `:306`).
- **Conteos:** 323 entradas en `BUGS.md`, de `R9-1` a `R9-323`, sin huecos ni repetidas; `INDEX.md`
  y `CONTINUAR.md` dicen lo mismo.
- **Dos citas que no fijan lo que dicen** (corregidas con una nota en el detalle de la 93):
  - §1: «"the account of that key" … lo fija la prueba de `prepAccount.test.ts:97`». Esa prueba es
    una lectura sin nada sembrado y pasa con la frase vieja hecha código (`pedidaSinEstado`, A8;
    `claveDeAlPedir`, A7; `escrituraAlPedir`, A10). Lo fijan la de `R9-310` (`:176`) y la de
    `R9-314` (`:229`).
  - §6: «si la unión falla dentro de `prepMultiSet`, la nota queda (… lo arma el caso `muere`)».
    `muere` cuelga la unión, no la hace fallar; ninguna prueba arma una unión que falla (`R9-328`).

## 3. Cada frase nueva, al pie de la letra (A2-A5)

`prep` = las 23 de `backupRestoreSignal`, `backupPrepTurn` y `prepAccount`; `suite` = las 1004
relacionadas. Control `nada`: 23/23 y 1004/1004.

| frase                                  | lecturas que caen con el código bueno                                                                                                                      | lecturas que pasan las 1004 (y su daño)                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| «even if it waits behind others»       | `sigueAdopcion` (1: `R9-269`), `respaldoClaveTarde` (2: `R9-275` del respaldo y `R9-292`)                                                                  | — (pero `editaTrasAdoptar` y `segundoEstado`, defectos del código de hoy: `R9-330`, `R9-331`)        |
| «that account's … given back by …»     | `cuentaDeAhora` (1), `claveBorrada` (6), `devueltaAlBorrarNota` (1), `vaciaAlCambiar` (2)                                                                  | `cualquierDevuelta` (`R9-326`); `goneAlPedir` (`R9-298`); `soloEsteProceso` (sin daño posible)       |
| «a store's write goes to … sin cuenta» | `sinDesvioNotas`, `leeCuentaNotas` (2 cada una: `R9-275` y `R9-292`)                                                                                       | `sinDesvio` y `leeCuenta` de series, ilustraciones y autoevaluación (`R9-325`); `unaSinCuenta`       |
| «the restore's … then given back»      | `respaldoSinAnotar` (1), `devuelveLaDeAhora` (2), `devuelveAntes` (2); `devuelveTodas` (0 en `prep`, 1 en `suite`: la de `R9-59` en `backupServiceImport`) | `devuelveFueraDelTurno` (`R9-327`); `respaldoAlPedir` (`R9-298`); `devuelveSinSourceGoes` (`R9-300`) |

- **`soloEsteProceso`** (lo devuelto por `finishRelease` no cuenta) solo se distingue si un proceso
  posterior entra como la cuenta borrada, y la cabecera de `givenBack` dice que no pasa. Sin daño.
- **«Cuando le llega el turno» y «cuando escribe»** son lo mismo por construcción: el desvío se
  decide al entrar al turno, que es exclusivo (A3, por lectura).
- **El comentario dice lo que hace el código** en todas las lecturas: lo que pasa las 1004 lo pasa
  porque nadie lo vigila, no porque el código haga otra cosa.

## 4. Nuevos: `R9-324`..`R9-331`

Cada uno con su pieza, su caso y su control, re-medidos aquí. Ninguno lo abrió la 93.

- **`R9-324` (comentario):** la frase vieja «of when it was asked for» sigue en la cabecera de
  `prepAccount.ts` (`:44`) y en los cuatro stores. La cabecera al pie de la letra (`claveAlPedir`,
  la pieza de la 83) tumba `R9-310` y `R9-314`; la de los stores (`storesAlPedir`) tumba solo
  `R9-292` con los controles en 0 (caso no armado, sin pérdida), y su daño lo muestra
  `storeAntesDeAuth`: lo escrito antes del primer estado de auth va a la «sin cuenta» en vez de a
  Ana. A8 y A9, por separado.
- **`R9-325` (pruebas):** el desvío de `R9-275` en series, ilustraciones y autoevaluación no lo
  vigila ninguna prueba (`sinDesvio<X>`, `leeCuenta<X>`: 23/23 y 1004/1004). Daño con `cuatroStores`
  (A4): la escritura queda bajo el uid borrado, o lo devuelto de ese store se reemplaza.
- **`R9-326` (pruebas):** que el desvío mire la cuenta DE LA CLAVE no lo fija ninguna prueba
  (`cualquierDevuelta`: basta que se haya devuelto alguna). Daño con `otraCuentaTrasDevolver` (A3):
  Beto entra tras el borrado de Ana en el mismo proceso y su escritura se esconde en la «sin
  cuenta».
- **`R9-327` (pruebas):** la devolución del respaldo en otro turno (`devuelveFueraDelTurno`, que es
  `devolucionGiveBack` de la 73, juzgada «benigna» en `R9-301`) pasa las 1004 y pierde la sección
  restaurada (`tiendaTrasRespaldo`, A5).
- **`R9-328` (pruebas):** «noted first» y «keeps its note» de `prepMultiSet` no los fija ninguna
  prueba: `notaTrasEscribir` (la nota después del `multiSet`) y `respaldoFallaSinNota` (la nota se
  quita si la unión falla) pasan las 1004, y dejan lo restaurado bajo el uid borrado
  (`muereTrasEscribir`, `respaldoFalla`; A10).
- **`R9-329` (pruebas):** que `noteRelease` se trague su error no lo fija ninguna prueba
  (`notaLanza`, 1004/1004); con la nota que falla, la devolución no corre y P queda bajo el uid
  borrado (`notaFalla`, A10).
- **`R9-330` (código):** una edición pedida sin cuenta detrás de `adoptNoAccountPrep` escribe en la
  «sin cuenta» ya vaciada: P queda partida entre las dos Mesas (`editaTrasAdoptar`, A2; cae hoy).
- **`R9-331` (código):** un segundo `setPrepAccount` mientras el primero espera la migración o la
  devolución suelta las claves en el acto (`markKnown`), antes de que termine: una lectura pedida
  antes del primer estado no ve lo devuelto (`segundoEstado`, A2; cae hoy). La hipótesis
  `marcaTrasPrimero` arregla el caso `null`.

## 5. `R9-323` (A6)

- **Reproducido** (`editaTrasFalla`: hoy, P con las dos secciones; con `devueltaAunqueFalle` o
  `devueltaAlAnotar`, `{application: "despues"}`).
- **La clase es más ancha que las dos piezas:** `devueltaTrasAnotar`, `devueltaAlEmpezar`,
  `devueltaEnCatch` y `devueltaEnFinally` también pasan las 1004. Las que marcan antes del turno de
  la devolución pierden datos SIN ninguna falla: basta una escritura en cola delante de la
  devolución cuyo turno llegue después de la marca. `devueltaEnFinish` no hace daño (por lectura:
  al arrancar nadie escribe con la clave de una cuenta borrada).
- **La prueba de la hipótesis** está en `_scratch/S94-sondas-agente-6/S94-a6-prueba-r323.test.ts.txt`
  (pieza `pruebaR323`), con dos casos: A (la devolución falla, se edita, el arranque devuelve las
  dos secciones) y B (una escritura de `@prep_series` retiene el turno; la edición de P espera
  detrás; la devolución anota y pide el suyo). Re-medida aquí:

  | corrida (`prep -t S94-a6`)                                        | A       | B                                        |
  | ----------------------------------------------------------------- | ------- | ---------------------------------------- |
  | `nada`                                                            | pasa    | pasa                                     |
  | `devueltaAunqueFalle`, `devueltaEnCatch`, `…EnFinally`            | **cae** | pasa                                     |
  | `devueltaAlAnotar`, `devueltaTrasAnotar`, `…AlEmpezar`            | **cae** | **cae**                                  |
  | `devueltaEnFinish`                                                | pasa    | pasa                                     |
  | `notaLenta50`, `turnoLento50` (cambios buenos)                    | pasa    | pasa                                     |
  | `turnoLento1005` (más allá de su espera de 1000)                  | pasa    | cae solo en `devolucion: 0` (el control) |
  | `devueltaAlAnotar+notaLenta50`, `devueltaTrasAnotar+turnoLento50` | **cae** | **cae**                                  |

  En cada rojo de una regresión, lo que cambia es el daño (`donde: "@prep_notes"`, P sin
  `observation`), con los controles en su valor. Para adoptarla: B llama a
  `__prepTurnWaitingForTests(undefined)` por `require` (cuenta los pedidos sin clave; antes de abrir,
  el único es el de `giveBack`). Es un contador compartido (regla de la 88): conviene un gancho con
  nombre.

## 6. Las lecciones de la 93 (A8)

- **La primera** («una lectura que pasa todas no es inocua»): medida en los tres lugares (detalle,
  §5, memoria). Las dos piezas dan 1004/1004 y la pérdida es de una sección.
- **La segunda:** `respaldoDesviado` tumba dos, medido. «Sacar la frase del paréntesis la vuelve
  falsa para lo pedido antes del primer estado» estaba «por lectura» en el detalle y sin marca en
  §5 y en la memoria: ahora tiene número (`pedidaSinEstado`, la frase vieja en `prepWrite`, tumba
  `R9-310`; en `prepKey`, también `R9-314`). Y «listá los llamadores y medí la frase en cada uno»
  la 93 no lo hizo para su propia frase: midió la del store solo con notas (`R9-325`).

## 7. La regla de la 92, rehecha (A9)

`grep` en todo `src/` y `__tests__/` de lo que afirma cada frase nueva (nombres e ideas, en inglés y
en español). Choca solo la frase vieja de la cabecera y los stores (`R9-324`); `BackupService.ts:1399`
(«restored into the Mesa of the account signed in»), leída «al escribir», tumba dos pruebas
(`respaldoCuentaAlEscribir`): sin hallazgo. Contra el agente 2 de la 93: él listó tres frases más
(`restoreSignal.ts:70-75`, `BackupService.ts:1632-1637` y un título de prueba), que no cambian nada;
juzgó la cabecera y los stores «coinciden» sin pieza.

## 8. Lo que la 93 dejó por lectura (A10)

| afirmación (detalle de la 93)                          | pieza que la niega     | `prep`       | `suite`   | daño                    |
| ------------------------------------------------------ | ---------------------- | ------------ | --------- | ----------------------- |
| §1: lo de antes del primer estado, clave de ese estado | `escrituraAlPedir`     | cae `R9-310` | —         | —                       |
| §6: el respaldo resuelve antes de SQLite               | `claveTrasSqlite`      | caen 2       | —         | —                       |
| §6: `gone` dentro del turno                            | `goneAlPedirA10`       | pasa         | 1004/1004 | `goneEnCola` (`R9-298`) |
| «noted first»: que haya nota                           | `respaldoSinNota`      | cae `muere`  | —         | —                       |
| «noted first»: el orden                                | `notaTrasEscribir`     | pasa         | 1004/1004 | `R9-328`                |
| §6: la unión falla y la nota queda                     | `respaldoFallaSinNota` | pasa         | 1004/1004 | `R9-328`                |
| §6: `noteRelease` se traga el error                    | `notaLanza`            | pasa         | 1004/1004 | `R9-329`                |
| §6: en `noEnCola`, `prepKey` da `@prep_notes:ana`      | `claveConDesvio`       | pasa         | 1004/1004 | ver abajo               |

- **`claveConDesvio`** (las lecturas con el desvío, que parecería el arreglo del pendiente de
  `detail/S92` §3) no sirve: con él, el respaldo resuelve `@prep_notes`, reemplaza la «sin cuenta»
  y se pierde P (`respaldoTrasDevolucion`), lo que `R9-275` descartó. Contexto para ese pendiente,
  sin número.

## 9. Las lecciones

- **Un «por lectura» del detalle es un riesgo sin sonda, y se mide primero.** De las afirmaciones
  que la 93 dejó por lectura en §5 y §6, cuatro tenían una negación que pasa las 1004 y pierde
  datos (`R9-298`, `R9-328`, `R9-329`, y la frase de los stores de `R9-324`), y dos citas de prueba
  no fijaban lo que decían (`:97`, `muere`). Es la regla de la 88 para las afirmaciones, no solo
  para los riesgos. Medido (A10, A8, A9).
- **Una regla que la sesión escribe se mide primero contra lo que esa sesión escribió.** La 93
  escribió «listá los llamadores y medí la frase en cada uno», y su frase «a store's write» se midió
  solo con notas: hecha pieza en cada store, tres de cuatro pasan las 1004 (`R9-325`). Medido (A4).
- **Un «benigno» se re-mide con un caso hecho para la pieza.** La 73 juzgó «benigna» la devolución
  del respaldo en otro turno porque daba un falso rojo en una sonda hecha para otra cosa
  (`devuelta`); con un store en la cola entre la escritura y la devolución, pierde la sección
  restaurada (`R9-327`). Medido (A5).

## 10. El checkpoint

`npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con
`NODE_ENV=development` (`_scratch/S94-validate.out.txt`): exit 0. Typecheck limpio, lint con 0
errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites, 4632/4632 pruebas.
Se corrió sin worktrees de agentes (`tsc` no excluye `.claude/`). El mensaje de la 95 está en
`_scratch/S95-PROMPT.md`.
