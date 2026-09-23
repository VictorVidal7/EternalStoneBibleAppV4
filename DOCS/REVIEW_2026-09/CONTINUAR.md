# ▶️ Continuar la revisión profunda 2026-09 — prompt para un chat NUEVO

> **Última actualización: 2026-09-23, sesión 22, con el checkpoint de la 21 escrito** (el doble
> check con Opus 5.5, puntos 1 y 2). La 22 está haciendo los puntos 3 y 4 con 5 agentes. Si
> este archivo todavía dice «EN CURSO» y el chat ya no existe, los informes están en
> `_scratch/S22-agente-*.md`. La 20 fue de ARREGLOS (`R9-102`..`R9-105`).
> Actualiza este archivo al cerrar cada sesión (es parte del checkpoint, igual que
> `INDEX.md`).
>
> Este archivo es corto a propósito: su único trabajo es arrancar un chat nuevo sin que
> tenga que re-derivar nada. El **programa** está en
> [`REVIEW_PROMPT.md`](REVIEW_PROMPT.md); el **estado vivo**, en [`INDEX.md`](INDEX.md).

---

## ⛔ LEE ESTO ANTES DE NADA

**0. La sesión 21 no commiteó nada. Su checkpoint lo escribió la 22, en la rama
`docs/review-s21-doble-check`, y NO se mergea sin el OK de Victor.** Si esa rama existe y no
está en `main`, preguntale. `main` = `origin/main` = `ca2cd71`, y su CI está verificado EN EL LOG
dos veces (al cerrar la 21 y al empezar la 22): run `35801884549`, Node v24.20.0, 364/4299, cero
«failed to run».

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
- **Puntos 3 y 4, EN CURSO en la sesión 22, con 5 agentes:** los P1/P2 que nunca se
  re-verificaron (`R9-51`..`R9-64`) y las afirmaciones de los `detail/S*` hasta `S18`.

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

**Quedan 5 P0 abiertos:** `R9-36`, `R9-38`, `R9-39`, y los dos de la sesión 21, `R9-124` y
`R9-125`. Los dos de la sesión 19, `R9-102` y
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
Hallazgos totales: **142**.

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

**La lección de la sesión 21, que es la que conviene llevarse AHORA.** Fue el doble check de los
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

**Los P1 y P2 que nunca se re-verificaron (`R9-51`..`R9-64`) son el punto 3 del doble check, EN
CURSO en la sesión 22.** Hasta que se registre su resultado, si vas a arreglar alguno,
verificalo primero.

---

## Mensaje para pegar en el chat nuevo

**La (b) está a medias:** la sesión 21 hizo los puntos 1 y 2, y la 22 está haciendo el
checkpoint de la 21 y los puntos 3 y 4. **Si la 22 se cortó antes de registrar los puntos 3 y
4, pegá el mensaje (b2)**: los informes de sus agentes están en `_scratch/S22-agente-*.md` y no
hay que relanzarlos desde cero. La (a), revisar el diff de la 20, sigue pendiente: el programa
revisa cada diff de arreglos, y la 19 encontró dos que nadie había revisado.

**(b2) SESIÓN 22, EN CURSO: el checkpoint de la 21 y los puntos 3 y 4 del doble check.** Es el
prompt con que arrancó la 22. Victor pidió después 5 agentes en vez de 2: el punto 3 se partió en
A8+A9 (`S22-agente-3.md`) y A10+A11 (`S22-agente-3b.md`), y el punto 4 en `S8`-`S10`
(`S22-agente-4.md`), `S13`-`S15` (`S22-agente-4b.md`) y `S16`-`S18` (`S22-agente-4c.md`).

> Seguimos con la revisión profunda. Leé primero la memoria de la sesión 21 y
> `DOCS/REVIEW_2026-09/_scratch/S21-verificacion-orquestador.md`, y después `CONTINUAR.md`.
>
> **Estado:** `main` = `origin/main` = `ca2cd71`, con CI verde verificado en el log (run
> `35801884549`). Antes de empezar, comprobá en el log el run de `origin/main`. La sesión 21 hizo
> los puntos 1 y 2 del doble check con Opus 5.5 y no commiteó nada. Salieron 19 hallazgos
> verificados a mano (`R9-124`..`R9-142`: 2 P0, 6 P1, 10 P2 y 1 P3).
>
> **Esta sesión tiene dos partes.** Lanzá primero los agentes de la parte 2 y escribí el
> checkpoint mientras corren.
>
> 1. **El checkpoint de la 21, en una rama nueva** (`docs/review-s21-doble-check`): registrá
>    `R9-124`..`R9-142` en `BUGS.md`, escribí `detail/S21-doble-check.md` y poné al día `INDEX.md`
>    y `CONTINUAR.md`. Los P0 abiertos pasan de 3 a 5. Gates en verde (`npm run validate`), y no
>    mergees nada sin preguntarme.
> 2. **Los puntos 3 y 4 del doble check, con agentes**, forks en worktree aislado, con informe
>    incremental en `_scratch/S22-agente-*.md`, y cada uno con la lista de ya reportados
>    (`_scratch/S21-ya-reportados.txt`).
>    - **Punto 3:** los P1/P2 que nunca se re-verificaron (`R9-51`..`R9-64`). ¿Siguen siendo
>      ciertos en `HEAD`? ¿Tienen la severidad correcta?
>    - **Punto 4:** las afirmaciones «comprobado y BIEN» de los `detail/S*` hasta `S18`, contra el
>      mundo y no contra el texto.
>      Verificá vos todo lo que suba a P0 o P1. Lo nuevo va desde `R9-143`. Decime qué encontraste
>      antes de tocar nada.
>
> **Pendiente, NO para esta sesión salvo que te lo pida:** la opción (a), el diff de la 20;
> arreglar `R9-124` (antes, medir el SDK nativo en Modo C, en el emulador, con mi OK y nunca con
> mi teléfono) y `R9-125` + `R9-130` (mirar el dueño previo ANTES de bifurcar, con una prueba por
> las tres ramas); y los P0 viejos `R9-36`, `R9-38`, `R9-39`, y terminar `A12`.

