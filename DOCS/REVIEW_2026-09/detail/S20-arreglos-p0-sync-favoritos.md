# S20 — arreglos: los dos P0 de la 19 (`R9-102`, `R9-103`), `R9-104` y `R9-105`

**Sesión 20, 2026-09-22. De ARREGLOS, con Opus 5.5.** Rama `fix/review-s19-p0-sync-favoritos`,
cuatro commits de código (uno por hallazgo) sobre `25128b3`:

| Commit    | Hallazgo | Qué                                                                       |
| --------- | -------- | ------------------------------------------------------------------------- |
| `8ea93b6` | `R9-105` | prueba del inicializador de `R9-9` con módulo fresco y sin reset          |
| `7aafc9c` | `R9-103` | la supresión de ecos pasa de global a por (colección, id)                 |
| `cfa7c1c` | `R9-104` | sesión de flush: `stop()` suelta el candado, el flush viejo no toca nada  |
| `00f69c4` | `R9-102` | `updateFavorite` encola la fila releída de SQLite, no la del actualizador |

**Compuertas:** `npm run validate` en verde sobre la punta, con el árbol limpio. Son 364 suites y
4299 pruebas: las 363/4289 de `main` más 1 suite y 10 pruebas nuevas. Cero «Test suite failed to
run», y lint con 0 errores. **CI de `origin/main` verificado EN EL LOG antes de empezar:** run
`35766748337`, intento 2, commit `25128b3`, Node v24.20.0, 363/4289, cero «failed to run».

**P0 abiertos tras esta sesión: 3** (`R9-36`, `R9-38`, `R9-39`).

---

## `R9-105` — la línea exacta de `R9-9`

- **Prueba:** `offeringService.test.ts`, bloque `R9-105`. Usa `jest.isolateModulesAsync`, sin
  `__resetForTests()` ni `__setApiKeyForTests()`, y pide DENTRO del registro aislado también los
  mocks de SecureStore y RevenueCat (los de fuera son otras instancias con otro estado).
- **Control del mecanismo:** `configure` llamado una vez. Si alguien deja el módulo dormido,
  falla eso y no una aserción que culparía a `R9-9`.
- **Visto fallar:** con solo el inicializador revertido a `= false` cae exactamente esta prueba
  (`Expected: false / Received: true`), y las otras 26 del archivo siguen verdes. Es el hallazgo
  de la 19 reproducido.

## `R9-103` — supresión por doc

- **Arreglo:** `suppressedDocs: Map<clave, profundidad>`, con la clave `suppressKey(colección,
id)`. `withLocalWriteSuppressed` recibe la colección y el id, y los 5 sitios de llamada los
  pasan.
- **Premisa re-verificada, no copiada de la 19:** ningún apply encola. Fuera del motor hay **19
  sitios** que llaman a `queueWrite`/`queueDelete`: 14 son acciones del usuario y 5 son el re-upload
  de un respaldo importado (`pushImportedEntitiesToSync`). O sea que la supresión global también
  podía tragarse **una restauración entera** si coincidía con una bajada.
  - **Corrección:** el mensaje de `7aafc9c` dice «los 31». Eran 31 LÍNEAS que los mencionan, con
    comentarios incluidos, y los sitios de llamada son 19. No se reescribió el commit.
- **Queda a propósito, y lo dice el código:** una edición del usuario al MISMO doc mientras se
  aplica su copia remota sigue perdiéndose. Las dos escrituras compiten por la misma fila local.
- **Pruebas:**
  - otro doc, con edición y borrado durante un apply en vuelo: suben. Lleva control de que el
    apply esté en vuelo. Vista fallar en `HEAD`.
  - el eco del mismo doc, upsert y borrado: sigue suprimido. No discrimina a propósito, y lleva
    control de que los dos applies corrieron; sin él pasaba sin mirar nada.
- **Revert:** con `isSuppressed` devolviendo `size > 0` (lo global de antes) cae solo la de otro
  doc. Las de `R9-104` siguen verdes, así que los dos arreglos no se desarman entre sí.

## `R9-104` — el flush y el cambio de cuenta

### Lo que el SDK hace con un `set()` en vuelo al cambiar de usuario

**Leído en la fuente del SDK de JS** (`@firebase/firestore` 4.17.0, `common-*.node.mjs`):

