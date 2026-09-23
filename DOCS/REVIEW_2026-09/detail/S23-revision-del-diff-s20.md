# S23 — revisión del diff de la sesión 20 (`25128b3..ca2cd71`)

**Sesión 23, 2026-09-23. Solo de REVISIÓN, con Opus 5.5.** Es la opción (a) de `CONTINUAR.md`. Victor
delegó el orden: primero la (a), y después la (c) en la 24. No se tocó código.

- **Base:** `714d627`. Su CI está verificado EN EL LOG al empezar: run `35897985450`, 3 jobs verdes,
  Node v24.20.0, 364/4299 y cero «failed to run». **El código de `HEAD` es idéntico al de
  `00f69c4`**: después de la 20 solo cambiaron docs (`git diff --stat 00f69c4 714d627 -- . ':!DOCS'`
  vacío).
- **Agentes: 3, no 5**, por lo que pasó en la 22. Todos eran forks en worktree aislado, con informe
  incremental en `_scratch/S23-agente-N.md`, sondas copiadas con `.txt` a
  `_scratch/S23-sondas-agente-N/` en cuanto se corrían, y la lista de ya reportados
  (`_scratch/S23-ya-reportados.txt`). **Ninguno se cortó.** Los 3 worktrees se borraron solos al
  terminar (sin cambios netos) y no dejaron ramas.

| agente | alcance                                                                     |
| ------ | --------------------------------------------------------------------------- |
| 1      | `SyncEngine`: `R9-104` y `R9-103`, código y pruebas por pieza               |
| 2      | favoritos y dinero: `R9-102` (con la pregunta de web) y `R9-105`, por pieza |
| 3      | las afirmaciones de la 20 contra el mundo, y lo transversal de las pruebas  |

- **Lo que subió a P1 lo verificó el orquestador con una sonda propia**
  (`_scratch/S23-sondas-orquestador/`).

**Resultado: los cuatro arreglos de la 20 se sostienen, y dentro de su diff no hay ningún P0 ni P1.**
Salieron **4 hallazgos, `R9-153`..`R9-156`** (1 P1 y 3 P3), y `R9-122.4` sube de P3 a P2. **Siguen 5
P0 abiertos** (`R9-36`, `R9-38`, `R9-39`, `R9-124`, `R9-125`). Hallazgos: **156**.

---

## `R9-104` (`cfa7c1c`)

**¿Dos flushes de la MISMA sesión a la vez? No hay camino** (leído, agente 1):

- El candado solo lo sueltan `stop()`, que cambia de sesión, y el `finally` de un flush actual.
- Entre `if (this.flushInFlight) return` y `this.flushInFlight = true` no hay ningún `await`.
- `isCurrent()` compara un CONTADOR que solo crece. No compara el uid, así que un flush viejo no
  puede verse actual por error, tampoco con el mismo uid.
- Todos los disparadores pasan por esa guarda: `queueWrite`, `queueDelete`, NetInfo, el intervalo,
  `start()`, el bulk push y el re-flush de cola, incluido el del flush viejo.

**`deleteAccount`, con `stop()` + `start()` del MISMO uid y un push en vuelo** (medido, sonda
`S23 PROBE A`): el flush nuevo vuelve a subir el doc retenido, y al soltarse el viejo queda
`sets: [ana/doc1, ana/doc2, ana/doc1]`, con la cola vacía, `pending 0` y `dropped 0`. **Nada se
pierde, se quema ni cruza.** Cuesta una escritura duplicada por push en vuelo, que es el precio de
soltar el candado en `stop()`. Si el viejo falla después del reinicio, el intento lo cuenta solo el
flush nuevo (`attempts 3 → 4`).

**La matriz de reverts de la 20 es cierta fila por fila** (rehecha por pieza, cada fila restaurada
con `git diff` vacío; `_scratch/S23-sondas-agente-1/matriz-reverts.txt`):

