# C56 — Gating premium FUERA de la Mesa (Modo C, sesión 115)

**Estado: 🐛 BUG (P2), ninguno P0.** Agente 5, `emulator-5558` (ola 2). El entorno de la 115, en
`detail/C15-hoja-ofrenda.md`.

## Hallazgo

- **`S115-a5-H1` = `R9-421` (P2):** Sepia queda «heredado» para siempre aunque se haya elegido con premium:
  `ReaderPreferencesContext.tsx:161-162` recalcula `sepiaGrandfathered` en CADA hidratación (con
  `parsed.theme === 'sepia'`), aunque el comentario de `:150-160` dice que es una sola vez en la vida del
  aparato. Medido: `"theme":"sepia","sepiaGrandfathered":true` en una instalación de hoy, y al apagar premium
  la tipografía vuelve a Sans pero Sepia se queda. Re-leído en el código por el orquestador. No es `R9-413`
  (la dirección contraria).

## Lo medido, en una línea

Las 6 promesas de la hoja de ofrenda que no son de la Mesa (idiomas originales, audio avanzado, memorización
con quiz contrarreloj, personalización, compartir con estilo, diccionario) están cerradas en free (EXCLUSIVO o
«— Extra», y cada toque abre la hoja real) y funcionan en premium; el deep link a `features/quiz/stats` no
salta el gate (`stats.tsx:91`); al revocar, la velocidad baja sola de 2.5x a 2x y Granate vuelve a Midnight;
«Continúa donde lo dejaste» vuelve tras un arranque en frío en premium y no en free.

**Observación de UX, sin número:** en «Compartir como imagen», tocar algo bloqueado cierra primero el modal
(`ImageShareModal.tsx:142`, `:263`, `:277`, `:738`, `:893`; deliberado desde T8.2), y atrás sobre la hoja
vuelve al lector, no al modal.

## Sin medir

Revocar con el quiz contrarreloj o el interlineal en pantalla (el toggle está en Ajustes); Granate revocado
sin pasar por Ajustes; «Mis estilos» tras revocar, la foto propia de fondo en free y los otros modales de
imagen. Las capturas y el logcat del primer bloque en free se perdieron cuando el límite de uso cortó al
agente (su worktree se borró antes del primer `cp -r`); sus resultados quedan en el informe con el texto de
los dumps.

Evidencia: `_scratch/S115-sondas-agente-5/`.

---

## Informe del agente 5 (tal cual; los números provisionales arriba)

## S115 — agente 5 — `C56` (gating premium FUERA de la Mesa)

Emulador: `emulator-5558` (instancia de solo lectura de `Pixel_9_Pro`, APK debug vc73, Metro de `main` = `d34bd4d`).
Worktree verificado al empezar: `git log -1` = `d34bd4d`. Estado de partida: `pm clear` del orquestador, cuenta
anónima nueva, onboarding hecho a mano (Español, RVR1960, tema Océano). Toggle de dev APAGADO al empezar.

**⚠️ Pérdida de evidencia (y por qué):** el worktree del agente se borró solo cuando el agente se cortó por el
límite de uso, ANTES del primer `cp -r` a `S115-sondas-agente-5/`. Se perdieron las capturas `S115-a5-00`..`-15`,
los logcat de ese bloque y la primera versión de este informe. Lo medido en ese bloque queda abajo con lo que se
vio en los dumps de uiautomator (texto exacto); las capturas que importan se rehicieron (marcadas «re-capturada»).
Desde la reanudación se escribe DIRECTO en `_scratch/S115-sondas-agente-5/` del principal (ignorado por git).

**Regla del orquestador (niveles / «Restaurar»): cumplida en toda la sesión.** El agente 5 NUNCA tocó un nivel
(MX$17/49/119) ni «Restaurar»: la hoja solo se abrió (dump/captura) y se cerró con atrás (`KEYCODE_BACK`).

### Veredicto

