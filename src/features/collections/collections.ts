/**
 * 📂 collections — PURE "verse collections" derived from favorite tags.
 *
 * Sprint 67. The Favorites store already carries a `tags: string[]` per verse
 * (and syncs them), but nothing surfaced them. A "collection" is simply a tag:
 * grouping the user's favorites by tag turns those tags into first-class,
 * browsable named lists ("Promises", "Comfort", …) — a personal counterpart to
 * the curated S63 topical themes, with NO new storage, table, or migration.
 *
 * Kept pure (no React / SQLite) so the grouping + the tag-array math are
 * unit-testable and reusable by the browse screen, the detail screen, and the
 * "add to collection" sheet.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** The minimum a favorite needs to take part in a collection. */
export interface CollectionFavoriteLike {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  tags?: string[] | null;
  updatedAt?: number;
}

/** One verse inside a collection (a thin, render-ready ref). */
export interface CollectionVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  updatedAt: number;
}

/** A named list = one tag + the favorites carrying it. */
export interface Collection {
  /** The tag, as the user typed it (display name). */
  name: string;
  count: number;
  verses: CollectionVerse[];
  /** Most-recent `updatedAt` across the collection's verses (for sorting). */
  updatedAt: number;
}

/** Trim + collapse internal whitespace; '' means "not a real name". */
export function normalizeCollectionName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Case-insensitive equality on normalized names. */
function sameName(a: string, b: string): boolean {
  return (
    normalizeCollectionName(a).toLowerCase() ===
    normalizeCollectionName(b).toLowerCase()
  );
}

/**
 * Group favorites into collections by tag. A favorite with several tags appears
 * in several collections; favorites with no tags contribute to none. Verses
 * within a collection are ordered newest-first; collections are ordered by
 * their most-recent verse (newest-first), then by name.
 */
export function buildCollections(
  favorites: CollectionFavoriteLike[],
): Collection[] {
  const byKey = new Map<string, Collection>();

  for (const fav of favorites) {
    const tags = fav.tags ?? [];
    const updatedAt = fav.updatedAt ?? 0;
    for (const rawTag of tags) {
      const name = normalizeCollectionName(rawTag);
      if (!name) continue;
      const key = name.toLowerCase();
      const verse: CollectionVerse = {
        book: fav.book,
        chapter: fav.chapter,
        verse: fav.verse,
        text: fav.text,
        updatedAt,
      };
      const existing = byKey.get(key);
      if (existing) {
        existing.verses.push(verse);
        existing.count += 1;
        if (updatedAt > existing.updatedAt) existing.updatedAt = updatedAt;
      } else {
        byKey.set(key, {name, count: 1, verses: [verse], updatedAt});
      }
    }
  }

  const collections = Array.from(byKey.values());
  for (const c of collections) {
    c.verses.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  collections.sort(
    (a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name),
  );
  return collections;
}

/**
 * The distinct collection names across all favorites, sorted alphabetically.
 * Derived from {@link buildCollections} so the display casing matches (the
 * first-seen casing wins, not the last).
 */
export function collectionNames(favorites: CollectionFavoriteLike[]): string[] {
  return buildCollections(favorites)
    .map(c => c.name)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Add a collection (tag) to a favorite's tag list. Returns a NEW array; a blank
 * name or a name already present (case-insensitive) is a no-op.
 */
export function addToCollection(
  tags: string[] | null | undefined,
  rawName: string,
): string[] {
  const current = tags ?? [];
  const name = normalizeCollectionName(rawName);
  if (!name) return [...current];
  if (current.some(t => sameName(t, name))) return [...current];
  return [...current, name];
}

/** Remove a collection (tag) from a favorite's tag list (case-insensitive). */
export function removeFromCollection(
  tags: string[] | null | undefined,
  rawName: string,
): string[] {
  const current = tags ?? [];
  const name = normalizeCollectionName(rawName);
  return current.filter(t => !sameName(t, name));
}

/** Whether a favorite already belongs to a given collection. */
export function isInCollection(
  tags: string[] | null | undefined,
  rawName: string,
): boolean {
  const name = normalizeCollectionName(rawName);
  return (tags ?? []).some(t => sameName(t, name));
}
