# A6 — Paridad web/native

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 3 (2026-09-03) · Estado
> **🐛 BUG** (2 P0 + 1 P1: `R9-13`, `R9-14`, `R9-15`) · **los 3 ARREGLADOS en la sesión 12
> (2026-09-15)** — ver cada bloque «Arreglo» más abajo y las entradas de `BUGS.md`
>
> Revisado por un agente en worktree; **el orquestador re-verificó a mano las
> afirmaciones que sostienen `R9-13`** (ver "Verificación independiente" abajo) antes de
> aceptarlas, con dos correcciones de detalle al informe original.

## Alcance

Las 14 variantes `.web.*` bajo `src/` y `app/`:

| Archivo web                                             | Hermana nativa                     |
| ------------------------------------------------------- | ---------------------------------- |
| `app/_layout.web.tsx`                                   | `app/_layout.tsx`                  |
| `app/(tabs)/_layout.web.tsx`                            | `app/(tabs)/_layout.tsx`           |
| `app/(tabs)/index.web.tsx`                              | `app/(tabs)/index.tsx`             |
| `app/(tabs)/settings.web.tsx`                           | `app/(tabs)/settings.tsx`          |
| `app/(tabs)/chapter/[book].web.tsx`                     | `app/(tabs)/chapter/[book].tsx`    |
| `app/(tabs)/verse/[book]/[chapter].web.tsx`             | ídem nativa                        |
| `src/components/ErrorBoundary.web.tsx`                  | `src/components/ErrorBoundary.tsx` |
| `src/context/PremiumContext.web.tsx`                    | ídem nativa                        |
| `src/context/OfferingSheetContext.web.tsx`              | ídem nativa                        |
| `src/context/MemoryDeckContext.web.tsx`                 | ídem nativa                        |
| `src/features/audio/context/AudioPlayerContext.web.tsx` | ídem nativa                        |
| `src/lib/database/data-loader.web.ts`                   | ídem nativa                        |
| `src/lib/database/nativeSeedAssets.web.ts`              | ídem nativa                        |
| `src/lib/reading/redLetterText.web.ts`                  | ídem nativa                        |

**Por qué esto es P0:** `firebase.json` publica `dist` con un rewrite catch-all
(`"source": "**"` → `/index.html`), así que **toda** ruta de `app/` es alcanzable por URL
directa en el sitio desplegado, aunque la nav web solo ofrezca _Biblia_ y _Ajustes_.
`metro.config.js` no toca `resolver.sourceExts` ni `platforms`, así que rige la resolución
por plataforma de Expo: en el bundle web, un especificador **pelado** resuelve a
`X.web.ts(x)` si existe.

## Cobertura de tests — el mecanismo de fondo

**`jest` NO resuelve las variantes `.web`.** `jest.config.js:2` usa `preset: 'jest-expo'`
con plataforma nativa; no hay `projects` multiplataforma ni `haste.defaultPlatform: 'web'`.
Un import pelado dentro de un test **siempre carga el archivo NATIVO**.

Lo confirman los propios tests: `__tests__/webStubProviders.test.tsx:516-532` tiene que
hacer `jest.mock('@context/PremiumContext', () => require('.../PremiumContext.web'))` —
cuatro redirecciones a mano — documentado como "la misma sustitución que Metro hace
automáticamente al bundlear para web".

**Consecuencia:** la sustitución por plataforma solo está cubierta donde alguien la
escribió a mano. Cualquier par web/native sin redirección explícita queda sin cobertura
real, y el test **pasa usando la implementación nativa** — falsa confianza. Es exactamente
lo que dejó pasar `R9-13`.

---

## 🐛 `R9-13` (P0, severidad **alta**) — el lector web crashea en el primer render: `hasRedLetterData is not a function`

**Archivos:** `src/components/reading/ReaderPreferencesSheet.tsx:56` (import) y `:121`
(llamada) · `src/lib/reading/redLetterText.web.ts` · `app/(tabs)/verse/[book]/[chapter].web.tsx:358`

