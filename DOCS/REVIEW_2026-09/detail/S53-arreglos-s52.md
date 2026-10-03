# Sesión 53 — arreglos de lo de la 52, y `R9-59` y `R9-38` (2026-10-03)

En un chat nuevo, solo en la terminal y sin agentes, con `_scratch/S53-PROMPT.md`. Arregla
`R9-260`..`R9-266` (registrados en la 52) e implementa `R9-59` (la Mesa por cuenta) y `R9-38` (lo
editado sin sesión) con la regla de la §7 de `CONTINUAR.md`.

- **Ramas, apiladas y sin mergear hasta el OK de Victor:**
  - `fix/s53-arreglos-s52`: `6b768eb` (`R9-260`), `c633eb8` (`R9-262`), `c685b63` (`R9-263`),
    `420c49c` (`R9-264`), `849141b` (`R9-265`), `f3bb0e5` (`R9-266`) y `3f73e50` (`R9-261`);
  - `fix/s53-r59-r38`, encima: `ea182dc` (`R9-38`) y `a85df96` (`R9-59`);
  - `docs/review-s53-fix`, encima: este checkpoint.
- **Estado al empezar:** `main` = `origin/main` = `cc005d2` (el checkpoint de la 52, mergeado y
  pusheado; CI verde en el log, run `37153675553`, 369/4558). Los docs decían «sin mergear» para la
  52: se corrigió aquí. La base `S51-SyncEngine-final.ts.txt` = el motor de `6d834c5` (`cmp`).
- **Resultado:** 6 cerrados y 1 aceptado de la 52, más `R9-38` (el último P0) y `R9-59`. 2 nuevos
  (`R9-267`, `R9-268`), por lectura. **No queda ningún P0 abierto**; 268 hallazgos.

## 0. Cómo se midió

- Cada prueba nueva, vista caer sin su arreglo por la razón correcta: el motor de antes copiado
  encima (`_scratch/S53-SyncEngine-<pieza>.ts.txt` guarda el de cada commit), o un revert por pieza
  con un script (`S53-rev193.cjs.txt`, `S53-rev38.cjs.txt`, `S53-rev59.cjs.txt`). Tras cada uno,
  `cmp` contra la base, NUL 0 y `git status` limpio.
- Las cuatro sondas de la 52, re-corridas sobre el árbol de `3f73e50`
  (`_scratch/S53-sondas52-hoy.out.txt`): `DOBLE·doble` da 1 lectura y nube «nuevo»;
  `LAPIDA·rechazaTras`, local R y nube R; `FLAG·fallaFlag`, ninguna segunda subida; `MUERE`, igual
  que en la 52 (`R9-261` se acepta).
- `npm run validate` entero con `NODE_ENV=development` sobre `a85df96` más este checkpoint: 371
  suites y 4582 pruebas (en la 52, 369/4558), lint con 0 errores (los 70 avisos de siempre)
  (`_scratch/S53-validate.out.txt`).
- La matriz de la 44 sobre `3f73e50`, en un worktree aparte (`S44-matriz-s53-3f73e50.out.txt`),
  comparada con la de la 51 (`S53-comparar.cjs.txt`): 154 de 157 piezas iguales. Dos cambios son
  pruebas nuevas que también caen (`T-tomb` cae además en la de `R9-262`; `T-bulk`, en la de
  `R9-263`). El tercero, en la §1 (`R9-262`). Y otra corrida sobre `a85df96`, en la §2.

## 1. Los arreglos de lo de la 52

### `R9-260`: una sola lectura de hidratación (`6b768eb`)

- `hydrateQueue` comparte la lectura en vuelo (`queueHydrating`), como `rereadQueue`; es
  `H260once`. Un `start()` → `stop()` → `start()` del mismo uid con la primera lectura en vuelo ya
  no pide otra.
- **Prueba** («R9-260: un stop() y un start() del mismo uid…»): sin el arreglo, `lecturas: 2`,
  subidas `["nuevo","viejo"]` y nube «viejo»; con él, 1, `["nuevo"]` y «nuevo».
