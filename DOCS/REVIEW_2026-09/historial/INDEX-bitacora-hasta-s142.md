# Historial — `INDEX.md`: la bitácora de sesiones, de la 1 a la 141

> Movido tal cual desde `INDEX.md` en la sesión 143 (2026-11-12). **No rige: es registro.** Lo que rige está en
> `CONTINUAR.md`, `REGLAS.md`, `RECETAS.md` y `ESTADO.tsv`.

## Bitácora de sesiones

- **Sesión 1 — 2026-09-03.** Solo inventario (charter §5). Verificado el estado de git
  (`main` = `origin/main` = `f9d6b27`, árbol limpio, 6 ramas locales). Creado este
  índice con 137 filas (A 46 · B 10 · C 71 · D 10) y `BUGS.md`. Hallazgo colateral: la
  semilla BUG-10 del charter estaba obsoleta — ya está arreglada en `b17ec99`. Nada
  revisado. Siguiente: fila `A1` (o `B1` si se prefiere empezar por lo barato).
- **Sesión 2 — 2026-09-03.** Modo B. **Cerrado el bloque P0 entero** (`B1`, `B1b`,
  `B2`–`B5`) → `R9-1`..`R9-8`, **ninguno un bug de la app**: son propuestas de
  endurecimiento. Resultado limpio: **0 vulnerabilidades alcanzables**, **0 secretos
  filtrados jamás** (5558/5558 blobs del historial), **0 paths abiertos** en las reglas de
  Firestore. Commits `2f32aa9` (el bloque), `8b64c11` (`CONTINUAR.md` + correcciones al
  charter) y `af64ce1` (`R9-7` **RESUELTO**: `functions/` no se despliega a propósito —
  plan Blaze—, y ahora está documentado).
- **Sesión 3 — 2026-09-03.** Modo A. **6 filas cerradas** (`A1`, `A5` por el
  orquestador; `A2`, `A3`, `A6`, `A7` por fan-out de agentes en worktree) → **24 hallazgos
  `R9-9`..`R9-32`, 9 de ellos P0.** `A1` y `A5` se verificaron con **sondas ejecutables**
  en `_scratch/`, no solo por lectura; de los hallazgos de agentes, el orquestador
  **re-verificó a mano** los portantes de `R9-13`, `R9-22`, `R9-24`, `R9-27` y `R9-28`, y
  corrigió dos imprecisiones del informe de `A6`. Un primer fan-out de 11 agentes se
  abortó por límite de uso sin escribir nada (sin progreso perdido); el segundo, de 4,
  salió completo. Corregida en el índice la ruta de `BackupService` (`src/services/`, no
  `src/lib/backup/`). **Patrón que atraviesa la sesión:** las tres compuertas verdes
  (`tsc`, jest, CI) comparten puntos ciegos —resolución por plataforma, y la dirección
  "quitar acceso"/"restaurar"— y ahí es donde estaban casi todos los P0.
- **Sesión 4 — 2026-09-03.** Modo A, fila `A4` (`SyncEngine`). Se leyó el módulo entero
  más sus 12 archivos satélite y se montó una **sonda ejecutable** de 7 casos en
  `_scratch/`. **Se cortó a mitad del checkpoint:** escribió `detail/A4-syncengine.md`
  pero **no** la fila del índice ni las entradas de `BUGS.md`, así que el índice dijo
  `A4 · PENDIENTE` durante 4 días teniendo el detalle escrito. De ahí sale la regla de
  "checkpoint COMPLETO o fila en `EN CURSO`" del §5 de `CONTINUAR.md`.
- **Sesión 5 — 2026-09-07.** Cierre de `A4` + campo. En vez de creerle al informe
  heredado, se **corrió su sonda contra el `SyncEngine` real: 7/7 pasan** y los números
  coinciden al dígito; además se re-verificaron a mano los 5 `grep` portantes, y los 5 se
  sostuvieron. Eso convirtió 7 afirmaciones en 7 hechos → `R9-33`..`R9-39` (**6 P0**),
  entre ellos `R9-33` (una escritura se **descarta en silencio** tras 8 reintentos sin
  espera mientras Ajustes dice «sincronizado») y `R9-35` (un `updatedAt` **en el futuro**
  detiene la bajada para siempre). La sonda se sacó de la suite renombrándola a
  `_scratch/a4probe.ts.txt` — estuvo 4 días dentro de `npm test` sin aparecer en
  `git status`. A mitad del cierre Victor mandó **5 capturas del OnePlus**; atenderlas
  primero (regla de preempción) dio 4 hallazgos de campo más,
  `R9-40`..`R9-43` → `detail/CAMPO-victor-2026-09-07.md`. Ninguno P0.
