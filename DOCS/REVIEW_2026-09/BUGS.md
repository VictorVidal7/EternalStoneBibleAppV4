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

> **Sesión 22 (2026-09-23): el doble check con Opus 5.5, puntos 3 y 4, y con eso TERMINADO.** Fue
> solo de revisión, con 5 agentes (lo pidió Victor a mitad de sesión), y los 5 se cortaron a la vez
> por el límite de uso y se retomaron. Todo lo que subió a P1 lo verificó a mano el orquestador.
>
> - **Punto 3: las 14 entradas `R9-51`..`R9-64` siguen siendo ciertas en `HEAD`.** `R9-53` y
>   `R9-55` bajan de P1 a P2 y `R9-63` de P2 a P3. En varias el texto se corrigió en su entrada: por
>   ejemplo, el remedio de `R9-58` no sirve en el teléfono, y `R9-52` muestra un toast de ÉXITO
>   sobre una escritura fallida.
> - **Punto 4: de 179 afirmaciones de `detail/S8`..`S18`, se verificaron 171 contra el mundo.**
>   Ninguna frase falsa escondía un P0 ni un P1. La cadena de datos publicados se sostiene otra vez.
>   Las frases falsas sin defecto detrás quedaron como notas al final de cada `detail/S*`.
> - **10 hallazgos, `R9-143`..`R9-152`: 1 P1, 1 P2 y 8 P3.** `R9-143` (P1): «Banco de
>   ilustraciones» y «Modo púlpito» guardan el sermón con las dos trampas que el arreglo de
>   `R9-47` le quitó al `blur`.
>
> Siguen **5 P0 abiertos**. Hallazgos: **152**. Detalle: `detail/S22-doble-check-puntos-3-4.md`.

> **Sesión 23 (2026-09-23): revisión del diff de la 20 (`25128b3..ca2cd71`), solo de REVISIÓN.**
> No se tocó código. Con 3 agentes, y todo lo que subió a P1 lo verificó a mano el orquestador,
> con sonda propia.
>
> - **Los cuatro arreglos de la 20 se sostienen, y dentro de su diff no hay ningún P0 ni P1.** La
>   matriz de reverts de `R9-104` es cierta fila por fila; no hay camino para dos flushes de la
>   misma sesión; `R9-103` no deja ecos de otro doc (ningún apply encola); y `R9-102` no tiene un
>   `R9-13` en web (no hay `index.web.ts`).
> - **El P1 nuevo es el vecino de `R9-104`:** la 20 le puso sesión al flush y no a
>   `handleSnapshot`. Un conflicto de Ana registrado después del `stop()` pasa a la sesión de
>   Beto, y resolverlo copia la versión de la nube de Ana a la de Beto (`R9-153`). El mismo
>   agujero envenena el cursor de Beto: `R9-122.4` sube de P3 a P2.
> - **4 hallazgos, `R9-153`..`R9-156`: 1 P1 y 3 P3.** De 30 afirmaciones del ledger sobre la 20,
>   25 son ciertas; las falsas o a medias van en `R9-156`.
>
> Siguen **5 P0 abiertos**. Hallazgos: **156**. Detalle: `detail/S23-revision-del-diff-s20.md`.

> **Sesión 24 (2026-09-23/24): ARREGLOS, casi todos EN LA NUBE.** Con el crédito de sesiones en la
> nube, 6 sesiones de Claude Code en la nube hicieron los arreglos en ramas propias. El orquestador
> revisó cada rama en local, en la máquina de Victor, pieza por pieza, antes de pedir el OK. Todo
> está mergeado y pusheado: `main` = `9c425a8`, con el CI verde en el log.
>
> - **11 hallazgos cerrados:** `R9-125` (P0), `R9-130`, `R9-143`, `R9-153`, `R9-122.4`, `R9-154`,
>   `R9-109`, `R9-108`, `R9-36` (P0), `R9-39` (P0) y `R9-106`.
> - **El hallazgo de la sesión fue `NODE_ENV`** (`R9-157`, ya arreglado). La máquina de Victor
>   exporta `NODE_ENV=development`, y jest solo pone `test` si la variable no existe. Las pruebas
>   nuevas daban verde en CI y rojo en local. La vieja creencia de que «react-test-renderer
>   desmonta la Mesa» era esto.
> - **3 hallazgos nuevos:** `R9-157` (P2, arreglado), `R9-158` (P2, decisión de Victor) y `R9-159`
>   (P3).
>
> **Quedan 2 P0 abiertos** (`R9-38`, `R9-124`). Hallazgos: **159**. Detalle: `detail/S24-arreglos-en-la-nube.md`.

> **Sesión 25 (2026-09-24): revisión del diff de la 24 (`0bc707d..9c425a8`), solo de REVISIÓN, hecha
> EN LA NUBE.** No se tocó código. Dos sesiones de Claude Code en la nube revisaron cada una una
> mitad (el motor; identidad, Mesa, web y jest) y entregaron su informe en una rama que no se
> mergea. El orquestador verificó en la máquina de Victor (`NODE_ENV=development`), con sonda
> propia, todo lo que subió a P0 o P1.
>
> - **2 P0 nuevos:**
>   - `R9-160`: con un conflicto pendiente, un cambio posterior del otro teléfono entra por LWW, y
>     desde `6440ca0` «conservar lo mío» sube lo del OTRO. Es una **regresión del arreglo de
>     `R9-36`**, medida con revert.
>   - `R9-166`: la rama del link con éxito pregunta DESPUÉS de enlazar. Si la app muere con la
>     pregunta abierta, el arranque en frío sube el almacén de Ana a la cuenta de Beto.
> - **1 P1 nuevo:** `R9-161`, «quedarme con lo suyo» aplica una foto vieja y no sube nada.
> - **Otros 11 hallazgos nuevos:** 4 P2 (`R9-162`, `R9-163`, `R9-164`, `R9-167`) y 7 P3
>   (`R9-165`, `R9-168`..`R9-173`).
> - **Medidas por fin, en entradas que ya existían:** la puerta de `R9-127` que se había leído
>   en la 24, y `R9-158`.
> - **Las afirmaciones del ledger sobre la 24:** 27 ciertas, 3 a medias (`R9-108`, `R9-158` y
>   `R9-143`) y ninguna falsa. La matriz de la 24 decía «las 9 piezas discriminan», y en `main` son
>   8 (`R9-162`).
>
> **Quedan 4 P0 abiertos** (`R9-38`, `R9-124`, `R9-160`, `R9-166`). Hallazgos: **173**. Detalle:
> `detail/S25-revision-del-diff-s24.md`.

> **Sesión 25, segunda parte (2026-09-24): ARREGLOS en la nube, revisados en local.** Con el OK de
> Victor, dos sesiones en la nube arreglaron los P0 y P1 nuevos, en archivos distintos. El
> orquestador revisó cada rama en la máquina de Victor, pieza por pieza y con sus sondas propias,
> las apiló y pidió el OK. Todo está mergeado y pusheado: `main` = `cf7c715`, con el CI verde en el
> log.
>
> - **4 hallazgos cerrados:** `R9-160` (P0), `R9-161` (P1), `R9-162` (P2, la prueba que faltaba) y
>   `R9-166` (P0).
> - **1 hallazgo nuevo:** `R9-174` (P3, leído), una ventana en la que un eco propio puede parecer
>   «del otro».
>
> **Quedan 2 P0 abiertos** (`R9-38`, `R9-124`). Hallazgos: **174**. Detalle:
> `detail/S25-revision-del-diff-s24.md`, en su segunda parte.

> **Sesión 26 (2026-09-28): `R9-124` medido en el SDK nativo (Modo C) y ARREGLADO**, solo en la
> terminal y sin agentes.
>
> - **La medición, en el emulador y con el OK de Victor:** el `removed` llega por el propio teléfono
>   (online y offline) y por el otro, con el doc todavía existente. Un borrado de verdad llega igual.
> - **El arreglo** (`34de18f`, rama `fix/review-s26-removed`, sin mergear hasta el OK): ante un
>   `removed`, `getDoc` fuera de la supresión, y el doc se trata según lo que diga.
> - **Ningún hallazgo nuevo.** `R9-164` cerró su mitad «en vivo» y sigue abierto con la app cerrada;
>   `R9-126` y `R9-154` llevan una nota.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **174**. Detalle:
> `detail/S26-r9124-modo-c-y-arreglo.md`.

> **Sesión 27 (2026-09-28): revisión del diff de la 26**, solo en la terminal, con 3 agentes en
> worktree. No se tocó código.
>
> - **La matriz entera, re-medida:** las 8 piezas y las 9 guardas discriminan, igual que en la 26.
>   Pero G7 lo hace solo gracias al mock (`R9-179`).
> - **7 hallazgos nuevos, ninguno P0:**
>   - 1 P2: `R9-175`, un lote cortado a mitad pierde lo que le faltaba si otro lote adelantó el
>     cursor. Ya existía, y la 26 lo agranda;
>   - 3 P3 sobre la lectura del `removed`: `R9-176`, `R9-177` y `R9-178`;
>   - 3 P3 sobre las pruebas y el diseño: `R9-179`, `R9-180` y `R9-181` (este último lo decidió
>     el orquestador, por delegación de Victor: la (b)).
> - **Notas nuevas en `R9-124`, `R9-126` y `R9-164`.**
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **181**. Detalle:
> `detail/S27-revision-del-diff-s26.md`.

> **Sesión 28 (2026-09-29): ARREGLOS de lo de la 27**, solo en la terminal. Hubo 3 agentes en
> worktree, solo para medir diseños.
>
> - **6 hallazgos cerrados**, en `fix/s28-sync-r9175-r9181` (sin mergear hasta el OK):
>   - `R9-179` y `R9-180`, primero: el mock ahora es el del SDK (eco, reversión, re-entrega e hilo
>     único), y `isSyncing` se quitó;
>   - `R9-175`: los lotes de una colección corren de a uno;
>   - `R9-181`: la (b), acotada a la copia que marca el conflicto;
>   - `R9-176` y `R9-178`, con una sola guarda.
> - **`R9-177` sigue abierto** (necesita el OK de Victor y Modo C).
> - **3 hallazgos nuevos, sin arreglar:** `R9-182` (P2), `R9-183` (P3) y `R9-184` (P2).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **184**. Detalle:
> `detail/S28-arreglos-de-la-27.md`.

> **Sesión 29 (2026-09-29): revisión del diff de la 28**, solo en la terminal y sin agentes. No se
> tocó código.
>
> - **La matriz entera, re-medida:** igual que en la 28, pieza por pieza. Las 7 pruebas ajustadas,
>   las 4 de `R9-104` y la de `R9-161` caen al revertir lo que cada una vigila.
> - **4 hallazgos nuevos, todos P3:**
>   - `R9-185`: la guarda de `R9-176` desarma a `R9-181`, del mismo diff (corolario 4);
>   - `R9-186`: una lectura fallida o vencida suelta la marca de un conflicto retenido, y el
>     plazo no libera el ejecutor de RNFB;
>   - `R9-187`: dos piezas equivalentes por construcción y un efecto sin prueba;
>   - `R9-188`: afirmaciones falsas en pruebas, en commits y en un comentario nuevo.
> - **Notas nuevas en `R9-177` y `R9-182`.**
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **188**. Detalle:
> `detail/S29-revision-del-diff-s28.md`.

> **Sesión 30 (2026-09-29): ARREGLOS de lo de la 29**, solo en la terminal. A pedido de Victor, 3
> agentes en worktree, que solo midieron.
>
> - **9 hallazgos cerrados**, en `fix/s30-sync-r9185-r9188` (sin mergear hasta el OK):
>   - los 4 de la 29: `R9-185` (H1), `R9-186` (releer en el próximo enganche), `R9-187` y
>     `R9-188`;
>   - los 3 de la 28: `R9-182`, `R9-183` y `R9-184` (medidos por A1);
>   - 2 que abrieron los propios arreglos y encontró A2: `R9-190` (H1 con una copia propia) y
>     `R9-191` (la lista de releer ilegible).
> - **4 hallazgos nuevos abiertos:** `R9-189` (P3), `R9-192` (P2), `R9-193` (P2) y `R9-194` (P3).
>   `R9-192` y `R9-193` tienen hipótesis medidas que cambian comportamiento: decisión de Victor.
> - **Notas nuevas en `R9-126`, `R9-164`, `R9-174` y `R9-177`.**
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **194**. Detalle:
> `detail/S30-arreglos-de-la-29.md`.

> **Sesión 31 (2026-09-30): REVISIÓN del diff de la 30** (`678a4be..45d2f41`), solo en la terminal,
> sin tocar código. A pedido de Victor, 3 agentes en worktree que solo midieron; el orquestador
> re-midió cada pieza en su árbol.
>
> - **La matriz entera, re-medida:** idéntica a la final de la 30.
> - **11 hallazgos nuevos, `R9-195`..`R9-205`:** 1 P2 (`R9-199`, keepTheirs tras un reinicio no
>   sube «lo suyo») y 10 P3. Cuatro los abrieron los arreglos de la 30 contra otro arreglo del mismo
>   diff (corolario 42): `R9-196`, `R9-197`, `R9-201` y `R9-204`.
> - **Decisiones de Victor (delegadas al cerrar la 30), registradas en `R9-192` y `R9-193`.** Las
>   dos hipótesis, medidas sobre el código de hoy y re-medidas: P2/P3 de `R9-192` y el diseño
>   unificado de los sellos de `R9-193` (la ventana de caída se cierra con la cola y los sellos en un
>   solo `multiSet`, no con el sello en la entrada solo). Las integra la 32.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **205**. Detalle:
> `detail/S31-revision-del-diff-s30.md`.
>
> **Sesión 32 (2026-09-30): ARREGLOS de lo de la 31**, solo en la terminal y sin agentes. Rama
> `fix/s32-r192-r193-y-s31` (13 commits, `b58a158`..`c1664a5`), mergeada y pusheada con el OK de
> Victor (`main` = `06513ba`, CI verde en el log, run `36789350865`, 367/4483).
>
> - **12 cerrados:** `R9-192` y `R9-193` (las decisiones), `R9-196`, `R9-195`, `R9-197`, `R9-199`,
>   `R9-200`, `R9-204`, y la extensión de los sellos: `R9-189`, `R9-174` y `R9-194` (`+Y`,
>   aceptado por la delegación: la decisión está en `R9-193`). Y uno nuevo que abrió la matriz y se cerró:
>   `R9-206` (`remoteTs === heldAt` sobraba con los sellos).
> - **La medición cambió una decisión:** con los sellos, P3 de `R9-192` y el `fromRead` de la rama
>   retenida sobraban, y el segundo daba un fantasma: se quitaron los dos (`R9-196`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **206**. Detalle: `detail/S32-arreglos-s31.md`.
>
> **Sesión 33 (2026-09-30): REVISIÓN del diff de la 32** (`b26ab8d..c1664a5`), solo en la
> terminal, sin agentes y sin tocar código.
>
> - **La matriz entera, re-medida sobre `06513ba`:** idéntica a la de `c1664a5` (109 de 109
>   piezas). Ninguna guarda de la 32 da 0, y las 33 pruebas nuevas caen todas con su pieza.
> - **4 hallazgos nuevos, `R9-207`..`R9-210`, todos P3.** Tres ya ocurrían antes de la 32 (medidos con
>   su pieza revertida) y son vecinos de lo que la 32 cerró (corolario 18): `R9-207`, `R9-209` y
>   `R9-210`. Uno lo abrió la 32 dentro de `R9-193` (corolario 42): `R9-208`.
> - **Las cuatro preguntas de la 32, medidas:** C4 con el ref atrasado es `R9-210` (C4 adelanta
>   una pérdida que ya ocurría); H3 con la copia leída más nueva, `recentAcked` y `S190-propia` se
>   descartan como daño (notas en `R9-197`, `R9-126`, `R9-194` y `R9-206`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **210**. Detalle: `detail/S33-revision-del-diff-s32.md`.
>
> **Sesión 34 (2026-09-30/10-01): ARREGLOS de lo de la 33**, solo en la terminal, con 3 agentes en
> worktree que solo midieron (a pedido de Victor). Rama `fix/s34-r207-r210` (4 commits,
> `275b5df`..`682f852`), sin mergear hasta el OK de Victor.
>
> - **4 cerrados:** `R9-209`, `R9-208`, `R9-207` (la decisión delegada: `isOwnCopy` lee
>   `recentAcked`) y `R9-210` (que cierra también la parte de favoritos de `R9-133`).
> - **La matriz entera, sobre `682f852`:** 126 piezas (las 109 de la 33 y 17 nuevas). 96 dan lo mismo que en la 33, y las otras solo suben: ninguna prueba dejó de caer. Toda pieza nueva tumba al menos 1. Los ceros son los mismos de la 33 (`R104-7`, `R104-8` y `+P3`), y las 8 AUSENTES también; `+heldAt` pasó de 0 a 4.
> - **4 hallazgos nuevos, `R9-211`..`R9-214`, que ya existían:** 1 P2 (`R9-212`, la cola ilegible
>   al hidratar) y 3 P3.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **214**. Detalle: `detail/S34-arreglos-s33.md`.
>
> **Sesión 35 (2026-09-30): REVISIÓN del diff de la 34** (`17788ae..682f852`), solo en la terminal,
> sin agentes y sin tocar código.
>
> - **5 hallazgos nuevos, `R9-215`..`R9-219`, todos P3.** Los cinco los abrió o los dejó a la vista
>   la 34, y cada «lo abrió» se midió con su pieza revertida (corolario 47): `R9-215` y `R9-218`
>   (la relectura de `R9-208`, entre sesiones y entre colecciones), `R9-216` (el «mía» de más de
>   `R9-207`, en las dos ramas que no se habían sondeado), `R9-217` (el coste aceptado de `R9-208`,
>   medido) y `R9-219` (la premisa del comentario de `R9-206`, falsa en la sesión degradada: es la
>   razón de `+heldAt` 0 → 4).
> - `R9-210` y `R9-209` no dejan nada nuevo; las 18 pruebas nuevas dicen lo que miden (una
>   observación, en `R9-217`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **219**. Detalle:
> `detail/S35-revision-del-diff-s34.md`.
>
> **Sesión 36 (2026-10-01): ARREGLOS de lo de la 35**, en el mismo chat que la 35, solo en la terminal
> y sin agentes. Rama `fix/s36-r215-r219` (5 commits, `0970726`..`2bfbcf8`), mergeada y pusheada
> con el OK de Victor junto con su checkpoint (`main` = `657e993`, CI verde en el log, run
> `36826643083`, 368/4508).
>
> - **5 cerrados:** `R9-219` (el comentario), `R9-215`, `R9-218`, `R9-217` y `R9-216`, cada prueba
>   vista fallar con su pieza revertida y re-medida en el árbol combinado.
> - **La matriz entera:** ver `detail/S36-arreglos-s35.md`.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **219** (ninguno nuevo). Detalle:
> `detail/S36-arreglos-s35.md`.
>
> **Sesión 37 (2026-10-01): REVISIÓN del diff de la 36** (`d15cd71..2bfbcf8`), solo en la terminal y
> sin tocar código, con 7 agentes en worktree que solo midieron (a pedido de Victor). El checkpoint
> lo escribió un chat nuevo (`_scratch/S37b-PROMPT.md`), sin agentes.
>
> - **14 hallazgos nuevos, `R9-220`..`R9-233`, todos P3.** Los más serios: `R9-221` (el mock entrega
>   el MISMO objeto en las re-entregas, y RNFirebase uno nuevo: la identidad de `R9-216` se mide en
>   jest con una propiedad que el teléfono no tiene) y `R9-222` (`noteEcho` toma por eco la PRIMERA
>   copia con mi reloj: si el eco no pasó, el respaldo del otro queda como el eco, y vuelve el daño
>   de `R9-216`). Cada «de la 36» o «anterior» se midió con su pieza revertida, salvo donde se dice.
> - **La matriz entera, re-medida:** 136 de 136 piezas iguales a la 36, control 0/232.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **233**. Detalle:
> `detail/S37-revision-del-diff-s36.md`.
>
> **Sesión 38 (2026-10-01): ARREGLOS de lo de la 37**, solo en la terminal y sin agentes. Rama
> `fix/s38-arreglos-s37` (10 commits, `0681c6e`..`0b84a7e`), mergeada y pusheada con el OK de Victor
> junto con su checkpoint (`main` = `538409e`, CI verde en el log, run `36947870377`, 368/4518).
>
> - **Cerrados:** `R9-221` (el mock), `R9-220` y `R9-222` (con `noteArrived`: el veredicto se toma al
>   llegar la entrega, y una copia ajena retira los relojes tomados), `R9-223`, `R9-224`, `R9-225`
>   (por construcción), `R9-226` (la guarda por cuenta), `R9-228`, `R9-230`, `R9-231`, `R9-232` y
>   `R9-233`. `R9-227`: coste aceptado. `R9-229`: la mitad del `stop()`; sigue abierta la del bucle.
> - **3 nuevos:** `R9-234` (la relectura de la tabla vuelve a unir los sellos retirados; leído),
>   `R9-235` (una edición entre `stop()` y `start()` no entra en la cola; ya existía) y `R9-236`
>   (cuatro guardas viejas sin prueba que las vea tras la 38; la matriz).
> - **La matriz entera:** 138 piezas, control 0/242; contra la de la 37, 95 de 143 iguales (las 5 `R216*` ya no existen, 7 nuevas, y el resto son pruebas nuevas que caen). Cuatro piezas viejas bajan a 0: `R9-236`.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **236**. Detalle: `detail/S38-arreglos-s37.md`.
>
> **Sesión 39 (2026-10-01): REVISIÓN del diff de la 38** (`29c63c3..0b84a7e`), solo en la terminal,
> sin agentes y sin tocar código.
>
> - **4 hallazgos nuevos, `R9-237`..`R9-240`, todos P3.** `R9-237` lo abrió la 38: un respaldo del
>   otro con una escritura mía más vieja del mismo proceso pasa por «mía» (hipótesis medida en parte:
>   `recentAcked` con solo el último ack, 242/242). `R9-238` y `R9-239` son dos caminos por los que
>   `R9-224` sigue abierto (la lectura de un `removed` y el respaldo directo), y ya existían. `R9-240`:
>   la premisa de `noteArrived` depende de un orden de RNFirebase que nadie midió (Modo C).
> - **`R9-236`, medido:** a `Fsettle` le falta una prueba (`S39-5`); `Fresolve` no decide (candidata a
>   la regla 37); `207fold` y `207acum`, juntas, son la causa de `R9-237`. **`R9-229`:** la prueba del
>   bucle se puede escribir sin colgar jest (`S39-7`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **240**. Detalle:
> `detail/S39-revision-del-diff-s38.md`.
>
> **Sesión 40 (2026-10-01): ARREGLOS de lo de la 39**, solo en la terminal y sin agentes. Rama
> `fix/s40-arreglos-s39` (5 commits, `d57807b`..`e9d6e89`), mergeada y pusheada con el OK de Victor
> junto con su checkpoint (`main` = `48bee85`, CI verde en el log, run `36968376017`, 368/4526).
>
> - **Cerrados:** `R9-237` (`recentAcked` con solo el último ack), `R9-239` (`ownStamps` igual),
>   `R9-238` (la lectura de un `removed` retira como una copia ajena entregada), `R9-236` (las
>   pruebas de `Fsettle` y de `Fresolve`, que NO era equivalente: se queda) y `R9-229` (la prueba
>   del bucle).
> - **1 nuevo:** `R9-241` (el veredicto de la llegada depende de que `firestore.ts` lea `change.doc`
>   una vez; leído, sin daño hoy).
> - **La matriz entera:** 141 piezas, control 0/250; contra la de la 38, 114 de 144 iguales (las 3 de `R9-207`, quitadas a propósito; 6 nuevas; el resto, pruebas nuevas que caen). `Fsettle` y `Fresolve` pasan de 0 a 1, y ninguna pieza vieja baja a 0.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **241**. Detalle: `detail/S40-arreglos-s39.md`.
>
> **Sesión 41 (2026-10-01/02): REVISIÓN del diff de la 40** (`4f1ce9a..e9d6e89`), solo en la terminal,
> sin agentes y sin tocar código.
>
> - **3 hallazgos nuevos, `R9-242`..`R9-244`, todos P3; los tres ya existían** (medido con el motor
>   de `0b84a7e`). `R9-242`: el `own` de una entrada que reemplazó una subida en vuelo conserva
>   relojes más viejos que el ack de esa subida, y el respaldo del otro con uno de ellos pasa por
>   «mío» por la cola (hipótesis `H41own` medida: cierra las dos sondas, 250/250). `R9-243`: la
>   retirada de `R9-238` corre al PROCESAR la lectura, y con la cadena de lotes ocupada el respaldo
>   llega antes y se juzga «mío» al llegar (`H41removed` lo cierra pero tumba `R9-190`). `R9-244`:
>   la prueba del eco tardío de `R9-160` entrega copias que el SDK no levanta, y el eco tardío de
>   verdad, en conflicto, no tiene prueba propia.
> - **`R9-234`, MEDIDO** (`S41-6`), y es también lo que queda de `R9-239`: `H239join` lo cierra y
>   tumba solo la prueba de `R9-218`.
> - **Sin la matriz entera:** no hubo cambio de código, y nada de lo medido la pide.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **244**. Detalle:
> `detail/S41-revision-del-diff-s40.md`. Mergeada y pusheada con el OK de Victor (`main` =
> `2d8eb49`, CI verde en el log, run `36974151089`, 368/4526).
>
> **Sesión 42 (2026-10-02): ARREGLOS de lo de la 41**, solo en la terminal y sin agentes. Rama
> `fix/s42-arreglos-s41` (5 commits, `7c8c0fa`..`1a77b78`), mergeada y pusheada con el OK de Victor
> (`main` = `7139708`, CI verde en el log, run `37057170965`, 368/4532).
>
> - **Cerrados:** `R9-242` (`H41own`: el ack de una subida reemplazada deja en la entrada viva solo
>   su reloj), `R9-234` (la relectura de la tabla de sellos no toma un doc con sellos en memoria ni
>   uno que retiró una copia que la tabla no conoce; `H239join` no alcanzaba), `R9-244` (la prueba
>   de `R9-160` con el orden de `S41-3`), `R9-243` (un `removed` sin escritura propia en vuelo que no
>   es la reversión de un rechazo retira al LLEGAR) y el comentario de `R9-229`.
> - **Decidido:** la prueba de `R9-218` espera solo el sello de Wb (la unión con el sembrado era la
>   semántica de antes de `R9-239`).
> - **2 nuevos:** `R9-245` (mi propio respaldo rechazado por el servidor; medido, sin
>   diagnosticar, ya existía) y `R9-246` (dos guardas sin una prueba que las vea solas: la retirada
>   de la lectura de `R9-238`, que la matriz baja de 2 a 0, y la de memoria de `R9-234`).
> - **La matriz entera:** 150 piezas, control 0/256 (las 8 ausentes de siempre); contra la de la 40, 120 de 150 iguales (9 nuevas, todas caen salvo `R234mem`; el resto, pruebas nuevas que caen). De las viejas, solo `S40-R238` baja a 0 (de 2): `R9-246`. Dos anclas viejas se rehicieron (`S34-208unionPoda` y `S40-R238`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **246**. Detalle: `detail/S42-arreglos-s41.md`.
>
> **Sesión 43 (2026-10-02): revisión del diff de la 42**, solo en la terminal, sin agentes y sin
> tocar código. Rama `docs/review-s43-diff-s42`, mergeada y pusheada con el OK de Victor (`main` =
> `a731c23`, CI verde en el log, run `37063248540`, 368/4532).
>
> - **4 nuevos, todos P3.** Ya existían (medido con el motor de `e9d6e89`): `R9-247` (la reversión
>   de un rechazo que vuelve a una copia del otro bajo el piso; con la cadena ocupada, el respaldo
>   con mi último reloj pasa por «mío»), `R9-248` (la reversión de un rechazo que DESCARTA la
>   escritura retira el sello de mi respaldo: «lo mío contra lo mío») y `R9-249` (lo que queda de
>   `R9-242` tras un `stop()`). De la 42: `R9-250` (`ownRetired` anota, desde la llegada, el reloj de
>   la copia que trae el `removed`; sin daño construible).
> - **`R9-245`, diagnosticado:** un respaldo restaurado lleva el reloj viejo del archivo, y la rama
>   del conflicto retenido toma una copia «más nueva» sin preguntar si es mía. Al reintentarse, sin
>   conflicto, local y nube quedan distintos para siempre.
> - **`R9-246`:** cada guarda tiene un orden en que decide sola, con daño (`S43-1` y `S43-5`).
> - **Cuatro hipótesis medidas** (`H43suelo`, `H43drop`, `H43aparcada`, `H43propia`): cada una
>   cierra su sonda, y la suite de sync pasa 256/256 (`H43suelo` y `H43drop`, también juntas). Sin
>   la matriz: no hubo cambio de código.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **250**. Detalle:
> `detail/S43-revision-del-diff-s42.md`.
>
> **Sesión 44 (2026-10-02): ARREGLOS de lo de la 43**, solo en la terminal y sin agentes. Rama
> `fix/s44-arreglos-s43` (7 commits, `3e35415`..`c429604`), mergeada y pusheada con el OK de Victor
> (`main` = `35529db`, CI verde en el log, run `37069485600`, 368/4540).
>
> - **Cerrados:** `R9-246` (las dos pruebas; la de la lectura sola pasó al `removed` sintético de
>   `R9-186` cuando `R9-247` le quitó el caso a la de `S43-1`), `R9-245` (`H43propia`), `R9-247`
>   (`H43suelo`, con el piso en el motor: `queryFloors`), `R9-248` (`H43drop`), `R9-249`
>   (`H43aparcada`) y `R9-250` (solo el comentario).
> - **1 nuevo:** `R9-251` (la guarda `ownUnread` de `R9-247`: la sonda muestra el mecanismo, no el
>   daño).
> - **La matriz entera:** 157 piezas, control 0/264 (las 8 ausentes de siempre); contra la de la
>   42, 108 de 157 iguales. Las 7 nuevas caen salvo `R247unread` (`R9-251`). `S40-R238` y
>   `R234mem` suben de 0 a 1 (`R9-246`). Bajan `S32-W` (9→6) y `T-tomb` (3→2): esas pruebas
>   llegan con una escritura mía en la cola, que ahora toma `R9-245`, y con `R245` juntas vuelven
>   a caer (corolario 50). Ninguna vieja baja a 0. Cuatro anclas de la 42 se rehicieron (`R242`,
>   `R243`, `R243rev`, `R243vuelo`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **251**. Detalle: `detail/S44-arreglos-s43.md`.
>
> **Sesión 45 (2026-10-02): revisión del diff de la 44**, solo en la terminal, sin agentes y sin
> tocar código. Rama `docs/review-s45-diff-s44`, mergeada y pusheada con el OK de Victor (`main` =
> `b1f83f8`, CI verde en el log, run `37083545252`, 368/4540).
>
> - **`R9-251`: la guarda `ownUnread` decide, con daño** (`S45-1`). Con la tabla ilegible y doc-c
>   en conflicto en memoria, sin la guarda la relectura descarta el sello de mi respaldo, y tras
>   reiniciar queda «lo mio nuevo | mi respaldo»; hoy se asienta. Se queda; falta la prueba.
> - **1 nuevo, P3, ya existía:** `R9-252` (una escritura mía que sube con el conflicto pendiente:
>   tras reiniciar, el conflicto desaparece y «lo suyo» no está en ningún lado).
> - **Sin daño, medido o leído:** el piso de `queryFloors` (re-enganche, consulta sin filtro), una
>   entrega que no es la reversión con el reloj rechazado, el ack de `R9-249` en disco, y las
>   pruebas nuevas (`attempts = 7` equivale a ocho rechazos de verdad: `S45-2`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **252**. Detalle:
> `detail/S45-revision-del-diff-s44.md`.
>
> **Sesión 46 (2026-10-02): ARREGLOS de lo de la 45**, en el mismo chat que la 45, solo en la
> terminal y sin agentes. Rama `fix/s46-arreglos-s45` (4 commits, `a79dcbe`..`e57fa16`),
> mergeada y pusheada con el OK de Victor (`main` = `87d14ce`, CI verde en el log, run
> `37085207637`, 368/4541).
>
> - **Cerrados:** `R9-251` (la prueba de la guarda `ownUnread`, de `S45-1`; cae con `R247unread`
>   por la consecuencia) y `R9-252` (decisión de Victor: aceptado, y escrito en el motor).
> - **Comentarios:** el de `queryFloors` (`R9-247`: una entrega tardía puede leer el `uid` de la
>   cuenta siguiente) y el de la prueba de la lectura sola (`R9-246`: cómo se llega al sello).
> - **Sin la matriz entera:** el motor cambió solo en comentarios (el diff no tiene otra línea), y
>   una prueba nueva solo puede sumar caídas. Ninguna ancla de la matriz toca esas líneas.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **252**. Detalle: `detail/S46-arreglos-s45.md`.
>
> **Sesión 47 (2026-10-02): revisión del diff de la 46**, en el mismo chat, solo en la terminal,
> sin agentes y sin tocar código. Rama `docs/review-s47-diff-s46`, mergeada y pusheada con el OK
> de Victor (`main` = `afbf460`, CI verde en el log, run `37089759242`, 368/4541).
>
> - **1 nuevo, P3, de la 46:** `R9-253` (el comentario de `R9-252` dice que un respaldo restaurado
>   ya asentó el conflicto en la sesión; eso vale solo bajo el piso: medido con `S47-1`).
> - **La prueba de `R9-251`, medida con 12 piezas de a una** (`_scratch/S47-varias.out.txt`): cae
>   por la consecuencia con `R247unread` y `R234own`, y por la tabla de su control con `R234ret` y
>   `R238hoy`. Sus controles del orden (`lecturas` 1 y 2) cuentan las lecturas de la tabla.
> - **Los otros dos comentarios** dicen la verdad.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **253**. Detalle:
> `detail/S47-revision-del-diff-s46.md`.
>
> **Sesión 48 (2026-10-02): ARREGLOS de lo de la 47**, en el mismo chat, solo en la terminal y sin
> agentes. Rama `fix/s48-arreglos-s47` (1 commit, `05e089e`), mergeada y pusheada con el OK de
> Victor (`main` = `8f59942`, CI verde en el log, run `37099120504`, 368/4541).
>
> - **Cerrado:** `R9-253` (el comentario de `R9-252`: solo un respaldo bajo el piso asienta el
>   conflicto en la sesión; uno sobre el piso es como una edición). El motor cambió solo en ese
>   comentario.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **253**. Detalle: `detail/S48-arreglos-s47.md`.
>
> **Sesión 49 (2026-10-03): ARREGLOS de `R9-212` y `R9-214`**, en un chat nuevo, solo en la
> terminal y sin agentes. Rama `fix/s49-arreglos` (3 commits: `024bef8`, `d3e45a7` y `f287fc6`),
> mergeada y pusheada con el OK de Victor (`main` = `d976c2d`, CI verde en el log, run
> `37112335538`, 368/4551).
>
> - **Cerrados:** `R9-212` (P2: la cola ilegible al hidratar se relee y se une, en vez de
>   reescribirse sin sus entradas; 9 pruebas) y `R9-214` (P3: el bulk push de favoritos lee las
>   filas de SQLite; 1 prueba).
> - **Anotado en `R9-126`, medido:** un disparador común. Una edición que espera en la cola sin red
>   sube encima de la copia más nueva del otro: local R, nube D.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **253**. Detalle:
> `detail/S49-arreglos-r212-r214.md`.
>
> **Sesión 50 (2026-10-03): revisión del diff de la 49**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. Rama `docs/review-s50-diff-s49`: mergeada y pusheada con el OK
> de Victor (`main` = `af8a5ae`, CI verde en el log, run `37145852120`, 368/4551).
>
> - **5 nuevos, `R9-254`..`R9-258`:**
>   - `R9-254` (P3, lo abrió `R9-212`): una edición hecha durante la hidratación que falla sale de
>     memoria;
>   - `R9-255` (P3, lo abrió `R9-212`): mientras la relectura no vuelve, el disco guarda la entrada
>     vieja de un doc que ya subió más nuevo, y tras morir el proceso sube encima;
>   - `R9-256` (**P2, anterior a la 49**, con la cola legible): una lápida en cola y una copia del
>     otro más vieja que el borrado. La fila resucita aquí, y la nube queda borrada;
>   - `R9-257` (P3, lo abrió `R9-214`): un fallo de `getFavorites()` en el bulk push graba el flag
>     `'2'` sin subir nada;
>   - `R9-258` (P3): los comentarios de la 49, medidos caso por caso.
> - Cada «¿lo abrió la 49?», con el motor de `8f59942`. La pieza `R212` no equivale a quitar el
>   arreglo cuando se escribe durante la hidratación.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **258**. Detalle:
> `detail/S50-revision-del-diff-s49.md`.
>
> **Sesión 51 (2026-10-03): ARREGLOS de lo de la 50**, en el mismo chat que la 50, solo en la
> terminal y sin agentes. Rama `fix/s51-arreglos-s50` (4 commits: `88fb219`, `e97cd95`, `ec5bc70`
> y `6d834c5`): mergeada y pusheada con el OK de Victor (`main` = `3e4b758`, CI verde en el log,
> run `37148855758`, 369/4558).
>
> - **Cerrados:** `R9-256` (P2: sin copia local, la lápida en cola gana a una copia más vieja),
>   `R9-254` y `R9-115` (la cola no se escribe hasta hidratarla, y la hidratación une lo escrito
>   durante su lectura), `R9-257` (una colección cuyo `pullAllLocal` falla se reintenta, y solo
>   ella) y `R9-258` (los comentarios). **Aceptado:** `R9-255`, con el porqué en `queueUnread`.
> - **1 nuevo:** `R9-259` (P3, lo abrió `R9-256`): la guarda de `R9-197` ya no tiene una prueba
>   que la vea sola.
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **259**. Detalle: `detail/S51-arreglos-s50.md`.
>
> **Sesión 52 (2026-10-03): revisión del diff de la 51**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. Rama `docs/review-s52-diff-s51`: mergeada y pusheada con el OK
> de Victor (`main` = `cc005d2`, CI verde en el log, run `37153675553`, 369/4558).
>
> - **7 nuevos, `R9-260`..`R9-266`, todos P3:**
>   - `R9-260` (lo abrió `R9-254`): dos hidrataciones a la vez (`start`, `stop`, `start` con la
>     primera lectura en vuelo): la segunda vuelve a meter la entrada vieja de un doc ya reeditado,
>     y sube encima;
>   - `R9-261` (lo abrió `R9-254`): una edición hecha durante la PRIMERA lectura, sin ningún fallo,
>     no llega a disco hasta que vuelve; si el proceso muere ahí, la vieja sube encima o la nueva no
>     sube nunca. Es `R9-255` sin las dos lecturas fallidas de su aceptación;
>   - `R9-262` (lo abrió `R9-256`): la lápida rechazada del todo con un reinicio entre medias deja
>     local nulo y nube R, y la entrada de `R9-256` decía lo contrario del caso en la sesión;
>   - `R9-263` (anterior; la afirmación es de la 51): la lectura fallida del flag repite el bulk
>     push entero, y su comentario sigue diciendo que los duplicados son inocuos;
>   - `R9-264` (anterior, vecino de `R9-257`): el `pullAllLocal` de `MemoryDeckContext` lee el ref,
>     vacío durante la carga, y no lanza;
>   - `R9-265` (la mitad de `R9-257` que no se cerró): `exportLocalData` salta un adaptador que
>     falla, y con total 0 el diálogo de migración no pregunta;
>   - `R9-266`: tres comentarios de la 51, medidos caso por caso.
> - Cada «¿lo abrió la 51?», con el motor de `af8a5ae` y, en la hidratación, con una lectura que
>   ve el disco de cuando se pidió (el `SerialExecutor` de AsyncStorage).
> - `R9-259` respondido: otra diferencia entre las dos guardas, una edición en cola con `getLocal`
>   nulo (la parte abierta de `R9-133`).
>
> **Queda 1 P0 abierto** (`R9-38`). Hallazgos: **266**. Detalle:
> `detail/S52-revision-del-diff-s51.md`.
>
> **Sesión 53 (2026-10-03): ARREGLOS de lo de la 52, y `R9-59` y `R9-38`**, en un chat nuevo,
> solo en la terminal y sin agentes. Dos ramas apiladas: `fix/s53-arreglos-s52` (7 commits,
> `6b768eb`..`3f73e50`) y, encima, `fix/s53-r59-r38` (`ea182dc` y `a85df96`). **Mergeadas y
> pusheadas con el OK de Victor** (`main` = `4807078`, CI verde en el log, run `37163774992`,
> 371/4582; corregido en la 54).
>
> - **Cerrados:** `R9-260` (una sola lectura de hidratación), `R9-262` (la guarda de `R9-256`
>   retiene en vez de asentar), `R9-263` (con el flag ilegible no se repite el push), `R9-264` (el
>   `pullAllLocal` de `memoryCards` espera a la carga), `R9-265` (una colección no leída no cuenta
>   como «nada que migrar») y `R9-266` (los comentarios). **Aceptado:** `R9-261`, con el porqué en
>   `persistQueue`.
> - **`R9-38` (el último P0) y `R9-59`, cerrados con la regla de Victor:** lo editado sin sesión
>   se encola para el dueño del almacén y sube cuando esa cuenta vuelve; otra cuenta solo recibe
>   los datos locales por la migración, tras la pregunta. La Mesa se guarda por cuenta
>   (`prepAccount.ts`).
> - **2 nuevos:** `R9-267` (P2, por lectura: una lectura fallida del mazo lo deja en `{}` y se
>   escribe encima) y `R9-268` (P3, por lectura: «Migrar» no migra nada a una cuenta que ya hizo
>   su bulk push aquí).
>
> **No queda ningún P0 abierto.** Hallazgos: **268**. Detalle: `detail/S53-arreglos-s52.md`.
>
> **Sesión 54 (2026-10-03): revisión del diff de la 53**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. Rama `docs/review-s54-diff-s53`: mergeada y pusheada con el OK
> de Victor (`main` = `a64786b`, CI verde en el log, run `37167615407`, 371/4582).
>
> - **4 nuevos:** `R9-269` (P1, lo abrió la 53: la unión de la Mesa «sin cuenta» borra el trabajo
>   del mismo pasaje), `R9-270` (P2, lo abrió la 53: con el marcador del dueño viejo, lo editado
>   sin sesión sube a la cuenta anterior), `R9-271` (P3: sin sesión, una lectura fallida deja la
>   edición sin subir) y `R9-272` (P3: el comentario de dos pruebas de `R9-193`).
> - Sin hallazgo: la cadena del dueño (AsyncStorage es un ejecutor serie), el `flush` en vuelo y
>   el conteo, el primer estado de auth, la lápida que espera (el coste de `R9-39`), el flag
>   ilegible siempre, y la matriz (157 de 157).
>
> **No queda ningún P0 abierto.** Hallazgos: **272**. Detalle:
> `detail/S54-revision-del-diff-s53.md`.
>
> **Sesión 55 (2026-10-03): ARREGLOS de lo de la 54**, en el mismo chat, solo en la terminal y sin
> agentes. Rama `fix/s55-arreglos-s54` (`4d0cae7`..`50f209d`): mergeada y pusheada con el OK de
> Victor (`main` = `5b5c630`, CI verde en el log, run `37173764215`, 371/4585; corregido en la 56).
>
> - **Cerrados los 4:** `R9-269` (la unión de la Mesa no pierde ninguna entrada, y las escrituras
>   y las uniones van de a una), `R9-270` (el almacén se reclama también con la sesión restaurada
>   y al cerrarla), `R9-271` (sin sesión, la cola ilegible se relee y la lectura del dueño se
>   reintenta) y `R9-272` (el comentario).
> - Ningún nuevo. La matriz de la 44 sobre `50f209d`: las 157 piezas
>   dan lo mismo que sobre `a85df96` (control: 0 de 285).
>
> **No queda ningún P0 abierto.** Hallazgos: **272**. Detalle: `detail/S55-arreglos-s54.md`.
>
> **Sesión 56 (2026-10-05): revisión del diff de la 55**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. Rama `docs/review-s56-diff-s55`: mergeada y pusheada con el OK de
> Victor (`main` = `fb7cc73`, CI verde en el log, run `37394756731`, 371/4585; corregido en la 57).
>
> - **2 nuevos, P3:** `R9-273` (el respaldo escribe la Mesa sin turno: restaurado mientras corre
>   una unión, se pierde; no lo abrió la 55, y su comentario lo daba por cubierto) y `R9-274` (por
>   lectura: si la unión de `deleteAccount` no llega, la Mesa de la cuenta borrada queda bajo un
>   uid que nadie usa).
> - Sin hallazgo: el turno no se traba; la unión repetida no acumula ni duplica; al borrar la
>   cuenta no se pierde nada que antes no (las cuatro Mesas tienen reloj: corregido el detalle de
>   la 55); el reclamo del efecto no se adelanta a la pregunta, y el de `signOut` no reabre la
>   carrera de los listeners; la relectura sin sesión no choca con la de `start()`; el reintento
>   del dueño retiene una lectura; la matriz (157 de 157).
>
> **No queda ningún P0 abierto.** Hallazgos: **274**. Detalle:
> `detail/S56-revision-del-diff-s55.md`.
>
> **Sesión 57 (2026-10-05): ARREGLOS de lo de la 56**, en el mismo chat, solo en la terminal y sin
> agentes. Rama `fix/s57-arreglos-s56` (`831c7e4`, `3be46d3`): mergeada y pusheada con el OK de
> Victor (`main` = `cbcc7df`, CI verde en el log, run `37400931622`, 372/4588; corregido en la 58).
>
> - **Cerrados los 2:** `R9-273` (el `multiSet` de `importBackup` va en el turno de la Mesa,
>   `prepTurn`) y `R9-274` (la cuenta cuya Mesa se devuelve queda anotada en disco, y el arranque
>   siguiente termina la unión; en `deleteAccount`, la unión va antes del reclamo).
> - Ningún nuevo. El motor no se tocó (sin matriz).
>
> **No queda ningún P0 abierto.** Hallazgos: **274**. Detalle: `detail/S57-arreglos-s56.md`.
>
> **Sesión 58 (2026-10-05): revisión del diff de la 57**, en un chat nuevo, solo en la terminal,
> sin agentes y sin tocar código. Rama `docs/review-s58-diff-s57`: mergeada y pusheada con el OK de
> Victor (`main` = `4a757ce`, CI verde en el log, run `37407024480`, 372/4588; corregido en la 59).
>
> - **2 nuevos, P3, ninguno abierto por la 57:** `R9-275` (una escritura de la Mesa resuelta para
>   una cuenta que se borra mientras espera, como el respaldo con su parte de SQLite en medio, queda
>   bajo el uid borrado; viene de `R9-59`) y `R9-276` (la nota de `R9-274` tiene un solo lugar:
>   otra devolución en el mismo proceso la pisa).
> - Sin hallazgo: el turno del respaldo no se traba; la unión que falla siempre no traba el
>   arranque; la migración con el dueño en la cuenta borrada mueve y `finishRelease` devuelve; las
>   pruebas de la 57 construyen su carrera y sus controles. El motor no cambió (sin matriz).
>
> **No queda ningún P0 abierto.** Hallazgos: **276**. Detalle: `detail/S58-revision-del-diff-s57.md`.
>
> **Sesión 59 (2026-10-05): ARREGLOS de lo de la 58**, en el mismo chat, solo en la terminal y sin
> agentes. Rama `fix/s59-arreglos-s58` (`fb7696f`, `37ba5f7`): mergeada y pusheada con el OK de
> Victor (`main` = `6667c40`, CI verde en el log, run `37417036066`, 372/4591; corregido en la 60).
>
> - **Cerrados los 2:** `R9-276` (la nota de la devolución es una lista, y el arranque las termina
>   todas) y `R9-275` (lo escrito para una cuenta ya devuelta: el store va a la «sin cuenta», y el
>   respaldo se escribe y se devuelve después).
> - Ningún nuevo. El motor no se tocó (sin matriz).
>
> **No queda ningún P0 abierto.** Hallazgos: **276**. Detalle: `detail/S59-arreglos-s58.md`.
>
> **Sesión 60 (2026-10-05): revisión del diff de la 59**, en el mismo chat (no es una mirada
> fresca: lo dice el detalle), solo en la terminal, sin agentes y sin tocar código. Rama
> `docs/review-s60-diff-s59`, sin mergear hasta el OK de Victor.
>
> - **Ningún hallazgo nuevo.** Medido: la nota con basura, ilegible o que crece con una cuenta
>   trabada no traba nada; el respaldo con su unión o su escritura fallando termina en el arranque
>   siguiente, y lo dice; cada store lee y escribe la misma clave en su turno, así que la redirección
>   es coherente. Una línea de log inexacta («Failed to give the Mesa back» cuando solo falló quitar
>   la nota), sin efecto. El motor no cambió (sin matriz).
> - El hilo de la Mesa (`R9-59` → `R9-269` → `R9-273`..`R9-276`) queda cerrado.
>
> **No queda ningún P0 abierto.** Hallazgos: **276**. Detalle: `detail/S60-revision-del-diff-s59.md`.
>
> **Sesión 61 (2026-10-06): ARREGLOS del mazo de memoria** (elegidos por Victor tras la 60), en un
> chat nuevo, solo en la terminal y sin agentes. Rama `fix/s61-mazo-r267-r133` (`57cab83`,
> `6d87069`, `d69c529`), apilada sobre la de la 60 porque esa tampoco está mergeada todavía. Sin
> mergear hasta el OK de Victor.
>
> - **Cerrados:** la parte del mazo de `R9-133` (`getLocal` espera a la carga y lanza si no leyó el
>   disco, y el ref se pone en cada escritura: también estaba la ventana de la sesión 23) y `R9-267`
>   (P2: no se escribe el mazo hasta leer el disco; la primera edición relee, y si falla, se escribe
>   lo de memoria).
> - **2 nuevos, P3, que ya existían:** `R9-277` (la carga reemplazaba lo escrito mientras estaba en
>   vuelo; cerrado en la misma rama, porque la relectura de `R9-267` lo necesita) y `R9-278` (una
>   edición durante el `multiSet` del respaldo lo pisa; abierto, por lectura).
> - Todo medido antes con el provider real (`_scratch/S61-sonda.test.tsx.txt`). 12 pruebas nuevas, y
>   cada pieza tumba la suya. El motor no se tocó (sin matriz).
>
> **No queda ningún P0 abierto.** Hallazgos: **278**. Detalle: `detail/S61-arreglos-r267-r133.md`.

---

## P0 — dinero, identidad, pérdida de datos, seguridad

> **Conteo, al día tras la sesión 26 (que arregló `R9-124`). Esta sección tiene 27 entradas: 26
> ARREGLADAS y 1 ABIERTA** (`R9-38`). `R9-14` cuenta como ARREGLADA por su **mitad
> estructural**, que es donde estaba su severidad; lo que queda de ella es una decisión de
> producto, dicha en su propia entrada — no código pendiente.
>
> **Las sesiones 7 y 8 venían contando mal.** Su lista de «arreglados» incluía `R9-50`, que
> vive en **P1**, no aquí — así que el «quedan 10» de la sesión 8 eran en realidad **11**.
> Cuenta siempre las entradas de ESTA sección, no los arreglos hechos. Si crees que `R9-50`
> debería ser P0 por su severidad (pérdida silenciosa, la UI dice «Guardado»), muévelo y di
> que lo moviste; lo que no vale es contarlo desde fuera.
> **Nota de la sesión 30:** el arreglo de `R9-182` depende del orden «rechazo antes que
> reversión». En el orden inverso el hallazgo no ocurre, y la espera queda armada hasta la entrega
> siguiente del doc. Y `R9-189` existe solo por este hilo único.

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
  **⚠️ Sesión 61, en el mazo:** si la recarga fallaba, la edición siguiente escribía el mazo de
  antes encima de lo restaurado (cerrado con `R9-267`); lo editado durante la recarga se perdía
  (cerrado con `R9-277`); y una edición mientras el `multiSet` del respaldo está en vuelo sigue
  pisándolo (`R9-278`, abierto).

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
  **⚠️ Sesión 22:** el tick periódico, lo único que reintenta cuando expira el backoff, no lo vigila ninguna prueba (`R9-148`).

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
  **✅ ARREGLADO en la sesión 24** (`6440ca0`):
  - `keepMine` relee lo local al resolver (`adapter.getLocal`) y sube eso re-sellado. Falla con
    error si la sesión terminó o si no hay copia local.
  - La pantalla muestra y siembra la fusión con lo local de AHORA (`readCurrentLocal`, que se
    relee al enfocar).
  - Revert por pieza: en el motor caen 2 pruebas, y en la pantalla, 3.
    **⚠️ Sesión 25: este arreglo abrió `R9-160` (P0).** «Lo local de ahora» es «lo mío» solo si lo
    escribió este teléfono. Si lo escribió el LWW de un cambio posterior del otro, «conservar lo mío»
    sube lo del otro.

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
  **✅ DESBLOQUEADO el 2026-10-03 (tras la sesión 51): Victor decidió `R9-59`, y con él la regla de
  este arreglo.** Si vuelve a entrar la misma cuenta, se sube lo editado con la sesión cerrada; si
  entra otra, se le pregunta antes (como `R9-166`). El mecanismo está delegado, sin repetir el bulk
  push entero (`R9-126`): ver la §7 de `CONTINUAR.md`. Queda por arreglar.
  **✅ ARREGLADO en la sesión 53** (`ea182dc`, rama `fix/s53-r59-r38`). **El cómo, decidido
  midiendo:**
  - Sin sesión, `queueWrite`/`queueDelete` encolan la entrada a nombre del dueño del almacén
    (`@local_store_owner_uid`, la última cuenta que inició sesión aquí; la constante pasó a
    `src/lib/sync/localStoreOwner.ts`). Espera como las de otra cuenta (`R9-22`) y sube cuando esa
    cuenta arranca, como una edición hecha sin red: las mismas guardas (`R9-176`, `R9-245`), sin
    bulk push (`R9-126`). La misma cuenta sube lo editado sin sesión, sin preguntar.
  - Otra cuenta nunca recibe esas entradas: los datos locales le llegan solo por la migración, tras
    la pregunta (`R9-23`, `R9-166`). Cuando el dueño vuelve, lo suyo sigue en cola a su nombre.
  - Sin dueño (nunca se inició sesión aquí), no se encola nada: el primer inicio de sesión sube todo
    con el bulk push.
  - El dueño se lee una vez por proceso, o lo dice el `start()` (la cuenta que arranca es la que
    `AuthContext` reclamó). Mientras se lee, las escrituras siguientes esperan detrás, las de la
    sesión también: si no, una edición nueva podía subir y salir de la cola antes de que entrara la
    vieja, y la vieja subía encima (medido: nube «viejo»).
  - `deleteAccount` escribe `(deleted)` en el marcador, y el motor olvida al dueño: nada espera a la
    cuenta borrada, y el inicio de sesión siguiente sigue preguntando. No `''`: el mock de
    AsyncStorage lo devuelve como `null`, y un dueño nulo deja de preguntar.
  - Cubre también lo editado durante el arranque en frío, antes del `start()`.
  - El motor existe aunque no haya sesión (`SyncEngineContext` lo crea una vez y lo para), así que
    los llamadores llegan a `queueWrite`. Se corrigieron los comentarios de `instance.ts` y
    `BackupService.ts`, que decían «no-op».
  - Pruebas nuevas: dos en `SyncEngine.test.ts` («R9-38 — lo editado sin sesion») y una en
    `AuthContext.test.tsx`. Cada pieza cae sola (`_scratch/S53-rev38.cjs.txt`: el dueño del
    `start()`, la cadena, `forgetStoreOwner`, la hidratación sin sesión, el marcador de la cuenta
    borrada, y todo). Las dos pruebas de `R9-193` que decían «sin sesión, `queueWrite` no hace nada»
    codificaban este bug: ahora dejan L2 fuera de la cola, y siguen cayendo con sus piezas de
    `stop()` (medido).
  - Su borde, a la vista: `R9-268`.
  - **⚠️ Sesión 54:** dos bordes medidos. Con el marcador del dueño viejo, lo editado sin sesión
    sube a la cuenta anterior (`R9-270`); y sin sesión, una lectura fallida deja la edición sin
    subir (`R9-271`).

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
  **✅ ARREGLADO en la sesión 24** (`9c425a8`, junto con `R9-106`):
  - Hay un conjunto «no asentado» (conflictos pendientes y docs saltados por `R9-46`) por
    colección y uid, persistido en `@sync_unsettled_<colección>:<uid>`.
  - El piso de cada enganche es `min(cursor, menor no asentado − 1)`, así que sobrevive a otros
    lotes y a los reinicios. Resolver, aplicar o un `removed` lo liberan.
  - Si el guardado falla, el propio cursor queda topado por debajo.
  - Revert por pieza: las 11 piezas discriminan, incluidas las que cruzan con `R9-153` (medido en
    local).
  - **Costo abierto, decisión de Victor:** mientras un conflicto siga sin resolver, cada enganche
    de esa colección vuelve a leer desde su piso. Se le puede poner un tope después.
    **⚠️ Sesión 25, el costo MEDIDO (en la nube, con el motor real):**
  - Cada enganche lee los docs distintos tocados desde el retenido más viejo, con la colección
    entera como techo.
  - Con 300 docs y un conflicto sin resolver: 300 por enganche desde el día ~180, y en un año
    300 928 lecturas contra 3 647.
  - Se agregan dos casos sin conflicto visible: un retenido que no vuelve a llegar queda retenido
    para siempre (`R9-164`), y un conjunto ilegible no se cura (`R9-165`).

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
  **⚠️ Sesión 22:** el arreglo le quitó las dos trampas a `handleNoteBlur`, pero `handleOpenIllustrations` y `handleOpenPulpit` las conservan (`R9-143`, P1).
  **⚠️ Sesión 24:** las mitades del blur y de `load()` de la carrera del stepper SÍ se pueden probar en
  jest. Lo que lo impedía era `NODE_ENV` (`R9-157`), no el renderer. Siguen sin prueba.

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
  **⚠️ Sesión 23:** el arreglo se sostiene, pieza por pieza: sin el arreglo caen la 1 y la 2, a
  medias con el ref cae la 2, y sin `if (written)` cae la 3. En web no hay `index.web.ts`, así
  que la misma clase tiene `getFavoriteById`, y en web no hay motor. Si un apply remoto del mismo
  favorito cae antes del render, se pierde la edición, pero es la raíz de `R9-133` y no la
  relectura (ver la nota allí). La prueba del vecino solo usa un favorito nuevo (`R9-155`), y la
  ruta citada arriba es `app/features/collections/[name].tsx` (`R9-156.4`).

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
  **⚠️ Sesión 23:** se sostiene. Leídos los 5 adaptadores registrados: ningún apply encola, así que no hay
  eco de OTRO doc que la supresión por doc deje pasar. Con el `removed` de `R9-124`, para el mismo
  doc no cambia nada, y para los otros mejora. Tres de los cinco sitios no tienen prueba
  (`R9-154`).

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
  **⚠️ Sesión 25, dos condiciones para el arreglo:**
  - Si ignora el `removed` de un doc que existe, tiene que **seguir soltándolo** del conjunto no
    asentado (`SyncEngine.ts:1012`), o el doc queda retenido para siempre (`R9-164`).
  - La consulta de si el doc existe es un `await` nuevo dentro del lote: después necesita su
    `isCurrent()` (`R9-153`), y tiene que ir FUERA de `withLocalWriteSuppressed`.
  - Mientras haya un doc retenido, el piso baja hasta él, así que este `removed` es menos probable.
    La 24 no lo empeoró.

  **Medido en el SDK NATIVO en la sesión 26** (Modo C, con el OK de Victor: emulador `Pixel_9_Pro`,
  APK debug vc73, RNFirebase 26.2.0, nunca el teléfono de Victor). Con el listener
  `where('updatedAt', '>=', 500)`:
  - una reescritura a 100 llega como **`removed`** por el mismo cliente online, por el mismo cliente
    offline (`fromCache`) y por otro cliente (PATCH por REST). El doc sigue existiendo, y `getDoc`
    lo encuentra con 100;
  - un `delete()` de verdad llega **igual**: `removed`, con la versión VIEJA y `exists: true`.
    `getDoc` dice que no existe, y la rama `|| !data` del motor nunca se dispara;
  - la limpieza está verificada desde fuera, solo con lecturas.

  **✅ ARREGLADO en la sesión 26** (`34de18f`, rama `fix/review-s26-removed`):
  - ante un `removed`, `getDoc` FUERA de `withLocalWriteSuppressed`, con `isCurrent()` después;
  - si el doc existe, pasa por el camino normal con sus datos de ahora (como sin filtro). Se retiene
    o se suelta según lo que resulte: un conflicto conserva su marca, a su `updatedAt` nuevo;
  - si no existe, se borra, salvo con un conflicto retenido (`R9-160`), y se suelta en los dos
    casos. Si la lectura falla, no se toca lo local;
  - el mock de `onSnapshot` emite `removed` al salir de la query en vez de filtrar.

  Hay 9 pruebas nuevas, y 8 caen sin el arreglo. Las 8 piezas y las 9 guardas de sesión de
  `handleSnapshot`/`applyRemoteChange`/`saveUnsettled` discriminan cada una. Detalle:
  `detail/S26-r9124-modo-c-y-arreglo.md`.

  **⚠️ Sesión 27, revisión del diff:** el arreglo se sostiene. También por el camino REAL de la
  cola (`queueWrite`, `flush` y el eco `removed` propio), que ninguna prueba recorre. `get()`
  offline sin caché rechaza con `UNAVAILABLE` (leído en la fuente), así que no borra. La matriz
  entera da lo mismo que en la 26. La lectura abre ventanas nuevas: `R9-176`, `R9-177` y
  `R9-178`, y agranda `R9-175`. Las pruebas y el diseño tienen `R9-179`, `R9-180` y `R9-181`.
  Detalle: `detail/S27-revision-del-diff-s26.md`.

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
  **✅ ARREGLADO en la sesión 24** (`e8c2031`, hecho en la nube y revisado en local): `signInWithGoogle` lee
  el dueño previo ANTES de bifurcar, y la rama sin anónimo pregunta igual que las otras dos.
  - Revert por pieza, medido en la máquina de Victor: sin la pregunta de la rama sin anónimo
    caen 4 pruebas; sin la de la rama de éxito del link (`R9-23`), caen 2.
  - Queda abierto que la guarda falla ABIERTA si no puede leer el marcador (`R9-158`), y que el
    skip queda armado si falla el sign-in (nota en `R9-127`). Detalle: `detail/S24-arreglos-en-la-nube.md`.
    **⚠️ Sesión 25:** la rama del link con éxito pregunta DESPUÉS de enlazar, y si la app muere con la
    pregunta abierta, el arranque en frío sube el almacén sin preguntar (`R9-166`).

- **`R9-160` (S25, `SyncEngine` / conflictos — regresión de `6440ca0`) — 🐛 con un conflicto
  pendiente, un cambio posterior del otro teléfono entra por LWW y pisa «lo mío»; desde la 24,
  «conservar lo mío» sube lo del OTRO.** CONFIRMADO con sonda de la sesión en la nube, con sonda
  propia del orquestador en la máquina de Victor y con revert.

  **El mecanismo:**
  - `applyRemoteChange` (`SyncEngine.ts:1148-1190`) no mira si el doc tiene un conflicto
    pendiente. Con el conflicto L/R abierto, el `R2` que el otro teléfono escribe 2 min después
    cae fuera de la ventana de 30 s, es más nuevo que lo local, y **se aplica por LWW**: L
    desaparece de SQLite y solo queda en la foto `conflict.localVersion`.
  - `6440ca0` (`R9-36`) hizo que `keepMine` suba lo local de AHORA (`:1661-1671`) y que la pantalla
    lo muestre como «Tu versión» (`readCurrentLocal`). Así, la pantalla muestra R2 como «Tu
    versión» y R como «Su versión» (las dos son del otro teléfono), y «conservar lo mío» sube R2.
  - L ya no aparece en ninguna pantalla. Solo queda en el registro de auditoría
    `users/{uid}/conflicts`, que no se muestra (`insights.tsx` solo cuenta).
  - Antes de `6440ca0`, «conservar lo mío» subía la foto L, y su eco, con `updatedAt` = ahora,
    volvía a poner L en local.

  **Sonda del orquestador** (`ae9c8e4`, `NODE_ENV=development`):
  `{"afterR2":{"local":"R2…","snapshotMine":"L…","tuVersionEnPantalla":"R2…"},"pushedByKeepMine":["R2…"],"auditLocalVersion":["L…"]}`.
  Con `keepMine` revertido a la foto, sube `["L: mi parrafo"]`.

  **Alcance:** el de `R9-36` (dos teléfonos editan el mismo doc dentro de 30 s), más que el otro
  siga editando antes de que el usuario abra la pantalla, que es justo lo esperable en un
  conflicto. Es pérdida de texto escrito a mano, así que P0, como `R9-36`. El caso de `R9-36`
  (seguir escribiendo en ESTE teléfono) sigue bien resuelto.

  **Arreglo (hipótesis, sin medir):** que un cambio remoto más nuevo sobre un doc con conflicto
  pendiente **refresque el conflicto** (su `remoteVersion`) en vez de aplicarse por LWW, sin
  confundir el eco de una escritura propia con un cambio del otro. Va con `R9-161`, que tiene la
  misma raíz. Detalle: `detail/S25-revision-del-diff-s24.md`.
  **✅ ARREGLADO en la sesión 25** (`9a7c2c7`; lo hizo la nube y se revisó en local):
  - Mientras el conflicto espera, el doc no toma nada de la nube. Lo que llega más nuevo que lo
    local es del otro: refresca «su versión» (`remoteVersion`, `differingFields`), y el doc sigue
    retenido. Lo que no es más nuevo es el eco de una escritura propia, y no cambia nada.
  - La lápida del otro pasa a ser «su versión»: la pantalla dice «Se borró en otro dispositivo».
  - Si el otro escribe lo mismo que L, el conflicto se disuelve.
  - Una marca en disco (`@sync_conflicted_<colección>:<uid>`, junto al conjunto no asentado) hace que
    el conflicto se vuelva a detectar tras un reinicio, aunque la nube ya esté fuera de la ventana.
  - Sonda del orquestador sobre la rama: lo local sigue en L, «su versión» es R2 y «conservar lo
    mío» sube L. Revert por pieza: discriminan 23 de 24 piezas (junto con `R9-161`); la que no cae
    es equivalente por construcción.
  - La premisa del eco tiene una ventana abierta: `R9-174`.
  - **Nota de la sesión 41:** su prueba del eco tardío entrega copias que el SDK no levanta, y el eco
    tardío de verdad, en conflicto, no tiene prueba propia: `R9-244`.

- **`R9-166` (S25, identidad) — 🐛 la rama del link con éxito pregunta DESPUÉS de enlazar: si la
  app muere con la pregunta abierta, el arranque en frío sube el almacén del dueño anterior a la
  cuenta nueva sin preguntar.** CONFIRMADO con sonda de la sesión en la nube y con sonda propia del
  orquestador (providers reales, 12 notas de Ana). En dispositivo, PLAUSIBLE: no se midió.

  **El mecanismo:**
  - `AuthContext.tsx:419` hace `linkWithCredential`: el anónimo de Beto ya ES su cuenta de Google,
    en el servidor y en disco. Recién después pregunta (`:425`) y reclama el almacén (`:427`).
  - Si el proceso muere con la pregunta abierta (Beto la cierra desde recientes, o Android la
    recicla en segundo plano), al volver Firebase rehidrata al usuario ENLAZADO.
    `onAuthStateChanged` lo entrega como no anónimo, `SyncEngineContext.tsx:93-96` arranca el
    motor, y `maybeRunInitialBulkPush` sube todo. El marcador sigue en el dueño anterior.
  - El marcador `@local_store_owner_uid` solo lo lee `signInWithGoogle`: nada lo mira al arrancar.
  - No lo introdujo la 24: el orden link → pregunta viene del arreglo de `R9-23` (sesión 8). Pero es
    la rama que `R9-125` dio por cerrada.

  **Sonda del orquestador:** con la pregunta abierta, el link ya pasó y no subió nada. Tras matar
  la app y arrancar en frío:
  `{"promptAfterColdStart":false,"pushesAfterColdStart":12,"owner":"ana-uid","flag":"2"}`.
  - Control (responde «Solo iniciar sesión»): 0.
  - Contraste, la rama de colisión: 0, porque el `signInWithCredential` todavía no pasó y el
    usuario sigue anónimo.
  - Si Beto vuelve a tocar «Iniciar sesión», la pregunta aparece, pero cuando las 12 ya subieron.

  **Arreglo (hipótesis):** que una pregunta sin responder no se pierda con el proceso. Por ejemplo,
  persistir «pregunta pendiente para el uid X» ANTES del link y, al arrancar, no publicarle ese
  usuario al motor hasta resolverla; o que el motor no haga el bulk push de un uid que no es el
  dueño registrado. Detalle: `detail/S25-revision-del-diff-s24.md`.
  **✅ ARREGLADO en la sesión 25** (`cf7c715`; lo hizo la nube y se revisó en local): la rama del
  link pregunta **ANTES** de enlazar, como las otras dos ramas lo hacen antes del
  `signInWithCredential`.
  - Una pregunta que muere con el proceso deja al usuario anónimo: no hay nada enlazado ni
    subido, y el próximo inicio de sesión vuelve a preguntar. No hace falta guardar estado.
  - El skip se arma recién cuando el link tuvo éxito, así que en esta rama un link que falla ya no
    lo deja armado.
  - Si el link choca (la cuenta ya existe), la rama de colisión usa la respuesta ya dada y no
    pregunta dos veces.
  - Sonda del orquestador: tras matar la app y arrancar en frío suben 0 (antes, 12).
  - Revert por pieza: las 5 piezas discriminan. Prueba nueva:
    `__tests__/AuthContextLinkPromptColdStart.test.tsx`, con los providers y el motor reales.

## P1 — núcleo de la app

- **`R9-161` (S25, `SyncEngine` / conflictos) — 🐛 «quedarme con lo suyo» aplica la foto remota de
  la detección y no sube nada: si la nube se movió desde entonces, el teléfono queda divergente
  para siempre.** CONFIRMADO con sonda de la sesión en la nube y con sonda propia del orquestador.
  Es anterior a la 24.

  **El mecanismo:**
  - `keepTheirs` (`SyncEngine.ts:1672-1682`) aplica `conflict.remoteVersion` sin encolar nada, y
    el cursor avanza al `updatedAt` de esa foto (`:1726-1730`).
  - Si el otro teléfono escribió R2 después (y `R9-160` ya lo aplicó en local), `keepTheirs` pone lo
    local en R, que es MÁS VIEJO. Si otro doc adelantó el cursor, tras reiniciar el piso queda por
    encima de R2, y R2 no vuelve nunca.
  - Lo mismo pasa si el usuario borró la nota en ESTE teléfono después de la detección. Desde
    `6440ca0`, «conservar lo mío» rechaza («no local copy») y «Combinar» no abre, así que «lo
    suyo» es la única salida: revive la nota solo aquí, y la lápida queda por debajo del piso.
  - La próxima edición local sube esa foto vieja y pisa la nube, así que la divergencia termina en
    pérdida.

  **Sonda del orquestador:**
  - con R2: `{"localAfterR2":"R2","localAfterKeepTheirs":"R","pushedX":[],"localAfterRestart":"R"}`,
    con el piso tras reiniciar en `…900000` y R2 en `…120000`;
  - con el borrado: `{"keepMineError":"…no local copy","localAfterKeepTheirs":"R","localAfterRestart":"R","nube":"lapida"}`.

  **P1 y no P0:** lo más nuevo sigue en la nube hasta que una edición posterior de este teléfono lo
  pise. **Tiene la misma raíz que `R9-160`:** un conflicto pendiente no se refresca cuando la nube se
  mueve. **Arreglo (hipótesis):** el de `R9-160` cubre el caso de R2. Para el borrado, `keepTheirs`
  tendría que subir lo que aplica, o no ofrecerse cuando la nube ya no tiene esa versión.
  **✅ ARREGLADO en la sesión 25** (`cf6e7f0`, junto con `R9-160`, que cubre el caso de R2):
  - El motor marca un conflicto cuando ESTE teléfono escribe su doc mientras espera (una edición o
    un borrado).
  - `keepTheirs` sube «lo suyo», re-sellado con la hora actual, solo si hay marca o una escritura
    propia de ese doc en la cola. Si «lo suyo» es un borrado, sube una lápida.
  - En el caso simple (la nube sigue en «su versión») no sube nada, como antes.
  - Sonda del orquestador: después del borrado, «lo suyo» sube R y la nube queda igual que el
    teléfono. Con R2, aplica R2 sin subir nada. Revert por pieza: ver `R9-160`.

- **`R9-153` (S23, `SyncEngine` / cuentas) — 🐛 `handleSnapshot` no tiene sesión: un conflicto
  de Ana registrado después del `stop()` pasa a la sesión de Beto, y resolverlo copia la versión
  de la NUBE de Ana a la de Beto.** CONFIRMADO con sonda del agente 1 y con sonda propia del
  orquestador, sobre `HEAD` (`714d627`, código = `00f69c4`). En dispositivo, PLAUSIBLE: no se midió.

  **El mecanismo (leído):**
  - El bucle de `handleSnapshot` (`SyncEngine.ts:889-1008`) hace un `await` por doc y nunca mira
    si hubo un `stop()`. `recordConflict` (`:1061`, dentro de `applyRemoteChange`) no tiene guarda
    de uid ni de sesión.
  - `stop()` vacía `this.conflicts` (`:459`), pero `start()` no (`:372-379`): solo llama a
    `stop()` si `this.uid` es otro, y después de un `stop()` es `null`. Lo que el lote registra
    después del último `stop()` se queda para quien entre.
  - `resolveConflict` (`:1367-1445`), con el único llamador en la pantalla de conflictos
    (`app/(tabs)/conflicts.tsx:106,137`): `logResolvedConflict` (`:1447-1468`) escribe
    `users/${this.uid}/conflicts/<id>` con `remoteVersion` = la copia de la nube de Ana, con
    cualquier elección. `keepMine` y `merge` además encolan el valor bajo la cuenta activa, y
    `keepTheirs` y `merge` lo aplican en local.

  **Medido** (sonda del orquestador, `_scratch/S23-sondas-orquestador/`):

  | Caso                                                      | Conflicto en Beto | Qué escribe en `users/uid-beto/`                          |
  | --------------------------------------------------------- | ----------------- | --------------------------------------------------------- |
  | control: el lote termina ANTES del `stop()`               | `[]`              | nada (antes del `stop()` existía `["test__a2"]`)          |
  | el lote termina con la sesión CERRADA; Beto entra después | `["test__a2"]`    | `conflicts/test__a2` con `remoteVersion: "remoto-de-ana"` |
  | el lote termina durante `start(beto)`, `keepMine`         | `["test__a2"]`    | `test/a2` + `conflicts/test__a2`                          |
  | el lote termina con la sesión CERRADA, `merge`            | `["test__a2"]`    | `test/a2` con el valor combinado + `conflicts/test__a2`   |

  Una vez registrado, el conflicto espera a quien entre en el mismo proceso, sin límite de
  tiempo. **La app real acota la ventana de registro:** `SyncEngineContext.tsx:92-127` vuelve a
  llamar a `stop()` cuando el usuario pasa a `null` y a anónimo, así que el lote tiene que seguir
  en vuelo después de que entra el anónimo, o durante el `start()` de Beto.

  **P1 y no P0 (decidido con Victor):** es de la clase P0 (mezcla entre cuentas), pero hacen falta
  tres cosas juntas:
  1. un conflicto real (local y remoto a menos de 30 s, con un campo material distinto) en un lote
     que siga en vuelo después del `stop()` reactivo;
  2. otra cuenta que entra sin reiniciar la app;
  3. que esa persona lo resuelva a mano.

  La copia local de Ana ya está en el teléfono por diseño (`R9-59`). Lo nuevo es lo que cruza de
  nube a nube.

  **No está en el diff de la 20: es su vecino.** Es la forma de siempre: el arreglo cierra el caso
  de su prueba y deja abierto el otro bucle con `await` que cruza un `stop()`. Búsqueda por la
  CLAVE (`recordConflict`, `logResolvedConflict`, `handleSnapshot`): no estaba. `R9-39` y `R9-65`
  son otra cosa. **Arreglo (hipótesis, sin medir):** darle a `handleSnapshot` la misma sesión que
  al flush, para que al volver de cada `await` después de un `stop()` corte sin registrar
  conflictos, sin mover el cursor y sin tocar el estado. Arreglaría también `R9-122.4`. **En la 24
  va después de `R9-124`**, que toca el mismo bucle. Detalle: `detail/S23-revision-del-diff-s20.md`.
  **✅ ARREGLADO en la sesión 24** (`a7d688e`): `handleSnapshot` tiene la sesión del flush. Al volver
  de cada `await` después de un `stop()`, el lote corta sin registrar conflictos, sin mover el
  cursor y sin tocar el estado; el lote vuelve a llegar en el próximo enganche del dueño. Las 6
  guardas de sesión discriminan una por una (medido en local).
  **⚠️ Sesión 25:** en `main` ya son 5 de 6. La guarda tras `applyRemoteChange` (`:1026`) dejó de
  discriminar cuando `9c425a8` puso otra guarda más abajo (`R9-162`). Además, `loadCursor`, que
  corre en el enganche, no tiene sesión (`R9-163`, la consecuencia de `R9-122.4` por otra puerta).

- **`R9-143` (S22, Mesa) — 🐛 «Banco de ilustraciones» y «Modo púlpito» guardan el sermón con las
  dos trampas que el arreglo de `R9-47` le quitó al `blur`: un toque justo después de cambiar de
  pasaje pisa el sermón del pasaje nuevo y borra lo que falte.** CONFIRMADO con sonda sobre la
  pantalla real y por la lectura del orquestador. En dispositivo, PLAUSIBLE: no se midió.

  **El mecanismo:**
  - `handleOpenIllustrations` (`app/features/prep/index.tsx:998-1008`) y `handleOpenPulpit`
    (`:1028-1038`) hacen `savePrepNote(table.passageKey, section, drafts[section] ?? '', …)` para
    todas las secciones de la plantilla, con un `await Promise.all` antes de navegar.
  - `handleNoteBlur` (`:1105-1129`) tiene las dos guardas de `R9-47`: no escribe una sección sin
    borrador, y archiva bajo `draftsPassageKeyRef`. Estos dos no tienen ninguna.
  - `drafts` solo cambia en `load()` (`:626`), en la relectura de foco (`:674`) y al teclear
    (`:1093`). Tras un cambio de pasaje, `table` ya es el nuevo y `drafts` sigue siendo el del
    anterior hasta que aterriza la lectura. Un toque en ese hueco escribe el sermón viejo SOBRE el
    nuevo, y `''` en cada sección que falte.

  **Sonda**, con el arnés de la prueba de regresión de `R9-47` y el mismo montaje que «does NOT
  wipe a section whose prose exists in the store but not in the drafts», tocando el botón en vez
  del `blur`: `{"before":{"bigIdea":"La idea central del pasaje"},"after":{},"rawAfter":"{}"}`. La
  entrada del pasaje se borra entera, y la prueba de `R9-47` solo vigila el `blur`. Otra ventana:
  volver del banco tras insertar una ilustración y tocarlo otra vez antes de que relea el foco.

  **P1 y no P2 (decidido con Victor):** no hace falta que falle nada, alcanza un toque rápido, y el
  comentario de `:895-917` dice que un toque rápido en el banco justo después de elegir una
  sugerencia **se observó en vivo**. `R9-47`, con la misma ventana, fue P0. `A9-mesa-persistencia.md:210-211`
  daba estos dos caminos por ✅. **Arreglo (hipótesis):** las dos guardas de `handleNoteBlur` en las
  dos funciones, con una prueba por botón. Detalle: `detail/S22-doble-check-puntos-3-4.md`.
  **✅ ARREGLADO en la sesión 24** (`03ad214`, `92cfc16`): los dos botones pasan por `flushDrafts`,
  con las dos guardas de `handleNoteBlur`.
  - Revert por pieza: con el `?? ''` de vuelta caen las 2 pruebas de borrado; con
    `table.passageKey`, las 2 de re-keying.
  - Esas 2 de re-keying fallaban al principio en la máquina de Victor por `NODE_ENV` (`R9-157`).
    **⚠️ Sesión 25: arreglado A MEDIAS.** La «otra ventana» que nombra esta entrada (volver del banco
    tras insertar y tocar otra vez antes de que relea el foco) sigue abierta cuando la sección ya
    tenía prosa: `R9-167`.

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
  - **⚠️ Sesión 23, otro disparador (inferido de la fuente, sin medir):** en el nativo, la
    escritura que `R9-104` deja aparcada para la cuenta anterior sale cuando esa cuenta vuelve,
    aun días después y tras reiniciar, con su contenido y su `updatedAt` viejos. El
    `set({merge:true})` incondicional puede pisar una edición más nueva hecha desde otro
    dispositivo. No lo introdujo la 20.
  - **⚠️ Sesión 26:** con `R9-124` arreglado, el otro listener ya no BORRA la versión restaurada: la
    pasa por el LWW. Si su copia local es más nueva, la conserva y no sube nada, así que la
    divergencia de esta entrada sigue igual.
    - Lo mismo pasa con un conflicto retenido que cae por debajo del piso: tras reiniciar vuelve a
      llegar, el LWW le da la razón a lo local, y el conflicto se disuelve sin que el usuario elija.
      Es esta entrada, no un hallazgo nuevo.
  - **⚠️ Sesión 27:** «el filtro deja de cambiar resultados» vale solo para la PRIMERA salida del
    doc. Un segundo cambio del mismo doc, también bajo el piso, ya no llega al listener (sonda D de
    A1: lo local queda en «respaldo 1» y la nube en «respaldo 2»).
    **Nota de la sesión 30 (A2):** `keepTheirs` también diverge cuando el motor no conoce la copia
    de la nube: la lectura del `removed` falló (Q3a) o sigue en curso (Q4). HX-push (subir «lo suyo»
    si el doc salió de la query) se descartó: resucita en la nube un doc que el otro borró de verdad
    (cae el control de `R9-178`).
  - **⚠️ Sesión 33 (medido, sonda `3b distinta`):** tras reiniciar con W en cola, la relectura
    encuentra una copia del otro MÁS NUEVA que W y distinta: el conflicto se registra y la marca
    queda en ella (`R9-197`, bien). Después sube W y la pisa en la nube; tras otro reinicio el
    conflicto y la marca desaparecen (la nube ya no la tiene, y W es propia), y el otro teléfono se
    queda con su copia. Es esta entrada, no un hallazgo nuevo.
  - **⚠️ Sesión 49 (medido, `_scratch/S49-sonda-lww.body.txt`, el caso `legible`): el disparador
    común, sin conflicto ni respaldo.** Una edición D espera en la cola sin red, y el otro escribe R
    60 s después. Al volver, LWW aplica R (fuera de la ventana de 30 s no hay conflicto) y la entrada
    de D sigue en la cola: sube encima. **Local R, nube D**, y el otro teléfono ignora D (más
    vieja). Era el control de la unión de `R9-212`, que con la cola sin leer descarta esa entrada.
    Es esta entrada, no un hallazgo nuevo.
    - **Arreglo (hipótesis, sin medir):** cuando LWW aplica una copia más nueva que la entrada en
      cola del doc, quitar la entrada, que ya perdió en este teléfono. Antes, preguntar qué vigila
      esa entrada mientras espera: sus relojes (`own`) y la guarda de `R9-245`.

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
    **⚠️ Sesión 24, otra puerta del mismo skip:** en `signInWithGoogle`, declinar la migración encola el
    skip en memoria ANTES del `signInWithCredential`. Si ese sign-in falla, el skip se aplica al
    próximo `start()` de cualquier uid. Ya pasaba en la rama de colisión, y `e8c2031` lo extendió a
    la rama sin anónimo. Lo reportó la sesión en la nube; está leído y no medido.
    **⚠️ Sesión 25: MEDIDO**, por la nube y con sonda propia del orquestador. Beto declina, el
    `signInWithCredential` falla por red, y en el reintento responde «Migrar». Resultado:
    `{"skipArmedBeforeRetry":true,"pushesBeto":0,"flag":"skip"}`, cuando el control (acepta a la
    primera) da 12 y `'2'`. El «Sí» explícito queda anulado para siempre.
    **⚠️ Sesión 25, después del arreglo de `R9-166`:** en la rama del link con éxito, el skip ya se
    arma recién cuando el link tuvo éxito, así que esa puerta se cerró. Siguen abiertas la rama sin
    anónimo y la de colisión (se arman antes del `signInWithCredential`), y el skip de
    `deleteAccount`. El arreglo de fondo (un skip por uid) toca `SyncEngine.ts` y `AuthContext.tsx`.

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
    **✅ ARREGLADO en la sesión 24** (`e8c2031`): el `claimLocalStore` del camino directo lo vigila
    ahora una prueba que pasa por las tres ramas. Quitado, caen 5 pruebas (medido en local).

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
  **⚠️ Sesión 23:** la matriz de reverts es cierta fila por fila (con dos precisiones en
  `R9-156.6`), y la ruta con `item.uid` no la discrimina ninguna entrada alcanzable, tampoco
  `deleteAccount`. No hay camino para dos flushes de la MISMA sesión. Con `stop()` + `start()` del
  mismo uid, una escritura sube dos veces y nada se pierde ni cruza (medido). Lo de la 21 sobre
  `R9-22` se confirma. **El vecino quedó abierto:** `handleSnapshot` no tiene sesión (`R9-153`).
  La limpieza de las cuentas anónimas no se puede re-verificar (`R9-156.5`).

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
  **⚠️ Sesión 23:** re-medido. Cae exactamente ella, y la aserción de la caché y la de `seen`
  discriminan cada una por su cuenta. Con `apiKey = ''` cae el control, no la aserción de `R9-9`.
  No hay otra línea vecina sin prueba. Su comentario sobre SecureStore es falso (`R9-156.8`).

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
  **✅ ARREGLADO en la sesión 24** (`9c425a8`), junto con `R9-39`: ver allí.

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
  **✅ ARREGLADO en la sesión 24** (`b8e812c`): el «Done.» enumera los packs y nombra el manifiesto
  como ÚLTIMO paso, con su ruta y el nombre con que se publica. Dos pruebas lo fijan, y cada una
  cae con su pieza revertida. (**⚠️ Sesión 25:** son TRES pruebas, y cada una cae con su pieza.)

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
  **✅ ARREGLADO en la sesión 24** (`d2b1cc7`, `44a5d15` y `0631557`):
  - El lector web hashea los bytes antes de importar (`sha256Hex`, en JS puro: unos 200 ms sobre
    4,7 MB) y rechaza el pack si no coinciden. Guarda como versión la de los bytes importados.
  - **Opción (b), decidida por Victor:** un navegador que YA tenía el pack sigue leyéndolo si el
    nuevo no verifica, con un aviso, y reintenta en el próximo arranque. Solo un navegador sin
    texto ve la pantalla de error. Cualquier otro fallo sigue tumbando el arranque.
  - Un pin que no es texto se trata como sin pin.
  - Revert por pieza: las 5 piezas discriminan (medido en local).
    **⚠️ Sesión 25:** la nube lo midió en Chromium headless, sobre el bundle real. Un navegador con
    el pack sigue leyendo; uno nuevo ve la pantalla de error; el `instanceof` sobrevive al bundle; y
    `sha256Hex` tarda 152–157 ms. Queda abierto que el fallo de red o el 404 del pack le quite la
    pantalla a un navegador que ya tiene texto (`R9-173`).

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
  **⚠️ Sesión 22:** con Node 20, `buildWebPacks` da cero aserciones, no «solo los casos que necesitan BD» (`R9-152`).

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
  **⚠️ Sesión 22:** el lector de nombres de export no tiene casos sintéticos, y sus 4 piezas se revierten con la suite verde (`R9-144`).

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
  **⚠️ Sesión 22:** re-confirmado con sonda en `HEAD`, sobre el `buildBackup()` real: `{"payloadPrepFields":["notes","series"],"fileContainsIllustration":false}`. El Banco de ilustraciones no viaja, y el propio `BackupService.ts:29-31` dice que exportar/importar es la ÚNICA vía para mover la Mesa entre dispositivos.

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
  **⚠️ Sesión 22 (re-verificado con SQLite real, `node:sqlite`): se sostiene, P1.** No es «una arbitraria»: SQLite devuelve la de menor `rowid`, o sea la que llegó primero a ESE dispositivo. Así, cada dispositivo muestra en el lector su propia nota y los dos divergen para siempre. Para la sonda ya no hace falta un dispositivo. Líneas de hoy: `:540-549`, `:2102` y `:2161-2177`. Vecino: `R9-145`.
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
  **⚠️ Sesión 22 (sonda): se sostiene en P1, y es peor de lo escrito.** Los llamadores son **5**, no 4, desde el origen. El quinto, «insertar ilustración» (`app/features/prep/illustrations/index.tsx:229`), hace `await savePrepNote` → `toast.success('Ilustración añadida a tu preparación.')` → `router.back()`. Con la escritura fallida, el usuario recibe una confirmación FALSA: la sonda da toast de éxito y la sección vacía. Los stores hermanos (`prepIllustrationsStore.ts:101-132` y `prepSeriesStore.ts:100-187`) se tragan igual (por lectura), así que el alcance es «la Mesa y sus bancos».
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
  **⚠️ Sesión 22 (sonda): se sostiene en P1.** El disparador es ancho: el lector llama a `markChapterRead` tras 5 s en cualquier capítulo. La prueba existente (`readingPlanProgressContext.test.tsx:65-82`) destilda sin haber leído el capítulo del día, así que no pasa por este caso. El toast real dice `✅ Día 1 de "<plan>" completado`. Líneas de hoy: `toggleDay` `:222-257`, el escaneo `:319-338` y `restartPlan` `:441-478`.

- **`R9-269` (S54, Mesa / `R9-59` — P1) — 🐛 la unión de la Mesa «sin cuenta» borra el trabajo del
  mismo pasaje: gana la entrada de la cuenta, y la otra se va con su clave.** MEDIDO con los stores
  reales (`_scratch/S54-prep.test.ts.txt`, `UNION`; `S54-prep-hoy.out.txt`). **Lo abrió `R9-59`**
  (`a85df96`): antes había una sola Mesa y nada se unía.
  - `joinPrep` (`src/features/study/prepAccount.ts`) escribe `{...source, ...target}` por pasaje y
    después hace `multiRemove` de la clave de origen. Un pasaje que está en las dos Mesas pierde la
    entrada de origen entera.
  - **Medido:** Ana tiene `John/3/16-21` con una sección; cierra sesión y, en la Mesa «sin
    cuenta», escribe ese pasaje (la sección, más nueva, y otra sección); vuelve a entrar con la
    misma cuenta (sin pregunta). Su Mesa queda con la versión vieja sola, y la clave «sin cuenta»
    ya no existe. CONTROL (otro pasaje): las dos entradas quedan.
  - **Disparadores:** la misma cuenta que vuelve; otra que responde «Migrar»; y un respaldo
    restaurado sin sesión (va a la Mesa «sin cuenta», y lo restaurado del mismo pasaje se borra al
    entrar). Al revés, `releasePrepAccount` (borrar la cuenta): gana la «sin cuenta».
  - Contradice la regla de Victor («cerrar sesión no borra nada», §7 de `CONTINUAR.md`) y el
    comentario de `prepAccount.ts` («A join keeps both maps»).
  - **Además, por el mismo `multiRemove` (`CARRERA`):** una escritura de la Mesa «sin cuenta» que
    cae entre las lecturas de la unión y su borrado se pierde. Por la interfaz no parece
    alcanzable: la unión corre durante el inicio de sesión.
  - P1 y no P0: hace falta el mismo pasaje en las dos Mesas (con la sesión cerrada, la Mesa de la
    cuenta no se ve). La pérdida es silenciosa y para siempre. **Decidido P1** por el orquestador,
    con la delegación de Victor («como mejor convenga», 2026-10-03); se arregla primero en la 55.
  - **Arreglo (hipótesis, sin medir):** no borrar la entrada que pierde. La unión mueve solo las
    entradas sin choque, y las que chocan se quedan en su clave (las de la «sin cuenta» siguen a
    la vista al cerrar sesión). O la más nueva por `updatedAt`, guardando la otra. La carrera se
    cierra pasando la unión por las colas de escritura de los stores, o borrando solo lo movido.
    **✅ ARREGLADO en la sesión 55** (`4d0cae7`, rama `fix/s55-arreglos-s54`), con el cómo en
    `prepAccount.ts`. La unión no pierde ninguna entrada: lo que el destino no tiene se mueve, y en
    la misma entrada se queda la del destino y la otra se queda donde estaba (al entrar, en la Mesa
    «sin cuenta», a la vista al cerrar sesión). Al borrar la cuenta, cuyo origen desaparece, gana
    la más nueva por `updatedAt` (sin reloj, la que ya estaba). Las escrituras de los cuatro stores
    y las uniones van de a una (`prepWrite`; la clave se resuelve antes de pedir turno). Prueba
    nueva («R9-269: volver a entrar no borra…», con el respaldo restaurado y la carrera forzada), y
    la de la 53 corregida: esperaba la clave «sin cuenta» borrada, y codificaba el defecto. Cada
    pieza cae sola (`_scratch/S55-rev269.cjs.txt`: todo, la unión, el turno y «gana la más nueva»).
    **⚠️ Sesión 56:** el respaldo escribe la Mesa sin turno, y restaurado durante una unión se
    pierde (`R9-273`, P3; no lo abrió la 55). Las cuatro Mesas tienen reloj (`updatedAt`), no solo
    las notas y las series: al borrar la cuenta, gana la más nueva en todas. `R9-273`, arreglado
    en la 57 (`831c7e4`).

---

## P2 — resto + pulido

- **`R9-144` (S22, compuerta de paridad web/nativo) — 🐛 el lector de nombres de export que
  arregló `R9-67` no tiene ni un caso sintético.** CONFIRMADO por revert y sonda.
  - Se revirtió en `webNativeModuleParity.test.ts`, una por una, cada forma que lee el lector:
    - la lista `export {x}`;
    - `export * from` → `unresolvable`;
    - la desestructuración;
    - el catch-all final.

    Las 4 dejan **77/77 verde**.

  - Consecuencia medida: `R9-13` al pie de la letra EN FORMA DE LISTA (el nativo con
    `export {hasRedLetterData};` y el `.web` sin exportarla). Con el lector intacto cae 1 prueba;
    con una sola línea del lector revertida, 77/77. Es el estado exacto que describía `R9-67`.
  - Las mediciones de la sesión 13 fueron sondas que se restauraron, no pruebas que quedaran en el
    repo. «Sus 6 pruebas discriminan» (`S14:7`, `:26`) es falso para `R9-67`.
  - P2 y no P1: el código de hoy funciona, y para que se pierda alguien tiene que tocarlo. Es la
    clase de `R9-86` y de `R9-137`..`R9-141`.

- **`R9-145` (S22, notas — P3) — 🐛 el `book_name` que llega de la nube o de un respaldo no se
  canonicaliza, y la nota queda invisible para el lector.** El mecanismo está CONFIRMADO con sonda
  (SQLite real); que llegue a pasar es PLAUSIBLE.
  - `applyRemoteUpsert` (`adapters/notes.ts:100-114`) y el import (`BackupService.ts:1441-1454`)
    escriben `book_name` tal cual. `getNoteForVerse` (`index.ts:2173`), en cambio, canonicaliza su
    argumento.
  - Una nota con `"Juan"` no la ve el lector, que crea otra: la sonda da `{"readerSees":null}` y dos
    filas.
  - Solo la alcanzan datos escritos antes del Sprint 58 (`ad782e2`, 2026-06-01), porque todos los
    escritores de hoy canonicalizan.
  - `migrateCanonicalBookKeys` ya corrió y no lo cura, y además convierte `"Juan"` y `"John"` del
    mismo versículo en dos notas canónicas.

- **`R9-146` (S22, planes — P3) — 🐛 borrar un plan propio deja su progreso, y re-crearlo o
  re-importarlo desde Juntos lo resucita ya terminado.** CONFIRMADO con sonda:
  `{"entryStillStoredAfterDelete":true,"afterRecreate":{"completedDays":[1,2],"completedAt":true}}`.
  - Que el progreso sobreviva al borrado es una decisión documentada (`CustomPlansContext.tsx:46`).
    Lo que habría que decidir es su efecto: re-importar un plan «para otra vuelta» trae el progreso
    viejo sin avisar, y destildar no se sostiene (`R9-54`).
  - Abre la segunda vía de `R9-64`.
  - El docstring de `restartPlan` (`:111-121`, «a FINISHED plan») está viejo.

- **`R9-147` (S22, memoria — P3) — 🐛 el pronóstico de repasos etiqueta mal los días de la semana
  cerca del cambio de hora.** CONFIRMADO con la expresión literal y `TZ=Europe/Madrid`.
  - `weekdayShort` (`app/features/memory/insights.tsx:828-831`) suma bloques de 24 h, mientras que
    los buckets salen de días calendario.
  - La víspera del adelanto a las 23:30, las 6 etiquetas futuras se corren un día
    (`0:sab 1:lun 2:mar…`).
  - Es la forma de `R9-63` en un archivo que la entrada no nombra. Es cosmético.

- **`R9-148` (S22, prueba de sync — P3) — 🐛 el flush del tick periódico (`SyncEngine.ts:760-772`)
  no lo vigila ninguna prueba.** CONFIRMADO por revert.
  - Desde `R9-33`, es lo único que reintenta una entrada cuando expira su backoff sin que pase otra
    cosa. Una sonda que solo avanza el reloj vacía la cola a los 69 min.
  - Con `// void this.flush();` en el `setInterval`, las 364 suites reales siguen verdes.
  - Consecuencia de la regresión: una escritura que falla una vez queda parada hasta el próximo
    arranque, o hasta que se edite ese documento. No se pierde, porque la cola está persistida.

- **`R9-149` (S22, build de packs — P3) — 🐛 la pieza de `R9-74` que distingue «no se pudo LEER»
  de «ausente» no tiene prueba.** CONFIRMADO por revert.
  - `if (error.code === 'ENOENT') return null;` → `return null;` (`scripts/build-web-packs.js:282-293`)
    deja 63/63 verde.
  - Hoy la respalda `R9-83`: sin `--allow-shrink`, una base `null` aborta. Pero su mensaje dice
    «deleted or moved file», que es falso para un archivo presente e ilegible.
  - **Con `--allow-shrink`**, la regresión apaga todas las comparaciones y reescribe el manifiesto:
    es `R9-74` entero de vuelta.

- **`R9-150` (S22, lector web — P3) — 🐛 `R9-69` reabierto por la ida y vuelta: al volver de B a A
  con el pack de B en vuelo o FALLADO, el primer render pinta los offsets de A sobre el texto de
  B.** CONFIRMADO con el lector web y `redLetterText.web` reales:
  `mismatched: [{"offsetsFor":"RVR1960","textFrom":"WEB"}]`.
  - `redLetterReady` (`[chapter].web.tsx:132-133`) no mira de qué versión son los `verses` en
    estado. La prueba de `R9-69` solo recorre el cambio de ida.
  - Con `R9-71`, un pack que falla no se asienta, así que la ventana dura todo lo que se lea en B.
  - Es un render transitorio, sin pérdida de datos. «La ventana de `R9-69` está cerrada por otra
    cosa» (`S14:92-97`) era falso para este camino.

- **`R9-151` (S22, build de packs — P3) — 🐛 la respuesta «no pude comprobar» (`null`) de
  `filesNotPinnedBy` no la vigila ninguna prueba.** CONFIRMADO con sonda (el `main()` real, con el
  primer rename forzado a fallar).
  - Colapsar a `[]` la rama `!previous` o la rama `pinned.size === 0` deja 63/63 verde.
  - En los dos casos, FIRST FILE vuelve a decir «_IS coherent - one run, whole_» sin manifiesto, o
    con uno que no pina ningún sha256.
  - La baseline del fixture no lleva `file` ni `sha256`, así que la prueba que falta cabe en el
    mundo que el archivo ya tiene.

- **`R9-152` (S22, compuerta de packs — P3) — 🐛 bajo un Node sin `node:sqlite`, `buildWebPacks`
  no ejecuta NI UNA aserción, contra lo que dicen `S16:102-105` y el comentario de
  `build-web-packs.js:60-69`.** CONFIRMADO con Node 20.20.2 real: 63/63 rojas, todas por
  `No such built-in module`.
  - La causa es el `beforeAll` de nivel de archivo (`:45-59`), que llama a `buildPack` desde
    `1d96a40`. Con él envuelto en un `try`, corren 37 pruebas de lógica pura, y las 26 rojas son las
    que sí necesitan base.
  - Hoy lo tapan el CI en Node 24 y `ciNodeVersion`. Solo lo ve un desarrollador con Node 22.0–22.12.

- **`R9-154` (S23, prueba de sync — P3) — 🐛 tres de los cinco sitios de
  `withLocalWriteSuppressed` y su conteo de profundidad no los vigila ninguna prueba.** CONFIRMADO
  por revert (agente 1).
  - Revertida por separado la supresión del `removed` (`SyncEngine.ts:923`), la de `keepTheirs`
    (`:1398`), la de `merge` (`:1412`) y la profundidad del `Map`, `SyncEngine.test.ts` sigue en
    73/73.
  - El impacto hoy es nulo: ningún apply de los 5 adaptadores registrados encola, así que la supresión es solo
    defensiva.
  - Importa para la 24: el arreglo de `R9-124` toca justo el sitio del `removed`. Si consulta si
    el doc existe, que lo haga FUERA de `withLocalWriteSuppressed`, para no alargar la supresión a
    un viaje de red.
    **✅ ARREGLADO en la sesión 24** (`42f6afb`): hay pruebas para `keepTheirs`, para `merge` y para la
    profundidad, y cada una cae con su sitio revertido. El sitio del `removed` queda para `R9-124`.
    **Sesión 26:** hecho. La lectura de si el doc existe va FUERA de la supresión, y la prueba «la
    lectura va FUERA de la supresion» cae si se la mete dentro (`34de18f`).

- **`R9-155` (S23, prueba de favoritos — P3) — 🐛 la prueba de `R9-102` cubre «la edición
  anterior del mismo favorito» solo con un favorito NUEVO.** CONFIRMADO con sonda (agente 2).
  - Un arreglo a medias (el ref, y SQLite solo si el favorito no está en el ref) pasa las 3
    pruebas de `favoritesUpdateQueuesSync.test.tsx`.
  - Esa versión pierde la nota de un favorito EXISTENTE editado dos veces sin render en el medio:
    `{"note":"nota vieja","tags":["Evangelio"]}`. En `HEAD` la misma sonda pasa: el código
    está bien, y lo que falta es la prueba.

- **`R9-156` (S23, docs y comentarios de la 20 — P3, agrupado).** Medidos contra el código, git y
  el mundo (agente 3; 25 de 30 afirmaciones son ciertas):
  1. `SyncEngine.ts:271-272` dice que el SDK nativo «was not measured». Se midió después, en
     `e54208f`.
  2. `INDEX.md:167,174` y `CONTINUAR.md` dicen «no lo devuelve nunca» y «pendiente para siempre».
     Según la fuente del SDK, la promesa vuelve si la cuenta anterior regresa en el mismo
     proceso. El detalle, esta entrada y `cfa7c1c` lo dicen bien.
  3. «El flush viejo no toca nada más» no es literal. Después del corte hace `persistQueue()`
     (`:1747`), y como `erroredOut` sigue en `false` en el corte del `catch`, puede lanzar un
     `flush()` de la sesión nueva (`:1776-1782`). Es inocuo mientras el candado esté en su sitio.
  4. `R9-102` y el commit `00f69c4` citan `app/collections/[name].tsx`. La ruta real es
     `app/features/collections/[name].tsx:114`.
  5. Los uid de las 5 cuentas anónimas de la sonda de `R9-104` no quedaron escritos en ningún
     lado, así que su borrado no se puede re-verificar. El de los docs sí: una consulta
     collection-group de `r9104probe`, solo de lectura, da 200 y 0 docs (con un control que
     devuelve 1).
  6. La matriz de reverts de `R9-104` tiene dos precisiones:
     - «soltar el candado en `stop()`» son dos piezas: sin `flushInFlight = false` caen la 2 y
       la 3, y sin `flushSession += 1` caen la 1, la 3 y la 4;
     - el corte de éxito lo cubren la guarda de `pushOne` y el corte del `catch` JUNTOS.
  7. Las pruebas 1 y 4 de `R9-104` son defensivas: inyectan desenlaces que ningún SDK medido
     produce al cambiar de usuario. La rama realista, «vuelve Ana», no la cubre ninguna prueba, y
     `mockSetGate` no mantiene el orden de escrituras de un mismo usuario.
  8. La prueba de `R9-105` dice que el SecureStore aislado es otra instancia, y es la MISMA
     (`outerStoreHasPreseed:"true"`). RevenueCat sí es otra. No cambia lo que discrimina.

- **`R9-157` (S24, compuerta local / jest — P2) — 🐛 la compuerta local dependía del `NODE_ENV` del
  shell: verde en CI y roja en la máquina de Victor.** CONFIRMADO.
  - La máquina de Victor tiene `NODE_ENV=development` como variable de usuario de Windows, y jest
    pone `test` solo si la variable NO existe (`jest-cli/bin/jest.js`).
  - Con otro valor, el driver nativo de `Animated` lanza «Unable to locate attached view in the
    native tree» (`AnimatedProps.js:281`) cuando un re-render cambia el `disabled` de un
    `TouchableOpacity`. Además cambian las transformaciones de babel.
  - **Consecuencias:**
    - las 2 pruebas de re-keying de `R9-143` dieron verde en la nube y en CI, y rojo en local;
    - la creencia de que «react-test-renderer desmonta la Mesa» (citada en ~12 suites y en la
      memoria) era ESTO, y por ella quedaron sin prueba las mitades de `R9-47`.
  - **✅ ARREGLADO en la sesión 24** (`03d45ad`, `dc8db54`, `f80a2c6`, `b59a3ab` y `3a23e76`):
    - `jest.config.js` fija `process.env.NODE_ENV = 'test'`;
    - la compuerta `__tests__/jestNodeEnv.test.ts` tiene dos capas: dentro de jest, y cargando la
      configuración en un proceso hijo, así que el CI también la ve;
    - se corrigieron los comentarios que culpaban al renderer. En esos 16 archivos solo cambiaron
      comentarios (medido).
  - Medido en local con `development`: sin el pin caen las 4 pruebas de la compuerta.

- **`R9-158` (S24, identidad — P2, decisión de Victor) — 🐛 la guarda de dueño de `R9-23`/`R9-125`
  falla ABIERTA si no puede leer el marcador.** Leído por el orquestador.
  - `getLocalStoreOwner` (`AuthContext.tsx:90-98`) devuelve `null` si la lectura falla. Las tres
    ramas lo leen como «no hay dueño previo, no preguntes», y el bulk push sube el almacén entero.
  - Es a propósito, según su comentario («behave as before this existed rather than interrogating a
    user who may well be the rightful owner»).
  - Es la clase de `R9-134`. **Decide Victor:** fallar cerrado (preguntar) o abierto, como hoy. Lo
    reportó la sesión en la nube.
  - **⚠️ Sesión 25: MEDIDO** (en la nube, con el motor real). Con el marcador ilegible no se
    pregunta, y suben las 12 notas de Ana, tanto en la rama sin anónimo como en la del link con
    éxito. Los controles, con el marcador legible, preguntan y suben 0.
  - **Corrección:** son DOS ramas, no tres. La de colisión no usa el dueño: pregunta siempre que
    haya datos.
  - **Del otro lado, leído:** `claimLocalStore` (`:100-109`) también se traga el fallo de ESCRITURA.
    Conviene decidirlo junto.

- **`R9-159` (S24, arnés de pruebas — P3) — 🐛 en unas 41 suites el mock de `useRouter` devuelve un
  objeto nuevo en cada render, así que ninguna ve una dependencia faltante de `useCallback` sobre
  `router`.** PLAUSIBLE: lo reportó la sesión en la nube, con `prepTableScreenPremium.test.tsx` como
  ejemplo, y el orquestador no lo verificó.
  - El `useRouter()` real devuelve un objeto estable. El arnés de
    `prepTableScreenPassageKeying.test.tsx` ya lo imita desde la sesión 24, y el resto no.
  - **⚠️ Sesión 25: MEDIDO por la nube.** Con el router estable, quitar `flushDrafts` de las deps
    de `handleOpenIllustrations` hace caer una prueba; con un router nuevo por render, la misma
    regresión pasa en verde. Por `grep`, son 42 suites.

- **`R9-162` (S25, prueba de sync — P2) — 🐛 la guarda de `handleSnapshot` tras `applyRemoteChange`
  (`SyncEngine.ts:1026`) ya no la vigila ninguna prueba.** CONFIRMADO: la nube lo midió con la
  matriz y en un worktree de `a7d688e`, y el orquestador, en la máquina de Victor: sin esa línea, la
  suite del motor da **104/104 en verde** en `main`.
  - En `a7d688e` su quita hacía caer 1 prueba. Dejó de discriminar al apilar `9c425a8`. En todas las
    pruebas de `R9-153`, el `stop()` cae durante el `getLocal`, así que el lote hace `hold()`, y la
    guarda nueva tras `saveUnsettled` (`:1074`) corta antes del cursor.
  - Ninguna prueba hace caer el `stop()` durante el APPLY de un lote, que es donde `:1026` es la
    única guarda. Sin ella (medido por la nube), el cursor de Beto pasa a ser el de Ana, en memoria
    y en disco (`R9-122.4` entero), y la clave de no asentados de Beto guarda un doc de Ana.
  - El código de `main` está bien: es un hueco de prueba sobre una línea que evita defectos de la
    clase de `R9-153` y `R9-122.4`. Es la regla de §5: un arreglo posterior desarmó la prueba de
    otro.
  - **✅ ARREGLADO en la sesión 25** (`542603b`, solo pruebas): dos pruebas hacen caer el `stop()`
    durante el APPLY de un lote. Sin la guarda caen las 2 (medido en local).

- **`R9-163` (S25, `SyncEngine` / cuentas — P2) — 🐛 `loadCursor` no tiene sesión: el cursor de Ana
  que se leía al salir queda en el caché de Beto.** MEDIDO por la nube, sin re-medir en local.
  - `SyncEngine.ts:1206-1262` hace `this.cursors.set(collection, value)` después de su `await`, sin
    mirar la sesión. La 24 le puso sesión a su gemelo `loadUnsettled` (`:1377-1380`), no a este.
  - Si el `stop()` cae con el `getItem` del cursor de Ana en vuelo y entra OTRA cuenta en el mismo
    proceso, el primer enganche de Beto sale con el piso de Ana (`cursorAna − 5 min`), su historial
    viejo no baja, y su primer `advanceCursor` persiste ese valor.
  - Es la consecuencia de `R9-122.4` por otra puerta, igual de estrecha. De paso (leído): la rama de
    `R9-35` en el mismo `loadCursor` (`:1243-1245`) hace `removeItem` con el `this.uid` del momento.

- **`R9-164` (S25, `SyncEngine` / cuota — P2) — 🐛 un doc retenido en el conjunto no asentado que no
  vuelve a llegar queda retenido para siempre, sin conflicto que resolver.** MEDIDO por la nube,
  sin re-medir en local.
  - Un doc sale del conjunto solo si el listener lo vuelve a entregar, o si llega su `removed` con
    el listener vivo. Nada lo caduca (`loadUnsettled`, `:1345-1387`).
  - **Cómo se llega:**
    - Un `deleteAccount` que borra la nube y después falla (por ejemplo, el usuario cancela la
      re-autenticación) vuelve a `start(uid)` con los retenidos huérfanos.
    - Un respaldo restaurado en otro teléfono reescribe el doc por debajo del piso mientras esta
      app está cerrada.
  - Con la app reiniciada, el conflicto tampoco se ve: `stop()` vacía `this.conflicts`, y el doc no
    vuelve para detectarse.
  - El piso de la colección queda clavado para siempre en el retenido (ver el costo medido en
    `R9-39`).
  - La decisión abierta de Victor («un aviso si un conflicto lleva N días») **no lo cubre**, porque
    aquí no hay conflicto que avisar. Es condición para el arreglo de `R9-124`.
  - **⚠️ Sesión 26: cerrada la mitad «en vivo», sigue ABIERTO.**
    - El arreglo de `R9-124` (`34de18f`) cubre el doc retenido que sale de la query con el
      listener vivo. Si existe, se retiene a su `updatedAt` nuevo (el piso baja y vuelve) o se
      suelta; si no, se suelta. Lo vigila la prueba «R9-164: un doc retenido que sale de la query no
      deja el piso clavado».
    - Los dos disparadores de arriba no pasan por el listener: el respaldo del otro teléfono con
      esta app CERRADA y los huérfanos de un `deleteAccount` fallido. Siguen clavando el piso.
  - **⚠️ Sesión 27: un tercer disparador.** La mitad «en vivo» queda cerrada solo si el lote
    TERMINA. Un `stop()` o la muerte del proceso durante la lectura del `removed` de un doc
    retenido lo deja retenido para siempre. Sonda C de A1: el piso queda en retenido-1-margen en
    dos arranques seguidos. Antes de la 26 esa ventana era un `await` local; ahora es un viaje de
    red (ver `R9-175` y `R9-177`).
    **Nota de la sesión 30 (A3):** con la app cerrada, una copia del otro reescrita bajo el piso no
    vuelve nunca en el mock (el caso `app-cerrada` a 10 min de `R9-193`): la marca queda fija y el
    piso retenido. Sin medir en nativo, donde la caché probablemente la entregue.

- **`R9-165` (S25, `SyncEngine` / cuota — P3) — 🐛 un conjunto no asentado ilegible en disco no se
  cura: cada enganche relee la colección entera.** MEDIDO por la nube.
  - Con la clave ilegible, `loadUnsettled` (`:1369-1381`) devuelve piso 0 y un conjunto vacío.
  - Como `settle()` sobre un conjunto vacío no cambia nada, no se llama a `saveUnsettled` (`:1070`),
    y la clave rota sigue en disco. Con 50 docs: 50 en cada enganche. El control, un cursor
    ilegible, se cura en el primero.

- **`R9-167` (S25, Mesa — P2) — 🐛 la «otra ventana» de `R9-143` sigue abierta si la sección ya
  tenía prosa: tocar Púlpito o el banco antes de que relea el foco borra la ilustración recién
  insertada.** MEDIDO por la nube, sin re-medir en local.
  - El banco (`illustrations/index.tsx:222-229`) lee lo guardado, agrega la ilustración y guarda.
  - Al volver, la Mesa sigue con el borrador de `application` de ANTES, hasta que aterriza la lectura
    del foco (`index.tsx:663-690`).
  - `flushDrafts` (`:988-998`) escribe todas las secciones con borrador. La guarda de «ausente» no
    salta porque el borrador existe, aunque viejo, y la escritura pisa la inserción.
  - Medido: con la sección vacía antes de insertar, la ilustración sobrevive. Con prosa,
    `"afterPulpitTap":"Mi aplicación escrita a mano"` y `"illustrationSurvives":false`.
  - P2: la prosa escrita a mano sobrevive, y la ilustración sigue en el banco para volver a
    insertarla.

- **`R9-168` (S25, Mesa — P3) — 🐛 el ref de la clave y los borradores se mueven en momentos
  distintos: un handler del render anterior puede escribir un sermón sobre otro.** MEDIDO por
  construcción en jest, por la nube. El toque real está inferido.
  - `draftsPassageKeyRef.current` se asigna en la microtarea donde aterriza la lectura
    (`index.tsx:626-628`, `:674-675`). `setDrafts` solo agenda un render.
  - Un evento procesado en ese hueco llama a un handler del render viejo (borradores del pasaje
    anterior) con el ref ya movido. Medido: `{"rangeBigIdeaAfterStaleTap":"Sermón de 3:16"}`. Es la
    consecuencia de `R9-47`, en una ventana de una tarea del hilo JS.
  - **Arreglo (hipótesis):** que los borradores lleven su clave dentro del mismo estado.

- **`R9-169` (S25, prueba de la Mesa — P3) — 🐛 que los botones ESPEREN el flush antes de navegar
  no lo vigila ninguna prueba.** MEDIDO por la nube: con `void flushDrafts()` en los dos botones
  (`index.tsx:1018`, `:1038`), las 8 pruebas de `prepTableScreenPassageKeying.test.tsx` siguen en
  verde. El comentario de `handleOpenPulpit` explica por qué hace falta esperar.

- **`R9-170` (S25, build de packs — P3) — 🐛 los packs web no son reproducibles entre versiones de
  SQLite: el mismo texto da otro sha256.** MEDIDO por la nube.
  - Con SQLite 3.51.2 los dos packs salen con el mismo tamaño y `verseCount`, y con otro sha256.
  - Cambiando SOLO los bytes 96-99 de la cabecera (`SQLITE_VERSION_NUMBER`) a `3050004`, los dos sha
    coinciden exactamente con los pines de `ae9c8e4`.
  - Reconstruir con otro Node cambia los pines sin cambiar una letra. Con `R9-109`, publicar packs de
    una máquina con el manifiesto de otra deja a los navegadores nuevos en la pantalla de error.
  - El `note` de `web-bootstrap.json` dice «byte-identical». **Arreglo (hipótesis):** normalizar la
    cabecera al construir, o pinar la versión de Node del build.

- **`R9-171` (S25, compuerta local — P3) — 🐛 la suite depende de la zona horaria: roja en Madrid
  (1 prueba) y de UTC+12 a UTC+14 (2).** MEDIDO por la nube, en Linux.
  - `dailyVerseHistory.test.ts:70-75` cae en Madrid. Delata el defecto real de `R9-172`.
  - `readingInsights.test.ts:10-16` cae de UTC+12 en adelante. Esa falla sí es del fixture: escribe
    a mano `'2026-06-02'` como «hoy». Su comentario, «stays correct at positive TZ offsets >=
    UTC+12», es falso.
  - `LANG` en español, `CI` y `NODE_ENV` no cambian nada. En `America/Mexico_City` todo da verde,
    por eso nadie lo vio. Es la clase de `R9-157`.

- **`R9-172` (S25, contenido diario — P3) — 🐛 el versículo, el dato bíblico y la profecía «del día»
  cambian a la 01:00 (o a las 23:00) con horario de verano.** MEDIDO por la nube.
  - `getDayOfYear` (`src/constants/daily-verses.ts:262-266`) y sus dos gemelas
    (`bibleFacts.ts:268-271`, `messianicProphecies.ts:723-726`) restan `new Date(año, 0, 0)`, que
    está en horario de invierno.
  - Horas de 2026 con el día equivocado: 210 en Madrid, 238 en Nueva York y 154 en Santiago; 0 en
    UTC y en `America/Mexico_City`.
  - Se ve en la tarjeta del inicio, en el widget y en la notificación diaria. La forma buena ya está
    en `dailyLight.ts:18-22`. Es la familia de `R9-63` y `R9-147`.

- **`R9-173` (S25, lector web — P3, decidido) — 🐛 la opción (b) de `R9-109` no cubre el fallo de red
  ni el 404 del pack en un navegador que ya tiene texto: igual ve la pantalla de error.** MEDIDO por
  la nube en Chromium, sobre el bundle real (escenarios G y G2), con el texto intacto en el
  navegador.
  - Es el fallo más común durante una publicación: un pack a medio subir, o la red que se corta
    entre el manifiesto y el pack.
  - **Decisión (delegada por Victor en la sesión 25):** extender la opción (b) a esos fallos. Un
    navegador con texto sigue con lo que tiene, avisa, y reintenta en el próximo arranque. Solo uno
    sin texto ve la pantalla de error.

- **`R9-174` (S25, `SyncEngine` / conflictos — P3) — 🐛 en tarjetas y favoritos, un eco propio puede
  parecer «del otro» durante un instante, y pisar «su versión» de un conflicto pendiente.** Leído
  por el orquestador al revisar `R9-160`. Sin sonda.
  - El arreglo de `R9-160` distingue el eco propio porque «nunca es más nuevo que lo local»: cada
    adaptador sube el `updatedAt` de la fila guardada. En notas y subrayados, `getLocal` lee la BD, y
    la premisa se cumple.
  - En `memoryCards` y `favorites`, `getLocal` lee un ref que se actualiza en un `useEffect`
    (`MemoryDeckContext.tsx:120-122`, `FavoritesContext.tsx:128-131`), DESPUÉS del render.
  - El listener no filtra los ecos locales pendientes (no mira `hasPendingWrites`), y Firestore
    entrega la escritura local enseguida.
  - Si un conflicto está pendiente y el usuario edita ESE doc en este teléfono, su eco puede llegar
    con el ref todavía viejo. El motor lo ve más nuevo que lo local, y lo toma como «su versión».
  - Nada se pierde del todo, porque el otro teléfono conserva su copia y su propio conflicto. Pero
    en este teléfono «su versión» mostraría lo propio, y «quedarme con lo suyo» lo subiría.
  - **Arreglo (hipótesis):** actualizar el ref en el mismo lugar donde se escribe, antes del
    `queueWrite`, o que el motor reconozca sus propios ecos por el contenido de la cola.
    **Nota de la sesión 30 (A3):** podría cerrarse con los «sellos propios» de `R9-193`. Sin medir.
    **Medido en la sesión 31 (S31-A3, re-medido):** los sellos solos no lo cierran. Lo cierran dos
    piezas de una extensión medida y sin integrar: `+Npend` con el conflicto en memoria (una copia
    propia más NUEVA tampoco es «suya») y `+W` sin conflicto (la ventana de 30 s pregunta
    `isOwnCopy`). Ver `detail/S31-revision-del-diff-s30.md` §7.3.
  - **✅ ARREGLADO en la sesión 32** (`36cf5be`, rama `fix/s32-r192-r193-y-s31`): `+Npend` (en la
    rama `pending`, una copia es «suya» solo si su reloj difiere del local y no es propia) y `+W`
    (el commit de `R9-189`: la ventana de 30 s pregunta `isOwnCopy`), de la extensión de S31-A3. 2
    pruebas; `+Npend` las tumba 1, `+W` 2.
  - **⚠️ Sesión 33:** el arreglo cerró el eco; keepMine lee el mismo ref, y con él atrasado pierde
    la edición en cola: `R9-210`.

- **`R9-175` (S27, `SyncEngine` / cursor — P2) — 🐛 los lotes de `handleSnapshot` no se
  serializan: si uno se corta a mitad mientras otro ya adelantó el cursor, lo que le faltaba no
  vuelve nunca.** MEDIDO con sonda (agente A2, sonda P10), verificado por el orquestador.
  - **El mecanismo:**
    - Cada snapshot hace `void this.handleSnapshot` (`SyncEngine.ts:956`), así que los lotes corren
      a la vez y comparten el cursor.
    - El lote B1 `[removed X, modified Y]` espera la lectura de X (`:1064`). Mientras tanto, B2 (un
      doc más de 5 min más nuevo) corre entero y persiste el cursor (`:1169-1171`).
    - Si B1 se corta, sea por un `stop()` (`:1078`) o porque muere el proceso, Y nunca se aplicó y
      queda por debajo del próximo piso. El conjunto no asentado solo protege a los docs
      retenidos, no a los que un lote todavía no procesó.
  - **Medido:** `"yAplicado":false,"cursorGuardado":20,"pisoTrasReiniciar":15,"reentregadoY":[],"localY":null`.
  - **Ya existía:** P10b, con la ventana del `getLocal` de SQLite y sin `removed`, da idéntico en
    `590b39c`. **La 26 lo agranda** de milisegundos a un viaje de red por cada `removed`:
    - las lecturas de un lote van en serie;
    - el SDK entrega los `removed` primero;
    - con la misma secuencia, el motor viejo sí aplicaba Y.
  - **Alcanzable, aunque raro.** Hacen falta a la vez un lote con un `removed` y más cambios (el de
    ponerse al día tras estar offline, o una restauración del otro teléfono), otro lote de la misma
    colección con un doc más nuevo, y un corte antes de que el primero retome.
  - **El efecto** es una divergencia: la nube tiene el cambio de Y y este teléfono no lo recibe
    nunca. Si después se edita Y aquí, se sube lo viejo y se pisa la nube (como en `R9-161`).
  - **El comentario de `:1002-1004`** («_Nothing is lost — the cursor did not move_») es falso en
    este caso.
  - **Arreglo (hipótesis):** encadenar `handleSnapshot` por colección, con una cadena de promesas en
    `attachListener`, y corregir el comentario. Cierra además, por construcción, los 5 casos que
    A2 solo pudo reproducir con el mock (§4 del detalle).

  **✅ ARREGLADO en la sesión 28** (`c163659`, rama `fix/s28-sync-r9175-r9181`). Una cadena de
  promesas por colección en el MOTOR (`enqueueSnapshot`). Medido pieza por pieza (A2 y el
  orquestador, con el mock nuevo):
  - la cadena vive en el motor, no en el listener: un re-enganche en la misma sesión sigue esperando
    al lote del listener viejo;
  - la sesión y el uid del lote son los de cuando LLEGÓ (se toman en el callback de `onSnapshot`).
    Tomados al empezar, un lote que esperó en la cola a través de un `stop()` corría en la sesión de
    la cuenta siguiente: la clase de `R9-153`, que la cadena habría creado;
  - `stop()` vacía las cadenas, para que la cuenta siguiente no espere detrás de una lectura colgada;
  - **la pregunta de Victor, medida:** con la cadena, una lectura que no vuelve bloquea TODOS los
    lotes siguientes de la colección hasta el `stop()`. El SDK no le pone plazo a un `get()` (espera
    al servidor, o responde de la caché o `unavailable` cuando se considera offline: 10 s según su
    OnlineStateTracker). Por eso la lectura lleva un plazo de 60 s: al vencer cuenta como fallida
    (se deja lo local) y la respuesta tardía se descarta.

  Cierra además los 5 casos del §4 de la 27 y la versión PERMANENTE de `R9-176`/`R9-178`. El
  comentario «_Nothing is lost — the cursor did not move_» quedó corregido. Sigue abierto un vecino:
  `R9-183`.

- **`R9-176` (S27, `SyncEngine` / `R9-124` — P3) — 🐛 lo que el usuario hace con ese doc durante
  la lectura del `removed` no entra en la respuesta.** MEDIDO con sonda (A2, P6 y P7). **Lo
  introdujo la 26.**
  - `:1079-1106` aplica la respuesta de la lectura sin mirar la cola.
  - **P7:** el otro teléfono restaura X y el usuario lo borra aquí durante la lectura. La lectura
    trae la versión restaurada, no hay copia local con la que comparar (`:1281`), y la re-inserta
    (`:1346`): X **resucita** hasta que llega el eco de la lápida.
  - **P6:** hay un borrado de verdad y el usuario edita X durante la lectura. «No existe» lleva a
    `applyRemoteDelete` (`:1090`), que **borra la edición** hasta que llega su eco.
  - **El orden es el real,** por el hilo único de RNFB (ver `R9-177`): la respuesta de la lectura
    nunca incluye lo que este teléfono escribe mientras tanto, y el eco llega después.
  - **Los disparadores son raros:** para P7, una restauración o un reloj atrasado en el otro
    teléfono; para P6, un borrado de verdad, que hoy solo hace `deleteAccountData` desde el otro
    teléfono.
  - Se cura sola cuando llega el eco, salvo que la subida se descarte tras 8 intentos (`R9-33`). En
    ese caso, en P6 la edición se pierde también de este teléfono.
  - **Arreglo (hipótesis):** después del `isCurrent()` de `:1078`, si `hasQueuedWrite(uid,
colección, id)` (`:1787`), no aplicar la respuesta a ese doc, y mantener la lógica de retener o
    soltar. No cubre `R9-178`, porque ahí el push ya salió de la cola.

  **✅ ARREGLADO en la sesión 28** (`53e79fa`), junto con `R9-178`, con esa guarda: el doc se suelta
  y decide el eco. **Dos afirmaciones de esta entrada eran falsas** (medido por A2 y A3):
  - «_No cubre `R9-178`_»: lo era solo con el orden del mock viejo. En RNFB la escritura hecha
    durante la lectura no se emite antes de que vuelva, así que al volver sigue en la cola, y la
    misma guarda cubre N1a, N3 y E1p;
  - «_Se cura sola cuando llega el eco_»: no, si el eco se procesa MIENTRAS se aplica la respuesta
    vieja. Lo ve con lo local todavía sin tocar, el LWW lo ignora, y el apply termina después: la
    edición se pierde para siempre (P6), o el doc resucita para siempre (P7). La cadena de `R9-175`
    cerró esa versión permanente.

- **`R9-177` (S27, `SyncEngine` / RNFirebase — P3) — 🐛 la lectura del `removed` bloquea el único
  hilo de escrituras de RNFirebase.** LEÍDO en la fuente (A2), verificado por el orquestador. **Sin
  medir en nativo.** Lo introdujo la 26.
  - Es el único `get()` de documento de toda la app (`SyncEngine.ts:957`, vía `firestore.ts:175`).
  - `documentGet` hace `Tasks.await(documentReference.get(source))` en `getExecutor()`
    (`NativeRNFBTurboFirestoreDocument.java:144-146`).
  - Con `android_task_executor_maximum_pool_size` por defecto (1), `getExecutor()` es
    `getExecutor(true, "")`, o sea el mismo ejecutor de un solo hilo que `getTransactionalExecutor()`,
    donde corren `documentSet` y `documentDelete` (`TaskExecutorService.java`). `firebase.json` no lo
    cambia.
  - Mientras la lectura espera al servidor, ninguna subida llega a Firestore. Con k `removed` en un
    lote, cada subida espera k viajes, porque las lecturas van en serie.
  - **Arreglo (hipótesis, a medir en Modo C con el OK de Victor):** leer con `{source: 'cache'}`.
    La tabla nativa de la 26 da en caché la misma respuesta que el servidor en A, B, C y D, y en B
    offline la caché funciona donde el servidor falla. Si la caché da `unavailable`, o la misma
    versión que traía el `removed`, pedirla al servidor. La alternativa es subir el pool.

  **Sesión 28:** sigue ABIERTO, porque necesita el OK de Victor y una medición en Modo C. Desde
  `d093a4e` el mock de las pruebas modela el ejecutor único: un `get()` lo retiene y un `set()`
  emitido mientras tanto (con su eco) espera detrás. Con la cadena de `R9-175`, una lectura lenta
  también retrasa los lotes siguientes de su colección, hasta el plazo de 60 s.

  **Sesión 29:** el plazo de 60 s es del MOTOR, no del SDK. `withDeadline` suelta el `await`, pero
  la lectura colgada sigue ocupando el ejecutor. Medido en el mock (sonda Q3a): una escritura de
  otro doc no sube ni antes ni después del plazo, ni tras `stop()` + `start()` de la misma cuenta.
  Ver `R9-186`.

- **`R9-178` (S27, `SyncEngine` / conflictos — P3) — 🐛 si el usuario resuelve con `keepMine` o
  `merge` durante la lectura del `removed`, la respuesta se aplica como si el conflicto no hubiera
  existido.** MEDIDO con sonda (A3, 17 escenarios), verificado por el orquestador.
  - **El mecanismo:**
    - `keepMine` encola `{...current, updatedAt: now}` pero no reescribe la fila local
      (`SyncEngine.ts:1913-1914`). La copia local sigue con su `updatedAt` viejo, L.
    - La resolución quita el conflicto y la marca en el mismo tick (`:1976-1984`).
    - Al volver la lectura ya no hay conflicto retenido (`:1088`, `:1317`).
  - **Se ve de tres maneras:**
    - **«No existe» (N1a):** `applyRemoteDelete` borra lo que el usuario acaba de conservar
      (`"borrados":["doc-c"],"local":null`). `merge` hace lo mismo (N3).
    - **«Existe», con una X más nueva que L y a más de 30 s:** el LWW escribe X encima (E1w, con un
      conflicto de antes de reiniciar; E1w-busy, en línea y con otro push en vuelo:
      `"local":"X su respaldo"`).
    - **«Existe», con X a menos de 30 s de L (E1p):** aparece un conflicto fantasma justo después de
      resolver, retenido con su marca en disco.
  - En los tres casos, el eco del push repone L.
  - **La ventana es nueva, pero el daño no:** con el motor de `590b39c`, el `removed` borraba L en el
    acto y `keepMine` fallaba («found no local copy»). No es una regresión.
  - **Alcanzable, pero estrecho y pasajero.** El usuario tiene que tocar el botón
    (`app/(tabs)/conflicts.tsx:186`, `:223`) durante el viaje de red de la lectura. La pérdida solo
    es permanente si el push se descarta (`R9-33`).
  - **Arreglo (hipótesis, medido en el worktree de A3):**
    - antes del `lookup`: `const heldBefore = this.isHeldConflict(adapter.collection, id)`;
    - tras el `isCurrent()` de `:1078`: si `heldBefore` y ya no está retenido, el usuario resolvió
      durante la lectura, así que `settle(id); continue`.

    Caen exactamente las 4 aserciones del fallo, y la suite queda en 141/141.

  **✅ ARREGLADO en la sesión 28** (`53e79fa`) con la guarda de `R9-176` (`hasQueuedWrite`), NO con
  `heldBefore`. Medido por A3: `heldBefore` hace que N2 deje de converger (con keepTheirs sin subida
  durante un borrado de verdad, lo local se queda con un doc que la nube ya no tiene). N2 queda como
  control. **El daño de E1p es pasajero con el orden real:** el eco de keepMine sale en cuanto
  vuelve la lectura. Su prueba anota cada lista de conflictos que publica el motor (corolario 13).

- **`R9-179` (S27, prueba de sync — P3) — 🐛 la prueba de la guarda G7 (`isSyncing`) solo
  discrimina porque el mock no entrega el eco propio.** MEDIDO con sonda (A1, variante E del mock).
  - Con el SDK, el eco de un `set()` propio llega antes del ack (en la medición nativa de la 26,
    `hasPendingWrites: true`). El `finally` de ese lote (`SyncEngine.ts:1190-1193`) pone
    `isSyncing: false` con el push todavía en vuelo; el flush lo había puesto en `true` en `:2182`.
  - Con el eco propio en el mock (81 ecos), la prueba «el lote viejo, al terminar, no le apaga el
    isSyncing a un push de Beto en vuelo» cae en su control (`SyncEngine.test.ts:3010`) sin
    revertir nada.
  - **El efecto en la app es nulo:** fuera del motor nadie lee `isSyncing` (solo `types.ts:145`;
    verificado por el orquestador). Ajustes usa `pendingWrites`.
  - **Arreglo (hipótesis):** quitar `isSyncing`, junto con G7 y su prueba, o derivarlo de
    «`flushInFlight` o hay lotes en curso». En el segundo caso, el mock tiene que entregar el eco
    propio.

  **✅ ARREGLADO en la sesión 28:**
  - **el mock** (`d093a4e`): entrega el eco propio, la reversión de un rechazo y la re-entrega al
    enganchar, y modela el ejecutor único de RNFB. Con él caían 14 pruebas sin tocar nada:
    - las 6 esperadas;
    - 7 por tiempo: suponían el ack dentro de un macrotask;
    - la de `R9-161` con la edición en cola: simulaba un rechazo sin reversión, y con la reversión
      L se borraba (`R9-182`).
  - **`isSyncing`, quitado** (`7292b78`) en vez de derivado: nadie lo lee fuera del motor.

- **`R9-180` (S27, prueba de sync — P3) — 🐛 la prueba de control de `R9-160` («tras resolver, lo
  retenido se va con el conflicto…») no vigila su guarda con la semántica del SDK.** MEDIDO con
  sonda (A1), verificado por el orquestador.
  - El nombre dice «R3: el otro edita una hora después», pero R3 lleva `updatedAt: Date.now()`
    (`SyncEngine.test.ts:4434`), el mismo instante que el `now` de `keepMine` (`SyncEngine.ts:1913`).
  - Con el eco de `keepMine` en el mock, R3 cae dentro de la ventana de 30 s y sale un conflicto
    legítimo: la prueba cae sin revert.
  - Con R3 de verdad a +1 h y con el eco (`R_O-hour`), **pasa con la guarda revertida** (`:1984`,
    cambiada a `if (false && …)`). El eco solo ya suelta la marca: la rama retenida no ve campos
    distintos, aplica por LWW y hace `settle`. Con el mock de hoy, sin eco, sí cae.
  - **Arreglo (hipótesis):** R3 con `Date.now() + HOUR` y el eco propio en el mock, más un escenario
    en el que el eco no llegue antes del reinicio (`keepMine` offline y la app cerrada antes del
    ack). Si con eso nada la hace caer, medir si la guarda es equivalente por construcción
    (corolario 37).

  **✅ ARREGLADO en la sesión 28:** R3 pasó a `Date.now() + HOUR` en el commit del mock (`d093a4e`),
  y la prueba nueva (`363056e`) vigila la guarda donde el eco no llega. keepMine se resuelve sin red,
  la app se cierra, y R3 entra antes de que NetInfo avise. Con la guarda revertida cae: la marca queda
  en disco, R3 aparece como conflicto fantasma y L queda en local. **La guarda NO es equivalente por
  construcción:** sin eco (keepMine sin red, keepTheirs sin subida), solo ella suelta la marca.

- **`R9-181` (S27, `SyncEngine` / conflictos — P3, decidido: la (b)) — 🐛 retener un conflicto
  «CON su marca, a su `updatedAt` nuevo» tras su `removed` no sirve después de reiniciar: la
  justificación del diseño de la 26 es falsa.** MEDIDO con sonda (A1, sondas B y B-con-P7),
  verificado por el orquestador en el código.
  - Tras el `removed`, `hold` deja la marca en el `updatedAt` nuevo, más viejo. Al reiniciar, el piso
    baja hasta ahí y el SDK re-entrega el doc, pero la rama del conflicto retenido de
    `applyRemoteChange` exige `remoteTs > localTs` (`SyncEngine.ts:1314-1317`) y no dispara. El LWW
    le da la razón a lo local y `settle` borra la marca: 0 conflictos, `unsettled: {}`.
  - **Con P7 («si existe, soltarlo a ciegas») el estado final es idéntico,** y sin relectura.
  - **Lo que cae de la 26:**
    - la justificación de «Diferencia con lo pedido» («soltarlo borraría la marca… tras reiniciar
      ya no se volvería a detectar»): con la marca, tampoco se detecta. Su propio §4 lo decía, y lo
      archivaba en `R9-126`;
    - «cada enganche relee desde ahí»: relee una sola vez;
    - la prueba «R9-160: … retenido CON su marca y a su updatedAt nuevo» vigila un estado intermedio
      cuya consecuencia no ocurre;
    - el comentario de `SyncEngine.ts:1101-1105`.
  - Para un doc retenido por `R9-46` (un `getLocal` que falló), retenerlo sí sirve.
  - **Decisión de Victor:**
    - (a) corregir el texto, el comentario y el nombre de la prueba, y aceptar la relectura;
    - (b) si el conflicto tiene que sobrevivir al reinicio, que la rama retenida lo vuelva a detectar
      también ante una re-entrega MÁS VIEJA con campos distintos. Eso toca la semántica de
      `R9-126`.
  - **✅ DECIDIDO (sesión 27, delegado por Victor: «a tu mejor criterio»): la (b), acotada a los docs
    con la marca.** Se quita `remoteTs > localTs` de la rama retenida (`SyncEngine.ts:1314-1317`).
    Por qué:
    - La marca existe para que la nube no decida por el usuario (`R9-160`), pero la rama solo miraba
      una dirección. Con una re-entrega más vieja, el LWW se queda con L en silencio: el conflicto
      desaparece sin que el usuario elija, y la nube (X) y el otro teléfono quedan divergentes para
      siempre. Con (b), el usuario elige entre L y X, y las dos salidas convergen (`keepMine` sube
      L; `keepTheirs` aplica X, y sube si hace falta, por `R9-161`).
    - Una re-entrega más vieja FUERA de la ventana de 30 s solo llega en el caso de `R9-124` (una
      reescritura por debajo del piso): dentro de la ventana, la detección normal ya la ve.
    - Los docs sin marca no cambian: `R9-126` sigue igual para ellos. Sale de `R9-126` solo el caso
      «un conflicto retenido que cayó por debajo del piso» (nota de la 26 ahí).
    - Con (b), retener el conflicto a su `updatedAt` nuevo (el diseño de la 26) sí sirve.
  - **Para la sesión de arreglos:**
    - la prueba que falta: tras el `removed` con una versión más vieja, reiniciar y re-entregar; el
      conflicto vuelve (L contra X). Vista fallar primero;
    - un control: sin marca, la misma re-entrega más vieja va por LWW y no crea un conflicto;
    - corregir el comentario de `:1308-1312` y el de `:1101-1105`;
    - revisar un eco propio más viejo que lo local sobre un doc con la marca: solo es posible entre
      el arranque y la primera re-entrega del doc (después el conflicto ya está en memoria y lo
      maneja la rama `pending`). Medilo, no lo supongas.
    - El costo: un conflicto retenido mantiene el piso bajo hasta que se resuelve, como cualquier
      conflicto pendiente. Es el tope de cuota, que sigue siendo decisión de Victor.

  **✅ ARREGLADO en la sesión 28** (`1bae03e`), con la (b) **acotada un paso más**. Tal cual, la (b)
  creaba un conflicto FANTASMA entre lo propio y lo propio (medido por A3, caso B1):
  - el eco de una escritura propia movía la marca a esa copia;
  - tras reiniciar, la re-entrega de W1, con W2 en local, pasaba a ser «su versión».

  **La forma final:**
  - la rama retenida re-detecta la copia MÁS VIEJA que lo local solo si es exactamente la que marca
    el conflicto (`remoteTs === heldAt`);
  - la marca se mueve solo a la copia de la que trata el conflicto: la que encontró la lectura del
    `removed`, o la que se registró como «suya». El eco propio no la mueve.

  **La prueba de la 26 «…retenido CON su marca…» afirmaba 0 conflictos tras reiniciar:** fijaba el
  defecto (corolario 6). Con la re-entrega del mock nuevo, ahora da 1. **La pieza «la marca sigue a
  "su versión"» no hacía caer nada:** no cambia la corrección, sino cuánto relee cada enganche
  mientras el conflicto espera. Tiene prueba nueva, porque es cuota.

- **`R9-182` (S28, `SyncEngine` / cola — P2) — 🐛 si el servidor rechaza la subida de un doc que
  la nube no tiene, cuando el motor se rinde la copia local se borra.** MEDIDO con sonda (A1 de la
  S28), re-medido por el orquestador sobre el código final (`53e79fa`).
  - **El mecanismo:**
    - El SDK muestra el `set()` en el acto (eco `added`). Al rechazarlo, lo retira de su vista, y
      como la nube no tiene el doc, lo retira como `removed`.
    - La lectura de `R9-124` dice «no existe», y `applyRemoteDelete` borra la fila local.
  - **Ya existía:** con el motor de `590b39c` da idéntico. Lo escondía el mock, que no entregaba ni
    el eco ni la reversión.
  - **Medido (`_scratch/S28-N1-final.out.txt`):**
    - desde `53e79fa`, la guarda de `R9-176` lo cubre mientras la subida siga en la cola: tras el
      primer rechazo, `"borrados":[],"local":"mio","cola":[["nuevo",1]]`;
    - cuando el motor se rinde (8 intentos, `R9-33`), la escritura sale de la cola ANTES de que
      llegue la reversión: `"borrados":1,"local":null,"cola":[],"droppedWrites":1`. El dato se pierde
      también de este teléfono, y el aviso de `R9-33` solo dice que el cambio no subió.
  - **Controles, sin borrado:** si la nube tiene una versión más vieja, la reversión es un
    `modified` que el LWW ignora; y sin rechazo no pasa nada.
  - **Disparadores:** los de `R9-33` (reglas, cuota, argumento inválido).
  - **Arreglo (hipótesis, sin medir):** que un doc cuya escritura el motor acaba de descartar no se
    trate como borrado por la reversión de ese mismo rechazo. Por ejemplo, recordar los ids
    descartados hasta que llegue su reversión.
  - **La prueba de `R9-161`** («una edición mía de ANTES de la detección no pudo subir…») se ajustó
    en `d093a4e` para que la nube ya tenga el doc. ~~Su forma original (la nube sin el doc) sirve
    como prueba de este hallazgo cuando se arregle.~~ **Falso (S29, corregido en la S30):**
    tras un solo rechazo la escritura sigue en la cola y la guarda de `R9-176` ya lo cubre; la
    prueba de este hallazgo necesita el descarte tras 8 intentos.

  **Sesión 29:**
  - **Falso desde `53e79fa`:** la forma original de esa prueba PASA sobre el código de hoy, con este
    hallazgo sin arreglar. Tras un solo rechazo, la escritura sigue en la cola y la guarda de
    `R9-176` impide el borrado. Una prueba de `R9-182` necesita el descarte tras 8 intentos (como
    la sonda N1-8). Ver `R9-188`.
  - **Depende del orden que eligió el mock:** el rechazo llega antes que la reversión. Es el orden
    del SDK de JS (`__PRIVATE_syncEngineRejectFailedWrite`: «we raise user callbacks first so that
    they consistently happen before listen events»). En RNFB la promesa y el evento viajan a JS por
    canales distintos, y eso no está medido. Si en el teléfono la reversión llegara primero, la
    escritura seguiría en la cola, la guarda la cubriría y este hallazgo no ocurriría. Se cierra en
    Modo C.
    **✅ ARREGLADO en la sesión 30** (`5dac31e`, rama `fix/s30-sync-r9185-r9188`), medido por el agente A1 y re-medido
    por el orquestador. La hipótesis literal (un `Set` que consume el `removed`) se descartó: dejaba
    la espera colgada si la reversión era un `modified` y se tragaba un borrado de verdad posterior.
    Se integró H182b: un `Map` `uid + suppressKey` → `updatedAt` del payload descartado; cualquier
    entrega del doc que no sea el eco de ese payload termina la espera, y si es un `removed` cuenta
    como escritura en cola. 3 pruebas (la nube sin el doc, con el descarte tras 8 intentos; la nube
    con el doc, que vigila el defecto de la hipótesis literal; y la misma versión re-subida y borrada
    de verdad). Piezas: 2 / 2 / 1 / 1. **Sigue dependiendo del orden «rechazo antes que reversión»**,
    no medido en RNFB (`R9-177`). `stop()` no vacía la espera: queda dicho en el comentario.

- **`R9-183` (S28, `SyncEngine` / cursor — P3) — 🐛 resolver OTRO conflicto mientras un lote espera
  su lectura mueve el cursor en el acto: si el lote se corta, lo que le faltaba no vuelve.** MEDIDO
  con sonda (agente A2 de la S28, P10r). El mecanismo lo verificó el orquestador en el código. Es un
  vecino de `R9-175` que la cadena no cierra.
  - **El mecanismo:** `resolveConflict` hace `void this.advanceCursor(colección, resolvedTs)` sin
    pasar por la cadena de la colección. Con keepMine o merge, `resolvedTs` es «ahora».
  - **El caso:** el lote B1 `[removed X, modified Y]` espera la lectura de X, y el usuario resuelve
    el conflicto de Z (de la misma colección) con keepMine. El cursor salta a «ahora», B1 se corta
    (`stop()` o la muerte del proceso), y al reiniciar el piso queda por encima de Y.
  - **Medido:** `cursor 60 (ahora), piso 55, Y perdido`, igual con y sin la cadena.
  - **Arreglo (hipótesis, medido en el worktree de A2):** que `resolveConflict` avance el cursor por
    la misma cadena (`enqueueSnapshot`) y solo si la sesión sigue siendo la suya. Hay 2 pruebas
    (mecanismo y consecuencia) en `_scratch/S28-A2-parcial.diff.txt`. Quedó fuera de la 28 por
    decisión de alcance: Victor aprobó registrarlo sin arreglarlo.
    **✅ ARREGLADO en la sesión 30** (`7c7a6ec`), con la hipótesis de la 28 medida otra vez por A1:
    el avance va por `enqueueSnapshot` y dentro mira `isCurrent()` (sin eso, el «ahora» de Ana caía
    en la clave y la caché del cursor de Beto). 3 pruebas (mecanismo, consecuencia y sesión); la
    pieza de la cadena tumba 3, la de la sesión 1. El conjunto no asentado de `resolveConflict`
    (`R9-180`) sigue fuera de la cadena, como antes.

- **`R9-184` (S28, `SyncEngine` / cola — P2) — 🐛 el flush sube una FOTO vieja de la cola, y su eco
  crea un conflicto entre dos versiones propias que no se disuelve solo.** MEDIDO con sonda (A3 de la
  S28, caso B3, con los mocks de eco). El mecanismo lo verificó el orquestador en el código. **Sin
  re-medir con el mock final.**
  - **El mecanismo:**
    - `flush()` toma `items = this.queue.filter(...)` al empezar y sube cada `item` de esa foto
      (`await this.pushOne(fn, item)`).
    - Si mientras sube otro doc una edición nueva W2 reemplaza a W1 en la cola, igual sube W1: la
      comprobación `this.queue[doneIdx] !== item` solo evita sacar W2 de la cola.
    - El eco de W1 llega con W2 en local. A menos de 30 s y con otro valor, se registra un conflicto
      «W2 mío / W1 suyo».
    - Cuando llega el eco de W2, la rama `pending` no lo ve como «más nuevo» que lo local, así que
      el conflicto queda hasta que el usuario elige. Si elige «lo suyo», pierde W2.
  - **Por qué no se veía:** el mock viejo no entregaba el eco de W1.
  - **Alcance:** hace falta un flush con más de un doc en la cola (por ejemplo, al volver la red) y
    dos ediciones del mismo doc a menos de 30 s.
  - **Arreglo (hipótesis, sin medir):** re-leer el ítem vivo de la cola antes de subirlo, y saltarlo
    si ya lo reemplazó uno más nuevo.
    **✅ ARREGLADO en la sesión 30** (`560fe5c`), medido por A1 con el mock final (sube W1 y después
    W2, conflicto publicado `w2 / w1`): el flush salta la entrada si ya no está en la cola
    (identidad). W2 sube en el re-flush del final del mismo flush; el salto no toca intentos, backoff
    ni marcas. 1 prueba, con control del mecanismo y la consecuencia vía `subscribe`. **Vecino
    abierto: `R9-189`.**

- **`R9-185` (S29, `SyncEngine` / conflictos — P3) — 🐛 la guarda de `R9-176` borra la marca de un
  conflicto retenido mientras la escritura propia espera en la cola: tras reiniciar, el conflicto
  que `R9-181` hace volver no vuelve.** MEDIDO con sonda (Q5a y Q5b de la S29). Lo introdujo la 28,
  y son dos arreglos del mismo diff (corolario 4).
  - **El mecanismo:** tras la lectura del `removed`, `if (hasQueuedWrite(...)) { settle(id);
continue; }` (`SyncEngine.ts:1178-1181`). `settle` quita del conjunto también la marca de
    conflicto, y `saveUnsettled` la borra de disco.
  - **El caso:**
    1. hay un conflicto retenido («lo mío» contra «lo suyo»);
    2. el usuario edita el doc, y la subida falla una vez y espera su reintento;
    3. el otro teléfono restaura un respaldo, que sale de la query;
    4. se reinicia.
  - **Medido:**
    - tras el `removed` queda la marca `{}`;
    - tras reiniciar, **0 conflictos**;
    - con la guarda revertida, la marca pasa al respaldo y el conflicto vuelve:
      `[lo mío editado, su respaldo viejo]`.
  - **Mientras la subida reintenta (Q5b):**
    - el eco de cada intento vuelve a retener el doc, pero en «lo suyo», la marca vieja, no en la
      copia que trajo la lectura;
    - su reversión lo vuelve a soltar, y en disco queda `{}` en cada paso del backoff;
    - la marca vuelve al respaldo solo con la reversión final, cuando el motor se rinde.
  - **El daño:** un reinicio en ese tramo pierde el conflicto. Si la subida después entra, la nube
    se queda con lo mío sin que el usuario elija. Si se descarta, la nube y el teléfono quedan
    distintos, y solo lo dice el aviso de `R9-33`.
  - **Es falso** «decide su eco, que lo vuelve a retener si su conflicto sigue esperando» (`53e79fa`
    y el comentario de la guarda): lo vuelve a retener en la copia vieja, y la reversión lo suelta.
  - **El `settle` de la guarda no tiene prueba** (pieza `S176-settle`: 0 caídas), y no es
    equivalente: quitarlo deja la marca en «lo suyo», y el piso queda clavado sin conflicto que
    mostrar (la clase de `R9-164`).
  - **Arreglo (hipótesis H1, MEDIDA en la S29):** si la lectura trajo el doc y es un conflicto
    retenido, `hold(id, leída.updatedAt, true)` en vez de `settle`. Q5a y Q5b convergen
    (el conflicto vuelve tras reiniciar, y la marca queda en el respaldo durante todo el backoff), y
    la suite queda en 164/164 con las sondas. Falta la prueba vista fallar.
    **✅ ARREGLADO en la sesión 30** (`24900f1`) con H1. La prueba de la Q5a cae con la guarda de la
    28 y también sin mover la marca a la copia leída; el `settle` de la guarda tiene ahora su prueba
    (un doc retenido por `R9-46`, sin conflicto). **H1 abrió un vecino, `R9-190`** (la copia leída
    puede ser PROPIA), que encontró el agente A2 y se arregló en la misma sesión (`5c44cec`).

- **`R9-186` (S29, `SyncEngine` / conflictos — P3) — 🐛 una lectura del `removed` que falla o que
  vence el plazo de 60 s suelta el doc, y un conflicto retenido pierde la marca; el plazo, además,
  no libera el ejecutor de RNFB.** MEDIDO con sonda (Q3a de la S29).
  - **La marca:** vencido el plazo (o fallida la lectura), `current` es `null` y cae en
    `if (!currentData) { settle(id); continue; }` (`SyncEngine.ts:1198-1203`). Sonda: conflicto
    retenido, y el otro teléfono restaura un respaldo con la lectura colgada. Tras el plazo, la
    marca `{}`; tras reiniciar, 0 conflictos. Es el caso de `R9-181`, deshecho.
  - **Ya existía para la lectura FALLIDA** (diseño de la 26: «si la lectura falla, no se toca lo
    local» y se suelta). Pesa desde `R9-181`, que le dio sentido a la marca en una copia más vieja,
    y la 28 le agregó un disparador: la lectura LENTA.
  - **El ejecutor:** con la lectura colgada, una escritura de otro doc no sube ni antes ni después
    del plazo, ni tras `stop()` + `start()` de la misma cuenta (`subidasTrasPlazo: []`,
    `subidasTrasReinicio: []`). `withDeadline` suelta el `await` del motor; la lectura sigue
    ocupando el ejecutor (`R9-177`).
  - **Dos comentarios de la 28 lo afirman al revés:**
    - `REMOVED_LOOKUP_TIMEOUT_MS`: «past it, the doc is left as it is locally, while waiting only
      delays this collection's later batches». No dice que el doc se suelta, y «only» es falso en
      RNFB;
    - `stop()`: «a read that never comes back would otherwise hold the next account's collection
      too». Es cierto para los lotes, pero las subidas y lecturas de la cuenta siguiente siguen
      esperando detrás.
  - **Alcance:** hace falta que la lectura falle (sin caché) o tarde más de 60 s, con el SDK
    diciendo que está en línea. Es raro.
  - **Arreglo (hipótesis, sin medir):** una lectura fallida de un conflicto retenido no lo suelta.
    Lo deja retenido y vuelve a leerlo en el próximo enganche, porque retenerlo sin releer clava el
    piso (`R9-164`). Y corregir los dos comentarios.
    **✅ ARREGLADO en la sesión 30** (`52a420c`). Medido antes de elegir: retenerlo sin releer (V1)
    deja la marca y el piso clavados para siempre y el conflicto no vuelve; retenerlo con una marca
    `reread` (en `@sync_reread_<colección>:<uid>`) y releerlo en el próximo enganche (V2) lo hace
    volver, también si la relectura falla otra vez o tras el plazo vencido. Elegida V2, junto con la
    re-detección de la copia LEÍDA en la rama del conflicto retenido. 3 pruebas; 7 piezas, y cada una
    las tumba. Los dos comentarios, corregidos. **Abrió un vecino, `R9-191`** (la lista ilegible),
    que encontró A2 y se arregló en la misma sesión (`395a448`).

- **`R9-187` (S29, `SyncEngine` / guardas — P3) — 🐛 dos piezas equivalentes por construcción y un
  efecto sin prueba.** MEDIDO con la matriz de la S29.
  - **`R104-7` (la ruta con `item.uid`), con `R104-5` puesta:** el `throw` de
    `item.uid !== this.uid` y `users/${item.uid}` van en el mismo bloque síncrono
    (`SyncEngine.ts:2480-2484`). Las dos rutas son siempre la misma cadena, así que `R104-7` suelta
    da 0 y `R104-8` (5 + 7) da 0. En el otro sentido no es equivalente: sin `R104-4` ni `R104-5`,
    la ruta decide la nube (`R104-9` cae por otra aserción que `R104-6`).
    - **El comentario de `pushOne` atribuye el «por construcción» a la ruta,** cuando lo da el
      `throw` de dos líneas antes.
    - Por la regla 37, sobra una de las dos.
  - **El `.catch` de `enqueueSnapshot` (`S175-catch`: 0).** `handleSnapshot` envuelve en su propio
    `try` todo lo que puede lanzar, y lo que va antes (`changes.length`, `isCurrent()`, cierres) no
    lanza, así que la promesa del lote nunca se rechaza. Por la regla 37 se quita. **El costo, dicho:**
    si un día algo lanza fuera del `try`, sin el `.catch` la cadena de esa colección se para en
    silencio hasta el `stop()`.
  - **`R104-4` tiene un efecto propio sin prueba.** Su corte de bucle lo cubren `R104-5` y `R104-2`,
    pero sin ella el `updateState({pendingWrites, lastSyncedAt: Date.now(), lastError: null})` de
    un push de Ana que vuelve tras el `stop()` corre en la sesión de Beto. Le borra el error y le
    pone «sincronizado». Falta la prueba.
    **✅ ARREGLADO en la sesión 30** (`20ef1f9`). Se quitó el `throw` de `pushOne` y se quedó la ruta
    con `item.uid`, que sigue siendo cierta aunque alguien meta un `await` en medio. Sin el `throw`,
    `R104-4` discrimina sola, y tiene la prueba de su efecto propio. **El `.catch`, decidido por
    Victor: se queda, con prueba** (un lote que lanza no para la cadena). `R104-7` sola da 0: la
    cubren los cortes de `R104-2` y `R104-4` por tiempo.

- **`R9-188` (S29, pruebas y ledger de sync — P3) — 🐛 afirmaciones falsas en lo que dejó la 28.**
  MEDIDO donde se indica.
  - **La prueba de `R9-161` «una edición mía de ANTES…»:** su comentario dice que, sin el fixture
    «la nube ya tenía doc-c», «el motor BORRARÍA L de local». Desde `53e79fa`, no. MEDIDO: la
    forma original pasa sobre `e1c356c`. El fixture ya no responde nada. Lo mismo vale para la
    frase de `R9-182` «su forma original sirve como prueba» (nota allí).
  - **El mensaje de `d093a4e`:** «un `set()`/`delete()` emitido mientras tanto (con su eco) espera
    detrás». El `delete()` del mock espera, pero no tiene eco: no toca la nube ni la vista. Hoy no
    decide nada, porque su único llamador (`cleanupOldReviewEvents`) corre antes de enganchar.
  - **El comentario nuevo de `applyRemoteChange`** (`SyncEngine.ts:1438-1441`): «Any other older
    copy is this device's own earlier write». Es falso si el reloj del otro teléfono va atrasado.
    Una escritura suya más vieja que lo local, con el conflicto pendiente, la rama `pending` no la
    ve como «suya» (`:1377-1380`), y tras reiniciar tampoco es `heldAt`: el LWW se queda con lo
    local. Leído, sin medir. La regla «más nuevo que lo local = del otro» es de `R9-160`; la 28 la
    extendió a «más viejo = propio».
    **✅ ARREGLADO en la sesión 30** (`3c09a0f`; `45d2f41` para el comentario del reloj). La prueba de
    `R9-161` volvió a su forma original, con un comentario que está vigilado (cae sin la guarda de
    `R9-176`). El comentario de `applyRemoteChange` dice que una copia más vieja no siempre es propia
    (medido en la S30: `R9-193`), y el del hilo único del mock, que el `delete()` no entrega evento.
    La frase de `R9-182`, corregida allí.

- **`R9-189` (S30, `SyncEngine` / cola — P3) — 🐛 el vecino de `R9-184`: si la edición nueva llega
  después de llamar `pushOne` y antes de que el SDK emita el `set`, sube igual la vieja.** MEDIDO
  en el mock (agente A1 de la S30).
  - **El caso:** el `set` de W1 espera detrás de la lectura de un `removed` en el hilo único
    (`R9-177`); mientras, W2 reemplaza a W1 en la cola. El arreglo de `R9-184` ya pasó por su
    comprobación, así que suben W1 y W2, y el conflicto `w2 / w1` aparece igual.
  - En el SDK de JS no ocurre (no tiene ese hilo único).
  - **Arreglo (hipótesis, sin medir):** reconocer el eco propio por su contenido o su `updatedAt`
    (la familia de `R9-190` y `R9-193`).
  - **Medido en la sesión 31 (S31-A3, re-medido):** los sellos de `R9-193` solos no lo cierran (W1
    no es de un doc en conflicto); lo cierra `+W` (la ventana de 30 s pregunta `isOwnCopy`, y W1
    viaja en `PendingWrite.own` de W2). Extensión medida y sin integrar:
    `detail/S31-revision-del-diff-s30.md` §7.3.
  - **✅ ARREGLADO en la sesión 32** (`a431d10`, rama `fix/s32-r192-r193-y-s31`): `+W` de la
    extensión de S31-A3 (la entrada de W2 lleva el reloj de W1 en `PendingWrite.own`, y la ventana
    de 30 s pregunta `isOwnCopy`). 1 prueba; `+W` la tumba por la consecuencia («w2 | w1»).
  - **⚠️ Sesión 33:** `+W` lo cierra mientras la entrada de W2 sigue en la cola. Si el eco de W1 se
    procesa después del ack de W2 (la cadena de lotes ocupada), vuelve «w2 contra w1»: `R9-207`.

- **`R9-190` (S30, `SyncEngine` / conflictos — P2) — 🐛 la guarda de `R9-185` pasaba la marca a
  una copia PROPIA: tras reiniciar, «lo mío contra lo mío».** MEDIDO con sonda (agente A2 de la
  S30, Q2a y Q2a4). Lo abrió el arreglo de `R9-185` de la misma sesión (corolario 42).
  - **El caso:** conflicto retenido; el usuario restaura SU respaldo (bajo el piso), cuyo eco sale
    de la query, y la lectura trae esa copia propia; edita otra vez y la subida falla; reinicia.
    `remoteTs === heldAt` (`R9-181`) muestra su respaldo como «su versión» contra la edición, y
    elegir «lo suyo» pierde la edición. Sin H1 no ocurría.
  - **✅ ARREGLADO en la sesión 30** (`5c44cec`, rama `fix/s30-sync-r9185-r9188`) con las piezas P1, P1q, P4 y P5 de la
    hipótesis HX de A2: H1 retiene solo si la copia leída NO es propia (`isOwnCopy`: la escritura
    en cola, o la última que el servidor tomó en esta sesión, `ownAcked`, vaciada en `stop()`).
    Victor eligió integrar solo lo de esta sesión. 3 pruebas; 4 piezas, cada una con su caída. P1q
    no caía en este árbol (en A2 la exponían P2/P3, no integradas): se le escribió su prueba.
  - **Límites:** por milisegundo, y `ownAcked` vive en memoria. La unificación con los «sellos»
    de `R9-193` queda para Victor.

- **`R9-191` (S30, `SyncEngine` / conflictos — P3) — 🐛 con la lista de releer de `R9-186`
  ilegible en un arranque, el conflicto se perdía y el piso quedaba clavado para siempre.**
  MEDIDO con sonda (A2, Q3c). Lo abrió el arreglo de `R9-186` de la misma sesión.
  - **El caso:** la lista no se lee → no se relee nada; el siguiente guardado del conjunto (por
    ejemplo, al resolver otro conflicto) la borra de disco. Medido: 0 conflictos en los arranques
    2 y 3, piso en `−235 001` con el cursor en `+3 600 002`.
  - El comentario de `R9-186` («like an unreadable conflict list») era falso: un doc de esa lista
    sigue en la query y su próxima entrega lo asienta; uno de la de releer no.
  - **✅ ARREGLADO en la sesión 30** (`395a448`) con la pieza P6 de A2: ilegible la lista, el
    enganche relee todos los conflictos retenidos. 1 prueba; la pieza la tumba.

- **`R9-192` (S30, `SyncEngine` / conflictos — P2, DECIDIDO: integrar P2/P3) — 🐛 con un conflicto pendiente, la
  copia que trae la lectura de un `removed` no refresca «su versión»: el usuario elige sobre una
  copia que la nube ya no tiene.** MEDIDO con sonda (A2, Q1b/Q1c/Q1d, Q3e, Q4d). Ya existía.
  - **El mecanismo:** la rama `pending` de `applyRemoteChange` decide «suya» con
    `updatedAt(remoto) > updatedAt(local)`; la copia leída tras un `removed` es más vieja por
    construcción, así que la toma por un eco propio y no refresca `remoteVersion`, mientras
    `handleSnapshot` mueve la marca a ella: memoria y disco dicen cosas distintas. Con la escritura
    en cola, la guarda de `R9-185` tampoco la refresca.
  - **El daño:** el conflicto muestra R mientras la nube tiene X. `keepTheirs` sube R encima de X
    (con escritura propia) o, sin ella (Q1d, no hace falta H1), deja local R y nube X para
    siempre, sin marca y sin aviso. Tras reiniciar, la misma marca sí muestra X.
  - **Arreglo (hipótesis MEDIDA por A2, sin integrar):** P2 (la guarda refresca «su versión») y
    P3 (en la rama `pending`, `theirs = fromRead || …`). Cada pieza tumba su prueba (HX-b, HX-c,
    HX-d). **Cambia lo que ve el usuario** (en la sesión, el conflicto pasa a mostrar la copia más
    vieja del otro): decisión de Victor. Con HX, el `fromRead ||` de la marca queda equivalente por
    construcción y se quitaría. Diff: `_scratch/S30-A2-hx.diff.txt`.
  - **Lo que HX no arregla:** `keepTheirs` cuando el motor no conoce la copia de la nube (nota en
    `R9-126`).
  - **DECISIÓN de Victor (delegada al orquestador al cerrar la 30, 2026-09-29; registrada en la
    31): se integran P2 y P3.** El conflicto tiene que mostrar lo que la nube tiene de verdad: hoy,
    en la sesión, muestra una copia que la nube ya no tiene, y «quedarme con lo suyo» deja la nube y
    el teléfono distintos para siempre, sin aviso; tras reiniciar, la misma marca ya muestra la copia
    de la nube. P2/P3 hacen que la sesión diga lo mismo. **HX-push queda descartado** (resucita en la
    nube un doc que el otro borró de verdad). Lo integra la 32, un commit.
  - **Medido en la sesión 31 sobre `ce05112` (S31-A2, re-medido por el orquestador):**
    `_scratch/S31-A2-r192.diff.txt` (P2, P3 y 4 pruebas; 182/182). Por pieza: P2 2, `P2dif` 1, P3 2,
    juntas 4. **Regla 37:** con P3, el `fromRead ||` de la MARCA (el `hold` de `handleSnapshot`, S28)
    da 0 caídas: equivalente, **se quita** (`_scratch/S31-A2-r192-fr.diff.txt`). El `fromRead` de la
    condición de la rama retenida (S30, `R9-186`) tumba 5: se queda. **Con `R9-193`:** P3 hace «suya»
    toda copia leída, y los sellos dejan fuera la copia PROPIA leída (el caso de `R9-196`): al
    integrar las dos, P3 pregunta `isOwnCopy` (`fromRead && !isOwnCopy(...)`), medido con la prueba
    de `R9-196`. Detalle: `detail/S31-revision-del-diff-s30.md` §6.
  - **✅ ARREGLADO en la sesión 32** (`b58a158`, rama `fix/s32-r192-r193-y-s31`): P2 (`refreshTheirs`
    en la guarda) y P3, sin el `fromRead ||` de la marca. Tabla por pieza igual a la de S31: P2 2,
    P2dif 1, P3 4, FRD 5. **Con `R9-193` encima, P3 y FRD dan 0** (las ramas B y A de los sellos ya
    toman toda copia más vieja que no sea propia), y el commit de `R9-196` los quitó: P3 era
    equivalente, y FRD daba un fantasma con una copia propia leída.

- **`R9-193` (S30, `SyncEngine` / conflictos — P2, DECIDIDO: sellos propios unificados) — 🐛 una escritura del otro
  teléfono con el reloj atrasado se toma por un eco propio: «su versión» queda vieja, o el
  conflicto se asienta solo.** MEDIDO con sonda (agente A3 de la S30, 6 modos × 4 atrasos). Es
  más ancho que la nota de `R9-188`.
  - **Rama `pending`:** `theirs = remoto > local` traga R2 con cualquier atraso (1 s, 20 s, 2 min,
    10 min). «Su versión» se queda en la R vieja; `keepTheirs` antes de reiniciar deja a 2 min y a
    10 min la nube (R2) y el teléfono (R) distintos para siempre; `keepMine` descarta R2 sin que el
    usuario lo haya visto.
  - **Rama retenida (con la app cerrada):** a 2 min, LWW + `settle`: la marca se borra y el
    conflicto desaparece sin que el usuario elija.
  - **Caso realista:** el usuario sigue escribiendo aquí y el otro, 2 min atrasado, escribe casi a
    la vez. También un reloj que salta hacia atrás (NTP, cambio de hora a mano) o un tercer
    dispositivo de la cuenta.
  - **Arreglo (hipótesis MEDIDA por A3, sin integrar):** «sellos propios» (`ownStamps`): por doc en
    conflicto, los `updatedAt` de lo que escribió este teléfono (tope 16), persistidos en
    `@sync_own_<col>:<uid>`; una copia más vieja que lo local es del otro salvo que lleve un sello
    propio, en las dos ramas. Converge en 23 de 24 casos (queda `app-cerrada` a 10 min).
    **Coste medido:** un fantasma «lo mío contra lo mío» si el proceso muere en una ventana de
    milisegundos (entre que la escritura llega a la nube y se guarda el lote de su eco); dos piezas
    sin guarda (Dheld y F). Se pisa con `ownAcked` de `R9-190`: las dos responden «¿esta copia es
    mía?». **Decisión de Victor.** Diff: `_scratch/S30-A3-reloj.diff.txt`.
  - **DECISIÓN de Victor (delegada al orquestador al cerrar la 30, 2026-09-29; registrada en la
    31): se adoptan los «sellos propios» persistidos, unificados con `R9-190`.** Un solo mecanismo
    responde «¿esta copia es mía?», y los sellos reemplazan a `ownAcked`. La ventana de caída se
    cierra con el sello en la entrada de la cola, persistido con ella (hipótesis, a medir antes).
    Dheld y F se quedan solo si una prueba las ve caer. Medir también `R9-189`, `R9-194` y `R9-174`.
  - **Medido en la sesión 31 sobre `ce05112` (S31-A3, re-medido por el orquestador):** el diseño
    unificado está en `_scratch/S31-A3-r193.diff.txt` (`SyncEngine.ts`, `types.ts` y 14 pruebas;
    192/192).
    - **La hipótesis de la decisión, sola, es falsa** (corolario 33): con el sello solo en la
      entrada de la cola, el fantasma sigue en M4 (el proceso muere tras guardar la cola que ya no
      tiene la escritura subida). Lo que cierra todos los puntos es escribir la cola y la tabla de
      sellos en un solo `multiSet`.
    - Las 18 piezas del diseño caen; **Dheld y Dwin dan 0 y quedan fuera**; F se partió en
      `Fsettle`/`Fresolve`, que caen 1 cada una y se quedan. Con la tabla de sellos ilegible, el
      orquestador adopta «mostrar el conflicto» (como `R9-191`).
    - **`R9-189`, `R9-194` y `R9-174`:** los sellos solos no los cierran. Una extensión medida y sin
      integrar sí (`+W`, `+Npend`, `+Y`; `_scratch/S31-A3-extension.diff.txt`). `+Y` es un registro
      solo en memoria, con la forma de `ownAcked`: lo decide Victor (solo lo necesita `R9-194`).
    - Cierra también `R9-196`.
    - Detalle: `detail/S31-revision-del-diff-s30.md` §7.
  - **✅ ARREGLADO en la sesión 32** (`22d33e2`, rama `fix/s32-r192-r193-y-s31`): el diseño unificado
    de S31-A3 tal cual, juntado con P3 de `R9-192`. Las 18 piezas, re-medidas en el árbol combinado:
    igual que en S31 salvo `qts` (1 → 2: con P2/P3 cae también la prueba de `R9-190` «antes del
    ack»). La extensión, en sus propios commits: `+W` (`R9-189`), `+Npend` (`R9-174`) y `+Y`
    (`R9-194`).
  - **DECISIÓN sobre `+Y` (delegada al orquestador, 2026-09-30): se acepta.** `recentAcked` no
    responde «¿es mía?»: solo pasa el reloj de la última escritura tomada de un doc SIN conflicto a
    `own` de la entrada NUEVA siguiente de ese doc, que es lo persistido. La respuesta sigue siendo
    una sola (`isOwnCopy` sobre lo persistido), la clave lleva el uid, y si el proceso muere antes
    de la entrada siguiente no hay nada en cola que pueda dar el fantasma. En memoria crece un
    número por doc escrito en el proceso.

- **`R9-194` (S30, `SyncEngine` / conflictos — P3) — 🐛 la ventana de 30 s da un conflicto
  fantasma «lo mío contra lo mío» tras reiniciar, sin conflicto previo.** MEDIDO en el mock (A3).
  Ya existía.
  - **El caso:** L1 sube; L2 (a menos de 30 s) queda en cola sin red; se reinicia. La re-entrega
    de L1 llega con L2 en local, dentro de la ventana y con otro valor: conflicto `[L2, L1]`.
  - El orden de entrega en el SDK nativo no está medido.
  - **Arreglo (hipótesis, sin medir):** la misma familia de `R9-193` (reconocer L1 como propia).
  - **Medido en la sesión 31 (S31-A3, re-medido):** los sellos de `R9-193` solos no lo cierran, y
    tampoco `+W`. Lo cierran `+W` y `+Y` juntas (`+Y`: el último reloj tomado de un doc SIN conflicto,
    en memoria, pasa a la entrada siguiente). `+Y` tiene la forma de `ownAcked`: decisión de Victor.
  - **DECISIÓN (delegada al orquestador, 2026-09-30): `+Y` se acepta.** El porqué está en `R9-193`.
  - **✅ ARREGLADO en la sesión 32** (`e7d7fb8`, rama `fix/s32-r192-r193-y-s31`): `+Y`, con
    comentario. 2 pruebas: el caso, y una de mecanismo (la entrada nueva de Beto no lleva el reloj
    de Ana). Sin pasar el reloj a la entrada caen 2, sin anotarlo en el ack 2, y sin el uid en la
    clave 2: la de Ana y Beto y la vieja de `R9-190` «lo que el servidor le tomó a Ana», que con
    `+Y` vuelve a vigilar lo que dice (se le corrigió el comentario).
  - **Nota de la sesión 33 (medido, sonda `3c`):** `recentAcked` guarda una entrada por doc subido
    en el proceso, y `stop()` no la vacía (anota además la escritura en vuelo); unos 212 B por
    entrada. Solo se lee al crear una entrada NUEVA de la cola. No importa.

- **`R9-195` (S31, `SyncEngine` / conflictos — P3) — 🐛 con la lista de CONFLICTOS ilegible en un
  arranque, un conflicto marcado para releer se pierde y el piso queda clavado.** MEDIDO (S31-A1,
  sonda A; re-medido por el orquestador). Lo abrió `R9-186` (la carga de releer).
  - **El mecanismo:** releer se aplica solo `if (doc?.conflict)`. Con `@sync_conflicted_` ilegible
    ningún doc es conflicto, nadie se relee (0 lecturas, 0 conflictos), y el siguiente guardado del
    conjunto borra las dos listas. Desde ahí, en cada arranque, 0 conflictos y el piso en −235 001,
    con el cursor una hora más arriba (la V1 que la 30 descartó; `R9-164`). Local `lo mio`, nube `su
respaldo viejo`, sin nada que mostrar.
  - **El comentario de `R9-191`** («its docs are still in the query») es falso para este caso: un doc
    de la lista de releer justamente no está en la query. A2 lo dejó «leído, no medido» en la S30.
  - **Arreglo (H1c, medido):** con la lista de conflictos ilegible, cada doc de la lista de releer se
    carga como conflicto con releer (esa lista solo contiene conflictos). 1 lectura, el conflicto
    vuelve en los tres arranques, suite 178/178. `_scratch/S31-A1-h1c.diff.txt`.
  - **✅ ARREGLADO en la sesión 32** (`49f3ca5`, rama `fix/s32-r192-r193-y-s31`): H1c (con la lista
    de conflictos ilegible, un doc de la de releer se carga como conflicto con releer), y el
    comentario de `R9-191` corregido. 1 prueba; H1c entero 1 y sin `doc.conflict = true` 1, los dos
    por la consecuencia.

- **`R9-196` (S31, `SyncEngine` / conflictos — P3) — 🐛 `R9-191` (releer todos con la lista
  ilegible) también lee los conflictos que siguen en la query: tras reiniciar, fantasma «lo mío
  contra lo mío», y keepTheirs pierde la última edición.** MEDIDO (S31-A1, sonda B2; re-medido).
  - **El caso:** con el conflicto L/R pendiente, el usuario edita L2 (sube) y L3 (rechazada una vez,
    en cola). Se reinicia con la lista de releer ilegible: el lote sintético lee L2; con L3 en cola
    entra por la guarda de `R9-185`, `isOwnCopy(L2)` es falso (`ownAcked` se vació en el `stop()`) y
    la marca pasa a L2; la entrega real de L2 cae después en `remoteTs === heldAt`.
  - **El daño:** conflicto `lo mio 3 / lo mio 2`; keepTheirs deja local = nube = L2 y **L3 se
    pierde**. Corolario 42: `R9-191` saltea el filtro de copias propias de `R9-181`. No hace falta un
    respaldo restaurado ni el reloj atrasado.
  - **Arreglo:** lo cierran los sellos de `R9-193` (medido por S31-A3 y re-medido: sin conflicto, L3
    sigue en cola). Su sonda es la prueba para la 32, también para P3 de `R9-192`.
  - **✅ ARREGLADO en la sesión 32** (`6b630e3`, rama `fix/s32-r192-r193-y-s31`). Con los sellos de
    `R9-193`, la sonda B2 ya no da fantasma: la guarda de `handleSnapshot` reconoce L2 como propia y
    asienta. **Medido en la 32:** el mismo caso con L3 DESCARTADA tras 8 rechazos (nada en cola) sí
    daba `lo mio 3 | lo mio 2`, reinicio tras reinicio, por el `fromRead` de la condición de la rama
    retenida (FRD). Se quitan los dos `fromRead` (FRD y P3 de `R9-192`): con `!isOwnCopy`, como
    decía la decisión, eran exactamente las ramas A y B de los sellos. 2 pruebas; FRD de vuelta 1,
    P3 de vuelta 0 (equivalente, regla 37), `load` (los sellos sin leer) las dos.

- **`R9-197` (S31, `SyncEngine` / conflictos — P3) — 🐛 tras reiniciar, la relectura de `R9-186`
  con mi edición en cola mueve la marca sin registrar el conflicto, y el eco de mi edición lo
  asienta.** MEDIDO (S31-A1, sonda C4; re-medido). Es el daño que arregló `R9-185`, de vuelta por
  `R9-186` (corolario 42).
  - **El caso:** conflicto L/R, W rechazada una vez, el otro restaura X, la lectura del `removed`
    falla y queda releer. Se reinicia con W en espera. El lote sintético lee X; con W en cola entra
    por la guarda de `R9-185`, que hace `hold(X)` y `continue`: mueve la marca, pero tras reiniciar
    no hay conflicto en memoria que registrar. El piso de ese enganche se calculó con R, así que X no
    llega por la query. Cuando W sube, su eco no encuentra conflicto y el LWW hace `settle`.
  - **El daño:** nunca se publica un conflicto; la nube se queda con W sin que el usuario elija, y el
    respaldo del otro se pierde. Con la lectura sana (el caso de `R9-185`), el conflicto aparece.
  - **Arreglo (H3, medido):** si la copia leída no es propia y no hay conflicto pendiente de ese doc
    en memoria, la lectura sigue como `fromRead` (registra el conflicto y mueve la marca); con uno
    pendiente, como hoy. Sin copia local y con la escritura en cola, no se aplica nada. Suite 178/178.
    `_scratch/S31-A1-h3.diff.txt`.
  - **✅ ARREGLADO en la sesión 32** (`b15e899`, rama `fix/s32-r192-r193-y-s31`): H3 adaptado, sin
    `fromRead` (la rama retenida registra la copia por `remoteTs === heldAt`: la guarda acaba de
    mover la marca). Sin conflicto en memoria, la lectura sigue a `applyRemoteChange`; nada se
    aplica mientras la escritura espera (sin copia local se sale antes, y sin conflicto registrado
    la marca no se asienta). 2 pruebas; cada una de las tres piezas cae 1, por la consecuencia; P2,
    en la misma rama, sigue en 2.
  - **Nota de la sesión 33 (medido, sonda `3b igual`):** con copia local, si la leída es más NUEVA y
    no difiere de lo local en ningún campo material, se aplica mientras W espera (después sube W:
    nube W, local la leída). Solo difieren el reloj y campos no materiales, que en los cuatro
    adaptadores no cambian para un mismo id. No es el daño de `R9-176`. Si difiere, se registra; lo
    que pasa después es `R9-126`.

- **`R9-198` (S31, `SyncEngine` / arranque — P3) — 🐛 al arrancar, el `flush` que dispara NetInfo
  sale antes del `onSnapshot`: con mi edición ya vencida, la primera entrega la trae encima de la
  copia del otro, y el conflicto de `R9-185` no vuelve.** MEDIDO en el mock (S31-A1, sonda C3;
  re-medido).
  - **El orden, instrumentado con `invocationCallOrder`:** `netinfo.fetch` → `set(doc)` →
    `onSnapshot`. El `flush` de `subscribeNetInfo` emite W mientras `start()` espera
    `cleanupOldReviewEvents` y las lecturas de AsyncStorage del enganche.
  - **Consecuencia:** la primera entrega trae W encima de X (compensación de latencia, medida en la
    S26); X nunca se entrega y el LWW hace `settle`. La prueba de `R9-185` pasa solo porque deja W en
    espera; es también lo que tapa `R9-200`.
  - **Arreglo (sin medir):** no subir la escritura de un doc cuyo conflicto retenido todavía no se
    re-detectó, o enganchar los listeners antes del primer `flush`.

- **`R9-199` (S31, `SyncEngine` / conflictos — P2) — 🐛 keepTheirs tras un reinicio no sube «lo
  suyo» si mi escritura ya subió: la elección del usuario se deshace.** MEDIDO (S31-A1, sonda C5;
  re-medido). El camino existe desde `R9-160`/`R9-181`; la 30 le suma los de `R9-185`/`R9-186`.
  - **El mecanismo:** la marca «escrito aquí» de `R9-161` (`conflictsWrittenHere`) la pone solo
    `queueWrite`, vive en memoria y el `stop()` la vacía. Tras reiniciar con el conflicto de
    `R9-185` (`lo mio editado / su respaldo viejo`), si W sube antes de que el usuario elija,
    keepTheirs no empuja.
  - **El daño:** local `su respaldo viejo`, nube `lo mio editado`; tras reiniciar, W gana en los dos
    lados: la elección del usuario se deshace y el respaldo del otro se pierde. Antes de que W suba,
    converge.
  - **Arreglo (H5, medido):** `this.noteOwnWrite(...)` en la rama de éxito del `flush` (una línea);
    suite 178/178, y C5 converge. `_scratch/S31-A1-h5.diff.txt`. Con `R9-193`, va junto a
    `noteOwnAcked`.
  - **✅ ARREGLADO en la sesión 32** (`b036eff`, rama `fix/s32-r192-r193-y-s31`): H5 (`noteOwnWrite`
    en la rama de éxito del `flush`, junto a `noteOwnAcked`). 1 prueba (C5 «después de subir»); H5
    la tumba por la consecuencia (nube W tras elegir, y local W tras reiniciar).

- **`R9-200` (S31, pruebas de `SyncEngine` — P3) — 🐛 el comentario de la prueba «R9-190: mi
  respaldo leído ANTES de que el servidor confirme…» atribuye el fantasma a otra prueba que no lo
  ve.** MEDIDO (S31-A1, sonda E2; re-medido).
  - Con `S190-cola` revertida cae solo esa prueba, y solo por la marca; su nombre lo admite. Pero su
    comentario dice que «el fantasma lo muestra la prueba de arriba», y la de arriba no cae.
  - El fantasma existe: con W2 en espera al reiniciar y sin `S190-cola`, se publica y se persiste
    `lo mio nuevo / mi respaldo`. La prueba no lo ve porque deja W2 vencida, y `R9-198` lo tapa.
  - **Arreglo:** que la prueba deje W2 en espera y afirme que no hay fantasma (la sonda E2), y quitar
    esa frase del comentario (corolario 44).
  - **✅ ARREGLADO en la sesión 32** (`2f2f9f6`, rama `fix/s32-r192-r193-y-s31`): la prueba deja W2
    en espera (un rechazo), afirma lo publicado desde el reinicio y los conflictos, y el comentario
    ya no la atribuye a otra prueba. Sin P1q (`qts`) cae por el fantasma, en memoria y en disco. Su
    nombre dice ahora las dos cosas que mide.

- **`R9-201` (S31, `SyncEngine` / cola — P3) — 🐛 si la reversión llega ANTES que el rechazo, la
  espera de `R9-182` queda armada y se traga un borrado de verdad posterior.** MEDIDO en el mock con
  el orden invertido (S31-A2, sonda KRF; re-medido). Depende del orden no medido en RNFB (`R9-177`).
  - **El caso:** la nube tiene el doc; la reversión es un `modified` que llega con la escritura
    todavía en cola; después el rechazo arma la llave, y no llega ninguna reversión que la termine.
    Si la entrega siguiente es un borrado de verdad del otro, se toma por escritura en cola y no se
    aplica: con `R9-182`, local `mio`, nube `null`; sin `R9-182`, se borra. En ese orden `R9-182` no
    ocurre, así que el arreglo solo agrega este daño (el defecto de H182a, que H182b cerró solo para
    el orden del mock).
  - **El comentario «only a take-back cut short by `stop()` leaves a key armed» es falso** también en
    el orden del mock (KPISO: una fila re-subida bajo el piso no entrega nada en 8 intentos, y la
    llave queda armada sin `stop()`; ahí es inocuo).
  - **Arreglo (sin medir):** que la llave caduque, o armarla solo si la última entrega del doc fue el
    eco de ese payload.

- **`R9-202` (S31, `SyncEngine` / cola — P3) — 🐛 un borrado descartado termina distinto según dónde
  esté el piso.** MEDIDO (S31-A2, sondas D1/D2; re-medido).
  - Con la copia de la nube bajo el piso (D2, reversión `removed`), `justDropped` deja el doc borrado
    aquí y vivo en la nube (antes de `R9-182` resucitaba e igualaba la nube). Sobre el piso (D1,
    reversión `modified`), resucita con y sin `R9-182` (`R9-203`).
  - Sin pérdida de datos: el mismo evento termina de dos maneras. **Propuesta para la 32:** el
    criterio de `R9-182` (el cambio local que no subió se conserva aquí) en los dos casos, junto con
    `R9-203`.

- **`R9-203` (S31, `SyncEngine` / cola — P3) — 🐛 una lápida rechazada re-inserta el doc en cada
  intento.** MEDIDO (S31-A2, sonda D1; re-medido). Ya existía.
  - Cuando la reversión del rechazo es un `modified`, con lo local `null` no hay LWW que la frene: el
    doc reaparece tras cada intento, con la lápida todavía en la cola (8 `applyRemoteUpsert`).
  - La guarda de `R9-176` cubre solo la rama del `removed`.
  - **Arreglo (sin medir):** extender esa guarda a una entrega que no sea `removed` cuando hay
    escritura propia en cola y lo local está ausente.

- **`R9-204` (S31, `SyncEngine` / conflictos — P3) — 🐛 tras reiniciar, un conflicto resuelto con
  keepMine vuelve como fantasma mientras su subida no llegó; `R9-183` lo extiende a cualquier
  antigüedad.** MEDIDO (S31-A2, sondas G1/G2/G3; re-medido).
  - **El mecanismo:** keepMine no reescribe la fila local, y la marca se borra en el acto (fuera de
    la cadena) mientras el avance del cursor espera en ella (`R9-183`). La re-entrega de «lo suyo»
    cae en la ventana de 30 s y se detecta otra vez.
  - Ya existía con «lo suyo» a menos de 5 min (G3off, igual con y sin `R9-183`). `R9-183` lo extiende
    a cualquier antigüedad cuando la cadena se corta (G1 con la lectura colgada; G2off, reinicio sin
    red): es el costo de haber recuperado Y. En RNFB, con la lectura colgada, dura hasta que muere el
    proceso. No hay pérdida sin que el usuario elija. Las pruebas de `R9-183` no miran los
    conflictos tras reenganchar.
  - **Arreglo (C4, medido por A2 y re-medido con P2/P3):** keepMine reescribe la fila local con
    `resolvedValue` bajo `withLocalWriteSuppressed` antes del `queueWrite`, como merge y keepTheirs:
    G1/G2off/G3off sin fantasma, 187/187 con la sonda. La prueba sería la G1.
  - **✅ ARREGLADO en la sesión 32** (`d85fe19`, rama `fix/s32-r192-r193-y-s31`): C4 (keepMine
    re-sella la fila local bajo `withLocalWriteSuppressed` antes del `queueWrite`, y mira la sesión
    después). 2 pruebas: la G1 de S31-A2, y keepMine sumado al `it.each` de `R9-153`. C4 las tumba
    2; el `isCurrent()` tras re-sellar 1 (lo de Ana cae en la nube y el cursor de Beto).
  - **⚠️ Sesión 33:** con el ref atrasado de favoritos, C4 escribe en la fila la copia de antes de
    la última edición. Medido: la edición se perdía igual sin C4 (al volver el eco); C4 adelanta la
    pérdida. Es `R9-210`.

- **`R9-205` (S31, `SyncEngine` / cola — P3) — 🐛 la cola se guarda sin esperar: si el proceso muere
  entre la escritura del adaptador y la de la cola, esa edición no sube nunca.** MEDIDO en el mock
  (S31-A3, la sonda de la caída, puntos M2 y M4; re-medido). Ya existía.
  - `persistQueue` se llama con `void`. En todas las variantes, la base incluida, queda local L2 /
    nube L1 para siempre.
  - Es la consecuencia de `R9-38` (lo local que nunca sube) con otro disparador; una reconciliación
    que arregle `R9-38` lo cubre.

- **`R9-206` (S32, `SyncEngine` / conflictos — P3) — 🐛 con los sellos de `R9-193`, el caso
  `remoteTs === heldAt` de la rama retenida (la (b) de `R9-181`) ya no agregaba nada.** MEDIDO: la
  matriz entera de la 32, sobre `e7d7fb8`, dio 0 para `S181-b` (antes tumbaba 5).
  - La marca solo se mueve a una copia del otro teléfono, y la rama A de `R9-193` ya toma toda copia
    más vieja que no sea propia. Lo único que el caso agregaba era una copia PROPIA en la marca (un
    salto de `R9-46` con `getLocal` fallido la mueve ahí), donde daba «lo mío contra lo mío». Leído,
    no medido.
  - **✅ ARREGLADO en la sesión 32** (`bbe855e`, rama `fix/s32-r192-r193-y-s31`): quitado, con la
    variable, por la regla 37. Sumarlo de vuelta da 0; sin la rama A caen 14 (la cobertura de la marca
    pasó entera a A).
  - **Y abrió su vecino, visto en la matriz siguiente (sobre `bbe855e`):** `S181-marca` (el eco propio
    no mueve la marca) pasó de 8 a 0. Sus 8 pruebas caían por el fantasma que daba este caso con la
    marca en una copia propia (corolario 42 en el mismo commit). La guarda no es equivalente: la marca
    es el piso tras reiniciar, y subida a mi eco deja fuera una escritura atrasada del otro. Prueba
    nueva (`c1664a5`): sin la guarda, esa escritura no llega y el conflicto se pierde en silencio.
  - **Nota de la sesión 33 (medido, sonda `3d`):** `S190-propia` bajó de 3 a 2 porque la prueba
    `R9-196 … mi edicion en cola` caía solo por el fantasma de este caso. Con la guarda revertida,
    hoy la marca, los conflictos, la cola y la nube quedan idénticos. La guarda la siguen vigilando
    las dos pruebas de `R9-190`, cuya copia propia queda bajo el piso.

- **`R9-207` (S33, `SyncEngine` / cola — P3) — 🐛 el vecino de `R9-189`: si el eco de W1 se
  procesa DESPUÉS del ack de W2, la ventana de 30 s lo toma por el otro: «w2 contra w1».** MEDIDO en
  el mock (sonda `W` de la S33). Ya existía: con `+W` revertido da idéntico.
  - **El caso:** la cadena de lotes de la colección está ocupada (en la sonda, un `getLocal` lento de
    otro doc; en el teléfono, un lote grande de SQLite, como la primera sincronización) y el hilo de
    escrituras no. W1 y W2 (6 s después) suben y se confirman; sus ecos esperan su turno.
  - **Medido:** con `subidas ["w1","w2"]` y la cola vacía, al soltar la cadena aparece
    `[["w2","w1"]]`, sea W2 una entrada nueva o el reemplazo de W1. **keepTheirs deja local `w1` y
    nube `w2`**, sin nada en cola: el teléfono y la nube divergen en silencio.
  - `+W` (`R9-189`) lo cierra solo mientras la entrada de W2, que lleva el reloj de W1 en `own`,
    sigue en la cola. Al confirmarse, `noteOwnAcked` de un doc sin conflicto guarda en
    `recentAcked` solo el reloj de W2, e `isOwnCopy` no lee `recentAcked`.
  - **Arreglo (hipótesis, sin medir):** que el ack de un doc sin conflicto conserve los relojes de la
    entrada (el suyo y su `own`) por lo menos `CONFLICT_WINDOW_MS`, y que solo la ventana de 30 s los
    consulte. Ver `detail/S33-revision-del-diff-s32.md` §5.
  - **✅ ARREGLADO en la sesión 34** (`4a36f22`, rama `fix/s34-r207-r210`). **DECISIÓN (delegada por
    Victor al orquestador, «a tu mejor criterio»): `isOwnCopy` lee `recentAcked`, que guarda por doc
    los relojes de las escrituras tomadas sin conflicto en este proceso (el suyo y los de su `own`,
    los 16 más nuevos; `+Y` toma el último).** Medido por S34-A2 sobre el mismo caso contra tres
    alternativas:
    - el plazo de reloj de pared de la hipótesis («por lo menos `CONFLICT_WINDOW_MS`») vence con la
      cadena ocupada más de 30 s, y el fantasma vuelve;
    - que solo la ventana consulte deja el mismo eco tardío en la rama `pending`, donde reemplaza la
      escritura del otro como «su versión» («w2 | w1» en lugar de «w2 | r»); podar por distancia de
      reloj deja ese caso con W1 a 40 s de W2;
    - descartar la entrega que otra posterior del mismo doc reemplazó oculta la escritura del otro
      que llegó antes que la del usuario.

    **El porqué:** sigue habiendo UNA respuesta a «¿es mía?», y las cuatro ramas dicen lo mismo de la
    misma copia. `+Y` se aceptó porque no respondía nada; ahora responde, pero solo agrega «mía»
    dentro del proceso y nunca crea una marca. En memoria alcanza: tras reiniciar, el reloj de una
    escritura del proceso anterior viaja persistido en `own`, que el ack pliega en la lista (medido:
    `reinicio`, `reinicioW3` y `enganche`, este último ya fantasma en `17788ae`).

    **Coste:** una copia del otro con el mismo milisegundo que una de las últimas 16 escrituras del
    doc se toma por mía (el límite que `isOwnCopy` ya documentaba), y unos 40-55 B más por doc
    escrito. La guarda de `handleSnapshot` suelta la marca de una copia leída con un reloj tomado
    antes del conflicto: es la regla de `R9-190` (medido en W6).

  - **Pruebas:** 5, y las 5 caen sobre `17788ae`. La variante `reemplaza` de la sonda de la 33 no
    reemplazaba, porque W1 ya estaba confirmada; la prueba retiene su ack. **Piezas** (sobre 225):
    R207own 5, R207fold 1, R207acum 1, y las que SUMAN la poda por distancia y la forma «solo la
    ventana», 1 cada una. `W` pasa de 3 a 7 y `Yset` de 2 a 7. Ver `detail/S34-arreglos-s33.md` §2.
  - **Sesión 35, la revisión de esta decisión:** el «mía» de más suelta algo en las dos ramas que no
    se habían sondeado (un respaldo del otro con una escritura mía de este proceso): `R9-216`.

- **`R9-208` (S33, `SyncEngine` / conflictos — P3) — 🐛 con la tabla de sellos ilegible en un
  arranque, el ack siguiente de otro doc en conflicto la reescribe sin los demás: el fantasma
  «lo mío contra lo mío» queda para siempre.** MEDIDO en el mock (sonda `OWN` de la S33).
  - **El caso:** el de `R9-196` con L3 descartada (L2 subió con el conflicto, sello propio; nube L2,
    local L3). Un arranque no puede leer `@sync_own_`: «lo mio 3 | lo mio 2» aparece en esa sesión
    (la degradación que el comentario de `loadUnsettled` acepta).
  - **Sin otro ack:** el disco conserva el sello y el arranque siguiente ya no lo muestra.
  - **Con otro ack** (un segundo conflicto de la misma colección sube una edición en esa sesión): la
    tabla, cargada VACÍA, se guarda: el disco pasa de `{"doc-c":[…]}` a `{"doc-d":[…]}`, y el
    fantasma vuelve en cada arranque. Elegir «lo suyo» aplica L2 y pierde L3 en local.
  - Es la forma de `R9-195` en la tabla de sellos, y el corolario 42 dentro de `R9-193`: su
    escritura suelta lo que su persistencia hacía durable. El comentario de `ownStamps` («at every
    instant a stamp is on disk in the queue or here») deja de ser cierto en ese caso.
  - **Arreglo (hipótesis, sin medir):** con la tabla ilegible, no escribirla en esa sesión (como
    `unsettledUnsaved`), o releerla y unir antes de escribir.
  - **✅ ARREGLADO en la sesión 34** (`b7e3c0f`). S34-A1 midió las dos hipótesis sobre la misma
    sonda, con 9 variantes:
    - no escribir la tabla mueve el fantasma a `doc-d` en un reinicio normal;
    - releer con la cola por delante rompe la promesa de `persistQueue` si el proceso muere entre las
      dos escrituras;
    - un `await` dentro de `persistQueue` dejaría al `stop()` sin escribir bajo el dueño (leído).

    **Elegida:** mientras una tabla ilegible tiene sellos por escribir, `persistQueue` no escribe nada
    y la relee (`rereadOwn`). Al volver, une disco y memoria (solo los docs en conflicto) y la cola
    sale con la tabla en UN `multiSet`. Si la relectura falla, o la sesión termina antes, la cola sale
    sola y la tabla de disco queda intacta. Entraron además tres vecinos medidos:
    - un JSON roto se lee como vacío;
    - la poda con la lista de conflictos ilegible no suelta sellos;
    - `stop()` escribe con `force` y vacía `ownDirty`.

    **Coste:** en ese estado, `await persistQueue()` vuelve antes de la escritura. Y si la relectura
    también falla, los sellos de esa sesión quedan en memoria: «d mio 3 | d mio 2» tras reiniciar, en
    vez del fantasma permanente de hoy.

  - **Pruebas:** 9 (7 caen sobre `17788ae`; las otras 2 son controles y lo dicen). **Piezas** (sobre
    220, re-medidas en el árbol del orquestador): marca 6, noEscribir 2, releer 5, diferir 2, y 1
    cada una fuerza, pendiente, stopFuerza, stopVacia, unionPoda, parse y poda.
  - Vecino medido, sin arreglar: la cola ilegible al hidratar (`R9-212`).
  - **Sesión 35, la revisión de este arreglo:** el coste, medido, es `R9-217` (solo con una
    edición del doc en cola al reiniciar). La relectura deja dos huecos que abrió: `R9-215` (una
    relectura que sobrevive al `stop()`) y `R9-218` (`force` de toda la escritura). La sesión
    degradada hace falsa la premisa de `R9-206`: `R9-219`.

- **`R9-209` (S33, `SyncEngine` / conflictos — P3) — 🐛 la rama `pending` SIN copia local no
  pregunta `isOwnCopy`: el eco de mi escritura, con el doc ya borrado aquí, pasa a ser «su
  versión».** MEDIDO en el mock (sonda `NULL` de la S33). Ya existía: con `+Npend` revertido da
  idéntico.
  - `SyncEngine.ts:1693-1696`: con `local` nulo, `theirs = !deleted && data.updatedAt !==
pending.remoteVersion.updatedAt`.
  - **El caso** (la forma de `R9-189`): conflicto L/R en memoria; el `set` de W1 espera el hilo
    único (una lectura en curso, `R9-177`); el usuario borra el doc (la lápida reemplaza a W1, con
    `own [W1]`); al soltar sube W1 y su eco llega con lo local borrado.
  - **Medido:** `[["lo mio","w1"]]`. **keepTheirs deja local y nube en `w1`:** revive el doc que el
    usuario borró con su edición vieja, y la versión del otro (R) se va de la nube. El control con
    W2 en vez del borrado conserva «lo suyo».
  - La 32 hizo preguntar `isOwnCopy` a la rama con copia local (`R9-174`) y dejó a su vecina
    (corolario 18).
  - **Arreglo (hipótesis, sin medir):** `&& !this.isOwnCopy(...)` también en esa rama.
  - **✅ ARREGLADO en la sesión 34** (`275b5df`): la hipótesis, medida con la sonda `NULL`. `borra`
    da `[["lo mio","lo suyo"]]` y keepTheirs deja «lo suyo» en local y en la nube; el control
    `edita` no cambia. Prueba: 1. Pieza: tumba 1, la suya, por la razón correcta. La vecina que pedía
    mirar el prompt (una lápida DEL OTRO con lo local borrado) es `R9-211`.

- **`R9-210` (S33, favoritos / conflictos — P3) — 🐛 keepMine con el ref atrasado de favoritos
  sube la copia de ANTES de la última edición, y la edición en cola se pierde.** MEDIDO en el mock
  (sonda `3a` de la S33, la fila y el ref por separado). Es la pregunta de la 32 sobre C4.
  - En `favorites`, `getLocal` lee un ref que se copia de la fila después del render (`R9-174`). Si
    keepMine llega dentro de ese render, `R9-36` toma por «lo mío ahora» la copia anterior: la cola
    reemplaza la edición E por esa copia re-sellada, y su eco gana por LWW.
  - **Medido:** hoy, la fila pasa a «lo mio» al resolver, y al final fila y nube quedan en «lo mio».
    Sin C4 (`R9-204`), la fila conserva E hasta que vuelve el eco, y el final es el mismo. **C4 no
    crea la pérdida: la adelanta.**
  - `memoryCards` no puede: nunca registra conflictos (`getMaterialFields()` devuelve `[]`).
  - Es el resto de la raíz de `R9-174`: su arreglo cerró solo el eco. Alcance: el toque de keepMine
    en el mismo render que la edición del mismo favorito.
  - **Arreglo (hipótesis, sin medir):** la de `R9-174` (actualizar el ref donde se escribe la fila,
    antes del `queueWrite`), o que `getLocal` de favoritos lea la fila de SQLite.
  - **✅ ARREGLADO en la sesión 34** (`682f852`). S34-A3 midió con el provider, el adaptador y el
    motor reales:
    - el ref adelantado en los 6 sitios que escriben, con el efecto, vuelve atrás durante una vuelta,
      y un keepMine ahí sube la copia vieja (sonda S5k);
    - sin el efecto cierra este caso, pero no la carga en frío de `R9-133`.

    **Elegida:** `getLocal` = `initialize()` + `getFavoriteById`, sin catch. Cierra este caso, la
    carga en frío de `R9-133` y la ventana de la sesión 23. Cuesta una SELECT por clave primaria.

  - **Pruebas:** 3, en `__tests__/favoritesGetLocalRow.test.tsx`, con el provider y el motor reales y
    SQLite en memoria. No miden cuánto dura la ventana en el teléfono, ni la carrera entre la lectura
    de keepMine y la escritura de C4. La del `initialize()` la agregó el orquestador (la sonda S9 de
    A3), porque esa pieza no tenía ninguna. **Piezas** (suites de favoritos, 6): GL 2, GLinit 1, y las
    dos alternativas 1 cada una (la de `R9-133`).
  - Vecino medido, sin arreglar: el bulk push de favoritos en la carga en frío (`R9-214`).

- **`R9-211` (S34, `SyncEngine` / conflictos — P3) — 🐛 con lo local borrado y el conflicto en
  memoria, la lápida del OTRO dispositivo se toma por el eco de la mía.** MEDIDO en el mock (sonda
  `_scratch/S34-sonda-lapida.body.txt`). Ya existía: la rama `deleted` no cambió con `R9-209`.
  - `SyncEngine.ts`, la rama `pending` sin copia local: con `deleted`, `theirs` es `false` siempre.
  - **Medido:** el usuario borra aquí (su lápida sube y vuelve) y después el otro teléfono también
    lo borra. El conflicto sigue mostrando «lo mio | lo suyo», y **keepTheirs revive «lo suyo» en
    local y en la nube**, aunque el otro también lo borró. El control con solo mi lápida da lo mismo,
    y ahí es lo correcto.
  - **Arreglo (hipótesis, sin medir):** distinguir mi lápida por `isOwnCopy` y tratar la del otro
    como «su versión» (o, con los dos lados borrados, soltar el conflicto).

- **`R9-212` (S34, `SyncEngine` / cola — P2) — 🐛 con `@sync_queue_v1` ilegible al hidratar, la
  primera escritura de la cola la reescribe sin las entradas de antes.** MEDIDO en el mock (S34-A1,
  sonda `_scratch/S34-A1-sonda-cola.body.txt`), idéntico con y sin `R9-208`.
  - `hydrateQueue` deja `this.queue = []` y `queueHydrated = true`.
  - **Medido:** `{"antes":["doc-q"],"memP1":[],"despues":["doc-z"],"nubeQ":null}`. La
    edición en espera queda solo en local y no sube nunca (la familia de `R9-38`).
  - Es la forma de `R9-195`/`R9-208` en la cola. P2 y no P0, porque hace falta que falle la lectura
    de `AsyncStorage`.
  - **Arreglo (hipótesis, sin medir):** con la cola ilegible, no escribirla hasta releerla y unir,
    como los sellos de `R9-208`.
  - **✅ ARREGLADO en la sesión 49** (`024bef8`, rama `fix/s49-arreglos`). La hipótesis, medida y
    con una salida. Mientras `getItem` de la cola falla (`queueUnread`), ninguna escritura la toma.
    Se relee en `start()` (antes de enganchar) y en la escritura, y las de disco se unen a las de
    memoria. La relectura es del proceso: la cola es de todas las cuentas.
    - **Lo que la medición cambió de la hipótesis:**
      - la unión no devuelve una entrada de un doc cuya copia cambió aquí (una edición encolada, o
        una copia aplicada desde la nube): `set` no tiene guarda, y la subía encima;
      - esperar no es para siempre: si la relectura que una escritura espera también falla, la
        cola se escribe desde memoria, como antes. Una lectura puede fallar siempre (la
        `CursorWindow` de 2 MB de Android, leído, sin medir), y esperando, ninguna edición
        posterior llegaba a disco nunca más.
    - **Un texto que no es JSON** se lee como vacío, como la tabla de sellos. Releerlo da lo mismo,
      y una copia aparte no tendría lector.
    - **Pruebas: 9.** Cada pieza tumba la suya por la consecuencia (`R212own`, el mecanismo, y lo
      dice). Las dos guardas juntas, la tabla de sellos y la cola, dan lo mismo que la tabla sola.
    - **Coste:** con la relectura que también falla, las entradas de disco se pierden, como antes.
      Mientras la cola no se lee, la UI no las cuenta.
    - **Lo que encontró el control:** un disparador común de `R9-126`, anotado ahí.
    - **⚠️ Sesión 50:** el arreglo abrió `R9-254` (una edición durante la hidratación que falla
      sale de memoria) y `R9-255` (la entrada vieja sigue en disco hasta la unión), y cuatro de sus
      comentarios no se sostienen caso por caso (`R9-258`).

- **`R9-213` (S34, `SyncEngine` / conflictos — P3) — 🐛 keepTheirs de un conflicto registrado contra
  una copia local que el servidor YA había tomado no sube «lo suyo».** MEDIDO en el mock (S34-A2,
  sonda W5), idéntico en `17788ae`.
  - **El caso:** R llega y espera la cadena; W2 se escribe, sube y se confirma; al soltar, R se
    compara con W2 y abre el conflicto.
  - `conflictsWrittenHere` (`R9-161`/`R9-199`) solo anota lo encolado o tomado MIENTRAS el conflicto
    está en memoria. Esta escritura se tomó antes, así que keepTheirs cree que la nube tiene R:
    **el teléfono queda en R y la nube en W2, en silencio.**
  - **Arreglo (hipótesis, sin medir):** al registrar el conflicto, si el reloj de la copia local es
    uno que el servidor ya tomó (`recentAcked`), anotarlo en `conflictsWrittenHere`. Coste: si R se
    escribió DESPUÉS del ack de W2, keepTheirs subiría R re-sellada, una escritura de más.

- **`R9-214` (S34, favoritos / sync — P3) — 🐛 el bulk push de favoritos durante la carga en frío
  sube 0 favoritos y graba el flag `'2'`.** MEDIDO con el provider real (S34-A3, sonda S8).
  - `pullAllLocal` (`FavoritesContext.tsx`, la línea 220 de la 33) sigue leyendo `favoritesRef`,
    vacío hasta que termina la primera carga.
  - **Medido:** `{"dentro":{"loading":true,"cola":[],"flag":"2"},"trasCargar":{"nube":null}}`.
    Esos favoritos no suben nunca por esa vía.
  - Alcance, por lectura: un `start()` con el flag sin `'2'`/`'skip'` antes de que termine la carga
    (un flag viejo `'1'`, un arranque en frío con la sesión ya abierta, o la carga fallida).
    `exportLocalData` (el conteo del diálogo de migración) lee el mismo `pullAllLocal`.
  - Es la raíz de `R9-133` en otra línea.
  - **Arreglo (hipótesis MEDIDA por A3, sin prueba):** `pullAllLocal` = `initialize()` +
    `getFavorites()`.
  - **✅ ARREGLADO en la sesión 49** (`d3e45a7`, rama `fix/s49-arreglos`): la hipótesis, sin
    `catch`, como `getLocal` (los dos que la llaman registran el fallo). `exportLocalData` lee la
    misma. Prueba: 1, en `favoritesGetLocalRow.test.tsx`, con el provider y el motor reales y
    `initialize()` detenido. Cae sin el arreglo y sin el `initialize()`, por la consecuencia: la
    nube sin el favorito.
  - **⚠️ Sesión 50:** sin `catch`, un fallo de `getFavorites()` en el bulk push graba el flag `'2'`
    sin subir nada (`R9-257`, medido). Antes subía desde el ref, si la carga ya había terminado.

- **`R9-215` (S35, `SyncEngine` / cola — P3) — 🐛 una relectura de la tabla de sellos que sigue en
  vuelo tras un `stop()` deja sin escribir la cola de la sesión siguiente.** MEDIDO en el mock
  (sonda `_scratch/S35-sonda-rereading.body.txt`). Lo abrió `R9-208`.
  - `ownRereading` (`SyncEngine.ts:482`) no se vacía en `stop()` y va por colección (no por sesión
    ni por uid). Si la tabla vuelve a fallar al enganchar la sesión 2, la escritura que esa sesión
    difiere pide su relectura, y `rereadOwn` (`:2497`) sale sin leer porque la de la sesión 1 sigue
    en vuelo. La de la sesión 1 vuelve, ve otra sesión y sale sin escribir (`:2512`).
  - **Medido** (la misma cuenta; doc-c, en conflicto, sube en la sesión 2 y d4 queda en cola sin
    red): en disco queda `["lo mio 4"]` (la entrada que ya subió) y falta `d mio 4`, también
    después de que vuelve la relectura vieja; el proceso nuevo arranca con `["lo mio 4"]`. **La
    edición d4 queda solo en local y no sube nunca.** El control, con la relectura vieja ya
    vuelta, da `["d mio 4"]` en los tres puntos.
  - **Lo abrió `R9-208`:** con `diferir` revertida (pieza de A1), la misma sonda da `["d mio 4"]`.
  - La ventana dura hasta la escritura siguiente de la cola o el `stop()`. Hacen falta dos lecturas
    fallidas de la tabla (una por enganche) y que el proceso muera en esa ventana.
  - **Arreglo (hipótesis, sin medir):** `ownRereading` por sesión (o vaciarlo en `stop()`), y que la
    relectura de una sesión terminada no tape la de la siguiente.

  - **✅ ARREGLADO en la sesión 36** (`8c7658c`, rama `fix/s36-r215-r219`). La hipótesis, medida:
    `ownRereading` anota la sesión que pidió la relectura (un `Map`), y solo una de la misma sesión
    tapa otra. Prueba: 1, la sonda `rereading` de la 35. Cae sin el arreglo (pieza `R215`) por la
    razón correcta: en disco `["lo mio 4"]` y no `["d mio 4"]`. La guarda que solo borraba la marca
    de la propia sesión daba 0 (una relectura duplicada no hace daño) y se quitó (regla 37).

- **`R9-216` (S35, `SyncEngine` / conflictos — P3) — 🐛 el «mía» de `recentAcked` toma por eco un
  respaldo del otro que trae una escritura mía de este proceso: «su versión» no se refresca, o el
  conflicto se asienta en silencio.** MEDIDO en el mock (sondas
  `_scratch/S35-sonda-{respaldo,retenida}.body.txt`). Lo abrió `R9-207` (corolario 42).
  - `isOwnCopy` (`:2438`) dice «mía» a toda copia con el reloj de una escritura que el servidor tomó
    sin conflicto en este proceso. Por `updatedAt` no distingue el eco tardío (el caso de `R9-207`)
    de un respaldo que el otro restaura con esa misma escritura adentro.
  - **El caso:** W1 sube sin conflicto; después, conflicto L contra R; el otro restaura un respaldo
    que tiene W1.
  - **La rama `pending`:** «su versión» sigue «lo suyo» y **keepTheirs deja local `lo suyo` y nube
    `w1 mio`**. El control (W1 escrita por el otro) pasa «su versión» a W1, y los dos terminan en
    W1.
  - **La rama retenida** (la que A2 analizó solo leyendo): `stop()`, el otro restaura con la app
    cerrada y `start()` de la misma cuenta en el mismo proceso. **El conflicto se asienta en
    silencio** (sin conflictos, marca `null`): local `lo mio` (más nueva, sin nada en cola) y nube
    `w1 mio`, para siempre. Los dos controles (W1 del otro; un proceso nuevo) muestran
    `lo mio | w1 mio`.
  - **Lo abrió `R9-207`:** con `R207own` revertida, las dos ramas dan lo mismo que el control.
  - Los costes que el ledger aceptó para `R9-207` (el mismo milisegundo de otra escritura; la guarda
    de `handleSnapshot` que suelta la marca, W6) no dicen estas dos consecuencias.
  - **Arreglo (hipótesis, sin medir):** que un reloj de `recentAcked` cuyo eco ya llegó una vez deje
    de responder «mía» (el eco tardío llega una sola vez; un respaldo la trae de nuevo).

  - **✅ ARREGLADO en la sesión 36** (`2bfbcf8`). La hipótesis, medida y precisada: `noteEcho`,
    justo antes de `applyRemoteChange`, anota la copia cuya entrega trajo primero cada reloj de este
    teléfono, y `isOwnCopy` acepta un reloj de `recentAcked` solo en esa copia (`recentEchoed`). Un
    reloj cuyo eco nunca llegó sigue respondiendo para cualquier copia.
    - **Lo que la medición cambió de la hipótesis:** anotar solo los relojes ya tomados no alcanzaba
      (las dos pruebas seguían cayendo): el SDK entrega el eco antes del ack, con la escritura todavía
      en cola. El eco se anota también con el reloj de la entrada en cola o de su `own`.
    - **Pruebas:** 3. Las dos del caso (rama `pending` y rama retenida) caen sin el arreglo (`R216own`,
      `R216note`, `R216cola`). La de la memoria (20 escrituras: 17 ecos, los 16 de `recentAcked` y el
      de la última) cae sin la poda (`R216poda`) y dice que no mide una consecuencia. Sin la identidad
      de la copia (`R216same`) caen las de `R9-207`: es la que mantiene su caso.
    - **Corrección de la sesión 37 (medido):** «un reloj cuyo eco nunca llegó sigue respondiendo para
      cualquier copia» es falso. `noteEcho` anota como eco la PRIMERA copia que trae el reloj, sea
      cual sea, y desde ahí solo esa es «mía». Si esa primera es el respaldo del otro, vuelve el daño
      de este hallazgo: `R9-222`. Y el eco de más de la prueba de la memoria no es «el de la última»:
      es w4, el que el ack de w20 sacó de `recentAcked`, hasta el eco siguiente (`R9-232`).
  - **Sesión 38:** el mecanismo (`recentEchoed` y `noteEcho`) se reemplazó por `noteArrived`
    (`24a61bc`, `R9-220`/`R9-222`): la copia ajena que llega retira los relojes tomados del doc. Las 2
    pruebas del caso siguen, y caen con `R222olvido`. La de la memoria se quitó con la estructura.

- **`R9-217` (S35, `SyncEngine` / conflictos — P3) — 🐛 el coste aceptado de `R9-208`: con la tabla
  ilegible toda la sesión, una edición del doc que queda en cola tras el ack da «lo mío contra lo
  mío» al reiniciar.** MEDIDO en el mock (sonda `_scratch/S35-sonda-coste.body.txt`).
  - **Medido** (d2, de doc-d en conflicto, sube; la tabla no se lee nunca): con d3 en cola sin red,
    el proceso nuevo muestra `[["d mio 3","d mio 2"]]`. Sin d3 en cola, o con d3 subida, nada.
  - La entrada de d3 no lleva el reloj de d2: `queueWrite` (`:1108`) copia a `own` solo el último de
    `recentAcked`, y el ack de un doc en conflicto va a `ownStamps` (que esa sesión no puede
    escribir).
  - **La prueba no lo dice** (corolario 44, observación): «R9-208: si la tabla de sellos sigue
    ilegible al releerla…» es este caso, y filtra los conflictos a doc-c (`fantasmaC`,
    `SyncEngine.test.ts:8534`) sin decir que el de doc-d aparece.
  - Anotado aquí, sin número propio: `rereadOwn` une solo los docs de `isConflictDoc`, y el enganche
    conserva todo doc retenido si la lista de conflictos no se pudo leer. Medido en disco
    (`S35-sonda-union`: `["doc-d"]` contra `["doc-c","doc-d"]`), sin consecuencia alcanzada: la
    misma sesión reescribe la lista de conflictos sin doc-c.
  - **Arreglo (hipótesis, sin medir):** que la entrada nueva lleve también el último sello propio
    del doc (`ownStamps`), como `R9-194` hace con `recentAcked`.

  - **✅ ARREGLADO en la sesión 36** (`31cc55a`). La hipótesis, medida: la entrada nueva de un doc
    que es conflicto de esta sesión (`isConflictDoc`) lleva también el último sello de `ownStamps`.
    La guarda importa: tras un `stop()`, el mapa sigue siendo de la cuenta anterior hasta el enganche.
    Pruebas: 2. La del caso cae sin el arreglo (`R217`); la de Ana y Beto vigila el «por uid» y cae
    sin la guarda (`R217guard`). La prueba de `fantasmaC` dice ahora qué pasa con doc-d.
  - **Corrección de la sesión 38 (`R9-227`):** el coste no existe solo si queda una edición
    posterior del doc en cola al reiniciar (`detail/S35-revision-del-diff-s34.md`): también si una
    edición posterior se descartó (8 rechazos), porque su entrada era el único disco del sello.

- **`R9-218` (S35, `SyncEngine` / conflictos — P3) — 🐛 con dos tablas de sellos ilegibles, la
  relectura que falla en una escribe la cola sin la otra, cuya relectura sigue en vuelo.** MEDIDO
  el orden de las escrituras (sonda `_scratch/S35-sonda-dos.body.txt`, con el estado sembrado). Lo
  abrió `R9-208`.
  - `force` (`:993`) es de toda la escritura: la relectura fallida de `ca` llama
    `persistQueue(true)`, y la cola sale ya, sin la tabla de `cb`.
  - **Medido:** con `ca` fallando y `cb` bien, las escrituras son `queue` y después `queue+cb`. Con
    las dos bien, una sola (`queue+ca+cb`), en los dos órdenes. Siempre converge, y la que falla
    queda pendiente para la escritura siguiente.
  - Es el orden que prohíbe la segunda prueba de `R9-208` (el proceso muere después de guardar la
    cola sin la escritura subida de otro conflicto), en la segunda colección. La muerte entre las
    dos escrituras no se sondeó: es el mecanismo de esa prueba.
  - **Arreglo (hipótesis, sin medir):** `force` solo para la colección cuya relectura falló; la
    cola espera a las demás relecturas en vuelo.

  - **✅ ARREGLADO en la sesión 36** (`f785702`). La hipótesis, medida: la relectura fallida anota su
    tabla en `ownGaveUp`, y la escritura deja de esperar solo a esa. Sale en cuanto no queda otra
    relectura en vuelo, y vacía el conjunto (la siguiente las vuelve a leer). `force` queda para
    `stop()`. Con las dos relecturas fallando, una ronda por escritura: no hay bucle.
    - **Prueba:** 1, con dos colecciones reales y el disco de una sesión anterior. El proceso muere
      tras la primera escritura de la cola sin las dos entradas, y la prueba mira el sello de Wb en la
      tabla de `test2`. Cae sin el arreglo (`R218`) por el sello que falta.
    - `R218clear` (no vaciar el conjunto) tumba la prueba de `R9-208` de la relectura que falla una
      vez.

- **`R9-219` (S35, `SyncEngine` / comentario — P3) — 🐛 la premisa del comentario de `R9-206`
  («the mark only moves to a copy of the other device») es falsa en la sesión con la tabla de
  sellos ilegible.** MEDIDO en el mock (sonda `_scratch/S35-sonda-marca.body.txt`).
  - **Medido** (`dosConflictos`; la tabla falla al enganchar): la marca de doc-c pasa de R (+65 000)
    a L2 (+120 000), que es mía. Sin sellos, la sesión toma L2 por la copia del otro.
  - Es la razón de que `+heldAt` pasara de 0 a 4 en la matriz de la 34: las 4 pruebas de `R9-208`
    con una sesión degradada y un reinicio después son las primeras que mueven la marca a una copia
    propia. En el reinicio la tabla se lee, L2 es mía y se asienta. `+heldAt` la registra como «lo
    mio 3 | lo mio 2».
  - Hoy no tiene consecuencia medida. El comentario (`SyncEngine.ts:1853-1855`) y la regla de
    `R9-190` (`:1499`) afirman algo que esa sesión no cumple (corolario 14).
  - **Arreglo:** decir en el comentario que la sesión con la tabla ilegible también mueve la marca a
    una copia propia, y por qué `remoteTs === heldAt` sigue sin hacer falta.

  - **✅ ARREGLADO en la sesión 36** (`0970726`): el comentario dice por qué `remoteTs === heldAt`
    sigue sin hacer falta en los dos casos (la copia del otro y la propia que la sesión degradada tomó
    por suya). Solo comentario, sin prueba: `+heldAt` ya la tumba en 4.
    - **Corrección de la sesión 37:** en `2bfbcf8` son **5**, no 4 (`S36-matriz-s36-2bfbcf8.out.txt`:
      la quinta es la prueba del coste de `R9-217`, que no existía en `0970726`). Y el arreglo quedó a
      medias: la regla de `R9-190` (`SyncEngine.ts:1544`) sigue sin la excepción (`R9-230`).

- **`R9-220` (S37, `SyncEngine` / conflictos — P3) — 🐛 con la 36, la copia de la nube de MI última
  escritura tomada, entregada otra vez en OTRO objeto, deja de ser mía: «lo mío contra lo mío» en el
  mismo proceso.** MEDIDO en el mock (A1 y A5; sondas `_scratch/S37-A1-{rendirse,cortada,reenganche}`
  y `S37-A5-sonda-rechazo`).
  - `isOwnCopy` acepta un reloj de `recentAcked` solo en el objeto de su eco (`R9-216`). El SDK
    vuelve a entregar la misma copia del servidor en otro objeto en la reversión de un rechazo, en el
    primer snapshot de un re-enganche de la misma cuenta y en la lectura tras un `removed`.
  - **Medido:** Wa sube sin conflicto; Wb (a menos de 30 s) la rechaza el servidor 8 veces y el motor
    se rinde (`R9-33`). La reversión trae Wa en otro objeto: `[["wb mio","wa mio"]]` con marca, en la
    sesión, en el re-enganche y tras reiniciar. Lo mismo con `stop()` justo tras el último rechazo
    (`cortada`: el re-enganche entrega Wa) y con una edición hecha con el motor parado
    (`reenganche`, caso `sinSesion`).
  - **¿De la 36?** En el mismo proceso, sí: con `R216own` o `R216note` revertidas, sin conflicto
    (`S37-A1-rendirse-sinR216own.out.txt`, `S37-A5-sonda-rechazo-sinR216own.out.txt`). Tras reiniciar
    ya existía: los dos árboles dan `[wb, wa]` (la entrada descartada se lleva el reloj de Wa; vecino
    de `R9-194`, sin entrada en cola). La 36 lo adelanta al mismo proceso.
  - No pierde datos: keepTheirs deja local y nube en Wa, y keepMine sube Wb. Pero rotula como «su
    versión» una escritura de este teléfono. Antes de la 36, en el mismo proceso, local (Wb) y nube
    (Wa) quedaban distintos sin conflicto: hay una tensión real.
  - **Arreglo (hipótesis, sin medir):** que el eco anotado deje de valer solo cuando el doc entrega
    después una copia que no es mía. Medirlo contra las 3 pruebas de `R9-216` y las 5 de `R9-207`,
    con el mock de `R9-221` arreglado.
  - **✅ ARREGLADO en la sesión 38** (`24a61bc`, junto con `R9-222`). La hipótesis de A1 (el eco
    anotado deja de valer cuando el doc entrega después una copia ajena) se midió como pieza (H1,
    `_scratch/S38-hip.cjs.txt`): cerraba este y ninguna ruta de `R9-222` (`S38-H1-sondas.out.txt`),
    porque un eco que nunca se anotó no puede dejar de valer. Lo que se quedó (H2): `noteArrived`
    decide «mía o no» al LLEGAR cada entrega, en el orden del SDK y antes de que su lote espere en la
    cadena (`R9-175`). Una copia mía lo sigue siendo para ese lote (`ownArrived`, un `WeakSet`), y una
    copia ajena borra los relojes de `recentAcked` del doc. Una escritura en vuelo está encima de la
    vista del SDK, así que ninguna copia del otro llega antes de su ack. Sin copia ajena entre medias,
    toda entrega de la copia de la nube es mía, venga en el objeto que venga.
    - **Prueba:** «W1 sube; W2 se rechaza hasta rendirse…» cae con el motor de la 36
      (`[["w2 mio","w1 mio"]]`, `_scratch/S38-rev-motor36.out.txt`). Ninguna pieza del motor nuevo la
      tumba: la identidad que abría el caso ya no existe.
    - **Sondas** (`S38-H2-sondas.out.txt`): `rendirse`, `cortada` y `rechazo` sin conflicto en el
      proceso. En un proceso nuevo sigue `[wb, wa]`: ya existía (la entrada descartada se lleva el
      reloj de Wa; vecino de `R9-194` y de `R9-227`). El caso `sinSesion` de `reenganche` vuelve a lo
      de antes de la 36 (local y nube distintos, en silencio): es `R9-235`.

- **`R9-221` (S37, pruebas / mock de Firestore — P3) — 🐛 el mock entrega el MISMO objeto cada vez
  que sale una copia de la nube sin cambios, y RNFirebase arma uno nuevo en cada entrega: la identidad
  de `R9-216` se mide en jest con una propiedad que el teléfono no tiene.** MEDIDO (A1, A5; y
  re-medido en el árbol principal por la 37).
  - `viewChange`, `__fire` y `get()` del mock devuelven `data: () => doc` con el objeto guardado en
    `serverDocs`. En RNFirebase 26.2.0, `data()` devuelve el `_data` que se parsea una vez al construir
    el snapshot (`FirestoreDocumentSnapshot.ts`): el mismo objeto dentro de una entrega, uno nuevo en
    cada entrega. El mock puede decir «mía» donde el teléfono dice «del otro», nunca al revés.
  - **Medido:** con dos `structuredClone` en el mock (en `deliver` y en el `get()` del doc,
    `_scratch/S37b-frescos-suite.cjs.txt`), la suite entera pasa 232/232
    (`S37b-frescos-suite.out.txt`). Con `R216cola` revertida y la sonda `S37-A1-rendirse`, el mock tal
    cual no da conflicto (`trasRendirse []`, `S37b-rendirse-sinR216cola.out.txt`) y con copias
    frescas da `[["wb mio","wa mio"]]` (`S37b-frescos-rendirse-sinR216cola.out.txt`): el mock
    escondía un caso.
  - **¿De la 36?** Es infraestructura de prueba, anterior. La 36 lo expone, porque es la primera que
    decide por la identidad del objeto. Corolario 35 (el mock que implementa el SDK).
  - **Arreglo:** esas dos líneas en el mock. Después, re-medir cada prueba de `R9-216` con su pieza
    revertida ANTES de tocar el motor: la identidad que miden en jest no es la del teléfono.
  - **✅ ARREGLADO en la sesión 38** (`0681c6e`). Una copia nueva por entrega (en `deliver`) y por
    lectura (en el `get()`), clonada UNA vez: dentro de una entrega es el mismo objeto, como el
    `_data` de `FirestoreDocumentSnapshot` (la sonda de A1 clonaba en cada `data()`). Con el mock
    nuevo, cada pieza de `R9-216` y `alt207own` tumbó las mismas pruebas que antes
    (`_scratch/S38-mock-*.out.txt`): ninguna hubo que reescribir. Con `R216cola`, `S37-A1-rendirse`
    da `[["wb mio","wa mio"]]` (`S38-mock-rendirse-sinR216cola.out.txt`), igual que A1.

- **`R9-222` (S37, `SyncEngine` / conflictos — P3) — 🐛 `noteEcho` toma por eco la PRIMERA copia que
  trae un reloj mío: si el eco verdadero no pasó por ahí, el respaldo del otro queda anotado como mi
  eco, y vuelve el daño de `R9-216`.** MEDIDO en el mock (A2, A4; la ruta (a), re-medida en el árbol
  principal por la 37).
  - Hay tres rutas, sin órdenes imposibles. **(a)** El eco se pierde con un `stop()` en el mismo tick
    del `set` (el ack llega igual y `stop()` anota el `pushing` en `recentAcked`). **(b)** El eco sale
    de la query como `removed`: una escritura mía con el reloj bajo el piso (restaurar MI respaldo),
    cuya lectura la encuentra en cola y hace `settle` + `continue` antes de `noteEcho`. **(c)** El
    reloj llega a otro proceso en el `own` de una entrada (`R9-194`, `R9-217`), y el eco quedó en el
    proceso anterior.
  - **Medido, ruta (a)** (`S37-A2-sonda-sineco`; la 37 la re-midió: `S37b-sineco.out.txt`): W1 sube y
    su eco no llega; conflicto L contra R; el otro restaura un respaldo con W1. Rama `pending`: «su
    versión» se queda en `lo suyo`, y keepTheirs deja local `lo suyo` y nube `w1 mio`, sin nada en
    cola. Rama retenida: el conflicto se asienta en silencio (marca `null`, local `lo mio`, nube
    `w1 mio`). Los controles (eco entregado; W1 del otro) muestran `lo mio | w1 mio`.
  - Con `R216same` revertida (`echo === undefined` solo), las dos ramas dan el control
    (`S37b-sineco-sinR216same.out.txt`): es la identidad `echo === copy`, con el respaldo anotado como
    eco, la que lo toma por mío. La ruta (b) da lo mismo (`S37-A2-sonda-bajo`), y la (c) también
    (`S37-A2-sonda-r217b`, modo `reinicio`). A4 lo vio con dos respaldos: el primero se toma por mío,
    y el segundo ya no (`S37-A4-sonda-sineco`).
  - **¿De la 36?** (a) y (b) ya existían: con `R216own` revertida, lo mismo
    (`S37-A2-sonda-{sineco,bajo}-sinR216own.out.txt`). La (c) la abrió `R9-217` para los docs en
    conflicto (con `R217` revertida, el control: `S37-A2-sonda-r217b-sinR217.out.txt`), y para los
    demás ya existía por `R9-194` (con la pieza `Yfold` revertida, el control:
    `S37-A2-sonda-r194-sinYfold.out.txt`).
  - **El comentario de `recentEchoed`** (`SyncEngine.ts:533`, «A clock whose echo never came still
    answers for any copy») es falso: responde por la primera copia que se entrega con ese reloj. Lo
    mismo en `R9-216` (corregido arriba) y en `detail/S36-arreglos-s35.md:113`.
  - **Sin medir** (A6, hipótesis): keepMine con nada en cola crea una entrada nueva que pasa la guarda
    de `R9-217`. Tras su ack, el sello va a `recentAcked`, y en un proceso nuevo sería la ruta (c).
  - **✅ ARREGLADO en la sesión 38** (`24a61bc`, junto con `R9-220`: ver allí). Las tres rutas,
    con las sondas de A2 (`_scratch/S38-H2-sondas.out.txt`): (a) `sineco stop` en las dos ramas, (b)
    `bajo` y (c) `r217b reinicio` quedan iguales a su control.
    - **Pruebas:** 3. Las 2 de la ruta (a) (ramas pendiente y retenida) caen con el motor de la 36 y
      con `R222olvido` (que la copia ajena no borre `recentAcked`), por `suya`, local y nube. La de la
      cadena («la escritura del otro llega después de mis ecos») cae solo con `R222llegada` (sin el
      veredicto de la llegada se ve «w2|w1» y después «w2|r»): vigila que la copia ajena no le quite
      el reloj a un eco que ya llegó y espera en la cadena. `R222nota` tumba 4. Salidas:
      `S38-rev-{R222olvido,R222llegada,R222nota,motor36}.out.txt`.
    - El comentario de `recentEchoed` («responde por cualquier copia») se fue con la estructura.

- **`R9-223` (S37, `SyncEngine` / conflictos — P3) — 🐛 el caso de `R9-216` sigue abierto por la COLA:
  con una edición mía en cola que lleva en `own` el reloj de W1, el respaldo del otro con W1 es «mío».**
  MEDIDO en el mock (A5; sonda `_scratch/S37-A5-sonda-cola.body.txt`).
  - `isOwnCopy` responde «mía» por el `own` de la entrada en cola (`+Y`, `R9-194`) antes de mirar
    `recentAcked`, y ahí no hay eco que mirar.
  - **Medido** (`w1YConflicto`; la subida de otro doc retenida por la cola, y L2 de doc-c en cola sin
    emitir): en la rama `pending`, «su versión» sigue en `lo suyo`, y keepTheirs re-sube `lo suyo`
    encima del respaldo; teléfono y nube iguales, pero en la versión que el otro reemplazó. En la
    rama retenida, el conflicto se asienta en silencio y L2 sube después (keepMine sin que el usuario
    elija). El control (la copia con el reloj + 1 ms) muestra el respaldo.
  - **¿De la 36? No: ya existía.** A5 no lo midió con la pieza revertida, y la 37 lo midió con una
    sola corrida: con `R216own`, `R216note` y `R217` revertidas juntas, las 4 líneas dan lo mismo
    (`S37b-A5cola-sin36.out.txt`). La rama de la cola es de `R9-193`/`+Y` (S32).
  - Sin medir: lo mismo en un proceso nuevo con L2 en cola (por lectura, igual: la entrada se
    persiste).
  - **✅ ARREGLADO en la sesión 38** (`af4f367`). La sonda de A5 encolaba L2 DESPUÉS de la copia
    del otro, y con `24a61bc` L2 ya no lleva el reloj de W1: pasa sin más. El caso abierto era la
    entrada YA en cola cuando llega la copia ajena (`_scratch/S38-cola2.body.txt`; antes del arreglo,
    `S38-cola2-H2.out.txt`): en P, keepTheirs subía «lo suyo» encima del respaldo; en H, se asentaba
    en silencio y subía L2. `noteArrived` borra el `own` de la entrada del doc, en el sitio (la entrada
    se reconoce por su objeto al volver el push, `R9-11`), y escribe la cola (`S38-cola2-R223.out.txt`:
    las dos ramas iguales al control).
    - **Pruebas:** 2 (pendiente y retenida). Caen con `R223own` y con el motor de `24a61bc`, por
      `suya`, local y nube (`S38-rev223-*.out.txt`). `R224disco` (no escribir la cola) las tumba por
      el `own` en disco.

- **`R9-224` (S37, `SyncEngine` / conflictos — P3) — 🐛 la rama de `ownStamps` no mira el eco: un
  sello de una escritura mía tomada con el doc en conflicto dice «mía» también al respaldo del otro
  que la trae.** MEDIDO en el mock (A2; sonda `_scratch/S37-A2-sonda-stamps.body.txt`).
  - **Medido:** conflicto L contra R; con el doc en conflicto subo W2 y W3 (sus acks van a
    `ownStamps`); el otro escribe R2, y después restaura un respaldo con W2. Rama `pending`: «su
    versión» sigue en R2, y keepTheirs deja local R2 y nube W2. Con W3 en cola, keepTheirs empuja R2
    re-sellada encima del respaldo. Rama retenida, en el mismo proceso y en uno nuevo: el conflicto se
    asienta en silencio (local W3, nube W2). Como `ownStamps` está en disco, pasa también tras
    reiniciar.
  - **¿De la 36? No: ya existía.** Con `R216own`, `R217` y `R216note` revertidas juntas, las 8 líneas
    dan lo mismo (`S37-A2-sonda-stamps-sin36.out.txt`). La rama es la de `R9-193` (S32).
  - Mirar el eco no lo cerraría entero: en un proceso nuevo, `recentEchoed` está vacío, y la primera
    entrega del reloj es el respaldo mismo (`R9-222`).
  - **✅ ARREGLADO en la sesión 38** (`697f61c`). `noteArrived` llama a `forgetOwnStamps` cuando
    llega una copia ajena, y escribe la cola con la tabla. Las 8 líneas de `S37-A2-sonda-stamps`
    quedan iguales a su control, también en un proceso nuevo (`_scratch/S38-stamps-R224.out.txt`).
    - **Pruebas:** 2 (pendiente y proceso nuevo). Caen con `R224sellos` (por la tabla en disco y por
      `suya`) y con el motor anterior. `R224disco` las tumba por la tabla en disco justo después de
      llegar R2, que es lo que encuentra un proceso que muere sin `stop()` (`S38-rev224b-*.out.txt`).
    - **Consecuencia (medida):** la copia del otro que entrega el enganche de un conflicto retenido
      retira los sellos viejos del doc, que la nube ya dejó atrás. La prueba nueva de `R9-229` lo
      muestra: la tabla de Beto queda `[300000]`, sin el sembrado `T + 1000`.
    - **Queda:** con la tabla ilegible al enganchar y su relectura en vuelo, la relectura vuelve a
      unir los sellos de disco (`R9-234`).

- **`R9-225` (S37, `SyncEngine` / memoria — P3) — 🐛 `recentEchoed` guarda la copia ENTREGADA entera
  por cada reloj anotado, y no se vacía nunca: ni en `stop()` ni al cambiar de cuenta.** MEDIDO (A2;
  sonda `_scratch/S37-A2-sonda-memoria` en el motor y `S37-A2-memoria.cjs.txt` en V8).
  - **Medido:** una clave por doc escrito en el proceso, con hasta 17 copias por doc. Tras `stop()`,
    `start()` de otra cuenta y la vuelta, igual. En V8, ~670-910 B por doc escrito una vez (4-6 veces
    lo de `recentAcked`) y ~9,3 KB por doc escrito 17 veces o más (33 veces más).
  - **Extrapolado, sin medir en Hermes:** el empuje inicial de una biblioteca de 3000 docs deja ~2-2,7
    MB hasta que muere el proceso. Y el texto de las notas y versículos de la cuenta que cerró sesión
    queda en memoria (sin API que lo exponga).
  - **De la 36:** la estructura nace en `2bfbcf8`.
  - **Arreglo (hipótesis, sin medir):** la identidad que `isOwnCopy` necesita no exige guardar la
    copia: alcanza una marca de la entrega. Y vaciarla en `stop()`.
  - **✅ CERRADO por construcción en la sesión 38** (`24a61bc`): `recentEchoed` se quitó. Lo que
    queda es `ownArrived`, un `WeakSet` con los objetos de cada entrega (no retiene nada: se va con
    el lote), y `recentAcked`, que guarda números. No hace falta vaciarlo en `stop()`: un lote que
    espera en la cadena a través de un `stop()` es de la cuenta que lo recibió (`R9-153`). Sin medir
    en V8 ni en Hermes (no hay qué medir: la estructura no existe).

- **`R9-226` (S37, `SyncEngine` / conflictos — P3) — 🐛 la misma cuenta en una sesión nueva del mismo
  proceso: una edición escrita antes de enganchar no lleva el sello, y con la tabla ilegible en la
  sesión anterior da «d mio 3 contra d mio 2».** MEDIDO en el mock (A6 y A3; sondas
  `_scratch/S37-A6-sonda-cola.body.txt` y `S37-A3-antes2.body.txt`).
  - La app hace `stop()` + `start()` de la misma cuenta en el mismo proceso (el tick transitorio de
    auth en el arranque en frío, `SyncEngineContext.tsx:85-127`, y un `deleteAccount` que falla,
    `AuthContext.tsx:639-659`).
  - **Medido (A6):** la sesión 1 con la tabla ilegible; d2 sube; d3 se escribe en la sesión 2 antes
    del enganche. Su entrada no pasa la guarda de `R9-217` (`unsettled` y `conflicts` vacíos tras el
    `stop()`), y el enganche reemplaza `ownStamps` por la tabla de disco, que no tiene d2: «d mio 3
    contra d mio 2» en la sesión 2 y tras reiniciar.
  - **¿De la 36? No: ya existía.** Con `R217` revertida, lo mismo. Con `R217guard` revertida,
    desaparece: la guarda que la 36 puso para Ana y Beto deja este caso fuera. Una guarda por uid
    cubriría los dos, pero hoy `ownStamps` no guarda de quién es (decisión de la 38).
  - **Y la cobertura (A3):** ninguna prueba fija `S32-load` ni `S32-table` sin `R9-217` en el
    escenario «entrada escrita antes de enganchar, sin el sello». La sonda `S37-A3-antes2` pasa con
    todo puesto y cae con `L32load` y con `L32table`, aun con `R9-217` puesta
    (`S37-A3-antes2-*.out.txt`): es la prueba que falta.
  - **✅ ARREGLADO en la sesión 38** (`82f3f20`). **La decisión (medida): la guarda por cuenta.**
    `ownStampsUid` guarda de qué cuenta es el mapa de cada colección (lo fija la carga del enganche;
    `stop()` no lo toca), y la entrada nueva toma el último sello del doc si la cuenta coincide. La
    misma cuenta en una sesión nueva entra; Ana y Beto siguen separados. Con la sonda de A6
    (`_scratch/S38-A6cola-R226.out.txt`), `misma a` y `misma b` dejan de mostrar «d mio 3 contra d
    mio 2» (la entrada lleva `[200000]`).
    - **Pruebas:** 2 nuevas. La de la misma cuenta cae con `R226uid` (la guarda vieja), con `L32load`
      y con `L32table`. La de A3 (la que faltaba para `S32-load`/`S32-table`) se reescribió para un
      proceso nuevo, porque en el mismo proceso la entrada ya lleva el sello: cae con `L32load` y con
      `L32table`, por `conflictos` y `vistos`. La de Beto (de `R9-217`) cae con `R226sin` (sin
      guarda). Salidas: `S38-rev226c-*.out.txt`.
    - El `descarte` de A6 sigue igual: es `R9-227`.
  - **Leído en la sesión 39 (quién más escribe en `ownStamps` antes del enganche): nadie.**
    `noteOwnAcked` escribe en el mapa solo si el doc es conflicto, y `stop()` vacía `conflicts` y
    `unsettled`. `noteArrived` necesita una entrega, y `rereadOwn` sale si la sesión cambió.
    `ownStampsUid` puede quedar viejo con otra cuenta entre medias (Ana, Beto, Ana): entonces la
    edición de Ana antes del enganche no lleva sellos, como antes de este arreglo, pero nunca los de
    otra cuenta. El daño pide además la tabla ilegible. Sin medir.

- **`R9-227` (S37, `SyncEngine` / conflictos — P3) — 🐛 una edición posterior DESCARTADA (8
  rechazos) con la tabla ilegible toda la sesión da «d mio 3 contra d mio 2» al reiniciar.** MEDIDO
  en el mock (A6; sonda `_scratch/S37-A6-sonda-cola.body.txt`, punto 2).
  - La entrada de d3 llevaba el sello de d2 (`own [200000]`) y era el único disco del reloj: se fue
    con el descarte. El control (tabla legible) no muestra nada.
  - **¿De la 36? No: ya existía.** Con `R217` y con `R217guard` revertidas, lo mismo. El texto de
    `R9-217` («el coste existe solo si queda una edición posterior del doc en cola al reiniciar») se
    queda corto: también con una edición posterior descartada. Es el coste aceptado de `R9-208` por
    otro camino.
  - **Decidido en la sesión 38: coste aceptado, sin código.** Re-medido tras los arreglos
    (`_scratch/S38-A6cola-R226.out.txt`, `descarte a`): «d mio 3 contra d mio 2» en el proceso nuevo,
    igual. La entrada descartada era el único disco del sello, y no hay otro lugar donde escribirlo
    sin pisar la tabla ilegible (`R9-208`). El texto de `R9-217` se corrigió (arriba).

- **`R9-228` (S37, pruebas / AsyncStorage — P3) — 🐛 la prueba de `R9-215` solo cae con un orden que
  AsyncStorage nativo no produce.** MEDIDO en el mock (A3 y A7; sondas `_scratch/S37-A3-fifo.body.txt`
  y `S37-A3-dosrel.body.txt`).
  - AsyncStorage 2.2.0 es SERIAL: Android envuelve el ejecutor en `SerialExecutor`
    (`AsyncStorageModule.java:64`), e iOS usa una cola serial (`RNCAsyncStorage.mm:218`). Una
    relectura de la sesión vieja vuelve antes que cualquier lectura de la nueva, así que dos
    relecturas de sesiones distintas nunca están en vuelo a la vez en el teléfono.
  - **Medido:** con `fifo()` (las operaciones del mock encadenadas, como en el teléfono), la prueba de
    `R9-215` pasa con `R215` revertida. Tal cual, cae. El control del arnés: la de `R9-218` con el
    mismo `fifo()` sí cae con `R218` revertida (es un orden que el SDK produce).
  - **Y la guarda del `delete` que la 36 quitó por equivalente (regla 37) no lo era en el mock:** sin
    ella, una tercera relectura que falla y vuelve antes saca la cola sin la tabla (sello `[1000]`); con
    ella, no (`S37-A3-dosrel-*.out.txt`). `G215del` da 0/232. En el teléfono no puede pasar.
  - **De la 36:** la prueba y la guarda quitada. Corolario 39 (un mock con una sola propiedad da
    órdenes imposibles), en AsyncStorage: hasta hoy solo se pensaba en el ejecutor de Firestore.
  - **✅ CERRADO en la sesión 38** (`742c874`, textos). Decisión: la guarda de `R9-215` se queda
    (no cuesta nada, y el mock la necesita), y la del `delete` no vuelve (0 caídas; en el teléfono es
    equivalente: regla 37). La prueba de `R9-215` y el comentario de `ownRereading` dicen que el orden
    es solo del mock.

- **`R9-229` (S37, pruebas / `R9-218` — P3) — 🐛 dos huecos de cobertura de `R9-218`: nada fija que
  `stop()` vacíe `ownGaveUp`, y ninguna prueba tiene dos tablas que fallen siempre.** MEDIDO en el
  mock (A3 y A7).
  - **`stop()`:** con la pieza `G218stop` (el `stop()` no vacía `ownGaveUp`) caen 0 de 232. La sonda
    `S37-A3-gaveup2` (Ana deja `test` en `ownGaveUp`; Beto engancha, y su primera escritura es el ack
    de una entrada de antes) cae con `G218stop` y con `R218clear` (sello `[1000]`), y pasa con todo
    puesto. Con el código de hoy no pasa: es la prueba que falta.
  - **Dos tablas que fallan siempre:** con la 36, sin bucle (A7-1: 4 tablas, 8 combinaciones, delta 0
    en silencio; y la 36 bajó las escrituras N veces respecto de `R218`). Pero la pieza `altDiferir`
    de la matriz, sobre el árbol de hoy, es un bucle caliente (jest muere por OOM): la ausencia de
    bucle depende del `return` de la rama `waiting`, y ninguna prueba lo fija. Forma de `R9-142`.
  - **De la 36:** las pruebas de `R9-218`.
  - **✅ La mitad del `stop()`, cerrada en la sesión 38** (`8991142`): la prueba de
    `S37-A3-gaveup2`. Cae con `G218stop` (1) y con `R218clear` (2), por el sello de W
    (`_scratch/S38-rev229-*.out.txt`). **Sigue abierta la otra mitad:** ninguna prueba fija el
    `return` de la rama `waiting` (dos tablas que fallan siempre). Su revert (`altDiferir`) es un
    bucle caliente que mata jest por memoria, y una prueba tendría que medirlo sin colgar el runner.
  - **La sesión 39 midió cómo escribir esa prueba** (`_scratch/S39-sondas4.body.txt`, `S39-7`): dos
    tablas que fallan siempre, cada una con una escritura tomada con su doc en conflicto. A partir de
    la lectura 60, la lectura de las tablas no vuelve nunca, así que un bucle se detiene en vez de
    matar jest. Con todo puesto hay 5 lecturas; con `altDiferir`, 60, y jest termina
    (`S39-bucle-*.out.txt`). Falta convertirla en prueba.
  - **✅ La otra mitad, cerrada en la sesión 40** (`e9d6e89`): la prueba de `S39-7` (dos tablas
    que fallan siempre; la relectura 60 no vuelve nunca). Con todo puesto, 5 lecturas y la cola sale
    sin las tablas; con `altDiferir`, 60, y jest termina (`_scratch/S40-rev229-altDiferir.out.txt`).
    **`R9-229` queda cerrado.**
  - **Nota de la sesión 41, sobre `lecturas: 5`:** en la matriz de la 40 solo `S34-208diferir` da el
    bucle (60 lecturas). Las otras 6 piezas que tumban la prueba dan 0 (`S32-uidKey`: la tabla se lee
    con otra clave), 2 o 4: la relectura se corta antes, otros defectos que tienen sus pruebas. El
    número exacto es el de hoy (sesión 17) y no es frágil (todo corre en microtareas o
    `setImmediate`), pero el comentario de la prueba debería decir que solo 60 es el bucle.
  - **✅ El comentario, en la sesión 42** (`1a77b78`): dice que solo 60 lecturas son el bucle, y que
    0, 2 o 4 son otros defectos con sus pruebas.

- **`R9-230` (S37, `SyncEngine` / comentario — P3) — 🐛 `R9-219` cerró solo uno de los dos textos que
  nombraba: la regla de `R9-190` sigue sin la excepción.** MEDIDO (A4).
  - `SyncEngine.ts:1544`: «R9-190 — only a copy of the OTHER device carries the mark.» En `657e993`,
    la sesión con la tabla ilegible mueve la marca de doc-c a L2, que es mía (`marcaAntes
{doc-c:120000}`, `S37-A4-sonda-dup-fantasma-fix.out.txt`).
  - Y el número de `R9-219`: `+heldAt` tumba 5, no 4 (corregido arriba).
  - **De la 36:** el texto de `0970726`.
  - **✅ CERRADO en la sesión 38** (`495a1e1`): la regla de `R9-190` dice la excepción de `R9-219`
    (el texto que propuso A4).

- **`R9-231` (S37, pruebas / `R9-218` — P3) — 🐛 corolario 48: la prueba de `R9-218` solo mira
  doc-b, y el sello de Wa no llega a ningún disco, con el arreglo y sin él.** MEDIDO (A4; sonda
  `_scratch/S37-A4-sonda-218.body.txt`).
  - La cola sale sin la entrada de Wa en cuanto su relectura falla, y la tabla de `test` queda
    `{doc-a:[1000]}`. Es el coste aceptado de `R9-208` (la tabla que vuelve a fallar), y la prueba
    (`SyncEngine.test.ts:8840`, aserción en `selloB`) no lo dice.
  - **De la 36:** la prueba.
  - **✅ CERRADO en la sesión 38** (`117e5a4`): el comentario de la prueba dice que solo mira doc-b,
    y que el sello de Wa no llega a disco con el arreglo ni sin él (el coste aceptado de `R9-208`).

- **`R9-232` (S37, pruebas / `R9-216` — P3) — 🐛 la prueba de memoria de `R9-216` dice «el de la
  última» y cae por su CONTROL con dos de sus tres piezas.** MEDIDO (A4; sondas
  `_scratch/S37-A4-sonda-{mem,memclave}.body.txt`).
  - El eco de más es w4, el que el ack de w20 sacó de `recentAcked` (con 40 escrituras, igual: el tope
    se sostiene). El nombre (`SyncEngine.test.ts:9119`), `BUGS.md` (`R9-216`), el detalle de la 36 y
    `noteEcho` (`SyncEngine.ts:2506`, «The echoes of clocks no longer kept go») lo dicen mal; el
    comentario de dentro de la prueba lo dice bien.
  - Con `R216note` y `R216cola` cae por `acked: undefined`: busca la clave en `recentEchoed`, y sin
    ecos no la hay. Buscándola en `recentAcked`, cae solo por `ecos` (0 contra 17), con `acked` en
    verde.
  - **De la 36:** la prueba.
  - **✅ CERRADO sin cambio en la sesión 38:** la prueba de la memoria se quitó con `recentEchoed`
    (`24a61bc`), y `noteEcho` con ella.

- **`R9-233` (S37, `SyncEngine` / comentario — P3) — 🐛 `PendingWrite.own` dice «lo que la entrada
  reemplazó», y desde `R9-194`/`R9-217` lleva relojes que el servidor ya tomó.** MEDIDO (A4: `own` de
  d3 `[200000]`, el reloj de d2, que nadie reemplazó).
  - `types.ts:137-138`, `isOwnCopy` («one that entry replaced») y `noteEcho` («one it replaced»). Y
    «the very same millisecond» de `isOwnCopy` ya no vale para un reloj de `recentAcked` cuyo eco
    llegó: solo esa copia es mía.
  - **¿De la 36?** En parte anterior (`R9-194`); la 36 lo amplió (`R9-217`, `R9-216`).
  - **✅ CERRADO en la sesión 38** (`0b84a7e`): `PendingWrite.own` (`types.ts`) dice que lleva los
    relojes que reemplazó y el último que el servidor tomó, hasta que llega una copia ajena; y
    `isOwnCopy` dice «one that entry carries», el veredicto de la llegada y hasta cuándo vale la
    frase del mismo milisegundo.

- **`R9-234` (S38, `SyncEngine` / conflictos — P3) — 🐛 con la tabla de sellos ilegible al enganchar,
  la relectura que vuelve después de una copia ajena vuelve a unir en memoria los sellos que esa copia
  retiró.** LEÍDO, sin medir.
  - `rereadOwn` une la tabla de disco con el mapa en memoria (`joined`, para los docs que siguen en
    conflicto). Si la copia del otro llegó con la relectura en vuelo, `noteArrived` ya borró los
    sellos del doc (`R9-224`), y la relectura los trae de vuelta desde el disco.
  - Hace falta la tabla ilegible al enganchar, su relectura en vuelo justo cuando llega la copia
    ajena, y después un respaldo con uno de esos sellos viejos. Muy estrecho.
  - **De la 38** (la retirada de `R9-224`). **Hipótesis, sin medir:** que la relectura no una los
    docs retirados desde que empezó (un conjunto por colección mientras la tabla no se leyó).
  - **Medido en la sesión 41** (`_scratch/S41-sondas6.body.txt`, `S41-6`; `S41-union2.out.txt`): el
    proceso anterior dejó el conflicto retenido, el sello de W3 en la tabla y L4 en la cola. Este
    arranca sin red y no puede leer la tabla; el enganche trae R2 (ajena: retira el `own` de L4 y
    registra «lo mio 4» contra «r2 suyo»), y la relectura queda en vuelo. Vuelve la red, L4 sube
    (sello [L4]) y la relectura une el de disco: [W3, L4]. El respaldo del otro con W3 deja «su
    versión» en «r2 suyo», con la nube en «w3 mio»; el control pasa a «w3 mio». Es también **lo que
    queda de `R9-239`**: la unión trae el sello viejo aunque lo haya reemplazado el ack de L4.
    - **¿De la 40? No:** el motor de `0b84a7e` da lo mismo (`S41-union2-motor39.out.txt`). Sin la
      tabla ilegible no se construye: el enganche asienta el conflicto con W3, o lo retira con una
      copia ajena, y no queda nada que unir (`S41-5`, `S41-union.out.txt`). Las tablas con varios
      sellos solo existen en compilaciones de desarrollo: ninguna versión publicada escribió la tabla
      (vc74, `dc19f4a`, es anterior a `R9-193`, `22d33e2`).
    - **`H239join`** (la relectura no toca un doc que ya tiene sello en memoria, y del disco toma solo
      el último) cierra `S41-6` (`S41-union2-H239join.out.txt`). Sola, en la suite, tumba una: la de
      `R9-218`, que espera en la tabla el sello sembrado junto al nuevo (`S41-rev-H239join.out.txt`).
      La 42 decide si esa expectativa es la de antes de `R9-239`.
  - **✅ Cerrado en la sesión 42** (`859480f`), con un diseño más ancho que `H239join`: la relectura
    no toma del disco un doc con sellos en memoria (un ack de esta sesión), ni uno que retiró una
    copia cuyo reloj la tabla no tiene (`ownRetired`: `retireOwn` anota el reloj de la copia
    mientras la tabla no se leyó).
    - **`H239join` no alcanzaba** (`_scratch/S42-sondas1.body.txt`, `S42-1`; `S42-1-*.out.txt`): si
      la relectura la dispara la subida de OTRO conflicto y doc-c no sube nada, el sello de W3
      volvía solo aunque R2 lo había retirado, y el respaldo con W3 dejaba «su versión» en R2. Con
      `H239join`, igual que sin nada.
    - **La primera forma** («todo doc que esta sesión ya decidió»: un ack, una retirada o el fin del
      conflicto) **tumbó 4 pruebas de `R9-208`:** con la tabla ilegible, el enganche entrega una
      copia MÍA que `isOwnCopy` no reconoce, y retira (el coste de `R9-230`). Hecho permanente,
      borraba de la tabla el sello de un conflicto retenido, y tras reiniciar aparecía «lo mío contra
      lo mío». Por eso la retirada guarda el reloj de la copia, y la relectura conserva los sellos
      del doc si la tabla tiene el reloj de cada copia que los retiró (sin esa excepción, pieza
      `R234own`, caen esas 4).
    - **Decidido** (con el criterio delegado para el diseño de sync): la prueba de `R9-218` esperaba
      en la tabla el sello sembrado (`1000`) unido al de Wb. Esa es la semántica de antes de
      `R9-239` (todos los sellos); desde entonces vale solo el del último ack, y además la copia del
      otro que llega al enganchar ya retiró el sembrado. Ahora espera `[200000]`, y sigue cayendo con
      `R218` (la tabla queda en `[1000]`) y no con `R218clear`, como en la matriz de la 40
      (`_scratch/S42-rev234-R218*.out.txt`).
    - **Las tablas viejas con varios sellos (`H239load`): no.** Solo las escribieron compilaciones de
      desarrollo, y la relectura toma los sellos del disco como la carga.
    - **La prueba** (dos variantes contra su control +1 ms: «L4 sube», de `S41-6`, y «otro
      conflicto», de `S42-1`) cae con `R234` (las dos) y con `R234ret` (la de otro conflicto).
      **`R234mem` (la guarda de memoria sola) no tumba nada:** en los órdenes medidos la cubre la del
      reloj retirado (la copia ajena del enganche ya retiró), y con mi propia copia al enganchar el
      conflicto retenido se asienta y la relectura no lo toca (`S42-2`, `S42-2-*.out.txt`). Se queda
      sin prueba propia: dice `R9-239` directamente, y sin ella habría que unir (el daño de `S41-6`) o
      pisar la memoria con el disco. Juntas caen (corolario 50). **Para la 43:** buscar un orden en
      que decida sola.
  - **Nota de la sesión 43:**
    - **`R234mem` decide sola** en el orden de `R9-230` (mi propia copia retirada al enganchar, y L4
      confirmada antes de la relectura): tras reiniciar, el conflicto desaparece en silencio
      (`S43-5`). Es la prueba que le faltaba: `R9-246`.
    - **El respaldo que el otro restaura con mi reloj después de una copia suya con la app cerrada**
      (la forma de `R9-237`): la tabla solo puede devolver el reloj del último ack (`R9-239`), y un
      respaldo con ese reloj trae mis datos. Es el límite por diseño de `R9-239`; sin daño nuevo.
    - **La retirada de la lectura anota la copia leída** (la del otro), y bien. **La de la llegada**
      (`R9-243`) anota la copia que trae el `removed`, a menudo mía: `R9-250`, sin daño construible.

- **`R9-235` (S38, `SyncEngine` / cola — P3) — 🐛 una edición de la misma cuenta hecha entre `stop()` y
  `start()` no entra en la cola: local y nube quedan distintos, en silencio.** MEDIDO en el mock
  (`_scratch/S37-A1-reenganche.body.txt`, caso `sinSesion`; `S38-H2-sondas.out.txt`).
  - `queueWrite` vuelve sin hacer nada si no hay `uid` (`if (!this.uid) return;`). La app hace
    `stop()` + `start()` de la misma cuenta en el mismo proceso (el tick de auth del arranque en frío,
    un `deleteAccount` que falla).
  - **Medido:** Wa sube; `stop()`; el usuario edita a 5 s de Wa; `start()` de la misma cuenta: sin
    conflicto, cola vacía, local «editada sin sesion» y nube «wa mio».
  - **¿De la 38? No:** antes de la 36, igual. La 36 lo mostraba como un conflicto, con «wa mio» (una
    escritura de este teléfono) como «su versión» (`R9-220`), y la 38 vuelve a lo de antes.
  - Sin medir: si la interfaz puede escribir en esa ventana.
  - **Leído en la sesión 39:** el `stop()` + `start()` del arranque en frío es el efecto de
    `SyncEngineContext.tsx:91-127`. `user` pasa un render por `null` o anónimo y vuelve; la ventana
    dura lo que Firebase Auth tarda en rehidratar, mientras se monta la primera pantalla. Una edición
    del usuario ahí es improbable; una escritura automática del arranque, si la hay, caería en ella.
    Sin medir en el teléfono.

- **`R9-236` (S38, `SyncEngine` / guardas — P3) — 🐛 cuatro guardas viejas que la 38 dejó sin
  ninguna prueba que las vea.** MEDIDO (la matriz entera, `_scratch/S38-matriz-s38-0b84a7e.out.txt`;
  la comparación con la de la 37, `S38-comparar-s37.out.txt`).
  - `S32-Fsettle` y `S32-Fresolve` (`R9-193`: los sellos se sueltan cuando el conflicto se disuelve
    o se resuelve) bajan de 1 a 0: en sus pruebas, la copia del otro que llega ya retira los sellos
    (`R9-224`).
  - `S34-207fold` (el ack pliega el `own` en `recentAcked`) baja de 1 a 0, y `S34-207acum` (el ack
    conserva los relojes anteriores), de 2 a 0: el veredicto de la llegada (`ownArrived`) ya cubre
    los ecos que se procesan tarde (`R9-207`).
  - **De la 38** (corolario 46: una guarda del primer arreglo, subsumida por el segundo). **Para la
    39:** por cada una, o falta la prueba (un orden en el que todavía decide) o es equivalente por
    construcción y se quita (regla 37), con la matriz entera otra vez.
  - **Medido en la sesión 39** (`_scratch/S39-guardas-*.out.txt`; sondas en
    `S39-sondas.body.txt` y `S39-sondas3.body.txt`, piezas en `S39-piezas.cjs.txt`):
    - **`Fsettle`: falta la prueba.** Decide cuando el doc se asienta con una copia MÍA, sin ninguna
      copia ajena. En `S39-5`, la misma cuenta vuelve a enganchar, el enganche entrega W3 (igual a lo
      local) y el conflicto retenido se asienta por LWW. Con la guarda, los sellos se van, y el
      respaldo del otro con W2 da «w3 mio | w2». Sin ella quedan `[100000, 110000]`, y el respaldo
      pasa en silencio (local `w3 mio`, nube `w2`). `S39-5` es la prueba que falta.
    - **`Fresolve`: no decide en `S39-6`** (keepMine): el eco de la subida asienta el doc, y
      `Fsettle` olvida los sellos igual. Por lectura, toda resolución de un doc con sellos sube algo:
      keepMine y merge siempre, y keepTheirs porque el doc tiene escrituras tomadas durante el
      conflicto (`R9-161`, `R9-199`). Su eco asienta el doc. Es candidata a la regla 37, con la
      matriz entera después (corolario 46).
    - **`S34-207fold` y `S34-207acum` no son guardas equivalentes: juntas son la causa de
      `R9-237`.** Cada una sola no cambia `S39-2`: la entrada de W1 lleva el reloj de W0 en `own`
      (`R9-194`), `fold` lo pliega y, sin `fold`, `acum` lo conserva. Quitadas juntas, `S39-2` da el
      conflicto y la suite de sync pasa 242/242 (`S39-rev-acumfold.out.txt`).
  - **✅ Cerrado en la sesión 40** (`f83a7f8`), con dos pruebas y sin quitar ninguna guarda:
    - **`Fsettle`:** `S39-5` usaba un respaldo de W2, que desde `R9-239` ya no es un sello: la sonda
      había esquivado el caso (corolario 49). La prueba: el conflicto retenido se asienta con W3 (el
      enganche la entrega), después subo L4, y el otro restaura W3 dentro de los 30 s. Cae con
      `Fsettle` por `conflictos` (`_scratch/S40-rev236-Fsettle.out.txt`).
    - **`Fresolve` NO es equivalente, contra lo que se leyó en la 39** («el eco de la resolución
      asienta el doc»): `settle` corre al PROCESAR ese eco, y con la cadena de lotes ocupada
      (`R9-175`) el ack de la resolución llega antes. Medido (`_scratch/S40-sondas6.body.txt`,
      `S40-fresolve2-*.out.txt`): keepTheirs sube R encima de W3, y el otro restaura W3 en esa
      ventana. Sin la guarda no hay conflicto (local «lo suyo», nube W3); el control, con el reloj
      del otro, da el conflicto en los dos. Se queda, con esa prueba, que cae con `Fresolve` por
      `conflictos` (`S40-rev236b-Fresolve.out.txt`). El comentario del motor dice ahora el porqué.
    - `207fold` y `207acum` se fueron con `R9-237`.
  - **Nota de la sesión 41:** la prueba de `Fresolve` mide la cadena ocupada. Sin docX, con
    `Fresolve` revertida, el respaldo da el conflicto igual (`S41-4`, `S41-fresolve.out.txt`): el
    control `docX: null` es la condición del caso. Que caiga también con `R237` y `R237fold` es
    cobertura de `R9-237` en la resolución (su ack plegaba el `own` [W3]), no un caso de la cola:
    mientras la entrada de la resolución espera, la nube tiene W3, y un respaldo con W3 trae los
    mismos datos (el SDK no levanta nada; el mock sí, ver `R9-244`). Con R2 entre medias, `R9-223`
    retira ese `own`. Las otras sueltas de sellos y relojes son `settle` (al procesar: `Fsettle`),
    `retireOwn` (al llegar, o al procesar la lectura: `R9-243`) y la resolución (en el momento).

- **`R9-237` (S39, `SyncEngine` / conflictos — P3) — 🐛 de la 38: el respaldo que el otro restaura con
  una escritura MÍA más vieja del mismo proceso (W0, después de subir W1) pasa por «mía», porque
  ninguna copia ajena llegó antes. Dentro de los 30 s no hay conflicto, y local (W1) y nube (W0) quedan
  distintos en silencio.** MEDIDO en el mock (`_scratch/S39-sondas.body.txt`, `S39-2`).
  - `noteArrived` decide con `isOwnCopy`, y `recentAcked` tiene los relojes de todos los acks del doc
    en el proceso. El de W0 entra por el ack de W0 (`S34-207acum`) y otra vez por el `own` de la
    entrada de W1 (`R9-194`, plegado por `S34-207fold`). La premisa de `24a61bc` («sin una copia ajena
    entre medias, toda entrega de la copia de la nube es mía») no cubre este caso: la copia ajena es
    el respaldo mismo, y trae mi reloj.
  - **Medido** (`S39-sondas-hoy.out.txt`): W0 (T+10 s) y W1 (T+20 s) suben sin conflicto
    (`recentAcked` `[10000, 20000]`), y el otro restaura W0. Resultado: `conflictos []`, local
    `w1 mio`, nube `w0 mio`. El control (el mismo valor con el reloj del otro, +1 ms) da
    `[["w1 mio","w0 mio"]]`.
  - **¿De la 38? Sí.** Con el motor de la 36 (`29c63c3`, `S39-sondas-motor36.out.txt`), el respaldo
    da `[["w1 mio","w0 mio"]]`: para `recentEchoed` solo era mío el objeto del eco de W0. Fuera de la
    ventana, y sin conflicto, los dos motores dan lo mismo: LWW ignora una copia más vieja.
  - **Hipótesis, medida en parte:** que `recentAcked` guarde solo los relojes del último ack del doc
    (quitar `207acum` y `207fold` juntas). Con las dos piezas, `S39-2` da el conflicto
    (`S39-viejo-acumfold.out.txt`), y la suite de sync pasa 242/242 (`S39-rev-acumfold.out.txt`). El
    porqué: las re-entregas en otro objeto que necesita `R9-220` (la reversión de un rechazo, el
    re-enganche) traen la copia de la nube, que es la del último ack. Los ecos que se procesan tarde
    los cubre `ownArrived`. Y un reloj más viejo, después de un ack posterior, solo vuelve con un
    respaldo. Falta la matriz entera (corolario 46) y la prueba.
  - **✅ Cerrado en la sesión 40** (`d57807b`): `recentAcked` guarda solo el reloj del último ack
    (sin `207acum` ni `207fold`). Antes de quitarlas, la pregunta del `own` que `queueWrite` le pone
    a la entrada nueva (`R9-194`): hace falta mientras la entrada espera (un reinicio), y no después
    de su ack, porque lo que llega entonces es la escritura de la entrada. La prueba es `S39-2`, y
    cae con las dos piezas de vuelta (`R237`) y con cada una sola (`R237acum`, `R237fold`), por
    `conflictos` (`_scratch/S40-rev237-*.out.txt`).
    - **Lo que deja:** con un solo reloj, el eco de W1 que se procesa después del ack de W2 depende
      solo del veredicto de la llegada (`ownArrived`); antes lo cubría también la lista. En el
      teléfono ese veredicto vale (leído: ver `R9-241`), y el orden de LLEGADA entre ese eco y un ack
      posterior es la pregunta de `R9-240`.

- **`R9-238` (S39, `SyncEngine` / conflictos — P3) — 🐛 la retirada de relojes de la 38 (`R9-220`,
  `R9-223`, `R9-224`) solo ocurre en el callback de `onSnapshot`. Una copia ajena que el motor ve
  solo por la LECTURA de un `removed` no retira nada, y un respaldo posterior con W2 sigue siendo
  «mío».** MEDIDO en el mock (`_scratch/S39-sondas2.body.txt`, `S39-4`).
  - La escritura del otro con su reloj atrasado (bajo el piso) saca el doc de la query. El `removed`
    trae la última versión que casaba (W3, que `noteArrived` juzga mía), y la copia del otro llega por
    `lookup`, que no pasa por `noteArrived`.
  - **Medido** (`S39-lectura-hoy.out.txt`): la rama pendiente de la sonda de `R9-224`, con R2 bajo el
    piso. Después de R2 los sellos siguen en `[100000, 110000]`; el respaldo de W2 no pasa a «su
    versión» (sigue `r2 suyo`), y keepTheirs deja local `r2 suyo` y nube `w2`. En el control, R2
    llega por el listener, los sellos se retiran, y local y nube terminan en `w2`.
  - **¿De la 38? No: ya existía.** Con el motor de la 36 (`S39-lectura-motor36.out.txt`), los dos
    modos dan el daño, que es el de `R9-224`. La 38 cerró la ruta del listener y no esta.
  - **Leído, lo mismo por los otros caminos:** el `removed` sintético de `R9-186` no trae copia
    (`noteArrived` vuelve sin hacer nada), y su lectura es una lectura más. Y el `removed` del eco de
    una escritura mía que saca el doc de la query trae la copia ANTERIOR (puede ser la del otro, ya
    juzgada), que `noteArrived` vuelve a juzgar como si recién llegara.
  - **Hipótesis, sin medir:** que la lectura de un `removed` retire lo mismo que `noteArrived` cuando
    la copia leída no es mía. La lectura ve la vista del SDK con mis escrituras encima (`R9-179`), así
    que una copia ajena leída es posterior a todo lo que el servidor tomó.
  - **✅ Cerrado en la sesión 40** (`bfd0a57`): la retirada pasa a `retireOwn`, que llaman
    `noteArrived` y la lectura de un `removed`, esta solo cuando la copia leída no es mía (sin esa
    guarda, pieza `R238siempre`, caen las pruebas de `R9-190` y `R9-196`).
    - **`S39-4` ya no mostraba el daño después de `R9-239`** (corolario 49): con un solo sello, el
      respaldo de W2 ya no es «mío» por ninguna razón, aunque los sellos seguían sin retirarse
      (`_scratch/S40-lectura-R239.out.txt`, `sellosAntes [110000]`). La prueba usa el caso que seguía
      abierto: W3 sellado y L4 en la cola; R2 bajo el piso (llega como `removed`, y la lectura lo
      encuentra); el respaldo de W3; ramas pendiente y proceso nuevo. Cae con `R238` por `suya` y por
      los dos relojes en disco (`S40-rev238-*.out.txt`).
    - **Leído:** el `removed` sintético de `R9-186` pasa por la misma lectura, y retira igual.
  - **Nota de la sesión 41:** con la cadena de lotes ocupada, el respaldo llega antes que la lectura:
    `R9-243`. Y leído: una copia MÍA que la lectura encuentra y `isOwnCopy` no reconoce (la tabla
    ilegible, `R9-208`) retira mis relojes, también el `own` de la entrada en cola, que con la tabla
    ilegible toda la sesión es la única copia en disco de ese reloj (`R9-217`). Es el coste que ya
    tenía `noteArrived` con esa copia entregada (`R9-230`); la 40 lo extiende a la lectura. Los
    únicos caminos que traen copias del doc son el callback (el enganche incluido) y la lectura de un
    `removed`: los otros `get()` del motor leen `reviewEvents` y `conflicts`.
  - **Nota de la sesión 42:** desde `R9-243`, un `removed` sin nada en vuelo retira al llegar, y la
    retirada de la lectura se queda sin una prueba que la vea sola (`S40-R238`, de 2 a 0): `R9-246`.

- **`R9-239` (S39, `SyncEngine` / conflictos — P3) — 🐛 `R9-224` sigue abierto para el respaldo
  DIRECTO: con el doc en conflicto subo W2 y W3, y el otro restaura W2 sin escribir nada antes. La
  copia pasa por «mía» por `ownStamps`, «su versión» sigue en R, y keepTheirs sube R encima del
  respaldo.** MEDIDO en el mock (`_scratch/S39-sondas.body.txt`, `S39-3`).
  - **Medido** (`S39-sondas-hoy.out.txt`): sellos `[100000, 110000]`. Después del respaldo de W2,
    «su versión» sigue en `lo suyo`, y keepTheirs deja local y nube en `lo suyo`: el respaldo del
    otro se pierde. La prueba de `R9-224` (con R2 entre medias) termina en `w2` en los dos.
  - **¿De la 38? No: ya existía.** El motor de la 36 da lo mismo (`S39-sondas-motor36.out.txt`). La
    38 cerró la variante con R2; aquí, como en `R9-237`, la copia ajena es el respaldo mismo.
  - **Hipótesis, sin medir:** la misma de `R9-237`, para `ownStamps` (solo el último sello del doc).
    Hay que medirla contra `R9-193` y `R9-208` (los sellos tras reiniciar).
  - **✅ Cerrado en la sesión 40** (`04f27e7`): `ownStamps` guarda solo el sello del último ack. La
    hipótesis se midió antes: con la pieza, `S39-3` da el conflicto y la suite pasa 240/243
    (`_scratch/S40-sellos-*.out.txt`, `S40-hip239-*.out.txt`). Las tres que caían, cada una por su
    porqué:
    - la de `R9-160` («el eco de una edición propia durante el conflicto») hacía llegar la copia de
      L1 después del ack de L2, un orden que el SDK solo produce con un respaldo (el eco de L1 sale
      al aplicar su `set`, y el `set` de L2 sale después del ack de L1). Ahora llega con L2 en la
      cola, sin red;
    - las dos de `R9-224` (su control `sellos`): con un solo sello, el respaldo de W2 ya no decidía
      la retirada, y un respaldo de W3 con lo local en W3 es su eco por diseño (mismo reloj que lo
      local). La prueba de `R9-224` pasa a tener L4 en la cola y el respaldo de W3, y cae con
      `R224sellos`, `R224disco` y `R223own`. La vieja, sin R2, es la de `R9-239` (ramas pendiente y
      proceso nuevo), que cae con `R239` (`S40-rev239-*.out.txt`).
    - **Lo que queda, sin arreglar:** `rereadOwn` todavía une el último sello de disco con el de
      memoria (la forma de `R9-234`), y una tabla escrita antes de este cambio puede traer varios
      sellos por doc. Con la tabla ilegible al enganchar, o en la primera sesión tras actualizar, un
      respaldo con un sello anterior pasa por «mío». Las piezas `H239load` + `H239join` lo cerrarían,
      pero la prueba de `R9-218` perdería su discriminador (su sello sembrado está en el mismo doc
      que el nuevo). Va con `R9-234`.
  - **Nota de la sesión 41:** lo que queda (la unión de `rereadOwn`) se midió como `R9-234` (`S41-6`).

- **`R9-240` (S39, `SyncEngine` / premisa de `noteArrived` — P3) — ❓ SIN MEDIR EN NATIVO: la premisa
  de `24a61bc` («una escritura en vuelo está encima de la vista del SDK, así que ninguna copia del
  otro llega antes de su ack») vale para el ack del SDK, pero el motor anota el ack en la
  continuación del `set`. Si RNFirebase entrega a JS la copia del otro antes que la respuesta del
  `set`, la retirada no alcanza ese reloj y vuelve el daño de `R9-216`.** MEDIDO en el mock con el
  ack demorado (`_scratch/S39-piezas.cjs.txt`, pieza `S39ackTarde`; `S39-1`).
  - El mock entrega con `setImmediate`, así que el motor anota el ack primero
    (`S39-sondas-log.out.txt`: el «ack» sale antes que «llega ajena»), y la sonda da lo correcto.
  - **Con el ack dos vueltas más tarde** (`S39-envuelo-acktarde.out.txt`): llega la copia del otro y
    se registra el conflicto; después, el ack de W1 va a `ownStamps` (el doc ya es conflicto), donde
    nada lo retira. El respaldo con W1 pasa por «mío», keepTheirs sube `lo suyo` encima, y el
    respaldo se pierde. El control (R después del ack) termina con `w1` en los dos.
  - **Lo que hay que medir (Modo C, con el OK de Victor):** en el emulador, el orden en JS entre la
    respuesta del `set` y el snapshot con la copia del otro, cuando la escritura del otro se aplica en
    el servidor mientras la mía está en vuelo.
  - **Leído, `{merge: true}`: sin caso.** La vista con mi escritura en vuelo es la copia del servidor
    con mis campos encima, y cada payload lleva su `updatedAt` (todos los campos, con `null` en los
    opcionales: `R9-44`). Esa entrega trae mi reloj, así que pasa por «mía», y lo es.
  - **Nota de la sesión 40:** con `R9-237` y `R9-239`, los relojes guardan solo el último ack. Si
    en RNFirebase el eco de una escritura pudiera LLEGAR a JS después del ack de otra posterior, ya
    no lo cubre la lista: pasaría por ajeno, retiraría y daría «lo mío contra lo mío». En el mock no
    pasa (`setImmediate`). Al medir el orden en el emulador, medir también ese.
  - **Leído en la sesión 41** (el SDK web, que comparte el diseño con el de Android;
    `_scratch/S41-sdk.out.txt`): al confirmar o rechazar una escritura, `sync_engine_impl.ts` levanta
    el callback del usuario ANTES que los eventos («so that they consistently happen before listen
    events»), así que la reversión de un rechazo llega después de su rechazo, como en el mock. Y el
    eco de W1 sale al aplicar su `set`, antes de que el motor emita el de W2. Sigue sin medir el
    puente de RNFirebase.
  - **Nota de la sesión 42:** dos órdenes más para medir en el emulador, junto con el de arriba. Que
    la reversión de un rechazo llegue a JS después del rechazo del `set`: `R9-243` lo supone (como
    `R9-182`); si llegara antes, ese `removed` no retira, como antes de la 42. Y que el ack de una
    subida reemplazada llegue antes que una copia ajena (`R9-242`); si no, el ack vuelve a dejar
    [W1] en el `own`, como en `recentAcked`.

- **`R9-241` (S40, pruebas / contrato de `firestore.ts` — P3) — 🐛 el veredicto de la llegada
  (`ownArrived`, `R9-220`/`R9-222`) depende de que `change.doc.data()` devuelva el MISMO objeto en el
  callback y al procesar el lote, y ninguna prueba lo vigila: el mock sustituye `firestore.ts`
  entero.** LEÍDO, sin daño hoy.
  - En RNFirebase 26.2.0, `DocumentChange.doc` es un getter que construye un `DocumentSnapshot`
    nuevo en cada lectura, y su constructor vuelve a parsear los datos (`parseNativeMap`): dos
    lecturas de `change.doc` dan dos objetos. Hoy no pasa nada porque `wrapQuerySnapshot`
    (`src/lib/sync/firestore.ts`) lee `c.doc` una vez por cambio y envuelve ese snapshot, y el motor
    llama a `docChanges()` una sola vez por entrega.
  - Si el envoltorio cambiara (un getter, o `docChanges()` llamado dos veces), `ownArrived` dejaría
    de casar en el teléfono, y con `R9-237`/`R9-239` el eco procesado tarde daría «lo mío contra lo
    mío», con las pruebas en verde. **Propuesta:** una prueba de `firestore.ts` con un `DocumentChange`
    de getter que fije que `change.doc.data()` es el mismo objeto en dos lecturas.
  - De paso: un mock con `get doc()` dentro de un spread no lo modela, porque Babel evalúa el getter
    al copiar las propiedades.

- **`R9-242` (S41, `SyncEngine` / cola — P3) — 🐛 el `own` de una entrada que reemplazó una subida EN
  VUELO conserva relojes más viejos que el ack de esa subida. Mientras la entrada espera, el respaldo
  que el otro restaura con uno de ellos pasa por «mío» por la cola.** MEDIDO en el mock
  (`_scratch/S41-sondas.body.txt`, `S41-1` y `S41-2`; `S41-hoy.out.txt`).
  - `upsertQueueEntry` pliega en el `own` de la entrada nueva el reloj de la que reemplaza, que trae
    el suyo (`R9-194`, `R9-217`). Si la reemplazada estaba en vuelo, su ack no toca la entrada viva
    (es otro objeto, `R9-11`): W0 sube, W1 sale y queda en vuelo, el usuario edita W2 (la entrada
    lleva `own` [W0, W1]) y, sin red, W1 se confirma. `recentAcked` queda en [W1], y la entrada de W2
    sigue con [W0, W1].
  - **Medido:** el otro restaura W0. No hay conflicto, y al volver la red W2 sube encima: local y nube
    en W2, el respaldo perdido sin que nadie elija. El control (el reloj del otro, +1 ms) da «w2 mio»
    contra «w0 mio». Con el doc en conflicto (`S41-2`: sello [W3], `own` [W2, W3]), el respaldo con W2
    deja «su versión» en «lo suyo», y keepTheirs la sube encima del respaldo; el control pasa a «w2».
  - La premisa que lo deja abierto es la del cierre de `R9-237`: el `own` «hace falta mientras la
    entrada espera, y no después de su ack». La entrada también sobrevive al ack de la subida que
    reemplazó.
  - **¿De la 40? No: ya existía.** El motor de `0b84a7e` da lo mismo (`S41-motor39.out.txt`), con
    `recentAcked` en [W0, W1].
  - **Hipótesis, medida en parte:** en el ack de una subida que otra entrada reemplazó, dejar el `own`
    de esa entrada en el reloj de la subida, que es la copia de la nube (`H41own`, en
    `S41-piezas.cjs.txt`). Con la pieza, las dos sondas dan lo mismo que su control
    (`S41-H41own.out.txt`), y la suite de sync pasa 250/250 (`S41-rev-H41own.out.txt`). Faltan la
    prueba y la matriz entera.
  - **✅ Cerrado en la sesión 42** (`7c8c0fa`), con `H41own`: en el ack de una subida que otra
    entrada reemplazó, el `own` de la entrada viva pasa a ser el reloj de esa subida (en el lugar,
    como `retireOwn`). Las dos preguntas del prompt, leídas antes de escribirlo:
    - **si la subida reemplazada se RECHAZA**, no hay ack y el `own` sigue en [W0, W1]: W0 es la
      copia de la nube (y ya era «mía» por `recentAcked`), y W1 nunca llegó a ella, así que ningún
      respaldo lo trae;
    - **una copia ajena no retira el `own` con la subida en vuelo:** la vista del SDK la lleva encima
      (el mock también: `viewChange`), así que esa copia llega después del ack y retira después de
      `H41own`. Si el puente de RNFirebase reordenara (`R9-240`), el ack dejaría [W1], lo mismo que
      ya pone en `recentAcked`.
    - **La prueba** (dos: sin conflicto, de `S41-1`, y en conflicto, de `S41-2`) compara el respaldo
      con mi reloj viejo con su control (+1 ms, el reloj del otro). Cae con `R242` por `conflictos`,
      «su versión», local y nube, no solo por el `own` (`_scratch/S42-rev242-R242.out.txt`).
    - **Leído, sin medir:** con `!isCurrent()` (un `stop()` con la subida en vuelo) el `own` de la
      entrada aparcada no cambia, igual que `noteOwnAcked`. Si la misma cuenta vuelve a entrar con la
      entrada esperando, un respaldo con W0 pasa por «mío» por la cola. Es la ventana del arranque en
      frío de `R9-235`.
  - **Nota de la sesión 43:** lo leído, medido: `R9-249` (`S43-6`). Lo demás que lee el `own` de una
    entrada después del ack de otra (`isOwnCopy`, `retireOwn`, el pliegue de `upsertQueueEntry`,
    `persistQueue`): una edición nueva pliega [W1] y el reloj de W2, que nunca llegó a la nube; sin
    efecto.

- **`R9-243` (S41, `SyncEngine` / conflictos — P3) — 🐛 `R9-238` sigue abierto con la cadena de lotes
  ocupada: la retirada de la lectura corre al PROCESAR el `removed`, y el respaldo con W3 LLEGA antes.
  Se juzga «mío» al llegar (el sello sigue), y la lectura ya lo encuentra a él.** MEDIDO en el mock
  (`_scratch/S41-sondas7.body.txt`, `S41-7`; `S41-lectura7.out.txt`).
  - Es la prueba de `R9-238` (rama pendiente: W3 sellado, L4 en la cola, R2 bajo el piso) con la
    cadena ocupada por otro doc. R2 llega como `removed` y espera; el respaldo llega y espera. Al
    procesar, la lectura encuentra la nube de ese momento, el respaldo, que `isOwnCopy` da por mío:
    el motor nunca ve R2.
  - **Medido:** «su versión» queda en «lo suyo», una copia que la nube ya no tiene, con la nube en
    «w3 mio» hasta que sube L4. El control da «w3 mio» como «su versión». Es el daño de `R9-238`:
    keepTheirs subiría «lo suyo» en vez del respaldo.
  - **¿De la 40? No: ya existía.** El motor de `0b84a7e` da lo mismo
    (`S41-lectura7-motor39.out.txt`): antes de la 40 la lectura no retiraba nada, con la cadena libre
    o no. La 40 cerró el orden con la cadena libre.
  - Es la lección de `Fresolve` (sesión 40) en la otra retirada: el orden de llegada y el de proceso
    son dos relojes.
  - **Hipótesis, REFUTADA tal cual:** retirar al LLEGAR un `removed` sin una subida propia del doc en
    vuelo (`H41removed`). Cierra `S41-7`, pero tumba la prueba de `R9-190`
    (`S41-rev-H41removed.out.txt`): mi propio respaldo restaurado también llega como `removed`, sin
    nada en vuelo. Falta otra forma de distinguirlos.
  - **✅ Cerrado en la sesión 42** (`fc93ef6`). **Medido antes de diseñar** (pieza `H41removedLog`
    en `_scratch/S42-piezas.cjs.txt`; `S42-243-log.out.txt` y `S42-243-log7.out.txt`). En la prueba
    de `R9-190` llegan dos `removed`: el eco de W0 (mi respaldo bajo el piso), con W0 en vuelo y
    «lo suyo» en la mano, y la **reversión del rechazo de W2**, que llega sin nada en vuelo y trae
    W2, la escritura rechazada (en cola, «mía»). `H41removed` juzgaba mal esa. En `S41-7`, el
    `removed` de R2 trae W3 (mío y ya confirmado), sin nada en vuelo.
    - **El diseño:** el motor anota cada rechazo (`rejectedAwaitingRevert`, como
      `droppedAwaitingRevert`: el rechazo llega al flush antes que la reversión, en el SDK web y en
      el mock), y `noteArrived` retira al LLEGAR un `removed` que llega sin una escritura propia del
      doc en vuelo y no trae el payload rechazado. Con una escritura en vuelo, un `removed` solo
      puede ser su eco (la vista del SDK la lleva encima), y no retira.
    - **Tres pruebas, una por parte:** la de la cadena ocupada (`S41-7`, con su control +1 ms) cae
      con `R243`; la de `R9-190` cae con `R243rev` (la reversión también retira) y con `R243anota`
      (el rechazo no se anota); y una nueva (`S42-3`: con el doc en conflicto, mi respaldo bajo el
      piso se rechaza, y su eco trae W1) cae con `R243vuelo` por «su versión» (pasa a W1, mía)
      (`_scratch/S42-rev243*.out.txt`).
    - **Leído, sin medir:** si el payload rechazado es igual a la copia de la nube, el SDK no
      levanta nada, y la anotación espera a la próxima entrega del doc: un `removed` del otro que
      trajera esa misma copia no retiraría (lo de antes). Si el puente de RNFirebase entregara la
      reversión antes que el rechazo (`R9-240`), la escritura sigue en vuelo y tampoco retira (lo de
      antes).
  - **Nota de la sesión 43** (revisión del diff, `detail/S43-revision-del-diff-s42.md`):
    - Entre el rechazo y su reversión no llega otra entrega del doc (en el mock ni en el SDK web: la
      vista con la escritura encima no cambia). Pero **la reversión misma puede traer un cambio del
      otro**: si R2, bajo el piso, llegó al servidor con mi escritura en vuelo, la reversión vuelve a
      R2 como `removed` con mi payload, y no retira al llegar. Con la cadena ocupada: `R9-247`.
    - **Un rechazo que DESCARTA la escritura:** su reversión ya no es «mía» por la cola, y retira al
      llegar: `R9-248`.
    - Una anotación que no se consume (el payload igual a la nube) deja decidir a la lectura, como en
      `R9-247`. Tras un `stop()`, el listener nuevo entrega el doc como `added` antes que cualquier
      `removed`, y eso la consume.
    - **Otros `removed` sin nada en vuelo que son míos:** los borrados de `cleanupOldReviewEvents`
      (`reviewEvents` tiene listener) y el eco de una escritura que sale después de un `stop()`
      (`pushing` ya es `null`, `R9-177`). Leído: retiran relojes de un doc que ya no existe o que la
      nube ya dejó atrás; sin daño.
    - **¿Un `removed` del otro con mi escritura en vuelo? No, por lectura:** la vista lleva mi
      payload completo encima; una escritura del otro con un campo de una versión más nueva sale
      como `modified`. El puente, sin medir (`R9-240`).

- **`R9-244` (S41, pruebas / `R9-160` — P3) — 🐛 la prueba «el eco de una edición propia durante el
  conflicto» entrega dos copias que el SDK no levanta, y el eco tardío de verdad, en conflicto, no
  tiene prueba propia.** MEDIDO en el mock (`S41-3`; piezas en `_scratch/S41-piezas.cjs.txt`).
  - Sus dos `fire(edit1)` llegan con la nube ya en L1 y nada en vuelo: la misma copia. El SDK no
    levanta un cambio con los mismos datos (`view.ts`, `docsEqual`, leído en el SDK web:
    `_scratch/S41-sdk.out.txt`), y el `__fire` del mock no compara. El eco real de L1 ya lo entrega el
    mock al subir (desde la 28). Lo que la prueba ejercita desde la 40 (L2 en la cola, sin red) es una
    re-entrega de la copia de la nube, que en el SDK trae un enganche nuevo.
  - **Lo que decide hoy es el sello.** Con `Q41sello` cae; con `Q41own` no; juntas, cae igual
    (`S41-eco160-*.out.txt`). Sin el sello, el primer `fire` se toma por ajeno y retira, y la entrada
    de L2 nace sin el reloj de L1: no son dos guardas que se cubren, como dice el detalle de la 40.
  - **El eco tardío de verdad** (llega con L1 en vuelo, espera la cadena y se procesa después del ack
    de L2), en conflicto: desde `R9-239` lo decide solo `ownArrived`. Sin él (`Q41llegada`), L1 pasa a
    ser «su versión» (`S41-llegada.out.txt`). `ownArrived` lo vigilan las pruebas de `R9-207` y
    `R9-222`, sin conflicto; con conflicto no lo prueba nadie.
  - **Propuesta:** que la prueba de `R9-160` use el orden de `S41-3`, y que su comentario diga lo que
    entrega.
  - **✅ Cerrado en la sesión 42** (`ae39cd8`): la prueba usa el orden de `S41-3`. La cadena de
    lotes queda ocupada por docX, L1 y L2 suben, el eco de cada una llega con su escritura en vuelo
    y espera, y los acks pasan. Decidido: los dos `fire(edit1)` se quitan (son copias que el SDK no
    levanta, y el eco real lo entrega el mock al subir). Cae con `Q41llegada` por «su versión»
    (pasa a L1), y ya no con `Q41sello` (`_scratch/S42-rev244-*.out.txt`).

- **`R9-245` (S42, `SyncEngine` / respaldo propio rechazado — P3) — 🐛 cuando el servidor RECHAZA mi
  propio respaldo (escrito bajo el piso), la reversión trae mi copia anterior: con el doc en
  conflicto, tras reiniciar aparece «mi respaldo» contra «w1 mio» (lo mío contra lo mío); sin
  conflicto, lo local pasa a W1 con el respaldo esperando en la cola.** MEDIDO en el mock
  (`_scratch/S42-sondas3.body.txt`, `S42-3`; `S42-3-hoy.out.txt`), SIN DIAGNOSTICAR.
  - El caso: W1 sube (en conflicto o no); el usuario restaura su respaldo W0, con el `updatedAt` del
    archivo (bajo el piso), y el servidor lo rechaza (1 intento, queda en la cola). Llegan el eco de
    W0 (`removed`, con W1) y la reversión (`added`, con W1).
  - **Medido:** con el conflicto, en la sesión «su versión» sigue «lo suyo»; después de un reinicio,
    el conflicto es «mi respaldo» contra «w1 mio», dos versiones de este teléfono. Sin conflicto,
    local y nube quedan en «w1 mio» con la entrada de W0 en la cola. Sin medir qué pasa cuando esa
    entrada se reintenta.
  - **¿De la 42? No: ya existía.** El motor de `e9d6e89` da lo mismo
    (`S42-3-motor40.out.txt`). Lo vio la sonda que midió la excepción «en vuelo» de `R9-243`.
  - Hace falta que el servidor rechace la escritura (reglas, datos inválidos), que es raro, y con un
    respaldo restaurado.
  - **Diagnosticado en la sesión 43** (`_scratch/S43-sondas7.body.txt`, `S43-7`;
    `S43-7-hoy.out.txt`). Una premisa, dos efectos: «una copia local con una escritura mía en la
    cola es más nueva que cualquier copia de la nube», y un respaldo restaurado lleva el `updatedAt`
    del archivo, más viejo.
    - **Con el conflicto retenido,** tras reiniciar, la rama del conflicto retenido de
      `applyRemoteChange` (`SyncEngine.ts:1973`) toma una copia más nueva que lo local sin preguntar
      `isOwnCopy` («más nueva: el otro siguió escribiendo», `R9-160`). W1 es mía (su sello está en la
      tabla) y aparece «mi respaldo» contra «w1 mio».
    - **Sin conflicto,** LWW aplica W1 encima del respaldo restaurado, con su entrada esperando.
    - **El reintento, medido:** sin conflicto, W0 llega a la nube y quedan local «w1 mio» y nube «mi
      respaldo», para siempre y en silencio. Con conflicto, local y nube terminan en «mi respaldo», y
      el conflicto «mi respaldo | w1 mio» sigue, con una «su versión» que no está en ningún lado.
    - **Hipótesis, medida en parte** (`H43propia`, en `_scratch/S43-piezas.cjs.txt`): una copia MÍA
      que llega con una escritura mía del doc en la cola no se aplica ni es conflicto: la de la cola
      llega después (como `ownQueued` con la copia leída, `R9-176`). Cierra los dos casos (local y
      nube en «mi respaldo», sin conflicto; `S43-7-H43propia.out.txt`), y la suite de sync pasa
      256/256 (`S43-rev-H43propia.out.txt`). Con el conflicto, tras reiniciar se asienta, como el
      respaldo propio de `R9-190`. Faltan la prueba y la matriz.
  - **✅ Cerrado en la sesión 44** (`dd6c015`), con `H43propia`: en `applyRemoteChange`, una copia
    MÍA que llega mientras una escritura mía del doc espera en la cola no se aplica ni es
    conflicto (la de la cola llega después, como la copia leída de `R9-176`).
    - **Confirmado contra `R9-190`:** su prueba espera, tras reiniciar, ningún conflicto y la marca
      asentada cuando la copia es mi propio respaldo. `H43propia` hace lo mismo con el conflicto
      retenido: la escritura de la cola cae encima de las dos copias.
    - **El caso de la entrada, no solo el de la sonda (corolario 53):** ¿qué otras copias MÍAS más
      nuevas que lo local llegan con una escritura en la cola? Solo una escritura con un reloj
      viejo las produce, y `keepMine`, `merge` y `keepTheirs` (cuando sube) vuelven a sellar con
      `now`. Queda el respaldo restaurado (`importBackup` sube con el reloj del archivo): su
      reversión, y la reentrega tras reiniciar (la rama del conflicto retenido). Si la copia
      llega por la lectura de un `removed`, la toma antes la guarda de `handleSnapshot`. Un vecino
      leído, sin medir: si la copia que llega es del OTRO y más nueva que mi respaldo en la cola,
      LWW la aplica y el respaldo sube encima. Es `R9-126` (un push con reloj viejo pisa en la
      nube una versión más nueva), que sigue pendiente.
    - **La prueba** (las dos ramas, con el reinicio y el reintento, contra el control «el mismo
      respaldo aceptado a la primera») cae con `R245` por la consecuencia: sin conflicto, lo local
      queda en «w1 mio» (en la sesión, tras reiniciar y tras el reintento); con conflicto, «mi
      respaldo | w1 mio» tras reiniciar y después del reintento
      (`_scratch/S44-rev245-R245.out.txt`).
    - **En la matriz,** la guarda nueva cubre a dos viejas en las pruebas donde mi copia llega con
      una escritura mía en la cola: `S32-W` baja de 9 a 6 (`R9-189`, `R9-174`, `R9-194`) y `T-tomb`
      de 3 a 2 (`R9-176`). Con `R245`, las dos juntas vuelven a tumbarlas (corolario 50). Ninguna
      baja a 0.
  - **Nota de la sesión 45, leído:** la guarda cambia algo solo cuando mi copia es MÁS NUEVA que
    lo local, o no hay copia local. Con la misma edad o más vieja, LWW ya la ignoraba, y en la
    sesión manda antes la rama del conflicto en memoria. Las que dejan de aplicarse son: la
    reversión de un respaldo (el caso), un reloj de este teléfono que fue para atrás, el eco con la
    referencia atrasada de `R9-174` (lo local ya lo tiene) y mi copia viva con mi lápida en la cola
    (sin copia local, antes la aplicaba hasta el eco de la lápida). Ninguna se aplicaba bien antes. Si la
    escritura de la cola se descarta después, lo local queda en ella y la nube en mi copia, como
    queda cualquier escritura descartada (`R9-33`). La prueba usa de control el respaldo aceptado a
    la primera, y ese control no cambia con `R245` (`_scratch/S44-rev245-R245.out.txt`: solo cae
    `rechazo`). Lo que su control da por esperado («lo suyo» se pierde al reiniciar) es `R9-252`.

- **`R9-246` (S42, `SyncEngine` / guardas — P3) — 🐛 dos guardas sin una prueba que las vea solas
  después de la 42: la retirada de la lectura de un `removed` (`R9-238`) y la guarda de memoria de la
  relectura (`R9-234`).** MEDIDO (la matriz entera, `_scratch/S42-matriz-s42-1a77b78.out.txt`; la
  comparación con la de la 40, `S42-comparar-s40.out.txt`).
  - **`S40-R238` baja de 2 a 0** (corolario 46): en sus pruebas, el `removed` de R2 llega sin nada
    en vuelo, y desde `R9-243` retira al llegar, antes de la lectura. **Leído, no es equivalente:** le
    quedan dos casos en que decide sola. El `removed` sintético de `R9-186` no trae copia (la
    llegada no hace nada), y su lectura puede encontrar la copia del otro. Y el eco de mi escritura
    que saca el doc de la query llega con ella en vuelo (no retira al llegar), y su lectura, si se
    procesa después del ack, puede encontrar una copia del otro que la query ya no entrega. Falta la
    prueba de uno de los dos, o medir que no hay daño y quitarla (regla 37).
  - **`R234mem` da 0** (nueva): ver el cierre de `R9-234`.
  - **De la 42.**
  - **Nota de la sesión 43:** las dos guardas tienen ya un orden en que deciden solas, con daño
    visible (`_scratch/S43-sondas1.body.txt` y `S43-sondas5.body.txt`):
    - **La retirada de la lectura** (`S43-1`): W1 sube; W2 sale y queda en vuelo; el otro escribe R2
      bajo el piso; el servidor rechaza W2, y la reversión es un `removed` que trae W2 (no retira al
      llegar: es la reversión). Solo la lectura ve R2. Sin la guarda (pieza `R238hoy`), `recentAcked`
      sigue en [W1] y el respaldo del otro con W1 pasa por «mío», sin conflicto; hoy, y en el
      control (+1 ms), «w2 mio» contra «w1 mio» (`S43-1-hoy.out.txt`, `S43-1-R238hoy.out.txt`).
    - **La guarda de memoria** (`S43-5`): el orden de `R9-230`. El enganche entrega MI W3, que la
      tabla ilegible no deja reconocer (la entrada de L4 sin `own`), y lo retira; L4 sube antes de la
      relectura (sello [L4]); el otro restaura W3, y la app se reinicia. Sin la guarda (`R234mem`),
      la relectura une [W3, L4] y, tras reiniciar, el conflicto desaparece en silencio (local «lo mio
      4», nube «w3 mio»); hoy, y en el control, sigue. Con keepTheirs en vez del reinicio no se ve
      nada (`S43-4`: «su versión» ya es W3). El motor de `e9d6e89` da el daño (es el de `R9-234`).
    - **Propuesta:** que las dos sondas sean las pruebas (con el control en la misma aserción). Las
      dos guardas se quedan. El `removed` sintético de `R9-186` no se construyó.
  - **✅ Cerrado en la sesión 44** (`3e35415` y `1400cb9`; la prueba de la lectura sola, en
    `bba4ab0`).
    - **La guarda de memoria** (`S43-5`): la prueba cae con `R234mem`. Tras reiniciar, el conflicto
      desaparece y la marca se va (`_scratch/S44-rev246-R234mem.out.txt`).
    - **La retirada de la lectura:** la prueba de `S43-1` caía con `R238hoy`
      (`S44-rev246-R238hoy.out.txt`). **El arreglo hermano de `R9-247` le quitó el caso**
      (corolario 51): la reversión ya retira al llegar con la cadena libre, y `R238hoy` volvió a dar 0. Esa prueba vigila ahora las dos retiradas juntas (cae con `R247,R238hoy`). La lectura sola
      la vigila una prueba nueva, de `_scratch/S44-sondas1.body.txt` (`S44-1`), con el `removed`
      sintético de `R9-186`, que no trae copia: el proceso anterior murió con el sello de W3 en la
      tabla y la marca de relectura, y el enganche lee R2. Cae con `R238hoy`: el respaldo con W3
      pasa por «mío», y «su versión» sigue «r2 suyo» con la nube en «w3 mio»
      (`S44-1-hoy.out.txt`, `S44-1-R238hoy.out.txt`, `S44-rev247b-*.out.txt`).
    - El otro caso que se leyó en la 42 (el eco de mi escritura que saca el doc de la query, leído
      después del ack) no da daño visible: tras ese ack, el único reloj mío es el de esa escritura
      (`R9-239`), que está bajo el piso, y un respaldo con él no llega por la query.
  - **Nota de la sesión 45, leído:** el disco que siembra la prueba de la lectura sola (el sello de
    W3 en la tabla y la marca de relectura) se puede alcanzar, pero no solo porque el proceso
    muera. La retirada al llegar escribe la tabla en el mismo turno (`retireOwn` →
    `persistQueue`), mucho antes de que falle la lectura y se guarde la marca, y AsyncStorage
    escribe en orden. Se llega si esa escritura esperó la relectura de la tabla de OTRA colección
    (`persistQueue` vuelve sin escribir), si falló, o si la tabla de esta colección no se pudo leer
    en ese proceso (no se escribe). El comentario de la prueba («murió antes de escribir la
    retirada de la llegada») podría decir eso. **Lo dice desde la sesión 46** (`e57fa16`).

- **`R9-247` (S43, `SyncEngine` / conflictos — P3) — 🐛 la excepción de `R9-243` para la reversión de
  un rechazo exime también la escritura del otro que esa reversión TRAE: si R2 (bajo el piso) llegó
  al servidor con mi escritura en vuelo, la reversión vuelve a R2 y sale como `removed` con mi
  payload rechazado. No retira al llegar, y con la cadena de lotes ocupada el respaldo del otro con
  mi último reloj llega antes de la lectura y pasa por «mío».** MEDIDO en el mock
  (`_scratch/S43-sondas2.body.txt`, `S43-2`; `S43-2-hoy.out.txt`).
  - El caso: W1 sube (`recentAcked` [W1]); W2 sale y queda en vuelo; el otro escribe R2 bajo el piso
    (la vista lleva W2 encima: no llega nada); el servidor rechaza W2. La reversión es un `removed`
    que trae W2 (igual a `rejectedAwaitingRevert`), y la nube queda en R2. En el SDK es el mismo
    orden: R2 llega por el watch con W2 pendiente, y el rechazo devuelve la vista a R2.
  - **Con la cadena libre** la lectura de ese `removed` encuentra R2 y retira (`S43-1`, ver `R9-246`).
  - **Con la cadena ocupada** (`S43-2`), la reversión y el respaldo del otro con W1 llegan y esperan;
    el respaldo se juzga «mío» al llegar, y la lectura ya lo encuentra a él. `mio`: sin conflicto
    (local «w2 mio», nube «w1 mio», y W2 en la cola subirá encima); el control (+1 ms) da «w2 mio»
    contra «w1 mio».
  - **¿De la 42? No: ya existía.** El motor de `e9d6e89` da lo mismo (`S43-12-motor40.out.txt`).
    Es la lección de `R9-243` en la reversión: la excepción mira lo que trae el `removed` (mi
    payload), y la reversión vuelve a la copia de la nube, que puede ser del otro. El comentario de
    `rejectedAwaitingRevert` («a write of this device, not a change of the other one») no dice la
    verdad entera.
  - **Hipótesis, medida en parte** (`H43suelo`, en `_scratch/S43-piezas.cjs.txt`): una reversión
    `removed` dice que la nube volvió a una copia bajo el piso (o a ninguna); si todos mis relojes del
    doc (`recentAcked`, el `own` de la entrada, `ownStamps`) están en el piso o encima, ninguno la
    nombra, y se retiran al LLEGAR. Mi propio respaldo (`R9-190`) queda fuera: su reloj está bajo el
    piso. Cierra `S43-2` y no cambia `S43-1` (`S43-12-H43suelo.out.txt`); la suite de sync pasa
    256/256 (`S43-rev-H43suelo.out.txt`), también junto con `H43drop` (`S43-rev-juntas.out.txt`).
    Necesita el piso de la query en el motor (la pieza lo guarda al enganchar). Faltan la prueba y
    la matriz.
  - **✅ Cerrado en la sesión 44** (`bba4ab0`), con `H43suelo`: en `noteArrived`, la reversión
    `removed` de un rechazo retira mis relojes del doc al LLEGAR si todos están en el piso o encima
    (`recentAcked`, `ownStamps` y el `own` de la entrada).
    - **Dónde vive el piso:** `queryFloors`, por colección. `attachListener` lo fija con la query,
      antes de suscribirse. Con la consulta sin filtro de respaldo, el piso es 0: ahí solo un
      borrado saca un doc. Sin piso conocido, no retira. **No se borra en `stop()`:** el `clear()`
      dio 0 (pieza `R247stop`) y es equivalente por construcción. Cada enganche fija su piso antes
      de suscribirse, y una entrega que llega después de un `stop()` lee `uid` nulo: ninguna
      anotación de rechazo casa, y no llega a esa rama.
    - **Con la tabla de sellos sin leer** (`ownUnread`), no retira al llegar y decide la lectura:
      ahí no se sabe si falta un sello bajo el piso, y retirar anotaría en `ownRetired` el reloj del
      payload, que ninguna tabla tiene. Ver `R9-251`.
    - **Medido:** la prueba (de `S43-2`, con la cadena ocupada, control +1 ms) cae con `R247` y
      con `R247piso` por el conflicto. **`R9-190`** (mi respaldo bajo el piso) cae si la reversión
      retira también con un reloj bajo el piso (`R247siempre`). La prueba de `R9-243` con la cadena
      ocupada pasa (`_scratch/S44-rev247b-*.out.txt`). Con la cadena libre, la prueba de la lectura
      de `R9-246` pasa a vigilar las dos retiradas juntas (ver `R9-246`).
    - De paso, el comentario de `rejectedAwaitingRevert` (la reversión puede volver a una copia
      del otro) y el de `noteArrived` (un `removed` sin nada en vuelo también puede ser un borrado
      mío, como `cleanupOldReviewEvents`, o el eco de una escritura que salió después de un
      `stop()`).
  - **Nota de la sesión 45, leído, sin daño:**
    - **El piso:** `noteArrived` lo lee al LLEGAR, en el callback del listener que entregó. Un
      re-enganche (`unregister` + `register`) fija el nuevo antes de suscribirse, y el lote viejo
      que espera en la cadena ya decidió con el suyo. Con la consulta sin filtro (piso 0), una
      reversión `removed` dice que la nube no tiene el doc, y no hay copia mía que nombrar. Dos
      listeners de la misma colección (`R9-37`, abierto) comparten un piso, calculado del mismo
      disco en el mismo instante.
    - **La retirada al llegar contra la lectura:** las dos leen lo mismo (`recentAcked`,
      `ownStamps`, el `own` de la entrada). Si un reloj de la copia de la nube está en memoria,
      está bajo el piso y no se retira al llegar. Si no está, la lectura tampoco la reconoce. El
      payload de la entrada en la cola, que `clocks` no lista, no se retira nunca. Entre la llegada
      y la lectura, la memoria solo gana relojes por un ack (que la lectura ve igual) o por la
      relectura de la tabla, y esa es la guarda `ownUnread` (`R9-251`).
    - **El comentario de `queryFloors`** («one that arrives after a `stop()` has no `uid`»): si ya
      entró otra cuenta, una entrega tardía lee su `uid`. La conclusión vale igual: ninguna
      anotación de esa cuenta tiene el reloj de ese payload. **Lo dice desde la sesión 46**
      (`70f8b71`).

- **`R9-248` (S43, `SyncEngine` / conflictos — P3) — 🐛 cuando el rechazo DESCARTA la escritura
  (`MAX_RETRY_ATTEMPTS`), su reversión llega «no mía» (la entrada ya salió de la cola) y retira al
  llegar mis relojes. Con mi propio respaldo en la nube y el conflicto retenido, la lectura le pasa
  la marca a mi respaldo: «lo mío contra lo mío», en la sesión y tras reiniciar.** MEDIDO en el mock
  (`_scratch/S43-sondas3.body.txt`, `S43-3`; `S43-3-hoy.out.txt`).
  - Es la prueba de `R9-190` (mi respaldo W0 bajo el piso, con el conflicto retenido; W0 se confirma:
    sello [W0]) con el rechazo de W2 en su octavo intento: se arman `rejectedAwaitingRevert` y
    `droppedAwaitingRevert`. La reversión (`removed`, con W2) no retira por la excepción de `R9-243`,
    pero `isOwnCopy` ya no la reconoce (la entrada se descartó), y la retira la rama de siempre: el
    sello de W0 se va. La lectura encuentra W0, que ya no es «mío», y con `justDropped` la marca
    pasa a W0 (log de cada llegada, pieza `L43llega`).
  - **Medido:** «lo mio | mi respaldo» en la sesión y «lo mio nuevo | mi respaldo» tras reiniciar. El
    control (el rechazo de siempre, 1 intento) no muestra nada: sello [W0], sin marca.
  - **¿De la 42? No: ya existía** (`S43-3-motor40.out.txt`).
  - **Hipótesis, medida en parte** (`H43drop`): una entrega que trae el payload rechazado es mía,
    aunque el rechazo la haya descartado (`rejectedAt === updatedAtOf(copy)` antes de `isOwnCopy`).
    Cierra `S43-3` (`S43-3-H43drop.out.txt`), y la suite de sync pasa 256/256
    (`S43-rev-H43drop.out.txt`), también con `H43suelo`. Faltan la prueba y la matriz.
  - **✅ Cerrado en la sesión 44** (`4134635`), con `H43drop`: en `noteArrived`, una entrega que
    trae el payload rechazado (`rejectedAt === updatedAtOf(copy)`) es mía, aunque el rechazo la
    haya descartado de la cola.
    - **La prueba** (de `S43-3`, control: el rechazo de siempre, que no descarta) cae con `R248` por
      la consecuencia: el sello de W0 se va, y la marca pasa a mi respaldo
      (`_scratch/S44-rev248-R248.out.txt`). Con `R247,R248` caen las dos pruebas.
    - **Con la cadena de lotes ocupada** (`_scratch/S44-sondas3.body.txt`, `S44-3`): hoy, las
      cuatro variantes salen limpias. Con `R248`, `descarta` da el daño con la cadena libre y con la
      ocupada («lo mio | mi respaldo», y «lo mio nuevo | mi respaldo» tras reiniciar). `R247,R248`
      da lo mismo que `R248`: el reloj de W0 está bajo el piso, y `R9-247` no retira
      (`S44-3-*.out.txt`).
  - **Nota de la sesión 45:**
    - **La prueba fuerza `attempts = 7`.** Medido con ocho rechazos de verdad
      (`_scratch/S45-sondas2.body.txt`, `S45-2`): cada reintento trae su eco, que vuelve a retener
      la marca, y su reversión, que la asienta. El octavo llega igual que el forzado. Hoy los dos
      salen limpios; con `R248` (vista aplicada) los dos dan «lo mio | mi respaldo» y, tras
      reiniciar, «lo mio nuevo | mi respaldo». El control (un rechazo) no cambia
      (`S45-2-hoy.out.txt`, `S45-2-R248.out.txt`).
    - **Leído, sin daño: una entrega que no es la reversión con el reloj del payload rechazado.**
      La anotación se consume con la primera entrega del doc. Si el payload era igual a la vista,
      el SDK no levanta nada, y la anotación espera. Lo que la casa después es el reintento de lo
      mismo (es mío) o un `removed` que trae ese payload, que en la 43 no retiraba nada al llegar y
      hoy retira si todos mis relojes están sobre el piso. Queda el otro con el mismo milisegundo,
      el límite de siempre de `isOwnCopy`.

- **`R9-249` (S43, `SyncEngine` / cola — P3) — 🐛 lo que queda de `R9-242`: su arreglo corre solo con
  `isCurrent()`. Si un `stop()` corta la sesión con la subida reemplazada en vuelo y el servidor la
  confirma después, el `own` de la entrada aparcada sigue en [W0, W1]; la misma cuenta vuelve a
  entrar, y el respaldo del otro con W0 pasa por «mío» por la cola.** MEDIDO en el mock
  (`_scratch/S43-sondas6.body.txt`, `S43-6`; `S43-6-hoy.out.txt`).
  - La 42 lo leyó en la entrada, sin medir. **Medido:** `own` [W0, W1] tras el reinicio; `mio`, sin
    conflicto (W2 subirá encima del respaldo); el control (+1 ms), «w2 mio» contra «w0 mio».
  - **¿De la 42? No:** el motor de `e9d6e89` da lo mismo (`S43-456-motor40.out.txt`). Es el daño de
    `R9-242`, que la 42 cerró solo dentro de la sesión. El comentario de `PendingWrite.own`
    (`types.ts`: «or the server takes the one in flight: then only its clock stays») no vale después
    de un `stop()`.
  - **Hipótesis, medida en parte** (`H43aparcada`): sin el `isCurrent()` de esa rama
    (`SyncEngine.ts:3277`). El ack dice que la escritura llegó a la nube de `item.uid`, sea cual sea
    la sesión, y la entrada es de ese uid (`isOwnCopy` filtra por uid). Cierra `S43-6`
    (`S43-6-H43aparcada.out.txt`), y la suite de sync pasa 256/256 (`S43-rev-H43aparcada.out.txt`).
    El `noteOwnAcked` de `stop()` no puede hacer lo mismo: si la subida no llega, W0 es la copia de
    la nube. Faltan la prueba y la matriz.
  - **✅ Cerrado en la sesión 44** (`d200ed1`), con `H43aparcada`: la rama del ack que deja solo su
    reloj en la entrada que reemplazó la subida ya no pregunta `isCurrent()`, igual que el `splice`
    de al lado (`R9-104`). El comentario de `PendingWrite.own` (`types.ts`) lo dice.
    - **La prueba** (de `S43-6`, control +1 ms) cae con `R249` por el conflicto
      (`_scratch/S44-rev249-R249.out.txt`).
  - **Nota de la sesión 45, leído, sin daño:** el `own` cambiado llega a disco con el
    `persistQueue` que corre al final del `flush`, justo después del `break` de `!isCurrent()`
    (antes que en la sesión, donde espera al resto del lote). Si ya entró otra cuenta y tiene una
    tabla de sellos sin leer, ese `persistQueue` primero la relee y escribe al volver: la ventana
    es una lectura de AsyncStorage, la misma que tiene el `splice` de al lado (`R9-104`). Las
    entradas son por `uid`, y la otra cuenta no toca las aparcadas.

- **`R9-250` (S43, `SyncEngine` / comentario — P3) — 🐛 `ownRetired` dice guardar «the clocks of the
  copies that retired this device's own stamps», y la relectura conserva los sellos de un doc si la
  tabla tiene esos relojes (la copia era mía, `R9-230`). La retirada al llegar de `R9-243` anota el
  reloj de la copia que TRAE el `removed` (la última que casaba, a menudo mía y con su reloj en la
  tabla), no el de la escritura que sacó el doc.** LEÍDO, sin daño construible.
  - Con la tabla ilegible, un `removed` del otro que trae W3 (en la tabla) anota W3, y la relectura
    lo toma por la retirada equivocada de `R9-230`: conserva [W3].
  - **Sin daño, por lectura:** la lectura de ese mismo `removed` encuentra la copia del otro y anota
    su reloj (que la tabla no tiene), o retira otra vez si la relectura ya volvió. Si la lectura
    falla, para que un respaldo con W3 cambie algo «su versión» tiene que ser otra copia que W3, y
    toda copia ajena que llegó a ser «su versión» pasó por `retireOwn` y anotó un reloj que la tabla
    no tiene.
  - **De la 42** (`R9-234` y `R9-243` juntas). **Propuesta:** que esa rama anote un reloj que ninguna
    tabla tiene (un `removed` sin nada en vuelo que no es una reversión no es una copia mía), y que el
    comentario diga las dos fuentes.
  - **✅ Cerrado en la sesión 44** (`c429604`): **solo el comentario**, como prefería Victor. No se
    midió un orden con daño, así que lo que se anota no cambió. El comentario de `ownRetired` dice
    qué copia anota cada retirada, por qué no se construyó daño, y que la reversión que retira al
    llegar (`R9-247`) lo hace solo con la tabla leída, así que no anota nada.

- **`R9-251` (S44, `SyncEngine` / guardas — P3) — 🐛 la guarda `ownUnread` del arreglo de `R9-247`
  no tiene una prueba que la vea decidir: con la tabla de sellos sin leer, la reversión de un
  rechazo no retira al llegar y decide la lectura.** MEDIDO el mecanismo; sin daño construido.
  - **Por qué está:** con la tabla sin leer, «todos mis relojes están sobre el piso» no se puede
    saber: puede faltar en memoria el sello de mi respaldo bajo el piso, que es la copia de la
    nube. Retirar ahí anota en `ownRetired` el reloj del payload rechazado, que ninguna tabla
    tiene, y la relectura descartaría entonces el sello de ese respaldo (`R9-234`).
  - **Medido** (`_scratch/S44-sondas2.body.txt`, `S44-2`): es la prueba de `R9-190` en un proceso
    nuevo con la tabla ilegible. Con la guarda, `ownRetired` queda en [W0] (lo anota la lectura,
    que encuentra mi respaldo). Sin ella (pieza `R247unread`), en [W2, W0]. Pero la relectura no
    corre en la sesión (la tabla no tiene cambios, `ownDirty`), y el eco de W2 asienta la marca
    antes de la reversión (`R9-197`, `R9-190`): el resultado visible es el mismo
    (`S44-2-hoy.out.txt`, `S44-2-R247unread.out.txt`). En la suite y en la matriz, `R247unread` da 0.
  - **De la 44.** Se queda con el porqué escrito, como la guarda de memoria de `R9-234` en la 42
    (que la 43 vio decidir: `R9-246`). **Para la 45:** buscar un orden con daño (la relectura
    después de las dos retiradas, con el doc todavía en conflicto) o medir que no lo hay y
    quitarla.
  - **Nota de la sesión 45: hay un orden con daño** (`_scratch/S45-sondas1.body.txt`, `S45-1`).
    - El caso: es `S44-2` con el conflicto EN MEMORIA. El proceso anterior dejó la marca de
      relectura en doc-c, y el enganche, con la tabla ilegible, lee mi respaldo W0 y lo toma por
      el otro: «lo mio nuevo | mi respaldo» (la degradación aceptada de `R9-219`). El eco de W2 ya
      no asienta nada. El servidor rechaza W2, y la reversión y su lectura retiran. Después, el ack
      de Wd (otro doc en conflicto) ensucia la tabla y dispara la relectura, que vuelve DESPUÉS de
      las dos retiradas.
    - **Medido:** hoy, la relectura conserva [W0] (`ownRetired` [W0, W0]); la tabla queda con
      doc-c, y tras reiniciar el conflicto se asienta. Sin la guarda (`R247unread`, vista
      aplicada), `ownRetired` es [W0, W2, W0], la relectura descarta doc-c, la tabla se reescribe
      sin él, y tras reiniciar sigue «lo mio nuevo | mi respaldo». El control (la nube con la misma
      copia y +1 ms, que la tabla no tiene) da el conflicto en los dos motores
      (`S45-1-hoy.out.txt`, `S45-1-R247unread.out.txt`).
    - **¿Y antes de la 44?** El motor de `1a77b78` da lo mismo que hoy (`S45-1-motor43.out.txt`): la
      reversión no retiraba al llegar. La guarda conserva eso con la tabla sin leer.
    - **Propuesta:** la guarda se queda; `S45-1` pasa a ser su prueba (con el control en la misma
      aserción), y debe caer con `R247unread`.
  - **✅ Cerrado en la sesión 46** (`a79dcbe`): la prueba, de `S45-1`, con los controles del
    mecanismo en la misma aserción (el conflicto en memoria al enganchar, la relectura que todavía
    no empezó al llegar la reversión y que el ack de Wd dispara). Cae con `R247unread` solo ella
    (264/265), por la consecuencia: la tabla queda sin doc-c y, tras reiniciar, «lo mio nuevo | mi
    respaldo»; el control `otro` no cambia (`_scratch/S46-rev251-R247unread.out.txt`, y sobre el
    árbol final, `S46-rev251-R247unread-final.out.txt`).
  - **Nota de la sesión 47, medido** (`_scratch/S47-varias.cjs.txt`, 12 piezas de a una sobre el
    árbol de `e57fa16`; resumen en `S47-varias.out.txt`):
    - **Cae por la consecuencia** con `R247unread` y con `R234own` (la relectura no trae el sello de
      ningún doc retirado): tras reiniciar, «lo mio nuevo | mi respaldo».
    - **Cae por la tabla de su control** (`otro` guarda doc-c con un sello que no es la copia de la
      nube) con `R234ret` (la relectura no mira `ownRetired`) y `R238hoy` (la lectura no retira).
      Ahí vigila el mecanismo, no un daño visible.
    - **No cae** con `R247`, `R247piso`, `R247siempre`, `R248`, `R234mem` ni `R245`. `R243vuelo` no
      se aplicó (su ancla es de antes de la 44). Juntas, `R247unread` y `R234mem` la tumban igual.
    - **Leído:** sus controles del orden son contadores de lecturas de la tabla. Si la relectura
      empezara antes de la reversión, `lecturas` daría 2 en `rechazo` y la aserción caería. Y la
      puerta garantiza que la relectura procese después de las dos retiradas.

- **`R9-252` (S45, `SyncEngine` / conflictos — P3) — 🐛 una escritura mía del doc que sube mientras
  su conflicto espera pisa «lo suyo» en la nube. El conflicto sigue en la sesión, pero tras reiniciar
  desaparece sin que nadie elija, y «lo suyo» ya no está en ningún lado.** MEDIDO en el mock
  (`_scratch/S45-sondas3.body.txt`, `S45-3`; `S45-3-hoy.out.txt`).
  - El caso: conflicto «lo mio | lo suyo» pendiente. El usuario edita el doc (W1, `edita`) o
    restaura su respaldo (`respaldo`), y el servidor toma la escritura: la nube queda en lo mío.
    Después, la app se reinicia.
  - **Medido:** en la sesión, el conflicto sigue (keepTheirs subiría «lo suyo» re-sellado:
    `R9-161`, `R9-199`). Con `edita`, la marca sigue en disco, pero tras reiniciar el enganche
    entrega W1, igual a lo local, y LWW la asienta. Con `respaldo`, la lectura de su eco ya la
    asentó en la sesión (`R9-190`). En los dos, tras reiniciar no hay conflicto, local y nube
    quedan en lo mío, y «lo suyo» no está en la nube (ni en el otro teléfono, si LWW le aplicó lo
    mío). El control (sin escritura) vuelve a mostrar el conflicto tras reiniciar.
  - **¿De la 44? No: ya existía.** El motor de `1a77b78` da lo mismo (`S45-3-motor43.out.txt`). Es
    el orden que `R9-185` y `R9-197` llamaron daño en la lectura («a restart meanwhile lost the
    conflict», «the write's echo then settled it by LWW … before the user chose»), en la entrega:
    la marca guarda solo el `updatedAt`, y tras reiniciar solo una entrega puede volver a mostrar
    el conflicto. La nube ya no tiene «lo suyo».
  - Las pruebas de `R9-245` y `R9-248` lo dan por esperado: «su versión» «lo suyo» en la sesión, y
    ningún conflicto tras reiniciar.
  - **Hipótesis, sin medir:** guardar «lo suyo» con la marca (como la lista de conflictos) y
    volver a mostrarlo tras reiniciar si la entrega es mía. Es una decisión de Victor: guardar en
    disco la copia del otro mientras el conflicto espera, o aceptar que una escritura mía con el
    conflicto pendiente lo cierra en el próximo reinicio.
  - **✅ Cerrado en la sesión 46 por decisión de Victor: ACEPTADO** (`5a2c377`, solo un
    comentario). Guardar «lo suyo» en disco sería una tabla más, con sus propios casos (ilegible,
    otra cuenta, relectura), como la de sellos de `R9-193`, que trajo una docena de hallazgos. Es
    raro (editar durante un conflicto y reiniciar antes de elegir), y en la sesión keepTheirs lo
    devuelve (`R9-161`). El comentario de la rama del conflicto retenido de `applyRemoteChange`
    lo dice. Las pruebas de `R9-245` y `R9-248` ya lo esperan así.
  - **Nota de la sesión 47:** el comentario no dice la verdad entera para un respaldo restaurado
    sobre el piso: ver `R9-253`.

- **`R9-253` (S47, `SyncEngine` / comentario — P3) — 🐛 el comentario de `R9-252` dice que un
  respaldo restaurado ya asentó el conflicto en la sesión («a restored backup settled it already,
  R9-190»). Eso vale solo para un respaldo bajo el piso, cuyo eco sale de la query y lo lee la
  lectura. Uno sobre el piso se comporta como una edición: la marca sigue en la sesión, y tras
  reiniciar lo asienta LWW.** MEDIDO en el mock (`_scratch/S47-sondas1.body.txt`, `S47-1`;
  `S47-1-hoy.out.txt`).
  - El caso: conflicto «lo mio | lo suyo» pendiente; el usuario restaura un respaldo y sube. `bajo`
    (de hace dos días): en la sesión la marca ya no está. `sobre` (de T + 10 s, sobre el piso de T −
    5 min y más viejo que lo local): la marca sigue en la sesión, como con `edita` (el control), y
    tras reiniciar no hay conflicto. El resultado visible es el mismo de `R9-252`; lo que falla es
    el comentario, que cuenta por qué.
  - **De la 46** (`5a2c377`): el comentario es suyo. El motor no cambió.
  - **Propuesta:** «(a restored backup below the floor settled it already, R9-190)».
  - **✅ Cerrado en la sesión 48** (`05e089e`, solo el comentario): dice que un respaldo bajo el
    piso lo asentó ya en la sesión (su eco salió de la query, y la lectura lo encontró mío,
    `R9-190`), y que uno sobre el piso es como una edición. Sobre la base nueva
    (`_scratch/S48-SyncEngine-final.ts.txt`), las piezas aplican y la prueba de `R9-251` sigue
    cayendo con `R247unread`.

- **`R9-254` (S50, `SyncEngine` / cola — P3) — 🐛 con la lectura de la hidratación fallando, una
  edición hecha durante esa lectura sale de memoria, y si la relectura también falla se pierde.**
  MEDIDO en el mock (`_scratch/S50-sonda.body.txt`, `HIDRATA`; `S50-sonda-hoy.out.txt`). **Lo
  abrió `R9-212`** (medido con el motor de `8f59942`, `S50-sonda-s48.out.txt`).
  - `start()` fija `this.uid` antes de `await this.hydrateQueue()`, así que `queueWrite` encola
    durante la lectura. Desde la 49, `hydrateQueue` hace `this.queue = entries` también cuando
    `getItem` falla (`entries` = `[]`). Antes, en el fallo, la memoria no se tocaba.
  - **Medido** (`doc-q` en disco; `doc-w`, escrita durante la hidratación sin red; `doc-z`,
    después): con 3 lecturas fallidas, `{"trasArranque":{"memoria":[],"disco":["doc-w"]},
"final":{"disco":["doc-z"]}}`, y en `8f59942`, `["doc-w","doc-z"]`. Con 2 (`dos`), la unión la
    recupera del disco: `["doc-w","doc-z"]`. **La edición queda solo en local y no sube nunca.**
  - **Preexistente, en el mismo orden:** el `multiSet` de esa edición reescribe la cola de disco
    antes de que vuelva la lectura. `doc-q`, justo la entrada que `R9-212` protege, se pierde en
    `dos` y en `tres`, como en `8f59942`. Con la cola legible, la hidratación pisa la memoria y se
    pierde `doc-w` (`legible`). Es la familia de `R9-115`.
  - **La pieza `R212` no lo revierte:** solo quita `this.queueUnread = true`, y con ella `HIDRATA`
    da lo mismo que hoy.
  - P3: hacen falta 3 lecturas fallidas y una edición en los milisegundos de la primera. Un fallo
    determinista (un valor más grande que la `CursorWindow`) deja de fallar tras ese `multiSet`, que
    escribe un valor chico.
  - **Arreglo (hipótesis, sin medir):** la de `R9-115`, no aceptar escrituras hasta hidratar (el
    `queueWrite` de ese rato espera la hidratación). Cerraría las dos mitades. Lo mínimo para la
    mitad nueva: en el fallo, conservar la memoria.
  - **✅ ARREGLADO en la sesión 51** (`e97cd95`, rama `fix/s51-arreglos-s50`), con `R9-115`. En
    vez de hacer esperar a `queueWrite`, `persistQueue` no escribe la cola antes de hidratarla.
    La hidratación une lo leído con lo de memoria: es la unión de `readQueueAgain`, extraída a
    `joinQueue`. Con la lectura fallida, lo de memoria espera a la relectura. Lo escrito antes de
    la primera lectura marca su doc (`queueTouched`), como mientras la cola no se lee.
    - **Medido (`HIDRATA`, `_scratch/S51-hidrata-fix.out.txt`):** `legible`, `dos` y `tres` dan
      `["doc-q","doc-w","doc-z"]`, `["doc-q","doc-w","doc-z"]` y `["doc-w","doc-z"]`; tras el
      arranque, el disco sigue con `doc-q`. En `tres`, `doc-q` se pierde por diseño (se rinde).
    - **Pruebas: 2.** Las tres formas en un `it`, y el caso de `R9-115` (la nube) con la lectura
      que vuelve antes y después del ack. Piezas (`_scratch/S51-piezas.cjs.txt`): `R254hyd`
      tumba las dos; `R254keep` y `R254write`, la primera; `R254touch`, las dos (la segunda por
      `lenta`: sin la marca, la entrada vieja sube después del ack de la nueva). Todas por la
      consecuencia.
    - **⚠️ Sesión 52:** el arreglo abrió dos vecinos: `R9-260` (dos hidrataciones a la vez) y
      `R9-261` (el proceso muere durante la primera lectura).

- **`R9-255` (S50, `SyncEngine` / cola — P3) — 🐛 mientras la relectura que espera una escritura
  no vuelve, el disco guarda la entrada vieja de un doc que ya subió más nuevo; si el proceso muere
  ahí, tras reiniciar la vieja sube encima.** MEDIDO en el mock (`S50-sonda.body.txt`,
  `VENTANA`). **Lo abrió `R9-212`** (en `8f59942`, la nube queda en la nueva).
  - Con la cola sin leer, `persistQueue` no escribe hasta la unión, y la marca que descarta la
    entrada vieja (`queueTouched`) vive solo en memoria.
  - **Medido** (`doc-q` «q vieja» en disco; la hidratación y la relectura de `start()` fallan; el
    usuario escribe «q nueva», que sube y se confirma, con la relectura todavía en vuelo; `stop()` y
    el proceso muere): tras reiniciar, **local «q nueva», nube «q vieja».** El control, con la
    relectura ya vuelta antes del `stop()` (`abierta`), da la nube en «q nueva».
  - **La tabla de sellos** que escribe `stop()` queda en `null` (el doc no está en conflicto). Lo
    que se contradice es la cola de disco y la nube, no el sello.
  - **Sin medir, por lectura:** lo mismo con una escritura sin red. La edición nueva no llega a
    disco antes de la unión, así que tras reiniciar no sube nunca, y la vieja sube.
  - P3: la ventana es lo que tarda la lectura frente a la subida y su ack. Un fallo determinista
    vuelve rápido y se rinde, y entonces escribe la memoria.
  - **Arreglo (hipótesis, sin medir):** decirlo en el comentario de `queueUnread`, o no subir un doc
    marcado hasta que la unión esté escrita. Lo segundo no salva la escritura sin red.
  - **✅ ACEPTADO en la sesión 51** (`6d834c5`, solo el comentario de `queueUnread`), con el
    porqué escrito donde ocurre (como `R9-252`).
    - **La variante sin red, medida** (`_scratch/S51-sonda-sinred.body.txt`): `cerrada` deja la
      nube en «q vieja» y lo local en «q nueva», y la cola vacía tras reiniciar: la edición nueva
      no sube nunca. El control (`abierta`) y `8f59942` dan «q nueva».
    - **Por qué se acepta:** la ventana es una lectura de almacenamiento local (milisegundos),
      después de dos lecturas fallidas, y el proceso tiene que morir justo ahí. Un fallo
      determinista vuelve rápido y se rinde. Cerrarla pediría guardar en disco la escritura que
      espera y la marca, en una clave más con sus propios casos (ilegible, otra cuenta), como la
      tabla de sellos (`R9-193`).
    - **⚠️ Sesión 52:** desde `R9-254`, la misma ventana se abre en la primera lectura de cada
      arranque, sin ninguna lectura fallida (`R9-261`), y esta aceptación no la cubre.

- **`R9-256` (S50, `SyncEngine` / borrados — P2) — 🐛 una lápida en cola y una copia del otro más
  vieja que el borrado: la fila resucita en este teléfono, y la nube y el otro teléfono la tienen
  borrada.** MEDIDO en el mock (`_scratch/S50-sonda-borra.body.txt`, `BORRA`;
  `S50-borra-hoy.out.txt`), **con la cola legible**, igual en `8f59942` (`S50-borra-s48.out.txt`).
  - **El caso:** «d» subida; sin red, el usuario la borra (la lápida, con el reloj de ahora); el
    otro había escrito R antes del borrado, y este teléfono no la vio. Al volver, R llega al
    enganchar.
  - **El mecanismo, por lectura:** sin copia local, `applyRemoteChange` no compara relojes y aplica
    R. La salida `ownQueued && !local` vale solo para la lectura de un `removed`. La lápida sube, y
    su eco llega con ella todavía en cola: es propio (`hasQueuedWrite` + `isOwnCopy`) y no se aplica.
  - **Medido:** `{"legible":{"local":"R","nube":"d (borrado)"}}`, y lo mismo con la relectura de
    `start()` que vuelve (`uno`). Por lectura, no se cura solo: el eco de la lápida ya pasó, y la
    copia borrada no vuelve a llegar mientras nadie cambie el doc (sin medir tras reiniciar).
  - **Con la cola sin leer toda la sesión** (`dos`), la unión descarta la lápida, porque el doc está
    marcado: **local R, nube R**, y el borrado se pierde. En `8f59942` da lo mismo (`uno` y `dos`).
  - P2: no hace falta ningún fallo. Basta un borrado sin red y una edición del otro, anterior al
    borrado, que este teléfono no vio.
  - **Arreglo (hipótesis, sin medir):** sin copia local y con una entrada de esta cuenta en cola
    más nueva que la copia, no aplicar (como la salida de `ownQueued`). Antes, preguntar por una
    copia MÁS nueva que la lápida (el otro la recreó después): ahí la lápida sube encima, y eso es
    `R9-126`.
  - **✅ ARREGLADO en la sesión 51** (`88fb219`, rama `fix/s51-arreglos-s50`). Sin copia local y
    con una lápida de esta cuenta en cola, la copia que llega se compara con la lápida, y la lápida
    gana el empate, como LWW. Solo lápidas: una edición en cola sin copia local no es un camino
    normal.
    - **Medido (`BORRA`, `_scratch/S51-borra-R256fix.out.txt`):** `legible` y `uno` dan local
      nulo y nube borrada. `dos` (la cola sin leer toda la sesión) sigue igual que antes de la 49:
      la lápida no está en memoria. Se acepta, y lo dice el comentario de `queueTouched`.
    - **Prueba: 1**, con su control en el mismo `it`: una copia MÁS nueva que el borrado sí entra
      al enganchar (lo que pasa después es `R9-126`, y no se mira). Cae sin el arreglo (`R256`),
      por la consecuencia: local R.
    - **Coste:** si la lápida se descarta después (`R9-33`), lo local queda borrado y la nube con
      R, como cualquier escritura descartada.
      **⚠️ Sesión 52, medido: al revés en la sesión.** Descartada en la misma sesión, la última
      reversión trae R (local R, nube R). Solo con un reinicio entre medias queda borrada aquí, y
      eso lo abrió este arreglo: `R9-262`.
    - **Abrió `R9-259`:** tapa a la guarda de `R9-197` en su única prueba.

- **`R9-257` (S50, favoritos / sync — P3) — 🐛 un fallo de `getFavorites()` en el bulk push graba
  el flag `'2'` sin subir nada, y los favoritos no suben nunca por esa vía.** MEDIDO con el provider
  y el motor reales (`_scratch/S50-fav.cjs.txt`, `S50-fav.out.txt`). **Lo abrió `R9-214`** (con el
  contexto de `8f59942`, `S50-fav-s48.out.txt`, subía desde el ref).
  - `pullAllLocal` ya no tiene `catch`. `maybeRunInitialBulkPush` registra el fallo y sigue, y
    graba `BULK_PUSH_DONE_VALUE` igual.
  - **Medido** (la carga del provider ya terminó; `getFavorites()` falla una vez): `{"falla":
{"cargados":1,"enSesion":{"nube":null,"flag":"2"},"exportados":[],"trasOtroStart":null}}`. El
    control sano: nube «lo mio» y `exportados` 1.
  - **`exportLocalData`** salta el adaptador. Con los favoritos solos, el total es 0: no hay diálogo
    de migración, y la pregunta del dueño anterior (`R9-166`) no se hace.
  - **Preexistente en el motor:** el flag se graba aunque un adaptador haya fallado. Los de
    subrayados y notas atrapan su propio fallo y devuelven `[]`, así que el motor ni se entera.
  - P3: hace falta un fallo de SQLite justo en el bulk push, con la carga ya terminada.
  - **Arreglo (hipótesis, sin medir):** no grabar el flag si un `pullAllLocal` lanzó (el próximo
    `start()` reintenta; los duplicados son idempotentes, lo dice el propio motor). Para subrayados
    y notas, que lancen en vez de devolver `[]`.
  - **✅ ARREGLADO en la sesión 51** (`ec5bc70`, rama `fix/s51-arreglos-s50`), con un cambio sobre
    la hipótesis. Omitir el flag haría que el `start()` siguiente repitiera el push entero, y
    volvería a subir las colecciones que ya subieron con sus relojes, encima de una copia más
    nueva (`R9-126`: los duplicados NO son inocuos). Así que el flag `'2'` se graba igual, y las
    colecciones que fallaron quedan en `@sync_first_push_retry:<uid>`. El `start()` siguiente sube
    esas, y solo esas. Si la lista no se lee, no se hace nada, y queda para el siguiente.
    Subrayados y notas lanzan en vez de devolver `[]`.
    - **Pruebas: 4.** El motor (`R257` tumba el reintento; `R257only`, que sea solo de la que
      falló), favoritos con el provider y el motor reales (cae con `R257`), y los dos adaptadores
      (caen con su `catch` de antes).
    - **⚠️ Sesión 52:** quedan tres vecinos. La lectura fallida del flag repite el push entero
      (`R9-263`), `memoryCards` no lanza (`R9-264`), y la mitad del diálogo de migración no se
      cerró (`R9-265`).

- **`R9-258` (S50, `SyncEngine` / comentarios de `R9-212` — P3) — 🐛 cuatro afirmaciones de los
  comentarios nuevos y dos del detalle de la 49 no se sostienen caso por caso.** MEDIDO
  (`S50-sonda.body.txt`, `S50-sonda-borra.body.txt`), salvo lo que se dice.
  - `queueUnread`: se rinde en «la tercera» lectura. Con una escritura durante la relectura de
    `start()`, en la segunda (`RINDE·durante`: `lecturas: 2`, `doc-q` perdida; el control
    `despues`, 3 lecturas, y `doc-q` queda).
  - `queueUnread`: las de disco «ni se cuentan ni se suben». Tampoco las ven `hasQueuedWrite` ni
    `isOwnCopy` (por lectura, sin medir). Solo cuenta si también falla la relectura de `start()`.
  - `queueTouched`: la entrada de disco de un doc marcado «es más vieja que la copia de aquí». Sin
    copia local no hay LWW: la lápida más nueva que R se descarta (`R9-256`, `dos`).
  - `readQueueAgain`: el disco tiene lo del arranque (ninguna escritura tomó la cola). Una
    escritura durante la hidratación la tomó (`R9-254`: `["doc-w"]` en disco tras el arranque).
  - Del detalle de la 49: la tabla dice que `R212` es «el arreglo entero» (deja la asignación de
    `R9-254`), y el coste dice que la entrada descartada es «la que LWW ya perdió en el teléfono»
    (sin copia local, no).
  - **Propuesta:** corregir los cuatro comentarios cuando se arreglen `R9-254` y `R9-256` (los dos
    cambian lo que dicen), y anotar el detalle de la 49 con esta entrada.
  - **✅ ARREGLADO en la sesión 51** (`6d834c5`, solo comentarios). Cada afirmación nueva tiene su
    medición. `queueUnread`: la relectura que se rinde puede ser la segunda (`RINDE·durante`), y
    las de disco tampoco las ven `hasQueuedWrite` ni `isOwnCopy` (`BORRA·dos`). `queueTouched`:
    la entrada no siempre es más vieja, porque sin copia local la lápida se descarta, igual que
    antes de la 49 (`BORRA·dos`, también en `8f59942`). `readQueueAgain`: ya es cierto que nada
    tomó la cola, por `R9-254` (`HIDRATA·dos` con el arreglo). El detalle de la 49 lleva una nota.

- **`R9-259` (S51, `SyncEngine` / guardas — P3) — 🐛 la guarda de `R9-197` (`ownQueued && !local`)
  ya no tiene una prueba que la vea sola: `R9-256` la tapa.** MEDIDO con la pieza `R197local`
  (`_scratch/S51-piezas.cjs.txt`). **Lo abrió `R9-256`.**
  - Sobre el motor de antes (`S49-SyncEngine-R212.ts.txt`), `R197local` tumba la prueba de
    `R9-197`. Sobre el de la 51, sola, 0. Junto con `R256` (corolario 50), vuelve a tumbarla.
  - **No son equivalentes:** la vieja también salta una copia leída MÁS nueva que la lápida en
    cola (y una edición en cola sin copia local). Esa diferencia es el caso de `R9-126`: la
    lápida sube encima de la copia más nueva. Una prueba que la fije congelaría ese daño.
  - **Propuesta:** decidirlo con `R9-126`. Hasta entonces, la guarda se queda con este porqué.
  - **Sesión 52: hay otra diferencia, aparte de `R9-126`, y llega solo por otro hallazgo
    abierto.** Por lectura. La salida de `R9-197` (`ownQueued && !local`) también salta una
    EDICIÓN en cola, y la de `R9-256` solo una lápida. Una edición en cola «sin copia local» se da
    cuando `getLocal` dice nulo con la fila en local: el `getLocal` de `MemoryDeckContext` lee
    `deckRef`, vacío durante la carga (la parte abierta de `R9-133`). Ahí la vieja retiene la
    copia leída, y sin ella entra por LWW (el daño de `R9-133`). La nota de `R9-256` («una edición
    en cola sin copia local no sale de un camino normal») es cierta solo con `getLocal` sano.
    - Las otras dos diferencias no cambian nada. Un `removed` leído con la escritura recién
      descartada (`justDropped`) no llega a la rama de `R9-197` con una lápida: esa rama pide la
      marca retenida, y la guarda de `R9-256` la asienta antes, al enganchar (medido,
      `_scratch/S52-sonda-lapida.body.txt`, `retenido`: tras el enganche, marcas vacías). Y con
      una copia leída borrada, el final es el mismo: local nulo.

- **`R9-260` (S52, `SyncEngine` / cola — P3) — 🐛 dos hidrataciones a la vez: la segunda vuelve a
  meter la entrada vieja de un doc que el usuario ya reeditó, y sube encima.** MEDIDO en el mock
  (`_scratch/S52-sonda-doble.body.txt`, `DOBLE`; `S52-doble-hoy.out.txt`). **Lo abrió `R9-254`**
  (con el motor de `af8a5ae`, `S52-doble-af8a5ae.out.txt`).
  - `start()` → `stop()` → `start()` del mismo uid con la primera lectura de la cola en vuelo:
    `queueHydrated` sigue en `false`, y el segundo `start()` pide otra lectura. Las dos ven el
    mismo disco, porque `persistQueue` no escribe antes de hidratar. La primera unión descarta la
    entrada de disco del doc marcado y vacía `queueTouched`, y la segunda ya no la descarta.
  - **Medido** («viejo» en disco; el usuario reedita «nuevo» con la lectura retenida, y sube y sale
    de la cola): `doble`, `{"lecturas":2,"subidas":["nuevo","viejo"],"nube":"viejo",
"local":"nuevo"}`. El control (`una`, sin `stop`/`start`) da nube «nuevo».
  - **Con el motor de `af8a5ae`:** `una` da «viejo» (el `R9-115` original) y `doble`, «nuevo»: la
    segunda lectura veía el disco que la edición había escrito, y su asignación lo arreglaba de
    casualidad. La 51 cerró `una` y abrió `doble`.
  - **Medido con una lectura que ve el disco de cuando se pidió.** En Android, AsyncStorage corre
    en un `SerialExecutor` (`AsyncStorageModule.java`): una escritura pedida durante una lectura
    lenta va detrás de ella. La puerta de `colaIlegible` lee el disco al abrirse, y con el motor
    viejo daba `una` = «nuevo», un orden que el almacenamiento real no produce. Con el de hoy da
    igual, porque no escribe la cola antes de hidratar.
  - **En `own`:** la segunda unión le suma a cada entrada de disco ya unida su propio reloj. Es
    redundante, y con la lista llena desaloja el sello más viejo. Por lectura, sin medir.
  - **Alcance:** `SyncEngineContext` llama a `start()`/`stop()` según `user`, y su comentario dice
    que `user` pasa por nulo o anónimo durante la restauración de la sesión en el arranque en frío
    (visto el 2026-07-09). Además, hace falta una edición que suba y salga de la cola dentro de
    esa primera lectura, y una entrada de disco del mismo doc. P3.
  - **Arreglo (hipótesis MEDIDA, `_scratch/S52-piezas.cjs.txt`, `H260once`):** una sola lectura
    de hidratación, la pida quien la pida, como `rereadQueue`. `doble` da «nuevo» con una lectura,
    y la suite de `SyncEngine.test.ts` sigue 278/278.
  - **Para medir:** que la puerta de `colaIlegible` lea el disco al pedir (la `colaFoto` de la
    sonda), o un «¿lo abrió?» con el motor viejo vuelve a engañar.
    **✅ ARREGLADO en la sesión 53** (`6b768eb`): una sola lectura de hidratación, la pida quien la
    pida (`queueHydrating`, como `rereadQueue`); es `H260once`. Prueba nueva («R9-260: un stop() y un
    start() del mismo uid…»): sin el arreglo, `lecturas: 2` y nube «viejo»; con él, 1 y «nuevo». La
    puerta de `colaIlegible` devuelve ahora el disco de cuando se pidió: con el motor de `af8a5ae`,
    los dos casos de la prueba de `R9-254` caen (`lenta` antes «pasaba»), como el `R9-115` original.
    Con una sola unión por proceso, los comentarios de `readQueueAgain` y `joinQueue` vuelven a ser
    ciertos (`R9-266`).

- **`R9-261` (S52, `SyncEngine` / cola — P3) — 🐛 una edición hecha durante la PRIMERA lectura de
  la cola (sana) no llega a disco hasta que vuelve: si el proceso muere ahí, tras reiniciar la
  entrada vieja sube encima, o la nueva no sube nunca.** MEDIDO en el mock
  (`_scratch/S52-sonda-muere.body.txt`, `MUERE`; `S52-muere-hoy.out.txt`). **Lo abrió `R9-254`**
  (`S52-muere-af8a5ae.out.txt`).
  - Desde la 51, `persistQueue` no escribe nada antes de hidratar, y la marca de lo escrito
    (`queueTouched`) vive en memoria. Es la ventana de `R9-255`, pero en la primera lectura de
    cada arranque, sin ninguna lectura fallida.
  - **Medido** («q vieja» en disco; con la lectura de la hidratación retenida, el usuario escribe
    «q nueva»; el proceso muere antes de que vuelva): sin red y con red (sube y sale de la cola),
    `{"disco":["doc-q:q vieja"],"nube":"q vieja","local":"q nueva","cola":0}`. El control, con la
    lectura vuelta antes de morir, da nube «q nueva». Con `af8a5ae`, «q nueva» en los tres.
  - **La aceptación de `R9-255` no lo cubre.** El comentario de `queueUnread` dice «la ventana es
    una lectura de almacenamiento local, después de dos que fallaron», y aquí no falló ninguna.
  - P3: la primera lectura va detrás de las demás lecturas de AsyncStorage del arranque (el
    ejecutor es serie), y hace falta escribir y que el proceso muera dentro de esa ventana.
  - **Propuesta:** decidirlo con el mismo argumento que `R9-255`: cerrarla pide guardar en disco
    lo escrito antes de hidratar, en otra clave con sus propios casos. Si se acepta, se escribe en
    `persistQueue`, donde ocurre. Victor delega el diseño técnico de sync.
    **✅ ACEPTADO en la sesión 53** (`3f73e50`), con el argumento de `R9-255`: la ventana es la
    primera lectura de la cola del proceso (una de AsyncStorage, detrás de las del arranque), y
    cerrarla pide otra clave para lo escrito antes, con sus propios casos (ilegible, otra cuenta, la
    unión de las dos). Escrito en `persistQueue`, donde ocurre, y nombrado en `queueUnread`. `MUERE`
    sigue dando lo medido en la 52 (`_scratch/S53-sondas52-hoy.out.txt`). Victor delega el diseño
    técnico de sync.

- **`R9-262` (S52, `SyncEngine` / borrados — P3) — 🐛 la lápida de `R9-256` rechazada del todo, con
  un reinicio entre el primer rechazo y el último: local nulo, y la nube y el otro teléfono con R,
  para siempre.** MEDIDO en el mock (`_scratch/S52-sonda-lapida.body.txt`, `LAPIDA`;
  `S52-lapida-hoy.out.txt`). **Lo abrió `R9-256`** (`S52-lapida-af8a5ae.out.txt`).
  - La guarda de `R9-256` devuelve «atendido»: el doc se asienta y el cursor pasa a R. Si la
    lápida se rechaza, cada reversión llega con ella todavía en cola, y la guarda la deja fuera
    (bien: la lápida vuelve a intentar).
  - **Medido:** `descarta` (el último rechazo en la misma sesión) da la reversión `modified`, R
    entra: local R, nube R. `rechazaTras` (el primero en la sesión, el último en el proceso
    siguiente) da `["added:echo","removed:revert"]`: R ya está bajo el piso, la reversión es un
    `removed`, y la lectura, con la escritura recién descartada (`justDropped`), asienta sin
    aplicar. **Local nulo, nube R.** Con `af8a5ae`, R ya había entrado al enganchar (el daño de
    `R9-256`), y el final era R en los dos.
  - **La entrada de `R9-256` dice el coste al revés para la sesión:** «si la lápida se descarta
    después, lo local queda borrado y la nube con R». En la sesión, R vuelve. Solo con un reinicio
    entre medias queda borrado.
  - P3: hace falta que el servidor rechace la lápida en todos los intentos (se avisa como
    escritura descartada) y un reinicio antes del último.
  - **Arreglo (hipótesis MEDIDA, `H261hold` en `_scratch/S52-piezas.cjs.txt`):** que la guarda
    retenga la copia (`false`, como un doc no aplicado) en vez de asentarla. El enganche siguiente
    la vuelve a traer, y la última reversión es un `modified`: `rechazaTras` da local R, nube R.
    `sana`, `descarta` y `retenido`, igual que hoy, y la suite sigue 278/278. Coste: el piso se
    queda en R mientras la lápida espera, como con cualquier doc no aplicado.
    **✅ ARREGLADO en la sesión 53** (`c633eb8`): la guarda retiene la copia (`false`, como un doc no
    aplicado) en vez de asentarla; es `H261hold`. Prueba nueva («R9-262: la lapida de R9-256
    rechazada…»): `rechazaTras` da local R y nube R; sin el arreglo, local nulo.
  - **El piso mientras la lápida espera:** R queda retenida (`unsettled` con su reloj), y el piso
    del enganche siguiente queda por debajo de R: cada enganche la vuelve a leer, como cualquier doc
    no aplicado. Cuando la lápida sube, su eco asienta el doc y el piso vuelve a avanzar (`sana`:
    nada retenido, R fuera de la query).
  - **Con la guarda de `R9-176` (corolario 50):** `S176cola` sola da 9 caídas (10 en la 51): la
    prueba de `R9-197` ya no cae sin ella, porque esta guarda, ahora reteniendo, da el mismo final.
    `S176cola` + `R256` da 13 (12 en la 51: vuelve esa, más la de `R9-262`). No se perdió ninguna
    guarda.

- **`R9-263` (S52, sync / bulk push — P3) — 🐛 con la lectura del flag fallida, el bulk push entero
  se repite, y el comentario de ese `catch` sigue diciendo que los duplicados son inocuos.**
  MEDIDO en el mock (`_scratch/S52-sonda-flag.body.txt`, `FLAG`; `S52-flag-hoy.out.txt`).
  Anterior a la 51; lo que es de la 51 es la afirmación contraria.
  - `maybeRunInitialBulkPush`: si `getItem(flagKey)` lanza, `only` queda nulo y se suben todas las
    colecciones. El comentario: «duplicate writes are idempotent … the worst case is bandwidth,
    not correctness». `R9-257` mostró que no (`R9-126`), y su propio comentario
    (`BULK_PUSH_RETRY_PREFIX`) dice lo contrario en la misma función. El detalle de la 51 dice
    «nunca se repite el push entero».
  - **Medido** (el push ya hecho; en el segundo arranque, la lectura del flag falla una vez):
    `{"segunda":["test/a"],"lecturasFallidas":1}`. El control sano: `"segunda":[]`.
  - **Por lectura, sin medir:** si el `removeItem` de la lista falla tras un reintento sano, el
    `start()` siguiente vuelve a subir esa colección; si su `setItem` falla, la lista se pierde y
    la colección no sube nunca (`R9-257` otra vez).
  - **Arreglo (hipótesis, sin medir):** con el flag ilegible, no hacer nada esta vez, como con la
    lista. El flag es un valor chico, así que un fallo determinista (la `CursorWindow`) no lo deja
    sin salida. Como mínimo, corregir el comentario.
    **✅ ARREGLADO en la sesión 53** (`c685b63`): con el flag ilegible no se hace nada esta vez, como
    con la lista. El flag es un valor chico (ningún fallo determinista por tamaño), y el `start()`
    siguiente lo lee. El comentario de los «duplicados inocuos» se fue. Prueba nueva («R9-263: con la
    lectura del flag fallida…»): sin el arreglo, `test/a` vuelve a subir.
  - **Lo «por lectura» queda como estaba, a propósito:** cualquier orden de las dos escrituras (flag
    y lista) deja abierto uno de los dos fallos, y juntarlas en un `multiSet` cambia «la colección
    espera a su próxima edición» por «todo vuelve a subir» cuando la escritura falla (`R9-126`). Se
    prefirió no repetir el push.

- **`R9-264` (S52, memoria / sync — P3) — 🐛 el bulk push de `memoryCards` durante la carga en frío
  sube 0 tarjetas y graba el flag `'2'`, y el reintento de `R9-257` no lo ve.** POR LECTURA: es la
  forma de `R9-214`, que se midió con el provider de favoritos.
  - `MemoryDeckContext.tsx:268`: `pullAllLocal` devuelve `Object.values(deckRef.current)`, y
    `deckRef` vale `{}` hasta que `hydrateFromStorage` termina, y para siempre si el JSON no se
    lee (`:185`, «fall through to empty deck»). No lanza, así que el motor no lo anota en
    `@sync_first_push_retry`.
  - Alcance, como `R9-214`: un `start()` con el flag sin `'2'` ni `'skip'` antes de que termine la
    carga, o con la carga fallida. `exportLocalData` (el diálogo de migración) lee lo mismo.
  - **Arreglo (hipótesis):** como `R9-214`, leer el almacenamiento (esperando a la carga) y lanzar
    si falla.
    **✅ ARREGLADO en la sesión 53** (`420c49c`): `pullAllLocal` espera a la carga del mazo
    (`deckLoad`), que deja puesto el ref, y lanza si la lectura del disco falló: el motor anota
    `memoryCards` para el reintento de `R9-257`, y el export la marca como no leída (`R9-265`). Un
    JSON que no se lee cuenta como leído y vacío, como en `parseQueue`: el mazo que se escribe después
    lo reemplaza. Prueba nueva (`__tests__/memoryDeckPullAllLocal.test.tsx`, provider real): sin el
    arreglo, devolvía `[]` durante la carga, y `[]` en vez de lanzar con la carga fallida; la pieza
    `deckRef.current = clean` sola también cae. Al lado, uno que ya existía: `R9-267`.

- **`R9-265` (S52, sync / migración — P3) — 🐛 `exportLocalData` salta el adaptador que falla, y
  con el total en 0 el diálogo de migración no pregunta (`R9-166`); con el reintento de `R9-257`,
  esa colección sube después a la cuenta sin la pregunta.** POR LECTURA, con lo medido en la 50
  (`S50-fav.out.txt`: `"exportados":[]`) y la prueba de `R9-257` (el reintento).
  - Es la mitad de `R9-257` que el cierre de la 51 no menciona: la entrada decía que, con los
    favoritos solos, el total era 0 y la pregunta del dueño anterior no se hacía.
  - `AuthContext.tsx:402-404`: `total === 0` no pregunta, y sigue el bulk push. Antes de la 51
    pasaba igual (subrayados y notas devolvían `[]`). Lo nuevo es el final cuando el bulk push
    también falla: antes no subía nunca, y ahora sube en el `start()` siguiente, sin la pregunta.
  - P3: hace falta un fallo de SQLite justo al iniciar sesión.
  - **Arreglo (hipótesis):** que `exportLocalData` diga qué colecciones no pudo leer, y que el
    diálogo trate «no leída» como «puede haber datos»: preguntar, o no migrar en ese inicio.
    **✅ ARREGLADO en la sesión 53** (`849141b`): `exportLocalData` lista la colección que no pudo leer
    como `unread` (cuenta 0), y las dos preguntas (la del dueño anterior y la de la colisión) se
    hacen igual, con un texto sin número (`migrationBodyUnread`). Pruebas nuevas: en el motor y en
    `AuthContext.test.tsx` (las dos ramas); cada pieza cae sola.
  - **Fuera, a propósito:** si `exportLocalData` entero lanza (el motor real no lo hace), la
    comprobación sigue sin preguntar, como decía el código. Es la familia de la decisión abierta de
    `R9-158` (fallar cerrado o abierto).

- **`R9-266` (S52, `SyncEngine` / comentarios de la 51 — P3) — 🐛 tres afirmaciones nuevas no se
  sostienen caso por caso.**
  - **La guarda de `R9-256`:** «una copia no más nueva que la lápida es una versión que el borrado
    reemplazó (el otro la escribió antes)». «No más nueva» es por reloj. La propia prueba de
    `R9-256` escribe R DESPUÉS del borrado, con un reloj más viejo: es el otro con el reloj
    atrasado (`R9-193`), y el borrado gana por reloj, como en LWW. Lo que hace es lo de LWW; el
    porqué del comentario no.
  - **`hydrateQueue`:** `wrote` mira también `ownDirty`, que antes de la primera hidratación está
    siempre vacío: los sellos son solo de docs en conflicto, que se conocen al enganchar, después
    de hidratar (`DOBLE`, `soloStop`: tras un `stop()` durante la lectura, la tabla de sellos sigue
    vacía). Por lectura; su pieza no podría tumbar nada.
  - **`readQueueAgain` y `joinQueue`:** «el disco tiene lo del arranque» y «una entrada de un doc
    marcado se descarta» son falsos con dos hidrataciones (`R9-260`).
  - **Propuesta:** corregirlos con los arreglos de `R9-260` y `R9-262`, y quitar `ownDirty` de
    `wrote` o decir por qué se queda.
    **✅ ARREGLADO en la sesión 53** (`f3bb0e5`): la guarda de `R9-256` dice que compara por reloj,
    como LWW, y que su propia prueba es el otro con el reloj atrasado; `readQueueAgain` y `joinQueue`
    dicen que hay una sola unión por proceso (`R9-260`); y `hydrateQueue` ya no mira `ownDirty` en
    `wrote` (antes de la primera lectura no puede haber sellos), con el porqué. La suite sigue verde;
    la pieza de `ownDirty` no podía tumbar nada.

- **`R9-267` (S53, memoria — P2) — 🐛 una lectura fallida de `@memory_deck` deja el mazo en `{}`, y
  el efecto de persistencia lo escribe encima: se pierden todas las tarjetas.** POR LECTURA, al
  arreglar `R9-264`.
  - `MemoryDeckContext.tsx`: la carga marca `hydrated` también cuando `getItem` falla (antes y
    después de `R9-264`), y el efecto que persiste cada cambio escribe `JSON.stringify(deck)`, que es
    `{}`.
  - Es la forma de `R9-212` (la cola ilegible escrita desde memoria), en el mazo. Un JSON que no se
    lee es otra cosa: ya está perdido, y lo estaba antes.
  - P2: hace falta un fallo de lectura de AsyncStorage (raro: el mazo cabe de sobra en la
    `CursorWindow` de 2 MB).
  - **Arreglo (hipótesis):** con la lectura fallida, no persistir hasta leer, con una salida (una
    guarda que espera necesita una, `R9-212`): por ejemplo, releer en la primera escritura y
    rendirse si vuelve a fallar.
    **✅ ARREGLADO en la sesión 61** (`d69c529`, sobre `R9-277`). Antes, MEDIDO con el provider real
    (`_scratch/S61-sonda.test.tsx.txt`, `S61-sonda-hoy.out.txt`): una sola lectura fallida dejaba el
    disco en `{}`; una tarjeta agregada después dejaba solo esa, aunque una relectura habría leído; y
    con la recarga del respaldo fallando después de una carga buena (`R9-28`), la edición siguiente
    escribía el mazo de antes encima de lo restaurado. CONTROL: con la lectura sana, nada se pierde.
    - **El arreglo, la hipótesis medida:** el efecto escribe solo cuando una carga leyó el disco.
      Mientras una está en vuelo o falló, lo editado espera (el `unsaved` de `R9-277`). Tras una que
      falló, la primera edición relee y se une a lo leído; sin edición no se escribe nada, y el
      arranque siguiente lee las tarjetas.
    - **La salida (`R9-212`):** si la relectura también falla, se escribe lo de memoria, como
      antes, y se pierden las tarjetas del disco. Una lectura puede fallar siempre, y esperando,
      ninguna edición llegaría al disco. Lo editado espera solo lo que tarda una lectura.
    - **Lo que la medición agregó:** una carga más nueva (la del respaldo) decide en vez de la
      relectura que falla (sin esa guarda, se rendía encima de lo restaurado y soltaba lo editado);
      y una lectura que no adopta nada (sin mazo en disco) renderiza igual, para que el efecto
      escriba lo que esperaba.
    - **Quién más escribe `@memory_deck`** (`grep`): solo el respaldo (`importBackup`, que
      reemplaza el mapa y avisa). Su recarga pasa por la misma carga, así que la cubre lo mismo.
      Lo que queda abierto es otra ventana: `R9-278`.
    - **Coste:** con la lectura fallida, la pantalla muestra el mazo vacío (como antes), y un
      «Reiniciar» en ese estado borra solo lo que se ve: las tarjetas del disco vuelven con la
      relectura. Un `getLocal` lanza mientras no se lee (`R9-133`).
    - **Pruebas: 6**, en `__tests__/memoryDeckDisk.test.tsx`. Cada pieza tumba la suya por la
      consecuencia (`_scratch/S61-rev.cjs.txt`): `retiene` 6, `relee` 5, `rinde` 1, `nueva` 1,
      `fuerza` 1, `marca` 5. `nueva` no caía con la recarga en la misma ronda de microtareas: la
      prueba la entrega en un callback posterior, como el ejecutor serie.

- **`R9-268` (S53, identidad / migración — P3) — 🐛 una cuenta que ya hizo su bulk push en este
  teléfono responde «Migrar» y no se migra nada.** POR LECTURA.
  - La pregunta de la colisión (Sprint 43) se hace con `total > 0`, sin mirar si esa cuenta ya tiene
    el flag `'2'`, y la del dueño anterior igual. Con el flag `'2'`, `maybeRunInitialBulkPush` solo
    mira la lista de reintento: «Migrar» no sube nada, y el texto promete migrar.
  - Es el borde de `R9-38`: otra cuenta recibe los datos locales solo por la migración, y una que
    vuelve no la tiene. Al dueño que vuelve no le afecta: lo suyo editado sin sesión sube igual.
    Repetir el push entero no es el arreglo (`R9-126`).
  - **Arreglo (hipótesis):** no hacerle la pregunta a una cuenta con el flag `'2'` (y decirle que
    los datos locales no se migran), o migrar solo lo que falta en su nube, leyéndola. Es decisión
    de producto.

- **`R9-270` (S54, identidad / `R9-38` — P2) — 🐛 si el marcador del dueño no llegó a disco, lo
  editado sin sesión en el proceso siguiente sube a la nube de la cuenta ANTERIOR.** MEDIDO en el
  mock (`_scratch/S54-sondas.body.txt`, `DUENO`; `S54-sondas-hoy.out.txt`). **Lo abrió `R9-38`**
  (`ea182dc`): con `3f73e50` (`S54-sondas-3f73e50.out.txt`) no se encolaba nada.
  - `@local_store_owner_uid` lo escribe solo `claimLocalStore`, después de
    `signInWithCredential`/`linkWithCredential`, y se traga el fallo. Si no llega (un `setItem` que
    falla, o el proceso que muere entre el inicio de sesión y el claim), queda la cuenta anterior.
    El motor usa en el proceso el dueño que dice `start()`, y en el siguiente, el disco.
  - **Medido:** con el marcador en Ana, Beto entra y cierra sesión; en el proceso siguiente edita
    sin sesión. La edición se encola para Ana, y cuando Ana entra (su dueño en disco: `AuthContext`
    no pregunta) sube a SU nube: `nubeAna.b = "de beto sin sesion"`. En el mismo proceso iba a
    Beto. CONTROL (el claim sano): a Beto, y la nube de Ana nula.
  - Contradice el comentario de `queueWrite` («No other account gets it») y la regla de `R9-38`
    (otra cuenta recibe los datos locales solo tras la pregunta).
  - El fallo al escribir el marcador ya estaba anotado como gemelo de `R9-158` (§8 de
    `CONTINUAR.md`); lo nuevo es lo que le hace `R9-38`: antes solo cambiaba la pregunta.
  - P2: hace falta que falle el `setItem` de un valor chico, o que el proceso muera en esa
    ventana, y después otra cuenta en el teléfono.
  - **Al lado, por lectura:** una cuenta que inició sesión antes de que existiera el marcador
    (`R9-23`) deja el almacén sin dueño, y lo editado sin sesión no se encola (el caso «sin
    dueño»). Con 0 usuarios, solo los teléfonos de prueba.
  - **Arreglo (hipótesis):** reclamar el almacén también al restaurar una sesión de Google (la
    pregunta se hizo antes de entrar) y reintentar el claim fallido; o que el motor guarde el dueño
    que dice `start()`.
    **✅ ARREGLADO en la sesión 55** (`1152965`): `AuthContext` reclama el almacén en cada estado de
    auth con una cuenta de Google (la sesión restaurada ya pasó por la pregunta), y otra vez en
    `signOut` (un claim fallido en el mismo proceso). Cubre también la instalación sin marcador.
    Prueba nueva en `AuthContext.test.tsx`; las dos piezas caen solas (`S55-rev270.cjs.txt`).
    **Queda, a la vista:** en el arranque en frío, una edición sin sesión hecha antes del primer
    `start()` lee el dueño del disco, y si llega antes que el reclamo del estado restaurado va a la
    cuenta anterior (`start()` lo corrige si llega mientras se lee).

- **`R9-271` (S54, `SyncEngine` / `R9-38` — P3) — 🐛 sin sesión, una lectura fallida deja la
  edición sin subir: la del dueño la descarta, y la primera de la cola la deja solo en memoria sin
  que nadie relea.** MEDIDO en el mock (`COLA` y `DUENOFALLA`; `S54-sondas-hoy.out.txt`,
  `S54-duenofalla-hoy.out.txt`). No lo abrió la 53: con `3f73e50` no se encolaba ninguna edición
  sin sesión. Es lo que el arreglo de `R9-38` deja sin cubrir.
  - **La cola:** sin sesión, `queueFor` pide la hidratación; si falla, la entrada vive en memoria.
    Con sesión, `start()` relee en el acto; sin ella, la relectura la pide solo la escritura
    siguiente (`persistQueue`). Medido: `sinSesionFalla` da 1 lectura y el disco sin la edición;
    si el proceso muere, la nube no la recibe nunca. `sinSesionSana` (CONTROL) y `conSesionFalla`
    (2 lecturas) la suben.
  - **El dueño:** `loadStoreOwner` devuelve `null` si su lectura falla, y `enqueue` no encola
    nada (solo avisa de la lectura). También cuando un `start()` del dueño llegó mientras se leía:
    el `catch` no mira `storeOwner`. Medido: la edición queda en local y no sube nunca; la
    siguiente, sí.
  - P3: hace falta un fallo de lectura de AsyncStorage y, en la cola, que el proceso muera antes
    de otra escritura.
  - **Arreglo (hipótesis):** con la hidratación fallida y una escritura esperando, pedir la
    relectura, como `start()`; y en el `catch` de `loadStoreOwner`, devolver el dueño que dijo un
    `start()`, o dejar la escritura en la cadena para la lectura siguiente.
    **✅ ARREGLADO en la sesión 55** (`96f78c4`): sin sesión, la hidratación fallida pide la
    relectura, como `start()` (esa relectura no rinde nada: la rendición de `R9-212` es la de la que
    una escritura espera). La lectura del dueño se intenta otra vez antes de rendirse, y un
    `start()` que dijo el dueño mientras se leía responde por ella; si las dos fallan, la edición no
    se encola y la siguiente vuelve a leer (la salida). Prueba nueva («R9-271: sin sesion, una
    lectura fallida…», cuatro casos); las tres piezas y el motor de `a85df96` caen
    (`S55-rev271.cjs.txt`).

- **`R9-272` (S54, pruebas de `R9-193` — P3) — 🐛 el comentario de las dos pruebas que cambió la
  53 dice que la entrada de L2 «decidiría antes que el sello de L1», y con la pieza A decide el
  sello.** MEDIDO (`_scratch/S54-sondas.body.txt`, `R193`, con las piezas de `S53-rev193` por
  `S54-rev193.cjs.txt`; `S54-r193-A.out.txt` y `S54-r193-B.out.txt`).
  - Con L2 encolada, como la encola hoy la app (tras el `start()`, el dueño se conoce), la pieza A
    (`stop()` no anota la subida en vuelo) sigue mostrando «lo mío contra lo mío». La pieza B
    (`stop()` no escribe los sellos), no: la entrada lleva el sello (`R9-217`, `R9-226`).
  - Las pruebas siguen tumbando sus piezas (A, la segunda; B, las dos). Lo que construyen (L2 fuera
    de la cola tras una sesión, en el mismo proceso) la app no lo produce; sí en un proceso nuevo
    sin dueño (`R9-270`, `R9-271`), con los sellos en disco. Su final (local L2, nube L1, cola
    vacía) es ese caso.
  - **Arreglo:** corregir el comentario: con L2 en cola la pieza A sigue cayendo, y la prueba deja
    L2 fuera para vigilar también la B, que solo se ve sin dueño.
    **✅ ARREGLADO en la sesión 55** (`50f209d`): el comentario dice lo medido. Las piezas de
    `S53-rev193` siguen tumbándolas igual (A, la segunda; B, las dos).

- **`R9-273` (S56, Mesa / `R9-269` — P3) — 🐛 el respaldo escribe la Mesa sin turno: restaurado
  mientras corre una unión, se pierde entero, y la restauración dice que salió bien.** MEDIDO con
  los stores y el `importBackup` reales (`_scratch/S56-prep.test.ts.txt`, `RESPALDO`;
  `S56-prep-hoy.out.txt`). **No lo abrió la 55:** con los 5 archivos de la Mesa de `a64786b` da lo
  mismo (`S56-prep-viejo.out.txt`). Es lo que el arreglo de `R9-269` dejó fuera de su turno.
  - `prepWrite` pone en turno las escrituras de los cuatro stores. `importBackup`
    (`BackupService.ts:1396-1410`) resuelve la clave de la Mesa al empezar y la escribe en su
    `multiSet` final, sin turno. Una unión que leyó antes y escribe después la pisa: escribe lo que
    le quedaba al origen, o lo borra con `multiRemove`.
  - **Medido:** sin sesión, la Mesa «sin cuenta» tiene un pasaje; Ana entra (la unión, con su
    escritura retenida) y mientras tanto se restaura un respaldo con otro pasaje. `restoredSections`
    incluye `prepNotes`, y el pasaje restaurado no está en ninguna de las dos Mesas. CONTROL:
    restaurado antes de la unión, se mueve a la de Ana; después, se queda en la «sin cuenta».
  - Contradice el comentario de la 55 en `prepAccount.ts` («the Mesa's writes and its joins run one
    at a time») y el cierre de la carrera de `R9-269`.
  - **Al lado, por lectura:** la misma ventana entre el respaldo y la escritura de un store (lee,
    el respaldo escribe, y el store escribe encima lo de antes más su cambio). Existe desde que hay
    stores, y el mismo turno la cerraría.
  - P3: hace falta restaurar un respaldo mientras corre una unión (iniciar sesión o borrar la
    cuenta durante la restauración). Por la interfaz no parece alcanzable, como la carrera de
    `R9-269`.
  - **Arreglo (hipótesis):** que la escritura de AsyncStorage de `importBackup` tome un turno de
    `prepAccount` (exportar el turno, como `prepWrite`), con la clave resuelta antes de pedirlo.
    **✅ ARREGLADO en la sesión 57** (`831c7e4`, rama `fix/s57-arreglos-s56`): `prepAccount`
    exporta `prepTurn`, y el `multiSet` final de `importBackup` va dentro, con las claves resueltas
    antes. Dentro solo hay ese `multiSet`: nada espera a un turno. Prueba nueva en
    `__tests__/backupPrepTurn.test.ts` (la unión y la escritura de un store, cada una retenida en
    una puerta, con el `importBackup` real), en un archivo aparte: en `backupServiceImport.test.ts`
    un `spyOn` deja el `multiSet` del mock llamándose a sí mismo. Las dos piezas caen
    (`_scratch/S57-rev.cjs.txt`: `turno` y `r273todo`).
    **⚠️ Sesión 58:** el turno ordena, pero la clave sigue siendo la de cuando se pidió: con la
    cuenta borrada durante la restauración, lo restaurado queda bajo el uid borrado (`R9-275`, P3;
    viene de `R9-59`). Arreglado en la 59 (`37ba5f7`: `prepMultiSet`).

- **`R9-274` (S56, Mesa / `R9-59` — P3) — 🐛 si la unión de `deleteAccount` no llega, la Mesa de la
  cuenta borrada queda para siempre bajo un uid que nadie vuelve a usar.** POR LECTURA, al revisar
  el reclamo durante `deleteAccount` (`R9-270`). No lo abrió la 55: es del orden de `R9-59`
  (`a85df96`).
  - `deleteAccount` (`AuthContext.tsx`) hace `deleteUser`, después `claimLocalStore('(deleted)')` y
    después `releasePrepAccount(uid)`. Si el proceso muere entre `deleteUser` y el final de la unión,
    o la unión falla (`releasePrepAccount` se traga el error y solo avisa), nada la reintenta:
    `@prep_*:<uid>` solo lo lee una sesión de ese uid, y la cuenta ya no existe (volver a entrar con
    el mismo Google da otro uid).
  - Lo que se pierde de vista es la Mesa entera de esa cuenta, que nunca estuvo en la nube: queda en
    el disco, sin nadie que la lea.
  - P3: hace falta que el proceso muera en una ventana de dos escrituras locales tras la llamada de
    red, o un fallo de AsyncStorage.
  - **Arreglo (hipótesis):** anotar en disco el uid que se suelta antes de `deleteUser`, y
    terminar la unión en el arranque siguiente si esa cuenta ya no vuelve (sin usuario de Google
    restaurado, o con otro); y reintentar la unión que falló.
    **✅ ARREGLADO en la sesión 57** (`3be46d3`), con otro momento para la nota: DESPUÉS de
    `deleteUser`, no antes. Antes, el arranque siguiente tendría que adivinar si la cuenta existe, y
    el estado de auth puede pasar por nulo mientras Firebase restaura la sesión: soltaría la Mesa de
    una cuenta viva en la «sin cuenta». `releasePrepAccount` anota la cuenta
    (`@prep_release_pending`), une y borra la nota; el primer estado de auth del proceso siguiente
    termina la que quedó. En `deleteAccount`, la unión va antes del reclamo de `(deleted)`: queda una
    sola escritura local tras `deleteUser` (la nota). Pruebas nuevas en `prepAccount.test.ts` (la
    unión que falla y la que no vuelve; CONTROL: una cuenta que solo cierra sesión conserva su Mesa)
    y en `AuthContext.test.tsx` (el reclamo que no vuelve). Cada pieza cae sola
    (`S57-rev.cjs.txt`: `marca`, `arranque`, `orden` y `r274todo`).
    **⚠️ Sesión 58:** la nota tiene un solo lugar, y otra devolución en el mismo proceso la pisa
    (`R9-276`, P3); y lo que se escribe para la cuenta después de su devolución queda bajo su uid
    (`R9-275`, P3). Ninguno lo abrió la 57. Los dos, arreglados en la 59 (`fb7696f`, `37ba5f7`).

- **`R9-275` (S58, Mesa / `R9-59` — P3) — 🐛 una escritura de la Mesa resuelta para una cuenta que
  se borra mientras espera queda bajo el uid borrado, para siempre; si es el respaldo, dice que
  salió bien.** MEDIDO con los stores, los joins y el `importBackup` reales
  (`_scratch/S58-prep.test.ts.txt`, `RESPALDO` y `STORE`; `S58-prep-hoy.out.txt`,
  `S58-store-hoy.out.txt`). **No lo abrió la 57:** con `prepAccount.ts` y `BackupService.ts` de
  `fb7cc73` da lo mismo (`S58-prep-viejo.out.txt`, `S58-store-viejo.out.txt`). Viene de `R9-59`
  (`a85df96`): la clave es la de la cuenta de cuando se pidió.
  - `importBackup` resuelve la clave de la Mesa (`BackupService.ts:1398`) antes de la transacción
    de SQLite y la escribe al final, en el turno (`R9-273`). Si mientras tanto se borra la cuenta, la
    devolución de `deleteAccount` (`releasePrepAccount`) une la Mesa a la «sin cuenta», borra la clave
    y borra su nota; el respaldo escribe después en `@prep_notes:<uid borrado>`, que nadie vuelve a
    leer. El turno ordena las dos escrituras, pero no cambia la clave.
  - **Medido:** Ana con P en su Mesa; el respaldo (con R) retenido en su parte de SQLite, la
    devolución y el estado nulo, y se abre. `restoredSections` incluye `prepNotes`; la «sin cuenta»
    queda con P, y R bajo `@prep_notes:ana`, también tras reiniciar (sin nota). CONTROL: restaurado
    antes del borrado, la devolución lleva R a la «sin cuenta»; y la puerta retuvo (`sqliteRetenida:
1`, el respaldo no había terminado).
  - Lo mismo con la escritura de un store pedida con la sesión de Ana mientras corre la devolución
    (antes del estado nulo): queda bajo su uid. CONTROL: pedida y terminada antes, se devuelve.
  - P3: hace falta empezar una restauración (selector de archivo y confirmación) mientras corre el
    borrado de la cuenta, o una escritura de la Mesa en la ventana entre `deleteUser` y el estado
    nulo. Borrar la cuenta solo deshabilita su botón: la restauración sigue al alcance en la misma
    pantalla (`settings.tsx`).
  - **Arreglo (hipótesis):** que la escritura de una clave de la Mesa, ya en su turno, mire si la
    cuenta de esa clave se devolvió (en este proceso, o con la nota de `R9-274` en disco), y en ese
    caso la lleve a la «sin cuenta» con la misma unión de la devolución, después de escribir. Lo
    mismo para el respaldo y para los stores.
    **✅ ARREGLADO en la sesión 59** (`37ba5f7`, rama `fix/s59-arreglos-s58`), con la hipótesis
    corregida para los stores: unir después borraba secciones (la escritura de un store, sobre la
    clave ya borrada, deja una entrada con una sola sección y el reloj más nuevo, que gana la unión).
    `prepAccount` recuerda en memoria las cuentas devueltas en el proceso (`givenBack`; ningún
    proceso posterior entra como una cuenta borrada). En su turno, la escritura de un store para una
    de ellas va a la «sin cuenta», donde fueron sus entradas; el respaldo (`prepMultiSet`, que
    reemplaza a `prepTurn`) se escribe igual y se devuelve después, con la cuenta anotada antes: no se
    redirige, porque reemplaza la Mesa y borraría lo devuelto. Con la devolución sin terminar, lo
    escrito va a la clave de la cuenta, y la nota lo devuelve. Pruebas nuevas en
    `backupPrepTurn.test.ts` (el respaldo retenido en SQLite mientras se borra la cuenta, y el
    proceso que muere en su devolución) y en `prepAccount.test.ts` (dos escrituras de un store detrás
    de la unión retenida). Caen `desvio`, `respaldo`, `anotaRespaldo` y `r275todo`
    (`_scratch/S59-rev.cjs.txt`); `mismoTurno` no cae (ver el detalle de la 59).

- **`R9-276` (S58, Mesa / `R9-274` — P3) — 🐛 la nota de la devolución tiene un solo lugar: otra
  devolución en el mismo proceso la pisa, y la Mesa de la primera cuenta se queda bajo su uid.**
  MEDIDO (`S58-prep.test.ts.txt`, `FALLA`, `pisada`). **No lo abrió la 57:** antes no había nota, y
  esa Mesa no se devolvía nunca (`S58-prep-viejo.out.txt`).
  - `releasePrepAccount(uid)` escribe `@prep_release_pending` = uid. Si la unión de `d` falla, la
    nota dice `d` hasta el arranque siguiente; si antes entra `e` y borra su cuenta, la nota pasa a
    `e`, su unión termina y la borra. Nadie vuelve a leer `@prep_notes:d`.
  - **Medido:** la unión de `d` falla una vez (la nota queda en `d`, el control); `e` entra y se
    borra; en el arranque siguiente, `@prep_notes:d` sigue ahí. CONTROL: sin la segunda cuenta, el
    arranque la devuelve.
  - Contradice el comentario de `releasePrepAccount` («finished at the next start if it does not
    finish here (the join fails, …)») y el del encabezado de `prepAccount.ts`.
  - P3: hace falta que la unión falle (un fallo de AsyncStorage) y que, en el mismo proceso, otra
    cuenta entre y se borre.
  - **Arreglo (hipótesis):** una nota por cuenta (`@prep_release_pending:<uid>`, o una lista en la
    misma clave), y que `finishRelease` las termine todas; o que `releasePrepAccount` termine primero
    la que encuentra anotada.
    **✅ ARREGLADO en la sesión 59** (`fb7696f`): la nota guarda una lista; sus lecturas y escrituras
    van de a una en su propio turno (no en el de la Mesa, para no agrandar la ventana tras
    `deleteUser`), y `finishRelease` devuelve cada cuenta por su lado. La nota de antes (un uid) se
    sigue leyendo. Prueba nueva en `prepAccount.test.ts` (dos cuentas borradas en el mismo proceso,
    con una o las dos uniones fallando, y la nota antigua). Caen `lista`, `todas`, `quita`,
    `antigua` y `r276todo` (`_scratch/S59-rev.cjs.txt`).

- **`R9-277` (S61, memoria — P3) — 🐛 la carga del mazo reemplaza lo que se escribió mientras estaba
  en vuelo.** MEDIDO con el provider real (`_scratch/S61-sonda.test.tsx.txt`, `AGREGA_CARGA`,
  `FRIO`). Ya existía.
  - `hydrateFromStorage` hacía `setDeck(clean)` con lo leído. Una tarjeta agregada durante la carga
    del montaje desaparecía de la pantalla y del disco. CONTROL: agregada después, queda.
  - Pasa lo mismo con una copia remota más nueva aplicada durante la carga en frío (5000 → 1000, y el
    cursor ya la pasó), y con lo editado durante la recarga del respaldo (`R9-28`).
  - P3: la carga dura una lectura de AsyncStorage al arrancar, o al restaurar.
  - **✅ ARREGLADO en la sesión 61** (`6d87069`): `edit` anota cada cambio mientras hay una carga sin
    terminar (`unsaved`), y la lectura lo pone encima de lo leído. Lo suelta la última carga en
    vuelo, así que lo editado ANTES de una carga no vuelve sobre lo que lee (el respaldo reemplaza el
    mazo), y con dos cargas en vuelo queda lo editado entre la primera y la segunda. La copia remota
    ya no puede caer durante la carga en frío: `getLocal` la espera (`R9-133`).
  - **Pruebas: 3**, en `__tests__/memoryDeckDisk.test.tsx`. `encima` tumba 2, `suelta` 1 (2 con
    `R9-267` encima) y `ultima` 1. La de «lo editado antes no vuelve» pasa también sin el arreglo: es
    la que vigila `suelta`.

- **`R9-278` (S61, memoria / respaldo — P3) — 🐛 una edición del mazo mientras el `multiSet` del
  respaldo está en vuelo escribe el mazo de antes detrás de él, y la recarga lo lee.** POR
  LECTURA. Ya existía: es lo que queda de `R9-28`.
  - `importBackup` escribe `@memory_deck` con el `multiSet` de las claves de AsyncStorage
    (`await prepMultiSet(pairs)`); de ahí al aviso (`emitBackupRestored`) no hay otro `await`.
  - Una edición (o una copia remota aplicada) mientras ese `multiSet` está en vuelo encuentra el mazo
    leído, sin carga en vuelo (`unsaved` nulo), y el efecto pide su `setItem`. En el ejecutor serie de AsyncStorage va
    detrás del `multiSet`. La recarga del aviso lee entonces el mazo de antes con la edición, y lo
    restaurado se pierde sin aviso.
  - La ventana es lo que tarda el `multiSet`, y desde Ajustes no se puede repasar al mismo tiempo: lo
    alcanzable es una copia remota de `memoryCards` que llega justo entonces. Los otros tres
    providers que escuchan la señal (los dos de progreso y las preferencias) tienen la misma forma,
    sin mirar.
  - **Arreglo (hipótesis, sin medir):** un aviso ANTES de escribir, para que el provider retenga sus
    escrituras (el `unsaved` de `R9-277`) hasta la recarga.

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
  **✅ Sesión 34: la parte de FAVORITOS, ARREGLADA con `R9-210`** (`682f852`). `getLocal` lee la
  fila de SQLite (esperando a `initialize()`), así que ya no depende de la carga:
  - la carga en frío, medida, con prueba («R9-133: en la carga en frio…»);
  - la carga fallida, por lectura.

  Siguen abiertos `MemoryDeckContext` y el bulk push de favoritos (`R9-214`).
  **⚠️ Sesión 23, otra ventana de la misma raíz (medida, agente 2):** `favoritesRef`
  (`FavoritesContext.tsx:143-147`) va por detrás de SQLite después de CADA edición, hasta el
  render siguiente. Si un apply remoto del mismo favorito cae en ese hueco, la edición más nueva
  del usuario se pierde en SQLite, en pantalla y en la cola, y se salta la UI de conflictos. El
  control con el remoto después del render da `conflicts=1`. `R9-102` no lo empeoró: con el código
  viejo, la misma sonda encola 0.
  **✅ Sesión 61: la parte del MAZO, ARREGLADA** (`57cab83`). Antes, MEDIDO con el provider real y un
  `motor` que hace lo de `applyRemoteChange` con `memoryCards` (sin campos materiales, así que solo
  LWW; `_scratch/S61-sonda.test.tsx.txt`):
  - **La carga en frío:** `getLocal` decía `null` durante la carga. Si el paso de aplicar caía después
    de ella, una copia de 500 reemplazaba la tarjeta de 1000 (en pantalla y en disco). Si caía antes,
    la carga reemplazaba el mazo y se perdía la copia remota MÁS NUEVA (`R9-277`).
  - **La carga fallida:** `null` para siempre. La copia vieja entraba, y el efecto escribía un mazo de
    una tarjeta (`R9-267`).
  - **La ventana de la sesión 23 también estaba en el mazo, por el mismo mecanismo** (el ref seguía a
    `deck` después del render). Una copia remota más nueva que la tarjeta y más vieja que el repaso,
    llegada antes del render siguiente, borraba el repaso en pantalla y en disco (`reviewCount` 0).
    CONTROL: después del render, `getLocal` leía el repaso.
  - **El arreglo:** `getLocal` espera a la carga (`deckLoad`, de `R9-264`) y lanza si no leyó el
    disco, como `R9-46`. El motor salta el doc, y su cursor queda detrás. Toda escritura pasa por
    `edit`, que pone el ref antes de que React renderice, y el efecto que lo copiaba ya no existe.
    No se lee el disco en `getLocal` (el modelo de `R9-210`): el efecto lo escribe después del
    render, así que el disco va tan atrás como iba el ref.
  - **Pruebas: 3**, en `__tests__/memoryDeckDisk.test.tsx`. `espera` tumba 2 y `ref` 1.
  - Las pruebas de `R9-264` y `R9-28` siguen verdes con cada arreglo. Sigue abierto el bulk push de
    favoritos (`R9-214`).

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

  **⚠️ Sesión 50:** desde `R9-212`, la hidratación también pisa la memoria cuando la lectura falla
  (`R9-254`, medido). «Hidratar antes de aceptar escrituras» cerraría las dos.

  **✅ ARREGLADO en la sesión 51** (`e97cd95`, con `R9-254`): la hidratación une lo escrito
  durante su lectura (la más nueva gana, con los relojes de la vieja), y la cola no se escribe
  antes de hidratarla. El caso medido (X «viejo» en disco, reeditado a «nuevo» durante la
  hidratación) es una prueba: sube solo «nuevo», con la lectura que vuelve antes y después del
  ack. El pariente (la escritura que desaparecía de la cola) lo cubre la prueba de las tres formas.

  **⚠️ Sesión 52:** con dos hidrataciones a la vez, el caso vuelve (`R9-260`): la segunda unión
  mete otra vez la entrada vieja.

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
     **⚠️ Sesión 23: este punto sube a P2.** No es solo la clave persistida: envenena también el
     caché de cursores EN MEMORIA, y con él el PRIMER enganche de Beto. Su piso sale en
     `cursorDeAna − 5 min` en vez de 0, y un doc de Beto de hace 1 hora no baja nunca
     (`betoViejoAplicado:false`): en un teléfono nuevo para Beto, su historial anterior no llega.
     Es el mismo agujero que `R9-153` (`handleSnapshot` sin sesión), y el mismo arreglo los cierra.
     **✅ Sesión 24:** el punto 4 quedó ARREGLADO junto con `R9-153` (`a7d688e`). `advanceCursor` es
     síncrono hasta su `setItem`, así que no queda ventana.

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
  **⚠️ Sesión 22:** la pieza «no se pudo LEER» no tiene prueba (`R9-149`).

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
  **⚠️ Sesión 22:** reabierto por la ida y vuelta A → B → A (`R9-150`).

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

- **`R9-53` (⬇️ de P1 en la sesión 22; A10, respaldo) — 🐛 restaurar un respaldo rompe la invariante de disyunción del
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
  **⬇️ Sesión 22: baja a P2** (sonda con la cadena real). Los CONTEOS se duplican (10 → 20 → 30), pero la pantalla (`insights.tsx:181-207`) solo muestra PORCENTAJES, y duplicar el mismo conjunto no los mueve. El porcentaje solo se tuerce cuando el respaldo y la nube difieren: 50 % → 33 % → 25 % en la sonda. No hay pérdida de datos. La línea del import es hoy `BackupService.ts:1500-1523`. Cablear `resetDeck` no sería la vía de escape (ver `R9-61`).

- **`R9-55` (⬇️ de P1 en la sesión 22; A11, planes) — 🐛 editar un plan propio a menos días arrastra números de día que
  ya no existen: la pantalla muestra 250%.** Severidad **media**. `migratePlanProgress`
  (`ReadingPlanProgressContext.tsx:259-272`) copia `completedDays` **verbatim, sin recortar al
  `duration` nuevo**, y `plan/[id].tsx:279` calcula
  `Math.round((completed / effectiveDuration) * 100)` sobre el `length` crudo. **`planPace` sí
  filtra** (`planPace.ts:88-90`) y devuelve 100%: las dos cifras se contradicen en la misma
  pantalla y **se pinta la mala**, que además alimenta el ancho de la barra (`width: '250%'`).
  **Repro (sonda):** 5 días completados, plan editado a 2 → `250%` en pantalla vs `100%` en
  `planPace`. Detalle: `detail/A11-progreso-rachas.md`.
  **⬇️ Sesión 22: baja a P2** (sonda: `5/2 · 250%`). Es solo presentación: no se pierde nada, y `planPace` y el «completado» siguen bien. La barra NO se desborda, porque `progressTrack` tiene `overflow: 'hidden'` (`app/(tabs)/plan/[id].tsx:1030-1036`); lo que está mal es el texto. Falta una superficie: la tarjeta de Inicio (`ReadingPlanCard.tsx:127`, `:248`) también pinta `5/2`. `migratePlanProgress` está hoy en `:270-283`.

- **`R9-56` (A8, notas) — 🐛 la pestaña Notas muestra la referencia en el idioma de la versión
  activa y el versículo congelado en el idioma de cuando se creó la nota.** Severidad **baja**.
  `notes.tsx:276` usa `localizeBook(item.book)`, que sigue a `selectedVersion.language` a
  propósito (`:270-273`), pero `item.text` es el `verse_text` congelado al crear la nota y
  `updateNote` solo toca `note`/`updated_at` (`database/index.ts:2107-2115`). Crear notas en
  RVR1960 y pasar a KJV muestra **"John 3:16"** sobre **"Porque de tal manera amó Dios al
  mundo…"**, también en la imagen para compartir (`:435`), que es contenido público.
  `HighlightsScreen` **sí** re-resuelve contra la versión activa (`highlights.tsx:96-101`) —
  la asimetría confirma que es un olvido. Detalle: `detail/A8-notas-subrayados.md`.
  **⚠️ Sesión 22 (sonda de render): se sostiene en P2, con una corrección.** La propuesta de arreglo («re-resolver como Resaltados») rompe las notas de VARIOS versículos. La acción «nota» sobre una selección (`[chapter].tsx:1740-1757`) guarda en `verse_text` el texto unido con la clave del primer versículo, y el rango no se guarda en ningún otro lado: re-resolver mostraría solo el primero. Las líneas `:270-273` y `:435` eran incorrectas desde el origen; son `:106-108` y `:356-357`.
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
  **⚠️ Sesión 22 (lectura): se sostiene en P2.** El `useBackHandlerStep` del lector solo consume el atrás después de un salto por referencia (`:1288-1289`), y en Android el atrás llega al `Modal` como `onRequestClose`. Lo esperable es que gane el `Modal`, pero sigue sin verificarse en dispositivo.
- **`R9-58` (A9, Mesa) — 🐛 matar la app (o cerrar la pestaña en web) pierde hasta 700 ms de
  tecleo: `use-debounce` expone `flushOnExit` y no se usa.** Severidad **baja**.
  `prep/index.tsx:1024-1042`. **El resto de los caminos de salida están bien** y se auditaron
  uno por uno (desmontar, blur, púlpito, ilustraciones, historial, series, cambio de pasaje):
  todos persisten, y el `flush()` de `:1042` **funciona** —confirmado desminificando
  `use-debounce@10.1.1` y con sonda—. Lo único descubierto es el proceso que muere (swipe-away,
  OOM, cierre de pestaña). Detalle: `detail/A9-mesa-persistencia.md`.
  **❌ Corrección de la sesión 22: el remedio que sugiere la entrada NO cierra el bug en el teléfono** (medido). `flushOnExit` de `use-debounce` 10.1.1 hace dos cosas: un `flush()` al desmontar, que la Mesa ya hace a mano, y un listener de `document.visibilitychange`. **En React Native no hay `document`**, así que ese listener nunca se engancha; la sonda da `{"hadDocument":false,"appStateListenersRegisteredByHook":0}`. Solo arregla la mitad web. En nativo hace falta un listener de `AppState` → `'background'` que llame a `flush()`. Además, «púlpito, ilustraciones… todos persisten» es cierto, pero esos dos caminos conservan las trampas de `R9-47`: ver `R9-143`.
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
  **⚠️ Sesión 22 (lectura): se sostiene en P2, y la decisión sigue siendo de Victor.** Las opciones son (a) borrar `@prep_*` al cerrar sesión, (b) ponerle uid a las claves, o (c) dejarlo como está y corregir la frase. Lo único claramente mal hoy es el comentario: `prepNotes.ts:14` dice que el estudio sin terminar es «theirs alone», y en un teléfono compartido no lo es. Además, «sin fuga hacia afuera» no es exacto: un respaldo exportado por Beto lleva el `@prep_notes` y el `@prep_series` de Ana. `R9-24` sigue siendo cierto.
  **✅ DECIDIDO por Victor el 2026-10-03 (tras la sesión 51): la opción (b).** La Mesa se guarda por cuenta, y cerrar sesión no borra nada. Progreso y logros siguen por aparato. El cómo (los datos sin dueño de antes, el respaldo exportado) está delegado: ver la §7 de `CONTINUAR.md`. Queda por arreglar.
  **✅ ARREGLADO en la sesión 53** (`a85df96`, rama `fix/s53-r59-r38`), en
  `src/features/study/prepAccount.ts`. **El cómo, decidido y escrito ahí:**
  - Las cuatro claves llevan el uid de la cuenta de Google abierta (`@prep_notes:<uid>`); sin cuenta
    (anónimo o sin usuario), la clave de siempre: la Mesa «sin cuenta». Un uid anónimo no es una
    cuenta: cambia en cada cierre de sesión.
  - La Mesa de antes va UNA vez al dueño del almacén, o a la cuenta abierta si no hay dueño
    registrado; sin ninguno, queda como la «sin cuenta».
  - Al iniciar sesión sin rechazar la migración, la «sin cuenta» se une a la de la cuenta (en la
    misma entrada gana la de la cuenta); rechazada, se queda. Al borrar la cuenta, su Mesa vuelve a
    la «sin cuenta» (nunca estuvo en la nube).
  - El respaldo exporta y restaura la Mesa de la cuenta abierta: el de Beto ya no lleva la de Ana.
  - Las claves esperan al primer estado de auth (`AuthProvider` lo dice al montar), y una escritura
    va a la cuenta de cuando se pidió. Se corrigió la frase de `prepNotes.ts` («theirs alone»).
  - Pruebas nuevas: `__tests__/prepAccount.test.ts` (8, stores reales), 4 en `AuthContext.test.tsx`
    y 1 en `backupDegradedSections.test.ts`. Cada pieza cae sola (`_scratch/S53-rev59.cjs.txt`).
    Progreso y logros siguen por aparato.
  - **⚠️ Sesión 54:** la unión borra la entrada que pierde, en el mismo pasaje: `R9-269` (P1).
  - **⚠️ Sesión 56:** el respaldo, fuera del turno de la Mesa (`R9-273`, P3); y si la unión de
    `deleteAccount` no llega, la Mesa queda bajo el uid borrado (`R9-274`, P3). Los dos,
    arreglados en la 57 (`831c7e4`, `3be46d3`).
  - **⚠️ Sesión 58:** lo que se escribe para la cuenta después de su devolución (el respaldo, un
    store) queda bajo el uid borrado (`R9-275`, P3); y la nota de `R9-274` tiene un solo lugar
    (`R9-276`, P3). Los dos, arreglados en la 59 (`37ba5f7`, `fb7696f`).
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
  **❌ Corrección de la sesión 22 (sonda): no se re-celebran «todos» los hitos, solo el más alto.** `pendingMilestone` devuelve el mayor no celebrado, y `milestoneKeysToMark` marca los inferiores a la vez: tras restaurar con racha 156 sale `["streak:100", …]`. Lo demás se sostiene. Sigue en P2.
- **`R9-61` (A10, recuperación) — 🐛 `resetDeck` está en la API pública del contexto y no tiene
  ni un solo llamador: no hay forma de que el usuario borre sus datos de memoria.** Severidad
  **baja**. Declarado, documentado (_"handy for 'Reset' affordance"_), implementado
  (`MemoryDeckContext.tsx:88`, `:339-348`) y duplicado como no-op en el stub web (`:74-76`);
  `grep -rn "resetDeck" app/ src/` fuera del contexto → **cero**. **Sube la severidad efectiva
  de `R9-48` y `R9-53`**: un usuario con estadísticas contaminadas o duplicadas no tiene
  ninguna acción en la app para limpiar. O se cablea a Ajustes, o se quita de la interfaz para
  que no aparente una vía de escape que no existe. Detalle: `detail/A10-memoria-srs.md`.
  **❌ Corrección de la sesión 22: cablear `resetDeck` a Ajustes NO sería la vía de escape.** Solo vacía el mazo y encola borrados de `memoryCards`. No toca `review_events`, ni `@memory_stats_floor`, ni `memoryStats/summary`, que es donde vive `R9-53`, así que hace falta otra función. `R9-48` ya está arreglado, y las tarjetas sí se pueden borrar una por una. Sigue en P2.
- **`R9-62` (A10, hitos) — 🐛 el recorte FIFO de hitos celebrados expulsa las claves de racha y
  le re-celebra al usuario «¡3 días!» cuando lleva 156.** Severidad **baja**.
  `goalStore.ts:66-80` recorta con `merged.slice(-MAX_CELEBRATED)` y `MAX_CELEBRATED = 60`; el
  recorte quita **las más antiguas**, que son siempre las `streak:*`, porque las
  `goal:YYYY-MM-DD` se añaden al final una por día. El comentario de `:63-64` afirma que es
  seguro _"porque una clave de racha solo re-dispara cuando la racha realmente se reconstruye"_:
  **es falso**. **Repro (sonda):** cascada de 6 días seguidos —`streak:3`, `7`, `14`, `30`,
  `60`, `100`— con la racha real en 156-161. Cosmético, pero trivializa el mecanismo de
  retención. Detalle: `detail/A10-memoria-srs.md`.
  **⚠️ Sesión 22 (sonda): es peor de lo escrito, y sigue en P2.** Simulando desde el día 1 a un usuario que cumple la meta todos los días, el primer «¡3 días!» repetido llega a los 59 días de racha y se repite cada ~55 días: 15 re-celebraciones en 200 días. La cascada que describe la entrada es la de su fixture, que arranca con los 6 hitos ya marcados.
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
  **⬇️ Sesión 22: baja a P3** (sonda con `TZ` fijado desde PowerShell). Solo falla si la tarjeta se abre en la última hora del día (23:00-23:59) durante ~6 días después del atraso de hora, o en la primera (00:00-00:59) después del adelanto: 12 medias horas de 674. «El sábado desaparece» es FALSO: se pierde el día más viejo y el domingo sale dos veces. `listeningStats` usa un `Set` y no cuenta doble. **Ni local (`America/Mexico_City`) ni CI (UTC) tienen cambio de hora.** Vecino: `R9-147`.
- **`R9-64` (A11, planes) — 🐛 `migratePlanProgress` BORRA el progreso de origen cuando el
  destino ya tiene el suyo, en vez de fusionarlo.** Severidad **baja**.
  `ReadingPlanProgressContext.tsx:264-268`: `if (!next[toId]) next[toId] = current;` protege el
  destino, pero `delete next[fromId];` se ejecuta **incondicionalmente**, así que cuando la
  rama protectora se activa el progreso de origen se destruye sin ir a ningún lado. Alcanzable
  al editar un plan propio hasta que su id derivado del contenido colapse con el de otro.
  **Repro (sonda):** tras migrar, `getCompletedDays(BIG.id)` → `[]`. Detalle:
  `detail/A11-progreso-rachas.md`.
  **⚠️ Sesión 22 (sonda): se sostiene en P2.** El progreso de origen también desaparece de AsyncStorage. Hay una segunda vía: el id de un plan BORRADO, cuyo progreso sobrevive (`R9-146`).

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
