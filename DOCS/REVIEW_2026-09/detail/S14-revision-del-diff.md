# S14 — Revisión del diff de la sesión 13 (las COMPUERTAS)

> **Sesión 14, 2026-09-15.** Sexta revisión adversarial seguida sobre un diff de arreglos, y
> la sexta que encuentra defectos reales. Objeto: los 8 commits / 16 archivos de la sesión 13
> (`R9-66`..`R9-71`), ya mergeados en `main`.
>
> **Veredicto: los 6 arreglos se sostienen y sus 6 pruebas discriminan.** Los 5 defectos están
> en las **compuertas** de esos arreglos — el mismo sitio donde la sesión 13 encontró los
> suyos, lo que es el dato de método de esta sesión.
>
> Arreglos en `fix/review-s14-revision-diff-s13`, **mergeada en fast-forward a `main` y
> pusheada** con los gates corridos **sobre `main` ya mergeado**: **361 suites, 4219 pruebas**
> (desde 361/4201), `tsc`, lint y `format:check` verdes. La rama se borró tras mergearla.

---

## 1. Lo que se verificó del diff de la 13, y aguanta

Cada arreglo revertido, el **revert diffeado** para confirmar que tocó la línea que se creía,
la prueba corrida, y el revert restaurado.

| Arreglo                      | Revert aplicado                             | Resultado                                                          |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `R9-66` 1ª mitad             | quitados los dos `throw` de piso            | **2 rojas**; los 4 controles verdes a los dos lados                |
| `R9-66` 2ª mitad             | `shrinkComplaints` → `[]`                   | **6 rojas**; los 3 controles puros verdes                          |
| `R9-67` (paridad por AST)    | par sintético `function f(){}` `export {f}` | **cazado**; y `export * from` → `unresolvable` ruidoso             |
| `R9-68` (lista de providers) | vuelta al regex `\w*Provider`               | **3 rojas**                                                        |
| `R9-69` (versión emparejada) | vuelta al booleano reseteado en el efecto   | **roja**, con `{offsetsFor:"RVR1960", textFrom:"WEB"}`             |
| `R9-70` (contratos)          | revertidos los 3 archivos                   | **exactamente los 2 huecos vivos**, silencio en los otros 12 pares |
| `R9-71` (reintento)          | vuelta a `set(versionId, new Map())`        | **2 rojas**; los dos controles verdes                              |

**Y la salida publicable sigue idéntica.** Corrido el script real contra los datos reales: los
cuatro sha256 coinciden con `web/packs/web-bootstrap.json` y el manifiesto **no cambia ni un
byte** (`git status` limpio tras la corrida). Repetido después de los arreglos de esta sesión.

## 2. Respuesta a las cinco preguntas con las que arrancó la sesión

**(1) ¿Qué exporta un módulo que un recorrido de `sourceFile.statements` de primer nivel no
ve?** **Nada, para nombres de export.** Sondeado con pares sintéticos: `export {x}`,
`export const a, b`, `export default function`, `export * from`, `export * as ns`,
`export {a as b}`, `export {type a}` — todo resuelve o cae en `unresolvable`.
`ts.canHaveModifiers` cubre **todas** las clases de declaración exportables, y el catch-all del
final recoge cualquier otra. Además se dumpeó la superficie de los **14 pares**: **ninguno
compara en vacío** (los 5 con `runtime=[]` tienen `hasDefault=true` a los dos lados), y el piso
`webFiles.length >= 14` es exactamente el conteo real. Lo que un recorrido de primer nivel no
puede ver **no es un nombre, es el contenido detrás del nombre** — que es la clase de `R9-70`,
y de ahí salió `R9-76`.

**(2) `readPreviousManifest` con mala fe.** Era el vicio, sí → **`R9-74`**.

**(3) Los cuatro sha256.** Coinciden. Verificado dos veces, antes y después de reordenar las
escrituras.

**(4) La lista de siete providers a mano.** Se degrada **callado** → **`R9-75`**.

**(5) ¿Quién llama a `loadRedLetterSpans` en bucle, y puede un reintento solaparse?**
**Nadie y no.** Un solo llamador en la app (`[chapter].web.tsx:139`); `loadPromises` comparte
la promesa en vuelo, y el `delete` va en un `.then` registrado **antes** que el del llamador,
así que la entrada ya está borrada cuando el llamador reacciona. No hay bucle: el efecto
depende de `[redLetterActive, selectedVersion.id]`, y `setRedLetterLoadedFor` con el mismo
valor es un no-op.

## 3. Los 5 defectos

Cada uno con su entrada completa en `BUGS.md`. Resumen de por qué son defectos y no gustos:

- **`R9-72` (P1)** — el mensaje de abort **afirmaba** «_no pack file was emitted_» con los dos
  `.sqlite` recién escritos. Solo los JSON de letra roja se habían aplazado. Reproducido de
  punta a punta con una fuente que pierde 492 versículos de Salmos: satisface **todos** los
  pisos de `verifyPack` (fijan la base contra la misma fuente encogida), no toca ningún span de
  letra roja, aborta en `assertNoShrink`, y deja un `web.sqlite` de 30 606 versículos donde el
  error jura que no hay nada. Publicar es subida **manual** de ese directorio.
- **`R9-73` (P1)** — los bucles de conteo recorren las listas **nuevas**, así que una versión
  que desaparece da cero quejas. Sondeado: `[]` en los cuatro escenarios de desaparición, y
  `assertNoShrink` no lanza. Es `R9-13` volviendo por la puerta que se acababa de cerrar.
