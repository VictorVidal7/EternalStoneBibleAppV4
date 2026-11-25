# Sesión 182 — tanda 2, parte 1: las lecturas que fallan y pisan, y los mapas de planes del respaldo

> 2026-11-25. Opus 5.5 principal, sin agentes, sin emulador. Desde main = origin/main = `86c78130` (la 181
> mergeada). Rama `fix/s182`: `621793fd` (`R9-413` y `R9-414`), `457a6494` (`R9-421`), `69d3d052` (`R9-636`, nuevo)
> y `fdc69e7c` (`R9-411`). Cortada por forma (regla 4 del mensaje): la forma 2 entera y `R9-411`; `R9-560`, `R9-31`,
> `R9-32` y `R9-53` pasan a la 183. Scripts: `_scratch/S182-rev.cjs.txt` y las piezas `S182-piezas-*.json.txt`.

## 1. La reproducción, con el productor real

La sonda de la 114 (`_scratch/S114-sondas-agente-6/S114-a6-lecturaFallida.test.tsx.txt`), copiada a `__tests__` y
corrida contra `86c78130`, da lo mismo que en la 114, en los tres providers:

| Caso                        | Disco tras la lectura que rechaza                             | Control (lectura sana)      |
| --------------------------- | ------------------------------------------------------------- | --------------------------- |
| Preferencias, sin tocar     | `{"theme":"system","fontSize":16,"sepiaGrandfathered":false}` | `sepia`, 24, `true`         |
| Progreso, un capítulo       | solo `Mark`                                                   | John, Luke, Genesis y Mark  |
| Planes, un día de otro plan | solo `planB`; `planA` perdido                                 | `planA` (1, 2, 3) y `planB` |

Con los arreglos, las tres filas dan lo del control. La sonda se borró al terminar.

## 2. `R9-413` y `R9-414`: un arreglo común (`621793fd`)

Son la misma raíz (un provider que escribe su objeto o su mapa ENTERO desde memoria, y una lectura que rechaza deja
los valores por defecto) y van en un commit. La forma de `R9-267`, arreglada como en el mazo, sin su registro de
operaciones:

- **La marca.** `getItem` que rechaza → `unreadRef = true`. Una lectura que respondió la baja, también si el JSON no
  se lee: ese ya está perdido, y releer no lo trae (la misma frontera que `R9-267`).
- **Progreso de capítulos** (`ReadingProgressContext.tsx`). `updateChapterProgress`, con la marca, espera una
  relectura (una sola, compartida por todos los que llegan mientras está en vuelo) y aplica el capítulo sobre
  `progressRef`, que `saveProgress` adelanta ANTES de su `await`: así dos capítulos en vuelo se encadenan.
- **Progreso de planes** (`ReadingPlanProgressContext.tsx`). Los seis escritores del mapa y `markChapterRead`, con la
  marca, esperan `ensureRead()` (relectura compartida). Los escritores parten ahora de `progressRef.current`, leído
  DESPUÉS del `await` (leerlo en un `.then` daba la misma base a los dos escritores en vuelo: lo tumbó la prueba de
  dos escritores). Sin la marca no hay `await`: el camino normal sigue síncrono hasta `persist`, como antes. Cambio
  de comportamiento acotado: antes partían del `progress` del cierre; el ref es igual o más nuevo (lo ponen el
  efecto, `persist` y la hidratación), y dos toques en el mismo render ya no se pisan.
- **Preferencias** (`ReaderPreferencesContext.tsx`). El efecto de persistencia, con la marca: sin cambios no
  escribe; con cambios relee (una relectura a la vez) y la hidratación pone encima el parche de lo cambiado. Todos
  los setters pasan por `update(patch)`, que guarda el parche mientras el disco está sin leer. Tras una relectura
  buena, un objeto nuevo re-dispara el efecto (también cuando no había blob y nada más cambió).
