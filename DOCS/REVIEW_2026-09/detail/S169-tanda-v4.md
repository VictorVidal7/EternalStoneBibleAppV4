# Sesión 169: la tanda V4 — cuenta y cuota (`R9-25`, `R9-29`, `R9-24`; `R9-136` y `R9-4` solo propuesta)

2026-11-18. Opus 5.5 principal, `high`. 3 agentes a pedido de Victor («¿Podrías mandar agentes?», sin número: 3).
Rama `fix/s169-v4` (3 commits sobre `212f9d09`). Sin emulador ni nube: nada toca Firebase en vivo.

## 1. Estado de partida

main = origin/main = `212f9d09`, CI verde (run 44408805867, 426 suites, 5060 pruebas). Validador 0 y 0: 277 abiertos
de 614.

## 2. El reparto

| Agente | Modelo                           | Entrada                              | Archivos                            |
| ------ | -------------------------------- | ------------------------------------ | ----------------------------------- |
| A1     | `fork` Opus 5.5 `high`, worktree | `R9-25`                              | `deleteAccountData.ts`              |
| A2     | `fork` Opus 5.5 `high`, worktree | `R9-29`                              | `BackupService.ts`, `SyncEngine.ts` |
| A3     | `fork` Opus 5.5 `high`, worktree | `R9-24`; propuesta `R9-136` y `R9-4` | `translations.ts`                   |

Patrón de la 99: cada uno armó y midió su diseño sin commitear; el orquestador integró. Reglas comunes:
`_scratch/S169-agentes-reglas.md.txt`. Informes y sondas: `_scratch/S169-sondas-agente-{1,2,3}/`. Los tres
completaron sin cortes (135k, 192k y 149k tokens; 38, 76 y 58 llamadas; 5, 10 y 6 min). Worktrees quitados tras
comparar diff y `_scratch` con la copia.

## 3. Arreglos

| Entrada | Commit     | Qué cambia                                              | Prueba (cae sin el arreglo)                      |
| ------- | ---------- | ------------------------------------------------------- | ------------------------------------------------ |
| `R9-25` | `190747c8` | Borrado en páginas de 200; corta al primer fallo        | `deleteAccountData.test.ts`: sin el `limit`, 2/8 |
| `R9-29` | `fb2a0391` | El import no sube `reviewEvents`; `queueWrites` en lote | `backupImportSyncCost.test.ts`: 2/2 y 1/2        |
| `R9-24` | `d8425ada` | El diálogo no manda a «Resetear Datos»                  | `deleteAccountCopy.test.ts`: 2/4                 |

Cada revert por pieza se re-midió en el principal tras integrar (`_scratch/S169-revert.sh.txt`, salida
`S169-revert.out.txt`): las cuatro piezas caen por la razón correcta y quedan restauradas.

### `R9-25`

- `deleteCollectionInPages`: `limit(200).get()`, borra la página con `allSettled`, relee lo que queda.
- Una página corta es la última. Un doc ya borrado que vuelve corta (evita un bucle por una lectura vieja).
- El primer fallo lanza `incomplete for: <colección>` y no lee más: no gasta cuota en una corrida perdida.
- El orden de las colecciones no cambia: favoritos, notas y resaltados primero.
- **Lo que no arregla:** N docs siguen siendo N lecturas y N borrados. Lo que baja el volumen es `R9-29`.
- Descartados: `writeBatch` (el envoltorio no lo tiene; cuesta lo mismo), en serie de a uno (lento).

### `R9-29`

- Medido (A2): nadie usa los `reviewEvents` de la nube. El adapter descarta lo remoto, `pullAllLocal` da `[]`, y
  `reviewCard` ya no sube. El import era el último escritor. Por la regla «sincronizar lo mínimo», no los sube más.
- `SyncEngine.queueWrites`: las mismas entradas, orden y dueño (`R9-38`) que N `queueWrite`. Un `persistQueue` y
  un `flush` al final, también si una entrada lanza.
- Costo con el `SyncEngine` real, 7 000 docs: `persistQueue` 7 001 → 2; JSON 5 187 MB → 1,5 MB; hilo 9,8 s → 0,26 s.
- Matriz de vecinos de A2 (8 escenarios, N `queueWrite` contra un `queueWrites`): iguales. Vacío, sin sesión con y
  sin dueño, edición esperando al dueño, edición con el push en vuelo, `queueUnread`, cambio de cuenta.
