# A35 — Niños (`app/features/kids/`, `src/features/kids/`)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 128 (2026-11-04, chat nuevo; con 8 agentes a
> pedido de Victor, 3 en esta fila y uno en la frontera con `A36`) · Estado **🐛 BUG** (cerrada en la 128)

> **Resultado:** 7 hallazgos, todos P3, ninguno P0: `R9-489` («Ver versículo» muestra solo el primer versículo de
> la escena, sin referencia, a veces media frase), `R9-490` (el buen samaritano, escena 1: una pregunta que el
> maestro de la ley no hizo), `R9-491` (un distractor del quiz de Daniel que en español el texto respalda),
> `R9-492` (dos toques en «Terminar» celebran dos veces la insignia), `R9-493` (el versículo de una escena
> aparece en la siguiente), `R9-494` (la pista de «Escuchar todo» se gasta sin mostrarse) y `R9-495` (una
> historia del hub arranca el reloj del plan, sin forma de reiniciarlo). Una nota suma a `R9-459` (`scenesSeen`
> se escribe y nadie lo lee). Las 55 escenas y las 30 preguntas existen en RVR1960 y en WEB, y la respuesta
> correcta coincide en los dos idiomas.

> **Cómo se midió:** tres agentes (`fork` en worktree, sobre `3473f79`) que solo midieron: el 1, la historia y
> el quiz (`[storyId].tsx` 689 L, `kidsQuiz.ts`, `KidsQuizPanel.tsx`); el 2, el plan y el progreso (`plan.tsx`
> 414 L, `kidsPlan.ts`, `kidsProgress.ts` 193 L, `planPace.ts`); el 3, los datos y la portada
> (`kidsStories.ts` 967 L, `kidsSceneArt.ts` 302 L, `index.tsx` 379 L); el 8 miró la frontera (respaldo,
> cuenta) de las dos filas. Cada sonda de un hallazgo se re-midió igual en el principal (la del plan con
> `TZ=America/Mexico_City`). Informes y sondas en `_scratch/S128-sondas-agente-{1,2,3,8}/`. Lo ya dicho por
> `A26` (`R9-459`, el atrás), `A30` (el `storyId`), `A31`, `__tests__/kidsPlan.test.ts`,
> `__tests__/kidsProgress.test.ts`, `__tests__/kidsQuiz.test.ts`, `__tests__/kidsStories.test.ts` y Fable
> (área 34, ✅) no se re-derivó.

## Hallazgos

- **`R9-489` (P3):** `[storyId].tsx:197-208` pide a la base solo `scene.refs[0]` y `:412-421` lo pinta sin la
  referencia; 23 escenas tienen 2-3 versículos. En el principal, 13 cajas cortadas a media frase en 8 escenas (8
  en RVR1960, 5 en WEB; p. ej. `resurrection-1`, Mt 27:59: «…lo envolvió en una sábana limpia,»); control: las 32
  escenas de un versículo, 0. `daniel-lions-5` muestra 6:21 entero, pero lo que cuenta la escena está en 6:22.
- **`R9-490` (P3, fidelidad):** `src/i18n/translations.ts:6255-6257` (es) y `:12781-12783` (en): «le preguntó
  a Jesús qué debía hacer para amar a su prójimo»; Lc 10:25 (base real) pregunta cómo heredar la vida eterna, y
  el amor al prójimo lo cita él en 10:27. Prosa del relato, no cita; el error está en los dos idiomas.
- **`R9-491` (P3):** `daniel-lions-q1`: el distractor «Nunca dejaba de orar en voz alta» (es) es defendible por
  Dn 6:10 y 6:16, y en inglés la opción dice lo contrario («He never prayed out loud»). La correcta («Tres
  veces») está bien en los dos.
- **`R9-492` (P3):** `src/components/kids/KidsQuizPanel.tsx:70-74`: `advance()` llama a `onFinish` en cada toque;
  el panel sigue montado hasta el `setStage('done')` de `handleQuizFinish` (`[storyId].tsx:234-255`), tras dos
  escrituras en AsyncStorage. Dos toques: dos `unlockAchievement('kids_first_story')` sin serializar (la raíz
  de `R9-446`), la insignia celebrada dos veces.
- **`R9-493` (P3):** `[storyId].tsx:189-214`: `toggleVerse` busca sin comprobar la escena; el efecto de `:114-117`
  limpia al cambiar, pero la respuesta tardía vuelve a escribir, y `:197` no busca de nuevo. Familia de
  `R9-435`/`R9-476` (búsqueda sin `isStale`).
