# ▶️ Continuar la revisión profunda 2026-09 — prompt para un chat NUEVO

> **Última actualización: 2026-10-03, fin de la sesión 55.** La 55 hizo el (ai) en el mismo chat
> que la 54, en la terminal y sin agentes: arregló `R9-269`..`R9-272` (la unión de la Mesa ya no
> pierde entradas; el almacén se reclama también con la sesión restaurada y al cerrarla; sin
> sesión, una lectura fallida se reintenta; un comentario). Ningún nuevo.
>
> La 54 ya está mergeada y pusheada (`main` = `a64786b`, CI verde en el log, run `37167615407`,
> 371/4582). Las ramas de la 55 (`fix/s55-arreglos-s54` y `docs/review-s55-fix`, apiladas) van
> **sin mergear hasta el OK de Victor**. **No queda ningún P0 abierto**, y hay 272 hallazgos. **Lo
> siguiente:** la 56 revisa el diff de la 55 (mensaje (aj), en `_scratch/S56-PROMPT.md`).
>
> **⛔ Modo SOLO TERMINAL desde el 2026-09-24:** el crédito de la nube se terminó. No propongas
> sesiones en la nube: todo se hace en el chat local. Agentes (en worktree), solo si Victor los pide
> y 3 como máximo. Cada chat gasta su cuota semanal: sé económico.
> Actualiza este archivo al cerrar cada sesión (es parte del checkpoint, igual que
> `INDEX.md`).
>
> Este archivo es corto a propósito: su único trabajo es arrancar un chat nuevo sin que
> tenga que re-derivar nada. El **programa** está en
> [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md); el **estado vivo**, en [`INDEX.md`](INDEX.md).

---

## ⛔ LEE ESTO ANTES DE NADA

**0. El checkpoint de los arreglos de la sesión 25 va en la rama `docs/review-s25-arreglos`, que es
solo docs, y espera el OK de Victor para mergearse.** Si al arrancar esa rama no está en
`origin/main`, preguntale qué decidió antes de seguir. La base es `cf7c715`, el último código de la
25, ya mergeado y pusheado. Su CI está verificado EN EL LOG: run `36052843080`, 3 jobs verdes, Node v24.21.0, 367/4405, cero «failed to run». El checkpoint de la
revisión (`763dcc0`) ya está en `main`. **Comprobá en el log el run de CI de `origin/main`.**

**1. ✅ Lo de la sesión 20: la rama se mergeó en fast-forward y se
pusheó** (con el OK de Victor), y se borró. Lleva cuatro commits de código, uno por hallazgo
(`8ea93b6` `R9-105`, `7aafc9c` `R9-103`, `cfa7c1c` `R9-104`, `00f69c4` `R9-102`), su
checkpoint (`c5d3543`), su coherencia (`47adfec`) y la medición nativa de `R9-104` (`e54208f`),
más el commit que deja este prompt al día: mirá `git log -1 origin/main`. Las compuertas se
corrieron sobre `main` YA mergeado antes de publicar, y **el CI está verificado EN EL LOG** en los
dos pushes: run `35793874042` sobre `47adfec` y run `35794694435` sobre `e54208f`, los dos con
364/4299 y cero «failed to run». Todo lo posterior a `00f69c4` es solo docs.
**Antes de empezar, comprobá en el LOG el run de CI de `origin/main`** (la lección de la 16).

**Lo de la sesión 19, que sigue valiendo:** fue **solo de revisión** (Victor: «decime qué
encontraste antes de tocar nada»), así que no trajo cambios de código. Su checkpoint (`ac9c7fd`: `BUGS.md`, `INDEX.md`, este archivo
y `detail/S19-revision-del-diff.md`) **se mergeó en fast-forward y se pusheó**, junto con su commit
de coherencia (`25128b3`). La rama `docs/review-s19-checkpoint` se borró.

El último código que corrió CI es el de `40160d7`, y está **verificado EN EL LOG**: run
`35163775542`, Node v24.20.0, 363 suites / 4289 pruebas y cero «Test suite failed to run». Lo que
vino después son solo docs. **Aun así, antes de empezar comprobá en el log el run de
`origin/main`**, que es la lección de la 16.

**2. 🚨 Lo más urgente de la 19 estaba FUERA del repo, y ya se atendió.**
`C:\Users\victo\Desktop\web-packs\rvr1960.sqlite` (el `out` por defecto de `build-web-packs.js`)
era el pack de julio, **con texto de chatbot dentro de 2 Reyes 22:9** («_Claro, aquí tienes el
texto continuado de 2 Reyes 22:10-20…_»).

- Pesaba exactamente lo mismo que el bueno, y estaba junto al manifiesto que pina el bueno.
- El lector web **no verifica el sha256** de lo que descarga (`R9-109`). Subir «la carpeta» lo
  republicaba sin que nada lo detectara, y **los navegadores que lo importaran no se curarían**.
