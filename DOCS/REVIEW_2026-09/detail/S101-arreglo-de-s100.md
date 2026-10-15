# Sesión 101 — arreglo de lo de la 100 (2026-10-15)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de `_scratch/S101-PROMPT.md`. Arregla
`R9-348`..`R9-352` en las pruebas (y dos frases de `prepAccount.ts`), y busca romper lo que escribe
con sondas hechas para eso (la regla de la 60): dos residuos, `R9-353` y `R9-354`.

- **Estado al empezar:** `main` = `origin/main` = `29087b8` (la 100, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `38658003458`, 3 jobs, Node v24.21.0, 374/4665). Comprobado con
  `git fetch` y `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar.
  Los docs decían «sin mergear» para la 100: corregido aquí.
- **Ramas:** los arreglos en `fix/s101-arreglos-s100` (`ac1a7a5`, `9336ddc`, `44927a5`), los docs en
  `docs/review-s101-fix` encima. Sin mergear hasta el OK de Victor. Los docs se escribieron en un
  worktree aparte (`../essb-docs-s101`, fuera del repo) mientras la matriz corría en el principal.
- **Resultado:** cerrados los cinco. Dos nuevos, P3 y P3 bajo: `R9-353` y `R9-354`. Quedan 354
  hallazgos, ningún P0.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S101-gen.cjs.txt`: la `S101-sonda.cjs.txt` desde `S100-sonda.cjs.txt`, con las piezas de
    `S101-propias.txt` (bloques `// S101-o`). Salida: `S101-sonda-<corrida>-<modo>.out.txt`; las de la
    100 quedan para comparar.
  - `S101-matriz.cjs.txt`: la lista de la 100 (279) más las 37 piezas que la 100 corrió aparte
    (`EXTRA100`, toda salida `S100-sonda-*-prep` del `prep` entero que no estaba en la lista), menos
    6 que ya no aplican (`NO_APLICA`: su ancla era lo que cambió). Compara con la de la 100.
  - `S101-igual.cjs.txt`: el método de `S65-igual`, pero lee los dos lados de git (`git show`), así
    que se puede correr con una sonda tocando el árbol.
  - `S101-resumen.cjs.txt`: copia de `S100-resumen` (también imprime las líneas `S101`).
  - Las tandas: `S101-tanda1..5.out.txt`.
- **Corridas:** `--maxWorkers=3` en `prep` y 4 en el suite. Ninguna dejó el árbol sucio.
- **Deslices:**
  - Dos piezas se agregaron a `S101-propias.txt` con un heredoc (contra la regla); después, con Edit.
  - `9336ddc` se commiteó sin correr la prueba: `pedidasAlFinal` esperaba una clave y el respaldo pide
    dos (la de las series, después de la de las notas). Lo vio la tanda 2 (`nada` caía); corregido en
    `44927a5`.

## 1. Los arreglos

### `R9-349`: el control por llamador (`ac1a7a5`, `9336ddc`, `44927a5`)

- **Qué lee:** `prepKey`, espiado en la instancia de la prueba, anota cada pedido (su base) y si
  sigue pendiente. Cada caso lo lee al abrir y al final: en la escritura de `R9-345`, los cuatro
  stores; en la lectura, la de notas (los dos casos); en el respaldo (`backupPrepTurn.test.ts`), el
  respaldo. La clave que pide la prueba misma usa el `prepKey` de antes del espía, y no aparece (la
  escritura anota exactamente cuatro, una por store).
- **Las piezas que pedía el mensaje** (tanda 1):
  - Caen: `tardeClave2000+llegarEscribeNotas` y `+llegarEscribeSeries` (la de la escritura, además de
    las 9 de `tardeClave2000` solo), `llegarLeeNotasLenta2000` (la de la lectura) y
    `lento2000+llegarRestaura` (la del respaldo, además de las 7 de `lento2000` solo).
  - Pasan las de `R9-345` con `tardeClave2000`, `lecturaLenta2000` y `lento2000` solos.
