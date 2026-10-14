# Sesión 98 — revisión del diff de la 97 (2026-10-13)

En un chat nuevo, en la terminal, con 3 agentes en worktree que solo midieron, con el mensaje de
`_scratch/S98-PROMPT.md`. Revisa `67e8141..5ee4460`: la etiqueta del respaldo con sus claves y su
gancho (`R9-334`), el reloj falso en las de `R9-331` (`R9-335`), las pruebas de `R9-336` (un caso
por paso) y de `R9-337`, y los comentarios de `firstWork`, `prepKey`, `R9-338`, `R9-339` y
`R9-341`.

- **Estado al empezar:** `main` = `origin/main` = `c166fff` (la 97, mergeada y pusheada con el OK
  de Victor; CI verde en el log, run `38512623060`, 3 jobs, Node v24.21.0, 374/4648; ramas borradas
  tras `git cherry`). Comprobado con `git fetch` y `git log -1 origin/main`. Los docs decían «sin
  mergear» para la 97 en cuatro lugares (`CONTINUAR.md` arriba y §2, `INDEX.md`, `BUGS.md`):
  corregido aquí.
- **Rama:** `docs/review-s98-diff-s97` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 97 se sostiene como código. Cuatro nuevos P3 (`R9-342`..`R9-345`): dos
  verdes falsos que abrió la 97 en sus pruebas, y dos huecos de la 95 que la 97 tocó sin cerrar.
  `R9-340`, medido y sin arreglar. Quedan 345 hallazgos, ningún P0.
- **Mirada:** chat nuevo, pero el mismo modelo que escribió los arreglos. Se buscó romperlos con
  piezas, no con las sondas que ya pasaban (la regla de la 60).

## 0. Cómo se trabajó

- **Tres forks con `isolation: "worktree"`**, nacidos en `c166fff` (verificado; sin `reset`). Las
  herramientas se las dio `_scratch/S98-copiar.cjs.txt <raíz> <N>` (la `S97-copiar` con prefijo
  `S98-aN-`, fuente `S97-sonda.cjs.txt`).
  - El reparto: A1, las pruebas de la 97; A2, el código y los comentarios; A3, la matriz entera, las
    piezas re-ancladas y `R9-340`.
  - Los tres completaron, sin cortes:

    | agente | tokens | llamadas | duración |
    | ------ | ------ | -------- | -------- |
    | 1      | 220k   | 20       | 12 min   |
    | 2      | 218k   | 38       | 10 min   |
    | 3      | 216k   | 36       | 28 min   |

  - El tope era de unas 25 llamadas: A2 y A3 lo pasaron (A2 dice que el aislamiento le rechazó
    varias órdenes de bash por su forma, y las volvió a escribir).
  - Los worktrees y sus ramas **se borraron solos** (sin `reset`, sin cambios trackeados). Las
    copias en `_scratch/S98-sondas-agente-N/` tienen 29, 23 y 251 archivos, lo que cada uno dijo
    haber copiado.
- **La memoria (lo vio Victor a mitad de la sesión).** Cada corrida de jest levanta 31 workers (uno
  por núcleo menos uno), también en `prep`, que son 3 archivos: 500-870 MB cada uno, unos 3,4 GB por
  corrida. Con la matriz del agente 3 y un suite mío a la vez quedaban 6,4 GB libres de 31,8. Desde
  ahí, `--maxWorkers=3` en `prep` y 4 en el suite (argumento extra de la sonda): el agente 3 desde la
  tanda 92 de su matriz, yo en todas las corridas siguientes. Con mi suite terminado, 21,2 GB libres.
  La bandera no cambia qué se corre; la matriz dio lo mismo con y sin ella.
- **Re-medido en el árbol principal** todo lo que se cita aquí, con `_scratch/S98-sonda.cjs.txt`
  (de `S98-gen.cjs.txt`, que suma los bloques `// S98-aN` de las copias):
  `S98-remide-a1.out.txt`, `S98-remide-a1-suite.out.txt`, `S98-remide-a2.out.txt`,
  `S98-remide-a2-suite.out.txt` y `S98-remide-a3.out.txt`. `git status` quedó limpio tras cada
  corrida. La matriz no se re-corrió en el principal: es el mismo código que la del principal de la
  97 (`5ee4460`). Se re-hizo la comparación desde la copia del agente 3 (`S98-matriz.cjs.txt` →
  `S98-matriz-comparar.out.txt`).
- **Deslices:**
  - Un comando mío escapó un `$` con barra invertida dentro de un `powershell -Command`, que el
    mensaje prohíbe (solo leía la memoria libre).
  - El agente 3 mató el proceso padre de su matriz para pasarle la bandera, y con él la sonda hija a
    mitad de la corrida 92, que dejó `__tests__/prepAccount.test.ts` sin restaurar en su worktree. Lo
    restauró con `git checkout --` y re-corrió la 92. Para cortar una matriz, se espera la línea
    «tanda N».

