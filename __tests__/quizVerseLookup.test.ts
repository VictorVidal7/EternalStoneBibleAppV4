/**
 * T18b — quiz → memorization bridge fidelity.
 *
 * `resolveVerseForAddCard` must return the EXACT embedded-Bible text for a real
 * refKey + reading version, shaped for MemoryDeckContext.addCard, and must
 * return `null` (never throw) for a bad refKey or an out-of-range verse.
 *
 * Fidelity source = the bundled RVR1960_DATA / WEB_DATA seed arrays — the same
 * arrays quizBank.test.ts trusts as ground truth (node:sqlite against
 * assets/bible-seed.db is gated behind Node >= 22.5, but CI pins Node 20, so
 * the DB-backed tests skip; the seed arrays ARE what bible-seed.db is built
 * from). We back a fake `bibleDB.getVerse` with those arrays — keyed by
 * `book_id` exactly like the real SQL `WHERE book_id = ?` — then assert the
 * resolved text against an INDEPENDENT lookup: the expected book_id is derived
 * from WEB_DATA's own English `book_name`, NOT from the module's getBookByName
 * path, so a wrong book-id computation cannot pass silently.
 */
import {WEB_DATA} from '../src/lib/database/bible-data-web';
import {RVR1960_DATA} from '../src/lib/database/bible-data-rvr1960';

jest.mock('@/lib/database', () => {
  // Inline row types only — babel's jest.mock hoist check forbids referencing
  // any named (out-of-scope) identifier, including TS type aliases, inside the
  // factory.
  const web = require('../src/lib/database/bible-data-web').WEB_DATA as {
    book_id: number;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }[];
  const rvr = require('../src/lib/database/bible-data-rvr1960')
    .RVR1960_DATA as {
    book_id: number;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }[];
  const index = (rows: typeof web): Map<string, (typeof web)[number]> => {
    const m = new Map<string, (typeof web)[number]>();
    for (const r of rows) m.set(`${r.book_id}|${r.chapter}|${r.verse}`, r);
    return m;
  };
  const webIdx = index(web);
  const rvrIdx = index(rvr);
  return {
    bibleDB: {
      initialize: jest.fn(async () => undefined),
      // Mirrors the real getVerse: keyed by book_id, returns book_name as
      // `book`, or null when the row is absent.
      getVerse: jest.fn(
        async (
          bookId: number,
          chapter: number,
          verse: number,
          version: string,
        ) => {
          const m = String(version).toUpperCase() === 'WEB' ? webIdx : rvrIdx;
          const r = m.get(`${bookId}|${chapter}|${verse}`);
          if (!r) return null;
          return {
            id: 0,
            bookNumber: r.book_id,
            book: r.book_name,
            chapter: r.chapter,
            verse: r.verse,
            text: r.text,
            version,
          };
        },
      ),
    },
  };
});

import {
  resolveVerseForAddCard,
  refKeyToVerseKey,
} from '../src/features/quiz/quizVerseLookup';

// Real refKeys copied straight from src/features/quiz/quizBank.ts.
const REF_KEYS = [
  'John/3/16',
  'Genesis/1/1',
  'Philippians/4/13',
  'Psalms/23/1',
];

/** English-name lookup into WEB_DATA — independent of the module's book-id path. */
function webRow(bookEn: string, chapter: number, verse: number) {
  return WEB_DATA.find(
    r => r.book_name === bookEn && r.chapter === chapter && r.verse === verse,
  );
}

describe('resolveVerseForAddCard — verbatim embedded-Bible text', () => {
  it.each(REF_KEYS)(
    '%s resolves to the exact WEB and RVR1960 seed text, shaped for addCard',
    async refKey => {
      const [bookEn, chStr, vStr] = refKey.split('/');
      const chapter = Number(chStr);
      const verse = Number(vStr);

      // Independent oracle: find the verse in the WEB seed by its English book
      // name, then use that row's numeric book_id to find the RVR1960 seed row.
      const wr = webRow(bookEn, chapter, verse);
      expect(wr).toBeDefined();
      const rr = RVR1960_DATA.find(
        r =>
          r.book_id === wr!.book_id &&
          r.chapter === chapter &&
          r.verse === verse,
      );
      expect(rr).toBeDefined();

      // English reading version → English text, English canonical book name.
      const en = await resolveVerseForAddCard(refKey, 'WEB');
      expect(en).toEqual({
        bookName: bookEn,
        chapter,
        verse,
        text: wr!.text,
        version: 'WEB',
      });

      // Spanish reading version → Spanish text, but the STORED book name stays
      // the English canonical identity (language-independent verseKey).
      const es = await resolveVerseForAddCard(refKey, 'RVR1960');
      expect(es).toEqual({
        bookName: bookEn,
        chapter,
        verse,
        text: rr!.text,
        version: 'RVR1960',
      });
      // Sanity: the two versions really do carry different verse text.
      expect(es!.text).not.toBe(en!.text);
    },
  );
});

describe('refKeyToVerseKey — same identity resolveVerseForAddCard stores', () => {
  it.each(REF_KEYS)(
    '%s produces "EnglishBook/chapter/verse", matching the bookName resolveVerseForAddCard returns',
    async refKey => {
      const key = refKeyToVerseKey(refKey);
      expect(key).not.toBeNull();

      const resolved = await resolveVerseForAddCard(refKey, 'WEB');
      expect(resolved).not.toBeNull();
      expect(key).toBe(
        `${resolved!.bookName}/${resolved!.chapter}/${resolved!.verse}`,
      );
    },
  );

  it('returns null for an unparseable or unknown-book refKey, same as resolveVerseForAddCard', () => {
    expect(refKeyToVerseKey('not-a-ref')).toBeNull();
    expect(refKeyToVerseKey('Hesperus/1/1')).toBeNull();
  });
});

describe('resolveVerseForAddCard — resolves null cleanly, never throws', () => {
  it('returns null for an unparseable refKey', async () => {
    await expect(
      resolveVerseForAddCard('not-a-ref', 'WEB'),
    ).resolves.toBeNull();
  });

  it('returns null for an unknown book name', async () => {
    await expect(
      resolveVerseForAddCard('Hesperus/1/1', 'WEB'),
    ).resolves.toBeNull();
  });

  it('returns null for a real book but an out-of-range verse', async () => {
    await expect(
      resolveVerseForAddCard('John/999/999', 'WEB'),
    ).resolves.toBeNull();
  });
});
