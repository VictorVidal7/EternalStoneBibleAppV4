# Sesión 181 — revisión del diff de la 180 (`R9-570` a `R9-573`): se sostiene

> 2026-11-24 y 2026-11-25, en tres partes (las dos primeras cortadas por límite de llamadas). Opus 5.5 principal, sin agentes. main = origin/main = `2f99078f` (la 180 mergeada). Sin cambios de
> código. Emulador `Pixel_9_Pro` en solo lectura (`-read-only`), APK debug vc73, `pm clear`, onboarding a mano (es,
> RVR1960), sin cuenta. Salidas en `_scratch/S181-sondas/`. Este archivo era `_scratch/S181-detalle-parcial.md.txt`; el cierre agrega la §7 y la §8.

## 1. Revert por pieza, de nuevo (`_scratch/S181-revert.cjs.txt` → `S181-revert.out.txt`)

Cada pieza contra las cinco pruebas del diff (33 casos). Base: 33/33.

| Pieza                          | Cae                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| 570-A la cola                  | 8 de `notificationRescheduleSerialized` (frío real, Ajustes, los cinco hermanos, apagado)      |
| 570-B apagado fuera de la cola | solo el apagado                                                                                |
| 570-C el `catch`               | la tarea que falla, y el caso siguiente del archivo (la cola es de módulo; ya dicho en la 180) |
| 571-A el ref en `hidePlayer`   | solo el caso principal de `miniAudioPlayerCloseRealProvider`                                   |
| el efecto de `R9-427`          | los dos de la prueba vieja y el principal de la nueva                                          |
| 573-A motor                    | los dos casos de lista de `audioSleepTimerEndOfChapter`                                        |
| 573-B cableado                 | solo el caso del cableado                                                                      |
| 573-C modal                    | solo los dos idiomas de `sleepTimerModalEndOfBook`                                             |

Ninguna pieza tumba una prueba de otro arreglo. Se sostiene.

## 2. `R9-570`, la cola

- **Leído:** `serializeByType` devuelve `run` al llamador (el rechazo le llega igual que antes) y guarda en el mapa
  `run.catch(() => undefined)`: el `catch` no esconde nada que antes se viera. `cancelNotificationsByType` ya se
  tragaba sus errores antes de la 180. Ningún `*Now` llama a la versión con cola de su propio tipo (no hay
  autoespera). Fuera del servicio nadie cancela ni programa notificaciones (`grep` de `cancelAllScheduled`,
  `cancelScheduledNotificationAsync`, `scheduleNotificationAsync`: vacío).
- **Sin salida por tiempo:** una tarea que nunca resuelve dejaría su tipo atascado hasta matar el proceso, y el
  interruptor de Ajustes queda `disabled` (`busy`) mientras espera. Camino práctico: no encontrado.
  `bibleDB.initialize()` puede tardar en la primera carga, pero resuelve o lanza (y el cuerpo lo envuelve en
  `try`); `getVerse` de una versión sin filas devuelve `null` rápido; en una instalación nueva el recordatorio está
  apagado y `refresh*` sale antes de entrar a la cola. Riesgo sin medir, sin entrada.
- **Cuánto espera el interruptor:** una reprogramación entera tarda ~0,5 s en el emulador (dos cambios de versión
  seguidos: corridas a 20,35 y 20,88 s). Es lo más que un toque espera por cada corrida que tiene delante. No se
  logró solapar a mano un toque con la reprogramación del arranque (la versión está en la página de Ajustes y los
  interruptores en otro modal).
- **En vivo:**
  - Versículo del día y oración activados en Ajustes: 14 + 14 = **28 alarmas**.
  - Frío con el pack presente (`S181-570-frio.sh.txt 01-frio-pack`): una corrida por tipo, **28 alarmas** en 28 horas
    distintas, 28 entradas con texto en el almacén.
  - Dos cambios de versión seguidos (WEB y RVR1960 en el mismo `input`): corridas en serie (~0,5 s una de otra),
    **28 alarmas**, los 14 cuerpos del versículo en español (gana la última; `S181-02.*`).
  - Apagar y encender rápido: cuatro toques en ~0,6 s y tres rondas de tres toques a 0,15 s. En cada ronda
    coinciden el interruptor, `@daily_notifications_enabled` y las alarmas (28/true, 14/false, 28/true). El `busy`
    descarta los toques que llegan mientras espera.
- **Veredicto:** se sostiene. Sin hallazgo.

