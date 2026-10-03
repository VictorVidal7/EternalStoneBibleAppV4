# Sesión 51 — arreglos de lo de la 50 (2026-10-03)

En el mismo chat que la 50, solo en la terminal y sin agentes, con `_scratch/S51-PROMPT.md` (Victor:
«vamos a continuar desde aquí»).

- **Ramas:** `fix/s51-arreglos-s50` (4 commits: `88fb219` `R9-256`, `e97cd95` `R9-254` y
  `R9-115`, `ec5bc70` `R9-257`, `6d834c5` los comentarios de `R9-255` y `R9-258`) y, encima,
  `docs/review-s51-fix` (este checkpoint). Sin mergear hasta el OK de Victor.
- **Estado al empezar:** `main` = `origin/main` = `af8a5ae` (la 50 mergeada y pusheada, CI verde en
  el log, run `37145852120`). La base `S49-SyncEngine-R212.ts.txt` = el motor de `f287fc6`.
- **Resultado:** 5 cerrados (`R9-256`, `R9-254`, `R9-115`, `R9-257`, `R9-258`), 1 aceptado
  (`R9-255`) y 1 nuevo (`R9-259`).

## 0. Cómo se midió

- **Una base por commit:** `_scratch/S51-SyncEngine-R256.ts.txt`, `-R254`, `-R257` y `-final`
  (cada una = el motor de su commit, `cmp` tras commitear). Las piezas, en
  `_scratch/S51-piezas.cjs.txt` (reexporta las de la 49), con `S49-msg.cjs.txt` (el diff de cada
  caída). Para la prueba de favoritos, `S34-rev.cjs.txt` con `S32_TEST`.
- **Las sondas de la 50, sobre cada arreglo:** `BORRA` tras `R9-256`
  (`S51-borra-R256fix.out.txt`) y las de `S50-sonda.body.txt` tras `R9-254`
  (`S51-hidrata-fix.out.txt`). La variante sin red de `R9-255`, nueva:
  `S51-sonda-sinred.body.txt` (hoy y con el motor de `8f59942`).
- Tras cada corrida, `cmp` igual con la base, NUL 0 y `git status` limpio.

## 1. `R9-256` (P2): la lápida en cola y la copia más vieja del otro

- **El arreglo:** sin copia local y con una lápida de esta cuenta en cola, la copia que llega se
  compara con la lápida, que gana el empate (como `remoteTs <= localTs` en LWW). Solo lápidas: una
  edición en cola sin copia local no sale de un camino normal de la app.
- **La prueba** lleva su control en el mismo `it`: con el mismo camino, una copia MÁS nueva que el
  borrado (el otro la recreó después) sí entra al enganchar. Eso prueba que la copia llega y que la
  guarda compara relojes. Lo que pasa después con esa copia (la lápida sube encima) es `R9-126`, y
  la prueba no lo mira: fijarlo sería dar por esperado un daño.
- **`BORRA` con el arreglo:** `legible` y `uno`, local nulo y nube borrada. `dos` (la cola sin leer
  toda la sesión) sigue igual que en `8f59942`: la lápida no está en memoria. Se acepta, y lo dice
  el comentario de `queueTouched` (`R9-258`).
- **Lo que abrió (`R9-259`):** la pieza `R197local` (la salida `ownQueued && !local` de la lectura
  de un `removed`) tumbaba la prueba de `R9-197` sobre la base de la 49. Sobre la de hoy, sola, da
  0, y junto con `R256` vuelve a tumbarla (corolario 50). No son equivalentes: la vieja también
  salta una copia leída más nueva que la lápida, y esa diferencia es el caso de `R9-126`. Se queda,
  registrada.

## 2. `R9-254` y `R9-115`: lo escrito durante la hidratación

- **El arreglo, distinto de la hipótesis** («que `queueWrite` espere la hidratación»): la escritura
  se acepta, pero `persistQueue` no escribe la cola hasta hidratarla (con `force`, desde `stop()`,
  escribe los sellos sin la cola). La hidratación une lo leído con lo de memoria, y es la unión de
  `readQueueAgain`, extraída a `joinQueue`. Con la lectura fallida, lo de memoria se queda y espera
  la relectura. Lo escrito antes de la primera lectura marca su doc (`queueTouched`), como mientras
  la cola no se lee. Hacer esperar a `queueWrite` habría cambiado la API síncrona de todos los
  contextos.
