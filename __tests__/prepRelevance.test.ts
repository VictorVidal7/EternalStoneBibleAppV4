import {
  rankHistoryEntriesByRelevance,
  rankIllustrationsByRelevance,
} from '../src/features/study/prepRelevance';
import type {PrepIllustration} from '../src/features/study/prepIllustrations';
import type {PrepHistoryEntry} from '../src/features/study/prepHistory';

function illustration(overrides: Partial<PrepIllustration>): PrepIllustration {
  return {
    id: 'i',
    title: '',
    body: '',
    category: 'analogy',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function historyEntry(overrides: Partial<PrepHistoryEntry>): PrepHistoryEntry {
  return {
    passageKey: 'John/1/1',
    bookId: 43,
    bookNameEn: 'John',
    chapter: 1,
    startVerse: 1,
    endVerse: 1,
    updatedAt: 1,
    preview: '',
    searchableText: '',
    ...overrides,
  };
}

describe('rankIllustrationsByRelevance', () => {
  it('ranks an illustration whose own words match the target themes first', () => {
    const irrelevant = illustration({
      id: 'i1',
      title: 'Historia de un viaje',
      body: 'Un relato sobre un viaje en barco.',
      updatedAt: 100,
    });
    const relevant = illustration({
      id: 'i2',
      title: 'El perdón de un padre',
      body: 'Una historia real sobre el perdón y la reconciliación.',
      updatedAt: 1,
    });
    const ranked = rankIllustrationsByRelevance(
      [irrelevant, relevant],
      ['forgiveness'],
    );
    expect(ranked.map(i => i.id)).toEqual(['i2', 'i1']);
  });

  it('falls back to most-recently-updated-first when nothing matches', () => {
    const older = illustration({id: 'i1', title: 'A', updatedAt: 1});
    const newer = illustration({id: 'i2', title: 'B', updatedAt: 2});
    const ranked = rankIllustrationsByRelevance([older, newer], ['grace']);
    expect(ranked.map(i => i.id)).toEqual(['i2', 'i1']);
  });

  it('falls back to most-recently-updated-first when targetThemeIds is empty', () => {
    const older = illustration({id: 'i1', updatedAt: 5});
    const newer = illustration({id: 'i2', updatedAt: 9});
    const ranked = rankIllustrationsByRelevance([older, newer], []);
    expect(ranked.map(i => i.id)).toEqual(['i2', 'i1']);
  });

  it('never matches a short keyword inside an unrelated word (word-boundary safety)', () => {
    // "paz" (peace) must not fire on "capaz".
    const noisy = illustration({
      id: 'i1',
      title: 'Un hombre capaz',
      body: '',
      updatedAt: 1,
    });
    const genuine = illustration({
      id: 'i2',
      title: 'Un momento de paz',
      body: '',
      updatedAt: 1,
    });
    const ranked = rankIllustrationsByRelevance([noisy, genuine], ['peace']);
    expect(ranked[0].id).toBe('i2');
  });
});

describe('rankHistoryEntriesByRelevance', () => {
  it('ranks a past prep whose OWN passage shares a curated theme with the target first', () => {
    // John/3/16 is curated under both "love" and "salvation".
    const related = historyEntry({
      passageKey: 'John/3/16',
      bookNameEn: 'John',
      chapter: 3,
      startVerse: 16,
      endVerse: 16,
      updatedAt: 1,
      searchableText: '',
    });
    // Genesis/1/1 is not curated under "salvation".
    const unrelated = historyEntry({
      passageKey: 'Genesis/1/1',
      bookNameEn: 'Genesis',
      chapter: 1,
      startVerse: 1,
      endVerse: 1,
      updatedAt: 100,
      searchableText: '',
    });
    const ranked = rankHistoryEntriesByRelevance(
      [unrelated, related],
      ['salvation'],
    );
    expect(ranked.map(e => e.passageKey)).toEqual(['John/3/16', 'Genesis/1/1']);
  });

  it("uses the preacher's own written notes as a tiebreak when theme overlap is equal", () => {
    const withKeyword = historyEntry({
      passageKey: 'Genesis/1/1',
      bookNameEn: 'Genesis',
      chapter: 1,
      startVerse: 1,
      endVerse: 1,
      updatedAt: 1,
      searchableText: 'hablamos de la gracia de dios en este pasaje',
    });
    const withoutKeyword = historyEntry({
      passageKey: 'Genesis/1/2',
      bookNameEn: 'Genesis',
      chapter: 1,
      startVerse: 2,
      endVerse: 2,
      updatedAt: 1,
      searchableText: 'notas sin relación con el tema buscado',
    });
    const ranked = rankHistoryEntriesByRelevance(
      [withoutKeyword, withKeyword],
      ['grace'],
    );
    expect(ranked[0].passageKey).toBe('Genesis/1/1');
  });

  it('falls back to most-recently-updated-first when targetThemeIds is empty', () => {
    const older = historyEntry({passageKey: 'John/1/1', updatedAt: 1});
    const newer = historyEntry({passageKey: 'John/1/2', updatedAt: 2});
    const ranked = rankHistoryEntriesByRelevance([older, newer], []);
    expect(ranked.map(e => e.passageKey)).toEqual(['John/1/2', 'John/1/1']);
  });
});

// ── Guardrail — mirrors faithTestimony.test.ts:118-129's "never generates or
// fills in content" precedent. These rerankers must ONLY ever reorder the
// preacher's own already-saved rows — never clone, rewrite, summarize, or
// add a field. Identity preservation (`toBe`, not `toEqual`) is what proves
// no new object — and so no new prose — can ever be synthesized. ───────────
describe('guardrail — reorders only, never rewrites or generates content', () => {
  it('rankIllustrationsByRelevance returns the SAME objects, only reordered', () => {
    const items = [
      illustration({id: 'i1', title: 'Sobre el perdón', updatedAt: 1}),
      illustration({id: 'i2', title: 'Otra cosa', updatedAt: 2}),
      illustration({id: 'i3', title: 'Perdón y gracia', updatedAt: 3}),
    ];
    const before = items.map(i => ({...i}));
    const ranked = rankIllustrationsByRelevance(items, ['forgiveness']);

    // Same set of ids, same length — a reorder, not a filter.
    expect(ranked).toHaveLength(items.length);
    expect(new Set(ranked.map(i => i.id))).toEqual(
      new Set(items.map(i => i.id)),
    );
    // Every returned element IS one of the original objects (reference
    // equality) — nothing was cloned or rebuilt.
    for (const item of ranked) {
      expect(items).toContain(item);
    }
    // No field was mutated on any input item.
    items.forEach((item, i) => expect(item).toEqual(before[i]));
    // The shape never grew a new field (e.g. no synthesized "score"/"summary").
    for (const item of ranked) {
      expect(Object.keys(item).sort()).toEqual(
        ['body', 'category', 'createdAt', 'id', 'title', 'updatedAt'].sort(),
      );
    }
  });

  it('rankHistoryEntriesByRelevance returns the SAME objects, only reordered', () => {
    const entries = [
      historyEntry({passageKey: 'John/3/16', updatedAt: 1}),
      historyEntry({passageKey: 'Genesis/1/1', updatedAt: 2}),
    ];
    const before = entries.map(e => ({...e}));
    const ranked = rankHistoryEntriesByRelevance(entries, ['salvation']);

    expect(ranked).toHaveLength(entries.length);
    expect(new Set(ranked.map(e => e.passageKey))).toEqual(
      new Set(entries.map(e => e.passageKey)),
    );
    for (const entry of ranked) {
      expect(entries).toContain(entry);
    }
    entries.forEach((entry, i) => expect(entry).toEqual(before[i]));
    for (const entry of ranked) {
      expect(Object.keys(entry).sort()).toEqual(
        [
          'bookId',
          'bookNameEn',
          'chapter',
          'endVerse',
          'passageKey',
          'preview',
          'searchableText',
          'startVerse',
          'updatedAt',
        ].sort(),
      );
    }
  });
});