## 3. `R9-571` y `R9-572`

- **Leído:** `hidePlayer` escribe el ref y llama a `stop()` en el mismo tick; `stop()` arma el estado desde el ref y
  siempre hace `setState` (no tiene salida temprana). Después de la ✕, ninguna escritura de objeto puede devolver
  `isExpanded: true`: `pause`, el `onDone` (`finalState`), el pase a segundo plano y el fin del temporizador leen el
  ref en el momento, y el ref solo vuelve a `true` por el efecto que lo sincroniza tras un `expand()`. `onStopped` y
  `onError` usan updaters.
- **La prueba nueva (`R9-572`)** recorre el camino del usuario con botones (expandir, ✕, cargar otro capítulo) y mide
  lo visible (alto y opacidades) antes del estado. Hueco: nunca reproduce, así que no ejercita la ✕ con la
  narración en curso (`onStopped`, `onDone` tardío). El vivo lo cubre (abajo). No se abre entrada.
- **En vivo, sonando** (más duro que la 141, que pausaba): Juan 3 → Audio → expandir → ✕ → Juan 4 → Audio: vuelve
  plegado (`S181-38-juan4.png`). Con ráfaga de 10 capturas durante el toque de Audio (`S181-39-montaje.png`):
  ningún cuadro expandido, aparece plegado de entrada. Después: expandir funciona, el gesto de bajar pliega
  (`S181-41-42.png`), y el cambio de pestaña con el panel expandido lo pliega y la pastilla sigue bien
  (`S181-43-44.png`).
- **Veredicto:** se sostiene.

## 4. `R9-573`

- **Sobre una lista de favoritos (3 versículos, Filipenses y Juan):** el modal no ofrece «Fin del libro» y sí «Fin
  del capítulo» (`S181-51-modal-lista.png`).
- **Uno arrastrado:** «Fin del libro» armado sobre Juan 5 y la lista de favoritos cargada, SIN repetición: narra los
  tres y termina («Reached end of chapter», 04:09:13); al abrir el modal después, el temporizador ya no estaba (se
  consumió). **Con repetición: SIN MEDIR** (el intento se desvió, ver §5).
- **Plan y colecciones:** `app/(tabs)/plan/[id].tsx:247` carga los capítulos de un día como lista
  (`mode: 'playlist'`). Ahí «Fin del capítulo» para al terminar el DÍA (varios capítulos), no el capítulo: ya
  existía (el vecino que la 180 anotó, «Fin del capítulo se llama así también sobre una lista»), pero el plan lo
  vuelve concreto, porque sus ítems SON capítulos. No contradice ocultar «Fin del libro» (el día termina antes que el
  libro, salvo un día que cruza dos libros). Candidato a entrada P3 de antes de la 180: medirlo en el cierre.
  Colecciones, sentimientos, temas y lectio cargan versículos sueltos: sin libro propio, la decisión vale.
- **Visto de paso:** la pastilla de la luna dice «0m» con un temporizador por modo («Fin del libro», y por el código
  también «Fin del capítulo»): `MiniAudioPlayer.tsx:1061-1065` pinta `{remainingMinutes}m` cuando `isActive`. Ya
  existía; buscar en `BUGS.md` antes de anotarlo.

## 5. Pendiente (lo que el corte dejó abierto)

1. **Panel trabado — SIN REPRODUCIR, lo más importante.** Tras armar «Fin del libro» en el modal sobre Juan 5,
   plegar con el chevron, un deep link `favorites` que no navegó (app ya abierta), un toque que cayó en «Siguiente»
   (Juan 6) y expandir: el panel quedó a altura expandida con las DOS vistas superpuestas a medio fundir
   (`S181-54-crop.png`, `S181-57-crop.png`), estable. «Contraer» y expandir no lo cambian; los toques en la zona de
   la pastilla cambian la velocidad (1x → 1,25x → 1,5x; `S181-60-64.png`). La vista expandida es la que tiene
   `pointerEvents` (el dump lista sus botones). Sin errores en logcat. El intento desde frío se desvió (un toque
   abrió otra hoja). Hay que reproducirlo y medir si es de la 180 (revert del ref de `hidePlayer` y del efecto de
   `R9-427`) o de antes (control con `git stash` no: Edit de la pieza y `git checkout`).
2. «Fin del libro» arrastrado a una lista CON repetición (la repetición está en la hoja de la cola: «Abrir la cola de
   escucha», `AudioQueueSheet.tsx:530`): ¿para al final y se apaga la luna?