`ReaderPreferencesSheet.tsx:56` importa `hasRedLetterData` del especificador **pelado**
`@lib/reading/redLetterText`. En el bundle web Metro resuelve a `redLetterText.web.ts`,
que **no exporta ese símbolo**; el binding queda `undefined` y la llamada de `:121`
explota:

```ts
const isRedLetterAvailable =
  !!selectedVersion && hasRedLetterData(selectedVersion.id);
```

**Por qué nada lo mitiga:**

- `:121` está en el **cuerpo del componente**, antes de cualquier retorno temprano. El
  prop `visible` solo controla el `<Modal visible={visible}>` interno, así que el cuerpo
  corre **en cada render aunque la hoja esté cerrada**.
- El cortocircuito `!!selectedVersion &&` no salva: `app/_layout.web.tsx:294` **sí** monta
  `BibleVersionProvider` envolviendo el stack, así que `selectedVersion` está definido en
  web.
- `chapter].web.tsx:358` renderiza la hoja **incondicionalmente** en el return principal.

**Escenario de fallo:** un visitante entra al sitio → "Biblia" → Juan → capítulo 3. Monta
`verse/[book]/[chapter].web.tsx`, renderiza `ReaderPreferencesSheet`, y en el primer render
lanza `TypeError: (0, _redLetterText.hasRedLetterData) is not a function`. Como
`ErrorBoundary` envuelve todo el `<Stack>` (`app/_layout.web.tsx:302`) y no hay boundary
por ruta, **cae la app web entera**, con recuperación solo por `window.location.reload()`
(`ErrorBoundary.web.tsx:82`) — que vuelve a caer al reintentar la misma lectura.

**Es una regresión fechada, no un defecto de origen** (`git log -S`): `a0782a6`
(2026-07-23) crea `redLetterText.web.ts` cuando el símbolo no existía; `eea936b`
(2026-08-04) cablea la hoja en el lector web; **`d753a6e` (2026-08-18)** agrega
`hasRedLetterData` al componente compartido **y solo al archivo nativo**.

Invisible para las dos compuertas: `tsc` no tiene conciencia de plataforma y resuelve el
especificador pelado contra el **nativo** (trampa ya documentada en
`app/_layout.web.tsx:7-11`), y jest corre con preset nativo.

**Arreglo — ✅ APLICADO en la sesión 12, y en las dos mitades que pedía esta línea.**
`redLetterText.web.ts` exporta `hasRedLetterData` sobre un `Set` de módulo (`['WEB']`),
síncrono y **sin depender de que el pack haya llegado**, que es justo lo que este párrafo
anticipaba: si dependiera, el interruptor de la hoja pasaría de deshabilitado a habilitado un
instante después de abrirla. Solo `WEB` —no `RVR1960`— porque `scripts/build-web-packs.js`
emite un único pack, y es el mismo gate que el lector web ya aplicaba por su cuenta
(`chapter].web.tsx:110`).

Y la segunda mitad, la que mata la clase: `__tests__/webNativeModuleParity.test.ts` compara
los **14 pares**. Con una corrección respecto a lo que decía esta línea: **no** por
`Object.keys(require(...))`, porque la mitad de esos archivos son pantallas cuyo grafo de
imports arrastra dependencias nativas y un chequeo por `require` necesitaría un muro de mocks
por par. Es un escaneo de **texto fuente** (comprobado antes de escribirlo que ningún par usa
`export {x} from` ni `export *`, las formas que un regex no vería). Y la invariante es de una
sola dirección, **`nativo ⊆ web`**: un símbolo del nativo ausente en el web es un crash,
porque el especificador pelado se convierte en el archivo web al bundlear; un extra web-only
(`loadRedLetterSpans`, `clearWebStorageForLockRecovery`) solo se alcanza por el `.web`
explícito, que el código nativo nunca escribe. Lista blanca de una entrada,
documentada (`heroNudgeRoute`), con prueba anti-pudrición.

### Verificación independiente del orquestador

Re-comprobado a mano, no aceptado del informe del agente:

- `redLetterText.web.ts` exporta `RedLetterRun`, `loadRedLetterSpans`, `getRedLetterSpans`,
  `mergeRedLetterSpans` — **no** `hasRedLetterData`. El nativo sí lo exporta (`:71`). ✅
