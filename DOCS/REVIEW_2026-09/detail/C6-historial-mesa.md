# C6 — Mesa: historial de preparaciones, premium (Modo C, sesión 115)

**Estado: 🐛 BUG (P3), ninguno P0.** Agente 6, `emulator-5554` (ola 2). El entorno de la 115, en
`detail/C15-hoja-ofrenda.md`. Con la cuenta anónima la Mesa no tiene cuenta (`AuthContext.tsx:304`) y el sync
no corre (`SyncEngineContext.tsx:93`): se midió lo local.

## Hallazgo

- **`S115-a6-H1` = `R9-422` (P3):** el historial abierto desde la cabecera de la Mesa no muestra lo escrito en
  los últimos 700 ms: `handleOpenHistory` (`app/features/prep/index.tsx:960-966`) navega sin `flushDrafts`, a
  diferencia de los botones que arregló `R9-143`; la nota se guarda con un debounce de 700 ms (`:1071-1081`) y
  el historial lee una vez al tomar el foco (`history.tsx:116-121`). Sin pérdida: aparece la próxima vez.

## Lo medido, en una línea

Orden por última edición; abre la entrada correcta con todo su contenido; editar la sube al primer lugar; no
hay botón de borrar (vaciar las secciones la saca, por diseño, `prepNotes.ts:178-183`); la búsqueda recorre
todas las secciones; todo sobrevive a un arranque en frío; en free, teaser y la lista oculta, «Desbloquear»
abre la hoja real; premium → free → premium sin perder ni alterar nada.

**Dato de `C15`:** en este primer arranque tras `pm clear` la app ya era premium sin tocar nada (ver
`detail/C15-hoja-ofrenda.md`, «Lo que midieron los demás»).

## Sin medir

Bajar a free con una preparación abierta (el toggle está en Ajustes y llegar ahí desmonta la Mesa; la
revocación real no se provoca en el emulador); sync y cuenta (cuenta anónima; `C54` sin medir); fechas que no
sean «Hoy»; `handleOpenSeries` (`:971-977`) tampoco hace flush (por lectura).

Evidencia: `_scratch/S115-sondas-agente-6/` (25 capturas y logcat).

---

## Informe del agente 6 (tal cual; los números provisionales arriba)

## S115 — agente 6 — C6 (Mesa: historial de preparaciones, premium) — emulator-5554

Base: `main` = `d34bd4d` (mi worktree se borró solo por no tener cambios; leo el código del principal, que es
el mismo commit, y escribo SOLO en este `_scratch` ignorado). Instancia de solo lectura de `Pixel_9_Pro`,
APK debug vc73, `pm clear` del orquestador (~18:22 hora del emulador), cuenta anónima nueva.

### Bloque A — primer arranque (toggle de dev SIN TOCAR) — dato para C15

- Onboarding completo (español, RVR1960). Sin tocar Ajustes ni ninguna hoja.
- `eternalbible://features/prep/history` muestra el ESTADO VACÍO de premium («Aún no has preparado ningún
  pasaje»), NO el teaser de free: `isPremium` ya es true. Captura: `S115-a6-01-historial-free.png`.
- Por qué: el caché de RevenueCat (`S115-a6-02-rc-prefs.xml.txt`, `run-as ... cat
shared_prefs/com_revenuecat_purchases_preferences.xml`) tiene, para el usuario nuevo
  `$RCAnonymousID:a293255d868b409c9749ce7a10067289`, `entitlements.extras` con `product_identifier: ofrenda_1`,
  `purchase_date: 2026-08-20T02:25:14Z`, `original_app_user_id: $RCAnonymousID:669cd6e786164520829820265955170e`,
  `request_date: 2026-10-28T18:23:26Z` (= este primer arranque), y `tokensV2` con un token no renovable ya enviado.
