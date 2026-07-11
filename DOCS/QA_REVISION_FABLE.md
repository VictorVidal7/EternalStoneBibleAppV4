# 🔍 QA — Revisión exhaustiva en emulador (ledger de checkpoints)

> **Este archivo es la memoria viva de la revisión.** Un agente de prueba (Fable)
> lo lee al empezar, prueba la siguiente área `PENDIENTE`, y **actualiza este
> archivo después de CADA área** para que el progreso sobreviva a un corte de
> contexto o a un reseteo de suscripción (cada ~5 h). No es un archivo de código.

## ⚠️ Protocolo de la sesión de prueba (LÉELO PRIMERO)

1. **Solo probar, NO codificar.** No modifiques código de la app. Lo único que
   escribes es ESTE archivo (`DOCS/QA_REVISION_FABLE.md`) para registrar hallazgos.
2. **Reanudar:** al empezar (chat nuevo tras un reseteo), lee este archivo entero,
   mira la tabla de abajo y **continúa desde la primera fila `PENDIENTE` o `EN CURSO`**.
   No repitas lo ya marcado `OK`.
3. **Checkpoint por área:** en cuanto termines de probar un área, ESCRIBE de
   inmediato su fila (Estado + Hallazgos con `file:line` cuando puedas) — no
   esperes al final. Si la sesión se corta, lo guardado persiste.
4. **Un bug ≠ arreglarlo.** Si encuentras un bug, márcalo `🐛 BUG` con pasos para
   reproducir y evidencia (captura/coordenadas). NO lo arregles — solo repórtalo aquí.
5. **Emulador compartido:** el emulador corre en la máquina de Victor y él también
   puede tocarlo. Si algo "no reacciona", puede ser que él esté tocando a la vez, o
   que el ⊕/ícono no sea un botón. Verifica en una captura antes de concluir "roto".
6. **Prioridad:** primero las áreas `P0` (recién construidas, más frágiles), luego `P1`, luego `P2`.

## 🛠️ Puesta en marcha del emulador (resumen)

