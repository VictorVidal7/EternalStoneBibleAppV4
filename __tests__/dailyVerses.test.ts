/**
 * Sprint 95 — DAILY_VERSE_REFS integrity.
 *
 * The curated daily verse is the most-seen passage in the app (Home card,
 * Daily Light, the widget). Each ref is stored by numeric book id, so a
 * typo'd id / out-of-range chapter would silently surface an empty verse on
 * some calendar day. This locks every ref to a real canonical book within its
 * chapter range, pins the pool size, and re-asserts the determinism +
 * rotation contract the rest of the daily-verse code relies on.
 */

import {
  DAILY_VERSE_REFS,
  getDailyVerseRef,
} from '../src/constants/daily-verses';
import {getBookById} from '../src/constants/bible';

describe('DAILY_VERSE_REFS integrity', () => {
  it('ships a rich, de-duplicated pool', () => {
    expect(DAILY_VERSE_REFS.length).toBeGreaterThanOrEqual(190);
    const keys = DAILY_VERSE_REFS.map(r => `${r.book}/${r.chapter}/${r.verse}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every ref resolves to a canonical book within its chapter range', () => {
    const bad: string[] = [];
    for (const ref of DAILY_VERSE_REFS) {
      const book = getBookById(ref.book);
      if (!book) {
        bad.push(`unknown book id ${ref.book}`);
        continue;
      }
      if (ref.chapter < 1 || ref.chapter > book.chapters) {
        bad.push(
          `${book.nameEn}: chapter ${ref.chapter} out of range (1-${book.chapters})`,
        );
      }
      if (ref.verse < 1) {
        bad.push(`${book.nameEn} ${ref.chapter}: bad verse ${ref.verse}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('getDailyVerseRef is deterministic for the same calendar day', () => {
    const a = getDailyVerseRef(new Date(2026, 5, 16));
    const b = getDailyVerseRef(new Date(2026, 5, 16));
    expect(a).toEqual(b);
    expect(DAILY_VERSE_REFS).toContainEqual(a);
  });

  it('rotates across a span of days (not frozen on one verse)', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 20; d++) {
      const r = getDailyVerseRef(new Date(2026, 0, d));
      seen.add(`${r.book}/${r.chapter}/${r.verse}`);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
