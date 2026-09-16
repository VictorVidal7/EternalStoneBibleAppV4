# S15 — revisión del diff de la sesión 14 (`R9-72`..`R9-76`)

> **Sesión 15, 2026-09-15.** Revisión adversarial del diff de ARREGLOS de la sesión 14, ya
> mergeado en `main`. 5 commits, 4 archivos de código.
> Rama: `fix/review-s15-revision-diff-s14`: **6 commits de código + 2 de checkpoint, todas
> las compuertas verdes (362 suites, 4250 pruebas, `tsc`, lint y `format:check`).**

---

## Resumen

**Séptima vez seguida que la revisión del diff de arreglos paga.** 5 defectos nuevos
(`R9-77`..`R9-81`), **ninguno P0**, y **los cinco otra vez en las COMPUERTAS** — tercera sesión
consecutiva. Los 5 arreglados en esta misma sesión.

Los tres arreglos de la sesión 14 **se sostienen** y sus pruebas **discriminan de verdad**,
verificado revirtiendo cada uno por separado (no los tres juntos — ésa es la lección de la
sesión 10) y diffeando cada revert:

| revert                                                | pruebas rojas | controles |
| ----------------------------------------------------- | ------------- | --------- |
| `R9-72` (el escenario `staging` → `out` directo)      | 4             | verdes    |
| `R9-73` (los dos bucles sobre las listas PREVIAS)     | 6             | verdes    |
| `R9-74` (`readPreviousManifest` se traga los errores) | 3             | verdes    |

**Ninguno desarma la prueba del otro**, que era el riesgo concreto de un commit con tres
arreglos dentro. `R9-75` también discrimina: metiendo un `<ProbeOnlyProvider>` solo en
`app/_layout.tsx` la compuerta sale roja **nombrándolo**.

**Los cuatro sha256 siguen coincidiendo.** Bajados en vivo de
`eternalstonebible.github.io/packs/` y hasheados contra `web/packs/web-bootstrap.json`: los
cuatro sha256 **y** los cuatro conteos de bytes, idénticos. Lo publicado está intacto, y se
volvió a comprobar al final de la sesión corriendo el build real contra los datos reales.

---

## La forma que se repite

La sesión 13 encontró sus defectos en las compuertas. La 14 también. **La 15 también** — y
esta vez con una regularidad que ya se puede nombrar:

> **Una compuerta escrita para cerrar un caso cierra ese caso y deja abierto el vecino que la
> motivó.**

- `R9-73` lee las listas PREVIAS para ver lo que desapareció — y no le pone piso a la lista
  previa, así que una lista previa VACÍA la apaga entera (`R9-77`).
- `R9-73` se justifica citando `R9-13` por su nombre — y no puede ver `R9-13`, porque una
  versión que nunca tuvo pack no tiene entrada en la base de la que faltar (`R9-78`).
- `R9-76` saca el discriminador de «el nativo lo exporta» — y lo deja en «el nativo lo
  declara», que sigue sin cubrir el par donde el contrato vive en un tercer archivo
  (`R9-79`).
- `R9-75` deriva la lista de providers en vez de confiarla — leyendo el layout como TEXTO, o
  sea confiando en un comentario (`R9-80`).
- `R9-72` establece que nada llega a `out` hasta pasar la compuerta — y la mudanza final son
  cuatro operaciones, no una (`R9-81`).

**Y una segunda forma, nueva, que conviene anotar aparte:**

> **Un mensaje de éxito que AFIRMA cuánto comparó es una aserción, y hay que probarla contra
> el mundo.** El de `assertNoShrink` decía «2 packs and 2 red-letter packs compared against
> the published manifest» habiendo comparado CERO. Las dos cifras coinciden en toda corrida
> buena — por eso nadie la miró en la mala. Es la hermana de la lección de la sesión 14 («un
> mensaje de error que afirma un estado del mundo»), del otro lado del `if`.

---

## Los 5 hallazgos

### `R9-77` (P1) — una base que no fija NADA se reportaba como éxito

`readPreviousManifest` exige un array `packs` con un argumento explícito: sin él «_every count
comparison below would have nothing to compare against and pass vacuously_». **Ese mismo
razonamiento no se aplicó a `redLetter`.** Si la lista previa de letra roja viene vacía, los
dos bucles que la recorren —el de conteos y el de desaparición de `R9-73`— no ejecutan ni una
aserción, y `assertNoShrink` imprime un mensaje de éxito.

Alcanzable, y no por poco: **el manifiesto del repo llevó exactamente esa forma** (`packs` sí,
`redLetter` no) desde `c3a9aac` (2026-07-08) hasta `a0782a6`. Un `git checkout` de una revisión
vieja, un revert, o un merge que se quede con el lado viejo aterrizan ahí. Y `redLetter: []`
—lo que este mismo script escribe si la lista de specs se vacía una vez— es igual de vacío
pasando todas las comprobaciones de forma.

