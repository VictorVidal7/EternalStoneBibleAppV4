# S16 — revisión del diff de la sesión 15 (`R9-77`..`R9-81`)

> **Sesión 16, 2026-09-16.** Revisión adversarial del diff de ARREGLOS de la sesión 15, que
> estaba **sin mergear** en `fix/review-s15-revision-diff-s14`.
> Rama: `fix/review-s16-revision-diff-s15` — **gates verdes en Node 24 Y en Node 22**
> (363 suites, 4263 pruebas), `tsc` limpio, lint con 0 errores, `format:check` verde.

---

## Resumen

**Octava vez seguida que la revisión del diff de arreglos paga.** 5 defectos nuevos
(`R9-82`..`R9-86`), ninguno P0, y **el primero no está en el diff: está en CI, y llevaba un día
entero con `main` en rojo sin que nadie lo mirara.**

Los cinco arreglos de la sesión 15 **se sostienen** y cuatro de sus cinco pruebas discriminan
de verdad, verificado revirtiendo cada uno por separado y diffeando cada revert:

| revert                                        | pruebas rojas | controles |
| --------------------------------------------- | ------------- | --------- |
| `R9-77` (el piso de `assertNoShrink`)         | 7             | verdes    |
| `R9-78` (RVR1960 fuera de `RED_LETTER_PACKS`) | 3             | verdes    |
| `R9-79` (predicado vuelto al de `R9-76`)      | 1             | verdes    |
| `R9-80` (`scanLayout` vuelto al regex)        | **0**         | —         |
| `R9-81` (preflight + bucle de rename)         | 2             | verdes    |

**`R9-80` es la excepción y es el hallazgo `R9-86`:** su arreglo de producción funciona, pero su
prueba nueva no lo protege, porque reimplementa el escáner en vez de llamarlo.

**Los cuatro sha256 siguen coincidiendo.** Bajados en vivo de
`eternalstonebible.github.io/packs/` (HTTP 200 los cuatro) y hasheados contra
`web/packs/web-bootstrap.json`: los cuatro sha256 **y** los cuatro conteos de bytes, idénticos.
Y al cerrar la sesión se corrió el `main()` REAL contra los datos REALES —con un `out` temporal
y una COPIA del manifiesto, para no ensuciar el repo— y los cuatro packs salieron
byte-idénticos a lo publicado. El manifiesto del repo quedó intacto.

---

## La forma que se repite, y una nueva

La 13, la 14 y la 15 encontraron sus defectos en las **compuertas**. La 16 también — cuarta
seguida. Pero esta vez hay una vuelta de tuerca que conviene anotar aparte, porque es la que
explica el defecto más caro:

> **Una compuerta que nunca llegó a EJECUTARSE se ve exactamente igual que una que pasó.** El
> silencio significaba «verificado» en la máquina de Victor y «ni siquiera cargué» en CI, y
> desde dentro del repo no había forma de distinguirlos. Lo único que lo decía era un correo.

Y las tres viejas siguen dando:

- `R9-77` le pone piso a una base que **no fija nada** — y deja abierta la base que **no
  existe**, que fija estrictamente menos y no pedía ninguna palanca (`R9-83`).
- `R9-81` escribe un mensaje que dice qué se movió y qué no — y lo afirma mal cuando no se
  movió nada (`R9-84`), en un camino que **su propia prueba nunca ejecutó** (`R9-85`).
- `R9-80` cambia el regex por un AST — y su único caso positivo prueba una **copia** del AST
  (`R9-86`), sobre **dos de los cuatro** archivos que deciden la respuesta.

---

## Los 5 hallazgos

### `R9-82` (P1) — la compuerta de los packs NUNCA corrió en CI, y `main` llevaba un día en rojo

Los cuatro correos de GitHub que Victor trajo a la sesión son los cuatro runs fallidos de
`main`: `3982ea0`, `ff99435`, `e5c8ce4` y `0aa92a7` (la cabeza). El último verde fue `548e036`,
cuatro horas antes. El log del job lo dice sin ambigüedad:

```
FAIL __tests__/buildWebPacks.test.js
  ● Test suite failed to run
    No such built-in module: node:sqlite
      at Object.require (scripts/build-web-packs.js:58:24)
      at Object.require (__tests__/buildWebPacks.test.js:34:5)

Test Suites: 1 failed, 360 passed, 361 total
Tests:       4188 passed, 4188 total
```

