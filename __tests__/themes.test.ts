import {
  BIBLE_THEMES,
  getAllThemes,
  getTheme,
  parseThemeRef,
} from '../src/features/study/themes';
import {getBookByName} from '../src/constants/bible';

describe('themes — topical index for Explore by Theme', () => {
  describe('taxonomy shape', () => {
    it('ships a meaningful set of themes', () => {
      expect(BIBLE_THEMES.length).toBeGreaterThanOrEqual(12);
    });

    it('has unique theme ids', () => {
      const ids = BIBLE_THEMES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every theme has an icon, a hex accent and at least 4 verses', () => {
      for (const theme of BIBLE_THEMES) {
        expect(theme.icon).toBeTruthy();
        expect(theme.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.verseRefs.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('has no duplicate refs within a single theme', () => {
      for (const theme of BIBLE_THEMES) {
        expect(new Set(theme.verseRefs).size).toBe(theme.verseRefs.length);
      }
    });
  });

  describe('every curated reference is real', () => {
    // The whole point of the test: a typo'd ref fails CI rather than shipping a
    // dead row. Each ref must parse AND resolve to a real book + in-range chapter.
    it('resolves every ref to a canonical book within its chapter range', () => {
      const bad: string[] = [];
      for (const theme of BIBLE_THEMES) {
        for (const ref of theme.verseRefs) {
          const parsed = parseThemeRef(ref);
          if (!parsed) {
            bad.push(`${theme.id}: unparseable "${ref}"`);
            continue;
          }
          const book = getBookByName(parsed.book);
          if (!book) {
            bad.push(`${theme.id}: unknown book "${parsed.book}" in "${ref}"`);
            continue;
          }
          // Stored key must already be the canonical English name.
          if (book.nameEn !== parsed.book) {
            bad.push(
              `${theme.id}: non-canonical book "${parsed.book}" (expected "${book.nameEn}")`,
            );
          }
          if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
            bad.push(
              `${theme.id}: chapter ${parsed.chapter} out of range for ${book.nameEn} (1-${book.chapters})`,
            );
          }
        }
      }
      expect(bad).toEqual([]);
    });
  });

  describe('parseThemeRef', () => {
    it('parses a simple ref', () => {
      expect(parseThemeRef('John/3/16')).toEqual({
        key: 'John/3/16',
        book: 'John',
        chapter: 3,
        verse: 16,
      });
    });

    it('parses a numbered book name with a space', () => {
      expect(parseThemeRef('1 Corinthians/13/4')).toEqual({
        key: '1 Corinthians/13/4',
        book: '1 Corinthians',
        chapter: 13,
        verse: 4,
      });
    });

    it('returns null for malformed keys', () => {
      expect(parseThemeRef('John')).toBeNull();
      expect(parseThemeRef('John/3')).toBeNull();
      expect(parseThemeRef('John/x/16')).toBeNull();
      expect(parseThemeRef('John/3/0')).toBeNull();
      // defensive against non-string input (avoid the @ts-expect-error reflow trap)
      expect(parseThemeRef(null as unknown as string)).toBeNull();
    });
  });

  describe('getTheme / getAllThemes', () => {
    it('returns a theme by id', () => {
      expect(getTheme('faith')?.id).toBe('faith');
    });

    it('returns null for an unknown or empty id', () => {
      expect(getTheme('nope')).toBeNull();
      expect(getTheme('')).toBeNull();
      expect(getTheme(null)).toBeNull();
      expect(getTheme(undefined)).toBeNull();
    });

    it('getAllThemes returns the full taxonomy', () => {
      expect(getAllThemes()).toBe(BIBLE_THEMES);
    });
  });
});
