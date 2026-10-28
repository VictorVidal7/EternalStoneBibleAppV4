# C16 — Gating free vs premium en toda la Mesa (Modo C, sesión 115)

**Estado: ✅ OK, ningún hallazgo nuevo.** Agente 4, `emulator-5560`. El entorno de la 115, en
`detail/C15-hoja-ofrenda.md`.

- **15 gates** inventariados por código en `d34bd4d` (con `file:line` en el informe); ningún store de la Mesa
  lee `isPremium`, así que bajar a free no borra nada por código.
- **Free:** cada gate se queda cerrado por toque, por deep link (en frío y en caliente) y con atrás; los
  teasers abren la hoja de ofrenda real. Los deep links a una serie y a una ilustración reales muestran el
  teaser sin filtrar nombre ni texto, y abrir el editor en free no borra la ilustración. Notas,
  autoevaluación, «Copiar bosquejo» y «Compartir estudio» siguen gratis, por diseño.
- **Premium:** todo abre; serie, ilustración y nota creadas y guardadas.
- **Transiciones:** la Mesa montada debajo de Ajustes se repinta al encender; el púlpito montado pasa al
  teaser al apagar; premium → free → frío → premium deja intactas serie, ilustración, entrada del historial y
  nota (**sin pérdida de datos**).
- **Hecho duro para el Modo C:** el toggle de dev NO sobrevive a un arranque en frío: RevenueCat responde y
  gana (`PremiumContext.tsx:74-85`), el diseño de `R9-9`/`R9-10`.
- **Sin medir:** la caída real del derecho vía RevenueCat con una pantalla abierta (no se provoca en el
  emulador; el toggle recorre la misma rama de render); la generación del PDF y la descarga de originales
  (función, no gate; ✅ en Fable). Nada cruzó con la adopción de la Mesa ni con su cola (`R9-330`/`R9-327`,
  Pendiente).

Evidencia: `_scratch/S115-sondas-agente-4/`.

---

## Informe del agente 4 (tal cual)

## S115 — agente 4 — `C16` (gating free vs premium en toda la Mesa)

Worktree en `d34bd4d` (verificado). Serial: `emulator-5560` (instancia de solo lectura de `Pixel_9_Pro`).

### Veredicto: `C16` ✅ OK (sin hallazgos nuevos)

Los 15 gates de la Mesa retienen en free (tap, deep link en frío y en caliente, atrás sobre pantallas viejas
de la pila) y abren en premium; los teasers llaman a la hoja de ofrenda REAL. Bajar a free con pantallas
montadas las pasa al teaser en el acto, y **no se pierde nada**: la nota, la serie y la ilustración creadas
en premium siguen en el almacenamiento y vuelven intactas al subir otra vez, también tras un arranque en frío.

**Hoja de ofrenda:** solo se ABRIÓ (3 veces: historial, PDF, púlpito) y se cerró con atrás. **Nunca se tocó
un nivel (MX$17/49/119) ni «Restaurar».** Lo de la regla nueva del orquestador no aplica a nada de lo hecho.

Estado: el emulador `emulator-5560` se cayó una vez antes de medir (no fue la app); el orquestador lo
rearrancó con `pm clear` y todo lo medido es de la instancia nueva.

### 1. Inventario de gates de la Mesa (código de HOY, `d34bd4d`)

Patrón común de las pantallas auto-protegidas: `usePremium()` + `useOfferingSheet()`, guarda en el
`useFocusEffect` (`if (!isPremium) return;` antes de `load()`), y rama de teaser `{!isPremium ? (...)}` con
botón «desbloquear» que llama `openOfferingSheet()`. Sin `load()` en free, el estado de la pantalla queda en
su valor inicial: no se lee nada del almacenamiento.

