# A17 — Quiz (`src/features/quiz`, `app/features/quiz`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 118 (2026-11-02) · Estado **🐛 BUG**
>
> **Resultado:** 2 hallazgos (`R9-432`, P2; `R9-433`, P3), ninguno P0. El banco, la ronda y el puente al mazo
> aguantan; lo que falla es el estado del panel al reiniciar la ronda y el reloj del modo cronometrado.
>
> **Cómo se midió:** en el principal, sin agentes (`8cea3ad`). Dos sondas con `_scratch/S116-correr.cjs.txt`,
> las dos sobre la pantalla real con el `QuizPanel` real (los contextos con objetos estables):
> `S118-quizMismaClave.test.tsx.txt` (`Math.random` sembrado, 60 rondas) y `S118-quizReloj.test.tsx.txt`
> (premium, temporizadores falsos).

## El área

`app/features/quiz/index.tsx` (651 L), `app/features/quiz/stats.tsx` (325 L), `src/components/quiz/QuizPanel.tsx`
(294 L), `src/features/quiz/*` (`quizBank`, `quizRound`, `quizStatsStore`, `quizVerseLookup`) y
`src/hooks/useQuizStats.ts`. Lo ya dicho, no re-derivado: Fable, área 21 ✅ (ronda completa, los 4 tipos,
añadir al mazo tras fallar, categorías, contrarreloj, estadísticas, y el gating gratis en vivo); `R9-30` (las
estadísticas `@quiz_stats_v1` no entran en el respaldo: está en su lista, «facts/journeys/profecías/kids/quiz»);
el diálogo de salida de la Tanda I (`quizExitConfirm.test.tsx`). El banco tiene sus pruebas de contenido
(`quizBank.test.ts`: 24 preguntas, ES y EN, cada cita contra el texto real) y la ronda las suyas
(`quizRound.test.ts`).

## Hallazgos

**`R9-432` (P2): al cambiar de categoría con la pregunta ya respondida, si la ronda nueva empieza con la misma
pregunta, el panel queda respondido sobre el orden nuevo.**

- `index.tsx:493` monta el panel con `key={current.id}`. `restartWithSettings` (`:213-228`, desde
  `handlePickCategory` `:230-233` y `handleToggleTimedMode` `:235-241`) arma una ronda nueva y re-baraja las
  opciones, pero si su primera pregunta tiene el mismo id, React no remonta: el `selected` viejo
  (`QuizPanel.tsx:80`) queda sobre el `order` nuevo, y `wasWrong`/`optionStyle` (`:84`, `:124-138`) lo comparan
  con el `correctPosition` nuevo.
- **Repro:** Quiz → «Todos» → responder la pregunta 1 → tocar la categoría de esa pregunta (gratis). Pasa 1 de
  cada 4 veces en «Sabiduría» o «Cartas» (4 preguntas), 1 de 7 en «Pentateuco» y 1 de 8 en «Evangelios»; con
  el contrarreloj (premium), 1 de 24 en «Todos». La ronda dice «Pregunta 1», «Aciertos: 0», «Errores: 0», y el
  panel ya está respondido: «Incorrecto» sobre una respuesta correcta, otra opción en rojo, «Siguiente». Esa
  pregunta no cuenta: la ronda de 8 cierra con «Aciertos: 7 · Errores: 0» y «¡Ronda perfecta!».
- **Sonda:** `_scratch/S118-quizMismaClave.test.tsx.txt`: 59 rondas probadas, 5 con la misma pregunta, las 5
  respondidas tras el cambio y las 5 con el veredicto cambiado («correcto» → «incorrecto»): rojo. Control, las 54
  con otra pregunta: ninguna respondida. Cola: `{"tarjeta":"Aciertos: 7 · Errores: 0","tamañoRonda":8}`.
- **Propuesta (sin escribir):** que la clave del panel cambie con cada ronda nueva (un contador que suba en
  `restartWithSettings` y `startNextRound`, junto al id).

