# S13 — revisión con ojo fresco del diff de la sesión 12 (ya mergeado)

**Sesión 13, 2026-09-15.** Mismo protocolo que las sesiones 8, 9 y 10, ahora sobre el diff de
la 12: el **bloque WEB** (`R9-13`, `R9-15`, `R9-14`), 6 commits, 19 archivos — el más ancho
del programa, y el único que toca **datos ya publicados**.

**Veredicto: los tres arreglos se sostienen y sus pruebas discriminan.** Los cinco defectos
están en los **bordes** de esos arreglos: dos compuertas que se pueden pasar en vacío, un
detector que se traga errores legítimos, una carrera de un render, y el vecino de `R9-13` un
nivel más abajo. Ninguno es P0. Los cinco arreglados en
`fix/review-s13-revision-diff-s12`.

---

## Primero: lo que SÍ discrimina

La técnica de siempre — revertir cada arreglo, uno a uno, `diff` del revert a la vista para
confirmar que tocó la línea que uno cree, y mirar qué prueba se cae.

| Revert                                                       | Resultado                                       |
| ------------------------------------------------------------ | ----------------------------------------------- |
| Quitar `export` de `hasRedLetterData` en `redLetterText.web` | paridad: **1 falla** ✅                         |
| Quitar el `<ErrorBoundary>` del `Slot`                       | `webRouteErrorIsolation`: **4 fallan** ✅       |
| Quitar **solo** `key={pathname}`                             | **exactamente 1** falla (la de «no se enclava») |
| Volver a `selectedVersion.id === 'WEB'` en la pantalla       | `chapterReaderWebRedLetterVersions`: **1** ✅   |
| Quitar `RVR1960` de `RED_LETTER_PACKS`                       | **6 fallan** entre los dos archivos ✅          |

Las pruebas nuevas de la sesión 12 son buenas. Los defectos no están en ellas.

---

## `R9-66` (P1) — la verificación de spans del build pasaba EN VACÍO

`scripts/build-web-packs.js` es **lo único de todo el programa que se interpone entre una
regeneración mala y datos que se publican**. Todo el cuerpo de `verifyRedLetterAlignment` es
un bucle por entrada, y un bucle sobre nada no recoge ningún fallo.

Ejecutando la función real contra un `.sqlite` real:

```
verifyRedLetterAlignment([], db, 'RVR1960')
  →  "RVR1960 red-letter alignment: 0 entries, 0 spans,
      ALL slices non-blank and in-range against rvr1960.sqlite"
  →  PASA. Y el script escribe rvr1960-red-letter.json = "[]" (2 bytes),
     le saca un sha256 nuevo y anota `entries: 0, spans: 0` en el manifiesto.
```

Publicado, eso es la letra roja muerta en silencio para esa versión en la web — **el síntoma
exacto de `R9-13`, esta vez con la bendición del build.** Y no es hipotético: los dos
archivos fuente son **auto-generados** (`bible-data-rvr1960-redletter.ts` desde
`decisions/*.json`), así que una regeneración vacía es la forma _ordinaria_ de llegar aquí.

El contraste que lo delata: la mitad del `.sqlite` **sí** tiene piso desde siempre
(`n === expectCount`, `books === 66`, rango `1..66`, cero versículos en blanco). La de letra
roja no tenía ninguno.

**La otra mitad de la pregunta está bien:** si falta el `.sqlite` de esa versión,
`DatabaseSync(..., {readOnly: true})` revienta con `unable to open database file`. Ese camino
es ruidoso.

**Arreglado:** dos pisos, uno antes de abrir la base (`entries` vacío) y otro después del
bucle (`spanCount === 0`). El script pasa a ser requerible
(`if (require.main === module)`) para que la prueba ejercite las funciones **reales**.

- **Visto fallar primero:** las 2 pruebas de vacío dan «Received function did not throw»
  contra el código sin arreglar. Los **4 controles** (pack alineado de verdad, span que se
  pasa del final, span que corta solo espacio, versículo inexistente) pasan en ambos lados —
  o sea que el piso nuevo no se puede confundir con toda la verificación.
