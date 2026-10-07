# Sesión 66 — revisión del diff de la 65 (2026-10-06)

En un chat nuevo, en la terminal y sin agentes, con el mensaje de Victor (el de
`_scratch/S66-PROMPT.md`). Sin tocar código.

- **Estado al empezar:** `main` = `origin/main` = `8755d2b` (la 65 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37547915783`, 3 jobs, Node v24.21.0, 374/4625). `git fetch`:
  `origin/main` sigue en `8755d2b`, así que no hizo falta mirar el CI. Los docs decían «sin mergear»
  para la 65: corregido aquí.
- **Rama:** `docs/review-s66-diff-s65` (solo docs), sin mergear hasta el OK de Victor.
- **Qué se revisó:** `bfe18a0..2b05f4d`, es decir `MemoryDeckContext.tsx`, `restoreSignal.ts`,
  `BackupService.ts`, `backupRestoreSignal.test.ts` y `memoryDeckDisk.test.tsx`.
- **Resultado:** 2 nuevos, P3 (`R9-287` y `R9-288`). Quedan 288 hallazgos, ningún P0.
- **Mirada fresca:** la 65 la escribió el mismo chat que registró `R9-286`. Esta sesión es otro
  chat, y buscó romperla con la sonda `TURNO` del agente 3 de la 63 (`importBackup` y `prepWrite`
  reales), no con las pruebas que ya pasaban.

## 0. Las herramientas

- `_scratch/S65-igual.cjs.txt <base>` (el de la 65): el JS emitido sin comentarios contra `<base>`.
- `_scratch/S66-cmp-rev.cjs.txt`: por pieza, las pruebas que caen en `S64-rev-<p>.out.txt` contra
  `S65-rev-<p>.out.txt`.
- `_scratch/S66-turno.cjs.txt <nada|enTurno|inicio> [sonda|r278|suite]`: copia la sonda del agente 3
  de la 63 (`S63-sondas-agente-3/S63a3-aviso.test.tsx.txt`) a `__tests__/S66sonda.test.tsx`, corre
  `TURNO` o `R278`, la borra y restaura (`git status` vacío en cada corrida). Con `suite`, corre las
  pruebas relacionadas (`--findRelatedTests`) con la pieza puesta.
  - `enTurno` mueve `emitBackupRestoring()` DENTRO del turno de la Mesa, en `prepMultiSet`, justo
    antes de pedir el `multiSet`.
  - `inicio` lo quita (el control de la 64).
  - Las salidas quedan en `S66-turno-<pieza>-<modo>.out.txt`.

## 1. Solo comentarios

- `node S65-igual.cjs.txt bfe18a0`: en los cinco archivos, NUL 0, fuente distinta y JS sin
  comentarios igual. **Control:** contra `01eee54`, el provider y `memoryDeckDisk` salen distintos.
- El JS emitido es ciego a los tipos: un cambio solo de tipos da el mismo JS. Por eso, además, las
  líneas tocadas que no son comentario (`git diff -U0 bfe18a0 2b05f4d`, quitando las que empiezan
  con `//`, `*`, `/**` o `*/`): ninguna.
- `2b05f4d..8755d2b` solo toca `DOCS/`, así que el código de `main` es el de `2b05f4d`.
- `S66-cmp-rev.cjs.txt`: las 46 salidas de los reverts de la 65 tumban las mismas pruebas que en la
  64, con los mismos totales. Lo que afirmaba la 65 se sostiene.

## 2. Los comentarios nuevos, caso por caso

- **`restoreSignal.ts` (`subscribeBackupRestoring`), `MemoryDeckContext.tsx` (el aviso de inicio) y
  `importBackup`, el orden con sus dos casos:** se sostienen. Con el `multiSet` ya pedido, lo de
  después corre detrás; sin pedir (la Mesa tiene el turno, o el propio `prepMultiSet` anota antes
  lo que va a devolver, `noteRelease`), corre antes. La sonda lo da: `TURNO-*` hoy conserva Mark/1/1
  y `R278-agrega` también. Pero el segundo caso no lo vigila ninguna prueba: **`R9-287`**.
- **«Only the memory deck subscribes» y «the other stores … do not: R9-284»:** se sostienen. Un
  `grep` de `subscribeBackupRestoring` en `src/` da solo el mazo.
- **«Hold the writes until `emitBackupRestored`, which always follows»:** «always follows» se
  sostiene (el `finally`, y `emitBackupRestoring` no lanza). Lo de retener «hasta el aviso de fin» es
  la frase de la 63, y la 65 la dejó: el mazo retiene más, hasta que su recarga LEE. Como pauta para
  `R9-284` se queda corta: va como nota en esa entrada, POR LECTURA, sin número nuevo.
- **`backupRestoreSignal.test.ts`:** el docstring («el mazo retiene; los otros no, R9-284») se
  sostiene. El comentario de la primera prueba dice la consecuencia de los dos casos, y la prueba
  solo ve el mecanismo con el turno libre. Así ya era con la 63 (la consecuencia del primer caso la
  muestra `r281todo`), pero la del segundo no la muestra ninguna prueba (`R9-287`).
- **`memoryDeckDisk.test.tsx:414`** («se perdía Mark/1/1 … quedaban Acts/1/8 y Mark/9/9»): se
  sostiene. Con `ultima` y con `adelanta`, en pantalla y en disco falta solo Mark/1/1
  (`S65-rev-ultima`, `S65-rev-adelanta`).
- **`memoryDeckDisk.test.tsx:804`** («D John: una lápida para la tarjeta de 5 repasos»): se
  sostiene. Con `deshace`, la cola es `["D John/3/16"]` y el John de 5 repasos sale del disco
  (`S65-rev-deshace`). Con `cond`, `W John r0` y `D John`, como dijo la 64.
- **`ifAbsent`, «Each read keeps the card it finds, and the one that lets the edits go sends those it
  does not find to the cloud»:** se sostiene. Cada lectura que parsea salta las condicionales que
  encuentra. `missing` sale de `ifAbsent` al llegar, y solo la última carga en vuelo llama a
  `queueAdds`; sin mazo en disco, o con un valor que no es JSON, `missing` son todas. La salida de
  `R9-212` no es una lectura y no sube nada.
- **`ifAbsent` y `addCard`, «no load had read the disk as it is now (… or while a backup
  writes)»:** no se sostiene en el turno. Ahí el mazo ya leyó el disco como está, y el alta es
  condicional porque el respaldo lo va a cambiar: **`R9-288`**.
- **`removeCard`, «Only while a backup writes can an earlier read have shown the disk's card; the
  backup's reload decides then»:** se sostiene.
  - Fuera de un respaldo, una sola carga está en vuelo a la vez. La relectura del efecto solo empieza
    con `unread`, que pone el fallo de la última carga, y `hydrateFromStorage` lo baja al empezar.
    Solo la del montaje, la del efecto y la recarga del respaldo llaman a `hydrateFromStorage`, y la
    app no usa `StrictMode`, así que la del montaje corre una vez. Una lectura que no es la última, y
    por tanto deja una condicional mostrando la del disco, solo pasa durante un respaldo.
  - Un matiz, no registrado: si la recarga falla, decide la lectura siguiente. Con solo la baja de la
    condicional, `unsaved` queda vacío y nada relee hasta otra edición (la forma de `R9-267`). La
    primera frase del comentario («the read that lets the edits go decides») ya lo cubre.

## 3. ¿Hay un tercer caso del orden?

- **Una escritura del mazo ya en vuelo cuando llega el aviso** (la pregunta de Victor): se pidió
  antes que el `multiSet`, y en el ejecutor serie corre antes. El `multiSet` la reemplaza, y la
  recarga adopta lo restaurado. Lo editado antes del aviso no está en `unsaved` (que nace en el
  aviso), así que no vuelve. Es la semántica del respaldo («lo editado antes de la carga no vuelve
  encima de lo que lee (el respaldo reemplaza el mazo)» lo vigila), y no es un caso de «lo pedido
  desde ahora». En la traza de `turnoLeido`, la escritura del provider de John+Luke va antes de
  `pide-respaldo`.
- **Dentro del turno, después del `multiSet`** (`R9-275`: el respaldo devuelve la Mesa de una cuenta
  borrada): lo pedido ahí corre detrás del `multiSet`, y es el primer caso.
- **El respaldo no escribe el mazo** (la exportación lo marcó degradado, o `pairs` vacío): el aviso
  sale igual y el mazo retiene. La recarga lee el disco sin cambios y pone lo editado encima: no se
  pierde nada. Con el `multiSet` fallando, igual (el caso `SALIDA-falla` de la 63). «The backup is
  about to write the deck» no es cierto ahí, pero no hay daño. No se registra.
- **El hueco entre el aviso y el pedido del `multiSet` con el turno libre** (`turn.then(fn)`, una
  microtarea): ninguna escritura del provider cabe ahí, porque todas salen de un efecto.
- Resultado: no hay un tercer orden con daño.

## 4. Lo que la 65 no tocó y dice lo mismo

Un `grep` en `src/` y `__tests__/` buscó el orden de la ventana del respaldo, «providers», `R9-278`,
«detrás del», «retien» y «runs after».

- **Se sostienen:**
  - los de `R9-28` en `restoreSignal.ts` (cabecera), el docstring de `importBackup`,
    `DataSettings.tsx` y los tres providers: hablan de releer DESPUÉS del respaldo, no de retener, y
    la ventana del `multiSet` es `R9-284`;
  - en `memoryDeckDisk`, los comentarios de orden de las pruebas (`:450-452`, `:484`, `:518`,
    `:691`, `:703`): cada uno dice el orden que construye su prueba. El de `:434` es justo el caso
    del turno, con el aviso emitido a mano y el mazo sin leer (lo vigila `noRelee`);
  - `MemoryDeckContext.test.tsx:171` («lo que hace `importBackup`») no emite el aviso de inicio. Es
    de `R9-28`, y esas pruebas no lo necesitan.
- Nada más afirma que «los providers» retienen.

## 5. Nuevo

- **`R9-287` (P3, pruebas):** el caso del turno no lo vigila ninguna prueba.
  - Con `enTurno`, la sonda pierde Mark/1/1 en `turnoLeido`, `turnoLee` y `turnoFalla`, como con
    `inicio`. Hoy lo conserva.
  - `R278` da lo mismo con `enTurno` que hoy: la pieza solo rompe el turno.
  - El suite relacionado pasa entero con `enTurno` (125 suites, 997/997). CONTROL: con `inicio`,
    caen 2.
  - ¿Lo abrió la 65? No: la colocación sin prueba es de la 63 (`01eee54`). Su agente 3 midió `TURNO`
    en la sonda (`_scratch/S63-agente-3.md`: con `inicio`, los tres casos con edición pierden
    Mark/1/1), pero no pasó a ser una prueba del suite. La 65 escribió el caso en cuatro comentarios,
    y en el de la prueba lo da por visto.
- **`R9-288` (P3, comentarios):** «the disk as it is now» no se sostiene en el turno.
  - En `turnoLeido`, el mazo leyó John+Luke, y al agregar, el `multiSet` no estaba pedido.
    CONTROL: en `R278-agrega` estaba pedido, y lo de ahora es lo restaurado.
  - ¿Lo abrió la 65? Sí: es su redacción del arreglo de la última viñeta de `R9-286`.

## 6. Lo que no se hizo

- No se midió en el teléfono, y no se corrió `validate`: no hubo cambios de código.
- No se re-corrió la matriz de las 45 piezas: el JS es idéntico, y las salidas de la 65 se cotejaron
  con las de la 64.
- No se registró el posible push de una condicional por `pullAllLocal`. Haría falta que espere una
  carga vieja que llega después del aviso (POR LECTURA); sin disparador (una carga en vuelo al
  empezar un respaldo).
- Lo pendiente de siempre (§4 de `CONTINUAR.md`), con `R9-284` y `R9-285`.

## 7. La lección

- **Cuando un comentario cuenta un segundo caso, buscá la pieza que conserva el primero y rompe el
  segundo, y mirá si el suite la ve.** `R9-286` se arregló escribiendo el caso del turno, pero mover
  el aviso dentro del turno deja intacto el caso que vigilan las pruebas y pierde lo editado en el
  otro, con el suite verde (`R9-287`). Y el JS emitido es ciego a los tipos: complementá el
  comprobador con las líneas tocadas que no son comentario.
