/**
 * 📊 QUIZ STATS STORE — device-local extended statistics for the "Quiz
 * bíblico" (T18b premium layer).
 *
 * Persists a single rolling snapshot of quiz performance to AsyncStorage,
 * updated once per FINISHED round (not per question). Kept React-free and
 * separate from any pure model, mirroring [[prayerStore]] /
 * [[listeningStatsStore]] / [[playbackPositionStore]]: parsing is defensive
 * (a malformed / partial / corrupt blob is coerced back to a complete, valid
 * snapshot, never crashes) and writes go through a single serialized queue so
 * two round-completions can't race a read-modify-write and drop one.
 *
 * ⛔️ NOT SYNCED — 100% device-local by design. This module deliberately has
 * ZERO imports of Firestore, `@react-native-firebase`, or the project's
 * SyncEngine / queueWrite. The app shares one free Firestore (Spark) daily
 * quota across ALL users, and there is a standing project rule to add no new
 * cloud writes; extended quiz stats are a per-device convenience, never
 * reconciled across devices. (`quizStatsStore.test.ts` guards this by
 * asserting the module imports nothing sync/Firebase-shaped.)
 *
 * Accuracy percentages are DERIVED on read via {@link summarizeQuizStats},
 * never stored — storing computed floats invites drift as counters change.
 *
 * i18n note: this module builds NO UI. When the integrator wires the stats
 * screen, the assumed (not-yet-created) keys are e.g. `t.quiz.stats.title`,
 * `t.quiz.stats.roundsPlayed`, `t.quiz.stats.accuracy`,
 * `t.quiz.stats.bestRound`, `t.quiz.stats.byType.<type>`,
 * `t.quiz.stats.timed` / `t.quiz.stats.normal` — added in translations.ts
 * separately, NOT here.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {type QuizQuestionType} from './quizBank';

/** AsyncStorage key — `@snake_case_vN`, matching the repo's store convention. */
export const QUIZ_STATS_KEY = '@quiz_stats_v1';

/** Bump when the persisted shape changes in a non-additive way. */
export const QUIZ_STATS_SCHEMA_VERSION = 1;

/** The four question types, as a runtime list (quizBank exports only the union). */
const QUIZ_QUESTION_TYPES: readonly QuizQuestionType[] = [
  'who-said-it',
  'complete-verse',
  'ref-to-content',
  'event-order',
];

// ── Input: the result of ONE finished round ────────────────────────────────

/** One answered question's outcome within a round. */
export interface QuizQuestionOutcome {
  type: QuizQuestionType;
  correct: boolean;
}

/**
 * The outcome of a single COMPLETED quiz round, recorded once when the round
 * ends (see `app/features/quiz/index.tsx`'s round-complete state).
 *
 * `perQuestionResults` is the authoritative source for every accuracy counter
 * (totals + per-type + per-mode). `score` is the headline correct-count the
 * player saw and feeds only {@link QuizStats.bestRoundScore} (clamped to the
 * round size); if `score` and the correct-count derived from
 * `perQuestionResults` ever disagree, they stay on their own axes and never
 * corrupt each other.
 */
export interface QuizRoundResult {
  /** Headline correct-count shown to the player (drives best-round only). */
  score: number;
  /** Questions in the round (== `perQuestionResults.length` in practice). */
  total: number;
  /** One entry per answered question, in play order. */
  perQuestionResults: QuizQuestionOutcome[];
  /** True when the round was played in timed ("cronometrado") mode. */
  timedMode: boolean;
}

// ── Persisted snapshot: raw counters only (accuracy derived on read) ────────

/** answered / correct tally for one question type. */
export interface QuizTally {
  answered: number;
  correct: number;
}

/** A mode's tally, plus how many whole rounds were played in that mode. */
export interface QuizModeTally extends QuizTally {
  rounds: number;
}

/** The persisted extended-stats snapshot (raw counters; no stored %). */
export interface QuizStats {
  /** Schema version of the persisted blob. */
  version: number;
  /** Total completed rounds. */
  roundsPlayed: number;
  /** Total questions answered across all rounds. */
  questionsAnswered: number;
  /** Total correct answers across all rounds. */
  correctAnswers: number;
  /** Best single-round score ever (max `score`, clamped to the round size). */
  bestRoundScore: number;
  /** Per-type answered/correct tallies (all four types always present). */
  byType: Record<QuizQuestionType, QuizTally>;
  /** Timed-mode ("cronometrado") tally, tracked separately from normal. */
  timed: QuizModeTally;
  /** Normal-mode tally, tracked separately from timed. */
  normal: QuizModeTally;
  /** Epoch ms of the most recent recorded round (0 if never played). */
  lastPlayedAt: number;
}

