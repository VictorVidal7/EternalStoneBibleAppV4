# Sesión 102 — revisión del diff de la 101 (2026-10-19)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S102-PROMPT.md`. El mensaje decía «sin
agentes»; Victor pidió después 3, y fueron 3 `fork` en worktree que solo midieron. Revisa
`29087b8..44927a5` (los arreglos de `R9-348`..`R9-352`) con sondas hechas para romperlos (la regla
de la 60), y re-mide la matriz de la 101.

- **Estado al empezar:** `main` = `origin/main` = `d47e326` (la 101, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `38783879671`, 3 jobs, Node v24.21.0, 374/4665). Comprobado con
  `git fetch` y `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar.
  Los docs decían «sin mergear» para la 101: corregido aquí.
- **Rama:** solo docs, en `docs/review-s102-diff-s101`, escrita en un worktree aparte
  (`../essb-docs-s102`, fuera del repo) mientras la matriz y las tandas corrían en el principal. Sin
  mergear hasta el OK de Victor.
- **Resultado:** lo de la 101 se sostiene como código, y la matriz no cambia. Cuatro nuevos (P3 y P3
  bajo): `R9-355`..`R9-358`. Quedan 358 hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S102-gen.cjs.txt`: la `S102-sonda.cjs.txt` desde `S101-sonda.cjs.txt`, con las piezas de
    `S102-propias.txt` (bloques `// S102-o`). Con `<raíz del worktree> <N>` arma además la sonda de
    cada agente (ROOT en su worktree, salida `S102-a<N>-sonda-*`, sus piezas en `S102-a<N>-propias.txt`),
    su `igual` y su `resumen`, y le copia los archivos que leen las piezas. Reemplaza a los `S9x-copiar`.
  - `S102-matriz.cjs.txt`: la lista de la 101 (se arma leyendo `S101-matriz.cjs.txt`) más las 20
    piezas que la 101 corrió aparte (`EXTRA101`). Compara con la de la 101.
  - Las tandas: `S102-tanda1..5.out.txt`.
- **Los agentes:** 3 `fork` con `isolation: "worktree"`, nacidos en `d47e326` (sin `reset`). Cada uno
  con una tarea estrecha (comentarios; los controles de `R9-349` y `R9-348`; `R9-344` y `R9-340`), unas
  25 llamadas como tope, `--maxWorkers=3`, y el `cp -r` de su `_scratch` al principal
  (`_scratch/S102-sondas-agente-N/`: 32, 37 y 46 archivos). Completaron los tres, sin cortes (200-213k
  tokens, 21-25 llamadas, 7-8 min). Sus worktrees y ramas se borraron solos.
- **Re-medido en el principal:** cada pieza de los agentes que sostiene un hallazgo o un «sin
  hallazgo» del detalle, con `S102-sonda` (tandas 1, 2 y 5); las de `R9-337` (tandas 3 y 4), del
  orquestador. Todo dio lo mismo que en los worktrees.
- **Corridas:** `--maxWorkers=3` en `prep` y 4 en el suite. Ninguna dejó el árbol sucio.

## 1. El código (`ac1a7a5`): solo comentarios

- `S101-igual 29087b8 ac1a7a5 src/features/study/prepAccount.ts`: «JS sin comentarios igual: true»,
  TODOS IGUALES. **Control:** contra `08da00b`, HAY DIFERENCIAS. (Contra `54bb2f3` no sirve de control:
  el código del archivo no cambió desde la 99.) `ac1a7a5..44927a5` no toca `src/`.
- **«A key is taken at the call», otra lectura** (agente 1): sin `managePrepAccount`, leer la cuenta
  1000 microtareas después de la llamada (`sinManejoTarde1000`) pasa `prep` 56/56. Está fijado «no
  espera un estado» (`sinManejoEspera`, de la 101), no «en el momento de la llamada». Sin daño en la
  app (`AuthProvider` siempre llama a `managePrepAccount`, y sin él ninguna prueba llama a
  `setPrepAccount`): no se numera.
- **La frase de `prepKey` para después del trabajo sí está fijada:** con `managePrepAccount`, la cuenta
  leída una microtarea tarde (`trasTrabajoTarde1`) cae en «con el estado de auth conocido…»
  (`@prep_notes:ana` pasa a `beto`).

## 2. Los comentarios de las pruebas nuevas (agente 1)

Contra el código que citan, por lectura:

- **`vigilarClaves`:** «las que pide la prueba misma no pasan por aquí» es cierto por construcción
  (la escritura anota exactamente cuatro).
