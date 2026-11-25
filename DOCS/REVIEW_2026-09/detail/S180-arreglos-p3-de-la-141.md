# Sesión 180 — los cuatro P3 de la 141, antes de la tanda 2

> 2026-11-24. Opus 5.5 de principal, sin agentes, en `fix/s180` desde main `586d98b6` (la 179 ya mergeada). Cuatro
> commits: `ec99241a` (`R9-570`), `4f4c24e3` (`R9-571` y `R9-572`), `dd758313` (`R9-573`) y `62ee160c` (dos
> `import React` que `tsc` rechazaba en las pruebas nuevas). Emulador solo para `R9-570`. Validate verde: 440
> suites, 5205 pruebas. Al cerrar: **271 abiertos de 632** (0 P0, 1 P1, 84 P2, 185 P3 y un aviso).

## 1. Resumen

| Id       | Qué era                                                  | Arreglo                                                            | Prueba (vista fallar)                                                   | En vivo                                |
| -------- | -------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------- |
| `R9-570` | con el pack ausente, cada frío duplica los recordatorios | una cola por tipo en `NotificationService`                         | `notificationRescheduleSerialized` (el `AppContent` real)               | 14 alarmas; el control sin la cola, 26 |
| `R9-571` | la ✕ no pliega: el siguiente audio abre expandido        | `hidePlayer` pliega el ref antes de `stop()`                       | `miniAudioPlayerCloseRealProvider`                                      | no hizo falta (proveedor real en jest) |
| `R9-572` | la prueba de `R9-427` mide un `hidePlayer` simulado      | prueba nueva con el proveedor real                                 | roja antes del arreglo de `R9-571`: 248                                 | —                                      |
| `R9-573` | «al final del libro» en una lista no vence               | se oculta con una lista; uno arrastrado vence al final de la lista | `audioSleepTimerEndOfChapter`, `sleepTimerModalEndOfBook` y el cableado | no hizo falta                          |

## 2. `R9-570`: una cola por tipo

- **Leído:** el efecto de `app/_layout.tsx:180-198` refresca los seis recordatorios cada vez que cambia
  `selectedVersion.id`. `scheduleDailyVerseNotifications` y sus cinco hermanos cancelan su tipo y después programan
  14 días, con un `await` por día. Nadie los serializaba.
- **El arreglo:** `serializeByType(tipo, tarea)` encadena cada tarea detrás de la anterior del mismo tipo. Así pasan
  las seis `schedule*` exportadas (el cuerpo queda en `schedule*Now`) y las cancelaciones del apagado
  (`cancelDailyVerseNotifications` y los cinco `set*Enabled(false)`). Dentro de la cola, el cuerpo cancela directo
  (si no, se espera a sí mismo). La cola guarda la promesa con un `catch`: una tarea que falla rechaza a su
  llamador y no atasca a las siguientes.
- **Quién consume:** `app/_layout.tsx` (los seis `refresh*`), `NotificationsSettings.tsx` (activar, apagar y cambiar
  la hora) y `PropheticReminderRouter.tsx` (solo lee la respuesta al toque, no programa). Las firmas no cambian.
- **La prueba** monta el `AppContent` real con el servicio real. Solo se simulan las fronteras: `expo-notifications`
  como un almacén con estado, en el que cada llamada cede un macrotask como el puente nativo, y `getVerse` por
  versión (KJV sin filas). Una compuerta en el primer `getVerse` de KJV deja la primera corrida a mitad de camino
  mientras la versión cae a WEB; sin esa compuerta, la corrida terminaba antes de que `waitFor` la viera, y la prueba
  pasaba sin el arreglo (vista así antes de agregarla). Sin el arreglo: 26 y cuerpos genéricos, lo de la 141.
- **Matriz de vecinos:** los cinco hermanos con dos refrescos a la vez, dos cambios de versión seguidos en Ajustes
  (gana el último), apagar a mitad de una reprogramación, una tarea que falla y otra detrás, y que el versículo del
  día no cancela otros tipos. Revert por pieza (`_scratch/S180-570-revert.out.txt`):

| Pieza revertida                | Cae                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| A, la cola (`task()` directo)  | el frío real, Ajustes, los cinco hermanos y el apagado (8)                                 |
| B, el apagado fuera de la cola | solo el apagado                                                                            |
| C, el `catch` de la cola       | la tarea que falla, y el caso siguiente del archivo (la cola es de módulo: el atasco dura) |

- **En vivo** (`_scratch/S180-570-frio.sh.txt`, salidas en `S180-sondas/`): `Pixel_9_Pro` (su snapshot trae el APK
  debug vc73, el de la 141), `pm clear`, un primer arranque para sembrar la base, y en RKStorage
  `@onboarding_completed`, `@bible_version = KJV` (el pack no está) y el recordatorio a las 8. Sin cuenta de Google.
  Tres fríos con el arreglo: dos corridas en serie (0,36 s de una a otra), **14 alarmas** en 14 horas distintas, 14
  entradas con texto en el almacén de expo-notifications. El control, con la pieza A quitada en el árbol y servida
  por Metro: **26 alarmas**, 12 con el cuerpo genérico y 14 con texto. (14 y no 13 porque eran las 21:30 y las 8 de
  mañana todavía cuentan.)
- **Costo conocido:** los `refresh*` leen las preferencias antes de entrar a la cola. Apagar el recordatorio entre
  esa lectura y la reprogramación del arranque, en el primer segundo, lo vuelve a programar. Ya existía, y no tiene
  camino práctico. Va anotado en la entrada; no se abre.