- **Sesión 6 — 2026-09-14.** Modo A. Arranque: cerrada la incoherencia que dejó la sesión 4
  (fila `A4`, frontera, y bitácora de las sesiones 2, 4 y 5 — la 2 **también** faltaba).
  Después, **fan-out de 4 agentes en worktree** sobre `A8`, `A9`, `A10` y `A11`, las 4
  cerradas → **21 hallazgos `R9-44`..`R9-64`, 6 de ellos P0**, con lo que el bloque P0 del
  Modo A queda a **una sola fila** de cerrarse. **Los 4 agentes probaron sus hallazgos
  portantes con sondas ejecutables** contra el código real, no por lectura — el patrón que
  la sesión 5 había convertido en regla se aplicó por defecto y rindió: 19 de los 21
  hallazgos tienen sonda. En la **segunda mitad de la sesión** se pagó la deuda de
  verificación: **los 6 P0 nuevos re-verificados a mano, y los 6 se sostienen**, con 3
  correcciones y 2 refuerzos. **La corrección que importa es `R9-46`:** su defecto es real,
  pero el mecanismo de alcanzabilidad que daba el informe ("los efectos de React corren de
  hijo a padre, así que el motor arranca antes que la BD") **era falso** — `engine.start()`
  vive en un efecto gated por auth, no de orden de montaje. Lo cierto y **peor** es que no
  hay **ningún** orden garantizado entre `database.initialize()` y el motor, y la ventana es
  más ancha **en una reinstalación**, justo cuando baja el grueso de las notas remotas. Caso
  de manual de por qué existe esa regla. **Los P1/P2 (`R9-50`..`R9-64`) siguen sin
  re-verificar.** `A12` se empezó en el árbol principal y quedó **`EN CURSO` con 3 hilos
  abiertos**, porque Victor pidió a mitad de camino bajar el ritmo para no agotar el límite
  de uso.
  **Tres cosas que cambian el mapa, más allá de los bugs sueltos:** (a) una **raíz común**
  detrás de `R9-44`/`R9-45`/`R9-50` — `pushOne` escribe con `{merge:true}`, y bajo merge un
  campo opcional es **imposible de desasignar por sync**, así que toda omisión local se
  vuelve divergencia permanente con la nube; (b) **la suite es ciega al DST** (cuarto punto
  ciego, ver arriba); (c) **la racha y el progreso de lectura no viajan entre dispositivos**,
  y el anzuelo de inicio de sesión promete lo contrario. Y una nota agridulce: **ninguno de
  los ~4027 tests escribe jamás en un campo de nota de la Mesa**, lo que explica por qué
  `R9-47` llevaba ahí sin verse.
- **Sesión 7 — 2026-09-14. La primera de ARREGLOS, no de revisión.** Otro protocolo: sí se
  toca código de la app, en rama (`fix/review-p0-perdida-datos`) y con los gates en verde.
  **7 P0 de pérdida irreversible de datos cerrados** en `7f8e666`, cada uno con prueba de
  regresión: `R9-49` + `R9-27` + `R9-28` (el respaldo ya no puede borrar lo que no trae, y
  lo restaurado ya no lo pisa el estado en memoria), `R9-47` (la Mesa: la prosa solo se
  archiva bajo su propio pasaje, y un `onBlur` ya no puede borrar un sermón) y
  `R9-44`/`R9-45`/`R9-50` atacados **juntos por su raíz**, como recomendaba `CONTINUAR.md`.
  **Lo que más vale del arreglo, para lo que venga:** `withoutUndefined` →
  **`nullifyUndefined`**. Descartar la clave contentaba a Firestore pero, bajo
  `{merge:true}`, una clave ausente significa «conserva lo del servidor» — por eso un campo
  opcional era imposible de desasignar por sync. Mandar `null` explícito satisface a
  Firestore **y** pisa. Se conservó `{merge:true}` a propósito: protege un campo escrito por
  una versión más nueva de la app en otro dispositivo. No hubo que tocar ningún lector
  porque `valuesEqual` ya equiparaba `null` y `undefined`, así que tampoco aparecen
  conflictos fantasma.
  **Tres lecciones de método, todas pagadas en esta sesión:**
  (a) **Una prueba nueva no vale nada hasta que la ves fallar sin el arreglo.** Las tres
  primeras pruebas de `R9-47` pasaban igual con el código roto: una porque el re-render no
  llegaba a aplicarse, otra porque `setSectionNote` ya borra una sección vacía. Reescritas
  contra el mecanismo real (otra pantalla escribe prosa mientras esta sigue montada), la
  primera **sí** falla sin el arreglo.
  (b) **react-test-renderer no aguanta re-renderizar una pantalla del tamaño de la Mesa**:
  desmonta el árbol con «Unable to locate attached view in the native tree» (el `Animated`
  interno de cada `TouchableOpacity`). La carrera del stepper de `R9-47` **no** es testeable
  aquí; sigue siendo verificación en dispositivo, Modo C.
  (c) **`python - <<'EOF'` no persiste las escrituras a `src/i18n/translations.ts`** (falla
  en silencio, con el `print` de éxito y todo). Para ese archivo, usar la herramienta de
  edición. Para los demás funcionó sin problema.
  **Quedan 14 P0.** Los que más pesan: `R9-22`/`R9-23`/`R9-48` (mezcla entre cuentas) y
  `R9-33`/`R9-35` (sync que descarta en silencio). `A12` sigue `EN CURSO`.
- **Sesión 8 — 2026-09-15. Revisar el diff ajeno, mergear, y cerrar la mezcla entre
  cuentas.** Victor pidió que un chat nuevo revisara con ojo fresco el diff de la sesión 7
  antes de mergearlo. Veredicto: sin defectos bloqueantes → **mergeado en fast-forward y
  pusheado** (`63f124c..8fe24f1`). Lo verificado a mano está en `detail/S8-revision-del-diff.md`
  (cinco cosas que **no** hay que re-comprobar). Después, **4 P0 más arreglados** en
  `fix/review-p0-notas-cuentas`: `R9-46` (el `getLocal` de notas dejó de fallar abierto) y el
  **bloque entero de mezcla entre cuentas** — `R9-22` (la cola se namespacea por uid), `R9-48`
  (el log de repasos deja de contaminar la cuenta ajena) y `R9-23` (una cuenta nueva ya no
  hereda en silencio el almacén ajeno). **Lo que más vale de la sesión:** la revisión descubrió
  que **el ledger mentía** sobre tener prueba de regresión (dos arreglos no la tenían), y que
  **el arreglo de `R9-22` había introducido un bucle caliente infinito** que solo cazó la
  prueba nueva. **Quedan 10 P0.**
- **Sesión 9 — 2026-09-15. Revisar el diff de la 8, arreglar lo que salió, mergear.** Mismo
  protocolo, un nivel más arriba. **Dos defectos reales en los arreglos de la sesión 8**, los
  dos de la **misma clase: el arreglo cierra el caso que su prueba cubre y deja abierto el
  vecino.** (a) `R9-46` retiraba del cursor el doc saltado, pero `handleSnapshot` guarda **un
  solo** `maxSeenUpdatedAt` por lote, así que un hermano más nuevo **del mismo lote**
  arrastraba el piso por delante del saltado y el siguiente reattach ya no lo entregaba
  (medido: piso `8_700_000` sobre un saltado en `1_000_000`). (b) `R9-48` colocaba el traspaso
  del log **debajo** de la guarda `if (existing != null) return;`, y `signOut` dispara
  `clearMemoryStatsFloor()` sin esperarlo (`void`) — con el suelo ajeno en disco, el traspaso
  **no corría nunca más**, porque nada lo reintenta. Arreglados en `3e780c6` y `29a9449`, cada
  uno con prueba vista fallar primero. **Detalle completo, incluido lo que se comprobó y está
  BIEN y lo que se decidió NO tocar: `detail/S9-revision-del-diff.md`.**
  **La lección de método, que ya va por su tercera sesión seguida:** el diff de una sesión de
  arreglos **merece la misma revisión adversarial que el código original** — la sesión 8 cazó
  un bucle infinito en el arreglo de la 7, y la 9 cazó dos pérdidas de datos en los de la 8.
  Ningún arreglo llegó a `main` sin que otro par de ojos lo rompiera primero.
  **Un hallazgo colateral:** `R9-65` (P1, **preexistente en `main`**) — el mismo fallo de
  cursor por la rama de **conflictos**, que además no sobreviven a un reinicio porque `stop()`
  limpia `this.conflicts`. Se arregla con una línea, pero es bug de `main` y merece su propia
  decisión. **Y una corrección de higiene del ledger: la sesión 8 nunca actualizó `INDEX.md`**
  (seguía diciendo «Quedan 14 P0»), justo el archivo que `CONTINUAR.md` manda leer sin
  re-derivar. Arreglado aquí.
  **Segunda mitad: ARREGLOS.** Cerrados `R9-33` (no había backoff **y** el descarte era mudo:
  al tirar la última entrada `pendingWrites` caía a 0 y Ajustes decía «Sincronizado hace un
  momento» en ese mismo instante), `R9-34` (la rama de error hacía retroceder la cola entera
  sobre una reedición en vuelo) y `R9-35` (un `updatedAt` en el futuro paraba la bajada para
  siempre; hizo falta **techo + descarte del cursor envenenado**, porque topar no recupera lo
  que la ventana escondió). Más un remate de `R9-22`: `pendingWrites` no se recalculaba al
  cambiar de cuenta. 7 pruebas, las 7 vistas fallar primero — **una no discriminaba y hubo
  que arreglarla**. **Dos correcciones a lo que esta misma sesión había afirmado antes:**
  `pendingWrites` **sí** tiene consumidor (`app/(tabs)/settings.tsx:87` — un `grep` acotado a
  `src/` no ve las pantallas), y **el conteo de P0 venía mal desde la sesión 7** porque
  contaba `R9-50`, que vive en P1: eran 11 abiertos, no 10.

- **Sesión 13 — 2026-09-15. Revisar el diff de la 12 (el bloque WEB), ya mergeado.** Quinta
  sesión seguida de revisión adversarial sobre un diff de arreglos, y la quinta que paga. 6
  commits, 19 archivos — el diff más ancho del programa, y el único que toca **datos ya
  publicados**. **Veredicto: los tres arreglos se sostienen.** Verificado revirtiendo cada uno
  con el `diff` del revert a la vista: quitar el `export` de `hasRedLetterData` → 1 falla;
  quitar el `<ErrorBoundary>` del `Slot` → 4; quitar **solo** `key={pathname}` → exactamente 1
  (la de «no se enclava»); re-hardcodear `'WEB'` en la pantalla → 1; quitar `RVR1960` de
  `RED_LETTER_PACKS` → 6. **Los 5 defectos están en los BORDES**: `R9-66` (la verificación de
  spans del build pasaba en vacío — probado ejecutándola con `[]`, que imprime «ALL slices
  non-blank and in-range» y deja escribir un pack de 2 bytes al manifiesto), `R9-67` (la
  compuerta de paridad se ponía verde ante `export {x}` — reproducido `R9-13` entero con la
  suite en 30/30), `R9-68` (el detector por mensaje se tragaba los tres errores internos de
  expo-router, dos de los cuales dicen «This is likely a bug in Expo Router», y los ocho
  providers que la web SÍ monta), `R9-69` (el reset de `redLetterLoaded` vive en un efecto, o
  sea un render tarde: medido `{offsetsFor:"RVR1960", textFrom:"WEB"}`) y `R9-70` (el vecino
  de `R9-13` un nivel abajo: `tsc` queda **verde** con un miembro nuevo en el contrato nativo
  que el stub web nunca implementa). Los cinco arreglados en
  `fix/review-s13-revision-diff-s12`, cada uno con su prueba **vista fallar primero**, y
  `R9-66` además corrido de punta a punta contra los datos reales: los cuatro sha256 salen
  idénticos a los del manifiesto ya publicado. **A pedido de Victor se cerraron también las
  dos cosas que la revisión había dejado DICHAS sin hacer:** la segunda mitad de `R9-66` (un
  conteo que BAJA respecto del manifiesto publicado aborta la corrida, con `--allow-shrink`
  para la supresión editorial deliberada) y `R9-71` (el fallo transitorio que mataba la letra
  roja el resto de la sesión, preexistente). **Detalle completo, incluido lo que se comprobó
  y está BIEN y lo que queda dicho sin hacer: `detail/S13-revision-del-diff.md`.**
  **La lección de método:** las cuatro sesiones anteriores encontraron defectos en los
  ARREGLOS; esta los encontró en las **compuertas** de los arreglos. El antídoto cabe en una
  pregunta — _¿qué entrada hace que esta comprobación no ejecute ninguna aserción?_ Si esa
  entrada es alcanzable, hace falta un piso; y el piso necesita su propio control, o se
  convierte en la comprobación entera. Corolario: **un comentario que dice «verificado que hoy
  nadie hace X; si alguien empieza, arréglalo» no es una compuerta, es una nota.**

- **Sesión 28 — 2026-09-29. Arreglos de lo de la 27.** Solo en la terminal.
  - **Cómo se trabajó:**
    - el orquestador verificó el CI en el log y propuso orden y diseño antes de tocar código;
    - 3 agentes en worktree (a pedido de Victor) midieron el diseño, cada uno en su worktree: A1 el
      mock y `R9-179`/`R9-180`, A2 `R9-175`, y A3 `R9-181`/`R9-176`/`R9-178`. A2 lo cortó el
      límite de sesión y A3 se pausó: Victor eligió no retomarlos, y el orquestador integró los tres
      diffs;
    - un commit por hallazgo, cada prueba vista fallar, revert por pieza y la matriz entera, con
      `NODE_ENV=development` y el mock nuevo.
  - **Resultado:** 6 hallazgos ✅ (`R9-175`, `R9-176`, `R9-178`..`R9-181`); 3 nuevos
    (`R9-182`..`R9-184`). Queda 1 P0 abierto.
  - **Detalle: `detail/S28-arreglos-de-la-27.md`.**
  - **Las lecciones:**
    - **un mock que modela UNA propiedad del SDK puede producir órdenes que el SDK no produce:** el
      eco sin el hilo único dejaba que la lectura viera lo escrito durante ella;
    - **un diff de agente guardado a mitad de un revert se ve como una propuesta:** hay que leerlo
      línea por línea;
    - **el orden del mock decide qué guarda hace falta:** con el de RNFB, una sola guarda cubre
      `R9-176` y `R9-178`.

- **Sesión 32 — 2026-09-30. Arreglos de lo de la 31, e integración de `R9-192` y `R9-193`.** Solo
  en la terminal, sin agentes; arrancó con `_scratch/S32-PROMPT.md`.
  - **Cómo se trabajó:** un commit por hallazgo en `fix/s32-r192-r193-y-s31`, cada prueba vista
    fallar con su pieza revertida (`_scratch/S32-rev.cjs.txt`); las piezas de cada arreglo anterior,
    re-medidas en el árbol del siguiente; la matriz entera en un worktree aparte.
  - **Resultado:** 12 cerrados (`R9-174`, `R9-189`, `R9-192`..`R9-197`, `R9-199`, `R9-200`,
    `R9-204`, y `R9-206`, que abrió y cerró la propia sesión). Queda 1 P0 abierto.
  - **Detalle: `detail/S32-arreglos-s31.md`.**
  - **Las lecciones:**
    - **al apilar dos arreglos, una guarda del primero puede quedar subsumida por el segundo:** P3 y
      el `fromRead` retenido daban 0 con los sellos encima, y las pruebas seguían verdes;
    - **una decisión que dice «X, o lo que la medición diga» no decide X:** la X medida era la rama B;
    - **los heredocs halvan las barras, también dentro de Python** (dos NUL en `SyncEngine.ts`, otra
      vez).

- **Sesión 44 — 2026-10-02. Arreglos de lo de la 43.** Solo en la terminal, sin agentes; arrancó
  con `_scratch/S44-PROMPT.md`.
  - **Cómo se trabajó:** un commit por hallazgo en `fix/s44-arreglos-s43`, cada prueba vista caer
    con su pieza (`_scratch/S44-piezas.cjs.txt`) sobre la base de su commit, por la consecuencia y
    contra su control; la matriz entera en un worktree aparte.
  - **Resultado:** 6 cerrados (`R9-245`..`R9-250`), 1 nuevo (`R9-251`). Queda 1 P0 abierto.
  - **Detalle: `detail/S44-arreglos-s43.md`.**
  - **Las lecciones:**
    - **un arreglo de la sesión puede quitarle el caso a la prueba que la misma sesión acaba de
      escribir** (`R9-247` y la prueba de la lectura de `R9-246`);
    - **una guarda agregada por un veredicto incierto también se mide** (`R9-251`);
    - **«equivalente por construcción» se razona con la cadena entera** (el `clear()` del piso).

- **Sesión 45 — 2026-10-02. Revisión del diff de la 44.** Solo en la terminal, sin agentes y sin
  tocar código; arrancó con `_scratch/S45-PROMPT.md`.
  - **Cómo se trabajó:** tres sondas (`_scratch/S45-sondas1..3.body.txt`), cada una con su
    control en el mismo `it`, la pieza vista aplicada y el «¿de la 44?» medido con el motor de
    `1a77b78` (`S45-motor`).
  - **Resultado:** `R9-251` tiene su orden con daño (la guarda se queda), 1 nuevo (`R9-252`). Queda
    1 P0 abierto.
  - **Detalle: `detail/S45-revision-del-diff-s44.md`.**
  - **Las lecciones:**
    - **una guarda que da 0 en la matriz puede decidir en un estado que ninguna prueba arma** (con
      `R9-251`, el conflicto en memoria en vez de retenido);
    - **lo que una prueba da por esperado también se revisa** (el «tras reiniciar, ningún
      conflicto» de `R9-245` y `R9-248` es `R9-252`).

- **Sesión 46 — 2026-10-02. Arreglos de lo de la 45.** En el mismo chat que la 45, solo en la
  terminal y sin agentes.
  - **Cómo se trabajó:** un commit por hallazgo en `fix/s46-arreglos-s45`; la prueba nueva, vista
    caer con su pieza en la suite de sync entera, también sobre el árbol final.
  - **Resultado:** 2 cerrados (`R9-251`; `R9-252`, aceptado por Victor) y dos comentarios. Queda 1
    P0 abierto.
  - **Detalle: `detail/S46-arreglos-s45.md`.**
  - **La lección:** una decisión de aceptar un daño también se escribe donde ocurre (`R9-252`, en
    la rama del conflicto retenido).

- **Sesión 47 — 2026-10-02. Revisión del diff de la 46.** En el mismo chat, solo en la terminal,
  sin agentes y sin tocar código.
  - **Cómo se trabajó:** la prueba de `R9-251`, contra 12 piezas de a una
    (`_scratch/S47-varias.cjs.txt`); el comentario de `R9-252`, con una sonda por caso (`S47-1`).
  - **Resultado:** 1 nuevo (`R9-253`, P3). Queda 1 P0 abierto.
  - **Detalle: `detail/S47-revision-del-diff-s46.md`.**
  - **La lección:** un comentario que enumera casos se mide caso por caso.

- **Sesión 48 — 2026-10-02. Arreglos de lo de la 47.** En el mismo chat, solo en la terminal y sin
  agentes. 1 cerrado (`R9-253`, un comentario). Base nueva para las piezas:
  `_scratch/S48-SyncEngine-final.ts.txt`, con `S48-motor.cjs.txt`. **Detalle:
  `detail/S48-arreglos-s47.md`.**

- **Sesión 49 — 2026-10-03. Arreglos de `R9-212` y `R9-214`.** En un chat nuevo, solo en la
  terminal y sin agentes.
  - **Cómo se trabajó:** las tres formas de la cola ilegible, medidas hoy antes de tocar nada
    (`_scratch/S49-sonda-hoy.body.txt`); las piezas de a una sobre la base de su commit
    (`S49-piezas.cjs.txt`, `S49-SyncEngine-R212.ts.txt`), con el diff de cada caída
    (`S49-msg.cjs.txt`).
  - **Resultado:** 2 cerrados (`R9-212`, `R9-214`); una nota medida en `R9-126`. Queda 1 P0
    abierto.
  - **Detalle: `detail/S49-arreglos-r212-r214.md`.**
  - **La lección:** una guarda que espera a releer necesita una salida, porque una lectura puede
    fallar siempre.

- **Sesión 50 — 2026-10-03. Revisión del diff de la 49.** En un chat nuevo, solo en la terminal,
  sin agentes y sin tocar código.
  - **Cómo se trabajó:** una sonda por pregunta, cada una con su control en el mismo `it`
    (`_scratch/S50-sonda.body.txt`, `S50-sonda-borra.body.txt`, `S50-fav.cjs.txt`). Cada «¿lo
    abrió la 49?», con el motor y el contexto de `8f59942` (`S50-viejo.cjs.txt`).
  - **Resultado:** 5 nuevos (`R9-254`..`R9-258`; uno P2, anterior a la 49). Queda 1 P0 abierto.
  - **Detalle: `detail/S50-revision-del-diff-s49.md`.**
  - **La lección:** una pieza que dice «el arreglo entero» se compara con el motor de antes.

- **Sesión 51 — 2026-10-03. Arreglos de lo de la 50.** En el mismo chat, solo en la terminal y sin
  agentes.
  - **Cómo se trabajó:** una base por commit (`_scratch/S51-SyncEngine-*.ts.txt`), las piezas de
    a una (`S51-piezas.cjs.txt`), las sondas de la 50 sobre cada arreglo, y la matriz de la 44 en
    un worktree aparte.
  - **Resultado:** 5 cerrados (`R9-256`, `R9-254`, `R9-115`, `R9-257`, `R9-258`), 1 aceptado
    (`R9-255`) y 1 nuevo (`R9-259`). Queda 1 P0 abierto.
  - **Detalle: `detail/S51-arreglos-s50.md`.**
  - **La lección:** «los duplicados son inocuos» se coteja con el ledger (`R9-126` dice lo
    contrario).

- **Sesión 52 — 2026-10-03. Revisión del diff de la 51.** En un chat nuevo, solo en la terminal,
  sin agentes y sin tocar código.
  - **Cómo se trabajó:** una sonda por pregunta, con su control en el mismo `it`
    (`_scratch/S52-sonda-*.body.txt`); cada «¿lo abrió la 51?», con el motor de `af8a5ae` y una
    lectura que ve el disco de cuando se pidió; dos hipótesis medidas (`S52-piezas.cjs.txt`).
  - **Resultado:** 7 nuevos (`R9-260`..`R9-266`, P3). Queda 1 P0 abierto.
  - **Detalle: `detail/S52-revision-del-diff-s51.md`.**
  - **La lección:** una puerta del mock que lee al abrirse produce un orden que AsyncStorage (un
    ejecutor serie) no produce.

- **Sesión 53 — 2026-10-03. Arreglos de lo de la 52, y `R9-59` y `R9-38`.** En un chat nuevo,
  solo en la terminal y sin agentes.
  - **Cómo se trabajó:** cada prueba nueva vista caer sin su arreglo (el motor de antes encima, o
    un revert por pieza con `_scratch/S53-rev*.cjs.txt`); las sondas de la 52 re-corridas; la
    matriz de la 44 en un worktree aparte, y las guardas que se cubren, medidas juntas.
  - **Resultado:** 6 cerrados y 1 aceptado de la 52, más `R9-38` y `R9-59`; 2 nuevos (`R9-267`,
    `R9-268`). No queda ningún P0 abierto.
  - **Detalle: `detail/S53-arreglos-s52.md`.**
  - **La lección:** una escritura que espera una lectura previa se ordena con las que vienen
    detrás; y antes de arreglar un camino del motor, comprobá que los llamadores llegan a él.

- **Sesión 54 — 2026-10-03. Revisión del diff de la 53.** En un chat nuevo, solo en la terminal,
  sin agentes y sin tocar código.
  - **Cómo se trabajó:** una sonda por pregunta, con su control en el mismo `it`
    (`_scratch/S54-sondas.body.txt`, y la Mesa con los stores reales en `S54-prep.test.ts.txt`);
    cada «¿lo abrió la 53?», con el motor de `3f73e50`; las piezas de `R9-193` sobre una sonda
    nueva (`S54-rev193.cjs.txt`); la matriz de la 53, comparada (157 de 157).
  - **Resultado:** 4 nuevos (`R9-269` P1, `R9-270` P2, `R9-271` y `R9-272` P3). No queda ningún P0
    abierto.
  - **Detalle: `detail/S54-revision-del-diff-s53.md`.**
  - **La lección:** una unión que dice «gana X» pregunta qué pasa con lo que pierde.

- **Sesión 55 — 2026-10-03. Arreglos de lo de la 54.** En el mismo chat, solo en la terminal y sin
  agentes.
  - **Cómo se trabajó:** cada prueba nueva vista caer por la razón correcta, pieza por pieza
    (`_scratch/S55-rev269.cjs.txt`, `S55-rev270.cjs.txt`, `S55-rev271.cjs.txt`); la matriz de la
    44 sobre `50f209d`, en un worktree aparte.
  - **Resultado:** 4 cerrados (`R9-269`..`R9-272`), ningún nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S55-arreglos-s54.md`.**
  - **La lección:** una prueba de una carrera tiene que construirla: si la unión no escribe, la
    puerta no retiene nada.

- **Sesión 56 — 2026-10-05. Revisión del diff de la 55.** En un chat nuevo, solo en la terminal,
  sin agentes y sin tocar código.
  - **Cómo se trabajó:** una sonda por pregunta, con su control (la Mesa con los stores y el
    `importBackup` reales, `_scratch/S56-prep.test.ts.txt`; el motor, `S56-motor.body.txt`); cada
    «¿lo abrió la 55?», con los archivos de `a64786b` o el motor de `a85df96`; la matriz,
    comparada (157 de 157).
  - **Resultado:** 2 nuevos, P3 (`R9-273` medido, `R9-274` por lectura). No queda ningún P0
    abierto.
  - **Detalle: `detail/S56-revision-del-diff-s55.md`.**
  - **La lección:** un turno sobre una clave pregunta quién más escribe esa clave.

- **Sesión 57 — 2026-10-05. Arreglos de lo de la 56.** En el mismo chat, solo en la terminal y sin
  agentes.
  - **Cómo se trabajó:** cada prueba nueva vista caer con el código de antes y pieza por pieza
    (`_scratch/S57-rev.cjs.txt`); las sondas de la 56, re-corridas sobre el árbol nuevo.
  - **Resultado:** 2 cerrados (`R9-273`, `R9-274`), ningún nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S57-arreglos-s56.md`.**
  - **La lección:** una puerta armada con `getMockImplementation()` hereda lo que dejó la prueba
    anterior del archivo.

- **Sesión 58 — 2026-10-05. Revisión del diff de la 57.** En un chat nuevo, solo en la terminal,
  sin agentes y sin tocar código.
  - **Cómo se trabajó:** una sonda por pregunta, con su control (la Mesa con los stores, los joins
    y el `importBackup` reales, con una puerta en la parte de SQLite del respaldo:
    `_scratch/S58-prep.test.ts.txt`); cada «¿lo abrió la 57?», con los archivos de `fb7cc73`; las
    piezas de la 57, re-corridas con su diff.
  - **Resultado:** 2 nuevos, P3 (`R9-275`, `R9-276`), ninguno abierto por la 57. No queda ningún P0
    abierto.
  - **Detalle: `detail/S58-revision-del-diff-s57.md`.**
  - **La lección:** una escritura «para la cuenta de cuando se pidió» pregunta qué pasa si esa
    cuenta deja de existir mientras espera.

- **Sesión 59 — 2026-10-05. Arreglos de lo de la 58.** En el mismo chat, solo en la terminal y sin
  agentes.
  - **Cómo se trabajó:** cada prueba nueva vista caer con el código de antes y pieza por pieza
    (`_scratch/S59-rev.cjs.txt`); las sondas de la 58, re-corridas sobre el árbol nuevo.
  - **Resultado:** 2 cerrados (`R9-275`, `R9-276`), ningún nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S59-arreglos-s58.md`.**
  - **La lección:** antes de llevar una escritura tardía a donde fue su Mesa, preguntá si es un
    parche o un reemplazo.

- **Sesión 60 — 2026-10-05. Revisión del diff de la 59.** En el mismo chat que los arreglos, solo
  en la terminal, sin agentes y sin tocar código.
  - **Cómo se trabajó:** una sonda por pregunta, con su control (`_scratch/S60-prep.test.ts.txt`:
    la nota con basura, ilegible o que crece; el respaldo con su unión o su escritura fallando).
  - **Resultado:** ningún hallazgo nuevo. El hilo de la Mesa queda cerrado. No queda ningún P0
    abierto.
  - **Detalle: `detail/S60-revision-del-diff-s59.md`.**
  - **La lección:** una revisión en el mismo chat que escribió los arreglos no es una mirada
    fresca; se dice, y se compensa con sondas que buscan romperlos.

- **Sesión 61 — 2026-10-06. Arreglos del mazo de memoria** (`R9-267` y el mazo de `R9-133`,
  elegidos por Victor). En un chat nuevo, solo en la terminal y sin agentes.
  - **Cómo se trabajó:** primero medir, con el provider real (`_scratch/S61-sonda.test.tsx.txt`, un
    caso por pregunta con su control); después un commit por hallazgo, y cada pieza revertida en el
    árbol final (`_scratch/S61-rev.cjs.txt`).
  - **Resultado:** 3 cerrados (`R9-133` en el mazo, `R9-277` y `R9-267`) y 1 nuevo abierto
    (`R9-278`, P3). No queda ningún P0 abierto.
  - **Detalle: `detail/S61-arreglos-r267-r133.md`.**
  - **La lección:** una prueba del orden de AsyncStorage entrega cada lectura en su propio callback
    (el ejecutor serie): con dos lecturas en la misma ronda de microtareas, una guarda de «otra carga
    decide» no caía. **Incompleta, corregida en la 62:** el ejecutor serie también ordena lo que
    CORRE, no solo lo que llega.

- **Sesión 62 — 2026-10-06. Revisión del diff de la 61.** En el mismo chat, con 3 agentes en
  worktree que solo midieron (a pedido de Victor), sin tocar código.
  - **Cómo se trabajó:** un agente por par de preguntas, con sondas sobre el provider real, el
    motor real y el `importBackup` real, y cada una contra `37ba5f7`. El orquestador verificó a mano
    lo que sostiene cada hallazgo.
  - **Resultado:** 5 nuevos, todos P3 (`R9-279`..`R9-283`), y `R9-278` medido. No queda ningún P0
    abierto.
  - **Detalle: `detail/S62-revision-del-diff-s61.md`.**
  - **La lección:** una puerta que solo demora la entrega de una lectura no modela el ejecutor
    serie. Nada pedido después de una operación pendiente corre antes que ella
    (`_scratch/S62-sondas-agente-3/S62a3-orden.test.tsx.txt`).

- **Sesión 63 — 2026-10-06. Arreglos de lo de la 62** (`R9-278`..`R9-283`). En un chat nuevo, con
  3 agentes en worktree que solo midieron (a pedido de Victor).
  - **Cómo se trabajó:** las pruebas primero (`R9-283`, el modelo serie); mientras, un agente midió
    cada diseño (el alta condicional, la salida, el aviso antes del respaldo). Un commit por
    hallazgo, y cada pieza revertida en el árbol final (`_scratch/S63-rev.cjs.txt`, 45 piezas).
  - **Resultado:** 6 cerrados y 2 nuevos P3 (`R9-284`, `R9-285`). No queda ningún P0 abierto.
  - **Detalle: `detail/S63-arreglos-r279-r283.md`.**
  - **La lección:** un arreglo que agrega un aviso previo cambia qué órdenes son posibles. Dos
    pruebas pedían la escritura del respaldo antes de la relectura; con el aviso, el alta ya no
    relee, y lo mostró su control.

- **Sesión 64 — 2026-10-06. Revisión del diff de la 63.** En un chat nuevo, en la terminal y sin
  agentes, sin tocar código; arrancó con `_scratch/S64-PROMPT.md`.
  - **Cómo se trabajó:** la matriz de la 63 re-medida en el árbol de hoy (`S64-rev.cjs.txt`), otra
    vez con las entregas del modelo serie separadas 50 microtareas (`S64-serie.cjs.txt`), y tres
    sondas sobre el provider real, con su control y contra `8d041c9` (`S64-sonda.cjs.txt`).
  - **Resultado:** 1 nuevo, P3 (`R9-286`, comentarios). Ningún defecto de comportamiento nuevo. No
    queda ningún P0 abierto.
  - **Detalle: `detail/S64-revision-del-diff-s63.md`.**
  - **La lección:** para saber si una prueba depende de cómo el modelo intercala las entregas,
    separalas y re-medí la matriz entera.

- **Sesión 65 — 2026-10-06. Arreglos de lo de la 64** (`R9-286`). En el mismo chat que la 64, en
  la terminal y sin agentes; arrancó con `_scratch/S65-PROMPT.md`.
  - **Cómo se trabajó:** los siete comentarios en un commit; el JS emitido sin comentarios comparado
    con el de `main` en los cinco archivos (`_scratch/S65-igual.cjs.txt`, con control), las 45
    piezas re-medidas y `validate`.
  - **Resultado:** 1 cerrado, ningún nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S65-arreglos-r286.md`.**
  - **La lección:** un arreglo de solo comentarios se verifica con su control: el comprobador del JS
    emitido tiene que saber decir «distinto», y se re-corre sobre lo commiteado.

- **Sesión 66 — 2026-10-06. Revisión del diff de la 65.** En un chat nuevo, en la terminal, sin
  agentes y sin tocar código; arrancó con el mensaje de `_scratch/S66-PROMPT.md`.
  - **Cómo se trabajó:**
    - el comprobador de la 65 con su control, más las líneas tocadas que no son comentario;
    - las salidas de los reverts de la 65 cotejadas con las de la 64 (`_scratch/S66-cmp-rev.cjs.txt`);
    - cada comentario contra el código y su revert;
    - la sonda `TURNO` del agente 3 de la 63, con una pieza nueva (`enTurno`) y el suite relacionado
      (`_scratch/S66-turno.cjs.txt`).
  - **Resultado:** 2 nuevos, P3 (`R9-287`, `R9-288`). No queda ningún P0 abierto.
  - **Detalle: `detail/S66-revision-del-diff-s65.md`.**
  - **La lección:** cuando un comentario cuenta un segundo caso, buscá la pieza que conserva el
    primero y rompe el segundo, y mirá si el suite la ve.

- **Sesión 67 — 2026-10-06. Arreglos de lo de la 66** (`R9-287`, `R9-288`). En el mismo chat que
  la 66, en la terminal y sin agentes; arrancó con `_scratch/S67-PROMPT.md`.
  - **Cómo se trabajó:** un commit por hallazgo. La prueba nueva se vio caer con `enTurno` y con
    `inicio` en las suites relacionadas (`_scratch/S66-turno.cjs.txt`); los comentarios, con el
    comprobador de la 65 y su control; y `validate`.
  - **Resultado:** 2 cerrados, ningún nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S67-arreglos-r287-r288.md`.**
  - **La lección:** un comentario nombra la lectura que decide, no «la siguiente».

- **Sesión 68 — 2026-10-06. Revisión del diff de la 67.** En un chat nuevo, en la terminal, sin
  agentes y sin tocar código; arrancó con el mensaje de `_scratch/S68-PROMPT.md`.
  - **Cómo se trabajó:**
    - el comprobador de la 65 contra `cc4ee6d`, con su control;
    - las corridas de la 66 re-hechas (`S66-turno.cjs.txt enTurno|inicio suite`);
    - una sonda nueva (`_scratch/S68-turno.cjs.txt`) que registra en la prueba de `R9-287` las
      vueltas y las llamadas a `prepMultiSet` antes de abrir, con siete piezas del aviso y una del
      provider.
  - **Resultado:** 1 nuevo, P3 (`R9-289`). No queda ningún P0 abierto.
  - **Detalle: `detail/S68-revision-del-diff-s67.md`.**
  - **La lección:** si una prueba espera N vueltas a que algo pase, corré la pieza que lo demora más
    allá de N con el código bueno. Si cae igual que la regresión, le falta el control que dice que
    el caso llegó.

- **Sesión 69 — 2026-10-06. Arreglos de lo de la 68** (`R9-289`). En un chat nuevo, en la terminal
  y sin agentes; arrancó con el mensaje de `_scratch/S69-PROMPT.md`.
  - **Cómo se trabajó:** un commit (`e96e8e6`). La prueba se vio caer con cada pieza en las suites
    relacionadas (`_scratch/S68-turno.cjs.txt <pieza> suite`); las vueltas y el turno de las otras
    dos, con `_scratch/S69-vueltas.cjs.txt`; y `validate`.
  - **Resultado:** 1 cerrado, 1 nuevo P3 (`R9-290`, medido con `_scratch/S69-muere.cjs.txt`). No
    queda ningún P0 abierto.
  - **Detalle: `detail/S69-arreglos-r289.md`.**
  - **La lección:** una pieza que muestra una forma se corre en el suite, no solo en la prueba que
    la motivó.

- **Sesión 70 — 2026-10-06. Revisión del diff de la 69.** En el mismo chat que la 69, en la
  terminal, sin agentes y sin tocar código; arrancó con `_scratch/S70-PROMPT.md`.
  - **Cómo se trabajó:** una sonda nueva (`_scratch/S70-turno.cjs.txt`) con piezas que buscan romper
    el control (`sinCola`, `ciego`) y la pieza que demora junto con la regresión (`lentoSinTurno`);
    las piezas de `R9-275` de la 59 (`S59-rev`) para el rojo de la regresión; y `S69-muere`
    re-corrido.
  - **Resultado:** 1 nuevo, P3 (`R9-291`), y una corrección a `R9-290`. No queda ningún P0 abierto.
  - **Detalle: `detail/S70-revision-del-diff-s69.md`.**
  - **La lección:** la pieza que demora se corre también junto con la regresión. Una vuelta que
    espera el daño no lo ve llegar si el caso tarda más que ella.

- **Sesión 71 — 2026-10-07. Arreglos de lo de la 70** (`R9-291`, `R9-290`). En el mismo chat, en la
  terminal, con 2 agentes en worktree que solo midieron (Victor los pidió); arrancó con
  `_scratch/S71-PROMPT.md`.
  - **Cómo se trabajó:** un commit por hallazgo, medidos con `S70-turno` y `S59-rev`. Los agentes
    buscaron romper cada arreglo; sus afirmaciones nuevas se re-midieron en el árbol principal
    (`_scratch/S71-sonda2.cjs.txt`, `_scratch/S71-turno1.cjs.txt`). `validate`, sin worktrees.
  - **Resultado:** 2 cerrados, 1 nuevo P3 (`R9-292`), y una corrección a la 70 en `R9-289`. No queda
    ningún P0 abierto.
  - **Detalle: `detail/S71-arreglos-r290-r291.md`.**
  - **La lección:** antes de cambiar «N vueltas fijas» por «hasta que llegue», preguntá qué pasaba
    en las vueltas que sobraban.

- **Sesión 72 — 2026-10-07. Revisión del diff de la 71.** En un chat nuevo, en la terminal, con 3
  agentes en worktree que solo midieron (Victor los pidió), sin tocar código; arrancó con
  `_scratch/S72-PROMPT.md`.
  - **Cómo se trabajó:** un agente por punto (`R9-291` + `R9-289`, `R9-290`, `R9-292`). Sus
    afirmaciones se re-midieron en el árbol principal con scripts regenerados
    (`_scratch/S72-turno.cjs.txt`, `S72-sonda2.cjs.txt`, `S72-turno3.cjs.txt`). El worktree del
    agente 1 se borró solo con su `_scratch`; su pieza se rehízo.
  - **Resultado:** 3 nuevos, P3 (`R9-293`, `R9-294`, `R9-295`; el último lo abrió la 71), y
    correcciones en `R9-289`..`R9-292`. No queda ningún P0 abierto.
  - **Detalle: `detail/S72-revision-del-diff-s71.md`.**
  - **La lección:** un control de llegada tiene que nombrar QUÉ llegó: el pedido no es la escritura,
    y un colgado de la clave no es la devolución del respaldo.

- **Sesión 73 — 2026-10-07. Arreglos de lo de la 72** (`R9-292`..`R9-295`). En el mismo chat, en la
  terminal, con 3 agentes en worktree que solo midieron (Victor pidió 7 y eligió la recomendación);
  arrancó con `_scratch/S73-PROMPT.md`.
  - **Cómo se trabajó:** el orquestador escribió y midió los arreglos (`_scratch/S73-turno.cjs.txt`);
    los agentes buscaron romperlos, con las herramientas copiadas por `S73-copiar.cjs.txt`, y
    copiaron su `_scratch` al principal antes de terminar. Lo suyo se re-midió en el árbol principal
    (`S73-turno1.cjs.txt`, `S73-a2m.cjs.txt`). `validate`, sin worktrees.
  - **Resultado:** 4 cerrados; 2 huecos de la prueba nueva cerrados antes del checkpoint; 6 nuevos
    P3 (`R9-296`..`R9-301`). No queda ningún P0 abierto.
  - **Detalle: `detail/S73-arreglos-r292-r295.md`.**
  - **La lección:** «no pasó» no es «estaba esperando»: una prueba de invariante necesita un control
    de que lo otro está en la cola, no solo de que no corrió.

- **Sesión 74 — 2026-10-07. Revisión del diff de la 73.** En un chat nuevo, en la terminal y sin
  agentes, sin tocar código; arrancó con `_scratch/S74-PROMPT.md`.
  - **Cómo se trabajó:** con los scripts de la 73 (`S73-turno1`, con `seRindeK` hasta 80;
    `S73-a2m`; `S72-sonda2`) y uno nuevo, `_scratch/S74-sonda.cjs.txt` (pieza + archivos de prueba).
  - **Resultado:** lo de la 73 se sostiene; 1 nuevo P3 (`R9-302`); corrección en `R9-297`; las
    decisiones de Victor sobre `R9-289` y `R9-296`, escritas. No queda ningún P0 abierto.
  - **Detalle: `detail/S74-revision-del-diff-s73.md`.**
  - **La lección:** medí el corte, no solo una demora grande: «25 vueltas» era una de más; el margen
    era cero.

- **Sesión 75 — 2026-10-07. Arreglos de lo de la 74.** En un chat nuevo, en la terminal, con 2
  agentes en worktree que solo midieron; arrancó con `_scratch/S75-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S75-sonda.cjs.txt` (corridas con `+`; `archivo`, `prep` o
    `suite`) y `S75-sonda1.cjs.txt` (la del agente 1, con `de<sha>` y `antesSqliteK`); herramientas a
    los agentes con `S75-copiar.cjs.txt`.
  - **Resultado:** cerrados `R9-302` y `R9-303` (`a808c29`, `125736b`, solo
    `backupRestoreSignal.test.ts`); 2 nuevos P3 (`R9-304`, `R9-305`). No queda ningún P0 abierto.
  - **Detalle: `detail/S75-arreglos-r302.md`.**
  - **La lección:** una espera que ordena dos cosas se lleva la cobertura del otro orden: construilo
    como su propio caso, con una puerta.

- **Sesión 76 — 2026-10-07. Revisión del diff de la 75.** En un chat nuevo, en la terminal, con 4
  agentes en worktree que solo midieron; arrancó con `_scratch/S76-PROMPT.md`.
  - **Cómo se trabajó:** herramientas a los agentes con `_scratch/S76-copiar.cjs.txt`; sus sondas,
    regeneradas con `ROOT` en el principal por `S76-gen.cjs.txt` (`S76-sonda-a1`, `-a3`, `-a4`).
  - **Resultado:** lo de la 75 se sostiene; tres frases corregidas sin número; 3 nuevos P3
    (`R9-306`..`R9-308`). Ninguno es P2. No queda ningún P0 abierto.
  - **Detalle: `detail/S76-revision-del-diff-s75.md`.**
  - **La lección:** una puerta construye un punto del orden, no el tramo: al cambiar una carrera por
    casos con puertas, listá dónde podía caer la carrera, y probá una regresión en cada punto.

- **Sesión 77 — 2026-10-07. Arreglos de lo de la 76.** En el mismo chat, en la terminal y sin
  agentes; arrancó con `_scratch/S77-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S77-sonda.cjs.txt` (armada por `S77-gen.cjs.txt`: la del agente
    4 de la 76, más `generacion`, `reiniciaAlInicio`, `pendientesAlInicio`, `reiniciaEnSqlite` y
    `reiniciaTrasSqlite`); el revert, con `de<sha>+pieza`.
  - **Resultado:** cerrados `R9-307` y `R9-306` (`41c75fc`, `a7a1feb`, solo
    `backupRestoreSignal.test.ts`); ninguno nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S77-arreglos-r306-r307.md`.**
  - **La lección:** las regresiones de orden vienen en dos clases, y cada una necesita su extremo:
    las que fijan demasiado pronto, el store lo más tarde posible; las que sueltan lo de antes, lo
    más temprano. Al mover una puerta, comprobá que cada clase la siga viendo algún caso.

- **Sesión 78 — 2026-10-07. Revisión del diff de la 77.** En un chat nuevo, en la terminal, sin
  agentes y sin tocar código; arrancó con `_scratch/S78-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S78-sonda.cjs.txt` (armada por `S78-gen.cjs.txt`: la de la 77,
    más `genEnSqlite`, `genFinSqlite`, `genTrasSqlite`, `turnoAntesDeClave`, `drenaFinSqlite`,
    `reiniciaFinSqlite`, y dos sondas que se pegan al final de otro archivo de pruebas, `copia292`
    y `copiaClave`).
  - **Resultado:** lo de la 77 se sostiene. Dos nuevos P3 de pruebas, ninguno abierto por la 77:
    `R9-309` y `R9-310`. No queda ningún P0 abierto.
  - **Detalle: `detail/S78-revision-del-diff-s77.md`.**
  - **La lección:** un caso que fija el momento de una clave (o de un pedido) fija también qué
    marcas puede ver. Para la clase «lo pedido antes de una marca», el extremo es lo más tarde
    posible, con lo otro ya en su turno.

- **Sesión 79 — 2026-10-07. Arreglos de lo de la 78.** En el mismo chat, en la terminal y sin
  agentes; arrancó con `_scratch/S79-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S79-sonda.cjs.txt` (armada por `S79-gen.cjs.txt`: la de la 78,
    más los reverts `bpt<sha>`/`pat<sha>`, `migraLentaK` para el corte, y `conSave`, `falla292`,
    `sinSoltar` para lo que queda colgado).
  - **Resultado:** cerrados `R9-309` y `R9-310` (`dc63e01`, `4f882ab`, solo pruebas); ninguno nuevo.
    No queda ningún P0 abierto.
  - **Detalle: `detail/S79-arreglos-r309-r310.md`.**
  - **La lección:** medí el corte de tu propia prueba antes de commitearla, y mirá qué rojo da ahí:
    la primera versión de `R9-310` daba en el corte el rojo de la traba que vigila.

- **Sesión 80 — 2026-10-07. Revisión del diff de la 79.** En el mismo chat que la escribió (lo pidió
  Victor), en la terminal, sin agentes y sin tocar código; arrancó con `_scratch/S80-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S80-sonda.cjs.txt` (armada por `S80-gen.cjs.txt`: la de la 79,
    más `claveCapturada`, `claveDosVeces`, `claveSinEsperar`, `genTrasMultiSet`,
    `devolucionPedidaAntes`, y los arreglos propuestos `arregloClave` y `arregloOrden`).
  - **Resultado:** lo de la 79 cae como dice. Tres nuevos P3 de pruebas: `R9-311`, `R9-312` (los
    abrió la 79) y `R9-313`. No queda ningún P0 abierto.
  - **Detalle: `detail/S80-revision-del-diff-s79.md`.**
  - **La lección:** un control que cuenta llamadas no dice que la puerta retuvo: compará la
    identidad de lo retenido. Y «lo más tarde posible» se mide contra el turno ENTERO del otro.

- **Sesión 81 — 2026-10-08. Arreglos de lo de la 80.** En un chat nuevo, en la terminal, con 3
  agentes que pidió Victor (uno por hallazgo, cada uno en su worktree, solo midieron); arrancó con
  `_scratch/S81-PROMPT.md`. Solo pruebas.
  - **Cómo se trabajó:** las herramientas de los agentes, con `_scratch/S81-copiar.cjs.txt`; sus
    informes en `_scratch/S81-agente-N.md.txt`, y sus sondas en `_scratch/S81-sondas-agente-N/`. El
    orquestador integró y re-midió cada pieza en el árbol principal (`_scratch/S81-sonda1`, `2` y `3`).
  - **Resultado:** cerrados `R9-311` (`82de81f`), `R9-312` (`e23b150`) y `R9-313` (`dcc7bfa`). Uno
    nuevo, `R9-314` (P3). No queda ningún P0 abierto.
  - **Detalle: `detail/S81-arreglos-r311-r313.md`.**
  - **La lección:** un control de orden lee algo que solo existe después del primer evento (lo que
    la unión escribió, no la cuenta que se fijó antes). Y corré la regresión que armaste para probar
    un control también contra los otros caminos que dependen de la misma garantía.

- **Sesión 82 — 2026-10-08. Revisión del diff de la 81.** En un chat nuevo, en la terminal, sin
  agentes y sin tocar código; arrancó con `_scratch/S82-PROMPT.md`. Antes, el merge de la 81 con el
  OK de Victor (`c3123d6`, run `37810321907`).
  - **Cómo se trabajó:** las sondas de la 81 (`S81-sonda1`, `2` y `3`) sobre `main`, y
    `_scratch/S82-sonda.cjs.txt` (la `S81-sonda3`, más `claveEnvuelta`, `releaseTimer<ms>`,
    `<marca>X`, `salidaAbre`, `claveAntesDeFinish`, `lecturaDevolucion` y `arregloPendiente`).
  - **Resultado:** lo de la 81 cae como dice. Dos nuevos P3 de pruebas: `R9-315` (lo abrió la 81) y
    `R9-316`. `R9-314`, medido entero. No queda ningún P0 abierto.
  - **Detalle: `detail/S82-revision-del-diff-s81.md`.**
  - **La lección:** un control nuevo se corre también contra un cambio BUENO de su superficie (la 81
    midió el de identidad solo contra regresiones). Y una salida armada para una traba cubre la
    traba que la motivó: medila con una que llegue por otro camino.

- **Sesión 83 — 2026-10-08. Arreglos de lo de la 82 y de `R9-314`.** En el mismo chat que la 82 (lo
  pidió Victor), en la terminal y sin agentes; arrancó con `_scratch/S83-PROMPT.md`. Solo pruebas.
  - **Cómo se trabajó:** `_scratch/S83-sonda.cjs.txt` (la `S82-sonda`, más `claveAntesDeUnion`,
    `claveAntesDelTurnoUnion`, `claveAlPedir`, `storeLentoK` y `sinDevolucion`).
  - **Resultado:** cerrados `R9-314` (`505b79b`), `R9-315` (`50b5442`) y `R9-316` (`7b146a5`).
    Ninguno nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S83-arreglos-r314-r316.md`.**
  - **La lección:** un arreglo de un control cambia también su espera, así que hay que medir el
    corte otra vez (el de `R9-315` pasó de 20 a 41). Y una salida se escribe una vez, y suelta todo:
    así no depende de adivinar qué trabó.

- **Sesión 84 — 2026-10-08. Revisión del diff de la 83.** En un chat nuevo, en la terminal y sin
  agentes; arrancó con `_scratch/S84-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** `_scratch/S84-sonda.cjs.txt` (la `S83-sonda`, más `clavePlazoK`,
    `claveCapturadaLentaK`, `claveLentaK` y las hipótesis `esperaSinReloj` y `pendienteAlSoltar`).
  - **Resultado:** lo de la 83 cae como dice. Nuevos `R9-317` y `R9-318` (P3 de pruebas). No queda
    ningún P0 abierto.
  - **Detalle: `detail/S84-revision-del-diff-s83.md`.**
  - **La lección:** «esperaba» se mide contra «tardó»: con relojes falsos y una hora, no con un
    `setTimeout(0)`. Y un control de «pendiente» se corre contra algo pendiente por su cuenta.

- **Sesión 85 — 2026-10-12. Arreglos de lo de la 84.** En un chat nuevo, en la terminal y sin
  agentes; arrancó con `_scratch/S85-PROMPT.md`. Solo pruebas.
  - **Cómo se trabajó:** `_scratch/S85-sonda.cjs.txt` (la `S84-sonda`, más `lecturaLentaK`,
    `caeConFalsos`, `sinAfterEach`, `sinVueltaFoto` y la hipótesis intermedia `resueltaAlSoltar`).
  - **Resultado:** cerrados `R9-317` (`7b4a79c`) y `R9-318` (`b1519ae`). Ninguno nuevo. No queda
    ningún P0 abierto.
  - **Detalle: `detail/S85-arreglos-r317-r318.md`.**
  - **La lección:** un reloj falso da tiempo, no vueltas (con la lectura una vuelta más lenta, la
    hora sola no veía la regresión). «Pendiente hasta que se suelta» se lee a los dos lados del
    momento: pendiente antes, y de vuelta después, con lo otro retenido. Y una hipótesis medida en
    una revisión se vuelve a medir al integrarla.

- **Sesión 86 — 2026-10-12. Revisión del diff de la 85.** En un chat nuevo, en la terminal y sin
  agentes; arrancó con `_scratch/S86-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** `_scratch/S86-sonda.cjs.txt` (la `S85-sonda`, más `tardeClaveK`, `muestra`,
    `cuentaRelojes` con su control `fechaEnManage`, `caeConFalsosUltima` y la hipótesis
    `enEspera`).
  - **Resultado:** lo de la 85 cae como dice. Nuevo `R9-319` (P3 de pruebas). No queda ningún P0
    abierto.
  - **Detalle: `detail/S86-revision-del-diff-s85.md`.**
  - **La lección:** «volvió la clave» no es «llegó al turno». El control de la 85 se lee en el
    momento justo, pero sobre un paso anterior a lo que afirma, y entre los dos cabe una demora. Que
    el control lea el último paso antes de lo que afirma.

- **Sesión 87 — 2026-10-12. Arreglo de lo de la 86.** En un chat nuevo, en la terminal y sin
  agentes; arrancó con `_scratch/S87-PROMPT.md`. Prueba y gancho (un export solo para pruebas).
  - **Cómo se trabajó:** `_scratch/S87-sonda.cjs.txt` (la `S86-sonda`, con `muestra` sobre el campo
    nuevo, más `ganchoSinBorrar`, `sinLimpiar` y `soloEnEspera`).
  - **Resultado:** cerrado `R9-319` (`9d3f489`). Ninguno nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S87-arreglo-r319.md`.**
  - **La lección:** una lección también se mide antes de escribirla. «Plegados, dejaban un paso sin
    leer» era falso por construcción, y «el del turno solo no alcanza» no lo mostró ninguna de diez
    corridas.

- **Sesión 100 — 2026-10-14. Revisión del diff de la 99.** En un chat nuevo, en la terminal y sin
  agentes; con `_scratch/S100-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** la matriz de la 99 y sus 39 piezas aparte (279 corridas) re-medida con
    `_scratch/S100-matriz.cjs.txt`, y piezas propias hechas para romper lo de la 99 (fallas que se
    repiten, llamadores lentos, el hueco entre pruebas, varios estados), con `S100-sonda.cjs.txt` (de
    `S100-gen.cjs.txt` y `S100-propias.txt`).
  - **Resultado:** lo de la 99 se sostiene como código (`S99-igual`, con su control); la matriz no
    cambia. Nuevos `R9-348`..`R9-352` (P3 y P3 bajo). No queda ningún P0 abierto.
  - **Detalle: `detail/S100-revision-del-diff-s99.md`.**
  - **Las lecciones:** la pieza que demora se corre con cada regresión que la prueba dice ver; una
    falla inyectada una vez no ve un reintento; un control de «terminó» no dice «durante esta»; al
    llevar un caso a otra parte del trabajo, se lleva también su cantidad.

- **Sesión 101 — 2026-10-15. Arreglo de lo de la 100.** En un chat nuevo, en la terminal y sin
  agentes; con `_scratch/S101-PROMPT.md`. Pruebas, y dos frases de `prepAccount.ts`.
  - **Cómo se trabajó:** `_scratch/S101-sonda.cjs.txt` (de `S101-gen.cjs.txt` y `S101-propias.txt`),
    la matriz de la 100 y sus 37 piezas aparte con `S101-matriz.cjs.txt`, y `S101-igual.cjs.txt`
    (lee los dos lados de git).
  - **Resultado:** cerrados `R9-348`..`R9-352` (`ac1a7a5`, `9336ddc`, `44927a5`). Nuevos `R9-353` y
    `R9-354` (P3 y P3 bajo), sin arreglar. No queda ningún P0 abierto.
  - **Detalle: `detail/S101-arreglo-de-s100.md`.**
  - **Las lecciones:** con un control nuevo, la pieza que demora va también antes del paso que lee;
    una regla de la revisión anterior se corre en todas las pruebas del mismo diseño; un control de
    «pidió y espera» lee el pedido, no lo que usa la escritura.

- **Sesión 102 — 2026-10-19. Revisión del diff de la 101.** En un chat nuevo, en la terminal, con 3
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S102-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** `_scratch/S102-sonda.cjs.txt` (de `S102-gen.cjs.txt`, que también arma la
    sonda de cada agente en su worktree, y `S102-propias.txt`); la matriz de la 101 y sus 20 piezas
    aparte (330 corridas) con `S102-matriz.cjs.txt`; todo lo de los agentes re-medido en el principal.
  - **Resultado:** lo de la 101 se sostiene como código; la matriz no cambia. Nuevos `R9-355`..`R9-358`
    (P3 y P3 bajo). No queda ningún P0 abierto.
  - **Detalle: `detail/S102-revision-del-diff-s101.md`.**
  - **Las lecciones:** al llevar la cantidad de un caso a otra parte, se lleva también su forma; varios
    estados en la misma tarea son distintos en valor, no en tiempo; una falla inyectada por par
    (método, clave) no ve un camino de error que toca otro par; las pruebas-sonda de una sesión se
    anclan en su último commit.

- **Sesión 103 — 2026-10-19. Arreglo de lo de la 101 y la 102.** En un chat nuevo, en la terminal, con
  5 agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor); con
  `_scratch/S103-PROMPT.md`. Solo pruebas.
  - **Cómo se trabajó:** `_scratch/S103-sonda.cjs.txt` (de `S103-gen.cjs.txt`, que arma también la
    sonda de cada agente, y `S103-propias.txt`); un commit por diseño, cada uno re-medido en el
    principal; la matriz de la 102 y sus 37 piezas aparte, más las de los agentes (360 corridas), con
    `S103-matriz.cjs.txt`.
  - **Resultado:** cerrados `R9-353`..`R9-358`. Nuevo `R9-359` (P3 bajo), sin arreglar. No queda
    ningún P0 abierto.
  - **Detalle: `detail/S103-arreglo-de-s101-s102.md`.**
  - **Las lecciones:** aflojar un control que daba un rojo ante un cambio bueno puede quitarle una
    regresión que veía por ese rojo; un caso donde el valor del pedido y el del final difieren da daño
    a una regresión que no lo tenía; un plazo medido en vueltas no ve un temporizador; «todo el disco»
    es todo método del almacén.

- **Sesión 104 — 2026-10-19. Revisión del diff de la 103.** En un chat nuevo, en la terminal, con 6
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S104-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** `_scratch/S104-sonda.cjs.txt` (de `S104-gen.cjs.txt`, que arma también la
    sonda de cada agente); cada agente atacó lo integrado de otro; todo lo suyo re-medido en el
    principal, y la matriz de la 103 con sus tandas y las piezas de los agentes (`S104-matriz.cjs.txt`).
  - **Resultado:** nuevos `R9-360`..`R9-366` (P3 y P3 bajo), todos en las pruebas y abiertos por la 103. No queda ningún P0 abierto.
  - **Detalle: `detail/S104-revision-del-diff-s103.md`.**
  - **Las lecciones:** al portar un control sobre el diseño de otro, su lectura va después de todo lo
    que ese diseño agrega; un ajeno se corre contra el esperado de hoy; un dato vacío no dice adónde
    fue; una hora de reloj falso también es un corte, y una vuelta no separa en el tiempo; lo que veía
    un control exacto es una clase, no una pieza.

- **Sesión 105 — 2026-10-20. Arreglo de lo de la 103 y la 104.** En un chat nuevo, en la terminal, con
  10 agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor: 6 para las
  entradas, 4 para el Pendiente); con `_scratch/S105-PROMPT.md`. Solo pruebas.
  - **Cómo se trabajó:** `_scratch/S105-sonda.cjs.txt` (de `S105-gen.cjs.txt`, que arma también la
    sonda de cada agente); los diseños, portados al principal en dos commits (uno por archivo), con cada
    prueba nueva re-medida cayendo con sus piezas; la matriz de la 104 más las piezas de la 105
    (`S105-matriz.cjs.txt`). El límite de uso cortó a A4 y A5; se retomaron tras el reset.
  - **Resultado:** cerrados `R9-359`..`R9-366`, `R9-333` y `R9-372`. Nuevos `R9-367`..`R9-371`, sin
    arreglar. No queda ningún P0 abierto.
  - **Detalle: `detail/S105-arreglo-de-s103-s104.md`.**
  - **Las lecciones:** una hipótesis del ledger que nombra una herramienta se mide con un cambio bueno
    de esa herramienta; un control que lee «de quién» en la pila tiene su propio cambio bueno; dos
    pendientes pueden tener una causa.

- **Sesión 106 — 2026-10-20. Revisión del diff de la 105.** En un chat nuevo, en la terminal, con 4
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S106-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** `_scratch/S106-sonda.cjs.txt` (de `S106-gen.cjs.txt`, que arma también la
    sonda de cada agente); las seis entradas del reparto, en cuatro agentes; todo lo suyo re-medido en
    el principal, en la matriz de la 105 con sus corridas (`S106-matriz.cjs.txt`, 595).
  - **Resultado:** nuevos `R9-373`..`R9-380` (P3 y P3 bajo), todos en las pruebas. `R9-370`, decidido
    (opción (a)). No queda ningún P0 abierto.
  - **Detalle: `detail/S106-revision-del-diff-s105.md`.**
  - **Las lecciones:** un control de «nada pendiente» pregunta qué pasa si no contó nada; una
    herramienta que corre lo pendiente una vez por vuelta tiene un corte en eslabones; «lo que el
    trabajo programa vence aquí» pregunta por lo que el trabajo espera; `resetModules` no reinicia lo
    que la fábrica de un mock cierra; un control que se calcula y no se compara no vigila; antes de
    llamar «cambio bueno» a una pieza, preguntá si abre en la app una ventana nueva.

- **Sesión 107 — 2026-10-21. Arreglo de lo de la 105 y la 106.** En un chat nuevo, en la terminal,
  con 12 agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor); con
  `_scratch/S107-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S107-sonda.cjs.txt` (de `S107-gen.cjs.txt`, que arma la sonda de
    cada agente y re-ancla las piezas de antes donde `R9-370` cambió `src/`); una entrada (o dos
    pegadas) por agente; los diseños integrados con `git apply --3way` y re-medidos en el principal
    (`S107-matriz.cjs.txt`).
  - **Resultado:** cerrados `R9-367`..`R9-380`; `R9-370`, en `src/`. Nuevos `R9-381` y `R9-382` (P3
    bajo), los costos de dos arreglos. No queda ningún P0 abierto.
  - **Detalle: `detail/S107-arreglo-de-s105-s106.md`.**
  - **Las lecciones:** una decisión que nombra un momento se mide en cada paso hasta ese momento; un
    caso tiene su espejo; un arreglo que parte un camino en dos pide una fila por camino; una pieza se
    re-ancla solo donde el texto nuevo hace lo mismo; un «de quién» por identidad tiene su cambio
    bueno, como el de la pila.

- **Sesión 108 — 2026-10-26. Revisión del diff de la 107.** En un chat nuevo, en la terminal, con 3
  agentes en worktree que solo midieron; con `_scratch/S108-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** `_scratch/S108-sonda.cjs.txt` (de `S108-gen.cjs.txt`, sobre `S107-sonda`, sin
    repetir el re-anclado); tres miradas (`R9-370` en `src/` y su fila; el re-anclado, las gemelas sin
    dueño y los cortes; el respaldo y la integración a mano); todo lo suyo re-medido en el principal, y
    la matriz de la 107 sobre la punta (`S108-matriz.cjs.txt`).
  - **Resultado:** nuevos `R9-383`..`R9-387` (P3 y P3 bajo): uno de `src/` (una frase) y cuatro de las
    pruebas. No queda ningún P0 abierto.
  - **Detalle: `detail/S108-revision-del-diff-s107.md`.**
  - **Las lecciones:** una fila por camino necesita datos que hagan trabajar a la parte; el corte de una
    decisión empieza donde se toma el valor; lo que un re-anclado deja en un solo camino se lista, y cada
    pieza pide su gemela; la causa de un corte que se movió se mide moviendo una cosa por vez.

- **Sesión 109 — 2026-10-26. Arreglo de lo de la 107 y la 108.** En un chat nuevo, en la terminal, con 6
  agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor); con
  `_scratch/S109-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S109-sonda.cjs.txt` (de `S109-gen.cjs.txt`, sobre `S108-sonda`); una
    entrada por agente (las dos frases juntas), los seis diffs aplicados sin conflictos y commiteados de a
    uno; cada pieza re-medida en el principal sobre lo integrado, y la matriz de la 108 sobre la punta
    (`S109-matriz.cjs.txt`).
  - **Resultado:** cerrados `R9-381`..`R9-387`; nuevos `R9-388` y `R9-389` (P3 bajo), los costos de dos
    arreglos. No queda ningún P0 abierto.
  - **Detalle: `detail/S109-arreglo-de-s107-s108.md`.**
  - **Las lecciones:** una pieza de un store pide la misma en los otros tres; la forma de un caso va con
    su camino nuevo; dos diseños en la misma prueba se miden juntos; un espía que devuelve otro tipo
    cambia lo que recibe el código bajo prueba.

