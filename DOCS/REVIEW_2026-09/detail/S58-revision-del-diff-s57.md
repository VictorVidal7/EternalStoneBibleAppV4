# Sesión 58 — revisión del diff de la 57 (2026-10-05)

En un chat nuevo, solo en la terminal, sin agentes y sin tocar código, con `_scratch/S58-PROMPT.md`.
Revisa `fb7cc73..3be46d3`: los arreglos de `R9-273` (`831c7e4`) y `R9-274` (`3be46d3`).

- **Rama:** `docs/review-s58-diff-s57` (solo docs), sin mergear hasta el OK de Victor.
- **Estado al empezar:** `main` = `origin/main` = `cbcc7df` (el checkpoint de la 57, mergeado y
  pusheado con el OK de Victor; CI verde en el log, run `37400931622`, 3 jobs, Node v24.21.0,
  372/4588). Los docs de la 57 decían «sin mergear»: corregido aquí. `git fetch` no trajo un `main`
  nuevo.
- **El motor no cambió:** `git diff --stat fb7cc73 3be46d3 -- src/lib/sync` vacío;
  `SyncEngine.ts` = `S55-SyncEngine-R271.ts.txt` (`cmp`), NUL 0. Sin matriz.
- **Resultado:** 2 nuevos, P3: `R9-275` y `R9-276`. Ninguno lo abrió la 57. No queda ningún P0
  abierto; 276 hallazgos.

## 0. Cómo se midió

- `_scratch/S58-prep.test.ts.txt` + `S58-prep.cjs.txt <out> [viejo|hoy] [filtro -t]`: copia la
  sonda a `__tests__/S58prep.test.ts`, corre y la borra. Con `viejo`, `prepAccount.ts` y
  `BackupService.ts` de `fb7cc73` (antes de la 57). Los stores, el `importBackup` y los joins son
  los reales; SQLite y los logros, mockeados como en `backupServiceImport.test.ts`, con una puerta
  en `withTransactionAsync` (la parte de SQLite del respaldo, ya con la clave de la Mesa resuelta).
  Cinco sondas: `TRABA`, `RESPALDO`, `MIGRA`, `FALLA` y `STORE`. Salidas: `S58-prep-hoy.out.txt`,
  `S58-prep-viejo.out.txt`, `S58-store-hoy.out.txt` y `S58-store-viejo.out.txt`.
- Las piezas de la 57 (`S57-rev.cjs.txt <pieza> ver`), re-corridas: `turno`, `marca`, `arranque` y
  `orden` caen, cada una por su razón, con sus controles en su sitio.

## 1. `R9-273`, el turno del respaldo: ¿se traba? ¿A qué espera?

- **No se traba.** Dentro de `prepTurn` solo corre el `multiSet`; las claves de la Mesa se
  resuelven antes (línea 1398, antes de la transacción de SQLite). `importBackup` tiene un solo
  llamador (`DataSettings.performImport`), fuera de todo turno. `TRABA` lo mide: al arrancar, con una
  nota de devolución pendiente, la Mesa de antes de `R9-59` por migrar, una escritura y un respaldo
  pedidos antes del primer estado (sus claves esperan), la unión de un inicio de sesión y otra
  escritura detrás, todo termina (`fin: "ok"`; orden: unión, estado, w1, respaldo, w2).
- **A qué espera:** con SQLite ya escrito, a lo que tenga el turno delante (una unión, las
  escrituras de los stores). Todo eso son operaciones de AsyncStorage, que en Android corre en un
  ejecutor serie: el `multiSet` habría esperado detrás de ellas igual. El turno agrega solo los
  huecos de JS entre la lectura y la escritura de cada una. La persona ve el botón de restaurar
  ocupado (`isImporting`); el resto de la pantalla responde. Si el proceso muere ahí, queda SQLite
  restaurado y AsyncStorage no: la misma ventana de antes, un poco más larga. Sin hallazgo.

## 2. `R9-273`, la semántica: la clave de cuando se pidió