- `ReaderPreferencesSheet.tsx:56` importa del pelado; `:121` llama en el cuerpo. ✅
- `BibleVersionProvider` montado en `_layout.web.tsx:294`. ✅
- `d753a6e` es el commit que introdujo el import. ✅

**Dos correcciones al informe original:**

1. El agente dijo que `selectedVersion` es no-anulable por el tipo de `useBibleVersion`.
   En realidad el call site es `useBibleVersionOptional() ?? {}` (`:119`), así que **sí**
   podría ser `undefined` sin provider. La conclusión se sostiene igual, pero por otra vía:
   el provider **está** montado en web.
2. El agente listó `app/features/dictionary/[slug].tsx:750` como "segunda ruta que importa
   el símbolo". No lo importa: **renderiza la hoja**. El efecto es el mismo (crashea
   también), pero el radio de impacto correcto es **quien renderiza
   `ReaderPreferencesSheet`**: el lector nativo (`chapter].tsx:3630`, no afectado), el
   lector web (`chapter].web.tsx:358`) y la entrada de diccionario
   (`dictionary/[slug].tsx:750`, sin variante `.web` → el mismo archivo en web).
   **En web caen las dos pantallas.**

---

## 🐛 `R9-14` (P0 en código, impacto **medio**) — 7 rutas web-alcanzables lanzan "must be used within a …Provider"

**Raíz:** `app/_layout.web.tsx:288-318`. La auditoría T21 identificó bien que las rutas de
`app/features/**` son alcanzables por URL bajo el rewrite catch-all, y stubeó
`usePremium`/`useOfferingSheet`/`useAudioPlayer`/`useMemoryDeck`. Pero el árbol web
**tampoco monta** `AuthProvider`, `ReadingProgressProvider`, `ReadingPlanProgressProvider`,
`CustomPlansProvider`, `TogetherProvider` ni `DonationSheetProvider`, y esos hooks
**también lanzan** cuando falta el contexto.

| Ruta (sin `.web` sibling)                 | Línea    | Hook que lanza                                                  |
| ----------------------------------------- | -------- | --------------------------------------------------------------- |
| `app/features/badges.tsx`                 | :7       | `useAuth()`                                                     |
| `app/features/version-comparison.tsx`     | :9       | `useAuth()`                                                     |
| `app/features/reading-insights/index.tsx` | :114     | `useReadingProgress()`                                          |
| `app/(tabs)/plan/[id].tsx`                | :87-89   | `useReadingPlanProgress()`, `useTogether()`, `useCustomPlans()` |
| `app/features/plan-builder/index.tsx`     | :118-119 | `useCustomPlans()`, `useReadingPlanProgress()`                  |
| `app/features/timeline.tsx`               | :84      | `useReadingPlanProgress()`                                      |
| `app/features/together/index.tsx`         | :106-108 | `useTogether()`, `useCustomPlans()`, `useReadingPlanProgress()` |

**Escenario:** el repo es público y el sitio sirve un rewrite catch-all; un crawler, un
link compartido o un bookmark pega `https://<sitio>/features/timeline` → lanza
`Error: useReadingPlanProgress must be used within ReadingPlanProgressProvider` → el
`ErrorBoundary` global lo atrapa y **toda la SPA queda en pantalla de error**. Idéntico al
incidente que motivó T21.

**Impacto medio, no alto:** ninguna de estas rutas está enlazada desde la nav web, así que
llegar requiere URL directa — el mismo perfil que T21 ya trató como P0.

**Arreglo — ✅ APLICADA la opción (b) en la sesión 12; la (a) sigue abierta, a propósito.**

La (b), la estructural, es un `ErrorBoundary` **por ruta** en los dos niveles del árbol web,
porque las 7 rutas viven en los dos: `screenLayout` del `Stack` raíz (`_layout.web.tsx`)
cubre las 6 de `app/features/**`, y envolver el `<Slot />` de `(tabs)/_layout.web.tsx`
—**solo el Slot**, dejando la barra de navegación FUERA, que es la única salida que le queda
al usuario— cubre la séptima, `(tabs)/plan/[id].tsx`. Se prefirió a un
`app/features/_layout.web.tsx`, que habría metido un navegador anidado solo en web y no
habría alcanzado a `plan/[id]`. La `key={pathname}` del segundo es portante y tiene prueba
propia: un boundary de React retiene su error hasta desmontarse y el `Slot` reusa la misma
posición para todas las rutas, así que sin ella una sola URL mala envenenaba el resto de la
sesión.