- **Sesión 110 — 2026-10-27. Revisión del diff de la 109.** En un chat nuevo, en la terminal, con 10
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S110-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S110-sonda.cjs.txt` (de `S110-gen.cjs.txt`, sobre `S109-sonda`); una
    mirada estrecha por agente; cada afirmación re-medida en el principal (57 corridas), y la matriz de la
    109 sobre la punta (`S110-matriz.cjs.txt`).
  - **Resultado:** nuevos `R9-390`..`R9-400` (cuatro P3 con daño medido, siete P3 bajo). No queda ningún
    P0 abierto.
  - **Detalle: `detail/S110-revision-del-diff-s109.md`.**
  - **Las lecciones:** la última parte del trabajo depende de los datos; un costo escrito «sin medir» se
    mide con una regresión que dependa de él; una fila por lectura del camino; un momento que una frase
    nombra necesita un caso donde difiera del vecino; un arreglo que cambia lo que cuenta un control
    re-mide su frase vieja.

- **Sesión 111 — 2026-10-27. Arreglo de lo de la 109 y la 110.** En un chat nuevo, en la terminal, con 5
  agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor); con
  `_scratch/S111-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S111-sonda.cjs.txt` (de `S111-gen.cjs.txt`, sobre `S110-sonda`); las 13
    entradas juntadas por prueba en 5 agentes; los diseños aplicados en serie y commiteados de a uno
    (`25ce228`..`56c7d33`); cada prueba nueva vista caer en el principal con su pieza y pasar con la de
    `4839952`; la matriz de la 110 sobre la punta (`S111-matriz.cjs.txt`, 1239).
  - **Resultado:** cerrados `R9-388`..`R9-400`; nuevos `R9-401`..`R9-405` (P3 bajo; cuatro son costos de
    los arreglos). No queda ningún P0 abierto.
  - **Detalle: `detail/S111-arreglo-de-s109-s110.md`.**
  - **Las lecciones:** entre diseños con costos, se elige por quién más ve cada costo; sin envoltorio, el
    «de quién» pasa a lo que se hace con el valor; un control que lee un gancho tiene los cambios buenos
    del gancho; la matriz ve lo que un agente no corrió; al sembrar cada base, la falla va a cada base.
- **Sesión 112 — 2026-10-27. Revisión del diff de la 111, la última vuelta del ciclo de las pruebas de la
  Mesa.** En un chat nuevo, en la terminal, con 5 agentes en worktree que solo midieron (los pidió
  Victor); con `_scratch/S112-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S112-sonda.cjs.txt` (de `S112-gen.cjs.txt`, sobre `S111-sonda`); las
    seis miradas del mensaje en 5 agentes, con el corte de Victor primero (medir el daño de cada verde
    falso); los tres con daño re-medidos en el principal; la matriz de la 111 sobre la punta
    (`S112-matriz.cjs.txt`).
  - **Resultado:** nuevos `R9-406`..`R9-409`; tres con daño medido (la 113 arregla solo esos), ninguno
    abierto por la 111. El ciclo se cierra con la 113; después, `A12` (la 114). No queda ningún P0
    abierto.
  - **Detalle: `detail/S112-revision-del-diff-s111.md`.**
  - **Las lecciones:** lo que un arreglo lleva a un camino, lo pide el camino vecino; lo que un control
    hereda no lo distingue; un conteo que resta no dice a quién le resta.
- **Sesión 115 — 2026-10-28. El Modo C P0 de dinero y gating, con emulador.** En un chat nuevo, con
  `_scratch/S115-PROMPT.md`, en la terminal, con 7 agentes en worktree que solo midieron (los pidió Victor:
  «Podrías mandar 7 agentes por favor?»), en dos olas, cada uno con su emulador. Solo docs.
  - **Cómo se trabajó:** el orquestador levantó Metro (uno, en el principal) y las instancias
    (`emulator -avd Pixel_9_Pro -port <p> -read-only`, con el APK debug vc73 ya instalado; `pm clear` y
    arranque con `_scratch/S115-preparar.sh.txt`); las reglas comunes, en `_scratch/S115-agentes-reglas.md.txt`.
    Con 7 a la vez se agotó la memoria comprometida (Metro sirvió un bundle roto, un emulador murió, Bash no
    podía hacer fork): **4 como techo**, en dos olas. Victor cerró 3 emuladores por error a mitad: se
    rearrancaron de a uno. El límite de uso cortó a 4 agentes; se los retomó con `SendMessage`.
  - **Decidido por Victor en la sesión:** las compras paran en el diálogo de Play; «Restaurar» solo una vez
    (agente 1); `C55` podía generar un código real (no se generó: el canje exige una cuenta no anónima); `C55` y `C54`,
    «sin medir» antes que iniciar sesión con su cuenta.
  - **Resultado:** `C16` ✅; `C15`, `C56` 🐛 P2; `C39`, `C6` 🐛 P3; `C55`, `C54` PENDIENTE. Nuevos
    `R9-418`..`R9-422`, ninguno P0; `R9-412` medido en el dispositivo; `R9-417` sin medir. No queda ningún P0
    abierto.
  - **Detalle: `detail/C15-hoja-ofrenda.md`** (el entorno y la restauración) y `C16`, `C39`, `C55`, `C56`,
    `C6`, `C54`.
  - **Las lecciones:** el techo de emuladores es la memoria COMPROMETIDA, no la libre; la cuenta de Google del
    AVD es la real de Victor y ya tiene la ofrenda (tocar un nivel la restaura sola al uid del emulador); el
    toggle premium de dev no sobrevive a un arranque en frío; sin una cuenta de Google de prueba, nada de sync
    ni de canje se mide.
- **Sesión 116 — 2026-11-02. El Modo A P1, la primera tanda: `A13`, `A14`, `A15`.** En un chat nuevo, con
  `_scratch/S116-PROMPT.md`, en la terminal, con 3 agentes `fork` en worktree que solo midieron, una fila
  cada uno (el mensaje decía «si no digo cuántos, 3»). Solo docs.
  - **Cómo se trabajó:** las reglas comunes en `_scratch/S116-agentes-reglas.md.txt` (con el Pendiente
    cruzado contra cada fila y los `R9` que ya nombraban cada área), el corredor `_scratch/S116-correr.cjs.txt`
    (la forma de `S114-correr`), probado en el principal antes de lanzar. Completaron los 3 sin cortes
    (225-234k tokens, 44-66 llamadas, 7-15 min); cada sonda, re-medida igual en el principal.
  - **Resultado:** `A13` 🐛 (`R9-423`, P2); `A14` EN CURSO (`R9-424`, P1); `A15` EN CURSO (`R9-425`, P1;
    `R9-426`, P2). Ninguno P0.
  - **Detalle:** `detail/A13-lector-capitulo.md`, `detail/A14-base-de-datos.md`, `detail/A15-audio-tts.md`.
  - **Las lecciones:** un candidato de una fila puede ser el camino de llegada de otro (el reset de datos de
    `A14` lleva a la página en blanco de `A13`); un mock que devuelve un objeto nuevo en cada render cuelga
    jest con un efecto en bucle (67 MB de salida).
- **Sesión 117 — 2026-11-02. El Modo A P1, la segunda tanda: `A14`, `A15`, `A16`.** En un chat nuevo, con
  `_scratch/S117-PROMPT.md`, en la terminal, sin agentes. Solo docs.
  - **Cómo se trabajó:** lectura por rangos y tres sondas de jest con el corredor de la 116; el checkpoint, en
    un worktree aparte (`../essb-docs-s117`) con commit en el principal.
  - **Resultado:** `A14` 🐛 cerrada sin nuevos; `A15` 🐛 cerrada (`R9-427`, P1); `A16` 🐛 (`R9-428`..`R9-431`,
    P2). Ninguno P0.
  - **Detalle:** `detail/A14-base-de-datos.md`, `detail/A15-audio-tts.md`, `detail/A16-busqueda.md`.
  - **Las lecciones:** el mock de Reanimated crea un `useSharedValue` nuevo en cada render y su `interpolate`
    devuelve `undefined`: un defecto de un valor animado que sobrevive no se ve sin darle la semántica real
    (un `useRef`). Y `node:sqlite` (Node 24) trae FTS5: el `BibleDatabase` real corre sobre
    `assets/bible-seed.db` en jest, con la entrada real.
- **Sesión 118 — 2026-11-02. El Modo A P1, la tercera tanda: `A17`, `A18`.** En un chat nuevo, con
  `_scratch/S118-PROMPT.md`, en la terminal, sin agentes. Solo docs.
  - **Cómo se trabajó:** lectura por rangos y cinco sondas de jest con el corredor de la 116, sobre los
    componentes reales; el checkpoint, en un worktree aparte (`../essb-docs-s118`) con commit en el principal.
  - **Resultado:** `A17` 🐛 (`R9-432`, P2; `R9-433`, P3); `A18` 🐛 (`R9-435`, `R9-436`, P2; `R9-434`, P3).
    Ninguno P0. `A19` sin empezar (PENDIENTE entera).
  - **Detalle:** `detail/A17-quiz.md`, `detail/A18-word-study.md`.
  - **Las lecciones:** una `key` por id solo reinicia el estado si el id cambia: un reinicio que puede repetir
    el id (una ronda re-barajada) deja el estado viejo, y se ve con `Math.random` sembrado y muchas rondas. Y en
    un componente que queda montado (una hoja con `visible`), un callback que termina tarde trae el cierre del
    render en que empezó.
- **Sesión 119 — 2026-11-02. El Modo A P1, la cuarta tanda: `A19`.** En el mismo chat que la 118 (Victor:
  «continúa»), con `_scratch/S119-PROMPT.md`, en la terminal, sin agentes. Solo docs.
  - **Cómo se trabajó:** lectura por rangos y dos sondas; la segunda monta Home entera (contextos con objetos
    estables, hijos de relleno, un `useFocusEffect` con la semántica de react-navigation). El checkpoint, en un
    worktree aparte (`../essb-docs-s119`) con commit en el principal.
  - **Resultado:** `A19` 🐛 (`R9-437`, `R9-438`, P2). Ninguno P0.
  - **Detalle:** `detail/A19-home.md`.
  - **La lección:** un `useFocusEffect(useCallback(…, deps))` con dependencias de menos corre, en cada foco, el
    cierre del render en que cambiaron: lo que viene de un contexto queda congelado, lo que se lee de la base
    no. Para verlo en jest, el mock del foco tiene que guardar el callback del último efecto, no el del render.
- **Sesión 120 — 2026-11-02/03. El Modo A P1, la quinta tanda: `A20` y `A21`.** En un chat nuevo, con
  `_scratch/S120-PROMPT.md`, en la terminal, con 2 agentes `fork` en worktree (los pidió Victor: «¿Podrías
  mandar 2 agentes?»; el mensaje pegado decía «sin agentes»). Solo docs.
  - **Cómo se trabajó:** reglas comunes en `_scratch/S120-agentes-reglas.md.txt`; el agente 1, `settings.tsx`
    entera y las secciones con escritura; el 2, `A21` entera y el resto de `src/components/settings`. Unos
    170k tokens y 47 llamadas cada uno, 5-6 min, sin cortes; los worktrees se borraron solos. Las tres sondas,
    re-medidas iguales en el principal. El checkpoint, en `../essb-docs-s120` con commit en el principal.
  - **Resultado:** `A20` 🐛 (`R9-439`, `R9-440`, `R9-441`, P3), `A21` ✅. Ninguno P0.
  - **Detalle:** `detail/A20-ajustes.md`, `detail/A21-onboarding.md`.
  - **La lección:** un refresco que cancela y vuelve a agendar con `await` en el medio, disparado por un efecto
    que puede correr dos veces seguidas, se pisa consigo mismo: cancelar no sirve si el otro todavía no agendó.
    Se ve en jest lanzando los dos refrescos sin esperar el primero.
- **Sesión 121 — 2026-11-03. El Modo A P1, la sexta tanda: `A22` y `A23`.** En un chat nuevo, con
  `_scratch/S121-PROMPT.md`, en la terminal, con 3 agentes `fork` en worktree (los pidió Victor: «¿Podrías
  mandar 3 agentes?»). Solo docs.
  - **Cómo se trabajó:** reglas comunes en `_scratch/S121-agentes-reglas.md.txt`; el agente 1, lo que comparte
    (`ShareService` y sus llamadores, la captura, los modales hermanos); el 2, `ImageShareModal` entero y lo que
    guarda; el 3, `A23` entera. Unos 165-180k tokens y 33-49 llamadas cada uno, 6-7 min, sin cortes; los
    worktrees se borraron solos. Las cuatro sondas, re-medidas iguales en el principal. El orquestador vio que
    el «nuevo» de guardar un estilo sin `catch` ya era `R9-416` (por la clave `compactStylePresetsStore`): va
    como nota. El checkpoint, en `../essb-docs-s121` con commit en el principal.
  - **Resultado:** `A22` 🐛 (`R9-442`, `R9-443`), `A23` 🐛 (`R9-444`..`R9-448`); todos P3, ninguno P0.
  - **Detalle:** `detail/A22-compartir.md`, `detail/A23-logros.md`.
  - **La lección:** lo que se revierte al perder el entitlement hay que revertirlo entero: el modal de imagen
    revierte tres de las cuatro cosas exclusivas y la cuarta (la plantilla) se comparte. Y lo que un servicio
    devuelve para celebrar se pierde si el llamador lo descarta (`R9-444`): la sonda mide el llamador, no solo
    el servicio.
- **Sesión 122 — 2026-11-03. El Modo A P1, la séptima tanda: `A24` y `A25`.** En el mismo chat que la 121, en la
  terminal, con 3 agentes `fork` en worktree (los pidió Victor: «¿Podrías continuar mandando otros 3
  agentes?»). Solo docs.
  - **Cómo se trabajó:** reglas comunes en `_scratch/S122-agentes-reglas.md.txt`; el agente 1, el diccionario
    como objeto y su tipado; el 2, lo que no pasa por el diccionario (literales, datos, formato); el 3, los
    colores fijos con daño de contraste, calculado con los temas reales. Unos 300k tokens y 54-66 llamadas cada
    uno, 8-9 min, sin cortes; los worktrees se borraron solos. Las sondas de los hallazgos, re-medidas iguales en
    el principal. El checkpoint, en `../essb-docs-s122` con commit en el principal.
  - **Resultado:** `A24` 🐛 (`R9-449`..`R9-453`), `A25` 🐛 (`R9-454`..`R9-456`); dos P2, el resto P3; ninguno P0.
  - **Detalle:** `detail/A24-i18n.md`, `detail/A25-theming.md`.
  - **La lección:** en las filas transversales, el barrido da la lista y la sonda el daño: un diccionario sano
    (tipado contra ES, paridad, tokens) no impide los textos que lo esquivan (`plan.name` en vez del localizado,
    un PDF armado aparte), y un tema que pasa su prueba de contraste como TEXTO puede fallar como FONDO de una
    tinta fija (`R9-454`).

- **Sesión 113 — 2026-10-27. Arreglo de lo que la 112 midió con daño; el ciclo de las pruebas de la Mesa
  se cierra.** En un chat nuevo, con `_scratch/S113-PROMPT.md`, en la terminal, con 6 agentes en
  worktree que midieron los diseños antes de escribirlos (los pidió Victor: «Podrías mandar 6 agentes para
  avanzar más?»).
  - **Cómo se trabajó:** `_scratch/S113-sonda.cjs.txt` (de `S113-gen.cjs.txt`, sobre `S112-sonda`, con un
    re-anclado); tres entradas en seis tareas, por camino y por store, en regiones distintas del archivo;
    los seis diseños aplicados en serie y commiteados de a uno; la matriz de la 112 sobre la punta
    (`S113-matriz.cjs.txt`).
  - **Resultado:** cerrados `R9-406`, `R9-407` y `R9-408`; ninguno nuevo. Los costos del arreglo, escritos
    sin número en `R9-408`. El ciclo queda cerrado (§7); lo siguiente es `A12` (la 114). No queda ningún P0
    abierto.
  - **Detalle: `detail/S113-arreglo-de-s112.md`.**

- **Sesión 99 — 2026-10-14. Arreglo de lo de la 98.** En un chat nuevo, en la terminal, con 12
  agentes en worktree que solo midieron (los pidió Victor: 15, y después 12); con
  `_scratch/S99-PROMPT.md` y el alcance ampliado a los pendientes de la 98.
  - **Cómo se trabajó:** los 12 se lanzaron sobre `08da00b` antes de escribir los arreglos: cada uno
    armó y midió (o atacó) el diseño que le dio el orquestador, que escribió la rama con lo medido
    (`54bb2f3`, `5aa5c96`). Todo re-medido en el árbol principal con `_scratch/S99-sonda.cjs.txt`
    (de `S99-gen.cjs.txt`); la matriz, con `S99-matriz.cjs.txt`. El límite de sesión cortó al agente
    8 (y al chat) hasta el reset; se lo retomó con `SendMessage`.
  - **Resultado:** cerrados `R9-340`, `R9-342`..`R9-345`, y `R9-346` y `R9-347` (nuevos; el
    segundo, en parte). No queda ningún P0 abierto.
  - **Detalle: `detail/S99-arreglo-de-s98.md`.**
  - **Las lecciones:** medir los diseños antes de escribirlos rindió cinco verdes falsos; las
    llamadas de una clave se cuentan en una corrida limpia; un argumento nuevo en una llamada larga
    re-sangra todo su cuerpo y rompe las anclas; para «cuándo se toma», se retiene la última parte
    del trabajo; un hueco de las pruebas se cierra en las pruebas.

- **Sesión 98 — 2026-10-13. Revisión del diff de la 97.** En un chat nuevo, en la terminal, con 3
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S98-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** A1 midió las pruebas de la 97, A2 el código y los comentarios, y A3 la
    matriz, las piezas re-ancladas y `R9-340`. Todo re-medido en el árbol principal con
    `_scratch/S98-sonda.cjs.txt` (de `S98-gen.cjs.txt`); la comparación de la matriz, con
    `S98-matriz.cjs.txt`. A mitad de la sesión, `--maxWorkers=3` por la memoria.
  - **Resultado:** cuatro nuevos P3 (`R9-342`..`R9-345`); `R9-340`, medido y sin arreglar. No queda
    ningún P0 abierto.
  - **Detalle: `detail/S98-revision-del-diff-s97.md`.**
  - **Las lecciones:** un «por lectura» que dice «cambia los datos» se mide con los datos que no los
    cambian; la regla de la 95 baja a las partes de cada paso y vale para cada prueba que espera el
    trabajo; al reescribir media oración, se mide la oración entera; una pieza re-anclada conserva lo
    que el arreglo agregó en su ancla; jest levanta 31 workers por corrida.

- **Sesión 97 — 2026-10-13. Arreglo de lo de la 96.** En el mismo chat que la 96, en la terminal,
  con 3 agentes en worktree que solo midieron (los pidió Victor); con el plan de
  `_scratch/S97-PROMPT.md`.
  - **Cómo se trabajó:** los arreglos, commiteados primero (`dd1a7b6` código y pruebas, `307b654`
    comentarios); sobre ellos, A1 midió las pruebas, A2 los comentarios y la garantía de
    `R9-336`, y A3 la matriz. Lo que vieron, corregido en `12cc4b4` y `5ee4460`. Todo re-medido en
    el árbol principal con `_scratch/S97-sonda.cjs.txt` (de `S97-gen.cjs.txt`); la matriz, con
    `S97-matriz.cjs.txt`.
  - **Resultado:** cerrados 7 (`R9-334`..`R9-339`, y `R9-341`, nuevo); `R9-340`, sin arreglar. No
    queda ningún P0 abierto.
  - **Detalle: `detail/S97-arreglo-de-s96.md`.**
  - **Las lecciones:** un gancho con nombre dice la clase del pedido, y si la prueba espera uno
    concreto, el nombre dice cuál; la 97 repitió en sus pruebas nuevas tres reglas de §5 que tenía;
    una pieza con un plazo real más largo que la corrida cuelga jest.

- **Sesión 96 — 2026-10-13. Revisión del diff de la 95.** En un chat nuevo, en la terminal, con 3
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S96-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** A1 midió las 12 pruebas nuevas, A2 el gancho con nombre y los comentarios,
    y A3 `R9-331` y la matriz entera. Todo re-medido en el árbol principal con
    `_scratch/S96-sonda.cjs.txt` (de `S96-gen.cjs.txt`); la matriz, con `S96-matriz.cjs.txt`.
  - **Resultado:** lo de la 95 se sostiene como código. Siete nuevos P3 (`R9-334`..`R9-340`), seis
    abiertos por la 95. Una afirmación del agente 3 no se sostuvo en el principal (`notaLenta50` y
    `R9-274`). `R9-330`, pendiente con el OK de Victor. No queda ningún P0 abierto.
  - **Detalle: `detail/S96-revision-del-diff-s95.md`.**
  - **Las lecciones:** las reglas de controles y esperas de §5 se pasan como lista a cada prueba
    nueva; una promesa que esperan todos hace de una garantía local una de todos; una frase en
    singular sobre algo que puede pasar varias veces se mide con varias; el `grep` de la regla de la
    92 entra en `__tests__/`; la salida de la sonda se nombra por corrida y modo, no por los
    argumentos de jest.

- **Sesión 95 — 2026-10-13. Arreglo de lo de la 94.** En un chat nuevo, en la terminal, con 3
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S95-PROMPT.md`.
  - **Cómo se trabajó:** los arreglos, commiteados primero (`3084a4c` las pruebas, `3b47ff8` los
    comentarios, `77418b4` `R9-331`); sobre ellos, A1 midió las pruebas nuevas, A2 los comentarios y
    `R9-331`, y A3 `R9-330` y la matriz entera. Lo que vieron, corregido en `f02c798`. Todo
    re-medido en el árbol principal con `_scratch/S95-sonda.cjs.txt` (de `S95-gen.cjs.txt`;
    `S95-lote1..10.out.txt`).
  - **Resultado:** cerrados 10 (`R9-298`, `R9-323`..`R9-329`, `R9-331`, `R9-332`); nuevo `R9-333`
    (P3); `R9-330`, a decidir. No queda ningún P0 abierto.
  - **Detalle: `detail/S95-arreglo-de-s94.md`.**
  - **Las lecciones:** un arreglo que cambia CUÁNDO se toma un valor re-mide las frases que dicen
    cuándo; la prueba de un arreglo que espera un trabajo se arma para cada parte de ese trabajo; un
    control por clave no ve las colas que hay delante del turno.

