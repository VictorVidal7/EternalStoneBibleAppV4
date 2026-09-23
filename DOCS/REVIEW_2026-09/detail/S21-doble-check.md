# S21 — doble check con Opus 5.5: los 18 P0 arreglados y las filas cerradas del Modo A y del Modo B

**Sesión 21, 2026-09-22. Solo de REVISIÓN, con Opus 5.5.** Es la opción (b) de `CONTINUAR.md`, el
pedido fijo de Victor: todo lo que el ledger revisó hasta la sesión 18 se había hecho con Opus 5.
Esta sesión hizo los puntos 1 y 2 del alcance de `detail/S19-revision-del-diff.md` («Pedido de
Victor»). Los puntos 3 y 4 van en la sesión 22.

- **Base:** `main` = `origin/main` = `ca2cd71`, árbol limpio. No se commiteó nada: el checkpoint lo
  escribió la sesión 22, en `docs/review-s21-doble-check`.
- **CI de `ca2cd71` verificado EN EL LOG:** run `35801884549`, los 3 jobs `success`, Node v24.20.0.
  En «Run Tests» hay 364/364 suites y 4299/4299 pruebas, con cero «failed to run». La sesión 22 lo
  volvió a comprobar en el log al arrancar.
- **Cómo se trabajó:** Victor pidió 2 agentes, en worktrees aislados. El agente 1 revisó los 18 P0
  y el agente 2 las filas del Modo A y del Modo B. El primer chat se cortó por el límite de uso a
  mitad de los dos agentes, y en el segundo se relanzaron desde donde había quedado cada uno.
  Solo sobrevivió lo que estaba escrito en disco: el arnés del agente 1 se perdió con su worktree
  y se volvió a armar igual.
- **Todo lo que subió a P0 o P1 lo verificó a mano el orquestador:** releyó el código y volvió a
  correr las sondas en el worktree del agente 2.

**Resultado: 19 hallazgos, `R9-124`..`R9-142`** (2 P0, 6 P1, 10 P2 y 1 P3). **P0 abiertos tras
el checkpoint: 5** (`R9-36`, `R9-38`, `R9-39`, `R9-124`, `R9-125`).

---

## Método

**El arnés del agente 1** (`rv.py` + `pieces.py`) hace esto con cada pieza:

1. Aplica UNA pieza por reemplazo exacto, y aborta si el patrón no casa exactamente una vez.
2. Imprime el `git diff -U0` del revert.
3. Corre jest con `--json` y lista cada prueba roja con su mensaje.
4. Restaura con `git checkout --` y comprueba que `git diff` quede vacío.

Es la regla de la sesión 20: se revierte **cada pieza** de un arreglo por separado, no el arreglo
entero. Primero corre la suite dirigida. Si queda verde, corre la **suite entera** (364 suites /
4299 pruebas).

**Varias piezas juntas en una corrida entera:** para un grupo de piezas verdes de ramas
independientes, se aplican todas a la vez y se corre la suite entera. Si sale verde, ninguna está
vigilada. Si sale roja, se separan. Así se midieron, por ejemplo, las 20 piezas de `R9-27`/`R9-49`
de una sola vez, y las 8 de `R9-47`.

**Las sondas** son copias del test real con un caso `S21PROBE` al final, corridas con `-t`. Se
sacaron de `testMatch` al terminar. Cada una tiene su control, que es la misma sonda con el
camino sano.

**La verificación a mano del orquestador** repitió los tres reverts de los P1 del agente 1 **a la
vez** en el worktree viejo, después de limpiar las sondas. Fue un script con conteo exacto = 1:

- `AuthContext.tsx`: quitar `if (signedIn?.uid) await claimLocalStore(signedIn.uid);` (`R9-130`);
- `BackupService.ts`: las 4 llamadas `…({strict: true})` → `…()` (`R9-131`, la mitad del export);
- `AchievementService.ts`: quitar `if (data.degraded?.[key]) return 'degraded';` (`R9-131`, la
  mitad del servicio).

Con los tres juntos, la suite entera dio **364/364, 4299/4299**. Ninguna de las tres piezas está
vigilada. Se restauró con `git checkout --`, y `git diff` y `git status` quedaron vacíos.

---

## Punto 1: los 18 P0 arreglados, pieza por pieza

**Veredicto: los 18 arreglos se sostienen en `HEAD`.** Ningún revert encontró código de `HEAD`
que haga algo distinto de lo que dice el ledger. Lo que falla es la **red de pruebas**: hay piezas
que protegen un P0 y que se pueden quitar con la suite entera en verde.

«SIN PRUEBA» significa que al quitar la pieza la suite entera sigue verde (364/364, 4299/4299).

### Resumen