| #   | Gate                                                            | Dónde (file:line)                                                                                                                 | Free              | Premium                                 |
| --- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------- |
| 1   | Historial de preparaciones (pantalla)                           | `app/features/prep/history.tsx:75` (hook), `:118` (guarda de `load`), `:165` (desbloquear), `:218` (teaser)                       | teaser            | lista + buscador                        |
| 2   | Series: lista                                                   | `app/features/prep/series/index.tsx:95`, `:125` (guarda), `:167`, `:249` («+» solo premium), `:289` (teaser)                      | teaser            | lista, crear                            |
| 3   | Series: detalle                                                 | `app/features/prep/series/[id].tsx:159`, `:200` (guarda), `:212`, `:403` (acciones del header solo premium), `:482` (teaser)      | teaser genérico   | detalle, renombrar, borrar, fechas, PDF |
| 4   | Ilustraciones: banco                                            | `app/features/prep/illustrations/index.tsx:118`, `:145` (guarda), `:195`, `:286` («+» solo premium), `:326` (teaser)              | teaser            | banco, crear, insertar                  |
| 5   | Ilustraciones: editor                                           | `app/features/prep/illustrations/[id].tsx:91`, `:137` (guarda), `:144`, `:251` (borrar solo premium), `:278` (teaser)             | teaser            | editar (autoguardado 700 ms)            |
| 6   | Modo púlpito (pantalla)                                         | `app/features/prep/pulpit.tsx:93`, `:133` (guarda de carga), `:201` (keep-awake solo premium), `:256`, `:265` (teaser)            | teaser            | presentador                             |
| 7   | Íconos del header de la Mesa (historial, series, ilustraciones) | `app/features/prep/index.tsx:1572-1659` (hoja verde `leaf-outline` y a11y «— exclusivo» en free); navegan a las pantallas 1, 2, 4 | navegan al teaser | navegan                                 |
| 8   | «Buscar por tema» (header)                                      | `app/features/prep/index.tsx:1663` (solo premium, sin teaser)                                                                     | invisible         | visible                                 |
| 9   | Sugeridor de tema (estado vacío de la Mesa)                     | `app/features/prep/index.tsx:1740`                                                                                                | invisible         | visible                                 |
| 10  | Referencias cruzadas: tope 12 / 40                              | `app/features/prep/index.tsx:324-328` (tope), `:334-341` («+N más»), `:1383`, `:1434`, `:843` (desbloquear)                       | 12 + invitación   | hasta 40                                |
| 11  | Palabras en idioma original                                     | `app/features/prep/index.tsx:696` (guarda de carga), `:838` (desbloquear), `:1977` (teaser)                                       | teaser            | sección                                 |
| 12  | Comparar versiones                                              | `app/features/prep/index.tsx:754` y `:796` (guardas), `:848`, `:2165` (teaser)                                                    | teaser            | sección                                 |
| 13  | Tarjeta del púlpito                                             | `app/features/prep/index.tsx:2713`, `:2729` (teaser), `:1062` (desbloquear); el botón premium navega a 6                          | teaser            | botón                                   |
| 14  | Exportar PDF                                                    | `app/features/prep/index.tsx:1276-1279` (free → hoja de ofrenda, sin hoja de formato), `:2952`, `:2979` (badge)                   | hoja de ofrenda   | hoja de formato                         |
| 15  | Hoja de formato del PDF                                         | `src/features/study/PrepExportFormatSheet.tsx:83`, `:110`; montada en `app/features/prep/index.tsx:3047-3056`                     | nunca se abre     | 4 formatos                              |

Gratis por diseño (sin gate): las notas de las secciones de la Mesa, la autorrevisión
(`app/features/prep/index.tsx:2518`, «free, checkbox-only»), «Copiar bosquejo», «Compartir estudio», y
`app/features/sermon-notes/*` (cabecera: «100% FREE»; no es la Mesa).

Fuera de `app/features/prep/` no hay ningún punto de entrada a series, historial, ilustraciones ni púlpito
(grep de `features/prep/(series|history|illustrations|pulpit)` y de los stores en `app/` y `src/`).

#### Lectura de la transición (por código, a confirmar en el dispositivo)

- **Bajar a free no borra nada por código:** ningún store de la Mesa lee `isPremium`; las pantallas solo
  dejan de llamar a `load()` y pintan el teaser. Lo creado en premium queda en el almacenamiento.