// ── Derived view: accuracy %s computed on read (never stored) ───────────────

/** A type's tally with its derived accuracy (0-100, 0 when answered === 0). */
export interface QuizTypeSummary extends QuizTally {
  type: QuizQuestionType;
  accuracy: number;
}

/** A mode's tally with its derived accuracy. */
export interface QuizModeSummary extends QuizModeTally {
  accuracy: number;
}

/**
 * Fully-derived, display-ready view of {@link QuizStats}. This — not the raw
 * snapshot — is what a stats UI should render; every accuracy field is a
 * percentage in [0, 100] (0 when nothing was answered, never `NaN`), NOT
 * rounded, so the UI can format as it likes.
 */
export interface QuizStatsSummary {
  roundsPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
  bestRoundScore: number;
  /** Global accuracy % across every answered question. */
  overallAccuracy: number;
  byType: Record<QuizQuestionType, QuizTypeSummary>;
  timed: QuizModeSummary;
  normal: QuizModeSummary;
  lastPlayedAt: number;
}

// ── Coercion helpers (defensive parse) ──────────────────────────────────────

/** A finite, non-negative integer, or 0. */
function coerceCount(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0
    ? Math.floor(x)
    : 0;
}

/** Clamp `x` into `[min, max]` as a finite integer (min if unusable). */
function clampInt(x: unknown, min: number, max: number): number {
  const n = typeof x === 'number' && Number.isFinite(x) ? Math.floor(x) : min;
  return Math.min(max, Math.max(min, n));
}

/** Coerce a raw value into a valid tally (`correct` never exceeds `answered`). */
function coerceTally(raw: unknown): QuizTally {
  if (typeof raw !== 'object' || raw === null) return {answered: 0, correct: 0};
  const o = raw as Record<string, unknown>;
  const answered = coerceCount(o.answered);
  const correct = Math.min(coerceCount(o.correct), answered);
  return {answered, correct};
}

/** Coerce a raw value into a valid mode tally. */
function coerceModeTally(raw: unknown): QuizModeTally {
  const rounds =
    typeof raw === 'object' && raw !== null
      ? coerceCount((raw as Record<string, unknown>).rounds)
      : 0;
  return {...coerceTally(raw), rounds};
}

/** A brand-new, all-zero snapshot. */
export function emptyQuizStats(): QuizStats {
  return {
    version: QUIZ_STATS_SCHEMA_VERSION,
    roundsPlayed: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    bestRoundScore: 0,
    byType: {
      'who-said-it': {answered: 0, correct: 0},
      'complete-verse': {answered: 0, correct: 0},
      'ref-to-content': {answered: 0, correct: 0},
      'event-order': {answered: 0, correct: 0},
    },
    timed: {answered: 0, correct: 0, rounds: 0},
    normal: {answered: 0, correct: 0, rounds: 0},
    lastPlayedAt: 0,
  };
}

/** Deep-enough clone so a pure reducer never mutates its input. */
function cloneStats(s: QuizStats): QuizStats {
  return {
    ...s,
    byType: {
      'who-said-it': {...s.byType['who-said-it']},
      'complete-verse': {...s.byType['complete-verse']},
      'ref-to-content': {...s.byType['ref-to-content']},
      'event-order': {...s.byType['event-order']},
    },
    timed: {...s.timed},
    normal: {...s.normal},
  };
}

/**
 * Parse a raw storage blob into a COMPLETE, valid snapshot. Every field is
 * merged over {@link emptyQuizStats} defaults and clamped (finite, ≥ 0, and
 * `correct ≤ answered`), so a missing key, a corrupt number, or non-JSON all
 * yield a usable snapshot rather than crashing (the S90 defensive-parse rule).
 */
export function parseQuizStats(raw: string | null): QuizStats {
  const base = emptyQuizStats();
  if (!raw) return base;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return base;
  }
  if (typeof parsed !== 'object' || parsed === null) return base;
  const o = parsed as Record<string, unknown>;

  base.roundsPlayed = coerceCount(o.roundsPlayed);
  base.questionsAnswered = coerceCount(o.questionsAnswered);
  base.correctAnswers = coerceCount(o.correctAnswers);
  base.bestRoundScore = coerceCount(o.bestRoundScore);
  base.lastPlayedAt = coerceCount(o.lastPlayedAt);

  if (typeof o.byType === 'object' && o.byType !== null) {
    const byType = o.byType as Record<string, unknown>;
    for (const type of QUIZ_QUESTION_TYPES) {
      base.byType[type] = coerceTally(byType[type]);
    }
  }
  base.timed = coerceModeTally(o.timed);
  base.normal = coerceModeTally(o.normal);

  return base;
}

/** Serialize a snapshot for storage. */
export function serializeQuizStats(stats: QuizStats): string {
  return JSON.stringify(stats);
}

