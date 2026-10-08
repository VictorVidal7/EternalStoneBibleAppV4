# 🔍 Revisión profunda 2026-09 — ÍNDICE (ledger de checkpoints)

> **Frontera actual: Modo A · fila `A12`, que está `EN CURSO` (parcial).** Sesión 2 cerró
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
> `docs/review-s83-fix`, sin mergear hasta el OK de Victor. Detalle:
> `detail/S83-arreglos-r314-r316.md`.

Charter completo: [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md). Este archivo es lo único
que hay que leer al reanudar. **Para arrancar un chat nuevo:**
[`CONTINUAR.md`](CONTINUAR.md), que ya trae el mensaje inicial y las reglas que ya
costaron caro.

---

## Protocolo (resumen — el detalle está en el charter §1)

1. **Solo revisar y reportar. NO se toca código de la app.** Lo único que se escribe
   es este ledger. Las "mejoras" (Modo D) se redactan como propuesta, no se aplican.
2. **Reanudar:** lee este archivo entero y continúa desde la primera fila `PENDIENTE`
   o `EN CURSO`, respetando prioridad (P0 → P1 → P2) y luego el orden del índice.
3. **Checkpoint por área:** al terminar un área, escribe de inmediato (a) su fila aquí
   y (b) `detail/<slug>.md`. No esperes al final de la sesión.
4. **Un hallazgo ≠ arreglarlo.** Márcalo y regístralo en [`BUGS.md`](BUGS.md). No lo
   arregles.
5. **No mezcles modos en una misma sesión** — cada modo tiene su propio entorno (el
   Modo C paga ~15 min de arranque de emulador).
6. **Revisa primero lo que los tests ya cubren:** 365 archivos de test / ~4027 tests.
   `grep` en `__tests__/` por el área antes de re-derivar terreno cubierto.
7. Sin evidencia, el hallazgo no entra al ledger (estándar por modo: charter §3).

**Convención de la columna Detalle:** slug pelón, sin ruta ni enlace. `A1` →
`detail/A1-premium-revenuecat.md`. Mientras la fila esté `PENDIENTE` la celda va
vacía (`—`).

**`_scratch/` está en `.gitignore`** (decisión de Victor, sesión 1): los scratch de
agentes en fan-out no ensucian `git status`. Créalo cuando haya el primer fan-out; el
orquestador los fusiona al índice y a `detail/` en una sola pasada y luego los borra.

**Estados:** `PENDIENTE` · `EN CURSO` · `✅ OK` · `🐛 BUG` · `⚠️ DUDA/PARCIAL` ·
`💡 MEJORA` · `⛔ NO PROBABLE AQUÍ`

**Orden sugerido de sesiones** (no obligatorio, pero minimiza cambios de entorno):
Modo B P0 (B1–B5, baratas y sin setup) → Modo A P0 (A1–A12, el mayor valor) →
Modo C P0 (una sola arrancada de emulador) → luego P1 por modo → P2 → Modo D al final.

---

## Prioridades

- **P0 — dinero, identidad, pérdida de datos, seguridad.** RevenueCat / hoja de
  ofrenda / gating premium en toda la app · Firebase Auth + borrado de cuenta · rutas
  con pérdida de datos (notas, Mesa, rachas, SRS, `BackupService`) · conflictos de
  sync · secretos/llaves · superficies de crash · reglas de Firestore.
- **P1 — núcleo.** Lectura · lector inmersivo · audio/TTS · memoria/SRS · quiz ·
  búsqueda · word study · Home · Ajustes · onboarding · compartir · logros.
- **P2 — todo lo demás + pulido + propuestas.**

Una fila es P0 **solo si** la preocupación de dinero/identidad/datos/seguridad es lo
que de hecho se ejercitaría en esa fila. Donde un área grande tiene una rebanada P0
estrecha, está partida en dos filas (`20a`/`20b`, `26a`/`26b`, `27a`/`27b`, etc.) para
que una sesión P0 no se gaste el margen en UI de bajo riesgo.

---

## Entorno

- **Modo A / B / D:** ninguno, repo puro.
- **Modo C:** emulador Android + Metro + APK **debug**. NUNCA el OnePlus de Victor.
  Recipe completo, gotchas de `adb` en Windows, deep links y el toggle premium de dev
  (Ajustes → "Extras" → "Extras desbloqueados (solo desarrollo)") en la memoria
  `reference_essb-device-testing-and-automation`. Playbook de acceso por área (deep
  links + líneas de gate) en `DOCS/QA_REVISION_FABLE.md` §Apéndice — sigue vigente.

