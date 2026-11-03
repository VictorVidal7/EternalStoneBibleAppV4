# A26 — Navegación y `BackHandler` (`useBackHandlerStep`, layouts)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 123 (2026-11-03, sin agentes) · Estado
> **🐛 BUG**
>
> **Resultado:** 3 hallazgos (`R9-457` P2, `R9-458` y `R9-459` P3), ninguno P0. El hook y sus diez usos están
> bien, y todas las hojas son `Modal` con `onRequestClose` que se cierran antes de navegar. Lo que falla es lo
> que queda DEBAJO de una pantalla: un enlace compartido abierto en frío no tiene nada debajo (la flecha no
> hace nada y el atrás cierra la app); la historia de pestañas pierde la lectura en una ida y vuelta lector →
> Estudio → lector; y la historia de Niños es la única pantalla de pasos sin `useBackHandlerStep`.
>
> **Cómo se midió:** con la navegación REAL de expo-router 57 (`renderRouter` de `expo-router/testing-library`,
> el `StackRouter` y el `TabRouter` vendorizados), los layouts de la app reproducidos (Stack raíz con `(tabs)`,
> `Tabs` con `backBehavior="history"`, las ocultas con `href: null`) y el atrás del sistema despachado como en
> Android: los listeners de `hardwareBackPress` del último al primero (el del contenedor,
> `fork/useBackButton.native.js`, y los de las pantallas); si ninguno consume, `exitApp`. En jest el
> `BackHandler` es el de iOS (no guarda nada): la sonda espía `addEventListener`, como
> `quizExitConfirm.test.tsx`. Tres sondas con `_scratch/S116-correr.cjs.txt`: `S123-navLayout.test.tsx.txt`
> (9 pruebas), `S123-compartidoAtras.test.tsx.txt` (la pantalla real del estudio compartido, 3) y
> `S123-ninosAtras.test.tsx.txt` (la historia de Niños real, 2).

## El área

`src/hooks/useBackHandlerStep.ts` (suscribe en el foco con `useFocusEffect`, lee el `onBack` de un ref) y sus
diez usos: `constellation.tsx:328`, `reference-chain.tsx:190`, el lector (`[chapter].tsx:1287`, la pila de
saltos), `guided.tsx:84`, `lectio.tsx:359`, `prayer/acts.tsx:150`, `prayer/scripture/[passageId].tsx:166`,
`prophecies/index.tsx:351`, `quiz/index.tsx:304` y `OnboardingScreen.tsx:91`. Los layouts: `app/_layout.tsx`
(`RootStack`, `:119-130`: un solo `Stack.Screen`, sin `unstable_settings`), `app/(tabs)/_layout.tsx`
(`backBehavior="history"`, `:21-28`). Lo ya cubierto, no re-derivado: `onboardingBackHandler`,
`propheticThreadBackAndHeader`, `quizExitConfirm`, `guidedDevotionNav` (la entrada a lectio con `replace`),
`audioPausedNavigation`, `chapterNavigation`. Ninguna fila anterior (`A12`..`A25`) anotó nada «(fila A26)».

`R9-57` (¿gana el `BackHandler` del `Modal` sobre el `useBackHandlerStep` del lector?) es de dispositivo
(Modo C): se cita, no se re-mide.

## Hallazgos

**`R9-457` (P2): un enlace compartido abierto en frío deja su pantalla sin nada debajo: la flecha no hace nada y
el atrás del sistema cierra la app.**

- Las tres pantallas a las que llega un enlace real (`bundle.ts:483-543`: `features/together`,
  `features/study-shared`, `features/devotional-shared`, por App Link vía `+native-intent.tsx` o por
  `eternalbible://`) llaman `router.back()` sin guarda: `study-shared/index.tsx:291` y `:426`,
  `devotional-shared/index.tsx:187` y `:240`, `together/index.tsx:251`. La guarda existe en otros ocho sitios
  desde `dbd9a2f` («A deep link straight into this screen leaves no back-stack entry»): `journeys/index.tsx:82`,
  `journeys/[routeId].tsx:190`, `kids/index.tsx:118`, `kids/plan.tsx:117`, `kids/[storyId].tsx:175`,
  `explore-all/index.tsx:201`, `prayer/scripture/index.tsx:51`, `prayer/scripture/[passageId].tsx:154`.