**Probado de punta a punta contra el `main()` real**, con esa base y RVR1960 fuera de
`RED_LETTER_SPECS` (o sea `R9-13` palabra por palabra):

```
did the run ABORT? -> NO - it emitted
   shrink check: 2 packs and 1 red-letter packs compared against the published
                 manifest, nothing went down and nothing went missing
files a human would now upload: rvr1960.sqlite, web-red-letter.json, web.sqlite
rewritten manifest redLetter: [{"versionId":"WEB",...}]
```

Emite, afirma que nada faltó, y **reescribe el manifiesto sin RVR1960** — destruyendo la única
base que tenía la corrida siguiente. Es justo la cascada que el comentario de `R9-73` describe
como su razón de existir.

**Arreglo.** `baselineComparisonCounts` cuenta lo que la base FIJA, que no es lo mismo que lo
que la corrida emite. Si la corrida emite entradas de una categoría y la base no fija ni una,
se para. Señal de alto, no muro: `--allow-shrink` sigue siendo la salida, porque la PRIMERA
corrida que emite una categoría entera legítimamente no tiene nada que la fije (`a0782a6` fue
esa corrida). El mensaje de éxito dice cuántas comparaciones **hizo**. Y
`readPreviousManifest` rechaza un `redLetter` que no sea ni array ni objeto, pero **no** su
ausencia: ausente es indistinguible de «nunca se publicó nada», así que el piso vive donde la
corrida sabe qué va a emitir. Va con su control.

Vistas fallar primero con **tres reverts por separado**: el piso de `assertNoShrink` → 8
rojas; `baselineComparisonCounts` contando emisiones → 10; la comprobación de forma → 1. Los
6 controles verdes en los tres.

### `R9-78` (P1) — las tres listas de letra roja solo estaban atadas por comentarios

La disponibilidad de letra roja se declara en **tres** sitios: `redLetterByVersion`
(`redLetterText.ts`, nativo), `RED_LETTER_PACKS` (`redLetterText.web.ts`, web, y los NOMBRES de
archivo) y `RED_LETTER_SPECS` (`scripts/build-web-packs.js`, lo único que los CONSTRUYE). Los
tres llevaban un comentario pidiéndole al siguiente que se acuerde, y **nada detectaba el día
que uno no se acordara**. `R9-13` es ese día.

`R9-73` cubre una versión que DESAPARECE del manifiesto publicado, y **no puede ver este
caso**: una versión que nunca tuvo pack no tiene entrada en la base de la que faltar. O sea que
su propio comentario cita `R9-13` por su nombre mientras construye una compuerta que no lo
vería.

**Arreglo.** Las tres listas se comparan por valor: ids en las tres direcciones y nombres de
archivo entre las dos que los llevan. Los dos hermanos exponen `redLetterVersionIds()` a
propósito — así la compuerta de paridad exige que el web lo siga teniendo, porque nativo ⊆ web.
Con piso (las tres no vacías) y con control (que reaccione en LAS DOS direcciones).
Vista fallar primero en las tres direcciones del drift; el estado real de `R9-13` sale rojo en
la comparación de ids, que es la que importa.

### `R9-79` (P2) — el contrato compartido no tiene por qué vivir en el hermano nativo

`R9-76` amplió el discriminador de «el nativo lo EXPORTA» a «...o lo declara en privado», con
el argumento correcto. **Pero el mismo argumento vale un nivel más afuera:** el contrato no
tiene por qué estar en el hermano nativo en absoluto. `AudioPlayerContext.tsx` importa
`AudioPlayerContextValue` de `../types/audio`, así que el nativo ni lo declara ni lo exporta y
las dos reglas se callan — **y ése es uno de los cuatro pares de contexto que el comentario de
la compuerta cita como su justificación**. Sonda: una copia local divergente en el stub web
dejaba la suite en **72/72**.

**Arreglo.** Para un `…ContextValue` la regla es incondicional: un archivo `.web` no declara
uno, punto. Todo otro nombre sigue necesitando que el nativo lo exporte. **Y con control, que
es lo que le faltaba a `R9-76`**: tras `R9-70` ningún par real dispara la regla, así que los
catorce casos reales se ponen verdes sin comparar nada significativo. El predicado sale a una
función y se ejercita contra pares sintéticos — el caso de `R9-79`, el de `R9-76`, el de
`R9-70`, y los dos negativos que conservan la estrechez.

### `R9-80` (P2) — la compuerta de `R9-75` contaba como montado un provider nombrado en un comentario

`providersMountedIn` era un regex sobre el TEXTO crudo, y el texto crudo no distingue un
provider MONTADO de uno MENCIONADO. Sonda: dejar de montar `<AudioPlayerProvider>` en
`app/_layout.web.tsx` conservando el nombre en un comentario JSX dejaba el archivo en **11/11
verde**. El sentido del fallo es el malo — el conjunto «montados en web» **crece** en silencio,
`unmountedOnWeb` pierde esa entrada, y nada exige anotarla. Consecuencia: el «Algo salió mal»
genérico con el botón de reintentar que vuelve a lanzar, que es exactamente lo que `R9-14`
existe para evitar. La compuerta escrita para ser «derivada, no confiada» confiaba en un
comentario.