- **Sesión 94 — 2026-10-13. Revisión del diff de la 93.** En un chat nuevo, en la terminal, con 10
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S94-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** A1 solo comentarios; A2-A5 cada frase nueva hecha pieza; A6 `R9-323` y su
    prueba; A7 el detalle de la 93; A8 sus lecciones; A9 la regla de la 92 desde cero; A10 lo que la
    93 dejó por lectura. Todo re-medido en el árbol principal con `_scratch/S94-sonda.cjs.txt` (de
    `S94-gen.cjs.txt`; cinco lotes, `S94-lote1..5.out.txt`).
  - **Resultado:** lo de la 93 se sostiene como código. 8 nuevos, P3 (`R9-324`..`R9-331`), ninguno
    abierto por la 93; `R9-323` y `R9-298` ampliados; dos citas del detalle de la 93, corregidas. No
    queda ningún P0 abierto.
  - **Detalle: `detail/S94-revision-del-diff-s93.md`.**
  - **Las lecciones:** un «por lectura» del detalle es un riesgo sin sonda; una regla que la sesión
    escribe se mide primero contra lo que esa sesión escribió; un «benigno» se re-mide con un caso
    hecho para la pieza.

- **Sesión 93 — 2026-10-13. Arreglo de lo de la 92.** En un chat nuevo, en la terminal, con 3
  agentes en worktree que solo midieron (Victor pidió 6; se le recordó la 37 y eligió 3); con
  `_scratch/S93-PROMPT.md`.
  - **Cómo se trabajó:** el comentario, commiteado primero (`8dd8c92`); sobre él, A1 midió como
    código cada lectura literal de las frases nuevas, A2 que fuera solo comentarios y el `grep` de la
    regla de la 92, y A3 «¿abre algo?» camino por camino. Todo re-medido en el árbol principal con
    `_scratch/S93-sonda.cjs.txt` (de `S93-gen.cjs.txt`, más `S93-edita.cjs.txt`).
  - **Resultado:** cerrado `R9-322`. Nuevo `R9-323` (P3, una prueba que falta; no lo abrió la 93).
    No queda ningún P0 abierto.
  - **Detalle: `detail/S93-arreglo-r322.md`.**
  - **La lección:** una lectura al pie de la letra que pasa todas las pruebas no es inocua por eso:
    medí su daño con un caso hecho para ella.