- **Y corrido de punta a punta contra los datos de verdad:** los cuatro sha256 salen
  idénticos a los del manifiesto ya publicado y `web/packs/web-bootstrap.json` no cambia ni
  un byte. El arreglo no altera la salida, solo se niega a producirla vacía.

**Queda dicho, sin hacer:** el piso es de CERO. Una regeneración que caiga de 2057 entradas a
3 seguiría pasando. El manifiesto anterior está commiteado y trae el conteo previo, así que
detectar una **caída** es posible — pero necesitaría una vía de escape para una supresión
editorial legítima, y eso ya es otra decisión. Es de Victor.

## `R9-67` (P1) — la compuerta de paridad se ponía verde ante `export {x}`

`webNativeModuleParity.test.ts` escaneaba **texto** con un regex que solo entendía
`export [async] function|const|let|class|enum`. Ante la forma de lista devolvía un conjunto
**vacío**, y comparar contra vacío siempre pasa.

Reproducido contra la compuerta misma — `R9-13` al pie de la letra:

```ts
// redLetterText.ts (nativo)
function hasRedLetterData(...) { … }
export {hasRedLetterData};

// redLetterText.web.ts — sin exportarlo, que es el bug original
```

→ `npx jest webNativeModuleParity` → **PASS, 30/30.**

El encabezado prometía «verificado que ningún par usa `export {x} from` ni `export *`; si
alguno empieza, enséñale la forma al escáner» — pero **nada DETECTABA el día en que alguno
empezara**. Falla abierta, en silencio. Y ni siquiera mencionaba la forma local `export {x}`,
que es la más común de las tres.

**Arreglado:** parsea con `ts.createSourceFile`, que no type-checkea, no resuelve módulos y no
ejecuta una línea — conserva entera la razón de no hacer `require` (la mitad de esos archivos
arrastran dependencias nativas) y elimina el punto ciego. De paso ve tres formas más que el
regex tampoco veía: `export const a = 1, b = 2` (solo veía `a`), `export const {a, b} = …` (no
veía ninguna) y `export {X as default}`.

Queda **una sola** forma irresoluble sin seguir el re-export, `export * from`, y ahora tiene
su propio caso **por archivo** que falla ruidosamente: un export ilegible es tan peligroso
como uno ausente, porque no hace protestar a la comparación, la hace comparar contra una
lista más corta.

- **Visto fallar primero, las dos mitades:** bug en forma de lista →
  `missing: ["hasRedLetterData"]`, 1 falla (antes: 30/30 verde). `export * from` inyectado →
  1 falla en el caso nuevo. Restaurado → 58/58.

## `R9-68` (P2) — errores legítimos disfrazados de «esta sección no está en la web»

`isMissingProviderError` detectaba por mensaje con `\w*Provider`, o sea **cualquier** mensaje
de esa forma. Ejecutando la función real:

```
CLASIFICADO COMO ALCANCE  useFrameSize must be used within a FrameSizeProvider
CLASIFICADO COMO ALCANCE  ...RouterCompositionOptionsProvider. This is likely a bug in Expo Router.
CLASIFICADO COMO ALCANCE  ...LinkPreviewContextProvider. This is likely a bug in Expo Router.
CLASIFICADO COMO ALCANCE  useReaderPreferences / useBibleVersion / useToast / usePremium /
                          useFavorites / useMemoryDeck / useOfferingSheet / useAudioPlayer
                          ← LOS OCHO montados en web
```

Dos familias de error legítimo se colaban. Expo Router tiene tres errores internos cuyo
mensaje **dice literalmente «This is likely a bug in Expo Router»**, y los ocho providers que
el árbol web **sí monta** tiran mensajes de la misma forma. En cualquiera de esos casos el
usuario recibía _«Esta sección no está en la versión web / necesita tu cuenta y tus datos
guardados»_ —una explicación afirmativa y **falsa**— se le quitaba el botón de reintentar y
solo le quedaba salir a `/bible`.

El encabezado solo contemplaba el riesgo en **una** dirección (que un mensaje deje de encajar
→ pantalla genérica, nunca un crash). La dirección contraria no estaba considerada, y el
único control de la prueba (`'Provider must be used within a tree'`) no la tocaba.