**(a) DESPUÉS de la (b): revisar el diff de la sesión 20.**

> Seguimos con la revisión profunda. Lee `DOCS/REVIEW_2026-09/CONTINUAR.md` primero.
>
> **Estado:** `main` = `origin/main`, sin ramas pendientes. La sesión 20 (con Opus 5.5) arregló
> `R9-102`..`R9-105`, un commit por hallazgo (`8ea93b6`, `7aafc9c`, `cfa7c1c`, `00f69c4`), ya
> mergeados y pusheados, con CI verde verificado en el log. Además midió `R9-104` en el SDK
> NATIVO (Modo C, emulador): la escritura de la cuenta anterior queda pendiente para siempre, así
> que se queda en P1. Antes de empezar, comprobá en el log el run de CI de `origin/main`. El
> detalle está en `detail/S20-arreglos-p0-sync-favoritos.md`. Quedan 5 P0 abiertos: `R9-36`,
> `R9-38`, `R9-39`, y `R9-124` y `R9-125`, que son del doble check de la 21.
>
> **Esta sesión es de REVISIÓN del diff de la 20** (`25128b3..origin/main`). Decime qué
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
> **Pendiente fijo, NO para esta sesión salvo que te lo pida:** todo lo que el ledger revisó hasta
> la sesión 18 se hizo con Opus 5, y quiero un **doble check con Opus 5.5**. Está en
> `CONTINUAR.md`, punto 3, y es la opción (b): la 21 hizo los puntos 1 y 2, la 22 se ocupa de
> los puntos 3 y 4, y lo que falte está dicho ahí.

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

**(b) El doble check con Opus 5.5, el pedido fijo de Victor: puntos 1 y 2 HECHOS en la sesión
21, y 3 y 4 en la (b2) de arriba.** Queda aquí como registro del alcance.

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

**(c) Lo que ya estaba en cola antes de la 19**, sin cambios: terminar `A12` (3 hilos abiertos en
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

**Medido al empezar la sesión 22 (2026-09-23).**

- **`main` = `origin/main` = `ca2cd71`** (solo docs después de `00f69c4`, el último código de la
  20). **CI de `ca2cd71` verificado en el log:** run `35801884549`, Node v24.20.0, 364/4299,
  cero «failed to run».
- **Una rama de la revisión sin mergear, a propósito:** `docs/review-s21-doble-check`, con el
  checkpoint de la 21 (solo docs). Se mergea con el OK de Victor.
- El worktree viejo `.claude/worktrees/agent-ac8c78369a99d9c31` de la 21 ya se borró, junto con
  su rama. Estaba limpio, y su `_scratch` era un prefijo del del árbol principal.

Las demás ramas locales, en total 11 contando `main`:

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
| 21     | Doble check, puntos 1 y 2: `R9-124`..`R9-142` (Opus 5.5)      | checkpoint en la 22 |

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
- **`react-test-renderer` no aguanta re-renderizar una pantalla del tamaño de la Mesa.**
  Tira «Unable to locate attached view in the native tree» (el `Animated` interno de cada
  `TouchableOpacity`) y DESMONTA el árbol. Cualquier hallazgo que necesite un cambio de
  pasaje en vivo es verificación en dispositivo, Modo C — no lo pelees en jest.
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
- **La suite es CIEGA al horario de verano.** Ninguna prueba fija `TZ`; el CI y la máquina de
  Victor están en `America/Mexico_City`, **que abolió el DST en 2022**.
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
- **Cuando avise del límite de uso de 5 h, la prioridad es volcar a disco y commitear, no
  terminar de verificar.** Es lo que se decidió en la sesión 6 y por eso existe la deuda de
  re-verificación del `⛔` de arriba: fue un intercambio consciente, no un olvido.

## 8. Decisiones abiertas para Victor (no son bugs)

- **`R9-59`:** ¿«device-local» debe significar también «visible para cualquiera que use el
  aparato»? Hoy, cerrar sesión **no** limpia la Mesa, ni el progreso, ni los logros, y está
  **documentado como decisión** (`deleteAccountData.ts:12-13`) — pero nadie se lo preguntó
  a Victor con el caso del teléfono compartido de la iglesia delante.
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
