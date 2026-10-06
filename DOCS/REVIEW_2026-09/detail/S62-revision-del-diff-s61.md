# Sesión 62 — revisión del diff de la 61 (2026-10-06)

En el mismo chat que escribió la 61, pero con **3 agentes** en worktree, a pedido de Victor («podrías
mandar unos 2 agentes o 3?»). Los agentes solo midieron y son la mirada fresca. Sin tocar código.
Revisa `6667c40..d69c529` (`57cab83` `R9-133`, `6d87069` `R9-277`, `d69c529` `R9-267`), con
`_scratch/S62-PROMPT.md`.

- **Estado al empezar:** `main` = `origin/main` = `9b78865` (la 60 y la 61 juntas, mergeadas y
  pusheadas con el OK de Victor; CI verde en el log, run `37425511083`, 3 jobs, Node v24.21.0,
  373/4603). Las 3 ramas se borraron tras `git cherry` vacío.
- **Rama:** `docs/review-s62-diff-s61` (solo docs), sin mergear hasta el OK de Victor.
- **El motor no cambió** en el diff de la 61. Sin matriz.
- **Resultado:** 5 nuevos, todos P3 (`R9-279`..`R9-283`), y `R9-278` medido. Quedan 283 hallazgos,
  ningún P0.

## 0. Los agentes

Cada uno, en su worktree desde `9b78865`, con sondas sobre el provider real y su control. Cada uno
corrió también la sonda con el `MemoryDeckContext.tsx` de `37ba5f7` (antes de la 61), para el «¿lo
abrió la 61?».

| Agente         | Preguntas                                         | Informe                    | Sondas                 |
| -------------- | ------------------------------------------------- | -------------------------- | ---------------------- |
| 1, ref y motor | 1 (`edit`) y 4 (`getLocal` que lanza, motor real) | `_scratch/S62-agente-1.md` | `S62-sondas-agente-1/` |
| 2, cargas      | 2 (`unsaved`, `loadSeq`) y 3 (la salida)          | `_scratch/S62-agente-2.md` | perdidas (ver abajo)   |
| 3, escritores  | 5 (`@memory_deck`, `R9-278`) y 6 (las pruebas)    | `_scratch/S62-agente-3.md` | `S62-sondas-agente-3/` |

- **El worktree del agente 2 se borró solo al terminar**, y se llevó su `_scratch`: el harness no lo
  dejó escribir por ruta absoluta en el árbol principal. Su informe íntegro se copió de su mensaje
  final; la sonda (`S62a2-mazo`, 29 casos) no está.
- **Lo verificado a mano por el orquestador:**
  - por lectura: la rama de `R9-280` (el `finally` sin render), la de `R9-282` y la línea de
    `SyncEngine.ts` que llama a `applyRemoteDelete` sin `getLocal`;
  - el orden serie de `R9-281` contra la traza de `S62a3-orden` (`get#2:FALLA` antes de
    `SET-RESPALDO`, y la salida detrás).

## 1. Lo que se sostiene

- **`edit` y el ref** (agente 1):
  - nadie más escribe `deck`;
  - dos `edit` en el mismo tick, un `edit` entre el `setDeck(clean)` de la carga y su render, y
    StrictMode con una carga en vuelo no pierden nada;
  - la app no usa StrictMode, y el provider no se remonta;
  - de paso, la 61 arregló la baja tras un alta en el mismo tick.
- **`getLocal` que lanza, con el motor real** (agente 1):
  - con la lectura rota todo un proceso, los 3 docs quedan como no asentados y el proceso siguiente
    los re-entrega con LWW (`37ba5f7`: la copia vieja pisaba la local);
  - el piso de lo retenido baja el cursor, así que un lote posterior no los pierde (`R9-106` ya no
    muerde aquí);
  - la cadena de lotes es por colección: una carga lenta solo demora `memoryCards`.
- **El orden de AsyncStorage** (agente 2, por lectura):
  - el paquete Java (`SerialExecutor`) es el que se compila; el «next» no es serie y no está
    activado;
  - el mock lee y escribe al llamarse;
  - el provider no tiene guarda propia contra una carga vieja que resuelva tarde: depende del
    ejecutor serie.
- **Ni bucle ni doble aplicación** (agente 2):
  - cada carga pone `unread = false`, y cada relectura necesita una edición;
  - el `Map` guarda el último valor de cada clave;
  - `deckLoad` en «leído» tras rendirse es correcto para `R9-264`.
- **Quién escribe `@memory_deck`** (agente 3): el efecto, la salida de `R9-267` (nuevo sitio de la 61) y `importBackup`. Nadie más.
- **Sin llamador:** `hydrated` (ninguna pantalla lo lee) y `resetDeck`. El «coste» del reinicio
  escrito en el cierre de `R9-267` no se alcanza hoy.

## 2. Los hallazgos

- **`R9-279`** (los tres agentes): un alta de un versículo que ya está en el disco, con el mazo sin
  leer, se pone encima y borra su progreso.
  - En la carga en frío, lo abrió `6d87069`. La nube ya lo recibía antes.
  - Tras una lectura fallida, es lo que queda de `R9-267`.
- **`R9-280`** (agente 2): con `hydrated` ya en `true`, una carga que falla no renderiza. Lo editado
  durante ella espera a otra edición. Lo abrió `d69c529`.
- **`R9-281`** (agente 3): la salida se rinde detrás del `multiSet` del respaldo. Lo abrió la 61, y
  su prueba 12 afirma lo contrario.
- **`R9-282`** (agentes 1 y 2): un borrado remoto de verdad no se anota con el mazo sin leer. Ya
  existía.
- **`R9-283`** (agente 3):
  - las pruebas 6 y 12 dependen de un orden imposible;
  - las 9 y 10 caen solo por el control;
  - `vacio` y otras seis piezas no las vigila nadie (con `vacio` revertida vuelve el daño de
    `R9-267`);
  - hay comentarios que no se sostienen: en el provider, en `SyncEngine.ts`, en el detalle de la
    61 y en la regla de la 61.
- **`R9-278`, medido** (agente 3):
  - se reproduce con el `importBackup` real y el modelo serie, no con el mock plano;
  - la 61 lo dejó igual con el mazo leído y lo achicó sin leer;
  - con `R9-275`, la ventana es más larga.

## 3. La lección

**Una puerta en una lectura que solo demora la entrega no modela el ejecutor serie.**

- La regla que escribió la 61 («una puerta por lectura, abiertas en `act` distintos») estaba
  incompleta. En el ejecutor serie, nada pedido después de una operación pendiente corre ni llega
  antes que ella. Con la puerta de la 61, la escritura del respaldo se completaba mientras la
  relectura esperaba: la prueba de la guarda `nueva` construía un orden que el teléfono no produce.
- El modelo de `S62a3-orden.test.tsx.txt` (cola serie de pedidos, cada uno corre y llega en orden)
  es el que hay que usar.
- Corregido en `CONTINUAR.md` §5 y en la memoria.

## 4. Lo que no se hizo

- No se arregló nada.
- No se volvió a correr la sonda del agente 2.
- No se midió en el teléfono cuánto dura la carga del montaje.
