# A32 — Mesa de preparación: altitud (`app/features/prep/index.tsx`)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesiones 126 (2026-11-03, en el mismo chat que la
> 125; con 2 agentes a pedido de Victor) y 127 (2026-11-03, chat nuevo; con 6 agentes a pedido de Victor, 4 en
> esta fila) · Estado **🐛 BUG** (cerrada en la 127)

> **Resultado:** 12 hallazgos, ninguno P0: `R9-473` (P2), `R9-474` (P3) de la 126; `R9-476` y `R9-477` (P2),
> `R9-478`..`R9-485` (P3) de la 127. Lo que escribe la Mesa está bien guardado salvo el debounce compartido
> (`R9-473`). De lo que presenta: los originales del pasaje viejo tras una descarga (`R9-476`, el candidato fuerte
> de la 126, ya medido), un pack de originales al que el build le tira 235 palabras griegas (`R9-477`), la cabecera
> y el texto en versiones distintas (`R9-478`), «buscar por tema» que en inglés no encuentra su propio ejemplo
> (`R9-479`), y el resto P3 (`R9-480`..`R9-485`). Lo que queda es de dispositivo (Modo C) o sin medir, abajo.

> **Cómo se midió:** en la 126, dos agentes (`fork` en worktree, sobre `c634007`); en la 127, cuatro (sobre
> `98b5078`, mismo código), que solo midieron: el 1, el candidato fuerte (y por qué la sonda de la 126 se quedaba
> en el spinner); el 2, la tabla y los temas; el 3, morfología, glosa y un libro sin originales (sobre el pack
> PUBLICADO en Pages, sha `b16c8dd9…`, no la copia vieja de `C:/projects/_pages_pub`); el 4, los «sin medir» que
> quedaban. Cada sonda de un hallazgo se re-midió igual en el principal con `_scratch/S116-correr.cjs.txt`. Los
> informes y las sondas, en `_scratch/S126-sondas-agente-{1,2}/` y `_scratch/S127-sondas-agente-{1..4}/`. Lo ya
> dicho por `A9`, `A18`, `C6`, `C16` y el campo de Victor no se re-derivó. El Pendiente de la Mesa (`prepAccount`,
> `backupPrepTurn`, `R9-330`, `R9-327`) no se tocó.

> **Por qué la sonda de la 126 se quedaba en el spinner:** buscaba «Descargar» con `findByLabelText` DENTRO del
> `act(async …)`; React no aplica `setOriginalsStatus('notInstalled')` hasta que el `act` termina, así que la
> búsqueda nunca ve el botón (también caían los controles). Con la búsqueda fuera del `act`, el botón aparece en
> ~250 ms. La pantalla estaba bien.

## Hallazgos

- **`R9-473` (P2, 126):** `index.tsx:1071-1081`, un `useDebouncedCallback` para todas las secciones: la barra de
  formato de B reemplaza el guardado pendiente de A. Familia de `R9-58`.
- **`R9-474` (P3, 126):** `handleOpenPulpit` (`:1028-1058`) sin bloquear el botón: dos toques, dos púlpitos.
- **`R9-476` (P2, 127):** `handleDownloadOriginals` (`:823-834`) llama al `loadOriginalWords` del render del toque
  (`:695-739`), sin `isStale`: mover el rango o cambiar de pasaje durante la descarga deja las palabras del pasaje
  viejo. Gemelo de `R9-435`. La misma raíz sin descarga (`:741-743`, `loadCompareRows` `:793-821`), mecanismo
  medido, no alcanzable sin dispositivo.
- **`R9-477` (P2, 127):** `scripts/build-originals-pack.js:268-272`, el regex no acepta la versificación entre
  corchetes de TAGNT: 235 palabras fuera, 2 Co 13:13-14 y Fil 1:16-17 sin originales, 34 versículos incompletos.
- **`R9-478` (P3, 127):** `:1155-1159` (cabecera, de `selectedVersion`) contra `:507-508` (texto, de
  `params.version`): la versión cambiada con la Mesa abierta las separa. Familia de `R9-430`.
- **`R9-479` (P3, 127):** `prepThemeKeywords.ts:65-112`, palabras y sinónimos solo en español: en inglés, «fear»
  (el ejemplo del placeholder) no encuentra nada.
- **`R9-480` (P3, 127):** `loadCompareVersions` (`:753-788`) sin foco: al volver de Ajustes, sigue «solo una».
- **`R9-481` (P3, 127):** `handleOpenTopicSearch` (`:944-953`) con `setParams`: el atrás sale de la Mesa. Familia
  de `R9-459`.
- **`R9-482` (P3, 127):** `illustrations/index.tsx:218-235`, `handleInsert` sin guarda: doble toque cierra la Mesa
  y puede insertar dos veces. Familia de `R9-474`.