- **Comparado con el agente 3** (antes de la restauración del agente 1): en su primer arranque el mismo caché
  daba `entitlements:{}`. **Tras la restauración automática del agente 1** (camino `alreadyOwned`), cualquier
  instalación nueva con la cuenta de Google de Victor recibe `extras` SOLA al arrancar (la sincronización de
  compras del SDK publica el token y RevenueCat lo resuelve al cliente que ya lo tiene). Desde el cliente no se
  distingue si eso movió el derecho del uid real de Victor.
- El usuario de RevenueCat sigue siendo `$RCAnonymousID`, no el uid de Firebase (`R9-135`, ya medido por el
  agente 3).
- Consecuencia para C6: el lado free se mide con el toggle de dev APAGADO dentro de la sesión (el agente 1 midió
  que eso baja a free en la sesión y que el arranque en frío vuelve a premium por RevenueCat).

### Bloque B — premium (RevenueCat real: extras; toggle sin tocar) — historial en sí

Dónde vive (lectura del código de HOY):

- Pantalla: `app/features/prep/history.tsx` (ruta `features/prep/history`). Gate: `usePremium().isPremium`
  (:75); en free no lee el almacenamiento (`useFocusEffect` con `if (!isPremium) return;`, :116-121) y muestra
  el teaser con «Desbloquear» → `openOfferingSheet()` (:163-166, :218-249). En premium recarga en CADA foco
  (:116-121), filtra con `searchNotes` (:122-131) y re-rankea por relevancia SOLO si hay pasaje de referencia
  (:137-143). Abrir una entrada: `router.push('/features/prep', {book, chapter, startVerse, endVerse})` (:147-161).
- Datos: NO hay almacenamiento propio del historial. Es una vista de `@prep_notes` (por cuenta vía `prepKey`,
  `src/features/study/prepNotesStore.ts:28-39`) armada por `buildPrepHistoryEntries`
  (`src/features/study/prepHistory.ts`, orden `updatedAt` descendente; claves que no parsean se saltan).
- Qué crea una entrada: escribir en cualquier sección de la Mesa para un pasaje (`savePrepNote`,
  `prepNotesStore.ts:61-90`, con debounce en `app/features/prep/index.tsx:1071-1102` y `flush` al desmontar,
  :1089). Qué la borra: vaciar TODAS sus secciones (`setMapSectionNote` saca la clave,
  `src/features/study/prepNotes.ts:178-183`). No hay botón de borrar ni en el historial ni en la Mesa
  (grep de delete/clear/Alert en `app/features/prep/index.tsx`: ninguno para notas).

Medido en el dispositivo (capturas `S115-a6-03`..`11`):

1. Crear 3 preparaciones por deep link `eternalbible://features/prep?book=..&chapter=..&startVerse=..&endVerse=..`
   y escribir en «Contexto»: Juan 3:16-21 («S115-a6-777 JUAN contexto uno»), después Romanos 5:1-5 («… ROMANOS
   contexto dos»), después Salmos 23:1-6 («… SALMOS contexto tres»).
   → Historial: Salmos, Romanos, Juan (más reciente primero), cada una «Hoy» y con su vista previa exacta.
   `S115-a6-05-historial-3.png`. ✅
2. Abrir Romanos desde el historial → la Mesa abre Romanos 5:1-5 (texto RVR1960 de los vv. 1 y 5) con
   «Contexto» = «S115-a6-777 ROMANOS contexto dos». `S115-a6-06`, `-07`. ✅
3. Editar Romanos (escribir en «Observación» «S115-a6-777 ROMANOS obs editado»), volver con atrás → el
   historial lo sube al primer lugar (Romanos, Salmos, Juan); la vista previa sigue siendo la 1.a sección no
   vacía («contexto dos»), como dice el código. `S115-a6-08`. ✅ Buscar «editado» deja solo Romanos (busca en
   todas las secciones). `S115-a6-09`. ✅
4. «Borrar»: vaciar la única sección de Juan (40 DEL) y volver → Juan ya no está en el historial (quedan
   Romanos, Salmos). `S115-a6-10`, `-11`. ✅ (No hay confirmación porque no hay acción de borrar: borrar es
   vaciar el texto.)