---

## Ya conocido — NO reportar como hallazgo nuevo

Verificado contra `git log` el 2026-09-03 (`main` = `origin/main` = `f9d6b27`).

- **Los 12 bugs de la revisión Fable (julio) están cerrados.** 11 se arreglaron en las
  tandas A–E el mismo día; **BUG-10** (profecías, scroll) se verificó hoy como
  arreglado en `b17ec99` (hay un `useEffect` de `scrollTo({y:0})` por cambio de fase en
  `app/features/prophecies/index.tsx:297-299`, con comentario que cita "QA BUG-10").
  El charter §3 lo listaba como semilla abierta — ese dato estaba **obsoleto**.
  Los otros 11 no se han re-verificado en vivo en esta revisión.
- **Backlog abierto de producto** (de `essb-master-backlog`, no son bugs de esta
  revisión): lanzamiento público en Play Store (Track 2, bloqueado por la puerta de
  Google 12 testers × 14 días) · licencia NLT/Tyndale sin respuesta · registro de marca
  IMPI (tarea legal de Victor) · mapa geográfico real para "Rutas bíblicas" (diferido
  a propósito por Victor — el estilo riel-con-nodos actual es su elección, no un
  placeholder). **El merge de `chore/release-3.2.62` YA NO está abierto** — se hizo en
  `19fee16` y la rama se borró; `main` lleva `3.2.62` / `versionCode 74` (verificado
  contra `git log` el 2026-09-14).
- **Comportamientos del emulador que NO son bugs de la app:** el AVD silencia
  `expo-speech` (`AudioHardening`), y `expo-av` está en `package.json` pero nada en
  `src/` lo importa — el audio es `expo-speech`. Ver la memoria de device-testing.
- **Excepciones legítimas de hex hardcodeado** (no las marques como violación de
  theming): texto de chrome siempre-oscuro sobre `gradient.headerColors`, las
  plantillas de imagen `FREE_TEMPLATES`, y `staticColors`. Ver la memoria
  `feedback_essb-theme-and-navigation-patterns`.
- **Piso de sync aceptado a propósito:** `reviewCard()` en `MemoryDeckContext` dispara
  una escritura Firestore por repaso real — evaluado y aceptado, no es un hallazgo.
- **La suite es estructuralmente CIEGA al horario de verano** (sesión 6, fila `A11`).
  Ninguna prueba del repo fija `TZ`. La máquina de Victor corre en `America/Mexico_City`,
  **que abolió el DST en 2022**, y el CI en **UTC** (corrección de la sesión 22, medida en el
  log; antes aquí decía que también en Ciudad de México) → ningún test puede detectar jamás
  un bug de cambio de hora. Es un **cuarto punto ciego**, junto a la resolución de módulos
  por plataforma, la dirección inversa de cada flujo y las listas enumeradas a mano.
  Cualquier área que agrupe por día/semana/mes merece esa lente. Gotcha: `TZ=... npx jest`
  **no** propaga la variable desde Bash en Windows; usar
  `$env:TZ = 'Europe/Madrid'; npx jest <ruta>` en PowerShell.
- **Hay 5 adaptadores de sync, no 3** (corrección de la sesión 6): `notes`, `highlights`,
  `reviewEvents` (`registerOfflineAdapters.ts:17-19`), **`favorites`**
  (`FavoritesContext.tsx:228`) y **`memoryDeck`** (`MemoryDeckContext.tsx:267`) — los dos
  últimos se registran desde sus contextos. Las 8 colecciones Firestore están enumeradas en
  `deleteAccountData.ts:22-43`. **Ninguna es progreso de lectura, racha, planes ni logros:
  eso NO viaja entre dispositivos**, solo por respaldo manual.
- **La Mesa no vive en `src/features/prep/`** (esa carpeta está vacía): los stores están en
  `src/features/study/` y las pantallas en `app/features/prep/`.

---

## Modo A — Auditoría estática de código

