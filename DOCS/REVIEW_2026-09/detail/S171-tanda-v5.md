# Sesión 171: la tanda V5 — lector y planes (`R9-41`, `R9-40`, `R9-54`, `R9-55`, `R9-64`; `R9-51` solo diseño)

2026-11-23. Opus 5.5 principal, `high`. Sin agentes, sin emulador ni nube. Rama `fix/s171-v5` (4 commits sobre
`9b9a73ff`).

## 1. Estado de partida

main = origin/main = `9b9a73ff`, CI verde (run 44429566061, 429 suites, 5074 pruebas). Validador 0 y 0: 279 abiertos
de 619.

## 2. Arreglos

| Hallazgo | Commit     | Qué cambia                                                                     |
| -------- | ---------- | ------------------------------------------------------------------------------ |
| `R9-41`  | `12b83c37` | `isReaderThemeDark`: la oscuridad sale del `background` de la paleta           |
| `R9-40`  | `14bc4930` | `withTimeout` (15 s) en el catálogo de versiones y en los metadatos originales |
| `R9-54`  | `23a9793b` | una lectura completa solo los días que la contienen                            |
| `R9-55`  | `2fdd61e6` | `migratePlanProgress` recorta los días a la duración nueva                     |
| `R9-64`  | `2fdd61e6` | `migratePlanProgress` fusiona con el progreso del destino                      |

### `R9-41`: la barra de selección con Crepúsculo

- **Reproducción con el productor real.** El lector entero (`[chapter].tsx`), las paletas reales de
  `readerThemes.ts` y las de la app (`lightColors`, `darkColors`). Se selecciona el versículo 1 y se lee la pintura
  de la barra: el color del texto y el fondo del primer ancestro con `onLayout`.
- **Matriz:** 8 temas × app clara/oscura = 16 casos, AA (4.5:1) del texto sobre la barra. Con HEAD caen
  exactamente `crepusculo`/clara y `crepusculo`/oscura (`#DCE3F0` sobre `rgba(255, 255, 255, 0.98)`).
- **Arreglo.** `isReaderThemeDark(theme, appIsDark)`: oscuro si el blanco contrasta más que el negro con el
  `background` de la paleta; `system` sigue a la app. Usa `contrastRatio` de `src/lib/a11y/contrast.ts`.
- **Revert de la pieza:** la línea vieja en el lector hace caer los 2 casos y nada más.
- **Prueba del clasificador** (`readerThemes.test.ts`): la lista de oscuros es `night`, `high-contrast` y
  `crepusculo`; toda paleta oscura lleva texto claro y viceversa. Un tema nuevo cae aquí si se clasifica mal.
- **Quién consume:** `readerIsDark` tiene un solo lector, la barra (`[chapter].tsx:3064`). El lector web no tiene
  esa barra.

### `R9-40`: el catálogo sin plazo

- **Reproducción.** `ManageVersionsSection` real con `fetchVersionCatalog` real; la red es un `global.fetch` que
  nunca responde. Con HEAD: el spinner sigue a los 15 s y no hay «Reintentar».
- **Arreglo.** `src/lib/utils/withTimeout.ts`: un `AbortController` para el `fetch` y una carrera contra el plazo.
  La carrera suelta al llamador aunque el `fetch` ignore la señal. El plazo cubre cabeceras y cuerpo.
- **Pruebas:** el fetch que nunca responde; el que respeta la señal (se aborta); «Reintentar» tras el plazo; una
  respuesta 1 ms antes del plazo (sale la lista). Sin el plazo caen 3 de 4; sin la carrera, 2.
- **`fetchOriginalsMeta`**, el mismo patrón: colgaba la comprobación de actualización y el FINAL de una descarga
  terminada (`downloadAndImportOriginals` espera los metadatos para guardar el sha256). El plazo devuelve `null`,
  como sin red. 2 pruebas nuevas, caen sin el plazo.
- **Fuera, a propósito:** el canje de códigos (`giftCodeService.ts:158`, dinero) y los cargadores web de packs
  (`data-loader.web.ts:98` y `:174`, `redLetterText.web.ts:161`). Nueva entrada `R9-620` (P2).

