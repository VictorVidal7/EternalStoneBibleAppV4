# S9 — revisión con ojo fresco del diff de la sesión 8 (antes de mergear)

**Sesión 9, 2026-09-15.** Mismo protocolo que la sesión 8, ahora sobre el diff de la 8:
`fix/review-p0-notas-cuentas`, 7 commits, 1180 líneas que tocan **sync, auth e identidad**.
**Veredicto: DOS defectos reales, ambos arreglados antes de mergear** (`3e780c6`, `29a9449`).
Los dos son la MISMA clase de error: el arreglo cierra el caso que su prueba cubre y deja
abierto el vecino.

## Los dos defectos encontrados (ambos con prueba que falla primero)

1. **`R9-46` — el retiro del cursor estaba a medias.** `handleSnapshot` mantiene **un solo**
   `maxSeenUpdatedAt` para el lote entero, así que omitir la marca del doc saltado no basta:
   un hermano **más nuevo del mismo lote** que sí se aplicó arrastra el piso de la consulta
   por delante del saltado, y el siguiente reattach ya no lo entrega. Alcanzable con un
   fallo transitorio de SQLite **por documento** (la clase de `R9-49`). Con
   `CURSOR_SAFETY_MARGIN_MS` = 5 min, cualquier separación mayor entre los dos documentos
   pierde el cambio remoto para siempre — y el tirón inicial tras estar sin conexión entrega
   justamente lotes que abarcan días. **Medido:** piso en `8_700_000` sobre un doc saltado en
   `1_000_000`. Arreglado acotando el cursor del lote por debajo del `updatedAt` más bajo no
   aplicado.
2. **`R9-48` — el traspaso del log quedaba detrás de la guarda del suelo.** El bloque estaba
   **debajo** de `if (existing != null) return;`. `AuthContext.signOut` dispara
   `clearMemoryStatsFloor()` **sin esperarlo** (`void`), así que un cierre de la app justo
   después de cerrar sesión deja el suelo del dueño anterior en disco — y con él ahí, el
   traspaso **no corre nunca**, ni en ese arranque ni en ninguno posterior, porque nada lo
   reintenta. La guarda de escritura entonces rechaza el agregado de la cuenta nueva en cada
   paso a segundo plano, para siempre, con solo un `warn`. Y `memoryStats/summary` es su
   **único ancla en la nube** desde que `reviewEvents` dejó de sincronizarse: un dispositivo
   suyo posterior restauraría un suelo vacío. Pérdida de datos a un salto. Arreglado subiendo
   el bloque por encima de la guarda **y** borrando el suelo ajeno al cambiar de dueño (si no,
   la cuenta nueva adoptaba en silencio los números de la anterior como su línea base).

## Lo que se comprobó a mano y está BIEN (no re-verificar)

1. **`getLocal` tiene un solo call site** (`SyncEngine.ts:796`), dentro del nuevo
   `try/catch`. Dejar que `findNoteById` propague no puede romper a ningún otro llamador.
2. **`this.uid` ya está asignado cuando corre `hydrateQueue`** (`start()`: `this.uid = uid`
   en la línea 301, `hydrateQueue()` en la 304), así que `pendingForActiveUid()` no cuenta
   contra un uid vacío en el arranque normal.
3. **El `claimLocalStore` de `R9-23` cubre las DOS ramas**: la de `linkWithCredential` que
   tuvo éxito y la de colisión, que termina en `signInWithCredential` y reclama ahí.
4. **El motor solo arranca para usuarios NO anónimos** (`SyncEngineContext:92`), así que una
   sesión anónima nunca reclama el log de repasos ni escribe agregados. El dueño siempre es
   un uid real.
5. **`clearMemoryStatsFloor()` sí se llama al cerrar sesión y al borrar la cuenta**
   (`AuthContext:548` y `:649`), que es lo que hace que el camino normal de cambio de cuenta
   llegue al traspaso con el suelo ya limpio. El defecto 2 es la ventana en que ese `void`
   no alcanza a escribir.

## Lo que se DECIDIÓ no tocar (fuera del alcance de este diff)

- **`R9-65` (nuevo, P1):** el mismo fallo de cursor que el defecto 1, pero por la rama de
  **conflictos**, y **preexistente en `main`** — no lo introdujo este diff. Un doc en
  conflicto se omite del `maxSeenUpdatedAt` pero un hermano más nuevo igual mueve el piso por
  delante de él; como `stop()` limpia `this.conflicts` ("son transitorios"), si la app se
  reinicia antes de resolverlo el conflicto se pierde **y** el cursor ya pasó de largo. El
  cambio remoto se cae en silencio. **Se arregla con una línea**, extendiendo la misma cota
  del defecto 1 a los conflictos — pero es bug de `main` y merece su propia decisión.
- **`pendingWrites` se queda obsoleto al cambiar de cuenta dentro de una misma sesión de la
  app.** `stop()` conserva el conteo a propósito y `hydrateQueue` sale temprano por
  `queueHydrated`, así que nadie lo recalcula para el uid nuevo hasta la siguiente escritura
  o flush. **Es cosmético hoy: `pendingWrites` NO tiene ni un consumidor en `src/`** fuera de
  `types.ts` — el comentario de `pendingForActiveUid` describe una pantalla de Ajustes que no
  existe. Si alguna vez se muestra, recalcularlo en `start()`.