- **El ayudante de las partes:** «la n-ésima y las siguientes» y «`fallo`: la primera que lanzó»
  coinciden con el código (`llamadas >= n`, `fallo ??=`); ningún caso de `getItem` usa la clave de la
  lectura que la prueba hace al final (`@prep_notes`).
- **`R9-350`:** `viejoAlEmpezar` se lee en la primera línea del cuerpo, antes de `relojesFalsos` y de
  `managePrepAccount`, sin `await` en medio.
- **`R9-351`:** «dos estados durante esa última parte, distintos entre sí y del primero» es cierto
  en valor, no en tiempo: llegan en la misma tarea. Es `R9-356`.
- **`R9-349` del respaldo:** «la de las series la pide después de tener la de las notas», fijado como
  lista exacta, hace caer un cambio que no cambia lo escrito. Es `R9-358`.

## 3. Las pruebas rehechas, contra la lista de §5

### El control de `R9-349` (agente 2): sin hallazgo

- **Un ajeno de la misma base:** `ajenoNotas349` (`void getAllPrepNotes()` tras `vigilarClaves`) hace
  caer la de `R9-345` con el código bueno (dos `@prep_notes`): un rojo, no un verde falso (la regla de
  la 88). Con el esperado adaptado (`ajenoNotas349b`), pasa 56/56, y con
  `tardeClave2000+llegarEscribeNotas` cae (10/56: las 9 de `tardeClave2000` y la de `R9-345`). La
  lista cuenta por base y con repetidos: un ajeno no ocupa el lugar del llamador que falta.
- **Otros llamadores de `prepKey`:** sin vigilar quedan las lecturas de series, ilustraciones y
  autoevaluación, y exportar: lo que queda de `R9-347`, en el Pendiente. La de las series de la
  restauración se ve solo al final (`pedidasAlFinal`).

### La tabla de las partes (agente 2): `R9-357`

- Un camino de error que toca un par (método, clave) que ninguna parte hace fallar pasa
  (`migraQuitaMarcaEnCatch`, `notaQuitaEnCatch`); con el disco entero, los dos estados lanzan
  (`discoEntero348`). El control `reNotaEnCatchDev` (otra clave, con métodos que la tabla sí hace
  fallar) cae en dos casos: el hueco es el par, no «otra clave».
- **La falla de una parte que tumba la siguiente de la misma clave:** sin caso, por enumeración de
  las llamadas en una corrida limpia (el único par con más de una llamada es el `getItem` de la nota,
  y cada una tiene su caso). No se midió con una regresión por cada par.

### `R9-344` con más estados (agente 3): `R9-355`; y en el tiempo (agente 1): `R9-356`

- Con el primero repetido o con tres estados, tres regresiones pasan `prep` y el suite, y lo pedido
  va a la cuenta que no es (`R9-355`, la tabla en su entrada). La forma (nulo→ana→nulo) está fijada en
  la migración (`ignoraPrimeroEnTodo` cae en la de `R9-337`) y falta en la última parte.
- Los estados de `R9-344` y de `R9-337` llegan en la misma tarea: fijar el primero una microtarea
  tarde pasa en las dos, y con los estados de a uno cae (`R9-356`). Lo de `R9-337` lo midió el
  orquestador al ver el mismo patrón en `:860-861`.

### `R9-340`: el margen de `viejoAlEmpezar` (agente 3): sin hallazgo

- La puerta: `abre340_1` cae en el control (de la 101); `abre340_2` y `abre340_3` pasan.
- Vueltas agregadas entre las dos pruebas (`antes340_<K>`, un `beforeEach` que espera K vueltas): 18
  pasan; con 19 cae solo en `viejoAlEmpezar: true`. El margen es de 18 vueltas extra (las 2 de jest
  más 18 son las 20 de la puerta).
- Con `sinAislar340` junto (la regla de la 70), `antes340_18` cae en el daño (`claves:
["@prep_by_account"]`, `leido: []`), no en un control; el agente 3 vio lo mismo con las demás
  demoras.
- Pasado el margen, el control da rojo con el código bueno, como debe.

## 4. Lo nuevo

| hallazgo | qué                                                                       | la pieza que pasa (y su daño)                                                      |
| -------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `R9-355` | los dos estados de `R9-351`: nunca el primero repetido, nunca tres        | `ignoraPrimeroEnDev`, `claveDelSegundoEnDev` (`primeroRepetido344`)                |
| `R9-356` | los estados de `R9-337` y `R9-344`, en la misma tarea                     | `claveDelPrimeroEn{Dev,Trabajo}Micro` (`estadosSeparados344`, `…337`)              |
| `R9-357` | la tabla de las partes hace fallar un solo par (método, clave)            | `migraQuitaMarcaEnCatch`, `notaQuitaEnCatch` (`discoEntero348`, `notaSembrada348`) |
| `R9-358` | `pedidasAlAbrir` del respaldo, una lista exacta, fija el orden de pedidos | ninguna: un rojo con `respaldoClavesJuntas`, que no cambia lo escrito              |

