# S153 — revisión del diff de la 152 (`88fb8b33..0b957e86`)

> **Sesión 153 (2026-11-16).** Chat nuevo, en la terminal, con **Opus 5.5 de principal**, sin agentes. El asesor
> (Fable) no respondió a tiempo: la sesión cerró sin él. Esfuerzo: `settings.json` dice `high`; el statusline no se
> ve desde el chat. **Sin emulador: nada de esto está medido en vivo.**
>
> **Resultado.** Los tres arreglos de la 152 se sostienen. El mock nuevo no cambia ninguna conducta con HEAD. Cada
> prueba nueva cae con su pieza, por la razón escrita. Las cuatro sondas con HEAD salen iguales a `s152fix`. **Ningún
> hallazgo nuevo.** Dos frases de `R9-594` no decían lo medido: se corrigen en su entrada (§5).

## 1. Estado de partida

`main` = `origin/main` = `32fdd28f` (la 152 mergeada). Entre `0b957e86` y `32fdd28f` no cambia nada en `src/`,
`__tests__/`, `__mocks__/`, `jest.config.js` ni `package.json`. El validador: 278 abiertos de 594, sin avisos.

## 2. El mock nuevo: ¿cambió alguna conducta? No

El cambio: `__reset` pasa de `mockClear` a `mockReset` y repone la implementación de creación. La diferencia posible
es una sola: lo que `mockClear` dejaba vivo y `mockReset` borra. Eso es un override persistente o una cola `*Once`
sin consumir.

- **Por `grep`:** ninguna prueba deja un override persistente sobre el SDK (`mockImplementation`,
  `mockReturnValue`, `mockResolvedValue` o `mockRejectedValue` sin `Once`). Ninguna borra ni reasigna un método del
  SDK. Ningún archivo que usa el SDK llama a `resetAllMocks`, `restoreAllMocks` ni `clearAllMocks`, y
  `jest.config.js` no los activa. `restoreAllMocks` de jest 29.7 solo toca los `spyOn`.
- **Medido:** una variante del mock (`_scratch/S153-mock-sonda.js.txt`) anota, en cada `__reset` y antes de vaciar,
  dos cosas. Una implementación distinta de la de creación (`PERSIST`). Y una cola `*Once` viva (`ONCE`): pone un
  centinela, llama una vez y mira si respondió otro. Lo corre `_scratch/S153-mock-corre.cjs.txt`.
  - **Control:** con la pieza i de la 149 (sin el `logInAs` de `linkUpgradedUser`), un evento:
    `ONCE logIn` en «R9-580 — linkUpgradedUser › si su logIn falla, queda pendiente…». Es la cascada que la 152
    describió (`S153-mock-ctl-i.log.txt`).
  - **HEAD:** los 27 archivos que llaman a `__reset`, 298/298, **0 eventos** (`S153-mock-head.log.txt`). Con HEAD,
    el `__reset` nuevo hace lo mismo que el viejo.

## 3. Cada prueba nueva cae con su pieza, por la razón escrita

`_scratch/S153-integrado.sh.txt` (copia de la 152, salidas `S153-int-*.out.txt`), contra las cinco suites:

| Pieza                   | Caen      | Igual que la §3 de la 152 | La razón leída                                               |
| ----------------------- | --------- | ------------------------- | ------------------------------------------------------------ |
| HEAD                    | 0 (167)   | sí                        | —                                                            |
| `135d`                  | 2         | sí                        | `'restored'` por `'notFound'`; falta el 3.er `logIn` de beto |
| `135e`                  | 3         | sí                        | `logIn.mock.calls` vacío: el arranque no reintenta           |
| `l-try2`                | 2         | sí                        | `TypeError` (`reading 'active'`) en la compra                |
| `l-orden`               | 1         | sí                        | el disco sigue en `beto`                                     |
| `i-lugar`               | 1         | sí                        | `not.toHaveBeenCalledWith('beto')`: 1 llamada                |
| `k-tryget` / `k-tryset` | 1 / 4     | sí                        | `rejected instead of resolved`; la de `logInAs`, `true`      |
| `o-owned`               | 1         | sí                        | no aparece «Tu ofrenda ya está registrada»                   |
| `h149`                  | 1         | sí                        | `Expected: not "anon-nuevo"`                                 |
| `l`                     | 2         | sí                        | el disco da `null`; el CONTROL de m1 no llega al borrado     |
| `m1` / `m2`             | 1 / 1     | sí                        | `done` ya es `true` con el borrado detenido                  |
| `592` (`giftCode…`)     | 2 (de 18) | sí                        | `mockLinkUser`: 1 llamada, se esperaban 0                    |
| `592objeto`             | 1         | sí                        | «la misma cuenta, releída» no enlaza                         |