**`C56`: los gates fuera de la Mesa SE SOSTIENEN en los dos sentidos.** Las 6 promesas de la hoja de ofrenda
que no son de la Mesa (idiomas originales, audio avanzado, memorización + quiz contrarreloj, personalización,
compartir con estilo, diccionario) están bloqueadas en free (con EXCLUSIVO / «— Extra», y cada toque abre la hoja
real, también por deep link a la ruta de estadísticas) y funcionan en premium. Al revocar, velocidad y tema de
color se recortan al instante. **Un hallazgo nuevo, `S115-a5-H1` (P2 propuesta):** Sepia queda heredado para
siempre tras un arranque en frío, aunque se haya obtenido con premium. Más una observación de UX (P3 candidata)
en «Compartir como imagen». Ningún P0.

Estado final del emulador: app en Home, toggle de dev ENCENDIDO, tema Sepia en el lector (heredado), Midnight
de color, paquete de originales instalado, mazo con Gn 1:1 y 1:3, un estilo guardado. Ningún nivel ni
«Restaurar» tocados.

### 1. Inventario de gates fuera de la Mesa (código de hoy, `d34bd4d`)

Lo que la hoja de ofrenda promete (`src/i18n/translations.ts:4479`, `offering.extras`, 7 entradas; la 1.a es la
Mesa = `C16`) y dónde está el gate de cada promesa:

| Promesa (copy)                                                | Gate                                                                                   | file:line                                                                                                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Idiomas originales: interlineal                               | `InterlinearSheet` se cierra sola si `!isPremium`                                      | `src/components/reading/InterlinearSheet.tsx:106`                                                                                                                      |
| Idiomas originales: morfología/definiciones (Originales+)     | `OriginalLanguagesSheet` (fila bloqueada → hoja)                                       | `src/components/reading/OriginalLanguagesSheet.tsx:210`, `:344`, `:362`, `:627`                                                                                        |
| Idiomas originales: word-study (glosa KJV)                    | fila bloqueada → `openOfferingSheet()`                                                 | `app/(tabs)/features/word-study.tsx:534`, `:544`                                                                                                                       |
| Audio: velocidad hasta 2.5x                                   | `nextPlaybackSpeed(…, isPremium)` + clamp                                              | `src/features/audio/lib/playbackSpeed.ts:23`; `src/features/audio/context/AudioPlayerContext.tsx:805`, `:813`; `src/features/audio/components/MiniAudioPlayer.tsx:707` |
| Audio: continuar donde lo dejaste                             | `coldStartRestore` (null si free), tarjeta de Home, `audioResume` del lector           | `src/features/audio/lib/coldStartRestore.ts:76`; `app/(tabs)/index.tsx:618`; `app/(tabs)/verse/[book]/[chapter].tsx:1873`, `:1933`                                     |
| Audio: desplazarse por versículo en inmersivo                 | `listening = isPremium && audioBound`; botón «Escuchar» solo si premium                | `src/components/reading/ImmersiveReader.tsx:168`, `:179`, `:962`                                                                                                       |
| Memorización: estadísticas completas                          | `insights.tsx` (historial completo, retención por libro, tendencia, compartir)         | `app/features/memory/insights.tsx:116`, `:462`, `:689`, `:727`, `:770`, `:813`                                                                                         |
| Memorización: Quiz contrarreloj (+ stats)                     | `handleToggleTimedMode`/`handleOpenStats` → hoja; `timedMode={isPremium && timedMode}` | `app/features/quiz/index.tsx:236`, `:244`, `:501`; red de seguridad `app/features/quiz/stats.tsx:91`                                                                   |
| Personalización: temas de color                               | `PREMIUM_COLOR_THEMES` (`src/hooks/useTheme.tsx:31`) + reversión si `!isPremium`       | `src/components/settings/ColorThemeSettings.tsx:69`, `:78`, `:81`                                                                                                      |
| Personalización: temas de lectura y tipografías               | `PREMIUM_READER_THEMES`/`PREMIUM_READER_FONTS` + reversión                             | `src/components/reading/ReaderPreferencesSheet.tsx:134`, `:226`, `:289`, `:414`, `:510`                                                                                |
| Compartir con estilo: plantillas, texturas, estilos guardados | `PremiumShareExtras` (lo decide la pantalla que llama)                                 | `src/features/share/PremiumShareExtras.tsx:97`, `:104`, `:113`, `:122`, `:303`; `src/components/reading/ImageShareModal.tsx:141`, `:217`, `:225`, `:235`               |
| Diccionario: artículo completo y posturas                     | secciones tras `isPremium`                                                             | `app/features/dictionary/[slug].tsx:306`, `:521`, `:589`                                                                                                               |

