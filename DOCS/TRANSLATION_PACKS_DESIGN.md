# 📦 Packs de traducciones descargables — Documento de diseño

**Estado:** Construido (fases 1–5) + live-verificado (2026-06-21).
**Autor:** revisión profunda Eternal Bible · _Para la gloria de Dios Todopoderoso ✨_

> **⚠️ ACTUALIZACIÓN 2026-06-21 — reestructuración del bundle (decisión del
> usuario, vigente).** El reparto base/descargable se **invirtió** respecto a la
> decisión original de abajo:
>
> - **BASE embebida (seed):** **RVR1960 (es) + WEB (en)**.
> - **DESCARGABLES (packs):** **KJV (en) + BSB (en)**.
>
> Motivos: reconcilia la inconsistencia de WEB (era `bundled:false` pero el
> data-loader lo cargaba igual en cada arranque) y libera ~8 MB del bundle al
> borrar `bible-data-kjv.ts` (KJV ahora viaja como `kjv.sqlite`). Todo lo demás
> del diseño (esquema, ATTACH+INSERT idempotente, FTS por trigger, selector
> instaladas-only, hosting en Pages) se mantiene igual; solo cambian qué ids son
> `bundled:true` y el contenido de `assets/bible-seed.db` + `versions.json`.
> Reconstruir con `node --experimental-sqlite scripts/rebuild-seed.js`.

**Decisión ORIGINAL (2026-06-20, superseded por la de arriba):** versiones
**WEB + BSB** descargables; **mantener** el bundle por defecto (RVR1960 + KJV);
**hospedar** los packs en el sitio Pages existente.

> "Toda la Escritura es inspirada por Dios, y útil para enseñar." — 2 Timoteo 3:16

---

## 1. Propósito

Ofrecer **más traducciones fieles y de dominio público**, descargables bajo
demanda, sin que el APK crezca y a **costo $0** (sin backend, sin auth). La idea
original del usuario era "app más ligera"; eso ya se resolvió por otra vía (filtro
de ABI, APK 3.2.10, −38.8 %). Aquí el valor es **contenido**: dar al lector el
inglés moderno y fiel (WEB, BSB) además del RVR1960 + KJV que ya trae.

Un efecto secundario importante: hoy `WEB` ya aparece en el selector
(`AVAILABLE_VERSIONS`) **pero la base de datos no tiene sus versículos** →
seleccionarla muestra capítulos vacíos. Este feature **corrige ese bug latente**.

---

## 2. Decisiones tomadas

1. **Versiones (primer lote):** **WEB** (World English Bible) + **BSB** (Berean
   Standard Bible). Ambas en inglés, fieles, **dominio público**.
2. **Bundle por defecto:** se **mantiene** RVR1960 + KJV embebido (~22 MB). WEB y
   BSB son **adición pura** descargable. (No se achica el default: el peso del APK
   ya se resolvió vía ABI, la DB son solo ~22 MB, y achicar arriesga el primer
   arranque offline a cambio de ahorrar poco.)
3. **Hosting:** los packs (~5–6 MB c/u, < 100 MB) se sirven desde el **sitio Pages
   existente** (`eternalstonebible.github.io`), reusando el flujo de deploy ya
   probado. (Alternativa descartada por ahora: GitHub Releases — solo necesario si
   un asset superara 100 MB o para no engordar el git del repo Pages.)

### Licencias (verificadas)

| Versión                     | Idioma | Licencia                               | Distribuible $0   |
| --------------------------- | ------ | -------------------------------------- | ----------------- |
| WEB — World English Bible   | en     | Dominio público                        | ✅                |
| BSB — Berean Standard Bible | en     | **PD desde 2023-04-30** (berean.bible) | ✅                |
| RVR1960 (ya embebida)       | es     | © Sociedades Bíblicas Unidas          | ⚠ ya distribuida |
| KJV (ya embebida)           | en     | PD en EE. UU.                          | ✅                |

NTV/NLT (Tyndale) **quedan fuera**: requieren licencia escrita, no son $0.
Español PD (RV1909 / VBL) queda como posible lote futuro.

---

## 3. Fuentes de datos ($0, verso a verso, mapeables a `book_id` 1–66)

