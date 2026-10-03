# Sesión 52 — revisión del diff de la 51 (2026-10-03)

En un chat nuevo, solo en la terminal, sin agentes y sin tocar código, con
`_scratch/S52-PROMPT.md`. El diff: `af8a5ae..6d834c5` (`R9-256`, `R9-254`/`R9-115`, `R9-257` en el
motor y en los adaptadores de subrayados y notas, los comentarios de `R9-255` y `R9-258`, y sus
pruebas).

- **Rama:** `docs/review-s52-diff-s51` (este checkpoint), sin mergear hasta el OK de Victor.
- **Estado al empezar:** `main` = `origin/main` = `8e5cfaf` (el checkpoint de la 51 y, encima, la
  decisión de `R9-59`, solo docs). La 51 ya estaba mergeada y pusheada (`3e4b758`, CI verde en el
  log, run `37148855758`); los docs decían «sin mergear», y se corrigió aquí. La base
  `S51-SyncEngine-final.ts.txt` = el motor de `6d834c5` (`cmp`).
- **Resultado:** 7 hallazgos nuevos, `R9-260`..`R9-266`, todos P3. Tres los abrió la 51
  (`R9-260`, `R9-261`, `R9-262`). `R9-259` respondido, sin número nuevo.

## 0. Cómo se midió

- **Las sondas** (en `_scratch`, con `S38-sonda.cjs.txt` sobre el árbol de hoy, y con
  `S50-viejo.cjs.txt af8a5ae` para cada «¿lo abrió la 51?»):
  - `S52-sonda-lapida.body.txt` (`LAPIDA`): la lápida de `R9-256` sana, rechazada una vez,
    rechazada por última vez, rechazada primero y por última vez en el proceso siguiente, y con un
    conflicto retenido;
  - `S52-sonda-doble.body.txt` (`DOBLE`): una, dos hidrataciones a la vez, y un `stop()` durante
    la primera; instrumenta `withLocalWriteSuppressed` para ver si algo de la nube se aplica antes
    de hidratar;
  - `S52-sonda-muere.body.txt` (`MUERE`): una edición durante la primera lectura, y el proceso
    muere antes de que vuelva;
  - `S52-sonda-flag.body.txt` (`FLAG`): la lectura del flag del bulk push falla con el push ya
    hecho.
- **Las piezas**, en `S52-piezas.cjs.txt` (reexporta las de la 51): dos hipótesis de arreglo,
  `H260once` y `H261hold`, medidas con su sonda y con la suite de `SyncEngine.test.ts`
  (`S34-rev.cjs.txt`).
- **Una lectura que ve el disco de cuando se pidió.** En Android, AsyncStorage corre en un
  `SerialExecutor` (`AsyncStorageModule.java`), así que una escritura pedida durante una lectura
  lenta va detrás de ella. La puerta de `colaIlegible` lee el disco al ABRIRSE: con el motor de
  `af8a5ae`, `DOBLE·una` daba «nuevo» porque la lectura veía el `multiSet` de la edición, un orden
  que el almacenamiento real no produce. Las sondas `DOBLE` y `MUERE` usan una `colaFoto` que lee
  al pedir. Con el motor de hoy da lo mismo, porque no escribe la cola antes de hidratar.
- Tras cada corrida: `cmp` igual con la base, NUL 0 y `git status` limpio.

## 1. Las preguntas de la sesión

### `R9-256`: la lápida que después se rechaza o se descarta

| Caso          | Qué pasa                                           | Hoy: local / nube | `af8a5ae`: local / nube |
| ------------- | -------------------------------------------------- | ----------------- | ----------------------- |
| `sana`        | la lápida sube                                     | nulo / borrada    | nulo / borrada (\*)     |
| `rechaza`     | un rechazo (no el último)                          | nulo / R          | R / R                   |
| `descarta`    | el último rechazo, en la sesión                    | R / R             | R / R                   |
| `rechazaTras` | el primero en la sesión, el último en la siguiente | **nulo / R**      | R / R                   |

