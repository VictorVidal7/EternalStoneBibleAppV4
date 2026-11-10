# C20a — Memoria/SRS: integridad de datos y racha (Modo C, sesión 137)

**Estado: EN CURSO.** Agente 1, `emulator-5554`. Medido todo lo local; falta el «suelo restaurado», que necesita
una cuenta de Google de PRUEBA. Un hallazgo nuevo: `R9-556` (P3). Evidencia: `_scratch/S137-sondas-agente-1/`.

## Entorno

El de `C1a` (misma instancia, cuenta anónima, premium por la ofrenda de la cuenta del AVD).

Almacenamiento: el mazo en `@memory_deck` (RKStorage, escrito en un efecto tras cada cambio,
`MemoryDeckContext.tsx:351-378`); el registro de repasos en `review_events` de `files/SQLite/bible.db` (37 MB),
escrito aparte y sin esperar (`reviewCard`, `MemoryDeckContext.tsx:519-551`; `reviewEventStore.ts:51-77`). La
racha, la meta diaria, el heatmap y la retención salen del registro (`goals.ts:9-11`, `history.ts`); las cajas y
«Pendientes hoy», del mazo.

## Lo medido (con la lectura de `@memory_deck` y de `review_events` tras cada frío)

| Camino                                                                 | Resultado                                                |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Agregar 3 versículos (Génesis 1)                                       | ✅ 3 tarjetas, caja 1                                    |
| Calificar «Bueno»                                                      | ✅ caja 1→2 y evento `good 1→2`                          |
| Calificar y `force-stop` a 0, 150, 250, 300, 400 y 600 ms              | los dos o ninguno: coherente                             |
| Calificar «Fácil» en la última tarjeta y `force-stop` a 150 y a 220 ms | **divergen: `R9-556`**                                   |
| Racha de 3 días sembrada en `review_events` (sin tocar el reloj)       | ✅ «¡Racha de 3 días!»; el hito no se repite             |
| Estadísticas (premium)                                                 | ✅ actual 3, máxima 3, días activos 3                    |
| Quitar una tarjeta; frío                                               | ✅ sale del mazo y no vuelve                             |
| Metas: diaria 10→3, reto semanal →2; dos fríos                         | ✅ `@memory_daily_goal = 3`, `@memory_weekly_target = 2` |
| «Practicar sin calificar»: mostrar, «Siguiente», atrás, `force-stop`   | ✅ ni el mazo ni el registro cambian                     |
| Fable fila 20, BUG-5 (copy)                                            | ✅ arreglado en el dispositivo                           |

## Hallazgo

- **`R9-556` (P3):** un repaso puede quedar en el mazo y faltar en el registro, y entonces la racha y la meta no
  lo cuentan. Dos almacenes, dos escrituras asíncronas sin orden ni reconciliación (`reviewCard`,
  `MemoryDeckContext.tsx:519-551`: `edit(...)` y `void addReviewEvent(event)`). Reproducido 2 de 2 veces
  (`S137-a1-g3c-*`, `S137-a1-g3m-*`); tras el frío, 3 repasos hechos y «2/10 hoy»
  (`S137-a1-61-memoria-divergencia.png`), y en Estadísticas «Repasos 6» contra «4/10 hoy». Ver `BUGS.md`.

## Sin medir

- **El suelo restaurado** (`@memory_stats_floor`, `seedMemoryStatsFloorIfFresh`): solo se siembra con cuenta no
  anónima (`SyncEngineContext.tsx:93-103`). Con él, BUG-4 de Fable (racha actual > máxima); por lectura está
  arreglado (`history.ts:506-514` mete la racha fusionada en el `Math.max`).
- FREE en Memorización, aparte: el mazo y el registro no dependen del gating, y el toggle de dev no sobrevive al
  frío.
- La dirección inversa de `R9-556` (evento sin mazo): posible por el mismo mecanismo, no se vio.

## Receta

1. `eternalbible://features/memory` → «Agregar versículo» → «Practicar».
2. Leer `@memory_deck` (RKStorage) y `review_events` (`exec-out run-as … cat files/SQLite/bible.db` a una copia
   local, `sqlite3`, borrar la copia).
3. `R9-556`: `S137-a1-calificar-matar.sh.txt <etiqueta> <espera> Fácil` (lee la posición del botón del dump),
   esperas de 150-250 ms, repetir hasta ver el mazo avanzado sin evento.
4. Racha: `S137-a1-sembrar-racha.sh.txt` (dos eventos, ayer y anteayer, en `review_events`, con la app detenida).
