# Sesión 56 — revisión del diff de la 55 (2026-10-05)

En un chat nuevo, solo en la terminal, sin agentes y sin tocar código, con `_scratch/S56-PROMPT.md`.
Revisa `a64786b..50f209d`: los arreglos de `R9-269`..`R9-272`.

- **Rama:** `docs/review-s56-diff-s55` (este checkpoint), sin mergear hasta el OK de Victor.
- **Estado al empezar:** `main` = `origin/main` = `5b5c630` (el checkpoint de la 55, mergeado y
  pusheado; CI verde en el log, run `37173764215`, 371/4585). Los docs decían que la 55 iba «sin
  mergear»: corregido aquí. La base del motor, `S55-SyncEngine-R271.ts.txt` (= `50f209d`, `cmp`
  igual); NUL 0.
- **Resultado:** 2 nuevos, P3: `R9-273` (medido) y `R9-274` (por lectura). Una corrección del
  detalle de la 55. No queda ningún P0 abierto; 274 hallazgos.

## 0. Cómo se midió

- **La Mesa**, con los stores y el `importBackup` reales (con los mocks de SQLite y de logros de
  `backupServiceImport.test.ts`): `_scratch/S56-prep.test.ts.txt`, corrido con
  `S56-prep.cjs.txt <out> [viejo]` (copia, corre y borra `__tests__/S56prep.test.ts`; con `viejo`,
  los 5 archivos de la Mesa de `a64786b`, y los restaura). Salidas: `S56-prep-hoy.out.txt` y
  `S56-prep-viejo.out.txt`.
- **El motor**, con `S38-sonda.cjs.txt` y los cuerpos `S54-sondas.body.txt` (por sus ayudas) y
  `S56-motor.body.txt` (`RELEE`, `DUENO2`): `S56-motor-hoy.out.txt`; con el motor de `a85df96`
  (`S50-viejo.cjs.txt`), `S56-motor-a85df96.out.txt`. Tras cada una: `cmp` igual, NUL 0 y el
  árbol limpio.
- **La matriz:** `S53-comparar.cjs.txt` sobre `S44-matriz-s53-a85df96.out.txt` y
  `S44-matriz-s55-50f209d.out.txt`: 157 de 157 iguales, control 0 de 285. El código no cambió
  desde `50f209d` (`git diff --stat 50f209d HEAD -- src __tests__` vacío), así que no se volvió a
  correr.
- Las preguntas 4, 5 y 6 son de orden entre la app y el SDK, y van por lectura: el mock de auth
  dispara el listener solo cuando la prueba lo pide, y una sonda ahí solo mostraría el orden que
  se le da.

## 1. `R9-269`, el turno: ¿puede trabarse? — no; el respaldo, fuera del turno (`R9-273`)

- Dentro de un turno solo hay AsyncStorage: `joinPrep` y el `run` de cada store (con la clave ya
  resuelta). Ningún `getAll*` ni `prepKey` corre dentro; la clave se espera antes de pedir turno.
- **Medido (`TURNO`):** una escritura pedida antes del primer estado de auth, la unión de un inicio
  de sesión, el primer estado (con la Mesa de antes de `R9-59` que mover: su unión toma un turno) y
  otra escritura detrás. Terminan todas (orden: unión, estado, w1, w2) y no se pierde nada. Igual
  con los archivos de `a64786b`.
