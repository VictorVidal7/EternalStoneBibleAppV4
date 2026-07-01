/**
 * The "Orar la Escritura" catalog — every verse of every passage must resolve
 * to a real canonical verse-in-range (a typo fails CI rather than shipping a
 * dead step), ids are unique, categories are grouped in order, and every
 * passage + category has an es/en title.
 */
import {
  SCRIPTURE_PRAYERS,
  SCRIPTURE_PRAYER_CATEGORY_ORDER,
  getScripturePrayersByCategory,
  getScripturePrayerById,
  type ScripturePrayerCategory,
} from '../src/features/prayer/scripturePrayers';
import {parseChristRef} from '../src/features/study/christConnections';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

type AnyRecord = Record<string, unknown>;
const esS = (translations.es as AnyRecord).scripturePrayer as AnyRecord;
const enS = (translations.en as AnyRecord).scripturePrayer as AnyRecord;

describe('scripturePrayers — catalog shape', () => {
  it('ships several passages with at least one verse each', () => {
    expect(SCRIPTURE_PRAYERS.length).toBeGreaterThanOrEqual(10);
    for (const p of SCRIPTURE_PRAYERS) {
      expect(p.refs.length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = SCRIPTURE_PRAYERS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every passage belongs to a known category', () => {
    for (const p of SCRIPTURE_PRAYERS) {
      expect(SCRIPTURE_PRAYER_CATEGORY_ORDER).toContain(p.category);
    }
  });

  it('lists categories contiguously (each category is a single unbroken block)', () => {
    const seenOrder: ScripturePrayerCategory[] = [];
    for (const p of SCRIPTURE_PRAYERS) {
      if (seenOrder[seenOrder.length - 1] !== p.category) {
        seenOrder.push(p.category);
      }
    }
    expect(new Set(seenOrder).size).toBe(seenOrder.length);
    expect(seenOrder).toEqual(SCRIPTURE_PRAYER_CATEGORY_ORDER);
  });
});

describe('scripturePrayers — every reference is real', () => {
  it('resolves every verse of every passage to a canonical, in-range verse', () => {
    const bad: string[] = [];
    for (const p of SCRIPTURE_PRAYERS) {
      for (const ref of p.refs) {
        const parsed = parseChristRef(ref);
        if (!parsed) {
          bad.push(`${p.id}: unparseable "${ref}"`);
          continue;
        }
        const book = getBookByName(parsed.book);
        if (!book) {
          bad.push(`${p.id}: unknown book "${parsed.book}"`);
          continue;
        }
        if (book.nameEn !== parsed.book) {
          bad.push(`${p.id}: non-canonical book "${parsed.book}"`);
        }
        if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
          bad.push(`${p.id}: chapter ${parsed.chapter} out of range`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps each passage to a single book/chapter, verses in strict ascending order', () => {
    for (const p of SCRIPTURE_PRAYERS) {
      const parsedRefs = p.refs.map(r => parseChristRef(r)!);
      const [first] = parsedRefs;
      for (const parsed of parsedRefs) {
        expect(parsed.book).toBe(first.book);
        expect(parsed.chapter).toBe(first.chapter);
      }
      for (let i = 1; i < parsedRefs.length; i++) {
        expect(parsedRefs[i].verse).toBe(parsedRefs[i - 1].verse + 1);
      }
    }
  });
});

describe('scripturePrayers — i18n parity', () => {
  it('has a disclaimer in both languages', () => {
    const esDisclaimer = esS.disclaimer as string;
    const enDisclaimer = enS.disclaimer as string;
    expect(typeof esDisclaimer).toBe('string');
    expect(esDisclaimer.length).toBeGreaterThan(0);
    expect(typeof enDisclaimer).toBe('string');
    expect(enDisclaimer.length).toBeGreaterThan(0);
  });

  it('has a title in both languages for every category', () => {
    const esCategories = esS.categories as Record<string, string>;
    const enCategories = enS.categories as Record<string, string>;
    for (const c of SCRIPTURE_PRAYER_CATEGORY_ORDER) {
      expect(typeof esCategories[c]).toBe('string');
      expect(esCategories[c].length).toBeGreaterThan(0);
      expect(typeof enCategories[c]).toBe('string');
      expect(enCategories[c].length).toBeGreaterThan(0);
    }
  });

  it('has a title + context in BOTH languages for every passage', () => {
    const esPassages = esS.passages as Record<string, AnyRecord>;
    const enPassages = enS.passages as Record<string, AnyRecord>;
    const bad: string[] = [];
    for (const p of SCRIPTURE_PRAYERS) {
      for (const [lang, passages] of [
        ['es', esPassages],
        ['en', enPassages],
      ] as const) {
        const passage = passages[p.id];
        if (!passage) {
          bad.push(`${lang}: missing passage ${p.id}`);
          continue;
        }
        if (typeof passage.title !== 'string' || !passage.title) {
          bad.push(`${lang}: ${p.id} missing title`);
        }
        if (typeof passage.context !== 'string' || !passage.context) {
          bad.push(`${lang}: ${p.id} missing context`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no orphan i18n passages (every keyed entry is in the catalog)', () => {
    const ids = new Set(SCRIPTURE_PRAYERS.map(p => p.id));
    for (const key of Object.keys(esS.passages as AnyRecord)) {
      expect(ids.has(key)).toBe(true);
    }
  });
});

describe('getScripturePrayersByCategory / getScripturePrayerById', () => {
  it("returns only that category's passages, in catalog order", () => {
    for (const category of SCRIPTURE_PRAYER_CATEGORY_ORDER) {
      const passages = getScripturePrayersByCategory(category);
      expect(passages.every(p => p.category === category)).toBe(true);
      expect(passages).toEqual(
        SCRIPTURE_PRAYERS.filter(p => p.category === category),
      );
    }
  });

  it('finds a known passage by id and returns undefined for an unknown one', () => {
    expect(getScripturePrayerById('lords-prayer')?.category).toBe('jesus');
    expect(getScripturePrayerById('not-a-real-id')).toBeUndefined();
  });
});
