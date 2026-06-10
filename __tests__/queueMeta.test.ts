/**
 * Sprint 76 — queueMeta: verse counts + honest duration estimates for the
 * listening-queue rows. Pure model tests.
 */
import {
  averageMsPerVerse,
  queueRowMeta,
  formatQueueRowMeta,
} from '../src/features/audio/lib/queueMeta';
import type {ListeningSummary} from '../src/features/audio/lib/listeningStats';

const summary = (totalMs: number, totalVerses: number): ListeningSummary => ({
  todayMs: 0,
  weekMs: 0,
  totalMs,
  totalVerses,
  daysListened: totalMs > 0 ? 1 : 0,
});

describe('averageMsPerVerse', () => {
  it('derives the pace from the lifetime listening totals', () => {
    // 2 minutes voiced across 40 verses → 3s per verse.
    expect(averageMsPerVerse(summary(120_000, 40))).toBe(3000);
  });

  it('returns null without meaningful history — no invented numbers', () => {
    expect(averageMsPerVerse(summary(0, 0))).toBeNull();
    expect(averageMsPerVerse(summary(0, 10))).toBeNull();
    expect(averageMsPerVerse(summary(5000, 0))).toBeNull();
  });
});

describe('queueRowMeta', () => {
  it('combines the verse count with a whole-minute estimate', () => {
    // 176 verses × 3s = 528s ≈ 9 min.
    expect(queueRowMeta(176, 3000)).toEqual({verses: 176, minutes: 9});
  });

  it('floors a non-empty estimate at 1 minute', () => {
    // Psalm 117: 2 verses × 3s = 6s — still "~1 min", never "~0 min".
    expect(queueRowMeta(2, 3000)).toEqual({verses: 2, minutes: 1});
  });

  it('omits the estimate without listening history', () => {
    expect(queueRowMeta(176, null)).toEqual({verses: 176, minutes: null});
  });

  it('returns null while the count is loading or the chapter is missing', () => {
    expect(queueRowMeta(undefined, 3000)).toBeNull();
    expect(queueRowMeta(0, 3000)).toBeNull();
  });
});

describe('formatQueueRowMeta', () => {
  const versesTemplate = '{{n}} versículos';
  const minutesTemplate = '~{{m}} min';

  it('renders count and estimate joined by a middot', () => {
    expect(
      formatQueueRowMeta(
        {verses: 176, minutes: 9},
        versesTemplate,
        minutesTemplate,
      ),
    ).toBe('176 versículos · ~9 min');
  });

  it('renders just the count when there is no estimate', () => {
    expect(
      formatQueueRowMeta(
        {verses: 176, minutes: null},
        versesTemplate,
        minutesTemplate,
      ),
    ).toBe('176 versículos');
  });
});
