# Sesión 99 — arreglo de lo de la 98 (2026-10-14)

En un chat nuevo, en la terminal, con 12 agentes en worktree que solo midieron (Victor pidió 15, después
12), con el mensaje de `_scratch/S99-PROMPT.md`. Arregla `R9-342`..`R9-345` y, a pedido de Victor
(«avanzar mucho más»), los pendientes de la 98: `R9-340`, el residuo de `R9-343` (el control `fallo`),
«the joins, nothing» y la dirección inversa de `R9-344`. `R9-330` no se tocó (§7).

- **Estado al empezar:** `main` = `origin/main` = `08da00b` (la 98, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `38529167216`, 3 jobs, Node v24.21.0, 374/4648). Comprobado con
  `git fetch` y `git log -1 origin/main`. Los docs decían «sin mergear» para la 98: corregido aquí.
- **Ramas:** `fix/s99-arreglos-s98` (`54bb2f3`, `5aa5c96`) y `docs/review-s99-fix` encima, sin
  mergear hasta el OK de Victor.
- **Resultado:** cerrados `R9-340`, `R9-342`, `R9-343`, `R9-344` y `R9-345`, y dos nuevos que se
  midieron y se arreglaron en la misma sesión: `R9-346` (8 de las 12 partes del trabajo del primer
  estado sin caso) y `R9-347` (`R9-345` en cada llamador de `prepKey`: ninguno tenía caso; queda la
  lectura de tres stores y exportar). Quedan 347 hallazgos, ningún P0.

## 0. Cómo se trabajó

- **El orden cambió a pedido de Victor.** El mensaje decía «los arreglos primero, después los
  agentes». Victor pidió 15 y, ya empezada la lectura, 12 enseguida («era mi estrategia para jugar 2
  resets de 5 hrs»). Los 12 se lanzaron sobre `08da00b` ANTES de escribir los arreglos: cada uno armó
  en su worktree, sin commitear, el diseño que le dio el orquestador, lo midió (y lo atacó), y dejó su
  diff en `S99-aN-diseno.diff.txt`. Los arreglos los escribió el orquestador, uno solo, con eso.
- **Antes de lanzarlos se le recordó a Victor la 37 y la RAM** (AskUserQuestion): eligió 15 y el
  alcance ampliado; después pidió 12.
- **Reparto:** A1 `R9-342`; A2 `R9-343` (armar) y A3 (romper); A4 `R9-344` (armar) y A5 (romper);
  A6 las pruebas de `R9-345`; A7 sus comentarios; A8 `R9-340` por aislamiento de módulos y A9 por
  generación en `src/`; A10 «the joins, nothing»; A11 todas las partes del trabajo del primer estado;
  A12 `R9-345` en cada llamador de `prepKey`.
- **`--maxWorkers=2` en `prep`** (12 a la vez), el suite a lo sumo una vez por agente. Con 11 jest
  corriendo quedaban 14 GB libres de 31,8; no hubo `EPERM`.
- **Herramientas:** `S99-copiar.cjs.txt` (fuente `S98-sonda`, prefijo `S99-aN-`, N hasta 15, y copia
  al worktree los `.ts.txt` que leen las piezas: sin ENOENT), `S99-gen.cjs.txt` (la `S99-sonda` en el
  principal, con las piezas `// S99-o` de `S99-propias.txt` y las de los 12), `S99-matriz.cjs.txt`,
  `S99-igual.cjs.txt` (la 65 con archivos por argumento), `S99-reemplaza`, `S99-pega` y `S99-hunk`
  (pegar bloques medidos por los agentes sin escribirlos a mano).
