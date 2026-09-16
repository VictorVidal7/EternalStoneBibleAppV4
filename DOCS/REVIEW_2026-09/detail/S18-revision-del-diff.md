# Sesión 18 — revisar el diff de la sesión 17 (`R9-87`..`R9-96`)

> **2026-09-16.** Décima sesión seguida de revisión adversarial sobre un diff de
> arreglos, y la décima que paga. Rango revisado: `31132d2..0da86ce` (6 commits;
> los de código son `15bdd38`, `bd4d520` y `5359a77`). Arreglos en
> `fix/review-s18-revision-diff-s17`.
> **5 hallazgos nuevos: `R9-97`..`R9-101`. 3 P1, 2 P2. Ninguno P0.**

---

## Resumen

**Los diez arreglos de la sesión 17 se sostienen en su mecanismo.** Lo que falla,
otra vez, son las COMPUERTAS — **sexta sesión seguida** — y las **tres compuertas
nuevas enteras** que la 17 escribió dejaron cada una abierto el vecino que la
motivó:

| arreglo de la 17                                      | el vecino que dejó abierto                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `R9-93` cambia «afirma coherencia» por «la comprueba» | `R9-97`: la comprueba en **una sola dirección**, así que un directorio VACÍO es coherente  |
| `R9-93` lee el manifiesto en el camino de error       | `R9-98`: lo lee **en crudo**, y la forma legacy lanza DENTRO del `catch` (o sea `R9-95`)   |
| `R9-89` correlaciona cada job con su pin              | `R9-99`: decide qué es un job por su **FORMA**, y tres formas de YAML ordinarias no lo son |
| `R9-89` recorre todo `.github/workflows/`             | `R9-100`: y el piso sigue siendo un **conteo global**, así que un archivo cegado no se ve  |
| `R9-91` convierte la nota en detector                 | `R9-101`: el detector **no cruza de línea**, o sea no ve la frase canónica que lo motivó   |

**La cadena de datos publicados se verificó entera y contra el mundo, dos veces**
(antes y después de tocar el script): fuentes `.ts` → `main()` REAL en directorio
temporal → los 4 packs **byte a byte** → `web/packs/web-bootstrap.json` versionado
→ los 4 sha256 y los `content-length` de lo que **sirve** hoy
`eternalstonebible.github.io/packs/`. Idénticos las dos veces.

**Suite completa: 363 suites / 4289 pruebas** (eran 4278; +11 de esta sesión).

---

## La forma que se repite, y las dos nuevas

Sigue vigente entera la de la sesión 15 (**una compuerta escrita para cerrar un
caso deja abierto el vecino que la motivó**), y esta sesión la ve en las tres
compuertas nuevas a la vez. Y dos que valen por sí solas:

> **Una comprobación que reemplaza una afirmación tiene que comprobar la
> afirmación ENTERA, no la mitad que se ve.** `R9-93` sustituyó «_it IS coherent -
> one run, whole_» por una verificación de sha256 — y verificó sólo los archivos
> que ESTÁN. La palabra «whole» es la otra mitad, y nadie la comprobó, así que el
> mensaje siguió diciendo exactamente lo mismo sobre un directorio vacío. Es
> `R9-73` (un bucle sobre la lista NUEVA no ve lo que falta de la VIEJA) con la
> consecuencia de `R9-74` (el vacío imprime éxito), dentro de la compuerta escrita
> contra eso.

> **Decidir por la FORMA de una línea es decidir por un estilo.** `R9-99`: el
> escáner pedía que la cabecera de un job acabara en el dos puntos. Un comentario
> al final, un id entrecomillado o un ancla no lo cumplen — y no FALLABAN, se
> archivaban bajo el job anterior. Lo que dice que algo es un job no es su forma,
> es su **columna**. Generaliza: si un escáner escrito a mano rechaza una forma,
> preguntá si la rechaza **ruidosamente** o si la absorbe el vecino de arriba.

Y un corolario de método:

