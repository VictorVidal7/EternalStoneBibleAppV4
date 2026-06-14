/**
 * Emotional check-in history (Sprint 80) — the pure model.
 *
 * One feeling per LOCAL day, last write wins: tapping "Ansioso" in the
 * morning and "Agradecido" at night keeps the evening's word — the log reads
 * as "how the day ended", not a minute-by-minute diary. Privacy-first: the
 * log never leaves the device (the [[listeningStats]] rule) and retention is
 * BOUNDED — entries older than {@link FEELINGS_RETENTION_DAYS} fall off on
 * every write, so the store can't grow unboundedly.
 *
 * Day SHIFTS go through setDate (the S78 DST rule); date keys are LOCAL
 * `YYYY-MM-DD`, so lexicographic comparison is chronological by construction.
 *
 * Storage-free mirror of [[listeningStats]]; AsyncStorage I/O lives in
 * [[feelingsLogStore]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {isBrightFeeling} from './feelings';

/** dateKey (local YYYY-MM-DD) → feelingId for that day. */
export interface FeelingsLog {
  days: Record<string, string>;
}

/** 12 weeks of history — enough for a quarter's mood line, small forever. */
export const FEELINGS_RETENTION_DAYS = 84;

/** Local-day key for a timestamp (the listeningStats key format). */
export function feelingsDateKey(now: number): string {
  const d = new Date(now);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function emptyFeelingsLog(): FeelingsLog {
  return {days: {}};
}

/** Defensively parse a raw storage blob (malformed anything → empty log). */
export function parseFeelingsLog(raw: string | null): FeelingsLog {
  if (!raw) return emptyFeelingsLog();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return emptyFeelingsLog();
    }
    const days = (parsed as {days?: unknown}).days;
    if (typeof days !== 'object' || days === null) return emptyFeelingsLog();
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key) && typeof value === 'string') {
        clean[key] = value;
      }
    }
    return {days: clean};
  } catch {
    return emptyFeelingsLog();
  }
}

export function serializeFeelingsLog(log: FeelingsLog): string {
  return JSON.stringify(log);
}

/**
 * Record the day's feeling (last write wins) and prune anything that fell
 * out of the retention window relative to `now`. Pure — returns a new log.
 */
export function recordFeeling(
  log: FeelingsLog,
  feelingId: string,
  now: number,
): FeelingsLog {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (FEELINGS_RETENTION_DAYS - 1));
  const cutoffKey = feelingsDateKey(cutoff.getTime());
  const days: Record<string, string> = {};
  for (const [key, value] of Object.entries(log.days)) {
    if (key >= cutoffKey) days[key] = value;
  }
  days[feelingsDateKey(now)] = feelingId;
  return {days};
}

/** One slot of the 7-day mood line (oldest → today). */
export interface MoodDay {
  dateKey: string;
  /** The day's recorded feeling, or null when none was checked in. */
  feelingId: string | null;
  isToday: boolean;
  /** Local weekday index, 0 = Sunday (for initials). */
  weekday: number;
}

/** The last 7 LOCAL days of the log (setDate shifts — DST-safe). */
export function weekMood(log: FeelingsLog, now: number): MoodDay[] {
  const days: MoodDay[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    const dateKey = feelingsDateKey(d.getTime());
    days.push({
      dateKey,
      feelingId: log.days[dateKey] ?? null,
      isToday: offset === 0,
      weekday: d.getDay(),
    });
  }
  return days;
}

/** Honest gate: hide the mood line until any check-in exists in the window. */
export function hasAnyMood(days: MoodDay[]): boolean {
  return days.some(day => day.feelingId !== null);
}

/**
 * The representative feeling among a set of day keys (Sprint 81): the LAST
 * recorded one, extending the store's last-wins day semantics to any window
 * ("how the week ended"). Keys are local `YYYY-MM-DD`, so the lexicographic
 * max IS the latest day. Null when none of the keys has a check-in.
 *
 * Powers the mood strip under the activity heatmap: the screen passes each
 * heatmap week-column's day keys, so the strip aligns with the grid BY
 * CONSTRUCTION (same cells, same chunking — retention 84d = the heatmap's
 * 12-week window).
 */
export function moodForDateKeys(
  log: FeelingsLog,
  dateKeys: ReadonlyArray<string>,
): string | null {
  let bestKey: string | null = null;
  let bestFeeling: string | null = null;
  for (const key of dateKeys) {
    const feeling = log.days[key];
    if (feeling === undefined) continue;
    if (bestKey === null || key > bestKey) {
      bestKey = key;
      bestFeeling = feeling;
    }
  }
  return bestFeeling;
}

/** A rolling-month emotional summary (Sprint 82) — "Tu mes emocional". */
export interface MoodMonthSummary {
  /** Length of the window walked, in days. */
  windowDays: number;
  /** How many of those days carry a check-in. */
  daysLogged: number;
  /** Per-feeling tallies, richest first (count-ties → the more recently felt). */
  counts: {feelingId: string; count: number}[];
  /** The month's defining feeling — `counts[0]`, or null when nothing logged. */
  dominant: string | null;
}

/** Default window for the monthly mood summary — a rolling 30 local days. */
export const MOOD_MONTH_DAYS = 30;

