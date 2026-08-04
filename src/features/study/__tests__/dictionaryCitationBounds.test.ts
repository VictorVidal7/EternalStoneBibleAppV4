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
 *
 * Two further bugs, found in a later audit of this same linkifier, are
 * pinned below in their own describe blocks:
 *
 *  A. Whole-chapter citations (no verse, e.g. "Gn 13") skipped the sweep's
 *     bounds check entirely (`if (verse === undefined) continue`). That hid
 *     the fact that a whole-chapter apocryphal-book collision (see B) had
 *     no verse to accidentally fail bounds on, so it resolved live with no
 *     safety net at all — worse than the verse-level case. Note: "Gn 13"
 *     itself is NOT a bug — Génesis really has a chapter 13 (18 verses,
 *     confirmed against `VERSE_COUNTS_BY_BOOK`), so it remains a valid,
 *     resolving link; the article's own bracketed note flags it as a likely
 *     source misprint for "Gn 1:2", which is a content concern for Victor,
 *     not something a bounds check can or should detect.
 *  B. The regex-based scanner in `linkifyReferences` matched a registered
 *     bare book abbreviation ("Esd"/"Esdras", canonical Ezra) as a
 *     standalone token even when a numeral sat immediately before it
 *     ("2 Esd 7:20"), silently discarding that numeral instead of treating
 *     it as changing the reference to the apocryphal, non-canonical
 *     "2 Esdras" (no bundled text). It only failed closed by luck when the
 *     cited verse happened to exceed Ezra's real bounds. The bundled
 *     content's own "1 Esd 5:17" citation (dictionary-v1-es.json, the
 *     "belen" entry) is a live example that used to resolve WRONG: Esdras
 *     (Ezra) chapter 5 has exactly 17 verses, so "1 Esd 5:17" resolved to a
 *     real, wrong Ezra verse — the article's own prose immediately
 *     discloses this is the apocryphal 1 Esdras, not Ezra.
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

describe('Bug A — whole-chapter citations are no longer exempt from bounds-checking', () => {
  it('"Gn 13" (bare chapter, no verse) still resolves — Génesis really has a chapter 13', () => {
    // NOT a bug: Génesis has 50 chapters and chapter 13 has 18 real verses
    // (VERSE_COUNTS_BY_BOOK[0][12] === 18). The article's own bracketed
    // note flags this as a probable source misprint for "Gn 1:2" — that's
    // an editorial content call for Victor, not something any bounds check
    // can detect, since the cited chapter genuinely exists.
    const parsed = parseReference('Gn 13');
    expect(parsed).not.toBeNull();
    expect(parsed?.chapter).toBe(13);
    expect(realVerseSet('Génesis', 13)).toBeDefined();
  });

  it('a whole-chapter apocryphal reference ("2 Esd 7", no verse) no longer resolves live', () => {
    // Before the fix: with no verse to bound-check, this had NO safety net
    // at all (worse than the verse-level case, which at least sometimes
    // failed closed by luck) — it resolved straight to canonical Esdras
    // (Ezra) chapter 7, which is real, so it dead-linked to the WRONG book.
    expect(parseReference('2 Esd 7')).toBeNull();
    const segs = linkifyReferences('según 2 Esd 7 y otros');
    expect(segs.every(s => s.ref === undefined)).toBe(true);
  });

  it('a legitimate real whole-chapter citation ("1 Corintios 15") keeps resolving', () => {
    // Regression guard: the fix must not disable chapter-only linkification
    // wholesale. The bundled content cites this exact whole-chapter
    // reference as a section heading in the multi-view "milenio" article
    // (one of its `sections[].bodyEs` entries, not the flat `articleEs`
    // field — a multi-view entry, per the app's Millennium multi-view
    // treatment).
    const parsed = parseReference('1 Corintios 15');
    expect(parsed).not.toBeNull();
    expect(parsed?.chapter).toBe(15);
    const entries = loadEntries('dictionary-v2-es.json');
    const entry = entries.find(e => e.slug === 'milenio');
    expect(JSON.stringify(entry)).toContain('1 Corintios 15');
  });
});

describe('Bug B — numbered-apocryphal abbreviations no longer collide with canonical books', () => {
  it('"2 Esd 1:5" — a verse WITHIN Ezra\'s real bounds — no longer resolves', () => {
    // Ezra ch.1 has real verses through v.11, so v.5 would have passed the
    // bounds check by accident had the leading "2" been silently dropped.
    expect(parseReference('2 Esd 1:5')).toBeNull();
    expect(realVerseSet('Esdras', 1)?.has(5)).toBe(true); // sanity: real Ezra verse
    const segs = linkifyReferences('según 2 Esd 1:5 y otros');
    expect(segs.every(s => s.ref === undefined)).toBe(true);
  });

  it('"1 Esd 5:17" — the bundled content\'s own live case — no longer resolves', () => {
    // Esdras (Ezra) ch.5 has exactly 17 real verses, so this used to
    // resolve to a real, WRONG verse (not caught by luck like the "2 Esd
    // 7:91-98"/"7:119" citations, which exceed Ezra ch.7's 28-verse bound).
    expect(realVerseSet('Esdras', 5)?.has(17)).toBe(true); // sanity: real Ezra verse
    expect(parseReference('1 Esd 5:17')).toBeNull();

    const entries = loadEntries('dictionary-v1-es.json');
    const entry = entries.find(e => e.slug === 'belen');
    expect(entry?.articleEs).toContain('1 Esd 5:17');
    const segs = linkifyReferences(entry?.articleEs ?? '');
    const wrongLink = segs.find(
      s => s.ref && s.ref.book.name === 'Esdras' && s.ref.chapter === 5,
    );
    expect(wrongLink).toBeUndefined();
  });

  it('bare "Esd 1:5" (no numeral) is unaffected — canonical Esdras still linkifies normally', () => {
    const parsed = parseReference('Esd 1:5');
    expect(parsed).not.toBeNull();
    expect(parsed?.book.name).toBe('Esdras');
    expect(parsed?.chapter).toBe(1);
    expect(parsed?.verse).toBe(5);
  });

  it("a legitimate back-to-back citation is not corrupted by the previous reference's own trailing digit", () => {
    // Guards the boundary fix in extendMatchWithLeadingNumeral: the "5" in
    // "1 Cr 5" must not be reinterpreted as a leading numeral for the
    // "Esd 7:20" that immediately follows it with only a space between.
    const segs = linkifyReferences('1 Cr 5 Esd 7:20 fin');
    const cronicas = segs.find(s => s.ref?.book.name === '1 Crónicas');
    const esdras = segs.find(s => s.ref?.book.name === 'Esdras');
    expect(cronicas?.ref).toEqual({
      book: expect.objectContaining({name: '1 Crónicas'}),
      chapter: 5,
    });
    expect(esdras?.ref).toEqual(
      expect.objectContaining({chapter: 7, verse: 20}),
    );
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
            const verses = realVerseSet(book.name, chapter);
            if (verse === undefined) {
              // Whole-chapter ref: no verse to bound-check, but the chapter
              // itself must be real (previously unchecked — see Bug A in
              // the file header).
              if (verses === undefined || verses.size === 0) {
                falsePositives.push(
                  `[${entry.slug}] "${seg.text}" resolved but ${book.name} ${chapter} isn't a real chapter`,
                );
              }
              continue;
            }
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