- **La puerta de `colaIlegible`** devuelve ahora el disco de cuando se pidió (la `colaFoto` de la
  52). Con el motor de `af8a5ae`, la prueba de `R9-254` cae en sus dos casos: `lenta`, que antes
  «pasaba», da nube «viejo», el `R9-115` original.

### `R9-262`: la guarda de `R9-256` retiene (`c633eb8`)

- Devuelve `false` (como un doc no aplicado) en vez de `true` (asentar); es `H261hold`.
- **Prueba** («R9-262: la lapida de R9-256 rechazada…»), dos casos:
  - `rechazaTras` (un rechazo en la sesión y el último en la siguiente): local R, nube R, aviso de
    escritura descartada (CONTROL). Sin el arreglo, local nulo y R fuera de la query del enganche.
  - `sana`: la lápida sube y la nube queda borrada.
- **El piso mientras la lápida espera:** R queda en `unsettled` con su reloj desde el enganche, y el
  piso del enganche siguiente queda por debajo de R (la prueba lo mira con `floorOf`). Cuando la
  lápida sube, su eco asienta el doc: en `sana`, nada retenido, y R fuera de la query. Es el coste de
  cualquier doc no aplicado, mientras dure la espera.
- **Con la guarda de `R9-176` (corolario 50).** En la matriz, `S176cola` pasó de 10 caídas a 9: la
  prueba de `R9-197` ya no cae sin la guarda de `R9-176`. Medido juntas (`S34-rev` en el worktree):

  | Pieza                | 51  | 53  | Qué                                       |
  | -------------------- | --- | --- | ----------------------------------------- |
  | `S176cola`           | 10  | 9   | sin la de `R9-176`                        |
  | `S176cola` + `R256`  | 12  | 13  | vuelve la de `R9-197`, más la de `R9-262` |
  | `R197local`          | 0   | 0   | la de `R9-197`, sola                      |
  | `R197local` + `R256` | 2   | 3   | más la de `R9-262`                        |

  La guarda de `R9-256`, ahora reteniendo, da en esa prueba el mismo final que la rama de `R9-176`
  (la marca se queda). No se perdió ninguna guarda: juntas, cae.

### `R9-263`: el flag ilegible (`c685b63`)

- Con la lectura del flag fallida, no se hace nada esta vez, como con la lista de `R9-257`. El flag
  es un valor chico: ninguna lectura falla siempre por su tamaño (`R9-212`), y el `start()`
  siguiente lo lee. Se fue el comentario de los «duplicados inocuos».
- **Prueba** («R9-263: con la lectura del flag fallida…»): sin el arreglo, `segunda: ["test/a"]`.
- **Lo «por lectura» de la entrada queda como estaba, a propósito.** Con dos escrituras (flag y
  lista), cualquier orden deja abierto uno de los dos fallos. Juntarlas en un `multiSet` hace que
  una escritura fallida repita el push entero en el arranque siguiente (`R9-126`). Se prefirió «la
  colección espera a su próxima edición».

### `R9-264`: el `pullAllLocal` de `memoryCards` (`420c49c`)

- Espera a la carga del mazo (`deckLoad`, la promesa de la última carga, que deja puesto
  `deckRef`), y lanza si la lectura del disco falló: el motor anota la colección para el reintento,
  y el export la marca como no leída. Un JSON que no se lee cuenta como leído y vacío, como en
  `parseQueue`: el mazo que se escribe después lo reemplaza.
- **Prueba** (`__tests__/memoryDeckPullAllLocal.test.tsx`, provider real, la lectura de
  `@memory_deck` retenida con su foto): durante la carga devolvía `[]`, y con la carga fallida
  resolvía `[]`. La pieza `deckRef.current = clean` sola también cae: sin ella, la continuación de
  `pullAllLocal` corre antes del render y lee el ref vacío.
- **Al lado, ya existía:** una lectura fallida deja el mazo en `{}` y el efecto que persiste lo
  escribe encima (`R9-267`, por lectura). Con la carga fallida, el provider marca `hydrated` igual.

### `R9-265`: el diálogo de migración (`849141b`)

- `exportLocalData` lista como `unread` (cuenta 0) la colección que no pudo leer. Las dos preguntas
  (la del dueño anterior y la de la colisión) se hacen igual, con un texto sin número
  (`migrationBodyUnread`, en los dos idiomas).