3. **«Favorites loaded successfully» cada ~1,5 s** en la pantalla de favoritos (04:09:10 a 04:09:19, con
   «already initialized, skipping» de `bibleDB` entre medio): ¿bucle de recarga? Medir cuánto dura y si sigue fuera
   de la pantalla; buscar en `BUGS.md`.
4. El plan con «Fin del capítulo» (§4), medido.

## 6. Segunda parte (2026-11-24, chat nuevo; también cortada por límite de llamadas)

Mismo emulador en solo lectura, APK vc73, `pm clear`, onboarding a mano (es, RVR1960), sin cuenta. Salidas en
`_scratch/S181-sondas/` con prefijos `c`, `v1` a `v3`, `fav-`, `anim`. Recetas nuevas: `_scratch/S181-panel.sh.txt`
(la secuencia del panel, toca por etiqueta y espera a que aparezca; `SKIP=1` arranca desde el lector) y
`_scratch/S181-crop.cjs.txt` (recorta y compara capturas con pngjs).

### 6.1 El panel trabado (§5.1): SIN REPRODUCIR en cuatro intentos

- **Cómo reconocerlo:** en `S181-54-crop.png` los controles PLEGADOS (▶ relleno, «2/47», ⏭, «1x», chevron hacia
  arriba) se pintan opacos encima de la cabecera expandida. OJO: el título de la izquierda de la vista expandida
  («Juan 5…» con el comienzo del versículo debajo) y el texto del lector que se trasluce (el fondo es `rgba(…,0.9)`
  con `BlurView`) son lo normal, no el fallo (en el primer intento lo confundí; ver `S181-v1-crop.png` como
  referencia normal).
- **Intentos** (todos normales al expandir; capturas `*-crop.png`):
  1. `c17`: la secuencia del prompt (Juan 3 pausado → expandir → luna → «Fin del libro» → chevron → Siguiente → expandir).
     Ráfaga de 6: estable desde ~0,4 s del toque (0 px distintos entre r3, r6 y 5 s después).
  2. `v1`: sin temporizador, con cambio de capítulo.
  3. `v2`: con temporizador, deep link `favorites` tras plegar (esta vez SÍ navegó: Favoritos vacío), expandir ahí,
     Volver (el cambio de ruta pliega), Siguiente, expandir.
  4. `v3`: el chevron a 0,1 s de elegir «Fin del libro» (antes de que cierre el modal), con cambio de capítulo.
- **Leído:** con UN solo `expandProgress` el estado es imposible: la plegada tiene opacidad > 0 solo por debajo de 0,3
  y la expandida solo por encima de 0,7 (`MiniAudioPlayer.tsx:474-503`); la altura también sale de ahí
  (`:460-472`). Hay una sola instancia (`app/_layout.tsx:357`). Y en el original los toques en la «1x» plegada
  CAMBIABAN la velocidad: ese botón tiene `disabled={state.isExpanded}` evaluado en JS, así que en ese render
  `isExpanded` era `false`, mientras el dump nativo listaba los botones de la expandida. Apunta a vistas nativas con
  props viejas (Fabric, `newArchEnabled=true`, Reanimated 4.5.1) más que a la lógica de la 180: el ref de
  `hidePlayer` solo actúa en la ✕, que la secuencia no usa. **Sin el control** (quitar el ref y el efecto de
  `R9-427`) porque sin reproducir no mide nada.
- **Diferencias que quedan con el original** (por probar, en este orden): la lista de favoritos narrada hasta el final
  con «Fin del libro» arrastrado ANTES de cargar Juan 5 (§4); el deep link que NO navegó (app ya en esa ruta); varios
  minutos de sesión con muchos cambios de estado.
- **Propuesta de anotación:** si no se reproduce en dos intentos más, entrada P3 «visto una vez, sin reproducir,
  origen sin determinar» con `S181-54-crop.png`, `S181-57-crop.png` y lo leído; no se atribuye a la 180.

### 6.2 «Favorites loaded successfully» (§5.3): es `R9-464` (P2, abierto), confirmado en vivo

- En Favoritos (0 favoritos): 12 cargas en ~18 s, una cada ~1,5 s, cada una con su `bibleDB.initialize()` («already
  initialized, skipping»), sin fin (`S181-fav-en.logcat.txt`). Al volver al lector: se corta (1 residual en 15 s,
  `S181-fav-fuera.logcat.txt`).
