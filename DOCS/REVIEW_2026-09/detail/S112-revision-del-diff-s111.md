# Sesión 112 — revisión del diff de la 111 (2026-10-27)

En un chat nuevo, en la terminal, con el mensaje de `_scratch/S112-PROMPT.md` y 5 agentes en worktree que
solo midieron (los pidió Victor: «Podrías mandar 5 agentes?»). La revisión de `ef81827..56c7d33` (solo
pruebas), y **la ÚLTIMA vuelta del ciclo de las pruebas de la Mesa** (la decisión de Victor del
2026-10-27, escrita en la §7 de `CONTINUAR.md`). Cuatro nuevos (`R9-406`..`R9-409`), ninguno P0; tres con
daño medido en una prueba-sonda, que la 113 arregla, y nada más del ciclo. Quedan 409 hallazgos.

- **Estado al empezar:** `main` = `origin/main` = `741f6f0` (la 111, mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `40589890000`, 374/4688). Comprobado con `git fetch` y
  `git log -1 origin/main`; `main` no era más nuevo, así que el CI no se volvió a mirar. Los docs decían
  «sin mergear» para la 111: corregido aquí.
- **Rama:** `docs/review-s112-diff-s111` (solo docs), sin mergear hasta el OK de Victor.

## 0. Cómo se trabajó

- **Herramientas** (en `_scratch`):
  - `S112-gen.cjs.txt` (de `S111-gen`, armada por `S112-hacer-gen.cjs.txt`): la `S112-sonda.cjs.txt` desde
    `S111-sonda.cjs.txt`, con las piezas de `S112-propias.txt` (vacío) y las de las copias de los agentes;
    con `<raíz del worktree> <N>` arma la sonda de cada agente. Probada en modo `anclas` antes de lanzar:
    las 186 piezas del ledger de la 111 aplican, árbol limpio.
  - `S112-matriz.cjs.txt` (de `S111-matriz`, armada por `S112-matriz-hacer.cjs.txt`, que arma también
    `S112-extra-hacer.cjs.txt`): primero `S112-matriz-extra.txt` (las listas de los agentes: 82), después
    sus corridas, y la lista entera de la 111 (`S111-matriz-todas.txt`, 1239).