- **Se movió a `C:\Users\victo\essb-cuarentena\`** (con permiso de Victor y el sha verificado). En
  `web-packs` quedan los otros cuatro archivos.
- **Nunca publiques desde ahí sin volver a construir.** El pack bueno es el que sirve Pages, y una
  corrida limpia lo regenera byte a byte.
- Hay otro clon viejo de Pages en `C:\projects\_pages_pub` que tiene el mismo pack contaminado.
  **No lo uses para publicar packs.**

**3. ⚠️ PEDIDO FIJO DE VICTOR: doble check con Opus 5.5 de todo lo revisado ANTES de la sesión 19.**
Todo lo que el ledger registra hasta la sesión 18 incluida se revisó con **Opus 5**. La 19 fue la
primera con **Opus 5.5**, y encontró que esa pasada dejó huecos:

- **dos diffs de arreglos nunca se habían revisado**: el del dinero (`R9-9`/`R9-10`) y el de la
  cola y el cursor (`R9-11`/`R9-65`);
- **dos P0 nuevos** en código que el Modo A ya había pasado;
- **varias afirmaciones «comprobado y BIEN» que eran falsas**.

Victor pidió que **una sesión posterior vuelva a hacer doble check, con Opus 5.5, de lo ya
revisado**. El alcance propuesto está en `detail/S19-revision-del-diff.md`, sección «Pedido de
Victor», y es la opción **(b)** del mensaje para pegar. **Esto no se da por hecho hasta que una
sesión lo haga y lo registre.**

**Estado del doble check:**

- **Puntos 1 y 2, HECHOS en la sesión 21:** los 18 P0 arreglados, pieza por pieza, y las filas
  cerradas del Modo A y del Modo B. Salieron 19 hallazgos (`R9-124`..`R9-142`, 2 P0), y el
  detalle está en `detail/S21-doble-check.md`.
- **Puntos 3 y 4, HECHOS en la sesión 22, con 5 agentes:**
  - las 14 entradas `R9-51`..`R9-64` siguen siendo ciertas, con 3 cambios de severidad;
  - de 179 afirmaciones de `S8`..`S18`, se verificaron 171, y ninguna escondía un P0 ni un P1.

  Salieron 10 hallazgos (`R9-143`..`R9-152`, 1 P1). El detalle está en
  `detail/S22-doble-check-puntos-3-4.md`.

**El doble check está TERMINADO.** Ya no hace falta que vaya en el prompt de arranque.

**4. La revisión de la sesión 10 encontró que la prueba de `R9-34` NO DISCRIMINABA**, y la
causa es la que hay que llevarse: **`R9-33` y `R9-34` iban en el mismo commit, y el backoff
que introduce el primero dejó ciega a la prueba del segundo.** El `await flush()` de esa
prueba gastaba un intento fallido, lo que arma el backoff; el `flush()` siguiente salía por
el `flushableCount() === 0` recién añadido sin empujar nada, así que no había push en vuelo y
la carrera que dice probar **no ocurría**. Pasaba en verde por la razón trivial. Reescrita y
vista fallar (`Received: "v1"`), más un hueco menor de `stop()` — todo remateado en `2bfa126`
antes de mergear. Detalle completo en `detail/S10-revision-del-diff.md`, que además lista
**las 5 cosas comprobadas por revert que SÍ discriminan**, **las 5 comprobadas a mano que
están BIEN** y **las 5 que se decidió NO tocar**.

**Es una variante nueva de la clase que venimos cazando** (_el arreglo cierra el caso que su
prueba cubre y deja abierto el vecino_): aquí el vecino no era otro caso, era **otro arreglo
del mismo diff**. Si un commit lleva dos arreglos, pregúntate si uno desarma la prueba del
otro. Lo mismo vale para `detail/S9-revision-del-diff.md` y `detail/S8-revision-del-diff.md`.

**Quedan 2 P0 abiertos:** `R9-38` y `R9-124`. La sesión 24 cerró `R9-36`, `R9-39` y `R9-125`. Los dos de la sesión 19, `R9-102` y
`R9-103`, se arreglaron en la 20. Todo lo demás de la sección P0 va
marcado **✅ ARREGLADO** dentro de su entrada de `BUGS.md`. **No los vuelvas a atacar.** Los
**6 hallazgos de la sesión 13** (`R9-66`..`R9-71`) son P1/P2, así que el conteo de P0 no se
mueve — y los seis ya están arreglados y mergeados.
Los **5 hallazgos de la sesión 14** (`R9-72`..`R9-76`) también son P1/P2, así que el conteo
de P0 tampoco se mueve — y los cinco ya están arreglados y mergeados.
Los **5 hallazgos de la sesión 15** (`R9-77`..`R9-81`) también son P1/P2, así que el conteo
de P0 sigue igual — y los cinco ya están arreglados y mergeados.
Los **5 de la sesión 16** (`R9-82`..`R9-86`) igual: P1/P2, arreglados y mergeados.
Los **10 de la sesión 17** (`R9-87`..`R9-96`) también son P1/P2, así que el conteo de P0 sigue
igual — y los diez ya están arreglados y mergeados.
Los **5 de la sesión 18** (`R9-97`..`R9-101`) igual: P1/P2, arreglados y mergeados.
Los **22 de la sesión 19** (`R9-102`..`R9-123`) son 2 P0, 6 P1, 10 P2 y 4 entradas P3
agrupadas. **La 20 arregló cuatro:** `R9-102`, `R9-103`, `R9-104` y `R9-105`. Los otros 18
siguen abiertos.
Los **19 de la sesión 21** (`R9-124`..`R9-142`) son 2 P0, 6 P1, 10 P2 y 1 P3, y están todos
abiertos. Los dos P0 los pasan de 3 a 5.
Los **10 de la sesión 22** (`R9-143`..`R9-152`) son 1 P1 (`R9-143`), 1 P2 y 8 P3, todos
abiertos. Además, `R9-53` y `R9-55` bajaron de P1 a P2 y `R9-63` de P2 a P3.
Los **4 de la sesión 23** (`R9-153`..`R9-156`) son 1 P1 (`R9-153`) y 3 P3. `R9-153` y `R9-154` se
arreglaron en la 24. Además, `R9-122.4` subió de P3 a P2, y también se arregló en la 24.
La **sesión 24** cerró 11: `R9-125`, `R9-130`, `R9-143`, `R9-153`, `R9-122.4`, `R9-154`, `R9-109`,
`R9-108`, `R9-36`, `R9-39` y `R9-106`. Registró **3 nuevos** (`R9-157`..`R9-159`): `R9-157` (P2) ya
está arreglado, `R9-158` (P2) es una decisión de Victor, y `R9-159` es P3.
Hallazgos totales: **159**.

**Y ya NO hay nada bloqueando el deploy web:** era `R9-13`, y está cerrado y verificado en un
navegador de verdad sobre el bundle real.

**⚠️ Y no re-derives el conteo contando arreglos: cuenta las entradas de la sección P0.** Las
sesiones 7 y 8 contaban `R9-50` como P0 cerrado, pero vive en **P1**, así que su «quedan 10»
eran 11. La nota está al principio de la sección P0 de `BUGS.md`.

**5. El orden de ataque ORIGINAL de arreglos se acabó; el nuevo, desde la sesión 19, es el del
mensaje (a) de abajo.** Todos los bloques están cerrados: sync
(`R9-33`/`R9-34`/`R9-35`, sesión 9), dinero (`R9-9`/`R9-10`, sesión 10), cola y cursor
(`R9-11`+`R9-65`, sesión 11) y **web (`R9-13`+`R9-15`+`R9-14`, sesión 12)**. Lo que queda son
tres P0 sueltos (`R9-36`, `R9-38`, `R9-39`) y los 4 reportes de campo (`R9-40`..`R9-43`), que
son baratos y muy visibles: buenos para cerrar una sesión.

**La lección de la sesión 12, que es la que hay que llevarse:** el arreglo del test iba
PRIMERO, y a propósito. `R9-15` (el test que enmascaraba) se arregló antes que `R9-13` (el
bug), para **ver el crash de producción ponerse rojo en la compuerta** antes de tocar el
código de la app. Y ahí saltó la trampa: el mock del especificador `.web` era un **objeto
escrito a mano**, o sea que era él quien definía la superficie del módulo bajo prueba.
Redirigir el import pelado a ese mock habría seguido fallando **después** del arreglo, y el
reflejo obvio —añadirle `hasRedLetterData: jest.fn()` al mock— habría dejado la prueba verde
**sin mirar jamás el archivo real**. El antídoto es barato: `...jest.requireActual` y stubear
solo lo que de verdad hace falta. **Generalización: un mock con factoría literal no prueba
paridad de superficie, la SUSTITUYE.**

**La lección de la sesión 13**, que es la que conviene llevarse ahora: las cuatro sesiones de
revisión anteriores encontraron defectos en los ARREGLOS; la 13 los encontró en las
**COMPUERTAS** de los arreglos, y los dos peores comparten una sola forma:

> una verificación cuyo cuerpo entero es un bucle **pasa cuando no hay nada que recorrer**, y
> lo hace imprimiendo un mensaje de éxito.

`verifyRedLetterAlignment` imprimía «ALL slices non-blank and in-range» sobre CERO spans —y es
lo único del programa que toca **datos ya publicados**—, y la compuerta de paridad comparaba
contra un conjunto vacío, dejando pasar `R9-13` al pie de la letra en forma `export {x}` con
la suite en verde **30/30**. **El antídoto cabe en una pregunta: _¿qué entrada hace que esta
comprobación no ejecute ninguna aserción?_** Si esa entrada es alcanzable, hace falta un piso
— y el piso necesita su propio control, o se convierte en la comprobación entera. Corolario:
**un comentario que dice «verificado que hoy nadie hace X; si alguien empieza, arréglalo» no
es una compuerta, es una nota.** O lo detecta algo, o no existe.

**La lección de la sesión 14**, que sigue vigente entera: la 13 encontró sus
defectos en las compuertas; la 14 los encontró **en el mismo sitio otra vez**. O sea: una
compuerta recién escrita merece exactamente la misma desconfianza que el código que vigila, y
**no menos por ser una prueba**. A la pregunta de la 13 se le suman dos:

> **¿De quién depende el discriminador de esta compuerta?** Si depende de una decisión que toma
> quien podría infringirla, no es una compuerta. (`R9-76`: la paridad de contratos solo miraba
> los tipos que el hermano nativo EXPORTA — mantenelo privado y se calla. Era el estado exacto
> de `OfferingSheetContextValue` antes del arreglo que creó esa compuerta.)

> **¿Qué significa su SILENCIO?** Si el mismo silencio sirve para «verificado» y para «no
> miré», no hay compuerta. (`R9-74`: un baseline ilegible apagaba la detección de encogimiento
> entera sin imprimir una palabra, y el camino de éxito tampoco imprimía nada.)

Y dos corolarios que valen por sí solos:

> **Un mensaje de error que AFIRMA un estado del mundo es una aserción, y hay que probarla como
> tal.** El de `R9-66` decía «no pack file was emitted» con 9,5 MB de packs recién escritos en
> el directorio de salida — y había una prueba **fijando esa frase**. Una prueba puede
> certificar una mentira si solo comprueba que el texto está ahí.

> **Un bucle que recorre la lista NUEVA no puede ver lo que falta de la VIEJA.** (`R9-73`.) Es
> la variante de «un bucle en vacío pasa» que se le escapó a la propia sesión 13: si una
> comprobación compara dos colecciones, tiene que recorrer **las dos**.

**La lección de la sesión 15, que es la que conviene llevarse AHORA:** la 13 encontró sus
defectos en las compuertas, la 14 en el mismo sitio, y la 15 **otra vez** — tres seguidas. Con
eso ya hay bastante como para nombrar la forma:

> **Una compuerta escrita para cerrar un caso cierra ese caso y deja abierto el vecino que la
> motivó.** `R9-73` lee las listas PREVIAS —que era lo correcto— y no le pone piso a la lista
> previa, así que una vacía la apaga entera (`R9-77`); y **no puede ver el `R9-13` que cita
> por su nombre**, porque una versión que nunca tuvo pack no tiene entrada de la que faltar
> (`R9-78`). `R9-76` mueve el discriminador de «lo exporta» a «lo declara» y deja fuera el par
> donde el contrato vive en un tercer archivo (`R9-79`). `R9-75` deriva la lista de providers
> leyendo el layout como TEXTO, o sea confiando en un comentario (`R9-80`). `R9-72` establece
> que nada llega a `out` sin pasar la compuerta, y la mudanza final son cuatro operaciones
> (`R9-81`).

Y un corolario nuevo, del otro lado del `if` respecto al de la sesión 14:

> **Un mensaje de ÉXITO que afirma cuánto comparó es una aserción, y hay que probarla contra
> el MUNDO.** `assertNoShrink` decía «2 packs and 2 red-letter packs compared against the
> published manifest» habiendo comparado **cero**. Las dos cifras coinciden en toda corrida
> buena — **por eso nadie las miró en la mala**.

Y una gotcha de plataforma que costó una prueba roja por el camino equivocado: **Windows abre
tan campante un DIRECTORIO con `open(…, 'r+')`**, así que un preflight de «¿puedo reemplazar
este archivo?» necesita además `statSync().isFile()`.

**La lección de la sesión 16, que es la que conviene llevarse AHORA**, y es de otro tamaño
porque no la encontró leyendo el diff sino leyendo los correos de CI de Victor:

> **Una compuerta que nunca llegó a EJECUTARSE se ve exactamente igual que una que pasó.**
> «Gates verdes» era cierto — en **una sola máquina**. La suite entera estaba verde en local
> (Node 24) y en CI una suite **no cargaba** (Node 20, sin `node:sqlite`), y el silencio del
> repo era idéntico en los dos casos. Antes de creerle a una compuerta nueva, preguntá **dónde
> corre**, no solo qué comprueba.

**La lección de la sesión 24, que es la que conviene llevarse AHORA.** Los arreglos los hicieron
sesiones de Claude Code en la nube, y el orquestador revisó cada rama en la máquina de Victor:

> **Verde en la nube y en CI no es verde en la máquina de Victor.** Los dos corren sin `NODE_ENV`, y
> Victor exporta `NODE_ENV=development`. jest solo pone `test` si la variable no existe, y el driver
> nativo de `Animated` lanza con otro valor. Resultado: pruebas verdes allá y rojas acá (`R9-157`,
> ya arreglado: `jest.config.js` lo fija). Una rama hecha en la nube se revisa en SU entorno antes
> del OK.

> **Una limitación escrita en un comentario puede ser un defecto del entorno.** «react-test-renderer
> desmonta la Mesa» se repitió en ~12 suites y en la memoria sin que nadie lo midiera: era
> `NODE_ENV`, y dejó sin prueba la mitad de `R9-47`.

> **La nube escribe y el orquestador revisa pieza por pieza: funciona.** La revisión local encontró
> una compuerta roja, una pieza sin vigilar y un defecto de diseño (la pantalla de error del lector
> web para quien ya tenía texto), y cada uno volvió a la nube con un mensaje concreto. Las sesiones
> en paralelo tienen que tocar archivos distintos, para que las ramas se apilen sin conflictos.

**La lección de la sesión 23.** Revisó el diff de la 20, y
los cuatro arreglos se sostienen. Lo roto estaba, otra vez, en el vecino:

> **Un arreglo que le pone sesión a UN bucle deja abierto el OTRO bucle con `await` que cruza el
> mismo `stop()`.** La 20 cerró el flush y dejó `handleSnapshot`. Un conflicto de Ana registrado
> después del `stop()` pasa a la sesión de Beto, y resolverlo copia la versión de la nube de Ana
> a la de Beto (`R9-153`). Cuando arregles algo que cruza un `stop()`, buscá TODOS los `await`
> que lo cruzan, no solo el de tu prueba.

> **Lo que `stop()` limpia, `start()` no lo vuelve a limpiar.** Todo lo que se escribe entre los
> dos lo hereda la cuenta que entra.

> **Un dato que no se anota no se puede re-verificar.** Los uid de las 5 cuentas anónimas de la
> sonda de la 20 no quedaron escritos, así que su borrado ya no se puede comprobar desde fuera
> (`R9-156.5`). Anotá los identificadores de lo que una sonda crea en el mundo.

**La lección de la sesión 22.** Fue la segunda mitad del
doble check, con 5 agentes, y lo que más enseñó fue la operación:

> **Cinco agentes Opus a la vez agotaron la sesión de uso, y se cortaron los cinco en el mismo
> minuto.** Salvó el trabajo el informe incremental en disco. A uno se le borró el worktree con
> sus sondas, y quedó solo lo que había escrito. **Copiá a `_scratch` cada sonda que sostenga un
> P0/P1 en cuanto se corre, no al final.**

> **Un agente re-descubre un hallazgo ya numerado si el título no nombra la clave.** El «P1 nuevo»
> del Banco de ilustraciones ya era `R9-30`. El orquestador tiene que buscar por la CLAVE
> (`grep @prep_illustrations BUGS.md`), no por el título.

> **Un remedio escrito en el ledger es una hipótesis, también en un P2** (`R9-58`: `flushOnExit`
> no hace nada en React Native). Y **dónde corre algo se comprueba en el log**: el CI corre en UTC,
> no en Ciudad de México como decía este archivo.

**La lección de la sesión 21.** Fue el doble check de los
18 P0 arreglados, y los 18 se sostienen. Lo que no se sostiene es la creencia de que están
vigilados:

> **«Arreglado» no dice qué está vigilado.** En 12 de los 18 hay piezas que se quitan con la suite
> entera en verde. Tres juntas (`R9-130` y las dos mitades de `R9-131`) dan **364/364,
> 4299/4299**, y cada una reabre un P0. Revertir el arreglo ENTERO lo esconde, porque siempre cae
> alguna prueba.

> **Un stub del OTRO lado de la frontera responde la pregunta** (`R9-131`). El export se probó con
> un servicio que rechaza siempre, con o sin `strict`, y el import con un `restoreBackup` que es un
> `jest.fn()`. Si la prueba stubea el otro lado, el otro lado necesita su propia prueba con el
> código real.

> **Un mock que implementa el SDK a su manera sustituye la semántica del SDK** (`R9-124`). El
> `onSnapshot` de la suite FILTRA lo que no casa con el `where`, y el SDK real lo emite como
> `removed`. El motor lo lee como borrado, y ninguna prueba podía verlo.

**La lección de la sesión 20.** Fue de arreglos, y lo que más
vale salió de medir el arreglo ANTES de escribirlo:

> **Una propuesta de arreglo escrita en el ledger es una hipótesis, no una especificación.** La de
> `R9-104` decía «sirve para las dos ramas». Aplicada tal cual, la rama «el `set()` no vuelve
> nunca» seguía roja, y es la que toma el SDK de JS. **Un `await` que no vuelve no se arregla
> mirando después del `await`.**

> **Revertí cada PIEZA de un arreglo por separado, no el arreglo entero.** Entero, el de `R9-104`
> tumbaba las 4 pruebas y parecía cubierto. Pieza por pieza salieron dos capas redundantes, una
> guarda que no protegía nada (se quitó), una guarda sin prueba (se le escribió), y una aserción
> cuyo comentario afirmaba algo que la aserción no medía.

**La lección de la sesión 19.** Fue la primera sesión con
Opus 5.5, y lo que más vale no estaba en el diff: estaba en lo que el programa creía de sí mismo.

> **«N sesiones seguidas» era una afirmación sobre el mundo que nadie comprobó.** La 11 y la 12 no
> revisaron ningún diff, así que **los arreglos de dinero (`R9-9`/`R9-10`) y los de la cola y el
> cursor (`R9-11`/`R9-65`) nunca se habían revisado**. Al revisarlos salieron un P1 de dinero
> (`R9-105`) y un P1 de pérdida de conflictos (`R9-106`). **Contá los `detail/S*`, no las
> sesiones.**

Y tres formas nuevas, las tres sobre cómo una prueba o una compuerta se engaña a sí misma:

> **Un helper de RESET en el `beforeEach` sustituye el valor inicial del módulo, así que el
> inicializador nunca corre bajo jest** (`R9-105`). El arreglo del P0 de reembolso vive en un
> `let … = null` de nivel de módulo, y `__resetForTests()` pone `null` por su cuenta. Revertido
> el inicializador, que es el bug P0 tal cual, pasan **57/57 suites verdes**. Si el bug vive en el
> estado de ARRANQUE de un módulo, probalo con `jest.isolateModulesAsync` y sin reset.

> **Una compuerta verificada solo con spies no se midió contra el mundo** (`R9-113`). El preflight
> de `R9-81` se probó espiando `renameSync`. Con procesos reales, un visor SQLite (incluso en
> `readOnly`) pasa el preflight y rompe el rename a mitad. Si la compuerta nombra una causa del
> mundo, reproducí ESA causa.

> **Un efecto dentro de un actualizador de `setState` no corre cuando creés** (`R9-102`). React
> solo lo ejecuta en el acto si la fibra no tiene trabajo pendiente. Si una variable de afuera se
> asigna ahí dentro, en el flujo real vale `undefined`, y la edición nunca se encola.

**La lección de la sesión 18:** sexta seguida con los
defectos en las COMPUERTAS, y esta vez **las tres compuertas nuevas enteras de la 17 dejaron
abierto el vecino que las motivó**. Tres formas, y las tres son sobre cómo se escribe una:

> **Una comprobación que reemplaza una afirmación tiene que comprobar la afirmación ENTERA, no
> la mitad que se ve.** `R9-93` sustituyó «_it IS coherent - one run, whole_» por una
> verificación de sha256 — y verificó sólo los archivos que ESTÁN. «Whole» es la otra mitad, y
> nadie la comprobó, así que el mensaje sigue diciendo exactamente lo mismo sobre un directorio
> **vacío** (`R9-97`). Leé la frase que vas a dejar en pie y subrayá **cada** cosa que afirma.

> **Decidir por la FORMA de una línea es decidir por un estilo.** El escáner de workflows pedía
> que la cabecera de un job acabara en el dos puntos. Un comentario al final, un id
> entrecomillado o un ancla no lo cumplen — y **no fallaban**: se archivaban bajo el job
> anterior, o sea heredaban su pin. Un cuarto job sin ningún `setup-node` pasaba **15/15**
> (`R9-99`). Lo que dice que algo es un job no es su forma, es su **columna**. Si un escáner
> escrito a mano rechaza una forma, preguntá si la rechaza **ruidosamente** o si se la traga el
> vecino de arriba.

> **Una compuerta nueva que no casa con nada HOY no tiene discriminador.** El detector de
> `R9-91` nació el mismo día en que se corrigieron las cinco frases que vigilaba, así que su
> bucle recorría ~360 archivos sin llegar ni una vez a la comparación. Verde. Un regex roto del
> todo se veía idéntico (`R9-101`). **Contá cuántas veces llega tu compuerta a comparar algo, y
> ponle piso a ese número.**

Y un corolario que vale por sí solo:

> **Un piso puede ser un conteo GLOBAL cuando la pregunta es por unidad.** El escáner recorría
> todo `.github/workflows/` —correcto— y su piso era «al menos un job que corre node **en total**»,
> así que `ci.yml` lo satisfacía **en nombre** de un segundo archivo que el escáner no supo leer
> (`R9-100`). Es la lección de la 17 —el piso es el número de hoy— por el eje del **reparto**:
> preguntá siempre «¿por archivo, o sumando?».

**La lección de la sesión 17:** quinta seguida con los
defectos en las COMPUERTAS, y **cuatro de los cinco arreglos de la 16 dejaron abierto justo el
vecino que los motivó**. Dos formas nuevas, y las dos son sobre cómo se escribe una compuerta:

> **El piso de una compuerta suele ser exactamente el número de HOY, así que acaba exigiendo ESE
> NÚMERO en vez de exigir COBERTURA.** `pinned.length >= 3` con tres jobs no dice «todos los jobs
> están cubiertos», dice «hay tres pines»: un cuarto job corriendo `npm test` en Node 20 pasaba
> tan campante. **No cuentes — emparejá cada cosa con lo que tiene que cubrirla.**

> **Un fixture añadido para habilitar una prueba nueva puede RESPONDER la pregunta que otra
> prueba estaba haciendo.** Es la forma de la sesión 10 (un arreglo desarma la prueba de otro)
> por la puerta del fixture, y es **más traicionera porque el fixture parece inerte**.
> `writeMatchingBaseline` escribe dos packs; la aserción decía `packs.toHaveLength(2)`. La
> pregunta y la respuesta llegaron por el mismo canal, y con la escritura del manifiesto
> desactivada del todo **el repo ENTERO salía verde**.

Y dos corolarios de método que valen por sí solos:

> **Antes de creerte un arreglo de infraestructura, MEDILO.** El primer arreglo de `R9-94` fue
> `npm outdated --package-lock-only`, que suena exacto y **no funciona**: sigue imprimiendo
> `MISSING` las 57 filas. Lo cazó probarlo en un directorio pelado antes de comitearlo.

> **Un comentario corregido no es una compuerta.** Las cinco frases de `R9-91` se podían
> reescribir y volver a pudrirse igual. O lo detecta algo, o no existe.

Y dos corolarios que valen por sí solos:

> **Si una prueba nueva importa un script de build, preguntá qué necesita ese script al
> CARGARSE.** Un `require` de nivel de módulo convierte un requisito del script en un requisito
> de la suite entera, y un requisito de suite que el entorno no cumple no da un fallo: da un
> «suite failed to run» con **cero aserciones**.

> **`jest.requireActual('fs')` devuelve el MISMO objeto de módulo que `require('fs')`**, así
> que dentro de un `jest.spyOn(fs, 'x')` eso **es el propio spy**, no el original. Un mock que
> se llama a sí mismo se ve igual que uno que funciona (`R9-85`: el contador saltaba dos veces
> en la primera llamada, y la prueba del caso «a medias» solo ejercitaba el caso «nada pasó»).
> Capturá la función real **antes** de espiar.

**6. Deuda conocida de las sesiones 8, 9 y 10, dicha en voz alta:**

- ~~`R9-28` sin prueba~~ — **saldado en la sesión 11** (`aa70be0`). Ya **no queda ningún
  arreglo sin prueba de regresión**. Cubre las dos mitades: que `importBackup` emite la señal
  **y que la emite la última** (un listener que re-lea a mitad de escritura cachea un estado a
  medio restaurar), y que el provider re-hidrata **y por eso deja de pisar lo restaurado** —
  esta última en prueba aparte, porque compartiendo cuerpo con la primera el revert la tumba
  antes y no probaría nada.
  **Detalle que costó un rato: `importBackup` escribe AsyncStorage con UN solo `multiSet`, no
  con `setItem`.** Medir `setItem` da 0 y la prueba pasa en vacío.
- **La rama del lector de `R9-44`** (recolorear preserva la nota) es **verificación en
  dispositivo, Modo C**. El MECANISMO sí está fijado en `highlightServiceTriState.test.ts`
  (que `addHighlight` con 5 argumentos escribe NULL sobre categoría y nota), pero la rama de
  la pantalla que lo evita, no.
- **`R9-47` sigue necesitando verificación en vivo** (Modo C), como ya decía la sesión 7.
- **Dos cosas que la revisión del diff señaló y nadie ha decidido:** que el bulk push inicial
  ahora puede **revivir** una fila que la nube tiene como lápida (defendible, es el momento
  de «migrar mis datos a esta cuenta», pero no está documentado), y el `return` temprano por
  `!table` en `load()` de la Mesa, que no incrementa `loadRunRef` (peor caso: pantalla
  obsoleta, no pérdida).
- **La insignia nueva de Ajustes (`droppedWrites`, sesión 9) NO está verificada en
  dispositivo.** Es la mitad visible de `R9-33`: si no se ve, la pérdida de datos sigue
  siendo silenciosa en la práctica. Modo C, emulador + APK debug — **nunca el OnePlus de
  Victor**.
- **`R9-59` sigue abierta** (ver más abajo) y **el `entitlementCache` nunca se limpia al
  cerrar sesión ni al borrar la cuenta.** Con `R9-9` arreglado ya no importa para el dinero
  —la siguiente respuesta de RevenueCat lo corrige— pero un dispositivo que no vuelva a tener
  red nunca se corrige. Es diseño («última verdad conocida»), no bug; queda dicho.
- **`R9-59` sigue abierta y ahora toca de cerca:** el arreglo de `R9-48` decide que el log de
  repasos se **traspasa** (se limpia) cuando entra otra cuenta, pero **no** decide que cerrar
  sesión deba borrarlo. Eso sigue siendo de Victor.

**7. `A12` está `EN CURSO`, no pendiente.** Tiene `detail/A12-superficies-crash.md` escrito
con **3 hilos abiertos y verificados por `grep`, pero sin escenario de fallo alcanzable**,
que es lo que falta para que sean hallazgos. No la re-empieces desde cero: lee ese archivo,
que además dice por dónde seguir. **Cerrarla cierra el bloque P0 entero del Modo A.**

**Los P1 y P2 `R9-51`..`R9-64` ya están re-verificados** (sesión 22): cada entrada lleva su
nota «⚠️ Sesión 22» con lo que cambió. Leéla antes de arreglar una: varias traían un remedio
o un alcance que no se sostiene.

---

## Mensaje para pegar en el chat nuevo

**Hechos:** el doble check (la (b), sesiones 21 y 22), la revisión del diff de la 20 (la (a),
sesión 23), los ARREGLOS (la (c), sesión 24, en la nube), la revisión del diff de la 24 (la (d),
sesión 25, en la nube), sus arreglos (la (e), también en la 25), `R9-124` en Modo C con su arreglo
(la (f), sesión 26, solo en la terminal), la revisión del diff de la 26 (la (g), sesión 27, solo en
la terminal), sus arreglos (la (h), sesión 28, solo en la terminal) y la revisión del diff de la
28 (la (i), sesión 29, solo en la terminal), sus arreglos (la (j), sesión 30, en la terminal con
3 agentes que solo midieron) y la revisión del diff de la 30 (la (k), sesión 31, igual), sus arreglos (la (l), sesión 32, en la
terminal y sin agentes), la revisión del diff de la 32 (la (m), sesión 33, igual), sus arreglos
(la (n), sesión 34, en la terminal con 3 agentes que solo midieron) y la revisión del diff de la
34 (la (o), sesión 35, en la terminal y sin agentes), sus arreglos (la (p), sesión 36, en el mismo
chat y sin agentes), la revisión del diff de la 36 (la (q), sesión 37, en la terminal con 7 agentes
que solo midieron; el checkpoint, en un chat nuevo y sin agentes), sus arreglos (la (r), sesión 38,
en la terminal y sin agentes) y la revisión del diff de la 38 (la (s), sesión 39, igual), y sus arreglos (la (t), sesión 40,
igual), y la revisión del diff de la 40 (la (u), sesión 41, igual), y sus arreglos (la (v), sesión
42, igual), y la revisión del diff de la 42 (la (w), sesión 43, igual), y sus arreglos (la (x),
sesión 44, igual), y la revisión del diff de la 44 (la (y), sesión 45, igual), y sus arreglos (la
(z), sesión 46, en el mismo chat), y la revisión del diff de la 46 (la (aa), sesión 47, igual).
Y sus arreglos (la (ab), sesión 48, igual). Y los arreglos de `R9-212` y `R9-214` (la (ac),
sesión 49, en un chat nuevo, con `_scratch/S49-PROMPT.md`). Y la revisión del diff de la 49 (la
(ad), sesión 50, en un chat nuevo, con `_scratch/S50-PROMPT.md`). Y sus arreglos (la (ae), sesión
51, en el mismo chat, con `_scratch/S51-PROMPT.md`). Y la revisión del diff de la 51 (la (af),
sesión 52, en un chat nuevo, con `_scratch/S52-PROMPT.md`). Y sus arreglos, con `R9-59` y
`R9-38` (la (ag), sesión 53, en un chat nuevo, con `_scratch/S53-PROMPT.md`). Y la revisión del
diff de la 53 (la (ah), sesión 54, en un chat nuevo, con `_scratch/S54-PROMPT.md`). Y sus arreglos
(la (ai), sesión 55, en el mismo chat, con `_scratch/S55-PROMPT.md`). **Lo siguiente es el (aj).**

**(aj) Sesión 56: revisar el diff de la 55** (`a64786b..50f209d`). El mensaje está en
`_scratch/S56-PROMPT.md`, que manda sobre este archivo.

**(ai) Sesión 55: arreglar lo de la 54 — ya HECHO en la sesión 55, en el mismo chat que la 54, en
la terminal y sin agentes.** El mensaje está en `_scratch/S55-PROMPT.md`.

**(ah) Sesión 54: revisar el diff de la 53 — ya HECHO en la sesión 54, en un chat nuevo, en la
terminal y sin agentes.** El mensaje está en `_scratch/S54-PROMPT.md`.

**(ag) Sesión 53: arreglar lo de la 52 e implementar `R9-59` y `R9-38` — ya HECHO en la sesión
53, en un chat nuevo, en la terminal y sin agentes.** El mensaje está en `_scratch/S53-PROMPT.md`.

**(af) Sesión 52: revisar el diff de la 51 — ya HECHO en la sesión 52, en un chat nuevo, en la
terminal y sin agentes.** El mensaje está en `_scratch/S52-PROMPT.md`.

**(ae) Sesión 51: arreglar lo de la 50 — ya HECHO en la sesión 51, en el mismo chat que la 50, en
la terminal y sin agentes.** El mensaje está en `_scratch/S51-PROMPT.md`.

**(ad) Sesión 50: revisar el diff de la 49 — ya HECHO en la sesión 50, en un chat nuevo, en la
terminal y sin agentes.** El mensaje está en `_scratch/S50-PROMPT.md`; abajo, la versión corta.

> Seguimos con la revisión profunda: **sesión 50, revisar el diff de la 49** (`8f59942..f287fc6`:
> `R9-212` en `SyncEngine.ts`, `R9-214` en `FavoritesContext.tsx` y sus 10 pruebas), en la terminal,
> sin agentes y sin tocar código. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (la sección 5 y la
> §2), `detail/S49-arreglos-r212-r214.md` y, en `BUGS.md`, los cierres de `R9-212` y `R9-214` y la
> nota de la 49 en `R9-126`. En la memoria, la de la sesión 49 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s49-arreglos` y `docs/review-s49-fix`, pedime el OK para el
>   fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 253.
> - **Las herramientas** (en `_scratch`): la base `S49-SyncEngine-R212.ts.txt` (= el motor de
>   `024bef8`, que es también el de `f287fc6`); las piezas `S49-piezas.cjs.txt` (reexporta las de
>   la 44); `S49-msg.cjs.txt "FILTRO" PIEZA[,PIEZA]` (el diff de cada caída); `S49-rev214.cjs.txt
R214|R214init`, sobre `S49-Favorites-R214.tsx.txt`; las sondas
>   `S49-sonda-{hoy,fix,mas,gaveup,lww}.body.txt`; `S38-sonda.cjs.txt`, `S34-rev.cjs.txt` y
>   `S47-varias.cjs.txt`. **`S32_BASE` y `S34_PIEZAS`, con la ruta ABSOLUTA.** `S38-sonda` restaura
>   `S32_BASE` encima del motor al terminar: con un motor sin commitear, guardalo antes como base.
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que
>   dar 0.
>
> **Esta sesión revisa el diff de la 49**, sin tocar código. Preguntas para empezar:
>
> - `queueTouched`: ¿hay un camino que cambie la copia local sin pasar por
>   `withLocalWriteSuppressed` ni por `upsertQueueEntry`? ¿Y la marca por `uid`: una copia que
>   la sesión de Beto aplica a un doc con una entrada aparcada de Ana?
> - La salida: una escritura que llega durante la relectura de `start()` hace que se rinda con dos
>   lecturas (lo dice el detalle). ¿Es aceptable, o hay un orden peor?
> - La unión pone las de disco antes que las de memoria. ¿Importa el orden para `flush` (el
>   backoff de `R9-33`, las aparcadas de otra cuenta)?
> - `stop()` con la cola sin leer escribe la tabla de sellos sin la cola. ¿Hay un caso en que ese
>   sello y la cola de disco se contradigan tras reiniciar?
> - `R9-214`: `pullAllLocal` ya no tiene `catch`. ¿Qué hace `exportLocalData` (el diálogo de
>   migración) con el fallo?
> - El coste: mientras la cola no se lee, la UI no cuenta las de disco. ¿Algo más decide con
>   `pendingWrites`?
>
> **Pendiente, NO salvo que te lo pida:** `R9-240` (Modo C, con mi OK), `R9-126` (con la nota de la
> 49), `R9-235`, `R9-241`, `R9-211`, `R9-213`, `R9-201`..`R9-203`, `R9-198`, `R9-205`, `R9-177`,
> `R9-38` (con mi decisión de `R9-59`), `A12`, `R9-164`, `R9-127`, `R9-173`, la parte de
> `MemoryDeckContext` de `R9-133`; mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota
> del piso de no asentados y `R9-158`.

**(ac) Sesión 49: arreglar `R9-212` y `R9-214` — ya HECHO en la sesión 49, en un chat nuevo, en la
terminal y sin agentes.** El mensaje está en `_scratch/S49-PROMPT.md`.

**(ab) Sesión 48: arreglar lo de la 47 — ya HECHO en la sesión 48, en el mismo chat, en la
terminal y sin agentes.** Las herramientas de hoy: la base `S48-SyncEngine-final.ts.txt` y
`S48-motor.cjs.txt` (no uses `S46-motor` ni `S45-motor`).

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (ab) y la sección 5), `detail/S47-revision-del-diff-s46.md` y, en `BUGS.md`, `R9-253`. En
> la memoria, la de la sesión 47.
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes solo si te los pido. Este chat
> gasta mi cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s47-diff-s46`, pedime el OK para el fast-forward.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 253.
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión arregla lo de la 47:** `R9-253`, solo el comentario de `R9-252` en la rama del
> conflicto retenido de `applyRemoteChange` («a restored backup below the floor settled it
> already, R9-190»). Después, una base nueva para las piezas (`S48-SyncEngine-final.ts.txt`) y un
> `S48-motor.cjs.txt` que la restaure. El motor no cambia: sin la matriz.

**(aa) Sesión 47: revisar el diff de la 46 — ya HECHO en la sesión 47, en el mismo chat, en la
terminal y sin agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (aa) y la sección 5), `detail/S46-arreglos-s45.md` y, en `BUGS.md`, los cierres de la 46
> (al final de `R9-251` y `R9-252`, y las notas de `R9-246` y `R9-247`). En la memoria, la de la
> sesión 46 y la regla fija de las pruebas (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s46-arreglos-s45` y `docs/review-s46-fix-s45`, pedime el OK
>   para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 252.
> - **Las herramientas** (en `_scratch`): la base `S46-SyncEngine-final.ts.txt` (= el motor de
>   `e57fa16`; el de `c429604` con tres comentarios), las piezas `S44-piezas.cjs.txt`, las sondas
>   `S45-sondas1..3.body.txt`, `S38-sonda.cjs.txt`, `S46-motor.cjs.txt` (como `S45-motor`, pero
>   restaura la base de la 46; no uses `S45-motor`), `S34-rev.cjs.txt` y la matriz
>   `S44-matriz.cjs.txt`. **`S32_BASE` y `S34_PIEZAS`, con la ruta ABSOLUTA.**
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión revisa el diff de la 46** (`b1f83f8..e57fa16`: la prueba de `R9-251` y tres
> comentarios), sin tocar código. Preguntas para empezar:
>
> - la prueba de `R9-251`: ¿sus controles del mecanismo (el conflicto en memoria, `lecturas` 1 y 2) fallan si el orden cambia (la relectura antes de la reversión)? ¿Cae también con otra pieza
>   que no sea `R247unread`?
> - el comentario de `R9-252`: ¿dice la verdad entera de las tres formas de asentarse?
>
> `R9-240` es Modo C en el emulador: solo con mi OK.

