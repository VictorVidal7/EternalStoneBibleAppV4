# Sesión 172: revisión del diff de la 171 (la tanda V5)

2026-11-23. Opus 5.5 principal, `high`, sin agentes. Emulador `Pixel_9_Pro` `-read-only`, APK debug vc73, Metro.
Cortada a las ~100 llamadas tras los puntos 1, 2 y 4; la 172b (chat nuevo) hizo el punto 3, midió la barra de
estado y cerró. Estado de partida: main = origin/main = `32f866e0`; validador 0 y 0, 275 abiertos de 620.

## 1. El tema (`isReaderThemeDark`)

- **Por código:** en `[chapter].tsx` el único que decide por oscuridad es `readerIsDark` (la barra, `:3064`). Todo lo
  que se pinta dentro de la barra (texto, íconos, «más acciones», selector de resaltado, `AlsoInVersionsPanel`) usa
  `effectiveColors` de la paleta de lectura. `ContextualHintBanner` usa la paleta de la app sobre su propia tarjeta
  (coherente consigo misma). `ImmersiveReader` es otra superficie, con su propio fondo. Las hojas son de la app.
- **Sonda de contraste** (`_scratch/S172-sondas/zzS172Probe.test.ts.txt`): 8 temas × app clara/oscura, la barra
  compuesta sobre el `background` real. Texto ≥ 10.7:1 en los 16 casos; secundario ≥ 5.86; primario (solo íconos,
  pide 3:1) ≥ 3.64 (Papel y `system`/oscura, de antes de la 171).
- **Emulador** (capturas en `_scratch/S172-sondas/`): Crepúsculo/clara (barra, «más», selector), Crepúsculo/oscura
  (selector), Noche/clara y oscura, Papel/clara y oscura (barra con «más» abierto). Todas legibles: barra oscura en
  temas oscuros y clara en los claros, sin importar la app. El tema premium se puso escribiendo
  `@reader_preferences` en el RKStorage del AVD (`S172-rkset.sh.txt`), instancia de solo lectura.
- **Nuevo (P3, `R9-621`): la barra de estado del sistema no sigue al tema de lectura.** Papel con la app (y
  el sistema) en oscuro: los íconos y la hora salen blancos sobre la cabecera crema del lector, casi invisibles
  (`S172-papel-appD.png`). La app no maneja `StatusBar` en ninguna pantalla salvo onboarding e inmersivo
  (`grep`). Con Crepúsculo y el sistema claro los íconos también salieron blancos (`S172-crep-appL-bar.png`): la causa,
  medida en la 172b, en el §5. No lo trae la 171.

## 2. El plazo (`withTimeout`)

Sonda con la sección real (`zzS172Timeout.test.tsx.txt`, fake timers):

| Caso                                                             | Resultado                                    |
| ---------------------------------------------------------------- | -------------------------------------------- |
| Cambio BUENO: cabeceras a 10 s, cuerpo 4 s después               | la lista sale, sin error                     |
| Desmontaje a los 5 s con el plazo pendiente                      | 0 `console.error`, nada revienta             |
| La respuesta vieja (ignora el abort) llega DESPUÉS del reintento | se ve la del reintento, la vieja se descarta |
| La vieja llega con el reintento todavía pendiente                | sigue «cargando»; al plazo, «Reintentar»     |

- «Reintentar» solo se ve con `!loading`: no hay dos cargas solapadas desde el botón.
- `versions.json` pesa 1.8 KB: 15 s de total (cabeceras + cuerpo) alcanzan en una red lenta pero viva.
- Nadie depende del `fetch` de un argumento: ningún código envuelve `global.fetch`; la única prueba con
  `toHaveBeenCalledWith` sobre `fetch` es de `redLetterText.web` (no tocado). RN 0.86 trae `AbortController`.
- Sin hallazgos.

## 4. La fusión con un plan borrado (`R9-146`)

Sonda con el provider real (`zzS172Merge.test.tsx.txt`): X borrado y terminado (inicio 1-sep, sello 20-sep, días
1-3), Y empezado el 1-nov con el día 1, editado al contenido de X → `{completedDays:[1,2,3],
startedAt:"2026-11-01", completedAt:"2026-09-20"}`.

- **Nuevo (P3, `R9-622`): la fusión empareja el inicio del plan editado con el sello de otro, y queda terminado ANTES de
  empezar.** Antes de la 171 el destino quedaba entero (par coherente, y el progreso de Y se perdía). La prueba de la
  171 lo fija (`readingPlanProgressContext.test.tsx`, «R9-64: a target with progress merges…»: inicio 1-nov, sello
  5-oct, y 3 de 4 días con sello). Consumidores de `completedAt` hoy: el texto del diálogo de reinicio
  (`plan/[id].tsx:872`) y la línea de tiempo, que solo recorre `READING_PLANS` (curados, no propios): sin daño
  visible hoy. Daño latente si la línea de tiempo suma los planes propios.
