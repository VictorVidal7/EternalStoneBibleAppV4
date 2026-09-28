# Sesión 26 — `R9-124` medido en el SDK nativo (Modo C) y arreglado

**Fecha:** 2026-09-28. **Modo:** solo terminal. El crédito de la nube se terminó el 2026-09-24, así
que todo se hizo en el chat local, sin agentes. **Base:** `main` = `590b39c`, cuyo último código es
`cf7c715`. CI verificado en el log: run `36065139309`, 3 jobs verdes, 367/4405 y cero «failed to
run».

**Resultado:** `R9-124` quedó **CONFIRMADO en el SDK nativo de Android** y **ARREGLADO** en
`34de18f` (rama `fix/review-s26-removed`, sin mergear). Queda **1 P0 abierto**: `R9-38`.

---

## 1. La medición nativa (Modo C, con el OK de Victor)

**El entorno:**

- AVD `Pixel_9_Pro`, con el APK debug 3.2.61 / vc73 (`DEBUGGABLE`) que ya estaba instalado desde la
  sesión 20. Desde `47adfec` no cambió nada nativo: ni `package.json`, ni `app.json`, ni
  `android/`.
- El JS venía de Metro (`--dev-client`), sobre `590b39c`, con RNFirebase 26.2.0.
- **Nunca el teléfono de Victor.**

**La sonda:** es la receta de `R9-104` de la sesión 20.

- Una ruta temporal, `app/probe-r9124.tsx`, abierta por deep link (`eternalbible://probe-r9124`) con
  arranque en frío. No se commiteó y se borró al terminar. La copia está en
  `_scratch/S26-probe-r9124.tsx.txt`.
- Corre en una **instancia secundaria** de Firebase (`'r9124'`, con `databaseURL`), con su propio
  usuario anónimo, contra el proyecto de producción, bajo `users/<uid>/r9124probe/`.
- El listener usa `where('updatedAt', '>=', 500)`, igual que el del motor.
- La salida está en `_scratch/S26-sonda-nativa-r9124.out.txt`.

| #   | Escenario                                                 | Lo que llega al listener          | `getDoc` (default / caché / servidor)                       |
| --- | --------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| 0   | CONTROL: X, Y, Z y W con `updatedAt: 1000`                | 4 × `added`                       | —                                                           |
| A   | Mismo cliente, online: `set` de X con 100, merge          | **`removed`**                     | **existe**, con 100 en las tres                             |
| B   | Mismo cliente, offline: Y a 100; después `enableNetwork`  | **`removed`** (`fromCache: true`) | **existe** en caché; el servidor da `unavailable` (offline) |
| C   | Otro cliente: PATCH por REST de Z a 100 (token del dueño) | **`removed`**                     | **existe**, con 100 en las tres                             |
| D   | `delete()` de verdad de W                                 | `removed`                         | **no existe** en las tres                                   |

**Lo que dice:**

- **`R9-124` queda confirmado en nativo**, por los dos caminos: el eco del propio teléfono (el
  respaldo restaurado, online y offline) y la escritura del otro.
- **El `removed` trae SIEMPRE la versión VIEJA** (la última que casaba con la query) **y
  `exists: true`**, también en el borrado de verdad (D). La rama `|| !data` del motor nunca se
  dispara con el SDK real.
  - El contenido del cambio no distingue «salió del filtro» de «se borró»: solo lo distingue una
    lectura.
- **`getDoc` con la fuente por defecto responde bien en los dos modos:** online va al servidor y
  offline lee la caché, donde el doc está porque estaba en el conjunto del listener. Es el
  `collectionRef.doc(id).get()` que el wrapper ya tenía.
- **En B, al volver la red no llega nada más:** el doc no vuelve a entrar en la query.

**Limpieza, verificada desde fuera** con el token de firebase-tools y solo con lecturas
(`_scratch/S26-verif-limpieza.cjs.txt`, salida en `S26-verif-limpieza.out.txt`):

- la sonda borró sus 4 docs con el SDK del dueño y su cuenta anónima con `deleteUser`;
- la subcolección `r9124probe` está vacía y X, Y, Z y W dan 404;
- `accounts:lookup` no encuentra el uid (`hPlNbX7B9qh7StGx3cxhh9sRhSx2`).

Metro y el emulador quedaron apagados.

---

## 2. El arreglo (`34de18f`, rama `fix/review-s26-removed`)

