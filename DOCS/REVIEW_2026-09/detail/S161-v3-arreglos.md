# S161 — Lo que quedaba de la V3: `R9-52` y la tanda 1 de `R9-30`

> **Sesión 161 (2026-11-17).** Chat nuevo, en la terminal, con **Opus 5.5 de principal**, esfuerzo `high`, y **5
> agentes a pedido de Victor**. Los cinco: `general-purpose`, Opus 5.5, `high`, cada uno en su worktree (diseñan
> arreglos y pruebas: §7). Sin emulador: nada está medido en vivo.
>
> **Resultado.** `fix/s161-v3`, 7 commits sobre `dd0d9f6b`. `R9-52`, arreglado en parte (las notas y la
> autoevaluación). `R9-30`, la tanda 1: 13 claves viajan. Los dos siguen abiertos. Dos hallazgos nuevos: `R9-600`
> (P2) y `R9-601` (P3). Validate verde: 400/400 suites, 4914/4914 pruebas.

## 1. Estado de partida y reparto

main = origin/main = `dd0d9f6b`, como pedía el mensaje. Validador: 0 y 0; 275 abiertos de 599. Las reglas comunes
de los agentes: `_scratch/S161-AGENTES.md`.

| Agente | Rama del agente    | Alcance                                                                    |
| ------ | ------------------ | -------------------------------------------------------------------------- |
| 1      | `fix/s161-r9-52`   | `R9-52`: stores, hermanos, llamadores, texto y pruebas                     |
| 2      | `fix/s161-r9-30-a` | `@fact_favorites_v1`, `@journey_favorites_v1`, `@journey_progress_v1`      |
| 3      | `fix/s161-r9-30-b` | `@prophecy_favorites_v1`, `@prophecy_progress_v1`, `@quiz_stats_v1`, niños |
| 4      | `fix/s161-r9-30-c` | `@feelings_log`, `@devotion_log`, `@faith_testimony`, `@devotional_saved`  |
| 5      | `fix/s161-r9-30-d` | `@prayer_requests_v1`, `@prayer_log`                                       |

Cada agente de `R9-30` hizo dos commits: el código con sus pruebas, y aparte las dos listas. El principal integró
las listas a mano en un solo commit. Antes de integrar, el principal comprobó en cada worktree la rama, los commits
y el árbol limpio, y releyó los escritores con `grep`.

## 2. `R9-52`: el daño con HEAD

Sonda del agente 1, con el store real y `setItem` rechazando:

| Función                                                                  | Con HEAD         | Ahora     |
| ------------------------------------------------------------------------ | ---------------- | --------- |
| `savePrepNote`                                                           | resuelve         | rechaza   |
| `setPrepSelfReviewQuestion`                                              | resuelve         | rechaza   |
| `savePrepIllustrationTitle`, `renamePrepSeries`, `saveSermonNoteSession` | resuelven        | sin tocar |
| `create*` de ilustraciones, series y sermón                              | devuelven `null` | sin tocar |

Los bancos tienen otra forma: su cola ya es la del diseño, y los `save*` tragan con un `.catch` explícito y
documentado. Tienen 31 llamadores. Quedan para otra tanda: es lo que deja abierto `R9-52`.

## 3. Los arreglos

| Commit     | Qué                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `0743ab8b` | `R9-30`: prueba que vigila que las marcas de estudio relean el disco (sin código: ya lo hacían)         |
| `c62450e0` | `R9-30`: lo mismo para profecías, quiz y niños                                                          |
| `8018a8ba` | `R9-30`: lo mismo para los pedidos y el registro de oración                                             |
| `994365a7` | `R9-30`: el devocional y el testimonio releen tras restaurar (`subscribeBackupRestored`)                |
| `3041db99` | `R9-30`: las 13 claves a `LOCAL_BACKUP_KEYS` y fuera de `PENDING_R9_30`; cuatro pruebas de ida y vuelta |
| `732974bb` | `R9-52`: los dos stores rechazan; los seis llamadores avisan; el texto `prepTable.saveError`            |
| `f44364f0` | `R9-52`: la prueba del flush fallido, que pasaba sin el aviso (el autoguardado ponía el toast)          |

**Por clave (`R9-30`).**

- Escritor único que relee el disco, y nada montado reescribe: las 11 claves de los agentes 2, 3 y 5, y
  `@feelings_log` y `@devotion_log`.
- `@faith_testimony`: el store relee, pero el editor `testimony/[id].tsx` guarda cada campo entero desde memoria.
  Con HEAD, «antes RESTAURADO» quedaba en «antes PRE y». Ahora cancela los guardados pendientes y recarga.
