# A18 — Word study / idiomas originales (`src/features/study`: `wordStudy`, `originals`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 118 (2026-11-02) · Estado **🐛 BUG**
>
> **Resultado:** 3 hallazgos (`R9-435`, `R9-436`, P2; `R9-434`, P3), ninguno P0. Los datos y el gating
> aguantan; lo que falla es lo asíncrono de las dos pantallas (un callback viejo, una caché leída antes de
> vaciarse) y la versión por defecto de los fragmentos.
>
> **Cómo se midió:** en el principal, sin agentes (`8cea3ad`). Tres sondas con `_scratch/S116-correr.cjs.txt`,
> sobre los componentes reales con los datos mockeados (los contextos con objetos estables):
> `S118-wsFragmentos.test.tsx.txt` y `S118-wsVersion.test.tsx.txt` (la pantalla `word-study`),
> `S118-olsDescarga.test.tsx.txt` (la hoja de idiomas originales, con la descarga en una promesa que la sonda
> resuelve).

## El área

`app/(tabs)/features/word-study.tsx` (967 L), `src/components/reading/OriginalLanguagesSheet.tsx` (870 L),
`src/components/reading/InterlinearSheet.tsx` (535 L), `src/features/study/wordStudy.ts`, `originals.ts`,
`morphologyDecoder.ts`, `morphologyLabels.ts`. Lo ya dicho, no re-derivado: Fable, área 22 ✅ (la pantalla abre
entera gratis; solo la glosa KJV, el interlineal visual y la morfología por palabra son premium) y área 2 de la
Mesa; `A14` (`originals-download-service` ✅: un archivo cortado revierte en la transacción; «dos descargas a la
vez», sin medir). Las pruebas que ya hay: 14 suites (`wordStudy*`, `OriginalLanguagesSheet*`,
`InterlinearSheet`, `morphologyDecoder`, `originals`, `hebrewGlossEs`, `strongsOccurrencesByBookDb`).

## Hallazgos

**`R9-435` (P2): si la hoja de idiomas originales se cierra durante la descarga del pack y se abre sobre otro
versículo, al terminar muestra las palabras del primero bajo la referencia del segundo.**

- El lector la deja montada (`app/(tabs)/verse/[book]/[chapter].tsx:3578-3585`, con `visible` aparte; lo mismo
  en profecías, `app/features/prophecies/index.tsx:1512-1519`). `handleDownload`
  (`OriginalLanguagesSheet.tsx:153-166`) es el del render en que se tocó «Descargar», y al terminar llama a su
  `loadWords` (`:107-112`), el del versículo de entonces; nada compara con el versículo actual.
- **Repro:** sin el pack, lector → Juan 3:16 → «Idiomas originales» → «Descargar (~30 MB)» → cerrar la hoja →
  elegir Juan 3:17 → «Idiomas originales» (sigue «Descargando…») → al terminar: la cabecera dice «Juan 3:17» y
  las palabras, el interlineal y los enlaces al estudio de palabra son los de 3:16. Lo mismo con «Actualizar»
  (`:477-487`). Se corrige al cerrar y volver a abrir.
- **Sonda:** `_scratch/S118-olsDescarga.test.tsx.txt`: tras cerrar y abrir en 3:17,
  `{"ref317":true,"palabra16":true,"palabra17":false}`: rojo. Control, la descarga termina en el mismo
  versículo: `{"ref316":true,"palabra16":true}`.
- **Propuesta (sin escribir):** que al terminar la descarga se recarguen las palabras del versículo actual (un
  `ref` al último `loadWords`, o volver a correr el efecto de apertura).

**`R9-436` (P2): desde Datos bíblicos, el estudio de palabra muestra los fragmentos en RVR1960 aunque la
interfaz esté en inglés.**

- `app/features/facts/index.tsx:178` abre `/features/word-study?strongs=…` sin `version` (su comentario,
  `:171-174`, dice que es opcional). La pantalla pone las referencias en el idioma de la interfaz
  (`bookLangForVersion`, `word-study.tsx:100`), pero los fragmentos caen a una versión fija:
  `version ?? 'RVR1960'` (`:240`).