- La raíz: `app/_layout.tsx` no exporta `unstable_settings = {initialRouteName: '(tabs)'}`, así que un enlace en
  frío arma la pila raíz con UNA ruta. En producción `onUnhandledAction` no existe
  (`expo-router/build/ExpoRoot.js:151-153`, solo en dev): el `GO_BACK` se descarta en silencio.
- **Repro:** alguien comparte un estudio de la Mesa por WhatsApp; con la app cerrada, el destinatario toca el
  enlace: se abre el estudio. La flecha de la cabecera no hace nada; el atrás del sistema cierra la app. Para
  llegar a Home hay que volver a abrirla desde el lanzador. Igual con un calendario devocional y con una
  invitación a un plan (antes de unirse; el error de «enlace inválido» también).
- **Sonda:** `S123-compartidoAtras`, la pantalla real con un enlace real (`makeStudyBundle` +
  `encodeBundleParam`): en frío `router.canGoBack()` da `false` y la flecha lanza «The action 'GO_BACK' was not
  handled by any navigator» (dev) y la ruta no cambia. Control: abierta en caliente desde Home, la flecha vuelve
  a `/`; la receta de `dbd9a2f` en frío lleva a `/`. `S123-navLayout`, pruebas 3-5: en frío, el atrás del sistema
  sobre el lector, la Mesa y `together → replace study-shared` llega a `exitApp`; controles 1-2: en caliente, a
  Home. Control de la propuesta (prueba 8): con `initialRouteName: '(tabs)'`, en frío la Mesa vuelve a Home.
- **P2** (las landings de enlaces compartidos son P2, charter §2): es la primera impresión de quien recibe un
  estudio. **Propuesta (sin escribir):** `unstable_settings.initialRouteName` en `app/_layout.tsx` (arregla la
  flecha y el atrás de las pantallas de la pila raíz), y la guarda de `dbd9a2f` en los cinco `router.back()`.
  Ojo al medir el arreglo: un enlace en frío al LECTOR (dentro de `(tabs)`) sigue saliendo con
  `initialRouteName`, porque `backBehavior="history"` arranca la historia solo con la pestaña actual
  (`TabRouter.js:52-54`); hoy nada emite enlaces al lector.

**`R9-458` (P3): una ida y vuelta lector → Estudio → lector pierde la lectura de partida: el atrás salta de
Estudio a Home.**

- `app/(tabs)/_layout.tsx:21-28` promete que «the journey between them is tracked here», pero con
  `backBehavior="history"` cada pestaña aparece UNA vez en la historia (`TabRouter.js:63-66`, «Remove the
  existing key from the history to de-duplicate it»), y el lector es una sola ruta cuyos params se pisan.
- **Repro:** en el lector, Juan 3 → tocar un versículo → «Referencias» → «Modo estudio»
  (`CrossReferencesSheet.tsx:174-178`) → tocar una conexión (`study.tsx:247-250`, o «Cristo en este pasaje»,
  `:499-501`): el lector muestra Romanos 8. Atrás: Estudio. Atrás: Home, no Juan 3. Igual desde la cadena de
  referencias, la constelación y el estudio de palabra (todas pestañas ocultas que abren el lector con `push`).
- **Segundo camino, por lectura:** la pila de saltos del lector (los paralelos, `[chapter].tsx:1266-1296`) se
  vacía en CADA blur (`:1281-1284`), también al abrir una pestaña oculta desde el propio lector: Juan 3 → paralelo
  a Romanos 5 → estudio de palabra → atrás (Romanos 5) → atrás: Home, no Juan 3.
- **Sonda:** `S123-navLayout`, prueba 6: el camino Juan 3 → Estudio → Romanos 8 da, atrás tres veces,
  `['/features/study?…', '/', 'exitApp']`. Control de la propuesta (prueba 7): el mismo camino con
  `backBehavior="fullHistory"` (que guarda los params en la historia, `TabRouter.js:67-83`, `:269-275`) da
  `['/features/study?…', '/verse/John/3', '/', 'exitApp']`.