**Arreglado:** el **nombre** del provider tiene que estar en `WEB_UNMOUNTED_PROVIDERS`, los
siete que `app/_layout.web.tsx` deja fuera a propósito. `ServicesProvider` queda fuera de la
lista aunque también esté sin montar: el `createContext` de `useServices` tiene por defecto un
objeto real, no `undefined`, así que nunca tira y la entrada sería inalcanzable.

- **Visto fallar primero:** 3 rojas. Los tres mensajes internos **reales** de expo-router →
  `false`; los ocho providers montados → `false`; y la lista y lo que `_layout.web.tsx` monta
  de verdad son **disjuntas**, leyendo el layout real en vez de fiarse de una lista a mano
  (con control de que el regex sigue encontrando ≥ 10 providers, para que la disyunción no se
  cumpla en vacío).

## `R9-69` (P2) — cambiar de versión emparejaba texto de una traducción con offsets de otra

El lector web reseteaba `redLetterLoaded` a `false` **dentro de un `useEffect`**, y un reset
dentro de un efecto llega **un render tarde**: el efecto corre después del render que cambió
la versión — y, en navegador, después de que ese render haya pintado. Así que el primer render
que ve el id de versión nuevo seguía viendo el `true` viejo, y también los `verses` viejos,
porque su recarga también es asíncrona.

El comentario de ese efecto decía que el reset evitaba _«briefly pair one version's text with
the other's offsets»_. **No lo evitaba.** Lo que limitaba el daño era que `getRedLetterSpans`
está keyed por versión — y eso solo salva mientras el pack de la versión nueva **no** esté
cacheado. En cuanto el lector cambió de idioma una vez, sí lo está.

Instrumentado, contra el código sin arreglar:

```
{offsetsFor: "RVR1960", textFrom: "WEB"}
```

o sea offsets de RVR1960 (span `[0,145)`) sobre el texto inglés de 130 caracteres que todavía
estaba en pantalla.

**Arreglado:** `redLetterLoaded: boolean` pasa a `redLetterLoadedFor: string | null`, y la
prontitud se **deriva en render** (`redLetterLoadedFor === selectedVersion.id`), que es donde
no hay ventana para ir un render atrasado. El fallback es el de siempre: texto plano, sin
letra roja, durante el render o dos que tardan el pack nuevo y los versículos nuevos.

**Nota de método:** `act()` vacía los efectos antes de que se pueda leer el árbol, así que el
frame mal pintado **no es observable** en jest. La **consulta** sí. La prueba asserta el
invariante de verdad —que ningún render pida los offsets de una versión mientras el texto en
pantalla venga de otra— y lleva su control: sin él, la aserción también pasaría si la pantalla
dejara de consultar spans del todo después de un cambio.

## `R9-70` (P2) — el vecino de `R9-13`, un nivel más abajo

La compuerta de paridad compara **nombres de export de módulo**. El tipo de valor de un
contexto no es un export de módulo: es el **contrato** entre un provider y todo lo que llama a
su hook. `PremiumContext.web.tsx` redeclaraba `PremiumContextValue` en local aunque el nativo
sí lo exporta, y `redLetterText.web.ts` hacía lo mismo con `RedLetterRun`.

Comprobado con sonda: añadiendo un miembro a la interfaz **nativa** y satisfaciéndolo del lado
nativo, `tsc --noEmit` quedaba **completamente verde** mientras el stub web nunca implementaba
ese miembro — porque `tsc` resuelve el especificador pelado al archivo nativo, ve la forma
nativa y pasa. En web eso es `usePremium().<miembro> is not a function`: el crash de `R9-13`
llegando por otro lado. Con el arreglo puesto, la misma sonda da:

```
src/context/PremiumContext.web.tsx(70,7): error TS2741: Property 'refreshEntitlement'
is missing ... but required in type 'PremiumContextValue'
```

