# S149 — revisión del diff de la 148 (`R9-580`, `R9-581` y `R9-583`)

> **Sesión 149 (2026-11-13).** En un chat nuevo, en la terminal, sin agentes, con **Opus 5.5 como principal y Fable
> 5.2 de asesor**, esfuerzo `high`. No se tocó la app: solo docs. Alcance: `760e0e99..0d64352e` (`src/` y
> `__tests__/`). **Sin emulador: nada de esto está medido en vivo.**
>
> **Resultado.** Los tres arreglos hacen lo que dicen en las filas para las que se escribieron: las seis piezas de la
> 148 vuelven a caer, cada una en su prueba y por la razón escrita, y las cuatro matrices salen byte a byte iguales a
> las `s148fix3`. Tres hallazgos nuevos, los tres P3: **`R9-589`** (el reintento del arranque mira `earlyUid`, fijado
> antes de `configure()`: con un cambio de sesión durante `initialize()`, RevenueCat queda en la cuenta que salió;
> es de la 146, no de este diff), **`R9-590`** (cinco comentarios dicen más de lo que hace el código o de lo medido)
> y **`R9-591`** (dos lugares del diff que ninguna prueba commiteada fija, y una cascada sin declarar). **Leído en el
> SDK instalado: los pedidos al backend salen de a uno y en orden.** Con ese orden, la guarda de `R9-581` no cambia
> ninguna fila: una «regresión de `R9-581`» que esta sesión llegó a escribir no se sostiene (§4).

## 1. Estado de partida

`main` = `origin/main` = `f307fee9`, con los tres commits de código (`e8d67dc2`, `04c60aad`, `0d64352e`) y dos de
docs. En `_scratch/S38-ci-log.out.txt` (el log que bajó la 148; no trae ni el sha ni el número de run): los 3 jobs
en `success`, 377 suites y 4779 pruebas, que es el conteo de la 148. Las ramas de la 148, borradas. El validador, en
0 y 0.

## 2. Cada arreglo arregla lo que dice (las piezas)

Las seis piezas de la 148, otra vez, con `S144-revert` contra las tres suites (`offeringService.test.ts`,
`AuthContext.test.tsx` y `AuthContextLinkPromptColdStart.test.tsx`, 124 pruebas). Salidas:
`_scratch/S149-rev-<pieza>.out.txt`; las piezas nuevas, en `S149-rev-{f,g,h,i}.json.txt`. Las corren
`S149-piezas.sh.txt` y `S149-ronda2.sh.txt`.

| Pieza | Qué se revierte                                            | Cae                                           | Razón leída                                                       |
| ----- | ---------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| 580a  | la llamada en `AuthContext`                                | 1: «…la cuenta nueva se enlaza»               | `logIn.mock.calls`: `[]` en vez de `[['anon-nuevo']]`             |
| 580b  | la guarda de `isAnonymous()`                               | 2: «…en su id anónimo, no (se) enlaza»        | `logIn` llamado 1 vez, esperado 0                                 |
| 580c  | `requestedUid === uid` en `linkUpgradedUser`               | 1: «…ya es ese uid… no lo repite»             | un `logIn('anon-nuevo')` de más                                   |
| 580d  | `!configured`                                              | 1: «sin configurar, no enlaza»                | `logIn` llamado 1 vez, esperado 0                                 |
| 580e  | el `return` del `catch` (pasa a `throw`)                   | 1: «…no sabe decir si está en un id anónimo…» | el rechazo `no configurado` escapa del `await` (leído sin filtro) |
| 581   | `requestedUid !== uid` en `notePendingLink`                | 1: «beto en vuelo; carla entra y resuelve…»   | `Received: "beto"`, esperado `null`                               |
| **i** | el `logInAs` final de `linkUpgradedUser`                   | 3 por la razón, y 1 en cascada (abajo)        | `logIn` nunca llamado; nada pendiente (`Received: null`)          |
| **f** | `if (!Purchases?.isAnonymous) return;`                     | ninguna                                       | equivale al `catch` (abajo)                                       |
| **g** | la llamada, movida después de `claimLocalStore`            | ninguna                                       | no la fija ninguna prueba (abajo)                                 |
| **h** | la llamada, agregada a la rama `credential-already-in-use` | ninguna en jest; **las dos sondas sí la ven** | `R9-591`                                                          |