- **WEB:** `scrollmapper/bible_databases` (GitHub; SQLite/CSV/JSON, 66 libros
  estándar), `TehShrike/world-english-bible` (JSON), `ebible.org` (USFX/OSIS),
  `bible-api.com` (por defecto WEB).
- **BSB:** `berean.bible/downloads.htm` → "BSB Translation Tables · TSV/XLSX" +
  `.txt`/USFM (fuente autoritativa); también en `scrollmapper`.

**Fuente recomendada para el build:** `scrollmapper/bible_databases`, porque trae
**WEB y BSB con el mismo esquema** (libro/capítulo/versículo en numeración
protestante de 66 libros) → un solo pipeline. Se **DB-verifica** contra el original
(ebible / berean.bible) por `book_id`, como toda la Escritura del proyecto.

---

## 4. Encaje con el esquema actual (clave: muy limpio)

- `verses(book_id, book_name, chapter, verse, text, version)` ya tiene la columna
  `version` y `UNIQUE(book_id, chapter, verse, version)`. Un pack solo **INSERTa
  filas** con `version='WEB'` / `'BSB'` y `book_name` = nombre **inglés** del libro
  (como ya hace KJV), resuelto por `book_id`.
- `verses_fts` es FTS5 **external-content** sobre `verses` con triggers
  `verses_ai/ad/au`: al INSERTar, el trigger **indexa automáticamente** la búsqueda.
  Cero trabajo extra de FTS para los packs.
- El acoplamiento por-versión es **data-driven**:
  - `christLangForVersion(id)` y `versionAbbrev(id)` consultan `BIBLE_VERSIONS`.
  - La voz de narración sigue `version.language` (`'en'` → voz inglesa).
    → Con **añadir la entrada** a `BIBLE_VERSIONS` (`{id:'BSB', name:'Berean Standard
Bible', abbreviation:'BSB', language:'en', year:'2022'}`) y dejar WEB ya
    declarada, **todo lo demás funciona solo**.

---

## 5. Arquitectura ($0)

```
GitHub Pages (eternalstonebible.github.io)
 ├─ /packs/versions.json          ← metadata (qué hay disponible)
 ├─ /packs/web.sqlite(.gz)        ← pack WEB  (~5–6 MB / ~2 MB gz)
 └─ /packs/bsb.sqlite(.gz)        ← pack BSB

App
 ├─ Registro de versiones: INSTALADAS (en la DB) vs DESCARGABLES (de versions.json)
 ├─ Ajustes → "Gestionar versiones": lista, tamaño, descargar / eliminar, progreso
 ├─ Descarga: expo-file-system (progreso, reintento, chequeo de espacio libre)
 ├─ Verificación: tamaño + sha256 contra versions.json
 ├─ Import: ATTACH pack + INSERT INTO verses SELECT … (triggers indexan FTS)
 │          → marca @bible_data_loaded_<version> en AsyncStorage
 └─ Selector de versión: solo muestra INSTALADAS (arregla el WEB-vacío)
```

### `versions.json` (forma propuesta)

```json
{
  "schema": 1,
  "versions": [
    {
      "id": "WEB",
      "name": "World English Bible",
      "abbreviation": "WEB",
      "language": "en",
      "year": "2000",
      "url": "https://eternalstonebible.github.io/packs/web.sqlite.gz",
      "bytes": 2100000,
      "sha256": "…",
      "verseCount": 31102
    },
    {
      "id": "BSB",
      "name": "Berean Standard Bible",
      "abbreviation": "BSB",
      "language": "en",
      "year": "2022",
      "url": "…/bsb.sqlite.gz",
      "bytes": 2200000,
      "sha256": "…",
      "verseCount": 31102
    }
  ]
}
```

### Import (pseudocódigo)

```
descargar pack → archivo local
verificar bytes + sha256
ATTACH 'pack.sqlite' AS pack;
BEGIN;
INSERT OR IGNORE INTO verses (book_id, book_name, chapter, verse, text, version)
  SELECT book_id, book_name, chapter, verse, text, 'WEB' FROM pack.verses;
COMMIT;                       -- los triggers verses_ai pueblan verses_fts
DETACH pack; borrar archivo;
AsyncStorage.set('@bible_data_loaded_WEB', 'true')
```