| #   | Área                                                               | Prioridad | Estado    | Detalle                         |
| --- | ------------------------------------------------------------------ | --------- | --------- | ------------------------------- |
| A1  | Premium: `PremiumContext` + RevenueCat + entitlements              | P0        | 🐛 BUG    | `A1-premium-revenuecat`         |
| A2  | Ofrenda/Donación: `offeringService`, `giftCodeService`             | P0        | 🐛 BUG    | `A2-ofrenda-donacion-giftcodes` |
| A3  | Auth: `AuthContext` + borrado de cuenta                            | P0        | 🐛 BUG    | `A3-auth-borrado-cuenta`        |
| A4  | Sync: `SyncEngine.ts` (1378 L) y colas de escritura                | P0        | 🐛 BUG    | `A4-syncengine`                 |
| A5  | Auditoría de TODAS las escrituras a Firestore (call sites)         | P0        | 🐛 BUG    | `A5-escrituras-firestore`       |
| A6  | Paridad web/native (`*.web.tsx` premium/offering/memory)           | P0        | 🐛 BUG    | `A6-paridad-web-native`         |
| A7  | `services/BackupService.ts` (1526 L) — respaldar/restaurar         | P0        | 🐛 BUG    | `A7-backupservice`              |
| A8  | Persistencia de notas y subrayados (`lib/notes`, `lib/highlights`) | P0        | 🐛 BUG    | `A8-notas-subrayados`           |
| A9  | Persistencia/autoguardado de la Mesa (`features/prep`)             | P0        | 🐛 BUG    | `A9-mesa-persistencia`          |
| A10 | Memoria/SRS: `MemoryDeckContext`, `lib/memory`                     | P0        | 🐛 BUG    | `A10-memoria-srs`               |
| A11 | Progreso y rachas: `lib/progress`, `lib/reading`, rings            | P0        | 🐛 BUG    | `A11-progreso-rachas`           |
| A12 | Superficies de crash: error boundaries, promesas sin catch         | P0        | EN CURSO  | `A12-superficies-crash`         |
| A13 | Lector de capítulo (`verse/[book]/[chapter].tsx`, 3975 L)          | P1        | PENDIENTE | —                               |
| A14 | Capa de base de datos (`lib/database/index.ts`, 2425 L)            | P1        | PENDIENTE | —                               |
| A15 | Audio/TTS (`features/audio`, `lib/speech`)                         | P1        | PENDIENTE | —                               |
| A16 | Búsqueda (`lib/search`, `(tabs)/search.tsx`)                       | P1        | PENDIENTE | —                               |
| A17 | Quiz (`features/quiz`, `app/features/quiz`)                        | P1        | PENDIENTE | —                               |
| A18 | Word study / idiomas originales (`features/study`)                 | P1        | PENDIENTE | —                               |
| A19 | Home (`(tabs)/index.tsx`, 2671 L)                                  | P1        | PENDIENTE | —                               |
| A20 | Ajustes (`(tabs)/settings.tsx`, 1289 L)                            | P1        | PENDIENTE | —                               |
| A21 | Onboarding (`lib/onboarding`, `useOnboarding`)                     | P1        | PENDIENTE | —                               |
| A22 | Compartir (`ShareService`, `features/share`, `ImageShareModal`)    | P1        | PENDIENTE | —                               |
| A23 | Logros e insignias (`lib/achievements`, `lib/badges`)              | P1        | PENDIENTE | —                               |
| A24 | i18n: paridad de claves ES/EN (`translations.ts`, 13066 L)         | P1        | PENDIENTE | —                               |
| A25 | Theming: `useTheme` + barrido de hex literales                     | P1        | PENDIENTE | —                               |
| A26 | Navegación y BackHandler (`useBackHandlerStep`, layouts)           | P1        | PENDIENTE | —                               |
| A27 | Deep links (`+native-intent.tsx`, params por pantalla)             | P1        | PENDIENTE | —                               |
| A28 | Hooks compartidos (`src/hooks/*`, 19 archivos)                     | P1        | PENDIENTE | —                               |
| A29 | Árbol de contexts + `ServicesContext` (18 providers)               | P1        | PENDIENTE | —                               |
| A30 | Seguridad de tipos: `any` / `as` / `@ts-ignore` / `!`              | P1        | PENDIENTE | —                               |
| A31 | Código muerto: exports sin usar, archivos huérfanos                | P1        | PENDIENTE | —                               |
| A32 | Mesa de preparación — altitud (`prep/index.tsx`, 3467 L)           | P2        | PENDIENTE | —                               |
| A33 | Profecías (`prophecies/index.tsx`, 1892 L)                         | P2        | PENDIENTE | —                               |
| A34 | Journeys + "Tu camino" (`journeys/`, `journey/`)                   | P2        | PENDIENTE | —                               |
| A35 | Niños (`features/kids`)                                            | P2        | PENDIENTE | —                               |
| A36 | Oración y lectio (`features/prayer`, `lectio.tsx`)                 | P2        | PENDIENTE | —                               |
| A37 | Planes y Juntos (`CustomPlansContext`, `TogetherContext`)          | P2        | PENDIENTE | —                               |
| A38 | Widgets (`src/widgets`, `features/widgets`)                        | P2        | PENDIENTE | —                               |
| A39 | Timeline, facts, colecciones, marcadores                           | P2        | PENDIENTE | —                               |
| A40 | Devocional, Daily Light, guiada, sentimientos, temas               | P2        | PENDIENTE | —                               |
| A41 | Teología y diccionario (`features/theology`, `dictionary`)         | P2        | PENDIENTE | —                               |
| A42 | Sermon-notes y share-faith                                         | P2        | PENDIENTE | —                               |
| A43 | Reading insights (`reading-insights/index.tsx`, 1730 L)            | P2        | PENDIENTE | —                               |
| A44 | Comparación de versiones (`VersionComparisonScreen`, 2141 L)       | P2        | PENDIENTE | —                               |
| A45 | Landings compartidos + about-book + explore-all                    | P2        | PENDIENTE | —                               |
| A46 | Conflictos (`features/conflicts`, `(tabs)/conflicts.tsx`)          | P2        | PENDIENTE | —                               |