- El orquestador leyó `enqueue`, `queueFor` y `upsertQueueEntry`: `batching` solo vive dentro del bucle síncrono.
- Comentarios corregidos: el del import (la ventana de `reviewCard` ya no existe), el adapter y `reviewEvents.ts`.
- Vecino tocado: el motor de prueba de `backupRestoreSignal.test.ts` pasa a `queueWrites`.

### `R9-24`

- Solo cambia la última frase de `auth.deleteAccountConfirmMessage`, en los dos idiomas: lo del aparato queda.
- Agrega «estadísticas de repasos» (`memoryStats`) a lo que se borra. Las 8 colecciones son todas las que se escriben.
- Sin acción nueva de borrar lo local (§8). No nombra desinstalar: `allowBackup` no está fijado (nota de A3).
- Un solo consumidor: el diálogo de `app/(tabs)/settings.tsx:919`. Ninguna prueba fijaba el texto viejo.

## 4. `R9-136` y `R9-4`: la propuesta (nada aplicado)

Borrador de reglas: `_scratch/S169-sondas-agente-3/S169-a3-firestore.rules.txt` (sin probar: el emulador de reglas
pide el CLI). Informe: `S169-a3-informe.md.txt` del mismo lugar.

| Paso | Dónde          | Qué                                                                                             | Riesgo                                         |
| ---- | -------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1    | repo           | `firestore.rules` = las reglas vivas tal cual (`detail/B4`), y `"firestore"` en `firebase.json` | ninguno: punto de vuelta                       |
| 2    | repo + EAS     | paquete `app-check` con Play Integrity; build nuevo                                             | el build                                       |
| 3    | consola        | registrar la app y la firma; App Check en monitoreo unos días                                   | ninguno                                        |
| 4    | consola        | «Enforce» cuando casi todo llega verificado                                                     | un aparato sin el build nuevo pierde Firestore |
| 5    | repo + consola | publicar las reglas nuevas: lista de colecciones, topes generosos                               | una colección olvidada pierde subidas          |

- El borrador acepta solo las colecciones que la app usa; `bookmarks`, solo lectura y borrado; subcolecciones cerradas.
- Topes generosos: un rechazo se reintenta y se descarta tras 8 intentos (`R9-33`). Un tope corto perdería datos.
- Sin lista cerrada de campos: no borra los de una versión más nueva. Excluir anónimos: escrito, sin activar.
- Las reglas no limitan la frecuencia. Contra las ráfagas sirve App Check.
- Sin medir: el `sign_in_provider` justo después de `linkWithCredential`. Forzar el refresco del token lo cubre.
- Corrección a `R9-4`: hoy `firebase.json` no tiene sección `functions`.
- **Pide el OK de Victor aparte, paso por paso.** Los pasos 1 y 2 son del repo; 3 a 5, de la consola.

## 5. Hallazgo nuevo

`R9-615` (P3, por lectura, A2 y orquestador): el listener de `reviewEvents` sigue abierto. Cada doc que entrega es
una lectura facturada que `applyRemoteUpsert` descarta. `registerOfflineAdapters.ts:14` lo registra. En un aparato
nuevo (cursor 0) lee todo lo subido antes. Con `R9-29`, nadie escribe más: la colección se vacía con el
`cleanupOldReviewEvents` en 12 meses.

## 6. Notas sin entrada

- `isReviewEventWithinSyncWindow` y `reviewEventToRemote` quedan sin llamador en la app (el segundo, solo en el
  adapter). Se dejan: las pruebas las fijan.
- `allowBackup` sin fijar en `app.json`: importa para la decisión de borrar lo local (§8, `R9-24`).

## 7. Sin medir

- Nada en un teléfono ni en la nube real: el costo real del borrado y del import, `deleteDoc` sin red en nativo.
- `engine.start(uid)` tras un borrado parcial con la copia local intacta (previo; ahora quedan las colecciones
  siguientes a la que falló).
- Un doc saltado por `isSuppressed` dentro del lote.
- El borrador de reglas, el token tras vincular, la política de privacidad en Pages.

## 8. Estado al cerrar

`validate` verde: 429 suites, 5074 pruebas, 0 errores (70 avisos, ya estaban). Cerrados `R9-25`, `R9-29` y `R9-24`;
nuevo `R9-615`. Quedan 275 abiertos de 615 (0 P0, 6 P1, 88 P2, 180 P3 y un aviso). La 170 revisa este diff.