- **Repro:** interfaz en inglés (con WEB o KJV) → Datos bíblicos → un dato con número de Strong → el estudio de
  palabra: «Matthew 1:20» con el texto de Reina-Valera debajo, en toda la lista.
- **Sonda:** `_scratch/S118-wsVersion.test.tsx.txt` (interfaz `en`, sin `version`): la referencia sale
  «Matthew 1:20» y cada fragmento se pide con `["RVR1960"]`: rojo.
- **Propuesta (sin escribir):** que Datos bíblicos pase la versión elegida (como la hoja), o que la pantalla
  caiga a la versión del usuario y no a una fija.

**`R9-434` (P3): al quitar el filtro por libro, las filas de ese libro vuelven sin el texto del versículo.**

- `word-study.tsx:232-263`: el efecto de los fragmentos corre en el mismo commit que el reset de `:194-197` y
  lee la caché del render, que todavía es la del libro: salta esas filas. El reset la vacía después, y si la
  ventana no cambia (`snippetWindow` sigue en 30), el efecto no vuelve a correr y nadie las pide.
- **Repro:** un estudio de palabra → tocar la barra de un libro (la lista se filtra, con sus textos) → tocarla
  otra vez: las filas de ese libro que entran en las primeras 30 quedan solo con la referencia y la palabra. Se
  cura con el primer desplazamiento (la ventana cambia y el efecto vuelve a correr).
- **Sonda:** `_scratch/S118-wsFragmentos.test.tsx.txt`: 3 filas de Mateo y 2 de Hechos; tras filtrar por
  Hechos y quitar el filtro, `{"mt":3,"hch":0,"filasHch":2}`, y las llamadas piden solo las de Mateo: rojo.
  Control: las de Mateo vuelven con su texto.
- **Propuesta (sin escribir):** limpiar la caché en el mismo efecto que pide (o no leerla del cierre del
  render).

## Revisado sin hallazgo

- **Los datos:** el pack normaliza el número de Strong (`scripts/build-originals-pack.js:194-207`: sin ceros,
  sin la letra, sin los prefijos H9xxx), así que `hasLexicon` (`/^[HG]\d+$/`, `originals.ts`) no deja palabras
  fuera; los enlaces que la app arma van en mayúscula.
- **`wordStudy.ts`:** `getWordStudy` junta léxico, concordancia, distribución y extremos con caídas por parte;
  `buildBookBars` ordena por cuenta con desempate por libro. El filtro pide el libro entero
  (`getWordStudyBookOccurrences`), no recorta la lista global.
- **El gating:** el interlineal visual y la morfología (`OriginalLanguagesSheet.tsx:209-215`, `:344`, `:581`)
  abren la ofrenda gratis; `InterlinearSheet` se cierra sola si se pierde el premium (`:105-107`); la glosa KJV
  de la pantalla, igual (sus pruebas, y Fable en vivo).
- **Las respuestas en vuelo:** los tres efectos de la pantalla y el de la hoja se cancelan al desmontar o al
  cambiar; `InterlinearSheet` también (`:109-128`). `handleWordPress` (`:168-183`) no cancela el léxico de un
  toque anterior, pero la ventana es una consulta de SQLite: sin escenario humano.

## Sin medir

- **El archivo a medio bajar en la apertura:** con la descarga en curso, abrir la hoja corre
  `importLocalOriginalsIfPresent`, que mira la misma ruta en la que se está escribiendo (`cacheDir/originals.db`,
  `originals-download-service.ts:114-145`) y, pasado 1 MB, intenta importarla. `A14` midió que un archivo
  cortado revierte; lo que hace el `ATTACH` con un archivo que se sigue escribiendo es de Modo C (y vecino de
  «dos descargas a la vez», en el Pendiente).
- **Cruce con las vecinas:** `R9-435` es el lado de la pantalla de la descarga que `A14` dejó sin medir; la
  página en blanco de `A13` no se cruza (la hoja tiene su estado vacío). `A17`: ninguno.
