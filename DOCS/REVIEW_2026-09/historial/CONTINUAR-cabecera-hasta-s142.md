# Historial — `CONTINUAR.md`: la cabecera de cada sesión, hasta la 142

> Movido tal cual desde `CONTINUAR.md` en la sesión 143 (2026-11-12). **No rige: es registro.** Lo que rige está en
> `CONTINUAR.md`, `REGLAS.md`, `RECETAS.md` y `ESTADO.tsv`.

> **Última actualización: 2026-11-12, fin de la sesión 142.** La 142 fue la CONCILIACIÓN de los hallazgos viejos
> (solo docs, sin agentes ni emulador, Fable 5.2 como principal; no se arregló nada). Las 157 entradas de
> `R9-1`..`R9-409` sin marca de cierre entera se miraron contra el código de `a0147da0` y contra git: **113 siguen
> abiertas (20 P1, 47 P2, 45 P3 y el aviso `R9-1`)**, 2 piden emulador (`R9-177`, `R9-240`) y 42 estaban cerradas
> (34 arregladas y 8 aceptadas: se les agregó la marca en `BUGS.md`). Con las 161 de `R9-410` en adelante, **hay 274
> abiertos de 573: ningún P0, 20 P1 (todos viejos; cuatro de dinero: `R9-16`..`R9-19`), 92 P2 y 161 P3.** El estado
> por hallazgo ya es legible por máquina: `ESTADO.tsv`, con su validador
> (`_scratch/S142-validar-estado.cjs.txt`). «No hay ningún P0 ni P1 abierto», más abajo, valía solo para `R9-410`
> en adelante. La rama `docs/review-s142-conciliacion` (solo docs) se mergea con el OK de Victor (si ya se mergeó,
> `main` la incluye); `npm run validate`, verde, 377/4709 (`_scratch/S142-validate.out.txt`). Lo
> siguiente, en el orden aprobado por Victor el 2026-11-11: la 143, una sesión de solo docs para adelgazar
> `INDEX.md`, `CONTINUAR.md` y la memoria (`_scratch/S143-PROMPT.md`); después, los arreglos
> (`_scratch/S14X-PROMPT-arreglos.md`). Detalle: `detail/S142-conciliacion.md`.
>
> **Antes, al fin de la sesión 141 (2026-11-11):** La 141 revisó el diff de la 140 (`02ee73e..e8700067`,
> los tres P1), en un chat nuevo, en la terminal, **sin agentes**, con **Fable 5.2 como modelo principal**, con un
> emulador de solo lectura, jest y lectura. Los tres arreglos se sostienen en lo que arreglan: `R9-424` EN VIVO (KJV
> y RV1909 sobreviven a dos fríos; sin la guarda, WEB; las siete pantallas, en la misma versión) y `R9-425` EN VIVO
> (el Salmo 117 con «al final del capítulo» para; sin temporizador pasa al 118) y con nueve vecinos en jest. Cuatro
> hallazgos nuevos, todos P3: `R9-570` (una **regresión** del arreglo de `R9-424`: con el pack elegido ausente, cada
> frío reprograma dos veces a la vez los recordatorios del versículo del día y quedan 26 alarmas, 13 con el cuerpo
> genérico), `R9-571` (la ✕ del reproductor no lo pliega: `stop()` pisa el plegado de `hidePlayer`; por eso el estado
> roto de `R9-427` **no se alcanza en vivo**, ni antes ni después del arreglo), `R9-572` (la prueba de `R9-427` usa
> un `hidePlayer` simulado que hace lo que el real no hace) y `R9-573` («al final del libro» sobre una lista no
> vence; ya existía). `R9-569` quedó **refutado en su consecuencia** (la lectura parcial es real y no daña:
> `installedVersions` devuelve siempre las empaquetadas). No hay ningún P0 ni P1 abierto **de `R9-410` en adelante**
> (corregido en la 142: hay 20 P1 viejos abiertos). Hay 573 hallazgos. La 141 está **mergeada y pusheada** (`main` =
> `origin/main` = `a0147da0`, CI verde en el log, run `43080364617`, 377/4709; corregido en la 142: aquí decía «sin
> mergear»). La 140 ya estaba mergeada y pusheada (`177029af`, run `43070499798`, 3 jobs, 377/4709; sus dos ramas,
> borradas tras `git cherry`). Lo siguiente no fueron los arreglos (corregido en la 142): Victor aprobó el
> 2026-11-11 que la 142 fuera la conciliación. Detalle: `detail/S141-revision-del-diff-s140.md`.
>
> **Antes, al fin de la sesión 140 (2026-11-11):** La 140 fue la PRIMERA de la fase de ARREGLOS, en un chat
> nuevo, en la terminal, **sin agentes**, con **Fable 5.2 como modelo principal** (decisión de Victor del 2026-11-11,
> §7). Hizo la tanda 1, los tres P1 abiertos, un commit por hallazgo en `fix/s140-p1`, cada uno con su prueba de
> regresión vista FALLAR sin el arreglo: `R9-424` (`7d4a511f`: la red de seguridad de `useBibleVersion` espera la
> primera respuesta de la base, y la versión descargada elegida sobrevive al frío), `R9-425` (`a6a0ef13`: el motor
> honra el temporizador «al final del capítulo» y no sube la señal de fin de capítulo) y `R9-427` (`e8700067`:
> `expandProgress` sigue a `isExpanded`, y el reproductor cerrado con la ✕ vuelve plegado). `R9-558` no comparte la
> raíz con `R9-424` y espera su tanda. Un nuevo por lectura, `R9-569` (P3: el registro de versiones se lee una sola
> vez, a la par de la recarga de arranque). No queda ningún P0 ni P1 abierto. Hay 569 hallazgos. Sin verificación en
> vivo: va en la 141, que revisa este diff (`_scratch/S141-PROMPT.md`). Las ramas `fix/s140-p1` y
> `docs/review-s140-fix` (apilada sobre la primera) se mergearon y pushearon con el OK de Victor (corregido en la
> 141: decía «sin mergear»). La 139 ya está
> mergeada y pusheada (`main` = `origin/main` = `02ee73e`, CI verde en el log, run `43045636372`, 374/4693; corregido
> en la 140). Las tandas siguientes, propuestas en la §4.
>
> **Antes, al fin de la sesión 139 (2026-11-11):** La 139 siguió el (dl), las filas C P1 de datos y núcleo
> con emulador, en un chat nuevo, en la terminal, **sin agentes**, Opus 5.5 con el asesor Fable 5.2, un emulador de
> solo lectura. Cerró `C42b` 🐛 (`R9-564` P3: tocar un chip de referencia vuelve a guardar la nota sin cambios y la
> sube en «Recientes»; `R9-565` P3: con la hoja de nota abierta, un enlace a otro libro deja una cabecera mezclada),
> `C43b` 🐛 (`R9-566` P3: las muestras del filtro de color de la galería no tienen nombre para el lector de pantalla;
> `R9-567` P3: con un versículo seleccionado, el atrás sale del lector), `C20b` 🐛 (`R9-568` P2: los buscadores de
> libros de la pestaña Biblia y de Memoria no encuentran 17 libros escritos sin tilde; «1 capítulos» suma a
> `R9-524`) y `C7` ✅. De paso, las dos observaciones de `C42a`: el chip tras un número, descartado (regla deliberada);
> el re-guardado, `R9-564`. Ninguno P0. Hay 568 hallazgos. Quedan `C17` y `C23` (PENDIENTE, sin empezar). La rama
> `docs/review-s139-c-p1` (solo docs) va **sin mergear hasta el OK de Victor**. **Lo siguiente lo decide Victor**
> (§4): el mensaje recomendado está en `_scratch/S140-PROMPT.md`. La 138 ya está mergeada y pusheada (`main` =
> `origin/main` = `dd3568f`, CI verde en el log, run `43033747901`, 3 jobs, 374/4693; corregido en la 139).
>
> **Antes, al fin de la sesión 138 (2026-11-10):** La 138 siguió el (dk), el Modo C P0 con emulador, en un
> chat nuevo, en la terminal, **con 3 agentes a pedido de Victor** (nuevos, en worktrees, el 3.º en segunda ola por el
> techo de 2 emuladores; ninguno cortado), Opus 5.5 con el asesor Fable 5.2. Cerró `C27a` 🐛 (`R9-558` P2, `R9-559`
> P3), `C42a` 🐛 (`R9-561` P2; persistencia ✅; `R9-57` medido en vivo) y `C43a` 🐛 (`R9-562` P2, `R9-563` P3;
> persistencia ✅; los arreglos de `R9-44` y `R9-50` se sostienen), y midió el control de toasts de `C26b`, que pasa a
> P2 con `R9-560`. Ninguno P0, salvo lo que Victor decida sobre `R9-562` (P2 propuesto; P1 o P0 los pone él, §8). Hay
> 563 hallazgos y ningún P0 abierto con esa salvedad. La rama `docs/review-s138-c-p0` (solo docs) se mergeó
> y pusheó con el OK de Victor (`main` = `origin/main` = `dd3568f`, CI verde en el log, run `43033747901`, 3 jobs,
> 374/4693; corregido en la 139: decía «sin mergear»). El Modo C P0 queda hecho salvo lo que espera una cuenta de Google de PRUEBA
> (`C26a`, `C54`, `C55`, el suelo de `C20a`, «Borrar cuenta» de `C27a`). **Lo siguiente lo decide Victor** (§4): el
> mensaje recomendado, las filas C P1 de datos y núcleo, está en `_scratch/S139-PROMPT.md`. La 137 ya está mergeada y
> pusheada (`main` = `origin/main` = `6e81d56`, CI verde en el log, run `42952085435`, 3 jobs, 374/4693; corregido en
> la 138: sus docs decían «sin mergear»). La 137 (3 agentes, cortada por el límite de uso) cerró `C1a` ✅ y `C26b` 🐛
> (`R9-557`), con `R9-556` en `C20a`.
>
> **Antes, al fin de la sesión 136 (2026-11-10):** La 136 hizo el (dj) en un chat nuevo, en la terminal,
> SIN agentes, Opus 5.5 (con el asesor Fable): **el Modo B P1/P2, `B6`–`B10`: con ellas se terminan las filas del
> Modo B.** `B6` 🐛: `R9-550` (`assetlinks.json` declara solo el certificado de debug PÚBLICO de la plantilla de
> Expo: el App Link no se verifica en una instalación de Play y cada enlace compartido pasa por el navegador) y
> `R9-551` (el proyecto de Firebase de producción acepta ese mismo certificado como cliente OAuth; severidad, de
> Victor, §8). `B7` ✅ (62 atrasados en la raíz, clasificados; nada bloquea la tienda). `B8` 🐛: `R9-552` (vc74 se
> publicó con el splash de la plantilla: el `splash` de `app.json` ya no lo lee el SDK 57; corrige la premisa de
> `R9-463`). `B9` 🐛: `R9-553` (cuatro módulos nativos sin import en el release, dos desde `devDependencies`). `B10`
> 🐛: puede salir en una app de pago, pero `R9-554` (ningún aviso de terceros en la app) y, de paso, `R9-555` (las 19
> familias de íconos en el AAB, la app usa 2). Todos P3, ninguno P0. La rama `docs/review-s136-b6-b10` (solo docs)
> va **sin mergear hasta el OK de Victor**. Hay 555 hallazgos y ningún P0 abierto. **Lo siguiente lo decide Victor**
> (§4): el mensaje recomendado, las 7 filas C P0 (Modo C, con emulador), está en `_scratch/S137-PROMPT.md`. La 135 ya
> está mergeada y pusheada (`main` = `origin/main` = `df94dd5`, CI verde en el log, run `42866946428`, 3 jobs,
> 374/4693; corregido en la 136: sus docs decían «sin mergear»).
>
> **Antes, al fin de la sesión 135 (2026-11-10):** la 135 hizo el (di) en un chat nuevo, en la terminal,
> **CON 13 agentes a pedido de Victor** (su mensaje propio pidió 3, y después dos veces «otros 5», por encima del
> «SIN agentes» del mensaje pegado: 8 `fork` y 5 nuevos, en worktrees, ninguno cortado), Opus 5.5: **el Modo A P2,
> la octava tanda, las últimas filas del Modo A.** `A45` 🐛 cerrada: `R9-536`..`R9-543` («Devocional · 1 días»; el
> «Hoy» que no avanza; los landings alinean por número entre versiones; 14 citas no literales y tres datos falsos de
> `book-intros`; el mismo enlace dos veces deja dos landings; el `accessibilityLabel` que tapa la nota; la intro del
> estudio compartido mezcla idiomas). `A46` 🐛 cerrada: `R9-544`..`R9-548` (la auditoría pisada por id: Insights
> cuenta de menos; la tarjeta sin cita; «Combinar» parte una colección con coma; el borrador de «Combinar» que
> sobrevive al cambio de cuenta; «Tienes 1 cambios locales»). De paso, `R9-549` (`A34`, el trimestre tras el atraso
> de hora). Todos P3, ninguno P0. La rama `docs/review-s135-a45-a46` (solo docs) se mergeó y pusheó con el OK de
> Victor (`df94dd5`, CI verde, run `42866946428`; corregido en la 136: decía «sin mergear hasta el OK»). Hay 549
> hallazgos y ningún P0 abierto. **Lo siguiente lo decide Victor** (§4): el mensaje recomendado,
> `B6`–`B10` (Modo B), está en `_scratch/S136-PROMPT.md`. La 134 ya está mergeada y pusheada (`main` = `origin/main` =
> `e4474a8`, CI verde en el log, run `42770622085`, 3 jobs, 374/4693; corregido en la 135: sus docs decían «sin
> mergear»).
>
> **Antes, al fin de la sesión 134 (2026-11-10):** la 134 hizo el (dh) en un chat nuevo, en la terminal,
> SIN agentes, con Opus 5.5 `high`: **el Modo A P2, la séptima tanda.** `A43` 🐛 cerrada: `R9-531` (la tarjeta «Mi
> semana» dice «1 versículos oídos» y pone los números sin separador; la tendencia emocional, «+1 días») y `R9-532`
> (la tira de ánimo tiene 17 columnas y el registro guarda 84 días), P3. `A44` 🐛 cerrada: `R9-533` (P2: abrir una
> comparación guardada de otro pasaje muestra el versículo con ese número en el capítulo abierto), `R9-534` (el
> análisis del versículo anterior queda en pantalla) y `R9-535` (la comparación alinea por número: con RV1909, Jonás
> 2:1 pone el pez al lado de la oración, y la nota culpa al texto crítico), P3. Ninguno P0. La rama
> `docs/review-s134-a43-a44` (solo docs) se mergeó y pusheó con el OK de Victor (`e4474a8`, CI verde, run
> `42770622085`; corregido en la 135: decía «sin mergear hasta el OK»). Hay 535 hallazgos y ningún P0
> abierto. **Lo siguiente:** `A45` y `A46` (el (di), `_scratch/S135-PROMPT.md`). La 133 ya está mergeada y pusheada (`main` = `origin/main` = `bd3bfad`, CI verde en el log, run
> `42766266820`, 3 jobs, 374/4693; corregido en la 134: sus docs decían «sin mergear»).
>
> **Antes, al fin de la sesión 133 (2026-11-09):** la 133 tampoco hizo el (dh): fue el **segundo piloto
> de re-revisión con Fable 5.2** (modelo principal, esfuerzo `high`, sin agentes, en un chat nuevo), a ciegas sobre
> `B4` (las reglas de Firestore y Storage, una fila cerrada en ✅ OK). Las reglas VIVAS se leyeron de nuevo con la
> API de Rules (solo GET): **son las de septiembre** (el mismo ruleset `4c122e10`, del 2026-05-28; un solo release,
> `cloud.firestore`; ninguno de Storage) y **no hay ningún path abierto**. Un nuevo, `R9-530` (P3: «Eliminar
> cuenta» borra una foto de la nube y la regla deja que otro dispositivo de la misma cuenta siga escribiendo);
> ningún P0, P1 ni P2 nuevo; tres notas a `R9-136`; `R9-136` visto a ciegas, `R9-25` no visto; la tabla y seis
> «sin medir», en `detail/B4-reglas-firestore-storage.md` («Re-revisión piloto»). **El criterio que Victor fijó
> antes de empezar (un nuevo P2 o mayor → seguir con `B2`, `B3`, `B5`, `A21` y `B1b`) no se cumple.** Cerrar la
> re-revisión, y usar a Fable en las sesiones de arreglos, lo decide Victor: no propongas otro piloto. La rama de
> la 133 (`docs/review-s133-piloto-b4`, solo docs) ya está mergeada y pusheada (`main` = `origin/main` = `bd3bfad`,
> CI verde en el log, run `42766266820`, 3 jobs, 374/4693; corregido en la 134: decía «sin mergear»). Hay 530
> hallazgos y ningún P0 abierto. **Lo siguiente:** `A43` y `A44`, en la 134, con Opus (`_scratch/S134-PROMPT.md`).
>
> **Antes, al fin de la sesión 132 (2026-11-09):** la 132 NO hizo el (dh): a pedido de Victor fue un
> **piloto de re-revisión con Fable 5.2** (modelo principal, esfuerzo `high`, sin agentes, en un chat nuevo), a
> ciegas sobre `A7` (`BackupService.ts`). Un nuevo, `R9-529` (P3 bajo: el historial de búsqueda restaurado lo pisa
> la primera búsqueda); ningún P0, P1 ni P2 nuevo; 6 de los hallazgos previos del área vistos a ciegas, 1 no visto
> (`R9-29`); la tabla y cuatro «sin medir», en `detail/A7-backupservice.md` («Re-revisión piloto»). Ya está
> mergeada y pusheada (`main` = `origin/main` = `308cb81`, CI verde en el log, run `42735434164`, 3 jobs,
> 374/4693; corregido en la 133: sus docs decían «sin mergear», y que la 133 sería `A43` y `A44`).
>
> **Antes, al fin de la sesión 131 (2026-11-04):** la 131 hizo el (dg) en el MISMO chat que la 130 (lo
> pidió Victor: «podrías continuar aquí?»), en la terminal, SIN agentes: **el Modo A P2, la sexta tanda.** Dos
> nuevos, `R9-527` y `R9-528` (P3), ninguno P0: `A41` 🐛 cerrada (la cita del Salmo 90:2 en inglés, en Teología, no
> es la de ninguna versión que trae la app) y `A42` 🐛 cerrada (al volver del editor de una nota de sermón o de un
> testimonio, la lista muestra el texto viejo), más notas a `R9-503` y `R9-525`. El ciclo de las pruebas de la Mesa
> sigue CERRADO (§7).
>
> La 130 ya está mergeada y pusheada (`main` = `origin/main` = `60cc41e`, CI verde en el log, run
> `41931041248`, 374/4693; corregido en la 131: sus docs decían «sin mergear»). La rama de la 131
> (`docs/review-s131-a41-a42`, solo docs) va **sin mergear hasta el OK de Victor**. **No queda ningún P0
> abierto**, y hay 528 hallazgos. **Lo siguiente:** `A43` y `A44` por el orden del índice, en la 132 (mensaje
> (dh), en `_scratch/S132-PROMPT.md`), en un chat nuevo.
>
> **⛔ Modo SOLO TERMINAL desde el 2026-09-24:** el crédito de la nube se terminó. No propongas
> sesiones en la nube: todo se hace en el chat local. Agentes (en worktree), solo si Victor los pide;
> si no dice cuántos, 3. Cada chat gasta su cuota semanal: sé económico.
> Actualiza este archivo al cerrar cada sesión (es parte del checkpoint, igual que
> `INDEX.md`).
>
> Este archivo es corto a propósito: su único trabajo es arrancar un chat nuevo sin que
> tenga que re-derivar nada. El **programa** está en
> [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md); el **estado vivo**, en [`INDEX.md`](INDEX.md).

---