(\*) Con `af8a5ae`, en la sesión, local R y nube borrada (el daño de `R9-256`); se curaba tras
reiniciar, porque la lápida llegaba al enganchar. La entrada de `R9-256` lo daba por no medido.

- **La copia de la nube vuelve a llegar** en cada rechazo, como reversión. Con la lápida en cola,
  la guarda la deja fuera, y es lo correcto: la lápida vuelve a intentar. En el último rechazo de
  la sesión, la reversión es un `modified` y R entra. Tras un reinicio, la guarda ya había
  asentado R y adelantado el cursor, la reversión es un `removed`, y la lectura con
  `justDropped` asienta sin aplicar. Eso es `R9-262`, y contradice el coste escrito en `R9-256`.
- **Con un conflicto pendiente** (en memoria), decide antes la rama de `R9-160`, y la guarda no se
  ve. **Con uno retenido** (tras reiniciar, sin copia local), decide la guarda: la rama retenida
  pide una copia local. Medido (`retenido`): sin conflicto, local nulo, nube «lo mio (borrada)»,
  marcas vacías; con `af8a5ae`, local «lo suyo» y nube borrada. El borrado gana, que es lo que el
  usuario hizo después. Que el conflicto siga en memoria tras borrar ya es `R9-211`.
- **Hipótesis `H261hold`** (la guarda retiene en vez de asentar): `rechazaTras` da R / R, lo demás
  igual, suite 278/278.

### `R9-254`: dos hidrataciones, y un `stop()` durante la primera

- **Dos a la vez:** `R9-260`. La segunda unión vuelve a meter la entrada vieja, porque la primera
  vació `queueTouched`. Con una lectura (`una`), «nuevo»; con dos (`doble`), sube «viejo» encima.
  Con `af8a5ae`, al revés. En `own`, la segunda unión suma a cada entrada su propio reloj
  (redundante; por lectura). `H260once` (una sola lectura) lo cierra, suite 278/278.
- **Un `stop()` durante la hidratación, con un sello por escribir:** no hay sello que escribir.
  Los sellos son solo de docs en conflicto (`noteOwnAcked`), que se conocen al enganchar, después
  de hidratar. `soloStop`: tras el `stop()` la tabla de sellos sigue vacía, la hidratación vuelve
  con el uid nulo, une, escribe la cola sin la entrada vieja, y el proceso siguiente sube solo
  «nuevo». Lo mismo deja a `ownDirty` muerto en `wrote` (`R9-266`).
- **¿Marca de más una copia de la nube antes de hidratar?** No: los listeners se enganchan después
  de `await this.hydrateQueue()`, y toda vuelta de la hidratación pone `queueHydrated`. La sonda
  instrumenta `withLocalWriteSuppressed`: `antesDeHidratar: []` en los tres casos, también con dos
  `start()`. La app crea un solo motor.
- **Y algo que la pregunta no nombraba:** `R9-261`. Lo escrito antes de la primera lectura espera
  en memoria, y si el proceso muere ahí, la vieja sube encima (con red) o la nueva no sube nunca
  (sin red). Con `af8a5ae`, «q nueva». Es la ventana de `R9-255` sin sus dos lecturas fallidas.

### `R9-257`: la lista de reintento

- **Con `'skip'`:** el `skip` se graba y sale antes de leer la lista, y un flag `'skip'` también
  sale antes. Una lista vieja de esa cuenta queda huérfana en disco, sin efecto. Es coherente: el
  usuario dijo que no a migrar lo local. Sin hallazgo.
- **Una colección de la lista que no vuelve a registrarse:** queda en la lista para siempre, y cada
  `start()` reescribe el flag y la lista (dos escrituras). Sin hallazgo.
- **`exportLocalData`:** ya saltaba un subrayado que fallaba (antes devolvía `[]`). Lo nuevo es el
  final: lo que fallaba en el export y en el bulk push no subía nunca, y ahora sube en el `start()`
  siguiente sin la pregunta. Es `R9-265`, la mitad de `R9-257` que el cierre no nombra.
