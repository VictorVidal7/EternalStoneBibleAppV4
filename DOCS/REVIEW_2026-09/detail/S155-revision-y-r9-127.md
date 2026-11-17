# S155 — la revisión del diff de la 154, y `R9-127` arreglado

> **Sesión 155 (2026-11-16).** Chat nuevo, en la terminal, con **Opus 5.5 de principal y Fable 5.2 de asesor** (respondió dos veces),
> esfuerzo `high`. **Sin agentes. Sin emulador: nada de esto está medido en vivo.** Este borrador va a
> `detail/S155-revision-y-r9-127.md` en el cierre (`_scratch/S155-CIERRE-PROMPT.md`).
>
> **Resultado.** El diff de la 154 se sostiene. Dos hallazgos nuevos, los dos P3 (§2). `R9-127`, arreglado en
> `fix/s155-r9-127` (§3 y §4), con un commit de un comentario (§2.3) y uno de una prueba que pidió el asesor (§4).

## 1. Estado de partida

`main` = `origin/main` = `b82e1a4e`. El validador: 275 abiertos de 594 (0 P0, 14 P1, 90 P2, 170 P3 y un aviso).

## 2. La revisión del diff `32251187..253f0a9d`

### 2.1 Cada prueba cae con su pieza

`_scratch/S155-revision.cjs.txt` (copia de `S154-integrado.cjs.txt`, agentes 1 a 5) corrió en `main`. Salida:
`S155-revision.out.txt` y `S155-rev-a<N>-<pieza>.out.txt`.

- Las 18 piezas caen. `src/` quedó limpio. El detalle de la 154 dice «las 25»: hoy son 18 de los agentes 1
  a 5, más las 6 del agente 6, que no entró (24). La diferencia no se rastreó.
- Las razones son las escritas. Ejemplos: el cursor en 8 700 000 (`<= 1 000 000`); «resolved instead of rejected»;
  2 listeners vivos donde va 1.
- Las tres pruebas que no caen con ninguna pieza son los `CONTROL`, por nombre (a1, a2 y a5).
- Las piezas del agente 2 no revierten código: simulan un adaptador que se traga el error
  (`.catch(() => undefined)` en el motor). Fijan que `resolveConflict` propague el rechazo.

### 2.2 El contrato de `types.ts` contra cada adaptador

| Adaptador      | `getLocal` lanza si no leyó  | `apply*` rechaza si no escribió                 |
| -------------- | ---------------------------- | ----------------------------------------------- |
| notas          | sí                           | sí (desde la 154)                               |
| subrayados     | sí (desde la 154)            | sí (desde la 154)                               |
| favoritos      | sí                           | sí (desde la 154)                               |
| `memoryCards`  | sí (`R9-133`)                | **no**: escribe en memoria; el disco va después |
| `reviewEvents` | no (`null`, lo dice el tipo) | no escribe (no-op a propósito)                  |

- **`memoryCards`** (`MemoryDeckContext.tsx:410-432`): `applyRemoteUpsert` hace `edit()` en memoria y resuelve.
  El disco lo escribe un efecto después, con `setItem(...).catch(() => undefined)` (`:354` y `:374`). Si esa
  escritura falla siempre, el cursor ya pasó y la tarjeta remota se pierde al reiniciar. Es el candidato del
  agente 4 de la 154. **Hallazgo nuevo `R9-596` (P3), por lectura, sin medir.**
- Nadie fuera de `SyncEngine.ts` llama a un `apply*` ni a `getLocal` (grep; `AuthContext.tsx:680` es un
  comentario). `withLocalWriteSuppressed` limpia la supresión en su `finally`: un rechazo no la deja puesta.
- La pieza `atom` (subrayados): el `INSERT OR REPLACE` tiene las mismas columnas, el mismo `id` y la misma
  normalización que `addHighlight` (`HighlightService.ts:56-101`). No se perdió ningún efecto: `addHighlight` no
  hace nada más.

### 2.3 Un comentario viejo

`AchievementService.ts:165` decía que el upsert de subrayados pasa por `addHighlight()`. Desde `5296512b` usa su
propio SQL. El efecto que explica no cambia (ninguno llama a `checkAchievements()`). Corregido en el segundo commit
de `fix/s155-r9-127`. Sin número.

### 2.4 La sonda de la §7 de la 154: un `apply*` que falla siempre

