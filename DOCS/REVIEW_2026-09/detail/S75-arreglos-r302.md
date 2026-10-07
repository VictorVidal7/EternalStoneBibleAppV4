# Sesión 75 — arreglos de lo de la 74 (2026-10-07)

En un chat nuevo, en la terminal, con 2 agentes en worktree que solo midieron (Victor: «¿podrías
mandar 2 agentes?»). Con `_scratch/S75-PROMPT.md`. Solo pruebas: no se tocó código de la app.

- **Estado al empezar:** `main` = `origin/main` = `bc845c0` (la 74 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37667723424`, 3 jobs, Node v24.21.0, 374/4627). Los docs decían
  «sin mergear» para la 74: corregido aquí. `main` no era más nuevo que `bc845c0`: el CI no se volvió
  a mirar.
- **Ramas:** `fix/s75-r302-store-con-el-turno` (`a808c29`, `125736b`; solo
  `__tests__/backupRestoreSignal.test.ts`) y `docs/review-s75-fix` encima, sin mergear hasta el OK
  de Victor.
- **Resultado:** cerrados `R9-302` y `R9-303` (este, abierto por el propio arreglo de `R9-302` y
  visto por el agente 1). 2 nuevos, P3, de pruebas: `R9-304` (lo abrió la 75) y `R9-305` (de
  T8.4.4). Quedan 305 hallazgos, ningún P0. `R9-296` y `R9-297` no se pidieron: siguen pendientes.

## 0. Cómo se trabajó

- El orquestador escribió el arreglo de `R9-302` y corrió la matriz en el árbol principal con
  `_scratch/S75-sonda.cjs.txt <corrida[,corrida]> archivo|prep|suite` (una corrida es una pieza o
  varias con `+`; piezas `nada`, `vieja`, `tardeK`, `tardeDentroK`, `lentoK`, `sinCola`, `enTurno`).
  Con el commit hecho, mandó 2 agentes sobre `a808c29`: el 1, a romper la prueba nueva (las reglas de
  la 71, la 72 y la 73); el 2, a medir el corte de cada pieza que demora (la regla de la 74), sola,
  junto con la regresión, y en `prep` y `suite`.
- `_scratch/S75-copiar.cjs.txt` (de `S73-copiar`, con la lista ampliada a `S73-turno1`, `S73-a2m`,
  `S74-sonda` y `S75-sonda`) les copió las herramientas con `ROOT` en su worktree. El prompt les pidió
  desde el principio copiar su `_scratch` al principal antes de terminar, y los dos lo hicieron:
  `_scratch/S75-sondas-agente-{1,2}/`. Unos 100k y 115k tokens, 27 y 50 llamadas, 9 y 12 min. Los
  worktrees no se borraron solos: se quitaron a mano (sin `node_modules`, `_scratch` cotejado con
  `diff -rq`) con sus ramas.
- El orquestador re-midió en el árbol principal cada afirmación que se registra, con la sonda del
  agente 1 regenerada con `ROOT` en el principal y dos piezas más: `S75-sonda1.cjs.txt`
  (`S75-gen1.cjs.txt`), con `de<sha>` (el archivo de prueba entero como en ese commit: el revert de
  un arreglo) y `antesSqliteK`.
- `git status` limpio tras cada corrida.

## 1. `R9-302` (`a808c29`)

- **El arreglo** (la forma `f287` de la 74): la función del store marca `dentro`; la prueba espera
  esa marca hasta 40 vueltas antes de pedir el respaldo; control `otraConElTurno: true`.
- **Medido, antes de commitear** (`S75-sonda`, modo `archivo`):

  | corrida                         | la prueba de `R9-287`                                          |
  | ------------------------------- | -------------------------------------------------------------- |
  | `nada`, `tarde1`, `tarde25`     | pasa                                                           |
  | `tarde45`                       | cae en `otraConElTurno: false` (y `mazoPedido…`, `terminado…`) |
  | `sinCola`, `lento25`, `enTurno` | cae con el mismo diff que `vieja+<pieza>`                      |
  | `vieja`                         | el archivo queda igual a `main` (el revert es exacto)          |
  | `vieja+tarde1`                  | cae con el diff de `sinCola`: el rojo de `R9-302`              |

- **Suite** (`--findRelatedTests` de `BackupService.ts`, `prepAccount.ts`, `restoreSignal.ts` y
  `MemoryDeckContext.tsx`): 999/999; con `tarde1`, cae solo la de `R9-273` (`R9-297`).
- **Los cortes (agente 2, re-medidos):** `tarde39` pasa, `tarde40` cae (las 40 vueltas: el store
  pone `dentro` en la vuelta K, y la prueba lo ve en la K+1); `lento19` pasa, `lento20` cae en
  `turnoPedidoAntesDeAbrir: 0`, igual con la prueba vieja (la espera de 20 empieza al pedir el
  respaldo en las dos). `enTurno+tardeK` y `sinCola+tardeK`, K de 1 a 39: caen con su diff de
  siempre y el control en `true`.

## 2. `R9-303` (`125736b`): lo que la espera le quitó a la prueba

- **Visto por el agente 1** con la regla de la 71 (qué veía la prueba en lo que la espera se salta):
  `drenaAlInicio`, un respaldo que fija al EMPEZAR los turnos de la Mesa que va a esperar, cae con la
  prueba de `bc845c0` y pasa con la de `a808c29`, y también `prep` (18/18) y el suite (999/999). La
  vieja la veía por la carrera de microtareas que daba el rojo de `R9-302`: la misma carrera, para
  bien y para mal.
- **El arreglo:** dos casos (`it.each`): `antes` (como en `a808c29`) y `durante`: el respaldo
  empieza y espera en SQLite (`mockSqlite`, como en `backupPrepTurn.test.ts`; la transacción va
  antes del aviso y del turno, `BackupService.ts:1419`, `:1638`, `:1646`), el store toma el turno, y
  recién entonces se suelta SQLite. Control `respaldoEnSqlite` (1 en `durante`, 0 en `antes`).
- **Medido** (`S75-sonda1`, modo `archivo`, 4 pruebas):

  | corrida                                | resultado                                                |
  | -------------------------------------- | -------------------------------------------------------- |
  | `nada`, `tarde1`, `tarde39`, `lento19` | pasa                                                     |
  | `drenaAlInicio`                        | cae en `durante`, con el diff de un `multiSet` sin turno |
  | `dea808c29+drenaAlInicio`              | pasa (la prueba de `a808c29`: el hueco)                  |
  | `debc845c0+drenaAlInicio`              | cae (la prueba de `bc845c0`, por la carrera)             |
  | `tarde40`                              | cae en los dos casos, con `otraConElTurno: false`        |
  | `lento20`                              | cae en los dos en `turnoPedidoAntesDeAbrir: 0`           |
  | `sinCola`, `enTurno`, `fueraDelTurno`  | caen en los dos con su diff de siempre                   |
  | `antesSqlite39`; `antesSqlite40`       | `durante` pasa; cae solo en `respaldoEnSqlite: 0`        |
  | `debc845c0+tarde1`                     | cae: el rojo de `R9-302`                                 |

  Con `antesSqliteK`, el caso `antes` cae desde antes en `turnoPedidoAntesDeAbrir: 0`: la ventana de
  20 de `R9-289`, que ahí cuenta desde que se pide el respaldo.

- **Suite:** 1000/1000; con `tarde1`, cae solo la de `R9-273` (`R9-297`). `npm run validate` (con
  `NODE_ENV=development`, en `docs/review-s75-fix`): 374/4628, 0 errores de lint.

## 3. Nuevos

- **`R9-304`:** `otraConElTurno` mide «la función del store corrió». Con `fueraDelTurno` (o
  `storeSuelta`) la prueba cae, pero el rojo afirma que el store tenía el turno; con `tardeDentro40`
  (código bueno, el store CON el turno) cae solo en el control. Lo abrió la 75. Arreglo propuesto: con
  el gancho de `R9-296`, o nombrar lo que mide.
- **`R9-305`:** en `prepSeriesDetailScreen.test.tsx`, con `prepWrite` más lento, `removes` cae por el
  reloj del `waitFor` y su escritura cae en `reorders`. Corte de reloj: 26 pasa y 30 cae en el árbol
  principal; en el worktree del agente, 26 ya caía; en el suite, 25. De T8.4.4.
- **Sin número (el límite de toda ventana finita, como `seRinde60` en `detail/S74` §1):** con
  `sueltaK` (el respaldo espera el turno a lo sumo K vueltas y después escribe sin él), la prueba de
  `R9-287` cae con 0 y pasa con 1, la nueva y la vieja: lee en la vuelta en que se pide el turno y
  enseguida abre. En `prep`, la de `R9-273` lo ve hasta 10 y la de `R9-275` hasta 20; desde 21,
  ninguna (`suelta21`, `30`, `40`: 18/18). No lo abrió la 75. Medido por el agente 1, no re-medido
  (las salidas, en `_scratch/S75-sondas-agente-1/`).
- **Lo que el agente 1 probó sin encontrar nada (no re-medido):** `instantanea` y `libreDirecto` (el
  respaldo escribe sin turno si la Mesa está libre) y `antesDelTurno` (la función del store corre
  antes del turno) los ven `R9-292`, `R9-275` y `R9-269` en `prep`.

## 4. Que sea solo la prueba

`git diff --stat bc845c0 125736b`: solo `__tests__/backupRestoreSignal.test.ts` (98+, 50−).

## 5. Lo que no se hizo

- `R9-296` y `R9-297` no se pidieron en el mensaje: siguen pendientes, como `R9-304` y `R9-305`.
- `R9-305` no se acotó más que 26/30 (es de reloj).

## 6. La lección

- **Una espera que ordena dos cosas se lleva la cobertura del otro orden.** La prueba de `R9-287`
  veía «un turno tomado después de que el respaldo empezó» por una carrera de microtareas, la misma
  que daba su rojo engañoso. Al esperar al store, el arreglo cerró la carrera y con ella esa
  cobertura, y ninguna de las 999 la tenía. Cuando un arreglo fija un orden que antes era una
  carrera, construí el otro orden como su propio caso, con una puerta y no con microtareas. Lo vio el
  agente que buscaba romperlo, no el que lo escribió.