- La resurrección del plan borrado ya terminado es `R9-146` (abierto, P3): la 171 no la empeora.

## 3. Los planes en el emulador (la 172b)

Instancia de solo lectura del AVD, app en inglés, Metro. El estado se leyó del disco (`leer`, RKStorage) tras cada
paso; los toasts, con ráfagas de capturas (`_scratch/S172b-ver.sh.txt`, sin toque; `S172b-<caso>-v*.png`).

| Caso                                                      | Resultado                                                                   |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| A: `iam-7` empezado, día 1 destildado, leer Efesios 6 5 s | `49:6` leído, `completedDays: []`; 16 capturas iguales de 4 a 9,5 s         |
| B: releer Juan 6 (el día 1)                               | toast «✅ Day 1 of "The "I Am" Sayings of Jesus" completed»; en disco `[1]` |
| C: plan propio Juan 4-8 (1 cap./día) con Juan 6 ya leído  | `completedDays: []`, el chip de Juan 6 con su ✓; ver abajo                  |
| D: el plan propio con los 5 días, editado a 2             | «2/2 days completed · 100%» en la pantalla y «2/2 · Completed!» en Inicio   |

- **Caso C, cómo se entiende.** El día 3 sale sin tildar y su chip con el ✓ de leído: se lee como «el capítulo lo
  leíste, el día no lo marcaste». El plan curado lo resuelve distinto: con capítulos leídos antes de empezar
  muestra la tarjeta «You're already moving» y «Start officially» tilda esos días. El constructor y Juntos
  (`setPlanStart`) no la muestran. Solo anotado.
- **Caso D, en disco:** `custom-qth02a` con `[1,2]`, el inicio y el sello del plan de 5 días (que terminó con los
  5): la migración recorta en el dato.
- **Nuevo (P2): `R9-623`.** En el caso C el día 3 apareció tildado 12 s después de crear el plan, sin tocar nada.
  El log lo explica: el lector de Juan 6 seguía montado en la pila y su temporizador de 5 s se re-agendó con el
  aviso «creado» (`R9-465`: el `value` de Toast cambia en cada render). Desde la 171 releer el capítulo de un día
  lo completa, así que esa relectura fantasma tilda el día. Medido aparte: con el día 3 destildado (en disco
  `[]`), un aviso ajeno en el constructor lo re-tilda con el toast falso; sin aviso, 20 s quieto, sigue `[]`. Es
  el daño de `R9-54` por otra vía, y deshace también el cambio de conducta del caso C. La pila se armó con enlaces
  y con el `router.replace` del constructor: la ruta natural por pestañas queda sin medir.
- **Suma a `R9-465`:** la cuenta inflada se ve en vivo: con unos 166 versículos leídos (95 distintos), el hito
  marcaba 758/1000 y saltó «Devoted Reader» (500).
- Un toque tapado por el modal de logros no es un hallazgo: el modal de «Diligent Student» se abrió encima del plan
  y se comió el «Read».

## 5. La barra de estado: qué decide el estilo (punto 2 de la 172b)

- Con el sistema claro, `dumpsys window` da `mLastAppearance=LIGHT_NAVIGATION_BARS`, sin `LIGHT_STATUS_BARS`: la
  barra de navegación sigue al sistema y la de estado no. La hora y los íconos salen blancos también en Inicio y en
  el lector (`S172-p3-home2.png`, `S172-a1-now.png`), no solo con Crepúsculo.
- Nadie fija el estilo: el tema nativo (`AppTheme`, DayNight, de prebuild) no trae `windowLightStatusBar`; el
  edge-to-edge de RN solo pone `isAppearanceLightNavigationBars = !isDarkMode` (`WindowUtil.kt:189`). La app usa
  `StatusBar` solo en onboarding (`light-content`) e inmersivo (`hidden`). Por eso sale blanco en los dos modos:
  invisible sobre fondos claros (Papel con el sistema oscuro; cualquier pantalla clara con el sistema claro).
- Entrada `R9-621` (P3). El arreglo tiene que seguir a la superficie: en el lector, el tema de lectura.

## 6. Estado al cerrar

- Sin cambios de código. Entradas nuevas: `R9-621` (P3, barra de estado), `R9-622` (P3, el sello de la fusión) y
  `R9-623` (P2); suma a `R9-465`. **278 abiertos de 623** (0 P0, 3 P1, 88 P2, 186 P3 y un aviso). Validador 0 y 0.
- Con un P2 nuevo, la regla «Según el riesgo» pide arreglos: **la 173 arregla `R9-623` con `R9-465`** (el mismo
  mecanismo) y, si cabe, `R9-622` (el mismo archivo que `R9-54`). `R9-51` pasa a la 174.
- Sondas jest en `_scratch/S172-sondas/*.txt`, fuera de `testMatch`. Emulador y Metro apagados (el Metro de la
  172 seguía vivo; lo reusó la 172b).
