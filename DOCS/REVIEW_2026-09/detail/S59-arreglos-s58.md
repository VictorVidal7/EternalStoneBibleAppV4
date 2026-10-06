# Sesión 59 — arreglos de lo de la 58 (2026-10-05)

En el mismo chat que la 58, solo en la terminal y sin agentes, con `_scratch/S59-PROMPT.md` (Victor:
«continuemos por favor estimado»). Arregla `R9-275` y `R9-276`, que registró la revisión del diff
de la 57.

- **Ramas, sin mergear hasta el OK de Victor:** `fix/s59-arreglos-s58` (`fb7696f` `R9-276`,
  `37ba5f7` `R9-275`) y, encima, `docs/review-s59-fix` (este checkpoint).
- **Estado al empezar:** `main` = `origin/main` = `4a757ce` (el checkpoint de la 58, mergeado y
  pusheado con el OK de Victor; CI verde en el log, run `37407024480`, 3 jobs, Node v24.21.0,
  372/4588). Los docs de la 58 decían «sin mergear»: corregido aquí. El motor no se toca: su base
  sigue siendo `S55-SyncEngine-R271.ts.txt` (= `50f209d`), NUL 0.
- **Resultado:** los 2 cerrados. Ningún nuevo. No queda ningún P0 abierto; 276 hallazgos.

## 0. Cómo se midió

- Cada prueba nueva, vista caer primero con el código de antes y después pieza por pieza, por la
  razón correcta (el diff de la aserción): `_scratch/S59-rev.cjs.txt <pieza> [ver]` (guarda y
  restaura los dos archivos, e imprime el árbol restaurado y el `git status`). Cada arreglo,
  commiteado antes de correr sus piezas.
- Tras el segundo commit, las piezas del primero otra vez (caen igual), las pruebas de `R9-273` y
  `R9-274` (pasan), y las sondas de la 58 sobre el árbol nuevo (`S59-s58prep.out.txt`): `TRABA`
  sigue terminando; `borraDurante`, `STORE durante` y `pisada` ya no dejan nada bajo el uid
  borrado; `entraDurante`, `MIGRA` y `FALLA siempre` dan lo mismo que en la 58.
- `npm run validate` entero con `NODE_ENV=development` sobre `37ba5f7`: 372 suites y 4591 pruebas
  (en la 58, 4588), lint con 0 errores (los 70 avisos de siempre) (`_scratch/S59-validate.out.txt`).
- La matriz no se corre: ningún arreglo toca el motor (`cmp` contra la base, NUL 0).

## 1. `R9-276`: la nota de la devolución es una lista (`fb7696f`)

- `@prep_release_pending` guarda una lista de uids (JSON). `releasePrepAccount` agrega el suyo;
  `giveBack`, al terminar la unión, lo quita; `finishRelease` devuelve cada uno por su lado (uno
  que falla otra vez espera al arranque siguiente, y los demás terminan).
- **Las lecturas y escrituras de la nota van de a una** (`noteReleases`, su propio turno), porque
  ahora son de leer y escribir. No van en el turno de la Mesa: la nota se escribe primero, justo
  después de `deleteUser`, y un turno ocupado por una escritura larga agrandaría esa ventana. El
  turno de la nota no pide nunca el de la Mesa: no se pueden trabar.
- **La nota de antes** (un uid suelto, de la 57) se sigue leyendo: lo que no es una lista JSON es
  un uid.
- **Prueba** (`prepAccount.test.ts`, «R9-276: una devolucion que no termino no la pisa otra del
  mismo proceso…»): Ana y Beto se borran en el mismo proceso; falla la unión de Ana (`primera`) o
  las dos (`lasDos`); en el arranque siguiente, las dos Mesas están en la «sin cuenta» y no queda
  ni clave ni nota. CONTROL: la Mesa de Ana se quedó tras su devolución (la unión falló). Y la nota
  antigua se termina (`antigua`).
- Las piezas: `lista` (la nota de un solo lugar), `todas` (solo la primera), `quita` (al terminar
  una se borra la nota entera), `antigua` (la nota de antes no se lee) y `r276todo` (el archivo de
  `4a757ce`) tumban la prueba, cada una por su caso.

## 2. `R9-275`: lo escrito para una cuenta ya devuelta no queda bajo su uid (`37ba5f7`)

**El cómo (delegado, escrito en el encabezado de `prepAccount.ts`, `prepWrite` y `prepMultiSet`):**

- `givenBack`, en memoria: las cuentas cuya Mesa se devolvió en este proceso. Basta la memoria:
  ningún proceso posterior entra como una cuenta borrada, así que solo este puede tener una
  escritura pendiente para ella. Se anota dentro del turno de la unión.