**(z) Sesión 46: arreglar lo de la 45 — ya HECHO en la sesión 46, en el mismo chat, en la terminal
y sin agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (z) y la sección 5), `detail/S45-revision-del-diff-s44.md` y, en `BUGS.md`, `R9-252` y
> las notas de la 45 al final de `R9-251`, `R9-245`, `R9-246`, `R9-247`, `R9-248` y `R9-249`. En la
> memoria, la de la sesión 45 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s45-diff-s44`, pedime el OK para el fast-forward.
>   Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 252.
> - **Las herramientas** (en `_scratch`): las sondas `S45-sondas1..3.body.txt`, las piezas
>   `S44-piezas.cjs.txt`, la base `S44-SyncEngine-R250.ts.txt` (= el motor de `c429604`),
>   `S38-sonda.cjs.txt`, `S45-motor.cjs.txt`, `S34-rev.cjs.txt` y la matriz `S44-matriz.cjs.txt`.
>   **`S32_BASE` y `S34_PIEZAS`, con la ruta ABSOLUTA.**
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión arregla lo de la 45**, un commit por hallazgo, cada prueba vista caer con su pieza:
>
> - `R9-251`: la prueba de la guarda `ownUnread`, de `S45-1` (con el control en la misma
>   aserción); tiene que caer con `R247unread` (en la 45 da, sin la guarda, «lo mio nuevo | mi
>   respaldo» tras reiniciar);
> - `R9-252`: es una decisión mía (guardar «lo suyo» en disco con la marca, o aceptar que una
>   escritura mía con el conflicto pendiente lo cierra en el próximo reinicio). Preguntame antes;
> - si cabe, los dos comentarios: el de la prueba de la lectura sola (`R9-246`) y la premisa de
>   `queryFloors` (`R9-247`).
>
> `R9-240` es Modo C en el emulador: solo con mi OK.

**(y) Sesión 45: revisar el diff de la 44 — ya HECHO en la sesión 45, en la terminal y sin
agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (y) y la sección 5), `detail/S44-arreglos-s43.md` y, en `BUGS.md`, los cierres de la 44
> (al final de `R9-245`..`R9-250`) y `R9-251`. En la memoria, la de la sesión 44 y la regla fija de
> las pruebas (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s44-arreglos-s43` y `docs/review-s44-fix-s43`, pedime el OK
>   para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 251.
> - **Las herramientas** (en `_scratch`): las piezas `S44-piezas.cjs.txt` (reexporta las de la 43;
>   cada pieza de la 44 va sobre la base de su commit, `S44-SyncEngine-R245/R247/R248/R249.ts.txt`),
>   la última base `S44-SyncEngine-R250.ts.txt` (= el motor de `c429604`), las sondas
>   `S44-sondas1..3.body.txt`, `S38-sonda.cjs.txt`, `S34-rev.cjs.txt` y la matriz
>   `S44-matriz.cjs.txt`. **`S32_BASE` y `S34_PIEZAS`, con la ruta ABSOLUTA.**
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión revisa el diff de la 44** (`a731c23..c429604`: `SyncEngine.ts`, `types.ts` y
> `SyncEngine.test.ts`), sin tocar código. Preguntas para empezar:
>
> - `queryFloors` (`R9-247`): ¿el piso del listener es siempre el que aplica el SDK a esa entrega
>   (un re-enganche en la misma sesión, la consulta sin filtro)? ¿Una reversión `removed` puede
>   volver a una copia MÍA con un reloj que ya no está en memoria (retirado antes, o de otro
>   proceso), y la retirada al llegar se la quita a la lectura?
> - `R9-251`: buscar un orden con daño para la guarda `ownUnread` (la relectura después de las dos
>   retiradas, con el doc todavía en conflicto), o medir que no lo hay y proponer quitarla.
> - `H43propia` (`R9-245`): ¿qué entregas mías con una escritura en la cola dejan de aplicarse
>   ahora y antes se aplicaban bien? (la del eco con la referencia atrasada de `R9-174`, una
>   lápida en la cola).
> - `takeBack` (`R9-248`): ¿una entrega que no es la reversión puede traer el reloj del payload
>   rechazado (el otro con el mismo milisegundo, el payload igual a la nube)?
> - `R9-249`: el ack que llega después de un `stop()` cambia el `own` de una entrada aparcada:
>   ¿cuándo llega eso al disco, y qué pasa si entró otra cuenta en medio?
>
> `R9-240` es Modo C en el emulador: solo con mi OK.
>
> **Pendiente, NO salvo que te lo pida:** lo mismo que en el (q).

**(x) Sesión 44: arreglar lo de la 43 — ya HECHO en la sesión 44, en la terminal y sin agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (x) y la sección 5), `detail/S43-revision-del-diff-s42.md` y, en `BUGS.md`, las entradas
> `R9-247`..`R9-250` y las notas de la 43 al final de `R9-245`, `R9-246`, `R9-243`, `R9-242` y
> `R9-234`. En la memoria, la de la sesión 43 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s43-diff-s42`, pedime el OK para el fast-forward.
>   Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 250.
> - **Las herramientas** (en `_scratch`): las piezas `S43-piezas.cjs.txt` (reexporta las de la 42;
>   trae `R238hoy`, el log `L43llega` y las hipótesis `H43suelo`, `H43drop`, `H43aparcada` y
>   `H43propia`), la base `S42-SyncEngine-R243.ts.txt` (= el motor de `1a77b78`), las sondas
>   `S43-sondas1..7.body.txt`, `S38-sonda.cjs.txt`, `S43-motor.cjs.txt` (como `S41-motor`, pero
>   restaura la base de hoy; commiteá antes), `S34-rev.cjs.txt` y la matriz `S42-matriz.cjs.txt`.
>   **`S32_BASE` y `S34_PIEZAS`, con la ruta ABSOLUTA.**
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión arregla lo de la 43**, un commit por hallazgo, cada prueba vista caer con su pieza:
>
> - `R9-246`: las pruebas de las dos guardas, de `S43-1` (cae con `R238hoy`) y `S43-5` (cae con
>   `R234mem`);
> - `R9-245`, con `H43propia` (medida: cierra `S43-7` y la suite pasa 256/256): la prueba, de `S43-7`;
> - `R9-247` (`H43suelo`, cierra `S43-2`) y `R9-248` (`H43drop`, cierra `S43-3`), medidas también
>   juntas; `H43suelo` necesita el piso de la query en el motor: decidí dónde vive;
> - `R9-249`, con `H43aparcada` (cierra `S43-6`);
> - `R9-250`: el comentario de `ownRetired` y lo que anota la retirada al llegar.
>
> Después, la matriz entera. `R9-240` es Modo C en el emulador: solo con mi OK.

**(w) Sesión 43: revisar el diff de la 42 — ya HECHO en la sesión 43, en la terminal y sin agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (w) y la sección 5), `detail/S42-arreglos-s41.md` y, en `BUGS.md`, los cierres de la 42
> (al final de `R9-242`, `R9-234`, `R9-244`, `R9-243` y `R9-229`), las notas de la 42 en `R9-240` y
> `R9-238`, y `R9-245` y `R9-246`. En la memoria, la de la sesión 42 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s42-arreglos-s41` y `docs/review-s42-fix-s41`, pedime el OK
>   para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 246.
> - **Las herramientas** (en `_scratch`): las piezas `S42-piezas.cjs.txt` (reexporta las de la 41,
>   la 40, la 39 y la 38, y las de `R9-218`), la última base `S42-SyncEngine-R243.ts.txt` (= el
>   motor de `1a77b78`), `S38-sonda.cjs.txt`, `S41-motor.cjs.txt` (el motor va por NOMBRE dentro de
>   `_scratch`, y restaura su base de la 40 encima aunque falle: commiteá antes) y la matriz
>   `S42-matriz.cjs.txt`. **`S32_BASE` y `S34_PIEZAS`, con la ruta ABSOLUTA.**
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión revisa el diff de la 42** (`2d8eb49..1a77b78`: `SyncEngine.ts`, `types.ts` y
> `SyncEngine.test.ts`), sin tocar código. Preguntas para empezar:
>
> - `rejectedAwaitingRevert` (`R9-243`): ¿qué entregas consumen la anotación antes que la reversión?
>   ¿Un rechazo cuya reversión no llega (`stop()`, datos iguales a la nube) deja una anotación que
>   tapa un `removed` del otro más adelante? ¿Y el `removed` que llega con mi escritura en vuelo
>   pero es del otro (¿lo permite el SDK?)?
> - `ownRetired` (`R9-234`): ¿qué otras retiradas con la tabla ilegible hacen falta corregir con la
>   relectura (la de la lectura de un `removed`, `R9-238`)? ¿Hay un orden en que la guarda de memoria
>   (`R234mem`) decida sola?
> - `H41own` (`R9-242`): el `own` de la entrada aparcada tras un `stop()` con la subida en vuelo
>   (leído en la entrada); ¿qué más lee el `own` de una entrada después del ack de otra?
> - `R9-246`: la retirada de la lectura de un `removed` (`R9-238`) quedó en 0 en la matriz: ¿se
>   construye el `removed` sintético de `R9-186`, o el eco de mi escritura, con una copia ajena en la
>   lectura y un daño visible? Si no, medilo y proponé quitarla.
> - `R9-245`: diagnosticarlo (¿por qué tras reiniciar «mi respaldo» contra «w1 mio», si el sello de
>   W1 está en la tabla?).
>
> `R9-240` es Modo C en el emulador: solo con mi OK.
>
> **Pendiente, NO salvo que te lo pida:** lo mismo que en el (q).

**(v) Sesión 42: arreglar lo de la 41 — ya HECHO en la sesión 42, en la terminal y sin agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (v) y la sección 5), `detail/S41-revision-del-diff-s40.md` y, en `BUGS.md`, las entradas
> `R9-242`..`R9-244` y las notas de la 41 al final de `R9-234`, `R9-236`, `R9-238`, `R9-229` y
> `R9-240`. En la memoria, la de la sesión 41 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s41-diff-s40`, pedime el OK para el fast-forward.
>   Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 244.
> - **Las herramientas** (en `_scratch`): las piezas `S41-piezas.cjs.txt` (reexporta las de la 40,
>   la 39 y la 38; trae `Q41own`, `Q41sello`, `Q41llegada` y las hipótesis `H41own` y
>   `H41removed`; `H239join` viene de la 40), la base `S40-SyncEngine-R236.ts.txt` (= el motor de
>   `e9d6e89`), `S38-sonda.cjs.txt`, `S41-motor.cjs.txt`, `S34-rev.cjs.txt` y la matriz
>   `S40-matriz.cjs.txt`. **`S32_BASE` y `S34_PIEZAS`, con la ruta ABSOLUTA** (relativa, la pieza no
>   se aplica y la sonda «pasa»). `S38-sonda` restaura la base encima de `SyncEngine.ts`: no la
>   corras con cambios del motor sin commitear.
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión arregla lo de la 41**, un commit por hallazgo, cada prueba vista caer con su pieza:
>
> - `R9-242`, con `H41own` (medida: cierra `S41-1` y `S41-2`, y la suite pasa 250/250): la prueba,
>   de esas dos sondas;
> - `R9-234`, con lo que queda de `R9-239`: `H239join` cierra `S41-6`, y tumba la prueba de `R9-218`,
>   que espera el sello sembrado unido al nuevo (la semántica de antes de `R9-239`): decidilo;
> - `R9-244`: la prueba de `R9-160` con el orden de `S41-3` (cae con `Q41llegada`);
> - `R9-243`: falta el diseño (`H41removed` lo cierra y tumba `R9-190`, mi propio respaldo); medí
>   antes de tocar nada;
> - el comentario de la prueba del bucle de `R9-229` (solo 60 lecturas son el bucle).
>
> Después, la matriz entera. `R9-240` es Modo C en el emulador: solo con mi OK.
>
> **Pendiente, NO salvo que te lo pida:** lo mismo que en el (q).

**(u) Sesión 41: revisar el diff de la 40 — ya HECHO en la sesión 41, en la terminal y sin
agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (u) y la sección 5), `detail/S40-arreglos-s39.md` y, en `BUGS.md`, los cierres de la 40
> (al final de `R9-229` y de `R9-236` a `R9-240`) y `R9-241`. En la memoria, la de la sesión 40 y la
> regla fija de las pruebas (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s40-arreglos-s39` y `docs/review-s40-fix-s39`, pedime el OK
>   para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 241.
> - **Las herramientas** (en `_scratch`): las piezas `S40-piezas.cjs.txt` (reexporta las de la 39 y
>   la 38), la última base `S40-SyncEngine-R236.ts.txt` (= `f83a7f8`, que es también el motor de
>   `e9d6e89`), `S38-sonda.cjs.txt`, `S39-motor.cjs.txt` (para el motor de `0b84a7e`, usá
>   `S39-SyncEngine-base.ts.txt`) y la matriz `S40-matriz.cjs.txt`. **`S38-sonda` restaura la base
>   encima de `SyncEngine.ts`:** no la corras con cambios del motor sin commitear.
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión revisa el diff de la 40** (`4f1ce9a..e9d6e89`: `SyncEngine.ts` y
> `SyncEngine.test.ts`), sin tocar código. Preguntas para empezar:
>
> - con un solo reloj en `recentAcked` y en `ownStamps`, ¿qué casos dependen ahora solo del
>   veredicto de la llegada (`ownArrived`)? ¿Hay un orden, en el mock o en el SDK, en que un eco
>   LLEGUE después del ack de una escritura posterior (`R9-240`)?
> - las dos pruebas a las que la 40 les cambió el orden (la del eco tardío de `R9-160` y la de
>   `R9-224`): ¿el orden nuevo es uno que el SDK produce, y siguen probando lo que dice su nombre?
> - `retireOwn` desde la lectura: ¿qué otros caminos traen copias ajenas sin pasar por el callback
>   ni por la lectura (el enganche, `rereadOwn`)? ¿Y una copia mía leída que `isOwnCopy` no reconoce
>   (la tabla ilegible, `R9-208`)?
> - `Fresolve` se quedó: ¿la prueba nueva mide de verdad el eco sin procesar? ¿Hay otra guarda que
>   suelte sellos y dependa del eco?
> - lo que queda de `R9-239` (`rereadOwn` y las tablas viejas) y `R9-241`.
>
> `R9-240` es Modo C en el emulador: solo con mi OK.
>
> **Pendiente, NO salvo que te lo pida:** lo mismo que en el (q).

**(t) Sesión 40: arreglar lo de la 39 — ya HECHO en la sesión 40, en la terminal y sin agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (t) y la sección 5), `detail/S39-revision-del-diff-s38.md` y, en `BUGS.md`, las entradas de
> `R9-236` a `R9-240`. En la memoria, la de la sesión 39 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s39-diff-s38`, pedime el OK para el fast-forward.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 240.
> - **Las herramientas** (en `_scratch`): las sondas `S39-sondas{,2,3,4}.body.txt`, las piezas
>   `S39-piezas.cjs.txt` (incluye las de la 38), la base `S39-SyncEngine-base.ts.txt` (= `0b84a7e`),
>   el motor de la 36 `S39-SyncEngine-36.ts.txt` con `S39-motor.cjs.txt`, y `S38-sonda.cjs.txt`,
>   `S34-rev.cjs.txt` y la matriz `S38-matriz.cjs.txt`.
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión arregla**, en una rama `fix/...`, un commit por hallazgo, cada prueba vista fallar
> con su pieza revertida:
>
> 1. **`R9-237` primero** (lo abrió la 38): `recentAcked` con solo los relojes del último ack (quitar
>    `207acum` y `207fold` juntas). `S39-2` es la prueba. Ya se midió 242/242 en la suite; falta la
>    matriz entera (corolario 46).
> 2. **`R9-239`:** la misma idea para `ownStamps`, medida contra `R9-193` y `R9-208`.
> 3. **`R9-238`:** que la lectura de un `removed` retire lo mismo que `noteArrived` cuando la copia
>    leída no es mía.
> 4. **`R9-236`:** la prueba de `Fsettle` (`S39-5`) y, por la regla 37, quitar `Fresolve`, con la
>    matriz entera después.
> 5. **`R9-229`:** la prueba del bucle (`S39-7`: la lectura de las tablas que no vuelve desde la 60).
>
> `R9-240` es Modo C en el emulador: solo con mi OK.
>
> **Pendiente, NO salvo que te lo pida:** lo mismo que en el (q).

**(s) Sesión 39: revisar el diff de la 38 — ya HECHO en la sesión 39, en la terminal y sin agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (s) y la sección 5), `detail/S38-arreglos-s37.md` y, en la memoria, la de la sesión 38 y
> la regla fija de las pruebas (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s38-arreglos-s37` y `docs/review-s38-fix-s37`, pedime el OK
>   para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 236.
> - **Las herramientas** (en `_scratch`): `S38-sonda.cjs.txt` (piezas + sonda + restore + controles),
>   `S38-todas.cjs.txt` (las 9 sondas de `R9-220`..`R9-224`), las piezas en `S38-piezas.cjs.txt`, las
>   bases `S38-SyncEngine-*.ts.txt` (la última, `R226`; guardá una nueva si el motor cambió desde
>   `82f3f20`) y la matriz `S38-matriz.cjs.txt` (`S32_ROOT=<worktree>`, `check` para las anclas).
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión revisa el diff de la 38** (`29c63c3..0b84a7e`: `SyncEngine.ts`, `types.ts` y
> `SyncEngine.test.ts`), sin tocar código. Preguntas para empezar:
>
> - `noteArrived` decide al LLEGAR la entrega: ¿qué otros caminos entregan copias sin pasar por el
>   callback de `onSnapshot` (la lectura de un `removed`, los `removed` sintéticos de `R9-186`, el
>   enganche) y qué veredicto reciben?
> - Una copia ajena retira `recentAcked`, el `own` de la cola y `ownStamps`: ¿hay una copia que el
>   motor tome por ajena y sea mía (la tabla ilegible, `R9-234`; otra versión de la app; el reloj de
>   otra cuenta)?
> - La guarda por cuenta de `R9-226` (`ownStampsUid`): ¿quién más escribe en `ownStamps` antes del
>   enganche?
> - `R9-236` (cuatro guardas viejas en 0 en la matriz: ¿falta la prueba o se quitan?), `R9-235` y la
>   mitad abierta de `R9-229`.
>
> **Pendiente, NO salvo que te lo pida:** lo mismo que en el (q).

**(r) Sesión 38: arreglar lo de la 37 — ya HECHO en la sesión 38, en la terminal y sin agentes.**

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (r) y la sección 5) y, en la memoria, la de la sesión 37 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s37-diff-s36`, pedime el OK para el fast-forward. Antes
>   de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 233. El detalle de la 37 está en
>   `detail/S37-revision-del-diff-s36.md`; los informes de sus 7 agentes, en
>   `_scratch/S37-A{1..7}-informe.md.txt`, con las sondas y salidas bajo el prefijo `S37-A<n>-`. Las
>   sondas de los agentes tienen el `ROOT` de su worktree, que ya no existe: cambialo al árbol
>   principal (o a tu worktree).
> - **Las herramientas:** el runner de sondas es `_scratch/S31-run.cjs.txt` (arma
>   `__tests__/S31sonda.test.ts`: borralo a mano después); el revert por pieza, `S34-rev.cjs.txt` con
>   `S32_BASE=S36-SyncEngine-base.ts.txt` y `S34_PIEZAS=S36-piezas.cjs.txt`; la matriz,
>   `S36-matriz.cjs.txt`; el mock con copias frescas, `S37b-frescos-suite.cjs.txt`.
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión arregla**, en una rama `fix/...`, un commit por hallazgo, cada prueba vista fallar
> primero (y revert por pieza). Ninguno tiene el arreglo medido: medí la hipótesis antes de elegir
> (corolario 33). En este orden:
>
> - **`R9-221` PRIMERO** (el mock entrega el mismo objeto en las re-entregas, y RNFirebase uno
>   nuevo): las dos líneas de `structuredClone` en el mock de `SyncEngine.test.ts` (`deliver` y el
>   `get()` del doc; ver `S37b-frescos-suite.cjs.txt`). **Con el mock arreglado, re-medí cada prueba de
>   `R9-216` (y las 5 de `R9-207`) con su pieza revertida ANTES de tocar el motor:** la identidad que
>   esas pruebas miden en jest no es la del teléfono. Si alguna deja de caer, decilo y reescribila;
> - **`R9-220` y `R9-222`**, que son la misma pregunta (cuándo deja de valer un eco anotado). La
>   hipótesis de A1: el eco anotado deja de valer solo cuando el doc entrega después una copia que no
>   es mía. Medila contra las 3 pruebas de `R9-216` y las 5 de `R9-207`, y contra las sondas
>   `S37-A1-rendirse` y `S37-A2-sonda-{sineco,bajo,r217b}`;
> - **`R9-223` y `R9-224`** (la cola y `ownStamps`, dos ramas de `isOwnCopy` que no miran el eco):
>   sondas `S37-A5-sonda-cola` y `S37-A2-sonda-stamps`;
> - **`R9-225`** (la memoria de `recentEchoed`): hipótesis, una marca de la entrega en vez de la copia,
>   y vaciarla en `stop()`;
> - **`R9-226`** (la guarda por uid de `R9-217`: es tu decisión, con el porqué medido) con la prueba
>   `S37-A3-antes2`, y **`R9-227`** (el descarte con la tabla ilegible);
> - **`R9-228`..`R9-233`**, pruebas y textos de la 36: las sondas `S37-A3-gaveup2` y `S37-A3-fifo` y
>   las correcciones que propone el informe de A4;
> - re-medí la matriz entera al final, con las piezas nuevas.
>
> **Pendiente, NO salvo que te lo pida:** lo mismo que en el (q).

**(q) Sesión 37: revisar el diff de la 36 — ya HECHO en la sesión 37, en la terminal con 7 agentes que
solo midieron.** Queda aquí como registro. Lo que valió fue `_scratch/S37-PROMPT.md`, y el checkpoint
lo terminó un chat nuevo con `_scratch/S37b-PROMPT.md`.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (q) y la sección 5) y, en la memoria, la de la sesión 36 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s36-r215-r219` y `docs/review-s36-fix-s35`, pedime el OK para
>   el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 219. El detalle de la 36 está en
>   `detail/S36-arreglos-s35.md`.
> - **Las herramientas:** el revert por pieza es `_scratch/S34-rev.cjs.txt` con
>   `S32_BASE=S36-SyncEngine-base.ts.txt` y `S34_PIEZAS=S36-piezas.cjs.txt`; la matriz,
>   `S36-matriz.cjs.txt`, que la arma `S36-mkmatriz.cjs.txt` desde `S34-matriz.cjs.txt` y
>   `S36-bloque.cjs.txt` (`S32_ROOT=<worktree>`, `S32_FULL=1`, `check` para ver las anclas).
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión revisa el diff de la 36** (`d15cd71..2bfbcf8`: `SyncEngine.ts` y
> `SyncEngine.test.ts`), en local, sin tocar código. Como mínimo:
>
> - **`R9-216`, la pieza más delicada:** `noteEcho` anota la copia que trajo primero cada reloj, e
>   `isOwnCopy` acepta un reloj de `recentAcked` solo en esa copia (por identidad del objeto).
>   ¿Hay entregas legítimas del mismo reloj en otra copia (un re-enganche en el mismo proceso, una
>   lectura tras un `removed`, el mismo doc dos veces en un lote) donde ahora aparezca «lo mío contra
>   lo mío»? ¿Y el reloj cuyo eco nunca llega (dos escrituras que el SDK junta)? Medilo.
> - **`R9-218`:** `ownGaveUp` vive hasta la escritura siguiente; ¿algún camino lo deja sin vaciar
>   entre sesiones?
> - **`R9-217`:** la entrada nueva lleva el último sello de `ownStamps`; ¿cuál es «el último» cuando
>   la tabla se unió en una relectura (el orden de `withStamp`)?
> - **`R9-215`:** la guarda del `delete` se quitó por equivalente; ¿una relectura duplicada puede
>   escribir en un orden peor?
> - Las 7 pruebas nuevas: ¿su nombre y su comentario dicen solo lo que miden?
> - Re-medí la matriz entera.
> - Lo nuevo se registra desde `R9-220`. Checkpoint en una rama `docs/...`, sin mergear sin mi OK.
>
> **Pendiente, NO salvo que te lo pida:** lo mismo que en el (p), salvo `R9-215`..`R9-219`.