- **La salida (`R9-212`).** Si la relectura también falla, se escribe lo de memoria, como antes, y la marca SIGUE: la
  escritura siguiente vuelve a intentar. El `unread = false` de la salida que escribí primero era una guarda que no
  hacía falta (§5 de `CONTINUAR.md`: guarda equivalente, quitarla).
- **Coste:** con la lectura fallida, la pantalla muestra los valores por defecto hasta la primera escritura (como
  antes; igual que el mazo). El lector no reintenta solo.

**Revert por pieza** (`__tests__/failedReadNoOverwrite.test.tsx`, 16 casos, con los providers reales y el modelo
del ejecutor serie de `memoryDeckDisk.test.tsx` para `getItem` y `setItem`):

| Pieza                                   | Cae |
| --------------------------------------- | --- |
| progreso: relectura antes de escribir   | 2   |
| progreso: una sola relectura compartida | 1   |
| progreso: el ref encadena               | 1   |
| progreso: la marca                      | 2   |
| planes: `toggleDay` relee               | 3   |
| planes: `setPlanDuration` relee         | 1   |
| planes: `markChapterRead` relee         | 1   |
| planes: la marca                        | 4   |
| planes: una sola relectura compartida   | 1   |
| prefs: sin cambio no escribe            | 1   |
| prefs: la marca                         | 3   |
| prefs: el parche encima de lo leído     | 2   |
| prefs: el parche se guarda              | 4   |
| prefs: re-render tras releer            | 1   |
| prefs: la salida                        | 1   |
| prefs: una relectura a la vez           | 1   |

**Lo que la medición agregó:** con la primera puerta de la prueba (que leía el disco al SOLTARSE), las dos piezas
de «una sola relectura compartida» no caían. Con el modelo serie (la lectura ve el disco de su turno, corolario 58)
caen. Las dos versiones de la prueba miden cosas distintas; quedó la serie.

**Quién más escribe esas claves (`grep`):** `readingProgress`, el respaldo (`importBackup`, con señal: su recarga es
la misma `loadProgress`, que baja la marca); `@reading_plan_*`, solo el provider y el respaldo; `@reader_preferences`,
solo el provider y el respaldo. Las 31 suites que montan alguno de los tres providers: 265/265.

## 3. `R9-421`: el heredado se deriva una vez (`457a6494`)

`sepiaGrandfathered` se recalculaba en cada hidratación (`=== true || theme === 'sepia'`). Ahora se deriva solo si
el blob NO trae la clave (anterior al gate: todo blob escrito desde entonces la lleva); si la trae, se obedece.

- **Prueba, con el productor real:** instalación nueva, `setTheme('sepia')`, desmontar, montar (frío): `false` en
  pantalla y en disco. Y un `false` explícito junto a `theme: 'sepia'`. Las dos, rojas sin el arreglo
  (`Expected: false, Received: true`).
- **Matriz:** blob sin clave y Sepia → `true` (prueba vieja); clave `true` y otro tema → `true` (vieja); `false` y
  Sepia → `false`; la salida de `R9-413` (dos lecturas fallidas seguidas) escribe el `false` de memoria: un heredado
  lo pierde solo ahí (coste aceptado, como el resto de lo de disco en esa salida).
- **Lo que NO cierra: el respaldo.** El candidato de la 125 (`A30`): un archivo con `sepiaGrandfathered: true` lo
  abre en el aparato que lo importa. `BackupService.ts` lo conserva A PROPÓSITO (su cabecera: «Preserves
  `sepiaGrandfathered`»), contra la frase «device-local, never synced» del tipo. Quitarlo deja sin Sepia a un
  heredado que reinstala y restaura su propio respaldo; dejarlo, abre Sepia con un archivo editado. Es decidir si
  el heredado viaja con el usuario: queda abierto como nota de `R9-421`, para Victor (no lo agrego a la §8 sin su
  OK; propongo: que viaje, el coste es un tema de cuatro).

## 4. `R9-636` (nuevo, P3): «Restablecer» le quitaba Sepia al heredado (`69d3d052`)

