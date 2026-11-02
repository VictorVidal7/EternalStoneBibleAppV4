# A15 — Audio/TTS (`src/features/audio`, `src/lib/speech`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 116 (2026-11-02) · Estado **EN CURSO**
>
> **Resultado:** 2 hallazgos (`R9-425`, P1; `R9-426`, P2), ninguno P0. La fila sigue «EN CURSO» por el
> alcance que no se recorrió (abajo).
>
> **Cómo se midió:** el agente 3 de 3 (`fork` en worktree sobre `f6c7986`, solo midió; reglas en
> `_scratch/S116-agentes-reglas.md.txt`). Sondas con `_scratch/S116-correr.cjs.txt`. Copias en
> `_scratch/S116-sondas-agente-3/` (informe `S116-a3-informe.md.txt`). Las tres sondas se re-midieron en el
> principal y dieron lo mismo; las líneas que sostienen `R9-425`, verificadas a mano.

## El área

`src/features/audio/**` (~10k L: `AudioPlayerContext` 1263 L y su `.web`, `MiniAudioPlayer` 1282 L, cola,
voces, temporizador de sueño, avance de capítulo, posición guardada, estadísticas de escucha) y
`src/lib/speech/**`. Lo ya dicho: `R9-70`, `R9-79`; Fable área 19 y su BUG-3 («Espanol»). La pronunciación
de la voz no es un hallazgo (es de la voz del dispositivo).

## Hallazgos

**`R9-425` (P1): el temporizador «al final del capítulo» no para: la narración sigue al capítulo siguiente, y
el temporizador ya no existe.**

- **El defecto:** en el `onDone` del último versículo, con `mode === 'end-of-chapter'`,
  `AudioPlayerContext.tsx:570-572` llama a `cancelSleepTimer()` (deja `mode: null`, `:436-441` con
  `initialSleepTimerState` de `:84-89`), y en el mismo callback sube `chapterEndCount` (`:577-584`).
  `AudioChapterAdvancer.tsx` lee el modo de un ref que se renueva en cada render (`:71-72`) y decide con
  `shouldAdvanceChapter` (`:94-96`; `chapterNavigation.ts:91-101`). Cuando su efecto corre, el modo ya es
  `null`, y con el avance continuo en `true` (el valor por defecto, `AudioPlayerContext.tsx:116`) avanza:
  `getChapter` + `loadChapter` + `play()`. El comentario de `:573-576` dice lo contrario («or a end-of-chapter
  timer fired, the advancer ignores the bump»).
- **Camino:** reproductor → temporizador → «Al final del capítulo» (`MiniAudioPlayer.tsx:1074` →
  `SleepTimerModal.tsx:177`). Al terminar el capítulo, la narración pasa al siguiente y, sin temporizador,
  sigue capítulo tras capítulo hasta el fin del canon, con la pantalla despierta (`:271-282`). Quien se duerme
  con «al final del capítulo» amanece con la app narrando.
- **Sonda:** `S116-a3-finCapitulo.test.tsx.txt`. Control sin temporizador: pasa a «Juan 4:1», como debe. Con
  «al final del capítulo»: `textos=["Juan 3:1","Juan 3:2","Juan 4:1"]`, `getChapter` 1 vez (`43, 4,
"RVR1960"`), `modo=null`: rojo. La única prueba previa es la de la función pura `shouldAdvanceChapter`, que
  sí devuelve `false`.
- **Propuesta (sin escribir):** que el aviso de fin de capítulo lleve el modo con el que terminó (o que el
  avanzador lo lea antes de cancelarlo), en vez de cancelar el temporizador antes de que el avanzador decida.

**`R9-426` (P2): lo que se para en el hueco entre dos versículos (o entre dos capítulos) vuelve a sonar.**

- **El defecto:** la continuación se programa y no mira, al ejecutarse, si se pausó o se cerró desde entonces.
  `AudioPlayerContext.tsx:589-592` (`setTimeout(() => speakVerseByIndex(index + 1), 50)`), y lo mismo en `:551`
  (repetir versículo) y `:566` (repetir lista). `speakVerseByIndex` (`:450-512`) no mira `isPaused`, y su
  `onStart` (`:517-525`) pisa la pausa; la espera de `Speech.stop()` en `:508` tiene el mismo hueco. En
  `AudioChapterAdvancer.tsx`, el `setTimeout(() => playRef.current(), 150)` tras `loadChapter` (`:149`) solo se
  cancela si cambia `chapterEndCount`: cerrar el reproductor no lo cancela.