| P0      | ¿se sostiene? | piezas SIN PRUEBA                                                      |
| ------- | ------------- | ---------------------------------------------------------------------- |
| `R9-9`  | sí            | `getLastKnownEntitlement` (sin consumidores: impacto nulo)             |
| `R9-10` | sí            | el orden de suscripción (no observable)                                |
| `R9-11` | sí            | —                                                                      |
| `R9-13` | sí            | —                                                                      |
| `R9-14` | sí            | —                                                                      |
| `R9-22` | sí            | el dedupe por uid (`R9-137`); el bucle solo por OOM (`R9-142`)         |
| `R9-23` | sí            | el `claimLocalStore` de la colisión (`R9-130`, P1); `total > 0`        |
| `R9-27` | sí            | notes, stats, y 3 ledgers (`R9-139`)                                   |
| `R9-28` | sí            | 3 suscripciones (ya era `R9-116`); el aviso (`R9-141`)                 |
| `R9-33` | sí            | el tope de 30 min (impacto nulo)                                       |
| `R9-34` | sí            | —                                                                      |
| `R9-35` | sí            | —                                                                      |
| `R9-44` | sí            | la rama del lector (ya sabido: Modo C)                                 |
| `R9-45` | sí            | el `deleted:false` del bulk push (`R9-138`)                            |
| `R9-46` | sí            | —                                                                      |
| `R9-47` | sí, leído     | 8 de 9 piezas (ya sabido como Modo C; ahora medido)                    |
| `R9-48` | sí            | el `return` del `catch` del traspaso (redundante)                      |
| `R9-49` | sí            | `{strict: true}` y `data.degraded` (`R9-131`, P1); el `MAX` (`R9-140`) |

### Sync: `SyncEngine.ts`, suite `SyncEngine.test.ts` (73 pruebas)

**`R9-22`** (`a9785be`), la cola namespaceada por uid:

| pieza                                              | rojas                          | veredicto                           |
| -------------------------------------------------- | ------------------------------ | ----------------------------------- |
| 22a `isDue`: `entry.uid !== activeUid → false`     | 3                              | discrimina, pero por OTRO mecanismo |
| 22a2 = 22a + la guarda de `pushOne` (`R9-104`)     | 7                              | discrimina                          |
| 22b el dedupe de `upsertQueueEntry` incluye el uid | **0; suite entera 364/364**    | **SIN PRUEBA → `R9-137`**           |
| 22c `hydrate` descarta entradas sin uid            | 1                              | discrimina                          |
| 22d `hydrate` reescribe la cola limpia             | 1                              | discrimina                          |
| 22e `pendingForActiveUid` cuenta solo el activo    | 3                              | discrimina                          |
| 22g `start()` recalcula `pendingWrites`            | 1                              | discrimina                          |
| 22h/22i/22j el sello de uid                        | 17 / 4 / 2                     | discrimina                          |
| 22f el re-flush sobre `this.queue.length`          | 0                              | redundante con 33c                  |
| 22f + 33c, las DOS guardas del bucle               | jest muere por OOM, sin nombre | **detección incidental → `R9-142`** |

Sobre 22a: con la guarda de uid quitada, la prueba titular sigue verde porque la guarda de
`pushOne` de `R9-104` (sesión 20) lanza igual. Lo que se rompe es que la escritura de Ana se
QUEMA en la sesión de Beto (intentos y backoff). Hoy `R9-22` y `R9-104` son dos capas del mismo
invariante, y la prueba titular de `R9-22` solo vigila la suma. No es un bug, pero conviene
saberlo antes de tocar una de las dos.

**`R9-33`** (`0a4f0fc` + `c41c9cb`): discriminan el backoff en `isDue`, el sello `lastAttemptAt`,
`recordDroppedWrite`, `loadDroppedWrites` en `start()`, la limpieza en `stop()`, `acknowledge` y la
persistencia. La salida temprana por `flushableCount()` y el re-flush por `flushableCount()` son
redundantes entre sí. Juntas las tumba la prueba de `R9-34`, y la sonda da bucle caliente. El tope
de 30 min de `retryDelayMs` es **SIN PRUEBA, con impacto nulo** (63,5 min en vez de 61,5).

**`R9-34`** (`0a4f0fc` + `2bfa126`): esparcir la entrada VIVA y no `item` da `Expected
"v2-REEDITADO" / Received "v1"`: **discrimina**. El control que no controla sigue siendo `R9-114`.

**`R9-35`** (`0a4f0fc`): el tope `Math.min(seen, Date.now())`, descartar el cursor futuro en
`loadCursor` y borrar del disco el cursor envenenado dan 1 roja cada uno: **discriminan**.

**`R9-11`** (`261c053`): la identidad `this.queue[doneIdx] === item` da 2 rojas: **discrimina**. La
premisa (`R9-115`) sigue igual en `HEAD`.

**`R9-45`** (`7f8e666`): `deleted:false/deletedAt:null` en `queueWrite` da 2 rojas. **La misma
pieza en el bulk push inicial da 0, con la suite entera verde → `R9-138`.**