/**
 * Fold one finished round into the snapshot (PURE — returns a new snapshot,
 * never mutates `stats`). Per-question/per-mode/global counters all come from
 * `perQuestionResults`; `bestRoundScore` tracks `result.score` (clamped to the
 * round size). Unknown question types in the payload are ignored defensively.
 */
export function applyRoundResult(
  stats: QuizStats,
  result: QuizRoundResult,
  now: number = Date.now(),
): QuizStats {
  const next = cloneStats(stats);
  const outcomes = Array.isArray(result.perQuestionResults)
    ? result.perQuestionResults
    : [];
  const answered = outcomes.length;
  const correct = outcomes.reduce((n, o) => (o && o.correct ? n + 1 : n), 0);

  next.roundsPlayed += 1;
  next.questionsAnswered += answered;
  next.correctAnswers += correct;

  const roundSize = Math.max(answered, coerceCount(result.total));
  const roundScore = clampInt(result.score, 0, roundSize);
  if (roundScore > next.bestRoundScore) next.bestRoundScore = roundScore;

  for (const o of outcomes) {
    const tally = o ? next.byType[o.type] : undefined;
    if (!tally) continue; // unknown/absent type — ignore, don't corrupt totals
    tally.answered += 1;
    if (o.correct) tally.correct += 1;
  }

  const mode = result.timedMode ? next.timed : next.normal;
  mode.rounds += 1;
  mode.answered += answered;
  mode.correct += correct;

  const ts = coerceCount(now);
  if (ts > 0) next.lastPlayedAt = ts;

  return next;
}

/** Accuracy as a percentage in [0, 100]; 0 (not NaN) when `answered === 0`. */
export function accuracyPct(correct: number, answered: number): number {
  return answered > 0 ? (correct / answered) * 100 : 0;
}

function summarizeMode(m: QuizModeTally): QuizModeSummary {
  return {...m, accuracy: accuracyPct(m.correct, m.answered)};
}

/**
 * Derive the display-ready view (all accuracy %s) from a raw snapshot. Pure;
 * safe to call in a `useMemo`. Percentages are unrounded [0, 100], 0 when the
 * relevant tally is empty.
 */
export function summarizeQuizStats(stats: QuizStats): QuizStatsSummary {
  const byType = {} as Record<QuizQuestionType, QuizTypeSummary>;
  for (const type of QUIZ_QUESTION_TYPES) {
    const t = stats.byType[type];
    byType[type] = {
      type,
      answered: t.answered,
      correct: t.correct,
      accuracy: accuracyPct(t.correct, t.answered),
    };
  }
  return {
    roundsPlayed: stats.roundsPlayed,
    questionsAnswered: stats.questionsAnswered,
    correctAnswers: stats.correctAnswers,
    bestRoundScore: stats.bestRoundScore,
    overallAccuracy: accuracyPct(stats.correctAnswers, stats.questionsAnswered),
    byType,
    timed: summarizeMode(stats.timed),
    normal: summarizeMode(stats.normal),
    lastPlayedAt: stats.lastPlayedAt,
  };
}

// ── AsyncStorage I/O ────────────────────────────────────────────────────────

/** Read the persisted snapshot (empty snapshot if none / corrupt). */
export async function getQuizStats(): Promise<QuizStats> {
  try {
    const raw = await AsyncStorage.getItem(QUIZ_STATS_KEY);
    return parseQuizStats(raw);
  } catch (error) {
    logger.warn('Failed to read quiz stats', {error: String(error)});
    return emptyQuizStats();
  }
}

// One pending tail keeps every read-modify-write in order.
let writeQueue: Promise<QuizStats> = Promise.resolve(emptyQuizStats());

/**
 * Record ONE finished round and return the new persisted snapshot. The
 * read-modify-write is serialized through {@link writeQueue} so two rounds
 * completing back-to-back can't drop an update. On failure the previous
 * snapshot is returned and the error logged (the chain never rejects).
 */
export function recordRoundResult(
  result: QuizRoundResult,
  now: number = Date.now(),
): Promise<QuizStats> {
  const run = async (): Promise<QuizStats> => {
    const raw = await AsyncStorage.getItem(QUIZ_STATS_KEY);
    const next = applyRoundResult(parseQuizStats(raw), result, now);
    await AsyncStorage.setItem(QUIZ_STATS_KEY, serializeQuizStats(next));
    return next;
  };
  const applied = writeQueue.then(run);
  // The queue tail must never reject; swallow + log, keep the chain alive.
  writeQueue = applied.catch(async error => {
    logger.warn('Failed to record quiz round result', {error: String(error)});
    return getQuizStats();
  });
  return writeQueue;
}