> Si `ATTACH` no estuviera disponible en expo-sqlite, plan B: abrir el pack como
> segunda DB, leer filas e INSERTar por lotes en una transacción. Mismo resultado.

---

## 6. Pipeline de build del pack (operacional)

1. **Yo (asistente)** genero `web.sqlite` y `bsb.sqlite` desde la fuente
   (scrollmapper → node → `sqlite3.exe`), mapeando a `book_id` 1–66 + `book_name`
   inglés, y **DB-verifico** conteos y muestras por `book_id` contra el original.
2. Comprimo (`.gz`) y calculo `sha256` + tamaño → relleno `versions.json`.
3. **Tú (usuario)** subes `packs/*.sqlite.gz` + `packs/versions.json` al repo Pages
   (mismo flujo: clone org repo → copiar → commit → push), como hiciste con el
   redirector.
4. Sondeo el `versions.json` en vivo con cache-buster hasta verlo publicado.

---

## 7. Riesgos y mitigaciones

- **Versificación.** WEB/BSB siguen la numeración protestante de 66 libros
  (≈KJV), pero hay bordes (títulos de Salmos, Jn 7:53–8:11, Mr 16:9–20, Ro 16:25–27,
  finales de 3 Jn). Mitigación: `getVerse` ya devuelve `null` → la UI muestra "…"
  con gracia; los cross-refs/Cristo se reensamblan localmente y degradan solos. Se
  DB-verifican conteos por capítulo antes de publicar.
- **Nombre de libro.** Los packs en inglés usan `book_name` inglés (como KJV) para
  que búsqueda/navegación resuelvan; la identidad real es `book_id` (canónica).
- **Primer arranque / offline.** Sin cambios: el bundle por defecto sigue completo;
  los packs son opcionales y solo se bajan con conexión.
- **Selector con versión no instalada.** Hoy WEB se ofrece vacía; el feature hace
  que el selector liste **solo instaladas** + un acceso a "Gestionar versiones".
- **Integridad de descarga.** sha256 + tamaño; reintento; limpieza del temporal.
- **Espacio.** Chequeo de espacio libre antes de descargar/importar.

---

## 8. Plan de construcción (tandas reviewables, en orden)

1. **Datos:** generar + DB-verificar `web.sqlite` y `bsb.sqlite`; redactar
   `versions.json`. (Artefacto: packs listos para subir.)
2. **Registro de versiones (app, puro + testeable):** modelo "instalada vs
   descargable", añadir BSB a `BIBLE_VERSIONS`, unificar con `AVAILABLE_VERSIONS`,
   un contexto/estado que lea qué versiones tiene la DB (`getDatabaseStats` ya da
   `versions[]`). El selector pasa a instaladas-only.
3. **Importador (DB):** `importVersionPack(file, versionId)` con ATTACH+INSERT (o
   plan B), idempotente, + `@bible_data_loaded_<id>`; tests de la capa pura.
4. **Descargas (servicio):** fetch de `versions.json`, descarga con progreso/
   reintento/espacio/sha256 (expo-file-system).
5. **UI "Gestionar versiones"** en Ajustes: lista, tamaño, Descargar/Eliminar,
   barra de progreso, estados (instalada/descargando/disponible/error). Honra el
   tema de Settings.
6. **Deploy:** el usuario sube los packs + `versions.json`; verificación en vivo.
7. **Pulido:** eliminar una versión descargada (DELETE … WHERE version=?), i18n,
   a11y, live-verify de descarga→lectura→búsqueda→Mesa en la nueva versión.

Gates verdes en cada tanda; contenido DB-verificado por `book_id`.

---

## 9. Fuera de alcance (por ahora)

- Versiones con copyright (NTV/NLT, etc.) — exigen licencia escrita, no $0.
- Español PD adicional (RV1909 / VBL) — posible lote futuro.
- Audio/narración descargable — el TTS ya sigue el idioma de la versión; no hay
  audio pre-grabado que bajar.
- Achicar el bundle por defecto — descartado (poco ahorro, riesgo de primer
  arranque).

---

_"Lámpara es a mis pies tu palabra, y lumbrera a mi camino." — Salmo 119:105_