**(p) Sesión 36: arreglar lo de la 35 — ya HECHO en la sesión 36, en el mismo chat que la 35 y sin
agentes.** Queda aquí como registro.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (p) y la sección 5) y, en la memoria, la de la sesión 35 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s35-diff-s34`, pedime el OK para el fast-forward.
>   Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 219. El detalle de la 35 está en
>   `detail/S35-revision-del-diff-s34.md`; sus sondas, en `_scratch/S35-sonda-*.body.txt` (con el
>   runner `S31-run.cjs.txt`, que arma `__tests__/S31sonda.test.ts`: borralo a mano después), y
>   sus salidas en `S35-sonda-*.out.txt`.
> - **Las herramientas:** el revert por pieza es `_scratch/S34-rev.cjs.txt` (`S32_ROOT`,
>   `S32_BASE`, `S34_PIEZAS`; la base de la 35 es `S35-SyncEngine-base.ts.txt`); la matriz,
>   `S34-matriz.cjs.txt` (`S32_ROOT=<worktree>`, `S32_FULL=1`, `check` para ver las anclas); las
>   piezas de `R9-210`, `S34-A3-piezas.cjs.txt` (`S34_ROOT` obligatorio; su `--restore` es un
>   `git checkout`).
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0.
>
> **Esta sesión arregla**, en una rama `fix/...`, un commit por hallazgo, cada prueba vista fallar
> primero (y revert por pieza), sobre `SyncEngine.ts`. Ninguno tiene arreglo medido: medí la
> hipótesis antes de elegir (corolario 33). Cada sonda de la 35 sirve de partida para la prueba:
>
> - **`R9-215`** (`ownRereading` sobrevive al `stop()`): la sonda `rereading`; hipótesis: el
>   conjunto por sesión, y que la relectura de una sesión terminada no tape la siguiente;
> - **`R9-218`** (`force` de toda la escritura): la sonda `dos` (estado sembrado); hipótesis:
>   `force` solo para la colección cuya relectura falló;
> - **`R9-216`** (el «mía» de `recentAcked` ante un respaldo con mi escritura): las sondas
>   `respaldo` y `retenida`; hipótesis: un reloj cuyo eco ya llegó deja de ser «mío». Ojo con
>   `R9-207` (sus 5 pruebas) y con la regla de una sola respuesta a «¿es mía?»;
> - **`R9-217`** (el coste aceptado de `R9-208`): la sonda `coste`, caso (a); hipótesis: la entrada
>   nueva lleva también el último sello propio del doc. Decí en la prueba de `fantasmaC` lo que
>   pasa con doc-d;
> - **`R9-219`** (el comentario de `R9-206`): corregir la premisa; sin prueba (es un comentario);
> - re-medí la matriz entera al final, con las piezas nuevas.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-211`..`R9-214`, los nuevos de la 34 (solo `R9-214` tiene la hipótesis medida);
> - `R9-201`..`R9-203` y `R9-198`, sin arreglo medido (medí antes de elegir);
> - `R9-205` (va con `R9-38`); `R9-177` (Modo C en el emulador, con mi OK), que también cierra el
>   orden «rechazo antes que reversión» del que dependen `R9-182` y `R9-201`;
> - `R9-38`, que depende de `R9-59`; terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b));
> - `R9-126` (el `set({merge:true})` incondicional; la 33 le agregó una traza con un conflicto que se
>   pierde tras reiniciar);
> - la parte de `MemoryDeckContext` de `R9-133`;
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(o) Sesión 35: revisar el diff de la 34 — ya HECHO en la sesión 35, en la terminal y sin
agentes.** Queda aquí como registro. Lo que valió fue `_scratch/S35-PROMPT.md`: corregía el estado
(la 34 ya estaba mergeada) y agregaba preguntas (el coste de `R9-208` medido, la rama retenida de
`R9-207` con sonda, `+heldAt`, la factoría de `R9-210`).

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (o) y la sección 5) y, en la memoria, la de la sesión 34 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s34-r207-r210` y `docs/review-s34-fix-s33`, pedime el OK para
>   el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 214. El detalle de la 34 está en
>   `detail/S34-arreglos-s33.md`; los informes de los agentes, sus sondas y sus tablas, en
>   `_scratch/S34-*.txt`.
> - **Las herramientas:**
>   - el revert por pieza es `_scratch/S34-rev.cjs.txt` (`S32_ROOT`, `S32_BASE`, `S34_PIEZAS`);
>   - la matriz es `S34-matriz.cjs.txt`, que la arma `S34-mkmatriz.cjs.txt` desde `S32-matriz` y
>     `S34-piezas.cjs.txt` (`S32_ROOT=<worktree>`, `S32_FULL=1`, `check` para ver las anclas);
>   - las piezas de `R9-210` van aparte, con `S34-A3-piezas.cjs.txt` (`S34_ROOT` obligatorio; su
>     `--restore` es un `git checkout`).
> - **El control de NUL es `tr -cd '\000' < src/lib/sync/SyncEngine.ts | wc -c`**, que tiene que dar 0. `grep -c $'\x00'` cuenta todas las líneas.
>
> **Esta sesión revisa el diff de la 34** (`17788ae..682f852`: `SyncEngine.ts`,
> `FavoritesContext.tsx`, `SyncEngine.test.ts` y `favoritesGetLocalRow.test.tsx`), en local:
>
> - **`R9-208`, la pieza más grande:** `persistQueue` se difiere mientras se relee una tabla
>   ilegible (`ownUnread`, `rereadOwn`, `force`).
>   - ¿Algún `await this.persistQueue()` cuenta con que la cola ya esté en disco al volver?
>   - ¿Qué pasa con dos colecciones ilegibles a la vez, o con una relectura que vuelve después de un
>     `stop()`/`start()` de la MISMA cuenta?
> - **`R9-207`, la decisión:** `isOwnCopy` ahora responde también desde memoria (`recentAcked`, sin
>   plazo). ¿Hay alguna rama donde un «mía» de más SUELTE algo que no debía (corolario 42)? La rama
>   retenida se analizó leyendo, sin sonda (informe de A2, §7).
> - **`R9-210`:** `getLocal` espera a `initialize()`. ¿Hay algún camino del motor que llame a
>   `getLocal` antes de que exista la base y ahora espere de más, o para siempre?
> - **`R9-209`:** su vecina, la lápida del otro (`R9-211`), sigue abierta.
> - **Las 18 pruebas nuevas:** ¿su nombre y su comentario dicen solo lo que miden? Las 2 de control
>   de `R9-208` pasan sin el arreglo a propósito.
> - Re-medí la matriz entera con `_scratch/S34-matriz.cjs.txt`, y las piezas de `R9-210` aparte.
> - Lo nuevo se registra desde `R9-215`. Checkpoint en una rama `docs/...`, sin mergear sin mi OK.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-211`..`R9-214`, los nuevos de la 34 (solo `R9-214` tiene la hipótesis medida);
> - `R9-201`..`R9-203` y `R9-198`, sin arreglo medido (medí antes de elegir);
> - `R9-205` (va con `R9-38`); `R9-177` (Modo C en el emulador, con mi OK), que también cierra el
>   orden «rechazo antes que reversión» del que dependen `R9-182` y `R9-201`;
> - `R9-38`, que depende de `R9-59`; terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b));
> - `R9-126` (el `set({merge:true})` incondicional; la 33 le agregó una traza con un conflicto que se
>   pierde tras reiniciar);
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(n) Sesión 34: arreglar lo de la 33 — ya HECHO en la sesión 34, en la terminal con 3 agentes
que solo midieron.** Queda aquí como registro. Lo que valió fue `_scratch/S34-PROMPT.md`: corregía el
estado (la 33 ya estaba mergeada), delegaba `R9-207` y pedía mirar la lápida vecina de `R9-209`.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (n) y la sección 5) y, en la memoria, la de la sesión 33 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s33-diff-s32`, pedime el OK para el fast-forward.
>   Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 210. El detalle de la 33 está en
>   `detail/S33-revision-del-diff-s32.md`, y sus sondas en `_scratch/S33-sonda-*.body.txt` (con el
>   runner `S31-run.cjs.txt`, que arma `__tests__/S31sonda.test.ts`: borralo a mano después) y sus
>   salidas en `S33-sonda-*.out.txt`. El revert por pieza es `_scratch/S33-rev.cjs.txt` (`--save`
>   primero); la matriz sigue siendo `S32-matriz.cjs.txt` (`S32_ROOT=<worktree>`, `S32_FULL=1`).
>
> **Esta sesión arregla**, en una rama `fix/...`, un commit por hallazgo, cada prueba vista fallar
> primero (y revert por pieza), sobre `SyncEngine.ts` (y `FavoritesContext.tsx` para `R9-210`).
> Ninguno tiene arreglo medido: medí la hipótesis antes de elegir (corolario 33).
>
> - **`R9-209`** (la rama `pending` sin copia local no pregunta `isOwnCopy`): la sonda `NULL` es la
>   prueba; la hipótesis es una línea;
> - **`R9-208`** (los sellos ilegibles en un arranque y el ack siguiente los borra): la sonda `OWN
con-otra`; hipótesis: no escribir la tabla de una colección que no se pudo leer en esa sesión, o
>   releer y unir;
> - **`R9-207`** (el eco de W1 procesado después del ack de W2): la sonda `W`; hipótesis: que el ack
>   de un doc sin conflicto conserve los relojes de la entrada (el suyo y su `own`) por
>   `CONFLICT_WINDOW_MS`, y que solo la ventana de 30 s los consulte. Ojo con `+Y` y con la regla de
>   una sola respuesta a «¿es mía?» (`isOwnCopy`): decidí con porqué y dejalo escrito;
> - **`R9-210`** (keepMine con el ref atrasado de favoritos): la sonda `3a`; hipótesis: la de
>   `R9-174` (actualizar el ref donde se escribe la fila) o un `getLocal` que lea SQLite;
> - re-medí la matriz entera al final, con las piezas nuevas.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-201`..`R9-203` y `R9-198`, sin arreglo medido (medí antes de elegir);
> - `R9-205` (va con `R9-38`); `R9-177` (Modo C en el emulador, con mi OK), que también cierra el
>   orden «rechazo antes que reversión» del que dependen `R9-182` y `R9-201`;
> - `R9-38`, que depende de `R9-59`; terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b));
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(m) Sesión 33: revisar el diff de la 32 — ya HECHO en la sesión 33, solo en la terminal y sin
agentes.** Queda aquí como registro; lo que valió fue `_scratch/S33-PROMPT.md`, que corregía el
estado (la 32 ya estaba mergeada) y agregaba cuatro preguntas sin medir.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (m) y la sección 5) y, en la memoria, la de la sesión 32 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s32-r192-r193-y-s31` y `docs/review-s32-fix-s31`, pedime el
>   OK para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 206. El detalle de la 32 está en
>   `detail/S32-arreglos-s31.md`, y sus tablas, sondas y scripts en `_scratch/S32-*.txt`.
>
> **Esta sesión revisa el diff de la 32** (`b26ab8d..c1664a5`: `SyncEngine.ts`, `types.ts` y
> `SyncEngine.test.ts`), en local:
>
> - **las piezas nuevas:** los sellos persistidos (`ownStamps`, `PendingWrite.own`, la cola y la
>   tabla en un solo `multiSet`, `pushing` en `stop()`); `isOwnCopy` en la ventana de 30 s y en las
>   dos ramas (con `!==` en la `pending`); `recentAcked` (`+Y`); `refreshTheirs` (P2); la guarda de
>   `R9-197` (`ownQueued`); H1c; H5; y el re-sellado de keepMine (C4, un `await` nuevo en
>   `resolveConflict`);
> - **lo que se quitó:** los dos `fromRead` (P3 de `R9-192` y el de la rama retenida) y
>   `remoteTs === heldAt` (`R9-206`). ¿Queda alguna copia del otro que ya no llegue a «su versión»
>   porque solo la toman las ramas A y B? Quitar `heldAt` dejó sin caer a `S181-marca` hasta su prueba
>   nueva (`c1664a5`): ¿qué otra guarda vigilaba solo a través de lo que se quitó?
> - **corolario 42 sobre cada una:** ¿qué marca suelta o retiene, y cuál hizo durable otro arreglo
>   del mismo diff?
> - **las pruebas nuevas:** ¿su nombre y su comentario dicen solo lo que miden?
> - re-medir la matriz entera con `_scratch/S32-matriz.cjs.txt` (lee las piezas nuevas de
>   `S32-A3-revert.cjs.txt` y `S32-rev.cjs.txt`);
> - lo nuevo se registra desde `R9-207`. Checkpoint en una rama `docs/...`, sin mergear sin mi OK.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-201`..`R9-203` y `R9-198`, sin arreglo medido (medí antes de elegir);
> - `R9-205` (va con `R9-38`); `R9-177` (Modo C en el emulador, con mi OK), que también cierra el
>   orden «rechazo antes que reversión» del que dependen `R9-182` y `R9-201`;
> - `R9-38`, que depende de `R9-59`; terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b));
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(l) Sesión 32: arreglar lo de la 31 e integrar `R9-192` y `R9-193` — ya HECHO en la sesión 32,
solo en la terminal y sin agentes.** Queda aquí como registro; lo que valió fue
`_scratch/S32-PROMPT.md`, que cambiaba el estado y aceptaba `+Y`.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (l) y la sección 5) y, en la memoria, la de la sesión 31 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo; su worktree nace en `main`: decile el commit esperado. Este chat gasta mi
> cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s31-diff-s30`, pedime el OK para el fast-forward.
>   Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 205. El detalle de la 31 está en
>   `detail/S31-revision-del-diff-s30.md`, y los informes, diffs, sondas y tablas en
>   `_scratch/S31-*.txt` (los `.diff.txt` de los agentes tienen CRLF:
>   `sed 's/\r$//' <diff> | git apply`; sus scripts tienen `ROOT` fijo a su worktree).
>
> **Esta sesión arregla**, en una rama `fix/...`, un commit por hallazgo, cada prueba vista fallar
> primero (y revert por pieza), sobre `SyncEngine.ts`:
>
> - **`R9-192`** (decidido: P2/P3): `_scratch/S31-A2-r192.diff.txt`, y quitar el `fromRead ||` de la
>   marca (`S31-A2-r192-fr.diff.txt`, equivalente con P3);
> - **`R9-193`** (decidido: los sellos unificados, reemplazan a `ownAcked`):
>   `_scratch/S31-A3-r193.diff.txt` (la cola y la tabla de sellos en un solo `multiSet`; sin Dheld ni
>   Dwin). Al juntarlo con P3, P3 pregunta `isOwnCopy`, y la prueba es la sonda de `R9-196`;
> - **`R9-195`** (H1c), **`R9-197`** (H3), **`R9-199`** (H5, junto a `noteOwnAcked`) y **`R9-200`**
>   (la prueba de `R9-190` con W2 en espera): `_scratch/S31-A1-h*.diff.txt` y sus sondas;
> - **`R9-204`** (C4: keepMine reescribe la fila local), con la G1 de `S31-A2-sonda-r183` como
>   prueba;
> - después, si alcanza, `R9-201`..`R9-203` (sin arreglo medido: medí antes de elegir) y `R9-198`;
> - re-medí la matriz entera al final (`_scratch/S30-matriz.cjs.txt` más las piezas nuevas).
>
> **Pendiente, NO salvo que te lo pida:**
>
> - la extensión de los sellos (`S31-A3-extension.diff.txt`) para `R9-189`, `R9-194` y `R9-174`:
>   `+W` y `+Npend` son de los mismos sellos; `+Y` (un registro en memoria, como `ownAcked`) es
>   decisión mía;
> - `R9-205` (va con `R9-38`); `R9-177` (Modo C en el emulador, con mi OK), que también cierra el
>   orden de `R9-182` y de `R9-201`;
> - `R9-38`, que depende de `R9-59`; terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b));
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados,
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto) y `+Y`.

**(k) Sesión 31: revisar el diff de la 30 — ya HECHO en la sesión 31, solo en la terminal y con 3
agentes en worktree (solo para medir).** Queda aquí como registro.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (k) y la sección 5) y, en la memoria, la de la sesión 30 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo. Este chat gasta mi cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s30-sync-r9185-r9188` y `docs/review-s30-fix-s29`, pedime el
>   OK para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 194. El detalle de la 30 está en
>   `detail/S30-arreglos-de-la-29.md`, y las sondas y los informes de los agentes en
>   `_scratch/S30-*.txt`.
>
> **Esta sesión revisa el diff de la 30** (`678a4be..45d2f41`: `SyncEngine.ts` y
> `SyncEngine.test.ts`), en local:
>
> - **las piezas nuevas:** `isOwnCopy` por milisegundo y `ownAcked` en memoria (`R9-190`); la
>   marca `reread` persistida, el lote sintético del enganche y el `fromRead` de la rama retenida
>   (`R9-186`, `R9-191`); el `Map` de `R9-182` que `stop()` no vacía; el salto de `R9-184`; el
>   cursor de `resolveConflict` por la cadena (`R9-183`);
> - **corolario 42 sobre cada una:** ¿qué marca suelta o retiene, y cuál hizo durable otro arreglo
>   del mismo diff?
> - **las pruebas nuevas:** ¿su nombre y su comentario dicen solo lo que miden? (dos veces en la
>   30 la pieza tumbaba el mecanismo y no la consecuencia);
> - re-medir la matriz entera con `_scratch/S30-matriz.cjs.txt`;
> - lo nuevo se registra desde `R9-195`. Checkpoint en una rama `docs/...`, sin mergear sin mi OK.
>
> **Mis decisiones pendientes de la 30 (no las tomes vos):**
>
> - `R9-192`: integrar o no P2/P3 de A2 (en la sesión, el conflicto pasa a mostrar la copia de la
>   nube; cambia lo que ve el usuario);
> - `R9-193`: los «sellos propios» de A3 y cómo unificarlos con `ownAcked` de `R9-190`.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-189` y `R9-194` (sin arreglar), y `R9-177` (Modo C en el emulador, con mi OK), que también
>   cierra el orden «rechazo antes que reversión» del que depende `R9-182`;
> - `R9-38`, que depende de `R9-59`;
> - terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b)) y `R9-174`;
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(j) Sesión 30: arreglar lo de la 29 — ya HECHO en la sesión 30, solo en la terminal y con 3
agentes en worktree (solo para medir).** Queda aquí como registro.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (j) y la sección 5) y, en la memoria, la de la sesión 29 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo. Este chat gasta mi cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `docs/review-s29-diff-s28`, pedime el OK para el fast-forward.
>   Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 188. El detalle de la 29 está en
>   `detail/S29-revision-del-diff-s28.md`, y las sondas en `_scratch/S29-*.txt`.
>
> **Esta sesión arregla lo de la 29**, en una rama `fix/...`, un commit por hallazgo, cada prueba
> vista fallar primero:
>
> - **`R9-185` primero:** la guarda de `R9-176` suelta la marca de un conflicto retenido. La
>   hipótesis H1 (`hold` a la copia leída) ya está medida con la sonda Q5a/Q5b; falta la prueba vista
>   fallar, y medir el `settle` de la guarda (hoy sin prueba);
> - **`R9-186`:** la lectura fallida o vencida y la marca, y los dos comentarios. Antes de elegir,
>   medí la hipótesis (retener y releer en el próximo enganche) contra `R9-164`;
> - **`R9-187`:** por la regla 37, quitar una de `R104-5`/`R104-7` y el `.catch` de
>   `enqueueSnapshot`, y escribir la prueba del efecto propio de `R104-4`;
> - **`R9-188`:** corregir el comentario y el fixture de la prueba de `R9-161`, el de
>   `applyRemoteChange` y la nota de `R9-182`;
> - después, si alcanza, `R9-182`..`R9-184`;
> - re-medí la matriz entera con `_scratch/S29-matriz.cjs.txt` al final.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-177` (Modo C en el emulador, con mi OK), que también cierra el orden de `R9-182`;
> - `R9-38`, que depende de `R9-59`;
> - terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b)) y `R9-174`;
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(i) Sesión 29: revisar el diff de la 28 — ya HECHO en la sesión 29, solo en la terminal y sin
agentes.** Queda aquí como registro.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` (sobre todo el
> mensaje (i) y la sección 5) y, en la memoria, la de la sesión 28 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo. Este chat gasta mi cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `fix/s28-sync-r9175-r9181` y `docs/review-s28-fix-s27`, pedime el
>   OK para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 184. El detalle de la 28 está en
>   `detail/S28-arreglos-de-la-27.md`, y las sondas en `_scratch/S28-*.txt`.
>
> **Esta sesión revisa el diff de la 28** (`f305fa2..53e79fa`: `SyncEngine.ts`, `types.ts` y
> `SyncEngine.test.ts`), en local:
>
> - **el mock nuevo** (eco, reversión, re-entrega, hilo único): ¿qué hace distinto del SDK real?
>   Por ejemplo: el merge superficial, `__fire` que entrega aunque los datos no cambien, un solo
>   ejecutor global, y el `delete()` en el ejecutor;
> - **las pruebas que se ajustaron por tiempo o con el flag del bulk push:** ¿siguen vigilando lo
>   suyo? (corolario 24: un fixture puede responder la pregunta);
> - **la cadena de `R9-175`:** ¿quién más mueve el cursor o el conjunto no asentado fuera de la
>   cadena, además de `R9-183`? ¿Y el plazo de 60 s?;
> - **`R9-181`:** la marca por identidad (`conflict?.remoteVersion === remote`) y `heldAt`;
> - **`R9-176`:** qué pasa con la marca cuando la guarda suelta el doc y el eco no llega (una subida
>   descartada tras 8 intentos, `R9-33`);
> - re-medir la matriz entera con `_scratch/S28-matriz.cjs.txt`;
> - lo nuevo se registra desde `R9-185`. Checkpoint en una rama `docs/...`, sin mergear sin mi OK.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-182`..`R9-184` (registrados en la 28, sin arreglar), y `R9-177` (Modo C, con mi OK);
> - `R9-38`, que depende de `R9-59`;
> - terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b)) y `R9-174`;
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(h) Sesión 28: arreglar lo de la 27 — ya HECHO en la sesión 28, solo en la terminal y con 3
agentes en worktree (solo para medir diseños).** Queda aquí como registro.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` y, en la
> memoria, la de la sesión 27 y la regla fija de las pruebas
> (`feedback_essb-regression-test-must-fail-first`).
>
> **Modo: solo terminal.** No propongas sesiones en la nube. Agentes en worktree, solo si te los
> pido y 3 como máximo. Este chat gasta mi cuota semanal: sé económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye el checkpoint de la 27 (`docs/review-s27-diff-s26`), pedime el OK
>   para el fast-forward. Antes de empezar, comprobá en el log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 181. El detalle de la 27 está en
>   `detail/S27-revision-del-diff-s26.md`, y las sondas en `_scratch/S27-A{1,2,3}-*.txt`.
>
> **Esta sesión arregla**, en una rama `fix/...` y en local. Decime el orden y el diseño antes de
> tocar código:
>
> 1. **`R9-175` (P2):** serializar `handleSnapshot` por colección y corregir el comentario de
>    `SyncEngine.ts:1002-1004`. La sonda P10 de A2 es la base de la prueba.
> 2. **`R9-176` y `R9-178` (P3):** la respuesta de la lectura no ve lo que pasó en local. Son dos
>    guardas distintas: `hasQueuedWrite`, y el `heldBefore` que A3 midió. La primera no cubre el
>    caso N1a de la segunda.
> 3. **`R9-179` y `R9-180` (P3, pruebas):** el eco propio en el mock, y quitar o derivar
>    `isSyncing`. Ojo: con el eco propio caen 4 pruebas de `R9-104` por el fixture (un solo almacén
>    para las dos cuentas); con `@sync_first_push_done:uid-beto` pasan.
> 4. **`R9-181`:** ya decidido, la (b) acotada a los docs con la marca. Quitar `remoteTs > localTs`
>    de la rama retenida. La prueba que falta, el control y el eco propio a medir están en su
>    entrada de `BUGS.md`.
> 5. **`R9-177`:** leer primero de la caché. Solo con mi OK y midiendo en Modo C, en el emulador.
>
> Cada prueba, vista fallar primero, y cada pieza revertida por separado. Re-medí la matriz entera
> (`_scratch/S27-matriz-reverts.cjs.txt`, con las piezas nuevas agregadas) con mi
> `NODE_ENV=development`. Checkpoint en una rama `docs/...`, sin mergear sin mi OK.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-38`, que depende de `R9-59`;
> - terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono, los huérfanos de un `deleteAccount`
>   fallido y, desde la 27, el corte durante la lectura);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b)) y `R9-174`;
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(g) Sesión 27: revisar el diff de la 26 — ya HECHO en la sesión 27, solo en la terminal y con 3
agentes en worktree.** Queda aquí como registro.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` y, en la
> memoria, la de la sesión 26.
>
> **Modo: solo terminal.** El crédito de la nube se terminó: no propongas sesiones en la nube.
> Agentes en worktree, solo si te los pido y 3 como máximo. Este chat gasta mi cuota semanal: sé
> económico.
>
> **Estado:**
>
> - Si `main` todavía no incluye `34de18f` (el arreglo de `R9-124`) y el checkpoint de la 26
>   (`docs/review-s26-removed`), pedime el OK para el fast-forward. Antes de empezar, comprobá en el
>   log el run de CI de `origin/main`.
> - Queda 1 P0 abierto: `R9-38`. Hallazgos: 174. El detalle de la 26 está en
>   `detail/S26-r9124-modo-c-y-arreglo.md`.
>
> **Esta sesión revisa el diff de la 26** (`590b39c..34de18f`: `SyncEngine.ts` y
> `SyncEngine.test.ts`), en local:
>
> - las afirmaciones de `detail/S26-*` contra el código y contra la medición nativa
>   (`_scratch/S26-sonda-nativa-r9124.out.txt`);
> - la pregunta de la 25: ¿quién más escribe en ese lugar mientras el caso espera? El `getDoc` es
>   un viaje de red, y los lotes de `handleSnapshot` no se serializan. ¿Qué pasa si otro lote
>   re-crea o cambia el mismo doc durante la lectura, o si un `keepMine`/`keepTheirs` cae en medio?
> - el mock nuevo: ¿sustituye algo que el SDK real hace distinto? Por ejemplo, al re-enganchar, el
>   real re-entrega como `added` todo el conjunto;
> - re-medir la matriz entera con `_scratch/S26-matriz-reverts.cjs.txt`;
> - lo nuevo se registra desde `R9-175`. Checkpoint en una rama `docs/...`, sin mergear sin mi OK.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-38`, que depende de `R9-59`;
> - terminar `A12`;
> - `R9-164` con la app cerrada (el respaldo del otro teléfono y los huérfanos de `deleteAccount`);
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`;
> - `R9-173` (ya decidido: extender la opción (b)) y `R9-174`;
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(f) Sesión 26: `R9-124` en Modo C — ya HECHO en la sesión 26, solo en la terminal (el arreglo no
fue en la nube).** Queda aquí como registro.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` y, en la
> memoria, la de las sesiones 23 a 25 y la de los dispositivos
> (`reference_essb-device-testing-and-automation`).
>
> **Estado:**
>
> - `main` = `cf7c715`, con el CI verde en el log. Antes de empezar, comprobá en el log el run de
>   `origin/main`.
> - Quedan 2 P0 abiertos: `R9-38` y `R9-124`. Hallazgos: 174. El detalle de la 25 está en
>   `detail/S25-revision-del-diff-s24.md`.
>
> **Esta sesión es `R9-124`.** Decime qué medís antes de tocar código.
>
> 1. **Medir el SDK nativo de Android en Modo C**, en el emulador, con mi OK y **nunca con mi
>    teléfono** (como `R9-104` en la 20). La pregunta: reescribir un doc con un `updatedAt` más
>    viejo que el piso del listener, ¿lo entrega como `removed`?
> 2. **Si confirma, el arreglo** (en una rama `fix/...`, en local o en la nube, preguntame). Tiene
>    que:
>    - hacer FUERA de `withLocalWriteSuppressed` la consulta de si el doc existe, con su
>      `isCurrent()` después (`R9-153`);
>    - seguir soltando el doc del conjunto no asentado aunque no lo borre (`R9-164`);
>    - respetar lo nuevo de `R9-160`: con un conflicto pendiente, el doc no toma nada de la nube;
>    - y lograr que el mock de `onSnapshot` de la suite emita `removed` en vez de filtrar.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-38`, que depende de `R9-59`;
> - terminar `A12`;
> - `R9-127`: siguen abiertas la rama sin anónimo, la de colisión y el skip de `deleteAccount`. El
>   skip por uid toca `SyncEngine.ts` y `AuthContext.tsx`;
> - `R9-173` (ya decidido: extender la opción (b)) y `R9-174`;
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(e) Revisar en local los arreglos de la nube de la 25 — ya HECHO, en la misma sesión 25.** Queda
aquí como registro.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md` y, en la
> memoria, la del método de la nube (`feedback_essb-cloud-sessions-local-review`).
>
> **Estado:**
>
> - La 25 revisó el diff de la 24 en la nube y registró `R9-160`..`R9-173`. Quedan 4 P0 abiertos:
>   `R9-38`, `R9-124`, `R9-160` y `R9-166`. Hallazgos: 173. El detalle está en
>   `detail/S25-revision-del-diff-s24.md`. Antes de empezar, comprobá en el log el run de CI de
>   `origin/main`.
> - Al cerrar la 25 se lanzaron dos sesiones de arreglos en la nube, en archivos distintos:
>   - **A:** `R9-160` (P0) + `R9-161` (P1), y la prueba de `R9-162`, en
>     `fix/review-s25-conflictos`: `SyncEngine.ts`,
>     `app/(tabs)/conflicts.tsx` y sus pruebas;
>   - **B:** `R9-166` (P0), en `fix/review-s25-pregunta-link`: `AuthContext.tsx`,
>     `SyncEngineContext.tsx` y sus pruebas.
>
> **Esta sesión revisa esas dos ramas en mi máquina,** como en la 24:
>
> - `npm run validate` con mi `NODE_ENV=development`;
> - el revert por PIEZA, con un script de reemplazo exacto escrito con la herramienta de edición;
> - que cada prueba nueva se vea fallar primero;
> - que el caso de `R9-36` (seguir escribiendo en ESTE teléfono) y las pruebas de `R9-23`/`R9-125`
>   sigan verdes;
> - apilar las dos ramas y comparar cada tramo con `cmp`;
> - validate sobre la pila, mi OK, el fast-forward y el CI en el log.
>
> Después, con mi OK, borrá las ramas `fix/review-s25-*` del remoto.
>
> **Después:** `R9-124`. Primero hay que medir el SDK nativo de Android en Modo C, en el emulador,
> con mi OK y nunca con mi teléfono. Si confirma, el arreglo tiene que:
>
> - hacer FUERA de `withLocalWriteSuppressed` la consulta de si el doc existe, con su
>   `isCurrent()` después (`R9-153`);
> - seguir soltando el doc del conjunto no asentado aunque no lo borre (`R9-164`).
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-38`, que depende de `R9-59`;
> - terminar `A12`;
> - `R9-127` (el skip por uid toca `SyncEngine.ts` y `AuthContext.tsx`: va después de A y B);
> - `R9-173` (ya decidido: extender la opción (b));
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158` (junto con el `claimLocalStore` que también falla abierto).