Ante un `removed`, `handleSnapshot` lee el doc con `lookup`, que es `collectionRef.doc(id).get()`
pasado desde `attachListener`.

- **La lectura va FUERA de `withLocalWriteSuppressed`:** no escribe nada local, y así una edición de
  ese doc durante la lectura se sigue encolando. Después va su `isCurrent()` (`R9-153`).
- **Si el doc existe**, pasa por el camino normal (`applyRemoteChange`, retener o soltar, y el cursor)
  con sus datos de AHORA. Es exactamente lo que habría entregado un listener sin filtro, así que el
  filtro deja de cambiar resultados.
  - Con un conflicto pendiente, `applyRemoteChange` no toma nada (`R9-160`), y el doc queda retenido
    CON su marca, a su `updatedAt` nuevo.
  - Si queda retenido, el piso del próximo enganche baja hasta él y el doc vuelve. Esto cierra la
    parte de `R9-164` que tocaba al `removed` en vivo.
- **Si no existe**, se borra de local como antes, **salvo que el doc tenga un conflicto retenido**
  (`R9-160`: el doc no toma nada de la nube, tampoco un borrado). En los dos casos se suelta del
  conjunto, porque ya no puede volver.
- **Si la lectura falla**, no se toca lo local, se avisa (`logger.warn`) y se suelta del conjunto.

**Diferencia con lo pedido, acordada con Victor antes de empezar:** el pedido era «seguir
soltándolo aunque no lo borre» (`R9-164`). Si el doc existe, no se suelta a ciegas: soltarlo
borraría la marca en disco de un conflicto pendiente, y tras reiniciar ya no se volvería a detectar
(`R9-160`/`R9-65`). Se retiene o se suelta según lo que resulte de aplicarlo.

**El mock de `onSnapshot`** (`SyncEngine.test.ts`) ya no filtra en silencio:

- lleva el conjunto de resultados del listener. Un doc que estaba en él y deja de casar sale como
  `removed`, con sus datos VIEJOS, como en nativo; uno que nunca casó sigue sin verse;
- `doc(id).get()` responde con la «nube» del mock: lo último escrito, o «no existe» tras un
  `removed` disparado como borrado;
- `mockDelivered` registra lo que el listener entregó de verdad. Cada prueba lo usa como control
  del mecanismo: el `removed` tiene que haber llegado.

Con el mock nuevo y el motor viejo, **ninguna prueba vieja cayó**, así que ninguna codificaba el
bug. Pero ninguna lo miraba tampoco: el mock viejo sustituía la semántica del SDK.

---

## 3. Las pruebas y la matriz

**9 pruebas nuevas**, en la describe `R9-124 — un removed de la query filtrada no es un borrado`.
**Sin el arreglo caen 8.** La novena («un borrado de verdad sigue borrando») es una guarda que pasa
a propósito con y sin el arreglo: vigila que el arreglo no deje de borrar.

**Revert por pieza**, con un script de reemplazo exacto que corre la suite con
`NODE_ENV=development` y restaura (comparado con `cmp`). Script en
`_scratch/S26-matriz-reverts.cjs.txt`; salida en `S26-matriz-reverts.out.txt` y `-2.out.txt`.
El control da 0/141.

| Pieza revertida                                       | Caen |
| ----------------------------------------------------- | ---- |
| P1 «existe» se trata como borrado (el núcleo)         | 5    |
| P2 `isCurrent()` tras la lectura                      | 1    |
| P3 la lectura DENTRO de la supresión                  | 1    |
| P4 el borrado de verdad no mira el conflicto retenido | 1    |
| P5 una lectura fallida se trata como borrado          | 1    |
| P6 borrado o ilegible, sin soltarlo del conjunto      | 2    |
| P7 si existe, ignorarlo y soltarlo a ciegas           | 2    |
| P8 si existe, ignorarlo SIN soltarlo                  | 3    |

- La primera versión tenía una mitad más en la guarda de P4: los conflictos EN MEMORIA
  (`this.conflicts`). **No discriminaba (0 caídas), y es equivalente por construcción:** `R9-65`
  retiene cada conflicto con su marca en el mismo lote en que se registra, así que `isHeldConflict`
  ya lo cubre. Se quitó en vez de dejar una guarda que ninguna prueba puede vigilar, y P4 se volvió
  a medir sobre la versión final.
