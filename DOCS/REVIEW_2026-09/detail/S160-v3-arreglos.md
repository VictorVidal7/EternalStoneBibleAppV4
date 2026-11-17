# S160 — Arreglos de la tanda V3 (respaldo y la Mesa)

> **Sesión 160 (2026-11-17).** Chat nuevo, en la terminal, con **Opus 5.5 de principal**, esfuerzo `high`, **sin
> agentes**. Sin emulador: nada está medido en vivo.
>
> **Resultado.** Tres arreglos en `fix/s160-v3`, en dos commits: `R9-129` con `R9-131` (`501bb70a`), y `R9-60` con
> `R9-117` (`90f67a46`). `R9-30` queda abierto: su raíz ya tiene guarda (una lista única vigilada por una prueba), y
> 47 claves esperan en la lista pendiente. `R9-52` va a la 161 con su diseño (§5). Validate verde: 389/389 suites,
> 4886/4886 pruebas. La sesión paró por el tope de ~100 llamadas: el cierre lo hace `S160-CIERRE-PROMPT.md`.

## 1. Estado de partida

main = origin/main = `4a5136b5`, como pedía el mensaje. Validador: 0 avisos y 0 errores; 279 abiertos de 599.

## 2. El daño con HEAD (una sonda por entrada)

Sondas en `_scratch/S160-sondaA.test.ts.txt`, `S160-sondaB.test.ts.txt` y `S160-sondaC.test.tsx.txt` (fuera de
`testMatch`).

| Entrada           | Con HEAD                                                                                             | Control                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `R9-129` export   | `degradedSections: []`; el import corre `DELETE FROM review_events` 1 e `INSERT` 0                   | lectura sana: 1 y 1                                 |
| `R9-129` sembrado | piso y aviso sembrados con la lectura fallida                                                        | lectura sana: no siembra                            |
| `R9-129` agregado | **nuevo**: `maybeWriteMemoryStatsSummary` pisa el doc de la nube con el piso solo (`recentDays: {}`) | sana: escribe los eventos                           |
| `R9-30` / `R9-60` | 23 claves de contenido no viajan (las 3 de `R9-60` entre ellas)                                      | `@prep_notes` válido sí viaja                       |
| `R9-117`          | la memoria sigue con «nota PRE-import» tras la señal                                                 | la nube recibe lo restaurado (`R9-102` ya lo acotó) |
| `R9-52`           | `savePrepNote` resuelve con `setItem` rechazando; nada guardado                                      | —                                                   |

El daño nuevo de `R9-129` (el agregado de la nube) no estaba escrito: la escritura es un `.set()` total.

## 3. Los arreglos

- **`R9-129` (`501bb70a`).** `getAllReviewEvents({strict: true})` relanza, como los cuatro libros de `R9-49`. Lo
  usan los tres llamadores que leen `[]` como un hecho: el export, el sembrado y la escritura del agregado. Las
  pantallas siguen con `[]`.
- **`R9-131` (`501bb70a`).** `__tests__/backupReadingHistoryGuards.test.ts`, con el `AchievementService` real sobre
  un `executeSql` falso: vigila el `{strict: true}` de los cuatro libros y el `data.degraded` de `restoreBackup`.
- **`R9-60` (`90f67a46`).** `LOCAL_BACKUP_KEYS` en `BackupService.ts`: tres claves, tal cual, en `payload.local`
  (aditivo en v2, como `meta`). Una lectura fallida marca `local:<clave>` y el import deja la clave en paz. Las tres
  se escriben leyendo del disco o por acción del usuario: nada montado las pisa desde memoria.
- **La raíz de `R9-30` y `R9-60` (`90f67a46`).** `__tests__/backupKeyCoverage.test.ts` barre las claves de
  AsyncStorage de `src/` y `app/` (literales `'@…'`, `getItem('…')` y `export const …KEY`). Cae si una clave no está
  cubierta, excluida con su razón o en `PENDING_R9_30`. También cae si una clave listada ya no existe: así salió
  `@premium_unlocked`, que solo vive en un comentario.
- **`R9-117` (`90f67a46`).** `FavoritesContext` se suscribe a `subscribeBackupRestored`.
  `__tests__/favoritesRestoreSignal.test.tsx`, con el provider real.

## 4. Revert por pieza

`_scratch/S160-piezas.cjs.txt` (grupos `v3a`, `v3b`, `v3c`); salidas en `S160-piezas-v3*.out.txt`. Cada pieza cae
sola; diff de `src` igual tras restaurar.