- **El editor de ilustraciones** borra al desmontar un registro «vacío» solo si se CARGÓ
  (`illustrations/[id].tsx:163-176`, `loadedRef`); en free `load()` no corre, así que abrirlo por deep link en
  free no puede borrar nada. Si premium cae con el editor montado y el texto no vacío, no borra.
- **El toggle de dev no sobrevive a un arranque en frío** cuando RevenueCat responde: `PremiumContext.tsx:74-77`
  toma la respuesta de RevenueCat (`offeringService.ts:134-152`, `handleCustomerInfo`) por encima del valor
  guardado (`:79-85`, solo puentea la primera pintura). Con la cuenta anónima sin derecho, un arranque en
  frío con el toggle ENCENDIDO vuelve a free en cuanto RevenueCat habla. Es diseño (`R9-10`), no hallazgo;
  importa para leer las mediciones de la transición «tras un arranque en frío».
- **La hoja de formato abierta cuando premium cae:** las filas pasan a «bloqueadas» salvo «manuscrito»
  (gratis por contrato del componente, `PrepExportFormatSheet.tsx:9`), así que en ese instante un free podría
  exportar el manuscrito. Solo alcanzable con un cambio de derecho con la hoja abierta (el toggle está en
  Ajustes, no se puede tocar con la hoja abierta); sin daño. No es hallazgo.

### 2. Mediciones en el dispositivo

Emulador rearrancado por el orquestador (instancia nueva, `pm clear`, cuenta anónima nueva). Onboarding hecho
a mano (Español, RVR1960, tema por defecto). Nota del entorno: el banner de LogBox («Open debugger to view
warnings») tapaba el botón «Siguiente» del onboarding; se cerró con su X. Las rutas de dispositivo en Git Bash
necesitan `MSYS_NO_PATHCONV=1` también en `uiautomator dump`, y el destino local de `adb pull` en forma
`C:/...` (con `/c/...` el pull falla en silencio).

#### 2.0 Primer arranque, toggle de dev APAGADO, sin tocar nada (dato de `C15`)

- **La app arranca FREE.** En la Mesa (`eternalbible://features/prep?book=John&chapter=3&startVerse=16&endVerse=21`)
  los tres íconos del header dicen «… — Extra — se desbloquea con premium» y «Buscar por tema» no está
  (captura `S115-a4-10-mesa-free.png`, dump `S115-a4-10-mesa-free.xml.txt`).
- Logcat del arranque (`S115-a4-00-arranque-revenuecat.logcat.txt`, filtrado por
  `RevenueCat|customerInfo|entitle|transfer|post|sync|restore|premium|logIn|appUser`): 6 líneas, solo
  `Could not resolve remote config blob(s)` y `Product not found: ofrenda_1..3 - Product Type: subs` (el SDK
  pide los tres productos también como suscripción). **Ningún rastro de publicar/transferir la compra de la
  cuenta de Google del AVD**, y el derecho no llegó al uid anónimo. (El handler de logs de la app los manda
  a `logger.debug`; lo que RevenueCat no loguea a nivel INFO/WARN no se ve.)

#### 2.1 Gates en FREE (toggle apagado)