Otros que montan `PremiumShareExtras`/`isPremium`: los modales de imagen de `src/components/insights/*ImageModal.tsx`,
`src/components/memory/MemoryShareCardModal.tsx`, `src/features/collections/CollectionImageModal.tsx`,
`src/components/comparison/CompareImageModal.tsx:160`. Gratis por diseño (cabecera «100% FREE»):
`app/features/sermon-notes/*`, `app/features/theology/index.tsx`, `app/features/share-faith/*`. La barra para
desplazarse del reproductor expandido es gratis a propósito (`MiniAudioPlayer.tsx:982`: «verse-seek is not a
premium gate»); lo premium es la del inmersivo.

### 2. En el dispositivo

Dato de C15 (primer arranque, toggle APAGADO, sin tocar nada): la app NO se ve premium; la hoja de ofrenda se
abre con precios reales MX$17.00/49.00/119.00 al tocar cualquier gate. Coincide con el agente 3.

#### FREE (toggle APAGADO) — bloque 1 (capturas perdidas salvo las «re-capturadas»; texto de los dumps)

| Gate                                                                                             | Resultado                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diccionario, Bautismo: «Distintas posturas»                                                      | ✅ fila «Desbloquea las distintas posturas con premium» + pill EXCLUSIVO; tocarla abre la hoja real (7 extras, 3 niveles con precio, «Restaurar…»); atrás vuelve al artículo                            |
| Quiz: chip «⏱ Modo cronometrado»                                                                 | ✅ con hoja de candado; tocarlo abre la hoja; la ronda sigue sin cronómetro                                                                                                                             |
| Quiz: botón de estadísticas                                                                      | ✅ abre la hoja, no navega                                                                                                                                                                              |
| Quiz: deep link directo `eternalbible://features/quiz/stats`                                     | ✅ red de seguridad de `stats.tsx:91`: pantalla «Desbloquea con premium», sin datos                                                                                                                     |
| Memorización: insights (mazo de 2 versículos, Gn 1:1 y 1:3, agregados desde «Agregar versículo») | ✅ lo gratis se ve (racha, meta, dominio, cajas, calibración, más difíciles); «Retención por libro», «Tendencia de retención» y «Compartir mi progreso» bloqueados con EXCLUSIVO; tocarlos abre la hoja |
| Ajustes → Tema de Color → «Ver todos los temas»                                                  | ✅ Granate/Zafiro/Turquesa/Orquídea con EXCLUSIVO y a11y «— Extra — se desbloquea con premium»; tocar Granate abre la hoja y el tema sigue en Océano                                                    |
| Onboarding, paso 4 (tema de color)                                                               | ✅ solo los 12 temas gratis (sin los 4 exclusivos)                                                                                                                                                      |
| Lector → «Aa» (preferencias de lectura)                                                          | ✅ temas Sepia/Musgo/Crepúsculo/Niebla y tipografías Sólida/Elegante/Suave con EXCLUSIVO; tocar Sepia y Sólida abre la hoja; atrás vuelve a la hoja de preferencias, sin aplicar nada                   |
| Audio: velocidad (mini reproductor)                                                              | ✅ 9 toques: 1.25 → 1.5 → 1.75 → 2 → 0.5 → 0.75 → 1 → 1.25 → 1.5 (tope 2x, nunca 2.25/2.5)                                                                                                              |
| Audio: reproductor expandido                                                                     | barra para desplazarse por versículo visible (gratis por diseño, ver arriba); botón de velocidad, temporizador, voz                                                                                     |
| Audio: inmersivo con el audio sonando                                                            | ✅ sin «Escuchar» ni barra para desplazarse (barra de progreso simple «27 / 36»); «Avance automático» deshabilitado (por diseño, `ImmersiveReader.tsx:178`)                                             |
| Word-study `?strongs=G25` sin paquete                                                            | «Paquete no instalado» (nada que gatear sin el paquete de originales)                                                                                                                                   |

#### FREE — bloque 2 (tras reanudar; capturas en este directorio)

