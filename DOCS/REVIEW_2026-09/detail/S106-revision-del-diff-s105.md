# Sesión 106 — revisión del diff de la 105 (2026-10-20)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S106-PROMPT.md` y 4 agentes en worktree
que solo midieron (los pidió Victor: «Podrías mandar 4 agentes?»). La segunda vuelta de la 105 (la
regla de la 60): cada agente atacó lo integrado de otro, empezando por lo que el orquestador de la 105
cambió a mano. Solo docs.

- **Estado al empezar:** `main` = `origin/main` = `bdd9eaf` (la 105, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `39478051223`, 3 jobs, Node v24.21.0, 374/4672). Comprobado con
  `git fetch` y `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar.
  Los docs decían «sin mergear» para la 105: corregido aquí.
- **Rama:** `docs/review-s106-diff-s105` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** 8 nuevos (`R9-373`..`R9-380`), todos en las pruebas, ninguno P0. Quedan 380 hallazgos.
- **`R9-370`, decidido** por el orquestador de la 105 con la delegación de Victor: opción (a) (escrito
  en su entrada y en la §7 de `CONTINUAR.md`; lo implementa la 107).

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S106-gen.cjs.txt`: la `S106-sonda.cjs.txt` desde `S105-sonda.cjs.txt` (que ya tiene las piezas
    de la 105 y de sus 10 agentes), con las de `S106-propias.txt` (bloques `// S106-o`) y, en el
    principal, las de las copias de los agentes (`S106-sondas-agente-N/S106-a<N>-propias.txt`). Con
    `<raíz del worktree> <N>` arma la sonda de cada agente (ROOT propio, salida `S106-a<N>-sonda-*`), su
    `igual` y su `resumen`. Probada antes de lanzar: en modo `anclas`, 25 corridas de las entradas de la
    105 (todas aplican, árbol limpio); el modo agente con N = 4 en un directorio temporal, y el 11,
    rechazado.
  - `S106-matriz.cjs.txt`: primero las corridas de los agentes (las que dejaron en `prep` en su copia),
    después la lista entera de la 105 (510, leída de `S105-matriz.cjs.txt`) más su tanda 3. Compara las
    de la 105 con `S105-sonda-<c>-prep.out.txt`, y las de los agentes con la salida de su worktree.
  - `S106-caidas.cjs.txt`: lo que cae en cada salida (con `S106_DIFF=1`, también el diff).
- **Los agentes:** 4 `fork` con `isolation: "worktree"`, nacidos en `bdd9eaf` (sin `reset`), lanzados en
  cuanto `S106-gen` pasó `anclas`, con `--maxWorkers=3`, las reglas de controles y esperas de §5 como
  lista y el `cp -r` de su `_scratch` tras cada bloque. Las seis entradas del reparto, juntadas en
  cuatro:
  - **A1:** `tiempoYVueltas` (las esperas de `R9-357` y los estados de `R9-337`, `R9-344` y `R9-353`).
  - **A2:** el respaldo de `R9-345` (los hunks de A5 portados a mano, Cata, el filtro de la pila, el
    corte por caso) y el aislamiento de `R9-372`, los dos en `backupPrepTurn.test.ts`.
  - **A3:** la escritura y la lectura de `R9-345`, `lecturas()` y la tabla (`R9-359`) y el control
    `union` de `R9-333`, todo en `prepAccount.test.ts`.
  - **A4:** los comentarios del diff entero, primero las frases del orquestador.
  - Completaron los cuatro, sin cortes: 212-243k tokens, 23-40 llamadas (A1 y A2 pasaron el tope de
    ~25), 6-31 min. Copias: 50, 47, 46 y 33 archivos, lo que dijo cada uno.
  - **Los worktrees:** los de A2, A3 y A4 (sin cambios) se borraron solos; el de A1 quedó (su último
    aviso llegó con una corrida en segundo plano): `diff -rq` de su `_scratch` contra su copia, vacío, y
    `git worktree remove --force --force` + `git branch -D`.
- **Re-medido en el principal:** toda corrida de los agentes, en la matriz (abajo), y en el suite los
  verdes falsos de `R9-373` y `R9-377` (`_scratch/S106-tanda-suite.out.txt`).
- **Ninguna corrida dejó el árbol sucio.**

## 1. Lo nuevo

