# S152 — arreglos: `R9-584` y `R9-591` (las pruebas) y `R9-592` (el canje)

> **Sesión 152 (2026-11-16).** En un chat nuevo, en la terminal, con **Opus 5.5 como principal y Fable 5.2 de
> asesor**, esfuerzo `high`. Victor pidió **6 agentes** (`fork`, en worktree, sobre `88fb8b33`); el orquestador
> integró sus diffs, re-midió todo en el principal y escribió el arreglo de `R9-592`. **Sin emulador: nada de esto
> está medido en vivo.**
>
> **Resultado.** Tres commits en `fix/s152-pruebas`: `f11d813e` (`R9-584`, solo pruebas), `21f67f21` (`R9-591`, el
> mock y pruebas) y `0b957e86` (`R9-592`, el canje y dos docstrings). Los tres hallazgos, arreglados. **Un hallazgo
> nuevo (P3): `R9-594`** (el `getCustomerInfo()` del arranque que rechaza deja el pendiente sin cargar en memoria todo
> el proceso), encontrado por el agente 1 y re-medido en el principal. Y una frase de la 151 corregida: la pieza o1
> sí tiene un consumidor (angosto, sin cambio de dueño).

## 1. Estado de partida

`main` = `origin/main` = `88fb8b33` (los dos commits de docs de la 151 sobre `d74242f8`); el CI, verde en el log
(run 43548218238, 3 jobs, 377 suites y 4789 pruebas). El validador, 280 abiertos de 593, sin avisos.

## 2. Los agentes

Reglas comunes en `_scratch/S152-agentes-reglas.md.txt` (una región del archivo por agente, sin `src/`, cada prueba
vista caer con su pieza, sin `advisor`); herramientas con ROOT propio con `_scratch/S152-copiar.cjs.txt`. Los seis
completaron sin cortes (141-163k tokens, 26-38 llamadas, 4-9 min). Sus informes, piezas y diffs:
`_scratch/S152-sondas-agente-<N>/`. Los worktrees se quitaron tras comprobar que el diff y el `_scratch` de cada uno
eran iguales a la copia (`_scratch/S152-limpiar.sh.txt`).

| N   | Hallazgo | Qué                                                                                                     |
| --- | -------- | ------------------------------------------------------------------------------------------------------- |
| 1   | `R9-584` | el segundo `try/catch` de `logInAs`, el orden borrar/procesar, el lugar del reintento en `initialize()` |
| 2   | `R9-584` | `pendingLink.ts` con el almacenamiento fallando; `notActivated` en «ya comprado»                        |
| 3   | `R9-584` | los tres expects que pasaban con y sin el reintento                                                     |
| 4   | `R9-591` | la cascada de `__reset`                                                                                 |
| 5   | `R9-591` | la colisión sin `logIn` del uid anónimo (pieza h de la 149); la pieza l                                 |
| 6   | `R9-591` | m1 y m2 (el `await`); n, n1 y o1                                                                        |

## 3. Lo integrado, re-medido en el principal

Los seis diffs aplicaron en serie sin conflictos. Cada pieza, revertida sola sobre lo integrado (con el mock nuevo),
contra las cinco suites (167 pruebas; `_scratch/S152-integrado.sh.txt`, salidas `S152-int-<pieza>.out.txt`):