5. Arranque en frío (`force-stop` + `monkey`; el bundle tardó ~4 min en bajar de Metro): el historial muestra
   Romanos, Salmos, en ese orden, con su texto; Juan sigue fuera; Romanos abre con «Contexto» Y «Observación»
   («obs editado») intactas. `S115-a6-12-historial-frio.png`, `S115-a6-14-romanos-abierto-premium.png`. ✅
6. Abrir el historial desde la cabecera de la Mesa (lleva `relevantToPassageKey`, re-rankea por relevancia):
   con Juan recreado («S115-a6-777 JUAN vuelve cuatro», en «Observación»), lista Juan, Romanos, Salmos: el mismo
   conjunto, Juan primero. `S115-a6-21-historial-desde-mesa-juan.png`. ✅

### Bloque C — bajar a free con el historial lleno, y volver

1. En Ajustes, el switch «Extras desbloqueados (solo desarrollo)» estaba `checked="true"` (refleja el premium
   de RevenueCat); lo apagué → `checked="false"`, Ajustes muestra «Desbloquear con premium».
   `S115-a6-13`, `S115-a6-15-toggle-off.png`.
2. Historial en free: teaser «Encuentra tus preparaciones pasadas» + «Desbloquear con premium»; la lista NO se
   ve. `S115-a6-17-historial-free-teaser.png`. ✅ Tocar «Desbloquear» abre la hoja de ofrenda con el selector
   real (MX$17 / 49 / 119); la cerré con atrás SIN tocar ningún nivel y vuelve al teaser.
   `S115-a6-18-hoja-ofrenda-desde-historial.png`, `S115-a6-18-hoja.logcat.txt`. ✅ (Se ve también el corte de la
   intro arriba que ya reportó el agente 1, `S115-a1-H1`.)
3. La Mesa de Romanos en free (deep link): las notas siguen ahí («obs editado» visible) y el ícono del
   historial dice «Historial de preparaciones — Extra — se desbloquea con premium».
   `S115-a6-19-mesa-romanos-free.png`, `-19b`. ✅
4. Volver a premium (toggle encendido) → historial: Romanos («contexto dos»), Salmos («contexto tres»), mismo
   orden; Romanos abre con sus dos secciones intactas. `S115-a6-20-historial-vuelta-premium.png`. ✅ Nada se
   perdió ni se alteró al bajar a free y volver (y el agente 4 ya midió la ida y vuelta con un arranque en frío
   en el medio para serie, ilustración, historial y nota).
5. **«Bajar a free con una preparación abierta desde el historial»: no alcanzable por la UI.** El toggle vive en
   Ajustes (una pestaña) y la Mesa es una ruta del stack raíz (`app/features/prep/index.tsx`): ir a Ajustes (por
   deep link o por atrás) la desmonta; con la Mesa de Romanos abierta, el deep link a Ajustes + apagar + atrás
   llevó al Inicio, no a la Mesa (`S115-a6-16-tras-atras-free.png`). El camino real (RevenueCat revoca con la app
   abierta: `addCustomerInfoUpdateListener`, `src/lib/offering/offeringService.ts:188-195`) no se puede
   provocar en el emulador. **Sin medir**, con ese porqué.

### Hallazgo provisional

#### S115-a6-H1 (P3, propuesta) — el historial abierto desde la cabecera de la Mesa no ve lo escrito en los últimos 700 ms

- Defecto: `handleOpenHistory` (`app/features/prep/index.tsx:960-966`) navega sin `flushDrafts` (a diferencia
  de los dos botones que `R9-143` arregló en la 24, `:988-998`). La nota se guarda con un debounce de 700 ms
  (`:1071-1081`), y el historial lee el almacenamiento UNA vez al tomar el foco
  (`app/features/prep/history.tsx:116-121`). La Mesa queda montada debajo, así que el guardado SÍ ocurre, pero
  el historial ya cargó.