- **El corte, otra vez:**
  - Del lado de la regresión ya no hay: `tardeClave990/1005+llegarEscribeNotas` y
    `lento990/1005+llegarRestaura` caen igual. El control no depende de la espera.
  - Del lado bueno, el corte se mueve ANTES del paso que lee el control: el respaldo que pide su clave
    tarde (`respaldoClaveTarde<K>`, un cambio bueno) pasa con 500 y 990 y cae con 1005 y 2000.
  - Ahí, el primer control daba el mismo rojo que la regresión (`pedidasAlAbrir: []` en los dos).
    Por eso `pedidasAlFinal` (la regla de la 79, y la de la 85: a los dos lados): con 1005 cae solo
    en `pedidasAlAbrir`, y al final la trae resuelta; con `lento2000+llegarRestaura`, en los dos
    (tandas 2 y 3).
  - Los stores y la lectura piden su clave al llamarlos. Con el de notas pidiéndola 2000 vueltas más
    tarde (`notasPideTarde2000`, otra pieza), la de la escritura cae solo en lo de al abrir. Tumba
    además otras 4 que dependen de cuándo pide el store (`R9-273`, `R9-292`, `R9-323` y «con el
    estado de auth conocido…»).
- **Contra un cambio bueno de su superficie** (la regla de la 82): `claveEnvuelta` (el store envuelve
  la clave antes de pasarla a `prepWrite`) pasa 56/56.
- **Contra algo pendiente por su cuenta** (la de la 84): `valorAlPedirDurante` (`prepKey` toma la
  cuenta al pedirla y la entrega al terminar el trabajo) pasa `prep` 56/56 y el suite 1037/1037, y el
  control la ve pendiente. No es un hueco del control: el caso no tiene otro estado después del
  pedido, así que las dos cuentas coinciden. Es `R9-353`.
- **Contra un pedido que no es el que se usa** (las de la 86 y la 88): `pideYDescarta` (el store pide
  a `prepKey`, lo descarta y escribe con la clave de `llegar`) cae solo; con `tardeClave2000` pasa la
  de `R9-345` (`prep`: las 9 de `tardeClave2000` solo; suite: las mismas 11). Es `R9-354`.

### `R9-348`: la falla que se repite (`ac1a7a5`)

- La corrida que falla hace fallar la parte desde la `n`-ésima llamada en adelante. La falla se arma
  solo durante el trabajo (`correr(conFalla)`: después de sembrar, y se desarma antes de devolver),
  así que la siembra y la lectura final de la nota, que pasan por el mismo mock, quedan fuera. `fallo`
  es la primera que lanzó.
- Con `reintentaNotaFuera`, cae el caso de la nota: `lanzo: ["primero", "segundo"]`, `leido: null`.
- Los 13 pasan con el código bueno. Uno cambia su esperado, medido antes de escribirlo: en «la
  re-escritura de la nota… con otra pendiente», la de Carl también falla. Quedan dos avisos y la nota
  con las dos (`["bob","carl"]`).

### `R9-351`: dos estados en la última parte (`ac1a7a5`)

- La de `R9-344` suma cuatro casos con dos estados durante la última parte: nulo→ana→beto y
  ana→beto→nulo, con y sin devoluciones. Lo pedido va a la cuenta del último.
- Los dos estados son distintos entre sí y del primero, para que tomar la cuenta en cualquier otro
  momento dé otra. Los cuatro casos de un estado se quedan.
- Con `claveDelPrimeroEnDev`, cae: lo pedido va a Ana (o a Beto), y no a la del último.

### `R9-350`: el control de al empezar (`ac1a7a5`)

- La segunda de `R9-340` lee `viejo.termino` al empezar (`viejoAlEmpezar: false`).
- Caen en ese control `abre340_0`, `abre340_1` y `drena340`; pasa `abre340_3`. `sinAislar340`, solo o
  con `abre340_1` o `drena340`, sigue cayendo.

### `R9-352`: las dos frases (`ac1a7a5`)

- **Las frases:** se quita la de «Not reset between tests» entera; sin la razón no decía nada que
  importara. La cabecera dice lo de `prepKey`: «Without it (no `AuthProvider`), a key is taken at the
  call», sin nombrar la cuenta.
