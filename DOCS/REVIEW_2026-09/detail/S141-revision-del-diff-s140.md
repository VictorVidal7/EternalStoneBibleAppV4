# S141 — revisión del diff de la 140 (los tres P1)

> **Sesión 141 (2026-11-11).** En un chat nuevo, en la terminal, sin agentes, con **Fable 5.2 como modelo
> principal**. Alcance: el diff `02ee73e..e8700067` (tres archivos de `src/` y tres pruebas). Un emulador de solo
> lectura (`Pixel_9_Pro`, APK debug vc73, `pm clear`, interfaz en inglés), jest y lectura. Nada de la app se tocó:
> las sondas de código fueron temporales y el árbol quedó limpio.
>
> **Resultado:** los tres arreglos se sostienen en lo que arreglan, y hay **cuatro hallazgos nuevos, todos P3**:
> `R9-570` (una **regresión** del arreglo de `R9-424`: con el pack ausente, cada arranque en frío duplica los
> recordatorios del versículo del día), `R9-571` (la ✕ del reproductor no lo pliega: el estado «roto» de `R9-427`
> **no se alcanza en vivo**, ni antes ni después del arreglo), `R9-572` (la prueba de `R9-427` usa un `hidePlayer`
> simulado que hace lo que el real no hace) y `R9-573` («al final del libro» sobre una lista no vence). `R9-569`
> queda **refutado en su consecuencia** (la lectura parcial existe y no daña). Ninguno P0 ni P1. Hay 573 hallazgos.

## Cómo se trabajó

- **En vivo:** un emulador (`-read-only`), Metro en `main` (`177029af`). Ayudas en `_scratch`: `S141-ui.sh.txt`
  (la de la 139), `S141-427-flujo.sh.txt`, `S141-427-video.sh.txt` + `S141-427-pastilla.cjs.txt` (la trayectoria
  del reproductor cuadro a cuadro, con `screenrecord` y `ffmpeg`), `S141-reset-cortado.sh.txt` y
  `S141-store.cjs.txt` (las notificaciones programadas, por cuerpo). Capturas, dumps y logcats en
  `_scratch/S141-sondas/`.
- **Los controles en vivo** se hicieron quitando la pieza del arreglo en el árbol (con Edit), arrancando en frío y
  restaurando: sin la guarda de `R9-424`, sin el efecto de `R9-427`. Los logs temporales (`S141CTRL`, `S141EP`)
  salieron con `git checkout`; `git status` limpio al cerrar.
- **Con jest:** `_scratch/S141-425-vecinos.test.tsx.txt` (9 casos, el proveedor y el avanzador reales) y
  `_scratch/S141-427-hideReal.test.tsx.txt` (el `hidePlayer` real).
- **Una sonda que estorbó:** un `useAnimatedReaction` con `runOnJS` dentro de `MiniAudioPlayer` dejó los botones
  del reproductor sin responder. Era la sonda, no el arreglo (con el archivo original responden): se quitó, y el
  «tirón» se midió por video.

## `R9-424`: se sostiene en vivo; una regresión chica (`R9-570`)

| Medida en vivo                                               | Resultado                                              |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| KJV descargada y elegida, frío directo al lector, dos veces  | KJV las dos («Verily, verily…»); la clave sigue en KJV |
| **Control:** lo mismo sin la guarda (`if (!installedKnown)`) | **WEB** («Most certainly I tell you…»)                 |
| Las siete pantallas que leen `@bible_version` directo        | las siete en KJV, como el lector                       |
| El espejo: RV1909 elegida, dos fríos                         | RV1909 las dos («díjole»); la clave sigue en RV1909    |
| KJV quitada desde Gestionar versiones con KJV elegida        | en el mismo proceso cae a WEB; la clave sigue en KJV   |
| Frío al lector con el pack ausente (la ventana, costo 2)     | ~0,8 s en blanco, y se recupera solo en WEB            |
| Frío a Home con el pack ausente                              | el versículo del día sale en WEB                       |

- **El orden real del arranque es el del bug** (era «por lectura» en la entrada): el `getItem` vuelve ~0,1 s
  después de montar; la base responde entre 0,6 y 1,2 s más tarde (`COUNT(*)` y `DISTINCT version` sobre 93 302
  filas). El control sin la guarda lo muestra: `RVR1960 → KJV → WEB` en 20 ms y queda en WEB.
- **Las siete pantallas** (KJV, `S141-14`..`19`): Luz diaria («be ye stedfast, unmoveable»), estudio (Juan 3:16,
  «only begotten Son»), una objeción y un método de share-faith («come short of the glory of God»), un
  sentimiento, el detalle de un tema («the substance of things hoped for») y la Mesa (Juan 3:16-17).
