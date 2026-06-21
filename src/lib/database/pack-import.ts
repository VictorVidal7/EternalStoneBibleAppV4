/**
 * Pure helpers for the translation-pack importer (translation packs, phase 3).
 *
 * The actual ATTACH + INSERT runs against the native expo-sqlite database (see
 * `BibleDatabase.importVersionPack`), but the path/key/SQL pieces below are
 * DB-free so they can be unit tested without a device.
 *
 * A pack is a standalone SQLite file with a single
 * `verses(book_id, book_name, chapter, verse, text)` table — NO `version`
 * column (added at import) and NO FTS (the app's `verses_ai` trigger indexes
 * each newly inserted row into `verses_fts` on the device).
 */

/**
 * The AsyncStorage flag that marks a version's verses as present in the DB.
 * Matches the legacy JS bulk-loader keys (`@bible_data_loaded_rvr1960` …) so a
 * relaunch's `initializeBibleData` short-circuits instead of re-iterating rows.
 */
export function packLoadedKey(versionId: string): string {
  return `@bible_data_loaded_${versionId.trim().toLowerCase()}`;
}

/**
 * SQLite's `ATTACH DATABASE` wants a bare filesystem path, but expo-file-system
 * hands back `file://` URIs. Strip the scheme and percent-decode (`%20` → space)
 * so the attach resolves. An already-bare path passes through unchanged.
 */
export function normalizePackPath(uri: string): string {
  let path = uri.trim();
  if (path.startsWith('file://')) {
    path = path.slice('file://'.length);
  }
  try {
    path = decodeURI(path);
  } catch {
    // Not valid percent-encoding — leave the path as-is.
  }
  return path;
}

/**
 * The additive, idempotent import statement. The pack's `verses` table carries
 * no `version` column (the bound `?` supplies it) and no FTS index — the main
 * DB's AFTER INSERT trigger indexes each new row into `verses_fts`.
 * `INSERT OR IGNORE` against `UNIQUE(book_id, chapter, verse, version)` makes a
 * re-import a no-op, so `changes()` reports only the rows actually added.
 */
export const PACK_IMPORT_SQL =
  `INSERT OR IGNORE INTO verses (book_id, book_name, chapter, verse, text, version) ` +
  `SELECT book_id, book_name, chapter, verse, text, ? FROM pack.verses`;

/** The schema name the pack is attached under during an import. */
export const PACK_SCHEMA = 'pack';