**(d) Sesión 25: revisar el diff de la 24 — ya HECHO, en la nube.** Queda aquí como registro. Se
hizo con 2 sesiones en la nube, no con los 3 agentes locales que proponía este mensaje; los prompts
están en `_scratch/S25-nube-{1,2}-*.md`.

> Seguimos con la revisión profunda. Leé primero `DOCS/REVIEW_2026-09/CONTINUAR.md`.
>
> **Estado:**
>
> - La sesión 24 hizo los arreglos (c) con 6 sesiones de Claude Code en la nube. El orquestador
>   revisó cada rama en local, pieza por pieza, y todo está mergeado.
> - `main` = `9c425a8`, con CI verde en el log: run `35965550736`, 366/4366. Antes de empezar,
>   comprobá en el log el run de `origin/main`.
> - Quedan 2 P0 abiertos: `R9-38` y `R9-124`. Hallazgos: 159. El detalle está en
>   `detail/S24-arreglos-en-la-nube.md`.
>
> **Esta sesión es de REVISIÓN del diff de la 24** (`0bc707d..9c425a8`, 16 commits). Decime qué
> encontraste antes de tocar nada. Mirá sobre todo:
>
> 1. **`R9-39` + `R9-106` (`9c425a8`), el conjunto «no asentado» persistido:**
>    - ¿Puede un doc quedar retenido para siempre? Por ejemplo, un `getLocal` que siempre falla, o
>      un conflicto que nadie resuelve.
>    - ¿Cuánto cuesta en lecturas?
>    - ¿Convive bien con `R9-153`, con `deleteAccount` y con un respaldo restaurado (el `removed`
>      de `R9-124`)?
> 2. **`R9-36` (`6440ca0`):** ¿qué pasa si el doc se borró en local entre la detección y la
>    resolución? ¿La pantalla relee bien al enfocar?
> 3. **`R9-125` (`e8c2031`):** ¿todos los caminos de `signInWithGoogle` reclaman el almacén?
>    Mirá también `R9-158` y la nota nueva de `R9-127`.
> 4. **`R9-109` y `R9-108`** (`d2b1cc7`, `44a5d15`, `0631557`, `b8e812c`):
>    - en el bundle web real, ¿el `instanceof WebPackMismatchError` sobrevive a la transpilación?
>    - ¿`sha256Hex` rinde en un teléfono?
> 5. **`R9-157` (`NODE_ENV`):** ¿hay otras variables del shell de Victor que cambien la suite?
> 6. **Las pruebas:** que cada una discrimine (ya se midió en local; repetilo con ojo fresco), y
>    que los mocks nuevos no respondan la pregunta. Los mocks nuevos son el de la pantalla de
>    conflictos y los `fetch` falsos de los packs.
>
> **Con 3 agentes**, en forks en worktree aislado:
>
> - **agente 1:** el motor (`R9-153`, `R9-154`, `R9-36`, `R9-39`, `R9-106`);
> - **agente 2:** identidad, la Mesa y la web (`R9-125`, `R9-130`, `R9-143`, `R9-109`, `R9-108`);
> - **agente 3:** `R9-157`, lo que el ledger afirma de la 24 contra el mundo, y lo transversal.
>
> Cada uno lleva:
>
> - informe incremental en `_scratch/S25-agente-N.md`;
> - cada sonda copiada con `.txt` a `_scratch/S25-sondas-agente-N/` en cuanto se corre;
> - la lista `_scratch/S25-ya-reportados.txt`.
>
> Lo nuevo va desde `R9-160`, y lo que suba a P0 o P1 lo verificás vos. El checkpoint va en la
> rama `docs/review-s25-diff-s24`. Gates en verde, y no mergees nada sin preguntarme.
>
> **Después, en la 26:** `R9-124`. Primero medir el SDK nativo de Android en Modo C, en el
> emulador, con mi OK y nunca con mi teléfono. Si confirma, el arreglo, que tiene que:
>
> - hacer FUERA de `withLocalWriteSuppressed` la consulta de si el doc existe;
> - respetar la sesión de `R9-153` y el conjunto de `R9-39`.
>
> **Pendiente, NO salvo que te lo pida:**
>
> - `R9-38`, que depende de `R9-59`;
> - terminar `A12`;
> - mis decisiones: `R9-59`, el efecto de `R9-146`, el tope de cuota del piso de no asentados y
>   `R9-158`.

**(c) ARREGLOS: lo que fue la sesión 24, ya HECHO.** Queda aquí como registro. Se hizo en la nube:
los prompts están en `_scratch/S24-PROMPT-nube.md` y `_scratch/S24-nube-N-*.md`, que no están en
git.

> Seguimos con la revisión profunda. Lee `DOCS/REVIEW_2026-09/CONTINUAR.md` primero.
>
> **Estado:** el doble check con Opus 5.5 está terminado y registrado (sesiones 21 y 22,
> `R9-124`..`R9-152`), y la 23 revisó el diff de la 20 (`R9-153`..`R9-156`). Hay 5 P0 abiertos:
> `R9-36`, `R9-38`, `R9-39`, `R9-124` y `R9-125`. Hallazgos: 156. Antes de empezar, comprobá en
> el log el run de CI de `origin/main`.
>
> **Esta sesión es de ARREGLOS**, en una rama nueva, un commit por hallazgo:
>
> 1. **`R9-125` + `R9-130` (P0 + P1):** son las mismas líneas de `AuthContext.tsx`. Hay que mirar
>    el dueño previo ANTES de bifurcar en `signInWithGoogle`, con una prueba que pase por las tres
>    ramas: éxito del link, colisión y sin anónimo.
> 2. **`R9-143` (P1):** «Banco de ilustraciones» y «Modo púlpito» necesitan las dos guardas de
>    `handleNoteBlur`, con una prueba por botón que se vea fallar primero.
> 3. **`R9-124` (P0), solo la medición:** antes de tocar el motor, medí el SDK nativo de Android
>    en Modo C, en el emulador, con mi OK y nunca con mi teléfono (como `R9-104` en la 20). Si
>    confirma, el arreglo es que un `removed` solo signifique borrado cuando el doc ya no existe,
>    y el mock de `onSnapshot` de la suite tiene que emitir `removed`. Si consultás si el doc
>    existe, hacelo FUERA de `withLocalWriteSuppressed` (`R9-154`).
> 4. **`R9-153` (P1):** `handleSnapshot` necesita la misma sesión que el flush, para que al volver
>    de cada `await` después de un `stop()` corte sin registrar conflictos, sin mover el cursor y
>    sin tocar el estado. Toca el mismo bucle que `R9-124`, y debería cerrar también
>    `R9-122.4`. No necesita emulador. La prueba: un conflicto de Ana registrado después del
>    `stop()` no aparece en la sesión de Beto, y resolver no escribe nada en la nube de Beto.
>
> Cada prueba, **vista fallar primero**, y cada PIEZA revertida por separado. Gates en verde
> (`npm run validate`), y no mergees nada sin preguntarme.
>
> **Pendiente, NO para esta sesión salvo que te lo pida:** los P0 viejos `R9-36`, `R9-38` y
> `R9-39`; terminar `A12`; y mis decisiones pendientes, `R9-59` (qué significa «local» en un
> teléfono compartido) y el efecto de `R9-146`.

**(b2) Lo que fue la sesión 22, ya HECHO.** Queda aquí como registro. El prompt con que arrancó
(`_scratch/S22-PROMPT.md`, que no está en git) pedía el checkpoint de la 21 y los puntos 3 y 4 con
2 agentes. Victor pidió 5 a mitad de sesión.

**(a) Revisar el diff de la sesión 20: lo que fue la sesión 23, ya HECHO.** Queda aquí como
registro. Victor delegó el orden, y la 23 arrancó con `_scratch/S23-PROMPT.md` (que no está en
git), casi igual a este mensaje, con 3 agentes.

> Seguimos con la revisión profunda. Lee `DOCS/REVIEW_2026-09/CONTINUAR.md` primero.
>
> **Estado:** `main` = `origin/main`, sin ramas pendientes. La sesión 20 (con Opus 5.5) arregló
> `R9-102`..`R9-105`, un commit por hallazgo (`8ea93b6`, `7aafc9c`, `cfa7c1c`, `00f69c4`), ya
> mergeados y pusheados, con CI verde verificado en el log. Además midió `R9-104` en el SDK
> NATIVO (Modo C, emulador): la escritura de la cuenta anterior queda pendiente (mientras esa
> cuenta no vuelva: `R9-156.2`), así que se queda en P1. Antes de empezar, comprobá en el log el run de CI de `origin/main`. El
> detalle está en `detail/S20-arreglos-p0-sync-favoritos.md`. Quedan 5 P0 abiertos: `R9-36`,
> `R9-38`, `R9-39`, y `R9-124` y `R9-125`, que son del doble check (sesiones 21 y 22, ya
> registrado).
>
> **Esta sesión es de REVISIÓN del diff de la 20** (`25128b3..ca2cd71`; lo posterior es solo
> docs). Decime qué
> encontraste antes de tocar nada. Mirá sobre todo:
>
> 1. **`R9-104` (`cfa7c1c`):** `stop()` ahora suelta el candado del flush con un push en vuelo.
>    ¿Hay algún camino en que dos flushes de la MISMA sesión corran a la vez? ¿Y en
>    `deleteAccount`, que hace `stop()` y puede volver a `start()` con el mismo uid?
> 2. **`R9-103` (`7aafc9c`):** la supresión por (colección, id). ¿Hay algún eco que no sea del
>    MISMO doc (un apply que escriba otro doc, un efecto de React que encole)?
> 3. **`R9-102` (`00f69c4`):** `getFavoriteById` relee la fila tras escribirla. ¿Qué pasa si un
>    apply remoto del mismo favorito cae entre la escritura y la relectura? ¿Y en web?
> 4. **Las pruebas:** que cada una discrimine en `HEAD` (revertí, corré, restaurá, `diff` el
>    revert), y que el mock de SQLite de `favoritesUpdateQueuesSync.test.tsx` no responda la
>    pregunta que la prueba hace. La 20 dejó dos capas de `R9-104` que se cubren entre sí y una
>    ruta (`item.uid`) que no discrimina ninguna prueba, dicho en el detalle: ¿es cierto?
> 5. **Lo que el ledger afirma de la 20, contra el mundo:** la tabla de la medición nativa, su
>    límite (cuentas anónimas, sin la vuelta de la cuenta anterior), la limpieza en producción y
>    los conteos (19 llamadores, 364/4299).
>
> Gates en verde (`npm run validate`), y no mergees nada sin preguntarme.
>
> **El doble check con Opus 5.5 ya está hecho y registrado** (sesiones 21 y 22). La opción (c)
> de `CONTINUAR.md` son los arreglos que dejó.

**(a-bis) Lo que era la (a) hasta la sesión 20, ya HECHO.** Queda aquí como registro.