**`R9-46`** (`b3d73e1` + `3e780c6`): discriminan `applyRemoteChange` devolviendo `false` si
`getLocal` lanza (3), que `handleSnapshot` no pliegue el doc no aplicado (2) y el tope del lote
(2). `findNoteById` inicializa y propaga, y `notesSyncAdapterGetLocal.test.ts` fija exactamente
esas dos piezas (por lectura del test; no se revirtió). **El vecino sigue abierto en `HEAD`:** el
`getLocal` de subrayados devuelve `null` en su `catch`. Era la «nota de alcance» de `R9-46`, y ahora
es `R9-132`.

### Dinero: `offeringService.ts` y `PremiumContext.tsx` (43 pruebas dirigidas)

**`R9-9`** (`bb3b25b`):

| pieza                                            | rojas                       | veredicto                                       |
| ------------------------------------------------ | --------------------------- | ----------------------------------------------- |
| 9a `__resetForTests` a `null`                    | 4 (`Expected false / true`) | discrimina                                      |
| 9b el inicializador del módulo a `null`          | 1 (la de `R9-105`)          | discrimina desde la sesión 20                   |
| 9c `getLastKnownEntitlement` devuelve `=== true` | 0; suite entera 365/365     | SIN PRUEBA, impacto nulo: no tiene consumidores |

**`R9-10`** (`bb3b25b`): la guarda `if (!revenueCatSpokeRef.current)` y la marca en el listener dan
1 roja cada una (`una lectura de cache lenta no puede resucitar…`): **discriminan**. Suscribirse
ANTES de lanzar la lectura da 0: **no es observable**. La IIFE corre síncrona hasta su primer
`await`, así que el comentario de `PremiumContext.tsx:72-73` describe una ventana que no existe.
Ya estaba dicho en `R9-122`.

### Identidad: `AuthContext.tsx` (24 pruebas) y `memoryStatsSync.ts` (21 pruebas)

**`R9-23`** (`e75eca3`):

| pieza                                                       | rojas                     | veredicto                                 |
| ----------------------------------------------------------- | ------------------------- | ----------------------------------------- |
| 23a la guarda entera (`:394`)                               | 1                         | discrimina                                |
| 23a1 `previousOwner !== null &&`                            | 7 (1 + 6 en cascada)      | discrimina                                |
| 23a2 `&& previousOwner !== current.uid`                     | 6 (1 + 5 en cascada)      | discrimina, sobre un fixture inalcanzable |
| 23b `total > 0 &&`                                          | 0; suite entera verde     | SIN PRUEBA, cosmético                     |
| 23c `queueSkipNextBulkPush()` al declinar                   | 1                         | discrimina                                |
| 23d `claimLocalStore(current.uid)` tras el link             | 2                         | discrimina                                |
| 23e `claimLocalStore(signedIn.uid)` en la colisión (`:507`) | **0; suite entera verde** | **SIN PRUEBA → `R9-130`**                 |

**Sobre 23a2, la afirmación falsa del ledger:** el control fija la marca en `'anon-same'` y entra
con un anónimo de uid `'anon-same'`. En producción ese estado no existe, porque `claimLocalStore`
solo se llama con un uid que ya dejó de ser anónimo. Un dueño que vuelve con su Google ya ligado
NUNCA toma la rama de éxito del link: toma la de colisión, donde la pregunta del Sprint 43 salta
siempre que haya datos locales. Así que **«el mismo dueño volviendo no se interroga» es falso en la
app real**: el dueño que vuelve SÍ ve la pregunta. No tiene consecuencia de datos. Queda corregido
en la entrada de `R9-23`.

**`R9-48`** (`67af8c9` + `29a9449`): discriminan el traspaso entero, el `clearAllReviewEvents()`, el
`multiRemove` del floor y el banner, reclamar al traspasar, el traspaso ANTES de la guarda del
floor, la guarda de escritura y reclamar el log sin dueño en la primera escritura. El `return` del
`catch` del traspaso es **redundante**: en cada rama de fallo algo más corta, y ningún camino sube
la historia ajena. La guarda de escritura, en cambio, falla ABIERTA si no puede leer el marcador:
es `R9-134`, del punto 2.

### Respaldo: `R9-27`, `R9-49` y `R9-28` (12 a 14 archivos, 88 a 96 pruebas dirigidas)

**`R9-27`** (`7f8e666`): discriminan `payload.meta` (2), la lectura de `meta` en el import (3),
`wasDegraded('favorites')`, `wasDegraded('highlights')`, la guarda de `queuePair`, el flag
`streakLog` y `failedSections.push(...achievementsDegraded)`. **SIN PRUEBA, con consecuencia medida
→ `R9-139`:**

| pieza                                                                | consecuencia con el revert (sonda, servicio real)             |
| -------------------------------------------------------------------- | ------------------------------------------------------------- |
| 27d `wasDegraded('notes')`                                           | `DELETE FROM notes`                                           |
| 27j1 y 27n `stats`, en el import y en el servicio                    | el `UPDATE user_stats` escribe los ceros de `EMPTY_RAW_STATS` |
| 27j4/27j5/27j6 `completedBooks`, `bookReadingLog`, `chaptersReadLog` | `DELETE` de cada ledger                                       |
| 27h `wasDegraded('reviewEvents')`                                    | `DELETE FROM review_events`; hoy inalcanzable (`R9-129`)      |

