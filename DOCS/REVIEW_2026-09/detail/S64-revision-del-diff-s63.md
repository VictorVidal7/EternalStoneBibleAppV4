# Sesión 64 — revisión del diff de la 63 (2026-10-06)

En un chat nuevo, en la terminal y sin agentes, con `_scratch/S64-PROMPT.md`. Sin tocar código: lo
único escrito es el ledger y las sondas de `_scratch/`.

- **Estado al empezar:** `main` = `origin/main` = `23f5b96` (el checkpoint de la 63, mergeado y
  pusheado con el OK de Victor; CI verde en el log, run `37515408752`, 374/4625, verificado en la
  63). Varios docs decían «sin mergear» para la 63: corregido aquí. `git fetch` no trajo nada más
  nuevo, así que no hizo falta mirar otro CI.
- **Qué se revisó:** `8d041c9..a95a68b` (`MemoryDeckContext.tsx`, `restoreSignal.ts`,
  `BackupService.ts`, el comentario de `SyncEngine.ts` y las dos pruebas).
- **Resultado:** **1 nuevo, P3: `R9-286`** (comentarios de la 63 que no se sostienen). Ningún
  defecto de comportamiento nuevo. Quedan 286 hallazgos, ningún P0.

## 0. Las herramientas

- **`_scratch/S64-rev.cjs.txt`:** `S63-rev.cjs.txt` con las salidas en `S64-rev-*.out.txt` (para no
  pisar las de la 63). Mismas piezas (`S63-piezas.cjs.txt`).
- **`_scratch/S64-serie.cjs.txt`:** copia `memoryDeckDisk.test.tsx` a `__tests__/S64serie.test.tsx`
  con cada entrega del modelo serie demorada K microtareas (la siguiente espera a esa), corre, y la
  borra. Con `todas`, revierte cada pieza en esa copia.
- **`_scratch/S64-sonda.cjs.txt` + `S64-sonda.body.tsx.txt`:** tres sondas agregadas al final de una
  copia de `memoryDeckDisk.test.tsx` (su modelo serie y sus ayudas), con `nada`, una pieza, o
  `base8d` (el provider de `8d041c9`). Copia, corre `-t S64`, borra y restaura.
- `git status` limpio tras cada corrida (lo imprime cada script).

## 1. Las piezas, re-medidas en el árbol de hoy

- **`node S64-rev.cjs.txt todas`** (`S64-rev-hoy-todas.out.txt`): las 45 piezas y los commits
  enteros tumban **exactamente las mismas pruebas** que en el árbol final de la 63
  (`S63-rev-final-todas.out.txt`, comparado línea a línea). Ninguna prueba tardó 1 s o más, y no
  hubo «unmounted test renderer»: no hay cuelgues escondidos.

## 2. El alta condicional (`R9-279`)

- **¿Otro escritor que toque una condicional antes de leer, sin medir?** No. Los seis que pasan por
  `edit` (`addCard`, `removeCard`, `reviewCard`, `resetDeck`, `applyRemoteUpsert`,
  `applyRemoteDelete`) los midió el agente 1 y los vigila una prueba cada uno; fuera del provider,
  solo `importBackup` escribe `@memory_deck`.
- **Una condicional que sobrevive a una carga que no es la última, y a otra que falla** (sonda
  `S64-condicional`: John de 5 repasos en disco; la lectura 1 falla, el alta de John pide la
  relectura 2, el respaldo avisa y escribe detrás; la 2 lee sin ser la última; la recarga 3 y su
  relectura 4 fallan):
  - hoy: tras la 2, John 5 en pantalla (la del disco gana); la salida escribe John 5 y Luke, y la
    cola queda vacía. Lo restaurado (Mark/9/9) se pierde: es el coste ya escrito de la salida
    («con un fallo determinista, toda opción con salida escribe el mazo de antes encima de lo
    restaurado», `detail/S63` §3);
  - con el provider de `8d041c9`: John 0 en pantalla y disco, y `W John r0` en la cola (`R9-279`).
  - **Se sostiene.**
- **Lo que sí queda, sin disparador:** tras una carga que no es la última, la condicional sigue
  marcada aunque la pantalla ya muestra la del disco. Un repaso o una baja sobre esa tarjeta antes
  de la recarga se descartan (la baja la «retira» sin lápida). Solo pasa con una edición del usuario
  durante el `multiSet` de un respaldo (la única forma de tener una carga que no es la última), y el
  usuario está en Ajustes. No se registra como defecto; el comentario de `removeCard` que lo niega
  va en `R9-286`.