- **Los agentes:** 5 `fork` con `isolation: "worktree"`, nacidos en `741f6f0`, lanzados en cuanto
  `S112-gen` pasó `anclas`, con `--maxWorkers=3` y las reglas comunes en
  `_scratch/S112-agentes-reglas.md.txt` (con el corte de Victor primero: medir el DAÑO de cada verde falso;
  y el Pendiente copiado, cruzado antes contra cada mirada). Las miradas, las del mensaje: A1 el «de quién»
  de la escritura (D1, `23f9b2d`); A2 el respaldo (D', `56c7d33`); A3 los comentarios del diff; A4 la
  espera de Cata sin tope (`4020b19`); A5 las filas de la mudanza y los casos de `R9-344` y `R9-370`
  (`25ce228`, `9cd06d0`).
  - Completaron los cinco sin cortes (206-252k tokens, 24-57 llamadas; 6-19 min). Los cinco worktrees se
    borraron solos con sus ramas (sin cambios); sus copias están en `_scratch/S112-sondas-agente-N/`.
- **La verificación en el principal:** los tres verdes falsos con daño, primero
  (`_scratch/S112-remedir1.out.txt`, 18 corridas, y el suite de las cuatro regresiones,
  `S112-suite-dano.out.txt`); después la matriz entera, con las 82 corridas de los agentes al frente.

## 1. Lo que encontró cada mirada

- **A1, el «de quién» de la escritura:** un verde falso con daño, que D1 no puede ver (`R9-408`: la
  escritura que sale del turno hereda el contexto de la llamada). Y dos costos de D1 que no estaban en
  `R9-403` (una función que escribe dos bases, una escritura lanzada que llega antes de la lectura final),
  más el ajeno de la misma base en las otras tres bases, que ve solo `R9-325` (nota en `R9-403`).
- **A2, el respaldo:** ninguna regresión pasa `prep`. La causa del lector tras abrir, medida moviendo una
  cosa por vez: cada lectura descuenta el pedido MÁS VIEJO de su clave, que es el del respaldo. Tres
  cambios buenos más que tumban los 6 (nota en `R9-404`).
- **A3, los comentarios:** ninguna frase, seguida al pie de la letra, deja pasar una regresión con daño.
  Cuatro frases P3 bajo (`R9-409`); la del descuento, medida como pieza (`descuentaUltimo112`), confirma
  la causa de A2.
- **A4, la espera de Cata:** sin verde falso. El arreglo lee «el trabajo» por la promesa de la primera
  llamada; con un cambio bueno que no la espera, vuelve el rojo de `R9-396` (nota en `R9-396`). El guarda
  aguanta 9,5 s con los otros cuatro agentes corriendo.
- **A5, las filas y los casos:** dos verdes falsos con daño (`R9-406`, `R9-407`), y una nota en `R9-402`
  (el control `retenida` cuenta cualquier pedido sin etiqueta).

## 2. Lo nuevo

| hallazgo | qué                                                                                          | la pieza                                   | daño                                  | agente |
| -------- | -------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------- | ------ |
| `R9-406` | sin dueño ni devoluciones, ningún caso termina con el último estado distinto del primero     | `primeroSiVariosEnMudanza112`              | sí: mezcla de cuentas (`danoA5`)      | A5     |
| `R9-407` | con dueño, ninguna prueba siembra ilustraciones ni autoevaluación en la Mesa de antes        | `migraSaltaIlus112`, `migraSaltaAuto112`   | sí: base marcada sin mover (`danoA5`) | A5     |
| `R9-408` | la escritura de un store que sale de su turno pasa en series, ilustraciones y autoevaluación | `seriesEscribeSinEsperar112` y sus gemelas | sí: serie fuera de la Mesa de Ana     | A1     |
| `R9-409` | cuatro frases del diff de la 111 dicen más o menos de lo que hace la prueba                  | `descuentaUltimo112`                       | no                                    | A3     |

- **Ninguno lo abrió la 111:** las tres regresiones con daño pasan también con la prueba de antes
  (`pat4839952`, 78/78). Son gemelas de arreglos viejos en el camino que el arreglo no tocó: la forma de
  `R9-351` en la mudanza, `R9-392` con dueño, `R9-269` en los otros stores.
- **Re-medido en el principal** (`S112-remedir1.out.txt`): `nada` 79/79; `danoA5` 81/81 y
  `danoSalidaTurnoA1` 80/80 con el código bueno; las regresiones solas, 79/79; con su prueba-sonda, 80/81
  (`danoDosEstadosMarca` con `John/3/16-21` fuera de su Mesa; `danoConDuenoBases` con
  `@prep_illustrations` en la «sin cuenta») y 79/80 (`seriesDuranteAdopcion`, con `sinCuenta: ['durante']`).
- **Las notas en entradas viejas** (costos conocidos, sin daño): `R9-396` (A4), `R9-402` (A5), `R9-403`
  (A1) y `R9-404` (A2, A3).

## 3. La matriz

- **Qué corrió:** `S112-matriz.cjs.txt correr` sobre `56c7d33` (la 112 no cambia código), 1312 corridas en
  `prep` con `--maxWorkers=3` (`S112-matriz-correr.out.txt`; ninguna dejó el árbol sucio): las 82 de la
  verificación (las listas de los agentes), una más de sus salidas y las 1239 de la 111. Contra la 111 y
  contra el worktree de cada agente (`S112-matriz-comparar.out.txt`).
- **Las de los agentes:** las 83, iguales a su worktree. Toda afirmación de los agentes que va al ledger
  da lo mismo en el principal.
- **De las comparadas con la 111:** 1093 dan lo mismo (812 caen, 281 pasan); cambian 4, todas carreras de
  reloj real conocidas, con el mismo código: `cedeConTimeoutAlEmpezar0` (pasa hoy; en la 111 caía `R9-310`),
  `pat44927a5+cedeConTimeoutEnNota0` y `patad6ba69+cedeConTimeoutEnNota0` (una caída de `R9-310` de menos y
  una de más), y `unionDevTimeout1` (`R9-275` de menos). Ninguna cambia lo que dice el ledger.
- **No aplican 132,** las mismas que en la 111 (las de `espiaCadena110A5`, `soloUsadaA6`, `soloMarcoA6`,
  `marcoA4`, `muestraPilaA3`, `muestraControl366` y las de diseños viejos). Dos no son de un `prep` entero
  (`salta275bpt`, `salta292bpt`).

## 4. Lo que queda

- **Para la 113, y nada más del ciclo:** `R9-406`, `R9-407`, `R9-408` (las pruebas, con la prueba-sonda de
  cada uno como guía).
- **Costo conocido, sin arreglar** (el corte de Victor): `R9-401`..`R9-405`, `R9-409` y las notas «Medido
  en la 112».
- **Sin medir:** el daño de `primeroSiVariosEnUnion112` (sin caso que la active) y de
  `migraDestinoToleranteIlus112`; la pérdida de `R9-408` (la carrera de `R9-269`) y su daño en
  ilustraciones y autoevaluación; una escritura por `mergeItem` en D1; con una cuenta devuelta durante el
  respaldo, la relectura del `joinPrep` de `prepMultiSet` en D'; el corte exacto del guarda entre 9,5 y
  11 s.
- **Del Pendiente, sin tocar:** `R9-330` (decidido); la cabecera de `prepMultiSet` (`R9-327`); lo que queda
  de `R9-347`; un `giveBack` ajeno entre la nota y la mudanza; qué cambio bajó el corte de `R9-373`; un
  verde falso de `mockSqlite.retenida`; el daño de `R9-377` con un respaldo sin series; `notasPideDosVeces`
  en la lectura; `intervaloInocuo1`.

## 5. Las lecciones

- **Lo que un arreglo lleva a un camino, lo pide el camino vecino** (`R9-406`, `R9-407`): los tres daños
  de la 112 están en caminos que la 111 no tocó (con dueño; formas que no vuelven al primero; otros
  stores).
- **Lo que un control hereda no lo distingue** (`R9-408`): el «de quién» por contexto pasa a lo que la
  función deja corriendo.
- **Un conteo que resta no dice a quién le resta** (`R9-404`, `R9-409`): la lectura descuenta el pedido más
  viejo, el del respaldo.

## 6. El checkpoint

- **Dónde se escribió:** en `../essb-docs-s112`, mientras la matriz corría en el principal; pasado al
  principal con un parche (`git add -N` antes del `diff`) y commiteado ahí, con el hook.
- **Antes de cerrar** (la regla de la 102): las piezas del ledger (las 82 de `S112-matriz-extra.txt` y las
  186 de `S111-matriz-extra.txt`) en modo `anclas` sobre `56c7d33`: 268, aplican todas, árbol limpio
  (`S112-anclas-cierre.out.txt`).
- **Las compuertas:** `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` en el principal, y
  `npm run validate` con `NODE_ENV=development`, sin worktrees, en primer plano
  (`_scratch/S112-validate.out.txt`): typecheck limpio, lint con 0 errores (los 70 avisos de siempre),
  `format:check` limpio y jest 374/374 suites y 4688/4688 pruebas (las mismas que la 111: la 112 no cambia
  código).
- **El mensaje de la 113** está en `_scratch/S113-PROMPT.md`: los tres arreglos, y el de la 114 (`A12`), que
  escribe la 113.
