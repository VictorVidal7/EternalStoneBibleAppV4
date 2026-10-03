# Sesión 49 — arreglos de `R9-212` y `R9-214` (2026-10-03)

En un chat nuevo, solo en la terminal y sin agentes, con `_scratch/S49-PROMPT.md`. Lo eligió Claude
al cerrar la 48 («por donde mejor convenga»): `R9-212` era el único P2 de lo pendiente que se hace
en la terminal.

> **⚠️ Sesión 50 (`R9-258`):** dos afirmaciones de este detalle no se sostienen. La pieza `R212` no
> es «el arreglo entero»: deja la asignación nueva de `hydrateQueue` (`R9-254`), y un «sin
> `R9-212`» se mide con el motor de `8f59942`. Y la entrada que la unión descarta no siempre es «la
> que LWW ya perdió»: sin copia local no hay LWW (`R9-256`).

- **Ramas:** `fix/s49-arreglos` (3 commits: `024bef8` `R9-212`, `d3e45a7` `R9-214`, `f287fc6` un
  comentario de prueba) y, encima, `docs/review-s49-fix` (este checkpoint). Sin mergear hasta el
  OK de Victor.
- **Estado al empezar:** `main` = `origin/main` = `8f59942`, la 48 mergeada y pusheada (los docs
  decían «sin mergear»: lo corrige este checkpoint). La base `S48-SyncEngine-final.ts.txt` = el
  motor de `05e089e` (`cmp`).

## 0. El diff de la 48

`git diff afbf460 05e089e` es una frase del comentario de `R9-252`. Dice lo que midió `S47-1`: un
respaldo bajo el piso asienta el conflicto en la sesión (`bajo`: la marca, `[]`), y uno sobre el
piso es como una edición (`sobre` y `edita`: `["doc-c"]`). Nada que registrar.

## 1. `R9-212`: la cola ilegible al hidratar

### Medido hoy, antes de tocar nada

La sonda vieja (`S34-A1-sonda-cola.body.txt`) sobre el árbol de hoy: igual que en la 34 (`doc-q`
se pierde). La sonda nueva (`_scratch/S49-sonda-hoy.body.txt`, `S49-sonda-hoy.out.txt`) mide las
tres formas:

- **`getItem` que falla:** `doc-q` desaparece con la primera escritura (`["doc-z"]`).
- **Un texto que no es JSON:** lo mismo.
- **La entrada aparcada de otra cuenta** (Ana), con Beto escribiendo: se pierde también.
- **La UI:** `pendingWrites` 0 con una entrada propia en disco.

### Las decisiones, con el porqué

- **`getItem` que falla se relee; un texto que no es JSON se lee como vacío**, como la tabla de
  sellos (`parseOwnTable`, `R9-208`). Releerlo da lo mismo. Guardarlo en otra clave no se hizo,
  por tres razones: no tendría lector, la app no puede rescatar entradas de un JSON roto, y pesaría
  otra vez lo mismo en AsyncStorage (6 MB por defecto en Android, leído en
  `node_modules/@react-native-async-storage/async-storage/android/config.gradle`; la app no lo
  cambia). Las ediciones siguen aplicadas en el teléfono: lo que se pierde es su subida.
- **Mientras no se lee, ninguna escritura toma la cola.** Se relee en `start()`, antes de enganchar
  (y en cada `start()` mientras siga sin leer), y en la escritura que la necesita. Las de disco se
  unen a las de memoria. La cola es de todas las cuentas, así que la relectura es del proceso, no
  de la sesión: una que vuelve tras un `stop()` y otra cuenta también une (la diferencia con
  `R9-215`).
- **La unión no devuelve una entrada vieja** de un doc cuya copia local cambió en este proceso: una
  edición encolada (esté o no en la cola todavía) o una copia aplicada desde la nube
  (`queueTouched`, anotada en `withLocalWriteSuppressed`). `set` no tiene guarda, y la subía
  encima. Si la edición nueva sigue en memoria, toma los relojes de la de disco, como
  `upsertQueueEntry` hace al reemplazar.