### `R9-54`: descompletar un día

- **Reproducción con el provider real.** Plan `iam-7` empezado, leer Juan 6 (día 1), destildar el día 1, leer
  Génesis 1: HEAD devuelve `[{planId: 'iam-7', day: 1}]`, el toast del lector.
- **Diseño.** Tres salidas:
  1. limpiar las banderas de los capítulos del día, como `restartPlan`: borra la historia (el chip del capítulo y
     las otras tablas que comparten el capítulo);
  2. recordar los días destildados: estado nuevo, que hay que persistir y soltar;
  3. **elegida:** una lectura completa solo los días que contienen el capítulo leído. Sin estado nuevo, sin borrar
     historia; releer un capítulo del día lo completa, y eso es una lectura real.
- **Cambio de conducta, a propósito:** un día leído ANTES de empezar el plan (unirse con `setPlanStart`: juntos y el
  constructor) ya no se tilda con la próxima lectura ajena. Antes salía el mismo toast falso. Su chip lo muestra
  leído; se tilda a mano o leyéndolo. Lo fija una prueba.
- **Pruebas:** 6 nuevas. Sin el arreglo caen 3 (lectura ajena, otro día del plan, antes de empezar); los controles
  pasan con HEAD (releer el día, el chip sigue leído, un capítulo en dos días completa los dos).
- **Vecinos:** las 49 pruebas que montan el provider, verdes. `markChapterRead` tiene un llamador
  (`[chapter].tsx:766`).

### `R9-55` y `R9-64`: editar un plan propio

- **Dónde está cierto el dato:** al migrar. El constructor conoce la duración nueva y la pasa
  (`plan-builder/index.tsx:222`); el parámetro es obligatorio, así que `tsc` obliga a todo llamador.
- **Por qué en el dato y no en la pantalla:** con un filtro solo al pintar, los días fantasma seguían guardados y
  reaparecían tildados al volver a alargar el plan.
- **`R9-64`, la fusión.** La unión de los días (recortada), el inicio del plan editado (si está vacío, el del
  destino) y el sello de completado más viejo. El destino con progreso es un plan del mismo contenido o uno borrado
  cuyo progreso sobrevive (`R9-146`, decisión documentada): fusionar sigue esa decisión.
- **Pruebas:** 6 nuevas con el provider real y AsyncStorage. Sin el recorte caen 2; sin la fusión, 2. Los controles
  (alargar, inicio vacío, mismo id, sin origen) pasan con HEAD.
- **Vecinos:** 83 pruebas de planes, planes propios, juntos y respaldo, verdes.

## 3. `R9-51`: el diseño de la migración (sin código)

No cabe en la sesión: toca seis archivos, la nube y el respaldo. Lo escribe una sesión propia.

### Lo leído

- `notes` tiene `id TEXT PRIMARY KEY` y nada sobre `(book_name, chapter, verse)` (`database/index.ts:540-549`).
- El id es `note_${Date.now()}_${random}` (`:2102`). El adaptador sincroniza por ese id (`adapters/notes.ts`).
- Escriben en `notes`: `addNote` (lector `:1059` y lectio `:302`), `updateNote`, `removeNote` (pestaña Notas), el
  adaptador (`INSERT OR REPLACE` por id), el import del respaldo (`BackupService.ts:1636`, borra y reinserta con los
  ids del archivo), `migrateCanonicalBookKeys` (`:2189`) y el reset (`:2440`).
- Suben a la nube: el lector y lectio (`queueWrite`), Notas (`queueDelete`) y el import (`queueWrites` con `n.id`).
- Leen: `getNoteForVerse` (`getFirstAsync` sin `ORDER BY`: la de menor `rowid`), `getNotes`, `getNotesCount` y el
  `findNoteById` del adaptador.
- Los subrayados ya lo resolvieron: clave = el versículo, con `UNIQUE` (`adapters/highlights.ts:15-22`).

### Las vías al duplicado

1. Dos aparatos crean la nota del mismo versículo (medida en la 22, con `node:sqlite`).
2. `migrateCanonicalBookKeys` en UN aparato: una nota en «Juan 3:16» y otra en «John 3:16» de antes de la 58 quedan
   las dos en `John`. Sin medir.