| hallazgo | qué                                                                                           | la pieza (y lo que pasa)                                                 | agente |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| `R9-373` | `tiempoYVueltas` tiene un corte en eslabones, sin escribir                                    | `notaQuitaCadena1001x7200000`: `prep` 63/63 (con 1000 cae, `nota: null`) | A1, A4 |
| `R9-374` | reloj falso antes de un trabajo que la prueba espera: un trabajo que cede con un temporizador | `cedeConTimeoutEnNota0`: 15 trabas y `R9-344` en su control (47/63)      | A1, A3 |
| `R9-375` | `mockSqlite` fuera del aislamiento de `R9-372`                                                | `colgadaSqliteBpt`: 64/65; `turnoAntesSqlite`: 4 de sus 9 son arrastre   | A2     |
| `R9-376` | la espera de Cata y `resolvioAntesDeCata`, con el registro filtrado vacío                     | `respaldoClaveOtroModulo`: 59/63, con las columnas del daño              | A2     |
| `R9-377` | el filtro de la pila del respaldo cuenta cualquier pedido del módulo                          | `ajenoDesdeRespaldo+respaldoNotasTrasSeries`: 63/63                      | A2     |
| `R9-378` | `pedidas` de la escritura y la lectura: lista exacta por base                                 | `notasPideDosVeces`: 58/63; `ajenoLecturaEnEscritura345`: 59/63          | A3, A4 |
| `R9-379` | el control «al abrir» de la lectura no se compara en los casos con estados                    | `lecturaControlAntesDeEstados`: 63/63                                    | A3     |
| `R9-380` | residuos de `R9-359`: `getAllKeys` y el orden de las claves                                   | `migraMarcaPorGetAllKeys`: 50/63; `migraClavesAlReves`: 62/63            | A3     |

- **Lo que abrió la 105:** `R9-373` (`tiempoYVueltas`), `R9-375` (el aislamiento incompleto), `R9-376`
  (`53bdbe6`), `R9-377` (el filtro de la pila), `R9-378` (el arreglo de `R9-365`, solo en el respaldo),
  `R9-379` (la nota y el comentario de `R9-366` en la lectura) y `R9-380` (`lecturas()`, solo
  `multiGet`). `R9-374` es de la 103 (`c53c5e8`), y la frase que la contradice, de la 105.
- **Con daño medido:** `R9-373` (la nota de Bob se pierde; tras un estado, lo pedido va a la cuenta que
  no es). Los demás son rojos ante un cambio bueno o verdes falsos sin daño en los casos de la prueba.

## 2. Sin hallazgo, medido

- **Una vuelta entre los dos pedidos del respaldo no es un cambio bueno** (A4 la llamó así; A2 midió lo
  mismo y vio lo contrario): `respaldoVueltaEntreClaves` y `respaldoSeriesTrasVueltas1` tumban los 4
  casos del respaldo en los datos (59/63, con `@prep_series:cata`). En la app, un estado que llegue en
  esa vuelta parte lo restaurado: la de las notas va a la cuenta del trabajo y la de las series a la
  nueva. Hoy no pasa porque la segunda clave se pide en la misma tanda de microtareas en que resuelve la
  primera (`respaldoMicroEntreClaves`, 63/63). Sin Cata (`…+sinCata106`), 63/63. El rojo es honesto.
- **El corte de `R9-366` con las mil vueltas por estado** (A4): «un estado», 2001 cae y 2004 pasa;
  nulo→beto→nulo, 3008 cae y 4004 pasa. Concuerda con la frase.
- **El corte de `respaldoClaveTarde<K>` por caso** (A2): 1005 y 1990 tumban «un estado»; 2010, tres
  casos; 3010, los cuatro. La cabecera de `R9-349` escribe el de «un estado», acotado así.
  `respaldoPideYTomaTras<K>` cae en los 4 con 1005, 2010 y 3010: con Cata no tiene corte en K.
- **Cata con el registro lleno** (A2): `respaldoResuelveYTomaTras1` (espera sus claves, da una vuelta y
  escribe con la cuenta de ese momento) cae en los 4 (59/63); con 10 ms, también (52/63).
- **Un temporizador que nace después de las mil vueltas** (A1): `notaQuitaVueltasYTimeout1005x10` cae
  (61/63) y `…1010x10` pasa: el corte de 1010 vueltas que escribió la 105, también con 10 ms.
- **Un intervalo que no se apaga** (A1): `intervaloInocuo100` y `…10` pasan (63/63; con 10 ms, 55 s).
  Con 1 ms, en el worktree de A1, `prepAccount.test.ts` tardó 443 s y salió sin resumen de jest: sin
  analizar, y fuera de la matriz.
- **La cadena tras el pedido** (A1, `claveDelPrimeroTrasPedirCadena<K>x10`): cae en los 3 casos de
  varios estados con 1000, 1001, 2001 y 3001 eslabones (60/63): la hora falsa corre los eslabones cortos.
