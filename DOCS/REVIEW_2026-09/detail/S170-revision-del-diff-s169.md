# Sesión 170: revisión del diff de la 169 (`R9-25`, `R9-29`, `R9-24`), con emulador

2026-11-18. Opus 5.5 principal, `high`. 3 agentes a pedido de Victor («¿Podrías mandar agentes?», sin número: 3).
Rama `docs/review-s170`, sin cambios de código. Nada tocó Firebase en vivo.

## 1. Estado de partida

main = origin/main = `0b5c1768`, CI verde (run 44420541935, 429 suites, 5074 pruebas; re-leído en el log). Validador
0 y 0: 275 abiertos de 615.

## 2. El reparto

| Agente | Modelo                           | Área                                                         |
| ------ | -------------------------------- | ------------------------------------------------------------ |
| A1     | `fork` Opus 5.5 `high`, worktree | El borrado de la cuenta (`deleteAccountData.ts`, llamador)   |
| A2     | `fork` Opus 5.5 `high`, worktree | La cola: `SyncEngine.queueWrites`, `queueAllFor`, `batching` |
| A3     | `fork` Opus 5.5 `high`, worktree | El import sin `reviewEvents` y quién los echaría de menos    |

Reglas comunes: `_scratch/S170-agentes-reglas.md.txt`. Los tres completaron sin cortes (149k, 164k y 162k tokens;
33, 43 y 70 llamadas; 6, 8 y 7 min), con `git status` limpio y las sondas borradas. El orquestador usó el emulador
en paralelo y re-midió con sonda propia el hallazgo portante de A2 (`R9-616`).

## 3. Resultado

Los tres arreglos se sostienen. Ningún P2. Nuevos: `R9-616` y `R9-617` (P3, los trae `R9-29`), `R9-618` y `R9-619`
(P3, previos). Suma a `R9-25` (lo que el §7 de la 169 dejaba sin medir).

### `R9-25`: el borrado (A1)

Medido con `AuthProvider`, `SyncEngine` y `deleteAllCloudData` reales, Firestore falso en memoria; las mismas sondas
contra `212f9d09` (copia temporal) como control.

| Caso                                                        | Resultado                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Falla un delete en la página 2 de `favorites` (450)         | lanza; `deleteUser` 0; motor en la cuenta; quedan fav 250           |
| Reintento                                                   | termina; `deleteUser` 1; nube vacía; dueño `(deleted)`              |
| La lectura de `notes` lanza                                 | fav 0; lo demás intacto; el reintento deja 0                        |
| Push propio en vuelo al `stop()` aterriza tras la relectura | queda `notes-0` huérfano; igual con `212f9d09` (`R9-193`, `R9-530`) |
| El push aterriza entre la página 1 y la relectura (250)     | el guard lanza; el reintento termina                                |
| Otro escritor crea un id nuevo entre páginas                | se borra en la página 2 (antes quedaba)                             |
| `start(uid)` tras un borrado parcial                        | sin resurrección ni re-subida: suma a `R9-25`                       |
| La sesión cambia a mitad del borrado                        | `R9-619`                                                            |

- El guard del «doc que vuelve» no es un fallo permanente: el reintento arranca con el conjunto vacío.
- Un doc vuelve de verdad solo por un push en vuelo al `stop()` u otro aparato; con red, `get()` va al servidor.
- Reverts por pieza de `deleteAccountData.test.ts`: sin el guard, 1/8; sin el corte de página corta, 1/8; sin el
  corte al primer fallo, 3/8. Restaurados.

### `R9-29`: la cola (A2)

`queueWrites(xs)` contra N `queueWrite`, con el `SyncEngine` real (cola en memoria y disco, `pendingWrites`, flush,
lo empujado). Iguales: sesión online y offline, sin sesión con y sin dueño, suelta-lote-suelta del mismo doc,
`ownerWaiting > 0` con `start` a mitad, cola ilegible (`R9-212`), relectura que sí lee, `isSuppressed`, cambio de
cuenta y `stop()`/`start()` a mitad, reentrada forzada. Diferencias: `R9-616` (dueño ilegible), `R9-617` (una
entrada que lanza, sin sesión) y el `pendingWrites` de `R9-618`.