**Por qué (b) y no (a):** la duda de más abajo dice que el conteo real es ≥ 7 porque solo se
grepearon archivos de ruta. (a) cierra las 7 conocidas; (b) acota la clase entera, incluidas
las que no están en ninguna lista. Y (a) tiene una pregunta de producto dentro —qué ve un
visitante web sin cuenta en `/features/together`— que no es de ingeniería. **Las 7 rutas
siguen sin funcionar en web; ahora fallan localmente en vez de llevarse la SPA.**

---

## 🐛 `R9-15` (P1) — el único test que renderiza el lector web enmascara exactamente `R9-13`

`__tests__/chapterReaderWebFontPicker.test.tsx:41` hace
`jest.mock('@lib/reading/redLetterText.web', …)` — mockea el especificador **`.web`
explícito**, pero el componente bajo prueba importa el **pelado**. Con preset nativo, ese
import carga `redLetterText.ts` (que sí exporta el símbolo) y el mock nunca se aplica.

**Efecto:** el test renderiza `chapter].web` y **pasa en verde** mientras el mismo archivo
crashea en producción web. Es el mecanismo preciso por el que `d753a6e` se mergeó con CI
verde el 2026-08-18.

**Arreglo — ✅ APLICADO en la sesión 12, y ANTES que `R9-13`** para ver el crash de
producción ponerse rojo en la compuerta: con la redirección puesta y el módulo web sin tocar,
las 4 pruebas fallaron con el `TypeError` exacto,
`(0, _redLetterText.hasRedLetterData) is not a function` en `ReaderPreferencesSheet.tsx:121`.

**Una trampa que esta línea no anticipaba y casi deja una prueba en vacío:** el mock del
especificador `.web` era un objeto escrito a mano, así que era ÉL quien definía la superficie
del módulo bajo prueba. Redirigir el pelado a ESE mock habría seguido fallando **después** del
arreglo, y el reflejo obvio —añadirle `hasRedLetterData: jest.fn()`— habría dejado las 4 en
verde sin mirar nunca el archivo real. El mock ahora hace `...jest.requireActual` y solo
stubea las tres funciones de datos, así que la superficie que ve el componente es la del
módulo web de verdad.

---

## ✅ Verificado OK

- **Los 4 stubs de contexto son fail-closed y su API pública coincide con la nativa.**
  `PremiumContext.web.tsx:61-65` fija `isPremium: false` estático y `setPremium` es un
  no-op que advierte; `OfferingSheetContext.web.tsx:38-46` hace `open()` no-op. **No hay
  ninguna vía por la que el build web conceda premium**, ni feature de pago desbloqueada.
- **`R9-9` y `R9-10` (de `A1`) no existen en la variante web y no pueden existir:**
  `PremiumContext.web.tsx` no importa `offeringService` ni `premiumStore`, así que no hay
  dedupe con `lastKnownUnlocked` ni carrera de caché. El valor es una constante de módulo.
  La divergencia es intencional y está documentada (`:23-30`).
- **`MemoryDeckContext.web.tsx` es un stub por decisión de producto, razonada por escrito**
  (`:11-30`): montar el provider real dejaría a un visitante construir un mazo SRS que
  nunca sincroniza y desaparece al limpiar datos del sitio. Fail-closed correcto.
- **`useServices()` sin provider en web es inocuo**: `ServicesContext.tsx:42-58` tiene un
  objeto real como default de `createContext`, así que el `throw` de `:55` es defensivo
  muerto. Las 13 rutas que lo llaman no son un problema.
- **`nativeSeedAssets.web.ts`** devuelve `null` en las 3 funciones y saca ~27.5 MB de `.db`
  del bundle web; los callers ya tratan `null` como no-op. División por extensión bien
  hecha (un `Platform.OS` en runtime no habría podido sacar esos MB del bundle).