- **`R9-494` (P3, cosmético):** `[storyId].tsx:122-138`: `markListenAllHintSeen()` se guarda antes del
  temporizador de 900 ms; salir antes la gasta sin mostrarla.
- **`R9-495` (P3):** `kidsProgress.ts:164`: `markKidsStoryCompleted` arranca `planStartedAt` con cualquier quiz,
  también desde el hub (los dos empujan `/features/kids/<id>`, `plan.tsx:111-114`); ningún export lo reinicia, y
  con las 10 hechas el plan queda `'complete'` para siempre (`planPace.ts:97-107`).

## Nota a un hallazgo viejo (sin número)

- **`R9-459`:** `markKidsSceneSeen` (`kidsProgress.ts:107-126`) escribe `scenesSeen` en cada escena «para que una
  historia pueda reanudarse» (`:4-5`, `:26-27`), pero nada en `app/` ni `src/` lo lee y la escena arranca en
  `useState(0)` (`[storyId].tsx:98`): la otra mitad del «al reabrir, escena 1», también al salir con la flecha.

## Revisado sin hallazgo

- **Los datos contra la base:** `S128-a3-datosNinos.test.ts.txt`, 4/4: las 55 escenas y las 30 preguntas, cada
  versículo existe en RVR1960 y WEB (la prueba del repo solo miraba el capítulo); control Gn 1:1 y la precondición
  de las dos versiones. El quiz leído entero en es y en (`S128-a3-volcado.txt`): la correcta es la misma opción en
  los dos y concuerda con su `ref`. El rótulo de cada historia, con su pasaje. Los textos «Para enseñar» en
  español, fieles.
- **El arte:** los dos registros de `kidsSceneArt.ts` (`:85`, `:229`) cubren todos los tipos; una escena sin arte
  no compila.
- **La portada:** relee el progreso en cada foco (`index.tsx:63-73`); orden y destinos correctos.
- **El plan:** el día local, medido (`TZ=America/Mexico_City`, con precondición): completada a las 23:30 del 3-nov
  cuenta como «ayer» el 4 (no es la familia de `R9-487`); el foco, con `renderRouter`
  (`S128-a2-planFoco.test.tsx.txt`, 1/1): al volver de la historia, «1 de 10 días». «11 de 10» no es alcanzable
  (`[storyId].tsx:91-92` normaliza el id).
- **El quiz:** dos toques en una opción, no alcanzable (`disabled={answered}`); «Siguiente» dos veces avanza dos
  escenas y nunca entra solo al quiz; el puntaje guardado es el mostrado.
- **El idioma o la versión con la pantalla abierta:** no alcanzable desde las escenas (fuera de `(tabs)`, sin
  camino a Ajustes ni al lector); `openInReader` lee la versión al tocar.
- **JSON viejo o roto:** cubierto por `kidsProgress.test.ts:59-97`. Las escrituras sin cola
  (`kidsProgress.ts:113-168`) no se pisan por un camino real (el quiz encadena con `await`).

## Sin medir

- **Modo C:** el doble toque en una tarjeta de la portada (`index.tsx:105-108`, familia de `R9-474`), la voz de
  «Escuchar todo» (`useNarratedWalkthrough` al desmontar ya es un «sin medir» de la 124), emojis nuevos en Android
  viejo.
- «Abrir en la Biblia» abre en el primer versículo de la primera escena (p. ej. Lc 10:29), no en el inicio del
  rótulo (`[storyId].tsx:256-264`): sin medir.
- El plan abierto a través de la medianoche no se recalcula hasta el próximo foco (`plan.tsx:83-87`), cosmético.
- El logro «Primera historia» que un respaldo viejo vuelve a bloquear y ya no se gana (`[storyId].tsx:241` exige
  `length === 1`; `AchievementService.ts:1112-1118` reescribe desde el respaldo): sin medir, suma a `R9-30` (el
  progreso de Niños no entra al respaldo).
- Los textos «Para enseñar» en inglés y sus preguntas: sin recorrer.

**Cruce con las vecinas (§5, sesión 116):** `A34` dejó «Modo C» los dobles toques de Journeys (la misma familia
que la portada); `A36` comparte con esta fila el respaldo y la cuenta (agente 8: `R9-30`, `R9-59`, `R9-24`, ver
`detail/A36-oracion-lectio.md`).