- **Los 12 completaron.** El agente 8 lo cortó el límite de sesión con su matriz ya terminada; el
  chat entero quedó en el límite hasta el reset (4:10 pm). Victor dijo «continúa» a las 4:38; se lo
  retomó con `SendMessage` (su worktree estaba limpio salvo su diseño) y cerró en 5 llamadas.

  | agente | tarea                     | tokens | llamadas     | min |
  | ------ | ------------------------- | ------ | ------------ | --- |
  | 1      | `R9-342`                  | 306k   | 30           | 7   |
  | 2      | `R9-343` armar            | 297k   | 28           | 5   |
  | 3      | `R9-343` romper           | 314k   | 21           | 7   |
  | 4      | `R9-344` armar            | 295k   | 25           | 5   |
  | 5      | `R9-344` romper           | 319k   | 20           | 7   |
  | 6      | `R9-345` pruebas          | 310k   | 25           | 8   |
  | 7      | `R9-345` comentarios      | 303k   | 32           | 6   |
  | 8      | `R9-340` aislamiento      | 320k   | cortado, + 5 | —   |
  | 9      | `R9-340` generación       | 325k   | 21           | 8   |
  | 10     | «the joins, nothing»      | 318k   | 30           | 8   |
  | 11     | partes del primer trabajo | 305k   | 27           | 7   |
  | 12     | `R9-345` por llamador     | 307k   | 23           | 7   |

- **Worktrees:** los de A11 y A12 se borraron solos (copias de 37 y 41 archivos, lo que dijeron); los
  otros 10 quedaron con su diseño sin commitear: `diff -rq` de cada `_scratch` contra su copia, vacío,
  sin junction, y `git worktree remove --force` + `git branch -D`.

## 1. Lo que los agentes vieron en los diseños del orquestador

Cinco de los diseños que se les dio tenían un verde falso o un hueco, medido, y se corrigieron antes
de commitear (re-medidos en el principal, `S99-remide-1.out.txt` y `S99-remide-2.out.txt`):

- **`R9-342`, D1 (`of` en el pedido):** cerraba el caso, pero con un tercer argumento prettier
  re-sangra todo `prepMultiSet` y rompe las anclas de las piezas que lo tocan; y la etiqueta del
  respaldo quedaba sin ninguna prueba que la leyera (`sinEtiquetaRespaldo2` pasaba, agente 1). Se
  cambió a D1b: un número por arreglo `pairs` dentro de la etiqueta, y el gancho la lee.
- **`R9-343`, D2 (aviso y contenido):** un ajeno del MISMO paso, delante, se lleva la falla con el
  mismo aviso (`notaMismoPaso343`, `migraMismoPaso343` pasaban, agente 3). Primero se agregó contar
  las llamadas de la clave en la corrida que falla, y `migraMismoPaso343` siguió pasando: su llamada
  ajena, al fallar, corta el paso (`return`) antes de la parte. Se cuenta en una corrida LIMPIA
  (`5aa5c96`): cae. Y el caso del dueño faltaba (`migraDuenoSale`, agente 2).
- **`R9-344`, D3:** el control se leía al final: con la devolución más lenta que la espera
  (`giveBackTarde1005`) y la regresión, pasaba (agentes 4 y 5). Se lee al llegar el otro estado. Sin
  la unión de la migración, `claveTrasUnionMigracion344` pasaba (agente 5); con una sola devolución,
  `claveTrasPrimeraDev` (agente 7); sin devoluciones, `claveTrasMigrar` con el estado durante la
  lectura de la nota (agente 7).
- **`R9-345`, D4:** tres verdes falsos (agente 6): `alLlegarTrasMigrar` pasaba (las dos pruebas
  retenían la migración), y con el store o la lectura más lentos que la espera, la regresión pasaba
  (`escrita` y `leido` no leen la clave). Se pide además la clave directa, y hay un caso durante la
  devolución.
- **La frase de `prepKey` (D5):** «(R9-331: the migration and the give-backs, R9-344)» admitía
  `claveTrasUnionDev` y `claveTrasPrimeraDev` (pasaban el suite y mezclaban cuentas), y «the state
  that came does not make it known» no tenía antecedente (agente 7). Se usó su oración.

## 2. Los arreglos