Redundantes: 27o y 27j2 (la lista degradada viaja como `[]`), 27f1 (un puntero `null` no se
escribe) y 27g (redundante con 27i). Sin prueba y solo de informe: 27f2 y 27l.

**`R9-49`** (`7f8e666`): el `if (options?.strict) throw error;` de cada uno de los 4 getters da 1
roja. **SIN PRUEBA:** el `{strict: true}` de las 4 llamadas del export (49a..49d) y el
`data.degraded` del servicio (27m), que pasan a **`R9-131` (P1)**, y el `MAX(longest_streak, ?)`
(49i), que pasa a `R9-140`. **Las 20 piezas verdes corridas a la vez: suite entera 364/364,
4299/4299.**

**`R9-28`** (`7f8e666`): `emitBackupRestored()` al final de `importBackup` (1) y la suscripción de
`MemoryDeckContext` (2) discriminan. Las suscripciones de `ReaderPreferences`,
`ReadingPlanProgress` y `ReadingProgress` son SIN PRUEBA, pero eso ya es `R9-116`. **El aviso de
reiniciar (`DataSettings.tsx:158`) es SIN PRUEBA → `R9-141`.** El `try/catch` por listener también
es SIN PRUEBA, con impacto bajo: hoy ningún `hydrateFromStorage` lanza.

### Notas y subrayados, la Mesa y web

**`R9-44`** (`7f8e666`): el `UPDATE` de solo color y sus dos mitades en la nube (`note` y
`category` sin tocar, el `SET` sin `note = ?`) dan 2 rojas cada una: **discriminan**. La rama del
lector (`[chapter].tsx:1511-1519`) es SIN PRUEBA, pero ya se sabía: es Modo C, y el propio test lo
dice. Los otros dos llamadores de `addHighlight` pasan los 7 argumentos.

**`R9-47`** (`7f8e666`), en `app/features/prep/index.tsx` (9 archivos, 62 pruebas):

| pieza                                                       | rojas | veredicto  |
| ----------------------------------------------------------- | ----- | ---------- |
| 47g el `blur` no escribe una sección sin borrador (`?? ''`) | 1     | discrimina |
| 47a `if (isStale()) return;` antes de mutar                 | 0     | SIN PRUEBA |
| 47b `if (isStale()) return;` en el `catch`                  | 0     | SIN PRUEBA |
| 47c `if (!isStale()) setReloading(false)`                   | 0     | SIN PRUEBA |
| 47d `draftsPassageKeyRef` en `load()`                       | 0     | SIN PRUEBA |
| 47e `if (cancelled) return;` en el `useFocusEffect`         | 0     | SIN PRUEBA |
| 47f `draftsPassageKeyRef` en el `useFocusEffect`            | 0     | SIN PRUEBA |
| 47h el `blur` archiva bajo `draftsPassageKeyRef`            | 0     | SIN PRUEBA |
| 47i el `change` archiva bajo `draftsPassageKeyRef`          | 0     | SIN PRUEBA |

**Las 8 SIN PRUEBA a la vez: suite entera 364/364, 4299/4299.** Jest vigila **1 de 9 piezas**:
la frase del ledger «la prueba cubre la consecuencia de BORRADO» es literalmente eso. La deuda de
Modo C de `R9-47` incluye también el re-keying (47d/47f/47h/47i), no solo la guarda de `load()`.
No se numeró, porque el ledger ya lo tenía como pendiente de dispositivo. Por lectura, el código de
`HEAD` hace lo que dice el comentario en los tres caminos.

**`R9-13`** (`996b913`) y **`R9-14`** (`1eb2210` + `324f200`), 7 archivos y 129 pruebas: quitar el
`export` de `hasRedLetterData` da 11 rojas en tres redes independientes. El `screenLayout` con
`ErrorBoundary`, el boundary de tabs, su `key={pathname}` y la pantalla honesta dan 1, 4, 1 y 4.
**Son los únicos de los 18 sin ninguna pieza SIN PRUEBA:** tras las sesiones 13 a 18, el bloque
web es el mejor vigilado del ledger.

---

## Punto 2: las filas cerradas del Modo A y del Modo B, releídas

La lente fue la dirección «quitar acceso / restaurar / cambiar de cuenta», la misma en la que la
sesión 19 encontró dos P0 en código ya pasado.

