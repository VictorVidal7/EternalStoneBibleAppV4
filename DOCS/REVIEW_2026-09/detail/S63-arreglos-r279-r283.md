# Sesión 63 — arreglos de lo de la 62 (2026-10-06)

En un chat nuevo, en la terminal, con `_scratch/S63-PROMPT.md`. Victor pidió «modo solo terminal, sin
agentes», y en el mismo mensaje «Mejor sí manda 3 agentes»: 3 agentes en worktree que **solo
midieron** (la regla de las sesiones de arreglos). El código lo escribió el orquestador, un commit
por hallazgo.

- **Estado al empezar:** `main` = `origin/main` = `8d041c9` (el checkpoint de la 62, mergeado y
  pusheado con el OK de Victor; CI verde en el log en la 62, run `37503705122`). Varios docs decían
  «sin mergear» para la 62: corregido aquí.
- **Ramas:** `fix/s63-mazo-r279-r283` (el código) y `docs/review-s63-fix` (el ledger, encima), sin
  mergear hasta el OK de Victor.
- **Resultado:** 6 cerrados (`R9-283`, `R9-279`, `R9-280`, `R9-281`, `R9-278` para el mazo,
  `R9-282`) y 2 nuevos P3 (`R9-284`, `R9-285`). Quedan 285 hallazgos, ningún P0.

## 0. Los agentes

Cada uno en su worktree desde `8d041c9`, con el modelo serie de `S62a3-orden` y el provider real.
Los tres completaron sin cortes (unos 210, 236 y 261 mil tokens; 9 a 13 minutos).

| Agente          | Pregunta                                      | Informe                    | Sondas                 |
| --------------- | --------------------------------------------- | -------------------------- | ---------------------- |
| 1, alta         | `R9-279` («agregar si falta») y `R9-282`      | `_scratch/S63-agente-1.md` | `S63-sondas-agente-1/` |
| 2, salida       | `R9-280` (render, sin rendirse, plazo, fondo) | `_scratch/S63-agente-2.md` | `S63-sondas-agente-2/` |
| 3, aviso previo | `R9-281` + `R9-278`, y los otros tres         | `_scratch/S63-agente-3.md` | `S63-sondas-agente-3/` |

Mientras medían, el orquestador hizo `R9-283` (las pruebas) en el árbol principal.

## 1. `R9-283` primero: las pruebas en orden serie (`1c82327`)

- **El modelo:** toda operación de `@memory_deck` en `memoryDeckDisk.test.tsx` pasa por una cola
  serie (`enSerie`): corre cuando terminó la anterior, en el orden en que se pidió, y llega después
  de la anterior. Una puerta demora cuando CORRE, y lo de detrás espera. El disco se mira sin pasar
  por la cola (`__INTERNAL_MOCK_STORAGE__`).
- **La 12, reescrita en orden serie, cayó con el árbol de hoy** mostrando `R9-281` (queda Mark/1/1
  solo). Quedó como `it.failing` hasta su arreglo, para que cada commit quede verde.
- **La 6** («dos cargas en vuelo» en el montaje) no puede ocurrir. Se reescribió con las dos que sí:
  la relectura y la recarga del respaldo.
- **`nueva` quedó en 0** en orden serie: solo la vigilaba la 12 con su orden imposible. Se agregó
  su caso posible (la relectura falla con la recarga ya pedida); desde `R9-281`, la vigila la 12.
- **Nuevas:** una por escritor que pasa por `edit` (`applyRemoteUpsert`, `applyRemoteDelete`,
  `removeCard`, `resetDeck`: escribir, otra edición, disco y `getLocal`), la salida (lo editado
  después llega al disco y `getLocal` responde) y lecturas que fallan siempre sin edición (vigila
  `vacio`: sin ella, `{}` en disco, el daño de `R9-267`). La 3 ya no acepta «lanza» como repaso.
- **Un cuelgue que parecía una matriz entera roja:** la primera versión de la prueba de `ultima`
  hacía `await` de la escritura del respaldo, que con `vacio` revertida quedaba detrás de una
  lectura con puerta. La prueba se colgó 20 s y las siguientes del archivo cayeron todas («Can't
  access .root on unmounted test renderer»): 13 caídas que eran una. Se cambió el `await` por una
  bandera de control (la regla de la 57).
