# 🐛 Bugs — Revisión profunda 2026-09

> Resumen corriente de todo lo marcado `🐛 BUG` en [`INDEX.md`](INDEX.md), P0 primero.
> Cada entrada lleva: severidad, área del índice, `file:line`, pasos de repro y
> evidencia. **Nada aquí se arregla en esta revisión** — arreglar es una sesión aparte
> (charter §1).
>
> Numeración: `R9-1`, `R9-2`, … (el prefijo evita confundirlas con los `BUG-N` de la
> revisión Fable de julio).
>
> `main` está verde (`npm run validate` pasa), así que **cualquier fallo nuevo que esta
> revisión haga aparecer es una regresión real.**
>
> **Sesión 7 (2026-09-14) fue de ARREGLOS, no de revisión** — la primera. Cerró **7 P0 de
> pérdida irreversible de datos** en `fix/review-p0-perdida-datos` (`7f8e666`), con las tres
> compuertas en verde: `R9-27`, `R9-28`, `R9-44`, `R9-45`, `R9-47`, `R9-49` y `R9-50`.
> **La rama se MERGEÓ y se pusheó a `main` en la sesión 8** (`8fe24f1`), tras revisar el diff
> con ojo fresco; el detalle de esa revisión está en `detail/S8-revision-del-diff.md`.
>
> **Corrección de la sesión 8 — no los 7 traían prueba de regresión.** La redacción anterior
> decía «cada uno con prueba de regresión» y era falsa. El estado real: `R9-27`, `R9-45`,
> `R9-47` y `R9-49` sí (las cuatro re-verificadas fallando sin el arreglo). `R9-50` estaba a
> medias (solo la raíz del sanitizador). **`R9-28` y `R9-44` no tenían ninguna.** La sesión 8
> cubrió la mitad que faltaba de `R9-50` y el mecanismo de `R9-44`
> (`highlightServiceTriState.test.ts`). **`R9-28` ya tiene la suya desde la sesión 11** (`aa70be0`,
> las dos mitades: que `importBackup` emite la señal Y que la emite la última, y que el
> provider re-hidrata y por eso deja de pisar lo restaurado). La rama del lector de
> `R9-44` sigue siendo verificación en dispositivo (Modo C), no jest. Van marcados **✅ ARREGLADO**
> dentro de su propia entrada, que se conserva íntegra a propósito: el diagnóstico es lo que
> explica por qué el arreglo es ese y no otro.
>
> **Sesión 8 (2026-09-15), la segunda de ARREGLOS.** Además de revisar y mergear lo anterior,
> cerró **4 P0 más**: `R9-46` (`b3d73e1`) y **el bloque entero de mezcla entre cuentas** —
> `R9-22` (`a9785be`), `R9-48` (`67af8c9`) y `R9-23` (`e75eca3`). Cada uno con su prueba de
> regresión **vista fallar sin el arreglo**, esta vez una por una. **Quedan 10 P0 abiertos.**
> Va todo en `fix/review-p0-notas-cuentas`, **sin mergear**.
>
> **Sesión 10 (2026-09-15).** Revisó el diff de la 9 —el defecto estaba en una PRUEBA que no
> discriminaba, ver `detail/S10-revision-del-diff.md`— lo remató (`2bfa126`) y **mergeó
> `fix/review-p0-sync-descarta-silencio` a `main`** en fast-forward. Después cerró **los 2 P0
> de dinero**: `R9-9` y `R9-10` juntos (`bb3b25b`), porque arreglar el primero sin el segundo
> no cambia nada para el usuario. **Quedan 6 P0 abiertos.** **Todo MERGEADO a `main` y
> PUSHEADO**: no queda ninguna rama de arreglos pendiente.
>
> **Sesión 11 (2026-09-15).** Cerró `R9-11` —el gemelo de `R9-34` en la rama de **ÉXITO** de
> `flush()`, que es la rama común— y de paso `R9-65` (P1, el mismo fallo de cursor de `R9-46`
> por la rama de conflictos). **Quedan 5 P0 abiertos.** Y saldó la deuda más vieja: **`R9-28`
> por fin tiene prueba de regresión**, las dos mitades, así que ya no hay ningún arreglo sin
> ninguna. **Todo MERGEADO a `main` y PUSHEADO**: no queda ninguna rama de arreglos
> pendiente.

> **Sesión 19 (2026-09-22): la primera con Opus 5.5, y solo de REVISIÓN.** No se arregló nada.
>
> **Qué revisó:**
>
> - El diff de la 18 (`0da86ce..40160d7`).
> - Los diffs de las sesiones 10 y 11, que **nunca se habían revisado**. La 11 y la 12 no revisaron
>   ningún diff, así que «décima seguida» era falso. Esos diffs son los arreglos de dinero
>   `R9-9`/`R9-10` (`bb3b25b`), el remate `2bfa126`, `R9-11`/`R9-65` (`261c053`) y la prueba de
>   `R9-28` (`aa70be0`).
>
> **22 hallazgos, `R9-102`..`R9-123`:** 2 P0, 6 P1, 10 P2 y 4 entradas P3 agrupadas.
>
> **Los dos P0 no están en ningún diff:** están en código que el Modo A ya había pasado, y los dos
> tienen el mismo efecto que `R9-11`.
>
> - **Editar un favorito a menudo no se sube nunca** (`R9-102`).
> - **Una edición durante una bajada en vuelo se descarta** (`R9-103`).
>
> **Y fuera del repo:** el directorio de publicación por defecto tenía el `rvr1960.sqlite` VIEJO, con
> **texto de chatbot dentro de 2 Reyes 22:9**, junto al manifiesto que pina el bueno. El lector web
> no verifica el sha256 (`R9-109`). Se movió a cuarentena con permiso de Victor.
>
> **Los arreglos de la 18, de la 10 y de la 11 discriminan al revertirlos**; lo roto está otra vez
> en sus vecinos. `R9-97`..`R9-99` pasaron de P2 a P1, donde el resumen de la 18 ya las ponía.
> Detalle: `detail/S19-revision-del-diff.md`.
>
> **⚠️ Pedido de Victor:** todo lo anterior a esta sesión se revisó con **Opus 5**. Una sesión
> posterior tiene que re-verificarlo con **Opus 5.5**; el alcance propuesto está en el detalle.

> **Sesión 18 (2026-09-16).** Revisó el diff de la 17 (`31132d2..0da86ce`) y encontró **5
> defectos, ninguno P0**: `R9-97`, `R9-98`, `R9-99` (P1) y `R9-100`, `R9-101` (P2). **Los diez
> arreglos de la 17 se sostienen en su mecanismo** — `R9-92` verificado en las TRES direcciones y
> `R9-87` visto discriminar (5 pruebas rojas con la escritura del manifiesto desactivada).
> **Sexta sesión seguida con los defectos en las COMPUERTAS, y las tres compuertas nuevas enteras
> de la 17 dejaron abierto el vecino que las motivó.** Lo que más vale: la comprobación que
> `R9-93` puso en lugar de una afirmación mira en **una sola dirección**, así que sigue diciendo
> «_it IS coherent - one run, whole_» sobre un directorio **vacío** (`R9-97`); y el escáner de
> workflows decide qué es un job por su **FORMA**, así que un cuarto job sin ningún `setup-node`
> pasa **15/15** con sólo llevar un comentario en su cabecera (`R9-99`) — que es `R9-89` reabierto
> por su propio arreglo. La cadena de datos publicados se verificó entera contra el mundo, dos
> veces. Los 5 arreglados en la misma sesión, **mergeados y pusheados** (`2b65a12`). Detalle:
> `detail/S18-revision-del-diff.md`.

> **Sesión 17 (2026-09-16).** Revisó el diff de la 16 (`cca7091..531ffef`) y encontró **10
> defectos, ninguno P0**: `R9-87`, `R9-88`, `R9-89` (P1) y `R9-90`..`R9-96` (P2). **Los cinco
> arreglos de la 16 se sostienen** — `R9-85` y `R9-86` vistos discriminar por revert, y `R9-82`
> verificado **en el LOG del run**, no en el check. **Quinta sesión seguida con los defectos en
> las COMPUERTAS, y cuatro de los cinco arreglos dejaron abierto justo el vecino que los
> motivó.** Lo que más vale: con la escritura del manifiesto desactivada del todo, **el repo
> ENTERO sale verde (363 suites / 4263 pruebas)** — el `beforeEach` que `R9-83` añadió RESPONDÍA
> la pregunta que la única aserción que la fijaba estaba haciendo (`R9-87`). Y el piso que la 16
> declaró (`">=22"`) es **falso**: `node:sqlite` se desbanderó en **22.13.0**, y la compuerta
> **prohibía** escribir el piso verdadero (`R9-88`). La cadena de datos publicados se verificó
> entera contra el mundo, dos veces. Los 10 arreglados en la misma sesión. Detalle:
> `detail/S17-revision-del-diff.md`.

> **Sesión 16 (2026-09-16).** Revisó el diff de la 15 (que estaba **sin mergear**) y encontró
> **5 defectos, ninguno P0**: `R9-82`, `R9-83` (P1) y `R9-84`, `R9-85`, `R9-86` (P2). **Los cinco
> arreglos de la 15 se sostienen**, verificado revirtiendo cada uno por separado con el `diff` del
> revert a la vista (7, 3, 1, **0** y 2 rojas) — y ese **0** es `R9-86`: el arreglo de `R9-80`
> funciona, pero su prueba nueva no lo protege porque **reimplementa el escáner en vez de
> llamarlo**. Los cuatro sha256 siguen idénticos al manifiesto y a lo que sirve GitHub Pages, y el
> `main()` real contra los datos reales reprodujo los cuatro packs byte a byte. **El hallazgo que
> manda no estaba en el diff: `main` llevaba un día en ROJO en CI** porque `node:sqlite` no existe
> en Node 20 y `ci.yml` lo fijaba, así que la compuerta que vigila los datos publicados **nunca se
> ejecutó en CI** — y la rama de la 15 añadía una segunda suite muerta. Cuarta sesión seguida con
> los defectos en las COMPUERTAS, y una forma nueva: **una compuerta que nunca llegó a EJECUTARSE
> se ve igual que una que pasó**. Los 5 arreglados en la misma sesión. Detalle:
> `detail/S16-revision-del-diff.md`.

> **Sesión 15 (2026-09-15).** Revisó el diff de la 14 (5 commits, 4 archivos de código) y
> encontró **5 defectos, ninguno P0**: `R9-77`, `R9-78` (P1) y `R9-79`, `R9-80`, `R9-81` (P2).
> **Los tres arreglos de la sesión 14 se sostienen y sus pruebas DISCRIMINAN** — verificado
> revirtiendo cada uno **por separado**, con el `diff` del revert a la vista (4, 6 y 3 rojas
> respectivamente, controles verdes en los tres), y **ninguno desarma la prueba del otro**,
> que era el riesgo concreto de un commit con tres arreglos dentro. Los cuatro sha256 siguen
> saliendo idénticos al manifiesto **y a lo que hoy sirve GitHub Pages**. Los defectos están
> **otra vez en las COMPUERTAS, tercera sesión seguida**, y con una regularidad que ya se
> puede nombrar: **una compuerta escrita para cerrar un caso cierra ese caso y deja abierto el
> vecino que la motivó** — `R9-73` no ve una lista previa VACÍA, y no ve el `R9-13` que cita
> por su nombre; `R9-76` deja el discriminador en «el nativo lo declara»; `R9-75` deriva la
> lista leyendo el layout como TEXTO; `R9-72` deja una mudanza de cuatro operaciones. Los 5
> arreglados en la misma sesión. Detalle: `detail/S15-revision-del-diff.md`.

> **Sesión 14 (2026-09-15).** Revisó el diff de la 13 (8 commits, 16 archivos) y encontró
> **5 defectos, ninguno P0**: `R9-72`, `R9-73` (P1) y `R9-74`, `R9-75`, `R9-76` (P2). **Los
> 6 arreglos de la sesión 13 se sostienen y sus 6 pruebas DISCRIMINAN** (verificado revirtiendo
> cada uno, con el `diff` del revert a la vista), y los cuatro sha256 de los packs siguen
> saliendo idénticos al manifiesto publicado. Los defectos están otra vez en las COMPUERTAS, y
> los dos P1 vuelven a ser la forma de `R9-66`: **un bucle que no recorre nada no encuentra
> nada**, esta vez porque la lista nueva es más corta que la publicada. Los otros tres son la
> misma familia: **una compuerta cuyo discriminador depende de lo que decida el propio código
> vigilado, o cuyo silencio significa a la vez «verificado» y «no miré»**. Los 5 arreglados en
> la misma sesión. Detalle: `detail/S14-revision-del-diff.md`.

> **Sesión 13 (2026-09-15).** Revisó el diff de la 12 (el bloque WEB, 6 commits, 19 archivos)
> y encontró **6 defectos, ninguno P0** — todos en los BORDES de esos arreglos, no en ellos:
> `R9-66`, `R9-67` (P1) y `R9-68`, `R9-69`, `R9-70`, `R9-71` (P2). Los tres arreglos de la 12 se
> sostienen y sus pruebas discriminan (verificado revirtiendo cada uno, con el `diff` del
> revert a la vista). Detalle completo en `detail/S13-revision-del-diff.md`. **La forma común
> de los dos P1:** una verificación cuyo cuerpo entero es un bucle **pasa cuando no hay nada
> que recorrer**, y lo hace imprimiendo un mensaje de éxito.

> **Sesión 20 (2026-09-22), de ARREGLOS, con Opus 5.5.** Cerró los dos P0 de la 19 y los dos P1 que
> iban con ellos, en `fix/review-s19-p0-sync-favoritos`, un commit por hallazgo:
>
> - `R9-105` (`8ea93b6`): la línea de `R9-9` ya tiene prueba, con módulo fresco y sin reset.
> - `R9-103` (`7aafc9c`): la supresión de ecos pasa de global a por (colección, id).
> - `R9-104` (`cfa7c1c`): `stop()` suelta el candado del flush, y el flush viejo no toca nada de
>   la sesión siguiente.
> - `R9-102` (`00f69c4`): editar un favorito encola la fila releída de SQLite.
>
> Cada prueba se vio fallar primero, y cada PIEZA de cada arreglo se revirtió por separado. **La
> propuesta de arreglo de `R9-104` que traía este ledger era falsa:** «sirve para las dos ramas»
> no se sostiene en la rama «el `set()` no vuelve nunca», que es la que toma el SDK de JS. Está
> medido. **Quedan 3 P0 abiertos** (`R9-36`, `R9-38`, `R9-39`). Detalle:
> `detail/S20-arreglos-p0-sync-favoritos.md`.

> **Sesión 21 (2026-09-22): el doble check con Opus 5.5, puntos 1 y 2, solo de REVISIÓN.** No se
> tocó código. Re-verificó en `HEAD` (`ca2cd71`) los 18 P0 arreglados antes de la 19, pieza por
> pieza, y releyó las filas cerradas del Modo A (`A1`..`A11`) y del Modo B (`B1`..`B5`).
>
> **19 hallazgos, `R9-124`..`R9-142`:** 2 P0, 6 P1, 10 P2 y 1 P3. Todo lo que subió a P0 o P1 lo
> verificó a mano el orquestador.
>
> - **Los 18 arreglos se sostienen en `HEAD`.** Lo que falla es la red de pruebas: muchas piezas
>   que protegen un P0 se pueden quitar con la suite entera en verde. Tres de ellas juntas
>   (`R9-130` y las dos de `R9-131`) dejaron **364/364, 4299/4299**.
> - **Los dos P0 están en código que el Modo A ya había pasado.** `R9-124`: un `removed` de la
>   query filtrada se trata como borrado, así que restaurar un respaldo borra en local lo
>   restaurado. `R9-125`: la rama de `signInWithGoogle` sin anónimo no mira el dueño previo, que
>   es `R9-23` por la tercera rama.
> - **Tres afirmaciones del ledger corregidas:** la frase de `R9-23` «el mismo dueño volviendo no
>   se interroga» es falsa en la app real; de las 9 piezas de `R9-47`, jest cubre 1; y `B1` tiene
>   hoy 14 vulnerabilidades (3 high), no 8.
>
> **Quedan 5 P0 abiertos** (`R9-36`, `R9-38`, `R9-39`, `R9-124`, `R9-125`). Los puntos 3 y 4 del
> doble check van en la sesión 22. Detalle: `detail/S21-doble-check.md`.

---

## P0 — dinero, identidad, pérdida de datos, seguridad

> **Conteo, al día tras el checkpoint de la sesión 21. Esta sección tiene 25 entradas: 20
> ARREGLADAS y 5 ABIERTAS** (`R9-36`, `R9-38`, `R9-39`, `R9-124`, `R9-125`). `R9-14` cuenta como ARREGLADA por su **mitad
> estructural**, que es donde estaba su severidad; lo que queda de ella es una decisión de
> producto, dicha en su propia entrada — no código pendiente.
>
> **Las sesiones 7 y 8 venían contando mal.** Su lista de «arreglados» incluía `R9-50`, que
> vive en **P1**, no aquí — así que el «quedan 10» de la sesión 8 eran en realidad **11**.
> Cuenta siempre las entradas de ESTA sección, no los arreglos hechos. Si crees que `R9-50`
> debería ser P0 por su severidad (pérdida silenciosa, la UI dice «Guardado»), muévelo y di
> que lo moviste; lo que no vale es contarlo desde fuera.

