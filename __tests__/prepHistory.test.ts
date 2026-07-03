/**
 * T8.4.1 — pure logic behind the "Historial de preparaciones" screen:
 * parsing a `passageKey` back into a passage, picking the row preview,
 * sorting the map into displayable entries, and the relative-time label.
 */
import {
  buildPrepHistoryEntries,
  firstNonEmptyPreview,
  formatRelativeUpdatedAt,
  parsePassageKey,
  type RelativeTimeStrings,
} from '../src/features/study/prepHistory';
import type {PrepNotes, PrepNotesMap} from '../src/features/study/prepNotes';
import {translations} from '../src/i18n/translations';

function notes(sections: PrepNotes['sections'], updatedAt = 1): PrepNotes {
  return {sections, updatedAt};
}

describe('parsePassageKey', () => {
  it('parses a single-verse key', () => {
    expect(parsePassageKey('John/3/16')).toEqual({
      bookId: 43,
      bookNameEn: 'John',
      chapter: 3,
      startVerse: 16,
      endVerse: 16,
    });
  });

  it('parses a range key', () => {
    expect(parsePassageKey('Romans/8/28-30')).toEqual({
      bookId: 45,
      bookNameEn: 'Romans',
      chapter: 8,
      startVerse: 28,
      endVerse: 30,
    });
  });

  it('resolves a multi-word English book name (no embedded slash)', () => {
    const parsed = parsePassageKey('1 Corinthians/13/4-7');
    expect(parsed?.bookNameEn).toBe('1 Corinthians');
    expect(parsed?.chapter).toBe(13);
    expect(parsed?.startVerse).toBe(4);
    expect(parsed?.endVerse).toBe(7);
  });

  it('returns null for an unknown book', () => {
    expect(parsePassageKey('Nowhere/1/1')).toBeNull();
  });

  it('returns null for a malformed key (wrong segment count)', () => {
    expect(parsePassageKey('John/3')).toBeNull();
    expect(parsePassageKey('John')).toBeNull();
  });

  it('returns null for a non-numeric chapter or verse', () => {
    expect(parsePassageKey('John/x/16')).toBeNull();
    expect(parsePassageKey('John/3/x')).toBeNull();
  });

  it('returns null when the range end is before the start', () => {
    expect(parsePassageKey('John/3/16-10')).toBeNull();
  });
});

describe('firstNonEmptyPreview', () => {
  it('returns the first non-empty section in outline order, ignoring order of insertion', () => {
    const n = notes({
      application: 'Applied thought',
      context: 'Written by John, to believers everywhere',
    });
    expect(firstNonEmptyPreview(n)).toBe(
      'Written by John, to believers everywhere',
    );
  });

  it('skips blank/whitespace-only sections', () => {
    const n = notes({context: '   ', observation: 'What the text says'});
    expect(firstNonEmptyPreview(n)).toBe('What the text says');
  });

  it('returns an empty string when every section is empty', () => {
    expect(firstNonEmptyPreview(notes({}))).toBe('');
  });

  it('collapses internal whitespace/newlines to single spaces', () => {
    const n = notes({context: 'Line one\n\nLine   two'});
    expect(firstNonEmptyPreview(n)).toBe('Line one Line two');
  });

  it('truncates a long section with an ellipsis', () => {
    const long = 'x'.repeat(200);
    const preview = firstNonEmptyPreview(notes({context: long}));
    expect(preview.length).toBeLessThan(200);
    expect(preview.endsWith('…')).toBe(true);
  });
});