- **Con un inicio de sesión durante la restauración** (`RESPALDO`, `entraDurante`, con SQLite
  retenido): lo restaurado queda en la Mesa «sin cuenta». Ana, recién entrada, ve su Mesa de antes
  (`veAhora: [P]`, igual tras reiniciar) con el aviso «restaurado»; lo restaurado aparece al cerrar
  sesión, y se une a la suya en el siguiente inicio de sesión que conserva los datos. CONTROL
  (`entraAntes`): restaurado antes, Ana lo ve. Es la semántica que la 57 eligió y escribió; no se
  pierde nada. Sin hallazgo.
- **Con el borrado de la cuenta durante la restauración** (`borraDurante`): lo restaurado queda
  bajo el uid borrado, para siempre (`ana: [R]`, `nota: null`, también tras reiniciar), y la
  restauración dice que salió bien. CONTROL (`borraAntes`): restaurado antes del borrado, la
  devolución lo lleva a la «sin cuenta». **`R9-275`.** Lo mismo con la escritura de un store pedida
  con la sesión de Ana mientras corre la devolución (`STORE`, `durante`; CONTROL `antes`).
- **¿Otro escritor de las claves `@prep_*` fuera del turno?** `grep` de `@prep_`, `prepKey`,
  `prepWrite`, `prepTurn`, `multiSet`, `multiRemove`, `removeItem`, `AsyncStorage.clear` y
  `getAllKeys` en `src/`: solo los cuatro stores (`prepWrite`), `joinPrep` (migración, adopción y
  devolución, en `oneAtATime`) y el respaldo (`prepTurn`). No hay `AsyncStorage.clear` en `src/`;
  `clearAllData` es solo SQLite y nadie la llama. La nota nueva (`@prep_release_pending`) se escribe
  y se borra fuera del turno, y solo la escribe `releasePrepAccount`.

## 3. `R9-274`, la nota

- **Si la unión falla siempre** (`FALLA`, `siempre`: la lectura de la Mesa de la cuenta borrada
  falla en cada arranque): cada arranque termina (`fin: "ok"`), intenta una lectura, y la nota se
  queda. No traba nada: las claves esperan solo a esa lectura. La Mesa que no se puede leer no la
  puede leer nadie. Sin hallazgo.
- **Si la nota no se puede leer:** `finishRelease` se rinde hasta el arranque siguiente (por
  lectura; la nota es un uid, lejos del límite de la `CursorWindow`).
- **Si en el mismo proceso se borra otra cuenta antes del arranque siguiente** (`pisada`): la
  unión de `d` falla, la nota dice `d`; entra `e` y borra su cuenta: la nota pasa a `e`, la unión de
  `e` termina y la borra. En el arranque siguiente, la Mesa de `d` sigue bajo su uid
  (`@prep_notes:d`), para siempre. CONTROL (`soloD`): sin la segunda cuenta, el arranque la
  devuelve. **`R9-276`.**
- **¿Puede la nota nombrar la cuenta que tiene la sesión?** No: la escribe solo `releasePrepAccount`,
  que solo llama `deleteAccount` después de que `deleteUser` resolvió, y `deleteUser` cierra la
  sesión de esa cuenta. Volver a entrar con el mismo Google da otro uid. (Si pasara, la devolución
  movería la Mesa de una cuenta viva a la «sin cuenta» al arrancar.)

## 4. `R9-274`, el orden con la migración

`MIGRA`, arrancando sin sesión con el dueño en disco = la cuenta borrada `d` (el reclamo de
`(deleted)` no llegó) y la Mesa de antes de `R9-59` sin migrar (`@prep_notes`: L y P nuevo; la de
`d`: Q y P viejo):

- **Con la nota** (`conNota`): la migración mueve L a `d`, y `finishRelease` lo devuelve todo: la
  «sin cuenta» queda con L, P («nuevo») y Q, sin claves de `d` ni nota. Igual que el CONTROL
  (`migrada`, la migración ya hecha).
- **Sin la nota** (`sinNota`: el proceso terminó entre `deleteUser` y la nota): L se va a `d` y se
  queda ahí con la Mesa de `d`. No lo abrió la 57: antes, la ventana con el dueño en `d` era la de
  `deleteUser` al reclamo, también una escritura. Hace falta además que la migración no haya
  terminado nunca en ese teléfono (`@prep_by_account` sin escribir). Sin hallazgo nuevo: es el resto
  de `R9-274` que la 57 dejó escrito (una escritura local tras `deleteUser`).

