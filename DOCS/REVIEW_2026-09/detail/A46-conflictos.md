# A46 — Conflictos

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 135 (2026-11-10, chat nuevo, en la terminal,
> CON agentes a pedido de Victor: 13 en tres tandas, Opus 5.5) · Estado **🐛 BUG** (cerrada en la 135). Con ella se
> terminan las filas del Modo A.

> **Resultado:** 5 hallazgos, ninguno P0, todos P3: `R9-544` (la auditoría de conflictos pisa la resolución anterior
> del mismo documento, e Insights cuenta de menos; segunda causa, un registro de más de 1 MiB con una nota enorme),
> `R9-545` (la tarjeta no dice de qué versículo es: id interno, categoría en inglés, color en hex), `R9-546`
> («Combinar» parte en dos una colección cuyo nombre tiene coma), `R9-547` (el borrador de «Combinar» sobrevive a que
> el conflicto salga de la lista: reaparece solo y, tras un cambio de cuenta, se sube a la nube de la nueva) y
> `R9-548` (de paso: «Tienes 1 cambios locales»). Amplía `R9-469` (el «[]»).

> **Cómo se midió:** con agentes a pedido de Victor (ver `detail/A45-landings-about-explore.md`). Esta fila: agentes
> 3 (la fila entera), 7 (el modal de «Combinar»), 8 (cada colección en la tarjeta), 9 (la cuenta que cambia), 10 (la
> auditoría y las reglas), 11 (notas y resaltados entre versiones) y 13 (rótulos e idioma). El orquestador re-midió
> en el principal la sonda de cada hallazgo (todas dieron lo mismo; las del motor, re-armadas con su `armar` y
> comparadas con `cmp`) y leyó las líneas citadas. La cabecera de `conflicts.tsx:13-25` ya lleva los arreglos de
> `R9-36` y `R9-160`: no se re-derivaron (sus 9 casos están en `__tests__/conflictsScreenCurrentLocal.test.tsx`).

## Hallazgos

- **`R9-544`:** `SyncEngine.ts:3480-3501` (`.doc(record.id)`), `:3472-3477` (las tres copias). Sondas
  `S135-a3-auditoria` y `S135-a10-tamano` (el tamaño medido, el rechazo simulado).
- **`R9-545`:** `conflicts.tsx:286-352`, `:48-59`. Sondas `S135-a3-tarjeta` y `S135-a8-tarjetas`.
- **`R9-546`:** `conflicts.tsx:50`, `:169`, `:209-214`. Sonda `S135-a7-combinar` 1a/1b.
- **`R9-547`:** `conflicts.tsx:85-86`, `:137-140`, `:175`, `:198`, `:420`. Sonda `S135-a9-pantalla` (la cara entre
  cuentas); la cara con la misma cuenta, por lectura.
- **`R9-548`:** `AuthContext.tsx:784-787`. Sonda `S135-a13-rotulos` 3a.

## ✅ con su evidencia

- **La dirección inversa:** cada botón manda la elección correcta, y lo que hace el motor con «el mío», «el otro» y
  «combinar» está en `SyncEngine.test.ts` (`R9-161`, `R9-204`, `R9-153`); el doble toque ya tiene prueba (`:4144`)
  y la auditoría por id no cuenta doble (agente 3).
- **La pantalla montada:** `useConflicts` conserva la referencia (`SyncEngine.ts:3934-3941`): el `useFocusEffect`
  de `conflicts.tsx:93` solo se re-dispara cuando cambia la lista. Las tabs tienen `backBehavior="history"`.
- **La cuenta que cambia:** `start(B)` llama a `stop()` (`SyncEngine.ts:844-848`), que vacía la lista
  (`trasStop: 0, trasBeto: 0`); un id de A resuelto en la sesión de B no escribe nada (`:3305`); `logResolvedConflict`
  arma la ruta con `this.uid` antes de su primer `await` y sin `await` desde el último `isCurrent()`; `unsettled`
  y los cursores se vacían en `stop()` (agente 9, `S135-a9-motor`). El fetch de Insights en vuelo devuelve lo de la
  cuenta vieja en el motor, pero la pantalla no lo alcanza (se re-lee en cada foco y se desmonta al salir).
- **Las reglas publicadas:** permiten la escritura y la consulta de `users/{uid}/conflicts` al dueño (GET del ruleset
  `4c122e10…`, el mismo de la 133); el índice de `resolvedAt` está `READY`; `fetchResolvedConflicts` lee los 500
  más nuevos. El repo no tiene `firestore.rules` (`R9-4`). El borrado de cuenta incluye `conflicts`
  (`deleteAccountData.ts:43`; el costo es `R9-25`); el respaldo no, a propósito (agente 10).
- **Notas y resaltados entre versiones:** un cambio de versión no produce un conflicto sobre «Texto»: el `text` de
  una nota se fija al crearla y no se reescribe; los resaltados no llevan texto y su id es canónico (agente 11,
  `S135-a11-versiones`, 5/5, con un control que vería el conflicto si existiera).
- **Insights:** el cálculo por día local resiste el cambio de hora (`Math.round`); los rótulos con número tienen
  singular (`totalLabel`, `timesBadge`, `badge`); el porcentaje sale con total ≥ 3 (`conflictAnalytics.ts:196-213`).

## Ya dicho o no alcanzable (sin número)

- «Combinar» que guarda «—» es `R9-469` (con el «[]» de la 135 anotado allí); el campo que aparece con el modal
  abierto, sin número (en `R9-546`).
- Con lo local borrado aquí, solo sale «Mantener remota»: es el diseño del arreglo de `R9-161`.
- Una barra en el id del registro de auditoría (`.doc(record.id)` no pasa por `toDocId`): latente, ninguna colección
  con conflictos tiene ids con barra (agente 10).
- La retención de `users/{uid}/conflicts` (sin TTL ni limpieza; tres copias del texto del usuario): observación sin
  síntoma, para Victor; la propuesta de `R9-544` la resuelve.
- Las columnas de la actividad semanal («7 … 1 Ahora») sin etiqueta de accesibilidad (`MiniBarChart.tsx:76-113`):
  cosmético, por lectura.

## Sin medir

- La cara de `R9-547` con la misma cuenta, por `dropConflict` (por lectura).
- Dos nombres que tras partir quedan repetidos («Fe» y «Fe, esperanza»): el `split` no deduplica.
- El rechazo real del servidor a un documento de más de 1 MiB, y pegar ~350 000 caracteres en el aparato (Modo C).
- `projects.test` de la API de Rules: es un POST, no se usó.
- Si el `Modal` de la pestaña oculta se pinta sobre otra pantalla al volver a ser visible (Modo C).
- La versificación en notas, resaltados y favoritos (se guardan por número: con RV1909 en Jonás 2:1, otra cara de
  `R9-535`), y la nota sobre una selección de varios versículos que ya tenía nota (`[chapter].tsx:1740-1757`).

## Cruce con las vecinas

- `A4` (el motor) había dejado sin revisar `conflictAnalytics.ts` e `insights.tsx`: esta fila los cubre.
- `A45`: `R9-542` (el label fijo) toca también el aviso de conflictos de Ajustes, por lectura.
- `A30`: `R9-469` queda ampliado; `R9-546` es su consecuencia con una coma.
