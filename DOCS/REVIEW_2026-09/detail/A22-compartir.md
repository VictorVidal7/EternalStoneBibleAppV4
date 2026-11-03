# A22 — Compartir (`ShareService`, `features/share`, `ImageShareModal`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 121 (2026-11-03, chat nuevo; con 3
> agentes a pedido de Victor) · Estado **🐛 BUG**
>
> **Resultado:** 2 hallazgos nuevos (`R9-442`, `R9-443`, P3), ninguno P0, y una nota «Medido en la 121» en
> `R9-416` (el mismo hueco en el hermano). Lo que comparte aguanta los toques dobles, la hoja cancelada y el
> error (cae al portapapeles con aviso); lo que falla es lo que el modal de imagen guarda y lo que no revierte
> cuando cae el entitlement.
>
> **Cómo se midió:** dos agentes (`fork` en worktree, sobre `f5493d4`), que solo midieron: el 1, lo que
> comparte (`ShareService` y sus llamadores, la captura, `ShareCardHost`, `ownPhotoPicker`, `sharePdf` y los
> modales hermanos); el 2, `ImageShareModal` entero y lo que presenta y persiste. Dos sondas con
> `_scratch/S116-correr.cjs.txt`, cada una re-medida igual en el principal: `S121-presets.test.tsx.txt` (el
> modal real montado, con el `PremiumProvider` real) y `S121-compartirTextoWeb.test.tsx.txt`. Las copias de
> los agentes, con su informe, en `_scratch/S121-sondas-agente-{1,2}/`.

## El área

`src/services/ShareService.ts` (289 L), `src/features/share/` (13 archivos, ~1,5k L),
`src/components/reading/ImageShareModal.tsx` (1201 L; desde `:943`, solo `StyleSheet`) y el camino de
compartir de los modales hermanos (`MemoryShareCardModal`, `ProphecyShareModal`, `ShareTogetherModal`,
`ShareCustomPlanModal`, `sharePdf`). Lo ya dicho, no re-derivado: Fable, área 25 (en vivo ✅; su BUG-7, el
«Estilo N» en español, ya arreglado: `ImageShareModal.tsx:576-585`), su BUG-8 (el texto a `expo-sharing`:
arreglado en `12488d6`, lo afirma `__tests__/shareService.test.ts`) y las áreas 44, 50, 52 y 53 (compartir
como imagen funciona); el gating premium con el entitlement fijo lo midió el Modo C en la 115 (`C16`, `C56`).
Las pruebas que ya hay: `shareService`, `shareOrDownloadImage` (9), `ownPhotoPicker` (6),
`imageShareModalOwnPhoto`, `imageShareModalPremium`, `prophecyShareModalWebFallback`, `stylePresets`,
`prepTableScreenPdfExport`.

**El mapa:** `ShareService` tiene un solo llamador vivo, `shareVerse` desde el versículo del día
(`app/(tabs)/index.tsx:1007-1019`). 11 modales gratis comparten imagen por `useShareImage`; 6 lo hacen a mano
(`MemoryShareCardModal`, `ProphecyShareModal`, `CompareImageModal`, `journey`, `journeys/[routeId]`,
`prophecies/map`); todos terminan en `shareOrDownloadImage`. El texto: 6 sitios llaman a
`Share.share(...).catch(() => undefined)` directo (`ShareTogetherModal:130`, `ShareCustomPlanModal:50`,
`collections/[name]:128`, `devotional:254`, `prep:1344`, `sermon-notes/[id]:261`).

## Hallazgos

**`R9-442` (P3): borrar un estilo guardado y guardar otro deja dos con el mismo nombre.**

- `src/features/share/stylePresets.ts:53`: `name: String(presets.length + 1)`, por el largo de la lista y no por
  el mayor número usado. El mismo cálculo en `compactStylePresets.ts:52` (el almacén de `PremiumShareExtras`,
  12 modales).
- **Repro:** con premium, lector → Imagen → «Guardar estilo» tres veces (Estilo 1, 2, 3) → ✕ en «Estilo 1» →
  «Guardar estilo»: «Estilo 2», «Estilo 3», «Estilo 3», con dos looks distintos. Igual al llegar al tope de 6
  y borrar cualquiera.
