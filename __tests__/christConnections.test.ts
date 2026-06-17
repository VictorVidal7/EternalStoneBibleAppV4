import {
  CHRIST_CONNECTIONS,
  getChristConnectionById,
  parseChristRef,
  formatChristRefLabel,
} from '../src/features/study/christConnections';
import {getBookByName, getBookById} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';

type AnyRecord = Record<string, unknown>;

const esNotes = (translations.es as AnyRecord).christConnections as AnyRecord;
const enNotes = (translations.en as AnyRecord).christConnections as AnyRecord;

describe('christConnections — "Christ in this passage" catalog', () => {
  describe('catalog shape', () => {
    it('ships a meaningful set of connections', () => {
      expect(CHRIST_CONNECTIONS.length).toBeGreaterThanOrEqual(40);
    });

    it('has unique ids', () => {
      const ids = CHRIST_CONNECTIONS.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has unique focus refs (one note per verse)', () => {
      const refs = CHRIST_CONNECTIONS.map(c => c.ref);
      expect(new Set(refs).size).toBe(refs.length);
    });
  });

  describe('every reference is real', () => {
    // A typo'd ref must fail CI rather than ship a dead row — same guard as
    // themes.ts. Both the focus ref and any fulfillment ref are checked.
    const checkRef = (label: string, ref: string, bad: string[]) => {
      const parsed = parseChristRef(ref);
      if (!parsed) {
        bad.push(`${label}: unparseable "${ref}"`);
        return;
      }
      const book = getBookByName(parsed.book);
      if (!book) {
        bad.push(`${label}: unknown book "${parsed.book}" in "${ref}"`);
        return;
      }
      if (book.nameEn !== parsed.book) {
        bad.push(
          `${label}: non-canonical book "${parsed.book}" (expected "${book.nameEn}")`,
        );
      }
      if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
        bad.push(
          `${label}: chapter ${parsed.chapter} out of range for ${book.nameEn} (1-${book.chapters})`,
        );
      }
    };

    it('resolves every focus + fulfillment ref to a canonical book in range', () => {
      const bad: string[] = [];
      for (const c of CHRIST_CONNECTIONS) {
        checkRef(`${c.id} focus`, c.ref, bad);
        if (c.fulfillment) {
          checkRef(`${c.id} fulfillment`, c.fulfillment, bad);
        }
      }
      expect(bad).toEqual([]);
    });
  });

  describe('i18n notes', () => {
    it('every catalog id has a non-empty note in both locales', () => {
      const esMap = (esNotes.notes ?? {}) as Record<string, string>;
      const enMap = (enNotes.notes ?? {}) as Record<string, string>;
      const missing: string[] = [];
      for (const c of CHRIST_CONNECTIONS) {
        if (!esMap[c.id] || esMap[c.id].trim().length === 0) {
          missing.push(`es:${c.id}`);
        }
        if (!enMap[c.id] || enMap[c.id].trim().length === 0) {
          missing.push(`en:${c.id}`);
        }
      }
      expect(missing).toEqual([]);
    });

    it('has no orphan notes without a catalog entry', () => {
      const ids = new Set(CHRIST_CONNECTIONS.map(c => c.id));
      const esMap = (esNotes.notes ?? {}) as Record<string, string>;
      const orphans = Object.keys(esMap).filter(id => !ids.has(id));
      expect(orphans).toEqual([]);
    });

    it('exposes the card title + pointsTo label in both locales', () => {
      for (const block of [esNotes, enNotes]) {
        expect(typeof block.cardTitle).toBe('string');
        expect((block.cardTitle as string).length).toBeGreaterThan(0);
        expect(typeof block.pointsTo).toBe('string');
        expect((block.pointsTo as string).length).toBeGreaterThan(0);
      }
    });
  });

  describe('getChristConnectionById', () => {
    it('finds a curated verse by numeric book id', () => {
      // John 3:16 → book id 43
      const john = getBookByName('John');
      expect(john?.id).toBe(43);
      const conn = getChristConnectionById(43, 3, 16);
      expect(conn?.id).toBe('john-3-16');
    });

    it('finds an OT type with its fulfillment pointer', () => {
      const isaiah = getBookByName('Isaiah');
      const conn = getChristConnectionById(isaiah!.id, 53, 5);
      expect(conn?.id).toBe('isaiah-53-5');
      expect(conn?.fulfillment).toBe('1 Peter/2/24');
    });

    it('returns null for an uncurated verse', () => {
      // Leviticus 11:3 has no curated connection.
      const lev = getBookByName('Leviticus');
      expect(getChristConnectionById(lev!.id, 11, 3)).toBeNull();
    });

    it('returns null for an unknown book id', () => {
      expect(getChristConnectionById(999, 1, 1)).toBeNull();
    });

    it('every catalog ref resolves back through getChristConnectionById', () => {
      const bad: string[] = [];
      for (const c of CHRIST_CONNECTIONS) {
        const parsed = parseChristRef(c.ref)!;
        const book = getBookByName(parsed.book)!;
        const found = getChristConnectionById(
          book.id,
          parsed.chapter,
          parsed.verse,
        );
        if (found?.id !== c.id) {
          bad.push(c.id);
        }
      }
      expect(bad).toEqual([]);
    });
  });

  describe('parseChristRef', () => {
    it('parses a well-formed key', () => {
      expect(parseChristRef('1 Peter/2/24')).toEqual({
        book: '1 Peter',
        chapter: 2,
        verse: 24,
      });
    });

    it('rejects malformed keys', () => {
      expect(parseChristRef('John')).toBeNull();
      expect(parseChristRef('John/3')).toBeNull();
      expect(parseChristRef('John/x/16')).toBeNull();
      expect(parseChristRef('')).toBeNull();
      // @ts-expect-error guarding non-string input
      expect(parseChristRef(null)).toBeNull();
    });
  });

  describe('formatChristRefLabel', () => {
    it('localizes the book name', () => {
      expect(formatChristRefLabel('John/10/11', 'en')).toBe('John 10:11');
      const johnEs = getBookById(43)?.name;
      expect(formatChristRefLabel('John/10/11', 'es')).toBe(`${johnEs} 10:11`);
    });

    it('falls back to the raw key on a bad ref', () => {
      expect(formatChristRefLabel('Nope/1/1', 'en')).toBe('Nope/1/1');
    });
  });
});