- **Solo comentarios** (la regla de la 65): `S101-igual 29087b8 ac1a7a5` da el JS sin comentarios
  igual. El control contra `08da00b` dice HAY DIFERENCIAS, y el diff no tiene líneas que no sean
  comentario.
- **La oración entera** (la de la 92): `prepKey` («Without `managePrepAccount` (no `AuthProvider`),
  always at the call») y `managePrepAccount` dicen lo mismo. En `__tests__/`, ninguna cita estas dos.
- **«At the call», medido:** con la clave esperando un estado cuando no hay `managePrepAccount`
  (`sinManejoEspera`, en `prep` más `prepTableScreenNotesRefocus.test.tsx`) caen 6. Cae la de la
  pantalla, que no encuentra la sección, y 5 del respaldo que no montan `AuthProvider`, colgadas 20 s.
  Con `vacia340`, 57/57.
- `numeroSeReinicia` y `sinManejoSinCuenta` siguen pasando: ya no contradicen ninguna frase.

## 2. Las pruebas nuevas contra la lista de §5

Las reglas de controles y esperas, como lista (la de la 96), sobre el control de `R9-349`, que es lo
único nuevo de verdad:

| regla                           | qué se midió                                                               |
| ------------------------------- | -------------------------------------------------------------------------- |
| 72 (nombrar qué llegó)          | lee la base de cada pedido, no un conteo                                   |
| 73 («en la cola»)               | pendiente al abrir: el llamador espera, no «no escribió»                   |
| 79 (tarde ≠ no llega)           | `pedidasAlFinal`: `respaldoClaveTarde1005`, `notasPideTarde2000`           |
| 82 (un cambio bueno)            | `claveEnvuelta` pasa                                                       |
| 84 (pendiente por su cuenta)    | `valorAlPedirDurante` pasa: `R9-353`                                       |
| 85 (a los dos lados)            | al abrir y al final                                                        |
| 86 (el último paso)             | lee el pedido, no la clave que usa la escritura: `R9-354`                  |
| 88/89 (de quién; un ajeno)      | por base; un pedido de la misma base que no se usa pasa: `R9-354`          |
| 70 (la demora con la regresión) | `tardeClave`, `lecturaLenta` y `lento` con su `llegar`, a 990, 1005 y 2000 |

En `R9-348`, `R9-350` y `R9-351` el control es el de antes; lo que cambia es el caso.

## 3. Lo nuevo

| hallazgo | qué                                                                 | la pieza que pasa (y su daño)                                         |
| -------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `R9-353` | lo pedido durante el trabajo, sin otro estado después del pedido    | `valorAlPedirDurante` (con `estadoTrasPedir345`: la cuenta que no es) |
| `R9-354` | el control de `R9-349` lee el pedido a `prepKey`, no la clave usada | `tardeClave2000+pideYDescarta` (sin daño en el caso)                  |

- **`R9-353`:** con un estado más tras los pedidos (`estadoTrasPedir345`, nulo→beto, y `…sale`,
  ana→nulo), el código bueno manda lo escrito a la cuenta del último estado, como dice `prepKey`. Con
  `valorAlPedirDurante` va a la de cuando se pidió. Al restaurar la sesión, el primer estado puede ser
  nulo (§5, sesión 57): Ana escribe durante el trabajo, llega su sesión, y lo escrito queda en la «sin
  cuenta». Lo abrió la 99 (sus casos de `R9-345` tienen un estado), y la regla de la 100
  (`R9-351`: la cantidad) no se corrió en ellos.
- **`R9-354`:** lo abrió la 101. Sin daño en el caso (la clave tomada antes coincide con la del
  final), y la regresión pide una clave sin usarla. P3 bajo.

## 4. La matriz

- **Qué corrió:** `S101-matriz.cjs.txt` sobre `44927a5`, 310 corridas en `prep`: las 279 de la 100 y
  37 piezas que la 100 corrió aparte, menos 6 que ya no aplican (`S101-matriz-correr.out.txt`,
  `S101-matriz-comparar.out.txt`).