- **La regla de la 101 en la lectura** (A3): `lecturaAntesDePedir1990` pasa; `…2010` cae solo por
  `pedidas: []` al abrir (en `migracion` y `devolucion`), un rojo distinto del de la regresión.
- **`R9-333`** (A3): `unionDevLenta990` deja pasar la de `R9-274`, y `…1010` la tumba solo por `union:
null` («no llegó»); con 10 ms, igual. El corte es el tope de mil, y el rojo no es el del daño.
- **Las regresiones de tiempo de la lectura** (A3): `lecturaAlSiguienteDurante` y
  `lecturaPideYDescartaLenta3010` caen por `leido` (62/63).
- **Los logros y los relojes del respaldo** (A2, por lectura): no cierran estado del archivo.

## 3. La matriz

- **Qué corrió:** `S106-matriz.cjs.txt correr` sobre `53bdbe6` (`main` = `bdd9eaf`), 595 corridas en
  `prep` con `--maxWorkers=3` (`S106-matriz-correr.out.txt`, `S106-matriz-comparar.out.txt`): las 84 de
  los agentes, una pieza suelta (`sinCata106`) y las 510 de la 105 con su tanda 3. Antes, las 595 en
  modo `anclas` sobre el último commit: todas aplican (la regla de la 102). Fuera, `intervaloInocuo1`.
- **Contra la 105:** las 510 dan lo mismo (376 caen, 134 pasan; 0 distintas). Dos (`salta275bpt`,
  `salta292bpt`) no son de un `prep` entero ni hoy ni en la 105 (saltan una prueba).
- **Las de los agentes:** 83 iguales a la salida de su worktree. La distinta,
  `patad6ba69+cedeConTimeoutEnNota0`: en el worktree de A1 caía además `R9-310` (`aTiempo`), y aquí no;
  solo apoya «quién abrió `R9-374`».
- **El suite** (`--maxWorkers=4`): ver `R9-373` y `R9-377`.

## 4. Lo que queda

- **Nuevo, sin arreglar:** `R9-373`..`R9-380`, más `R9-367`..`R9-371` (de la 105; `R9-370`, decidido).
- **Del Pendiente, sin tocar:** `R9-330` (decidido); la cabecera de `prepMultiSet` (`R9-327`); lo que
  queda de `R9-347`; el daño de `R9-369` en el respaldo.
- **Sin medir, de los agentes:** `mockSqlite.retenida` como control compartido entre pruebas; el daño
  de `R9-377` con un respaldo sin series; `notasPideDosVeces` en la lectura; el suite de `R9-374`,
  `R9-376`, `R9-378` y `R9-380`; `intervaloInocuo1`.

## 5. Las lecciones

- **Un control de «nada pendiente» pregunta qué pasa si no contó nada** (`R9-376`). La espera de Cata
  sale cuando ningún pedido contado está pendiente; con el registro vacío (un cambio bueno que el filtro
  no ve), sale en la primera vuelta y dice `true`. Es la regla de la 73 en el control que la 105 agregó
  después de su matriz.
- **Una herramienta que corre «lo pendiente» una vez por vuelta tiene un corte en eslabones**
  (`R9-373`). Mil vueltas corren mil eslabones de una cadena; la frase decía «o en cadena» sin el
  número. Es la regla de la 74 en la herramienta de la 105.
- **«Lo que el trabajo programa vence aquí» pregunta qué pasa con lo que el trabajo ESPERA** (`R9-374`).
  Con el reloj falso puesto antes, una prueba que espera el trabajo antes de dar tiempo se traba con
  cualquier temporizador que el trabajo espere.
- **`resetModules` no reinicia lo que la fábrica de un mock cierra del archivo de prueba** (`R9-375`).
- **Un control que se calcula y no se compara no vigila** (`R9-379`). La 105 lo movió y escribió que se
  movió; el `expect` de esos casos no lo lee.
- **Antes de llamar «cambio bueno» a una pieza, preguntá si abre en la app una ventana que el código
  bueno no tiene** (`respaldoVueltaEntreClaves`). Una vuelta entre dos pasos que hoy van en la misma
  tanda de microtareas deja entrar un estado.

## 6. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s106`, mientras la matriz corría en el principal; pasado al
  principal con un parche (`_scratch/S106-docs.diff.txt`) y commiteado ahí, con el hook.
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"`, y `npm run validate` con
  `NODE_ENV=development`, sin worktrees de agentes (`_scratch/S106-validate.out.txt`): exit 0.
  Typecheck limpio, lint con 0 errores (los 70 avisos de siempre), `format:check` limpio, y jest
  374/374 suites y 4672/4672 pruebas (los mismos totales que la 105: solo docs).
- **El mensaje de la 107** está en `_scratch/S107-PROMPT.md`.
