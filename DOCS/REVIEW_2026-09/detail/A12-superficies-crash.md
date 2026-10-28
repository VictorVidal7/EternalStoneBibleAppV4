# A12 — Superficies de crash: error boundaries, promesas sin catch

> Modo A (auditoría estática) · Prioridad **P0** · Sesiones 6 (2026-09-14) y 114 (2026-10-28) · Estado
> **🐛 BUG — CERRADA** (los tres hilos, en la sesión 114)
>
> **Resultado:** 8 hallazgos (`R9-410`..`R9-417`), **ninguno P0**. El mecanismo que buscaba la sesión 6
> existe: un provider por encima del boundary lanza, y en release eso cierra la app en cada arranque
> (`R9-410`). Pero el único dato que lo dispara llega con un respaldo fabricado. Lo demás, «no alcanzable»
> con su porqué (abajo), o «sin medir».
>
> **Cómo se midió (la 114):** 10 agentes `fork` en worktree sobre `6404e57`, que solo midieron, una mirada
> cada uno (las reglas en `_scratch/S114-agentes-reglas.md.txt`). Las sondas, pruebas de jest guardadas como
> `.txt` y corridas con `_scratch/S114-correr.cjs.txt`, que las copia a `__tests__/`, corre jest y las borra.
> Copias en `_scratch/S114-sondas-agente-N/` (informe `S114-aN-informe.md.txt`). Cada sonda se re-midió en el
> principal y dio lo mismo.

## Lo que había en la sesión 6

Tres observaciones verificadas por `grep`, sin el escenario de fallo alcanzable que pide el charter (§3):

1. el `ErrorBoundary` es el wrapper más interno de los dos layouts;
2. cero manejadores globales de error;
3. el `ErrorBoundary` nativo no tiene ni una prueba.

## Hilo 1 — un provider que lance por encima del boundary

**Hoy:** en nativo, el boundary cuelga por dentro de **19 providers** (`app/_layout.tsx:429-469`, el boundary
en `:448`). En web, por dentro de **11** (`app/_layout.web.tsx:306-330`, en `:317`), más un boundary por
pantalla (`:237`, `R9-14`).

**Cierra con `R9-410`** (P2): `ThemeProvider` valida el tema guardado con `in`, que acepta `constructor`,
`toString`, `__proto__` y `hasOwnProperty`, y lanza en el render. El import de respaldo escribe cualquier
string ahí. También tiene que ver **`R9-411`** (P2): por debajo del boundary, el import escribe el progreso de
planes sin validar, y con `null` Home cae en bucle.

**No alcanzable** (cada uno con sonda salvo donde dice «por lectura»):

- **`CustomPlansContext` y `ReadingPlanProgressContext`** (agente 1, `S114-a1-planes`):
  - los `JSON.parse` van en efectos async con `try`, y el render del provider no indexa los datos;
  - `@custom_plans` roto tumba Home, pero solo lo escribe su contexto, y no viaja en el respaldo (`R9-30`).
- **`ReadingProgressContext`, `MemoryDeckContext` nativo, `TogetherContext`, `FavoritesContext`** (agente 2,
  `S114-a2-formas`, 22/22): todos los parse van en `try`, y `canonicalizeProgressMap` y el filtro de cartas
  validan la forma.
  - `lastReadPosition` no tiene consumidores.
  - `@together_*` solo lo escribe su `persist`.
  - Favoritos sale de SQLite (por lectura).
- **`LanguageProvider`, el modo y el alto contraste de `ThemeProvider`, `AccessibilityPreferences`,
  `BibleVersion`, `ReaderPreferences`** (agentes 3 y 5): igualdad estricta, búsqueda en catálogo o saneado
  dentro del `try`.
  - Sin provider, `useLanguage` devuelve un contexto por defecto, así que el fallback del boundary no puede
    lanzar por el idioma.
- **`RootLayout` y los providers de servicios** (agente 4, `S114-a4-provSobre`): `AppContent` está dentro
  del boundary.
  - Los singletons no tienen constructor que abra nada, y `new SyncEngine()` solo crea mapas.
  - `getCachedEntitlement` atrapa todo.
  - **`AudioPlayerProvider`** sí lanza por encima del boundary con `@audio_preferences = null`: el valor se
    lee dentro de un `setState(prev => …)`, que React corre en el render, fuera del `try` (`:359-371`). Pero
    solo `savePreferences` escribe esa clave, siempre con un objeto, y no viaja en el respaldo ni en sync.
  - **Ojo para el arreglo:** un `JSON.parse` dentro de un `try` no protege si el valor se lee en un updater.
- **El árbol web** (agente 5, `S114-a5-arbolweb`, 12/13; el que cae es del hilo 2): ningún provider lanza con
  un dato guardado. En web, `R9-410` no tiene camino: no hay import de respaldo.

**Estructural, por lectura** (agente 4): `OfferingSheet`, `DonationSheet`, `Toast` y el `ConfirmDialog` de
`AuthProvider` se dibujan como hermanos del árbol, fuera del boundary. No hay un throw alcanzable en ellos:
solo usan `priceString` y textos estáticos.

## Hilo 2 — promesas flotantes y manejadores globales

**El runtime en release** (agente 7, `S114-a7-runtime`, por lectura de `node_modules` más una sonda):

- **Corrige la sesión 6:** el código de la app no instala manejadores, pero las librerías instalan tres,
  encadenados: RN, expo-router (el splash) y Crashlytics, este último solo desde el primer `logger.*`
  (`app/_layout.tsx:232`).