> **Una compuerta nueva que no casa con nada hoy no tiene discriminador.** El
> detector de `R9-91` nació el mismo día en que se corrigieron las cinco frases que
> vigilaba, así que su bucle recorría ~360 archivos sin llegar ni una vez a la
> comparación. Verde. Un regex roto del todo se veía idéntico. **Contá cuántas
> veces llega tu compuerta a comparar algo, y ponle piso a ese número.**

---

## Los 5 hallazgos

### `R9-97` (P1) — «coherent - one run, whole» sobre un directorio VACÍO

`scripts/build-web-packs.js`, `filesNotPinnedBy`. Recorre los archivos que HAY en
`out` y le pregunta al manifiesto por cada uno. Nada recorre el manifiesto
preguntándole al directorio, así que **un archivo que el manifiesto pina y el
directorio no tiene es invisible** — y el `[]` que sale de ese bucle se imprime
como:

```
Checked, not assumed: every file in it matches the sha256 the manifest pins,
so it IS coherent - one run, whole.
```

**Medido a través del `main()` REAL:** con **2 de 4** archivos borrados dice eso;
con los **4** borrados dice exactamente lo mismo de un directorio **vacío**.

**La mitad peligrosa es la primera**, no la vacía: «whole» manda a su dueño a
subir medio juego, y entonces `data-loader.web.ts` pide un pack que no está — un
404 de GitHub Pages se sirve **sin cabecera CORS**, así que al lector le llega
`TypeError: Failed to fetch`, no un 404 legible.

**Alcanzable justo donde el mensaje vive:** el primer rename perdiendo la carrera
que `R9-81` admite no cerrar, sobre un directorio recién creado; o después de que
el operador limpie el directorio mezclado **como le dijo el mensaje `FAILED
HALFWAY`**. Y la rama `unpinned.length === 0` no la ejercitaba ninguna prueba: la
de `R9-93` sólo asserta `not.toMatch(/IS coherent/)`.

**Arreglado:** el bucle va en las dos direcciones, y la que falta se nombra
(`X (the manifest pins it, but it is NOT there)`).

### `R9-98` (P1) — la forma LEGACY del manifiesto lanza DENTRO del `catch`, y borra el mensaje entero

Misma función. Lee `previous.packs` y `previous.redLetter` **en crudo**. Pero
`readPreviousManifest` acepta **a propósito** un `redLetter` que sea un OBJETO —la
forma que `web/packs/web-bootstrap.json` tuvo hasta el 2026-09-15, y que `R9-77`
documenta como reproducible con un `git checkout` de una revisión anterior, un
revert o un merge que tome el lado viejo— y este mismo archivo ya tiene
`previousRedLetterOf` para normalizarla.

Esparcir un objeto plano lanza. Y esto corre **dentro del `catch` del rename**, así
que el throw reemplaza el mensaje `FIRST FILE` completo por:

```
TypeError: (previous.redLetter ?? []) is not iterable
```

Es **el defecto que `R9-95` acababa de quitarle a `main()` doscientas líneas más
arriba**, reintroducido por el mismo commit, en el camino de error del mensaje que
`R9-93` acababa de reescribir. Medido a través del `main()` REAL.

**Arreglado:** las dos listas se leen por `previousPacksOf` / `previousRedLetterOf`.
La prueba comprueba además que **sí comprobó**: el objeto legacy sólo describe el
pack red-letter de WEB, así que el mensaje nombra `rvr1960-red-letter.json`.

### `R9-99` (P1) — el escáner decidía qué es un job por su FORMA, y tres formas de YAML no lo eran

`__tests__/ciNodeVersion.test.ts`. La cabecera de job era
`/^([A-Za-z_][\w-]*):\s*$/` — **acabar en el dos puntos**, que es un estilo. No lo
cumplen: un comentario al final (`build: # only lint`), un id entrecomillado
(`"build":`), un ancla (`build: &common`). Y **ninguna fallaba**: `job` se quedaba
en el job ANTERIOR, así que cada step de debajo se archivaba bajo un job que **sí**
tiene pin.

**Medido sobre el `ci.yml` REAL:**

```text
  smoke: # added in a hurry
    steps:
      - run: npm ci --legacy-peer-deps && npm test
```

