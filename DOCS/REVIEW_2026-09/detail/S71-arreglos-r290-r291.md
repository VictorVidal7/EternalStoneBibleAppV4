# Sesión 71 — arreglos de lo de la 70 (2026-10-07)

En el mismo chat que la 69 y la 70 (Victor: «podrías continuar con la siguiente y mandar 2
agentes?»), en la terminal, con 2 agentes en worktree que solo midieron. Con
`_scratch/S71-PROMPT.md`.

- **Estado al empezar:** `main` = `origin/main` = `8c4fc9a` (la 70 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37577204278`, 3 jobs, Node v24.21.0, 374/4626). Los docs decían
  «sin mergear» para la 70: corregido aquí.
- **Ramas:** `fix/s71-llegada-r290-r291` (`b5164d7` `R9-291`, `82bdc07` `R9-290`; solo pruebas) y
  `docs/review-s71-fix` encima, sin mergear hasta el OK de Victor.
- **Resultado:** cerrados `R9-291` y `R9-290`. 1 nuevo, P3 (`R9-292`, de la 57). Una corrección a lo
  que la 70 dijo de `R9-289`. Quedan 292 hallazgos, ningún P0.

## 0. Cómo se trabajó

- El orquestador escribió los dos arreglos y los midió. Después mandó 2 agentes (en worktree, sobre
  `f926630`) a romperlos, uno por arreglo. Los dos devolvieron su informe; el harness no los dejó
  escribir con Write en el árbol principal, así que el 2 dejó todo en su worktree y el 1 lo copió
  con `cp`. Todo quedó en el `_scratch` principal antes de quitar los worktrees:
  - `_scratch/S71-agente-1.md.txt` y `_scratch/S71-sondas-agente-1/` (sondas y salidas);
  - `_scratch/S71-sondas-agente-2/` (`S71-agente-2.md.txt`, `S71a2-sonda.cjs.txt` y `salidas/`).
- El orquestador re-midió en el árbol principal cada afirmación nueva de los agentes, con sus sondas
  copiadas y `ROOT` cambiado: `_scratch/S71-sonda2.cjs.txt` (la del agente 2, más la prueba de
  `f926630`) y `_scratch/S71-turno1.cjs.txt` (la del agente 1, con `S71-suelta.test.ts.txt`).
- Herramientas de antes: `S70-turno.cjs.txt <pieza> prep|suite` y `S59-rev.cjs.txt <pieza> ver`.
- `git status` vacío tras cada corrida. Los worktrees se quitaron (sin junction, informes cotejados
  con `cmp`) y sus ramas se borraron.

## 1. `R9-291` (`b5164d7`)

- **El arreglo:** en la prueba de `R9-273`, un `jest.spyOn(prepAccount, 'prepMultiSet')` por caso
  (restaurado en cuanto se lee el conteo, y en el `finally`) y un control `turnoPedido: 1` en `union`
  y en `store`. Solo `BackupService.ts:1646` llama a `prepMultiSet` desde fuera de su módulo.
- **La vuelta sigue esperando el daño.** El mensaje proponía que esperara el pedido. Medido por el
  agente 1 con 9 piezas: las dos formas dan lo mismo salvo con `sinColaLento` (`prepMultiSet` sin
  turno y 5 vueltas antes de escribir), donde solo la forma elegida cae. Esperar el pedido sale
  antes de que el respaldo escriba.
- **Medido** (`S70-turno <pieza> prep`; el agente 1 lo re-midió igual, y en `suite`):

  | pieza           | la prueba de `R9-273` cae en                                    |
  | --------------- | --------------------------------------------------------------- |
  | `nada`          | — (pasa)                                                        |
  | `sinTurno`      | el daño, `antesDeAbrir: true` y `turnoPedido: 0`                |
  | `lentoSinTurno` | `turnoPedido: 0` (antes pasaba); en el suite, 3 de 998 (eran 2) |
  | `lento`         | `turnoPedido: 0`, el mismo diff: el caso no llegó               |
  | `sinCola`       | el daño y `antesDeAbrir: true`, con el control en 1             |

- **La regla de la 57** (agente 1, `S71-orden.cjs.txt`): con el orden cambiado y sondas entre las
  pruebas, `prepMultiSet` no queda espiado y el `multiSet` del mock sigue igual. Control
  `sinRestore`: las sondas lo ven.

## 2. `R9-290` (`82bdc07`)

- **El arreglo:** el mock de `muere` cuenta los `multiSet` colgados; `colgadas` (0, 0 y 1) es lo que
  llegó en las 20 vueltas que se lo espera; después, 20 vueltas más con la devolución colgada, y
  recién entonces se suelta el mock.
- **La primera versión (`f926630`) abrió un hueco, y lo vio el agente 2.** Salía en el primer
  colgado, así que dejaba de ver lo que el proceso hace mientras la devolución cuelga. Con la nota
  quitada sin esperar la devolución una o cinco vueltas después (`notaTarde`, `notaTarde5`), la
  versión vieja (`8c4fc9a`) caía y `f926630` pasaba. Re-medido en el árbol principal
  (`S71-sonda2 vieja|f926|actual <pieza>`):

  | pieza               | vieja | `f926630` | final |
  | ------------------- | ----- | --------- | ----- |
  | `nada`              | pasa  | pasa      | pasa  |
  | `notaSinEsperar`    | cae   | cae       | cae   |
  | `notaTarde`         | cae   | **pasa**  | cae   |
  | `notaTarde5`        | cae   | **pasa**  | cae   |
  | `lento18notaTarde5` | pasa  | pasa      | cae   |

- **Y la segunda versión leía `colgadas` al final.** Con `lento` (25 vueltas), el respaldo llegaba
  durante las 20 de después y la prueba pasaba: sin verde falso (el caso se construía), pero con la
  ventana posterior más corta que 20 y un control que ya no decía «llegó en sus 20». Se lee al
  terminar la primera vuelta.
- **Medido, la final:** `lento` cae solo en `colgadas: 0`; `lento18` pasa; `anotaRespaldo` da el
  rojo de antes (`Ps/23/1-6` bajo `ana`) con el control en 1; `respaldo`, el de antes y el control
  en 0 (sin la redirección no hay devolución); `nada` pasa.
- **Lo que no se cerró, del agente 2:** `colgadas` cuenta cualquier `multiSet` de `@prep_notes`. Una
  escritura extra de la Mesa «sin cuenta» antes de la devolución (`tocaSinCuenta`) lo pone en 1 sin
  llegar a la devolución, y junto con la nota quitada antes (`toqueYNota`) pasa en las dos
  versiones. Exige una escritura que el código no tiene: queda dicho, sin número. Y el orden del
  archivo no fuga nada (`orden`, `ordenDoble`).

## 3. Nuevo: `R9-292`

- **`R9-292` (P3, pruebas):** la prueba de `R9-273` ve que el respaldo ESPERA el turno, no que
  escribe DENTRO de él. Lo encontró el agente 1; re-medido.
  - Pieza `sueltaAntes5`: `prepMultiSet` espera un turno vacío, deja pasar 5 vueltas y escribe
    fuera del turno. `backupPrepTurn` y `backupRestoreSignal` pasan 5/5, y el suite 998/998
    (salida del agente 1).
  - La sonda `suelta` (`S71-suelta.test.ts.txt`: un store retenido, el respaldo pide el turno, y
    DESPUÉS se pide la unión de Ana) cae: lo restaurado queda en la Mesa «sin cuenta» con la sesión
    de Ana, su Mesa no se reemplaza, y la restauración dice que sí. Controles: `nada` pasa, `sinTurno`
    cae.
  - La prueba arma la otra escritura ANTES del respaldo; el caso vecino (una escritura pedida
    mientras el respaldo espera su turno) no se construye.
  - **¿Lo abrió la 71?** No: es de `831c7e4` (sesión 57). Hoy el código escribe dentro del turno.
  - **Arreglo (hipótesis):** agregar el caso de la sonda `suelta` a la prueba de `R9-273`, y verla
    caer con `sueltaAntes5`.

## 4. Corrección a la 70 (`R9-289`)

- La 70 escribió que los tres controles de la prueba de `R9-287` «se sostienen» midiendo solo
  `sinCola`. Con `sinColaLento` (sin turno, 5 vueltas antes del `multiSet`), la prueba pasa 3/3:
  `mazoPedido…: 0` («el multiSet esperaba el turno») y `terminado…: false` se cumplen sin ningún
  turno. Re-medido (`S71-turno1 sinColaLento archivo`).
- No es un verde falso de su regresión (con el aviso dentro del cuerpo, `sinColaLentoEnTurno`, cae
  en los avisos), y la prueba de `R9-273` ve `sinColaLento`. Pero el comentario de ese control
  afirma algo que la prueba no ve. Sin número; queda a criterio de Victor.

## 5. Compuertas

- `backupPrepTurn`, `backupRestoreSignal` y `prepAccount`: 17/17.
- `npm run validate` con `NODE_ENV=development`, sin worktrees: verde, 374/4626 (lint: 0 errores).

## 6. La lección

- **Antes de cambiar «N vueltas fijas» por «hasta que llegue», preguntá qué pasaba en las vueltas
  que sobraban.** La salida temprana de `f926630` cerró `R9-290` y dejó de ver lo que el proceso
  hacía después: un verde falso nuevo que solo vio quien buscaba romperlo. Y un control que se lee
  al final de dos vueltas no dice en cuál llegó.
