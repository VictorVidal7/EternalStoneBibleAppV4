# Historial — `INDEX.md`: la frontera de cada sesión, hasta la 142

> Movido tal cual desde `INDEX.md` en la sesión 143 (2026-11-12). **No rige: es registro.** Lo que rige está en
> `CONTINUAR.md`, `REGLAS.md`, `RECETAS.md` y `ESTADO.tsv`.

> **Frontera actual (sesión 142, 2026-11-12): los hallazgos viejos, conciliados; solo docs.** `ESTADO.tsv` trae el
> estado de los 573: **274 abiertos (ningún P0, 20 P1, 92 P2, 161 P3 y el aviso `R9-1`)**, 2 sin verificar, 285
> arreglados y 12 aceptados. De los abiertos, 113 son de `R9-1`..`R9-409` (los 20 P1; cuatro de dinero,
> `R9-16`..`R9-19`) y estaban fuera de las tandas. Lo siguiente: la 143, solo docs para adelgazar
> (`_scratch/S143-PROMPT.md`); después, los arreglos (`_scratch/S14X-PROMPT-arreglos.md`). Detalle:
> `detail/S142-conciliacion.md`.
>
> **Antes, la frontera de la 141: la fase de ARREGLOS, con Fable 5.2 como modelo principal (decisión de Victor del
> 2026-11-11, `CONTINUAR.md` §7). La 141 revisó el diff de la 140 (los tres P1), con emulador, jest y lectura: los tres arreglos
> se sostienen en lo que arreglan (`R9-424` y `R9-425`, verificados EN VIVO con su control), y salieron cuatro
> hallazgos nuevos, todos P3: `R9-570` (una REGRESIÓN del arreglo de `R9-424`: con el pack elegido ausente, cada
> frío duplica los recordatorios del versículo del día), `R9-571` (la ✕ del reproductor no lo pliega: el estado roto
> de `R9-427` no se alcanza en vivo, ni antes ni después del arreglo), `R9-572` (la prueba de `R9-427` usa un
> `hidePlayer` simulado) y `R9-573` («al final del libro» sobre una lista no vence). `R9-569` quedó refutado en su
> consecuencia. No hay ningún P0 ni P1 abierto de `R9-410` en adelante (corregido en la 142: hay 20 P1 viejos
> abiertos); hay 573 hallazgos. La 141 está mergeada y pusheada (`a0147da0`). Los arreglos de lo que encontró la 141
> y la tanda 2 de P2 no fueron la 142 (corregido en la 142): van después de la 143
> (`_scratch/S14X-PROMPT-arreglos.md`); después, las demás tandas de `CONTINUAR.md` §4 y
> los P3. Al terminar la fase: Opus 5.5 principal con Fable de asesor, y las filas C P1 que faltan (`C17`, `C23`,
> con `_scratch/POSTARREGLOS-PROMPT-C17-C23.md`). El Modo C P0 sigue hecho salvo lo que espera una cuenta de Google
> de PRUEBA (`C26a`, `C54`, `C55`, el suelo de `C20a`, que sigue EN CURSO, y «Borrar cuenta» de `C27a`).** Detalle:
> `detail/S141-revision-del-diff-s140.md`. Antes, la 140 hizo la tanda 1, los tres P1 abiertos: `R9-424`, `R9-425`
> y `R9-427` ✅ ARREGLADOS (`7d4a511f`, `a6a0ef13`, `e8700067`), cada uno con su prueba vista FALLAR sin el arreglo;
> `R9-569` nuevo (P3, por lectura); mergeada y pusheada (`main` = `origin/main` = `177029af`, CI verde en el log, run
> `43070499798`, 377/4709). Detalle: `detail/S140-arreglos-p1.md`. Antes, la frontera eran las filas C P1 de datos
> y núcleo, por la mitad (quedan `C17` y `C23`). La 139 (sin agentes, en un chat nuevo) cerró `C42b` (🐛): `R9-564`, `R9-565`; `C43b` (🐛): `R9-566`, `R9-567`;
> `C20b` (🐛): `R9-568` P2 (los buscadores de libros no encuentran 17 libros escritos sin tilde), y «1 capítulos»
> suma a `R9-524`; `C7` (✅). Ninguno P0. Antes, la frontera era el Modo C P0. La 138 (3 agentes a pedido de Victor,
> en un chat nuevo) cerró `C27a` (🐛): `R9-558` P2, `R9-559`; `C42a` (🐛): `R9-561` P2; `C43a` (🐛): `R9-562` P2,
> `R9-563`; y el control de toasts de `C26b` (🐛, pasa a P2): `R9-560`. Ninguno P0, salvo lo que Victor decida sobre
> `R9-562` (P2 propuesto). La 137 (3 agentes, cortada por el
> límite) cerró `C1a` (✅) y `C26b` (🐛): `R9-557`; `R9-556` en `C20a`. Antes, la frontera era: las filas del Modo A y
> del Modo B TERMINADAS (la 136 cerró `B6`–`B10`: `R9-550`..`R9-555`, todos P3, ninguno P0). La 136 (sin agentes, en un chat nuevo) cerró `B6` (🐛), `B7` (✅), `B8` (🐛), `B9` (🐛) y `B10` (🐛). La 135 (con 13
> agentes a pedido de Victor, en un chat nuevo) cerró `A45` (🐛): `R9-536`..`R9-543`, y `A46` (🐛): `R9-544`..`R9-548`;
> de paso, `R9-549` (`A34`); todos P3, ninguno P0. La 134 (sin agentes, en un chat nuevo) cerró `A43` (🐛): `R9-531`, `R9-532`, y `A44` (🐛):
> `R9-533`..`R9-535`; un P2, ninguno P0. La 133 fue el segundo piloto de re-revisión con Fable 5.2, sobre `B4`
> (las reglas de Firestore y Storage): las reglas vivas no cambiaron desde septiembre, ningún path abierto, un
> nuevo, `R9-530` (P3), ninguno P0; con el criterio fijado (un nuevo P2 o mayor), no se cumple. La 132 fue el primer piloto, sobre `A7` (a pedido de
> Victor): un nuevo, `R9-529` (P3 bajo), ninguno P0. La 131 (sin agentes, en el mismo chat que la 130) cerró `A41` (🐛):
> `R9-527`, y `A42` (🐛): `R9-528`; P3, ninguno P0. La 130 (sin agentes, en un chat nuevo) cerró `A39` (🐛, con
> `R9-524`) y `A40` (🐛): `R9-525`, `R9-526`; P3, ninguno P0. La 129 (con 8 agentes
> a pedido de Victor, en el mismo chat que la 128) cerró `A37` (🐛): `R9-506`..`R9-514`, y `A38` (🐛):
> `R9-515`..`R9-517`, y dejó `A39` 🐛 EN CURSO: `R9-518`..`R9-523`; siete P2, ninguno P0. La 128 (con 8 agentes a pedido de Victor, en un chat nuevo) cerró `A35` (🐛):
> `R9-489`..`R9-495`, y `A36` (🐛): `R9-496`..`R9-505`; tres P2, ninguno P0. La 127 (con 6 agentes a pedido de Victor, en un chat nuevo) cerró `A32` (🐛): `R9-476`..`R9-485`, y `A34` (🐛): `R9-486`..`R9-488`; dos P2, ninguno P0. La 126 (con 2 agentes a pedido de Victor, en el mismo
> chat que la 125) dejó `A32` 🐛 EN CURSO (`R9-473`, `R9-474`) y cerró `A33` (🐛): `R9-475`, ninguno P0. La 125 (con 8 agentes a pedido de Victor) cerró `A30` y `A31` (🐛): `R9-467`..`R9-472`, ninguno
> P0; con ellas se terminan las filas P1 del Modo A. La 124 (con 3 agentes a pedido de Victor, en el mismo chat que la 123) cerró `A28` y `A29` (🐛):
> `R9-462`..`R9-466`, ninguno P0. La 123 (sin agentes) cerró `A26` y `A27` (🐛): `R9-457`..`R9-461`, ninguno P0. La 122 (con 3 agentes a pedido de Victor, en el mismo chat que la 121) cerró `A24` y `A25` (🐛):
> `R9-449`..`R9-456`, ninguno P0. La 121
> (con 3 agentes a pedido de Victor) cerró `A22` y `A23` (🐛): `R9-442`..`R9-448`, P3, ninguno P0. La
> 120 (con 2 agentes a pedido de Victor) cerró `A20` (🐛): `R9-439`..`R9-441`, ninguno P0, y `A21` (✅). La
> 119 cerró `A19` (🐛): `R9-437`, `R9-438`, ninguno P0. La 118
> (sin agentes) cerró `A17` y `A18` (🐛): `R9-432`..`R9-436`, ninguno P0. La 117
> (sin agentes) cerró `A14`, `A15` y `A16` (🐛): `R9-427`..`R9-431`, ninguno P0. La 116 hizo `A13` (🐛):
> `R9-423`..`R9-426`, ninguno P0. El Modo
> C P0 de dinero y gating se midió en la 115 (`R9-418`..`R9-422`, ninguno P0; `C55` y `C54` quedan «sin
> medir» por decisión de Victor). El Modo A P0 quedó cerrado en la 114 con `A12` (`R9-410`..`R9-417`). Sesión 2 cerró
> todo el Modo B P0. Sesión 3 cerró 6 filas del Modo A P0 (`R9-9`..`R9-32`, 9 P0). Sesiones
> 4 y 5 cerraron `A4` (`R9-33`..`R9-39`, 6 P0) y registraron 4 reportes de campo
> (`R9-40`..`R9-43`). **Sesión 6 (2026-09-14) cerró `A8`, `A9`, `A10` y `A11` con
> 21 hallazgos nuevos (`R9-44`..`R9-64`), 6 de ellos P0** — y dejó `A12` empezada a
> propósito.
>
> **Sesión 7 (2026-09-14) no revisó: ARREGLÓ.** Cerró en código los **7 P0 de pérdida
> irreversible de datos** (`R9-27`, `R9-28`, `R9-44`, `R9-45`, `R9-47`, `R9-49`, `R9-50`) en
> `fix/review-p0-perdida-datos` (`7f8e666`), cada uno con prueba de regresión y con las tres
> compuertas verdes. Entre ellos, **la raíz común de `{merge:true}`**: `withoutUndefined`
> pasó a `nullifyUndefined`, así que un campo opcional por fin se puede desasignar por sync.
>
> **Sesión 8 (2026-09-15) revisó el diff de la 7, lo mergeó a `main`, y ARREGLÓ 4 P0 más**
> (`R9-46` + el bloque entero de mezcla entre cuentas: `R9-22`, `R9-23`, `R9-48`).
> **Sesión 9 (2026-09-15) revisó ESE diff, encontró 2 defectos reales, los arregló y mergeó**
> — y después cerró `R9-33`, `R9-34` y `R9-35`.
> **Sesión 10 (2026-09-15) revisó el diff de la 9 y encontró que la prueba de `R9-34` no
> discriminaba** (el backoff de `R9-33`, del mismo commit, hacía que la carrera no ocurriera);
> la reescribió, remató un hueco de `stop()`, mergeó a `main` — y después cerró **los 2 P0 de
> dinero, `R9-9` y `R9-10`, juntos**, porque el segundo anulaba el arreglo del primero.
> **Todo mergeado y PUSHEADO**; no queda rama de arreglos pendiente.
> **Sesión 11 (2026-09-15) cerró `R9-11`** —el gemelo de `R9-34` en la rama de ÉXITO de
> `flush()`, o sea la común, cuyo vecino se tragaba una LÁPIDA— **y `R9-65`**, y saldó la
> deuda más vieja: `R9-28` por fin tiene prueba, así que **no queda ningún arreglo sin una**.
> **Todo mergeado y PUSHEADO**; no queda rama de arreglos pendiente.
> **Sesión 12 (2026-09-15) cerró el bloque WEB: `R9-13`, `R9-15` y `R9-14`.** El orden fue
> deliberado — primero `R9-15`, el test que enmascaraba, para **ver el crash de producción
> ponerse rojo en la compuerta**, y solo después `R9-13`. De `R9-14` se tomó la opción
> estructural (un `ErrorBoundary` **por ruta** en los dos niveles del árbol web), que acota
> la clase entera en vez de las 7 rutas contadas; lo que queda de esa entrada es decisión de
> producto, no código. Además se remató la clase de `R9-13` con una compuerta de **paridad
> de superficie sobre los 14 pares** `.web`/nativo. **Y se cerró la duda que el detalle de
> `A6` dejaba abierta desde la sesión 3: verificado en un navegador de verdad**, sobre el
> bundle real de `expo export --platform web`.
>
> **Sesión 13 (2026-09-15) revisó el diff de la 12 y encontró 6 defectos, ninguno P0**
> (`R9-66`, `R9-67` en P1; `R9-68`, `R9-69`, `R9-70`, `R9-71` en P2). Los tres arreglos de la 12 se
> sostienen y sus pruebas discriminan — verificado revirtiendo cada uno. **Los cinco defectos
> están en los BORDES de esos arreglos**, y los dos P1 comparten forma: _una verificación cuyo
> cuerpo entero es un bucle pasa cuando no hay nada que recorrer, imprimiendo un mensaje de
> éxito._ `verifyRedLetterAlignment` decía «ALL slices non-blank and in-range» sobre CERO
> spans —y eso es lo único del programa que toca **datos ya publicados**— y la compuerta de
> paridad comparaba contra un conjunto vacío, dejando pasar `R9-13` al pie de la letra en
> forma `export {x}` con la suite en verde 30/30.
>
> **Segunda mitad de la sesión 12: las dos cosas que habían quedado «dichas, no arregladas»
> se arreglaron de verdad.** (1) La letra roja en web ya no es solo en inglés: el build emite
> un pack **por versión**, el módulo web carga el que toca, y el lector pregunta
> `hasRedLetterData` en vez de comparar contra `'WEB'` a mano. **Queda un paso manual de
> Victor: subir `rvr1960-red-letter.json` al repo de Pages.** (2) Las 7 rutas de `R9-14`
> siguen sin funcionar en web —eso es de diseño— pero ya lo **dicen**, con «Esta sección no
> está en la versión web» y un botón que sale, en vez de un «Algo salió mal» cuyo
> «Reintentar» no puede funcionar. Las dos verificadas en navegador.
>
> **Sesión 14 (2026-09-15) revisó el diff de la 13 y encontró 5 defectos, ninguno P0**
> (`R9-72`, `R9-73` en P1; `R9-74`, `R9-75`, `R9-76` en P2). **Los 6 arreglos de la 13 se
> sostienen y sus 6 pruebas discriminan**, y los cuatro sha256 de los packs siguen idénticos al
> manifiesto publicado. Los 5 defectos están otra vez en las **compuertas**, y los dos P1
> repiten la forma de `R9-66`: un bucle que recorre la lista NUEVA no ve lo que falta de la
> vieja. Los otros tres son la misma familia: **un discriminador que depende de lo que decida
> el propio código vigilado, y un silencio que significa a la vez «verificado» y «no miré»**.
> Los 5 arreglados en la misma sesión.
>
> **Sesión 15 (2026-09-15) revisó el diff de la 14 y encontró 5 defectos, ninguno P0**
> (`R9-77`, `R9-78` en P1; `R9-79`, `R9-80`, `R9-81` en P2). **Los 3 arreglos de la 14 se
> sostienen y sus pruebas discriminan**, verificado revirtiendo cada uno **por separado** (4,
> 6 y 3 rojas, controles verdes en los tres), y **ninguno desarma la prueba del otro** — que
> era el riesgo concreto de un commit con tres arreglos dentro. Los cuatro sha256 siguen
> idénticos al manifiesto **y a lo que hoy sirve GitHub Pages**. **Tercera sesión seguida con
> todos los defectos en las COMPUERTAS**, y ya con una regularidad que se puede nombrar: **una
> compuerta escrita para cerrar un caso cierra ese caso y deja abierto el vecino que la
> motivó**. Los 5 arreglados en la misma sesión.
>
> **Sesión 16 (2026-09-16) revisó el diff de la 15 y encontró 5 defectos, ninguno P0**
> (`R9-82`, `R9-83` en P1; `R9-84`, `R9-85`, `R9-86` en P2). **Los 5 arreglos de la 15 se
> sostienen** (7, 3, 1, **0** y 2 rojas al revertir cada uno por separado) — y ese **0** es
> `R9-86`: el arreglo de `R9-80` funciona, pero su prueba **reimplementa el escáner en vez de
> llamarlo**, así que no protege nada. **El hallazgo que manda no estaba en el diff:** `main`
> llevaba un día en **ROJO en CI** porque `node:sqlite` no existe en Node 20 y `ci.yml` lo
> fijaba, así que la compuerta que vigila los datos publicados **nunca se ejecutó en CI** —
> y la rama de la 15 añadía una segunda suite muerta (55 pruebas). Cuarta sesión seguida con
> los defectos en las COMPUERTAS, y una forma nueva: **una compuerta que nunca llegó a
> EJECUTARSE se ve igual que una que pasó**. Los 5 arreglados en la misma sesión, **mergeados y
> pusheados** (`531ffef`), y **CI verde verificado en el log del run** (Node v24.20.0,
> `buildWebPacks.test.js` PASS, 363/4263, cero «failed to run»).
>
> **Sesión 18 (2026-09-16) revisó el diff de la 17 y encontró 5 defectos, ninguno P0**
> (`R9-97`, `R9-98`, `R9-99` en P1; `R9-100`, `R9-101` en P2). **Los 10 arreglos de la 17 se
> sostienen en su mecanismo.** Sexta sesión seguida con los defectos en las COMPUERTAS, y **las
> tres compuertas nuevas enteras de la 17 dejaron abierto el vecino que las motivó**. Lo que más
> vale: la comprobación que `R9-93` puso en lugar de una afirmación mira en **una sola
> dirección**, así que sigue diciendo «_it IS coherent - one run, whole_» sobre un directorio
> **vacío** (`R9-97`); y el escáner de workflows decide qué es un job por su **FORMA**, así que
> un cuarto job sin ningún `setup-node` pasa **15/15** con sólo llevar un comentario en su
> cabecera (`R9-99`) — `R9-89` reabierto por su propio arreglo. Tres formas nuevas: **una
> comprobación que reemplaza una afirmación tiene que comprobar la afirmación ENTERA**,
> **decidir por la FORMA de una línea es decidir por un estilo** y **una compuerta que no casa
> con nada hoy no tiene discriminador**. Los 5 arreglados en la misma sesión, **mergeados
> y pusheados** (`2b65a12`).
>
> **Sesión 17 (2026-09-16) revisó el diff de la 16 y encontró 10 defectos, ninguno P0**
> (`R9-87`, `R9-88`, `R9-89` en P1; `R9-90`..`R9-96` en P2). **Los 5 arreglos de la 16 se
> sostienen.** Quinta sesión seguida con los defectos en las COMPUERTAS, y **cuatro de los cinco
> arreglos dejaron abierto justo el vecino que los motivó**. Lo que más vale: con la escritura
> del manifiesto desactivada del todo **el repo ENTERO sale verde** — el `beforeEach` que
> `R9-83` añadió RESPONDÍA la pregunta que la única aserción que la fijaba hacía (`R9-87`); y el
> piso `">=22"` es **falso** (`node:sqlite` se desbanderó en **22.13.0**) mientras la compuerta
> **prohibía** escribir el verdadero (`R9-88`). Dos formas nuevas: **el piso de una compuerta
> suele ser el número de HOY, así que exige ese número en vez de cobertura**, y **un fixture
> añadido para habilitar una prueba puede RESPONDER la pregunta que otra hacía**. Los 10
> arreglados en la misma sesión.
>
> **Sesión 19 (2026-09-22): la primera con Opus 5.5, y solo de REVISIÓN.** No se arregló nada.
>
> **Qué revisó:**
>
> - El diff de la 18.
> - Los diffs de las sesiones **10 y 11**, que **nunca se habían revisado**. La 11 y la 12 no
>   revisaron ningún diff, así que «décima sesión seguida» era falso. Son el diff del dinero
>   (`R9-9`/`R9-10`) y el de la cola y el cursor (`R9-11`/`R9-65`).
>
> **22 hallazgos (`R9-102`..`R9-123`):** 2 P0, 6 P1, 10 P2 y 4 entradas P3 agrupadas.
>
> **Los dos P0 están en código que el Modo A ya había pasado,** y los dos tienen el efecto de
> `R9-11`: la edición se ve en pantalla y nunca sube.
>
> - **Editar un favorito** (`R9-102`): un efecto dentro de un actualizador de `setState`.
> - **Una edición durante una bajada en vuelo** (`R9-103`): un contador de supresión global.
>
> **`R9-104` es candidato a P0.** El flush no vuelve a mirar la cuenta después de cada `await` y
> puede escribir datos de Ana en `users/<beto>`. Falta medir el SDK real en Modo C.
>
> **Fuera del repo:** el directorio de publicación por defecto tenía el `rvr1960.sqlite` VIEJO,
> con **texto de chatbot dentro de 2 Reyes 22:9**, junto al manifiesto que pina el bueno, y el
> lector web no verifica el sha256 (`R9-109`). Se movió a cuarentena con permiso de Victor.
>
> **Pedido de Victor:** todo lo revisado antes de esta sesión se hizo con **Opus 5**, y una sesión
> posterior tiene que re-verificarlo con **Opus 5.5**.
>
> El checkpoint (`ac9c7fd`, solo docs) está **mergeado en fast-forward y pusheado**.
>
> **Quedan 5 P0 abiertos** (`R9-36`, `R9-38`, `R9-39`, `R9-102`, `R9-103`) — **ninguno bloquea el
> deploy web**. Hallazgos: **123**. **El conteo venía mal desde la sesión 7** — ver la nota al principio de
> la sección P0 de `BUGS.md`.
>
> **Siguiente (desde la sesión 19):**
>
> 1. **Arreglar los dos P0 nuevos** (`R9-102`, `R9-103`), que son chicos.
> 2. **Medir `R9-104` en Modo C.** Si es alcanzable, pasa a P0.
> 3. **La cadena de publicación** (`R9-108`, `R9-109`).
> 4. **El doble check con Opus 5.5** que pidió Victor.
>
> Siguen pendientes, además, `A12` (3 hilos ya abiertos en su detalle, con lo que queda cerrado el
> bloque P0 del Modo A), `R9-36`/`R9-38`/`R9-39` y los 4 reportes de campo (`R9-40`..`R9-43`).
> Orden completo en `CONTINUAR.md`.
>
> **Sesión 20 (2026-09-22): ARREGLOS, con Opus 5.5.** Cerró `R9-102` y `R9-103` (los dos P0 de
> la 19), `R9-104` y `R9-105`, uno por commit, en `fix/review-s19-p0-sync-favoritos`. Cada
> prueba se vio fallar primero, y cada PIEZA de cada arreglo se revirtió por separado. Compuertas
> verdes: 364 suites / 4299 pruebas.
>
> **Lo que más vale:** la propuesta de arreglo de `R9-104` que traía el ledger («sirve para las
> dos ramas») era **falsa**, y está medido. Mirar la cuenta después del `await` no sirve cuando el
> `await` no vuelve, y el SDK de JS no lo devuelve nunca. Hizo falta que `stop()` suelte el
> candado del flush. (**⚠️ Sesión 23:** «nunca» mientras haya otra cuenta; si la anterior vuelve
> en el mismo proceso, la promesa se resuelve. Ver `R9-156.2`.)
>
> **Mergeada en fast-forward y pusheada** con el OK de Victor. **Quedan 3 P0 abiertos** (`R9-36`,
> `R9-38`, `R9-39`). Detalle: `detail/S20-arreglos-p0-sync-favoritos.md`.
>
> **`R9-104`, medido en el SDK nativo** (Modo C, con el OK de Victor, en emulador): la escritura
> de la cuenta anterior queda pendiente (mientras esa cuenta no vuelva: `R9-156.2`) y no llega al servidor. O sea, «no
> sincroniza hasta reiniciar» (P1), no mezcla. La propuesta del ledger no habría arreglado ese
> caso. **CI del merge verificado en el log** (run `35793874042`, 364/4299).
>
> **Siguiente (elegido por Victor):** el doble check con Opus 5.5 de lo revisado hasta la 18 (opción
> (b) de `CONTINUAR.md`). Después, revisar el diff de la 20 y la cadena de publicación (`R9-108`,
> `R9-109`).
>
> **Sesión 21 (2026-09-22): el doble check con Opus 5.5, puntos 1 y 2, solo de REVISIÓN.** Dos
> agentes en worktrees aislados. Uno revisó los 18 P0 arreglados antes de la 19, pieza por pieza,
> y el otro releyó las filas cerradas del Modo A (`A1`..`A11`) y del Modo B (`B1`..`B5`). Todo lo
> que subió a P0 o P1 lo verificó a mano el orquestador. El chat se cortó por el límite de uso a
> mitad de los agentes, y se relanzaron en uno nuevo.
>
> **19 hallazgos (`R9-124`..`R9-142`):** 2 P0, 6 P1, 10 P2 y 1 P3.
>
> - **Los 18 arreglos se sostienen en `HEAD`, pero muchas de sus piezas no las vigila nada.** Los
>   reverts de `R9-130` y las dos mitades de `R9-131`, aplicados juntos, dejan la suite entera en
>   **364/364, 4299/4299**, y cualquiera de las tres reabre un P0.
> - **Dos P0 nuevos, otra vez en código que el Modo A ya había pasado:** `R9-124` (un `removed` de
>   la query filtrada se trata como borrado, así que restaurar un respaldo borra en local lo
>   restaurado) y `R9-125` (la rama de `signInWithGoogle` sin anónimo no mira el dueño previo, o
>   sea `R9-23` por la tercera rama).
> - **Tres afirmaciones corregidas:** la frase de `R9-23` «el mismo dueño volviendo no se
>   interroga» es falsa en la app real; jest cubre 1 de las 9 piezas de `R9-47`; y `B1` tiene hoy
>   14 vulnerabilidades (3 high), no 8.
>
> No se commiteó nada en la 21. Su checkpoint lo escribió la 22 en `docs/review-s21-doble-check`.
> **Quedan 5 P0 abiertos** (`R9-36`, `R9-38`, `R9-39`, `R9-124`, `R9-125`). Hallazgos: **142**.
> Detalle: `detail/S21-doble-check.md`.
>
> **Sesión 22 (2026-09-23): el checkpoint de la 21, y los puntos 3 y 4 del doble check. Con eso
> el doble check con Opus 5.5 queda TERMINADO.** Solo de revisión. Victor pidió 5 agentes a mitad
> de sesión, y los 5 se cortaron a la vez por el límite de uso y se retomaron.
>
> - **Punto 3:** las 14 entradas `R9-51`..`R9-64` siguen siendo ciertas en `HEAD`. `R9-53` y
>   `R9-55` bajan de P1 a P2, y `R9-63` de P2 a P3. El texto se corrigió dentro de cada entrada;
>   por ejemplo, el remedio que proponía `R9-58` no sirve en el teléfono.
> - **Punto 4:** de 179 afirmaciones de `detail/S8`..`S18`, se verificaron 171 contra el mundo.
>   Ninguna frase falsa escondía un P0 ni un P1, y la cadena de datos publicados se sostiene otra
>   vez. Las frases falsas quedaron corregidas al final de cada `detail/S*`.
> - **10 hallazgos, `R9-143`..`R9-152`: 1 P1, 1 P2 y 8 P3.** `R9-143` (P1): «Banco de
>   ilustraciones» y «Modo púlpito» guardan el sermón con las dos trampas que el arreglo de
>   `R9-47` le quitó al `blur`, así que un toque justo después de cambiar de pasaje pisa el
>   sermón del pasaje nuevo.
>
> Siguen **5 P0 abiertos**. Hallazgos: **152**. Con el OK de Victor, el checkpoint de la 21 y el
> registro de la 22 van juntos en `docs/review-s21-doble-check`, para mergear en fast-forward.
> Detalle: `detail/S22-doble-check-puntos-3-4.md`.
>
> **Sesión 23 (2026-09-23): revisión del diff de la 20 (`25128b3..ca2cd71`), la opción (a).** Solo
> de revisión, con 3 agentes en worktrees aislados. Ninguno se cortó. El orquestador verificó con
> sonda propia todo lo que subió a P1.
>
> - **Los cuatro arreglos de la 20 se sostienen, y dentro de su diff no hay ningún P0 ni P1.** La
>   matriz de reverts de `R9-104` es cierta fila por fila, y 25 de las 30 afirmaciones del ledger
>   sobre la 20 son ciertas contra el mundo.
> - **El P1 nuevo es el vecino de `R9-104`:** `handleSnapshot` no tiene sesión. Un conflicto de
>   Ana registrado después del `stop()` pasa a la sesión de Beto, y resolverlo copia la versión
>   de la nube de Ana a la de Beto (`R9-153`). Es P1 y no P0 (decidido con Victor) porque hacen
>   falta un conflicto real en vuelo, otra cuenta en el mismo proceso y resolverlo a mano. El
>   mismo agujero sube `R9-122.4` de P3 a P2.
> - **4 hallazgos, `R9-153`..`R9-156`: 1 P1 y 3 P3.**
>
> Siguen **5 P0 abiertos**. Hallazgos: **156**. El checkpoint va en `docs/review-s23-diff-s20`,
> sin mergear sin el OK de Victor. **Siguiente, la 24: ARREGLOS** (`R9-125`+`R9-130`, `R9-143`,
> `R9-124` medido antes en Modo C, y `R9-153`). Detalle: `detail/S23-revision-del-diff-s20.md`.
>
> **Sesión 24 (2026-09-23/24): ARREGLOS, casi todos EN LA NUBE.** Con el crédito de sesiones en la
> nube, 6 sesiones de Claude Code hicieron los arreglos en ramas propias, en tres tandas. El
> orquestador revisó cada rama en la máquina de Victor, pieza por pieza, las apiló y pidió el OK.
>
> - **11 hallazgos cerrados:** `R9-125` (P0), `R9-130`, `R9-143`, `R9-153`, `R9-122.4`, `R9-154`,
>   `R9-109` (con la opción (b) de Victor), `R9-108`, `R9-36` (P0), `R9-39` (P0) y `R9-106`.
> - **El hallazgo de la sesión es `NODE_ENV` (`R9-157`, arreglado):** Victor exporta
>   `NODE_ENV=development`, así que las pruebas nuevas daban verde en la nube y en CI y rojo en su
>   máquina. La vieja creencia de que «el renderer desmonta la Mesa» era esto.
> - **3 hallazgos nuevos:** `R9-157`, `R9-158` (decisión de Victor) y `R9-159`.
>
> `main` = `9c425a8`, con el CI verde en el log (run `35965550736`, 366/4366). **Quedan 2 P0
> abiertos** (`R9-38`, `R9-124`). Hallazgos: **159**. El checkpoint va en
> `docs/review-s24-checkpoint`. **Siguiente, la 25:** revisar el diff de la 24; en la 26, `R9-124`
> en Modo C. Detalle: `detail/S24-arreglos-en-la-nube.md`.
>
> **Sesión 25 (2026-09-24): revisión del diff de la 24, hecha EN LA NUBE.** Dos sesiones de Claude
> Code en la nube (el motor; identidad, Mesa, web y jest) entregaron su informe en ramas que no se
> mergean. El orquestador verificó en la máquina de Victor, con sonda propia, todo lo que subió a P0
> o P1.
>
> - **2 P0 nuevos:**
>   - `R9-160`, una regresión del arreglo de `R9-36`: con un conflicto pendiente, «conservar lo
>     mío» sube lo que el otro teléfono escribió después;
>   - `R9-166`: si la app muere con la pregunta del link abierta, el arranque en frío sube el
>     almacén de Ana a la cuenta de Beto.
> - **1 P1 nuevo:** `R9-161`.
> - **14 hallazgos nuevos en total** (`R9-160`..`R9-173`). Quedaron medidas la puerta de `R9-127` y
>   `R9-158`.
> - Las afirmaciones del ledger sobre la 24 dan 27 ciertas, 3 a medias y ninguna falsa.
>
> **Quedan 4 P0 abiertos** (`R9-38`, `R9-124`, `R9-160`, `R9-166`). Hallazgos: **173**. El
> checkpoint va en `docs/review-s25-diff-s24`. **Siguiente:** los arreglos de `R9-160`+`R9-161`
> (sesión A) y de `R9-166` (sesión B) en la nube, revisados en local; después, `R9-124` en Modo C.
> Detalle: `detail/S25-revision-del-diff-s24.md`.
>
> **Sesión 25, segunda parte: los arreglos, HECHOS en la nube y revisados en local.**
>
> - `R9-160`, `R9-161`, `R9-162` y `R9-166` quedaron ✅: `main` = `cf7c715`, con el CI verde en el
>   log.
> - B preguntó ANTES del link, más simple que lo recomendado. A refresca «su versión» mientras el
>   conflicto espera.
> - Se agregó `R9-174` (P3, leído).
>
> **Quedan 2 P0 abiertos** (`R9-38`, `R9-124`). Hallazgos: **174**. **Siguiente, la 26:** `R9-124`
> en Modo C.
>
> **Sesión 26 (2026-09-28): `R9-124` medido en el SDK nativo y ARREGLADO, solo en la terminal.**
>
> - **Modo C, en el emulador y con el OK de Victor:** el `removed` llega por los tres caminos (el
>   propio teléfono online, offline, y el otro teléfono) con el doc todavía existente. Un borrado de
>   verdad llega IGUAL, con la versión vieja y `exists: true`: solo `getDoc` los distingue.
> - **El arreglo, `34de18f`:** ante un `removed`, `getDoc` fuera de la supresión. Si el doc existe,
>   pasa por el camino normal con sus datos de ahora; si no, se borra, salvo con un conflicto
>   retenido. El mock de `onSnapshot` emite `removed` en vez de filtrar.
> - 9 pruebas, 8 caen sin el arreglo. Las 8 piezas y las 9 guardas de sesión discriminan.
>   `npm run validate` da 367/4414.
> - `R9-164` queda abierto a medias: el arreglo cubre la salida en vivo, pero no la que ocurre con la
>   app cerrada.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **174**. Ramas `fix/review-s26-removed` y
> `docs/review-s26-removed`, sin mergear hasta el OK. **Siguiente, la 27:** revisar el diff de la
> 26, solo en la terminal. Detalle: `detail/S26-r9124-modo-c-y-arreglo.md`.
>
> **Sesión 27 (2026-09-28): revisión del diff de la 26, solo en la terminal y con 3 agentes en
> worktree.** Las ramas de la 26 ya estaban mergeadas: `main` = `origin/main` = `6f73f69`, con el CI
> verde en el log (run `36495790684`, 367/4414).
>
> - **La matriz entera, re-medida:** igual que en la 26. Pero G7 discrimina solo gracias al mock.
> - **7 hallazgos nuevos, `R9-175`..`R9-181`, ninguno P0:** 1 P2 (`R9-175`: lotes sin serializar
>   que pierden un cambio si uno se corta y otro adelantó el cursor) y 6 P3. `R9-176`..`R9-178` son
>   ventanas de la lectura del `removed`; `R9-179`..`R9-181` son pruebas y diseño, y el último quedó
>   decidido (la (b), por delegación de Victor).
> - **El arreglo de `R9-124` se sostiene**, también por el camino real de la cola.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **181**. Rama `docs/review-s27-diff-s26`, sin
> mergear hasta el OK. Detalle: `detail/S27-revision-del-diff-s26.md`.
>
> **Sesión 28 (2026-09-29): ARREGLOS de lo de la 27, solo en la terminal.** Hubo 3 agentes en
> worktree, a pedido de Victor, solo para medir diseños. `main` = `origin/main` = `f305fa2`, con el
> CI verde en el log (run `36510398166`, 367/4414).
>
> - **`R9-175`, `R9-176`, `R9-178`, `R9-179`, `R9-180` y `R9-181` ✅**, en 6 commits en
>   `fix/s28-sync-r9175-r9181`. `R9-177` sigue abierto: necesita el OK de Victor y Modo C.
> - **El mock de `onSnapshot` ahora es el del SDK:** entrega el eco propio, la reversión y la
>   re-entrega, y modela el hilo único de RNFB.
> - **3 hallazgos nuevos, `R9-182`..`R9-184`** (2 P2 y 1 P3), registrados sin arreglar.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **184**. Ramas `fix/s28-sync-r9175-r9181` y
> `docs/review-s28-fix-s27`, sin mergear hasta el OK. Detalle: `detail/S28-arreglos-de-la-27.md`.
>
> **Sesión 29 (2026-09-29): revisión del diff de la 28, solo en la terminal y sin agentes.** Las
> ramas de la 28 ya estaban mergeadas: `main` = `origin/main` = `e1c356c`, con el CI verde en el log
> (run `36606915072`, 367/4433).
>
> - **La matriz entera, re-medida:** igual que en la 28. Las pruebas ajustadas por el mock nuevo
>   siguen vigilando lo suyo.
> - **4 hallazgos nuevos, `R9-185`..`R9-188`, todos P3.** El principal: la guarda de `R9-176`
>   desarma a `R9-181` (corolario 4), medido junto con una hipótesis de arreglo.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **188**. Rama `docs/review-s29-diff-s28`, sin
> mergear hasta el OK. Detalle: `detail/S29-revision-del-diff-s28.md`.
>
> **Sesión 30 (2026-09-29): ARREGLOS de lo de la 29, solo en la terminal.** Las ramas de la 29 ya
> estaban mergeadas: `main` = `origin/main` = `678a4be`, con el CI verde en el log (run
> `36613268918`, 367/4433). A pedido de Victor, 3 agentes en worktree que solo midieron.
>
> - **9 hallazgos cerrados:** `R9-182`..`R9-188`, y `R9-190` y `R9-191`, que abrieron los propios
>   arreglos de la sesión y encontró un agente.
> - **4 hallazgos nuevos abiertos:** `R9-189`, `R9-192`, `R9-193` y `R9-194`. Dos (`R9-192` y
>   `R9-193`) tienen hipótesis medidas que cambian comportamiento: decisión de Victor.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **194**. Ramas `fix/s30-sync-r9185-r9188` y
> `docs/review-s30-fix-s29`: mergeadas y pusheadas con el OK de Victor (`main` = `ce05112`, CI verde
> en el log, run `36642503997`, 367/4451). Detalle: `detail/S30-arreglos-de-la-29.md`.
>
> **Sesión 31 (2026-09-30): REVISIÓN del diff de la 30, solo en la terminal, sin tocar código.** A
> pedido de Victor, 3 agentes en worktree que solo midieron; el orquestador re-midió cada pieza en su
> árbol.
>
> - **La matriz entera:** idéntica a la final de la 30.
> - **11 hallazgos nuevos, `R9-195`..`R9-205`:** 1 P2 (`R9-199`) y 10 P3; cuatro son el corolario 42
>   entre arreglos del mismo diff.
> - **Las decisiones de Victor sobre `R9-192` y `R9-193`, registradas;** sus hipótesis, medidas sobre
>   el código de hoy para que la 32 las integre.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **205**. Rama `docs/review-s31-diff-s30`: mergeada y
> pusheada con el OK de Victor (`main` = `b26ab8d`, CI verde en el log, run `36753796896`,
> 367/4451). Detalle: `detail/S31-revision-del-diff-s30.md`.
>
> **Sesión 32 (2026-09-30): ARREGLOS de lo de la 31, solo en la terminal y sin agentes.** Rama
> `fix/s32-r192-r193-y-s31` (13 commits, `b58a158`..`c1664a5`), un hallazgo por commit, cada prueba
> vista fallar con su pieza revertida.
>
> - **12 cerrados:** `R9-192` y `R9-193` (las decisiones), `R9-196`, `R9-195`, `R9-197`, `R9-199`
>   (P2), `R9-200`, `R9-204`, y la extensión de los sellos: `R9-189`, `R9-174` y `R9-194` (`+Y`,
>   aceptado por la delegación). Más `R9-206`, nuevo:
>   la matriz mostró que `remoteTs === heldAt` sobraba con los sellos, y se quitó.
> - **La medición cambió una decisión:** con los sellos, P3 de `R9-192` y el `fromRead` de la rama
>   retenida daban 0, y el segundo daba un fantasma con una copia propia leída: se quitaron los dos
>   (`R9-196`).
> - La matriz entera re-medida (`_scratch/S32-matriz.cjs.txt`) y `npm run validate` verde
>   (367/4483, sobre la punta; la matriz, tres veces).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **206**. Ramas `fix/s32-r192-r193-y-s31` y
> `docs/review-s32-fix-s31`: mergeadas y pusheadas con el OK de Victor (`main` = `06513ba`, CI
> verde en el log, run `36789350865`, 367/4483). Detalle: `detail/S32-arreglos-s31.md`.
>
> **Sesión 33 (2026-09-30): REVISIÓN del diff de la 32** (`b26ab8d..c1664a5`), solo en la terminal,
> sin agentes y sin tocar código.
>
> - **La matriz entera, re-medida sobre `06513ba`:** idéntica a la de `c1664a5` (109 de 109 piezas).
>   Ninguna guarda de la 32 da 0; las 33 pruebas nuevas caen todas con su pieza.
> - **4 hallazgos nuevos, `R9-207`..`R9-210`, todos P3.** Tres ya ocurrían antes de la 32 y son
>   vecinos de lo que cerró (`R9-207`, `R9-209`, `R9-210`); uno lo abrió la 32 dentro de `R9-193`
>   (`R9-208`).
> - **Las cuatro preguntas de la 32, medidas:** una es `R9-210`; las otras tres se descartan como
>   daño, con notas.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **210**. Rama `docs/review-s33-diff-s32`: mergeada y
> pusheada con el OK de Victor (`main` = `17788ae`, CI verde en el log, run `36808626771`,
> 367/4483). Detalle: `detail/S33-revision-del-diff-s32.md`.
>
> **Sesión 34 (2026-09-30/10-01): ARREGLOS de lo de la 33**, solo en la terminal, con 3 agentes en
> worktree que solo midieron (a pedido de Victor).
>
> - **4 cerrados**, un commit por hallazgo en `fix/s34-r207-r210` (`275b5df`..`682f852`):
>   `R9-209`, `R9-208`, `R9-207` (la decisión delegada: `isOwnCopy` lee `recentAcked`) y `R9-210`
>   (`getLocal` de favoritos lee SQLite; cierra también la parte de favoritos de `R9-133`).
> - **La matriz entera, sobre `682f852`:** 126 piezas (las 109 de la 33 y 17 nuevas). 96 dan lo mismo que en la 33, y las otras solo suben: ninguna prueba dejó de caer. Toda pieza nueva tumba al menos 1. Los ceros son los mismos de la 33 (`R104-7`, `R104-8` y `+P3`), y las 8 AUSENTES también; `+heldAt` pasó de 0 a 4.
> - **4 hallazgos nuevos, `R9-211`..`R9-214`, que ya existían:** 1 P2 (`R9-212`) y 3 P3.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **214**. Ramas `fix/s34-r207-r210` y
> `docs/review-s34-fix-s33`: mergeadas en fast-forward y pusheadas con el OK de Victor (`main` =
> `5d8fda2`, CI verde en el log, run `36814348204`, 368/4501). Detalle:
> `detail/S34-arreglos-s33.md`.
>
> **Sesión 35 (2026-09-30): REVISIÓN del diff de la 34** (`17788ae..682f852`), solo en la terminal,
> sin agentes y sin tocar código.
>
> - **5 hallazgos nuevos, `R9-215`..`R9-219`, todos P3**, y los cinco los abrió o los dejó a la
>   vista la 34 (medidos con su pieza revertida): dos huecos de la relectura de `R9-208`
>   (`R9-215`, `R9-218`), el «mía» de más de `R9-207` (`R9-216`), el coste aceptado de `R9-208`
>   (`R9-217`) y la premisa falsa del comentario de `R9-206` (`R9-219`, la razón de `+heldAt` 0 → 4).
> - `R9-210` y `R9-209`, sin nada nuevo; las 18 pruebas nuevas dicen lo que miden.
> - **La matriz entera y las piezas de `R9-210`, re-medidas:** ver el detalle, §7 y §4.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **219**. Rama `docs/review-s35-diff-s34`: mergeada
> y pusheada con el OK de Victor (`main` = `d15cd71`, CI verde en el log, run `36818493621`,
> 368/4501). Detalle: `detail/S35-revision-del-diff-s34.md`.
>
> **Sesión 36 (2026-10-01): ARREGLOS de lo de la 35**, en el mismo chat que la 35, solo en la terminal
> y sin agentes.
>
> - **5 cerrados**, un commit por hallazgo en `fix/s36-r215-r219` (`0970726`..`2bfbcf8`): `R9-219`
>   (el comentario), `R9-215`, `R9-218`, `R9-217` y `R9-216`. Cada prueba, vista fallar con su pieza
>   revertida; las piezas, re-medidas en el árbol combinado.
> - **La matriz entera:** ver `detail/S36-arreglos-s35.md`, §3.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **219** (ninguno nuevo). Ramas `fix/s36-r215-r219` y
> `docs/review-s36-fix-s35`: mergeadas y pusheadas con el OK de Victor (`main` = `657e993`, CI verde
> en el log, run `36826643083`, 368/4508). Detalle: `detail/S36-arreglos-s35.md`.
>
> **Sesión 37 (2026-10-01): REVISIÓN del diff de la 36** (`d15cd71..2bfbcf8`), solo en la terminal y
> sin tocar código, con 7 agentes en worktree que solo midieron (a pedido de Victor); el checkpoint,
> en un chat nuevo y sin agentes.
>
> - **14 hallazgos nuevos, `R9-220`..`R9-233`, todos P3:** el mock entrega el mismo objeto en las
>   re-entregas (`R9-221`, va primero en la 38); `noteEcho` toma por eco la primera copia con mi reloj
>   (`R9-222`); la copia propia re-entregada deja de ser mía (`R9-220`); dos ramas de `isOwnCopy` que
>   no miran el eco (`R9-223`, `R9-224`); la memoria de `recentEchoed` (`R9-225`); dos caminos más del
>   coste de `R9-208` (`R9-226`, `R9-227`); y textos y pruebas de la 36 (`R9-228`..`R9-233`).
> - **La matriz entera, re-medida:** 136 de 136 piezas iguales a la 36, control 0/232.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **233**. Rama `docs/review-s37-diff-s36`: mergeada
> y pusheada con el OK de Victor (`main` = `29c63c3`, CI verde en el log, run `36941443455`,
> 368/4508). Detalle: `detail/S37-revision-del-diff-s36.md`.
>
> **Sesión 38 (2026-10-01): ARREGLOS de lo de la 37**, solo en la terminal y sin agentes.
>
> - **Cerrados**, un commit por hallazgo en `fix/s38-arreglos-s37` (`0681c6e`..`0b84a7e`): `R9-221`
>   (el mock), `R9-220` y `R9-222` (`noteArrived`: el veredicto se toma al llegar la entrega, y una
>   copia ajena retira los relojes tomados), `R9-223`, `R9-224`, `R9-226` (la guarda por cuenta) y
>   los textos y pruebas `R9-228`, `R9-230`, `R9-231`, `R9-233`. `R9-225` y `R9-232`, por
>   construcción. `R9-227`: coste aceptado. `R9-229`: la mitad del `stop()`.
> - **3 nuevos:** `R9-234` (leído), `R9-235` (ya existía) y `R9-236` (de la matriz).
> - **La matriz entera:** 138 piezas, control 0/242; contra la de la 37, 95 de 143 iguales (las 5 `R216*` ya no existen, 7 nuevas, y el resto son pruebas nuevas que caen). Cuatro piezas viejas bajan a 0: `R9-236`.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **236**. Ramas `fix/s38-arreglos-s37` y
> `docs/review-s38-fix-s37`: mergeadas y pusheadas con el OK de Victor (`main` = `538409e`, CI verde
> en el log, run `36947870377`, 368/4518). Detalle: `detail/S38-arreglos-s37.md`.
>
> **Sesión 39 (2026-10-01): REVISIÓN del diff de la 38** (`29c63c3..0b84a7e`), solo en la terminal,
> sin agentes y sin tocar código.
>
> - **4 hallazgos nuevos, `R9-237`..`R9-240`, todos P3:** un respaldo del otro con una escritura mía
>   más vieja del mismo proceso pasa por «mía» (`R9-237`, lo abrió la 38); `R9-224` sigue abierto por
>   la lectura de un `removed` (`R9-238`) y por el respaldo directo (`R9-239`), los dos ya existían;
>   y la premisa de `noteArrived` depende de un orden de RNFirebase sin medir (`R9-240`, Modo C).
> - **Medido:** `R9-236` (a `Fsettle` le falta una prueba, `Fresolve` no decide, y `207fold` y
>   `207acum` juntas son la causa de `R9-237`) y la forma de la prueba que falta para `R9-229`.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **240**. Rama `docs/review-s39-diff-s38`: mergeada
> y pusheada con el OK de Victor (`main` = `4f1ce9a`, CI verde en el log, run `36960757105`,
> 368/4518). Detalle: `detail/S39-revision-del-diff-s38.md`.
>
> **Sesión 40 (2026-10-01): ARREGLOS de lo de la 39**, solo en la terminal y sin agentes.
>
> - **Cerrados**, un commit por hallazgo en `fix/s40-arreglos-s39` (`d57807b`..`e9d6e89`): `R9-237`
>   (`recentAcked` con solo el último ack), `R9-239` (`ownStamps` igual), `R9-238` (la lectura de un
>   `removed` retira como una copia ajena entregada, en `retireOwn`), `R9-236` (las pruebas de
>   `Fsettle` y de `Fresolve`, que NO era equivalente: se queda) y `R9-229` (la prueba del bucle).
> - **1 nuevo:** `R9-241` (el veredicto de la llegada depende de que `firestore.ts` lea `change.doc`
>   una sola vez; leído, sin daño hoy).
> - **La matriz entera:** 141 piezas, control 0/250; contra la de la 38, 114 de 144 iguales (las 3 de `R9-207`, quitadas a propósito; 6 nuevas; el resto, pruebas nuevas que caen). `Fsettle` y `Fresolve` pasan de 0 a 1, y ninguna pieza vieja baja a 0.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **241**. Ramas `fix/s40-arreglos-s39` y
> `docs/review-s40-fix-s39`: mergeadas y pusheadas con el OK de Victor (`main` = `48bee85`, CI verde
> en el log, run `36968376017`, 368/4526). Detalle: `detail/S40-arreglos-s39.md`.
>
> **Sesión 41 (2026-10-01/02): REVISIÓN del diff de la 40** (`4f1ce9a..e9d6e89`), solo en la terminal,
> sin agentes y sin tocar código.
>
> - **3 hallazgos nuevos, `R9-242`..`R9-244`, todos P3, que ya existían:** el `own` de una entrada que
>   reemplazó una subida en vuelo conserva relojes viejos y el respaldo del otro pasa por «mío» por la
>   cola (`R9-242`, hipótesis `H41own` medida, 250/250); `R9-238` sigue abierto con la cadena de lotes
>   ocupada, porque la retirada de la lectura corre al procesar (`R9-243`); y la prueba del eco tardío
>   de `R9-160` entrega copias que el SDK no levanta (`R9-244`).
> - **Medido:** `R9-234` (es también lo que queda de `R9-239`; `H239join` lo cierra y tumba solo la
>   prueba de `R9-218`). Las seis preguntas del prompt, respondidas en el detalle. Sin la matriz
>   entera: no hubo cambio de código.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **244**. Rama `docs/review-s41-diff-s40`: mergeada y
> pusheada con el OK de Victor (`main` = `2d8eb49`, CI verde en el log, run `36974151089`,
> 368/4526). Detalle: `detail/S41-revision-del-diff-s40.md`.
>
> **Sesión 42 (2026-10-02): ARREGLOS de lo de la 41**, solo en la terminal y sin agentes.
>
> - **Cerrados**, un commit por hallazgo en `fix/s42-arreglos-s41` (`7c8c0fa`..`1a77b78`): `R9-242`
>   (el ack de una subida reemplazada deja en la entrada viva solo su reloj), `R9-234` (la relectura
>   de la tabla de sellos no trae lo que la sesión ya decidió; es también lo que quedaba de
>   `R9-239`), `R9-244` (la prueba del eco tardío de `R9-160`, con el orden que da el SDK), `R9-243`
>   (un `removed` del otro retira al LLEGAR; la reversión de un rechazo, no) y el comentario de
>   `R9-229`.
> - **2 nuevos:** `R9-245` (mi propio respaldo rechazado por el servidor: tras reiniciar, «lo mío
>   contra lo mío»; medido, sin diagnosticar, ya existía) y `R9-246` (dos guardas sin una prueba que
>   las vea solas, una de ellas la retirada de la lectura de `R9-238`).
> - **La matriz entera:** 150 piezas, control 0/256 (las 8 ausentes de siempre); contra la de la 40, 120 de 150 iguales (9 nuevas, todas caen salvo `R234mem`; el resto, pruebas nuevas que caen). De las viejas, solo `S40-R238` baja a 0 (de 2): `R9-246`. Dos anclas viejas se rehicieron (`S34-208unionPoda` y `S40-R238`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **246**. Ramas `fix/s42-arreglos-s41` y
> `docs/review-s42-fix-s41`: mergeadas y pusheadas con el OK de Victor (`main` = `7139708`, CI verde
> en el log, run `37057170965`, 368/4532). Detalle: `detail/S42-arreglos-s41.md`.
>
> **Sesión 43 (2026-10-02): revisión del diff de la 42**, solo en la terminal, sin agentes y sin
> tocar código.
>
> - **4 nuevos, todos P3:** `R9-247` (la reversión de un rechazo que vuelve a una copia del otro bajo
>   el piso: con la cadena ocupada, el respaldo con mi último reloj pasa por «mío»), `R9-248` (la
>   reversión de un rechazo que DESCARTA la escritura le pasa la marca a mi propio respaldo) y
>   `R9-249` (lo que queda de `R9-242` tras un `stop()`), que ya existían; y `R9-250` (un comentario
>   de la 42, sin daño construible).
> - **`R9-245`, diagnosticado** (el reloj viejo del respaldo restaurado y la rama del conflicto
>   retenido), y **`R9-246`**, con un orden para cada guarda en que decide sola.
> - **Cuatro hipótesis medidas**, cada una con su sonda cerrada y la suite de sync en 256/256.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **250**. Rama `docs/review-s43-diff-s42`: mergeada y
> pusheada con el OK de Victor (`main` = `a731c23`, CI verde en el log, run `37063248540`,
> 368/4532). Detalle: `detail/S43-revision-del-diff-s42.md`.
>
> **Sesión 44 (2026-10-02): ARREGLOS de lo de la 43**, solo en la terminal y sin agentes.
>
> - **Cerrados**, un commit por hallazgo en `fix/s44-arreglos-s43` (`3e35415`..`c429604`):
>   `R9-246` (las dos pruebas; la de la lectura sola, con el `removed` sintético de `R9-186`),
>   `R9-245` (una copia mía no entra ni es conflicto con una escritura mía en la cola), `R9-247` (la
>   reversión que sale de la query retira al llegar si ningún reloj mío está bajo el piso; el piso
>   vive en el motor), `R9-248` (la reversión de un rechazo que descarta sigue siendo mía),
>   `R9-249` (el ack de la subida reemplazada vale también después de un `stop()`) y `R9-250` (solo
>   el comentario).
> - **1 nuevo:** `R9-251` (P3: la guarda `ownUnread` de `R9-247`, sin una prueba que la vea decidir).
> - **La matriz entera:** 157 piezas, control 0/264 (las 8 ausentes de siempre); contra la de la
>   42, 108 de 157 iguales. Las 7 nuevas caen salvo `R247unread` (`R9-251`). `S40-R238` y
>   `R234mem` suben de 0 a 1 (`R9-246`). Bajan `S32-W` (9→6) y `T-tomb` (3→2): esas pruebas
>   llegan con una escritura mía en la cola, que ahora toma `R9-245`, y con `R245` juntas vuelven
>   a caer. Ninguna vieja baja a 0. Cuatro anclas de la 42 se rehicieron.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **251**. Ramas `fix/s44-arreglos-s43` y
> `docs/review-s44-fix-s43`: mergeadas y pusheadas con el OK de Victor (`main` = `35529db`, CI
> verde en el log, run `37069485600`, 368/4540). Detalle: `detail/S44-arreglos-s43.md`.
>
> **Sesión 45 (2026-10-02): revisión del diff de la 44**, solo en la terminal, sin agentes y sin
> tocar código.
>
> - **`R9-251`: la guarda `ownUnread` decide, con daño** (`S45-1`): sin ella, tras reiniciar queda
>   «lo mio nuevo | mi respaldo». Se queda; `S45-1` pasa a ser su prueba.
> - **1 nuevo:** `R9-252` (P3, ya existía: una escritura mía que sube con el conflicto pendiente
>   lo cierra en el próximo reinicio, y «lo suyo» se pierde sin que nadie elija).
> - **Sin daño:** el piso de `queryFloors`, la anotación del rechazo, el ack de `R9-249` en disco y
>   las pruebas nuevas (`attempts = 7` equivale a ocho rechazos de verdad, `S45-2`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **252**. Rama `docs/review-s45-diff-s44`: mergeada
> y pusheada con el OK de Victor (`main` = `b1f83f8`, CI verde en el log, run `37083545252`,
> 368/4540). Detalle: `detail/S45-revision-del-diff-s44.md`.
>
> **Sesión 46 (2026-10-02): ARREGLOS de lo de la 45**, en el mismo chat, solo en la terminal y sin
> agentes.
>
> - **Cerrados**, un commit por hallazgo en `fix/s46-arreglos-s45` (`a79dcbe`..`e57fa16`):
>   `R9-251` (la prueba de la guarda `ownUnread`, de `S45-1`; cae con `R247unread`) y `R9-252`
>   (aceptado por Victor y escrito en el motor). Y dos comentarios: `queryFloors` (`R9-247`) y la
>   prueba de la lectura sola (`R9-246`).
> - **Sin la matriz:** el motor cambió solo en comentarios.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **252**. Ramas `fix/s46-arreglos-s45` y
> `docs/review-s46-fix-s45`: mergeadas y pusheadas con el OK de Victor (`main` = `87d14ce`, CI
> verde en el log, run `37085207637`, 368/4541). Detalle: `detail/S46-arreglos-s45.md`.
>
> **Sesión 47 (2026-10-02): revisión del diff de la 46**, en el mismo chat, solo en la terminal,
> sin agentes y sin tocar código.
>
> - **1 nuevo:** `R9-253` (P3, de la 46: el comentario de `R9-252` dice que un respaldo restaurado
>   ya asentó el conflicto en la sesión; solo vale bajo el piso, `S47-1`).
> - **La prueba de `R9-251`:** medida con 12 piezas de a una; cae por la consecuencia con
>   `R247unread` y `R234own`, y por la tabla de su control con `R234ret` y `R238hoy`.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **253**. Rama `docs/review-s47-diff-s46`: mergeada
> y pusheada con el OK de Victor (`main` = `afbf460`, CI verde en el log, run `37089759242`,
> 368/4541). Detalle: `detail/S47-revision-del-diff-s46.md`.
>
> **Sesión 48 (2026-10-02): ARREGLOS de lo de la 47**, en el mismo chat, solo en la terminal y sin
> agentes. Cerró `R9-253` (`05e089e`, solo el comentario de `R9-252`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **253**. Ramas `fix/s48-arreglos-s47` y
> `docs/review-s48-fix-s47`: mergeadas y pusheadas con el OK de Victor (`main` = `8f59942`, CI
> verde en el log, run `37099120504`, 368/4541). Detalle: `detail/S48-arreglos-s47.md`.
>
> **Sesión 49 (2026-10-03): ARREGLOS de `R9-212` y `R9-214`**, en un chat nuevo, solo en la
> terminal y sin agentes. Cerró `R9-212` (P2, `024bef8`: la cola ilegible al hidratar se relee y se
> une; 9 pruebas) y `R9-214` (P3, `d3e45a7`: el bulk push de favoritos lee SQLite; 1 prueba).
> Anotó en `R9-126` un disparador común, medido (local R, nube D).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **253**. Ramas `fix/s49-arreglos` y
> `docs/review-s49-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `d976c2d`, CI verde en
> el log, run `37112335538`, 368/4551). Detalle: `detail/S49-arreglos-r212-r214.md`.
>
> **Sesión 50 (2026-10-03): revisión del diff de la 49**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. 5 nuevos (`R9-254`..`R9-258`). Dos los abrió `R9-212` (P3), uno
> `R9-214` (P3), uno es anterior a la 49 (`R9-256`, P2: un borrado en cola y una copia del otro más
> vieja que él), y uno junta los comentarios de la 49.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **258**. Rama `docs/review-s50-diff-s49`: mergeada
> y pusheada con el OK de Victor (`main` = `af8a5ae`, CI verde en el log, run `37145852120`,
> 368/4551). Detalle: `detail/S50-revision-del-diff-s49.md`.
>
> **Sesión 51 (2026-10-03): ARREGLOS de lo de la 50**, en el mismo chat, solo en la terminal y sin
> agentes. Cerró `R9-256` (P2), `R9-254` con `R9-115`, `R9-257` y `R9-258`; aceptó `R9-255`; abrió
> `R9-259` (P3: la guarda de `R9-197` ya no tiene prueba propia).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **259**. Ramas `fix/s51-arreglos-s50` y
> `docs/review-s51-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `3e4b758`, CI verde en
> el log, run `37148855758`, 369/4558). Detalle: `detail/S51-arreglos-s50.md`.
>
> **Sesión 52 (2026-10-03): revisión del diff de la 51**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. 7 nuevos, todos P3 (`R9-260`..`R9-266`): tres los abrió la 51
> (dos hidrataciones a la vez, el proceso que muere durante la primera lectura, y la lápida de
> `R9-256` rechazada con un reinicio entre medias), y cuatro son vecinos de `R9-257` o comentarios.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **266**. Rama `docs/review-s52-diff-s51`: mergeada
> y pusheada con el OK de Victor (`main` = `cc005d2`, CI verde en el log, run `37153675553`,
> 369/4558). Detalle: `detail/S52-revision-del-diff-s51.md`.
>
> **Sesión 53 (2026-10-03): ARREGLOS de lo de la 52, y `R9-59` y `R9-38`**, en un chat nuevo,
> solo en la terminal y sin agentes. Cerrados `R9-260`, `R9-262`..`R9-266`, `R9-38` (el último
> P0) y `R9-59` (la Mesa por cuenta); aceptado `R9-261`. 2 nuevos, por lectura: `R9-267` (P2) y
> `R9-268` (P3).
>
> **No queda ningún P0 abierto.** Hallazgos: **268**. Ramas `fix/s53-arreglos-s52`,
> `fix/s53-r59-r38` y `docs/review-s53-fix`: mergeadas y pusheadas con el OK de Victor (`main` =
> `4807078`, CI verde en el log, run `37163774992`, 371/4582). Detalle:
> `detail/S53-arreglos-s52.md`.
>
> **Sesión 54 (2026-10-03): revisión del diff de la 53**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. 4 nuevos: `R9-269` (P1, lo abrió la 53: la unión de la Mesa «sin
> cuenta» borra el trabajo del mismo pasaje), `R9-270` (P2, lo abrió la 53: con el marcador del
> dueño viejo, lo editado sin sesión sube a la cuenta anterior), `R9-271` y `R9-272` (P3).
>
> **No queda ningún P0 abierto.** Hallazgos: **272**. Rama `docs/review-s54-diff-s53`: mergeada y
> pusheada con el OK de Victor (`main` = `a64786b`, CI verde en el log, run `37167615407`,
> 371/4582). Detalle: `detail/S54-revision-del-diff-s53.md`.
>
> **Sesión 55 (2026-10-03): ARREGLOS de lo de la 54**, en el mismo chat, solo en la terminal y sin
> agentes. Cerrados `R9-269`..`R9-272`; ningún nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **272**. Ramas `fix/s55-arreglos-s54` y
> `docs/review-s55-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `5b5c630`, CI verde en
> el log, run `37173764215`, 371/4585; corregido en la 56). Detalle: `detail/S55-arreglos-s54.md`.
>
> **Sesión 56 (2026-10-05): revisión del diff de la 55**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. 2 nuevos, P3: `R9-273` (el respaldo escribe la Mesa sin turno:
> restaurado durante una unión, se pierde) y `R9-274` (por lectura: si la unión de `deleteAccount`
> no llega, la Mesa queda bajo el uid borrado).
>
> **No queda ningún P0 abierto.** Hallazgos: **274**. Rama `docs/review-s56-diff-s55`: mergeada y
> pusheada con el OK de Victor (`main` = `fb7cc73`, CI verde en el log, run `37394756731`,
> 371/4585; corregido en la 57). Detalle: `detail/S56-revision-del-diff-s55.md`.
>
> **Sesión 57 (2026-10-05): ARREGLOS de lo de la 56**, en el mismo chat, solo en la terminal y sin
> agentes. Cerrados `R9-273` (el respaldo escribe la Mesa en su turno) y `R9-274` (la Mesa de la
> cuenta borrada se devuelve aunque la unión no termine); ningún nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **274**. Ramas `fix/s57-arreglos-s56` y
> `docs/review-s57-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `cbcc7df`, CI verde en
> el log, run `37400931622`, 372/4588; corregido en la 58). Detalle: `detail/S57-arreglos-s56.md`.
>
> **Sesión 58 (2026-10-05): revisión del diff de la 57**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. 2 nuevos, P3, ninguno abierto por la 57: `R9-275` (una escritura
> de la Mesa para una cuenta que se borra mientras espera, como el respaldo, queda bajo el uid
> borrado) y `R9-276` (la nota de `R9-274` tiene un solo lugar).
>
> **No queda ningún P0 abierto.** Hallazgos: **276**. Rama `docs/review-s58-diff-s57`: mergeada y
> pusheada con el OK de Victor (`main` = `4a757ce`, CI verde en el log, run `37407024480`,
> 372/4588; corregido en la 59). Detalle: `detail/S58-revision-del-diff-s57.md`.
>
> **Sesión 59 (2026-10-05): ARREGLOS de lo de la 58**, en el mismo chat, solo en la terminal y sin
> agentes. Cerrados `R9-276` (la nota de la devolución es una lista) y `R9-275` (lo escrito para una
> cuenta ya devuelta no queda bajo su uid); ningún nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **276**. Ramas `fix/s59-arreglos-s58` y
> `docs/review-s59-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `6667c40`, CI verde en
> el log, run `37417036066`, 372/4591; corregido en la 60). Detalle: `detail/S59-arreglos-s58.md`.
>
> **Sesión 60 (2026-10-05): revisión del diff de la 59**, en el mismo chat, solo en la terminal,
> sin agentes y sin tocar código. Ningún hallazgo nuevo; el hilo de la Mesa queda cerrado.
>
> **No queda ningún P0 abierto.** Hallazgos: **276**. Rama `docs/review-s60-diff-s59`, sin mergear
> hasta el OK de Victor. Detalle: `detail/S60-revision-del-diff-s59.md`.
>
> **Sesión 61 (2026-10-06): ARREGLOS del mazo de memoria**, en un chat nuevo, solo en la terminal y
> sin agentes. Cerrados `R9-267` (una lectura fallida ya no escribe el mazo vacío encima del disco)
> y la parte del mazo de `R9-133` (`getLocal` espera a la carga y lanza si no leyó; el ref va con
> cada escritura). Nuevos: `R9-277` (la carga reemplazaba lo escrito durante ella; cerrado) y
> `R9-278` (una edición durante el `multiSet` del respaldo lo pisa; abierto, P3).
>
> **No queda ningún P0 abierto.** Hallazgos: **278**. Ramas `fix/s61-mazo-r267-r133` y
> `docs/review-s61-fix`, apiladas sobre la de la 60: mergeadas y pusheadas juntas con el OK de
> Victor (`main` = `9b78865`, CI verde en el log, run `37425511083`, 373/4603; corregido en la 62).
> Detalle: `detail/S61-arreglos-r267-r133.md`.
>
> **Sesión 62 (2026-10-06): revisión del diff de la 61**, en el mismo chat, con 3 agentes en
> worktree que solo midieron, sin tocar código. 5 nuevos, todos P3: `R9-279` (re-agregar borra el
> progreso), `R9-280` (lo editado en una recarga que falla espera a otra edición), `R9-281` (la
> salida de `R9-267` pisa el respaldo), `R9-282` (borrado remoto con el mazo sin leer) y `R9-283`
> (pruebas con órdenes imposibles y piezas sin vigilar). `R9-278`, medido.
>
> **No queda ningún P0 abierto.** Hallazgos: **283**. Rama `docs/review-s62-diff-s61`: mergeada y
> pusheada con el OK de Victor (`main` = `8d041c9`, CI verde en el log, run `37503705122`,
> 373/4603; corregido en la 63). Detalle: `detail/S62-revision-del-diff-s61.md`.
>
> **Sesión 63 (2026-10-06): arreglos de lo de la 62**, en un chat nuevo, con 3 agentes en worktree
> que solo midieron. Cerrados 6: `R9-283` (las pruebas, en un modelo del ejecutor serie), `R9-279`
> («agregar si falta»), `R9-280`, `R9-281` y `R9-278` (el respaldo avisa antes de escribir) y
> `R9-282`. Nuevos: `R9-284` (los otros tres providers del respaldo) y `R9-285` (un aviso de
> pantalla), los dos P3.
>
> **No queda ningún P0 abierto.** Hallazgos: **285**. Ramas `fix/s63-mazo-r279-r283` y
> `docs/review-s63-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `23f5b96`, CI verde
> en el log, run `37515408752`, 374/4625; corregido en la 64). Detalle:
> `detail/S63-arreglos-r279-r283.md`.
>
> **Sesión 64 (2026-10-06): revisión del diff de la 63**, en un chat nuevo, en la terminal y sin
> agentes, sin tocar código. 1 nuevo, P3: `R9-286` (comentarios de la 63 que no se sostienen). Las
> 45 piezas, re-medidas, tumban lo mismo, también con las entregas del modelo serie separadas.
>
> **No queda ningún P0 abierto.** Hallazgos: **286**. Rama `docs/review-s64-diff-s63`: mergeada y
> pusheada con el OK de Victor (`main` = `bfe18a0`, CI verde en el log, run `37545005882`,
> 374/4625; corregido en la 65). Detalle: `detail/S64-revision-del-diff-s63.md`.
>
> **Sesión 65 (2026-10-06): arreglos de lo de la 64**, en el mismo chat, en la terminal y sin
> agentes. Cerrado `R9-286` (solo comentarios; el JS emitido, idéntico al de `main`, con control).
> Ningún nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **286**. Ramas `fix/s65-comentarios-r286` y
> `docs/review-s65-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `8755d2b`, CI verde en
> el log, run `37547915783`, 374/4625; corregido en la 66). Detalle: `detail/S65-arreglos-r286.md`.
>
> **Sesión 66 (2026-10-06): revisión del diff de la 65**, en un chat nuevo, en la terminal y sin
> agentes, sin tocar código. Solo comentarios, confirmado (con control). 2 nuevos, P3: `R9-287` (el
> caso del turno no lo vigila ninguna prueba: con el aviso dentro del turno, el suite pasa) y
> `R9-288` («the disk as it is now» no se sostiene en ese caso).
>
> **No queda ningún P0 abierto.** Hallazgos: **288**. Rama `docs/review-s66-diff-s65`: mergeada y
> pusheada con el OK de Victor (`main` = `cc4ee6d`, CI verde en el log, run `37550640197`,
> 374/4625; corregido en la 67). Detalle: `detail/S66-revision-del-diff-s65.md`.
>
> **Sesión 67 (2026-10-06): arreglos de lo de la 66**, en el mismo chat, en la terminal y sin
> agentes. Cerrados `R9-287` (una prueba que cae con `enTurno` y con `inicio`) y `R9-288` (dos
> comentarios; el JS emitido, idéntico al de `main`, con control). Ningún nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **288**. Ramas `fix/s67-turno-r287-r288` y
> `docs/review-s67-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `8915312`, CI verde en
> el log, run `37554083093`, 374/4626; corregido en la 68). Detalle:
> `detail/S67-arreglos-r287-r288.md`.
>
> **Sesión 68 (2026-10-06): revisión del diff de la 67**, en un chat nuevo, en la terminal y sin
> agentes. Solo comentarios en el provider, confirmado con control. La prueba de `R9-287` construye
> el caso y cae por la razón que dice, y el mecanismo alcanza. 1 nuevo, P3: `R9-289` (con el
> respaldo más lento que las 20 vueltas, la prueba cae con el mismo diff que `enTurno`, y sus
> controles no muestran que el respaldo haya pedido el turno).
>
> **No queda ningún P0 abierto.** Hallazgos: **289**. Rama `docs/review-s68-diff-s67`: mergeada y
> pusheada con el OK de Victor (`main` = `e9db115`, CI verde en el log, run `37563058370`,
> 374/4626; corregido en la 69). Detalle: `detail/S68-revision-del-diff-s67.md`.
>
> **Sesión 69 (2026-10-06): arreglos de lo de la 68**, en un chat nuevo, en la terminal y sin
> agentes. Cerrado `R9-289` (un tercer control en la prueba de `R9-287`: el respaldo pidió el
> turno). 1 nuevo, P3, sin arreglar: `R9-290` (el caso `muere` de la prueba de `R9-275` tiene la
> misma forma, y lo mostró `lento` en el suite).
>
> **No queda ningún P0 abierto.** Hallazgos: **290**. Ramas `fix/s69-control-r289` y
> `docs/review-s69-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `3d29d33`, CI verde en
> el log, run `37572992296`, 374/4626; corregido en la 70). Detalle: `detail/S69-arreglos-r289.md`.
>
> **Sesión 70 (2026-10-06): revisión del diff de la 69**, en el mismo chat, en la terminal y sin
> agentes, sin tocar código. El control nuevo de `R9-289` se sostiene. Corregido `R9-290` (el rojo
> de la regresión es distinto del de `lento`). 1 nuevo, P3: `R9-291` (la prueba de `R9-273` pasa con
> su propia regresión si el respaldo es más lento que sus 20 vueltas).
>
> **No queda ningún P0 abierto.** Hallazgos: **291**. Rama `docs/review-s70-diff-s69`: mergeada y
> pusheada con el OK de Victor (`main` = `8c4fc9a`, CI verde en el log, run `37577204278`,
> 374/4626; corregido en la 71). Detalle: `detail/S70-revision-del-diff-s69.md`.
>
> **Sesión 71 (2026-10-07): arreglos de lo de la 70**, en el mismo chat, en la terminal, con 2
> agentes en worktree que solo midieron. Cerrados `R9-291` y `R9-290` (controles de llegada en dos
> pruebas de `backupPrepTurn`; la primera versión de `R9-290` abrió un hueco que vio el agente 2,
> cerrado antes del commit final). 1 nuevo, P3: `R9-292` (la prueba de `R9-273` no ve una escritura
> fuera del turno).
>
> **No queda ningún P0 abierto.** Hallazgos: **292**. Ramas `fix/s71-llegada-r290-r291` y
> `docs/review-s71-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `863747d`, CI verde en
> el log, run `37582666564`, 374/4626; corregido en la 72). Detalle:
> `detail/S71-arreglos-r290-r291.md`.
>
> **Sesión 72 (2026-10-07): revisión del diff de la 71**, en un chat nuevo, en la terminal, con 3
> agentes en worktree que solo midieron, sin tocar código. Lo medido de `R9-291` y `R9-290` se
> sostiene. 3 nuevos, P3: `R9-293` (la prueba de `R9-273` pasa sin turno si la escritura llega 20
> vueltas después del pedido), `R9-294` (`turnoSoloGone` pasa las 998 y pierde lo restaurado si la
> cuenta se borra durante la restauración) y `R9-295` (lo abrió la 71: `colgadas` cuenta la
> devolución del borrado como si fuera la del respaldo). Correcciones en `R9-289`..`R9-292`.
>
> **No queda ningún P0 abierto.** Hallazgos: **295**. Rama `docs/review-s72-diff-s71`: mergeada y
> pusheada con el OK de Victor (`main` = `f6c1c3c`, CI verde en el log, run `37655696021`, 374/4626;
> corregido en la 73). Detalle: `detail/S72-revision-del-diff-s71.md`.
>
> **Sesión 73 (2026-10-07): arreglos de lo de la 72**, en el mismo chat, en la terminal, con 3
> agentes en worktree que solo midieron. Cerrados `R9-292`, `R9-293` y `R9-294` (una prueba nueva:
> con la escritura del respaldo retenida, ninguna otra escritura de la Mesa corre) y `R9-295`
> (`colgadas` dice QUÉ se colgó). Dos huecos de la prueba nueva, vistos por los agentes, cerrados
> antes del checkpoint. 6 nuevos, P3, ninguno abierto por la 73: `R9-296` («no escribió» no es
> «esperaba el turno»), `R9-297`, y cuatro regresiones del camino de la devolución que pasan las 999
> (`R9-298`..`R9-301`).
>
> **No queda ningún P0 abierto.** Hallazgos: **301**. Ramas `fix/s73-retenido-r292-r295` y
> `docs/review-s73-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `64c4b88`, CI verde en
> el log, run `37661765310`, 374/4627; corregido en la 74). Detalle:
> `detail/S73-arreglos-r292-r295.md`.
>
> **Sesión 74 (2026-10-07): revisión del diff de la 73**, en un chat nuevo, en la terminal y sin
> agentes, sin tocar código. Lo medido de la 73 se sostiene. 1 nuevo, P3: `R9-302` (la prueba de
> `R9-287` cae con el diff exacto de `sinCola` si el store da UNA vuelta más antes de pedir el
> turno; arreglo medido). Corrección en `R9-297` (basta una vuelta). Escritas las decisiones de
> Victor sobre `R9-289` y `R9-296`.
>
> **No queda ningún P0 abierto.** Hallazgos: **302**. Rama `docs/review-s74-diff-s73`: mergeada y
> pusheada con el OK de Victor (`main` = `bc845c0`, CI verde en el log, run `37667723424`, 374/4627;
> corregido en la 75). Detalle: `detail/S74-revision-del-diff-s73.md`.
>
> **Sesión 75 (2026-10-07): arreglos de lo de la 74**, en un chat nuevo, en la terminal, con 2
> agentes en worktree que solo midieron. Cerrados `R9-302` (la prueba de `R9-287` espera a que el
> store tenga el turno) y `R9-303` (lo que esa espera le quitó: un turno tomado con el respaldo ya
> empezado; ahora un caso `durante`). 2 nuevos, P3, de pruebas: `R9-304` y `R9-305`.
>
> **No queda ningún P0 abierto.** Hallazgos: **305**. Ramas `fix/s75-r302-store-con-el-turno` y
> `docs/review-s75-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `f01e149`, CI verde en
> el log, run `37698839488`, 374/4628; corregido en la 76). Detalle: `detail/S75-arreglos-r302.md`.
>
> **Sesión 76 (2026-10-07): revisión del diff de la 75**, en un chat nuevo, en la terminal, con 4
> agentes en worktree que solo midieron, sin tocar código. Lo de la 75 se sostiene, salvo tres
> frases corregidas sin número (`R9-303`, `R9-305`, `sueltaK`). 3 nuevos, P3, de pruebas: `R9-306`
> (el orden de la prueba vieja, que no arma ni `antes` ni `durante`; lo abrió la 75), `R9-307` (un
> turno tomado durante el cuerpo de la transacción; arreglo medido) y `R9-308` (un plazo de reloj en
> la espera del turno).
>
> **No queda ningún P0 abierto.** Hallazgos: **308**. Rama `docs/review-s76-diff-s75`: mergeada y
> pusheada con el OK de Victor (`main` = `e2e8182`, CI verde en el log, run `37706611415`, 374/4628;
> corregido en la 77). Detalle: `detail/S76-revision-del-diff-s75.md`.
>
> **Sesión 77 (2026-10-07): arreglos de lo de la 76**, en el mismo chat, en la terminal y sin
> agentes. Cerrados `R9-307` (la puerta de SQLite del mock, después del cuerpo) y `R9-306` (un
> tercer caso, `pedido antes`: el store pedido con la clave sin resolver). Ninguno nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **308**. Ramas `fix/s77-r306-r307-ordenes` y
> `docs/review-s77-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `8ff1130`, CI verde en
> el log, run `37709675157`, 374/4629; corregido en la 78). Detalle:
> `detail/S77-arreglos-r306-r307.md`.
>
> **Sesión 78 (2026-10-07): revisión del diff de la 77**, en un chat nuevo, en la terminal, sin
> agentes y sin tocar código. Lo de la 77 se sostiene. Dos nuevos P3 de pruebas, ninguno abierto
> por la 77: `R9-309` (un store pedido antes del respaldo, con la clave resuelta cuando el respaldo
> ya escribe en su turno: si corre sin turno, no lo ve ninguna prueba) y `R9-310` (un `prepWrite`
> que toma el turno antes de resolver la clave, la traba de la 55, tampoco).
>
> **No queda ningún P0 abierto.** Hallazgos: **310**. Rama `docs/review-s78-diff-s77`: mergeada y
> pusheada con el OK de Victor (`main` = `00e666c`, CI verde en el log, run `37715634559`, 374/4629;
> corregido en la 79). Detalle: `detail/S78-revision-del-diff-s77.md`.
>
> **Sesión 79 (2026-10-07): arreglos de lo de la 78**, en el mismo chat, en la terminal y sin
> agentes. Cerrados `R9-309` (un cuarto caso en la prueba de `R9-292`: el store pedido antes del
> respaldo) y `R9-310` (una prueba de la traba de la 55 en `prepAccount.test.ts`). Ninguno nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **310**. Ramas `fix/s79-r309-r310` y
> `docs/review-s79-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `d9e127c`, CI verde en
> el log, run `37729787425`, 374/4630; corregido en la 80). Detalle:
> `detail/S79-arreglos-r309-r310.md`.
>
> **Sesión 80 (2026-10-07): revisión del diff de la 79**, en el mismo chat que la escribió (lo pidió
> Victor), en la terminal, sin agentes y sin tocar código. Lo de la 79 cae como dice. Tres nuevos P3
> de pruebas: `R9-311` (con la clave sin retener, `pedidaAntes` da el rojo exacto de la regresión),
> `R9-312` (el control final de `R9-310` no dice «después de la unión») y `R9-313` (la marca de
> `generacion` ya en la devolución de `R9-275`: no la ve ninguna prueba).
>
> **No queda ningún P0 abierto.** Hallazgos: **313**. Rama `docs/review-s80-diff-s79`: mergeada y
> pusheada con el OK de Victor (`main` = `a32be3b`, CI verde en el log, run `37738370167`, 374/4630;
> corregido en la 81). Detalle: `detail/S80-revision-del-diff-s79.md`.
>
> **Sesión 81 (2026-10-08): arreglos de lo de la 80**, en un chat nuevo, en la terminal, con 3
> agentes (los pidió Victor) que solo midieron; el orquestador integró y re-midió. Cerrados `R9-311`
> (el control por la identidad de la clave retenida, y `escribio` desde la retención), `R9-312`
> (`recibida` y `leido` en la prueba de `R9-310`) y `R9-313` (el quinto caso, con una salida que no
> se cuelga). Uno nuevo, `R9-314` (P3: una lectura pedida antes del primer estado de auth, con la
> clave resuelta antes de la unión; no la ve ninguna prueba).
>
> **No queda ningún P0 abierto.** Hallazgos: **314**. Ramas `fix/s81-r311-r313` y
> `docs/review-s81-fix`: mergeadas y pusheadas con el OK de Victor en la 82 (`main` = `c3123d6`, CI
> verde en el log, run `37810321907`, 374/4630). Detalle: `detail/S81-arreglos-r311-r313.md`.
>
> **Sesión 82 (2026-10-08): revisión del diff de la 81**, en un chat nuevo, en la terminal, sin
> agentes y sin tocar código (antes, el merge de la 81). Lo de la 81 cae como dice. Dos nuevos P3 de
> pruebas: `R9-315` (el control por la identidad de la promesa cae ante un cambio bueno que envuelve
> la clave; lo abrió la 81) y `R9-316` (la salida de `R9-313` suelta solo la clave: con otra traba,
> `R9-292` se cuelga 20 s). `R9-314`, medido entero (`claveAntesDeFinish`).
>
> **No queda ningún P0 abierto.** Hallazgos: **316**. Rama `docs/review-s82-diff-s81`: mergeada y
> pusheada con el OK de Victor (`main` = `d180732`, CI verde en el log, run `37814148351`, 374/4630;
> corregido en la 83). Detalle: `detail/S82-revision-del-diff-s81.md`.
>
> **Sesión 83 (2026-10-08): arreglos de lo de la 82 y de `R9-314`**, en el mismo chat que la 82 (lo
> pidió Victor), en la terminal y sin agentes. Solo pruebas. Cerrados `R9-314` (dos lecturas
> pedidas antes del primer estado de auth), `R9-315` (el control por las claves pendientes) y
> `R9-316` (`devolverConTope`, una salida que suelta todo, también en la de `R9-275`). Ninguno
> nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **316**. Ramas `fix/s83-r314-r316` y
> `docs/review-s83-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `637dc68`, CI verde en
> el log, run `37819458101`, 374/4632; corregido en la 84). Detalle:
> `detail/S83-arreglos-r314-r316.md`.
>
> **Sesión 84 (2026-10-08): revisión del diff de la 83**, en un chat nuevo, en la terminal y sin
> agentes. Solo docs. Lo de la 83 cae como dice. Dos nuevos P3 de pruebas: `R9-317` (`antes: null`
> dice «no terminó en un `setTimeout(0)`»: una clave que espera el primer estado a lo sumo 250 ms
> pasa las 1004; no lo abrió la 83) y `R9-318` (el control por la clave pendiente cuenta una clave
> lenta de otro lado: con `genTrasMultiSet` encima, `R9-292` pasa; lo abrió la 83).
>
> **No queda ningún P0 abierto.** Hallazgos: **318**. Rama `docs/review-s84-diff-s83`: mergeada y
> pusheada con el OK de Victor (`main` = `c7962e0`, CI verde en el log, run `37842535178`,
> 374/4632; corregido en la 85). Detalle: `detail/S84-revision-del-diff-s83.md`.
>
> **Sesión 85 (2026-10-12): arreglos de lo de la 84**, en un chat nuevo, en la terminal y sin
> agentes. Solo pruebas. Cerrados `R9-317` (`7b4a79c`: el control `antes`, tras una hora de relojes
> falsos y 1000 vueltas reales) y `R9-318` (`b1519ae`: las claves pendientes justo antes de soltar
> la retenida que vuelven antes de abrir). Las dos hipótesis de la 84 tenían un hueco ante algo
> lento por su cuenta, y los arreglos lo cierran. Ninguno nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **318**. Ramas `fix/s85-r317-r318` y
> `docs/review-s85-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `7ea20ce`, CI verde en
> el log, run `38328665462`, 374/4632; corregido en la 86). Detalle:
> `detail/S85-arreglos-r317-r318.md`.
>
> **Sesión 86 (2026-10-12): revisión del diff de la 85**, en un chat nuevo, en la terminal y sin
> agentes. Solo docs. Lo de la 85 cae como dice: en la hora falsa no queda ningún temporizador ni se
> lee la fecha, y en la ventana de 60 a 90 el control da 1 en un solo caso a la vez y el caso se
> arma. Un nuevo P3, `R9-319`: `otraPedidaAntes` lee la clave, no el turno, y con `prepWrite` 20
> vueltas o más entre las dos, `genTrasMultiSetD` pasa con el control en 1. El verde ya estaba; la
> frase que lo descarta la escribió la 85. El arreglo medido es el gancho de `R9-296`.
>
> **No queda ningún P0 abierto.** Hallazgos: **319**. Rama `docs/review-s86-diff-s85`: mergeada y
> pusheada con el OK de Victor (`main` = `028a156`, CI verde en el log, run `38333527542`, 374/4632;
> corregido en la 87). Detalle: `detail/S86-revision-del-diff-s85.md`.
>
> **Sesión 87 (2026-10-12): arreglo de lo de la 86**, en un chat nuevo, en la terminal y sin
> agentes. Prueba y gancho. Cerrado `R9-319` (`9d3f489`): el gancho de `R9-296` (un export solo para
> pruebas en `prepAccount.ts`, que cuenta los pedidos que esperan el turno) y un campo propio,
> `otraEnEspera`, en los dos casos `pedidaAntes`. Con `prepWrite` 20 vueltas o más entre su clave y
> el turno, la prueba ya no pasa con el turno roto, y los cortes no se movieron. Ninguno nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **319**. Ramas `fix/s87-r319` y `docs/review-s87-fix`:
> mergeadas y pusheadas con el OK de Victor (`main` = `fb5bcf6`, CI verde en el log, run
> `38336788556`, 374/4632; corregido en la 88). Detalle: `detail/S87-arreglo-r319.md`.
>
> **Sesión 88 (2026-10-12): revisión del diff de la 87**, en un chat nuevo, en la terminal y sin
> agentes. Solo docs. Lo de la 87 cae como dice, y el envoltorio de `oneAtATime` no cambia el orden
> de las microtareas. Un nuevo P3, `R9-320`: el gancho cuenta todos los pedidos del turno, y la
> prueba lo lee como «la otra espera». Con un pedido ajeno de la Mesa en la ventana, da 1 con la otra
> sin pedir (y `genTrasMultiSetD+tardeClave25` pasa) o 2 con la otra pidiendo (y la prueba cae con
> el código bueno). El arreglo medido: que el gancho diga qué espera (`porClave`).
>
> **No queda ningún P0 abierto.** Hallazgos: **320**. Rama `docs/review-s88-diff-s87`: mergeada y
> pusheada con el OK de Victor (`main` = `1f02511`, CI verde en el log, run `38339991537`, 374/4632;
> corregido en la 89). Detalle: `detail/S88-revision-del-diff-s87.md`.
>
> **Sesión 89 (2026-10-12): arreglo de lo de la 88**, en un chat nuevo, en la terminal y sin
> agentes. Cerró `R9-320` (`538b1bc`): el gancho dice qué espera. `oneAtATime` recibe una etiqueta
> (`prepWrite` le pasa la clave que resolvió), y la prueba de `R9-292` cuenta los pedidos con la
> clave de la otra. Con un pedido de otra clave en la ventana, pasa con el código bueno y cae con la
> regresión. Los cortes y el orden de las microtareas no se movieron. Queda, medido, un ajeno de la
> misma clave, que en la app no hay. Ninguno nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **320**. Ramas `fix/s89-r320` y `docs/review-s89-fix`:
> mergeadas y pusheadas con el OK de Victor (`main` = `cd7993c`, CI verde en el log, run
> `38349182452`, 374/4632; corregido en la 90). Detalle: `detail/S89-arreglo-r320.md`.
>
> **Sesión 90 (2026-10-12): revisión del diff de la 89**, en el mismo chat que la 89, en la terminal
> y sin agentes. Solo docs. Lo de la 89 cae como dice, re-medido sobre `cd7993c`, y lo que su detalle
> decía sin sonda resultó cierto. Un nuevo P3, `R9-321`: el comentario del `Set` dice que cada pedido
> lleva «what it writes», y la etiqueta es la clave que resolvió (con la cuenta devuelta, la otra
> pide con la de Ana y escribe en la «sin cuenta»). Un gancho que siga el comentario hace caer la
> prueba con el código bueno.
>
> **No queda ningún P0 abierto.** Hallazgos: **321**. Rama `docs/review-s90-diff-s89`: mergeada y
> pusheada con el OK de Victor (`main` = `e4d7e3a`, CI verde en el log, run `38351138599`, 374/4632;
> corregido en la 91). Detalle: `detail/S90-revision-del-diff-s89.md`.
>
> **Sesión 91 (2026-10-12): arreglo de lo de la 90**, en el mismo chat, en la terminal y sin agentes.
> Cerró `R9-321` (`3bccafd`, solo comentarios): el `Set` de `oneAtATime` lleva la clave que se
> pidió, que no siempre es la que se escribe, y el export dice «asked for». Ninguna línea de código
> cambia; `etiquetaDesviada` sigue cayendo. Ninguno nuevo.
>
> **No queda ningún P0 abierto.** Hallazgos: **321**. Ramas `fix/s91-r321` y `docs/review-s91-fix`:
> mergeadas y pusheadas con el OK de Victor (`main` = `c983c7a`, CI verde en el log, run
> `38354373015`, 374/4632; corregido en la 92). Detalle: `detail/S91-arreglo-r321.md`.
>
> **Sesión 92 (2026-10-13): revisión del diff de la 91**, en un chat nuevo, en la terminal, con 3
> agentes en worktree que solo midieron. Solo docs. Lo de la 91 se sostiene: solo comentarios (el JS
> emitido es igual, con su control), y ninguna lectura al pie de la letra de las frases nuevas tumba
> la prueba sin contradecir otra frase del mismo comentario. Un nuevo P3, `R9-322`: el comentario de
> `prepKey` dice que una escritura en cola va a la cuenta de cuando se pidió, y desde `R9-275` va a
> la «sin cuenta» si la cuenta ya se devolvió. Seguido al pie de la letra, caen dos pruebas.
>
> **No queda ningún P0 abierto.** Hallazgos: **322**. Rama `docs/review-s92-diff-s91`: mergeada y
> pusheada con el OK de Victor (`main` = `b54ebea`, CI verde en el log, run `38359587793`, 374/4632;
> corregido en la 93). Detalle: `detail/S92-revision-del-diff-s91.md`.
>
> **Sesión 93 (2026-10-13): arreglo de lo de la 92**, en un chat nuevo, en la terminal, con 3
> agentes en worktree que solo midieron. Cerró `R9-322` (`8dd8c92`, solo comentarios): el de
> `prepKey` dice la excepción de `R9-275`, distinta para un store (va a la «sin cuenta») y para el
> respaldo (se escribe en la cuenta y se devuelve después). Un nuevo P3, `R9-323`: que el desvío
> espere la devolución TERMINADA no lo fija ninguna prueba, y una regresión así pierde una sección.
>
> **No queda ningún P0 abierto.** Hallazgos: **323**. Ramas `fix/s93-r322` y `docs/review-s93-fix`:
> mergeadas y pusheadas con el OK de Victor (`main` = `2ebad5f`, CI verde en el log, run
> `38434416369`, 374/4632; corregido en la 94). Detalle: `detail/S93-arreglo-r322.md`.
>
> **Sesión 94 (2026-10-13): revisión del diff de la 93**, en un chat nuevo, en la terminal, con 10
> agentes en worktree que solo midieron (los diez completaron). Lo de la 93 se sostiene como código:
> solo comentarios, y el comentario dice lo que hace el código. Pero buena parte de su sentido no lo
> vigila ninguna prueba, y la frase que corrigió sigue en otros cinco lugares. 8 nuevos, P3, ninguno
> abierto por la 93: `R9-324` (comentario), `R9-325`..`R9-329` (pruebas: el desvío en tres stores,
> «that account's», la devolución del respaldo en otro turno, su nota, `noteRelease`) y `R9-330`,
> `R9-331` (código: una edición detrás de la adopción queda partida; un segundo estado de auth
> suelta las claves antes de la devolución). `R9-323` se amplía (seis regresiones; prueba escrita).
>
> **No queda ningún P0 abierto.** Hallazgos: **331**. Rama `docs/review-s94-diff-s93`: mergeada y
> pusheada con el OK de Victor (`main` = `cdb1d94`, CI verde en el log, run `38440174970`, 374/4632;
> corregido en la 95). Detalle: `detail/S94-revision-del-diff-s93.md`.
>
> **Sesión 95 (2026-10-13): arreglo de lo de la 94**, en un chat nuevo, en la terminal, con 3
> agentes en worktree que solo midieron, sobre los arreglos ya commiteados. Cerró 10: las pruebas
> que faltaban (`R9-323`, `R9-325`..`R9-329`, `R9-298`), los comentarios (`R9-324`, y `R9-332`, una
> sexta frase vieja que la 94 no vio) y `R9-331` (código). Los agentes vieron tres defectos en los
> arreglos, corregidos antes del OK. Un nuevo P3, `R9-333` (un rojo engañoso en la prueba de
> `R9-274`). `R9-330`, sin arreglar: hay un diseño medido, parcial, a decidir.
>
> **No queda ningún P0 abierto.** Hallazgos: **333**. Ramas `fix/s95-arreglos-s94` y
> `docs/review-s95-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `589c3bc`, CI verde en
> el log, run `38447264334`, 374/4644; corregido en la 96). Detalle: `detail/S95-arreglo-de-s94.md`.
>
> **Sesión 96 (2026-10-13): revisión del diff de la 95**, en un chat nuevo, en la terminal, con 3
> agentes en worktree que solo midieron. Solo docs. Lo de la 95 se sostiene como código: los
> comentarios son solo comentarios, y en la matriz (191 corridas, re-medida en el principal)
> ninguna regresión que caía deja de caer. Siete nuevos P3 (`R9-334`..`R9-340`), seis abiertos por
> la 95: dos verdes falsos en sus pruebas (`R9-298` y `R9-331`), una garantía nueva sin prueba (un
> `firstWork` que rechaza), una frase ambigua de `prepKey` y dos comentarios de prueba falsos; el
> séptimo, un riesgo latente de las pruebas. `R9-330` queda pendiente con el OK de Victor.
>
> **No queda ningún P0 abierto.** Hallazgos: **340**. Rama `docs/review-s96-diff-s95`: mergeada y
> pusheada con el OK de Victor (`main` = `67e8141`, CI verde en el log, run `38492329797`,
> 374/4644; corregido en la 97). Detalle: `detail/S96-revision-del-diff-s95.md`.
>
> **Sesión 97 (2026-10-13): arreglo de lo de la 96**, en el mismo chat, en la terminal, con 3
> agentes en worktree que solo midieron, sobre los arreglos ya commiteados. Cerró 7: las pruebas que
> faltaban o pasaban en falso (`R9-334`..`R9-337`), los comentarios de prueba (`R9-338`, `R9-339`)
> y `R9-341` (nuevo: una frase vieja del gancho de las devoluciones). Los agentes vieron cuatro
> defectos en los arreglos, corregidos antes del OK. `R9-340`, sin arreglar: el diseño medible corta
> solo una parte.
>
> **No queda ningún P0 abierto.** Hallazgos: **341**. Ramas `fix/s97-arreglos-s96` y
> `docs/review-s97-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `c166fff`, CI verde en
> el log, run `38512623060`, 374/4648; corregido en la 98). Detalle: `detail/S97-arreglo-de-s96.md`.
>
> **Sesión 98 (2026-10-13): revisión del diff de la 97**, en un chat nuevo, en la terminal, con 3
> agentes en worktree que solo midieron. Lo de la 97 se sostiene como código (solo comentarios donde
> lo dice, la etiqueta sin costo, la matriz sin cambios). Cuatro nuevos P3 (`R9-342`..`R9-345`): dos
> verdes falsos que abrió la 97 en sus pruebas (un respaldo ajeno de la misma clave en la de
> `R9-298`; una parte de la migración de cuatro en las de `R9-336`) y dos huecos de antes que la 97
> tocó sin cerrar (estados solo durante la migración en la de `R9-337`; la primera mitad de la frase
> de `prepKey`). `R9-340`, medido: hay un diseño que lo corta, sin prueba que lo vigile.
>
> **No queda ningún P0 abierto.** Hallazgos: **345**. Rama `docs/review-s98-diff-s97`: mergeada y
> pusheada con el OK de Victor (`main` = `08da00b`, CI verde en el log, run `38529167216`, 374/4648;
> corregido en la 99). Detalle: `detail/S98-revision-del-diff-s97.md`.
>
> **Sesión 99 (2026-10-14): arreglo de lo de la 98**, en un chat nuevo, en la terminal, con 12
> agentes en worktree que solo midieron (los pidió Victor), lanzados sobre los DISEÑOS, antes de
> escribir los arreglos. Cerrados `R9-340` (aislamiento de módulos por prueba, sin producción),
> `R9-342`, `R9-343`, `R9-344` y `R9-345`; dos nuevos, medidos y arreglados en la misma sesión:
> `R9-346` (8 de 12 partes del trabajo del primer estado sin caso) y `R9-347` (ningún llamador de
> `prepKey` tenía caso; quedan la lectura de tres stores y exportar). «The joins, nothing» tiene
> prueba. Los agentes vieron cinco verdes falsos en los diseños del orquestador, corregidos antes de
> commitear.
>
> **No queda ningún P0 abierto.** Hallazgos: **347**. Ramas `fix/s99-arreglos-s98` y
> `docs/review-s99-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `9543a9b`, CI verde en
> el log, run `38651949786`, 374/4665; corregido en la 100). Detalle: `detail/S99-arreglo-de-s98.md`.
>
> **Sesión 100 (2026-10-14): revisión del diff de la 99** (`08da00b..5aa5c96`), en un chat nuevo, en
> la terminal y sin agentes. Lo de la 99 se sostiene como código, y en la matriz (279 corridas)
> ninguna salida cambia. Cinco nuevos: `R9-348` (la tabla de las partes hace fallar cada una una vez),
> `R9-349` (los casos por llamador de `R9-347` ven su regresión solo dentro de la espera: el sexto
> verde falso de los diseños de la 99), `R9-350` (el control de `R9-340` dice «terminó», no «durante
> esta»), `R9-351` (varios estados solo durante la migración) y `R9-352` (dos frases sin medir).
>
> **No queda ningún P0 abierto.** Hallazgos: **352**. Rama `docs/review-s100-diff-s99`: mergeada y
> pusheada con el OK de Victor (`main` = `29087b8`, CI verde en el log, run `38658003458`, 374/4665;
> corregido en la 101). Detalle: `detail/S100-revision-del-diff-s99.md`.
>
> **Sesión 101 (2026-10-15): arreglo de lo de la 100**, en un chat nuevo, en la terminal y sin
> agentes. Cerrados `R9-348`..`R9-352`: el control por llamador de `R9-349` (`prepKey` espiado, leído
> al abrir y al final), la falla que se repite, dos estados en la última parte, `viejoAlEmpezar` y
> las dos frases. Dos nuevos, residuos de los arreglos, sin arreglar: `R9-353` (lo pedido durante el
> trabajo, sin un estado después del pedido) y `R9-354` (el control lee el pedido, no la clave que
> usa la escritura).
>
> **No queda ningún P0 abierto.** Hallazgos: **354**. Ramas `fix/s101-arreglos-s100` y
> `docs/review-s101-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `d47e326`, CI verde en
> el log, run `38783879671`, 374/4665; corregido en la 102). Detalle:
> `detail/S101-arreglo-de-s100.md`.
>
> **Sesión 102 (2026-10-19): revisión del diff de la 101** (`29087b8..44927a5`), en un chat nuevo, en
> la terminal, con 3 agentes en worktree que solo midieron (los pidió Victor). Lo de la 101 se
> sostiene como código, y en la matriz (330 corridas) ninguna salida cambia. Cuatro nuevos: `R9-355`
> (los dos estados de `R9-351` nunca repiten el primero ni son tres: el tercer residuo), `R9-356`
> (los varios estados de `R9-337` y `R9-344` llegan en la misma tarea), `R9-357` (la tabla de las
> partes hace fallar un solo par método-clave) y `R9-358` (`pedidasAlAbrir` del respaldo fija el
> orden de sus claves).
>
> **No queda ningún P0 abierto.** Hallazgos: **358**. Rama `docs/review-s102-diff-s101`: mergeada y
> pusheada con el OK de Victor (`main` = `ee88726`, CI verde en el log, run `39347457688`, 374/4665;
> corregido en la 103). Detalle: `detail/S102-revision-del-diff-s101.md`.
>
> **Sesión 103 (2026-10-19): arreglo de lo de la 101 y la 102**, en un chat nuevo, en la terminal, con
> 5 agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor). Cerrados
> `R9-353`..`R9-358`, solo en las pruebas (`c53c5e8`, `8e80f5b`, `e552e3b`, `1121ec9`, `28fa337`). En
> la matriz (360 corridas) no se pierde cobertura. Un nuevo, sin arreglar: `R9-359` (las pruebas fijan
> el método con que la migración lee; P3 bajo).
>
> **No queda ningún P0 abierto.** Hallazgos: **359**. Ramas `fix/s103-arreglos-s102` y
> `docs/review-s103-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `25a8c05`, CI verde en
> el log, run `39356602251`, 374/4672; corregido en la 104). Detalle:
> `detail/S103-arreglo-de-s101-s102.md`.
>
> **Sesión 104 (2026-10-19): revisión del diff de la 103** (`ee88726..28fa337`), en un chat nuevo, en
> la terminal, con 6 agentes en worktree que solo midieron (los pidió Victor): la segunda vuelta de la
> 103, cada uno atacando lo integrado de otro. Siete nuevos, todos en las pruebas y abiertos por la
> 103: `R9-360` (la espera de `R9-357`), `R9-361` (los estados de `R9-356`, en vueltas y no en
> tiempo), `R9-362` (el respaldo de `R9-353` restaura series vacías), `R9-363` (un ajeno de
> `@prep_notes` ocupa el lugar del que falta), `R9-364` (el `R9-354` del respaldo, con la clave tarde),
> `R9-365` (el control de `R9-358` fija aún orden y cantidad) y `R9-366` (el control de `R9-354` se lee
> antes de los estados nuevos).
>
> **No queda ningún P0 abierto.** Hallazgos: **366**. Rama `docs/review-s104-diff-s103`: mergeada y
> pusheada con el OK de Victor (`main` = `ad6ba69`, CI verde en el log, run `39364590245`, 374/4672;
> corregido en la 105). Detalle: `detail/S104-revision-del-diff-s103.md`.
>
> **Sesión 105 (2026-10-20): arreglo de lo de la 103 y la 104**, en un chat nuevo, en la terminal, con
> 10 agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor: 6 para las
> entradas y 4 para el Pendiente). Cerrados `R9-359`..`R9-366`, y del Pendiente `R9-333` y `R9-372`
> (`backupPrepTurn.test.ts` sin aislamiento), solo en las pruebas (`1b299a9`, `fce7950`, `53bdbe6`). Cinco nuevos,
> sin arreglar: `R9-367` (la tabla de las partes no lee las claves), `R9-368` (`avisos` como lista
> exacta), `R9-369` (el valor al pedir en un solo llamador, sin migración que mueva), `R9-370` (el dueño
> de la migración sin registro; de `src/`, decide Victor) y `R9-371` (el «de quién» de `R9-363`, en la
> pila).
>
> **No queda ningún P0 abierto.** Hallazgos: **372**. Ramas `fix/s105-arreglos-s104` y
> `docs/review-s105-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `bdd9eaf`, CI verde en el
> log, run `39478051223`, 374/4672; corregido en la 106). Detalle:
> `detail/S105-arreglo-de-s103-s104.md`.
>
> **Sesión 106 (2026-10-20): revisión del diff de la 105** (`ad6ba69..53bdbe6`), en un chat nuevo, en
> la terminal, con 4 agentes en worktree que solo midieron (los pidió Victor): la segunda vuelta de la
> 105, cada uno atacando lo integrado de otro. Ocho nuevos, todos en las pruebas: `R9-373`
> (`tiempoYVueltas`, un corte en eslabones sin escribir), `R9-374` (el reloj falso antes de un trabajo
> que la prueba espera), `R9-375` (`mockSqlite` fuera del aislamiento), `R9-376` (la espera de Cata con
> el registro vacío), `R9-377` (el filtro de la pila del respaldo, por módulo), `R9-378` (`pedidas`,
> lista exacta en la escritura y la lectura), `R9-379` (el control de la lectura no se compara con
> estados) y `R9-380` (residuos de `R9-359`). `R9-370`, decidido: opción (a).
>
> **No queda ningún P0 abierto.** Hallazgos: **380**. Rama `docs/review-s106-diff-s105`: mergeada y
> pusheada con el OK de Victor (`main` = `02d8e93`, CI verde en el log, run `39517664016`, 374/4672;
> corregido en la 107). Detalle: `detail/S106-revision-del-diff-s105.md`.
>
> **Sesión 107 (2026-10-21): arreglo de lo de la 105 y la 106**, en un chat nuevo, en la terminal, con
> 12 agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor). Cerrados
> `R9-367`..`R9-380`. `R9-370`, implementado en `src/` (opción (a)): sin dueño registrado, la Mesa de
> antes va con la cuenta que hay tras leer la nota de devoluciones, antes de la primera, con el corte
> escrito. Dos nuevos, los costos de dos arreglos: `R9-381` (el «de quién» de la escritura por la
> identidad del pedido) y `R9-382` (el filtro del respaldo por quien llama).
>
> **No queda ningún P0 abierto.** Hallazgos: **382**. Ramas `fix/s107-arreglos-s106` y
> `docs/review-s107-fix`: mergeadas y pusheadas con el OK de Victor (`main` = `0d682da`, CI verde en el
> log, run `39656058508`, 374/4681; corregido en la 108). Detalle: `detail/S107-arreglo-de-s105-s106.md`.
>
> **Sesión 108 (2026-10-26): revisión del diff de la 107** (`02d8e93..27d598b`, con `src/`: `R9-370`),
> en un chat nuevo, en la terminal, con 3 agentes en worktree que solo midieron. Cinco nuevos:
> `R9-383` (la mudanza de `R9-370` sin fila), `R9-384` (`R9-344` sin caso sin dueño), `R9-385` (el corte
> de `R9-370`, escrito más angosto en `src/`), `R9-386` (`pedidas` como conjunto) y `R9-387` (la causa
> del corte de `R9-373`, falsa).
>
> **No queda ningún P0 abierto.** Hallazgos: **387**. Rama `docs/review-s108-diff-s107`, mergeada y
> pusheada con la de la 109 (corregido en la 110). Detalle: `detail/S108-revision-del-diff-s107.md`.
>
> **Sesión 109 (2026-10-26): arreglo de lo de la 107 y la 108**, en un chat nuevo, en la terminal, con 6
> agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor). Cerrados
> `R9-381`..`R9-387` (`R9-385`: solo comentarios en `src/`), con diez verdes falsos más de las mismas
> clases. Dos nuevos, los costos de dos arreglos: `R9-388` (el «de quién» por la pila al pedir: un
> `async` que espera la clave) y `R9-389` (el respaldo por la clave que escribe: una copia de la cadena, y
> `src/` recibe un `String` envuelto).
>
> **No queda ningún P0 abierto.** Hallazgos: **389**. Ramas `fix/s109-arreglos-s108` y
> `docs/review-s109-fix` (encima de la de la 108), mergeadas y pusheadas con el OK de Victor (`main` =
> `d229e67`, CI verde en el log, run `40437095524`, 374/4687; corregido en la 110). Detalle:
> `detail/S109-arreglo-de-s107-s108.md`.
>
> **Sesión 110 (2026-10-27): revisión del diff de la 109** (`c8e5e96..4839952`), en un chat nuevo, en la
> terminal, con 10 agentes en worktree que solo midieron (los pidió Victor). Once nuevos, ninguno P0:
> `R9-390` (el `String` envuelto del respaldo esconde una regresión que pierde series), `R9-391` y
> `R9-392` (la mudanza: la lectura de destino sin fila, y dos bases sin sembrar), `R9-393` (sin
> devoluciones, varios estados en la mudanza), `R9-394` (un ajeno del mismo módulo del store), `R9-395`
> (un export tapa `R9-377`), `R9-396` (el corte en tiempo del tope de Cata) y cuatro frases o momentos de
> las pruebas (`R9-397`..`R9-400`).
>
> **No queda ningún P0 abierto.** Hallazgos: **400**. Rama `docs/review-s110-diff-s109`, mergeada y
> pusheada con el OK de Victor (`main` = `ef81827`, CI verde en el log, run `40561648671`, 374/4687;
> corregido en la 111). Detalle: `detail/S110-revision-del-diff-s109.md`.
>
> **Sesión 111 (2026-10-27): arreglo de lo de la 109 y la 110**, en un chat nuevo, en la terminal, con 5
> agentes en worktree que midieron los diseños antes de escribirlos (los pidió Victor). Cerrados
> `R9-388`..`R9-400`, solo en las pruebas: `src/` recibe la cadena; el «de quién» de la escritura es la
> función que escribe la base; la espera de Cata no cuenta vueltas mientras sigue el trabajo. Cinco
> nuevos, ninguno P0: `R9-401` (las filas de la mudanza fallan solo las lecturas de notas) y los costos
> medidos de los arreglos, `R9-402`..`R9-405`.
>
> **No queda ningún P0 abierto.** Hallazgos: **405**. Ramas `fix/s111-arreglos-s110` y
> `docs/review-s111-fix` (encima), mergeadas y pusheadas con el OK de Victor (`main` = `741f6f0`, CI verde
> en el log, run `40589890000`, 374/4688; corregido en la 112). Detalle:
> `detail/S111-arreglo-de-s109-s110.md`.
>
> **Sesión 112 (2026-10-27): revisión del diff de la 111, la ÚLTIMA vuelta del ciclo de las pruebas de la
> Mesa** (decisión de Victor, §7 de `CONTINUAR.md`), en un chat nuevo, en la terminal, con 5 agentes en
> worktree que solo midieron (los pidió Victor). Cuatro nuevos, ninguno P0, ninguno abierto por la 111: tres
> verdes falsos con daño medido en una prueba-sonda (`R9-406`: el último estado distinto del primero en la
> mudanza; `R9-407`: las cuatro bases con dueño; `R9-408`: la escritura que sale del turno en tres stores),
> que la 113 arregla, y `R9-409` (cuatro frases, costo conocido). Lo demás, notas en `R9-396` y
> `R9-402`..`R9-404`.
>
> **No queda ningún P0 abierto.** Hallazgos: **409**. Rama `docs/review-s112-diff-s111`, mergeada y
> pusheada con el OK de Victor (`main` = `7529981`, CI verde en el log, run `40611073805`, 374/4688;
> corregido en la 113). Detalle: `detail/S112-revision-del-diff-s111.md`.
>
> **Sesión 113 (2026-10-27): arreglo de lo que la 112 midió con daño, y el CIERRE del ciclo de las pruebas
> de la Mesa** (§7 de `CONTINUAR.md`: arreglado lo que tenía daño, el resto costo conocido), en un chat nuevo,
> en la terminal, con 6 agentes en worktree que midieron los diseños antes de
> escribirlos (los pidió Victor). Seis commits de pruebas, solo en `__tests__/prepAccount.test.ts`:
> `R9-406` (los dos estados distintos del primero en la marca de la mudanza), `R9-407` (las cuatro bases
> con dueño, por `sembrar()` y por las filas de la tabla de partes) y `R9-408` (la escritura que sale del
> turno, una prueba por store). Ninguno nuevo; los costos del arreglo, escritos en `R9-408`.
>
> **No queda ningún P0 abierto.** Hallazgos: **409**. Ramas `fix/s113-arreglos-s112` y
> `docs/review-s113-fix` (encima), mergeadas y pusheadas con el OK de Victor (`main` = `6404e57`, CI verde
> en el log, run `40646472229`, 374/4693; corregido en la 114). Detalle: `detail/S113-arreglo-de-s112.md`.
>
> **Sesión 114 (2026-10-28): `A12` (Modo A, superficies de crash), CERRADA**, en un chat nuevo, en la
> terminal, con 10 agentes en worktree que solo midieron (los pidió Victor). Los tres hilos de la sesión 6
> cerraron: ocho nuevos, ninguno P0.
>
> - **Hilo 1:** `R9-410` (`ThemeProvider` lanza por encima del boundary con un tema guardado que es un nombre
>   del prototipo, escrito por un respaldo fabricado) y `R9-411` (el import escribe el progreso de planes sin
>   validar).
> - **Hilo 3:** `R9-412` (el boundary nativo: uno solo, nada por encima, «Reintentar» en bucle).
> - **Hilo 2:** `R9-413`..`R9-416` (rechazos con daño o mudos) y `R9-417` (ninguno llega a Crashlytics).
> - Lo demás, «no alcanzable» o «sin medir» en el detalle.
>
> Con eso se cierra el bloque P0 del Modo A.
>
> **No queda ningún P0 abierto.** Hallazgos: **417**. Rama `docs/review-s114-a12` (solo docs), **mergeada y
> pusheada con el OK de Victor** (`main` = `origin/main` = `d34bd4d`, CI verde en el log, run `40733537620`,
> 374/4693; la rama, borrada tras `git cherry`). Detalle: `detail/A12-superficies-crash.md`.
>
> **Sesión 115 (2026-10-28): el Modo C P0 de dinero y gating, con emulador**, en un chat nuevo, en la
> terminal, con 7 agentes en worktree en dos olas (los pidió Victor). Cada uno con su emulador: instancias de
> solo lectura de `Pixel_9_Pro` con el APK debug vc73 y un solo Metro; **4 a la vez como techo** (cada una
> compromete ~6,4 GB; con 7 se agotó la memoria comprometida). Solo docs.
>
> - **`C16` ✅ OK** (15 gates de la Mesa, cerrados en free y abiertos en premium; bajar a free no pierde nada).
> - **`C15` 🐛 P2:** `R9-418` (la hoja de ofrenda se corta arriba, sin scroll). La única restauración permitida
>   ocurrió sola por el camino `alreadyOwned` (la cuenta de Google del AVD, la de Victor, ya tiene la
>   ofrenda); desde entonces cada instalación nueva con esa cuenta arranca premium.
> - **`C39` 🐛 P3:** `R9-419` (los productos de donación con precio en dólares, en Play Console) y `R9-420`
>   (sin red, la donación no dice nada).
> - **`C56` 🐛 P2:** `R9-421` (Sepia elegido con premium queda heredado para siempre).
> - **`C6` 🐛 P3:** `R9-422` (el historial abierto desde la Mesa no ve lo de los últimos 700 ms).
> - **`C55` y `C54`: PENDIENTE, «sin medir» por decisión de Victor:** necesitan una cuenta NO anónima
>   (`settings.tsx:541`, `redeem.ts:148`, `SyncEngineContext.tsx:93`), y la única cuenta de Google del AVD es
>   la suya. La receta, en sus detalles.
> - **De paso:** `R9-412` medido en el dispositivo (sigue P2: el bucle no tiene salida desde la interfaz);
>   `R9-417` sin medir (Metro ve los clones del AVD como un solo dispositivo); `R9-135`, premisa confirmada.
>
> **No queda ningún P0 abierto.** Hallazgos: **422**. Rama `docs/review-s115-modo-c` (solo docs), **mergeada y
> pusheada con el OK de Victor** (`main` = `origin/main` = `f6c7986`, CI verde en el log, run `40785326481`,
> 374/4693; la rama, borrada tras `git cherry`). **Lo siguiente: las P1/P2 (`A13`+, `B6`–`B10`) en tandas, una
> fila por agente** (la 116, `_scratch/S116-PROMPT.md`).
>
> **Sesión 116 (2026-11-02): el Modo A P1, la primera tanda (`A13`, `A14`, `A15`)**, en un chat nuevo, en la
> terminal, con 3 agentes `fork` en worktree que solo midieron, una fila cada uno (reglas en
> `_scratch/S116-agentes-reglas.md.txt`, sondas con `_scratch/S116-correr.cjs.txt`). Solo docs.
>
> - **`A13` 🐛:** `R9-423` (P2, al volver a cambiar de versión con el audio, la voz sigue en la versión
>   anterior: el seguro del re-sync no se limpia).
> - **`A14` EN CURSO:** `R9-424` (P1, la versión descargada elegida se pierde en cada arranque en frío: la red
>   de seguridad de `useBibleVersion` corre antes de que la base diga qué hay instalado); tres candidatos sin
>   medir (el reset de datos, dos descargas a la vez, la copia del sembrado no atómica).
> - **`A15` EN CURSO:** `R9-425` (P1, el temporizador «al final del capítulo» no para: se cancela antes de que
>   el avanzador decida, y la narración sigue capítulo tras capítulo) y `R9-426` (P2, lo que se pausa o se
>   cierra en el hueco entre dos versículos o capítulos vuelve a sonar).
> - Cada sonda, re-medida igual en el principal; lo que sostiene cada hallazgo, verificado a mano.
>
> **No queda ningún P0 abierto.** Hallazgos: **426**. Rama `docs/review-s116-a13-a15` (solo docs), mergeada y
> pusheada con el OK de Victor (`d6b3f05`, CI run `41535819079`; corregido en la 117). **Lo siguiente:** el
> resto de `A14` y `A15`, y `A16`+ (la 117, `_scratch/S117-PROMPT.md`).
>
> **Sesión 117 (2026-11-02): el Modo A P1, la segunda tanda (`A14`, `A15`, `A16`)**, en un chat nuevo, en la
> terminal, SIN agentes (lo pidió Victor). Sondas con `_scratch/S116-correr.cjs.txt`. Solo docs.
>
> - **`A14` 🐛 (cerrada):** el alcance que faltaba, sin nuevos: los llamadores de `getDb()` sin `initialize()`
>   (nadie llega antes de tiempo), `originals-download-service.ts` y `nativeSeedAssets.ts`.
> - **`A15` 🐛 (cerrada):** `R9-427` (P1, tras cerrar el reproductor con la ✕, el siguiente audio lo abre roto:
>   la vista expandida a la vista, sus botones muertos, los del plegado invisibles encima). `VoiceSelector` ✅.
> - **`A16` 🐛:** `R9-428` (P2, la sugerencia «fe» no busca: mínimo de 3 letras), `R9-429` (P2, «Probar otra
>   búsqueda» deja «sin resultados ""»), `R9-430` (P2, al cambiar de versión la lista sigue en la anterior y
>   «Cargar más» mezcla) y `R9-431` (P2, el resaltado no sigue al FTS: «God's» en WEB, `*`, `OR`). La
>   búsqueda real (FTS5 con `node:sqlite` sobre el sembrado) aguanta la entrada real.
>
> **No queda ningún P0 abierto.** Hallazgos: **431**. Rama `docs/review-s117-a14-a16` (solo docs), mergeada y
> pusheada con el OK de Victor (`8cea3ad`, CI run `41554994227`; corregido en la 118). **Lo siguiente:** `A17`+
> por el orden del índice (la 118, `_scratch/S118-PROMPT.md`).
>
> **Sesión 118 (2026-11-02): el Modo A P1, la tercera tanda (`A17`+)**, en un chat nuevo, en la terminal, SIN
> agentes. Sondas con `_scratch/S116-correr.cjs.txt`. Solo docs.
>
> - **`A17` 🐛:** `R9-432` (P2, al cambiar de categoría con la pregunta respondida, si la ronda nueva empieza
>   con la misma, el panel queda respondido sobre el orden nuevo: «Incorrecto» sobre un acierto, y la pregunta
>   no cuenta) y `R9-433` (P3, el reloj del modo cronometrado sigue detrás del diálogo «¿Salir?»).
> - **`A18` 🐛:** `R9-435` (P2, cerrar la hoja de originales durante la descarga y abrirla en otro versículo:
>   al terminar, las palabras del primero bajo la referencia del segundo), `R9-436` (P2, desde Datos bíblicos,
>   los fragmentos del estudio de palabra salen en RVR1960 con la interfaz en inglés) y `R9-434` (P3, al quitar
>   el filtro por libro, sus filas vuelven sin el texto del versículo).
> - **`A19` (Home) no se empezó:** 2671 L, 10 efectos, 12 `await`, 58 imports; mejor entera en la 119 que a
>   medias aquí.
>
> **No queda ningún P0 abierto.** Hallazgos: **436**. Rama `docs/review-s118-a17-a18` (solo docs), mergeada y
> pusheada con el OK de Victor (`1b04b52`, CI run `41570891071`; corregido en la 119). **Lo siguiente:** `A19`+
> por el orden del índice (la 119, `_scratch/S119-PROMPT.md`).
>
> **Sesión 119 (2026-11-02): el Modo A P1, la cuarta tanda (`A19`)**, en el MISMO chat que la 118 (lo pidió
> Victor: «continúa»), en la terminal, sin agentes. Solo docs.
>
> - **`A19` 🐛:** `R9-437` (P2, el corazón del versículo del día no dice si es favorito, y «Quitar de favoritos»
>   no quita nada) y `R9-438` (P2, al volver a Home, «Continuar leyendo» muestra el % de cuando se montó: el
>   foco corre un `loadHomeData` viejo).
>
> **No queda ningún P0 abierto.** Hallazgos: **438**. Rama `docs/review-s119-a19` (solo docs), mergeada y
> pusheada con el OK de Victor (`76ca485`, CI run `41579033670`; corregido en la 120). **Lo siguiente:** `A20`+
> por el orden del índice (la 120, `_scratch/S120-PROMPT.md`).
>
> **Sesión 120 (2026-11-02/03): el Modo A P1, la quinta tanda (`A20`, `A21`)**, en un chat nuevo, en la
> terminal, con 2 agentes `fork` en worktree a pedido de Victor («¿Podrías mandar 2 agentes?»), que solo
> midieron. Solo docs.
>
> - **`A20` 🐛:** `R9-439` (P3, dos cambios seguidos de idioma o de versión dejan el aviso del versículo del día
>   agendado dos veces), `R9-440` (P3, sin conexión y con cola, Ajustes dice «Sincronizando…») y `R9-441` (P3,
>   «Reportar un problema» no hace nada sin app de correo).
> - **`A21` ✅:** el asistente, su compuerta y las pistas aguantan; su «sin medir» es el sembrado de `A14`.
>
> **No queda ningún P0 abierto.** Hallazgos: **441**. Rama `docs/review-s120-a20-a21` (solo docs), mergeada y
> pusheada con el OK de Victor (`f5493d4`, CI verde en el log, run `41588115408`, 374/4693; corregido en la
> 121). **Lo siguiente:** `A22`+ por el orden del índice (la 121, `_scratch/S121-PROMPT.md`).
>
> **Sesión 121 (2026-11-03): el Modo A P1, la sexta tanda (`A22`, `A23`)**, en un chat nuevo, en la terminal,
> con 3 agentes `fork` en worktree a pedido de Victor («¿Podrías mandar 3 agentes?»), que solo midieron. Solo
> docs.
>
> - **`A22` 🐛:** `R9-442` (P3, dos estilos guardados con el mismo nombre) y `R9-443` (P3, la plantilla
>   exclusiva sigue y se comparte tras perder el entitlement); suma a `R9-416` (el mismo hueco en
>   `ImageShareModal`). Lo que comparte (`ShareService`, la captura, los hermanos) aguanta.
> - **`A23` 🐛:** `R9-444` (P3, el lector no celebra los logros de capítulo), `R9-445` (P3, `share_master` no se
>   puede ganar), `R9-446` (P3, dos revisiones a la vez: modal doble o puntos perdidos), `R9-447` (P3, la racha
>   de logros no baja con la app viva) y `R9-448` (P3, otra cuenta re-celebra las insignias y pierde el título).
>
> **No queda ningún P0 abierto.** Hallazgos: **448**. Rama `docs/review-s121-a22-a23` (solo docs), mergeada y
> pusheada con el OK de Victor (`680c287`, CI verde en el log, run `41676638436`, 374/4693; corregido en la
> 122). **Lo siguiente:** `A24`+ por el orden del índice (la 122, `_scratch/S122-PROMPT.md`).
>
> **Sesión 122 (2026-11-03): el Modo A P1, la séptima tanda (`A24`, `A25`)**, en el mismo chat que la 121, en la
> terminal, con 3 agentes `fork` en worktree a pedido de Victor («¿Podrías continuar mandando otros 3
> agentes?»), que solo midieron. Solo docs.
>
> - **`A24` 🐛:** `R9-449` (P3, «Reiniciar plan» con el nombre crudo), `R9-450` (P2, el PDF de discusión de la
>   Mesa en español), `R9-451` (P3, la vista previa del widget siempre en RVR1960), `R9-452` (P3, fechas con
>   «De» mayúscula en dos sitios) y `R9-453` (P3, la Comparación de versiones mezcla idiomas). El diccionario
>   (tipado, paridad, tokens) está sano. Y un camino sin medir para `R9-439` (el arranque en frío).
> - **`A25` 🐛:** `R9-454` (P2, los avisos ilegibles en oscuro y alto contraste), `R9-455` (P3, las etiquetas de
>   rareza) y `R9-456` (P3, las cifras del recuadro de Home de mañana).
>
> **No queda ningún P0 abierto.** Hallazgos: **456**. Rama `docs/review-s122-a24-a25` (solo docs), mergeada y
> pusheada con el OK de Victor (`5692a51`, CI verde en el log, run `41680715154`, 374/4693; corregido en la
> 123). **Lo siguiente:** `A26`+ por el orden del índice (la 123, `_scratch/S123-PROMPT.md`).
>
> **Sesión 123 (2026-11-03): el Modo A P1, la octava tanda (`A26`, `A27`)**, en un chat nuevo, en la terminal,
> sin agentes. Solo docs. Las sondas montan la navegación REAL de expo-router 57 (`renderRouter`) con los layouts
> de la app y despachan el atrás del sistema como Android.
>
> - **`A26` 🐛:** `R9-457` (P2, un enlace compartido abierto en frío: la flecha no hace nada y el atrás cierra la
>   app), `R9-458` (P3, lector → Estudio → lector: el atrás salta la lectura de partida) y `R9-459` (P3, la
>   historia de Niños sin `useBackHandlerStep`). El hook, sus diez usos y las 61 hojas están bien.
> - **`A27` 🐛:** `R9-460` (P3, una ruta inexistente abre la pantalla por defecto de expo-router, en inglés y con
>   «Sitemap») y `R9-461` (P3, un `d` repetido tira la app a la pantalla de error). Los enlaces que la app
>   emite, los avisos y el onboarding con un enlace pendiente están bien.
>
> **No queda ningún P0 abierto.** Hallazgos: **461**. Rama `docs/review-s123-a26-a27` (solo docs), mergeada y
> pusheada con el OK de Victor (`11fdef8`, CI verde en el log, run `41686904536`, 374/4693; corregido en la
> 124). **Lo siguiente:** `A28`+ por el orden del índice (la 124, `_scratch/S124-PROMPT.md`).
>
> **Sesión 124 (2026-11-03): el Modo A P1, la novena tanda (`A28`, `A29`)**, en el mismo chat que la 123, en la
> terminal, con 3 agentes `fork` en worktree a pedido de Victor («¿podrías continuar aquí mismo utilizando 3
> agentes?»), que solo midieron. Solo docs.
>
> - **`A28` 🐛:** `R9-462` (P3, con la app viva de un día para otro, Home da lo de ayer como hecho hoy) y
>   `R9-463` (P3, un cuadro blanco al arrancar en oscuro o alto contraste).
> - **`A29` 🐛:** `R9-464` (P2, la pestaña Favoritos relee la base en un bucle sin fin), `R9-465` (P3, cada aviso
>   en el lector vuelve a contar el capítulo) y `R9-466` (P3, un doble toque en un corazón guarda dos filas). El
>   orden del árbol está bien.
>
> **No queda ningún P0 abierto.** Hallazgos: **466**. Rama `docs/review-s124-a28-a29` (solo docs), mergeada y
> pusheada con el OK de Victor (`12f46df`, CI verde en el log, run `41691560533`, 374/4693; corregido en la
> 125). **Lo siguiente:** `A30`+ por el orden del índice (la 125, `_scratch/S125-PROMPT.md`).
>
> **Sesión 125 (2026-11-03): el Modo A P1, la décima tanda (`A30`, `A31`)**, en un chat nuevo, en la terminal, con
> 8 agentes `fork` en worktree a pedido de Victor («Podrías mandar 8 agentes?»; confirmó el reparto antes de
> lanzarlos), que solo midieron: 6 en `A30`, cada uno con una fuente del dato, y 2 en `A31`. Solo docs.
>
> - **`A30` 🐛:** `R9-467` (P2, una colección con «%» en el nombre tira la app a la pantalla de error), `R9-468`
>   (P3, cancelar Google se ve como error), `R9-469` (P3, «Combinar» guarda «—» o un número como texto), `R9-470`
>   (P3, un respaldo fabricado con `__proto__` contamina `Object.prototype`) y `R9-471` (P3, la vista previa de
>   Widgets no abre el versículo); sumas a `R9-461` y a `R9-421`. De 835 marcas (709 `as`, 62 `!`, 64 `any`, 0
>   `@ts-ignore`), el resto es honesto.
> - **`A31` 🐛:** `R9-472` (P3, cada bundle lleva las pantallas de la otra plataforma: ~970 KB de fuente en web).
>   Ninguna copia muerta esconde hoy un defecto alcanzable.
>
> **No queda ningún P0 abierto.** Hallazgos: **472**. Rama `docs/review-s125-a30-a31` (solo docs), mergeada y
> pusheada con el OK de Victor (`c634007`, CI verde en el log, run `41734149714`, 374/4693; corregido en la
> 126). **Lo siguiente:** `A32`+ por el orden del índice (la 126, `_scratch/S126-PROMPT.md`).
>
> **Sesión 126 (2026-11-03): el Modo A P2, la primera tanda (`A32`, `A33`)**, en el mismo chat que la 125, en la
> terminal, con 2 agentes `fork` en worktree a pedido de Victor («podrías continuar aquí mismo mandando 2
> agentes?»), que solo midieron. Solo docs.
>
> - **`A32` 🐛 EN CURSO:** `R9-473` (P2, un solo debounce para todas las secciones de la Mesa: la barra de
>   formato de otra tarjeta pierde lo último escrito) y `R9-474` (P3, dos toques en «Modo púlpito» abren dos).
>   Queda sin recorrer parte de lo que solo presenta, y sin medir los originales del pasaje viejo tras una
>   descarga (`detail/A32-mesa-altitud.md`).
> - **`A33` 🐛:** `R9-475` (P2, con una versión en español, «Memorizar» en Profecías duplica la carta del mazo).
>
> **No queda ningún P0 abierto.** Hallazgos: **475**. Rama `docs/review-s126-a32-a33` (solo docs), mergeada y
> pusheada con el OK de Victor (`98b5078`, CI verde en el log, run `41738029030`, 374/4693; corregido en la 127).
> **Lo siguiente:** terminar `A32` y seguir con `A34`+ (la 127, `_scratch/S127-PROMPT.md`).
>
> **Sesión 127 (2026-11-03): el Modo A P2, la segunda tanda (terminar `A32`; `A34`)**, en un chat nuevo, en la
> terminal, con 6 agentes `fork` en worktree a pedido de Victor («Podrías mandar 6 agentes?»), que solo midieron;
> cada sonda de un hallazgo, re-medida igual en el principal. Solo docs.
>
> - **`A32` 🐛 (cerrada):** `R9-476` (P2, los originales del pasaje viejo tras una descarga: el candidato fuerte
>   de la 126), `R9-477` (P2, el build del pack tira 235 palabras griegas: 2 Co 13:13-14 y Fil 1:16-17 sin
>   originales), y P3: `R9-478` (cabecera y texto en versiones distintas), `R9-479` («buscar por tema» en inglés
>   no encuentra «fear»), `R9-480` («Comparar versiones» no recarga al volver de Ajustes), `R9-481` (el atrás tras
>   «buscar por tema» sale de la Mesa), `R9-482` (doble toque en una ilustración), `R9-483` (la Mesa no ofrece
>   actualizar el pack viejo), `R9-484` (22 códigos de morfología sin decodificar) y `R9-485` (`[[`/`]]` en la
>   glosa) (`detail/A32-mesa-altitud.md`).
> - **`A34` 🐛:** `R9-486` (la vista previa de una parada no sigue a la versión), `R9-487` («Tu camino» dice que
>   empezaste un día antes, al oeste de UTC) y `R9-488` (plurales y separador de miles), todos P3
>   (`detail/A34-journeys-camino.md`).
>
> **No queda ningún P0 abierto.** Hallazgos: **488**. Rama `docs/review-s127-a32-a34` (solo docs), mergeada y
> pusheada con el OK de Victor (`3473f79`, CI verde en el log, run `41782521959`, 374/4693; corregido en la 128).
> **Lo siguiente:** `A35` (Niños) y `A36` (Oración y lectio) por el orden del índice (la 128,
> `_scratch/S128-PROMPT.md`).
>
> **Sesión 128 (2026-11-04): el Modo A P2, la tercera tanda (`A35`, `A36`)**, en un chat nuevo, en la terminal,
> con 8 agentes `fork` en worktree a pedido de Victor («Podrías lanzar 8 agentes para avanzar más?»), que solo
> midieron; cada sonda de un hallazgo, re-medida igual en el principal. Solo docs.
>
> - **`A35` 🐛 (cerrada):** todos P3: `R9-489` («Ver versículo» muestra solo el primer versículo de la escena, a
>   veces media frase), `R9-490` (el buen samaritano, escena 1, pregunta otra cosa que Lc 10:25), `R9-491` (un
>   distractor del quiz de Daniel que el texto respalda en español), `R9-492` (dos toques en «Terminar» celebran
>   dos veces), `R9-493` (el versículo de una escena en la siguiente), `R9-494` (la pista de «Escuchar todo» se
>   gasta sin mostrarse) y `R9-495` (una historia de la lista arranca el reloj del plan, sin reinicio); nota a
>   `R9-459` (`scenesSeen` sin lector) (`detail/A35-ninos.md`).
> - **`A36` 🐛 (cerrada):** P2: `R9-496` (lectio: «Memorizar» con una versión en español duplica la carta, el
>   gemelo de `R9-475`), `R9-497` («Reabrir» borra el testimonio sin confirmar) y `R9-498` (orar la Escritura
>   guarda la oración cortada a 1000 y dice «Guardado»); P3: `R9-499` (el borrador del diario se descarta sin
>   avisar), `R9-500` (la flecha de orar la Escritura sale y pierde lo escrito), `R9-501` (lo escrito tras
>   guardar no se puede guardar), `R9-502` (ACTS desde el diario deja dos diarios en la pila), `R9-503` (RV1909 con
>   otra versificación: Jonás 2), `R9-504` (el Salmo 51 entre los titulados «oración») y `R9-505` (las citas de
>   los recordatorios de oración); notas a `R9-30`, `R9-59` y `R9-24` (`detail/A36-oracion-lectio.md`).
>
> **No queda ningún P0 abierto.** Hallazgos: **505**. Rama `docs/review-s128-a35-a36` (solo docs), mergeada y
> pusheada con el OK de Victor (`523e9a8`, CI verde en el log, run `41871875138`, 374/4693; corregido en la 129).
> **Lo siguiente:** `A37` (Planes y Juntos) y `A38` (Widgets) por el orden del índice (la 129,
> `_scratch/S129-PROMPT.md`).
>
> **Sesión 129 (2026-11-04): el Modo A P2, la cuarta tanda (`A37`, `A38`; `A39` empezada)**, en el mismo chat que
> la 128, en la terminal, con 8 agentes a pedido de Victor («podrías continuar aquí con otros 8 agentes?»), que
> solo midieron. La primera tanda (8 `fork`) se cortó por el límite de 5 horas sin escribir nada; se relanzaron como
> agentes nuevos (sin el contexto del chat). Cada sonda de un hallazgo, re-medida igual en el principal. Solo docs.
>
> - **`A37` 🐛 (cerrada):** P2: `R9-506` (pegar el mensaje entero da «código no válido»; lo encontraron tres
>   agentes), `R9-507` (tras editar un plan propio, el atrás muestra el plan viejo), `R9-508` (la vista previa
>   promete un plan y se guarda otro, recortado a 400 días), `R9-509` (renombrar un plan de «Número de días» lo
>   rearma), `R9-511` (el devocional largo se comparte recortado y se borra el borrador) y `R9-512` (la invitación
>   no lleva la duración); P3: `R9-510`, `R9-513`, `R9-514`; nota a `R9-30` (`detail/A37-planes-juntos.md`).
> - **`A38` 🐛 (cerrada):** P3: `R9-515` (el widget del escritorio, un día atrás), `R9-516` (cabecera en español),
>   `R9-517` (comillas dobladas); nota a `R9-471` y CORRECCIÓN de `R9-451` (el widget nativo existe)
>   (`detail/A38-widgets.md`).
> - **`A39` 🐛 EN CURSO:** P2 `R9-518` (la migración de marcadores duplica favoritos al iniciar sesión en una
>   instalación nueva); P3 `R9-519`..`R9-523`. Quedan sin recorrer las tarjetas de imagen y la mitad del render de
>   la línea de tiempo (`detail/A39-timeline-facts-colecciones.md`).
>
> **No queda ningún P0 abierto.** Hallazgos: **523**. Rama `docs/review-s129-a37-a39` (solo docs), mergeada y
> pusheada con el OK de Victor (`10be92f`, CI verde en el log, run `41923339402`, 374/4693; corregido en la 130).
> **Lo siguiente:** terminar `A39` y seguir con `A40` (Devocional, Daily Light, guiada, sentimientos, temas) por el
> orden del índice (la 130, `_scratch/S130-PROMPT.md`).
>
> **Sesión 130 (2026-11-04): el Modo A P2, la quinta tanda (`A39`, `A40`)**, en un chat nuevo, en la terminal, SIN
> agentes (lo pidió Victor): todo en el chat principal, con las sondas corridas allí. Solo docs.
>
> - **`A39` 🐛 (cerrada):** P3 `R9-524` (la imagen que se comparte dice «1 versículos» y «1 hitos en tu camino»,
>   familia de `R9-488`); el resto de las tarjetas de imagen y del render de la línea de tiempo, sin hallazgo
>   (`detail/A39-timeline-facts-colecciones.md`).
> - **`A40` 🐛 (cerrada):** P3 `R9-525` (con la versión cambiada con la pantalla abierta, un tema o un sentimiento
>   siguen en la vieja y «Escuchar» los lee con la voz de la nueva) y `R9-526` (el devocional que se recibe nombra el
>   libro en el idioma de la interfaz); suma a `R9-524` («1 días») y CORRECCIÓN de `R9-424` (son siete las pantallas
>   que leen `@bible_version` directo). Los datos curados, sin otra versificación que importe
>   (`detail/A40-devocional-luz-guiada.md`).
>
> **No queda ningún P0 abierto.** Hallazgos: **526**. Rama `docs/review-s130-a39-a40` (solo docs), mergeada y
> pusheada con el OK de Victor (`60cc41e`, CI verde en el log, run `41931041248`, 374/4693; corregido en la 131).
> **Lo siguiente:** `A41` (Teología y diccionario) y `A42` (Sermon-notes y share-faith) por el orden del índice (la
> 131, `_scratch/S131-PROMPT.md`).
>
> **Sesión 131 (2026-11-04): el Modo A P2, la sexta tanda (`A41`, `A42`)**, en el MISMO chat que la 130 (lo pidió
> Victor: «podrías continuar aquí?»), en la terminal, SIN agentes. Solo docs.
>
> - **`A41` 🐛 (cerrada):** P3 `R9-527` (la cita del Salmo 90:2 en inglés, en Teología, no es la de ninguna versión
>   que trae la app); y medido para `R9-503`: «La Trinidad» abre 2 Co 13:14, que en RV1909 no existe
>   (`detail/A41-teologia-diccionario.md`).
> - **`A42` 🐛 (cerrada):** P3 `R9-528` (al volver del editor de una nota de sermón o de un testimonio con un cambio
>   de menos de 700 ms, la lista muestra el texto viejo; el dato se guarda); nota a `R9-525` (métodos y objeciones,
>   la carga única de la versión) y, para `R9-503`, Job 38:4 sin defecto (`detail/A42-sermones-share-faith.md`).
>
> **No queda ningún P0 abierto.** Hallazgos: **528**. Rama `docs/review-s131-a41-a42` (solo docs), mergeada y
> pusheada con el OK de Victor (`741251d`, CI verde en el log, run `41936210876`, 374/4693; corregido en la 132).
> **Lo siguiente:** `A43` (Reading insights) y `A44` (Comparación de versiones) por el orden del índice.
>
> **Sesión 132 (2026-11-09): piloto de re-revisión con Fable 5.2, sobre `A7`** (lo pidió Victor en lugar de `A43` y
> `A44`), en un chat nuevo, en la terminal, SIN agentes, esfuerzo `high`. Solo docs.
>
> - **`A7` 🐛 (sigue cerrada):** pasada a ciegas sobre `BackupService.ts` (1719 L). Un nuevo, P3 bajo: `R9-529` (el
>   historial de búsqueda restaurado lo pisa la primera búsqueda). Ningún P0, P1 ni P2 nuevo. De los hallazgos
>   previos del área, 6 vistos a ciegas, 1 no visto (`R9-29`). Cuatro «sin medir». La tabla, en
>   `detail/A7-backupservice.md` («Re-revisión piloto»).
>
> **No queda ningún P0 abierto.** Hallazgos: **529**. Rama `docs/review-s132-piloto-a7` (solo docs), mergeada y
> pusheada con el OK de Victor (`308cb81`, CI verde en el log, run `42735434164`, 3 jobs, 374/4693; corregido en la
> 133: decía «sin mergear», y que la 133 sería `A43` y `A44`).
>
> **Sesión 133 (2026-11-09): segundo piloto de re-revisión con Fable 5.2, sobre `B4`** (las reglas de Firestore y
> Storage, una fila cerrada en ✅ OK), en un chat nuevo, en la terminal, SIN agentes, esfuerzo `high`. Solo docs.
>
> - **`B4` ✅ (sigue en OK):** las reglas VIVAS se leyeron de nuevo con la API de Rules (solo GET). Son las de
>   septiembre: el mismo ruleset (`4c122e10`, del 2026-05-28), el mismo texto; un solo release (`cloud.firestore`),
>   ninguno de Storage. Ningún path abierto. Un nuevo, P3: `R9-530` («Eliminar cuenta» borra una foto de la nube y
>   la regla deja que otro dispositivo de la misma cuenta siga escribiendo). Ningún P0, P1 ni P2 nuevo. Tres notas
>   a `R9-136`. De lo previo del área: `R9-136` visto a ciegas, `R9-25` no visto. Seis «sin medir». La tabla, en
>   `detail/B4-reglas-firestore-storage.md` («Re-revisión piloto»).
> - **El criterio** (fijado por Victor antes de empezar: un nuevo P2 o mayor → seguir con `B2`, `B3`, `B5`, `A21` y
>   `B1b`): **no se cumple.** La decisión de cerrar la re-revisión es de Victor.
>
> **No queda ningún P0 abierto.** Hallazgos: **530**. Rama `docs/review-s133-piloto-b4` (solo docs), mergeada y
> pusheada con el OK de Victor (`bd3bfad`, CI verde en el log, run `42766266820`, 3 jobs, 374/4693; rama borrada tras
> `git cherry`; corregido en la 134: decía «sin mergear»).
>
> **Sesión 134 (2026-11-10): el Modo A P2, la séptima tanda (`A43`, `A44`)**, en un chat nuevo, en la terminal, SIN
> agentes, Opus 5.5 `high`. Solo docs.
>
> - **`A43` 🐛 (cerrada):** P3 `R9-531` (la tarjeta «Mi semana» dice «1 versículos oídos» y pone los números sin
>   separador; la tendencia emocional, «+1 días») y P3 `R9-532` (la tira de ánimo tiene 17 columnas y el registro
>   guarda 84 días: 4 o 5 semanas siempre vacías). Ninguno P0 (`detail/A43-reading-insights.md`).
> - **`A44` 🐛 (cerrada):** P2 `R9-533` (abrir una comparación guardada de otro pasaje muestra el versículo con ese
>   número en el capítulo abierto), P3 `R9-534` (el análisis del versículo anterior queda en pantalla) y P3 `R9-535`
>   (la comparación alinea por número: con RV1909, Jonás 2:1 pone el pez al lado de la oración; la nota culpa al
>   texto crítico). Ninguno P0 (`detail/A44-comparacion-versiones.md`).
>
> **No queda ningún P0 abierto.** Hallazgos: **535**. Rama `docs/review-s134-a43-a44` (solo docs), mergeada y
> pusheada con el OK de Victor (`e4474a8`, CI verde en el log, run `42770622085`, 3 jobs, 374/4693; rama borrada tras
> `git cherry`; corregido en la 135: decía «sin mergear»).
>
> **Sesión 135 (2026-11-10): el Modo A P2, la octava tanda (`A45`, `A46`): las últimas filas del Modo A**, en un chat
> nuevo, en la terminal, CON 13 agentes a pedido de Victor (3 + 5 `fork` y 5 nuevos, en worktrees; ninguno cortado),
> Opus 5.5. Solo docs.
>
> - **`A45` 🐛 (cerrada):** P3 `R9-536` («Devocional · 1 días»), `R9-537` (el «Hoy» del devocional compartido y de
>   explore-all no avanza de un día para otro), `R9-538` (los landings alinean por número entre versiones: con
>   RV1909, el pez de Jonás), `R9-539` (14 citas de `book-intros` entre «» que no son literales), `R9-540` (1 Reyes,
>   el «16 veces» de Filipenses y dos rangos cortos), `R9-541` (el mismo enlace dos veces deja dos landings), `R9-542`
>   (el `accessibilityLabel` fijo tapa la nota de quien comparte) y `R9-543` (la intro del estudio compartido mezcla
>   idiomas). Ninguno P0 (`detail/A45-landings-about-explore.md`).
> - **`A46` 🐛 (cerrada):** P3 `R9-544` (la auditoría pisa la resolución anterior: Insights cuenta de menos),
>   `R9-545` (la tarjeta no dice de qué versículo es), `R9-546` («Combinar» parte una colección con coma), `R9-547`
>   (el borrador de «Combinar» sobrevive y, tras un cambio de cuenta, se sube a la nube de la nueva) y `R9-548`
>   («Tienes 1 cambios locales»). Ninguno P0 (`detail/A46-conflictos.md`).
> - **De paso:** `R9-549` (`A34`, el resumen del trimestre cuenta un día de más tras el atraso de hora).
>
> **No queda ningún P0 abierto.** Hallazgos: **549**. Rama `docs/review-s135-a45-a46` (solo docs), mergeada y
> pusheada con el OK de Victor (`df94dd5`, CI verde en el log, run `42866946428`, 3 jobs, 374/4693; rama borrada tras
> `git cherry`; corregido en la 136: decía «sin mergear»). **Con `A46` se terminan las filas del Modo A.**
>
> **Sesión 136 (2026-11-10): el Modo B P1/P2 (`B6`–`B10`)**, en un chat nuevo, en la terminal, SIN agentes, Opus 5.5.
> Solo docs.
>
> - **`B6` 🐛 (cerrada):** P3 `R9-550` (`assetlinks.json` declara solo el certificado de debug público de la
>   plantilla: el App Link no se verifica en una instalación de Play y cada enlace compartido pasa por el navegador)
>   y `R9-551` (el proyecto de Firebase de producción acepta ese mismo certificado como cliente OAuth de Android).
>   Ningún permiso restringido; los de almacenamiento hacen falta en Android 12 o menos. Ninguno P0
>   (`detail/B6-permisos-android.md`).
> - **`B7` ✅ (cerrada):** raíz 62 atrasados (37 fijados por el SDK 57 o por el repo, 18 major, 7 seguros),
>   `functions/` 2, `vercel/` 3; ninguno bloquea la tienda ni el endpoint. Los que conviene subir van en grupos y
>   piden un build nativo (`detail/B7-npm-outdated.md`).
> - **`B8` 🐛 (cerrada):** P3 `R9-552` (el `splash` de `app.json` ya no lo lee el SDK 57: vc74 se publicó con el
>   splash de la plantilla de Expo; corrige la premisa de `R9-463`). El `react@16` anidado no llega al bundle; 26 usos
>   de APIs deprecadas, ninguno roto; las 33 `.so`, alineadas a 16 KB. Ninguno P0
>   (`detail/B8-expo-sdk57-deprecadas.md`).
> - **`B9` 🐛 (cerrada):** P3 `R9-553` (cuatro módulos nativos que nadie importa van en el release: `expo-image` con
>   Glide, `expo-status-bar`, y `slider` y `clipboard` desde `devDependencies`; 1,4 MB de `.so` en arm64). `zod` y
>   `@gorhom/bottom-sheet` sin uso pero fuera del bundle; los subproyectos, limpios. Ninguno P0
>   (`detail/B9-dependencias-sin-usar.md`).
> - **`B10` 🐛 (cerrada):** puede salir en una app de pago (nada copyleft en lo publicado), pero no cumple sus
>   condiciones: P3 `R9-554` (ningún aviso de terceros en la app) y, de paso, `R9-555` (las 19 familias de íconos en
>   el AAB, la app usa 2: 2,4 MB). Ninguno P0 (`detail/B10-licencias.md`).
>
> **No queda ningún P0 abierto.** Hallazgos: **555**. **Con `B10` se terminan las filas del Modo B.** Rama
> `docs/review-s136-b6-b10` (solo docs), sin mergear hasta el OK de Victor. Lo que sigue lo decide Victor (§4 de
> `CONTINUAR.md`): las 7 filas C P0 (Modo C, con emulador) o una sesión de arreglos.

Charter completo: [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md). Este archivo es lo único
que hay que leer al reanudar. **Para arrancar un chat nuevo:**
[`CONTINUAR.md`](CONTINUAR.md), que ya trae el mensaje inicial y las reglas que ya
costaron caro.

---