## 3. `R9-572` primero, después `R9-571`

- **La prueba nueva** (`miniAudioPlayerCloseRealProvider.test.tsx`) monta el `AudioPlayerProvider` real con el
  `MiniAudioPlayer` real y las mismas fronteras que la prueba de `R9-427` (Reanimated con `useSharedValue`
  persistente e `interpolate` lineal, los hijos pesados, tema e idioma), más `expo-speech` y la versión. El
  recorrido es el del usuario: cargar un capítulo, expandir con el botón, la ✕ y cargar el siguiente. **Roja antes
  del arreglo** (`_scratch/S180-572-rojo.out.txt`): 248 de alto, con la vista expandida, que es lo que se vio en vivo
  en la 141. La medida visible va primero y el estado después, para que el revert no tumbe solo la primera
  aserción. Dos controles: la ✕ sigue parando y llevando el índice a 0, y el pliegue con el chevron.
- **El arreglo de `R9-571`:** `hidePlayer` hace `stateRef.current = {...stateRef.current, isExpanded: false}` antes de
  `stop()`. `stop()` arma el estado desde el ref y lo pone como objeto, así que su escritura lleva el pliegue. El
  updater que había se quitó: quitarlo no tumba nada (pieza B), y una guarda equivalente se quita.
- **Revert por pieza** (`_scratch/S180-571-revert.out.txt`):

| Pieza revertida                                   | Cae                                                            |
| ------------------------------------------------- | -------------------------------------------------------------- |
| A, el ref                                         | la prueba nueva (248)                                          |
| B, el updater                                     | nada: era redundante, se quitó                                 |
| C, el efecto de `R9-427` (con `R9-571` arreglado) | la prueba nueva, más el caso principal y el espejo de la vieja |

La C es lo que la 141 anticipó: con la ✕ plegando de verdad, el efecto de `R9-427` es el que evita el estado
roto (`isExpanded = false` con `expandProgress = 1`) en el camino real.

- **La prueba vieja** se queda como contrato del efecto. Su cabecera ahora lo dice, y el comentario del `hidePlayer`
  simulado deja de afirmar algo que el real no hacía.
- **Quién consume `isExpanded`:** solo `MiniAudioPlayer` (y el tipo y el contexto web, con su `noop`).
- **Vecinos medidos** (`_scratch/S180-571-vecinos.out.txt`, el proveedor real): un `expand()` seguido de `pause()` o
  `stop()` en el mismo tick pierde la expansión, porque los dos arman el estado desde el ref. En actos separados se
  conserva. Dos `hidePlayer` seguidos quedan plegados. No tiene camino de usuario: cada toque es su propio evento, y
  el ref se renueva entre medio. Queda anotado en `R9-571`.

## 4. `R9-573`: la decisión

- **Las opciones:** (a) vencer al terminar el libro del ítem actual; (b) ocultar la opción con una lista; (c)
  tratarla como «al final de la lista».
- **Decidido: (b), y para un temporizador ya armado, (c).** Una lista no tiene libro propio. Con (a), una lista de
  favoritos de libros distintos se cortaría después del primer versículo. Y «al final de la lista» ya es lo que hace
  «Fin del capítulo» sobre una lista: ofrecer las dos serían dos botones con el mismo efecto, y uno con un nombre que
  promete otra cosa. Pero un temporizador «al final del libro» armado sobre un capítulo puede seguir activo cuando
  se carga una lista: ese vence al final de la lista y se consume, igual que «Fin del capítulo». Ningún texto cambia,
  así que no hay nada que traducir.
- **El arreglo:** `SleepTimerModal` recibe `showEndOfBook` (por defecto `true`), y `MiniAudioPlayer` le pasa
  `!isPlaylistQueue`. En el `onDone` del último ítem, el motor calcula `stoppedBySleepTimer` con «al final del
  capítulo», o con «al final del libro» si la cola es una lista. Eso gana a la repetición, consume el temporizador y
  no sube `chapterEndCount` (el avanzador igual sale por la lista).
- **Pruebas:** en `audioSleepTimerEndOfChapter.test.tsx` (el proveedor y el avanzador reales), lista con repetición,
  lista sin repetición y dos controles: sin temporizador da la vuelta, y un temporizador de minutos también.
  `sleepTimerModalEndOfBook.test.tsx`, el modal real en es y en. Y el cableado: capítulo → lista → capítulo da
  `true`, `false`, `true`. Revert por pieza (`_scratch/S180-573-revert.out.txt`): el motor tumba los dos casos de la
  lista, el cableado su caso y el modal sus dos idiomas, cada uno solo lo suyo.
- **Queda:** con un temporizador arrastrado de un capítulo, la pastilla de la lista dice «Se detendrá al terminar el
  libro», y vence al terminar la lista. Es menor y no se abre. Vecino sin tocar: «Fin del capítulo» se llama así
  también sobre una lista.

## 5. Para la 181

La revisión del diff, según el riesgo: el audio y el arranque, con emulador. Para ver en vivo: la ✕ y el siguiente
audio plegado (el TTS del emulador dispara sus callbacks, medido en la 141); una lista de favoritos sin «Fin del
libro»; un temporizador «al final del libro» puesto sobre un capítulo y llevado a una lista; los recordatorios en un
frío con el pack presente y en dos cambios seguidos de versión en Ajustes. También, si la cola no demora algo
visible: activar un recordatorio en Ajustes mientras corre la reprogramación del arranque.