- **Comentarios:** el del JSON ilegible (desde la 61 queda lo de memoria), el de la carga más
  nueva, el de `deckLoad` tras rendirse, y el de `R9-174` en `SyncEngine.ts`. Este último es solo
  comentario: `cmp` contra `S55-SyncEngine-R271.ts.txt` antes (igual), NUL 0, y el JS emitido sin
  comentarios idéntico al de `HEAD` (`_scratch/S63-motor-igual.cjs.txt`). Ninguna pieza de la
  matriz del motor ancla en esas líneas.
- **`unread.current = false` en la salida, quitada:** su revert no tumbaba nada, y es muerta por
  construcción (la salida corre solo en la última carga, y después de soltar `unsaved` nadie lee
  `unread` hasta que la carga siguiente lo reinicia).

## 2. `R9-279`: «agregar si falta» (`6ed063c`)

El diseño del agente 1, con dos cambios del orquestador:

- **El alta es condicional** si no hay carga que haya leído (`unsaved` vivo) **y nada en `unsaved`
  dice qué fue de esa tarjeta**. Sin el segundo término, un alta tras una baja de verdad durante la
  recarga del respaldo quedaba condicional: la recarga se quedaba con la restaurada, y la lápida ya
  había salido a la nube (pieza `sabe`).
- **La salida de `R9-267` no encola las condicionales** (el agente lo dejó a decidir). Con las
  lecturas fallando siempre, la nube puede ser la única copia de sus repasos, y el usuario re-agrega
  justo los versículos que recuerda: subirlos la pisaría. Una tarjeta nueva de verdad sube con su
  primer repaso. La prueba lo mira (pieza `rindeSube`), y también que la salida vacíe la marca
  (`limpia`: sin eso, el primer repaso tampoco subía).
- Lo demás, como lo midió el agente: `removeCard` y `resetDeck` retiran el alta sin lápida, un
  repaso sigue condicional, una edición de verdad le quita la marca, y solo la carga que suelta
  `unsaved` encola las que faltaban.
- **Coste aceptado:** un repaso de una condicional que el disco tenía se descarta, y su evento ya
  quedó en SQLite (`addReviewEvent`). La ventana es lo que tarda una lectura.

## 3. `R9-280`: una salida que no depende de otra edición (`07b6c56`)

- **La opción del agente 2 (a1):** cuando falla una carga que no es la relectura del propio efecto,
  un render forzado; el efecto relee lo editado, y se rinde solo si esa lectura también falla.
- **Lo que midió el agente:** un render que relee pero no se rinde no tiene salida (viola
  `R9-212`); un plazo necesita un `clearTimeout` y relee tras desmontar; `AppState` `background`
  deja la edición solo en memoria hasta entonces. **Con un fallo determinista, toda opción con salida
  escribe el mazo de antes encima de lo restaurado; solo cambia cuándo.**
- **Pruebas:** una nueva (cae con `forzar`), y la de la salida cuenta escrituras (cae con
  `releeSola`: el render forzado también en la relectura del efecto escribe dos veces).

## 4. `R9-281` + `R9-278`: el respaldo avisa antes de escribir (`01eee54`)

El candidato v2 del agente 3, con un ajuste:

- **`restoreSignal`:** `subscribeBackupRestoring` / `emitBackupRestoring`, sobre otro `Set`.
- **`importBackup`:** el aviso de inicio justo antes del `multiSet` (después de la transacción de
  SQLite: emitirlo antes alargaría la retención y obligaría a cubrir una transacción que falla), y
  el aviso de fin en un `finally`. Sin él, si el push a sync lanzaba tras el `multiSet`, ningún
  provider recibía aviso.
- **El mazo, al aviso de inicio:** `loadSeq++` (la recarga es la carga más nueva: una en vuelo ni
  suelta lo editado ni se rinde), `unsaved ??= new Map()` (retiene), `unread = false` (no empieza
  relecturas: una pedida antes del `multiSet` lo escribiría y el respaldo lo reemplazaría) y
  `deckLoad` espera a la recarga (el motor juzga una copia remota contra lo restaurado).
