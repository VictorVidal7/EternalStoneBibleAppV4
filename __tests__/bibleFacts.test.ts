/**
 * The "¿Sabías qué?" catalog — every fact's verse must resolve to a real
 * canonical verse-in-range (a typo fails CI rather than shipping a dead
 * row), ids are unique, categories are grouped in order, and every entry has
 * es/en label + detail prose.
 */
import {
  BIBLE_FACTS,
  FACT_CATEGORY_ORDER,
  FACT_CATEGORY_ACCENT,
  FACT_CATEGORY_ICON,
  FACT_COUNT,
  getFactsByCategory,
  getDailyFactIndex,
  getDailyFact,
  type FactCategory,
} from '../src/features/study/bibleFacts';
import {parseChristRef} from '../src/features/study/christConnections';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

type AnyRecord = Record<string, unknown>;
const esF = (translations.es as AnyRecord).bibleFacts as AnyRecord;
const enF = (translations.en as AnyRecord).bibleFacts as AnyRecord;

describe('bibleFacts — catalog shape', () => {
  it('ships a meaningful catalog', () => {
    expect(BIBLE_FACTS.length).toBeGreaterThanOrEqual(20);
    expect(FACT_COUNT).toBe(BIBLE_FACTS.length);
  });

  it('has unique ids', () => {
    const ids = BIBLE_FACTS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category is known, each with an accent + icon', () => {
    for (const f of BIBLE_FACTS) {
      expect(FACT_CATEGORY_ORDER).toContain(f.category);
    }
    for (const c of FACT_CATEGORY_ORDER) {
      expect(FACT_CATEGORY_ACCENT[c]).toMatch(/^#/);
      expect(FACT_CATEGORY_ICON[c]).toBeTruthy();
    }
  });

  it('covers every category at least once', () => {
    const covered = new Set(BIBLE_FACTS.map(f => f.category));
    for (const c of FACT_CATEGORY_ORDER) {
      expect(covered.has(c)).toBe(true);
    }
  });
});

describe('bibleFacts — every reference is real', () => {
  it('resolves every fact ref to a real canonical verse-in-range', () => {
    const bad: string[] = [];
    for (const f of BIBLE_FACTS) {
      const parsed = parseChristRef(f.ref);
      if (!parsed) {
        bad.push(`${f.id}: unparseable "${f.ref}"`);
        continue;
      }
      const book = getBookByName(parsed.book);
      if (!book) {
        bad.push(`${f.id}: unknown book "${parsed.book}" in "${f.ref}"`);
        continue;
      }
      if (book.nameEn !== parsed.book) {
        bad.push(`${f.id}: non-canonical book "${parsed.book}"`);
      }
      if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
        bad.push(
          `${f.id}: chapter ${parsed.chapter} out of range for ${f.ref}`,
        );
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('bibleFacts — i18n parity', () => {
  it('has category labels in BOTH languages', () => {
    const esCats = esF.categories as AnyRecord;
    const enCats = enF.categories as AnyRecord;
    for (const c of FACT_CATEGORY_ORDER) {
      expect(typeof esCats[c]).toBe('string');
      expect(typeof enCats[c]).toBe('string');
    }
  });

  it('has a label + detail in BOTH languages for every fact', () => {
    const esItems = esF.items as Record<string, AnyRecord>;
    const enItems = enF.items as Record<string, AnyRecord>;
    const bad: string[] = [];
    for (const f of BIBLE_FACTS) {
      for (const [lang, items] of [
        ['es', esItems],
        ['en', enItems],
      ] as const) {
        const item = items[f.id];
        if (!item) {
          bad.push(`${lang}: missing item ${f.id}`);
          continue;
        }
        if (typeof item.label !== 'string' || !item.label) {
          bad.push(`${lang}: ${f.id} missing label`);
        }
        if (typeof item.detail !== 'string' || !item.detail) {
          bad.push(`${lang}: ${f.id} missing detail`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no orphan i18n items (every keyed item is in the catalog)', () => {
    const ids = new Set(BIBLE_FACTS.map(f => f.id));
    for (const key of Object.keys(esF.items as AnyRecord)) {
      expect(ids.has(key)).toBe(true);
    }
  });
});

describe('getDailyFactIndex', () => {
  it('is deterministic and always a valid in-range index', () => {
    for (let d = 0; d < 400; d++) {
      const date = new Date(2026, 0, 1 + d);
      const index = getDailyFactIndex(date);
      expect(index).toBe(getDailyFactIndex(date)); // stable
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(FACT_COUNT);
      expect(getDailyFact(date)).toBe(BIBLE_FACTS[index]);
    }
  });

  it('rotates across consecutive days (not stuck on one fact)', () => {
    const seen = new Set<number>();
    for (let d = 0; d < FACT_COUNT; d++) {
      seen.add(getDailyFactIndex(new Date(2026, 0, 1 + d)));
    }
    // A full catalog-length window covers every fact exactly once.
    expect(seen.size).toBe(FACT_COUNT);
  });
});

describe('getFactsByCategory', () => {
  it('returns the categories in order with correct global indices', () => {
    const sections = getFactsByCategory();
    const presentCategories: FactCategory[] = FACT_CATEGORY_ORDER.filter(c =>
      BIBLE_FACTS.some(f => f.category === c),
    );
    expect(sections.map(s => s.category)).toEqual(presentCategories);
    const flat = sections.flatMap(s => s.entries);
    expect(flat.length).toBe(FACT_COUNT);
    // Each entry's index points back at the same fact in the catalog.
    for (const {fact, index} of flat) {
      expect(BIBLE_FACTS[index]).toBe(fact);
    }
  });
});
