# S162 — La V3 que quedaba: los bancos de `R9-52`, la tanda 2 de `R9-30` y `R9-600`

> **Sesión 162 (2026-11-17).** Chat nuevo, en la terminal, con **Opus 5.5 de principal**, esfuerzo `high`, y **3
> agentes a pedido de Victor**. Los tres: `general-purpose`, Opus 5.5, `high`, cada uno en su worktree (diseñan
> arreglos y pruebas: §7). Sin emulador: nada está medido en vivo.
>
> **Resultado.** `fix/s162-v3`, 6 commits sobre `168ca40a`. `R9-52` y `R9-600`, arreglados. `R9-30`, la tanda 2:
> dos claves de la Mesa viajan; `@sermon_notes` no pasa. Validate verde: 405/405 suites, 4971/4971 pruebas.

## 1. Estado de partida y reparto

main = origin/main = `168ca40a`, como pedía el mensaje. Validador: 0 y 0; 277 abiertos de 601. Las reglas comunes
de los agentes: `_scratch/S162-AGENTES.md`.

| Agente | Rama del agente     | Alcance                                                                      |
| ------ | ------------------- | ---------------------------------------------------------------------------- |
| 1      | `fix/s162-r9-30-me` | `R9-30` tanda 2: `@prep_illustrations`, `@prep_self_review`, `@sermon_notes` |
| 2      | `fix/s162-r9-52-b`  | `R9-52`: los `save*` de ilustraciones, series y sermón, y sus llamadores     |
| 3      | `fix/s162-r9-600`   | `R9-600`: lectura estricta para quien lee y escribe encima                   |

Antes de integrar, el principal comprobó en cada worktree la rama, los commits y el árbol limpio. Las sondas del
agente 2 se copiaron a `_scratch/S162a2-*`.

## 2. El daño con HEAD

| Pieza                                                      | Con HEAD                                    | Ahora               |
| ---------------------------------------------------------- | ------------------------------------------- | ------------------- |
| 13 `save*`/`rename*`/`remove*`/`move*`/`delete*` de bancos | resuelven                                   | rechazan            |
| `create*` de los tres bancos / `addPrepSeriesPassage`      | `null` / `false`                            | rechazan            |
| Agregar a una serie con `setItem` rechazando               | `Agregado a "Efesios"` y vuelve; disco `[]` | toast de error      |
| Insertar ilustración con la lectura de notas fallida       | borra la prosa; éxito 1, vuelve 1           | error, no escribe   |
| Mesa: carga fallida y tecleo                               | «Lo tecleado» pisa la prosa                 | estado de error     |
| Mesa: relectura fallida al volver                          | guarda solo « Y más.»                       | campos como estaban |
| Editor de ilustraciones durante una restauración           | «titulo PRE y» pisa lo restaurado           | cancela y recarga   |
| Respaldo: `@prep_illustrations`, `@prep_self_review`       | no viajan                                   | viajan por cuenta   |

## 3. Los arreglos

| Commit     | Qué                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `dcbd9ced` | `R9-52`: los tres bancos rechazan; 24 llamadores avisan; `useSaveErrorToast`; `sermonNotes.saveError`   |
| `4acd1834` | `R9-600`: `getAllPrepNotes`/`getPrepNotes` con `{strict: true}`; el banco de ilustraciones lee estricto |
| `39ddedd8` | `R9-600`: la Mesa lee estricto al cargar y al volver                                                    |
| `652a6a58` | `R9-30`: el editor de ilustraciones escucha `subscribeBackupRestored` (cancela pendientes y recarga)    |
| `67c04b31` | `R9-30`: ilustraciones y autoevaluación en la sección `prep`, por cuenta y en turno; fuera de `PENDING` |
| `57cf23e4` | Integración: la prueba de la restauración monta el editor con el toast que trajo `R9-52`                |