- **Pruebas:** en el motor («R9-265: una coleccion cuyo pullAllLocal falla sale como no leida»), y
  en `AuthContext.test.tsx` las dos ramas. Cada pieza cae sola; la de la colisión se agregó porque
  ninguna prueba la vigilaba.
- **Fuera, a propósito:** si `exportLocalData` entero lanza (el motor real no lo hace), la
  comprobación sigue sin preguntar. Es la familia de `R9-158`, una decisión abierta de Victor.

### `R9-266`: los comentarios (`f3bb0e5`)

- La guarda de `R9-256` compara por reloj, como LWW: «no más nueva» incluye al otro con el reloj
  atrasado, que es su propia prueba.
- `readQueueAgain` y `joinQueue` dicen que hay una sola unión por proceso (`R9-260`).
- `hydrateQueue` ya no mira `ownDirty` en `wrote`, y dice por qué: los sellos son solo de docs en
  conflicto, que se conocen al enganchar, después de la primera lectura.

### `R9-261`: aceptado (`3f73e50`)

Con el argumento de `R9-255`: la ventana es la primera lectura de la cola del proceso (una de
AsyncStorage, detrás de las del arranque), y hace falta una edición y que el proceso muera dentro.
Cerrarla pide otra clave para lo escrito antes, con sus propios casos. Escrito en `persistQueue`,
donde ocurre, y nombrado en `queueUnread`.

## 2. `R9-38` y `R9-59`, con la regla de Victor

### `R9-38`: lo editado sin sesión (`ea182dc`)

**La regla (§7):** la misma cuenta sube lo editado sin sesión; otra cuenta pregunta antes; sin
repetir el bulk push entero. **El cómo, decidido midiendo:**

- **Sin sesión, la entrada se encola a nombre del dueño del almacén** (`@local_store_owner_uid`,
  que `AuthContext` reclama en cada inicio de sesión). Espera como las entradas de otra cuenta
  (`R9-22`), y sube cuando esa cuenta arranca: es una edición hecha sin red, con las mismas
  guardas. No hay pasada de reconciliación ni bulk push.
- **Otra cuenta no la recibe nunca.** Los datos locales le llegan solo por la migración, después de
  la pregunta (`R9-23`, `R9-166`), y lo del dueño sigue en cola a su nombre para cuando vuelva.
- **Sin dueño** (nunca se inició sesión en el teléfono), no se encola: el primer inicio de sesión
  sube todo con el bulk push.
- **El dueño** se lee una vez por proceso, o lo dice el `start()`. Mientras se lee, las escrituras
  siguientes esperan detrás, las de la sesión también. La primera versión no lo hacía (una
  comprobación de «más nueva en la cola»), y la medición mostró el hueco: la edición nueva subía y
  salía de la cola antes de que entrara la vieja, y la vieja subía encima (nube «viejo»).
- **La cuenta borrada.** `deleteAccount` escribe `(deleted)` en el marcador y el motor olvida al
  dueño. Si no, lo editado después se encolaba para una cuenta que no vuelve, para siempre. No se
  usó `''`: el mock de AsyncStorage lo devuelve como `null`, y para `AuthContext` un dueño nulo
  significa «primer inicio de sesión, no preguntar».
- **¿Llegan los llamadores?** Sí: `SyncEngineContext` crea el motor una vez y lo para sin sesión, y
  `getSyncEngine()` lo devuelve. Los comentarios de `instance.ts` y `BackupService.ts` decían
  «no-op» y se corrigieron. Un respaldo restaurado sin sesión queda en cola para el dueño, como
  cualquier edición.
- **Pruebas:** dos en `SyncEngine.test.ts`.
  - La primera: misma cuenta en el mismo proceso, tras reiniciar, otra cuenta (y el dueño que
    vuelve) y sin dueño.
  - La segunda: un `start()` que cambia de dueño, el dueño leído despacio y la cuenta borrada.
  - Y una en `AuthContext.test.tsx` (`deleteAccount`).
  - Las seis piezas (`S53-rev38.cjs.txt`), una por una, caen: el dueño del `start()`, la cadena,
    `forgetStoreOwner`, la hidratación sin sesión, el marcador y todo.