| Pieza revertida (sobre HEAD)                 | Qué cae      | La 20 decía     |
| -------------------------------------------- | ------------ | --------------- |
| `stop()`: las DOS líneas                     | las 4        | las 4 ✅        |
| `stop()`: solo `flushInFlight = false`       | 2 y 3        | (no la separó)  |
| `stop()`: solo `flushSession += 1`           | 1, 3 y 4     | (no la separó)  |
| el corte del `catch`                         | la 4         | la 4 ✅         |
| la guarda del `finally`                      | la 3         | la 3 ✅         |
| el corte de la rama de éxito                 | nada         | nada ✅         |
| la guarda de dueño en `pushOne`              | nada         | nada ✅         |
| corte de éxito + guarda de `pushOne`         | la 1         | la 1 ✅         |
| corte de éxito + corte del `catch`           | 1 y 4        | —               |
| la ruta con `item.uid`, sola o con la guarda | nada         | nada ✅         |
| `R9-103`: `isSuppressed` global (`size > 0`) | solo la suya | solo la suya ✅ |

Hay dos precisiones, que van en `R9-156.6`. «Soltar el candado» son dos piezas, y las dos
discriminan. Y el corte de éxito lo cubren la guarda de `pushOne` Y el corte del `catch` juntos: la
guarda lanza, y quien absorbe la excepción sin gastar el intento es el corte del `catch`.

**La ruta con `item.uid`: no la discrimina ninguna entrada alcanzable**, tampoco `deleteAccount` con
el mismo uid (ahí `item.uid === this.uid`). Lo que dijo la 20 es cierto.

**`R9-22` contra `R9-104`: lo que midió la 21 se confirma.** Revertida solo la guarda de uid de
`isDue`, la prueba titular de `R9-22` sigue verde (caen otras 3). Con la guarda de `pushOne`
revertida también, caen 7, la titular incluida. Son dos capas, y la titular vigila la suma.

**`mockSetGate` no responde la pregunta que hace la prueba:** `beforeEach` lo pone en `null`, y
registra el `set` DESPUÉS del `await gate`. Hay dos notas, que van en `R9-156.7`. Las pruebas 1 y 4
inyectan desenlaces que ningún SDK medido produce al cambiar de usuario (resolver o rechazar), así
que son defensivas. Y el mock no mantiene el orden de escrituras de un mismo usuario.

## `R9-103` (`7aafc9c`)

- **No hay ecos de OTRO doc.** Se leyeron los 5 adaptadores registrados (`favorites`, `memoryCards`,
  `notes`, `highlights` y `reviewEvents`; el agente dijo 6), y ningún apply encola. Tampoco lo hace ningún efecto de React. Además,
  un efecto corre después del render, fuera de la ventana del `await fn()`, así que ninguna
  supresión lo habría cubierto nunca.
- **La clave no colisiona:** `${colección}\u0000${id}`, y ninguna colección lleva NUL. En el archivo
  no hay un NUL literal (0 bytes `\000`).
- **Los 5 sitios pasan el id LÓGICO**, el mismo que usan los llamadores de `queueWrite`.
- **El `removed` de `R9-124`:** para el mismo doc no cambia nada, y para los otros mejora. Una
  edición de Y durante el `removed` de X ahora sube; antes se perdía.
- **Tres de los cinco sitios no tienen prueba:** el `removed`, `keepTheirs`, `merge` y el conteo de
  profundidad. Revertido cada uno, 73/73 (`R9-154`). El impacto hoy es nulo, porque la supresión
  entera es defensiva.

## `R9-102` (`00f69c4`)

- **Un apply remoto del mismo favorito entre la escritura y la relectura** (medido, agente 2, con
  provider, adaptador y motor reales): la edición del usuario se pierde en SQLite, en pantalla y en
  la cola, y se encola la copia remota. Con el remoto a 5 s se salta la UI de conflictos; el control,
  con el remoto después del render, da `conflicts=1`. **La causa no es la relectura:** es `getLocal`,
  que lee `favoritesRef` (`FavoritesContext.tsx:143-147`), y ese ref va detrás de SQLite hasta el
  render siguiente. Es otra ventana de `R9-133` (nota en su entrada). `R9-102` no lo empeoró: con el
  código viejo, la misma sonda encola 0.
- **Si la relectura da `null`** (una lápida remota en la ventana): no se encola nada, no hay error y
  gana el borrado. Es coherente.
- **En web no hay un `R9-13`:** no existe `index.web.ts`, así que la web usa la misma clase
  `BibleDatabase`, que tiene `getFavoriteById`. La compuerta de paridad solo compara pares `.web` y
  no aplica (77/77). En web no hay `SyncEngine`, así que no se encola nada, ni antes ni después.
