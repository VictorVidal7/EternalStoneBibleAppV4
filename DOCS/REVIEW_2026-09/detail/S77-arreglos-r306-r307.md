# Sesión 77 — arreglos de lo de la 76 (2026-10-07)

En el mismo chat que la 76 (Victor: «continuemos aquí»), en la terminal y sin agentes. Con
`_scratch/S77-PROMPT.md`. Solo pruebas: no se tocó código de la app.

- **Estado al empezar:** `main` = `origin/main` = `e2e8182` (la 76 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37706611415`, 3 jobs, Node v24.21.0, 374/4628). Los docs decían
  «sin mergear» para la 76: corregido aquí.
- **Ramas:** `fix/s77-r306-r307-ordenes` (`41c75fc`, `a7a1feb`; solo
  `__tests__/backupRestoreSignal.test.ts`) y `docs/review-s77-fix` encima, sin mergear hasta el OK de
  Victor.
- **Resultado:** cerrados `R9-306` y `R9-307`. Ninguno nuevo: quedan 308 hallazgos, ningún P0.
  `R9-308` no se pidió: sigue pendiente.

## 0. Cómo se trabajó

- `_scratch/S77-sonda.cjs.txt <corrida[,corrida]> archivo|prep|suite`, armada por
  `S77-gen.cjs.txt`. Es la sonda del agente 4 de la 76 (`S76-sonda-a4`, con `ROOT` en el principal),
  más tres piezas del agente 1 (`generacion`, `reiniciaAlInicio`, `pendientesAlInicio`) y dos nuevas:
  - `reiniciaEnSqlite`: el respaldo reinicia la cadena de turnos al empezar el cuerpo de su
    transacción;
  - `reiniciaTrasSqlite`: la reinicia tras la transacción, antes del aviso.

  Las dos sueltan lo que tenía el turno antes de ese punto: la clase contraria a `drenaX`. Salidas:
  `S77-sonda-<corrida>-<modo>.out.txt`.

- El revert de cada arreglo es `de<sha>+pieza`: el archivo de prueba como en el commit anterior.
- La matriz se corrió en el árbol que se commiteó, y tres piezas otra vez sobre lo commiteado (el
  hook de commit pasa prettier). `git status` limpio tras cada corrida.

## 1. `R9-307` (`41c75fc`): la puerta, después del cuerpo

- **El arreglo** (el `puertaAlFinal` del agente 4, con el mismo texto): en el mock de
  `withTransactionAsync`, `await fn()` y después la puerta. El comentario de cabecera lo dice, y el
  de `respaldoEnSqlite` pasa a decir lo que mide: «CONTROL: el respaldo esperaba en SQLite» (la
  corrección de la 76 en `R9-303`).
- **Por qué alcanza:** entre el fin de la transacción (`BackupService.ts:1620`) y `prepMultiSet`
  (`:1646`) no hay ningún `await`, así que la puerta al final del cuerpo es el último punto donde el
  store puede entrar. Por eso `drenaTrasSqlite` (una marca entre el fin de la transacción y el aviso)
  equivale al código bueno, y pasa.
- **Medido** (`archivo`, 4 pruebas):

  | corrida                                              | resultado                                                 |
  | ---------------------------------------------------- | --------------------------------------------------------- |
  | `nada`                                               | pasa                                                      |
  | `drenaEnSqlite`, `drenaAlInicio`, `drenaAntesSqlite` | cae `durante`, con el diff de un `multiSet` sin turno     |
  | `dee2e8182+drenaEnSqlite`                            | pasa 4/4 (el revert: la prueba de antes no lo veía)       |
  | `drenaTrasSqlite`, `generacion`                      | pasa                                                      |
  | `reiniciaEnSqlite`                                   | cae `antes` (con la puerta antes del cuerpo: los dos)     |
  | `reiniciaTrasSqlite`                                 | caen los dos                                              |
  | `reiniciaAlInicio`; `pendientesAlInicio`             | cae `antes`; cae `durante` (como en `e2e8182`)            |
  | `tarde1`, `tarde39`, `lento19`, `cuerpo19`           | pasa                                                      |
  | `tarde40`                                            | caen los dos, en `otraConElTurno: false`                  |
  | `lento20`                                            | caen los dos, en `turnoPedidoAntesDeAbrir: 0`             |
  | `sinCola`, `enTurno`, `fueraDelTurno`                | caen los dos con su diff de siempre                       |
  | `antesSqlite39`; `antesSqlite40`                     | cae `antes`; además `durante`, solo en `respaldoEnSqlite` |
  | `cuerpo20`, `cuerpo39`; `cuerpo40`                   | cae `antes`; además `durante`, solo en `respaldoEnSqlite` |

- **Lo que movió el arreglo (la lección de la 75 y la 76, sobre el propio arreglo):**
  - `reiniciaEnSqlite` dejó de verlo `durante`, porque el store ahora entra después del cuerpo. Lo
    sigue viendo `antes`: el archivo no perdió cobertura.
  - El corte de `cuerpoK` en `durante` pasó de 19/20 (en `turnoPedidoAntesDeAbrir`, la ventana de
    `R9-289` contada desde que se suelta SQLite) a 39/40 (en `respaldoEnSqlite`, la espera de SQLite).
    En `antes` sigue en 19/20.
- **Suite** (`--findRelatedTests` de `BackupService.ts`, `prepAccount.ts`, `restoreSignal.ts` y
  `MemoryDeckContext.tsx`): 1000/1000; con `drenaEnSqlite`, cae solo `durante`.

## 2. `R9-306` (`a7a1feb`): el store pedido antes del respaldo

- **El arreglo:** un tercer caso, `pedido antes`, armado con puertas, como propuso el agente 1 de la
  76:
  1. el store se pide con la clave sin resolver (`prepWrite` espera la clave antes de pedir el
     turno);
  2. el respaldo se pide y espera en SQLite;
  3. se suelta la clave, y se espera a que el store esté `dentro`;
  4. se suelta SQLite.

  `respaldoEnSqlite` vale 1 en `durante` y en `pedido antes`.

- **Medido** (`archivo`, 5 pruebas):

  | corrida                                     | resultado                                                |
  | ------------------------------------------- | -------------------------------------------------------- |
  | `nada`                                      | pasa                                                     |
  | `generacion`                                | cae solo `pedido antes`, con el diff de `sinCola`        |
  | `de41c75fc+generacion`                      | pasa 4/4 (el revert)                                     |
  | `drenaAlInicio`, `drenaEnSqlite`            | caen `durante` y `pedido antes`                          |
  | `pendientesAlInicio`                        | cae `durante` (el store de `pedido antes` es de antes)   |
  | `reiniciaAlInicio`, `reiniciaEnSqlite`      | cae `antes`                                              |
  | `reiniciaTrasSqlite`                        | caen los tres                                            |
  | la matriz de la 75 y `cuerpo39`, `cuerpo40` | `pedido antes` da lo mismo que `durante`, con los cortes |

  Los cortes de `pedido antes`: `tarde` 39/40 (en `otraConElTurno: false`), `lento` 19/20 (en
  `turnoPedidoAntesDeAbrir: 0`), y `antesSqlite` y `cuerpo` 39/40 (solo en `respaldoEnSqlite: 0`).

- **Suite:** 1001/1001; con `generacion`, cae solo `pedido antes`. `npm run validate` (con
  `NODE_ENV=development`, en `docs/review-s77-fix`): 374/4629, 0 errores de lint.
- **Sobre lo commiteado** (después del hook de prettier): `nada` pasa 5/5; con `generacion` cae
  `pedido antes`; con `drenaEnSqlite`, `durante` y `pedido antes`.
- **`R9-304` también en el caso nuevo:** en el rojo de `generacion`, lo recibido dice
  `otraConElTurno: true`, y el store corrió sin turno. Es el mismo engaño que `fueraDelTurno`: el
  control dice «la función del store corrió». No es nuevo: queda en `R9-304`.

## 3. Lo que no se hizo

- `R9-308` no se pidió: sigue pendiente, como `R9-304` y `R9-305`.

## 4. La lección

- **Las regresiones de orden vienen en dos clases, y cada una necesita su extremo.** Las que fijan
  demasiado pronto lo que van a esperar (`drenaX`) se ven si el store entra lo más TARDE posible. Las
  que sueltan lo que ya tenía el turno (`reiniciaX`) se ven si entra lo más TEMPRANO posible. Mover
  la puerta al final del cuerpo le dio a `durante` el extremo tardío, y le quitó `reiniciaEnSqlite`,
  que lo sigue viendo `antes`, el extremo temprano. Al mover una puerta, corré una regresión de cada
  clase y comprobá que la siga viendo algún caso.
