/**
 * 🖼️ collectionCard — PURE model for the shareable "collection card" image.
 *
 * Sprint 68. The collection detail screen could only share a collection as
 * text. This builds the render-ready model for a single designer image card —
 * the collection name, its total verse count, and a few preview verses (refs +
 * truncated text) — captured with the Sprint 56 view-shot pipeline
 * (`captureRef` → `expo-sharing`) over an `imageTemplates` gradient.
 *
 * Kept pure (no React / SQLite) so the "pick top N + truncate" logic is
 * unit-tested in isolation, mirroring `imageTemplates.ts` / `collections.ts`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** One preview verse on the card (reference already localized by the caller). */
export interface CollectionCardVerse {
  /** e.g. "John 3:16" — composed + localized by the screen. */
  reference: string;
  text: string;
}

/** The render-ready card model. */
export interface CollectionCardModel {
  name: string;
  /** Total verses in the collection (NOT the previewed subset length). */
  count: number;
  /** The preview verses actually drawn on the card (already truncated). */
  verses: CollectionCardVerse[];
}

export interface CollectionCardOptions {
  /** Max preview verses drawn on the card. Default 3. */
  maxVerses?: number;
  /** Max characters per preview verse before an ellipsis. Default 90. */
  maxChars?: number;
}

const DEFAULT_MAX_VERSES = 3;
const DEFAULT_MAX_CHARS = 90;

/**
 * Trim a verse to `maxChars`, cutting on a word boundary where possible and
 * appending an ellipsis. Whitespace is collapsed first so the card never shows
 * ragged line breaks from the source text.
 */
export function truncateVerse(text: string, maxChars: number): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxChars) return clean;
  const slice = clean.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  // Only break on a word boundary if it isn't too aggressive (keeps short words
  // from collapsing the snippet to almost nothing).
  const base = lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}…`;
}

/**
 * Build the card model: the full count from `verses.length`, the first
 * `maxVerses` previews with each text truncated to `maxChars`. Defensive
 * against a non-positive `maxVerses` (yields an empty preview list but keeps
 * the real count, so the card still shows "N verses").
 */
export function buildCollectionCard(
  name: string,
  verses: CollectionCardVerse[],
  options: CollectionCardOptions = {},
): CollectionCardModel {
  const maxVerses = options.maxVerses ?? DEFAULT_MAX_VERSES;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const count = verses.length;
  const preview =
    maxVerses > 0
      ? verses.slice(0, maxVerses).map(v => ({
          reference: v.reference,
          text: truncateVerse(v.text, maxChars),
        }))
      : [];
  return {name, count, verses: preview};
}