- **El ajuste:** la promesa de `deckLoad` se crea solo si no hay otra pendiente. Dos respaldos a la
  vez dejarían una huérfana y trabarían el `getLocal` de `memoryCards` (la UI no lo permite).
- **Dos pruebas de `R9-277` cambiaron de orden:** pedían la escritura del respaldo antes del alta,
  y con el aviso el alta ya no relee. Lo mostró su control (2 lecturas en vez de 3). Se reordenaron
  al orden que el aviso deja posible (el alta primero), y siguen tumbando sus piezas.
- **Pruebas:** en `memoryDeckDisk.test.tsx` (un alta y una copia remota durante la escritura; un
  alta con el aviso dado y la escritura sin pedir, como cuando la Mesa tiene el turno) y en
  `backupRestoreSignal.test.ts` (nuevo, con el `importBackup` real: los dos avisos, y el de fin
  cuando el push lanza).

## 5. `R9-282` (`a95a68b`)

La hipótesis: `if (deckRef.current[id] || unsaved.current) edit({[id]: null})`. Dos pruebas (en
frío y tras una lectura fallida); la pieza tumba las dos.

## 6. Las piezas y la matriz

- **`_scratch/S63-rev.cjs.txt`** (piezas en `S63-piezas.cjs.txt`, anclas únicas; una pieza puede
  llevar otro archivo y otra prueba). Tras cada arreglo, el archivo entero y las piezas anteriores.
- **En el árbol final, las 45 caen cada una con al menos una prueba**
  (`S63-rev-final-todas.out.txt`): las 11 de la 61, las 6 de `R9-283`, las 13 de `R9-279`, las 2 de
  `R9-280`, `r282`, las 6 de `R9-281`/`R9-278`, y los commits enteros.
- **Las pruebas de `R9-264` y `R9-28`** (`memoryDeckPullAllLocal`, `MemoryDeckContext`) y las del
  respaldo (`backupServiceImport`, `backupPrepTurn`), re-corridas tras cada arreglo: verdes.
- **Anclas de varias líneas:** al agregar el parámetro de `hydrateFromStorage`, prettier sangró la
  función dos espacios más. Las anclas de una línea siguieron casando como subcadena; las de varias
  no (el script avisa `ERROR ancla … 0 veces` y sigue). Se corrigieron.
- **La matriz del motor** (la de la 44, en un worktree aparte, `C:/projects/essb-s63-matriz`,
  borrado al terminar con `.Delete()` sobre su junction primero): `S44-matriz-s63-a95a68b.out.txt`,
  comparada con la de `50f209d` (`S53-comparar.cjs.txt`): las 157 piezas dan lo mismo (control: 0
  de 285).
- **`npm run validate`** entero con `NODE_ENV=development`: verde, 374 suites / 4625 pruebas
  (`_scratch/S63-validate.out.txt`).

## 7. Nuevos

- **`R9-284` (P3):** los otros tres providers que escuchan la señal (progreso de lectura, planes,
  preferencias) tienen la forma de `R9-278`. Medido en el progreso de lectura por el agente 3. El
  aviso de inicio ya existe: sumarlos cuesta un `holding` cada uno.
- **`R9-285` (P3):** con el mazo sin leer, el aviso de `handleAddVerses` cuenta como nuevos
  versículos que ya estaban en el disco. Solo de pantalla; verificado a mano.

## 8. Las lecciones

- **Un arreglo que agrega un aviso previo cambia qué órdenes son posibles.** Dos pruebas pedían la
  escritura del respaldo antes de que el alta pidiera su relectura. Con el aviso, el alta ya no
  relee, y la prueba habría pasado por la razón trivial si no tuviera control. Antes de dar por
  buena una prueba tras un arreglo de orden, mirá que su control siga construyendo el caso.
- **Una prueba colgada contamina las siguientes del archivo.** Una matriz con muchas caídas de
  golpe puede ser un solo cuelgue: mirá la duración de cada prueba antes de leer las caídas.
- **Medí después de formatear.** Prettier puede cambiar la sangría de un bloque entero, y las anclas
  de varias líneas dejan de casar.

## 9. Lo que no se hizo

- No se midió en el teléfono (ni la carga del montaje ni el respaldo).
- `R9-284` y `R9-285`, registrados sin arreglar.
- Lo pendiente de siempre (§4 de `CONTINUAR.md`).