`scripts/build-web-packs.js` requiere `node:sqlite`, que no existe antes de Node 22. Daba igual
mientras el script solo se corriera a mano (Victor tiene Node 24.11.1) — pero **la sesión 13 le
puso una suite de jest delante** (`1d96a40`, el arreglo de `R9-66`) y `ci.yml` fijaba
`node-version: '20'` en los tres jobs, sin `engines` en `package.json` que lo contradijera.

Desde ese día, **la compuerta que vigila lo único de este repo que produce datos publicados no
se ejecutó ni una vez en CI.** Y la rama de la sesión 15 lo empeoraba: `redLetterPackParity.test.ts`
—la compuerta nueva de `R9-78`— también hace `require('../scripts/build-web-packs.js')` en el
cuerpo del módulo, así que moría igual.

**Medido, no supuesto.** La suite entera, tres veces, con binarios de verdad:

| Node            | resultado sobre la rama de la sesión 15     |
| --------------- | ------------------------------------------- |
| 20.20.2 (CI)    | **2 suites no CARGAN**, corren 4195 de 4250 |
| 22.23.2         | verde                                       |
| 24.11.1 (local) | verde                                       |

**55 pruebas no se ejecutaban jamás en CI**: las 49 de `buildWebPacks` (o sea todo `R9-66`,
`R9-72`, `R9-73`, `R9-74`, `R9-77` y `R9-81`) y las 6 de `R9-78`.

**Arreglo, tres cosas.** (1) CI pasa a Node 24 en los tres jobs, con el porqué escrito al lado.
(2) `package.json` declara `engines.node: ">=22"` — verificado corriendo la suite entera en
22.23.2, no supuesto. (3) `node:sqlite` se requiere **perezosamente**, dentro de un
`openDatabase()`, para que las dos suites que importan el archivo sin necesitar base de datos
no vuelvan a morir al cargar. Bajo Node 20, `redLetterPackParity` ahora corre, y `buildWebPacks`
falla con 56 pruebas rojas y un mensaje accionable en vez de cero aserciones.

**Y la compuerta de la compuerta:** `__tests__/ciNodeVersion.test.ts` lee el workflow que CI
corre de verdad y el `engines` contra el que se instala, y no deja que ninguno baje del piso.
Con su propio piso (si el regex deja de encontrar `node-version`, la comparación sería en
vacío) y con el control en la otra dirección (si un día nada requiere `node:sqlite`, lo dice en
vez de sobrevivir a su propia razón). Vista fallar primero: 2 rojas sobre el `ci.yml` con `'20'`.

### `R9-83` (P1) — una base AUSENTE no pedía ninguna palanca

`R9-77` para la corrida cuando el manifiesto publicado no fija ni una de las entradas que la
corrida emite. **Una base que no existe fija estrictamente menos** — y no costaba nada:
`assertNoShrink` salía temprano por `!previous`, imprimía una línea tranquilizadora, y
publicaba.

**Probado de punta a punta contra el `main()` real**, sin manifiesto y con RVR1960 fuera de
`redLetterSpecs` (o sea `R9-13` palabra por palabra):

```
out                       -> ["rvr1960.sqlite","web-red-letter.json","web.sqlite"]
manifiesto reescrito, redLetter -> [{"versionId":"WEB",...}]
lo único dicho            -> "shrink check SKIPPED: no published manifest to compare
                              against (first run for this output)."
```

Emite sin el pack de RVR1960 y **reescribe el manifiesto sin él**, destruyendo la única base que
tenía la corrida siguiente. Es la cascada que el propio comentario de `R9-73` describe como su
razón de existir.

Y el mensaje mentía por su cuenta: `manifestFile` es el `web/packs/web-bootstrap.json`
**versionado**, pase lo que pase con `out`, así que «first run for this output» nunca fue una
descripción correcta. Su ausencia es un archivo borrado o movido. Peor: el error de lectura de
`readPreviousManifest` ofrece _«or move it aside deliberately if this really is a first run»_
como salida — que hasta ahora apagaba `R9-66`, `R9-73` y `R9-77` de una, sin bandera y sin
rastro.

**Arreglo.** Señal de alto, no muro: `--allow-shrink` es la misma salida que ofrece cualquier
otra negativa de este archivo, y el mensaje nombra el manifiesto que no encontró. Efecto lateral
que vale la pena: el mundo de pruebas de `main()` **no tenía baseline**, o sea que su control de
«corrida limpia» era, estrictamente, un control del vacío; ahora el `beforeEach` escribe una base
que coincide con el fixture y los casos que de verdad quieren «sin base» la borran a propósito.
Vista fallar primero: 6 rojas (4 unitarias + 2 de punta a punta), ninguna prueba vieja tocada.

