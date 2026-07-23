import {
  SHARE_FAITH_OBJECTIONS,
  getAllShareFaithObjections,
  getShareFaithObjection,
  parseObjectionRef,
} from '../src/features/study/shareFaithObjections';
import {getBookByName} from '../src/constants/bible';

describe('shareFaithObjections — objection → verses index ("Comparte tu fe")', () => {
  describe('taxonomy shape', () => {
    it('ships a meaningful, respectful-sized set of objections', () => {
      expect(SHARE_FAITH_OBJECTIONS.length).toBeGreaterThanOrEqual(6);
      expect(SHARE_FAITH_OBJECTIONS.length).toBeLessThanOrEqual(10);
    });

    it('has unique objection ids', () => {
      const ids = SHARE_FAITH_OBJECTIONS.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every objection has an icon, a hex accent and 2-4 verses', () => {
      for (const o of SHARE_FAITH_OBJECTIONS) {
        expect(o.icon).toBeTruthy();
        expect(o.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(o.verseRefs.length).toBeGreaterThanOrEqual(2);
        expect(o.verseRefs.length).toBeLessThanOrEqual(4);
      }
    });

    it('has no duplicate refs within a single objection', () => {
      for (const o of SHARE_FAITH_OBJECTIONS) {
        expect(new Set(o.verseRefs).size).toBe(o.verseRefs.length);
      }
    });
  });

  describe('every curated reference is real', () => {
    // The whole point of the test: a typo'd ref fails CI rather than shipping
    // a dead row. Each ref must parse AND resolve to a real book + in-range
    // chapter. (Verse-level text fidelity was manually verified against the
    // bundled bible-seed.db for BOTH RVR1960 and WEB before this file was
    // written — see the module header. Jest cannot load the native SQLite
    // asset, so this test mirrors [[themes]]'s test and only re-checks shape.)
    it('resolves every ref to a canonical book within its chapter range', () => {
      const bad: string[] = [];
      for (const o of SHARE_FAITH_OBJECTIONS) {
        for (const ref of o.verseRefs) {
          const parsed = parseObjectionRef(ref);
          if (!parsed) {
            bad.push(`${o.id}: unparseable "${ref}"`);
            continue;
          }
          const book = getBookByName(parsed.book);
          if (!book) {
            bad.push(`${o.id}: unknown book "${parsed.book}" in "${ref}"`);
            continue;
          }
          // Stored key must already be the canonical English name.
          if (book.nameEn !== parsed.book) {
            bad.push(
              `${o.id}: non-canonical book "${parsed.book}" (expected "${book.nameEn}")`,
            );
          }
          if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
            bad.push(
              `${o.id}: chapter ${parsed.chapter} out of range for ${book.nameEn} (1-${book.chapters})`,
            );
          }
        }
      }
      expect(bad).toEqual([]);
    });
  });

  describe('parseObjectionRef', () => {
    it('parses a simple ref', () => {
      expect(parseObjectionRef('John/14/6')).toEqual({
        key: 'John/14/6',
        book: 'John',
        chapter: 14,
        verse: 6,
      });
    });

    it('parses a numbered book name with a space', () => {
      expect(parseObjectionRef('1 Timothy/2/5')).toEqual({
        key: '1 Timothy/2/5',
        book: '1 Timothy',
        chapter: 2,
        verse: 5,
      });
    });

    it('returns null for malformed keys', () => {
      expect(parseObjectionRef('John')).toBeNull();
      expect(parseObjectionRef('John/14')).toBeNull();
      expect(parseObjectionRef('John/x/6')).toBeNull();
      expect(parseObjectionRef('John/14/0')).toBeNull();
      // defensive against non-string input (avoid the @ts-expect-error reflow trap)
      expect(parseObjectionRef(null as unknown as string)).toBeNull();
    });
  });

  describe('getShareFaithObjection / getAllShareFaithObjections', () => {
    it('returns an objection by id', () => {
      expect(getShareFaithObjection('god-exists')?.id).toBe('god-exists');
    });

    it('returns null for an unknown or empty id', () => {
      expect(getShareFaithObjection('nope')).toBeNull();
      expect(getShareFaithObjection('')).toBeNull();
      expect(getShareFaithObjection(null)).toBeNull();
      expect(getShareFaithObjection(undefined)).toBeNull();
    });

    it('getAllShareFaithObjections returns the full list', () => {
      expect(getAllShareFaithObjections()).toBe(SHARE_FAITH_OBJECTIONS);
    });
  });
});