| Gate                                                                                                     | Acción              | Resultado                                                                                        | Evidencia                                                     |
| -------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Ícono Historial (header)                                                                                 | tap                 | teaser «Encuentra tus preparaciones pasadas», sin lista                                          | `S115-a4-11-historial-free.png`                               |
| Teaser Historial → «Desbloquear con premium»                                                             | tap                 | **hoja de ofrenda REAL** con MX$17.00 / MX$49.00 / MX$119.00; atrás la cierra y vuelve al teaser | `S115-a4-12-historial-desbloquear.png`, `-13-tras-cerrar.png` |
| Ícono Series (header)                                                                                    | tap                 | teaser «Planifica tu próxima serie»                                                              | `S115-a4-15-series-free.png`                                  |
| Ícono Ilustraciones (header)                                                                             | tap                 | teaser «Guarda tus mejores ilustraciones»                                                        | `S115-a4-17-ilustraciones-free.png`                           |
| Palabras en idioma original                                                                              | scroll              | teaser «Desbloquea con premium las palabras clave…» con EXCLUSIVO                                | `S115-a4-19-scroll-1.png`                                     |
| Comparar versiones                                                                                       | scroll              | teaser «Desbloquea con premium comparar 2 o 3 tradu…» con EXCLUSIVO                              | `S115-a4-19-scroll-2.png`                                     |
| Tarjeta Modo púlpito → desbloquear                                                                       | tap                 | hoja de ofrenda                                                                                  | `S115-a4-22-pulpito-card-free.png`                            |
| Exportar a PDF                                                                                           | tap                 | hoja de ofrenda directa (NO la hoja de formato)                                                  | `S115-a4-20-pdf-free.png`                                     |
| Copiar bosquejo / Compartir estudio / autorrevisión / notas                                              | —                   | visibles y sin gate (gratis por diseño)                                                          | `S115-a4-19-scroll-8.png`, `-21-mesa-fondo.png`               |
| Deep link en FRÍO a `features/prep/pulpit?book=John&chapter=3&startVerse=16&endVerse=21&version=RVR1960` | `LaunchState: COLD` | teaser «Predica con una vista de pantalla completa», sin texto del pasaje                        | `S115-a4-24-dl-pulpito-free.png`                              |
| Deep link a `features/prep/history`                                                                      | —                   | teaser                                                                                           | `S115-a4-25-dl-historial-free.png`                            |
| Deep link a `features/prep/series/series_inexistente_s115`                                               | —                   | teaser genérico de series                                                                        | `S115-a4-26-dl-serie-free.png`                                |
| Deep link a `features/prep/illustrations/ilus_inexistente_s115`                                          | —                   | header «Sin título» + teaser                                                                     | `S115-a4-27-dl-ilus-free.png`                                 |
| Estado vacío (`features/prep` sin pasaje)                                                                | deep link           | sin «Busca por tema» ni sugeridor                                                                | `S115-a4-99-vacio-free.png`                                   |
| Referencias cruzadas, Filipenses 4:1-23                                                                  | scroll              | «+1 más con premium» (tope free 12)                                                              | `S115-a4-101-fil-free-4.png`                                  |

#### 2.2 Premium (toggle encendido en la sesión)

| Gate                                                                                                       | Resultado                                                                                                           | Evidencia                                                              |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Header                                                                                                     | sin hojas de «Extra», aparece «Busca por tema»                                                                      | `S115-a4-40-mesa-premium.png`                                          |
| Palabras en idioma original                                                                                | «Descargar (~30 MB)» (camino premium; no se descargó)                                                               | `S115-a4-41-mesa-p-1.png`                                              |
| Comparar versiones                                                                                         | «Elige hasta 3 versiones para comparar»                                                                             | `S115-a4-41-mesa-p-1.png`                                              |
| Exportar a PDF                                                                                             | hoja «Elige un formato» con los 4 formatos; cerrada sin generar                                                     | `S115-a4-48-pdf-premium.png`                                           |
| Series                                                                                                     | crear `S115A4-serie-777` en modo adjuntar (Juan 3:16-21 queda en la serie); detalle con exportar/renombrar/eliminar | `S115-a4-58-series-lista-premium.png`, `-59-serie-detalle-premium.png` |
| Ilustraciones                                                                                              | crear `S115A4-ilus-777` / cuerpo `S115A4-cuerpo-777` (autoguardado)                                                 | `S115-a4-66-ilus-cuerpo.png`                                           |
| Modo púlpito                                                                                               | pasaje en grande + cronómetro                                                                                       | `S115-a4-83-pulpito-premium.png`                                       |
| Estado vacío                                                                                               | «BUSCA POR TEMA» + campo del sugeridor                                                                              | `S115-a4-95-vacio-premium.png`                                         |
| Nota escrita en «Preguntas»: `S115A4-nota-premium-777` (`S115-a4-46-texto.png`). En el almacenamiento      |
| (`run-as` + `databases/RKStorage`): `series_1793210645286_aazi9gjx`, `illustration_1793210686205_8tdy175j` |
| y los tres textos (`S115-a4-67-premium.rkstorage.bin.txt`).                                                |

#### 2.3 Transiciones