## 5. `R9-274`, el reclamo después de la unión

Un proceso que termina antes del reclamo deja el almacén a nombre del uid borrado (por lectura):

- **`R9-38`:** en el proceso siguiente, lo editado sin sesión se encola para ese uid
  (`loadStoreOwner` lee el disco; `storeOwnerAccount` solo descarta `(deleted)`), y no sube nunca:
  `isDue` exige la sesión activa. Con `(deleted)` no se encolaría. Quedan entradas muertas en la
  cola, una por doc; no llegan a ninguna nube.
- **`R9-270`:** el reclamo del efecto solo corre con una cuenta de Google; sin sesión, no corre.
- **La pregunta del dueño anterior:** la siguiente cuenta que entra la recibe (el dueño no es ella),
  igual que con `(deleted)`.
- **El comentario nuevo de `deleteAccount`** («leaves the store owned by the deleted uid, which gets
  nothing (nobody signs in as it) and is still asked about»): cierto si «gets nothing» se lee «no
  le llega nada a su nube»; la cola sí guarda lo editado para él. Lo dice bien el detalle de la 57
  («espera a una cuenta que no vuelve»). La ventana con el dueño en el uid borrado creció (antes,
  una escritura; ahora la nota, la unión y el reclamo), a cambio de cerrar `R9-274`. Sin hallazgo.

## 6. Las pruebas nuevas

- **`R9-273`** (`backupPrepTurn.test.ts`): construye la carrera. Sin el turno (`turno`), el control
  `antesDeAbrir` pasa a `true` (el respaldo termina con la otra escritura retenida) y R no queda en
  ninguna Mesa; `retenida: 1` en los dos casos.
- **`R9-274`** (`prepAccount.test.ts`): `marca` y `arranque` la tumban (la Mesa se queda bajo Ana;
  con `arranque`, también la nota). El control `cierraSesion` se queda. En `AuthContext.test.tsx`,
  `orden` la tumba con `borrada: 1` y el dueño en Ana (los controles) intactos.
- **La trampa de la 57:** jest da a cada archivo de pruebas su registro de módulos, así que un
  `spyOn` en otro archivo no toca el mock de este. En los dos archivos compartidos, ninguna prueba
  hace `spyOn` sobre `AsyncStorage` (`grep`); la de `R9-270` sustituye `setItem` con
  `getMockImplementation()`, que sigue pasando por `multiSet`. Si alguien agregara un `spyOn` antes,
  la prueba caería (desborde de pila), no pasaría en falso.

## 7. Los comentarios nuevos, caso por caso

- `prepTurn`, el de `importBackup` y la línea del encabezado de `R9-273`: ciertos.
- `setPrepAccount` («finishes giving back … before any key resolves»): cierto (`markKnown` va
  después).
- El encabezado («a give-back that does not finish is finished at the next start») y el de
  `releasePrepAccount` («finished at the next start if it does not finish here (the join fails, or
  the process ends in it)»): **falsos en un caso**, el de `R9-276` (otra devolución en el mismo
  proceso pisa la nota). Y no cubren lo que se escribe para esa cuenta después de la devolución
  (`R9-275`).
- `deleteAccount`: ver el punto 5.

## 8. Los hallazgos

- **`R9-275` (P3):** una escritura de la Mesa resuelta para una cuenta que se borra mientras espera
  (el respaldo, con su parte de SQLite en medio; o la escritura de un store) llega después de la
  devolución y queda bajo el uid borrado, para siempre. Igual con `fb7cc73`: viene de `R9-59`.
- **`R9-276` (P3):** la nota de `R9-274` tiene un solo lugar: otra devolución en el mismo proceso la
  pisa, y la Mesa de la primera cuenta se queda bajo su uid. Antes de la 57 no se terminaba nunca.

## 9. Las lecciones

- **Una escritura «para la cuenta de cuando se pidió» pregunta qué pasa si esa cuenta deja de
  existir mientras espera.** El turno ordena las escrituras, pero no cambia su clave: la que llega
  después de la devolución escribe bajo un uid que ya nadie lee.
- **Una nota de un solo lugar pregunta qué pasa si se escribe dos veces antes de leerse.** Es la
  lección de `R9-260` (una marca que se vacía al usarse) del otro lado.