| Gate                                                                 | Resultado                                                                                                                                   | Evidencia                                                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Lector Jn 3:30 → «Más acciones» → «Idiomas originales» sin paquete   | «Paquete no instalado» + «Descargar (~30 MB)»; descargado (pack público): «📜 Imported 446869 original-language words»                      | `S115-a5-21-originales-sin-paquete-free.png`, `S115-a5-22-descarga-originales.logcat.txt`                      |
| Idiomas originales con paquete: «Interlineal visual»                 | ✅ fila «Interlineal visual — Extra», EXCLUSIVO; tocarla abre la hoja; atrás vuelve a la hoja de originales                                 | `S115-a5-22-originales-free.png`, `S115-a5-23-interlineal-hoja-free.png`                                       |
| Palabra δεῖ (G1163): «Análisis morfológico»                          | ✅ bloqueado «Se desbloquea con premium»; tocarlo abre la hoja; la definición base y el número Strong se ven gratis                         | `S115-a5-24-palabra-free.png`                                                                                  |
| «Estudio de palabra — Gratis · 1 sección exclusiva» → word-study δεῖ | ✅ la pantalla abre gratis (106 apariciones, distribución por libro); «Traducción KJV» bloqueada, tocarla abre la hoja                      | `S115-a5-25-wordstudy-free.png`                                                                                |
| Lector Jn 1:14 → «Imagen» (compartir como imagen)                    | ✅ «Guardar estilo · Extra», texturas Puntos/Líneas/Grano «· Extra», tipografías Sólida/Elegante/Suave «· Extra»; tocar Puntos abre la hoja | `S115-a5-26-imagen-free.png`, `S115-a5-27-imagen-free-opciones.png`, `S115-a5-28-textura-hoja-sobre-modal.png` |

**Observación de UX (no es de dinero; candidata P3, a criterio del orquestador):** en «Compartir como imagen», un
toque a algo bloqueado CIERRA el modal de imagen antes de abrir la hoja (`ImageShareModal.tsx:142`, `:263`,
`:277`, `:738`, `:893`: `onClose(); openOfferingSheet();`, deliberado desde T4/T8.2, `6f657b8`). Un atrás sobre
la hoja vuelve al LECTOR, no al modal (`S115-a5-29-tras-un-atras.png`): lo que el usuario estaba armando se cierra.
En las preferencias de lectura y en idiomas originales la hoja se apila y atrás vuelve a la hoja de origen, así
que el cierre previo ya no parece necesario. No medí si el modal conserva su estado al reabrirlo.

#### PREMIUM (toggle ENCENDIDO: Switch `checked="true"`, `S115-a5-30-toggle-on.png`)

| Gate                                              | Resultado                                                                                                              | Evidencia                                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Ajustes → Tema de Color                           | ✅ Granate/Zafiro/Turquesa/Orquídea sin «Extra» (siguen con EXCLUSIVO como etiqueta); Granate se aplica a toda la app  | `S115-a5-31b-ajustes-granate.png`                                               |
| Lector → Aa: Sepia + Sólida                       | ✅ se aplican                                                                                                          | `S115-a5-33-lector-sepia-solida-premium.png`                                    |
| Compartir como imagen                             | ✅ texturas, tipografías y «Guardar estilo» sin «Extra»; Puntos se aplica; «Guardar estilo» agrega uno a «Mis estilos» | `S115-a5-34-imagen-premium-puntos.png`, `S115-a5-35-guardar-estilo-premium.png` |
| Audio: velocidad                                  | ✅ 1.75 → 2 → 2.25 → 2.5 → 0.5 → 0.75                                                                                  | `S115-a5-36-velocidad-premium.out.txt`                                          |
| Audio: inmersivo con el audio sonando             | ✅ barra para desplazarse 29..36 + «Versículo 29 de 36» + karaoke (palabra resaltada)                                  | `S115-a5-37-inmersivo-premium.png`                                              |
| Diccionario, Bautismo                             | ✅ «Distintas posturas» muestra las posturas («Bautista»…)                                                             | `S115-a5-38-dicc-bautismo-premium.png`                                          |
| Quiz: «Modo cronometrado»                         | ✅ se activa, cuenta atrás «⏱ 2s» en la pregunta                                                                       | `S115-a5-39-quiz-cronometrado-premium.png`                                      |
| Quiz: estadísticas                                | ✅ navega a «Tus estadísticas» (vacía: «Juega tu primera ronda…»)                                                      | `S115-a5-40-quizstats-premium.png`                                              |
| Memorización: insights                            | ✅ «Retención por libro» y «Tendencia» abiertas (estado vacío: sin repasos), «Compartir mi progreso» sin «Extra»       | `S115-a5-41-memo-insights-premium.png`                                          |
| Word-study δεῖ G1163                              | ✅ «Traducción KJV»: «behoved, be meet, must (needs)…»                                                                 | `S115-a5-42-wordstudy-premium.png`                                              |
| Idiomas originales Jn 3:30 → «Interlineal visual» | ✅ abre: traducción de referencia + cada palabra (ἐκεῖνον/Aquél/G1565…)                                                | `S115-a5-43-interlineal-premium.png`                                            |