- **Caminos:** (1) un temporizador por minutos vence en los 50 ms entre versículos: `pause()` +
  `cancelSleepTimer()`, y el versículo siguiente suena igual; sin temporizador, la narración sigue sin fin
  (una noche de cada ~100-200, estimado por el agente). (2) Cerrar el reproductor (✕, `:892-900`) en los
  ~150 ms tras el fin de un capítulo: el siguiente suena con el reproductor oculto, sin control en pantalla.
  (3) Una pausa del usuario o el paso a segundo plano (`:1044-1063`) en el mismo hueco: como (1).
- **Sonda:** `S116-a3-hueco50.test.tsx.txt`, dos pruebas en rojo. Temporizador: justo tras vencer,
  `{"isPlaying":false,"isPaused":true,"timer":false}`; después, `textos=["Juan 3:1","Juan 3:2"]` y al final
  `{"isPlaying":true,"isPaused":false,"idx":1,"timer":false}`. Cerrar: tras la ✕, `visible=false`; después,
  `textos=["Juan 3:1","Juan 4:1"]` con `visible=false` al final.
- **Propuesta (sin escribir):** que cada continuación programada compruebe al ejecutarse un contador de
  generación (o el estado de pausa/visibilidad) y se descarte si cambió.

## Revisado ✅

- **Nombres de libro:** el avance continuo y la reanudación buscan el libro con `getBookByName` y se cortan
  en silencio si no lo reconocen. Sonda `S116-a3-nombres.test.ts.txt` (verde): RVR1960 y WEB, 66 libros cada
  uno, `noReconocidos=[]`, `idDistinto=[]`. Los packs fuerzan el nombre canónico por `book_id`
  (`scripts/build-spanish-packs.js:13`), por lectura.
- **Restauración en frío** (`AudioResumeRestorer` + `coldStartRestore.ts`): `loadChapter` y `goToVerse`
  corren en el mismo tick y el autoguardado escribe el índice restaurado.
- **Marcadores y saltos** (`AudioQueueSheet`): los marcadores se recargan al abrir la hoja; los saltos leen
  `versesRef`.
- **Estadísticas de escucha** (`AudioListeningTracker` + `listeningStatsStore`): una cola en serie.
- **Posición guardada** (`playbackPositionStore`): el ejecutor serie de AsyncStorage ordena sus escrituras.
- **Web** (`AudioPlayerContext.web.tsx`): un stub sin audio, a propósito (`webStubProviders.test.tsx`).
- **`savePreferences`** (`:408-432`): lee y reescribe sin turno, pero cada setter es un toque aparte.

## No alcanzable

- **Voz elegida que no se carga en frío** (`:384-399`): `expo-speech` en Android encola `getVoices` hasta
  `onInit`.
- **Velocidad premium recortada y guardada** (`:803-809`): haría falta una caché en `false` y RevenueCat
  diciendo premium después; sin camino concreto (zona de `R9-9`/`R9-10`).
- **Último versículo de un capítulo con texto vacío** (`:464-472`): los versículos omitidos son filas que
  faltan, y ninguno es el último de su capítulo.

## Sin medir (Modo C)

- El orden real de los eventos nativos: si el `onStopped` del versículo interrumpido (`:594-602`) llegara
  después del `onStart` del nuevo, quedaría en pausa con voz sonando, y el `onDone` siguiente no avanzaría
  (`:535`).
- `SpeechModule.kt` apaga el TTS al destruirse la actividad (`OnActivityDestroys { textToSpeech.shutdown() }`)
  y la instancia es `lazy`: si la actividad se destruye con el runtime de JS vivo, el TTS quedaría apagado
  hasta matar el proceso. De la librería.
- `Speech.stop()` antes de `onInit` no vacía `delayedUtterances`: una pausa justo tras un arranque en frío
  dejaría sonar el versículo encolado (lo mitiga la enumeración de voces al montar, `:307-353`).

## Sin medir (alcance)

`MiniAudioPlayer.tsx` y `VoiceSelector.tsx` más allá de sus efectos y timers (esos limpian al desmontar,
`:245-268`), y `narration.ts`/`narrationVoice.ts` (tienen su prueba).

## Para la fila `A31` (código muerto), sin barrer

`useSleepTimer` (`src/features/audio/hooks/useSleepTimer.ts`) se exporta sin usos; `clearChapter`
(`AudioPlayerContext.tsx:1138`) no tiene llamadores.