- La causa, leída, es la que `R9-464` ya escribe (`refreshFavorites` sin `useCallback` en
  `FavoritesContext.tsx:490`, en las deps del `useFocusEffect` de `favorites.tsx:53-61`; `setFavorites` con un arreglo
  nuevo). Sin entrada nueva: una línea «Confirmado en vivo en la 181» en `R9-464`.

### 6.3 Visto de paso: Inicio anima sin parar (sin medir del todo)

- Tras varios arranques, Inicio quedó con ~57 % de CPU de la app en reposo (`top`) y `uiautomator dump` fallando
  («could not get idle state»). Dos capturas a 0,7 s: cambian solo dos bandas grises (y≈2100-2200 y 2400-2500) que
  asoman por encima y por debajo de «Continuar leyendo» (`S181-anim1.png`, `S181-anim2.png`). Parecen un `Skeleton`
  con brillo que sigue montado debajo de la tarjeta (`app/(tabs)/index.tsx:637-690`). En el primer arranque de la 181
  el dump de Inicio sí funcionaba. Sin medir: cuándo aparece, si dura, y si ya está en `BUGS.md`.
- Para las recetas: tras `cold`, esperar ~12 s (los servicios terminan a los ~4-5 s, y antes un toque se pierde) y tocar
  «Continuar leyendo» por coordenadas (640,2340).

### 6.4 Sin hacer todavía

- §5.2 «Fin del libro» arrastrado a una lista CON repetición.
- §4/§5.4 el plan con «Fin del capítulo» sobre un día de varios capítulos, medido. `BUGS.md`: sin entrada (greps de
  `plan/[id]` con temporizador, «al terminar el día»); el único rastro es el vecino de la 180
  (`detail/S180-arreglos-p3-de-la-141.md:106`).
- La pastilla «0m» con un temporizador por modo: sin entrada en `BUGS.md` (greps de `0m`, `remainingMinutes`,
  `MiniAudioPlayer.tsx:105x/106x`). Visto de nuevo en esta parte: con «Fin del libro», la pastilla expandida dice «0m»
  (`S181-v2-fav-crop.png`, `S181-v3-crop.png`). Es suficiente para anotarla como P3 de antes de la 180.

## 7. Tercera parte (2026-11-25, chat nuevo, sin corte)

Mismo emulador en solo lectura, APK vc73, `pm clear`, onboarding a mano (es, RVR1960), sin cuenta. Salidas en
`_scratch/S181-sondas/` con prefijos `p3-`, `i1` a `i3`, `p1` a `p3`. Receta nueva: `_scratch/S181-p3.sh.txt` (toca
por etiqueta en orden, cierra los logros, `L:` deep link, `S:` espera, `P:` captura).

- **Arranque:** el primer arranque cargó el bundle de los assets (Metro aún no escuchaba) y después Google TTS se
  actualizó solo durante el arranque (`googletts 20261026`): la primera narración falló con «_Call to function
  'ExpoSpeech.speak' has been rejected_» y «_not bound to TTS engine_». Un arranque en frío de la app lo resolvió. Es
  del emulador, no de la app; para las recetas: si la primera narración falla así, frío y de nuevo.

### 7.1 El panel trabado: dos intentos más, SIN REPRODUCIR → `R9-633` (P3)

1. `i1` (la diferencia principal de la §6.1): «Fin del libro» armado en Juan 5, la lista de favoritos (3 versículos)
   narrada hasta el final con él arrastrado («_Reached end of chapter_», 17:41:30, y otra vez a las 17:43:30), y
   después Juan 5 → Audio → pausar → expandir → luna → «Fin del libro» → chevron → deep link `favorites` → Volver →
   Siguiente (Juan 6) → expandir. Normal (`S181-i1e-final.png`).
2. `i3` (las otras dos): tras ~25 minutos de sesión con muchos cambios de estado (siete cargas de lista, tres
   temporizadores consumidos, repetición, saltos de la cola), Juan 5 → … → chevron → deep link `verse/John/5` con la
   app YA en esa ruta (no navega) → Siguiente → expandir. Normal (`S181-i3-crop.png`).

Seis intentos en total, ninguno lo reproduce. Sin el control de la §5.1 (sin reproducir no mide nada). Se anota como
`R9-633`, P3, «visto una vez, sin reproducir, origen sin determinar»; no se atribuye a la 180.

### 7.2 «Fin del libro» arrastrado a una lista CON repetición: SIN MEDIR en vivo; leído