/**
 * Tally the feelings checked in over the last `windowDays` LOCAL days (Sprint
 * 82). Day walks use setDate (DST-safe, the S78 rule). Pure; `dominant` is null
 * until at least one day is logged. Both the dominant feeling and the
 * distribution break count-ties toward the MORE RECENTLY felt one — matching
 * the store's last-wins philosophy — so the dominant is always the head of
 * `counts`.
 */
export function monthMood(
  log: FeelingsLog,
  now: number,
  windowDays: number = MOOD_MONTH_DAYS,
): MoodMonthSummary {
  const tally = new Map<string, {count: number; lastKey: string}>();
  let daysLogged = 0;
  for (let offset = windowDays - 1; offset >= 0; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    const key = feelingsDateKey(d.getTime());
    const feeling = log.days[key];
    if (feeling === undefined) continue;
    daysLogged++;
    const prev = tally.get(feeling);
    // We iterate oldest → newest, so the last write holds the latest key.
    tally.set(feeling, {count: (prev?.count ?? 0) + 1, lastKey: key});
  }
  const counts = [...tally.entries()]
    .map(([feelingId, v]) => ({feelingId, count: v.count, lastKey: v.lastKey}))
    .sort((a, b) => b.count - a.count || (a.lastKey < b.lastKey ? 1 : -1))
    .map(({feelingId, count}) => ({feelingId, count}));
  return {
    windowDays,
    daysLogged,
    counts,
    dominant: counts.length ? counts[0].feelingId : null,
  };
}

/** How one feeling moved between the current and the previous month window. */
export interface FeelingTrend {
  feelingId: string;
  /** Days felt in the recent window. */
  current: number;
  /** Days felt in the window before that. */
  previous: number;
  /** current − previous (positive = felt more often lately). */
  delta: number;
}

/** The overall emotional direction across the two windows. */
export type MoodDirection = 'lighter' | 'steady' | 'heavier';

/** A month-vs-month emotional trend (Sprint 83) — "Tu tendencia emocional". */
export interface MoodTrendSummary {
  /** Length of each window, in days (both windows are this long). */
  windowDays: number;
  /** The recent window's full summary (reuses {@link monthMood}). */
  current: MoodMonthSummary;
  daysLoggedCurrent: number;
  daysLoggedPrevious: number;
  /** Only meaningful when BOTH windows carry a check-in. */
  hasComparison: boolean;
  /** Feelings felt MORE than last window, steepest rise first. */
  rising: FeelingTrend[];
  /** Feelings felt LESS than last window, steepest drop first. */
  easing: FeelingTrend[];
  /** Net valence shift: a rise in bright feelings (or easing of the heavier
   *  ones) reads as `lighter`; the reverse as `heavier`; no net change as
   *  `steady`. Always `steady` when there is no comparison. */
  direction: MoodDirection;
}

/**
 * Compare the last `windowDays` LOCAL days against the `windowDays` before them
 * (Sprint 83). The two windows are contiguous and non-overlapping by
 * construction (the previous window is anchored `windowDays` back via setDate,
 * the S78 DST rule). Pure; both `rising`/`easing` exclude unchanged feelings
 * and break delta-ties alphabetically for a deterministic order. `direction`
 * weights each feeling's delta by its valence ({@link isBrightFeeling}).
 */
export function moodTrend(
  log: FeelingsLog,
  now: number,
  windowDays: number = MOOD_MONTH_DAYS,
): MoodTrendSummary {
  const current = monthMood(log, now, windowDays);
  const prevAnchor = new Date(now);
  prevAnchor.setDate(prevAnchor.getDate() - windowDays);
  const previous = monthMood(log, prevAnchor.getTime(), windowDays);

  const currentMap = new Map(current.counts.map(c => [c.feelingId, c.count]));
  const previousMap = new Map(previous.counts.map(c => [c.feelingId, c.count]));
  const allIds = new Set([...currentMap.keys(), ...previousMap.keys()]);

  const trends: FeelingTrend[] = [...allIds].map(feelingId => {
    const cur = currentMap.get(feelingId) ?? 0;
    const prev = previousMap.get(feelingId) ?? 0;
    return {feelingId, current: cur, previous: prev, delta: cur - prev};
  });

  const byDeltaDesc = (a: FeelingTrend, b: FeelingTrend) =>
    b.delta - a.delta || (a.feelingId < b.feelingId ? -1 : 1);
  const rising = trends.filter(t => t.delta > 0).sort(byDeltaDesc);
  const easing = trends
    .filter(t => t.delta < 0)
    .sort((a, b) => -byDeltaDesc(a, b));

  const hasComparison = current.daysLogged > 0 && previous.daysLogged > 0;
  let net = 0;
  for (const t of trends)
    net += isBrightFeeling(t.feelingId) ? t.delta : -t.delta;
  const direction: MoodDirection =
    !hasComparison || net === 0 ? 'steady' : net > 0 ? 'lighter' : 'heavier';

  return {
    windowDays,
    current,
    daysLoggedCurrent: current.daysLogged,
    daysLoggedPrevious: previous.daysLogged,
    hasComparison,
    rising,
    easing,
    direction,
  };
}
