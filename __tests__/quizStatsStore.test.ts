/**
 * T18b — device-local extended quiz-stats store.
 *
 * Pins: defensive parse (null / corrupt / partial blob → complete valid
 * snapshot), one round updates every counter + persists, per-type accuracy
 * accumulates across rounds, best-round tracks `score` (clamped) while the
 * accuracy counters track `perQuestionResults` even when the two disagree,
 * empty-state accuracy is 0 (never NaN), timed/normal stay segregated, the
 * serialized write can't drop a concurrent round, and — the design contract —
 * the module imports NOTHING sync/Firestore-shaped.
 */
import fs from 'fs';
import path from 'path';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QUIZ_STATS_KEY,
  QUIZ_STATS_SCHEMA_VERSION,
  emptyQuizStats,
  parseQuizStats,
  serializeQuizStats,
  applyRoundResult,
  summarizeQuizStats,
  accuracyPct,
  getQuizStats,
  recordRoundResult,
  type QuizQuestionOutcome,
  type QuizRoundResult,
} from '../src/features/quiz/quizStatsStore';

const q = (
  type: QuizRoundResult['perQuestionResults'][number]['type'],
  correct: boolean,
): QuizQuestionOutcome => ({type, correct});

const round = (over: Partial<QuizRoundResult> = {}): QuizRoundResult => {
  const perQuestionResults = over.perQuestionResults ?? [];
  return {
    score: over.score ?? perQuestionResults.filter(r => r.correct).length,
    total: over.total ?? perQuestionResults.length,
    perQuestionResults,
    timedMode: over.timedMode ?? false,
  };
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('parseQuizStats (defensive)', () => {
  it('returns a fresh empty snapshot for null / non-JSON / non-object', () => {
    const empty = emptyQuizStats();
    expect(parseQuizStats(null)).toEqual(empty);
    expect(parseQuizStats('{not json')).toEqual(empty);
    expect(parseQuizStats('"a string"')).toEqual(empty);
    expect(parseQuizStats('42')).toEqual(empty);
  });

  it('merges a partial blob over defaults (missing keys stay valid)', () => {
    const parsed = parseQuizStats(JSON.stringify({roundsPlayed: 3}));
    expect(parsed.roundsPlayed).toBe(3);
    expect(parsed.questionsAnswered).toBe(0);
    expect(parsed.version).toBe(QUIZ_STATS_SCHEMA_VERSION);
    // every type record is still present
    expect(parsed.byType['event-order']).toEqual({answered: 0, correct: 0});
    expect(parsed.timed).toEqual({answered: 0, correct: 0, rounds: 0});
  });

  it('clamps bad numbers and caps correct at answered', () => {
    const parsed = parseQuizStats(
      JSON.stringify({
        roundsPlayed: -5, // negative → 0
        questionsAnswered: 'x', // non-number → 0
        byType: {'who-said-it': {answered: 2, correct: 9}}, // correct capped
      }),
    );
    expect(parsed.roundsPlayed).toBe(0);
    expect(parsed.questionsAnswered).toBe(0);
    expect(parsed.byType['who-said-it']).toEqual({answered: 2, correct: 2});
  });

  it('round-trips an applied snapshot through serialize/parse', () => {
    const snap = applyRoundResult(
      emptyQuizStats(),
      round({
        perQuestionResults: [q('who-said-it', true), q('event-order', false)],
      }),
      1_700_000_000_000,
    );
    expect(parseQuizStats(serializeQuizStats(snap))).toEqual(snap);
  });
});

describe('applyRoundResult / recordRoundResult (counters)', () => {
  it('records one round: updates every counter and persists', async () => {
    const result = round({
      score: 3,
      total: 4,
      perQuestionResults: [
        q('who-said-it', true),
        q('who-said-it', false),
        q('complete-verse', true),
        q('ref-to-content', true),
      ],
    });

    const snap = await recordRoundResult(result, 1_700_000_000_000);

    expect(snap.roundsPlayed).toBe(1);
    expect(snap.questionsAnswered).toBe(4);
    expect(snap.correctAnswers).toBe(3);
    expect(snap.bestRoundScore).toBe(3);
    expect(snap.lastPlayedAt).toBe(1_700_000_000_000);
    expect(snap.byType['who-said-it']).toEqual({answered: 2, correct: 1});
    expect(snap.byType['complete-verse']).toEqual({answered: 1, correct: 1});
    expect(snap.normal).toEqual({answered: 4, correct: 3, rounds: 1});
    expect(snap.timed).toEqual({answered: 0, correct: 0, rounds: 0});

    // persisted under the versioned key and readable back
    expect(await AsyncStorage.getItem(QUIZ_STATS_KEY)).toBe(
      serializeQuizStats(snap),
    );
    expect(await getQuizStats()).toEqual(snap);
  });

  it('per-type accuracy accumulates correctly across several rounds', () => {
    let s = emptyQuizStats();
    s = applyRoundResult(
      s,
      round({
        perQuestionResults: [
          q('who-said-it', true),
          q('who-said-it', false),
          q('complete-verse', true),
        ],
      }),
    );
    s = applyRoundResult(
      s,
      round({
        perQuestionResults: [
          q('who-said-it', true),
          q('complete-verse', false),
        ],
      }),
    );

    const view = summarizeQuizStats(s);
    // who-said-it: 2/3, complete-verse: 1/2
    expect(view.byType['who-said-it']).toMatchObject({answered: 3, correct: 2});
    expect(view.byType['who-said-it'].accuracy).toBeCloseTo(66.6667, 3);
    expect(view.byType['complete-verse'].accuracy).toBe(50);
    // overall: 3 correct of 5 answered
    expect(view.overallAccuracy).toBe(60);
    expect(view.roundsPlayed).toBe(2);
  });

  it('best-round tracks score (clamped) even when score != correct-count', () => {
    // score (5) intentionally disagrees with the 2 correct outcomes.
    let s = applyRoundResult(
      emptyQuizStats(),
      round({
        score: 5,
        total: 6,
        perQuestionResults: [
          q('who-said-it', true),
          q('who-said-it', false),
          q('complete-verse', false),
          q('complete-verse', false),
          q('ref-to-content', true),
          q('event-order', false),
        ],
      }),
    );
    expect(s.bestRoundScore).toBe(5); // from score
    expect(s.correctAnswers).toBe(2); // from perQuestionResults
    expect(s.questionsAnswered).toBe(6);

    // a weaker round doesn't lower the best
    s = applyRoundResult(
      s,
      round({score: 3, total: 6, perQuestionResults: []}),
    );
    expect(s.bestRoundScore).toBe(5);

    // an out-of-range score is clamped to the round size (total)
    const clamped = applyRoundResult(
      emptyQuizStats(),
      round({score: 99, total: 8, perQuestionResults: []}),
    );
    expect(clamped.bestRoundScore).toBe(8);
  });

  it('ignores unknown question types without corrupting totals', () => {
    const s = applyRoundResult(
      emptyQuizStats(),
      round({
        // @ts-expect-error — deliberately malformed type to prove the guard
        perQuestionResults: [q('who-said-it', true), q('bogus-type', true)],
      }),
    );
    expect(s.questionsAnswered).toBe(2); // both counted in totals
    expect(s.byType['who-said-it']).toEqual({answered: 1, correct: 1});
    // no rogue key added
    expect(Object.keys(s.byType).sort()).toEqual([
      'complete-verse',
      'event-order',
      'ref-to-content',
      'who-said-it',
    ]);
  });
});

describe('summarizeQuizStats (derived accuracy)', () => {
  it('is 0 everywhere (never NaN) for an empty snapshot', () => {
    const v = summarizeQuizStats(emptyQuizStats());
    const percents = [
      v.overallAccuracy,
      v.timed.accuracy,
      v.normal.accuracy,
      ...Object.values(v.byType).map(t => t.accuracy),
    ];
    for (const p of percents) {
      expect(p).toBe(0);
      expect(Number.isNaN(p)).toBe(false);
    }
  });

  it('accuracyPct guards divide-by-zero', () => {
    expect(accuracyPct(0, 0)).toBe(0);
    expect(accuracyPct(3, 4)).toBe(75);
  });
});

describe('timed vs normal segregation', () => {
  it('keeps timed and normal tallies separate', async () => {
    await recordRoundResult(
      round({
        timedMode: true,
        perQuestionResults: [q('who-said-it', true), q('who-said-it', true)],
      }),
    );
    await recordRoundResult(
      round({
        timedMode: false,
        perQuestionResults: [q('complete-verse', false)],
      }),
    );

    const view = summarizeQuizStats(await getQuizStats());
    expect(view.timed).toMatchObject({answered: 2, correct: 2, rounds: 1});
    expect(view.timed.accuracy).toBe(100);
    expect(view.normal).toMatchObject({answered: 1, correct: 0, rounds: 1});
    expect(view.normal.accuracy).toBe(0);
    expect(view.roundsPlayed).toBe(2);
  });
});

describe('serialized writes', () => {
  it('does not drop a concurrent round', async () => {
    const r = round({
      perQuestionResults: [
        q('who-said-it', true),
        q('complete-verse', true),
        q('ref-to-content', false),
        q('event-order', true),
      ],
    });
    await Promise.all([recordRoundResult(r), recordRoundResult(r)]);
    const snap = await getQuizStats();
    expect(snap.roundsPlayed).toBe(2);
    expect(snap.questionsAnswered).toBe(8);
    expect(snap.correctAnswers).toBe(6);
  });
});

describe('device-local contract (no sync / Firestore imports)', () => {
  const SRC = fs.readFileSync(
    path.join(__dirname, '../src/features/quiz/quizStatsStore.ts'),
    'utf8',
  );

  /** Every module specifier in `from '…'` / `require('…')` — imports only. */
  const importSpecifiers = (src: string): string[] => {
    const specs: string[] = [];
    const re = /(?:\bfrom\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) specs.push(m[1]);
    return specs;
  };

  it('imports nothing Firestore/Firebase or from the sync engine', () => {
    const specs = importSpecifiers(SRC);
    expect(specs.length).toBeGreaterThan(0);

    const offenders = specs.filter(
      s =>
        /firebase|firestore/i.test(s) ||
        // the project's SyncEngine/queueWrite live under a `sync` path
        // segment; a segment match avoids the "aSYNC-storage" false positive.
        s.split(/[/\\]/).includes('sync'),
    );
    expect(offenders).toEqual([]);

    // positive control: it DOES use async-storage, which must not be flagged.
    expect(specs).toContain('@react-native-async-storage/async-storage');
  });
});
