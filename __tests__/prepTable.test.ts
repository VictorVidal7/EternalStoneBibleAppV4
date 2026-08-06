import {
  normalizePassage,
  formatPassageKey,
  formatPassageLabel,
  buildPrepTable,
  PREP_SECTIONS,
  PREP_MAX_CROSS_REFS,
  PREP_MAX_CROSS_REFS_PREMIUM,
  ALL_PREP_SECTION_IDS,
  DEFAULT_PREP_TEMPLATE,
  PREP_TEMPLATE_IDS,
  PREP_TEMPLATES,
  getPrepTemplateSections,
  interpretationSlotFor,
} from '../src/features/study/prepTable';

describe('prepTable — "Mesa de preparación" pure assembly', () => {
  describe('normalizePassage', () => {
    it('resolves an English book name + single verse', () => {
      expect(normalizePassage('John', 3, 16)).toEqual({
        bookId: 43,
        bookNameEn: 'John',
        chapter: 3,
        startVerse: 16,
        endVerse: 16,
      });
    });

    it('resolves a Spanish book name to the English canonical', () => {
      const p = normalizePassage('Juan', 3, 16);
      expect(p?.bookNameEn).toBe('John');
      expect(p?.bookId).toBe(43);
    });

    it('keeps an ascending verse range', () => {
      const p = normalizePassage('John', 3, 16, 21);
      expect(p).toMatchObject({startVerse: 16, endVerse: 21});
    });

    it('swaps a reversed range (start > end)', () => {
      const p = normalizePassage('John', 3, 21, 16);
      expect(p).toMatchObject({startVerse: 16, endVerse: 21});
    });

    it('returns null for an unknown book', () => {
      expect(normalizePassage('Nephi', 1, 1)).toBeNull();
    });

    it('returns null when the chapter exceeds the book length', () => {
      // John has 21 chapters.
      expect(normalizePassage('John', 22, 1)).toBeNull();
      expect(normalizePassage('John', 0, 1)).toBeNull();
    });

    it('returns null for malformed verses', () => {
      expect(normalizePassage('John', 3, 0)).toBeNull();
      expect(normalizePassage('John', 3, NaN)).toBeNull();
      expect(normalizePassage('John', 3, 1, 0)).toBeNull();
    });
  });

  describe('formatPassageKey', () => {
    it('formats a single verse', () => {
      const p = normalizePassage('John', 3, 16)!;
      expect(formatPassageKey(p)).toBe('John/3/16');
    });

    it('formats a verse range', () => {
      const p = normalizePassage('John', 3, 16, 21)!;
      expect(formatPassageKey(p)).toBe('John/3/16-21');
    });
  });

  describe('buildPrepTable — gathers the curated helps for a real passage', () => {
    it('returns null for an invalid passage', () => {
      expect(buildPrepTable('Nephi', 1, 1)).toBeNull();
      expect(buildPrepTable('John', 99, 1)).toBeNull();
    });

    it('assembles cross-refs, Christ connections, themes and intro for John 3:16', () => {
      const table = buildPrepTable('John', 3, 16)!;
      expect(table.passageKey).toBe('John/3/16');
      // Curated cross-references of John 3:16.
      expect(table.crossRefs).toEqual(
        expect.arrayContaining(['Romans/5/8', '1 John/4/9']),
      );
      // "Cristo en este pasaje" connection for John 3:16.
      expect(table.christConnections.map(c => c.id)).toContain('john-3-16');
      // Topical themes John 3:16 speaks to.
      expect(table.themeIds).toEqual(
        expect.arrayContaining(['love', 'salvation']),
      );
      expect(table.hasBookIntro).toBe(true);
      expect(table.sections).toEqual(PREP_SECTIONS);
      expect(table.helpCount).toBeGreaterThan(0);
    });

    it('accepts a Spanish book name and yields the same English key', () => {
      const table = buildPrepTable('Juan', 3, 16)!;
      expect(table.bookNameEn).toBe('John');
      expect(table.passageKey).toBe('John/3/16');
    });

    it('unions cross-refs across a verse range and dedupes', () => {
      const table = buildPrepTable('John', 3, 16, 17)!;
      // v16 → Romans/5/8 …; v17 → John/12/47, Luke/19/10, 1 John/4/14.
      expect(table.crossRefs).toEqual(
        expect.arrayContaining(['Romans/5/8', 'Luke/19/10']),
      );
      // No duplicates.
      expect(new Set(table.crossRefs).size).toBe(table.crossRefs.length);
    });
  });

  describe('buildPrepTable — deterministic edge cases (injected cross-refs)', () => {
    it('drops a parallel that points back inside the passage', () => {
      const table = buildPrepTable('John', 3, 16, 18, {
        getCrossRefs: (_b, _c, v) =>
          v === 16 ? ['John/3/18', 'Romans/5/8'] : [],
      })!;
      // John/3/18 is inside 16-18, so it is dropped; the outside ref stays.
      expect(table.crossRefs).toEqual(['Romans/5/8']);
    });

    it('caps the gathered cross-refs at the default (free) cap', () => {
      const many = Array.from({length: 30}, (_, i) => `Psalms/1/${i + 1}`);
      const table = buildPrepTable('John', 3, 16, 16, {
        getCrossRefs: () => many,
      })!;
      expect(table.crossRefs).toHaveLength(PREP_MAX_CROSS_REFS);
      expect(PREP_MAX_CROSS_REFS).toBe(12);
    });

    // T8.4.2 — the caller (the screen) can raise the cap for a premium
    // reader; the pure module itself never decides who gets which cap.
    it('respects a caller-supplied maxCrossRefs above the default', () => {
      const many = Array.from({length: 50}, (_, i) => `Psalms/1/${i + 1}`);
      const table = buildPrepTable('John', 3, 16, 16, {
        getCrossRefs: () => many,
        maxCrossRefs: PREP_MAX_CROSS_REFS_PREMIUM,
      })!;
      expect(table.crossRefs).toHaveLength(PREP_MAX_CROSS_REFS_PREMIUM);
      expect(PREP_MAX_CROSS_REFS_PREMIUM).toBeGreaterThan(PREP_MAX_CROSS_REFS);
    });

    it('respects a caller-supplied maxCrossRefs below the default too', () => {
      const many = Array.from({length: 30}, (_, i) => `Psalms/1/${i + 1}`);
      const table = buildPrepTable('John', 3, 16, 16, {
        getCrossRefs: () => many,
        maxCrossRefs: 3,
      })!;
      expect(table.crossRefs).toHaveLength(3);
    });

    it('falls back to the default cap when maxCrossRefs is omitted', () => {
      const many = Array.from({length: 30}, (_, i) => `Psalms/1/${i + 1}`);
      const table = buildPrepTable('John', 3, 16, 16, {
        getCrossRefs: () => many,
      })!;
      expect(table.crossRefs).toHaveLength(12);
    });

    it('survives a getCrossRefs that returns junk', () => {
      const table = buildPrepTable('John', 3, 16, 16, {
        // @ts-expect-error — exercise the defensive non-string guard.
        getCrossRefs: () => [null, 42, 'Romans/5/8'],
      })!;
      expect(table.crossRefs).toEqual(['Romans/5/8']);
    });
  });

  describe('formatPassageLabel', () => {
    const table = buildPrepTable('John', 3, 16, 21)!;

    it('labels a range in Spanish', () => {
      expect(formatPassageLabel(table, 'es')).toBe('Juan 3:16-21');
    });

    it('labels a range in English', () => {
      expect(formatPassageLabel(table, 'en')).toBe('John 3:16-21');
    });

    it('labels a single verse', () => {
      const one = buildPrepTable('John', 3, 16)!;
      expect(formatPassageLabel(one, 'es')).toBe('Juan 3:16');
    });
  });
});

