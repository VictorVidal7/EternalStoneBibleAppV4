# A33 — Profecías (`app/features/prophecies/index.tsx`)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 126 (2026-11-03, en el mismo chat que la
> 125; con 2 agentes a pedido de Victor) · Estado **🐛 BUG**

> **Resultado:** 1 hallazgo (`R9-475`, P2), ninguno P0. «Memorizar» en el Hilo profético arma la clave del mazo con
> el nombre del libro en el idioma de la versión, no con el canónico que usa el resto de la app: con RVR1960
> duplica cartas y no reconoce las que ya estaban. El resto de la pantalla está bien o ya lo dijeron otras filas.

> **Cómo se midió:** el agente 2 de la 126 (`fork` en worktree, sobre `c634007`), que solo midió, después de la
> parte corta de `A32`. La sonda del hallazgo se re-midió igual en el principal:
> `_scratch/S126-sondas-agente-2/S126-a2-profeciaMazo.test.tsx.txt` (la pantalla real con RVR1960; el
> `MemoryDeckProvider` real). Dos scripts de historia: `S126-a2-idsHistoria.cjs.txt` y
> `S126-a2-ordenHistoria.cjs.txt`. Lo ya dicho por `A18`, `A25`, `A26`, `A27` y la QA de Fable (BUG-10) no se
> re-derivó.

## Hallazgos

- **`R9-475` (P2):** `index.tsx:456-461` y `:468-474`: la clave y `addCard` con el nombre de la versión
  («Génesis/3/15»); el mazo deduplica por la canónica («Genesis/3/15», `MemoryDeckContext.tsx:467-470`). Daily
  Light ya se arregló igual en `6b2c5ca2`.

## Revisado sin hallazgo

- **Los ids de las profecías:** ninguno desapareció en los 12 commits de su historia (`S126-a2-idsHistoria`): el
  progreso «{{n}} de {{total}}» y la insignia de `:156` no cuentan ids viejos.
- **El orden del catálogo (riesgo latente, sin daño hoy):** los avisos de «Profecía del día» guardan el ÍNDICE,
  no el id (`NotificationService.ts:810-830`), y el aviso abre `?start=<index>` (`PropheticReminderRouter.tsx:38`).
  Cuatro de las cinco ampliaciones insertaron en el medio (`S126-a2-ordenHistoria`), pero el orden no cambia desde
  `581e88d8` (2026-06-30), antes de cualquier usuario. La próxima que inserte en el medio haría que un aviso
  agendado por la versión vieja abra otra profecía: guardar el id lo evitaría.
- **No alcanzable:** el estado `'error'` de la carga no se muestra (`:1105`), pero solo pasaría si
  `bibleDB.initialize()` lanza, y para entonces la base ya está abierta; `markPropheciesVisited` y
  `toggleProphecyFavorite` leen y escriben sin cola, con una ventana de milisegundos.
- **Ya en otras filas:** `?start=` y el atrás (`A27`, `A26`); la hoja de originales que queda montada (`R9-435`);
  la profecía del día con horario de verano (`R9-172`).

## Sin medir

- `map.tsx` y `quiz.tsx` (fuera de la fila: el índice nombra `prophecies/index.tsx`).
- Para `A36`: `lectio.tsx:101-105` y `:233-239` arman la clave del mazo con `bookDisplay` (el comentario de `:229`
  dice que coincide con Favoritos, pero Favoritos guarda el canónico): probable gemelo de `R9-475`.

## Cruce con las filas vecinas

- `A36` (oración y lectio): el gemelo de `lectio.tsx`, arriba.
- `A40` (Daily Light): su clave ya es canónica desde `6b2c5ca2`, y es el control vivo de `R9-475`.