3. Importar el respaldo de otro aparato: entran los ids del archivo y la nube trae los suyos. Sin medir.

### Las opciones

| Opción                                                     | Veredicto                                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A. El id es la clave del versículo, con migración          | **Recomendada**: converge en todos los aparatos, como los subrayados                          |
| B. `UNIQUE (book_name, chapter, verse)` con los ids viejos | Descartada: el `INSERT OR REPLACE` del adaptador borraría en silencio la fila local que choca |
| C. Solo leer mejor (`ORDER BY`, agrupar en Notas)          | No converge: dos documentos en la nube para siempre. Sirve como paso 0                        |

### A, paso por paso

0. `getNoteForVerse` con `ORDER BY updated_at DESC`: el lector muestra la más nueva mientras tanto.
1. **Id determinista:** `vnote:<libro canónico>:<capítulo>:<versículo>`. `addNote` escribe con esa clave y devuelve
   la misma; los llamadores no cambian de forma.
2. **Migración local, una vez** (bandera `@notes_verse_key_v1` en AsyncStorage, después de
   `migrateCanonicalBookKeys` en `ServicesContext.tsx:108`). Por cada versículo, en una transacción:
   - una fila con id viejo: se re-escribe con el id nuevo y se borra la vieja;
   - varias: se fusionan. Textos iguales: queda uno. Distintos: se juntan los distintos por `created_at`, separados
     por una línea en blanco. No se pierde texto del usuario y no se genera texto nuevo. `created_at`: el más viejo;
     `updated_at`: ahora, para que gane en los otros aparatos; `verse_text`: el de la más nueva.
   - Nube: un solo lote con el `queueWrite` del id nuevo y un `queueDelete` por cada id viejo (memoria: sincronizar
     lo mínimo, en lote).
   - La bandera se graba después de la transacción y del encolado. La migración es idempotente: re-correrla no
     encuentra ids viejos.
3. **Adaptador de entrada:** un documento con id viejo se pliega en la fila del versículo con la misma regla. Un
   texto ya contenido no se vuelve a juntar, así que plegar dos veces no cambia nada. El adaptador no borra en la
   nube: la lápida la pone el aparato dueño al migrar (sin eco).
4. **Respaldo:** tras el import se corre el mismo plegado (la función, no la bandera).

### Qué hay que medir al escribirlo

- Con SQLite real (`node:sqlite`, como en la 22): las tres vías, la migración re-corrida y la transacción que falla
  a mitad (no se graba la bandera, no se encola nada).
- La lápida de un id viejo que llega a un aparato que ya lo plegó: hoy el plan es no hacer nada (el texto plegado
  queda). Decidir si alcanza.
- La app vieja que recibe un `vnote:`: lo inserta como otra fila (duplicado) hasta que se actualiza. Hoy solo hay
  prueba interna, así que se acepta; anotarlo en el commit.

**Costo:** seis archivos (`database/index.ts`, `adapters/notes.ts`, `ServicesContext.tsx`, `BackupService.ts`, y
las pruebas), una migración y unas diez pruebas. Una sesión entera, con revisión de diff con emulador detrás.

## 4. Hallazgo nuevo

- `R9-620` (P2): el resto de `R9-40`. El canje de códigos regalo y los cargadores web de packs siguen sin plazo. El
  canje es dinero: un plazo que vence después de que el servidor canjeó pide medir qué dice el reintento.

## 5. Sin medir

- Nada en el emulador: la 172 mide el tema y los planes en vivo (regla «Según el riesgo»).
- El plazo de 15 s en una red real lenta pero viva.
- Los datos viejos: un plan editado antes de este arreglo conserva sus días fantasma (solo prueba interna).

## 6. Estado al cerrar

`validate` en `fix/s171-v5`: 431 suites, 5112 pruebas, 70 advertencias y ningún error. Cerrados `R9-41`, `R9-40`, `R9-54`, `R9-55` y `R9-64`; nuevo
`R9-620`. Quedan 275 abiertos de 620 (0 P0, 3 P1, 87 P2, 184 P3 y un aviso). `R9-51`: diseño en el §3, sin código.