Al leer quién escribe el flag: `reset()` ponía `DEFAULT_READER_PREFERENCES` entero, con `sepiaGrandfathered: false`.
Un toque en «Restablecer» del lector (`ReaderPreferencesSheet.tsx`, contexto del lector) le quitaba Sepia para siempre
a un aparato heredado. De antes de la 182: antes del arreglo de `R9-421` también se perdía (el tema pasaba a
`system` y la derivación siguiente daba `false`). El parche del reset deja fuera la clave, así que sobrevive también
con el disco sin leer. Prueba con el provider real, roja sin el arreglo (`Expected: true, Received: false`).

## 5. `R9-411`: los mapas de planes que no son un objeto (`fdc69e7c`)

- `importBackup`: cada una de las dos secciones, si no es un objeto plano, va a `failedSections` y no se escribe (queda
  la del aparato). Tres casos (`null`, `42`, `[1,2]`) y un control, con el `importBackup` real.
- `hydrateFromStorage`: `parseMap` acepta solo un objeto plano; lo demás se lee como `{}`. Tres casos con el provider
  real: solo `null` tumbaba (`getCompletedDays` → `TypeError`), como dice la entrada; `42` y `[1,2]` quedan de
  control.
- **Revert por pieza:** cada una de las dos guardas del import tumba los tres casos; la de la hidratación, el de `null`.
- **Una trampa del archivo de pruebas:** los casos nuevos pasaban solos y caían en la suite entera: un describe
  anterior deja `AsyncStorage.multiSet` alterado (el `spyOn` + `mockRestore` de «Bug 1»). Van delante de él. No lo
  arreglé (es de pruebas y no de esta tanda); anotado aquí.
- **Lectores directos de las claves (`grep`):** ninguno fuera del provider y del respaldo. El export manda lo que lee
  tal cual: un disco viejo con `42` sale como `42`, y ese archivo ahora falla esa sección al importarse.
- `R9-410` (el tema) sigue esperando, como pide la sesión.

## 6. `R9-569` y `R9-559`: quedan con `R9-558`

- **`R9-569`:** la consecuencia ya está refutada (141: sin daño). Lo que queda es su arreglo («releer el registro al
  terminar `initializeApp`, y tras el reset»), que solo sirve para que la red pueda escribir la clave de versión, y
  eso es parte de lo que decide `R9-558`. Depende.
- **`R9-559`:** el arreglo mínimo (un estado vacío en el lector nativo, como el web) no es independiente: desde
  `R9-424` el lector pasa ~0,8 s por «0 versículos» en cada frío directo con el pack elegido ausente (medido en la
  141), y un aviso de error pintado en ese rato sería peor que la página en blanco. Qué ofrece ese estado (reintentar,
  volver a bajar la versión, cambiarla) depende de qué promete el reset. Depende.

## 7. En vivo

No hizo falta: los cuatro arreglos se miden en jest con los providers y el `importBackup` reales, y una lectura de
AsyncStorage que rechaza no se puede forzar en el emulador sin instrumentar la app. `R9-560` sí lo pide (un toast se
mide con una ráfaga de capturas): va con la 183.

## 8. Validate

`NODE_ENV=development npm run validate` en `fix/s182` (`fdc69e7c`), sin Metro ni emulador: verde, 441 suites y 5231
pruebas (la 181: 440 y 5205; +1 suite, +26 pruebas).

## 9. Cierre

- 270 abiertos de 636 (0 P0, 1 P1, 80 P2, 188 P3 y un aviso). Arreglados: `R9-413`, `R9-414`, `R9-421`, `R9-411` y
  `R9-636` (nuevo).
- **La 183: el resto de la tanda 2** (`R9-560` con emulador, `R9-31`, `R9-32` y `R9-53`), y después la revisión del
  diff de la 182 y la 183 juntas, con emulador. Alternativa (para Victor): revisar primero este diff, porque `R9-31`,
  `R9-32` y `R9-53` tocan `BackupService.ts`, el mismo archivo que `R9-411`.
