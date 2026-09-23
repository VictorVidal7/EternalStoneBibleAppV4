# Sesión 17 — revisar el diff de la sesión 16 (`R9-82`..`R9-86`)

> **2026-09-16.** Novena sesión seguida de revisión adversarial sobre un diff de
> arreglos, y la novena que paga. Rango revisado: `cca7091..531ffef` (5 commits,
> 7 archivos). Arreglos en `fix/review-s17-revision-diff-s16`.
> **10 hallazgos nuevos: `R9-87`..`R9-96`. 3 P1, 7 P2. Ninguno P0.**

---

## Resumen

**Los cinco arreglos de la sesión 16 se sostienen.** `R9-85` y `R9-86` se vieron
discriminar por revert con el `diff` del revert a la vista; `R9-82` se verificó
**en el log del run**, no en el check.

**Y lo que falla otra vez son las COMPUERTAS — quinta sesión seguida.** Cuatro de
los cinco arreglos dejaron abierto **justo el vecino que los motivó**:

| arreglo de la 16                            | el vecino que dejó abierto                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `R9-82` escribe un detector del pin de Node | `R9-89`: ve UNA forma de escribirlo, y su piso es el número de jobs de hoy              |
| `R9-82` declara `engines: ">=22"`           | `R9-88`: el piso real es **22.13.0**, y la compuerta **prohíbe** corregirlo             |
| `R9-83` pone piso a la base ausente         | `R9-87`: el fixture que lo hizo posible **respondió la pregunta** que otra prueba hacía |
| `R9-84` arregla «dice MIXED sin mover nada» | `R9-93`: el reemplazo **dice COHERENTE** sobre un directorio que puede estar mezclado   |
| `R9-86` hace derivado el escáner de layouts | `R9-92`: derivado **de dos nombres literales**                                          |

**La cadena de datos publicados se verificó entera y contra el mundo**, en los
cuatro eslabones: fuentes `.ts` → `main()` REAL en directorio temporal → los 4
packs **byte a byte** → `web/packs/web-bootstrap.json` versionado → el manifiesto
que **sirve** GitHub Pages (`diff` → `IDENTICAL`) → los 4 sha256 de los bytes
servidos. Y los conteos que el manifiesto _afirma_, comprobados **abriendo los
bytes descargados**: 31 102 / 31 098 versículos, 66 libros cada uno, 2 059 / 2 057
entradas, 2 077 / 2 077 spans. Repetido **después** de tocar el script.

---

## La forma que se repite, y las dos nuevas

Sigue vigente entera la de la sesión 15 (**una compuerta escrita para cerrar un
caso deja abierto el vecino que la motivó**) y la de la 16 (**una compuerta que
nunca llegó a EJECUTARSE se ve igual que una que pasó**). `R9-92` es la segunda a
nivel de **fila de bucle**: la comprobación correcta existía —«todo directorio de
layout necesita un layout que el nativo renderice»— y sencillamente **nunca se
ejecutaba** para el directorio que importaba, porque el walker no lo metía en el
mapa.

Y dos que valen por sí solas:

> **El piso de una compuerta suele ser exactamente el número de HOY, así que acaba
> exigiendo ese número en vez de exigir cobertura.** `pinned.length >= 3` con tres
> jobs no dice «todos los jobs están cubiertos», dice «hay tres pines». Un cuarto
> job corriendo `npm test` en Node 20 pasaba. El antídoto es correlacionar: no
> cuentes, **emparejá cada job con su pin**.

> **Un fixture añadido para habilitar una prueba nueva puede RESPONDER la pregunta
> que otra prueba estaba haciendo.** Es la forma de la sesión 10 (un arreglo
> desarma la prueba de otro) por la puerta del fixture, y es más traicionera
> porque el fixture parece inerte. `writeMatchingBaseline` escribe dos packs; la
> aserción decía `packs.toHaveLength(2)`. La pregunta y la respuesta llegaron por
> el mismo canal.

Y una gotcha de método que costó un rato: **`--package-lock-only` NO hace que
`npm outdated` funcione sin `node_modules`** — sigue imprimiendo `MISSING` las 57
filas. El primer arreglo de `R9-94` fue falso y lo cazó medirlo antes de creerlo.

---