| Pieza                                | Caen  | Cuáles, y por qué                                                                                                                     |
| ------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| HEAD                                 | 0     | 167/167                                                                                                                               |
| `l-try2` (sin el 2.º `try/catch`)    | 2     | las dos de `R9-584 — logInAs`: `TypeError` en la compra                                                                               |
| `l-orden` (procesar antes de borrar) | 1     | «el pendiente se borra ANTES…»: el disco sigue en `beto`                                                                              |
| `i-lugar`                            | 1     | la de `R9-589` (ya la fijaba: `not.toHaveBeenCalledWith('beto')`)                                                                     |
| `k-tryget` / `k-tryset`              | 1 / 4 | las de `pendingLink.test.ts`: `rejected instead of resolved`; la de `logInAs`, `Received: true`                                       |
| `o-owned`                            | 1     | la de `OfferingSheet`: vuelve a los montos                                                                                            |
| `135d`                               | 2     | la de restore de `R9-135` (`'restored'`) y la de l de `R9-591`: usa «Restaurar» como consumidor del pendiente (falta el 3.er `beto`)  |
| `135e`                               | 3     | los dos arranques de `R9-135` en `offeringService` y el de `AuthContext`: ya sin cascada                                              |
| `h149`                               | 1     | la colisión: `Expected: not "anon-nuevo"`                                                                                             |
| `l`                                  | 2     | la del `signOut` que rechaza (`Received: null`) y el CONTROL de la de m1 (con l, el borrado va antes del `signOut`): es el orden de l |
| `m1` / `m2`                          | 1 / 1 | las del `await`: `done` ya es `true` con el borrado detenido                                                                          |

Ninguna cascada. El commit de `R9-584` pasa también solo, con el mock viejo (163/163). Las compuertas
(`S146-gates`), verdes: prettier, tsc, las 24 suites vecinas (316) y `pendingLink.test.ts` aparte (5); eslint, solo
`AuthContext.test.tsx:97`, que ya estaba en HEAD (el mensaje decía 2 avisos en ese archivo: hay 1).

## 4. `R9-584` (`f11d813e`)

- **`logInAs`** (agente 1): el disparador es un `logIn` que resuelve sin `entitlements` (`handleCustomerInfo` lanza
  un `TypeError`, lo único de ese tramo que puede lanzar hoy). Las piezas viejas de la 146 se reescribieron contra
  HEAD (`S152-a1-rev-*.json.txt`).
- **El lugar del reintento en `initialize()`:** ya lo fija la de `R9-589` desde `6e1c48df`; el «0» de la 147 era
  anterior. Sin prueba nueva.
- **`pendingLink.ts`** (agente 2): cinco pruebas en un archivo nuevo. Sin prueba, por no tener nada observable: la
  lectura que falla en el arranque (`initialize()` tiene su propio `catch`; solo cambia el log) y la escritura que
  falla al anotar (`notePendingLink` tiene el suyo).
- **`notActivated` en «ya comprado»** (agente 2): las de «ya comprado» que había restauraban respuestas `notFound`.
- **Los tres expects** (agente 3): en HEAD pasaban 3/3 sin 135d y sin 135e (las líneas, `:817`, `:826-827` y
  `AuthContext.test.tsx:1619-1620`). Ahora `getCustomerInfo`/`restorePurchases` responden por el usuario del SDK con
  un `mockImplementationOnce` que se consume con y sin el reintento. En los dos arranques, el expect de las llamadas
  sigue yendo antes y es el que cae primero; el de «lo que se ve» discrimina solo (medido en copias).
- **Las dos cascadas de la entrada** («la de 135e y 135i también en 135a y 135j») son la de `__reset`: con el mock
  nuevo, 135e baja de 13 a 3 caídas, 135a de 20 a 17 y 135j de 19 a 16. 135i ya no aplica en HEAD (`earlyUid` no
  existe desde la 150).

## 5. `R9-591` (`21f67f21`)

- **El mock** (agente 4): `__reset` hace `mockReset` y repone la implementación con la que se creó cada `jest.fn`
  (un `Map` armado al cargar el módulo con `getMockImplementation()`; jest 29.7.0 deja `undefined` tras
  `mockReset`). Ninguna prueba deja un override persistente sobre el SDK (`grep`). La suite entera, 377/377 y
  4789/4789. f2 de la 150 pasa de 15 caídas a 12 (las 12 que la 151 leyó una a una: la corrida entera ahora dice lo
  mismo), i de la 149 de 4 a 3 (sale la de `R9-581` por timeout).