- **Sonda:** `_scratch/S121-presets.test.tsx.txt`, bloque 1 (el modal real):
  `{"names":["2","3","3"],"chipLabels":["Estilo 2","Estilo 3","Estilo 3"]}`; el almacén compacto,
  `["2","3","3"]`: rojo los dos. `__tests__/stylePresets.test.ts:29-33` solo prueba altas seguidas.
- **Propuesta (sin escribir):** numerar con el mayor número usado + 1.

**`R9-443` (P3): si el entitlement cae con el lector montado, la plantilla exclusiva elegida sigue en la
tarjeta y se comparte.**

- `src/components/reading/ImageShareModal.tsx:213-238` revierte la tipografía (`:216-220`), la textura
  (`:224-228`) y la foto propia (`:234-238`) cuando `isPremium` pasa a `false`, pero no `themeIndex`; la
  tarjeta se pinta con `SHARE_TEMPLATES[themeIndex]` (`:245`) sin mirar `isTemplateUnlocked`, y `handleShare`
  (`:299-330`) la captura.
- **Repro:** el modal queda montado con el lector (`app/(tabs)/verse/[book]/[chapter].tsx:3549`, el `Modal`
  solo cambia `visible`) y con `app/features/lectio.tsx:775`. Un usuario con la ofrenda elige «Estilo 11»
  (cosmos) y cierra; a mitad de sesión el entitlement cae por el listener real (`PremiumContext.tsx:74-77`):
  un reembolso o una revocación (el camino de `R9-9`), u otra cuenta que entra en un teléfono compartido
  (`offeringService.ts:224-230`). Al volver a Imagen, la muestra sale bloqueada y seleccionada a la vez, y
  «Compartir» exporta el diseño exclusivo, hasta que se remonta el lector.
- **Sonda:** `_scratch/S121-presets.test.tsx.txt`, bloque 2 (`PremiumProvider` real, `Purchases` simulado como
  `__tests__/imageShareModalPremium.test.tsx`): control, la textura «Puntos» vuelve a «Ninguna»; la plantilla,
  `{"seleccionadaBloqueada":{"selected":true},"nodosConColoresCosmos":4,"capturas":1,"ofrenda":0}` (revertida
  serían 2 nodos): rojo.
- **No es P0:** no se cobra de más ni se pierde acceso pagado; se filtra un diseño exclusivo hasta remontar.
  `C16`/`C56` midieron el gating con el entitlement fijo, no con una caída a mitad de sesión.
- **Propuesta (sin escribir):** el mismo efecto de revertir para `themeIndex` (a la primera plantilla libre).
  Sin medir, el mismo hueco por lectura en `useShareImage.ts:72-77` y en `NoteImageModal` (`:79-80`, montado en
  la pestaña Notas, `app/(tabs)/notes.tsx:354`, y en `NoteEditorModal.tsx:297`).

**Suma a `R9-416` (P3, Medido en la 121):** el modal de imagen tiene el mismo hueco que `PremiumShareExtras`:
`ImageShareModal.tsx:154-164` (`saveStylePreset(...).then`, sin `catch`) y `:189` (el borrado), sobre
`stylePresetsStore.ts:36-53` (atrapa la lectura, no la escritura). Sonda: `_scratch/S121-presets.test.tsx.txt`,
bloque 3: con `setItem` rechazando una vez, `{"setItem":6,"success":0,"error":0,"chips":0}` y el rechazo sin
manejar («database or disk is full»). El camino es el de `R9-52` (el techo de 6 MB de Android).

## Revisado sin hallazgo

- **`shareVerse`** (`ShareService.ts`): con la hoja fallando copia y avisa (sonda del agente 1:
  `{"ok":false,"shareCalls":1,"clipboard":1,"feedback":["success"]}`); la versión sale de la base
  (`database/index.ts:1956-1960`); el idioma cacheado se invalida al cambiarlo (`useLanguage.tsx:43-50`).
- **`useShareImage.ts:79-114`** y las 6 capturas a mano: la guarda `isSharing` y el botón deshabilitado,
  el `finally` lo limpia siempre, el error y el éxito con toast.
