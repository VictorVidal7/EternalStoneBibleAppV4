/**
 * Canonical keying for the reading-progress map.
 *
 * Reading progress is stored as `{ [book]: { [chapter]: percentage } }`. The
 * reader historically wrote it under the SPANISH book name (`bookInfo.name`,
 * e.g. "Juan"/"Génesis"), and the chapter grid read it back the same way — so
 * those agreed. But the Home "Continue Reading" card reads it via
 * `reading_progress.book`, which is the route param (often the ENGLISH name
 * "John"/"Genesis" when you arrive via Home/daily-verse/a deep-link) — so its
 * lookup missed the Spanish-keyed entry and the card was stuck at 0%
 * (Sprint 58 follow-up, same cross-language keying family as the favorites
 * bug). Funnelling every read and write through a single canonical (English)
 * key fixes the card without breaking the grid.
 */
import {canonicalBookName} from '../../constants/bible';

export type ChapterProgressMap = Record<string, Record<string, number>>;

/** Canonical, language-agnostic storage key for a book's reading progress. */
export function canonicalProgressKey(book: string): string {
  return canonicalBookName(book);
}

/**
 * Re-key a stored progress map so every book uses its canonical (English)
 * name, merging any duplicate spellings by keeping the higher percentage per
 * chapter. Idempotent and defensive (tolerates null/malformed shapes), so it
 * can run on every hydrate to migrate legacy Spanish-keyed data in place.
 */
export function canonicalizeProgressMap(
  progress: ChapterProgressMap | null | undefined,
): ChapterProgressMap {
  const out: ChapterProgressMap = {};
  if (!progress || typeof progress !== 'object') return out;

  for (const [book, chapters] of Object.entries(progress)) {
    if (!chapters || typeof chapters !== 'object') continue;
    const key = canonicalBookName(book);
    const target = (out[key] ??= {});
    for (const [chapter, pct] of Object.entries(chapters)) {
      if (typeof pct !== 'number' || !Number.isFinite(pct)) continue;
      const prev = target[chapter];
      target[chapter] = prev == null ? pct : Math.max(prev, pct);
    }
  }
  return out;
}
