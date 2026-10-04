# Sesión 54 — revisión del diff de la 53 (2026-10-03)

En un chat nuevo, solo en la terminal, sin agentes y sin tocar código, con
`_scratch/S54-PROMPT.md`. Revisa `cc005d2..a85df96`: los arreglos de `R9-260`..`R9-266`, y `R9-38`
(lo editado sin sesión) y `R9-59` (la Mesa por cuenta).

- **Rama:** `docs/review-s54-diff-s53` (solo el ledger), sin mergear hasta el OK de Victor.
- **Estado al empezar:** `main` = `origin/main` = `4807078` (el checkpoint de la 53, mergeado y
  pusheado; CI verde en el log, run `37163774992`, 371/4582). Los docs decían «sin mergear» para la
  53: se corrigió aquí. La base `S53-SyncEngine-R38.ts.txt` = el motor de `a85df96` (`cmp`).
- **Resultado:** 4 nuevos, `R9-269`..`R9-272`. **`R9-269` es P1 y lo abrió la 53** (la unión de
  la Mesa «sin cuenta» borra el trabajo del mismo pasaje); `R9-270` es P2 y también lo abrió la 53.
  No queda ningún P0 abierto; 272 hallazgos.

## 0. Cómo se midió

- Las sondas del motor, en `_scratch/S54-sondas.body.txt` (con `S38-sonda.cjs.txt`, cada una con
  su control en el mismo `it`); la salida, en `S54-sondas-hoy.out.txt` y
  `S54-duenofalla-hoy.out.txt`.
- Cada «¿lo abrió la 53?», con el motor de `3f73e50` (`S50-viejo.cjs.txt`,
  `S54-sondas-3f73e50.out.txt`).
- Las de la Mesa, con los stores reales y AsyncStorage real: `S54-prep.test.ts.txt`, que
  `S54-prep.cjs.txt` copia a `__tests__/`, corre y borra (`S54-prep-hoy.out.txt`).
- Las piezas de `stop()` de `R9-193` sobre una sonda nueva: `S54-rev193.cjs.txt`
  (`S54-r193-A.out.txt`, `S54-r193-B.out.txt`).
- Tras cada corrida: `cmp` contra la base, NUL 0 y `git status` limpio.

## 1. Las preguntas

### 1. `R9-38`, la cadena: ¿algo supone que `queueWrite` encola en el acto?

**No, en la app.** La cadena retiene escrituras de la sesión solo mientras se lee el dueño, y eso
pasa una vez por proceso: antes del primer `start()` (que lo dice) y con una escritura sin sesión
pendiente. AsyncStorage es un ejecutor serie (Android y iOS), y `start()` espera al menos una
lectura propia (la de la cola o la del contador de descartes) antes de enganchar listeners: la
lectura del dueño, pedida antes, vuelve antes, y la cadena se vacía en microtareas. Ningún
snapshot llega con la cadena llena, así que `hasQueuedWrite`, `noteOwnWrite`, `keepMine` y la
guarda de `R9-176` ven las entradas. Con el dueño ya conocido, la cadena es solo de microtareas.
Una sonda que retenga la lectura del dueño mientras `start()` engancha construiría un orden que
el ejecutor serie no produce; no se escribió.

### 2. `R9-38` con la cola ilegible sin sesión (`R9-212`)

**`R9-271` (P3).** Sin sesión, si la primera lectura de la cola falla, nadie relee: la edición
queda solo en memoria hasta la escritura siguiente o el `start()` siguiente. Con sesión, `start()`
relee en el acto.

- Medido (`COLA`): `sinSesionFalla` da 1 lectura, la entrada solo en memoria, el disco sin ella;
  si el proceso muere, la nube no la recibe nunca. `sinSesionSana` (CONTROL) y `conSesionFalla`
  (2 lecturas) la suben.
- Y la lectura fallida del DUEÑO (`DUENOFALLA`): esa edición no se encola nunca (local «primera»,
  nube nula), también cuando un `start()` del dueño llegó mientras se leía. La siguiente sí sube.
- **No lo abrió la 53:** con `3f73e50` no se encolaba ninguna edición sin sesión. Es lo que
  `R9-38` dejó sin cubrir.
