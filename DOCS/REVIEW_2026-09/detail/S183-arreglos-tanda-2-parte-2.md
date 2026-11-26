# S183 — Tanda 2, parte 2: `R9-560` y `R9-32` (en parte); `R9-31` y `R9-53`, a la 184

Sesión 183, Opus 5.5, esfuerzo high, sin agentes. Rama `fix/s183` (sobre `04df90f2`): `d991b711` (`R9-560`) y
`9095ffbf` (`R9-32`, parte). Cortada a ~95 llamadas, como pide el mensaje: el cierre de docs es la sesión siguiente
(`_scratch/S183-CIERRE-PROMPT.md`). Victor mergeó `fix/s183` el 2026-11-25 (`main` = `9095ffbf`); los docs van en
`docs/review-s183`, escritos en la 183b, con un hallazgo nuevo: `R9-637` (§1).

## 1. `R9-560`: los toasts detrás del modal «Datos» (`d991b711`) — ✅ ARREGLADO

- **Causa:** el toast es un `View` absoluto que dibuja la raíz (`ToastContext.tsx`), en la ventana principal. Un
  `Modal` nativo es otra ventana encima. El toast no puede ser un `Modal` (robaría los toques de toda la app durante
  3 s, comentario del provider).
- **Arreglo:** `src/context/ToastLayer.tsx` (nuevo). El estado de dónde se dibuja el toast va en un contexto aparte
  (`ToastLayerContext`); un `<ToastHost />` montado en el contenido de un `Modal` se registra al montarse y, mientras
  esté montado, el último montado dibuja el toast en su ventana, con el mismo `View` `box-none`. Sin hosts, lo
  dibuja la raíz como antes. Un `Modal` solo monta sus hijos visible, así que un host de un modal cerrado no reclama
  nada. Va en un módulo propio porque 59 archivos de prueba mockean `ToastContext` con factoría literal: un host sin
  provider da `null`. El valor de `useToast()` no cambia de identidad (`toastContextStableValue` sigue verde).
- **Montado en:** `DataSettings` (el modal), `ConfirmDialog` (el aviso de import parcial sale justo antes de que se
  abra el diálogo «cerrá y volvé a abrir»: sin host ahí, el toast quedaba detrás del diálogo), `OfferingSheet` e
  `ImageShareModal`.
- **Jest** (`__tests__/toastHostModal.test.tsx`, 6 casos, `ToastProvider`, `DataSettings`, `ConfirmDialog` y
  `parseBackupPayload` reales): import roto (el JSON malformado lo rechaza el `parseBackupPayload` real), error de
  export y aviso parcial (dentro del diálogo de reinicio, la ventana de arriba) se dibujan dentro de su `Modal` y una
  sola vez; controles: sin modal, la raíz; al cerrar el modal el toast vivo vuelve a la raíz; el overlay es
  `box-none` y un botón debajo recibe el toque.
- **Revert por pieza** (`_scratch/S182-rev.cjs.txt`, todas restauradas): sin host en `DataSettings`, caen 3; sin host
  en `ConfirmDialog`, 1 (el parcial); la raíz dibujando siempre, 4 (duplicado); todo host dibujando y no solo el de
  arriba, 1 (el parcial, duplicado).
- **Vecinos:** `--findRelatedTests` de los seis archivos: 183 suites, 1393 pruebas, verdes. Consumidores de
  `ToastLayerContext`: solo el provider y `ToastHost`.
- **En vivo** (Pixel_9_Pro, `-read-only`, sin sesión iniciada en la app, techo 1): con el modal abierto, import de
  `s183-roto.json` (16 B) desde Descargas → ráfaga de 12 capturas arrancada antes del toque: el toast rojo «Backup
  import failed…» se ve dentro del modal (`_scratch/S141-sondas/S141-s183-imp-roto-r4.png`; en la S138, 0 de 14).
  Con el toast en pantalla (1,2 s tras confirmar, `S141-s183-toast-vivo.png`), un toque en «Import backup» abrió el
  selector: no roba toques.
- **Sin medir / para la revisión de la 184:**
  - El toast tapa durante 3 s la cabecera del modal (la X de cerrar y el título): `top: 20` en una ventana que
    dibuja bajo la barra de estado. Igual que en la ventana principal con cualquier pantalla; la X del toast lo cierra.
  - En `ConfirmDialog` y `OfferingSheet` el host es hermano del contenedor con `accessibilityViewIsModal`: en iOS,
    VoiceOver no enfoca el toast (sí lo anuncia, `announceForAccessibility`). En `DataSettings` e `ImageShareModal`
    está dentro.
  - **Hallazgo nuevo, `R9-637` (P3, por lectura):** otros ~20 archivos con `Modal` y `useToast` sin host
    (`grep -l "<Modal"` ∩ `useToast`: `CompareImageModal`, `DonationSheet`, `MemoryShareCardModal`,
    `RedeemCodeSheet`, `GoalsSettings`, `NotificationsSettings`, `ProphecyShareModal`, `ShareCustomPlanModal`,
    `ShareTogetherModal`, `BadgeCollectionScreen`, `VersionComparisonScreen` y pantallas de `app/`; contados en la 183b: 22, la lista en la entrada). Cada uno pide
    mirar si el toast sale con su modal abierto; el arreglo es una línea por modal.
  - El export con éxito no muestra toast (no hay en el código), así que en vivo solo se midió el import roto; el
    error de export, en jest.

