# Sesión 50 — revisión del diff de la 49 (2026-10-03)

En un chat nuevo, solo en la terminal, sin agentes y sin tocar código, con
`_scratch/S50-PROMPT.md`. El diff: `8f59942..f287fc6` (`R9-212` en `SyncEngine.ts`, `R9-214` en
`FavoritesContext.tsx`, y sus 10 pruebas).

- **Rama:** `docs/review-s50-diff-s49` (solo este checkpoint).
- **Estado al empezar:** `main` = `origin/main` = `d976c2d`, la 49 mergeada y pusheada (los docs
  decían «sin mergear»: lo corrige este checkpoint). La base `S49-SyncEngine-R212.ts.txt` = el
  motor de `f287fc6` (`cmp`), y `git diff 024bef8 f287fc6` no toca el motor.
- **Resultado:** 5 hallazgos nuevos, `R9-254`..`R9-258`. Dos los abrió `R9-212`, uno `R9-214`, uno
  es anterior a la 49 (el único P2), y el último junta los comentarios y el detalle de la 49.

## 0. Cómo se midió

- **Las sondas, sobre el árbol de hoy**, cada una con su control en el mismo `it`:
  `_scratch/S50-sonda.body.txt` (`HIDRATA`, `RINDE`, `VENTANA`, `UID`) y
  `S50-sonda-borra.body.txt` (`BORRA`), con `S38-sonda.cjs.txt` (salidas `S50-sonda-hoy.out.txt` y
  `S50-borra-hoy.out.txt`).
- **Cada «¿lo abrió la 49?» se midió con el motor de `8f59942`**, el de antes de la 49:
  `_scratch/S50-viejo.cjs.txt <commit> <out> "<filtro>" <cuerpos>` (pone el motor de ese commit,
  corre `S31-run` y restaura `S32_BASE`). Salidas: `S50-sonda-s48.out.txt` y
  `S50-borra-s48.out.txt`.
- **La pieza `R212` no sirvió para eso.** Solo quita `this.queueUnread = true`, y deja la asignación
  nueva de `hydrateQueue` (`this.queue = entries`, también cuando la lectura falla). Con la pieza,
  `HIDRATA` dio lo mismo que hoy. Con el motor de `8f59942`, lo contrario (`R9-254`). Las 9 pruebas
  de `R9-212` sobre ese motor: caen 8, el mismo número que con `R212`
  (`S50-tests212-s48.out.txt`; no se comparó cuáles). Por lectura, la pieza y el motor viejo
  difieren solo cuando hay algo en memoria al fallar la hidratación, y ninguna de las 9 pruebas
  escribe durante la hidratación.
- **Favoritos:** `_scratch/S50-fav.cjs.txt` copia `favoritesGetLocalRow.test.tsx` con el cuerpo
  `S50-fav.body.txt`, lo corre y borra la copia. El «antes»: el mismo script con el
  `FavoritesContext.tsx` de `8f59942` puesto a mano y restaurado con `git checkout` (`cmp` contra la
  copia de hoy: igual).
- Tras cada corrida: `cmp` igual, NUL 0, `git status` limpio.

## 1. Las preguntas del prompt, una por una

### `queueTouched`: ¿hay un camino que cambie la copia local sin marcarla?

- **Por lectura, no.** Los cambios de la copia local que hace el motor pasan por
  `withLocalWriteSuppressed` (aplicar una copia de la nube y las resoluciones de conflictos). Los
  de la app pasan por `queueWrite` o `queueDelete`, y los dos llegan a `upsertQueueEntry`, igual que
  el bulk push. Un borrado local llega por `queueDelete`. Nadie más escribe `@sync_queue_v1` (grep
  en `src` y `app`). Una escritura de la app con la sesión cerrada (`uid` nulo) no encola: la
  entrada de disco sube igual que con la cola leída.
- **La marca por `uid`, medida (`UID`):** Ana tiene aparcada `doc-x`, y la sesión de Beto aplica
  la copia de Beto de `doc-x`. Al unir, la de Ana queda, y la de Beto de `doc-y` (con una copia más
  nueva aplicada) se descarta: `["uid-s50-ana:doc-x","uid-s50-beto:doc-z"]`. En `8f59942` la de Ana
  se perdía. Bien.
