/**
 * The "Teología" catalog (see `src/features/study/theology.ts`'s file
 * comment). Mirrors `bibleFacts.test.ts` / `christConnections.test.ts`'s
 * shape: every anchor ref must resolve to a real canonical verse-in-range,
 * ids are unique, and every entry has a non-empty title/body/passage
 * citation in BOTH locales.
 */
import {
  THEOLOGY_ENTRIES,
  THEOLOGY_COUNT,
  getTheologyEntryById,
  getPublishedTheologyEntries,
} from '../src/features/study/theology';
import {parseChristRef} from '../src/features/study/christConnections';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

type AnyRecord = Record<string, unknown>;
const esT = (translations.es as AnyRecord).theology as AnyRecord;
const enT = (translations.en as AnyRecord).theology as AnyRecord;

// Every entry Victor has actually reviewed and approved so far. The
// original 3 (Trinidad/Salvación por gracia/Resurrección) were approved
// 2026-07-29 (`2d10c82`); the 15 "atributos de Dios" entries were approved
// 2026-08-27 after an advisor pass caught and fixed 8 unverified EN quotes
// plus a simplicity-doctrine overreach in 'unity'. Frozen the same way
// bibleFacts.test.ts freezes its reviewed-ids list: proves (1) none of
// THESE ids have had their `draft` flag touched by a later growth pass, and
// (2) the published set only grows when Victor actually reviews an entry —
// a newly-added entry defaults to draft and stays invisible to real users
// until it's added here too.
const REVIEWED_IDS = [
  'trinity',
  'grace-salvation',
  'resurrection',
  'self-existence',
  'eternity',
  'immutability',
  'omnipresence',
  'omniscience',
  'omnipotence',
  'unity',
  'love',
  'holiness',
  'justice',
  'mercy-grace',
  'faithfulness',
  'goodness',
  'wisdom',
  'patience',
] as const;

describe('theology — catalog shape', () => {
  it('ships at least every reviewed entry (plus any pending growth-pass drafts)', () => {
    expect(THEOLOGY_ENTRIES.length).toBeGreaterThanOrEqual(REVIEWED_IDS.length);
    expect(THEOLOGY_COUNT).toBe(THEOLOGY_ENTRIES.length);
  });

  it('has unique ids', () => {
    const ids = THEOLOGY_ENTRIES.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has at least one ref, an icon and an accent hex', () => {
    for (const e of THEOLOGY_ENTRIES) {
      expect(e.refs.length).toBeGreaterThan(0);
      expect(e.icon).toBeTruthy();
      expect(e.accent).toMatch(/^#/);
    }
  });

  it('none of the originally-reviewed entries have been marked draft', () => {
    for (const id of REVIEWED_IDS) {
      expect(getTheologyEntryById(id)?.draft).toBe(false);
    }
  });

  it('the published (user-visible) set is exactly the reviewed ids — new entries stay draft', () => {
    const publishedIds = getPublishedTheologyEntries()
      .map(e => e.id)
      .sort();
    expect(publishedIds).toEqual([...REVIEWED_IDS].sort());
  });

  it('getPublishedTheologyEntries never returns a draft entry', () => {
    for (const e of getPublishedTheologyEntries()) {
      expect(e.draft).toBe(false);
    }
  });
});

describe('theology — every anchor ref is real', () => {
  it('resolves every ref to a real canonical verse-in-range', () => {
    const bad: string[] = [];
    for (const e of THEOLOGY_ENTRIES) {
      for (const ref of e.refs) {
        const parsed = parseChristRef(ref);
        if (!parsed) {
          bad.push(`${e.id}: unparseable "${ref}"`);
          continue;
        }
        const book = getBookByName(parsed.book);
        if (!book) {
          bad.push(`${e.id}: unknown book "${parsed.book}" in "${ref}"`);
          continue;
        }
        if (book.nameEn !== parsed.book) {
          bad.push(`${e.id}: non-canonical book "${parsed.book}"`);
        }
        if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
          bad.push(
            `${e.id}: chapter ${parsed.chapter} out of range for ${ref}`,
          );
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('theology — i18n parity', () => {
  it('has a title, topic, body and passage citation in BOTH languages', () => {
    const esItems = esT.items as Record<string, AnyRecord>;
    const enItems = enT.items as Record<string, AnyRecord>;
    const bad: string[] = [];
    for (const e of THEOLOGY_ENTRIES) {
      for (const [lang, items] of [
        ['es', esItems],
        ['en', enItems],
      ] as const) {
        const item = items[e.id];
        if (!item) {
          bad.push(`${lang}: missing item ${e.id}`);
          continue;
        }
        for (const field of ['title', 'topic', 'body', 'passage'] as const) {
          if (typeof item[field] !== 'string' || !(item[field] as string)) {
            bad.push(`${lang}: ${e.id} missing ${field}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no orphan i18n items (every keyed item is in the catalog)', () => {
    const ids = new Set(THEOLOGY_ENTRIES.map(e => e.id));
    for (const key of Object.keys(esT.items as AnyRecord)) {
      expect(ids.has(key)).toBe(true);
    }
  });

  it('exposes the hub chrome strings (cardTitle/title/subtitle/browseHint) in both locales', () => {
    for (const block of [esT, enT]) {
      for (const key of [
        'cardTitle',
        'cardSubtitle',
        'title',
        'subtitle',
        'browseHint',
        'openInReader',
      ] as const) {
        expect(typeof block[key]).toBe('string');
        expect((block[key] as string).length).toBeGreaterThan(0);
      }
    }
  });

  it("every entry's passage citation looks like a real reference (book + chapter:verse)", () => {
    const esItems = esT.items as Record<string, AnyRecord>;
    for (const e of THEOLOGY_ENTRIES) {
      const passage = esItems[e.id]?.passage as string;
      expect(passage).toMatch(/\d+:\d+/);
    }
  });
});

describe('getTheologyEntryById', () => {
  it('finds a curated entry by id', () => {
    expect(getTheologyEntryById('trinity')?.id).toBe('trinity');
  });

  it('returns null for an unknown id', () => {
    expect(getTheologyEntryById('nope')).toBeNull();
  });
});