- **¿Una tarjeta nueva que no sube nunca?** Tras la salida, sube con su primer repaso (la prueba
  «si las lecturas fallan siempre…» lo mira: `W John r1`). Los repasos hechos mientras era
  condicional no cuentan, y si nunca se repasa y la cuenta ya hizo su bulk push, no sube. Una
  tarjeta nueva vence al crearse (`dueAt` = ahora): en la práctica se repasa enseguida. Es la
  decisión escrita de la 63; el mismo primer repaso es el que pisa la copia de la nube de un
  versículo re-agregado, también escrito en esa prueba («Desde ahí John es del usuario»).
- **`!unsaved.has(key)`: ¿otra entrada que diga «la sé» sin ser una baja?** No. Toda entrada con
  tarjeta está en `deckRef` (cada lectura pone encima las que no son nulas; una condicional que el
  disco tiene deja la del disco), y `addCard` vuelve antes si `deckRef` la tiene. Así que, al
  llegar a esa línea, la entrada es nula: una baja (`removeCard`, `resetDeck`, `applyRemoteDelete`,
  también por `R9-282`). Retirar un alta borra la entrada.

## 3. La salida de `R9-280`

- **¿Un bucle?** No (sonda `S64-bucle`, todas las lecturas fallan): rendirse tras 2 lecturas y 1
  escritura; el respaldo y su recarga que falla, 3 lecturas, y sin edición, 5 `tick` después, sigue
  en 3; un alta, 4 lecturas y la salida. El render forzado va solo en una carga que no es la
  relectura del efecto, la relectura no fuerza, y la salida no renderiza. Igual con el provider de
  `8d041c9`.
- **La relectura y la recarga en vuelo a la vez:** la relectura se pide antes del `multiSet`, así
  que llega antes que la recarga; su `.then` ve `unread = false` (lo puso el aviso de inicio) y no
  se rinde. Lo vigilan las pruebas 6 y 12 (`ultima`, `adelanta`, `nueva`).
- **La recarga que falla siempre, con el inicio en `unread = false`:** sin edición, la pantalla
  queda en el mazo de antes y `getLocal` lanza hasta la edición siguiente (el coste escrito de
  `R9-267`); con una edición, la relectura falla y la salida escribe el mazo de antes encima de lo
  restaurado (el coste escrito de la 63). `S64-bucle` lo muestra: `Acts/1/8` y `Mark/1/1` en disco,
  sin `Mark/9/9`.

## 4. El aviso antes del respaldo (`R9-281` / `R9-278`)

- **¿Un camino que emita el inicio y no llegue al `finally`?** No: `emitBackupRestoring()` es la
  instrucción anterior al `try`. Solo un `prepMultiSet` que no termine nunca dejaría la retención y
  el `deckLoad` pendientes, y sus turnos solo esperan a AsyncStorage (`joinPrep`, `noteRelease`).
- **El provider que se monta o se desmonta entre los dos avisos:** está en la raíz de
  `app/_layout.tsx`, sin `key` ni render condicional: se monta una vez. Si se desmontara, el
  `deckLoad` pendiente no se resolvería nunca, pero el adaptador se desregistra con él.
- **El orden con el turno de la Mesa** (sonda `S64-turno`, el mazo leído, el aviso dado y la
  escritura del respaldo todavía sin pedir):
  - hoy: el provider no escribe antes del respaldo (0 escrituras, disco John y Luke), y queda
    Mark/1/1 + Mark/9/9;
  - CONTROL, `retieneRespaldo` revertida: el provider escribe John, Luke y Mark/1/1 **antes** del
    `multiSet`, y el respaldo la borra: queda solo Mark/9/9;
  - con el provider de `8d041c9`: igual que el revert. La 63 lo arregló.
  - El código está bien, pero tres comentarios y una prueba dicen que esa escritura correría
    **después** del `multiSet` y que la recarga la leería encima: es solo uno de los dos casos
    (`R9-286`).
- **¿Quién más escucha `subscribeBackupRestoring`?** Solo el mazo (`grep`). El comentario de
  `importBackup` dice que «the providers that reload on the signal below hold their writes»: falso
  para los otros tres, que es `R9-284` (`R9-286`).

## 5. Las pruebas

- **¿Alguna depende de cómo se intercalan dos entregas?** No. `enSerie` entrega con microtareas, y
  la respuesta n+1 puede llegar en medio de la cadena de la n; en el teléfono, cada respuesta llega
  en su tarea y su cadena termina antes. Con cada entrega demorada 50 microtareas
  (`S64-serie-K50-todas.out.txt`), las 32 pruebas pasan y **las 38 piezas que se corren en ese
  archivo tumban las mismas pruebas** que con el modelo de hoy (comparado sin las duraciones).