- **La escritura de un store** (`prepWrite`), ya en su turno, va a la Mesa «sin cuenta» si la de
  su cuenta ya se devolvió: allí fueron sus entradas, y la escritura las edita allí. **No** escribir
  y unir después: la escritura de un store parte del mapa que lee, y sobre la clave ya borrada
  quedaría una entrada con una sola sección y el reloj más nuevo, que ganaría la unión y borraría
  las otras secciones del mismo pasaje.
- **El respaldo** (`prepMultiSet`, que reemplaza a `prepTurn`) se escribe igual y se devuelve
  después, en el mismo turno, con la cuenta anotada antes: termina como si se hubiera restaurado
  antes de borrar la cuenta. **No** redirigirlo: el respaldo REEMPLAZA la Mesa, y escrito sobre la
  «sin cuenta» borraría lo que la devolución acababa de llevar allí. Si su unión falla, la nota
  queda y el arranque siguiente la termina; la restauración igual llegó.
- **Si la devolución no terminó** (su unión falló), la cuenta no está en `givenBack`: lo escrito va
  a su clave, y la nota (`R9-276`) lo devuelve en el arranque siguiente con el resto.
- Dentro del turno de la Mesa solo hay llamadas de almacenamiento y el turno de la nota, que no
  pide nunca el de la Mesa.

**Pruebas:**

- `backupPrepTurn.test.ts`, «R9-275: restaurado mientras se borra la cuenta…»: Ana tiene P; el
  respaldo (con R) espera en su parte de SQLite (una puerta nueva en el mock de `withTransactionAsync`)
  mientras se borra la cuenta. `durante`: la «sin cuenta» queda con P y R, nada bajo `:ana`, sin
  nota, y la restauración dice que sí. `muere`: el proceso termina en la devolución que hace el
  respaldo, y el arranque siguiente la termina por la nota. CONTROLES: el respaldo esperó en SQLite
  y no había terminado al borrar; y `antes` (restaurado antes del borrado) da R en la «sin cuenta».
- `prepAccount.test.ts`, «R9-275: una escritura de la Mesa pedida para la cuenta que se esta
  devolviendo…»: la unión de la devolución espera en una puerta, y detrás se piden, con la sesión
  de Ana, otra sección de P y un pasaje nuevo. Van a la «sin cuenta», y P conserva las dos
  secciones. CONTROLES: la unión se retuvo, y las escrituras esperaron detrás.
- Las piezas: `desvio` (sin redirigir al store) tumba la del store; `respaldo` (sin devolver lo
  restaurado) y `anotaRespaldo` (sin anotar antes; cae `muere`) tumban la del respaldo; `r275todo`
  (los dos archivos de `fb7696f`), las dos.
- **`mismoTurno` no cae:** anotar `givenBack` después del turno y no dentro da hoy el mismo orden,
  porque la continuación del `await` de `giveBack` corre antes de que arranque la tarea siguiente
  del turno. Se queda dentro: no depende del orden de las microtareas, y el comentario solo dice
  que una escritura detrás ya lo ve, que es cierto.

## 3. Las lecciones

- **Antes de llevar una escritura tardía a donde fue su Mesa, preguntá si es un parche o un
  reemplazo.** La de un store edita una sección (se redirige); la del respaldo reemplaza el mapa
  (se escribe y se une). Cambiadas, la primera borra secciones y la segunda borra lo devuelto.
- **Una colocación que hoy da lo mismo por el orden de las microtareas se mide y se escribe.**
  `mismoTurno` no cae; se dejó la colocación robusta, y el comentario dice solo lo que se ve.
- **Los comentarios propios, caso por caso, antes del checkpoint (corolario 47).** El encabezado
  decía que el respaldo tardío quedaba «as if restored before the deletion», y no es así:
  restaurado antes, reemplazaba la Mesa de Ana (P se perdía); ahora P se conserva. Corregido con
  un `--amend` del commit de `R9-275` (`01c6fc7` → `37ba5f7`, solo el comentario).
- **Para mover una rama, `git branch -f`, nunca `git reset --hard` con cambios sin commitear.**
  Al alinear la rama de docs tras el amend, un `reset --hard` borró el ledger editado (`BUGS.md`,
  `INDEX.md`, `CONTINUAR.md` y el detalle de la 58). Se recuperó entero (+89/−30) del respaldo de
  lint-staged del amend (`ab3d06a9`, inalcanzable, hallado con `git fsck --unreachable
--no-reflogs`).