> Seguimos con la revisión profunda. Lee `DOCS/REVIEW_2026-09/CONTINUAR.md` primero.
>
> **Estado:** `main` = `origin/main`, sin ramas pendientes. El último código es `40160d7`, verde en
> CI y verificado en el log. La sesión 19 (la primera con Opus 5.5) fue solo de revisión, y su
> checkpoint ya está mergeado y pusheado. Antes de empezar, comprobá en el log el run de CI de
> `origin/main`. Encontró 22 hallazgos, `R9-102`..`R9-123`; el detalle está en
> `detail/S19-revision-del-diff.md`.
>
> **Esta sesión es de ARREGLOS**, en una rama nueva:
>
> 1. **`R9-102` (P0):** `FavoritesContext.updateFavorite` encola el push solo si una variable se
>    asignó DENTRO del actualizador de `setFavorites`, y React no lo corre en el acto cuando la
>    fibra tiene trabajo pendiente. La edición se ve en pantalla y nunca sube.
> 2. **`R9-103` (P0):** `suppressLocalWriteCount` es global. Una edición del usuario durante una
>    bajada en vuelo se descarta en silencio. Hay que suprimir por (colección, id).
> 3. **`R9-104` (P1, candidato a P0):** el flush no vuelve a mirar la cuenta después de cada
>    `await`. Hay que comprobar `item.uid === this.uid` tras cada push y armar la ruta con
>    `item.uid`. El arreglo sirve para las dos ramas; si hay emulador, medí el SDK real en Modo C
>    (nunca con mi teléfono).
> 4. **`R9-105` (P1):** la línea exacta del bug de `R9-9` no la protege ninguna prueba. Hace falta
>    una prueba con módulo fresco y sin `__resetForTests()`.
>
> Cada uno con su prueba **vista fallar primero**: revertí, corré, restaurá, y `diff` el revert.
> La sesión 19 ya cazó las trampas de estos cuatro:
>
> - para `R9-102`, la prueba tiene que forzar trabajo pendiente en la fibra antes de editar, o
>   pasa por la razón trivial;
> - para `R9-105`, el reset del `beforeEach` tapa el inicializador, así que usá
>   `jest.isolateModulesAsync`;
> - para `R9-103`, un apply en vuelo de OTRO doc no tiene que suprimir, y un eco del MISMO doc sí;
> - para `R9-104`, la prueba necesita un `set()` diferido que resuelva después de `stop()` +
>   `start()`.
>
> Si un commit lleva dos arreglos, comprobá que uno no desarme la prueba del otro. Gates en verde
> (`npm run validate`), y no mergees nada sin preguntarme.
>
> **Pendiente fijo, NO para esta sesión salvo que te lo pida:** todo lo que el ledger revisó hasta
> la sesión 18 se hizo con Opus 5, y quiero un **doble check con Opus 5.5**. Está en `CONTINUAR.md`,
> punto 3.

**(b) El doble check con Opus 5.5, el pedido fijo de Victor: HECHO en sus 4 puntos** (sesiones 21
y 22). Queda aquí como registro del alcance.

> Seguimos con la revisión profunda. Lee `DOCS/REVIEW_2026-09/CONTINUAR.md` primero.
>
> **Estado:** `main` = `origin/main`, sin ramas pendientes, con CI verde verificado en el log. La
> sesión 20 arregló `R9-102`..`R9-105` y midió `R9-104` en el SDK nativo. Quedan 3 P0 abiertos
> (`R9-36`, `R9-38`, `R9-39`). Antes de empezar, comprobá en el log el run de CI de
> `origin/main`.
>
> **Esta sesión es el doble check con Opus 5.5, y es solo de REVISIÓN.** Todo lo que el ledger
> (`DOCS/REVIEW_2026-09/BUGS.md`) registró hasta la sesión 18 incluida se revisó con **Opus 5**.
> Las sesiones 19 y 20, ya con Opus 5.5, encontraron que esa pasada dejó huecos:
>
> - dos diffs de arreglos (sesiones 10 y 11) que nunca se habían revisado;
> - dos P0 nuevos (`R9-102`, `R9-103`) en código que el Modo A ya había pasado;
> - varias afirmaciones «comprobado y BIEN» que eran falsas;
> - una propuesta de arreglo del ledger (`R9-104`) que no cubría el único caso que ocurre de verdad.
>
> **Quiero un doble check, con Opus 5.5, de todo lo revisado hasta la sesión 18.** El alcance está
> en `detail/S19-revision-del-diff.md`, sección «Pedido de Victor»:
>
> 1. **Los 18 P0 marcados ✅ ARREGLADO antes de la sesión 19** (no `R9-102`/`R9-103`, que son de la
>    20): que cada arreglo se sostiene y que su prueba discrimina **en `HEAD`**, no en el commit
>    donde nació. Revertí cada PIEZA del arreglo por separado, no el arreglo entero (la lección de
>    la 20), y hacé `diff` de cada revert.
> 2. **Las filas ya cerradas del Modo A (`A1`..`A11`) y del Modo B:** re-leer el código con ojo
>    fresco, sobre todo la dirección «quitar acceso / restaurar / cambiar de cuenta».
> 3. **Los P1/P2 que nunca se re-verificaron** (`R9-51`..`R9-64`).
> 4. **Las afirmaciones «comprobado y BIEN» de los `detail/S*` hasta `S18`**, contra el mundo, no
>    contra el texto.
>
> Usá 4 agentes en worktrees aislados, uno por punto, y dale a cada uno los hallazgos ya reportados
> por número (`R9-1`..`R9-123`) para que no los repita. Verificá vos todo lo que suba a P0 o P1
> antes de reportarlo. Registrá lo nuevo como `R9-124` en adelante. Decime qué encontraste antes
> de tocar nada.
>
> **Pendiente, NO para esta sesión salvo que te lo pida:** revisar el diff de la sesión 20
> (`25128b3..origin/main`). Es la opción (a) de `CONTINUAR.md`.

**(d) Lo que ya estaba en cola antes de la 19**, sin cambios: terminar `A12` (3 hilos abiertos en
su detalle, y con eso se cierra el bloque P0 del Modo A), los P0 viejos `R9-36`, `R9-38` y
`R9-39`, los 4 reportes de campo (`R9-40`..`R9-43`), y la deuda de dispositivo (la insignia
`droppedWrites`, `R9-47` y la rama del lector de `R9-44`, siempre en emulador).

Eso es todo. Lo de abajo es para el chat que lo lea.

---

## 1. Qué leer, en este orden

1. **`git status` primero, `INDEX.md` después.** Un archivo sin commitear en `detail/`
   significa "una sesión se cortó a mitad de checkpoint" y cambia por completo qué toca
   hacer.
2. **`DOCS/REVIEW_2026-09/INDEX.md` entero** — es fino a propósito y cabe en una lectura.
   Su bloque **"Ya conocido — NO reportar como hallazgo nuevo"** evita que registres como
   bug fresco algo ya sabido, y **creció bastante en la sesión 6**. **No re-derives el
   índice desde el código.**
3. **`DOCS/REVIEW_2026-09/REVIEW_PROMPT.md`** — el charter: protocolo (§1), prioridades
   (§2), las 4 dimensiones y su estándar de evidencia (§3).
4. **`DOCS/REVIEW_2026-09/BUGS.md`** — los **64** hallazgos (`R9-1`..`R9-64`), para no
   volver a reportarlos. **No hace falta leerlo entero**: la sección P0 va primero y es la
   que importa.
   - `R9-1`..`R9-8` (sesión 2) son propuestas de endurecimiento, **no** bugs de la app;
     `R9-7` ya está RESUELTO (`af64ce1`).
   - **`R9-9`..`R9-39` y `R9-44`..`R9-64` SÍ son bugs reales, 21 de ellos P0** — dinero,
     identidad, fuga entre cuentas y pérdida de datos. Léelos antes de tocar nada de premium,
     auth, sync, respaldo, notas, la Mesa, memoria o rachas. **7 de esos P0 ya están
     ARREGLADOS** por la sesión 7 (marcados ✅ en su entrada), así que los abiertos son 14.
   - `R9-40`..`R9-43` son los **reportes de campo de Victor** (sesión 5), ninguno P0.
   - **Matiz sobre `R9-13`** (el crash del lector web): está en `main` pero **NO en
     producción** — el último deploy web es 5 días anterior a la regresión. Es **bloqueante
     del próximo `firebase deploy`**, no un incendio. No lo priorices por encima de los de
     pérdida de datos.
5. Solo el `detail/<slug>.md` del área que vayas a tocar. Ya hay **19** (12 del Modo A, 6
   del Modo B, 1 de campo). **No los leas todos** — para eso está el índice.
6. Memorias (por el índice `MEMORY.md`): **`essb-66th-session-fanout-a8-a11`** (la más
   reciente), `essb-review-session-5-a4-verified-field-reports`,
   `essb-65th-session-deep-review-modo-a-p0` (la más cargada de aprendizajes de método),
   `essb-64th-session-deep-review-2026-09-inventory` (el inventario y todo el Modo B),
   `reference_essb-device-testing-and-automation` (**obligatoria** si vas a Modo C),
   `feedback_essb-theme-and-navigation-patterns`, `feedback_essb-minimize-firestore-sync`,
   `feedback_essb-agent-worktree-isolation`, `feedback_essb-verify-agent-commits-before-merge`,
   `feedback_essb-theological-care`, `feedback_essb-memory-freshness`,
   `feedback_essb-user-requests-preempt`. Si vas a mirar si algo está desplegado,
   `reference_essb-firebase-cli-token-for-rules-api` (sirve para Rules **y** Hosting).

## 2. Estado esperado de git

**Medido al cerrar la sesión 55 (2026-10-03).**

- **`main` = `origin/main` = `a64786b`** (el checkpoint de la 54, solo docs; el último código en
  `main` es `a85df96`). **CI verificado en el log:** run `37167615407`, 3 jobs verdes, Node
  v24.21.0, 371/4582, cero «failed to run». La rama de la 54 se borró.
- **Dos ramas de la 55, apiladas, sin mergear a propósito y sin pushear:**
  `fix/s55-arreglos-s54` (`4d0cae7`..`50f209d`) y, encima, `docs/review-s55-fix` (el checkpoint).
  Se mergean en fast-forward con el OK de Victor. Si ya se mergearon, `main` las incluye.
- **Los worktrees:** ninguno (el de la matriz, `C:/projects/essb-s55-matriz`, se borró al terminar,
  con `.Delete()` sobre su junction a `node_modules` primero).
- En el remoto quedan `main` y `audio/tts-caps-hyphen`.

Las demás ramas locales, en total 11 contando `main` (sin las de la 55):

- **Cinco ramas de arreglos YA MERGEADAS, que se pueden borrar:**
  `fix/review-p0-cola-y-cursor-conflictos`, `fix/review-p0-dinero-entitlement`,
  `fix/review-p0-sync-descarta-silencio`, `fix/review-p0-notas-cuentas` y
  `fix/review-p0-perdida-datos`.
- **Las 5 de siempre:** `audio/tts-caps-hyphen` (también en el remoto),
  `audio/tts-pronunciation-sweep`, `chore/worklets-bundle-mode`, `feature/red-letter-web` y
  `research/a4-chico-spanish-availability`.

Las ramas de las sesiones 12 a 18 ya se borraron tras mergearlas. Si no coincide, decilo antes
de empezar.

**Deuda fuera de git:**

- **De despliegue: ninguna.** Pages sirve los 4 packs buenos, y la sesión 19 lo verificó por
  sha256 y `content-length`.
- **De CI:** el step de Codecov **nunca subió nada** (`R9-118`).
- **Del mundo:** el pack contaminado está en cuarentena (punto 2 de arriba).

La revisión va en `18a3ffa` → `2f32aa9` → `8b64c11` → `af64ce1` → `299a76c` → `b5a9afa` →
`6ac10e3` → `894deb5` → `4e45f69` → **`f791749`** (sesión 6: `A4` y los reportes de campo de
las sesiones 4-5, que nunca se habían commiteado, más todo lo de `A8`–`A11`) → **`c184a1c`**
(la re-verificación a mano de los 6 P0) → **`9939e76`** (corrección de un "pendiente" falso)
→ `63f124c`.

## 3. Dónde va la revisión

**138 filas** en el ledger: Modo A 46 · Modo B 11 · Modo C 71 · Modo D 10.
**Cerradas: 17** (todo el Modo B P0 + 11 filas del Modo A P0). **`A12` en curso.**
**Pendientes: 120.** Esto cuenta filas REVISADAS; los arreglos no mueven ninguna fila, porque
arreglar no es revisar — mueven el conteo de P0 ABIERTOS de la sección P0 de `BUGS.md`, que
tras la sesión 21 son **5** (`R9-36`, `R9-38`, `R9-39`, `R9-124`, `R9-125`). **No re-derives ese número contando
arreglos** — ver la nota al principio de esa sección.

| Sesión | Qué se hizo                                                   | Commit              |
| ------ | ------------------------------------------------------------- | ------------------- |
| 1      | Solo el inventario (charter §5)                               | `18a3ffa`           |
| 2      | Modo B P0 completo: `B1`, `B1b`, `B2`–`B5`                    | `2f32aa9`           |
| 2      | Este prompt + correcciones al charter                         | `8b64c11`           |
| 2      | `R9-7` resuelto: `functions/` documentada                     | `af64ce1`           |
| 3      | `A1` (premium/RevenueCat) — `R9-9`, `R9-10`                   | `299a76c`           |
| 3      | `A2`, `A3`, `A5`, `A6`, `A7` — `R9-11`..`R9-32`               | `b5a9afa`           |
| 3      | Cierre de la sesión 3 + las 2 preguntas abiertas              | `6ac10e3`/`894deb5` |
| 4      | `A4` (`SyncEngine`) — se cortó a mitad del checkpoint         | `f791749`           |
| 5      | `A4` verificada + campo `R9-40`..`R9-43`                      | `f791749`           |
| 6      | `A8`–`A11` por fan-out — `R9-44`..`R9-64`; `A12` a medias     | `f791749`           |
| 6      | Re-verificados a mano los 6 P0 nuevos                         | `c184a1c`/`9939e76` |
| 7      | **ARREGLOS**: 7 P0 de pérdida de datos                        | `7f8e666`           |
| 8      | Revisión del diff de la 7 + merge y push a `main`             | `8fe24f1`           |
| 8      | **ARREGLOS**: `R9-46` + mezcla entre cuentas                  | `b3d73e1`→`e75eca3` |
| 9      | Revisión del diff de la 8: **2 defectos reales** + merge      | `3e780c6`→`d800a24` |
| 9      | **ARREGLOS**: `R9-33`, `R9-34`, `R9-35`                       | `0a4f0fc`→`c41c9cb` |
| 10     | Revisión del diff de la 9: **1 prueba ciega** + merge         | `2bfa126`→`daad3a9` |
| 10     | **ARREGLOS**: `R9-9` + `R9-10`, dinero; merge + push          | `bb3b25b`→`f9e184a` |
| 11     | **ARREGLOS**: `R9-11` + `R9-65` + la prueba de `R9-28`        | `261c053`→`952d456` |
| 12     | **ARREGLOS**: `R9-13` + `R9-15` + `R9-14` (bloque web)        | mergeado a `main`   |
| 13     | Revisión del diff de la 12: **6 defectos** + arreglos         | mergeado a `main`   |
| 14     | Revisión del diff de la 13: **5 defectos** + arreglos         | mergeado a `main`   |
| 15     | Revisión del diff de la 14: **5 defectos** + arreglos         | mergeado a `main`   |
| 16     | Revisión del diff de la 15: **5 defectos** + `main` en rojo   | mergeado a `main`   |
| 17     | Revisión del diff de la 16: **10 defectos** + arreglos        | mergeado a `main`   |
| 18     | Revisión del diff de la 17: **5 defectos** + arreglos         | mergeado a `main`   |
| 19     | Revisión del diff de la 18, y de los de la 10 y 11 (Opus 5.5) | `ac9c7fd`           |
| 20     | **ARREGLOS**: `R9-102`..`R9-105` (Opus 5.5)                   | `8ea93b6`→`00f69c4` |
| 21     | Doble check, puntos 1 y 2: `R9-124`..`R9-142` (Opus 5.5)      | `f294333`           |
| 22     | Doble check, puntos 3 y 4: `R9-143`..`R9-152` (Opus 5.5)      | rama de la 21       |

**Balance por modo.** El Modo B P0 salió **limpio**: 0 vulnerabilidades alcanzables, 0
secretos filtrados jamás (5558/5558 blobs), 0 paths abiertos en Firestore. Sus 8 hallazgos
son endurecimiento, no bugs.

**El Modo A P0 salió lo contrario: 52 hallazgos, 21 de ellos P0 reales.** Los más graves,
por orden de daño irreversible:

- **Pérdida de datos al respaldar/restaurar:** `R9-49` (un fallo transitorio de SQLite
  produce un respaldo vacío **sin marca**, y al importarlo **borra la racha y los ledgers**;
  canal distinto y peor que `R9-27`), `R9-27`/`R9-28`, `R9-53`.
- **Pérdida de prosa escrita a mano:** `R9-47` (dos toques al stepper de la Mesa **borran o
  pisan un sermón**), `R9-44` (recolorear un subrayado **borra su nota**), `R9-46` (una copia
  remota vieja pisa la nota nueva en cada arranque en frío).
- **Fuga o mezcla entre cuentas:** `R9-22`/`R9-23`, `R9-48` (el historial de A se escribe
  dentro de la cuenta de B y **sobrescribe** su agregado).
- **Sync que descarta o se para en silencio:** `R9-33`, `R9-35`, `R9-45` (una lápida que no
  se limpia deja un subrayado **borrado para siempre** en todo otro dispositivo).
- **Dinero:** `R9-9` (premium que sobrevive al reembolso).
- **Web:** `R9-13` (el lector crashea — **no llegó a estar en producción**; bloqueaba el
  próximo deploy web). **✅ Cerrado en la sesión 12 y verificado en un navegador de verdad,
  así que el deploy web ya no está bloqueado.**

**Los cuatro ejes donde están, y donde conviene seguir buscando.** Las tres compuertas
verdes (`tsc`, jest, CI) comparten puntos ciegos:

1. **La resolución de módulos por plataforma** — `tsc` y jest resuelven siempre al archivo
   nativo.
2. **La dirección inversa** de cada flujo — quitar acceso, restaurar, borrar, descompletar,
   cambiar de cuenta.
3. **Las listas de strings enumeradas a mano**, que se quedan atrás al añadir un miembro.
4. **El horario de verano** (nuevo en la sesión 6) — ninguna prueba fija `TZ` y la máquina
   está en una zona sin DST, así que la suite **no puede** ver esa clase de bug.

Y un quinto patrón, más fino, que salió de `A8`: **`{merge:true}` hace que un campo opcional
sea imposible de desasignar por sync**, así que cualquier omisión local se convierte en
divergencia permanente con la nube (`R9-44`, `R9-45`, `R9-50` son la misma raíz).

## 4. Por dónde seguir

**Recomendado para la sesión 30: el mensaje (j), arreglar lo de la 29** (`R9-185`..`R9-188`, y
después `R9-182`..`R9-184`), solo en la terminal. La nube no es una opción. Lo de abajo es el menú
de siempre para después.

**Recomendado: terminar `A12`** (Modo A, P0) — superficies de crash. Está a medias con 3
hilos abiertos en `detail/A12-superficies-crash.md`, y **es la última fila P0 del Modo A**.
El hilo más prometedor ya está localizado: `CustomPlansContext.tsx:69` parsea `@custom_plans`
**sin validar**, y ese provider está **por encima** del `ErrorBoundary`.

Alternativas legítimas:

- **Seguir la sesión de ARREGLOS.** La 7 hizo el primer tramo (`R9-49`/`R9-27`/`R9-28`,
  `R9-47`, y `R9-44`/`R9-45`/`R9-50` juntos por su raíz); la 8 hizo `R9-46` y **el bloque
  entero de mezcla entre cuentas** (`R9-22`/`R9-48`/`R9-23`); la 9, el bloque de **sync que
  descarta en silencio** (`R9-33`/`R9-34`/`R9-35`); la 10, el de **dinero**
  (`R9-9`+`R9-10`); la 11, **cola y cursor** (`R9-11`+`R9-65`); la 12, **el bloque web**
  (`R9-13`+`R9-15`+`R9-14`). **Ya no queda orden que seguir:** los tres P0 sueltos
  (`R9-36`, `R9-38`, `R9-39`) son independientes entre sí, y los 4 de campo
  (`R9-40`..`R9-43`) son baratos y muy visibles: buenos para cerrar la sesión.
- **`B6`–`B10`** (Modo B, P1/P2) si preferís terminar el Modo B de una: permisos Android,
  `npm outdated`, `expo-doctor`, deps sin usar, licencias. Baratas, sin entorno. Ojo:
  extendé `B9`/`B10` a `functions/` y `vercel/`, no solo a la raíz.
- **Modo C P0** (14 filas) si querés pagar el arranque de emulador una sola vez.
  **Requiere** el recipe de `reference_essb-device-testing-and-automation` y **emulador +
  APK debug**, nunca el OnePlus de Victor. Hay dos hallazgos que **solo** se cierran ahí:
  `R9-57` (¿gana el `BackHandler` del `Modal` sobre el `useBackHandlerStep`?) y la
  verificación en vivo de `R9-47`.

**No mezcles modos en una misma sesión** (charter §3) — cada uno tiene su entorno.

## 5. Reglas que ya costaron caro — no las re-descubras

- **Una rama hecha en la nube (o por un agente) se revisa en la máquina de Victor, no solo en
  CI.** La nube y el CI corren sin `NODE_ENV`, y Victor exporta `NODE_ENV=development`. Desde la
  24, `jest.config.js` lo fija (`R9-157`), pero cualquier otra diferencia de entorno se vería igual:
  verde allá y rojo acá. Revertí cada pieza en SU entorno antes de pedir el OK.
- **Un arreglo puede crear el caso que su premisa niega (sesión 25, `R9-160`).** `R9-36` supuso
  que «lo local de ahora» es siempre «lo mío», y es falso cuando lo cambió el LWW de un cambio del
  otro teléfono. Antes de dar por buena la premisa de un arreglo, preguntá quién más escribe en
  ese mismo lugar mientras el caso espera.
- **Después de apilar, re-medí la matriz entera, no solo el tramo nuevo (sesión 25, `R9-162`).** La
  guarda nueva de `9c425a8` tapó en las pruebas la de `a7d688e`, que estaba en otro commit y en
  otra tanda. La matriz de la tanda 3 midió solo las guardas nuevas.
- **⛔ La nube ya NO es una opción (el crédito se terminó el 2026-09-24).** No la propongas. Queda
  como registro el método que se usó en las sesiones 24 y 25: cada sesión en la nube entregaba su
  informe en una rama `review/sNN-*`, que NUNCA se mergeaba; el orquestador la bajaba a `_scratch`,
  verificaba cada P0/P1 con sonda propia en la máquina de Victor, y con su OK la borraba.
- **El contenido de un `removed` no dice qué pasó (sesión 26, medido en nativo).** El SDK entrega la
  última versión que casaba con la query y `exists: true`, también para un borrado de verdad. Antes
  de diseñar sobre «el cambio trae X», medí qué trae en el SDK real.