- Repro exacto (premium; emulator-5554):
  a) Pasaje existente: Mesa de Juan 3:16-21 con «Observación» = «S115-a6-777 JUAN vuelve cuatro»; tocar el campo,
  `keyevent 123` (fin), y en UN solo `adb shell "input text %sRAPIDO5; input tap 668 264"` (escribir y tocar
  el ícono del historial). El historial muestra la vista previa VIEJA («… vuelve cuatro», sin « RAPIDO5»).
  `S115-a6-22-historial-carrera.png`. Atrás a la Mesa: el campo sí tiene « RAPIDO5»; atrás otra vez a un
  historial que retoma el foco: ahora sí. `S115-a6-23-historial-refoco.png`.
  b) Pasaje NUEVO: `eternalbible://features/prep?book=Romans&chapter=8&startVerse=28&endVerse=28`, tocar
  «Contexto» y en un solo `adb shell "input text S115-a6-777%sNUEVO%sR828; input tap 668 264"`. El historial
  abre SIN Romanos 8:28 (solo Juan, Romanos 5, Salmos). `S115-a6-24-carrera-pasaje-nuevo.png`. Al reabrirlo:
  Romanos 8:28 primero, con su texto. `S115-a6-25-historial-tras-refoco-nuevo.png`.
- Qué ve el usuario: «acabo de escribir y el historial no lo tiene» hasta salir y volver a entrar. Nada se
  pierde (el dato está guardado y el siguiente foco lo muestra). Por eso P3.
- No está en `BUGS.md` (buscado: `handleOpenHistory`, `history.tsx`, «historial» con debounce/foco/flush).
  El hermano `handleOpenSeries` (`:971-977`) tampoco hace `flushDrafts`: no lo medí.
- Arreglo (hipótesis, no se aplica): `await flushDrafts()` antes del `router.push`, como los botones de
  `R9-143` (con sus dos guardas); o que el historial vuelva a leer cuando termine la cola de escrituras.
- Logcat: el guardado no deja línea; `S115-a6-25-sesion.logcat.txt` (sin errores en ese tramo).

### Sin medir (con el porqué)

- Sync y cuenta del historial: con cuenta anónima la Mesa no tiene cuenta (`setPrepAccount(null)`,
  `src/context/AuthContext.tsx:304`) y el sync no corre (`src/context/SyncEngineContext.tsx:93`). C54 quedó sin
  medir por decisión de Victor. Lo de la adopción/cambio de cuenta de la Mesa: Pendiente (`R9-330`/`R9-327`).
- Bajar a free con la preparación abierta: no alcanzable por la UI (bloque C.5).
- Fechas que no sean «Hoy» (Ayer, fechas viejas): no se pueden fabricar sin cambiar el reloj del emulador o
  editar el almacenamiento; la lógica (`DAY_MS`, `src/features/study/prepHistory.ts`) tiene sus pruebas.
- `handleOpenSeries` con la misma carrera.

### Notas de proceso

- Mi worktree se borró solo (sin cambios) a mitad de la sesión; trabajé leyendo el código de `main` (`d34bd4d`)
  y escribiendo SOLO en este `_scratch` ignorado. `git status` del principal: limpio.
- Un `cat >> ... <<'EOF'` con acentos graves en el texto (para el bloque B), contra la regla; el archivo quedó
  bien. Lo demás, con Write/Edit y scripts `.txt`.
- Ningún nivel de la hoja de ofrenda tocado; «Restaurar» no tocado.

### Veredicto de C6

**🐛 BUG P3** (un hallazgo, `S115-a6-H1`). El historial en sí funciona en el dispositivo: orden por última
edición, abrir la entrada correcta con todo su contenido, editar (sube al primer lugar), borrar (vaciando), búsqueda,
persistencia en frío, gate en free con la hoja que abre, y la ida y vuelta free/premium sin pérdida. Sin P0.