// Tanda "plantillas de sermón" — the 4 homiletic templates + resolution
// helpers. `expository` is PREP_SECTIONS unchanged; the other 3 are additive.
describe('prepTable — sermon-prep templates', () => {
  it('defaults to expository', () => {
    expect(DEFAULT_PREP_TEMPLATE).toBe('expository');
  });

  it("'expository' is exactly PREP_SECTIONS, unchanged", () => {
    expect(PREP_TEMPLATES.expository).toEqual(PREP_SECTIONS);
  });

  it("'textual' walks the text verse-by-verse instead of two separate observation/interpretation passes", () => {
    expect(PREP_TEMPLATES.textual).toEqual([
      'context',
      'versePoints',
      'bigIdea',
      'christ',
      'application',
      'questions',
    ]);
  });

  it("'topical' replaces the single-passage walk with a topic's development", () => {
    expect(PREP_TEMPLATES.topical).toEqual([
      'context',
      'topicDevelopment',
      'bigIdea',
      'christ',
      'application',
      'questions',
    ]);
  });

  it("'narrative' adds tension/resolution beats for a story passage", () => {
    expect(PREP_TEMPLATES.narrative).toEqual([
      'context',
      'observation',
      'tension',
      'resolution',
      'bigIdea',
      'christ',
      'application',
      'questions',
    ]);
  });

  it('every template keeps bigIdea, christ, application and questions — the Christ-centred ethos', () => {
    for (const id of PREP_TEMPLATE_IDS) {
      const sections = PREP_TEMPLATES[id];
      expect(sections).toEqual(
        expect.arrayContaining([
          'bigIdea',
          'christ',
          'application',
          'questions',
        ]),
      );
    }
  });

  describe('getPrepTemplateSections', () => {
    it('resolves each known template id to its own list', () => {
      for (const id of PREP_TEMPLATE_IDS) {
        expect(getPrepTemplateSections(id)).toEqual(PREP_TEMPLATES[id]);
      }
    });

    it('falls back to expository for null/undefined (legacy entries)', () => {
      expect(getPrepTemplateSections(undefined)).toEqual(PREP_SECTIONS);
      expect(getPrepTemplateSections(null)).toEqual(PREP_SECTIONS);
    });

    it('falls back to expository for an unrecognized id (defensive)', () => {
      // @ts-expect-error — exercise the defensive fallback for a corrupt/future id.
      expect(getPrepTemplateSections('made-up-template')).toEqual(
        PREP_SECTIONS,
      );
    });
  });

  describe('interpretationSlotFor', () => {
    it('maps every template to the id that carries cross-ref/theme helps', () => {
      expect(interpretationSlotFor('expository')).toBe('interpretation');
      expect(interpretationSlotFor('textual')).toBe('versePoints');
      expect(interpretationSlotFor('topical')).toBe('topicDevelopment');
      expect(interpretationSlotFor('narrative')).toBe('resolution');
    });

    it('falls back to interpretation for null/undefined/unrecognized', () => {
      expect(interpretationSlotFor(undefined)).toBe('interpretation');
      expect(interpretationSlotFor(null)).toBe('interpretation');
    });
  });

  it('ALL_PREP_SECTION_IDS covers every id used by every template exactly once', () => {
    const union = new Set<string>();
    for (const id of PREP_TEMPLATE_IDS) {
      for (const section of PREP_TEMPLATES[id]) union.add(section);
    }
    expect(new Set(ALL_PREP_SECTION_IDS)).toEqual(union);
    // No duplicates.
    expect(new Set(ALL_PREP_SECTION_IDS).size).toBe(
      ALL_PREP_SECTION_IDS.length,
    );
  });
});