**Arreglo.** Recorre el ÁRBOL DE SINTAXIS, como el escáner de paridad después de `R9-67`. Y con
la misma disciplina: una etiqueta que no puede atribuir a un identificador simple
(`<Ctx.Provider>`) se **reporta** en vez de descartarse. Con control sintético, que es lo único
positivo que hay.

### `R9-81` (P2) — la mudanza a `out` no es atómica y podía dejarlo MEZCLADO

`R9-72` estableció la propiedad correcta, pero la mudanza final son **cuatro** `renameSync`.
Probado bloqueando el último destino: un `rvr1960.sqlite` nuevo junto a un `web.sqlite` viejo,
el manifiesto sin escribir describiendo ninguno de los dos estados, el escenario ya barrido por
el `finally` —así que no queda nada que diga que la mudanza fue parcial—, y un `EPERM` pelado
sin el «_check their sha256 before publishing_» que llevan todos los demás abortos. Y `out` es
por defecto el **Escritorio**, justo donde un archivo se queda abierto por un cliente de
sincronización. Río abajo tampoco lo caza nadie: `data-loader.web.ts` usa el sha256 solo como
token de caché, **nunca lo verifica contra los bytes**.

**Arreglo.** Se comprueba que todos los destinos son reemplazables **antes** de mover el
primero, y si el rename falla igual, el error dice qué se movió y qué no. Detalle que costó
una prueba roja por el camino equivocado: **Windows abre tan campante un DIRECTORIO con
`open(…, 'r+')`**, así que el preflight tiene que mirar además `statSync().isFile()`.

---

## Remate menor, del mismo tipo

La prueba de hooks de `missingProviderError` decía «**six** real unmounted-on-web contexts»
mientras `WEB_UNMOUNTED_PROVIDERS` llevaba **siete**. `SyncEngineProvider` era la única entrada
cuyo mensaje no fijaba nada — en la prueba cuya razón de existir entera es que una lista de
strings escrita a mano se pudre en silencio. Añadida, **con piso**: la cantidad de hooks tiene
que ser igual al tamaño del conjunto. (Es inalcanzable hoy: todos los llamadores usan
`useSyncEngineOptional()`.)

---

## Comprobado y BIEN (no se tocó)

- **Los cuatro sha256, dos veces**: contra el manifiesto y contra lo que hoy sirve GitHub
  Pages, antes de tocar nada y después de los cinco arreglos. Idénticos las dos veces.
- **`readPreviousManifest` al lanzar no bloquea ningún camino legítimo.** La base es el
  manifiesto del repo pase lo que pase con `out`, así que una máquina nueva o un directorio de
  salida distinto siguen teniendo base.
- **Dos corridas solapadas no se pisan el escenario** (cada `mkdtemp` es único). Pueden
  entrelazar mudanza y escritura del manifiesto, pero para un script manual es rebuscado.
- **El `finally` no puede borrar nada que hubiera que conservar**: borra su propio `mkdtemp`.
- **La forma vieja del manifiesto** (`redLetter` como objeto) sí se lee bien, y ahora además
  cuenta como fijación.
- **El alcance de la compuerta de providers es correcto hoy**: todos viven en el layout raíz.

## Dicho y NO hecho (decisión de Victor)

- **`--allow-shrink` ahora sirve para DOS decisiones distintas** y lo hace con una sola
  palanca: «el encogimiento es deliberado» (`R9-66`/`R9-73`) y «es la primera vez que emito
  esta categoría» (`R9-77`). Las dos son «pará y confirmá», así que compartir bandera es
  defendible — pero **aprobar una aprueba la otra sin querer**, que es justo la forma de
  discriminador débil que esta sesión estuvo cazando. Separarlas en dos banderas es media hora;
  **queda dicho, y es decisión de Victor.**
- **Un Ctrl-C a media construcción se salta el `finally`** y deja un `.staging-XXXXXX` dentro
  de `out` para siempre. La prueba de limpieza cubre el camino limpio y los abortos, no un
  kill. Barato de cerrar (barrer `.staging-*` viejos al arrancar), pero no se tocó.
- **Los defaults de `main()` no tienen guarda.** Una prueba que omita `manifestFile` apunta al
  manifiesto real del repo; hoy la propia compuerta de encogimiento aborta esa corrida (66
  versículos < 31 102), así que es riesgo latente, no bug. Una corrida con los specs reales y
  un `out` distinto **sí** reescribiría el manifiesto (solo la fecha).
- **`arrayName` en `PACK_SPECS` es campo muerto**: `parseTsArray` no lo usa.
- **Nada detecta el día que un provider se monte en `app/(tabs)/_layout.tsx`** en vez de en el
  layout raíz.
