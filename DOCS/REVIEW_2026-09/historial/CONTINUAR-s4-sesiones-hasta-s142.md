# Historial — `CONTINUAR.md`: la §4 de antes, los párrafos por sesión (hasta la 142)

> Movido tal cual desde `CONTINUAR.md` en la sesión 143 (2026-11-12). **No rige: es registro.** Lo que rige está en
> `CONTINUAR.md`, `REGLAS.md`, `RECETAS.md` y `ESTADO.tsv`.

**Sesión 142 (la conciliación de los hallazgos viejos; solo docs):** el conteo real, de `ESTADO.tsv`: **274 abiertos
de 573 (ningún P0, 20 P1, 92 P2, 161 P3 y el aviso `R9-1`)**, 2 sin verificar (`R9-177`, `R9-240`: piden emulador),
285 arreglados y 12 aceptados. De los abiertos, **113 son viejos** (`R9-1`..`R9-409`: los 20 P1, 47 P2, 45 P3 y el
aviso) y no están en las tandas de abajo, que cubren solo `R9-410` en adelante (161: 45 P2 y 116 P3). Los 20 P1, con
los de dinero arriba (`R9-16`..`R9-19`), están en `detail/S142-conciliacion.md` §3. Dónde entran en las tandas lo
decide Victor. **Lo siguiente: la 143, solo docs (`_scratch/S143-PROMPT.md`); después, los arreglos
(`_scratch/S14X-PROMPT-arreglos.md`).**

**Sesión 141 (la revisión del diff de la 140, sin agentes, Fable 5.2 como principal, un emulador):** los tres
arreglos se sostienen (`R9-424` y `R9-425`, EN VIVO con su control). Cuatro hallazgos nuevos, P3: `R9-570` (una
regresión del arreglo de `R9-424`: con el pack ausente, cada frío duplica los recordatorios del versículo del día),
`R9-571` (la ✕ del reproductor no lo pliega; el estado roto de `R9-427` no se alcanza en vivo), `R9-572` (la prueba
de `R9-427` usa un `hidePlayer` simulado) y `R9-573` («al final del libro» sobre una lista no vence). `R9-569`,
refutado en su consecuencia. Los arreglos de esos cuatro y la tanda 2 de P2 van después de la 143 (corregido en la
142: aquí decía que eran la 142). Detalle: `detail/S141-revision-del-diff-s140.md`.

**Sesión 140 (la PRIMERA de la fase de ARREGLOS, sin agentes, Fable 5.2 como principal):** la tanda 1, los tres P1:
`R9-424`, `R9-425` y `R9-427` ✅ ARREGLADOS (`7d4a511f`, `a6a0ef13`, `e8700067`), cada uno con su prueba vista FALLAR
sin el arreglo; `R9-569` nuevo (P3, por lectura). No queda ningún P0 ni P1 abierto. Mergeada (`177029af`). Detalle:
`detail/S140-arreglos-p1.md`.

(Aquí iban las tandas 2 a 9, que siguen en `CONTINUAR.md` §4.)

**Sesión 139 (filas C P1 de datos y núcleo, SIN agentes, en un chat nuevo; un emulador):** `C42b` 🐛 (`R9-564`,
`R9-565`, P3), `C43b` 🐛 (`R9-566`, `R9-567`, P3), `C20b` 🐛 (`R9-568` P2; «1 capítulos» suma a `R9-524`), `C7` ✅.
Ninguno P0. **Quedan, de ese alcance, `C17` (Lectura: capítulo, versículo, versión; con `R9-424`, `R9-558`,
`R9-565`, `R9-567` y `R9-568` ya escritos, que tocan el lector y la pestaña Biblia) y `C23` (Búsqueda; BUG-6 de Fable,
«ir a referencia», y `R9-428`..`R9-431` de `A16`: buscar la clave antes).** **Recomendado para la 140, si Victor no elige otra cosa:**
el mensaje `_scratch/S140-PROMPT.md` (`C17` y `C23`, y después las C P1 que siguen en el índice: `C18`, `C19`, `C21`,
`C22`). Alternativas: la cuenta de Google de PRUEBA (las filas de cuenta) o una sesión de arreglos
(`R9-410`..`R9-568`). Pistas sin numerar para filas futuras: «Lee 500 versículos» tras ~188 versículos distintos
(`C29`, ver `detail/C20b-memoria-mazo.md`) y campos sin etiqueta en la Mesa (`C40`, ver `detail/C7-series.md`).

**Sesión 138 (Modo C P0, 3 agentes a pedido de Victor, en un chat nuevo; sin cortes):** `C27a` 🐛 (`R9-558` P2: el
reset de la Biblia borra en silencio las versiones descargadas y deja `@bible_version` en una sin filas; `R9-559` P3:
el lector nativo pinta en blanco un capítulo sin filas); `C26b` pasa a 🐛 P2 con `R9-560` (los toasts del modal
«Datos» se dibujan DETRÁS del modal: medido con ráfagas de capturas y con la separación); `C42a` 🐛 (`R9-561` P2: la
hoja de nota queda tapada por el teclado; persistencia ✅; `R9-57` medido en vivo: gana el `Modal`); `C43a` 🐛
(`R9-562` P2: la ✕ del selector de colores borra el subrayado con su nota sin confirmar; `R9-563` P3; persistencia ✅,
los arreglos de `R9-44` y `R9-50` se sostienen en vivo). Ninguno P0, salvo lo que Victor decida sobre `R9-562` (§8).
**Con eso, el Modo C P0 queda hecho salvo lo
que espera una cuenta de Google de PRUEBA:** `C26a`, `C54`, `C55`, el suelo restaurado de `C20a` (que sigue EN CURSO)
y «Borrar cuenta»/«Cerrar sesión» de `C27a`. **Recomendado para la 139, si Victor no elige otra cosa:** el mensaje
`_scratch/S139-PROMPT.md` (las filas C P1 de datos y núcleo, con emulador). Alternativas: agregar la cuenta de prueba
a un emulador y hacer las filas de cuenta (`C26a`, `C54`, `C55`, el resto de `C20a` y `C27a`), o una sesión de
arreglos (`R9-410`..`R9-563`).