- `addMutationCallback` guarda el callback de cada escritura bajo `currentUser.toKey()`.
- `processUserCallback` lo busca bajo el usuario ACTUAL.
- `syncEngineHandleCredentialChange` cambia la cola de mutaciones de usuario y solo rechaza los
  `waitForPendingWrites`.

O sea: **una escritura del usuario anterior que no llegó a confirmarse ni se resuelve ni se
rechaza** mientras haya otro usuario. Es la rama «queda pendiente». **El SDK nativo de Android,
que es el que corre la app, NO se midió.** Victor pidió medirlo en Modo C, y eso necesita dos
cuentas en el emulador; ver «Dicho y no hecho».

### La afirmación del ledger era falsa

El ledger decía: «volver a comprobar `item.uid === this.uid` después de cada `await` [...] sirve
para las dos ramas». **Medido:** aplicado solo eso (el chequeo después de sacar de la cola lo que
aterrizó, y la ruta con `item.uid`), pasan la rama «resuelve después» y la del descarte, y **la
rama «no resuelve nunca» sigue roja**. Ese `await` no vuelve, así que nada que vaya después de él
corre. Y es justo la rama que toma el SDK de JS.

Primera medición, descartada: con el chequeo puesto ANTES de sacar la entrada de la cola, la
prueba 1 también caía, pero por mi colocación (la entrada que sí aterrizó se quedaba en cola), no
por el arreglo del ledger. Se repitió bien colocado antes de concluir nada.

### El arreglo

- `flushSession`: `stop()` la incrementa y suelta el candado (`flushInFlight = false`) él mismo.
- El flush viejo, al volver de cualquier `await`, ve `!isCurrent()` y no toca nada de la sesión
  siguiente: ni el resto del lote, ni el estado, ni el candado.
  - Si su push aterrizó, lo saca de la cola, porque aterrizó donde se emitió.
  - Si falló, deja la entrada intacta para su dueña, porque el fallo pudo causarlo el propio
    cierre de sesión.
- `pushOne` arma la ruta con `item.uid` y se niega a escribir si no es la cuenta activa.
- **Se quitó una guarda del re-flush final que no protegía nada.** Llamar a `flush()` en la sesión
  actual es seguro siempre que el candado esté en su sitio, y el candado lo cuida la guarda del
  `finally`.

### Pruebas y matriz de reverts

Las cuatro llevan un `set()` retenido (`mockSetGate`, nuevo en el mock de Firestore) que sigue en
vuelo al hacer `stop()` + `start('uid-beto')`, y las cuatro se vieron caer contra el motor del
commit anterior (`7aafc9c`):

1. **resuelve después:** nada en `users/uid-beto/`, `doc1` en `users/uid-ana/`, y `doc2` aparcado
   para Ana con `attempts 0`. En `HEAD`, `doc2` de Ana caía en `users/uid-beto/test`, que es la
   medición de la 19 calcada.
2. **no resuelve nunca:** Beto sube lo suyo. En `HEAD` no subía nada.
3. **el flush viejo no le suelta el candado al de Beto:** sin la guarda del `finally`,
   `doc-beto-1` subía dos veces, por dos flushes en paralelo.
4. **falla después:** nada de `droppedWrites` en Beto ni en Ana, y la entrada de Ana intacta con
   `attempts 7`. En `HEAD`, Beto quedaba con `droppedWrites 1`.

| Pieza revertida (sobre el código final)       | Qué cae                           |
| --------------------------------------------- | --------------------------------- |
| soltar el candado en `stop()`                 | las 4                             |
| el corte del `catch`                          | la 4                              |
| la guarda del `finally`                       | la 3                              |
| el corte de la rama de éxito                  | nada (lo cubre la guarda de push) |
| la guarda de dueño en `pushOne`               | nada (lo cubre el corte de éxito) |
| las dos anteriores juntas                     | la 1                              |
| la ruta con `item.uid` (sola o con la guarda) | nada                              |
| la supresión por doc de `R9-103`              | solo la suya                      |

**Lo que eso significa:** el corte de éxito y la guarda de `pushOne` son capas que se cubren entre
sí. La ruta con `item.uid` **no la discrimina ninguna entrada alcanzable** mientras esté en pie
cualquiera de las otras dos. Está porque Victor la pidió y es barata: hace el invariante cierto
por construcción y no por el orden de las líneas.

