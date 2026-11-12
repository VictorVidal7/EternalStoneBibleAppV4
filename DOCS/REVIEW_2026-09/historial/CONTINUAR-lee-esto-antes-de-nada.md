# Historial — `CONTINUAR.md`: «Lee esto antes de nada» (sesiones 10 a 25)

> Movido tal cual desde `CONTINUAR.md` en la sesión 143 (2026-11-12). **No rige: es registro.** Lo que rige está en
> `CONTINUAR.md`, `REGLAS.md`, `RECETAS.md` y `ESTADO.tsv`.

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

**7. `A12` está CERRADA (sesión 114).** Los 3 hilos de la sesión 6 cerraron con `R9-410`..`R9-417`
(ninguno P0) y lo demás «no alcanzable» o «sin medir», en `detail/A12-superficies-crash.md`. Con eso se
cerró el bloque P0 entero del Modo A.

**Los P1 y P2 `R9-51`..`R9-64` ya están re-verificados** (sesión 22): cada entrada lleva su
nota «⚠️ Sesión 22» con lo que cambió. Leéla antes de arreglar una: varias traían un remedio
o un alcance que no se sostiene.

---