- **`handleShare` del modal** (`:299-330`): la misma guarda.
- **`shareOrDownloadImage`:** sus 9 pruebas; en web, la captura da un `data-uri` (`RNViewShot.web.ts:8-11,44`).
- **`ShareCardHost`:** `collapsable={false}`, lo que pide la captura en Android.
- **`ownPhotoPicker`:** sus 6 pruebas; en Android 13+ no pide permiso; en 12 o menos la librería declara los de
  almacenamiento (`maxSdkVersion=32`) y `app.json` solo bloquea cámara y micrófono.
- **`sharePdf`:** copia a la caché y comparte; si la copia falla, el original.
- **`ShareTogetherModal:85-96`:** recarga fecha y grupo en cada apertura.
- **El modal de imagen:** la tipografía sembrada desde el lector (`:194-210`, deps `[visible]` a propósito;
  `:216-220` corrige una exclusiva para un usuario gratis); aplicar un estilo (`:166-184`: sale de la foto
  propia, ignora una plantilla que ya no existe, no aplica lo bloqueado; los chips solo con premium, `:570`);
  guardar con foto propia se rechaza con aviso (`:139-152`); `parseStylePresets` (`stylePresets.ts:68-97`)
  descarta el JSON corrupto y las filas malas, con tope de 6; los toques bloqueados abren la ofrenda (Fable 25);
  `ShareTextureOverlay`, `isTextureUnlocked` (`textures.ts:29-35`) e `isTemplateUnlocked`
  (`imageTemplates.ts:209-214`); `PremiumShareExtras` recarga en cada apertura (`:89-91`).

## No alcanzable

- **«Compartir» de texto sin `navigator.share` en la web no hace nada** (los 6 sitios de texto se tragan el
  rechazo de react-native-web; el versículo del día sí copia). Sonda: `_scratch/S121-compartirTextoWeb.test.tsx.txt`
  (la hoja real `ShareTogetherModal`): control verde; `{"shareCalls":1,"clipboard":0,"toastSuccess":0,"toastError":0}`.
  Nadie llega hoy: la navegación web solo tiene Biblia y Ajustes (`_layout.web.tsx:1-22`), el lector web no
  tiene compartir, y `plan/[id]` cae en el ErrorBoundary de `R9-14`. Si la web llega ahí, P3 con el mismo
  `catch` del versículo del día.
- **Dos toques en el mismo frame:** entre dos toques reales el botón ya está deshabilitado.
- **Dos guardados en el mismo milisegundo** (`id` repetido, `stylePresets.ts:53`), **doble toque en «Guardar»**
  (dos estilos idénticos, se pierde uno) y **la carga al abrir que pisa un guardado** (`:134-137`: AsyncStorage
  responde antes de cualquier toque).
- **El primer arranque en inglés con el idioma cacheado en «es»:** pide que `getTranslations` corra entre el
  `getItem` y el `setItem` de `useLanguage.tsx:27-36`; sus llamadores los dispara el usuario.

## Sin medir

- `R9-443` en los hermanos (`useShareImage`, `NoteImageModal`): por lectura, el mismo hueco.
- **Doble toque en «Foto propia»** (`ImageShareModal.tsx:273-297`, sin guarda en vuelo): dos selectores de
  galería a la vez; lo que hace el sistema es de dispositivo (Modo C).
- **Cerrar el modal con la captura en vuelo** (`:306-318`): la hoja se abre después de cerrar; tiempos nativos
  (Modo C), sin daño esperado.
- **Dos exportaciones de PDF seguidas** (`sharePdf.ts:31-33`: la segunda borra el archivo que la primera quizá
  aún comparte): Modo C, y es la Mesa (Pendiente).
- **Alcance sin recorrer:** de los 11 modales de `useShareImage`, solo la llamada al hook y el botón; de
  `collections`, `devotional`, `sermon-notes` (`A42`) y `prep`, solo su línea de `Share.share`.

## Fuera de fila

- (fila `A31`) `ShareService.shareMultipleVerses` (`:84`), `shareReadingPlan` (`:128`), `shareAchievement`
  (`:155`) e `isSharingAvailable` (`:280`) no tienen llamadores; `src/features/share/ShareStylePicker.tsx`
  tampoco.