- **La marca tiene su propia prueba.** La primera versión de la prueba de `R9-115` no la veía
  (`R254touch` caía solo por un efecto lateral). El caso que la necesita es una edición que sube y
  sale de la cola ANTES de que vuelva la lectura: sin la marca, la entrada vieja de disco se une y
  sube después. Se agregó (`lenta`, con la lectura retenida), y su control dice «0 en cola al
  volver».
- **Un control que estaba mal, corregido antes de commitear:** el caso `rapida` decía «la lectura
  vuelve antes del ack», pero tras el `settle` la edición ya había subido (`enColaAlVolver: 0`).
  Ahora la subida espera en `mockSetGate` hasta que termina la hidratación: es el caso de `R9-115`,
  con la subida en vuelo.
- **Piezas, de a una:**

| Pieza       | Qué revierte                                 | Caen | Por qué                                                                          |
| ----------- | -------------------------------------------- | ---- | -------------------------------------------------------------------------------- |
| `R254hyd`   | la hidratación pisa la memoria               | 2    | entradas perdidas; la nube vuelve a «viejo»                                      |
| `R254keep`  | solo con la lectura fallida (lo de `R9-212`) | 1    | `doc-w` sale de memoria                                                          |
| `R254write` | la cola se escribe antes de hidratar         | 1    | `doc-q` se pierde en `dos`                                                       |
| `R254touch` | lo escrito antes de leer no marca            | 2    | `lenta`: la nube vuelve a «viejo»; en la otra, la hidratación no escribe `doc-w` |

- **Las piezas de `R9-212` sobre la base nueva:** `R212remote`, `R212queue` y `R212omit` ya no
  aplicaban, porque sus anclas las cambió `R9-254` y daban «SIN RESUMEN». Se rehicieron como
  `R212remote2`, `R212queue2` y `R212omit2`, y tumban lo mismo que en la 49 (1, 1 y 1).
  `R212queue2` tumba también las dos de `R9-254`, que dependen de esa marca. Las demás, igual que
  en la 49.

## 3. `R9-257`: la colección cuyo `pullAllLocal` falla

- **El arreglo, distinto de la hipótesis** de la 50 («no grabar el flag»). El motor decía que los
  duplicados son idempotentes, pero `R9-126` dice que no: un push con el reloj viejo pisa la copia
  más nueva de la nube. Repetir el bulk push entero volvería a subir las colecciones que ya
  subieron. Por eso el flag `'2'` se graba igual, y las colecciones que fallaron quedan en
  `@sync_first_push_retry:<uid>`. El `start()` siguiente sube esas, y solo esas. Si la lista no se
  lee, no se hace nada, y queda para el siguiente; nunca se repite el push entero. Una colección
  de la lista sin adaptador registrado esa vez se queda en la lista.
- **Subrayados y notas** lanzan en vez de devolver `[]`, como favoritos desde `R9-214`. Los dos que
  los llaman ya registran el fallo.
- **Pruebas (4):** el motor, con dos adaptadores (`R257` tumba el reintento; `R257only`, que sea
  solo de la que falló, porque `test/a` sube dos veces); favoritos, con el provider y el motor
  reales (cae con `R257`); y los dos adaptadores, en `syncAdapterPullAllLocalThrows.test.ts`
  (caen con su `catch` de antes, medido con `git stash` de los dos archivos).
- **Sin prueba:** la lectura de la lista que falla. Es manejo de error: sin el `try`, el rechazo
  saldría de una llamada con `void`.

## 4. `R9-255`: aceptado

- **La variante sin red, medida** (`S51-sonda-sinred.body.txt`): con la relectura retenida y el
  proceso muerto, `cerrada` da nube «q vieja», local «q nueva» y la cola vacía tras reiniciar, así
  que la edición nueva no sube nunca. `abierta` y `8f59942` dan «q nueva». Lo abrió `R9-212`.