`_scratch/S155-sonda-applyFallaSiempre.test.ts.txt` (salida `.out.txt`): `doc-old` falla siempre; `doc-a` y
`doc-b` son posteriores. Tres attaches.

| Attach | Piso    | Entregados            | Aplicados |
| ------ | ------- | --------------------- | --------- |
| 1      | 699 999 | doc-old, doc-a, doc-b | ninguno   |
| 2      | 699 999 | doc-old, doc-a, doc-b | ninguno   |
| 3      | 699 999 | doc-old, doc-a, doc-b | ninguno   |

- El piso queda clavado bajo el doc que falla. Cada attach relee ese doc y todo lo posterior. LWW descarta lo ya
  aplicado: no se pierde nada, se paga en lecturas.
- La cuenta crece con cada cambio posterior y no tiene salida mientras la escritura falle.
- Antes de la 154, el doc se perdía una vez y no costaba lecturas (de la 154, sin re-medir).
- ¿Hay un doc venenoso (un fallo determinista)? Por lectura, no entre los escritores de la propia app: los
  `NOT NULL` y el `CHECK` de `rating` de los tres esquemas los llena siempre el mismo dispositivo. Un doc
  escrito por otra versión o a mano sí lo sería: sin medir.
- **Hallazgo nuevo `R9-595` (P3), medido.** La regla de `R9-212` (una falla que se repite).

## 3. `R9-127`: la medición previa

`_scratch/S155-sonda-sinpregunta.casos.txt` sobre el arnés del agente 6 (`S155-sonda-sinpregunta.arnes.txt`): el
`AuthProvider` y el `SyncEngine` reales. Solo falla la clave de la marca de dueño. Salidas:
`S155-sonda-sinpregunta-head.out.txt`, `-a6.out.txt` y `-fix.out.txt`.

| Caso, tras eliminar la cuenta                        | HEAD          | Diff del agente 6 | Arreglo   |
| ---------------------------------------------------- | ------------- | ----------------- | --------- |
| A, marca ilegible, rama del link                     | `skip`, 0     | **`'2'`, 1**      | `skip`, 0 |
| A, marca ilegible, rama sin anónimo                  | `skip`, 0     | **`'2'`, 1**      | `skip`, 0 |
| B, nunca reclamado y el reclamo falla, rama del link | `skip`, 0     | **`'2'`, 1**      | `skip`, 0 |
| B, lo mismo, rama sin anónimo                        | `skip`, 0     | **`'2'`, 1**      | `skip`, 0 |
| Control: marca legible, «Migrar»                     | **`skip`, 0** | `'2'`, 1          | `'2'`, 1  |
| Control: marca legible, «Solo iniciar sesión»        | `skip`, 0     | `skip`, 0         | `skip`, 0 |

- Ninguno de los cuatro casos pregunta (el inicio resuelve sin tocar el diálogo).
- B con la marca vieja legible SÍ pregunta: `forgetStoreOwner` solo toca memoria, y la marca queda con el uid
  borrado. Por eso B pide un almacén nunca reclamado (dos escrituras fallidas).
- La colisión pregunta siempre: no entra en la tabla.
- El diff del agente 6 aplicó entero (`git apply --check`, 2 archivos de `src/`) y se revirtió.

## 4. `R9-127`: el arreglo

- **El motor** (`SyncEngine.ts`). El skip de un inicio lleva su uid (el diseño del agente 6): `queueSkipNextBulkPush
(uid)` devuelve un asa; `settle(uid)` lo ata, `settle(null)` lo suelta. Ranura aparte, `deletionSkip`:
  `queueSkipAfterAccountDeletion()` la arma, la toma el start de cualquier cuenta, una vez.
  `suspendSkipAfterAccountDeletion()` la suspende y devuelve con qué reponerla.
- **`deleteAccount`.** Arma la red recién tras la limpieza y el `deleteUser` (las dos vías), antes del primer
  `await`. El docstring (paso 2) dice por qué.
- **`signInWithGoogle`.** Un `true` de `askMigration` suspende la red al responder (en
  `declinesPreviousOwnersData` y en la colisión). Un link que falla sin colisión, o un `signInWithCredential`
  que falla, la reponen. Un `false` por «nada que preguntar» no la toca.
