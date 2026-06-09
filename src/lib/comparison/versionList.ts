/**
 * 📚 versionList — PURE comparison version-list builder (Sprint 71).
 *
 * `getAvailableVersions` lists the versions the user "really has" (those present
 * in the `verses` table) and resolves each to its `bible_versions` metadata row.
 * That mapping loop was inline + impossible to unit-test, and it harbored a
 * cross-language bug (see below). This extracts the PURE part so the
 * id/abbreviation resolution + the metadata fallback are tested in isolation,
 * mirroring `imageTemplates.ts` / `comparisonCard.ts`.
 *
 * CRITICAL (the Sprint 71 fix): `metaRows` MUST be the FULL `bible_versions`
 * table, NOT filtered by the UI language. The screen called
 * `getAvailableVersions('es')`, which filtered the metadata to Spanish rows —
 * so the English versions present in `verses` (KJV / WEB) failed their metadata
 * lookup and fell to the generic fallback, which stamped them with the UI
 * language ('es'). That made cross-language pairs (RVR1960 + KJV) resolve as
 * `sameLanguage === true`, defaulting the word-contrast ON and rendering EVERY
 * word as "divergent" (inline AND on the share card). Resolving against the full
 * table gives each version its TRUE language, so the contrast defaults off for
 * genuinely cross-language pairs.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {BibleVersion} from './VersionComparison';

/** A row of the `bible_versions` metadata table (snake_case, as stored). */
export interface VersionMetaRow {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  description: string;
  year: number;
  is_premium: number;
}

/** Map a metadata row to the public `BibleVersion` shape. */
function fromMeta(meta: VersionMetaRow): BibleVersion {
  return {
    id: meta.id,
    name: meta.name,
    abbreviation: meta.abbreviation,
    language: meta.language,
    description: meta.description || '',
    year: meta.year,
    isPremium: meta.is_premium === 1,
  };
}

/**
 * Build the comparison version list from the version ids actually present in
 * the `verses` table, resolving each to its metadata row by id (then by
 * abbreviation), case-insensitively. A version with NO matching metadata row
 * falls back to a generic entry stamped with `fallbackLanguage`.
 *
 * Pure: no SQLite, no React. The caller passes the DISTINCT version ids from
 * `verses` and the FULL `bible_versions` rows (see the file header on why the
 * rows must not be language-filtered). De-duplicates so a version present under
 * both its id and abbreviation is emitted once. Result is sorted by name to
 * match the previous behavior.
 */
export function buildVersionList(
  existingVersionIds: string[],
  metaRows: VersionMetaRow[],
  fallbackLanguage: string,
): BibleVersion[] {
  const metaById = new Map(metaRows.map(row => [row.id.toLowerCase(), row]));
  const metaByAbbr = new Map(
    metaRows.map(row => [row.abbreviation.toLowerCase(), row]),
  );

  const finalVersions: BibleVersion[] = [];
  const processedIds = new Set<string>();

  for (const vId of existingVersionIds) {
    const lowerId = vId.toLowerCase();
    const meta = metaById.get(lowerId) || metaByAbbr.get(lowerId);

    if (meta) {
      // Skip a version already emitted (e.g. listed under both id + abbr).
      if (processedIds.has(meta.id.toLowerCase())) continue;
      finalVersions.push(fromMeta(meta));
      processedIds.add(meta.id.toLowerCase());
      processedIds.add(meta.abbreviation.toLowerCase());
    } else {
      if (processedIds.has(lowerId)) continue;
      // No metadata: a generic entry stamped with the fallback language.
      finalVersions.push({
        id: lowerId,
        name: vId,
        abbreviation: vId,
        language: fallbackLanguage,
        description: 'Versión local cargada en memoria',
        year: new Date().getFullYear(),
        isPremium: false,
      });
      processedIds.add(lowerId);
    }
  }

  return finalVersions.sort((a, b) => a.name.localeCompare(b.name));
}
