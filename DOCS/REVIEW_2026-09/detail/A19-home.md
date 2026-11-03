# A19 — Home (`app/(tabs)/index.tsx`, 2671 L)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 119 (2026-11-02, en el mismo chat que la
> 118, lo pidió Victor) · Estado **🐛 BUG**
>
> **Resultado:** 2 hallazgos (`R9-437`, `R9-438`, P2), ninguno P0. La carga de Home y sus efectos aguantan; lo
> que falla es el corazón del versículo del día (un estado local que miente) y el progreso de «Continuar
> leyendo» (un cierre viejo en el foco).
>
> **Cómo se midió:** en el principal, sin agentes (`1b04b52`). Dos sondas con `_scratch/S116-correr.cjs.txt`:
> `S119-votdCorazon.test.tsx.txt` (la `VerseOfDayCard` real con el `onFavorite` de Home copiado tal cual) y
> `S119-homeFoco.test.tsx.txt` (la pantalla real montada: los contextos con objetos estables, los hijos pesados
> de relleno y un `useFocusEffect` con la semántica de react-navigation, que en cada foco llama al callback
> guardado por el último efecto).

## El área

`app/(tabs)/index.tsx`: 10 efectos, 12 `await`, 58 imports; el render a partir de `:736`, los estilos desde
`:2349`. Lo ya dicho, no re-derivado: Fable, área 28 (versículo del día con historial y «ver también en»,
check-in de sentimientos, racha, «Continuar leyendo», planes, guardados; su BUG-8, compartir, es de
`ShareService`, fila `A22`); `R9-172` (el día del versículo, del dato y de la profecía, corrido una hora con
horario de verano: `getDayOfYear`); `R9-410`..`R9-412` (`A12`, lo que cae por debajo del boundary en
`:1586`). Las pruebas que ya hay: `heroNudgeRoute`, `verseOfDayHistory`, `verseOfDayAlternates`,
`verseOfDayCardA11yNesting`.

## Hallazgos

**`R9-437` (P2): el corazón del versículo del día no dice si el versículo es favorito, y «Quitar de favoritos»
no quita nada.**

- `src/components/celestial/VerseOfDayCard.tsx:253`: el corazón es estado local (`isFavorited`, empieza en
  `false`, sin prop que lo siembre) y `handleFavorite` (`:272-275`) lo invierte en cada toque. El `onFavorite`
  de Home (`app/(tabs)/index.tsx:1020-1033`) solo agrega: si ya es favorito, no hace nada. Además Home re-monta
  la tarjeta por día (su `key` es `daily-${dailyDayOffset}`, `:937`).
- **Repro:** (a) un versículo del día que ya está en Favoritos (guardado ayer en el lector, o hoy y después de
  reiniciar, o al ir a «Ayer» y volver): el corazón sale vacío, «Añadir a favoritos». (b) Tocar el corazón
  (agrega, se pinta) y tocarlo otra vez, «Quitar de favoritos»: se vacía, pero el versículo sigue en Favoritos
  (y en su cuenta de Guardados).
- **Sonda:** `_scratch/S119-votdCorazon.test.tsx.txt`: (a) favorito de antes, corazón `"añadir"`: rojo; (b) tras
  el segundo toque, `{"corazon":"añadir","esFavorito":true}`: rojo. Control, el primer toque:
  `{"corazon":"quitar","esFavorito":true}`.
- **Propuesta (sin escribir):** que Home le pase a la tarjeta si es favorito (`isFavorite(...)`) y un
  `onFavorite` que alterne (agregar o quitar), como el lector.

**`R9-438` (P2): al volver a Home, «Continuar leyendo» muestra el progreso del capítulo de cuando se montó la
pantalla, no el de ahora.**

- `app/(tabs)/index.tsx:390-394`: `useFocusEffect(useCallback(() => loadHomeData(), [selectedVersion.id,
achievementService, servicesInitialized]))`. En cada foco corre el `loadHomeData` del render en que cambiaron
  esas dependencias, con su `getChapterProgress` (`:213`), que en el provider cierra sobre el estado `progress`
  de su render (`src/context/ReadingProgressContext.tsx:216-218`). La referencia (`getReadingProgress`, de la
  base) sí se refresca; el porcentaje (`:536-543`) no.
- **Repro:** abrir la app (Home se monta) → leer un capítulo hasta la mitad → volver a Home: «Juan 3:1» con
  «0%». El número queda congelado toda la sesión, hasta cambiar de versión. Es lo que vio Fable en el área 28:
  tras leer 1 Pedro 2, «1 Pedro 2:1 · 0%».
- **Sonda:** `_scratch/S119-homeFoco.test.tsx.txt`: tras leer Juan 3 al 40 % y volver,
  `{"ref":["Juan 3:1"],"pct":["0%"]}`: rojo. Controles: la referencia sí cambia (de «Juan 2:1» a «Juan 3:1»), y
  Home montada de cero con el mismo mapa da `{"ref":["Juan 3:1"],"pct":["40%"]}`.
- **Propuesta (sin escribir):** leer el progreso con un `ref` al `getChapterProgress` actual (o calcular el %
  en el render desde `lastRead`), en vez de dentro del cierre del foco.

## Revisado sin hallazgo

- **La carga (`loadHomeData`, `:478-572`):** cada lectura con su caída (`.catch(() => 0)`/`null`), el error con
  un aviso y «Reintentar»; el versículo del día en la versión elegida, con el día navegado por el `ref`
  (`:293-318`, `:484-486`).
- **Los efectos con respuesta en vuelo:** las conexiones de estudio (`:326-347`), el cumplimiento de «Cristo en
  este pasaje» (`:406-435`) y la posición del audio (`:442-452`) se cancelan al cambiar.
- **«Continuar leyendo» y su ruta:** el lector guarda siempre el versículo 1
  (`app/(tabs)/verse/[book]/[chapter].tsx:960`), así que la tarjeta («Juan 3:1») y el destino (el capítulo)
  coinciden. `heroNudgeRoute` (`:172-184`) tiene su prueba.
- **Planes y Juntos** (`:1586-1680`): se leen en el render, frescos.
- **Lo que también queda viejo en el cierre del foco:** `t` y `toast` (solo en el aviso de error,
  `:566-570`): sin daño visible fuera de un cambio de idioma con un error de carga a la vez.

## Sin medir

- **El foco contra el historial:** un `loadHomeData` en vuelo (al volver a Home) que termina después de tocar
  «←» escribe el versículo de hoy bajo «Ayer» (`:517-519` contra `:296-318`). La ventana es lo que tarda la
  carga; sin escenario humano en jest: Modo C.
- **La medianoche con Home abierta:** el versículo, la profecía y el dato del día (`:600-608`, memoizados sin
  el día) no cambian hasta el próximo foco; es la familia de `R9-172`.
- **Cruce con las vecinas:** `R9-438` es la misma forma que `R9-435` de `A18` (un callback que trae el cierre
  del render en que se creó); `A20` (Ajustes) y `A28` (hooks compartidos) conviene mirarlos con esa lente
  (`useFocusEffect` con dependencias de menos).