- `persistQueue` con `uid` nulo escribe solo la cola (los sellos van con sesión), y la rendición
  de `R9-212` funciona igual: la relectura que una escritura espera, si falla, escribe desde
  memoria.

### 3. `R9-38` y el dueño en disco

**`R9-270` (P2, lo abrió la 53).** El marcador lo escribe solo `claimLocalStore`, después del
inicio de sesión, y se traga el fallo. Si no llega a disco (un `setItem` que falla, o el proceso
que muere entre el inicio de sesión y el claim), queda la cuenta anterior.

- Medido (`DUENO`): Beto entra con el marcador en Ana, cierra sesión, y en el proceso siguiente
  edita sin sesión. La edición se encola para Ana, y cuando Ana entra (su dueño en disco: no hay
  pregunta) sube a la nube de Ana: `nubeAna.b = "de beto sin sesion"`. En el mismo proceso iba a
  Beto (lo dice el `start()`). CONTROL (`claimSano`): a Beto, y la nube de Ana nula.
- Con `3f73e50`, nada se encolaba: la nube de Ana, nula en los dos casos.
- El comentario de `queueWrite` dice «No other account gets it».

### 4. `R9-38` con un `flush` en vuelo, y el conteo

**Sin hallazgo** (`VUELO`). La subida vieja de doc-x en vuelo, `stop()`, la misma doc editada sin
sesión («nuevo»), y vuelve el ack: la entrada nueva es otro objeto (`R9-11`), así que sobrevive
al ack; en el disco queda «nuevo», y sube al volver la cuenta (en el mismo proceso y tras
reiniciar). El conteo al volver el dueño cuenta la entrada (`pendientes: 1` tras reiniciar). El
CONTROL, sin la edición, deja «viejo».

### 5. `R9-59` y el tick de auth del arranque en frío

**Sin hallazgo, por lectura.** RNFirebase toma el usuario restaurado de `APP_USER` al construir
`auth`, y el primer `onAuthStateChanged` lo trae (`@react-native-firebase/auth/lib/index.ts`): una
cuenta de Google no pasa por nulo ni por anónimo al arrancar. Hasta ese primer estado, las claves
esperan (`managePrepAccount` al montar `AuthProvider`). Después de cerrar sesión, nulo y anónimo
dan la Mesa «sin cuenta», como se decidió.

### 6. `R9-59`, la unión

**`R9-269` (P1, lo abrió la 53).** `joinPrep` hace `{...source, ...target}` por entrada y después
borra la clave de origen: en un pasaje que está en las dos Mesas, la entrada «sin cuenta» se
pierde entera.

- Medido (`UNION`, stores reales): Ana tiene `John/3/16-21` con una sección; cierra sesión y
  escribe en la Mesa «sin cuenta» ese pasaje (una versión nueva de la sección y otra sección);
  vuelve a entrar. Su Mesa queda con la versión vieja sola, y la clave «sin cuenta» ya no existe.
  CONTROL (`otroPasaje`): las dos entradas quedan.
- Disparadores: la misma cuenta que vuelve (sin pregunta), otra que responde «Migrar», y un
  respaldo restaurado sin sesión (va a la Mesa «sin cuenta»: lo restaurado del mismo pasaje se
  borra al entrar). Y al revés, `releasePrepAccount` al borrar la cuenta: gana la «sin cuenta».
- El comentario de `prepAccount.ts` dice «A join keeps both maps», y la regla de Victor, «cerrar
  sesión no borra nada».
- **Además (`CARRERA`):** una escritura de la Mesa «sin cuenta» que cae entre las lecturas de la
  unión y su `multiRemove` se borra con la clave. Por la interfaz no se ve alcanzable (la unión
  corre durante el inicio de sesión), y una que cae después de la unión y antes de
  `setPrepAccount` queda en la «sin cuenta», viva.

### 7. `R9-262`: la lápida que espera mucho

**Sin hallazgo, por lectura.** Es el coste de `R9-39`: el doc retenido mantiene el piso mientras
la lápida espera, y cada enganche lo vuelve a leer (sin red, de la caché, sin lecturas cobradas).
No llega a `R9-164` (retenido para siempre): la entrada sale de la cola por el ack (su eco
entrega el doc), por el descarte tras los rechazos (la reversión lo entrega), o reemplazada por
otra escritura (su eco); y una lápida tomada después de un `stop()` es una escritura más nueva que
el piso, que el enganche siguiente trae. La prueba `sana` de la 53 mide la salida.