| Paso                                                                                                    | Resultado                                                                                                                                | Evidencia                                                                         |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| premium → free (Ajustes por deep link encima de la pila)                                                | almacenamiento intacto: serie, ilustración, nota                                                                                         | `S115-a4-74-free.rkstorage.bin.txt`                                               |
| free: deep link a la serie REAL `features/prep/series/series_1793210645286_aazi9gjx`                    | teaser genérico, sin filtrar el nombre                                                                                                   | `S115-a4-75-dl-serie-real-free.png`                                               |
| free: deep link a la ilustración REAL `features/prep/illustrations/illustration_1793210686205_8tdy175j` | «Sin título» + teaser, sin filtrar título ni cuerpo; al salir NO la borra (sigue en el banco después)                                    | `S115-a4-76-dl-ilus-real-free.png`, `-93-ilus-vuelta.png`                         |
| free: la Mesa de Juan 3:16-21                                                                           | la nota escrita en premium se ve y se edita (las notas son gratis)                                                                       | `S115-a4-77-mesa-free-nota-8.png`                                                 |
| free → premium con la Mesa MONTADA debajo de Ajustes                                                    | al volver, la Mesa se repinta premium (sin hojas, «Busca por tema», púlpito, PDF) y la nota sigue                                        | `S115-a4-80-atras-mesa.png`, `-81-mesa-on-2.png`                                  |
| premium → free con el PÚLPITO montado debajo de Ajustes                                                 | al volver, el púlpito es el teaser («Predica con una vista de pantalla completa»), sin pasaje                                            | `S115-a4-86-atras-pulpito.png`                                                    |
| toggle ENCENDIDO + arranque en frío (`LaunchState: COLD`)                                               | la app arranca FREE y el switch queda apagado: RevenueCat habla y gana (`PremiumContext.tsx:74-85`, `R9-10`)                             | `S115-a4-89-frio-series.png`, `-90-ajustes-frio-4.xml.txt`, `-89-frio.logcat.txt` |
| tras el frío, premium otra vez                                                                          | serie (`1 de 1 con preparación iniciada`), ilustración y entrada del historial («Juan 3:16-21 · Hoy · S115A4-nota-premium-777») intactas | `S115-a4-92-series-vuelta.png`, `-93-ilus-vuelta.png`, `-94-historial-vuelta.png` |

#### 2.4 Sin medir

- La caída del derecho POR RevenueCat (reembolso/expiración) con una pantalla abierta: no se puede provocar
  en el emulador; el toggle de dev pasa por el mismo `setIsPremium` y la misma rama de render, así que lo
  medido en 2.3 lo cubre por lectura, no por medición.
- El edge de la hoja de formato abierta cuando cae el derecho (sección 1): no alcanzable con el toggle.
- La generación del PDF, la descarga de originales y la comparación con 2 versiones (premium): son función,
  no gate; ya ✅ en Fable (áreas 2, 3, 5).
- Nada de la Mesa cruzó con la adopción/cambio de cuenta ni con su cola de escrituras: sin sesión de Google,
  una sola cuenta anónima. Mesa: Pendiente (`R9-330`/`R9-327`), no medido.

#### 2.5 Notas del entorno (no son de la app)

- LogBox «Open debugger to view warnings» = `Cannot connect to Expo CLI` (corte del socket de Metro durante
  la sesión), tapa el pie de la pantalla; se cierra con su X.
- En `adb shell uiautomator dump /sdcard/...` hace falta `MSYS_NO_PATHCONV=1`, y el destino local del `pull`
  en forma `C:/...`.
- `uiautomator dump` no ve la pantalla del púlpito (keep-awake/inmersivo): la evidencia es la captura.
- Ir a Ajustes con `eternalbible://settings` cambia de pestaña y deja la pila de pantallas de la Mesa debajo;
  «atrás» vuelve a pantallas viejas de esa pila (todas pintaron el teaser correcto en free).

### Hallazgos provisionales

Ninguno. Lo que la sesión 6/Fable dijo de `C16` (área 16) se sostiene con el código de hoy y suma lo nuevo
desde julio (ilustraciones, sugeridor de tema, «Busca por tema», hoja de formato del PDF).