**Sesión 137 (Modo C P0, 3 agentes, cortada por el límite de uso):** `C1a` ✅; `C26b` 🐛 (`R9-557`, P3); `C20a`
EN CURSO (`R9-556`, P3; falta el suelo restaurado, cuenta de prueba); `C27a` EN CURSO (el reset de la Biblia quedó a
medio recargar; ¿se pierde KJV? sin re-verificar); `C42a` EN CURSO (casi todo sin medir); `C43a` PENDIENTE; `C26a`
«sin medir» (cuenta de prueba). **Recomendado para la 138:** el mensaje `_scratch/S138-PROMPT.md` (seguir las filas C
EN CURSO desde lo «sin medir» de cada detalle, y el control de toasts de `detail/C26b-respaldo.md`).

**Las filas del Modo A y del Modo B están TERMINADAS (la 136 cerró `B6`–`B10`: `R9-550`..`R9-555`, todos P3).**
**Recomendado para la sesión 137, si Victor no elige otra cosa: el mensaje (dk), las 7 filas C P0 (Modo C, con
emulador)** (`_scratch/S137-PROMPT.md`); `C26a` necesita una cuenta de Google de PRUEBA. Alternativa legítima: una
sesión de arreglos (`R9-410`..`R9-555`). La 135 (13 agentes) cerró `A45` y `A46` (`R9-536`..`R9-549`). La 134 (sin agentes, en un chat
nuevo) cerró `A43` (`R9-531`, `R9-532`) y `A44` (`R9-533` P2, `R9-534`, `R9-535`), ninguno P0. Las sesiones 132 y 133 fueron los dos pilotos de re-revisión con Fable 5.2 (`A7`:
`R9-529`; `B4`: `R9-530`; los dos P3). La 131 (sin agentes, en el mismo chat que la 130) cerró `A41` (`R9-527`) y `A42` (`R9-528`), P3, ninguno P0;
la 130, `A39` y `A40` (`R9-524`..`R9-526`). La nube no es una opción. Lo de abajo es el menú de siempre para después.

**~~Recomendado: el Modo C P0 de dinero y gating~~ HECHO en la 115** (`detail/C15-hoja-ofrenda.md` y vecinos).
**Quedan, tras la 138, 4 filas C P0:** `C20a` (EN CURSO: el suelo restaurado) y `C26a`, `C54`, `C55` («sin medir»).
Las cuatro (y «Borrar cuenta»/«Cerrar sesión» de `C27a`) necesitan **una cuenta de Google de PRUEBA** que Victor agregue a una
instancia de solo lectura (la del AVD es la suya y ya tiene la ofrenda): ver §6, «Modo C».

**~~Recomendado: terminar `A12`~~ HECHO en la 114** (`detail/A12-superficies-crash.md`).

Alternativas legítimas:

- **Seguir la sesión de ARREGLOS.** La 7 hizo el primer tramo (`R9-49`/`R9-27`/`R9-28`,
  `R9-47`, y `R9-44`/`R9-45`/`R9-50` juntos por su raíz); la 8 hizo `R9-46` y **el bloque
  entero de mezcla entre cuentas** (`R9-22`/`R9-48`/`R9-23`); la 9, el bloque de **sync que
  descarta en silencio** (`R9-33`/`R9-34`/`R9-35`); la 10, el de **dinero**
  (`R9-9`+`R9-10`); la 11, **cola y cursor** (`R9-11`+`R9-65`); la 12, **el bloque web**
  (`R9-13`+`R9-15`+`R9-14`). **Ya no queda orden que seguir:** los tres P0 sueltos
  (`R9-36`, `R9-38`, `R9-39`) son independientes entre sí, y los 4 de campo
  (`R9-40`..`R9-43`) son baratos y muy visibles: buenos para cerrar la sesión.
- **`B6`–`B10`** (Modo B, P1/P2) si preferís terminar el Modo B de una: permisos Android,
  `npm outdated`, `expo-doctor`, deps sin usar, licencias. Baratas, sin entorno. Ojo:
  extendé `B9`/`B10` a `functions/` y `vercel/`, no solo a la raíz.
- **Modo C P0** (14 filas) si querés pagar el arranque de emulador una sola vez.
  **Requiere** el recipe de `reference_essb-device-testing-and-automation` y **emulador +
  APK debug**, nunca el OnePlus de Victor. Hay dos hallazgos que **solo** se cierran ahí:
  `R9-57` (¿gana el `BackHandler` del `Modal` sobre el `useBackHandlerStep`?) y la
  verificación en vivo de `R9-47`.

**No mezcles modos en una misma sesión** (charter §3) — cada uno tiene su entorno.