- **`R9-9` (A1, entitlements) — 🐛 la revocación de la entitlement premium no se propaga
  nunca.** Severidad **alta**. Es dinero: acceso de pago que sobrevive al reembolso, y
  premium gratis para el segundo usuario de un dispositivo compartido.
  `src/lib/offering/offeringService.ts:121` corta con
  `if (unlocked === lastKnownUnlocked) return;`, y `lastKnownUnlocked` se inicializa a
  `false` en cada arranque del proceso (`:112`). En cualquier arranque en el que
  RevenueCat reporte la entitlement **inactiva**, ese dedupe (`false === false`) corta
  **antes** de `setCachedEntitlement(unlocked)` (`:123`) y **antes** de notificar a los
  listeners (`:124-133`). Un `'true'` viejo en la caché de `expo-secure-store` no se
  corrige jamás. `PremiumContext` se siembra de esa caché al montar
  (`src/context/PremiumContext.tsx:57-61`) y después solo escucha **cambios** (`:64-66`)
  — que ya no van a llegar.
  **Nada lo repara:** `grep` de `SecureStore` sobre `src/` + `app/` da **cero** usos
  fuera de `entitlementCache.ts`. Ni el cierre de sesión, ni el borrado de cuenta, ni el
  reset de Ajustes limpian la clave; y `linkUser()` está documentado a propósito para no
  revocar en el sign-out (`offeringService.ts:200-205`). Solo una desinstalación la
  borra.
  **Repro (verificado con sondas contra el `PremiumContext` y el `offeringService`
  reales + el mock oficial de `react-native-purchases`):** con la caché en `'true'` y
  RevenueCat reportando inactiva → `isPremium = true`, caché en disco `'true'`, y sin
  embargo `getLastKnownEntitlement() = false`. Igual con `linkUser('uid-B')` de un
  usuario sin compra. El **control** en la dirección contraria (caché vacía + RevenueCat
  activa) sí funciona: **el defecto es asimétrico, solo falla la dirección que quita el
  acceso.**
  **Corroboración:** `src/components/settings/ColorThemeSettings.tsx:60-74` tiene un
  `useEffect` cuyo comentario nombra el escenario textualmente ("_the entitlement is
  later revoked (e.g. a refund)_"). Ese revert depende de que `isPremium` pase a `false`,
  que es justo lo que este bug impide. Igual en `ReaderPreferencesSheet.tsx:128-150`.
  **Arreglo sugerido (no aplicado):** el dedupe está bien para no notificar de más; lo
  que está mal es tomar `false` como estado inicial **conocido** cuando en realidad es
  "todavía no sé". Opciones: (a) sembrar `lastKnownUnlocked` desde la caché en
  `initialize()`; (b) escribir siempre la caché y dejar el dedupe solo para la
  notificación; (c) `lastKnownUnlocked: boolean | null` con `null` = sin resolver.
  Detalle completo en `detail/A1-premium-revenuecat.md`.
  **✅ ARREGLADO en la sesión 10** (`bb3b25b`), por la opción (c): `lastKnownUnlocked` pasa a
  `boolean | null`, con `null` = «RevenueCat todavía no ha contestado en este proceso», que
  **no es lo mismo que «no desbloqueado»**. Deduplicar nunca fue el problema; tomar `false`
  por estado CONOCIDO, sí. La primera respuesta de cada proceso es siempre un cambio, así que
  siempre llega a escribir la caché y a avisar. Va en `handleCustomerInfo`, el **punto de
  paso**, no en `initialize()`: así cubre a sus seis llamadores (`initialize`, `linkUser`,
  `restore`, `refreshEntitlement`, `purchaseUnlock` y el listener), y una prueba lo fija por
  la vía de `linkUser` con el arranque sin resolver — el teléfono compartido.
  **Se arregló junto con `R9-10` a propósito: sin él, este arreglo no cambia nada para el
  usuario** (la verdad llegaba y la lectura de caché la pisaba). Y **dos pruebas de
  `OfferingSheet` estaban verdes GRACIAS a este bug**: montaban «ya desbloqueado» sembrando
  solo un `'true'` viejo en la caché con RevenueCat reportando inactiva. Reparadas.
  **⚠️ Sesión 19:** la línea exacta del bug no la protege ninguna prueba — ver `R9-105` (✅ sesión 20); y cerrar sesión le quita el premium a quien pagó, al revés de lo que dicen los docstrings que esta entrada cita — ver `R9-119`.

- **`R9-10` (A1, `PremiumContext`) — 🐛 la lectura tardía de la caché pisa el valor real
  de RevenueCat.** Severidad **media** (se auto-repara en el siguiente arranque), pero el
  usuario afectado es, por definición, uno que **ya pagó**.
  En `src/context/PremiumContext.tsx:54-72` la lectura asíncrona de caché y el listener
  de RevenueCat escriben el mismo estado sin orden garantizado; si el push de RevenueCat
  llega primero, el `setIsPremium(unlocked)` incondicional de la línea **59** lo
  sobrescribe con el valor viejo. Contradice el contrato que declara el propio docstring
  del módulo (`:5-8`: "_those come from RevenueCat's CustomerInfo … and win over anything
  written here_").
  **Repro (verificado, determinista, sin timers):** difiriendo la resolución de
  `getPremiumUnlocked()` y disparando entremedio `initialize()` con la entitlement activa
  → `tras push de RevenueCat: isPremium = true` … `tras resolver la caché: isPremium = false`.
  **Escenario:** usuario que pagó, arranque en frío con la primera lectura de
  `expo-secure-store` lenta (init del keystore de Android) y la caché aún sin reflejar la
  compra — p. ej. tras reinstalar, o tras una escritura fallida, porque
  `entitlementCache.ts:43-48` **se traga los errores de escritura**. Queda premium
  bloqueado toda la sesión.
  **Arreglo sugerido (no aplicado):** ignorar el resultado de la lectura de caché si un
  valor del listener ya llegó (basta un `ref` de "ya resuelto por RevenueCat"), en vez del
  `setIsPremium` incondicional de la línea 59.
  **✅ ARREGLADO en la sesión 10** (`bb3b25b`), exactamente ese arreglo. **Su severidad era
  más alta de lo que decía esta entrada:** no solo «se auto-repara en el siguiente arranque»
  — es que **anulaba el arreglo de `R9-9`**. Con la revocación ya llegando bien, este
  `setIsPremium` incondicional la tiraba a la basura si la lectura de caché resolvía después,
  y el usuario reembolsado conservaba su acceso de pago toda la sesión. Por eso van en el
  mismo commit. De paso, la suscripción a `onEntitlementChange` pasa **antes** de lanzar la
  lectura: un cambio que cayera entre medias no llegaba a ningún listener.

- **`R9-11` (A5/A4, `SyncEngine`) — 🐛 una edición hecha durante un flush en vuelo se
  descarta en silencio.** Severidad **media-alta**. `SyncEngine.ts:1243-1247` borra de la
  cola por `collection+id` tras un push exitoso, sin mirar versión; `upsertQueueEntry`
  (`:490-497`) reemplaza la entrada en sitio ("newer wins"). Si el usuario reedita el mismo
  doc mientras `pushOne` está en vuelo, el filtro elimina la entrada **nueva** como si se
  hubiera empujado. **Escenario:** subraya en amarillo, lo cambia a verde durante el push →
  local queda verde, Firestore se queda **amarillo** para siempre; el teléfono que lo
  origina nunca lo ve. **Arreglo:** comparar identidad de entrada (`seq`/`queuedAt`), no
  solo de documento. Detalle: `detail/A5-escrituras-firestore.md`.
  **✅ ARREGLADO en la sesión 11** (`261c053`), y la identidad salió **exacta y gratis**, sin
  necesidad de `seq` ni de `queuedAt`: `items` viene de `this.queue.filter(...)`, que conserva
  las **mismas referencias**, y `upsertQueueEntry` siempre asigna un **objeto nuevo**, así que
  `this.queue[idx] !== item` significa precisamente «me reemplazaron mientras empujaba».
  **Severidad real más alta de lo que decía esta entrada:** `R9-34` cerró la rama de ERROR,
  pero esta es la de ÉXITO, o sea **la común** — los push normalmente funcionan. Y su vecino
  es peor y tiene prueba propia: si lo encolado durante el push es un **borrado**, lo que se
  tragaba era la **lápida**, así que el borrado no viajaba nunca y la fila **resucitaba en
  todos los demás dispositivos** de la cuenta.
  **⚠️ Sesión 19:** su premisa (`!== item` = «me reemplazó algo más nuevo») es falsa cuando lo que entró es la hidratación — ver `R9-115`. Y el mismo bucle no vuelve a mirar la cuenta tras cada `await` — ver `R9-104` (✅ sesión 20).

- **`R9-13` (A6, web) — 🐛 el lector web crashea en el primer render:
  `hasRedLetterData is not a function`.** Severidad **alta**.
  `ReaderPreferencesSheet.tsx:56` importa el símbolo del especificador **pelado**; en web
  Metro resuelve a `redLetterText.web.ts`, que **no lo exporta** (verificado). La llamada de
  `:121` está en el cuerpo del componente, así que corre aunque la hoja esté cerrada, y
  `BibleVersionProvider` **sí** está montado en web (`_layout.web.tsx:294`), de modo que el
  cortocircuito `!!selectedVersion &&` no protege. Como el `ErrorBoundary` es global y no
  hay boundary por ruta, **cae la app web entera**. Afecta a las 2 pantallas que renderizan
  la hoja en web: lector de capítulo (`chapter].web.tsx:358`) y entrada de diccionario
  (`dictionary/[slug].tsx:750`). **Regresión fechada:** `d753a6e` (2026-08-18). Invisible
  para `tsc` (resuelve al nativo) y para jest (preset nativo).
  **✅ RESUELTO 2026-09-03 el "¿está en producción?": NO, y por 5 días.** El último deploy
  de Firebase Hosting es del **2026-08-13T04:39Z** (consultado por la API de Hosting con la
  credencial cacheada de `firebase-tools`, patrón de
  `reference_essb-firebase-cli-token-for-rules-api`; los 7 releases del historial son del
  2026-07-09 al 2026-08-13). La regresión entró el **2026-08-18**, o sea **5 días después
  del último deploy**. **El sitio vivo está sano; el bug está armado.** Por tanto no es un
  incidente activo, pero **sí es bloqueante del próximo `firebase deploy`**: publicar hoy
  rompe el lector web. Tratarlo como release-blocker, no como P0 en curso.
  Detalle: `detail/A6-paridad-web-native.md`.
  **✅ ARREGLADO en la sesión 12.** `redLetterText.web.ts` exporta `hasRedLetterData`,
  síncrono y sobre un `Set` de módulo (`['WEB']`), **no** sobre el mapa que llena
  `loadRedLetterSpans`. Las dos decisiones van razonadas en el archivo. (1) La divergencia
  con el nativo —que también da `true` para `RVR1960`— es deliberada:
  `scripts/build-web-packs.js` emite **un solo** pack, `web-red-letter.json`, así que en web
  RVR1960 genuinamente no tiene datos, y es exactamente lo que el lector web ya gateaba por
  su cuenta (`chapter].web.tsx:110`, `selectedVersion.id === 'WEB'`). (2) Que la
  disponibilidad no dependa del estado de carga también es decisión: si dependiera, el
  interruptor de la hoja pasaría de deshabilitado a habilitado un instante después de abrir.
  **Verificado en un navegador de verdad**, que es la duda que esta entrada dejaba abierta:
  `npx expo export --platform web` + servidor estático → Génesis 1 renderiza, la hoja de
  preferencias abre entera, «Words of Christ» sale **habilitado**, y no hay `is not a
function` ni error de boundary en consola. El bundle confirma además la resolución: trae
  `loadRedLetterSpans` y `web-red-letter.json`, y **no** trae
  `redLetterByVersion`/`buildSpanMap`/`RVR1960_RED_LETTER` — o sea que el especificador
  pelado resolvió al `.web`, como decía el diagnóstico.
  **Y la segunda mitad, también cerrada en la sesión 12 (Victor pidió el mejor camino, no
  el barato).** El problema era que con la UI en español el web selecciona `RVR1960`
  (`useBibleVersion.tsx:82-88`) y ahí la letra roja no existía: `hasRedLetterData` devolvía
  `false`, el interruptor salía deshabilitado, y el subtítulo seguía prometiendo «Disponible
  leyendo en inglés (WEB) o español (RVR1960)». **En vez de corregir la copia para que
  describiera la carencia, se quitó la carencia.**
  - `scripts/build-web-packs.js` emite ahora **un pack por versión**, y verifica cada uno
    span por span **contra su PROPIO `.sqlite`** (un span es un desplazamiento de caracteres
    dentro de ESA traducción; verificar RVR1960 contra `web.sqlite` no querría decir nada).
    Salida real: `rvr1960-red-letter.json`, 2057 entradas, 2077 spans, todos no-vacíos y en
    rango.
  - `redLetterText.web.ts` pasa de un mapa único a **uno por versión**, con su propia promesa
    en vuelo, y `getRedLetterSpans` recibe `versionId` primero — con lo que queda
    **idéntico en firma al nativo**. Esa asimetría de aridad era una mina: el especificador
    pelado resuelve aquí en web, así que una llamada nativa de 4 argumentos habría leído el
    `versionId` como número de libro y devuelto `undefined` para todo verso, en silencio.
  - El lector web deja de preguntar `selectedVersion.id === 'WEB'` y pregunta
    `hasRedLetterData(...)`, la misma fuente de verdad que usa la hoja para habilitar o
    apagar el interruptor: ya no pueden discrepar.
    **Verificado en navegador** (bundle real, packs servidos en local): Juan 3 en RVR1960
    pinta de rojo la cita de Jesús y deja en blanco la narración y a Nicodemo.
    **✅ PUBLICADO el 2026-09-15** en `eternalstonebible/eternalstonebible.github.io`
    (`c0e3ed7`), junto con el `web-bootstrap.json` actualizado. **Los dos `.sqlite` NO se
    tocaron** — se comprobó por sha256 que los recién construidos son byte a byte idénticos a
    los publicados, así que aquí no se republicó ninguna Biblia. Verificado en vivo: la URL
    sirve HTTP 200 y el sha256 servido coincide con el del manifiesto
    (`97ebc636…`). **Y verificado de punta a punta**: un bundle web construido contra el host
    real (sin override de URL) renderiza Juan 3 en RVR1960 con la cita de Jesús en rojo,
    tomando los spans del pack recién publicado, y sin un solo aviso de fallo de carga.
    **La función está completa y activa, sin pasos pendientes.**
    **Cuatro cosas que conviene no re-descubrir**, todas encontradas al publicarlo:
    1. El push imprime un aviso de renombrado de la organización (`EternalStoneBible` con
       mayúsculas) y aun así funciona por redirección.
    2. **`~/Desktop/web-packs/` contiene `.sqlite` VIEJOS, de julio.** Casi se publican. No
       publiques nada desde ahí sin comprobar el sha256 contra el build.
    3. **Un 404 de GitHub Pages se sirve SIN cabecera CORS**, así que un `fetch` cruzado que
       lo reciba falla con `TypeError: Failed to fetch`, no con «HTTP 404». Y el edge de
       Fastly lo cachea 10 minutos (`Cache-Control: max-age=600`): sondear la URL **antes**
       de publicar envenena la caché y hace parecer roto algo que ya está bien.
    4. **Metro cachea el transform por módulo, incluidas las `EXPO_PUBLIC_*` inlineadas.** Un
       `expo export` posterior SIN la variable puede dejar el valor viejo dentro de un módulo
       concreto: aquí el bundle siguió pidiendo `http://127.0.0.1:8788/packs/` en
       `redLetterText.web.ts` mientras `data-loader.web.ts` usaba la URL buena, y el síntoma
       era idéntico al de un pack ausente. **Si vas a verificar contra el host real después de
       haber construido con un override, `expo export --clear`** — y confirmá con
       `grep -o 'https\?://[^"]*packs/' <bundle>` que no queda ninguna URL local.

- **`R9-14` (A6, web) — 🐛 7 rutas web-alcanzables lanzan "must be used within a
  …Provider".** Severidad **media** (código P0, impacto acotado). El árbol web no monta
  `AuthProvider`, `ReadingProgressProvider`, `ReadingPlanProgressProvider`,
  `CustomPlansProvider`, `TogetherProvider` ni `DonationSheetProvider`, y sus hooks lanzan.
  Con el rewrite catch-all de `firebase.json`, una URL directa a `/features/timeline` (o
  badges, version-comparison, reading-insights, plan/[id], plan-builder, together) tumba la
  SPA entera. T21 arregló 4 hooks; faltaron estos 5. Conteo real **≥ 7** (no se barrió
  `src/`). Detalle: `detail/A6-paridad-web-native.md`.
  **✅ ARREGLADO en la sesión 12 — la mitad estructural, que es la que tenía la severidad.**
  Se tomó la opción (b) del detalle, no la (a): un `ErrorBoundary` **por ruta**, en los dos
  niveles del árbol web. En la raíz, por `screenLayout` del `Stack` (`_layout.web.tsx`), que
  envuelve cada pantalla del stack — las 6 de `app/features/**`. En las tabs, envolviendo el
  `<Slot />` de `(tabs)/_layout.web.tsx` **y solo el Slot**, con la barra de navegación
  FUERA: es la única salida que le queda al usuario y antes se caía con el resto. Eso cubre
  la séptima, `(tabs)/plan/[id].tsx`. La `key={pathname}` del segundo es **portante** y tiene
  prueba propia: un boundary de React retiene su error hasta desmontarse y el `Slot` reusa la
  misma posición para todas las rutas, así que sin la key una sola URL mala envenenaba el
  resto de la sesión.
  **Por qué (b) y no (a):** el propio detalle avisa de que el conteo real es **≥ 7** porque
  solo se grepearon los archivos de ruta — (a) arregla las 7 conocidas, (b) acota la clase
  entera, incluidas las que no están en ninguna lista. Y monta menos: los stubs de `Auth` /
  `ReadingProgress` / `Together` arrastran dependencias nativas reales.
  **Y la mitad que quedaba dicha, cerrada también en la sesión 12.** Las 7 rutas siguen sin
  funcionar en web —eso es la decisión de producto de origen: el build web es una cáscara de
  lectura y esos providers arrastran dependencias nativas— pero **ya no mienten sobre por
  qué**. Antes caían en la pantalla genérica «Algo salió mal», cuyo único botón vuelve a
  renderizar la misma ruta y vuelve a lanzar: un callejón sin salida disfrazado de error
  transitorio. Ahora `ErrorBoundary.web.tsx` reconoce la clase concreta
  (`isMissingProviderError`, en `src/lib/errors/`) y muestra **«Esta sección no está en la
  versión web»** con un botón **«Ir a la Biblia»** que sí sale. Se descartó la opción (a)
  —montar 5 stubs de provider— porque no resuelve nada real: rendería pantallas vacías y
  llevaba dentro una pregunta de producto que no es de ingeniería.
  **Tres detalles que importan:**
  1. Se detecta por **mensaje**, no por subclase de `Error` — los 6 contextos lanzan `Error`
     pelados con texto a mano. El riesgo obvio es que alguien reescriba un mensaje y esto
     degrade en silencio a la pantalla genérica, así que la prueba **no lista strings**:
     llama a los 6 hooks fuera de su provider y comprueba lo que sale de verdad.
  2. Hay un **control** explícito: un error corriente (`Cannot read properties of
undefined`) tiene que seguir dando la pantalla genérica con «Reintentar». Sin él, la
     rama nueva se tragaría el próximo crash de la clase `R9-13` y lo haría pasar por
     decisión de producto.
  3. **La prueba de aislamiento estaba ciega y se cazó al escribir esto:** los dos layouts
     importan el `@components/ErrorBoundary` **pelado**, que bajo el preset nativo de jest es
     el archivo NATIVO, así que las pruebas decían «árbol web» y ejercitaban el otro
     boundary. Es exactamente la clase de `R9-15` — y **la compuerta de paridad no puede
     verla**, porque ambos archivos exportan `ErrorBoundary`: lo que difiere es el
     comportamiento, no la superficie.
     **Verificado en navegador**, con un servidor que replica el rewrite catch-all de
     `firebase.json`: `/features/timeline` por URL directa muestra la pantalla honesta, y «Ir a
     la Biblia» devuelve a la app viva.

- **`R9-22` (A3, sync) — 🐛 la cola de escrituras pendientes no está namespaceada por uid:
  lo que quedó sin subir de la cuenta A se escribe en la nube de la cuenta B.** Severidad
  **alta**. Verificado: `SyncEngine.ts:54` (`@sync_queue_v1`, sin uid), `types.ts:88-101`
  (`PendingWrite` sin uid), `:351` (`stop()` conserva la cola a propósito), `:1315`
  (`pushOne` escribe contra `this.uid`, el **activo ahora**). **Escenario:** Ana edita sin
  red y cierra sesión; Beto entra en el mismo teléfono; la cola se drena contra el uid de
  Beto — y como los ids de `memoryCards` son el `verseKey`, **estables entre usuarios**, la
  lápida de Ana borra la tarjeta de Beto en todos sus dispositivos. Peor si Ana acababa de
  importar un respaldo (`BackupService.ts:973-1026` encola su biblioteca entera).
  **Contraste que lo delata:** los cursores **sí** están namespaceados por uid (`:177`) y el
  flag de bulk push también (`:1146`). Detalle: `detail/A3-auth-borrado-cuenta.md`.
  **✅ ARREGLADO en la sesión 8** (`a9785be`): `PendingWrite` lleva `uid`; lo sellan `queueWrite`, `queueDelete` y el bulk push; el dedup de la cola lo incluye (Juan 3:16 colisiona entre dos cuentas por la clave natural); `flush()` solo empuja las del uid activo, y lo de Ana queda **aparcado** hasta que vuelva, no se tira; `pendingWrites` cuenta solo las del uid activo, o Ajustes le diría a Beto que tiene pendientes que no puede resolver. Una entrada sin `uid` (previa al arreglo) es de dueño indeterminable y se descarta al hidratar. **Ojo al defecto que introdujo el propio arreglo y cazó la prueba nueva:** la condición de re-flush del final de `flush()` miraba `this.queue.length`, que con una entrada aparcada de otro uid es permanentemente > 0 → re-entraba en `flush()` para siempre, un bucle caliente mientras la app estuviera abierta.
  **⚠️ Sesión 19:** la foto de `activeUid` protege el FILTRO, no el push: `pushOne` arma la ruta con el `this.uid` del momento — ver `R9-104` (✅ sesión 20).
  **⚠️ Sesión 21:** el dedupe por uid de la cola no lo vigila ninguna prueba (`R9-137`), y el bucle caliente que «cazó la prueba nueva» hoy solo lo delata un OOM de jest (`R9-142`).

- **`R9-23` (A3, identidad) — 🐛 los datos locales del usuario anterior se suben en silencio
  a una cuenta de Google _nueva_.** Severidad **alta**. El prompt de migración vive **dentro
  del `catch`** de `auth/credential-already-in-use` (`AuthContext.tsx:378-428`); la rama de
  **éxito** de `linkWithCredential` (`:340-377`) no pregunta nada. **Escenario:** Ana cierra
  sesión (lo local se queda, por diseño) → sesión anónima sobre su almacén → Beto entra con
  un Google que nunca usó la app → `linkWithCredential` tiene éxito → sin prompt →
  `maybeRunInitialBulkPush` sube **todas** las notas privadas de Ana a `users/{uidBeto}/`.
  Ana ya no puede borrarlas. **Arreglo:** persistir `@local_store_owner_uid` y disparar el
  `askMigration()` que ya existe cuando el dueño difiere del uid entrante.
  Detalle: `detail/A3-auth-borrado-cuenta.md`.
  **✅ ARREGLADO en la sesión 8** (`e75eca3`): exactamente ese arreglo. `@local_store_owner_uid` se reclama en cada inicio de sesión no-anónimo, y la rama de **ÉXITO** de `linkWithCredential` —la que toma una cuenta de Google nueva, la que no tenía guarda ninguna— enruta por el mismo `askMigration()` cuando el dueño previo difiere. Un primer inicio de sesión y el mismo dueño volviendo **no** se interrogan: esos datos sí son suyos.
  **❌ Corrección de la sesión 21: «el mismo dueño volviendo no se interroga» es falso en la app real.** Solo es cierto en el fixture de la prueba (un anónimo con el uid del dueño), que es un estado inalcanzable: el dueño que vuelve con su Google ya ligado NUNCA toma la rama de éxito del link, toma la de colisión, y ahí la pregunta del Sprint 43 salta siempre que haya datos locales. Sin consecuencia de datos. **Y dos huecos nuevos:** la rama sin anónimo (`currentUser === null`) no tiene guarda (`R9-125`, P0), y el `claimLocalStore` de la rama de colisión no lo vigila ninguna prueba (`R9-130`).

- **`R9-27` (A7, respaldo) — 🐛 una sección degradada en el export es indistinguible de una
  vacía, y al importar BORRA los datos buenos.** Severidad **alta**. Verificado:
  `BackupService.ts:569` devuelve `{payload, degradedSections}` — la marca es **hermana** del
  payload y **nunca entra al archivo**; muere en `DataSettings.tsx:88-99`. La guarda
  `allRowsFailedValidation` (`:915-920`) solo salta con `sourceLen > 0`, así que una sección
  degradada pasa como "vacío legítimo". **Escenario:** una lectura SQLite lanza durante el
  export (7 lecturas en `Promise.all`, y el wrapper documenta fallos intermitentes) → el
  archivo sale con `"favorites": []` → meses después el import hace `DELETE` + 0 inserts y
  dice «importada correctamente». Con `prep.notes: null` es peor: los parsers devuelven `{}`
  **truthy**, así que se escribe `"{}"` y **la Mesa queda vacía**. Mesa, progreso por
  capítulo y logros **no tienen copia en la nube**: pérdida definitiva.
  Detalle: `detail/A7-backupservice.md`.
  **✅ ARREGLADO en la sesión 7** (`7f8e666`): `degradedSections` viaja ahora DENTRO del archivo (`payload.meta.degradedSections`, aditivo dentro del formato v2 — sin bump de versión, para que un build viejo lo ignore en vez de rechazar el archivo), y el import trata una sección marcada como **desconocida**, no como vacía: se salta su borrado destructivo y la reporta en `failedSections`. Cubre las dos mitades del canal, la de SQLite y la de AsyncStorage.
  **⚠️ Sesión 21:** la protección por sección solo está vigilada en 3 secciones y 1 flag (`R9-139`).

- **`R9-28` (A7, respaldo) — 🐛 ningún contexto se recarga tras el import y la UI no pide
  reiniciar: el estado en memoria reescribe encima de lo restaurado.** Severidad **alta**.
  El docstring de `importBackup` (`:1073-1074`) afirma _"see Settings' import handler, which
  asks the user to close and reopen the app"_ — **verificado que la UI no lo hace**:
  `importSuccess` es solo «Copia de seguridad importada correctamente.» en un toast
  (`DataSettings.tsx:147`). **Escenario:** el import escribe `@memory_deck`;
  `MemoryDeckContext` sigue montado con el mazo viejo en `useState`; el primer repaso
  dispara el `useEffect` de `:192-197` y persiste el mazo **anterior**. El mazo restaurado
  desaparece sin toast, sin error, sin log. Mismo patrón en `ReadingProgressContext`,
  preferencias de lector, tema y planes. Detalle: `detail/A7-backupservice.md`.
  **✅ ARREGLADO en la sesión 7** (`7f8e666`): nuevo `emitBackupRestored()` (`src/lib/backup/restoreSignal.ts`), emitido al final de `importBackup`, al que se suscriben los cuatro providers que podían **destruir** lo restaurado escribiendo su copia pre-import encima — mazo de memoria, los dos de progreso de lectura y preferencias del lector. Para lo que la señal no alcanza (pantallas ya montadas), Ajustes **sí** muestra ahora el aviso bloqueante de cerrar y reabrir que el docstring llevaba tiempo afirmando que existía.
  **⚠️ Sesión 19:** la prueba cubre 1 de los 4 providers (`R9-116`), y `FavoritesContext` no escucha la señal (`R9-117`).
  **⚠️ Sesión 21:** el aviso de reiniciar tras importar no lo vigila ninguna prueba (`R9-141`).

- **`R9-33` (A4, `SyncEngine`) — 🐛 no hay backoff: una escritura se descarta en silencio
  tras 8 intentos, y Ajustes dice «sincronizado».** Severidad **alta**.
  `src/lib/sync/SyncEngine.ts:1255-1276`. El backoff que la documentación promete **no
  existe**: `queuedAt` está documentado en `types.ts:98` como _"Used for retry backoff"_ y
  `netinfo.ts:66` justifica haber aflojado la puerta de red diciendo que _"our own queue
  retries with backoff"_ — pero `queuedAt` se **escribe** en 3 sitios (`:402`, `:426`,
  `:1186`) y **no se lee en ninguno** (`grep` verificado a mano). Agotados los 8 intentos,
  el `splice` borra la entrada y `persistQueue()` graba el descarte. **Y el usuario no
  recibe señal alguna:** `lastError` tiene **cero** consumidores fuera de `src/lib/sync/`
  (verificado a mano), y el indicador de Ajustes (`app/(tabs)/settings.tsx:87-112`) se
  construye solo con `pendingWrites`/`isOnline`/`lastSyncedAt` — no tiene rama de error.
  Al descartarse la última entrada `pendingWrites` cae a 0 y la UI afirma «Sincronizado
  hace un momento» en el mismo instante en que el motor tiró la escritura.
  **Repro (sonda ejecutable, re-corrida esta sesión contra el `SyncEngine` real):** con
  `doc.set()` rechazando siempre, `attempts` recorre `[1..7]` y a la 8ª la cola queda
  vacía; `mockDocSets` = 0; `pendingWrites` = 0. **Tiempo en agotar los 8 reintentos: 1
  ms** — la prueba más directa de que no hay espera de ninguna clase. Detalle:
  `detail/A4-syncengine.md`.

  **✅ ARREGLADO en la sesión 9** (`0a4f0fc`, `c41c9cb`): las dos mitades. (a) El backoff que la documentación prometía ahora existe, medido desde el ÚLTIMO INTENTO — campo nuevo `lastAttemptAt`, porque `queuedAt` no se mueve nunca y una escritura encolada sin conexión estaría «vencida» en cada tick. Exponencial 30s→30min con tope: **61,5 min de reloj real** antes de rendirse, no milisegundos (la sesión 10 rehízo la cuenta: 30s+1+2+4+8+16+30 min entre los 8 intentos; el comentario decía «hora y media» y ya está corregido en el código). Una entrada que falla siempre deja además de bloquear a las de atrás. (b) La señal: contador `droppedWrites` **persistido por uid** y una insignia en Ajustes que se limpia solo cuando el usuario la toca. **Ojo para el futuro: `pendingWrites` SÍ tiene consumidor** (`app/(tabs)/settings.tsx:87`); un `grep` limitado a `src/` no lo ve.

- **`R9-34` (A4, `SyncEngine`) — 🐛 la rama de ERROR de `flush()` pisa la reedición con el
  snapshot viejo (gemelo de `R9-11`).** Severidad **media-alta**.
  `src/lib/sync/SyncEngine.ts:1256-1263`. `R9-11` es la rama de éxito; ésta es la de
  error, otra línea y otro arreglo. `item` viene del snapshot `items = [...this.queue]`
  tomado al empezar el flush; si el usuario reeditó el documento mientras `pushOne` estaba
  en vuelo, `this.queue[idx] = {...item, attempts: item.attempts + 1}` **sobrescribe la
  entrada nueva con la vieja**. Es **peor que `R9-11`**: allí la versión nueva seguía en el
  almacén local y solo la nube se quedaba atrás; aquí retrocede **la cola misma**, así que
  ni un reintento posterior con éxito subirá la edición nueva. **Repro (sonda):** cola
  antes del fallo `{"value":"v2-REEDITADO","updatedAt":2000}`; después del rechazo
  `{"value":"v1","updatedAt":1000,"attempts":1}`. Conviene arreglarlo junto con `R9-11`.
  Detalle: `detail/A4-syncengine.md`.

  **✅ ARREGLADO en la sesión 9** (`0a4f0fc`): la rama de error hace el spread de la entrada **viva** de la cola, no del snapshot `item`. Cayó del mismo cambio que `R9-33` porque hay que sellar `lastAttemptAt` en esa misma línea, y se dice aparte en vez de colarlo. **`R9-11`, su gemelo en la rama de ÉXITO, sigue ABIERTO** — es otro arreglo (allí la entrada se elimina por clave, no se sobrescribe).
  **⚠️ Sesión 19:** el control de su prueba reescrita (`2bfa126`) no controla — ver `R9-114`.

- **`R9-35` (A4, `SyncEngine`) — 🐛 un `updatedAt` en el futuro fija el cursor por delante
  del reloj y la bajada se detiene para siempre.** Severidad **media-alta**.
  `src/lib/sync/SyncEngine.ts:800-826` (`advanceCursor`) + `:588` (el suelo de la query).
  `advanceCursor` valida finito, positivo y mayor que el actual, pero **no que no esté en
  el futuro** (verificado a mano: no hay techo). `updatedAt` es reloj de **cliente**
  (`queueWrite:396-400`), y `handleSnapshot` incorpora al cursor también los ecos de las
  propias escrituras del dispositivo (`:684-697`), así que un teléfono con la hora
  adelantada se envenena a sí mismo. Corregido el reloj, toda escritura posterior cae
  **por debajo** del suelo `cursor - 5min` y el listener deja de entregar. El cursor nunca
  retrocede por diseño y **no existe ninguna ruta que lo resetee** (`grep` de
  `cursorStorageKey|sync_cursor` fuera de `SyncEngine.ts`: **cero**, verificado a mano) →
  el único remedio es reinstalar. **Acaba en pérdida de datos:** mientras A no recibe, el
  usuario edita en A un documento que ya cambió en B; el `updatedAt` de A es más nuevo y
  el siguiente push **machaca en la nube el cambio de B**. **Repro (sonda):** con un doc a
  `ahora + 30 días`, tras reiniciar con el reloj correcto el suelo queda 30 días en el
  futuro y una nota legítima de hoy **no llega nunca**. Detalle: `detail/A4-syncengine.md`.

  **✅ ARREGLADO en la sesión 9** (`0a4f0fc`): `advanceCursor` topa en `Date.now()`, así que el envenenamiento ya no puede ocurrir; y `loadCursor` **descarta** un cursor fechado en el futuro, que es lo que cura a un dispositivo ya envenenado. **Topar no bastaba:** lo que se perdió durante la ventana envenenada es más viejo que `ahora - 5 min` y seguiría por debajo del suelo para siempre, así que la única recuperación honesta es re-leer la colección una vez — exactamente lo que hace un dispositivo nuevo, y es autolimitado porque el techo impide que vuelva a pasar.

- **`R9-36` (A4, conflictos) — 🐛 «conservar lo mío» empuja el snapshot de la detección y
  revierte lo que el usuario escribió después.** Severidad **media**.
  `src/lib/sync/SyncEngine.ts:1020-1023` + `app/(tabs)/conflicts.tsx:89,120,230,371`.
  `conflict.localVersion` es una foto del documento **en el momento de detectarse** el
  conflicto (`types.ts:130`); `resolveConflict('keepMine')` la reenvía re-sellada con
  `updatedAt: now` y no toca el almacén local, apoyándose en el comentario _"local store
  already has this value"_ — cierto **solo** si el usuario no tocó el documento desde
  entonces, cosa que nada garantiza (los conflictos esperan a que entre a la pantalla). La
  pantalla tampoco relee lo local: pinta y siembra el borrador de fusión desde el mismo
  snapshot. Si la edición intermedia fue hace más de `CONFLICT_WINDOW_MS` (30 s) no se
  detecta conflicto nuevo y LWW aplica el valor viejo encima: **el botón «conservar lo
  mío» destruye justamente "lo mío"**. **Repro (sonda):** local al pulsar
  `"parrafo original + PARRAFO NUEVO QUE ACABO DE ESCRIBIR"`; empujado
  `{"value":"parrafo original","updatedAt":1000}`. **Alcance acotado** (hacen falta dos
  dispositivos dentro de 30 s), por eso media pese a ser pérdida de texto escrito a mano.
  Detalle: `detail/A4-syncengine.md`.

- **`R9-38` (A4, `SyncEngine`) — 🐛 lo que se edita con la sesión cerrada no se sube nunca,
  y nada lo reconcilia después.** Severidad **media**.
  `src/lib/sync/SyncEngine.ts:388`, `:413` + `:1163-1170`. `queueWrite`/`queueDelete` son
  no-op sin `uid` — correcto como diseño local-first (`A5` lo dio OK) — pero **no hay
  ninguna pasada de reconciliación posterior**. El único mecanismo que sube el estado local
  completo es `maybeRunInitialBulkPush`, que corta si el flag por uid vale `'2'`/`'skip'`,
  justo lo que quedó grabado en la primera sesión. Verificado a mano:
  `@sync_first_push_done:` y `@sync_queue_v1` **solo aparecen dentro de `SyncEngine.ts`** —
  ni el cierre de sesión, ni el borrado de cuenta, ni el reset de Ajustes los tocan.
  **Escenario:** cierra sesión, usa la app una semana (notas, subrayados, tarjetas) y
  vuelve a entrar **con la misma cuenta**: esa semana se queda solo en el teléfono, y como
  LWW compara timestamps lo local es más nuevo y nada delata la divergencia. **Repro
  (sonda):** flag = `'2'`, 3 notas con el motor detenido, cola = 0 entradas, documentos
  empujados tras `start()` = `[]`. Detalle: `detail/A4-syncengine.md`.

- **`R9-39` (A4, conflictos) — 🐛 un conflicto pendiente lo entierra el cursor que adelanta
  cualquier OTRO documento de la misma colección.** Severidad **media**.
  `src/lib/sync/SyncEngine.ts:698-708` + `:360-363`. El motor retiene a propósito del
  cursor la marca del documento en conflicto, pero **la retención es inefectiva**: el
  cursor es un escalar por colección y `maxSeenUpdatedAt` recoge el máximo de **todos los
  demás** documentos, así que basta con que llegue uno más nuevo para saltar por encima del
  conflictivo. Y `stop()` borra la lista de conflictos apoyándose en una promesa explícita
  del comentario (_"fresh onSnapshot events will re-detect any still-divergent docs"_) que
  **es falsa** en cuanto el cursor haya adelantado. El conflicto desaparece sin resolver,
  sin aviso y sin registro, y los dispositivos quedan divergentes hasta que alguien toque
  el documento — momento en el que LWW **elimina en silencio el otro lado**, que es
  exactamente lo que el sistema de conflictos existe para evitar. **Repro (sonda):**
  conflicto detectado y cursor retenido en 0; llega otra nota cualquiera y el cursor salta;
  tras reiniciar, conflictos re-detectados = **0**. Detalle: `detail/A4-syncengine.md`.

> **`R9-44`..`R9-64` vienen del fan-out de 4 de la sesión 6** (filas `A8`–`A11`), probados
> con sondas ejecutables de los agentes.
>
> **Los 6 P0 (`R9-44`..`R9-49`) YA ESTÁN RE-VERIFICADOS A MANO** por el orquestador
> (sesión 6, segunda mitad): **los 6 se sostienen**, con 3 correcciones y 2 refuerzos
> anotados en cada entrada. La corrección que importa está en `R9-46` — el defecto es real
> pero el mecanismo de alcanzabilidad que daba el informe era falso. **Los P1 y P2
> (`R9-50`..`R9-64`) siguen sin re-verificar**; trátalos como más que una lectura y menos que
> un hecho.

- **`R9-44` (A8, subrayados) — 🐛 cambiar el color de un subrayado desde el lector BORRA la
  nota y la categoría que el usuario le había escrito.** Severidad **alta**.
  `app/(tabs)/verse/[book]/[chapter].tsx:1504-1510` llama `addHighlight(...)` con **5
  argumentos**, omitiendo `category` y `note`; `HighlightService.ts:56-104` hace
  `INSERT OR REPLACE` sobre `UNIQUE(verse_id)` escribiendo `category || null` y `note || null`
  (`:94-95`) → **pisa con `NULL`**. Sin lectura previa, sin confirmación, y el lector ni
  siquiera indica que ese versículo tiene nota. También resetea `created_at`.
  **Re-verificado:** el `id` es nuevo en cada llamada (`highlight_${verseId}_${now}`,
  `:66`), así que el `REPLACE` **no** pisa por clave primaria — pisa por la restricción
  **`UNIQUE(verse_id)`**, que está en `HighlightService.ts:35`. (Corrección al informe: la
  tabla `highlights` se crea ahí, en `HighlightService.ts:24-36`, **no** en
  `database/index.ts`, donde solo está `notes`.) **Agravante:**
  el payload sube sin la nota y `pushOne` usa `{merge:true}` (`SyncEngine.ts:1323`), así que
  **Firestore conserva la vieja** → el teléfono la pierde, la nube la mantiene, un
  dispositivo nuevo la resucita. **Repro (sonda, 9/9):** `params[6]`/`params[7]` a `null` en
  la llamada literal de `:1504`. Detalle: `detail/A8-notas-subrayados.md`.
  **✅ ARREGLADO en la sesión 7** (`7f8e666`): si el versículo ya tiene subrayado, recolorear es un `UPDATE` de solo color en vez de un `addHighlight` de 5 argumentos, así que la nota, la categoría y el `created_at` sobreviven. La mitad en la nube la cierra la raíz común con `R9-45`/`R9-50`.
- **`R9-45` (A8, sync) — 🐛 una lápida en `highlights` nunca se limpia: volver a resaltar el
  MISMO versículo no llega jamás a los otros dispositivos.** Severidad **alta**. El adaptador
  usa el `verseId` como id de documento —**clave natural REUTILIZABLE**, decisión documentada
  en `adapters/highlights.ts:19-25`—, `queueDelete` pone `deleted:true`
  (`SyncEngine.ts:412-429`) y el `queueWrite` posterior **nunca pone `deleted:false`**
  (`:387-406`); bajo `merge:true` (`:1323`) el doc queda con color nuevo **y** `deleted:true`
  para siempre, y todo otro dispositivo lo lee como lápida (`:669`). **Se extiende a NOTAS**
  por `BackupService.ts:993-995` (restaurar un respaldo que contiene una nota ya borrada).
  **Repro (sonda):** tras `queueDelete` + `queueWrite`, `doc.color === '#A5D6A7'` **y**
  `doc.deleted === true`; ese doc en un segundo engine produce `DELETE FROM highlights` y
  ningún `INSERT`. **Re-verificado, con evidencia más fuerte que la del informe:**
  `highlightToRemote` (`adapters/highlights.ts:56-68`) **no incluye `deleted`** en el payload,
  y un `grep` de `deleted: false` sobre **todo `src/`** (sin tests) da **CERO resultados** —
  nada en la app limpia una lápida jamás, en ninguna colección. **Matiz de alcanzabilidad:**
  `queueDelete` llama `void this.flush()` de inmediato, así que quitar y volver a poner el
  subrayado **muy rápido** coalesce en la cola (`upsertQueueEntry`) y **no** dispara el bug;
  hace falta que el borrado alcance a subir. Deshacer rápido funciona, rehacer más tarde
  rompe. Detalle: `detail/A8-notas-subrayados.md`.
  **✅ ARREGLADO en la sesión 7** (`7f8e666`): `queueWrite` —y el bulk push inicial— ponen ahora `deleted: false` / `deletedAt: null` **explícitos**. Era el único sitio de la app que podía limpiar una lápida, y no lo hacía nadie.
  **⚠️ Sesión 21:** la mitad del bulk push inicial no la vigila ninguna prueba (`R9-138`).
- **`R9-46` (A8, sync) — 🐛 `notesSyncAdapter.getLocal` falla ABIERTO: si la BD aún no está
  lista, una copia remota VIEJA pisa la nota local más nueva.** Severidad **alta**.
  `adapters/notes.ts:50-56` es **el único de los 4 métodos del adaptador que NO llama
  `bibleDB.initialize()`** (los otros sí, `:77`/`:109`/`:122`; el de subrayados lo hace en los
  cuatro). `getNotes()` lanza `"Database not initialized"` y `findNoteById` **captura y
  devuelve `null`**, indistinguible de "no existe" → el motor **se salta el LWW y la detección
  de conflictos**: las dos viven dentro de `if (local && data)` en `applyRemoteChange`
  (`SyncEngine.ts:715-749`), así que con `local === null` la ejecución cae directo a
  `applyRemoteUpsert`. **Cuándo se abre la ventana — CORREGIDO en la re-verificación:** el
  informe original decía "en cada arranque en frío, porque los efectos de React corren de hijo
  a padre". **Eso es falso**: `engine.start()` no está en un efecto de orden de montaje sino en
  uno **gated por auth** (`SyncEngineContext.tsx:92-128`, deps `[engine, user]`, guardado por
  `if (user && !user.isAnonymous)`), que por diseño **no** dispara en la primera pasada — el
  propio comentario del archivo dice que `user` pasa por `null` durante la rehidratación. Lo
  cierto, y **peor**, es que **no existe ningún orden garantizado**: `database.initialize()` y
  `engine.start()` son dos cadenas async independientes lanzadas por dos providers distintos, y
  **nada hace esperar al motor por SQLite**. La carrera real es rehidratación de Firebase Auth
  (disco, rápida) + `start` + primer snapshot de caché offline **contra**
  `_performInitialization()` → `seedFromBundleIfMissing()` (`database/index.ts:375`), que copia
  un `bible.db` de varios MB. **Así que la ventana es más ancha justo en una instalación nueva
  o una reinstalación** — que es exactamente cuando baja el grueso de las notas remotas.
  **Repro (sonda, con el motor y el adaptador reales):** local `updatedAt=9_000_000` vs remoto
  `5_000_000` → se ejecuta `INSERT OR REPLACE INTO notes` con el texto viejo; el control con la
  BD sana no inserta nada. **Nota de alcance:** el adaptador de subrayados **también** devuelve
  `null` al fallar (`adapters/highlights.ts:81-88`); lo que hace único a `notes` es que su
  ventana se abre sola, sin que `initialize()` tenga que fallar. Detalle:
  `detail/A8-notas-subrayados.md`.
  **✅ ARREGLADO en la sesión 8** (`b3d73e1`): `findNoteById` inicializa primero (idempotente, coalesce llamadas concurrentes) y deja **propagar** un fallo real de lectura. Como propagar a secas habría abortado la tanda entera de `handleSnapshot` y podría parar el sync en silencio (la clase de `R9-33`/`R9-35`), `applyRemoteChange` devuelve ahora **si pudo establecer el estado local**: si no pudo, se salta ESE documento y **retiene su aporte al cursor**, para que se re-entregue en el próximo reattach en vez de perderse.
  **⚠️ COMPLETADO en la sesión 9** (`3e780c6`): el retiro del cursor de abajo estaba **a medias** — `handleSnapshot` guarda UN solo `maxSeenUpdatedAt` por lote, así que un hermano más nuevo del MISMO lote arrastraba el piso por delante del doc saltado y el siguiente reattach ya no lo entregaba (medido: piso `8_700_000` sobre un saltado en `1_000_000`). El cursor del lote se acota ahora por debajo del `updatedAt` más bajo no aplicado. Ver `detail/S9-revision-del-diff.md`.
  **⚠️ Sesión 19:** el retiro del cursor solo vale dentro del lote — ver `R9-106`.
  **⚠️ Sesión 21:** la «nota de alcance» de los subrayados sigue abierta en `HEAD` y ya tiene número (`R9-132`); el mismo principio falla en la ESCRITURA (`R9-128`) y en el `getLocal` de favoritos (`R9-133`).
- **`R9-47` (A9, Mesa) — 🐛 `load()` no tiene guarda de obsolescencia: una carga vieja que
  llega tarde pisa los `drafts`, y el siguiente `onBlur` escribe esa prosa ajena (o vacía)
  sobre la clave del pasaje visible.** Severidad **alta**. Es dato irreemplazable: el sermón
  escrito a mano. `app/features/prep/index.tsx:464` es un `useCallback` con deps
  `[table, params.version]` en un `useEffect` **sin cleanup**; cada toque del stepper arranca
  una carga nueva sin cancelar la anterior (no hay request-id ni comprobación de pasaje) y
  `setDrafts` (`:592`) / `setTemplate` (`:598`) se aplican incondicionalmente. `handleNoteBlur`
  (`:1053-1065`) no lee el `TextInput` sino el estado, y escribe `drafts[section] ?? ''` **bajo
  `table.passageKey`**; el `?? ''` convierte una prosa ausente en un **borrado**
  (`prepNotes.ts:157-170`). **Repro (3 sondas, 3 consecuencias):** con dos toques («+ Fin»,
  «− Fin») la nota queda **borrada**; o **reemplazada por el sermón del otro rango**; o la
  carga arrastra el **template ajeno** y lo que se escriba queda bajo un id de sección que la
  plantilla nunca devuelve → **invisible para siempre** (no se re-renderiza, no sale en PDF, ni
  en «copiar esquema», ni en el Historial). **Segundo disparador sin carrera:** `table` depende
  de `isPremium` (`:328`), así que un cambio de titularidad de RevenueCat re-corre `load()`
  sobre el mismo pasaje. **Re-verificado, los 5 puntos se sostienen**, y con un detalle que
  el informe no vio: el comentario de `:593-597` justifica que el `setTemplate` sea
  **incondicional** _"para nunca arrastrar una plantilla obsoleta"_ — es el autor razonando
  sobre este peligro exacto y quedándose a un paso, porque sin guarda de obsolescencia en la
  **carga**, incondicional es justo lo que hace aterrizar la plantilla ajena. Y el docstring
  de `setMapSectionNote` (`prepNotes.ts:162-165`) confirma el borrado: _"An edit that empties
  the last section drops the passage entry entirely."_ Detalle:
  `detail/A9-mesa-persistencia.md`.
  **✅ ARREGLADO en la sesión 7** (`7f8e666`): `load()` tiene id de ejecución monótono y el re-lectura estrecha del `useFocusEffect` tiene cleanup, así que una carga vieja ya no aterriza; y `handleNoteBlur` no escribe una sección sin borrador (se acabó el `?? ''` que borraba) y archiva bajo la clave a la que pertenecen los borradores, no bajo `table.passageKey`. **Ojo:** la prueba automatizada cubre la consecuencia de BORRADO; la carrera del stepper en sí sigue pendiente de verificación en dispositivo (Modo C), porque react-test-renderer desmonta el árbol al re-renderizar una pantalla de ese tamaño.
  **⚠️ Sesión 21, medido: jest cubre 1 de las 9 piezas del arreglo** (el `?? ''` del `blur`, que es la consecuencia de BORRADO). La guarda de obsolescencia de `load()` y todo el re-keying bajo `draftsPassageKeyRef` (las otras dos consecuencias del repro: la prosa del otro rango y la plantilla ajena) se pueden quitar las 8 a la vez con la suite entera en verde, 364/4299. La deuda de Modo C incluye el re-keying, no solo la guarda. Detalle: `detail/S21-doble-check.md`.
- **`R9-48` (A10, identidad) — 🐛 el log de repasos nunca se borra al cerrar sesión: el
  historial del usuario A se escribe dentro de la cuenta del usuario B y destruye su
  agregado.** Severidad **alta**. `AuthContext.tsx:471` (y `:572`) solo llama
  `clearMemoryStatsFloor()`; su docstring lo admite: _"Does NOT touch the local review-event
  log"_ (`memoryStatsSync.ts:176`). La tabla `review_events` **nunca está uid-scoped** y nada
  la borra fuera de `BackupService` (`grep "DELETE FROM review_events" src/` → 1 hit). Rompe
  las dos mitades: el floor de B **no se siembra nunca** (`:89-90`), y
  `maybeWriteMemoryStatsSummary()` combina `getActiveUid()`=B con los eventos de A y hace
  `.set()` — **sobrescritura total, no merge** (`:140-143`). Como `reviewEvents` ya no
  sincroniza, ese doc era **el único ancla de B en la nube**. **Mecanismo DISTINTO de
  `R9-22`/`R9-23`** (no pasa por la cola del `SyncEngine`): **namespacear la cola no lo
  arregla.** **Repro (sonda):** `mockDocGet` nunca llamado; se escribe a
  `users/uid-B/memoryStats` con `longestStreak: 5` donde B tenía `400`. **Re-verificado:**
  `signOut` (`AuthContext.tsx:462-472`) solo llama `clearMemoryStatsFloor()`; el `.set()` de
  `memoryStatsSync.ts:141-143` va **sin `{merge:true}`** (a diferencia de `pushOne`), o sea
  sobrescritura total; y la puerta de frescura es literal `if (events.length > 0) return`
  (`:89-90`). Corrección menor al informe: hay **dos** sitios que borran de `review_events`,
  no uno — `BackupService.ts:1377` (masivo) y `reviewEventStore.ts:132` (una fila por id);
  **ninguno está atado a un límite de sesión o de cuenta**, así que el hallazgo no cambia.
  Detalle: `detail/A10-memoria-srs.md`.
  **✅ ARREGLADO en la sesión 8** (`67af8c9`): marca `@review_log_owner_uid`, en vez de scopear la tabla. Un log sin dueño lo reclama quien escribe primero; un log de OTRA cuenta no se sube nunca; y el traspaso ocurre **al iniciar sesión**, único punto donde se sabe que hay un uid nuevo: se limpia el log y se reclama. **Sin ese traspaso, la guarda sola dejaba al segundo usuario sin poder escribir su propio agregado para siempre.** Si la limpieza falla, la propiedad NO se reclama. **Que cerrar sesión deba además BORRAR el log local sigue siendo decisión de producto (`R9-59`) y no se decidió aquí.**
  **⚠️ COMPLETADO en la sesión 9** (`29a9449`): el traspaso quedaba **debajo** de `if (existing != null) return;` en `seedMemoryStatsFloorIfFresh`, y `signOut` dispara `clearMemoryStatsFloor()` sin esperarlo (`void`) — un cierre de la app justo después de cerrar sesión deja el suelo ajeno en disco y el traspaso **no corre nunca más**, porque nada lo reintenta. La cuenta nueva quedaba con su agregado rechazado para siempre (y `memoryStats/summary` es su único ancla en la nube). Subido por encima de la guarda, y borrando además el suelo ajeno. Ver `detail/S9-revision-del-diff.md`.
  **⚠️ Sesión 21:** la guarda de escritura falla ABIERTA si no puede leer el marcador (`R9-134`).
- **`R9-49` (A11, respaldo) — 🐛 los 4 logs de lectura no pueden marcarse "degradados", así
  que un fallo transitorio de SQLite produce un archivo que al importar BORRA la racha y los
  ledgers.** Severidad **alta**. `safeQuery` (`BackupService.ts:356-371`) solo marca degradado
  desde su `catch`, pero `getReadingLog()`, `getCompletedBooks()`, `getBookReadingLog()` y
  `getChaptersReadLog()` (`AchievementService.ts:855`/`:879`/`:912`/`:944`) **se tragan su
  propia excepción** y devuelven `[]` → la bandera `degradedSections` es **código
  físicamente inalcanzable** para las 4 secciones que contienen toda la historia de lectura.
  Al importar, `allRowsFailedValidation` exige `sourceLen > 0` (`:937-942`), con `[]` da falso,
  y `restoreBackup` ejecuta **`DELETE FROM reading_streak_log`** con 0 inserts (`:1054-1063`).
  **Remate:** `recomputeReadingStreak()` corre en **cada** `initialize()` (`:128`) y hace
  `UPDATE user_stats SET longest_streak = ?` **sin `MAX()`** (`:530-533`), así que el récord
  restaurado se sobrescribe con 0 en el arranque siguiente. **Canal distinto y peor que
  `R9-27`** (allí la marca existe y no llega al archivo; aquí **no se levanta nunca**):
  **arreglar `R9-27` NO cierra esto.** **Repro (sonda):** con un `db` que siempre lanza, los 4
  getters devuelven `[]` y `degradedSections` sale vacío, mientras `getRawUserStats()` sí se
  marca. **Re-verificado, la cadena entera se sostiene:** los 4 getters cierran con
  `} catch { return []; }` literal (`:841`, `:866`, `:892`, `:926` son sus firmas);
  `safeQuery` solo hace `degraded?.push(label)` **dentro de su `catch`**;
  `allRowsFailedValidation` es literal `sourceLen > 0 && survivedLen === 0`;
  `recomputeReadingStreak()` está en `initialize()` con el comentario _"Self-heal the reading
  streak from the per-day log **on every launch**"_; y el `UPDATE` de `:531-533` no tiene
  `MAX()`. **Y el propio código se delata:** el docstring de `allRowsFailedValidation`
  distingue a propósito "fallo genuino" de "sección legítimamente vacía" para que **solo el
  primero** bloquee el `DELETE` destructivo — pero los 4 getters hacen que un fallo genuino
  **se vea** como vacío legítimo, así que la distinción se derrota aguas arriba. Detalle:
  `detail/A11-progreso-rachas.md`.
  **✅ ARREGLADO en la sesión 7** (`7f8e666`): los 4 getters aceptan `{strict: true}`, que solo usa el export — los llamadores de UI siguen degradando a `[]`, que es correcto para una instalación nueva. Con eso la bandera deja de ser inalcanzable y `R9-27` la hace llegar al archivo. El remate también: `recomputeReadingStreak` usa `MAX(longest_streak, ?)`, porque el récord de por vida solo puede subir.
  **⚠️ Sesión 21:** el `{strict: true}` del export y el `data.degraded` del servicio no los vigila ninguna prueba (`R9-131`, P1), el `MAX` tampoco (`R9-140`), y `getAllReviewEvents` es un quinto getter que se traga su error (`R9-129`).

---

- **`R9-102` (S19, favoritos / sync) — 🐛 editar un favorito a menudo NO se encola: la edición
  se ve en pantalla y nunca llega a la nube.** Pasa en `FavoritesContext.tsx:379-394`.
  **El mecanismo:**
  - `updateFavorite` escribe en SQLite, y solo encola el push si `mergedForSync` quedó asignado
    **dentro del actualizador** de `setFavorites`.
  - React solo ejecuta ese actualizador en el acto (el atajo de «eager state») cuando la fibra
    no tiene trabajo pendiente. Si lo tiene, lo corre en el próximo render, y en la línea
    siguiente `mergedForSync` vale `undefined` → **no hay `queueWrite`**.

  **Medido con el reconciliador REAL de React 19.2.3** y el provider real:
  - En el flujo ordinario (tick del motor → foco en la pestaña Favoritos, que llama a
    `refreshFavorites` → 3 ediciones) salen encoladas `[0,0,0]`, y la pantalla muestra el cambio.
  - La primera edición tras montar, y dos seguidas: también 0.
  - Control del mecanismo: con un tick del contexto del motor antes de cada edición, `[1,1,1]`.

  **El efecto es el de `R9-11`:** `pendingWrites` queda en 0, la nube nunca recibe el cambio, y
  la siguiente edición del mismo favorito desde otro dispositivo gana por LWW y lo pisa.
  - Llamadores: `AddToCollectionSheet.tsx:89` y `app/collections/[name].tsx:114`, o sea que
    también afecta a las colecciones.
  - Existe desde `1b94b78` (Sprint 42) y ninguna prueba lo cubre. **Sin verificar en dispositivo.**

  **Arreglo:** calcular `merged` FUERA del actualizador, a partir de la fila que se acaba de
  escribir, y encolar siempre. La prueba tiene que forzar trabajo pendiente en la fibra antes de
  editar, o no discrimina. Detalle: `detail/S19-revision-del-diff.md`.
  **✅ ARREGLADO en la sesión 20** (`00f69c4`): el payload sale de la fila recién escrita
  (`bibleDB.getFavoriteById`), no del estado de React, que tampoco ve un favorito añadido hace un
  instante. Prueba con la fibra ocupada (vista fallar: 0 encoladas) y la del vecino, que caza el
  arreglo a medias hecho con un ref. El SQL nuevo, medido contra SQLite real. **Sigue sin
  verificar en dispositivo.** Detalle: `detail/S20-arreglos-p0-sync-favoritos.md`.

- **`R9-103` (S19, `SyncEngine`) — 🐛 una edición local durante una BAJADA en vuelo se descarta
  en silencio, en cualquier colección.**
  **El mecanismo:**
  - `suppressLocalWriteCount` (`SyncEngine.ts:246`) es un contador **global**.
    `applyRemoteUpsert` lo sube mientras espera a SQLite (`:505-509`), y mientras está arriba
    `queueWrite` y `queueDelete` salen sin hacer nada (`:451`, `:479`).
  - La supresión existe para no volver a encolar el eco de lo que se está aplicando. Pero
    **ningún adaptador llama a `queueWrite` dentro de un apply** (verificado), así que su único
    efecto real es tragarse las ediciones del USUARIO que coinciden en el tiempo.

  **Medido con el motor real:** tres ediciones durante una bajada en vuelo dan cola `[]`, nada
  subido, `pendingWrites 0` y `droppedWrites 0`. Sin bajada en vuelo, las mismas tres suben.

  **El efecto es el de `R9-11`, lápida incluida:** un borrado local que se pierde reaparece en
  todos los dispositivos. La ventana es **ancha** justo cuando más se baja: dispositivo nuevo,
  reinstalación, o la re-descarga de `R9-35`. Las revisiones `A4` y `A5` lo daban por «bien
  hecho».

  **Arreglo:** suprimir por **(colección, id)** del doc que se está aplicando, no globalmente.
  Detalle: `detail/S19-revision-del-diff.md`.
  **✅ ARREGLADO en la sesión 20** (`7aafc9c`): `suppressedDocs` por (colección, id), con
  profundidad. Un apply de OTRO doc ya no suprime (vista fallar); el eco del MISMO doc sí, a
  propósito. También podía tragarse el re-upload entero de un respaldo importado
  (`pushImportedEntitiesToSync`) y el `queueWrite` de un `keepMine`. Queda, dicho en el código,
  la edición del MISMO doc durante su propio apply.

---

- **`R9-124` (S21, `SyncEngine`) — 🐛 el motor trata como BORRADO el `removed` de la query
  filtrada: restaurar un respaldo borra en local justo las filas restauradas.** CONFIRMADO con el
  SDK de JS real y con el motor real. **El SDK nativo de Android NO se midió.**

  **El mecanismo:**
  - `SyncEngine.ts:917-926` hace `applyRemoteDelete(id)` ante `change.type === 'removed'`. El
    comentario lo llama «_Hard remove (rare — we soft-delete via tombstone)_», y eso era cierto
    cuando el listener no tenía filtro.
  - Desde el endurecimiento de cuota, la query es `where('updatedAt', '>=', cursor - 5 min)`. En
    Firestore, `removed` quiere decir «el doc **salió del conjunto** de la query», no «se borró».
  - Un doc reescrito con un `updatedAt` **más viejo** que el piso sale del conjunto. El motor lo
    borra de SQLite dentro de `withLocalWriteSuppressed` (sin lápida), y como su copia en la nube
    queda por debajo del piso, **el siguiente reattach no lo vuelve a entregar**.

  **Medido en dos mitades:**
  - **SDK de JS 12.17.0 real**, 100 % offline (`disableNetwork`, proyecto `demo-`, caché en
    memoria): reescrito X con `updatedAt` 100 bajo un piso de 500, sale
    `snapshot 2 [{"type":"removed","id":"X",...}]`. El doc sigue existiendo.
  - **El motor real** ante ese cambio: `{"remoteDeleteCalls":["X"],"localStillHasX":false}`.

  **El escenario que lo hace P0 con UN solo dispositivo es restaurar un respaldo:**
  - `pushImportedEntitiesToSync` (`BackupService.ts:1008-1076`) re-encola cada entidad con el
    `updatedAt` **del archivo**, y `queueWrite` lo respeta (`:506-509`), así que el eco sale por
    debajo del piso del propio listener.
  - `importBackup` **no detiene el motor**: no hay `stop()` en `BackupService.ts`.
  - Así, restaurar el respaldo de ayer para deshacer algo de hoy BORRA de SQLite las filas tocadas
    hoy. Quedan solo en la nube, con la marca vieja. `notes.applyRemoteDelete` es `removeNote`, un
    borrado duro. (La cadena `importBackup` → SDK real se encadenó por lectura, a partir de las
    dos mitades medidas.)
  - Otros disparadores: el bulk push inicial con copias locales más viejas que la nube (ver
    `R9-126`), y un reloj atrasado. Este último es **más estrecho** de lo que dijo el agente,
    porque el piso se fija al ENGANCHAR y no avanza.

  **Por qué la suite no lo ve:** el mock de `onSnapshot` (`SyncEngine.test.ts:184-199`) **FILTRA**
  los cambios que no casan con el `where` en vez de emitirlos como `removed`. El mock sustituye la
  semántica del SDK. Nada en el ledger miraba el significado de `removed` bajo la query filtrada.

  **Antes de arreglar:** medir el SDK nativo en Modo C, en el emulador, con el OK de Victor y
  **nunca con su teléfono** (como `R9-104` en la 20). **Arreglo (hipótesis):** un `removed` solo
  significa borrado si el doc ya no existe. Si no, el motor tiene que ignorarlo. Detalle:
  `detail/S21-doble-check.md`.

- **`R9-125` (S21, identidad) — 🐛 `signInWithGoogle` sin anónimo (`currentUser === null`) no
  mira el dueño previo: es `R9-23` por la tercera rama.** CONFIRMADO con sonda.

  **El mecanismo:**
  - `AuthContext.tsx:381` solo entra al bloque del link, que es donde vive la guarda de `R9-23`,
    si `current && current.isAnonymous`.
  - Si `currentUser` es `null`, `:505-507` hace `signInWithCredential` + `claimLocalStore` sin
    mirar el dueño previo: sin `exportLocalData`, sin `askMigration` y sin
    `queueSkipNextBulkPush`.
  - Después, `maybeRunInitialBulkPush` (`SyncEngine.ts:1525-1560`) sube el almacén entero, porque
    no hay flag para ese uid.

  **Cómo se llega a `null`:** el `signInAnonymously()` que sigue a un cierre de sesión FALLA (sin
  red). `:343-353` solo re-arma `triggeredAnonymousRef` en el `catch`, y nada reintenta hasta el
  próximo evento de auth o el próximo arranque en frío. Ajustes muestra entonces «Iniciar sesión
  con Google». **Escenario:** Ana cierra sesión sin datos, y Beto entra con un Google nuevo cuando
  vuelve la red. Las notas privadas de Ana suben a la nube de Beto sin pregunta.

  **Sonda** (provider real, anónimo que rechaza, dueño previo `ana-uid`, 12 notas):
  `{"promptShown":false,"exportLocalDataCalls":0,"queueSkipCalls":0,"linkCalls":0,"ownerAfter":"beto-uid"}`.

  El disparador es estrecho (el anónimo falla al cerrar sesión y no se reinicia la app), pero la
  consecuencia es la de `R9-23` entera. **Va junto con `R9-130`**, que está en las mismas líneas.
  **Arreglo (hipótesis):** mirar el dueño previo ANTES de bifurcar, con una prueba que pase por
  las tres ramas (éxito del link, colisión y sin anónimo). Detalle: `detail/S21-doble-check.md`.

## P1 — núcleo de la app

- **`R9-126` (S21, `SyncEngine` / respaldo) — 🐛 un push con `updatedAt` VIEJO (restaurar, bulk
  push) pisa en la nube la versión más nueva, y ningún otro dispositivo se entera.** CONFIRMADO
  por lectura; la mitad del listener está medida en `R9-124`.
  - `queueWrite` conserva el `updatedAt` del payload (`SyncEngine.ts:506-509`), y
    `pushImportedEntitiesToSync` (`BackupService.ts:1008-1076`) pasa el del archivo. El `set()`
    con `{merge: true}` es incondicional.
  - La nube no aplica LWW: solo los lectores lo hacen. Las reglas (`B4`:
    `allow read, write: if request.auth.uid == uid`) no validan `updatedAt`.
  - El doc queda con una marca por debajo del piso de todos los demás listeners, así que ninguno
    recibe la versión restaurada: la ignora, o la BORRA (`R9-124`). La nube y los otros
    dispositivos divergen en silencio, y un dispositivo nuevo baja la versión vieja.
  - No es lo que ya estaba dicho: `CONTINUAR.md` §6 anota que el bulk push puede REVIVIR una
    lápida, y `R9-31` que el import no propaga BORRADOS. Ninguno dice que el import **regresa** la
    versión de la nube.

- **`R9-127` (S21, `SyncEngine` / auth) — 🐛 el `skipNextBulkPush` que arma `deleteAccount` anula
  un «Sí, migrar» de la cuenta SIGUIENTE, para siempre.** CONFIRMADO con sonda.
  - `skipNextBulkPush` es un booleano de INSTANCIA, sin uid (`SyncEngine.ts:308`). `deleteAccount`
    lo arma (`AuthContext.tsx:593-594`), y nadie lo consume hasta el siguiente `start()` de
    CUALQUIER uid.
  - Tras el borrado entra un anónimo nuevo. Si en la misma sesión alguien inicia sesión con Google,
    el link tiene éxito, `R9-23` pregunta, y el usuario responde «Sí». La rama del sí
    (`:400-406`, `:483-488`) no toca el motor, así que `start(nuevo)` consume el flag del borrado y
    escribe `@sync_first_push_done:nuevo = 'skip'`, que se honra para siempre (`:1545`).
  - Sonda: `{"flagNuevo":"skip","pushesNuevo":0}`, y 0 también tras reiniciar. Ninguna fila local
    sube nunca a la cuenta nueva, salvo la que se edite después.
  - Es la forma de `R9-103` (un estado global que cruza de cuenta), en el flag de migración. El
    comentario de `deleteAccount` (`:564-571`) es anterior a la pregunta de `R9-23`.

- **`R9-128` (S21, adaptadores de sync) — 🐛 un apply remoto que FALLA se traga su error y el
  cursor avanza igual: el cambio remoto no vuelve nunca.** CONFIRMADO con sonda del motor.
  - `adapters/notes.ts:92-122` (upsert) y `:124-135` (delete), y lo mismo en `highlights.ts:95-139`
    y en `FavoritesContext.tsx`, hacen `catch → warn` sin relanzar. El motor ve un `await` que resolvió, lo cuenta como aplicado, y mete su
    `updatedAt` en el cursor.
  - `R9-46` arregló ese principio solo para la LECTURA (`getLocal`); la ESCRITURA fallida sigue
    contando como hecha. `FavoritesContext.tsx:207-218` además quita la fila del estado de React
    aunque siga en SQLite.
  - Sonda: `{"appliedLocally":false}`, el cursor avanza a T, y `notaBRedeliveredAndApplied:false`.
    Si el usuario edita después en ese dispositivo, su push (más nuevo) pisa la edición del otro,
    o revive lo que el otro borró.
  - P1 y no P0 porque el disparador (una escritura SQLite que falla: `database is locked`, disco
    lleno) es raro.

- **`R9-129` (S21, respaldo / memoria) — 🐛 `getAllReviewEvents` se traga su error: la sección
  `reviewEvents` del respaldo nunca se marca degradada, y el sembrado toma un dispositivo con
  historial por uno fresco.** CONFIRMADO con sondas, con el `reviewEventStore` REAL.
  - `reviewEventStore.ts:80-97` hace `catch → []`. `buildBackup` la envuelve en `safeQuery`
    (`BackupService.ts:551-555`), que solo marca desde su `catch`. Es el quinto getter de la forma
    de `R9-49`, y el arreglo `{strict: true}` no lo tocó.
  - **Export → import:** `{"degradedSections":[]}` (el control con favoritos sí se marca). El
    import hace `DELETE FROM review_events` 1 e `INSERT` 0, y da `reviewEvents` por restaurada.
  - **Sembrado:** `memoryStatsSync.ts:170-172` usa `events.length > 0` como señal de «no fresco».
    Con la lectura fallida (`readFails:true`) se siembra el floor con la propia historia del
    dispositivo, y cada repaso cuenta ×2 para siempre (la consecuencia medida de `R9-53`). Además
    aparece el aviso «restauramos tu progreso». El control con la lectura sana no siembra.
  - Las suites `backupServiceExport.test.ts:73` y `backupDegradedSections.test.ts:57` mockean
    `getAllReviewEvents` con una factoría literal, y sustituyen justo lo que importa.

- **`R9-130` (S21, prueba de identidad) — 🐛 el `claimLocalStore` del camino directo de
  `signInWithGoogle` no lo vigila ninguna prueba, y su regresión reabre `R9-23`.** CONFIRMADO por
  revert y sonda.
  - `AuthContext.tsx:506-507` es el ÚNICO sitio que reclama el almacén para una cuenta que ya
    existe (teléfono nuevo o reinstalación → el link choca → rama de colisión →
    `signInWithCredential`). Sin esa línea la marca queda en `null`, y `null` es lo que la guarda
    de `R9-23` lee como «primer inicio, no preguntes».
  - Revert de esa línea: `AuthContext.test.tsx` 24/24 y suite entera **364/364, 4299/4299**.
  - Sonda por el provider real: en `HEAD`,
    `{"ownerAfterAna":"ana-uid","promptShown":true,"exportCallsForBeto":1}`. Con el revert,
    `{"ownerAfterAna":null,"promptShown":false,"exportCallsForBeto":0}`: las notas de Ana suben a
    la nube de Beto.
  - Son las mismas líneas que `R9-125`: **un solo arreglo**, con una prueba que pase por las tres
    ramas.

- **`R9-131` (S21, prueba de respaldo) — 🐛 las dos mitades que protegen la historia de lectura
  (`{strict: true}` del export y `data.degraded` del servicio) no las vigila ninguna prueba, y su
  regresión reabre `R9-49`.** CONFIRMADO por revert y sonda.
  - La prueba del export usa un servicio falso cuyos 4 getters **rechazan siempre**, con o sin
    `strict`. Quitar el `{strict: true}` de las 4 llamadas (`BackupService.ts:528/534/540/546`)
    la deja verde. Con el servicio real, el ledger ya no se marca y `streakLog: []` sale igual que
    el de un usuario que nunca leyó.
  - La prueba del import usa un `restoreBackup` que es un `jest.fn()`: comprueba que el FLAG
    llega, no que el servicio lo respete. Quitar `if (data.degraded?.[key]) return 'degraded';`
    (`AchievementService.ts:1060`) deja todo verde. Con el servicio real, el import corre los 4
    `DELETE` de ledgers mientras `failedSections` le dice al usuario que no se tocaron.
  - Los dos reverts, **junto con el de `R9-130`, en una sola corrida entera: 364/364,
    4299/4299**, verificado a mano por el orquestador. `achievementServiceRestoreBackup.test.ts`
    no menciona `degraded` en ninguna línea.

- **`R9-104` (S19, `SyncEngine`) — 🐛 el flush no vuelve a mirar la cuenta después de cada
  `await`, así que puede escribir datos de Ana en la nube de Beto.** **Candidato a P0** (clase
  `R9-22`); más abajo, cómo decidirlo.

  **El mecanismo:**
  - `flush()` toma una foto `activeUid = this.uid` y filtra la cola con ella (`:1569-1571`). Eso
    es el arreglo de `R9-22`.
  - Dentro del bucle hace `await this.pushOne(...)` ítem por ítem, y **`pushOne` arma la ruta
    con el `this.uid` DEL MOMENTO** (`:1702`). Su guarda (`:1700`) solo comprueba que haya
    _algún_ uid.

  **Medido con el motor real** (Firestore mockeado y `set()` diferido). Ana tiene `doc1` y `doc2`
  en cola, y `doc1` resuelve después de `stop()` + `start('uid-beto')`. Resultado: `sets:
[{path: "users/uid-beto/test", id: "doc2", value: "dos-de-ana"}]`, y la cola de Ana queda vacía
  **como si se hubiera subido**. Lo encontraron **dos revisiones por separado** (la del diff de
  la 10 y la del de la 11). Con una lápida en cola, es un `deleted:true` de Ana en un doc de Beto.

  **Otros efectos del mismo defecto:**
  - Si el push en vuelo **falla** tras `stop()`, `recordDroppedWrite` (`:589-592`) lo atribuye
    con `this.uid`. El descarte de Ana se pierde sin aviso (`droppedWrites 0` al volver Ana) o
    **aparece en la sesión de Beto, de forma persistente**.
  - Lo que afirma `S10-revision-del-diff.md:128-129` («flush() tampoco corre sin uid, así que no
    hay camino») es falso.

  **Cómo decidirlo (no medido):** depende de qué haga el SDK real con un `set()` en vuelo cuando
  cambia el usuario.
  - Si lo resuelve después del cambio: mezcla entre cuentas, **P0**.
  - Si lo deja pendiente: `flushInFlight` se queda en `true` y Beto no sube nada hasta reiniciar.
    Sus escrituras quedan en cola y en disco.
  - Se mide en Modo C, con emulador y dos cuentas de prueba, cortando la red con un push en
    vuelo. **Nunca con el teléfono de Victor.**

  **Arreglo (sirve para las dos ramas):** volver a comprobar `item.uid === this.uid` después de
  cada `await` y cortar el bucle si no coincide. Y armar la ruta con `item.uid`, no con
  `this.uid`.

  **❌ Corrección de la sesión 20: «sirve para las dos ramas» es FALSO, y está medido.** Aplicado
  solo eso, la rama «no resuelve nunca» sigue roja: ese `await` no vuelve, así que nada de lo
  que va después corre. Y es la rama que toma el SDK de JS 4.17 (leído en su fuente: el callback
  de una escritura se guarda bajo el usuario que la emitió y, al cambiar de usuario, ni se
  resuelve ni se rechaza).

  **✅ ARREGLADO en la sesión 20** (`cfa7c1c`), para las dos ramas de verdad:
  - una sesión de flush: `stop()` la incrementa y suelta el candado;
  - el flush viejo no toca nada de la sesión siguiente, y deja intacta la entrada si su push
    falló;
  - `pushOne` arma la ruta con `item.uid` y se niega a escribir si no es la cuenta activa.

  Cuatro pruebas con un `set()` retenido, vistas fallar, y una matriz de reverts pieza por
  pieza.

  **Medido en el SDK NATIVO (Modo C, con el OK de Victor): se queda en P1.** En el emulador, con
  una instancia secundaria de Firebase y cuentas anónimas, el `set()` de A queda **pendiente**
  tras el cambio de usuario. Pasa tanto si se hizo sin red como si se hizo con red y `signOut`
  en el acto. Y no llega al servidor (404), mientras que la escritura de B sí sube. **La mezcla
  no apareció; la rama real es «no sincroniza hasta reiniciar»,** justo la que la propuesta de
  arreglo de arriba no cubría. Limpieza verificada desde fuera. Detalle:
  `detail/S20-arreglos-p0-sync-favoritos.md`.

- **`R9-105` (S19, prueba de dinero) — 🐛 la línea exacta del bug de `R9-9` no la protege NINGUNA
  prueba.**

  **El mecanismo:**
  - El arreglo cambió el inicializador del módulo a `let lastKnownUnlocked: boolean | null =
null` (`offeringService.ts:127`). Antes era `= false`, y ese era el bug: el primer «inactivo»
    de cada arranque se deduplicaba contra `false`, y la caché `'true'` sobrevivía al reembolso.
  - Pero **toda prueba llama a `__resetForTests()` en su `beforeEach`, y esa función pone `null`
    por su cuenta** (`:106`). Bajo jest el inicializador **nunca se ejecuta**.

  **Medido:**
  - Revertido solo el inicializador a `false`, que es el P0 tal cual: **57/57 suites que tocan
    premium y 405/405 pruebas, en verde**.
  - Una sonda con `jest.isolateModulesAsync` (módulo fresco, sin reset) sí discrimina: `HEAD` da
    `{"cache":"false","seen":[false]}`, y el revert da `{"cache":"true","seen":[]}`.
  - El commit lo vio, pero lo anotó como «nota de método» («hay que revertir los dos sitios») y no
    como hueco de cobertura.

  Es la forma de la sesión 12 (un mock con factoría literal sustituye la superficie), **esta vez
  por la puerta del reset**.

  **Arreglo:** una prueba con módulo fresco y sin reset que fije el camino del reembolso desde el
  arranque.
  **✅ ARREGLADO en la sesión 20** (`8ea93b6`). La prueba usa `jest.isolateModulesAsync`, sin
  reset ni clave de prueba, y lleva un control de que el SDK se configuró. Revertido solo el
  inicializador a `= false`, cae exactamente ella (`Expected: false / Received: true`) y las
  otras 26 del archivo siguen verdes.

- **`R9-106` (S19, `SyncEngine`) — 🐛 `R9-65` (y `R9-46`) solo frenan el cursor dentro de SU
  lote.** Los dos arreglos acotan `maxSeenUpdatedAt` por debajo del doc no aplicado o en conflicto
  **del mismo lote** (`SyncEngine.ts:847-926`). Nada impide que un lote POSTERIOR de la misma
  colección lo empuje por delante.

  **Medido con el motor real:**
  - Llega un conflicto en T. Un lote siguiente trae otro doc en T+10 min (puede ser el eco de una
    edición propia), y el cursor pasa a T+595000.
  - Tras reiniciar, el piso de la consulta queda en T+295000 y **el conflicto no vuelve a llegar**
    (`conflictsTrasReinicio: 0`). El local se queda con «lo mío» y el cambio remoto se pierde:
    **exactamente la pérdida que `R9-65` describe**.
  - Resolver UN conflicto con `keepMine` avanza el cursor a «ahora» (`:1366`), así que se pierde
    otro conflicto pendiente de la misma colección.
  - Control: con el conflicto y el hermano en el MISMO lote, sí se vuelve a detectar.

  **Lo que afirman el commit y la entrada de `R9-65` («se re-lee ese lote hasta que el usuario
  resuelva») es falso.**

  **Arreglo:** persistir el piso por colección como «el menor no asentado» (conflictos y saltados),
  y respetarlo en todos los lotes y en `resolveConflict`, no solo en el lote donde nació.

- **`R9-107` (S19, compuerta de CI) — 🐛 si un job corre node se decide por la FORMA de la línea
  `run:`, y un job con npm sin `setup-node` pasa en silencio.**

  **El mecanismo:** `ciNodeVersion.test.ts:263` usa `/^-?\s*run:\s*(.*)$/`, con el comando en la
  **misma** línea. Si `run:` lleva el valor en la línea SIGUIENTE, el comando queda vacío y el job
  nunca entra en `jobsRunningNode`, así que no se le exige pin.

  **Medido sobre el `ci.yml` REAL**, con un cuarto job `smoke` sin `setup-node:` **23/23 en 14
  formas de YAML válido** (oráculo `yaml` 2.9 y `js-yaml`):
  - el valor en la línea siguiente, también bajo `- name:`;
  - un escalar plano, o entre comillas dobles, de varias líneas, con `npm` desde la 2.ª línea;
  - `"run":` y `'run':`, y `run :`;
  - `- {run: …}` y `steps: [{…}]`;
  - el job entero en flujo, que además cuenta en `scan.jobs` y satisface el piso por archivo;
  - un step alias.

  Control (`smoke: # added in a hurry` con un `run:` normal): **rojo**.

  **Es una forma ordinaria, no exótica:** la plantilla OFICIAL `code-scanning/rust-clippy.yml:45`
  de `actions/starter-workflows` usa exactamente `run:` con el valor plano en la línea siguiente.
  Las otras formas aparecen 0 veces en las 172 plantillas.

  **Ya existía antes** (el escáner de `0da86ce` da lo mismo). La 18 arregló la cabecera del job y
  dejó la otra mitad de la misma correlación, y su «comprobado y BIEN» revisó las formas de **pin**,
  nunca las de **run**. Es otra vez «decidir por la FORMA es decidir por un estilo».

  **Arreglo:** leer el workflow con un parser YAML de verdad (`yaml` ya está en `node_modules`;
  falta confirmar si es dependencia directa) y recorrer `jobs.*.steps[*].run` como datos.

- **`R9-108` (S19, build de packs) — 🐛 el «Done.» no manda subir el manifiesto.**
  `build-web-packs.js:1027-1030` imprime «_Upload the \*.sqlite AND \*-red-letter.json to the Pages
  repo under /packs/_», y el manifiesto se escribe en `web/packs/` del repo, fuera de `out`.

  **Por qué importa:** Pages sirve `web-bootstrap.json`, y `data-loader.web.ts:128` lo pide ahí.
  Su sha256 es **la única señal** de que hay un pack nuevo: `:175-184` se salta la reimportación si
  coincide, y `dataLoaderWebVersionGate.test.ts:141` fija ese comportamiento.
  - **Quien siga la instrucción al pie de la letra deja a todos los navegadores ya arrancados con
    el texto VIEJO, para siempre y en silencio.** Es la consecuencia de `R9-96`/`R9-87`, pero
    causada por el propio mensaje de éxito.
  - La letra roja (`redLetterText.web.ts:161`) no depende del manifiesto, así que esos
    navegadores recibirían **spans nuevos sobre texto viejo**: rojo desalineado, sin error.

  **Es alcanzable:** `60444ab` (2 Reyes 22:9) cambió el sha de RVR1960. En las 4 publicaciones
  reales se evitó solo porque el operador lo sabía por la memoria. La línea nació en `c3a9aac`, y
  `b18eedc` la tocó sin añadir el manifiesto.

  **Arreglo:** nombrar el manifiesto en el «Done.», con su ruta real, y decir que va **al final**,
  después de los packs.

- **`R9-109` (S19, lector web) — 🐛 el lector web no verifica el sha256 de lo que descarga, y un
  pack malo NO se cura.** `importWebPack` (`data-loader.web.ts:59-94`) baja los bytes, los
  deserializa e inserta (`INSERT OR REPLACE`) sin hashearlos. Después guarda como versión **el sha
  que dice el manifiesto** (`:194-199`), no el de los bytes.
  - `sha256Hex` existe y el nativo lo usa (`version-download-service.ts:135`); la web no.
  - `R9-81` ya lo dijo de pasada («usa el sha256 solo como token de caché»), pero nunca se
    registró.

  **Por qué ahora es P1: el mundo.** El `out` por defecto (`Desktop\web-packs`) tenía el
  `rvr1960.sqlite` de julio **con texto de chatbot dentro de 2 Reyes 22:9** («_Claro, aquí tienes
  el texto continuado de 2 Reyes 22:10-20…_», verificado con `grep -a`). Era del **mismo tamaño**
  que el bueno y estaba **junto al manifiesto actual**.
  - Subir la carpeta lo republicaba, y los navegadores nuevos lo importarían guardando la versión
    «buena».
  - **Re-subir después el pack bueno no los cura.**
  - **Se movió a cuarentena en la sesión 19** (`C:\Users\victo\essb-cuarentena\`, con permiso de
    Victor).

  Además, si el manifiesto publicado no trae una versión, esa versión se reimporta **en cada
  arranque**: 4,7 MB cada vez (`:175-193`).

  **Arreglo:** hashear los bytes antes de importar, y rechazar si no coinciden con el manifiesto.
  El fallo es ruidoso y recuperable: el siguiente arranque reintenta.

- **`R9-97` (S18, build de packs) — 🐛 «coherent - one run, whole» sobre un directorio VACÍO.**
  `filesNotPinnedBy` recorre los archivos que HAY en `out` y le pregunta al manifiesto por cada
  uno; nada recorre el manifiesto preguntándole al directorio, así que un archivo que el
  manifiesto pina y el directorio no tiene es **invisible**, y el `[]` de ese bucle se imprime
  como «_Checked, not assumed: every file in it matches the sha256 the manifest pins, so it IS
  coherent - one run, whole_». Es `R9-73` (un bucle sobre la lista NUEVA no ve lo que falta de la
  VIEJA) con la consecuencia de `R9-74` (el vacío imprime éxito), **dentro de la compuerta escrita
  contra eso** (`R9-93`). **Medido con el `main()` real:** con 2 de 4 archivos borrados dice eso;
  con los 4 borrados, lo mismo de un directorio vacío. La mitad peligrosa es la primera: «whole»
  manda a subir medio juego, y un 404 de GitHub Pages se sirve **sin CORS**, así que al lector le
  llega `TypeError: Failed to fetch`. **Repro:** correr `main()`, borrar 2 archivos de `out`,
  forzar el fallo del primer `renameSync`. **✅ ARREGLADO** (`2a442dd`): el bucle va en las dos
  direcciones y nombra lo que falta. Detalle: `detail/S18-revision-del-diff.md`.
  **⚠️ Sesión 19:** en el `out` real la rama «IS coherent» es inalcanzable (`R9-111`), el encabezado afirma una causa que no comprobó (`R9-112`), y una entrada sin `sha256` lo reabre (`R9-120`).

- **`R9-98` (S18, build de packs) — 🐛 la forma LEGACY del manifiesto lanza DENTRO del `catch` y
  borra el mensaje entero.** `filesNotPinnedBy` lee `previous.packs` / `previous.redLetter` en
  crudo, pero `readPreviousManifest` acepta **a propósito** un `redLetter` que sea un OBJETO (la
  forma que `web-bootstrap.json` tuvo hasta el 2026-09-15) y el archivo ya tiene
  `previousRedLetterOf` para normalizarla. Esparcir un objeto plano lanza — y esto corre dentro
  del `catch` del rename, así que reemplaza el mensaje `FIRST FILE` completo por
  `TypeError: (previous.redLetter ?? []) is not iterable`. **Es el defecto que `R9-95` acababa de
  quitarle a `main()` doscientas líneas más arriba, reintroducido por el mismo commit.**
  **Repro:** reescribir el manifiesto en la forma legacy y forzar el fallo del primer
  `renameSync`. **✅ ARREGLADO** (`2a442dd`): las dos listas por sus normalizadores.
  **⚠️ Sesión 19:** el vecino sigue abierto — un error de E/S en el mismo `catch` (`R9-110`); y su prueba legacy no demuestra que el normalizador corrió (`R9-120`).

- **`R9-99` (S18, compuerta de CI) — 🐛 el escáner decidía qué es un job por su FORMA, y tres
  formas de YAML ordinarias no lo eran.** La cabecera de job era `/^([A-Za-z_][\w-]*):\s*$/`
  —acabar en el dos puntos, que es un **estilo**—; no lo cumplen un comentario al final
  (`build: # only lint`), un id entrecomillado ni un ancla (`build: &common`). Y ninguna
  **fallaba**: `job` se quedaba en el job ANTERIOR, así que los steps de debajo se archivaban bajo
  un job que **sí** tiene pin. **Medido sobre el `ci.yml` REAL:** un cuarto job corriendo
  `npm ci && npm test` **sin ningún `setup-node`** pasaba **15/15** con un comentario en su
  cabecera, y se ponía rojo al quitárselo. Es `R9-89` reabierto por su propio arreglo, con la
  misma consecuencia: dos suites que no cargan en CI. **✅ ARREGLADO** (`f477c19`): manda la
  COLUMNA, y una línea en el nivel de job que no se pueda nombrar se REPORTA y limpia `job`.
  **⚠️ Sesión 19:** la otra mitad de la misma correlación —qué step corre node— se decide por la FORMA de `run:` (`R9-107`); y su sonda titular no discrimina la columna (`R9-121`).

- **`R9-87` (S17, prueba de packs) — 🐛 el `beforeEach` de `R9-83` desarmó la ÚNICA aserción que
  fijaba que `main()` ESCRIBE el manifiesto.** El control de corrida limpia lo fijaba con
  `readPreviousManifest(world.manifestFile).packs` → `toHaveLength(2)`, y eso discriminaba **solo
  porque el archivo no existía** y la llamada reventaba. El `beforeEach` nuevo escribe una
  baseline con **exactamente dos packs**, así que el FIXTURE responde la pregunta que la aserción
  hacía. **Medido:** con `fs.writeFileSync(manifestFile, …)` desactivado del todo, **el repo
  ENTERO sale verde — 363 suites / 4263 pruebas**. Río abajo importa:
  `data-loader.web.ts:178` usa `manifestEntry.sha256` como **única** señal de «hay pack nuevo»,
  así que un manifiesto que deja de reescribirse deja a todo lector web ya arrancado en el pack
  viejo **para siempre y en silencio** — clase `R9-13` por el lado del transporte. Es la forma de
  la sesión 10 (un arreglo desarma la prueba de otro) **por la puerta del fixture**.
  **Arreglado:** se comprueba contra el MUNDO (`manifestAgainstDisk`: cada entrada tiene que
  nombrar un archivo real en `out`, con sus `bytes` y su `sha256`), con piso, y también en el
  control de `--allow-shrink` sin base, que es el único sitio donde el manifiesto está
  garantizadamente ausente de antemano. Detalle: `detail/S17-revision-del-diff.md`.

- **`R9-88` (S17, CI) — 🐛 `engines.node: ">=22"` es FALSO, y la compuerta PROHIBÍA corregirlo.**
  `node:sqlite` llegó en 22.5 detrás de `--experimental-sqlite` y se **desbanderó en 22.13.0**
  (nodejs/node#55890). **Medido con binarios reales:** 22.5.1…22.12.0 lanzan
  `ERR_UNKNOWN_BUILTIN_MODULE`; 22.13.0 en adelante van; y 22.12.0 **con** la bandera va, o sea
  que es la bandera y no la ausencia. De 22.0.0 a 22.12.x el módulo existe pero **no se puede
  usar**, y ahí la suite del área da **56 fallos** — sin ni siquiera el aviso `EBADENGINE`,
  porque `>=22` se cumple. En CI, `parseInt` compara majors, así que `'22.12.0'` pasaba. **Y la
  compuerta bloqueaba su propia corrección:** `toBe('>=22')` es igualdad de CADENA, no «¿alcanza
  el piso?», así que `">=22.13.0"` y `">=24"` FALLABAN. **Arreglado:** `MINIMUM_NODE = '22.13.0'`,
  comparación de versiones enteras, y la prueba exige que el piso declarado **alcance**. Un major
  pelado igual al del piso se rechaza a propósito. Detalle: `detail/S17-revision-del-diff.md`.

- **`R9-89` (S17, CI) — 🐛 la compuerta del pin de Node veía UNA forma de escribirlo, y su piso
  exigía tres.** El regex era `/node-version:\s*'([^']+)'/g`: solo comillas **simples**, y
  `parseInt` da `NaN` para todo lo no numérico (`NaN < 22` es `false` → **pasa**). **Medido, cada
  caso con el `diff` del revert a la vista:** `'lts/iron'` (Node 20) pasaba; `'${{ matrix.node }}'`
  sobre una matriz `[20]` pasaba; `'22.12.0'` pasaba; y —el que manda— los tres jobs buenos más
  un **CUARTO** corriendo `npm test` en `node-version: 20` sin comillas **también**, porque el
  piso era `pinned.length >= 3` y había tres. **Un piso igual al número de hoy exige ESE NÚMERO,
  no cobertura**: solo salva el caso «todos invisibles». Además `readWorkflow()` leía un nombre de
  archivo fijo, así que un `deploy.yml` con Node 20 corriendo `build-web-packs.js` pasaba.
  **Arreglado:** escáner de la ESTRUCTURA del workflow (`scanWorkflowSource(name, source)`, con
  probes que llaman a esa misma función — la lección de `R9-86` aplicada al nacer), sobre todo
  `.github/workflows/`, **correlacionando** cada job que corre node/npm con su pin, comparando
  versiones enteras, y **reportando** toda forma que no sabe leer (disciplina de `R9-67`).
  Detalle: `detail/S17-revision-del-diff.md`.

- **`R9-82` (S16, CI) — 🐛 la compuerta de los packs NUNCA corrió en CI, y `main` llevaba un día
  en ROJO.** `scripts/build-web-packs.js` requiere `node:sqlite`, que no existe antes de Node 22;
  daba igual mientras el script solo se corriera a mano (Victor tiene 24.11.1), pero **la sesión
  13 le puso una suite de jest delante** (`1d96a40`, el arreglo de `R9-66`) y `ci.yml` fijaba
  `node-version: '20'` en los tres jobs, sin `engines` que lo contradijera. Desde ese día
  `buildWebPacks.test.js` no CARGA en CI: `● Test suite failed to run — No such built-in module:
node:sqlite`. Verde en local, rojo en CI en **cuatro pushes seguidos a `main`**
  (`3982ea0`, `ff99435`, `e5c8ce4`, `0aa92a7`), y lo único que lo decía era un correo de GitHub.
  **La rama de la sesión 15 lo empeoraba:** `redLetterPackParity.test.ts` importa el mismo script
  en el cuerpo del módulo, así que moría igual → **55 pruebas que no se ejecutaban jamás**.
  **Medido con binarios de verdad:** Node 20.20.2 → 2 suites no cargan, 4195 de 4250; 22.23.2 →
  verde; 24.11.1 → verde. **Repro:** `<node20> ./node_modules/jest/bin/jest.js`.
  **Arreglado:** CI a Node 24, `engines.node: ">=22"`, `require('node:sqlite')` perezoso, y
  `__tests__/ciNodeVersion.test.ts` como detector (lee el workflow y el `engines`, con piso y con
  control en la dirección contraria). Detalle: `detail/S16-revision-del-diff.md`.

- **`R9-83` (S16, build de packs) — 🐛 una base AUSENTE no pedía ninguna palanca.** `R9-77` para la
  corrida cuando el manifiesto no fija ni una de las entradas que emite; **una base que no existe
  fija estrictamente menos** y salía gratis por el `return` temprano de `!previous`. **Probado de
  punta a punta contra el `main()` real**, sin manifiesto y con RVR1960 fuera de `redLetterSpecs`
  (`R9-13` palabra por palabra): emite sin el pack de RVR1960, dice solo «_shrink check SKIPPED:
  no published manifest to compare against (first run for this output)_» y **reescribe el
  manifiesto sin RVR1960**, destruyendo la única base de la corrida siguiente. El mensaje además
  mentía: `manifestFile` es el `web/packs/web-bootstrap.json` **versionado**, así que «first run
  for this output» nunca describió nada — su ausencia es un archivo borrado o movido, y el error
  de lectura de `readPreviousManifest` **ofrece justamente moverlo** como escape, lo que apagaba
  `R9-66`, `R9-73` y `R9-77` de una sola vez. **Arreglado:** señal de alto con `--allow-shrink`
  como salida, mensaje que nombra el manifiesto que no encontró, y el mundo de pruebas de `main()`
  pasa a tener baseline (antes su control de «corrida limpia» era un control del vacío). Detalle:
  `detail/S16-revision-del-diff.md`.

- **`R9-77` (S15, build de packs) — 🐛 una base que no fija NADA se reportaba como éxito.**
  `readPreviousManifest` exige un array `packs` con un argumento explícito —sin él «_every
  count comparison below would have nothing to compare against and pass vacuously_»— y **ese
  mismo razonamiento no se aplicó a `redLetter`**. Con la lista previa de letra roja vacía, los
  dos bucles que la recorren (el de conteos y el de desaparición de `R9-73`) no ejecutan ni una
  aserción, y `assertNoShrink` imprime un mensaje de éxito. **Alcanzable, y no por poco: el
  manifiesto del repo llevó exactamente esa forma** (`packs` sí, `redLetter` no) desde
  `c3a9aac` (2026-07-08) hasta `a0782a6`, así que un `git checkout` de una revisión vieja, un
  revert o un merge que se quede con el lado viejo aterrizan ahí — y `redLetter: []`, que es lo
  que este mismo script escribe si la lista de specs se vacía una vez, es igual de vacío
  pasando todas las comprobaciones de forma. **Probado de punta a punta contra el `main()`
  real**, con esa base y RVR1960 fuera de `RED_LETTER_SPECS` (o sea `R9-13` palabra por
  palabra): la corrida **EMITE**, imprime «_nothing went down and nothing went missing_», y
  **reescribe el manifiesto sin RVR1960**, destruyendo la única base que tenía la corrida
  siguiente — que es justo la cascada que el comentario de `R9-73` describe como su razón de
  existir. Y el mensaje de éxito nombraba el tamaño de las listas NUEVAS como si fuera el
  número de comparaciones: **las dos cifras coinciden en toda corrida buena, por eso nadie las
  miró en la mala**. **✅ ARREGLADO en la sesión 15:** `baselineComparisonCounts` cuenta lo que
  la base FIJA; si la corrida emite entradas de una categoría y la base no fija ni una, se
  para. Señal de alto, no muro — `--allow-shrink` sigue siendo la salida, porque la PRIMERA
  corrida que emite una categoría entera legítimamente no tiene nada que la fije (`a0782a6` fue
  esa corrida). El mensaje dice cuántas comparaciones **hizo**. Y `readPreviousManifest`
  rechaza un `redLetter` que no sea ni array ni objeto pero **no** su ausencia, porque ausente
  es indistinguible de «nunca se publicó nada»: el piso vive donde la corrida sabe qué va a
  emitir. Vistas fallar primero con **tres reverts por separado** (8, 10 y 1 rojas), 6
  controles verdes en los tres. Detalle: `detail/S15-revision-del-diff.md`.

- **`R9-78` (S15, letra roja web) — 🐛 las tres listas que DEBEN coincidir solo estaban atadas
  por comentarios.** La disponibilidad de letra roja se declara en tres sitios y tres mundos:
  `redLetterByVersion` (`redLetterText.ts`, nativo), `RED_LETTER_PACKS`
  (`redLetterText.web.ts`, web, y los NOMBRES de archivo) y `RED_LETTER_SPECS`
  (`scripts/build-web-packs.js`, lo único que los CONSTRUYE). Los tres llevaban un comentario
  pidiéndole al siguiente que se acuerde y **nada detectaba el día que uno no se acordara** —
  `R9-13` **es** ese día: RVR1960 estaba en el mapa nativo y ausente de los otros dos, así que
  el lector web contestaba «sí, esta versión tiene palabras de Cristo», habilitaba el
  interruptor y no pintaba ni una, en silencio, en español, un mes. **La compuerta de `R9-73`
  no puede ver este caso**: una versión que nunca tuvo pack no tiene entrada en la base de la
  que faltar — o sea que **su propio comentario cita `R9-13` por su nombre mientras construye
  una compuerta que no lo vería**. Es el corolario de la sesión 13 en su forma más cara: un
  comentario que pide sincronía es una nota, no una compuerta. **✅ ARREGLADO en la sesión
  15:** las tres listas se comparan por valor —ids en las tres direcciones y nombres de archivo
  entre las dos que los llevan— en `__tests__/redLetterPackParity.test.ts`. Los dos hermanos
  exponen `redLetterVersionIds()` a propósito, así la compuerta de paridad exige que el web lo
  siga teniendo (nativo ⊆ web). Con piso (las tres listas no vacías, por si un `require`
  resolviera a otra cosa y dejara toda comparación en `[]` vs `[]`) y con control (que reaccione
  en LAS DOS direcciones, no solo a una lista más corta). Vista fallar primero en las tres
  direcciones del drift; **el estado real de `R9-13` sale rojo en la comparación de ids**.
  Detalle: `detail/S15-revision-del-diff.md`.

- **`R9-72` (S14, build de packs) — 🐛 el mensaje de abort de `R9-66` MENTÍA: los dos
  `.sqlite` ya estaban escritos.** Encontrado al revisar el diff de la sesión 13. El
  reordenamiento que esa sesión hizo para «abortar antes de emitir nada» solo aplazó los JSON
  de letra roja (`pendingWrites`); `buildPack()` seguía escribiendo `rvr1960.sqlite` y
  `web.sqlite` **directo al directorio de salida**, dentro del primer bucle, antes de
  `assertNoShrink`. Así que el error decía literalmente «_no pack file was emitted, so nothing
  here is publishable yet_» con dos packs de 4,7 MB recién escritos ahí dentro, y la entrada
  de `R9-66` afirmaba «antes de escribir nada publicable». **Probado de punta a punta antes
  del arreglo:** truncando la fuente WEB en 492 versículos de Salmos —que satisface **todos**
  los pisos de `verifyPack`, porque fijan la base contra la MISMA fuente encogida, y no toca
  ningún span de letra roja, así que la alineación no se entera— la corrida aborta con «WEB:
  31098 verses -> 30606 (492 fewer)» y deja un `web.sqlite` de 4 796 416 bytes con **30 606
  versículos** en el directorio, indistinguible de uno bueno salvo por el sha256. Y publicar
  es una **subida MANUAL** de lo que haya ahí, en un directorio del que ya se sabe que guarda
  `.sqlite` viejos: un mensaje que **AFIRMA** que está intacto es peor que ninguno. Peor aún,
  `__tests__/buildWebPacks.test.js` **fijaba esa frase falsa** (`says NOTHING was written, so
the message is actionable`). **✅ ARREGLADO en la sesión 14:** todo se construye en un
  directorio de escenario **dentro** de `out` (mismo volumen, porque un `rename` entre
  volúmenes falla con `EXDEV` en Windows) y se mueve con `renameSync` **solo** después de
  pasar la compuerta, con `finally` que lo limpia en todos los caminos, abort incluido. El
  mensaje además avisa de que lo que ya estaba ahí es de una corrida ANTERIOR y que hay que
  comprobarle el sha256. Vista fallar primero, y **corrido de punta a punta contra los datos
  de verdad: los cuatro sha256 salen IDÉNTICOS a los del manifiesto publicado**,
  `web/packs/web-bootstrap.json` no cambia ni un byte, y no queda scratch.
  Detalle: `detail/S14-revision-del-diff.md`.

- **`R9-73` (S14, build de packs) — 🐛 la compuerta de encogimiento no veía una versión que
  DESAPARECE, que es el encogimiento máximo y el que ya pasó.** Los dos bucles de conteo de
  `shrinkComplaints` recorren las listas **NUEVAS**, así que quitar RVR1960 de
  `RED_LETTER_SPECS` daba **cero quejas**. Sondeado: pack de letra roja que desaparece → `[]`;
  el `.sqlite` que desaparece → `[]`; **todo** desaparece → `[]`; y `assertNoShrink` **no
  lanza**, la corrida pasa, y el manifiesto se reescribe **sin** esa versión, borrando la
  única base que tenía la corrida siguiente para notarlo. Es **la misma forma que `R9-66`, un
  nivel afuera**: un cuerpo de bucle que no corre para lo que falta, y la pregunta «¿qué
  entrada hace que esto no ejecute ninguna aserción?» tiene respuesta trivial: una lista
  nueva más corta. Y no es hipotético — las dos listas son **a mano** (el tercer punto ciego
  del repo) y la última vez que a `RED_LETTER_SPECS` le faltaba RVR1960, la letra roja estuvo
  **muerta en español en la web un mes**: eso ES `R9-13`. La compuerta que existe justamente
  para parar «un conteo que baja» no habría parado la bajada de 2057 a **ninguno**.
  **✅ ARREGLADO en la sesión 14:** la ausencia se lee de las listas **PREVIAS**, que es el
  único sitio donde sigue visible, con `--allow-shrink` como la misma vía de escape (retirar
  una versión es una decisión editorial legítima). Vista fallar primero, con el control de que
  **AÑADIR** una versión sigue sin quejarse. Detalle: `detail/S14-revision-del-diff.md`.

- **`R9-66` (S13, build de packs) — 🐛 la verificación de spans de letra roja pasaba EN
  VACÍO, y es lo único del programa que toca DATOS YA PUBLICADOS.** Encontrado al revisar el
  diff de la sesión 12. Todo el cuerpo de `verifyRedLetterAlignment`
  (`scripts/build-web-packs.js`) es un bucle por entrada, y un bucle sobre nada no recoge
  ningún fallo: con `entries` vacío imprimía «0 entries, 0 spans, ALL slices non-blank and
  in-range» y daba verde. El script escribía entonces un pack de **2 bytes** (`[]`), le sacaba
  un sha256 y anotaba `entries: 0, spans: 0` en `web-bootstrap.json`. Publicado, eso es la
  letra roja muerta en silencio para esa versión en la web — **el síntoma exacto de `R9-13`,
  con la bendición del build**. No es hipotético: los dos archivos fuente son
  **auto-generados** (`bible-data-rvr1960-redletter.ts` desde `decisions/*.json`), así que una
  regeneración vacía es la forma ordinaria de llegar. El contraste que lo delata: la mitad del
  `.sqlite` **sí** tenía piso desde siempre (`n === expectCount`, `books === 66`, rango
  `1..66`, cero versículos en blanco). **Comprobado también lo que está BIEN:** si falta el
  `.sqlite` de esa versión, el `readOnly: true` revienta con `unable to open database file`.
  **✅ ARREGLADO en la sesión 13:** dos pisos, uno antes de abrir la base y otro después del
  bucle (`spanCount === 0`), y el script pasa a ser requerible para que la prueba ejercite las
  funciones REALES. Vistas fallar primero las 2 de vacío, con **4 controles** que pasan en
  ambos lados para que el piso no se confunda con toda la verificación. Y corrido de punta a
  punta contra los datos de verdad: los cuatro sha256 salen **idénticos** a los del manifiesto
  ya publicado y el manifiesto no cambia ni un byte.
  **✅ Y la SEGUNDA MITAD también cerrada, en la misma sesión 13** (Victor lo pidió): los
  pisos de cero no cazan una caída de 2057 entradas a 3, que es el mismo accidente con un
  número menos conveniente. El manifiesto commiteado ya dice qué hay publicado, así que
  ahora un conteo que **BAJA** aborta la corrida — cubriendo las tres cifras (`verseCount`
  de cada `.sqlite`, y `entries`/`spans` de cada pack de letra roja), **antes de escribir
  nada publicable**, y con `--allow-shrink` como vía de escape para una supresión editorial
  deliberada. Sabe leer el manifiesto en su forma VIEJA (`redLetter` era un objeto antes del
  2026-09-15), porque un comprobador que solo entendiera la nueva compararía contra nada y
  pasaría en vacío — el bug mismo. Probado de punta a punta: inflando el manifiesto a 9999
  entradas revienta con «9999 entries -> 2057 (7942 fewer)» y **no reescribe el manifiesto**.
  Detalle: `detail/S13-revision-del-diff.md`.

- **`R9-67` (S13, tests) — 🐛 la compuerta de paridad web/nativo se ponía verde ante la forma
  `export {x}`.** `webNativeModuleParity.test.ts` —la compuerta que la sesión 12 creó
  justamente para rematar la clase de `R9-13`— escaneaba **texto** con un regex que solo
  entendía `export [async] function|const|let|class|enum`. Ante la forma de lista devolvía un
  conjunto **vacío**, y comparar contra vacío siempre pasa. **Reproducido contra la compuerta
  misma:** declarando `hasRedLetterData` en `redLetterText.ts` con un `export {…}` al final
  mientras `redLetterText.web.ts` no lo exportaba —`R9-13` al pie de la letra— la suite quedaba
  en verde **30/30**. El encabezado prometía «verificado que ningún par usa `export {x} from`
  ni `export *`; si alguno empieza, enséñale la forma al escáner», pero **nada DETECTABA el día
  en que alguno empezara**, y ni siquiera mencionaba la forma local `export {x}`, que es la más
  común de las tres. **✅ ARREGLADO en la sesión 13:** parsea con `ts.createSourceFile`, que no
  type-checkea, no resuelve módulos y no ejecuta una línea — conserva entera la razón de no
  hacer `require` (la mitad de esos archivos arrastran dependencias nativas) y elimina el punto
  ciego, más tres formas que el regex tampoco veía (`export const a = 1, b = 2`, destructuring,
  `export {X as default}`). Queda **una sola** forma irresoluble sin seguir el re-export,
  `export * from`, y ahora tiene su propio caso por archivo que falla ruidosamente. Vistas
  fallar primero las dos mitades. Detalle: `detail/S13-revision-del-diff.md`.

- **`R9-65` (S9, sync) — 🐛 el cursor del lote también salta por encima de un doc en
  CONFLICTO sin resolver, y el conflicto no sobrevive a un reinicio.** Encontrado al revisar
  el diff de la sesión 8, pero **preexistente en `main`** — no lo introdujo ese diff. Es el
  mismo fallo estructural que se arregló para `R9-46` (`3e780c6`), por la otra rama: un doc
  en conflicto se omite de `maxSeenUpdatedAt`, pero un hermano **más nuevo del mismo lote**
  igual mueve el piso de la consulta por delante de él. El comentario del código se apoya en
  que "`resolveConflict()` avanza el cursor él mismo una vez el doc está asentado" — cierto
  solo si el usuario lo resuelve **en esa misma sesión**: `stop()` limpia `this.conflicts`
  ("son transitorios"), así que si la app se reinicia antes, el conflicto se pierde **y** el
  cursor ya pasó de largo. El cambio remoto se cae en silencio. **Arreglo: una línea**,
  extender la cota de `lowestUnappliedUpdatedAt` a los docs aún en conflicto.
  **✅ ARREGLADO en la sesión 11** (`261c053`): exactamente esa línea, con la rama de
  conflicto reordenada para que se lea como lo que es (o frena el cursor, o lo empuja, nunca
  las dos). **Coste conocido y aceptado, el mismo que asumió `R9-46`:** se re-lee ese lote
  hasta que el usuario resuelva el conflicto. Lo cierra `resolveConflict` avanzando el cursor,
  y `recordConflict` **deduplica por id de doc**, así que las re-entregas refrescan el
  snapshot en vez de acumularse. Verificado a mano antes de aceptar el coste.
  **⚠️ Sesión 19:** «se re-lee ese lote hasta que el usuario resuelva» es falso: un lote posterior o un `keepMine` avanzan el cursor — ver `R9-106`.

- **`R9-15` (A6, tests) — 🐛 el único test que renderiza el lector web enmascara
  exactamente `R9-13`.** `__tests__/chapterReaderWebFontPicker.test.tsx:41` mockea el
  especificador **`.web` explícito**, pero el componente importa el **pelado**; con preset
  nativo ese import carga el archivo nativo (que sí exporta el símbolo) y el mock nunca se
  aplica. Por eso `d753a6e` se mergeó con CI verde. **Arreglo:** redirigir el especificador
  pelado, como ya hace `webStubProviders.test.tsx:516-532`.
  **✅ ARREGLADO en la sesión 12**, y arreglado **antes** que `R9-13` a propósito, para ver
  el crash de producción aparecer en la compuerta: con la redirección puesta y el módulo web
  sin tocar, las 4 pruebas se pusieron rojas con el `TypeError` exacto, `(0,
_redLetterText.hasRedLetterData) is not a function` en `ReaderPreferencesSheet.tsx:121`.
  **Detalle que casi arma una prueba en vacío:** el mock del especificador `.web` era un
  objeto escrito a mano, así que era ÉL quien definía la superficie del módulo. Redirigir el
  pelado a ESE mock habría seguido fallando después del arreglo, y el reflejo —añadirle
  `hasRedLetterData: jest.fn()`— habría dejado la prueba verde sin mirar nunca el archivo
  real. Ahora el mock hace `...jest.requireActual` y solo stubea las tres funciones de datos.
  **Y se remató la clase entera**, que es lo que pedía el detalle:
  `webNativeModuleParity.test.ts` compara los **14 pares** `.web`/nativo y exige
  **`nativo ⊆ web`** para los exports que existen en runtime. La invariante es de una sola
  dirección a propósito: un símbolo que está en el nativo y no en el web es un crash (el
  especificador pelado se convierte en el archivo web al bundlear), mientras que un extra
  web-only (`loadRedLetterSpans`, `clearWebStorageForLockRecovery`) solo se alcanza por el
  especificador `.web` explícito, que el código nativo nunca escribe. Es un escaneo de
  **texto**, no un `require`: la mitad de esos archivos son pantallas cuyo grafo de imports
  arrastra dependencias nativas, y un chequeo por `require` necesitaría un muro de mocks por
  par. Con `R9-13` revertido nombra el par y el símbolo. Lista blanca de **una** entrada,
  documentada (`heroNudgeRoute`), con su propia prueba anti-pudrición.

- **`R9-16` (A2, dinero) — 🐛 `restore()` confunde "no tienes compra" con "falló la red".**
  `offeringService.ts:325-331` devuelve `{unlocked:false}` en el `catch`, el mismo valor que
  un restore correcto sin compras, y `OfferingSheet.tsx:147-158` lo mapea a «No encontramos
  una ofrenda anterior en esta cuenta.». A quien **ya pagó** y restaura con mala señal se le
  afirma que su compra no existe. Dos tests **congelan la confusión** como esperada.

- **`R9-17` (A2, dinero) — 🐛 `purchaseUnlock` declara `success` sin comprobar que el
  entitlement quedó activo: cobrado, agradecido y bloqueado.** `offeringService.ts:292-298`
  no evalúa `isEntitlementActive(customerInfo)` — aunque `restore()` (`:324`) sí lo hace
  sobre el mismo dato. Si el `CustomerInfo` no trae aún `extras` (mapping mal configurado en
  el dashboard, propagación lenta), Play cobra, la hoja dice «Gracias por sembrar en esta
  obra» y **todo sigue bloqueado**, sin ruta de auto-reparación.

- **`R9-18` (A2, dinero) — 🐛 no se contempla el pago PENDIENTE: a quien paga en efectivo
  (OXXO/SPEI) se le dice que la ofrenda falló.** `offeringService.ts:261-282` solo mapea 2
  códigos; el resto cae al error genérico. En el mercado principal de la app el pago en
  ventanilla termina en transacción **pendiente**: hoy se le muestra «No se pudo completar
  la ofrenda. Inténtalo de nuevo.» y se le pide repetir un pago que sí está en curso.
  Igual en `DonationSheet:93-96`.

- **`R9-19` (A2, dinero) — 🐛 `DonationSheet` nunca maneja `alreadyOwned`.** Verificado:
  `grep` de `alreadyOwned` sobre `src/`+`app/` da **un solo** consumidor
  (`OfferingSheet.tsx:125`). El arreglo `327fc26` se hizo solo en la ofrenda. Si el recibo de
  una donación no se liquida, cada reintento de **ese importe** cae al `else` con «No se
  pudo completar la donación», **para siempre**, y esta hoja **no tiene enlace de
  restaurar**: el tier queda muerto tras haber cobrado una vez.

- **`R9-24` (A3, copy) — 🐛 el diálogo de "Eliminar cuenta" manda al usuario a un botón que
  NO borra sus datos.** `translations.ts:3888-3889` (es) / `:10416-10417` (en) dicen que use
  "Resetear Datos de la Biblia"; **verificado** que `data-loader.ts:144-166` solo hace
  `DELETE FROM verses` + `verses_fts` + flags de packs, y su propia copy (`:4141-4142`) dice
  que favoritos/notas/resaltados **no se ven afectados**. No existe en la app ninguna acción
  que borre el contenido local. Quien vende su teléfono y sigue la instrucción deja sus notas
  privadas intactas para el siguiente dueño — y sirven de munición a `R9-23`.

- **`R9-25` (A3, cuota) — 🐛 `deleteAllCloudData` lee y borra sin límite ni lotes.**
  `deleteAccountData.ts:52-76`: `.get()` **sin `limit()`** por cada una de 8 colecciones +
  `Promise.allSettled` de todos los deletes a la vez, con puerta todo-o-nada (`:78-82`).
  Contraste interno: `SyncEngine.cleanupOldReviewEvents` (`:864-921`) sí pagina a 200 y borra
  secuencialmente. Una cuenta con ~7 000 `reviewEvents` gasta ~14 % de las lecturas y ~35 %
  de las escrituras **diarias de todo el proyecto**, y si falla a mitad muestra "No se pudo
  eliminar tu cuenta" con parte ya borrada.

- **`R9-29` (A7, cuota) — 🐛 el import empuja una escritura Firestore por entidad y revive
  la ruta `reviewEvents` que se eliminó por cuota.** `BackupService.ts:962-1028`. El
  comentario de `:1020-1027` afirma seguir _"the same 12-month window every other write path
  honors (MemoryDeckContext.reviewCard)"_ — **esa afirmación ya es falsa**: `reviewCard` no
  sube nada desde el cambio local-first, así que el import es hoy el **único escritor** de
  esa colección. ~7 300 escrituras en ráfaga ≈ 37 % de la cuota diaria compartida; y
  `persistQueue()` por entrada lo hace O(N²) en el hilo JS.

- **`R9-30` (A7, respaldo) — 🐛 el respaldo omite contenido escrito por el usuario que no
  tiene copia en la nube, incluidas 2 partes de la propia Mesa.** `BackupService.ts:104-116`
  solo cubre `@prep_notes` y `@prep_series`. Faltan **`@prep_illustrations`**,
  **`@prep_self_review`**, **`@sermon_notes`**, `@custom_plans` (el respaldo trae el
  _progreso_ del plan pero no su definición), oración, testimonio, devocionales, diario de
  emociones, `saved_comparisons`, insignias/títulos, y los favoritos/progreso de
  facts/journeys/profecías/kids/quiz. Solo 6 colecciones existen en Firestore, así que todo
  eso **no tiene ninguna ruta de recuperación**, contra lo que promete la UI
  (`translations.ts:4176`).

- **`R9-37` (A4, `SyncEngine`) — 🐛 `attachListener` es check-then-act sobre un `await`:
  dos listeners en la misma colección y uno queda huérfano.** Severidad **media**.
  `src/lib/sync/SyncEngine.ts:553-556` (la guarda) vs. `:603-627` (el `set`). Entre el
  `if (this.unsubs.has(...)) return` y el `this.unsubs.set(...)` hay un `await
loadCursor()` (lectura de AsyncStorage). Dos invocaciones concurrentes para la misma
  colección pasan las dos la guarda, las dos llaman a `onSnapshot`, y la segunda pisa el
  unsub de la primera: el primer listener queda vivo y sin referencia, fuera del alcance de
  `stop()` y de `unregister()`. La guarda `uidAtAttach` (`:582`) no protege aquí — el uid
  es el mismo. **Camino realista:** `src/context/SyncEngineContext.tsx:112-125` documenta
  (y dice haber confirmado en vivo el 2026-07-09) que `user` atraviesa transitoriamente
  `null`/anónimo durante la rehidratación de Firebase Auth en arranque en frío para una
  cuenta que sigue con sesión; ese parpadeo produce `stop()` + `start(mismo uid)`.
  **Consecuencia:** cada cambio remoto se procesa dos veces y **se factura dos veces la
  lectura de Firestore**, anulando parte del ahorro que justifica todo el trabajo de
  cursores. No hay riesgo de fuga entre cuentas: las reglas (`request.auth.uid == uid`,
  verificadas en `B4`) rechazan al huérfano en cuanto cambia el usuario. **Repro (sonda),
  parcial:** con `loadCursor` colgado y dos `register()` seguidos, `onSnapshot` se llama
  **2 veces** y `unsubs` retiene una sola. La mitad "el huérfano sigue entregando tras
  `stop()`" es **inferencia sobre el SDK real, no medición** (el arnés comparte un único
  `snapshotCb`). Detalle: `detail/A4-syncengine.md`.

- **`R9-40` (campo, catálogo de versiones) — 🐛 ningún `fetch` de la app tiene timeout:
  «Buscando versiones disponibles…» se cuelga para siempre.** Severidad **media**.
  `src/lib/database/version-download-service.ts:34`. `fetchVersionCatalog` hace
  `await fetch(CATALOG_URL + '?t=' + Date.now())` **sin `AbortController` ni señal de
  timeout**; el `fetch` de React Native no tiene timeout por defecto, así que en una red
  que acepta la conexión y no responde (portal cautivo, wifi degradado) la promesa **nunca
  se asienta**. `ManageVersionsSection.tsx:59-68` deja `loading = true` en ese caso y el
  `finally` no llega nunca: el spinner queda indefinido, sin rama de error y **sin botón
  de reintentar** (el «Reintentar» solo aparece por `loadError`, que requiere que el
  `fetch` haya rechazado). **Reportado en vivo por Victor (2026-09-07, OnePlus 11)** con
  las dos manifestaciones: spinner colgado y, en otro momento, el error de catálogo con
  «Reintentar»; al día siguiente funcionaba — el patrón intermitente que predice la falta
  de timeout. **Alcance mayor que esta pantalla:** `grep` de `AbortController|
AbortSignal.timeout` sobre `src/` da **cero resultados** en los **6** call sites de
  `fetch` de la app — incluido `src/lib/offering/giftCodeService.ts:158`, que es la ruta de
  **dinero** (canje de código regalo): un cuelgue ahí deja el canje girando sin salida.
  **Arreglo (no aplicado):** `AbortSignal.timeout(~10s)` en los 6 call sites, y en el
  catálogo tratar el abort como `loadError` para que aparezca «Reintentar». Detalle:
  `detail/CAMPO-victor-2026-09-07.md`.

- **`R9-41` (campo, lector) — 🐛 con el tema de lectura «Crepúsculo» la barra de acciones
  del versículo queda texto casi blanco sobre panel casi blanco.** Severidad **media-alta**
  (inutiliza 8 acciones en un tema **premium**). `app/(tabs)/verse/[book]/[chapter].tsx:719-722`
  y `:3076-3080`. El fondo de la barra flotante se elige con `readerIsDark`, que **enumera
  a mano** los temas oscuros:
  `readerPrefs.theme === 'night' || readerPrefs.theme === 'high-contrast'`.
  `crepusculo` —añadido después, en T6.3, como exclusivo de ofrenda— **es un tema
  true-dark** (`readerThemes.ts`: `background '#0D1220'`, `text '#DCE3F0'`) y **no está en
  esa lista**, así que `readerIsDark` da `false`, el fondo cae a
  `staticColors.glassWhite98` (`rgba(255,255,255,0.98)`) y encima se dibuja
  `effectiveColors.text = '#DCE3F0'` → contraste ≈ **1.2:1**. Las etiquetas
  («Escuchar», «Copiar», «Compartir», «Nota», «Favoritos», «Resaltar», «Comparar»,
  «Imagen») quedan ilegibles. **Reportado en vivo por Victor (2026-09-07)** con captura.
  El comentario del propio código dice que `readerIsDark` existe _"so its
  `effectiveColors.text` stays legible when the reading theme differs from the app theme"_
  — la intención es correcta, el que falló es el mantenimiento de la lista al añadir un
  tema. **`readerIsDark` no tiene ningún test** (verificado a mano) y es su **único**
  consumidor. **Arreglo (no aplicado):** derivar la oscuridad de la paleta en vez de
  enumerarla — un campo `isDark` en `ReaderThemeColors`, o calcular la luminancia de
  `background` en `readerThemes.ts`, de modo que añadir un tema nuevo no pueda volver a
  olvidarse. Detalle: `detail/CAMPO-victor-2026-09-07.md`.

- **`R9-50` (A8, subrayados) — 🐛 borrar la nota o la categoría de un subrayado es un no-op
  completo, y la UI dice «Guardado».** Severidad **alta**. `updateHighlight`
  (`HighlightService.ts:119-135`) solo incluye un campo en el `SET` si es `!== undefined`,
  pero `saveEditor` traduce "campo vacío" a **`undefined`** (`highlights.tsx:190-193` y
  `:602`). Mienten tres capas: SQLite conserva el valor viejo; el `queueWrite` va sin el campo
  y `pushOne` usa `{merge:true}`, así que **Firestore también lo conserva** (bajo merge un
  campo opcional es **imposible de desasignar**); y `toast.success` (`:209`) lo da por
  guardado. Al volver a la pantalla, `useFocusEffect` relee y **la nota reaparece intacta**.
  **No existe ninguna forma de quitar una nota de resaltado en toda la app.** **Repro
  (sonda):** `{note: undefined, category: undefined}` →
  `UPDATE highlights SET updated_at = ? WHERE verse_id = ?`, sin tocar ningún dato. Detalle:
  `detail/A8-notas-subrayados.md`.
  **✅ ARREGLADO en la sesión 7** (`7f8e666`): `updateHighlight` pasa a ser tri-estado (`undefined` = no tocar, `null` = borrar) y devuelve la entidad escrita; el editor manda `null`. Y la raíz de las tres: `withoutUndefined` → **`nullifyUndefined`**, que manda `null` explícito en vez de quitar la clave, porque bajo `{merge:true}` una clave ausente significa «conserva lo del servidor». Se conserva `{merge:true}` a propósito (protege un campo escrito por una versión más nueva en otro dispositivo), y `valuesEqual` ya equiparaba `null` y `undefined`, así que no aparecen conflictos fantasma.
- **`R9-51` (A8, notas) — 🐛 dos dispositivos pueden crear DOS notas para el mismo versículo,
  y el lector solo alcanza una.** Severidad **media**. La tabla `notes`
  (`database/index.ts:521-532`) tiene **solo `id TEXT PRIMARY KEY`**, sin restricción sobre
  `(book_name, chapter, verse)`, y los ids se generan con `note_${Date.now()}_${random}`
  (`:2085`). El adaptador usa el **id de la nota** como clave de sync — **la decisión contraria
  a la del adaptador de subrayados**, que eligió `verseId` a propósito _"porque el id generado
  por el servicio lleva un timestamp y cambia entre dispositivos"_
  (`adapters/highlights.ts:19-25`). Tras sincronizar hay dos filas y el motor nunca las ve como
  conflicto; `getNoteForVerse` (`:2151-2158`) usa `getFirstAsync` **sin `ORDER BY`** y devuelve
  una arbitraria. La otra queda huérfana: duplicada en la pestaña _Notas_, inalcanzable desde
  el lector, y contada doble por `getNotesCount()`. Sin sonda (requiere SQLite real). Detalle:
  `detail/A8-notas-subrayados.md`.
- **`R9-52` (A9, Mesa) — 🐛 toda falla de escritura de una nota se traga en silencio y
  `savePrepNote` la reporta como éxito.** Severidad **media**. `prepNotesStore.ts:76-81`:
  `writeQueue.then(run).catch(log)` y `return writeQueue` → **resuelve, nunca rechaza**; los 4
  llamadores son fire-and-forget o `await Promise.all` sin `try`. Y la Mesa **no tiene ningún
  afordance de guardado**: los únicos 2 toasts de sus 3467 líneas son de error de PDF.
  Agravante: `@prep_notes` es **una sola clave JSON con todos los sermones de toda la vida**, y
  `AsyncStorage_db_size_in_MB` no está configurado en ningún lado (0 hits), así que rige el
  techo de **6 MB por defecto de Android** para toda la base, compartido con progreso, mazo,
  ilustraciones y series. **Repro (sonda):** con `setItem` rechazando,
  `savePrepNote(...)` → `resolves.toBeUndefined()` y el storage queda vacío. Detalle:
  `detail/A9-mesa-persistencia.md`.
- **`R9-53` (A10, respaldo) — 🐛 restaurar un respaldo rompe la invariante de disyunción del
  _floor_: la retención se duplica y la corrupción se re-escribe a la nube, acumulándose.**
  Severidad **media**. `memoryStats.ts:20-22` declara la invariante (_"The floor is disjoint
  from local events […], so summing retention bands never double-counts"_), pero `importBackup`
  hace `DELETE FROM review_events` y reinserta el log **sin tocar el floor**
  (`BackupService.ts:1377-1394`); a partir de ahí `mergeRetentionBands` y
  `retentionByIntervalWithFloor` **suman los mismos repasos dos veces**. Peor: al pasar a
  segundo plano se escriben las bandas duplicadas de vuelta a `users/{uid}/memoryStats/summary`,
  y ese doc corrupto siembra el floor del **siguiente** dispositivo fresco → ×3, ×4… **y no hay
  forma de resetearlo desde la UI** (ver `R9-61`). Acotación honesta: solo `retentionBands` se
  corrompe; `recentDays` y `longestStreak` son idempotentes. **Repro (sonda):** floor de
  `d1:{total:10}` + los mismos 10 eventos → lectura 20, escritura 20, segundo ciclo 30.
  Detalle: `detail/A10-memoria-srs.md`.
- **`R9-54` (A11, planes) — 🐛 descompletar un día de un plan no se sostiene: vuelve solo en la
  siguiente lectura de CUALQUIER capítulo, con notificación falsa.** Severidad
  **media-alta**. `toggleDay` (`ReadingPlanProgressContext.tsx:211-246`) quita el día de
  `completedDays` pero **no toca `@reading_plan_read_chapters`**, y el escaneo de
  `markChapterRead` (`:299-327`) re-completa cualquier día cuyos capítulos sigan marcados. Que
  el equipo conoce el mecanismo lo prueba `restartPlan` (`:436-457`), que **sí** limpia esas
  banderas _"FIRST — otherwise the very next chapter read anywhere in the app would… instantly
  auto-complete the 'restarted' plan again"_; la misma limpieza no se aplicó al caso de un solo
  día. **Repro (sonda):** destildar el día 1 y luego leer **Génesis 1** (nada que ver con el
  plan) → `newlyCompleted: [{planId:'iam-7', day:1}]` y toast «¡Día 1 completado!». Detalle:
  `detail/A11-progreso-rachas.md`.
- **`R9-55` (A11, planes) — 🐛 editar un plan propio a menos días arrastra números de día que
  ya no existen: la pantalla muestra 250%.** Severidad **media**. `migratePlanProgress`
  (`ReadingPlanProgressContext.tsx:259-272`) copia `completedDays` **verbatim, sin recortar al
  `duration` nuevo**, y `plan/[id].tsx:279` calcula
  `Math.round((completed / effectiveDuration) * 100)` sobre el `length` crudo. **`planPace` sí
  filtra** (`planPace.ts:88-90`) y devuelve 100%: las dos cifras se contradicen en la misma
  pantalla y **se pinta la mala**, que además alimenta el ancho de la barra (`width: '250%'`).
  **Repro (sonda):** 5 días completados, plan editado a 2 → `250%` en pantalla vs `100%` en
  `planPace`. Detalle: `detail/A11-progreso-rachas.md`.

---

## P2 — resto + pulido

- **`R9-132` (S21, adaptadores de sync) — 🐛 el `getLocal` de SUBRAYADOS sigue fallando
  ABIERTO.** CONFIRMADO con sonda (motor y adaptador reales). Es la «nota de alcance» de `R9-46`,
  que nunca se numeró ni se decidió. `adapters/highlights.ts:77-92` hace `catch → return null`,
  la forma que `R9-46` prohibió en `notes.ts`. Con la lectura rota, el motor salta LWW y
  conflictos y aplica la copia remota VIEJA encima de la local nueva (color, categoría y NOTA):
  `{"readThrows":true,"addHighlightCalls":["nota VIEJA del otro dispositivo"]}`, y el control con
  la lectura sana no aplica nada. P2 y no P1: a diferencia de `notes`, la ventana no se abre sola
  (los subrayados llaman a `initialize()` en los cuatro métodos). Hace falta que la lectura falle
  de verdad.

- **`R9-133` (S21, favoritos / sync) — 🐛 el `getLocal` de FAVORITOS dice «ausente» durante toda
  la carga en frío, y para siempre si la carga falla.** CONFIRMADO con sonda (provider real).
  `FavoritesContext.tsx:128-147`: `favoritesRef` vale `[]` hasta que termina `loadFavorites`, y el
  motor aplica el remoto sin LWW ni conflicto:
  `{"rowInSqlite":{"note":"NOTA NUEVA (local)","updatedAt":9000000},"getLocalWhileLoading":null}`.
  Si `loadFavorites` FALLA (`:252-256`), el ref se queda en `[]` y todo remoto entra sin LWW.
  Alcance: una edición local ya encolada se cura sola con el eco. Lo que se pierde es una versión
  local más nueva NO encolada (`R9-38`) cuya copia remota cae dentro del piso. P2; P1 si se suma
  el caso de la carga fallida. `MemoryDeckContext.tsx:233-236` tiene la misma forma (PLAUSIBLE,
  sin sonda).

- **`R9-134` (S21, memoria / identidad) — 🐛 la guarda de dueño de `R9-48` falla ABIERTA si no
  puede leer el marcador.** CONFIRMADO con sonda. `getReviewLogOwner` (`memoryStatsSync.ts:79-86`)
  devuelve `null` si la lectura falla, a propósito («_treat as unclaimed_»), y `:226-227`
  reclama el log para el uid activo y escribe:
  `{"wrotePaths":["users/beto/memoryStats"],"ownerAfter":"beto"}`. El control con la lectura sana
  se niega (`setCalls:0`), y en el sembrado el mismo fallo es inocuo. La consecuencia es la de un
  P0 (el historial de Ana en el agregado de Beto, para siempre). El disparador, un `getItem` de
  AsyncStorage que falla justo ahí en un teléfono compartido, es muy raro. **Arreglo (hipótesis):**
  solo un `null` LEÍDO puede reclamar; un fallo de lectura salta la escritura.

- **`R9-135` (S21, premium) — 🐛 si el `logIn` de RevenueCat falla al cambiar de cuenta,
  RevenueCat queda atado a la cuenta anterior, porque el `linkUser` del arranque en frío se
  descarta.** PLAUSIBLE (lectura; el no-op sin configurar lo fija una prueba existente).
  `linkUser` hace `return` si `!configured` (`offeringService.ts:224-238`), y en un arranque en
  frío `onAuthStateChanged` llega antes de `initializeOffering()` (`app/_layout.tsx:209-251`). El
  propio `giftCodeService.ts:185-200` lo admite («_Not fixed at the root_»). Escenario: Ana
  (premium) cierra sesión, y el `logIn('beto')` falla con red inestable. Beto conserva el premium
  de Ana en cada arranque posterior. Severidad baja: el premium lo pagó alguien en ese teléfono.

- **`R9-136` (S21, reglas Firestore) — 🐛 cualquiera puede agotar la cuota diaria COMPARTIDA de
  Firestore con una cuenta anónima, y eso le corta el sync a todos.** PLAUSIBLE: medirlo exige
  escribir en el proyecto real. **Bloqueante antes del lanzamiento**; hoy el impacto es nulo
  (Prueba interna, 0 usuarios). Las piezas, verificadas por lectura:
  - la regla viva (`detail/B4:24-33`) no pone tope ni excluye `anonymous`;
  - la autenticación anónima está habilitada;
  - la config es pública (repo PÚBLICO);
  - no hay App Check;
  - el plan es Spark (20 000 escrituras al día compartidas, `R9-29`).

  **Antes de aplicar la mitigación barata**, que es añadir a la regla
  `request.auth.token.firebase.sign_in_provider != 'anonymous'`, comprobar que NINGUNA escritura
  de la app ocurre como anónima. Lo sólido es App Check con Play Integrity.

- **`R9-137` (S21, prueba de sync) — 🐛 el dedupe por uid de `upsertQueueEntry` (pieza de
  `R9-22`) no lo vigila ninguna prueba.** CONFIRMADO por revert y sonda. Quitar
  `e.uid === entry.uid &&` (`SyncEngine.ts:744`): suite entera 364/364. La sonda con el revert:
  la escritura aparcada de Ana (`Juan/3/16`) la REEMPLAZA la de Beto en cuanto Beto toca el mismo
  versículo, o en su bulk push. Ana no sube nunca su edición, sin error ni insignia. La prueba
  titular siembra las dos entradas por `hydrate`, que no pasa por `upsertQueueEntry`.

- **`R9-138` (S21, prueba de sync) — 🐛 el `deleted:false` / `deletedAt:null` del bulk push
  inicial (pieza de `R9-45`) no lo vigila ninguna prueba.** CONFIRMADO por revert y sonda. Quitar
  las dos líneas (`SyncEngine.ts:1571-1572`): suite entera 364/364, y la sonda da
  `{"hasDeletedKey":false}`. Ningún `*ToRemote` pone `deleted`, así que bajo `{merge: true}` la
  lápida vieja del servidor sobrevive: es `R9-45` entero por la puerta del bulk push. Las 4
  pruebas de «initial bulk push» solo miran los ids.

- **`R9-139` (S21, prueba de respaldo) — 🐛 la protección por sección de `R9-27` solo está
  vigilada en `favorites`, `highlights`, `prepNotes` y el flag `streakLog`.** CONFIRMADO por
  revert y sonda. Sin prueba, cada una con su consecuencia medida:
  - `notes` → `DELETE FROM notes`;
  - `achievements.stats`, en los dos lados → el `UPDATE user_stats` escribe los ceros de
    `EMPTY_RAW_STATS`;
  - `completedBooks`, `bookReadingLog` y `chaptersReadLog` → `DELETE`.

  P2 y no P1: cada una es una línea gemela de otra que sí está vigilada. Falta la tabla completa
  (un `it.each` sobre las etiquetas de `buildBackup`, con el servicio real).

- **`R9-140` (S21, prueba de rachas) — 🐛 el `MAX(longest_streak, ?)` de
  `recomputeReadingStreak` (el remate de `R9-49`) no lo vigila ninguna prueba.** CONFIRMADO por
  revert: `AchievementService.ts:560` → `longest_streak = ?` deja verdes la dirigida 88/88 y la
  suite entera. La prueba necesita un SQLite de verdad o un mock que evalúe el `MAX`.

- **`R9-141` (S21, prueba de respaldo) — 🐛 el aviso de «cerrá y volvé a abrir» tras importar
  (la mitad de `R9-28` que cubre lo que la señal no alcanza) no lo vigila ninguna prueba.**
  CONFIRMADO por revert: quitar `setRestartNoticeVisible(true)` (`DataSettings.tsx:158`) deja
  verdes las 2 pruebas de import y la suite entera. Mientras `R9-117` siga abierto, es la ÚNICA
  defensa de los favoritos restaurados.

- **`R9-142` (S21, prueba de sync — P3) — 🐛 el bucle caliente de `R9-22` solo lo delata un OOM
  del proceso de jest, sin nombre de prueba.** CONFIRMADO, 2 de 2 corridas. Revertidas las dos
  guardas del bucle (`SyncEngine.ts:1616` y `:1778`), jest muere con `JavaScript heap out of
memory` a los ~63 s y 8,1 GB. Bajo el mock de AsyncStorage es un bucle de MICROTAREAS que no
  cede nunca: ni el timeout de jest ni los `setImmediate` de la prueba llegan a correr. La
  regresión no pasaría el CI, pero el rojo no dice qué ni dónde. (Corrige el «0/73 verde
  aislada» de la primera parte de la 21.)

- **`R9-110` (S19, build de packs) — 🐛 un error de E/S dentro del `catch` de FIRST FILE vuelve a
  borrar el mensaje entero.** Es el vecino de `R9-98`: aquel quitó UNA forma de lanzar dentro del
  `catch` del rename, pero `filesNotPinnedBy` (llamada sin protección en `build-web-packs.js:943`)
  sigue haciendo `readdirSync(out)` y `readFileSync` de cada pack.

  **Medido con el `main()` real y procesos REALES:**
  - Un `pwsh` que abre `rvr1960-red-letter.json` con `FileShare.ReadWrite` y lo bloquea por rango
    de bytes pasa el preflight, y deja al operador con `EBUSY: resource busy or locked, read`,
    **sin ruta siquiera**.
  - Un directorio con el nombre de un pack pinado que la corrida ya no emite (`--allow-shrink`)
    da `EISDIR: illegal operation on a directory, read`. El preflight solo mira lo que la corrida
    emite.
  - Si `out` se borra entre el preflight y el rename, sale `ENOENT … scandir`.

  Es la tercera vez con la forma de `R9-95`/`R9-98`. Queda en P2 porque no se encontró ninguna
  herramienta del flujo real que tome un bloqueo de rango sobre un `.json`: SQLite bloquea en el
  offset 1 GiB, y con un visor la lectura sale bien.

  **Arreglo:** `filesNotPinnedBy` dentro de su propio `try`, que degrade a `null` («no pude
  comprobar») con el motivo.

- **`R9-111` (S19, build de packs) — 🐛 en el `out` REAL, «IS coherent» es inalcanzable: la rama
  que protegen las pruebas de `R9-97` solo existe en los fixtures.** El directorio de publicación
  contiene `web-bootstrap.json` (tiene que estar: es lo que se sube a Pages). Como
  `filesNotPinnedBy` recorre todo `.json`, lo reporta siempre como «_web-bootstrap.json (the
  manifest does not mention it)_».

  **Medido con el `main()` real, los datos reales y una copia del directorio real, tras una
  corrida limpia:** «_CAREFUL: it is NOT coherent. An EARLIER run left this directory MIXED - …
  web-bootstrap.json (the manifest does not mention it). Do NOT upload anything from it._»

  Ningún `out` de fixture lleva la copia del manifiesto: el fixture responde la pregunta. Es la
  clase de `R9-84` (llamar MIXED a lo coherente).

  **Arreglo:** excluir el manifiesto por nombre (o compararlo con el del repo), y añadir un fixture
  que lo contenga.

- **`R9-112` (S19, build de packs) — 🐛 FIRST FILE y FAILED HALFWAY afirman una CAUSA que no
  comprobaron.**
  - **FIRST FILE, rama «NOT coherent»** (`:957-959`). El encabezado dice «_An EARLIER run left
    this directory MIXED_ … _those files are an EARLIER run_», y ahora encabeza también los
    archivos faltantes y los ajenos. Medido, lo dice de:
    - un `out` **vacío**, que es el primer caso que cita la prueba de `R9-97`;
    - un `out` con una corrida **entera** sin pinar (tras `R9-96`);
    - el directorio de una sola corrida con manifiesto legacy, que la prueba de `R9-98` fija como
      `NOT coherent`.
  - **FAILED HALFWAY** (`:965-972`) dice «_not moved (an EARLIER run's)_» sin mirar. En un `out`
    recién creado nombra 3 archivos «de una corrida anterior» que no existen, y con las fuentes sin
    cambiar llama MIXED a 4 archivos idénticos al manifiesto. La comprobación está 20 líneas más
    arriba.

  El consejo («Do NOT upload») es seguro en todos los casos; lo falso es la causa. Es vecino de
  `R9-93` y de `R9-84`.

- **`R9-113` (S19, build de packs) — 🐛 el preflight de `R9-81` no caza la causa que él mismo
  nombra: un visor de SQLite.** El preflight abre cada destino con `openSync(dest, 'r+')`
  (`build-web-packs.js:885-919`), y su error dice «_Close whatever is holding that file (a SQLite
  browser, …)_».

  **Medido con procesos REALES, sin mocks,** reteniendo `web.sqlite`:
  - Pasan el preflight todos estos: `node:sqlite` RW, `node:sqlite` `readOnly: true`,
    `fs.openSync('r')`/`'r+'` y .NET `FileShare.ReadWrite[, Delete]`.
  - En todos, el `main()` real termina en `FAILED HALFWAY: EPERM` con 3 archivos movidos:
    `rvr1960.sqlite` con bytes de la corrida 2, y el manifiesto pinando los de la 1.
  - Solo lo caza quien **niega la escritura** (`FileShare.Read`).
  - Con las fuentes reales sobre una copia de `Desktop\web-packs`, sale el mismo HALFWAY.

  **Son falsas estas afirmaciones:**
  - la entrada de `R9-81` («cubre la causa realista entera»);
  - el comentario del script en `:891` («_covers the whole realistic cause_»);
  - el de `:898-900` («_a file held open by another process throws here_»);
  - el de la prueba en `:1046` («_The residual race_»): no es una carrera, pasa siempre;
  - la frase del ledger «espiar `renameSync` es la única forma determinista de llegar ahí».

  El mensaje de HALFWAY sí dice la verdad; por eso es P2. **Lección: una compuerta verificada solo
  con spies no se midió contra el mundo.**

  **Arreglo:** que el preflight haga un rename real de ida y vuelta (o un `renameSync` a un nombre
  temporal en el mismo directorio) en vez de `open`.

- **`R9-114` (S19, prueba de sync) — 🐛 el «control de que la carrera ocurrió» de la prueba de
  `R9-34` no controla nada.** `SyncEngine.test.ts:1914-1918` fija `attempts === 1` como prueba de
  que hubo un push fallido **de v1**. Pero la reedición `v2` estrena `attempts: 0`, y su propio
  push fallido también la deja en 1.

  **Medido:**
  - Revertido `R9-34` y reproducida la forma envenenada original, pasan el control **y** el valor:
    `{"attempts":1,"value":"v2-REEDITADO","pushesIntentados":["v1","v2-REEDITADO"]}`.
  - Con un refactor de una línea que difiere el `flush()` de `queueWrite` (`:470`), y `R9-34`
    revertido, **la prueba comprometida pasa en verde**.
  - El comentario de `:1916` («no habría intento ninguno») es falso.

  Hoy la prueba sí cae con `R9-34` revertido; lo que no protege es su propia premisa.

  **Arreglo:** controlar con el registro de llamadas a `set()`, que con la carrera es solo `['v1']`.

- **`R9-115` (S19, `SyncEngine`) — 🐛 la premisa del arreglo de `R9-11` es falsa: `!== item` no
  significa «me reemplazó una edición más NUEVA».** `hydrateQueue` (`:515-526`) también mete
  objetos en la cola, y los trae del DISCO, o sea viejos.

  **Medido:** X está persistido como `"viejo"` y se reedita a `"nuevo"` mientras `start()`
  hidrata. Con el arreglo se sube `["nuevo","viejo"]` y **la nube acaba en `"viejo"`**; con `R9-11`
  revertido, solo `["nuevo"]`. La ventana es estrecha: el arranque, con una entrada pendiente del
  mismo id.

  Pariente preexistente, P3: una escritura hecha durante la hidratación cuyo primer push falla
  desaparece de la cola y del disco, con `pending 0` y `dropped 0`.

  **Arreglo:** que la hidratación no pise una entrada en memoria más nueva (comparar `updatedAt`, o
  hidratar antes de aceptar escrituras).

- **`R9-116` (S19, prueba de respaldo) — 🐛 la prueba de `R9-28` cubre 1 de los 4 providers del
  arreglo.** El arreglo suscribe a la señal de restauración (`subscribeBackupRestored`) a
  `MemoryDeck`, `ReaderPreferences`, `ReadingPlanProgress` y `ReadingProgress`.

  **Medido:** quitadas a la vez las suscripciones de los tres últimos, **la suite entera sigue
  verde (363 suites / 4289 pruebas)**. La frase «ya no queda ningún arreglo sin prueba»
  (`BUGS.md`, `CONTINUAR.md`) es cierta para `MemoryDeck` y no para los otros tres. Es la lección
  de la 18: comprobar la afirmación ENTERA.

  **Arreglo:** una prueba parametrizada sobre los cuatro providers.

- **`R9-117` (S19, favoritos / respaldo) — 🐛 `FavoritesContext` no escucha la señal de
  restauración, y pisa lo restaurado.** No está entre los suscriptores de
  `subscribeBackupRestored` (verificado).

  **Medido:**
  - Tras importar, la memoria sigue con `"nota PRE-import"` mientras SQLite tiene
    `"nota RESTAURADA"`.
  - Cuando la siguiente edición de ese favorito sí sube (ver `R9-102`), la nube recibe
    `note: "nota PRE-import"` y `rating: 2` con `updatedAt` = ahora, y eso **gana en los demás
    dispositivos**.
  - El aviso de reiniciar se cierra con «Entendido» y lo presenta como pantallas desactualizadas,
    no como un riesgo.

  Es el vecino de `R9-28` (P0) que ninguna prueba mira.

  **Arreglo:** suscribir `FavoritesContext` como los otros cuatro, y meterlo en la prueba
  parametrizada de `R9-116`.

- **`R9-118` (S19, CI) — 🐛 Codecov nunca recibió NADA, y el step sale verde.**
  - El log del run `35163775542` (y el de uno de rama del 09-03) dice «_Branch `main` is protected
    but no token was provided_» y tres veces «_Token required - not valid tokenless upload_».
  - El step pasa por `fail_ci_if_error: false` (`ci.yml:81`).
  - La API pública de Codecov da `count: 0` para el repo, y el badge dice «unknown».

  **Es un step que promete algo y no lo entrega en el 100 % de los pushes.**
  `detail/B5-seguridad-ci.md:45` afirma que el upload tokenless está «permitido en repos
  públicos», y eso es falso en la práctica: con `main` protegida, Codecov exige token. Además, el
  step baja el CLI de Codecov en «_Running version latest_», sin fijar.

  **Decisión de Victor:** darle token (un secreto) o quitar el step. Lo que no vale es un verde que
  no mide nada.

- **`R9-119` (S19, premium) — 🐛 cerrar sesión le quita el premium a quien pagó, y dos docstrings
  dicen lo contrario.** Los docstrings son `offeringService.ts:218-223` y `AuthContext.tsx:335-338`
  («_never revoked on sign-out_»), y la entrada de `R9-9` los cita como hecho.

  **Medido con `AuthProvider` y el servicio reales:** `logIn calls =
[["uid-ana"],["anon-nuevo"]]`, `isPremium = false`, caché `false`. El motivo es que el anónimo
  que se crea al cerrar sesión llama a `linkUser`.
  - Da idéntico con `bb3b25b^`: es **preexistente**, no una regresión.
  - La semántica de RevenueCat («un appUserID nuevo no tiene compras») está simulada en el mock.
  - Se recupera volviendo a iniciar sesión.

  **Quién es dueño del premium (la cuenta o el dispositivo) es decisión de producto de Victor.** Lo
  que hoy sí es un defecto es que el comentario miente.

- **`R9-120` (S19, build de packs — P3, agrupado).** Todo medido con el `main()` real:
  1. La prueba legacy de `R9-98` no demuestra que el normalizador corrió, aunque su comentario diga
     «_Naming it is the proof the normalizer ran_». Si se ignora el objeto legacy en silencio, da
     **63/63 verde**: el mensaje pasa a nombrar `rvr1960-red-letter.json` **y** `web-red-letter.json`,
     y el `toContain` se cumple igual. Falta `not.toContain('web-red-letter.json')`.
  2. Una entrada del manifiesto sin `sha256` se descarta (`:512`).
     - Si el archivo está presente, sale «_the manifest does not mention it_», que es una razón falsa.
     - Si está ausente, con 3 de 4 archivos dice «_IS coherent - one run, whole_»: `R9-97`
       reabierto.
     - Hoy es inalcanzable: las 6 revisiones históricas llevan `file` y `sha256`.
  3. Manifiesto con disco lleno: `:1011-1018` dice «_the manifest still describes the PREVIOUS ones
     … costs nothing_». Pero con `O_TRUNC` + `ENOSPC` el manifiesto queda en 0 bytes, y la
     re-corrida aborta con «Could not PARSE».
  4. Preflight con un directorio donde va un pack: el mensaje dice «_Close whatever is holding that
     file … and re-run_», y la re-corrida da el mismo error.
  5. `verifyPack` nombra `out/.staging-…/rvr1960.sqlite`, que `main()` ya borró cuando el operador
     lo lee.
  6. `packs: [null, …]` da un `TypeError` pelado desde `shrinkComplaints:423` (y `:434`), que no se
     protegen contra `null` como sí lo hacen `:385` y `:512`.
  7. El consejo del error READ (`:287-291`, «move it aside … first run») lleva, desde `R9-83`, a
     «_its absence is a deleted or moved file, not a first run_».
  8. Un abort con fallo de limpieza dice «_no pack file was emitted into the output directory_»
     mientras `out/.staging-X/` tiene los 4 packs. Es `R9-72` por el camino de `R9-95`; la nota
     final lo mitiga.
  9. «_ALL slices non-blank and in-range_» deja pasar un span `[-5,29]`: el verificador comprueba
     `slice(-5,29)` y el render (`redLetterText.ts:134`) pinta `[0,29]`. Solo es alcanzable con un
     bug del generador.

- **`R9-121` (S19, compuerta de CI — P3, agrupado).** Todo medido contra las funciones reales y el
  `ci.yml` real:
  1. Cualquier línea `node-version:` dentro del job cuenta como pin (`:283`). Incluye la que el
     bucle externo relee DENTRO de un bloque `run: |`, porque `:280` hace `continue` sin avanzar
     `i`. Con un job sin `setup-node` dan 23/23:
     - un heredoc que escribe `node-version: 24`;
     - un `config: |` de otra acción;
     - `env:`;
     - el `with:` de `actions/cache`.

     Es preexistente, y ninguna de esas formas aparece en las plantillas.

  2. El piso por archivo de `R9-100` (`:611-613`) no tiene sonda propia: quitarlo deja 23/23.
     - Su mensaje es solo `["deploy.yml", false]`, sin el porqué.
     - El caso del commit no lo aísla: con el strip y sin el piso sale rojo igual, por «bare major».
     - La única entrada que lo necesita es un `jobs:` ilegible (`jobs: &deploy_jobs`), y ninguna
       sonda la tiene.
  3. `checked >= 1` (`:709`) lo alimentan SOLO las tres frases «it pins Node 24 now» que escribió
     el mismo arreglo (`hebrewGlossEs.test.ts:38`, `insertVersesBatchedSql.test.ts:16-17`,
     `quizVerseLookup.test.ts:11`). Revertirlas da `Expected: >= 1, Received: 0`, que parece «el
     regex se rompió». Sí caza un recorrido de directorio roto (medido).
  4. `nodePinClaims` devuelve `[]` para «pins Node.js 20» y «pins Node v20», que están dentro de su
     alcance declarado, y también para «is pinned to Node 20» y «CI uses Node 20».
  5. La sonda titular de `R9-99` (`bad: # added in a hurry`) no discrimina la lógica de COLUMNA: si
     se revierte solo la columna sigue verde, porque la sostiene `stripTrailingComment`. El id
     entrecomillado y el ancla que cita el commit no tienen sonda.
  6. Tres casos más que pasan sin que la compuerta los vea:
     - el orden de los steps no se modela: un `npm test` ANTES del `setup-node '24'` pasa;
     - `shell: node {0}` sin `setup-node` pasa;
     - un comando armado con `${{ … }}` (plantilla oficial de Pages `nextjs.yml:75`) solo se
       detecta por casualidad.
  7. Pisos de Node rancios que ningún detector ve:
     - `README.md:82` dice `node >= 18.0.0`, y `engines` exige `>=22.13.0`;
     - «Requires Node ≥ 22 (node:sqlite)» en `build-hebrew-lemma-gloss-es.js:50` y en
       `research/generate-a4-override-positions.js:62`, falso para 22.0–22.12;
     - la misma frase en cuatro scripts más que llevan `--experimental-sqlite`, donde es falsa solo
       para 22.0–22.4;
     - «`node:sqlite` requires Node >= 22.5», sin la bandera, en `hebrewGlossEs.test.ts:39` y en
       `insertVersesBatchedSql.test.ts:17-18`.

- **`R9-122` (S19, dinero y sync — P3, agrupado).**
  1. «La suscripción pasa ANTES de la lectura» (`PremiumContext.tsx:72-73`, y el commit y el ledger
     de `R9-9`) arregla una ventana que no existe: la IIFE async corre síncrona hasta su primer
     `await`. Revertido solo el orden: 42/42 verdes.
  2. La aserción intermedia `PremiumContext.test.tsx:156` es vacua: `false` es el estado inicial de
     `useState`, así que con `R9-9` revertido pasa, y la prueba cae recién en `:163`. Además, el
     commit dice «las 5 vistas fallar», pero con los dos arreglos revertidos caen **4**: la quinta
     es un control.
  3. Un `stop()` que cae durante un `start()` en vuelo se deshace:
     `{"trasStop":0,"alResolverStart":2,"isActive":false}`. En la práctica solo pasa con la misma
     cuenta.
  4. Un lote de Ana que termina después de `start('beto')` escribe su máximo bajo la clave de
     cursor de Beto (`:1124`; medido `cursorBeto null → tsDeAna`).

- **`R9-123` (S19, docs de la revisión — P3, agrupado).** Afirmaciones falsas o rancias en los
  propios docs, medidas contra git y contra el código:
  1. «Décima sesión seguida» (`S18:3`, `INDEX.md`, `CONTINUAR.md`) era falso. **La 11 y la 12 no
     revisaron ningún diff**, así que los de la 10 y la 11 nunca se habían revisado. Ya lo están:
     los revisó esta sesión.
  2. `R9-97`..`R9-99` estaban bajo `## P2` siendo P1. **Se movieron a P1 en esta sesión.**
  3. `CONTINUAR.md` tenía tres errores, **reescritos en esta sesión**:
     - `:18` decía `main` = `2b65a12`, y era `40160d7`;
     - el prompt de arranque daba rangos que se dejaban fuera a sí mismos (un commit no puede
       nombrar su propio hash) y decía «dos de checkpoint» cuando eran tres;
     - hablaba de «Tres cosas» sin decidir, cuando «Dicho y NO hecho» lista 5.
  4. Dos afirmaciones de `S18` son falsas:
     - `:92-94`, «limpie el directorio … como le dijo el mensaje FAILED HALFWAY»: HALFWAY solo dice
       «re-run»;
     - `:94-95`, «la rama `unpinned.length === 0` no la ejercitaba ninguna prueba»: la de `R9-84` sí
       pasa por ahí. Lo cierto es «ninguna la asertaba».
  5. `S10:128-129` («flush() tampoco corre sin uid, así que no hay camino») es falso: ver `R9-104`.
  6. `B5-seguridad-ci.md:45` (upload tokenless a Codecov «permitido») es falso: ver `R9-118`.
  7. El orden de las lecciones va 16→18→17 en `CONTINUAR.md` e `INDEX.md`, y dos corolarios de la
     16 cuelgan de la 17.
  8. Cifras rancias heredadas en las secciones 1-9 de `CONTINUAR.md`: «10 ramas» enumerando 11,
     «7 a 16», 4263 pruebas, 64 hallazgos, «abiertos son 14», y 19 detalles cuando hay 28. También
     `INDEX.md:52-53` («subir `rvr1960-red-letter.json`», ya publicado). **Sin corregir una por
     una.**

- **`R9-90` (S17, CI) — 🐛 el control «still has a reason to require it» casaba TEXTO, y miraba 1
  de los 9 archivos que lo necesitan.** `expect(script).toContain("require('node:sqlite')")` sobre
  `build-web-packs.js`. **Medido en las dos direcciones:** migrado a `better-sqlite3` dejando un
  comentario que mencionara el require, la compuerta seguía **verde** afirmando que el archivo lo
  requiere; y quitando la mención decía que el piso estaba **rancio** cuando siguen requiriéndolo
  **8 scripts más** (`rebuild-seed.js` incluido, que construye el seed nativo). **Arreglado:** se
  deriva sobre `scripts/` con los comentarios quitados, y se exige `>= 2`.

- **`R9-91` (S17, pruebas) — 🐛 cinco suites seguían AFIRMANDO que CI fija Node 20.**
  `databaseMigrations`, `sanitizeFtsQuery`, `insertVersesBatchedSql`, `hebrewGlossEs`,
  `quizVerseLookup`. No son notas de color: son la **justificación documentada** de por qué
  simulan SQL a mano en vez de abrir `node:sqlite`. Esa razón caducó con `R9-82` y nadie lo notó,
  **porque un comentario no es una compuerta: es una nota, y una nota no se pone roja.**
  **Arreglado:** las cinco frases a pasado con el piso real, **más el detector**, que deriva los
  pines reales del workflow y falla si alguna suite afirma en presente un pin que no existe.
  Visto fallar devolviendo una de las cinco a presente.

- **`R9-92` (S17, compuerta de providers) — 🐛 el escáner de layouts no veía
  `_layout.native.tsx`, y no lo decía.** `R9-86` hizo que los layouts se BUSCARAN —correcto— y
  luego casaba los dos nombres **literalmente**, así que un directorio con solo
  `_layout.native.tsx` no llegaba al mapa: ni como entrada, ni como error. **Medido:** una sonda
  con un `<ProbeOnlyProvider>` en un layout `.native` dejaba el archivo en **15/15 verde**
  mientras el árbol nativo lo montaba de verdad → queda fuera de `native`, por tanto de
  `unmountedOnWeb`, por tanto de todo lo que exige declararlo: el crash de
  `R9-14`/`R9-75`/`R9-80` por una puerta lateral. **La asimetría es el hallazgo:** el caso vecino
  (`.native` + `.web`) **sí** fallaba ruidosamente, o sea que la comprobación estaba BIEN y nunca
  se **ejecutaba** para esa fila — la lección de la 16 una iteración de bucle más abajo.
  **Arreglado:** el walker parsea el sufijo de plataforma; `.ios`/`.android` se **reportan**.

- **`R9-93` (S17, build de packs) — 🐛 el mensaje FIRST FILE decía COHERENTE sobre un directorio
  que puede estar MEZCLADO.** `R9-84` cerró «dice MIXED sin haber movido nada»; su reemplazo
  afirma «_It is coherent - one run, whole - and its sha256 are still the ones the manifest
  pins_», y eso es **falso** en cuanto una corrida anterior falló a medias. **Medido**, tres
  corridas encadenadas: tras un `FAILED HALFWAY`, 1 de 4 archivos con sha256 que la base **no**
  pina, y la corrida siguiente afirmando que el directorio es publicable — **contradiciendo
  palabra por palabra** el aviso correcto del paso anterior. **Arreglado:** se comprueba (el
  manifiesto ya está en mano), y `null` («no pude comprobar») y `[]` («comprobado, cuadra») son
  respuestas **distintas** a propósito.

- **`R9-100` (S18, compuerta de CI) — 🐛 `jobs: # comentario` ciega un archivo entero, y el piso
  era un conteo global.** `/^jobs:\s*$/` rechazaba el comentario, `inJobs` no se encendía y el
  archivo volvía entero vacío — silencio idéntico al de un parseo limpio. El único piso contaba
  jobs-que-corren-node **sobre todos los archivos**, así que `ci.yml` lo satisfacía en nombre del
  archivo cegado: el número de hoy haciendo de cobertura. **Medido con un segundo workflow de
  verdad:** un job corriendo `npm ci && npm run build:web` en `node-version: '20'` —`R9-82`
  verbatim— pasaba **15/15**. **✅ ARREGLADO** (`f477c19`): el comentario se quita en toda línea y
  el piso pasa a ser **por archivo** (`scan.jobs.length > 0`).
  **⚠️ Sesión 19:** el piso por archivo no tiene sonda propia, y su mensaje no dice por qué falla — ver `R9-121`.

- **`R9-101` (S18, compuerta de CI) — 🐛 el detector de `R9-91` no cruza de línea, y no casaba con
  NADA.** El regex lleva `[^.\n]` entre «pins» y la versión, y la frase que se pudrió **cruzaba**:
  es la de `databaseMigrations.test.ts`, la canónica, la que las otras cuatro citan como su razón.
  **Medido devolviéndola verbatim al archivo real: la compuerta seguía VERDE.** Y como las cinco
  frases se reescribieron en el mismo commit, el regex no casaba con nada en todo el repo — el
  bucle recorría ~360 archivos sin llegar ni una vez a la comparación, así que un regex roto del
  todo se veía idéntico. **✅ ARREGLADO** (`f477c19`): `nodePinClaims` como función sobre TEXTO con
  cuatro sondas (incluido el control en pasado), aplanado de continuaciones, piso `checked >= 1`,
  y las tres frases corregidas vueltas a hacer afirmaciones VIVAS («it pins Node 24 now»): de 0
  comparaciones a 3.
  **⚠️ Sesión 19:** `checked >= 1` lo alimentan solo las tres frases que escribió este mismo arreglo — ver `R9-121`.

- **`R9-94` (S17, CI) — 🐛 `npm outdated` corría sin instalar: las 57 filas salían `MISSING`.**
  El job de seguridad es el único sin paso de instalación. `npm audit` lee el lockfile y no lo
  necesita; **`npm outdated` sí**, porque su salida entera es la versión **instalada**. En el run
  **verde** `35130290791`: las 57 dependencias directas en `MISSING` y `exit code 1` tragado por
  `continue-on-error`, en todos los runs verdes desde que se escribió el job. **El primer arreglo
  fue falso y lo cazó medirlo:** `--package-lock-only` **no** sustituye (sigue dando `MISSING` las
  57). **Arreglado:** instalar antes, con la caché que el job ya tiene. Medido: 0 `MISSING`.
  _(Distinto de `R9-5`, que dice que el job no puede fallar; eso presupone que el paso mide algo.)_

- **`R9-95` (S17, build de packs) — 🐛 el `finally` de `main()` podía DESTRUIR el motivo del
  aborto.** Un `throw` desde un `finally` **reemplaza** la excepción del `try`, así que una
  corrida donde la compuerta hizo su trabajo —cazar un encogimiento, negarse a publicar— podía
  reportar `EBUSY: resource busy or locked, rmdir` **y nada más**. La compuerta disparó y el
  operador no se enteró. El espejo es igual de malo: una corrida que emitió los cuatro packs y
  reescribió el manifiesto reportando un EBUSY pelado parece fallida. No es hipotético: `staging`
  vive dentro de `out`, `out` es el Escritorio por defecto, y un cliente de sincronización sobre
  9,5 MB de `.sqlite` recién escritos es la misma causa que motivó `R9-81`. **Arreglado:** la
  excepción original se conserva y el problema de limpieza se **añade**.

- **`R9-96` (S17, build de packs) — 🐛 la escritura del manifiesto era la ÚNICA operación sin
  mensaje.** Y es el único fallo donde «los archivos de `out` son de una corrida anterior» es
  **falso** y «el manifiesto no se tocó» es el problema en vez del consuelo: los cuatro renames ya
  cayeron, así que `out` tiene los bytes de ESTA corrida mientras el manifiesto versionado pina
  los anteriores. Publicar desde ahí sube packs cuyo sha256 el manifiesto contradice — y ese
  sha256 es la única señal que `data-loader.web.ts` usa para notar un pack nuevo. **Alcanzabilidad
  baja** (solo lectura, bloqueo, disco lleno); se arregla por la asimetría de disciplina.

- **`R9-84` (S16, build de packs) — 🐛 el mensaje decía que el directorio estaba MEZCLADO sin
  haber movido nada.** El error que `R9-81` escribe cuando un rename falla es una **aserción sobre
  el mundo**, y si el que falla es el PRIMER rename la afirma al revés: con `moved: none` seguía
  diciendo «_That directory is MIXED ... Do NOT upload anything from it_». No se movió nada, así
  que el directorio es una corrida anterior **coherente** con los sha256 que el manifiesto todavía
  fija — es el defecto de `R9-66` («no pack file was emitted» con 9,5 MB escritos) visto desde el
  otro lado. **Repro:** forzar el fallo en la primera llamada a `renameSync`. Alcanzable por la
  carrera que el propio `R9-81` admite no cerrar, cuando el bloqueo cae sobre el primer archivo.
  **Arreglado:** dos estados, dos mensajes. Detalle: `detail/S16-revision-del-diff.md`.

- **`R9-85` (S16, prueba de packs) — 🐛 el mock de `renameSync` se llamaba a sí mismo, así que la
  prueba del caso «a medias» solo veía el caso «no se movió nada».** La prueba de `R9-81` hacía
  `return jest.requireActual('fs').renameSync(from, to)` dentro del propio mock — y
  `jest.requireActual` devuelve **el mismo objeto de módulo** para un módulo nativo, así que eso
  ES el spy (sondeado: `SAME_MODULE=true SAME_FN=true IS_MOCK=true`). El primer rename reentraba,
  el contador saltaba a 2 y lanzaba, de modo que `moved` estaba **siempre vacío**. Su regex solo
  pedía que las dos ETIQUETAS estuvieran presentes, y lo están en los dos casos. Encontrado al
  escribir la prueba de `R9-84`. **Arreglado:** capturar el `renameSync` real antes de espiar y
  exigir que el mensaje NOMBRE los archivos (una movida, tres no).
  Detalle: `detail/S16-revision-del-diff.md`.

- **`R9-86` (S16, compuerta de providers) — 🐛 el control de `R9-80` probaba una COPIA del arreglo,
  y el escáner solo abría 2 de los 4 layouts.** «counts a provider that is only MENTIONED as not
  mounted» construía su propio `ts.createSourceFile`, su propio visitante y su propio `Set`: no
  llamaba a `scanLayout` ni una vez. **Medido:** con `scanLayout` vuelto al regex el archivo
  quedaba en **13/13 verde, ese caso incluido**, y el bug seguía alcanzable (sacar
  `<AudioPlayerProvider>` de `app/_layout.web.tsx` dejando el nombre en un comentario JSX: seguía
  13/13); lo único que se ponía rojo al restaurar el AST era una prueba **anterior**. Segunda
  mitad: el escáner solo leía `app/_layout.tsx` y `app/_layout.web.tsx`, así que «los providers
  que esta app monta» era una afirmación sobre la mitad de los archivos que lo deciden — estaba
  como «dicho y NO hecho» en la 15. **Arreglado:** `scanSource(file, source)` + `scanLayout(path)`
  (la forma que el hermano ya tenía desde `R9-67`), el control llama al escáner de verdad, y los
  layouts se **buscan** en vez de enumerarse, con la resolución de metro bien puesta (un layout
  anidado sin hermano `.web` es parte del árbol web también). Sin cambio de comportamiento hoy;
  la diferencia es que ahora está derivado. Detalle: `detail/S16-revision-del-diff.md`.

- **`R9-79` (S15, paridad web/nativo) — 🐛 el contrato compartido no tiene por qué vivir en el
  hermano nativo.** `R9-76` amplió el discriminador de «el nativo lo EXPORTA» a «...o lo declara
  en privado», con el argumento correcto —exportarlo es una decisión del propio código
  ofensor—, **pero el mismo argumento vale un nivel más afuera**: el contrato no tiene por qué
  estar en el hermano nativo en absoluto. `AudioPlayerContext.tsx` importa
  `AudioPlayerContextValue` de `../types/audio`, así que el nativo ni lo declara ni lo exporta y
  las dos reglas se callan — **y ése es uno de los cuatro pares de contexto que el comentario de
  la compuerta cita como su justificación**. Sondeado: una copia local divergente en el stub web
  dejaba la suite en **72/72**. **✅ ARREGLADO en la sesión 15:** para un `…ContextValue` la
  regla es incondicional, un archivo `.web` no declara uno y punto; todo otro nombre sigue
  necesitando que el nativo lo exporte, que es lo que mantiene fuera a un `Props`/`State`
  privado. **Y con control, que es lo que le faltaba a `R9-76`**: tras `R9-70` ningún par real
  dispara la regla, así que los catorce casos reales se ponen verdes sin comparar nada —
  «sondeado a mano» no es lo mismo que «fijado». El predicado sale a una función y se ejercita
  contra pares sintéticos: el caso de `R9-79`, el de `R9-76`, el de `R9-70` y los dos negativos
  que conservan la estrechez. Detalle: `detail/S15-revision-del-diff.md`.

- **`R9-80` (S15, web) — 🐛 la compuerta de `R9-75` contaba como montado un provider nombrado en
  un comentario.** `providersMountedIn` era un regex sobre el TEXTO crudo del layout, y el texto
  crudo no distingue un provider MONTADO de uno MENCIONADO. Sondeado contra la compuerta misma:
  dejar de montar `<AudioPlayerProvider>` en `app/_layout.web.tsx` conservando el nombre dentro
  de un comentario JSX dejaba el archivo entero en **11/11 verde**. El sentido del fallo es el
  malo: el conjunto «montados en web» **CRECE** en silencio, `unmountedOnWeb` pierde esa
  entrada, y nada exige anotarla en `WEB_UNMOUNTED_PROVIDERS` — así que `useAudioPlayer` lanza,
  `isMissingProviderError` dice `false`, y el usuario recibe el «Algo salió mal» genérico con un
  botón de reintentar que vuelve a renderizar la misma ruta y vuelve a lanzar: **exactamente el
  síntoma que `R9-14` existe para quitar**. La compuerta escrita para ser «derivada, no
  confiada» estaba confiando en un comentario, y su propio encabezado ya se preocupaba de que
  ese conjunto encogiera en silencio — crece igual de callado. **✅ ARREGLADO en la sesión 15:**
  recorre el ÁRBOL DE SINTAXIS, como el escáner de paridad después de `R9-67`, así que los
  comentarios y los literales de cadena dejan de existir en vez de haber que quitarlos a mano; y
  con la misma disciplina, una etiqueta que no puede atribuir a un identificador simple
  (`<Ctx.Provider>`) se **reporta** en vez de descartarse. Con control sintético, que es lo único
  positivo que hay: ningún layout real menciona un provider que no monte.
  Detalle: `detail/S15-revision-del-diff.md`.

- **`R9-81` (S15, build de packs) — 🐛 la mudanza a `out` no es atómica y podía dejarlo
  MEZCLADO.** `R9-72` estableció la propiedad correcta —nada llega al directorio de salida hasta
  que la compuerta pasa— pero la mudanza final son **cuatro** `renameSync`, no uno. Probado
  bloqueando el último destino: un `rvr1960.sqlite` **nuevo** junto a un `web.sqlite` **viejo**,
  el manifiesto sin escribir describiendo ninguno de los dos estados, el escenario ya barrido
  por el `finally` —así que no queda nada que diga que la mudanza fue parcial— y un `EPERM`
  pelado sin el «_CAREFUL: check their sha256 before publishing_» que llevan todos los demás
  abortos de ahí. Y publicar es una subida MANUAL de lo que haya en ese directorio, que por
  defecto es el **Escritorio**, justo donde un archivo se queda abierto por un cliente de
  sincronización o un visor de SQLite. Río abajo tampoco lo caza nadie: `data-loader.web.ts` usa
  el sha256 solo como token de caché y **nunca lo verifica contra los bytes**. **✅ ARREGLADO en
  la sesión 15:** se comprueba que TODOS los destinos son reemplazables antes de mover el
  primero —lo que cubre la causa realista entera con `out` todavía intacto— y si el rename falla
  igual, el error dice exactamente qué se movió y qué no, y que ese directorio está MEZCLADO.
  **Detalle que costó una prueba roja por el camino equivocado: Windows abre tan campante un
  DIRECTORIO con `open(…, 'r+')`**, así que el preflight tiene que mirar además
  `statSync().isFile()`. La rama del rename que falla después del preflight se fija espiando
  `fs.renameSync`, que es la única forma determinista de llegar ahí.
  Detalle: `detail/S15-revision-del-diff.md`.
  **⚠️ Sesión 19:** el preflight NO cubre la causa realista entera: un visor SQLite, incluso `readOnly`, lo pasa y rompe el rename a mitad — ver `R9-113`.

- **`R9-74` (S14, build de packs) — 🐛 `readPreviousManifest` devolvía `null` ante CUALQUIER
  error, y un `null` apagaba la compuerta entera en silencio total.** El comentario decía
  «absent or unreadable is not an error: the very first run has nothing to compare against»,
  y mezclaba dos cosas distintas. **Ausente** sí es legítimo. **Presente pero ilegible** no, y
  es alcanzable: el script escribe ese archivo con **un solo `fs.writeFileSync`**, así que su
  propia corrida interrumpida (Ctrl-C, disco lleno) deja un JSON truncado, y un merge malo
  deja marcadores de conflicto. **Sondeado:** con el manifiesto truncado a
  `{ "schema": 1, "packs": [`, la corrida **no imprime una sola palabra** sobre haberse
  salteado la comparación, y reescribe el archivo. Y en el camino de éxito tampoco imprimía
  nada, así que **el silencio era a la vez la señal de «verificado» y la de «no comparé
  nada»**. **✅ ARREGLADO en la sesión 14:** distingue `ENOENT` de todo lo demás (un baseline
  ilegible **aborta**, con la instrucción de restaurarlo), exige un `packs` array —un
  manifiesto sin él compararía contra nada y pasaría en vacío, que es el bug— y
  `assertNoShrink` **DICE** cuál de los dos casos ocurrió. Vista fallar primero, con el control
  de que un manifiesto simplemente ausente sigue devolviendo `null`.
  Detalle: `detail/S14-revision-del-diff.md`.

- **`R9-75` (S14, web) — 🐛 la lista de providers de `R9-68` tenía compuerta en UNA sola
  dirección.** `WEB_UNMOUNTED_PROVIDERS` es una lista **a mano** de siete nombres, y la prueba
  que la sesión 13 dejó (`never claims a provider app/_layout.web.tsx actually mounts`)
  comprueba que ninguna entrada esté montada en web — **nadie comprobaba que la lista estuviera
  COMPLETA**. La lista está bien **hoy** (verificado: el árbol nativo monta 19 providers, el web
  11, la diferencia es 8 = los 7 de la lista + `ServicesProvider`, excluido a propósito porque
  su `createContext` tiene un default real y su hook no lanza nunca). Pero «está bien hoy» es
  una nota, no una compuerta — el corolario de `R9-67`, al pie de la letra. El día que alguien
  añada un contexto a `app/_layout.tsx` y no a `_layout.web.tsx`: el hook lanza,
  `isMissingProviderError` devuelve `false`, y la ruta cae en la genérica «Algo salió mal» de
  `ErrorBoundary.web.tsx:135` **con un botón de reintentar que re-renderiza la misma ruta y
  vuelve a lanzar** — el síntoma exacto que `R9-14` existía para quitar, reintroducido en
  silencio. Lo mismo si alguien **QUITA** un provider del árbol web. **✅ ARREGLADO en la
  sesión 14:** los dos layouts están en disco, así que la diferencia es **derivable**. Dos
  pruebas: que toda la diferencia nativo-menos-web esté en la lista o en un conjunto de
  excepciones **con su razón**, y que ninguna entrada nombre un provider que el nativo ya no
  monta (la mitad de obsolescencia, igual que `ALLOWED_NATIVE_ONLY` en la compuerta de
  paridad). Detalle que no es accidental: el regex pasa a `[\s>]`, porque el nativo escribe
  `<ServicesProvider database={bibleDB}>` y un patrón anclado en `>` **se salta todo provider
  que reciba un prop**; va con su propia aserción para que no pueda volver atrás en silencio.
  Vistas fallar primero con **tres** sondas. Detalle: `detail/S14-revision-del-diff.md`.

- **`R9-76` (S14, paridad web/nativo) — 🐛 el discriminador de la compuerta de `R9-70` estaba
  en manos del archivo vigilado.** Marca un tipo redeclarado en el stub web **solo si el
  hermano nativo lo EXPORTA** — y eso es una decisión que toma el propio código ofensor: si el
  nativo mantiene el tipo privado, la compuerta se calla. **No es teórico: es exactamente el
  estado en que estaba `OfferingSheetContextValue`** hasta que `R9-70` lo arregló a mano (su
  propia entrada lo dice: «el nativo no lo exportaba»), así que **el tercer caso del arreglo es
  justo el que su compuerta nueva no podía cazar**. Sondeado con par sintético: nativo mantiene
  `FiveContextValue` privado, el stub web declara una copia con un miembro menos, compuerta
  **verde**. **✅ ARREGLADO en la sesión 14:** un nombre `…ContextValue` cuenta como contrato
  compartido exporte el nativo o no — ese sufijo no es una convención casual, es cómo se
  **llama** el contrato provider/hook en los cuatro pares de contexto. La estrechez se conserva
  y va con control: un `Props` privado y divergente en los dos lados sigue **sin** marcarse
  (segundo par sintético), porque marcar las formas privadas enterraría la señal. Vista fallar
  primero: con la condición vieja los 82 casos pasan y la sonda se cuela.
  Detalle: `detail/S14-revision-del-diff.md`.

- **`R9-71` (S13, lector web) — 🐛 un fallo transitorio de red mataba la letra roja el resto
  de la sesión.** La rama de fallo de `loadRedLetterSpans` hacía
  `spansByVersion.set(versionId, new Map())`, que es **indistinguible** de «cargado, y esta
  versión no tiene spans» — así que nada reintentaba nunca: la letra roja quedaba muerta el
  resto de la vida de la página mientras `hasRedLetterData` mantenía el interruptor habilitado
  y el lector pintaba texto plano sin explicación. Una sola petición perdida bastaba. Y es más
  fácil de disparar de lo que parece: **un 404 de GitHub Pages se sirve SIN cabecera CORS**,
  así que un `fetch` cruzado que lo reciba rechaza con `TypeError: Failed to fetch` y cae en
  ese mismo `catch`. **Preexistente**, no lo introdujo el diff de la sesión 12 — quedó dicho en
  la revisión y Victor pidió cerrarlo. **✅ ARREGLADO en la sesión 13:** el fallo deja la
  versión **sin asentar** y suelta la entrada en vuelo, así que el siguiente que pregunte
  reintenta; los reintentos quedan acotados por los sitios de llamada (montaje, cambio de
  versión, toque del interruptor), no por un temporizador. Con **dos controles**: una carga con
  éxito sigue sin re-pedirse nunca, y una versión sin pack sigue asentando para siempre sin
  fetch. **Detalle que costó pensarlo:** la limpieza NO puede vivir en un `finally` dentro del
  closure — ese cuerpo corre síncronamente hasta su primer `await`, así que un `fetch` que
  tirara de forma SÍNCRONA ejecutaría el `finally` **antes** del `loadPromises.set` y dejaría la
  entrada atascada para siempre, o sea el mismo bug entrando por la puerta de atrás. Va con su
  prueba, que discrimina: volviendo a la forma del `finally` dentro falla exactamente esa y
  ninguna otra. Detalle: `detail/S13-revision-del-diff.md`.

- **`R9-68` (S13, web) — 🐛 `isMissingProviderError` se tragaba errores legítimos y los
  presentaba como decisión de producto.** Detectaba por mensaje con `\w*Provider`, o sea
  **cualquier** mensaje de esa forma. Ejecutando la función real: los **tres errores internos
  de expo-router** —dos de los cuales dicen literalmente «This is likely a bug in Expo Router»—
  y **los ocho providers que el árbol web SÍ monta** (ReaderPreferences, BibleVersion, Toast,
  Premium, Favorites, MemoryDeck, OfferingSheet, AudioPlayer) daban `true`. En cualquiera de
  esos casos el usuario recibía «Esta sección no está en la versión web / necesita tu cuenta y
  tus datos guardados» —una explicación afirmativa y **falsa**— se le quitaba el botón de
  reintentar y solo le quedaba salir a `/bible`. El encabezado solo contemplaba el riesgo en
  **una** dirección (que un mensaje deje de encajar → pantalla genérica, nunca un crash), y el
  único control de la prueba («Provider must be used within a tree») no tocaba la contraria.
  **✅ ARREGLADO en la sesión 13:** el NOMBRE del provider tiene que estar en
  `WEB_UNMOUNTED_PROVIDERS`, los siete que `app/_layout.web.tsx` deja fuera a propósito.
  `ServicesProvider` queda fuera de la lista aunque también esté sin montar — su
  `createContext` tiene por defecto un objeto real, no `undefined`, así que nunca tira y la
  entrada sería inalcanzable. 3 pruebas vistas fallar primero, una de ellas **deriva** los
  providers montados leyendo el layout real en vez de fiarse de una lista a mano, con control
  para que la disyunción no se cumpla en vacío. Detalle: `detail/S13-revision-del-diff.md`.

- **`R9-69` (S13, lector web) — 🐛 cambiar de versión emparejaba el texto de una traducción con
  los offsets de otra.** El lector reseteaba `redLetterLoaded` a `false` **dentro de un
  `useEffect`**, y un reset dentro de un efecto llega **un render tarde**: el efecto corre
  después del render que cambió la versión (y en navegador, después de que ese render haya
  pintado), así que el primer render con el id nuevo veía el `true` viejo y los `verses`
  viejos. El comentario de ese efecto afirmaba que el reset evitaba «briefly pair one version's
  text with the other's offsets» — **no lo evitaba**. Lo que limitaba el daño era que
  `getRedLetterSpans` está keyed por versión, y eso solo salva mientras el pack nuevo NO esté
  cacheado; en cuanto el lector cambió de idioma una vez, sí lo está. **Instrumentado:**
  `{offsetsFor: "RVR1960", textFrom: "WEB"}` — span `[0,145)` de RVR1960 sobre el texto inglés
  de 130 caracteres todavía en pantalla. Severidad **baja**: dura un frame, y luego entra
  `loading`. **✅ ARREGLADO en la sesión 13:** `redLetterLoaded: boolean` pasa a
  `redLetterLoadedFor: string | null` y la prontitud se **deriva en render**
  (`redLetterLoadedFor === selectedVersion.id`), que es donde no hay ventana para ir un render
  atrasado. **Nota de método:** `act()` vacía los efectos antes de poder leer el árbol, así que
  el frame mal pintado no es observable en jest — la CONSULTA sí, y es lo que asserta la
  prueba, con su control. Detalle: `detail/S13-revision-del-diff.md`.

- **`R9-70` (S13, paridad web/nativo) — 🐛 el vecino de `R9-13`, un nivel más abajo: contratos
  de contexto redeclarados en el stub web.** La compuerta de paridad compara **nombres de
  export de módulo**, y el tipo de valor de un contexto no es un export de módulo: es el
  contrato entre un provider y todo lo que llama a su hook. `PremiumContext.web.tsx`
  redeclaraba `PremiumContextValue` en local **aunque el nativo sí lo exporta**, y
  `redLetterText.web.ts` hacía lo mismo con `RedLetterRun`. **Comprobado con sonda:** añadiendo
  un miembro a la interfaz nativa y satisfaciéndolo del lado nativo, `tsc --noEmit` quedaba
  **completamente verde** mientras el stub web nunca lo implementaba — `tsc` resuelve el
  especificador pelado al archivo nativo, ve la forma nativa y pasa. En web eso es
  `usePremium().<miembro> is not a function`, el crash de `R9-13` por otro lado. **No era un
  bug vivo** (las formas coincidían), pero el hueco sí. **✅ ARREGLADO en la sesión 13:** los
  tres importan el tipo del hermano nativo (type-only, borrado en compilación, sin auto-import
  en runtime) — el patrón que `MemoryDeckContext.web.tsx` y `AudioPlayerContext.web.tsx` **ya
  usaban**. El tercero, `OfferingSheetContextValue`, tenía excusa (el nativo no lo exportaba);
  ahora sí. Compuerta nueva deliberadamente **estrecha**: solo tipos que el hermano nativo
  EXPORTA, porque medido sobre los 14 pares los duplicados se parten limpio entre contratos
  compartidos y formas privadas (`Props`/`State`, los `*ProviderProps`, `SpanMap`,
  `ChapterItem`) que es correcto duplicar; marcar las privadas enterraría la señal. Con el
  arreglo puesto, la misma sonda da `PremiumContext.web.tsx(70,7): error TS2741`. Detalle:
  `detail/S13-revision-del-diff.md`.

- **`R9-12` (A5, `SyncEngine`) — 💡 no se usa `writeBatch` en ningún lado; los bucles
  empujan de a un documento.** `SyncEngine.ts:1238-1240` empuja secuencialmente y
  `firestore.ts:94` lo dice explícito ("_not needed yet_"). Afecta a subrayar una selección
  entera, a `resetDeck()` y sobre todo a la restauración de un respaldo. **No es cuota**
  (Firestore cuenta documentos, y son N documentos igual): es latencia y exposición a fallo
  parcial. La cola se persiste, así que no se pierden. Cruza con `R9-29`.

- **`R9-20` (A2, backend) — 💡 el endpoint de canje no valida la forma del código antes de
  gastar Auth+Firestore.** `redeem.ts:114-121`, `:159`. Un `{"code":"AB/CD"}` produce una
  ruta de colección y sale un 500 donde tocaba un 400. Y cada POST basura consume un
  `verifyIdToken` + una lectura antes de mirar la cadena; como Vercel Hobby tiene **tope duro
  sin facturación por exceso** (elegido a propósito), suficientes POST dejan el canje **fuera
  de servicio**. **La fuerza bruta NO es la preocupación** (31⁸ ≈ 8,5·10¹¹). Un regex lo
  cierra.

- **`R9-21` (A2, backend) — 💡 si el grant funciona pero falla el marcado, el código vuelve
  a la piscina en silencio.** `redeem.ts:189-213` loguea por `console.error` y devuelve 200.
  El código sigue figurando como disponible, así que un segundo usuario puede canjearlo y
  obtener otro entitlement vitalicio. Sin alerta ni campo barrible. **Adjunto:** el
  comentario de `:194-196` remite a un tradeoff que **no está en la cabecera de este
  fichero** — está en `functions/src/index.ts`, la copia no desplegada. Puntero colgante.

- **`R9-26` (A3, auth) — 💡 tras eliminar la cuenta la app probablemente se queda sin
  usuario hasta el siguiente arranque.** `AuthContext.tsx:569` rearma
  `triggeredAnonymousRef` **después** de `deleteUser`, al revés que `signOut` (`:463` antes
  de `:464`), así que el evento `null` llega con la bandera aún en `true` y no relanza el
  sign-in anónimo. Rompe el contrato de la cabecera ("siempre hay uid estable") y deja los
  Crashlytics de esa sesión sin identificar. **Pendiente de verificar en dispositivo.**

- **`R9-31` (A7, respaldo) — 💡 la restauración no aísla a los demás escritores de SQLite ni
  propaga los borrados a la nube.** `BackupService.ts:1277-1278` usa `withTransactionAsync`,
  no la variante **exclusiva**, así que escrituras de otros módulos (incluido el listener de
  sync, que sigue enganchado) caen dentro de la transacción y se pierden en un rollback. Y el
  push solo hace `queueWrite`, nunca `queueDelete`: lo que el restore borró sigue en
  Firestore y **vuelve** en una reinstalación. "Restaurar = reemplazar" degrada a "restaurar
  = mezclar".

- **`R9-32` (A7, respaldo) — 💡 el archivo de respaldo se escribe en caché y nunca se
  limpia.** `BackupService.ts:586-590`. `shareAsync` resuelve al cerrarse la hoja, no cuando
  un destino guardó el archivo, y no hay toast de éxito **ni de fallo**: descartar la hoja se
  da por bueno y el usuario cree tener un respaldo que solo existe en un directorio que el
  sistema puede desalojar. N exports = N copias completas acumuladas.

- **`R9-2` (B2, `.gitignore`) — 💡 el `.gitignore` raíz solo cubre `.env*.local`, no un
  `.env` pelado.** Severidad **baja** (hardening), arreglo de una línea.
  `.gitignore:48` es `.env*.local`, así que `.env`, `.env.production`, `scripts/.env` y
  `src/.env` **no** están ignoreados — y el repo es **público**
  (`"visibility": "public"`).
  **Repro:** `git check-ignore -v .env` → sin match; comparar con
  `git check-ignore -v functions/.env` → sí matchea (`functions/.gitignore:13`).
  **Por qué NO es P0:** los dos directorios que manejan secretos de alto valor ya se
  cubren solos — `functions/.gitignore` tiene `.env`, y `vercel/gift-code-redeem/.gitignore`
  tiene `.env*`. En la raíz y en `scripts/`/`src/` hoy no hay nada sensible (los
  `process.env` de `scripts/` son rutas y flags; la convención de Expo en la raíz es
  `EXPO_PUBLIC_*`, público por diseño), y no existe un `.env.example` que empuje a
  crear uno.
  **Por qué vale arreglarlo:** el radio de daño si se equivoca es total — el service
  account de Firebase que consume `vercel/gift-code-redeem/api/redeem.ts:36` salta
  _todas_ las reglas de Firestore, y la clave secreta de RevenueCat (`:220`) otorga
  entitlements gratis. `.env` en la raíz es el nombre más natural y basta un
  `git add .`.
  **Arreglo sugerido (no aplicado):** `.env*.local` → `.env*` en `.gitignore:48`.

- **`R9-3` (B3, limpieza) — 💡 3.3 MB de artefactos de Yarn trackeados en un repo que
  usa npm.** Severidad **muy baja**, no es seguridad.
  Siguen trackeados `.yarn/releases/yarn-3.6.4.cjs` (2 231 402 bytes) y
  `.yarn/plugins/@yarnpkg/plugin-interactive-tools.cjs` (1 074 996 bytes), restos de la
  era Yarn del commit inicial, mientras el repo usa npm: hay `package-lock.json`, no hay
  `yarn.lock`, y `package.json` no tiene campo `packageManager`.
  **Repro:** `git ls-files | grep '^\.yarn/'` → 2 archivos.
  **Efecto secundario que vale:** ese bundle minificado es la única razón por la que un
  escáner de secretos sobre este repo reporta un falso positivo de `AKIA` (fragmentos
  `AKIA4QI`/`AKIA9`/`AKIAE`, ninguno con la forma AWS de `AKIA`+16). Borrarlos limpia el
  ruido además del peso. Encaja en la fila `B9`; se registró en `B3` porque ahí se
  encontró.

- **`R9-4` (B4, proceso) — 💡 las reglas de seguridad de Firestore no están versionadas
  en el repo.** Severidad **baja-media**: no es un hueco explotable hoy, es riesgo
  operativo. Las reglas vivas son correctas (default-deny + `request.auth.uid == uid`,
  ningún path abierto — auditado en `detail/B4-reglas-firestore-storage.md`), pero
  existen **solo en la consola de Firebase**.
  **Repro:** `git ls-files | grep -iE '\.rules$'` → 0 archivos; `firebase.json` solo
  tiene `react-native`, `functions`, `hosting` — ni sección `firestore` ni `storage`.
  **Por qué importa:** el control de acceso de toda la app es el único componente de
  seguridad que se salta el proceso que el resto del código sí respeta — sin diff, sin
  PR, sin CI, **sin rollback**. `firebase deploy --only firestore:rules` no funciona
  sin la sección en `firebase.json`, así que el despliegue seguirá siendo manual, que
  es justo el modo en que se relaja una regla sin querer. Hoy reglas y código coinciden
  por suerte estructural (el comodín `{collection=**}` cubre toda colección nueva bajo
  `users/{uid}/`), no por verificación.
  **Arreglo sugerido (no aplicado):** volcar el texto vivo a `firestore.rules` (ya está
  capturado íntegro en el detalle de `B4`, así que es mecánico) + añadir
  `"firestore": {"rules": "firestore.rules"}` a `firebase.json`.

- **`R9-5` (B5, CI) — ⚠️ el job "Security Audit" no puede fallar nunca.** Severidad baja
  como riesgo, pero induce a error activamente. Los dos únicos pasos del job
  (`npm audit --audit-level=moderate` y `npm outdated`) llevan ambos
  `continue-on-error: true`, así que el job **sale verde siempre**.
  **Repro:** cualquier run reciente en Actions → "Security Audit" verde; local
  `npm audit --audit-level=moderate` → exit code ≠ 0 (8 vulns, 1 HIGH, ver `B1`).
  **Por qué importa:** quien mire los checks de un PR concluye "la auditoría de
  seguridad pasó" cuando en realidad se ejecutó y se ignoró el resultado.
  **Opciones (no aplicadas):** quitarle el `continue-on-error` a `npm audit` ahora que
  `B1` ya clasificó las 8 y dejó justificadas las inevitables; o renombrar el job a
  "Dependency Report" para que el nombre no prometa una garantía que no da.
  (`npm outdated` sí necesita la bandera: devuelve 1 siempre que haya algo atrasado.)

- **`R9-6` (B5, CI) — 💡 endurecimiento: sin bloque `permissions:` y acción de terceros
  en tag mutable.** Severidad **baja**, hoy mitigado por configuración del repo.
  (a) `ci.yml` no declara `permissions:` en ningún nivel, así que el `GITHUB_TOKEN`
  hereda el default del repo — que hoy **es `"read"`** (verificado por API), o sea sin
  escalada real; pero es un ajuste de settings mutable desde la UI sin dejar rastro en
  git. (b) `codecov/codecov-action@v4` es de terceros sobre un tag **móvil**, y
  `sha_pinning_required` del repo es `false` (Codecov tiene precedente de compromiso de
  cadena de suministro, 2021).
  **Por qué NO es urgente:** el repo tiene **0 secretos de Actions** (`total_count: 0`)
  y el token es read-only, así que una acción comprometida no podría exfiltrar
  credenciales ni pushear — a lo sumo falsear el resultado del job.
  **Arreglo sugerido (no aplicado):** `permissions: {contents: read}` a nivel workflow +
  fijar la acción de Codecov a SHA completo.

- **`R9-7` (B1b, `functions/`) — ✅ RESUELTO 2026-09-03.** Era: código no desplegado que duplica la lógica de dinero, y
  `firebase.json` todavía lo declara.** Severidad **baja-media** (mantenimiento en una
  ruta P0, no un bug hoy).
  `functions/src/index.ts` implementa el canje de gift-codes completo **en paralelo** al
  de Vercel — los dos leen `db.collection('giftCodes').doc(code)`
  (`functions/src/index.ts:204` vs `vercel/gift-code-redeem/api/redeem.ts:159`) y los dos
  llaman a RevenueCat con la clave secreta. Pero la app solo llama a Vercel
  (`src/lib/offering/giftCodeService.ts:44` → `https://essb-gift-redeem.vercel.app/api/redeem`).
  **Repro:** `git log --oneline -- functions/` → 1 solo commit (`ca69aca`), reemplazado
  por `c3650f0` ("port redemption endpoint to Vercel's free tier"); `functions/node_modules`
  no existe; el proyecto está en plan Spark (Cloud Functions necesita Blaze).
  **Por qué importa:** (a) deriva silenciosa — un arreglo de canje aplicado en Vercel deja
  atrás la copia invisible, y son dos implementaciones del mismo gate de pago;
  (b) `firebase.json` sigue con `"functions": [{"source": "functions", "predeploy": …}]`,
  así que un `firebase deploy` sin `--only hosting` intentaría desplegarlo.
  **Resolución:** Victor pidió primero borrarlo; al revisar el objetivo antes de borrar
  apareció un dato que faltaba en este hallazgo — `functions/` **no está olvidado, está
  conservado a propósito**, y la razón ya estaba escrita en
  `src/lib/offering/giftCodeService.ts`: Cloud Functions exige el **plan Blaze**, que
  convierte el proyecto Firebase **entero** a facturación con sobrecosto, mientras el
  tier Hobby de Vercel tiene tope duro. Con ese dato se recomendó **no borrar**, y Victor
  estuvo de acuerdo. Aplicado:
  (a) se quitó la sección `functions` de `firebase.json` — mata la trampa concreta de
  despliegue (ahora `firebase deploy` solo publica hosting);
  (b) se agregó `functions/README.md`, que lo etiqueta como NO DESPLEGADO, explica el
  motivo de Blaze, señala que la fuente de verdad es `vercel/gift-code-redeem`, **avisa
  que esta copia está atrasada en mantenimiento** (la de Vercel recibió `d97516b`) y deja
  los 5 pasos si alguna vez se despliega, incluida la sección JSON exacta que se quitó;
  (c) punteros al README desde `giftCodeService.ts` y `.prettierignore`.
  **Por qué no se borró:** conservarlo cuesta cero medible (no compila, no testea, no
  entra al bundle, no lo toca `npm run validate`), el riesgo de deriva exige pasar a
  Blaze — un acto deliberado de mucha fricción — y borrarlo sí destruye la salida de
  emergencia de un solo proveedor en una ruta de dinero. El problema del "duplicado
  invisible" se resolvió haciéndolo visible y etiquetado.

- **`R9-8` (B1b, subproyectos) — 💡 replicar el `override` de `uuid` que la raíz ya
  tiene.** Severidad **baja**; cierra la única vuln de runtime desplegado sin tocar
  `firebase-admin`.
  De las 26 vulns de `functions/` + `vercel/` (incluidas **7 HIGH**), la única en el
  runtime realmente desplegado es `uuid@9.0.1` vía `firebase-admin@13.10.0` →
  `google-gax`/`gaxios`/`teeny-request` (todas las HIGH salen de `@vercel/node`, que es
  **devDependency** = tooling de build/`vercel dev`, no viaja al lambda).
  GHSA-w5hq-g745-h8pq afecta solo a `v3`/`v5`/`v6` **con** argumento `buf`; esas libs
  usan `uuid.v4()` → **no alcanzable**, pero es trivial de cerrar.
  **Ojo, misma trampa que `R9-1`:** el fix de npm es
  `firebase-admin@10.3.0` — un **downgrade** desde 13.10.0 que además revertiría
  `d97516b` ("pin firebase-admin to 13.x, avoiding a broken jose/jwks-rsa ESM chain").
  **Arreglo sugerido (no aplicado):** `"overrides": {"uuid": "^11.1.1"}` en
  `vercel/gift-code-redeem/package.json`. **Este override SÍ funciona** (a diferencia del
  de `R9-1`): `uuid@11.1.1` trae build dual (`exports.node.require → ./dist/cjs/index.js`)
  y la **raíz ya lo corre con ese mismo override** con `npm run validate` en verde.
  Verificar con un canje real contra el endpoint desplegado antes de darlo por cerrado.

- **`R9-42` (campo, lector) — 💡 el ícono de bocina del versículo que se está narrando
  queda a **0 px** del borde de la tarjeta.** `app/(tabs)/verse/[book]/[chapter].tsx:2583-2591`.
  El ícono es `position: 'absolute'` con `left: -(fontSizes.sm + spacing['0.5'])` = **-16**,
  dentro de un `verseItem` cuyo `paddingHorizontal` es `spacing.md` = **16**
  (`:3742-3750`). Es decir: el ícono consume **exactamente** todo el canalón y su borde
  izquierdo cae justo sobre el borde de la tarjeta, con el único 1 espacio disponible (2 px)
  asignado al lado derecho. **Pedido por Victor (2026-09-07)** con la preocupación
  explícita de no reabrir la saga del recorte de palabras. **Esa preocupación se puede
  descartar para el ajuste del `left`:** el ícono es `position: 'absolute'` +
  `pointerEvents="none"`, o sea **fuera de flujo**, y el anti-recorte vive en el
  `paddingRight`/`textBreakStrategy` del `<Text>` (Sprint 110/112) — mover el ícono no
  puede tocarlo. **La restricción real es de espacio:** el canalón mide 16 px y el ícono 14,
  así que hay **2 px de holgura total**; no caben márgenes a ambos lados sin ampliar el
  canalón (subir `verseItem.paddingLeft` a ~20-22, que **sí** reflowa el texto, aunque solo
  estrecha la columna sin tocar la holgura derecha) o achicar el ícono. Es una decisión de
  diseño, no un arreglo mecánico. Detalle: `detail/CAMPO-victor-2026-09-07.md`.

- **`R9-43` (campo, Mesa) — 🐛 en «Comparar versiones» el número de versículo se encima
  con la fila de chips: no hay separación vertical ninguna.**
  `app/features/prep/index.tsx:2160-2222`. En la rama premium de la tarjeta, los tres hijos
  se apilan sin margen alguno: `sectionCard` (`:3121-3126`) **no tiene `gap`** (solo
  `padding` y `marginBottom`), `helpMeta` es `{fontSize: fontSizes.xs}` pelado (`:3249`),
  `chipWrap` es `{flexDirection:'row', flexWrap:'wrap', gap: spacing.sm}` **sin
  `marginTop`/`marginBottom`** (`:3273`), y `compareVerseBlock` tiene `marginBottom` y
  `gap` internos pero **no `marginTop`** (`:3360`). Resultado: el texto de ayuda queda
  pegado a los chips y el número de versículo («23» en la captura) queda pegado bajo el
  chip, leyéndose como encimado. **Reportado en vivo por Victor (2026-09-07)** con captura.
  Nota: las otras ramas de la misma tarjeta no sufren esto porque usan contenedores con
  `gap` propio. **Arreglo (no aplicado):** un `gap` en `sectionCard` (arriesga tocar todas
  las tarjetas de la Mesa) o, más acotado, `marginTop` en `compareVerseBlock` +
  `marginTop`/`marginBottom` en `chipWrap` dentro de esta tarjeta. Detalle:
  `detail/CAMPO-victor-2026-09-07.md`.

- **`R9-56` (A8, notas) — 🐛 la pestaña Notas muestra la referencia en el idioma de la versión
  activa y el versículo congelado en el idioma de cuando se creó la nota.** Severidad **baja**.
  `notes.tsx:276` usa `localizeBook(item.book)`, que sigue a `selectedVersion.language` a
  propósito (`:270-273`), pero `item.text` es el `verse_text` congelado al crear la nota y
  `updateNote` solo toca `note`/`updated_at` (`database/index.ts:2107-2115`). Crear notas en
  RVR1960 y pasar a KJV muestra **"John 3:16"** sobre **"Porque de tal manera amó Dios al
  mundo…"**, también en la imagen para compartir (`:435`), que es contenido público.
  `HighlightsScreen` **sí** re-resuelve contra la versión activa (`highlights.tsx:96-101`) —
  la asimetría confirma que es un olvido. Detalle: `detail/A8-notas-subrayados.md`.
- **`R9-57` (A8, lector) — 🐛 no existe forma de borrar una nota desde el lector, y el botón
  atrás descarta el borrador sin avisar.** Severidad **media**. Vaciar el campo deshabilita
  «Guardar» (`NoteEditorModal.tsx:290`) y `saveNote` corta con `!noteText.trim()`
  (`verse/[book]/[chapter].tsx:1049`), así que el gesto natural no hace nada; el único borrado
  vive en la pestaña _Notas_. Y el borrador vive **solo** en el `useState` del padre —el propio
  comentario lo admite (`:147-150`)— así que la X o el atrás de Android (`onRequestClose`,
  `:169`) lo descartan **sin confirmación**. **Sin verificar en dispositivo:** si el
  `BackHandler` del `Modal` de RN gana sobre el `useBackHandlerStep` de la pantalla
  (`:1287-1296`), que no consulta `noteModalVisible`; si perdiera, el atrás además navegaría de
  capítulo. Requiere Modo C. Detalle: `detail/A8-notas-subrayados.md`.
- **`R9-58` (A9, Mesa) — 🐛 matar la app (o cerrar la pestaña en web) pierde hasta 700 ms de
  tecleo: `use-debounce` expone `flushOnExit` y no se usa.** Severidad **baja**.
  `prep/index.tsx:1024-1042`. **El resto de los caminos de salida están bien** y se auditaron
  uno por uno (desmontar, blur, púlpito, ilustraciones, historial, series, cambio de pasaje):
  todos persisten, y el `flush()` de `:1042` **funciona** —confirmado desminificando
  `use-debounce@10.1.1` y con sonda—. Lo único descubierto es el proceso que muere (swipe-away,
  OOM, cierre de pestaña). Detalle: `detail/A9-mesa-persistencia.md`.
- **`R9-59` (A9, privacidad local) — 🐛 `@prep_notes` no se limpia al cerrar sesión ni al
  cambiar de cuenta: en un teléfono compartido, el sermón sin terminar del predicador anterior
  queda a la vista del siguiente.** Severidad **baja**. No existe ningún
  `removeItem`/`multiRemove` sobre `@prep_notes`, `@prep_series`, `@prep_illustrations` ni
  `@prep_self_review` en todo el repo, y la clave no está namespaceada por uid. El módulo se
  presenta como _"privacy-first"_ (`prepNotes.ts:12-15`), pero la garantía solo se cumple
  contra la nube. **Mecanismo distinto de `R9-22`/`R9-23`** (aquí no hay sync ninguno).
  **Severidad honesta:** P2 y no P0 porque no hay fuga **hacia afuera** del dispositivo y el
  repo trata progreso y logros con la misma política device-scoped (documentada en
  `deleteAccountData.ts:12-13`). **Decisión de producto para Victor:** si «device-local» debe
  significar también «visible para cualquiera que use el aparato». Detalle:
  `detail/A9-mesa-persistencia.md`.
- **`R9-60` (A10, respaldo) — 🐛 el respaldo omite 3 claves de AsyncStorage del área de memoria
  mientras respalda todas las demás preferencias locales.** Severidad **baja**. Patrón de lista
  enumerada a mano: `BackupPayload.memory` es literalmente `{memoryDeck, reviewEvents}`, y
  faltan `@memory_daily_goal`, `@memory_weekly_target` y `@memory_celebrated_milestones`
  (`goalStore.ts:19-20`, `weeklyTargetStore.ts:16`) — mientras que `@app_theme_mode`,
  `@reader_preferences`, `@prep_notes` y el bloque de `achievements`, **igual de device-local**,
  sí se respaldan. Al restaurar, la meta diaria vuelve a 10 y el reto semanal a 3 en silencio, y
  se **re-celebran todos los hitos de racha ya celebrados**.
  `@memory_stats_floor`/`_banner_pending` quedan fuera **correctamente** (caché derivable;
  respaldarlas empeoraría `R9-53`). Detalle: `detail/A10-memoria-srs.md`.
- **`R9-61` (A10, recuperación) — 🐛 `resetDeck` está en la API pública del contexto y no tiene
  ni un solo llamador: no hay forma de que el usuario borre sus datos de memoria.** Severidad
  **baja**. Declarado, documentado (_"handy for 'Reset' affordance"_), implementado
  (`MemoryDeckContext.tsx:88`, `:339-348`) y duplicado como no-op en el stub web (`:74-76`);
  `grep -rn "resetDeck" app/ src/` fuera del contexto → **cero**. **Sube la severidad efectiva
  de `R9-48` y `R9-53`**: un usuario con estadísticas contaminadas o duplicadas no tiene
  ninguna acción en la app para limpiar. O se cablea a Ajustes, o se quita de la interfaz para
  que no aparente una vía de escape que no existe. Detalle: `detail/A10-memoria-srs.md`.
- **`R9-62` (A10, hitos) — 🐛 el recorte FIFO de hitos celebrados expulsa las claves de racha y
  le re-celebra al usuario «¡3 días!» cuando lleva 156.** Severidad **baja**.
  `goalStore.ts:66-80` recorta con `merged.slice(-MAX_CELEBRATED)` y `MAX_CELEBRATED = 60`; el
  recorte quita **las más antiguas**, que son siempre las `streak:*`, porque las
  `goal:YYYY-MM-DD` se añaden al final una por día. El comentario de `:63-64` afirma que es
  seguro _"porque una clave de racha solo re-dispara cuando la racha realmente se reconstruye"_:
  **es falso**. **Repro (sonda):** cascada de 6 días seguidos —`streak:3`, `7`, `14`, `30`,
  `60`, `100`— con la racha real en 156-161. Cosmético, pero trivializa el mecanismo de
  retención. Detalle: `detail/A10-memoria-srs.md`.
- **`R9-63` (A11, recap) — 🐛 el recap semanal se rompe en el cambio de horario: 6 días en vez
  de 7, y un día contado dos veces.** Severidad **baja-media**. `weeklyRecap.ts:85-86` (y el
  mismo patrón en `listeningStats.ts:156-157`) hace `listeningDateKey(now - i * MS_PER_DAY)` —
  bloques fijos de 24 h con clave de día local—, así que en un día de 25 h dos valores de `i`
  caen en la misma fecha. El hermano `weekComparison.ts:57-61` hace lo correcto
  (`d.setDate(d.getDate() - 7)`): **la forma buena ya existe en la misma carpeta**. Afecta a
  una tarjeta **compartible** y se propaga al delta semana-a-semana. **Repro (sonda, requiere
  PowerShell):** `$env:TZ = 'Europe/Madrid'; npx jest …` con
  `now = 2026-10-25T23:30:00+01:00` → tira de 7 días con `2026-10-25` repetido, 60 versículos
  donde hay 50, 3 días activos donde hay 2. Pasa en `America/Mexico_City` (caso de control).
  Detalle: `detail/A11-progreso-rachas.md`.
- **`R9-64` (A11, planes) — 🐛 `migratePlanProgress` BORRA el progreso de origen cuando el
  destino ya tiene el suyo, en vez de fusionarlo.** Severidad **baja**.
  `ReadingPlanProgressContext.tsx:264-268`: `if (!next[toId]) next[toId] = current;` protege el
  destino, pero `delete next[fromId];` se ejecuta **incondicionalmente**, así que cuando la
  rama protectora se activa el progreso de origen se destruye sin ir a ningún lado. Alcanzable
  al editar un plan propio hasta que su id derivado del contenido colapse con el de otro.
  **Repro (sonda):** tras migrar, `getCompletedDays(BIG.id)` → `[]`. Detalle:
  `detail/A11-progreso-rachas.md`.

---

## ⚠️ Dudas / parciales

- **`R9-1` (B1, remediación de vulns) — ⚠️ TRAMPA: `npm audit fix --force` rompería la
  app entera.** No es un bug de la app; es una mina para una futura sesión de arreglos.
  `npm audit` reporta, para las 3 filas de la cadena `expo-router` → `query-string` →
  `decode-uri-component`, `fixAvailable: {"name":"expo-router","version":"5.1.11","isSemVerMajor":true}`.
  El instalado es **`expo-router@57.0.12`** (declarado `~57.0.12`, fijado por Expo SDK
  57), así que la "corrección" es un **downgrade de 52 majors** que destruiría todo el
  routing de `app/`. `npm audit` lo dice en su propia salida:
  `Will install expo-router@5.1.11, which is a breaking change`.
  **Repro:** `npm audit` en la raíz y leer el bloque `fixAvailable` de
  `decode-uri-component` / `query-string` / `expo-router`.
  **Qué hacer:** `npm audit fix` a secas es seguro (solo toca `firebase-tools` y
  `@expo/plist`, ambos dev/build). **Nunca `--force`.** La vía de `overrides` tampoco
  sirve: el parche `decode-uri-component@0.5.0` es ESM-only y `query-string@7.1.3` lo
  consume con `require()`. Lo correcto es no tocar nada — las 3 no son alcanzables
  (detalle en `detail/B1-npm-audit.md`) y se resuelven cuando `expo-router` migre a
  `query-string` 8+.
  **⚠️ Sesión 21:** hoy `npm audit --package-lock-only` da **14 vulnerabilidades (11 moderate, 3 high)**, no las 8 (1 high) del 2026-09-03. Las nuevas son todas de tooling, cobertura o build (`js-yaml`, `@xmldom/xmldom`, `hono`, `morgan`, `stream-json`, `csv-parse`), ninguna entra al bundle, así que el veredicto de `B1` se sostiene. `--force` sigue siendo la trampa.

---

## Heredado de la revisión Fable (julio 2026) — CERRADO

- **BUG-10 (profecías, "Siguiente" no reseteaba el scroll) — ✅ CERRADO.** El charter
  §3 lo listaba como semilla abierta; ese dato estaba obsoleto. Verificado el
  2026-09-03: `app/features/prophecies/index.tsx:297-299` tiene un
  `useEffect(() => scrollRef.current?.scrollTo({y: 0, animated: false}), [phase])` con
  un comentario que cita explícitamente "QA BUG-10". Arreglado en `b17ec99`
  ("fix: prophecies back-nav returns to hub first, plus scroll-reset on step change"),
  confirmado como ancestro de `main`. El arreglo cubre más que el repro original
  (Anterior/Siguiente, salto desde el índice, tarjeta "hoy", auto-avance narrado).
- **BUG-1 … BUG-9, BUG-11, BUG-12 — reportados como cerrados** en las tandas A–E del
  mismo día (2026-07-14/15). **No re-verificados en vivo** en esta revisión; si el
  Modo C toca su área, vale una comprobación de paso.