- **Por qué se acepta:** la ventana es una lectura de almacenamiento local (milisegundos), después
  de dos lecturas fallidas, y el proceso tiene que morir justo ahí. Un fallo determinista vuelve
  rápido y se rinde. Cerrarla pediría guardar en disco la escritura que espera y la marca, en otra
  clave con sus propios casos (ilegible, de otra cuenta, releída). Es el mismo argumento con que
  Victor aceptó `R9-252`. Victor delega el diseño técnico de sync, así que la decisión queda
  escrita en el comentario de `queueUnread`, donde ocurre.

## 5. `R9-258`: los comentarios

Cada afirmación nueva, con su medición:

- `queueUnread`: la relectura que se rinde puede ser la segunda (`RINDE·durante`), y las de disco
  tampoco las ven `hasQueuedWrite` ni `isOwnCopy` (`BORRA·dos`: la lápida no está y la copia
  entra). Más la aceptación de `R9-255`, con `VENTANA` y `SINRED`.
- `queueTouched`: lo escrito antes de la primera lectura también marca (`R9-254`), y la entrada de
  un doc marcado no siempre es más vieja. Sin copia local, la lápida se descarta, igual que en
  `8f59942` (`BORRA·dos`), y solo si fallan la hidratación y la relectura de `start()` (`uno`: no).
- `readQueueAgain`: «nada tomó la cola» ya es cierto, por `R9-254` (`HIDRATA·dos`: el disco sigue
  con `doc-q` tras el arranque).
- El detalle de la 49 lleva una nota que remite a `R9-258`.

## 6. La matriz

La de la 44, tal cual, sobre `6d834c5`, en un worktree aparte (`C:/projects/essb-s51m`, con la
junction a `node_modules`; borrado al terminar, la junction primero). Salida:
`_scratch/S44-matriz-s51-6d834c5.out.txt`; contra la de la 44: `S51-comparar-s44.out.txt`. La 49
no la había corrido.

- **157 piezas, control 0/278.** Ausentes, 11: las 8 de siempre y tres cuyas anclas cambiaron
  (`T-heal` por `R9-257`; `S32-multi` y `S34-208diferir` por `R9-212`, en la 49). Rehechas para
  la base de hoy (`M51heal`, `M51multi`, `M51diferir` en `S51-piezas.cjs.txt`), dan lo mismo que en
  la 44: 1, 5 y 5, con las mismas pruebas.
- **Las demás, iguales o suben** por las pruebas nuevas (las de `R9-251`, `R9-212` y la 51).
- **Bajan dos (corolario 46):**
  - `S32-H3local` (la guarda de `R9-197`), de 1 a 0: es `R9-259`;
  - `S176-cola` (la guarda de la cola en la lectura de un `removed`), de 11 a 10: deja de caer la
    de `R9-176` en la que el otro restaura mientras el usuario borra. Juntas, `S176cola+R256`
    vuelve a tumbarla (12). La guarda conserva 9 pruebas propias, así que no es un hallazgo: esa
    prueba la cubren ahora las dos.

## 7. Compuertas

- `tsc` limpio en cada commit, NUL 0 tras cada restauración, `git status` limpio, y cada base igual
  (`cmp`) al motor de su commit.
- `npm run validate` con `NODE_ENV=development`, sobre `docs/review-s51-fix`: **369 suites, 4558
  pruebas** (4551 más las 7 nuevas, y un archivo nuevo), lint con 0 errores y los mismos 70 avisos
  de la 50 (ninguno en los archivos tocados), formato limpio (`_scratch/S51-validate.out.txt`).

## 8. Las lecciones

- **Una hipótesis de arreglo que dice «los duplicados son inocuos» se coteja con el ledger.** El
  propio motor lo afirmaba, y `R9-126` es justo lo contrario. La hipótesis de `R9-257` («no grabar
  el flag») habría ensanchado `R9-126`.
- **Una guarda nueva sobre la misma estructura que una vieja se mide con la pieza de la vieja**
  (corolario 50). `R9-256` tapó a `R9-197` en su única prueba, y solo lo mostró correr `R197local`
  sola y junto con `R256`.
- **El control de una prueba de orden se mira, no se supone.** `rapida` decía «la lectura vuelve
  antes del ack» sin forzarlo, y el control lo desmintió en la primera corrida.
- **La regla de las barras, otra vez:** las piezas de `R9-254` se escribieron con un heredoc que
  llevaba `\n`. Esta vez el archivo quedó bien, pero las piezas van con Write o Edit.
