/**
 * 🔗 studyConnections — the two-way scripture connection web for Study mode.
 *
 * The curated cross-reference map (`CROSS_REFERENCES`) is DIRECTIONAL: it lists
 * the parallels a verse points TO. The quick cross-references sheet shows only
 * that outgoing list. Study mode goes one step further and also surfaces the
 * INCOMING side — "which other verses point AT this one" — by inverting the
 * map once. So Genesis 1:1 → John 1:1 (outgoing) ALSO means John 1:1 is
 * "referenced by" Genesis 1:1 (incoming), a connection the reader could never
 * see before. Together they form a small bidirectional web around a verse.
 *
 * PURE (no React/RN, no DB): keys are canonical "EnglishBook/Chapter/Verse"
 * strings (the same index form `getCrossReferences` normalises to), so a Spanish
 * or English book name resolves to the same node. The reverse index is built
 * once and memoised for the default map. Defensive: unknown verses → empty web,
 * never throws. The screen fetches each connection's verse text from SQLite.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {
  CROSS_REFERENCES,
  getCrossReferences,
} from '@/constants/cross-references';
import {getBookByName} from '@/constants/bible';

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type RefKey = string;

export interface StudyConnections {
  /** Canonical key of the focus verse, or null if the book is unknown. */
  focus: RefKey | null;
  /** Curated parallels this verse points TO (outgoing edges). */
  references: RefKey[];
  /** Verses whose curated parallels point AT this verse (incoming edges). */
  referencedBy: RefKey[];
  /** Distinct connected verses across both directions (excludes the focus). */
  totalConnections: number;
}

/**
 * Canonical index key for a verse, resolving any book spelling (es/en) to the
 * English name — matching how `getCrossReferences` and `CROSS_REFERENCES` key.
 */
export function canonicalRefKey(
  book: string,
  chapter: number,
  verse: number,
): RefKey | null {
  if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) {
    return null;
  }
  const englishName = getBookByName(book)?.nameEn ?? null;
  if (englishName === null) return null;
  return `${englishName}/${chapter}/${verse}`;
}

/**
 * Invert a cross-reference map: target key → the source keys that list it.
 * Exported (and pure over its argument) so it is unit-testable in isolation.
 */
export function buildReverseIndex(
  map: Record<string, string[]> = CROSS_REFERENCES,
): Map<RefKey, RefKey[]> {
  const reverse = new Map<RefKey, RefKey[]>();
  for (const source of Object.keys(map)) {
    for (const target of map[source] ?? []) {
      const list = reverse.get(target);
      if (list) {
        if (!list.includes(source)) list.push(source);
      } else {
        reverse.set(target, [source]);
      }
    }
  }
  return reverse;
}

// Memoised reverse index for the default (shipped) cross-reference map.
let defaultReverseIndex: Map<RefKey, RefKey[]> | null = null;
function getDefaultReverseIndex(): Map<RefKey, RefKey[]> {
  if (defaultReverseIndex === null) {
    defaultReverseIndex = buildReverseIndex(CROSS_REFERENCES);
  }
  return defaultReverseIndex;
}

/**
 * Build the two-way connection web for a verse: its outgoing curated parallels
 * plus the verses that reference it. Never throws; an unknown verse yields an
 * empty web. `reverseIndex`/`outgoing` are injectable for tests.
 */
export function getStudyConnections(
  book: string,
  chapter: number,
  verse: number,
  deps?: {
    reverseIndex?: Map<RefKey, RefKey[]>;
    outgoing?: (book: string, chapter: number, verse: number) => string[];
  },
): StudyConnections {
  const focus = canonicalRefKey(book, chapter, verse);
  const outgoingFn = deps?.outgoing ?? getCrossReferences;
  const reverseIndex = deps?.reverseIndex ?? getDefaultReverseIndex();

  // Outgoing: dedupe and drop any self-reference.
  const references = uniqueExcept(outgoingFn(book, chapter, verse), focus);

  // Incoming: look the focus key up in the reverse index.
  const referencedBy = focus
    ? uniqueExcept(reverseIndex.get(focus) ?? [], focus)
    : [];

  const union = new Set<RefKey>([...references, ...referencedBy]);

  return {
    focus,
    references,
    referencedBy,
    totalConnections: union.size,
  };
}

/** Dedupe a ref list (preserving order) and drop a key equal to `except`. */
function uniqueExcept(
  refs: readonly string[],
  except: RefKey | null,
): RefKey[] {
  const seen = new Set<string>();
  const out: RefKey[] = [];
  for (const ref of refs ?? []) {
    if (typeof ref !== 'string' || ref === except || seen.has(ref)) continue;
    seen.add(ref);
    out.push(ref);
  }
  return out;
}