---

## Modo B — Dependencias, vulnerabilidades, vigencia

| #   | Área                                                       | Prioridad | Estado    | Detalle                       |
| --- | ---------------------------------------------------------- | --------- | --------- | ----------------------------- |
| B1  | `npm audit` — clasificar las 8 vulns (alcanzables? fix?)   | P0        | ✅ OK     | `B1-npm-audit`                |
| B1b | `npm audit` en `functions/` y `vercel/` (proyectos aparte) | P0        | ⚠️ DUDA   | `B1b-npm-audit-subproyectos`  |
| B2  | Escaneo de secretos en el árbol de trabajo                 | P0        | ✅ OK     | `B2-secretos-arbol`           |
| B3  | Escaneo de secretos en el historial de git                 | P0        | ✅ OK     | `B3-secretos-historial`       |
| B4  | Reglas de Firestore y Storage — ¿algún path abierto?       | P0        | ✅ OK     | `B4-reglas-firestore-storage` |
| B5  | Seguridad de CI (`.github/workflows/ci.yml`)               | P0        | ✅ OK     | `B5-seguridad-ci`             |
| B6  | Permisos Android, plugins, `google-services.json`          | P1        | PENDIENTE | —                             |
| B7  | `npm outdated` (~50) — clasificar seguro/fijado/major      | P1        | PENDIENTE | —                             |
| B8  | Expo SDK 57 / RN 0.86: APIs deprecadas + `expo-doctor`     | P1        | PENDIENTE | —                             |
| B9  | Dependencias sin usar (estilo `depcheck`)                  | P2        | PENDIENTE | —                             |
| B10 | Licencias de dependencias vs. app comercial de pago        | P2        | PENDIENTE | —                             |

---

## Modo C — Prueba de flujos en vivo (emulador)

Filas `C1`–`C54` = la descomposición ya probada de `DOCS/QA_REVISION_FABLE.md`
(re-priorizada según §2 de este charter, que usa otro criterio que julio).
`C55`–`C66` = features construidas después de julio 2026.