- **Sesión 92 — 2026-10-13. Revisión del diff de la 91.** En un chat nuevo, en la terminal, con 3
  agentes en worktree que solo midieron (los pidió Victor); con `_scratch/S92-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** A1 midió como ganchos las lecturas literales de las frases nuevas; A2 buscó
    otro caso de clave pedida distinta de la escrita, y las otras frases que definen lo mismo; A3
    revisó el diff y el detalle de la 91. Todo re-medido en el árbol principal con
    `_scratch/S92-sonda.cjs.txt` (de `S92-gen.cjs.txt`).
  - **Resultado:** lo de la 91 se sostiene. Nuevo `R9-322` (P3, el comentario de `prepKey`). No
    queda ningún P0 abierto.
  - **Detalle: `detail/S92-revision-del-diff-s91.md`.**
  - **La lección:** una frase que corrige una definición busca las otras que definen lo mismo. La 91
    corrigió «the key it writes» y dejó, 26 líneas más arriba, la de `prepKey`, que dice lo
    contrario para el mismo caso.

- **Sesión 91 — 2026-10-12. Arreglo de lo de la 90.** En el mismo chat (lo pidió Victor), en la
  terminal y sin agentes; con `_scratch/S91-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S91-sonda.cjs.txt` (la `S90-sonda`), sobre el commit que se
    mergea.
  - **Resultado:** cerrado `R9-321` (`3bccafd`, solo comentarios). Ninguno nuevo. No queda ningún
    P0 abierto.
  - **Detalle: `detail/S91-arreglo-r321.md`.**
  - **La lección:** ninguna nueva (la de la 90, aplicada).

- **Sesión 90 — 2026-10-12. Revisión del diff de la 89.** En el mismo chat que la 89 (lo pidió
  Victor), en la terminal y sin agentes; con `_scratch/S90-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** `_scratch/S90-sonda.cjs.txt` (la `S89-sonda`, más `<gen>V`,
    `turnoAntesDeClaveVieja` y `etiquetaDesviada`).
  - **Resultado:** lo de la 89 cae como dice. Nuevo `R9-321` (P3, un comentario). No queda ningún
    P0 abierto.
  - **Detalle: `detail/S90-revision-del-diff-s89.md`.**
  - **La lección:** un comentario que describe un dato es una definición: medí un cambio que la
    siga al pie de la letra. Y una deducción sobre el orden se mide antes de decirla.