## Los 10 hallazgos

### `R9-87` (P1) — el `beforeEach` de `R9-83` desarmó la única aserción que fijaba que `main()` ESCRIBE el manifiesto

`__tests__/buildWebPacks.test.js`. El control de corrida limpia fijaba la
escritura del manifiesto con
`expect(readPreviousManifest(world.manifestFile).packs).toHaveLength(2)`, y eso
**discriminaba solo porque el archivo no existía** y la llamada reventaba. El
`beforeEach` que `R9-83` añadió escribe una baseline con **exactamente dos
packs**, así que el fixture satisface la aserción.

**Medido, y peor de lo que parecía:** con `fs.writeFileSync(manifestFile, …)`
desactivado del todo, **el repo ENTERO sale verde — 363 suites / 4263 pruebas**.
Nada lo nota.

**Por qué importa río abajo:** `src/lib/database/data-loader.web.ts:178` usa
`manifestEntry.sha256` como **única** señal de «hay pack nuevo». Un manifiesto que
deja de reescribirse deja a **todo lector web ya arrancado en el pack viejo para
siempre**, en silencio. Es la clase `R9-13` por el lado del transporte.

**Arreglado:** `manifestAgainstDisk(out, manifestFile)` pregunta al **mundo** —
cada entrada tiene que nombrar un archivo que esté de verdad en `out`, con los
`bytes` y el `sha256` que esos bytes tienen — con su piso (`compared === 4`,
porque un manifiesto sin entradas haría el bucle pasar en vacío). El fixture no
lleva `file`, ni `bytes`, ni `sha256`, así que **no puede satisfacerlo por
accidente**. Puesto además en el control de `--allow-shrink` sin base, que es el
único sitio del archivo donde el manifiesto está garantizadamente **ausente** de
antemano, o sea el único que puede probar que `main()` lo **crea**.

**La sesión 16 lo daba por revisado** («las dos que cambiaron … ahora corren
contra una base que FIJA los conteos», en su «Comprobado y BIEN»). Es cierto y es
mejor — **y además es estrictamente más débil en esa aserción**, que es justo lo
que esa revisión no midió.

### `R9-88` (P1) — `engines.node: ">=22"` es falso, y la compuerta PROHIBÍA corregirlo