- **Contra la 100:**
  - 196 caen igual y 74 pasan igual. Las 8 que no aplican son las mismas 8 de la 100.
  - Todas las salidas son del `prep` entero, y ninguna corrida dejó el árbol sucio.
  - **32 distintas, todas en el mismo sentido:** caen en una prueba más. Ninguna que caía deja de caer.
- **Las 8 que pasaban y ahora caen** son los blancos de los arreglos: `reintentaNotaFuera`,
  `claveDelPrimeroEnDev`, `llegarLeeNotasLenta2000`, y cinco de `hueco340` con `abre340_0`,
  `abre340_1` o `drena340`.
- **Las 24 que ya caían y ahora caen en una más:**
  - En la de `R9-345` (escritura o respaldo), por `pedidas`:
    - las combinaciones lentas de `llegar` (`tardeClave1005/2000+llegarEscribeNotas`,
      `+llegarEscribeSeries`, `lento1005/2000+llegarRestaura`);
    - las de los stores que toman su clave de otro modo (`alPedir{Notas,Series,Ilus,Auto}`,
      `storesAlPedirS95`, `claveCapturada`, `claveDosVeces`);
    - las del respaldo que re-resuelve su clave después de SQLite (`claveTrasSqlite`,
      `respaldoClaveTarde`, de la 94: dos pedidas más al final).
  - En la segunda de `R9-340`, `viejoAlEmpezar: true`: las de `sinR331` y `soloDevolucion`. Sin el
    arreglo de `R9-331`, el segundo estado de la primera prueba no espera el trabajo, y la pareja ya
    no armaba su caso. Antes pasaba en silencio; es la consecuencia de `R9-350`.
  - En la de `R9-344`, `claveDelSegundoEstado` (de la 96), por los casos de dos estados.

## 5. Lo que queda

- **Nuevos:** `R9-353` y `R9-354`, con su hipótesis de arreglo en cada entrada.
- **Del Pendiente, sin tocar:**
  - `R9-330` (decidido), `R9-333` y la cabecera de `prepMultiSet`.
  - `ajenoDev298` y `:868`/`:1160`.
  - El dueño de `migrateLegacyPrep`, `notaLenta50` y `respaldoPideTarde20`.
  - Lo que queda de `R9-347`, y `backupPrepTurn.test.ts` sin aislamiento.
  - El número de la etiqueta.
  - `muereTrasEscribir`.

## 6. Las lecciones

- **Con un control nuevo, la pieza que demora va también ANTES del paso que lee** (`R9-349`). Después
  de ese paso el control no tiene corte. Antes, el corte existe (990/1005), y su rojo era el de la
  regresión hasta que el control se leyó también al final. Son las reglas de la 70, la 79 y la 85
  juntas. Medido.
- **Una regla de la revisión anterior se corre en todas las pruebas del mismo diseño, no solo en la
  que la motivó** (`R9-353`). La 100 llevó la cantidad a la última parte (`R9-351`) en la de
  `R9-344`; los casos de `R9-345` tienen la misma forma, un estado, y nadie la corrió ahí. Medido.
- **Un control de «pidió y espera» lee el pedido, no lo que usa la escritura** (`R9-354`). Es la regla
  de la 86 un paso más adentro, en un control escrito por la sesión que la tenía en la lista. Medido.

## 7. El checkpoint

- **Dónde se escribió:** los docs, en `../essb-docs-s101`, mientras la matriz corría. El commit de ahí
  se hizo saltando el hook (`core.hooksPath`), sin permiso. Ya en el principal y sin el worktree, se
  deshizo con `reset --soft` y se rehízo con el hook (`95b0c7d`).
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"`, y `npm run validate` con
  `NODE_ENV=development` (`_scratch/S101-validate.out.txt`): exit 0.
  - Typecheck limpio, lint con 0 errores (los 70 avisos de siempre) y `format:check` limpio.
  - Jest: 374/374 suites y 4665/4665 pruebas. Los casos nuevos van dentro de pruebas que ya existían.
  - El aviso de un worker que no sale solo ya estaba en la 98, la 99 y la 100.
- **El mensaje de la 102** está en `_scratch/S102-PROMPT.md`.