## 1. Lo que se sostiene

- **Solo comentarios** (agente 2, `S98-a2-entre.cjs.txt`: la regla de la 65 entre dos commits, sin
  tocar el árbol). `307b654~1..307b654`: el JS emitido de `src/` es igual, 0 de 11 líneas tocadas
  que no sean comentario; en `__tests__/`, solo las 2 del título de `R9-324`. `dd1a7b6` y `12cc4b4`
  dan «HAY DIFERENCIAS» en `src/` (el control), y lo que no es comentario es `restoreAsk`, su uso en
  el cierre de `prepMultiSet` y `__prepRestoreWaitingForTests`. `5ee4460` no toca `src/`.
- **La etiqueta en producción** (agente 2, re-medido): las claves de `pairs` son a lo sumo 11
  (constantes de `KEYS`, o `<base>:<uid>`), ninguna sale del archivo de respaldo, y nadie en la app
  lee la etiqueta. Con cien mil claves, se arma en 17-24 ms y el gancho la lee en 4-6 ms. Una clave
  con espacio partiría el conteo del gancho (0 para la clave entera, 1 por trozo), pero hoy ninguna
  puede tenerlo: solo engañaría a las pruebas.
- **La matriz** (agente 3; comparación re-hecha): 226 corridas en `prep` sobre `5ee4460`, contra las
  del principal en la 97. 221 dan lo mismo, todas del `prep` entero. Las 5 restantes no aplican
  (`ajenoR327`, `ajenoR327+devuelveFueraDelTurno`, `porEntradaSolo`,
  `porEntradaAuto+editaTrasAdoptar` y `ajenoTrasRespaldo298`), las mismas que en la 97. Ninguna
  regresión que caía deja de caer.
- **El tope de 100 000 vueltas de `R9-336`** (agente 1, re-medido): el corte está entre 99 000
  (`lecturaLenta99000` pasa) y 101 000 (cae). Si la lectura no vuelve por otra razón
  (`lecturaNoVuelve336`), los tres casos caen en `leido: null` con `lanzo: []`, distinto del daño
  (`lanzo: ["primero", "segundo"]`), en unos 0,2 s cada uno. Si un paso se cuelga en vez de rechazar
  (`migraCuelga336`), el primer caso cae a los 20 s (`jest.setTimeout(20000)`) sin diff: no es un
  verde falso, y colgarse sin plazo es la decisión de `R9-317`.

## 2. Los hallazgos

| hallazgo | qué                                                                | pieza                                        | ¿la 97? |
| -------- | ------------------------------------------------------------------ | -------------------------------------------- | ------- |
| `R9-342` | la de `R9-298` pasa con otro respaldo de la misma clave en la cola | `goneAlPedirTarde1+ajenoMismaClaveNeutro298` | sí      |
| `R9-343` | las de `R9-336` fijan una parte de la migración de cuatro          | `migraUnionSale`, `migraMarcaSale`           | sí      |
| `R9-344` | la de `R9-337` tiene estados solo durante la migración             | `claveTrasMigrar`                            | no      |
| `R9-345` | «once the auth state is known» admite «ya llegó un estado»         | `claveConocidaAlLlegar`                      | no      |

Cada pieza pasa `prep` 39/39 y el suite 1020/1020 (re-medido), y su prueba-sonda muestra el daño con
el código bueno pasando; los rojos, los controles y los arreglos (hipótesis) están en cada entrada.

- **`R9-342`** (agente 1): con un respaldo ajeno de `@prep_notes:ana` antes de la devolución, la
  espera sale con el ajeno, la puerta se abre antes de que el caso pida, y el caso no se arma. Con el
  ajeno, la prueba cae con el código bueno (`pidio: 2`) y pasa con la regresión: decide la vuelta, no
  el código. La entrada de `R9-334` decía «no es neutro», por lectura. Y el comentario de la prueba
  («otro respaldo no cuenta») es falso para uno de la misma clave (agente 2).
- **`R9-343`** (agente 2): la 97 armó un caso por paso de `firstWork`; la migración tiene cuatro
  partes en un `try`, y el caso hace fallar la primera. Residuo sin número (agente 1): `fallo: 1`
  cuenta cualquier llamada de la clave (`sinR336+ajenoNota336` pasa).
- **`R9-344`** (agente 1): con un estado `ana` durante `finishRelease`, lo pedido antes va a la «sin
  cuenta» con Ana ya adentro.
- **`R9-345`** (agente 2): con la clave tomada al pedirla en cuanto llegó un estado, lo escrito sin
  cuenta durante la migración acaba en la Mesa de Ana, y una lectura durante el trabajo no ve lo que
  la migración mueve. La frase es de `a85df96` (`R9-59`); la 95 y la 97 reescribieron la otra mitad.

## 3. Las herramientas: las piezas re-ancladas y `conClaves`