- **El tercer residuo** que pedía el mensaje es `R9-355`: la 101 corrió la regla de la 100 (la
  cantidad) en la de `R9-344`, y no la forma que la de `R9-337` ya tenía. `R9-356` y `R9-358` son
  también de la 101; `R9-357` es de la 97 y la 99.
- **No se numera:** que el respaldo «se partiría entre dos cuentas» si un estado llega entre sus dos
  claves (lo dijo el agente 1 sin medirlo). Entre las dos solo hay microtareas
  (`BackupService.ts:1399-1414`); no se midió.

## 5. La matriz

- **Qué corrió:** `S102-matriz.cjs.txt` sobre `44927a5`, 330 corridas en `prep`: las 310 de la 101 y
  20 piezas que la 101 corrió aparte (`S102-matriz-correr.out.txt`, `S102-matriz-comparar.out.txt`).
- **Contra la 101:** 240 caen igual y 77 pasan igual; todas las salidas, del `prep` entero; ninguna
  corrida dejó el árbol sucio.
  - **1 distinta, explicada:** `sinManejoEspera` (5 caen hoy, 6 en la 101): la 101 la corrió con
    `prepTableScreenNotesRefocus.test.tsx` además (57 pruebas), y la sexta es la de esa pantalla.
  - **12 no aplican:** las 8 de siempre (`ajenoR327`, `porEntrada…`, `etiquetaSinClaves`,
    `ajenoTrasRespaldo298`, `conClavesE`), y las 4 pruebas-sonda de `R9-353`
    (`estadoTrasPedir345`, `…sale`, con y sin `valorAlPedirDurante`): su ancla es de `ac1a7a5`, y
    `44927a5` agregó `pedidasAlFinal` tras el `Promise.all`.
- **Las de `R9-353`, re-ancladas** (`estadoTrasPedir345E`, `…saleE`): dan lo mismo que en la 101 sobre
  `44927a5`. Con el código bueno, nulo→beto deja lo escrito en la Mesa de Beto (la sonda cae: espera la
  «sin cuenta») y ana→nulo pasa; con `valorAlPedirDurante`, al revés (`@prep_notes`, y la Mesa de Ana).

## 6. Lo que queda

- **Nuevos:** `R9-355`..`R9-358`, con su hipótesis de arreglo en cada entrada.
- **De la 101, sin arreglar:** `R9-353` y `R9-354` (los arregla la 103).
- **Del Pendiente, sin tocar:** `R9-330` (decidido), `R9-333` y la cabecera de `prepMultiSet`;
  `ajenoDev298` y `:868`/`:1160`; el dueño de `migrateLegacyPrep`, `notaLenta50` y
  `respaldoPideTarde20`; lo que queda de `R9-347` y `backupPrepTurn.test.ts` sin aislamiento; el número
  de la etiqueta; `muereTrasEscribir`.

## 7. Las lecciones

- **Al llevar la cantidad de un caso a otra parte, llevá también su forma** (`R9-355`). La 100 escribió
  «llevá también su cantidad», y la 101 puso dos estados distintos: con dos como tope, «el segundo» y
  «el último» son el mismo, y sin el primero repetido, «el último distinto del primero» también.
  Medido.
- **Varios estados mandados en la misma tarea son distintos en valor, no en tiempo** (`R9-356`). Una
  regresión que lee la cuenta una microtarea tarde los ve como uno solo. Es la regla de la 76 (una
  puerta construye un punto del orden). Medido, en dos pruebas de dos sesiones.
- **Una falla inyectada por par (método, clave) no ve un camino de error que toca otro par**
  (`R9-357`). La regla de la 49 (una falla puede repetirse) vale también para «se extiende»: el disco
  falla entero. Medido.
- **Las pruebas-sonda que sostienen un hallazgo se anclan en el último commit de la sesión que las
  mide.** La 101 midió `R9-353` sobre `ac1a7a5` y cambió esa prueba en `44927a5`: sus cuatro
  pruebas-sonda no aplicaban en la matriz de la 102. Re-ancladas, dan lo mismo. Medido.

## 8. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s102`, mientras las tandas corrían en el principal.
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"`, y `npm run validate` con
  `NODE_ENV=development` (`_scratch/S102-validate.out.txt`): exit 0. Typecheck limpio, lint con 0
  errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites y 4665/4665
  pruebas.
- **El mensaje de la 103** está en `_scratch/S103-PROMPT.md`.