- **Sesión 89 — 2026-10-12. Arreglo de lo de la 88.** En un chat nuevo, en la terminal y sin
  agentes; arrancó con `_scratch/S89-PROMPT.md`.
  - **Cómo se trabajó:** `_scratch/S89-sonda.cjs.txt` (la `S88-sonda` con las anclas re-escritas
    sobre el árbol nuevo, más `pa<sha>`, `sinEtiqueta`, `ajenoAmbasTardeK` y el modo `anclas`), y
    `_scratch/S89-orden.cjs.txt` (el orden de las microtareas, con el `oneAtATime` de hoy).
  - **Resultado:** cerrado `R9-320` (`538b1bc`). Ninguno nuevo. No queda ningún P0 abierto.
  - **Detalle: `detail/S89-arreglo-r320.md`.**
  - **La lección:** que una prueba caiga por OTRO caso no cierra el hueco del primero. Un residuo se
    mide en cada caso que lo lee, con la pieza hecha para ese caso.

- **Sesión 88 — 2026-10-12. Revisión del diff de la 87.** En un chat nuevo, en la terminal y sin
  agentes; arrancó con `_scratch/S88-PROMPT.md`. Solo docs.
  - **Cómo se trabajó:** `_scratch/S88-sonda.cjs.txt` (la `S87-sonda`, más `ajeno`, `ajenoTardeK`,
    `ajenoClaveTardeK`, `cuentaAlReset` y las hipótesis `delta` y `porClave`), y
    `_scratch/S88-orden.cjs.txt` (el orden de las microtareas, fuera de jest, con su control).
  - **Resultado:** lo de la 87 cae como dice. Nuevo `R9-320` (P3 de pruebas). No queda ningún P0
    abierto.
  - **Detalle: `detail/S88-revision-del-diff-s87.md`.**
  - **La lección:** un contador compartido no dice de quién es lo que cuenta. Un control que lee un
    registro compartido dice de quién es lo que cuenta, y se corre con algo ajeno en la ventana. Y
    un riesgo que el detalle nombra «sin sonda» es lo primero que se mide.

- **Sesión 43 — 2026-10-02. Revisión del diff de la 42.** Solo en la terminal, sin agentes y sin
  tocar código; arrancó con `_scratch/S43-PROMPT.md`.
  - **Cómo se trabajó:** una sonda por pregunta (`_scratch/S43-sondas*.body.txt`), cada una con su
    control en el mismo `it`; las piezas y cuatro hipótesis en `S43-piezas.cjs.txt`; cada «¿de la
    42?» medido con el motor de `e9d6e89` (`S43-motor.cjs.txt`).
  - **Resultado:** 4 nuevos (`R9-247`..`R9-250`); `R9-245`, diagnosticado; `R9-246`, con sus dos
    sondas. Queda 1 P0 abierto.
  - **Detalle: `detail/S43-revision-del-diff-s42.md`.**
  - **Las lecciones:**
    - **una reversión es también una entrega de la nube:** vuelve a la copia del servidor, que puede
      ser del otro (`R9-247`);
    - **una escritura que el rechazo descarta deja de ser «mía» antes de que llegue su reversión**
      (`R9-248`);
    - **un arreglo de un hecho del servidor no se guarda con `isCurrent()`** (`R9-249`);
    - **un reloj viejo en una escritura propia rompe toda premisa de «más nueva que lo local»**
      (`R9-245`).

- **Sesión 42 — 2026-10-02. Arreglos de lo de la 41.** Solo en la terminal, sin agentes; arrancó
  con `_scratch/S42-PROMPT.md`.
  - **Cómo se trabajó:** un commit por hallazgo en `fix/s42-arreglos-s41`, cada prueba vista caer
    con su pieza (`_scratch/S42-piezas.cjs.txt`) sobre la base de su commit, por la consecuencia y
    contra su control (+1 ms); `R9-243` medido antes de diseñar; la matriz entera en un worktree
    aparte.
  - **Resultado:** 5 cerrados, 2 nuevos (`R9-245`, `R9-246`). Queda 1 P0 abierto.
  - **Detalle: `detail/S42-arreglos-s41.md`.**
  - **Las lecciones:**
    - **una hipótesis que cierra la sonda puede no cerrar el caso que nombra la entrada**
      (`H239join` y `R9-234`);
    - **una decisión tomada con un veredicto que puede estar mal no se guarda sin lo que permite
      corregirla** (la retirada con la tabla ilegible, `R9-208`);
    - **una herramienta que restaura una base la restaura también cuando falla** (`S41-motor`).

- **Sesión 41 — 2026-10-01/02. Revisión del diff de la 40.** Solo en la terminal, sin agentes y sin
  tocar código; arrancó con `_scratch/S41-PROMPT.md`.
  - **Cómo se trabajó:** una sonda por pregunta (`_scratch/S41-sondas*.body.txt`), las piezas de lo
    que mira `isOwnCopy` y dos hipótesis en `S41-piezas.cjs.txt`, cada «¿de la 40?» medido con el
    motor de `0b84a7e` (`S41-motor.cjs.txt`), y el SDK web leído desde su source map.
  - **Resultado:** 3 nuevos (`R9-242`..`R9-244`); `R9-234`, medido. Queda 1 P0 abierto.
  - **Detalle: `detail/S41-revision-del-diff-s40.md`.**
  - **Las lecciones:**
    - **una pieza que no se aplicó da «sin daño»:** la primera tanda corrió con `S34_PIEZAS` relativa;
    - **«hace falta mientras X espera, no después de su ack» tiene que preguntar qué otros acks pasan
      mientras X espera** (`R9-242`);
    - **toda retirada que corre al procesar tiene el problema de `Fresolve`** (`R9-243`);
    - **un `fire` del mock con los datos de la nube y nada en vuelo es un evento que el SDK no
      levanta** (`R9-244`).

- **Sesión 40 — 2026-10-01. Arreglos de lo de la 39.** Solo en la terminal, sin agentes; arrancó
  con `_scratch/S40-PROMPT.md`.
  - **Cómo se trabajó:** un commit por hallazgo en `fix/s40-arreglos-s39`, cada prueba vista caer
    con su pieza (`_scratch/S40-piezas.cjs.txt`) sobre la base de su commit; las hipótesis de
    `R9-239` y de `Fresolve` medidas antes de decidir; la matriz entera en un worktree aparte.
  - **Resultado:** 5 cerrados (`R9-229` entero), 1 nuevo (`R9-241`). Queda 1 P0 abierto.
  - **Detalle: `detail/S40-arreglos-s39.md`.**
  - **Las lecciones:**
    - **una sonda puede dejar de mostrar su daño por un arreglo hermano de la misma sesión:**
      `S39-4` y `S39-5` usaban un respaldo de W2, que `R9-239` dejó sin sello;
    - **una guarda que «el eco siempre cubre» se mide con el eco esperando en la cadena:**
      `Fresolve` decide entre el ack y el proceso del eco;
    - **antes de afirmar una propiedad del SDK, leé también el envoltorio propio** (`firestore.ts`).

- **Sesión 39 — 2026-10-01. Revisión del diff de la 38.** Solo en la terminal, sin agentes y sin
  tocar código; arrancó con `_scratch/S39-PROMPT.md`.
  - **Cómo se trabajó:** una sonda por pregunta del prompt (`_scratch/S39-sondas*.body.txt`), cada
    «¿de la 38?» medido con el motor de la 36 entero (`S39-motor.cjs.txt`), y las guardas de
    `R9-236` con sus piezas (`S39-piezas.cjs.txt`).
  - **Resultado:** 4 nuevos (`R9-237`..`R9-240`); `R9-236` y la mitad abierta de `R9-229`, medidos.
    Queda 1 P0 abierto.
  - **Detalle: `detail/S39-revision-del-diff-s38.md`.**
  - **Las lecciones:**
    - **una premisa que dice «sin X entre medias» tiene que preguntar si el caso mismo es X:** el
      respaldo del otro es la copia ajena, y trae mi reloj;
    - **«el ack» tiene dos relojes**, el del SDK y el de la continuación del motor;
    - **dos guardas que se cubren entre ellas dan 0 cada una en la matriz**, y juntas pueden ser la
      causa de un daño.

- **Sesión 38 — 2026-10-01. Arreglos de lo de la 37.** Solo en la terminal, sin agentes; arrancó
  con `_scratch/S38-PROMPT.md`.
  - **Cómo se trabajó:** `R9-221` primero (el mock), y con él re-medidas las piezas de `R9-216`
    antes de tocar el motor; un commit por hallazgo en `fix/s38-arreglos-s37`, cada prueba vista
    caer con su pieza (`_scratch/S38-piezas.cjs.txt`) o con el motor del commit anterior; tres
    hipótesis medidas para `R9-220`/`R9-222`; la matriz entera en un worktree aparte.
  - **Resultado:** 12 cerrados, `R9-227` decidido, `R9-229` a medias, 3 nuevos (`R9-234`,
    `R9-235`, `R9-236`). Queda 1 P0 abierto.
  - **Detalle: `detail/S38-arreglos-s37.md`.**
  - **Las lecciones:**
    - **una hipótesis que dice «deja de valer» necesita que algo haya empezado a valer:** la de A1
      no podía cerrar el eco que nunca se anotó;
    - **el orden de llegada y el de proceso son dos relojes:** con la cadena de lotes, se decide al
      llegar;
    - **una sonda que deja de mostrar el daño tras un arreglo puede haberlo esquivado:** la de A5
      dejó de construir su caso.

- **Sesión 37 — 2026-10-01. Revisión del diff de la 36.** Solo en la terminal, sin tocar código;
  arrancó con `_scratch/S37-PROMPT.md`, con 7 agentes en worktree que solo midieron (Victor pidió 4
  y después 3 más) y la matriz en otro worktree. La cuota se agotó antes del checkpoint, y lo terminó
  un chat nuevo, sin agentes, con `_scratch/S37b-PROMPT.md`.
  - **Cómo se trabajó:** cada agente con su sonda sobre `657e993` y, si algo «lo abrió la 36», otra
    con la pieza revertida (`S36-piezas.cjs.txt`). El chat del checkpoint cotejó cada informe con sus
    salidas y re-corrió en el árbol principal `R9-221`, la ruta (a) de `R9-222` y `R9-223`.
  - **Resultado:** 14 hallazgos P3 (`R9-220`..`R9-233`). Matriz 136/136 igual a la 36. Queda 1 P0
    abierto.
  - **Detalle: `detail/S37-revision-del-diff-s36.md`.**
  - **Las lecciones:**
    - **una propiedad del mock que el arreglo usa por primera vez hay que compararla con el SDK
      antes de medir:** la identidad del objeto de `R9-216` es una que el mock da y RNFirebase no;
    - **el orden de AsyncStorage también es del SDK:** es serial, y la prueba de `R9-215` dependía
      de un orden que el teléfono no produce;
    - **7 agentes a la vez más la matriz agotan la cuota antes del checkpoint.**

- **Sesión 36 — 2026-10-01. Arreglos de lo de la 35.** En el mismo chat que la 35 (Victor:
  «continúa por favor»), solo en la terminal y sin agentes.
  - **Cómo se trabajó:** cada prueba sale de una sonda de la 35 y se vio fallar sobre el código sin
    arreglar; un commit por hallazgo; el revert por pieza con `_scratch/S36-piezas.cjs.txt`, re-medido
    en el árbol combinado; la matriz entera (`S36-matriz.cjs.txt`) en un worktree aparte.
  - **Resultado:** 5 cerrados (`R9-215`..`R9-219`), ninguno nuevo. Queda 1 P0 abierto.
  - **Detalle: `detail/S36-arreglos-s35.md`.**
  - **Las lecciones:**
    - **una hipótesis sobre «el eco» tiene que saber CUÁNDO llega el eco:** el SDK lo entrega antes
      del ack, con la escritura en cola; anotarlo solo con el reloj ya tomado no cerraba nada;
    - **una prueba con el estado sembrado tiene que sembrar también la nube:** sin «lo suyo» en la
      nube, el eco asentaba el conflicto antes del ack y la prueba no llegaba al caso;
    - **los heredocs con barras rompen cualquier archivo**, no solo `SyncEngine.ts`: esta vez, un
      archivo de piezas.

- **Sesión 35 — 2026-09-30. Revisión del diff de la 34.** Solo en la terminal, sin agentes, sin
  tocar código; arrancó con `_scratch/S35-PROMPT.md`.
  - **Cómo se trabajó:** cada pregunta del prompt, con una sonda sobre el código de hoy y, si algo
    «lo abrió la 34», otra con la pieza revertida (`_scratch/S34-rev.cjs.txt` sobre
    `S35-SyncEngine-base.ts.txt`); la matriz entera en un worktree aparte, comparada pieza por pieza
    con la de la 34; las piezas de `R9-210` aparte.
  - **Resultado:** 5 hallazgos P3 (`R9-215`..`R9-219`), todos de la 34. Queda 1 P0 abierto.
  - **Detalle: `detail/S35-revision-del-diff-s34.md`.**
  - **Las lecciones:**
    - **un estado que el arreglo agrega para coordinar tiene que terminar con la sesión:**
      `ownRereading` sobrevivía al `stop()` y tapaba la relectura de la sesión siguiente (`R9-215`);
    - **una sola respuesta a «¿es mía?» también responde «mía» donde no debe:** por `updatedAt`, el
      eco tardío y un respaldo restaurado son la misma copia (`R9-216`);
    - **una prueba que filtra su aserción a un doc puede esconder el coste aceptado en otro:** el
      fantasma de doc-d aparecía en el mismo proceso que la prueba (`R9-217`);
    - **una pieza que pasa de 0 a N señala la premisa que cambió:** `+heldAt` cae porque la sesión
      degradada mueve la marca a una copia propia (`R9-219`).