- `@devotional_saved`: `devotional/index.tsx:275` escribía la lista en memoria. Con HEAD, la restaurada quedaba en
  `["PRE-import"]`. Ahora relee la lista (no el borrador).
- Ninguna de las 13 la escribe una sincronización ni un logro.

**`R9-52`, los llamadores.** `app/features/prep/index.tsx`: `flushDrafts` (:1021) devuelve `false` con un fallo, y
el banco (:1049) y el púlpito (:1069) no navegan; el autoguardado (:1109), el blur (:1159) y la autoevaluación
(:1182) hacen `.catch(reportSaveError)`. `reportSaveError`: un toast por ráfaga (calla 10 s tras el último).
`illustrations/index.tsx:236`: `try/catch`, sin toast de éxito ni `router.back()`. Ninguno en `src/`.

**Dos decisiones del agente 1, aceptadas.** Un flush fallido no navega: si no, abre una pantalla que lee las notas
sin el borrador. Los 10 s de la ráfaga son más largos que los 3 s del toast.

## 4. Revert por pieza

Del agente, cada una restaurada con `git diff` vacío. Del principal, dos re-medidas sobre lo apilado.

| Pieza revertida                                   | Cae                                                           | Quién     |
| ------------------------------------------------- | ------------------------------------------------------------- | --------- |
| `prepNotesStore.ts` de `dd0d9f6b`                 | 4 pruebas: «resolved instead of rejected» (2), «calls: 0» (2) | principal |
| `BackupService.ts` de HEAD (sin las 13 claves)    | 5 suites, 8 pruebas: `Received: undefined`                    | principal |
| La cola de notas hereda el fallo                  | «rejected instead of resolved»                                | agente 1  |
| Autoevaluación, las dos piezas                    | las mismas, y el toast de ráfaga en 0                         | agente 1  |
| Sin el corte de ráfaga / un toast para siempre    | «Expected: 1, Received: 3» / «Expected: 2, Received: 1»       | agente 1  |
| `flushDrafts` que navega igual                    | `mockPush` «calls: 1»                                         | agente 1  |
| Ilustraciones sin `return`                        | `toast.success` «calls: 1»                                    | agente 1  |
| Stores mutados a escribir desde memoria (2, 3, 5) | lo restaurado se pierde (`["old"]`, `Received: 1`, `[]`)      | agentes   |
| Suscripción del devocional                        | `Received: ["PRE-import"]`                                    | agente 4  |
| Suscripción del testimonio / solo los `cancel()`  | «antes PRE y» / «antes PRE tecleado»                          | agente 4  |

Las pruebas de «no hace falta código» (agentes 2, 3 y 5) se vieron caer con una mutación, no con un revert: no
había arreglo.

## 5. Hallazgos nuevos

- **`R9-600` (P2).** Insertar una ilustración con la lectura de `@prep_notes` fallida borra la prosa de la sección,
  con toast de éxito. Medido por el agente 1 en la pantalla real. La causa: `getAllPrepNotes` devuelve `{}`.
- **`R9-601` (P3).** Cinco stores (marcas de estudio, travesías, profecías y niños) leen «vacío» con la lectura
  fallida, y el toque siguiente lo escribe. Medido en `factFavorites`; los otros, por lectura.
- **Sin numerar, para la 162.** `recordTodayPrayer` (`prayerLogStore.ts:55`) se traga el fallo de escritura, con
  la forma de `R9-52`. Un sello de racha: no se numera solo.

## 6. Sin medir

- Todo, sin emulador.
- Una escritura en vuelo durante la importación (ventana de milisegundos), en las 13 claves.
- Las pantallas que solo leen (rachas, profecías, niños) muestran lo viejo hasta volver a entrar; no escriben.
- Niños: un archivo con el progreso y sin la insignia (export degradado) puede dejar «Primera historia»
  bloqueada. Propuesta del agente 3: `>= 1` en `[storyId].tsx:241`. Va con `R9-30`.

## 7. Estado al cerrar

- Validador: 277 abiertos de 601 (0 P0, 11 P1, 89 P2, 176 P3 y un aviso); 0 avisos y 0 errores.
- `fix/s161-v3` (7 commits) y `docs/review-s161` (encima) esperan el OK de Victor para un solo ff.
- Las ramas de los agentes y sus worktrees se borran tras el merge.
- La 162: la tanda 2 de `R9-30` (la Mesa) y lo que queda de `R9-52` (los `save*` de los bancos), con `R9-600`.