- **`FAVORITE_COLUMNS`/`rowToFavorite`:** medido contra `node:sqlite` (Node v24.11.1) con el
  `CREATE TABLE` del archivo, la fila de `getFavoriteById` es idéntica a la de `getFavorites`, y un
  id inexistente da `null`.
- **Las pruebas, por pieza:** sin el arreglo caen la 1 y la 2; a medias con el ref cae la 2; sin
  `if (written)` cae la 3 con un `TypeError`. El mock de SQLite no le da la respuesta a la prueba,
  porque su UPDATE parcial toca los mismos 5 campos que el real. **Hueco:** la prueba 2 usa solo un
  favorito NUEVO, y un arreglo a medias distinto (el ref, y SQLite solo si no está en el ref) pasa
  las 3 (`R9-155`).

## `R9-105` (`8ea93b6`)

- Con el inicializador en `= false` cae exactamente esa prueba, y las otras 26 siguen verdes. La
  aserción de la caché y la de `seen` discriminan cada una por su cuenta.
- Con `apiKey = ''` cae el control (`configure` 0 de 1), no la aserción de `R9-9`: el control hace
  su trabajo. Con el dedupe en `?? false` caen 3.
- No hay otra línea vecina sin prueba. Lo que pone `__resetForTests` coincide con los
  inicializadores, salvo `apiKey`, y eso es justo lo que cubre la prueba aislada.
- **Su comentario es falso:** el SecureStore aislado es la MISMA instancia
  (`outerStoreHasPreseed:"true"`). RevenueCat sí es otra (`R9-156.8`).

## Lo que el ledger afirma de la 20, contra el mundo

De 30 afirmaciones, **25 son CIERTAS, 1 FALSA hoy, 3 A MEDIAS y 1 NO VERIFICABLE**. La tabla entera
está en `_scratch/S23-agente-3.md`.

**Ciertas:**

- El SDK de JS es la 4.17.0, y `addMutationCallback`, `processUserCallback` y
  `syncEngineHandleCredentialChange` dicen lo que dice el ledger.
- RNFirebase es la 26.2.0, y el AVD, `Pixel_9_Pro` con API 36. Entre `68b4367` (3.2.61) y
  `47adfec` solo cambiaron metro 0.84.5, `@expo/metro` 56.0.2 y `expo-build-properties`.
- `app/probe-r9104.tsx` no está en ninguna rama ni en el historial.
- La limpieza de los docs en producción: una consulta collection-group de `r9104probe`, solo de
  lectura, da 200 y 0 docs, con un control que devuelve 1.
- Los conteos:
  - 19 llamadores (14 del usuario y 5 del respaldo);
  - 5 sitios de `withLocalWriteSuppressed`;
  - 10 pruebas y 1 suite nuevas: 363/4289 → 364/4299 en el log, con `PASS` en las tres suites;
  - los `any` bajan de 7 a 6.
- Las tres suites tocadas pasan juntas, cada una sola y con `--randomize` en 5 semillas, y corren en
  CI.

**Las que no:** van todas en `R9-156`:

- el comentario de `SyncEngine.ts:271-272`;
- «nunca» y «para siempre»;
- «no toca nada más»;
- la ruta de `[name].tsx`;
- los uid que no se anotaron.

---

## `R9-153` — el vecino de `R9-104`: `handleSnapshot` no tiene sesión

**Lo encontró el agente 1, y el orquestador lo verificó con una sonda propia sobre `HEAD`.**

**Leído:**

- El bucle de `handleSnapshot` (`SyncEngine.ts:889-1008`) hace un `await` por doc y nunca mira si
  hubo un `stop()`. `recordConflict` (`:1061`) no tiene guarda de uid ni de sesión.
- `stop()` vacía `this.conflicts` (`:459`), pero `start()` no (`:372-379`): solo llama a `stop()`
  si `this.uid` es otro, y después de un `stop()` es `null`.
- `resolveConflict` (`:1367-1445`) tiene como único llamador la pantalla de conflictos. Con
  cualquier elección, `logResolvedConflict` escribe `users/${this.uid}/conflicts/<id>` con la
  `remoteVersion`, que es la copia de la nube de Ana. `keepMine` y `merge` además encolan bajo la
  cuenta activa.