- `queuedAt` no lo lee nadie en `src` ni `app`: el valor único del lote no afecta orden ni reintentos.
- Nadie depende de un `persistQueue` por entrada: `queueWrites` lo llama solo `BackupService.ts:1229`.
  `pendingWrites` lo lee solo Ajustes.
- Reverts: lote → bucle de `queueWrite`, cae 1/2; sin la guarda `batching` de `upsertQueueEntry`, 1/2.
- **La guarda `batching === 0` del flush en `queueFor` no tiene prueba que la vea** (sin ella, 6 flush en vez de 1;
  inocuo: `flushInFlight` corta los de más). Nota sin entrada.

### `R9-29`: el import sin `reviewEvents` (A3)

- Con `importBackup` real, HEAD contra el `BackupService.ts` de `212f9d09`: lo único distinto son los 2
  `reviewEvents` de la ventana (en los `set`, la cola en memoria y en disco). Colecciones, ids, datos, orden y uid,
  idénticos. También vacío, sin sesión con y sin dueño, multiSet que falla y SQLite que falla.
- Aparato A importa, B (disco vacío, misma nube) siembra: HEAD `entregadosB 0`, `212f9d09` `entregadosB 3`. Racha,
  estadísticas, `memoryStats` y el piso de B, idénticos. El respaldo siguiente lleva los 4 eventos locales.
- Control: con el adapter parcheado para aplicar lo remoto, B da `localB 3`: la sonda vería a un consumidor.
- `R9-615` no se agrava: se achica (B pagaba 3 docs, ahora 0).
- Revert de la pieza «sin reviewEvents»: `backupImportSyncCost.test.ts` cae 2/2 por la razón correcta.
- Los comentarios corregidos dicen la verdad medida. Matiz: el mapa de calor del aparato nuevo sigue a 12 meses
  (`recentDays` recortado a 365); los totales incluyen todo.

### `R9-24`: el texto, en vivo (orquestador)

AVD `Pixel_9_Pro` de solo lectura, APK debug vc73, Metro, sin sesión, `font_scale` 2.0. «Eliminar cuenta» solo se ve
con cuenta, y la del AVD es la de Victor: el diálogo se abrió con una edición temporal de `settings.tsx` (visible al
montar y el botón de confirmar sin efecto), restaurada con `git checkout`. Nunca se confirmó.

| Idioma  | Resultado                                                                               |
| ------- | --------------------------------------------------------------------------------------- |
| Inglés  | texto entero visible, sin cortes; «Cancel» y «Delete account» (dos líneas) caben        |
| Español | texto entero visible, ocupa casi toda la pantalla; «Cancelar» y «Eliminar cuenta» caben |

Capturas: `_scratch/S170-sondas/S170-dialogo-en.png` y `S170-dialogo-es.png`. Lo que dice se sostiene: el flujo
(`AuthContext.deleteAccount`) no borra lo local. En el camino se tocó por error la versión RVR1960 en Ajustes
(instancia de solo lectura, sin sesión: no queda nada).

## 4. Notas sin entrada

- El inglés dice «memory cards, and review history and stats»: correcto pero torpe. Sin entrada.
- A3: si `buildNoteRemotePayload` o sus hermanos lanzaran, ahora no se encola nada del lote (antes, lo previo). Por
  lectura no lanzan.
- A3: una versión anterior al local-first (antes de `17872d4f`) en otro aparato ya no recibe los eventos del import.

## 5. Sin medir

- Nada en un teléfono ni en la nube real: sin red, el `delete()` nativo no resuelve hasta el ack.
- La duración real de la ventana de `R9-619` y el rechazo real de las reglas al push de Beto.
- `R9-617`, `R9-618` y `R9-619` no los re-midió el orquestador (sí `R9-616`, y el disparador de `R9-619` en el código).

## 6. Estado al cerrar

Sin cambios de código. Quedan 279 abiertos de 619 (0 P0, 6 P1, 88 P2, 184 P3 y un aviso). Sin P2 nuevos: **la 171
es la V5.**