- **f.** Sin la guarda, un SDK sin `isAnonymous` (o sin módulo) lanza un `TypeError` dentro del `try`, el `catch`
  lo anota y devuelve: tampoco hay `logIn`. Solo cambia el `logger.warn`. No hay prueba posible por las llamadas, y
  no hace falta.
- **g.** Lo que va después de la llamada no lanza hoy: `claimLocalStore` se traga su error
  (`AuthContext.tsx:114-123`) y `adoptNoAccountPrep` también (`prepAccount.ts:336-365`). Moverla no cambia nada
  observable; la posición de hoy es la buena si algún día algo de eso lanza.
- **h.** La llamada no es alcanzable desde la rama `credential-already-in-use`: `linkWithCredential` rechaza antes
  de llegar a ella, y una función `async` no lanza de forma síncrona. Si alguien la agrega, las sondas de la 148
  cambian 106 líneas por modelo (`S146-matriz-v1b-s149h.txt` y `S148-matriz-ext-s149h{,-U,-N}.txt`): un
  `logIn(<uid del anónimo que se descarta>)` tras cada inicio de sesión con colisión, y compras a nombre de ese
  uid. Las pruebas commiteadas no lo ven.
- **i, la cascada.** Además de las tres que caen por la razón, cae por tiempo la prueba de `R9-581` (otro
  `describe`): el `mockRejectedValueOnce` de «si su logIn falla…» no se consume, y `__reset` del mock usa
  `mockClear` (`__mocks__/react-native-purchases.js:84-92`), que no vacía la cola de los `*Once`.

**Cada `expect` nuevo (la pregunta 6).** Ninguna PRUEBA nueva pasa sin su arreglo (salvo el control de `R9-581`,
que tiene que pasar con y sin la guarda). Por `expect`:

- **Discriminan:** los `logIn.mock.calls` y `logIn not called` de las pruebas de `R9-580` (piezas a, b, c, d e i),
  el `getPendingLinkUid()` de «si su logIn falla…» (pieza i) y el de `R9-581` (pieza 581).
- **Discriminan, pero no se llega a ellos** (cae antes otro `expect` de la misma prueba): el
  `isAnonymous not called` de «sin configurar» (pieza d) y el `[['beto'], ['carla']]` de `R9-581`.
- **Son precondición:** el `waitFor` del uid, los `linkWithCredential toHaveBeenCalledTimes(1)` y el
  `isAnonymous toHaveBeenCalledTimes(1)`.
- **Pasan con la pieza:** el `logIn not called` de «…no sabe decir…» con la pieza e (la prueba cae porque el
  rechazo escapa, no por el `expect`).
- **Miden código de la 146, no una pieza de la 148:** el `[['anon-nuevo'], ['anon-nuevo']]` de «si su logIn
  falla…» (el reintento antes de comprar).

## 3. Las matrices

`bash _scratch/S148-sondas.sh.txt s149` contra HEAD: `S146-matriz-v1b-s148s149.txt` y
`S148-matriz-ext-s148s149{,-U,-N}.txt`, **byte a byte iguales a las `s148fix3`**. Entre `s148base` y `s148fix3`
cambian solo B2, 6c, 6d y las filas nuevas 6f a 6i, con los **mismos** cambios con U y con N
(`_scratch/S149-diff-base-fix3.txt`). La de la 146, sin una diferencia.

## 4. Lo que la 148 no midió

Una sonda nueva con el arnés de la 147 (el `AuthProvider`, el `offeringService` y el `giftCodeService` reales):
`_scratch/S149-sonda.test.tsx.txt`, armada por `S149-arma-sonda.cjs.txt` con `S149-filas.txt`, corrida por
`S149-sonda.sh.txt`. Agrega una compuerta para `isAnonymous()` y un **modo FIFO** (`logIn` y `getCustomerInfo`
de a uno y en orden). Salidas: `S149-matriz-head{,-U,-N}.txt` y, con la guarda de `R9-581` revertida,
`S149-matriz-sin581{,-U,-N}.txt`. **U y N salen idénticas en cada fila.**