### 8. `R9-263`: el flag ilegible siempre

**Sin hallazgo** (`FLAG`). Con la lectura del flag fallando siempre, tres arranques no suben nada
(y el flag sigue nulo); con un fallo, el segundo arranque sube. En Android, un `getItem` falla
siempre solo por el tamaño de la fila (la `CursorWindow`), y el flag es chico; si falla por otra
cosa, falla toda la base, y con ella la cola. Es lo que la 53 escribió.

### 9. Las dos pruebas de `R9-193` que cambió la 53

**`R9-272` (P3, comentario).** Siguen tumbando sus piezas, pero el porqué de su comentario es
medio falso.

- El comentario: «Desde R9-38, `queueWrite` la encola para el dueño del almacén, y su entrada
  decidiría antes que el sello de L1».
- Medido (`R193`, con L2 encolada como hoy la encola la app, y las piezas de `S53-rev193`): con la
  pieza A (`stop()` no anota la subida en vuelo), «lo mío contra lo mío» aparece igual con la
  entrada en cola: decide el sello. Con la pieza B (`stop()` no escribe los sellos), no aparece:
  la entrada lleva el sello (`R9-217`/`R9-226`).
- Lo que construyen (L2 fuera de la cola tras una sesión) no lo produce la app en el mismo
  proceso: el `start()` deja el dueño conocido. Sí en un proceso nuevo sin dueño (`R9-270`,
  `R9-271`), con los sellos en disco, que es lo que vigila B. Su final (local L2, nube L1, cola
  vacía) es ese caso.

### 10. La matriz, y los comentarios nuevos caso por caso

- `S53-comparar.cjs.txt` sobre `S44-matriz-s53-3f73e50.out.txt` y `-a85df96`: 157 de 157 iguales.
- Los comentarios, uno por uno:
  - `queueWrite`: falso «No other account gets it» con el marcador viejo (`R9-270`); «it goes up
    when that account starts again», con una lectura fallida no (`R9-271`).
  - `loadStoreOwner`, «read again on the next write»: cierto, pero la escritura de esa lectura
    se pierde, también si un `start()` dijo el dueño mientras se leía (`R9-271`).
  - `prepAccount.ts`, «A join keeps both maps»: falso en la misma entrada (`R9-269`).
  - Las dos pruebas de `R9-193`: `R9-272`.
  - Bien: `enqueue` (la cadena), `queueFor` (la hidratación sin sesión), `forgetStoreOwner`,
    `localStoreOwner.ts` (un uid de Firebase no tiene paréntesis), `instance.ts`,
    `BackupService.ts`, `R9-262`, `R9-263` (comprobado con `FLAG`), y las pruebas de `R9-38`
    («sin R9-38 las tres notas no subían»: con `3f73e50`, `nubeZ` nula).

## 2. Los nuevos

- **`R9-269` (P1):** la unión de la Mesa «sin cuenta» borra el trabajo del mismo pasaje.
- **`R9-270` (P2):** con el marcador del dueño viejo, lo editado sin sesión sube a la cuenta
  anterior.
- **`R9-271` (P3):** sin sesión, una lectura fallida (la de la cola o la del dueño) deja la edición
  sin subir.
- **`R9-272` (P3):** el comentario de las dos pruebas de `R9-193`.

## 3. Las lecciones

- **Una unión que dice «gana la de la cuenta» pregunta qué pasa con la que pierde.** `joinPrep`
  borraba la clave de origen entera, también la entrada que no ganó: «cerrar sesión no borra
  nada» se cumplía al cerrar y se rompía al volver a entrar.
- **Un marcador escrito por otro, después, y tragándose el fallo, puede decir la cuenta
  anterior.** El motor usa lo que diga el `start()` en el proceso, y en el siguiente, el disco.
- **Una ventana sin sesión no tiene quien relea.** Con sesión, `start()` relee la cola; sin ella,
  la edición espera a la próxima escritura.
