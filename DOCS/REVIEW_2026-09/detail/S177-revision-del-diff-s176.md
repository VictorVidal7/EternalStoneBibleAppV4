# Sesión 177 — revisión del diff de la 176 (`R9-625`, `R9-624`, `R9-627`; `R9-626` aceptado)

> Sin agentes, con emulador (`-read-only`, Pixel_9_Pro, APK debug vc73 con Metro, cuenta anónima, sin la de Victor).
> Opus 5.5 principal, esfuerzo high. Sin cambios de código. Revisado desde `fix/s176` (`48187d8a..4d5e4777`); docs en
> `docs/review-s177`.

## 1. Estado de partida

main = origin/main = `48187d8a`; `fix/s176` (`4d5e4777`) y `docs/review-s176` (`ae09629d`) sin mergear. `git status`
limpio. Calza con el segundo caso del mensaje.

## 2. Veredicto

**El diff se sostiene. Sin hallazgos nuevos.** 274 abiertos de 627, como al cerrar la 176. El revert por pieza de la
176 se repitió y da lo mismo: sin `verseNoteKey.ts` caen 5, sin `database/index.ts` cae 1 (la H1) y sin `lectio.tsx`
cae la de lectio.

Sondas: `_scratch/S177-sondas.test.ts.txt` (SQLite real, el arnés de `notesVerseKeyR951`; salida en
`_scratch/S177-sondas-salida.json`) y `_scratch/S177-lectio.test.tsx.txt` (la pantalla real). Se corrieron copiadas a
`__tests__/` y se borraron de ahí.

## 3. Punto por punto

**1. La regla por párrafos (`mergeNoteTexts`).** No pierde texto en ningún caso medido.

- Casos de borde (`mergeNoteTexts` puro): `a\r\n\r\nb` y `a\n\nb` dejan el primero (CRLF incluido: el reparto
  `/\n\s*\n/` se come el `\r` y el recorte lo quita); `a\r\nb` y `a\nb` (un solo salto) quedan los dos, porque son
  párrafos distintos: copia de más, sin pérdida. Espacios al borde: `" a \n"` y `"a"` dejan `" a \n"`. Una nota
  vacía o de solo espacios no tiene párrafos: se va al lado de cualquier otra, y entre dos vacías queda la primera.
  Tres textos con los mismos párrafos: queda el primero. La unión de otros dos queda sola, sea la más vieja o la más
  nueva. `x\n\ny` y `x\n\nz` dan `x\n\ny\n\nx\n\nz` (la `x` dos veces, sin pérdida). Una línea simple no parte:
  «Ver Juan 1» y «Ver Juan 1\nVer Juan 14:6» quedan las dos.
- Propiedad, 4000 casos generados (párrafos de un pool, separadores `\n\n`, `\r\n\r\n`, `\n \n`, `\n\n\n`, bordes
  con espacios y CRLF, `createdAt` con empates): **0 fallos**. Ningún párrafo (recortado) de ninguna nota falta en el
  plegado; plegar el plegado con sus notas da el mismo texto, con el plegado delante (el orden del adaptador:
  `[...local, entrante]`) y detrás (otro `rowid`); sin empates de `createdAt`, invertir las filas no cambia nada.
- Orden estricto: por lectura y por la propiedad. «`b` domina a `a`» es irreflexiva y transitiva (la inclusión de
  conjuntos es transitiva, y si `c ⊆ a ⊆ b ⊆ c` los tres son iguales y manda la posición), así que siempre queda
  uno. Y si alguna nota ya tiene todos los párrafos, queda exactamente esa: por eso el plegado del plegado no cambia.
  Con empates de `createdAt` decide el índice, que en la migración y el import es el `rowid`
  (`ORDER BY rowid`): `b\n\na` sembrada antes que `a\n\nb`, con la misma fecha, deja `b\n\na`. Lo que pidió el
  mensaje.
- Las tres puertas en SQLite: la migración dos veces (la segunda, `written: []`, `removedIds: []`, filas iguales); el
  adaptador con dos docs viejos repetidos (la segunda entrega no cambia nada, en los dos órdenes); el import
  (`foldVerseNotesInTransaction`) dos veces, la segunda vacía. El orden de llegada del adaptador sigue dando textos
  distintos (`X\n\nSalmo 2\n\nCompárese…` contra `X\n\nCompárese…\n\n\nSalmo 2`): es `R9-626`, ya aceptado.
- Lo que la regla deja fuera del texto, además del espacio al borde de un párrafo que dice la 176: **la repetición de
  un párrafo dentro de una nota.** Los párrafos se comparan como conjunto: «Amén» y, más nueva, «Amén\n\nAmén» dan
  «Amén». Es el mismo párrafo, sin una palabra perdida; no se anota.
- Lo que conserva: con los mismos párrafos queda el texto más VIEJO, con su forma. En vivo, Filipenses 4:13 quedó
  « Fuerza en Cristo \n» (la más vieja, con sangría y salto final) y se fue la más nueva, limpia. Son notas
  distintas, no ediciones; sin pérdida, no se anota.

**2. `notesFoldedHere`.**

- El import: no toma el candado ni pone la marca. Entre el plegado de arranque y la bandera (milisegundos, al abrir
  la app) no se llega a Ajustes; el cruce del import con el adaptador es el de la §3.2 de la 175, sin cambios.