- **La ventana, medida** (`S141-23-ventana.logcat.txt`): con KJV ausente y la clave en KJV, el lector pide el
  capítulo en KJV («0 verses found», la página en blanco de `R9-559`), 0,8 s después responde la base, la elegida
  pasa a WEB y el lector recarga solo (36 versículos). No se queda en blanco. En Home la caída llega ~2,2 s después
  del `getItem` (el hilo de JS está ocupado).
- **`R9-570`, la regresión.** El efecto de `app/_layout.tsx:180-198` reprograma los recordatorios cada vez que
  cambia `selectedVersion.id`. Con el pack ausente ahora corre dos veces, a ~2 s una de otra (KJV sin filas,
  después WEB), y las dos corridas se solapan. Abajo.
- **Por lectura, sin daño:**
  - El efecto de idioma (`:92-98`) no espera a la base, y no hace falta: solo actúa sin elección explícita, y la
    bandera se marca en el mismo lote que la versión restaurada.
  - `setVersion` antes de la respuesta de la base (costo 3): sus tres llamadores son el selector de Ajustes (solo
    lista las disponibles), el onboarding (solo empaquetadas) y el intercambio del modo dual del lector, que pide
    un toque en el primer segundo tras el frío.
  - La base que falla: el `finally` marca la bandera y cae a una empaquetada, sin escribir (probado en la 140).
  - `R9-436` no se cruza: el estudio de palabra usa `version ?? 'RVR1960'`, no el proveedor.

### `R9-570` (P3): con el pack ausente, cada frío duplica los recordatorios del versículo del día