- **Las 18 pruebas nuevas tienen pieza.** Son dos de `logInAs`, cinco de `pendingLink`, una de la hoja, cuatro de
  `R9-591` y tres del canje. Los tres expects reescritos caen con `135d` y `135e`.
- **El CONTROL de `mockDeleteUser`** (`S152-dos.cjs.txt`): con `deleteUser` saltado solo para beto, la prueba cae en
  `:1676` (0 llamadas). Sin el `mockClear` nuevo, pasa. Igual que en la 152 (`S153-ctl-{fix,nofix}.out.txt`).
- **Las pruebas del canje miden lo que dicen.** El `fetch` cambia `mockCurrentUser` mientras el servidor responde,
  y el `getter` del mock lo lee en vivo. El `beforeEach` repone la cuenta en cada prueba: «cerró sesión» no se filtra
  a las siguientes.

## 4. `R9-592`: el arreglo, sus pruebas y los docstrings

- **Las sondas** (`_scratch/S152-sondas.sh.txt s153head s152fix`): las diez matrices (S146 v1b, la extendida de la
  148, la de la 149 y la de la 151, con U y con N) salen **byte a byte iguales** a `s152fix` (`S153-sondas.out.txt`).
- **Los docstrings** dicen lo que hace el código. El de `sessionUid` y el de `linkUser` nombran la condición del
  canje. El comentario del canje dice que no hay `await` entre la relectura y `linkUser`, y es así: `linkUser`
  escribe `sessionUid` antes de su primer `await` (`offeringService.ts:300`).
- **¿Otro llamador de `linkUser` espera entre leer y llamar? No.** Hay dos llamadores (`git grep`):
  - el listener de `AuthContext.tsx:379-382`: lee el evento y llama en el mismo turno, sin `await`;
  - el canje: arreglado.
- **`linkUpgradedUser`** (también escribe `sessionUid`): `AuthContext` lee `current` y espera la pregunta del dueño
  anterior y `linkWithCredential` antes de llamarlo. En esa espera la cuenta es anónima, y Ajustes solo ofrece «Cerrar
  sesión» a una cuenta (`settings.tsx:541`). Tras el `await`, la llamada va en el mismo turno. Por lectura: no hay
  camino de interfaz que cambie la sesión ahí. No se midió.
- **Lo que queda abierto en el canje** es la ventana del cierre de sesión mismo. Si el servidor responde entre el
  `signOut` de Google y el de Firebase, `currentUser` sigue siendo beto y el canje enlaza a beto. Es el caso de un
  `logIn` en vuelo al cerrar sesión: `forgetSessionAccount` lo olvida después, y `notePendingLink` mira la sesión tras
  su `await` (`:427`). Son las filas de `R9-582`. Nada nuevo.

## 5. `R9-594` y las declaraciones sin prueba: ¿dicen lo medido?

### `R9-594`: dos frases no

