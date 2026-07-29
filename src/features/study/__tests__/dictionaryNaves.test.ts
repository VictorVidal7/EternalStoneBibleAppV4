/**
 * Fidelity gate for the Nave's Topical Bible cross-reference panel data
 * (`dictionaryNaves.ts`). Every single reference is checked against the
 * REAL bundled RVR1960 verse data (`RVR1960_DATA`) — book, chapter, AND
 * verse must actually exist, not just fall within the book's chapter
 * count — the same "verify against bible-seed.db" discipline already
 * applied to the Millennium multi-view citations
 * ([[essb-premium-audit-pastors-teachers]]). This is the permanent
 * regression guard: a future edit that introduces a typo'd reference fails
 * this test loudly instead of shipping a broken/misleading citation.
 */
import {RVR1960_DATA} from '../../../lib/database/bible-data-rvr1960';
import {parseReference} from '../../../lib/references/parseReference';
import {
  DICTIONARY_NAVES_REFS,
  NAVES_ALLOWLIST,
  getNavesCrossReferences,
} from '../dictionaryNaves';

// book_name -> chapter -> Set(verse), built once from the real bundled data.
const VERSE_INDEX = new Map<string, Map<number, Set<number>>>();
for (const v of RVR1960_DATA as {
  book_name: string;
  chapter: number;
  verse: number;
}[]) {
  let chapters = VERSE_INDEX.get(v.book_name);
  if (!chapters) {
    chapters = new Map();
    VERSE_INDEX.set(v.book_name, chapters);
  }
  let verses = chapters.get(v.chapter);
  if (!verses) {
    verses = new Set();
    chapters.set(v.chapter, verses);
  }
  verses.add(v.verse);
}

/** True when every verse implied by a parsed reference (a single verse, or
 *  every verse in a range, or every verse in a whole-chapter reference)
 *  actually exists in the bundled RVR1960 text. */
function referenceResolvesToRealVerses(ref: string): boolean {
  const parsed = parseReference(ref);
  if (!parsed) return false;
  const chapters = VERSE_INDEX.get(parsed.book.name);
  if (!chapters) return false;
  const verses = chapters.get(parsed.chapter);
  if (!verses) return false;
  if (parsed.verse === undefined) return true; // whole-chapter reference
  if (!verses.has(parsed.verse)) return false;
  if (parsed.verseEnd !== undefined && !verses.has(parsed.verseEnd)) {
    return false;
  }
  return true;
}

describe('dictionaryNaves — allow-list', () => {
  it('matches exactly the 6 entries scoped as the v1.1 fast-follow', () => {
    expect([...NAVES_ALLOWLIST].sort()).toEqual(
      ['belen', 'galilea', 'jerico', 'nazaret', 'sinagoga', 'tiro'].sort(),
    );
  });

  it('DICTIONARY_NAVES_REFS has data for exactly the allow-listed slugs', () => {
    expect(Object.keys(DICTIONARY_NAVES_REFS).sort()).toEqual(
      [...NAVES_ALLOWLIST].sort(),
    );
  });

  it('getNavesCrossReferences returns an empty array for a slug outside the allow-list', () => {
    expect(getNavesCrossReferences('aaron')).toEqual([]);
    expect(getNavesCrossReferences('sanedrin')).toEqual([]);
    expect(getNavesCrossReferences('does-not-exist')).toEqual([]);
  });
});

describe('dictionaryNaves — data shape', () => {
  for (const slug of NAVES_ALLOWLIST) {
    it(`${slug} has at least one heading, and no heading has an empty refs list`, () => {
      const sections = getNavesCrossReferences(slug);
      expect(sections.length).toBeGreaterThan(0);
      for (const section of sections) {
        expect(section.heading.trim().length).toBeGreaterThan(0);
        expect(section.refs.length).toBeGreaterThan(0);
      }
    });
  }
});

describe('dictionaryNaves — every citation resolves to a real verse', () => {
  for (const [slug, sections] of Object.entries(DICTIONARY_NAVES_REFS)) {
    describe(slug, () => {
      for (const section of sections) {
        for (const ref of section.refs) {
          it(`"${ref}" (under "${section.heading}") parses and exists in RVR1960`, () => {
            expect(parseReference(ref)).not.toBeNull();
            expect(referenceResolvesToRealVerses(ref)).toBe(true);
          });
        }
      }
    });
  }
});