**Una aserción que no medía su comentario.** La primera versión de la prueba 3 afirmaba
`isSyncing === true` con un comentario que decía que, sin la guarda, Ajustes diría «sincronizado».
Revertida la guarda, **esa aserción pasaba**: el re-flush del flush viejo arranca enseguida un
segundo flush, que vuelve a poner `isSyncing` en `true`. Lo que de verdad se ve es la doble subida,
y la prueba ahora afirma eso. Salió solo por revertir la guarda **por separado**.

## `R9-102` — favoritos

- **Arreglo:** el payload sale de la fila recién escrita (`bibleDB.getFavoriteById`, nuevo), no
  del estado de React.
  - Comparte columnas y mapeo con `getFavorites` (`FAVORITE_COLUMNS`, `rowToFavorite`), así que
    una fila y la lista no pueden discrepar.
  - El archivo queda con un `any` menos (7 → 6 avisos).
- **Pruebas** (`favoritesUpdateQueuesSync.test.tsx`): provider y reconciliador reales, SQLite como
  tabla en memoria con la semántica del UPDATE parcial, y el motor instalado con `setSyncEngine`.
  - **Con trabajo pendiente en la fibra:** es el del flujo real, `refreshFavorites` al enfocar la
    pestaña. Control: dentro del `act` no se renderizó nada, ni antes ni después de editar.
  - **Añadir y editar dos veces antes de que React renderice:** la última entrada de la cola lleva
    las dos ediciones.
  - **Editar uno que no existe no encola:** control, no discrimina.
- **Revert:** con `updateFavorite` como estaba, caen las dos primeras (0 y 1 encoladas). Con el
  arreglo **a medias**, que calcula el payload desde `favoritesRef` fuera del actualizador, pasa
  la primera y **cae la segunda**. Ese es su trabajo: un ref copiado del estado no ve un favorito
  añadido hace un instante.
- **SQL medido contra SQLite real** (`node:sqlite`, Node 24), con el `CREATE TABLE` y las columnas
  sacados del archivo, porque el mock de la prueba no lo ejercita. Da la misma forma que una fila
  de la lista, y nada para un id inexistente.

---

## Dicho y NO hecho

- **`R9-104` no se midió con el SDK nativo (Modo C).** Hay AVDs y emulador, pero el motor solo
  corre con cuentas de Google, y en el emulador no hay dos cuentas de prueba.
  - **Alternativa barata sin Google:** una sonda con dos sesiones ANÓNIMAS (`set()` sin red,
    `signOut`, `signInAnonymously`, ver si la promesa vuelve). Pero escribe en el Firestore de
    PRODUCCIÓN y crea dos usuarios anónimos, así que queda para que Victor decida.
  - **La severidad queda en P1:** la evidencia del SDK de JS apunta a la rama «no sincroniza», no
    a la de mezcla. El arreglo cubre las dos.
- **`R9-102` sin verificar en dispositivo**, igual que su hallazgo.
- ~~La rama espera el OK de Victor.~~ Victor lo dio: se mergeó en fast-forward y se pusheó.

## Lecciones de la sesión

> **Una propuesta de arreglo escrita en el ledger es una hipótesis, no una especificación.** La de
> `R9-104` decía «sirve para las dos ramas» y la escribió una revisión que no la midió. Medida
> antes de implementarla, fallaba justo en la rama que toma el SDK. **Un `await` que no vuelve no
> se arregla mirando después del `await`.**

> **Revertí cada PIEZA de un arreglo por separado, no el arreglo entero.** Revertido entero, el de
> `R9-104` tumbaba las 4 pruebas y parecía cubierto. Pieza por pieza salieron cuatro cosas:
>
> - dos capas redundantes (ninguna discriminada sola);
> - una guarda que no protegía nada, y se quitó;
> - una guarda sin prueba, y se le escribió;
> - una aserción cuyo comentario afirmaba algo que la aserción no medía.

> **El heredoc del Bash tool se comió otra vez una barra invertida**, esta vez dentro de un script
> de Python: `'\\u0000'` llegó como `'\u0000'` y Python escribió un **NUL literal** en
> `SyncEngine.ts`. La señal fue `git diff` diciendo «Binary files differ». Para cualquier cosa con
> barras invertidas, usá la herramienta de edición o un script de Node escrito sin ellas.