**El orden de los pedidos, leído en el SDK instalado.** `Backend.logIn` encola en el `dispatcher` del `Backend`,
que es `Dispatcher(config.service ?: newSingleThreadScheduledExecutor())` (`PurchasesFactory`); `Dispatcher.enqueue`
hace `submit` o `schedule` en ese ejecutor; y `purchases-hybrid-common` 18.30.0 no llama a `Builder.service`. Los
pedidos al backend (`logIn`, `getCustomerInfo`) salen de a uno y en orden, y sus respuestas vuelven en ese orden. No
se leyó el paso previo de `logIn` (`clearUserIdBackupIfNeeded`). La sonda de la 147 suponía lo contrario (dos
`logIn` no se serializan): las filas sin FIFO de abajo dependen de ese supuesto.

| Fila   | Caso                                                                                                                                     | Con HEAD                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| I1     | orden inverso: el evento de Firebase llega después de que `linkUpgradedUser` terminó                                                     | dos `logIn(anon2)` seguidos; la compra queda en anon2                              |
| I2     | el evento llega mientras `linkUpgradedUser` espera a `isAnonymous()`                                                                     | dos `logIn(anon2)`: la guarda `requestedUid` se mira antes del `await`, no después |
| I3     | como I2, y el `logIn` del listener queda en vuelo y falla tarde (sin FIFO)                                                               | `rc=anon2` y `disco=anon2`: anota al mismo uid; la compra hace otro `logIn(anon2)` |
| I4     | 6e con el `logIn` del listener fallando (el evento antes del regreso del link)                                                           | `linkUpgradedUser` no repite; queda anotado; la compra reintenta y queda en anon2  |
| L2     | dos links seguidos (la cuenta nueva sale y el anónimo siguiente crea otra)                                                               | cada cuenta se enlaza; la compra, en la segunda                                    |
| C1     | carla: pendiente viejo de beto, `logIn(carla)` en vuelo, la compra reintenta beto y sale ANTES, carla rechaza tarde (sin FIFO)           | `rc=beto` para siempre; sus dos compras, de beto. Sin la guarda, se corregía       |
| C2     | como C1, y el `logIn` de carla resuelve tarde (bien; sin FIFO)                                                                           | la compra ya quedó en beto, y carla se queda sin extras                            |
| C3     | como C1, con «Restaurar» en vez de comprar (sin FIFO)                                                                                    | `rc=beto` tras el arranque en frío. Sin la guarda, se corregía                     |
| E3     | arranque con beto pendiente y en sesión; con `getCustomerInfo` en vuelo, beto sale y entra carla (`logIn` en vuelo); carla rechaza tarde | el reintento de `initialize()` hace `logIn(beto)`; la compra de carla, de beto     |
| E4     | como E3, pero el `logIn` de carla resuelve bien antes de que `initialize()` lea el pendiente                                             | sin daño: el `logIn` bueno borra el pendiente antes                                |
| F-C1   | C1 en FIFO: el reintento de beto sale DESPUÉS del `logIn` de carla, que falla                                                            | `rc=beto` para siempre; la compra, de beto (`R9-582`)                              |
| F-C1ok | lo mismo, y el `logIn` de carla sale bien                                                                                                | igual: `rc=beto`; la compra, de beto (`R9-582`)                                    |
| F-E3   | E3 en FIFO: `getCustomerInfo`, `logIn(carla)` (falla) y el reintento de beto, en ese orden                                               | **`R9-589`**: `rc=beto` en cada arranque; la compra de carla, de beto              |
| F-E3ok | lo mismo, y el `logIn` de carla sale bien                                                                                                | **`R9-589`**: igual                                                                |

- **La guarda de `R9-581`, con y sin FIFO.** Sin FIFO, C1, C3 y E3 cambian con la guarda revertida (el rechazo de
  carla se anotaba, y el arranque o la compra siguiente hacían `logIn(carla)`): era una «regresión de `R9-581`», y
  así quedó numerada en el primer commit de esta sesión. **En FIFO, las cuatro filas F salen iguales con y sin la
  guarda:** el rechazo de carla llega antes que el reintento de beto, y el `logIn` bueno de beto borra lo que se
  hubiera anotado. Con el SDK como está leído, la guarda no cambia nada, y el orden de B2 (la fila para la que se
  escribió `R9-581`) no se da. `R9-589` se reescribió a lo que sí se sostiene en FIFO.