## 2. `R9-32`: el archivo de respaldo en caché (`9095ffbf`) — EN PARTE, sigue abierto

- **Medido en vivo:** caché sin respaldos; dos exports descartando la hoja (BACK) → dos archivos de 15 370 B en
  `cache/` (`eternalstone-backup-…23-10-37-282Z.json` y `…23-10-44-735Z.json`), y ningún aviso al descartar.
- **Arreglo (la caché):** `exportBackup` borra los `eternalstone-backup-*.json` anteriores antes de escribir el
  nuevo; el nuevo queda (`shareAsync` resuelve al cerrarse la hoja, no cuando el destino terminó de leerlo).
  Best-effort: un fallo de la limpieza se loguea y no corta el export. Y `isAvailableAsync` va antes de escribir:
  un aparato sin compartir no queda con un archivo que nadie ve.
- **Jest** (`__tests__/backupExportCacheCleanup.test.ts`, `exportBackup` y `buildBackup` reales, caché en memoria):
  dos copias viejas y un archivo ajeno → queda una sola copia, la nueva, con el JSON, y el ajeno; sin compartir, sin
  archivo. **Revert:** sin la limpieza cae el primero; sin la guarda temprana cae el segundo (el revert quitó la
  guarda entera en vez de moverla detrás de la escritura: discrimina, pero no es el orden viejo exacto).
- **En vivo con el arreglo:** dos exports más → tras el primero, un archivo (se fueron también los dos de antes);
  tras el segundo, uno.
- **Qué promete «Exportar» — DECIDIDO (Victor lo delegó, 2026-11-25): (a), un aviso neutro al volver de la hoja.**
  `shareAsync` no sabe si un destino guardó el archivo; hoy descartar la hoja no dice nada y el usuario puede creer
  que tiene un respaldo. Opciones: (a) el aviso; (b) guardar con el selector de carpetas del sistema (SAF), que sí
  confirma dónde quedó; (c) dejarlo. En el chat recomendé (b); al decidir, (a): el daño que nombra `R9-32` es la
  creencia falsa, y (a) la quita igual en Android e iOS, con una línea en los dos idiomas y sin flujo nativo nuevo
  que medir. (b) solo existe en Android (en iOS la hoja ya trae «Guardar en Archivos») y es una función, no un
  arreglo: al backlog de ideas. Texto propuesto, un `toast.info` tras `exportBackup` sin secciones degradadas (con
  degradadas sigue el aviso parcial): es «Copia lista. Solo queda guardada donde la hayas enviado (Drive,
  Descargas…).»; en «Backup ready. It's only kept wherever you sent it (Drive, Downloads…).». Va en la 184; con eso
  `R9-32` se cierra.

## 3. `R9-31` y `R9-53`: a la 184, con lo ya leído

- **`R9-31`** tiene dos mitades. (1) `withTransactionAsync` no exclusiva (`BackupService.ts`, «SQLite portion»): la
  exclusiva de expo-sqlite abre otra conexión y los demás escritores reciben «database is locked» mientras dura, en
  vez de caer dentro de la transacción: hay que medir qué escritores corren durante un import (sync, racha) y si
  reintentan. (2) El push del restore solo encola escrituras, nunca borrados. **Qué hace el restore con la nube —
  DECIDIDO (Victor lo delegó, 2026-11-25): no borra en la cuenta; el restore reemplaza los datos de ESTE aparato y el
  diálogo lo dice.** Por qué: la asimetría de lo irreversible. Un borrado de más en la nube alcanza a todos los
  aparatos de la cuenta y no hay copia en la nube para deshacerlo (un respaldo viejo borraría lo que se creó después
  en otro teléfono); un elemento de más que vuelve se borra a mano. La parte del bug que queda es la mentira: «reemplaza
  tus datos» con sesión iniciada no es cierto para la cuenta. En la 184: medir CUÁNDO vuelve lo que el restore borró
  (en el arranque en frío que pide el propio aviso de reinicio, o solo en una reinstalación) y, con eso, el texto
  exacto del diálogo de confirmación con sesión iniciada, en los dos idiomas (fidelidad: no prometer lo que no
  pasa). La mitad (1), la transacción exclusiva, es técnica y se mide en la 184.
- **`R9-53`** (el floor que se duplica): propuesta técnica sin implementar, para medir en la 184 — al importar
  `reviewEvents`, restar del floor (por banda, con piso 0) solo los eventos que el import agrega y que no estaban en
  el log local de antes (por id): son los que el floor ya puede contar. Lo que estaba local antes y se reimporta no
  toca el floor (ya era disjunto). Sin vía de escape en la UI (`R9-61`), así que el arreglo tiene que ser exacto.

## 4. Validate

`NODE_ENV=development npm run validate` en `fix/s183` (`9095ffbf`), sin Metro ni emulador: verde, 443 suites y 5239
pruebas (la 182: 441 y 5231; +2 suites, +8 pruebas). Salida: `_scratch/S183-validate.out.txt`.