#### TRANSICIÓN premium → free (Granate, Sepia+Sólida, 2.5x sonando, un estilo guardado; toggle APAGADO a las 22:30:45 del dispositivo)

| Qué                                                                      | Resultado                                                                                                                                                                                                                                                              | Evidencia                                                                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Velocidad 2.5x sonando                                                   | ✅ baja sola a 2x (`AudioPlayerContext.tsx:805`)                                                                                                                                                                                                                       | `S115-a5-45-tras-apagar-ajustes.png`                                                                                            |
| Tema de color Granate (con Ajustes abierto)                              | ✅ vuelve a Midnight al instante (`ColorThemeSettings.tsx:63-74`)                                                                                                                                                                                                      | ídem                                                                                                                            |
| Sepia + Sólida en el lector                                              | se QUEDAN (por diseño: se revierten «al abrir la hoja», `ReaderPreferencesSheet.tsx:122-134`)                                                                                                                                                                          | `S115-a5-46-lector-tras-apagar.png`                                                                                             |
| Arranque en frío en free                                                 | Home en Midnight, sin tarjeta «Continuar escuchando» ni mini reproductor (correcto: `coldStartRestore.ts:76`); el lector sigue en Sólida + Sepia (la cursiva serif del versículo del día es su estilo propio, no Sólida)                                               | `S115-a5-47-home-frio-free.png`, `S115-a5-48-lector-frio-free.png`                                                              |
| Toggle ENCENDIDO otra vez, audio Jn 2 hasta 2:8, pausa, arranque en frío | ✅ «Continúa donde lo dejaste»: el mini reproductor vuelve en Juan 2:8 (8/25, en pausa) con la velocidad guardada (2x: la que quedó tras el recorte; no vuelve a 2.5x, correcto); la tarjeta de Home se oculta porque hay sesión activa (`resumeCardMode`, por diseño) | `S115-a5-52-audio-pausado-premium.png`, `S115-a5-53-home-frio-premium.png`                                                      |
| Abrir «Aa» en free tras el arranque en frío                              | la tipografía vuelve a Sans; **Sepia NO se revierte** → hallazgo `S115-a5-H1`                                                                                                                                                                                          | `S115-a5-49-prefs-abiertas-free.png`, `S115-a5-50-lector-tras-abrir-prefs-free.png`, `S115-a5-51-prefs-disco-tras-frio.out.txt` |

Nota de entorno: al apagar el toggle apareció el banner «Refreshing...» de Metro (Fast Refresh; lo dispara el
servidor compartido, no la app). Mismo PID (21726) antes y después y ninguna marca de recarga en logcat: no
hubo reinicio de JS. Lo dejo dicho por si el orquestador ve el banner en la captura.

### Hallazgos provisionales

#### `S115-a5-H1` — Sepia (tema de lectura premium) queda «heredado» para siempre a cualquiera que lo tuvo en un arranque en frío, aunque lo haya obtenido con premium: sobrevive a la revocación

- **Defecto:** `src/context/ReaderPreferencesContext.tsx:161-162`:
  `const sepiaGrandfathered = parsed.sepiaGrandfathered === true || parsed.theme === 'sepia';` corre en CADA
  hidratación (cada arranque en frío), no una sola vez. El comentario de `:150-160` y `src/styles/readerThemes.ts:54`
  dicen «captured once»: la intención era marcar solo a quien tenía Sepia ANTES del gate (T6.3b, `84ddce9`,
  2026-07-03); el código marca también a quien lo eligió DESPUÉS, con premium. Una vez `true`, se arrastra por el
  `...parsed` y nadie lo limpia; `isReaderThemeUnlocked` (`readerThemes.ts:80-88`) devuelve `true` y la reversión
  de `ReaderPreferencesSheet.tsx:134-146` no actúa.