`54bb2f3` y `5aa5c96`. `src/`: la etiqueta del respaldo con su número y el gancho
`__prepThisRestoreWaitingForTests` (lo único que no es comentario: `S99-igual` lo dice así), y los
comentarios de `prepKey`, la cabecera, `managePrepAccount`, `prepWrite` y `AuthContext.tsx` (este,
solo comentarios: TODOS IGUALES contra `08da00b`; control contra `a85df96~1`: HAY DIFERENCIAS).

| hallazgo | qué                                                       | cae con (re-medido en el principal)                                                        |
| -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `R9-342` | el gancho lee ESTE respaldo (número por arreglo)          | `goneAlPedirTarde1` con y sin los dos ajenos de la clave                                   |
| `R9-343` | 13 partes, control por contenido y corrida limpia         | cada `sale<Parte>`, `migraMismoPaso343`, `notaMismoPaso343`                                |
| `R9-344` | el estado durante la última parte, en los dos sentidos    | `claveTrasMigrar`, `…TrasUnionDev`, `…TrasPrimeraDev`, `…TrasUnionMigracion344`            |
| `R9-345` | lo pedido durante el trabajo: 4 stores, lectura, respaldo | `claveConocidaAlLlegar`, `alLlegar*`, `llegarEscribe*`, `llegarLeeNotas`, `llegarRestaura` |
| `R9-340` | módulos y almacén propios por prueba                      | `sinAislar340`, `soloModulos340` (las dos que lo vigilan)                                  |
| joins    | una unión de la clave no cuenta como su escritura         | `conClavesE99`, `unionConClave`                                                            |

Y pasan con los cambios buenos: `respaldoPideTarde1+ajenoMismaClaveNeutro298`,
`ajenoMismaClaveNeutro298`, `lecturaLenta3000`. `prep` 56/56; suite relacionado 125/125, 1037/1037.

## 3. La matriz

`S99-matriz.cjs.txt`: 240 corridas en `prep` sobre `5aa5c96` (las 191 de la 96, las de la 97 y la
98, con las `…E` en lugar de `devuelveFueraDelTurno` y `devuelveAntes`; sin `migraCuelga336`, que
cuelga 20 s cada caso de la migración), contra las del agente 3 de la 98 sobre `5ee4460`
(`S99-matriz-comparar.out.txt`). Ninguna corrida dejó el árbol sucio.

- **99 caen igual y 64 pasan igual.** 8 no aplican hoy: las 5 de siempre (`ajenoR327`,
  `ajenoR327+devuelveFueraDelTurnoE`, `porEntradaSolo`, `porEntradaAuto+editaTrasAdoptar`,
  `ajenoTrasRespaldo298`) y las que anclaban al gancho reemplazado (`etiquetaSinClaves`, sus
  combinación, y `conClavesE`, re-anclada como `conClavesE99`). A 10 de la 98 les falta la corrida
  del agente (eran piezas de la 98, medidas aparte).
- **Cambia si caen, 3:** `viejoReanudaA3` deja de caer (es el caso que cierra `R9-340`).
  `soloDetras` (el gancho de las escrituras mira solo el primero de la cola) ahora cae, en el control
  de la prueba nueva de las uniones (`pedida: 1 → 0`): una prueba más estricta. `cuentaRelojes` (el
  instrumento de la 86: nadie lee la fecha durante la hora de reloj falso) ahora cae en la escritura
  de `R9-345`, porque tres stores leen `Date.now` al pedirlos (5 lecturas, ningún temporizador
  pendiente): rompe el supuesto del instrumento, no es una regresión.
- **Las 56 restantes caen las dos, con otras pruebas.** Lo que cae hoy y no en la 98 son solo las
  pruebas nuevas, y los títulos de `R9-336`, que cambiaron. Lo que caía en la 98 y hoy no:
  - el arrastre que corta el aislamiento: «R9-328: si falla la unión…» tras una prueba colgada
    (`multiSetTarde1005`, `notaTarde1005`, `respaldoTurnoTarde1005`…), y con `turnoAntesDeClave` 8 en
    vez de 15;
  - `R9-298` con las combinaciones de `devuelveFueraDelTurnoE`: en la 98 era el artefacto de la
    re-ancla sin etiqueta (la 98 ya medía que la `…E` tumba solo `R9-327`).
