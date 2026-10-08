# Sesión 78 — revisión del diff de la 77 (2026-10-07)

En un chat nuevo, en la terminal, sin agentes y sin tocar código. Con `_scratch/S78-PROMPT.md`.

- **Estado al empezar:** `main` = `origin/main` = `8ff1130` (la 77 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37709675157`, 3 jobs, Node v24.21.0, 374/4629). Los docs decían
  «sin mergear» para la 77: corregido aquí.
- **Rama:** `docs/review-s78-diff-s77` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo de la 77 se sostiene. 2 nuevos P3 de pruebas, ninguno abierto por la 77:
  `R9-309` y `R9-310`. Quedan 310 hallazgos, ningún P0.

## 0. Cómo se trabajó

- `_scratch/S78-sonda.cjs.txt <corrida[,corrida]> archivo|prep|suite [args de jest]`, armada por
  `S78-gen.cjs.txt`: la `S77-sonda` con las salidas en `S78-sonda-<corrida>-<modo>.out.txt`, más:
  - `genEnSqlite`, `genFinSqlite`, `genTrasSqlite`: la `generacion` del agente 1 de la 76, con la
    marca en otro punto: al empezar el cuerpo de la transacción, al final del cuerpo, o justo
    antes de `emitBackupRestoring`;
  - `turnoAntesDeClave`: `prepWrite` pide el turno y espera la clave dentro de él;
  - `drenaFinSqlite`, `reiniciaFinSqlite`: la marca de `drenaX` y el reinicio de la cadena de
    turnos, al final del cuerpo;
  - `copia292`, `copiaClave`: dos sondas que se pegan al final de `backupPrepTurn.test.ts` y de
    `prepAccount.test.ts` (`_scratch/S78-copia292.ts.txt`, `S78-copiaClave.ts.txt`). Se corren con
    `prep -t S78`.
- El revert de cada arreglo: `de<sha>+pieza`. `git status` limpio tras cada corrida.

## 1. La puerta al final del cuerpo (`R9-307`, `41c75fc`)

- **Cae como dice** (`archivo`, 5 pruebas):

  | corrida                             | resultado                                                               |
  | ----------------------------------- | ----------------------------------------------------------------------- |
  | `nada`                              | pasa                                                                    |
  | `drenaEnSqlite`, `drenaAntesSqlite` | caen `durante` y `pedido antes`, con el diff de un `multiSet` sin turno |
  | `dee2e8182+drenaEnSqlite`           | pasa 4/4 (el revert)                                                    |
  | `drenaTrasSqlite`                   | pasa                                                                    |
  | `reiniciaEnSqlite`                  | cae `antes`                                                             |
  | `cuerpo39`; `cuerpo40`              | cae `antes`; además los otros dos, solo en `respaldoEnSqlite: 0`        |

- **«`drenaTrasSqlite` equivale al código bueno»: cierto.** Entre el fin de la transacción
  (`BackupService.ts:1620`) y `prepMultiSet` (`:1646`) no hay ningún `await`.
  `emitBackupRestoring` (`restoreSignal.ts:88`) llama a sus oyentes sin esperar. El único es el
  mazo (`MemoryDeckContext.tsx:331`), que no toma turno de la Mesa.
- **La regla de la 77** (¿alguna `reiniciaX` sin caso?): no.
  - `reiniciaAlInicio`, `reiniciaEnSqlite` y `reiniciaFinSqlite` (nueva) caen en `antes`;
    `reiniciaTrasSqlite`, en los tres.
  - `antes` tiene el turno desde antes de que empiece el respaldo, así que ve un reinicio en
    cualquier punto anterior a `prepMultiSet`.
  - Del otro lado, `drenaFinSqlite` (nueva) cae en `durante` y `pedido antes`. La puerta al final
    del cuerpo ve una marca en cualquier punto anterior a ella.

## 2. El caso `pedido antes` (`R9-306`, `a7a1feb`)

- **Cae como dice:**
  - `generacion` cae solo en `pedido antes`, con el diff de `sinCola`;
  - `de41c75fc+generacion` pasa 4/4;
  - la matriz de la 75 da en `pedido antes` lo mismo que en `durante`: `tarde39` y `lento19` pasan;
    `tarde40` cae en `otraConElTurno: false`; `lento20`, en `turnoPedidoAntesDeAbrir: 0`;
    `sinCola`, `enTurno` y `fueraDelTurno` caen en los tres; `antesSqlite39` cae solo en `antes`;
    `antesSqlite40` también en los otros dos, solo en `respaldoEnSqlite: 0`;
  - `pendientesAlInicio` cae solo en `durante`; `reiniciaTrasSqlite`, en los tres.
- **La lección de la 75 y de la 76, sobre este arreglo: el caso fija un punto.** Suelta la clave
  del store con el respaldo en la puerta de SQLite. Una regresión de la clase `generacion` (un store
  pedido antes de una marca del respaldo, y con la clave resuelta después, corre sin turno) la ve
  solo si la marca va antes de ese punto:
  - `genEnSqlite` y `genFinSqlite` caen en `pedido antes`;
  - `genTrasSqlite` (la marca en el aviso) pasa 5/5, y también la prueba de `e2e8182` (4/4), la
    de `bc845c0` (3/3) y el suite (1001/1001);
  - el daño, con `copia292` (la forma de `R9-292`, el store pedido antes del respaldo y su clave
    soltada con la escritura del respaldo retenida): con el código bueno,
    `corrioConElRespaldoRetenido: 0`; con `genTrasSqlite`, `generacion` y `genEnSqlite`, 1.

  Es `R9-309`. Para esta clase, el extremo es la clave resuelta lo más tarde posible, con el
  respaldo ya en su turno.

- **Un `prepWrite` que toma el turno antes de resolver la clave (`turnoAntesDeClave`):**
  - el caso `pedido antes` arma `antes` (el store tiene el turno desde antes del respaldo), pasa, y
    ningún control lo dice;
  - en el suite, 1001/1001;
  - el daño, con `copiaClave` (una escritura pedida antes del primer estado de auth, y después
    `setPrepAccount('ana')`, cuya unión pide un turno): con el código bueno terminan los dos; con
    la pieza, tras 100 vueltas, ninguno. Es la traba que la 55 dejó escrita en §5, sin prueba.

  Es `R9-310`.

- **La regla de la 72** (¿los controles del caso nuevo nombran QUÉ llegó?):
  - `respaldoEnSqlite` nombra lo que mide: el respaldo esperaba en la puerta de SQLite;
  - `otraConElTurno` dice que la función del store corrió, no que tenga el turno (`R9-304`, que la
    77 ya extendió al caso). Con `turnoAntesDeClave`, además, no dice CUÁNDO tomó el turno. Lo
    vería el mismo control que arregla `R9-304`, uno que lea el turno.

## 3. Que sea solo la prueba

`git diff --stat e2e8182 a7a1feb`: solo `__tests__/backupRestoreSignal.test.ts` (26+, 11−), en
`41c75fc` y `a7a1feb`.

## 4. Nuevos

- **`R9-309`** (P3, pruebas / respaldo / Mesa): un store pedido antes del respaldo, con la clave
  resuelta cuando el respaldo ya escribe en su turno. Si corre sin turno, no lo ve ninguna prueba.
  - `genTrasSqlite`: hoy 5/5, `e2e8182` 4/4, `bc845c0` 3/3, el suite 1001/1001; el daño, con
    `copia292`.
  - No lo abrió la 77: no lo veía ninguna versión.
  - Arreglo (hipótesis, medida como sonda): `copia292` como un caso más de la prueba de `R9-292`.
- **`R9-310`** (P3, pruebas / Mesa): un `prepWrite` que toma el turno antes de resolver la clave no
  lo ve ninguna prueba.
  - `turnoAntesDeClave`: `archivo` 5/5, el suite 1001/1001; el daño, con `copiaClave`.
  - No lo abrió la 77: es de la 55, y la 77 no tocó esas pruebas.
  - Arreglo (hipótesis, medida como sonda): `copiaClave` como prueba en `prepAccount.test.ts`.

## 5. Sin medir

- `backupPrepTurn.test.ts` tiene su propio `mockSqlite`, todavía con la puerta ANTES del cuerpo (lo
  usan `R9-275` y el caso `devolucion` de `R9-292`). Por la lección de la 76 puede dejar un punto
  sin armar, pero no se midió.
- `copia292` no se corrió contra la matriz de `R9-292` (`sinCola`, `suelta…`).

## 6. La lección

- **Un caso que fija el momento de una clave fija también qué marcas puede ver.** `pedido antes`
  suelta la clave del store en la puerta de SQLite. Una regresión que mire «¿empezó un respaldo
  desde que me pidieron?» la ve si la marca va antes de la puerta, y no si va después (en el aviso,
  donde la pondría cualquiera). Para la clase «lo pedido antes de una marca», el extremo es lo más
  tarde posible, con lo otro ya en su turno. Es la regla de la 77 con una tercera clase.
- **Una regla escrita sin su prueba no protege.** La traba de la 55 está en §5, y la regresión que
  la reabre pasa las 1001.
