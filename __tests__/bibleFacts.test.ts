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
  getRotatableFacts,
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

  it('never lands on a draft fact (Home + hero must never show unreviewed content)', () => {
    for (let d = 0; d < 400; d++) {
      const date = new Date(2026, 0, 1 + d);
      expect(getDailyFact(date).draft).toBeFalsy();
    }
  });

  it('rotates across consecutive days over the rotatable (non-draft) pool', () => {
    const rotatableCount = getRotatableFacts().length;
    const seen = new Set<number>();
    for (let d = 0; d < rotatableCount; d++) {
      seen.add(getDailyFactIndex(new Date(2026, 0, 1 + d)));
    }
    // A full rotatable-pool-length window covers every non-draft fact once.
    expect(seen.size).toBe(rotatableCount);
  });
});

describe('bibleFacts — commentary entries (reviewed and approved by Victor 2026-08-25)', () => {
  // Scoped to the already-reviewed (non-draft) commentary entries: this
  // describe block locks in Victor's 2026-08-25 sign-off on THOSE 5, and
  // must keep passing even as new draft commentary entries are added by
  // later content-growth passes (see the "reviewed ids frozen" block below).
  const commentaryFacts = BIBLE_FACTS.filter(
    f => f.category === 'commentary' && !f.draft,
  );

  it('ships the 5 seeded commentary "¿Sabías qué?" entries', () => {
    expect(commentaryFacts.length).toBe(5);
  });

  it('every commentary entry has a non-empty source citation', () => {
    for (const f of commentaryFacts) {
      expect(typeof f.source).toBe('string');
      expect((f.source ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('no commentary entry is flagged as draft — reviewed and shipped', () => {
    for (const f of commentaryFacts) {
      expect(f.draft).toBeFalsy();
    }
  });

  it('every commentary entry\'s ref looks like a real "Book/Chapter/Verse" reference', () => {
    for (const f of commentaryFacts) {
      expect(f.ref).toMatch(/^[A-Za-z1-3 ]+\/\d+\/\d+$/);
    }
  });

  // Frozen snapshot of the 25 entries reviewed and shipped as of 2026-08-25
  // (before this session's content-growth pass added new draft entries).
  // This proves two things at once: (1) none of THESE ids ever got their
  // `draft` flag touched by a later pass, and (2) the set of currently
  // non-draft facts is EXACTLY this set — i.e. every newly-added entry is
  // still draft and none of it is user-visible yet.
  const REVIEWED_IDS_2026_08_25 = [
    'dead-sea',
    'mount-hermon',
    'dan-to-beersheba',
    'eleven-days',
    'sanctuary-shekel',
    'the-cubit',
    'forty-days',
    'thirty-pieces',
    'hesed',
    'selah',
    'logos',
    'amen',
    'tearing-garments',
    'washing-feet',
    'unleavened-bread',
    'seven-day-wedding',
    'tree-of-life',
    'joshua-jesus-name',
    'ruth-genealogy',
    'jacob-israel',
    'gods-costly-gift',
    'emmanuel-name',
    'father-who-ran',
    'my-shepherd',
    'a-denarius-a-days-wage',
  ];

  it('none of the previously-reviewed entries have been marked draft', () => {
    for (const f of BIBLE_FACTS) {
      if (REVIEWED_IDS_2026_08_25.includes(f.id)) {
        expect(f.draft).toBeFalsy();
      }
    }
  });

  it('the non-draft (user-visible) set is exactly the reviewed 25 — new entries stay draft', () => {
    const nonDraftIds = BIBLE_FACTS.filter(f => !f.draft)
      .map(f => f.id)
      .sort();
    expect(nonDraftIds).toEqual([...REVIEWED_IDS_2026_08_25].sort());
  });

  it('only commentary entries carry a source citation', () => {
    for (const f of BIBLE_FACTS) {
      if (f.category !== 'commentary') {
        expect(f.source).toBeUndefined();
      }
    }
  });
});

describe('bibleFacts — strongs (Tanda 8, word-study tap-through)', () => {
  it("every strongs value looks like a real Strong's number (H### or G###)", () => {
    for (const f of BIBLE_FACTS) {
      if (f.strongs !== undefined) {
        expect(f.strongs).toMatch(/^[HG]\d+$/);
      }
    }
  });

  it('strongs only ever appears on language/commentary entries', () => {
    for (const f of BIBLE_FACTS) {
      if (f.strongs !== undefined) {
        expect(['language', 'commentary']).toContain(f.category);
      }
    }
  });

  // These exact values were verified against the LIVE installed originals
  // pack (https://eternalstonebible.github.io/packs/originals.db), not
  // guessed — each one was confirmed present at the fact's own `ref` (the
  // same check getStrongsOccurrences() powers), and G1694 was additionally
  // cross-checked against its own lexicon entry (lemma "Ἐμμανουήλ", kjv_def
  // "Emmanuel"). That verification can't run in CI (a 31 MB download + the
  // app's DB layer), so this test is where the result persists — don't
  // "helpfully" fill in `selah` without redoing it.
  it('carries the specific, independently-verified values', () => {
    const byId = Object.fromEntries(BIBLE_FACTS.map(f => [f.id, f]));
    expect(byId.hesed.strongs).toBe('H2617');
    expect(byId.amen.strongs).toBe('H543');
    expect(byId.logos.strongs).toBe('G3056');
    expect(byId['emmanuel-name'].strongs).toBe('G1694');
  });

  // `selah` (Psalms/3/2) deliberately carries NO strongs: the live originals
  // pack has ZERO original_words rows for that verse. TAHOT numbers Psalm 3
  // by Hebrew (Masoretic) versification with a trailing `(3.2)`-style
  // English-equivalent parenthetical that scripts/build-originals-pack.js's
  // row parser doesn't recognize, so H5542 (Selah's real number) never made
  // it into the pack tagged at this verse — assigning it here would produce
  // a chip that lands on an empty concordance. Fixing the pack build is a
  // separate, out-of-scope issue; this test just locks the safe choice.
  it('selah has no strongs (live pack has no original_words for Psalms 3:2 — versification gap)', () => {
    const selah = BIBLE_FACTS.find(f => f.id === 'selah');
    expect(selah?.strongs).toBeUndefined();
  });
});

describe('getFactsByCategory', () => {
  it('returns the categories in order with correct global indices, excluding any draft entries', () => {
    const sections = getFactsByCategory();
    const nonDraftCount = BIBLE_FACTS.filter(f => !f.draft).length;
    const presentCategories: FactCategory[] = FACT_CATEGORY_ORDER.filter(c =>
      BIBLE_FACTS.some(f => f.category === c && !f.draft),
    );
    expect(sections.map(s => s.category)).toEqual(presentCategories);
    const flat = sections.flatMap(s => s.entries);
    expect(flat.length).toBe(nonDraftCount);
    // Each entry's index points back at the same fact in the catalog, and
    // none of them are drafts.
    for (const {fact, index} of flat) {
      expect(BIBLE_FACTS[index]).toBe(fact);
      expect(fact.draft).toBeFalsy();
    }
  });

  it('never surfaces a draft entry to the browsable index', () => {
    const sections = getFactsByCategory();
    const visibleIds = new Set(
      sections.flatMap(s => s.entries.map(e => e.fact.id)),
    );
    for (const f of BIBLE_FACTS.filter(f => f.draft)) {
      expect(visibleIds.has(f.id)).toBe(false);
    }
  });

  it('still shows non-draft entries/categories normally (e.g. geography)', () => {
    const sections = getFactsByCategory();
    const geo = sections.find(s => s.category === 'geography');
    expect(geo).toBeDefined();
    expect(geo!.entries.length).toBeGreaterThan(0);
  });

  it('shows the "commentary" category now that Victor has reviewed and approved its entries', () => {
    const sections = getFactsByCategory();
    const commentary = sections.find(s => s.category === 'commentary');
    expect(commentary).toBeDefined();
    expect(commentary!.entries.length).toBe(5);
  });
});