- **Sesión 34 — 2026-09-30/10-01. Arreglos de lo de la 33.** Solo en la terminal; a pedido de
  Victor, 3 agentes en worktree que solo midieron. Arrancó con `_scratch/S34-PROMPT.md`.
  - **Cómo se trabajó:**
    - A1 midió `R9-208`, A2 `R9-207` y A3 `R9-210`; el orquestador arregló `R9-209`;
    - el orquestador integró cada diff en su commit y re-midió las piezas de cada agente en su
      árbol (corolario 43), con los mismos conteos;
    - después, la matriz entera en un worktree aparte.

    A1 se cortó por el límite en su último paso, sin pérdida: todo estaba en disco.

  - **Resultado:** 4 cerrados; 4 nuevos que ya existían (`R9-211`..`R9-214`). Queda 1 P0 abierto.
  - **Detalle: `detail/S34-arreglos-s33.md`.**
  - **Las lecciones:**
    - **un control escrito en un prompt también es una afirmación:** `grep -c $'\x00'` contaba
      líneas, no bytes NUL (bash no puede guardar un NUL en una cadena);
    - **una pieza sin prueba que no es equivalente pide la prueba, no que se la quite:** el
      `initialize()` de `R9-210` no tenía ninguna, y la sonda S9 del agente pasó a ser la prueba;
    - **una sonda de partida puede no reproducir la variante que nombra:** la `reemplaza` de la 33
      no reemplazaba;
    - **cada arreglo que reescribe código de otro rompe anclas de la matriz** (corolario 41):
      `R9-208` dejó AUSENTES cuatro piezas de `R9-193`.

- **Sesión 33 — 2026-09-30. Revisión del diff de la 32.** Solo en la terminal, sin agentes, sin
  tocar código; arrancó con `_scratch/S33-PROMPT.md`.
  - **Cómo se trabajó:** las piezas leídas una por una; cada hipótesis, con una sonda sobre el código
    de hoy y otra con la pieza de la 32 revertida (`_scratch/S33-rev.cjs.txt`); la matriz entera en
    un worktree aparte, comparada pieza por pieza (`_scratch/S33-comparar.cjs.txt`).
  - **Resultado:** 4 hallazgos P3 (`R9-207`..`R9-210`); las preguntas de la 32 respondidas. Queda 1
    P0 abierto.
  - **Detalle: `detail/S33-revision-del-diff-s32.md`.**
  - **Las lecciones:**
    - **un sello que viaja en la entrada de la cola se va con ella:** «¿es mía esta copia?» tiene
      que valer mientras su eco pueda llegar, no mientras la entrada espere (`R9-207`);
    - **cuando un arreglo agrega una pregunta a una rama, la rama vecina es lo primero que hay que
      mirar:** con copia local sí, sin copia local no (`R9-209`);
    - **una tabla cargada vacía por un error de lectura se guarda como si fuera la verdad:** es
      `R9-195` otra vez, ahora en los sellos (`R9-208`);
    - **«el arreglo empeora X» se mide contra la pieza revertida:** la pérdida de 3a ya ocurría sin
      C4, solo más tarde.

- **Sesión 31 — 2026-09-30. Revisión del diff de la 30.** Solo en la terminal; a pedido de Victor,
  3 agentes en worktree que solo midieron.
  - **Cómo se trabajó:**
    - A1 revisó `R9-190`/`R9-186`/`R9-191` y sus pruebas; A2, `R9-182`..`R9-184` y portó P2/P3 de
      `R9-192`; A3 midió el diseño unificado de `R9-193`;
    - el orquestador corrió la matriz entera en un worktree aparte, leyó cada diff contra su informe
      y re-midió cada sonda, hipótesis y tabla en su árbol (corolario 43).
  - **Resultado:** 11 nuevos (`R9-195`..`R9-205`), ninguno P0; las decisiones de `R9-192` y `R9-193`
    registradas, con sus hipótesis medidas para la 32.
  - **Detalle: `detail/S31-revision-del-diff-s30.md`.**
  - **Las lecciones:**
    - **una hipótesis escrita en una decisión es una hipótesis:** el sello en la entrada de la cola,
      solo, no cierra la ventana; la cierra la cola y la tabla en un solo `multiSet`;
    - **un prompt que nombra la palabra y no la línea** apuntó al `fromRead` equivocado: lo corrigió
      quien midió;
    - **un orden de arranque puede tapar la prueba que dice probar un caso** (`R9-198`/`R9-200`).

- **Sesión 30 — 2026-09-29. Arreglos de lo de la 29 (y de la 28).** Solo en la terminal; a
  pedido de Victor, 3 agentes en worktree que solo midieron.
  - **Cómo se trabajó:**
    - un commit por hallazgo, cada prueba vista fallar con su pieza revertida
      (`_scratch/S30-matriz.cjs.txt`);
    - `R9-186` se midió antes de elegir (retener sin releer contra releer en el próximo enganche);
    - A1 midió `R9-182`..`R9-184`; A2 buscó romper los arreglos nuevos; A3 midió el reloj atrasado;
    - cada diff de agente se leyó contra su informe y cada pieza se re-midió en el árbol propio;
    - la matriz entera, en un worktree aparte.
  - **Resultado:** 9 cerrados (`R9-182`..`R9-188`, `R9-190`, `R9-191`); 4 nuevos abiertos
    (`R9-189`, `R9-192`..`R9-194`); notas en `R9-126`, `R9-164`, `R9-174` y `R9-177`.
  - **Detalle: `detail/S30-arreglos-de-la-29.md`.**
  - **Las lecciones:**
    - **un arreglo de la sesión abrió su propio vecino** (`R9-190`): ante una marca que se mueve a
      «la copia que encontró la lectura», preguntá de quién puede ser esa copia;
    - **un comentario que compara dos modos de fallo es una afirmación** (`R9-191`);
    - **una pieza que caía en el worktree del agente puede no caer en el propio,** si allí la
      exponían otras piezas que no se integraron: re-medir, no copiar la tabla.

- **Sesión 29 — 2026-09-29. Revisión del diff de la 28.** Solo en la terminal, sin agentes.
  - **Cómo se trabajó:**
    - las 7 preguntas de Victor, cada una medida;
    - la matriz de la 28 más 17 piezas, en un worktree aparte;
    - una sonda de 4 escenarios, con la guarda de `R9-176` puesta, quitada y sin `settle`, y con
      una hipótesis de arreglo;
    - el mock con un `__fire` fiel al SDK;
    - el código nativo de RNFB y el SDK de JS, leídos en `node_modules`.
  - **Resultado:** ningún P0; 4 hallazgos P3 (`R9-185`..`R9-188`) y notas en `R9-177` y `R9-182`.
  - **Detalle: `detail/S29-revision-del-diff-s28.md`.**
  - **Las lecciones:**
    - **dos arreglos del mismo diff, otra vez (corolario 4):** una guarda que hace `settle` puede
      soltar la marca que el otro arreglo acaba de hacer durable;
    - **«decide el eco» tiene que decir qué pasa si el eco no llega, o si llega y lo revierten;**
    - **un plazo del motor no es un plazo del SDK:** suelta el `await`, no el ejecutor nativo.

- **Sesión 27 — 2026-09-28. Revisión del diff de la 26.** Solo en la terminal; solo revisión.
  - **Cómo se trabajó:**
    - el orquestador verificó el CI en el log y re-midió la matriz entera;
    - 3 agentes en worktree, a pedido de Victor: A1 revisó las afirmaciones y el mock contra el SDK,
      A2 el otro lote y el usuario durante la lectura, y A3 la resolución de conflictos durante la
      lectura;
    - el orquestador verificó a mano lo portante de cada informe: el código, la fuente de RNFB y las
      salidas.
  - **Resultado:** 7 hallazgos nuevos (`R9-175`..`R9-181`): 1 P2 y 6 P3. Queda 1 P0 abierto.
  - **Detalle: `detail/S27-revision-del-diff-s26.md`.**
  - **Las lecciones:**
    - **«¿quién más escribe mientras el caso espera?» rindió otra vez**, y la respuesta estaba en el
      SDK nativo: el hilo único de RNFB decide qué órdenes son posibles;
    - **un mock que no entrega el eco propio decide la pregunta por el SDK** (corolario 35, por otra
      puerta);
    - **una justificación de diseño se comprueba como una afirmación.**

- **Sesión 26 — 2026-09-28. `R9-124` en Modo C, y su arreglo.** Solo en la terminal: el crédito de
  la nube se terminó el 2026-09-24.
  - **Cómo se trabajó:**
    - una sonda en el emulador `Pixel_9_Pro` (con la receta de `R9-104`: una ruta temporal, una
      instancia secundaria de Firebase y la limpieza verificada desde fuera);
    - el arreglo en `fix/review-s26-removed` (`34de18f`), con el OK de Victor sobre el diseño;
    - el revert pieza por pieza con un script de reemplazo exacto, y la matriz entera de guardas.
  - **Resultado:** `R9-124` ✅. Queda 1 P0 abierto (`R9-38`). `R9-164` cerró su mitad «en vivo».
  - **Detalle: `detail/S26-r9124-modo-c-y-arreglo.md`.**
  - **Las lecciones:**
    - **el contenido de un `removed` no dice qué pasó:** el SDK entrega la última versión que
      casaba, y `exists: true` también para un borrado de verdad;
    - **una guarda que ninguna prueba vigila se mide antes de quedarse:** la mitad «en memoria» era
      equivalente por construcción, y se quitó.

- **Sesión 25 — 2026-09-24. Revisión del diff de la 24, en la nube.** Solo revisión: no se tocó
  código.
  - **Cómo se trabajó:**
    - 2 sesiones de Claude Code en la nube, cada una con su mitad del diff;
    - cada una entregó su informe en una rama `review/s25-*`, que nunca se mergea;
    - el orquestador bajó los informes a `_scratch`, verificó cada P0/P1 con sonda propia en la
      máquina de Victor y borró las ramas.
  - **Resultado:** 14 hallazgos nuevos (`R9-160`..`R9-173`): 2 P0, 1 P1, 4 P2 y 7 P3.
  - **Segunda parte, los arreglos:** con el OK de Victor, dos sesiones en la nube arreglaron
    `R9-160`+`R9-161`+`R9-162` y `R9-166`, en archivos distintos. El orquestador las revisó en local
    pieza por pieza (28 de 29 piezas discriminan), las apiló y mergeó con el OK: `main` =
    `cf7c715`. Se agregó `R9-174` (P3). Quedan 2 P0 abiertos.
  - **Detalle: `detail/S25-revision-del-diff-s24.md`.**
  - **Las lecciones:**
    - **un arreglo puede crear el caso que su premisa niega**: «lo local de ahora es lo mío» es
      falso cuando lo cambió el LWW del otro teléfono (`R9-160`);
    - **después de apilar, hay que re-medir la matriz entera**: la guarda de una tanda tapó en las
      pruebas la de la anterior (`R9-162`).

- **Sesión 24 — 2026-09-23/24. ARREGLOS en la nube.** Es la opción (c).
  - **Cómo se trabajó:** con el crédito de sesiones en la nube, cada arreglo lo hizo una sesión de
    Claude Code en la nube, en su rama, con un prompt que llevaba las reglas de la sección 5. El
    orquestador revisó cada rama en la máquina de Victor:
    - `npm run validate`;
    - el revert por pieza, con un script de reemplazo exacto;
    - apilar las ramas y compararlas con `cmp`;
    - pedir el OK, hacer el fast-forward y verificar el CI en el log.
  - **Resultado:** 11 hallazgos cerrados, entre ellos 3 P0 (`R9-125`, `R9-36`, `R9-39`); quedan 2 P0.
  - **3 hallazgos nuevos:** `R9-157` (P2, arreglado), `R9-158` (P2, decisión) y `R9-159` (P3).
  - **Detalle: `detail/S24-arreglos-en-la-nube.md`.**
  - **Las lecciones:**
    - **verde en la nube y en CI no es verde en la máquina de Victor**: la diferencia fue
      `NODE_ENV`;
    - **una limitación escrita en un comentario puede ser un defecto del entorno**: «el renderer
      desmonta la Mesa»;
    - **la nube escribe y el orquestador revisa pieza por pieza**: la revisión local encontró una
      compuerta roja, una pieza sin vigilar y un defecto de diseño.

- **Sesión 23 — 2026-09-23. Revisión del diff de la 20.** Solo revisión: no se tocó código.
  - **Cómo se trabajó:** 3 agentes, no 5, por lo que pasó en la 22. Ninguno se cortó, y el
    orquestador verificó el único P1 con una sonda propia.
    - el agente 1 se ocupó del `SyncEngine` (`R9-104` y `R9-103`) pieza por pieza;
    - el agente 2, de favoritos y dinero (`R9-102` y `R9-105`);
    - el agente 3, de las afirmaciones de la 20 contra el mundo.
  - **Veredicto:** los cuatro arreglos se sostienen, y la matriz de reverts de la 20 es cierta.
  - **4 hallazgos, `R9-153`..`R9-156`.** El que manda es `R9-153` (P1): `handleSnapshot` no
    tiene sesión, así que un conflicto de Ana pasa a la sesión de Beto y, al resolverlo, cruza a
    su nube. `R9-122.4` sube a P2 por el mismo agujero.
  - **Detalle: `detail/S23-revision-del-diff-s20.md`.**
  - **Las lecciones:**
    - **un arreglo con sesión deja abierto el OTRO bucle con `await`**: la 20 cerró el flush y
      dejó `handleSnapshot`, que cruza el mismo `stop()`;
    - **lo que `stop()` limpia, `start()` no lo vuelve a limpiar**: todo lo que se escribe
      entre los dos se hereda;
    - **un número que no se anota no se puede re-verificar**: los uid de las cuentas de la
      sonda de la 20.

- **Sesión 22 — 2026-09-23. El checkpoint de la 21 y los puntos 3 y 4 del doble check.** Solo
  revisión. Con esto el doble check con Opus 5.5 que pidió Victor queda **terminado en sus 4
  puntos**.
  - **Cómo se trabajó:** 5 agentes, uno por tramo: A8+A9, A10+A11, `S8`-`S10`, `S13`-`S15` y
    `S16`-`S18`. Los 5 se cortaron a la vez por el límite de uso de la sesión. Cuatro se retomaron
    con su contexto; al quinto se le había borrado el worktree con sus sondas, y se relanzó a
    partir de su informe incremental. El orquestador verificó a mano todo lo que subió a P1 y las
    dos bajadas de P1 a P2.
  - **Veredicto:** las 14 entradas `R9-51`..`R9-64` siguen siendo ciertas, y de 179 afirmaciones
    de `S8`..`S18` se verificaron 171 sin encontrar ningún P0 ni P1 escondido.
  - **10 hallazgos, `R9-143`..`R9-152`.** El que manda es `R9-143` (P1): el flush de «Banco de
    ilustraciones» y de «Modo púlpito» conserva las dos trampas de `R9-47`. El «P1 nuevo» de un
    agente ya era `R9-30`.
  - **Detalle: `detail/S22-doble-check-puntos-3-4.md`.**
  - **Las lecciones:**
    - **el informe incremental en disco no es opcional**: salvó el trabajo de cinco agentes
      cortados en el mismo minuto;
    - **un agente re-descubre un hallazgo ya numerado si el título no nombra la clave**: el
      orquestador tiene que buscar por la clave, no por el título;
    - **un remedio escrito en el ledger es una hipótesis, también en un P2** (`R9-58`);
    - **dónde corre algo se comprueba en el log**: el CI corre en UTC, no en Ciudad de México.

- **Sesión 21 — 2026-09-22. El doble check con Opus 5.5, puntos 1 y 2.** Fue solo de revisión y
  no se commiteó nada: el checkpoint lo escribió la 22.
  - **Cómo se trabajó:** dos agentes en worktrees aislados, como pidió Victor. Uno se ocupó de los
    18 P0 arreglados antes de la 19, con un arnés que revierte UNA pieza por reemplazo exacto,
    corre jest y restaura. El otro releyó las filas cerradas del Modo A y del Modo B, en la
    dirección «quitar acceso / restaurar / cambiar de cuenta». El orquestador verificó a mano todo
    lo que subió a P0 o P1: releyó el código, volvió a correr las sondas, y aplicó a la vez los
    tres reverts de los P1 del agente 1.
  - **Veredicto: los 18 arreglos se sostienen en `HEAD`.** Lo que falla es la red de pruebas: en
    12 de los 18 hay piezas que se quitan con la suite entera en verde, y tres de ellas reabren un
    P0 (`R9-130`, `R9-131`).
  - **19 hallazgos, `R9-124`..`R9-142`.** Los que mandan:
    - `R9-124` (P0): el `removed` de la query filtrada por `updatedAt` se trata como borrado.
      Restaurar un respaldo sube versiones con la marca vieja, y el propio listener las BORRA de
      SQLite. Medido con el SDK de JS real, offline. **El SDK nativo NO se midió.**
    - `R9-125` (P0): `signInWithGoogle` con `currentUser === null` no mira el dueño previo.
    - `R9-126`..`R9-129` (P1): un push con marca vieja pisa la nube; el flag de `deleteAccount`
      anula un «Sí, migrar»; un apply que falla avanza el cursor; `getAllReviewEvents` se traga su
      error.
    - `R9-130` y `R9-131` (P1): piezas de arreglos P0 sin ninguna prueba.
  - **Detalle, con la tabla pieza por pieza y la salida de cada sonda:
    `detail/S21-doble-check.md`.**
  - **Las lecciones:**
    - **un stub del OTRO lado de la frontera responde la pregunta** (`R9-131`);
    - **un mock que implementa el SDK a su manera sustituye la semántica del SDK** (el
      `onSnapshot` de la suite filtra en vez de emitir `removed`, `R9-124`);
    - **«arreglado» no dice qué está vigilado**: revertir el arreglo ENTERO lo habría escondido
      todo, porque siempre cae alguna prueba.

