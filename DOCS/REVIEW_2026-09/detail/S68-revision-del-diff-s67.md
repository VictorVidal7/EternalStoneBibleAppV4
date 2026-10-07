# Sesión 68 — revisión del diff de la 67 (2026-10-06)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de Victor (el de
`_scratch/S68-PROMPT.md`). Sin tocar código.

- **Estado al empezar:** `main` = `origin/main` = `8915312` (la 67 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37554083093`, 3 jobs, Node v24.21.0, 374/4626). `git fetch`:
  `origin/main` sigue en `8915312`, así que no hizo falta mirar el CI. Los docs decían «sin mergear»
  para la 67: corregido aquí.
- **Rama:** `docs/review-s68-diff-s67` (solo docs), sin mergear hasta el OK de Victor.
- **Qué se revisó:** `cc4ee6d..c847d8c`, es decir `backupRestoreSignal.test.ts` (la prueba de
  `R9-287`) y `MemoryDeckContext.tsx` (los dos comentarios de `R9-288`).
- **Resultado:** 1 nuevo, P3 (`R9-289`). Quedan 289 hallazgos, ningún P0.
- **Mirada fresca:** la 66 y la 67 las escribió el mismo chat. Esta sesión es otro chat, y buscó
  romper la prueba con colocaciones del aviso que la 67 no midió y con una que lo demora sin moverlo.

## 0. Las herramientas

- `_scratch/S65-igual.cjs.txt <base>` (el de la 65) y `_scratch/S66-turno.cjs.txt` (el de la 66).
  Las salidas de la 67 de `S66-turno` con `suite` se guardaron antes como
  `S67copia-turno-<pieza>-suite.out.txt`.
- `_scratch/S68-turno.cjs.txt <pieza> [archivo|sonda|r278|suite]`, nuevo:
  - `archivo` copia `backupRestoreSignal.test.ts` a `__tests__/S68sonda.test.ts` con un registro en
    la prueba de `R9-287`: las vueltas usadas y cuántas veces se llamó a `prepMultiSet` antes de
    abrir la puerta (`jest.spyOn` sobre el módulo). Corre el archivo entero, lo borra y restaura.
  - `sonda` y `r278`: la sonda `TURNO` / `R278` del agente 3 de la 63, como `S66-turno`.
  - Piezas: las de la 66 (`inicio`, `enTurno`); `principio` (el aviso al EMPEZAR el turno, antes de
    `noteRelease`); `sinTurno` (el `multiSet` del respaldo fuera del turno: revierte `R9-273`);
    `lento` (25 vueltas de `setImmediate` antes del aviso, que sigue fuera del turno); `sinReset`
    (la prueba sin `__resetPrepAccountForTests`); `releeRetenido` (el provider relee con lo editado
    retenido aunque ninguna carga haya fallado).
  - `git status` vacío tras cada corrida. Las salidas quedan en `S68-turno-<pieza>-<modo>.out.txt`.

## 1. Solo comentarios

- `node S65-igual.cjs.txt cc4ee6d`: el provider, con la fuente distinta y el JS sin comentarios
  igual; `restoreSignal`, `BackupService` y `memoryDeckDisk`, con la fuente igual. La prueba sale
  distinta, como corresponde (la prueba nueva).
- **Control:** contra `01eee54`, el provider y `memoryDeckDisk` salen distintos.
- Las líneas tocadas del provider que no son comentario (`git diff -U0 cc4ee6d c847d8c`, quitando
  las que empiezan con `//`, `*`, `/**` o `*/`): ninguna.

## 2. La prueba de `R9-287`

- **Las corridas de la 66, re-hechas:** `S66-turno enTurno suite` da 1 de 998, y cae solo «R9-287:
  con la Mesa en su turno…», en `vistosAntesDeAbrir: []`, con los dos controles en pie.
  `inicio suite` da 3 de 998: las 3 del archivo. Lo mismo que midió la 67.
- **¿Construye el caso del turno, y cae por la razón que dice?** Sí, medido con el registro
  (`S68-turno <pieza> archivo`):

  | pieza       | vueltas | `prepMultiSet` antes de abrir | avisos antes de abrir | mazo pedido | terminado | resultado              |
  | ----------- | ------- | ----------------------------- | --------------------- | ----------- | --------- | ---------------------- |
  | (hoy)       | 1       | 1                             | `inicio: Luke/2/1`    | 0           | no        | 3/3                    |
  | `enTurno`   | 20      | 1                             | ninguno               | 0           | no        | cae solo esta          |
  | `principio` | 20      | 1                             | ninguno               | 0           | no        | cae solo esta          |
  | `sinTurno`  | 1       | 0                             | inicio y fin          | 1           | sí        | cae, por los controles |
  | `lento`     | 20      | **0**                         | ninguno               | 0           | no        | cae solo esta          |
  | `sinReset`  | 1       | 1                             | `inicio: Luke/2/1`    | 0           | no        | 3/3                    |
  | `inicio`    | 20      | 1                             | ninguno               | 0           | no        | caen las 3             |

  Hoy el respaldo llega al aviso en 1 vuelta y pide el turno (`prepMultiSet` 1 vez). Con `enTurno`,
  también pide el turno y no avisa: cae por la razón que dice.

- **Otras colocaciones del aviso que rompen el turno:** cualquiera DENTRO del turno corre después de
  abrir la puerta, así que la prueba las ve todas. Medido con dos que encierran a `noteRelease`:
  `principio` (antes) y `enTurno` (después). Con `gone` no vacío solo hay más pasos dentro del
  turno, y el turno empieza igual después de abrir: no se midió aparte. Fuera del turno, antes de
  `prepMultiSet`, la colocación es buena (lo de antes del aviso no vuelve: la semántica del respaldo,
  §3 de la 66). Después del `multiSet`, la vería la primera prueba (`inicio: John`; por lectura, no
  medido). Y si el respaldo no espera el turno (`sinTurno`), los controles lo dicen.
- **¿Depende de las 20 vueltas?** No puede dar un verde falso: con el aviso dentro del turno no hay
  aviso antes de abrir, por muchas vueltas que dé. Pero con el respaldo más lento que 20 vueltas, y
  el aviso en su lugar (`lento`), cae con **el mismo diff** que `enTurno`, y los dos `CONTROL` se
  cumplen sin que el respaldo haya pedido el turno: **`R9-289`**.
- **¿Toca el turno de las otras pruebas?** No:
  - `__resetPrepAccountForTests` pone los mismos valores con que arranca el módulo (`turn` y
    `noteTurn` resueltos, sin cuenta, sin gestionar);
  - las otras dos pruebas esperan su `importBackup`, y dejan el turno libre;
  - con `sinReset`, la prueba pasa igual;
  - la puerta se abre antes de afirmar nada. Con ninguna pieza tardó 1 s o más (las que cayeron,
    33 ms o menos), y es la última del archivo.
- **Su comentario** atribuye la consecuencia («lo que el mazo escribía mientras tanto corría antes
  del `multiSet`, y el respaldo lo borraba») a la sonda `TURNO`, y no dice que esta prueba la vea.
  Se sostiene: con `enTurno`, la sonda pierde Mark/1/1 (§5 de la 66). El de la primera prueba («Aquí
  se ve el aviso; que el mazo retiene desde él, en `memoryDeckDisk.test.tsx`») también: «un alta
  mientras el respaldo escribe…» (`memoryDeckDisk.test.tsx:466`) vigila `retieneRespaldo`.

## 3. Los comentarios de `R9-288`, caso por caso

`hydrateFromStorage` tiene tres llamadores: el montaje (`:303`), la recarga del respaldo (`:315`) y
la relectura del efecto (`:360`). Una lectura suelta lo editado solo si es la última en vuelo
(`seq === loadSeq.current`), y el aviso de inicio sube `loadSeq` sin pedir lectura.

- **«the read that lets the edits go: the first read, the one after a failed one, or a backup's
  reload»:** se sostiene. No hay otra:
  - una carga vieja en vuelo al aviso no suelta (`R9-281`);
  - durante el respaldo el efecto no relee (`unread = false` al aviso);
  - si la recarga falla, la que sigue es la relectura del efecto, es decir «the one after a failed
    one».
  - **Matiz, no registrado:** si esa relectura también falla, no suelta ninguna lectura, sino la
    salida del efecto (`:363-376`). Las condicionales se quedan y no suben, y lo dice el comentario
    de esa salida (`:365`). Es la misma presuposición que la 66 aceptó en `removeCard` (§2 de la 66),
    y la de `addCard` («the read decides») es anterior a la 65.
- **«the reload reads after it»:** se sostiene. La recarga sale del aviso de fin, en el `finally`
  que sigue a `await prepMultiSet(pairs)`, y entre el aviso de inicio y ese `await` nada lanza. Si
  el respaldo no escribe el mazo, no hay `multiSet` que leer; es el caso que la 66 dejó sin
  registrar (§3 de la 66), y el comentario dice «may».
- **«That read may find what no load has read»:** se sostiene en los tres casos. En la primera
  lectura, nadie leyó. En la relectura, la carga anterior falló. La recarga lee lo restaurado, y
  «may» cubre el respaldo que no escribe el mazo.
- **`addCard`, «the edits wait for a read (also once a backup is about to write)»:** se sostiene.
  `unsaved` no es nulo con una carga en vuelo o fallida, o desde el aviso. Con una fallida, el alta
  misma dispara la relectura (el render).

## 4. ¿Alcanza el mecanismo? (`detail/S67` §1)

- **Con el mazo leído**, el provider no toca el disco durante la espera: no escribe (`unsaved` no es
  nulo) y no relee (`unread` es falso). La única guarda es `unsaved ??=` del aviso, igual en los dos
  casos.
- **La única forma de romper solo el turno es una lectura durante la espera:** en el turno lee lo de
  antes y suelta lo editado, y la escritura que sigue corre antes del `multiSet`. Con el `multiSet`
  ya pedido, lee lo restaurado.
- Medido con `releeRetenido`:
  - en la sonda, `turnoLeido`, `turnoLee` y `turnoFalla` pierden Mark/1/1 (quedan con Mark/9/9),
    mientras que `R278` da lo mismo que hoy (`S66-turno-nada-r278`);
  - **el suite lo ve:** 3 de 998, todas en `memoryDeckDisk`. Una es «con el respaldo ya avisado, lo
    editado con el mazo sin leer no relee: espera a la recarga» (`:432`), el caso del turno con el
    mazo sin leer; las otras dos son «con la relectura y la recarga del respaldo en vuelo…» y «un
    alta tras una baja de verdad…».
- Una pieza que rompa SOLO `turnoLeido` tendría que leer o escribir solo con el mazo leído, y no hay
  nada así en el código. **El argumento de la 67 se sostiene.**

## 5. Nuevo

- **`R9-289` (P3, pruebas):** los controles de la prueba de `R9-287` no muestran que el respaldo
  haya pedido el turno.
  - Con `lento` (el aviso en su lugar, fuera del turno, pero 25 vueltas más tarde), la prueba cae con
    el mismo diff que `enTurno`: `vistosAntesDeAbrir: []`, con `mazoPedidoAntesDeAbrir: 0` y
    `terminadoAntesDeAbrir: false`. Pero `prepMultiSet` no se llamó (0).
  - Así, «CONTROL: el multiSet esperaba el turno» y «CONTROL: el respaldo seguía esperando» se
    cumplen también cuando el respaldo no llegó al turno.
  - No da un verde falso, porque cualquier aviso dentro del turno cae. Pero el rojo dice dos cosas:
    «el aviso se movió al turno» y «el respaldo no llegó en 20 vueltas».
  - Hoy alcanza con 1 vuelta, y con `enTurno` el respaldo pidió el turno (1 llamada): hoy cae por la
    razón que dice. Lo que falta es que la prueba lo muestre.
  - **¿Lo abrió la 67?** Sí, es su prueba (`8c168fb`).
  - **Arreglo (hipótesis):** un tercer control, «el respaldo pidió el turno antes de abrir», con
    `jest.spyOn` sobre `prepMultiSet` (el registro de `S68-turno` muestra que funciona), y la vuelta
    esperando ese pedido en vez del aviso. Verla caer con `lento` en el control nuevo (diff
    distinto), y con `enTurno` en los avisos con el control en 1.

## 6. Lo que no se hizo

- No se re-corrió la matriz de las 45 piezas del mazo: el provider es el mismo JS (§1).
- `gone` no vacío no se midió aparte (§2).
- Nada en el teléfono.
- `R9-284` (con la nota de la 66), `R9-285`, y lo pendiente de siempre (§4 de `CONTINUAR.md`).

## 7. La lección

- **Si una prueba espera N vueltas a que algo pase, corré la pieza que lo DEMORA más allá de N, con
  el código bueno.** Si cae igual que la regresión, a sus controles les falta el que dice que el
  caso llegó. Un `CONTROL: X esperaba` que vale 0 también cuando X nunca empezó no controla la
  espera.