Un cuarto job **sin ningún paso de `setup-node`** → **15/15 verde**. Quitando sólo
el comentario → rojo, `"ci.yml smoke"` en `unpinned`. Es el hallazgo de `R9-89`
reabierto por su propio arreglo, con la misma consecuencia: `buildWebPacks` y
`redLetterPackParity` sin cargar en CI.

**Arreglado:** manda la **COLUMNA**. El primer key bajo `jobs:` fija el nivel de
los ids; una línea en ese nivel cuyo nombre no se puede leer se **REPORTA** y
además limpia `job`, para que nada de debajo se le atribuya a otro dueño.

### `R9-100` (P2) — `jobs: # comentario` ciega un archivo entero, y el piso era un conteo global

Mismo archivo. `/^jobs:\s*$/` rechazaba un comentario al final de la clave,
`inJobs` no se encendía nunca, y el archivo volvía **entero vacío** — un silencio
idéntico al de un parseo limpio. El único piso era
`scans.flatMap(s => s.scan.jobsRunningNode).length >= 1`, un conteo **sobre todos
los archivos**, así que `ci.yml` lo satisfacía **en nombre del archivo cegado**. El
número de hoy haciendo de cobertura, una vez más.

**Medido con un segundo workflow de verdad** (`.github/workflows/deploy.yml`): un
job `publish` corriendo `npm ci && npm run build:web` en `node-version: '20'`
—`R9-82` verbatim— pasaba **15/15**. Quitando sólo el comentario → rojo por «below
the floor».

**Arreglado, dos cosas:** el comentario se quita en **toda** línea
(`stripTrailingComment`), y el piso pasa a ser **por archivo**
(`scan.jobs.length > 0`), porque todo workflow de GitHub declara al menos un job y
un archivo del que no salió ninguno es un archivo que no se supo leer. Verificado
con un `deploy.yml` que el escáner no entiende en absoluto: ahora lo nombra.

### `R9-101` (P2) — el detector de `R9-91` no cruza de línea, y no casaba con NADA

Mismo archivo. El regex lleva `[^.\n]{0,40}?` entre «pins» y la versión, o sea que
**no cruza de línea**. La frase que se pudrió cruzaba:

```
 * `node:sqlite`), but this repo's CI (.github/workflows/ci.yml) pins
 * `node-version: 20`, and `node:sqlite` requires Node >= 22.5 — it would
```

Es la de `databaseMigrations.test.ts`: **la canónica, la que las otras cuatro citan
como su razón**. Medido devolviéndola **verbatim** al archivo real: la compuerta
seguía **VERDE**. Prettier envuelve estos bloques a 80 columnas, así que una frase
que sobrevive al wrap es la frase **ordinaria**, no la exótica.

**Y no tenía discriminador ninguno.** Como las cinco frases se reescribieron en el
mismo commit, el regex **no casaba con nada en todo el repo** (los dos únicos
matches están en su propio archivo, que se excluye): su bucle recorría ~360
archivos sin llegar ni una vez a la comparación. Un regex roto del todo se veía
idéntico.

**Arreglado:** el matcher pasa a ser una función sobre TEXTO (`nodePinClaims`, la
forma de `R9-86`) con **cuatro sondas que la llaman a ella y no a una copia**
—incluido el control en pasado, sin el cual un detector que casara con todo
pasaría—, aplana las continuaciones de bloque antes de casar, y el bucle del repo
lleva piso (`checked >= 1`). Además las tres frases corregidas vuelven a ser
afirmaciones **vivas** («it pins Node 24 now» en vez de «it pins 24 now»), así que
se comprueban contra el workflow real: el detector pasa de **0** comparaciones a
**3**, y se pondrán rojas el día que CI se mueva de 24.

---

## Comprobado y BIEN (no se tocó)

- **La cadena de datos publicados, entera y dos veces.** Los cuatro sha256 y los
  cuatro `content-length` de `eternalstonebible.github.io/packs/` idénticos al
  manifiesto versionado, y el `main()` real contra los datos reales reproduciendo
  los cuatro packs byte a byte antes **y** después de tocar el script.