- **Lo que daña es el reintento con una cuenta que no está en sesión.** Comprar y restaurar reintentan sin mirar la
  sesión: `R9-582`, que con FIFO alcanza también a otra CUENTA en sesión, salga bien o mal su `logIn` (F-C1,
  F-C1ok). El reintento de `initialize()` mira `earlyUid`, que `linkUser` escribe solo mientras `!configured`; y
  `configured` pasa a `true` antes de los `await` de `getCustomerInfo()` y `getPendingLinkUid()`: si la sesión
  cambia en ese rato, reintenta a la cuenta que salió (F-E3, F-E3ok). Eso no estaba escrito: **`R9-589`**.
- **Dos `logIn` del mismo id (I1 a I3).** Leído en `PurchasesOrchestrator.logIn`: si el id pedido es el actual, no
  llama a identify; solo trae el `CustomerInfo` (`created=false`). En I1 y en I2 el segundo pedido no mueve dueños.
  En FIFO, el segundo de I3 sale cuando el primero ya terminó, así que tampoco. Sin daño; no se numera.
- **`requestedUid` y un uid viejo.** Lo leen dos: `linkUpgradedUser` (antes del `await`) y `notePendingLink`
  (después). Lo escribe solo `logInAs`, al que llegan `linkUser` (el listener y el canje: siempre la cuenta en
  sesión), `linkUpgradedUser` y `retryPendingLink` (comprar, restaurar e `initialize()`). Que quede con el valor de
  una cuenta que ya salió no daña por sí mismo: los dos lectores lo comparan con un uid que acaba de pedirse o con
  el anónimo que se enlaza.
- **El docstring de `earlyUid`** (`offeringService.ts:134-137`) sigue diciendo que es la cuenta que pidió
  `AuthContext`; `giftCodeService` también lo escribe (su propio comentario ya lo dice desde `0d64352e`). Es la
  quinta viñeta de `R9-583`, que quedó a medias: `R9-590`.

## 5. 6g: ¿lo cubre la §7?

Sí, por la letra; no es decisión para la §8. La regla en una línea: «un usuario anónimo nunca le cambia el dueño a
RevenueCat; solo lo cambia una cuenta que inició sesión». La cuenta nueva creada por link es una cuenta que inició
sesión. «Lo que no cambia»: «Iniciar sesión con OTRA cuenta en el mismo aparato muestra lo de esa cuenta». Y el
párrafo de la 147: con RevenueCat quieto en la cuenta que salió, lo que el anónimo compre queda en esa cuenta, y
«lo que NO se acepta es que le pase a una cuenta NUEVA creada por link: es `R9-580`». Mantener los extras de ana en
6g pide dejar a RevenueCat en ana, que es `R9-580`. Lo que la §7 acepta («se queda con los extras tras cerrar
sesión») sigue valiendo mientras el anónimo no crea una cuenta.

## 6. Los comentarios de `R9-583` contra el código y el SDK

SDK leído en la versión instalada: `react-native-purchases` 10.7.1 → `purchases-hybrid-common` 18.30.0
(`android/build.gradle:124`) → `purchases` 10.16.1 (su POM en la caché de Gradle; `_scratch/S147-aar.sh.txt`). RN
Firebase: `@react-native-firebase/auth` 26.2.0, solo su capa JS.

- **Bien:** `linkUser` (no hay canje siendo anónimo), la cabecera de `pendingLink.ts`, `notePendingLink` («the
  SDK remembers its user across starts»; «can be the same uid», que I3 confirma), `hasOfferingPurchase` y el de
  `giftCodeService.ts`.
- **«Decides by that id's shape»** (`linkUpgradedUser`, `notePendingLink`): `currentUserIsAnonymous` es «el id
  tiene la forma `$RCAnonymousID`» **o** «es igual al id heredado de una versión vieja del SDK»
  (`getLegacyCachedAppUserID`). Dice menos que el SDK: `R9-590`.