- **Lo que no se sostiene es la premisa del comentario:** «una entrada de disco de uno de estos
  docs es más vieja que la copia de aquí». Sin copia local, `applyRemoteChange` no compara relojes,
  y aplica una copia más VIEJA que la entrada. Medido con una lápida en cola (`BORRA`), es
  `R9-256`. El comentario va en `R9-258`.

### La salida: ¿rendirse con dos lecturas es aceptable, o hay un orden peor?

- **Medido (`RINDE`):** la escritura que llega durante la relectura de `start()` espera esa misma
  lectura. Si falla, se rinde con 2 lecturas, y `doc-q` se pierde (`durante`: `lecturas: 2`,
  `["doc-z"]`). Si la escritura llega después, son 3 lecturas y `doc-q` queda (`despues`). En
  `8f59942`, `doc-q` se perdía en los dos.
- **Aceptable como coste**, porque pide dos fallos seguidos y una escritura en los milisegundos de
  la segunda lectura. Pero el comentario de `queueUnread` dice «la tercera»: va en `R9-258`.
- **Hay un orden peor: la escritura durante la HIDRATACIÓN (`R9-254`).** Llega antes de que se sepa
  que la lectura falló. Su `multiSet` reescribe la cola de disco antes de que vuelva la lectura, y
  luego `hydrateQueue` la saca de memoria.

### La unión: el orden, y los relojes de una entrada en vuelo

- **El orden, por construcción:** las de disco van antes que las de memoria, el mismo orden que da
  una hidratación que lee (la cola de disco, y detrás lo que la sesión agrega con `push`). `flush`
  filtra por entrada (`isDue`: el `uid` y el backoff de `R9-33`), así que las aparcadas de otra
  cuenta y las que esperan su backoff no estorban a las demás. No se midió: es el mismo orden.
- **Los relojes que la unión pasa en sitio (`own`) a una entrada en vuelo:** `noteOwnAcked` toma
  solo el reloj de la escritura misma (`R9-239`, «this one, alone»), así que no llegan a la tabla de
  sellos. Mientras la entrada espera, `isOwnCopy` los ve, como tras un `upsertQueueEntry`. El
  cambio en sitio conserva la identidad, que es lo que `flush` mira al confirmar (`R9-11`). Queda
  sin medir lo que la 49 ya dejó sin medir.

### `stop()` con la cola sin leer: ¿el sello y la cola de disco se contradicen?

- **Medido (`VENTANA`, con `stop()` en la ventana):** la tabla de sellos queda en `null` (el doc no
  está en conflicto, y `noteOwnAcked` lo anota solo en `recentAcked`). La contradicción que aparece
  es entre la cola de disco y la nube, no con la tabla: la entrada vieja de disco sigue ahí después
  de que la edición nueva subió, y tras reiniciar sube encima. Es `R9-255`.
- Con un doc en conflicto (un sello en la tabla), sin medir.

### `R9-214`: ¿qué hace `exportLocalData` con el fallo?

- **Medido (`S50 sonda FAV`):** salta el adaptador y lo registra. Con un fallo de `getFavorites()`
  da `[]`, y con los favoritos solos, el total es 0: no hay diálogo de migración, y la pregunta del
  dueño anterior (`declinesPreviousOwnersData`, `R9-166`) no se hace.
- **El daño está en el bulk push, no en el diálogo (`R9-257`).** Registra el fallo, pero graba el
  flag `'2'` de todos modos, y los favoritos no suben nunca por esa vía, ni tras otro `start()`. En
  `8f59942`, con la carga ya terminada, subían desde el ref.

### El coste: ¿algo más decide con `pendingWrites`?

- **En la app, no:** solo el indicador de Ajustes (`app/(tabs)/settings.tsx:96-106` y `:584`). El
  cierre de sesión no lo lee.
- **En el motor, otras decisiones leen la cola de memoria:** `hasQueuedWrite` e `isOwnCopy` (sus
  relojes `own`). Mientras la cola no se lee, tampoco ven las entradas de disco. El comentario dice
  solo «ni se cuentan ni se suben» (`R9-258`). Es por lectura, sin medir. Si la relectura de `start()`
  vuelve, se lee antes de enganchar, así que solo cuenta cuando esa también falla.

## 2. Los comentarios nuevos, caso por caso (corolario 47)

