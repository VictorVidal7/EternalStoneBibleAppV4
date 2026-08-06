/**
 * Invariant guard for the "La Biblia en Orden Cronológico" plan
 * (`chronologicalBible` / `CHRONOLOGICAL_CHAPTERS` in `../reading-plans.ts`).
 *
 * Reordering all 1189 canonical chapters into a chronological sequence by
 * hand is easy to get subtly wrong — a duplicated or dropped chapter would
 * silently ship a reading plan that either repeats content or never reaches
 * some book at all. This pins five things that must hold no matter how the
 * chronological ordering itself is edited later (e.g. if Victor asks to
 * change one of the judgment-call placements documented inline in
 * `reading-plans.ts`):
 *
 *  1. Exactly 1189 chapters total (the canonical count, same as
 *     `bibleInAYear`'s own scope).
 *  2. No duplicates — every (book, chapter) pair appears once.
 *  3. Set-equality with a canonical `BIBLE_BOOKS` flattening, checked in BOTH
 *     directions (a typo'd book name, e.g. "Nahum" for "Nahúm", wouldn't
 *     change the total count, so length alone can't catch it).
 *  4. All 365 days are present, numbered 1..365, and none are empty.
 *  5. Concatenating every day's `readings` back together reproduces
 *     `CHRONOLOGICAL_CHAPTERS` exactly — this is the one that would catch a
 *     `Math.floor` boundary bug in the day split, which (1)-(4) alone would
 *     not necessarily surface.
 */
import {
  READING_PLANS,
  CHRONOLOGICAL_CHAPTERS,
  type ReadingPlan,
} from '../reading-plans';
import {BIBLE_BOOKS} from '../bible';

type Reading = {book: string; chapter: number};

const key = (r: Reading): string => `${r.book}|${r.chapter}`;

describe('chronologicalBible plan', () => {
  const plan: ReadingPlan | undefined = READING_PLANS.find(
    p => p.id === 'chronological-bible',
  );

  it('is registered in READING_PLANS', () => {
    expect(plan).toBeDefined();
  });

  // Guard clause so TypeScript can narrow `plan` for the rest of the file
  // without an extra `!` on every access below.
  if (!plan) {
    throw new Error('chronological-bible plan not found in READING_PLANS');
  }

  const flatFromDays: Reading[] = plan.days.flatMap(day =>
    day.readings.map(r => ({book: r.book, chapter: r.chapter})),
  );

  const canonical: Reading[] = [...BIBLE_BOOKS]
    .sort((a, b) => a.id - b.id)
    .flatMap(b =>
      Array.from({length: b.chapters}, (_, i) => ({
        book: b.name,
        chapter: i + 1,
      })),
    );

  it('the canonical BIBLE_BOOKS flattening totals 1189 chapters (sanity check on the check itself)', () => {
    expect(canonical.length).toBe(1189);
  });

  it('contains exactly 1189 chapters', () => {
    expect(CHRONOLOGICAL_CHAPTERS.length).toBe(1189);
    expect(flatFromDays.length).toBe(1189);
  });

  it('has no duplicate (book, chapter) pairs', () => {
    const keys = CHRONOLOGICAL_CHAPTERS.map(key);
    expect(new Set(keys).size).toBe(CHRONOLOGICAL_CHAPTERS.length);
  });

  it('matches the canonical chapter set exactly, in both directions', () => {
    const chronoSet = new Set(CHRONOLOGICAL_CHAPTERS.map(key));
    const canonicalSet = new Set(canonical.map(key));

    const missingFromChrono = canonical.filter(r => !chronoSet.has(key(r)));
    const extraInChrono = CHRONOLOGICAL_CHAPTERS.filter(
      r => !canonicalSet.has(key(r)),
    );

    expect(missingFromChrono).toEqual([]);
    expect(extraInChrono).toEqual([]);
  });

  it('every book contributes exactly its canonical chapter count', () => {
    const countsByBook = new Map<string, number>();
    for (const r of CHRONOLOGICAL_CHAPTERS) {
      countsByBook.set(r.book, (countsByBook.get(r.book) ?? 0) + 1);
    }
    for (const b of BIBLE_BOOKS) {
      expect(countsByBook.get(b.name)).toBe(b.chapters);
    }
    // No stray/misspelled book names beyond the 66 canonical ones.
    expect(countsByBook.size).toBe(BIBLE_BOOKS.length);
  });

  it('has all 365 days, numbered 1..365, and none are empty', () => {
    expect(plan.duration).toBe(365);
    expect(plan.days.length).toBe(365);
    plan.days.forEach((day, i) => {
      expect(day.day).toBe(i + 1);
      expect(day.readings.length).toBeGreaterThan(0);
    });
  });

  it('reproduces CHRONOLOGICAL_CHAPTERS exactly when every day is concatenated back together', () => {
    expect(flatFromDays).toEqual(CHRONOLOGICAL_CHAPTERS);
  });

  it('is reflowable (whole chapters only, no partial verse ranges)', () => {
    expect(plan.days.every(day => day.readings.every(r => !r.verses))).toBe(
      true,
    );
  });
});