- **`R9-92` verificado en las TRES direcciones**, con una sonda
  `app/_zzprobe/_layout.native.tsx` que monta un `<ProbeOnlyProvider>`:
  pre-arreglo **15/15 verde** (ciego); post-arreglo **rojo** nombrando el provider;
  la misma sonda renombrada a `.ios` **rojo** por «forma que no sabe leer».
- **El modelo de metro de `R9-92` es correcto.** `.web` gana sobre base en web,
  `.native` gana sobre base en todo lo demás, y web **nunca** cae a `.native`. Los
  cuatro casos de directorio (`base` solo, `base`+`.web`, `.web` huérfano,
  `.native`+`.web` sin base) dan la respuesta correcta o fallan ruidosamente.
- **`R9-87` discrimina de verdad:** con `fs.writeFileSync(manifestFile, …)`
  desactivado del todo, **5 pruebas se ponen rojas** (antes salía verde el repo
  entero).
- **El piso `compared === 4` ES el número de hoy y ADEMÁS lo responde el fixture**
  (la baseline de `writeMatchingBaseline` también tiene 4 entradas) — pero no es
  defecto, porque el discriminador real es `problems === []`, y ese sí mira el
  mundo: la baseline no lleva `file`, ni `bytes`, ni `sha256`.
- **`whyInsufficient` es correcto en los seis casos medidos:** `'22.12.0'` →
  «below the floor», `'22'` y `'20'` → «bare major», `'22.13'` / `'24'` / `'23.4.0'`
  → null, `'lts/iron'` y `'lts/*'` → «not a numeric version».
- **Las formas raras de pin se reportan o fallan ruidosamente**, medidas contra la
  función real: matriz `${{ }}` → `unreadable`; `node-version-file` ausente →
  `unreadable`; `with: {node-version: '20'}` en flujo → el pin se pierde **pero el
  job queda sin pin y la compuerta lo caza**; `node-version: [20, 24]` de una
  matriz → pin no numérico, rojo; indentación de 4 espacios → bien.
- **El cambio de `npm outdated` es correcto** y el job de seguridad sigue
  significando lo mismo.

---

## Dicho y NO hecho (decisión de Victor)

- **`R9-95` con algo que no sea un `Error`.** El script no está en modo estricto,
  así que `failure.message += note` sobre un string tirado es un **no-op
  silencioso**, y un `throw undefined` / `null` / `0` / `''` ahora se **traga**
  (`if (failure) throw failure`) donde el `finally` viejo lo propagaba. **Hoy es
  inalcanzable**: todo lo que lanza este archivo es `new Error`, igual que `fs` y
  `node:sqlite`. Cerrarlo pide `'use strict'` o un normalizador, y las dos cosas
  son más grandes que el riesgo alcanzable. Queda dicho.
- **Un job que corre node sólo dentro de una acción compuesta local**
  (`uses: ./.github/actions/x`) no exige pin, y **el ORDEN de los steps no se
  modela**: un `setup-node` colocado DESPUÉS de los `run:` cuenta como pin válido.
  Los dos medidos contra la función real. Modelar el orden es barato; modelar las
  acciones compuestas no.
- **El detector de `R9-101` sigue entendiendo sólo la forma presente que este repo
  usó**, y sólo mira `__tests__/` (ahora recursivo) — no `src/`, ni `scripts/`, ni
  `DOCS/`. Queda escrito en su propio comentario.
- **Siguen abiertos los tres de la sesión 17:** npm 10 → npm 11 materializa
  **1851 → 1827** paquetes desde el MISMO lockfile; el aviso nuevo `allowScripts`
  (3 paquetes, `re2` compila nativo); y la deprecación de `actions/checkout@v4` /
  `actions/setup-node@v4`, que el día que GitHub retire el runtime node20 deja los
  tres jobs sin arrancar.
- **`--allow-shrink` sigue apagando CUATRO decisiones distintas.** Separarlas sigue
  siendo media hora y sigue sin decidirse.
