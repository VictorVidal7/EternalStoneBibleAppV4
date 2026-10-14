# Sesión 97 — arreglo de lo de la 96 (2026-10-13)

En el mismo chat que la 96 («Continuemos por favor estimado, manda 3 agentes»), en la terminal, con
3 agentes en worktree que solo midieron, con el plan de `_scratch/S97-PROMPT.md` (que pedía un chat
nuevo). Arregla `R9-334`..`R9-339`, de la 96.

- **Estado al empezar:** `main` = `origin/main` = `67e8141` (la 96, mergeada y pusheada con el OK
  de Victor en este mismo chat; CI verde en el log, run `38492329797`, 3 jobs, Node v24.21.0,
  374/4644; rama borrada tras `git cherry`). Los docs decían «sin mergear» para la 96 en cuatro
  lugares (`CONTINUAR.md` arriba y §2, `INDEX.md`, `BUGS.md`): corregido aquí.
- **Ramas:** `fix/s97-arreglos-s96` (cuatro commits) y `docs/review-s97-fix` encima, sin mergear
  hasta el OK de Victor.
- **Resultado:** cerrados 7 (`R9-334`..`R9-339`, y `R9-341`, nuevo, que no abrió la 97). `R9-340`
  queda sin arreglar: el diseño medible corta solo una parte, y se le dice a Victor. Quedan 341
  hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Los arreglos, escritos y commiteados primero** por el orquestador, cada prueba vista caer con
  su pieza antes de commitear; y los agentes buscaron romperlos:
  - `dd1a7b6`: el código y las pruebas. La etiqueta del respaldo y su gancho (`R9-334`), el reloj
    falso en las de `R9-331` (`R9-335`), y las pruebas nuevas de `R9-336` y `R9-337`.
  - `307b654`: solo comentarios. Los de `firstWork` y `prepKey`, y en las pruebas los de `R9-338`
    y `R9-339`, más el título de la de `R9-324`.
  - `12cc4b4`: lo que vieron los agentes 1 y 2 (§2).
  - `5ee4460`: lo que vio el agente 3 (§2).
- **Tres forks con `isolation: "worktree"`**, nacidos en `67e8141` y movidos a `307b654` con
  `git reset --hard`.
  - Las herramientas se las dio `_scratch/S97-copiar.cjs.txt <raíz> <N>`, con fuente
    `S97-sonda.cjs.txt` y no `S96-sonda.cjs.txt` como decía el plan.
  - `S97-sonda` es la `S96-sonda` con el cierre de `prepMultiSet` re-anclado a la etiqueta nueva
    (3 piezas), más `sinEtiquetaRespaldo`, `sinR336` y, después, `etiquetaSinClaves`. La genera
    `S97-gen.cjs.txt`, que suma también los bloques `// S97-aN` de las copias.
  - Los tres completaron, sin cortes y dentro del tope de unas 25 llamadas:

    | agente | tokens | llamadas | duración |
    | ------ | ------ | -------- | -------- |
    | 1      | 421k   | 18       | 6 min    |
    | 2      | 428k   | 18       | 7 min    |
    | 3      | 424k   | 20       | 20 min   |

  - El 3 dejó su matriz en segundo plano y avisó dos veces.
  - Cada uno copió su `_scratch` a `_scratch/S97-sondas-agente-N/` (26, 26 y 215 archivos), con su
    informe (`S97-aN-informe.md.txt`).
- **Los worktrees no se borraron solos:** el `reset` movió sus ramas, y el del agente 3 quedó
  bloqueado. `diff -rq` de cada `_scratch` contra su copia dio igual en los tres, sin junction de
  `node_modules` en ninguno. Después, `git worktree remove --force --force` y `git branch -D`.
- **Re-medido en el árbol principal** todo lo que se cita aquí, con `_scratch/S97-sonda.cjs.txt`.
  La matriz, con `S97-matriz.cjs.txt correr|comparar` (`S97-matriz-correr.out.txt`,
  `S97-matriz-comparar.out.txt`). `git status` quedó limpio tras cada corrida.