| fila       | veredicto                                                                               |
| ---------- | --------------------------------------------------------------------------------------- |
| A3, A4, A5 | `R9-124` y `R9-125` (P0), `R9-126`, `R9-127` y `R9-128` (P1)                            |
| A8         | `R9-132` y `R9-133` (P2). El resto de A8 (escritores de notas y subrayados) se sostiene |
| A1         | los arreglos de `R9-9`/`R9-10` en su sitio; `R9-135` (P2, PLAUSIBLE)                    |
| A2         | sin hallazgos nuevos; lo «Verificado OK» de la fila se sostiene                         |
| A7         | `R9-129` (P1), que alcanza también a A10                                                |
| A10        | el traspaso de `R9-48` es correcto en el camino sano; `R9-134` (P2)                     |
| A11        | sin hallazgos nuevos                                                                    |
| A9         | sin hallazgos nuevos (una nota menor, no registrada)                                    |
| A6         | sin hallazgos nuevos: en web no hay auth, sync ni respaldo                              |
| B1         | el veredicto se sostiene, pero el conteo está viejo: hoy son 14 (3 high)                |
| B2, B3     | se sostienen: 98 commits nuevos y cero coincidencias                                    |
| B4         | `R9-136` (P2 antes del lanzamiento, PLAUSIBLE): abuso de la cuota compartida            |
| B5         | se sostiene                                                                             |

`A12` sigue `EN CURSO` y no entraba en el alcance.

**Lo que se releyó y se sostiene**, para que no se vuelva a derivar:

- **A1:** el «fail-closed» de `usePremiumOptional`, la clave `goog_` pública y el
  `invalidateCustomerInfoCache` de `refreshEntitlement`.
- **A2:** el `uid` del grant sale del token verificado, no del cuerpo; el anónimo se rechaza en el
  servidor; el grant va antes del marcado y la transacción respeta al ganador; la donación no llama
  a `handleCustomerInfo`; `setPremium` corta con `!__DEV__`. Con el Play de Ana y la cuenta de
  Beto, `ITEM_ALREADY_OWNED` → `restoreOffering()` transfiere la compra: es la decisión de producto
  de `R9-119`, no un hallazgo.
- **A7:** de los getters que `buildBackup` envuelve en `safeQuery`, todos propagan salvo
  `getAllReviewEvents` (`R9-129`). `queueWrite` sin uid retorna, así que restaurar con la sesión
  cerrada no encola nada: es `R9-38`.
- **A8:** todos los escritores de usuario encolan, y el recoloreo de `R9-44` encola la entidad
  devuelta. `clearAllData` sigue sin llamadores. `migrateCanonicalBookKeys` borra duplicados sin
  `queueDelete`, pero es una migración de una vez.
- **A9:** «el gating premium solo OCULTA» se sostiene en las 6 pantallas. Nota menor, no
  registrada: un cambio de `isPremium` con la Mesa abierta re-corre `load()` sobre el mismo pasaje
  y tira lo tecleado en los últimos <700 ms. Es la clase de `R9-47`/`R9-58`.
- **A10:** `hydrateFromStorage` del mazo re-parsea lo que escribe el import, así que la señal de
  `R9-28` sí adopta el mazo restaurado.
- **A11:** los dos providers re-hidratan desde disco y actualizan sus refs. «Cerrar sesión no limpia
  racha, progreso ni planes» sigue documentado como decisión (`deleteAccountData.ts:12-13`).
- **B5:** `ci.yml` sigue sin `pull_request_target`, sin `secrets.` y sin `${{ }}` dentro de `run:`.

---

## Los 19 hallazgos

| R9       | origen    | sev | estado      | título corto                                                     |
| -------- | --------- | --- | ----------- | ---------------------------------------------------------------- |
| `R9-124` | ag. 2 N7  | P0  | CONFIRMADO  | `removed` de la query filtrada tratado como borrado              |
| `R9-125` | ag. 2 N1  | P0  | CONFIRMADO  | `signInWithGoogle` sin anónimo no mira el dueño previo           |
| `R9-126` | ag. 2 N6  | P1  | CONFIRMADO¹ | un push con `updatedAt` viejo pisa la versión nueva en la nube   |
| `R9-127` | ag. 2 N2  | P1  | CONFIRMADO  | el `skipNextBulkPush` de `deleteAccount` anula un «Sí» posterior |
| `R9-128` | ag. 2 N3  | P1  | CONFIRMADO  | un apply remoto que falla se traga el error y el cursor avanza   |
| `R9-129` | ag. 2 N9  | P1  | CONFIRMADO  | `getAllReviewEvents` se traga el error (respaldo y sembrado)     |
| `R9-130` | ag. 1 N4  | P1  | CONFIRMADO  | el `claimLocalStore` de la colisión, sin prueba                  |
| `R9-131` | ag. 1 N5  | P1  | CONFIRMADO  | `{strict:true}` y `data.degraded`, sin prueba                    |
| `R9-132` | ag. 2 N4  | P2  | CONFIRMADO  | el `getLocal` de subrayados falla abierto                        |
| `R9-133` | ag. 2 N5  | P2  | CONFIRMADO  | el `getLocal` de favoritos dice «ausente» durante la carga       |
| `R9-134` | ag. 2 N10 | P2  | CONFIRMADO  | la guarda de dueño de `R9-48` falla abierta                      |
| `R9-135` | ag. 2 N8  | P2  | PLAUSIBLE   | el `linkUser` de RevenueCat se descarta en frío                  |
| `R9-136` | ag. 2 N11 | P2  | PLAUSIBLE   | cuota de Firestore agotable por cualquiera                       |
| `R9-137` | ag. 1 N1  | P2  | CONFIRMADO  | el dedupe por uid de la cola, sin prueba                         |
| `R9-138` | ag. 1 N3  | P2  | CONFIRMADO  | el `deleted:false` del bulk push, sin prueba                     |
| `R9-139` | ag. 1 N6  | P2  | CONFIRMADO  | la protección por sección de `R9-27`, en 3 secciones y 1 flag    |
| `R9-140` | ag. 1 N7  | P2  | CONFIRMADO  | el `MAX(longest_streak, ?)`, sin prueba                          |
| `R9-141` | ag. 1 N8  | P2  | CONFIRMADO  | el aviso de reiniciar tras importar, sin prueba                  |
| `R9-142` | ag. 1 N2  | P3  | CONFIRMADO  | el bucle caliente de `R9-22` solo lo delata un OOM de jest       |