- **Ninguna regresión que caía deja de caer,** salvo `viejoReanudaA3`, a propósito.

## 4. Lo que queda

- **`R9-347`, en parte:** sin caso, la lectura de series, ilustraciones y autoevaluación
  (`llegarLeeSeries` pasa; las otras dos, por lectura, igual) y exportar (`llegarExporta` pasa; el
  archivo sale sin lo de antes, sin pérdida en el teléfono).
- **`backupPrepTurn.test.ts` sin aislamiento** (por lectura del agente 8, sin medir): la misma forma
  que `R9-340`. El caso nuevo de `R9-345` está ahí.
- **El número de la etiqueta** no lo vigila ninguna prueba sola (`sinNumero342` pasa; con el ajeno y
  la regresión cae igual por el `has`).
- **Del Pendiente, sin tocar:** `R9-330` (decidido), `R9-333`, la cabecera de `prepMultiSet`,
  `ajenoDev298`, `:868`/`:1160`, el dueño de `migrateLegacyPrep`, `notaLenta50`,
  `respaldoPideTarde20`. `muereTrasEscribir`: el aislamiento corta su arrastre en
  `prepAccount.test.ts` (medido de forma indirecta por el agente 8).

## 5. Las lecciones

- **Medir los diseños antes de escribirlos rindió.** Con los agentes lanzados antes del commit, cada
  uno sobre un diseño concreto, cinco de esos diseños tenían un verde falso o un hueco, medido, y se
  corrigieron antes de escribir la rama. Es la regla de la 60 antes del commit. Medido (§1).
- **Las llamadas de una clave se cuentan en una corrida limpia.** En la corrida que falla, una
  llamada ajena que al fallar corta el paso esconde la parte (`migraMismoPaso343`). Medido.
- **Un argumento nuevo en una llamada con una función larga re-sangra todo su cuerpo** con prettier,
  y rompe las anclas de las piezas: el dato fue a un argumento que ya estaba. Medido (agente 1, modo
  `anclas`).
- **Para «cuándo se toma un valor», se retiene la ÚLTIMA parte del trabajo.** Una en el medio ve
  solo las regresiones de antes de ella (`claveTrasUnionDev` pasaba reteniendo la unión). Medido.
- **La regla de la 93 vale para todo llamador:** el único camino con pérdida (restaurar) no tenía
  caso. Medido (agente 12).
- **Un hueco de las pruebas se cierra en las pruebas:** el aislamiento de módulos corta `R9-340` sin
  producción; el mock de `jest.setup.js` es uno solo, y sin pedir uno nuevo el almacén se comparte
  (`soloModulos340`). Medido.
- **De herramientas:** en Git Bash, un argumento que empieza con `//` se convierte en ruta
  (`MSYS_NO_PATHCONV=1`); y un checkpoint escrito mientras corre la matriz va en un worktree aparte,
  porque la sonda mira `git status`.

## 6. El checkpoint

Los docs se escribieron en un worktree aparte (`../essb-docs-s99`, sobre `5aa5c96`) mientras la
matriz corría en el principal, y se pasaron al principal al terminar. `npx prettier --write
"DOCS/REVIEW_2026-09/**/*.md"` y `npm run validate` con `NODE_ENV=development`
(`_scratch/S99-validate.out.txt`), sin worktrees de agentes: exit 0. Typecheck limpio, lint con 0
errores (los 70 avisos de siempre), `format:check` limpio, y jest 374/374 suites, 4665/4665 pruebas
(17 más que en la 98). El mensaje de la 100 está en `_scratch/S100-PROMPT.md`.