### `R9-84` (P2) — el mensaje decía MIXED sin haber movido nada

El mensaje que `R9-81` escribe cuando un rename falla es una **aserción sobre el mundo**, y en la
mitad de los casos afirmaba lo contrario de lo que pasaba. Forzando el fallo en el PRIMER rename:

```
  moved (THIS run's bytes):        none
  not moved (an EARLIER run's):    rvr1960-red-letter.json, rvr1960.sqlite, web-red-letter.json, web.sqlite

That directory is MIXED and the manifest was not written... Do NOT upload anything from it.
```

No se movió nada: el directorio es una corrida anterior **coherente**, entera, con los sha256 que
el manifiesto todavía fija. Decirle a su dueño que está mezclado y que no publique nada de ahí es
el defecto de `R9-66` visto desde el otro lado — «no pack file was emitted» con 9,5 MB escritos,
aquí al revés. Son dos estados distintos y ahora son dos mensajes.

Alcanzable por la carrera que el propio arreglo admite no cerrar, cuando el bloqueo cae sobre el
primer archivo. (EXDEV no aplica: el `staging` es un `mkdtemp` **dentro** de `out`, así que ese
lado está bien pensado.)

### `R9-85` (P2) — el mock de `renameSync` se llamaba a sí mismo

Salió al escribir la prueba de `R9-84`. La prueba de `R9-81` —la que se llama «names exactly what
moved and what did not»— hacía:

```js
return jest.requireActual('fs').renameSync(from, to);
```

**`jest.requireActual('fs')` devuelve el MISMO objeto de módulo** para un módulo nativo, así que
eso **es** el propio spy. Sondeado: `SAME_MODULE=true SAME_FN=true IS_MOCK=true`. El primer
rename reentraba en el mock, el contador saltaba a 2 y lanzaba — o sea que `moved` estaba
**siempre vacío** y la prueba del caso «a medias» solo ejercitaba el caso «no se movió nada». Su
regex pedía que las dos ETIQUETAS estuvieran presentes, y lo están en los dos casos.

**Arreglo.** Capturar el `renameSync` real **antes** de espiar, y apretar las aserciones para que
nombren los archivos: una movida, tres no. Vista fallar primero revirtiendo solo esa captura.

### `R9-86` (P2) — el control de `R9-80` probaba una COPIA, y el escáner solo abría 2 de 4 layouts

**Primera mitad.** «counts a provider that is only MENTIONED as not mounted» construía su propio
`ts.createSourceFile`, su propio visitante y su propio `Set`. No llamaba a `scanLayout` ni a
`providersMountedIn` ni una vez. Medido: revirtiendo `scanLayout` al regex viejo el archivo
quedaba en **13/13 verde, ese caso incluido** — y el bug seguía alcanzable (saqué
`<AudioPlayerProvider>` de `app/_layout.web.tsx` dejando el nombre en un comentario JSX: seguía
13/13). Lo único que se ponía rojo al restaurar el AST era una prueba **anterior**. O sea: el
arreglo de producción es bueno, su prueba nueva no protegía nada.

El hermano de al lado ya tenía la forma correcta desde `R9-67` — `exportSurface(file, source)` y
un `surfaceOf(path)` finito encima. Ahora `scanSource(file, source)` es el escáner y
`scanLayout(path)` la capa que lee del disco; el control llama al de verdad, y se le suman los dos
casos positivos que faltaban (`<Ctx.Provider>` tiene que caer en `unreadable`, y una mención
dentro de un STRING tampoco cuenta como montada).

**Segunda mitad.** El escáner solo abría `app/_layout.tsx` y `app/_layout.web.tsx`.
`app/(tabs)/_layout.tsx` y su hermano `.web` existen y no se leían nunca, así que «los providers
que esta app monta» era una afirmación sobre la mitad de los archivos que lo deciden. Hoy no hay
ningún provider ahí — pero **«comprobado hoy, nadie hace X» es una nota, no una compuerta**, y
estaba escrito como «dicho y NO hecho» en el detalle de la 15. Ahora los layouts se **buscan**, no
se enumeran, y el conjunto de cada plataforma es la unión de todos. Con un detalle que importa: en
web metro resuelve `_layout.web.tsx` si existe y cae al `_layout.tsx` si no, así que **un layout
anidado sin hermano `.web` es parte del árbol WEB también** — tratarlo como native-only inventaría
un provider que web supuestamente no monta. Sin cambio de comportamiento hoy: los conjuntos salen
idénticos. La diferencia es que ahora están derivados. Vistas fallar primero: 3 rojas donde antes
había 0.