- **Medida** (recordatorio activo, 8:00; KJV quitada, la clave en KJV; tres fríos seguidos,
  `S141-28-notif1..3.logcat.txt`): dos «Daily verse notifications scheduled» que terminan a la vez, y **26 alarmas**
  en `dumpsys alarm`, dos por cada hora de disparo. En el almacén de expo-notifications (`S141-29-store.xml.txt`):
  **13 con el cuerpo genérico** («Open the app to read today's verse», la corrida con KJV sin filas) **y 13 con el
  texto** (la de WEB). Cada mañana, dos notificaciones.
- **Controles:** sin la guarda de `R9-424`, mismo estado: una corrida, 13 con texto (`S141-30`). Con el pack
  presente y el arreglo: una corrida, 13 con texto (`S141-32`).
- **La raíz ya existía:** `scheduleDailyVerseNotifications` (`NotificationService.ts:243-317`) cancela y después
  programa 14 días con un `await` por día, sin serializar. Dos cambios de versión seguidos en Ajustes (a 1 s) dejan
  también 26, las dos tandas con texto, una por versión (`S141-72`). Eso se cura en el arranque siguiente; lo del
  pack ausente se repite en cada frío, hasta que el usuario elige una versión a mano.
- **Sin medir:** los otros cinco recordatorios del mismo efecto (memoria, oración, devoción, profecía, «¿Sabías
  qué?») no dependen de la versión pero se reprograman igual: por lectura tienen la misma forma.
- **Severidad:** P3. Pide el pack elegido ausente (`R9-558`, o quitar la versión elegida) y el recordatorio
  activo; no pierde datos. Es una regresión de la 140: antes, en ese estado, había una sola corrida.
- **Arreglo propuesto (sin escribir):** serializar la reprogramación (que una corrida nueva espere o invalide a la
  anterior), que es la raíz; y, con `R9-558`, que la red escriba la clave cuando la base **respondió** y el pack no
  está (ver `R9-569`, abajo): sin ventana no hay segunda corrida.

### `R9-569`: la lectura parcial existe, y no daña

- **Medido** (`S141-reset-cortado.sh.txt`: «Reset Bible Data» y `force-stop` al terminar RVR1960, antes de la
  primera fila de WEB; `S141-71-frio-parcial.logcat.txt`): en el frío siguiente la lectura del registro devuelve
  `{"totalVerses":31102,"versions":["RVR1960"]}`, a 20 ms de «Loading WEB Bible data...». Con la base a medio
  recargar la lista parcial no es una carrera: sale siempre.
- **La consecuencia escrita era falsa:** `installedVersions` (`constants/bible.ts:67-74`) devuelve SIEMPRE las
  empaquetadas, estén o no en la lista. Con `["RVR1960"]`, WEB sigue entre las disponibles (2, medido) y nadie la
  pierde. Una descargada no puede faltar de una lectura que respondió: los packs solo entran por Gestionar
  versiones, que refresca el registro.
- **Lo que cambia para el costo 1 de `R9-424`:** la razón para que la red no escriba la clave no es la lista
  parcial, es la lectura que **falla** (el `finally`): ahí sí quedaría la caída como la elección del usuario. Para
  la tanda de `R9-558`: escribir solo cuando la base respondió. La decisión es de esa tanda.
- **De paso, `R9-558` re-medido:** el reset se llevó KJV y RV1909 (la clave quedó en `RV1909`), y en el frío la
  elegida cayó a RVR1960, la empaquetada del mismo idioma.

## `R9-425`: se sostiene, en vivo y con sus vecinos

- **En vivo** (el TTS de esta instancia dispara sus callbacks, sin sonido): Salmo 117 con «End of chapter»: termina
  el versículo 2, «Reached end of chapter», y en 28 s no hay «Auto-advancing» ni consulta a la base
  (`S141-52-425vivo.logcat.txt`). Control: reproducir de nuevo, ya sin temporizador: «Auto-advancing audio to next
  chapter … 118» y suena Salmos 118:1 (`S141-53-425control.logcat.txt`).
- **Los vecinos, con jest** (`S141-425-vecinos.out.txt`):

| Caso                                                      | Resultado                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| A: el temporizador puesto DURANTE el último versículo     | para; `getChapter` 0 veces; temporizador consumido              |
| B: el temporizador y el `onDone` en el mismo tick         | para (por la defensa del avanzador); el temporizador queda vivo |
| C: lista en repetición + «al final del capítulo»          | para al final de la lista; después la repetición sigue          |
| D: lista en repetición + «al final del libro»             | **no para nunca** (`R9-573`)                                    |
| D0: lista sin repetición + «al final del libro»           | para; **el temporizador queda armado** (`R9-573`)               |
| E: bucle de memorización + «al final del capítulo»        | repite; al apagar el bucle, para y consume el temporizador      |
| F: Apocalipsis 22, sin temporizador, «capítulo» y «libro» | para en los tres; el temporizador, consumido                    |
| G: «al final del capítulo» + avance continuo apagado      | para; temporizador consumido                                    |
| H: pausa en el último versículo y un `onDone` tardío      | no avanza; al reanudar y terminar, para y consume               |

- **B dice que la rama `end-of-chapter` de `shouldAdvanceChapter` no es decorativa:** con el ref del temporizador
  sin renovar (se renueva en un efecto, `:234-236`), el motor sube la señal y es el avanzador el que para. Pide el
  toque y el `onDone` en el mismo tick de JS: sin camino real, e igual que antes del arreglo. No tocarla.
- **`R9-426` no empeoró:** con el temporizador ya no hay continuación programada al final del capítulo (antes, el
  avanzador cargaba y lanzaba `play()` a los 150 ms). Los huecos de 50 ms entre versículos, como estaban.

### `R9-573` (P3): «al final del libro» sobre una lista no vence

- `SleepTimerModal` ofrece «End of book» con cualquier cola. En una lista (favoritos, colección) el avanzador sale
  en `shouldAdvanceChapter` (`queueMode === 'playlist'`) antes de mirar el temporizador, y la rama de repetición
  del motor (`AudioPlayerContext.tsx:560-568`) solo cede ante «al final del capítulo».
- **Medida (jest, D y D0):** con repetición, tras el último versículo vuelve al primero y el temporizador sigue
  `end-of-book`, activo: narra sin fin. Sin repetición la lista termina y el temporizador queda armado, con la luna
  encendida; vence en el próximo fin de libro que se escuche.
- **Severidad:** P3: ya existía (no es del diff), y pide una lista y elegir un «libro» que la lista no tiene. El
  daño del primer caso es el de `R9-425`. **Propuesta (sin escribir):** en una lista, tratar «al final del libro»
  como «al final de la lista», o no ofrecerlo.

## `R9-427`: el estado roto no se alcanza en vivo; el arreglo es inocuo

- **En vivo, con el arreglo** (`S141-427-flujo.sh.txt`, `S141-47-conarreglo.logcat.txt`): reproducir → pausa →
  expandir → ✕ → reproducir de nuevo. Tras la ✕ el estado es `isExpanded=true, isVisible=false`, y el reproductor
  vuelve **expandido** (248), coherente y usable: el chevron lo pliega, la ✕ lo cierra. No vuelve plegado.
- **Control, sin el efecto de la 140** (`S141-48-sinefecto.logcat.txt`): idéntico, estado por estado.
- **Por qué:** `R9-571`. El `hidePlayer` real no deja `isExpanded` en `false`, así que el par imposible de la
  entrada (`isExpanded = false` con `expandProgress = 1`) no ocurre por la ✕. El otro camino que pliega sin el
  botón, el cambio de ruta (`MiniAudioPlayer.tsx:515-524`), ya movía los dos. La sonda de la 117 y la prueba de la
  140 lo «midieron» con un contexto simulado (`R9-572`).
- **El efecto queda, y hace falta:** el día que `R9-571` se arregle, la ✕ dejará `isExpanded = false` de verdad y
  sin el efecto aparecería el estado roto. Hoy no cambia nada visible.
- **Sin tirón, medido por video** (640×1428, la fila de la pastilla del borde superior, cuadro a cuadro):

| Tramo    | Sin el efecto (`S141-49`)                                 | Con el efecto (`S141-50`)                                 |
| -------- | --------------------------------------------------------- | --------------------------------------------------------- |
| Expandir | 2356 → 1784 en ~0,19 s, monótona, y un asentamiento lento | 2356 → 1784 en ~0,18 s, monótona, y el mismo asentamiento |
| Plegar   | 1750 → 2282 en ~0,17 s, monótona; un rebote de 2 px       | 1754 → 2286 en ~0,15 s, monótona; un rebote de 2 px       |

Por lectura coincide: el resorte relanzado al mismo destino sigue al anterior (`spring.ts:146-203`,
`isTriggeredTwice`), y si llega antes del primer cuadro arranca igual que el primero.

- **Lo demás, en vivo:** el cambio de pestaña con el reproductor expandido lo pliega (`isExpanded=false`) y al
  expandir de nuevo queda coherente; un arrastre corto (60 px) vuelve a su sitio y la ✕ después cierra; un arrastre
  largo pliega.
- **Sin medir en vivo:** la ✕ con un segundo dedo mientras el primero arrastra (adb no inyecta dos punteros). Por
  lectura: oculto, el efecto pone `translateY` en 0, y el fin del gesto lo lleva a 0 de todos modos.

### `R9-571` (P3): la ✕ del reproductor no lo pliega

- `hidePlayer` (`AudioPlayerContext.tsx:903-911`) encola `setState(prev => ({...prev, isExpanded: false}))` y, en
  el mismo tick, llama a `stop()` (`:704-722`), que arma un objeto desde `stateRef.current` y hace
  `setState(nextState)`. El ref se renueva en un efecto (`:226-228`): todavía dice `isExpanded: true`, y el objeto
  pisa al updater.
- **Medida:** jest con el proveedor real (`S141-427-hideReal.out.txt`): expandir → `hidePlayer` →
  `{"isExpanded":true,"isVisible":false}`; el control (plegar antes) da `false`. En vivo, tres veces, el log dice
  lo mismo y el siguiente audio abre el panel expandido, tapando un tercio del lector.
- **Severidad:** P3: se pliega con el chevron y no rompe nada; contradice lo que `hidePlayer` dice hacer.
- **Arreglo propuesto (sin escribir):** que `hidePlayer` pliegue después de `stop()`, o que `stop()` use un
  updater. Con ese arreglo, el efecto de `R9-427` pasa a ser lo que sostiene el reproductor.
- **La misma forma, sin medir:** cualquier `setState(prev => …)` seguido en el mismo tick por un `setState` con un
  objeto armado desde `stateRef.current` (`pause`, `stop`, el `onDone` del fin de capítulo) pierde el primero.

### `R9-572` (P3, pruebas): la prueba de `R9-427` mide un `hidePlayer` que no existe

- `__tests__/miniAudioPlayerCloseResetsExpand.test.tsx:44-146` reemplaza el contexto entero por un store; su
  `hidePlayer` (`:113-119`) pone `isVisible = false` e `isExpanded = false`, con el comentario «What the real
  hidePlayer does». El real deja `isExpanded = true` (`R9-571`).
- **Consecuencia:** el caso principal («expandir → ✕ → mostrar: 64, plegado») fija algo que la app no hace: en
  vivo da 248, expandido, con y sin el efecto. La prueba vigila bien el contrato del efecto (falla sin él), pero no
  el recorrido del usuario, y el día que `R9-571` se arregle no lo va a notar.
- **Propuesta (sin escribir):** un caso con el `AudioPlayerProvider` real debajo del `MiniAudioPlayer` real (el
  mock de Reanimated de la prueba sirve igual), que cierre con la ✕ y vuelva a cargar.
- Es el corolario de la sesión 21 («un mock que IMPLEMENTA la semántica decide la pregunta»), del lado del
  contexto.

## Para la 142

- **Arreglos de lo que encontró la 141:** `R9-570` (serializar la reprogramación), `R9-571` + `R9-572` (el
  `hidePlayer` real, y la prueba con el proveedor real) y `R9-573` (el temporizador de libro en una lista). Los
  cuatro, P3, con prueba vista fallar.
- **Después, la tanda 2 de P2** (§4 de `CONTINUAR.md`). Para `R9-558`: la red de `useBibleVersion` puede escribir
  la clave cuando la base respondió y el pack no está; no cuando la lectura falló.
- **`R9-569`:** sin daño medido. Queda como nota de `R9-558` (releer el registro tras el reset).