- **Deslices:**
  - Un `sed` del orquestador para armar `S97-copiar` llevaba barras invertidas y acentos graves en
    la línea de comandos, que el mensaje prohíbe. El resultado se verificó con `diff` contra
    `S96-copiar`: solo cambiaron los nombres.
  - Dos corridas se colgaron: `segundoTope1800000` y `segundoTope3600001`, porque un `setTimeout`
    real en las pruebas sin reloj falso no deja terminar a jest. Se mató solo el proceso de jest y
    la sonda restauró; las salidas ya estaban escritas.
  - Los agentes dicen no haber tenido ninguno.

## 1. Los arreglos y sus pruebas

`prep` = las tres suites. Control `nada`: 37/37 en `307b654` y 39/39 en `5ee4460`.

| hallazgo | qué                                                                                      | cae con                                                                                   |
| -------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `R9-334` | la de `R9-298` espera a ver ESTE respaldo en la cola (`pidio`) con la devolución delante | `goneAlPedirTarde1`, `…Tarde20`, y `+ajenoRespaldo298`; en control, `sinEtiquetaRespaldo` |
| `R9-335` | las dos de `R9-331` con una hora de reloj falso y mil vueltas                            | `segundoTope250`, `segundoTope1800000`, `segundoTopeV995`                                 |
| `R9-336` | un caso por paso: la migración, la nota, la devolución pendiente                         | `migraLanza`, `sinR336`, `arranqueLanzaSiQueda`, una cada una                             |
| `R9-337` | nulo, `ana` y nulo durante el trabajo: lo pedido va a la cuenta del último               | `claveDelSegundoEstado`; en control, la clase de `R9-331`                                 |

- **Pasan con los cambios buenos:** `respaldoPideTarde1` y `5`, `segundoTopeV1005`, el tope de más
  de una hora (el corte de `R9-317`), y `lecturaLenta1010` y `3000`.
- **Los comentarios** (`R9-336`..`R9-339`, `R9-341`): solo comentarios (agente 2, con
  `S97-a2-solocom.cjs.txt`). `307b654` contra `307b654~1` da TODOS IGUALES en `src/` (11 líneas
  tocadas, 0 que no sean comentario; en `__tests__/`, solo las 2 del título de `R9-324`). Contra
  `dd1a7b6~1` da HAY DIFERENCIAS, y las 6 líneas de código de `dd1a7b6` son la etiqueta y el
  gancho. `12cc4b4` sí cambia código: la etiqueta pasa a llevar las claves.
- **`R9-340`, sin arreglar.** La generación en el reinicio es medible (`viejoReanudaA3` tiene que
  dejar de tumbar la siguiente), pero corta solo el `markKnown` viejo. El trabajo viejo seguiría
  escribiendo en el almacén de la prueba nueva, y nadie lo arma hoy (`muestraViejo`: 0 líneas). Se
  le dice a Victor.

## 2. Lo que vieron los agentes en los arreglos, corregido antes del OK

- **El gancho del respaldo contaba cualquier respaldo** (agente 1, `ajenoRespaldo298`). Con otro
  respaldo pedido justo antes de la devolución, la espera de la prueba de `R9-298` salía con el
  ajeno, la puerta se abría antes del pedido del caso, y `goneAlPedirTarde1` pasaba 37/37. En
  `12cc4b4`, la etiqueta lleva las claves (`restoreAsk(pairs)`) y el gancho cuenta por clave. Ahora
  cae, el ajeno solo pasa, y `etiquetaSinClaves` (el gancho de `dd1a7b6`) devuelve el verde falso.
- **La prueba de `R9-336` fijaba un paso de tres** (agentes 1 y 2). `migraLanza` (el `catch` de la
  migración vuelve a lanzar) y `arranqueLanzaSiQueda` (`finishRelease` rechaza si queda una
  devolución) pasaban `prep` (re-medido) y el suite (agentes). En `12cc4b4`, un caso por paso.
- **Y daba el rojo del daño con una lectura más lenta** (agente 3). Con `lecturaLenta1010`, los
  casos caían en `leido: null` con `lanzo: []`: la clase de `R9-289`/`R9-333`, la regla de la 79.
  En `5ee4460`, la lectura se espera hasta 100 000 vueltas, que solo se gastan si no vuelve.
  Re-medido: en `12cc4b4` caían los tres, y en `5ee4460` pasan; las regresiones siguen cayendo en
  `lanzo`.
