# A34 — Journeys + «Tu camino» (`app/features/journeys/`, `app/features/journey/`)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 127 (2026-11-03, chat nuevo; con 6 agentes a
> pedido de Victor, 2 en esta fila) · Estado **🐛 BUG** (cerrada en la 127)

> **Resultado:** 3 hallazgos, todos P3, ninguno P0: `R9-486` (la vista previa de una parada no sigue a la versión),
> `R9-487` («Tu camino» dice que empezaste un día antes al oeste de UTC) y `R9-488` (plurales y separador de
> miles). Los datos de las 35 paradas están completos y coherentes en los dos idiomas; el progreso y los favoritos
> leen bien un JSON malo.

> **Cómo se midió:** dos agentes (`fork` en worktree, sobre `98b5078`) que solo midieron: el 5, Journeys
> (`journeys/index.tsx` 277 L, `[routeId].tsx` 805 L, `src/features/study/journey*.ts`); el 6, «Tu camino»
> (`journey/index.tsx` 1195 L, `journeyRecap.ts` 399 L, `periodRecap.ts` 225 L). Cada sonda de un hallazgo se
> re-midió igual en el principal (la de `R9-487` con `TZ=America/Mexico_City`). Informes y sondas en
> `_scratch/S127-sondas-agente-{5,6}/`. Lo ya dicho por `A7`/`R9-30` (respaldo), `A11` (rachas, `day-key`), `A22`
> (compartir), `A25` (colores), `A26` (el atrás), `A30` (`as JourneyRouteId`) y Fable (áreas 33 y 50, `BUG-11`
> cerrado) no se re-derivó.

## Hallazgos

- **`R9-486` (P3):** `[routeId].tsx:130-131`, `:226-252`: `previewText` por parada, sin la versión; tras cambiarla
  en el lector y volver (la ruta queda montada, medido con `renderRouter`), el texto viejo bajo el chip nuevo.
  Familia de `R9-430`.
- **`R9-487` (P3):** `journeyRecap.ts:187-191`, `dayStringToMs` con `Date.parse` (medianoche UTC) sobre un día
  local: en México, «desde el 16 de junio» para quien empezó el 17. El hermano `periodRecap.ts:113-119` lo hace
  bien.
- **`R9-488` (P3):** «1 favoritos» (`journey/index.tsx:466`), «1» días activos (`:331-332`), y en la tarjeta que
  se comparte del recap por período (`PeriodRecapModal.tsx:102-137`), `String(n)` sin separador y «1 reading
  days».

## Revisado sin hallazgo

- **Paradas:** `S127-a5-paradasDatos.test.ts.txt`, 2/2, `PROBLEMAS []`: 5 rutas con título y textos en los dos
  idiomas; 35 paradas con id único, título y nota en los dos; `echoNote` en los dos o en ninguno; cada referencia
  existe en RVR1960 y WEB de `assets/bible-seed.db`; la tabla entera (`S127-a5-paradasDatos.tabla.txt`) leída: cada
  nota habla de su versículo, y la inglesa dice lo mismo. Los ids no cambiaron desde 2026-07-01 (`2b6b9a8a` solo
  reordenó las de Pablo); la insignia cuenta solo ids reales y no se entrega dos veces
  (`AchievementService.ts:622-635`).
- **JSON viejo o malo:** `journeyProgress.ts:16-27` y `journeyFavorites.ts:15-26` devuelven vacío ante `null`, un
  no-array o un parse que lanza, y descartan lo que no es texto. `journeyMap.ts`, geometría pura.
- **La lista** (`journeys/index.tsx:58-68`) relee el progreso en cada foco, sin deps que falten. Idioma: títulos,
  notas y narración salen de `t` en cada render; la voz sigue al idioma (`:279-281`). `BUG-11`: hoy «cinco grandes
  rutas» (`translations.ts:3374`, `:9924`).
- **«Tu camino»:** la carga (`:164-220`) con error y «Reintentar», recarga al llegar `achievementService`, y la
  sync con la pantalla abierta vuelve a la misma diapositiva (tope en `:595-597`). Usuario nuevo: estado vacío con
  «Ir a la Biblia» (`:772-799`; `journeyRecap.test.ts:100`). Dos toques avanzan dos, con tope (`:615-620`); el
  atrás sale (`A26:115`). Libros por `getBookByName` (`:409-415`, `:448-453`, `:677-686`); un ánimo viejo no cae
  (`:499-501`). Compartir con guarda `sharing` (`:623-651`). Recap por período: medianoche local, bordes de año y
  trimestre, período vacío (`periodRecap.test.ts`).

## No alcanzable

- Marcar parada y favorito sin cola: un toque, una escritura; dos toques humanos no caben en la ida y vuelta de
  AsyncStorage (el veredicto de `A33` para los gemelos de profecías). La carga contra un toque inmediato:
  AsyncStorage atiende en orden. Doble toque en el chip o el mapa: el lector es una pestaña de una sola ruta
  (`A26`); «Compartir mapa» con guarda. `daysSinceStart` (`journeyRecap.ts:306-310`): mismo error que `R9-487`, no
  se muestra. Dos `loadRecap` fuera de orden: resuelven en orden.

## Sin medir

- **Modo C:** doble toque en el chip «Parte del hilo» (`[routeId].tsx:223`, push a profecías) y en una tarjeta de
  la lista (`journeys/index.tsx:76`): familia de `R9-474`, depende de la animación de entrada.
- El ánimo «del año» sale de los últimos 84 días como mucho (`FEELINGS_RETENTION_DAYS`): diseño; como rótulo, P3 a
  lo sumo. Favoritos de antes del Sprint 58 sin canonizar (partirían el libro favorito): sin usuarios con esos
  datos. Los estilos de `journey/index.tsx:940-1195` y sus 19 colores fijos (de `A25`).
- **Pendiente:** las plantillas premium del modal del recap al perder el premium (`useShareImage.ts:72-77`, el
  hueco de `R9-443`); `useNarratedWalkthrough` (mockeado; sus «sin medir» de la 124). `@journey_*` no entra al
  respaldo (`R9-30`) ni se borra al eliminar la cuenta (del dispositivo, como `@prophecy_*`).

## Cruce con las filas vecinas

- `A32`: `R9-486` y `R9-478` son la misma familia (`R9-430`), encontrados por separado.
- `A11`: `R9-487` es un día local leído como UTC, como el `day-key` que `A11` cerró en el log; acá en la lectura.
- `A33`: los gemelos de profecías (sin cola) con el mismo veredicto.