| #    | Área                                                            | Prioridad | Estado    | Detalle |
| ---- | --------------------------------------------------------------- | --------- | --------- | ------- |
| C1a  | Mesa — persistencia y autoguardado de notas                     | P0        | PENDIENTE | —       |
| C6   | Mesa — historial de preparaciones (premium)                     | P0        | PENDIENTE | —       |
| C15  | Hoja de ofrenda — copy, apertura, compra                        | P0        | PENDIENTE | —       |
| C16  | Gating free vs premium en toda la Mesa                          | P0        | PENDIENTE | —       |
| C20a | Memoria/SRS — integridad de datos y racha (floor restaurado)    | P0        | PENDIENTE | —       |
| C26a | Cuenta — login/logout Google, identidad                         | P0        | PENDIENTE | —       |
| C26b | Respaldar/restaurar (`BackupService`)                           | P0        | PENDIENTE | —       |
| C27a | Ajustes — borrar cuenta y reset de datos                        | P0        | PENDIENTE | —       |
| C39  | Donación — hoja, compra, restaurar                              | P0        | PENDIENTE | —       |
| C42a | Notas de versículo — persistencia                               | P0        | PENDIENTE | —       |
| C43a | Subrayados — persistencia                                       | P0        | PENDIENTE | —       |
| C54  | Resolución de conflictos de sync                                | P0        | PENDIENTE | —       |
| C55  | Canje de gift-code (redención real)                             | P0        | PENDIENTE | —       |
| C56  | Gating premium FUERA de la Mesa (quiz, word-study, audio, etc.) | P0        | PENDIENTE | —       |
| C2   | Mesa — palabras clave idioma original (premium)                 | P1        | PENDIENTE | —       |
| C3   | Mesa — comparar versiones (premium)                             | P1        | PENDIENTE | —       |
| C5   | Mesa — exportar a PDF (premium) + nombre de archivo             | P1        | PENDIENTE | —       |
| C7   | Series — crear, agregar, reordenar, renombrar, borrar           | P1        | PENDIENTE | —       |
| C17  | Lectura de la Biblia (capítulo, versículo, versión)             | P1        | PENDIENTE | —       |
| C18  | Lector inmersivo (auto-scroll gratis; "Escuchar" premium)       | P1        | PENDIENTE | —       |
| C19  | Audio (velocidad, scrubbing, resume, cold-start, sleep, voz)    | P1        | PENDIENTE | —       |
| C20b | Memoria — mazo, práctica, metas, insights                       | P1        | PENDIENTE | —       |
| C21  | Quiz bíblico (categorías, contrarreloj, añadir a mazo, stats)   | P1        | PENDIENTE | —       |
| C22  | Word study / idiomas originales (interlineal, morfología)       | P1        | PENDIENTE | —       |
| C23  | Búsqueda (texto + "ir a referencia")                            | P1        | PENDIENTE | —       |
| C24  | Personalización (temas de lectura/color, tipografías)           | P1        | PENDIENTE | —       |
| C25  | Compartir (plantillas, texturas, presets, tarjeta, enlace)      | P1        | PENDIENTE | —       |
| C27b | Ajustes — resto (notificaciones, recordatorios, reset)          | P1        | PENDIENTE | —       |
| C28  | Home (verso del día, continuar, check-in, reorg post-julio)     | P1        | PENDIENTE | —       |
| C29  | Logros / gamificación (badges, títulos, fade de categorías)     | P1        | PENDIENTE | —       |
| C38  | Onboarding (primer arranque)                                    | P1        | PENDIENTE | —       |
| C40  | Accesibilidad (texto grande, alto contraste, keep-awake)        | P1        | PENDIENTE | —       |
| C42b | Notas — lista, búsqueda, edición                                | P1        | PENDIENTE | —       |
| C43b | Subrayados — colores y galería                                  | P1        | PENDIENTE | —       |
| C57  | Glosas hebreas A3/A4 en word study (incl. A4-chico posicional)  | P1        | PENDIENTE | —       |
| C58  | Toggle red-letter RVR1960 en el lector                          | P1        | PENDIENTE | —       |
| C4   | Mesa — copiar bosquejo (Markdown) + compartir estudio           | P2        | PENDIENTE | —       |
| C8   | Series — fecha por pasaje                                       | P2        | PENDIENTE | —       |
| C9   | Series — vista "Por fecha"                                      | P2        | PENDIENTE | —       |
| C10  | Series — exportar la serie completa a PDF                       | P2        | PENDIENTE | —       |
| C11  | Series — banner "adjuntar pasaje"                               | P2        | PENDIENTE | —       |
| C12  | Modo púlpito — tarjeta (conteo, estimación, stepper WPM)        | P2        | PENDIENTE | —       |
| C13  | Modo púlpito — pantalla (secciones, reloj, A-/A+, keep-awake)   | P2        | PENDIENTE | —       |
| C14  | Púlpito — accesible SIN notas                                   | P2        | PENDIENTE | —       |
| C30  | Referencias cruzadas / constelación / cadena de referencias     | P2        | PENDIENTE | —       |
| C31  | Temas topicales, sentimientos, Daily Light, devocional          | P2        | PENDIENTE | —       |
| C32  | Profecías (hilo profético, quiz, mapa)                          | P2        | PENDIENTE | —       |
| C33  | Recorridos bíblicos / Journeys                                  | P2        | PENDIENTE | —       |
| C34  | Niños (historias, quiz, plan)                                   | P2        | PENDIENTE | —       |
| C35  | Oración (companion, orar la Escritura, ACTS, lectio)            | P2        | PENDIENTE | —       |
| C36  | Planes de lectura / plan builder / Juntos (grupos)              | P2        | PENDIENTE | —       |
| C37  | Widgets                                                         | P2        | PENDIENTE | —       |
| C41  | Favoritos (tab corazón; entrada a Colecciones)                  | P2        | PENDIENTE | —       |
| C44  | "Mi lectura" / Reading insights (heatmap, racha, libro)         | P2        | PENDIENTE | —       |
| C45  | Marcadores / Bookmarks                                          | P2        | PENDIENTE | —       |
| C46  | Colecciones de versículos                                       | P2        | PENDIENTE | —       |
| C47  | Datos bíblicos / Facts                                          | P2        | PENDIENTE | —       |
| C48  | Línea de tiempo bíblica (distinta de Journeys)                  | P2        | PENDIENTE | —       |
| C49  | Devoción guiada (check-in → verso → lectio → memorizar)         | P2        | PENDIENTE | —       |
| C50  | "Tu camino" recap estilo Wrapped                                | P2        | PENDIENTE | —       |
| C51  | "Sobre este libro" standalone (fuera de la Mesa)                | P2        | PENDIENTE | —       |
| C52  | Landing de estudio/devocional compartido (recibir `?d=`)        | P2        | PENDIENTE | —       |
| C53  | Comparación de versiones standalone                             | P2        | PENDIENTE | —       |
| C59  | Hub de Teología                                                 | P2        | PENDIENTE | —       |
| C60  | Diccionario — entradas de doble vista (ELECCIÓN, SEGURIDAD)     | P2        | PENDIENTE | —       |
| C61  | Las 8 guías de feature narradas                                 | P2        | PENDIENTE | —       |
| C62  | Sermon-notes                                                    | P2        | PENDIENTE | —       |
| C63  | Comparte tu fe — Parte 2                                        | P2        | PENDIENTE | —       |
| C64  | Foto propia en compartir (permisos de galería/cámara)           | P2        | PENDIENTE | —       |
| C65  | Consolidación de notificaciones (6 tarjetas → 1 modal)          | P2        | PENDIENTE | —       |
| C66  | Modal "Tips y guías"                                            | P2        | PENDIENTE | —       |

---

## Modo D — Propuestas de mejora (redactar, NO aplicar)

| #   | Área                                                               | Prioridad | Estado    | Detalle |
| --- | ------------------------------------------------------------------ | --------- | --------- | ------- |
| D1  | Rendimiento: componentes gigantes, listas sin virtualizar          | P1        | PENDIENTE | —       |
| D2  | Accesibilidad transversal (orden de foco, labels, 48dp, contraste) | P1        | PENDIENTE | —       |
| D3  | Flujos premium / paywall — fricción y claridad                     | P1        | PENDIENTE | —       |
| D4  | Lector — fricción de UX y affordances faltantes                    | P1        | PENDIENTE | —       |
| D5  | Home — arquitectura de información                                 | P1        | PENDIENTE | —       |
| D6  | Onboarding — primera experiencia                                   | P2        | PENDIENTE | —       |
| D7  | Reproductor de audio — UX                                          | P2        | PENDIENTE | —       |
| D8  | Ajustes — arquitectura de información                              | P2        | PENDIENTE | —       |
| D9  | Navegación global e IA de la app                                   | P2        | PENDIENTE | —       |
| D10 | Contenido teológico / traducciones (solo marcar ⚠️ DUDA)           | P2        | PENDIENTE | —       |

---

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