- **Propuesta (sin escribir):** `fullHistory`, midiendo antes cómo convive con la pila de saltos (que duplica
  lo que `fullHistory` ya guardaría) y con el atrás entre pestañas visibles.

**`R9-459` (P3): en una historia de Niños, el atrás del sistema sale de la historia en vez de volver una
escena, y al volver arranca de la primera.**

- `app/features/kids/[storyId].tsx` es la única pantalla de pasos con «Anterior»/«Siguiente» en pantalla
  (`:216-231`) y quiz (`:466`) que no llama a `useBackHandlerStep`; sus hermanas sí (`lectio.tsx:356-370`, con
  el mismo par de botones). La escena vive en `useState(0)` (`:98`): salir la pierde. A mitad del quiz, las
  respuestas también (por lectura: viven en `KidsQuizPanel`).
- **Repro:** Niños → «La Creación» → «Siguiente» tres veces (escena 4 de 7) → atrás del sistema: la lista de
  historias. Abrirla otra vez: escena 1.
- **Sonda:** `S123-ninosAtras`: en la escena 4, el atrás lo consume el navegador y la ruta pasa a
  `/features/kids`; al reabrir, `markKidsSceneSeen` recibe la escena 0. Control: «Anterior» en pantalla pasa
  de la 4 a la 3.
- **Propuesta (sin escribir):** `useBackHandlerStep` como en `lectio` (quiz → última escena; escena n → n−1;
  la primera y «done», pop).

## Revisado sin hallazgo

- **El hook:** suscribe en el foco y se quita en el blur; con el orden LIFO del `BackHandler`, el de la pantalla
  va antes que el del contenedor. Los diez `onBack` retroceden lo que dicen; `onboarding`, `prophecies` y `quiz`
  ya tienen pruebas de su atrás.
- **Las hojas:** los 61 `<Modal` de `app/` y `src/` tienen `onRequestClose` (los dos que el barrido dio «sin»
  eran comentarios); `@gorhom/bottom-sheet` está instalado y no se usa (`OfferingSheet.tsx:12`); el modo
  inmersivo va en un `Modal` con `onRequestClose` (`[chapter].tsx:3618-3625`). Las hojas que navegan se cierran
  antes (`CrossReferencesSheet.tsx:166-216`, `OriginalLanguagesSheet.tsx:191`, `NoteEditorModal.tsx:157`,
  `FunctionalidadesSettings.tsx:78`): ninguna queda abierta sobre la pantalla siguiente.
- `together → replace /plan/<id>` en caliente: el atrás desde el plan vuelve a Home (`S123-navLayout`, prueba 9).
- **Aceptado, sin número:** `memory/practice.tsx` es de un solo sentido (las notas se guardan por tarjeta) y
  `journey/index.tsx` es un recap en diapositivas: salir con atrás es lo esperable. Desde el final de
  `acts.tsx` y de `scripture/[passageId].tsx`, el atrás vuelve al último movimiento (`lectio` hace pop en el
  final); volver a terminar suma otra oración en `recordPrayer` (`prayerLog.ts:85`), pero solo se usan los DÍAS
  (`prayerStreak`, `:105-118`): sin daño.

## Sin medir

- `guided.tsx:84-90` con `resolving`: el atrás vuelve a `choose`, pero el `void (async …)` de `:99-133` sigue y
  termina en `setPhase('reveal')` (la regla de la 118, lo que termina tarde). La ventana es la de
  `bibleDB.initialize` + `getVerse` (milisegundos en caliente); no se midió en frío.
- `R9-57` (el `Modal` contra `useBackHandlerStep` del lector): Modo C.

## Cruce con las filas vecinas

- `A27` (deep links) hereda la raíz de `R9-457`: las pantallas por enlace, sin nada debajo. Lo de `detail/A13`
  «Para la fila A27» (el libro sin reconocer y el capítulo `abc`) sigue para esa fila.
- Ningún «sin medir» de `A13`..`A25` toca el atrás.