- **«Firebase sends no auth event for a link»** (`AuthContext.tsx:486-487`, y el docstring de `linkUpgradedUser`,
  que dos frases después cuenta con que el evento llegue): sin medir. Lo leído: en la capa JS, `linkWithCredential`
  termina en `_setUserCredential`, que emite `onUserChanged` y no `onAuthStateChanged`; este último sale solo del
  evento nativo `auth_state_changed`, que no se leyó. El propio `R9-580` dice que depende de eso. `R9-590`.
- **«…goes through linkUpgradedUser instead»** (docstring de `linkUser`): si el evento llega, la cuenta nueva pasa
  por `linkUser` (6b, 6e, I4). `R9-590`.
- **El comentario de `R9-581`** (un rechazo puede llegar después de que otro `logIn` «perhaps went through»): con
  los pedidos en orden, un `logIn` pedido después no termina antes del rechazo de uno anterior. `R9-590`.

## 7. Hallazgos nuevos

- **`R9-589` (P3)**: el reintento del arranque mira `earlyUid`, fijado antes de `configure()`. Medido con sonda (E3,
  F-E3 y F-E3ok); U = N; igual con y sin la guarda de `R9-581`. Es de `b48c430b` (la 146). P3 y no P2 como
  `R9-580`: aquel era un camino común sin carrera (cerrar sesión, crear la cuenta, comprar); este pide un pendiente
  de la cuenta en sesión al arrancar, y cerrar sesión e iniciar otra antes de que vuelva el primer
  `getCustomerInfo()`. **Propuesta (sin escribir):** con `R9-582`: que el reintento mire la cuenta en sesión en el
  momento de reintentar, no `earlyUid`.
- **`R9-590` (P3)**: cinco textos (§4 y §6): el docstring de `earlyUid`; «no auth event for a link» dicho como
  hecho, dos veces; «goes through linkUpgradedUser instead»; «decides by that id's shape»; y «perhaps went
  through». **Propuesta (sin escribir):** corregirlos en el commit de `R9-582`.
- **`R9-591` (P3)**: las pruebas commiteadas no fijan que la llamada quede fuera de la rama
  `credential-already-in-use` (pieza h: solo la ven las sondas, que no están commiteadas) ni su lugar antes de lo
  que sigue (pieza g, sin efecto hoy); y la cascada de la pieza i (`__reset` no vacía los `*Once`). **Propuesta (sin
  escribir):** una prueba de colisión con RevenueCat en otra cuenta que afirme que no hay `logIn` del uid
  anónimo; `mockReset` de las colas en `__reset`, o declarar la cascada. Con `R9-584`.
- **En entradas que ya existían:** `R9-582` alcanza también a otra cuenta en sesión (F-C1, F-C1ok); a `R9-581`, el
  orden de su fila B2 no lo da el SDK instalado (sin re-severizar). Las dos, con su ⚠️ de la 149 en `BUGS.md`.

## 8. Sin medir en vivo

Lo de la 148 (§6) sigue entero: si Firebase avisa tras `linkWithCredential` y en qué orden. Se agrega: la ventana de
`R9-589` (lo que tarda el primer `getCustomerInfo()` al arrancar) y el paso previo de `logIn` en el SDK
(`clearUserIdBackupIfNeeded`), que podría cambiar el orden de entrada de dos `logIn`.

## 9. Archivos de la sesión (`_scratch`)

`S149-filas.txt`, `S149-arma-sonda.cjs.txt`, `S149-sonda.sh.txt` y `S149-sonda.test.tsx.txt`; `S149-matriz-*`;
`S149-diff-base-fix3.txt`; `S146-matriz-v1b-s148s149.txt`, `S148-matriz-ext-s148s149*`, `S146-matriz-v1b-s149h.txt`
y `S148-matriz-ext-s149h*`; `S149-rev-*` (`.json.txt` y `.out.txt`), `S149-revert-full.cjs.txt`,
`S149-piezas.sh.txt`, `S149-ronda2.sh.txt` y `S149-ronda3.sh.txt`; `S149-bloques.txt`, `S149-docs.cjs.txt`,
`S149-checkpoint.sh.txt`, `S149-mem.cjs.txt` y `S149-msg-*.txt`.