**Arreglado:** los tres pasan a importar el tipo del hermano nativo (type-only, borrado en
compilación, sin auto-import en runtime) — el patrón que `MemoryDeckContext.web.tsx` y
`AudioPlayerContext.web.tsx` **ya usaban**. El tercero, `OfferingSheetContextValue`, tenía
excusa: el nativo no lo exportaba. Ahora sí, y el stub lo importa.

La compuerta nueva es deliberadamente **estrecha**: solo tipos que el hermano nativo
**exporta**. Medido sobre los 14 pares, los duplicados se parten limpio en dos grupos —
contratos compartidos (`PremiumContextValue`, `OfferingSheetContextValue`, `RedLetterRun`) y
formas privadas de cada archivo (`Props`/`State`, los `*ProviderProps`, `SpanMap`,
`ChapterItem`), que es **correcto** duplicar. Marcar las privadas enterraría la señal.

- **Vista fallar primero:** 2 rojas, `PremiumContextValue` y `RedLetterRun`, exactamente los
  dos huecos vivos, y silencio en los 12 pares restantes.

---

## Comprobado y BIEN (no son hallazgos)

- La entrada `heroNudgeRoute` de la lista blanca de paridad está **bien justificada**: solo la
  importa su propia prueba, por especificador relativo al archivo plano, que jest resuelve al
  nativo.
- **`/bible`, el escape de `R9-14`, no es callejón sin salida.** `app/(tabs)/bible.tsx` solo
  usa `useTheme`/`useLanguage`/`useBibleVersion`, los tres montados en web.
- Las tres pruebas que aún mockean `data-loader.web` con factoría literal (`ErrorBoundary.web`,
  `webRouteErrorIsolation`, `_layout.web`) **no** repiten la trampa de `R9-15`: importan por
  especificador `.web` **explícito**, así que `tsc` las respalda. La trampa era del
  especificador **pelado**.
- `screenLayout` **existe** en expo-router 57.0.12 (`StackClient.d.ts`), no es un prop
  inventado que se ignore en silencio.
- El `.sqlite` de los packs sale **byte-idéntico** al re-generar: los sha256 del manifiesto no
  cambiaron en el diff de la sesión 12, y volvieron a salir iguales al correr el script ahora.
  El build es determinista.
- `redLetter` del manifiesto **no lo lee nadie en runtime** (`data-loader.web.ts` solo lee
  `packs`), así que el cambio de objeto a array es seguro, tal como decía el comentario.

## Dicho en voz alta, sin acción

- **`loadRedLetterSpans` cachea el fallo para siempre, por versión.** Un fetch fallido
  transitorio deja la letra roja muerta el resto de la sesión mientras `hasRedLetterData`
  mantiene el interruptor habilitado. **Es preexistente**, no lo introdujo este diff — pero
  con la trampa del **404 sin cabecera CORS** de GitHub Pages ya documentada, es más fácil de
  disparar de lo que parece.
- El piso antivacío de `R9-66` es de **cero**, no de «parecido a la vez pasada» (ver arriba).
- Óxido de documentación: el encabezado de `redLetterTextWeb.test.ts` todavía habla de
  `redLetterByKey`/`loadPromise`, que ya no existen.

---

## La lección de método de esta sesión

Las cuatro anteriores encontraron defectos en los **arreglos**. Esta los encontró en las
**compuertas de los arreglos** — y las dos peores (`R9-66`, `R9-67`) son la misma forma:

> una verificación cuyo cuerpo entero es un bucle **pasa cuando no hay nada que recorrer**, y
> lo hace imprimiendo un mensaje de éxito.

`verifyRedLetterAlignment` decía «ALL slices non-blank and in-range» sobre cero spans. El
escáner de paridad comparaba contra un conjunto vacío y no encontraba nada que faltara. En los
dos casos el verde era literalmente cierto y completamente vacío.

**El antídoto cabe en una pregunta:** _¿qué entrada hace que esta comprobación no ejecute
ninguna aserción?_ Si esa entrada es alcanzable, hace falta un piso. Y el piso necesita su
propio control, o se convierte en la comprobación entera.

Corolario, de `R9-67`: **un comentario que dice «verificado que hoy nadie hace X; si alguien
empieza, arréglalo» no es una compuerta, es una nota.** O lo detecta algo, o no existe.