- **Una guarda que ninguna prueba puede vigilar se mide antes de quedarse (sesión 26).** Si su
  revert no hace caer nada, o falta la prueba o la guarda es equivalente por construcción. En el
  segundo caso, quitala.
- **Desde la sesión 28 (`d093a4e`), el mock de `onSnapshot` entrega el eco propio** (antes del
  ack), la reversión de un rechazo y la re-entrega al enganchar. También modela el hilo único de
  RNFirebase (`R9-177`): un `get()` retiene el ejecutor, y un `set()` emitido mientras tanto espera
  detrás, con su eco. Antes de afirmar un orden de eventos, preguntá cuál permite el SDK real.
- **Un mock que modela UNA propiedad del SDK puede producir órdenes que el SDK no produce (sesión
  28).** El eco sin el hilo único dejaba que la respuesta de la lectura trajera lo escrito durante
  ella: 4 pruebas de fallo dejaban de caer, y la entrada de `R9-176` afirmaba que su guarda no cubría
  `R9-178`. Con el orden de RNFB, una sola guarda cubre las dos.
- **Un diff de agente guardado a mitad de un revert se ve igual que una propuesta (sesión 28).** El
  de A2 traía revertida la pieza «sesión» (`session = this.flushSession` al empezar el lote). Antes
  de integrar un diff ajeno, leelo línea por línea contra su informe.
- **Una guarda que hace `settle` puede soltar la marca que otro arreglo del MISMO diff hizo durable
  (sesión 29, `R9-185`).** La guarda de `R9-176` se midió sin conflictos retenidos, justo lo que
  `R9-181` volvió durable. «Decide el eco» tiene que decir qué pasa si el eco no llega, o si llega y
  su reversión lo suelta. Y un plazo del motor (`withDeadline`) suelta el `await`, no el ejecutor
  nativo de RNFB (`R9-186`).
- **Un arreglo de la sesión puede abrir su propio vecino, y lo ve mejor quien busca romperlo
  (sesión 30, `R9-190`).** H1 movía la marca a «la copia que encontró la lectura», medido contra la
  copia del OTRO; la copia PROPIA (un respaldo restaurado) daba «lo mío contra lo mío». Ante una
  marca que se mueve a una copia, preguntá de quién puede ser esa copia.
- **Una pieza que caía en el worktree del agente puede no caer en el propio (sesión 30).** P1q de
  A2 caía por un fantasma que solo mostraban otras dos piezas que no se integraron. Re-medí cada
  pieza en el árbol que vas a commitear; no copies la tabla del informe.
- **Un comentario de prueba que dice la consecuencia tiene que verla (sesión 30).** Dos veces el
  revert tumbó el mecanismo sin llegar a la consecuencia (el `.catch` de la cadena, la escritura en
  cola de `R9-190`): se corrigió el comentario en vez de afirmar lo no visto.
- **Una hipótesis escrita en una decisión sigue siendo una hipótesis (sesión 31).** «El sello en la
  entrada de la cola cierra la ventana» venía en la delegación de `R9-193`; medido punto de caída por
  punto, dejaba abierto uno, y lo que la cierra es otra cosa (un solo `multiSet`).
- **En un prompt, nombrá la LÍNEA, no la palabra (sesión 31).** «El `fromRead` que queda
  equivalente» tenía dos candidatos; el prompt apuntó al equivocado y lo corrigió el agente
  midiendo los dos.
- **Los `.diff.txt` que deja PowerShell llevan CRLF (sesión 31):** `git apply` los rechaza
  («patch does not apply»); `sed 's/\r$//' <diff> | git apply`.
- **Python en Windows escribe CRLF** (`open(..., 'w')` sin `newline=''`): tras un script sobre un
  `.md`, `sed -i 's/\r$//'` o `newline=''`.
- **El orden de llegada y el de proceso son dos relojes (sesión 38, `R9-220`/`R9-222`).** Con la
  cadena de lotes (`R9-175`), un lote se procesa cuando ya llegaron otros detrás. Una decisión que
  depende de «qué llegó antes» se toma en el callback de `onSnapshot`, no al procesar.
- **Una sonda que deja de mostrar el daño tras un arreglo puede haberlo esquivado (sesión 38).** La
  de `R9-223` encolaba L2 después de la copia del otro, y el arreglo de `R9-222` hizo que L2 ya no
  llevara el reloj: el caso seguía abierto con la entrada ya en cola. Antes de cerrar, preguntá si
  el caso sigue construible por otro orden.
- **Una premisa que dice «sin X entre medias» tiene que preguntar si el caso mismo es X (sesión 39,
  `R9-237`).** La 38 razonó «sin copia ajena entre medias, toda entrega de la copia de la nube es
  mía», y el respaldo que el otro restaura ES la copia ajena, solo que trae mi reloj.
- **«El ack» tiene dos relojes (sesión 39, `R9-240`):** el del SDK y el de la continuación del
  `set` en el motor. Una premisa sobre el SDK no vale para el motor sin medir en qué orden llegan a
  JS la respuesta y el snapshot.
- **Dos guardas que se cubren entre ellas dan 0 cada una en la matriz (sesión 39, `R9-236`).** Y
  juntas pueden ser la causa de un daño: `207fold` y `207acum`. La matriz mide de a una pieza.
- **Una sonda puede dejar de mostrar su daño por un arreglo HERMANO de la misma sesión (sesión 40).**
  `S39-4` y `S39-5` usaban un respaldo de W2, y `R9-239` dejó a W2 sin sello: las dos «pasaban»
  con el caso todavía abierto. Antes de convertir una sonda en prueba, corrala sobre el árbol de
  hoy, y preguntá si sigue construyendo su caso.
- **Una guarda que «el eco siempre cubre» se mide con el eco esperando en la cadena (sesión 40,
  `Fresolve`).** La 39 leyó «el eco de la resolución asienta el doc», pero `settle` corre al
  procesar, y con la cadena ocupada el ack llega antes: ahí decidía la guarda que se iba a quitar.
- **Antes de afirmar una propiedad del SDK, leé también el envoltorio propio (sesión 40, `R9-241`).**
  En RNFirebase `change.doc` es un getter que crea un snapshot nuevo por lectura, y
  `src/lib/sync/firestore.ts` lo lee una sola vez: el motor ve un objeto por cambio.
- **Una pieza que no se aplicó da «sin daño» (sesión 41).** Con `S34_PIEZAS` relativa, `require` no
  la encontró, el apply falló dentro de `S38-sonda`, y tres sondas «pasaron» con el motor de hoy.
  Antes de creerle a una sonda con pieza, mirá que el motor cambió (el `git diff --shortstat` del
  apply, o el «diff del revert» de `S34-rev`), y pasá las rutas de entorno absolutas.
- **«Hace falta mientras la entrada espera, y no después de su ack» tiene que preguntar qué otros
  acks pasan mientras espera (sesión 41, `R9-242`).** La entrada que reemplazó una subida en vuelo
  sobrevive al ack de esa subida, con su reloj y el de antes en el `own`.
- **Toda retirada que corre al PROCESAR tiene el problema de `Fresolve` (sesión 41, `R9-243`).** Con
  la cadena de lotes ocupada, lo que llega después se juzga al llegar, antes de la retirada.
- **Un `fire` del mock con los datos de la nube y nada en vuelo es un evento que el SDK no levanta
  (sesión 41, `R9-244`).** El `View` del SDK compara los datos (`docsEqual`), y `__fire` no. Antes
  de leer una prueba con `fire`, preguntá si esa copia difiere de la nube.
- **Una hipótesis que cierra la sonda puede no cerrar el caso que nombra la entrada (sesión 42,
  `R9-234`).** `H239join` cerraba `S41-6` (con un ack en medio) y no la retirada sin nada después,
  que era lo que decía la entrada. Antes de aplicar la hipótesis de una revisión, construí el caso
  de la entrada, no solo el de la sonda.
- **Una decisión tomada con un veredicto que puede estar mal no se guarda sin lo que permite
  corregirla (sesión 42).** Con la tabla ilegible, «esta copia no es mía» puede ser falso
  (`R9-230`); guardar la retirada sola tumbó cuatro pruebas de `R9-208`, y guardarla con el reloj
  de la copia deja que la relectura la corrija.
- **`S41-motor` restaura su base encima de `SyncEngine.ts` también cuando falla (sesión 42).** Toma
  el motor por NOMBRE dentro de `_scratch`; con la ruta absoluta falla, y borró un arreglo sin
  commitear. Commiteá antes de correr una sonda con otro motor.
- **Una reversión es también una entrega de la nube (sesión 43, `R9-247`).** Vuelve a la copia que
  tiene el servidor, y esa copia puede ser del otro: una excepción que mira lo que trae el
  `removed` (mi payload rechazado) exime también la escritura del otro que viene con él.
- **Una escritura que el rechazo descarta deja de ser «mía» antes de que llegue su reversión
  (sesión 43, `R9-248`).** El descarte la saca de la cola, e `isOwnCopy` lee la cola.
- **Un arreglo de un hecho del servidor no se guarda con `isCurrent()` (sesión 43, `R9-249`).** El
  ack dice que la escritura llegó a la nube de su dueño, sea cual sea la sesión; con la guarda, el
  arreglo de `R9-242` valía solo dentro de ella.
- **Un reloj viejo en una escritura propia rompe toda premisa de «más nueva que lo local» (sesión
  43, `R9-245`).** El respaldo restaurado lleva el `updatedAt` del archivo.
- **Un arreglo de la sesión puede quitarle el caso a la prueba que la misma sesión acaba de escribir
  (sesión 44, `R9-246`).** La de la lectura sola dejó de caer con su pieza dos commits después, con
  `R9-247`. Re-medí las piezas de los commits anteriores tras cada arreglo, no solo en la matriz.
- **Una guarda agregada por un veredicto incierto también se mide (sesión 44, `R9-251`).** Si su
  revert no tumba nada, escribí qué muestra la sonda (el mecanismo) y qué falta (el daño).
- **«Equivalente por construcción» se razona con la cadena entera (sesión 44).** El `clear()` del
  piso en `stop()` parecía higiene. Una entrega tardía lee `uid` nulo, ninguna anotación casa, y
  nunca llega a leer el piso.
- **Una guarda que da 0 en la matriz puede decidir en un estado que ninguna prueba arma (sesión
  45, `R9-251`).** La de `ownUnread` decide con el conflicto EN MEMORIA cuando vuelve la
  relectura. `S44-2` lo tenía retenido, y el eco de mi escritura lo asentaba antes. Antes de
  proponer quitar una guarda, variá el estado del doc, no solo el orden.
- **Lo que una prueba da por esperado también se revisa (sesión 45, `R9-252`).** Las pruebas de
  `R9-245` y `R9-248` esperan «tras reiniciar, ningún conflicto» con «lo suyo» todavía en la
  sesión, y eso era el daño.
- **Una decisión de aceptar un daño también se escribe donde ocurre (sesión 46, `R9-252`).** El
  comentario va en la rama que asienta el conflicto, para que la próxima revisión no lo
  re-descubra como hallazgo.
- **Un comentario que enumera casos se mide caso por caso (sesión 47, `R9-253`).** El de `R9-252`
  generalizó «un respaldo restaurado» a partir de una sonda que tenía uno solo, bajo el piso.
- **Una guarda que espera a releer necesita una salida (sesión 49, `R9-212`).** Una lectura puede
  fallar siempre (un valor más grande que la `CursorWindow` de Android), y «no escribir hasta
  leer» convertía una pérdida de una vez en una permanente. Antes de esperar, preguntá si el fallo
  puede ser determinista.
- **Una unión que devuelve una entrada vieja pregunta si su doc cambió desde entonces (sesión 49).**
  `set` no tiene guarda: sin la marca, la entrada de disco subía encima de la edición nueva o de la
  copia del otro.
- **El control también se lee entero (sesión 49).** El caso con la cola legible era solo el control
  de la unión, y su final (local R, nube D) era un disparador común de `R9-126`.
- **Una pieza que dice «el arreglo entero» se compara con el motor de antes (sesión 50,
  `R9-254`).** `R212` quitaba la bandera y dejaba la asignación nueva de `hydrateQueue`. Con la
  pieza, una escritura durante la hidratación se perdía igual que hoy; con el motor de `8f59942`,
  quedaba. Un «¿lo abrió el arreglo?» se mide con el motor del commit anterior
  (`_scratch/S50-viejo.cjs.txt`).
- **«La copia aplicada es más nueva» pregunta qué pasa sin copia local (sesión 50, `R9-256`).** LWW
  compara con lo local, y sin lo local no compara nada. Una lápida en cola es justo ese caso, y la
  entrada es la más nueva.
- **Un estado que vive solo en memoria protege solo mientras vive el proceso (sesión 50,
  `R9-255`).** Si la decisión se escribe en disco más tarde, preguntá qué queda en disco si el
  proceso muere antes.
- **«Los duplicados son inocuos» se coteja con el ledger (sesión 51, `R9-257`).** El motor lo
  decía del bulk push, y `R9-126` dice lo contrario: un push con el reloj viejo pisa la copia más
  nueva. «No grabar el flag» habría repetido el push entero; se reintenta solo la colección que
  falló.
- **Una guarda nueva junto a una vieja se mide con la pieza de la vieja (sesión 51, `R9-259`).**
  `R9-256` tapó la guarda de `R9-197` en su única prueba: sola daba 0, y con `R256` volvía a caer.
- **El control de una prueba de orden se fuerza, no se supone (sesión 51).** «La lectura vuelve
  antes del ack» era falso sin `mockSetGate`, y lo mostró el control en la primera corrida.
- **Una puerta del mock en una lectura tiene que ver el disco de cuando se pidió (sesión 52,
  `R9-260`).** AsyncStorage en Android corre en un `SerialExecutor`: una escritura pedida durante
  una lectura lenta va detrás. La puerta de `colaIlegible` lee al abrirse, y con el motor viejo el
  caso de `R9-115` «pasaba». Antes de un «¿lo abrió?», preguntá si la sonda deja escribir durante
  la lectura.
- **Una marca que se vacía al usarse pregunta qué pasa si se usa dos veces (sesión 52,
  `R9-260`).** `joinQueue` vacía `queueTouched`, y dos `start()` del mismo uid pedían dos
  hidrataciones: la segunda unión volvía a meter la entrada vieja.
- **Una guarda que dice «atendido» adelanta el cursor (sesión 52, `R9-262`).** Lo que deja fuera
  no vuelve a llegar, y el final cambia según haya o no un reinicio entre medias. Una guarda que
  espera a otra escritura retiene; no asienta.
- **Una aceptación vale para la ventana que midió (sesión 52, `R9-261`).** `R9-255` se aceptó
  «tras dos lecturas fallidas», y la 51 abrió la misma ventana sin ninguna.
- **Una escritura que espera una lectura previa se ordena con las que vienen detrás (sesión 53,
  `R9-38`).** La edición sin sesión espera a leer el dueño; la de la sesión que llegaba después
  subía y salía de la cola antes, y la vieja subía encima. Ninguna comprobación sobre la cola lo ve
  después: se ordenan en la misma cadena.
- **Un marcador que significa algo no usa un valor vacío (sesión 53).** `''` vuelve como `null` en
  el mock de AsyncStorage, y un dueño nulo significa «no preguntar». Se usa un valor explícito que
  no es de nadie (`(deleted)`).
- **Antes de arreglar un camino del motor, comprobá que los llamadores llegan a él (sesión 53).**
  Con la sesión cerrada el motor existe, parado: si `getSyncEngine()` hubiera devuelto `null`, el
  arreglo de `R9-38` habría pasado sus pruebas sin servir en la app.
- **Una guarda que pasa de asentar a retener puede cubrir a otra en su prueba (sesión 53).**
  `S176cola` perdió el testigo de `R9-197`; con `R256` vuelve a caer. Medilas juntas.
- **Una unión que dice «gana X» pregunta qué pasa con lo que pierde (sesión 54, `R9-269`).**
  `joinPrep` borraba la clave de origen entera, también la entrada que no ganó: «cerrar sesión no
  borra nada» se cumplía al cerrar y se rompía al volver a entrar.
- **Un marcador escrito por otro, después y tragándose el fallo, puede decir la cuenta anterior
  (sesión 54, `R9-270`).** El motor usa el dueño que dice `start()` en el proceso, y en el
  siguiente, el disco.
- **Una ventana sin sesión no tiene quien relea (sesión 54, `R9-271`).** Con sesión, `start()`
  relee la cola; sin ella, la edición espera a la escritura siguiente.
- **Una prueba de una carrera tiene que construirla (sesión 55, `R9-269`).** La primera versión
  de la prueba no la construía: todo chocaba, la unión no escribía y la puerta no retenía. Pasaba
  sin el turno; su control (`antesDeAbrir`) lo mostró al revertir la pieza.
- **Un turno compartido con una espera dentro se traba (sesión 55).** La clave de la Mesa espera al
  primer estado de auth, cuya unión toma un turno: se resuelve la clave antes de pedir turno.
- **En el mock, `setItem` pasa por `multiSet` (sesión 54).** Una puerta sobre todo `multiSet`
  cuelga la prueba, y un `spyOn` sobre un `jest.fn` devuelve el mismo, que se llama a sí mismo
  (memoria agotada): la puerta, solo en la llamada a retener, y la implementación real con
  `getMockImplementation()`.
- **Solo revisar y reportar. NO se toca código de la app.** Lo único que se escribe es el
  ledger. Las mejoras del Modo D se **redactan**, no se aplican.
- **Un mensaje de Victor a mitad de turno va al frente AHORA**, antes de seguir tu propio
  bucle (`feedback_essb-user-requests-preempt`). Pasó en las sesiones 5 y 6, y las dos veces
  atenderlo primero fue lo correcto.
- **Checkpoint por área, COMPLETO, en el momento:** `detail/<slug>.md` **+** la fila del
  índice **+** la entrada en `BUGS.md`, antes de pasar a la siguiente área. La sesión 4
  escribió solo el `detail/` y dejó el índice mintiendo durante 11 días. Si te quedás sin
  margen a mitad, deja la fila en `EN CURSO` — pero **nunca** dejes un `detail/` escrito con
  el índice diciendo `PENDIENTE`.
- **Una sonda ejecutable vale más que una lectura, y también vale para VERIFICAR un informe
  ajeno.** En la sesión 6 los 4 agentes probaron **19 de 21 hallazgos** con sondas contra el
  código real; varias **refutaron la hipótesis inicial del propio agente** y encontraron algo
  distinto y mejor. Cuando una sonda contradice tu lectura, gana la sonda.
- **Los agentes aciertan el mecanismo y fallan el detalle: re-verificá lo portante.**
  **Comprobá a mano cada afirmación de la que cuelgue un P0** antes de darla por buena;
  cuestan un `grep` cada una. **Rindió otra vez en la sesión 6:** al re-verificar los 6 P0
  del fan-out, los 6 se sostuvieron pero salieron 3 correcciones, y una (`R9-46`) invalidaba
  el argumento de alcanzabilidad entero. El defecto sobrevivió; la explicación, no.
- **Borrá las sondas ejecutables al cerrar la fila, o sacalas de `testMatch`.**
  `_scratch/` está gitignoreado pero **NO** jest-ignoreado: un `*.test.ts` olvidado ahí se
  suma a `npm test` sin aparecer jamás en `git status`. El truco barato: renombrar a
  `.ts.txt`. (En la sesión 6 no hizo falta: las sondas vivían en worktrees de agentes, que se
  limpian solos — pero por eso mismo **sus recetas de reconstrucción están en cada
  `detail/`**, y son lo único que queda.)
- **`TZ=... npx jest` NO propaga la variable desde Bash en Windows.** Usá
  `$env:TZ = 'Europe/Madrid'; npx jest <ruta>` en PowerShell. Sin esto, cualquier sonda de
  horario de verano pasa en falso.
- **Prettier manda sobre el ledger.** `format:check` de CI cubre `**/*.md` y
  `.prettierignore` no excluye `DOCS/`. Corré
  `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` después de cada checkpoint.
  Prettier **rellena cada celda de tabla al ancho de la más ancha** — por eso la columna
  `Área` del índice está capada a ~55 chars y `Detalle` es un slug pelón. No metas prosa en
  las tablas del índice. Ojo también: si insertás texto a mano en un `.md`, **deja línea en
  blanco antes de un `---`** o el párrafo anterior se vuelve un encabezado.
- **`NUNCA npm audit fix --force` en este repo.** Propone downgrades que romperían la app
  en dos lugares (`R9-1`, `R9-8`). `npm audit fix` a secas es seguro.
- **El reflejo de `overrides` no siempre sirve:** verificá si el parche es ESM-puro antes de
  recomendarlo. `decode-uri-component@0.5.0` es ESM-only y rompería Metro; `uuid@11.1.1`
  trae build dual y la raíz ya lo corre en verde. Mismo patrón, veredictos opuestos.
- **Un hallazgo de "código muerto" tiene que buscar POR QUÉ sigue ahí antes de recomendar
  borrarlo.** `R9-7` recomendó borrar `functions/` sin ver que la justificación estaba a un
  `grep` de distancia.
- **Verificá contra `git log` antes de afirmar un estado que venga de memoria o del
  charter.** La sesión 1 encontró que la semilla BUG-10 del charter ya estaba arreglada
  (`b17ec99`), y la sesión 2 encontró que la memoria de device-testing miente sobre el
  `signingConfig` de release.
- **Antes de creerle a un conteo, verificá qué extrajiste.** En `B3`, una extracción mal
  hecha agarró la contraseña de _debug_ (`'android'`, 7 chars) y devolvió 43 falsos
  positivos.
- **Pedí el OK a Victor antes de commitear el ledger** (charter §5.4/§7). Ya lo dio
  **cuatro** veces con el formato **commit + push directo a `main`**, así que el formato está
  fijado — pero la autorización es por sesión, no se hereda.
- **Si despachás agentes:** `isolation: "worktree"` en **todos**, incluso los de solo
  lectura; cada uno escribe **únicamente** a `DOCS/REVIEW_2026-09/_scratch/<área>.md` (ya
  está en `.gitignore`), nunca a `INDEX.md`; el orquestador fusiona todo en **una** pasada al
  final y verifica el estado real de cada worktree en vez de confiar en el "completado".
  El fan-out necesita que **Victor lo pida explícitamente**.
- **Tamaño del fan-out: 4, no 11.** La sesión 3 lanzó 11 agentes Opus a la vez y **los 11
  murieron por límite de uso** sin escribir una línea. Relanzados en tanda de 4, los 4
  completaron; en la sesión 6, otra tanda de 4 volvió a completar entera. **4 es el número.**
  Pedile además que **devuelva el informe íntegro en su mensaje final**: el `_scratch/` queda
  en **su** worktree, que se limpia solo.
