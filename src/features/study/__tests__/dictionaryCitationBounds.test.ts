/**
 * Regression guard for the dictionary citation-linkifier verse-bounds bug:
 * `parseReference` used to validate a citation's CHAPTER against the book's
 * chapter count but never the VERSE against that chapter's actual verse
 * count, so an out-of-range verse (e.g. "Gá 6:19" — Gálatas 6 only has 18
 * verses) rendered as a tappable link that silently dead-ended (navigated to
 * the right book/chapter but landed on nothing).
 *
 * Two things are pinned here, both discovered by cross-checking the bundled
 * dictionary content (`assets/dictionary-v1-es.json`,
 * `dictionary-v2-es.json`, `dictionary-v2-multiview-es.json`) against the
 * real bundled RVR1960 text:
 *
 *  1. Six citations across the bundled dictionary content are genuinely
 *     out-of-range (a disclosed translator misprint, two references to the
 *     apocryphal "2 Esdras" the app has no data for, and — before this fix
 *     — two undisclosed chapter-digit typos). All six must fail to resolve
 *     via `parseReference`/`linkifyReferences` rather than become dead-end
 *     links.
 *  2. Two of those six were actual typos (not disclosed misprints) and were
 *     corrected in the source JSON: "expiacion"'s "Nm 36:33" → "Nm 35:33",
 *     and "tabernaculo"'s "Éx 26:40" → "Éx 25:40". Both corrected citations
 *     must resolve to REAL verses whose text matches what the surrounding
 *     sentence is quoting.
 *
 * A final sweep re-runs the same bounds check against every single
 * citation `linkifyReferences` recognizes across all 3 bundled dictionary
 * assets, cross-checked against the real bundled RVR1960 verse data, to
 * confirm (a) no other out-of-range citations are hiding in the content and
 * (b) the new bounds check never rejects a citation that actually resolves
 * to a real verse (a false positive would be worse than the original bug).
 */
import {RVR1960_DATA} from '../../../lib/database/bible-data-rvr1960';
import {
  linkifyReferences,
  parseReference,
} from '../../../lib/references/parseReference';

const DICTIONARY_FILES = [
  'dictionary-v1-es.json',
  'dictionary-v2-es.json',
  'dictionary-v2-multiview-es.json',
] as const;

interface DictEntry {
  slug: string;
  headwordEs?: string;
  glossEs?: string;
  articleEs?: string;
}

function loadEntries(file: string): DictEntry[] {
  const data = require(`../../../../assets/${file}`);
  return Array.isArray(data) ? data : Object.values(data);
}

// book_name -> chapter -> Set(verse), built once from the real bundled data
// — same idiom as dictionaryNaves.test.ts's fidelity gate.
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

function realVerseSet(
  bookName: string,
  chapter: number,
): Set<number> | undefined {
  return VERSE_INDEX.get(bookName)?.get(chapter);
}

describe('dictionary citations — out-of-range verses no longer dead-link', () => {
  it.each([
    ['Gá 6:19', 'Gálatas ch.6 only has 18 verses (disclosed misprint)'],
    ['Nm 36:33', 'Números ch.36 only has 13 verses'],
    ['Lv 5:26', 'Levítico ch.5 only has 19 verses'],
    ['Esd 7:91-98', 'Esdras ch.7 only has 28 verses (2 Esdras, unregistered)'],
    ['Esd 7:119', 'Esdras ch.7 only has 28 verses (2 Esdras, unregistered)'],
    ['Éx 26:40', 'Éxodo ch.26 only has 37 verses'],
  ])('"%s" fails to resolve — %s', ref => {
    expect(parseReference(ref)).toBeNull();
  });

  it('linkifyReferences falls back to plain, non-tappable text for these citations', () => {
    for (const ref of ['Gá 6:19', 'Nm 36:33', 'Lv 5:26', 'Éx 26:40']) {
      const segs = linkifyReferences(`ver ${ref} para más detalle`);
      expect(segs.every(s => s.ref === undefined)).toBe(true);
    }
  });
});

describe('dictionary content corrections resolve to the real quoted verse', () => {
  it('"expiacion" now cites Nm 35:33 (bloodguilt/expiation for murder), not 36:33', () => {
    const parsed = parseReference('Nm 35:33');
    expect(parsed).not.toBeNull();
    expect(realVerseSet('Números', 35)?.has(33)).toBe(true);

    const entries = loadEntries('dictionary-v2-es.json');
    const entry = entries.find(e => e.slug === 'expiacion');
    expect(entry?.articleEs).toContain('Nm 35:33');
    expect(entry?.articleEs).not.toContain('Nm 36:33');
  });

  it('"tabernaculo" now cites Éx 25:40 ("shown the pattern on the mountain", cross-referenced as He 8:5), not 26:40', () => {
    const parsed = parseReference('Éx 25:40');
    expect(parsed).not.toBeNull();
    expect(realVerseSet('Éxodo', 25)?.has(40)).toBe(true);

    const entries = loadEntries('dictionary-v2-es.json');
    const entry = entries.find(e => e.slug === 'tabernaculo');
    expect(entry?.articleEs).toContain('Éx 25:40');
    expect(entry?.articleEs).not.toContain('Éx 26:40');
  });

  it('"espiritu-santo" now cites Gá 5:19 ("obras de la carne"), not the disclosed Gá 6:19 misprint (Victor promoted it to Pattern A); the 2-Esdras references are left untouched', () => {
    const parsed = parseReference('Gá 5:19');
    expect(parsed).not.toBeNull();
    expect(realVerseSet('Gálatas', 5)?.has(19)).toBe(true);

    const entries = loadEntries('dictionary-v2-es.json');
    const espirituSanto = entries.find(e => e.slug === 'espiritu-santo');
    const salvacion = entries.find(e => e.slug === 'salvacion');
    expect(espirituSanto?.articleEs).toContain('Gá 5:19');
    expect(espirituSanto?.articleEs).not.toContain('Gá 6:19');
    expect(salvacion?.articleEs).toContain('Esd 7:91-98');
    expect(salvacion?.articleEs).toContain('Esd 7:119');
  });
});

describe('dictionary content — full sweep, every recognized citation across all 3 bundled assets', () => {
  for (const file of DICTIONARY_FILES) {
    it(`${file}: every citation linkifyReferences resolves points at a real RVR1960 verse`, () => {
      const entries = loadEntries(file);
      const falsePositives: string[] = [];

      for (const entry of entries) {
        for (const field of ['articleEs', 'glossEs'] as const) {
          const text = entry[field];
          if (!text) continue;
          const segs = linkifyReferences(text);
          for (const seg of segs) {
            if (!seg.ref) continue;
            const {book, chapter, verse, verseEnd} = seg.ref;
            if (verse === undefined) continue; // whole-chapter ref, nothing to bound-check
            const verses = realVerseSet(book.name, chapter);
            const ok =
              verses !== undefined &&
              verses.has(verse) &&
              (verseEnd === undefined || verses.has(verseEnd));
            if (!ok) {
              falsePositives.push(
                `[${entry.slug}] "${seg.text}" resolved but isn't a real ${book.name} ${chapter} verse`,
              );
            }
          }
        }
      }

      expect(falsePositives).toEqual([]);
    });
  }
});
