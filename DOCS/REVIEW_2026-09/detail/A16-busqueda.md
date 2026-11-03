# A16 — Búsqueda (`src/lib/search`, `app/(tabs)/search.tsx`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 117 (2026-11-02) · Estado **🐛 BUG**
>
> **Resultado:** 4 hallazgos (`R9-428`..`R9-431`, P2), ninguno P0. La búsqueda en sí (el FTS) aguanta la
> entrada real; lo que falla es la pantalla alrededor y el resaltado.
>
> **Cómo se midió:** en el principal, sin agentes (`d6b3f05`). Dos sondas con `_scratch/S116-correr.cjs.txt`:
> `S117-buscarPantalla.test.tsx.txt` (la pantalla real, con la base y la versión mockeadas; los contextos con
> objetos estables) y `S117-buscarReal.test.ts.txt` (`BibleDatabase.searchVerses`/`searchByBook` reales contra
> `assets/bible-seed.db` con `node:sqlite`, FTS5 real). Más `S117-apostrofo.cjs.txt` (cuenta de apóstrofos del
> texto WEB) y `S117-seedcheck.cjs.txt` (el sembrado trae `verses_fts` poblado), los dos de solo lectura.

## El área

`app/(tabs)/search.tsx` (1118 L), `src/lib/search/*` (`sanitizeFtsQuery`, `highlightMatches`, `bookFilter`,
`testamentFilter`) y, de `A14`, `searchVerses`/`searchByBook` (`src/lib/database/index.ts:2044-2097`). Lo ya
dicho: el BUG-6 de Fable (sin «ir a referencia»), ya arreglado: la fila «Ir a Juan 3:16» sale de
`parseReference` (`search.tsx:565-581`, `searchGoToReference.test.tsx`).

## Hallazgos

**`R9-428` (P2): con una versión en español, la sugerencia «fe» no busca nada.**

- `translations.ts:231` sugiere «fe» (2 letras); el chip (`search.tsx:957`) pasa por `handleSearchChange`, y
  `performSearch` (`:427-434`) descarta lo de menos de 3 caracteres. Las inglesas tienen 4 o más (`:6803`).
- **Sonda** (a): tras «fe», `searchVerses` 0 llamadas, caja `"fe"`, panel inicial: rojo. Control «amor»: 1
  llamada.

**`R9-429` (P2): «Probar otra búsqueda» deja «No se encontraron resultados ""».**

- La acción (`:868`) solo hace `setSearchQuery('')`; `hasSearched` queda en `true`. La ✕ de la caja
  (`:660-662`) sí pasa por `handleSearchChange('')` y vuelve al panel inicial.
- **Sonda** (b): `{"caja":"","vacioConComillas":true,"panelInicial":false}`: rojo; control (vaciar escribiendo):
  panel inicial.

**`R9-430` (P2): al cambiar de versión, la lista sigue en la anterior y «Cargar más» mezcla las dos.**

- Nada vuelve a buscar al cambiar `selectedVersion` (sin efecto ni `useFocusEffect`); `loadMoreResults`
  (`:480-505`) pide la versión nueva con el desplazamiento de las filas de la anterior. El efecto por libro
  (`:512-539`) sí se re-lanza con la nueva (por lectura).
- **Camino:** la pestaña Buscar conserva su estado; el lector está en el mismo grupo de pestañas. Buscar
  «amor» → abrir un resultado → cambiar de versión en el lector → volver.
- **Sonda** (c): tras el cambio, `{"RVR1960":200}` con el chip `RV1909` y ninguna búsqueda nueva; tras «Cargar
  más», `["amor","RV1909",200,200]` y `{"RVR1960":200,"RV1909":30}`: rojo.

**`R9-431` (P2): el resaltado no sigue lo que encontró la búsqueda.**

- `highlightMatches.ts:53-70` busca cada trozo de la consulta como subcadena, sin el corte del FTS
  (`unicode61` separa por la puntuación) ni la sintaxis que `sanitizeFtsQuery` acepta (`*`, `OR`, comillas).
- **Sonda real** (`S117-buscarReal`, 200 filas por consulta):

  | Consulta          | Versión | Filas  | Sin resaltar | Resaltado dentro de otra palabra            |
  | ----------------- | ------- | ------ | ------------ | ------------------------------------------- |
  | `amor`            | RVR1960 | 200    | 0            | 0                                           |
  | `corazon`, `nino` | RVR1960 | 200/93 | 0            | 0 / 1 («niños»)                             |
  | `God's`           | WEB     | 200    | **200**      | 0 (el texto usa `’`: 7387 veces, 0 rectos)  |
  | `amor*`, `love*`  | ambas   | 200    | **200**      | 0                                           |
  | `fe OR esperanza` | RVR1960 | 200    | 0            | **251** («por», «ahora», «mayor», «gloria») |
  | `faith OR hope`   | WEB     | 200    | 0            | **207** («For», «Lord», «glory»)            |
  | `¿quién`          | RVR1960 | 200    | **92**       | 0                                           |

## Revisado ✅

- **`searchVerses`/`searchByBook` con entrada real** (el pendiente de `A14`): ninguna consulta realista lanza
  error; los acentos se pliegan (`corazon`, `Jesus`, `nino` encuentran); `self-control` encuentra 8; una
  comilla sin cerrar se cierra sola; la paginación por `rank` no repite (208 ids únicos en dos páginas de
  «amor»); `searchByBook(43, 'amor')` = 6 = las de Juan en las páginas. Solo `NOT*` en mayúsculas da error de
  sintaxis de FTS5, y la pantalla lo muestra como error con «Reintentar» (`:465-473`): no es hallazgo.
- **`sanitizeFtsQuery`** (16 pruebas), **filtros de testamento y libro** (8 y 12), **«Ir a referencia»** (6):
  cubiertos. Los resultados derivan de las filas por los dos filtros (`:349-371`): lista, conteo y chips no
  se desalinean.
- **Historial:** solo guarda búsquedas con resultados; el logro se cuenta igual.
- **«Cargar más»** es un botón, no `onEndReached`; se deshabilita mientras carga.

## Sin medir

- **Respuestas fuera de orden** (Modo C): `performSearch` no descarta una respuesta vieja si llega después de
  la nueva. Si `expo-sqlite` atiende las consultas de una conexión en serie, no pasa; no se midió.
- **«Cargar más» con la caja ya cambiada** y la búsqueda nueva aún en su espera de 500 ms: pide la consulta
  nueva con el desplazamiento de la vieja; la búsqueda nueva lo reemplaza al llegar (transitorio, por lectura).

## Cruce con las filas vecinas (§5, sesión 116)

- `A14` dejó `searchVerses`/`searchByBook` para aquí: hecho (arriba). `R9-430` y `R9-424` son vecinos: el
  cambio de versión que `R9-424` hace en cada arranque en frío (la descargada cae a WEB/RVR1960) no deja una
  búsqueda vieja en pantalla, porque en frío la pestaña arranca vacía.
- `A13` (lector): el lector abre en la versión actual, no en la del resultado (`search.tsx:559-563`); con
  `R9-430`, el fragmento y el texto del lector difieren.