- **El respaldo (`RESPALDO`):** `importBackup` resuelve la clave de la Mesa al empezar y la
  escribe en su `multiSet` final, sin turno. Restaurado sin sesión mientras corre la unión de un
  inicio de sesión (con su escritura retenida), el pasaje restaurado no queda en ninguna Mesa, y
  `restoredSections` dice `prepNotes`. CONTROL: restaurado antes, se mueve a la cuenta; después,
  se queda en la «sin cuenta». Con los archivos de `a64786b`, lo mismo: no lo abrió la 55, pero
  su comentario («the Mesa's writes and its joins run one at a time») y el cierre de la carrera lo
  daban por cubierto. **`R9-273` (P3).**

## 2. `R9-269`, lo que se queda en la Mesa «sin cuenta» — sin hallazgo

- **Medido (`REPETIDA`):** Ana tiene P en su cuenta; sin sesión escribe P (más nueva) y Q. Tres
  uniones seguidas dejan lo mismo («sin cuenta»: P; Ana: P y Q): no se acumula ni se duplica nada,
  y una unión sin nada que mover no escribe.
- **Lo que ve:** con sesión, la P de la cuenta, aunque la «sin cuenta» sea más nueva; al cerrar
  sesión, la P «sin cuenta» (lo que escribió sin sesión, más viejo que lo que editó después con
  sesión). Es lo que dice el comentario de `prepAccount.ts`, y es la única opción que no pierde ni
  expone: que gane la más nueva al entrar obligaría a perder la de la cuenta o a dejarla en la Mesa
  «sin cuenta», que ve cualquiera sin sesión; unir por sección pierde igual el texto de la misma
  sección.
- **Otra cuenta:** Beto entra y conserva los datos locales (responde «Migrar», o no hay nada que
  preguntar): su Mesa recibe la P «sin cuenta» de Ana. Es la regla de `R9-59` (la «sin cuenta» se
  une a la cuenta que conserva los datos locales) sobre lo que la 55 deja de borrar; antes de la
  55 esa P se perdía al entrar Ana. Sin hallazgo.
- **`migrateLegacyPrep` con choques:** es la misma unión sin `sourceGoes`; un choque solo existe si
  una migración fallida dejó escribir en la Mesa de la cuenta antes de la siguiente, y lo que choca
  se queda en la «sin cuenta» en vez de borrarse. Por lectura, igual que lo medido.

## 3. `R9-269` al borrar la cuenta — nada que antes no; las cuatro Mesas tienen reloj

- **La premisa era falsa:** las ilustraciones (`prepIllustrations.ts:115`) y la autoevaluación
  (`prepSelfReview.ts:95`) también llevan `updatedAt`, y `isNewer` lo lee en cualquier entrada. El
  detalle de la 55 decía «las notas y las series lo tienen»: corregido allí.
- **Medido (`BORRAR`):** la misma entrada en las dos Mesas, en notas, ilustraciones y
  autoevaluación. Con la de la cuenta más nueva, quedan las tres de la cuenta; con la «sin cuenta»
  más nueva, las tres de la «sin cuenta». Con los archivos de `a64786b`, ganaba siempre la «sin
  cuenta».
- Antes y después se pierde una de las dos (la unión cuyo origen desaparece, dicho en el
  comentario). La 55 cambia cuál (la más vieja), y lo que antes se perdía al entrar (la «sin
  cuenta» del mismo pasaje) ahora se decide recién al borrar la cuenta. Sin hallazgo.

## 4. `R9-270`, el reclamo en el efecto — no se adelanta a la pregunta; `R9-274` al lado

- El efecto reclama el `user` del estado, y el estado pasa a una cuenta de Google solo por
  `linkWithCredential`/`signInWithCredential` (y el `setUser(mergedUser)` de después). En las tres
  ramas de `signInWithGoogle` la pregunta va antes de esas llamadas: el link (`R9-166`), la
  colisión (tras el link fallido, antes de `signInWithCredential`) y la directa (`R9-125`). Un link
  fallido no cambia el estado.
- **`deleteAccount`:** tras `deleteUser`, los estados son nulo y anónimo, que no reclaman. La
  re-autenticación no cambia de usuario (el SDK no levanta un estado de auth por ella). El efecto
  no escribe la cuenta borrada después de `(deleted)`.
- **Al lado, por lectura (`R9-274`, P3):** si el proceso muere entre `deleteUser` y el final de
  `releasePrepAccount`, o la unión falla (se traga el error), nada la reintenta, y la Mesa de la
  cuenta borrada queda bajo un uid que nadie vuelve a usar. Es de `R9-59` (la 53), no de la 55.

## 5. `R9-270`, el reclamo en `signOut` — no cambia la carrera

- `stop()` suelta los listeners en el acto (`SyncEngine.ts:916`), antes del `await` nuevo: con el
  token todavía válido no queda ningún listener que pueda dar el error. Mientras se espera, el
  motor está parado con la sesión abierta, y nada lo vuelve a arrancar (`SyncEngineContext`
  arranca solo con un `user` nuevo).
- El reclamo va en el ejecutor serie detrás de lo que `stop()` escribe (los sellos), y retrasa el
  cierre lo que tardan esas escrituras. Un `setItem` que falla se traga; uno que no vuelve dejaría
  el cierre sin terminar, pero eso es AsyncStorage colgado, y con él se cuelga toda la app. Sin
  hallazgo.

## 6. `R9-270`, lo que queda a la vista — cuándo pasa en la app

- Encolan, sin sesión: los favoritos (`FavoritesContext`), las tarjetas de memoria
  (`MemoryDeckContext`), los subrayados y las notas, y la restauración de un respaldo. Todo es una
  acción de la persona; nada encola solo al arrancar.
- La ventana es la del arranque en frío hasta el primer estado de Google (Firebase restaura la
  sesión): una edición ahí, con el marcador de la cuenta anterior (los dos reclamos de un proceso
  fallaron, o murió antes del efecto), y con la lectura del dueño de vuelta antes de ese estado. Si
  la lectura vuelve después, `start()` ya dijo el dueño y responde por ella. Queda como lo dejó la 55.

## 7. `R9-271`, la relectura sin sesión — no choca con la de `start()`

- `rereadQueue` es de a una (`queueRereading`), y `joinQueue` corre solo con una lectura buena,
  que vacía `queueUnread`: después nadie vuelve a pedir otra.
- **Medido (`RELEE`):** sin sesión, la primera lectura de la cola falla; con un fallo, la relectura
  de `R9-271` espera en la puerta cuando llega `start()` (2 lecturas en total: `start()` usa la
  misma); con dos, ya falló y la de `start()` es la que espera (3). Mientras, con sesión, se edita
  `doc-q`, cuya entrada vieja está en el disco: la nube queda en «q nueva» y «z» sube, en los dos.
  Con el motor de `a85df96`, las mismas lecturas (2 y 3) y el mismo final.
- `queueTouched`: la edición sin sesión lo marca (la cola no está leída), y la unión de la
  relectura descarta la entrada vieja de ese doc, como la de `start()`.
- El presupuesto de `R9-212` no baja: una escritura que llega mientras la relectura de `R9-271`
  está en camino la espera y se rinde con ella (2 lecturas), como antes con la suya.

## 8. `R9-271`, el dueño: cuánto retiene — una lectura

- El reintento es inmediato, sin plazo: la cadena espera, como mucho, una lectura más de una clave
  chica.
- **Medido (`DUENO2`):** la lectura del dueño falla, la segunda espera en la puerta, y llegan
  `start()` y una edición de la sesión: la edición no entra en la cola hasta abrir (CONTROL: 2
  lecturas pedidas). Con la segunda sana o fallida, suben las dos (el dueño de `start()` responde).
  Con el motor de `a85df96`, una sola lectura, y la edición sin sesión no sube nunca (el defecto
  que arregló la 55).
- Un `getItem` que no vuelve colgaba la cadena igual con la primera lectura: no es nuevo.

## 9. La matriz y los comentarios nuevos

- **La matriz:** 157 de 157 iguales a la de `a85df96`, control 0 de 285 (§0).
- **Los comentarios, caso por caso (corolario 47):**
  - `prepAccount.ts`, la cabecera de `R9-269`: lo que el destino no tiene se mueve, y lo que choca
    se queda y se ve al cerrar sesión (`REPETIDA`); antes se borraba (`viejo`); al borrar la
    cuenta gana la más nueva (`BORRAR`). **«The Mesa's writes … run one at a time»: falso para el
    respaldo (`R9-273`).**
  - `prepWrite` («the key is awaited first … whose join takes a turn»): `TURNO`.
  - `joinPrep` («`from`'s key goes once nothing is left in it»): `RESPALDO`, `antes`.
  - `AuthContext`, el efecto («the account here already went through the question»): §4, por
    lectura. El de `signOut`: lo midió la prueba de la 55 (`alCerrar`).
  - `SyncEngine.queueFor` («a read again that fails gives up nothing»): `RELEE`, `dosFallos`.
  - `loadStoreOwner` («the writes behind wait for this one, the session's too»): `DUENO2`.
  - Las pruebas: la de `R9-269` («lo restaurado de Rom 8:28 también»: Rom 8:28 está en las dos
    Mesas, así que antes se perdía; cierto) y las de `R9-271` y `R9-272`, medidas por pieza en la 55.

## 10. Las lecciones

- **Un turno sobre una clave pregunta quién más escribe esa clave.** La 55 puso en turno los cuatro
  stores; el respaldo escribe las mismas claves y quedó fuera (`R9-273`). Es la de la 25 («quién
  más escribe en ese mismo lugar»): antes de cerrar una carrera, `grep` de cada escritor de la
  clave, no solo de los que tocó el defecto.
- **La premisa de una pregunta también se mide.** La pregunta 3 venía del detalle de la 55 («las
  notas y las series lo tienen»), y las cuatro Mesas tienen reloj.