`package.json`, `__tests__/ciNodeVersion.test.ts`. `node:sqlite` llegó en **22.5**
detrás de `--experimental-sqlite` y se **desbanderó en 22.13.0**
(nodejs/node#55890). **Medido con binarios reales, uno por minor:**

```
22.5.1 … 22.12.0  ->  ERR_UNKNOWN_BUILTIN_MODULE
22.13.0 y arriba  ->  OK
22.12.0 --experimental-sqlite -> OK   (o sea: es la bandera, no la ausencia)
```

De 22.0.0 a 22.12.x el módulo **existe pero no se puede usar**, y en 22.12.0 la
suite del área da **56 fallos**. Como `>=22` se cumple ahí, quien instale en ese
rango **ni siquiera recibe el aviso `EBADENGINE`** que el comentario de la propia
compuerta prometía. Y en CI, `parseInt` compara majors, así que
`node-version: '22.12.0'` pasaba.

**Y la compuerta bloqueaba su propia corrección:** `expect(pkg.engines?.node)
.toBe('>=22')` comprueba _que la cadena sea esa cadena_, no _que el piso
alcance_. `">=22.13.0"` → FAIL. `">=24"` → FAIL.

**Arreglado:** `MINIMUM_NODE = '22.13.0'`, comparación de versiones enteras, y la
prueba de `engines` exige **que el piso declarado alcance**, no que sea una cadena
concreta. Un major pelado igual al major del piso (`'22'`) se **rechaza a
propósito**: `setup-node` lo resuelve al último 22.x, que hoy cumple, pero la
cadena no lo dice — y este archivo existe porque «hoy da la casualidad de que
está bien» es una nota, no una compuerta.

### `R9-89` (P1) — la compuerta del pin veía UNA forma de escribirlo, y su piso exigía tres

`__tests__/ciNodeVersion.test.ts`. El regex era
`/node-version:\s*'([^']+)'/g` y la comparación `parseInt(v,10) < 22`. Solo veía
comillas **simples**, y `parseInt` da `NaN` para todo lo no numérico —
`NaN < 22` es `false`, o sea **pasa**.

| caso medido                                                                  | Node real | compuerta vieja |
| ---------------------------------------------------------------------------- | --------- | --------------- |
| `node-version: 'lts/iron'` ×3                                                | **20**    | 4 passed ✅     |
| `node-version: '${{ matrix.node }}'`, matriz `[20]`                          | **20**    | 4 passed ✅     |
| 3 jobs en `'24'` + un **4.º** con `node-version: 20` sin comillas            | 20 ahí    | 4 passed ✅     |
| `node-version: '22.12.0'` ×3                                                 | 22.12     | 4 passed ✅     |
| **controles** (`'20'` con comillas; los 3 sin comillas; `node-version-file`) | 20        | 1 failed ✅     |

El piso `pinned.length >= 3` era **exactamente** el número de jobs de hoy: exige
_que haya tres pines_, no _que todos los jobs estén cubiertos_. Solo salva el caso
«TODOS invisibles»; en cuanto la forma invisible es **mixta** o **visible pero no
numérica**, no hay nada. Y `readWorkflow()` leía **un nombre de archivo fijo**: un
`deploy.yml` con `node-version: '20'` corriendo `build-web-packs.js` pasaba.

**Arreglado:** escáner de la **estructura** del workflow —`scanWorkflowSource(name,
source)`, con probes que llaman a **esa misma función** y no a una copia (la
lección de `R9-86` aplicada al nacer)—, sobre **todo** `.github/workflows/`,
**correlacionando** cada job que corre node/npm con el pin que ese job declara, y
comparando versiones enteras. Una forma que no sabe leer (`${{ }}`, un
`node-version-file` que no está en el repo, un valor vacío) se **REPORTA**, nunca
se salta: disciplina de `R9-67`. Los cuatro casos de arriba ahora fallan.

### `R9-90` (P2) — «still has a reason to require it» casaba TEXTO, y miraba 1 de 9 archivos

`expect(script).toContain("require('node:sqlite')")` sobre
`build-web-packs.js`. Medido en las dos direcciones: migrando a
`better-sqlite3` y dejando un comentario ordinario que mencionara
`require('node:sqlite')`, la compuerta seguía **verde** afirmando que el archivo
lo requiere; y quitando también la mención, decía que el piso estaba **rancio** —
cuando siguen requiriéndolo en el cuerpo del módulo **8 scripts más**, entre ellos
`rebuild-seed.js`, que construye el seed nativo. **Arreglado:** se deriva sobre
`scripts/` con los comentarios quitados, y se exige `>= 2`.

### `R9-91` (P2) — cinco suites seguían AFIRMANDO que CI fija Node 20

`databaseMigrations`, `sanitizeFtsQuery`, `insertVersesBatchedSql`,
`hebrewGlossEs`, `quizVerseLookup`. No son notas de color: son la **justificación
documentada** de por qué esas suites simulan SQL a mano en vez de abrir
`node:sqlite`. Esa razón caducó con `R9-82` y nadie lo notó, **porque un
comentario no es una compuerta: es una nota, y una nota no se pone roja**.

**Arreglado:** las cinco frases pasan a pasado y nombran el piso real — **y se
añade el detector**, que deriva los pines reales del workflow y falla si alguna
suite afirma en presente un pin que no existe. Visto fallar devolviendo una de
las cinco a presente. Solo entiende la forma que este repo usó de verdad; queda
dicho en el propio comentario, y por eso las frases se reescribieron en pasado en
vez de renumerarse. El archivo del detector se excluye de su propia regla porque
tiene que **citar** la frase mala para documentarla.

### `R9-92` (P2) — el escáner de layouts no veía `_layout.native.tsx`, y no lo decía

`__tests__/missingProviderError.test.ts`. `R9-86` hizo que los layouts se
**buscaran** en vez de enumerarse —correcto— y después casaba los dos nombres
**literalmente**, así que un directorio con solo `_layout.native.tsx` no llegaba
al mapa: ni como entrada, ni como error. **Medido:** una sonda con un
`<ProbeOnlyProvider>` en un layout `.native` dejaba el archivo en **15/15 verde**
mientras el árbol nativo lo montaba de verdad → el provider queda fuera de
`native`, por tanto fuera de `unmountedOnWeb`, por tanto fuera de todo lo que
exige declararlo: es el crash de `R9-14`/`R9-75`/`R9-80` por una puerta lateral.

**La asimetría es el hallazgo:** el caso vecino **sí** fallaba ruidosamente
(`.native` + `.web` sin `_layout.tsx` plano dispara la aserción de «todo
directorio necesita un layout que el nativo renderice»). La comprobación estaba
**bien** y nunca se **ejecutaba** para esa fila.

**Arreglado:** el walker parsea el sufijo de plataforma (`base`, `web`, `native`
modelados; cualquier otro —`.ios`, `.android`— **reportado**, porque no se puede
plegar en una sola respuesta «native»). Verificado en las dos direcciones.

### `R9-93` (P2) — el mensaje FIRST FILE decía COHERENTE sobre un directorio que puede estar mezclado

`scripts/build-web-packs.js`. `R9-84` cerró «dice MIXED sin haber movido nada»; su
reemplazo dice _«It is coherent - one run, whole - and its sha256 are still the
ones the manifest pins»_, y eso es **falso** en cuanto una corrida anterior falló
a medias. **Medido**, tres corridas encadenadas: tras un `FAILED HALFWAY`, 1 de 4
archivos con sha256 que la base **no** pina, y la corrida siguiente afirmando que
el directorio es coherente y publicable — **contradiciendo palabra por palabra** el
aviso correcto del paso anterior. **Arreglado:** se comprueba (el manifiesto ya
está en mano; cuesta cuatro hashes), y `null` («no pude comprobar») y `[]`
(«comprobado, todo cuadra») son respuestas **distintas** a propósito: colapsarlas
es exactamente cómo un mensaje acaba afirmando una coherencia que nunca estableció.

### `R9-94` (P2) — `npm outdated` corría sin instalar: las 57 filas salían `MISSING`

`.github/workflows/ci.yml`. El job de seguridad es el único sin paso de
instalación. `npm audit` lee el lockfile y no lo necesita; **`npm outdated` sí**,
porque su salida entera es la versión **instalada**. Resultado real del run
**verde** `35130290791`: las **57** dependencias directas en `MISSING`, y
`##[error]Process completed with exit code 1` tragado por `continue-on-error`.
Había corrido así en todos los runs verdes desde que se escribió el job.

**El primer arreglo fue falso y lo cazó medirlo:** `--package-lock-only` **no**
sustituye — medido sobre un `package.json` + lockfile pelados, sigue dando
`MISSING` las 57. **Arreglado:** instalar antes, con la caché de npm que el job ya
tiene. Medido: 0 filas `MISSING`, columna `Current` real.

_(Distinto de `R9-5`, que dice que el job no puede fallar por el
`continue-on-error`. Eso presupone que el paso mide algo.)_

### `R9-95` (P2) — el `finally` de `main()` podía DESTRUIR el motivo del aborto

Un `throw` desde un `finally` **reemplaza** la excepción del `try`. Así que una
corrida donde la compuerta hizo su trabajo —cazar un encogimiento, negarse a
publicar— podía reportar `EBUSY: resource busy or locked, rmdir` **y nada más**:
la compuerta disparó y el operador no se enteró, que es el asunto entero de esta
revisión. El espejo es igual de malo: una corrida que emitió los cuatro packs **y**
reescribió el manifiesto reportando un EBUSY pelado parece fallida. No es
fontanería hipotética: `staging` vive dentro de `out`, `out` es el Escritorio por
defecto, y un cliente de sincronización sobre 9,5 MB de `.sqlite` recién escritos
es la misma causa que motivó `R9-81`. **Arreglado:** la excepción original se
conserva y el problema de limpieza se **añade**; si no había excepción, el mensaje
dice que **la construcción sí tuvo éxito**.

### `R9-96` (P2) — la escritura del manifiesto era la única operación sin mensaje

Y es el **único** fallo donde «los archivos de `out` son de una corrida anterior»
es **falso** y «el manifiesto no se tocó» es el problema en vez del consuelo: los
cuatro renames ya cayeron, así que `out` tiene los bytes de ESTA corrida mientras
el manifiesto versionado pina los anteriores. Publicar desde ahí sube packs cuyo
sha256 el manifiesto contradice — y ese sha256 es la única señal que
`data-loader.web.ts` usa para notar un pack nuevo, así que a los navegadores se
les diría que no cambió nada. Un `EPERM` pelado no dice nada de eso.
**Alcanzabilidad: baja** (archivo de solo lectura, bloqueo, disco lleno); se
arregla por la asimetría de disciplina, no por la probabilidad.

---

## Comprobado y BIEN (no se tocó)

- **La cadena de datos publicados, entera y dos veces** (antes y después de tocar
  el script). Ver el resumen.
- **El job de Security Audit significa LO MISMO en Node 24 que en 20.** Extraído
  el bloque `npm audit report` completo de los dos runs y diferenciado línea a
  línea: `14 vulnerabilities (11 moderate, 3 high)` en ambos, mismas 10 cadenas de
  advisories, mismo `exit code 1` tragado. **Única diferencia en 105 líneas:** npm
  11 clasifica la remediación de `stream-json` como `--force` + breaking change,
  que es **mejor** clasificación y va en la dirección de «nunca `npm audit fix
--force`». `--audit-level=moderate` se honra igual.
- **Cero `EBADENGINE` en el `npm ci` de CI bajo Node 24**, sobre los logs
  completos de los tres jobs.
- **El `require` perezoso de `R9-82` no vuelve silencioso ningún camino.**
  Inventariados los seis `catch` del archivo: ninguno envuelve a `openDatabase` ni
  degrada a warning/skip. Ejecutado a mano con Node 20.20.2: stack legible,
  **exit code 1**, directorio de salida **vacío**, `web-bootstrap.json`
  **intacto**, árbol limpio.
- **El ternario de `openDatabase` es NECESARIO, no cosmético.** Medido en 24.11.1:
  `new DatabaseSync(f, undefined)` y `(f, null)` lanzan `ERR_INVALID_ARG_TYPE`.
  _(Nota: si algún día llega un `options` falsy que no sea `undefined`, el ternario
  degradaría en silencio una apertura readOnly en una de lectura-escritura que
  CREA el archivo. Hoy los tres llamadores pasan o nada o un literal, así que es
  inalcanzable.)_
- **`redLetterPackParity.test.ts` corre legítimamente sin base de datos** — son 55
  aserciones que antes no se ejecutaban nunca, y pasan incluso bajo Node 20.
- **La sospecha central sobre `R9-83` NO es alcanzable.** Se temía que el mensaje
  nuevo («there is no published manifest at X … its absence is a deleted or moved
  file») mintiera con el archivo en disco. Sondeados **9 estados del mundo**
  contra la función real: `readPreviousManifest` devuelve `null` **solo** por
  ausencia; truncado, vacío, marcadores de conflicto, sin `packs`, `null` literal,
  `redLetter` como cadena y **un DIRECTORIO en esa ruta** **lanzan**, cada uno con
  su mensaje. `R9-74` cerró esa puerta y sigue cerrada.
- **`R9-85` discrimina de verdad**, y lo que lo caza son las aserciones **nuevas**
  de `R9-84`: con el regex viejo de etiquetas seguiría verde.
- **El patrón de `R9-85` no existe en ningún otro sitio del repo.** Barrido
  completo: `jest.requireActual('fs')` solo aparece en `buildWebPacks.test.js`, y
  los únicos `jest.spyOn(fs, …)` son los de ese mismo archivo.
- **El vecino «falla el ÚLTIMO rename» está bien cubierto**: `stranded` incluye
  correctamente el archivo que acaba de fallar.
- **El orden de `emit()` es el que los mensajes de `R9-84` necesitan**: renames
  **antes** de la escritura del manifiesto, así que «the manifest was not touched»
  es verdad en las dos ramas. Comprobado contra el código **y** contra el mundo.
- **No hay camino que emita o escriba el manifiesto sin pasar por
  `assertNoShrink`.**
- **`--allow-shrink` apaga CUATRO refusals, no tres** (la 16 decía tres):
  `R9-83` base ausente, `R9-77` base que no pina nada, `R9-66` un conteo bajó y
  `R9-73` una versión se esfumó. No toca nada fuera de `assertNoShrink`.
- **Los pisos del escáner de providers siguen valiendo, con holgura de 1**:
  directorios 2 (piso 2), native 19 (18), web 11 (10), unmountedOnWeb 8 (7).
- **No hay más sitios donde se fije Node**: no existen `.npmrc`, `.nvmrc`,
  `.node-version`, `mise.toml` ni `.tool-versions`; `eas.json` no fija `node`;
  `functions/` y `vercel/gift-code-redeem/` son paquetes independientes con su
  propio lockfile, fuera de CI.
- **El `staging` dentro de `out` sigue siendo correcto** (renames del mismo
  volumen; EXDEV inalcanzable).

---

## Dicho y NO hecho (decisión de Victor)

- **Con el mismo lockfile, `npm ci` materializa 1851 → 1827 paquetes** (npm 10.8.2
  en Node 20 → npm 11.19.0 en Node 24). 24 paquetes de diferencia, reproducible en
  dos commits y en los dos jobs, y **el lockfile —lo único versionado— no registra
  el cambio**. «CI verde» ya no atestigua el mismo árbol de dependencias que hace
  dos días. Identificar cuáles 24 exige un `npm ci` con cada npm en una copia
  aparte del repo; no se hizo para no reescribir el `node_modules` compartido.
- **Aviso NUEVO tragado por el salto a npm 11:** `3 packages have install scripts
not yet covered by allowScripts` — `@firebase/util`, `protobufjs` y `re2` (este
  compila nativo con `node-gyp`). Es de cadena de suministro, nadie lo lee y nada
  lo fija. Si npm pasa a denegar por defecto, `re2` dejaría de compilarse.
- _(De propina, medido: los dos `EBADENGINE` que npm 10 imprimía decían
  `required: { node: '>=22' }` en **cada run desde hacía meses**. El árbol de
  dependencias llevaba gritando `R9-82` en el log y nadie lo leyó.)_
- **`--allow-shrink` ya sirve para CUATRO decisiones.** Separarlas sigue siendo
  media hora, y sigue sin decidirse.
- **La deprecación de `actions/checkout@v4` / `actions/setup-node@v4`** (forzadas a
  correr sobre Node 24 porque el runtime node20 está deprecado) aparece **igual**
  antes y después del diff, así que no la causó este cambio — pero el día que
  GitHub retire ese runtime, **los tres jobs dejan de arrancar**. Pasar a `@v5` lo
  cierra.
- **Un provider montado por un componente envolvente o dentro de un `.map()`**
  sigue invisible para el escáner **y** no cae en `unreadable`. Igual que en la 15.
  Se le suma un alias de import (`import {X as Y}` + `<Y>`), que es más filoso
  porque el nombre real **sí** está en el archivo.
- **`fs.readdirSync` y el orden alfabético.** La prueba `names exactly what moved`
  depende de él para afirmar «el primer nombre es el que pasó». Observado
  alfabético en todas las corridas, pero sin garantía documentada de Node ni de
  NTFS; en el runner de CI (Linux) podría diferir. La prueba sería frágil aunque
  el código sea correcto. No verificado en CI.
- **Un Ctrl-C a media construcción** se salta el `finally` y deja un
  `.staging-XXXXXX` dentro de `out`. Sigue igual.

---

## ⚠️ Correcciones de la sesión 22 (doble check con Opus 5.5, punto 4)

Las líneas citadas son las de este archivo ANTES de agregar esta sección. Detalle: `S22-doble-check-puntos-3-4.md`.

- `:215-218`, «`null` y `[]` son respuestas distintas a propósito»: es cierto del código, pero ninguna prueba lo vigila (`R9-151`).
- `:278-282`, «los seis `catch` del archivo»: hoy son 8, y el de `:770` envuelve `emit()` pero relanza. La conclusión se sostiene: con Node 20 da exit 1, `out` vacío y el manifiesto intacto.
- `:289-290`, «55 aserciones» en `redLetterPackParity`: son 6 pruebas y 9 `expect(`. El 55 eran las pruebas de las dos suites.
- `:313-314`, «con holgura de 1»: para los directorios la holgura es 0. Los números se sostienen hoy.
- `:190-196`: ver la nota de `S18:212-215` sobre Metro y expo-router.
