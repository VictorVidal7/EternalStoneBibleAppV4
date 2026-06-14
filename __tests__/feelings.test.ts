import {
  FEELINGS,
  getAllFeelings,
  getFeeling,
  isBrightFeeling,
  feelingVerseRefForDay,
} from '../src/features/study/feelings';
import {BIBLE_THEMES, parseThemeRef} from '../src/features/study/themes';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

describe('feelings — emotional check-in taxonomy', () => {
  describe('taxonomy shape', () => {
    it('ships a meaningful set of feelings', () => {
      expect(FEELINGS.length).toBeGreaterThanOrEqual(10);
    });

    it('has unique feeling ids', () => {
      const ids = FEELINGS.map(f => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every feeling has an icon, a hex accent and at least 4 verses', () => {
      for (const feeling of FEELINGS) {
        expect(feeling.icon).toBeTruthy();
        expect(feeling.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(feeling.verseRefs.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('has no duplicate refs within a single feeling', () => {
      for (const feeling of FEELINGS) {
        expect(new Set(feeling.verseRefs).size).toBe(feeling.verseRefs.length);
      }
    });
  });

  describe('every curated reference is real', () => {
    // A typo'd ref fails CI rather than shipping a dead row: each ref must
    // parse AND resolve to a canonical book within its chapter range.
    it('resolves every ref to a canonical book within its chapter range', () => {
      const bad: string[] = [];
      for (const feeling of FEELINGS) {
        for (const ref of feeling.verseRefs) {
          const parsed = parseThemeRef(ref);
          if (!parsed) {
            bad.push(`${feeling.id}: unparseable "${ref}"`);
            continue;
          }
          const book = getBookByName(parsed.book);
          if (!book) {
            bad.push(
              `${feeling.id}: unknown book "${parsed.book}" in "${ref}"`,
            );
            continue;
          }
          if (book.nameEn !== parsed.book) {
            bad.push(
              `${feeling.id}: non-canonical book "${parsed.book}" (expected "${book.nameEn}")`,
            );
          }
          if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
            bad.push(
              `${feeling.id}: chapter ${parsed.chapter} out of range for ${book.nameEn} (1-${book.chapters})`,
            );
          }
        }
      }
      expect(bad).toEqual([]);
    });
  });

  describe('the related-theme doorway is real', () => {
    it('every relatedThemeId resolves to an existing theme', () => {
      const themeIds = new Set(BIBLE_THEMES.map(t => t.id));
      for (const feeling of FEELINGS) {
        expect(themeIds.has(feeling.relatedThemeId)).toBe(true);
      }
    });
  });

  describe('i18n completeness', () => {
    type FeelingEntry = {name: string; description: string; prayer: string};

    it.each(['es', 'en'] as const)(
      'every feeling has a %s name, description and prayer',
      lang => {
        const list = translations[lang].feelings.list as Record<
          string,
          FeelingEntry
        >;
        for (const feeling of FEELINGS) {
          const entry = list[feeling.id];
          expect(entry?.name).toBeTruthy();
          expect(entry?.description).toBeTruthy();
          expect(entry?.prayer).toBeTruthy();
        }
      },
    );
  });

  describe('getFeeling / getAllFeelings', () => {
    it('returns a feeling by id', () => {
      expect(getFeeling('anxious')?.id).toBe('anxious');
      expect(getFeeling('anxious')?.relatedThemeId).toBe('peace');
    });

    it('returns null for an unknown or empty id', () => {
      expect(getFeeling('nope')).toBeNull();
      expect(getFeeling('')).toBeNull();
      expect(getFeeling(null)).toBeNull();
      expect(getFeeling(undefined)).toBeNull();
    });

    it('getAllFeelings returns the full taxonomy', () => {
      expect(getAllFeelings()).toBe(FEELINGS);
    });
  });

  describe('isBrightFeeling (Sprint 83 valence)', () => {
    it('marks the brighter feelings and not the heavier ones', () => {
      expect(isBrightFeeling('grateful')).toBe(true);
      expect(isBrightFeeling('hopeful')).toBe(true);
      expect(isBrightFeeling('joyful')).toBe(true);
      expect(isBrightFeeling('anxious')).toBe(false);
      expect(isBrightFeeling('sad')).toBe(false);
      expect(isBrightFeeling('nope')).toBe(false);
    });
  });

  describe('feelingVerseRefForDay (Sprint 83 guided devotion)', () => {
    const grateful = getFeeling('grateful')!;

    it('is deterministic for the same feeling + day', () => {
      const a = feelingVerseRefForDay(grateful, '2026-06-14');
      const b = feelingVerseRefForDay(grateful, '2026-06-14');
      expect(a).toBe(b);
      expect(grateful.verseRefs).toContain(a!);
    });

    it('rotates across days (not always the same ref)', () => {
      const refs = new Set(
        ['2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17'].map(d =>
          feelingVerseRefForDay(grateful, d),
        ),
      );
      expect(refs.size).toBeGreaterThan(1);
    });

    it('returns null when a feeling has no refs', () => {
      expect(
        feelingVerseRefForDay({...grateful, verseRefs: []}, '2026-06-14'),
      ).toBeNull();
    });
  });
});