**`R9-52`.** La cola de `mutate` ya era la del diseño de la 161: se quitaron los `.catch` que tragaban. Los
`create*` rechazan: `null` seguía significando «vacío», y un fallo de disco pide otro mensaje. Los llamadores: 24,
no 31 (la 161 contó llamadas del grep). Uno solo calla: la limpieza de una ilustración en blanco, que el usuario no
pidió. `reportSaveError` salió de la Mesa a `src/hooks/useSaveErrorToast.ts`, con la misma ráfaga de 10 s.

**`R9-600`.** Solo tres lecturas alimentan una escritura: el banco, la carga y la relectura de la Mesa. Los demás
lectores solo muestran, dan «no encontrado» sin editar, o ya lanzaban (`joinPrep`). La relectura dentro del turno de
`savePrepNote` ya era segura: se fijó con una prueba, sin código.

**`R9-30`.** Viajan en `payload.prep` con dos campos opcionales: un archivo sin el campo no toca nada, como
`notes`. La autoevaluación decía «fuera del respaldo a propósito»: se pasó porque el mensaje de la sesión la pedía;
revertirla son unas líneas de `BackupService.ts`. `@sermon_notes` no pasa: es la pantalla gratis de apuntes, con
una clave para todas las cuentas. Pasarlo por cuenta pide una migración (`@prep_by_account` ya vale `1`), o
`LOCAL_BACKUP_KEYS` con la suscripción de `sermon-notes/[id].tsx:137-143`.

**La integración.** Los siete commits entraron sin conflictos. Validate cayó en 2 pruebas: el editor ahora usa
`useToast` (agente 2) y la prueba del agente 1 no tenía provider. Se agregó el mock y un control: un guardado que la
restauración cancela no da toast de error.

## 4. Revert por pieza

De los agentes, cada pieza restaurada con `git diff` vacío (tablas en sus informes; las del agente 2, en
`_scratch/S162a2-revert.out.txt`). Del principal, sobre lo apilado, cada archivo devuelto a `168ca40a`:

| Archivo revertido                  | Pruebas corridas                                          | Caen |
| ---------------------------------- | --------------------------------------------------------- | ---- |
| `prepIllustrationsStore.ts`        | `prepStoreWriteFailure`, `prepIllustration*`              | 15   |
| `prepSeriesStore.ts`               | `prepStoreWriteFailure`, `prepSeries*`                    | 17   |
| `sermonNotesStore.ts`              | `prepStoreWriteFailure`, `sermonNotes*`                   | 11   |
| `prepNotesStore.ts`                | `prepNotesStrictRead`, `prepTableScreenStrictRead`, lista | 5    |
| `BackupService.ts`                 | `backupPrepBanksRoundTrip`, `backupKeyCoverage`           | 5    |
| La suscripción del editor (neutra) | `prepIllustrationEditorRestoreSignal`                     | 2    |

Una pieza no cae: el `catch` de la limpieza callada. La promesa del store ya tiene manejador (la cola), así que no
hay `unhandledRejection`; queda como defensa.

## 5. Para la 163, sin numerar y sin medir

- La Mesa (`prep/index.tsx`) guarda borradores de `@prep_notes` en memoria y no escucha la señal de restauración.
  Con la Mesa montada debajo de Ajustes, un borrador pendiente podría pisar una sección restaurada. Medir.
- `prepSeriesExport.ts:197`: con la lectura de notas fallida exporta la serie sin notas, en silencio. No escribe.
- `@sermon_notes`: va con las claves que no son de la Mesa (§3).

## 6. Sin medir

- Todo, sin emulador.
- Una importación que sigue corriendo mientras el usuario vuelve al editor de ilustraciones.
- El toast de un flush al desmontar con la pantalla ya cerrada.

## 7. Estado al cerrar

- Validador: 275 abiertos de 601 (0 P0, 10 P1, 88 P2, 176 P3 y un aviso); 0 avisos y 0 errores.
- `fix/s162-v3` (6 commits) y `docs/review-s162` (encima) esperan el OK de Victor para un solo ff.
- Las ramas de los agentes y sus worktrees se borran tras el merge.