- **La frase nueva de `R9-339`** callaba la excepción de `R9-329` (agente 2, `S97a2-notaYUnion`).
  Con la nota y la unión fallando, R se queda bajo el uid borrado. `12cc4b4` la dice.
- **`R9-341`, nuevo** (agente 2, `ganchoSinNada`): la frase de `__prepGiveBackWaitingForTests`,
  al pie de la letra, tumba 2 pruebas. Es de la 95; `12cc4b4` la pone en pasado.

## 3. La matriz

- **El agente 3, sobre `307b654`:** 210 corridas contra las bases de la 96 del principal. Ninguna
  regresión que caía deja de caer (el único caso es `a2Export+sinR331`, cuya base era de otro
  modo). Las cuatro que pasaban en la 96 ahora caen con su daño: `goneAlPedirTarde1`,
  `segundoTope250`, `claveDelSegundoEstado` y `lecturaNotaSinTry`.
  - La de `R9-298` cae en su control (`pidio: 0`) con las `drena*` (envuelven `oneAtATime`, y el
    respaldo no entra en `waiting`) y con las re-ancladas del cierre (su reemplazo no lleva la
    etiqueta): artefactos, sin daño.
  - `respaldoDetrasDeDevolucion`, de la 94, cae en su propio control: contaba los pedidos sin
    etiqueta como el respaldo.
- **El principal, sobre `5ee4460`:** 226 corridas (las 191 de la 96 y las piezas de la 96 y la
  97), comparadas con las del agente 3.
  - 205 dan las mismas pruebas que caen.
  - De las 21 restantes: 4 son las que no aplican desde antes; 1 deja de aplicar
    (`ajenoTrasRespaldo298`, por `12cc4b4`); 3 son el arreglo de `5ee4460` (`lecturaLenta1010`,
    `…3000` y `lecturaLenta1010+sinR331` ya no tumban `R9-336`); y 13 son piezas que el agente no
    corrió, re-medidas aquí una por una. Ninguna regresión que caía deja de caer.

## 4. Las lecciones

- **Un gancho con nombre dice la CLASE del pedido; si la prueba espera uno en concreto, el nombre
  dice cuál.** `'restore'` decía «un respaldo». Con otro respaldo en la ventana, la espera salía
  con el ajeno y la regresión pasaba (`ajenoRespaldo298`). Con las claves en la etiqueta, cae. Son
  las reglas de la 88 y la 89, en un gancho escrito por la sesión que ya las tenía. Medido (agente
  1; re-medido, con su control `etiquetaSinClaves`).
- **La 97 repitió en sus pruebas nuevas tres reglas de §5 que tenía.**
  - La de la 95 («cada parte del trabajo»): la prueba de `R9-336` fijaba uno de los tres pasos.
  - La de la 79 («llega tarde» no es «no llega»): esperaba 1000 vueltas algo que tiene que
    llegar.
  - La de la 88 y la 89: el ajeno del gancho.
  - La 96 había escrito «pasá §5 como lista»; las tres las vieron los agentes, no quien las
    escribió. Medido (agentes 1, 2 y 3; re-medido).
- **Una pieza con un plazo real más largo que la corrida cuelga jest.** `segundoTope1800000` y
  `segundoTope3600001` crean un `setTimeout` real en las pruebas sin reloj falso, y jest no termina
  hasta que vence. Para medir un tope largo, el reloj falso; si se cuelga, se mata solo el proceso
  de jest, y la sonda restaura. Medido (dos corridas colgadas, con sus salidas escritas).

## 5. El checkpoint

`npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con
`NODE_ENV=development` (`_scratch/S97-validate.out.txt`), corrido sin worktrees de agentes: exit 0.
Typecheck limpio, lint con 0 errores (los 70 avisos de siempre), `format:check` limpio, y jest
374/374 suites, 4648/4648 pruebas (4 más que las 4644 de la 96: las de `R9-337` y los tres casos de
`R9-336`). El aviso de jest «A worker process has failed to exit gracefully» ya salía en las
validaciones de la 90 a la 96. El mensaje de la 98 está en `_scratch/S98-PROMPT.md`.