- **`Platform.OS === 'web'` vs. resolución por extensión no se contradicen en ningún caso.**
  `app/_layout.web.tsx:12` es el patrón correcto — importa `clearWebStorageForLockRecovery`
  por la ruta `.web` **explícita** justo porque el símbolo no existe en la nativa, y lo
  explica en `:7-11`. Es literalmente el arreglo que le falta a `R9-13`, ya aplicado en
  otro punto del mismo archivo.

## Dudas

- **✅ RESUELTA la duda del despliegue (2026-09-03): `R9-13` NO está en producción, por 5
  días.** El historial de releases de Firebase Hosting (consultado por API con la
  credencial cacheada de `firebase-tools`, patrón de
  `reference_essb-firebase-cli-token-for-rules-api`) da **7 releases, del 2026-07-09 al
  2026-08-13**; el último es **2026-08-13T04:39Z**. La regresión entró en `d753a6e` el
  **2026-08-18** — **5 días después**. Victor estimaba "mes y medio o dos meses"; la
  fecha real es 3 semanas, y el margen real es de 5 días, no de meses.
  **Consecuencia práctica:** el sitio vivo está sano, así que no hay incidente en curso;
  pero el bug está **armado** — el próximo `firebase deploy` publica el crash. Es un
  **bloqueante de release**, no un P0 activo. Arreglarlo antes de volver a desplegar la
  web.
- **✅ RESUELTA en la sesión 12: verificado en un navegador de verdad.** Esta duda decía
  que el mecanismo de `R9-13` era solo análisis estático. Ya no: `npx expo export --platform
web` + un servidor estático sobre `dist/` → Génesis 1 **renderiza**, la hoja de
  preferencias **abre entera**, el interruptor «Words of Christ» sale **habilitado** (el
  valor correcto para `WEB`), y la consola no trae `is not a function` ni error de boundary.
  El bundle además confirma la resolución por plataforma que sostenía el diagnóstico: trae
  `loadRedLetterSpans` y `web-red-letter.json`, y **no** trae
  `redLetterByVersion`/`buildSpanMap`/`RVR1960_RED_LETTER`, o sea que el especificador pelado
  resolvió al `.web`.
  **Dos cosas que solo se ven haciendo esto:**
  1. El bundle web **sí incluye** `(tabs)/verse/[book]/[chapter].tsx`, el archivo NATIVO,
     además del `.web`. No es un hallazgo: `getRoutesCore.js:538-566` da especificidad 2 al
     `.web.tsx` y 0 al pelado, así que la ruta registrada es la web y el módulo nativo nunca
     se evalúa. Queda dicho para que nadie lo vuelva a investigar — y porque **dentro de ese
     código muerto hay una llamada a `getRedLetterSpans` con 4 argumentos contra la firma
     web de 3**, que parece un bug y no lo es.
  2. Recargar la página con el worker de SQLite vivo dispara el bloqueo de OPFS conocido
     (`NoModificationAllowedError`). Es la clase que `isStorageLockError` ya trata; con un
     `http.server` de python el botón «Clear data & reload» a veces no basta. Si vas a repetir
     esta verificación, **navegá SIEMPRE dentro de la SPA** — sin rewrite catch-all, una URL
     profunda da 404 y volver deja el lock tomado.
- **`R9-14` puede quedarse corto.** Solo se grepearon los hooks que lanzan en los
  **archivos de ruta** de `app/`. Un componente de `src/` que llame `useAuth()` y sea
  renderizado por una ruta web-alcanzable produce el mismo crash sin salir en la tabla. El
  conteo real es **≥ 7**.
- **No se auditaron en profundidad las 4 pantallas `.web.tsx` de `(tabs)`** como pantallas,
  solo en lo que toca a paridad de módulos.
- **Cosmético, no es hallazgo:** en web el usuario ve CTAs de desbloqueo premium cuyo
  `open()` es un no-op silencioso (`OfferingSheetContext.web.tsx:38-42`). Es fail-closed y
  el archivo lo declara decisión de producto pendiente (`:13-15`). Anotado por si al abrir
  la web al público conviene ocultarlas en vez de mostrarlas muertas.
