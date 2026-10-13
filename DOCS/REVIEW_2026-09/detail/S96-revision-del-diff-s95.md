# Sesión 96 — revisión del diff de la 95 (2026-10-13)

En un chat nuevo, en la terminal, con 3 agentes en worktree que solo midieron (Victor los pidió),
con el mensaje de `_scratch/S96-PROMPT.md`. Revisa `cdb1d94..f02c798`: las pruebas que faltaban
(`3084a4c`), los comentarios (`3b47ff8`), `R9-331` (`77418b4`) y lo que vieron sus agentes
(`f02c798`). Solo docs.

- **Estado al empezar:** `main` = `origin/main` = `589c3bc` (la 95, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38447264334`, 3 jobs, Node v24.21.0, 374/4644; ramas
  borradas tras `git cherry`). Comprobado con `git fetch` y `git log -1 origin/main`. Como `main`
  no era más nuevo, no hizo falta mirar el CI. Los docs decían «sin mergear» para la 95 en cuatro
  lugares (`CONTINUAR.md` arriba y §2, `INDEX.md`, `BUGS.md`): corregido aquí. El detalle de la 95
  queda como registro de su momento.
- **Rama:** `docs/review-s96-diff-s95` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 95 se sostiene como código. Hay 7 nuevos P3 (`R9-334`..`R9-340`), seis
  de ellos abiertos por la 95: dos verdes falsos en sus pruebas, una garantía nueva sin prueba,
  una frase ambigua y dos comentarios de prueba falsos. El séptimo es un riesgo de las pruebas,
  latente desde antes. Quedan 340 hallazgos, ningún P0.
- **`R9-330`:** queda pendiente con el OK de Victor («sigamos tu recomendación», 2026-10-13). Está
  escrito en su entrada y en §7 de `CONTINUAR.md`.

## 0. Cómo se trabajó

- **Tres forks con `isolation: "worktree"`**, nacidos en `589c3bc`.
  - Las herramientas se las dio `_scratch/S96-copiar.cjs.txt <raíz> <N>`: la `S95-sonda` con ROOT
    en el worktree, y la salida con el prefijo `S96-aN-`.
  - Los tres completaron sin cortes:

    | agente | tokens | llamadas | duración |
    | ------ | ------ | -------- | -------- |
    | 1      | 225k   | 31       | 12 min   |
    | 2      | 209k   | 23       | 9 min    |
    | 3      | 260k   | 33       | 34 min   |

  - El 1 y el 3 pasaron el tope de unas 25 llamadas. El 3 dice que se le fueron en 11 corridas con
    ENOENT, que leían archivos del `_scratch` principal.
  - Cada uno copió su `_scratch` a `_scratch/S96-sondas-agente-N/` (35, 16 y 214 archivos, como
    dijo cada uno), con su informe (`S96-aN-informe.md.txt`).
- **Los worktrees se borraron solos** (ninguno tenía cambios en git), así que no hubo contra qué
  hacer `diff -rq`. Se verificó el número de archivos de cada copia. No quedan worktrees ni ramas
  de agentes.
- **Re-medido en el árbol principal** todo lo que se cita aquí, con `_scratch/S96-sonda.cjs.txt`.
  - La genera `S96-gen.cjs.txt`: la `S95-sonda` más los bloques `// S96-aN` de las copias. Un
    nombre repetido pasa a `<nombre>A<n>`; esta vez no hubo ninguno.
  - Salidas: `S96-sonda-<corrida>-<modo>.out.txt`. La matriz, con `S96-matriz.cjs.txt
correr|comparar` (`S96-matriz-correr.out.txt`, `S96-matriz-comparar.out.txt`).
  - `git status` quedó limpio tras cada corrida. Control `nada`: 35/35 en `prep`; el suite
    relacionado, 125 suites y 1016 pruebas.
- **Sin deslices con la línea de comandos** del orquestador: todos los scripts se escribieron con
  Write, sin heredoc, sin `node -e` y sin `|` en `-t`. El agente 2 dice lo mismo de los suyos; el 1
  y el 3 no lo mencionan.

## 1. Las 12 pruebas nuevas (agente 1)

**Controles.** Leen contenido los de la A de `R9-323`, `R9-324`..`R9-326`, `R9-328`, `R9-329` y
las dos de `R9-331`. Cuentan cuatro: `devolucion` y `enCola` en la B de `R9-323`, `enCola` en la de
`R9-298`, y `enEspera` y `sqlite` en la de `R9-327`. Solo esas tres pruebas usan un gancho.

**`R9-334`: la de `R9-298` abre la puerta en la misma vuelta en que llama al respaldo.**

- `goneAlPedirTarde1` (la regresión con el pedido una vuelta más tarde): 35/35 y 1016/1016.
- El daño se ve con la puerta más tarde: `goneAlPedirTarde1+abrirTarde298_50` cae con R bajo
  `@prep_notes:ana`, y `abrirTarde298_50` sola pasa.
- `enCola` dice que la devolución esperaba, y nada dice que el respaldo ya había pedido el suyo.
- El residuo con una devolución ajena (`ajenoDev298`) es menor y no tiene número.

**`R9-335`: las de `R9-331` esperan 1000 vueltas sin reloj falso.**

- `segundoTope250` (el segundo estado espera el trabajo 250 ms como mucho): 35/35 y 1016/1016.
- El daño, con `esperaReal331_400`, es el mismo rojo que el de `sinR331+esperaReal331_400`.
- En vueltas, con 995 caen las dos y con 1005 pasan.

**Lo demás, sin hallazgo:**

- **La B de `R9-323`, y `enEspera` y `sqlite` de `R9-327`, con la demora después del paso:** por
  lectura, firmes. La B se marca antes de que la devolución pida. La edición pide con el turno del
  respaldo retenido. Con la sesión de Ana, la clave es la misma se resuelva antes o después.
- **La rehecha de `R9-327`:**
  - `r327viaStore` (la edición por el store, con la puerta nueva) pasa.
  - Las regresiones del store que veía la de `3084a4c` las ven otras pruebas: `notasSinTurno` tumba
    6 de 35 y `notasLeeAlPedir`, 3.
  - Por lectura, lo único que la vía directa se salta es el `writeQueue` del store y el momento en
    que se llama a `prepKey`.

## 2. El gancho con nombre y los comentarios (agente 2)

**Solo comentarios** (la regla de la 65, `S96-a2-solocom.cjs.txt`; se lee la última línea; sin
`^`):

| medido                   | base        | última línea    | tocadas / no comentario |
| ------------------------ | ----------- | --------------- | ----------------------- |
| `3b47ff8` (cinco)        | `3b47ff8~1` | TODOS IGUALES   | 28 / 0                  |
| `f02c798` `src/`         | `f02c798~1` | TODOS IGUALES   | 4 / 0                   |
| `77418b4` (control)      | `77418b4~1` | HAY DIFERENCIAS | 13 / 9                  |
| `3084a4c` (control)      | `3084a4c~1` | HAY DIFERENCIAS | 23 / 6                  |
| `f02c798` (todo el diff) | `cdb1d94`   | HAY DIFERENCIAS | 68 / 15                 |

**La regla de la 92 sobre las frases nuevas** de los cuatro commits, con la lectura al pie de la
letra hecha pieza:

- **`R9-337`: la frase de `prepKey` de `f02c798`.**
  - Dice «a state that came meanwhile counts»; el código toma el último estado.
  - `claveDelSegundoEstado` (cuenta el primero que llegó durante el trabajo) pasa 35/35 y
    1016/1016.
  - Con `S96a2-tres` (nulo, `ana` y nulo durante el trabajo), P va a la Mesa de Ana, que ya salió.
- **`R9-338`: el comentario y el título de la prueba de `R9-324`.** Dicen «la de la cuenta de ese
  estado … así lo dice `prepKey`». Al pie de la letra son `claveDelPrimerEstado`, que tumba la de
  `R9-331` de `f02c798`.
- **`R9-339`: «Lo restaurado no queda bajo el uid borrado en ningún punto»**, en las de `R9-328`.
  Al pie de la letra es `respaldoDesviado`, que tumba 6 con el código bueno.
- **Sin daño posible o ciertas:**
  - la del `waiting` (`etiquetaCuenta`, ya medida en la 95);
  - la de `__prepGiveBackWaitingForTests`, que cuenta 2 con dos devoluciones;
  - la de `firstWork`, cierta con `managePrepAccount` (sin él, no espera nada desde antes de la
    95);
  - la de `setPrepAccount` (`esperaSoloDurante`, de la 95);
  - las de `prepWrite`, la cabecera y los stores, que solo remiten a `prepKey`.

**`giveBackAsk`, sin hallazgo:**

- **Quiénes piden sin nada dicho** (por lectura): las uniones de `migrateLegacyPrep` y
  `adoptNoAccountPrep`, y `prepMultiSet`. La devolución del respaldo corre dentro del turno de
  `prepMultiSet`, y ninguna prueba la lee por el gancho.
- **Dos devoluciones de la misma cuenta a la vez**, en dos casos (`S96a2-dos`, dos
  `releasePrepAccount('ana')` con una edición entre ellas; `S96a2-dosArranque`, la de
  `finishRelease` más una de `releasePrepAccount`):
  - El gancho da 2, y después la nota queda en `null`. Nada se pierde ni se duplica, y P conserva
    sus dos secciones.
  - Las pruebas de `:868` y `:1160` fijan `1`: una segunda devolución legítima en su ventana las
    tumbaría con el código bueno.
  - La app no la produce (por lectura): `releasePrepAccount` solo la llama `deleteAccount`, tras
    `deleteUser`.
- **Por lectura, de antes de la 95:** sin dueño anotado, `migrateLegacyPrep` toma como dueño la
  cuenta del primer estado, y las claves toman la del último. Con un primer estado nulo y un
  segundo `ana`, la Mesa de antes se queda en la «sin cuenta» y lo pedido va a `ana`. Antes de
  `R9-331` pasaba lo mismo, porque el segundo estado soltaba las claves con `ana`.

## 3. `R9-331` y la matriz (agente 3)

**Sobre `firstWork`:**

- **`R9-336`: un `firstWork` que rechaza.**
  - `lecturaNotaSinTry` pasa 35/35 y 1016/1016.
  - Con `notaFallaA3`, los tres estados lanzan, la lectura no vuelve y la escritura no se escribe.
    Con `sinR331`, el segundo estado soltaba las claves.
- **Colgado:** es el cuelgue de antes, sin el rescate del segundo estado. Lo fija la segunda de
  `R9-331`: `escritaAntesDeAbrir: false`, y `true` con `sinR331`. Sin hallazgo: para colgarse hace
  falta un disco que no vuelve, y con eso toda la Mesa está colgada.
- **`R9-340`: el reinicio con un trabajo viejo colgado.**
  - `viejoReanudaA3` tumba la siguiente, igual con `sinR331`.
  - `muestraViejo` no imprime ninguna línea ni en `prep` ni en el suite: hoy nadie lo arma.
- **El restaurar con un segundo estado** (`restaurarA3`, `importBackup` real): sin daño.
  - En el caso `devolucion`, el resultado es el mismo hoy y con `sinR331`: el turno de la unión lo
    cubre.
  - En el caso `migracion`, hoy es igual al de un solo estado. Con `sinR331`, el respaldo caía
    antes de la migración: `antesDeAbrir: true`, `ana: ["Ps/119/105", "Ps/23/1-6"]`.

**La matriz entera** (191 corridas en `prep`: todas las que corrió la 95, comparadas con su base):

- **No aplican 4:** `ajenoR327` y `ajenoR327+devuelveFueraDelTurno`, re-ancladas como
  `ajenoR327b`, y dos nombres del worktree de la 95 (`porEntradaAuto+editaTrasAdoptar`,
  `porEntradaSolo`).
- **Ninguna regresión que caía deja de caer.**
  - Las 6 corridas con alguna prueba que deja de caer se explican:
    - `a2Export+sinR331`: la base era de otro modo. Re-medido con `backupServiceExport.test.ts -t
S95-a2`, `exportSegundo` sigue cayendo.
    - `sinDesvioNotas` y `leeCuentaNotas`: la rehecha de `R9-327` ya no las ve, y siguen tumbando
      otras 3.
    - `multiSetTarde1005` y `antesSqlite1005`: cambios buenos más allá del corte, con la regresión
      todavía cayendo (`multiSetTarde1005+devuelveFueraDelTurno`, re-medido).
    - `notaLenta50`: no se sostiene (abajo).
  - `lecturaLenta1010+sinR331` pasaba en `77418b4` y ahora cae, en la segunda de `R9-331`: el corte
    mejoró.
- **Re-medida en el principal:** 184 de 191 son iguales a las del agente, en el resumen y en lo que
  cae. De las 7 restantes, 4 son las que no aplican y 3 son corridas cuya salida el agente pisó
  con un `-t` (`a2Export`, `a2Export+sinR331`, `notaLenta50`).
- **Una afirmación del agente 3 no se sostiene:** «`notaLenta50` ya no tumba la de `R9-274` en el
  `prep` entero». En el principal la tumba 3 de 3 veces, con el rojo de `R9-333`. Su salida de esa
  corrida es la del `-t R9-327`, con 34 omitidas. Queda anotado en `R9-333`.
- **La rehecha de `R9-327` con `notaLenta50`** cae en el `prep` entero por contaminación, en su
  control (`enEspera: 1 → 0`), y aislada pasa. Va como nota en `R9-327`, sin número: es la clase
  de `R9-333`, pero con el control en el rojo.

## 4. Las lecciones

- **Al escribir una prueba, las reglas de controles y esperas de §5 se pasan como lista, no solo la
  del hallazgo.** La 95 tenía la de la 72 y la de la 86 (un control lee lo último antes de lo que
  afirma), y la de la 84 y la de la 85 (una espera se mide con reloj y vueltas). Aun así escribió
  `enCola` en `R9-298`, donde un caso de orden entre dos pedidos solo controla uno
  (`goneAlPedirTarde1`, `R9-334`). Y escribió las dos de `R9-331` con 1000 vueltas sin reloj
  (`segundoTope250`, `R9-335`). Las dos regresiones pasan las 1016. Medido (agente 1; re-medido).
- **Una promesa que esperan todos hace de una garantía local una de todos.** Con `await firstWork`
  en todo estado, «el primer trabajo no rechaza» pasó de afectar al primer estado a afectar a
  todos. Ningún comentario lo dice, y una guarda quitada pasa las 1016 (`lecturaNotaSinTry`,
  `R9-336`). Cuando un arreglo hace que varios esperen lo mismo, preguntá qué pasa si eso rechaza o
  se cuelga. Medido (agente 3; re-medido).
- **Una frase en singular sobre algo que puede pasar varias veces se mide con varias.** «A state
  that came meanwhile counts» es cierta con un estado y ambigua con dos. Su lectura
  (`claveDelSegundoEstado`) pasa las 1016 y mezcla cuentas, porque las pruebas tienen un solo
  estado durante el trabajo (`R9-337`). Es la regla de la 66 aplicada a la cantidad. Medido
  (agente 2; re-medido).
- **El `grep` de la regla de la 92 entra también en `__tests__/`.** Un comentario de prueba que
  cita al código («así lo dice `prepKey`») se vuelve falso cuando el código cambia. La 95 corrigió
  `prepKey` en `f02c798` y dejó el de `3b47ff8` (`R9-338`). Un comentario de prueba también es una
  definición: «en ningún punto», al pie de la letra, tumba 6 (`R9-339`). Medido (agente 2;
  re-medido).
- **La salida de la sonda se nombra por corrida y modo, no por los argumentos de jest.** Un `-t`
  pisa la del `prep` entero de la misma corrida. En la matriz del agente 3, tres comparaciones
  leyeron una salida aislada, y una afirmación no se sostiene en el principal (`notaLenta50` y
  `R9-274`). Una matriz que compara salidas guardadas comprueba de qué corrida es cada una. Medido
  (re-medido en el principal: 3 de 3).

## 5. El checkpoint

`npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con
`NODE_ENV=development` (`_scratch/S96-validate.out.txt`), corrido sin worktrees de agentes: exit 0.
Typecheck limpio, lint con 0 errores (los 70 avisos de siempre), `format:check` limpio, y jest
374/374 suites, 4644/4644 pruebas (las mismas que la 95: la 96 no toca código). El aviso de jest «A
worker process has failed to exit gracefully» ya salía en las validaciones de la 90 a la 95. El
mensaje de la 97 está en `_scratch/S97-PROMPT.md`.