- **La colisión** (agente 5): RevenueCat en `uid-ana`, `credential-already-in-use`; `logIn` nunca con `anon-nuevo`.
- **La pieza l** (agente 5): el `signOut` de Firebase rechaza; el disco sigue en `uid-beto` y «Restaurar» lo
  reintenta (lo segundo, medido sin el expect del disco).
- **m1 y m2** (agente 6): solo el borrado de la clave del pendiente espera; se restaura con `mockImplementation` en
  el `afterEach`, sin `*Once`.
- **El CONTROL de «R9-582 — eliminar la cuenta borra el pendiente»** (anotado por el agente 6): pasaba con las
  llamadas a `deleteUser` de pruebas anteriores (ningún `beforeEach` limpia `mockDeleteUser`). Con `deleteUser`
  saltado solo para `uid-beto` (`_scratch/S152-rev-sindeletebeto.json.txt`), sin el `mockClear` la prueba pasa;
  con él cae en el control (`:1676`, 0 llamadas). Una pieza que lo quita para todos no lo distingue (también se
  quitan las llamadas anteriores).
- **Declaradas, sin prueba:**
  - **n y n1** (136/136): los dos consumidores de `sessionUid` lo comparan con otro uid, y no puede haber un
    pendiente ni un `logIn` fallido de un uid recién nacido del anónimo. Como la pieza g.
  - **o1: la 151 escribió «sin consumidor que lo distinga», y no es exacto.** Sonda del agente 6
    (`S152-a6-sondaO1.test.ts.txt`): si beto vuelve con su `logIn` en vuelo y compra, sin la pieza hay un
    `logIn(beto)` de más (`ana,beto,beto,beto` contra `ana,beto,beto`); ningún dueño cambia. Con el SDK real ese
    reintento espera detrás del primero (la ventana de `R9-593`). Se declara.
  - **Las guardas del SDK sin `isAnonymous`** (`offeringService.ts:352` y `:423`, agente 4): sin ellas pasan 134/134
    con los dos mocks; por lectura, el `TypeError` cae en el `catch` y termina igual. Solo cambia un `warn`.
  - **`AuthContext.test.tsx`: el `beforeEach` también usa `mockClear`** en `mockLinkWithCredential`,
    `mockSignInWithCredential` y `mockSignOut` (agente 5): un `Once` sin consumir de esos sobreviviría igual. Hoy
    todos los de las pruebas nuevas se consumen. Se declara.

## 6. `R9-592` (`0b957e86`)

**Diseño (delegado):** al volver con éxito, `redeemGiftCode` relee `currentUser` y llama a `linkUser` solo si es el
mismo uid. **Por qué:** cierra las cuatro filas; la otra propuesta («que el `linkUser` del canje no escriba
`sessionUid`») dejaba G2ok y F-G2ok, anteriores al diff, con `logIn(beto)` estando carla en sesión. Firebase es la
fuente: tras su `signOut`, `currentUser` ya es `null` antes de `forgetOfferingSession()`, y el listener puede ir
detrás. Sin `await` entre la relectura y `linkUser` (que anota la cuenta antes de su primer `await`). Se compara el
uid, no el objeto.

- **Predicción escrita antes de correr** (`_scratch/S152-prediccion-592.txt`), y la sonda lee `currentUser` en vivo
  (un getter sobre `mockFb.current`): la relectura se ve.
- **Antes, la línea de base:** con el mock nuevo, las cuatro sondas con HEAD (`s152head`) salen byte a byte iguales
  a las `s151head` (`_scratch/S152-sondas.sh.txt`).
- **Con el arreglo (`s152fix`):** las tres sondas viejas, iguales; en la de la 151 cambian solo G1, G1ok, G2, G2ok y
  F-G2ok, igual con U y con N (`S152-diff-fix-head-{U,N}.txt`), como decía la predicción:

| Fila   | HEAD                                                    | Con el arreglo                                 |
| ------ | ------------------------------------------------------- | ---------------------------------------------- |
| G1     | `disco=beto`; el anónimo compra: `logIn(beto)`, en beto | sin `logIn(beto)`; `disco=null`; compra en ana |
| G1ok   | `rc=beto` con el anónimo; su compra en beto             | `rc=ana`; su compra en ana                     |
| G2     | `disco=beto`; carla compra en beto, también en frío     | carla compra en carla, también en frío         |
| G2ok   | `rc=beto` con carla en sesión; sus compras en beto      | `rc=carla`; sus compras en carla               |
| F-G2ok | `logIn(carla)` y después `logIn(beto)`: `rc=beto`       | solo `logIn(carla)`: `rc=carla`                |

El regalo sigue siendo de beto en el servidor: lo ve cuando vuelve a iniciar sesión.

- **Pruebas** (`giftCodeService.test.ts`): «cerró sesión durante el canje» y «entró otra cuenta durante el canje» no
  enlazan (caen sin el arreglo: 1 llamada a `linkUser`, `S152-rev-592.out.txt`); «la misma cuenta, releída (otro
  objeto, mismo uid)» enlaza: el control cae con un arreglo que compara el objeto (`S152-rev-592objeto.out.txt`).
- **Docstrings:** `sessionUid` y `linkUser` dicen la condición del canje. El de `retryPendingLink` («a pending link
  of an account that signed out … is not retried») vuelve a valer por el camino del canje sin cambiarlo.

## 7. `R9-594` (P3), nuevo

Lo encontró el agente 1 con su sonda (S3) y se re-midió en el principal con el mock nuevo
(`_scratch/S152-a1-s3-principal.out.txt`): si el `getCustomerInfo()` de `initialize()` rechaza (sin red), el `catch`
se salta el bloque del pendiente (`offeringService.ts:245-255`): `pendingUid` queda `null` en memoria todo el proceso
aunque el disco diga `beto` y beto esté en sesión. Beto compra con `success` sin `logIn(beto)` antes (la compra, en
ana), y «Restaurar» tampoco reintenta (`notFound`). Se corrige en el siguiente arranque con red. Anterior a la 150 (el
bloque es de la 146); vecino de `R9-135` y `R9-587`. No estaba en `BUGS.md` (buscado por `getCustomerInfo` con
falla, y por el bloque del pendiente). Propuesta (sin escribir): leer el pendiente del disco aunque
`getCustomerInfo()` falle (fuera del `try` de esa llamada, o en su `finally`), con la regla de `R9-589`.

## 8. Sin medir en vivo

Todo lo de la 148 a la 151 sigue igual. Se suma: el canje con la sesión cambiando, con el arreglo (`R9-592`), y el
arranque sin red con un pendiente (`R9-594`).

## 9. Archivos de la sesión (`_scratch`)

`S152-agentes-reglas.md.txt`, `S152-copiar.cjs.txt`, `S152-limpiar.sh.txt`; `S152-sondas-agente-{1..6}/`;
`S152-integrado.sh.txt`, `S152-integrado.out.txt` y `S152-int-*.out.txt`; `S152-dos.cjs.txt`,
`S152-rev-sindelete*.json.txt`, `S152-rev-sinclear.json.txt` y `S152-ctl-*.out.txt`; `S152-a1-s3-principal.out.txt`;
`S152-gates.out.txt`; `S152-prediccion-592.txt`, `S152-rev-592*.json.txt` y `.out.txt`; `S152-sondas.sh.txt`, las
matrices `*s152head*` y `*s152fix*` y `S152-diff-fix-head-{U,N}.txt`; `S152-msg-{584,591,592}.txt`;
`S152-checkpoint.sh.txt`, `S152-bloques.txt` y `S152-docs.cjs.txt`.