- **Esperar, pero no para siempre.** Si la relectura que una escritura espera también falla (la
  tercera, tras la hidratación y la de `start()`), la cola se escribe desde memoria, como antes, y
  las entradas de disco se pierden. Una lectura puede fallar siempre: Android lee el valor con un
  `Cursor` (el `multiGet` de `AsyncStorageModule.java`), cuya `CursorWindow` es de 2 MB, y una
  cola que un bulk push llenó sin red puede pasarse. Esto sale de leer el código y del límite
  conocido de Android, no está medido en el teléfono. La primera versión esperaba siempre: con una
  lectura que falla siempre, ninguna edición posterior llegaba a disco nunca más. Era una pérdida
  permanente en lugar de una sola.
- **`stop()` con la cola sin leer** escribe la tabla de sellos sin la cola: en una tabla y en una
  entrada, el sello sigue en disco (la invariante de `R9-193`).
- **Mientras no se lee, la UI no cuenta las entradas de disco, y `flush` no las sube.** Al unirlas,
  `pendingWrites` se recalcula. No se agregó un `flush` tras la unión (`R212flush`, en la primera
  versión): la matriz de la sonda dio 0. Sin él, suben en el `flush` siguiente (el periódico es
  de 60 s); ya están en disco, así que solo es latencia (regla 37).

### Lo que la tabla de sellos ya había enseñado, medido aquí

- **La relectura en vuelo tras un `stop()`, con otra cuenta en medio** (la de `R9-215`): la prueba
  `enMedio`. Las dos entradas de Ana quedan.
- **El `persistQueue(true)` del `stop()`:** la prueba de la sesión que termina con un sello por
  escribir.
- **El tope de reintentos** (`ownGaveUp`): 3 lecturas en total; ninguna más después
  (`lecturas: 3` en la prueba `sigue`, con más escrituras detrás).
- **Dos relecturas a la vez:** una sola promesa (`queueRereading`). En la sonda, dos escrituras en
  el mismo turno leen una vez.
- **Las dos guardas juntas** (la tabla de sellos y la cola ilegibles en el mismo arranque,
  corolario 50): las mismas escrituras, una por una, y el mismo final que con la tabla sola.

### Lo que encontró el control: un disparador nuevo de `R9-126`

Para medir la unión con una copia del otro, la sonda `S49-sonda-lww.body.txt` corrió el mismo caso
con la cola **legible**. Una edición D espera en la cola sin red, y el otro escribe R 60 s después.
Al volver, LWW aplica R (fuera de la ventana de 30 s no hay conflicto) y la entrada de D sube
encima: **local R, nube D.** Es la raíz de `R9-126` (`set` sin guarda: la nube no hace LWW), con un
disparador común. Se anotó en `R9-126`, sin número nuevo. La unión de `R9-212` evita ese caso
cuando la cola no se leía; con la cola legible sigue abierto.

### Pruebas y piezas

9 pruebas en `__tests__/SyncEngine.test.ts`, junto a las de `R9-208`. Piezas en
`_scratch/S49-piezas.cjs.txt`, sobre `S49-SyncEngine-R212.ts.txt` (el motor de `024bef8`).
`S34-rev`, con la suite de sync entera (273 pruebas antes de la del `stop()`), y
`S49-msg.cjs.txt`, con el diff de cada caída:

| Pieza        | Qué revierte                             | Caen | Por qué cae la suya                                            |
| ------------ | ---------------------------------------- | ---- | -------------------------------------------------------------- |
| `R212`       | el arreglo entero                        | 8    | se pierden las entradas (Ana, `doc-q`, `doc-x`); la nube, null |
| `R212start`  | la relectura de `start()`                | 8    | `unaVez`: la nube null y 0 pendientes; otras, se rinde antes   |
| `R212remote` | la marca de la copia aplicada            | 1    | la nube vuelve a «q vieja»                                     |
| `R212queue`  | la marca de la edición encolada          | 1    | la nube vuelve a «q vieja»                                     |
| `R212own`    | los relojes de la entrada de disco       | 1    | `own` vacío: el mecanismo, y la prueba lo dice                 |
| `R212wait`   | la escritura espera la relectura         | 6    | `doc-z` no llega a disco; `sube` deja la vieja                 |
| `R212omit`   | `stop()` escribe la cola sin leerla      | 1    | `doc-x` se pierde                                              |
| `R212give`   | rendirse si la relectura vuelve a fallar | 1    | «d mio 3 \| d mio 2» tras reiniciar, y d3 perdida              |