| Pieza                      | Cae                                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| A export strict            | la del export → import                                                   |
| B sembrado strict          | la del sembrado (`floor` sembrado)                                       |
| C agregado strict          | la del agregado (`set` llamado 1 vez)                                    |
| D el `throw` del store     | las tres de `R9-129`                                                     |
| E strict de los 4 libros   | las dos de `R9-131` que leen el export                                   |
| F `data.degraded`          | la del import de `R9-131` (`DELETE FROM reading_streak_log`)             |
| G suscripción de favoritos | la de `R9-117` («nota PRE-import»)                                       |
| H lista sin las 3 claves   | la de cobertura y las dos de `R9-60`                                     |
| I export sin `local`       | ida y vuelta (por su razón); degradado (por un `TypeError` de la prueba) |
| J import sin escribir      | ida y vuelta y degradado                                                 |
| K import sin degradado     | degradado                                                                |

Una fuga de la primera corrida: el `setSyncEngine` de la prueba del agregado no se limpiaba si la aserción caía, y
arrastraba a las de `R9-131`. Pasó a `afterEach`; la segunda corrida es la buena.

## 5. Lo que queda para la 161, con su diseño

### `R9-52` (P1): la Mesa reporta como éxito una escritura que falló

- **El store.** `savePrepNote` devuelve la promesa PROPIA, que rechaza; la cola guarda la versión que traga:
  `const mine = writeQueue.then(() => prepWrite(key, run)); writeQueue = mine.catch(log); return mine;`. La
  siguiente escritura no hereda el fallo. Lo mismo en los hermanos (`prepIllustrationsStore`, `prepSeriesStore` y
  los de autoevaluación y sermón, si tienen la misma forma: medirlo).
- **Los llamadores.** `app/features/prep/index.tsx:995`, `:1078` y `:1126` (fire-and-forget): `.catch` con un
  `toast.error` que no se repite en una ráfaga. `app/features/prep/illustrations/index.tsx:229`: `try/catch`; con
  fallo, `toast.error` y sin `router.back()`. Un texto nuevo en los dos idiomas (`translations.ts` con `.txt` y
  Write, por la memoria).
- **Las pruebas.** El store real con `setItem` rechazando: la promesa rechaza, y la escritura siguiente guarda. La
  pantalla de ilustraciones: sin toast de éxito y sin volver. Revert por pieza.
- **Vecinos.** El turno de la Mesa (`prepWrite`, `R9-273`): leer antes las reglas de `REGLAS.md` que nombran
  `prepAccount`. Un `unhandledRejection` en cada llamador que no espere: `grep` de todos.

### `R9-30` (P1): las 47 claves de `PENDING_R9_30`

- **Por clave:** `grep` de cada escritor. Si algo montado guarda el valor entero en memoria y lo reescribe, se
  suscribe a `subscribeBackupRestored` o la clave no pasa. Después pasa a `LOCAL_BACKUP_KEYS` y sale de la lista.
- **Tandas.** (1) Stores que leen al montar: favoritos y progreso de datos, travesías, profecías, quiz y niños;
  `@feelings_log`, `@devotion_log`, `@faith_testimony`, `@devotional_saved`, `@prayer_*`. (2) La Mesa
  (`@prep_illustrations`, `@prep_self_review` y `@sermon_notes`, si es de la Mesa): por cuenta con `prepKey` y en
  turno, como `@prep_notes`. (3) Con contexto: `@custom_plans` y `@together_groups`.
- **Preferencias.** Recomendación: idioma, versión y lector viajan (el respaldo ya lleva el tema); los
  recordatorios se excluyen («la notificación se programa en el aparato»).
- **La promesa de la interfaz** (`translations.ts:4176`) se revisa al cerrar `R9-30`.

## 6. Sin medir

- Todo, sin emulador.
- Una restauración en vivo con `payload.local` de un archivo real.
- Un archivo nuevo abierto en un build viejo: se lee que ignora `local` (como `meta`), no se midió.

## 7. Estado al cerrar

Código en `fix/s160-v3` (`501bb70a`, `90f67a46`), sin mergear: espera el OK de Victor. Validate verde en la rama
(`_scratch/S160-validate.out.txt`). Los docs, el cierre: `S160-CIERRE-PROMPT.md`. Conteo esperado tras las marcas:
275 abiertos de 599 (0 P0, 11 P1, 88 P2, 175 P3 y un aviso): se cierran `R9-129` y `R9-131` (P1) y `R9-60` y
`R9-117` (P2); `R9-30` y `R9-52` (P1) siguen.
