# Sesión 163 — V3: `R9-30` tanda 3 y la Mesa ante una restauración

> 2026-11-17. Opus 5.5 de principal, `high`, sin agentes. Rama `fix/s163-v3` (3 commits) y los docs en
> `docs/review-s163`, encima. Sin medir en vivo.

## 1. Estado de partida

- `main` = `origin/main` = `e1c861ad`. CI verde (run `44208784676`: 405 suites, 4971 pruebas).
- 275 abiertos de 601: 0 P0, 10 P1, 88 P2, 176 P3 y un aviso.

## 2. El daño con HEAD

| Sonda                                          | Con HEAD                                                     |
| ---------------------------------------------- | ------------------------------------------------------------ |
| Planes propios: guardar tras la señal          | En disco, `PRE` y `NUEVO`; los dos restaurados, borrados     |
| Planes propios: editar y borrar tras la señal  | Queda `PRE`                                                  |
| Grupos: unirse tras la señal                   | En disco, `plan-pre` y `plan-new`; los restaurados, borrados |
| La Mesa: blur tras la señal                    | «contexto PRE» encima de «contexto RESTAURADO»               |
| La Mesa: guardado pendiente al llegar la señal | «aplicacion PRE tecleada» encima de lo restaurado            |

## 3. Los arreglos

| Commit     | Qué                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `36f7244f` | `R9-30`: `CustomPlansProvider` y `TogetherProvider` escuchan `subscribeBackupRestored` y releen |
| `664cfc65` | `R9-30`: `@custom_plans` y `@together_groups` pasan a `LOCAL_BACKUP_KEYS`; salen de la lista    |
| `9a2cc67d` | `R9-602`: la Mesa cancela el guardado pendiente y relee las notas al llegar la señal            |

**`R9-30`, tanda 3.** Cada clave tiene un solo escritor: su provider. Los dos viven en la raíz y reescriben la
lista entera desde memoria. Ningún otro código reacciona a un cambio de esas listas (`grep` de los consumidores:
el editor de planes rellena una vez; la pantalla de grupos no escribe). El progreso de planes lee el registro de
planes propios solo en acciones, no al hidratar. Como las otras claves locales, el archivo reemplaza el valor del
aparato: un plan creado antes de restaurar y ausente del archivo se pierde. Es la regla de `payload.local`.

**`R9-602`.** La Mesa ya releía las notas al enfocar. Eso cubre una restauración hecha en Ajustes. No cubre una
que aterriza con la Mesa ya enfocada: la Mesa abre Ajustes (`router.push('/(tabs)/settings')`, `:884`), y una
importación puede seguir corriendo al volver. Mismo escenario que el editor de ilustraciones (`652a6a58`). El
arreglo copia las reglas de la relectura al enfocar: estricta (`R9-600`) y la plantilla solo si está guardada.
Una guarda descarta la lectura si el pasaje se movió mientras volaba.

## 4. Revert por pieza

Cada pieza, devuelta a su forma previa sobre lo apilado; restaurada, `git diff` igual. Salidas:
`_scratch/S163-revert.out.txt` y `_scratch/S163-revert-mesa.out.txt`.

| Pieza revertida                       | Caen                                              |
| ------------------------------------- | ------------------------------------------------- |
| Las dos claves en `LOCAL_BACKUP_KEYS` | Ida y vuelta, y `backupKeyCoverage` (2)           |
| La suscripción de los planes          | Sus 3 pruebas y la de ida y vuelta (4)            |
| La suscripción de los grupos          | Sus 2 pruebas y la de ida y vuelta (3)            |
| La suscripción de la Mesa entera      | 4 de 5; el control pasa                           |
| El `cancel()` de la Mesa              | El guardado pendiente («aplicacion PRE tecleada») |
| La relectura de la Mesa               | 3: el blur, los campos y el control de la guarda  |
| La guarda del pasaje                  | 1: «contexto 3:16» en pantalla sobre 3:16-17      |

El control de la Mesa (restauración antes de volver, con foco) pasa con y sin el arreglo: es el caso que ya
cubría la relectura al enfocar.

## 5. Validate

`NODE_ENV=development npm run validate`: 408 suites, 4982 pruebas, 70 advertencias de eslint y ningún error.

## 6. Para la 164, sin numerar y sin medir

- La autoevaluación de la Mesa no se relee al enfocar ni con la señal: tras restaurar, muestra las marcas de
  antes. Marcar una escribe solo esa pregunta, leída del disco: no pisa las demás. Solo se ve vieja.
- `prepSeriesExport.ts:197` (de la 162): con la lectura de notas fallida exporta la serie sin notas. No escribe.
- `R9-30` sigue abierto con 32 claves en `PENDING_R9_30`: `@sermon_notes`, `@devotional_draft`, el audio, los
  estilos de compartir, la meta diaria, las versiones de inicio, `lastReadPosition` y 21 preferencias.

## 7. Sin medir

- Todo, sin emulador.
- Una lectura estricta que falla al llegar la señal: los campos quedan como estaban (`R9-600`), y la tecla
  siguiente escribe la sección de antes.
- Una unión a un grupo por enlace mientras corre una importación (la ventana de `R9-278`).

## 8. Estado al cerrar

- `fix/s163-v3` (`36f7244f`, `664cfc65`, `9a2cc67d`) y `docs/review-s163` encima: esperan el OK de Victor.
- 275 abiertos de 602: 0 P0, 10 P1, 88 P2, 176 P3 y un aviso. `R9-602` nació y se cerró en la sesión.