- `SyncEngineContext.tsx:92-127` vuelve a llamar a `stop()` cuando el usuario pasa a `null` y a
  anónimo. Eso acota la ventana de registro: el lote tiene que seguir en vuelo después de que entra
  el anónimo, o durante el `start()` de Beto.

**Medido** (`zzS23orqN1.test.ts.txt`, salida en `N1-salida.txt`):

| Caso                                                        | Conflicto en Beto | En `users/uid-beto/`                                      |
| ----------------------------------------------------------- | ----------------- | --------------------------------------------------------- |
| C0, control: el lote termina ANTES del `stop()`             | `[]`              | nada (antes del `stop()` existía `["test__a2"]`)          |
| V1: el lote termina con la sesión CERRADA; Beto entra luego | `["test__a2"]`    | `conflicts/test__a2` con `remoteVersion: "remoto-de-ana"` |
| V2: el lote termina durante `start(beto)`, `keepMine`       | `["test__a2"]`    | `test/a2` + `conflicts/test__a2`                          |
| V3: el lote termina con la sesión CERRADA, `merge`          | `["test__a2"]`    | `test/a2` con el valor combinado + `conflicts/test__a2`   |

**La V1 ensancha el caso del agente:** no hace falta que el lote siga en vuelo cuando entra Beto.
Una vez registrado, el conflicto espera a quien entre en el mismo proceso, sin límite de tiempo.

**P1 y no P0, decidido con Victor.** Es de la clase P0, mezcla entre cuentas, pero hacen falta tres
cosas juntas:

1. un conflicto real en un lote que siga en vuelo después del `stop()` reactivo;
2. otra cuenta que entra sin reiniciar la app;
3. que esa persona lo resuelva a mano.

La copia local de Ana ya está en el teléfono por diseño (`R9-59`). Lo nuevo es lo que cruza de una
nube a la otra.

**El mismo agujero envenena el cursor** (agente 1, medido). El caché de cursores en memoria, y con
él el PRIMER enganche de Beto, sale con piso `cursorDeAna − 5 min`, y un doc de Beto de hace 1 hora
no baja nunca. Por eso `R9-122.4` sube de P3 a P2.

**Arreglo (hipótesis, sin medir):** darle a `handleSnapshot` la misma sesión que al flush. Al volver
de cada `await` después de un `stop()`, el lote corta sin registrar conflictos, sin mover el cursor
y sin tocar el estado. Arreglaría los dos. **En la 24 va después de `R9-124`**, que toca el mismo
bucle (decidido con Victor).

## Los 4 hallazgos

| #        | Sev. | Qué                                                                                            |
| -------- | ---- | ---------------------------------------------------------------------------------------------- |
| `R9-153` | P1   | `handleSnapshot` sin sesión: el conflicto de Ana pasa a Beto y, al resolverlo, cruza a su nube |
| `R9-154` | P3   | 3 de los 5 sitios de `withLocalWriteSuppressed` y la profundidad, sin prueba                   |
| `R9-155` | P3   | la prueba de `R9-102` cubre la edición anterior solo con un favorito NUEVO                     |
| `R9-156` | P3   | docs y comentarios de la 20 (agrupado, 8 puntos)                                               |

Además hay dos notas:

- en `R9-133`: otra ventana del ref atrasado;
- en `R9-126`: la escritura aparcada sale cuando la cuenta vuelve, con su `updatedAt` viejo. Es
  inferido de la fuente y no se midió.

## Lecciones de la sesión

> **Un arreglo que le pone sesión a UN bucle deja abierto el OTRO bucle con `await` que cruza el
> mismo `stop()`.** La 20 cerró el flush y dejó `handleSnapshot`. Es la forma de siempre (el
> arreglo cierra el caso de su prueba y deja abierto el vecino), esta vez dentro del mismo archivo.

> **Lo que `stop()` limpia, `start()` no lo vuelve a limpiar.** Todo lo que se escribe entre los dos
> lo hereda la cuenta que entra.

> **Un dato que no se anota no se puede re-verificar.** Los uid de las cuentas de la sonda de la 20
> no quedaron escritos. Anotá los identificadores de todo lo que una sonda crea en el mundo.

> **3 agentes completaron sin cortes**, contra los 5 que se cortaron a la vez en la 22.
