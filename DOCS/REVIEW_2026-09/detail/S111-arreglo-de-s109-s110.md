# Sesión 111 — arreglo de lo de la 109 y la 110 (2026-10-27)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S111-PROMPT.md` y 5 agentes en worktree que
midieron los diseños antes de escribirlos (los pidió Victor: «Podrías mandar 5 agentes para avanzar más?»).
Cerrados `R9-388`..`R9-400`, todos en las pruebas; cinco nuevos (`R9-401`..`R9-405`), ninguno P0: uno es
la gemela de un arreglo en otras bases, y cuatro son los costos medidos de los arreglos. Quedan 405
hallazgos.

- **Estado al empezar:** `main` = `origin/main` = `ef81827` (la 110, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `40561648671`, 374/4687). Comprobado con `git fetch` y
  `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar. Los docs decían
  «sin mergear» para la 110: corregido aquí.
- **Ramas:** `fix/s111-arreglos-s110` (solo `__tests__/`) y `docs/review-s111-fix` encima, sin mergear
  hasta el OK de Victor.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S111-gen.cjs.txt` (de `S110-gen`, armada por `S111-hacer-gen.cjs.txt`): la `S111-sonda.cjs.txt` desde
    `S110-sonda.cjs.txt`, con las piezas de `S111-propias.txt` (vacío) y las de las copias de los agentes;
    con `<raíz del worktree> <N>` arma la sonda de cada agente. Probada en modo `anclas` antes de lanzar:
    las 57 piezas del ledger de la 110 aplican, árbol limpio.
  - `S111-matriz.cjs.txt` (de `S110-matriz`, armada por `S111-matriz-hacer.cjs.txt`): primero
    `S111-matriz-extra.txt` (las listas de los agentes, armada por `S111-extra-hacer.cjs.txt`: 186), después
    las corridas de los agentes, y la lista entera de la 110 (`S110-matriz-todas.txt`, 1136).
    `S111-ver.cjs.txt` muestra el resumen de una lista de corridas.
- **Los agentes:** 5 `fork` con `isolation: "worktree"`, nacidos en `ef81827`, lanzados en cuanto
  `S111-gen` pasó `anclas`, con `--maxWorkers=3` y las reglas comunes en
  `_scratch/S111-agentes-reglas.md.txt` (con el Pendiente del mensaje copiado, la regla de la 110). Las 13
  entradas, juntadas por prueba: A1 las filas de la mudanza (`R9-391`, `R9-392`, `R9-398`); A2 los casos
  sin dueño y el turno (`R9-393`, `R9-399`); A3 el «de quién» de la escritura (`R9-388`, `R9-394`); A4 el
  respaldo (`R9-389`, `R9-390`, `R9-395`, `R9-397`); A5 la espera de Cata y la frase de `vueltasYReloj`
  (`R9-396`, `R9-400`). Cada prompt dijo quién más tocaba la misma prueba (A3 y A5 en la escritura de
  `R9-345`; A4 y A5 en el respaldo).
  - Completaron los cinco sin cortes (219-276k tokens, 40-69 llamadas: todos pasaron el tope de ~25; 7-16
    min). Ninguno se borró solo (diseño sin commitear): `git diff` del worktree igual al guardado, su
    `_scratch` igual a la copia, y `remove --force --force` + `branch -D`.
- **La integración:** los cinco diffs con `git apply --3way` en serie. Uno chocó: A4 y A5 reescribían el
  mismo comentario del respaldo (la espera de Cata); se juntó a mano (las frases de A4 sobre `resuelto` y la
  de A5 sobre el guarda). Con todo junto, `prep` 79/79, prettier, eslint y `tsc` limpios. Los commits, de a
  uno por agente, reproduciendo la serie: `25ce228` (A1), `9cd06d0` (A2), `23f9b2d` (A3), `4020b19` (A5),
  `56c7d33` (A4, con el comentario juntado); la punta, igual byte a byte a lo integrado.
- **La verificación:** las 186 corridas de los agentes, primero en la matriz, sobre la punta. Cada prueba
  nueva cae con las piezas de su entrada y pasa con la prueba de `4839952` (`pat4839952`/`bpt4839952`). Los
  números van en cada entrada de `BUGS.md`.

## 1. Las entradas

- **`R9-391`, `R9-392`, `R9-398`** (A1, `25ce228`): las cinco filas sin dueño con `ana` siembran las cuatro
  bases (`antesCuatro`); una fila nueva hace fallar la lectura de destino; la frase de disco entero dice
  que la marca no se intenta. Las nueve regresiones de la mudanza de `R9-383` siguen cayendo (agente 1).
  Las gemelas por base que pasaban (`mueveSaltaIlus111`, `mueveSaltaAuto111`) caen. Queda `R9-401`.