- **La cola aparcada no caduca.** Las entradas de una cuenta que no vuelve se quedan en
  AsyncStorage para siempre, con el **contenido completo** de los documentos (texto de notas
  incluido). Es mucho mejor que antes —antes se drenaban a la cuenta ajena— pero introduce
  una retención indefinida que no existía. Decisión de producto, emparentada con `R9-59`.
- **`R9-23` frena la SUBIDA, no la visibilidad local.** Declinar la migración solo marca el
  `skipNextBulkPush`: los datos de la cuenta anterior **siguen en el dispositivo y siguen
  viéndose**. No es regresión —la rama de colisión preexistente se comporta igual— pero el
  título "ya no hereda el almacén ajeno" promete más de lo que entrega.
- **El marcador de `R9-23` no cubre la actualización.** Quien ya estuviera con sesión
  iniciada antes de que esto se publique no tiene `@local_store_owner_uid`, y
  `getLocalStoreOwner()` devuelve `null` → sin aviso. El primer cambio de cuenta tras
  actualizar queda sin proteger. Se podría inferir el dueño anterior de las claves de cursor,
  que ya están namespaceadas por uid.

**Compuertas al mergear:** 356 suites, **4066** pruebas (4064 + las 2 nuevas), `tsc` limpio,
lint 0 errores, prettier limpio.

---

## Segunda mitad de la sesión 9 — ARREGLOS: `R9-33`, `R9-34`, `R9-35`

Tras mergear, se siguió el orden de ataque. **Los tres cerrados** (`0a4f0fc`, `c41c9cb`),
con 7 pruebas, las 7 vistas fallar sin el arreglo.

- **`R9-33`** tenía dos mitades y las dos hacían falta. El backoff **no existía** pese a que
  `types.ts` y `netinfo.ts` lo daban por hecho; ahora se mide desde el **último intento**
  (campo nuevo `lastAttemptAt` — `queuedAt` no sirve, no se mueve nunca, así que una
  escritura encolada sin conexión estaría «vencida» en cada tick). Y la señal: sin ella,
  descartar la última entrada llevaba `pendingWrites` a 0 y Ajustes decía «Sincronizado hace
  un momento» en el instante exacto en que se tiraba el cambio.
- **`R9-34`** cayó del mismo cambio: hay que sellar `lastAttemptAt` en la misma línea que
  hacía el spread del snapshot viejo. Se commiteó dicho aparte, no colado. **`R9-11` sigue
  abierto** — es la rama de ÉXITO y necesita otro arreglo.
- **`R9-35`** necesitaba **dos** cosas, no una: el techo en `advanceCursor` impide envenenar,
  pero solo el descarte en `loadCursor` **cura** a un dispositivo ya envenenado. Topar el
  valor a «ahora» no bastaba: lo perdido durante la ventana es más viejo que `ahora - 5 min`
  y seguiría bajo el suelo para siempre.

**Un remate de `R9-22` que salió al escribir las pruebas:** `hydrateQueue` sale temprano por
`queueHydrated`, así que en un segundo `start()` de la misma sesión de la app nadie
recalculaba `pendingWrites` — y `stop()` lo conserva a propósito. Ajustes le decía a la
cuenta nueva «Sincronizando 1 cambio…» para siempre.

### Dos correcciones a lo que decía la primera mitad de esta sesión

1. **`pendingWrites` SÍ tiene consumidor**: `app/(tabs)/settings.tsx:87`. Arriba se dijo que
   no tenía «ni uno en `src/`» — literalmente cierto y **engañoso**, porque las pantallas
   viven en `app/`, no en `src/`. El conteo obsoleto al cambiar de cuenta **no era
   cosmético**: era visible. Ya está arreglado. **Lección: un `grep` acotado a `src/` no cubre
   esta app.**
2. **El conteo de P0 venía mal desde la sesión 7.** La lista de «arreglados» incluía `R9-50`,
   que está en la sección **P1**, así que el «quedan 10» de la sesión 8 eran **11**. Contando
   las entradas de la sección P0: 21 en total, 13 arregladas, **8 abiertas**. La nota está
   ahora al principio de la sección P0 de `BUGS.md`.

**Una prueba que no discriminaba, cazada a tiempo:** la del conteo de pendientes pasaba igual
con el código roto, porque la escritura de Ana se subía bien y la cola se vaciaba sola. Hubo
que hacer fallar el push para que la entrada siguiera pendiente al cambiar de cuenta.

---

## ⚠️ Correcciones de la sesión 22 (doble check con Opus 5.5, punto 4)

Las líneas citadas son las de este archivo ANTES de agregar esta sección. Detalle: `S22-doble-check-puntos-3-4.md`.

- `:40-41`, «`claimLocalStore` cubre las DOS ramas»: es cierto al pie de la letra, pero hay una TERCERA rama sin guarda (`R9-125`, P0), y la de colisión no tiene prueba (`R9-130`).
- `:52-58` (`R9-65` «se arregla con una línea») y `:86-87` («las 7 vistas fallar») ya estaban corregidas: `R9-106` y la sesión 10.