- **Dale a cada agente los "ya reportado, no lo repitas" por número.** En la sesión 6 los 4
  informes distinguieron correctamente su hallazgo de los `R9-*` previos, y tres de ellos
  argumentaron **por qué** su mecanismo era distinto. Eso ahorró toda una pasada de dedup.
- **Un worktree de agente no tiene `node_modules`.** Si necesita correr jest, hace falta
  `New-Item -ItemType Junction -Path <worktree>\node_modules -Target <repo>\node_modules`, y
  borrarla al terminar con `(Get-Item <ruta>).Delete()` — **un `rm -rf` seguiría la junction**
  y borraría el `node_modules` real.
- **En una sesión de ARREGLOS, una prueba nueva no vale nada hasta que la ves FALLAR sin el
  arreglo.** Pasó en la sesión 7: tres pruebas de `R9-47` pasaban igual con el código roto
  (una porque el re-render no llegaba a aplicarse; otra porque `setSectionNote` ya borra una
  sección vacía, así que no discriminaba nada). Reescritas contra el mecanismo real, la
  primera sí falla. Revertí el arreglo, corré, restauralo: cuesta 30 segundos.
- ~~**`react-test-renderer` no aguanta re-renderizar una pantalla del tamaño de la Mesa.**~~
  **FALSO (sesión 24, `R9-157`):** «Unable to locate attached view in the native tree» venía de
  que Victor exporta `NODE_ENV=development`, no del tamaño de la pantalla. Desde la 24,
  `jest.config.js` fija `NODE_ENV=test`, y las pruebas de la Mesa re-renderizan en jest.
- **`python - <<'EOF'` NO persiste las escrituras a `src/i18n/translations.ts`.** Falla en
  silencio: los `assert` pasan, imprime el "ok", y el archivo queda igual. Descubierto en la
  sesión 7 tras cuatro intentos. Para ese archivo usá la herramienta de edición; para los
  demás el heredoc funcionó sin problema.
- **Un revert mal hecho se ve EXACTAMENTE igual que una prueba que no discrimina.** En la
  sesión 8, el primer revert de `R9-46` «pasó»: el `sed` había parcheado el `catch` de
  `valuesEqual` en vez de `applyRemoteChange`, porque el patrón `return false;` aparecía
  antes en el archivo. **Antes de concluir que una prueba no discrimina, `diff` el revert y
  confirmá que tocó la línea que creías.**
- **Una prueba de «no pasa nada» suele no discriminar, y eso está bien SI lo sabés.** Varias
  de la sesión 8 pasan con y sin el arreglo a propósito (su trabajo es impedir que una guarda
  se vuelva preguntona, o que se borre de más). Distinguí esas de las discriminantes al
  escribirlas, o te vas a creer cubierto sin estarlo — le pasó a la primera versión del test
  de `R9-44`.
- **Si un commit lleva DOS arreglos, preguntá si uno desarma la prueba del otro.** Pasó en la
  sesión 9 y lo cazó la 10: el backoff de `R9-33` hacía que el `flush()` de la prueba de
  `R9-34` saliera temprano, así que la carrera que decía probar no llegaba a ocurrir y la
  prueba pasaba en verde por la razón trivial. **Es la variante más traicionera de «una
  prueba de un solo caso no prueba el mecanismo»**, porque el arreglo culpable está en el
  mismo diff y parece que se refuerzan. Antídoto barato: meterle a la prueba un **control del
  mecanismo** (`expect(...attempts).toBe(1)`) que falle ruidosamente si la carrera deja de
  ocurrir.
- **La paridad de SUPERFICIE no ve la paridad de COMPORTAMIENTO.** Segunda mitad de la
  sesión 12: la prueba nueva de aislamiento de rutas web pasaba en verde ejercitando el
  `ErrorBoundary` **nativo**, porque los dos layouts importan el especificador pelado
  `@components/ErrorBoundary`. Misma clase que `R9-15`, y
  `webNativeModuleParity.test.ts` **no puede** cazarla: ambos archivos exportan
  `ErrorBoundary`, lo que difiere es lo que hace. **Regla: si una prueba dice «árbol web»,
  redirigí TODOS los especificadores pelados que la pantalla importe, no solo los que
  sospechás.**
- **Cuando algo queda «dicho, no arreglado», preguntá si el camino barato es el honesto.**
  La letra roja de web se iba a cerrar corrigiendo la COPIA para que describiera la carencia
  («solo en inglés»). El camino bueno era quitar la carencia: un pack por versión. Coste
  real, un rato; resultado, la función existe en español. Contraste con el otro caso de la
  misma sesión: en `R9-14` la opción cara (montar 5 providers) NO era la buena, porque habría
  renderizado pantallas vacías. **Lo barato no es siempre lo malo ni lo caro siempre lo
  bueno: preguntá cuál de los dos deja al usuario con algo cierto.**
- **Un mock con factoría literal no COMPRUEBA la superficie de un módulo: la SUSTITUYE.**
  La trampa de la sesión 12. `chapterReaderWebFontPicker.test.tsx` mockeaba
  `@lib/reading/redLetterText.web` con un objeto escrito a mano de 3 claves, así que ese
  objeto **era** la superficie del módulo dentro de la prueba. Al redirigirle el import pelado
  (el arreglo de `R9-15`), la prueba habría seguido roja **después** de arreglar `R9-13`, y el
  reflejo obvio —añadir la clave que falta al mock— la habría puesto verde sin mirar jamás el
  archivo real. Antídoto: `...jest.requireActual(<mismo especificador>)` y stubear **solo** lo
  que de verdad estorba.
- **Si el bug es de resolución por plataforma, arreglá el TEST primero y mirá el rojo.** En la
  sesión 12 el orden fue `R9-15` → `R9-13`, no al revés, y por eso se pudo ver el `TypeError`
  exacto de producción (`hasRedLetterData is not a function`, en la línea real del componente)
  dentro de jest antes de tocar código de la app. Al revés no se habría visto nunca, porque el
  bug es invisible para las tres compuertas por construcción.
- **Para verificar algo de WEB de verdad: `npx expo export --platform web` y servilo.** Es la
  única forma de ver la resolución `.web` que ni `tsc` ni jest pueden ver. Dos gotchas que
  cuestan tiempo: (1) un servidor estático pelado **no tiene el rewrite catch-all** de
  `firebase.json`, así que una URL profunda da 404 — **navegá siempre dentro de la SPA**; (2)
  recargar con el worker de SQLite vivo dispara el bloqueo de OPFS
  (`NoModificationAllowedError`) y el botón «Clear data & reload» no siempre lo salva. Además,
  grepear el bundle vale como prueba: si están `loadRedLetterSpans` y `web-red-letter.json` y
  **no** están `redLetterByVersion`/`buildSpanMap`, el pelado resolvió al `.web`.
- **`python - <<'EOF'` decodifica el script en cp1252 en esta máquina, no en UTF-8.** Primo
  hermano del gotcha de `translations.ts`, y falla distinto: los acentos pasan (están en
  cp1252) pero `≥`, `⊆` o `✅` se corrompen y un `assert <ancla> in s` falla sin explicar por
  qué. Costó dos intentos en la sesión 12. Usá **`PYTHONUTF8=1 python script.py`** con el
  script escrito a archivo por la herramienta de edición, no por heredoc.
- **Revertir un `let` de módulo NO discrimina si hay un `__resetForTests()` que lo
  reasigna.** En la sesión 10, revertir `lastKnownUnlocked = false` en su declaración dejó las
  33 pruebas en verde, porque el `beforeEach` llama a `__resetForTests()` y **es ese** el que
  fija el valor inicial bajo jest. Hay que revertir **los dos sitios**. Corolario al derecho:
  un arreglo que toque solo el helper de reset **pasa los tests y deja producción rota**.
- **Una prueba vieja que se pone roja al arreglar un bug puede estar encodificando el bug.**
  En la sesión 10, dos pruebas de `OfferingSheet` montaban «ya desbloqueado» sembrando un
  `'true'` viejo en la caché con RevenueCat reportando inactiva — o sea, el escenario exacto
  de `R9-9`. Estaban verdes **gracias** al defecto. Antes de «adaptar» una prueba que se cae,
  preguntá si lo que afirmaba era cierto.
- **Un hallazgo de severidad media pegado a uno P0 puede ser el que DESANDA al P0.** `R9-10`
  estaba catalogado como «media, se auto-repara en el siguiente arranque»; en realidad
  anulaba el arreglo de `R9-9` entero (la revocación llegaba y la lectura de caché la
  pisaba). Arreglar el P0 solo no le habría cambiado nada a ningún usuario.
- **Actualizá memoria y este archivo al cerrar la sesión** (`feedback_essb-memory-freshness`).

## 6. Hechos duros que ya no hay que volver a averiguar

- **El repo de GitHub es PÚBLICO** (`VictorVidal7/EternalStoneBibleAppV4`). Cualquier cosa
  commiteada es material publicado.
- **0 secretos de GitHub Actions** en el repo y `default_workflow_permissions: "read"` → el
  radio de daño de un hallazgo de CI es casi nulo.
- **Las reglas de Firestore NO están versionadas** (no hay `firestore.rules`, ni sección en
  `firebase.json`). Son correctas (default-deny + `request.auth.uid == uid`) y su texto vivo
  está **capturado íntegro** en `detail/B4-reglas-firestore-storage.md`.
- **Todas las rutas Firestore del cliente van bajo `users/{uid}/`.** `giftCodes` es de raíz
  y está deliberadamente **fuera** de las reglas → ningún cliente puede enumerar códigos.
  **Está bien así.**
- **Hay 5 adaptadores de sync, no 3:** `notes`, `highlights`, `reviewEvents`
  (`registerOfflineAdapters.ts:17-19`), **`favorites`** (`FavoritesContext.tsx:228`) y
  **`memoryDeck`** (`MemoryDeckContext.tsx:267`). Y **8 colecciones Firestore**, enumeradas en
  `deleteAccountData.ts:22-43`.
- **La racha, el progreso de lectura, los planes y los logros NO viajan entre dispositivos.**
  No hay colección ni adaptador para ellos: el único camino es el respaldo manual. La app lo
  dice con honestidad en el diálogo de importar (`translations.ts:4168`) y **no** en el
  anzuelo de inicio de sesión (`:3877`, «Inicia sesión para sincronizar tus datos entre
  dispositivos»). Alinear ese copy es decisión de producto de Victor, no un bug.
- **La app llama al backend de Vercel** (`giftCodeService.ts:44` →
  `essb-gift-redeem.vercel.app/api/redeem`). **`functions/` NO está desplegada, y es a
  propósito** — Cloud Functions exige plan Blaze. **No propongas borrarla** (`R9-7`).
- **Firebase Storage no se usa.** **`TogetherContext` no toca Firestore** (los grupos de
  "Juntos" son locales).
- **`/android` está gitignoreado.** La contraseña del keystore de release vive fuera de git
  y **nunca entró al historial** (verificado sobre los 5558 blobs).
- **CI corre Node 24** desde la sesión 16 (antes 20, y eso es `R9-82`: `node:sqlite` no existe
  antes de 22, así que `buildWebPacks.test.js` no CARGABA en CI y su compuerta nunca se
  ejecutó). La máquina de Victor tiene **24.11.1** y `package.json` ya declara
  `engines.node: ">=22"`. **La suite entera se verificó verde en 22.23.2 y en 24.11.1, y roja
  en 20.20.2.** Para correrla en otra versión sin instalar nada:
  `$N=$(npx --yes node@22 -e "process.stdout.write(process.execPath)"); & $N ./node_modules/jest/bin/jest.js`.
- **`tsc` y jest resuelven SIEMPRE al archivo nativo**, nunca al `.web`. Las 14 parejas
  `*.web.*` solo están cubiertas donde alguien escribió a mano un `jest.mock` que redirige
  (patrón en `webStubProviders.test.tsx:516-532`; la pareja de `MemoryDeckContext` **sí** lo
  tiene y salió limpia). **Cualquier divergencia de API entre una pareja web/native sin ese
  mock es invisible para las tres compuertas.**
- **La suite es CIEGA al horario de verano.** Ninguna prueba fija `TZ`. La máquina de Victor
  está en `America/Mexico_City`, **que abolió el DST en 2022**, y el CI en **UTC** (medido en el
  log en la sesión 22; antes aquí decía que en Ciudad de México). Ninguna de las dos zonas tiene
  cambio de hora.
- **`_scratch/` está gitignoreado pero NO jest-ignoreado** (ver §5).
- **El último deploy web es del 2026-08-13.** La regresión de `R9-13` entró el 2026-08-18,
  **5 días DESPUÉS**, así que el sitio vivo está sano y el bug está solo **armado**.
  Trátalo como bloqueante de release.
- **El recipe del token de `firebase-tools` generaliza a la API de Hosting**, no solo a la de
  Rules. Ver `reference_essb-firebase-cli-token-for-rules-api`.
- **La ofrenda desbloquea premium PARA SIEMPRE** (confirmado por Victor, 2026-09-03). El
  `GRANT_DURATION = 'lifetime'` del backend de canje es correcto y un código regalado concede
  exactamente lo mismo que una compra.
- **Ningún `fetch` de la app tiene timeout** — los 6 call sites (`R9-40`).
- **`@prep_notes` es UNA sola clave JSON con todos los sermones**, y
  `AsyncStorage_db_size_in_MB` no está configurado → rige el techo de **6 MB por defecto de
  Android** para toda la base de AsyncStorage, compartido con progreso, mazo, ilustraciones y
  series.
- **La Mesa no vive en `src/features/prep/`** (esa carpeta está **vacía**): los stores están
  en `src/features/study/` y las pantallas en `app/features/prep/`.
- **El gating premium de la Mesa solo OCULTA, nunca borra** (verificado en `A9`): un
  ex-premium conserva todo su trabajo y mantiene la salida gratuita «copiar esquema». No
  busques ahí un P0 de dinero.
- **El intervalo del SRS está acotado en [1, 48] días por construcción** (probado en `A10`):
  no hay desbordamiento posible, ni `NaN`, ni negativos, ni con 20 fallos ni con 200 aciertos
  encadenados.
- **El arreglo del "anillo morado" (clave de día LOCAL) está aplicado completo** en los 4
  caminos de escritura de racha y en toda la aritmética de fechas de `A10` y `A11`. Cero
  `toISOString().split('T')[0]` disfrazado de local.

## 7. Decisiones de Victor que NO hay que volver a preguntarle

- **`R9-59` y `R9-38`, decididos el 2026-10-03 (tras la sesión 51), con la recomendación de
  Claude:**
  - **La Mesa de preparación (`@prep_notes`, `@prep_series`, `@prep_illustrations`,
    `@prep_self_review`) se guarda por cuenta** (la opción (b) de la sesión 22). Cada uno ve solo
    lo suyo en un teléfono compartido, y cerrar sesión no borra nada. Se corrige también la frase
    de `prepNotes.ts` («theirs alone»). Progreso y logros siguen por aparato, como hoy: la decisión
    es para la Mesa.
  - **`R9-38`:** si vuelve a entrar la misma cuenta, se sube lo editado con la sesión cerrada. Si
    entra otra, se le pregunta antes, como la pregunta del dueño anterior (`R9-166`).
  - **El cómo es técnico y está delegado:** qué pasa con los datos de la Mesa sin dueño de
    antes, con el respaldo exportado, y con qué se registra lo editado sin sesión. Sin repetir el
    bulk push entero (`R9-126`). Se decide midiendo, y se deja escrito.
  - **IMPLEMENTADOS en la sesión 53** (`ea182dc`, `a85df96`): el cómo está en las entradas de
    `R9-38` y `R9-59`, en `SyncEngine.queueWrite` y en `src/features/study/prepAccount.ts`.

- **Las 2 preguntas que dejó abierta la sesión 3 están RESPONDIDAS** (ofrenda = premium para
  siempre; `R9-13` no está en producción). No las vuelvas a plantear.
- **Los 4 hallazgos de campo `R9-40`..`R9-43` NO se arreglan todavía** — quedan registrados
  y se atacan junto con los P0 en la sesión de arreglos (preguntado explícitamente el
  2026-09-07).
- **`R9-42`, cómo arreglarlo cuando toque: repartir los 2 px.**
  `left: -(fontSizes.sm + spacing['0.5'])` → `-(fontSizes.sm + 1)`, o sea −16 → −15, 1 px por
  lado. Descartó ampliar el canalón y achicar el ícono. **Ya está decidido.**
- **Fan-out: Victor lo pide explícitamente cuando lo quiere** ("manda al menos 3 agentes",
  sesión 6). No lo asumas por defecto.
- **Severidades de la sesión 25:** `R9-160` y `R9-166` son P0 y `R9-161` es P1, como se
  propusieron. **`R9-173`:** extender la opción (b) de `R9-109` al fallo de red y al 404 de un
  navegador con texto (decisión delegada al orquestador). La prioridad es baja.
- **Crédito de la nube:** se acabó el 2026-09-24. Desde la sesión 26 se trabaja solo en la
  terminal, y la nube no se propone salvo que Victor la pida.
- **El diseño de `R9-124` (sesión 26):** si el doc de un `removed` todavía existe, NO se suelta a
  ciegas del conjunto no asentado. Pasa por `applyRemoteChange` y se retiene o se suelta según lo
  que resulte, para que un conflicto pendiente conserve su marca (lo aprobó Victor antes del
  arreglo).
- **`R9-181` (sesión 27, delegado al orquestador «a su mejor criterio»): la (b), acotada a los
  docs con la marca.** La rama retenida vuelve a detectar el conflicto también ante una re-entrega
  MÁS VIEJA con campos distintos. Los docs sin marca siguen como `R9-126`. El porqué está en la
  entrada de `R9-181`.
- **`R9-192` (delegado al orquestador al cerrar la 30, 2026-09-29): se integran P2 y P3 de A2.** El
  conflicto tiene que mostrar lo que la nube tiene de verdad; tras reiniciar ya lo hace, y P2/P3
  hacen que la sesión diga lo mismo. HX-push queda descartado (resucita un doc que el otro borró de
  verdad). Con P3, el `fromRead ||` de la marca es equivalente y se quita (medido en la 31).
  **Integrado en la 32; con los sellos de `R9-193`, P3 resultó equivalente y se quitó (`R9-196`).**
- **`R9-193` (delegado igual): los «sellos propios» persistidos, unificados con `R9-190`.** Un solo
  mecanismo responde «¿esta copia es mía?», y los sellos reemplazan a `ownAcked`. Dheld y F se
  quedan solo si una prueba las ve caer (en la 31: Dheld y Dwin fuera, `Fsettle`/`Fresolve`
  dentro). La ventana de caída se cierra con la cola y la tabla de sellos en un solo `multiSet`: la
  31 midió que el sello en la entrada de la cola, solo, no alcanza. Con la tabla ilegible, se
  muestra el conflicto (elegido por el orquestador por la delegación, como `R9-191`). **Integrado
  en la 32.**
- **`+Y` para `R9-194` (delegado al orquestador tras el merge de la 31, 2026-09-30): se acepta.**
  `recentAcked` no responde «¿es mía?»: solo pasa el reloj de la última escritura tomada de un doc
  SIN conflicto a `own` de la entrada NUEVA siguiente de ese doc, que es lo persistido. La
  respuesta sigue siendo una sola (`isOwnCopy` sobre lo persistido), la clave lleva el uid, y si
  el proceso muere antes de la entrada siguiente no hay nada en cola que pueda dar el fantasma.
  Integrado en la 32 (`e7d7fb8`), con comentario.
- **Cuando avise del límite de uso de 5 h, la prioridad es volcar a disco y commitear, no
  terminar de verificar.** Es lo que se decidió en la sesión 6 y por eso existe la deuda de
  re-verificación del `⛔` de arriba: fue un intercambio consciente, no un olvido.

## 8. Decisiones abiertas para Victor (no son bugs)

- **El tope de cuota del piso de no asentados (`R9-39`, sesión 24):** mientras un conflicto siga
  sin resolver, cada enganche de esa colección vuelve a leer desde su piso. ¿Se le pone un tope,
  por ejemplo un aviso si un conflicto lleva N días pendiente? **Medido en la 25:** con 300 docs,
  en un año son 300 928 lecturas contra 3 647. Ojo: un aviso no cubre `R9-164`, un retenido sin
  conflicto visible.
- **`R9-158`:** si no se puede leer el marcador del dueño del almacén, ¿se pregunta (fallar
  cerrado) o se sigue sin preguntar, como hoy? Desde la 25 está medido (suben las 12 notas), y va
  junto con su gemelo: `claimLocalStore` también se traga el fallo al ESCRIBIR el marcador.
- ~~**`R9-59`:** ¿«device-local» debe significar también «visible para cualquiera que use el
  aparato»?~~ **Decidido el 2026-10-03:** la Mesa, por cuenta (ver la §7).
- **`R9-268` (sesión 53):** a una cuenta que ya hizo su bulk push en este teléfono se le pregunta
  «¿Migrar?», y «Migrar» no sube nada. ¿No se le pregunta (y se le dice que los datos locales no se
  migran), o se migra solo lo que falta en su nube? Repetir el push entero no es una opción
  (`R9-126`).
- ~~**La severidad de `R9-269` (sesión 54):** ¿P1, o P0 por ser pérdida de datos?~~ **Decidido
  P1** por el orquestador con la delegación de Victor («como mejor convenga», 2026-10-03): hace
  falta el mismo pasaje en las dos Mesas. Se arregla primero en la 55.
- **El anzuelo de inicio de sesión** promete sincronizar "tus datos" cuando la racha, el
  progreso y los logros no viajan. ¿Se califica el copy?

## 9. Abierto, sin relación con la revisión

De `essb-master-backlog` — **no** son hallazgos de esta revisión, no los registres como
tales: lanzamiento público en Play Store (Track 2, bloqueado por la puerta de Google de 12
testers × 14 días; Victor dijo "hablémoslo" y **sigue sin empezar**) · licencia NLT/Tyndale
sin respuesta · registro de marca IMPI · mapa geográfico real para "Rutas bíblicas"
(diferido a propósito). **Ya NO está abierto el merge de `chore/release-3.2.62`:** se
mergeó en `19fee16` y la rama se borró — `main` lleva `3.2.62` / `versionCode 74`
(verificado contra `git log` el 2026-09-14). Si alguna memoria dice lo contrario, miente.