¹ Por lectura, determinista. La mitad del listener está medida en `R9-124`.

**Severidades que el orquestador cambió respecto de la propuesta del agente:**

- `R9-132` y `R9-133`: de P1 a **P2**. La ventana no se abre sola; hace falta que la lectura falle
  o una versión local no encolada (`R9-38`). `R9-133` sería P1 si se suma el caso de la carga
  fallida.
- `R9-124`: se queda en **P0** para restaurar un respaldo. El caso del reloj atrasado es más
  estrecho de lo que decía el agente, porque el piso se fija al ENGANCHAR y no avanza.
- `R9-125`: **P0**. El disparador es estrecho (el anónimo falla al cerrar sesión y no se reinicia
  la app), pero la consecuencia es la de `R9-23` entera.

**`R9-125` y `R9-130` están en las mismas líneas** (`AuthContext.tsx:505-507`). Van con un solo
arreglo: mirar el dueño previo ANTES de bifurcar, con una prueba que pase por las tres ramas.

**Por qué ninguno repite un `R9-x` anterior** (el argumento de cada agente, comprobado):

- `R9-124`: `R9-35` es un cursor en el FUTURO, `R9-45` una lápida que nadie limpia, y
  `R9-46`/`R9-65`/`R9-106` el cursor frente a docs no aplicados. `grep removed` en `BUGS.md` y
  `detail/` daba cero.
- `R9-125`: `R9-23` está arreglado para la rama del link, y `R9-26` es otra causa.
- `R9-127`: `R9-122` es el `stop()` durante un `start()`, y `R9-103` la supresión global de ecos.
- `R9-128`: `R9-46` es la lectura, y `R9-65`/`R9-106` el cursor frente a conflictos.
- `R9-129`: `R9-49` son los 4 ledgers, y `R9-53` el floor disparado por un import.

---

## Salida de cada sonda

Las sondas y el arnés están en `_scratch/S21-sondas-agente-2/` y `_scratch/S21-agente-1-arnes/`,
que están gitignoreados y existen solo en la máquina de Victor. Llevan `.txt` al final del
nombre: `_scratch` no está excluido de `tsc`, eslint ni la `testMatch` de jest. **Si se pierden,
las recetas de abajo alcanzan para reconstruirlas.**

### `R9-124`: `zzS21probeRemoved.cjs` (SDK de JS real) y `zzS21probeEngine.test.ts`, caso N7

Receta: Firestore JS 12.17.0 de `node_modules/firebase`, `disableNetwork` antes de nada, proyecto
`demo-…`, caché en memoria. Listener con `where('updatedAt', '>=', 500)`, y X escrito con
`updatedAt` 1000 y reescrito con 100.

```
snapshot 1 [{"type":"added","id":"X","data":{"note":"edit en B, 10:00","updatedAt":1000}}]
snapshot 2 [{"type":"removed","id":"X","data":{"note":"edit en B, 10:00","updatedAt":1000}}]
```

El motor real ante ese `removed`:

```
{"remoteDeleteCalls":["X"],"localStillHasX":false,"queuedTombstones":0}
```

### `R9-125`: `zzS21probeAuth.test.tsx`

Receta: copia de `AuthContext.test.tsx` + un caso. `signInAnonymously` rechaza, dueño previo
`ana-uid`, 12 notas locales, y Beto inicia sesión con Google.

```
signInAnonymously calls 1 currentUser null
{"signedIn":{"uid":"beto-uid",...},"promptShown":false,"exportLocalDataCalls":0,"queueSkipCalls":0,"linkCalls":0,"ownerAfter":"beto-uid"}
```

### `R9-127` y `R9-128`: `zzS21probeEngine.test.ts` (arnés de `SyncEngine.test.ts`)

```
ana pushes 2
[INFO] SyncEngine: bulk push skipped by user | {"uid":"nuevo"}
{"flagNuevo":"skip","pushesNuevo":0}
{"afterRestartPushesNuevo":0}
```

```
{"appliedLocally":false,"cursorAfterFailedApply":1790120253158,"T":1790120253158}
{"whereFloor":[{"field":"updatedAt","op":">=","value":1790121153158}],"notaBRedeliveredAndApplied":false}
```