- **Dos pruebas de `R9-193` codificaban el bug:** «sin sesión, la edición queda solo en local
  (`queueWrite` no hace nada)». Con el arreglo, L2 se encolaba y una de ellas caía. Ahora dejan L2
  fuera de la cola, para que siga decidiendo el sello de L1. Sus piezas de `stop()`
  (`S53-rev193.cjs.txt`) las siguen tumbando: A, la segunda, y B, las dos.

### `R9-59`: la Mesa por cuenta (`a85df96`)

**La regla (§7):** la Mesa se guarda por cuenta, cada uno ve solo lo suyo, y cerrar sesión no borra
nada. **El cómo**, escrito en `src/features/study/prepAccount.ts`:

- **Las claves** llevan el uid de la cuenta de Google abierta (`@prep_notes:<uid>`, y lo mismo las
  otras tres). Sin cuenta (anónimo o sin usuario), la clave de siempre: la Mesa «sin cuenta». Un uid
  anónimo no es una cuenta, porque cambia en cada cierre de sesión.
- **La Mesa de antes** va una vez al dueño del almacén o, sin dueño registrado, a la cuenta abierta.
  Sin ninguno, queda como la «sin cuenta». Corre en el primer estado de auth del proceso, antes de
  que un inicio de sesión pueda reclamar el almacén para otro.
- **Al iniciar sesión** sin rechazar la migración, la «sin cuenta» se une a la de la cuenta (en la
  misma entrada gana la de la cuenta). Lo escrito antes de entrar sigue a la persona, como los datos
  sincronizados. Si rechaza la migración, se queda donde estaba.
- **Al borrar la cuenta**, su Mesa vuelve a la «sin cuenta»: nunca estuvo en la nube.
- **El respaldo** exporta y restaura la Mesa de la cuenta abierta.
- Las claves esperan al primer estado de auth (`AuthProvider` lo dice al montar, `managePrepAccount`).
  Una escritura va a la cuenta de cuando se pidió.
- **Pruebas:** `__tests__/prepAccount.test.ts` (8, stores reales), 4 en `AuthContext.test.tsx` y 1
  en `backupDegradedSections.test.ts`. Las piezas (`S53-rev59.cjs.txt`) caen todas, una por una:
  las claves de los stores, la Mesa de antes, la captura de la cuenta, la espera al primer estado,
  decir la cuenta, adoptar (en el enlace y en la colisión), el rechazo, devolverla y el respaldo.

### La matriz sobre `a85df96`

`S44-matriz-s53-a85df96.out.txt`, comparada con la de `3f73e50`: las 157 piezas dan lo mismo
(control: 0 de 284). `R9-38` y `R9-59` no taparon ninguna guarda del motor.

## 3. Los nuevos

- **`R9-267` (P2, por lectura):** una lectura fallida de `@memory_deck` deja el mazo en `{}`, y el
  efecto que persiste lo escribe encima. Es la forma de `R9-212`, en el mazo.
- **`R9-268` (P3, por lectura):** una cuenta que ya hizo su bulk push en el teléfono responde
  «Migrar» y no se migra nada. Es el borde de `R9-38`, y una decisión de producto.

## 4. Las lecciones

- **Una escritura que espera una lectura previa (el dueño) se ordena con las que vienen detrás.**
  Si no, una edición nueva sube y sale de la cola antes de que entre la vieja, y ninguna
  comprobación sobre la cola la ve después.
- **Un marcador que significa algo no usa un valor vacío.** `''` puede volver como `null` según el
  almacenamiento, y aquí `null` significaba lo contrario («no preguntar»).
- **Antes de arreglar un camino del motor, comprobá que los llamadores llegan a él.** Con la sesión
  cerrada el motor existe, parado; si `getSyncEngine()` hubiera devuelto `null`, el arreglo de
  `R9-38` no habría servido en la app aunque sus pruebas pasaran.
- **Una guarda que pasa de asentar a retener puede cubrir a otra en su prueba** (corolario 50,
  otra vez): `S176cola` perdió un testigo, y juntas siguen cayendo.