- **Sesión 19 — 2026-09-22. Revisar el diff de la 18 (`0da86ce..40160d7`), y los de la 10 y la
  11, que nadie había revisado.** Primera sesión con **Opus 5.5**. Fue **solo de revisión**:
  Victor pidió «decime qué encontraste antes de tocar nada».
  - **Cómo se trabajó:** 9 agentes en worktrees aislados. Dos revisores, dos verificadores
    adversariales, uno de docs y mensajes vecinos, uno del flujo real de publicación, uno de «CI
    en el tiempo», y uno por cada diff sin revisar. Todo lo que sube a P0 o a P1 lo verificó
    además el orquestador en el código o en los datos.
  - **Veredicto: los arreglos discriminan al revertirlos, los de la 18 y los de la 10 y la 11.**
    Con 2 de 4 archivos borrados, lo que pone roja la prueba de `R9-97` es la dirección nueva, no
    el sha256 de los que quedan.
  - **Contra el mundo:** los 4 sha256 coinciden entre el manifiesto y Pages, el `main()` real saca
    los 4 packs byte a byte, y el CI de `HEAD` está verificado **en el log**.
  - **22 hallazgos, `R9-102`..`R9-123`.** Los que mandan:
    - `R9-102` y `R9-103` (P0): dos formas nuevas de que una edición local nunca suba.
    - `R9-104` (P1, candidato a P0): mezcla entre cuentas en el flush.
    - `R9-105` (P1): la línea exacta del bug de `R9-9`, que es P0 de dinero, no la protege ninguna
      prueba; revertida, 57/57 suites verdes.
    - `R9-107` (P1): «este job corre node» se decide por la FORMA de `run:`, y una plantilla
      oficial de GitHub usa la forma que no se ve.
    - `R9-108` y `R9-109` (P1): la cadena de publicación no se defiende de un pack que no coincide
      con su manifiesto. En el mundo había uno así, con texto de chatbot en 2 Reyes 22:9, en el
      directorio por defecto. Se movió a cuarentena.
  - **Detalle completo, incluidas las cinco preguntas del prompt respondidas una por una:
    `detail/S19-revision-del-diff.md`.**
  - **Las lecciones de método:**
    - **un helper de RESET en el `beforeEach` sustituye el valor inicial del módulo**, así que el
      inicializador nunca corre bajo jest;
    - **una compuerta verificada solo con spies no se midió contra el mundo**;
    - **un efecto dentro de un actualizador de `setState` no corre cuando creés**;
    - y la de programa: «N sesiones seguidas» era una afirmación que nadie comprobó, y escondía
      **dos diffs sin revisar, uno de ellos de dinero**. Contá los `detail/S*`, no las sesiones.
  - **Pedido de Victor para una sesión posterior:** doble check con **Opus 5.5** de todo lo que el
    ledger revisó con Opus 5. El alcance propuesto está en el detalle.

- **Sesión 18 — 2026-09-16. Revisar el diff de la 17 (`31132d2..0da86ce`).** Décima sesión
  seguida de revisión adversarial sobre un diff de arreglos, y la décima que paga.
  **Veredicto: los 10 arreglos de la sesión 17 se sostienen en su mecanismo** — `R9-92`
  verificado en las **tres** direcciones (sonda `.native`: 15/15 verde antes, rojo después;
  la misma sonda como `.ios`, reportada) y `R9-87` visto discriminar (5 pruebas rojas con la
  escritura del manifiesto desactivada del todo).
  **La cadena de datos publicados, entera y contra el mundo, dos veces** (antes y después de
  tocar el script): los 4 packs **byte a byte**, con sha256 y `content-length` idénticos al
  manifiesto versionado y a lo que **sirve** hoy GitHub Pages.
  **5 hallazgos, `R9-97`..`R9-101`**, y las **tres compuertas nuevas enteras** de la 17
  dejaron abierto el vecino que las motivó. Los que mandan: `R9-97` (P1) — la comprobación que
  `R9-93` puso en lugar de una afirmación mira en **una sola dirección**, así que sigue
  diciendo «_it IS coherent - one run, whole_» sobre un directorio con archivos **que faltan**,
  y sobre uno **vacío**; `R9-98` (P1) — la misma función lee el manifiesto **en crudo**, y la
  forma legacy lanza **dentro del `catch`**, que es el defecto que `R9-95` acababa de quitar
  doscientas líneas más arriba; `R9-99` (P1) — el escáner de workflows decide qué es un job por
  su **FORMA**, así que un cuarto job sin ningún `setup-node` pasa **15/15** con sólo llevar un
  comentario en su cabecera, que es `R9-89` reabierto por su propio arreglo. Los dos P2 van en
  `BUGS.md`.
  **Detalle completo, incluido lo comprobado y BIEN y lo dicho-y-no-hecho:
  `detail/S18-revision-del-diff.md`.**
  **Las tres lecciones de método:** **una comprobación que reemplaza una afirmación tiene que
  comprobar la afirmación ENTERA, no la mitad que se ve** (`R9-93` verificó los sha256 de los
  archivos que están y dejó sin comprobar la palabra «whole»); **decidir por la FORMA de una
  línea es decidir por un estilo** — lo que dice que algo es un job no es su forma, es su
  **columna**, y una forma rechazada o falla ruidosamente o se la traga el vecino de arriba; y
  **una compuerta nueva que no casa con nada hoy no tiene discriminador**, así que contá
  cuántas veces llega a comparar algo y ponle piso a ese número.

- **Sesión 17 — 2026-09-16. Revisar el diff de la 16 (`cca7091..531ffef`).** Novena sesión
  seguida de revisión adversarial sobre un diff de arreglos, y la novena que paga. **Veredicto:
  los 5 arreglos de la sesión 16 se sostienen** — `R9-85` y `R9-86` vistos discriminar por
  revert con el `diff` del revert a la vista, y `R9-82` verificado **en el LOG del run**, no en
  el check (`PASS buildWebPacks.test.js`, `PASS redLetterPackParity.test.ts`, 363/4263).
  **La cadena de datos publicados, entera y contra el mundo, dos veces** (antes y después de
  tocar el script): fuentes `.ts` → `main()` REAL → los 4 packs **byte a byte** → manifiesto
  versionado → manifiesto **servido** (`diff` → `IDENTICAL`) → los 4 sha256 de los bytes
  servidos; y los conteos que el manifiesto afirma, comprobados **abriendo los bytes
  descargados**.
  **10 hallazgos, `R9-87`..`R9-96`.** El que manda es `R9-87` (P1): el `beforeEach` que `R9-83`
  añadió escribe una baseline con **exactamente dos packs**, y la única aserción que fijaba la
  escritura del manifiesto decía `packs.toHaveLength(2)` — o sea que **el fixture responde la
  pregunta que la aserción hacía**. Medido: con esa escritura desactivada del todo, **el repo
  ENTERO sale verde, 363 suites / 4263 pruebas**. Y `data-loader.web.ts` usa ese sha256 como
  ÚNICA señal de pack nuevo, así que la consecuencia es un lector web congelado en el pack
  viejo, en silencio. Luego `R9-88` (el piso `">=22"` es falso: el real es **22.13.0**, y la
  compuerta **prohibía** escribirlo) y `R9-89` (el detector veía una sola forma de escribir el
  pin, y su piso era el número de jobs de hoy). Los siete P2 van en `BUGS.md`.
  **Detalle completo, incluido lo comprobado y BIEN y lo dicho-y-no-hecho:
  `detail/S17-revision-del-diff.md`.**
  **Las dos lecciones de método:** **el piso de una compuerta suele ser exactamente el número de
  HOY, así que acaba exigiendo ese número en vez de exigir cobertura** — no cuentes, emparejá; y
  **un fixture añadido para habilitar una prueba nueva puede RESPONDER la pregunta que otra
  prueba estaba haciendo**, que es la forma de la sesión 10 por la puerta del fixture, y más
  traicionera porque el fixture parece inerte.

- **Sesión 16 — 2026-09-16. Revisar el diff de la 15, que estaba SIN MERGEAR.** Octava
  sesión seguida de revisión adversarial sobre un diff de arreglos, y la octava que paga.
  **Veredicto: los 5 arreglos de la sesión 15 se sostienen**, verificado revirtiendo cada uno
  por separado con el `diff` del revert a la vista — `R9-77` → 7 rojas, `R9-78` → 3 (simulando
  `R9-13` al pie de la letra), `R9-79` → 1, `R9-81` → 2, controles verdes en los cuatro. **Y
  `R9-80` → 0**, que es el hallazgo `R9-86`. **Los cuatro sha256 salen idénticos dos veces**:
  contra lo que hoy sirve GitHub Pages, y reconstruyendo los packs con el `main()` REAL contra
  los datos REALES (byte a byte, con el manifiesto del repo intacto).
  **El hallazgo que manda no estaba en el diff.** `R9-82` (P1): los cuatro correos de CI que
  trajo Victor eran cuatro runs fallidos de `main`. `scripts/build-web-packs.js` requiere
  `node:sqlite`, que no existe antes de Node 22, y `ci.yml` fijaba `node-version: '20'` — así
  que desde `1d96a40` (el arreglo de `R9-66`, sesión 13) la compuerta que vigila **lo único que
  produce datos publicados** no se ejecutó ni una vez en CI, y la rama de la 15 añadía una
  segunda suite muerta. Medido con binarios de verdad: Node 20 → 2 suites no cargan, 4195 de
  4250; Node 22 y 24 → verde. **55 pruebas que nunca corrían.**
  Los otros cuatro: `R9-83` (P1: el piso de `R9-77` deja abierta la base **ausente**, que fija
  estrictamente menos — probado de punta a punta, el `R9-13` verbatim emite y reescribe el
  manifiesto sin RVR1960, sin pedir ninguna palanca). `R9-84` (el mensaje de `R9-81` dice que el
  directorio está MEZCLADO cuando no se movió nada). `R9-85` (el mock de `renameSync` de esa
  misma prueba **se llamaba a sí mismo** vía `jest.requireActual`, así que el caso «a medias»
  nunca se ejecutó). `R9-86` (el control de `R9-80` prueba una COPIA del escáner, y el escáner
  solo abría 2 de los 4 layouts). Los 5 arreglados en `fix/review-s16-revision-diff-s15`, cada
  uno **visto fallar primero**. **Mergeado y pusheado** (`0aa92a7..531ffef`, fast-forward), y
  el primer run sobre `main` salió **verde de verdad**: Node v24.20.0, las tres suites que no
  cargaban en PASS, 363 suites / 4263 pruebas —los mismos números que en local, o sea que no se
  saltó nada— y cero «Test suite failed to run».
  **Detalle completo, incluido lo comprobado y BIEN y lo dicho-y-no-hecho:
  `detail/S16-revision-del-diff.md`.**
  **La lección de método, nueva y del tamaño de las otras:** **una compuerta que nunca llegó a
  EJECUTARSE se ve exactamente igual que una que pasó.** «Gates verdes» era cierto — en una
  sola máquina. Antes de creerle a una compuerta nueva, preguntá **dónde corre**, no solo qué
  comprueba.

- **Sesión 15 — 2026-09-15. Revisar el diff de la 14 (otra vez las COMPUERTAS), ya
  mergeado.** Séptima sesión seguida de revisión adversarial sobre un diff de arreglos, y la
  séptima que paga. 5 commits, 4 archivos de código. **Veredicto: los 3 arreglos de la sesión
  14 se sostienen y sus pruebas DISCRIMINAN**, verificado revirtiendo cada uno **por separado**
  —no los tres juntos, que es la lección de la sesión 10— con el `diff` del revert a la vista:
  el escenario `staging` → `out` directo → 4 rojas; los dos bucles sobre las listas PREVIAS →
  6; `readPreviousManifest` tragándose los errores → 3. **Ninguno desarma la prueba del otro.**
  `R9-75` también discrimina (un `<ProbeOnlyProvider>` solo en el layout nativo la pone roja
  **nombrándolo**). **Y los cuatro sha256 salen idénticos dos veces**: contra el manifiesto y
  contra lo que hoy sirve `eternalstonebible.github.io`, antes de tocar nada y después de los
  cinco arreglos.
  **Los 5 defectos están en las COMPUERTAS por tercera sesión seguida**, y con una forma que ya
  se repite lo bastante como para nombrarla: **una compuerta escrita para cerrar un caso cierra
  ese caso y deja abierto el vecino que la motivó**. `R9-77` (P1: `R9-73` lee las listas
  PREVIAS, que era lo correcto, y no le pone piso a la lista previa — una lista previa VACÍA
  apaga los dos bucles de letra roja, y el manifiesto del repo **llevó exactamente esa forma**
  hasta `a0782a6`; probado de punta a punta, el `R9-13` verbatim EMITE, imprime «nothing went
  missing», y reescribe el manifiesto sin RVR1960). `R9-78` (P1: las tres listas de letra roja
  solo estaban atadas por comentarios, y la compuerta de `R9-73` **no puede ver el `R9-13` que
  cita por su nombre**, porque una versión que nunca tuvo pack no tiene entrada de la que
  faltar). `R9-79` (el discriminador de `R9-76` sigue exigiendo que el contrato viva en el
  hermano nativo, y en uno de los cuatro pares vive en un tercer archivo — sonda verde 72/72).
  `R9-80` (la compuerta de `R9-75`, escrita para ser «derivada, no confiada», lee el layout
  como TEXTO y cuenta como montado un provider nombrado en un **comentario** — sonda verde
  11/11). `R9-81` (la mudanza final de `R9-72` son cuatro `renameSync`, y una a medias deja el
  directorio de publicación MEZCLADO bajo un `EPERM` pelado). Los 5 arreglados en
  `fix/review-s15-revision-diff-s14`, cada uno **visto fallar primero**, más un remate menor
  (la prueba de hooks decía «six» con siete entradas en la lista, ahora con piso).
  **Detalle completo, incluido lo comprobado y BIEN y lo dicho-y-no-hecho:
  `detail/S15-revision-del-diff.md`.**
  **La lección de método:** a las dos preguntas de la sesión 14 —_¿de quién depende el
  discriminador?_ y _¿qué significa su silencio?_— se le suma una tercera, del otro lado del
  `if`: **un mensaje de ÉXITO que afirma cuánto comparó es una aserción, y hay que probarla
  contra el mundo.** `assertNoShrink` decía «2 packs and 2 red-letter packs compared against
  the published manifest» habiendo comparado CERO; las dos cifras coinciden en toda corrida
  buena, **y por eso nadie las miró en la mala**. Y una gotcha de plataforma que costó una
  prueba roja por el camino equivocado: **Windows abre tan campante un DIRECTORIO con
  `open(…, 'r+')`**, así que un preflight de «¿puedo reemplazar este archivo?» necesita además
  `statSync().isFile()`.

- **Sesión 14 — 2026-09-15. Revisar el diff de la 13 (las COMPUERTAS), ya mergeado.** Sexta
  sesión seguida de revisión adversarial sobre un diff de arreglos, y la sexta que paga. 8
  commits, 16 archivos. **Veredicto: los 6 arreglos de la sesión 13 se sostienen y sus 6
  pruebas DISCRIMINAN**, verificado revirtiendo cada uno con el `diff` del revert a la vista:
  quitar los dos pisos de `verifyRedLetterAlignment` → 2 rojas y los 4 controles verdes;
  neutralizar `shrinkComplaints` → 6 rojas y los 3 controles puros verdes; un par sintético
  `export {x}` contra la compuerta de AST → cazado, y `export * from` → ruidoso; volver al
  regex de `isMissingProviderError` → 3 rojas; volver al booleano del lector → roja con
  `{offsetsFor:"RVR1960", textFrom:"WEB"}`; revertir los tres contratos de `R9-70` → **exactamente
  los 2 huecos vivos** y silencio en los otros 12 pares; volver a asentar el fallo de
  `loadRedLetterSpans` → 2 rojas con los dos controles verdes. **Y los cuatro sha256 de los
  packs vuelven a salir idénticos al manifiesto publicado, con el manifiesto sin cambiar un
  byte.**
  **Los 5 defectos están otra vez en las COMPUERTAS**, y los dos P1 repiten la forma que la
  propia sesión 13 se cazó a sí misma: `R9-72` (el mensaje de abort **mentía** — solo los JSON
  de letra roja se habían aplazado, los dos `.sqlite` ya estaban escritos en el directorio de
  salida; probado con una fuente que pierde 492 versículos de Salmos, que satisface todos los
  pisos de `verifyPack` y deja un `web.sqlite` de 30 606 versículos donde el error jura que no
  se emitió nada) y `R9-73` (la compuerta de encogimiento **no ve una versión que desaparece**,
  que es el encogimiento máximo: los bucles recorren la lista NUEVA, y quitar RVR1960 da `[]`).
  Los otros tres son la misma familia una capa más fina: `R9-74` (un baseline ilegible apaga
  la compuerta entera **sin decir una palabra**, y el silencio era a la vez la señal de
  «verificado» y la de «no comparé nada»), `R9-75` (la lista de providers tenía compuerta en
  **una sola dirección**: nadie comprobaba que estuviera COMPLETA) y `R9-76` (el discriminador
  de la compuerta de `R9-70` —«¿lo exporta el nativo?»— está **en manos del archivo vigilado**,
  que es literalmente el estado en que estaba `OfferingSheetContextValue` antes de ese mismo
  arreglo). Los 5 arreglados en `fix/review-s14-revision-diff-s13`, **ya mergeada en fast-forward a `main` y pusheada** (la rama se borró), cada uno con su prueba
  **vista fallar primero** (11 rojas de golpe en el bloque de packs, con 8 controles verdes a
  los dos lados) y `R9-72` corrido de punta a punta contra los datos reales.
  **Detalle completo, incluido lo que se comprobó y está BIEN:
  `detail/S14-revision-del-diff.md`.**
  **La lección de método:** la 13 encontró los defectos en las compuertas; la 14 los encontró
  en **el mismo sitio otra vez**, lo que dice que una compuerta nueva merece la misma
  desconfianza que el código que vigila. Y afina el antídoto de la 13 con dos preguntas más:
  _¿de quién depende el discriminador de esta compuerta?_ — si de quien podría infringirla, no
  es una compuerta — y **_¿qué significa su silencio?_** Si el mismo silencio sirve para
  «verificado» y para «no miré», no hay compuerta. Tercer corolario: **un mensaje de error que
  AFIRMA un estado del mundo es una aserción, y hay que probarla como tal** — el de `R9-66`
  decía «no pack file was emitted» con 9,5 MB de packs recién escritos, y había una prueba que
  fijaba esa frase.