- P6 también la vigila una prueba VIEJA: «el piso se libera si un doc retenido desaparece de la nube
  (removed)», de `R9-39`.

**La matriz ENTERA de las guardas de sesión** de `handleSnapshot`, `applyRemoteChange` y
`saveUnsettled` (la lección de `R9-162`), re-medida con el arreglo puesto: **las 9 discriminan.**

| Guarda                                          | Caen | Quién la vigila                           |
| ----------------------------------------------- | ---- | ----------------------------------------- |
| G1 tras la lectura del `removed` (nueva, es P2) | 1    | `R9-124`, stop() durante la lectura       |
| G2 tras `applyRemoteDelete`                     | 1    | `R9-122.4`, borrado en vuelo              |
| G3 tras `applyRemoteChange`                     | 2    | `R9-162` (las dos)                        |
| G4 tras `saveUnsettled`                         | 1    | `R9-106`, conjunto bajo la clave de Ana   |
| G5 tras `advanceCursor`                         | 1    | «no le marca un sincronizado que no hizo» |
| G6 en el `catch` (`lastError`)                  | 1    | «un fallo del lote viejo no aparece»      |
| G7 en el `finally` (`isSyncing`)                | 1    | «no le apaga el isSyncing a Beto»         |
| G8 en `applyRemoteChange`, tras `getLocal`      | 3    | V1, V2 y V3 de `R9-153`                   |
| G9 en `saveUnsettled`, tras escribir            | 1    | `R9-106`, el guardado tardío              |

**`npm run validate`** con `NODE_ENV=development`: verde, 367 suites y **4414** pruebas (4405 + 9),
con 0 errores de lint (los 70 warnings son los de siempre; los dos archivos tocados no tienen
ninguno). El `SyncEngine.ts` commiteado es idéntico byte a byte al medido.

---

## 4. Lo que queda abierto (dicho, no arreglado)

- **`R9-164` sigue ABIERTO en sus dos disparadores con la app CERRADA.** El arreglo cubre solo la
  salida EN VIVO. Si el otro teléfono reescribe por debajo del piso un doc retenido mientras esta
  app está cerrada, no llega ningún `removed`, y el doc sigue clavando el piso. Lo mismo con los
  retenidos huérfanos de un `deleteAccount` fallido.
- **La divergencia de `R9-126` sigue.** Ahora el otro listener aplica el LWW en vez de borrar: si
  su copia local es más nueva, la conserva y no sube nada. La nube se queda con la versión vieja, y
  un dispositivo nuevo baja esa.
  - Lo mismo pasa tras reiniciar con un conflicto retenido que cayó por debajo del piso: vuelve a
    llegar, el LWW le da la razón a lo local, y el conflicto se disuelve sin que el usuario elija.
    Es el mismo `R9-126`, no un hallazgo nuevo.
- **Un borrado de verdad con un conflicto retenido** deja lo local y suelta el doc. Si la app se
  reinicia antes de resolver, el conflicto no vuelve y la copia local queda sin subir.
  - Solo hay dos borrados de verdad en la app: `deleteAccountData`, que es otro teléfono borrando
    la cuenta entera, y `cleanupOldReviewEvents`, sobre eventos de más de 12 meses. El primero
    invalida la sesión de todos modos. Queda anotado como límite, no como hallazgo.
- **Cuota:** una lectura más por cada `removed`. Es raro, salvo el caso de un conflicto retenido a
  su `updatedAt` nuevo: mientras no se resuelva, cada enganche relee desde ahí. Es el tope de cuota
  del piso de no asentados, que sigue siendo decisión de Victor.

---

## 5. Lecciones

- **El contenido de un `removed` no dice qué pasó.** El SDK entrega la última versión que casaba y
  `exists: true` también para un borrado de verdad. Antes de diseñar sobre «el cambio trae X»,
  medí qué trae en el SDK real: la rama `|| !data` del motor llevaba años sin poder dispararse.
- **Una guarda que ninguna prueba puede vigilar se mide antes de quedarse.** La mitad «en memoria»
  parecía defensa gratis; la matriz dijo que era equivalente por construcción, y se quitó.
- **«Nunca queda retenido para siempre» era cierto solo en vivo.** El arreglo cierra la mitad de
  `R9-164` que pasa por el listener. Las otras dos entradas del mismo hallazgo no pasan por él.