| Lo que dice                                   | Lo medido o leído                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| «si esa llamada rechaza (sin red)»            | **Sin red no basta.** Leído en el SDK instalado (bytecode): `purchases-hybrid-common` 18.30.0 llama a `getCustomerInfoWith` con la política por defecto. En `purchases` 10.16.1, `CacheFetchPolicy.default()` es `CACHED_OR_FETCHED`. `getCustomerInfoCachedOrFetched` devuelve la caché del usuario del SDK si existe, y solo va al servidor si no hay. Sin red y con caché, no rechaza. Sin medir en el aparato. |
| «nada lo reintenta en ese proceso»            | **Medido: solo la compra y «Restaurar»** (`S152-a1-s3-principal.out.txt`). Un canje que sale bien, o un inicio de sesión nuevo, llaman a `linkUser` con el SDK configurado, y eso hace `logIn(beto)` (`offeringService.ts:298-305`, por lectura).                                                                                                                                                                  |
| `offeringService.ts:245-255`                  | Hoy son `:246-256`.                                                                                                                                                                                                                                                                                                                                                                                                |
| «anterior a la 150 (de la 146)»               | Sí: `b48c430b` (`git log -S`).                                                                                                                                                                                                                                                                                                                                                                                     |
| «se corrige en el arranque siguiente con red» | Compuesto: el disco sigue en `beto` (medido en S3), y la prueba de `R9-135` del arranque siguiente fija el reintento.                                                                                                                                                                                                                                                                                              |

La severidad sigue en P3, con un disparador más angosto: un `getCustomerInfo()` que rechace sin caché del usuario del
SDK, o por otra falla. La entrada se corrige con una línea `⚠️ Sesión 153`.

### Las declaraciones de la 152: se sostienen

| Declaración                                                                           | Re-medido                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| n y n1, sin prueba                                                                    | 167/167 con cada una (`S153-declaradas.out.txt`)                                                                                                                                                                                                                                                                                              |
| o1: su único consumidor, un `logIn` de más del mismo uid                              | 167/167; la sonda del agente 6, igual: O1a `ana,beto,beto` → `ana,beto,beto,beto`. O1d cambia igual, pero no es un camino real (el listener llama a `linkUser` tras `setSessionAccount`; el informe del agente 6 lo dice)                                                                                                                     |
| las guardas del SDK sin `isAnonymous` (`:352`, `:423`): solo un `warn`                | **La 152 lo dijo por lectura; ahora, medido.** Sonda con un SDK SIN el método (`S153-sonda-guardas.test.ts.txt`): sin cada guarda, los mismos `logIn`, la misma compra, el mismo disco y el mismo «Restaurar». Solo se suma un `warn` (`isAnonymous failed before linking` o `noting the pending link failed`). Con las cinco suites, 167/167 |
| el `beforeEach` de `AuthContext.test.tsx` con `mockClear`: hoy todo `Once` se consume | **Medido.** Una pieza que pone el centinela en `mockSignInAnonymously`, `mockSignInWithCredential`, `mockSignOut` y `mockLinkWithCredential` antes del `mockClear` (`S153-sonda-beforeeach.json.txt`): 53/53, **0 eventos**. Control con un `mockRejectedValueOnce` sobrante inyectado: 1 evento, en la prueba siguiente                      |

## 6. Sin medir en vivo

Todo lo de la 148 a la 152 sigue igual. Se suma: qué devuelve `getCustomerInfo()` sin red en el aparato, con caché y
sin ella (`R9-594`).

## 7. Archivos de la sesión (`_scratch`)

`S153-integrado.sh.txt`, `S153-integrado.out.txt` y `S153-int-*.out.txt`; `S153-sondas.out.txt` y las matrices
`*s153head*`; `S153-rev-592*.out.txt` y `S153-ctl-*.out.txt`; `S153-mock-sonda.js.txt`, `S153-arregla-sonda.cjs.txt`,
`S153-mock-corre.cjs.txt` y `S153-mock-{ctl-i,head}.{log,out}.txt`; `S153-declaradas.sh.txt` y su salida;
`S153-sondaO1-*.out.txt`; `S153-sonda-guardas.test.ts.txt` y `S153-guardas-*.out.txt`;
`S153-sonda-beforeeach{,-ctl}.json.txt` y sus salidas; `S153-checkpoint.sh.txt`.