- **Un throw de render sin boundary:** va directo a `ExceptionsManager`, como fatal, y la app se cierra.
  Ninguno de los tres manejadores lo ve.
- **Un error síncrono en un handler de evento o en un timer:** fatal, y la app se cierra. Crashlytics lo
  registra.
- **Una promesa rechazada sin catch:** en release no se ve nada, ni en la app ni en Crashlytics: `R9-417`.
- **Sin medir:** `HermesInternal.hasPromise()` en el build real, y el fatal nativo en Crashlytics (emulador).

**El inventario** (agentes 6, 8 y 9; los listados con `file:line`, en sus copias):

- **`src/context`, `src/hooks` y `app/_layout*`** (agente 6, `S114-a6-inventario2.out.txt`): 6 `.then` sin
  `.catch`, 7 IIFE `async` sin `try` y 27 `void x()`. Casi todo tiene su `catch` dentro de lo que llama; la
  única flotante real que rechaza es la de `ReaderPreferences`.
  - **Medido:** `R9-413` y `R9-414` (la forma de `R9-267`: una lectura que falla al montar y una escritura
    que pisa el disco con lo que hay en memoria).
- **`src/services` y `src/lib`** (agente 8): ninguna promesa flotante que pueda rechazar. Todo lo de sync,
  respaldo, auth, borrado de cuenta y ofrenda se espera y le llega al llamador.
  - Las 24 `void` de `SyncEngine` atrapan por dentro (por lectura).
  - En `src/features`: **`R9-416`**.
- **`app/**` y `src/components/**`** (agente 9, `S114-a9-inventario.out.txt`):
  - `app`: 24 `.then` sin `.catch`, 83 `async` sin `try` y 61 `void`;
  - `src/components`: 5, 37 y 13.
  - Dinero (ofrenda, donación, gift-code): no alcanzable, porque todo lo que exporta `offeringService.ts`
    atrapa adentro. El `fetch` del canje sin timeout ya es `R9-40`.
  - Respaldo y cuenta: cubiertos.
  - **Medido:** `R9-415`.
- **La Mesa** (`src/**/prep*`, `app/features/prep/**`): solo anotada (`R9-52`, `R9-330`: Pendiente de Victor).

**Sin medir** (candidatos, con su `file:line` en las copias):

- favoritos: `FavoritesContext.tsx:344-349` y `:370-376` re-lanzan, y nadie atrapa en
  `verse/[book]/[chapter].tsx:1660`, `:1687`, `:1711`, `(tabs)/index.tsx:1020`, `memory/index.tsx:116` y
  `practice.tsx:165`;
- los `confirmDelete` de `highlights.tsx:167` y `notes.tsx:84`;
- oración: `prayerStore.ts:109-127` devuelve la lista vieja si `setItem` falla, y la pantalla avisa
  «guardado»; es la forma de `R9-52`, fuera de la Mesa;
- `NotificationsSettings.tsx`: la hora nueva en pantalla con las alarmas en la vieja si la programación falla;
- `ServicesContext.tsx:121-128`: si la base no inicializa, los servicios quedan en `null` toda la sesión;
- las `void` de audio (`AudioPlayerContext.tsx:1133`, `useVoices.ts:117`, `AudioQueueSheet.tsx:174`);
- `useContextualHint.ts:56`, `useNarratedWalkthrough.ts:179`;
- el `getFirestore()` antes del `try` en `maybeWriteMemoryStatsSummary` y `seedMemoryStatsFloorIfFresh`;
- cartas y favoritos remotos sin `text`, que entran sin validar (`MemoryDeckContext.tsx:410-431`,
  `FavoritesContext.tsx:460-467`), por debajo del boundary.

## Hilo 3 — el `ErrorBoundary` nativo

**Cierra con `R9-412`** (P2; sondas `S114-a10-reset` 3/3 y `S114-a10-router` 5/5, esta con expo-router real):

- «Reintentar» es un bucle sin salida ante un error determinista: un dato malo en un provider de arriba, o
  una pantalla que lanza abierta al arrancar o por enlace.
- Recupera cuando el error es pasajero o cuando la pantalla se abrió con `push` (pero se pierde el
  historial).
- Nada agarra un error por encima del layout raíz: expo-router solo envuelve una ruta que exporta
  `ErrorBoundary`, y `app/_layout.tsx` no lo exporta.
- En nativo no hay boundary por pantalla; la web tiene tres capas.

**No alcanzable:** que el fallback mismo lance. No depende de ningún provider (medido): por eso el mismo
componente sirve como boundary externo.

**El 2.º boundary externo, como propuesta** (en `R9-412`, sin código): exportar `ErrorBoundary` desde
`app/_layout.tsx` con un fallback sin providers, y en el fallback nativo «Volver al inicio» y «borrar datos».

## Por qué ninguno es P0

El estándar pide un escenario de fallo alcanzable. Los únicos disparadores medidos son:

- un respaldo fabricado o editado (`R9-410`, `R9-411`);
- un fallo de E/S de AsyncStorage o de SQLite (`R9-413`..`R9-415`).

**Si Victor da por alcanzable un respaldo ajeno o corrupto, `R9-410` y `R9-412` suben juntos:** la app no
arrancaría sin borrar los datos. Los arreglos propuestos son baratos y van juntos:

- la guarda `hasOwnProperty`, en `useTheme` y en el import;
- `isPlainObject` en las dos secciones del import;
- el boundary exportado.