- **Y dos vecinos:** la lectura fallida del flag repite el push entero, con el comentario de
  «duplicados inocuos» (`R9-263`, medido), y `memoryCards` lee el ref (`R9-264`, por lectura).

### `R9-259`: ¿otro caso en que las dos guardas difieran?

Sí, y llega solo por otro hallazgo abierto: una EDICIÓN en cola con `getLocal` nulo (el de
`MemoryDeckContext` durante la carga, `R9-133`). La de `R9-197` la retiene, y la de `R9-256` no
(solo mira lápidas). Las otras diferencias no cambian el final (ver la entrada). Sin número nuevo.

### La matriz de la 51 contra la de la 44

Se sostiene lo que dice el detalle de la 51, re-medido sobre la base de hoy (corolario 50):

| Pieza                | Caen | Qué                                        |
| -------------------- | ---- | ------------------------------------------ |
| `R197local`          | 0    | la guarda de `R9-197`, sola                |
| `R197local` + `R256` | 2    | la prueba de `R9-197` y la de `R9-256`     |
| `S176cola`           | 10   | sin la de `R9-176` en que el otro restaura |
| `S176cola` + `R256`  | 12   | vuelve esa, más la de `R9-256`             |

Las tres ausentes de la 51 (`T-heal`, `S32-multi`, `S34-208diferir`) se rehicieron allí y dan lo
mismo que en la 44. No bajó nada más.

### Los comentarios nuevos (corolario 47)

- `queueUnread` (`R9-255` aceptado): «después de dos que fallaron» no cubre `R9-261`.
- `queueTouched`: lo que enumera se sostiene; «o una copia aplicada» no puede pasar antes de la
  primera lectura (ver arriba), y está dicho para la cola sin leer.
- `readQueueAgain` y `joinQueue`: falsos con dos hidrataciones (`R9-260`).
- La guarda de `R9-256`: «el otro la escribió antes» es el porqué por reloj; su propia prueba es el
  otro con el reloj atrasado (`R9-266`).
- `BULK_PUSH_RETRY_PREFIX`: correcto, pero la misma función dice lo contrario en el `catch` del
  flag (`R9-263`).
- Los adaptadores: «los dos que la llaman la registran» es cierto (`maybeRunInitialBulkPush` y
  `exportLocalData`; no hay otro).
- `hydrateQueue`: `wrote` con `ownDirty`, siempre vacío ahí (`R9-266`).

## 2. Lo que queda para la 53

Arreglar `R9-260` (con `H260once`), `R9-262` (con `H261hold`), `R9-263`, `R9-264`, `R9-265` y
`R9-266`; decidir `R9-261` (como `R9-255`). Cada prueba nueva, vista caer sin su arreglo, y la
puerta de `colaIlegible`, que lea al pedir. Además, `R9-59` (la Mesa por cuenta) y `R9-38`, con la
regla de la §7 de `CONTINUAR.md`.

## 3. Las lecciones

- **Una puerta del mock que lee al abrirse produce un orden que el almacenamiento real no
  produce.** AsyncStorage en Android es un ejecutor serie: la lectura ve el disco de cuando se
  pidió. Con la puerta perezosa, el motor viejo «pasaba» el caso de `R9-115`. Antes de un «¿lo
  abrió?» con el motor viejo, preguntá si la sonda deja escribir durante la lectura.
- **Un arreglo que cierra un caso por una marca que se vacía al usarla pregunta qué pasa si se usa
  dos veces.** `joinQueue` vacía `queueTouched`, y la hidratación podía correr dos veces.
- **Una guarda que dice «atendido» adelanta el cursor.** Lo que se deja fuera ya no vuelve a
  llegar, y el final cambia según haya o no un reinicio entre medias (`R9-262`). Una guarda que
  espera a otra escritura retiene, no asienta.
- **Una aceptación vale para la ventana que midió.** `R9-255` se aceptó «tras dos lecturas
  fallidas», y la 51 abrió la misma ventana sin ninguna (`R9-261`).
