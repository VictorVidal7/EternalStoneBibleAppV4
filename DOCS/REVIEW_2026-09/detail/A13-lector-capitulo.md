# A13 — Lector de capítulo (`app/(tabs)/verse/[book]/[chapter].tsx`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 116 (2026-11-02) · Estado **🐛 BUG**
>
> **Resultado:** 1 hallazgo (`R9-423`, P2), ninguno P0. Lo demás, ✅ con su evidencia, «no alcanzable» con su
> porqué, o «sin medir» (abajo).
>
> **Cómo se midió:** el agente 1 de 3 (`fork` en worktree sobre `f6c7986`, solo midió; reglas en
> `_scratch/S116-agentes-reglas.md.txt`). Sondas: pruebas de jest guardadas como `.txt` y corridas con
> `_scratch/S116-correr.cjs.txt` (las copia a `__tests__/`, corre jest y las borra). Copias en
> `_scratch/S116-sondas-agente-1/` (informe `S116-a1-informe.md.txt`). La sonda se re-midió en el principal y
> dio lo mismo; las líneas que sostienen el hallazgo, verificadas a mano.

## El archivo

`app/(tabs)/verse/[book]/[chapter].tsx`: 3985 líneas, y su `.web.tsx`. Lo ya dicho: la revisión Fable (área
17 ✅, el swipe entre capítulos no existe; área 18 ✅, el inmersivo) y `R9-15`, `R9-41`, `R9-42`, `R9-44`,
`R9-56`, `R9-57`, `R9-150`.

## Hallazgo

**`R9-423` (P2): al volver a cambiar de versión con el audio, la voz no cambia.** El seguro de re-entrada
`audioVersionResyncRef` (`:1328`) guarda `libro/capítulo/versión` del último re-sync y sale si la clave
coincide (`:1344`). Su único escritor es `:1345`, y nada lo limpia.

- **Camino:** escuchar Juan 3 en RVR1960 → cambiar a WEB (se re-sincroniza; el seguro queda en `43/3/WEB`) →
  cerrar el reproductor con la ✕ (`hidePlayer`, `AudioPlayerContext.tsx:892`: oculta y para, el motor
  conserva sus versículos) → volver a RVR1960 (con el reproductor oculto no hay re-sync:
  `shouldResyncAudioToVersion`, `chapterNavigation.ts:238-243`) → «Escuchar» (el motor carga RVR1960) →
  cambiar a WEB: `shouldResyncAudioToVersion` da verdadero, pero la clave es igual al seguro.
- **Qué ve el usuario:** el texto en WEB (inglés) y la voz leyendo RVR1960 (español). Es el defecto que
  arregló el Sprint 102 (el comentario de `:1318-1327`), de vuelta por otro camino. Salida: parar y volver a
  «Escuchar».
- **Sonda:** `S116-a1-resyncLatch.test.tsx.txt` (la pantalla nativa real con `ReaderPreferencesProvider`
  real; «Escuchar» simulado cargando en el motor los versículos en pantalla, como `startAudioPlayback`; la ✕
  como `isVisible` en falso con el motor intacto). Control (montaje nuevo): «cargas WEB tras el cambio = 1 |
  motor = WEB». Caso: «cargas WEB tras el 2.o cambio = 0 | motor = RVR1960 | pantalla = WEB». La sonda
  afirma el defecto: 2/2 verdes, en el worktree y en el principal.
- **Propuesta (sin escribir):** comparar contra `audioState.contentVersionId` en vez de recordar la última
  clave, o limpiar el seguro cuando el motor carga por otro camino.

## Revisado ✅

- **Capítulo paralelo** (`:579-605`): guarda `active`, deps completas.
- **Subrayados** (`:1199-1221`): guarda `active`.
- **Chip de la palabra original** (`:976-993`): `loadIdRef` descarta la respuesta de un capítulo viejo.
- **`?audioResume=1`** (`:1927-1950`): el seguro se rearma por capítulo y exige `sameChapterLocation`.
- **Seguir al audio** (`:1428-1466`): un `replace` por capítulo del motor, con el seguro rearmado por capítulo.
- **Progreso al desmontar** (`:613-614`, `:687-701`): por ref, sin closure vieja.
- **Nombres de libro:** los 66 de RVR1960 y de WEB coinciden con `BIBLE_BOOKS` (script sobre los datos; el
  agente 3 lo midió también contra `getBookByName`).
- **El inmersivo y la barra de selección** más allá de «Escuchar desde aquí» (`:1646-1657`): sin defecto por
  lectura, sin sonda.

## No alcanzable

- **`loadChapter` no descarta una respuesta vieja** (`:899-956`): `loadIdRef` solo protege el chip (`:979`) y
  `setVerses` (`:955-956`) no compara `myLoadId`. Pero `setLoading(true)` reemplaza toda la pantalla por el
  spinner (`:1952`): sin flechas, swipe ni selector de versión mientras carga, y los cambios de ruta
  programáticos (seguir al audio `:1463`, atrás de los saltos `:1290`) van de a uno. Sin medir: el orden de
  varias `getAllAsync` concurrentes en expo-sqlite nativo.

## Sin medir

- **El lector nativo no avisa nada con un capítulo vacío o una lectura fallida** (`:1037-1045`, `:1952`): el
  `.web.tsx` muestra el error o `t.bible.couldNotLoadChapters` (`[chapter].web.tsx:278-284`); el nativo deja la
  página en blanco, sin mensaje ni reintento (no hay rama de render para `verses.length === 0`). **Un camino
  de llegada lo trae `A14`** (el candidato «Resetear datos de la Biblia» con una versión descargada elegida,
  `detail/A14-base-de-datos.md`): los dos juntos dan una página en blanco hasta reiniciar. Sin sonda. **Medido en
  la 138 (`C27a`): es `R9-559`** (`detail/C27a-ajustes-reset.md`).
- **`handleFavoriteSelected`** (`:1660-1680`): `await addFavorite` en bucle sin `try`; un fallo a mitad deja
  marcados solo los primeros. Va con las promesas flotantes de `detail/A12-superficies-crash.md` (hilo 2).
- Si los subrayados fallan al cargar, queda pintado el mapa del capítulo anterior (por lectura).

## Para la fila `A27` (deep links), sin barrer

- Con un `book` que `getBookByName` no reconoce (`bible.ts:676`, igualdad exacta: «Exodo», «Salmo»), la
  pantalla se queda en el spinner para siempre (`:1952`).
- Con `/verse/Juan/abc`, la página queda vacía con título «Juan NaN», y «Siguiente» navega a
  `/verse/Juan/NaN` (`:1797`).
- Las dos solo llegan por un enlace externo mal formado.

## Nota de método

La primera corrida de la sonda se colgó 10 minutos (salida de 67 MB, `ENOBUFS`): un mock devolvía
`favorites: []` NUEVO en cada render y metía en bucle el efecto de `:750`. Era un artefacto del mock, no de la
app; con objetos estables, la sonda corre en ~2 s.