- Tres intentos (`i2*`). La repetición se reinicia en cada carga de lista («_Every load starts an un-shuffled,
  non-repeating queue_», `AudioPlayerContext.tsx:1273`), así que hay que activarla en la hoja de la cola mientras
  suena la lista que lleva el temporizador. Con 3 y después 7 favoritos (~25 y ~60 s) no se logró a tiempo: los
  volcados de `uiautomator` tardan, y los toques por coordenadas abrieron la hoja tarde o cayeron en un ítem de la
  cola (saltó del 5 al 7). En el último, la repetición se encendió (17:58:51) cuando el temporizador ya se había
  consumido al final de la lista: con la repetición y SIN temporizador, la lista vuelve a empezar («_Playlist
  repeating from the start_», 17:59:04), lo esperado.
- **Leído:** en `onDone` (`AudioPlayerContext.tsx:669-704`) la repetición solo corre con `!stoppedBySleepTimer`, y
  `stoppedBySleepTimer` es `end-of-chapter || (isPlaylist && end-of-book)`: es la MISMA condición la que hace parar
  sin repetición (medido en vivo tres veces: `i1`, `i2a` y `i2e`, temporizador consumido, luna apagada en
  `S181-i2c.png`) y la que le gana a la repetición. La prueba de la 180 (`audioSleepTimerEndOfChapter`, casos de
  lista) lo cubre con el proveedor real. Sin hallazgo.

### 7.3 El plan con «Fin del capítulo»: leído, SIN MEDIR en vivo → `R9-635` (P3)

- No se llegó a la pantalla del plan: el deep link `eternalbible://plan/nt-in-90-days` (y con `///`) abre «Libro no
  encontrado» (`S181-p1.png`); la entrada al plan es desde Inicio, donde los volcados fallan (§6.3), y el presupuesto
  de llamadas no daba. Lo del deep link no se abre como entrada: no se comprobó qué rutas promete el esquema.
- **Leído:** `plan/[id].tsx:233-247` carga todos los capítulos del día como UNA lista (`mode: 'playlist'`), y el
  motor solo mira «Fin del capítulo» en el último ítem de la cola (`index >= freshVerses.length - 1`,
  `AudioPlayerContext.tsx:669`). En un día de varios capítulos («Mateo 1-3» en `nt-in-90-days`, «Génesis 1-3» y
  «Mateo 1» en `bible-in-a-year`), «Fin del capítulo» narra el día entero. De antes de la 180 (el vecino que la 180
  anotó en `detail/S180-arreglos-p3-de-la-141.md:106`).

### 7.4 La pastilla «0m» → `R9-634` (P3)

Vista por tercera vez (`S181-i1e-final.png`, `S181-i3-crop.png`): con «Fin del libro» armado, la pastilla del
reproductor expandido dice «0m». `MiniAudioPlayer.tsx:1061-1065` pinta `{remainingMinutes}m` siempre que
`isActive`, y los dos modos arman el temporizador con `remainingMinutes: 0` (`AudioPlayerContext.tsx:1123` y
`:1142`). De antes de la 180.

### 7.5 Vistos de paso, sin entrada

- **«Encountered two children with the same key, `.$fa…`»** (LogBox rojo, `S181-i2i-fallo.png`), tras marcar y
  desmarcar en un mismo toque cinco versículos de Juan 1 como favoritos (dos ya lo eran) y volver a Favoritos. El
  texto completo se perdió (logcat limpiado justo después). Puede ser `R9-466` (el mismo versículo guardado dos veces)
  por otro camino: sin medir.
- **Inicio anima sin parar (§6.3):** vuelto a ver: con el audio sonando en Inicio, `uiautomator dump` falla («_could
  not get idle state_»). Sin medir más.
- **La hoja de la cola no se abrió con un toque mientras sonaba la lista** (`S181-i2n-b.png`) y sí con el segundo:
  puede ser el toque durante la animación de expandir. Sin medir.

## 8. Veredicto

La 180 se sostiene: `R9-570`, `R9-571`, `R9-572` y `R9-573` quedan revisados, sin regresión. Nuevos, los tres P3 y
ninguno de la 180: `R9-633` (el panel trabado, sin reproducir), `R9-634` (la pastilla «0m») y `R9-635` («Fin del
capítulo» sobre un día de plan). `R9-464` (el bucle de Favoritos) confirmado en vivo. Sin cambios de código.