**`R9-433` (P3): en el modo cronometrado, el reloj sigue corriendo detrás del diálogo «¿Salir del quiz?».**

- El efecto del reloj (`QuizPanel.tsx:89-103`) depende solo de `[timedMode, answered, timeLeft]`; nada lo pausa
  mientras `showExitConfirm` está abierto (`index.tsx:297-304`, `:309-315`, `:534-544`). Por lectura, lo mismo
  con las estadísticas abiertas encima (`handleOpenStats`, `:243-249`: la pantalla del quiz queda montada debajo).
- **Repro (premium):** Quiz → «Modo cronometrado» → responder la 1 y pasar a la 2 → atrás → el diálogo «¿Salir del
  quiz? Perderás tu progreso de esta ronda.» → esperar 15 s → «Cancelar»: la pregunta 2 ya está perdida, «¡Se
  acabó el tiempo!», «Errores: 1». El diálogo que protege la ronda la deja perder una pregunta.
- **Sonda:** `_scratch/S118-quizReloj.test.tsx.txt`: con el diálogo abierto 16 s y «Cancelar»,
  `{"dialogo":true,"seAcaboElTiempo":true,"errores1":true}`: rojo. Control, 10 s sin diálogo: `"⏱ 5s"`, sin
  vencer.
- **Propuesta (sin escribir):** pasarle al panel una pausa (`showExitConfirm` o la pantalla sin foco) que detenga
  la cuenta.

## Revisado sin hallazgo

- **El banco y la ronda:** `pickQuizRound` (`quizRound.ts:38-51`) filtra la categoría antes de excluir y cae al
  mazo entero cuando no quedan sin ver; `shuffle` copia (`propheticQuiz.ts:25-35`); `prepareQuizQuestion` sigue
  la posición correcta. Los ids que comparten enunciado (las de orden de eventos) se distinguen por las opciones.
- **El puente al mazo:** `refKeyToVerseKey` y `resolveVerseForAddCard` comparten `resolveRef`, con el nombre
  inglés (la identidad del mazo); `null` sin lanzar. `canAddToDeck` (`index.tsx:140-146`) mantiene el «Añadido»
  tras el `addCard`.
- **Las estadísticas:** `parseQuizStats` acota cada cuenta (`correct ≤ answered`), la cola de escrituras
  (`quizStatsStore.ts:251-268`) serializa y no escribe tras un fallo de lectura. Gratis no graba nada
  (`finishRoundSideEffects` `:173-199`), y la pantalla de estadísticas sin premium muestra el bloqueo.
- **El repaso del mazo desde el quiz** (`complete-verse` → `reviewCard('good'|'again')`, una vez por ronda): es
  el diseño, acordado con Victor (cabecera de `index.tsx:20-30`).
- **Los quiz hermanos:** profecías (`app/features/prophecies/quiz.tsx:110`) arma la ronda nueva solo desde la
  tarjeta final, con el panel desmontado: sin la gemela de `R9-432`.

## Sin medir

- **«Siguiente» durante el «añadiendo…»:** `handleAdvance` (`:263-267`) vuelve el estado a `idle` y la respuesta
  de `handleAddToDeck` (`:269-284`) lo pone en `added` sobre la pregunta siguiente. La ventana es un `getVerse`
  con la base ya abierta: sin escenario humano en jest. Si aparece, es de Modo C.
- **Doble toque en «Ver resultado»:** `finishRoundSideEffects` dos veces duplicaría la ronda y el `reviewCard`;
  React vacía el evento discreto antes del toque siguiente. Con el hilo de JS ocupado, Modo C.
- **El reloj con la app en segundo plano**, y el atrás del sistema con el diálogo abierto (la clase de `R9-57`):
  Modo C.
- **Cruce con las vecinas:** `A16` (búsqueda) dejó «respuestas fuera de orden»; `A17` no tiene búsquedas en
  vuelo. El patrón «la clave del panel no cambia con la ronda» se buscó en los quiz de profecías y de niños
  (`A33`, `A35`): sin gemela.