- AVD: `Pixel_9_Pro` (o el que esté). Arrancar: `emulator.exe -avd Pixel_9_Pro -no-snapshot-load` (binario en `%LOCALAPPDATA%\Android\Sdk\emulator\`).
- Metro: `npx expo start --dev-client` (esperar `packager-status:running` en `http://localhost:8081/status`). NO arrancar Metro mientras corre un build de gradle (condición de carrera con el file-watcher).
- APK debug (si no está construido): `./android/gradlew -p android assembleDebug -PreactNativeArchitectures=x86_64` → `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`. El debug carga JS en vivo de Metro.
- `adb reverse tcp:8081 tcp:8081` tras cada arranque del emulador.
- Deep links (más fiable que taps a ciegas): `adb shell am start -W -a android.intent.action.VIEW -d "eternalbible://features/prep?book=John\&chapter=3\&startVerse=16\&endVerse=21"` — **escapa los `&` con `\&`** (el shell del dispositivo corta la URL en el primer `&`). Fuerza cold: `am force-stop` antes.
- Premium (para probar lo gateado): Ajustes → Extras → "Extras unlocked (dev only)".
- Capturas: `adb exec-out screencap -p > shot.png`. Pantalla 1280×2856; taps en px físicos. Ver detalles y gotchas en la memoria `reference_essb-device-testing-and-automation`.
- ⚠️ `OfferingSheet` renderiza `null` en este emulador (RevenueCat sin ofertas) — no se puede ver la hoja de ofrenda aquí; confirma solo que el gate "retiene".

---

## Tabla de cobertura

Estados: `PENDIENTE` · `EN CURSO` · `✅ OK` · `🐛 BUG` · `⚠️ DUDA/PARCIAL` · `⛔ NO PROBABLE AQUÍ`

### P0 — Capa premium pastores/maestros (recién construida, 2026-07-10)

| #   | Área                                                                                                                                                                   | Estado     | Hallazgos (con file:line / captura)                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Mesa de preparación — base (esquema 7 secciones, autoguardado, cross-refs, temas, "Cristo en este pasaje", "Sobre este libro")                                         | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2   | Mesa — Palabras clave idioma original (premium; requiere pack originals.db descargado)                                                                                 | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 3   | Mesa — Comparar versiones (premium)                                                                                                                                    | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 4   | Mesa — Copiar bosquejo (Markdown, gratis) + Compartir estudio (enlace)                                                                                                 | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 5   | Mesa — Exportar a PDF (premium) + **nombre de archivo con sentido** (p.ej. "Juan 3.16-21.pdf")                                                                         | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 6   | Mesa — Historial de preparaciones (premium; buscar, reabrir)                                                                                                           | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 7   | **Series** — crear, agregar pasaje, reordenar, renombrar, borrar, progreso                                                                                             | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 8   | **Series — fecha por pasaje** (pill → modal chips "This/Next Sunday", +2/+3 sem, quitar)                                                                               | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 9   | **Series — vista "Por fecha"** (ordena por fecha sin tocar el orden manual; oculta reordenar)                                                                          | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 10  | **Series — exportar la serie completa a PDF** (progreso "Generando N/M", nombre = serie)                                                                               | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 11  | **Series — banner "adjuntar pasaje"** (⊕/texto crea serie al tocar; "Not now"; tocar serie existente adjunta y regresa)                                                | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 12  | **Modo púlpito — tarjeta** (conteo palabras, estimación ÷ppm, stepper WPM, botón siempre visible incl. sin notas)                                                      | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 13  | **Modo púlpito — pantalla** (pasaje en grande, solo secciones con contenido, reloj, A-/A+, fondo oscuro, keep-awake, navegación por sección)                           | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 14  | Púlpito — accesible SIN notas (presenta el pasaje; no "nada que presentar")                                                                                            | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 15  | Hoja de ofrenda — copy nuevo (6 beneficios agrupados) — ⛔ visualmente no en este emulador; verificar solo el texto en `translations.ts` y que Ajustes→Extras funcione | ⚠️ PARCIAL | Estático ✅ (auditoría 2026-07-11): `offering.extras` con 6 entradas ES (`translations.ts:3458-3482`) + EN (`:8873+`), `OfferingSheet.tsx:256` hace `.map()` sobre ellas; títulos ES: Mesa de preparación / Idiomas originales / Audio avanzado / Memorización / Personalización / Compartir con estilo. Falta solo confirmar en emulador que el toggle Ajustes→Extras funciona (lo cubre el agente de áreas 1-6). |
| 16  | Gating free vs premium en toda la Mesa (teasers, badges "Exclusivo", que el gate retenga)                                                                              | PENDIENTE  |                                                                                                                                                                                                                                                                                                                                                                                                                    |

### P1 — Núcleo de la app

| #   | Área                                                                                            | Estado    | Hallazgos                                       |
| --- | ----------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| 17  | Lectura de la Biblia (capítulo, versículo, navegación, versión)                                 | PENDIENTE |                                                 |
| 18  | Lector inmersivo (auto-scroll gratis; "Escuchar"/TTS premium)                                   | PENDIENTE |                                                 |
| 19  | Audio (velocidad, scrubbing premium, continuar donde quedaste, cold-start, sleep timer, voz)    | PENDIENTE |                                                 |
| 20  | Memoria/SRS (mazo, práctica, insights premium, metas, rachas)                                   | PENDIENTE |                                                 |
| 21  | Quiz bíblico (categorías premium, contrarreloj, añadir a mazo, stats)                           | PENDIENTE |                                                 |
| 22  | Word study / idiomas originales (interlineal, morfología, glosa KJV — premium)                  | PENDIENTE |                                                 |
| 23  | Búsqueda (texto, ir a referencia)                                                               | PENDIENTE |                                                 |
| 24  | Personalización (temas de lectura/color, tipografías; exclusivos premium)                       | PENDIENTE |                                                 |
| 25  | Compartir (plantillas de imagen, texturas, presets; tarjeta de memoria; enlace de estudio)      | PENDIENTE |                                                 |
| 26  | Sincronización / cuenta (login, conflictos, backup)                                             | PENDIENTE |                                                 |
| 27  | Ajustes (notificaciones, recordatorios, reset, borrar cuenta)                                   | PENDIENTE |                                                 |
| 41  | Favoritos (tab corazón; punto de entrada a Colecciones)                                         | PENDIENTE | _añadida por auditoría de cobertura 2026-07-11_ |
| 42  | Notas del usuario (tab/lista `app/(tabs)/notes.tsx`)                                            | PENDIENTE | _añadida por auditoría de cobertura_            |
| 43  | Subrayados/Highlights (colores, galería — `app/(tabs)/highlights.tsx`)                          | PENDIENTE | _añadida por auditoría de cobertura_            |
| 44  | "Mi lectura" / Reading insights (heatmap, racha, libro más leído — `features/reading-insights`) | PENDIENTE | _añadida por auditoría de cobertura_            |

### P2 — Resto de features

| #   | Área                                                                                                                   | Estado    | Hallazgos                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| 28  | Home (verso del día, continuar leyendo, check-in de sentimientos, tarjetas de estudio)                                 | PENDIENTE |                                                 |
| 29  | Logros / gamificación (badges, títulos, niveles)                                                                       | PENDIENTE |                                                 |
| 30  | Referencias cruzadas / constelación / cadena de referencias                                                            | PENDIENTE |                                                 |
| 31  | Temas topicales, sentimientos, Daily Light, devocional                                                                 | PENDIENTE |                                                 |
| 32  | Profecías (hilo profético, quiz, mapa)                                                                                 | PENDIENTE |                                                 |
| 33  | Recorridos bíblicos / Journeys                                                                                         | PENDIENTE |                                                 |
| 34  | Niños (historias, quiz, plan)                                                                                          | PENDIENTE |                                                 |
| 35  | Oración (companion, orar la Escritura, ACTS, lectio)                                                                   | PENDIENTE |                                                 |
| 36  | Planes de lectura / plan builder / Juntos (grupos)                                                                     | PENDIENTE |                                                 |
| 37  | Widgets                                                                                                                | PENDIENTE |                                                 |
| 38  | Onboarding (primer arranque)                                                                                           | PENDIENTE |                                                 |
| 39  | Donación (sheet, restaurar)                                                                                            | PENDIENTE |                                                 |
| 40  | Accesibilidad (texto grande, alto contraste, keep-screen-on)                                                           | PENDIENTE |                                                 |
| 45  | Marcadores/Bookmarks (`app/(tabs)/bookmarks.tsx`)                                                                      | PENDIENTE | _añadida por auditoría de cobertura 2026-07-11_ |
| 46  | Colecciones de versículos (`features/collections`, deep link `eternalbible://features/collections`)                    | PENDIENTE | _añadida por auditoría_                         |
| 47  | Datos bíblicos / Facts (`features/facts`)                                                                              | PENDIENTE | _añadida por auditoría_                         |
| 48  | Línea de tiempo bíblica (`features/timeline`) — distinta de Journeys (#33)                                             | PENDIENTE | _añadida por auditoría_                         |
| 49  | Devoción guiada (`features/guided`: check-in → verso → lectio → memorizar)                                             | PENDIENTE | _añadida por auditoría_                         |
| 50  | "Tu camino" recap estilo Wrapped (`features/journey/` — dir distinto de `journeys`)                                    | PENDIENTE | _añadida por auditoría_                         |
| 51  | "Sobre este libro" standalone (`features/about-book/[book]` — fuera de la Mesa)                                        | PENDIENTE | _añadida por auditoría_                         |
| 52  | Landing de estudio/devocional compartido (`features/study-shared`, `devotional-shared` — recibir un enlace `?d=`)      | PENDIENTE | _añadida por auditoría_                         |
| 53  | Comparación de versiones standalone (`features/version-comparison` — ruta general, distinta del área 3)                | PENDIENTE | _añadida por auditoría_                         |
| 54  | Resolución de conflictos de sync (`app/(tabs)/conflicts.tsx` + `features/conflicts/insights`) — desglosada del área 26 | PENDIENTE | _añadida por auditoría_                         |

> Nota de la auditoría de cobertura (2026-07-11): el área 30 agrupa 3 rutas distintas (study.tsx modo estudio, reference-chain.tsx, constellation.tsx) — probar las TRES dentro de esa fila. El área 25 cubre PRODUCIR enlaces; RECIBIRLOS es el área 52.

---

## 📓 Bitácora de sesiones

> Añade una línea por sesión: fecha, qué áreas tocaste, si hubo reseteo a mitad.

- 2026-07-11 — Sesión 1 (Fable orquestando agentes a petición de Victor). Entorno arrancado (emulador Pixel_9_Pro + Metro + adb reverse, app lanza OK). Agente A: auditoría de cobertura (estático). Agentes QA secuenciales sobre el emulador empezando por P0 áreas 1–6.

## 🐛 Resumen de bugs encontrados

> Lista consolidada de todo lo marcado `🐛 BUG` arriba, para revisión de Victor.

- _(vacío)_