### `R9-129`: `zzS21probeBackupRev.test.ts` y `zzS21probeSeed.test.ts` (`reviewEventStore` REAL)

```
{"degradedSections":[],"exportedReviewEvents":[],"meta":{"degradedSections":[]}}
{"controlDegraded":["favorites"]}          ← control: la misma falla en favoritos SÍ se marca
{"deleteReviewEvents":1,"insertReviewEvents":0,"restoredSections":[…,"reviewEvents",…],"failedSections":[]}

{"readFails":true,"floor":"{…\"retentionBands\":{\"d1\":{\"total\":1,\"recalled\":1}}}","banner":true}
{"readFails":false,"floor":null,"banner":false}      ← control: misma BD, lectura sana
```

### `R9-130`: `zzS21a1probeAuth.test.tsx` (provider real, corrido con `-t S21PROBE`)

Ana entra por la rama de colisión con el almacén vacío, cierra sesión, entra el anónimo
`anon-beto`, y Beto enlaza un Google nuevo con 12 notas de Ana en el almacén.

```
HEAD:    {"ownerAfterAna":"ana-uid","settledWithoutPrompt":false,"promptShown":true,"exportCallsForBeto":1,"skipCalls":1,"ownerAfterBeto":"anon-beto"}
revert:  -    if (signedIn?.uid) await claimLocalStore(signedIn.uid);
         {"ownerAfterAna":null,"settledWithoutPrompt":true,"promptShown":false,"exportCallsForBeto":0,"skipCalls":0,"ownerAfterBeto":"anon-beto"}
```

Sin `-t`, la sonda falla también en `HEAD` (timeout), porque las 24 pruebas anteriores dejan
`mockImplementationOnce` sin consumir. No es el arreglo: es la sonda.

### `R9-131`, `R9-139` y `R9-49`: `zzS21a1probeBk.test.ts` (`AchievementService` REAL sobre el `executeSql` mockeado)

En `HEAD`:

```
export (los 4 SELECT de ledgers lanzan):
  {"degradedSections":["achievements.streakLog","achievements.completedBooks","achievements.bookReadingLog","achievements.chaptersReadLog"],"metaInFile":[…las 4…],"streakLogInFile":[]}
import (meta con notes, lastReadPosition, memoryDeck, reviewEvents y las 6 de achievements):
  {"sqlDeletes":["DELETE FROM favorites","DELETE FROM highlights"],"statsUpdates":0,"memoryDeckAfter":"{…Juan 3:16…}","failedSections":[…las 10…]}
```

Con cada revert (solo cambia lo indicado):

```
49a  degradedSections: ["achievements.completedBooks","achievements.bookReadingLog","achievements.chaptersReadLog"]   ← streakLog ya no se marca
27m  sqlDeletes: [..., "DELETE FROM reading_streak_log","DELETE FROM completed_books","DELETE FROM book_reading_log","DELETE FROM chapters_read_log"]
     y failedSections SIGUE diciendo que esas 4 no se restauraron
27d  sqlDeletes: [..., "DELETE FROM notes"]   (y "notes" pasa a restoredSections)
27j4 sqlDeletes: [..., "DELETE FROM completed_books"]
27j1 statsUpdates: 1   ← el UPDATE user_stats del restore, con los ceros de EMPTY_RAW_STATS
27n  statsUpdates: 1
27h  sqlDeletes: [..., "DELETE FROM review_events"]
27f1, 27g: sin cambio (redundantes)
```

### `R9-132`: `zzS21probeHl.test.ts` (motor real + `highlightsSyncAdapter` real)

Local con `updatedAt 9_000_000` y «NOTA NUEVA», remoto con `5_000_000` y «nota VIEJA»:

```
{"readThrows":true,"addHighlightCalls":["nota VIEJA del otro dispositivo"]}
{"readThrows":false,"addHighlightCalls":[]}      ← control: con la lectura sana, LWW la ignora
```

### `R9-133`: `zzS21probeFav.test.tsx` (`FavoritesProvider` real, `initialize()` retenido)

```
{"rowInSqlite":{"id":"fav-1","note":"NOTA NUEVA (local)","updatedAt":9000000},"getLocalWhileLoading":null}
{"getLocalAfterLoad":"NOTA NUEVA (local)"}      ← control
```

### `R9-134`: `zzS21probeStats.test.ts` (`memoryStatsSync` real)

`getItem` rechaza UNA vez, dueño `ana`, uid activo `beto`, log con eventos de Ana:

```
{"control":true,"setCalls":0,"ownerAfter":"ana"}                              ← lectura sana: se niega
{"wrotePaths":["users/beto/memoryStats"],"setCalls":1,"ownerAfter":"beto"}    ← un fallo: sube y reclama
{"seed":true,"clearCalls":0,"ownerAfter":"ana","floorFetched":0}              ← en el sembrado el mismo fallo es inocuo
```

### `R9-137` y `R9-138`: `zzS21a1probeSync.test.ts` (copia de `SyncEngine.test.ts` + 3 casos)

En `HEAD`:

```
S21OUT {"queueRightAfterBetoWrite":["uid-ana:Juan/3/16:ana-edit","uid-beto:Juan/3/16:beto-edit"],"queueAfterBetoFlush":["uid-ana:Juan/3/16:ana-edit"],"anaPushes":["ana-edit"],...}
S21OUT {"flushCallsIn200Ticks":2,...}
S21OUT {"sets":1,"hasDeletedKey":true,"deleted":false,"deletedAt":null}
```

Con el revert de 22b (`e.uid === entry.uid &&`), 149/149 verdes y:

```
S21OUT {"queueRightAfterBetoWrite":["uid-beto:Juan/3/16:beto-edit"],"queueAfterBetoFlush":[],"anaPushes":[],"allSets":["users/uid-beto/test/Juan~3~16=beto-edit"]}
```

Con el revert de 45b (las dos líneas del bulk push), 149/149 verdes y:

```
S21OUT {"sets":1,"hasDeletedKey":false}
```

### `R9-142`: las dos guardas del bucle a la vez

```
-    if (this.flushableCount() === 0) return;
+    if (this.queue.length === 0) return;
-      this.flushableCount() > 0 &&
+      this.queue.length > 0 &&
```

2 de 2 corridas, una con `SyncEngine.test.ts` SOLO: jest no produce JSON, y el proceso muere con
`FATAL ERROR: Ineffective mark-compacts near heap limit … JavaScript heap out of memory` a los
~63 s y 8,1 GB. Esto corrige el «0/73 verde aislada» de la primera parte de la sesión.

---

## Notas registradas (no son hallazgos nuevos)

- **La frase de `R9-23` «el mismo dueño volviendo no se interroga» es falsa en la app real.** Solo
  es cierta en un fixture inalcanzable (ver 23a2). Corregida en la entrada.
- **Jest cubre 1 de las 9 piezas de `R9-47`** (ver su tabla). Anotado en la entrada: la deuda de
  Modo C incluye el re-keying.
- **`B1` tiene hoy 14 vulnerabilidades (11 moderate, 3 high), no 8.** Las nuevas son de tooling,
  cobertura o build: `js-yaml` (high), `@xmldom/xmldom` (ahora high), `hono`, `morgan`,
  `stream-json` y `csv-parse`. Ninguna entra al bundle, así que el veredicto «0 alcanzables» se
  sostiene. Anotado en `R9-1` y en `detail/B1-npm-audit.md`.
- **El mock de `onSnapshot` de `SyncEngine.test.ts:184-199` FILTRA en vez de emitir `removed`.** Es
  la razón por la que `R9-124` es invisible para la suite, y cualquier prueba del arreglo necesita
  un mock que emita `removed`.
- **Un log de repasos sin dueño, anterior a la marca de `R9-48`, lo reclama quien escriba
  primero.** En un teléfono que cruza la actualización con cambio de cuenta, la historia de Ana va
  al doc de Beto. Es la decisión escrita en el commit, y la app tiene 0 usuarios. No se subió a
  hallazgo.

---

## Lo que queda para la sesión 22 y después

- **Los puntos 3 y 4 del doble check:** los P1/P2 nunca re-verificados (`R9-51`..`R9-64`) y las
  afirmaciones «comprobado y BIEN» de los `detail/S*` hasta `S18`. Lo nuevo va desde `R9-143`.
- **Arreglar los dos P0 nuevos.** `R9-124` necesita antes medir el SDK nativo de Android en Modo C,
  en el emulador, con el OK de Victor. `R9-125` + `R9-130` van en un solo arreglo.
- **La opción (a):** revisar el diff de la 20 (`25128b3..origin/main`).

---

## Lecciones de la sesión

- **Un stub del OTRO lado de la frontera responde la pregunta** (`R9-131`). Las pruebas de
  `R9-49`/`R9-27` fijan cada eslabón con un stub del otro: el export con un servicio que rechaza
  siempre, con o sin `strict`, y el import con un `restoreBackup` que es un `jest.fn()`. Las dos
  pasan con la pieza que dicen proteger quitada. **Si la prueba stubea el otro lado, el otro lado
  necesita su propia prueba con el código real.**
- **Un mock que implementa el SDK a su manera sustituye la semántica del SDK** (`R9-124`). El mock
  de `onSnapshot` filtra lo que no casa con el `where`. El SDK real emite `removed`, y el motor lo
  lee como borrado. Ninguna prueba podía verlo.
- **«Arreglado» no dice qué está vigilado.** Los 18 arreglos se sostienen, pero en 12 de ellos hay
  piezas que se pueden quitar con la suite entera en verde (algunas redundantes o sin efecto), y
  tres de esas piezas reabren un P0.
  Revertir el arreglo ENTERO lo habría escondido todo, porque siempre cae alguna prueba.
- **Una frase del ledger puede ser cierta sobre un fixture inalcanzable** (`R9-23`). La prueba del
  «mismo dueño» es verde y la frase es falsa en la app: el estado que el fixture fabrica no lo
  produce ningún camino real.