| Comentario                 | Afirma                                                                             | Medido                                                        |
| -------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `parseQueue`               | un valor no JSON o no lista no tiene entradas; lo reemplaza la siguiente escritura | por lectura, sí (`!Array.isArray` → vacío, `dropped: false`)  |
| `queueUnread`              | se rinde en «la tercera» lectura                                                   | `RINDE·durante`: la segunda                                   |
| `queueUnread`              | las de disco «ni se cuentan ni se suben»                                           | tampoco las ven `hasQueuedWrite` ni `isOwnCopy` (por lectura) |
| `queueTouched`             | la entrada de disco de un doc marcado es más vieja que la copia                    | `BORRA·dos`: la lápida es más nueva que R y se descarta       |
| `readQueueAgain`           | el disco tiene lo del arranque («ninguna escritura tomó la cola»)                  | `HIDRATA·dos`: `["doc-w"]` en disco tras el arranque          |
| detalle de la 49, tabla    | `R212` = «el arreglo entero»                                                       | deja `this.queue = entries` en el fallo (`R9-254`)            |
| detalle de la 49, el coste | la entrada descartada es «la que LWW ya perdió»                                    | sin copia local no hay LWW (`BORRA`)                          |

**Los comentarios de las pruebas no se re-midieron uno por uno:** la 49 los midió con `S49-msg`
(el diff de cada caída). Lo único nuevo es que su «sin R9-212» quiere decir «con la pieza `R212`»,
y con el motor de `8f59942` caen 8 de las 9 pruebas, el mismo número; no se comparó cuáles.

## 3. Los hallazgos

- **`R9-254` (P3, lo abrió `R9-212`):** con la lectura de la hidratación fallando, una edición
  hecha durante esa lectura sale de memoria (`this.queue = entries`). La unión la recupera del disco
  si una relectura vuelve. Si se rinde, se pierde (`HIDRATA·tres`: `["doc-z"]`; en `8f59942`,
  `["doc-w","doc-z"]`). Y el `multiSet` de esa edición ya había reescrito la cola de disco: `doc-q`
  se pierde en `dos` y en `tres`, igual que en `8f59942`. Es la familia de `R9-115`.
- **`R9-255` (P3, lo abrió `R9-212`):** mientras la relectura que espera una escritura no vuelve, el
  disco guarda las entradas que esta sesión ya sabe viejas (la marca vive solo en memoria), y no
  guarda la escritura nueva. Si el proceso muere ahí, tras reiniciar la vieja sube encima
  (`VENTANA·cerrada`: local «q nueva», nube «q vieja»; el control `abierta` y `8f59942`: nube «q
  nueva»).
- **`R9-256` (P2, anterior a la 49):** una lápida en cola y una copia del otro más vieja que el
  borrado. Sin copia local, `applyRemoteChange` la aplica sin comparar relojes, y la fila resucita.
  La lápida sube, y su eco llega con la lápida todavía en cola, así que es propio y no se aplica.
  Queda **local R y nube borrada**, con la cola legible (`BORRA·legible` y `uno`, igual en
  `8f59942`).
- **`R9-257` (P3, lo abrió `R9-214`):** `getFavorites()` que falla en el bulk push graba el flag
  `'2'` sin subir nada.
- **`R9-258` (P3, comentarios de la 49):** la tabla de la sección 2.

## 4. Las lecciones

- **Una pieza que dice «el arreglo entero» se compara con el motor de antes.** `R212` quitaba la
  bandera y dejaba la asignación nueva. En las pruebas caen 8 de 9 con la pieza y con el motor
  viejo, pero para una escritura durante la hidratación la pieza medía el arreglo, no su ausencia. Un
  «¿lo abrió el arreglo?» se mide con el motor del commit anterior, no con la pieza.
- **Una premisa del tipo «la copia aplicada es más nueva» pregunta qué pasa sin copia local.** LWW
  compara con lo local, y sin lo local no compara nada. Una lápida en cola es justo el caso en que
  no hay copia local y la entrada es la más nueva.
- **Un estado que solo vive en memoria (`queueTouched`) protege solo mientras vive el proceso.** Si
  la decisión que toma se escribe en disco más tarde (la unión), preguntá qué queda en disco si el
  proceso muere antes.
