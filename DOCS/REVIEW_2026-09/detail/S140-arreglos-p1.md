# S140 — arreglos, tanda 1: los tres P1 abiertos

> **Sesión 140 (2026-11-11).** La PRIMERA de la fase de ARREGLOS. En un chat nuevo, en la terminal, sin agentes,
> con **Fable 5.2 como modelo principal** (decisión de Victor del 2026-11-11, §7 de `CONTINUAR.md`).
>
> **Resultado:** arreglados `R9-424`, `R9-425` y `R9-427`, los únicos P1 abiertos, un commit por hallazgo en
> `fix/s140-p1`, cada uno con su prueba de regresión **vista FALLAR sin el arreglo** con el síntoma del bug. Un
> hallazgo nuevo por lectura, `R9-569` (P3). `R9-558` no comparte la raíz con `R9-424` y espera su tanda. Sin
> verificación en vivo: va en la 141, que revisa este diff.

## Cómo se trabajó

- **Leído antes de diseñar:** las cuatro entradas (`R9-424`, `R9-425`, `R9-427`, `R9-558`) con sus detalles, y las
  tres sondas viejas (`_scratch/S116-sondas-agente-2/`, `S116-sondas-agente-3/`, `S117-expandProgress.test.tsx.txt`).
  Cada prueba nueva sale de su sonda, limpia para `tsc`, eslint y prettier.
- **El revert por pieza:** `_scratch/S140-rev.sh.txt` (`save` guarda el archivo bueno; el revert se hace con Edit;
  `run` escribe el `diff` del revert contra el bueno, corre jest, restaura y compara con `cmp`). Salidas:
  `S140-<pieza>.revdiff.txt` y `S140-<pieza>.rev.out.txt`.
- **Antes de cada commit:** eslint y prettier sobre los archivos tocados, `tsc --noEmit` entero y las suites
  vecinas.

| Hallazgo | Commit     | Archivo de `src/`                                   | Prueba                                                |
| -------- | ---------- | --------------------------------------------------- | ----------------------------------------------------- |
| `R9-424` | `7d4a511f` | `src/hooks/useBibleVersion.tsx`                     | `__tests__/bibleVersionColdStart.test.tsx`            |
| `R9-425` | `a6a0ef13` | `src/features/audio/context/AudioPlayerContext.tsx` | `__tests__/audioSleepTimerEndOfChapter.test.tsx`      |
| `R9-427` | `e8700067` | `src/features/audio/components/MiniAudioPlayer.tsx` | `__tests__/miniAudioPlayerCloseResetsExpand.test.tsx` |

## `R9-424`: la versión descargada elegida sobrevive al arranque en frío

- **El arreglo:** un estado `installedKnown` en `BibleVersionProvider`. `refreshInstalledVersions` lo marca en el
  `finally`, después de los ids (mismo lote). La red de seguridad (`:113-127`) no corre hasta entonces.
- **Por qué en el `finally`:** con la base que falla, la lista queda en las empaquetadas, y sin la bandera una
  versión descargada quedaría elegida toda la sesión sin saber si está. Así el fallo se comporta como antes.
- **`R9-558`, leído antes de diseñar: no comparte la raíz.** Acá la red corría antes de que el registro
  respondiera; allá el reset borra los packs y sus banderas y nadie refresca el registro ni toca la elegida. Lo
  único común es que la red no escribe `@bible_version`, y eso se dejó como está a propósito (abajo). Su arreglo
  pide además una decisión de texto (qué promete el diálogo, en los dos idiomas).

| Caso                                  | Con el arreglo                   | Sin la guarda          | Sin el `finally` |
| ------------------------------------- | -------------------------------- | ---------------------- | ---------------- |
| `en`, KJV guardada, `getItem` primero | KJV antes y después de la base   | **WEB**                | KJV              |
| `es`, RV1909 guardada (el espejo)     | RV1909                           | **RVR1960**            | RV1909           |
| control: la base primero              | KJV                              | KJV                    | KJV              |
| el pack NO está en la base            | cae a WEB; la clave sigue en KJV | igual                  | igual            |
| la base falla                         | KJV hasta el fallo, después WEB  | WEB desde el `getItem` | **KJV** se queda |
| control: sin versión guardada         | WEB (sigue al idioma)            | igual                  | igual            |

- **Costos conocidos:**
  1. **La red sigue sin escribir la clave.** Si la escribiera, una lectura parcial del registro (`R9-569`) dejaría
     la caída como la elección del usuario, para siempre. Con el pack ausente de verdad (borrado desde Gestionar
     versiones, o el estado de `R9-558`), las siete pantallas que leen la clave directo siguen sin texto.
  2. **Ventana nueva:** con el pack ausente, `selectedVersion` es la versión sin filas desde el `getItem` hasta la
     respuesta de la base (antes duraba un render). Qué pinta el lector en ese rato (`R9-559`), sin medir: para la
     141, en vivo, con el estado de `R9-558`.
  3. `setVersion` sigue rechazando en silencio una versión que no está entre las disponibles; antes de la
     respuesta de la base eso incluye las descargadas. Sin camino conocido en el arranque.