describe('buildPrepHistoryEntries', () => {
  it('sorts entries by updatedAt descending (most recent first)', () => {
    const map: PrepNotesMap = {
      'John/3/16': notes({context: 'oldest'}, 100),
      'Romans/8/28-30': notes({context: 'newest'}, 300),
      'Genesis/1/1': notes({context: 'middle'}, 200),
    };
    const entries = buildPrepHistoryEntries(map);
    expect(entries.map(e => e.passageKey)).toEqual([
      'Romans/8/28-30',
      'Genesis/1/1',
      'John/3/16',
    ]);
  });

  it('carries the parsed passage fields and a preview per entry', () => {
    const map: PrepNotesMap = {
      'John/3/16': notes({bigIdea: 'God so loved the world'}, 42),
    };
    const [entry] = buildPrepHistoryEntries(map);
    expect(entry).toMatchObject({
      passageKey: 'John/3/16',
      bookNameEn: 'John',
      chapter: 3,
      startVerse: 16,
      endVerse: 16,
      updatedAt: 42,
      preview: 'God so loved the world',
    });
  });

  it('builds a lowercased searchableText from every section', () => {
    const map: PrepNotesMap = {
      'John/3/16': notes({
        context: 'For GOD so loved',
        application: 'Trust Him Today',
      }),
    };
    const [entry] = buildPrepHistoryEntries(map);
    expect(entry.searchableText).toContain('for god so loved');
    expect(entry.searchableText).toContain('trust him today');
  });

  it('skips an entry whose passageKey no longer parses (defensive)', () => {
    const map: PrepNotesMap = {
      'NotABook/1/1': notes({context: 'corrupt'}),
      'John/3/16': notes({context: 'fine'}, 5),
    };
    const entries = buildPrepHistoryEntries(map);
    expect(entries).toHaveLength(1);
    expect(entries[0].passageKey).toBe('John/3/16');
  });

  it('returns an empty array for an empty map', () => {
    expect(buildPrepHistoryEntries({})).toEqual([]);
  });
});

describe('formatRelativeUpdatedAt', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const strings: RelativeTimeStrings = translations.es.prepHistory;
  const now = Date.UTC(2026, 0, 31, 12, 0, 0);

  it('labels same-day edits as "today"', () => {
    expect(formatRelativeUpdatedAt(now - 1000, now, strings)).toBe('Hoy');
  });

  it('labels an edit from a future timestamp as "today" (clamped, never negative)', () => {
    expect(formatRelativeUpdatedAt(now + DAY, now, strings)).toBe('Hoy');
  });

  it('labels 1 day back as "yesterday"', () => {
    expect(formatRelativeUpdatedAt(now - DAY, now, strings)).toBe('Ayer');
  });

  it('labels 2-6 days back with the day count', () => {
    expect(formatRelativeUpdatedAt(now - 3 * DAY, now, strings)).toBe(
      'Hace 3 días',
    );
  });

  it('labels exactly 1 week back as singular', () => {
    expect(formatRelativeUpdatedAt(now - 7 * DAY, now, strings)).toBe(
      'Hace 1 semana',
    );
  });

  it('labels multiple weeks back with the week count', () => {
    expect(formatRelativeUpdatedAt(now - 14 * DAY, now, strings)).toBe(
      'Hace 2 semanas',
    );
  });

  it('labels roughly a month back as singular', () => {
    expect(formatRelativeUpdatedAt(now - 30 * DAY, now, strings)).toBe(
      'Hace 1 mes',
    );
  });

  it('labels multiple months back with the month count', () => {
    expect(formatRelativeUpdatedAt(now - 90 * DAY, now, strings)).toBe(
      'Hace 3 meses',
    );
  });

  it('labels roughly a year back as singular', () => {
    expect(formatRelativeUpdatedAt(now - 365 * DAY, now, strings)).toBe(
      'Hace 1 año',
    );
  });

  it('labels multiple years back with the year count', () => {
    expect(formatRelativeUpdatedAt(now - 800 * DAY, now, strings)).toBe(
      'Hace 2 años',
    );
  });

  it('uses the English strings bag when given the English translations', () => {
    const en: RelativeTimeStrings = translations.en.prepHistory;
    expect(formatRelativeUpdatedAt(now - 3 * DAY, now, en)).toBe('3 days ago');
  });
});