- **Por qué una ranura aparte** (del asesor): con una sola, borrado → «Solo iniciar sesión» → el inicio falla
  → `settle(null)` dejaba `null`, y el reintento sin pregunta subía lo borrado. Lo fija la prueba de la pieza
  `ranura-unica`.

**Pruebas:** `__tests__/s155-skip-por-uid.test.tsx`, 21: las 12 del agente 6 (encabezado actualizado) y 9 de la
red. Una arranca el motor DENTRO del mock de `signInWithCredential`, como el evento de auth real.

**Las 13 piezas** (`_scratch/S155-piezas.cjs.txt`, salida `S155-piezas.out.txt`), cada una revertida sola,
`restaurado: OK`:

| Pieza                     | Caen | Razón                                           |
| ------------------------- | ---- | ----------------------------------------------- |
| `armado-antes`            | 2    | la cuenta viva: `"2"` → `"skip"`                |
| `sin-red`                 | 5    | sin pregunta: `"skip"` → `"2"`                  |
| `sin-suspension`          | 2    | «Migrar» tras el borrado: `not "skip"`          |
| `sin-suspension-colision` | 1    | la pregunta propia de la colisión: `not "skip"` |
| `suspension-tarde`        | 5    | el motor dentro del inicio, y más               |
| `sin-reposicion`          | 1    | `"skip"` → `"2"`                                |
| `sin-reposicion-link`     | 1    | `"skip"` → `"2"`                                |
| `settlenull`              | 2    | `not "skip"`                                    |
| `bind`                    | 1    | `not "skip"`                                    |
| `linkuid`                 | 1    | `not "skip"`                                    |
| `motor`                   | 4    | `not "skip"`                                    |
| `asa`                     | 1    | `"skip"` → `"2"`                                |
| `ranura-unica`            | 1    | `"skip"` → `"2"`                                |

`suspension-tarde` suspende tras CUALQUIER inicio, no solo tras un «Migrar»: por eso tumba también los casos sin
pregunta. La prueba que la distingue es la del motor dentro del inicio.

`sin-suspension` quita los dos `migrates()`, y sus dos pruebas pasan por el primero. El de la colisión se podía
borrar con las 20 verdes (lo vio el asesor). La prueba 21 va por un almacén nunca reclamado (el link no pregunta,
pregunta la colisión), y la pieza `sin-suspension-colision` la tumba sola (`S155-piezas-colision.out.txt`).

**Vecinos.** `AuthContext.test.tsx`: los stubs del motor (`jest.fn()`) no tenían los dos métodos nuevos, y
tres pruebas de `deleteAccount` caían con `TypeError`. Llevan los dos métodos; 61 de 61. Las suites de
`AuthContext`, `SyncEngine` y `s15*`: verdes. eslint de `AuthContext.tsx`: 36 avisos, los mismos 36 de HEAD.
`tsc`: limpio. Suite entera: 384 suites y 4852 pruebas (la 154: 383 y 4832).

## 5. Sin medir, y lo que no cambió

- Todo, sin emulador.
- El skip sigue solo en memoria (`R9-255`): si el proceso muere entre el borrado y el inicio siguiente, la red no
  está. Igual que antes.
- El skip se vacía aunque su `setItem('skip')` falle. Igual que antes. (La 157: es `R9-597`; aquí decía `R9-260`, por error.)
- La red del borrado escribe `skip` también sobre una cuenta que ya tenía `'2'` (una cuenta vieja que entra sin
  pregunta): así se pierde su lista de reintento de `R9-257`. Es lo que hacía HEAD. Sin número.

## 6. Estado al cerrar el código

`fix/s155-r9-127` sobre `b82e1a4e`, con tres commits: `9757b8dc` (`R9-127`) y `d9f53ca0` (el comentario) y `667e0e25` (la prueba 21). Mergeada y pusheada
con el OK de Victor (2026-11-17): main = origin/main = `667e0e25`; el CI, verde (run 44029335282: 384 suites y 4853 pruebas,
la suite local más la prueba 21; `S155-ci.out.txt`). Sobre `667e0e25` (después del hook de eslint y prettier): `s155-skip-por-uid` y `AuthContext`, 82
de 82 (`S155-postcommit.out.txt`). Suite entera: 384 suites, 4852 pruebas, verdes (`S155-suite.out.txt`). Falta el cierre de docs: `_scratch/S155-CIERRE-PROMPT.md`.