Con `R212` y con `R212start` caen solo por el control de las lecturas las mismas 3: `remoto` (sin
`R9-212` la entrada se perdía igual), `sigue` (el mismo final que hoy) y la de las dos guardas.
Los comentarios de las dos primeras lo dicen. Sin la relectura de `start()`, la que falla en la
escritura es la segunda, y se rinde ahí: por eso `R212start` tumba también las de Ana, `enMedio`,
el `stop()` y los relojes, por la consecuencia.

**El coste** (dicho en el comentario de `queueUnread` y en la prueba `sigue`): con la lectura que
falla también para la escritura, las entradas de disco se pierden, como antes. Y mientras la cola
no se lee, una entrada de disco cuyo doc recibió una copia nueva de la nube se descarta al unir (es
la que LWW ya perdió en el teléfono).

**Sin medir:** el caso en que importan los relojes que la unión pasa a la entrada nueva (una copia
con ese reloj que llega después de la unión, con la entrada esperando). La prueba de `R212own` mide
el mecanismo, y lo dice.

### La matriz: no se corrió, y por qué

Todo lo nuevo del motor depende de `queueUnread`, y solo una lectura rechazada de
`@sync_queue_v1` lo enciende. Ninguna prueba anterior hace fallar esa lectura (`grep` de cada
`Promise.reject` de `getItem` en `SyncEngine.test.ts`: todas apuntan a tablas de sellos, a la
lista de conflictos o a la de releer; ninguna otra suite que usa el motor la hace fallar). En los
demás caminos el motor es el mismo: `parseQueue` es el mismo filtro, y el `multiSet` se salta
solo con la cola sin leer. Una pieza de la matriz ve el mismo motor que antes.

## 2. `R9-214`: el bulk push de favoritos en la carga en frío

La hipótesis de A3 (la 34), medida sobre el `FavoritesContext.tsx` de hoy con el provider real:
`pullAllLocal` = `initialize()` + `getFavorites()`, sin `catch` (como `getLocal`; los dos que la
llaman ya registran el fallo). `exportLocalData` lee la misma.

- **La prueba** (`favoritesGetLocalRow.test.tsx`, con `initialize()` detenido): el control dice que
  el bulk push empezó con la carga sin terminar (`loading` true, 0 cargas). Cae sin el arreglo, y
  también sin el `initialize()`, por la consecuencia: `nube: null` en lugar de «lo mio»
  (`S49-rev214.cjs.txt`, sobre `S49-Favorites-R214.tsx.txt`).
- La primera versión miraba la cola sin red, y el arreglo daba `[]`: `start()` vuelve a leer la red
  (en línea en el mock) y la entrada ya había subido. Ahora mira la nube, la consecuencia que nombra
  la entrada.
- **Corolario 51:** el commit de `R9-214` no toca `src/lib/sync` ni `SyncEngine.test.ts` (`git diff
024bef8 HEAD --stat` vacío), y la suite de sync no importa `FavoritesContext`. Las piezas de
  `R9-212` ven las mismas entradas, byte a byte.

## 3. Compuertas

- `tsc` limpio en cada commit, NUL 0 tras cada restauración, `git status` limpio.
- `npm run validate` con `NODE_ENV=development`, sobre `docs/review-s49-fix` con los docs ya
  formateados: **368 suites, 4551 pruebas** (4541 + las 10 nuevas), lint con 0 errores y los
  mismos 70 avisos de la 48 (ninguno en los archivos tocados), formato limpio
  (`_scratch/S49-validate.out.txt`).

## 4. Las lecciones

- **Una guarda que espera a releer necesita una salida.** Una lectura puede fallar siempre (un
  valor más grande que la `CursorWindow`). Esperar hasta leer convertía una pérdida de una vez en
  una permanente: ninguna escritura posterior llegaba a disco. Antes de elegir «esperar hasta que
  se lea», preguntá si el fallo puede ser determinista.
- **Una unión que devuelve una entrada vieja tiene que preguntar si su doc cambió desde entonces.**
  `set` no tiene guarda: sin la marca, la entrada vieja subía encima de la nueva.
- **El control también se lee entero.** El caso con la cola legible era solo el control de la unión,
  y su final (local R, nube D) era un disparador común de `R9-126`.
- **Una sonda que lee por el mismo mock con una puerta cerrada se cuelga.** Leé el disco sin pasar
  por el mock que la sonda controla.
- **La regla de las barras, otra vez:** un script de Python escrito con un heredoc llevaba un `\\n`,
  el heredoc halvó la barra, y la sonda no compiló (un salto de línea real dentro de una cadena).
  Los scripts van con Write.