- **`R9-483` (P3, 127):** `:695-704` no mira `isOriginalsUpdateAvailable`: con el pack de julio, Salmos con título
  vacíos y sin oferta de actualizar.
- **`R9-484` (P3, 127):** `morphologyDecoder.ts`, 22 códigos del pack publicado sin decodificar (28 palabras).
- **`R9-485` (P3, 127):** `build-originals-pack.js:281-292`, `[[`/`]]` en la palabra y la glosa de Mc 16:9-20 y
  Jn 7:53-8:11.

## Revisado sin hallazgo

- (126) Las guardas de `R9-47` en `flushDrafts`, el `blur` y `handleNoteChange`; copiar, PDF y compartir leen
  `drafts`; la autoevaluación escribe solo la pregunta tocada; el selector de plantilla con la entrada vacía;
  `load()` con `isStale`; el foco con su `cancelled`.
- (127) `buildPrepTable` (`prepTable.ts:343-406`): referencias, Cristo y temas filtrados con `refInPassage`
  (`:321-331`); un pasaje no cruza capítulos. Los chips de temas y la línea de temas del export salen del idioma de
  la app (los 14 temas tienen nombre en los dos). Cristo y la introducción hablan la lengua de la versión, a
  propósito (`christConnections.ts:334-340`; `christConnections.test.ts:73-95`); los 66 libros tienen
  introducción. `handleOpenTopicSuggestion` (`:918-934`) limpia `endVerse`/`verse`.
- (127) Glosa en español: 0 de 141 861 filas griegas y 0 de 298 930 palabras hebreas sin glosa (capa por lema,
  8503/8503). Las etiquetas de morfología existen en los dos idiomas. Con el idioma cambiado con la Mesa abierta,
  glosa y morfología se rearman (`:739`). El pack tiene los 66 libros y ningún versículo 0; la app no tiene
  deuterocanónicos: un «libro sin originales» no existe, salvo lo de `R9-477`.
- (127) Una descarga que falla deja `'error'` con el botón para reintentar (`:829-832`, `:2005-2006`); el botón
  está deshabilitado mientras descarga (`:2016`). Dos toques en «Compartir estudio» (`:1327-1345`): dos
  `Share.share`, nada escrito (cosmético, sin numerar).

## No alcanzable

- (126) El stepper con un debounce pendiente; volver de un salto en menos de 700 ms; exportar en el hueco de la
  carga (`R9-168`); que cambie `isPremium` mientras se escribe.
- (127) Una versión desconocida en `params.version` o `@bible_version` (`christLangForVersion` caería a `'en'`,
  `:508`): toda entrada pasa un id real o ninguno.

## Sin medir

- **Modo C (dispositivo):** el doble toque en una fila de `PrepExportFormatSheet` (`:1298-1322`); el segundo toque
  del banco de ilustraciones durante la transición de salida (`R9-482`); dos `Share.share` seguidos en Android; la
  raíz de `R9-476` sin descarga (que la carga vieja termine después que la nueva); durante la descarga, el rango
  nuevo llama a `importLocalOriginalsIfPresent()` (`:700`, 1 llamada medida), que mira el mismo
  `cacheDirectory/originals.db` que la descarga escribe (`originals-download-service.ts:114-117`, `:132-158`):
  probablemente falla y se deshace en `withTransactionAsync` (`database/index.ts:1281-1306`), con el borde de que la
  importación local termine primero y la descarga dé «error» con el pack instalado. Sin revisar si la hoja del
  lector (`R9-435`) llama a lo mismo.
- Salir de la Mesa durante la descarga; `extraCrossRefCount` (`:333-340`) en el borde del tope gratis; cuántas
  glosas contextuales de la primera aparición difieren dentro de un pasaje (diseño documentado); la calidad de la
  primera pasada de glosas hebreas en español (contenido, para Victor).
- (126) Doble toque en una ilustración: medido en la 127 (`R9-482`). «Buscar por tema» y el atrás: medido
  (`R9-481`). «Comparar versiones» al volver de Ajustes: medido (`R9-480`).

## Cruce con las filas vecinas

- `A9` (Mesa, persistencia): `R9-473` es un camino de salida que esa auditoría no vio.
- `A18` (idiomas originales): `R9-476` es el gemelo de `R9-435`; `R9-477`, `R9-484` y `R9-485` son del pack y del
  decodificador que también usan la hoja del lector y el estudio de palabra.
- `A16`, `A19`, `A34`: `R9-478` es la familia de `R9-430`/`R9-438` (la versión cambiada con la pantalla abierta);
  `R9-486` (Journeys) es otro miembro, encontrado por separado.
- `A26` (navegación): `R9-474` y `R9-482` son botones con un `await` antes de navegar, sin guarda; `R9-481` tiene
  la forma de `R9-459`.