- **`R9-393`, `R9-399`** (A2, `9cd06d0`): la marca de la mudanza retenida sin devoluciones, con dos casos de
  tres estados; el turno ocupado por un `prepWrite` ajeno en la de `R9-370`, con su control. Los cortes no
  bajan (`mueveLenta990` pasa y `1010` cae, como con la prueba de antes). El costo del control: `R9-402`.
- **`R9-388`, `R9-394`** (A3, `23f9b2d`): el diseño D1, por la función que escribe la base
  (`AsyncLocalStorage`), elegido entre varios medidos juntos; pasan todos los cambios buenos pedidos y caen
  todas las regresiones pedidas. Sus costos: `R9-403`.
- **`R9-389`, `R9-390`, `R9-395`, `R9-397`** (A4, `56c7d33`): el diseño D', la cadena a `src/` y el pedido
  por la clave que escribe y nadie lee. «Desde `importBackup`» no sirve: el marco no tiene el nombre de la
  función (`marcoA4`). Sus costos: `R9-404`.
- **`R9-396`, `R9-400`** (A5, `4020b19`): la espera de Cata sin tope en vueltas mientras sigue el trabajo,
  con un guarda de diez segundos (corte entre 9 y 11 s); la frase de `vueltasYReloj`, en vueltas. La gemela
  en la devolución deja ver `R9-405`.
- **Los dos diseños en la misma prueba** (la regla de la 109): las corridas de A3 y de A4 sobre la punta
  llevan puesto el cambio de A5, y las de A5 los de A3 y A4. Todas dan lo mismo que en su worktree, salvo
  dos que suman una caída (abajo).

## 2. Lo nuevo

| hallazgo | qué                                                                                    | la pieza                                                                              | agente  |
| -------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------- |
| `R9-401` | las filas de la mudanza fallan solo las lecturas de notas                              | `mueveDestinoToleranteIlus111`, `mueveFuenteToleranteSeries111`                       | A1      |
| `R9-402` | el control del turno ocupado cae ante tres cambios buenos del gancho                   | `ganchoSoloEtiquetadasA2`, `mueveEtiquetadaA2`, `alPedir`                             | A2, mat |
| `R9-403` | el «de quién» por la función que escribe: un control aflojado, un rojo, un verde falso | `noMueveDescartaSeries111`, `notasEscribeFueraDelContexto111`, `ajenoEscribeNotas111` | A3      |
| `R9-404` | el respaldo por la clave que nadie lee: dos verdes falsos de control y rojos           | `ajenoSinLeerDesdeRespaldo111A4`, `ajenoNotasTrasAbrir358D`                           | A4, mat |
| `R9-405` | una devolución que espera un temporizador real tumba `R9-292` y `R9-275`               | `devUnionTimeout<MS>A5`                                                               | A5      |

- **Abiertos por la 111, a sabiendas:** `R9-402`, `R9-403`, `R9-404` (salvo el lector tras abrir, que vio
  la matriz). `R9-401` y `R9-405` ya estaban con la prueba de antes.
- **Sin daño medido** en ninguno: son rojos ante cambios buenos o verdes falsos que, en los casos de hoy,
  ven otras pruebas o no tienen daño.

## 3. La matriz

- **Qué corrió:** `S111-matriz.cjs.txt correr` sobre `56c7d33`, 1239 corridas en `prep` con
  `--maxWorkers=3` (`S111-matriz-correr.out.txt`; ninguna dejó el árbol sucio): las 186 de la verificación,
  las 202 de los agentes (casi todas las mismas), 3 piezas sin corrida sola de agente y las 1136 de la 110.
  Contra la 110 y contra el worktree de cada agente (`S111-matriz-comparar.out.txt`).
- **De las comparadas con la 110:** 818 dan lo mismo (595 caen, 223 pasan) y 85 cambian el conjunto de lo
  que cae, casi siempre sumando los casos nuevos. **Siete cambian si caen:**
  - `ajenoMismoModuloSeriesA3`, `ajenoSeriesPorNotasA3`, `ajenoMismoModuloIlusA3`, `ajenoMismoModuloAutoA3`
    solos (sin la regresión): antes caían en los 6 porque contaban de más; ahora pasan. Un ajeno que no
    escribe no es de ningún store: lo que pide D1.
  - `alPedir` (de la 92, un cambio bueno del gancho): ahora cae en los dos casos del turno (`R9-402`).
  - `ajenoNotasTrasAbrir358D` (un cambio bueno: los stores leen notas y series tras abrir) y
    `muestraSeries353` (una prueba-sonda que imprime adónde fue lo restaurado): ahora caen en los 6 del
    respaldo por `pidio: false` (`R9-404`). Ningún agente lo midió.