- **Las tres re-anclas de `S97-gen` le quitan la etiqueta al respaldo** (agente 3, re-medido). Su
  reemplazo deja `});` donde el código tiene `}, restoreAsk(pairs));`, así que la de `R9-298` cae en
  su control (`pidio: 1 → 0`). Con `devuelveFueraDelTurno` (y sus combinaciones con
  `antesSqlite1005` y `tardeNotasAna1005`) cae SOLO ahí: sin verde falso, pero esa columna no
  informa. Con `devuelveAntes` cae con `pidio: 0` y además con el daño.
  - Con la etiqueta conservada (`devuelveFueraDelTurnoE`, `devuelveAntesE`, en `S98-sonda`),
    `devuelveFueraDelTurnoE` tumba solo `R9-327` (`- "observation": "del respaldo"`), como en la 96;
    y `devuelveAntesE` tumba las mismas 6, la de `R9-298` por su daño (`+ "@prep_notes:ana"`), no
    por `pidio`. Las `…E` son el re-anclaje limpio: la próxima matriz debería usarlas.
  - ¿Lo abrió la 97? Sí, en `S97-gen` (solo de herramienta). Sin daño.
- **`conClaves` no aplica desde `3084a4c` (la 95)**, no desde la 97: su ancla
  (`givenBack.add(uid);\n    });\n`) cambió con `giveBackAsk`. Nunca estuvo en la matriz. Re-anclada
  a lo que queda de su lectura («the joins, nothing»: solo las uniones dicen sus claves),
  `conClavesE` pasa 39/39, también con `ajenoDev`. Ninguna prueba fija «the joins, nothing»; el
  riesgo es solo de pruebas y no se armó un caso: sin número.

## 4. `R9-340`

Lo que la 96 dejó por lectura, medido (agente 3, re-medido): con `escribeViejo`, el trabajo viejo
de `viejoReanudaA3` escribe `@prep_by_account` y corre `finishRelease` dentro de la prueba
siguiente, y suelta sus claves dos veces. `genSoloMark` (la hipótesis de la 96) cura el rojo y deja
las escrituras; `genCorta` (10 sitios) las corta con `prep` verde. Son unas 19 líneas de producción
que solo sirven bajo jest, y ninguna prueba las vigila (7 de los 10 sitios no los alcanza ningún
caso). Sigue sin arreglar: el diseño es medible, pero no vigilable sin una prueba por sitio.

## 5. Las lecciones

- **Un «por lectura» que dice «cambia los datos del caso» se mide con los datos que no lo cambian.**
  La 97 escribió en su propia entrada que un ajeno de la misma clave «no es neutro». Con los mismos
  pares lo es, y con él la regresión de `R9-298` pasa (`R9-342`). Es la regla de la 94, en el
  ledger de la sesión que la tenía. Medido (agente 1; re-medido).
- **La regla de la 95 («cada parte del trabajo») baja hasta las partes de cada paso, y vale para
  cada prueba que espera el trabajo, no solo la del arreglo.** La 97 armó un caso por paso de
  `firstWork`, y la migración tiene cuatro partes (`R9-343`); su prueba de `R9-337` tiene estados
  solo durante la migración (`R9-344`). Medido (`migraUnionSale`, `migraMarcaSale`,
  `claveTrasMigrar`; re-medido).
- **Al reescribir media oración, medí la oración entera.** La 95 y la 97 corrigieron la segunda
  mitad de la frase de `prepKey`, y la primera («once the auth state is known», de `a85df96`)
  admite una lectura que pasa todo y mezcla cuentas (`R9-345`). Es la regla de la 92, dentro de la
  misma oración. Medido (`claveConocidaAlLlegar`; re-medido).
- **Una pieza re-anclada conserva lo que el arreglo agregó en la línea de su ancla.** `S97-gen`
  re-escribió el cierre de `prepMultiSet` en el ancla y en el reemplazo, y el reemplazo perdió la
  etiqueta: con `devuelveFueraDelTurno`, la de `R9-298` cae solo en su control y su columna dejó de
  informar. Medido (`devuelveFueraDelTurno` contra `…E`; re-medido).
- **Jest levanta 31 workers por corrida aunque haya 3 archivos.** Son unos 3,4 GB por corrida, y
  dos a la vez dejaron 6,4 GB libres. En `prep`, `--maxWorkers=3`; en el suite, 4. Y matar el padre
  de una matriz mata la sonda hija sin restaurar: se espera la línea «tanda N». Medido (la lista de
  procesos; el desliz del agente 3).

## 6. El checkpoint

`npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con
`NODE_ENV=development` (`_scratch/S98-validate.out.txt`), corrido sin worktrees de agentes: exit 0.
Typecheck limpio, lint con 0 errores (los 70 avisos de siempre), `format:check` limpio, y jest
374/374 suites, 4648/4648 pruebas (las de la 97: la 98 es solo docs). El aviso de jest «A worker
process has failed to exit gracefully» ya salía en las validaciones de la 90 a la 97. El mensaje de
la 99 está en `_scratch/S99-PROMPT.md`.
