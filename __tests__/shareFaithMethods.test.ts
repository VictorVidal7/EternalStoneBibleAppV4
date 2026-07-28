import {
  SHARE_FAITH_METHODS,
  getAllShareFaithMethods,
  getShareFaithMethod,
  parseMethodRef,
} from '../src/features/study/shareFaithMethods';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

describe('shareFaithMethods — gospel-sharing outlines ("Comparte tu fe")', () => {
  describe('taxonomy shape', () => {
    it('ships exactly the 4 approved outlines', () => {
      expect(SHARE_FAITH_METHODS.length).toBe(4);
    });

    it('has unique method ids', () => {
      const ids = SHARE_FAITH_METHODS.map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every method has an icon, a hex accent and 3+ ordered steps', () => {
      for (const m of SHARE_FAITH_METHODS) {
        expect(m.icon).toBeTruthy();
        expect(m.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(m.steps.length).toBeGreaterThanOrEqual(3);
        for (const step of m.steps) {
          expect(step.ref).toBeTruthy();
          expect(step.captionKey).toBeTruthy();
        }
      }
    });

    it('has no duplicate refs within a single method (order is load-bearing, refs are not)', () => {
      for (const m of SHARE_FAITH_METHODS) {
        const refs = m.steps.map(s => s.ref);
        expect(new Set(refs).size).toBe(refs.length);
      }
    });

    it('has no duplicate captionKeys within a single method', () => {
      for (const m of SHARE_FAITH_METHODS) {
        const keys = m.steps.map(s => s.captionKey);
        expect(new Set(keys).size).toBe(keys.length);
      }
    });
  });

  describe('every curated reference is real', () => {
    // Mirrors shareFaithObjections.test.ts: a typo'd ref fails CI rather than
    // shipping a dead row. Verse-level text fidelity was manually verified
    // against the bundled bible-seed.db for BOTH RVR1960 and WEB before this
    // file was written — see the module header. Jest cannot load the native
    // SQLite asset, so this test only re-checks shape.
    it('resolves every step ref to a canonical book within its chapter range', () => {
      const bad: string[] = [];
      for (const m of SHARE_FAITH_METHODS) {
        for (const step of m.steps) {
          const parsed = parseMethodRef(step.ref);
          if (!parsed) {
            bad.push(`${m.id}: unparseable "${step.ref}"`);
            continue;
          }
          const book = getBookByName(parsed.book);
          if (!book) {
            bad.push(`${m.id}: unknown book "${parsed.book}" in "${step.ref}"`);
            continue;
          }
          if (book.nameEn !== parsed.book) {
            bad.push(
              `${m.id}: non-canonical book "${parsed.book}" (expected "${book.nameEn}")`,
            );
          }
          if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
            bad.push(
              `${m.id}: chapter ${parsed.chapter} out of range for ${book.nameEn} (1-${book.chapters})`,
            );
          }
        }
      }
      expect(bad).toEqual([]);
    });
  });

  describe('parseMethodRef', () => {
    it('parses a simple ref', () => {
      expect(parseMethodRef('John/3/16')).toEqual({
        key: 'John/3/16',
        book: 'John',
        chapter: 3,
        verse: 16,
      });
    });

    it('parses a numbered book name with a space', () => {
      expect(parseMethodRef('1 Timothy/2/5')).toEqual({
        key: '1 Timothy/2/5',
        book: '1 Timothy',
        chapter: 2,
        verse: 5,
      });
    });

    it('returns null for malformed keys', () => {
      expect(parseMethodRef('John')).toBeNull();
      expect(parseMethodRef('John/3')).toBeNull();
      expect(parseMethodRef('John/x/16')).toBeNull();
      expect(parseMethodRef('John/3/0')).toBeNull();
      expect(parseMethodRef(null as unknown as string)).toBeNull();
    });
  });

  describe('getShareFaithMethod / getAllShareFaithMethods', () => {
    it('returns a method by id', () => {
      expect(getShareFaithMethod('romans-road')?.id).toBe('romans-road');
    });

    it('returns null for an unknown or empty id', () => {
      expect(getShareFaithMethod('nope')).toBeNull();
      expect(getShareFaithMethod('')).toBeNull();
      expect(getShareFaithMethod(null)).toBeNull();
      expect(getShareFaithMethod(undefined)).toBeNull();
    });

    it('getAllShareFaithMethods returns the full list', () => {
      expect(getAllShareFaithMethods()).toBe(SHARE_FAITH_METHODS);
    });
  });

  describe('i18n parity — data module <-> translations.ts (both es and en)', () => {
    // A string-indexed lookup (methods[id] -> translations.*.shareFaith.methods.*)
    // is invisible to tsc: a typo in either side silently renders `undefined`.
    // These checks are the actual gate on that link.
    const langs = ['es', 'en'] as const;

    it('every method id has a list[id] with a non-empty title and description in both languages', () => {
      const bad: string[] = [];
      for (const lang of langs) {
        const list = translations[lang].shareFaith.methods.list as Record<
          string,
          {title?: string; description?: string}
        >;
        for (const m of SHARE_FAITH_METHODS) {
          const entry = list[m.id];
          if (!entry) {
            bad.push(`${lang}: missing list["${m.id}"]`);
            continue;
          }
          if (!entry.title) bad.push(`${lang}: empty list["${m.id}"].title`);
          if (!entry.description) {
            bad.push(`${lang}: empty list["${m.id}"].description`);
          }
        }
      }
      expect(bad).toEqual([]);
    });

    it('every step captionKey resolves to a non-empty caption in both languages', () => {
      const bad: string[] = [];
      for (const lang of langs) {
        const stepCaptions = translations[lang].shareFaith.methods
          .stepCaptions as Record<string, Record<string, string>>;
        for (const m of SHARE_FAITH_METHODS) {
          const methodCaptions = stepCaptions[m.id];
          if (!methodCaptions) {
            bad.push(`${lang}: missing stepCaptions["${m.id}"]`);
            continue;
          }
          for (const step of m.steps) {
            const caption = methodCaptions[step.captionKey];
            if (!caption) {
              bad.push(
                `${lang}: missing stepCaptions["${m.id}"]["${step.captionKey}"]`,
              );
            }
          }
        }
      }
      expect(bad).toEqual([]);
    });

    it('es and en expose the identical captionKey set per method (no orphan keys)', () => {
      const esCaptions = translations.es.shareFaith.methods
        .stepCaptions as Record<string, Record<string, string>>;
      const enCaptions = translations.en.shareFaith.methods
        .stepCaptions as Record<string, Record<string, string>>;
      for (const m of SHARE_FAITH_METHODS) {
        const esKeys = Object.keys(esCaptions[m.id] ?? {}).sort();
        const enKeys = Object.keys(enCaptions[m.id] ?? {}).sort();
        expect(enKeys).toEqual(esKeys);
      }
    });
  });
});

describe('shareFaithObjections — i18n list parity for the 4 newly-added objections', () => {
  const newIds = [
    'prayer-works',
    'many-denominations',
    'human-tradition',
    'never-heard-gospel',
  ];
  const langs = ['es', 'en'] as const;

  it('every new objection id has a list[id] with a non-empty title and description in both languages', () => {
    const bad: string[] = [];
    for (const lang of langs) {
      const list = translations[lang].shareFaith.objections.list as Record<
        string,
        {title?: string; description?: string}
      >;
      for (const id of newIds) {
        const entry = list[id];
        if (!entry) {
          bad.push(`${lang}: missing objections.list["${id}"]`);
          continue;
        }
        if (!entry.title)
          bad.push(`${lang}: empty objections.list["${id}"].title`);
        if (!entry.description) {
          bad.push(`${lang}: empty objections.list["${id}"].description`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