- **Repro exacto (emulator-5558, cuenta anónima, instalación nueva de hoy con `pm clear`):**
  1. Ajustes → «Extras desbloqueados (solo desarrollo)» ENCENDIDO.
  2. Lector (`eternalbible://verse/John/1`) → «Aa» → tema «Sepia» (y tipografía «Sólida»); cerrar.
  3. Ajustes → toggle APAGADO (Granate se revierte; Sepia y Sólida se quedan, por diseño, hasta abrir «Aa»).
  4. Arranque en frío (`am force-stop` + `monkey -p com.eternalstonebible.app`).
  5. Lector → «Aa»: Sólida vuelve a Sans, Sepia SE QUEDA. En disco (`run-as … cat databases/RKStorage`):
     `{"fontFamily":"sans",…,"theme":"sepia","sepiaGrandfathered":true,…}`.
     El orden de 3 y 4 da igual: basta un arranque en frío con `theme: 'sepia'` (aun siendo premium) para que el flag
     quede en `true`.
- **Evidencia:** `S115-a5-33-lector-sepia-solida-premium.png` (premium), `S115-a5-48-lector-frio-free.png`,
  `S115-a5-50-lector-tras-abrir-prefs-free.png` (free, Sepia sigue, tipografía ya en Sans),
  `S115-a5-51-prefs-disco-tras-frio.out.txt` (el flag en disco), `S115-a5-prefs-disco.cjs.txt` (cómo se leyó).
  Logcat: nada relevante (la hidratación no registra).
- **Otros caminos (por lectura, sin medir):** un respaldo con `theme: 'sepia'` importado por un usuario free
  (`BackupService.ts:180` preserva el blob) queda heredado en el arranque siguiente.
- **No reportado:** `R9-413` es la dirección contraria (una lectura que rechaza PIERDE la herencia).
- **Severidad propuesta: P2** (cosmético: un tema de lectura de cuatro; sin pérdida de datos; la tipografía y los
  temas de color sí se revierten). Por la letra del estándar («premium que sobrevive a lo que debería quitarlo»)
  roza dinero: el orquestador decide si la sube.
- **Arreglo propuesto (una línea, sin escribir):** derivar `sepiaGrandfathered` solo cuando el blob NO trae la
  clave (`parsed.sepiaGrandfathered === undefined && parsed.theme === 'sepia'`, es decir, un blob anterior al gate)
  y respetar un `false` explícito; con eso, todo blob escrito después del gate (que ya lleva el flag) no se re-deriva.

### Sin medir (con el porqué)

- **Revocar con la pantalla premium abierta** (quiz contrarreloj en curso, interlineal abierto): el toggle vive
  en Ajustes, así que no se puede apagar con esas pantallas delante. Por código: `quiz/index.tsx:501`
  (`timedMode={isPremium && timedMode}`) e `InterlinearSheet.tsx:106` (se cierra sola si `!isPremium`).
- **Tema de color premium revocado sin pasar por Ajustes** (p. ej. un reembolso con la app cerrada): la reversión
  vive en `ColorThemeSettings.tsx:63-74`, que solo se monta en Ajustes; por lectura, Granate se quedaría hasta que
  el usuario abra Ajustes (mismo diseño «al abrir» que las preferencias del lector). No medido: simularlo exige
  revocar sin abrir Ajustes.
- **«Mis estilos» tras revocar** (`PremiumShareExtras.tsx:303` lo oculta en free), la foto propia de fondo en free
  (`ImageShareModal.tsx:274-280`), y los modales de imagen de insights/memoria/colecciones/comparación (montan el
  mismo `PremiumShareExtras`): sin medir uno por uno.
- Si el modal de imagen conserva su estado al reabrirlo tras la hoja (la observación de UX).
- La compra en sí, «Restaurar» y la Mesa: fuera de esta fila (C15 / C16).
- **Evidencia del bloque 1 perdida** (ver arriba): sus resultados quedan por el texto de los dumps; las capturas
  equivalentes del lado premium y de la transición sí están.