- **Lo que deja de caer en alguna prueba** («solo antes»), además de esos cuatro: los cambios buenos de la
  clase de `R9-388` (`notasPideEnThen`, `notasResuelveAntes`, `notasPideTarde2000`) ya no caen en los 6;
  `noMueveDescartaNotas` (con `sondaDevEscritura` o `tardeClave2000`) ya no cae en los 4 de `R9-345`
  (`R9-403`); y `patad6ba69+cedeConTimeoutEnNota0`, la carrera de reloj de `R9-310` de siempre.
- **No aplican 132:** las 117 de la 110 y 15 nuevas: las de `espiaCadena110A5` (7: es lo que hace D'), las
  de `soloUsadaA6` y `soloMarcoA6` (5: el filtro ya no está), y tres que solo imprimen (`marcoA4`,
  `muestraPilaA3`, `muestraControl366`). Dos no son de un `prep` entero (`salta275bpt`, `salta292bpt`).
- **Las de los agentes:** 199 iguales a su worktree; dos suman una caída sobre lo integrado
  (`mudanzaMarcaAntes108`, que ahora ve también el caso nuevo de `R9-393`, y
  `tardeClave2000+pideYDescarta`, que ve también los del turno de `R9-399`); tres piezas de A4 que él corrió solo
  combinadas pasan solas (79/79).
- **Fuera de las entradas** (A5): con la migración 150000 vueltas más lenta (`migraLenta150000`, un cambio
  bueno) caen `R9-344`, tres filas de `R9-343`, `R9-370` y `R9-320` por sus propias esperas en vueltas; los
  de `R9-345` ya no. No se numera: son los cortes de esas esperas, y el de `R9-343` está escrito (`R9-373`).

## 4. Lo que queda

- **Nuevo, sin arreglar:** `R9-401`..`R9-405`.
- **Sin medir:** el daño de `R9-401` en esas bases; las filas con dueño (`conDueno`), que siguen sembrando
  solo notas; si el lector tras abrir de `R9-404` cae por descontar el pedido del respaldo o por otra cosa;
  el guarda de `R9-396` con más carga; el espejo de tres estados de `uniendoAnaYNulo`.
- **Del Pendiente, sin tocar:** `R9-330` (decidido); la cabecera de `prepMultiSet` (`R9-327`); lo que queda
  de `R9-347`; un `giveBack` ajeno entre la nota y la mudanza; qué cambio bajó el corte de `R9-373`; un
  verde falso de `mockSqlite.retenida`; el daño de `R9-377` con un respaldo sin series; `notasPideDosVeces`
  en la lectura; `intervaloInocuo1`.

## 5. Las lecciones

- **Entre diseños con costos, se elige por quién más ve cada costo** (`R9-403`): D1 deja un verde falso
  (un ajeno que escribe la misma base) que ven otras seis pruebas; la variante que lo cerraba tumbaba los 6
  con un cambio bueno. Se escribe el costo elegido y el descartado, cada uno con su pieza.
- **Sin envoltorio, el «de quién» pasa a lo que se hace con el valor** (`R9-404`): con la cadena, el
  ayudante y un ajeno del mismo marco piden igual, y solo los separa leerla. Es la regla de la 107 del otro
  lado: cerrar el costo de un espía abre el de la regla contraria.
- **Un control nuevo que lee un gancho de la app tiene los cambios buenos del gancho** (`R9-402`): la
  regla de la 82, con la lectura de su comentario al pie de la letra; dos los midió el agente, el tercero
  (`alPedir`, de la 92) lo trajo la matriz.
- **La matriz ve lo que un agente no corrió** (`R9-404`): el lector tras abrir y la prueba-sonda que
  imprime eran piezas viejas que ningún agente eligió; sobre lo integrado, cayeron por el mismo control.
- **Al sembrar cada base, la falla va también a cada base** (`R9-401`): la regla de la 109 entre stores,
  en las filas que pidió la 110.

## 6. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s111`, mientras nada corría en el principal; pasado al principal
  con un parche (`git add -N` antes del `diff`, la lección de la 110) y commiteado ahí, con el hook.
- **Antes de cerrar** (la regla de la 102): las piezas del ledger (las 186 de `S111-matriz-extra.txt` y las
  57 de `S110-matriz-extra.txt`) en modo `anclas` sobre `56c7d33`: 243, aplican todas salvo las 3 de
  `espiaCadena110A5` (lo que hace hoy la prueba), árbol limpio (`S111-anclas-cierre.out.txt`).
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` en el principal, y
  `npm run validate` con `NODE_ENV=development`, sin worktrees, en primer plano
  (`_scratch/S111-validate.out.txt`): typecheck limpio, lint con 0 errores (los 70 avisos de siempre),
  `format:check` limpio y jest 374/374 suites y 4688/4688 pruebas (una más: la fila de `R9-391`).
- **El mensaje de la 112** está en `_scratch/S112-PROMPT.md`.