- **`R9-74` (P2)** — `null` ante cualquier error, y el silencio significaba a la vez
  «verificado» y «no comparé nada».
- **`R9-75` (P2)** — compuerta en una sola dirección: nadie comprobaba que la lista estuviera
  **completa**.
- **`R9-76` (P2)** — el discriminador («¿lo exporta el nativo?») lo decide el archivo
  vigilado. Es el estado exacto en que estaba `OfferingSheetContextValue` antes de `R9-70`.

## 4. Comprobado y BIEN (no son hallazgos)

- **La suite es ciega a una `it.each` vacía? No.** `webFiles.length >= 14` es el piso, y jest
  falla por su cuenta ante una tabla vacía. Los 14 pares comparan algo de verdad.
- **`unresolvable` sí atrapa lo que dice.** `export * from './x'` sale ruidoso. Óxido menor
  (no arreglado, no vale un commit): el encabezado lo llama `unresolvableExports`.
- **La prueba «`has no stale entries in the native-only allowlist`» es un bucle pelado que pasa
  con la lista vacía** — misma forma que `R9-66`, pero **benigno**: una lista blanca vacía es
  una vía de escape más chica, no un hueco. Decidido no tocar.
- **La ventana de `R9-69` que su propia prueba no cubre está cerrada por otra cosa.** El
  `textFrom` de la prueba es la versión de la última LLAMADA a `getChapter`, no la de los
  `verses` que hay en estado, así que es más débil de lo que dice su comentario. Pero el render
  donde los spans nuevos ya están listos y los versículos siguen siendo los viejos **no llega
  al lookup**: `setLoading(true)` corre síncrono dentro del efecto y `verses.map` está detrás
  de la rama `loading` (`[chapter].web.tsx:278`). Verificado leyendo las dos ramas.
- **`import type` + `export type` de `R9-70` no crea un self-import en runtime.** Babel borra
  la declaración entera, y es el patrón que `MemoryDeckContext.web.tsx` y
  `AudioPlayerContext.web.tsx` ya tenían desplegado en la web viva.
- **La lista de providers está COMPLETA hoy.** Nativo monta 19, web 11, diferencia 8 = los 7 de
  `WEB_UNMOUNTED_PROVIDERS` + `ServicesProvider`, que va fuera con razón (su `createContext`
  tiene un default real, el hook no lanza nunca, una entrada sería inalcanzable).

## 5. Lo que queda DICHO, no arreglado

Una sola cosa, y a propósito, porque es una carencia de la compuerta y **no** un defecto vivo:

- **La compuerta de paridad sigue sin ver la ARIDAD de una función exportada ni la FORMA de un
  objeto exportado por defecto.** Sondeado: nativo con 3 parámetros vs web con 1 → **verde**;
  `export default` de un objeto con 3 miembros vs 1 → **verde**. Es la misma clase de `R9-70`,
  un nivel más abajo, y **ya mordió a este repo**: el encabezado de `redLetterText.web.ts`
  llama «a landmine» al desajuste de aridad de `getRedLetterSpans`. **Hoy no hay ninguna
  instancia viva** — sondeados los 14 pares, cero desajustes de aridad. Un chequeo de aridad
  son ~10 líneas dentro del walker que ya existe. Queda dicho.

## 6. La lección de método

La sesión 13 encontró sus defectos en las **compuertas** de los arreglos. La 14 los encontró
**en el mismo sitio otra vez** — lo que dice que una compuerta recién escrita merece
exactamente la misma desconfianza que el código que vigila, y no menos por ser una prueba.

El antídoto de la 13 sigue valiendo (_¿qué entrada hace que esto no ejecute ninguna aserción?_)
y esta sesión le añade dos preguntas:

> **¿De quién depende el discriminador de esta compuerta?** Si depende de una decisión de quien
> podría infringirla, no es una compuerta. (`R9-76`: mantené el tipo nativo privado y se calla.)

> **¿Qué significa su silencio?** Si el mismo silencio sirve para «verificado» y para «no miré»,
> no hay compuerta. (`R9-74`.)

Y un corolario que vale por sí solo:

> **Un mensaje de error que AFIRMA un estado del mundo es una aserción, y hay que probarla como
> tal.** El de `R9-66` decía «_no pack file was emitted_» con 9,5 MB de packs recién escritos, y
> había una prueba —`says NOTHING was written, so the message is actionable`— **fijando esa
> frase**. Una prueba puede certificar una mentira si solo comprueba que el texto está ahí.

Y una variante nueva de la clase «un bucle en vacío pasa»:

> **El bucle que recorre la lista NUEVA no puede ver lo que falta de la VIEJA.** `R9-73`. Si una
> comprobación compara dos colecciones, tiene que recorrer **las dos**.

---

## ⚠️ Correcciones de la sesión 22 (doble check con Opus 5.5, punto 4)

Las líneas citadas son las de este archivo ANTES de agregar esta sección. Detalle: `S22-doble-check-puntos-3-4.md`.

- `:7` y `:26`, «sus 6 pruebas discriminan»: es falso para `R9-67`, cuyo lector de exports no tiene ningún caso sintético (`R9-144`).
- `:32-34`, «`git status` limpio tras la corrida»: solo el día de la medición, porque `generated` cambia.
- `:87-88` (F2), «`unresolvable` sí atrapa lo que dice»: es cierto del código de hoy, pero nada lo vigila (`R9-144`).
- `:92-97` (F4), «la ventana de `R9-69` … está cerrada por otra cosa»: es falso desde el origen para la ida y vuelta A → B → A, porque el primer render tras volver empareja offsets de A con texto de B (`R9-150`).