- Una lápida del `vnote:` (otro aparato borró la nota del versículo) que llega durante el plegado (sonda 2a): espera
  el candado y borra la fila que el plegado acaba de escribir; el lote encola igual la fila (`nota A local`) y la
  lápida del id viejo. Por lectura del motor: sin la carrera pasa lo mismo al final (la lápida llega después del
  plegado, la fila local es más nueva y el LWW la salta; el lote sube y resucita la nota en el otro aparato). Con la
  carrera, este aparato se queda sin la fila hasta que vuelve el eco de su propia escritura (`!local && data &&
!deleted`, sin lápida en cola: se aplica). Transitorio, del plegado de la 174 (no de la marca: la carrera es la de
  `getLocal` fuera del candado), y es el «la lápida de un id viejo… transitorio» aceptado en la §5 de la 174. No se
  anota. Medirlo con la nube espera `R9-135`.
- El doc `vnote:` de otro aparato durante el plegado, con `getLocal` leído antes (sonda 2b): reemplaza la fila
  plegada; el lote sube el plegado local. Gana el último, como en el «con notas distintas, gana el último» aceptado
  en la §3.1 de la 175. Sin cambio de la 176.
- Un plegado que hace commit y falla en el `setItem` (sonda 2c): marca `true`, bandera `null`, el lote YA encolado
  (`pushNotesFold` va antes del `setItem`). En el mismo proceso, un id viejo que llega se pliega (una fila con las tres
  notas). El arranque siguiente (marca y caché de la bandera en cero, la misma base) pliega de nuevo, no encuentra
  nada, no encola nada y graba la bandera `"1"`. Correcto. Si fallara el encolado (no lanza: `queueWrite(s)` es
  síncrono y persiste sin esperar), la ventana es la que la 175 ya aceptó.
- La marca es de la instancia: otra `BibleDatabase` nace en `false` (2d); en la app hay un solo `bibleDB`. En las
  pruebas, cada archivo tiene su registro de módulos y `freshDevice` la reinicia; ningún otro archivo llama al
  plegado de arranque.

**3. Lectio** (`S177-lectio.test.tsx.txt`, la pantalla real, cuatro verdes):

- Doble toque con un guardado que falla: un solo `updateNote` y un solo aviso (`savingRef`).
- El reintento vuelve a leer la nota (`getNoteForVerse` dos veces): no reusa el id viejo que el plegado re-claveó.
- En inglés, el aviso es `translations.en.notes.saveError` («Could not save the note. Try again.»); en español, el
  del lector.
- El día de «Momento con Dios» se marca una vez, al terminar de verdad (`finished` solo pasa a `true` en el éxito).
- Atrás tras el aviso: el botón y el atrás del sistema (`useBackHandlerStep`) bajan un paso, a la oración, que sigue
  en su campo. Salir de la pantalla después del aviso pierde la oración, pero ya se avisó.
- Sin verso cargado (`verseText` nulo) la pantalla queda en error y no muestra los pasos: no hay camino donde la
  oración se salte en silencio.
- Un fallo DESPUÉS de escribir en la base duplicaría el bloque al reintentar, pero lo único que corre después es
  `queueWrite` (síncrono, no lanza), `toast` y `haptics`. Sin camino.

**4. `R9-626` aceptado.** El porqué alcanza. Comparadas las dos reglas sobre una fila plegada y una edición de la app
vieja: corregir un párrafo, agregar uno y quitar uno de dos dan lo mismo; **acortar un párrafo** («de la vieja» →
«de la») suma ahora una copia más, donde la regla vieja la tiraba por subcadena (que era justo `R9-625`). Sigue
siendo copia de más, a la vista y sin pérdida: el punto 2 del porqué no cambia.

## 4. En vivo (emulador `-read-only`, APK debug vc73, Metro desde `fix/s176`)

`pm clear` y primer arranque (bandera puesta), `_scratch/S177-vivo.sh.txt sembrar` (copia de `S175-vivo.sh.txt`; con
`SEMBRAR` vacío usa `S175-sembrar.cjs.txt`: las cinco filas de la 175) y arranque en frío: logcat `{"written":3,
"removed":5}`, y el disco como en la 176 (`vnote:John:1:1` = «Ver Juan 1\n\nVer Juan 14:6»).

Después, sobre el aparato ya plegado, `SEMBRAR=S177-sembrar.cjs.txt` (once filas viejas, bandera borrada) y otro
arranque en frío: `{"written":3,"removed":11}`. Disco (`_scratch/S177-vivo-leer.txt`):

- Romanos 8:28, la misma nota con CRLF (más vieja) y con LF → la de CRLF.
- Salmos 23:1, «Salmo 2», «Compárese con el Salmo 23» y su unión → la unión, con sus fechas (nada nuevo con qué
  ganar).
- Filipenses 4:13, « Fuerza en Cristo \n», la misma limpia, una vacía y una de espacios → la primera, tal cual.
- Juan 3:16 y Juan 1:1, ya plegadas, más un párrafo suyo con salto final y los mismos párrafos en otro orden → sin
  cambio (ni el `updated_at`), y los ids viejos borrados.
- Bandera `"1"`.

Pestaña Notas: «6 Notes saved», una tarjeta por versículo (`_scratch/S177-vivo/01-notas.png`). El CRLF de Romanos se
ve con un hueco algo mayor entre párrafos: es el texto tal cual, como se vería sin plegar.

Lo que pide la nube (la lápida y el doc `vnote:` durante el plegado, entre dos aparatos) espera `R9-135`.

## 5. Estado al cerrar

Sin hallazgos nuevos; `R9-624`, `R9-625` y `R9-627` siguen ✅ y `R9-626` sigue aceptado, con la nota de esta revisión
en sus entradas. Validador: 274 abiertos de 627 (0 P0, 2 P1, 87 P2, 184 P3 y un aviso), 0 avisos y 0 errores.

**La 178: la tanda V6** (CI y repo: `R9-107`, con `R9-2`, `R9-5` y `R9-6`; CONTINUAR.md §4). Antes, el merge de
`fix/s176`, `docs/review-s176` y `docs/review-s177`, con el OK de Victor.