- **Las dos reordenadas en `01eee54`:** siguen construyendo su caso. La de «la relectura y la
  recarga del respaldo en vuelo» tiene sus dos controles (la relectura leyó el mazo de antes; la
  recarga se pidió con la relectura ya llegada) y la tumban `ultima`, `adelanta`, `retiene`,
  `relee`, `marca`, `encima` y `suelta`. La de «con el respaldo ya avisado» (control: 1 lectura al
  escribir) la tumban `noRelee`, `encima`, `suelta` y `vacio`. **Pero el comentario de la primera
  describe un daño que no es el que da su revert** (`R9-286`).

## 6. Los comentarios nuevos, caso por caso

Contra el código y contra la salida de cada revert (`S64-rev-<pieza>.out.txt`):

- **Se sostienen:** los de `unsaved`, `queueAdds`, `reread`, la carga que no adopta, `R9-280` en la
  rama que falla, `restoreLoad`, el del efecto, la salida (`R9-279` y `R9-264`), `R9-282`,
  `reviewCard`, `resetDeck`, el docstring de `importBackup`, `emitBackupRestored` y el de `R9-174`
  en `SyncEngine.ts` (`memoryCards` lee un ref puesto antes del render desde `R9-133`). En las
  pruebas, los de `cond`, `repasa`, `reset`, `real`, `sabe`, `ultimaMarca`, `r282`, `forzar`,
  `adelanta` (en la 12), `releeSola`, `sueltaSalida`, `leidoSalida`, `fuerza`, `retiene` y
  `espera` dicen lo que da su revert, y el del `finally` en `backupRestoreSignal.test.ts` lo midió
  el agente 3 (`SALIDA-lanza`).
- **No se sostienen: `R9-286`** (abajo).

## 7. Nuevo

- **`R9-286` (P3, comentarios; los abrió la 63):**
  - el orden con el respaldo: «a write asked for now runs after the `multiSet`» (en
    `restoreSignal.ts:69-75`, `MemoryDeckContext.tsx:318-321`, `BackupService.ts:1632-1634` y
    `backupRestoreSignal.test.ts:156-157`). Con el turno de la Mesa corre ANTES, y el respaldo la
    borra (`S64-turno`);
  - «the providers that reload on the signal below hold their writes» (`BackupService.ts:1632`) y
    «los providers retienen sus escrituras» (`backupRestoreSignal.test.ts:2-3`): solo el mazo
    (`R9-284`);
  - la prueba de «la relectura y la recarga del respaldo en vuelo» (`memoryDeckDisk.test.tsx:414`):
    dice que sin la pieza la recarga leía el mazo de antes con Mark/1/1, sin Acts/1/8 ni Mark/9/9.
    Con `ultima` o `adelanta` revertidas queda Acts/1/8 + Mark/9/9: se pierde Mark/1/1, porque la
    recarga ya está pedida cuando corre el efecto y vuelve a retener;
  - la prueba de «una baja antes de leer» (`:804`): «W John r0 y D John». Con `deshace` la cola
    lleva solo `D John`; la `W` es de `cond` (sin `R9-279` entero);
  - «added while no load had read the disk» (`ifAbsent`, `:132`), «no load has read the disk»
    (`addCard`, `:479`) y «was never seen» (`removeCard`, `:496`): durante el respaldo el mazo ya se
    había leído, y el alta es condicional a propósito (lo vigila «decide la última: gana el John
    restaurado»); y tras una carga que no es la última, la del disco ya se ve (§2).

## 8. Lo que no se hizo

- No se midió en el teléfono.
- La matriz del motor no se corrió: la 63 no cambió el motor (solo un comentario, verificado en la
  63 con el JS emitido) y la 64 no tocó código.
- Lo pendiente de siempre (§4 de `CONTINUAR.md`), `R9-284` y `R9-285` incluidos.

## 9. La lección

- **Para saber si una prueba depende de cómo el modelo intercala las entregas, separalas y re-medí
  la matriz.** Demorar cada entrega K microtareas (la siguiente espera a esa) imita al teléfono, donde
  cada respuesta y su cadena terminan antes de la siguiente. Si las piezas tumban las mismas
  pruebas, el orden de las microtareas no decide nada (`S64-serie.cjs.txt`).
- **Un comentario sobre el orden en la ventana del respaldo tiene dos casos:** el `multiSet` ya
  pedido (lo de después corre detrás y la recarga lo lee) o todavía no (el turno de la Mesa: lo de
  después corre antes, y el respaldo lo borra). La retención cubre los dos; el comentario contaba
  uno.