## `R9-425`: el temporizador «al final del capítulo» para

- **El arreglo, distinto de la propuesta:** lo honra el motor. En el `onDone` del último versículo
  (`AudioPlayerContext.tsx:569-596`), si el modo era `end-of-chapter`, se cancela el temporizador y **no** se sube
  `chapterEndCount`. La propuesta era que el aviso llevara el modo; pero el avanzador es el único lector de la señal
  (buscado en `app/` y `src/`), y la rama de la lista en repetición, tres líneas arriba, ya decide con el mismo
  valor fresco. Un solo sitio decide.
- **Sin tocar:** `AudioChapterAdvancer.tsx` y `shouldAdvanceChapter` (su rama `end-of-chapter` queda como defensa).

| Caso                                                    | Con el arreglo                                        | Con la señal subida siempre |
| ------------------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| control: sin temporizador                               | pasa a «Juan 4:1»                                     | igual                       |
| «al final del capítulo»                                 | para en «Juan 3:2»; `getChapter` 0 veces; modo `null` | **`getChapter` 1 vez**      |
| tras el temporizador consumido, reproducir de nuevo     | el fin de capítulo siguiente avanza                   | **ya había avanzado**       |
| espejo: «al final del libro», a mitad de libro          | avanza; el temporizador sigue                         | igual                       |
| espejo: «al final del libro», último capítulo (Juan 21) | para; modo `null`                                     | igual                       |
| control: avance continuo apagado                        | para                                                  | igual                       |

- **Vecinos, sin tocar:**
  - `R9-426` (P2): lo parado en el hueco entre dos versículos o dos capítulos vuelve a sonar. Su tanda.
  - El bucle de memorización va antes que el fin de capítulo (`:543-553`): con «repetir versículo» el capítulo no
    termina y el temporizador «al final del capítulo» no vence. Por lectura; coherente con «repetir hasta que lo
    apague», sin número.
- **Verificación:** jest y lectura. El emulador no tiene voces de TTS (`ExpoSpeech.getVoices` rechaza).

## `R9-427`: el reproductor cerrado con la ✕ vuelve plegado

- **El arreglo:** un efecto en `MiniAudioPlayer.tsx:180-197`: `expandProgress` sigue a `state.isExpanded`. Con el
  reproductor oculto asigna el valor directo y pone `translateY` en 0; visible, lanza el mismo resorte que los
  manejadores.
- **Los manejadores, sin tocar:** siguen lanzando el resorte en el toque (no un render después). El efecto lo
  vuelve a lanzar al mismo destino; Reanimated 4.5.1 lo continúa (`spring.ts`, `isTriggeredTwice`), por lectura.
- **La prueba necesita dos piezas con su semántica real,** como la sonda de la 117: `useSharedValue` que persiste
  entre renders e `interpolate` lineal. Con el mock de fábrica es verde con y sin el arreglo.

| Caso                                            | Con el arreglo                 | Sin el efecto                            |
| ----------------------------------------------- | ------------------------------ | ---------------------------------------- |
| expandir → ✕ → mostrar                          | 64, plegado; expandir responde | **248**, plegado opacidad 0, expandido 1 |
| control: expandir → chevron → ocultar → mostrar | 64, plegado                    | igual                                    |
| espejo: el estado se expande sin el botón local | 248, expandido                 | **64**, la vista expandida invisible     |
| oculto estando expandido (no la ✕) → mostrar    | 248, expandido                 | igual                                    |

- **Lo que jest no ve** (su `withSpring` es instantáneo, y los estilos animados solo se recalculan al renderizar):
  la rama «oculto» contra un resorte, y un tirón por el doble resorte al plegar o expandir. Para la 141, en vivo.
- **El espejo no tiene camino en la app hoy:** nadie fuera del reproductor llama a `expand`. Cubre el contrato del
  efecto.

## Nuevo

- **`R9-569` (P3, por lectura):** el registro de versiones se lee una sola vez, al montar, a la par de la recarga
  de arranque; por el camino de respaldo puede quedar parcial toda la sesión. Es la razón del costo 1 de `R9-424`.

## Para la 141 (la revisión de este diff)

- **En vivo, con emulador:** `R9-424` (descargar KJV, elegirla, frío: el lector y las siete pantallas en KJV; dos
  fríos seguidos); la ventana del costo 2 con el estado de `R9-558`; el reproductor (`R9-427`) si llega a mostrarse
  sin voces: expandir, ✕, volver a reproducir, y el plegado normal sin tirones.
- **Por lectura y con jest:** `R9-425` y los vecinos de cada arreglo (§5: el arreglo deja el vecino abierto).