---

## Comprobado y BIEN (no se tocó)

- **Los cuatro sha256, dos veces**: bajados de GitHub Pages (HTTP 200 los cuatro) y comparados
  con el manifiesto; y al final, el `main()` real contra los datos reales reprodujo los cuatro
  packs byte-idénticos, con el manifiesto del repo intacto.
- **`R9-78` lee las listas de verdad.** Simulando `R9-13` al pie de la letra (RVR1960 fuera de
  `RED_LETTER_PACKS`): 3 rojas, entre ellas la comparación de ids. No compara listas que ella
  misma construya.
- **El piso de `R9-77` no bloquea nada legítimo por los caminos que había que sospechar.** Un
  `out` nuevo no afecta (la base es el archivo del repo, pase lo que pase con `out`); añadir una
  versión mientras se retira otra deja la otra fijada, así que el piso no dispara y sí lo hace el
  bucle de desaparición de `R9-73`; un conteo como cadena aborta, que es lo correcto.
- **El `staging` dentro de `out` es deliberado y correcto**: hace que las mudanzas sean renames
  del mismo volumen, así que EXDEV no es alcanzable.
- **El `beforeEach` nuevo de `R9-83` no le cambia el significado a ninguna prueba de abort.**
  Revisadas una por una: las seis que esperan un abort escriben **su propia** baseline
  (inflada, truncada, sin `redLetter`, o la borran a propósito), así que siguen abortando por
  su razón y no por la regla nueva — que con baseline presente es directamente inalcanzable.
  Las dos que cambiaron («corrida limpia» y «no deja scratch») ahora corren contra una base que
  FIJA los conteos, que es más fiel a la corrida real que el vacío de antes.
- **La paridad web/nativo no se rompe** por exportar `RED_LETTER_PACKS` solo desde el web: la
  regla es nativo ⊆ web, y un extra en web no molesta.

## Dicho y NO hecho (decisión de Victor)

- **`--allow-shrink` ya sirve para TRES decisiones**: «el encogimiento es deliberado»
  (`R9-66`/`R9-73`), «es la primera vez que emito esta categoría» (`R9-77`) y ahora «no hay base
  en absoluto» (`R9-83`). La 15 ya lo dejó dicho para las dos primeras; la tercera va por el
  mismo camino a propósito, para no inventar una bandera sin que Victor lo decida. Separarlas
  sigue siendo media hora.
- **`redLetterVersionIds()` existe solo para que una prueba pueda mirar.** No lo llama nadie en
  la app, en ninguno de los dos hermanos. Es defendible (la alternativa es parsear el fuente) y
  está documentado en ambos, pero queda dicho: es superficie pública que solo sostiene una
  compuerta.
- **El «control» de `redLetterPackParity.test.ts:96`** («names a drift instead of just failing»)
  es una tautología: compara `[...native,'KJV']` contra `native`, las dos construidas ahí mismo,
  y pasó tan feliz mientras las listas reales estaban divergidas en la sonda. Es inofensivo y no
  se tocó, pero no es control de nada.
- **Un provider montado por un componente envolvente o dentro de un `.map()`** sigue siendo
  invisible para el escáner **y** no cae en `unreadable` (ahí solo llegan las etiquetas cuyo texto
  termina en `Provider`). Nadie lo hace hoy.
- **Un Ctrl-C a media construcción** se salta el `finally` y deja un `.staging-XXXXXX` dentro de
  `out` para siempre. Sigue igual que en la 15.

---

## ⚠️ Correcciones de la sesión 22 (doble check con Opus 5.5, punto 4)

Las líneas citadas son las de este archivo ANTES de agregar esta sección. Detalle: `S22-doble-check-puntos-3-4.md`.

- `:102-105`, «`buildWebPacks` falla con 56 pruebas rojas y un mensaje accionable en vez de cero aserciones»: es falso desde el origen. Con Node 20 son **cero** aserciones, porque el `beforeAll` de nivel de archivo llama a `buildPack` (`R9-152`). El comentario de `build-web-packs.js:60-69` afirma lo mismo.
