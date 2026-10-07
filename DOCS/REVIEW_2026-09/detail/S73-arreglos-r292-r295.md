# Sesión 73 — arreglos de lo de la 72 (2026-10-07)

En el mismo chat que la 72 (Victor: «continuemos en este chat con la siguiente sesión, hay que mandar
esta vez 7 agentes»; ante el recordatorio de la sesión 37, eligió la recomendación: 3). En la
terminal, con 3 agentes en worktree que solo midieron. Con `_scratch/S73-PROMPT.md`.

- **Estado al empezar:** `main` = `origin/main` = `f6c1c3c` (la 72 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37655696021`, 3 jobs, Node v24.21.0, 374/4626). Los docs decían
  «sin mergear» para la 72: corregido aquí.
- **Ramas:** `fix/s73-retenido-r292-r295` (`38a98da`, `cfaa004`, `abe6099`, `9c43e22`; solo
  pruebas) y `docs/review-s73-fix` encima, sin mergear hasta el OK de Victor.
- **Resultado:** cerrados `R9-292`, `R9-293`, `R9-294` y `R9-295`. 6 nuevos, P3, de pruebas
  (`R9-296`..`R9-301`), ninguno abierto por la 73. Quedan 301 hallazgos, ningún P0.

## 0. Cómo se trabajó

- El orquestador escribió los arreglos y los midió (`_scratch/S73-turno.cjs.txt`, generado por
  `S73-gen.cjs.txt` desde `S72-turno3`, con las piezas `devolucionFuera` y `sinColaLento60`;
  `S73-vieja.cjs.txt` corre las piezas con la prueba de `f6c1c3c`). Después mandó 3 agentes a
  romperlos: el 1 con `conStore`/`conUnion`, el 2 con `devolucion` y el camino de `gone`, el 3 con
  `colgadas`.
- `_scratch/S73-copiar.cjs.txt` les copió las herramientas con `ROOT` en su worktree. El prompt les
  pidió desde el principio copiar su `_scratch` al principal antes de terminar (la regla de la 72), y
  los tres lo hicieron: `_scratch/S73-sondas-agente-{1,2,3}/`. Unos 160-225k tokens, 40-63
  llamadas y 14-24 min cada uno. Los worktrees no se borraron solos esta vez: se quitaron a mano
  (sin junction, `_scratch` cotejado con `diff -rq`) con sus ramas.
- El orquestador re-midió en el árbol principal cada afirmación que se registra, con los scripts de
  los agentes regenerados con `ROOT` en el principal: `S73-turno1.cjs.txt` y `S73-vieja1.cjs.txt`
  (`S73-gen1.cjs.txt`, agente 1) y `S73-a2m.cjs.txt` (`S73-gen2.cjs.txt`, agente 2).

## 1. `R9-292`, `R9-293` y `R9-294` (`38a98da`, `abe6099`, `9c43e22`)

- **El arreglo:** la prueba nueva «R9-292: con la escritura del respaldo retenida, ninguna otra
  escritura de la Mesa corre». La escritura del respaldo en la Mesa «sin cuenta» (clave
  `@prep_notes` y contenido `del respaldo`) espera en una puerta; tras 40 vueltas enteras se pide otra
  escritura, y en 20 vueltas no tiene que escribir. Casos: `conStore`, `conUnion` y `devolucion` (la
  cuenta se borra con el respaldo en SQLite; la retenida es la devolución). Controles:
  `retenidaSqlite`, `retenida` y `pedido`. Y el comentario de `turnoPedido` dice que cuenta el pedido.
- **Medido, la final:**

  | pieza                                                | la prueba nueva                        |
  | ---------------------------------------------------- | -------------------------------------- |
  | `nada`                                               | pasa (6/6 en `prep`; suite 999/999)    |
  | `sinTurno`, `lentoSinTurno`                          | cae, con `pedido: 0`                   |
  | `sueltaAntes`, `sueltaAntes5`, `cuerpoSuelto`        | cae en `escribioConElRespaldoRetenido` |
  | `sinColaLento25`; `sinColaLento60`                   | cae; con `60`, además `retenida: 0`    |
  | `turnoSoloGone`; `devolucionFuera`                   | cae; la segunda solo en `devolucion`   |
  | `sinAwait`                                           | cae en `conStore` y `conUnion`         |
  | `seRinde21`, `25`, `45`                              | cae (con la primera versión, pasaba)   |
  | `lentoClave`                                         | cae en `retenidaSqlite: 0`             |
  | `demoraDentro`, `lento` (el código bueno, más lento) | no la tocan                            |

- **Con la prueba de `f6c1c3c`**, `devolucionFuera` pasaba 5/5.
- **Dos huecos de la primera versión (`38a98da`), vistos por los agentes y cerrados:**
  - salía de la vuelta en cuanto llegaba la escritura y pedía la otra enseguida: un respaldo que
    suelta el turno con la suya en vuelo 21 vueltas después pasaba (`seRindeK`, agente 1). `abe6099`
    da las 40 enteras: la regla de la 71, otra vez, en una prueba del propio orquestador;
  - el caso `devolucion` copiaba las 20 vueltas fijas de `durante` sin su control de SQLite: con
    `lentoClave` caía como una pérdida de P (agente 2). `9c43e22` agrega `retenidaSqlite` y pone
    `mockSqlite.retenida` a 0 en cada caso (también quedaba sin limpiar entre pruebas).
- **Lo que la prueba nueva no ve:** `R9-296` (la otra escritura lenta) y las regresiones del camino
  de la devolución `R9-298`..`R9-301`.
- **La sonda `devuelta` de la 72 no se sumó:** da falsos rojos (`R9-301`).

## 2. `R9-295` (`cfaa004`)

- **El arreglo:** `colgadas` guarda los pasajes de cada escritura colgada de la Mesa «sin cuenta»,
  leídos al terminar la vuelta que la espera: `[]`, `[]` y `[[P, R]]`. Un control dice si llegó y qué
  llegó.
- **Medido** (`S72-sonda2 actual <pieza>`): sin pieza y `lento18` pasan; `releaseSinEsperar` cae en
  `colgadas: [[P]]`; `toqueYNota` y `tocaSinCuenta`, que pasaban, caen; `redirige` cae;
  `notaTarde5`, `notaSinEsperar` y `anotaRespaldo`, el rojo de antes con `colgadas` sin diff; `lento`,
  `colgadas: []`.
- **Agente 3:** ninguna pieza de la 72 que caía con `f6c1c3c` pasa ahora. El límite que quedaba (un
  colgado ajeno con `[P, R]`) exige dos condiciones que el código no tiene, y pasa también con
  `f6c1c3c`: dicho sin número, con la hipótesis `bajoAna` medida. La prueba quedó más estricta que el
  teléfono con `parteP` (una devolución partida en dos, inofensiva y poco plausible): se deja así.

## 3. Nuevos

Todos P3, de pruebas, ninguno abierto por la 73 (cada uno medido con la prueba de `f6c1c3c`). Las
entradas, con sondas y controles, están en `BUGS.md`.

- **`R9-296`:** con la otra escritura 25 vueltas lenta dentro de su turno (`…TardeDentro25`), la
  prueba nueva pasa con el turno roto. «No escribió» no es «esperaba el turno». Hipótesis medida: un
  gancho de prueba en `prepAccount.ts` que cuente los que esperan el turno (toca código de la app).
- **`R9-297`:** en la prueba de `R9-273`, `retenida` se lee después de abrir. Con la otra escritura
  lenta (`tarde25`, el código bueno), cae con el síntoma de su regresión y el control a favor.
- **`R9-298` (`goneFuera`), `R9-299` (`notaFuera`), `R9-300` (`sinSourceGoes`):** regresiones del
  camino de la devolución que pasan las 999 y dejan lo restaurado bajo el uid borrado, cada una con
  su sonda (`cola`, `cola2`, `conflicto`). Re-medido: sonda, control y suite.
- **`R9-301`:** `devolucionDosTurnos` solo la ve `devuelta`, que da falsos rojos con devoluciones
  benignas; la forma corregida, `devuelta2`, está medida.

## 4. Dicho, sin número

- El límite del margen de la prueba nueva, como el de `R9-290`: con las 40 enteras, `seRinde45` cae;
  un «se rinde» por tiempo no lo ve ninguna prueba de vueltas.
- Un deadlock en el camino de `gone` (`devolucionGiveBackDentro`) deja un store colgado, y la prueba
  siguiente da timeout: `writeQueue` (`prepNotesStore.ts:48`) es de módulo y el reset no la limpia
  (agente 2). Solo afecta el diagnóstico: el rojo sigue.
- El orden del archivo (agente 2, 14 piezas en 4 órdenes): los veredictos no dependen del orden,
  salvo el deadlock de arriba.

## 5. Compuertas

- `backupPrepTurn`, `backupRestoreSignal` y `prepAccount`: verdes.
- `npm run validate` con `NODE_ENV=development`, sin worktrees: verde, 374/4627 (lint: 0 errores,
  70 advertencias).

## 6. La lección

- **«No pasó» no es «estaba esperando».** Una prueba de invariante («mientras X está en vuelo, nada
  más corre») ve la regresión solo si lo otro llegó a pedir y está ESPERANDO: si es lento, «no
  escribió» vale igual (`R9-296`). Y un control que se lee después de abrir la puerta cuenta el paso,
  no la retención (`R9-297`).
- Y otra vez la de la 71, en la prueba del propio orquestador: salir en cuanto algo llega acorta lo
  que se ve después (`seRindeK`).
